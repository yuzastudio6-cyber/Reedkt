import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import {
  createCaptionCompleteQaBundle,
  createCaptionDirectVisualInspectionReceipt,
  parseCaptionCompleteQaReport,
  parseCaptionDirectVisualInspectionReceipt,
  parseCaptionLocalRepairFallbackPlan,
} from '../captions-specialist/caption-complete-qa'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import type {
  CaptionDirectVisualInspectionItem,
} from '../../src/types/caption-complete-qa'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
  CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  CAP_14_SCENE_GROUP_FIXTURE,
} from './captions-specialist-cap-14-smoke'
import {
  CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE,
  CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE,
} from './captions-specialist-cap-15-smoke'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version: string, contentHash = hash(id)): CaptionDomainRef {
  return { id, version, contentHash }
}
function redigest<T extends Record<string, unknown>>(value: T, field: keyof T): T {
  value[field] = calculateSkillContractDigest(value, field as string) as T[keyof T]
  return value
}

const goldenFrames = [0, 29, 89, 149, 209, 269, 329, 359]
const exactGoldenHashes = [
  '9386add1b0364e0372676fad4d16fa9649a5e187afc36a07bcf975d89002e02c',
  '06a04c14b7e9e2d80866de83db2bc3934a1e35e7ee3a6435c98d7aea713dd649',
  'd586e0becf66f17ed47d6f88793be66bcb5b5594d5edd6610144ca4ee33696de',
  'ef7ae4a0af6643c07fc2f896ca9a298b86f3380b819b03152c7a545fee675e18',
  '0e511006506d88aa87c351d3b48da9df13da92db9cb2efb03004528576ca9283',
  'b948428c2f9d0c46f2f46d190b9c281882b7bb5811c815bf04f3c0269a8df0e6',
  'd37ea1bf7ae49f783bdc570d6020f219ce91ad968993c0bed89ece602e6912ea',
  'da8b1f0cdfc276f894acf4ef4204e148ac0a04ebdbf8e1e350abb34a5a44412b',
]

function goldenItems(
  kind: 'remotion_full_motion_golden' | 'remotion_reduced_motion_golden',
): CaptionDirectVisualInspectionItem[] {
  return goldenFrames.map((frame, index) => {
    const digest = exactGoldenHashes[index]!
    return {
      inspectionItemId: `caption.inspection.cap16.${kind}.${frame}`,
      sourceArtifactRef: ref(
        `caption.cap14.${kind}.${frame}`, 'private-raster-v1', digest),
      sourceKind: kind,
      outputId: 'output.cap11.widescreen',
      width: 640,
      height: 360,
      frameNumber: frame,
      rasterSha256: digest,
      disposition: 'passed',
      findingCodes: ['readable_safe_hierarchy_no_collision'],
      actualRasterOpenedAndInspected: true,
    }
  })
}

const wideLibassHash =
  '2efdd52e81e5256ef9f187c48f032f99866fc3df1b70cd2c608843e6495b24f1'
const rejectedVerticalHash =
  '048ab957cc73ea6c64d400343abf8ebd6cf52acb76ee615210ad5ddcda083368'
const repairedVerticalHash =
  '7f26148639140abf82555b262e24a3e3aa7ee72dc8bf55d159eb42f04185cd45'

const wideInspectionItems: CaptionDirectVisualInspectionItem[] = [
  ...goldenItems('remotion_full_motion_golden'),
  ...goldenItems('remotion_reduced_motion_golden'),
  {
    inspectionItemId: 'caption.inspection.cap16.libass.wide',
    sourceArtifactRef: ref(
      'caption.cap15.libass.wide', 'private-raster-v1', wideLibassHash),
    sourceKind: 'libass_widescreen_overlay',
    outputId: 'output.cap11.widescreen',
    width: 640,
    height: 360,
    frameNumber: null,
    rasterSha256: wideLibassHash,
    disposition: 'passed',
    findingCodes: ['complete_centered_unclipped_bottom_safe'],
    actualRasterOpenedAndInspected: true,
  },
]
const failedVerticalRef = ref(
  'caption.cap15.libass.vertical.rejected', 'private-raster-v1', rejectedVerticalHash)
const repairedVerticalRef = ref(
  'caption.cap15.libass.vertical.repair', 'private-raster-v1', repairedVerticalHash)
const verticalInspectionItems: CaptionDirectVisualInspectionItem[] = [{
  inspectionItemId: 'caption.inspection.cap16.libass.vertical.rejected',
  sourceArtifactRef: failedVerticalRef,
  sourceKind: 'libass_vertical_overlay_rejected',
  outputId: 'output.cap15.vertical',
  width: 360,
  height: 640,
  frameNumber: null,
  rasterSha256: rejectedVerticalHash,
  disposition: 'failed_repaired',
  findingCodes: ['horizontal_clipping_left_and_right'],
  actualRasterOpenedAndInspected: true,
}, {
  inspectionItemId: 'caption.inspection.cap16.libass.vertical.repair',
  sourceArtifactRef: repairedVerticalRef,
  sourceKind: 'libass_vertical_overlay_repair',
  outputId: 'output.cap15.vertical',
  width: 360,
  height: 640,
  frameNumber: null,
  rasterSha256: repairedVerticalHash,
  disposition: 'passed',
  findingCodes: ['centered_unclipped_bottom_safe_after_repair'],
  actualRasterOpenedAndInspected: true,
}]

export const CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE =
createCaptionDirectVisualInspectionReceipt({
  receiptId: 'caption.visual.inspection.cap16.wide',
  canonicalScope: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan.canonicalScope,
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
  reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  accessibilityBundle: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE,
  inspectedArtifacts: wideInspectionItems,
  repairChain: [],
})

export const CAP_16_VERTICAL_INSPECTION_RECEIPT_FIXTURE =
createCaptionDirectVisualInspectionReceipt({
  receiptId: 'caption.visual.inspection.cap16.vertical',
  canonicalScope: CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE.plan.canonicalScope,
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  fullMotionRenderSpec: null,
  reducedMotionRenderSpec: null,
  accessibilityBundle: CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE,
  inspectedArtifacts: verticalInspectionItems,
  repairChain: [{
    issueId: 'caption.issue.cap16.vertical.clipping',
    failureCode: 'caption_vertical_single_line_horizontal_clipping',
    failedArtifactRef: failedVerticalRef,
    repairedArtifactRef: repairedVerticalRef,
    repairActionCode:
      'reject_clipped_fixture_add_safe_width_guard_use_short_stable_cue',
    repairVersion: 1,
    predispatchGuardVersion: 'caption_libass_fixture_safe_width_guard_v1',
    reinspectionDisposition: 'passed',
  }],
})

const soundAdmissionRef = ref(
  'caption.sound.admission.cap13', 'caption-sound-admission-v1')

export const CAP_16_WIDESCREEN_QA_BUNDLE_FIXTURE = createCaptionCompleteQaBundle({
  reportId: 'caption.complete.qa.cap16.wide',
  repairPlanId: 'caption.repair.fallback.cap16.wide',
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
  reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  accessibilityBundle: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE,
  soundAdmissionRef,
  inspectionReceipt: CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE,
  qualifiedVisualIntelligenceEvidenceRef: null,
  completeTrackExecutionEvidenceRef: null,
  finalExportEvidenceRef: null,
})

export const CAP_16_VERTICAL_QA_BUNDLE_FIXTURE = createCaptionCompleteQaBundle({
  reportId: 'caption.complete.qa.cap16.vertical',
  repairPlanId: 'caption.repair.fallback.cap16.vertical',
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  fullMotionRenderSpec: null,
  reducedMotionRenderSpec: null,
  accessibilityBundle: CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE,
  soundAdmissionRef,
  inspectionReceipt: CAP_16_VERTICAL_INSPECTION_RECEIPT_FIXTURE,
  qualifiedVisualIntelligenceEvidenceRef: null,
  completeTrackExecutionEvidenceRef: null,
  finalExportEvidenceRef: null,
})

export function runCap16Smoke(): void {
  const wide = CAP_16_WIDESCREEN_QA_BUNDLE_FIXTURE
  const vertical = CAP_16_VERTICAL_QA_BUNDLE_FIXTURE
  check(wide.report.checks.length === 11
    && wide.report.checks.map((item) => item.category).join('|')
      === 'transcript|alignment|semantic|typography|visual_placement|occlusion_mask|motion|sound|accessibility_localization|render_export|policy_security',
  'CAP-16 must emit every required QA layer in one frozen order.')
  check(wide.report.passedCheckCount === 3
    && wide.report.needsEvidenceCheckCount === 7
    && wide.report.notApplicableCheckCount === 1,
  'Widescreen QA must distinguish deterministic passes from exact open evidence gates.')
  check(vertical.report.passedCheckCount === 3
    && vertical.report.needsEvidenceCheckCount === 6
    && vertical.report.notApplicableCheckCount === 2,
  'Vertical QA must not claim Remotion motion evidence it does not possess.')
  check(wide.report.captionScopeRecommendation === 'blocked_external_evidence'
    && vertical.report.captionScopeRecommendation === 'blocked_external_evidence',
  'Missing complete-time AI, track, export, and final QA evidence must block acceptance.')
  check(wide.report.boundedDirectVisualInspectionPassed
    && vertical.report.boundedDirectVisualInspectionPassed
    && !wide.report.completeTimeQualifiedAiVisualReviewCompleted,
  'Bounded direct inspection must remain separate from complete-time qualified AI review.')
  check(wide.inspectionReceipt.inspectedArtifacts.length === 17
    && vertical.inspectionReceipt.inspectedArtifacts.length === 2,
  'Each output must retain only its own exact inspected artifacts.')
  check(wide.inspectionReceipt.inspectedArtifacts.every((item) =>
    item.outputId === 'output.cap11.widescreen')
    && vertical.inspectionReceipt.inspectedArtifacts.every((item) =>
      item.outputId === 'output.cap15.vertical'),
  'Cross-canvas visual evidence reuse must be impossible.')
  check(wide.inspectionReceipt.coverage.fullMotionGoldenFramesInspected.join('|')
    === goldenFrames.join('|')
    && wide.inspectionReceipt.coverage.reducedMotionGoldenFramesInspected.join('|')
      === goldenFrames.join('|'),
  'Both full and reduced golden sets must have complete bounded coverage.')
  check(wide.inspectionReceipt.inspectedArtifacts.filter((item) =>
    item.sourceKind.startsWith('remotion_')).every((item, index, items) => {
      if (index >= goldenFrames.length) return item.rasterSha256
        === items[index - goldenFrames.length]!.rasterSha256
      return true
    }), 'Settled full/reduced golden rasters must retain exact parity.')
  check(vertical.inspectionReceipt.repairChain.length === 1
    && vertical.repairPlan.completedRepairCount === 1,
  'The rejected vertical raster must bind one completed and reinspected repair.')
  check(vertical.inspectionReceipt.inspectedArtifacts.some((item) =>
    item.rasterSha256 === rejectedVerticalHash && item.disposition === 'failed_repaired')
    && vertical.inspectionReceipt.inspectedArtifacts.some((item) =>
      item.rasterSha256 === repairedVerticalHash && item.disposition === 'passed'),
  'Failed and repaired visual evidence must remain separate and immutable.')
  check(wide.repairPlan.selectedFallbackCount === 3
    && wide.repairPlan.blockedExternalOwnerCount === 7,
  'Widescreen repairs must separate approved fallbacks from external owner gates.')
  check(vertical.repairPlan.selectedFallbackCount === 3
    && vertical.repairPlan.blockedExternalOwnerCount === 6,
  'Vertical repairs must omit a nonexistent motion-runtime gate.')
  check(wide.repairPlan.items.some((item) => item.owner === 'visual_intelligence'
    && item.disposition === 'blocked_external_owner')
    && wide.repairPlan.items.some((item) => item.owner === 'independent_final_qa'),
  'Qualified AI visual review and independent final QA must stay external owners.')
  check(wide.repairPlan.items.some((item) =>
    item.owner === 'canonical_libass_runtime'
      && item.issueCode === 'complete_track_multilingual_runtime_qa_required'),
  'Incomplete caption-track runtime QA must remain an explicit canonical owner gate.')
  check(wide.repairPlan.items.some((item) => item.fallbackId === 'safe_top_plane')
    && wide.repairPlan.items.some((item) => item.fallbackId === 'silent_caption_fallback')
    && wide.repairPlan.items.some((item) => item.fallbackId === 'accessible_sidecars'),
  'Mask, sound, and accessibility failures must select declared safe fallbacks.')
  check(wide.repairPlan.mapsChartsBrowserCaptionsTimingMasksQaFallbackToAiVideo === false,
    'Caption, timing, mask, and QA fallback must never route to AI video.')
  check(wide.domainQaContract.contractKind === 'qa_report'
    && wide.domainRepairContract.contractKind === 'repair_plan',
  'Specialized CAP-16 evidence must adapt back to the frozen domain contract family.')
  check(wide.domainQaContract.payload.independentFinalQaStillRequired
    && wide.domainQaContract.payload.captionQaRecommendation === 'block_caption_scope',
  'The generic QA adapter must preserve the independent final-QA block.')
  check(!wide.report.operationDispatchAuthority
    && !wide.report.repairExecutionAuthority
    && !wide.report.assetMutationAuthority
    && !wide.report.finalQaApprovalAuthority
    && !wide.report.publicDeliveryAuthority
    && !wide.report.productionAuthority,
  'CAP-16 source evidence must keep every execution and delivery authority closed.')

  const staleReceipt = structuredClone(wide.inspectionReceipt)
  staleReceipt.inspectedArtifacts[0]!.rasterSha256 = hash('stale')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(staleReceipt, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const crossCanvas = structuredClone(wide.inspectionReceipt)
  crossCanvas.inspectedArtifacts[0]!.outputId = 'output.cap15.vertical'
  redigest(crossCanvas as unknown as Record<string, unknown>, 'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(crossCanvas, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const missingGolden = structuredClone(wide.inspectionReceipt)
  missingGolden.inspectedArtifacts.splice(0, 1)
  missingGolden.coverage.fullMotionGoldenFramesInspected.splice(0, 1)
  redigest(missingGolden as unknown as Record<string, unknown>, 'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(missingGolden, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const substitutedGoldenFrames = structuredClone(wide.inspectionReceipt)
  substitutedGoldenFrames.inspectedArtifacts[0]!.frameNumber = 1
  substitutedGoldenFrames.inspectedArtifacts[goldenFrames.length]!.frameNumber = 1
  redigest(substitutedGoldenFrames as unknown as Record<string, unknown>,
    'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(
    substitutedGoldenFrames, {
      accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
      fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
      reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
    }))

  const wrongRasterDimensions = structuredClone(wide.inspectionReceipt)
  wrongRasterDimensions.inspectedArtifacts[0]!.width = 639
  redigest(wrongRasterDimensions as unknown as Record<string, unknown>,
    'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(
    wrongRasterDimensions, {
      accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
      fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
      reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
    }))

  const reducedParityDrift = structuredClone(wide.inspectionReceipt)
  const driftHash = hash('reduced-motion-parity-drift')
  reducedParityDrift.inspectedArtifacts[goldenFrames.length]!.rasterSha256 = driftHash
  reducedParityDrift.inspectedArtifacts[
    goldenFrames.length]!.sourceArtifactRef.contentHash = driftHash
  redigest(reducedParityDrift as unknown as Record<string, unknown>,
    'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(reducedParityDrift, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const wrongDuration = structuredClone(wide.inspectionReceipt)
  wrongDuration.coverage.renderDurationFrames -= 1
  redigest(wrongDuration as unknown as Record<string, unknown>,
    'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(wrongDuration, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const visualOverclaim = structuredClone(wide.inspectionReceipt)
  visualOverclaim.qualifiedVisualIntelligenceEvidenceClaimed = true as false
  redigest(visualOverclaim as unknown as Record<string, unknown>, 'receiptDigestSha256')
  expectThrow(() => parseCaptionDirectVisualInspectionReceipt(visualOverclaim, {
    accessibilityPlan: CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE.plan,
    fullMotionRenderSpec: CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
    reducedMotionRenderSpec: CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
  }))

  const reorderedChecks = structuredClone(wide.report)
  const first = reorderedChecks.checks[0]!
  reorderedChecks.checks[0] = reorderedChecks.checks[1]!
  reorderedChecks.checks[1] = first
  redigest(reorderedChecks as unknown as Record<string, unknown>, 'reportDigestSha256')
  expectThrow(() => parseCaptionCompleteQaReport(reorderedChecks))

  const falseAiCompletion = structuredClone(wide.report)
  falseAiCompletion.completeTimeQualifiedAiVisualReviewCompleted = true
  redigest(falseAiCompletion as unknown as Record<string, unknown>, 'reportDigestSha256')
  expectThrow(() => parseCaptionCompleteQaReport(falseAiCompletion))

  const unboundAiCompletion = structuredClone(wide.report)
  unboundAiCompletion.qualifiedVisualIntelligenceEvidenceRef = ref(
    'caption.visual-intelligence.counterfeit', 'visual-evidence-v1')
  unboundAiCompletion.completeTimeQualifiedAiVisualReviewCompleted = true
  redigest(unboundAiCompletion as unknown as Record<string, unknown>,
    'reportDigestSha256')
  expectThrow(() => parseCaptionCompleteQaReport(unboundAiCompletion))

  const inapplicableBlocking = structuredClone(wide.report)
  const occlusion = inapplicableBlocking.checks.find((item) =>
    item.category === 'occlusion_mask')!
  occlusion.blocksFinalDelivery = true
  redigest(inapplicableBlocking as unknown as Record<string, unknown>,
    'reportDigestSha256')
  expectThrow(() => parseCaptionCompleteQaReport(inapplicableBlocking))

  const authorityOverclaim = structuredClone(wide.report)
  authorityOverclaim.finalQaApprovalAuthority = true as false
  redigest(authorityOverclaim as unknown as Record<string, unknown>, 'reportDigestSha256')
  expectThrow(() => parseCaptionCompleteQaReport(authorityOverclaim))

  const hiddenDowngrade = structuredClone(vertical.repairPlan)
  hiddenDowngrade.hiddenQualityDowngradeAllowed = true as false
  redigest(hiddenDowngrade as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionLocalRepairFallbackPlan(
    hiddenDowngrade, vertical.report, vertical.inspectionReceipt))

  const wrongRepairSource = structuredClone(vertical.repairPlan)
  wrongRepairSource.items[0]!.sourceCheckId = 'caption.qa.counterfeit'
  redigest(wrongRepairSource as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionLocalRepairFallbackPlan(
    wrongRepairSource, vertical.report, vertical.inspectionReceipt))

  const staleBlockingCodes = structuredClone(vertical.repairPlan)
  staleBlockingCodes.blockingExternalGateCodes.pop()
  redigest(staleBlockingCodes as unknown as Record<string, unknown>,
    'planDigestSha256')
  expectThrow(() => parseCaptionLocalRepairFallbackPlan(
    staleBlockingCodes, vertical.report, vertical.inspectionReceipt))

  const cyclic = structuredClone(wide.report) as unknown as Record<string, unknown>
  cyclic.self = cyclic
  expectThrow(() => parseCaptionCompleteQaReport(cyclic))

  const unknown = { ...structuredClone(wide.report), unknownField: false }
  expectThrow(() => parseCaptionCompleteQaReport(unknown))

  const inherited = Object.create({ finalQaApprovalAuthority: true }) as
    Record<string, unknown>
  Object.assign(inherited, wide.report)
  expectThrow(() => parseCaptionCompleteQaReport(inherited))

  console.log(JSON.stringify({
    status: 'passed_with_explicit_complete_time_ai_export_and_final_qa_gates',
    milestone: 'CAP-16',
    assertions,
    outputReports: [wide.report.canonicalScope.outputId,
      vertical.report.canonicalScope.outputId],
    wideCheckCounts: {
      passed: wide.report.passedCheckCount,
      needsEvidence: wide.report.needsEvidenceCheckCount,
      notApplicable: wide.report.notApplicableCheckCount,
    },
    directRasterItems: wide.inspectionReceipt.inspectedArtifacts.length
      + vertical.inspectionReceipt.inspectedArtifacts.length,
    completedLocalRepairCount: vertical.repairPlan.completedRepairCount,
    qualifiedCompleteTimeAiVisualReviewCompleted: false,
    completeTrackRuntimeQaCompleted: false,
    finalExportQaCompleted: false,
    independentFinalQaGranted: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap16Smoke()
}
