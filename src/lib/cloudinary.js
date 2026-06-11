import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local disk storage.
 * 
 * @param {Buffer} fileBuffer - File contents in a buffer.
 * @param {string} fileName - Original filename.
 * @returns {Promise<{ url: string, publicId: string }>} Upload details.
 */
export async function uploadResume(fileBuffer, fileName) {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      // Cloudinary upload stream for raw file types (PDF, Docx, etc.)
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'internbridge_resumes' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // Local File Storage Fallback
    console.log('Cloudinary not configured. Storing file locally...');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await fs.promises.writeFile(filePath, fileBuffer);

    return {
      url: `/uploads/${uniqueFileName}`,
      publicId: uniqueFileName,
    };
  }
}
