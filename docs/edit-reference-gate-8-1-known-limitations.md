# Gate 8.1 Known Limitations

Status: `feature_complete_except_external_blocker`

- `productionReady` remains `false`.
- The raw Supabase migration baseline remains fail-closed; no schema, RLS, tenancy, staging, or remote persistence claim is made.
- Dynamic Project Edit Sessions and Edit Briefs remain browser-mock data. Reload recovery reconstructs their minimum shell from canonical backend-local application/history identity; it is not cross-device session persistence.
- FFprobe/FFmpeg media structure and representative-frame planning are verified local. Semantic frame understanding is not.
- Qwen visual/story adapters are live-capable historical registry entries but were not called in Gate 8.1. No credential or paid call was authorized.
- OCR/caption timing, transcript/alignment, frame-derived color analysis, semantic audio/SFX analysis, and graphics/motion analysis remain degraded or blocked with explicit retry provenance.
- Manual evidence fallback is user-asserted and cannot become a false live/local claim.
- No reference footage, exact captions, exact sequence, creator identity, copyrighted music/SFX, layouts, or brand assets transfer to a target.
- No distributed workers, production observability, retention automation, provider cost reconciliation, customer billing, credits, render, export, or deployment is active.
- No push or PR is part of this gate.

These are external/runtime and production-authority blockers, not hidden local wiring gaps. The local application, lifecycle, fallback, privacy, DNA, QA, and adaptation paths are complete and tested.
