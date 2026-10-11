import { Router } from "express";
import { listOfficers } from "../controllers/userController.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get("/officers", authenticate(true), requireRoles("admin"), listOfficers);

export default router;
