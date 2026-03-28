import { Router } from "express";
import rateLimit from "express-rate-limit";
import { addToHistory, getUserHistory, login, register, verifyToken } from "../controllers/user.controller.js";



const router = Router();

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 registration requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const historyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 history retrieval requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

router.route("/login").post(login)
router.route("/register").post(registerLimiter, register)
router.route("/verify").get(verifyToken)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(historyLimiter, getUserHistory)

export default router;