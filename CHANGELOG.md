# PawsPilot Project Changelog (Build 1.0 - 3.0)

## Build 1.0: Foundation
- Implemented core EVE chatbot personality (objective, calm, professional).
- Integrated local Gemini API for training session and milestone parsing.
- Created local persistence layer using SQLite/Knex.
- Setup standard browser-based speech recognition and TTS.

## Build 2.0: User Autonomy & Competition
- **Authentication:** Added user registration, login (bcryptjs), and JWT session management.
- **Dog Profile Management:** CRUD operations for dogs linked to authenticated users.
- **Achievement Tracking:** Added achievement scoring system per dog.
- **Social Leaderboard:** Created `/api/leaderboard` API endpoint to aggregate scores.
- **GitHub Integration:** Established synchronization with repository `cnote56/PawsPilot`.

## Build 3.0: The CONSENSUS Event (Planned)
- **Community-Driven Ranking:** Transitioning from simple score aggregation to a community-validated consensus system.
- **Event-Based Architecture:** Schema expansion to include event registration and multi-user verification.
- **Hybrid Scoring:** Implementation of individual achievement scores weighted by community consensus.
- **Goal:** Drive user retention by turning individual training logs into collaborative, shared digital exhibitions.

---
*Generated: 2026-05-30*
