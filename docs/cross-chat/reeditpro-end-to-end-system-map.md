# ReeditPro End-To-End System Map

Status: `docs_only`.

This map shows how workstreams connect. It is not a runtime implementation.

1. User request enters the chat-native product flow.
2. Planning compiles user intent, source order, workflow context, frame/aspect ratio, timing, quality, and tool/provider needs.
3. Approved plan snapshot freezes scope, credit estimate, timing, asset strategy, and worker-safe execution instructions.
4. Credits reserve/spend/refund gates must pass before expensive work.
5. Jobs/workers later claim approved work through leases and idempotency, not raw chat.
6. AI Tools, map/geospatial, providers, and media processing produce only approved artifacts through their owned workstreams.
7. Private artifacts remain in private storage with manifests as source of truth.
8. QA/revision checks compare outputs against user intent, approved plan, safety, timing, and professional standards.
9. Track A handles final render/preview/export validation.
10. Observability, audit, abuse prevention, and cost controls record future runtime evidence.
11. Supabase milestone sync records structured readiness/status metadata when approved.
12. Beta readiness gates decide whether controlled internal, external beta, or production can proceed.

XCHAT-0 adds coordination docs only. It does not execute any step.
