# PROVIDER-1 DeepSeek/Qwen API Approval Policy Results

Status: blocked pending gcloud reauthentication

Branch: `codex/rp-provider-1-deepseek-qwen-api-approval-policy`

PR: `#307`

Base: `codex/rp-provider-0-provider-gateway-models-repo-audit`

Static report run ID: `provider1-20260612T000000`

Guarded execution run ID: not allocated; execution stopped before artifact upload
or Supabase milestone sync because gcloud could not refresh credentials in
non-interactive mode.

## Execution

PROVIDER-1 remains a policy-only Provider Gateway approval phase. Guarded
execution was not run because metadata preflight failed before any write-capable
step:

- Active gcloud account: `aiediting@reeditpro.com`.
- Active gcloud project: `reeditpro`.
- `gcloud projects describe reeditpro` failed with non-interactive token
  refresh / reauthentication failure.
- Secret Manager metadata checks for `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` failed for the same gcloud reauthentication
  reason.
- Required local execution env gates were not set in the shell:
  `GCP_PROJECT_ID`, `GCP_REGION`, `REEDITPRO_ENV`,
  `REEDITPRO_CONFIRM_PROVIDER_MODEL_APPROVAL_POLICY`,
  `REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC`, `SUPABASE_URL`, and
  `SUPABASE_SERVICE_ROLE_KEY`.

No secret values were accessed, printed, stored, or written to artifacts.

## Policy Summary

DeepSeek policy:

- `deepseek-v4-pro` approved only as a coding/spec/tool-implementation proposal
  specialist.
- `deepseek-v4-flash` recorded only as a future cheaper/simple coding fallback
  candidate.
- Provider calls, code execution, tool execution, provider chaining, and secret
  handling remain blocked.

Qwen policy:

- `qwen3.7-max` approved only as a head editing/planning/decision agent
  candidate.
- Snapshots `qwen3.7-max-2026-06-08` and `qwen3.7-max-2026-05-20` remain
  recorded.
- Qwen can produce structured findings/intents only; direct worker/tool
  execution remains blocked.

Secret policy:

- Provider key payloads remain backend-only and out of PROVIDER-1.
- Provider secret reference metadata is recorded only for DeepSeek and Qwen
  DashScope semantics.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` may be resolved only by the
  Phase 51D backend/Secret Manager path during confirmed execution.

Data policy:

- Qwen is limited to sanitized evidence manifests, shot/timeline summaries, safe
  edit instructions, professional schemas, and non-sensitive project context.
- DeepSeek is limited to sanitized coding manifests, safe interfaces, test
  summaries, fixture data, and spec descriptions.
- Raw media, signed URLs, secrets, DB URLs, provider keys, Stripe keys, private
  rows, unredacted sensitive transcripts, and raw provider payload storage are
  blocked.

Cost and routing policy:

- PROVIDER-1 budget remains zero.
- Future live validation defaults remain max calls `1`, retry limit `0`,
  timeout `60000ms`, no automatic fallback, no production paid calls, and
  sanitized summary storage only.
- Workers continue to execute approved plan snapshots only.

Storage policy:

- Private GCS is the only artifact source of truth.
- The requested risk artifact path is
  `risk/provider-risk-register.json`.
- Public artifacts and signed URLs as source of truth remain blocked.

## Artifacts

No guarded artifacts were uploaded because execution stopped during gcloud
metadata preflight.

Expected private artifact roots after gcloud reauthentication:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-provider-gateway/provider1/<runId>/`

Expected generated artifacts include the Provider-1 audit, DeepSeek evidence,
Qwen evidence, secret/data/cost/routing/storage policies, risk register,
next-phase roadmap, manifest, Supabase sync input, and Supabase sync result.

Expected QA artifacts include Provider-1 QA and `reports/provider1-report.json`.

## QA And Validation

Passed:

- `npm run smoke:activation-provider-model-approval-policy`
- `npm run activation:provider-model-approval-policy:report`
- `npm run activation:provider-model-approval-policy:iam-plan`
- `npm run activation:provider-model-approval:summary`
- `npm run activation:provider-gateway-models-audit:report`
- `npm run activation:runtime-unlock-roadmap:report`
- `npm run activation:supabase-milestone-sync:report`
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run build`

Expected / non-blocking:

- `npm run activation:provider-agent-integration-coordination:report || true`
  still reports the script is absent on this Provider-0 base.
- `npm run build:server` remains blocked by inherited base issues: missing
  `sharp`, `jsdom`, `@mozilla/readability`, and `@turf/turf` modules/types,
  plus existing TS18046 `unknown` errors in readability sanitizer/extraction
  modules.

## Supabase Milestone Sync

Status: not attempted.

Reason: gcloud reauthentication failed before Secret Manager metadata checks,
private GCS upload, Supabase credential resolution, registry schema probes, or
Phase 51D write/readback could safely run.

Allowed future action: rerun the guarded Provider-1 command only after a valid
non-interactive gcloud account is available for `reeditpro`. Supabase writes
must remain limited to Phase 51D activation milestone registry metadata and
private `gs://` references.

## PROVIDER-2 Readiness

Static policy readiness: `ready_for_provider_fixture_adapters_normalizers`.

Execution readiness: blocked pending guarded Provider-1 execution, private
artifact upload, and Phase 51D milestone sync/readback.

## Safety Audit

No DeepSeek call, Qwen call, provider API key, provider secret payload read,
provider/model/tool/worker/runtime execution, media processing, web search,
browser capture, map rendering, Docker/Cloud Run action, SQL migration,
schema/RLS change, unrelated Supabase row write, public artifact, signed URL
source-of-truth, raw prompt execution, production unlock, external beta unlock,
paid production unlock, broad media unlock, or package-lock mutation occurred.

## Human Action Required

Refresh or select a valid non-interactive gcloud account for project
`reeditpro`, then rerun the guarded Provider-1 execution command.
