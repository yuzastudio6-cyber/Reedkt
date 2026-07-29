import {
  bindLivingFrameCanonicalPlanning,
  createLivingFrameSemanticReasoningRequest,
  createLivingFrameSemanticSceneProposalBinding,
  createLivingFrameSemanticSceneProposalFixtureInputs,
  createLivingFrameVisualContinuityPack,
  livingFrameOutputFrameDigestProjection,
  type LivingFrameSemanticReasoningRequest,
  type LivingFrameVisualContinuityPack,
} from '../../../src/lib/living-frame'
import {
  createProfessionalSkillPlan,
} from '../../../src/lib/professional-skills'
import {
  buildProfessionalExportCreditCoverage,
} from '../../../src/lib/professional-export-policy'
import type {
  PlannerInput,
} from '../../../src/types/reeditpro'
import type {
  LivingFrameSelectedSceneAuthorityExpectation,
} from '../../../src/types/living-frame-selected-scene-admission'
import {
  canonicalPlanComponentsSchema,
  type CanonicalPlanComponentsInput,
} from '../../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameSelectedSceneBinding,
} from '../../living-frame/canonical-living-frame-selected-scene-binding'
import {
  compileLivingFrameSelectedSceneAdmission,
} from '../../living-frame/living-frame-selected-scene-admission'
import {
  compileLivingFrameSemanticPlanProjection,
} from '../../living-frame/living-frame-semantic-plan-projection'
import type {
  CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
} from '../../living-frame/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'

let sequence = 0

export async function createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture(): Promise<{
  readonly input:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput
}> {
  const suffix = nextId()
  const baseComponents = createCanonicalComponents(suffix)
  const professionalSkillPlan = createProfessionalSkillPlan({
    plannerInput: createPlannerInput(suffix),
  })
  const deferred = await bindLivingFrameCanonicalPlanning({
    professionalSkillPlan,
    components: baseComponents,
  })
  if (!deferred.livingFrame) {
    throw new Error('Missing deferred Living Frame fixture component.')
  }
  const components = canonicalPlanComponentsSchema.parse({
    ...baseComponents,
    livingFrame: deferred.livingFrame,
  })
  const canonicalScope = {
    workspaceId: `workspace.lf.pack-binding.${suffix}`,
    projectId: `project.lf.pack-binding.${suffix}`,
    editSessionId: `edit.lf.pack-binding.${suffix}`,
    handoffId: `handoff.lf.pack-binding.${suffix}`,
  } as const
  const handoffHash = hash(`handoff-hash-${suffix}`)
  const planningEvidenceDigest = hash(`planning-evidence-${suffix}`)
  const fixtureInputs =
    await createLivingFrameSemanticSceneProposalFixtureInputs()
  const sourceRequest =
    fixtureInputs.musashi.request as LivingFrameSemanticReasoningRequest
  const alignedRequest = await alignRequest({
    request: sourceRequest,
    canonicalScope,
    planningEvidenceDigest,
  })
  const sourcePack =
    fixtureInputs.musashi.continuityPack as
      | LivingFrameVisualContinuityPack
      | null
  if (!sourcePack) {
    throw new Error('Missing visual continuity pack fixture.')
  }
  const alignedPack = await alignPack({
    pack: sourcePack,
    components,
    deferredComponentDigestSha256:
      deferred.livingFrame.contractDigestSha256,
    canonicalScope,
    planningEvidenceDigest,
    alignedRequestDigestSha256:
      alignedRequest.contractDigestSha256,
  })
  const semanticProposalBinding =
    await createLivingFrameSemanticSceneProposalBinding({
      request: alignedRequest,
      result: fixtureInputs.musashi.result,
      continuityPack: alignedPack,
    })
  const semanticPlanProjection =
    await compileLivingFrameSemanticPlanProjection({
      deferredComponent: deferred.livingFrame,
      semanticProposalBinding,
    })
  const selectedSceneAdmission =
    await compileLivingFrameSelectedSceneAdmission({
      canonicalScope,
      semanticPlanProjection,
      authorityExpectations: [
        expectation('canonical_planning_handoff', handoffHash),
        expectation('planning_evidence', planningEvidenceDigest),
        expectation(
          'source_speech_evidence',
          hash(`source-speech-not-required-${suffix}`),
        ),
        expectation(
          'route_data_assurance',
          hash(`controlled-route-assurance-${suffix}`),
        ),
        expectation(
          'released_reasoning_result',
          semanticProposalBinding.contractDigestSha256,
        ),
        expectation(
          'visual_continuity_pack',
          alignedPack.contractDigestSha256,
        ),
        expectation(
          'confirmed_output_frame',
          semanticPlanProjection.projectedComponent.inputBindings
            .outputFrame.expectedDigestSha256,
        ),
        expectation(
          'current_master_timing',
          semanticPlanProjection.projectedComponent.inputBindings
            .masterTiming.expectedDigestSha256,
        ),
      ],
    })
  const selectedSceneBinding =
    await compileCanonicalLivingFrameSelectedSceneBinding({
      identity: {
        ...canonicalScope,
        handoffHash,
        canonicalPlanComponentsHash:
          sha256AuthorityValue(components),
      },
      components,
      semanticPlanProjection,
      admission: selectedSceneAdmission,
      decision: {
        decision: 'selected_scenes',
        selectedScenes:
          selectedSceneAdmission.candidateScenes.map((scene) => ({
            sceneId: scene.sceneId,
            treatment: 'use_full',
          })),
        reasonCode: 'selective_motion_improves_comprehension',
      },
    })
  return {
    input: {
      bindingId: `living-frame.pack-binding.${suffix}`,
      components,
      semanticProposalBinding,
      semanticPlanProjection,
      selectedSceneAdmission,
      selectedSceneBinding,
    },
  }
}

async function alignRequest(input: {
  readonly request: LivingFrameSemanticReasoningRequest
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
  }
  readonly planningEvidenceDigest: string
}): Promise<LivingFrameSemanticReasoningRequest> {
  const {
    semanticPayloadDigestSha256: omittedSemanticPayloadDigest,
    contractDigestSha256: omittedRequestDigest,
    outputContract,
    ...requestBase
  } = input.request
  const {
    outputJsonSchemaDigestSha256: omittedOutputSchemaDigest,
    ...outputContractDraft
  } = outputContract
  void omittedSemanticPayloadDigest
  void omittedRequestDigest
  void omittedOutputSchemaDigest
  return createLivingFrameSemanticReasoningRequest({
    ...requestBase,
    canonicalBindings: {
      ...requestBase.canonicalBindings,
      ...input.canonicalScope,
      preapprovalInputAuthorityDigestSha256:
        hash(`preapproval-${input.canonicalScope.handoffId}`),
      visualEvidenceBindingDigestSha256:
        input.planningEvidenceDigest,
    },
    semanticPayload: {
      ...requestBase.semanticPayload,
      evidence: {
        ...requestBase.semanticPayload.evidence,
        visualEvidenceBindingDigestSha256:
          input.planningEvidenceDigest,
      },
    },
    outputContract: outputContractDraft,
  })
}

async function alignPack(input: {
  readonly pack: LivingFrameVisualContinuityPack
  readonly components: CanonicalPlanComponentsInput
  readonly deferredComponentDigestSha256: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
  }
  readonly planningEvidenceDigest: string
  readonly alignedRequestDigestSha256: string
}): Promise<LivingFrameVisualContinuityPack> {
  const {
    contractDigestSha256: omittedPackDigest,
    ...packDraft
  } = input.pack
  void omittedPackDigest
  return createLivingFrameVisualContinuityPack({
    ...packDraft,
    canonicalBindings: {
      ...packDraft.canonicalBindings,
      ...input.canonicalScope,
      deferredLivingFrameComponentDigestSha256:
        input.deferredComponentDigestSha256,
      planningEvidenceBindingDigestSha256:
        input.planningEvidenceDigest,
      preapprovalReasoningResultBindingDigestSha256:
        input.alignedRequestDigestSha256,
      compiledIntentDigestSha256:
        sha256AuthorityValue(input.components.compiledIntent),
      sourceSequenceDigestSha256:
        sha256AuthorityValue(input.components.sourceSequence),
      outputFrameDigestSha256: sha256AuthorityValue(
        livingFrameOutputFrameDigestProjection(input.components),
      ),
    },
  })
}

function expectation(
  authorityKind:
    LivingFrameSelectedSceneAuthorityExpectation['authorityKind'],
  authorityDigestSha256: string,
): LivingFrameSelectedSceneAuthorityExpectation {
  return {
    authorityKind,
    expectationState: 'controlled_current_match',
    authorityDigestSha256,
  }
}

function createPlannerInput(suffix: string): PlannerInput {
  return {
    projectName: `Living Frame continuity-pack binding ${suffix}`,
    targetPlatform: 'youtube',
    aspectRatio: '16:9',
    aspectRatioConfirmed: true,
    frameTemplateType: 'horizontal_wide_frame',
    editingCategory: 'education_explainer',
    workflowType: 'education_explainer',
    editLevel: 'pro',
    structurePreference: 'improve_if_needed',
    moodStyle: 'premium',
    visualPreference: 'balanced_visual_mix',
    referenceUrl: '',
    customInstructions:
      'Use Living Frame selectively for the central explanation.',
    creditPreference: 'balanced',
    clips: [{
      id: `living-frame-source-${suffix}`,
      uploadedOrder: 1,
      fileName: 'source-one.mp4',
      duration: '0:05',
      detectedType: 'talking_head',
      sourceOrderLocked: true,
    }],
  }
}

function createCanonicalComponents(
  suffix: string,
): CanonicalPlanComponentsInput {
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: 5,
    outputFps: 30,
    approvedAspectRatio: '16:9',
  })
  return canonicalPlanComponentsSchema.parse({
    compiledIntent: {
      goalSummary:
        'Explain one concept with a deferred Living Frame direction.',
    },
    professionalEditingDirective: {
      mustFollowRules: ['Preserve source meaning.'],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3840, height: 2160, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage,
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'youtube',
      preferenceSnapshotId: `living-frame-preference-${suffix}`,
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256: hash(`preference-${suffix}`),
    },
    sourceSequence: [{
      sourceSequenceItemId: `source-${suffix}`,
      mediaAssetId: `media-asset-${suffix}`,
      uploadedOrder: 1,
      checksumSha256: hash(`source-checksum-${suffix}`),
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: `cleanup-${suffix}`,
        sourceSequenceItemId: `source-${suffix}`,
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 150,
        reason: 'Preserve the complete approved source meaning.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: `master-timing-${suffix}`,
      status: 'ready',
      timingBase: { fps: 30, totalFrames: 150 },
      totalFrames: 150,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames: 150,
    },
    segments: [{
      segmentId: `segment-${suffix}`,
      startFrame: 0,
      endFrameExclusive: 150,
      operationIds: [`operation-${suffix}`],
    }],
    visualAssetPlan: { status: 'not_needed' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: {
      renderer: 'remotion',
      frameOwnedByRenderer: true,
    },
    toolStrategyPlan: { toolIds: [] },
    qaPlan: { checks: [] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  })
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}

function nextId(): string {
  sequence += 1
  return String(sequence).padStart(3, '0')
}
