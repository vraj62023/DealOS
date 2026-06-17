const Document = require('../models/Document');

// @desc    Upload a new document to the Dataroom
// @route   POST /api/dataroom/upload
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { category } = req.body;
        
        // Ensure category matches the allowed options in our schema
        const validCategories = [
            'KYC', 'MIS & Provisional Financials', 'Audited Financials', 
            'Bank Statements', 'Debt Schedule and Sanction Letters', 
            'Ageing Details', 'Company Profile', 'Additional Documents'
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid document category' });
        }

        // The abstraction line: Supports both Cloudinary (.path) and AWS S3 (.location)
        const secureFileUrl = req.file.path || req.file.location; 

        const sanitizedFileName = `${Date.now()}_${req.file.originalname
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '')
            .toLowerCase()}`;

        // Create the document record in MongoDB
        const newDocument = await Document.create({
            companyId: req.user.companyId, 
            category: category,
            fileName: sanitizedFileName,
            fileUrl: secureFileUrl, 
            status: 'New',
            uploadedBy: req.user.name
        });

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: newDocument
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: 'Server error during file upload' });
    }
};

// @desc    Get all documents for a specific company
// @route   GET /api/dataroom/
const getCompanyDocuments = async (req, res) => {
    try {
        // Fetch all documents linked to the user's company ID
        const documents = await Document.find({ companyId: req.user.companyId })
                                        .sort({ createdAt: -1 });

        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadDocument,
    getCompanyDocuments
};