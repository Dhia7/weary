const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadMultipleToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// Ensure uploads directory exists (for fallback/local storage)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
// Use memory storage if Cloudinary is configured, disk storage otherwise
const storage = isCloudinaryConfigured()
  ? multer.memoryStorage() // Use memory storage for Cloudinary
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
      }
    });

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Custom middleware to handle multiple images with dynamic field names
// This middleware uploads to Cloudinary if configured, otherwise uses local storage
const uploadMultipleImages = async (req, res, next) => {
  const uploadHandler = upload.any();
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload error' 
      });
    }

    // If Cloudinary is configured and files were uploaded, upload them to Cloudinary
    if (isCloudinaryConfigured() && req.files && req.files.length > 0) {
      try {
        // Upload to Cloudinary
        const cloudinaryUrls = await uploadMultipleToCloudinary(req.files);
        
        // Store Cloudinary URLs in request object
        req.cloudinaryUrls = cloudinaryUrls;
        
        // If using memory storage, we don't need to clean up files
        // If using disk storage, files are cleaned up in uploadMultipleToCloudinary
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Fallback to local storage URLs
        if (req.files && req.files.length > 0) {
          req.cloudinaryUrls = req.files.map(file => {
            // If using memory storage, save to disk as fallback
            if (file.buffer && !file.path) {
              const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              const filePath = path.join(uploadsDir, filename);
              fs.writeFileSync(filePath, file.buffer);
              return `/uploads/${filename}`;
            }
            return `/uploads/${file.filename}`;
          });
        }
      }
    }
    
    next();
  });
};

module.exports = { upload, uploadMultipleImages };
