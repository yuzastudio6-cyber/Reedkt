# PROVIDER-1 DeepSeek/Qwen API Approval Policy Results

Status: guarded execution blocked at Supabase milestone registry readiness

Branch: `codex/rp-provider-1-deepseek-qwen-api-approval-policy`

PR: `#307`

Base: `codex/rp-provider-0-provider-gateway-models-repo-audit`

Run ID: `provider1-20260612T131945`

## Execution

Guarded PROVIDER-1 execution ran with staging confirmation gates after gcloud
auth, Secret Manager metadata, and private GCS bucket metadata checks passed.
The execution uploaded Provider-1 private JSON artifacts, resolved Supabase
milestone credentials from Google Secret Manager without printing or storing
secret values, and then stopped before any Supabase milestone write because the
Phase 51D milestone registry tables were not visible through service-role
zero-row REST probes.

Execution status: `blocked`

QA status: `blocked`

PROVIDER-2 execution readiness: `blocked`

Supabase milestone sync: `not_attempted`

Schema blockers:

- `activation_runs`: table missing from `public` schema cache.
- `activation_artifacts`: table missing from `public` schema cache.
- `activation_qa_gates`: table missing from `public` schema cache.
- `readiness_snapshots`: table missing from `public` schema cache.
- `tool_capabilities`: table missing from `public` schema cache.
- `feature_gates`: table missing from `public` schema cache.

No SQL, migration, schema/RLS change, provider call, model inference, worker
execution, tool execution, media processing, public artifact, signed URL source
of truth, production unlock, external beta unlock, paid production unlock, or
broad media unlock occurred.

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
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were resolved only through the
  backend Google Secret Manager path for Phase 51D readiness checks. Values were
  not printed, stored, or written to repo artifacts.

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
- Public artifacts and signed URLs as source of truth remain blocked.
- The requested risk artifact path is
  `risk/provider-risk-register.json`.

## Artifacts

Generated-assets bucket:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/audit/repo-ownership-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/evidence/deepseek-v4-approval-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/evidence/qwen37-max-approval-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/policy/provider-secret-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/policy/provider-data-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/policy/provider-cost-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/policy/provider-routing-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/policy/provider-storage-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/risk/provider-risk-register.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/roadmap/provider-next-phase-plan.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/manifest/provider-model-approval-manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/supabase/provider1-milestone-sync-input.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T131945/supabase/provider1-milestone-sync-result.json`

QA bucket:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-provider-gateway/provider1/provider1-20260612T131945/qa/provider-model-approval-policy-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-provider-gateway/provider1/provider1-20260612T131945/reports/provider1-report.json`

## QA And Validation

Provider-1 QA gates passed for provider evidence, model identity, DeepSeek
policy, Qwen policy, secret policy, data policy, cost policy, routing policy,
storage policy, and blocked features. The mandatory
`supabase_milestone_sync` gate is blocked because the milestone registry tables
are missing or unavailable through the service-role REST schema cache.

Validation passed:

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

Status: `not_attempted`

Input validation: passed.

Milestone bundle validation: passed.

Registry schema verification: blocked.

Milestone write/readback: not attempted because required registry tables were
not visible.

Supabase access method: Phase 51D sync layer with backend-only Secret Manager
credential resolution and service-role zero-row registry probes.

Supabase update classification:

- Supabase update required: staging update candidate.
- Supabase update status: blocked pending milestone registry schema/table
  availability.
- Supabase environment touched: staging credential resolution and read-only
  registry probes only.
- SQL executed: false.
- Migration deployed: false.
- Schema/RLS/Data API changes: false.
- Rows written: none.
- Storage artifacts: private Provider-1 GCS JSON artifacts only.

## PROVIDER-2 Readiness

Static policy readiness: `ready_for_provider_fixture_adapters_normalizers`.

Execution readiness: blocked pending Phase 51D milestone registry availability
and a successful PROVIDER-1 milestone write/readback.

## Safety Audit

No DeepSeek call, Qwen call, provider API key, provider secret payload read,
provider/model/tool/worker/runtime execution, media processing, web search,
browser capture, map rendering, Docker/Cloud Run action, SQL migration,
schema/RLS change, unrelated Supabase row write, public artifact, signed URL
source-of-truth, raw prompt execution, production unlock, external beta unlock,
paid production unlock, broad media unlock, or package-lock mutation occurred.

## Human Action Required

Make the Phase 51D milestone registry tables available in staging through the
approved Supabase migration/schema readiness process, then rerun guarded
PROVIDER-1 execution. This PROVIDER-1 phase must not apply the migration itself.
