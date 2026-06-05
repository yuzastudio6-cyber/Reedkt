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
