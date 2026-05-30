# Frontend Implementation Note: Build 3.0 Consensus Mode

To support the "CONSENSUS" event features, please implement the following logic in your frontend components:

### 1. Active Event Detection
*   **Endpoint:** `GET /api/events/active`
*   **Behavior:** 
    *   On page load, query this endpoint.
    *   If the response contains an event object (e.g., `{ id: 1, name: 'Spring Show', status: 'active' }`), render the **Consensus Mode** UI toggle/banner.
    *   If the response is `null`, hide all Consensus-related UI components.

### 2. Consensus Interaction
*   **Endpoint:** `POST /api/events/:id/verify`
*   **Payload:** `{ dogId: number }`
*   **UI Requirement:** 
    *   Only show the "Verify Dog" button when `getActiveEvent` returns a valid active event.
    *   Implement a secondary confirmation dialog before sending the `POST` request to prevent accidental votes.
    *   Ensure the `JWT` cookie is included in the request headers (managed by your authentication provider).

### 3. Leaderboard Visualization
*   **Endpoint:** `GET /api/leaderboard`
*   **Data Usage:**
    *   Use `total_achievement_score` for the base score display.
    *   Display `total_consensus_score` as a "Community Weight" metric.
    *   Ensure the UI reflects the sorted list order provided by the backend, which now includes the community multiplier in the ranking calculation.

---
*For questions regarding the consensus logic, refer to `C:/Users/Cole/.antigravity/consensus_controller.ts`.*