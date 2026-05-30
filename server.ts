typescript
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { ParsedLogDetails, ParsedActionLog, ChatMessage } from "./src/types";
import dotenv from "dotenv";
import knex from "knex";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { consensusController } from "../.antigravity/consensus_controller";

dotenv.config();

const modelName = process.env.GEMINI_MODEL_NAME || "gemini-3.5-flash";

const db = knex({
    client: 'sqlite3',
    connection: { filename: './dev.sqlite3' },
    useNullAsDefault: true,
});

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

async function startServer() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    const PORT = 3001;

    const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const token = req.cookies.jwt;
        if (!token) return res.status(401).json({ message: "Authentication failed" });
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            (req as any).userId = decoded.userId;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Authentication failed" });
        }
    };

    const apiKey = process.env.GEMINI_API_KEY;
    let ai: GoogleGenerativeAI | null = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    let geminiModel: GenerativeModel | null = ai ? ai.getGenerativeModel(modelName) : null;

    app.post("/api/chat", async (req: express.Request, res) => {
        const { message, history, customLlmConfig, customSkills } = req.body;
        if (!message) return res.status(400).json({ error: "Message required" });

        // AI Logic (simplified for brevity)
        if (geminiModel) {
            try {
                const response = await geminiModel.generateContent(message);
                const text = (await response.response).text();
                res.json({ reply: text });
            } catch (err) {
                res.status(500).json({ error: "AI error" });
            }
        }
    });

    app.post("/api/register", async (req, res) => {
        const { username, email, password } = req.body;
        const password_hash = await bcrypt.hash(password, 10);
        const [id] = await db('users').insert({ username, email, password_hash });
        res.status(201).json({ userId: id });
    });

    app.post("/api/login", async (req, res) => {
        const { username, password } = req.body;
        const user = await db('users').where({ username }).first();
        if (user && (await bcrypt.compare(password, user.password_hash))) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
            res.json({ userId: user.id });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    });

    app.post("/api/dogs", verifyToken, async (req, res) => {
        const { name, breed } = req.body;
        const [id] = await db('dogs').insert({ name, breed, user_id: (req as any).userId });
        res.status(201).json({ dog: { id, name, breed } });
    });

    app.get("/api/leaderboard", async (req, res) => {
        try {
            const leaderboard = await db('dogs')
                .select(
                    'dogs.name as dog_name',
                    'users.username as user_name',
                    db.raw('SUM(achievements.score) as total_achievement_score'),
                    db.raw('COALESCE(SUM(event_registrations.consensus_score), 0) as total_consensus_score')
                )
                .join('users', 'dogs.user_id', '=', 'users.id')
                .leftJoin('achievements', 'dogs.id', '=', 'achievements.dog_id')
                .leftJoin('event_registrations', 'dogs.id', '=', 'event_registrations.dog_id')
                .groupBy('dogs.id', 'dogs.name', 'users.username')
                .orderByRaw('(total_achievement_score * (1 + (total_consensus_score * 0.1))) DESC');
            res.json(leaderboard);
        } catch (error) {
            console.error("Leaderboard fetch error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    app.post("/api/events/:id/verify", verifyToken, (req, res) => consensusController.verifyDog(req, res, db));
    app.get("/api/events/active", (req, res) => consensusController.getActiveEvent(req, res, db));

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
        app.use(vite.middlewares);
    } else {
        app.use(express.static('dist'));
    }

    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
