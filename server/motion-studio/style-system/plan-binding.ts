import type { ApprovedPlanSnapshot } from '../../../src/types/edit-planning-db'
import type {
  MotionStudioArtifactKind,
  MotionStudioVersionReference,
  StorytellingMotionStyleChangeImpact,
  StorytellingMotionStylePlanBinding,
  StorytellingMotionStylePlanReviewInput,
  StorytellingMotionStyleSelection,
  StorytellingStyleArtifactImpactDisposition,
  StyleCalibrationPlan,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION,
  MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  storytellingMotionStyleChangeImpactSchema,
  storytellingMotionStylePlanBindingSchema,
  storytellingMotionStylePlanReviewInputSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  createStorytellingMotionStyleSelection,
  createStyleCalibrationPlan,
  verifyStorytellingStyleAuthorityDigest,
} from './authority'

type CurrentArtifactVersion = {
  artifactKind: MotionStudioArtifactKind
  artifactVersion: MotionStudioVersionReference
}

type CreatePlanReviewInput = {
  styleSelection: StorytellingMotionStyleSelection
  calibrationPlan: StyleCalibrationPlan
}

type CreateChangeImpactInput = {
  priorBinding: StorytellingMotionStylePlanBinding
  approvedPlanSnapshot: ApprovedPlanSnapshot
  proposedStyleSelection: StorytellingMotionStyleSelection
  currentArtifactVersions: readonly CurrentArtifactVersion[]
}

type ImpactRule = {
  disposition: StorytellingStyleArtifactImpactDisposition
  reason: string
}

const STYLE_CHANGE_IMPACT_POLICY: Readonly<Record<MotionStudioArtifactKind, ImpactRule>> = deepFreeze({
  production_brief: preserve('The approved story request remains source authority.'),
  story_bible: preserve('The story, audience, and narrative intent remain valid.'),
  prepared_script: preserve('A visual style change does not rewrite approved narration by itself.'),
  research_pack: preserve('Research evidence remains valid and source-traceable.'),
  claim_ledger: preserve('Claims and their evidence classifications remain unchanged.'),
  visual_coverage_plan: review('Coverage and asset needs must be checked against the new visual grammar.'),
  reference_contract: preserve('Reference contracts remain bounded input evidence, not style output.'),
  motion_dna: rebuild('Motion DNA is the exact changed style authority.'),
  motion_language: rebuild('Motion Language must match the newly selected style profile.'),
  narrative_function: preserve('Narrative purpose remains separate from visual construction.'),
  motion_strategy: rebuild('Production strategy must be recompiled from the new Motion DNA.'),
  voice_bible: preserve('Narration authority remains usable unless a separate performance change is requested.'),
  music_bible: review('Music direction may need to align with the new material and motion grammar.'),
  cue_sheet: review('Cue timing and emphasis must be checked against revised visual beats.'),
  scene_graph: preserve('Scene narrative structure remains valid unless separately revised.'),
  scene_recipe: rebuild('Every Scene Recipe must bind the new Motion Language and Motion DNA.'),
  layer_plan: rebuild('Layer construction is derived from the selected style recipe.'),
  scene_document: rebuild('Scene construction and exact production routes become stale.'),
  sound_event_plan: review('Visible-action sound cues must be checked against rebuilt scenes.'),
  storyboard: rebuild('Storyboard frames must show the newly approved visual direction.'),
  animatic: rebuild('The animatic must reflect rebuilt boards, layers, and motion timing.'),
  fine_cut: rebuild('The current cut cannot remain approved over stale scene outputs.'),
  quality_report: rebuild('Quality evidence must be rerun against the replacement production.'),
  export_manifest: rebuild('Delivery authority cannot point to stale visual outputs.'),
})

/**
 * Creates the Motion-owned payload embedded in the existing Plan Review. This
 * performs no approval, provider call, generation, render, charge, or credit
 * mutation.
 */
export function createStorytellingMotionStylePlanReviewInput(
  input: CreatePlanReviewInput,
): StorytellingMotionStylePlanReviewInput {
  const { calibrationPlan, styleSelection } = input
  assertAuthorityDigest(styleSelection, 'Style selection')
  assertAuthorityDigest(calibrationPlan, 'Style Calibration Plan')
  if (styleSelection.state !== 'selected_for_plan') {
    throw new Error('Storytelling style must be selected for the existing Plan Review.')
  }
  if (calibrationPlan.approvalAuthority.state !== 'planning_only') {
    throw new Error('Storytelling calibration must remain planning-only before Plan Review approval.')
  }
  assertSameProduction(styleSelection, calibrationPlan, 'Style Plan Review')
  if (calibrationPlan.styleSelectionDigest !== styleSelection.selectionDigest) {
    throw new Error('Storytelling calibration does not bind the exact style selection.')
  }
  const estimateDigest = internalCostEstimateDigest(styleSelection, calibrationPlan)
  return parseAndFreeze(storytellingMotionStylePlanReviewInputSchema, {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION,
    workspaceId: styleSelection.workspaceId,
    projectId: styleSelection.projectId,
    editSessionId: styleSelection.editSessionId,
    productionId: styleSelection.productionId,
    styleSelection,
    calibrationPlan,
    internalCostEstimateId: derivedId('style-internal-cost-estimate', estimateDigest),
    internalCostEstimateDigest: estimateDigest,
    internalCostEnvelopeIncludedInPlanReview: true,
    customerPricingCalculatedHere: false,
    customerCreditsMutated: false,
    decisionAuthority: 'existing_plan_review',
    runtimeExecutionAuthorized: false,
    immutable: true,
  })
}

/**
 * Derives exact post-approval style authority from the one canonical approved
 * plan snapshot. The returned calibration is cost-bounded but still cannot
 * dispatch work without the canonical execution spine.
 */
export function bindStorytellingMotionStylePlanToApprovedSnapshot(
  snapshot: ApprovedPlanSnapshot,
): StorytellingMotionStylePlanBinding {
  const reviewInput = snapshot.motionStudioStorytellingStylePlan
  if (!reviewInput) throw new Error('Approved plan snapshot does not contain a Storytelling motion style decision.')
  const parsed = storytellingMotionStylePlanReviewInputSchema.parse(reviewInput)
  assertAuthorityDigest(parsed.styleSelection, 'Snapshot style selection')
  assertAuthorityDigest(parsed.calibrationPlan, 'Snapshot Style Calibration Plan')
  const expectedInternalCostEstimateDigest = internalCostEstimateDigest(
    parsed.styleSelection,
    parsed.calibrationPlan,
  )
  if (parsed.internalCostEstimateDigest !== expectedInternalCostEstimateDigest ||
      parsed.internalCostEstimateId !== derivedId('style-internal-cost-estimate', expectedInternalCostEstimateDigest)) {
    throw new Error('Snapshot Storytelling internal-cost estimate does not match the exact style calibration plan.')
  }
  if (parsed.projectId !== snapshot.projectId || parsed.editSessionId !== snapshot.editSessionId) {
    throw new Error('Approved Storytelling style decision does not match the snapshot project and named edit.')
  }
  if (snapshot.editPlanVersionId !== snapshot.editPlanVersion.id ||
      snapshot.creditEstimateId !== snapshot.creditEstimate.id) {
    throw new Error('Approved plan snapshot edit-plan or credit-estimate identity is inconsistent.')
  }

  const approvedPlanSnapshotDigest = sha256CanonicalJson(snapshot)
  const approvedCreditEstimateDigest = sha256CanonicalJson(snapshot.creditEstimate)
  const approvedStyleSelection = createStorytellingMotionStyleSelection({
    workspaceId: parsed.workspaceId,
    projectId: parsed.projectId,
    editSessionId: parsed.editSessionId,
    id: derivedId('style-selection-approved', approvedPlanSnapshotDigest),
    productionId: parsed.productionId,
    styleProfile: parsed.styleSelection.styleProfile,
    motionLanguage: parsed.styleSelection.motionLanguage,
    motionDnaVersion: parsed.styleSelection.motionDnaVersion,
    referenceContractVersions: parsed.styleSelection.referenceContractVersions,
    sourceAuditDigests: parsed.styleSelection.sourceAuditDigests,
    selectionOrigin: parsed.styleSelection.selectionOrigin,
    matchedInputAliases: parsed.styleSelection.matchedInputAliases,
    customizationNotes: parsed.styleSelection.customizationNotes,
    state: 'approved_snapshot_bound',
    approvedPlanSnapshotId: snapshot.id,
    approvedPlanSnapshotDigest,
  })
  const approvedCalibrationPlan = createStyleCalibrationPlan({
    workspaceId: parsed.workspaceId,
    projectId: parsed.projectId,
    editSessionId: parsed.editSessionId,
    id: derivedId('style-calibration-approved', approvedPlanSnapshotDigest),
    productionId: parsed.productionId,
    styleSelectionDigest: approvedStyleSelection.selectionDigest,
    styleProfile: parsed.calibrationPlan.styleProfile,
    motionLanguage: parsed.calibrationPlan.motionLanguage,
    motionDnaVersion: parsed.calibrationPlan.motionDnaVersion,
    routePolicy: parsed.calibrationPlan.routePolicy,
    scenarios: parsed.calibrationPlan.scenarios,
    estimatedInternalCostRangeMicros: parsed.calibrationPlan.estimatedInternalCostRangeMicros,
    approvalAuthority: {
      state: 'approved_bounded_execution',
      approvedPlanSnapshotId: snapshot.id,
      approvedPlanSnapshotDigest,
      approvedEstimateId: parsed.internalCostEstimateId,
      approvedEstimateDigest: parsed.internalCostEstimateDigest,
      maximumAuthorizedInternalCostMicros: parsed.calibrationPlan.estimatedInternalCostRangeMicros.maximum,
      customerPriceIncluded: false,
      customerCreditsMutated: false,
    },
  }, approvedStyleSelection)
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION,
    workspaceId: parsed.workspaceId,
    projectId: parsed.projectId,
    editSessionId: parsed.editSessionId,
    id: derivedId('style-plan-binding', approvedPlanSnapshotDigest),
    productionId: parsed.productionId,
    approvedPlanSnapshotId: snapshot.id,
    approvedPlanSnapshotDigest,
    approvedEditPlanVersionId: snapshot.editPlanVersionId,
    approvedCreditEstimateId: snapshot.creditEstimateId,
    approvedCreditEstimateDigest,
    approvedInternalCostEstimateId: parsed.internalCostEstimateId,
    approvedInternalCostEstimateDigest: parsed.internalCostEstimateDigest,
    preApprovalSelectionDigest: parsed.styleSelection.selectionDigest,
    approvedStyleSelection,
    approvedCalibrationPlan,
    decisionAuthority: 'existing_plan_review' as const,
    approvalState: 'approved_locked' as const,
    previousApprovedSnapshotRemainsImmutable: true as const,
    runtimeExecutionAuthorized: false as const,
    customerPriceCalculatedHere: false as const,
    customerCreditsMutated: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(storytellingMotionStylePlanBindingSchema, {
    ...base,
    bindingDigest: sha256CanonicalJson(base),
  })
}

/**
 * Plans a style revision against exact current artifact versions. It returns
 * append-only stale/rebuild evidence and leaves the prior snapshot untouched.
 */
export function createStorytellingMotionStyleChangeImpact(
  input: CreateChangeImpactInput,
): StorytellingMotionStyleChangeImpact {
  const { approvedPlanSnapshot, currentArtifactVersions, priorBinding, proposedStyleSelection } = input
  if (!verifyStorytellingMotionStylePlanBindingAgainstSnapshot(priorBinding, approvedPlanSnapshot)) {
    throw new Error('Storytelling style plan binding does not match its exact approved snapshot.')
  }
  assertAuthorityDigest(proposedStyleSelection, 'Proposed style selection')
  if (proposedStyleSelection.state !== 'selected_for_plan') {
    throw new Error('A Storytelling style revision must return to selected-for-plan state.')
  }
  assertSameProduction(priorBinding, proposedStyleSelection, 'Storytelling style revision')
  if (proposedStyleSelection.selectionDigest === priorBinding.approvedStyleSelection.selectionDigest) {
    throw new Error('Storytelling style revision must materially differ from the approved selection.')
  }
  if (sameVersion(
    proposedStyleSelection.motionDnaVersion,
    priorBinding.approvedStyleSelection.motionDnaVersion,
  )) {
    throw new Error('Storytelling style revision requires a new exact Motion DNA version.')
  }

  const staleStyleSelection = createStorytellingMotionStyleSelection({
    workspaceId: priorBinding.workspaceId,
    projectId: priorBinding.projectId,
    editSessionId: priorBinding.editSessionId,
    id: derivedId('style-selection-stale', proposedStyleSelection.selectionDigest),
    productionId: priorBinding.productionId,
    styleProfile: priorBinding.approvedStyleSelection.styleProfile,
    motionLanguage: priorBinding.approvedStyleSelection.motionLanguage,
    motionDnaVersion: priorBinding.approvedStyleSelection.motionDnaVersion,
    referenceContractVersions: priorBinding.approvedStyleSelection.referenceContractVersions,
    sourceAuditDigests: priorBinding.approvedStyleSelection.sourceAuditDigests,
    selectionOrigin: priorBinding.approvedStyleSelection.selectionOrigin,
    matchedInputAliases: priorBinding.approvedStyleSelection.matchedInputAliases,
    customizationNotes: priorBinding.approvedStyleSelection.customizationNotes,
    state: 'stale',
    approvedPlanSnapshotId: priorBinding.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: priorBinding.approvedPlanSnapshotDigest,
  })
  const artifactPolicy = MOTION_STUDIO_ARTIFACT_KINDS.map((artifactKind) => ({
    artifactKind,
    ...STYLE_CHANGE_IMPACT_POLICY[artifactKind],
  }))
  const seenVersions = new Set<string>()
  const currentVersionImpacts = currentArtifactVersions.map(({ artifactKind, artifactVersion }) => {
    if (seenVersions.has(artifactVersion.versionId)) {
      throw new Error(`Style change current artifact version is duplicated: ${artifactVersion.versionId}`)
    }
    seenVersions.add(artifactVersion.versionId)
    return {
      artifactKind,
      artifactVersion,
      ...STYLE_CHANGE_IMPACT_POLICY[artifactKind],
    }
  })
  const versionsFor = (disposition: StorytellingStyleArtifactImpactDisposition) => currentVersionImpacts
    .filter((entry) => entry.disposition === disposition)
    .map((entry) => entry.artifactVersion)
  const impactSeed = sha256CanonicalJson({
    priorPlanBindingDigest: priorBinding.bindingDigest,
    proposedStyleSelectionDigest: proposedStyleSelection.selectionDigest,
    currentVersionImpacts,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION,
    workspaceId: priorBinding.workspaceId,
    projectId: priorBinding.projectId,
    editSessionId: priorBinding.editSessionId,
    id: derivedId('style-change-impact', impactSeed),
    productionId: priorBinding.productionId,
    priorPlanBindingDigest: priorBinding.bindingDigest,
    priorApprovedPlanSnapshotId: priorBinding.approvedPlanSnapshotId,
    priorApprovedPlanSnapshotDigest: priorBinding.approvedPlanSnapshotDigest,
    staleStyleSelection,
    proposedStyleSelection,
    artifactPolicy,
    currentVersionImpacts,
    preservedArtifactVersions: versionsFor('preserve'),
    reviewRequiredArtifactVersions: versionsFor('review_required'),
    rebuildRequiredArtifactVersions: versionsFor('rebuild_required'),
    approvalResetRequired: true as const,
    newPlanReviewRequired: true as const,
    newCreditEstimateRequired: true as const,
    providerWorkAuthorized: false as const,
    renderAuthorized: false as const,
    customerCreditsMutated: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(storytellingMotionStyleChangeImpactSchema, {
    ...base,
    impactDigest: sha256CanonicalJson(base),
  })
}

export function verifyStorytellingMotionStylePlanBindingDigest(
  value: StorytellingMotionStylePlanBinding,
): boolean {
  return storytellingMotionStylePlanBindingSchema.safeParse(value).success &&
    ownDigest(value, 'bindingDigest') === value.bindingDigest &&
    verifyStorytellingStyleAuthorityDigest(value.approvedStyleSelection) &&
    verifyStorytellingStyleAuthorityDigest(value.approvedCalibrationPlan)
}

export function verifyStorytellingMotionStylePlanBindingAgainstSnapshot(
  value: StorytellingMotionStylePlanBinding,
  snapshot: ApprovedPlanSnapshot,
): boolean {
  if (!verifyStorytellingMotionStylePlanBindingDigest(value)) return false
  try {
    const expected = bindStorytellingMotionStylePlanToApprovedSnapshot(snapshot)
    return sha256CanonicalJson(expected) === sha256CanonicalJson(value)
  } catch {
    return false
  }
}

export function verifyStorytellingMotionStyleChangeImpactDigest(
  value: StorytellingMotionStyleChangeImpact,
): boolean {
  return storytellingMotionStyleChangeImpactSchema.safeParse(value).success &&
    ownDigest(value, 'impactDigest') === value.impactDigest &&
    verifyStorytellingStyleAuthorityDigest(value.staleStyleSelection) &&
    verifyStorytellingStyleAuthorityDigest(value.proposedStyleSelection)
}

function assertAuthorityDigest(
  value: StorytellingMotionStyleSelection | StyleCalibrationPlan,
  label: string,
): void {
  if (!verifyStorytellingStyleAuthorityDigest(value)) throw new Error(`${label} digest verification failed.`)
}

function ownDigest<T extends object, K extends keyof T>(value: T, key: K): string {
  const base = { ...value }
  delete base[key]
  return sha256CanonicalJson(base)
}

function assertSameProduction(
  left: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
  right: { workspaceId: string; projectId: string; editSessionId: string; productionId: string },
  label: string,
): void {
  if (left.workspaceId !== right.workspaceId || left.projectId !== right.projectId ||
      left.editSessionId !== right.editSessionId || left.productionId !== right.productionId) {
    throw new Error(`${label} must preserve the exact workspace, project, edit, and production identity.`)
  }
}

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function derivedId(prefix: string, digest: string): string {
  return `${prefix}-${digest.slice(0, 24)}`
}

function internalCostEstimateDigest(
  styleSelection: StorytellingMotionStyleSelection,
  calibrationPlan: StyleCalibrationPlan,
): string {
  return sha256CanonicalJson({
    calibrationPlanDigest: calibrationPlan.planDigest,
    styleSelectionDigest: styleSelection.selectionDigest,
    estimatedInternalCostRangeMicros: calibrationPlan.estimatedInternalCostRangeMicros,
    customerPriceIncluded: false,
    customerCreditsMutated: false,
  })
}

function preserve(reason: string): ImpactRule {
  return { disposition: 'preserve', reason }
}

function review(reason: string): ImpactRule {
  return { disposition: 'review_required', reason }
}

function rebuild(reason: string): ImpactRule {
  return { disposition: 'rebuild_required', reason }
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
