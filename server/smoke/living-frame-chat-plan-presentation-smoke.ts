import assert from 'node:assert/strict'
import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  resolveLivingFrameSelectionPolicy,
} from '../../src/lib/living-frame/living-frame-selection-policy'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills/professional-skill-planner'
import type {
  LivingFrameProfessionalSkillComponent,
} from '../../src/types/living-frame'
import type {
  LivingFrameChatPlanPresentationReloadRef,
} from '../../src/types/living-frame-chat-plan-presentation'
import type {
  PlannerInput,
} from '../../src/types/reeditpro'
import {
  compileLivingFrameActiveProfessionalSkillPolicyProjection,
} from '../living-frame/living-frame-active-professional-skill-policy-projection'
import {
  compileLivingFrameChatPlanPresentation,
  verifyLivingFrameChatPlanPresentation,
  type CompileLivingFrameChatPlanPresentationInput,
  type LivingFrameChatApprovedSnapshotRef,
  type LivingFrameChatConfirmedFrameRef,
  type LivingFrameChatPlanVersionRef,
} from '../living-frame/living-frame-chat-plan-presentation'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const selectedPrompt =
  'Use Living Frame storytelling for the central in-frame explanation.'
const selectedPlannerInput = plannerInput(selectedPrompt)
const selectedSkillPlan = createProfessionalSkillPlan({
  plannerInput: selectedPlannerInput,
})
const fixtures = await createLivingFrameContractFixtures()
const selectedComponent = fixtures.hormuzLivingARoll
const selectedPlanWithComponent = {
  ...selectedSkillPlan,
  livingFrame: selectedComponent,
}
const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
const activePolicyProjection =
  compileLivingFrameActiveProfessionalSkillPolicyProjection()
const selectedDecision = resolveLivingFrameSelectionPolicy({
  explicitUserIntent: selectedPrompt,
})

const selectedInput = presentationInput({
  component: selectedComponent,
  plan: selectedPlanWithComponent,
  planVersion: planVersion('lf-plan-v1', 1, 'awaiting_approval'),
  selectionDecision: selectedDecision,
  snapshot: pendingSnapshot(),
})
const selected =
  await compileLivingFrameChatPlanPresentation(selectedInput)

assert.equal(
  await verifyLivingFrameChatPlanPresentation(selected, selectedInput),
  true,
)
assert.equal(selected.guided.decision, 'selected')
assert.equal(selected.guided.sourceDecision, 'selected')
assert.equal(selected.cardDescriptor.phase, 'plan')
assert.equal(selected.cardDescriptor.priority, 'user_summary')
assert.equal(selected.cardDescriptor.defaultExpanded, true)
assert.equal(
  selected.cardDescriptor.advancedDetailsDefaultExpanded,
  false,
)
assert.equal(selected.cardDescriptor.requiredBeforeApproval, false)
assert.equal(selected.cardDescriptor.separateApprovalCtaProvided, false)
assert.equal(selected.detailed.sceneCount, 1)
assert.deepEqual(selected.detailed.modes, ['living_a_roll'])
assert.equal(selected.detailed.activeScopeCount, 12)
assert.equal(selected.detailed.pausedScopeCount, 7)
assert.equal(selected.developer.refs.length, 9)
assert.equal(selected.reloadAndRevision.state, 'initial_projection')
assert.equal(selected.sharedUiMutated, false)
assert.equal(selected.canonicalConsumptionPending, true)
assert.equal(selected.productionReady, false)

const approvedInput: CompileLivingFrameChatPlanPresentationInput = {
  ...selectedInput,
  planVersion: {
    ...selectedInput.planVersion,
    status: 'approved',
  },
  approvedSnapshot: approvedSnapshot(selectedInput.planVersion),
  previousPresentationReloadRef: selected.reloadRef,
}
const approved =
  await compileLivingFrameChatPlanPresentation(approvedInput)
assert.equal(
  approved.reloadAndRevision.state,
  'approved_snapshot_attached_to_exact_plan',
)
assert.equal(
  approved.reloadAndRevision.previousPresentationMayBeReused,
  true,
)
assert.equal(approved.reloadAndRevision.approvalResetRequired, false)

const reloadedInput: CompileLivingFrameChatPlanPresentationInput = {
  ...approvedInput,
  previousPresentationReloadRef: approved.reloadRef,
}
const reloaded =
  await compileLivingFrameChatPlanPresentation(reloadedInput)
assert.equal(
  reloaded.reloadAndRevision.state,
  'exact_canonical_reload',
)
assert.deepEqual(reloaded.reloadAndRevision.changedBindings, [])
assert.equal(reloaded.reloadAndRevision.previousPresentationStale, false)

const restraintPrompt = 'No animation. Keep visuals static and minimal.'
const restraintPlan = createProfessionalSkillPlan({
  plannerInput: plannerInput(restraintPrompt),
})
const restraintDecision = resolveLivingFrameSelectionPolicy({
  explicitUserIntent: restraintPrompt,
})
const restraintInput = presentationInput({
  component: null,
  plan: restraintPlan,
  planVersion: planVersion('lf-restraint-plan-v1', 1, 'draft'),
  selectionDecision: restraintDecision,
  snapshot: pendingSnapshot(),
})
const restraint =
  await compileLivingFrameChatPlanPresentation(restraintInput)
assert.equal(restraint.guided.decision, 'restraint')
assert.equal(restraint.guided.sourceDecision, 'not_selected')
assert.equal(restraint.guided.explicitRestraintApplied, true)
assert.equal(restraint.detailed.sceneCount, 0)
assert.equal(restraint.cardDescriptor.priority, 'user_summary')

const revisedInput: CompileLivingFrameChatPlanPresentationInput = {
  ...selectedInput,
  planVersion: planVersion('lf-plan-v2', 2, 'awaiting_approval'),
  previousPresentationReloadRef: priorFrameRevisionRef(
    selected.reloadRef,
  ),
}
const revised =
  await compileLivingFrameChatPlanPresentation(revisedInput)
assert.equal(
  revised.reloadAndRevision.state,
  'previous_presentation_invalidated_by_revision',
)
assert.deepEqual(revised.reloadAndRevision.changedBindings, [
  'confirmed_frame_changed',
  'plan_version_changed',
])
assert.equal(revised.reloadAndRevision.previousPresentationStale, true)
assert.equal(revised.reloadAndRevision.previousPresentationMayBeReused, false)
assert.equal(revised.reloadAndRevision.newPlanVersionRequired, true)
assert.equal(revised.reloadAndRevision.approvalResetRequired, true)
assert.equal(revised.reloadAndRevision.previewResetRequired, true)
assert.equal(revised.reloadAndRevision.newApprovedSnapshotRequired, true)

const additionalRevisionCases = [
  {
    kind: 'master_timing_changed' as const,
    previous: priorRevisionRef(selected.reloadRef, {
      masterTimingDigestSha256: sha('prior-master-timing'),
    }),
  },
  {
    kind: 'owner_scope_changed' as const,
    previous: priorRevisionRef(selected.reloadRef, {
      ownerScopeAmendmentDigestSha256: sha('prior-owner-scope'),
    }),
  },
  {
    kind: 'professional_skill_policy_changed' as const,
    previous: priorRevisionRef(selected.reloadRef, {
      professionalSkillPolicyDigestSha256: sha('prior-policy'),
    }),
  },
]

for (const [index, revisionCase] of additionalRevisionCases.entries()) {
  const result = await compileLivingFrameChatPlanPresentation({
    ...selectedInput,
    planVersion: planVersion(
      `lf-revision-plan-v${index + 2}`,
      index + 2,
      'awaiting_approval',
    ),
    previousPresentationReloadRef: revisionCase.previous,
  })
  assert.equal(
    result.reloadAndRevision.state,
    'previous_presentation_invalidated_by_revision',
  )
  assert.equal(
    result.reloadAndRevision.changedBindings.includes(
      revisionCase.kind,
    ),
    true,
  )
  assert.equal(result.reloadAndRevision.approvalResetRequired, true)
  assert.equal(result.reloadAndRevision.newApprovedSnapshotRequired, true)
}

type MutablePresentationInput = {
  -readonly [K in keyof CompileLivingFrameChatPlanPresentationInput]:
    CompileLivingFrameChatPlanPresentationInput[K]
}

const inputTamperCases: Array<{
  readonly label: string
  readonly mutate: (
    candidate: MutablePresentationInput,
  ) => void
}> = [
  tamper('caller tool route', (candidate) => {
    candidate.professionalSkillPlan.selectedSkills
      .find((selection) =>
        selection.skillId === 'motion.living_frame_storytelling')!
      .hiddenAdapterToolNames.push('forbidden')
  }),
  tamper('caller backend intent', (candidate) => {
    candidate.professionalSkillPlan.selectedSkills
      .find((selection) =>
        selection.skillId === 'motion.living_frame_storytelling')!
      .backendIntents.push({
        intentId: 'forbidden',
        intentKind: 'provider_asset',
        userFacingActivity: 'forbidden',
        executionBoundary: 'metadata_only',
        hiddenAdapterToolNames: [],
        requiredApprovalGates: [],
      })
  }),
  tamper('component mismatch', (candidate) => {
    candidate.professionalSkillPlan.livingFrame =
      fixtures.hormuzLivingARoll
    candidate.livingFrameComponent = fixtures.musashiDecisiveStrike
  }),
  tamper('selection mismatch', (candidate) => {
    candidate.selectionDecision = restraintDecision
  }),
  tamper('frame digest', (candidate) => {
    candidate.confirmedFrame = {
      ...candidate.confirmedFrame,
      digestSha256: sha('forged-frame'),
    }
  }),
  tamper('frame ratio', (candidate) => {
    candidate.confirmedFrame = {
      ...candidate.confirmedFrame,
      aspectRatioNumerator: 9,
      aspectRatioDenominator: 16,
    }
  }),
  tamper('timing digest', (candidate) => {
    candidate.masterTiming = {
      ...candidate.masterTiming,
      digestSha256: sha('forged-timing'),
    }
  }),
  tamper('policy projection', (candidate) => {
    candidate.activePolicyProjection = {
      ...candidate.activePolicyProjection,
      canonicalConsumptionPending: false as true,
    }
  }),
  tamper('owner scope', (candidate) => {
    candidate.ownerScopeAmendment = {
      ...candidate.ownerScopeAmendment,
      productionReady: true as false,
    }
  }),
  tamper('approved without snapshot', (candidate) => {
    candidate.planVersion = {
      ...candidate.planVersion,
      status: 'approved',
    }
  }),
  tamper('snapshot mismatch', (candidate) => {
    candidate.approvedSnapshot = {
      state: 'approved',
      snapshotId: 'lf-approved-snapshot-v1',
      snapshotVersion: 1,
      snapshotDigestSha256: sha('lf-approved-snapshot-v1'),
      approvedPlanVersionId: candidate.planVersion.refId,
      approvedPlanVersion: candidate.planVersion.version,
      approvedPlanVersionDigestSha256: sha('other-plan'),
    }
    candidate.planVersion = {
      ...candidate.planVersion,
      status: 'approved',
    }
  }),
  tamper('forged reload ref', (candidate) => {
    candidate.previousPresentationReloadRef = {
      ...selected.reloadRef,
      confirmedFrameDigestSha256: sha('forged-prior-frame'),
    }
  }),
]

for (const { label, mutate } of inputTamperCases) {
  const candidate = structuredClone(selectedInput) as
    MutablePresentationInput
  mutate(candidate)
  await assert.rejects(
    () => compileLivingFrameChatPlanPresentation(
      candidate as unknown as
        CompileLivingFrameChatPlanPresentationInput,
    ),
    label,
  )
}

const outputTamperCases = [
  { cardDescriptor: { ...selected.cardDescriptor, phase: 'safety_qa' } },
  { guided: { ...selected.guided, summary: 'comfyui should run now' } },
  { detailed: { ...selected.detailed, pausedScopeCount: 0 } },
  { developer: { ...selected.developer, opaqueRefsOnly: false } },
  { sharedUiMutated: true },
  { canonicalConsumptionPending: false },
  { approvalGranted: true },
  { runtimeExecuted: true },
  { costAdmitted: true },
  { canonicalQaApproved: true },
  { publicDeliveryReady: true },
  { productionReady: true },
  { presentationDigestSha256: sha('forged-output') },
] as const

for (const mutation of outputTamperCases) {
  assert.equal(
    await verifyLivingFrameChatPlanPresentation(
      { ...selected, ...mutation },
      selectedInput,
    ),
    false,
  )
}

console.log(JSON.stringify({
  contractVersion: selected.contractVersion,
  selectedDecision: selected.guided.decision,
  restraintDecision: restraint.guided.decision,
  selectedSceneCount: selected.detailed.sceneCount,
  selectedModeCount: selected.detailed.modes.length,
  exactReloadVerified:
    reloaded.reloadAndRevision.state === 'exact_canonical_reload',
  approvalAttachmentVerified:
    approved.reloadAndRevision.state
      === 'approved_snapshot_attached_to_exact_plan',
  frameRevisionInvalidated:
    revised.reloadAndRevision.changedBindings.includes(
      'confirmed_frame_changed',
    ),
  inputTamperChecks: inputTamperCases.length,
  outputTamperChecks: outputTamperCases.length,
  revisionInvalidationChecks: 4,
  totalChecks: 53,
  presentationDigestSha256: selected.presentationDigestSha256,
  reloadRefDigestSha256: selected.reloadRef.reloadRefDigestSha256,
  canonicalConsumptionPending: selected.canonicalConsumptionPending,
  sharedUiMutated: selected.sharedUiMutated,
  productionReady: selected.productionReady,
}, null, 2))

function presentationInput(input: {
  component: LivingFrameProfessionalSkillComponent | null
  plan: CompileLivingFrameChatPlanPresentationInput['professionalSkillPlan']
  planVersion: LivingFrameChatPlanVersionRef
  selectionDecision:
    CompileLivingFrameChatPlanPresentationInput['selectionDecision']
  snapshot: LivingFrameChatApprovedSnapshotRef
}): CompileLivingFrameChatPlanPresentationInput {
  return {
    professionalSkillPlan: input.plan,
    livingFrameComponent: input.component,
    selectionDecision: input.selectionDecision,
    ownerScopeAmendment,
    activePolicyProjection,
    confirmedFrame: confirmedFrame(input.component),
    masterTiming: masterTiming(input.component),
    planVersion: input.planVersion,
    approvedSnapshot: input.snapshot,
    previousPresentationReloadRef: null,
  }
}

function confirmedFrame(
  component: LivingFrameProfessionalSkillComponent | null,
): LivingFrameChatConfirmedFrameRef {
  const expectation = component?.inputBindings.outputFrame
  const width = expectation?.expectedWidth ?? 1920
  const height = expectation?.expectedHeight ?? 1080
  const aspectRatioNumerator =
    expectation?.expectedAspectRatioNumerator ?? 16
  const aspectRatioDenominator =
    expectation?.expectedAspectRatioDenominator ?? 9
  const fields = {
    refId: 'confirmed-output-frame-v1',
    version: 1,
    width,
    height,
    fps: 30,
    aspectRatioNumerator,
    aspectRatioDenominator,
    confirmed: true as const,
  }
  return {
    ...fields,
    digestSha256: sha256AuthorityValue(fields),
    livingFrameExpectationRefId:
      expectation?.expectationRefId ?? 'living-frame-output-frame-absent',
    livingFrameExpectationDigestSha256:
      expectation?.expectedDigestSha256 ?? sha256AuthorityValue(null),
  }
}

function masterTiming(
  component: LivingFrameProfessionalSkillComponent | null,
) {
  const expectation = component?.inputBindings.masterTiming
  return {
    refId: expectation?.expectationRefId ?? 'master-timing-v1',
    version: 1,
    digestSha256:
      expectation?.expectedDigestSha256 ?? sha('master-timing'),
  }
}

function planVersion(
  refId: string,
  version: number,
  status: LivingFrameChatPlanVersionRef['status'],
): LivingFrameChatPlanVersionRef {
  return {
    refId,
    version,
    status,
    digestSha256: sha(`${refId}:${version}`),
  }
}

function pendingSnapshot(): LivingFrameChatApprovedSnapshotRef {
  return {
    state: 'pending',
    snapshotId: null,
    snapshotVersion: null,
    snapshotDigestSha256: null,
    approvedPlanVersionId: null,
    approvedPlanVersion: null,
    approvedPlanVersionDigestSha256: null,
  }
}

function approvedSnapshot(
  plan: LivingFrameChatPlanVersionRef,
): LivingFrameChatApprovedSnapshotRef {
  return {
    state: 'approved',
    snapshotId: 'lf-approved-snapshot-v1',
    snapshotVersion: 1,
    snapshotDigestSha256: sha('lf-approved-snapshot-v1'),
    approvedPlanVersionId: plan.refId,
    approvedPlanVersion: plan.version,
    approvedPlanVersionDigestSha256: plan.digestSha256,
  }
}

function priorFrameRevisionRef(
  source: LivingFrameChatPlanPresentationReloadRef,
): LivingFrameChatPlanPresentationReloadRef {
  return priorRevisionRef(source, {
    confirmedFrameDigestSha256: sha('prior-confirmed-frame'),
  })
}

function priorRevisionRef(
  source: LivingFrameChatPlanPresentationReloadRef,
  changes: Partial<Pick<
    LivingFrameChatPlanPresentationReloadRef,
    | 'confirmedFrameDigestSha256'
    | 'masterTimingDigestSha256'
    | 'ownerScopeAmendmentDigestSha256'
    | 'professionalSkillPolicyDigestSha256'
  >>,
): LivingFrameChatPlanPresentationReloadRef {
  const changed = {
    ...structuredClone(source),
    ...changes,
  }
  changed.sourceFingerprintDigestSha256 =
    sha256AuthorityValue(sourceFingerprint(changed))
  const withoutDigest = { ...changed }
  delete (withoutDigest as {
    reloadRefDigestSha256?: string
  }).reloadRefDigestSha256
  changed.reloadRefDigestSha256 = sha256AuthorityValue(withoutDigest)
  return changed
}

function sourceFingerprint(
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

function tamper(
  label: string,
  mutate: (
    candidate: MutablePresentationInput,
  ) => void,
) {
  return { label, mutate }
}

function sha(value: string): string {
  return sha256AuthorityValue(value)
}

function plannerInput(customInstructions: string): PlannerInput {
  return {
    projectName: 'Living Frame chat presentation smoke',
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
    customInstructions,
    creditPreference: 'balanced',
    clips: [{
      id: 'source-1',
      uploadedOrder: 1,
      fileName: 'source.mp4',
      duration: '0:05',
      detectedType: 'talking_head',
      sourceOrderLocked: true,
    }],
  }
}
