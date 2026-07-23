import { z } from 'zod'

import {
  motionStudioPreparedScriptSchema,
  motionStudioSceneDocumentSchema,
  motionStudioTimingAuthoritySchema,
  motionStudioVoiceBibleSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
  PreparedScript,
  VoiceBible,
} from '../../../src/types/motion-studio'
import {
  OFFLINE_REMOTION_RENDER_OPERATION,
  type OfflineRemotionMotionStudioAnimaticPlanningPayload,
  validateOfflineRemotionMotionStudioAnimaticPlanningPayload,
} from '../../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import {
  CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY,
  canonicalStorytellingStyleAuthoritySchema,
  type CanonicalStorytellingStyleAuthority,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioArtifactVersionRow } from '../commands/types'

export const MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_PROPOSAL_VERSION =
  'motion-studio.storytelling-production-authority-proposal.v1' as const
export const MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_COMPONENT_KEY =
  'motionStudioStorytellingProductionAuthority' as const
export const MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_VERSION =
  'canonical-motion-studio-storytelling-production-authority-v1' as const
export const MOTION_STUDIO_STORYTELLING_REMOTION_WORK_ITEM_DRAFT_VERSION =
  'motion-studio.storytelling-remotion-work-item-draft.v1' as const
export const MOTION_STUDIO_STORYTELLING_PRODUCTION_PROPOSAL_RESULT_VERSION =
  'motion-studio.storytelling-production-proposal-result.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeMicrosSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const versionReferenceSchema = z.object({
  artifactId: stableIdSchema,
  versionId: stableIdSchema,
  versionNumber: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentDigest: digestSchema,
}).strict()

const approvedVersionReferenceSchema = versionReferenceSchema.extend({
  state: z.enum(['approved', 'locked']),
}).strict()

const generatedNarrationPolicySchema = z.object({
  mode: z.literal('generated_speech_required'),
  requiredByPreviewProfile: z.literal(true),
  voiceBibleVersion: approvedVersionReferenceSchema,
  voiceProfileReference: stableIdSchema,
  segmentRequirements: z.array(z.object({
    preparedScriptSegmentId: stableIdSchema,
    sceneId: stableIdSchema,
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    spokenTextDigest: digestSchema,
  }).strict()).min(1).max(512),
  expectedProviderOperationId: z.literal(
    'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
  ),
  normalizedNarrationRequiredBeforePreview: z.literal(true),
  providerExecutionAuthorized: z.literal(false),
}).strict()

const uploadedNarrationPolicySchema = z.object({
  mode: z.literal('verified_uploaded_narration'),
  requiredByPreviewProfile: z.literal(true),
  voiceBibleVersion: approvedVersionReferenceSchema,
  uploadedNarrationAuthorityDigest: digestSchema,
  mediaAssetId: stableIdSchema,
  storageObjectRecordId: stableIdSchema,
  checksumSha256: digestSchema,
  mimeType: z.enum(['audio/wav', 'audio/mpeg', 'audio/mp3']),
  byteLength: z.number().int().positive().max(16 * 1024 * 1024),
  durationMilliseconds: z.number().int().positive().max(60 * 60 * 1_000),
  normalizedNarrationRequiredBeforePreview: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
}).strict()

const narrationPolicySchema = z.discriminatedUnion('mode', [
  generatedNarrationPolicySchema,
  uploadedNarrationPolicySchema,
])

export const storytellingProductionAuthorityComponentProposalSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_PROPOSAL_VERSION),
  targetComponentKey: z.literal(
    MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_COMPONENT_KEY,
  ),
  targetSchemaVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_VERSION,
  ),
  evidenceClass: z.literal('motion_feature_owned_proposal_backend_admission_pending'),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  sourceMode: z.literal('idea_first_no_uploaded_media'),
  preparedScript: z.object({
    version: approvedVersionReferenceSchema,
    scriptId: stableIdSchema,
    userLockedText: z.literal(true),
    narrationSegmentCount: z.number().int().positive().max(512),
  }).strict(),
  sourceArtifactApprovalSnapshotId: stableIdSchema,
  orderedScenes: z.array(z.object({
    order: z.number().int().nonnegative().max(63),
    sceneId: stableIdSchema,
    chapterId: stableIdSchema,
    title: z.string().trim().min(1).max(240),
    semanticPurpose: z.string().trim().min(1).max(2_000),
    productionMode: z.enum([
      'generative_first', 'layered_first', 'native_graphics_first',
      'footage_first', 'hybrid_directed',
    ]),
    version: approvedVersionReferenceSchema,
    startTimingAnchorId: stableIdSchema,
    endTimingAnchorId: stableIdSchema,
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
  }).strict()).min(1).max(64),
  narrationPolicy: narrationPolicySchema,
  timingAuthority: motionStudioTimingAuthoritySchema,
  confirmedOutputFrame: z.object({
    confirmedFrameId: stableIdSchema,
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    aspectRatio: z.string().trim().min(1).max(40),
    frameRate: z.number().positive().max(120),
    durationFrames: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    timingAuthorityDigest: digestSchema,
  }).strict(),
  storytellingStyleAuthority: z.object({
    componentKey: z.literal(CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY),
    componentDigest: digestSchema,
    selectionDigest: digestSchema,
    styleProfileId: z.enum([
      'storytelling_style.editorial_collage',
      'storytelling_style.cinematic_realist_documentary',
      'storytelling_style.paper_diorama_documentary',
      'storytelling_style.technical_blueprint',
    ]),
    motionLanguageDigest: digestSchema,
  }).strict(),
  sourceCleanup: z.object({
    applicability: z.literal('not_applicable'),
    reason: z.literal('idea_first_storytelling_has_no_uploaded_media_source'),
    decisionCount: z.literal(0),
    fabricatedSourceRecordAllowed: z.literal(false),
  }).strict(),
  internalCostAuthority: z.object({
    estimateId: stableIdSchema,
    estimateDigest: digestSchema,
    maximumAuthorizedInternalProductionCostMicros: safeMicrosSchema,
    internalProductionCostOnly: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  changedScriptSceneNarrationStyleFrameOrTimingRequiresFreshPlanAndEstimate: z.literal(true),
  historicalApprovedSnapshotRemainsImmutable: z.literal(true),
  canonicalBackendAdmissionAuthorized: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  productionReady: z.literal(false),
  componentProposalDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.componentProposalDigest
  if (sha256CanonicalJson(unsigned) !== value.componentProposalDigest) {
    context.addIssue({
      code: 'custom',
      path: ['componentProposalDigest'],
      message: 'Storytelling production component proposal digest verification failed.',
    })
  }
  if (
    value.confirmedOutputFrame.confirmedFrameId !== value.timingAuthority.confirmedFrameId ||
    value.confirmedOutputFrame.width !== value.timingAuthority.width ||
    value.confirmedOutputFrame.height !== value.timingAuthority.height ||
    value.confirmedOutputFrame.aspectRatio !== value.timingAuthority.aspectRatio ||
    value.confirmedOutputFrame.frameRate !== value.timingAuthority.frameRate ||
    value.confirmedOutputFrame.durationFrames !== value.timingAuthority.durationFrames ||
    value.confirmedOutputFrame.timingAuthorityDigest !== value.timingAuthority.timingAuthorityDigest
  ) {
    context.addIssue({
      code: 'custom',
      path: ['confirmedOutputFrame'],
      message: 'Confirmed output frame must preserve the exact timing authority.',
    })
  }
  requireContiguousScenes(value.orderedScenes, value.timingAuthority.durationFrames, context)
})

const animaticPlanningPayloadSchema = z.unknown().transform((value, context) => {
  try {
    return validateOfflineRemotionMotionStudioAnimaticPlanningPayload(value)
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Invalid Motion Studio animatic planning payload.',
    })
    return z.NEVER
  }
})

export const storytellingRemotionWorkItemDraftSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_REMOTION_WORK_ITEM_DRAFT_VERSION),
  workItemKey: stableIdSchema,
  workItemType: z.literal('render_remotion_preview'),
  workerClass: z.literal('render_worker'),
  canonicalToolId: z.literal('remotion'),
  operationId: z.literal(OFFLINE_REMOTION_RENDER_OPERATION),
  compositionProfileId: z.literal('motion_studio_prepared_script_animatic_v1'),
  productionAuthorityComponentDigest: digestSchema,
  planningPayload: animaticPlanningPayloadSchema,
  planningPayloadDigest: digestSchema,
  dependencyArtifactVersions: z.array(versionReferenceSchema).min(3).max(66),
  narrationDependency: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('generated_speech_required'),
      narrationPolicyDigest: digestSchema,
      expectedArtifactRole: z.literal('normalized_storytelling_narration'),
      currentPrivateArtifactPresent: z.literal(false),
    }).strict(),
    z.object({
      mode: z.literal('verified_uploaded_narration'),
      narrationPolicyDigest: digestSchema,
      mediaAssetId: stableIdSchema,
      checksumSha256: digestSchema,
      currentPrivateArtifactPresent: z.literal(true),
    }).strict(),
  ]),
  sourceSequenceItemIds: z.tuple([]),
  sourceCleanupDecisionIds: z.tuple([]),
  expectedOutput: z.object({
    outputKey: z.literal('storytelling_private_animatic_preview'),
    artifactType: z.literal('motion_studio_storytelling_animatic_preview'),
    assetRole: z.literal('preview'),
    contentType: z.literal('video/mp4'),
    privateCreateOnly: z.literal(true),
    finalAssetEligible: z.literal(false),
  }).strict(),
  maximumAttempts: z.literal(1),
  automaticRetriesAllowed: z.literal(false),
  automaticFallbacksAllowed: z.literal(false),
  maximumAuthorizedInternalProductionCostMicros: safeMicrosSchema,
  providerExecutionMode: z.literal('none'),
  canonicalBackendAdmissionAuthorized: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  draftDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (sha256CanonicalJson(value.planningPayload) !== value.planningPayloadDigest) {
    context.addIssue({
      code: 'custom',
      path: ['planningPayloadDigest'],
      message: 'Storytelling animatic planning payload digest verification failed.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.draftDigest
  if (sha256CanonicalJson(unsigned) !== value.draftDigest) {
    context.addIssue({
      code: 'custom',
      path: ['draftDigest'],
      message: 'Storytelling Remotion work-item draft digest verification failed.',
    })
  }
})

const previewCapacityBlockerSchema = z.enum([
  'scene_count_exceeds_single_animatic_profile',
  'duration_exceeds_single_animatic_profile',
  'frame_rate_not_supported_by_animatic_profile',
  'output_aspect_ratio_not_supported_by_animatic_profile',
])

export const storytellingProductionProposalResultSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PRODUCTION_PROPOSAL_RESULT_VERSION),
  componentProposal: storytellingProductionAuthorityComponentProposalSchema,
  previewAdmission: z.discriminatedUnion('state', [
    z.object({
      state: z.literal('work_item_draft_ready_backend_admission_pending'),
      blockers: z.tuple([]),
      workItemDraft: storytellingRemotionWorkItemDraftSchema,
    }).strict(),
    z.object({
      state: z.literal('blocked_by_current_single_animatic_profile_capacity'),
      blockers: z.array(previewCapacityBlockerSchema).min(1),
      workItemDraftPresent: z.literal(false),
    }).strict(),
  ]),
  sideEffects: z.object({
    uploadRecordCount: z.literal(0),
    queueMutationCount: z.literal(0),
    leaseMutationCount: z.literal(0),
    providerRequestCount: z.literal(0),
    renderCount: z.literal(0),
    customerCreditMutationCount: z.literal(0),
    billingMutationCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  proposalDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    value.previewAdmission.state === 'work_item_draft_ready_backend_admission_pending' &&
    value.previewAdmission.workItemDraft.productionAuthorityComponentDigest !==
      value.componentProposal.componentProposalDigest
  ) {
    context.addIssue({
      code: 'custom',
      path: ['previewAdmission', 'workItemDraft', 'productionAuthorityComponentDigest'],
      message: 'Storytelling work-item draft must bind the exact production component proposal.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.proposalDigest
  if (sha256CanonicalJson(unsigned) !== value.proposalDigest) {
    context.addIssue({
      code: 'custom',
      path: ['proposalDigest'],
      message: 'Storytelling production proposal result digest verification failed.',
    })
  }
})

export type StorytellingProductionAuthorityComponentProposal = z.infer<
  typeof storytellingProductionAuthorityComponentProposalSchema
>
export type StorytellingProductionProposalResult = z.infer<
  typeof storytellingProductionProposalResultSchema
>

export interface CreateStorytellingProductionAuthorityProposalInput {
  preparedScriptVersion: MotionStudioArtifactVersionRow
  sceneDocumentVersions: readonly MotionStudioArtifactVersionRow[]
  voiceBibleVersion: MotionStudioArtifactVersionRow
  storytellingStyleAuthority: CanonicalStorytellingStyleAuthority
  internalCostAuthority: {
    estimateId: string
    estimateDigest: string
    maximumAuthorizedInternalProductionCostMicros: number
  }
}

/**
 * Creates only Motion-owned, content-addressed proposal evidence for the
 * backend-owned idea-first canonical planning seam. It never fabricates an
 * uploaded source or dispatches the proposed Remotion work item.
 */
export function createStorytellingProductionAuthorityProposal(
  input: CreateStorytellingProductionAuthorityProposalInput,
): StorytellingProductionProposalResult {
  const preparedScriptVersion = requireApprovedArtifactVersion(
    input.preparedScriptVersion,
    'prepared_script',
  )
  const preparedScript = motionStudioPreparedScriptSchema.parse(
    preparedScriptVersion.payload_json.data,
  )
  assertArtifactPayloadIdentity(preparedScriptVersion, preparedScript, 'Prepared Script')
  const scope = scopeFrom(preparedScriptVersion)
  assertArtifactPayloadScope(preparedScript, scope, 'Prepared Script')
  const styleAuthority = canonicalStorytellingStyleAuthoritySchema.parse(
    input.storytellingStyleAuthority,
  )
  assertScope(styleAuthority, scope, 'Storytelling style authority')
  if (styleAuthority.productionId !== preparedScript.productionId) {
    blocked('Storytelling style authority belongs to another production.')
  }
  const voiceBibleVersion = requireApprovedArtifactVersion(
    input.voiceBibleVersion,
    'voice_bible',
  )
  assertRowScope(voiceBibleVersion, scope, 'Voice Bible')
  const voiceBible = motionStudioVoiceBibleSchema.parse(voiceBibleVersion.payload_json.data)
  assertArtifactPayloadIdentity(voiceBibleVersion, voiceBible, 'Voice Bible')
  assertArtifactPayloadScope(voiceBible, scope, 'Voice Bible')
  if (voiceBible.productionId !== preparedScript.productionId) {
    blocked('Voice Bible belongs to another Storytelling production.')
  }
  const orderedScenes = compileOrderedSceneAuthority(
    input.sceneDocumentVersions,
    preparedScript,
    scope,
  )
  const sourceArtifactApprovalSnapshotId = orderedScenes[0]!.approvedSnapshotId
  const narrationPolicy = createNarrationPolicy(
    voiceBibleVersion,
    voiceBible,
    preparedScript,
  )
  const internalCostAuthority = {
    ...input.internalCostAuthority,
    internalProductionCostOnly: true as const,
    customerPriceIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
  }
  const styleComponentDigest = sha256AuthorityValue(styleAuthority)
  const componentBase = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_PROPOSAL_VERSION,
    targetComponentKey: MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_COMPONENT_KEY,
    targetSchemaVersion: MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_TARGET_VERSION,
    evidenceClass: 'motion_feature_owned_proposal_backend_admission_pending' as const,
    ...scope,
    productionId: preparedScript.productionId,
    sourceMode: 'idea_first_no_uploaded_media' as const,
    preparedScript: {
      version: approvedVersionReference(preparedScriptVersion),
      scriptId: preparedScript.id,
      userLockedText: true as const,
      narrationSegmentCount: preparedScript.narrationSegments.length,
    },
    sourceArtifactApprovalSnapshotId,
    orderedScenes: orderedScenes.map((scene) => ({
      order: scene.order,
      sceneId: scene.sceneId,
      chapterId: scene.chapterId,
      title: scene.title,
      semanticPurpose: scene.semanticPurpose,
      productionMode: scene.productionMode,
      version: scene.version,
      startTimingAnchorId: scene.startTimingAnchorId,
      endTimingAnchorId: scene.endTimingAnchorId,
      startFrame: scene.startFrame,
      endFrame: scene.endFrame,
    })),
    narrationPolicy,
    timingAuthority: preparedScript.timingAuthority,
    confirmedOutputFrame: {
      confirmedFrameId: preparedScript.timingAuthority.confirmedFrameId,
      width: preparedScript.timingAuthority.width,
      height: preparedScript.timingAuthority.height,
      aspectRatio: preparedScript.timingAuthority.aspectRatio,
      frameRate: preparedScript.timingAuthority.frameRate,
      durationFrames: preparedScript.timingAuthority.durationFrames,
      timingAuthorityDigest: preparedScript.timingAuthority.timingAuthorityDigest,
    },
    storytellingStyleAuthority: {
      componentKey: CANONICAL_STORYTELLING_STYLE_AUTHORITY_COMPONENT_KEY,
      componentDigest: styleComponentDigest,
      selectionDigest: styleAuthority.styleSelection.selectionDigest,
      styleProfileId: styleAuthority.styleSelection.styleProfile.styleProfileId,
      motionLanguageDigest: styleAuthority.styleSelection.motionLanguage.motionLanguageDigest,
    },
    sourceCleanup: {
      applicability: 'not_applicable' as const,
      reason: 'idea_first_storytelling_has_no_uploaded_media_source' as const,
      decisionCount: 0 as const,
      fabricatedSourceRecordAllowed: false as const,
    },
    internalCostAuthority,
    changedScriptSceneNarrationStyleFrameOrTimingRequiresFreshPlanAndEstimate: true as const,
    historicalApprovedSnapshotRemainsImmutable: true as const,
    canonicalBackendAdmissionAuthorized: false as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  const componentProposal = storytellingProductionAuthorityComponentProposalSchema.parse({
    ...componentBase,
    componentProposalDigest: sha256CanonicalJson(componentBase),
  })
  const blockers = previewCapacityBlockers(componentProposal)
  const previewAdmission = blockers.length
    ? {
        state: 'blocked_by_current_single_animatic_profile_capacity' as const,
        blockers,
        workItemDraftPresent: false as const,
      }
    : {
        state: 'work_item_draft_ready_backend_admission_pending' as const,
        blockers: [] as [],
        workItemDraft: createRemotionWorkItemDraft(
          componentProposal,
          preparedScriptVersion,
          input.sceneDocumentVersions,
          voiceBibleVersion,
        ),
      }
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_PRODUCTION_PROPOSAL_RESULT_VERSION,
    componentProposal,
    previewAdmission,
    sideEffects: {
      uploadRecordCount: 0 as const,
      queueMutationCount: 0 as const,
      leaseMutationCount: 0 as const,
      providerRequestCount: 0 as const,
      renderCount: 0 as const,
      customerCreditMutationCount: 0 as const,
      billingMutationCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(storytellingProductionProposalResultSchema.parse({
    ...base,
    proposalDigest: sha256CanonicalJson(base),
  }))
}

export function verifyStorytellingProductionProposalResult(
  value: StorytellingProductionProposalResult,
): boolean {
  return storytellingProductionProposalResultSchema.safeParse(value).success
}

function compileOrderedSceneAuthority(
  versions: readonly MotionStudioArtifactVersionRow[],
  script: PreparedScript,
  scope: ReturnType<typeof scopeFrom>,
) {
  const expectedSceneIds = script.chapters.flatMap((chapter) => chapter.sceneIds)
  const narratedSceneOrder = collapseAdjacent(
    script.narrationSegments.map((segment) => segment.sceneId),
  )
  if (
    expectedSceneIds.length !== narratedSceneOrder.length ||
    expectedSceneIds.some((sceneId, index) => sceneId !== narratedSceneOrder[index])
  ) {
    blocked('Prepared Script chapters and narration do not define one exact ordered scene sequence.')
  }
  if (versions.length !== expectedSceneIds.length) {
    blocked('Storytelling production authority requires one exact SceneDocument version per scripted scene.')
  }
  const seenVersionIds = new Set<string>()
  let priorEndFrame = 0
  let approvalSnapshotId: string | undefined
  return versions.map((row, order) => {
    const version = requireApprovedArtifactVersion(row, 'scene_document')
    assertRowScope(version, scope, 'SceneDocument')
    if (seenVersionIds.has(version.id)) blocked('SceneDocument version identities must be unique.')
    seenVersionIds.add(version.id)
    const document = motionStudioSceneDocumentSchema.parse(version.payload_json.data)
    assertArtifactPayloadIdentity(version, document, 'SceneDocument')
    assertArtifactPayloadScope(document, scope, 'SceneDocument')
    if (document.productionId !== script.productionId || document.sceneId !== expectedSceneIds[order]) {
      blocked('SceneDocument order, scene identity, or production authority changed.')
    }
    if (!sameTimingAuthority(document.timingAuthority, script.timingAuthority)) {
      blocked('SceneDocument timing authority does not match the exact Prepared Script.')
    }
    if (approvalSnapshotId && document.approvedSnapshotId !== approvalSnapshotId) {
      blocked('Ordered SceneDocuments do not share one exact source artifact approval snapshot.')
    }
    approvalSnapshotId = document.approvedSnapshotId
    const segments = script.narrationSegments.filter((segment) => segment.sceneId === document.sceneId)
    if (!segments.length) blocked('Every SceneDocument requires exact prepared narration coverage.')
    const startFrame = segments[0]!.startFrame
    const endFrame = segments.at(-1)!.endFrame
    if (startFrame !== priorEndFrame || endFrame <= startFrame) {
      blocked('Ordered SceneDocuments must be positive, gap-free, and non-overlapping.')
    }
    for (let index = 1; index < segments.length; index += 1) {
      if (segments[index - 1]!.endFrame !== segments[index]!.startFrame) {
        blocked('Prepared narration coverage inside a SceneDocument must be contiguous.')
      }
    }
    if (
      document.timing.startAnchorId !== segments[0]!.startTimingAnchorId ||
      document.timing.endAnchorId !== segments.at(-1)!.endTimingAnchorId
    ) {
      blocked('SceneDocument anchor range does not match Prepared Script narration authority.')
    }
    priorEndFrame = endFrame
    const chapter = script.chapters.find((candidate) => candidate.id === segments[0]!.chapterId)
    return {
      order,
      sceneId: document.sceneId,
      chapterId: segments[0]!.chapterId,
      title: chapter?.title ?? document.sceneId,
      semanticPurpose: document.semanticPurpose,
      productionMode: document.productionMode,
      version: approvedVersionReference(version),
      startTimingAnchorId: document.timing.startAnchorId,
      endTimingAnchorId: document.timing.endAnchorId,
      startFrame,
      endFrame,
      approvedSnapshotId: document.approvedSnapshotId,
    }
  }).map((scene, index, all) => {
    if (index === all.length - 1 && scene.endFrame !== script.timingAuthority.durationFrames) {
      blocked('Ordered SceneDocuments must cover the exact Master Timing frame range.')
    }
    return scene
  })
}

function createNarrationPolicy(
  version: MotionStudioArtifactVersionRow,
  voiceBible: VoiceBible,
  script: PreparedScript,
) {
  const voiceBibleVersion = approvedVersionReference(version)
  if (voiceBible.providerCapability === 'speech_generation') {
    if (!voiceBible.voiceProfileReference) {
      blocked('Generated Storytelling narration requires an exact Voice Bible profile reference.')
    }
    return generatedNarrationPolicySchema.parse({
      mode: 'generated_speech_required',
      requiredByPreviewProfile: true,
      voiceBibleVersion,
      voiceProfileReference: voiceBible.voiceProfileReference,
      segmentRequirements: script.narrationSegments.map((segment) => ({
        preparedScriptSegmentId: segment.id,
        sceneId: segment.sceneId,
        startFrame: segment.startFrame,
        endFrame: segment.endFrame,
        spokenTextDigest: sha256CanonicalJson({
          language: script.language,
          text: segment.text,
          preservationPolicy: segment.preservationPolicy,
          voiceBibleContentDigest: version.content_digest,
        }),
      })),
      expectedProviderOperationId: 'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
      normalizedNarrationRequiredBeforePreview: true,
      providerExecutionAuthorized: false,
    })
  }
  const narration = voiceBible.uploadedNarration
  if (!narration) blocked('Uploaded narration Voice Bible lost its exact private media authority.')
  const expectedDurationMilliseconds = script.timingAuthority.durationFrames /
    script.timingAuthority.frameRate * 1_000
  const oneFrameMilliseconds = 1_000 / script.timingAuthority.frameRate
  if (Math.abs(narration.durationMilliseconds - expectedDurationMilliseconds) > oneFrameMilliseconds + 1) {
    blocked('Uploaded narration duration differs from exact Master Timing by more than one frame.')
  }
  return uploadedNarrationPolicySchema.parse({
    mode: 'verified_uploaded_narration',
    requiredByPreviewProfile: true,
    voiceBibleVersion,
    uploadedNarrationAuthorityDigest: sha256CanonicalJson(narration),
    mediaAssetId: narration.mediaAssetId,
    storageObjectRecordId: narration.storageObjectRecordId,
    checksumSha256: narration.checksumSha256,
    mimeType: narration.mimeType,
    byteLength: narration.byteLength,
    durationMilliseconds: narration.durationMilliseconds,
    normalizedNarrationRequiredBeforePreview: false,
    providerExecutionAuthorized: false,
  })
}

function previewCapacityBlockers(
  component: StorytellingProductionAuthorityComponentProposal,
): Array<z.infer<typeof previewCapacityBlockerSchema>> {
  const blockers: Array<z.infer<typeof previewCapacityBlockerSchema>> = []
  if (component.orderedScenes.length > 8) blockers.push('scene_count_exceeds_single_animatic_profile')
  if (component.timingAuthority.durationFrames > 900) blockers.push('duration_exceeds_single_animatic_profile')
  if (component.timingAuthority.frameRate !== 24 && component.timingAuthority.frameRate !== 30) {
    blockers.push('frame_rate_not_supported_by_animatic_profile')
  }
  if (!previewFrame(component.timingAuthority)) {
    blockers.push('output_aspect_ratio_not_supported_by_animatic_profile')
  }
  return blockers
}

function createRemotionWorkItemDraft(
  component: StorytellingProductionAuthorityComponentProposal,
  preparedScriptVersion: MotionStudioArtifactVersionRow,
  sceneVersions: readonly MotionStudioArtifactVersionRow[],
  voiceBibleVersion: MotionStudioArtifactVersionRow,
) {
  const frame = previewFrame(component.timingAuthority)
  if (!frame) blocked('Current animatic profile does not support this confirmed output aspect ratio.')
  const planningPayload: OfflineRemotionMotionStudioAnimaticPlanningPayload =
    validateOfflineRemotionMotionStudioAnimaticPlanningPayload({
      compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
      width: frame.width,
      height: frame.height,
      fps: component.timingAuthority.frameRate,
      durationFrames: component.timingAuthority.durationFrames,
      scenes: component.orderedScenes.map((scene) => ({
        order: scene.order,
        sceneId: scene.sceneId,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        title: scene.title,
        visualDescription: scene.semanticPurpose,
      })),
      panelBackground: '#081426',
      accentColor: '#24C8FF',
    })
  const narrationPolicyDigest = sha256CanonicalJson(component.narrationPolicy)
  const narrationDependency = component.narrationPolicy.mode === 'generated_speech_required'
    ? {
        mode: 'generated_speech_required' as const,
        narrationPolicyDigest,
        expectedArtifactRole: 'normalized_storytelling_narration' as const,
        currentPrivateArtifactPresent: false as const,
      }
    : {
        mode: 'verified_uploaded_narration' as const,
        narrationPolicyDigest,
        mediaAssetId: component.narrationPolicy.mediaAssetId,
        checksumSha256: component.narrationPolicy.checksumSha256,
        currentPrivateArtifactPresent: true as const,
      }
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_REMOTION_WORK_ITEM_DRAFT_VERSION,
    workItemKey: `storytelling-animatic-${component.componentProposalDigest.slice(0, 16)}`,
    workItemType: 'render_remotion_preview' as const,
    workerClass: 'render_worker' as const,
    canonicalToolId: 'remotion' as const,
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1' as const,
    productionAuthorityComponentDigest: component.componentProposalDigest,
    planningPayload,
    planningPayloadDigest: sha256CanonicalJson(planningPayload),
    dependencyArtifactVersions: [
      versionReference(preparedScriptVersion),
      ...sceneVersions.map(versionReference),
      versionReference(voiceBibleVersion),
    ],
    narrationDependency,
    sourceSequenceItemIds: [] as [],
    sourceCleanupDecisionIds: [] as [],
    expectedOutput: {
      outputKey: 'storytelling_private_animatic_preview' as const,
      artifactType: 'motion_studio_storytelling_animatic_preview' as const,
      assetRole: 'preview' as const,
      contentType: 'video/mp4' as const,
      privateCreateOnly: true as const,
      finalAssetEligible: false as const,
    },
    maximumAttempts: 1 as const,
    automaticRetriesAllowed: false as const,
    automaticFallbacksAllowed: false as const,
    maximumAuthorizedInternalProductionCostMicros:
      component.internalCostAuthority.maximumAuthorizedInternalProductionCostMicros,
    providerExecutionMode: 'none' as const,
    canonicalBackendAdmissionAuthorized: false as const,
    runtimeExecutionAuthorized: false as const,
    immutable: true as const,
  }
  return storytellingRemotionWorkItemDraftSchema.parse({
    ...base,
    draftDigest: sha256CanonicalJson(base),
  })
}

function requireApprovedArtifactVersion(
  value: MotionStudioArtifactVersionRow,
  expectedKind: MotionStudioArtifactVersionRow['kind'],
): MotionStudioArtifactVersionRow {
  if (
    value.kind !== expectedKind ||
    !['approved', 'locked'].includes(value.state) ||
    value.immutable !== true ||
    !digestSchema.safeParse(value.content_digest).success ||
    value.payload_json.schemaVersion !==
      `motion-studio.${expectedKind.replaceAll('_', '-')}.v1`
  ) {
    blocked(`Storytelling production authority requires an approved or locked ${expectedKind} version.`)
  }
  if (value.content_digest !== sha256CanonicalJson(value.payload_json)) {
    blocked(`Storytelling production authority rejected tampered ${expectedKind} payload content.`)
  }
  return value
}

function assertArtifactPayloadIdentity(
  row: MotionStudioArtifactVersionRow,
  payload: { id: string; productionId: string },
  label: string,
): void {
  if (row.artifact_id !== payload.id || row.production_id !== payload.productionId) {
    blocked(`${label} row and payload artifact or production identity changed.`)
  }
}

function versionReference(value: MotionStudioArtifactVersionRow): MotionStudioVersionReference {
  return {
    artifactId: value.artifact_id,
    versionId: value.id,
    versionNumber: value.version_number,
    contentDigest: value.content_digest,
  }
}

function approvedVersionReference(value: MotionStudioArtifactVersionRow): MotionStudioVersionReference & {
  state: 'approved' | 'locked'
} {
  return {
    ...versionReference(value),
    state: value.state as 'approved' | 'locked',
  }
}

function scopeFrom(value: MotionStudioArtifactVersionRow) {
  return {
    workspaceId: value.workspace_id,
    projectId: value.project_id,
    editSessionId: value.edit_session_id,
  }
}

function assertRowScope(
  value: MotionStudioArtifactVersionRow,
  expected: ReturnType<typeof scopeFrom>,
  label: string,
): void {
  if (
    value.workspace_id !== expected.workspaceId ||
    value.project_id !== expected.projectId ||
    value.edit_session_id !== expected.editSessionId
  ) blocked(`${label} belongs to another workspace, project, or named edit.`)
}

function assertArtifactPayloadScope(
  value: { workspaceId: string; projectId: string; editSessionId: string },
  expected: ReturnType<typeof scopeFrom>,
  label: string,
): void {
  assertScope(value, expected, label)
}

function assertScope(
  value: { workspaceId: string; projectId: string; editSessionId: string },
  expected: ReturnType<typeof scopeFrom>,
  label: string,
): void {
  if (
    value.workspaceId !== expected.workspaceId ||
    value.projectId !== expected.projectId ||
    value.editSessionId !== expected.editSessionId
  ) blocked(`${label} belongs to another workspace, project, or named edit.`)
}

function sameTimingAuthority(
  left: MotionStudioTimingAuthority,
  right: MotionStudioTimingAuthority,
): boolean {
  return sha256CanonicalJson(left) === sha256CanonicalJson(right)
}

function previewFrame(timing: MotionStudioTimingAuthority): { width: 360 | 480 | 640; height: 360 | 480 | 600 | 640 } | undefined {
  const ratio = timing.width / timing.height
  if (Math.abs(ratio - 16 / 9) < 0.000001) return { width: 640, height: 360 }
  if (Math.abs(ratio - 9 / 16) < 0.000001) return { width: 360, height: 640 }
  if (Math.abs(ratio - 1) < 0.000001) return { width: 480, height: 480 }
  if (Math.abs(ratio - 4 / 5) < 0.000001) return { width: 480, height: 600 }
  return undefined
}

function collapseAdjacent(values: readonly string[]): string[] {
  return values.filter((value, index) => index === 0 || value !== values[index - 1])
}

function requireContiguousScenes(
  scenes: readonly { order: number; startFrame: number; endFrame: number }[],
  durationFrames: number,
  context: z.RefinementCtx,
): void {
  let nextFrame = 0
  scenes.forEach((scene, index) => {
    if (scene.order !== index || scene.startFrame !== nextFrame || scene.endFrame <= scene.startFrame) {
      context.addIssue({
        code: 'custom',
        path: ['orderedScenes', index],
        message: 'Storytelling scenes must be ordered, positive, gap-free, and non-overlapping.',
      })
    }
    nextFrame = scene.endFrame
  })
  if (nextFrame !== durationFrames) {
    context.addIssue({
      code: 'custom',
      path: ['orderedScenes'],
      message: 'Storytelling scenes must cover the exact Master Timing duration.',
    })
  }
}

function blocked(message: string): never {
  throw new Error(message)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
