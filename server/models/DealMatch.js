const mongoose = require('mongoose');

const DealMatchSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    lenderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lender', 
        required: true 
    },
    
    // TASTE / Loop Algorithm Outputs[cite: 3]
    matchMetrics: {
        probabilityScore: { type: Number, required: true }, // e.g., 86 for 86%
        productOffered: { type: String }, // e.g., 'Term Loan'
        expectedAmount: { type: Number }, // In Crores
        expectedTenure: { type: Number }, // In Months (e.g., 36m)
        expectedROI: { type: Number }, // e.g., 16%
        securityRequired: { type: String } // e.g., 'Personal Guarantee of Promoters'
    },

    // CRM Kanban Status[cite: 3]
    pipelineStatus: {
        type: String,
        enum: [
            'Deal Shared', 
            'Interest Received', 
            'IPA Accepted', 
            'Diligence', 
            'Sanction / Close', 
            'Disbursement Tracked', 
            'Passed'
        ],
        default: 'Deal Shared'
    },
    
    // Track when the deal was sent to the lender
    lastSharedAt: { type: Date, default: Date.now },
    isTopPick: { type: Boolean, default: false },

    // AI Credit Underwriter Outputs
    underwriting: {
        creditRating: { type: String }, // e.g. 'A+', 'BBB'
        riskRationale: { type: String }, // Underwriter's detailed assessment memo
        calculatedRatios: {
            leverage: { type: Number }, // Total Debt / EBITDA
            debtToEquity: { type: Number }, // Total Debt / Net Worth
            currentRatio: { type: Number }, // Current Assets / Current Liabilities
            dscr: { type: Number } // Debt Service Coverage Ratio
        }
    }

}, { timestamps: true });

// Compound index to ensure we don't duplicate matches for the same deal
DealMatchSchema.index({ companyId: 1, lenderId: 1 }, { unique: true });

module.exports = mongoose.model('DealMatch', DealMatchSchema);