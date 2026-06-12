# PLAN-SNAPSHOT-0 Approved Plan Snapshot Contract

Status: `ready_for_owner_review`.

Decision state: `ready_for_owner_review`.

Capability enabled: `none; approved plan snapshot contract only`.

## Purpose

PLAN-SNAPSHOT-0 creates the contract layer between passed synthetic provider evidence and a future approved plan snapshot. It does not create a live snapshot, execute a worker, execute a tool, call a route, call a provider, mutate Supabase, run SQL, move storage, create signed URLs, create public artifacts, unlock beta, or unlock production.

The contract preserves the existing ReeditPro rule: workers execute approved snapshots, not raw chat. A snapshot is usable only after the required owner review and later execution gates approve it.

## Source Evidence

MODEL-DRYRUN-2A is the current source evidence:

- final state: `provider_dry_run_passed`
- Qwen/DashScope: `passed`
- DeepSeek: `passed`
- provider calls attempted: `7`
- total tokens reported: `2871`
- max total tokens: `7200`
- cost guardrail: `passed_by_call_and_token_caps`
- Qwen model: `qwen3.7-plus`
- Qwen mode: `non_streaming`
- Qwen timeout: `45000ms`
- Qwen max output tokens: `650`
- Qwen thinking control: `enable_thinking: false`
- plan snapshot contract readiness: `true`

## Contract Boundaries

This prompt only defines fields, evidence references, routing fields, scoring rules, artifact scope rules, and future gates.

Every execution approval boolean remains false:

- `workerExecutionApproved: false`
- `toolExecutionApproved: false`
- `routeExecutionApproved: false`
- `providerRuntimeApproved: false`
- `supabaseMutationApproved: false`
- `publicArtifactsApproved: false`
- `signedUrlsApproved: false`
- `rawPromptExecutionApproved: false`
- `internalBetaApproved: false`
- `externalBetaApproved: false`
- `productionApproved: false`

## Artifact Source Of Truth

Signed URLs must not become source of truth.

The future artifact source of truth is exactly:

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

PLAN-SNAPSHOT-0 records only placeholders and committed sanitized evidence. It does not perform storage transfer, fetch Secret Manager payloads, upload private artifacts, or create signed URLs.

## Base Gaps

The MODEL-DRYRUN-2A base does not include these broad foundation files, so PLAN-SNAPSHOT-0 records them as base gaps instead of fabricating them:

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/implementation-prompts/README.md`
- `docs/cross-chat/`
- `docs/runtime-unlock/`
- `.github/workflows/`
- `scripts/validation/run-foundation-validation.mjs`

## Next Gate

Recommended next prompt: `PLAN-SNAPSHOT-1 - Approved Plan Snapshot Dry-Run Fixture Contract`.

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
