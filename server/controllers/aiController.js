const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Company = require('../models/Company');
const ChatMessage = require('../models/ChatMessage');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Define search model
const modelWithSearch = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }]
});
// Define standard model (no search tools)
const modelStandard = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash"
});
// Define fallback model (separate rate limit/quota)
const modelFallback = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite"
});
// Define search fallback model
const modelFallbackWithSearch = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    tools: [{ googleSearch: {} }]
});


// Smarter heuristic to decide if we should run a Google Search or keep standard chat conversational
const shouldUseSearch = (message, companyName, currentCompany) => {
    const msg = message.toLowerCase().trim();
    
    // If company is still default 'New Company', we must perform lookup
    if (!companyName || companyName === 'New Company') return true;
    
    // If the profile is completely empty (no CIN, Incorporation Year, or Registered Office),
    // we MUST run the search grounding model on the first chat to retrieve company details!
    if (currentCompany) {
        const isProfileEmpty = !currentCompany.cin && !currentCompany.incorporationYear && !currentCompany.registeredOffice;
        if (isProfileEmpty) return true;
    }
    
    // 1. Explicit search requests
    const searchKeywords = ['search', 'lookup', 'look up', 'onboard', 'website', 'fetch', 'find info', 'registry'];
    if (searchKeywords.some(keyword => msg.includes(keyword))) return true;
    
    // 2. Company suffix / descriptor matches
    const companyDescriptors = ['ltd', 'limited', 'pvt', 'private', 'llp', 'inc', 'corp', 'co.', 'group', 'services', 'energy', 'solutions', 'systems', 'technologies', 'industries', 'holdings'];
    if (companyDescriptors.some(desc => msg.includes(desc))) return true;
    
    // 3. Name declaration indicators
    if (msg.includes('my company') || msg.includes('company is') || msg.includes('name is')) return true;
    
    // 4. Exclude simple questions from search grounding
    const questionWords = ['what', 'how', 'why', 'who', 'where', 'when', 'is there', 'can you', 'explain', 'show'];
    if (questionWords.some(q => msg.startsWith(q))) return false;

    // 5. Exclude simple follow-up replies
    // If it's a number/amount (e.g. "45 cr", "45crore", "10 cr")
    const isAmountPattern = /^\d+(\s*(cr|crore|lakh|m|million|k|crores))?$/i.test(msg);
    if (isAmountPattern) return false;
    
    // If it's a simple facility type reply
    const facilityTypes = ['working capital', 'term loan', 'lap', 'loan against property', 'invoice discounting', 'letter of credit', 'lc', 'bank guarantee', 'bg', 'credit'];
    if (facilityTypes.some(t => msg === t)) return false;
    
    // If it's a very short message (1 or 2 words) and doesn't contain search indicators, don't search
    const words = msg.split(/\s+/);
    if (words.length <= 2) return false;
    
    return true;
};

// Robust JSON extraction to handle search grounding text and footnotes
const cleanJsonResponse = (text) => {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("No JSON braces found in text:", text);
            return null;
        }
        const jsonStr = text.slice(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Failed to parse AI response as JSON:", text);
        return null;
    }
};

const parseSimpleInputs = (message) => {
    const msg = message.toLowerCase().trim();
    const extracted = {};
    
    // Extract PAN
    const panMatch = msg.match(/pan\s*(?:is|:|:-)?\s*([a-z0-9]{5,15})/i);
    if (panMatch) {
        extracted.pan = panMatch[1].toUpperCase();
    } else {
        const stdPan = message.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
        if (stdPan) {
            extracted.pan = stdPan[1];
        }
    }

    // Extract CIN
    const cinMatch = msg.match(/cin\s*(?:is|:|:-)?\s*([a-z0-9]{8,25})/i);
    if (cinMatch) {
        extracted.cin = cinMatch[1].toUpperCase();
    } else {
        const stdCin = message.match(/\b([L|U][0-9]{5}[A-Z]{2}[0-9]{4}[PLTC][0-9]{6})\b/i);
        if (stdCin) {
            extracted.cin = stdCin[1].toUpperCase();
        }
    }

    // Extract Incorporation Year
    const incMatch = msg.match(/(?:incorporation|inc\b|established|est\b)\s*(?:year|in|is|:|:-)?\s*(\d{4})/i);
    if (incMatch) {
        extracted.incorporationYear = incMatch[1];
    } else {
        const years = message.match(/\b(19\d{2}|20[0-2]\d)\b/g);
        if (years && years.length > 0) {
            extracted.incorporationYear = years[0];
        }
    }

    // Extract Funding Amount (in crores)
    const amountMatch = msg.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|capital|need|require|amount)/i);
    if (amountMatch) {
        extracted.fundingAmount = parseFloat(amountMatch[1]);
    }

    // Extract Facility Type
    const facilityKeywords = [
        'working capital', 'term loan', 'lap', 'loan against property', 
        'invoice discounting', 'letter of credit', 'lc', 'bank guarantee', 'bg'
    ];
    for (const kw of facilityKeywords) {
        if (msg.includes(kw)) {
            extracted.facilityType = kw;
            break;
        }
    }

    // Extract Website
    const webMatch = msg.match(/website\s*(?:is|:|:-)?\s*([a-z0-9.-]+\.[a-z]{2,6}(?:\/[a-z0-9._~%!$&'()*+,;=:@-]*)?)/i);
    if (webMatch) {
        extracted.website = webMatch[1].toLowerCase();
    } else {
        const urlMatch = msg.match(/\b(www\.[a-z0-9.-]+\.[a-z]{2,6})\b/i);
        if (urlMatch) {
            extracted.website = urlMatch[1].toLowerCase();
        }
    }

    // Extract Company Name
    const nameMatch = msg.match(/company\s*name\s*(?:is|:|:-)?\s*([a-z0-9\s]+)/i);
    if (nameMatch && nameMatch[1].trim().length > 0) {
        extracted.companyName = nameMatch[1].trim().toUpperCase();
    }

    return extracted;
};

const REQUIRED_FIELDS = [
    'companyName', 'cin', 'pan', 'incorporationYear', 'industry', 
    'registeredOffice', 'companyProfile', 'businessModel', 
    'existingDebts', 'fundingAmount', 'facilityType'
];

const runProbeSearch = async (req, res) => {
    let currentCompany = null;
    let companyId = null;
    let message = '';
    try {
        message = req.body.message || '';
        companyId = req.user.companyId;

        currentCompany = await Company.findById(companyId);
        if (!currentCompany) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        // Save incoming user message in DB
        await ChatMessage.create({
            companyId,
            role: 'user',
            text: message
        });

        // Compute current missing fields
        let currentMissing = REQUIRED_FIELDS.filter(field => {
            if (field === 'fundingAmount' || field === 'facilityType') {
                return !currentCompany.fundingRequirement || !currentCompany.fundingRequirement[field === 'fundingAmount' ? 'amountRequired' : 'facilityType'];
            }
            if (field === 'existingDebts') return !currentCompany.existingDebts || currentCompany.existingDebts.length === 0;
            return !currentCompany[field] || currentCompany[field].length === 0;
        });

        const prompt = `
            You are the PROBE data extraction engine for a B2B debt platform (DealOS).
            Current Company Name in database: "${currentCompany.companyName}"
            Missing Profile fields: [${currentMissing.join(', ')}]
            
            The user message is: "${message}"

            YOUR MISSION:
            1. Identify if the user's message mentions a company name (e.g. "tata consulting group (tcs)", "tcs", "Arvensis Energy", etc.), or if a company is already set in the database but lacks profile information.
            2. If a company name is mentioned or active, you MUST execute a web search (using your Google Search tool) to search for details on that company (registrations, website, incorporation year, CIN, registered office, branch office, industry description, key clients, list of directors, and any public financials).
            3. Retrieve all these details, verify them, and extract them into the JSON format.
            4. Make sure that you perform the web lookup to automatically fill in the missing fields. Do not ask the user for information you can find via search!

            Structure the output JSON EXACTLY like this (only return fields that you found/extracted; others set to null or omit):
            {
                "extractedData": {
                    "companyName": "string or null",
                    "cin": "string or null",
                    "pan": "string or null",
                    "incorporationYear": "string or null",
                    "industry": "string or null",
                    "website": "string or null",
                    "registeredOffice": "string or null",
                    "branchOffice": "string or null",
                    "companyProfile": "string or null",
                    "globalNetwork": ["string"] or null,
                    "businessModel": "string or null",
                    "keyMilestones": "string or null",
                    "keyClients": ["string"] or null,
                    "directors": [
                        { "name": "string", "designation": "string", "profile": "string" }
                    ] or null,
                    "financials": [
                        {
                            "year": "string",
                            "revenue": number,
                            "ebitda": number,
                            "pat": number,
                            "netWorth": number,
                            "shareCapital": number,
                            "reservesSurplus": number,
                            "longTermLoansTL": number,
                            "shortTermLoansBank": number,
                            "tradePayables": number,
                            "fixedAssets": number,
                            "tradeReceivables": number,
                            "cashBankBalances": number
                        }
                    ] or null,
                    "existingDebts": [
                        { "lenderName": "string", "facilityType": "string", "sanctionedAmount": number, "outstandingAmount": number, "collateral": "string" }
                    ] or null,
                    "fundingRequirement": {
                        "amountRequired": number,
                        "purpose": "string",
                        "facilityType": "string"
                    } or null
                },
                "botReply": "A short, professional response summarizing what was updated and asking for 1 or 2 missing fields from: [${currentMissing.join(', ')}]."
            }

            Do not include any text outside the JSON output block.
        `;

        // Select model dynamically to save search API grounding quota
        const useSearch = shouldUseSearch(message, currentCompany.companyName, currentCompany);
        let activeModel = useSearch ? modelWithSearch : modelStandard;
        let result;

        try {
            console.log(`[AI Chat] Active model choice: ${useSearch ? 'modelWithSearch' : 'modelStandard'}`);
            result = await activeModel.generateContent(prompt);
        } catch (error) {
            console.error("Gemini API call failed. Error: ", error.message);
            if (useSearch) {
                try {
                    console.warn("Retrying with modelFallbackWithSearch due to search model failure...");
                    activeModel = modelFallbackWithSearch;
                    result = await activeModel.generateContent(prompt);
                } catch (fbSearchError) {
                    console.error("modelFallbackWithSearch also failed. Retrying with modelStandard...");
                    try {
                        activeModel = modelStandard;
                        result = await activeModel.generateContent(prompt);
                    } catch (stdError) {
                        console.error("modelStandard also failed. Trying modelFallback (gemini-2.5-flash-lite)...");
                        try {
                            activeModel = modelFallback;
                            result = await activeModel.generateContent(prompt);
                        } catch (fbError) {
                            console.error("All models failed.");
                            throw fbError;
                        }
                    }
                }
            } else {
                try {
                    console.warn("Retrying with modelFallback (gemini-2.5-flash-lite) due to standard model failure...");
                    activeModel = modelFallback;
                    result = await activeModel.generateContent(prompt);
                } catch (fbError) {
                    console.error("Fallback model failed:", fbError.message);
                    throw fbError;
                }
            }
        }

        let aiResponse = cleanJsonResponse(result.response.text());

        if (!aiResponse) {
            console.warn("AI response is not in JSON format. Gracefully falling back to raw text response.");
            aiResponse = {
                extractedData: {},
                botReply: result.response.text().trim()
            };
        }

        // Prepare Database Updates
        const ext = aiResponse.extractedData || {};
        const updateData = {};
        
        const simpleFields = [
            'companyName', 'cin', 'pan', 'incorporationYear', 'industry', 
            'website', 'registeredOffice', 'branchOffice', 'companyProfile', 
            'businessModel', 'keyMilestones'
        ];
        simpleFields.forEach(field => {
            if (ext[field] !== undefined && ext[field] !== null) {
                if (Array.isArray(ext[field])) {
                    updateData[field] = ext[field].join('\n');
                } else {
                    updateData[field] = String(ext[field]);
                }
            }
        });

        const arrayStringFields = ['globalNetwork', 'keyClients'];
        arrayStringFields.forEach(field => {
            if (ext[field]) {
                if (Array.isArray(ext[field]) && ext[field].length > 0) {
                    updateData[field] = ext[field].map(String);
                } else if (typeof ext[field] === 'string' && ext[field].trim().length > 0) {
                    updateData[field] = ext[field].split(/,|\n/).map(s => s.trim()).filter(Boolean);
                }
            }
        });

        const arrayObjectFields = ['directors', 'financials', 'existingDebts', 'orderBook', 'linesOfCredit'];
        arrayObjectFields.forEach(field => {
            if (ext[field] && Array.isArray(ext[field]) && ext[field].length > 0) {
                updateData[field] = ext[field];
            }
        });

        if (ext.fundingRequirement) {
            updateData.fundingRequirement = {
                ...currentCompany.fundingRequirement,
                ...ext.fundingRequirement
            };
            if (ext.fundingRequirement.amountRequired) updateData.fundingRequirement.amountRequired = ext.fundingRequirement.amountRequired;
            if (ext.fundingRequirement.facilityType) updateData.fundingRequirement.facilityType = ext.fundingRequirement.facilityType;
        }

        // Apply updates
        if (Object.keys(updateData).length > 0) {
            await Company.findByIdAndUpdate(companyId, { $set: updateData });
        }

        // Source of Truth Recomputation
        const freshCompany = await Company.findById(companyId);
        const updatedMissingFields = REQUIRED_FIELDS.filter(field => {
            if (field === 'fundingAmount') return !freshCompany.fundingRequirement?.amountRequired;
            if (field === 'facilityType') return !freshCompany.fundingRequirement?.facilityType;
            if (field === 'existingDebts') return !freshCompany.existingDebts?.length;
            return !freshCompany[field] || freshCompany[field].length === 0;
        });

        const finalCompany = await Company.findByIdAndUpdate(
            companyId, 
            { $set: { missingFields: updatedMissingFields } },
            { new: true }
        );

        // Save bot reply in DB
        await ChatMessage.create({
            companyId,
            role: 'bot',
            text: aiResponse.botReply
        });

        res.status(200).json({
            reply: aiResponse.botReply,
            company: finalCompany
        });

    } catch (error) {
        console.error("PROBE Search Error:", error);
        
        let friendlyErrorMessage = "I encountered an issue processing your request. Please try again or edit the profile fields directly on the One-Pager.";
        let localUpdates = [];

        if (error.code === 11000) {
            friendlyErrorMessage = "This company detail (CIN or PAN) seems to be already registered under another account. Please verify the credentials or edit the One-Pager directly.";
        } else if (error.status === 429 || error.message.includes('429') || error.message.includes('quota')) {
            friendlyErrorMessage = "I'm having trouble connecting to my AI service because the free-tier API rate limits or daily quotas have been reached. Please try again shortly or feel free to edit the company details directly using the 'Direct Edit' button on the One-Pager.";
            
            // Run regex-based parser to save user information locally
            try {
                const localExt = parseSimpleInputs(message);
                const dbUpdates = {};
                
                if (localExt.companyName) { dbUpdates.companyName = localExt.companyName; localUpdates.push("Company Name"); }
                if (localExt.cin) { dbUpdates.cin = localExt.cin; localUpdates.push("CIN"); }
                if (localExt.pan) { dbUpdates.pan = localExt.pan; localUpdates.push("PAN"); }
                if (localExt.incorporationYear) { dbUpdates.incorporationYear = localExt.incorporationYear; localUpdates.push("Incorporation Year"); }
                if (localExt.website) { dbUpdates.website = localExt.website; localUpdates.push("Website"); }
                
                if (localExt.fundingAmount || localExt.facilityType) {
                    dbUpdates.fundingRequirement = { ...(currentCompany ? currentCompany.fundingRequirement : {}) };
                    if (localExt.fundingAmount) {
                        dbUpdates.fundingRequirement.amountRequired = localExt.fundingAmount;
                        localUpdates.push("Funding Amount");
                    }
                    if (localExt.facilityType) {
                        dbUpdates.fundingRequirement.facilityType = localExt.facilityType;
                        localUpdates.push("Facility Type");
                    }
                }
                
                if (Object.keys(dbUpdates).length > 0 && companyId) {
                    await Company.findByIdAndUpdate(companyId, { $set: dbUpdates });
                    
                    // Recompute missing fields
                    const freshCompany = await Company.findById(companyId);
                    const updatedMissingFields = REQUIRED_FIELDS.filter(field => {
                        if (field === 'fundingAmount') return !freshCompany.fundingRequirement?.amountRequired;
                        if (field === 'facilityType') return !freshCompany.fundingRequirement?.facilityType;
                        if (field === 'existingDebts') return !freshCompany.existingDebts?.length;
                        return !freshCompany[field] || freshCompany[field].length === 0;
                    });
                    
                    currentCompany = await Company.findByIdAndUpdate(
                        companyId, 
                        { $set: { missingFields: updatedMissingFields } },
                        { new: true }
                    );
                    
                    friendlyErrorMessage = `I've updated the following information in your profile: ${localUpdates.join(', ')}. (Note: The AI search grounding service is currently rate-limited, but your manual entries have been successfully saved!)`;
                }
            } catch (localParseError) {
                console.error("Local parsing fallback error:", localParseError);
            }
        }
        
        try {
            if (companyId) {
                await ChatMessage.create({
                    companyId,
                    role: 'bot',
                    text: friendlyErrorMessage
                });
            }
        } catch (dbErr) {
            console.error("Failed to save friendly error message in ChatMessage DB:", dbErr);
        }

        res.status(200).json({
            reply: friendlyErrorMessage,
            company: currentCompany
        });
    }
};

// @desc    Read a document URL (PDF/Image), extract financials, and update DB
const extractDocumentData = async (req, res) => {
    try {
        const { fileUrl, category } = req.body;
        const companyId = req.user.companyId;

        // Guard against SSRF (Server-Side Request Forgery)
        try {
            const urlObj = new URL(fileUrl);
            const ALLOWED_DOMAIN = process.env.CLOUDINARY_DOMAIN || 'res.cloudinary.com';
            const isLocal = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
            if (!isLocal && !urlObj.hostname.endsWith(ALLOWED_DOMAIN)) {
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

        // Intelligent auto-detection of category inside the prompt
        let prompt = `Analyze this document. 
        First, detect what type of document this is (even if the user selected category: "${category}"):
        - If it is a Debt Schedule, Sanction Letter, or Loan Agreement: extract any existing loan details.
        - If it is an Audited Financial Statement, Balance Sheet, Profit & Loss Statement, or MIS report: extract the financials for each year.
        - Otherwise, extract a brief summary.

        Return JSON in one of these formats depending on what you detected:
        
        If you detected a Debt Schedule / Sanction Letter:
        { 
          "detectedCategory": "Debt Schedule and Sanction Letters", 
          "existingDebts": [{ "lenderName": "string", "facilityType": "string", "sanctionedAmount": number, "outstandingAmount": number, "collateral": "string" }] 
        }

        If you detected a Financial Statement / Balance Sheet / P&L:
        { 
          "detectedCategory": "Audited Financials", 
          "financials": [{ 
             "year": "string (e.g. FY25)", 
             "revenue": number, 
             "ebitda": number,
             "pat": number,
             "netWorth": number,
             "shareCapital": number,
             "reservesSurplus": number,
             "longTermLoansTL": number,
             "shortTermLoansBank": number,
             "tradePayables": number,
             "fixedAssets": number,
             "tradeReceivables": number,
             "cashBankBalances": number
          }] 
        }

        For other documents:
        { 
          "detectedCategory": "Additional Documents", 
          "summary": "string" 
        }
        `;

        let result;
        try {
            result = await modelStandard.generateContent([prompt, filePart]);
        } catch (error) {
            console.error("Primary model failed in document extraction, trying fallback model:", error.message);
            try {
                result = await modelFallback.generateContent([prompt, filePart]);
            } catch (fallbackError) {
                console.error("All models failed in document extraction:", fallbackError.message);
                throw fallbackError;
            }
        }
        const extractedData = cleanJsonResponse(result.response.text());

        let updatedCompany = null;
        
        if (extractedData) {
            const detectedCat = extractedData.detectedCategory || category;
            
            if (detectedCat === 'Debt Schedule and Sanction Letters' && extractedData.existingDebts) {
                updatedCompany = await Company.findByIdAndUpdate(
                    companyId,
                    { 
                        $push: { existingDebts: { $each: extractedData.existingDebts } },
                        $pull: { missingFields: 'existingDebts' }
                    },
                    { new: true }
                );
            } else if ((detectedCat === 'Audited Financials' || detectedCat === 'MIS & Provisional Financials') && extractedData.financials) {
                const resolvedYears = extractedData.financials.map(f => `${f.year}_Revenue`);
                updatedCompany = await Company.findByIdAndUpdate(
                    companyId,
                    { 
                        $push: { financials: { $each: extractedData.financials } },
                        $pull: { missingFields: { $in: resolvedYears } }
                    }, 
                    { new: true }
                );
            }
        }

        // Recompute missing fields
        const freshCompany = updatedCompany || await Company.findById(companyId);
        const updatedMissingFields = REQUIRED_FIELDS.filter(field => {
            if (field === 'fundingAmount') return !freshCompany.fundingRequirement?.amountRequired;
            if (field === 'facilityType') return !freshCompany.fundingRequirement?.facilityType;
            if (field === 'existingDebts') return !freshCompany.existingDebts?.length;
            return !freshCompany[field] || freshCompany[field].length === 0;
        });

        const finalCompany = await Company.findByIdAndUpdate(
            companyId, 
            { $set: { missingFields: updatedMissingFields } },
            { new: true }
        );

        res.status(200).json({
            message: 'Document successfully analyzed',
            extractedData,
            company: finalCompany
        });

    } catch (error) {
        console.error("Document Extraction Error:", error);
        res.status(500).json({ message: 'Server error during document extraction' });
    }
};

// @desc    Get chat history for a company
// @route   GET /api/ai/chat-history
const getChatHistory = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const messages = await ChatMessage.find({ companyId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Fetch Chat History Error:", error);
        res.status(500).json({ message: 'Server error fetching chat history' });
    }
};

// @desc    Save a custom chat message
// @route   POST /api/ai/chat-message
const saveChatMessage = async (req, res) => {
    try {
        const { role, text } = req.body;
        const companyId = req.user.companyId;
        if (!role || !text) {
            return res.status(400).json({ message: 'Role and text are required' });
        }
        const newMessage = await ChatMessage.create({
            companyId,
            role,
            text
        });
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Save Chat Message Error:", error);
        res.status(500).json({ message: 'Server error saving chat message' });
    }
};

// @desc    Clear chat history for a company
// @route   DELETE /api/ai/chat-history
const clearChatHistory = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        await ChatMessage.deleteMany({ companyId });
        res.status(200).json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error("Clear Chat History Error:", error);
        res.status(500).json({ message: 'Server error clearing chat history' });
    }
};

module.exports = { 
    runProbeSearch, 
    extractDocumentData,
    getChatHistory,
    saveChatMessage,
    clearChatHistory
};