import { z } from 'zod'

import {
  OFFLINE_PYTHON_SOURCE_TOOL_IDS,
  OFFLINE_PYTHON_STRUCTURED_TOOL_IDS,
} from '../tool-execution/python-runner-execution/offline-python-structured-execution-protocol'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

export const CANONICAL_PRIVATE_PYTHON_TOOL_EXECUTION_RESPONSE_VERSION =
  'canonical-private-python-tool-execution-response-v1' as const
const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
const idempotency = z.string().min(8).max(240).refine((value) => value === value.trim())

export const runCanonicalPrivatePythonToolSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_python_tool'),
  idempotencyKey: idempotency,
}).strict()

export const canonicalPrivatePythonToolExecutionAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivatePythonToolExecutionResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PYTHON_TOOL_EXECUTION_RESPONSE_VERSION),
  source: z.literal('canonical_private_python_tool_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_python_tool'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  tool: z.object({
    canonicalToolId: z.enum(OFFLINE_PYTHON_STRUCTURED_TOOL_IDS),
    operationId: identity,
    actualLibraryOperationCompleted: z.literal(true),
    providerCallMade: z.literal(false), sourceObjectRead: z.boolean(), renderExecuted: z.literal(false),
    sourceReadEvidenceHash: sha.optional(),
    sourceSequenceItemId: identity.optional(),
    sourceBindingHash: sha.optional(),
  }).strict().superRefine((tool, context) => {
    const mediaTool = (OFFLINE_PYTHON_SOURCE_TOOL_IDS as readonly string[])
      .includes(tool.canonicalToolId)
    const completeSourceEvidence = Boolean(
      tool.sourceReadEvidenceHash && tool.sourceSequenceItemId && tool.sourceBindingHash,
    )
    if (tool.sourceObjectRead !== mediaTool || completeSourceEvidence !== mediaTool) {
      context.addIssue({
        code: 'custom',
        message: 'Media tools require exact approved source-read evidence and non-media tools forbid it.',
      })
    }
  }),
  lease: z.object({
    leaseId: identity, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha,
    executionAttemptId: identity, runnerClass: z.literal('offline_python_structured_execution_v1'),
    executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp,
    credentialReturned: z.literal(false), credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    privateInternalOnly: z.literal(true), productReady: z.literal(false),
    externalBetaReady: z.literal(false), productionReady: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: identity, qaEvaluationId: identity, reconciliationId: identity,
    artifactVersion: z.number().int().positive(), contentType: z.enum(['application/json', 'audio/wav']),
    sha256: sha, byteLength: z.number().int().positive().max(16 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true), liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(),
    sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false),
    render: z.literal(false), creditSpend: z.literal(false), walletMutation: z.literal(false),
    settlement: z.literal(false), delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true),
    checksumProtectedAuthority: z.literal(true), distributedAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp,
  responseHash: sha,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivatePythonToolInput = z.infer<typeof runCanonicalPrivatePythonToolSchema>
export type CanonicalPrivatePythonToolExecutionAuthority = z.infer<typeof canonicalPrivatePythonToolExecutionAuthoritySchema>
export type CanonicalPrivatePythonToolExecutionResponse = z.infer<typeof canonicalPrivatePythonToolExecutionResponseSchema>
