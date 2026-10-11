import { Router } from "express";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { uploadComplaintImage } from "../middleware/upload.js";
import { approveRejectedLog, detectImage, detectText, listRejectedLogs } from "../controllers/aiController.js";

const router = Router();

router.post("/detect-image", authenticate(true), uploadComplaintImage.single("image"), detectImage);
router.post("/detect-text", authenticate(true), detectText);
router.get("/rejected-logs", authenticate(true), requireRoles("admin"), listRejectedLogs);
router.post("/rejected-logs/:id/approve", authenticate(true), requireRoles("admin"), approveRejectedLog);

export default router;
