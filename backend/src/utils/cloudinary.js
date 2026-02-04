const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️  Cloudinary not configured - using local file storage');
}

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<string>} - Cloudinary URL
 */
async function uploadToCloudinary(filePath, folder = 'wear/products') {
  // If Cloudinary is not configured, return null
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    return result.secure_url; // Use HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Upload buffer directly to Cloudinary (for memory storage)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<string>} - Cloudinary URL
 */
async function uploadBufferToCloudinary(buffer, originalname, folder = 'wear/products') {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary buffer upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of multer file objects
 * @param {string} folder - Cloudinary folder (optional)
 * @returns {Promise<Array<string>>} - Array of Cloudinary URLs
 */
async function uploadMultipleToCloudinary(files, folder = 'wear/products') {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // Fallback to local storage URLs
    return files.map(file => `/uploads/${file.filename}`);
  }

  const uploadPromises = files.map(async (file) => {
    try {
      let cloudinaryUrl;
      
      // If file has buffer (memory storage), upload buffer directly
      if (file.buffer) {
        cloudinaryUrl = await uploadBufferToCloudinary(file.buffer, file.originalname, folder);
      } 
      // If file has path (disk storage), upload from path
      else if (file.path) {
        cloudinaryUrl = await uploadToCloudinary(file.path, folder);
        // Clean up local file after upload
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } else {
        // Fallback to local path
        cloudinaryUrl = `/uploads/${file.filename}`;
      }

      return cloudinaryUrl || `/uploads/${file.filename}`;
    } catch (error) {
      console.error(`Failed to upload ${file.originalname || file.filename}:`, error);
      // Fallback to local path if Cloudinary fails
      return `/uploads/${file.filename}`;
    }
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary
 * @param {string} imageUrl - Cloudinary URL or public ID
 * @returns {Promise<void>}
 */
async function deleteFromCloudinary(imageUrl) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return;
  }

  try {
    // Extract public_id from URL
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID
 */
function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  isCloudinaryConfigured,
  cloudinary
};
