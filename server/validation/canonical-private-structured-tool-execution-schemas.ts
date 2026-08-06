import { z } from 'zod'

import { OFFLINE_NODE_SVG_RUNNER_TOOL_IDS } from '../tool-execution/node-runners/offline-node-runner-tool-ids'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

export const CANONICAL_PRIVATE_STRUCTURED_TOOL_EXECUTION_RESPONSE_VERSION =
  'canonical-private-structured-tool-execution-response-v1' as const

const safeIdentitySchema = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'), 'Unsafe identity.')
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })
const idempotencyKeySchema = z.string()
  .min(8)
  .max(240)
  .refine((value) => value === value.trim(), 'Idempotency key must not have surrounding whitespace.')
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }), 'Idempotency key contains control characters.')

export const runCanonicalPrivateStructuredToolSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  grantId: safeIdentitySchema,
  purpose: z.literal('execute_canonical_private_structured_tool'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const canonicalPrivateStructuredToolExecutionAuthoritySchema = z.object({
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

const toolIdSchema = z.enum(OFFLINE_NODE_SVG_RUNNER_TOOL_IDS)

export const canonicalPrivateStructuredToolExecutionResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_STRUCTURED_TOOL_EXECUTION_RESPONSE_VERSION),
  source: z.literal('canonical_private_structured_tool_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_structured_tool'),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    snapshotId: safeIdentitySchema,
    jobId: safeIdentitySchema,
    approvedWorkItemId: safeIdentitySchema,
    expectedAssetId: safeIdentitySchema,
    dispatchGrantId: safeIdentitySchema,
  }).strict(),
  tool: z.object({
    canonicalToolId: toolIdSchema,
    operationId: safeIdentitySchema,
    actualLibraryOperationCompleted: z.literal(true),
    providerCallMade: z.literal(false),
    sourceObjectRead: z.literal(false),
    renderExecuted: z.literal(false),
  }).strict(),
  lease: z.object({
    leaseId: safeIdentitySchema,
    attemptNumber: z.number().int().positive().max(10),
    immutableLeaseHash: sha256Schema,
    executionAttemptId: safeIdentitySchema,
    runnerClass: z.literal('offline_node_structured_execution_v1'),
    executionStartedAt: timestampSchema,
    executionCommitAuthorizedAt: timestampSchema,
    executionCompletedAt: timestampSchema,
    credentialReturned: z.literal(false),
    credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha256Schema,
    imageIdentityHash: sha256Schema,
    executionAttestationHash: sha256Schema,
    requestEnvelopeSha256: sha256Schema,
    runnerInputSha256: sha256Schema,
    privateInternalOnly: z.literal(true),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: safeIdentitySchema,
    qaEvaluationId: safeIdentitySchema,
    reconciliationId: safeIdentitySchema,
    artifactVersion: z.number().int().positive(),
    contentType: z.literal('image/svg+xml'),
    sha256: sha256Schema,
    byteLength: z.number().int().positive().max(64 * 1024 * 1024),
    privateObjectIdentityHash: sha256Schema,
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(),
    executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(),
    artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(),
    reconciliationReplayed: z.boolean(),
    sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false),
    providerCall: z.literal(false),
    sourceObjectRead: z.literal(false),
    render: z.literal(false),
    creditSpend: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
    delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true),
    contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true),
    actualQaEvidenceVerified: z.literal(true),
    checksumProtectedAuthority: z.literal(true),
    distributedAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestampSchema,
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateStructuredToolInput = z.infer<
  typeof runCanonicalPrivateStructuredToolSchema
>
export type CanonicalPrivateStructuredToolExecutionAuthority = z.infer<
  typeof canonicalPrivateStructuredToolExecutionAuthoritySchema
>
export type CanonicalPrivateStructuredToolExecutionResponse = z.infer<
  typeof canonicalPrivateStructuredToolExecutionResponseSchema
>
