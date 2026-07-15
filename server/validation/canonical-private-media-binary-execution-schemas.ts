import { z } from 'zod'

import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

const toolCommon = z.object({
  canonicalToolId: z.enum(['ffmpeg', 'ffprobe']),
  operationId: identity,
  actualBinaryOperationCompleted: z.literal(true),
  providerCallMade: z.literal(false),
  inputReadEvidenceHash: sha,
  inputArtifactSha256: sha,
  inputArtifactByteLength: z.number().int().positive().max(32 * 1024 * 1024),
  renderExecuted: z.literal(false),
  finalExportExecuted: z.literal(false),
})

const mediaInputAuthoritySchema = z.discriminatedUnion('inputKind', [
  toolCommon.extend({
    inputKind: z.literal('approved_source_object'),
    sourceObjectRead: z.literal(true),
    dependencyArtifactRead: z.literal(false),
    sourceSequenceItemId: identity,
    sourceBindingHash: sha,
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('qa_passed_dependency_artifact'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(true),
    inputArtifactId: identity,
    inputDependencyJobId: identity,
  }).strict(),
])

const finalArtifactQaSchema = z.object({
  independentFfprobeExecuted: z.literal(true), binaryVersion: z.literal('8.1.2'),
  videoCodecName: z.literal('h264'), pixelFormat: z.literal('yuv420p'), colorSpace: z.literal('bt709'),
  width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().positive(),
  frameCount: z.number().int().positive(), audioCodecName: z.literal('aac'),
  audioSampleRate: z.literal(48_000), audioChannels: z.number().int().min(1).max(2),
  approvedDurationSeconds: z.number().positive(), actualDurationSeconds: z.number().positive(),
  maximumDurationDriftFrames: z.literal(2), durationDriftFrames: z.number().int().min(0).max(2),
  finalQaGatesPassed: z.literal(true), reportSha256: sha,
}).strict()

export const runCanonicalPrivateMediaBinarySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_media_binary_tool'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

export const canonicalPrivateMediaBinaryAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivateMediaBinaryResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-media-binary-execution-response-v2'),
  source: z.literal('canonical_private_media_binary_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_media_binary_tool'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  tool: mediaInputAuthoritySchema,
  finalArtifactQa: finalArtifactQaSchema.nullable(),
  lease: z.object({
    leaseId: identity, executionAttemptId: identity,
    runnerClass: z.literal('offline_media_binary_execution_v1'),
    executionStartedAt: timestamp, executionCompletedAt: timestamp,
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    privateInternalOnly: z.literal(true), productReady: z.literal(false),
    externalBetaReady: z.literal(false), productionReady: z.literal(false),
    finalExportReady: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: identity, qaEvaluationId: identity, reconciliationId: identity,
    contentType: z.enum(['application/json', 'video/x-nut', 'video/x-matroska', 'audio/wav']),
    sha256: sha,
    byteLength: z.number().int().positive().max(32 * 1024 * 1024),
    privateObjectIdentityHash: sha,
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false),
    furtherSourceObjectRead: z.literal(false), render: z.literal(false), finalExport: z.literal(false),
    creditSpend: z.literal(false), walletMutation: z.literal(false), settlement: z.literal(false),
    delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), actualRunEvidenceVerified: z.literal(true),
    actualQaEvidenceVerified: z.literal(true), checksumProtectedAuthority: z.literal(true),
    distributedAuthority: z.literal(false), productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp,
  responseHash: sha,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateMediaBinaryInput = z.infer<typeof runCanonicalPrivateMediaBinarySchema>
export type CanonicalPrivateMediaBinaryAuthority = z.infer<typeof canonicalPrivateMediaBinaryAuthoritySchema>
export type CanonicalPrivateMediaBinaryResponse = z.infer<typeof canonicalPrivateMediaBinaryResponseSchema>
