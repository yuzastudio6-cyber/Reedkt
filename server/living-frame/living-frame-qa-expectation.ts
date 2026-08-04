import {
  LIVING_FRAME_QA_CODES,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentAssetIntent,
  LivingFrameComponentAssetIntentBundle,
} from '../../src/types/living-frame-component-asset-intent'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import type {
  LivingFrameProjectedQaCode,
  LivingFrameQaEvidenceRequirement,
  LivingFrameQaExpectation,
  LivingFrameQaExpectationAuthorityBoundary,
  LivingFrameQaExpectationBundle,
  LivingFrameQaExpectationBundleDraft,
  LivingFrameQaExpectationMetrics,
  LivingFrameQaExpectationState,
  LivingFrameQaGateExpectation,
  LivingFrameQaScopeKind,
} from '../../src/types/living-frame-qa-expectation'
import {
  LIVING_FRAME_INTEGRATION_QA_CODES,
  LIVING_FRAME_QA_EVIDENCE_REQUIREMENTS,
  LIVING_FRAME_QA_EXPECTATION_CLASS,
  LIVING_FRAME_QA_EXPECTATION_STATES,
  LIVING_FRAME_QA_EXPECTATION_VERSION,
  LIVING_FRAME_QA_GATE_EXPECTATIONS,
  LIVING_FRAME_QA_SCOPE_KINDS,
} from '../../src/types/living-frame-qa-expectation'
import type {
  QACategory,
  SegmentQAPlanItem,
} from '../../src/types/reeditpro'
import {
  verifyLivingFrameComponentAssetIntentBundle,
} from './living-frame-component-asset-intent'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,199}$/
const MAX_EXPECTATIONS = 4_096

const AUTHORITY_BOUNDARY:
  LivingFrameQaExpectationAuthorityBoundary =
  Object.freeze({
    expectationProjectionOnly: true,
    selectedSceneAuthority: false,
    qaPlanAuthority: false,
    qaCheckCreationAuthority: false,
    qaResultAuthority: false,
    artifactQaAuthority: false,
    sourceTruthAuthority: false,
    continuityQaAuthority: false,
    exactFrameAuthority: false,
    masterTimingAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    renderAuthority: false,
    privateReviewAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameQaExpectationsInput {
  readonly semanticPlanProjection:
    LivingFrameSemanticPlanProjection
  readonly componentAssetIntents:
    LivingFrameComponentAssetIntentBundle
}

export async function compileLivingFrameQaExpectations(
  input: CompileLivingFrameQaExpectationsInput,
): Promise<LivingFrameQaExpectationBundle> {
  await assertInput(input)
  const deliberateNonUse =
    input.semanticPlanProjection.projectedComponent
      .decisionSummary.decision === 'non_use'
  const expectations = deliberateNonUse
    ? []
    : compileExpectations(input)
  if (expectations.length > MAX_EXPECTATIONS) {
    throw invalid('Living Frame QA expectation count exceeds bounds.')
  }
  const expectationState: LivingFrameQaExpectationState =
    deliberateNonUse
      ? 'deliberate_non_use'
      : 'candidate_expectations_compiled'
  const draft: LivingFrameQaExpectationBundleDraft = {
    contractVersion: LIVING_FRAME_QA_EXPECTATION_VERSION,
    expectationClass: LIVING_FRAME_QA_EXPECTATION_CLASS,
    expectationState,
    sourceBindings: {
      semanticPlanProjectionDigestSha256:
        input.semanticPlanProjection.projectionDigestSha256,
      projectedComponentDigestSha256:
        input.semanticPlanProjection.projectedComponent
          .contractDigestSha256,
      componentAssetIntentBundleDigestSha256:
        input.componentAssetIntents.bundleDigestSha256,
    },
    expectations,
    metrics: deriveMetrics(expectations),
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingEditQaPlanRemainsAuthority: true,
    existingAgentQaGateSequenceRemainsAuthority: true,
    createsQaChecks: false,
    marksQaChecksPassed: false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false,
    containsProviderModelToolOperationWorkQueueCostOrCommercialRoute:
      false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  }
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameQaExpectationBundle(
  value: unknown,
): value is LivingFrameQaExpectationBundle {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'expectationClass',
      'expectationState',
      'sourceBindings',
      'expectations',
      'metrics',
      'authorityBoundary',
      'existingEditQaPlanRemainsAuthority',
      'existingAgentQaGateSequenceRemainsAuthority',
      'createsQaChecks',
      'marksQaChecksPassed',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderModelToolOperationWorkQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'promotionAllowed',
      'bundleDigestSha256',
    ])) return false
    const bundle =
      value as unknown as LivingFrameQaExpectationBundle
    const { bundleDigestSha256, ...draft } = bundle
    if (
      !SHA256.test(bundleDigestSha256)
      || bundleDigestSha256 !== sha256AuthorityValue(draft)
      || bundle.contractVersion
        !== LIVING_FRAME_QA_EXPECTATION_VERSION
      || bundle.expectationClass
        !== LIVING_FRAME_QA_EXPECTATION_CLASS
      || !LIVING_FRAME_QA_EXPECTATION_STATES.some(
        (state) => state === bundle.expectationState,
      )
      || !validateSourceBindings(bundle.sourceBindings)
      || !validateExpectations(bundle.expectations)
      || stableAuthorityStringify(bundle.metrics)
        !== stableAuthorityStringify(
          deriveMetrics(bundle.expectations),
        )
      || stableAuthorityStringify(bundle.authorityBoundary)
        !== stableAuthorityStringify(AUTHORITY_BOUNDARY)
      || bundle.existingEditQaPlanRemainsAuthority !== true
      || bundle.existingAgentQaGateSequenceRemainsAuthority !== true
      || bundle.createsQaChecks !== false
      || bundle.marksQaChecksPassed !== false
      || bundle
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || bundle
        .containsProviderModelToolOperationWorkQueueCostOrCommercialRoute
        !== false
      || bundle.containsExecutableCodeOrCommands !== false
      || bundle.subjectSpecificRouting !== false
      || bundle.promotionAllowed !== false
    ) return false
    if (bundle.expectationState === 'deliberate_non_use') {
      return bundle.expectations.length === 0
    }
    return bundle.expectations.length > 0
      && hasIntegrationBaseline(bundle.expectations)
  } catch {
    return false
  }
}

async function assertInput(
  input: CompileLivingFrameQaExpectationsInput,
): Promise<void> {
  if (!isRecord(input) || !hasExactKeys(input, [
    'semanticPlanProjection',
    'componentAssetIntents',
  ])) throw invalid('Living Frame QA input shape is invalid.')
  if (!await verifyLivingFrameSemanticPlanProjection(
    input.semanticPlanProjection,
  )) throw invalid('Living Frame QA semantic projection is invalid.')
  if (!verifyLivingFrameComponentAssetIntentBundle(
    input.componentAssetIntents,
  )) throw invalid('Living Frame QA asset-intent bundle is invalid.')
  if (
    input.componentAssetIntents.sourceBindings
      .semanticPlanProjectionDigestSha256
      !== input.semanticPlanProjection.projectionDigestSha256
    || input.componentAssetIntents.sourceBindings
      .projectedComponentDigestSha256
      !== input.semanticPlanProjection.projectedComponent
        .contractDigestSha256
    || (
      input.componentAssetIntents.intentState
        === 'deliberate_non_use'
    ) !== (
      input.semanticPlanProjection.projectedComponent
        .decisionSummary.decision === 'non_use'
    )
  ) throw invalid('Living Frame QA source lineage is inconsistent.')
}

function compileExpectations(
  input: CompileLivingFrameQaExpectationsInput,
): LivingFrameQaExpectation[] {
  const component = input.semanticPlanProjection.projectedComponent
  const drafts: QaDraft[] = []
  for (const qaCode of component.qaExpectationCodes) {
    drafts.push({ qaCode, scopeKind: 'plan' })
  }
  for (const scene of component.scenePlans) {
    for (const qaCode of scene.qaExpectationCodes) {
      drafts.push({
        qaCode,
        scopeKind: 'scene',
        sceneId: scene.sceneId,
      })
    }
    for (const sceneComponent of scene.components) {
      for (const qaCode of sceneComponent.qaExpectationCodes) {
        drafts.push({
          qaCode,
          scopeKind: 'component',
          sceneId: scene.sceneId,
          componentId: sceneComponent.componentId,
        })
      }
    }
    for (const activation of scene.skillActivations) {
      for (const qaCode of activation.qaExpectationCodes) {
        drafts.push({
          qaCode,
          scopeKind: 'scene',
          sceneId: scene.sceneId,
        })
      }
    }
  }
  for (const qaCode of [
    'canonical_selected_scene_revalidation_required',
    'asset_intent_lineage_revalidation_required',
    'canonical_qa_plan_projection_required',
    'no_required_final_placeholder',
  ] as const) {
    drafts.push({ qaCode, scopeKind: 'plan' })
  }
  for (const intent of input.componentAssetIntents.assetIntents) {
    for (const qaCode of assetQaCodes(intent)) {
      drafts.push({
        qaCode,
        scopeKind: 'asset_intent',
        sceneId: intent.sceneId,
        componentId: intent.componentId,
        assetIntentId: intent.assetIntentId,
      })
    }
  }
  const deduplicated = new Map<string, QaDraft>()
  for (const draft of drafts) {
    deduplicated.set(qaDraftKey(draft), draft)
  }
  return [...deduplicated.values()]
    .sort(compareDraft)
    .map((draft, order) => createExpectation(draft, order))
}

interface QaDraft {
  readonly qaCode: LivingFrameProjectedQaCode
  readonly scopeKind: LivingFrameQaScopeKind
  readonly sceneId?: string
  readonly componentId?: string
  readonly assetIntentId?: string
}

function assetQaCodes(
  intent: LivingFrameComponentAssetIntent,
): LivingFrameProjectedQaCode[] {
  switch (intent.assetKind) {
    case 'still_alpha_mask':
    case 'processed_rgba_still_component':
      return ['alpha_multi_background_qa_required']
    case 'temporal_subject_mask_sequence':
      return ['temporal_mask_stability_required']
    case 'exact_map_spec':
      return ['exact_geography_verification_required']
    case 'exact_data_graphic_spec':
      return ['exact_data_verification_required']
    case 'bounded_generated_video_clip':
      return ['generated_video_restraint_required']
    case 'reconstructed_background_plate_png':
      return ['reconstructed_plate_artifact_qa_required']
    default:
      return []
  }
}

function createExpectation(
  draft: QaDraft,
  order: number,
): LivingFrameQaExpectation {
  const policy = qaPolicy(draft.qaCode)
  const identity = {
    qaCode: draft.qaCode,
    scopeKind: draft.scopeKind,
    sceneId: draft.sceneId ?? null,
    componentId: draft.componentId ?? null,
    assetIntentId: draft.assetIntentId ?? null,
  }
  return {
    expectationId:
      `lf-qa.${sha256AuthorityValue(identity).slice(0, 40)}`,
    order,
    ...identity,
    canonicalCategory: policy.category,
    canonicalGateExpectation: policy.gate,
    severityExpectation: policy.severity,
    evidenceRequirement: policy.evidence,
    statusExpectation: 'future_canonical_check_required',
    required: true,
  }
}

function qaPolicy(code: LivingFrameProjectedQaCode): {
  category: QACategory
  gate: LivingFrameQaGateExpectation
  severity: SegmentQAPlanItem['severity']
  evidence: LivingFrameQaEvidenceRequirement
} {
  if (
    code === 'caption_safe_region_expected'
    || code === 'face_safe_region_expected'
    || code === 'gesture_safe_region_expected'
    || code === 'one_focal_primary_expected'
    || code === 'visual_density_restraint_expected'
  ) return policy(
    'frame_layout',
    'preflight_gate',
    'blocking',
    'canonical_plan_structure_revalidation',
  )
  if (
    code === 'narrative_relevance_expected'
    || code === 'generated_video_restraint_required'
  ) return policy(
    'user_intent_match',
    'preflight_gate',
    'blocking',
    'canonical_plan_structure_revalidation',
  )
  if (
    code === 'continuity_comparison_required'
    || code === 'component_separability_required'
    || code === 'alpha_multi_background_qa_required'
    || code === 'temporal_mask_stability_required'
    || code === 'pivot_physics_qa_required'
    || code === 'reconstructed_plate_artifact_qa_required'
  ) return policy(
    'visual_assets',
    'asset_quality_gate',
    'blocking',
    'current_artifact_measurement',
  )
  if (
    code === 'semantic_timing_binding_required'
    || code === 'attention_restoration_required'
  ) return policy(
    'master_timing',
    'render_preflight_gate',
    'blocking',
    'current_timing_or_sound_revalidation',
  )
  if (code === 'narration_protection_required') {
    return policy(
      'sound_sync',
      'final_qa_gate',
      'blocking',
      'current_timing_or_sound_revalidation',
    )
  }
  if (
    code === 'semantic_scale_truth_required'
    || code === 'documentary_integrity_required'
    || code === 'exact_geography_verification_required'
    || code === 'exact_data_verification_required'
  ) return policy(
    'safety_and_claims',
    'asset_quality_gate',
    'blocking',
    'current_source_truth_revalidation',
  )
  if (code === 'asset_intent_lineage_revalidation_required') {
    return policy(
      'async_asset_reconciliation',
      'merge_gate',
      'blocking',
      'approved_work_asset_lineage_revalidation',
    )
  }
  if (
    code === 'no_required_final_placeholder'
  ) return policy(
    'render_composition',
    'render_preflight_gate',
    'blocking',
    'current_destination_composite_review',
  )
  return policy(
    'editing_agent_execution',
    'preflight_gate',
    'blocking',
    'canonical_plan_structure_revalidation',
  )
}

function policy(
  category: QACategory,
  gate: LivingFrameQaGateExpectation,
  severity: SegmentQAPlanItem['severity'],
  evidence: LivingFrameQaEvidenceRequirement,
) {
  return { category, gate, severity, evidence }
}

function validateExpectations(
  expectations: readonly LivingFrameQaExpectation[],
): boolean {
  if (
    !Array.isArray(expectations)
    || expectations.length > MAX_EXPECTATIONS
  ) return false
  const ids = new Set<string>()
  let previousKey: string | null = null
  for (const [index, expectation] of expectations.entries()) {
    const raw: unknown = expectation
    if (!isRecord(raw) || !hasExactKeys(raw, [
      'expectationId',
      'order',
      'qaCode',
      'scopeKind',
      'sceneId',
      'componentId',
      'assetIntentId',
      'canonicalCategory',
      'canonicalGateExpectation',
      'severityExpectation',
      'evidenceRequirement',
      'statusExpectation',
      'required',
    ])) return false
    const policy = qaPolicy(expectation.qaCode)
    const key = expectationSortKey(expectation)
    if (
      !SAFE_ID.test(expectation.expectationId)
      || ids.has(expectation.expectationId)
      || expectation.order !== index
      || !isQaCode(expectation.qaCode)
      || !LIVING_FRAME_QA_SCOPE_KINDS.some(
        (scope) => scope === expectation.scopeKind,
      )
      || !validScope(expectation)
      || !LIVING_FRAME_QA_GATE_EXPECTATIONS.some(
        (gate) =>
          gate === expectation.canonicalGateExpectation,
      )
      || !LIVING_FRAME_QA_EVIDENCE_REQUIREMENTS.some(
        (evidence) =>
          evidence === expectation.evidenceRequirement,
      )
      || expectation.canonicalCategory !== policy.category
      || expectation.canonicalGateExpectation !== policy.gate
      || expectation.severityExpectation !== policy.severity
      || expectation.evidenceRequirement !== policy.evidence
      || expectation.statusExpectation
        !== 'future_canonical_check_required'
      || expectation.required !== true
      || (
        previousKey !== null
        && previousKey.localeCompare(key) >= 0
      )
    ) return false
    ids.add(expectation.expectationId)
    previousKey = key
  }
  return true
}

function validScope(
  expectation: LivingFrameQaExpectation,
): boolean {
  const ids = [
    expectation.sceneId,
    expectation.componentId,
    expectation.assetIntentId,
  ]
  if (!ids.every((id) => id === null || SAFE_ID.test(id))) {
    return false
  }
  switch (expectation.scopeKind) {
    case 'plan':
      return ids.every((id) => id === null)
    case 'scene':
      return expectation.sceneId !== null
        && expectation.componentId === null
        && expectation.assetIntentId === null
    case 'component':
      return expectation.sceneId !== null
        && expectation.componentId !== null
        && expectation.assetIntentId === null
    case 'asset_intent':
      return ids.every((id) => id !== null)
  }
}

function isQaCode(
  code: string,
): code is LivingFrameProjectedQaCode {
  return LIVING_FRAME_QA_CODES.some((value) => value === code)
    || LIVING_FRAME_INTEGRATION_QA_CODES.some(
      (value) => value === code,
    )
}

function hasIntegrationBaseline(
  expectations: readonly LivingFrameQaExpectation[],
): boolean {
  const planCodes = new Set(
    expectations.filter((expectation) =>
      expectation.scopeKind === 'plan')
      .map((expectation) => expectation.qaCode),
  )
  return [
    'canonical_selected_scene_revalidation_required',
    'asset_intent_lineage_revalidation_required',
    'canonical_qa_plan_projection_required',
    'no_required_final_placeholder',
  ].every((code) => planCodes.has(
    code as LivingFrameProjectedQaCode,
  ))
}

function qaDraftKey(draft: QaDraft): string {
  return [
    scopeOrder(draft.scopeKind),
    draft.sceneId ?? '',
    draft.componentId ?? '',
    draft.assetIntentId ?? '',
    draft.qaCode,
  ].join('\u0000')
}

function expectationSortKey(
  expectation: LivingFrameQaExpectation,
): string {
  return [
    scopeOrder(expectation.scopeKind),
    expectation.sceneId ?? '',
    expectation.componentId ?? '',
    expectation.assetIntentId ?? '',
    expectation.qaCode,
  ].join('\u0000')
}

function compareDraft(left: QaDraft, right: QaDraft): number {
  return qaDraftKey(left).localeCompare(qaDraftKey(right))
}

function scopeOrder(scope: LivingFrameQaScopeKind): string {
  return String(
    LIVING_FRAME_QA_SCOPE_KINDS.indexOf(scope),
  ).padStart(2, '0')
}

function deriveMetrics(
  expectations: readonly LivingFrameQaExpectation[],
): LivingFrameQaExpectationMetrics {
  return {
    expectationCount: expectations.length,
    planExpectationCount: countScope(expectations, 'plan'),
    sceneExpectationCount: countScope(expectations, 'scene'),
    componentExpectationCount:
      countScope(expectations, 'component'),
    assetIntentExpectationCount:
      countScope(expectations, 'asset_intent'),
    blockingExpectationCount: expectations.filter(
      (expectation) =>
        expectation.severityExpectation === 'blocking',
    ).length,
    artifactMeasurementExpectationCount: expectations.filter(
      (expectation) =>
        expectation.evidenceRequirement
          === 'current_artifact_measurement',
    ).length,
    sourceTruthExpectationCount: expectations.filter(
      (expectation) =>
        expectation.evidenceRequirement
          === 'current_source_truth_revalidation',
    ).length,
    timingOrSoundExpectationCount: expectations.filter(
      (expectation) =>
        expectation.evidenceRequirement
          === 'current_timing_or_sound_revalidation',
    ).length,
  }
}

function countScope(
  expectations: readonly LivingFrameQaExpectation[],
  scope: LivingFrameQaScopeKind,
): number {
  return expectations.filter((expectation) =>
    expectation.scopeKind === scope).length
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, [
    'semanticPlanProjectionDigestSha256',
    'projectedComponentDigestSha256',
    'componentAssetIntentBundleDigestSha256',
  ]) && Object.values(value).every((entry) =>
    typeof entry === 'string' && SHA256.test(entry))
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return stableAuthorityStringify(Object.keys(value).sort())
    === stableAuthorityStringify([...keys].sort())
}

function invalid(message: string): Error {
  return new Error(message)
}
