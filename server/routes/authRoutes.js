const express = require('express');
const authRouter = express.Router();
const { registerUser, loginUser, updateUserProfile, rotateWebhookSecret } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);

authRouter.put('/profile', protect, updateUserProfile);
authRouter.post('/rotate-webhook-secret', protect, rotateWebhookSecret);

module.exports = authRouter;