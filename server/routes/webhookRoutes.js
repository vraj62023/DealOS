const express = require('express');
const { handleUploadWebhook } = require('../controllers/webhookController');

const webhookRouter = express.Router();

// Mount the HMAC-verified webhook endpoint
webhookRouter.post('/upload', handleUploadWebhook);

module.exports = webhookRouter;
