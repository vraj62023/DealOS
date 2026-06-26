const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { 
    runProbeSearch, 
    extractDocumentData,
    getChatHistory,
    saveChatMessage,
    clearChatHistory
} = require('../controllers/aiController');

const aiRouter = express.Router();

// Route for the chatbot to trigger the background company search
aiRouter.post('/probe-search', protect, runProbeSearch);

// Route for OCR / Document Intelligence when a user uploads a file
aiRouter.post('/extract-document', protect, extractDocumentData);

// Chat history persistence APIs
aiRouter.get('/chat-history', protect, getChatHistory);
aiRouter.post('/chat-message', protect, saveChatMessage);
aiRouter.delete('/chat-history', protect, clearChatHistory);

module.exports = aiRouter;