# Project Findings - Dog Training Tracker & Chatbot

## Research & Discoveries

1. **User Goal**: A voice-friendly dog training chatbot and tracker designed for owners who are active, e.g., walking or training their dogs and cannot easily look at or touch their screen.
2. **Core Capabilities Required**:
   - Chatbot UI with highly readable text, clear auditory-style interaction (or text interaction optimized for quick view).
   - Voice feedback or simulated TTS option if needed, plus simple quick-add action logs for common training commands (e.g., Sit, Stay, Come, Heel) so they can use simple voice/input and the chatbot parses it into logs.
   - Comprehensive data export forms: PDF-friendly printable layout, Excel (CSV formats), Markdown, and JSON.
   - Tracking dashboard to visualize progress over time (charts with d3/recharts).
3. **Constraints**:
   - Must run in React + Express Vite full-stack server-side setup so that Gemini API keys are fully protected on the backend.
   - No external databases requested, so we should build a simple, clean local data store (such as standard modular file persistence or robust memory/localStorage/server SQLite/JSON file on the server) that persists values cleanly.
