const mongoose = require('mongoose');

const DirectorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: { type: String },
    profile: { type: String } // Bio/profile description
}, { _id: false });

const ExistingDebtSchema = new mongoose.Schema({
    lenderName: { type: String },
    facilityType: { type: String },
    sanctionedAmount: { type: Number }, // Limit in crores
    outstandingAmount: { type: Number }, // Utilised in crores
    collateral: { type: String }
}, { _id: false });

const LineOfCreditSchema = new mongoose.Schema({
    currency: { type: String },
    lcValueMillions: { type: Number },
    valueInrCrore: { type: Number },
    issueDate: { type: String },
    periodTenor: { type: String },
    issuingBank: { type: String },
    advisingBank: { type: String }
}, { _id: false });

const OrderBookItemSchema = new mongoose.Schema({
    sector: { type: String },
    client: { type: String },
    projectScope: { type: String }
}, { _id: false });

const FinancialYearSchema = new mongoose.Schema({
    year: { type: String }, // e.g. "FY25(A)", "FY24(A)"
    // Balance Sheet lines
    shareCapital: { type: Number },
    reservesSurplus: { type: Number },
    netWorth: { type: Number },
    longTermLoansTL: { type: Number },
    longTermLoansVehicle: { type: Number },
    shortTermLoansBank: { type: Number },
    unsecuredFromDirectors: { type: Number },
    tradePayables: { type: Number },
    otherCurrentLiabilities: { type: Number },
    shortTermProvisions: { type: Number },
    fixedAssets: { type: Number },
    inventories: { type: Number },
    tradeReceivables: { type: Number },
    cashBankBalances: { type: Number },
    otherCurrentAssets: { type: Number },
    // Profit & Loss A/c lines
    revenue: { type: Number },
    otherIncome: { type: Number },
    totalRevenue: { type: Number },
    cogs: { type: Number },
    ebitda: { type: Number },
    otherExpenses: { type: Number },
    financeCost: { type: Number },
    depreciationAmortisation: { type: Number },
    profitBeforeTax: { type: Number },
    profitAfterTax: { type: Number },
    cashProfits: { type: Number }
}, { _id: false });

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true, index: true },
    cin: { type: String },
    pan: { type: String },
    incorporationYear: { type: String },
    industry: { type: String },
    website: { type: String },
    registeredOffice: { type: String },
    branchOffice: { type: String },
    companyProfile: { type: String },
    globalNetwork: [{ type: String }], // List of subsidiaries & joint ventures
    businessModel: { type: String },
    keyMilestones: { type: String },
    keyClients: [{ type: String }],
    
    directors: [DirectorSchema],
    financials: [FinancialYearSchema],
    existingDebts: [ExistingDebtSchema],
    orderBook: [OrderBookItemSchema],
    linesOfCredit: [LineOfCreditSchema],

    fundingRequirement: {
        amountRequired: { type: Number }, // in crores
        purpose: { type: String },
        facilityType: { type: String },
        facility1: {
            limit: { type: Number },
            subLimits: { type: String },
            roi: { type: String },
            commission: { type: String }
        },
        facility2: {
            limit: { type: Number },
            purpose: { type: String },
            roi: { type: String },
            pf: { type: String },
            security: { type: String },
            collateral: { type: String },
            guarantee: { type: String }
        },
        fundingRequirement2: {
            amount: { type: Number },
            type: { type: String },
            securityOffered: { type: String }
        }
    },

    missingFields: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);