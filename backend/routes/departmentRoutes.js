import { Router } from "express";
import { listDepartments, upsertDepartment } from "../controllers/departmentController.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate(true), listDepartments);
router.post("/", authenticate(true), requireRoles("admin"), upsertDepartment);

export default router;
