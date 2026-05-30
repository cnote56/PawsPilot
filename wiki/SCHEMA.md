# LLM Wiki: PawsPilot
- **Purpose:** A persistent knowledge base for PawsPilot development, tracking roadmap, architecture, and behavioral training insights.
- **Root Directory:** `C:/Users/Cole/PawsPilot_REDUX/wiki/`
- **Conventions:**
    - `index.md`: Central catalog, updated by agent on every ingest.
    - `log.md`: Chronological history of actions, ingests, and analysis.
    - `SCHEMA.md`: This file, detailing the structure and maintenance protocols.
- **Workflow:**
    1. **Ingest:** New technical docs or training data are added to `wiki/raw/`. Agent processes them into the wiki.
    2. **Maintain:** Agent updates `index.md`, cross-links related pages, and flags contradictions in `log.md`.
    3. **Query:** User asks questions; Agent synthesizes answers from the wiki, potentially generating new pages from these insights.
- **Maintenance:** Run 'health-checks' (linting) periodically to identify orphans or inconsistencies.
