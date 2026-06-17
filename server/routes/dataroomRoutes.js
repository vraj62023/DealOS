const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../configs/multer');
const { uploadDocument, getCompanyDocuments } = require('../controllers/dataroomController');

const dataroomRouter = express.Router();

// Fetch all documents (Requires auth)
dataroomRouter.get('/', protect, getCompanyDocuments);

// Upload a document (Requires auth + uses Multer to handle the file first)
dataroomRouter.post('/upload', protect, upload.single('file'), uploadDocument);

module.exports = dataroomRouter;