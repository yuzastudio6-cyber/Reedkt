# PROVIDER-1 DeepSeek/Qwen API Approval Policy Results

Status: `completed`

Branch: `codex/rp-provider-1-deepseek-qwen-api-approval-policy`

PR: `#307`

Base: `codex/rp-provider-0-provider-gateway-models-repo-audit`

Run ID: `provider1-20260612T145544`

## Registry Prerequisite

SUPABASE-REGISTRY-1 restored the Phase 51B/51D activation milestone registry
before this rerun.

- PR: `#315`
- Restoration run ID: `registry1-20260612T142645`
- Approved target: `Reeditpro / wmyyttnynmteqgcdishd / staging`
- Registry status: all six tables visible through service-role zero-row
  PostgREST probes
- Provider-1 handoff: `ready_to_rerun_PROVIDER_1_milestone_sync`

## Execution

Guarded PROVIDER-1 execution ran with staging confirmation gates and Supabase
payload environment variables explicitly unset so the Phase 51D path resolved
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Google Secret Manager.
Secret values were not printed, stored, logged, or written to repo artifacts.

- Execution status: `completed`
- QA status: `passed`
- PROVIDER-2 readiness: `ready_for_provider_fixture_adapters_normalizers`
- Supabase milestone sync: `completed`
- Supabase readback: `passed`
- Provider artifacts uploaded: `15`

No SQL, migration, schema/RLS change, provider call, model inference, worker
execution, tool execution, media processing, public artifact, signed URL source
of truth, production unlock, external beta unlock, paid production unlock, or
broad media unlock occurred.

## Cross-Chat Ownership Check

- Workstream owner: `PROVIDER_GATEWAY_MODELS`
- Related workstreams: `WORKER_RUNTIME_JOBS`, `TRACK_A_RENDER_EXPORT`,
  `TRACK_B_MEDIA_PROCESSING`, `AI_TOOLS_CREATIVE_GRAPHICS`,
  `MAP_GEOSPATIAL`, `SOUND_MUSIC_AUDIO`, `SUPABASE_RLS_STORAGE_DATABASE`,
  `COMPLIANCE_SECURITY`, `OBSERVABILITY_AUDIT_COST`, `FRONTEND_PRODUCT_UX`,
  `BILLING_STRIPE_CREDITS`
- Explicitly not owned: worker execution, Track A render/export execution,
  Track B media/model runtime, AI Tools graphics implementation, Supabase
  schema/RLS/migrations, frontend UX, billing, compliance implementation, and
  observability implementation
- Integration points: Provider Gateway policy, model secret references,
  approved plan snapshots, agent findings/edit intents, tool capability
  registry, Worker Runtime contracts, Supabase milestone sync, and cost controls

## Policy Summary

DeepSeek policy:

- `deepseek-v4-pro` is approved policy-only as a coding/spec/tool-implementation
  proposal specialist.
- `deepseek-v4-flash` is recorded only as a future cheaper/simple coding
  fallback candidate.
- Direct execution, shell command execution instructions, worker execution,
  provider chaining, secret handling, private media analysis, Supabase schema
  mutation, and frontend service-role exposure remain blocked.

Qwen policy:

- `qwen3.7-max` is approved policy-only as a head editing, planning, and
  decision agent candidate.
- Snapshots `qwen3.7-max-2026-06-08` and `qwen3.7-max-2026-05-20` remain
  recorded.
- Qwen can produce structured findings, edit intents, professional edit
  scoring, tool route requests, and blocked decision summaries only.
- Direct worker execution, direct tool calls, raw prompt execution, direct
  provider chaining, code patching, secret handling, and private media
  ingestion without future approval remain blocked.

Secret policy:

- Provider key payloads remain backend-only and out of PROVIDER-1.
- DeepSeek records only `GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME` reference
  metadata for `DEEPSEEK_API_KEY` semantics.
- Qwen records only `GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME` reference
  metadata for `DASHSCOPE_API_KEY` semantics; `QWEN_API_KEY` remains an
  alternate future name to verify only if a later provider path chooses it.
- PROVIDER-1 did not create, read, print, log, or store provider secret
  payloads.

Data policy:

- Qwen is limited to sanitized video evidence manifests, shot/timeline
  summaries, tool capability summaries, safe user edit instructions,
  professional editing schemas, and non-sensitive project context.
- DeepSeek is limited to sanitized coding task manifests, small safe interface
  definitions, redacted test failure summaries, generated fixture data, and
  tool/spec descriptions.
- Raw media, signed URLs as source of truth, service-role keys, database URLs,
  provider keys, Stripe keys, private media URLs, raw Supabase rows, unredacted
  sensitive transcripts, and raw provider payload storage are blocked.

Cost and routing policy:

- PROVIDER-1 budget remains `$0`.
- Future live validation defaults remain max calls `1`, retry limit `0`,
  timeout `60000ms`, no automatic fallback, no production paid calls, sanitized
  summary storage only, and official pricing recheck before nonzero spend.
- Qwen may produce structured findings/intents only.
- DeepSeek may produce coding/spec proposals only.
- Workers continue to execute approved plan snapshots only.

Storage policy:

- Private GCS is the only artifact source of truth.
- Public artifacts and signed URLs as source of truth remain blocked.
- The requested risk artifact path is `risk/provider-risk-register.json`.

## Artifacts

Generated-assets bucket:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/audit/repo-ownership-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/evidence/deepseek-v4-approval-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/evidence/qwen37-max-approval-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/policy/provider-secret-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/policy/provider-data-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/policy/provider-cost-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/policy/provider-routing-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/policy/provider-storage-policy.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/risk/provider-risk-register.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/roadmap/provider-next-phase-plan.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/manifest/provider-model-approval-manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/supabase/provider1-milestone-sync-input.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-provider-gateway/provider1/provider1-20260612T145544/supabase/provider1-milestone-sync-result.json`

QA bucket:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-provider-gateway/provider1/provider1-20260612T145544/qa/provider-model-approval-policy-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-provider-gateway/provider1/provider1-20260612T145544/reports/provider1-report.json`

## QA And Validation

Provider-1 QA gates passed:

- `provider0_evidence`
- `model_identity_recorded`
- `deepseek_policy_defined`
- `qwen_policy_defined`
- `secret_policy`
- `data_policy`
- `cost_policy`
- `routing_policy`
- `storage_policy`
- `blocked_features`
- `supabase_milestone_sync`

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
- `git diff --check`
- `git diff --cached --check`

Expected / non-blocking:

- `npm run activation:model-orchestration-dry-run-approval:report || true`
  reports the script is absent on this Provider-0 base.
- `npm run activation:model-orchestration-qwen-deepseek-audit:report || true`
  reports the script is absent on this Provider-0 base.
- `npm run build:server` remains blocked by inherited base issues: missing
  `sharp`, `jsdom`, `@mozilla/readability`, and `@turf/turf` modules/types,
  plus existing TS18046 `unknown` errors in readability sanitizer/extraction
  modules.

## Supabase Milestone Sync

Status: `completed`

Input validation: passed.

Milestone bundle validation: passed.

Registry schema verification: completed.

Milestone write/readback: passed.

Write summary:

- `activation_runs`: write/readback matched
- `activation_artifacts`: `15` artifact rows written
- `activation_qa_gates`: `11` QA gate rows written
- `readiness_snapshots`: `1` readiness row written
- `tool_capabilities`: `1` tool capability row written
- `feature_gates`: `25` disabled feature gate rows written
- SQL executed: false
- Migration deployed: false
- Schema/RLS changes: false
- Historical backfill rerun: false
- Unrelated Supabase rows written: false

Supabase access method: Phase 51D sync layer with Google Secret Manager
credential resolution and service-role zero-row registry probes/readback.

Supabase update classification:

- Supabase update required: staging milestone sync
- Supabase update status: `applied_to_staging`
- Supabase environment touched: staging
- SQL executed: false
- Migration deployed: false
- Schema/RLS/Data API changes: false
- Rows written: Provider-1 milestone registry metadata only
- Evidence docs: this Provider-1 report and PR #315 registry restoration proof
- Blockers: none
- Next Supabase action: none for Provider-1; Provider-2 may proceed to fixture
  adapters/normalizers

## PROVIDER-2 Readiness

Ready for provider fixture adapters/normalizers.

Allowed next phase: PROVIDER-2 may add fixture adapters and normalizers only.
Real provider calls, provider secret payload reads, provider chaining, worker
execution, production, external beta, broad media, and public artifacts remain
blocked.

## Safety Audit

No DeepSeek call, Qwen call, provider API key, provider secret payload read,
provider/model/tool/worker/runtime execution, media processing, web search,
browser capture, map rendering, Docker/Cloud Run action, SQL migration,
schema/RLS change, unrelated Supabase row write, public artifact, signed URL
source-of-truth, raw prompt execution, production unlock, external beta unlock,
paid production unlock, broad media unlock, or package-lock mutation occurred.

## Human Action Required

None for PROVIDER-1. Handoff to `PROVIDER_GATEWAY_MODELS` for PROVIDER-2
fixture adapters and normalizers.
