import { Router } from "express";
import { listMessages, sendMessage } from "../controllers/messageController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate(true), listMessages);
router.post("/", authenticate(true), sendMessage);

export default router;
