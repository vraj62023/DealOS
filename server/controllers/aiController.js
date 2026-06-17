const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Company = require('../models/Company');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const cleanJsonResponse = (text) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Failed to parse AI response as JSON:", text);
        return null;
    }
};

const REQUIRED_FIELDS = [
    'companyName', 'industry', 'incorporationYear', 'companyProfile', 
    'FY24_Revenue', 'FY25_Revenue', 'FY26_Provisional', 
    'existingDebt', 'fundingAmount', 'facilityType'
];

// @desc    Process chat message, extract entity data, and simulate PROBE search
const runProbeSearch = async (req, res) => {
    try {
        const { message } = req.body;
        const companyId = req.user.companyId;

        // FIX #3: Guard against null company
        const currentCompany = await Company.findById(companyId);
        if (!currentCompany) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        // Compute current missing for the prompt context
        let currentMissing = REQUIRED_FIELDS.filter(field => {
            if (field === 'fundingAmount' || field === 'facilityType') {
                return !currentCompany.fundingRequirement || !currentCompany.fundingRequirement[field === 'fundingAmount' ? 'amountRequired' : 'facilityType'];
            }
            if (['FY24_Revenue','FY25_Revenue','FY26_Provisional'].includes(field)) {
                const year = field.replace('_Revenue','').replace('_Provisional','');
                return !currentCompany.financials?.some(f => f.year === year);
            }
            if (field === 'existingDebt') return !currentCompany.existingDebt || currentCompany.existingDebt.length === 0;
            return !currentCompany[field] || currentCompany[field].length === 0;
        });

        const prompt = `
            You are the PROBE data extraction engine for a B2B debt platform.
            Analyze this user message: "${message}"
            
            Extract ANY of the following fields if they are mentioned:
            [${REQUIRED_FIELDS.join(', ')}]
            
            Return ONLY a valid JSON object with this exact structure:
            {
                "extractedData": {
                    "companyName": "string or null",
                    "industry": "string or null",
                    "incorporationYear": "string or null",
                    "fundingAmount": "number or null",
                    "facilityType": "string or null"
                },
                "botReply": "A short, professional response confirming updates and asking for 1 or 2 items from this missing list: [${currentMissing.join(', ')}]."
            }
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = cleanJsonResponse(result.response.text());

        if (!aiResponse) return res.status(500).json({ message: 'AI failed to process the request' });

        // Prepare Database Updates
        const updateData = {};
        const ext = aiResponse.extractedData;
        
        if (ext.companyName) updateData.companyName = ext.companyName;
        if (ext.industry) updateData.industry = ext.industry;
        if (ext.incorporationYear) updateData.incorporationYear = ext.incorporationYear;
        
        if (ext.fundingAmount || ext.facilityType) {
            updateData.fundingRequirement = currentCompany.fundingRequirement || {};
            if (ext.fundingAmount) updateData.fundingRequirement.amountRequired = ext.fundingAmount;
            if (ext.facilityType) updateData.fundingRequirement.facilityType = ext.facilityType;
        }

        // Apply the AI extracted data first
        await Company.findByIdAndUpdate(companyId, { $set: updateData });

        // FIX #1: The Source of Truth Recomputation
        const freshCompany = await Company.findById(companyId);
        const updatedMissingFields = REQUIRED_FIELDS.filter(field => {
            if (field === 'fundingAmount') return !freshCompany.fundingRequirement?.amountRequired;
            if (field === 'facilityType') return !freshCompany.fundingRequirement?.facilityType;
            if (field === 'existingDebt') return !freshCompany.existingDebt?.length;
            if (['FY24_Revenue','FY25_Revenue','FY26_Provisional'].includes(field)) {
                const year = field.replace('_Revenue','').replace('_Provisional','');
                return !freshCompany.financials?.some(f => f.year === year);
            }
            return !freshCompany[field] || freshCompany[field].length === 0;
        });

        // Final safe update of the true missing fields
        const finalCompany = await Company.findByIdAndUpdate(
            companyId, 
            { $set: { missingFields: updatedMissingFields } },
            { new: true }
        );

        res.status(200).json({
            reply: aiResponse.botReply,
            company: finalCompany
        });

    } catch (error) {
        console.error("PROBE Search Error:", error);
        res.status(500).json({ message: 'Server error during AI extraction' });
    }
};

// @desc    Read a document URL (PDF/Image), extract financials, and update DB
const extractDocumentData = async (req, res) => {
    try {
        const { fileUrl, category } = req.body;
        const companyId = req.user.companyId;

        // FIX #4: Guard against SSRF (Server-Side Request Forgery)
        try {
            const urlObj = new URL(fileUrl);
            const ALLOWED_DOMAIN = process.env.CLOUDINARY_DOMAIN || 'res.cloudinary.com';
            if (!urlObj.hostname.endsWith(ALLOWED_DOMAIN)) {
                return res.status(400).json({ message: 'Invalid file source domain' });
            }
        } catch (e) {
            return res.status(400).json({ message: 'Malformed file URL' });
        }

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const mimeType = fileUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        const filePart = {
            inlineData: { data: Buffer.from(response.data).toString("base64"), mimeType }
        };

        // ... [Rest of your existing extraction and $pull logic remains the same here] ...
        let prompt = `Analyze this document. `;
        if (category === 'Debt Schedule and Sanction Letters') {
            prompt += `Extract any existing loan details. Return JSON: { "existingDebt": [{ "lenderName": "string", "sanctionedAmount": number, "outstandingAmount": number }] }`;
        } else if (category === 'Audited Financials' || category === 'MIS & Provisional Financials') {
            prompt += `Extract the revenue and EBITDA. Return JSON: { "financials": [{ "year": "string (e.g., FY25)", "revenue": number, "ebitda": number }] }`;
        } else {
            prompt += `Extract a brief summary. Return JSON: { "summary": "string" }`;
        }

        const result = await model.generateContent([prompt, filePart]);
        const extractedData = cleanJsonResponse(result.response.text());

        let updatedCompany = null;
        
        if (extractedData && extractedData.financials) {
            const resolvedYears = extractedData.financials.map(f => `${f.year}_Revenue`);
            updatedCompany = await Company.findByIdAndUpdate(
                companyId,
                { 
                    $push: { financials: { $each: extractedData.financials } },
                    $pull: { missingFields: { $in: resolvedYears } }
                }, 
                { new: true }
            );
        } else if (extractedData && extractedData.existingDebt) {
            updatedCompany = await Company.findByIdAndUpdate(
                companyId,
                { 
                    $push: { existingDebt: { $each: extractedData.existingDebt } },
                    $pull: { missingFields: 'existingDebt' }
                },
                { new: true }
            );
        }

        res.status(200).json({
            message: 'Document successfully analyzed',
            extractedData,
            company: updatedCompany || await Company.findById(companyId)
        });

    } catch (error) {
        console.error("Document Extraction Error:", error);
        res.status(500).json({ message: 'Server error during document extraction' });
    }
};

module.exports = { runProbeSearch, extractDocumentData };