import assert from 'node:assert/strict'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceEvidence,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceProvider,
  type VisualIntelligenceReport,
  type VisualIntelligenceRequest,
  type VisualIntelligenceToolExecutionEvidence,
} from '../../src/types/visual-intelligence'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
  parseVisualIntelligenceReport,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceLifecycleService,
  type VisualIntelligenceAttemptStore,
  type VisualIntelligenceConcurrencyPort,
  type VisualIntelligencePreparedEvidence,
  type VisualIntelligenceReportRepository,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from '../visual-intelligence/visual-intelligence-profile-registry'

const rawSha = (digit: string) => digit.repeat(64)
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const frameRate = { numerator: 24, denominator: 1 } as const
const fullRange = { startFrame: 0, endFrameExclusive: 240, frameRate } as const
const providerReleaseRef = ref('visual-intelligence-provider-release')

function buildRequest(input: {
  requestId: string
  idempotencyKey: string
  checksum: string
  comparisonChecksum?: string
  question?: string
}): VisualIntelligenceRequest {
  const createArtifact = (
    artifactId: string,
    authorityPrefix: string,
    checksum: string,
  ) => ({
    artifactId,
    mediaKind: 'video' as const,
    contentType: 'video/mp4',
    checksumSha256: checksum,
    byteLength: 1_000_000,
    width: 1920,
    height: 1080,
    durationFrames: 240,
    frameRate,
    finalizedMediaAuthorityRef:
      ref(`${authorityPrefix}-authority-${checksum[0]}`),
    immutableStorageObjectAuthorityRef:
      ref(`${authorityPrefix}-storage-${checksum[0]}`),
    mediaProbeEvidenceRef: ref(`${authorityPrefix}-probe-${checksum[0]}`),
    privateArtifact: true as const,
    exactGenerationRereadRequiredAtDispatch: true as const,
  })
  const sourceArtifacts = [
    createArtifact('source-video-1', 'source', input.checksum),
  ]
  const comparisonArtifacts = input.comparisonChecksum
    ? [createArtifact(
      'comparison-video-1',
      'comparison',
      input.comparisonChecksum,
    )]
    : []
  const allArtifacts = [...sourceArtifacts, ...comparisonArtifacts]
  return createVisualIntelligenceRequest({
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    scope: {
      ownerUserId: 'user-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      editSessionId: 'edit-1',
      approvedSnapshotId: null,
    },
    operation: input.comparisonChecksum
      ? 'compare_media'
      : input.question
        ? 'query_range'
        : 'analyze_media',
    profile: input.comparisonChecksum
      ? 'source_vs_preview'
      : input.question
        ? 'identify_primary_subject'
        : 'source_edit_planning',
    sourceArtifacts,
    comparisonArtifacts,
    requestedRanges: [fullRange],
    requiredEvidenceRefs:
      allArtifacts.map((artifact) => artifact.mediaProbeEvidenceRef),
    expectedOutcomeRefs: [],
    outputFrame: null,
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission: {
      mode: 'planning_evidence',
      authenticatedPrincipalRef: ref('principal'),
      workspaceAuthorizationRef: ref('workspace-auth'),
      finalizedSourceAuthorityRefs: allArtifacts.map(
        (artifact) => artifact.finalizedMediaAuthorityRef,
      ),
      sourceChecksumSetRef: ref(`checksum-set-${input.checksum[0]}`),
      analysisAllowanceRef: ref('allowance'),
      costPreflight: {
        pricingSnapshotRef: ref('pricing'),
        accountEffectiveRateAuthorityRef: ref('account-effective-rate'),
        currency: 'USD',
        maximumAuthorizedCostMicros: 100_000,
        estimatedMinimumCostMicros: 1_000,
        estimatedMaximumCostMicros: 20_000,
        serviceFeeIncluded: false,
        publicListPriceUsedAsSettlementAuthority: false,
        preflightPassed: true,
      },
      retentionPolicyRef: ref('retention'),
      privacyPolicyRef: ref('privacy'),
      providerReleaseRef,
      globalKillSwitchOpen: false,
      providerKillSwitchOpen: false,
      reportPersistenceAllowed: true,
      timelineMutationAllowed: false,
      editingWorkerExecutionAllowed: false,
      generationAllowed: false,
      renderAllowed: false,
      exportAllowed: false,
      deliveryAllowed: false,
    },
    callerQuestion: input.question ?? null,
    byteFreeRequest: true,
    callerPromptAccepted: false,
    providerCredentialIncluded: false,
    publicMediaUrlIncluded: false,
    signedUrlIsSourceTruth: false,
    shellCommandIncluded: false,
    providerToolDefinitionIncluded: false,
  })
}

function preparedEvidence(request: VisualIntelligenceRequest):
VisualIntelligencePreparedEvidence {
  const allArtifacts = [
    ...request.sourceArtifacts,
    ...request.comparisonArtifacts,
  ]
  const deterministicEvidence: VisualIntelligenceEvidence[] =
    allArtifacts.map((artifact) => ({
      evidenceId: artifact.mediaProbeEvidenceRef.id,
      evidenceRef: artifact.mediaProbeEvidenceRef,
      artifactId: artifact.artifactId,
      range: null,
      authority: 'media_probe',
      producingTool: 'ffprobe',
      toolVersion: 'ffprobe-8.0',
      summary: 'Canonical source dimensions and rational timing are verified.',
      privateEvidence: true,
      providerInstructionAccepted: false,
    }))
  const tools = [
    ['ffprobe', 'l4_gpu_standard'],
    ['ffmpeg', 'l4_gpu_standard'],
    ['pyscenedetect', 'l4_gpu_standard'],
    ['opencv', 'l4_gpu_standard'],
  ] as const
  const toolExecutionEvidence: VisualIntelligenceToolExecutionEvidence[] =
    tools.map(([tool, executionClass]) => ({
    tool,
    requirement: 'required',
    executionClass,
    releaseRef: ref(`${tool}-release`),
    executionRef: ref(`${tool}-execution-${request.sourceArtifacts[0].checksumSha256[0]}`),
    substantiveCpuExecutionUsed: false as const,
    sourceArtifactChecksumBound: true as const,
  }))
  return {
    deterministicEvidence,
    coveragePlan: {
      requestedRanges: [fullRange],
      analyzedRanges: [fullRange],
      incompleteRanges: [],
      sceneBoundaryRefs: [ref('scene-boundaries')],
      samplingPolicies: [{
        policyId: 'complete-scene-aware',
        policyVersion: 'complete-scene-aware-v1',
        mode: 'scene_aware_complete_coverage',
        targetFramesPerSecondNumerator: 2,
        targetFramesPerSecondDenominator: 1,
        sceneAware: true,
        highDetail: true,
        requestedRange: fullRange,
        analyzedRange: fullRange,
        samplingPolicyRef: ref('sampling-policy'),
      }],
      targetedFollowupRanges: [],
      completeRequestedRangeCoverage: true,
      everyTimelineFrameInspected: false,
      completeTimePixelInspectionClaimAllowed: false,
    },
    privateMediaInputs: allArtifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      gcsUri: `gs://reeditpro-private-source/${artifact.artifactId}.mp4`,
      contentType: artifact.contentType,
      checksumSha256: artifact.checksumSha256,
      exactGenerationRereadVerified: true as const,
    })),
    transcriptVersion: 'faster-whisper-large-v3-authority-v1',
    ocrVersion: 'paddleocr-exact-visible-text-v1',
    toolExecutionEvidence,
    preparedEvidenceRef: ref(
      `prepared-${request.sourceArtifacts[0].checksumSha256[0]}`,
      request.sourceArtifacts[0].checksumSha256,
    ),
  }
}

function createProvider(counter: { calls: number }): VisualIntelligenceProvider {
  return {
    adapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    preflight(input) {
      assert.equal(input.promptVersion, VISUAL_INTELLIGENCE_PROMPT_VERSION)
      assert.equal(input.responseSchemaVersion,
        VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION)
      return {
        requestConfigurationDigestSha256:
          visualIntelligenceDigest({ request: input.request.requestDigestSha256 }),
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        professionalHighEnforced: true,
        automaticProviderRetryAllowed: false,
        providerToolsAllowed: false,
        callerPromptAccepted: false,
      }
    },
    async execute(input) {
      counter.calls += 1
      const evidenceByArtifact = new Map(input.deterministicEvidence.map(
        (evidence) => [evidence.artifactId, evidence.evidenceRef],
      ))
      return {
        normalizedResult: {
          schemaVersion: 'visual-intelligence-provider-result-v1',
          requestId: input.request.requestId,
          semanticSummary: 'The complete source instruction and action are understood.',
          segments: [
            ...input.request.sourceArtifacts,
            ...input.request.comparisonArtifacts,
          ].map((artifact, index) => ({
            segmentId: `segment-${input.request.requestId}-${index + 1}`,
            artifactId: artifact.artifactId,
            range: fullRange,
            sceneId: 'scene-1',
            summary: 'The presenter explains and demonstrates one complete action.',
            subjectIds: ['speaker-1'],
            objectIds: ['basketball-1'],
            actionLabels: ['instruction', 'demonstration'],
            visibleTextEvidenceRefs: [],
            transcriptEvidenceRefs: [],
            evidenceRefs: [evidenceByArtifact.get(artifact.artifactId)!],
            confidenceBasisPoints: 9_000,
            uncertainty: null,
            sourcePlanning: input.request.profile === 'source_edit_planning'
              ? {
                sourceFunction: 'dialogue' as const,
                actionIntensity: 'medium' as const,
                editUsability: 'strong' as const,
                cameraStability: 'stable' as const,
                continuity: 'continuous' as const,
              }
              : null,
          })),
          findings: [],
          targetedFollowupRanges: [],
          warnings: [],
          mediaContentTreatedAsUntrusted: true,
          providerInstructionsFollowedFromMedia: false,
          editingOrRenderingClaimed: false,
        },
        usage: {
          promptTokenCount: 5_000,
          candidateTokenCount: 1_000,
          thinkingTokenCount: 1_500,
          cachedTokenCount: 0,
          totalTokenCount: 7_500,
          providerResponseId: `response-${counter.calls}`,
          providerModelVersion: VISUAL_INTELLIGENCE_MODEL_ID,
          estimatedCostMicros: 15_000,
          settledCostMicros: 14_250,
          costEvidenceRef: ref(`cost-${counter.calls}`),
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
          thinkingLevel: 'high',
          mediaResolution: 'high',
          promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
          responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
          applicationDefaultCredentialsUsed: true,
          providerToolsUsed: false,
          searchGroundingUsed: false,
          urlContextUsed: false,
          codeExecutionUsed: false,
          rawProviderPayloadPersisted: false,
        },
        sanitizedDiagnostics: ['fixture_provider'],
      }
    },
  }
}

function createAttemptStore(events: string[]): VisualIntelligenceAttemptStore {
  const byIdempotency = new Map<string, {
    requestDigest: string
    attemptRef: VisualIntelligenceEvidenceRef
    reportRef?: VisualIntelligenceEvidenceRef
    status: 'created' | 'started' | 'completed' | 'failed'
  }>()
  return {
    async beginCreateOnly(input) {
      const existing = byIdempotency.get(input.idempotencyKey)
      if (existing) {
        if (existing.requestDigest !== input.requestDigestSha256) {
          return { status: 'conflict' }
        }
        if (existing.status === 'completed' && existing.reportRef) {
          return { status: 'already_completed', reportRef: existing.reportRef }
        }
        return { status: 'already_in_progress' }
      }
      const attemptRef = ref(`attempt-${input.requestId}`)
      byIdempotency.set(input.idempotencyKey, {
        requestDigest: input.requestDigestSha256,
        attemptRef,
        status: 'created',
      })
      events.push('attempt_created')
      return { status: 'created', attemptRef }
    },
    async markProviderCallStarted(input) {
      const entry = [...byIdempotency.values()].find((item) =>
        item.attemptRef.id === input.attemptRef.id)
      assert.ok(entry)
      entry.status = 'started'
      events.push('provider_started')
      return { exactCreateOnlyRereadVerified: true }
    },
    async markFailed(input) {
      const entry = [...byIdempotency.values()].find((item) =>
        item.attemptRef.id === input.attemptRef.id)
      assert.ok(entry)
      entry.status = 'failed'
      events.push(`failed_${input.outcome}`)
    },
    async markCompleted(input) {
      const entry = [...byIdempotency.values()].find((item) =>
        item.attemptRef.id === input.attemptRef.id)
      assert.ok(entry)
      entry.status = 'completed'
      entry.reportRef = input.reportRef
      events.push('attempt_completed')
      return { exactTerminalRereadVerified: true }
    },
  }
}

function createReportRepository(events: string[]): VisualIntelligenceReportRepository {
  const byCache = new Map<string, VisualIntelligenceReport>()
  const byRef = new Map<string, VisualIntelligenceReport>()
  return {
    async readAcceptedByCacheIdentity(input) {
      return byCache.get(input.cacheIdentitySha256) ?? null
    },
    async readAcceptedByRef(reportRef) {
      return byRef.get(refKey(reportRef)) ?? null
    },
    async persistImmutable(input) {
      assert.equal(byCache.has(input.cacheIdentitySha256), false)
      const report = parseVisualIntelligenceReport(input.report)
      const reportRef = {
        id: report.reportId,
        version: 1,
        contentHash: report.reportDigestSha256,
      }
      byCache.set(input.cacheIdentitySha256, report)
      byRef.set(refKey(reportRef), report)
      events.push('report_persisted')
      return {
        reportRef,
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },
  }
}

function createConcurrencyPort(events: string[]): VisualIntelligenceConcurrencyPort {
  const active = new Set<string>()
  return {
    async acquire(input) {
      const leaseRef = ref(`lease-${input.requestId}`)
      active.add(leaseRef.id)
      events.push('lease_acquired')
      return { status: 'acquired', leaseRef }
    },
    async release(leaseRef) {
      assert.equal(active.delete(leaseRef.id), true)
      events.push('lease_released')
    },
  }
}

async function main() {
  const events: string[] = []
  const counter = { calls: 0 }
  const service = createVisualIntelligenceLifecycleService({
    provider: createProvider(counter),
    admissionPort: {
      async verifyAndRereadExact(request) {
        return {
          status: 'admitted',
          admissionRef: ref(`admission-${request.requestId}`),
          providerReleaseRef,
          exactScopeRereadVerified: true,
          exactArtifactAuthorityRereadVerified: true,
          exactCostPreflightRereadVerified: true,
          killSwitchesVerifiedClosed: true,
          retentionPrivacyVerified: true,
        }
      },
    },
    evidencePreparationPort: {
      async prepare({ request }) {
        events.push('evidence_prepared')
        return preparedEvidence(request)
      },
    },
    attemptStore: createAttemptStore(events),
    reportRepository: createReportRepository(events),
    concurrencyPort: createConcurrencyPort(events),
  })

  const firstRequest = buildRequest({
    requestId: 'request-1',
    idempotencyKey: 'idempotency-1',
    checksum: rawSha('1'),
  })
  const first = await service.execute(firstRequest)
  assert.equal(first.status, 'completed')
  assert.equal(first.providerCallMadeDuringInvocation, true)
  assert.equal(first.report.planningMayConsumeValidatedEvidence, true)
  assert.equal(first.report.provenance.exactModelId,
    VISUAL_INTELLIGENCE_MODEL_ID)
  const semanticEvidence = first.report.evidence.filter(
    (evidence) => evidence.authority === 'semantic_visual_judgment',
  )
  assert.equal(semanticEvidence.length, 1)
  assert.equal(semanticEvidence[0]?.artifactId, 'source-video-1')
  assert.equal(first.report.segments[0]?.evidenceRefs.some(
    (evidenceRef) => evidenceRef.contentHash ===
      semanticEvidence[0]?.evidenceRef.contentHash,
  ), true)
  assert.equal(counter.calls, 1)
  assert.deepEqual(events.slice(-5), [
    'attempt_created',
    'provider_started',
    'report_persisted',
    'attempt_completed',
    'lease_released',
  ])

  const replay = await service.execute(firstRequest)
  assert.equal(replay.status, 'cache_replay')
  assert.equal(replay.providerCallMadeDuringInvocation, false)
  assert.equal(replay.duplicateProviderCallAvoided, true)
  assert.equal(replay.duplicateCostSettlementAvoided, true)
  assert.equal(counter.calls, 1)

  const changedSource = buildRequest({
    requestId: 'request-2',
    idempotencyKey: 'idempotency-2',
    checksum: rawSha('2'),
  })
  const changed = await service.execute(changedSource)
  assert.equal(changed.status, 'completed')
  assert.notEqual(changed.report.provenance.cacheIdentitySha256,
    first.report.provenance.cacheIdentitySha256)
  assert.equal(counter.calls, 2)

  const firstQuestion = await service.execute(buildRequest({
    requestId: 'request-question-1',
    idempotencyKey: 'idempotency-question-1',
    checksum: rawSha('7'),
    question: 'Identify the primary subject in this authorized range.',
  }))
  const secondQuestion = await service.execute(buildRequest({
    requestId: 'request-question-2',
    idempotencyKey: 'idempotency-question-2',
    checksum: rawSha('7'),
    question: 'Explain the primary subject position in this authorized range.',
  }))
  assert.notEqual(
    firstQuestion.report.provenance.cacheIdentitySha256,
    secondQuestion.report.provenance.cacheIdentitySha256,
  )
  assert.equal(firstQuestion.report.planningMayConsumeValidatedEvidence, true)
  assert.equal(secondQuestion.report.planningMayConsumeValidatedEvidence, true)
  assert.equal(counter.calls, 4)

  const comparison = await service.execute(buildRequest({
    requestId: 'request-comparison',
    idempotencyKey: 'idempotency-comparison',
    checksum: rawSha('5'),
    comparisonChecksum: rawSha('6'),
  }))
  const multiSemanticEvidence = comparison.report.evidence.filter(
    (evidence) => evidence.authority === 'semantic_visual_judgment',
  )
  assert.deepEqual(
    multiSemanticEvidence.map((evidence) => evidence.artifactId),
    ['source-video-1', 'comparison-video-1'],
  )
  for (const segment of comparison.report.segments) {
    const artifactEvidence = multiSemanticEvidence.find(
      (evidence) => evidence.artifactId === segment.artifactId,
    )
    assert.ok(artifactEvidence)
    assert.equal(segment.evidenceRefs.some((evidenceRef) =>
      evidenceRef.contentHash === artifactEvidence.evidenceRef.contentHash), true)
  }
  assert.equal(comparison.report.planningMayConsumeValidatedEvidence, true)
  assert.equal(counter.calls, 5)

  const blockedService = createVisualIntelligenceLifecycleService({
    provider: createProvider(counter),
    admissionPort: {
      async verifyAndRereadExact() {
        return { status: 'blocked', blockerCode: 'provider_kill_switch_open' }
      },
    },
    evidencePreparationPort: {
      async prepare({ request }) { return preparedEvidence(request) },
    },
    attemptStore: createAttemptStore([]),
    reportRepository: createReportRepository([]),
    concurrencyPort: createConcurrencyPort([]),
  })
  await assert.rejects(() => blockedService.execute(buildRequest({
    requestId: 'request-blocked',
    idempotencyKey: 'idempotency-blocked',
    checksum: rawSha('3'),
  })), /not ready/iu)
  assert.equal(counter.calls, 5)

  const unknownEvents: string[] = []
  const unknownProvider = createProvider(counter)
  unknownProvider.execute = async () => {
    throw new Error('secret raw provider error must be sanitized')
  }
  const unknownService = createVisualIntelligenceLifecycleService({
    provider: unknownProvider,
    admissionPort: {
      async verifyAndRereadExact(request) {
        return {
          status: 'admitted',
          admissionRef: ref(`admission-${request.requestId}`),
          providerReleaseRef,
          exactScopeRereadVerified: true,
          exactArtifactAuthorityRereadVerified: true,
          exactCostPreflightRereadVerified: true,
          killSwitchesVerifiedClosed: true,
          retentionPrivacyVerified: true,
        }
      },
    },
    evidencePreparationPort: {
      async prepare({ request }) { return preparedEvidence(request) },
    },
    attemptStore: createAttemptStore(unknownEvents),
    reportRepository: createReportRepository(unknownEvents),
    concurrencyPort: createConcurrencyPort(unknownEvents),
  })
  await assert.rejects(() => unknownService.execute(buildRequest({
    requestId: 'request-unknown',
    idempotencyKey: 'idempotency-unknown',
    checksum: rawSha('4'),
  })), (error: unknown) => {
    assert.equal(String(error).includes('secret raw provider error'), false)
    return true
  })
  assert.equal(unknownEvents.includes('failed_unknown'), true)
  assert.equal(unknownEvents.at(-1), 'lease_released')

  const rejectedEvents: string[] = []
  const rejectedProvider = createProvider(counter)
  const acceptedExecute = rejectedProvider.execute.bind(rejectedProvider)
  rejectedProvider.execute = async (input) => {
    const accepted = await acceptedExecute(input)
    return {
      ...accepted,
      normalizedResult: {
        ...accepted.normalizedResult,
        segments: accepted.normalizedResult.segments.map((segment) => ({
          ...segment,
          range: {
            startFrame: 240,
            endFrameExclusive: 241,
            frameRate,
          },
        })),
      },
    }
  }
  const rejectedService = createVisualIntelligenceLifecycleService({
    provider: rejectedProvider,
    admissionPort: {
      async verifyAndRereadExact(request) {
        return {
          status: 'admitted',
          admissionRef: ref(`admission-${request.requestId}`),
          providerReleaseRef,
          exactScopeRereadVerified: true,
          exactArtifactAuthorityRereadVerified: true,
          exactCostPreflightRereadVerified: true,
          killSwitchesVerifiedClosed: true,
          retentionPrivacyVerified: true,
        }
      },
    },
    evidencePreparationPort: {
      async prepare({ request }) { return preparedEvidence(request) },
    },
    attemptStore: createAttemptStore(rejectedEvents),
    reportRepository: createReportRepository(rejectedEvents),
    concurrencyPort: createConcurrencyPort(rejectedEvents),
  })
  await assert.rejects(() => rejectedService.execute(buildRequest({
    requestId: 'request-invalid-provider-range',
    idempotencyKey: 'idempotency-invalid-provider-range',
    checksum: rawSha('8'),
  })), /not ready/iu)
  assert.equal(rejectedEvents.includes('failed_executed_rejected'), true)
  assert.equal(rejectedEvents.includes('report_persisted'), false)
  assert.equal(rejectedEvents.at(-1), 'lease_released')

  console.log(JSON.stringify({
    status: 'visual_intelligence_lifecycle_smoke_passed',
    firstRun: first.status,
    replay: replay.status,
    changedSource: changed.status,
    providerCalls: counter.calls,
    multiSourceSemanticEvidenceCount: multiSemanticEvidence.length,
    distinctBoundedQuestionsUseDistinctCacheIdentities: true,
    duplicateProviderCallAvoided: replay.duplicateProviderCallAvoided,
    duplicateCostSettlementAvoided: replay.duplicateCostSettlementAvoided,
    unknownOutcomeBlockedWithoutRetry:
      unknownEvents.includes('failed_unknown'),
    outOfScopeProviderEvidenceRejectedBeforePersistence:
      rejectedEvents.includes('failed_executed_rejected'),
    substantiveCpuExecutionUsed: false,
  }, null, 2))
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
