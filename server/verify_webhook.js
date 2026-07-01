const crypto = require('crypto');
const axios = require('axios');

const testHmacWebhook = async () => {
    const WEBHOOK_URL = 'http://localhost:5000/api/webhooks/upload';
    const secret = 'dealos_secure_webhook_secret_key_12345';
    
    const payload = {
        eventType: 'document.uploaded',
        documentId: 'doc_123456789',
        fileName: 'audited_financials_fy25.pdf',
        timestamp: Date.now()
    };

    const payloadString = JSON.stringify(payload);
    
    // 1. Calculate valid HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const validSignature = hmac.digest('hex');

    console.log("--- HMAC Webhook Verification Test ---");
    console.log("Payload:", payloadString);
    console.log("Computed Valid Signature:", validSignature);

    // Test 1: Send request with VALID signature
    try {
        console.log("\n[Test 1] Sending payload with VALID signature...");
        const res = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-signature': validSignature
            }
        });
        console.log("Response Status:", res.status);
        console.log("Response Body:", res.data);
        console.log("✅ TEST 1 PASSED: Webhook accepted!");
    } catch (err) {
        console.error("❌ TEST 1 FAILED:", err.response ? err.response.data : err.message);
    }

    // Test 2: Send request with INVALID signature
    try {
        console.log("\n[Test 2] Sending payload with INVALID signature...");
        const res = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-signature': 'wrong_signature_value_here_99999'
            }
        });
        console.log("Response Status:", res.status);
        console.log("❌ TEST 2 FAILED: Expected server to reject request, but it succeeded.");
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.log("Response Status:", err.response.status);
            console.log("Response Body:", err.response.data);
            console.log("✅ TEST 2 PASSED: Server correctly rejected invalid signature with 401 Unauthorized!");
        } else {
            console.error("❌ TEST 2 FAILED:", err.response ? err.response.data : err.message);
        }
    }
};

// Make sure your backend server is running on port 5000 before executing this script!
testHmacWebhook();
