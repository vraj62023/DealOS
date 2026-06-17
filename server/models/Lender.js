const mongoose  = require('mongoose');

const LenderSchema = new mongoose.Schema({
    name:{type:String, required:true},
    institutionType:{
        type:String,
        enum:['Bank', 'NBFC', 'AIF', 'Fund']
    },

    preferences:{
        minTicketSize:{type:Number},
        maxTicketSize:{type:Number},
        preferredProducts:[{
            type:String,
            enum:['Term Loan', 'Working Capital', 'Loan Against Property','Invoice Discounting']
        }],
        targetROI:{
            min:{type:Number},
            max:{type:Number}
        },
        preferredSectors:[{type:String}],
        requiredCollateral:{type:Boolean,default:true},
    }

},{timestamps:true});
module.exports = mongoose.model('Lender', LenderSchema);