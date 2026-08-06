import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalCaptionPostrenderVisualIntelligenceResult,
  parseCanonicalCaptionPostrenderVisualIntelligenceResult,
} from '../services/canonical-caption-postrender-visual-intelligence-result'
import {
  createControlledCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
  persistCanonicalCaptionPostrenderVisualIntelligenceEvidence,
} from '../services/canonical-caption-postrender-visual-intelligence-evidence-repository'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION,
  readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult,
  type CanonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort,
} from '../services/canonical-caption-postrender-visual-intelligence-owner-result-port'
import {
  createCanonicalCaptionPostrenderVisualQaOutputAuthority,
  createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository,
} from '../services/canonical-caption-postrender-visual-qa-evidence-service'
import {
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService,
} from '../services/canonical-caption-postrender-visual-qa-authenticated-read-service'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-postrender-visual-qa-work-binding'
import {
  prepareCanonicalCaptionPostrenderVisualQaExecution,
} from '../services/canonical-caption-postrender-visual-qa-coordinator-service'
import type { ServiceContext } from '../types'
import type {
  CanonicalCaptionPrivateReviewDependencyBinding,
} from '../../src/types/canonical-caption-private-review-dependency-binding'
import {
  buildCanonicalCaptionPrivateReviewEvidenceProjection,
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from '../services/canonical-caption-private-review-evidence-service'
import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_V2_VERSION,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-qa-evidence'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
  createCanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository,
} from '../services/canonical-caption-postrender-visual-intelligence-durable-store'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCaptionPostrenderVisualIntelligenceOwnerService,
} from '../services/canonical-caption-postrender-visual-intelligence-owner-service'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualInspectionRequirement,
  createVisualInspectionResult,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceReport,
  createVisualIntelligenceRequest,
  createVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import {
  createCanonicalConfirmedOutputBinding,
} from '../validation/canonical-confirmed-output-frame-schemas'

let assertions = 0
const check = (condition: unknown, message: string): void => {
  assert.ok(condition, message)
  assertions += 1
}
const raw = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const frameRate = { numerator: 30, denominator: 1 } as const
const wholeTimeline = {
  startFrame: 0,
  endFrameExclusive: 360,
  frameRate,
} as const
const renderSha = raw('exact-approved-captioned-render')
const renderRef = {
  id: 'captioned-render-output-1',
  version: 1,
  contentHash: `sha256:${renderSha}`,
} as const
const expectedOutcomeRefs = [
  ref('caption-readability-outcome'),
  ref('caption-safe-placement-outcome'),
  ref('final-render-polish-outcome'),
]
const requirement = createVisualInspectionRequirement({
  inspectionId: 'caption-postrender-visual-inspection-1',
  owningWorkNodeId: 'caption-postrender-visual-qa-work-1',
  owningSkillId: 'captions',
  profile: 'final_render_visual_qa',
  expectedOutcomeRefs,
  requestedRanges: [wholeTimeline],
  required: true,
  blocksNextWorkNode: true,
  blocksPreview: false,
  blocksFinalExport: true,
  currentRepairCycle: 0,
})
const approvedSnapshotRef = ref('snapshot-caption-1')
const executionPackageRef = ref('caption-execution-package-1')
const approvedWorkItemRef = ref(requirement.owningWorkNodeId)
const deterministicCompleteTimeQaRef =
  ref('caption-deterministic-complete-qa')
const independentArtifactQaRef = ref('caption-independent-artifact-qa')
const assetManifestReconciliationRef = ref('caption-asset-reconciliation')
const outputFrameRef = ref('confirmed-caption-output-frame')
const captionOutputFrameRef = {
  id: 'confirmed-caption-output-frame',
  version: 'confirmed-caption-output-frame-v1',
  contentHash: outputFrameRef.contentHash.slice(7),
} as const
const confirmedOutputBinding = createCanonicalConfirmedOutputBinding({
  outputId: 'caption-output-wide-1',
  aspectRatioLabel: '16:9',
  aspectRatioNumerator: 16,
  aspectRatioDenominator: 9,
  width: 1_920,
  height: 1_080,
  fpsNumerator: frameRate.numerator,
  fpsDenominator: frameRate.denominator,
  confirmedOutputFrameRef: outputFrameRef,
  confirmedByUser: true,
  confirmationRecordId: 'caption-output-confirmation-1',
})
const request = createVisualIntelligenceRequest({
  requestId: 'caption-postrender-visual-intelligence-request-1',
  idempotencyKey: 'caption-postrender-visual-intelligence-idempotency-1',
  scope: {
    ownerUserId: 'owner-caption-1',
    workspaceId: 'workspace-caption-1',
    projectId: 'project-caption-1',
    editSessionId: 'edit-caption-1',
    approvedSnapshotId: 'snapshot-caption-1',
  },
  operation: 'inspect_edit',
  profile: 'final_render_visual_qa',
  sourceArtifacts: [{
    artifactId: renderRef.id,
    mediaKind: 'video',
    contentType: 'video/mp4',
    checksumSha256: renderSha,
    byteLength: 8_000_000,
    width: 1_920,
    height: 1_080,
    durationFrames: 360,
    frameRate,
    finalizedMediaAuthorityRef: ref('caption-render-finalized-authority'),
    immutableStorageObjectAuthorityRef: ref('caption-render-storage-authority'),
    mediaProbeEvidenceRef: ref('caption-render-probe-evidence'),
    privateArtifact: true,
    exactGenerationRereadRequiredAtDispatch: true,
  }],
  comparisonArtifacts: [],
  requestedRanges: [wholeTimeline],
  requiredEvidenceRefs: [
    ref('caption-render-probe-evidence'),
    executionPackageRef,
    deterministicCompleteTimeQaRef,
    independentArtifactQaRef,
    assetManifestReconciliationRef,
  ],
  expectedOutcomeRefs,
  outputFrame: {
    outputId: 'caption-output-wide-1',
    aspectRatioLabel: '16:9',
    aspectRatioNumerator: 16,
    aspectRatioDenominator: 9,
    width: 1_920,
    height: 1_080,
    frameRate,
    confirmedOutputFrameRef: outputFrameRef,
    confirmedByUser: true,
  },
  protectedZones: [],
  qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
  admission: {
    mode: 'approved_edit_inspection',
    authenticatedPrincipalRef: ref('caption-owner-principal'),
    workspaceAuthorizationRef: ref('caption-workspace-authorization'),
    approvedPlanSnapshotRef: approvedSnapshotRef,
    approvedEstimateRef: ref('caption-approved-estimate'),
    creditReservationRef: ref('caption-credit-reservation'),
    privatePreviewArtifactRef: renderRef,
    expectedOutcomeRefs,
    workNodeRefs: [approvedWorkItemRef],
    timelineRefs: [ref('caption-master-timing')],
    qaPolicyRef: ref('caption-final-render-visual-qa-policy'),
    costPreflight: {
      pricingSnapshotRef: ref('gemini-pricing-snapshot'),
      accountEffectiveRateAuthorityRef: ref('gemini-account-rate'),
      currency: 'USD',
      maximumAuthorizedCostMicros: 100_000,
      estimatedMinimumCostMicros: 4_000,
      estimatedMaximumCostMicros: 40_000,
      serviceFeeIncluded: false,
      publicListPriceUsedAsSettlementAuthority: false,
      preflightPassed: true,
    },
    retentionPolicyRef: ref('caption-private-retention-policy'),
    privacyPolicyRef: ref('caption-private-artifact-policy'),
    providerReleaseRef: ref('visual-intelligence-provider-release'),
    globalKillSwitchOpen: false,
    providerKillSwitchOpen: false,
    reportPersistenceAllowed: true,
    timelineMutationAllowed: false,
    owningSkillRepairAllowed: true,
    directRepairAllowed: false,
    finalQaApprovalAllowed: false,
    exportReleaseAllowed: false,
    deliveryAllowed: false,
  },
  callerQuestion: null,
  byteFreeRequest: true,
  callerPromptAccepted: false,
  providerCredentialIncluded: false,
  publicMediaUrlIncluded: false,
  signedUrlIsSourceTruth: false,
  shellCommandIncluded: false,
  providerToolDefinitionIncluded: false,
})
const semanticEvidenceRef = ref('caption-postrender-semantic-evidence')
const report = createVisualIntelligenceReport({
  reportId: 'caption-postrender-visual-intelligence-report-1',
  requestRef: requestRef(),
  scope: request.scope,
  operation: request.operation,
  profile: request.profile,
  sourceArtifacts: [{
    artifactId: renderRef.id,
    checksumSha256: renderSha,
    mediaKind: 'video',
    durationFrames: 360,
  }],
  comparisonArtifacts: [],
  coverage: {
    requestedRanges: [wholeTimeline],
    analyzedRanges: [wholeTimeline],
    incompleteRanges: [],
    sceneBoundaryRefs: [ref('caption-render-scene-boundaries')],
    samplingPolicies: [{
      policyId: 'caption-final-render-gapless-semantic-coverage',
      policyVersion: 'caption-final-render-gapless-semantic-coverage-v1',
      mode: 'scene_aware_complete_coverage',
      targetFramesPerSecondNumerator: 2,
      targetFramesPerSecondDenominator: 1,
      sceneAware: true,
      highDetail: true,
      requestedRange: wholeTimeline,
      analyzedRange: wholeTimeline,
      samplingPolicyRef: ref('caption-postrender-sampling-policy'),
    }],
    targetedFollowupRanges: [],
    completeRequestedRangeCoverage: true,
    everyTimelineFrameInspected: false,
    completeTimePixelInspectionClaimAllowed: false,
  },
  semanticSummary:
    'The approved captioned render remains readable and professionally composed across the requested timeline.',
  segments: [{
    segmentId: 'caption-postrender-segment-1',
    artifactId: renderRef.id,
    range: wholeTimeline,
    sceneId: 'caption-scene-1',
    summary: 'Caption hierarchy, placement, and motion remain clear in context.',
    subjectIds: ['speaker-1'],
    objectIds: [],
    actionLabels: ['caption_display'],
    visibleTextEvidenceRefs: [],
    transcriptEvidenceRefs: [],
    evidenceRefs: [semanticEvidenceRef],
    confidenceBasisPoints: 9_100,
    uncertainty: null,
    sourcePlanning: null,
  }],
  findings: [],
  evidence: [{
    evidenceId: 'caption-postrender-semantic-evidence',
    evidenceRef: semanticEvidenceRef,
    artifactId: renderRef.id,
    range: wholeTimeline,
    authority: 'semantic_visual_judgment',
    producingTool: 'gemini_pro_high',
    toolVersion: 'gemini-3.1-pro-preview',
    summary: 'Visual Intelligence inspected the exact approved private render.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }],
  deterministicToolExecutions: [
    toolExecution('ffprobe'),
    toolExecution('ffmpeg'),
    toolExecution('pyscenedetect'),
    toolExecution('opencv'),
  ],
  expectedOutcomeRefs,
  disposition: 'pass',
  reinspectionRequired: false,
  usage: {
    promptTokenCount: 2_000,
    candidateTokenCount: 500,
    thinkingTokenCount: 1_000,
    cachedTokenCount: 0,
    totalTokenCount: 3_500,
    providerResponseId: 'gemini-caption-postrender-response-1',
    providerModelVersion: 'gemini-3.1-pro-preview',
    estimatedCostMicros: 14_000,
    settledCostMicros: 13_500,
    costEvidenceRef: ref('caption-postrender-gemini-cost-evidence'),
    billingAccountEffectiveRateUsed: true,
    publicListPriceUsed: false,
    duplicateSettlementPerformed: false,
    replayedFromCache: false,
    providerCallMade: true,
  },
  provenance: {
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    exactModelId: 'gemini-3.1-pro-preview',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
    responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
    deterministicEvidenceVersion:
      VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
    transcriptVersion: 'caption-transcript-v1',
    ocrVersion: 'caption-ocr-v1',
    cacheIdentitySha256: ref('caption-postrender-cache').contentHash,
    requestDigestSha256: request.requestDigestSha256,
    admissionRef: ref('caption-postrender-admission'),
    providerReleaseRef: request.admission.providerReleaseRef,
    applicationDefaultCredentialsUsed: true,
    providerToolsUsed: false,
    searchGroundingUsed: false,
    urlContextUsed: false,
    codeExecutionUsed: false,
    rawProviderPayloadPersisted: false,
  },
  blockers: [],
  warnings: [],
  immutableReport: true,
  planningMayConsumeValidatedEvidence: false,
  directTimelineMutationAllowed: false,
  renderPerformedByVisualIntelligence: false,
  exportAuthorized: false,
  deliveryAuthorized: false,
})
const spatialEvidence = createVisualIntelligenceSpatialEvidence({
  spatialEvidenceId: 'caption-postrender-spatial-evidence-1',
  requestRef: requestRef(),
  reportRef: reportRef(),
  scope: request.scope,
  operation: request.operation,
  profile: request.profile,
  outputFrame: request.outputFrame,
  sourceArtifacts: [{
    artifactId: renderRef.id,
    checksumSha256: renderSha,
    width: 1_920,
    height: 1_080,
    durationFrames: 360,
    frameRate,
  }],
  comparisonArtifacts: [],
  observations: [{
    observationId: 'caption-postrender-safe-region-1',
    artifactId: renderRef.id,
    sceneId: 'caption-scene-1',
    range: wholeTimeline,
    role: 'safe_candidate',
    regionBasisPoints: { x: 600, y: 6_500, width: 8_800, height: 2_400 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 8_700,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 1_200,
    cropResilienceBasisPoints: 8_800,
    compositionBalanceBasisPoints: 8_500,
    findingIds: [],
    evidenceRefs: [semanticEvidenceRef],
    uncertaintyCode: null,
    semanticGeometryOnly: true,
    deterministicPixelGeometryClaimed: false,
  }],
  actualVisualInferenceObserved: true,
  exactCanonicalPrivateMediaSuppliedToProvider: true,
  providerVisualPreprocessingExpected: true,
  providerPreprocessingIsExactFrameInspection: false,
  everyTimelineFrameInspected: false,
  completeTimePixelInspectionClaimAllowed: false,
  immutableSpatialEvidence: true,
  directTimelineMutationAllowed: false,
  renderPerformedByVisualIntelligence: false,
  qaApprovalGranted: false,
  assetMutationAllowed: false,
  billingMutationAllowed: false,
  exportAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorized: false,
})
const inspectionResult = createVisualInspectionResult({
  schemaVersion: 'visual-inspection-result-v1',
  inspectionRef: requirementRef(),
  reportRef: reportRef(),
  disposition: 'pass',
  owningSkillId: 'captions',
  findingIds: [],
  repairCycle: 0,
  routeToOwningSkill: false,
  automaticRepairAllowed: false,
  automaticSpendStopped: false,
  blocksNextWorkNode: false,
  blocksPreview: false,
  blocksFinalExport: false,
  planningOrHumanReviewRequired: false,
  visualIntelligenceMutatedEdit: false,
})

const resultInput = {
  resultId: 'canonical-caption-postrender-visual-intelligence-result-1',
  approvedSnapshotRef,
  executionPackageRef,
  approvedWorkItemRef,
  deterministicCompleteTimeQaRef,
  independentArtifactQaRef,
  assetManifestReconciliationRef,
  confirmedOutputFrameBindingDigestSha256:
    confirmedOutputBinding.confirmedOutputFrameBindingDigestSha256,
  captionConfirmedOutputFrameRef: captionOutputFrameRef,
  confirmationRecordId: 'caption-output-confirmation-1',
  requirement,
  request,
  report,
  spatialEvidence,
  inspectionResult,
  deterministicAndSemanticEvidenceAgree: true,
  exactApprovedPrivateRenderRereadVerified: true as const,
}
const result = createCanonicalCaptionPostrenderVisualIntelligenceResult(
  resultInput)

check(parseCanonicalCaptionPostrenderVisualIntelligenceResult(result)
  .decision === 'passed',
'A real Visual Intelligence pass must produce a passed Caption bridge result.')
check(result.providerCapabilityId === 'visual_intelligence'
  && result.providerModelId === 'gemini-3.1-pro-preview'
  && !result.qwenVisualFallbackUsed,
'New Caption post-render review must use Visual Intelligence without Qwen.')
check(result.completeRequestedRangeSemanticCoverageVerified
  && result.completeTimelineCompositeReviewPassed,
'Gapless semantic coverage plus deterministic QA must pass the composite review.')
check(!result.semanticModelEveryTimelineFrameInspectedClaimed
  && !result.semanticModelExactPixelInspectionClaimed
  && result.deterministicEveryFrameTechnicalQaRemainsSeparate,
'Semantic inspection must never impersonate every-frame deterministic QA.')
check(!result.providerRuntimeAuthority && !result.qaApprovalAuthority
  && !result.repairExecutionAuthority && !result.publicDeliveryAuthority,
'The Caption projection must not inherit execution, QA, repair, or delivery authority.')

tamper((value) => { value.qwenVisualFallbackUsed = true as false })
tamper((value) => {
  value.semanticModelEveryTimelineFrameInspectedClaimed = true as false
})
tamper((value) => { value.output.frameCount = 359 })
tamper((value) => { value.decision = 'repair_required' })
tamper((value) => { value.scope.approvedSnapshotId = 'crossed-snapshot' })
tamper((value) => { value.providerModelId = 'qwen2.5-vl-7b-instruct' as never })

assert.throws(() => createCanonicalCaptionPostrenderVisualIntelligenceResult({
  ...resultInput,
  resultId: 'crossed-caption-postrender-result',
  report: { ...report, profile: 'caption_layout_qa' },
}))
assertions += 1
assert.throws(() => createCanonicalCaptionPostrenderVisualIntelligenceResult({
  ...resultInput,
  resultId: 'forged-execution-package-result',
  executionPackageRef: ref('forged-execution-package'),
}))
assertions += 1
assert.throws(() => createCanonicalCaptionPostrenderVisualIntelligenceResult({
  ...resultInput,
  resultId: 'forged-output-binding-result',
  confirmedOutputFrameBindingDigestSha256: ref('forged-binding').contentHash,
}))
assertions += 1

const ownerPort: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort = {
  portVersion:
    CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION,
  authorityBoundary: 'canonical_visual_intelligence_postrender_owner',
  async readPersistedResult() {
    return structuredClone(result)
  },
}
const ownerLocator = {
  ownerUserId: result.scope.ownerUserId,
  workspaceId: result.scope.workspaceId,
  projectId: result.scope.projectId,
  editSessionId: result.scope.editSessionId,
  approvedSnapshotId: result.scope.approvedSnapshotId,
  approvedWorkItemId: result.approvedWorkItemRef.id,
  outputId: result.output.outputId,
  confirmedOutputFrameRef: captionOutputFrameRef,
  requireCompleteRequestedRangeCoverage: true as const,
}
const reread = await readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult({
  port: ownerPort,
  locator: ownerLocator,
})
check(reread.resultDigestSha256 === result.resultDigestSha256,
  'The active owner port must reread the exact immutable result.')
await assert.rejects(() =>
  readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult({
    port: ownerPort,
    locator: { ...ownerLocator, approvedWorkItemId: 'crossed-work-item' },
  }))
assertions += 1
await assert.rejects(() =>
  readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult({
    port: undefined,
    locator: ownerLocator,
  }))
assertions += 1

const evidenceRepository =
  createControlledCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository()
const created =
  await persistCanonicalCaptionPostrenderVisualIntelligenceEvidence({
    repository: evidenceRepository,
    result,
  })
check(created.disposition === 'created' && created.exactRereadVerified,
  'Caption evidence must persist create-only and reread exactly.')
const replayed =
  await persistCanonicalCaptionPostrenderVisualIntelligenceEvidence({
    repository: evidenceRepository,
    result,
  })
check(replayed.disposition === 'idempotent_replay',
  'Exact Caption evidence replay must be idempotent.')
const crossed = createCanonicalCaptionPostrenderVisualIntelligenceResult({
    resultId: 'canonical-caption-postrender-visual-intelligence-result-2',
    approvedSnapshotRef: result.approvedSnapshotRef,
    executionPackageRef: result.executionPackageRef,
    approvedWorkItemRef: result.approvedWorkItemRef,
    deterministicCompleteTimeQaRef: result.deterministicCompleteTimeQaRef,
    independentArtifactQaRef: result.independentArtifactQaRef,
    assetManifestReconciliationRef: result.assetManifestReconciliationRef,
    confirmedOutputFrameBindingDigestSha256:
      result.output.confirmedOutputFrameBindingDigestSha256,
    captionConfirmedOutputFrameRef: captionOutputFrameRef,
    confirmationRecordId: result.output.confirmationRecordId,
    requirement,
    request,
    report,
    spatialEvidence,
    inspectionResult,
    deterministicAndSemanticEvidenceAgree: true,
    exactApprovedPrivateRenderRereadVerified: true,
  })
await assert.rejects(() =>
  persistCanonicalCaptionPostrenderVisualIntelligenceEvidence({
    repository: evidenceRepository,
    result: crossed,
  }))
assertions += 1

const durableObjects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(raw(input.body.toString('utf8')), input.contentSha256)
    if (durableObjects.has(input.objectPath)) return 'already_exists'
    durableObjects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(objectPath) {
    const value = durableObjects.get(objectPath)
    return value ? Buffer.from(value) : null
  },
}
const durableOwnerRepository =
  createCanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository({
    objectPort,
  })
const durableOwnerPersisted =
  await durableOwnerRepository.persistOwnerResultCreateOnly(result)
check(durableOwnerPersisted.disposition === 'created'
  && durableOwnerPersisted.exactRereadVerified,
'The Visual Intelligence owner result must persist create-only in its private durable namespace.')
const durableEvidenceRepository =
  createCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository({
    objectPort,
  })
const durableEvidencePersisted =
  await durableEvidenceRepository.persistCompletedEvidenceCreateOnly(result)
check(durableEvidencePersisted.disposition === 'created'
  && durableEvidencePersisted.exactRereadVerified
  && [...durableObjects.keys()].every((key) =>
    !key.includes(result.scope.ownerUserId)
    && !key.includes(result.output.outputId)),
'Caption reconciliation must persist separately with digest-only private object names.')
const ownerService =
  createCanonicalCaptionPostrenderVisualIntelligenceOwnerService({
    requestPackageStore: {
      async rereadCanonicalRequestByRef() {
        return structuredClone(request)
      },
      async rereadInspectionRequirementByRequestRef() {
        return structuredClone(requirement)
      },
    },
    reportRepository: {
      async readAcceptedByRef() {
        return structuredClone(report)
      },
    },
    spatialEvidenceRepository: {
      async readAcceptedSpatialEvidenceByReportRef() {
        return structuredClone(spatialEvidence)
      },
    },
    ownerResultRepository: durableOwnerRepository,
  })
const finalizationInput = {
    resultId: result.resultId,
    requestRef: requestRef(),
    reportRef: reportRef(),
    spatialEvidenceRef: {
      id: spatialEvidence.spatialEvidenceId,
      version: 1,
      contentHash: spatialEvidence.spatialEvidenceDigestSha256,
    },
    approvedSnapshotRef: result.approvedSnapshotRef,
    executionPackageRef: result.executionPackageRef,
    approvedWorkItemRef: result.approvedWorkItemRef,
    deterministicCompleteTimeQaRef: result.deterministicCompleteTimeQaRef,
    independentArtifactQaRef: result.independentArtifactQaRef,
    assetManifestReconciliationRef: result.assetManifestReconciliationRef,
    captionConfirmedOutputFrameRef: captionOutputFrameRef,
    confirmedOutputFrameBindingDigestSha256:
      result.output.confirmedOutputFrameBindingDigestSha256,
    confirmationRecordId: result.output.confirmationRecordId,
    deterministicAndSemanticEvidenceAgree: true,
    exactApprovedPrivateRenderRereadVerified: true as const,
  }
const ownerFinalization = await ownerService.finalize(finalizationInput)
check(ownerFinalization.disposition === 'idempotent_replay'
  && ownerFinalization.result.resultDigestSha256 === result.resultDigestSha256
  && !ownerFinalization.providerCallMadeByFinalizer,
'The production finalizer must derive the exact result only from canonical Visual Intelligence rereads.')
await assert.rejects(() => ownerService.finalize({
  ...finalizationInput,
  unexpectedAuthorityClaim: true,
} as never))
assertions += 1

const outputAuthority =
  createCanonicalCaptionPostrenderVisualQaOutputAuthority({
    authorityId: 'caption-visual-output-authority-1',
    ownerUserId: result.scope.ownerUserId,
    scope: {
      workspaceId: result.scope.workspaceId,
      projectId: result.scope.projectId,
      editSessionId: result.scope.editSessionId,
      approvedSnapshotId: result.scope.approvedSnapshotId,
    },
    output: {
      outputId: result.output.outputId,
      aspectRatio: result.output.aspectRatio,
      width: result.output.width,
      height: result.output.height,
      fps: result.output.fpsNumerator / result.output.fpsDenominator,
      confirmedOutputFrameRef:
        structuredClone(result.output.confirmedOutputFrameRef),
      confirmedByUser: true,
      confirmationRecordId: result.output.confirmationRecordId,
    },
    lifecycleState: 'waiting_for_qualified_ai',
    approvedSnapshotImmutable: true,
    exactConfirmedOutputFrameReread: true,
    browserLocalStateAccepted: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })
const authenticatedRead = await
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
    repository:
      createControlledCanonicalCaptionPostrenderVisualQaEvidenceRepository({
        authorities: [outputAuthority],
      }),
    visualIntelligenceRepository: evidenceRepository,
  }).read({
    authenticatedOwnerUserId: result.scope.ownerUserId,
    request: {
      schemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
      scope: {
        workspaceId: result.scope.workspaceId,
        projectId: result.scope.projectId,
        editSessionId: result.scope.editSessionId,
        approvedSnapshotId: result.scope.approvedSnapshotId,
      },
      requiredOutputs: [{
        outputId: result.output.outputId,
        aspectRatio: result.output.aspectRatio,
        confirmedOutputFrameRef: {
          ...structuredClone(result.output.confirmedOutputFrameRef),
          outputId: result.output.outputId,
          aspectRatio: result.output.aspectRatio,
          width: result.output.width,
          height: result.output.height,
          fps: result.output.fpsNumerator / result.output.fpsDenominator,
          confirmedByUser: true,
          confirmationRecordId: result.output.confirmationRecordId,
        },
      }],
      byteFreeRequest: true,
      browserLocalCompletionAccepted: false,
    },
  })
check(authenticatedRead.disposition === 'completed'
  && authenticatedRead.outputSetStatus?.state === 'passed'
  && authenticatedRead.outputSetStatus.everyOutputQualifiedVisualReviewPassed,
'Authenticated reload must project the active Visual Intelligence result without browser-local completion.')
const activeOnlyAuthenticatedRead = await
  createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService({
    visualIntelligenceRepository: evidenceRepository,
  }).read({
    authenticatedOwnerUserId: result.scope.ownerUserId,
    request: {
      schemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
      scope: structuredClone(authenticatedRead.scope),
      requiredOutputs: structuredClone(authenticatedRead.confirmedOutputs),
      byteFreeRequest: true,
      browserLocalCompletionAccepted: false,
    },
  })
check(activeOnlyAuthenticatedRead.disposition === 'completed'
  && activeOnlyAuthenticatedRead.outputSetStatus?.visualQaGateSatisfied,
'The production active repository must support exact authenticated reread without the retired Qwen authority store.')

const coordinatorRepository =
  createControlledCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository()
const coordinatorExecution =
  await prepareCanonicalCaptionPostrenderVisualQaExecution({
    context: {
      canonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort:
        ownerPort,
      canonicalCaptionPostrenderVisualIntelligenceEvidenceRepository:
        coordinatorRepository,
    } as ServiceContext,
    actorUserId: result.scope.ownerUserId,
    workspaceId: result.scope.workspaceId,
    projectId: result.scope.projectId,
    editSessionId: result.scope.editSessionId,
    approvedSnapshotId: result.scope.approvedSnapshotId,
    approvedWorkItemId: result.approvedWorkItemRef.id,
    executionInput: {
      schemaVersion:
        CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION,
      operation: CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
      outputId: result.output.outputId,
      confirmedOutputFrameRef: captionOutputFrameRef,
      masterTimingRef: {
        id: 'caption-master-timing-1',
        version: 'caption-master-timing-v1',
        contentHash: raw('caption-master-timing-1'),
      },
      canonicalMasterTimingId: 'caption-master-timing-1',
      finalRenderWorkItemKey: 'caption-final-render-work-1',
      finalRenderOutputKey: 'caption-final-render-output-1',
      deterministicQaWorkItemKey: 'caption-deterministic-qa-work-1',
      deterministicQaOutputKey: 'caption-deterministic-qa-output-1',
      visualInspectionRequirementSchemaVersion:
        'visual-inspection-requirement-v1',
      visualIntelligenceRequestSchemaVersion:
        'visual-intelligence-request-v1',
      visualIntelligenceReportSchemaVersion:
        'visual-intelligence-report-v1',
      visualIntelligenceSpatialEvidenceSchemaVersion:
        'visual-intelligence-spatial-evidence-v1',
      ownerResultSchemaVersion:
        'canonical-caption-postrender-visual-intelligence-result-v1',
      ownerCapabilityId: 'visual_intelligence',
      ownerOperationId: 'visual_intelligence.inspect_edit',
      requiredInspectionProfiles: ['final_render_visual_qa'],
      authenticatedCaptionReadRequired: true,
      ownerResultCreatedOutsideCaptionReconciliation: true,
      deterministicEveryFrameQaRequired: true,
      completeRequestedRangeSemanticCoverageRequired: true,
      semanticEveryFrameInspectionClaimAllowed: false,
      semanticExactPixelInspectionClaimAllowed: false,
      qwenVisualFallbackAllowed: false,
      rawPromptAccepted: false,
      browserCompletionAccepted: false,
      directPeerDispatchRequested: false,
      providerDispatchRequestedByCaption: false,
      assetMutationRequested: false,
      qaApprovalRequested: false,
      billingAuthorityRequested: false,
      publicDeliveryRequested: false,
      productionAuthorityRequested: false,
    },
  })
check(coordinatorExecution.disposition === 'created'
  && coordinatorExecution.exactRereadVerified
  && coordinatorExecution.ownerResult.resultDigestSha256
    === result.resultDigestSha256,
'The active Caption coordinator must consume and persist only the exact Visual Intelligence owner result.')

const dependencyWithoutDigest: Omit<
  CanonicalCaptionPrivateReviewDependencyBinding,
  'bindingDigestSha256'
> = {
  schemaVersion: 'canonical-caption-private-review-dependency-binding-v1',
  bindingId: 'caption-private-review-dependency-binding-1',
  planningProjectionRef: domainRef('caption-planning-projection-1'),
  renderedMediaWorkBindingRef: domainRef('caption-render-binding-1'),
  postrenderVisualQaWorkBindingRef:
    domainRef('caption-postrender-visual-binding-1'),
  outputId: result.output.outputId,
  confirmedOutputFrameRef: captionOutputFrameRef,
  masterTimingRef: domainRef('caption-master-timing-1'),
  canonicalMasterTimingId: 'caption-master-timing-1',
  requiredReviewArtifacts: [{
    role: 'final_captioned_render',
    workItemKey: 'caption-final-render-work-1',
    outputKey: 'caption-final-render-output-1',
    contentType: 'video/mp4',
  }, {
    role: 'deterministic_final_qa',
    workItemKey: 'caption-deterministic-qa-work-1',
    outputKey: 'caption-deterministic-qa-output-1',
    contentType: 'application/json',
  }, {
    role: 'qualified_complete_time_visual_review',
    workItemKey: 'caption-postrender-approved-work-item',
    outputKey: 'caption-postrender-visual-output-1',
    contentType: 'application/json',
  }],
  canonicalPrivateReview: {
    assemblyServiceId: 'canonical_private_review_assembly_service',
    assemblyResponseSchemaVersion:
      'canonical-private-review-assembly-response-v1',
    assemblyManifestSchemaVersion: 'canonical-private-review-manifest-v1',
    assemblyRoute:
      '/v1/edit-executions/packages/:packageRecordId/private-review-assemblies',
    decisionServiceId: 'canonical_private_review_decision_service',
    decisionResponseSchemaVersion:
      'canonical-private-review-decision-response-v1',
    decisionManifestSchemaVersion:
      'canonical-private-review-decision-manifest-v1',
    decisionRoute:
      '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/decisions',
  },
  everyRequiredArtifactRequiresCreateOnlyPersistence: true,
  everyRequiredArtifactRequiresIndependentQa: true,
  everyRequiredArtifactRequiresReconciliation: true,
  actualReviewAssemblyCreated: false,
  actualPrivateReviewDecisionRecorded: false,
  privateReviewAcceptanceClaimed: false,
  browserReviewCompletionAccepted: false,
  approvedSnapshotMutationGranted: false,
  additionalWorkCreationGranted: false,
  providerDispatchGranted: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const dependencyBinding: CanonicalCaptionPrivateReviewDependencyBinding = {
  ...dependencyWithoutDigest,
  bindingDigestSha256: calculateSkillContractDigest({
    ...dependencyWithoutDigest,
    bindingDigestSha256: '',
  } as unknown as Record<string, unknown>, 'bindingDigestSha256'),
}
const privateReviewProjection =
  buildCanonicalCaptionPrivateReviewEvidenceProjection({
    authority: {
      ownerUserId: result.scope.ownerUserId,
      workspaceId: result.scope.workspaceId,
      projectId: result.scope.projectId,
      editSessionId: result.scope.editSessionId,
      approvedSnapshotId: result.scope.approvedSnapshotId,
      approvedSnapshotHash: result.approvedSnapshotRef.contentHash.slice(7),
      planId: 'caption-plan-1',
      planVersion: 1,
      packageRecordId: result.executionPackageRef.id,
      packageHash: result.executionPackageRef.contentHash.slice(7),
      approvedVisualQaWorkItemId: result.approvedWorkItemRef.id,
      dependencyBinding,
    },
    completed: result,
    assembly: null,
    decision: null,
  })
check(privateReviewProjection.disposition ===
  'waiting_for_private_review_assembly'
  && privateReviewProjection.privateReviewAssemblyAllowed
  && !privateReviewProjection.terminalPrivateInternalQualificationEligible,
'The active Visual Intelligence pass may enter canonical private review but cannot self-approve it.')
if (privateReviewProjection.schemaVersion !==
    CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_V2_VERSION) {
  throw new Error(
    'Active Visual Intelligence private review must use projection V2.')
}
check(privateReviewProjection.sourceRefs.visualEvidenceOwner ===
  'visual_intelligence'
  && privateReviewProjection.sourceRefs.postrenderVisualEvidenceRef.id ===
    result.resultId
  && privateReviewProjection.sourceRefs.postrenderVisualEvidenceRef.version ===
    CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_RESULT_VERSION
  && privateReviewProjection.sourceRefs.postrenderVisualEvidenceRef
    .contentHash === result.resultDigestSha256.replace(/^sha256:/u, ''),
'Private-review V2 must preserve the exact active Visual Intelligence result identity without relabeling it as Qwen evidence.')
const relabeledPrivateReview = structuredClone(privateReviewProjection)
relabeledPrivateReview.sourceRefs.postrenderVisualEvidenceRef.version =
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION
relabeledPrivateReview.projectionDigestSha256 = calculateSkillContractDigest(
  relabeledPrivateReview as unknown as Record<string, unknown>,
  'projectionDigestSha256')
assert.throws(() => parseCanonicalCaptionPrivateReviewEvidenceProjection(
  relabeledPrivateReview))
assertions += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-postrender-visual-intelligence-result',
  assertions,
  activeVisualOwner: result.providerCapabilityId,
  exactModel: result.providerModelId,
  semanticEveryFrameClaimed:
    result.semanticModelEveryTimelineFrameInspectedClaimed,
  qwenFallbackUsed: result.qwenVisualFallbackUsed,
  actualRuntimeExecutedBySmoke: false,
}))

function toolExecution(tool: 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv') {
  return {
    tool,
    requirement: 'required' as const,
    executionClass: 'l4_gpu_standard' as const,
    releaseRef: ref(`${tool}-l4-release`),
    executionRef: ref(`${tool}-l4-execution`),
    substantiveCpuExecutionUsed: false as const,
    sourceArtifactChecksumBound: true as const,
  }
}

function domainRef(id: string) {
  return { id, version: `${id}.v1`, contentHash: raw(id) }
}

function requestRef() {
  return { id: request.requestId, version: 1,
    contentHash: request.requestDigestSha256 }
}

function reportRef() {
  return { id: report.reportId, version: 1,
    contentHash: report.reportDigestSha256 }
}

function requirementRef() {
  return { id: requirement.inspectionId, version: 1,
    contentHash: requirement.inspectionDigestSha256 }
}

function tamper(
  mutate: (value: typeof result) => void,
): void {
  const changed = structuredClone(result)
  mutate(changed)
  assert.throws(() =>
    parseCanonicalCaptionPostrenderVisualIntelligenceResult(changed))
  assertions += 1
}
