import assert from 'node:assert/strict'

import {
  calculatePrivateGcpVisualCoverageDigest,
  createPrivateGcpVisualUnderstandingPlan,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import {
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION,
  type LivingFramePostrenderCompleteCoverageManifest,
  type LivingFramePostrenderVisualInspectionProviderResultDraft,
} from '../../src/types/living-frame-postrender-visual-inspection'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFramePostrenderVisualInspectionChecklist,
  compileLivingFramePostrenderVisualInspectionProviderResult,
  compileLivingFramePostrenderVisualInspectionRequest,
  verifyLivingFramePostrenderVisualInspectionProviderResult,
  verifyLivingFramePostrenderVisualInspectionRequest,
  type CompileLivingFramePostrenderVisualInspectionRequestInput,
} from '../living-frame/living-frame-postrender-visual-inspection'

const sha = (seed: string) =>
  sha256AuthorityValue({ seed })
const image = (seed: string) =>
  `sha256:${sha(seed)}`

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const finalArtifactId =
  'artifact.hormuz.living-frame.final.v1'
const finalSha = sha('hormuz-final-render')
const phaseFrames = [0, 24, 60, 96, 119]
const qwenSamples = phaseFrames.map((frame, order) => ({
  sampleId: `qwen.sample.hormuz.${order}`,
  sourceFrame: frame,
  reason: 'postrender_qa' as const,
  source: 'analysis_proxy_frame' as const,
  proxyFrameChecksumSha256:
    sha(`proxy-frame-${frame}`),
  rawFramePersistenceAllowed: false as const,
}))
const qwenCoverageWithoutDigest = {
  policyVersion:
    'private-gcp-qwen25vl-sampling-policy-v1' as const,
  profileId:
    'professional_targeted_visual_coverage_v1' as const,
  editLevel: 'normal' as const,
  deterministicTechnicalCoverageComplete: true,
  sceneDetectionArtifactId:
    'artifact.hormuz.scene-detection.v1',
  sceneDetectionArtifactSha256:
    sha('hormuz-scene-detection'),
  detectedSceneCount: 1,
  visuallyCoveredSceneCount: 1,
  maximumUnobservedSpanSeconds: 300,
  samplesPerBatchMaximum: 64 as const,
  batchCount: 1,
  samples: qwenSamples,
  windows: [{
    windowId: 'qwen.window.hormuz.scene.v1',
    reason: 'postrender_qa' as const,
    detectedSceneId: 'scene.hormuz.living-a-roll',
    startFrame: 0,
    endFrameExclusive: 120,
    required: true,
    sampleIds: qwenSamples.map((sample) => sample.sampleId),
  }],
}
const qwenCoverage = {
  ...qwenCoverageWithoutDigest,
  coverageDigestSha256:
    calculatePrivateGcpVisualCoverageDigest(
      qwenCoverageWithoutDigest,
    ),
}
const qwenPlan = createPrivateGcpVisualUnderstandingPlan({
  analysisRunId: 'analysis.hormuz.postrender.v1',
  attemptId: 'attempt.hormuz.postrender.1',
  attemptOrdinal: 1,
  workspaceId: 'workspace.hormuz',
  projectId: 'project.hormuz',
  editSessionId: 'edit.hormuz',
  idempotencyKey: 'idempotency.hormuz.visual-qa.v1',
  authority: {
    phase: 'postrender_private_visual_qa',
    approvedPlanSnapshotId: 'snapshot.hormuz.v1',
    creditReservationId: 'reservation.hormuz.v1',
    approvedWorkItemId: 'work.hormuz.visual-qa.v1',
    privateRenderArtifactId: finalArtifactId,
    privateRenderSha256: finalSha,
    customerChargeAuthorized: false,
  },
  source: {
    sourceAssetId: finalArtifactId,
    storageBucket: 'reeditpro-private-fixtures',
    storageObjectName: 'hormuz/final-v1.mp4',
    storageObjectGeneration: '1',
    sourceChecksumSha256: finalSha,
    sourceByteLength: 4_200_000,
    sourceWidth: 1920,
    sourceHeight: 1080,
    durationFrames: 120,
    frameRateNumerator: 24,
    frameRateDenominator: 1,
    immutableOriginal: true,
    privateObject: true,
  },
  proxy: {
    proxyAssetId: 'artifact.hormuz.visual-qa.proxy.v1',
    storageBucket: 'reeditpro-private-fixtures',
    storageObjectName: 'hormuz/visual-qa-proxy-v1.mp4',
    storageObjectGeneration: '1',
    proxyChecksumSha256: sha('hormuz-proxy'),
    sourceChecksumSha256: finalSha,
    profileId: 'professional_1080p_analysis_proxy_v2',
    width: 1920,
    height: 1080,
    outputColorSpace: 'bt709',
    colorTransformStatus: 'validated_rec709_sdr',
    privateObject: true,
    originalMasterPreserved: true,
  },
  checkpoint: {
    modelId: 'qwen2.5-vl-7b-instruct',
    checkpointSha256: sha('qwen-checkpoint'),
    tokenizerSha256: sha('qwen-tokenizer'),
    processorSha256: sha('qwen-processor'),
    containerImageDigest: image('qwen-image'),
    precision: 'bf16',
    modelApprovalRecordId: 'approval.qwen.model.v1',
    licenseReviewRecordId: 'review.qwen.license.v1',
  },
  coverage: qwenCoverage,
  evidenceSchemaVersion:
    'private-gcp-qwen25vl-evidence-schema-v1',
  promptPolicyVersion:
    'private-gcp-qwen25vl-visual-prompt-policy-v1',
  serverReadiness: {
    source: 'server_owned_private_gcp_visual_readiness',
    executionEnvironment: 'internal',
    readinessEvidenceId: 'readiness.qwen.hormuz.v1',
    readinessEvidenceSha256: sha('qwen-readiness'),
    verifiedAt: '2026-07-31T12:00:00.000Z',
    cloudRunJobResourceVerified: true,
    workerServiceAccountAndIamVerified: true,
    privateGcsGenerationBoundTransportVerified: true,
    workerImageDigestVerified: true,
    checkpointPresentInApprovedImage: true,
    modelAndLicenseApprovalVerified: true,
    canonicalQueueLeaseAndOneUseDispatchVerified: true,
    cancellationRetryAndLeaseRecoveryVerified: true,
    telemetryAndCostRateSnapshotVerified: true,
    deploymentRegionAndDataPolicyVerified: true,
    environmentGpuExecutionGateVerified: true,
  },
})
assert.equal(qwenPlan.executionReady, true)

const phaseSamples = phaseFrames.map((frame, order) => ({
  order,
  role: (['entry', 'peak', 'hold', 'settle', 'exit'] as const)[order]!,
  sampleId: `review.sample.hormuz.${order}`,
  qwenPlanSampleId: qwenSamples[order]!.sampleId,
  frame,
  frameChecksumSha256:
    qwenSamples[order]!.proxyFrameChecksumSha256,
}))
const coverageWithoutDigest = {
  coverageManifestId: 'coverage.hormuz.postrender.v1',
  coverageMode: 'model_video_temporal_windows' as const,
  frameCount: 120,
  completeTimelineWindows: [
    window(0, 'timeline.0', 'complete_timeline_chunk', 0, 40, [0, 1]),
    window(1, 'timeline.1', 'complete_timeline_chunk', 40, 80, [2]),
    window(2, 'timeline.2', 'complete_timeline_chunk', 80, 120, [3, 4]),
  ],
  sceneWindows: [
    window(0, 'scene.0', 'scene', 0, 120, [0, 1, 2, 3, 4]),
  ],
  transitionWindows: [
    window(0, 'transition.0', 'transition', 80, 108, [3]),
  ],
  boundaryWindows: [
    window(0, 'boundary.entry', 'boundary', 0, 25, [0, 1]),
    window(1, 'boundary.exit', 'boundary', 96, 120, [3, 4]),
  ],
  transitionPresent: true,
  phaseSamples,
  coveredFrameCount: 120,
  startsAtFrameZero: true as const,
  endsAtFinalFrame: true as const,
  noTimelineGap: true as const,
  noTimelineOverlap: true as const,
  completeTimeCoverageProofRequired: true as const,
}
const coverage: LivingFramePostrenderCompleteCoverageManifest = {
  ...coverageWithoutDigest,
  coverageDigestSha256:
    sha256AuthorityValue(coverageWithoutDigest),
}

const requestInput:
  CompileLivingFramePostrenderVisualInspectionRequestInput = {
    requestId: 'request.hormuz.postrender-visual-qa.v1',
    scope: {
      workspaceId: 'workspace.hormuz',
      projectId: 'project.hormuz',
      editSessionId: 'edit.hormuz',
      sceneId: 'scene.hormuz.living-a-roll',
      executionPackageId: 'package.hormuz.v1',
      approvedWorkItemId: 'work.hormuz.visual-qa.v1',
      idempotencyKey: 'idempotency.hormuz.visual-qa.v1',
    },
    ownerScopeAmendment,
    sourceBindings: {
      approvedSnapshotId: 'snapshot.hormuz.v1',
      approvedSnapshotHashSha256: sha('snapshot'),
      selectedSceneBindingDigestSha256: sha('selected-scene'),
      currentMasterTimingDigestSha256: sha('master-timing'),
      rendererBindingDigestSha256: sha('renderer'),
      rendererLayerManifestDigestSha256: sha('layers'),
      visualOccupancyDigestSha256: sha('occupancy'),
      captionDirectionDigestSha256: sha('caption'),
      soundSyncDigestSha256: sha('soundsync'),
      confirmedOutputFrameDigestSha256: sha('frame'),
    },
    finalRender: {
      artifactId: finalArtifactId,
      expectedAssetId: 'expected.hormuz.final.v1',
      privateObjectIdentityHash: sha('private-object'),
      sha256: finalSha,
      byteLength: 4_200_000,
      contentType: 'video/mp4',
      widthPixels: 1920,
      heightPixels: 1080,
      frameRateNumerator: 24,
      frameRateDenominator: 1,
      frameCount: 120,
      durationFrames: 120,
      privateArtifact: true,
      finalCanvasOwnedByRemotion: true,
    },
    deterministicFinalQa: {
      workItemId: 'work.hormuz.ffprobe-final-qa.v1',
      artifactId: finalArtifactId,
      evidenceHashSha256: sha('ffprobe-qa'),
      ffprobeOperation: 'tool.ffprobe.inspect_approved_media.v1',
      passed: true,
    },
    qwenPlan,
    coverage,
  }

const request =
  compileLivingFramePostrenderVisualInspectionRequest(requestInput)
assert.equal(
  verifyLivingFramePostrenderVisualInspectionRequest(
    request,
    requestInput,
  ),
  true,
)
assert.equal(request.currentProviderAdapterSupportsThisRequest, false)
assert.equal(request.callerInspectionAssertionsMaySatisfyProfessionalReview, false)
assert.equal(request.qwenAuthority.qwenMayApproveEdit, false)
assert.equal(
  request.qwenAuthority.existingEvidenceVerifier,
  'verifyPrivateGcpVisualEvidencePackage',
)
assert.equal(
  request.qwenAuthority.existingEvidencePackageCanProveProviderCall,
  false,
)
assert.equal(request.headQaPolicy.primaryModelRoleId, 'kimi_k3_main_edit_agent')
assert.equal(
  request.headQaPolicy.fallbackModelRoleId,
  'gpt_5_6_terra_fallback_edit_agent',
)

const denseCoverage = withCoverageDigest({
  ...coverage,
  completeTimelineWindows: Array.from(
    { length: 6 },
    (_, order) =>
      window(
        order,
        `complete-dense-${order}`,
        'complete_timeline_chunk',
        order * 20,
        (order + 1) * 20,
        [],
      ),
  ),
})
const denseCoverageRequest =
  compileLivingFramePostrenderVisualInspectionRequest({
    ...requestInput,
    requestId: 'lf.postrender.visual.request.hormuz.dense.v1',
    coverage: denseCoverage,
  })
assert.equal(
  denseCoverageRequest.coverage.completeTimelineWindows.length,
  6,
)

const resultDraft = providerResultDraft(request)
const result =
  compileLivingFramePostrenderVisualInspectionProviderResult(
    request,
    resultDraft,
  )
assert.equal(
  verifyLivingFramePostrenderVisualInspectionProviderResult(
    result,
    request,
  ),
  true,
)
const checklist =
  compileLivingFramePostrenderVisualInspectionChecklist(
    request,
    result,
    { soundPresent: true },
  )
assert.equal(checklist.structuralResultVerified, true)
assert.equal(checklist.providerExecutionClaimIsNotCanonicalEvidence, true)
assert.equal(
  checklist.canonicalEvidenceMustPassExistingGeneralVerifierOrVersionedSuccessor,
  true,
)
assert.equal(checklist.separateAudioEvidenceRequired, true)
assert.equal(checklist.professionalReviewInputReady, false)
assert.equal(checklist.privateReviewApproved, false)

let adversarialAssertions = 0
rejectRequest({
  ...requestInput,
  rawPrompt: 'forbidden',
} as unknown as CompileLivingFramePostrenderVisualInspectionRequestInput)
rejectRequest({
  ...requestInput,
  qwenPlan: {
    ...qwenPlan,
    phase: 'preplan_internal_source_analysis',
  },
})
rejectRequest({
  ...requestInput,
  finalRender: {
    ...requestInput.finalRender,
    artifactId: 'artifact.other.final.v1',
  },
})
rejectRequest({
  ...requestInput,
  coverage: withCoverageDigest({
    ...coverage,
    completeTimelineWindows:
      coverage.completeTimelineWindows.map((item, index) =>
        index === 1
          ? { ...item, startFrame: 41 }
          : item),
  }),
})
rejectRequest({
  ...requestInput,
  coverage: withCoverageDigest({
    ...coverage,
    phaseSamples:
      coverage.phaseSamples.map((item, index) =>
        index === 2
          ? { ...item, frame: 24 }
          : item),
  }),
})
rejectResult({
  ...resultDraft,
  artifactBinding: {
    ...resultDraft.artifactBinding,
    artifactId: 'artifact.other.final.v1',
  },
})
rejectResult({
  ...resultDraft,
  audioOrTranscriptAuthorityClaimed: true,
} as unknown as LivingFramePostrenderVisualInspectionProviderResultDraft)
rejectResult({
  ...resultDraft,
  checks: resultDraft.checks.slice(1),
})
rejectResult({
  ...resultDraft,
  providerExecutionClaim: {
    ...resultDraft.providerExecutionClaim,
    modelRoleId: 'qwen_3_7_main_edit_agent',
  },
} as unknown as LivingFramePostrenderVisualInspectionProviderResultDraft)
rejectResult({
  ...resultDraft,
  coverageResult: {
    ...resultDraft.coverageResult,
    coveredFrameCount: 119,
  },
})

assert.equal(adversarialAssertions, 10)
assert.equal(request.operationRegistered, false)
assert.equal(request.dispatchGranted, false)
assert.equal(request.runtimeExecuted, false)
assert.equal(request.canonicalQaApproved, false)
assert.equal(request.productionReady, false)

console.log(JSON.stringify({
  smoke: 'living-frame-postrender-visual-inspection',
  controlledCases: 2,
  adversarialAssertions,
  orderedVisualCheckCount: request.orderedCheckIds.length,
  completeTimelineWindowCount:
    request.coverage.completeTimelineWindows.length,
  denseCoverageWindowCount:
    denseCoverageRequest.coverage.completeTimelineWindows.length,
  requiredPhaseSampleCount:
    request.coverage.phaseSamples.length,
  qwenVisualEvidenceOnly: true,
  separateAudioEvidenceRequired:
    checklist.separateAudioEvidenceRequired,
  callerAssertionCanApprove: false,
  professionalReviewInputReady: false,
  canonicalAdmissionPending: true,
  productionReady: false,
  status: 'passed_source_only',
}))

function window(
  order: number,
  suffix: string,
  kind:
    LivingFramePostrenderCompleteCoverageManifest[
      'completeTimelineWindows'
    ][number]['kind'],
  startFrame: number,
  endFrameExclusive: number,
  sampleIndexes: readonly number[],
) {
  return {
    order,
    windowId: `review.window.hormuz.${suffix}`,
    kind,
    selectedSceneId: 'scene.hormuz.living-a-roll',
    startFrame,
    endFrameExclusive,
    required: true as const,
    sampleIds: sampleIndexes.map(
      (index) => `review.sample.hormuz.${index}`,
    ),
  }
}

function withCoverageDigest(
  value: LivingFramePostrenderCompleteCoverageManifest,
): LivingFramePostrenderCompleteCoverageManifest {
  const without = structuredClone(value) as unknown as Record<string, unknown>
  Reflect.deleteProperty(without, 'coverageDigestSha256')
  return {
    ...value,
    coverageDigestSha256: sha256AuthorityValue(without),
  }
}

function providerResultDraft(
  compiledRequest:
    ReturnType<typeof compileLivingFramePostrenderVisualInspectionRequest>,
): LivingFramePostrenderVisualInspectionProviderResultDraft {
  const sampleIds = compiledRequest.coverage.phaseSamples
    .map((sample) => sample.sampleId)
  const windowIds = [
    ...compiledRequest.coverage.completeTimelineWindows,
    ...compiledRequest.coverage.sceneWindows,
    ...compiledRequest.coverage.transitionWindows,
    ...compiledRequest.coverage.boundaryWindows,
  ].map((item) => item.windowId)
  return {
    schemaVersion:
      LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION,
    requestId: compiledRequest.requestId,
    requestDigestSha256:
      compiledRequest.requestDigestSha256,
    existingQwenPlanHashSha256:
      compiledRequest.qwenAuthority.existingPlanHashSha256,
    scope: {
      workspaceId: compiledRequest.scope.workspaceId,
      projectId: compiledRequest.scope.projectId,
      editSessionId: compiledRequest.scope.editSessionId,
      sceneId: compiledRequest.scope.sceneId,
      approvedSnapshotId:
        compiledRequest.sourceBindings.approvedSnapshotId,
      approvedWorkItemId:
        compiledRequest.scope.approvedWorkItemId,
    },
    artifactBinding: {
      artifactId: compiledRequest.finalRender.artifactId,
      privateObjectIdentityHash:
        compiledRequest.finalRender.privateObjectIdentityHash,
      sha256: compiledRequest.finalRender.sha256,
    },
    providerExecutionClaim: {
      modelRoleId:
        compiledRequest.qwenAuthority.modelRoleId,
      modelId: compiledRequest.qwenAuthority.modelId,
      providerBoundary:
        compiledRequest.qwenAuthority.providerBoundary,
      checkpointSha256:
        compiledRequest.qwenAuthority.checkpointSha256,
      containerImageDigest:
        compiledRequest.qwenAuthority.containerImageDigest,
      runtimeEvidenceDigestSha256: sha('runtime'),
      dispatchReceiptDigestSha256: sha('dispatch'),
      oneUseLeaseReceiptDigestSha256: sha('lease'),
      attemptReceiptDigestSha256: sha('attempt'),
      attemptCostEvidenceDigestSha256: sha('cost'),
      providerCallClaimed: true,
      oneProviderAttemptClaimed: true,
    },
    coverageResult: {
      requestCoverageDigestSha256:
        compiledRequest.coverage.coverageDigestSha256,
      coveredWindowIds: windowIds,
      coveredSampleIds: sampleIds,
      coveredFrameCount:
        compiledRequest.finalRender.frameCount,
      completeTimelineCovered: true,
      deterministicCoverageIntegrityPassed: true,
    },
    checks:
      LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.map(
        (checkId, order) => ({
          order,
          checkId,
          disposition: 'pass' as const,
          observations: [{
            observationId:
              `observation.hormuz.${order}`,
            summary:
              `The exact rendered scene was visually inspected for ${checkId.replaceAll('_', ' ')}.`,
            confidenceBasisPoints: 9_200,
            uncertainty: 'low' as const,
            evidenceSampleIds: [
              sampleIds[order % sampleIds.length]!,
            ],
            startFrame: 0,
            endFrameExclusive:
              compiledRequest.finalRender.frameCount,
          }],
        }),
      ),
    visualRiskIds: [],
    repairTargetIds: [],
    unsupportedClaimCount: 0,
    audioOrTranscriptAuthorityClaimed: false,
    rawFramePersisted: false,
    containsRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment:
      false,
  }
}

function rejectRequest(
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): void {
  assert.throws(
    () =>
      compileLivingFramePostrenderVisualInspectionRequest(input),
    /Invalid|invalid|substitution|coverage|Qwen|phase samples|windows|digest/u,
  )
  adversarialAssertions += 1
}

function rejectResult(
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  assert.throws(
    () =>
      compileLivingFramePostrenderVisualInspectionProviderResult(
        request,
        draft,
      ),
    /Invalid|invalid|substitution|Incomplete/u,
  )
  adversarialAssertions += 1
}
