import { z } from 'zod'

import { privateInternalAttemptCostEvidenceSchema } from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
const idempotencyKey = z.string().min(8).max(240).refine((value) => value === value.trim() && Array.from(value).every((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127))

export const runCanonicalPrivateDeepFilterNetVoiceCleanupSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_deepfilternet_voice_cleanup'),
  idempotencyKey,
}).strict()

export const canonicalPrivateDeepFilterNetVoiceCleanupAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivateDeepFilterNetVoiceCleanupResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-deepfilternet-voice-cleanup-execution-response-v1'),
  source: z.literal('canonical_private_deepfilternet_voice_cleanup_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_deepfilternet_voice_cleanup'),
  identity: z.object({ workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity, jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity }).strict(),
  tool: z.object({ canonicalToolId: z.literal('deepfilternet'), operationId: z.literal('tool.deepfilternet.enhance_voice.v1'), actualPackageEntrypointCompleted: z.literal(true), approvedServerOwnedFixtureOnly: z.literal(true), callerMediaAllowed: z.literal(false), callerModelAllowed: z.literal(false), modelAndLicenseReviewStillRequiredForProduction: z.literal(true), providerCallMade: z.literal(false), sourceObjectRead: z.literal(false), renderExecuted: z.literal(false), finalExportExecuted: z.literal(false) }).strict(),
  lease: z.object({ leaseId: identity, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha256, executionAttemptId: identity, runnerClass: z.literal('offline_deepfilternet_voice_cleanup_execution_v1'), executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp, credentialReturned: z.literal(false), credentialHashReturned: z.literal(false) }).strict(),
  runtime: z.object({ runtimeAuthorityHash: sha256, imageIdentityHash: sha256, executionAttestationHash: sha256, requestEnvelopeSha256: sha256, packageName: z.literal('DeepFilterNet'), packageVersion: z.literal('0.5.6'), nativePackageName: z.literal('DeepFilterLib'), nativePackageVersion: z.literal('0.5.6'), torchVersion: z.literal('2.2.2'), torchaudioVersion: z.literal('2.2.2'), modelId: z.literal('DeepFilterNet3'), modelCheckpointSha256: z.literal('23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003'), debianSnapshot: z.literal('20260623T000000Z'), zeroNetworkVerified: z.literal(true), cpuExecutionOnly: z.literal(true), runtimeModelDownloadAllowed: z.literal(false), privateInternalOnly: z.literal(true), productReady: z.literal(false), externalBetaReady: z.literal(false), productionReady: z.literal(false) }).strict(),
  result: z.object({ artifactId: identity, qaEvaluationId: identity, reconciliationId: identity, artifactVersion: z.number().int().positive(), contentType: z.literal('audio/wav'), sha256: z.literal('a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7'), byteLength: z.literal(384_214), sampleRate: z.literal(48_000), channelCount: z.literal(1), frameCount: z.literal(192_085), inputSnrDb: z.literal(3.217773), outputSnrDb: z.literal(8.214627), meanAbsoluteDelta: z.literal(0.032997789), privateObjectIdentityHash: sha256, qaOutcome: z.literal('passed'), reconciliationDecision: z.literal('test_merged_not_live_authorized'), privateTestDependencySatisfied: z.literal(true), liveRuntimeDependencySatisfied: z.literal(false), finalRenderAuthorized: z.literal(false) }).strict(),
  attemptCost: z.object({ evidence: privateInternalAttemptCostEvidenceSchema, idempotencyStatus: z.enum(['inserted', 'duplicate_returned']) }).strict(),
  replay: z.object({ dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(), executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(), qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(), attemptCostEvidenceReplayed: z.boolean(), sameIdempotentAttemptOnly: z.literal(true) }).strict(),
  permissions: z.object({ furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false), render: z.literal(false), creditSpend: z.literal(false), walletMutation: z.literal(false), settlement: z.literal(false), delivery: z.literal(false) }).strict(),
  persistence: z.object({ privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true), actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true), checksumProtectedAuthority: z.literal(true), distributedAuthority: z.literal(false), productionAuthority: z.literal(false) }).strict(),
  completedAt: timestamp,
  responseHash: sha256,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateDeepFilterNetVoiceCleanupInput = z.infer<typeof runCanonicalPrivateDeepFilterNetVoiceCleanupSchema>
export type CanonicalPrivateDeepFilterNetVoiceCleanupAuthority = z.infer<typeof canonicalPrivateDeepFilterNetVoiceCleanupAuthoritySchema>
export type CanonicalPrivateDeepFilterNetVoiceCleanupResponse = z.infer<typeof canonicalPrivateDeepFilterNetVoiceCleanupResponseSchema>
