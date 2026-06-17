const mongoose = require('mongoose');

const DirectorSchema = new mongoose.Schema({
    name:{type:String, required:true},
    designation:{type:String}

},{_id:false});

const ExistingDebtSchema = new mongoose.Schema({
    lenderName:{type:String},
    facilityType:{type:String},
    sanctionedAmount:{type:Number},//in crores
    outstandingAmount:{type:Number},//crores
    collateral:{type:String},  
},{_id:false});
const FinancialYearSchema = new mongoose.Schema({
    year:{type:String},
    revenue:{type:Number},//in crores
    ebitda:{type:Number},
    pat:{type:Number},
    netWorth:{type:Number},
    totalDebt:{type:Number},

},{_id:false});

const CompanySchema = new mongoose.Schema({
    companyName:{type:String,required:true,index:true},
    cin:{type:String,unique:true, sparse:true},
    pan:{type:String},
    incorporationYear:{type:String},
    industry:{type:String},
    website:{type:String},
    registeredOffice:{type:String},
    companyProfile:{type:String},
    
    directors:[DirectorSchema],

    financials:[FinancialYearSchema],

    existingDebts:[ExistingDebtSchema],

    fundingRequirement:{
        amountRequired:{type:Number},//in crores
        facilityType:{type:String},
        purpose:{type:String},
        securityOffered:{type:String}
    },

    missingFields:[{type:String}],
    
},{timestamps:true});
module.exports = mongoose.model('Company', CompanySchema);