import { z } from 'zod'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const id = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
export const runCanonicalPrivateLibassSchema = z.object({
  workspaceId: id, projectId: id, editSessionId: id, jobId: id, grantId: id,
  purpose: z.literal('execute_canonical_private_libass_tool'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()
export const canonicalPrivateLibassAuthoritySchema = z.object({
  leaseId: id, leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()
export const canonicalPrivateLibassResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-libass-execution-response-v1'),
  source: z.literal('canonical_private_libass_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_libass_tool'),
  identity: z.object({ workspaceId: id, projectId: id, editSessionId: id, snapshotId: id, jobId: id, approvedWorkItemId: id, expectedAssetId: id, dispatchGrantId: id }).strict(),
  tool: z.object({
    canonicalToolId: z.literal('libass'), operationId: z.literal('tool.libass.render_approved_caption_track.v1'),
    actualAssReadMemoryCompleted: z.literal(true), actualAssRenderFrameCompleted: z.literal(true),
    privateCaptionOverlayRendered: z.literal(true), fullCaptionTrackRendered: z.literal(false), videoBurnInExecuted: z.literal(false),
    providerCallMade: z.literal(false), sourceObjectRead: z.literal(false), finalExportExecuted: z.literal(false),
  }).strict(),
  lease: z.object({
    leaseId: id, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha,
    executionAttemptId: id, runnerClass: z.literal('offline_libass_caption_execution_v1'),
    executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp,
    credentialReturned: z.literal(false), credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    binaryName: z.literal('libass'), binaryVersion: z.literal('0.17.5'), sourceSha256: sha,
    privateInternalOnly: z.literal(true), productReady: z.literal(false), externalBetaReady: z.literal(false),
    productionReady: z.literal(false), fullTrackOrVideoBurnInReady: z.literal(false),
  }).strict(),
  qa: z.object({
    transparentRgbaOverlay: z.literal(true), approvedFontPackUsed: z.literal(true), safeZonePlacementPassed: z.literal(true),
    nonTransparentPixelCount: z.number().int().positive(),
    alphaBoundingBox: z.object({ left: z.number().int().nonnegative(), top: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive() }).strict(),
    reportSha256: sha,
  }).strict(),
  result: z.object({
    artifactId: id, qaEvaluationId: id, reconciliationId: id, artifactVersion: z.number().int().positive(),
    contentType: z.literal('image/png'), sha256: sha, byteLength: z.number().int().positive().max(8 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'), reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true), liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false), finalExportAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(), executionFenceCompleteReplayed: z.boolean(),
    artifactRecordReplayed: z.boolean(), qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(), sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false),
    furtherCaptionRender: z.literal(false), videoBurnIn: z.literal(false), finalExport: z.literal(false),
    creditSpend: z.literal(false), walletMutation: z.literal(false), settlement: z.literal(false), delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true), checksumProtectedAuthority: z.literal(true),
    distributedAuthority: z.literal(false), productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp, responseHash: sha, testOnly: z.literal(true),
}).strict()
export type RunCanonicalPrivateLibassInput = z.infer<typeof runCanonicalPrivateLibassSchema>
export type CanonicalPrivateLibassAuthority = z.infer<typeof canonicalPrivateLibassAuthoritySchema>
export type CanonicalPrivateLibassResponse = z.infer<typeof canonicalPrivateLibassResponseSchema>
