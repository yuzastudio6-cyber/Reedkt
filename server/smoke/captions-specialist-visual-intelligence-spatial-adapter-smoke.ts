import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  VisualIntelligenceAuthenticatedReadResult,
  VisualIntelligenceReport,
  VisualIntelligenceSpatialEvidence,
  VisualIntelligenceSpatialObservation,
} from '../../src/types/visual-intelligence'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  type CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  type CanonicalAuthenticatedSpecialistSupportArtifactProjection,
} from '../../src/types/canonical-specialist-support-resume'
import {
  createCaptionFinalVisualHierarchy,
  createCaptionVisualIntelligenceSupport,
  createCaptionVisualOccupancyManifest,
} from '../captions-specialist/caption-visual-intelligence-support'
import {
  CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT,
  parseCaptionVisualIntelligenceSpatialAdapterReceipt,
  projectCaptionVisualIntelligenceSpatialEvidence,
} from '../captions-specialist/caption-visual-intelligence-spatial-adapter'
import {
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT,
  parseCaptionCanonicalVisualIntelligenceEvidenceReadReceipt,
  parseCaptionCanonicalVisualIntelligenceEvidenceRecord,
} from '../captions-specialist/caption-canonical-visual-intelligence-evidence-read'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  resumeCaptionsHarnessCall,
} from '../internal-testing/captions-specialist-harness'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalValue(item)]))
}
function viDigest(value: unknown): string {
  return `sha256:${hash(JSON.stringify(canonicalValue(value)))}`
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  Reflect.deleteProperty(clone, digestField)
  return { ...clone, [digestField]: viDigest(clone) }
}
function ref(id: string, version = 'fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}
function viRef(id: string) {
  return { id, version: 1, contentHash: `sha256:${hash(id)}` }
}

const range = { startFrame: 90, endFrameExclusive: 240 }
const frameRange = {
  ...range,
  frameRate: { numerator: 30, denominator: 1 },
}
const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'owner.spatial',
  workspaceId: 'workspace.spatial',
  projectId: 'project.spatial',
  editSessionId: 'edit.spatial',
  planVersionId: 'plan.spatial.v1',
  approvedSnapshotRef: ref('snapshot.spatial', 'approved-plan-snapshot-v1'),
  outputId: 'output.spatial',
  sceneId: 'scene.spatial',
  authorizedFrameRanges: [range],
}
const sourceArtifactRef = ref(
  'artifact.near-final.spatial', 'private-visual-artifact-v1')
const expectedOutcomeRefs = [
  ref('outcome.caption.safe'), ref('outcome.visual.hierarchy'),
]
const support = createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.spatial.payload',
  requestId: 'caption.visual.spatial.support',
  idempotencyKey: 'caption.visual.spatial.idempotency',
  originalCallRef: ref(
    'caption.visual.spatial.call', 'orchestra-skill-call-v1'),
  purpose: 'final_frame_occupancy',
  canonicalScope: scope,
  pictureLockRef: ref('picture.lock.spatial'),
  finishReadinessRef: ref('finish.readiness.spatial'),
  confirmedOutputFrame: {
    outputId: 'output.spatial',
    width: 1080,
    height: 1920,
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    fpsNumerator: 30,
    fpsDenominator: 1,
    confirmedOutputFrameDigestSha256: hash('output.spatial.frame'),
  },
  sourcePrivateArtifactRef: sourceArtifactRef,
  canonicalLayoutOccupancyRef: ref('layout.occupancy.spatial'),
  requiredObservationRoles: [
    'safe_candidate', 'face', 'screen_text', 'broll_panel', 'living_frame',
  ],
  expectedOutcomeRefs,
})
const viScope = {
  ownerUserId: scope.ownerUserId,
  workspaceId: scope.workspaceId,
  projectId: scope.projectId,
  editSessionId: scope.editSessionId,
  approvedSnapshotId: scope.approvedSnapshotRef!.id,
}
const visualRequestRef = viRef('visual.request.spatial')
const observationEvidenceRefs = [
  viRef('visual.evidence.safe'),
  viRef('visual.evidence.face'),
  viRef('visual.evidence.screen'),
  viRef('visual.evidence.broll'),
  viRef('visual.evidence.living'),
]
const reportWithoutDigest: Omit<VisualIntelligenceReport,
  'reportDigestSha256'> = {
  schemaVersion: 'visual-intelligence-report-v1',
  reportId: 'visual.report.spatial',
  requestRef: visualRequestRef,
  scope: viScope,
  operation: 'inspect_edit',
  profile: 'caption_layout_qa',
  sourceArtifacts: [{
    artifactId: sourceArtifactRef.id,
    checksumSha256: sourceArtifactRef.contentHash,
    mediaKind: 'video',
    durationFrames: range.endFrameExclusive,
  }],
  comparisonArtifacts: [],
  coverage: {
    requestedRanges: [frameRange],
    analyzedRanges: [frameRange],
    incompleteRanges: [],
    sceneBoundaryRefs: [],
    samplingPolicies: [{
      policyId: 'sampling.caption.spatial',
      policyVersion: 'sampling-v1',
      mode: 'scene_aware_complete_coverage',
      targetFramesPerSecondNumerator: 2,
      targetFramesPerSecondDenominator: 1,
      sceneAware: true,
      highDetail: true,
      requestedRange: frameRange,
      analyzedRange: frameRange,
      samplingPolicyRef: viRef('sampling.policy.spatial'),
    }],
    targetedFollowupRanges: [],
    completeRequestedRangeCoverage: true,
    everyTimelineFrameInspected: false,
    completeTimePixelInspectionClaimAllowed: false,
  },
  semanticSummary: 'Semantic spatial evidence for Caption occupancy.',
  segments: [{
    segmentId: 'segment.spatial',
    artifactId: sourceArtifactRef.id,
    range: frameRange,
    sceneId: scope.sceneId,
    summary: 'Caption occupancy segment.',
    subjectIds: ['speaker.spatial'],
    objectIds: [],
    actionLabels: ['speaking'],
    visibleTextEvidenceRefs: [],
    transcriptEvidenceRefs: [],
    evidenceRefs: observationEvidenceRefs,
    confidenceBasisPoints: 9_000,
    uncertainty: null,
    sourcePlanning: null,
  }],
  findings: [],
  evidence: observationEvidenceRefs.map((evidenceRef, index) => ({
    evidenceId: `visual.evidence.record.${index + 1}`,
    evidenceRef,
    artifactId: sourceArtifactRef.id,
    range: frameRange,
    authority: 'semantic_visual_judgment' as const,
    producingTool: 'gemini_pro_high' as const,
    toolVersion: 'gemini-3.1',
    summary: `Bounded semantic observation ${index + 1}.`,
    privateEvidence: true as const,
    providerInstructionAccepted: false as const,
  })),
  deterministicToolExecutions: [],
  expectedOutcomeRefs: expectedOutcomeRefs.map((item) => ({
    id: item.id,
    version: 1,
    contentHash: `sha256:${item.contentHash}`,
  })),
  disposition: 'pass',
  reinspectionRequired: false,
  usage: {
    promptTokenCount: 100,
    candidateTokenCount: 100,
    thinkingTokenCount: 100,
    cachedTokenCount: 0,
    totalTokenCount: 300,
    providerResponseId: 'provider.response.spatial',
    providerModelVersion: 'gemini-3.1-pro-preview-v1',
    estimatedCostMicros: 1_000,
    settledCostMicros: 1_000,
    costEvidenceRef: viRef('cost.evidence.spatial'),
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
    promptVersion: 'caption-spatial-prompt-v1',
    responseSchemaVersion: 'visual-intelligence-response-schema-v2',
    deterministicEvidenceVersion: 'visual-evidence-v1',
    transcriptVersion: null,
    ocrVersion: null,
    cacheIdentitySha256: `sha256:${hash('cache.spatial')}`,
    requestDigestSha256: visualRequestRef.contentHash,
    admissionRef: viRef('admission.spatial'),
    providerReleaseRef: viRef('provider.release.spatial'),
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
}
const report = {
  ...reportWithoutDigest,
  reportDigestSha256: viDigest(reportWithoutDigest),
} satisfies VisualIntelligenceReport
const visualReportRef = {
  id: report.reportId,
  version: 1,
  contentHash: report.reportDigestSha256,
}
const readWithoutDigest: Omit<VisualIntelligenceAuthenticatedReadResult,
  'resultDigestSha256'> = {
  schemaVersion: 'visual-intelligence-authenticated-read-result-v1',
  disposition: 'completed',
  requestRef: viRef('visual.read.spatial'),
  scope: viScope,
  requestedReportRef: visualReportRef,
  report,
  authenticatedPrincipalVerified: true,
  exactCanonicalScopeReread: true,
  immutableReportReread: true,
  browserLocalStateUsed: false,
  rawProviderPayloadIncluded: false,
  mediaBytesIncluded: false,
  pathsOrUrlsIncluded: false,
  authorityBoundary: {
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    repairExecutionAuthority: false,
    timelineMutationAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingMutationAuthority: false,
    exportAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  },
}
const readResult = {
  ...readWithoutDigest,
  resultDigestSha256: viDigest(readWithoutDigest),
} satisfies VisualIntelligenceAuthenticatedReadResult

function spatialObservation(
  observationId: string,
  role: VisualIntelligenceSpatialObservation['role'],
  evidenceRef: VisualIntelligenceSpatialObservation['evidenceRefs'][number],
  regionBasisPoints: VisualIntelligenceSpatialObservation['regionBasisPoints'],
): VisualIntelligenceSpatialObservation {
  return {
    observationId,
    artifactId: sourceArtifactRef.id,
    sceneId: scope.sceneId,
    range: frameRange,
    role,
    regionBasisPoints,
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 9_000,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 1_000,
    cropResilienceBasisPoints: 9_000,
    compositionBalanceBasisPoints: 8_000,
    findingIds: [],
    evidenceRefs: [evidenceRef],
    uncertaintyCode: null,
    semanticGeometryOnly: true,
    deterministicPixelGeometryClaimed: false,
  }
}
const observations: VisualIntelligenceSpatialObservation[] = [
  spatialObservation('region.safe.spatial', 'safe_candidate',
    observationEvidenceRefs[0]!, { x: 600, y: 7_000, width: 3_000, height: 1_200 }),
  spatialObservation('region.face.spatial', 'face',
    observationEvidenceRefs[1]!, { x: 4_000, y: 800, width: 2_000, height: 2_500 }),
  spatialObservation('region.screen.spatial', 'screen_text',
    observationEvidenceRefs[2]!, { x: 6_500, y: 6_000, width: 2_000, height: 1_000 }),
  spatialObservation('region.broll.spatial', 'broll_panel',
    observationEvidenceRefs[3]!, { x: 6_500, y: 0, width: 3_500, height: 5_000 }),
  spatialObservation('region.living.spatial', 'living_frame',
    observationEvidenceRefs[4]!, { x: 0, y: 0, width: 3_000, height: 5_000 }),
]
const spatialWithoutDigest: Omit<VisualIntelligenceSpatialEvidence,
  'spatialEvidenceDigestSha256'> = {
  schemaVersion: 'visual-intelligence-spatial-evidence-v1',
  spatialEvidenceId: 'visual.spatial.evidence.caption',
  requestRef: visualRequestRef,
  reportRef: visualReportRef,
  scope: viScope,
  operation: 'inspect_edit',
  profile: 'caption_layout_qa',
  outputFrame: {
    outputId: support.payload.confirmedOutputFrame.outputId,
    aspectRatioLabel: '9:16',
    aspectRatioNumerator: 9,
    aspectRatioDenominator: 16,
    width: 1080,
    height: 1920,
    frameRate: { numerator: 30, denominator: 1 },
    confirmedOutputFrameRef: {
      id: 'confirmed.frame.spatial',
      version: 1,
      contentHash:
        `sha256:${support.payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256}`,
    },
    confirmedByUser: true,
  },
  sourceArtifacts: [{
    artifactId: sourceArtifactRef.id,
    checksumSha256: sourceArtifactRef.contentHash,
    width: 1080,
    height: 1920,
    durationFrames: range.endFrameExclusive,
    frameRate: { numerator: 30, denominator: 1 },
  }],
  comparisonArtifacts: [],
  observations,
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
}
const spatialEvidence = {
  ...spatialWithoutDigest,
  spatialEvidenceDigestSha256: viDigest(spatialWithoutDigest),
} satisfies VisualIntelligenceSpatialEvidence

const output = projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.packet',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence,
})
check(output.packet.evidenceMode === 'authenticated_private_runtime'
  && output.packet.actualVisualInferenceObserved
  && output.packet.canonicalReportRereadVerified,
'The adapter projects an exact authenticated report and spatial companion.')
check(output.packet.observations.length === observations.length
  && output.packet.observations.every((item) =>
    item.measuredContrastRatioMilli === null),
'Semantic geometry preserves the Visual Intelligence v1 contrast limitation.')
check(!output.packet.actualRenderedPixelsInspected
  && !output.packet.providerCallMadeByCaption
  && !output.packet.visualIntelligenceGrantedFinalQa
  && !output.packet.productionAuthorityGranted,
'The projection grants Caption no provider, rendered-inspection, or QA authority.')

const occupancy = createCaptionVisualOccupancyManifest({
  manifestId: 'caption.visual.spatial.occupancy',
  packet: output.packet,
  payload: support.payload,
  supportRequest: support.supportRequest,
})
check(occupancy.evidenceQualifiedForPrivateRuntime
  && occupancy.safeCandidateRegionIds.length === 0
  && occupancy.blockerCodes.includes('caption_visual.no_safe_candidate'),
'Authenticated semantic geometry cannot select a stable region without contrast.')
const hierarchy = createCaptionFinalVisualHierarchy({
  hierarchyId: 'caption.visual.spatial.hierarchy',
  occupancyManifest: occupancy,
})
check(hierarchy.qualificationState === 'blocked_no_safe_region'
  && hierarchy.accessibleCaptionRegionId === null,
'Caption final placement stays closed until pixel-bound readability evidence exists.')

const runtimeCallSeed = createCaptionsHarnessCall({
  callId: 'captions.visual.spatial.runtime',
  jobType: 'plan_caption_blocking_preview',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
})
const runtimeCallWithoutDigest = {
  ...structuredClone(runtimeCallSeed),
  canonicalScope: {
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotRef: structuredClone(scope.approvedSnapshotRef),
    outputId: scope.outputId,
    sceneId: scope.sceneId,
    boundaryId: null,
    authorizedFrameRanges: structuredClone(scope.authorizedFrameRanges),
  },
}
const runtimeCall = parseOrchestraSkillCall({
  ...runtimeCallWithoutDigest,
  callDigestSha256: calculateSkillContractDigest(
    { ...runtimeCallWithoutDigest, callDigestSha256: '' },
    'callDigestSha256'),
})
const runtimeSupport = createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.spatial.runtime.payload',
  requestId: `${runtimeCall.callId}.support.visual_intelligence`,
  idempotencyKey: runtimeCall.idempotencyKey,
  originalCallRef: {
    id: runtimeCall.callId,
    version: runtimeCall.schemaVersion,
    contentHash: runtimeCall.callDigestSha256,
  },
  purpose: 'final_frame_occupancy',
  canonicalScope: scope,
  pictureLockRef: support.payload.pictureLockRef,
  finishReadinessRef: support.payload.finishReadinessRef,
  confirmedOutputFrame: support.payload.confirmedOutputFrame,
  sourcePrivateArtifactRef: support.payload.sourcePrivateArtifactRef,
  canonicalLayoutOccupancyRef: support.payload.canonicalLayoutOccupancyRef,
  requiredObservationRoles: support.payload.requiredObservationRoles,
  expectedOutcomeRefs,
})
const runtimeInitialResult = runCaptionsSpecialistJob({
  call: runtimeCall,
  visualIntelligenceSupportPayload: runtimeSupport.payload,
})
check(runtimeInitialResult.disposition === 'needs_followup'
  && runtimeInitialResult.supportRequests.length === 1
  && runtimeInitialResult.supportRequests[0].requestDigestSha256
    === runtimeSupport.supportRequest.requestDigestSha256
  && runtimeInitialResult.supportRequests[0].requestedArtifactTypes.join('|')
    === 'caption_visual_intelligence_occupancy_evidence',
'The integration runtime emits the exact typed Caption Visual Intelligence request.')

const runtimeProjection = projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.runtime.packet',
  payload: runtimeSupport.payload,
  supportRequest: runtimeInitialResult.supportRequests[0],
  authenticatedReadResult: readResult,
  spatialEvidence,
})
const runtimeRequest = runtimeInitialResult.supportRequests[0]
const runtimeSupportRequestRef = {
  id: runtimeRequest.requestId,
  version: runtimeRequest.schemaVersion,
  contentHash: runtimeRequest.requestDigestSha256,
}
const runtimePacketArtifact = {
  id: runtimeProjection.packet.packetId,
  version: runtimeProjection.packet.schemaVersion,
  contentHash: runtimeProjection.packet.packetDigestSha256,
  artifactType: runtimeRequest.requestedArtifactTypes[0],
  producerSkillKey: 'visual_intelligence',
  privateArtifact: true as const,
  byteFreeRef: true as const,
  sourceSupportRequestRef: runtimeSupportRequestRef,
}
let runtimeResumedCall = resumeCaptionsHarnessCall(runtimeCall, runtimeRequest)
runtimeResumedCall.injectedSupportArtifactRefs = [runtimePacketArtifact]
runtimeResumedCall = parseOrchestraSkillCall({
  ...runtimeResumedCall,
  callDigestSha256: calculateSkillContractDigest(
    { ...runtimeResumedCall, callDigestSha256: '' },
    'callDigestSha256'),
})
const canonicalProjectionWithoutDigest: Omit<
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  'projectionDigestSha256'
> = {
  schemaVersion:
    CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  projectionId: 'canonical.caption.visual.spatial.projection',
  originalCallRef: structuredClone(runtimeRequest.originalCallRef),
  supportRequestRef: structuredClone(runtimeSupportRequestRef),
  ownerResultRef: structuredClone(
    runtimeProjection.packet.authenticatedReadResultRef!),
  ownerKey: 'visual_intelligence',
  canonicalScope: structuredClone(runtimeRequest.canonicalScope),
  artifactRefs: [structuredClone(runtimePacketArtifact)],
  authenticatedPrincipalVerified: true,
  exactApprovedSnapshotReread: true,
  exactCanonicalScopeReread: true,
  exactOwnerResultReread: true,
  ownerResultPersistedBeforeProjection: true,
  browserLocalStateUsed: false,
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
  directPeerDispatchPerformed: false,
  timelineMutationPerformed: false,
  runtimeExecutionAuthorityGrantedToSpecialist: false,
  assetMutationAuthorityGrantedToSpecialist: false,
  costOrBillingAuthorityGrantedToSpecialist: false,
  finalQaApprovalGrantedToSpecialist: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const canonicalProjection = {
  ...canonicalProjectionWithoutDigest,
  projectionDigestSha256: calculateSkillContractDigest({
    ...canonicalProjectionWithoutDigest,
    projectionDigestSha256: '',
  }, 'projectionDigestSha256'),
} satisfies CanonicalAuthenticatedSpecialistSupportArtifactProjection
const canonicalRecordWithoutDigest: Omit<
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
  'recordDigestSha256'
> = {
  schemaVersion:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  recordId: 'canonical.caption.visual.spatial.record',
  originalCallRef: structuredClone(runtimeRequest.originalCallRef),
  supportRequestRef: structuredClone(runtimeSupportRequestRef),
  supportRequest: structuredClone(runtimeRequest),
  supportPayload: structuredClone(runtimeSupport.payload),
  visualIntelligenceRequestRef: structuredClone(visualRequestRef),
  visualIntelligenceReportRef: structuredClone(visualReportRef),
  visualIntelligenceSpatialEvidenceRef: {
    id: spatialEvidence.spatialEvidenceId,
    version: 1,
    contentHash: spatialEvidence.spatialEvidenceDigestSha256,
  },
  authenticatedReadResultRef: structuredClone(
    runtimeProjection.packet.authenticatedReadResultRef!),
  captionEvidencePacket: structuredClone(runtimeProjection.packet),
  authenticatedOwnerProjection: canonicalProjection,
  authenticatedPrincipalVerified: true,
  priorCallAndSupportRequestExactReread: true,
  canonicalVisualIntelligenceRequestExactReread: true,
  immutableReportExactReread: true,
  immutableSpatialEvidenceExactReread: true,
  exactCaptionScopeOutputSceneRangeAndArtifactBindingVerified: true,
  exactExpectedOutcomeLineageVerified: true,
  exactRequiredObservationRoleCoverageVerified: true,
  ownerProjectionCreateOnlyPersisted: true,
  evidenceRecordCreateOnlyPersisted: true,
  browserLocalStateUsed: false,
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
  directPeerDispatchPerformed: false,
  providerCallPerformedByBridge: false,
  timelineMutationPerformed: false,
  runtimeExecutionAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  costOrBillingAuthorityGrantedToCaption: false,
  finalQaApprovalGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const canonicalRecord = parseCaptionCanonicalVisualIntelligenceEvidenceRecord({
  ...canonicalRecordWithoutDigest,
  recordDigestSha256: calculateSkillContractDigest({
    ...canonicalRecordWithoutDigest,
    recordDigestSha256: '',
  }, 'recordDigestSha256'),
})
const runtimeCompletedResult = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeRequest,
  canonicalVisualIntelligenceEvidenceRecord: canonicalRecord,
})
check(runtimeCompletedResult.disposition === 'completed'
  && runtimeCompletedResult.reasonCodes.includes(
    'visual_intelligence.authenticated_admission.accepted')
  && runtimeCompletedResult.producedArtifactRefs[0].contentHash
    !== runtimeInitialResult.resultDigestSha256,
'The Caption runtime completes only after admitting the exact authenticated packet.')

const canonicalReceipt =
  parseCaptionCanonicalVisualIntelligenceEvidenceReadReceipt(
    CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT)
const canonicalPublicTypeSha = hash(readFileSync(new URL(
  '../../src/types/canonical-caption-visual-intelligence-support.ts',
  import.meta.url)))
check(canonicalReceipt.backendSource.sourceCommit
  === '57919eeda74a656714fba4b3b67b81cfb2a32aa3'
  && canonicalReceipt.backendSource.publicTypeFileSha256
    === canonicalPublicTypeSha
  && canonicalReceipt.consumedRecordVersion === canonicalRecord.schemaVersion,
'Caption freezes and consumes the exact canonical backend evidence record type.')

const tamperedCanonicalRecord = structuredClone(canonicalRecord)
tamperedCanonicalRecord.authenticatedOwnerProjection.ownerResultRef.id =
  'visual.read.crossed'
tamperedCanonicalRecord.authenticatedOwnerProjection.projectionDigestSha256 =
  calculateSkillContractDigest({
    ...tamperedCanonicalRecord.authenticatedOwnerProjection,
    projectionDigestSha256: '',
  }, 'projectionDigestSha256')
tamperedCanonicalRecord.recordDigestSha256 = calculateSkillContractDigest({
  ...tamperedCanonicalRecord,
  recordDigestSha256: '',
}, 'recordDigestSha256')
const tamperedCanonicalResult = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeRequest,
  canonicalVisualIntelligenceEvidenceRecord: tamperedCanonicalRecord,
})
check(tamperedCanonicalResult.disposition === 'blocked'
  && tamperedCanonicalResult.reasonCodes.join('|')
    === 'input.visual_intelligence.canonical_record.invalid',
'A digest-valid crossed canonical owner-result projection fails closed.')

const unknownCanonicalRecord = structuredClone(canonicalRecord) as unknown as
  Record<string, unknown>
unknownCanonicalRecord.unknownField = true
unknownCanonicalRecord.recordDigestSha256 = calculateSkillContractDigest({
  ...unknownCanonicalRecord,
  recordDigestSha256: '',
}, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  unknownCanonicalRecord))

const authorityOverclaimRecord = structuredClone(canonicalRecord) as unknown as
  Record<string, unknown>
authorityOverclaimRecord.providerCallPerformedByBridge = true
authorityOverclaimRecord.recordDigestSha256 = calculateSkillContractDigest({
  ...authorityOverclaimRecord,
  recordDigestSha256: '',
}, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  authorityOverclaimRecord))

const crossedPacketProjection = structuredClone(canonicalRecord)
crossedPacketProjection.authenticatedOwnerProjection.artifactRefs[0]
  .contentHash = hash('crossed.canonical.packet')
crossedPacketProjection.authenticatedOwnerProjection.projectionDigestSha256 =
  calculateSkillContractDigest({
    ...crossedPacketProjection.authenticatedOwnerProjection,
    projectionDigestSha256: '',
  }, 'projectionDigestSha256')
crossedPacketProjection.recordDigestSha256 = calculateSkillContractDigest({
  ...crossedPacketProjection,
  recordDigestSha256: '',
}, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  crossedPacketProjection))

const unsafeCanonicalRecord = structuredClone(canonicalRecord)
unsafeCanonicalRecord.recordId = '/tmp/caption-visual-record'
unsafeCanonicalRecord.recordDigestSha256 = calculateSkillContractDigest({
  ...unsafeCanonicalRecord,
  recordDigestSha256: '',
}, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  unsafeCanonicalRecord))

const inheritedCanonicalRecord = Object.create({ productionAuthorityGranted: true })
Object.assign(inheritedCanonicalRecord, structuredClone(canonicalRecord))
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  inheritedCanonicalRecord))

const cyclicCanonicalRecord = structuredClone(canonicalRecord) as unknown as
  Record<string, unknown>
cyclicCanonicalRecord.cycle = cyclicCanonicalRecord
expectThrow(() => parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
  cyclicCanonicalRecord))

const missingRuntimePacket = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeRequest,
  visualIntelligenceSupportPayload: runtimeSupport.payload,
})
check(missingRuntimePacket.disposition === 'blocked'
  && missingRuntimePacket.reasonCodes.join('|')
    === 'input.visual_intelligence.authenticated_admission.failed',
'An artifact reference alone cannot satisfy the authenticated admission path.')

const crossedRuntimeCall = structuredClone(runtimeResumedCall)
crossedRuntimeCall.injectedSupportArtifactRefs[0].contentHash = hash(
  'crossed.caption.visual.packet')
const crossedCall = parseOrchestraSkillCall({
  ...crossedRuntimeCall,
  callDigestSha256: calculateSkillContractDigest(
    { ...crossedRuntimeCall, callDigestSha256: '' }, 'callDigestSha256'),
})
const crossedRuntimeResult = runCaptionsSpecialistJob({
  call: crossedCall,
  resumeSupportRequest: runtimeRequest,
  visualIntelligenceSupportPayload: runtimeSupport.payload,
  visualIntelligenceEvidencePacket: runtimeProjection.packet,
})
check(crossedRuntimeResult.disposition === 'blocked'
  && crossedRuntimeResult.reasonCodes.join('|')
    === 'input.visual_intelligence.authenticated_admission.mismatch',
'A crossed packet reference is rejected after packet validation.')

const fixtureOverclaim = structuredClone(runtimeProjection.packet)
fixtureOverclaim.evidenceMode = 'contract_fixture'
fixtureOverclaim.packetDigestSha256 = calculateSkillContractDigest(
  { ...fixtureOverclaim, packetDigestSha256: '' }, 'packetDigestSha256')
const fixtureOverclaimResult = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeRequest,
  visualIntelligenceSupportPayload: runtimeSupport.payload,
  visualIntelligenceEvidencePacket: fixtureOverclaim,
})
check(fixtureOverclaimResult.disposition === 'blocked'
  && fixtureOverclaimResult.reasonCodes.join('|')
    === 'input.visual_intelligence.authenticated_admission.failed',
'Contract-fixture evidence cannot impersonate an authenticated private reread.')

const wrongScopePayload = structuredClone(runtimeSupport.payload)
wrongScopePayload.canonicalScope.sceneId = 'scene.crossed'
wrongScopePayload.requestedSceneId = 'scene.crossed'
wrongScopePayload.payloadDigestSha256 = calculateSkillContractDigest(
  { ...wrongScopePayload, payloadDigestSha256: '' }, 'payloadDigestSha256')
const wrongScopeResult = runCaptionsSpecialistJob({
  call: runtimeCall,
  visualIntelligenceSupportPayload: wrongScopePayload,
})
check(wrongScopeResult.disposition === 'blocked'
  && wrongScopeResult.reasonCodes.join('|')
    === 'input.visual_intelligence.payload.scope.mismatch',
'The typed Visual Intelligence payload cannot expand or cross the assigned scene.')

const receipt = parseCaptionVisualIntelligenceSpatialAdapterReceipt(
  CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT)
const copiedPublicTypeSha = hash(readFileSync(new URL(
  '../../src/types/visual-intelligence.ts', import.meta.url)))
check(copiedPublicTypeSha
  === receipt.backendSource.visualIntelligencePublicTypeFileSha256
  && receipt.backendSource.sourceCommit
    === '5130e3c70f3f633e6877aa3feff4dc296eba525b',
'Caption freezes the exact published Visual Intelligence public type source.')
check(!receipt.backendImplementationImported
  && !receipt.renderedCaptionInspectionAdmitted
  && !receipt.deterministicPixelGeometryClaimed,
'The adapter receipt preserves owner and semantic-geometry boundaries.')

const staleSpatial = structuredClone(spatialEvidence)
staleSpatial.observations[0]!.sceneId = 'scene.crossed'
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.stale',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    staleSpatial as unknown as Record<string, unknown>,
    'spatialEvidenceDigestSha256') as unknown as VisualIntelligenceSpatialEvidence,
}))
const pixelOverclaim = structuredClone(spatialEvidence) as unknown as
  Record<string, unknown>
const overclaimObservations = pixelOverclaim.observations as Array<
  Record<string, unknown>>
overclaimObservations[0]!.deterministicPixelGeometryClaimed = true
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.pixel-overclaim',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    pixelOverclaim, 'spatialEvidenceDigestSha256') as unknown as
      VisualIntelligenceSpatialEvidence,
}))
const contrastOverclaim = structuredClone(spatialEvidence) as unknown as
  Record<string, unknown>
const contrastObservations = contrastOverclaim.observations as Array<
  Record<string, unknown>>
contrastObservations[0]!.measuredContrastRatioMilli = 5_000
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.contrast-overclaim',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    contrastOverclaim, 'spatialEvidenceDigestSha256') as unknown as
      VisualIntelligenceSpatialEvidence,
}))
const unknownEvidence = structuredClone(spatialEvidence)
unknownEvidence.observations[0]!.evidenceRefs = [viRef('unknown.evidence')]
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.unknown-evidence',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    unknownEvidence as unknown as Record<string, unknown>,
    'spatialEvidenceDigestSha256') as unknown as VisualIntelligenceSpatialEvidence,
}))
const wrongFrame = structuredClone(spatialEvidence)
wrongFrame.outputFrame!.width = 1920
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.wrong-frame',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    wrongFrame as unknown as Record<string, unknown>,
    'spatialEvidenceDigestSha256') as unknown as VisualIntelligenceSpatialEvidence,
}))
const staleRead = structuredClone(readResult)
staleRead.scope.approvedSnapshotId = 'snapshot.crossed'
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.stale-read',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: redigest(
    staleRead as unknown as Record<string, unknown>,
    'resultDigestSha256') as unknown as VisualIntelligenceAuthenticatedReadResult,
  spatialEvidence,
}))
const missingRole = structuredClone(spatialEvidence)
missingRole.observations = missingRole.observations.filter((item) =>
  item.role !== 'living_frame')
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.missing-role',
  payload: support.payload,
  supportRequest: support.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence: redigest(
    missingRole as unknown as Record<string, unknown>,
    'spatialEvidenceDigestSha256') as unknown as VisualIntelligenceSpatialEvidence,
}))

const renderedSupport = createCaptionVisualIntelligenceSupport({
  payloadId: 'caption.visual.spatial.rendered.payload',
  requestId: 'caption.visual.spatial.rendered.support',
  idempotencyKey: 'caption.visual.spatial.rendered.idempotency',
  originalCallRef: ref(
    'caption.visual.spatial.rendered.call', 'orchestra-skill-call-v1'),
  purpose: 'rendered_caption_inspection',
  canonicalScope: scope,
  pictureLockRef: support.payload.pictureLockRef,
  finishReadinessRef: support.payload.finishReadinessRef,
  confirmedOutputFrame: support.payload.confirmedOutputFrame,
  sourcePrivateArtifactRef: sourceArtifactRef,
  canonicalLayoutOccupancyRef: support.payload.canonicalLayoutOccupancyRef,
  requiredObservationRoles: ['safe_candidate'],
  expectedOutcomeRefs,
})
expectThrow(() => projectCaptionVisualIntelligenceSpatialEvidence({
  packetId: 'caption.visual.spatial.rendered-rejected',
  payload: renderedSupport.payload,
  supportRequest: renderedSupport.supportRequest,
  authenticatedReadResult: readResult,
  spatialEvidence,
}))

console.log(JSON.stringify({
  smoke: 'captions_specialist_visual_intelligence_spatial_adapter',
  assertions,
  publicTypeSha256: copiedPublicTypeSha,
  adapterVersion: receipt.schemaVersion,
  adapterDigestSha256: receipt.adapterDigestSha256,
  canonicalEvidenceRecordVersion: canonicalRecord.schemaVersion,
  canonicalEvidenceReadAdapterVersion: canonicalReceipt.schemaVersion,
  canonicalEvidenceReadAdapterDigestSha256:
    canonicalReceipt.adapterDigestSha256,
  canonicalPublicTypeSha256: canonicalPublicTypeSha,
  canonicalRecordFixtureAdmitted: true,
  actualCanonicalEvidenceRecordConsumed: false,
  projectedObservationCount: output.packet.observations.length,
  semanticGeometryOnly: true,
  stableRegionSelected: false,
  renderedInspectionAdmitted: false,
  providerCallMadeByCaption: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
