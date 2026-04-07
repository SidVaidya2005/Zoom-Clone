import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getToken } from "../controllers/meet.controller.js";

const router = Router();

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/v1/meet/get-token?room=<roomName>&username=<username>
router.route("/get-token").get(tokenLimiter, getToken);

export default router;
