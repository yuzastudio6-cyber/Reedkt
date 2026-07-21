import { z } from 'zod'

import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

export const runCanonicalPrivateRemotionSchema = z.object({
  workspaceId: identity, projectId: identity, editSessionId: identity,
  jobId: identity, grantId: identity,
  purpose: z.literal('execute_canonical_private_remotion_tool'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

export const canonicalPrivateRemotionAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivateRemotionResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-remotion-execution-response-v1'),
  source: z.literal('canonical_private_remotion_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_remotion_tool'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  tool: z.object({
    canonicalToolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    actualRemotionOperationCompleted: z.literal(true),
    providerCallMade: z.literal(false), sourceObjectRead: z.literal(false),
    privatePreviewRenderExecuted: z.literal(true), finalExportExecuted: z.literal(false),
    motionStudioCompositionProfileId: z.enum([
      'motion_studio_scene_preview_v1',
      'motion_studio_native_layered_scene_v1',
      'motion_studio_prepared_script_animatic_v1',
      'motion_studio_deterministic_route_draw_v1',
    ]).optional(),
    dependencyArtifactRead: z.boolean().default(false),
    dependencyReadEvidenceHash: sha.optional(),
    sourceArtifactId: identity.optional(),
    sourceArtifactSha256: sha.optional(),
    sourceArtifactContentType: z.enum(['image/png', 'audio/wav']).optional(),
  }).strict().superRefine((tool, context) => {
    const dependencyFields = [
      tool.dependencyReadEvidenceHash,
      tool.sourceArtifactId,
      tool.sourceArtifactSha256,
      tool.sourceArtifactContentType,
    ]
    if (
      (tool.dependencyArtifactRead && dependencyFields.some((value) => value === undefined)) ||
      (!tool.dependencyArtifactRead && dependencyFields.some((value) => value !== undefined)) ||
      (tool.dependencyArtifactRead && tool.motionStudioCompositionProfileId === undefined) ||
      (tool.motionStudioCompositionProfileId === 'motion_studio_scene_preview_v1' &&
        tool.dependencyArtifactRead) ||
      (tool.motionStudioCompositionProfileId !== undefined &&
        tool.motionStudioCompositionProfileId !== 'motion_studio_scene_preview_v1' &&
        !tool.dependencyArtifactRead) ||
      (tool.dependencyArtifactRead && tool.sourceArtifactContentType !== (
        tool.motionStudioCompositionProfileId === 'motion_studio_prepared_script_animatic_v1'
          ? 'audio/wav'
          : 'image/png'
      ))
    ) {
      context.addIssue({ code: 'custom', message: 'Remotion dependency and Motion Studio profile evidence are inconsistent.' })
    }
  }),
  lease: z.object({
    leaseId: identity, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha,
    executionAttemptId: identity, runnerClass: z.literal('offline_remotion_render_execution_v1'),
    executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp,
    credentialReturned: z.literal(false), credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    packageName: z.literal('remotion+@remotion/renderer'), packageVersion: z.literal('4.0.487'),
    privateInternalOnly: z.literal(true), productReady: z.literal(false),
    externalBetaReady: z.literal(false), productionReady: z.literal(false), finalExportReady: z.literal(false),
  }).strict(),
  qa: z.object({
    independentFfprobeExecuted: z.literal(true), binaryVersion: z.literal('8.1.2'),
    codecName: z.literal('h264'), pixelFormat: z.literal('yuv420p'), colorSpace: z.literal('bt709'),
    width: z.number().int().positive(), height: z.number().int().positive(),
    fps: z.number().positive(), frameCount: z.number().int().positive(), durationSeconds: z.number().positive(),
    reportSha256: sha,
    motionStudioFrameGoldenCount: z.number().int().min(3).max(5).optional(),
    motionStudioFrameGoldenEvidenceHash: sha.optional(),
  }).strict().superRefine((qa, context) => {
    if ((qa.motionStudioFrameGoldenCount === undefined) !==
        (qa.motionStudioFrameGoldenEvidenceHash === undefined)) {
      context.addIssue({ code: 'custom', message: 'Motion Studio frame-golden count and digest must be projected together.' })
    }
  }),
  result: z.object({
    artifactId: identity, qaEvaluationId: identity, reconciliationId: identity,
    artifactVersion: z.number().int().positive(), contentType: z.literal('video/mp4'),
    sha256: sha, byteLength: z.number().int().positive().max(16 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true), liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false), finalExportAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(), sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false),
    furtherRender: z.literal(false), finalExport: z.literal(false), creditSpend: z.literal(false),
    walletMutation: z.literal(false), settlement: z.literal(false), delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true),
    checksumProtectedAuthority: z.literal(true), distributedAuthority: z.literal(false), productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp, responseHash: sha, testOnly: z.literal(true),
}).strict().superRefine((response, context) => {
  const profileId = response.tool.motionStudioCompositionProfileId
  const goldenCount = response.qa.motionStudioFrameGoldenCount
  const goldenHash = response.qa.motionStudioFrameGoldenEvidenceHash
  if (
    (profileId === undefined && (goldenCount !== undefined || goldenHash !== undefined)) ||
    (profileId !== undefined && (goldenCount === undefined || goldenHash === undefined)) ||
    (profileId !== undefined && goldenCount !== (
      profileId === 'motion_studio_deterministic_route_draw_v1' ? 5 : 3
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Motion Studio profile and exact frame-golden evidence are inconsistent.',
    })
  }
})

export type RunCanonicalPrivateRemotionInput = z.infer<typeof runCanonicalPrivateRemotionSchema>
export type CanonicalPrivateRemotionAuthority = z.infer<typeof canonicalPrivateRemotionAuthoritySchema>
export type CanonicalPrivateRemotionResponse = z.infer<typeof canonicalPrivateRemotionResponseSchema>
