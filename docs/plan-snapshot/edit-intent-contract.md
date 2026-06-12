# Edit Intent Contract

Status: `ready_for_owner_review`.

The approved plan snapshot must preserve compiled edit intent. It must not rely on raw chat as an execution instruction.

## Required Intent Fields

Future `editIntents` should include:

- `intentId`
- `sourceRequestRef`
- `workflowContext`
- `editLevel`
- `confirmedAspectRatio`
- `sourceSequenceRefs`
- `referenceDnaRefs`
- `customDirectiveRefs`
- `professionalEditingDirective`
- `timingRequirements`
- `visualSystemRequests`
- `audioSystemRequests`
- `creditEstimateRef`
- `approvalRecordRef`
- `blockedUses`

## Intent Rules

- Explicit user instructions have priority unless blocked by safety, tier, model, frame, or platform rules.
- Aspect ratio must be confirmed before final approval.
- Timing, captions, trim decisions, visual systems, audio systems, and credit estimates must be frozen in approved snapshots.
- Future workers must execute the approved snapshot and must not reinterpret raw chat.

## Execution State

PLAN-SNAPSHOT-0 is contract-only and keeps:

- `rawPromptExecutionApproved: false`
- `workerExecutionApproved: false`
- `toolExecutionApproved: false`
- `routeExecutionApproved: false`
- `providerRuntimeApproved: false`

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
