const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
    console.log("=== End-to-End API Integration & Verification Test ===");
    let token = '';
    let companyId = '';
    let matchId = '';

    // 1. REGISTER OR LOGIN USER
    try {
        console.log("\n[Step 1] Registering test user...");
        const registerRes = await axios.post(`${API_BASE}/auth/register`, {
            name: "Verifier Admin",
            email: "verifier@dealos.com",
            password: "SecurePassword123",
            companyName: "Verifier Energy Pvt Ltd"
        });
        token = registerRes.data.token;
        companyId = registerRes.data.companyId;
        console.log("✅ User registered! Token received.");
    } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.message === 'User already exists') {
            console.log("ℹ️ Test user already exists, logging in...");
            const loginRes = await axios.post(`${API_BASE}/auth/login`, {
                email: "verifier@dealos.com",
                password: "SecurePassword123"
            });
            token = loginRes.data.token;
            companyId = loginRes.data.companyId;
            console.log("✅ Login successful! Token received.");
        } else {
            console.error("❌ Auth failed:", err.response ? err.response.data : err.message);
            process.exit(1);
        }
    }

    const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // 2. UPDATE COMPANY PROFILE FOR MATCHING (UNBLOCK)
    try {
        console.log("\n[Step 2] Updating company profile to meet matching prerequisites...");
        const updateRes = await axios.put(`${API_BASE}/company/update`, {
            companyName: "Arvensis Energy Pvt Ltd",
            industry: "Power Transmission",
            incorporationYear: "2018",
            fundingRequirement: {
                amountRequired: 45,
                purpose: "Expanding power grids across regions",
                facilityType: "Term Loan",
                securityOffered: "Charge on fixed sub-station assets"
            },
            financials: [{
                year: "FY25",
                shareCapital: 10,
                reservesSurplus: 15,
                netWorth: 25,
                longTermLoansTL: 30,
                longTermLoansVehicle: 0,
                shortTermLoansBank: 10,
                unsecuredFromDirectors: 5,
                tradePayables: 6,
                otherCurrentLiabilities: 4,
                shortTermProvisions: 2,
                fixedAssets: 50,
                inventories: 0,
                tradeReceivables: 15,
                cashBankBalances: 5,
                otherCurrentAssets: 2,
                revenue: 90,
                otherIncome: 2,
                totalRevenue: 92,
                cogs: 45,
                ebitda: 20,
                otherExpenses: 10,
                financeCost: 5,
                depreciationAmortisation: 3,
                profitBeforeTax: 12,
                profitAfterTax: 9,
                cashProfits: 12
            }]
        }, authHeaders);
        console.log("✅ Profile updated! Missing fields count:", updateRes.data.company.missingFields.length);
    } catch (err) {
        console.error("❌ Update failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 3. FETCH MATCHES
    try {
        console.log("\n[Step 3] Querying lender matches...");
        const matchesRes = await axios.get(`${API_BASE}/matches`, authHeaders);
        console.log("Status:", matchesRes.data.status);
        if (matchesRes.data.status === 'blocked') {
            console.error("❌ MATCH ENGINE BLOCKED:", matchesRes.data.essentialMissing);
            process.exit(1);
        }
        
        const grouped = matchesRes.data.matches;
        console.log(`✅ Matches found: ${grouped.length} product groups.`);
        grouped.forEach(g => {
            console.log(` - Product: ${g.product}, Lenders: ${g.lenders.length}, Avg Match Prob: ${g.avgProbability}%`);
        });

        // Get the first lender match ID for pipeline testing
        if (grouped.length > 0 && grouped[0].lenders.length > 0) {
            matchId = grouped[0].lenders[0].id;
            console.log(`Selected Match ID for pipeline test: ${matchId}`);
        } else {
            console.error("❌ No lender matches returned.");
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ Matches query failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 4. KANBAN PIPELINE UPDATE
    try {
        console.log(`\n[Step 4] Simulating Kanban drag-and-drop: Updating match pipeline status to 'Diligence'...`);
        const statusRes = await axios.put(`${API_BASE}/matches/${matchId}/status`, {
            pipelineStatus: 'Diligence'
        }, authHeaders);
        console.log("✅ Pipeline updated successfully!");
        console.log("New Status in DB:", statusRes.data.match.pipelineStatus);
    } catch (err) {
        console.error("❌ Kanban update failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 5. TEST FILE UPLOAD & OCR EXTRACTION
    try {
        console.log("\n[Step 5] Testing file upload to Dataroom...");
        
        // Find a valid uploaded PDF to copy and test
        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
        if (files.length === 0) {
            throw new Error("No PDF files found in uploads directory to use as a test file.");
        }
        
        const sourcePdfPath = path.join(uploadsDir, files[0]);
        console.log(`Using existing PDF for upload test: ${files[0]}`);

        const form = new FormData();
        form.append('file', fs.createReadStream(sourcePdfPath), { filename: 'test_upload_file.pdf' });
        form.append('category', 'Audited Financials');

        const uploadRes = await axios.post(`${API_BASE}/dataroom/upload`, form, {
            headers: {
                ...authHeaders.headers,
                ...form.getHeaders()
            }
        });
        console.log("Response:", uploadRes.data.message);
        const uploadedUrl = uploadRes.data.document.fileUrl;
        console.log("✅ File uploaded successfully! Hosted URL:", uploadedUrl);

        console.log("\n[Step 6] Triggering AI extraction on the uploaded file (via local PDF parser)...");
        const aiRes = await axios.post(`${API_BASE}/ai/extract-document`, {
            fileUrl: uploadedUrl,
            category: 'Audited Financials'
        }, authHeaders);
        console.log("✅ AI Extraction completed!");
        console.log("Detected Category:", aiRes.data.extractedData?.detectedCategory);
        console.log("Extracted Data:", JSON.stringify(aiRes.data.extractedData, null, 2));

    } catch (err) {
        console.error("❌ Upload/OCR test failed:", err.response ? err.response.data : err.message);
        process.exit(1);
    }

    console.log("\n⭐️ ALL E2E API VERIFICATION TESTS PASSED SUCCESSFULLY! ⭐️");
};

runTest();
