# RP-EDITLEVEL-10 Next Testing Plan

Recommended next prompt: RP-EDITLEVEL-10 - End-to-End Internal Testing + Playwright Coverage.

RP10 should consolidate Edit Level internal testing across RP04-RP09 visible UI paths, browser-safe adapters, mock backend orchestrators, and focused Playwright coverage. It should remain mock/local unless a later prompt explicitly authorizes production persistence, provider execution, worker dispatch, render/export, or credit execution.

Suggested RP10 checks:

- verify `/projects/new` level selection through UI cards, tool routing, source understanding, Qwen planning, QA gates, and estimates;
- verify the inline editor setup path keeps canonical-to-legacy mapping stable;
- verify Edit Brief summaries remain compact and do not overflow;
- verify no progress, render, export, credit spend, credit record, worker, provider call, file-byte read, or external fetch UI is implied;
- report missing legacy placeholders instead of creating them.

Known absent legacy surfaces in this checkout include `docs/reeditpro-tool-stack-integration-registry.md`, `docs/reeditpro-mock-vs-real-board.md`, `docs/reeditpro-milestone-dependency-graph.md`, project edit brief/session next-production docs, `src/lib/internal-testing-scenarios.ts`, and `src/components/projects/*`.
