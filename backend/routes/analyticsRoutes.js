import { Router } from "express";
import { adminAnalytics, citizenStats } from "../controllers/analyticsController.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get("/admin", authenticate(true), requireRoles("admin"), adminAnalytics);
router.get("/citizen", authenticate(true), requireRoles("citizen"), citizenStats);

export default router;
