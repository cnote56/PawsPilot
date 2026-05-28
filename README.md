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

## 🚀 How to Try It Out

You can open the development or preview link in your browser to experience PawsPilot immediately:

1.  **Set Up a Dog Profile:**
    *   Expand or click **Edit Profile** at the top left to customize your dog's name, breed, birth date, and goals.
    *   Save details to verify immediate reactivity across live state cards.
2.  **Conduct a Live Chat Logging & Speech Test:**
    *   Toggle **Voice Readout (TTS)** to `ENABLED` using the speaker control indicators at the top of EVE's chat window.
    *   Click **🎙️ Mic Dictation** (ensure browser frame permissions for `microphone` are approved if prompted).
    *   Speak or type: *"We worked on loose leash walking for 10 minutes and it went awesome"* and hit Enter/Send.
    *   Watch EVE process the spoken text, create an automatic entry in the **Training Activity Reports** with a rating indicator, and speak her confirmation aloud to you.
3.  **Try one-tap Walk buttons:**
    *   While walking, tap one of the large blue quick skill buttons like **Recall** or **Heel**.
    *   An instant 5-minute success audit will register directly on your graphs in real time.
4.  **Produce Data Outputs:**
    *   Click **Markdown Report** to copy formatted progress metrics.
    *   Click **Printable PDF** to examine or print an elegant monochrome summary suitable for dog trainers or clinical practitioners.
    *   Download your records using **CSV Export**.

---

## 🛠️ Local Tech Stack

*   **Frontend Framework:** React 19 + TypeScript
*   **Backend Server:** Express (mediating secure backend Google Gemini requests using the standard official SDK `@google/genai`)
*   **Styling:** Utility-first Tailwind CSS with custom display font "Space Grotesk" and monospaced "JetBrains Mono" metrics
*   **Local Engine Persistence:** Standalone local engine backed safely by persistent LocalStorage modules.
