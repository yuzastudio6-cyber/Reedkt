import type {
  ProjectVideoRoutingProfile,
  StorytellingMotionStyleDecisionDto,
  StorytellingStyleCalibrationReviewDto,
  StorytellingStyleCalibrationReviewState,
  StorytellingStyleCalibrationScenarioDto,
  StyleCalibrationPlan,
  StyleCalibrationReel,
  StyleCalibrationScenarioKind,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION,
} from '../../../src/types/motion-studio'
import {
  ALL_STYLE_CALIBRATION_SCENARIOS,
  projectVideoRoutingProfileSchema,
  storytellingMotionStyleDecisionDtoSchema,
  storytellingStyleCalibrationReviewDtoSchema,
  styleCalibrationPlanSchema,
} from '../../../src/lib/motion-studio/contracts'
import { verifyStorytellingStyleAuthorityDigest } from './authority'
import { verifyStyleCalibrationReelDigest } from './calibration-evidence'
import {
  canonicalStorytellingStyleAuthoritySchema,
  type CanonicalStorytellingStyleAuthority,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import {
  verifyCanonicalApprovedStorytellingStyleBinding,
  type CanonicalApprovedStorytellingStyleBinding,
} from './canonical-approved-style-binding'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'

type ExactCalibrationIdentity = {
  projectId: string
  editSessionId: string
  productionId: string
}

export interface StorytellingStyleCalibrationExecutionProjectionSource {
  source: 'canonical_private_work_graph'
  durableStateVerified: true
  state: 'not_started' | 'preparing' | 'paused' | 'blocked'
  currentScenarioKind?: StyleCalibrationScenarioKind
  retryAvailable: boolean
}

/**
 * Server-only references used to project private calibration state. The
 * browser projection deliberately removes operation, provider, attempt,
 * storage, digest, and monetary evidence.
 */
export interface StorytellingStyleCalibrationEvidenceSource {
  reel?: StyleCalibrationReel
  routingProfile?: ProjectVideoRoutingProfile
  execution?: StorytellingStyleCalibrationExecutionProjectionSource
}

export type StorytellingStyleCanonicalCalibrationSource =
  | {
    state: 'awaiting_plan_review'
    authority: CanonicalStorytellingStyleAuthority
    componentDigest: string
    sourceRepositoryReverified: boolean
  }
  | {
    state: 'approved_locked'
    binding: CanonicalApprovedStorytellingStyleBinding
    sourceRepositoryReverified: boolean
    approvedCalibrationPlanDigest?: string
  }

type ExpectedCalibrationAuthority = ExactCalibrationIdentity & {
  workspaceId: string
  calibrationPlanDigest: string
  scenarioKinds: readonly StyleCalibrationScenarioKind[]
  styleProfileId: string
  routePolicyId: string
  approvedPlanSnapshotId?: string
  approvedPlanSnapshotDigest?: string
  maximumAuthorizedInternalCostMicros?: number
}

const scenarioCopy: Readonly<Record<StyleCalibrationScenarioKind, {
  label: string
  purpose: string
}>> = {
  style_led_motion: {
    label: 'Style-led motion',
    purpose: 'Checks whether the chosen visual language stays coherent while the scene moves.',
  },
  character_continuity: {
    label: 'Character continuity',
    purpose: 'Checks identity, wardrobe, age, and appearance continuity across motion.',
  },
  strict_first_last_frame: {
    label: 'Frame-to-frame control',
    purpose: 'Checks whether a directed transition reaches its approved opening and ending frames.',
  },
  reference_heavy: {
    label: 'Reference-heavy scene',
    purpose: 'Checks composition, camera, location, object, and motion references together.',
  },
  exact_text_data: {
    label: 'Text and data precision',
    purpose: 'Checks exact editable typography, maps, charts, labels, and evidence graphics.',
  },
}

const notice = 'This is a private, read-only comparison. It never starts media work, changes an approved plan, selects a route automatically, or spends customer credits.'

/**
 * Projects exact immutable calibration evidence into one compact user-facing
 * lifecycle. Any mismatched or unverified server authority fails closed.
 */
export function projectStorytellingStyleCalibrationReview(input: {
  decision: StorytellingMotionStyleDecisionDto
  identity: ExactCalibrationIdentity
  plan?: StyleCalibrationPlan
  canonicalSource?: StorytellingStyleCanonicalCalibrationSource
  evidence?: StorytellingStyleCalibrationEvidenceSource
}): StorytellingStyleCalibrationReviewDto {
  const decision = storytellingMotionStyleDecisionDtoSchema.parse(input.decision)
  const plan = input.plan ? styleCalibrationPlanSchema.parse(input.plan) : undefined
  if (plan && input.canonicalSource) {
    throw new Error('Style calibration review cannot combine legacy and canonical plan authority.')
  }
  const evidence = input.evidence

  if (input.canonicalSource) {
    return projectCanonicalCalibrationReview({
      decision,
      identity: input.identity,
      source: input.canonicalSource,
      evidence,
    })
  }

  if (!plan) {
    if (evidence?.execution || evidence?.reel || evidence?.routingProfile) {
      throw new Error('Style calibration evidence cannot exist without the exact calibration plan.')
    }
    if (['awaiting_plan_review', 'approved_locked', 'stale_replan_required'].includes(decision.state)) {
      throw new Error('Style calibration lifecycle requires the exact plan authority.')
    }
    return calibrationReview({
      state: 'not_ready',
      selectedStyleDisplayName: decision.selectedStyleDisplayName,
      statusLabel: decision.state === 'selected_for_plan' ? 'Direction chosen' : 'Not ready',
      title: decision.state === 'selected_for_plan'
        ? 'Add the direction to the plan first'
        : 'Choose a motion direction before calibration',
      summary: decision.state === 'selected_for_plan'
        ? 'The direction is still draft planning input. The five-scene comparison appears only after it enters the existing Plan Review.'
        : 'Compare the motion directions above, then discuss the best fit in Chat.',
      scenarios: [],
      nextAction: {
        kind: 'discuss_in_chat',
        label: decision.state === 'selected_for_plan' ? 'Continue planning in Chat' : 'Discuss a direction in Chat',
      },
    })
  }

  assertExactPlan(plan, decision, input.identity)
  if (plan.approvalAuthority.state === 'planning_only') {
    if (decision.state !== 'awaiting_plan_review' || evidence?.execution || evidence?.reel || evidence?.routingProfile) {
      throw new Error('Planning-only calibration cannot claim execution or evidence state.')
    }
    return calibrationReview({
      state: 'awaiting_plan_review',
      selectedStyleDisplayName: decision.selectedStyleDisplayName,
      statusLabel: 'Awaiting Plan Review',
      title: 'Five-scene calibration is included in the plan',
      summary: 'Review the bounded comparison and its estimate in the existing Plan Review. Nothing starts from this surface.',
      scenarios: scenarioRows(
        plan.scenarios.map((scenario) => scenario.kind),
        undefined,
        undefined,
        'awaiting_plan_review',
      ),
      nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
    })
  }

  if (decision.state === 'stale_replan_required') {
    return calibrationReview({
      state: 'stale',
      selectedStyleDisplayName: decision.selectedStyleDisplayName,
      statusLabel: 'New plan required',
      title: 'The earlier calibration no longer matches the current direction',
      summary: 'Earlier evidence remains preserved. A new plan and estimate must define what can stay, what needs review, and what must be rebuilt.',
      scenarios: scenarioRows(
        plan.scenarios.map((scenario) => scenario.kind),
        evidence?.reel,
        evidence?.execution,
        'stale',
      ),
      nextAction: { kind: 'continue_replanning', label: 'Continue replanning in Chat' },
    })
  }
  if (decision.state !== 'approved_locked') {
    throw new Error('Approved calibration plan does not match the current style decision lifecycle.')
  }

  const verified = verifyEvidence(expectedFromLegacyPlan(plan, input.identity), evidence)
  const state = resolveApprovedState(verified.reel, verified.routingProfile, verified.execution)
  const scenarios = scenarioRows(
    plan.scenarios.map((scenario) => scenario.kind),
    verified.reel,
    verified.execution,
    state,
  )
  const selectedStyleDisplayName = decision.selectedStyleDisplayName
  const content = approvedStateCopy(state, selectedStyleDisplayName, scenarios)
  return calibrationReview({
    state,
    selectedStyleDisplayName,
    ...content,
    scenarios,
    ...(['preparing', 'resumable'].includes(state) && verified.execution?.currentScenarioKind
      ? { currentScenarioKind: verified.execution.currentScenarioKind }
      : {}),
  })
}

function projectCanonicalCalibrationReview(input: {
  decision: StorytellingMotionStyleDecisionDto
  identity: ExactCalibrationIdentity
  source: StorytellingStyleCanonicalCalibrationSource
  evidence?: StorytellingStyleCalibrationEvidenceSource
}): StorytellingStyleCalibrationReviewDto {
  const { decision, identity, source, evidence } = input
  const expected = expectedFromCanonicalSource(source, identity)
  if (decision.selectedStyleProfileId !== expected.styleProfileId) {
    throw new Error('Canonical calibration authority does not match the current Storytelling direction.')
  }
  if (source.state === 'awaiting_plan_review') {
    if (decision.state !== 'awaiting_plan_review' || evidence?.execution || evidence?.reel || evidence?.routingProfile) {
      throw new Error('Canonical planning-only calibration cannot claim execution or evidence state.')
    }
    return calibrationReview({
      state: 'awaiting_plan_review',
      selectedStyleDisplayName: decision.selectedStyleDisplayName,
      statusLabel: 'Awaiting Plan Review',
      title: 'Five-scene calibration is included in the plan',
      summary: 'Review the bounded comparison and its estimate in the existing Plan Review. Nothing starts from this surface.',
      scenarios: scenarioRows(expected.scenarioKinds, undefined, undefined, 'awaiting_plan_review'),
      nextAction: { kind: 'review_plan', label: 'Review the plan in Chat' },
    })
  }
  if (decision.state !== 'approved_locked') {
    throw new Error('Canonical approved calibration does not match the current style decision lifecycle.')
  }
  if (
    !source.sourceRepositoryReverified &&
    (evidence?.execution || evidence?.reel || evidence?.routingProfile)
  ) {
    throw new Error(
      'Canonical calibration evidence requires the exact source-reverified Motion planning record.',
    )
  }
  if (source.sourceRepositoryReverified && !source.approvedCalibrationPlanDigest) {
    throw new Error(
      'Canonical calibration recovery requires the exact post-approval Motion plan digest.',
    )
  }
  const verified = verifyEvidence(expected, evidence)
  const state = resolveApprovedState(verified.reel, verified.routingProfile, verified.execution)
  const scenarios = scenarioRows(expected.scenarioKinds, verified.reel, verified.execution, state)
  const content = approvedStateCopy(state, decision.selectedStyleDisplayName, scenarios)
  return calibrationReview({
    state,
    selectedStyleDisplayName: decision.selectedStyleDisplayName,
    ...content,
    scenarios,
    ...(['preparing', 'resumable'].includes(state) && verified.execution?.currentScenarioKind
      ? { currentScenarioKind: verified.execution.currentScenarioKind }
      : {}),
  })
}

function verifyEvidence(
  expected: ExpectedCalibrationAuthority,
  source: StorytellingStyleCalibrationEvidenceSource | undefined,
): Required<Pick<StorytellingStyleCalibrationEvidenceSource, never>> & StorytellingStyleCalibrationEvidenceSource {
  const reel = source?.reel
  const routingProfile = source?.routingProfile
  const execution = source?.execution
  if (reel) {
    if (!verifyStyleCalibrationReelDigest(reel) || reel.projectId !== expected.projectId ||
        reel.editSessionId !== expected.editSessionId || reel.productionId !== expected.productionId ||
        reel.workspaceId !== expected.workspaceId || reel.calibrationPlanDigest !== expected.calibrationPlanDigest ||
        reel.approvedPlanSnapshotId !== expected.approvedPlanSnapshotId ||
        reel.approvedPlanSnapshotDigest !== expected.approvedPlanSnapshotDigest ||
        reel.maximumAuthorizedInternalCostMicros !== expected.maximumAuthorizedInternalCostMicros) {
      throw new Error('Style Calibration Reel does not match the exact approved calibration authority.')
    }
  }
  if (routingProfile) {
    const profile = projectVideoRoutingProfileSchema.parse(routingProfile)
    if (!reel || !verifyStorytellingStyleAuthorityDigest(profile) ||
        profile.projectId !== expected.projectId || profile.editSessionId !== expected.editSessionId ||
        profile.productionId !== expected.productionId || profile.workspaceId !== expected.workspaceId ||
        profile.calibrationPlanDigest !== expected.calibrationPlanDigest ||
        profile.calibrationReelDigest !== reel.reelDigest ||
        sha256CanonicalJson(profile.decisions) !== sha256CanonicalJson(reel.decisions) ||
        profile.styleProfile.styleProfileId !== expected.styleProfileId ||
        profile.routePolicyId !== expected.routePolicyId ||
        profile.approvedPlanSnapshotId !== expected.approvedPlanSnapshotId ||
        profile.approvedPlanSnapshotDigest !== expected.approvedPlanSnapshotDigest) {
      throw new Error('Project video routing profile does not match the exact Calibration Reel.')
    }
  }
  if (execution) {
    if (execution.source !== 'canonical_private_work_graph' || !execution.durableStateVerified) {
      throw new Error('Calibration progress requires durable canonical work-graph evidence.')
    }
    if (execution.currentScenarioKind &&
        !expected.scenarioKinds.includes(execution.currentScenarioKind)) {
      throw new Error('Calibration progress references a scenario outside the approved plan.')
    }
    if (execution.state === 'not_started' && (execution.currentScenarioKind || execution.retryAvailable)) {
      throw new Error('Not-started calibration cannot claim active or retry state.')
    }
  }
  return { ...(reel ? { reel } : {}), ...(routingProfile ? { routingProfile } : {}), ...(execution ? { execution } : {}) }
}

function resolveApprovedState(
  reel: StyleCalibrationReel | undefined,
  routingProfile: ProjectVideoRoutingProfile | undefined,
  execution: StorytellingStyleCalibrationExecutionProjectionSource | undefined,
): Exclude<StorytellingStyleCalibrationReviewState, 'not_ready' | 'awaiting_plan_review' | 'stale'> {
  if (reel?.state === 'stale' || routingProfile?.state === 'stale') return 'blocked'
  if (reel?.state === 'blocked' || execution?.state === 'blocked') return 'blocked'
  if (reel?.state === 'awaiting_review') return 'needs_review'
  if (reel?.state === 'approved') {
    if (routingProfile?.state === 'approved' && routingProfile.bulkGenerationAllowed) return 'approved_locked'
    return 'blocked'
  }
  if (reel?.state === 'collecting' && !execution) return 'blocked'
  if (execution?.state === 'paused') return 'resumable'
  if (execution?.state === 'preparing') return 'preparing'
  return 'approved_not_started'
}

function scenarioRows(
  scenarioKinds: readonly StyleCalibrationScenarioKind[],
  reel: StyleCalibrationReel | undefined,
  execution: StorytellingStyleCalibrationExecutionProjectionSource | undefined,
  state: Exclude<StorytellingStyleCalibrationReviewState, 'not_ready'>,
): readonly StorytellingStyleCalibrationScenarioDto[] {
  const accepted = new Set(reel?.decisions
    .filter((decision) => decision.technicalQaStatus === 'passed' && decision.creativeDecision === 'accepted')
    .map((decision) => decision.scenarioKind) ?? [])
  return ALL_STYLE_CALIBRATION_SCENARIOS.map((kind) => {
    if (!scenarioKinds.includes(kind)) {
      throw new Error(`Style calibration plan is missing required scenario: ${kind}`)
    }
    const candidates = reel?.candidates.filter((candidate) => candidate.scenarioKind === kind) ?? []
    const unresolvedAttempt = candidates.some((candidate) =>
      candidate.attemptOutcome === 'unknown' || !candidate.cost.reconciled)
    const blockedCurrentScenario = execution?.state === 'blocked' && execution.currentScenarioKind === kind
    const status = state === 'stale'
      ? 'stale'
      : (reel?.state !== 'approved' && unresolvedAttempt) || blockedCurrentScenario
        ? 'needs_attention'
        : accepted.has(kind)
        ? 'accepted'
        : candidates.some((candidate) => candidate.attemptOutcome !== 'succeeded' ||
          candidate.technicalQa.status === 'failed' || candidate.creativeReview.decision === 'rejected')
          ? 'needs_attention'
          : candidates.some((candidate) => candidate.attemptOutcome === 'succeeded' &&
            candidate.technicalQa.status === 'passed' && candidate.creativeReview.decision === 'pending')
            ? 'ready_for_review'
            : execution?.currentScenarioKind === kind || candidates.some((candidate) =>
              candidate.attemptOutcome === 'succeeded' && candidate.technicalQa.status === 'not_run')
              ? 'preparing'
              : 'not_started'
    return {
      kind,
      ...scenarioCopy[kind],
      status,
      statusLabel: scenarioStatusLabel(status),
    }
  })
}

function expectedFromLegacyPlan(
  plan: StyleCalibrationPlan,
  identity: ExactCalibrationIdentity,
): ExpectedCalibrationAuthority {
  const approval = plan.approvalAuthority
  return {
    ...identity,
    workspaceId: plan.workspaceId,
    calibrationPlanDigest: plan.planDigest,
    scenarioKinds: plan.scenarios.map((scenario) => scenario.kind),
    styleProfileId: plan.styleProfile.styleProfileId,
    routePolicyId: plan.routePolicy.policyId,
    ...(approval.approvedPlanSnapshotId
      ? { approvedPlanSnapshotId: approval.approvedPlanSnapshotId }
      : {}),
    ...(approval.approvedPlanSnapshotDigest
      ? { approvedPlanSnapshotDigest: approval.approvedPlanSnapshotDigest }
      : {}),
    ...(approval.maximumAuthorizedInternalCostMicros !== undefined
      ? { maximumAuthorizedInternalCostMicros: approval.maximumAuthorizedInternalCostMicros }
      : {}),
  }
}

function expectedFromCanonicalSource(
  source: StorytellingStyleCanonicalCalibrationSource,
  identity: ExactCalibrationIdentity,
): ExpectedCalibrationAuthority {
  const authority = source.state === 'awaiting_plan_review'
    ? canonicalStorytellingStyleAuthoritySchema.parse(source.authority)
    : source.binding.canonicalStyleComponent.authority
  const componentDigest = source.state === 'awaiting_plan_review'
    ? source.componentDigest
    : source.binding.canonicalStyleComponent.componentDigest
  if (
    sha256AuthorityValue(authority) !== componentDigest ||
    authority.projectId !== identity.projectId ||
    authority.editSessionId !== identity.editSessionId ||
    authority.productionId !== identity.productionId
  ) {
    throw new Error('Canonical calibration authority does not match this exact Storytelling production.')
  }
  if (source.state === 'approved_locked' &&
      !verifyCanonicalApprovedStorytellingStyleBinding(source.binding)) {
    throw new Error('Canonical approved calibration binding failed exact verification.')
  }
  const approved = source.state === 'approved_locked'
    ? source.binding.approvedSnapshot
    : undefined
  const calibrationPlanDigest = source.state === 'approved_locked' &&
    source.sourceRepositoryReverified
      ? source.approvedCalibrationPlanDigest
      : authority.calibrationPlan.planDigest
  if (!calibrationPlanDigest) {
    throw new Error(
      'Canonical calibration recovery requires the exact post-approval Motion plan digest.',
    )
  }
  return {
    ...identity,
    workspaceId: authority.workspaceId,
    calibrationPlanDigest,
    scenarioKinds: authority.calibrationPlan.scenarioKinds,
    styleProfileId: authority.styleSelection.styleProfile.styleProfileId,
    routePolicyId: authority.calibrationPlan.routePolicyId,
    ...(approved ? {
      approvedPlanSnapshotId: approved.snapshotId,
      approvedPlanSnapshotDigest: approved.snapshotHash,
      maximumAuthorizedInternalCostMicros:
        authority.internalCostEnvelope.maximumEstimatedInternalProductionCostMicros,
    } : {}),
  }
}

function approvedStateCopy(
  state: Exclude<StorytellingStyleCalibrationReviewState, 'not_ready' | 'awaiting_plan_review' | 'stale'>,
  styleName: string | undefined,
  scenarios: readonly StorytellingStyleCalibrationScenarioDto[],
): Pick<StorytellingStyleCalibrationReviewDto, 'statusLabel' | 'title' | 'summary' | 'nextAction'> {
  const name = styleName ?? 'The approved direction'
  const completed = scenarios.filter((scenario) => [
    'ready_for_review', 'accepted', 'needs_attention',
  ].includes(scenario.status)).length
  const accepted = scenarios.filter((scenario) => scenario.status === 'accepted').length
  const content: Record<typeof state, Pick<StorytellingStyleCalibrationReviewDto,
  'statusLabel' | 'title' | 'summary' | 'nextAction'>> = {
    approved_not_started: {
      statusLabel: 'Not started',
      title: 'The private calibration has not started',
      summary: `${name} is approved for a bounded five-scene comparison, but there is no verified calibration run to show yet.`,
      nextAction: { kind: 'continue_in_chat', label: 'Check the next step in Chat' },
    },
    preparing: {
      statusLabel: 'Preparing privately',
      title: 'Building the five-scene comparison',
      summary: `${completed} of 5 scenarios have reached a reviewable outcome. Progress shown here comes only from durable private work state.`,
      nextAction: { kind: 'continue_in_chat', label: 'Discuss progress in Chat' },
    },
    resumable: {
      statusLabel: 'Paused safely',
      title: 'Calibration can continue from its saved point',
      summary: `${completed} of 5 scenarios have reached a reviewable outcome. Completed evidence remains preserved while recovery is reviewed.`,
      nextAction: { kind: 'request_recovery_in_chat', label: 'Review resume options in Chat' },
    },
    needs_review: {
      statusLabel: 'Review needed',
      title: 'The private comparison needs creative review',
      summary: `${accepted} of 5 scenarios are accepted. Review the remaining visual behavior before any project-wide routing can be locked.`,
      nextAction: { kind: 'continue_in_chat', label: 'Review the comparison in Chat' },
    },
    blocked: {
      statusLabel: 'Needs attention',
      title: 'Calibration cannot advance safely',
      summary: 'A private attempt, QA result, cost record, or routing result is incomplete or inconsistent. No production-scale routing was approved.',
      nextAction: { kind: 'request_recovery_in_chat', label: 'Resolve the issue in Chat' },
    },
    approved_locked: {
      statusLabel: 'Approved routing',
      title: `${name} passed the five-scene calibration`,
      summary: 'All five scenario decisions are accepted and locked to the approved project version. Changing the direction requires a new plan and estimate.',
      nextAction: { kind: 'request_revision_in_chat', label: 'Request a calibration change in Chat' },
    },
  }
  return content[state]
}

function calibrationReview(input: Pick<StorytellingStyleCalibrationReviewDto,
  'state' | 'selectedStyleDisplayName' | 'statusLabel' | 'title' | 'summary' | 'scenarios' | 'nextAction'> &
  Partial<Pick<StorytellingStyleCalibrationReviewDto, 'currentScenarioKind'>>): StorytellingStyleCalibrationReviewDto {
  const { selectedStyleDisplayName, currentScenarioKind, ...required } = input
  const scenarios = required.scenarios
  return deepFreeze(storytellingStyleCalibrationReviewDtoSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_CALIBRATION_REVIEW_VERSION,
    ...required,
    ...(selectedStyleDisplayName ? { selectedStyleDisplayName } : {}),
    ...(currentScenarioKind ? { currentScenarioKind } : {}),
    completedScenarioCount: scenarios.filter((scenario) => [
      'ready_for_review', 'accepted', 'needs_attention',
    ].includes(scenario.status)).length,
    acceptedScenarioCount: scenarios.filter((scenario) => scenario.status === 'accepted').length,
    needsAttentionCount: scenarios.filter((scenario) => scenario.status === 'needs_attention').length,
    decisionAuthority: 'existing_chat_and_plan_review',
    privateReviewOnly: true,
    automaticSelectionAllowed: false,
    approvedPlanMutationAllowed: false,
    readOnly: true,
    runtimeExecutionAuthorized: false,
    notice,
  }))
}

function assertExactPlan(
  plan: StyleCalibrationPlan,
  decision: StorytellingMotionStyleDecisionDto,
  identity: ExactCalibrationIdentity,
): void {
  if (!verifyStorytellingStyleAuthorityDigest(plan) || plan.projectId !== identity.projectId ||
      plan.editSessionId !== identity.editSessionId || plan.productionId !== identity.productionId ||
      !decision.selectedStyleProfileId || decision.selectedStyleProfileId !== plan.styleProfile.styleProfileId) {
    throw new Error('Style calibration plan does not match this exact project, named edit, production, and direction.')
  }
  const approval = plan.approvalAuthority
  if (approval.state === 'approved_bounded_execution' &&
      (!approval.approvedPlanSnapshotId || !approval.approvedPlanSnapshotDigest ||
       !approval.approvedEstimateId || !approval.approvedEstimateDigest ||
       approval.maximumAuthorizedInternalCostMicros === undefined)) {
    throw new Error('Approved calibration plan is missing exact snapshot, estimate, or cost authority.')
  }
}

function scenarioStatusLabel(status: StorytellingStyleCalibrationScenarioDto['status']): string {
  const labels: Record<StorytellingStyleCalibrationScenarioDto['status'], string> = {
    not_started: 'Not started',
    preparing: 'Preparing',
    ready_for_review: 'Ready for review',
    accepted: 'Accepted',
    needs_attention: 'Needs attention',
    stale: 'New plan required',
  }
  return labels[status]
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
