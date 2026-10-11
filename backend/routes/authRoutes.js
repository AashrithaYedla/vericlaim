import { Router } from "express";
import {
  register,
  registerAdmin,
  registerDepartmentAdmin,
  login,
  verifyEmail,
  resendOtp,
  me,
  createOfficer,
} from "../controllers/authController.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/register-department-admin", registerDepartmentAdmin);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/me", authenticate(true), me);
router.post("/officers", authenticate(true), requireRoles("admin"), createOfficer);

export default router;
