const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../configs/multer');
const { uploadDocument, getCompanyDocuments } = require('../controllers/dataroomController');

const dataroomRouter = express.Router();

// Fetch all documents (Requires auth)
dataroomRouter.get('/', protect, getCompanyDocuments);

// Upload a document (Requires auth + uses Multer to handle the file first)
dataroomRouter.post('/upload', protect, (req, res, next) => {
    const uploadMiddleware = upload.single('file');
    
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error("FULL ERROR OBJECT:", JSON.stringify(err, null, 2));
            console.error("ERROR MESSAGE:", err.message);
            console.error("ERROR STACK:", err.stack);
            // If it's a Multer error, this will tell us exactly which field is wrong
            if (err.name === 'MulterError') {
                console.error(`🚨 MULTER CRASH: ${err.message}. The unexpected field was: "${err.field}"`);
                return res.status(400).json({ message: `Upload failed. Server expected 'file', but received '${err.field}'` });
            }
            // If Cloudinary or the File Filter failed, this will catch it
            console.error(`🚨 OTHER UPLOAD ERROR:`, err.message);
            return res.status(500).json({ message: err.message });
        }
        // If no error, proceed to your controller
        next();
    });
}, uploadDocument);

module.exports = dataroomRouter;