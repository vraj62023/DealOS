const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { runProbeSearch, extractDocumentData } = require('../controllers/aiController');

const aiRouter = express.Router();

// Route for the chatbot to trigger the background company search
aiRouter.post('/probe-search', protect, runProbeSearch);

// Route for OCR / Document Intelligence when a user uploads a file
aiRouter.post('/extract-document', protect, extractDocumentData);

module.exports = aiRouter;