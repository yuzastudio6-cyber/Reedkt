import { z } from 'zod'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const id = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

export const runCanonicalPrivateSharpSchema = z.object({
  workspaceId: id, projectId: id, editSessionId: id, jobId: id, grantId: id,
  purpose: z.literal('execute_canonical_private_sharp_tool'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()
export const canonicalPrivateSharpAuthoritySchema = z.object({
  leaseId: id,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()
export const canonicalPrivateSharpResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-sharp-execution-response-v1'),
  source: z.literal('canonical_private_sharp_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_sharp_tool'),
  identity: z.object({
    workspaceId: id, projectId: id, editSessionId: id, snapshotId: id,
    jobId: id, approvedWorkItemId: id, expectedAssetId: id, dispatchGrantId: id,
  }).strict(),
  tool: z.object({
    canonicalToolId: z.literal('sharp'), operationId: id,
    actualLibraryOperationCompleted: z.literal(true), providerCallMade: z.literal(false),
    dependencyArtifactRead: z.literal(true), dependencyReadEvidenceHash: sha,
    sourceArtifactId: id, sourceArtifactSha256: sha,
    renderExecuted: z.literal(false), finalExportExecuted: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    privateInternalOnly: z.literal(true), productReady: z.literal(false),
    externalBetaReady: z.literal(false), productionReady: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: id, qaEvaluationId: id, reconciliationId: id,
    contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    sha256: sha, byteLength: z.number().int().positive().max(16 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true), finalRenderAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(),
  }).strict(),
  permissions: z.object({
    furtherDispatch: z.literal(false), furtherDependencyRead: z.literal(false),
    providerCall: z.literal(false), render: z.literal(false), creditSpend: z.literal(false),
    walletMutation: z.literal(false), settlement: z.literal(false), delivery: z.literal(false),
  }).strict(),
  completedAt: timestamp, responseHash: sha, testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateSharpInput = z.infer<typeof runCanonicalPrivateSharpSchema>
export type CanonicalPrivateSharpAuthority = z.infer<typeof canonicalPrivateSharpAuthoritySchema>
export type CanonicalPrivateSharpResponse = z.infer<typeof canonicalPrivateSharpResponseSchema>
