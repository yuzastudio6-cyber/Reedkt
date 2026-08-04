import type {
  ProjectVideoRoutingProfile,
  StorytellingMotionStyleProfile,
  StorytellingMotionStyleSelection,
  StorytellingStyleSourceAudit,
  StyleCalibrationPlan,
  StyleCalibrationReel,
  StyleCalibrationRouteDecision,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION,
  MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION,
} from '../../../src/types/motion-studio'
import {
  ALL_STYLE_CALIBRATION_SCENARIOS,
  projectVideoRoutingProfileSchema,
  storytellingMotionStyleSelectionSchema,
  storytellingStyleSourceAuditSchema,
  styleCalibrationPlanSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from './catalog'
import { verifyStyleCalibrationReelDigest } from './calibration-evidence'

type StyleSourceAuditDraft = Omit<StorytellingStyleSourceAudit,
  'schemaVersion' | 'auditDigest' | 'immutable' |
  'trustStatus' | 'executableInstructionsAllowed' | 'exactPromptBundlingAllowed' |
  'providerPresetOrJobIdentityAdopted' | 'originalAssetBundlingAllowed' | 'disposition'>

type StyleSelectionDraft = Omit<StorytellingMotionStyleSelection,
  'schemaVersion' | 'selectionDigest' | 'runtimeExecutionAuthorized' | 'immutable'>

type StyleCalibrationPlanDraft = Omit<StyleCalibrationPlan,
  'schemaVersion' | 'planDigest' | 'automaticFallbackAllowed' |
  'fallbackRequiresNewApproval' | 'bulkGenerationAllowed' | 'immutable'>

type ProjectVideoRoutingProfileDraft = Omit<ProjectVideoRoutingProfile,
  'schemaVersion' | 'profileDigest' | 'allRequiredScenariosAccepted' |
  'bulkGenerationAllowed' | 'automaticFallbackAllowed' |
  'fallbackRequiresNewApproval' | 'normalUserUiExposesProviderInternals' |
  'runtimeExecutionAuthorized' | 'approvedPlanSnapshotId' |
  'approvedPlanSnapshotDigest' | 'calibrationReelDigest' | 'decisions' | 'immutable'>

export function createStorytellingStyleSourceAudit(
  input: StyleSourceAuditDraft,
): StorytellingStyleSourceAudit {
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION,
    ...input,
    trustStatus: 'untrusted_reference' as const,
    executableInstructionsAllowed: false as const,
    exactPromptBundlingAllowed: false as const,
    providerPresetOrJobIdentityAdopted: false as const,
    originalAssetBundlingAllowed: false as const,
    disposition: 'reference_only_generalized_grammar' as const,
    immutable: true as const,
  }
  return parseAndFreeze(storytellingStyleSourceAuditSchema, {
    ...base,
    auditDigest: sha256CanonicalJson(base),
  })
}

export function createStorytellingMotionStyleSelection(
  input: StyleSelectionDraft,
): StorytellingMotionStyleSelection {
  const profile = getStorytellingMotionStyleProfile(input.styleProfile.styleProfileId)
  assertExactProfileReference(profile, input.styleProfile)
  if (sha256CanonicalJson(input.motionLanguage) !== sha256CanonicalJson(profile.motionLanguage)) {
    throw new Error('Storytelling style selection Motion Language does not match the exact style profile.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION,
    ...input,
    runtimeExecutionAuthorized: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(storytellingMotionStyleSelectionSchema, {
    ...base,
    selectionDigest: sha256CanonicalJson(base),
  })
}

export function createStyleCalibrationPlan(
  input: StyleCalibrationPlanDraft,
  selection: StorytellingMotionStyleSelection,
): StyleCalibrationPlan {
  assertOwnDigest(selection, 'selectionDigest', 'Storytelling style selection')
  assertSameOwnership(input, selection, 'Style Calibration Plan')
  if (input.productionId !== selection.productionId) {
    throw new Error('Style Calibration Plan must preserve the exact Storytelling production identity.')
  }
  if (input.styleSelectionDigest !== selection.selectionDigest) {
    throw new Error('Style Calibration Plan must bind the exact style selection digest.')
  }
  if (sha256CanonicalJson(input.styleProfile) !== sha256CanonicalJson(selection.styleProfile) ||
      sha256CanonicalJson(input.motionLanguage) !== sha256CanonicalJson(selection.motionLanguage) ||
      sha256CanonicalJson(input.motionDnaVersion) !== sha256CanonicalJson(selection.motionDnaVersion)) {
    throw new Error('Style Calibration Plan changed its style, Motion Language, or Motion DNA authority.')
  }
  if (input.approvalAuthority.state === 'approved_bounded_execution') {
    if (selection.state !== 'approved_snapshot_bound') {
      throw new Error('Bounded style calibration requires an approved-snapshot-bound style selection.')
    }
    if (input.approvalAuthority.approvedPlanSnapshotId !== selection.approvedPlanSnapshotId ||
        input.approvalAuthority.approvedPlanSnapshotDigest !== selection.approvedPlanSnapshotDigest) {
      throw new Error('Bounded style calibration must bind the style selection exact approved snapshot.')
    }
  }
  const base = {
    schemaVersion: MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION,
    ...input,
    automaticFallbackAllowed: false as const,
    fallbackRequiresNewApproval: true as const,
    bulkGenerationAllowed: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(styleCalibrationPlanSchema, {
    ...base,
    planDigest: sha256CanonicalJson(base),
  })
}

export function createProjectVideoRoutingProfile(
  input: ProjectVideoRoutingProfileDraft,
  plan: StyleCalibrationPlan,
  reel: StyleCalibrationReel,
): ProjectVideoRoutingProfile {
  assertOwnDigest(plan, 'planDigest', 'Style Calibration Plan')
  if (!verifyStyleCalibrationReelDigest(reel)) {
    throw new Error('Project Video Routing Profile requires an immutable verified Style Calibration Reel.')
  }
  assertSameOwnership(input, plan, 'Project Video Routing Profile')
  assertSameOwnership(reel, plan, 'Project Video Routing Profile Calibration Reel')
  if (input.productionId !== plan.productionId) {
    throw new Error('Project Video Routing Profile must preserve the exact Storytelling production identity.')
  }
  if (reel.productionId !== plan.productionId || reel.calibrationPlanDigest !== plan.planDigest) {
    throw new Error('Project Video Routing Profile Calibration Reel changed production or plan authority.')
  }
  if (input.calibrationPlanDigest !== plan.planDigest ||
      sha256CanonicalJson(input.styleProfile) !== sha256CanonicalJson(plan.styleProfile) ||
      sha256CanonicalJson(input.motionDnaVersion) !== sha256CanonicalJson(plan.motionDnaVersion) ||
      input.routePolicyId !== plan.routePolicy.policyId) {
    throw new Error('Project Video Routing Profile changed its calibration or routing authority.')
  }
  const expectedRoutePolicyDigest = sha256CanonicalJson(plan.routePolicy)
  if (input.routePolicyDigest !== expectedRoutePolicyDigest) {
    throw new Error('Project Video Routing Profile route policy digest does not match the calibration plan.')
  }
  validateRouteDecisions(reel.decisions, plan)
  const accepted = new Set(reel.decisions
    .filter((decision) => decision.technicalQaStatus === 'passed' && decision.creativeDecision === 'accepted')
    .map((decision) => decision.scenarioKind))
  const allRequiredScenariosAccepted = ALL_STYLE_CALIBRATION_SCENARIOS.every((kind) => accepted.has(kind))
  const approvedCalibrationAuthority = plan.approvalAuthority.state === 'approved_bounded_execution'
  if (input.state === 'approved' && (!approvedCalibrationAuthority ||
      reel.state !== 'approved' || !reel.productionScaleRoutingApproved)) {
    throw new Error('Approved project video routing requires an approved evidence-backed Style Calibration Reel.')
  }
  const attemptCostMicros = reel.totalActualInternalProductionCostMicros
  const maximumAuthorizedCostMicros = plan.approvalAuthority.maximumAuthorizedInternalCostMicros
  if (input.state === 'approved' &&
      (maximumAuthorizedCostMicros === undefined || attemptCostMicros > maximumAuthorizedCostMicros)) {
    throw new Error('Approved project video routing exceeds the Style Calibration Plan internal-cost authority.')
  }
  const bulkGenerationAllowed = input.state === 'approved' &&
    allRequiredScenariosAccepted && approvedCalibrationAuthority && reel.productionScaleRoutingApproved
  const approvedSnapshotAuthority = approvedCalibrationAuthority
    ? {
        approvedPlanSnapshotId: plan.approvalAuthority.approvedPlanSnapshotId,
        approvedPlanSnapshotDigest: plan.approvalAuthority.approvedPlanSnapshotDigest,
      }
    : {}
  const base = {
    schemaVersion: MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION,
    ...input,
    ...approvedSnapshotAuthority,
    calibrationReelDigest: reel.reelDigest,
    decisions: reel.decisions,
    allRequiredScenariosAccepted,
    bulkGenerationAllowed,
    automaticFallbackAllowed: false as const,
    fallbackRequiresNewApproval: true as const,
    normalUserUiExposesProviderInternals: false as const,
    runtimeExecutionAuthorized: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(projectVideoRoutingProfileSchema, {
    ...base,
    profileDigest: sha256CanonicalJson(base),
  })
}

export function verifyStorytellingStyleAuthorityDigest(
  value: StorytellingMotionStyleProfile | StorytellingStyleSourceAudit | StorytellingMotionStyleSelection |
  StyleCalibrationPlan | ProjectVideoRoutingProfile,
): boolean {
  if ('contentDigest' in value) return ownDigest(value, 'contentDigest') === value.contentDigest
  if ('auditDigest' in value) return ownDigest(value, 'auditDigest') === value.auditDigest
  if ('selectionDigest' in value) return ownDigest(value, 'selectionDigest') === value.selectionDigest
  if ('planDigest' in value) return ownDigest(value, 'planDigest') === value.planDigest
  return ownDigest(value, 'profileDigest') === value.profileDigest
}

function validateRouteDecisions(
  decisions: readonly StyleCalibrationRouteDecision[],
  plan: StyleCalibrationPlan,
): void {
  const scenarios = new Map(plan.scenarios.map((scenario) => [scenario.kind, scenario]))
  const admittedVideoRoutes = new Set<string>(
    plan.routePolicy.candidates.map((candidate) => candidate.providerRoute),
  )
  for (const decision of decisions) {
    const scenario = scenarios.get(decision.scenarioKind)
    if (!scenario) throw new Error(`Routing decision references an unknown calibration scenario: ${decision.scenarioKind}`)
    if (decision.productionMode !== scenario.productionMode) {
      throw new Error(`Routing decision changed the approved production mode for ${decision.scenarioKind}.`)
    }
    if (scenario.deterministicTextDataRequired) {
      if (decision.routeCandidateId !== 'deterministic_reeditpro_composition') {
        throw new Error('Exact text/data calibration must use deterministic ReEditPro composition.')
      }
    } else if (scenario.requiresGeneratedMedia && !admittedVideoRoutes.has(decision.routeCandidateId)) {
      throw new Error(`Generated calibration decision uses a route outside the approved route policy: ${decision.routeCandidateId}`)
    }
  }
}

function assertExactProfileReference(
  profile: ReturnType<typeof getStorytellingMotionStyleProfile>,
  reference: StorytellingMotionStyleSelection['styleProfile'],
): void {
  const expected = storytellingMotionStyleProfileReference(profile)
  if (sha256CanonicalJson(expected) !== sha256CanonicalJson(reference)) {
    throw new Error('Storytelling style profile reference is stale or does not match the system catalog.')
  }
}

function assertSameOwnership(
  candidate: { workspaceId: string; projectId: string; editSessionId: string },
  authority: { workspaceId: string; projectId: string; editSessionId: string },
  label: string,
): void {
  if (candidate.workspaceId !== authority.workspaceId ||
      candidate.projectId !== authority.projectId ||
      candidate.editSessionId !== authority.editSessionId) {
    throw new Error(`${label} must preserve the exact workspace, project, and edit identity.`)
  }
}

function assertOwnDigest<T extends object, K extends keyof T>(value: T, key: K, label: string): void {
  if (ownDigest(value, key) !== value[key]) throw new Error(`${label} digest verification failed.`)
}

function ownDigest<T extends object, K extends keyof T>(value: T, key: K): string {
  const base = { ...value }
  delete base[key]
  return sha256CanonicalJson(base)
}

function parseAndFreeze<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  return deepFreeze(schema.parse(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
