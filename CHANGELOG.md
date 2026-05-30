# PawsPilot Project Changelog

## Build 4.0: Local Data Portability
- **Storage Bridge:** Implemented `StorageManager` in `.antigravity/` to manage raw state persistence.
- **Automated Sync:** Integrated a 30-minute interval sync in `server.ts` that exports application state (`dogs` and `achievements`) to `C:/Users/Cole/PawsPilot_Sync/pawspilot_state.json`.
- **Portability:** Data is now persisted in a human-readable JSON format locally, allowing for easy future conversions to Markdown, CSV, or PDF.

## Build 3.0: The CONSENSUS Event
- **Schema Expansion:** Added `events` and `event_registrations` tables to `dev.sqlite3` via migration `20260530_create_consensus_tables.cjs`.
- **Consensus Controller:** Initialized modular controller at `.antigravity/consensus_controller.ts` to handle exhibition voting logic.
- **Verification API:** Registered `POST /api/events/:id/verify` route in `server.ts` protected by `verifyToken` middleware.
- **Hybrid Leaderboard:** Refactored `/api/leaderboard` query to implement the weighted scoring algorithm: `TotalAchievementScore * (1 + (TotalConsensusScore * 0.1))`.
- **Automated Testing:** Added `test_consensus.js` in `.antigravity/` to support smoke testing of consensus endpoints.
