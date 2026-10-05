const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer (from Multer) to Cloudinary.
 * Supports image and video.
 * Returns { url, publicId }.
 */
function uploadBuffer(buffer, folder = "celsa/products", resourceType = "image") {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
    };
    if (resourceType === "image") {
      options.transformation = [
        { width: 1200, height: 1200, crop: "limit", quality: "auto" },
      ];
    }
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Delete a media asset from Cloudinary by its public ID.
 */
async function deleteImage(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
}

module.exports = { cloudinary, uploadBuffer, deleteImage };
