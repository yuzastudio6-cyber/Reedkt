# TOOL-ROUTE-1 Scoped Tool-Call Manifest Contract

Contract status: `scoped_manifest_contract_created`

The scoped tool-call manifest is a future handoff artifact between an approved plan snapshot and later route/worker/tool execution gates. TOOL-ROUTE-1 creates only the contract and static fixtures.

## Required Manifest Fields

- `manifestId`
- `fixtureId`
- `planSnapshotId`
- `ownerWorkstream`
- `targetOwnerWorkstream`
- `sourceOwnerStudyRefs`
- `capabilityRefs`
- `requestedCapabilities`
- `selectedToolRefs`
- `selectedToolMix`
- `editIntentRefs`
- `routeRefs`
- `workerJobRef`
- `inputArtifactRefs`
- `outputArtifactScopes`
- `privateArtifactManifestRefs`
- `checksumRequirements`
- `QARequirements`
- `observabilityRequirements`
- `blockedUses`
- `approvalState`
- `noRawPromptExecution`
- `noSignedUrlSourceOfTruth`
- `noPublicArtifact`
- `noSupabaseMutation`

## Required False Approval Booleans

- `routeExecutionApprovedNow: false`
- `toolExecutionApprovedNow: false`
- `workerExecutionApprovedNow: false`
- `providerRuntimeApprovedNow: false`
- `supabaseMutationApprovedNow: false`
- `publicArtifactsApproved: false`
- `signedUrlsApproved: false`
- `rawPromptExecutionApproved: false`
- `internalBetaApproved: false`
- `externalBetaApproved: false`
- `productionApproved: false`

## Source-Of-Truth Policy

Artifact source of truth must remain exactly:

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth. Public artifacts are not approved. Future route outputs require private artifact manifest placeholders, private GCS path placeholders, Supabase row placeholders, checksum/provenance placeholders, approved plan snapshot placeholders, QA evidence placeholders, cleanup evidence placeholders, and a later upload gate.

## Blocked Uses

The manifest must block raw prompt execution, route execution, tool execution, worker execution, provider/model runtime, browser capture, map rendering, media processing, audio processing, Remotion render/export, final render/export, Supabase mutation, SQL, storage transfer, signed URL source-of-truth use, public artifacts, dependency mutation, internal beta, external beta, and production.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
