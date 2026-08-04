import {
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidence,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceProvider,
  type VisualIntelligencePreparedEvidence,
  type VisualIntelligenceProviderRequest,
  type VisualIntelligenceReport,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
export type {
  VisualIntelligencePreparedEvidence,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceReport,
  parseVisualIntelligencePreparedEvidence,
  parseVisualIntelligenceProviderNormalizedResult,
  parseVisualIntelligenceReport,
  visualIntelligenceSourcePlanningSegmentsAreComplete,
  parseVisualIntelligenceRequest,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  getVisualIntelligenceProfileDefinition,
} from './visual-intelligence-profile-registry'
import {
  getVisualIntelligenceSkillDefinitionForRequest,
} from './visual-intelligence-skill-registry'

export const VISUAL_INTELLIGENCE_LIFECYCLE_SERVICE_VERSION =
  'visual-intelligence-lifecycle-service-v1' as const

export interface VisualIntelligenceAdmissionVerificationPort {
  verifyAndRereadExact(request: VisualIntelligenceRequest): Promise<{
    readonly status: 'admitted' | 'blocked'
    readonly blockerCode?: string
    readonly admissionRef?: VisualIntelligenceEvidenceRef
    readonly providerReleaseRef?: VisualIntelligenceEvidenceRef
    readonly exactScopeRereadVerified?: true
    readonly exactArtifactAuthorityRereadVerified?: true
    readonly exactCostPreflightRereadVerified?: true
    readonly killSwitchesVerifiedClosed?: true
    readonly retentionPrivacyVerified?: true
  }>
}

export interface VisualIntelligenceEvidencePreparationPort {
  prepare(input: {
    readonly request: VisualIntelligenceRequest
    readonly admissionRef: VisualIntelligenceEvidenceRef
  }): Promise<VisualIntelligencePreparedEvidence>
}

export interface VisualIntelligenceAttemptStore {
  beginCreateOnly(input: {
    readonly requestId: string
    readonly idempotencyKey: string
    readonly requestDigestSha256: string
    readonly cacheIdentitySha256: string
  }): Promise<
    | { readonly status: 'created'; readonly attemptRef: VisualIntelligenceEvidenceRef }
    | { readonly status: 'already_in_progress' }
    | { readonly status: 'already_completed'; readonly reportRef: VisualIntelligenceEvidenceRef }
    | { readonly status: 'conflict' }
  >
  markProviderCallStarted(input: {
    readonly attemptRef: VisualIntelligenceEvidenceRef
    readonly dispatchConfigurationDigestSha256: string
    readonly maximumAttempts: 1
    readonly attemptOrdinal: 1
    readonly uncertainProviderOutcomeRetryAllowed: false
  }): Promise<{ readonly exactCreateOnlyRereadVerified: true }>
  markFailed(input: {
    readonly attemptRef: VisualIntelligenceEvidenceRef
    readonly outcome: 'not_executed' | 'unknown' | 'executed_rejected'
    readonly blockerCode: string
    readonly automaticRetryAllowed: false
  }): Promise<void>
  markCompleted(input: {
    readonly attemptRef: VisualIntelligenceEvidenceRef
    readonly reportRef: VisualIntelligenceEvidenceRef
    readonly providerCallOutcome: 'executed'
    readonly accountEffectiveCostSettled: true
  }): Promise<{ readonly exactTerminalRereadVerified: true }>
}

export interface VisualIntelligenceReportRepository {
  readAcceptedByCacheIdentity(input: {
    readonly cacheIdentitySha256: string
    readonly scope: VisualIntelligenceRequest['scope']
  }): Promise<VisualIntelligenceReport | null>
  readAcceptedByRef(
    reportRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceReport | null>
  persistImmutable(input: {
    readonly cacheIdentitySha256: string
    readonly report: VisualIntelligenceReport
  }): Promise<{
    readonly reportRef: VisualIntelligenceEvidenceRef
    readonly createOnlyPersisted: true
    readonly exactRereadVerified: true
  }>
}

export interface VisualIntelligenceConcurrencyPort {
  acquire(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly requestId: string
    readonly maximumConcurrentProviderCalls: number
  }): Promise<
    | { readonly status: 'acquired'; readonly leaseRef: VisualIntelligenceEvidenceRef }
    | { readonly status: 'capacity_exhausted' }
  >
  release(leaseRef: VisualIntelligenceEvidenceRef): Promise<void>
}

export interface VisualIntelligenceExecutionOutcome {
  readonly lifecycleVersion: typeof VISUAL_INTELLIGENCE_LIFECYCLE_SERVICE_VERSION
  readonly status: 'completed' | 'cache_replay'
  readonly report: VisualIntelligenceReport
  readonly reportRef: VisualIntelligenceEvidenceRef
  readonly providerCallMadeDuringInvocation: boolean
  readonly costSettledDuringInvocation: boolean
  readonly duplicateProviderCallAvoided: boolean
  readonly duplicateCostSettlementAvoided: boolean
  readonly directTimelineMutationPerformed: false
}

export interface VisualIntelligenceLifecycleService {
  execute(untrustedRequest: unknown): Promise<VisualIntelligenceExecutionOutcome>
}

export function createVisualIntelligenceLifecycleService(input: {
  readonly provider: VisualIntelligenceProvider
  readonly admissionPort: VisualIntelligenceAdmissionVerificationPort
  readonly evidencePreparationPort: VisualIntelligenceEvidencePreparationPort
  readonly attemptStore: VisualIntelligenceAttemptStore
  readonly reportRepository: VisualIntelligenceReportRepository
  readonly concurrencyPort: VisualIntelligenceConcurrencyPort
  readonly maximumConcurrentProviderCallsPerWorkspace?: number
}): VisualIntelligenceLifecycleService {
  const maximumConcurrentProviderCalls =
    input.maximumConcurrentProviderCallsPerWorkspace ?? 2
  if (
    input.provider.adapterId !== 'vertex_gemini_pro'
    || !Number.isInteger(maximumConcurrentProviderCalls)
    || maximumConcurrentProviderCalls < 1
    || maximumConcurrentProviderCalls > 16
  ) throw notReady('visual_intelligence_lifecycle_configuration_invalid')
  return Object.freeze({
    async execute(untrustedRequest: unknown) {
      const request = parseVisualIntelligenceRequest(untrustedRequest)
      getVisualIntelligenceSkillDefinitionForRequest(request)
      const admission = await input.admissionPort.verifyAndRereadExact(request)
      if (
        admission.status !== 'admitted'
        || !admission.admissionRef
        || !admission.providerReleaseRef
        || admission.exactScopeRereadVerified !== true
        || admission.exactArtifactAuthorityRereadVerified !== true
        || admission.exactCostPreflightRereadVerified !== true
        || admission.killSwitchesVerifiedClosed !== true
        || admission.retentionPrivacyVerified !== true
        || refKey(admission.providerReleaseRef)
          !== refKey(request.admission.providerReleaseRef)
      ) throw notReady(admission.blockerCode
        ?? 'visual_intelligence_admission_not_current')

      const prepared = assertVisualIntelligencePreparedEvidenceForRequest(
        request,
        await input.evidencePreparationPort.prepare({
          request,
          admissionRef: admission.admissionRef,
        }),
      )
      const profile = getVisualIntelligenceProfileDefinition(
        request.operation,
        request.profile,
      )
      const cacheIdentitySha256 = createCacheIdentity({
        request,
        prepared,
        profileDigestSha256: profile.profileDigestSha256,
        promptVersion: profile.promptVersion,
        responseSchemaVersion: profile.responseSchemaVersion,
        deterministicEvidenceVersion: profile.deterministicEvidenceVersion,
      })
      const cached = await input.reportRepository.readAcceptedByCacheIdentity({
        cacheIdentitySha256,
        scope: request.scope,
      })
      if (cached) {
        const report = validateCachedReport(cached, request, cacheIdentitySha256)
        return outcome('cache_replay', report, reportRef(report), false)
      }

      const lease = await input.concurrencyPort.acquire({
        workspaceId: request.scope.workspaceId,
        projectId: request.scope.projectId,
        requestId: request.requestId,
        maximumConcurrentProviderCalls,
      })
      if (lease.status !== 'acquired') {
        throw notReady('visual_intelligence_workspace_concurrency_exhausted')
      }
      try {
        const attempt = await input.attemptStore.beginCreateOnly({
          requestId: request.requestId,
          idempotencyKey: request.idempotencyKey,
          requestDigestSha256: request.requestDigestSha256,
          cacheIdentitySha256,
        })
        if (attempt.status === 'already_completed') {
          const completed = await input.reportRepository.readAcceptedByRef(
            attempt.reportRef,
          )
          if (!completed) {
            throw notReady('visual_intelligence_completed_attempt_report_missing')
          }
          const report = validateCachedReport(
            completed,
            request,
            cacheIdentitySha256,
          )
          return outcome('cache_replay', report, attempt.reportRef, false)
        }
        if (attempt.status === 'already_in_progress') {
          throw notReady('visual_intelligence_request_already_in_progress')
        }
        if (attempt.status === 'conflict') {
          throw notReady('visual_intelligence_idempotency_conflict')
        }
        const providerRequest: VisualIntelligenceProviderRequest = {
          request,
          deterministicEvidence: prepared.deterministicEvidence,
          coveragePlan: prepared.coveragePlan,
          privateMediaInputs: prepared.privateMediaInputs,
          promptVersion: profile.promptVersion,
          responseSchemaVersion: profile.responseSchemaVersion,
        }
        let dispatchDigest: string
        try {
          dispatchDigest = input.provider.preflight(
            providerRequest,
          ).requestConfigurationDigestSha256
        } catch {
          await input.attemptStore.markFailed({
            attemptRef: attempt.attemptRef,
            outcome: 'not_executed',
            blockerCode: 'visual_intelligence_dispatch_compilation_failed',
            automaticRetryAllowed: false,
          })
          throw notReady('visual_intelligence_dispatch_compilation_failed')
        }
        await input.attemptStore.markProviderCallStarted({
          attemptRef: attempt.attemptRef,
          dispatchConfigurationDigestSha256: dispatchDigest,
          maximumAttempts: 1,
          attemptOrdinal: 1,
          uncertainProviderOutcomeRetryAllowed: false,
        })
        let providerResult: Awaited<ReturnType<VisualIntelligenceProvider['execute']>>
        try {
          providerResult = await input.provider.execute(providerRequest)
        } catch {
          await input.attemptStore.markFailed({
            attemptRef: attempt.attemptRef,
            outcome: 'unknown',
            blockerCode:
              'visual_intelligence_provider_outcome_unknown_reconciliation_required',
            automaticRetryAllowed: false,
          })
          throw notReady(
            'visual_intelligence_provider_outcome_unknown_reconciliation_required',
          )
        }

        let normalizedResult: ReturnType<
          typeof parseVisualIntelligenceProviderNormalizedResult
        >
        try {
          normalizedResult = validateProviderResultAgainstRequest({
            request,
            prepared,
            providerResult,
          })
        } catch {
          await input.attemptStore.markFailed({
            attemptRef: attempt.attemptRef,
            outcome: 'executed_rejected',
            blockerCode:
              'visual_intelligence_provider_result_not_admissible',
            automaticRetryAllowed: false,
          })
          throw notReady('visual_intelligence_provider_result_not_admissible')
        }

        const semanticEvidence = createArtifactBoundSemanticEvidence({
          request,
          normalizedResult,
          providerResult,
        })
        const semanticRefByArtifact = new Map(semanticEvidence.map(
          (evidence) => [evidence.artifactId, evidence.evidenceRef],
        ))
        const incompleteCoverage =
          !prepared.coveragePlan.completeRequestedRangeCoverage
          || prepared.coveragePlan.incompleteRanges.length > 0
        const blockers = incompleteCoverage
          ? ['visual_intelligence_incomplete_requested_coverage']
          : []
        const report = createVisualIntelligenceReport({
          reportId:
            `visual-intelligence-report-${request.requestDigestSha256.slice(7)}`,
          requestRef: {
            id: request.requestId,
            version: 1,
            contentHash: request.requestDigestSha256,
          },
          scope: request.scope,
          operation: request.operation,
          profile: request.profile,
          sourceArtifacts: request.sourceArtifacts.map(reportArtifact),
          comparisonArtifacts: request.comparisonArtifacts.map(reportArtifact),
          coverage: {
            ...prepared.coveragePlan,
            targetedFollowupRanges:
              normalizedResult.targetedFollowupRanges,
          },
          semanticSummary: normalizedResult.semanticSummary,
          segments: normalizedResult.segments.map((segment) => ({
            ...segment,
            evidenceRefs: uniqueRefs([
              ...segment.evidenceRefs,
              requireArtifactSemanticRef(semanticRefByArtifact, segment.artifactId),
            ]),
          })),
          findings: normalizedResult.findings.map((finding) => ({
            ...finding,
            evidenceRefs: uniqueRefs([
              ...finding.evidenceRefs,
              requireArtifactSemanticRef(semanticRefByArtifact, finding.artifactId),
            ]),
          })),
          evidence: [...prepared.deterministicEvidence, ...semanticEvidence],
          deterministicToolExecutions: [...prepared.toolExecutionEvidence],
          expectedOutcomeRefs: request.expectedOutcomeRefs,
          disposition: deriveDisposition(
            normalizedResult.findings,
            blockers,
          ),
          reinspectionRequired:
            normalizedResult.findings.some(
              (finding) => finding.reinspectionRequired,
            ),
          usage: providerResult.usage,
          provenance: {
            ...providerResult.provenance,
            deterministicEvidenceVersion:
              profile.deterministicEvidenceVersion,
            transcriptVersion: prepared.transcriptVersion,
            ocrVersion: prepared.ocrVersion,
            cacheIdentitySha256,
            requestDigestSha256: request.requestDigestSha256,
            admissionRef: admission.admissionRef,
            providerReleaseRef: admission.providerReleaseRef,
          },
          blockers,
          warnings: normalizedResult.warnings,
          immutableReport: true,
          planningMayConsumeValidatedEvidence:
            request.operation !== 'inspect_edit' && !incompleteCoverage,
          directTimelineMutationAllowed: false,
          renderPerformedByVisualIntelligence: false,
          exportAuthorized: false,
          deliveryAuthorized: false,
        })
        const persisted = await input.reportRepository.persistImmutable({
          cacheIdentitySha256,
          report,
        })
        if (
          !persisted.createOnlyPersisted
          || !persisted.exactRereadVerified
          || refKey(persisted.reportRef) !== refKey(reportRef(report))
        ) {
          await input.attemptStore.markFailed({
            attemptRef: attempt.attemptRef,
            outcome: 'unknown',
            blockerCode: 'visual_intelligence_report_persistence_not_reconciled',
            automaticRetryAllowed: false,
          })
          throw notReady('visual_intelligence_report_persistence_not_reconciled')
        }
        await input.attemptStore.markCompleted({
          attemptRef: attempt.attemptRef,
          reportRef: persisted.reportRef,
          providerCallOutcome: 'executed',
          accountEffectiveCostSettled: true,
        })
        return outcome('completed', report, persisted.reportRef, true)
      } finally {
        await input.concurrencyPort.release(lease.leaseRef)
      }
    },
  })
}

function createArtifactBoundSemanticEvidence(input: {
  request: VisualIntelligenceRequest
  normalizedResult: ReturnType<
    typeof parseVisualIntelligenceProviderNormalizedResult
  >
  providerResult: Awaited<ReturnType<VisualIntelligenceProvider['execute']>>
}): VisualIntelligenceEvidence[] {
  return [
    ...input.request.sourceArtifacts,
    ...input.request.comparisonArtifacts,
  ].map((artifact) => {
    const artifactResult = {
      requestId: input.request.requestId,
      artifactId: artifact.artifactId,
      semanticSummary: input.normalizedResult.semanticSummary,
      segments: input.normalizedResult.segments.filter(
        (segment) => segment.artifactId === artifact.artifactId,
      ),
      findings: input.normalizedResult.findings.filter(
        (finding) => finding.artifactId === artifact.artifactId,
      ),
    }
    const artifactDigest = visualIntelligenceDigest(artifactResult)
    const evidenceRef = createVisualIntelligenceEvidenceRef(
      `visual-intelligence-semantic-${artifactDigest.slice(7, 39)}`,
      artifactResult,
    )
    return {
      evidenceId: evidenceRef.id,
      evidenceRef,
      artifactId: artifact.artifactId,
      range: null,
      authority: 'semantic_visual_judgment',
      producingTool: 'gemini_pro_high',
      toolVersion: input.providerResult.provenance.exactModelId,
      summary: input.normalizedResult.semanticSummary,
      privateEvidence: true,
      providerInstructionAccepted: false,
    }
  })
}

function validateProviderResultAgainstRequest(input: {
  request: VisualIntelligenceRequest
  prepared: VisualIntelligencePreparedEvidence
  providerResult: Awaited<ReturnType<VisualIntelligenceProvider['execute']>>
}): ReturnType<typeof parseVisualIntelligenceProviderNormalizedResult> {
  const result = parseVisualIntelligenceProviderNormalizedResult(
    input.providerResult.normalizedResult,
  )
  const artifacts = new Map([
    ...input.request.sourceArtifacts,
    ...input.request.comparisonArtifacts,
  ].map((artifact) => [artifact.artifactId, artifact]))
  const evidenceByRef = new Map(input.prepared.deterministicEvidence.map(
    (evidence) => [refKey(evidence.evidenceRef), evidence],
  ))
  const expectedOutcomeRefs = new Set(
    input.request.expectedOutcomeRefs.map(refKey),
  )
  const representedArtifacts = new Set<string>()
  const profile = getVisualIntelligenceProfileDefinition(
    input.request.operation,
    input.request.profile,
  )
  const usage = input.providerResult.usage
  const provenance = input.providerResult.provenance

  if (
    result.requestId !== input.request.requestId
    || result.segments.length === 0
    || new Set(result.segments.map((segment) => segment.segmentId)).size
      !== result.segments.length
    || new Set(result.findings.map((finding) => finding.findingId)).size
      !== result.findings.length
    || usage.providerCallMade !== true
    || usage.replayedFromCache !== false
    || usage.settledCostMicros === null
    || usage.costEvidenceRef === null
    || usage.billingAccountEffectiveRateUsed !== true
    || usage.publicListPriceUsed !== false
    || usage.duplicateSettlementPerformed !== false
    || usage.settledCostMicros
      > input.request.admission.costPreflight.maximumAuthorizedCostMicros
    || provenance.providerAdapterId !== VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
    || provenance.providerId !== VISUAL_INTELLIGENCE_PROVIDER_ID
    || provenance.exactModelId !== VISUAL_INTELLIGENCE_MODEL_ID
    || provenance.thinkingLevel !== VISUAL_INTELLIGENCE_THINKING_LEVEL
    || provenance.mediaResolution !== VISUAL_INTELLIGENCE_MEDIA_RESOLUTION
    || provenance.promptVersion !== profile.promptVersion
    || provenance.responseSchemaVersion !== profile.responseSchemaVersion
    || provenance.applicationDefaultCredentialsUsed !== true
    || provenance.providerToolsUsed !== false
    || provenance.searchGroundingUsed !== false
    || provenance.urlContextUsed !== false
    || provenance.codeExecutionUsed !== false
    || provenance.rawProviderPayloadPersisted !== false
  ) throw notReady('visual_intelligence_provider_result_scope_mismatch')

  for (const segment of result.segments) {
    const artifact = artifacts.get(segment.artifactId)
    if (
      !artifact
      || !rangeIsAdmitted(segment.range, artifact, input.request.requestedRanges)
      || hasDuplicateRefs(segment.evidenceRefs)
      || segment.evidenceRefs.some((ref) => !evidenceByRef.has(refKey(ref)))
      || segment.visibleTextEvidenceRefs.some((ref) =>
        evidenceByRef.get(refKey(ref))?.authority !== 'exact_ocr')
      || segment.transcriptEvidenceRefs.some((ref) =>
        evidenceByRef.get(refKey(ref))?.authority !== 'canonical_transcript')
    ) throw notReady('visual_intelligence_provider_segment_not_admissible')
    representedArtifacts.add(segment.artifactId)
  }
  if ([...artifacts.keys()].some((artifactId) =>
    !representedArtifacts.has(artifactId))) {
    throw notReady('visual_intelligence_provider_artifact_coverage_missing')
  }
  if (!visualIntelligenceSourcePlanningSegmentsAreComplete({
    profile: input.request.profile,
    sourceArtifacts: input.request.sourceArtifacts,
    segments: result.segments,
    targetedFollowupRangeCount: result.targetedFollowupRanges.length,
  })) {
    throw notReady('visual_intelligence_provider_source_partition_invalid')
  }

  for (const finding of result.findings) {
    const artifact = artifacts.get(finding.artifactId)
    if (
      !artifact
      || !rangeIsAdmitted(finding.range, artifact, input.request.requestedRanges)
      || hasDuplicateRefs(finding.evidenceRefs)
      || finding.evidenceRefs.some((ref) => !evidenceByRef.has(refKey(ref)))
      || finding.expectedOutcomeRefs.some(
        (ref) => !expectedOutcomeRefs.has(refKey(ref)),
      )
    ) throw notReady('visual_intelligence_provider_finding_not_admissible')
  }
  if (result.targetedFollowupRanges.some((range) =>
    !input.request.requestedRanges.some((requested) =>
      containsRange(requested, range)))) {
    throw notReady('visual_intelligence_provider_followup_range_not_admissible')
  }
  return result
}

function rangeIsAdmitted(
  range: VisualIntelligenceRequest['requestedRanges'][number],
  artifact: VisualIntelligenceRequest['sourceArtifacts'][number],
  requestedRanges: readonly VisualIntelligenceRequest['requestedRanges'][number][],
): boolean {
  return range.endFrameExclusive <= artifact.durationFrames
    && range.frameRate.numerator === artifact.frameRate.numerator
    && range.frameRate.denominator === artifact.frameRate.denominator
    && requestedRanges.some((requested) => containsRange(requested, range))
}

function hasDuplicateRefs(
  refs: readonly VisualIntelligenceEvidenceRef[],
): boolean {
  return new Set(refs.map(refKey)).size !== refs.length
}

function requireArtifactSemanticRef(
  refs: ReadonlyMap<string, VisualIntelligenceEvidenceRef>,
  artifactId: string,
): VisualIntelligenceEvidenceRef {
  const ref = refs.get(artifactId)
  if (!ref) throw notReady('visual_intelligence_artifact_semantic_evidence_missing')
  return ref
}

export function assertVisualIntelligencePreparedEvidenceForRequest(
  untrustedRequest: unknown,
  untrustedPrepared: unknown,
): VisualIntelligencePreparedEvidence {
  const request = parseVisualIntelligenceRequest(untrustedRequest)
  const prepared = parseVisualIntelligencePreparedEvidence(untrustedPrepared)
  validatePreparedEvidence(request, prepared)
  return prepared
}

function validatePreparedEvidence(
  request: VisualIntelligenceRequest,
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const profile = getVisualIntelligenceProfileDefinition(
    request.operation,
    request.profile,
  )
  const requiredTools = profile.toolPolicies
    .filter((policy) => policy.requirement === 'required')
  const artifacts = [
    ...request.sourceArtifacts,
    ...request.comparisonArtifacts,
  ]
  const artifactIds = new Set(artifacts.map((artifact) => artifact.artifactId))
  const evidenceRefKeys = prepared.deterministicEvidence.map(
    (evidence) => refKey(evidence.evidenceRef),
  )
  if (
    new Set(evidenceRefKeys).size !== evidenceRefKeys.length
    || new Set(prepared.deterministicEvidence.map(
      (evidence) => evidence.evidenceId,
    )).size !== prepared.deterministicEvidence.length
    || new Set(prepared.toolExecutionEvidence.map(
      (execution) => refKey(execution.executionRef),
    )).size !== prepared.toolExecutionEvidence.length
  ) throw notReady('visual_intelligence_evidence_identity_not_unique')
  for (const policy of requiredTools) {
    const execution = prepared.toolExecutionEvidence.find(
      (item) => item.tool === policy.tool,
    )
    if (
      !execution
      || execution.requirement !== 'required'
      || execution.executionClass !== policy.executionClass
      || execution.substantiveCpuExecutionUsed !== false
      || execution.sourceArtifactChecksumBound !== true
    ) throw notReady(`visual_intelligence_required_tool_${policy.tool}_not_ready`)
  }
  for (const execution of prepared.toolExecutionEvidence) {
    const policy = profile.toolPolicies.find(
      (candidate) => candidate.tool === execution.tool,
    )
    if (
      !policy
      || policy.requirement === 'not_used'
      || execution.requirement !== policy.requirement
      || execution.executionClass !== policy.executionClass
      || refKey(execution.releaseRef) === refKey(execution.executionRef)
      || !prepared.deterministicEvidence.some(
        (evidence) => evidence.producingTool === execution.tool,
      )
    ) throw notReady(
      `visual_intelligence_tool_${execution.tool}_execution_unverified`,
    )
  }
  validateConditionalToolEvidence({
    artifacts: [...artifactIds],
    profile,
    prepared,
  })
  const deterministicRefKeys = new Set(evidenceRefKeys)
  if (
    prepared.coveragePlan.sceneBoundaryRefs.some(
      (reference) => !prepared.deterministicEvidence.some(
        (evidence) => refKey(evidence.evidenceRef) === refKey(reference)
          && evidence.authority === 'scene_detection'
          && evidence.producingTool === 'pyscenedetect',
      ),
    )
    || prepared.coveragePlan.samplingPolicies.some(
      (policy) => !deterministicRefKeys.has(refKey(policy.samplingPolicyRef)),
    )
  ) throw notReady('visual_intelligence_coverage_evidence_unverified')
  if (
    prepared.privateMediaInputs.length
      !== artifacts.length
    || artifacts.some((artifact, index) => {
      const media = prepared.privateMediaInputs[index]
      return !media
        || media.artifactId !== artifact.artifactId
        || media.contentType !== artifact.contentType
        || media.checksumSha256 !== artifact.checksumSha256
        || media.exactGenerationRereadVerified !== true
    })
    || !same(prepared.coveragePlan.requestedRanges, request.requestedRanges)
    || prepared.coveragePlan.analyzedRanges.some((range) =>
      !request.requestedRanges.some((requested) => containsRange(
        requested,
        range,
      )))
    || prepared.coveragePlan.samplingPolicies.some((policy) =>
      !request.requestedRanges.some((requested) => containsRange(
        requested,
        policy.requestedRange,
      ))
      || !containsRange(policy.requestedRange, policy.analyzedRange))
    || prepared.toolExecutionEvidence.some((execution) =>
      execution.substantiveCpuExecutionUsed !== false
        || execution.sourceArtifactChecksumBound !== true)
    || prepared.deterministicEvidence.some((evidence) =>
      !artifacts.some((artifact) =>
        artifact.artifactId === evidence.artifactId))
    || prepared.deterministicEvidence.length === 0
    || !prepared.preparedEvidenceRef
  ) throw notReady('visual_intelligence_evidence_preparation_incomplete')
  const preparedEvidenceRefs = new Set(
    prepared.deterministicEvidence.map((evidence) => refKey(evidence.evidenceRef)),
  )
  if (request.requiredEvidenceRefs.some(
    (requiredRef) => !preparedEvidenceRefs.has(refKey(requiredRef)),
  )) throw notReady('visual_intelligence_required_evidence_missing')
}

function validateConditionalToolEvidence(input: {
  artifacts: readonly string[]
  profile: ReturnType<typeof getVisualIntelligenceProfileDefinition>
  prepared: VisualIntelligencePreparedEvidence
}): void {
  const decisions = input.prepared.conditionalToolDecisions
  const decisionKeys = decisions.map(
    (decision) => `${decision.artifactId}:${decision.tool}`,
  )
  if (
    new Set(decisionKeys).size !== decisionKeys.length
    || decisions.some((decision) =>
      !input.artifacts.includes(decision.artifactId))
  ) throw notReady('visual_intelligence_conditional_tool_decision_invalid')

  const validateTool = (
    tool: 'faster_whisper' | 'ocr',
    required: boolean,
    version: string | null,
  ) => {
    const toolDecisions = decisions.filter((decision) =>
      decision.tool === tool)
    const execution = input.prepared.toolExecutionEvidence.find(
      (candidate) => candidate.tool === tool,
    )
    const toolEvidence = input.prepared.deterministicEvidence.filter(
      (evidence) => evidence.producingTool === tool,
    )
    if (!required) {
      if (
        toolDecisions.length !== 0
        || execution
        || toolEvidence.length !== 0
        || version !== null
      ) throw notReady(`visual_intelligence_unrequested_${tool}_evidence`)
      return
    }
    if (
      toolDecisions.length !== input.artifacts.length
      || input.artifacts.some((artifactId) =>
        !toolDecisions.some((decision) =>
          decision.artifactId === artifactId))
    ) throw notReady(
      `visual_intelligence_${tool}_decision_coverage_incomplete`,
    )
    const executedDecisions = toolDecisions.filter(
      (decision) => decision.disposition === 'executed',
    )
    if (executedDecisions.length === 0) {
      if (tool !== 'faster_whisper' || execution || toolEvidence.length || version) {
        throw notReady(`visual_intelligence_${tool}_bypass_invalid`)
      }
    } else if (!execution || !version) {
      throw notReady(`visual_intelligence_${tool}_execution_missing`)
    }
    for (const decision of toolDecisions) {
      const evidence = input.prepared.deterministicEvidence.find(
        (candidate) => candidate.artifactId === decision.artifactId
          && refKey(candidate.evidenceRef) ===
            refKey(decision.decisionEvidenceRef),
      )
      const exact = decision.disposition === 'executed'
        ? evidence?.producingTool === tool
          && evidence.toolVersion === version
          && evidence.authority === (
            tool === 'ocr' ? 'exact_ocr' : 'canonical_transcript'
          )
        : tool === 'faster_whisper'
          && evidence?.producingTool === 'ffprobe'
          && evidence.authority === 'media_probe'
      if (!exact) throw notReady(
        `visual_intelligence_${tool}_decision_evidence_mismatch`,
      )
    }
  }

  validateTool(
    'faster_whisper',
    input.profile.transcriptPolicy === 'required_when_speech_bears_meaning',
    input.prepared.transcriptVersion,
  )
  validateTool(
    'ocr',
    input.profile.ocrPolicy === 'required_for_exact_visible_text',
    input.prepared.ocrVersion,
  )
}

function createCacheIdentity(input: {
  request: VisualIntelligenceRequest
  prepared: VisualIntelligencePreparedEvidence
  profileDigestSha256: string
  promptVersion: string
  responseSchemaVersion: string
  deterministicEvidenceVersion: string
}): string {
  return visualIntelligenceDigest({
    schemaVersion: 'visual-intelligence-cache-identity-v1',
    sourceArtifacts: input.request.sourceArtifacts.map(cacheArtifact),
    comparisonArtifacts: input.request.comparisonArtifacts.map(cacheArtifact),
    operation: input.request.operation,
    profile: input.request.profile,
    requestedRanges: input.request.requestedRanges,
    outputFrame: input.request.outputFrame,
    protectedZones: input.request.protectedZones,
    callerQuestion: input.request.callerQuestion,
    expectedOutcomeRefs: input.request.expectedOutcomeRefs,
    requiredEvidenceRefs: input.request.requiredEvidenceRefs,
    approvedSnapshotId: input.request.scope.approvedSnapshotId,
    transcriptVersion: input.prepared.transcriptVersion,
    ocrVersion: input.prepared.ocrVersion,
    preparedEvidenceRef: input.prepared.preparedEvidenceRef,
    samplingPolicies: input.prepared.coveragePlan.samplingPolicies,
    exactModelId: input.request.qualityPolicy.exactModelId,
    thinkingLevel: input.request.qualityPolicy.thinkingLevel,
    mediaResolution: input.request.qualityPolicy.mediaResolution,
    profileDigestSha256: input.profileDigestSha256,
    promptVersion: input.promptVersion,
    responseSchemaVersion: input.responseSchemaVersion,
    deterministicEvidenceVersion: input.deterministicEvidenceVersion,
  })
}

function containsRange(
  outer: VisualIntelligenceRequest['requestedRanges'][number],
  inner: VisualIntelligenceRequest['requestedRanges'][number],
): boolean {
  return outer.frameRate.numerator === inner.frameRate.numerator
    && outer.frameRate.denominator === inner.frameRate.denominator
    && outer.startFrame <= inner.startFrame
    && outer.endFrameExclusive >= inner.endFrameExclusive
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceDigest(left) === visualIntelligenceDigest(right)
}

function validateCachedReport(
  value: VisualIntelligenceReport,
  request: VisualIntelligenceRequest,
  cacheIdentitySha256: string,
): VisualIntelligenceReport {
  const report = parseVisualIntelligenceReport(value)
  if (
    report.provenance.cacheIdentitySha256 !== cacheIdentitySha256
    || report.operation !== request.operation
    || report.profile !== request.profile
    || report.scope.ownerUserId !== request.scope.ownerUserId
    || report.scope.workspaceId !== request.scope.workspaceId
    || report.scope.projectId !== request.scope.projectId
    || report.scope.editSessionId !== request.scope.editSessionId
    || report.scope.approvedSnapshotId !== request.scope.approvedSnapshotId
  ) throw notReady('visual_intelligence_cache_scope_mismatch')
  return report
}

function reportArtifact(value: VisualIntelligenceRequest['sourceArtifacts'][number]) {
  return {
    artifactId: value.artifactId,
    checksumSha256: value.checksumSha256,
    mediaKind: value.mediaKind,
    durationFrames: value.durationFrames,
  }
}

function cacheArtifact(value: VisualIntelligenceRequest['sourceArtifacts'][number]) {
  return {
    artifactId: value.artifactId,
    checksumSha256: value.checksumSha256,
    durationFrames: value.durationFrames,
    frameRate: value.frameRate,
    mediaProbeEvidenceRef: value.mediaProbeEvidenceRef,
    finalizedMediaAuthorityRef: value.finalizedMediaAuthorityRef,
    immutableStorageObjectAuthorityRef: value.immutableStorageObjectAuthorityRef,
  }
}

function deriveDisposition(
  findings: Array<{ severity: string }>,
  blockers: string[],
): VisualIntelligenceReport['disposition'] {
  if (blockers.length > 0 || findings.some((item) => item.severity === 'blocking')) {
    return 'blocked'
  }
  if (findings.some((item) => item.severity === 'revision_required')) {
    return 'needs_revision'
  }
  if (findings.some((item) => item.severity === 'warning')) {
    return 'pass_with_warnings'
  }
  return 'pass'
}

function reportRef(report: VisualIntelligenceReport): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: report.reportId,
    version: 1,
    contentHash: report.reportDigestSha256,
  })
}

function uniqueRefs(
  refs: VisualIntelligenceEvidenceRef[],
): VisualIntelligenceEvidenceRef[] {
  return [...new Map(refs.map((ref) => [refKey(ref), ref])).values()]
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function outcome(
  status: VisualIntelligenceExecutionOutcome['status'],
  report: VisualIntelligenceReport,
  ref: VisualIntelligenceEvidenceRef,
  providerCallMade: boolean,
): VisualIntelligenceExecutionOutcome {
  return Object.freeze({
    lifecycleVersion: VISUAL_INTELLIGENCE_LIFECYCLE_SERVICE_VERSION,
    status,
    report,
    reportRef: ref,
    providerCallMadeDuringInvocation: providerCallMade,
    costSettledDuringInvocation: providerCallMade,
    duplicateProviderCallAvoided: !providerCallMade,
    duplicateCostSettlementAvoided: !providerCallMade,
    directTimelineMutationPerformed: false,
  })
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The professional Visual Intelligence lifecycle is not ready.',
    503,
    { requiredGate },
  )
}
