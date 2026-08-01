import type {
  LivingFrameAttentionEventType,
  LivingFrameTimingPhase,
} from '../../src/types/living-frame'
import type {
  LivingFrameChoreographyBinding,
  LivingFrameSoundChoreographyProjection,
} from '../../src/types/living-frame-choreography-binding'
import {
  verifyLivingFrameChoreographyBindingDigest,
} from './living-frame-choreography-binding'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameSceneTimingBinding,
  CanonicalLivingFrameSoundCueTimingBinding,
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_CLASS,
  LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_OPEN_GATES,
  LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATE,
  LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_VERSION,
  type LivingFrameSemanticSoundTimingReconciliation,
  type LivingFrameSemanticSoundTimingReconciliationAuthority,
  type LivingFrameSemanticSoundTimingReconciliationDraft,
  type LivingFrameSemanticSoundTimingReconciliationIssue,
  type LivingFrameSemanticSoundTimingReconciliationIssueCode,
  type LivingFrameSemanticSoundTimingReconciliationStatus,
  type LivingFrameSemanticSoundTimingReconciliationUnit,
} from '../../src/types/living-frame-semantic-sound-timing-reconciliation'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyCanonicalLivingFrameExecutionRequirements,
} from './canonical-living-frame-execution-requirements'
import {
  verifyCanonicalLivingFrameTimingBinding,
} from './canonical-living-frame-timing-binding'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const ATTENTION_EVENT_TO_REQUIRED_PHASE:
  Readonly<Record<
    LivingFrameAttentionEventType,
    LivingFrameTimingPhase
  >> = Object.freeze({
    prepare: 'prepare',
    handoff: 'activate',
    hold: 'demonstrate',
    restore: 'resolve',
    transition_away: 'resolve',
  })

const AUTHORITY_BOUNDARY:
  LivingFrameSemanticSoundTimingReconciliationAuthority =
  deepFreeze({
    readOnlySemanticSoundTimingReconciliationAuthority: true,
    livingFrameSelectionAuthority: false,
    choreographyAuthority: false,
    attentionTimingAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    exactSoundHitAuthority: false,
    soundAssetAuthority: false,
    soundMixAuthority: false,
    narrationDuckingAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    assetManifestAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

export interface ReconcileLivingFrameSemanticSoundTimingInput {
  readonly reconciliationId: string
  readonly choreographyBinding: LivingFrameChoreographyBinding
  readonly canonicalTimingBinding: CanonicalLivingFrameTimingBinding
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly components: CanonicalPlanComponentsInput
}

export class LivingFrameSemanticSoundTimingReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameSemanticSoundTimingReconciliationIssue[]

  constructor(
    issues:
      readonly LivingFrameSemanticSoundTimingReconciliationIssue[],
  ) {
    super(
      'Living Frame semantic sound timing reconciliation failed.',
    )
    this.name =
      'LivingFrameSemanticSoundTimingReconciliationError'
    this.issues = issues
  }
}

export function reconcileLivingFrameSemanticSoundTiming(
  input: ReconcileLivingFrameSemanticSoundTimingInput,
): LivingFrameSemanticSoundTimingReconciliation {
  assertInput(input)
  if (
    !verifyLivingFrameChoreographyBindingDigest(
      input.choreographyBinding,
    )
  ) {
    throw invalid(
      'choreography_binding_invalid',
      '$.choreographyBinding',
    )
  }
  if (
    !verifyCanonicalLivingFrameExecutionRequirements({
      requirements: input.requirements,
      publication: input.publication,
      components: input.components,
    })
  ) {
    throw invalid(
      'canonical_requirements_invalid',
      '$.requirements',
    )
  }
  if (
    !verifyCanonicalLivingFrameTimingBinding({
      timingBinding: input.canonicalTimingBinding,
      publication: input.publication,
      requirements: input.requirements,
      components: input.components,
    })
  ) {
    throw invalid(
      'canonical_timing_binding_invalid',
      '$.canonicalTimingBinding',
    )
  }
  assertSourceLineage(input)
  const scene = resolveScene(input)
  const units = compileUnits({
    choreographyBinding: input.choreographyBinding,
    timingScene: scene.timingScene,
  })
  const phaseCompatibleCandidateCount =
    countStatus(
      units,
      'phase_compatible_semantic_trigger_candidate',
    )
  const semanticTriggerPhaseDivergenceCount =
    countStatus(
      units,
      'blocked_semantic_trigger_phase_divergence',
    )
  const draft:
    LivingFrameSemanticSoundTimingReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_CLASS,
      reconciliationState:
        LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_STATE,
      reconciliationId: input.reconciliationId,
      canonicalScope: {
        workspaceId:
          input.publication.binding.identity.workspaceId,
        projectId:
          input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
        sceneId: input.choreographyBinding.sceneId,
      },
      sourceBindings: {
        choreographyBindingDigestSha256:
          input.choreographyBinding.bindingDigestSha256,
        deterministicMotionBundleDigestSha256:
          input.choreographyBinding.sourceBindings
            .deterministicMotionBundleDigestSha256,
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        executionRequirementsDigestSha256:
          input.requirements.requirementsDigestSha256,
        canonicalTimingBindingDigestSha256:
          input.canonicalTimingBinding
            .timingBindingDigestSha256,
        currentMasterTimingDigestSha256:
          input.canonicalTimingBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        currentSoundSyncDigestSha256:
          input.canonicalTimingBinding.sourceBindings
            .currentSoundSyncDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.canonicalTimingBinding.sourceBindings
            .confirmedOutputFrameDigestSha256,
      },
      units,
      metrics: {
        soundRequestCount:
          input.choreographyBinding
            .soundRequestProjections.length,
        canonicalCueCount:
          scene.timingScene.soundCueBindings.length,
        phaseCompatibleCandidateCount,
        semanticTriggerPhaseDivergenceCount,
        canonicalCueWithTriggerIdentityCount: 0,
        canonicalCueWithExactHitFrameCount: 0,
        canonicalCueWithExactMixCount: 0,
      },
      allCurrentCanonicalCuesPhaseCompatible:
        phaseCompatibleCandidateCount === units.length,
      semanticTriggerDivergenceObserved:
        semanticTriggerPhaseDivergenceCount > 0,
      currentCanonicalTimingUsesSemanticTriggerEvidence:
        false,
      professionalSemanticSoundTimingReady: false,
      canonicalTimingOrSoundSyncCanProceedByThisReconciliation:
        false,
      canonicalTimingOrSoundSyncMutated: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      soundAssetSelectedOrGenerated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      actualCostCreated: false,
      customerCharged: false,
      openGateCodes:
        LIVING_FRAME_SEMANTIC_SOUND_TIMING_RECONCILIATION_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      containsRawChatTranscriptAudioMediaBytesPathsUrlsCredentialsPromptsCommandsOrEnvironment:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    reconciliationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameSemanticSoundTimingReconciliation(
  value: unknown,
  input: ReconcileLivingFrameSemanticSoundTimingInput,
): boolean {
  try {
    if (
      !isRecord(value)
      || typeof value.reconciliationDigestSha256 !==
        'string'
      || !SHA256.test(value.reconciliationDigestSha256)
      || value.reconciliationDigestSha256 !==
        sha256AuthorityValue(withoutDigest(value))
    ) return false
    const expected =
      reconcileLivingFrameSemanticSoundTiming(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function resolveScene(
  input: ReconcileLivingFrameSemanticSoundTimingInput,
): {
  readonly timingScene:
    CanonicalLivingFrameSceneTimingBinding
} {
  const selectedScenes =
    input.publication.binding.selectedComponent.scenePlans
      .filter((scene) =>
        scene.sceneId === input.choreographyBinding.sceneId)
  const timingScenes =
    input.canonicalTimingBinding.scenes.filter((scene) =>
      scene.sceneId === input.choreographyBinding.sceneId)
  const requirementScenes =
    input.requirements.scenes.filter((scene) =>
      scene.sceneId === input.choreographyBinding.sceneId)
  if (
    selectedScenes.length !== 1
    || timingScenes.length !== 1
    || requirementScenes.length !== 1
  ) {
    throw invalid(
      'scene_mismatch',
      '$.choreographyBinding.sceneId',
    )
  }
  return { timingScene: timingScenes[0]! }
}

function compileUnits(input: {
  readonly choreographyBinding:
    LivingFrameChoreographyBinding
  readonly timingScene:
    CanonicalLivingFrameSceneTimingBinding
}): readonly LivingFrameSemanticSoundTimingReconciliationUnit[] {
  const projections =
    input.choreographyBinding.soundRequestProjections
  const cues = input.timingScene.soundCueBindings
  if (projections.length === 0 || cues.length === 0) {
    throw invalid(
      'missing_sound_request_or_cue',
      '$.soundBindings',
    )
  }
  const projectionById = uniqueMap(
    projections,
    (projection) => projection.soundRequestId,
    'duplicate_sound_request_or_cue',
    '$.choreographyBinding.soundRequestProjections',
  )
  const cueById = uniqueMap(
    cues,
    (cue) => cue.soundRequestId,
    'duplicate_sound_request_or_cue',
    '$.canonicalTimingBinding.soundCueBindings',
  )
  if (
    projectionById.size !== cueById.size
    || projections.length !== cues.length
  ) {
    throw invalid(
      'missing_sound_request_or_cue',
      '$.soundBindings',
    )
  }
  return projections.map((projection, order) => {
    const cue = cueById.get(projection.soundRequestId)
    if (!cue) {
      throw invalid(
        'missing_sound_request_or_cue',
        `$.soundBindings.${projection.soundRequestId}`,
      )
    }
    assertCueMetadata(projection, cue, order)
    return compileUnit({
      projection,
      cue,
      timingScene: input.timingScene,
      order,
    })
  })
}

function compileUnit(input: {
  readonly projection:
    LivingFrameSoundChoreographyProjection
  readonly cue: CanonicalLivingFrameSoundCueTimingBinding
  readonly timingScene:
    CanonicalLivingFrameSceneTimingBinding
  readonly order: number
}): LivingFrameSemanticSoundTimingReconciliationUnit {
  const requiredSemanticPhase =
    ATTENTION_EVENT_TO_REQUIRED_PHASE[
      input.projection.semanticTriggerEventType
    ]
  const matchingRequiredPhases =
    input.timingScene.semanticPhaseBindings.filter(
      (binding) =>
        binding.phase === requiredSemanticPhase,
    )
  if (matchingRequiredPhases.length !== 1) {
    throw invalid(
      'semantic_trigger_phase_unresolvable',
      `$.canonicalTimingBinding.scenes.${
        input.timingScene.sceneId
      }.semanticPhaseBindings`,
    )
  }
  const requiredPhase = matchingRequiredPhases[0]!
  const containingPhases =
    input.timingScene.semanticPhaseBindings.filter(
      (phase) =>
        containsRange(
          phase.frameRange,
          input.cue.frameRange,
        ),
    )
  if (containingPhases.length > 1) {
    throw invalid(
      'semantic_trigger_phase_unresolvable',
      `$.canonicalTimingBinding.scenes.${
        input.timingScene.sceneId
      }.soundCueBindings.${input.order}`,
    )
  }
  const containingPhase = containingPhases[0] ?? null
  const phaseCompatible =
    containsRange(
      requiredPhase.frameRange,
      input.cue.frameRange,
    )
  const reconciliationStatus:
    LivingFrameSemanticSoundTimingReconciliationStatus =
    phaseCompatible
      ? 'phase_compatible_semantic_trigger_candidate'
      : 'blocked_semantic_trigger_phase_divergence'
  const unitDraft = {
    order: input.order,
    reconciliationUnitId:
      `living-frame.semantic-sound-timing.${
        sha256AuthorityValue({
          soundRequestId: input.projection.soundRequestId,
          soundSyncCueId: input.cue.soundSyncCueId,
          attentionEventId:
            input.projection.semanticTriggerAttentionEventId,
          canonicalCueFrameRange: input.cue.frameRange,
        }).slice(0, 28)
      }`,
    sceneId: input.timingScene.sceneId,
    soundRequestId: input.projection.soundRequestId,
    soundSyncCueId: input.cue.soundSyncCueId,
    linkedComponentId: input.projection.linkedComponentId,
    purpose: input.projection.purpose,
    priority: input.projection.priority,
    narrationProtection:
      input.projection.narrationProtection,
    duckingExpectation:
      input.projection.duckingExpectation,
    semanticTrigger: {
      attentionEventId:
        input.projection.semanticTriggerAttentionEventId,
      eventType:
        input.projection.semanticTriggerEventType,
      motionTrackIds:
        [...input.projection.semanticTriggerMotionTrackIds],
      requiredSemanticPhase,
      requiredSemanticPhaseTimingRequestId:
        requiredPhase.timingRequestId,
      requiredSemanticPhaseFrameRange:
        requiredPhase.frameRange,
      exactAttentionEventFrameRangePresentInCanonicalTimingV1:
        false as const,
      exactMotionHitFramePresentInCanonicalTimingV1:
        false as const,
    },
    canonicalCueObservation: {
      frameRange: input.cue.frameRange,
      containingSemanticPhase:
        containingPhase?.phase ?? null,
      containingSemanticPhaseTimingRequestId:
        containingPhase?.timingRequestId ?? null,
      exactCueRangeProvided: true as const,
      exactHitFrameProvided: false as const,
      semanticTriggerAttentionEventIdCarried:
        false as const,
      semanticTriggerMotionTrackIdsCarried:
        false as const,
      exactMixProvided: false as const,
      speechPriorityPreserved: true as const,
    },
    reconciliationStatus,
    currentCanonicalCueFallsWithinRequiredSemanticPhase:
      phaseCompatible,
    currentCanonicalCueMayBeUsedAsProfessionalSemanticSoundProof:
      false as const,
    canonicalCueMutated: false as const,
    choreographyBindingMutated: false as const,
    downstreamProfessionalSoundAdmissionBlocked:
      true as const,
  }
  return deepFreeze({
    ...unitDraft,
    reconciliationUnitDigestSha256:
      sha256AuthorityValue(unitDraft),
  })
}

function assertCueMetadata(
  projection: LivingFrameSoundChoreographyProjection,
  cue: CanonicalLivingFrameSoundCueTimingBinding,
  order: number,
): void {
  if (
    projection.order !== order
    || cue.order !== order
    || cue.linkedComponentId !==
      projection.linkedComponentId
    || cue.purpose !== projection.purpose
    || cue.priority !== projection.priority
    || cue.narrationProtection !==
      projection.narrationProtection
    || cue.duckingExpectation !==
      projection.duckingExpectation
    || cue.exactCuePlacementProvided !== true
    || cue.exactMixProvided !== false
    || cue.speechPriorityPreserved !== true
  ) {
    throw invalid(
      'sound_request_cue_metadata_mismatch',
      `$.soundBindings.${order}`,
    )
  }
}

function assertSourceLineage(
  input: ReconcileLivingFrameSemanticSoundTimingInput,
): void {
  const choreography = input.choreographyBinding
  const selected = input.publication.binding.selectedComponent
  const timing = input.canonicalTimingBinding
  if (
    choreography.sourceBindings
      .livingFrameComponentDigestSha256 !==
        selected.contractDigestSha256
    || choreography.sourceBindings
      .masterTimingPlanDigestSha256 !==
        timing.sourceBindings.currentMasterTimingDigestSha256
    || choreography.sourceBindings
      .outputFrameDigestSha256 !==
        selected.inputBindings.outputFrame
          .expectedDigestSha256
    || timing.sourceBindings
      .selectedSceneBindingDigestSha256 !==
        input.publication.binding.bindingDigestSha256
    || timing.sourceBindings
      .executionRequirementsDigestSha256 !==
        input.requirements.requirementsDigestSha256
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.sourceBindings',
    )
  }
}

function assertInput(
  input: ReconcileLivingFrameSemanticSoundTimingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'reconciliationId',
      'choreographyBinding',
      'canonicalTimingBinding',
      'publication',
      'requirements',
      'components',
    ])
    || !SAFE_ID.test(String(input.reconciliationId))
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertDraft(
  draft:
    LivingFrameSemanticSoundTimingReconciliationDraft,
): void {
  const {
    readOnlySemanticSoundTimingReconciliationAuthority,
    ...delegated
  } = draft.authorityBoundary
  if (
    readOnlySemanticSoundTimingReconciliationAuthority !==
      true
    || Object.values(delegated).some((value) =>
      value !== false)
    || draft.units.length === 0
    || draft.metrics.soundRequestCount !==
      draft.units.length
    || draft.metrics.canonicalCueCount !==
      draft.units.length
    || draft.metrics.phaseCompatibleCandidateCount
      + draft.metrics
        .semanticTriggerPhaseDivergenceCount !==
        draft.units.length
    || draft.metrics.canonicalCueWithTriggerIdentityCount
      !== 0
    || draft.metrics.canonicalCueWithExactHitFrameCount
      !== 0
    || draft.metrics.canonicalCueWithExactMixCount !== 0
    || draft.currentCanonicalTimingUsesSemanticTriggerEvidence
      !== false
    || draft.professionalSemanticSoundTimingReady !== false
    || draft
      .canonicalTimingOrSoundSyncCanProceedByThisReconciliation
      !== false
    || draft.canonicalTimingOrSoundSyncMutated !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.runtimeExecuted !== false
    || draft.soundAssetSelectedOrGenerated !== false
    || draft.productionReady !== false
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function containsRange(
  outer: {
    readonly startFrame: number
    readonly endFrameExclusive: number
  },
  inner: {
    readonly startFrame: number
    readonly endFrameExclusive: number
  },
): boolean {
  return inner.startFrame >= outer.startFrame
    && inner.endFrameExclusive <= outer.endFrameExclusive
}

function uniqueMap<T>(
  values: readonly T[],
  keyOf: (value: T) => string,
  duplicateCode:
    LivingFrameSemanticSoundTimingReconciliationIssueCode,
  path: string,
): Map<string, T> {
  const map = new Map<string, T>()
  for (const value of values) {
    const key = keyOf(value)
    if (map.has(key)) {
      throw invalid(duplicateCode, path)
    }
    map.set(key, value)
  }
  return map
}

function countStatus(
  units:
    readonly LivingFrameSemanticSoundTimingReconciliationUnit[],
  status:
    LivingFrameSemanticSoundTimingReconciliationStatus,
): number {
  return units.filter((unit) =>
    unit.reconciliationStatus === status).length
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const {
    reconciliationDigestSha256: omitted,
    ...rest
  } = value
  void omitted
  return rest
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) =>
      key === expected[index])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    !value
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const entry of Object.values(value)) {
    deepFreeze(entry)
  }
  return value
}

function invalid(
  code:
    LivingFrameSemanticSoundTimingReconciliationIssueCode,
  path: string,
): LivingFrameSemanticSoundTimingReconciliationError {
  return new LivingFrameSemanticSoundTimingReconciliationError([{
    code,
    path,
  }])
}
