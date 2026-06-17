const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getCompanyProfile, updateCompanyProfile } = require('../controllers/companyController');

const companyRouter = express.Router();

// Fetch the company profile data for the One-Pager UI
companyRouter.get('/profile', protect, getCompanyProfile);

// Update the company profile (used by manual edits or when AI extracts new info)
companyRouter.put('/update', protect, updateCompanyProfile);

module.exports = companyRouter;