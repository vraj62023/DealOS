const Lender = require('../models/Lender');
const DealMatch = require('../models/DealMatch');
const Company = require('../models/Company');

const seedDefaultLenders = async () => {
    const defaultLenders = [
        {
            name: 'HDFC Bank',
            institutionType: 'Bank',
            preferences: {
                minTicketSize: 10,
                maxTicketSize: 150,
                preferredProducts: ['Working Capital', 'Loan Against Property'],
                targetROI: { min: 8.5, max: 14.5 },
                preferredSectors: ['Power Transmission', 'Infrastructure', 'Energy', 'Manufacturing'],
                requiredCollateral: true
            }
        },
        {
            name: 'RevX Capital',
            institutionType: 'NBFC',
            preferences: {
                minTicketSize: 5,
                maxTicketSize: 80,
                preferredProducts: ['Term Loan', 'Invoice Discounting'],
                targetROI: { min: 14, max: 18 },
                preferredSectors: ['Telecom', 'Renewables', 'EPC', 'Tech'],
                requiredCollateral: false
            }
        },
        {
            name: 'Neo AIF - Special Situation Funds',
            institutionType: 'AIF',
            preferences: {
                minTicketSize: 50,
                maxTicketSize: 500,
                preferredProducts: ['Term Loan', 'Working Capital'],
                targetROI: { min: 18, max: 22 },
                preferredSectors: ['Power Transmission', 'Renewables', 'Real Estate'],
                requiredCollateral: true
            }
        },
        {
            name: 'Tipsons - Structured Credit',
            institutionType: 'NBFC',
            preferences: {
                minTicketSize: 20,
                maxTicketSize: 120,
                preferredProducts: ['Term Loan', 'Working Capital'],
                targetROI: { min: 13.5, max: 16.5 },
                preferredSectors: ['Infrastructure', 'Manufacturing', 'Energy'],
                requiredCollateral: true
            }
        },
        {
            name: 'Incred Alternatives',
            institutionType: 'AIF',
            preferences: {
                minTicketSize: 15,
                maxTicketSize: 150,
                preferredProducts: ['Term Loan', 'Loan Against Property'],
                targetROI: { min: 15, max: 19 },
                preferredSectors: ['Power Transmission', 'Telecom', 'Renewables', 'Services'],
                requiredCollateral: true
            }
        }
    ];

    await Lender.insertMany(defaultLenders);
    console.log("Seeded default lenders into DB!");
};

// @desc    Calculate and fetch dynamic matches for a company
// @route   GET /api/matches
const getMatches = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        // Check for sufficient profile information
        const essentialMissing = [];
        if (!company.companyName || company.companyName === 'New Company') essentialMissing.push('Company Name');
        if (!company.incorporationYear) essentialMissing.push('Incorporation Year');
        if (!company.industry) essentialMissing.push('Industry Sector');
        if (!company.fundingRequirement?.amountRequired) essentialMissing.push('Funding Amount Requested');
        if (!company.fundingRequirement?.facilityType) essentialMissing.push('Facility Type');
        if (!company.financials || company.financials.length === 0) {
            essentialMissing.push('Financial Statements (Balance Sheet / Profit & Loss)');
        }

        if (essentialMissing.length > 0) {
            return res.status(200).json({
                status: 'blocked',
                message: 'Sufficient profile data is required to run the matching engine.',
                essentialMissing
            });
        }

        // Check if we need to seed default lenders
        const lenderCount = await Lender.countDocuments();
        if (lenderCount === 0) {
            await seedDefaultLenders();
        }

        const lenders = await Lender.find();
        const matches = [];

        const reqAmount = company.fundingRequirement?.amountRequired;
        const reqFacility = company.fundingRequirement?.facilityType;
        const companyIndustry = company.industry;

        for (const lender of lenders) {
            let score = 50; // base probability

            // 1. Ticket Size Match
            const min = lender.preferences.minTicketSize || 0;
            const max = lender.preferences.maxTicketSize || 1000;
            if (reqAmount >= min && reqAmount <= max) {
                score += 20;
            } else if (reqAmount >= min * 0.8 && reqAmount <= max * 1.2) {
                score += 10;
            }

            // 2. Product Match
            const prefProducts = lender.preferences.preferredProducts || [];
            const matchesProduct = prefProducts.some(p => p.toLowerCase().includes(reqFacility.toLowerCase()) || reqFacility.toLowerCase().includes(p.toLowerCase()));
            if (matchesProduct) {
                score += 15;
            }

            // 3. Sector Match
            const prefSectors = lender.preferences.preferredSectors || [];
            const matchesSector = prefSectors.some(s => s.toLowerCase().includes(companyIndustry.toLowerCase()) || companyIndustry.toLowerCase().includes(s.toLowerCase()));
            if (matchesSector) {
                score += 15;
            }

            // Cap score between 65% and 98% for realistic display
            score = Math.min(98, Math.max(65, score));

            // Determine custom expected properties
            const expectedRoi = lender.preferences.targetROI?.min || 12;
            const maxRoi = lender.preferences.targetROI?.max || 18;
            const tenure = lender.institutionType === 'Bank' ? 24 : (lender.institutionType === 'AIF' ? 48 : 36);
            
            let security = 'Corporate Guarantee';
            if (lender.preferences.requiredCollateral) {
                security = company.fundingRequirement?.securityOffered || 'Charge on Immovable Fixed Assets';
            } else {
                security = 'Pledge of Shares / Unsecured';
            }

            let status = 'Deal Shared';
            let statusColor = 'bg-purple-50 text-purple-600';
            if (score > 90) {
                status = 'Interest Received';
                statusColor = 'bg-emerald-50 text-emerald-600';
            } else if (score < 75) {
                status = 'Passed';
                statusColor = 'bg-red-50 text-red-600';
            }

            // Save match to DB
            const matchDoc = await DealMatch.findOneAndUpdate(
                { companyId, lenderId: lender._id },
                {
                    $set: {
                        matchMetrics: {
                            probabilityScore: score,
                            productOffered: reqFacility,
                            expectedAmount: reqAmount,
                            expectedTenure: tenure,
                            expectedROI: expectedRoi,
                            securityRequired: security
                        },
                        pipelineStatus: status,
                        isTopPick: score > 85
                    }
                },
                { new: true, upsert: true }
            );

            matches.push({
                id: matchDoc._id,
                lenderName: lender.name,
                institutionType: lender.institutionType,
                probability: score,
                amount: `₹${reqAmount} Cr`,
                tenure: `${tenure} m`,
                roi: `${expectedRoi}% - ${maxRoi}%`,
                security,
                status,
                statusColor,
                isTopPick: score > 85,
                product: reqFacility
            });
        }

        // Group by product
        const grouped = matches.reduce((acc, item) => {
            const prod = item.product || 'Term Loan';
            if (!acc[prod]) {
                acc[prod] = {
                    product: prod,
                    matches: matches.filter(m => m.product === prod).length,
                    avgProbability: Math.round(matches.filter(m => m.product === prod).reduce((sum, m) => sum + m.probability, 0) / matches.filter(m => m.product === prod).length),
                    totalAmount: `₹${reqAmount} Cr`,
                    avgTenure: `${matches.filter(m => m.product === prod)[0]?.tenure || '36 m'}`,
                    avgRoi: `${matches.filter(m => m.product === prod)[0]?.roi || '14% - 18%'}`,
                    securitySummary: matches.filter(m => m.product === prod)[0]?.security || 'Charge on Immovable Assets',
                    lenders: []
                };
            }
            acc[prod].lenders.push(item);
            return acc;
        }, {});

        res.status(200).json({
            status: 'success',
            matches: Object.values(grouped)
        });

    } catch (error) {
        console.error("Match Engine Error:", error);
        res.status(500).json({ message: 'Server error calculating matches' });
    }
};

module.exports = { getMatches };
