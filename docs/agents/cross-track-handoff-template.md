# Cross-Track Handoff Template

Every cross-track handoff should include:

- phase name
- branch/PR/base
- tool ownership
- capabilities added
- readiness status
- artifacts
- blocked features
- dependency changes
- package-lock status
- required env/secrets
- manual actions
- downstream readiness
- next phase recommendation
- consumer notes for other chats
- capability manifest updates required

Rules:

- State owner and consumer boundaries explicitly.
- Distinguish source-of-truth artifacts from previews.
- Do not include secrets or public/signed URLs as source of truth.
- Preserve production, external beta, paid production, and broad media blockers unless a later gate explicitly clears them.

Phase 52D emits handoff packets for Track A, web search, map/geospatial, AI Tools graphics, Track B audio/VLM, Worker Runtime, and Supabase milestone sync. Those packets are coordination artifacts, not execution authorization.

Phase 52F emits owner-specific system readiness handoff packets for AI Tools, map/geospatial, sound/music/audio, Track A, Track B, Supabase, Provider Gateway, Worker Runtime, Compliance/Security, Observability/Audit/Cost, Frontend UX, and Billing/Credits. Those packets are controlled internal test planning artifacts only; they do not authorize tools, workers, providers, models, production, external beta, or broad media.

Phase 52G emits owner prompt packets for those same workstreams and records the go/no-go decision. Handoff recipients must return readiness, blockers, validation expectations, Supabase update classification, and blocked-feature confirmation before any later phase considers execution.
