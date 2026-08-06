import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  type SkillCapabilityManifest,
  type SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import {
  assertCanonicalSourceAnalysisOrchestraWork,
} from '../orchestra/canonical-source-analysis-orchestra-coordinator'
import {
  CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  createOrchestraSkillCall,
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceResult,
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION,
  createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef,
  type CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
} from '../services/canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION,
  assertCanonicalSourceAnalysisOrchestraAuthority,
  createCanonicalSourceAnalysisOrchestraAuthority,
  createCanonicalSourceAnalysisOrchestraWorkOwner,
} from '../services/canonical-source-analysis-orchestra-work-owner'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceVisualIntelligenceOrchestraBindingScope,
} from '../services/canonical-source-visual-intelligence-orchestra-result-bridge'
import type {
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION,
  type VisualIntelligenceCanonicalPreparedEvidenceStore,
} from '../visual-intelligence/visual-intelligence-canonical-prepared-evidence-store'
import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  assertVisualIntelligencePreparedEvidenceForRequest,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  createVisualIntelligenceOrchestraCapabilityManifest,
  createVisualIntelligenceOrchestraCapabilityManifestForQualification,
  createVisualIntelligenceOrchestraQualificationSnapshot,
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import {
  createVisualIntelligenceOrchestraInvocationCompiler,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'
import {
  VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION,
  type VisualIntelligenceOrchestraDispatchPackageStore,
} from '../visual-intelligence/visual-intelligence-orchestra-dispatch-package-store'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (id: string, value: unknown = { id }): VisualIntelligenceEvidenceRef =>
  createVisualIntelligenceEvidenceRef(id, value)

const sourceArtifactRef = ref('source-finalized')
const sourceProbeAuthorityRef = ref('source-probe')
const storageAuthorityRef = ref('source-storage')
const transcriptSegments = [{
  segmentId: 'segment-1',
  startFrame: 0,
  endFrameExclusive: 240,
  text: 'Keep this complete instruction and delete only the repeated attempt.',
  confidenceBasisPoints: 9_800,
  wordsVerified: true,
}]
const transcriptCoverage = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0,
  coveredEndFrameExclusive: 240,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcript = canonicalSourceLedTranscriptEvidenceSchema.parse({
  status: 'completed',
  modelId: 'faster-whisper-large-v3',
  modelDigestSha256: sha('faster-whisper-large-v3'),
  runtimeVersion: 'faster-whisper-1.2.1',
  transcriptDigestSha256: sha256AuthorityValue(transcriptSegments),
  segments: transcriptSegments,
  coverage: {
    ...transcriptCoverage,
    coverageDigestSha256: sha256AuthorityValue(transcriptCoverage),
  },
  rawAudioPersisted: false,
  modelDownloadPerformed: false,
  networkAttempted: false,
})
const transcriptAuthorityRef = orchestraEvidenceRef(
  'source-transcript',
  `sha256:${transcript.transcriptDigestSha256}`,
)
const sourceFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 240,
  timeBaseNumerator: 1,
  timeBaseDenominator: 24,
})
const scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope = {
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  analysisRunId: 'analysis-run-1',
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sha('exact-private-source'),
  byteLength: 4_096,
  durationFrames: 240,
  sourceFrameAuthority,
  sourceArtifactRef,
  sourceProbeAuthorityRef,
  transcriptAuthorityRef,
  transcriptDigestSha256: transcript.transcriptDigestSha256,
  planningDirectionDigestSha256: sha('professional-source-cleanup'),
  userInstructionDigestSha256: sha('authenticated-user-instructions'),
  planningContextAuthorityRef: orchestraEvidenceRef(
    'planning-context',
    orchestraDigest({
      planningDirectionDigestSha256: sha('professional-source-cleanup'),
      userInstructionDigestSha256: sha('authenticated-user-instructions'),
    }),
  ),
}
const l4ToolEvidenceDraft = [
  l4Item('media_probe', 'ffprobe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe, 1,
    sourceProbeAuthorityRef),
  l4Item('private_media_transform', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 2),
  l4Item('scene_detection', 'pyscenedetect',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect, 3),
  l4Item('pixel_measurement', 'opencv',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv, 4),
  l4Item('exact_visible_text', 'ocr',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr, 5),
  l4Item('sampling_policy', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 6),
]
const l4SourceObject = {
  storageProvider: 'google_cloud_storage' as const,
  storageBucket: 'private-source-bucket',
  storagePath: 'workspace-1/source.mp4',
  storageGeneration: '1001',
  storageEtag: 'source-etag-1',
  contentType: 'video/mp4' as const,
  width: 1_920,
  height: 1_080,
  checksumSha256: scope.checksumSha256,
  byteLength: scope.byteLength,
  finalizedMediaAuthorityRef: sourceArtifactRef,
  finalizedStorageObjectAuthorityRef: storageAuthorityRef,
  exactGenerationEtagChecksumAndLengthRereadVerified: true as const,
}
const toolArtifactCommon = {
  invocationId: 'l4-work-owner-invocation',
  sourceObjectIdentityDigestSha256: sha256AuthorityValue(l4SourceObject),
  sourceTimelineDigestSha256: sha256AuthorityValue(
    sourceTimelineForArtifact(scope),
  ),
  sourceProbeAuthorityRef,
  sourceDurationFrames: scope.durationFrames,
  sourceWidth: l4SourceObject.width,
  sourceHeight: l4SourceObject.height,
  sourceFrameAuthorityDigestSha256: sha256AuthorityValue(sourceFrameAuthority),
  acceleratorClass: 'nvidia_l4' as const,
  allocatedGpuCount: 1 as const,
  exactSourceChecksumBound: true as const,
  exactCanonicalResultRereadVerified: true as const,
  substantiveGpuExecutionVerified: true as const,
  substantiveCpuMediaProcessingUsed: false as const,
  runtimeNetworkDownloadPerformed: false as const,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
  customerCreditMutated: false as const,
  publicDeliveryGranted: false as const,
  productionAuthorityGranted: false as const,
}
const toolArtifacts = [
  createToolArtifact(l4ToolEvidenceDraft[1]!, {
    kind: 'private_media_transform',
    analysisRepresentationRef: ref('analysis-representation'),
    outputWidth: 1_920,
    outputHeight: 1_080,
    decodedCanonicalFrameCount: 240,
    frameMapDigestSha256: sha('frame-map'),
    nvdecGpuDecodeUsed: true,
    cpuVideoDecodeUsed: false,
    missingCanonicalFrameCount: 0,
  }),
  createToolArtifact(l4ToolEvidenceDraft[2]!, {
    kind: 'scene_detection',
    sceneAnalysisProxyRef: ref('scene-analysis-proxy'),
    scenes: [{
      sceneId: 'scene-1', startFrame: 0, endFrameExclusive: 120,
      boundaryConfidenceBasisPoints: 9_900,
    }, {
      sceneId: 'scene-2', startFrame: 120, endFrameExclusive: 240,
      boundaryConfidenceBasisPoints: 9_700,
    }],
    completeTimelineCoverage: true,
    gpuDecodedProxyUsed: true,
    cpuVideoDecodeUsed: false,
  }),
  createToolArtifact(l4ToolEvidenceDraft[3]!, {
    kind: 'pixel_measurement',
    measurements: [{
      sceneId: 'scene-1', sampledFrameCount: 4,
      meanLumaBasisPoints: 5_200, motionBasisPoints: 1_100,
      focusBasisPoints: 8_900,
    }, {
      sceneId: 'scene-2', sampledFrameCount: 4,
      meanLumaBasisPoints: 4_800, motionBasisPoints: 2_600,
      focusBasisPoints: 8_400,
    }],
    completeSceneSetMeasured: true,
    gpuDecodedFramesUsed: true,
    cpuVideoDecodeUsed: false,
  }),
  createToolArtifact(l4ToolEvidenceDraft[4]!, {
    kind: 'exact_visible_text',
    spans: [{
      spanId: 'ocr-span-1', sceneId: 'scene-2', startFrame: 125,
      endFrameExclusive: 150, text: 'Delete that part',
      confidenceBasisPoints: 9_850,
      editorDirectedInstructionCandidate: true,
    }],
    textContentIsUntrustedMediaEvidence: true,
    instructionsFromTextAreNeverExecuted: true,
    paddleGpuInferenceUsed: true,
    cpuInferenceUsed: false,
  }),
  createToolArtifact(l4ToolEvidenceDraft[5]!, {
    kind: 'sampling_policy',
    samples: [{
      sampleId: 'sample-1', sceneId: 'scene-1', frame: 0,
      reason: 'scene_entry',
    }, {
      sampleId: 'sample-2', sceneId: 'scene-1', frame: 60,
      reason: 'scene_midpoint',
    }, {
      sampleId: 'sample-3', sceneId: 'scene-2', frame: 120,
      reason: 'scene_entry',
    }, {
      sampleId: 'sample-4', sceneId: 'scene-2', frame: 180,
      reason: 'visible_text',
    }],
    completeSceneCoverage: true,
    highDetail: true,
    everyTimelineFrameInspected: false,
    completeTimePixelInspectionClaimAllowed: false,
  }),
]
const l4ToolEvidence = l4ToolEvidenceDraft.map((item) => {
  const artifact = toolArtifacts.find((candidate) =>
    candidate.role === item.role)
  return artifact ? {
    ...item,
    evidenceRef:
      getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(artifact),
  } : item
})
const l4Result = createCanonicalSourceAnalysisL4VisualEvidenceResult({
  scope: toEvidenceScope(scope),
  sourceObject: l4SourceObject,
  operationId: 'internal.visual_intelligence.prepare_source_visual_evidence.v1',
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
  acceleratorClass: 'nvidia_l4',
  cloudRunJobName: 'reeditpro-professional-l4',
  invocationId: 'l4-work-owner-invocation',
  admissionRef: ref('l4-admission'),
  runtimeReleaseRef: ref('l4-runtime-release'),
  cloudRunExecutionRef: ref('l4-execution'),
  platformEstimateRef: ref('l4-platform-estimate'),
  admissionAccountEffectivePricingAuthorityRef:
    ref('l4-admission-account-effective-rate'),
  terminalAccountEffectivePricingAuthorityRef:
    ref('l4-terminal-account-effective-rate'),
  attemptCostEvidenceRef: ref('l4-cost'),
  maximumPlatformInternalCostUsdNanos: 5_000_000_000,
  actualPlatformInternalCostUsdNanos: 1_250_000_000,
  accountEffectivePricingRereadVerified: true,
  publicListPriceUsedAsSettlementAuthority: false,
  platformInternalCostWithinAdmittedCap: true,
  toolEvidence: l4ToolEvidence,
  userTriggeredScaleFromZero: true,
  minimumIdleInstances: 0,
  terminalCloudRunExecutionObserved: true,
  terminalWorkerStopped: true,
  scaleBackToZeroVerified: true,
  maximumAttempts: 1,
  uncertainOutcomeRetryAllowed: false,
  runtimeNetworkDownloadPerformed: false,
  exactSourceReleaseExecutionAndCostRereadVerified: true,
  privateEvidencePersistedAndReread: true,
  browserOrCallerEvidenceAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutated: false,
  systemFailureChargedToCustomer: false,
  unapprovedOverageChargedToCustomer: false,
  directProviderCallMade: false,
  directTimelineMutationPerformed: false,
  qaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult = {
  schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
  transcriptAuthorityRef,
  transcript,
  execution: {
    executionOwner: 'canonical_quality_first_source_transcript_router',
    sourceAudioDisposition: 'transcribed_on_nvidia_a100_80gb_primary',
    routeProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    acceleratorClass: 'nvidia_a100_80gb',
    primaryAttemptOutcome: 'completed',
    fallbackAttemptOutcome: 'not_attempted',
    primaryAttemptTerminalFailureClass: null,
    primaryAttemptReceiptRef: ref('a100-attempt'),
    completedAttemptReceiptRef: ref('a100-attempt'),
    completedRuntimeReleaseRef: ref('a100-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [ref('a100-cost')],
    routePolicyDigestSha256:
      `sha256:${createCanonicalQualityFirstUserTriggeredGpuPolicy().policyHash}`,
    gpuAccelerationUsed: true,
    cpuInferenceFallbackUsed: false,
    completeAudioTimelineProcessed: true,
    modelBytesPinnedBeforeExecution: true,
    runtimeDownloadPerformed: false,
    rawAudioPersisted: false,
    transcriptRereadVerified: true,
    customerCreditMutated: false,
    systemFailureChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
  },
}

const baselineQualification =
  createVisualIntelligenceOrchestraQualificationSnapshot()
const baselineManifest = createVisualIntelligenceOrchestraCapabilityManifest()
const qualification = qualifiedSourceSnapshot(
  baselineQualification,
  baselineManifest,
)
const manifest =
  createVisualIntelligenceOrchestraCapabilityManifestForQualification(
    qualification,
  )
const call = createOrchestraSkillCall({
  schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
  callId: 'orchestra-source-understanding-1',
  orchestraPlanRef: ref('orchestra-plan'),
  orchestraJobRef: ref('orchestra-job'),
  parentJobRef: null,
  requestedBy: { kind: 'orchestra' },
  targetSkillKey: 'visual_intelligence',
  jobType: 'source_video_understanding',
  phase: 'planning',
  scope: {
    scopeType: 'video',
    sourceArtifactRef,
    authorizedRanges: [{
      startFrame: 0,
      endFrameExclusive: scope.durationFrames,
      frameRate: { numerator: 24, denominator: 1 },
    }],
    completeSourceCoverageRequired: true,
    outputId: null,
  },
  sceneContextSnapshotRef: scope.planningContextAuthorityRef,
  sourceArtifactRefs: [sourceArtifactRef],
  comparisonArtifactRefs: [],
  expectedOutcomeRefs: [ref('source-planning-evidence')],
  requiredEvidenceRefs: [
    ...l4ToolEvidence.map((item) => item.evidenceRef),
    transcriptAuthorityRef,
  ],
  manifestRef: orchestraEvidenceRef(
    manifest.manifestId,
    manifest.manifestDigestSha256,
  ),
  qualificationSnapshotRef: orchestraEvidenceRef(
    qualification.snapshotId,
    qualification.snapshotDigestSha256,
  ),
  timeBudgetRef: ref('time-budget'),
  creditBudgetRef: ref('credit-budget'),
  attemptEnvelopeRef: ref('attempt-envelope'),
  approvedSnapshotRef: null,
  idempotencyKey: 'orchestra-source-understanding-1',
  orchestraDispatchAuthorized: true,
  directProviderCallAllowed: false,
  directTimelineMutationAllowed: false,
  directArtifactMutationAllowed: false,
  scopeExpansionAllowed: false,
  peerSkillExecutionAuthorityAccepted: false,
})
const planningAdmission: VisualIntelligencePlanningEvidenceAdmission = {
  mode: 'planning_evidence',
  authenticatedPrincipalRef: ref('principal'),
  workspaceAuthorizationRef: ref('workspace-authorization'),
  finalizedSourceAuthorityRefs: [sourceArtifactRef],
  sourceChecksumSetRef: ref('source-checksum-set'),
  analysisAllowanceRef: ref('analysis-allowance'),
  costPreflight: {
    pricingSnapshotRef: ref('pricing-snapshot'),
    accountEffectiveRateAuthorityRef: ref('account-effective-rate'),
    currency: 'USD',
    maximumAuthorizedCostMicros: 10_000_000,
    estimatedMinimumCostMicros: 1_000,
    estimatedMaximumCostMicros: 2_000_000,
    serviceFeeIncluded: false,
    publicListPriceUsedAsSettlementAuthority: false,
    preflightPassed: true,
  },
  retentionPolicyRef: ref('retention-policy'),
  privacyPolicyRef: ref('privacy-policy'),
  providerReleaseRef: ref('gemini-provider-release'),
  globalKillSwitchOpen: false,
  providerKillSwitchOpen: false,
  reportPersistenceAllowed: true,
  timelineMutationAllowed: false,
  editingWorkerExecutionAllowed: false,
  generationAllowed: false,
  renderAllowed: false,
  exportAllowed: false,
  deliveryAllowed: false,
}
const authority = createCanonicalSourceAnalysisOrchestraAuthority({
  scope,
  call,
  qualificationSnapshot: qualification,
  planningAdmission,
  orchestraDispatchAuthorityRef: call.orchestraJobRef,
  exactOrchestraPlanJobAndBudgetRereadVerified: true,
  exactQualificationRegistryRereadVerified: true,
  browserOrCallerWorkAccepted: false,
  directProviderDispatchAllowed: false,
  directGpuDispatchAllowed: false,
  directTimelineMutationAllowed: false,
  customerCreditMutationAllowed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
const qualificationRegistryReadPort = {
  schemaVersion: CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION,
  async readExact(input: {
    manifestRef: { id: string, version: number, contentHash: string }
    qualificationSnapshotRef: {
      id: string
      version: number
      contentHash: string
    }
  }) {
    if (
      input.manifestRef.id !== call.manifestRef.id
      || input.manifestRef.version !== call.manifestRef.version
      || input.manifestRef.contentHash !== call.manifestRef.contentHash
      || input.qualificationSnapshotRef.id !==
        call.qualificationSnapshotRef.id
      || input.qualificationSnapshotRef.version !==
        call.qualificationSnapshotRef.version
      || input.qualificationSnapshotRef.contentHash !==
        call.qualificationSnapshotRef.contentHash
    ) return null
    return {
      manifest: structuredClone(manifest),
      qualificationSnapshot: structuredClone(qualification),
    }
  },
}

let preparedRequest: VisualIntelligenceRequest | null = null
let preparedWrites = 0
let dispatchWrites = 0
const preparedEvidenceStore: VisualIntelligenceCanonicalPreparedEvidenceStore = {
  schemaVersion: VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION,
  async persistCreateOnly(input) {
    preparedWrites += 1
    preparedRequest = input.request
    assert.equal(input.ownerClass, 'canonical_source_analysis_evidence_owner')
    assertVisualIntelligencePreparedEvidenceForRequest(
      input.request,
      input.preparedEvidence,
    )
    const sceneSummary = input.preparedEvidence.deterministicEvidence.find(
      (item) => item.authority === 'scene_detection',
    )?.summary ?? ''
    const ocrSummary = input.preparedEvidence.deterministicEvidence.find(
      (item) => item.authority === 'exact_ocr',
    )?.summary ?? ''
    assert.match(sceneSummary, /scene-1/u)
    assert.match(ocrSummary, /editorDirectedInstructionCandidate/u)
    assert.doesNotMatch(ocrSummary, /Delete that part/u)
    return {
      disposition: preparedWrites === 1 ? 'created' : 'identical_replay',
      recordRef: ref('prepared-record', input.request),
    }
  },
  async readExactForRequest() { return null },
}
const dispatchStore: VisualIntelligenceOrchestraDispatchPackageStore = {
  schemaVersion: VISUAL_INTELLIGENCE_ORCHESTRA_DISPATCH_PACKAGE_STORE_VERSION,
  async persistCreateOnly(input) {
    dispatchWrites += 1
    const compiler = createVisualIntelligenceOrchestraInvocationCompiler({
      authorityRegistryPort: {
        async readExact() {
          return { manifest, qualificationSnapshot: qualification }
        },
      },
      compilationPort: {
        async prepareExact() { return input.compilationEvidence },
      },
    })
    const compiled = await compiler.compile({
      call: input.call,
      supportRequest: input.supportRequest,
    })
    assert.ok(preparedRequest)
    assert.equal(
      compiled.request.requestDigestSha256,
      preparedRequest!.requestDigestSha256,
    )
    return {
      disposition: dispatchWrites === 1 ? 'created' : 'identical_replay',
      dispatchPackageRef: orchestraEvidenceRef(
        'dispatch-package',
        orchestraDigest({ call: input.call, request: compiled.request }),
      ),
    }
  },
  async readExact() {
    return { manifest, qualificationSnapshot: qualification }
  },
  async prepareExact() {
    throw new Error('not used by the work-owner smoke')
  },
  async materializeCanonicalRequestPackage() {
    throw new Error('not used by the work-owner smoke')
  },
}
const owner = createCanonicalSourceAnalysisOrchestraWorkOwner({
  authorityReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION,
    async readExactSourceVideoUnderstandingAuthority() {
      return structuredClone(authority)
    },
  },
  l4VisualEvidenceReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(l4Result) },
  },
  l4VisualEvidenceToolArtifactReadPort: ownerToolArtifactPort(toolArtifacts),
  transcriptReadPort: {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(transcriptResult) },
  },
  preparedEvidenceStore,
  dispatchPackageStore: dispatchStore,
  qualificationRegistryReadPort,
})

const work = assertCanonicalSourceAnalysisOrchestraWork({
  value: await owner.readExactSourceVideoUnderstandingWork(scope),
  expectedScope: scope,
})
assert.equal(work.call.callId, call.callId)
assert.equal(work.directProviderDispatchAllowed, false)
assert.equal(work.directGpuDispatchAllowed, false)
assert.equal(work.customerCreditMutationAllowed, false)
const observedPreparedRequest = preparedRequest as VisualIntelligenceRequest | null
assert.ok(observedPreparedRequest)
assert.equal(observedPreparedRequest.operation, 'analyze_media')
assert.equal(observedPreparedRequest.profile, 'source_edit_planning')
assert.equal(observedPreparedRequest.qualityPolicy.exactModelId,
  'gemini-3.1-pro-preview')
assert.equal(observedPreparedRequest.qualityPolicy.thinkingLevel, 'high')
assert.equal(observedPreparedRequest.qualityPolicy.mediaResolution, 'high')
assert.equal(preparedWrites, 1)
assert.equal(dispatchWrites, 1)

const replay = assertCanonicalSourceAnalysisOrchestraWork({
  value: await owner.readExactSourceVideoUnderstandingWork(scope),
  expectedScope: scope,
})
assert.equal(replay.workDigestSha256, work.workDigestSha256)
assert.equal(preparedWrites, 2)
assert.equal(dispatchWrites, 2)

await assert.rejects(() => owner.readExactSourceVideoUnderstandingWork({
  ...scope,
  workspaceId: 'other-workspace',
}))
assert.throws(() => assertCanonicalSourceAnalysisOrchestraAuthority({
  scope,
  value: { ...authority, browserOrCallerWorkAccepted: true },
}))
assert.throws(() => assertCanonicalSourceAnalysisOrchestraAuthority({
  scope,
  value: { ...authority, authorityDigestSha256: `sha256:${sha('tampered')}` },
}))

const missingL4Owner = createCanonicalSourceAnalysisOrchestraWorkOwner({
  authorityReadPort: ownerAuthorityPort(authority),
  l4VisualEvidenceReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    async readCompleted() { return null },
  },
  l4VisualEvidenceToolArtifactReadPort: ownerToolArtifactPort(toolArtifacts),
  transcriptReadPort: ownerTranscriptPort(transcriptResult),
  preparedEvidenceStore,
  dispatchPackageStore: dispatchStore,
  qualificationRegistryReadPort,
})
assert.equal(
  await missingL4Owner.readExactSourceVideoUnderstandingWork(scope),
  null,
)
const missingTranscriptOwner = createCanonicalSourceAnalysisOrchestraWorkOwner({
  authorityReadPort: ownerAuthorityPort(authority),
  l4VisualEvidenceReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(l4Result) },
  },
  l4VisualEvidenceToolArtifactReadPort: ownerToolArtifactPort(toolArtifacts),
  transcriptReadPort: ownerTranscriptPort(null),
  preparedEvidenceStore,
  dispatchPackageStore: dispatchStore,
  qualificationRegistryReadPort,
})
assert.equal(
  await missingTranscriptOwner.readExactSourceVideoUnderstandingWork(scope),
  null,
)
const missingToolArtifactOwner = createCanonicalSourceAnalysisOrchestraWorkOwner({
  authorityReadPort: ownerAuthorityPort(authority),
  l4VisualEvidenceReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(l4Result) },
  },
  l4VisualEvidenceToolArtifactReadPort:
    ownerToolArtifactPort(toolArtifacts.slice(0, 4)),
  transcriptReadPort: ownerTranscriptPort(transcriptResult),
  preparedEvidenceStore,
  dispatchPackageStore: dispatchStore,
  qualificationRegistryReadPort,
})
assert.equal(
  await missingToolArtifactOwner.readExactSourceVideoUnderstandingWork(scope),
  null,
)
const l4ResultInput = { ...l4Result }
Reflect.deleteProperty(l4ResultInput, 'schemaVersion')
Reflect.deleteProperty(l4ResultInput, 'source')
Reflect.deleteProperty(l4ResultInput, 'evidenceClass')
Reflect.deleteProperty(l4ResultInput, 'resultDigestSha256')
const crossScopeL4Result = createCanonicalSourceAnalysisL4VisualEvidenceResult({
  ...l4ResultInput,
  scope: { ...l4Result.scope, workspaceId: 'other-workspace' },
})
const crossScopeL4Owner = createCanonicalSourceAnalysisOrchestraWorkOwner({
  authorityReadPort: ownerAuthorityPort(authority),
  l4VisualEvidenceReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(crossScopeL4Result) },
  },
  l4VisualEvidenceToolArtifactReadPort: ownerToolArtifactPort(toolArtifacts),
  transcriptReadPort: ownerTranscriptPort(transcriptResult),
  preparedEvidenceStore,
  dispatchPackageStore: dispatchStore,
  qualificationRegistryReadPort,
})
await assert.rejects(() =>
  crossScopeL4Owner.readExactSourceVideoUnderstandingWork(scope))

const missingQualificationOwner =
  createCanonicalSourceAnalysisOrchestraWorkOwner({
    authorityReadPort: ownerAuthorityPort(authority),
    l4VisualEvidenceReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
      async readCompleted() { return structuredClone(l4Result) },
    },
    l4VisualEvidenceToolArtifactReadPort:
      ownerToolArtifactPort(toolArtifacts),
    transcriptReadPort: ownerTranscriptPort(transcriptResult),
    preparedEvidenceStore,
    dispatchPackageStore: dispatchStore,
    qualificationRegistryReadPort: {
      schemaVersion: CANONICAL_SKILL_QUALIFICATION_REGISTRY_VERSION,
      async readExact() { return null },
    },
  })
assert.equal(
  await missingQualificationOwner
    .readExactSourceVideoUnderstandingWork(scope),
  null,
)

console.log(JSON.stringify({
  ok: true,
  ownerVersion: owner.ownerVersion,
  canonicalRereadsOnly: owner.workBuiltOnlyFromCanonicalRereads,
  browserOrCallerPreparedEvidenceAccepted:
    owner.browserOrCallerPreparedEvidenceAccepted,
  replayVerified: replay.workDigestSha256 === work.workDigestSha256,
  missingL4Rejected: true,
  missingTranscriptRejected: true,
  missingToolArtifactRejected: true,
  missingCanonicalQualificationRejected: true,
  crossScopeL4EvidenceRejected: true,
  crossScopeRejected: true,
  callerAuthorityEscalationRejected: true,
}))

function l4Item(
  role: 'media_probe' | 'private_media_transform' | 'scene_detection'
    | 'pixel_measurement' | 'exact_visible_text' | 'sampling_policy',
  tool: 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'ocr',
  operationId: string,
  ordinal: number,
  evidenceRef = ref(`l4-evidence-${ordinal}`),
) {
  return {
    role,
    tool,
    operationId,
    toolVersion: `${tool}-qualified-v1`,
    evidenceRef,
    runtimeReleaseRef: ref(`l4-release-${ordinal}`),
    executionRef: ref(`l4-execution-${ordinal}`),
    exactSourceChecksumBound: true as const,
    exactCanonicalResultRereadVerified: true as const,
    substantiveCpuExecutionUsed: false as const,
  }
}

function createToolArtifact(
  item: ReturnType<typeof l4Item>,
  payload: Parameters<
    typeof createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact
  >[0]['payload'],
): CanonicalSourceAnalysisL4VisualEvidenceToolArtifact {
  if (item.role === 'media_probe') throw new Error(
    'Media probe is already owned by the canonical source probe authority.',
  )
  return createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact({
    ...toolArtifactCommon,
    role: item.role,
    tool: item.tool as 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'ocr',
    operationId: item.operationId,
    toolVersion: item.toolVersion,
    runtimeReleaseRef: item.runtimeReleaseRef,
    executionRef: item.executionRef,
    payload,
  })
}

function ownerToolArtifactPort(
  artifacts: readonly CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[],
) {
  return {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION,
    async readExact(invocationId: string, role: typeof artifacts[number]['role']) {
      const artifact = artifacts.find((candidate) =>
        candidate.invocationId === invocationId && candidate.role === role)
      return artifact ? structuredClone(artifact) : null
    },
  } as const
}

function toEvidenceScope(
  value: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
) {
  return {
    ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    analysisRunId: value.analysisRunId,
    sourceSequenceItemId: value.sourceSequenceItemId,
    mediaAssetId: value.mediaAssetId,
    uploadedOrder: value.uploadedOrder,
    checksumSha256: value.checksumSha256,
    byteLength: value.byteLength,
    durationFrames: value.durationFrames,
    sourceFrameAuthority: value.sourceFrameAuthority,
    finalizedMediaAuthorityRef: value.sourceArtifactRef,
    sourceProbeAuthorityRef: value.sourceProbeAuthorityRef,
  }
}

function sourceTimelineForArtifact(
  value: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
) {
  return {
    sourceSequenceItemId: value.sourceSequenceItemId,
    mediaAssetId: value.mediaAssetId,
    uploadedOrder: value.uploadedOrder,
    durationFrames: value.durationFrames,
    sourceFrameAuthority: value.sourceFrameAuthority,
    sourceProbeAuthorityRef: value.sourceProbeAuthorityRef,
  }
}

function qualifiedSourceSnapshot(
  baseline: SkillQualificationSnapshot,
  baselineManifestValue: SkillCapabilityManifest,
): SkillQualificationSnapshot {
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: 'visual-intelligence-qualified-source',
    skillKey: baseline.skillKey,
    skillVersion: baseline.skillVersion,
    contractVersion: baseline.contractVersion,
    capabilityDefinitionDigestSha256:
      baselineManifestValue.capabilityDefinitionDigestSha256,
    observedReleaseRef: ref('visual-intelligence-qualified-release'),
    observedAt: '2026-08-04T00:00:00.000Z',
    overall: 'partially_qualified',
    jobQualifications: baseline.jobQualifications.map((item) =>
      item.jobType === 'source_video_understanding'
        ? {
            jobType: item.jobType,
            status: 'qualified' as const,
            blockerCodes: [],
            qualifiedRouteIds: baselineManifestValue.toolRoutes
              .filter((route) => route.jobTypes.includes(item.jobType))
              .map((route) => route.routeId)
              .sort(compare),
            qualificationEvidenceRefs: [ref('source-job-qualification')],
          }
        : item),
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function ownerAuthorityPort(
  value: ReturnType<typeof createCanonicalSourceAnalysisOrchestraAuthority>,
) {
  return {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_ORCHESTRA_AUTHORITY_READ_PORT_VERSION,
    async readExactSourceVideoUnderstandingAuthority() {
      return structuredClone(value)
    },
  } as const
}

function ownerTranscriptPort(
  value: CanonicalVisualIntelligenceSourceTranscriptResult | null,
) {
  return {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted() { return value ? structuredClone(value) : null },
  } as const
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
