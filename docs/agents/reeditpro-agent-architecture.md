# ReeditPro Agent Architecture

Phase 52A defines the shared agent coordination layer for ReeditPro planning. Specialist agents produce structured findings and edit intents only. They do not execute tools, call providers, process media, render maps, launch browsers, or authorize raw prompt execution.

Canonical flow:

1. Specialist agents emit evidence-linked findings.
2. Findings become structured edit intent candidates.
3. The coordinator builds candidate plans from accepted intents.
4. Producer Agent checks cost, scope, readiness, privacy, and permissions.
5. QA/Safety Agent checks policy, artifact privacy, hallucination risk, and blocked features.
6. Workers may execute only an approved plan snapshot in a later approved runtime phase.

Phase 52A is architecture plus private artifact and Supabase milestone-sync evidence only. Production, external beta, paid production, broad media, raw prompt execution, public artifacts, unrestricted providers, and direct agent-to-tool execution remain blocked.

Phase 52C is the first deterministic multi-agent dry-run on this architecture. It uses existing Phase 52A schemas and Phase 52B capability records to emit structured findings, edit-intent candidates, Producer decisions, and QA/Safety decisions without executing any tools, models, providers, media processing, web search, browser capture, or map rendering.

Phase 52D bridges those findings and intents into candidate-only approved-plan snapshot records and cross-track handoff packets. It still does not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, schema changes, Docker, Cloud Run, production, external beta, paid production, or broad media.

Phase 52F reconciles system readiness across workstreams and creates a controlled internal test plan on existing evidence only. It emits readiness records, blocker inventory, risk register, and owner handoff packets, but it does not authorize agents, coordinators, or workers to execute tools directly.
