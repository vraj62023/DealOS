const mongoose  = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    companyId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company',
        required:true
    },
    category:{
        type:String,
        enum:[
            'KYC', 
            'MIS & Provisional Financials', 
            'Audited Financials', 
            'Bank Statements', 
            'Debt Schedule and Sanction Letters', 
            'Ageing Details',
            'Company Profile',
            'Additional Documents'
        ],
        required: true
    },
    fileName: { type: String, required: true }, // e.g., 'HDFC Bank Sanction Letter_Mar2025.pdf'[cite: 3]
    fileUrl: { type: String, required: true }, // URL from AWS S3, Cloudinary, etc.
    
    // Metadata for the UI table[cite: 3]
    status: { 
        type: String, 
        enum: ['New', 'Verified', 'Archived'], 
        default: 'New' 
    },
    dataFrom: { type: Date },
    dataTill: { type: Date },
    
    uploadedBy: { type: String, default: 'PROBE Agent' } // Can be User or Agent

},{ timestamps: true });
module.exports = mongoose.model('Document', DocumentSchema);