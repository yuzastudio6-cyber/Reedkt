# Agent-To-Tool Routing Policy

Agents produce findings and edit intents only. The coordinator turns accepted intents into candidate plans. Producer checks scope, cost, readiness, permissions, and privacy. QA/Safety checks policy, artifact privacy, hallucination risk, and blocked features. Future workers execute only approved plan snapshots.

Routing boundaries:

- Graphics/Design Agent routes creative graphics to AI Tools manifests.
- Map/Location Agent routes geospatial plans to map stack manifests.
- Search/Research Agent routes source/capture/extraction to web search manifests.
- Audio Agent routes audio intents to Track B manifests.
- Colorist, Compositor/VFX, Motion, and Editor agents route visual-video intents to Track A manifests.
- VLM-dependent intents respect Track B VLM exclusion until resolved.
- Demucs-dependent intents respect the Demucs provenance blocker until resolved.

Blocked routes: direct agent-to-tool execution, raw prompt worker execution, unrestricted provider fallback, production, external beta, and broad media.

Phase 52D materializes this policy as bridge metadata only. Allowed Phase 52C intents become `candidate_plan_only` approved-plan snapshot candidates, while AI Tools-owned graphics and Track B-owned audio/VLM intents become handoff or blocked records.
