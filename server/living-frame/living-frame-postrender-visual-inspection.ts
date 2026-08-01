import type {
  PrivateGcpVisualUnderstandingPlan,
} from '../../src/types/private-gcp-visual-understanding'
import {
  createPrivateGcpVisualUnderstandingPlan,
} from '../../src/lib/private-gcp-visual-understanding-contract'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import {
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CHECKLIST_VERSION,
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CLASS,
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_OPEN_GATES,
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_REQUEST_VERSION,
  LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION,
  type LivingFramePostrenderCompleteCoverageManifest,
  type LivingFramePostrenderCoverageWindow,
  type LivingFramePostrenderVisualInspectionChecklist,
  type LivingFramePostrenderVisualInspectionProviderResult,
  type LivingFramePostrenderVisualInspectionProviderResultDraft,
  type LivingFramePostrenderVisualInspectionRequest,
  type LivingFramePostrenderVisualInspectionRequestDraft,
} from '../../src/types/living-frame-postrender-visual-inspection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const IMAGE_DIGEST = /^sha256:[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:(?:[a-z][a-z0-9+.-]*):\/\/|(?:^|\s)\/[A-Za-z0-9._-]|\\|\.\.\/|[<>`]|(?:^|\W)(?:curl|wget|bash|sh|python|node|powershell|sudo)(?:\W|$))/iu
const PHASE_SAMPLE_ROLES = [
  'entry',
  'peak',
  'hold',
  'settle',
  'exit',
] as const

type RequestScope =
  LivingFramePostrenderVisualInspectionRequestDraft['scope']
type RequestSourceBindings = Omit<
  LivingFramePostrenderVisualInspectionRequestDraft['sourceBindings'],
  | 'ownerScopeAmendmentVersion'
  | 'ownerScopeAmendmentDigestSha256'
>

export interface CompileLivingFramePostrenderVisualInspectionRequestInput {
  readonly requestId: string
  readonly scope: RequestScope
  readonly ownerScopeAmendment:
    LivingFrameOwnerScopeAmendment
  readonly sourceBindings: RequestSourceBindings
  readonly finalRender:
    LivingFramePostrenderVisualInspectionRequestDraft['finalRender']
  readonly deterministicFinalQa:
    LivingFramePostrenderVisualInspectionRequestDraft['deterministicFinalQa']
  readonly qwenPlan:
    PrivateGcpVisualUnderstandingPlan
  readonly coverage:
    LivingFramePostrenderCompleteCoverageManifest
}

export function compileLivingFramePostrenderVisualInspectionRequest(
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): LivingFramePostrenderVisualInspectionRequest {
  assertRequestInput(input)
  const draft:
    LivingFramePostrenderVisualInspectionRequestDraft = {
      contractVersion:
        LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_REQUEST_VERSION,
      resultClass:
        LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CLASS,
      requestState:
        'exact_private_postrender_visual_evidence_request_compiled_canonical_admission_pending',
      requestId: input.requestId,
      scope: structuredClone(input.scope),
      sourceBindings: {
        ownerScopeAmendmentVersion:
          input.ownerScopeAmendment.contractVersion,
        ownerScopeAmendmentDigestSha256:
          input.ownerScopeAmendment.amendmentDigestSha256,
        ...structuredClone(input.sourceBindings),
      },
      finalRender:
        structuredClone(input.finalRender),
      deterministicFinalQa:
        structuredClone(input.deterministicFinalQa),
      qwenAuthority: {
        existingPlanContractVersion:
          'private-gcp-qwen25vl-visual-understanding-v1',
        existingEvidencePackageSchemaVersion:
          'private-gcp-qwen25vl-evidence-package-v1',
        existingEvidenceVerifier:
          'verifyPrivateGcpVisualEvidencePackage',
        existingEvidencePackageCanProveProviderCall: false,
        existingPlanHashSha256:
          input.qwenPlan.planHash,
        phase: 'postrender_private_visual_qa',
        analysisRunId:
          input.qwenPlan.analysisRunId,
        attemptId:
          input.qwenPlan.attemptId,
        modelRoleId:
          'qwen2_5_vl_visual_understanding',
        modelId: 'qwen2.5-vl-7b-instruct',
        providerBoundary:
          'qwen2_5_vl_7b_instruct_provider_boundary',
        checkpointSha256:
          input.qwenPlan.checkpoint.checkpointSha256,
        containerImageDigest:
          input.qwenPlan.checkpoint.containerImageDigest,
        qwenProducesVisualEvidenceOnly: true,
        qwenMayApproveEdit: false,
        qwenMaySetCreativeDirection: false,
        qwenMayClaimAudioOrTranscriptAuthority: false,
      },
      coverage: structuredClone(input.coverage),
      orderedCheckIds: [
        ...LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
      ],
      resultRequirements: {
        exactRequestPlanArtifactSnapshotAndSceneBinding: true,
        exactCoveredWindowSampleAndTimeRangeEvidence: true,
        oneDispositionAndGroundedObservationPerOrderedCheck: true,
        confidenceUncertaintyAndEvidenceFramesPerObservation: true,
        visualRisksAndRepairTargets: true,
        unsupportedClaimCountMustBeZero: true,
        deterministicCoverageAndIntegrityVerification: true,
        checkpointImageRuntimeLeaseAttemptAndCostProvenance: true,
        audioOrTranscriptAuthorityClaimedMustBeFalse: true,
        noRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment: true,
      },
      headQaPolicy: {
        primaryModelRoleId:
          'kimi_k3_main_edit_agent',
        fallbackModelRoleId:
          'gpt_5_6_terra_fallback_edit_agent',
        fallbackOnlyAfterAllowedClassifiedPrimaryFailure: true,
        exactImmutableEvidencePackageRequired: true,
        verifiedQwenVisualEvidenceRequired: true,
        separateVerifiedDeterministicAndAudioEvidenceRequired: true,
        recommendationOnly: [
          'accept',
          'repair',
          'reject',
        ],
        modelRecommendationMayReplaceCanonicalApproval: false,
        modelRecommendationMayReplaceUserPrivateReview: false,
      },
      activeScope: {
        nonCharacterOnly: true,
        animatedLivingOrOrganicSubjectAllowed: false,
        completeCharacterKeyposeOrInterpolationAllowed: false,
        livingSubjectRiggingAllowed: false,
        mechanicalRiggingAllowed: false,
        staticIllustrationMayRemainUnanimated: true,
      },
      currentProviderAdapterSupportsThisRequest: false,
      currentExistingEvidencePackageCanProveActualProviderCall: false,
      callerInspectionAssertionsMaySatisfyProfessionalReview: false,
      canonicalAdmissionRequired: true,
      openGateCodes: [
        ...LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_OPEN_GATES,
      ],
      authorityBoundary: {
        requestCandidateAuthority: true,
        providerSelectionAuthority: false,
        providerCallAuthority: false,
        workGraphAuthority: false,
        queueAuthority: false,
        leaseAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        costAuthority: false,
        artifactAuthority: false,
        artifactQaAuthority: false,
        reconciliationAuthority: false,
        professionalReviewAcceptanceAuthority: false,
        canonicalQaApprovalAuthority: false,
        privateReviewAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      resultArtifactCreated: false,
      professionalVisualAcceptancePassed: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    requestDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFramePostrenderVisualInspectionRequest(
  value: unknown,
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): value is LivingFramePostrenderVisualInspectionRequest {
  if (
    !isRecord(value)
    || !SHA256.test(String(value.requestDigestSha256 ?? ''))
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFramePostrenderVisualInspectionRequest(input),
      )
  } catch {
    return false
  }
}

export function compileLivingFramePostrenderVisualInspectionProviderResult(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): LivingFramePostrenderVisualInspectionProviderResult {
  assertProviderResult(request, draft)
  return deepFreeze({
    ...structuredClone(draft),
    resultDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFramePostrenderVisualInspectionProviderResult(
  value: unknown,
  request: LivingFramePostrenderVisualInspectionRequest,
): value is LivingFramePostrenderVisualInspectionProviderResult {
  if (
    !isRecord(value)
    || !SHA256.test(String(value.resultDigestSha256 ?? ''))
  ) return false
  const { resultDigestSha256, ...draft } = value
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFramePostrenderVisualInspectionProviderResult(
          request,
          draft as unknown as
            LivingFramePostrenderVisualInspectionProviderResultDraft,
        ),
      )
      && resultDigestSha256
        === sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

export function compileLivingFramePostrenderVisualInspectionChecklist(
  request: LivingFramePostrenderVisualInspectionRequest,
  result: LivingFramePostrenderVisualInspectionProviderResult,
  input: {
    readonly soundPresent: boolean
  },
): LivingFramePostrenderVisualInspectionChecklist {
  if (
    !hasExactKeys(input, ['soundPresent'])
    || typeof input.soundPresent !== 'boolean'
    || !verifyLivingFramePostrenderVisualInspectionProviderResult(
      result,
      request,
    )
  ) throw new Error('Invalid Living Frame postrender visual inspection checklist input.')
  const withoutDigest = {
    contractVersion:
      LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_CHECKLIST_VERSION,
    requestDigestSha256:
      request.requestDigestSha256,
    resultDigestSha256:
      result.resultDigestSha256,
    structuralResultVerified: true as const,
    exactRequestArtifactCoverageAndCheckBindingVerified:
      true as const,
    providerExecutionClaimIsNotCanonicalEvidence:
      true as const,
    canonicalQueueLeaseAttemptAndCostRereadRequired:
      true as const,
    canonicalCreateOnlyPersistenceQaAndReconciliationRequired:
      true as const,
    canonicalEvidenceMustPassExistingGeneralVerifierOrVersionedSuccessor:
      true as const,
    separateAudioEvidenceRequired:
      input.soundPresent,
    headQaRecommendationRequired: true as const,
    existingProfessionalReviewV1CallerAssertionMayApprove:
      false as const,
    eligibleForCanonicalAdmissionReview:
      true as const,
    professionalReviewInputReady:
      false as const,
    canonicalQaApproved: false as const,
    privateReviewApproved: false as const,
    productionReady: false as const,
  }
  return deepFreeze({
    ...withoutDigest,
    checklistDigestSha256:
      sha256AuthorityValue(withoutDigest),
  })
}

function assertRequestInput(
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'requestId',
      'scope',
      'ownerScopeAmendment',
      'sourceBindings',
      'finalRender',
      'deterministicFinalQa',
      'qwenPlan',
      'coverage',
    ])
    || !SAFE_ID.test(input.requestId)
    || !verifyLivingFrameOwnerScopeAmendment(
      input.ownerScopeAmendment,
    )
  ) throw new Error('Invalid Living Frame postrender visual inspection request input.')
  assertScope(input.scope)
  assertSourceBindings(input.sourceBindings)
  assertFinalRender(input.finalRender)
  assertFinalQa(input)
  assertQwenPlan(input)
  assertCoverage(input.coverage, input.qwenPlan)
}

function assertScope(scope: RequestScope): void {
  if (
    !isRecord(scope)
    || !hasExactKeys(scope, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'sceneId',
      'executionPackageId',
      'approvedWorkItemId',
      'idempotencyKey',
    ])
    || Object.values(scope).some(
      (value) =>
        typeof value !== 'string'
        || !SAFE_ID.test(value),
    )
  ) throw new Error('Invalid Living Frame postrender visual inspection scope.')
}

function assertSourceBindings(
  bindings: RequestSourceBindings,
): void {
  if (
    !isRecord(bindings)
    || !hasExactKeys(bindings, [
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'selectedSceneBindingDigestSha256',
      'currentMasterTimingDigestSha256',
      'rendererBindingDigestSha256',
      'rendererLayerManifestDigestSha256',
      'visualOccupancyDigestSha256',
      'captionDirectionDigestSha256',
      'soundSyncDigestSha256',
      'confirmedOutputFrameDigestSha256',
    ])
    || !SAFE_ID.test(bindings.approvedSnapshotId)
    || !allSha256([
      bindings.approvedSnapshotHashSha256,
      bindings.selectedSceneBindingDigestSha256,
      bindings.currentMasterTimingDigestSha256,
      bindings.rendererBindingDigestSha256,
      bindings.rendererLayerManifestDigestSha256,
      bindings.visualOccupancyDigestSha256,
      bindings.captionDirectionDigestSha256,
      bindings.soundSyncDigestSha256,
      bindings.confirmedOutputFrameDigestSha256,
    ])
  ) throw new Error('Invalid Living Frame postrender visual inspection source binding.')
}

function assertFinalRender(
  render:
    LivingFramePostrenderVisualInspectionRequestDraft['finalRender'],
): void {
  if (
    !isRecord(render)
    || !hasExactKeys(render, [
      'artifactId',
      'expectedAssetId',
      'privateObjectIdentityHash',
      'sha256',
      'byteLength',
      'contentType',
      'widthPixels',
      'heightPixels',
      'frameRateNumerator',
      'frameRateDenominator',
      'frameCount',
      'durationFrames',
      'privateArtifact',
      'finalCanvasOwnedByRemotion',
    ])
    || !SAFE_ID.test(render.artifactId)
    || !SAFE_ID.test(render.expectedAssetId)
    || !allSha256([
      render.privateObjectIdentityHash,
      render.sha256,
    ])
    || !positiveInteger(render.byteLength)
    || render.contentType !== 'video/mp4'
    || !positiveInteger(render.widthPixels)
    || !positiveInteger(render.heightPixels)
    || !positiveInteger(render.frameRateNumerator)
    || !positiveInteger(render.frameRateDenominator)
    || render.frameRateNumerator / render.frameRateDenominator > 240
    || !positiveInteger(render.frameCount)
    || render.durationFrames !== render.frameCount
    || render.privateArtifact !== true
    || render.finalCanvasOwnedByRemotion !== true
  ) throw new Error('Invalid Living Frame final render identity.')
}

function assertFinalQa(
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): void {
  const qa = input.deterministicFinalQa
  if (
    !isRecord(qa)
    || !hasExactKeys(qa, [
      'workItemId',
      'artifactId',
      'evidenceHashSha256',
      'ffprobeOperation',
      'passed',
    ])
    || !SAFE_ID.test(qa.workItemId)
    || qa.artifactId !== input.finalRender.artifactId
    || !SHA256.test(qa.evidenceHashSha256)
    || qa.ffprobeOperation !==
      'tool.ffprobe.inspect_approved_media.v1'
    || qa.passed !== true
  ) throw new Error('Invalid Living Frame deterministic final-QA binding.')
}

function assertQwenPlan(
  input:
    CompileLivingFramePostrenderVisualInspectionRequestInput,
): void {
  const plan = input.qwenPlan
  const rebuilt = createPrivateGcpVisualUnderstandingPlan({
    analysisRunId: plan.analysisRunId,
    attemptId: plan.attemptId,
    attemptOrdinal: plan.attemptOrdinal,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    idempotencyKey: plan.idempotencyKey,
    authority: plan.authority,
    source: plan.source,
    proxy: plan.proxy,
    checkpoint: plan.checkpoint,
    coverage: plan.coverage,
    evidenceSchemaVersion:
      plan.evidenceSchemaVersion,
    promptPolicyVersion:
      plan.promptPolicyVersion,
    serverReadiness: plan.serverReadiness,
  })
  if (
    stableAuthorityStringify(rebuilt)
      !== stableAuthorityStringify(plan)
    || plan.schemaVersion !==
      'private-gcp-qwen25vl-visual-understanding-v1'
    || plan.phase !== 'postrender_private_visual_qa'
    || plan.authority.phase !==
      'postrender_private_visual_qa'
    || !plan.structurallyValid
    || !plan.executionReady
    || plan.blockers.length !== 0
    || plan.workspaceId !== input.scope.workspaceId
    || plan.projectId !== input.scope.projectId
    || plan.editSessionId !== input.scope.editSessionId
    || plan.idempotencyKey !== input.scope.idempotencyKey
    || plan.authority.approvedPlanSnapshotId
      !== input.sourceBindings.approvedSnapshotId
    || plan.authority.approvedWorkItemId
      !== input.scope.approvedWorkItemId
    || plan.authority.privateRenderArtifactId
      !== input.finalRender.artifactId
    || plan.authority.privateRenderSha256
      !== input.finalRender.sha256
    || plan.source.sourceAssetId
      !== input.finalRender.artifactId
    || plan.source.sourceChecksumSha256
      !== input.finalRender.sha256
    || plan.source.sourceByteLength
      !== input.finalRender.byteLength
    || plan.source.sourceWidth
      !== input.finalRender.widthPixels
    || plan.source.sourceHeight
      !== input.finalRender.heightPixels
    || plan.source.durationFrames
      !== input.finalRender.frameCount
    || plan.source.frameRateNumerator
      !== input.finalRender.frameRateNumerator
    || plan.source.frameRateDenominator
      !== input.finalRender.frameRateDenominator
    || plan.checkpoint.modelId !==
      'qwen2.5-vl-7b-instruct'
    || plan.boundaries.providerCallMade !== false
    || plan.boundaries.gpuJobCreated !== false
    || plan.boundaries.gcsReadMade !== false
    || plan.boundaries.productReady !== false
    || plan.boundaries.productionReady !== false
  ) throw new Error('Invalid Living Frame postrender Qwen authority binding.')
}

function assertCoverage(
  coverage:
    LivingFramePostrenderCompleteCoverageManifest,
  qwenPlan:
    PrivateGcpVisualUnderstandingPlan,
): void {
  if (
    !isRecord(coverage)
    || !hasExactKeys(coverage, [
      'coverageManifestId',
      'coverageMode',
      'frameCount',
      'completeTimelineWindows',
      'sceneWindows',
      'transitionWindows',
      'boundaryWindows',
      'transitionPresent',
      'phaseSamples',
      'coveredFrameCount',
      'startsAtFrameZero',
      'endsAtFinalFrame',
      'noTimelineGap',
      'noTimelineOverlap',
      'completeTimeCoverageProofRequired',
      'coverageDigestSha256',
    ])
    || !SAFE_ID.test(coverage.coverageManifestId)
    || ![
      'model_video_temporal_windows',
      'deterministic_dense_frame_batches',
    ].includes(coverage.coverageMode)
    || coverage.frameCount !==
      qwenPlan.source.durationFrames
    || coverage.coveredFrameCount !== coverage.frameCount
    || coverage.startsAtFrameZero !== true
    || coverage.endsAtFinalFrame !== true
    || coverage.noTimelineGap !== true
    || coverage.noTimelineOverlap !== true
    || coverage.completeTimeCoverageProofRequired !== true
    || typeof coverage.transitionPresent !== 'boolean'
    || !SHA256.test(coverage.coverageDigestSha256)
  ) throw new Error('Invalid Living Frame complete-time coverage manifest.')

  const qwenSamples = new Map(
    qwenPlan.coverage.samples.map((sample) => [sample.sampleId, sample]),
  )
  if (
    coverage.phaseSamples.length !== PHASE_SAMPLE_ROLES.length
    || coverage.phaseSamples.some((sample, order, samples) => {
      const qwenSample = qwenSamples.get(sample.qwenPlanSampleId)
      const qwenChecksum = qwenSample?.proxyFrameChecksumSha256
        ?? qwenSample?.crop?.cropChecksumSha256
      return !isRecord(sample)
        || !hasExactKeys(sample, [
          'order',
          'role',
          'sampleId',
          'qwenPlanSampleId',
          'frame',
          'frameChecksumSha256',
        ])
        || sample.order !== order
        || sample.role !== PHASE_SAMPLE_ROLES[order]
        || !SAFE_ID.test(sample.sampleId)
        || !SAFE_ID.test(sample.qwenPlanSampleId)
        || !SHA256.test(sample.frameChecksumSha256)
        || !qwenSample
        || qwenSample.sourceFrame !== sample.frame
        || qwenChecksum !== sample.frameChecksumSha256
        || sample.frame < 0
        || sample.frame >= coverage.frameCount
        || (order > 0 && sample.frame <= samples[order - 1]!.frame)
      })
    || coverage.phaseSamples[0]?.frame !== 0
    || coverage.phaseSamples.at(-1)?.frame
      !== coverage.frameCount - 1
  ) throw new Error('Invalid Living Frame ordered phase samples.')

  const phaseSampleIds = new Set(
    coverage.phaseSamples.map((sample) => sample.sampleId),
  )
  const allWindows = [
    ...coverage.completeTimelineWindows,
    ...coverage.sceneWindows,
    ...coverage.transitionWindows,
    ...coverage.boundaryWindows,
  ]
  const windowIds = allWindows.map((window) => window.windowId)
  if (
    coverage.completeTimelineWindows.length < 1
    || coverage.sceneWindows.length < 1
    || coverage.boundaryWindows.length < 2
    || (
      coverage.transitionPresent
      && coverage.transitionWindows.length < 1
    )
    || (
      !coverage.transitionPresent
      && coverage.transitionWindows.length !== 0
    )
    || new Set(windowIds).size !== windowIds.length
    || !validWindows(
      coverage.completeTimelineWindows,
      'complete_timeline_chunk',
      coverage,
      phaseSampleIds,
      true,
      false,
    )
    || !validWindows(
      coverage.sceneWindows,
      'scene',
      coverage,
      phaseSampleIds,
      false,
      true,
    )
    || !validWindows(
      coverage.transitionWindows,
      'transition',
      coverage,
      phaseSampleIds,
      false,
      true,
    )
    || !validWindows(
      coverage.boundaryWindows,
      'boundary',
      coverage,
      phaseSampleIds,
      false,
      true,
    )
    || !coverage.boundaryWindows.some(
      (window) => window.startFrame === 0,
    )
    || !coverage.boundaryWindows.some(
      (window) =>
        window.endFrameExclusive === coverage.frameCount,
    )
  ) throw new Error('Invalid Living Frame coverage windows.')

  const withoutDigest = structuredClone(coverage) as Record<string, unknown>
  Reflect.deleteProperty(withoutDigest, 'coverageDigestSha256')
  if (
    coverage.coverageDigestSha256
      !== sha256AuthorityValue(withoutDigest)
  ) throw new Error('Invalid Living Frame coverage digest.')
}

function validWindows(
  windows: readonly LivingFramePostrenderCoverageWindow[],
  kind: LivingFramePostrenderCoverageWindow['kind'],
  coverage: LivingFramePostrenderCompleteCoverageManifest,
  sampleIds: ReadonlySet<string>,
  contiguous: boolean,
  requiresPhaseSample: boolean,
): boolean {
  for (let order = 0; order < windows.length; order += 1) {
    const window = windows[order]!
    if (
      !isRecord(window)
      || !hasExactKeys(window, [
        'order',
        'windowId',
        'kind',
        'selectedSceneId',
        'startFrame',
        'endFrameExclusive',
        'required',
        'sampleIds',
      ])
      || window.order !== order
      || window.kind !== kind
      || !SAFE_ID.test(window.windowId)
      || !SAFE_ID.test(window.selectedSceneId)
      || !Number.isSafeInteger(window.startFrame)
      || window.startFrame < 0
      || !Number.isSafeInteger(window.endFrameExclusive)
      || window.endFrameExclusive <= window.startFrame
      || window.endFrameExclusive > coverage.frameCount
      || window.required !== true
      || !Array.isArray(window.sampleIds)
      || (requiresPhaseSample && window.sampleIds.length < 1)
      || new Set(window.sampleIds).size !== window.sampleIds.length
      || window.sampleIds.some((sampleId) => !sampleIds.has(sampleId))
      || coverage.phaseSamples
        .filter((sample) => window.sampleIds.includes(sample.sampleId))
        .some((sample) =>
          sample.frame < window.startFrame
          || sample.frame >= window.endFrameExclusive)
      || (
        contiguous
        && order === 0
        && window.startFrame !== 0
      )
      || (
        contiguous
        && order > 0
        && window.startFrame
          !== windows[order - 1]!.endFrameExclusive
      )
    ) return false
  }
  return !contiguous
    || windows.at(-1)?.endFrameExclusive === coverage.frameCount
}

function assertProviderResult(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  if (
    !isRecord(draft)
    || !hasExactKeys(draft, [
      'schemaVersion',
      'requestId',
      'requestDigestSha256',
      'existingQwenPlanHashSha256',
      'scope',
      'artifactBinding',
      'providerExecutionClaim',
      'coverageResult',
      'checks',
      'visualRiskIds',
      'repairTargetIds',
      'unsupportedClaimCount',
      'audioOrTranscriptAuthorityClaimed',
      'rawFramePersisted',
      'containsRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment',
    ])
    || draft.schemaVersion !==
      LIVING_FRAME_POSTRENDER_VISUAL_INSPECTION_RESULT_VERSION
    || draft.requestId !== request.requestId
    || draft.requestDigestSha256 !== request.requestDigestSha256
    || draft.existingQwenPlanHashSha256
      !== request.qwenAuthority.existingPlanHashSha256
  ) throw new Error('Invalid Living Frame postrender visual inspection provider result.')
  assertResultScope(request, draft)
  assertResultProvider(request, draft)
  assertResultCoverage(request, draft)
  assertResultChecks(request, draft)
  if (
    !validSafeIds(draft.visualRiskIds)
    || !validSafeIds(draft.repairTargetIds)
    || draft.unsupportedClaimCount !== 0
    || draft.audioOrTranscriptAuthorityClaimed !== false
    || draft.rawFramePersisted !== false
    || draft.containsRawPathsUrlsPromptsBytesCredentialsCommandsOrEnvironment
      !== false
    || (
      draft.checks.some((check) =>
        check.disposition === 'repair_required')
      && draft.repairTargetIds.length < 1
    )
    || (
      draft.checks.some((check) =>
        check.disposition === 'required_review')
      && draft.visualRiskIds.length < 1
    )
  ) throw new Error('Invalid Living Frame visual result safety or repair evidence.')
}

function assertResultScope(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  if (
    !isRecord(draft.scope)
    || !hasExactKeys(draft.scope, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'sceneId',
      'approvedSnapshotId',
      'approvedWorkItemId',
    ])
    || draft.scope.workspaceId !== request.scope.workspaceId
    || draft.scope.projectId !== request.scope.projectId
    || draft.scope.editSessionId !== request.scope.editSessionId
    || draft.scope.sceneId !== request.scope.sceneId
    || draft.scope.approvedSnapshotId
      !== request.sourceBindings.approvedSnapshotId
    || draft.scope.approvedWorkItemId
      !== request.scope.approvedWorkItemId
    || !isRecord(draft.artifactBinding)
    || !hasExactKeys(draft.artifactBinding, [
      'artifactId',
      'privateObjectIdentityHash',
      'sha256',
    ])
    || draft.artifactBinding.artifactId
      !== request.finalRender.artifactId
    || draft.artifactBinding.privateObjectIdentityHash
      !== request.finalRender.privateObjectIdentityHash
    || draft.artifactBinding.sha256
      !== request.finalRender.sha256
  ) throw new Error('Living Frame visual result scope or artifact substitution.')
}

function assertResultProvider(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  const claim = draft.providerExecutionClaim
  if (
    !isRecord(claim)
    || !hasExactKeys(claim, [
      'modelRoleId',
      'modelId',
      'providerBoundary',
      'checkpointSha256',
      'containerImageDigest',
      'runtimeEvidenceDigestSha256',
      'dispatchReceiptDigestSha256',
      'oneUseLeaseReceiptDigestSha256',
      'attemptReceiptDigestSha256',
      'attemptCostEvidenceDigestSha256',
      'providerCallClaimed',
      'oneProviderAttemptClaimed',
    ])
    || claim.modelRoleId !== request.qwenAuthority.modelRoleId
    || claim.modelId !== request.qwenAuthority.modelId
    || claim.providerBoundary !== request.qwenAuthority.providerBoundary
    || claim.checkpointSha256 !== request.qwenAuthority.checkpointSha256
    || claim.containerImageDigest
      !== request.qwenAuthority.containerImageDigest
    || !IMAGE_DIGEST.test(claim.containerImageDigest)
    || !allSha256([
      claim.runtimeEvidenceDigestSha256,
      claim.dispatchReceiptDigestSha256,
      claim.oneUseLeaseReceiptDigestSha256,
      claim.attemptReceiptDigestSha256,
      claim.attemptCostEvidenceDigestSha256,
    ])
    || claim.providerCallClaimed !== true
    || claim.oneProviderAttemptClaimed !== true
  ) throw new Error('Invalid Living Frame Qwen provider-execution claim.')
}

function assertResultCoverage(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  const result = draft.coverageResult
  const expectedWindowIds = [
    ...request.coverage.completeTimelineWindows,
    ...request.coverage.sceneWindows,
    ...request.coverage.transitionWindows,
    ...request.coverage.boundaryWindows,
  ].map((window) => window.windowId).sort()
  const expectedSampleIds = request.coverage.phaseSamples
    .map((sample) => sample.sampleId).sort()
  if (
    !isRecord(result)
    || !hasExactKeys(result, [
      'requestCoverageDigestSha256',
      'coveredWindowIds',
      'coveredSampleIds',
      'coveredFrameCount',
      'completeTimelineCovered',
      'deterministicCoverageIntegrityPassed',
    ])
    || result.requestCoverageDigestSha256
      !== request.coverage.coverageDigestSha256
    || !sameSortedStrings(result.coveredWindowIds, expectedWindowIds)
    || !sameSortedStrings(result.coveredSampleIds, expectedSampleIds)
    || result.coveredFrameCount !== request.finalRender.frameCount
    || result.completeTimelineCovered !== true
    || result.deterministicCoverageIntegrityPassed !== true
  ) throw new Error('Incomplete Living Frame visual result coverage.')
}

function assertResultChecks(
  request: LivingFramePostrenderVisualInspectionRequest,
  draft:
    LivingFramePostrenderVisualInspectionProviderResultDraft,
): void {
  const sampleIds = new Set(
    request.coverage.phaseSamples.map((sample) => sample.sampleId),
  )
  if (
    draft.checks.length !== request.orderedCheckIds.length
    || draft.checks.some((check, order) =>
      !isRecord(check)
      || !hasExactKeys(check, [
        'order',
        'checkId',
        'disposition',
        'observations',
      ])
      || check.order !== order
      || check.checkId !== request.orderedCheckIds[order]
      || ![
        'pass',
        'repair_required',
        'required_review',
      ].includes(check.disposition)
      || !Array.isArray(check.observations)
      || check.observations.length < 1
      || check.observations.length > 64
      || check.observations.some((observation) =>
        !validGroundedObservation(
          observation,
          sampleIds,
          request.finalRender.frameCount,
        )),
    )
  ) throw new Error('Invalid Living Frame ordered visual-check result.')
}

function validGroundedObservation(
  observation: unknown,
  sampleIds: ReadonlySet<string>,
  frameCount: number,
): boolean {
  if (
    !isRecord(observation)
    || !hasExactKeys(observation, [
      'observationId',
      'summary',
      'confidenceBasisPoints',
      'uncertainty',
      'evidenceSampleIds',
      'startFrame',
      'endFrameExclusive',
    ])
  ) return false
  const {
    observationId,
    summary,
    confidenceBasisPoints,
    uncertainty,
    evidenceSampleIds,
    startFrame,
    endFrameExclusive,
  } = observation
  return typeof observationId === 'string'
    && SAFE_ID.test(observationId)
    && typeof summary === 'string'
    && summary.length >= 8
    && summary.length <= 640
    && !UNSAFE_TEXT.test(summary)
    && typeof confidenceBasisPoints === 'number'
    && Number.isSafeInteger(confidenceBasisPoints)
    && confidenceBasisPoints >= 0
    && confidenceBasisPoints <= 10_000
    && typeof uncertainty === 'string'
    && ['none', 'low', 'material'].includes(uncertainty)
    && Array.isArray(evidenceSampleIds)
    && evidenceSampleIds.length >= 1
    && new Set(evidenceSampleIds).size === evidenceSampleIds.length
    && evidenceSampleIds.every(
      (sampleId) =>
        typeof sampleId === 'string'
        && sampleIds.has(sampleId),
    )
    && typeof startFrame === 'number'
    && Number.isSafeInteger(startFrame)
    && startFrame >= 0
    && typeof endFrameExclusive === 'number'
    && Number.isSafeInteger(endFrameExclusive)
    && endFrameExclusive > startFrame
    && endFrameExclusive <= frameCount
}

function validSafeIds(values: readonly string[]): boolean {
  return Array.isArray(values)
    && new Set(values).size === values.length
    && values.every((value) => SAFE_ID.test(value))
}

function sameSortedStrings(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return Array.isArray(actual)
    && new Set(actual).size === actual.length
    && [...actual].sort().join('|') === [...expected].sort().join('|')
}

function allSha256(values: readonly string[]): boolean {
  return values.every((value) => SHA256.test(value))
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child)
  }
  return value
}
