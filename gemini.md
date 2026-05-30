# Project Constitution - Dog Training Tracker & Chatbot

This is the system's single source of truth for architectural invariants, behavioral rules, and JSON schemas.

## Data Schemas

### 1. Dog Profile (`DogProfile`)
```json
{
  "id": "string",
  "name": "string",
  "breed": "string",
  "birthdate": "string",
  "weight": "number",
  "goals": ["string"]
}
```

### 2. Training Log Record (`TrainingLog`)
```json
{
  "id": "string",
  "dogId": "string",
  "timestamp": "ISO-string",
  "skill": "string", // e.g. "Sit", "Stay", "Heel", "Recall", "Leash Walking"
  "status": "success" | "in_progress" | "needs_work",
  "notes": "string",
  "durationMinutes": "number"
}
```

### 3. Behavioral Milestone (`Milestone`)
```json
{
  "id": "string",
  "dogId": "string",
  "title": "string", // e.g. "Housebroken", "First Recall Outside"
  "dateEarned": "ISO-string",
  "notes": "string"
}
```

### 4. Interactive Chat Session (`ChatMessage`)
```json
{
  "id": "string",
  "sender": "user" | "assistant",
  "text": "string",
  "timestamp": "ISO-string",
  "parsedActionLog": {
    "loggedType": "training" | "milestone" | "none",
    "details": "any"
  }
}
```

## Behavioral Rules

1. **Voice-Friendly Chatbot Input**: Since the owner might be hands-busy, the chatbot must support:
   - Voice dictation / Speech Recognition (using standard browser Web Speech API `webkitSpeechRecognition` with clean toggle).
   - Simple voice-like natural commands (e.g. "log that buddy did a great job on heel training for 5 minutes").
   - Smart AI parser to extract training parameters (skill, performance status, duration, notes) from conversational text, making hands-free verbal logging possible!
   - Instant auditory-style confirmation (or clear readable large feedback cards).
2. **Deterministic Data Engine**: The backend must process AI logs deterministically. If AI parses training, show a modal for positive review or save directly to local storage state.
3. **Multi-Format Exports**: Exports must support:
   - PDF (Printable HTML view styled for clean layout with zero navigation noise).
   - Excel / CSV (Standard comma-separated table structure with automatic download).
   - Markdown progress reports beautifully composed by standard formatting.
   - Raw JSON data export for developer/power user.
4. **Architectural Invariants**:
   - Zero-exposed API keys.
   - Clean separation of routes `/api/dog/*` and `/api/gemini/*`.
   - Local state engine with JSON persistence or server storage to maintain training logs across sessions.
