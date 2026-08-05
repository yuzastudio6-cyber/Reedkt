import assert from 'node:assert/strict'

import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualInspectionRequirement,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceReport,
  createVisualIntelligenceRequest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceInspectionCoordinator,
} from '../visual-intelligence/visual-intelligence-inspection-coordinator'
import type {
  VisualIntelligenceLifecycleService,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'

const rawSha = (digit: string) => digit.repeat(64)
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const frameRate = { numerator: 30, denominator: 1 } as const
const fullRange = {
  startFrame: 0,
  endFrameExclusive: 300,
  frameRate,
} as const
const expectedOutcome = ref('caption-layout-approved-outcome')
const previewRef = ref('private-preview-1')
const requirementAt = (cycle: 0 | 1 | 2) =>
  createVisualInspectionRequirement({
    inspectionId: `caption-layout-inspection-${cycle}`,
    owningWorkNodeId: 'caption-render-work-1',
    owningSkillId: 'caption_render_qa',
    profile: 'caption_layout_qa',
    expectedOutcomeRefs: [expectedOutcome],
    requestedRanges: [fullRange],
    required: true,
    blocksNextWorkNode: true,
    blocksPreview: false,
    blocksFinalExport: true,
    currentRepairCycle: cycle,
  })

let disposition: VisualIntelligenceReport['disposition'] = 'pass'
let useCpuEvidence = false
let preparedRequest: VisualIntelligenceRequest | null = null

const requestOwner = {
  async prepareApprovedEditInspectionRequest({ requirement }: {
    requirement: ReturnType<typeof requirementAt>
  }) {
    const request = createVisualIntelligenceRequest({
      requestId: `vi-inspection-${requirement.inspectionId}`,
      idempotencyKey: `vi-inspection-idem-${requirement.inspectionId}`,
      scope: {
        ownerUserId: 'user-1',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        editSessionId: 'edit-1',
        approvedSnapshotId: 'snapshot-1',
      },
      operation: 'inspect_edit',
      profile: requirement.profile,
      sourceArtifacts: [{
        artifactId: previewRef.id,
        mediaKind: 'video',
        contentType: 'video/mp4',
        checksumSha256: rawSha('a'),
        byteLength: 4_000_000,
        width: 1080,
        height: 1920,
        durationFrames: 300,
        frameRate,
        finalizedMediaAuthorityRef: ref('preview-finalized'),
        immutableStorageObjectAuthorityRef: ref('preview-storage'),
        mediaProbeEvidenceRef: ref('preview-probe'),
        privateArtifact: true,
        exactGenerationRereadRequiredAtDispatch: true,
      }],
      comparisonArtifacts: [],
      requestedRanges: requirement.requestedRanges,
      requiredEvidenceRefs: [ref('preview-probe')],
      expectedOutcomeRefs: requirement.expectedOutcomeRefs,
      outputFrame: {
        outputId: 'vertical-master',
        width: 1080,
        height: 1920,
        aspectRatioLabel: '9:16',
        aspectRatioNumerator: 9,
        aspectRatioDenominator: 16,
        frameRate,
        confirmedOutputFrameRef: ref('confirmed-output-frame'),
        confirmedByUser: true,
      },
      protectedZones: [],
      qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
      admission: {
        mode: 'approved_edit_inspection',
        authenticatedPrincipalRef: ref('principal'),
        workspaceAuthorizationRef: ref('workspace-auth'),
        approvedPlanSnapshotRef: ref('snapshot-1'),
        approvedEstimateRef: ref('estimate-1'),
        creditReservationRef: ref('credit-reservation-1'),
        privatePreviewArtifactRef: previewRef,
        expectedOutcomeRefs: requirement.expectedOutcomeRefs,
        workNodeRefs: [ref(requirement.owningWorkNodeId)],
        timelineRefs: [ref('master-timing-1')],
        qaPolicyRef: ref('caption-layout-qa-policy'),
        costPreflight: {
          pricingSnapshotRef: ref('pricing'),
          accountEffectiveRateAuthorityRef: ref('account-rate'),
          currency: 'USD',
          maximumAuthorizedCostMicros: 100_000,
          estimatedMinimumCostMicros: 1_000,
          estimatedMaximumCostMicros: 30_000,
          serviceFeeIncluded: false,
          publicListPriceUsedAsSettlementAuthority: false,
          preflightPassed: true,
        },
        retentionPolicyRef: ref('retention'),
        privacyPolicyRef: ref('privacy'),
        providerReleaseRef: ref('provider-release'),
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
    preparedRequest = request
    return request
  },
}

const lifecycle: VisualIntelligenceLifecycleService = {
  async execute(untrusted) {
    const request = untrusted as VisualIntelligenceRequest
    const report = buildReport(request, disposition, useCpuEvidence)
    const reportRef = {
      id: report.reportId,
      version: 1,
      contentHash: report.reportDigestSha256,
    }
    return {
      lifecycleVersion: 'visual-intelligence-lifecycle-service-v2',
      status: 'completed',
      report,
      reportRef,
      spatialEvidence: null,
      spatialEvidenceRef: null,
      providerCallMadeDuringInvocation: true,
      costSettledDuringInvocation: true,
      duplicateProviderCallAvoided: false,
      duplicateCostSettlementAvoided: false,
      directTimelineMutationPerformed: false,
    }
  },
}

const coordinator = createVisualIntelligenceInspectionCoordinator({
  requestOwner,
  lifecycle,
})

disposition = 'pass'
const passed = await coordinator.inspect(requirementAt(0))
assert.equal(passed.result.disposition, 'pass')
assert.equal(passed.result.routeToOwningSkill, false)
assert.equal(passed.result.blocksFinalExport, false)
assert.equal(passed.result.visualIntelligenceMutatedEdit, false)
assert.equal(passed.qwenVisualFallbackUsed, false)

disposition = 'needs_revision'
const repair = await coordinator.inspect(requirementAt(0))
assert.equal(repair.result.routeToOwningSkill, true)
assert.equal(repair.result.automaticRepairAllowed, true)
assert.equal(repair.result.automaticSpendStopped, false)
assert.equal(repair.result.blocksFinalExport, true)

const exhausted = await coordinator.inspect(requirementAt(2))
assert.equal(exhausted.result.automaticRepairAllowed, false)
assert.equal(exhausted.result.automaticSpendStopped, true)
assert.equal(exhausted.result.planningOrHumanReviewRequired, true)

disposition = 'blocked'
const blocked = await coordinator.inspect(requirementAt(1))
assert.equal(blocked.result.routeToOwningSkill, false)
assert.equal(blocked.result.automaticSpendStopped, true)
assert.equal(blocked.result.planningOrHumanReviewRequired, true)

useCpuEvidence = true
await assert.rejects(
  () => coordinator.inspect(requirementAt(0)),
  /approved-edit Visual Intelligence inspection is not ready/u,
)
useCpuEvidence = false

const badOwner = createVisualIntelligenceInspectionCoordinator({
  requestOwner: {
    async prepareApprovedEditInspectionRequest({ requirement }) {
      const request = await requestOwner.prepareApprovedEditInspectionRequest({
        requirement,
      })
      return {
        ...request,
        profile: 'graphics_layout_qa' as const,
      }
    },
  },
  lifecycle,
})
await assert.rejects(
  () => badOwner.inspect(requirementAt(0)),
  /approved-edit Visual Intelligence inspection is not ready/u,
)

assert.ok(preparedRequest)
console.log(JSON.stringify({
  status: 'visual_intelligence_inspection_coordinator_smoke_passed',
  exactModel: passed.report.provenance.exactModelId,
  passDidNotBlock: true,
  firstRepairRoutedToOwningSkill: true,
  thirdAutomaticRepairPrevented: true,
  blockedOutcomeStoppedSpend: true,
  cpuEvidenceRejected: true,
  qwenVisualFallbackUsed: false,
}))

function buildReport(
  request: VisualIntelligenceRequest,
  reportDisposition: VisualIntelligenceReport['disposition'],
  cpuEvidence: boolean,
): VisualIntelligenceReport {
  const probeRef = request.sourceArtifacts[0]!.mediaProbeEvidenceRef
  const evidence: VisualIntelligenceEvidence[] = [{
    evidenceId: probeRef.id,
    evidenceRef: probeRef,
    artifactId: request.sourceArtifacts[0]!.artifactId,
    range: null,
    authority: 'media_probe',
    producingTool: 'ffprobe',
    toolVersion: 'ffprobe-8.0',
    summary: 'The exact private preview geometry and timing are verified.',
    privateEvidence: true,
    providerInstructionAccepted: false,
  }]
  const findings = reportDisposition === 'needs_revision'
    ? [{
        findingId: `caption-collision-${request.requestId}`,
        artifactId: request.sourceArtifacts[0]!.artifactId,
        range: fullRange,
        category: 'caption_collision',
        severity: 'revision_required' as const,
        summary: 'The caption overlaps the approved protected subject region.',
        evidenceRefs: [probeRef],
        expectedOutcomeRefs: request.expectedOutcomeRefs,
        confidenceBasisPoints: 9_200,
        uncertainty: null,
        recommendedOwner: 'caption' as const,
        reinspectionRequired: true,
        directTimelineMutationAllowed: false as const,
        providerInstructionAccepted: false as const,
      }]
    : reportDisposition === 'blocked'
      ? [{
          findingId: `caption-evidence-blocked-${request.requestId}`,
          artifactId: request.sourceArtifacts[0]!.artifactId,
          range: fullRange,
          category: 'caption_evidence_missing',
          severity: 'blocking' as const,
          summary: 'Required caption evidence could not be reconciled.',
          evidenceRefs: [probeRef],
          expectedOutcomeRefs: request.expectedOutcomeRefs,
          confidenceBasisPoints: 10_000,
          uncertainty: null,
          recommendedOwner: 'human_review' as const,
          reinspectionRequired: false,
          directTimelineMutationAllowed: false as const,
          providerInstructionAccepted: false as const,
        }]
      : []
  return createVisualIntelligenceReport({
    reportId: `visual-inspection-report-${request.requestId}`,
    requestRef: {
      id: request.requestId,
      version: 1,
      contentHash: request.requestDigestSha256,
    },
    scope: request.scope,
    operation: request.operation,
    profile: request.profile,
    sourceArtifacts: request.sourceArtifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      checksumSha256: artifact.checksumSha256,
      mediaKind: artifact.mediaKind,
      durationFrames: artifact.durationFrames,
    })),
    comparisonArtifacts: [],
    coverage: {
      requestedRanges: request.requestedRanges,
      analyzedRanges: request.requestedRanges,
      incompleteRanges: [],
      sceneBoundaryRefs: [],
      samplingPolicies: [{
        policyId: 'approved-render-caption-coverage',
        policyVersion: 'approved-render-caption-coverage-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: fullRange,
        analyzedRange: fullRange,
        samplingPolicyRef: ref('caption-sampling-policy'),
      }],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    semanticSummary: reportDisposition === 'pass'
      ? 'Caption layout is professionally readable across the approved range.'
      : 'Caption layout requires owner action or evidence reconciliation.',
    segments: [{
      segmentId: `caption-segment-${request.requestId}`,
      artifactId: request.sourceArtifacts[0]!.artifactId,
      range: fullRange,
      sceneId: 'scene-1',
      summary: 'The approved caption treatment is visible in context.',
      subjectIds: ['speaker-1'],
      objectIds: [],
      actionLabels: ['caption_display'],
      visibleTextEvidenceRefs: [],
      transcriptEvidenceRefs: [],
      evidenceRefs: [probeRef],
      confidenceBasisPoints: 9_000,
      uncertainty: null,
      sourcePlanning: null,
    }],
    findings,
    evidence,
    deterministicToolExecutions: [
      toolExecution('ffprobe', cpuEvidence),
      toolExecution('ffmpeg', false),
      toolExecution('opencv', false),
    ],
    expectedOutcomeRefs: request.expectedOutcomeRefs,
    disposition: reportDisposition,
    reinspectionRequired: reportDisposition === 'needs_revision',
    usage: {
      promptTokenCount: 4_000,
      candidateTokenCount: 1_000,
      thinkingTokenCount: 1_000,
      cachedTokenCount: 0,
      totalTokenCount: 6_000,
      providerResponseId: `gemini-response-${request.requestId}`,
      providerModelVersion: 'gemini-3.1-pro-preview',
      estimatedCostMicros: 20_000,
      settledCostMicros: 19_000,
      costEvidenceRef: ref(`cost-${request.requestId}`),
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
      cacheIdentitySha256: ref('cache').contentHash,
      requestDigestSha256: request.requestDigestSha256,
      admissionRef: ref('inspection-admission'),
      providerReleaseRef: request.admission.providerReleaseRef,
      applicationDefaultCredentialsUsed: true,
      providerToolsUsed: false,
      searchGroundingUsed: false,
      urlContextUsed: false,
      codeExecutionUsed: false,
      rawProviderPayloadPersisted: false,
    },
    blockers: reportDisposition === 'blocked'
      ? ['caption_evidence_reconciliation_required']
      : [],
    warnings: [],
    immutableReport: true,
    planningMayConsumeValidatedEvidence: false,
    directTimelineMutationAllowed: false,
    renderPerformedByVisualIntelligence: false,
    exportAuthorized: false,
    deliveryAuthorized: false,
  })
}

function toolExecution(
  tool: 'ffprobe' | 'ffmpeg' | 'opencv',
  cpu: boolean,
) {
  return {
    tool,
    requirement: 'required' as const,
    executionClass: 'l4_gpu_standard' as const,
    releaseRef: ref(`${tool}-release`),
    executionRef: ref(`${tool}-execution`),
    substantiveCpuExecutionUsed: cpu as false,
    sourceArtifactChecksumBound: true as const,
  }
}
