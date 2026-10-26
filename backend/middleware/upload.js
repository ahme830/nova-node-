const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const supabase = require("../db");

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const rawMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function uploadToCloudinary(file, folder = "produits") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

async function uploadToSupabaseStorage(file, folder = "produits") {
  const ext = (file.originalname?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext || "jpg"}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(safeName, file.buffer, {
      contentType: file.mimetype || "image/jpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(safeName);
  return data.publicUrl;
}

const upload = {
  single: (fieldName) => (req, res, next) => {
    rawMulter.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return next();
      }
      try {
        const folder = fieldName === "photo" ? "stores_profiles" : "produits";
        const publicUrl = hasCloudinary
          ? await uploadToCloudinary(req.file, folder)
          : await uploadToSupabaseStorage(req.file, folder);

        req.file.secure_url = publicUrl;
        req.file.path = publicUrl;
        next();
      } catch (uploadErr) {
        console.error("[upload] Error:", uploadErr.message);
        return res.status(500).json({ error: uploadErr.message });
      }
    });
  },
};

module.exports = { upload, cloudinary, hasCloudinary };
