# Track B Supabase Milestone Export

Phase 44P writes `docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json` and its schema as a Supabase-ready metadata manifest.

This export is not a Supabase write. It is a committed safe JSON handoff for a future Foundation/Supabase approval phase.

The export includes only:

- Track B phase ids, tool ids, families, and milestone names.
- Readiness/beta status labels.
- Safe branch, PR, commit, report-path, and artifact-prefix references where available.
- Allowed restricted internal scopes and blocked scopes.
- Next-phase recommendations.

The schema and report forbid secrets, service-role keys, provider keys, signed URLs, raw media/audio/frame/transcript/model payloads, private artifact contents, Cloud Run logs, raw prompts, and user PII.

Future Supabase backfill must run in a separate Foundation/Supabase-approved prompt, use only safe metadata, avoid production Supabase, and require explicit current-shell confirmations before any staging Supabase write or SQL execution.
