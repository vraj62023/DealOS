const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // Crucial: This links the User to the Company schema we built earlier
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company' 
    },
    role: {
        type: String,
        default: 'Financial Admin'
    },
    webhookUrl: {
        type: String,
        default: 'http://localhost:5000/api/webhooks/upload'
    },
    webhookSecret: {
        type: String,
        default: 'dealos_secure_webhook_secret_key_12345'
    },
    notificationPreferences: {
        emailAuditReports: {
            type: Boolean,
            default: true
        },
        dynamicMatchingAlerts: {
            type: Boolean,
            default: true
        },
        webhookStatusSubscriptions: {
            type: Boolean,
            default: false
        },
        digestFrequency: {
            type: String,
            default: 'instantly'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);