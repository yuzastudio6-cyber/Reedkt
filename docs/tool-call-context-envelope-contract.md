# Tool-Call Context Envelope Contract

Tool calls must be planned from structured context, not raw chat text. Prompt 12 defines the context envelope used by `/v1/tools/decision/*` and `/v1/tools/call-intents/*` routes.

## Required For Decision Preview

- `workspaceId`
- `projectId`
- `approvedSnapshotId`
- `toolId`
- `whySelected`
- `executionMode`
- `inputTypes`
- `outputTypes`

## Required For Future Intent Creation

- All decision preview fields.
- `creditEstimateId`
- `creditReservationId`
- `requestedAction`
- `Idempotency-Key` request header.

## Optional References

- `toolChainId`
- `mediaAssetId`
- `storageObjectRecordId`
- `renderId`
- `jobId`
- `frameContract`
- `expectedInputs`
- `expectedOutputs`
- `qaRequirements`
- redacted `metadata`

## Safety Rules

- Workers must execute approved plan snapshots, not raw chat.
- Storage inputs and outputs must be private storage object records, not signed URLs as source of truth.
- Tool execution is blocked until a future backend worker/runtime milestone.
- Metadata rejects secret-like keys, signed URL fields, service-role details, provider keys, Stripe keys, credentials, private keys, and env values.
