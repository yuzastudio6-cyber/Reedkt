import type { SupabaseClient } from '@supabase/supabase-js'

import {
  motionStudioPreparedScriptSchema,
  motionStudioSceneDocumentSchema,
  storytellingMotionStylePlanReviewInputSchema,
} from '../../../src/lib/motion-studio/contracts'
import { projectCanonicalStorytellingStyleAuthority } from '../../../src/lib/canonical-planning-draft'
import type { StorytellingMotionStylePlanReviewInput } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
  canonicalMotionStudioRemotionPreviewBindingSchema,
  resolveCanonicalMotionStudioRemotionProfile,
} from '../../edit-architecture/canonical-motion-studio-remotion-preview-authority'
import type {
  CanonicalMotionStudioStorytellingProductionAuthorityReaderPort,
} from '../../services/canonical-motion-studio-storytelling-production-authority-service'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import type { CanonicalWorkItemInput } from '../../validation/edit-planning-authority-schemas'
import {
  CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
  canonicalMotionStudioStorytellingProductionAuthoritySchema,
  type CanonicalMotionStudioStorytellingProductionAuthority,
} from '../../validation/canonical-motion-studio-storytelling-production-authority-schemas'
import type {
  MotionStudioArtifactRow,
  MotionStudioArtifactVersionRow,
  MotionStudioProductionRow,
} from '../commands/types'
import { createSupabaseMotionStudioSceneRepository } from '../scenes/repository'
import type { MotionStudioSceneRepository } from '../scenes/types'
import {
  createStorytellingProductionAuthorityProposal,
  type StorytellingProductionProposalResult,
} from './canonical-production-authority-proposal'

export const MOTION_STUDIO_CANONICAL_STORYTELLING_PLANNING_PREPARATION_VERSION =
  'motion-studio.canonical-storytelling-planning-preparation.v1' as const

const MAX_READER_SEEDS = 256
const STORY_SEGMENT_ID = 'motion-studio-storytelling-segment-1'
const MASTER_TIMING_ID = 'motion-studio-storytelling-master-timing'

type PlanningBlocker =
  | 'approved_motion_artifacts_not_ready'
  | 'generated_narration_not_normalized'
  | 'uploaded_narration_not_normalized'
  | 'single_animatic_profile_capacity_exceeded'

export interface MotionStudioCanonicalStorytellingPlanningComponents {
  sourceCleanupSummary: {
    status: 'not_applicable'
    cleanupPreference: 'idea_first_not_applicable'
    trimValidationStatus: 'not_applicable'
    meaningValidationStatus: 'not_applicable'
    userReviewRequired: false
    reason: 'idea_first_storytelling_has_no_uploaded_media_source'
  }
  sourceCleanupPlan: {
    status: 'not_applicable'
    decisions: []
    reason: 'idea_first_storytelling_has_no_uploaded_media_source'
  }
  masterTimingPlan: Record<string, unknown>
  captionVisualCueTimingPlan: Record<string, unknown>
  soundSyncTransitionTimingPlan: Record<string, unknown>
  timingValidationPlan: Record<string, unknown>
  timingSummary: {
    validationStatus: 'warning'
    approvalBlocked: false
    fps: 24 | 30
    totalFrames: number
  }
  segments: Array<{
    segmentId: typeof STORY_SEGMENT_ID
    startFrame: 0
    endFrameExclusive: number
    operationIds: string[]
  }>
  visualAssetPlan: Record<string, unknown>
  colorPipelinePlan: Record<string, unknown>
  rendererPlan: Record<string, unknown>
  toolStrategyPlan: Record<string, unknown>
  qaPlan: Record<string, unknown>
  qaSummary: { status: 'warning'; approvalBlocked: false }
  providerPolicy: { veoPolicy: 'forbidden'; approvedRoutes: [] }
  fallbackPolicy: Record<string, unknown>
}

export type MotionStudioCanonicalStorytellingPlanningPreparation =
  | {
      schemaVersion: typeof MOTION_STUDIO_CANONICAL_STORYTELLING_PLANNING_PREPARATION_VERSION
      state: 'ready_for_canonical_plan'
      authority: CanonicalMotionStudioStorytellingProductionAuthority
      components: MotionStudioCanonicalStorytellingPlanningComponents
      workItems: CanonicalWorkItemInput[]
      blocker: null
      sideEffects: ReturnType<typeof noSideEffects>
      productionReady: false
    }
  | {
      schemaVersion: typeof MOTION_STUDIO_CANONICAL_STORYTELLING_PLANNING_PREPARATION_VERSION
      state: 'blocked'
      blocker: { code: PlanningBlocker; message: string; retryable: boolean }
      sideEffects: ReturnType<typeof noSideEffects>
      productionReady: false
    }

interface PreparationSeed {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  storytellingStylePlan: StorytellingMotionStylePlanReviewInput
}

interface SourceRead {
  production: MotionStudioProductionRow
  artifacts: MotionStudioArtifactRow[]
  preparedScriptVersion: MotionStudioArtifactVersionRow
  sceneDocumentVersions: MotionStudioArtifactVersionRow[]
  voiceBibleVersion: MotionStudioArtifactVersionRow
  sourceRepositoryRevision: number
  sourceRepositoryReadDigest: string
}

export interface MotionStudioStorytellingProductionAuthorityPreparationPort
  extends CanonicalMotionStudioStorytellingProductionAuthorityReaderPort {
  prepareAndVerifyAuthority(input: PreparationSeed): Promise<MotionStudioCanonicalStorytellingPlanningPreparation>
}

export function isMotionStudioStorytellingProductionAuthorityPreparationPort(
  value: CanonicalMotionStudioStorytellingProductionAuthorityReaderPort | undefined,
): value is MotionStudioStorytellingProductionAuthorityPreparationPort {
  return Boolean(
    value &&
    typeof (value as Partial<MotionStudioStorytellingProductionAuthorityPreparationPort>)
      .prepareAndVerifyAuthority === 'function',
  )
}

export class ControlledLocalStorytellingProductionAuthorityReader
implements MotionStudioStorytellingProductionAuthorityPreparationPort {
  readonly schemaVersion =
    CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION
  readonly sourceAuthority = 'motion_studio_storytelling_artifact_repository' as const
  readonly evidenceClass = 'controlled_local_source_verified_non_promotable' as const
  readonly productionReady = false as const

  private readonly repository: MotionStudioSceneRepository
  private readonly seeds = new Map<string, PreparationSeed>()

  constructor(repository: MotionStudioSceneRepository) {
    this.repository = repository
  }

  async prepareAndVerifyAuthority(
    input: PreparationSeed,
  ): Promise<MotionStudioCanonicalStorytellingPlanningPreparation> {
    const stylePlan = storytellingMotionStylePlanReviewInputSchema.parse(
      input.storytellingStylePlan,
    )
    assertSameScope(input, stylePlan)
    let built: Awaited<ReturnType<typeof this.buildAuthority>>
    try {
      built = await this.buildAuthority({ ...input, storytellingStylePlan: stylePlan })
    } catch (error) {
      if (error instanceof ApiError) throw error
      return blockedPreparation(
        'approved_motion_artifacts_not_ready',
        error instanceof Error
          ? error.message
          : 'Approve the exact Prepared Script, SceneDocuments, and Voice Bible before Plan Review.',
        true,
      )
    }

    const seedKey = authoritySeedKey(
      built.authority.authorityHash,
      built.authority.sourceProposal.componentProposalDigest,
    )
    this.remember(seedKey, { ...input, storytellingStylePlan: structuredClone(stylePlan) })
    return buildPlanningPreparation(built.authority, built.styleAuthority, built.proposal)
  }

  async readAndVerifyAuthority(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    expectedComponentProposalDigest: string
    expectedAuthorityHash: string
  }): Promise<unknown> {
    const seed = this.seeds.get(authoritySeedKey(
      input.expectedAuthorityHash,
      input.expectedComponentProposalDigest,
    ))
    if (!seed) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Refresh Storytelling planning so the server can re-read the exact approved Motion artifacts.',
        503,
        {
          requiredGate: 'fresh_motion_studio_storytelling_source_verification',
          productionReady: false,
        },
      )
    }
    assertSameScope(input, seed)
    const rebuilt = await this.buildAuthority(seed)
    if (
      rebuilt.authority.authorityHash !== input.expectedAuthorityHash ||
      rebuilt.authority.sourceProposal.componentProposalDigest !==
        input.expectedComponentProposalDigest
    ) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Approved Storytelling artifacts changed; create a fresh plan and estimate.',
        409,
        { requiredGate: 'fresh_storytelling_plan_after_artifact_change' },
      )
    }
    return rebuilt.authority
  }

  private async buildAuthority(seed: PreparationSeed) {
    const styleAuthority = projectCanonicalStorytellingStyleAuthority(
      seed.storytellingStylePlan,
    )
    const source = await readExactSource(this.repository, seed)
    const proposal = createStorytellingProductionAuthorityProposal({
      preparedScriptVersion: source.preparedScriptVersion,
      sceneDocumentVersions: source.sceneDocumentVersions,
      voiceBibleVersion: source.voiceBibleVersion,
      storytellingStyleAuthority: styleAuthority,
      internalCostAuthority: {
        estimateId: styleAuthority.internalCostEnvelope.estimateId,
        estimateDigest: styleAuthority.internalCostEnvelope.estimateDigest,
        maximumAuthorizedInternalProductionCostMicros:
          styleAuthority.internalCostEnvelope.maximumEstimatedInternalProductionCostMicros,
      },
    })
    const authority = projectCanonicalProductionAuthority(proposal, source)
    assertSameScope(seed, authority)
    return { authority, proposal, source, styleAuthority }
  }

  private remember(key: string, seed: PreparationSeed): void {
    this.seeds.delete(key)
    this.seeds.set(key, seed)
    while (this.seeds.size > MAX_READER_SEEDS) {
      const oldest = this.seeds.keys().next().value
      if (typeof oldest !== 'string') break
      this.seeds.delete(oldest)
    }
  }
}

export function createControlledLocalStorytellingProductionAuthorityReader(
  client: SupabaseClient,
): MotionStudioStorytellingProductionAuthorityPreparationPort {
  return new ControlledLocalStorytellingProductionAuthorityReader(
    createSupabaseMotionStudioSceneRepository(client),
  )
}

async function readExactSource(
  repository: MotionStudioSceneRepository,
  expected: Pick<PreparationSeed, 'workspaceId' | 'projectId' | 'editSessionId' | 'productionId'>,
): Promise<SourceRead> {
  const production = await repository.findProduction(expected.productionId)
  if (!production) throw new Error('Storytelling production was not found.')
  assertSameScope(expected, rowScope(production))
  if (production.module_id !== 'storytelling' || production.status === 'archived') {
    throw new Error('Storytelling production is unavailable for planning.')
  }

  const artifacts = await repository.listArtifacts(expected.productionId, [
    'prepared_script',
    'scene_document',
    'voice_bible',
  ])
  const preparedScriptArtifact = exactlyOne(artifacts, 'prepared_script')
  const voiceBibleArtifact = exactlyOne(artifacts, 'voice_bible')
  const sceneArtifacts = artifacts.filter((artifact) => artifact.kind === 'scene_document')
  if (sceneArtifacts.length === 0 || sceneArtifacts.length > 64) {
    throw new Error('Approve one exact SceneDocument for every scripted scene.')
  }
  const approvedVersionIds = [
    requiredApprovedVersionId(preparedScriptArtifact),
    requiredApprovedVersionId(voiceBibleArtifact),
    ...sceneArtifacts.map(requiredApprovedVersionId),
  ]
  const versions = await repository.findArtifactVersions(
    expected.productionId,
    approvedVersionIds,
  )
  const versionsById = new Map(versions.map((version) => [version.id, version]))
  const preparedScriptVersion = requireVersion(
    versionsById,
    requiredApprovedVersionId(preparedScriptArtifact),
    'Prepared Script',
  )
  const voiceBibleVersion = requireVersion(
    versionsById,
    requiredApprovedVersionId(voiceBibleArtifact),
    'Voice Bible',
  )
  const preparedScript = motionStudioPreparedScriptSchema.parse(
    preparedScriptVersion.payload_json.data,
  )
  const expectedSceneIds = preparedScript.chapters.flatMap((chapter) => chapter.sceneIds)
  const sceneVersionsBySceneId = new Map<string, MotionStudioArtifactVersionRow>()
  for (const artifact of sceneArtifacts) {
    const version = requireVersion(
      versionsById,
      requiredApprovedVersionId(artifact),
      'SceneDocument',
    )
    const document = motionStudioSceneDocumentSchema.parse(version.payload_json.data)
    if (sceneVersionsBySceneId.has(document.sceneId)) {
      throw new Error('SceneDocument authority is ambiguous for one scripted scene.')
    }
    sceneVersionsBySceneId.set(document.sceneId, version)
  }
  const sceneDocumentVersions = expectedSceneIds.map((sceneId) => {
    const version = sceneVersionsBySceneId.get(sceneId)
    if (!version) throw new Error('Approve one exact SceneDocument for every scripted scene.')
    return version
  })
  if (sceneDocumentVersions.length !== sceneArtifacts.length) {
    throw new Error('Remove stale or unrelated SceneDocuments before Storytelling Plan Review.')
  }

  const sourceRepositoryRevision = repositoryRevision(
    production,
    artifacts,
    [preparedScriptVersion, ...sceneDocumentVersions, voiceBibleVersion],
  )
  const sourceRepositoryReadDigest = sha256AuthorityValue({
    production: {
      id: production.id,
      workspaceId: production.workspace_id,
      projectId: production.project_id,
      editSessionId: production.edit_session_id,
      recordVersion: production.record_version,
      status: production.status,
    },
    artifacts: [...artifacts]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((artifact) => ({
        id: artifact.id,
        kind: artifact.kind,
        currentApprovedVersionId: artifact.current_approved_version_id,
        currentDraftVersionId: artifact.current_draft_version_id,
        recordVersion: artifact.record_version,
      })),
    versions: [preparedScriptVersion, ...sceneDocumentVersions, voiceBibleVersion]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((version) => ({
        id: version.id,
        artifactId: version.artifact_id,
        kind: version.kind,
        versionNumber: version.version_number,
        state: version.state,
        contentDigest: version.content_digest,
        immutable: version.immutable,
      })),
  })
  return {
    production,
    artifacts,
    preparedScriptVersion,
    sceneDocumentVersions,
    voiceBibleVersion,
    sourceRepositoryRevision,
    sourceRepositoryReadDigest,
  }
}

function projectCanonicalProductionAuthority(
  proposal: StorytellingProductionProposalResult,
  source: SourceRead,
): CanonicalMotionStudioStorytellingProductionAuthority {
  const component = proposal.componentProposal
  const {
    schemaVersion: sourceSchemaVersion,
    targetComponentKey,
    targetSchemaVersion,
    evidenceClass,
    canonicalBackendAdmissionAuthorized,
    componentProposalDigest,
    ...componentAuthority
  } = component
  void canonicalBackendAdmissionAuthorized
  const withoutHash = {
    schemaVersion: targetSchemaVersion,
    componentKey: targetComponentKey,
    sourceProposal: {
      schemaVersion: sourceSchemaVersion,
      componentProposalDigest,
      evidenceClass,
      canonicalBackendAdmissionAuthorized: false as const,
    },
    sourceVerification: {
      readerVersion:
        CANONICAL_MOTION_STUDIO_STORYTELLING_PRODUCTION_AUTHORITY_READER_VERSION,
      sourceAuthority: 'motion_studio_storytelling_artifact_repository' as const,
      evidenceClass: 'controlled_local_source_verified_non_promotable' as const,
      sourceRepositoryRevision: source.sourceRepositoryRevision,
      sourceRepositoryReadDigest: source.sourceRepositoryReadDigest,
      sourcePayloadDigestsReverified: true as const,
      exactScopeReverified: true as const,
      exactApprovalStatesReverified: true as const,
    },
    ...componentAuthority,
    sourceRepositoryReverified: true as const,
    noUploadedSourceExpected: true as const,
    fabricatedUploadRecordCount: 0 as const,
    privateInternalControlledPlanningOnly: true as const,
  }
  return canonicalMotionStudioStorytellingProductionAuthoritySchema.parse({
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  })
}

function buildPlanningPreparation(
  authority: CanonicalMotionStudioStorytellingProductionAuthority,
  styleAuthority: ReturnType<typeof projectCanonicalStorytellingStyleAuthority>,
  proposal: StorytellingProductionProposalResult,
): MotionStudioCanonicalStorytellingPlanningPreparation {
  if (proposal.previewAdmission.state !== 'work_item_draft_ready_backend_admission_pending') {
    return blockedPreparation(
      'single_animatic_profile_capacity_exceeded',
      'This story exceeds the current single private animatic profile. Split it into a supported chapter preview before Plan Review.',
      false,
    )
  }
  if (authority.narrationPolicy.mode === 'generated_speech_required') {
    return blockedPreparation(
      'generated_narration_not_normalized',
      'Generate and approve the exact private narration before this animatic can enter Plan Review.',
      true,
    )
  }
  if (authority.narrationPolicy.mimeType !== 'audio/wav') {
    return blockedPreparation(
      'uploaded_narration_not_normalized',
      'Normalize the approved uploaded narration to private PCM WAV before this animatic can enter Plan Review.',
      true,
    )
  }

  const planningPayload = proposal.previewAdmission.workItemDraft.planningPayload
  const profile = resolveCanonicalMotionStudioRemotionProfile(planningPayload)
  if (!profile || profile.profileId !== 'motion_studio_prepared_script_animatic_v1') {
    throw new Error('Storytelling proposal lost its exact prepared-script animatic profile.')
  }
  const components = planningComponents(authority)
  const timingAuthorityDigest = sha256AuthorityValue({
    masterTimingPlan: components.masterTimingPlan,
    captionVisualCueTimingPlan: components.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: components.soundSyncTransitionTimingPlan,
    timingValidationPlan: components.timingValidationPlan,
    timingSummary: components.timingSummary,
  })
  const narrationPolicyDigest = sha256AuthorityValue(authority.narrationPolicy)
  const bindingWithoutHash = {
    schemaVersion: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
    sourceAuthority: 'motion_studio_storytelling_compiler' as const,
    evidenceClass: 'controlled_local_content_addressed_non_promotable' as const,
    workspaceId: authority.workspaceId,
    projectId: authority.projectId,
    editSessionId: authority.editSessionId,
    productionId: authority.productionId,
    storytellingProductionAuthorityHash: authority.authorityHash,
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1' as const,
    canonicalStyleComponentDigest: sha256AuthorityValue(styleAuthority),
    styleSelectionDigest: styleAuthority.styleSelection.selectionDigest,
    motionDna: { ...styleAuthority.styleSelection.motionDnaVersion },
    referenceContracts: styleAuthority.styleSelection.referenceContractVersions.map(
      (reference) => ({ ...reference }),
    ),
    sourceAuditDigests: [...styleAuthority.styleSelection.sourceAuditDigests],
    calibrationPlan: {
      id: styleAuthority.calibrationPlan.id,
      digest: styleAuthority.calibrationPlan.planDigest,
    },
    internalCostEnvelope: {
      estimateId: styleAuthority.internalCostEnvelope.estimateId,
      digest: styleAuthority.internalCostEnvelope.estimateDigest,
    },
    preparedScript: { ...authority.preparedScript.version },
    sceneDocuments: authority.orderedScenes.map((scene) => ({ ...scene.version })),
    narrationAuthorityDigest: narrationPolicyDigest,
    narrationDependencyAuthority: {
      mode: 'verified_uploaded_narration' as const,
      narrationPolicyDigest,
      mediaAssetId: authority.narrationPolicy.mediaAssetId,
      storageObjectRecordId: authority.narrationPolicy.storageObjectRecordId,
      checksumSha256: authority.narrationPolicy.checksumSha256,
      mimeType: authority.narrationPolicy.mimeType,
      byteLength: authority.narrationPolicy.byteLength,
      currentPrivateArtifactPresent: true as const,
      providerExecutionAuthorized: false as const,
    },
    timingAuthorityDigest,
    confirmedOutputFrame: {
      width: authority.confirmedOutputFrame.width,
      height: authority.confirmedOutputFrame.height,
      fps: authority.confirmedOutputFrame.frameRate,
    },
    previewFrame: {
      width: profile.width,
      height: profile.height,
      fps: profile.fps,
    },
    sourceRepositoryReverified: false as const,
    privateInternalControlledExecutionOnly: true as const,
    providerExecutionAuthorized: false as const,
    customerPriceIncluded: false as const,
    customerCreditsIncluded: false as const,
    serviceFeeIncluded: false as const,
    productionReady: false as const,
  }
  const binding = canonicalMotionStudioRemotionPreviewBindingSchema.parse({
    ...bindingWithoutHash,
    bindingHash: sha256AuthorityValue(bindingWithoutHash),
  })
  return {
    schemaVersion: MOTION_STUDIO_CANONICAL_STORYTELLING_PLANNING_PREPARATION_VERSION,
    state: 'ready_for_canonical_plan',
    authority,
    components,
    workItems: planningWorkItems(
      authority,
      binding,
      planningPayload as unknown as Record<string, unknown>,
    ),
    blocker: null,
    sideEffects: noSideEffects(),
    productionReady: false,
  }
}

function planningComponents(
  authority: CanonicalMotionStudioStorytellingProductionAuthority,
): MotionStudioCanonicalStorytellingPlanningComponents {
  return {
    sourceCleanupSummary: {
      status: 'not_applicable',
      cleanupPreference: 'idea_first_not_applicable',
      trimValidationStatus: 'not_applicable',
      meaningValidationStatus: 'not_applicable',
      userReviewRequired: false,
      reason: 'idea_first_storytelling_has_no_uploaded_media_source',
    },
    sourceCleanupPlan: {
      status: 'not_applicable',
      decisions: [],
      reason: 'idea_first_storytelling_has_no_uploaded_media_source',
    },
    masterTimingPlan: {
      status: 'ready',
      sourceAuthority: 'motion_studio_prepared_script',
      preparedScriptVersion: { ...authority.preparedScript.version },
      timingAuthority: { ...authority.timingAuthority },
      sceneDocumentVersions: authority.orderedScenes.map((scene) => ({ ...scene.version })),
    },
    captionVisualCueTimingPlan: {
      status: 'planned_for_animatic_review',
      speechClarityPriority: true,
      finalCaptionRenderingAuthorized: false,
    },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed_for_private_animatic',
      speechPriority: true,
      finalSoundMixAuthorized: false,
    },
    timingValidationPlan: {
      overallStatus: 'warning',
      approvalBlocked: false,
      sourceAuthority: 'source_verified_motion_studio_timing',
      privateAnimaticOnly: true,
      finalDeliveryAuthorized: false,
    },
    timingSummary: {
      validationStatus: 'warning',
      approvalBlocked: false,
      fps: authority.timingAuthority.frameRate,
      totalFrames: authority.timingAuthority.durationFrames,
    },
    segments: [{
      segmentId: STORY_SEGMENT_ID,
      startFrame: 0,
      endFrameExclusive: authority.timingAuthority.durationFrames,
      operationIds: [
        'bind-approved-narration',
        'render-approved-storytelling-animatic',
        'validate-private-storytelling-animatic',
      ],
    }],
    visualAssetPlan: {
      status: 'planned',
      ideaFirstStorytelling: true,
      fabricatedUploadedMediaAllowed: false,
      orderedSceneCount: authority.orderedScenes.length,
    },
    colorPipelinePlan: {
      status: 'not_needed_for_private_animatic',
      finalColorPipelineAuthorized: false,
    },
    rendererPlan: {
      renderer: 'remotion',
      compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
      privatePreviewOnly: true,
      finalDeliveryAuthorized: false,
    },
    toolStrategyPlan: {
      toolIds: ['remotion'],
      exactOperationIds: ['tool.remotion.render_approved_composition.v1'],
      providerExecutionAuthorized: false,
    },
    qaPlan: {
      status: 'planned',
      checks: ['artifact_lineage', 'timing', 'frame', 'private_preview_only'],
      finalMasterQaAuthorized: false,
    },
    qaSummary: { status: 'warning', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: {
      unapprovedFallbackAllowed: false,
      providerFallbackAuthorized: false,
      revisionRequiresFreshPlanAndEstimate: true,
    },
  }
}

function planningWorkItems(
  authority: CanonicalMotionStudioStorytellingProductionAuthority,
  binding: ReturnType<typeof canonicalMotionStudioRemotionPreviewBindingSchema.parse>,
  planningPayload: Record<string, unknown>,
): CanonicalWorkItemInput[] {
  const common = {
    sourceSequenceItemIds: [] as string[],
    sourceCleanupDecisionIds: [] as string[],
    providerExecutionMode: 'none' as const,
    fallbackPolicy: {},
    maxAttempts: 1,
    scheduledDelaySeconds: 0,
    required: true,
  }
  return [{
    workItemKey: 'idea-first-snapshot-validation',
    workItemType: 'validate_approved_snapshot',
    workerClass: 'authority_worker',
    executionInput: { operation: 'validate_snapshot_manifest' },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-snapshot-validation-evidence',
      artifactType: 'authority_validation_evidence',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [],
    attemptTimeoutSeconds: 60,
    maximumCreditBudget: 1,
  }, {
    workItemKey: 'idea-first-approved-narration-authority',
    workItemType: 'custom',
    workerClass: 'media_processing_worker',
    executionInput: {
      operation: 'bind_verified_uploaded_storytelling_narration',
      narrationAuthorityDigest: sha256AuthorityValue(authority.narrationPolicy),
    },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-approved-narration-wav',
      artifactType: 'verified_uploaded_storytelling_narration_wav',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'audio/wav',
      segmentIds: [STORY_SEGMENT_ID],
      timingIds: [MASTER_TIMING_ID],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['idea-first-snapshot-validation'],
    approvedToolIds: [],
    attemptTimeoutSeconds: 120,
    maximumCreditBudget: 1,
  }, {
    workItemKey: 'idea-first-storytelling-animatic-preview',
    workItemType: 'render_remotion_preview',
    workerClass: 'render_worker',
    executionInput: {
      operation: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
      approvedToolOperationIds: ['tool.remotion.render_approved_composition.v1'],
      expectedOutputKeys: ['idea-first-storytelling-animatic-mp4'],
      motionStudioStorytellingAuthority: binding,
      structuredPayload: planningPayload,
    },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-storytelling-animatic-mp4',
      artifactType: 'motion_studio_prepared_script_animatic_private_preview_mp4',
      assetRole: 'preview',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'video/mp4',
      segmentIds: [STORY_SEGMENT_ID],
      timingIds: [MASTER_TIMING_ID],
      rendererLayerIds: ['motion-studio-storytelling-animatic-layer'],
    }],
    dependencyKeys: ['idea-first-approved-narration-authority'],
    approvedToolIds: ['remotion'],
    attemptTimeoutSeconds: 300,
    maximumCreditBudget: 3,
  }, {
    workItemKey: 'idea-first-storytelling-animatic-qa',
    workItemType: 'run_asset_qa',
    workerClass: 'qa_worker',
    executionInput: { operation: 'validate_private_storytelling_animatic' },
    ...common,
    expectedOutputs: [{
      outputKey: 'idea-first-storytelling-animatic-qa-report',
      artifactType: 'motion_studio_storytelling_animatic_qa_report',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [STORY_SEGMENT_ID],
      timingIds: [MASTER_TIMING_ID],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['idea-first-storytelling-animatic-preview'],
    approvedToolIds: [],
    attemptTimeoutSeconds: 120,
    maximumCreditBudget: 1,
  }]
}

function exactlyOne(
  artifacts: MotionStudioArtifactRow[],
  kind: MotionStudioArtifactRow['kind'],
): MotionStudioArtifactRow {
  const matches = artifacts.filter((artifact) => artifact.kind === kind)
  if (matches.length !== 1) {
    throw new Error(`Storytelling requires one exact approved ${kind} artifact.`)
  }
  return matches[0]!
}

function requiredApprovedVersionId(artifact: MotionStudioArtifactRow): string {
  if (!artifact.current_approved_version_id) {
    throw new Error(`Approve the current ${artifact.kind} before Storytelling Plan Review.`)
  }
  return artifact.current_approved_version_id
}

function requireVersion(
  versions: Map<string, MotionStudioArtifactVersionRow>,
  versionId: string,
  label: string,
): MotionStudioArtifactVersionRow {
  const version = versions.get(versionId)
  if (!version) throw new Error(`${label} approved version could not be re-read.`)
  return version
}

function repositoryRevision(
  production: MotionStudioProductionRow,
  artifacts: MotionStudioArtifactRow[],
  versions: MotionStudioArtifactVersionRow[],
): number {
  const revision = production.record_version +
    artifacts.reduce((total, artifact) => total + artifact.record_version, 0) +
    versions.reduce((total, version) => total + version.version_number, 0)
  if (!Number.isSafeInteger(revision) || revision <= 0) {
    throw new Error('Storytelling source repository revision is invalid.')
  }
  return revision
}

function authoritySeedKey(authorityHash: string, proposalDigest: string): string {
  return `${authorityHash}\u001f${proposalDigest}`
}

function assertSameScope(
  expected: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
  actual: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
): void {
  if (
    expected.workspaceId !== actual.workspaceId ||
    expected.projectId !== actual.projectId ||
    expected.editSessionId !== actual.editSessionId ||
    expected.productionId !== actual.productionId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Storytelling production authority belongs to another workspace, project, or named edit.',
      409,
    )
  }
}

function rowScope(production: MotionStudioProductionRow) {
  return {
    workspaceId: production.workspace_id,
    projectId: production.project_id,
    editSessionId: production.edit_session_id,
    productionId: production.id,
  }
}

function blockedPreparation(
  code: PlanningBlocker,
  message: string,
  retryable: boolean,
): MotionStudioCanonicalStorytellingPlanningPreparation {
  return {
    schemaVersion: MOTION_STUDIO_CANONICAL_STORYTELLING_PLANNING_PREPARATION_VERSION,
    state: 'blocked',
    blocker: { code, message, retryable },
    sideEffects: noSideEffects(),
    productionReady: false,
  }
}

function noSideEffects() {
  return {
    uploadRecordCount: 0 as const,
    queueMutationCount: 0 as const,
    leaseMutationCount: 0 as const,
    providerRequestCount: 0 as const,
    renderCount: 0 as const,
    customerCreditMutationCount: 0 as const,
    billingMutationCount: 0 as const,
    remoteMutationCount: 0 as const,
  }
}
