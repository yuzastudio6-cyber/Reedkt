# Provider Gateway Gate Contract

Future provider execution must pass these gates before any transport call.

| Gate | Required records | Pass condition | Fail status |
| --- | --- | --- | --- |
| AuthGate | authenticated user | user context exists | `blocked` |
| WorkspaceGate | workspace/member | caller belongs to workspace | `blocked` |
| ProjectAccessGate | `projects`, `workspace_members` | project access verified | `backend_required` or `blocked` |
| ApprovedSnapshotGate | `approved_plan_snapshots` | immutable approved snapshot is present | `blocked` |
| CreditEstimateApprovalGate | `credit_estimates`, `approval_records` | estimate is approved | `blocked` |
| CreditReservationGate | `credit_reservations` | active reservation matches scope | `blocked` |
| JobReadinessGate | `jobs` | future job is ready and idempotent | `backend_required` |
| WorkerClaimGate | worker claim/lease records | future worker claim is active | `backend_required` |
| WorkerExecutionBlockedGate | worker runtime policy | worker execution remains blocked until future milestone | `backend_required` |
| MediaReadinessGate | media/source readiness records | referenced media is ready | `backend_required` |
| StorageObjectGate | `storage_object_records` | storage inputs/outputs use canonical records only | `backend_required` |
| PromptApprovalGate | approved prompt/snapshot references | prompt is derived from approved plan | `blocked` |
| PromptSafetyGate | sanitized prompt metadata | no secrets, unsafe raw payloads, or unapproved raw chat | `blocked` |
| ProviderCatalogGate | provider catalog/model metadata | provider/model exists and policy allows route | `blocked` |
| ProviderModelPolicyGate | model policy | tier/fallback policy permits future model use | `blocked` |
| ProviderTierPolicyGate | approved snapshot tier | Basic/Pro no-Veo and Premium fallback-only Veo rules hold | `blocked` |
| ProviderSecretReferenceGate | secret reference label | only reference label is present; no secret value is exposed | `backend_required` |
| ProviderTransportGate | future transport runtime | reviewed provider transport exists | `backend_required` |
| ProviderWebhookVerificationGate | webhook summary/verifier | signature verification is implemented and passes | `backend_required` |
| ProviderOutputStorageGate | storage records | output target is private canonical storage record | `backend_required` |
| ProviderQAGate | `qa_reports` / blockers | QA/provenance requirements are satisfied | `backend_required` |
| ProvenanceGate | provider attempt/output summaries | provenance can be shown without raw payloads | `backend_required` |
| RetryBudgetGate | retry policy | attempts remain within approved retry budget | `blocked` |
| IdempotencyGate | `api_idempotency_keys` | mutation boundary has idempotency key | `blocked` |
| CostLimitGate | credit/cost policy | request fits approved cost envelope | `blocked` |
| AbusePreventionGate | abuse/rate policy | request is within policy | `backend_required` |
| ProductionUnlockGate | deployment/feature policy | explicit future production unlock exists | `blocked` |

Failures should use concise user-facing messages that explain the blocked dependency without exposing secret names, raw provider payloads, internal keys, or private media paths.
