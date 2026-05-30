# PawsPilot — Hands-Free Dog Training Tracker & Chatbot (EVE)

PawsPilot is a deterministic, voice-friendly, hands-free dog training companion and behavioral monitoring dashboard. It is designed specifically for dog owners who are active, multi-tasking, or out on walks with their pets and cannot constantly look at or type on a screen.

The app features **EVE**, an objective, helpful, and exceptionally calm training assistant chatbot that processes typed or spoken commands to automatically register training sessions and behavioral milestones.

---

## 🌟 What This App Does For You

*   **🎙️ Hands-Free Mic Dictation:** Uses standard browser Speech Recognition to let you dictate updates on the go. You can activate dictation, say what you're doing (e.g. *"Log that Buster did sit-stay for 5 minutes with excellent focus today"*), and let EVE parse it into records.
*   **🔊 Voice Readout (Text-to-Speech):** Toggle TTS on to hear EVE read training feedback audibly. This keeps your eyes on your dog, not your device.
*   **🎯 1-Touch Quick Walk loggers (Tactile Walk Companion):** Big, single-tap buttons designed for high-movement situations (like holding a leash) register immediate 5-minute successful entries of core dog skills (*Sit, Stay, Heel, Recall*) instantly.
*   **📊 Comprehensive Analytics**: Includes responsive SVG graphical metrics calculating total weekly minutes trained and skill status distribution ratios.
*   **📥 Comprehensive Data Portability (No Lock-In):**
    *   **CSV Export:** One-button download formatting all logs as standard spreadsheet rows.
    *   **Aesthetic Printable PDF:** Designed specifically with print-friendly CSS styles to print beautiful physical progress reports or export pristine summary PDFs.
    *   **Markdown Progress Brief:** Formats achievements and training objective milestones as markdown sheets for easy copy-pasting into emails or logs.
    *   **JSON Backup & Migration:** Export or import entire local databases in one step to backup or restore information instantly.

---

## 🐺 Behind EVE's Personality

EVE is programmed as an objective, and highly professional assistant. She avoids artificial bubbles, bubbly exclamation marks, or over-enthusiasm, providing high-reliability, distraction-free confirmations so you can focus entirely on your pet's behavioral progress.

---

## 🔌 Custom LLM API Plugin Connections (Ollama / Local / Private Keys)

To make EVE highly customizable and privacy-friendly, you can link the chatbot to your own external LLM endpoint rather than using the default Google AI Studio server context.

### Setup Steps:
1. Tap the **⚙️ API Plugin** configuration toggle button located at the top-right corner of EVE's chat panel.
2. Toggle on the **Enable API Integration Plugin Override** switch.
3. Select your connector model type:
   * **OpenAI-Compatible Chat API:** Perfect for custom endpoints (like **OpenAI, DeepSeek, Groq**) or self-hosted offline models (**Ollama, LM Studio**).
   * **Google Gemini SDK:** Enter your private key (`AIzaSy...`) and customize of any target model (e.g., `gemini-2.5-pro`, `gemini-2.5-flash`, etc.).

---

## 🏆 Competitive Leaderboard & Social Achievements

PawsPilot now features a competitive edge to help drive user retention through social interaction and gamification:

### Achievement Tracking & Social Competition
*   **Dog Achievement System:** Authenticated owners can add achievements to their dogs (e.g., "Fastest Recall", "Best Corder-Collie Agility") with associated scores.
*   **Social Leaderboard:** A centralized API endpoint `/api/leaderboard` tracks all dog performance metrics. It aggregates total scores across all registered achievements, providing an overview of the top-performing dogs and their owners.

### CONSENSUS Dog Show Idea
*   **Concept:** A recurring, community-voted event where users can submit their dogs' achievement profiles. 
*   **Implementation:** The current achievement framework provides the foundation for this. Future iterations will include a voting mechanism for users to rank their peers' dogs based on specific criteria (e.g., "Cleanest Crate Training", "Most Improved Walker").
*   **Goal:** To turn individual training efforts into a collaborative, shared community activity.
4. **Use Handy One-Click Shortcuts:** Custom presets are provided in the settings dialogue so you can auto-configure LM Studio (`http://localhost:1234/v1`), Ollama Local (`http://localhost:11434/v1`), or default cloud services in one click!

## 📁 Syllabus & Training Manual Document Analyzer (PDF / TXT / DOCX / Sheets)

You can automatically import custom training curriculums, school syllabus guidelines, class agendas, or behavior manuals directly into PawsPilot!

### How to Use:
1. Locate the **Syllabus & Training Manual Analyzer** section at the bottom of the Pet Profile Card.
2. Select or drag & drop any training schedule / outline file (`.pdf`, `.txt`, `.docx`, `.xlsx`, `.csv`, `.md`).
3. Alternatively, tap **Paste Text Directly** to paste curriculum instructions copied from your trainer's emails or website.
4. EVE uses Gemini to parse your guidelines, extract up to 5 prioritized dog behavioral goals, and automatically configure them as core profile milestones on your active dashboard!

---

## 🚀 Project Roadmap & History

- [Build 5.0: Predictive Behavioral Intelligence](CHANGELOG.md#build-50-predictive-behavioral-intelligence)
- [Build 4.0: Local Data Portability](CHANGELOG.md#build-40-local-data-portability)
- [Build 3.0: The CONSENSUS Event](CHANGELOG.md#build-30-the-consensus-event-planned)
- [Build 2.0: User Autonomy & Competition](CHANGELOG.md#build-20-user-autonomy--competition)
- [Build 1.0: Foundation](CHANGELOG.md#build-10-foundation)

### Dynamic Gemini Model Name Configuration
-   The `server.ts` file now dynamically configures the Gemini model name using the `GEMINI_MODEL_NAME` environment variable, defaulting to `gemini-3.5-flash` if not specified.
-   An `.env.example` file has been created and the `README.md` updated to guide users on setting `GEMINI_API_KEY` and other environment variables.

### Custom Skills Integration
-   The `/api/chat` endpoint in `server.ts` now accepts a `customSkills` array in the request body, allowing the AI to consider user-defined skills.
-   The `ChatMessage` interface in `PawsPilot/src/types.ts` has been updated to include a `"none"` option for `parsedActionLog.loggedType`.
-   `App.tsx` has been modified to manage custom skills via local state and `localStorage` persistence. The `ALL_SKILLS` constant now combines `PRESET_SKILLS` with `customSkills`, which are sent to the backend during chat interactions.

### Improved Code Quality and Type Safety
-   Robust `try...catch` blocks have been added to `server.ts` for safer JSON parsing of AI responses.
-   Explicit TypeScript interfaces (`ChatHistoryItem`, `CustomSkillItem`, `ParsedLogDetails`, `ChatMessage`) have been defined in `PawsPilot/src/types.ts` to enhance type safety and code readability.
-   The `req.body` in the `/api/chat` endpoint now includes explicit typing, and the `prompt` and `responseSchema` for `parsedLog` in `server.ts` have been refined for better structured AI responses.

### User Authentication and Authorization
-   **User Registration (`/api/register`):** A new endpoint to register users with hashed passwords using `bcryptjs` and stored in a `users` table. Includes input validation for `username`, `email`, and `password`.
-   **User Login (`/api/login`):** An endpoint for user authentication, comparing provided credentials with stored hashes using `bcryptjs.compare`. Issues an `HttpOnly` JWT cookie upon successful authentication.
-   **JWT-Based Session Management:** Integrated `jsonwebtoken` and `cookie-parser` to manage user sessions, allowing secure identification of authenticated users via `user_id` extracted from JWT tokens.
-   **Dog Registration (`/api/dogs` POST):** Allows authenticated users to register their dogs, linking them to the `user_id` from the JWT token. Includes validation for `name` and `breed`.
-   **Update Dog Information (`/api/dogs/:id` PUT):** Enables authenticated users to update their dog's `name` and `breed`. Verifies dog ownership using the `user_id` from the JWT token, ensuring only owners can modify their dog's details.

---

## 🚀 How to Try It Out

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cnote56/PawsPilot.git
   cd PawsPilot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   Create a `.env` file and add your `GEMINI_API_KEY`:
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The server will be accessible at `http://localhost:3001`.*

---

## 🚀 Live Demo & Interaction

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/cnote56/PawsPilot)

You can click the button above to launch an interactive development environment directly in your browser.

---

## 🛠️ Local Tech Stack

*   **Frontend Framework:** React 19 + TypeScript
*   **Backend Server:** Express (mediating secure backend Google Gemini requests using the standard official SDK `@google/genai`)
*   **Styling:** Utility-first Tailwind CSS with custom display font "Space Grotesk" and monospaced "JetBrains Mono" metrics
*   **Local Engine Persistence:** Standalone local engine backed safely by persistent LocalStorage modules.
