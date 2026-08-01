import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_CHAT_PLAN_PRESENTATION_CHANGE_KINDS,
  LIVING_FRAME_CHAT_PLAN_PRESENTATION_CLASS,
  LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION,
  type LivingFrameChatPlanPresentation,
  type LivingFrameChatPlanPresentationChangeKind,
  type LivingFrameChatPlanPresentationDecision,
  type LivingFrameChatPlanPresentationDraft,
  type LivingFrameChatPlanPresentationOpaqueRef,
  type LivingFrameChatPlanPresentationReloadRef,
  type LivingFrameChatPlanPresentationReloadState,
} from '../../src/types/living-frame-chat-plan-presentation'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameActiveProfessionalSkillPolicyProjection,
} from '../../src/types/living-frame-active-professional-skill-policy-projection'
import type {
  ProfessionalSkillPlan,
  ProfessionalSkillSelection,
} from '../../src/types/professional-skills'
import {
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  LIVING_FRAME_PROFESSIONAL_SKILL_ID,
  type LivingFrameSelectionPolicyDecision,
} from '../../src/lib/living-frame/living-frame-selection-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameActiveProfessionalSkillPolicyProjection,
} from './living-frame-active-professional-skill-policy-projection'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface LivingFrameChatConfirmedFrameRef {
  readonly refId: string
  readonly version: number
  readonly digestSha256: string
  readonly livingFrameExpectationRefId: string
  readonly livingFrameExpectationDigestSha256: string
  readonly width: number
  readonly height: number
  readonly fps: number
  readonly aspectRatioNumerator: number
  readonly aspectRatioDenominator: number
  readonly confirmed: true
}

export interface LivingFrameChatMasterTimingRef {
  readonly refId: string
  readonly version: number
  readonly digestSha256: string
}

export interface LivingFrameChatPlanVersionRef {
  readonly refId: string
  readonly version: number
  readonly status: 'draft' | 'awaiting_approval' | 'approved'
  readonly digestSha256: string
}

export type LivingFrameChatApprovedSnapshotRef =
  | {
      readonly state: 'pending'
      readonly snapshotId: null
      readonly snapshotVersion: null
      readonly snapshotDigestSha256: null
      readonly approvedPlanVersionId: null
      readonly approvedPlanVersion: null
      readonly approvedPlanVersionDigestSha256: null
    }
  | {
      readonly state: 'approved'
      readonly snapshotId: string
      readonly snapshotVersion: number
      readonly snapshotDigestSha256: string
      readonly approvedPlanVersionId: string
      readonly approvedPlanVersion: number
      readonly approvedPlanVersionDigestSha256: string
    }

export interface CompileLivingFrameChatPlanPresentationInput {
  readonly professionalSkillPlan: ProfessionalSkillPlan
  readonly livingFrameComponent:
    LivingFrameProfessionalSkillComponent | null
  readonly selectionDecision: LivingFrameSelectionPolicyDecision
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly activePolicyProjection:
    LivingFrameActiveProfessionalSkillPolicyProjection
  readonly confirmedFrame: LivingFrameChatConfirmedFrameRef
  readonly masterTiming: LivingFrameChatMasterTimingRef
  readonly planVersion: LivingFrameChatPlanVersionRef
  readonly approvedSnapshot: LivingFrameChatApprovedSnapshotRef
  readonly previousPresentationReloadRef:
    LivingFrameChatPlanPresentationReloadRef | null
}

const AUTHORITY_BOUNDARY = Object.freeze({
  supplementalPresentationOnly: true as const,
  canonicalPlanPresentationAuthority: false as const,
  chatCardRegistryAuthority: false as const,
  browserRehydrationAuthority: false as const,
  approvalAuthority: false as const,
  toolAuthority: false as const,
  providerAuthority: false as const,
  runtimeAuthority: false as const,
  dispatchAuthority: false as const,
  costAuthority: false as const,
  qaApprovalAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
})

export async function compileLivingFrameChatPlanPresentation(
  input: CompileLivingFrameChatPlanPresentationInput,
): Promise<LivingFrameChatPlanPresentation> {
  await assertInput(input)
  const selection = livingFrameSelection(input.professionalSkillPlan)
  const component = input.livingFrameComponent
  const sourceBindings = sourceBindingValues(input)
  const sourceFingerprintDigestSha256 =
    sha256AuthorityValue(sourceBindings)
  const reload = resolveReloadAndRevision(
    input.previousPresentationReloadRef,
    sourceBindings,
    sourceFingerprintDigestSha256,
  )
  const decision = presentationDecision(
    input.selectionDecision,
    selection,
    component,
  )
  const actualBlocker = decision === 'blocked'
  const scenes = component?.scenePlans ?? []
  const modes = [...new Set(scenes.map((scene) => scene.mode))]
  const detailed = detailedPresentation(scenes, modes)
  const refs = developerRefs(input, sourceBindings)
  const presentationContent = {
    cardDescriptor: {
      descriptorId: 'living_frame_plan' as const,
      phase: 'plan' as const,
      priority: actualBlocker
        ? 'safety_detail' as const
        : 'user_summary' as const,
      status: actualBlocker ? 'blocking' as const : 'ready' as const,
      defaultExpanded: true as const,
      advancedDetailsDefaultExpanded: false as const,
      requiredBeforeApproval: false as const,
      separateApprovalCtaProvided: false as const,
    },
    guided: {
      decision,
      selectedMode: component?.decisionSummary.selectedMode ?? null,
      sourceDecision:
        component?.decisionSummary.decision ?? 'not_selected' as const,
      explicitRestraintApplied:
        input.selectionDecision.explicitRestraintApplied,
      summary: guidedSummary(decision),
      planningOnlyNotice:
        'Nothing starts until the complete edit plan and credit estimate are approved.' as const,
    },
    detailed,
    developer: {
      opaqueRefsOnly: true as const,
      refs,
      sourceFingerprintDigestSha256,
    },
    reloadAndRevision: reload.presentation,
    sharedUiMutated: false as const,
    canonicalConsumptionPending: true as const,
    containsRawChatInternalToolOrProviderNamesMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
      false as const,
    authorityBoundary: AUTHORITY_BOUNDARY,
    approvalGranted: false as const,
    toolSelected: false as const,
    providerSelected: false as const,
    dispatchGranted: false as const,
    runtimeExecuted: false as const,
    costAdmitted: false as const,
    canonicalQaApproved: false as const,
    publicDeliveryReady: false as const,
    productionReady: false as const,
  }
  const completePresentationDigestInputSha256 =
    sha256AuthorityValue({
      ...presentationContent,
      sourceBindings,
      previousPresentationReloadRef:
        input.previousPresentationReloadRef,
    })
  const reloadRef = buildReloadRef(
    sourceBindings,
    sourceFingerprintDigestSha256,
    completePresentationDigestInputSha256,
  )
  const draft: LivingFrameChatPlanPresentationDraft = {
    contractVersion: LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION,
    presentationClass: LIVING_FRAME_CHAT_PLAN_PRESENTATION_CLASS,
    presentationState:
      'source_projection_complete_canonical_presentation_consumption_pending',
    ...presentationContent,
    reloadRef,
    completePresentationDigestInputSha256,
  }
  const presentation = deepFreeze({
    ...draft,
    presentationDigestSha256: sha256AuthorityValue(draft),
  })
  assertSafePresentation(presentation)
  return presentation
}

export async function verifyLivingFrameChatPlanPresentation(
  value: unknown,
  input: CompileLivingFrameChatPlanPresentationInput,
): Promise<boolean> {
  if (!isRecord(value)) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        await compileLivingFrameChatPlanPresentation(input),
      )
  } catch {
    return false
  }
}

async function assertInput(
  input: CompileLivingFrameChatPlanPresentationInput,
): Promise<void> {
  if (
    !isRecord(input)
    || !verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)
    || !verifyLivingFrameActiveProfessionalSkillPolicyProjection(
      input.activePolicyProjection,
    )
    || input.activePolicyProjection.canonicalConsumptionPending !== true
    || input.activePolicyProjection.sharedRegistryMutatedByProjection
  ) throw new Error('Invalid Living Frame chat presentation policy input.')
  assertSelectionDecision(input.selectionDecision)
  assertProfessionalSkillBinding(
    input.professionalSkillPlan,
    input.livingFrameComponent,
    input.selectionDecision,
  )
  if (input.livingFrameComponent) {
    const validation =
      await validateLivingFrameProfessionalSkillComponent(
        input.livingFrameComponent,
      )
    if (!validation.ok) {
      throw new Error('Invalid Living Frame chat presentation component.')
    }
  }
  assertConfirmedFrame(input.confirmedFrame, input.livingFrameComponent)
  assertMasterTiming(input.masterTiming, input.livingFrameComponent)
  assertPlanAndSnapshot(input.planVersion, input.approvedSnapshot)
  if (input.previousPresentationReloadRef) {
    assertReloadRef(input.previousPresentationReloadRef)
  }
}

function assertSelectionDecision(
  decision: LivingFrameSelectionPolicyDecision,
): void {
  if (
    !isRecord(decision)
    || typeof decision.selected !== 'boolean'
    || ![
      'explicit_living_frame_request',
      'animation_aware_still_request',
      'spatial_in_frame_explanation_request',
      'explicit_motion_restraint',
      'no_strong_living_frame_signal',
    ].includes(decision.reasonCode)
    || ![null, 'user_prompt', 'edit_brief', 'edit_cue']
      .includes(decision.selectionSource)
    || typeof decision.explicitRestraintApplied !== 'boolean'
    || decision.planningOnly !== true
    || decision.componentPayloadCreated !== false
    || decision.runtimeAuthorityGranted !== false
    || (decision.selected && decision.selectionSource == null)
    || (!decision.selected && decision.selectionSource != null)
    || (decision.explicitRestraintApplied
      !== (decision.reasonCode === 'explicit_motion_restraint'))
  ) throw new Error('Invalid Living Frame selection decision.')
}

function assertProfessionalSkillBinding(
  plan: ProfessionalSkillPlan,
  component: LivingFrameProfessionalSkillComponent | null,
  decision: LivingFrameSelectionPolicyDecision,
): void {
  if (!isRecord(plan) || !Array.isArray(plan.selectedSkills)) {
    throw new Error('Invalid Living Frame professional skill plan.')
  }
  const selections = plan.selectedSkills.filter((selection) =>
    selection.skillId === LIVING_FRAME_PROFESSIONAL_SKILL_ID)
  if (decision.selected) {
    if (
      selections.length !== 1
      || component == null
      || plan.livingFrame == null
      || stableAuthorityStringify(plan.livingFrame)
        !== stableAuthorityStringify(component)
    ) throw new Error('Selected Living Frame presentation is incomplete.')
    assertSelectedParent(selections[0]!)
  } else if (
    selections.length !== 0
    || component != null
    || plan.livingFrame != null
  ) throw new Error('Non-use Living Frame presentation carries selected work.')
}

function assertSelectedParent(selection: ProfessionalSkillSelection): void {
  if (
    selection.executionModes.length !== 1
    || selection.executionModes[0] !== 'plan_only'
    || selection.hiddenAdapterToolNames.length !== 0
    || selection.backendIntents.length !== 0
  ) throw new Error('Living Frame presentation parent is not plan-only.')
}

function assertConfirmedFrame(
  frame: LivingFrameChatConfirmedFrameRef,
  component: LivingFrameProfessionalSkillComponent | null,
): void {
  if (
    !isRecord(frame)
    || !SAFE_ID.test(frame.refId)
    || !positiveInteger(frame.version)
    || !SHA256.test(frame.digestSha256)
    || !SAFE_ID.test(frame.livingFrameExpectationRefId)
    || !SHA256.test(frame.livingFrameExpectationDigestSha256)
    || !positiveInteger(frame.width)
    || !positiveInteger(frame.height)
    || !positiveInteger(frame.fps)
    || !positiveInteger(frame.aspectRatioNumerator)
    || !positiveInteger(frame.aspectRatioDenominator)
    || frame.width * frame.aspectRatioDenominator
      !== frame.height * frame.aspectRatioNumerator
    || frame.confirmed !== true
    || frame.digestSha256 !== sha256AuthorityValue({
      refId: frame.refId,
      version: frame.version,
      width: frame.width,
      height: frame.height,
      fps: frame.fps,
      aspectRatioNumerator: frame.aspectRatioNumerator,
      aspectRatioDenominator: frame.aspectRatioDenominator,
      confirmed: frame.confirmed,
    })
  ) throw new Error('Invalid Living Frame confirmed frame reference.')
  if (component) {
    const expected = component.inputBindings.outputFrame
    if (
      frame.livingFrameExpectationRefId !== expected.expectationRefId
      || frame.livingFrameExpectationDigestSha256
        !== expected.expectedDigestSha256
      || frame.width !== expected.expectedWidth
      || frame.height !== expected.expectedHeight
      || frame.aspectRatioNumerator
        !== expected.expectedAspectRatioNumerator
      || frame.aspectRatioDenominator
        !== expected.expectedAspectRatioDenominator
    ) throw new Error('Living Frame confirmed frame binding is stale.')
  }
}

function assertMasterTiming(
  timing: LivingFrameChatMasterTimingRef,
  component: LivingFrameProfessionalSkillComponent | null,
): void {
  if (
    !isRecord(timing)
    || !SAFE_ID.test(timing.refId)
    || !positiveInteger(timing.version)
    || !SHA256.test(timing.digestSha256)
  ) throw new Error('Invalid Living Frame MasterTiming reference.')
  if (component) {
    const expected = component.inputBindings.masterTiming
    if (
      timing.refId !== expected.expectationRefId
      || timing.digestSha256 !== expected.expectedDigestSha256
    ) throw new Error('Living Frame MasterTiming binding is stale.')
  }
}

function assertPlanAndSnapshot(
  plan: LivingFrameChatPlanVersionRef,
  snapshot: LivingFrameChatApprovedSnapshotRef,
): void {
  if (
    !isRecord(plan)
    || !SAFE_ID.test(plan.refId)
    || !positiveInteger(plan.version)
    || !['draft', 'awaiting_approval', 'approved'].includes(plan.status)
    || !SHA256.test(plan.digestSha256)
    || !isRecord(snapshot)
  ) throw new Error('Invalid Living Frame plan-version binding.')
  if (snapshot.state === 'pending') {
    if (
      plan.status === 'approved'
      || snapshot.snapshotId !== null
      || snapshot.snapshotVersion !== null
      || snapshot.snapshotDigestSha256 !== null
      || snapshot.approvedPlanVersionId !== null
      || snapshot.approvedPlanVersion !== null
      || snapshot.approvedPlanVersionDigestSha256 !== null
    ) throw new Error('Invalid pending Living Frame snapshot binding.')
    return
  }
  if (
    snapshot.state !== 'approved'
    || plan.status !== 'approved'
    || !SAFE_ID.test(snapshot.snapshotId)
    || !positiveInteger(snapshot.snapshotVersion)
    || !SHA256.test(snapshot.snapshotDigestSha256)
    || snapshot.approvedPlanVersionId !== plan.refId
    || snapshot.approvedPlanVersion !== plan.version
    || snapshot.approvedPlanVersionDigestSha256 !== plan.digestSha256
  ) throw new Error('Invalid approved Living Frame snapshot binding.')
}

function sourceBindingValues(
  input: CompileLivingFrameChatPlanPresentationInput,
) {
  const pendingSnapshotDigest = sha256AuthorityValue({ state: 'pending' })
  return {
    professionalSkillPlanDigestSha256:
      sha256AuthorityValue(input.professionalSkillPlan),
    livingFrameComponentDigestSha256:
      input.livingFrameComponent?.contractDigestSha256
        ?? sha256AuthorityValue(null),
    selectionDecisionDigestSha256:
      sha256AuthorityValue(input.selectionDecision),
    confirmedFrameDigestSha256: input.confirmedFrame.digestSha256,
    masterTimingDigestSha256: input.masterTiming.digestSha256,
    ownerScopeAmendmentDigestSha256:
      input.ownerScopeAmendment.amendmentDigestSha256,
    professionalSkillPolicyDigestSha256:
      input.activePolicyProjection.projectionDigestSha256,
    planVersionId: input.planVersion.refId,
    planVersion: input.planVersion.version,
    planVersionStatus: input.planVersion.status,
    planVersionDigestSha256: input.planVersion.digestSha256,
    approvedSnapshotState: input.approvedSnapshot.state,
    approvedSnapshotDigestSha256:
      input.approvedSnapshot.snapshotDigestSha256
        ?? pendingSnapshotDigest,
  } as const
}

function developerRefs(
  input: CompileLivingFrameChatPlanPresentationInput,
  source: ReturnType<typeof sourceBindingValues>,
): readonly LivingFrameChatPlanPresentationOpaqueRef[] {
  return [
    opaqueRef(
      'professional_skill_plan',
      `${input.planVersion.refId}.professional-skills`,
      'professional-skill-plan-current',
      source.professionalSkillPlanDigestSha256,
    ),
    opaqueRef(
      'living_frame_component',
      input.livingFrameComponent
        ? 'motion.living_frame_storytelling.component'
        : 'motion.living_frame_storytelling.component-absent',
      input.livingFrameComponent?.contractVersion ?? 'not-present',
      source.livingFrameComponentDigestSha256,
    ),
    opaqueRef(
      'selection_policy_decision',
      'motion.living_frame_storytelling.selection-decision',
      'living-frame-selection-policy-current',
      source.selectionDecisionDigestSha256,
    ),
    opaqueRef(
      'owner_scope_amendment',
      'motion.living_frame_storytelling.owner-scope',
      input.ownerScopeAmendment.contractVersion,
      source.ownerScopeAmendmentDigestSha256,
    ),
    opaqueRef(
      'active_professional_skill_policy',
      'motion.living_frame_storytelling.active-policy',
      input.activePolicyProjection.contractVersion,
      source.professionalSkillPolicyDigestSha256,
    ),
    opaqueRef(
      'confirmed_output_frame',
      input.confirmedFrame.refId,
      String(input.confirmedFrame.version),
      source.confirmedFrameDigestSha256,
    ),
    opaqueRef(
      'master_timing',
      input.masterTiming.refId,
      String(input.masterTiming.version),
      source.masterTimingDigestSha256,
    ),
    opaqueRef(
      'edit_plan_version',
      input.planVersion.refId,
      String(input.planVersion.version),
      source.planVersionDigestSha256,
    ),
    opaqueRef(
      'approved_snapshot_or_pending',
      input.approvedSnapshot.snapshotId ?? 'approved-snapshot-pending',
      input.approvedSnapshot.snapshotVersion == null
        ? 'pending'
        : String(input.approvedSnapshot.snapshotVersion),
      source.approvedSnapshotDigestSha256,
    ),
  ]
}

function opaqueRef(
  role: LivingFrameChatPlanPresentationOpaqueRef['role'],
  refId: string,
  version: string,
  digestSha256: string,
): LivingFrameChatPlanPresentationOpaqueRef {
  return { role, refId, version, digestSha256 }
}

function presentationDecision(
  selectionDecision: LivingFrameSelectionPolicyDecision,
  selection: ProfessionalSkillSelection | null,
  component: LivingFrameProfessionalSkillComponent | null,
): LivingFrameChatPlanPresentationDecision {
  if (!selectionDecision.selected) {
    return selectionDecision.explicitRestraintApplied
      ? 'restraint'
      : 'non_use'
  }
  if (
    selection?.readiness === 'blocked'
    || component?.status === 'blocked'
    || component?.decisionSummary.decision === 'blocked'
  ) return 'blocked'
  if (
    component?.status === 'deferred'
    || component?.decisionSummary.decision === 'deferred'
  ) return 'deferred'
  return 'selected'
}

function guidedSummary(
  decision: LivingFrameChatPlanPresentationDecision,
): string {
  if (decision === 'restraint') {
    return 'Living Frame is not planned because this edit requests a restrained, static, or minimal visual treatment.'
  }
  if (decision === 'non_use') {
    return 'Living Frame is not needed for this edit; the plan keeps the visual treatment simpler.'
  }
  if (decision === 'blocked') {
    return 'Living Frame is selected, but a required planning or safety gate must be resolved before approval.'
  }
  if (decision === 'deferred') {
    return 'Living Frame is selected and source-bound, but it remains deferred until timing, evidence, fallback, and review gates are complete.'
  }
  return 'Living Frame is selected to build the explanation inside the scene with deliberate motion, depth, attention, and restraint.'
}

function detailedPresentation(
  scenes: readonly LivingFrameScenePlan[],
  modes: readonly LivingFrameScenePlan['mode'][],
): LivingFrameChatPlanPresentationDraft['detailed'] {
  const attentionEventCount = sum(scenes, (scene) =>
    scene.attentionSequence.length)
  const semanticScaleRequestCount = sum(scenes, (scene) =>
    scene.semanticScaleRequests.length)
  const depthAwareComponentCount = sum(scenes, (scene) =>
    scene.components.filter((component) => [
      'behind_subject',
      'in_front_of_subject',
      'foreground',
    ].includes(component.depthBand)).length)
  const captionProtectedSceneCount = scenes.filter((scene) =>
    scene.qaExpectationCodes.includes('caption_safe_region_expected')).length
  const fallbackStepCount = sum(scenes, (scene) =>
    scene.fallbackLadder.length)
  const qaExpectationCount = new Set([
    ...scenes.flatMap((scene) => scene.qaExpectationCodes),
    ...scenes.flatMap((scene) =>
      scene.components.flatMap((component) =>
        component.qaExpectationCodes)),
  ]).size
  const closedGateCount = new Set(
    scenes.flatMap((scene) => scene.closedGateCodes),
  ).size
  return {
    sceneCount: scenes.length,
    modes: structuredClone(modes),
    attentionEventCount,
    semanticScaleRequestCount,
    depthAwareComponentCount,
    captionProtectedSceneCount,
    fallbackStepCount,
    qaExpectationCount,
    closedGateCount,
    activeScopeCount: 12,
    pausedScopeCount: 7,
    modeAndSceneSummary: scenes.length === 0
      ? 'No Living Frame scene is executable yet; the current direction is planning-only or deliberately unused.'
      : `${scenes.length} Living Frame scene${scenes.length === 1 ? '' : 's'} across ${modes.length} approved presentation mode${modes.length === 1 ? '' : 's'}.`,
    attentionScaleDepthCaptionSummary:
      `${attentionEventCount} attention event${attentionEventCount === 1 ? '' : 's'}, ${semanticScaleRequestCount} semantic-scale request${semanticScaleRequestCount === 1 ? '' : 's'}, ${depthAwareComponentCount} depth-aware component${depthAwareComponentCount === 1 ? '' : 's'}, and ${captionProtectedSceneCount} caption-protected scene${captionProtectedSceneCount === 1 ? '' : 's'}.`,
    fallbackSummary:
      `${fallbackStepCount} ordered fallback step${fallbackStepCount === 1 ? '' : 's'} remain attached; simpler safe treatments must be used before abandoning the explanation.`,
    qaAndReinspectionSummary:
      'Deterministic checks, complete-time visual inspection, separate verified audio evidence, Head QA recommendation, N+1 repair and reinspection, and canonical private review remain independent requirements.',
    pausedRouteSummary:
      'Living and illustrated character animation, living-subject rigging, and mechanical rigging remain paused.',
  }
}

function livingFrameSelection(
  plan: ProfessionalSkillPlan,
): ProfessionalSkillSelection | null {
  return plan.selectedSkills.find((selection) =>
    selection.skillId === LIVING_FRAME_PROFESSIONAL_SKILL_ID) ?? null
}

function resolveReloadAndRevision(
  previous: LivingFrameChatPlanPresentationReloadRef | null,
  current: ReturnType<typeof sourceBindingValues>,
  currentFingerprintDigest: string,
): {
  readonly presentation:
    LivingFrameChatPlanPresentationDraft['reloadAndRevision']
} {
  let state: LivingFrameChatPlanPresentationReloadState =
    'initial_projection'
  let changedBindings:
    LivingFrameChatPlanPresentationChangeKind[] = []
  if (previous) {
    changedBindings = changedSourceBindings(previous, current)
    if (
      changedBindings.length === 0
      && previous.sourceFingerprintDigestSha256
        === currentFingerprintDigest
    ) state = 'exact_canonical_reload'
    else if (isExactApprovalAttachment(previous, current)) {
      state = 'approved_snapshot_attached_to_exact_plan'
    } else {
      state = 'previous_presentation_invalidated_by_revision'
      if (
        current.planVersion <= previous.planVersion
        || current.planVersionId === previous.planVersionId
        || current.planVersionStatus === 'approved'
        || current.approvedSnapshotState !== 'pending'
      ) throw new Error(
        'Living Frame presentation revision requires a fresh pending plan version.',
      )
    }
  }
  const invalidated =
    state === 'previous_presentation_invalidated_by_revision'
  return {
    presentation: {
      state,
      changedBindings,
      previousPresentationStale: invalidated,
      currentPresentationFresh: true,
      previousPresentationMayBeReused:
        state === 'exact_canonical_reload'
        || state === 'approved_snapshot_attached_to_exact_plan',
      newPlanVersionRequired: invalidated,
      approvalResetRequired: invalidated,
      previewResetRequired: invalidated,
      newApprovedSnapshotRequired: invalidated,
      aspectTimingScopeOrPolicyChangeInvalidatesApproval: true,
      persistedCanonicalReloadRequired: true,
      browserLocalStateMayAuthorizeReload: false,
    },
  }
}

function changedSourceBindings(
  previous: LivingFrameChatPlanPresentationReloadRef,
  current: ReturnType<typeof sourceBindingValues>,
): LivingFrameChatPlanPresentationChangeKind[] {
  const changed: LivingFrameChatPlanPresentationChangeKind[] = []
  if (previous.professionalSkillPlanDigestSha256
    !== current.professionalSkillPlanDigestSha256) {
    changed.push('professional_skill_plan_changed')
  }
  if (previous.livingFrameComponentDigestSha256
    !== current.livingFrameComponentDigestSha256) {
    changed.push('living_frame_component_changed')
  }
  if (previous.selectionDecisionDigestSha256
    !== current.selectionDecisionDigestSha256) {
    changed.push('selection_decision_changed')
  }
  if (previous.confirmedFrameDigestSha256
    !== current.confirmedFrameDigestSha256) {
    changed.push('confirmed_frame_changed')
  }
  if (previous.masterTimingDigestSha256
    !== current.masterTimingDigestSha256) {
    changed.push('master_timing_changed')
  }
  if (previous.ownerScopeAmendmentDigestSha256
    !== current.ownerScopeAmendmentDigestSha256) {
    changed.push('owner_scope_changed')
  }
  if (previous.professionalSkillPolicyDigestSha256
    !== current.professionalSkillPolicyDigestSha256) {
    changed.push('professional_skill_policy_changed')
  }
  if (
    previous.planVersionId !== current.planVersionId
    || previous.planVersion !== current.planVersion
    || previous.planVersionStatus !== current.planVersionStatus
    || previous.planVersionDigestSha256
      !== current.planVersionDigestSha256
  ) changed.push('plan_version_changed')
  if (
    previous.approvedSnapshotState !== current.approvedSnapshotState
    || previous.approvedSnapshotDigestSha256
      !== current.approvedSnapshotDigestSha256
  ) changed.push('approved_snapshot_changed')
  return LIVING_FRAME_CHAT_PLAN_PRESENTATION_CHANGE_KINDS.filter(
    (kind) => changed.includes(kind),
  )
}

function isExactApprovalAttachment(
  previous: LivingFrameChatPlanPresentationReloadRef,
  current: ReturnType<typeof sourceBindingValues>,
): boolean {
  const changes = changedSourceBindings(previous, current)
  return (
    previous.planVersionId === current.planVersionId
    && previous.planVersion === current.planVersion
    && previous.planVersionDigestSha256
      === current.planVersionDigestSha256
    && previous.planVersionStatus !== 'approved'
    && current.planVersionStatus === 'approved'
    && previous.approvedSnapshotState === 'pending'
    && current.approvedSnapshotState === 'approved'
    && changes.every((change) => [
      'plan_version_changed',
      'approved_snapshot_changed',
    ].includes(change))
  )
}

function buildReloadRef(
  source: ReturnType<typeof sourceBindingValues>,
  sourceFingerprintDigestSha256: string,
  completePresentationDigestInputSha256: string,
): LivingFrameChatPlanPresentationReloadRef {
  const withoutDigest = {
    contractVersion: LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION,
    completePresentationDigestInputSha256,
    sourceFingerprintDigestSha256,
    ...source,
  }
  return {
    ...withoutDigest,
    reloadRefDigestSha256: sha256AuthorityValue(withoutDigest),
  }
}

function assertReloadRef(
  ref: LivingFrameChatPlanPresentationReloadRef,
): void {
  if (
    !isRecord(ref)
    || ref.contractVersion !== LIVING_FRAME_CHAT_PLAN_PRESENTATION_VERSION
    || !SHA256.test(ref.completePresentationDigestInputSha256)
    || !SHA256.test(ref.sourceFingerprintDigestSha256)
    || !SHA256.test(ref.professionalSkillPlanDigestSha256)
    || !SHA256.test(ref.livingFrameComponentDigestSha256)
    || !SHA256.test(ref.selectionDecisionDigestSha256)
    || !SHA256.test(ref.confirmedFrameDigestSha256)
    || !SHA256.test(ref.masterTimingDigestSha256)
    || !SHA256.test(ref.ownerScopeAmendmentDigestSha256)
    || !SHA256.test(ref.professionalSkillPolicyDigestSha256)
    || !SAFE_ID.test(ref.planVersionId)
    || !positiveInteger(ref.planVersion)
    || !['draft', 'awaiting_approval', 'approved']
      .includes(ref.planVersionStatus)
    || !SHA256.test(ref.planVersionDigestSha256)
    || !['pending', 'approved'].includes(ref.approvedSnapshotState)
    || !SHA256.test(ref.approvedSnapshotDigestSha256)
    || !SHA256.test(ref.reloadRefDigestSha256)
  ) throw new Error('Invalid Living Frame presentation reload reference.')
  const { reloadRefDigestSha256, ...withoutDigest } = ref
  if (
    reloadRefDigestSha256 !== sha256AuthorityValue(withoutDigest)
    || ref.sourceFingerprintDigestSha256
      !== sha256AuthorityValue(sourceFingerprintFromReloadRef(ref))
  ) throw new Error('Forged Living Frame presentation reload reference.')
}

function sourceFingerprintFromReloadRef(
  ref: LivingFrameChatPlanPresentationReloadRef,
) {
  return {
    professionalSkillPlanDigestSha256:
      ref.professionalSkillPlanDigestSha256,
    livingFrameComponentDigestSha256:
      ref.livingFrameComponentDigestSha256,
    selectionDecisionDigestSha256:
      ref.selectionDecisionDigestSha256,
    confirmedFrameDigestSha256: ref.confirmedFrameDigestSha256,
    masterTimingDigestSha256: ref.masterTimingDigestSha256,
    ownerScopeAmendmentDigestSha256:
      ref.ownerScopeAmendmentDigestSha256,
    professionalSkillPolicyDigestSha256:
      ref.professionalSkillPolicyDigestSha256,
    planVersionId: ref.planVersionId,
    planVersion: ref.planVersion,
    planVersionStatus: ref.planVersionStatus,
    planVersionDigestSha256: ref.planVersionDigestSha256,
    approvedSnapshotState: ref.approvedSnapshotState,
    approvedSnapshotDigestSha256:
      ref.approvedSnapshotDigestSha256,
  }
}

function assertSafePresentation(
  presentation: LivingFrameChatPlanPresentation,
): void {
  const serialized = JSON.stringify({
    guided: presentation.guided,
    detailed: presentation.detailed,
    developer: presentation.developer,
  }).toLowerCase()
  for (const forbidden of [
    'rawchat',
    'rawtranscript',
    'mediabytes',
    'filepath',
    'signedurl',
    'http://',
    'https://',
    'comfyui',
    'blender',
    'opentoonz',
    'controlnet',
    'ip-adapter',
    'auraface',
    'credential',
    'command',
    'environment',
  ]) {
    if (serialized.includes(forbidden)) {
      throw new Error('Unsafe Living Frame presentation content.')
    }
  }
}

function sum(
  scenes: readonly LivingFrameScenePlan[],
  count: (scene: LivingFrameScenePlan) => number,
): number {
  return scenes.reduce((total, scene) => total + count(scene), 0)
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child)
  }
  return value
}
