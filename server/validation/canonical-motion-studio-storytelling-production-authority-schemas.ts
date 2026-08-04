import { z } from 'zod'

import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_COMPONENT_KEY =
  'motionStudioStorytellingProductionAuthority' as const
export const CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_VERSION =
  'canonical-motion-studio-storytelling-production-authority-v1' as const
export const MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_PROPOSAL_VERSION =
  'motion-studio.storytelling-production-authority-proposal.v1' as const
export const CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION =
  'canonical-motion-studio-storytelling-production-authority-reader-v1' as const

const safeIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const versionReferenceSchema = z.object({
  artifactId: safeIdentity,
  versionId: safeIdentity,
  versionNumber: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentDigest: sha256,
  state: z.enum(['approved', 'locked']),
}).strict()

const generatedNarrationAuthoritySchema = z.object({
  mode: z.literal('generated_speech_required'),
  requiredByPreviewProfile: z.literal(true),
  voiceBibleVersion: versionReferenceSchema,
  voiceProfileReference: safeIdentity,
  segmentRequirements: z.array(z.object({
    preparedScriptSegmentId: safeIdentity,
    sceneId: safeIdentity,
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    spokenTextDigest: sha256,
  }).strict()).min(1).max(512),
  expectedProviderOperationId: z.literal(
    'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
  ),
  normalizedNarrationRequiredBeforePreview: z.literal(true),
  providerExecutionAuthorized: z.literal(false),
}).strict()

const uploadedNarrationAuthoritySchema = z.object({
  mode: z.literal('verified_uploaded_narration'),
  requiredByPreviewProfile: z.literal(true),
  voiceBibleVersion: versionReferenceSchema,
  uploadedNarrationAuthorityDigest: sha256,
  mediaAssetId: safeIdentity,
  storageObjectRecordId: safeIdentity,
  checksumSha256: sha256,
  mimeType: z.enum(['audio/wav', 'audio/mpeg', 'audio/mp3']),
  byteLength: z.number().int().positive().max(16 * 1024 * 1024),
  durationMilliseconds: z.number().int().positive().max(60 * 60 * 1_000),
  normalizedNarrationRequiredBeforePreview: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
}).strict()

export const canonicalMotionStudioStorytellingProductionAuthoritySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_VERSION,
  ),
  componentKey: z.literal(
    CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_COMPONENT_KEY,
  ),
  sourceProposal: z.object({
    schemaVersion: z.literal(
      MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_PROPOSAL_VERSION,
    ),
    componentProposalDigest: sha256,
    evidenceClass: z.literal('motion_feature_owned_proposal_backend_admission_pending'),
    canonicalBackendAdmissionAuthorized: z.literal(false),
  }).strict(),
  sourceVerification: z.object({
    readerVersion: z.literal(
      CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
    ),
    sourceAuthority: z.literal('motion_studio_storytelling_artifact_repository'),
    evidenceClass: z.literal('controlled_local_source_verified_non_promotable'),
    sourceRepositoryRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    sourceRepositoryReadDigest: sha256,
    sourcePayloadDigestsReverified: z.literal(true),
    exactScopeReverified: z.literal(true),
    exactApprovalStatesReverified: z.literal(true),
  }).strict(),
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  productionId: safeIdentity,
  sourceMode: z.literal('idea_first_no_uploaded_media'),
  preparedScript: z.object({
    version: versionReferenceSchema,
    scriptId: safeIdentity,
    userLockedText: z.literal(true),
    narrationSegmentCount: z.number().int().positive().max(512),
  }).strict(),
  sourceArtifactApprovalSnapshotId: safeIdentity,
  orderedScenes: z.array(z.object({
    order: z.number().int().nonnegative().max(63),
    sceneId: safeIdentity,
    chapterId: safeIdentity,
    title: z.string().trim().min(1).max(240),
    semanticPurpose: z.string().trim().min(1).max(2_000),
    productionMode: z.enum([
      'generative_first',
      'layered_first',
      'native_graphics_first',
      'footage_first',
      'hybrid_directed',
    ]),
    version: versionReferenceSchema,
    startTimingAnchorId: safeIdentity,
    endTimingAnchorId: safeIdentity,
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
  }).strict()).min(1).max(64),
  narrationPolicy: z.discriminatedUnion('mode', [
    generatedNarrationAuthoritySchema,
    uploadedNarrationAuthoritySchema,
  ]),
  timingAuthority: z.object({
    masterTimingPlanVersionId: safeIdentity,
    confirmedFrameId: safeIdentity,
    timingAuthorityDigest: sha256,
    frameRate: z.union([z.literal(24), z.literal(30)]),
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    aspectRatio: z.string().trim().min(1).max(40),
    durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    timebase: z.string().trim().min(1).max(40),
  }).strict(),
  confirmedOutputFrame: z.object({
    confirmedFrameId: safeIdentity,
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    aspectRatio: z.string().trim().min(1).max(40),
    frameRate: z.union([z.literal(24), z.literal(30)]),
    durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    timingAuthorityDigest: sha256,
  }).strict(),
  storytellingStyleAuthority: z.object({
    componentKey: z.literal('motionStudioStorytellingStyleAuthority'),
    componentDigest: sha256,
    selectionDigest: sha256,
    styleProfileId: z.enum([
      'storytelling_style.editorial_collage',
      'storytelling_style.cinematic_realist_documentary',
      'storytelling_style.paper_diorama_documentary',
      'storytelling_style.technical_blueprint',
    ]),
    motionLanguageDigest: sha256,
  }).strict(),
  sourceCleanup: z.object({
    applicability: z.literal('not_applicable'),
    reason: z.literal('idea_first_storytelling_has_no_uploaded_media_source'),
    decisionCount: z.literal(0),
    fabricatedSourceRecordAllowed: z.literal(false),
  }).strict(),
  internalCostAuthority: z.object({
    estimateId: safeIdentity,
    estimateDigest: sha256,
    maximumAuthorizedInternalProductionCostMicros:
      z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    internalProductionCostOnly: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  changedScriptSceneNarrationStyleFrameOrTimingRequiresFreshPlanAndEstimate: z.literal(true),
  historicalApprovedSnapshotRemainsImmutable: z.literal(true),
  sourceRepositoryReverified: z.literal(true),
  noUploadedSourceExpected: z.literal(true),
  fabricatedUploadRecordCount: z.literal(0),
  privateInternalControlledPlanningOnly: z.literal(true),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  productionReady: z.literal(false),
  immutable: z.literal(true),
  authorityHash: sha256,
}).strict().superRefine((authority, context) => {
  const unsigned = { ...authority } as Record<string, unknown>
  delete unsigned.authorityHash
  if (sha256AuthorityValue(unsigned) !== authority.authorityHash) {
    context.addIssue({
      code: 'custom',
      path: ['authorityHash'],
      message: 'Storytelling production authority hash is invalid.',
    })
  }
  const timing = authority.timingAuthority
  const frame = authority.confirmedOutputFrame
  if (
    frame.confirmedFrameId !== timing.confirmedFrameId ||
    frame.width !== timing.width ||
    frame.height !== timing.height ||
    frame.aspectRatio !== timing.aspectRatio ||
    frame.frameRate !== timing.frameRate ||
    frame.durationFrames !== timing.durationFrames ||
    frame.timingAuthorityDigest !== timing.timingAuthorityDigest ||
    timing.timebase !== `${timing.frameRate}/1`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['confirmedOutputFrame'],
      message: 'Storytelling output frame must preserve the exact Master Timing authority.',
    })
  }
  let nextFrame = 0
  const seenSceneIds = new Set<string>()
  const seenSceneVersions = new Set<string>()
  authority.orderedScenes.forEach((scene, index) => {
    const versionKey = `${scene.version.artifactId}\u0000${scene.version.versionId}`
    if (
      scene.order !== index ||
      scene.startFrame !== nextFrame ||
      scene.endFrame <= scene.startFrame ||
      seenSceneIds.has(scene.sceneId) ||
      seenSceneVersions.has(versionKey)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['orderedScenes', index],
        message: 'Storytelling scenes must be unique, ordered, positive, gap-free, and non-overlapping.',
      })
    }
    seenSceneIds.add(scene.sceneId)
    seenSceneVersions.add(versionKey)
    nextFrame = scene.endFrame
  })
  if (nextFrame !== timing.durationFrames) {
    context.addIssue({
      code: 'custom',
      path: ['orderedScenes'],
      message: 'Storytelling scenes must cover the exact Master Timing duration.',
    })
  }
  if (authority.narrationPolicy.mode === 'generated_speech_required') {
    const sceneIds = new Set(authority.orderedScenes.map((scene) => scene.sceneId))
    const segmentIds = new Set<string>()
    for (const [index, segment] of authority.narrationPolicy.segmentRequirements.entries()) {
      if (
        segmentIds.has(segment.preparedScriptSegmentId) ||
        !sceneIds.has(segment.sceneId) ||
        segment.endFrame <= segment.startFrame ||
        segment.endFrame > timing.durationFrames
      ) {
        context.addIssue({
          code: 'custom',
          path: ['narrationPolicy', 'segmentRequirements', index],
          message: 'Generated narration requirements must be unique and frame-bound to an approved scene.',
        })
      }
      segmentIds.add(segment.preparedScriptSegmentId)
    }
    if (segmentIds.size !== authority.preparedScript.narrationSegmentCount) {
      context.addIssue({
        code: 'custom',
        path: ['narrationPolicy', 'segmentRequirements'],
        message: 'Generated narration must cover every Prepared Script segment exactly once.',
      })
    }
  }
})

export type CanonicalMotionStudioStorytellingProductionAuthority = z.infer<
  typeof canonicalMotionStudioStorytellingProductionAuthoritySchema
>

export function canonicalMotionStudioStorytellingProductionAuthorityMatchesScope(
  value: CanonicalMotionStudioStorytellingProductionAuthority | undefined,
  expected: { workspaceId: string; projectId: string; editSessionId: string },
): boolean {
  return value === undefined || (
    value.workspaceId === expected.workspaceId &&
    value.projectId === expected.projectId &&
    value.editSessionId === expected.editSessionId
  )
}
