import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Extract Bearer token from Authorization header
function extractToken(req) {
    const auth = req.headers["authorization"] || "";
    if (auth.startsWith("Bearer ")) return auth.slice(7);
    return null;
}

// Find a user by token and check it hasn't expired
async function findValidUser(token) {
    if (!token) return null;
    const user = await User.findOne({ token });
    if (!user) return null;
    if (!user.tokenExpiry || user.tokenExpiry < new Date()) {
        user.token = undefined;
        user.tokenExpiry = undefined;
        await user.save();
        return null;
    }
    return user;
}

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            user.tokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);
            await user.save();
            return res.status(httpStatus.OK).json({ token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashedPassword });
        await newUser.save();

        res.status(httpStatus.CREATED).json({ message: "User Registered" });
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

const verifyToken = async (req, res) => {
    const token = extractToken(req);
    const user = await findValidUser(token);
    if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
    }
    return res.status(httpStatus.OK).json({ message: "Valid" });
}

const getUserHistory = async (req, res) => {
    const token = extractToken(req);

    try {
        const user = await findValidUser(token);
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
        }
        const meetings = await Meeting.find({ user_id: user.username });
        res.json(meetings);
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

const addToHistory = async (req, res) => {
    const token = extractToken(req);
    const { meeting_code } = req.body;

    try {
        const user = await findValidUser(token);
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
        }

        const newMeeting = new Meeting({ user_id: user.username, meetingCode: meeting_code });
        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

export { login, register, getUserHistory, addToHistory, verifyToken }
