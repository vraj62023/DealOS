const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true, 
        index: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'bot'], 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
