import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const allowed = /jpeg|jpg|png|webp|gif/;

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = allowed.test(ext.replace(".", "")) && allowed.test(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error("Only image files (jpeg, png, webp, gif) are allowed"));
}

export const uploadComplaintImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export { uploadDir };
