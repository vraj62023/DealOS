const Company = require('../models/Company');

// @desc    Get the current user's company profile
// @route   GET /api/company/profile
const getCompanyProfile = async (req, res) => {
    try {
        // req.user.companyId comes from the authMiddleware
        const company = await Company.findById(req.user.companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error("Fetch Company Error:", error);
        res.status(500).json({ message: 'Server error fetching company data' });
    }
};

// @desc    Update the company profile (e.g., filling in missing fields)
// @route   PUT /api/company/update
const updateCompanyProfile = async (req, res) => {
    try {
        // 1. Define exactly what the user is allowed to edit manually
        const PATCHABLE_FIELDS = [
            'companyName', 'industry', 'website', 'incorporationYear', 
            'registeredOffice', 'branchOffice', 'companyProfile', 'pan', 'cin',
            'globalNetwork', 'businessModel', 'keyMilestones', 'keyClients',
            'directors', 'financials', 'existingDebts', 'orderBook', 'linesOfCredit',
            'fundingRequirement'
        ];

        // 2. Build a safe update object containing ONLY allowed fields
        const safeUpdates = {};
        PATCHABLE_FIELDS.forEach(key => {
            if (req.body[key] !== undefined) {
                safeUpdates[key] = req.body[key];
            }
        });

        // 3. Prevent empty updates
        if (Object.keys(safeUpdates).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.user.companyId,
            { $set: safeUpdates },
            { new: true, runValidators: true }
        );

        if (!updatedCompany) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        res.status(200).json({
            message: 'Company profile updated safely',
            company: updatedCompany
        });
    } catch (error) {
        console.error("Update Company Error:", error);
        res.status(500).json({ message: 'Server error updating company data' });
    }
};

module.exports = {
    getCompanyProfile,
    updateCompanyProfile
};