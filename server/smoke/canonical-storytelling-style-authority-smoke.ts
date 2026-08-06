import assert from 'node:assert/strict'
import {
  projectCanonicalStorytellingStyleAuthority,
  type CanonicalStorytellingStylePlanReviewSource,
} from '../../src/lib/canonical-planning-draft'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  canonicalStorytellingStyleAuthorityMatchesScope,
  canonicalStorytellingStyleAuthoritySchema,
} from '../validation/canonical-storytelling-style-authority-schemas'

const sha = (character: string) => character.repeat(64)

const source: CanonicalStorytellingStylePlanReviewSource = {
  schemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1',
  workspaceId: 'workspace-storytelling-style',
  projectId: 'project-storytelling-style',
  editSessionId: 'edit-storytelling-style',
  productionId: 'production-storytelling-style',
  styleSelection: {
    schemaVersion: 'motion-studio.storytelling-style-selection.v1',
    id: 'style-selection-editorial-collage-v1',
    state: 'selected_for_plan',
    selectionDigest: sha('1'),
    styleProfile: {
      styleProfileId: 'storytelling_style.editorial_collage',
      styleProfileVersion: '1.0.0',
      styleProfileDigest: sha('2'),
    },
    motionLanguage: {
      motionLanguageId: 'motion-language-editorial-collage',
      motionLanguageVersion: '1.0.0',
      motionLanguageDigest: sha('3'),
    },
    motionDnaVersion: {
      artifactId: 'motion-dna-editorial-collage',
      versionId: 'motion-dna-editorial-collage-v1',
      versionNumber: 1,
      contentDigest: sha('4'),
    },
    referenceContractVersions: [{
      artifactId: 'reference-contract-owner-style',
      versionId: 'reference-contract-owner-style-v1',
      versionNumber: 1,
      contentDigest: sha('5'),
    }],
    sourceAuditDigests: [sha('6')],
  },
  calibrationPlan: {
    schemaVersion: 'motion-studio.style-calibration-plan.v1',
    id: 'style-calibration-editorial-collage-v1',
    planDigest: sha('7'),
    styleSelectionDigest: sha('1'),
    routePolicy: { policyId: 'motion_studio_generation_route_policy_v2' },
    scenarios: [
      { id: 'scenario-style-led-motion', kind: 'style_led_motion' },
      { id: 'scenario-character-continuity', kind: 'character_continuity' },
      { id: 'scenario-first-last-frame', kind: 'strict_first_last_frame' },
      { id: 'scenario-reference-heavy', kind: 'reference_heavy' },
      { id: 'scenario-exact-text-data', kind: 'exact_text_data' },
    ],
    estimatedInternalCostRangeMicros: { minimum: 125_000, maximum: 625_000 },
    approvalAuthority: { state: 'planning_only' },
    automaticFallbackAllowed: false,
    fallbackRequiresNewApproval: true,
    bulkGenerationAllowed: false,
  },
  internalCostEstimateId: 'style-internal-cost-estimate-editorial-collage-v1',
  internalCostEstimateDigest: sha('8'),
  internalCostEnvelopeIncludedInPlanReview: true,
  customerPricingCalculatedHere: false,
  customerCreditsMutated: false,
  decisionAuthority: 'existing_plan_review',
  runtimeExecutionAuthorized: false,
  immutable: true,
}

const projected = projectCanonicalStorytellingStyleAuthority(source)
const parsed = canonicalStorytellingStyleAuthoritySchema.parse(projected)
assert.deepEqual(parsed, projected)
assert.equal(parsed.styleSelection.motionDnaVersion.versionId, 'motion-dna-editorial-collage-v1')
assert.equal(parsed.styleSelection.referenceContractVersions.length, 1)
assert.equal(parsed.calibrationPlan.scenarioKinds.length, 5)
assert.equal(parsed.internalCostEnvelope.unit, 'usd_micros')
assert.equal(parsed.internalCostEnvelope.internalProductionCostOnly, true)
assert.equal(parsed.internalCostEnvelope.customerPriceIncluded, false)
assert.equal(parsed.internalCostEnvelope.customerCreditsIncluded, false)
assert.equal(parsed.internalCostEnvelope.serviceFeeIncluded, false)
assert.equal(parsed.planReviewIsSoleApprovalAuthority, true)
assert.equal(parsed.runtimeExecutionAuthorized, false)
assert.equal(parsed.providerExecutionAuthorized, false)
assert.equal(parsed.productionReady, false)
assert.equal(parsed.sourceRepositoryReverified, false)
assert.equal(canonicalStorytellingStyleAuthorityMatchesScope(parsed, {
  workspaceId: source.workspaceId,
  projectId: source.projectId,
  editSessionId: source.editSessionId,
}), true)
assert.equal(canonicalStorytellingStyleAuthorityMatchesScope(parsed, {
  workspaceId: source.workspaceId,
  projectId: 'project-substituted',
  editSessionId: source.editSessionId,
}), false)

const exactHash = sha256AuthorityValue(parsed)
assert.match(exactHash, /^[a-f0-9]{64}$/)
assert.equal(sha256AuthorityValue(projectCanonicalStorytellingStyleAuthority(source)), exactHash)
const changedStyle = structuredClone(source)
changedStyle.styleSelection.selectionDigest = sha('9')
changedStyle.calibrationPlan.styleSelectionDigest = sha('9')
assert.notEqual(
  sha256AuthorityValue(projectCanonicalStorytellingStyleAuthority(changedStyle)),
  exactHash,
  'A changed style selection must create a fresh canonical plan-component identity.',
)
const unselectedSource = structuredClone(source)
unselectedSource.styleSelection.state = 'draft'
assert.throws(
  () => projectCanonicalStorytellingStyleAuthority(unselectedSource),
  /planning-only Plan Review input/,
)
const alreadyApprovedSource = structuredClone(source)
alreadyApprovedSource.calibrationPlan.approvalAuthority.state = 'approved_bounded_execution'
assert.throws(
  () => projectCanonicalStorytellingStyleAuthority(alreadyApprovedSource),
  /planning-only Plan Review input/,
)

assertRejected({
  ...projected,
  calibrationPlan: { ...projected.calibrationPlan, styleSelectionDigest: sha('a') },
}, 'mismatched style-selection lineage')
assertRejected({
  ...projected,
  calibrationPlan: {
    ...projected.calibrationPlan,
    scenarioKinds: [
      'style_led_motion',
      'character_continuity',
      'strict_first_last_frame',
      'reference_heavy',
      'reference_heavy',
    ],
  },
}, 'incomplete calibration scenario authority')
assertRejected({
  ...projected,
  internalCostEnvelope: {
    ...projected.internalCostEnvelope,
    maximumEstimatedInternalProductionCostMicros: 625_001,
  },
}, 'cost-envelope substitution')
assertRejected({
  ...projected,
  internalCostEnvelope: {
    ...projected.internalCostEnvelope,
    customerPriceIncluded: true,
  },
}, 'customer-price conflation')
assertRejected({ ...projected, providerUrl: 'https://provider.invalid/private' }, 'unknown provider field')
const noExternalSourceAudit = structuredClone(projected)
noExternalSourceAudit.styleSelection.sourceAuditDigests = []
assert.equal(
  canonicalStorytellingStyleAuthoritySchema.safeParse(noExternalSourceAudit).success,
  true,
  'A native style with no external reference source must preserve an exact empty source-audit set.',
)

const serialized = JSON.stringify(parsed)
for (const forbidden of [
  'providerUrl', 'signedUrl', 'credential', 'requestBody', 'customerPriceMicros',
  'creditAmount', 'serviceFeeMicros', 'localPath',
]) {
  assert.equal(serialized.includes(forbidden), false, `${forbidden} must stay outside the component.`)
}

console.log(JSON.stringify({
  schemaVersion: parsed.schemaVersion,
  componentKey: 'motionStudioStorytellingStyleAuthority',
  componentHash: exactHash,
  scenarioCount: parsed.calibrationPlan.scenarioIds.length,
  referenceContractVersionCount: parsed.styleSelection.referenceContractVersions.length,
  sourceAuditDigestCount: parsed.styleSelection.sourceAuditDigests.length,
  evidenceClass: parsed.evidenceClass,
  productionReady: parsed.productionReady,
  checks: [
    'motion_style_projection_is_deterministic',
    'exact_workspace_project_edit_production_identity',
    'style_profile_language_dna_reference_and_source_audit_lineage',
    'five_scenario_calibration_authority',
    'internal_cost_separate_from_customer_commercial_authority',
    'changed_style_changes_component_identity',
    'non_selected_or_already_approved_source_fails_projection',
    'tamper_and_unknown_fields_fail_closed',
    'empty_external_source_audit_set_remains_explicit',
  ],
}))

function assertRejected(value: unknown, label: string): void {
  assert.equal(
    canonicalStorytellingStyleAuthoritySchema.safeParse(value).success,
    false,
    `${label} must fail closed.`,
  )
}
