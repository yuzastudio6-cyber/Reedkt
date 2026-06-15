# SOUND-OSS-TOOLS-0 Stack Inventory Gap Audit

## Summary

Run a docs/diagnostics-only Sound/Music/Audio open-source tool stack inventory, gap audit, and install/proof roadmap. This prompt must read `docs/cross-chat-tool-ownership-registry.md` and `docs/sound-music-audio-cross-chat-duplicate-risk-register.md` before making any recommendation.

No installation, dependency mutation, provider/model calls, tool execution, route execution, worker execution, media processing, Supabase mutation, SQL, signed URL creation, public artifact creation, beta/production unlock, `dry_run_passed`, `generated_local_fixture_passed`, or runtime-readiness claim is allowed.

## Required Ownership Rules

- If a tool is owned by another workstream, SOUND may only reference or hand off that tool.
- If a tool has unclear ownership, mark `ownership_conflict`, write a blocker, and stop before inventory/license/provenance review.
- If a tool is SOUND-owned, move it to inventory, license, provenance, model-weight, and readiness-gap review only.
- Demucs remains blocked unless source-of-truth evidence explicitly clears provenance and model-weight review.
- RNNoise remains inactive unless source-of-truth evidence explicitly reactivates it.
- Lyria, Mirelo SFX V1.5, and MMAudio V2 remain `PROVIDER_GATEWAY_MODELS` primary ownership; SOUND may only define creative/audio semantics and handoff metadata.

## Expected Outputs

- A SOUND-owned stack inventory for `audioflux`, `signalsmith_stretch`, `deepfilternet`, `rnnoise`, `demucs`, `soundtouch`, `rubber_band`, `essentia`, `librosa`, and SOUND-only planning tools.
- A reference-only/handoff-only section for Track A, Track B, AI Graphics, Web Search, Map/Geospatial, Provider Gateway, Worker Runtime, Supabase, Observability, and Billing tools.
- A gap map for install status, runtime proof status, license status, model-weight/provenance status, and owner handoffs.
- A no-install/no-execution roadmap for future owner-approved prompts.

## Required Validation

- Run `npm run cross-chat-tool-ownership:diagnostics`.
- Run `git diff --check` and `git diff --cached --check`.
- If dependency-backed checks are already available without installing dependencies, run the repo's standard lint/typecheck/build commands. If dependencies are missing, do not run `npm ci` without explicit approval.

## Next Decision

- If all ownership is clear: `sound_oss_tools_stack_inventory_gap_audit_ready_for_owner_review`.
- If any ownership is unclear: `sound_oss_tools_stack_inventory_gap_audit_blocked_ownership_conflict`.
- If any source contradicts the no-install/no-execution scope: `sound_oss_tools_stack_inventory_gap_audit_blocked_source_of_truth_conflict`.
