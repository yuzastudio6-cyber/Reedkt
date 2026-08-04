import { z } from 'zod'

import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
const idempotencyKey = z.string().min(8).max(240).refine((value) => value === value.trim() && Array.from(value).every((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127))

export const runCanonicalPrivateRembgBackgroundRemovalSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_rembg_background_removal'),
  idempotencyKey,
}).strict()

export const canonicalPrivateRembgBackgroundRemovalAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivateRembgBackgroundRemovalResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-rembg-background-removal-execution-response-v1'),
  source: z.literal('canonical_private_rembg_background_removal_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_rembg_background_removal'),
  identity: z.object({ workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity, jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity }).strict(),
  tool: z.object({ canonicalToolId: z.literal('rembg'), operationId: z.literal('tool.rembg.remove_image_background.v1'), actualPackageEntrypointCompleted: z.literal(true), approvedServerOwnedFixtureOnly: z.literal(true), callerMediaAllowed: z.literal(false), callerModelAllowed: z.literal(false), licenseReviewStillRequiredForProduction: z.literal(true), providerCallMade: z.literal(false), sourceObjectRead: z.literal(false), renderExecuted: z.literal(false), finalExportExecuted: z.literal(false) }).strict(),
  lease: z.object({ leaseId: identity, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha256, executionAttemptId: identity, runnerClass: z.literal('offline_rembg_background_removal_execution_v1'), executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp, credentialReturned: z.literal(false), credentialHashReturned: z.literal(false) }).strict(),
  runtime: z.object({ runtimeAuthorityHash: sha256, imageIdentityHash: sha256, executionAttestationHash: sha256, requestEnvelopeSha256: sha256, packageName: z.literal('rembg'), packageVersion: z.literal('2.0.76'), onnxRuntimeVersion: z.literal('1.27.0'), modelId: z.literal('u2netp'), modelSha256: z.literal('309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'), modelByteLength: z.literal(4_574_861), modelUpstreamLicense: z.literal('Apache-2.0'), debianSnapshot: z.literal('20260623T000000Z'), zeroNetworkVerified: z.literal(true), cpuExecutionProviderOnly: z.literal(true), runtimeModelDownloadAllowed: z.literal(false), privateInternalOnly: z.literal(true), productReady: z.literal(false), externalBetaReady: z.literal(false), productionReady: z.literal(false) }).strict(),
  result: z.object({ artifactId: identity, qaEvaluationId: identity, reconciliationId: identity, artifactVersion: z.number().int().positive(), contentType: z.literal('image/png'), sha256, byteLength: z.literal(3231), width: z.literal(128), height: z.literal(128), alphaMinimum: z.literal(0), alphaMaximum: z.literal(255), alphaUniqueValueCount: z.literal(160), foregroundAlphaMean: z.literal(226.802912), backgroundAlphaMean: z.literal(2.492606), foregroundSeparationVerified: z.literal(true), privateObjectIdentityHash: sha256, qaOutcome: z.literal('passed'), reconciliationDecision: z.literal('test_merged_not_live_authorized'), privateTestDependencySatisfied: z.literal(true), liveRuntimeDependencySatisfied: z.literal(false), finalRenderAuthorized: z.literal(false) }).strict(),
  replay: z.object({ dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(), executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(), qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(), sameIdempotentAttemptOnly: z.literal(true) }).strict(),
  permissions: z.object({ furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false), render: z.literal(false), creditSpend: z.literal(false), walletMutation: z.literal(false), settlement: z.literal(false), delivery: z.literal(false) }).strict(),
  persistence: z.object({ privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true), actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true), checksumProtectedAuthority: z.literal(true), distributedAuthority: z.literal(false), productionAuthority: z.literal(false) }).strict(),
  completedAt: timestamp,
  responseHash: sha256,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalPrivateRembgBackgroundRemovalInput = z.infer<typeof runCanonicalPrivateRembgBackgroundRemovalSchema>
export type CanonicalPrivateRembgBackgroundRemovalAuthority = z.infer<typeof canonicalPrivateRembgBackgroundRemovalAuthoritySchema>
export type CanonicalPrivateRembgBackgroundRemovalResponse = z.infer<typeof canonicalPrivateRembgBackgroundRemovalResponseSchema>
