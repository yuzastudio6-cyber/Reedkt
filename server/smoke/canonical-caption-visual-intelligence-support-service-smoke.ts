import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import {
  CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
  type CaptionVisualIntelligenceSupportPayload,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionVisualIntelligenceEvidenceRepository,
  createCanonicalCaptionVisualIntelligenceSupportService,
  parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
  parseCaptionVisualIntelligenceSupportPayload,
} from '../services/canonical-caption-visual-intelligence-support-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import {
  createVisualIntelligenceAuthenticatedReadService,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceReport,
  createVisualIntelligenceRequest,
  createVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'

let assertions = 0
function check(condition: unknown, message: string): void {
  assert.ok(condition, message)
  assertions += 1
}

async function expectReject(operation: () => Promise<unknown>): Promise<void> {
  await assert.rejects(operation)
  assertions += 1
}

function raw(seed: string): string {
  return createHash('sha256').update(seed, 'utf8').digest('hex')
}

function domainRef(id: string, version = 'fixture-v1', hash = raw(id)):
CaptionDomainRef {
  return { id, version, contentHash: hash }
}

function visualRef(id: string, hash = raw(id)): VisualIntelligenceEvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function digest<T extends Record<string, unknown>>(
  value: T,
  field: string,
): string {
  return calculateSkillContractDigest(value, field)
}

const frameRate = { numerator: 30, denominator: 1 } as const
const visualRange = {
  startFrame: 90,
  endFrameExclusive: 240,
  frameRate,
} as const
const captionRange = { startFrame: 90, endFrameExclusive: 240 } as const
const snapshotHash = raw('snapshot-cap-vi')
const sourceHash = raw('rendered-caption-private-artifact')
const outputFrameHash = raw('confirmed-output-frame')
const outcomeHash = raw('caption-safe-placement-outcome')
const snapshotRef = domainRef(
  'snapshot.cap.vi',
  'approved-plan-snapshot-v1',
  snapshotHash,
)
const sourceRef = domainRef(
  'rendered.caption.private.artifact',
  'private-render-artifact-v1',
  sourceHash,
)
const expectedOutcomeRef = domainRef(
  'caption.safe.placement.outcome',
  'caption-outcome-v1',
  outcomeHash,
)
const captionScope: CaptionDomainCanonicalScope = {
  ownerUserId: 'user.cap.vi',
  workspaceId: 'workspace.cap.vi',
  projectId: 'project.cap.vi',
  editSessionId: 'edit.cap.vi',
  planVersionId: 'plan.cap.vi.v1',
  approvedSnapshotRef: snapshotRef,
  outputId: 'output.vertical',
  sceneId: 'scene.cap.vi',
  authorizedFrameRanges: [captionRange],
}
const skillScope: SkillCanonicalScope = {
  ownerUserId: captionScope.ownerUserId,
  workspaceId: captionScope.workspaceId,
  projectId: captionScope.projectId,
  editSessionId: captionScope.editSessionId,
  approvedSnapshotRef: snapshotRef,
  outputId: captionScope.outputId,
  sceneId: captionScope.sceneId,
  boundaryId: null,
  authorizedFrameRanges: [captionRange],
}

const manifestRef = domainRef('captions.manifest', 'skill-capability-manifest-v1')
const qualificationRef = domainRef(
  'captions.qualification',
  'skill-qualification-snapshot-v1',
)

const callWithoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
  schemaVersion: 'orchestra-skill-call-v1',
  callId: 'caption.call.visual.1',
  idempotencyKey: 'caption.call.visual.idempotency.1',
  caller: { callerKind: 'internal_test_harness', callerId: 'caption.cap20' },
  assigneeSkillKey: 'captions',
  job: {
    jobId: 'caption.job.resolve.subject.occlusion.1',
    jobType: 'resolve_subject_occluded_typography',
    requestedMode: 'private_internal',
    scopeLevel: 'scene',
  },
  canonicalScope: skillScope,
  manifestRef,
  qualificationSnapshotRef: qualificationRef,
  inputArtifactRefs: [],
  injectedSupportArtifactRefs: [],
  resumeOfSupportRequestRef: null,
  resumeOriginCallRef: null,
  authorityBoundary: closedAuthority(),
  privateArtifactPolicy: {
    tenantScoped: true,
    byteFreeCoordinationOnly: true,
    rawChatAllowed: false,
    mediaBytesAllowed: false,
    urlOrPathAllowed: false,
  },
}
const call = parseOrchestraSkillCall({
  ...callWithoutDigest,
  callDigestSha256: digest(callWithoutDigest, 'callDigestSha256'),
})
const callRef = contractRef(call.callId, call.schemaVersion, call.callDigestSha256)

const payloadWithoutDigest: Omit<
  CaptionVisualIntelligenceSupportPayload,
  'payloadDigestSha256'
> = {
  schemaVersion: CAPTION_VISUAL_INTELLIGENCE_SUPPORT_PAYLOAD_VERSION,
  payloadId: 'caption.visual.payload.rendered.1',
  purpose: 'rendered_caption_inspection',
  canonicalScope: captionScope,
  pictureLockRef: domainRef('picture.lock.cap.vi', 'canonical-picture-lock-v1'),
  finishReadinessRef:
    domainRef('caption.finish.cap.vi', 'caption-finish-readiness-v1'),
  confirmedOutputFrame: {
    outputId: captionScope.outputId,
    width: 1080,
    height: 1920,
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    fpsNumerator: 30,
    fpsDenominator: 1,
    confirmedOutputFrameDigestSha256: outputFrameHash,
  },
  sourcePrivateArtifactRef: sourceRef,
  canonicalLayoutOccupancyRef:
    domainRef('layout.occupancy.cap.vi', 'canonical-layout-occupancy-v1'),
  requestedSceneId: 'scene.cap.vi',
  requestedRange: captionRange,
  requiredObservationRoles: ['safe_candidate', 'face'],
  expectedOutcomeRefs: [expectedOutcomeRef],
  expectedVisualIntelligenceOperation: 'inspect_edit',
  expectedVisualIntelligenceProfile: 'caption_layout_qa',
  coveragePolicy: {
    completeRequestedRangeRequired: true,
    everyTimelineFrameInspectionClaimRequired: false,
    completeTimePixelInspectionClaimRequired: false,
    targetedFollowupRangesAllowed: true,
  },
  renderedInspectionPolicy: {
    actualRenderedPixelsRequired: true,
    directRasterInspectionStillRequired: true,
    deterministicQaStillRequired: true,
    independentFinalQaStillRequired: true,
  },
  byteFreeRequest: true,
  rawChatIncluded: false,
  mediaBytesIncluded: false,
  mediaLocatorIncluded: false,
  providerPromptIncluded: false,
  providerCredentialIncluded: false,
  providerOrModelSelectedByCaption: false,
  directPeerDispatchRequested: false,
  visualIntelligenceRemainsEvidenceOwner: true,
}
const payload = parseCaptionVisualIntelligenceSupportPayload({
  ...payloadWithoutDigest,
  payloadDigestSha256: digest(payloadWithoutDigest, 'payloadDigestSha256'),
})

const requestWithoutDigest: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
  schemaVersion: 'skill-support-request-v1',
  requestId: 'caption.visual.support.rendered.1',
  originalCallRef: callRef,
  requestingSkillKey: 'captions',
  targetSkillKey: 'visual_intelligence',
  reasonCode: 'caption_visual.rendered_caption_inspection.required',
  requestedArtifactTypes: [
    'caption_visual_intelligence_rendered_inspection_evidence',
  ],
  canonicalScope: skillScope,
  typedPayloadType: payload.schemaVersion,
  typedPayload: payload,
  mediationPolicy: {
    hqMediated: true,
    directPeerDispatchAllowed: false,
    assigneeMayOnlyResumeAfterInjection: true,
  },
  authorityBoundary: closedAuthority(),
}
const supportRequest = parseSkillSupportRequest({
  ...requestWithoutDigest,
  requestDigestSha256: digest(requestWithoutDigest, 'requestDigestSha256'),
})

const resultWithoutDigest: Omit<OrchestraSkillJobResult, 'resultDigestSha256'> = {
  schemaVersion: 'orchestra-skill-job-result-v1',
  resultId: 'caption.result.visual.followup.1',
  disposition: 'needs_followup',
  originalCallRef: callRef,
  producerSkillKey: 'captions',
  jobType: call.job.jobType,
  manifestRef,
  qualificationSnapshotRef: qualificationRef,
  canonicalScope: skillScope,
  producedArtifactRefs: [],
  supportRequests: [supportRequest],
  reasonCodes: ['caption_visual_support_required'],
  safeUserSummary: 'Caption visual evidence is waiting for authenticated support.',
  replayBinding: {
    idempotencyKey: call.idempotencyKey,
    resumedFromSupportRequestRef: null,
    resumeOriginCallRef: null,
  },
  authorityBoundary: closedAuthority(),
}
const result = parseOrchestraSkillJobResult({
  ...resultWithoutDigest,
  resultDigestSha256: digest(resultWithoutDigest, 'resultDigestSha256'),
})

const probeRef = visualRef('caption-render-probe')
const semanticRef = visualRef('caption-semantic-evidence')
const expectedVisualOutcomeRef = visualRef(
  expectedOutcomeRef.id,
  expectedOutcomeRef.contentHash,
)
const approvedSnapshotVisualRef = visualRef(snapshotRef.id, snapshotRef.contentHash)
const privatePreviewVisualRef = visualRef(sourceRef.id, sourceRef.contentHash)
const outputFrameVisualRef = visualRef('confirmed-output-frame', outputFrameHash)

const visualRequest = createVisualIntelligenceRequest({
  requestId: 'visual-caption-request-1',
  idempotencyKey: 'visual-caption-idempotency-1',
  scope: {
    ownerUserId: captionScope.ownerUserId,
    workspaceId: captionScope.workspaceId,
    projectId: captionScope.projectId,
    editSessionId: captionScope.editSessionId,
    approvedSnapshotId: snapshotRef.id,
  },
  operation: 'inspect_edit',
  profile: 'caption_layout_qa',
  sourceArtifacts: [{
    artifactId: sourceRef.id,
    mediaKind: 'video',
    contentType: 'video/mp4',
    checksumSha256: sourceRef.contentHash,
    byteLength: 1_000_000,
    width: 1080,
    height: 1920,
    durationFrames: 300,
    frameRate,
    finalizedMediaAuthorityRef: visualRef('finalized-caption-render'),
    immutableStorageObjectAuthorityRef: visualRef('caption-render-storage'),
    mediaProbeEvidenceRef: probeRef,
    privateArtifact: true,
    exactGenerationRereadRequiredAtDispatch: true,
  }],
  comparisonArtifacts: [],
  requestedRanges: [visualRange],
  requiredEvidenceRefs: [probeRef],
  expectedOutcomeRefs: [expectedVisualOutcomeRef],
  outputFrame: {
    outputId: captionScope.outputId,
    aspectRatioLabel: '9:16',
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    width: 1080,
    height: 1920,
    frameRate,
    confirmedOutputFrameRef: outputFrameVisualRef,
    confirmedByUser: true,
  },
  protectedZones: [],
  qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
  admission: {
    mode: 'approved_edit_inspection',
    authenticatedPrincipalRef: visualRef('authenticated-principal'),
    workspaceAuthorizationRef: visualRef('workspace-authorization'),
    approvedPlanSnapshotRef: approvedSnapshotVisualRef,
    approvedEstimateRef: visualRef('approved-estimate'),
    creditReservationRef: visualRef('credit-reservation'),
    privatePreviewArtifactRef: privatePreviewVisualRef,
    expectedOutcomeRefs: [expectedVisualOutcomeRef],
    workNodeRefs: [visualRef('visual-work-node')],
    timelineRefs: [visualRef('master-timing')],
    qaPolicyRef: visualRef('caption-visual-qa-policy'),
    costPreflight: {
      pricingSnapshotRef: visualRef('gemini-pricing-snapshot'),
      accountEffectiveRateAuthorityRef: visualRef('billing-account-rate'),
      currency: 'USD',
      maximumAuthorizedCostMicros: 100_000,
      estimatedMinimumCostMicros: 5_000,
      estimatedMaximumCostMicros: 20_000,
      serviceFeeIncluded: false,
      publicListPriceUsedAsSettlementAuthority: false,
      preflightPassed: true,
    },
    retentionPolicyRef: visualRef('private-retention-policy'),
    privacyPolicyRef: visualRef('private-artifact-policy'),
    providerReleaseRef: visualRef('gemini-provider-release'),
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
const visualRequestRef = requestRef(visualRequest)

const coverage = {
  requestedRanges: [visualRange],
  analyzedRanges: [visualRange],
  incompleteRanges: [],
  sceneBoundaryRefs: [visualRef('scene-boundaries')],
  samplingPolicies: [{
    policyId: 'caption-layout-complete-range',
    policyVersion: 'caption-layout-complete-range-v1',
    mode: 'scene_aware_complete_coverage' as const,
    targetFramesPerSecondNumerator: 2,
    targetFramesPerSecondDenominator: 1,
    sceneAware: true,
    highDetail: true,
    requestedRange: visualRange,
    analyzedRange: visualRange,
    samplingPolicyRef: visualRef('caption-sampling-policy'),
  }],
  targetedFollowupRanges: [],
  completeRequestedRangeCoverage: true,
  everyTimelineFrameInspected: false as const,
  completeTimePixelInspectionClaimAllowed: false as const,
}
const visualReport = createVisualIntelligenceReport({
  reportId: 'visual-intelligence-caption-report-1',
  requestRef: visualRequestRef,
  scope: visualRequest.scope,
  operation: visualRequest.operation,
  profile: visualRequest.profile,
  sourceArtifacts: [{
    artifactId: sourceRef.id,
    checksumSha256: sourceRef.contentHash,
    mediaKind: 'video',
    durationFrames: 300,
  }],
  comparisonArtifacts: [],
  coverage,
  semanticSummary: 'Caption placement has stable space and preserves the face.',
  segments: [],
  findings: [],
  evidence: [{
    evidenceId: 'caption-render-probe-evidence',
    evidenceRef: probeRef,
    artifactId: sourceRef.id,
    range: visualRange,
    authority: 'media_probe',
    producingTool: 'ffprobe',
    toolVersion: 'ffprobe-8.0',
    summary: 'Canonical media probe verified the rendered caption artifact.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }, {
    evidenceId: 'caption-semantic-evidence',
    evidenceRef: semanticRef,
    artifactId: sourceRef.id,
    range: visualRange,
    authority: 'semantic_visual_judgment',
    producingTool: 'gemini_pro_high',
    toolVersion: 'gemini-3.1-pro-preview',
    summary: 'Gemini Pro High identified stable placement and protected regions.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }],
  deterministicToolExecutions: [{
    tool: 'ffprobe',
    requirement: 'required',
    executionClass: 'l4_gpu_standard',
    releaseRef: visualRef('ffprobe-l4-release'),
    executionRef: visualRef('ffprobe-l4-execution'),
    substantiveCpuExecutionUsed: false,
    sourceArtifactChecksumBound: true,
  }],
  expectedOutcomeRefs: [expectedVisualOutcomeRef],
  disposition: 'pass',
  reinspectionRequired: false,
  usage: {
    promptTokenCount: 1_000,
    candidateTokenCount: 400,
    thinkingTokenCount: 600,
    cachedTokenCount: 0,
    totalTokenCount: 2_000,
    providerResponseId: 'gemini-caption-response-1',
    providerModelVersion: 'gemini-3.1-pro-preview',
    estimatedCostMicros: 8_000,
    settledCostMicros: 7_500,
    costEvidenceRef: visualRef('gemini-caption-cost-evidence'),
    billingAccountEffectiveRateUsed: true,
    publicListPriceUsed: false,
    duplicateSettlementPerformed: false,
    replayedFromCache: false,
    providerCallMade: true,
  },
  provenance: {
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
    mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
    promptVersion: 'visual-intelligence-provider-instruction-v2',
    responseSchemaVersion: 'visual-intelligence-provider-response-schema-v2',
    deterministicEvidenceVersion: 'visual-intelligence-deterministic-evidence-v1',
    transcriptVersion: null,
    ocrVersion: null,
    cacheIdentitySha256: `sha256:${raw('caption-cache-identity')}`,
    requestDigestSha256: visualRequest.requestDigestSha256,
    admissionRef: visualRef('caption-visual-admission'),
    providerReleaseRef: visualRequest.admission.providerReleaseRef,
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
const visualReportRef = reportRef(visualReport)

const spatialEvidence = createVisualIntelligenceSpatialEvidence({
  spatialEvidenceId: 'visual-intelligence-caption-spatial-1',
  requestRef: visualRequestRef,
  reportRef: visualReportRef,
  scope: visualRequest.scope,
  operation: visualRequest.operation,
  profile: visualRequest.profile,
  outputFrame: visualRequest.outputFrame,
  sourceArtifacts: [{
    artifactId: sourceRef.id,
    checksumSha256: sourceRef.contentHash,
    width: 1080,
    height: 1920,
    durationFrames: 300,
    frameRate,
  }],
  comparisonArtifacts: [],
  observations: [{
    observationId: 'caption-safe-candidate-1',
    artifactId: sourceRef.id,
    sceneId: captionScope.sceneId,
    range: visualRange,
    role: 'safe_candidate',
    regionBasisPoints: { x: 500, y: 6_000, width: 3_500, height: 1_800 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 8_800,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 1_500,
    cropResilienceBasisPoints: 8_500,
    compositionBalanceBasisPoints: 8_000,
    findingIds: [],
    evidenceRefs: [semanticRef],
    uncertaintyCode: null,
    semanticGeometryOnly: true,
    deterministicPixelGeometryClaimed: false,
  }, {
    observationId: 'caption-face-1',
    artifactId: sourceRef.id,
    sceneId: captionScope.sceneId,
    range: visualRange,
    role: 'face',
    regionBasisPoints: { x: 4_000, y: 800, width: 2_500, height: 3_000 },
    confidenceBasisPoints: 9_500,
    temporalStabilityBasisPoints: 9_000,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 2_000,
    cropResilienceBasisPoints: 7_500,
    compositionBalanceBasisPoints: 8_200,
    findingIds: [],
    evidenceRefs: [semanticRef],
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

async function main(): Promise<void> {
  const objectPort = memoryObjectPort()
  const supportResumeRepository =
    createCanonicalSpecialistSupportResumeRepository({ objectPort })
  const pair = createCanonicalSpecialistCallResultPair({
    call,
    result,
    persistedAt: '2026-08-05T03:00:00.000Z',
  })
  await supportResumeRepository.persistCallResultPairCreateOnly({ pair })
  const reportRepository = {
    async readAcceptedByRef(ref: VisualIntelligenceEvidenceRef) {
      return sameVisualRef(ref, visualReportRef) ? visualReport : null
    },
  }
  const evidenceRepository =
    createCanonicalCaptionVisualIntelligenceEvidenceRepository({ objectPort })
  const service = createCanonicalCaptionVisualIntelligenceSupportService({
    supportResumeRepository,
    visualIntelligenceRequestStore: {
      async rereadCanonicalRequestByRef({ requestRef: ref }) {
        return sameVisualRef(ref, visualRequestRef) ? visualRequest : null
      },
    },
    visualIntelligenceAuthenticatedReadService:
      createVisualIntelligenceAuthenticatedReadService({ reportRepository }),
    visualIntelligenceSpatialEvidenceRepository: {
      async readAcceptedSpatialEvidenceByReportRef(ref) {
        return sameVisualRef(ref, visualReportRef) ? spatialEvidence : null
      },
    },
    evidenceRepository,
  })
  const bridgeInput = {
    authenticatedOwnerUserId: captionScope.ownerUserId,
    priorCallRef: callRef,
    selectedSupportRequestRef: supportRequestRef(supportRequest),
    visualIntelligenceRequestRef: visualRequestRef,
    visualIntelligenceReportRef: visualReportRef,
  }
  const record = await service.projectAuthenticatedEvidence(bridgeInput)
  check(
    record.captionEvidencePacket.evidenceMode ===
      'authenticated_private_runtime'
      && record.captionEvidencePacket.actualVisualInferenceObserved
      && record.captionEvidencePacket.actualRenderedPixelsInspected,
    'Authenticated Gemini evidence must project actual rendered-source inspection.',
  )
  check(
    record.captionEvidencePacket.observations.length === 2
      && record.captionEvidencePacket.observations.every((item) =>
        item.measuredContrastRatioMilli === null),
    'Spatial observations must retain semantic geometry without invented contrast.',
  )
  check(
    record.authenticatedOwnerProjection.ownerKey === 'visual_intelligence'
      && record.authenticatedOwnerProjection.artifactRefs.length === 1
      && !record.providerCallPerformedByBridge,
    'The bridge must emit one neutral artifact without becoming a provider owner.',
  )
  check(
    record.captionEvidencePacket.coverage.completeRequestedRangeCoverage
      && !record.captionEvidencePacket.coverage.everyTimelineFrameInspected
      && !record.captionEvidencePacket.coverage
        .completeTimePixelInspectionClaimAllowed,
    'Complete requested-range coverage must not become every-frame pixel coverage.',
  )
  const replay = await service.projectAuthenticatedEvidence(bridgeInput)
  check(
    replay.recordDigestSha256 === record.recordDigestSha256,
    'An exact replay must reread the identical create-only evidence record.',
  )
  check(
    parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(record)
      .recordDigestSha256 === record.recordDigestSha256,
    'The durable bridge record must validate after detached reread.',
  )
  await expectReject(() => service.projectAuthenticatedEvidence({
    ...bridgeInput,
    authenticatedOwnerUserId: 'user.cross.tenant',
  }))
  await expectReject(() => service.projectAuthenticatedEvidence({
    ...bridgeInput,
    visualIntelligenceRequestRef: visualRef('wrong-request'),
  }))
  await expectReject(() => service.projectAuthenticatedEvidence({
    ...bridgeInput,
    visualIntelligenceReportRef: visualRef('wrong-report'),
  }))

  const missingRoleService = createCanonicalCaptionVisualIntelligenceSupportService({
    supportResumeRepository,
    visualIntelligenceRequestStore: {
      async rereadCanonicalRequestByRef() { return visualRequest },
    },
    visualIntelligenceAuthenticatedReadService:
      createVisualIntelligenceAuthenticatedReadService({ reportRepository }),
    visualIntelligenceSpatialEvidenceRepository: {
      async readAcceptedSpatialEvidenceByReportRef() {
        return createVisualIntelligenceSpatialEvidence({
          ...spatialWithoutDigest(spatialEvidence),
          spatialEvidenceId: 'visual-intelligence-caption-spatial-missing-role',
          observations: spatialEvidence.observations.filter((item) =>
            item.role !== 'face'),
        })
      },
    },
    evidenceRepository,
  })
  await expectReject(() => missingRoleService.projectAuthenticatedEvidence(
    bridgeInput,
  ))

  const crossSceneService = createCanonicalCaptionVisualIntelligenceSupportService({
    supportResumeRepository,
    visualIntelligenceRequestStore: {
      async rereadCanonicalRequestByRef() { return visualRequest },
    },
    visualIntelligenceAuthenticatedReadService:
      createVisualIntelligenceAuthenticatedReadService({ reportRepository }),
    visualIntelligenceSpatialEvidenceRepository: {
      async readAcceptedSpatialEvidenceByReportRef() {
        return createVisualIntelligenceSpatialEvidence({
          ...spatialWithoutDigest(spatialEvidence),
          spatialEvidenceId: 'visual-intelligence-caption-spatial-cross-scene',
          observations: spatialEvidence.observations.map((item) => ({
            ...item,
            sceneId: 'scene.cross.output',
          })),
        })
      },
    },
    evidenceRepository,
  })
  await expectReject(() => crossSceneService.projectAuthenticatedEvidence(
    bridgeInput,
  ))

  const tamperedRecord = structuredClone(record)
  tamperedRecord.captionEvidencePacket.observations[0]!.regionBasisPoints.x += 1
  assert.throws(() =>
    parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(
      tamperedRecord,
    ))
  assertions += 1

  const stalePayload = structuredClone(payload)
  stalePayload.canonicalScope.planVersionId = 'plan.stale.v2'
  assert.throws(() => parseCaptionVisualIntelligenceSupportPayload(stalePayload))
  assertions += 1

  const accessorPayload = structuredClone(payload) as unknown as
    Record<string, unknown>
  Object.defineProperty(accessorPayload, 'payloadId', {
    enumerable: true,
    get() { throw new Error('getter must not run') },
  })
  assert.throws(() => parseCaptionVisualIntelligenceSupportPayload(accessorPayload))
  assertions += 1

  const proxyPayload = new Proxy({}, {
    ownKeys() { throw new Error('proxy ownKeys must be contained') },
  })
  assert.throws(() => parseCaptionVisualIntelligenceSupportPayload(proxyPayload))
  assertions += 1

  check(
    record.providerCallPerformedByBridge === false
      && record.runtimeExecutionAuthorityGrantedToCaption === false
      && record.finalQaApprovalGrantedToCaption === false
      && record.costOrBillingAuthorityGrantedToCaption === false
      && record.productionAuthorityGranted === false,
    'The bridge must keep provider, runtime, QA, billing, and production closed.',
  )

  console.log(JSON.stringify({
    schemaVersion: 'canonical-caption-visual-intelligence-support-smoke-v1',
    assertions,
    supportRequestRef: record.supportRequestRef,
    reportRef: record.visualIntelligenceReportRef,
    spatialEvidenceRef: record.visualIntelligenceSpatialEvidenceRef,
    packetDigestSha256: record.captionEvidencePacket.packetDigestSha256,
    recordDigestSha256: record.recordDigestSha256,
    authenticatedPrivateRuntime: true,
    exactRequestedRangeCoverage: true,
    everyTimelineFrameInspectionClaimed: false,
    completeTimePixelInspectionClaimed: false,
    providerCallPerformedByBridge: false,
    runtimeAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    productionAuthorityGranted: false,
  }, null, 2))
}

function contractRef(id: string, version: string, contentHash: string):
SkillContractRef {
  return { id, version, contentHash }
}

function closedAuthority() {
  return {
    scopeExpansionGranted: false as const,
    timelineMutationGranted: false as const,
    directPeerDispatchGranted: false as const,
    providerCallGranted: false as const,
    runtimeExecutionGranted: false as const,
    assetCreationGranted: false as const,
    costAuthorityGranted: false as const,
    billingAuthorityGranted: false as const,
    qaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function requestRef(request: VisualIntelligenceRequest): VisualIntelligenceEvidenceRef {
  return {
    id: request.requestId,
    version: 1,
    contentHash: request.requestDigestSha256,
  }
}

function reportRef(report: { reportId: string; reportDigestSha256: string }):
VisualIntelligenceEvidenceRef {
  return {
    id: report.reportId,
    version: 1,
    contentHash: report.reportDigestSha256,
  }
}

function sameVisualRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function spatialWithoutDigest(
  value: typeof spatialEvidence,
): Omit<typeof spatialEvidence, 'schemaVersion' | 'spatialEvidenceDigestSha256'> {
  const {
    schemaVersion: _schemaVersion,
    spatialEvidenceDigestSha256: _digest,
    ...rest
  } = value
  void _schemaVersion
  void _digest
  return rest
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return Object.freeze({
    async createOnly(input: {
      readonly objectPath: string
      readonly body: Buffer
      readonly contentSha256: string
    }) {
      const existing = objects.get(input.objectPath)
      if (existing) {
        if (rawBuffer(existing) !== input.contentSha256) {
          throw new Error('create-only collision')
        }
        return 'already_exists' as const
      }
      if (rawBuffer(input.body) !== input.contentSha256) {
        throw new Error('content digest mismatch')
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created' as const
    },
    async readExact(path: string) {
      const value = objects.get(path)
      return value ? Buffer.from(value) : null
    },
  })
}

function rawBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

void main()
