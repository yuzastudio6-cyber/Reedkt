# Edit Level Source Understanding UI

RP-EDITLEVEL-06 adds compact source-understanding summaries to available Edit Level UI surfaces.

Visible UI should show:

- source understanding depth;
- transcript policy;
- visual policy;
- audio policy;
- graphic/text policy;
- marker context window;
- future-gated source layers;
- fallbacks and no-execution boundary.

React components must use browser-safe `src/lib/edit-level-source-understanding-*` helpers only. They must not import `src/backend/**`, MockDatabase, repositories, route handlers, provider/model clients, secrets, runtime config, or media tooling.

Missing legacy surfaces remain reported rather than created: `src/components/projects/*`, `src/lib/internal-testing-scenarios.ts`, video-context docs, ProjectHome, and ProjectEditSession pages are absent in this checkout.
