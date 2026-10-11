import { Router } from "express";
import {
  createComplaint,
  deleteMyComplaint,
  getComplaint,
  listMyComplaints,
  listAllComplaints,
  updateComplaintAdmin,
  officerUpdateComplaint,
  listOfficerComplaints,
} from "../controllers/complaintController.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { uploadComplaintImage } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  authenticate(true),
  requireRoles("citizen"),
  uploadComplaintImage.single("image"),
  createComplaint
);
router.get("/mine", authenticate(true), requireRoles("citizen"), listMyComplaints);
router.delete("/:id", authenticate(true), requireRoles("citizen"), deleteMyComplaint);
router.get("/officer", authenticate(true), requireRoles("department_officer"), listOfficerComplaints);
router.get("/all", authenticate(true), requireRoles("admin"), listAllComplaints);
router.get("/:id", authenticate(true), getComplaint);
router.patch(
  "/:id/admin",
  authenticate(true),
  requireRoles("admin"),
  uploadComplaintImage.single("progressImage"),
  updateComplaintAdmin
);
router.patch(
  "/:id/officer",
  authenticate(true),
  requireRoles("department_officer"),
  uploadComplaintImage.single("progressImage"),
  officerUpdateComplaint
);

export default router;
