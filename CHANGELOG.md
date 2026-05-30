# PawsPilot Project Changelog (Build 3.0 Addendum)

## Build 3.0: The CONSENSUS Event
- **Schema Expansion:** Added `events` and `event_registrations` tables to `dev.sqlite3` via migration `20260530_create_consensus_tables.cjs`.
- **Consensus Controller:** Initialized modular controller at `.antigravity/consensus_controller.ts` to handle exhibition voting logic.
- **Verification API:** Registered `POST /api/events/:id/verify` route in `server.ts` protected by `verifyToken` middleware.
- **Hybrid Leaderboard:** Refactored `/api/leaderboard` query to implement the weighted scoring algorithm: `TotalAchievementScore * (1 + (TotalConsensusScore * 0.1))`.
- **Automated Testing:** Added `test_consensus.js` in `.antigravity/` to support smoke testing of consensus endpoints.
