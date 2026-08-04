import type { ApprovedPlanSnapshot } from '../../../src/types/edit-planning-db'
import type {
  StorytellingMotionStyleChangeImpact,
  StorytellingMotionStyleDecisionDto,
  StorytellingMotionStylePlanBinding,
  StorytellingMotionStylePlanReviewInput,
  StorytellingMotionStyleReviewDto,
  StorytellingMotionStyleSelection,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION,
} from '../../../src/types/motion-studio'
import {
  storytellingMotionStyleChangeImpactSchema,
  storytellingMotionStyleDecisionDtoSchema,
  storytellingMotionStylePlanReviewInputSchema,
  storytellingMotionStyleReviewDtoSchema,
  storytellingMotionStyleSelectionSchema,
} from '../../../src/lib/motion-studio/contracts'
import {
  createStorytellingMotionStylePlanReviewInput,
  verifyStorytellingMotionStyleChangeImpactDigest,
  verifyStorytellingMotionStylePlanBindingAgainstSnapshot,
} from './plan-binding'
import { verifyStorytellingStyleAuthorityDigest } from './authority'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  canonicalStorytellingStyleAuthoritySchema,
  type CanonicalStorytellingStyleAuthority,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import {
  verifyCanonicalApprovedStorytellingStyleBinding,
  type CanonicalApprovedStorytellingStyleBinding,
} from './canonical-approved-style-binding'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'

type ExactStyleDecisionIdentity = {
  projectId: string
  editSessionId: string
  productionId: string
}

export type StorytellingMotionStyleDecisionSource =
  | { state: 'comparison_only' }
  | { state: 'selected_for_plan'; styleSelection: StorytellingMotionStyleSelection }
  | { state: 'awaiting_plan_review'; planReviewInput: StorytellingMotionStylePlanReviewInput }
  | {
    state: 'canonical_awaiting_plan_review'
    authority: CanonicalStorytellingStyleAuthority
    componentDigest: string
    sourceRepositoryReverified: boolean
    sourcePlanReviewInputDigest?: string
  }
  | {
    state: 'canonical_approved_locked'
    binding: CanonicalApprovedStorytellingStyleBinding
    sourceRepositoryReverified: boolean
    sourcePlanReviewInputDigest?: string
    approvedCalibrationPlanDigest?: string
  }
  | {
    state: 'approved_locked'
    planBinding: StorytellingMotionStylePlanBinding
    approvedPlanSnapshot: ApprovedPlanSnapshot
  }
  | {
    state: 'stale_replan_required'
    priorPlanBinding: StorytellingMotionStylePlanBinding
    priorApprovedPlanSnapshot: ApprovedPlanSnapshot
    changeImpact: StorytellingMotionStyleChangeImpact
  }

/**
 * Reduces server-only style, snapshot, and change-impact authority to a small
 * browser-safe decision state. Invalid or cross-edit authority fails closed;
 * it is never converted into an empty/comparison state.
 */
export function projectStorytellingMotionStyleDecision(
  reviewInput: StorytellingMotionStyleReviewDto,
  source: StorytellingMotionStyleDecisionSource,
  identity: ExactStyleDecisionIdentity,
): StorytellingMotionStyleDecisionDto {
  const review = storytellingMotionStyleReviewDtoSchema.parse(reviewInput)
  if (source.state === 'comparison_only') {
    return decision({
      state: 'comparison_only',
      statusLabel: 'Comparison only',
      title: 'Compare how this story could move',
      summary: review.notice,
      nextAction: { kind: 'discuss_in_chat', label: 'Discuss a direction in Chat' },
      planReviewRequired: false,
      approvedLocked: false,
      approvedDecisionPreserved: false,
      calibrationState: 'not_planned',
      calibrationScenarioCount: 0,
    })
  }

  if (source.state === 'selected_for_plan') {
    const selection = storytellingMotionStyleSelectionSchema.parse(source.styleSelection)
    assertSelection(selection, identity)
    const selected = directionFor(review, selection)
    return decision({
      state: source.state,
      selectedStyleProfileId: selected.styleProfile.styleProfileId,
      selectedStyleDisplayName: selected.displayName,
      statusLabel: 'Chosen in Chat',
      title: `${selected.displayName} is ready to add to the plan`,
      summary: 'The direction is captured as draft planning input. It is not approved, generated, or charged yet.',
      nextAction: { kind: 'continue_in_chat', label: 'Continue planning in Chat' },
      planReviewRequired: true,
      approvedLocked: false,
      approvedDecisionPreserved: false,
      calibrationState: 'not_planned',
      calibrationScenarioCount: 0,
    })
  }

  if (source.state === 'awaiting_plan_review') {
    const input = storytellingMotionStylePlanReviewInputSchema.parse(source.planReviewInput)
    assertSelection(input.styleSelection, identity)
    if (!verifyStorytellingStyleAuthorityDigest(input.calibrationPlan)) {
      throw new Error('Storytelling style calibration authority failed digest verification.')
    }
    const expectedInput = createStorytellingMotionStylePlanReviewInput({
      styleSelection: input.styleSelection,
      calibrationPlan: input.calibrationPlan,
    })
    if (sha256CanonicalJson(expectedInput) !== sha256CanonicalJson(input)) {
      throw new Error('Storytelling style Plan Review input failed exact authority verification.')
    }
    const selected = directionFor(review, input.styleSelection)
    return decision({
      state: source.state,
      selectedStyleProfileId: selected.styleProfile.styleProfileId,
      selectedStyleDisplayName: selected.displayName,
      statusLabel: 'Awaiting Plan Review',
      title: `${selected.displayName} is included in the current plan`,
      summary: 'Review this direction with the existing plan and estimate. Nothing starts until that one Plan Review is approved.',
      nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
      planReviewRequired: true,
      approvedLocked: false,
      approvedDecisionPreserved: false,
      calibrationState: 'planning_only',
      calibrationScenarioCount: input.calibrationPlan.scenarios.length,
    })
  }

  if (source.state === 'canonical_awaiting_plan_review') {
    const authority = canonicalStorytellingStyleAuthoritySchema.parse(source.authority)
    assertCanonicalAuthority(authority, source.componentDigest, identity)
    const selected = directionForCanonical(review, authority)
    return decision({
      state: 'awaiting_plan_review',
      selectedStyleProfileId: selected.styleProfile.styleProfileId,
      selectedStyleDisplayName: selected.displayName,
      statusLabel: 'Awaiting Plan Review',
      title: `${selected.displayName} is included in the current plan`,
      summary: 'Review this direction with the existing plan and estimate. Nothing starts until that one Plan Review is approved.',
      nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
      planReviewRequired: true,
      approvedLocked: false,
      approvedDecisionPreserved: false,
      calibrationState: 'planning_only',
      calibrationScenarioCount: authority.calibrationPlan.scenarioKinds.length,
    })
  }

  if (source.state === 'canonical_approved_locked') {
    const binding = source.binding
    if (!verifyCanonicalApprovedStorytellingStyleBinding(binding)) {
      throw new Error('Canonical Storytelling style approval failed exact binding verification.')
    }
    const authority = binding.canonicalStyleComponent.authority
    assertCanonicalAuthority(
      authority,
      binding.canonicalStyleComponent.componentDigest,
      identity,
    )
    const selected = directionForCanonical(review, authority)
    return decision({
      state: 'approved_locked',
      selectedStyleProfileId: selected.styleProfile.styleProfileId,
      selectedStyleDisplayName: selected.displayName,
      statusLabel: 'Approved direction',
      title: `${selected.displayName} is locked to the approved plan`,
      summary: 'The exact style and bounded calibration plan are preserved with the approved version. Approval alone does not claim that media has been generated.',
      nextAction: { kind: 'request_revision', label: 'Request a style change in Chat' },
      planReviewRequired: false,
      approvedLocked: true,
      approvedDecisionPreserved: true,
      calibrationState: 'approved_not_executed',
      calibrationScenarioCount: authority.calibrationPlan.scenarioKinds.length,
    })
  }

  if (source.state === 'approved_locked') {
    const { approvedPlanSnapshot, planBinding } = source
    if (!verifyStorytellingMotionStylePlanBindingAgainstSnapshot(planBinding, approvedPlanSnapshot)) {
      throw new Error('Storytelling style approval does not match the exact approved plan snapshot.')
    }
    assertBindingIdentity(planBinding, identity)
    const selected = directionFor(review, planBinding.approvedStyleSelection)
    return decision({
      state: source.state,
      selectedStyleProfileId: selected.styleProfile.styleProfileId,
      selectedStyleDisplayName: selected.displayName,
      statusLabel: 'Approved direction',
      title: `${selected.displayName} is locked to the approved plan`,
      summary: 'The exact style and bounded calibration plan are preserved with the approved version. Approval alone does not claim that media has been generated.',
      nextAction: { kind: 'request_revision', label: 'Request a style change in Chat' },
      planReviewRequired: false,
      approvedLocked: true,
      approvedDecisionPreserved: true,
      calibrationState: 'approved_not_executed',
      calibrationScenarioCount: planBinding.approvedCalibrationPlan.scenarios.length,
    })
  }

  const { changeImpact, priorApprovedPlanSnapshot, priorPlanBinding } = source
  const parsedImpact = storytellingMotionStyleChangeImpactSchema.parse(changeImpact)
  if (!verifyStorytellingMotionStylePlanBindingAgainstSnapshot(priorPlanBinding, priorApprovedPlanSnapshot) ||
      !verifyStorytellingMotionStyleChangeImpactDigest(parsedImpact) ||
      parsedImpact.priorPlanBindingDigest !== priorPlanBinding.bindingDigest) {
    throw new Error('Storytelling style change does not match the exact prior approved plan.')
  }
  assertBindingIdentity(priorPlanBinding, identity)
  assertSelection(parsedImpact.proposedStyleSelection, identity)
  const selected = directionFor(review, parsedImpact.proposedStyleSelection)
  return decision({
    state: source.state,
    selectedStyleProfileId: selected.styleProfile.styleProfileId,
    selectedStyleDisplayName: selected.displayName,
    statusLabel: 'New plan required',
    title: `${selected.displayName} needs a new Plan Review`,
    summary: 'The earlier approval remains immutable. Story and research can stay, while affected visual work is reviewed or rebuilt under a new plan and estimate.',
    nextAction: { kind: 'continue_replanning', label: 'Continue replanning in Chat' },
    planReviewRequired: true,
    approvedLocked: false,
    approvedDecisionPreserved: true,
    calibrationState: 'stale',
    calibrationScenarioCount: 0,
    changeImpact: {
      preservedVersionCount: parsedImpact.preservedArtifactVersions.length,
      reviewRequiredVersionCount: parsedImpact.reviewRequiredArtifactVersions.length,
      rebuildRequiredVersionCount: parsedImpact.rebuildRequiredArtifactVersions.length,
      priorApprovalRemainsImmutable: true,
    },
  })
}

function assertCanonicalAuthority(
  authority: CanonicalStorytellingStyleAuthority,
  componentDigest: string,
  identity: ExactStyleDecisionIdentity,
): void {
  if (
    sha256AuthorityValue(authority) !== componentDigest ||
    authority.projectId !== identity.projectId ||
    authority.editSessionId !== identity.editSessionId ||
    authority.productionId !== identity.productionId
  ) {
    throw new Error('Canonical Storytelling style authority does not match this exact project, named edit, and production.')
  }
}

function assertSelection(
  selection: StorytellingMotionStyleSelection,
  identity: ExactStyleDecisionIdentity,
): void {
  if (!verifyStorytellingStyleAuthorityDigest(selection)) {
    throw new Error('Storytelling style selection failed digest verification.')
  }
  if (selection.state !== 'selected_for_plan' || selection.projectId !== identity.projectId ||
      selection.editSessionId !== identity.editSessionId || selection.productionId !== identity.productionId) {
    throw new Error('Storytelling style selection does not match this exact project, named edit, and production.')
  }
}

function assertBindingIdentity(
  binding: StorytellingMotionStylePlanBinding,
  identity: ExactStyleDecisionIdentity,
): void {
  if (binding.projectId !== identity.projectId || binding.editSessionId !== identity.editSessionId ||
      binding.productionId !== identity.productionId) {
    throw new Error('Storytelling style approval does not match this exact project, named edit, and production.')
  }
}

function directionFor(
  review: StorytellingMotionStyleReviewDto,
  selection: StorytellingMotionStyleSelection,
) {
  const selected = review.directions.find((direction) =>
    direction.styleProfile.styleProfileId === selection.styleProfile.styleProfileId &&
    direction.styleProfile.styleProfileVersion === selection.styleProfile.styleProfileVersion &&
    direction.styleProfile.styleProfileDigest === selection.styleProfile.styleProfileDigest)
  if (!selected) throw new Error('Storytelling style selection is not present in the exact reviewed catalog.')
  return selected
}

function directionForCanonical(
  review: StorytellingMotionStyleReviewDto,
  authority: CanonicalStorytellingStyleAuthority,
) {
  const reference = authority.styleSelection.styleProfile
  const selected = review.directions.find((direction) =>
    direction.styleProfile.styleProfileId === reference.styleProfileId &&
    direction.styleProfile.styleProfileVersion === reference.styleProfileVersion &&
    direction.styleProfile.styleProfileDigest === reference.styleProfileDigest)
  if (!selected) throw new Error('Canonical Storytelling style selection is not present in the exact reviewed catalog.')
  return selected
}

function decision(
  value: Omit<StorytellingMotionStyleDecisionDto, 'schemaVersion' | 'decisionAuthority' | 'readOnly' | 'runtimeExecutionAuthorized'>,
): StorytellingMotionStyleDecisionDto {
  return deepFreeze(storytellingMotionStyleDecisionDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION,
    ...value,
    decisionAuthority: 'existing_plan_review',
    readOnly: true,
    runtimeExecutionAuthorized: false,
  }))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
