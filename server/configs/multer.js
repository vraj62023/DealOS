const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure the Storage Engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'DealOS_Dataroom', 
        allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'], 
        resource_type: 'auto' // Required to allow non-image files like PDFs
    }
});

// Initialize Multer with the storage engine, size limits, and file filters
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB maximum file size
    }, 
    fileFilter: (req, file, cb) => {
        // Only allow PDFs and standard image types
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
        }
    }
});

module.exports = upload;