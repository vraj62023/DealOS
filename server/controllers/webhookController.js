const crypto = require('crypto');

// @desc    Receive third-party upload events and verify payload using HMAC-SHA256 signature
// @route   POST /api/webhooks/upload
const handleUploadWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-signature'];
        if (!signature) {
            console.warn("🚨 Webhook rejected: Missing 'x-signature' header");
            return res.status(401).json({ message: 'Unauthorized: Missing x-signature header' });
        }

        const secret = process.env.WEBHOOK_SECRET || 'dealos_secure_webhook_secret_key_12345';
        
        // Reconstruct string payload for HMAC calculation
        const payloadString = JSON.stringify(req.body);

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payloadString);
        const computedSignature = hmac.digest('hex');

        const sigBuffer = Buffer.from(signature, 'utf-8');
        const compBuffer = Buffer.from(computedSignature, 'utf-8');

        // Prevent timing attacks using crypto.timingSafeEqual
        if (sigBuffer.length !== compBuffer.length || !crypto.timingSafeEqual(sigBuffer, compBuffer)) {
            console.warn("🚨 Webhook signature mismatch: HMAC Verification Failed");
            return res.status(401).json({ message: 'Unauthorized: Invalid webhook signature' });
        }

        console.log("✅ HMAC Webhook Signature Verified successfully!");
        
        const { eventType, documentId, fileName } = req.body;

        // Perform mock audit log or post-upload action
        res.status(200).json({
            message: 'HMAC Webhook verified and processed securely',
            verified: true,
            event: eventType,
            documentId,
            fileName
        });
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).json({ message: 'Internal server error processing webhook' });
    }
};

module.exports = { handleUploadWebhook };
