# AI Graphics External-Beta Evidence Scaffold

Decision: `ai_graphics_external_beta_evidence_scaffold_prepared_for_local_private_records`

This scaffold creates local-only templates for collecting the external-beta evidence needed by all 21 AI graphics tools. It is external-facing in purpose: the output tells the beta-readiness operator exactly which private refs must exist before a tool can become an external-beta candidate.

## Current Result

- Tools covered: `21`
- Scaffold records prepared: `21`
- Committed evidence records accepted: `0`
- Generated template evidence records accepted: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## How To Use

Run:

`npm run --silent ai-graphics:external-beta-evidence-scaffold -- --out-dir "$REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ROOT"`

The scaffold writes:

- `external-beta-evidence-records.template.json`
- `external-beta-evidence-collection-checklist.json`
- `EXTERNAL_BETA_EVIDENCE_COLLECTION_CHECKLIST.md`
- `<tool>/external-beta-evidence-record.json` for every AI graphics tool

The generated refs intentionally use rejected `public://replace-with-private-evidence/...` placeholders. Replace every placeholder with private/backend evidence refs before validating with `ai-graphics:external-beta-evidence-packet:validate`.

## Required Evidence Classes

- `internal_runtime_soak`
- `external_beta_qa`
- `cost_concurrency_privacy_rollback`
- `incident_response`
- `external_beta_owner_approval`

## Runtime Boundary

This scaffold does not approve runtime. Agent planning remains allowed, while agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/GCS, signed URLs, public artifacts, internal beta, external beta, and production remain false.
