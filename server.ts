import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Gemini if key is provided (lazy/graceful check)
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API endpoint for chatbot and intent extraction
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!ai) {
      // Return a pleasant offline response if API key is not ready
      return res.json({
        reply: "Gemini server-side API Key is currently unconfigured. I am running in local backup mode. You can manually enter skills or milestones using the quick-insert buttons above.",
        parsedLog: { loggedType: "none", details: null }
      });
    }

    try {
      // Prepare user history if present
      const formattedHistory = Array.isArray(history) 
        ? history.map((h: any) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
        : "";

      const systemInstruction = `You are EVE, a calm, professional, and objective dog training assistant chatbot.
Your tone is helpful and informative but strictly NOT bubbly, NOT flowery, and NOT over-enthusiastic. Avoid excessive enthusiasm or artificial cheerfulness. Keep answers plain, objective, and mature.

Analyze the user's message. Determine if they are declaring or reporting a dog's training log action or behavioral milestone.
Common training skills: "Sit", "Stay", "Heel", "Recall (Come)", "Leash Walking", "Off", "Leave It", "Housebreaking", "Crate Training".
Identify:
1. "loggedType": Either "training" (if it records active skill sessions like heel for 5 minutes), "milestone" (e.g. achieved housebroken, socialized with neighbor dog today), or "none".
2. Optional structured log details matching the exact criteria.

You MUST respond strictly in valid JSON matching the following schema structure:
{
  "reply": "Your brief, calm, and professional response to the user's conversation",
  "parsedLog": {
    "loggedType": "training" or "milestone" or "none",
    "details": {
      "skill": "Name of skill if training, or empty string",
      "durationMinutes": number training minutes (or default to 5 if not mentioned but is training session, or 0 if none),
      "status": "success" or "in_progress" or "needs_work" (objective assessment based on what they said, e.g. lots of distraction = needs_work, went okay/decent = in_progress, flawless = success),
      "title": "Milestone title if milestone, e.g. 'Socialization Event', otherwise empty",
      "notes": "A precise objective summary of how it went"
    }
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: systemInstruction },
          { text: `Conversation History:\n${formattedHistory}\n\nLatest User Message: ${message}` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: "Calm, professional text reply" },
              parsedLog: {
                type: Type.OBJECT,
                properties: {
                  loggedType: { type: Type.STRING, description: "training, milestone, or none" },
                  details: {
                    type: Type.OBJECT,
                    properties: {
                      skill: { type: Type.STRING },
                      durationMinutes: { type: Type.NUMBER },
                      status: { type: Type.STRING },
                      title: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ["skill", "durationMinutes", "status", "title", "notes"]
                  }
                },
                required: ["loggedType", "details"]
              }
            },
            required: ["reply", "parsedLog"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultData = JSON.parse(responseText);
      res.json(resultData);

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ 
        error: "Failed to generate AI response", 
        details: error?.message || "Unknown error" 
      });
    }
  });

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dog Tracker Server running on port ${PORT}`);
  });
}

startServer();
