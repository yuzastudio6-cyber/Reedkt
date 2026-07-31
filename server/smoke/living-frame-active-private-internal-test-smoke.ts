import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_OPEN_GATE_IDS,
  LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_RUN_IDS,
  LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_VERSION,
  type LivingFrameActivePrivateInternalCaseResult,
  type LivingFrameActivePrivateInternalRunId,
  type LivingFrameActivePrivateInternalRunResult,
  type LivingFrameActivePrivateInternalTestReport,
  type LivingFrameActivePrivateInternalTestReportDraft,
} from '../../src/types/living-frame-active-private-internal-test'
import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV,
} from './living-frame-internal-review-export'

interface RunDefinition {
  readonly runId: LivingFrameActivePrivateInternalRunId
  readonly relativePath: string
  readonly evidenceClass:
    | 'source_contract_regression'
    | 'private_engineering_media_runtime'
  readonly expectedStatus: 'passed' | 'passed_source_only'
  readonly expectedReviewExportCount: number
  readonly validate: (receipt: Record<string, unknown>) => void
}

const repositoryRoot = process.cwd()
const tsxEntrypoint = join(repositoryRoot, 'node_modules', '.bin', 'tsx')
assert.equal(
  existsSync(tsxEntrypoint),
  true,
  'Active Living Frame internal test requires the pinned workspace tsx entrypoint.',
)
const reviewExportRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-active-review-v1-'),
)

const runDefinitions = [
  run(
    'baseline_route_binding',
    'server/smoke/living-frame-active-baseline-route-binding-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.activeCaseCount, 12)
      assert.equal(receipt.approvedFallbackCaseCount, 2)
      assert.equal(receipt.advancedTemporalMaskRouteOpenCaseCount, 2)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  ),
  run(
    'five_mode_private_render',
    'server/smoke/living-frame-five-mode-private-render-smoke.ts',
    'private_engineering_media_runtime',
    'passed',
    1,
    (receipt) => {
      assert.equal(receipt.actualRemotionRuntimeExecuted, true)
      assert.equal(receipt.actualFfprobeRuntimeExecuted, true)
      assert.equal(receipt.captionPlaneObservedAboveEveryMode, true)
      assert.equal(
        (receipt.livingARoll as Record<string, unknown>)
          .temporalMaskInferenceClaimed,
        false,
      )
      assert.equal(
        (receipt.safeSpaceFallback as Record<string, unknown>)
          .negativeSpaceVisualRenderedAndMeasured,
        true,
      )
      const exactMapData =
        receipt.exactMapData as Record<string, unknown>
      assert.equal(
        exactMapData.exactSourceBoundGeometryRenderedAndMeasured,
        true,
      )
      assert.equal(exactMapData.literalScalePreserved, true)
      assert.equal(exactMapData.generatedVideoFallbackUsed, false)
      assert.equal(exactMapData.mapOrDataToolRuntimeClaimed, false)
      assert.equal(exactMapData.canonicalSourceRereadPending, true)
      assert.equal(receipt.productionAuthority, false)
    },
  ),
  run(
    'confirmed_frame_private_render',
    'server/smoke/living-frame-confirmed-ratio-private-render-smoke.ts',
    'private_engineering_media_runtime',
    'passed',
    2,
    (receipt) => {
      assert.equal(receipt.exactConfirmedRatioPreserved, true)
      assert.equal(receipt.squareSubstitutionApplied, false)
      assert.equal(receipt.remotionFinalCanvasOwnerPreserved, true)
      assert.equal(receipt.actualRemotionRuntimeExecuted, true)
      assert.equal(receipt.productionAuthority, false)
    },
  ),
  run(
    'motion_v3_private_render',
    'server/smoke/offline-remotion-living-frame-motion-smoke.ts',
    'private_engineering_media_runtime',
    'passed',
    1,
    (receipt) => {
      assert.equal(receipt.deterministicMotionObserved, true)
      assert.equal(receipt.deepMultiplaneRenderedAndMeasured, true)
      assert.equal(receipt.sourceAttentionAndCameraTracksApplied, true)
      assert.equal(receipt.captionPlaneObservedAboveLivingFrame, true)
      assert.equal(receipt.productionReady, false)
    },
  ),
  run(
    'non_character_content_lineage',
    'server/smoke/living-frame-non-character-content-lineage-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.caseCount, 4)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  ),
  run(
    'selected_scene_environmental_particle',
    'server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts',
    'private_engineering_media_runtime',
    'passed',
    1,
    (receipt) => {
      assert.equal(receipt.actualPackageEntrypointExecuted, true)
      assert.equal(receipt.everyParticleFrameTimeSampled, true)
      assert.equal(receipt.captionPlaneVisibleAboveParticles, true)
      assert.equal(receipt.privateInternalParticleSliceEndToEndPassed, true)
      assert.equal(
        receipt.canonicalPrivateReviewProceduralTimelineExtensionPending,
        true,
      )
      assert.equal(receipt.productionReady, false)
    },
  ),
  run(
    'semantic_sound_timing_reconciliation',
    'server/smoke/living-frame-semantic-sound-timing-reconciliation-smoke.ts',
    'source_contract_regression',
    'passed',
    0,
    (receipt) => {
      assert.equal(receipt.professionalSemanticSoundTimingReady, false)
      assert.equal(receipt.controlledCases, 2)
    },
  ),
  run(
    'representative_visual_fixture_plan',
    'server/smoke/living-frame-representative-visual-fixture-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.activeCaseCount, 12)
      assert.equal(receipt.professionalCheckCount, 13)
      assert.equal(receipt.representativeMediaRequiredForEveryCase, true)
      assert.equal(
        receipt.geometryOnlyProbeMayApproveProfessionalQuality,
        false,
      )
      assert.equal(
        receipt.syntheticRectanglesMayApproveProfessionalQuality,
        false,
      )
      assert.equal(receipt.representativeMediaRuntimeExecuted, false)
      assert.equal(receipt.canonicalConsumptionPending, true)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  ),
  run(
    'non_character_professional_review_contract',
    'server/smoke/living-frame-non-character-professional-review-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.headIntelligenceInspectionRequired, true)
      assert.equal(receipt.technicalMetricsAloneCanApproveVisualQuality, false)
      assert.equal(receipt.pausedAnimationEvidenceUsedForAcceptance, false)
      assert.equal(receipt.canonicalQaApproved, false)
    },
  ),
  run(
    'postrender_visual_inspection_contract',
    'server/smoke/living-frame-postrender-visual-inspection-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.qwenVisualEvidenceOnly, true)
      assert.equal(receipt.separateAudioEvidenceRequired, true)
      assert.equal(receipt.callerAssertionCanApprove, false)
      assert.equal(receipt.professionalReviewInputReady, false)
      assert.equal(receipt.canonicalAdmissionPending, true)
    },
  ),
  run(
    'active_evidence_admission_contract',
    'server/smoke/living-frame-active-non-illustration-evidence-admission-smoke.ts',
    'source_contract_regression',
    'passed_source_only',
    0,
    (receipt) => {
      assert.equal(receipt.activeCaseCount, 12)
      assert.equal(receipt.completeTimeVisualEvidenceRequired, true)
      assert.equal(receipt.separateAudioEvidenceRequired, true)
      assert.equal(receipt.headQaRecommendationRequired, true)
      assert.equal(receipt.canonicalConsumptionPending, true)
      assert.equal(receipt.runtimeExecuted, false)
    },
  ),
] as const satisfies readonly RunDefinition[]

assert.deepEqual(
  runDefinitions.map((definition) => definition.runId),
  LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_RUN_IDS,
)
assert.equal(
  runDefinitions.filter((definition) =>
    definition.evidenceClass === 'private_engineering_media_runtime').length,
  4,
)
assert.equal(
  runDefinitions.reduce(
    (count, definition) =>
      count + definition.expectedReviewExportCount,
    0,
  ),
  5,
)

const CASE_RUN_BINDINGS = [
  caseBinding('living_a_roll_compositing_case', 'living_a_roll_compositing', [
    'baseline_route_binding', 'five_mode_private_render',
  ]),
  caseBinding('static_illustration_without_animation_case', 'static_illustration_without_character_animation', [
    'baseline_route_binding', 'five_mode_private_render',
  ]),
  caseBinding('living_still_non_character_case', 'living_still_non_character_selective_motion', [
    'five_mode_private_render', 'motion_v3_private_render',
  ]),
  caseBinding('living_archive_case', 'living_archive', [
    'five_mode_private_render', 'non_character_content_lineage',
  ]),
  caseBinding('living_diagram_case', 'living_diagram', [
    'five_mode_private_render', 'non_character_content_lineage',
  ]),
  caseBinding('hybrid_expansion_non_character_case', 'hybrid_expansion_non_character', [
    'five_mode_private_render', 'confirmed_frame_private_render',
    'non_character_content_lineage',
  ]),
  caseBinding('maps_routes_and_data_graphics_case', 'maps_routes_and_data_graphics', [
    'five_mode_private_render', 'non_character_content_lineage',
  ]),
  caseBinding('attention_focus_and_semantic_scale_case', 'attention_focus_and_semantic_scale', [
    'five_mode_private_render', 'motion_v3_private_render',
    'semantic_sound_timing_reconciliation',
  ]),
  caseBinding('camera_depth_occlusion_and_masks_case', 'camera_depth_occlusion_and_masks', [
    'baseline_route_binding', 'five_mode_private_render',
    'motion_v3_private_render',
  ]),
  caseBinding('environmental_editorial_and_rigid_support_case', 'environmental_editorial_and_rigid_support_motion', [
    'selected_scene_environmental_particle',
  ]),
  caseBinding('sound_story_timing_and_caption_case', 'sound_story_timing_and_caption_coordination', [
    'five_mode_private_render', 'semantic_sound_timing_reconciliation',
  ]),
  caseBinding('remotion_qa_and_private_review_case', 'remotion_composition_qa_and_private_review', [
    'non_character_professional_review_contract',
    'postrender_visual_inspection_contract',
    'active_evidence_admission_contract',
  ]),
] as const

const runResults = runDefinitions.map(runDefinition)
const cases = compileCaseResults(runResults)
const draft: LivingFrameActivePrivateInternalTestReportDraft = {
  contractVersion: LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_VERSION,
  reportClass: LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_TEST_CLASS,
  status:
    'engineering_runtime_executed_professional_canonical_evidence_incomplete',
  ownerScopeAmendmentVersion: 'living-frame-owner-scope-amendment-v1',
  aggregateManifestVersion:
    'living-frame-active-non-illustration-aggregate-v1',
  baselineRouteBindingVersion:
    'living-frame-active-baseline-route-binding-v1',
  activeCaseCount: 12,
  pausedScopeCount: 7,
  runCount: 11,
  sourceContractRunCount: 7,
  privateEngineeringMediaRuntimeRunCount: 4,
  privateReviewExportRunCount: 4,
  privateReviewExportCount: 5,
  runs: runResults,
  cases,
  openGateIds: LIVING_FRAME_ACTIVE_PRIVATE_INTERNAL_OPEN_GATE_IDS,
  historicalCharacterOrRiggingAggregateImported: false,
  pausedCharacterOrMechanicalEvidenceAccepted: false,
  baselineFallbackMayProveAdvancedTemporalMasking: false,
  technicalMetricsMayApproveProfessionalQuality: false,
  callerAssertionsMayCountAsVisualInspection: false,
  qwenProviderCallMade: false,
  headQaRecommendationMade: false,
  canonicalPrivateReviewApproved: false,
  internalEngineeringRuntimeExecuted: true,
  processPrivateReviewCopiesPreserved: true,
  reviewCopiesCreateCanonicalArtifacts: false,
  reviewCopiesMayApproveProfessionalQuality: false,
  activePrivateInternalReady: false,
  createsCanonicalPlannerWorkAssetTimingRendererQaOrReviewOwner: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}
const report: LivingFrameActivePrivateInternalTestReport = deepFreeze({
  ...draft,
  runSetDigestSha256: sha256AuthorityValue(
    runResults.map((result) => result.outputDigestSha256),
  ),
  caseSetDigestSha256: sha256AuthorityValue(
    cases.map((result) => result.caseEvidenceDigestSha256),
  ),
  openGateSetDigestSha256: sha256AuthorityValue(draft.openGateIds),
  reportDigestSha256: sha256AuthorityValue(draft),
})

assert.equal(report.cases.length, 12)
assert.equal(
  report.runs.reduce(
    (count, runResult) => count + runResult.reviewExportCount,
    0,
  ),
  5,
)
assert.equal(
  report.runs.every((runResult) =>
    runResult.evidenceClass === 'private_engineering_media_runtime'
      ? runResult.reviewExportCount > 0
      : runResult.reviewExportCount === 0),
  true,
)
assert.equal(
  report.cases.every((entry) =>
    !entry.canCountTowardActiveCompletion
    && !entry.professionalAiVisualInspectionObserved
    && !entry.canonicalRuntimeEvidenceComplete
    && !entry.pausedEvidenceUsed),
  true,
)
assert.equal(report.activePrivateInternalReady, false)
assert.equal(report.productionReady, false)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_active_private_internal_test',
  ...report,
  internalReviewExportRoot: reviewExportRoot,
})}\n`)

function run(
  runId: LivingFrameActivePrivateInternalRunId,
  relativePath: string,
  evidenceClass: RunDefinition['evidenceClass'],
  expectedStatus: RunDefinition['expectedStatus'],
  expectedReviewExportCount: number,
  validate: RunDefinition['validate'],
): RunDefinition {
  return {
    runId,
    relativePath,
    evidenceClass,
    expectedStatus,
    expectedReviewExportCount,
    validate,
  }
}

function runDefinition(
  definition: RunDefinition,
  order: number,
): LivingFrameActivePrivateInternalRunResult {
  const absolutePath = join(repositoryRoot, definition.relativePath)
  assert.equal(
    existsSync(absolutePath),
    true,
    `Active Living Frame internal run is missing: ${definition.runId}.`,
  )
  const execution = spawnSync(tsxEntrypoint, [absolutePath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      [LIVING_FRAME_INTERNAL_REVIEW_EXPORT_ROOT_ENV]:
        reviewExportRoot,
    },
    maxBuffer: 8 * 1024 * 1024,
    timeout: 20 * 60 * 1_000,
  })
  assert.equal(
    execution.status,
    0,
    `Active Living Frame internal run failed: ${definition.runId}.\n${execution.stderr}`,
  )
  const receipt = parseLastJsonObject(execution.stdout)
  assert.ok(
    receipt,
    `Active Living Frame internal run emitted no structured receipt: ${definition.runId}.`,
  )
  assert.equal(receipt.status, definition.expectedStatus)
  definition.validate(receipt)
  const reviewExports =
    validateReviewExports(
      receipt.reviewExports,
      definition.runId,
      definition.expectedReviewExportCount,
    )
  return deepFreeze({
    runId: definition.runId,
    order,
    relativePath: definition.relativePath,
    evidenceClass: definition.evidenceClass,
    exitStatus: 0 as const,
    structuredReceiptObserved: true as const,
    observedStatus: definition.expectedStatus,
    outputDigestSha256: createHash('sha256')
      .update(execution.stdout)
      .digest('hex'),
    receiptDigestSha256: sha256AuthorityValue(receipt),
    reviewExportCount: reviewExports.length,
    reviewExportReceiptSetDigestSha256:
      sha256AuthorityValue(reviewExports),
    canonicalRuntimeEvidenceClaimed: false as const,
  })
}

function compileCaseResults(
  runs: readonly LivingFrameActivePrivateInternalRunResult[],
): readonly LivingFrameActivePrivateInternalCaseResult[] {
  const runIds = new Set(runs.map((runResult) => runResult.runId))
  return CASE_RUN_BINDINGS.map((binding, order) => {
    assert.equal(binding.caseId, LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order])
    assert.equal(
      binding.requiredRunIds.every((runId) => runIds.has(runId)),
      true,
    )
    const draft = {
      caseId: binding.caseId,
      order,
      activeScope: binding.activeScope,
      requiredRunIds: binding.requiredRunIds,
      engineeringMediaRuntimeObserved: binding.requiredRunIds.some((runId) =>
        runs.find((runResult) => runResult.runId === runId)
          ?.evidenceClass === 'private_engineering_media_runtime'),
      sourceContractEvidenceObserved: true as const,
      professionalAiVisualInspectionObserved: false as const,
      separateCanonicalAudioEvidenceObserved: false as const,
      canonicalHeadQaRecommendationObserved: false as const,
      canonicalPrivateReviewObserved: false as const,
      canonicalRuntimeEvidenceComplete: false as const,
      canCountTowardActiveCompletion: false as const,
      pausedEvidenceUsed: false as const,
    }
    return deepFreeze({
      ...draft,
      caseEvidenceDigestSha256: sha256AuthorityValue(draft),
    })
  })
}

function caseBinding(
  caseId: typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[number],
  activeScope: LivingFrameActivePrivateInternalCaseResult['activeScope'],
  requiredRunIds: readonly LivingFrameActivePrivateInternalRunId[],
) {
  return {
    caseId,
    activeScope,
    requiredRunIds: [
      ...requiredRunIds,
      'representative_visual_fixture_plan' as const,
    ],
  }
}

function validateReviewExports(
  value: unknown,
  expectedRunId: LivingFrameActivePrivateInternalRunId,
  expectedCount: number,
): readonly Record<string, unknown>[] {
  if (value != null && !Array.isArray(value)) {
    assert.fail('Living Frame internal review exports must be an array.')
  }
  const exports: readonly unknown[] = value == null ? [] : value
  assert.equal(exports.length, expectedCount)
  const fileNames = new Set<string>()
  for (const entry of exports) {
    assert.equal(
      entry != null && typeof entry === 'object' && !Array.isArray(entry),
      true,
    )
    const receipt = entry as Record<string, unknown>
    assert.equal(
      receipt.exportClass,
      'process_private_non_authoritative_visual_review_copy',
    )
    assert.equal(receipt.runId, expectedRunId)
    assert.equal(
      typeof receipt.fileName === 'string'
      && /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/u.test(receipt.fileName),
      true,
    )
    assert.equal(fileNames.has(receipt.fileName as string), false)
    fileNames.add(receipt.fileName as string)
    assert.equal(
      typeof receipt.byteLength === 'number'
      && Number.isSafeInteger(receipt.byteLength)
      && receipt.byteLength > 0,
      true,
    )
    assert.equal(
      typeof receipt.sha256 === 'string'
      && /^[a-f0-9]{64}$/u.test(receipt.sha256),
      true,
    )
    assert.equal(receipt.createOnlyCopyUsed, true)
    assert.equal(receipt.canonicalArtifactCreated, false)
    assert.equal(receipt.qaApprovalGranted, false)
    assert.equal(receipt.privateReviewApproved, false)
    assert.equal(receipt.publicDeliveryReady, false)
    assert.equal(receipt.productionReady, false)
  }
  return exports as readonly Record<string, unknown>[]
}

function parseLastJsonObject(output: string): Record<string, unknown> | null {
  const trimmed = output.trim()
  for (
    let index = trimmed.lastIndexOf('{');
    index >= 0;
    index = trimmed.lastIndexOf('{', index - 1)
  ) {
    try {
      const parsed = JSON.parse(trimmed.slice(index)) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Continue to the previous output line.
    }
  }
  return null
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      deepFreeze(entry))
  }
  return value
}
