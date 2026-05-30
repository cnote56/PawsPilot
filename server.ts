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
    const { message, history, customLlmConfig } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Build the system instructions
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

    // 1. Check if user configured a custom LLM plugin and enabled it
    if (customLlmConfig && customLlmConfig.enabled) {
      try {
        if (customLlmConfig.provider === "openai_compatible") {
          const baseUrl = customLlmConfig.baseUrl || "https://api.openai.com/v1";
          const bearerKey = customLlmConfig.apiKey;
          const modelName = customLlmConfig.model || "gpt-4o-mini";

          const messages = [
            { role: "system", content: systemInstruction }
          ];

          if (Array.isArray(history)) {
            history.forEach((h: any) => {
              messages.push({
                role: h.sender === "user" ? "user" : "assistant",
                content: h.text
              });
            });
          }

          messages.push({ role: "user", content: message });

          const reqHeaders: Record<string, string> = {
            "Content-Type": "application/json"
          };
          if (bearerKey) {
            reqHeaders["Authorization"] = `Bearer ${bearerKey}`;
          }

          const customResponse = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: reqHeaders,
            body: JSON.stringify({
              model: modelName,
              messages: messages,
              response_format: { type: "json_object" }
            })
          });

          if (!customResponse.ok) {
            const errText = await customResponse.text();
            throw new Error(`Custom LLM Plugin endpoint returned status ${customResponse.status}: ${errText}`);
          }

          const responseData = await customResponse.json();
          const contentText = responseData?.choices?.[0]?.message?.content || "{}";
          try {
            const parsedData = JSON.parse(contentText.trim());
            return res.json(parsedData);
          } catch (jsonErr) {
            // Clean markdown wrappers if any
            const cleanedText = contentText.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(cleanedText);
            return res.json(parsedData);
          }
        } else if (customLlmConfig.provider === "gemini") {
          const customKey = customLlmConfig.apiKey || apiKey;
          if (!customKey) {
            return res.json({
              reply: "No Gemini API Key supplied in custom LLM plugin configuration settings. EVE is operating in local tactile mode.",
              parsedLog: { loggedType: "none", details: null }
            });
          }

          const tempAi = new GoogleGenAI({
            apiKey: customKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build-custom-gemini-client',
              }
            }
          });

          const formattedHistory = Array.isArray(history) 
            ? history.map((h: any) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
            : "";

          const response = await tempAi.models.generateContent({
            model: customLlmConfig.model || "gemini-3.5-flash",
            contents: [
              { text: systemInstruction },
              { text: `Conversation History:\n${formattedHistory}\n\nLatest User Message: ${message}` }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: { type: Type.STRING },
                  parsedLog: {
                    type: Type.OBJECT,
                    properties: {
                      loggedType: { type: Type.STRING },
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
          return res.json(resultData);
        }
      } catch (err: any) {
        console.error("Custom LLM Provider Execution failed:", err);
        return res.status(500).json({
          error: "Custom LLM Plugin API connection failed.",
          details: err?.message || "Verify your Base URL, API Key, Model name, or network status."
        });
      }
    }

    // 2. Default standard fallback behavior (using Server's env GEMINI_API_KEY)
    if (!ai) {
      // Return a pleasant offline response if API key is not ready
      return res.json({
        reply: "EVE is currently operating in offline backup mode. Click the ⚙️ plugin icon inside the EVE chat panel to link your own LLM API or Gemini Key directly!",
        parsedLog: { loggedType: "none", details: null }
      });
    }

    try {
      // Prepare user history if present
      const formattedHistory = Array.isArray(history) 
        ? history.map((h: any) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
        : "";

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

  // API endpoint for reading and analyzing a training syllabus / manual PDF/TXT/CSV/XLSX
  app.post("/api/analyze-syllabus", async (req, res) => {
    const { fileBase64, fileName, mimeType, textContent, customLlmConfig } = req.body;

    // Helper fallback parser if AI is unavailable
    const runFallbackParser = (text: string) => {
      const goals: string[] = [];
      const skills: string[] = [];
      const lower = text.toLowerCase();

      // Basic regex or keyword matches for training purposes
      if (lower.includes("bark") || lower.includes("quiet")) {
        goals.push("De-escalate barking triggers");
        skills.push("Quiet / Speak");
      }
      if (lower.includes("leash") || lower.includes("walk") || lower.includes("pull")) {
        goals.push("Perfect loose leash walking around distractions");
        skills.push("Leash Walk");
      }
      if (lower.includes("bite") || lower.includes("mouth") || lower.includes("chew")) {
        goals.push("Address high-excitement mouthiness & teething");
        skills.push("Leave It");
      }
      if (lower.includes("crate") || lower.includes("separation") || lower.includes("alone")) {
        goals.push("Build confidence staying in the crate up to 3 hours");
        skills.push("Crate Training");
      }
      if (lower.includes("recall") || lower.includes("come")) {
        goals.push("Establish 100% reliable recall response on long lead");
        skills.push("Recall (Come)");
      }
      if (lower.includes("heel") || lower.includes("walk close")) {
        goals.push("Maintain shoulder-to-leg heel position during walks");
        skills.push("Heel");
      }

      // Default generic ones if none found
      if (goals.length === 0) {
        goals.push("Master basic obedience and household boundary safety");
        goals.push("Strengthen focus and attention around trigger events");
      }
      if (skills.length === 0) {
        skills.push("Sit");
        skills.push("Stay");
        skills.push("Heel");
      }

      return {
        extractedGoals: goals,
        customSkills: skills,
        summary: `Locally analyzed training syllabus document named "${fileName || "Syllabus"}". Extracted key training focal points based on core pet curriculum keywords.`
      };
    };

    const promptText = `You are a dog behaviorist. Analyze this uploaded training document/syllabus sheet.
Extract key training goals and specific skills to configure for the dog profile.
Provide output STRICTLY as valid JSON matching this schema:
{
  "extractedGoals": ["goal 1", "goal 2", ...],
  "customSkills": ["skill 1", "skill 2", ...],
  "summary": "2-sentence objective overview of the training focus"
}`;

    // 1. Hook custom LLM config if enabled
    if (customLlmConfig && customLlmConfig.enabled) {
      try {
        if (customLlmConfig.provider === "openai_compatible") {
          const baseUrl = customLlmConfig.baseUrl || "https://api.openai.com/v1";
          const bearerKey = customLlmConfig.apiKey;
          const modelName = customLlmConfig.model || "gpt-4o-mini";

          const messages = [
            { 
              role: "system", 
              content: "You are a professional dog behavioral training analyst. You extract structured list schemas from uploaded syllabus texts. Respond ONLY in valid JSON." 
            },
            { 
              role: "user", 
              content: `${promptText}\n\nSyllabus Text Context:\n${textContent || "No text provided"}` 
            }
          ];

          const reqHeaders: Record<string, string> = {
            "Content-Type": "application/json"
          };
          if (bearerKey) {
            reqHeaders["Authorization"] = `Bearer ${bearerKey}`;
          }

          const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: reqHeaders,
            body: JSON.stringify({
              model: modelName,
              messages,
              response_format: { type: "json_object" }
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI-compatible parser returned status ${response.status}`);
          }

          const resJson = await response.json();
          const content = resJson?.choices?.[0]?.message?.content || "{}";
          return res.json(JSON.parse(content.trim()));

        } else if (customLlmConfig.provider === "gemini") {
          const customKey = customLlmConfig.apiKey || apiKey;
          if (customKey) {
            const tempAi = new GoogleGenAI({
              apiKey: customKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build-custom-gemini' } }
            });

            const contentParts: any[] = [{ text: promptText }];
            if (fileBase64 && mimeType) {
              contentParts.push({
                inlineData: {
                  mimeType,
                  data: fileBase64
                }
              });
            } else if (textContent) {
              contentParts.push({ text: `Document Syllabus Text: \n${textContent}` });
            }

            const response = await tempAi.models.generateContent({
              model: customLlmConfig.model || "gemini-3.5-flash",
              contents: contentParts,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    extractedGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    customSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    summary: { type: Type.STRING }
                  },
                  required: ["extractedGoals", "customSkills", "summary"]
                }
              }
            });

            return res.json(JSON.parse(response.text || "{}"));
          }
        }
      } catch (err: any) {
        console.warn("Custom LLM Syllabus Parsing failed, running local fallback:", err.message);
        return res.json(runFallbackParser(textContent || fileName || ""));
      }
    }

    // 2. Default API client
    if (!ai) {
      // Offline fallback
      return res.json(runFallbackParser(textContent || fileName || ""));
    }

    try {
      const contentParts: any[] = [{ text: promptText }];

      if (fileBase64 && mimeType) {
        contentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      } else if (textContent) {
        contentParts.push({
          text: `Document Syllabus Text Content:\n${textContent}`
        });
      } else {
        return res.status(400).json({ error: "No document base64 or text data provided." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentParts,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedGoals: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              customSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              summary: {
                type: Type.STRING
              }
            },
            required: ["extractedGoals", "customSkills", "summary"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);

    } catch (err: any) {
      console.warn("Gemini Syllabus Analysis failed, executing local analyzer fallback:", err);
      res.json(runFallbackParser(textContent || fileName || ""));
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
