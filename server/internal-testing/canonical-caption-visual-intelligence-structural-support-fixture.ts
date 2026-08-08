import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionVisualIntelligenceSupportPayload } from
  '../../src/types/caption-visual-intelligence-support'
import type { SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import {
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type { ServiceContext } from '../types'
import {
  createCanonicalCaptionVisualIntelligenceEvidenceRepository,
  createCanonicalCaptionVisualIntelligenceSupportService,
  parseCaptionVisualIntelligenceSupportPayload,
} from '../services/canonical-caption-visual-intelligence-support-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  createCanonicalSpecialistSupportResumeRepository,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
} from '../services/canonical-specialist-support-resume-service'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createVisualIntelligenceAuthenticatedReadService,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceReport,
  createVisualIntelligenceRequest,
  createVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  CanonicalCaptionSupportResumeRequirement,
} from './canonical-caption-broll-approved-execution-harness'

export const CANONICAL_CAPTION_VISUAL_INTELLIGENCE_STRUCTURAL_SUPPORT_FIXTURE_VERSION =
  'canonical-caption-visual-intelligence-structural-support-fixture-v1' as const

/**
 * Exercises only the authenticated support projection/resume mechanics.
 * The synthesized Visual Intelligence records deliberately must not be counted
 * as live provider evidence, complete-time visual review, or job qualification.
 */
export async function injectCanonicalCaptionVisualIntelligenceStructuralSupport(
  input: {
    readonly context: ServiceContext
    readonly requirement: CanonicalCaptionSupportResumeRequirement
    readonly now?: () => Date
  },
) {
  if (input.requirement.supportRequestRefs.length !== 1 ||
    input.requirement.supportRequestRefs[0]?.targetSkillKey !==
      'visual_intelligence') {
    throw new Error(
      'Structural Caption support fixture accepts exactly one Visual Intelligence request.',
    )
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: input.context.env.localStorageRoot,
  })
  if (input.context.auth?.userId !== input.requirement.ownerUserId) {
    throw new Error(
      'Structural Caption support fixture rejected crossed actor authority.',
    )
  }
  const exactRepository = createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: [
      'private-internal/captions-specialist/v1',
      input.requirement.ownerUserId,
      input.requirement.workspaceId,
    ].join('/'),
  })
  const pair = await exactRepository.rereadCallResultPair({
    callRef: input.requirement.originalCallRef,
  })
  if (!pair ||
    pair.call.canonicalScope.ownerUserId !== input.requirement.ownerUserId ||
    pair.call.canonicalScope.workspaceId !== input.requirement.workspaceId) {
    throw new Error(
      'Structural Caption support fixture could not reread the exact canonical call.',
    )
  }
  const selectedRequirement = input.requirement.supportRequestRefs[0]
  const selectedRef: SkillContractRef = {
    id: selectedRequirement.id,
    version: selectedRequirement.version,
    contentHash: selectedRequirement.contentHash,
  }
  const request = pair.result.supportRequests.find((candidate) =>
    sameSkillRef(skillRequestRef(candidate), selectedRef))
  if (!request) {
    throw new Error(
      'Structural Caption support fixture could not reread the selected request.',
    )
  }
  if (request.typedPayloadType ===
    'caption-visual-intelligence-support-payload-ref-v1') {
    return injectEarlyVisualReportRef({
      input,
      pair,
      request,
      selectedRef,
      repository: exactRepository,
    })
  }
  const payload = parseCaptionVisualIntelligenceSupportPayload(
    request.typedPayload,
  )
  const evidence = createStructuralEvidence(payload)
  const evidenceRepository =
    createCanonicalCaptionVisualIntelligenceEvidenceRepository({ objectPort })
  const service = createCanonicalCaptionVisualIntelligenceSupportService({
    supportResumeRepository: exactRepository,
    visualIntelligenceRequestStore: {
      async rereadCanonicalRequestByRef({ requestRef: ref }) {
        return sameVisualRef(ref, evidence.requestRef)
          ? evidence.request : null
      },
    },
    visualIntelligenceAuthenticatedReadService:
      createVisualIntelligenceAuthenticatedReadService({
        reportRepository: {
          async readAcceptedByRef(ref) {
            return sameVisualRef(ref, evidence.reportRef)
              ? evidence.report : null
          },
        },
      }),
    visualIntelligenceSpatialEvidenceRepository: {
      async readAcceptedSpatialEvidenceByReportRef(ref) {
        return sameVisualRef(ref, evidence.reportRef)
          ? evidence.spatialEvidence : null
      },
    },
    evidenceRepository,
    now: input.now,
  })
  const evidenceRecord = await service.projectAuthenticatedEvidence({
    authenticatedOwnerUserId: pair.call.canonicalScope.ownerUserId,
    priorCallRef: input.requirement.originalCallRef,
    selectedSupportRequestRef: selectedRef,
    visualIntelligenceRequestRef: evidence.requestRef,
    visualIntelligenceReportRef: evidence.reportRef,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_VISUAL_INTELLIGENCE_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
    evidenceRecordRef: Object.freeze({
      id: evidenceRecord.recordId,
      version: evidenceRecord.schemaVersion,
      contentHash: evidenceRecord.recordDigestSha256,
    }),
    resumeRecordRef: null,
    resumeOwnedByCanonicalCaptionExecution: true as const,
    structuralFixtureOnly: true as const,
    liveProviderCallPerformed: false as const,
    actualVisualInferenceClaimedByThisFixture: false as const,
    privateQualificationEvidence: false as const,
    completeTimeVisualReviewEvidence: false as const,
    finalQaEvidence: false as const,
    publicOrProductionAuthorityGranted: false as const,
  })
}

async function injectEarlyVisualReportRef(input: {
  input: {
    readonly context: ServiceContext
    readonly requirement: CanonicalCaptionSupportResumeRequirement
    readonly now?: () => Date
  }
  pair: Awaited<ReturnType<
    ReturnType<typeof createCanonicalSpecialistSupportResumeRepository>[
      'rereadCallResultPair'
    ]
  >> & object
  request: {
    requestId: string
    schemaVersion: string
    requestDigestSha256: string
    typedPayload: unknown
  }
  selectedRef: SkillContractRef
  repository: ReturnType<typeof createCanonicalSpecialistSupportResumeRepository>
}) {
  const expectedPayload = {
    exactArtifactTypes: ['visual_intelligence_report'],
    typedPayloadRefRequired: true,
    typedPayloadEmbedded: false,
    requestIsByteFree: true,
    rawMediaOrChatIncluded: false,
  }
  if (JSON.stringify(input.request.typedPayload) !==
    JSON.stringify(expectedPayload)) {
    throw new Error(
      'Structural early Visual Intelligence request envelope is invalid.',
    )
  }
  const seed = raw(
    `${input.selectedRef.contentHash}\u0000early-visual-report-structural`,
  )
  const ownerResultRef: SkillContractRef = {
    id: `visual-intelligence-structural-report-${seed.slice(0, 24)}`,
    version: 'visual-intelligence-report-v1',
    contentHash: raw(`owner-result-${seed}`),
  }
  const projection =
    createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
      schemaVersion:
        'canonical-authenticated-specialist-support-artifact-projection-v1',
      projectionId: `caption-vi-early-projection-${seed.slice(0, 24)}`,
      originalCallRef: input.input.requirement.originalCallRef,
      supportRequestRef: input.selectedRef,
      ownerResultRef,
      ownerKey: 'visual_intelligence',
      canonicalScope: structuredClone(input.pair.call.canonicalScope),
      artifactRefs: [{
        ...ownerResultRef,
        artifactType: 'visual_intelligence_report',
        producerSkillKey: 'visual_intelligence',
        privateArtifact: true,
        byteFreeRef: true,
        sourceSupportRequestRef: structuredClone(input.selectedRef),
      }],
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
    })
  await input.repository.persistAuthenticatedOwnerProjectionCreateOnly({
    projection,
  })
  const resumeRecord =
    await resumeCanonicalSpecialistWithAuthenticatedSupport({
      priorCallRef: input.input.requirement.originalCallRef,
      selectedSupportRequestRef: input.selectedRef,
      repository: input.repository,
      specialistExecutionPort: {
        async execute({ call, resumeSupportRequest }) {
          return runCaptionsSpecialistJob({ call, resumeSupportRequest })
        },
      },
      now: input.input.now,
    })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_VISUAL_INTELLIGENCE_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
    evidenceRecordRef: ownerResultRef,
    resumeRecordRef: Object.freeze({
      id: resumeRecord.recordId,
      version: resumeRecord.schemaVersion,
      contentHash: resumeRecord.recordDigestSha256,
    }),
    structuralFixtureOnly: true as const,
    liveProviderCallPerformed: false as const,
    actualVisualInferenceClaimedByThisFixture: false as const,
    privateQualificationEvidence: false as const,
    completeTimeVisualReviewEvidence: false as const,
    finalQaEvidence: false as const,
    publicOrProductionAuthorityGranted: false as const,
  })
}

function createStructuralEvidence(
  payload: CaptionVisualIntelligenceSupportPayload,
) {
  const seed = raw(
    `${payload.payloadDigestSha256}\u0000structural-visual-support`,
  )
  const frameRate = {
    numerator: payload.confirmedOutputFrame.fpsNumerator,
    denominator: payload.confirmedOutputFrame.fpsDenominator,
  }
  const visualRange = {
    ...payload.requestedRange,
    frameRate,
  }
  const probeRef = visualRef(`probe-${seed}`)
  const visualRequest = createVisualIntelligenceRequest({
    requestId: `caption-vi-structural-request-${seed.slice(0, 24)}`,
    idempotencyKey: `caption-vi-structural-${seed.slice(0, 24)}`,
    scope: {
      ownerUserId: payload.canonicalScope.ownerUserId,
      workspaceId: payload.canonicalScope.workspaceId,
      projectId: payload.canonicalScope.projectId,
      editSessionId: payload.canonicalScope.editSessionId,
      approvedSnapshotId: payload.canonicalScope.approvedSnapshotRef!.id,
    },
    operation: payload.expectedVisualIntelligenceOperation,
    profile: payload.expectedVisualIntelligenceProfile,
    sourceArtifacts: [{
      artifactId: payload.sourcePrivateArtifactRef.id,
      mediaKind: 'video',
      contentType: 'video/mp4',
      checksumSha256: payload.sourcePrivateArtifactRef.contentHash,
      byteLength: 1,
      width: payload.confirmedOutputFrame.width,
      height: payload.confirmedOutputFrame.height,
      durationFrames: payload.requestedRange.endFrameExclusive,
      frameRate,
      finalizedMediaAuthorityRef: visualRef(`finalized-${seed}`),
      immutableStorageObjectAuthorityRef: visualRef(`storage-${seed}`),
      mediaProbeEvidenceRef: probeRef,
      privateArtifact: true,
      exactGenerationRereadRequiredAtDispatch: true,
    }],
    comparisonArtifacts: [],
    requestedRanges: [visualRange],
    requiredEvidenceRefs: [probeRef],
    expectedOutcomeRefs: payload.expectedOutcomeRefs.map(domainToVisualRef),
    outputFrame: {
      outputId: payload.confirmedOutputFrame.outputId,
      aspectRatioLabel:
        `${payload.confirmedOutputFrame.aspectRatioNumerator}:` +
        `${payload.confirmedOutputFrame.aspectRatioDenominator}`,
      aspectRatioNumerator:
        payload.confirmedOutputFrame.aspectRatioNumerator,
      aspectRatioDenominator:
        payload.confirmedOutputFrame.aspectRatioDenominator,
      width: payload.confirmedOutputFrame.width,
      height: payload.confirmedOutputFrame.height,
      frameRate,
      confirmedOutputFrameRef: visualRef(
        `frame-${seed}`,
        payload.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
      ),
      confirmedByUser: true,
    },
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission: {
      mode: 'approved_edit_inspection',
      authenticatedPrincipalRef: visualRef(`principal-${seed}`),
      workspaceAuthorizationRef: visualRef(`workspace-${seed}`),
      approvedPlanSnapshotRef: domainToVisualRef(
        payload.canonicalScope.approvedSnapshotRef!,
      ),
      approvedEstimateRef: visualRef(`estimate-${seed}`),
      creditReservationRef: visualRef(`reservation-${seed}`),
      privatePreviewArtifactRef: domainToVisualRef(
        payload.sourcePrivateArtifactRef,
      ),
      expectedOutcomeRefs:
        payload.expectedOutcomeRefs.map(domainToVisualRef),
      workNodeRefs: [visualRef(`work-${seed}`)],
      timelineRefs: [visualRef(`timing-${seed}`)],
      qaPolicyRef: visualRef(`qa-policy-${seed}`),
      costPreflight: {
        pricingSnapshotRef: visualRef(`pricing-${seed}`),
        accountEffectiveRateAuthorityRef: visualRef(`rate-${seed}`),
        currency: 'USD',
        maximumAuthorizedCostMicros: 1,
        estimatedMinimumCostMicros: 1,
        estimatedMaximumCostMicros: 1,
        serviceFeeIncluded: false,
        publicListPriceUsedAsSettlementAuthority: false,
        preflightPassed: true,
      },
      retentionPolicyRef: visualRef(`retention-${seed}`),
      privacyPolicyRef: visualRef(`privacy-${seed}`),
      providerReleaseRef: visualRef(`release-${seed}`),
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
  const requestRefValue = visualRequestRef(visualRequest)
  const semanticRef = visualRef(`semantic-${seed}`)
  const coverage = {
    requestedRanges: [visualRange],
    analyzedRanges: [visualRange],
    incompleteRanges: [],
    sceneBoundaryRefs: [visualRef(`scene-${seed}`)],
    samplingPolicies: [{
      policyId: `caption-structural-${seed.slice(0, 24)}`,
      policyVersion: 'caption-structural-support-v1',
      mode: 'scene_aware_complete_coverage' as const,
      targetFramesPerSecondNumerator: 1,
      targetFramesPerSecondDenominator: 1,
      sceneAware: true,
      highDetail: true,
      requestedRange: visualRange,
      analyzedRange: visualRange,
      samplingPolicyRef: visualRef(`sampling-${seed}`),
    }],
    targetedFollowupRanges: [],
    completeRequestedRangeCoverage: true,
    everyTimelineFrameInspected: false as const,
    completeTimePixelInspectionClaimAllowed: false as const,
  }
  const report = createVisualIntelligenceReport({
    reportId: `caption-vi-structural-report-${seed.slice(0, 24)}`,
    requestRef: requestRefValue,
    scope: visualRequest.scope,
    operation: visualRequest.operation,
    profile: visualRequest.profile,
    sourceArtifacts: [{
      artifactId: payload.sourcePrivateArtifactRef.id,
      checksumSha256: payload.sourcePrivateArtifactRef.contentHash,
      mediaKind: 'video',
      durationFrames: payload.requestedRange.endFrameExclusive,
    }],
    comparisonArtifacts: [],
    coverage,
    semanticSummary:
      'Structural fixture only; no live visual judgment or qualification.',
    segments: [],
    findings: [],
    evidence: [{
      evidenceId: `caption-probe-evidence-${seed.slice(0, 24)}`,
      evidenceRef: probeRef,
      artifactId: payload.sourcePrivateArtifactRef.id,
      range: visualRange,
      authority: 'media_probe',
      producingTool: 'ffprobe',
      toolVersion: 'structural-fixture-only-v1',
      summary: 'Schema-compatible private media-probe fixture only.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    }, {
      evidenceId: `caption-structural-evidence-${seed.slice(0, 24)}`,
      evidenceRef: semanticRef,
      artifactId: payload.sourcePrivateArtifactRef.id,
      range: visualRange,
      authority: 'semantic_visual_judgment',
      producingTool: 'gemini_pro_high',
      toolVersion: 'structural-fixture-only-v1',
      summary: 'Schema-compatible structural support fixture only.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    }],
    deterministicToolExecutions: [{
      tool: 'ffprobe',
      requirement: 'required',
      executionClass: 'l4_gpu_standard',
      releaseRef: visualRef(`probe-release-${seed}`),
      executionRef: visualRef(`probe-execution-${seed}`),
      substantiveCpuExecutionUsed: false,
      sourceArtifactChecksumBound: true,
    }],
    expectedOutcomeRefs: payload.expectedOutcomeRefs.map(domainToVisualRef),
    disposition: 'pass',
    reinspectionRequired: false,
    usage: {
      promptTokenCount: 1,
      candidateTokenCount: 1,
      thinkingTokenCount: 1,
      cachedTokenCount: 0,
      totalTokenCount: 3,
      providerResponseId: `structural-${seed.slice(0, 24)}`,
      providerModelVersion: 'structural-fixture-only-v1',
      estimatedCostMicros: 1,
      settledCostMicros: 1,
      costEvidenceRef: visualRef(`cost-${seed}`),
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
      deterministicEvidenceVersion:
        'visual-intelligence-deterministic-evidence-v1',
      transcriptVersion: null,
      ocrVersion: null,
      cacheIdentitySha256: `sha256:${raw(`cache-${seed}`)}`,
      requestDigestSha256: visualRequest.requestDigestSha256,
      admissionRef: visualRef(`admission-${seed}`),
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
  const reportRefValue = reportRef(report)
  const spatialEvidence = createVisualIntelligenceSpatialEvidence({
    spatialEvidenceId:
      `caption-vi-structural-spatial-${seed.slice(0, 24)}`,
    requestRef: requestRefValue,
    reportRef: reportRefValue,
    scope: visualRequest.scope,
    operation: visualRequest.operation,
    profile: visualRequest.profile,
    outputFrame: visualRequest.outputFrame,
    sourceArtifacts: [{
      artifactId: payload.sourcePrivateArtifactRef.id,
      checksumSha256: payload.sourcePrivateArtifactRef.contentHash,
      width: payload.confirmedOutputFrame.width,
      height: payload.confirmedOutputFrame.height,
      durationFrames: payload.requestedRange.endFrameExclusive,
      frameRate,
    }],
    comparisonArtifacts: [],
    observations: payload.requiredObservationRoles.map((role, index) => ({
      observationId:
        `caption-structural-${role}-${seed.slice(0, 16)}-${index}`,
      artifactId: payload.sourcePrivateArtifactRef.id,
      sceneId: payload.requestedSceneId,
      range: visualRange,
      role,
      regionBasisPoints: structuralRegion(index),
      confidenceBasisPoints: 8_000,
      temporalStabilityBasisPoints: 8_000,
      measuredContrastRatioMilli: null,
      clutterBasisPoints: 2_000,
      cropResilienceBasisPoints: 8_000,
      compositionBalanceBasisPoints: 8_000,
      findingIds: [],
      evidenceRefs: [semanticRef],
      uncertaintyCode: null,
      semanticGeometryOnly: true,
      deterministicPixelGeometryClaimed: false,
    })),
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
  return {
    request: visualRequest,
    requestRef: requestRefValue,
    report,
    reportRef: reportRefValue,
    spatialEvidence,
  }
}

function structuralRegion(index: number) {
  const column = index % 4
  const row = Math.floor(index / 4) % 4
  return {
    x: 500 + column * 2_000,
    y: 500 + row * 2_000,
    width: 1_500,
    height: 1_500,
  }
}

function visualRequestRef(value: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}): VisualIntelligenceEvidenceRef {
  return {
    id: value.requestId,
    version: 1,
    contentHash: value.requestDigestSha256,
  }
}

function reportRef(value: {
  reportId: string
  reportDigestSha256: string
}): VisualIntelligenceEvidenceRef {
  return {
    id: value.reportId,
    version: 1,
    contentHash: value.reportDigestSha256,
  }
}

function domainToVisualRef(
  value: CaptionDomainRef,
): VisualIntelligenceEvidenceRef {
  return visualRef(value.id, value.contentHash)
}

function visualRef(
  id: string,
  hash = raw(id),
): VisualIntelligenceEvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function sameVisualRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id && left.version === right.version &&
    left.contentHash === right.contentHash
}

function skillRequestRef(request: {
  requestId: string
  schemaVersion: string
  requestDigestSha256: string
}): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function sameSkillRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id && left.version === right.version &&
    left.contentHash === right.contentHash
}

function raw(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
