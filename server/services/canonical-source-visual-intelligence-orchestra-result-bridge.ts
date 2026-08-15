import { createHash } from 'node:crypto'

import type {
  OrchestraEvidenceRef,
  OrchestraSkillCall,
  OrchestraSkillJobResult,
} from '../../src/types/orchestra-skill-capability'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceDeterministicTool,
  type VisualIntelligenceReport,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  orchestraDigest,
  orchestraEvidenceRef,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  VisualIntelligenceReportRepository,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  parseVisualIntelligenceReport,
  visualIntelligenceCanonicalJson,
  visualIntelligenceSourcePlanningSegmentsAreComplete,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  CompiledVisualIntelligenceOrchestraRequest,
} from '../visual-intelligence/visual-intelligence-orchestra-invocation-compiler'
import type {
  VisualIntelligenceOrchestraJobResultStore,
} from '../visual-intelligence/visual-intelligence-orchestra-job-result-store'
import type {
  VisualIntelligenceOrchestraConsumerBindingPort,
} from '../visual-intelligence/visual-intelligence-orchestra-job-runtime'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  type CanonicalSourceLedContentAnalysisSourceInput,
  type CanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'

export const CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_VERSION =
  'canonical-source-visual-intelligence-orchestra-binding-v1' as const
export const CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_REQUEST_VERSION =
  'canonical-source-visual-intelligence-orchestra-binding-request-v1' as const
export const CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_STORE_VERSION =
  'canonical-source-visual-intelligence-orchestra-binding-store-v1' as const
export const CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_READ_PORT_VERSION =
  'canonical-source-visual-intelligence-orchestra-read-port-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/consumer-bindings/source-video-understanding'
const MAX_BINDING_BYTES = 256 * 1024
const MAX_INDEX_BYTES = 16 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

export interface CanonicalSourceVisualIntelligenceOrchestraBindingScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly analysisRunId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly checksumSha256: string
  readonly byteLength: number
  readonly durationFrames: number
  readonly sourceFrameAuthority: CanonicalSourceLedSourceFrameAuthority
  readonly sourceArtifactRef: OrchestraEvidenceRef
  readonly sourceProbeAuthorityRef: OrchestraEvidenceRef
  readonly transcriptAuthorityRef: OrchestraEvidenceRef
  readonly transcriptDigestSha256: string
  readonly planningDirectionDigestSha256: string
  readonly userInstructionDigestSha256: string
  readonly planningContextAuthorityRef: OrchestraEvidenceRef
}

export interface CanonicalSourceVisualIntelligenceOrchestraBindingRequest {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_REQUEST_VERSION
  readonly requestId: string
  readonly requestDigestSha256: string
  readonly scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  readonly orchestraCallRef: OrchestraEvidenceRef
  readonly byteFreeRequest: true
  readonly browserSourceAuthorityAccepted: false
  readonly callerProviderDispatchAuthorityAccepted: false
  readonly callerGpuDispatchAuthorityAccepted: false
  readonly callerCreditAuthorityAccepted: false
  readonly consumerTimelineMutationAuthorityAccepted: false
}

export interface CanonicalSourceVisualIntelligenceOrchestraBinding {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_VERSION
  readonly bindingId: string
  readonly bindingDigestSha256: string
  readonly scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  readonly orchestraCallRef: OrchestraEvidenceRef
  readonly visualIntelligenceRequestRef: OrchestraEvidenceRef
  readonly orchestraPlanRef: OrchestraEvidenceRef
  readonly orchestraJobRef: OrchestraEvidenceRef
  readonly manifestRef: OrchestraEvidenceRef
  readonly qualificationSnapshotRef: OrchestraEvidenceRef
  readonly timeBudgetRef: OrchestraEvidenceRef
  readonly creditBudgetRef: OrchestraEvidenceRef
  readonly attemptEnvelopeRef: OrchestraEvidenceRef
  readonly createdAt: string
  readonly persistedBeforeProviderDispatch: true
  readonly exactConsumerScopeRereadRequired: true
  readonly exactOrchestraResultRereadRequired: true
  readonly exactVisualIntelligenceReportRereadRequired: true
  readonly completeAudioTranscriptSuppliedSeparately: true
  readonly mediaContainedInstructionsTreatedAsUntrustedEvidence: true
  readonly directProviderCallAllowed: false
  readonly directGpuDispatchAllowed: false
  readonly directTimelineMutationAllowed: false
  readonly customerCreditsMutated: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalSourceVisualIntelligenceOrchestraBindingStore {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_STORE_VERSION
  persistCreateOnly(binding: unknown): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly binding: CanonicalSourceVisualIntelligenceOrchestraBinding
    readonly bindingRef: OrchestraEvidenceRef
  }>
  readExact(
    scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  ): Promise<CanonicalSourceVisualIntelligenceOrchestraBinding | null>
}

export interface CanonicalSourceVisualIntelligenceOrchestraReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_READ_PORT_VERSION
  readCompletedSourceVideoUnderstanding(
    scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  ): Promise<CanonicalSourceLedContentAnalysisSourceInput['visual'] | null>
}

interface CallIndex {
  readonly schemaVersion:
    'canonical-source-visual-intelligence-orchestra-call-index-v1'
  readonly callRef: OrchestraEvidenceRef
  readonly bindingScopeDigestSha256: string
  readonly bindingId: string
  readonly indexDigestSha256: string
}

export function prepareCanonicalSourceVisualIntelligenceOrchestraBindingRequest(
  input: {
    readonly scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
    readonly orchestraCall: unknown
  },
): CanonicalSourceVisualIntelligenceOrchestraBindingRequest {
  const scope = parseScope(input.scope)
  const call = parseOrchestraSkillCall(input.orchestraCall)
  assertSourceVideoUnderstandingCall(call, scope)
  const orchestraCallRef = callRef(call)
  const withoutDigest = {
    schemaVersion:
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_REQUEST_VERSION,
    requestId: `source-vi-binding-request-${orchestraDigest({
      scope,
      orchestraCallRef,
    }).slice(7, 39)}`,
    scope,
    orchestraCallRef,
    byteFreeRequest: true as const,
    browserSourceAuthorityAccepted: false as const,
    callerProviderDispatchAuthorityAccepted: false as const,
    callerGpuDispatchAuthorityAccepted: false as const,
    callerCreditAuthorityAccepted: false as const,
    consumerTimelineMutationAuthorityAccepted: false as const,
  }
  return freeze({
    ...withoutDigest,
    requestDigestSha256: orchestraDigest(withoutDigest),
  })
}

export function createCanonicalSourceVisualIntelligenceOrchestraBinding(input: {
  readonly scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  readonly orchestraCall: unknown
  readonly visualIntelligenceRequestRef: OrchestraEvidenceRef
  readonly createdAt: string
}): CanonicalSourceVisualIntelligenceOrchestraBinding {
  const scope = parseScope(input.scope)
  const call = parseOrchestraSkillCall(input.orchestraCall)
  assertSourceVideoUnderstandingCall(call, scope)
  const ref = callRef(call)
  const visualIntelligenceRequestRef = cloneRef(
    input.visualIntelligenceRequestRef,
  )
  if (visualIntelligenceRequestRef.id !== call.callId) {
    throw conflict('source_vi_compiled_request_ref_invalid')
  }
  const withoutDigest = {
    schemaVersion:
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_VERSION,
    bindingId: `source-vi-binding-${orchestraDigest({ scope, ref }).slice(7, 39)}`,
    scope,
    orchestraCallRef: ref,
    visualIntelligenceRequestRef,
    orchestraPlanRef: cloneRef(call.orchestraPlanRef),
    orchestraJobRef: cloneRef(call.orchestraJobRef),
    manifestRef: cloneRef(call.manifestRef),
    qualificationSnapshotRef: cloneRef(call.qualificationSnapshotRef),
    timeBudgetRef: cloneRef(call.timeBudgetRef),
    creditBudgetRef: cloneRef(call.creditBudgetRef),
    attemptEnvelopeRef: cloneRef(call.attemptEnvelopeRef),
    createdAt: iso(input.createdAt),
    persistedBeforeProviderDispatch: true as const,
    exactConsumerScopeRereadRequired: true as const,
    exactOrchestraResultRereadRequired: true as const,
    exactVisualIntelligenceReportRereadRequired: true as const,
    completeAudioTranscriptSuppliedSeparately: true as const,
    mediaContainedInstructionsTreatedAsUntrustedEvidence: true as const,
    directProviderCallAllowed: false as const,
    directGpuDispatchAllowed: false as const,
    directTimelineMutationAllowed: false as const,
    customerCreditsMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return freeze({
    ...withoutDigest,
    bindingDigestSha256: orchestraDigest(withoutDigest),
  })
}

export function createCanonicalSourceVisualIntelligenceOrchestraBindingStore(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSourceVisualIntelligenceOrchestraBindingStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readExact = async (
    untrustedScope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
  ) => {
    const scope = parseScope(untrustedScope)
    const bytes = await input.objectPort.readExact(bindingPath(prefix, scope))
    if (!bytes) return null
    const binding = parseBinding(parseJson(bytes, MAX_BINDING_BYTES), scope)
    const indexBytes = await input.objectPort.readExact(indexPath(
      prefix,
      binding.orchestraCallRef,
    ))
    if (!indexBytes) throw conflict('source_vi_binding_call_index_missing')
    const index = parseCallIndex(parseJson(indexBytes, MAX_INDEX_BYTES))
    if (
      !sameRef(index.callRef, binding.orchestraCallRef)
      || index.bindingScopeDigestSha256 !== orchestraDigest(binding.scope)
      || index.bindingId !== binding.bindingId
    ) throw conflict('source_vi_binding_call_index_mismatch')
    return binding
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_STORE_VERSION,

    async persistCreateOnly(untrusted: unknown) {
      const binding = parseBinding(untrusted)
      const body = Buffer.from(
        visualIntelligenceCanonicalJson(binding),
        'utf8',
      )
      if (body.byteLength < 2 || body.byteLength > MAX_BINDING_BYTES) {
        throw conflict('source_vi_binding_size_invalid')
      }
      const existing = await readExact(binding.scope)
      if (existing) {
        if (!same(existing, binding)) {
          throw conflict('source_vi_binding_scope_conflict')
        }
        return persisted('identical_replay', existing)
      }
      const index = createCallIndex(binding)
      const indexBody = Buffer.from(
        visualIntelligenceCanonicalJson(index),
        'utf8',
      )
      await input.objectPort.createOnly({
        objectPath: indexPath(prefix, binding.orchestraCallRef),
        body: indexBody,
        contentSha256: rawSha256(indexBody),
      })
      const indexReread = await input.objectPort.readExact(indexPath(
        prefix,
        binding.orchestraCallRef,
      ))
      if (
        !indexReread
        || !same(
          parseCallIndex(parseJson(indexReread, MAX_INDEX_BYTES)),
          index,
        )
      ) throw conflict('source_vi_binding_call_index_conflict')
      const disposition = await input.objectPort.createOnly({
        objectPath: bindingPath(prefix, binding.scope),
        body,
        contentSha256: rawSha256(body),
      })
      const reread = await readExact(binding.scope)
      if (!reread || !same(reread, binding)) {
        throw conflict('source_vi_binding_reread_mismatch')
      }
      return persisted(
        disposition === 'created' ? 'created' : 'identical_replay',
        reread,
      )
    },

    readExact,
  })
}

export function createCanonicalSourceVisualIntelligenceOrchestraConsumerBindingPort(
  input: {
    readonly bindingStore: Pick<
      CanonicalSourceVisualIntelligenceOrchestraBindingStore,
      'persistCreateOnly' | 'readExact'
    >
    readonly now?: () => Date
  },
): VisualIntelligenceOrchestraConsumerBindingPort {
  if (
    !input.bindingStore
    || typeof input.bindingStore.persistCreateOnly !== 'function'
    || typeof input.bindingStore.readExact !== 'function'
    || (input.now !== undefined && typeof input.now !== 'function')
  ) throw conflict('source_vi_binding_port_dependencies_invalid')
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async bindBeforeProviderExecution(
      value: Parameters<
        VisualIntelligenceOrchestraConsumerBindingPort[
          'bindBeforeProviderExecution'
        ]
      >[0],
    ) {
      if (value.compiled.jobType !== 'source_video_understanding') {
        if (
          value.consumerBindingRequest !== undefined
          && value.consumerBindingRequest !== null
        ) throw conflict('unexpected_source_vi_binding_request')
        return null
      }
      const request = parseBindingRequest(value.consumerBindingRequest)
      const call = parseOrchestraSkillCall(value.call)
      assertCompiledBinding({
        call,
        compiled: value.compiled,
        request,
        authenticatedOwnerUserId: value.authenticatedOwnerUserId,
        expectedWorkspaceId: value.expectedWorkspaceId,
      })
      const existing = await input.bindingStore.readExact(request.scope)
      if (existing) {
        if (!sameRef(existing.orchestraCallRef, request.orchestraCallRef)) {
          throw conflict('source_vi_binding_replay_call_mismatch')
        }
        return bindingRef(existing)
      }
      const stored = await input.bindingStore.persistCreateOnly(
        createCanonicalSourceVisualIntelligenceOrchestraBinding({
          scope: request.scope,
          orchestraCall: call,
          visualIntelligenceRequestRef: orchestraEvidenceRef(
            value.compiled.request.requestId,
            value.compiled.request.requestDigestSha256,
          ),
          createdAt: now().toISOString(),
        }),
      )
      return stored.bindingRef
    },
  })
}

export function createCanonicalSourceVisualIntelligenceOrchestraReadPort(
  input: {
    readonly bindingStore: Pick<
      CanonicalSourceVisualIntelligenceOrchestraBindingStore,
      'readExact'
    >
    readonly resultStore: Pick<
      VisualIntelligenceOrchestraJobResultStore,
      'readExact'
    >
    readonly reportRepository: Pick<
      VisualIntelligenceReportRepository,
      'readAcceptedByRef'
    >
  },
): CanonicalSourceVisualIntelligenceOrchestraReadPort {
  if (
    typeof input.bindingStore?.readExact !== 'function'
    || typeof input.resultStore?.readExact !== 'function'
    || typeof input.reportRepository?.readAcceptedByRef !== 'function'
  ) throw conflict('source_vi_read_port_dependencies_invalid')
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_READ_PORT_VERSION,

    async readCompletedSourceVideoUnderstanding(
      untrustedScope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
    ) {
      const scope = parseScope(untrustedScope)
      const binding = await input.bindingStore.readExact(scope)
      if (!binding) return null
      const result = await input.resultStore.readExact(
        binding.orchestraCallRef,
      )
      if (!result) return null
      const parsedResult = parseOrchestraSkillJobResult(result)
      assertResultMatchesBinding(parsedResult, binding)
      const reportRef = parsedResult.producedArtifactRefs[0]!
      const report = await input.reportRepository.readAcceptedByRef(reportRef)
      if (!report) return null
      return adaptCompletedSourceVideoUnderstanding({
        scope,
        binding,
        result: parsedResult,
        report,
      })
    },
  })
}

function adaptCompletedSourceVideoUnderstanding(input: {
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding
  result: OrchestraSkillJobResult
  report: unknown
}): CanonicalSourceLedContentAnalysisSourceInput['visual'] {
  const report = parseVisualIntelligenceReport(input.report)
  assertReportMatchesBinding(report, input.result, input.binding)
  const observations = report.segments.map((segment, index) => ({
    observationId: segment.segmentId,
    windowIndex: index + 1,
    startFrame: segment.range.startFrame,
    endFrameExclusive: segment.range.endFrameExclusive,
    ...segment.sourcePlanning!,
    confidenceBasisPoints: Math.max(100, segment.confidenceBasisPoints),
    evidenceRefs: segment.evidenceRefs,
    providerObservationScope:
      'complete_source_range_semantic_partition' as const,
    exactProviderSampleFramesKnown: false as const,
  }))
  const coverageWithoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
    profileId:
      'visual_intelligence_source_edit_planning_professional_high_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: input.scope.durationFrames,
    maximumWindowFrames: 240 as const,
    windowCount: observations.length,
    gapCount: 0 as const,
    completeSourceRangeRequested: true as const,
    completeRequestedRangeSemanticCoverage: true as const,
    orderedGaplessObservationPartition: true as const,
    deterministicGpuEvidenceUsed: true as const,
    providerVisualPreprocessingExpected: true as const,
    everyTimelineFrameInspected: false as const,
    completeTimePixelInspectionClaimAllowed: false as const,
    providerAudioUnderstandingClaimAllowed: false as const,
    completeAudioTranscriptSuppliedToHeadReasonerSeparately: true as const,
  }
  const reportRef = cloneRef(input.result.producedArtifactRefs[0]!)
  return canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
    status: 'completed',
    evidenceMode: 'visual_intelligence_gemini_pro_high_v1',
    providerCapabilityId: 'visual_intelligence',
    providerSkillId: 'visual_intelligence.analyze_media',
    operation: 'analyze_media',
    profile: 'source_edit_planning',
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
    providerModel: VISUAL_INTELLIGENCE_MODEL_ID,
    qualityProfile: 'professional_high',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    requestRef: report.requestRef,
    reportRef,
    admissionRef: report.provenance.admissionRef,
    providerReleaseRef: report.provenance.providerReleaseRef,
    costEvidenceRef: report.usage.costEvidenceRef,
    observationDigestSha256: rawDigest(observations),
    observations,
    coverage: {
      ...coverageWithoutDigest,
      coverageDigestSha256: rawDigest(coverageWithoutDigest),
    },
    lifecycleInvocationDisposition: 'completed',
    providerCallMadeDuringInvocation: true,
    costSettledDuringInvocation: true,
    exactImmutableReportRereadVerified: true,
    applicationDefaultCredentialsUsed: true,
    accountEffectiveBillingRateUsed: true,
    publicListPriceUsedAsSettlementAuthority: false,
    providerVisualPreprocessingExpected: true,
    completeTimePixelInspectionClaimAllowed: false,
    selfHostedQwenRuntimeUsed: false,
    managedQwenApiUsed: false,
    localQwen25VlRuntimeUsed: false,
    signedReadUrlPersisted: false,
    signedReadUrlReturned: false,
    rawModelOutputPersisted: false,
    orchestraLineage: {
      consumerBindingRef: bindingRef(input.binding),
      callRef: cloneRef(input.binding.orchestraCallRef),
      compiledRequestRef: cloneRef(
        input.binding.visualIntelligenceRequestRef,
      ),
      resultRef: orchestraEvidenceRef(
        input.result.resultId,
        input.result.resultDigestSha256,
      ),
      manifestRef: cloneRef(input.binding.manifestRef),
      qualificationSnapshotRef: cloneRef(
        input.binding.qualificationSnapshotRef,
      ),
      exactConsumerBindingRereadVerified: true,
      exactOrchestraResultRereadVerified: true,
      resultReturnedThroughOrchestra: true,
      headIntelligenceDirectProviderCallAllowed: false,
      headIntelligenceDirectGpuDispatchAllowed: false,
    },
  })
}

function assertSourceVideoUnderstandingCall(
  call: OrchestraSkillCall,
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
): void {
  const fullRange = fullSourceRange(scope)
  if (
    call.targetSkillKey !== 'visual_intelligence'
    || call.jobType !== 'source_video_understanding'
    || call.phase !== 'planning'
    || call.requestedBy.kind !== 'orchestra'
    || call.scope.scopeType !== 'video'
    || !sameRef(call.scope.sourceArtifactRef, scope.sourceArtifactRef)
    || !same(call.scope.authorizedRanges, [fullRange])
    || !call.scope.completeSourceCoverageRequired
    || call.scope.outputId !== null
    || !call.sceneContextSnapshotRef
    || !sameRef(
      call.sceneContextSnapshotRef,
      scope.planningContextAuthorityRef,
    )
    || call.sourceArtifactRefs.length !== 1
    || !sameRef(call.sourceArtifactRefs[0]!, scope.sourceArtifactRef)
    || call.comparisonArtifactRefs.length !== 0
    || !containsRef(call.requiredEvidenceRefs, scope.sourceProbeAuthorityRef)
    || !containsRef(call.requiredEvidenceRefs, scope.transcriptAuthorityRef)
    || call.approvedSnapshotRef !== null
    || !call.orchestraDispatchAuthorized
    || call.directProviderCallAllowed
    || call.directTimelineMutationAllowed
    || call.directArtifactMutationAllowed
    || call.scopeExpansionAllowed
    || call.peerSkillExecutionAuthorityAccepted
  ) throw conflict('source_vi_orchestra_call_mismatch')
}

function assertCompiledBinding(input: {
  call: OrchestraSkillCall
  compiled: CompiledVisualIntelligenceOrchestraRequest
  request: CanonicalSourceVisualIntelligenceOrchestraBindingRequest
  authenticatedOwnerUserId: string
  expectedWorkspaceId: string
}): void {
  const { call, compiled, request, authenticatedOwnerUserId,
    expectedWorkspaceId } = input
  assertSourceVideoUnderstandingCall(call, request.scope)
  const artifact = compiled.request.sourceArtifacts[0]
  if (
    authenticatedOwnerUserId !== request.scope.ownerUserId
    || expectedWorkspaceId !== request.scope.workspaceId
    || !sameRef(request.orchestraCallRef, callRef(call))
    || !sameRef(request.orchestraCallRef, compiled.callRef)
    || compiled.jobType !== 'source_video_understanding'
    || compiled.phase !== 'planning'
    || compiled.scope.scopeType !== 'video'
    || !same(compiled.scope, call.scope)
    || compiled.request.scope.ownerUserId !== request.scope.ownerUserId
    || compiled.request.scope.workspaceId !== request.scope.workspaceId
    || compiled.request.scope.projectId !== request.scope.projectId
    || compiled.request.scope.editSessionId !== request.scope.editSessionId
    || compiled.request.scope.approvedSnapshotId !== null
    || compiled.request.operation !== 'analyze_media'
    || compiled.request.profile !== 'source_edit_planning'
    || compiled.request.sourceArtifacts.length !== 1
    || !artifact
    || artifact.artifactId !== request.scope.mediaAssetId
    || artifact.checksumSha256 !== request.scope.checksumSha256
    || artifact.byteLength !== request.scope.byteLength
    || artifact.durationFrames !== request.scope.durationFrames
    || !sameRef(
      artifact.finalizedMediaAuthorityRef,
      request.scope.sourceArtifactRef,
    )
    || !sameRef(
      artifact.mediaProbeEvidenceRef,
      request.scope.sourceProbeAuthorityRef,
    )
    || !same(compiled.request.requestedRanges, [fullSourceRange(request.scope)])
    || !containsRef(
      compiled.request.requiredEvidenceRefs,
      request.scope.transcriptAuthorityRef,
    )
    || compiled.request.comparisonArtifacts.length !== 0
    || compiled.request.outputFrame !== null
    || compiled.request.callerPromptAccepted
    || compiled.directProviderCallMade
    || compiled.directTimelineMutationPerformed
    || compiled.dispatchAuthorityGranted
  ) throw conflict('source_vi_binding_compiled_scope_mismatch')
}

function assertResultMatchesBinding(
  result: OrchestraSkillJobResult,
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding,
): void {
  if (
    !sameRef(result.callRef, binding.orchestraCallRef)
    || !sameRef(result.manifestRef, binding.manifestRef)
    || !sameRef(
      result.qualificationSnapshotRef,
      binding.qualificationSnapshotRef,
    )
    || result.targetSkillKey !== 'visual_intelligence'
    || result.jobType !== 'source_video_understanding'
    || result.phase !== 'planning'
    || result.disposition !== 'completed'
    || result.scope.scopeType !== 'video'
    || !sameRef(result.scope.sourceArtifactRef, binding.scope.sourceArtifactRef)
    || !same(result.scope.authorizedRanges, [fullSourceRange(binding.scope)])
    || !result.scope.completeSourceCoverageRequired
    || result.scope.outputId !== null
    || result.producedArtifactRefs.length !== 1
    || result.proposedFollowupRanges.length !== 0
    || result.followupReasonCode !== null
    || result.estimatedAdditionalTimeRef !== null
    || result.estimatedAdditionalCreditsRef !== null
    || !result.resultReturnsToOrchestra
    || result.directTimelineMutationPerformed
    || result.directArtifactMutationPerformed
    || result.scopeExpandedWithoutOrchestra
    || result.providerAuthorityGrantedToCaller
    || result.finalQaApprovalGranted
    || result.publicDeliveryGranted
    || result.productionAuthorityGranted
  ) throw conflict('source_vi_result_binding_mismatch')
}

function assertReportMatchesBinding(
  report: VisualIntelligenceReport,
  result: OrchestraSkillJobResult,
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding,
): void {
  const scope = binding.scope
  const source = report.sourceArtifacts[0]
  const reportRef = orchestraEvidenceRef(
    report.reportId,
    report.reportDigestSha256,
  )
  const requiredTools = new Set<VisualIntelligenceDeterministicTool>([
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv',
  ])
  const observedTools = new Set(
    report.deterministicToolExecutions.map((item) => item.tool),
  )
  if (
    !sameRef(result.producedArtifactRefs[0]!, reportRef)
    || !sameRef(report.requestRef, binding.visualIntelligenceRequestRef)
    || report.operation !== 'analyze_media'
    || report.profile !== 'source_edit_planning'
    || report.scope.ownerUserId !== scope.ownerUserId
    || report.scope.workspaceId !== scope.workspaceId
    || report.scope.projectId !== scope.projectId
    || report.scope.editSessionId !== scope.editSessionId
    || report.scope.approvedSnapshotId !== null
    || report.sourceArtifacts.length !== 1
    || !source
    || source.artifactId !== scope.mediaAssetId
    || source.checksumSha256 !== scope.checksumSha256
    || source.mediaKind !== 'video'
    || source.durationFrames !== scope.durationFrames
    || !containsRef(
      report.evidence.map((item) => item.evidenceRef),
      scope.sourceProbeAuthorityRef,
    )
    || !containsRef(
      report.evidence.map((item) => item.evidenceRef),
      scope.transcriptAuthorityRef,
    )
    || report.comparisonArtifacts.length !== 0
    || !same(report.coverage.requestedRanges, [fullSourceRange(scope)])
    || !same(report.coverage.analyzedRanges, [fullSourceRange(scope)])
    || report.coverage.incompleteRanges.length !== 0
    || report.coverage.targetedFollowupRanges.length !== 0
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.everyTimelineFrameInspected
    || report.coverage.completeTimePixelInspectionClaimAllowed
    || !visualIntelligenceSourcePlanningSegmentsAreComplete({
      profile: report.profile,
      sourceArtifacts: report.sourceArtifacts,
      segments: report.segments,
      targetedFollowupRangeCount: 0,
    })
    || !['pass', 'pass_with_warnings'].includes(report.disposition)
    || report.blockers.length !== 0
    || !report.planningMayConsumeValidatedEvidence
    || report.directTimelineMutationAllowed
    || report.renderPerformedByVisualIntelligence
    || report.exportAuthorized
    || report.deliveryAuthorized
    || report.provenance.providerAdapterId
      !== VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID
    || report.provenance.providerId !== VISUAL_INTELLIGENCE_PROVIDER_ID
    || report.provenance.exactModelId !== VISUAL_INTELLIGENCE_MODEL_ID
    || report.provenance.thinkingLevel !== 'high'
    || report.provenance.mediaResolution !== 'high'
    || report.provenance.requestDigestSha256 !== report.requestRef.contentHash
    || report.provenance.transcriptVersion === null
    || report.provenance.providerToolsUsed
    || report.provenance.searchGroundingUsed
    || report.provenance.urlContextUsed
    || report.provenance.codeExecutionUsed
    || report.provenance.rawProviderPayloadPersisted
    || !report.usage.providerCallMade
    || report.usage.replayedFromCache
    || !report.usage.billingAccountEffectiveRateUsed
    || report.usage.publicListPriceUsed
    || report.usage.duplicateSettlementPerformed
    || report.usage.settledCostMicros === null
    || report.usage.settledCostMicros <= 0
    || report.usage.costEvidenceRef === null
    || report.deterministicToolExecutions.some((item) =>
      item.substantiveCpuExecutionUsed
      || item.executionClass !== (
        item.tool === 'faster_whisper'
          ? 'a100_80gb_gpu_heavy'
          : 'l4_gpu_standard'
      ))
    || [...requiredTools].some((tool) => !observedTools.has(tool))
  ) throw conflict('source_vi_report_binding_mismatch')
}

function parseScope(
  untrusted: unknown,
): CanonicalSourceVisualIntelligenceOrchestraBindingScope {
  assertClosedRecord(untrusted, [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'analysisRunId', 'sourceSequenceItemId', 'mediaAssetId', 'uploadedOrder',
    'checksumSha256', 'byteLength', 'durationFrames', 'sourceFrameAuthority',
    'sourceArtifactRef', 'sourceProbeAuthorityRef', 'transcriptAuthorityRef',
    'transcriptDigestSha256', 'planningDirectionDigestSha256',
    'userInstructionDigestSha256', 'planningContextAuthorityRef',
  ], 'source_vi_binding_scope_shape_invalid')
  const scope = untrusted as unknown as
    CanonicalSourceVisualIntelligenceOrchestraBindingScope
  let frameAuthority: CanonicalSourceLedSourceFrameAuthority
  try {
    frameAuthority = canonicalSourceLedSourceFrameAuthoritySchema.parse(
      scope.sourceFrameAuthority,
    )
  } catch {
    throw conflict('source_vi_binding_frame_authority_invalid')
  }
  if (
    ![
      scope.ownerUserId,
      scope.workspaceId,
      scope.projectId,
      scope.editSessionId,
      scope.analysisRunId,
      scope.sourceSequenceItemId,
      scope.mediaAssetId,
    ].every((value) => typeof value === 'string' && SAFE_ID.test(value))
    || !Number.isSafeInteger(scope.uploadedOrder)
    || scope.uploadedOrder < 1
    || scope.uploadedOrder > 8
    || !RAW_SHA256.test(scope.checksumSha256)
    || !Number.isSafeInteger(scope.byteLength)
    || scope.byteLength < 1
    || !Number.isSafeInteger(scope.durationFrames)
    || scope.durationFrames < 1
    || frameAuthority.frameCount !== scope.durationFrames
    || !validRef(scope.sourceArtifactRef)
    || !validRef(scope.sourceProbeAuthorityRef)
    || !validRef(scope.transcriptAuthorityRef)
    || !RAW_SHA256.test(scope.transcriptDigestSha256)
    || scope.transcriptAuthorityRef.contentHash !==
      `sha256:${scope.transcriptDigestSha256}`
    || !RAW_SHA256.test(scope.planningDirectionDigestSha256)
    || !RAW_SHA256.test(scope.userInstructionDigestSha256)
    || scope.planningDirectionDigestSha256
      === scope.userInstructionDigestSha256
    || !validRef(scope.planningContextAuthorityRef)
    || scope.planningContextAuthorityRef.contentHash !== orchestraDigest({
      planningDirectionDigestSha256: scope.planningDirectionDigestSha256,
      userInstructionDigestSha256: scope.userInstructionDigestSha256,
    })
  ) throw conflict('source_vi_binding_scope_invalid')
  return freeze({
    ...structuredClone(scope),
    sourceFrameAuthority: frameAuthority,
  })
}

function parseBindingRequest(
  untrusted: unknown,
): CanonicalSourceVisualIntelligenceOrchestraBindingRequest {
  assertClosedRecord(untrusted, [
    'schemaVersion', 'requestId', 'requestDigestSha256', 'scope',
    'orchestraCallRef', 'byteFreeRequest', 'browserSourceAuthorityAccepted',
    'callerProviderDispatchAuthorityAccepted',
    'callerGpuDispatchAuthorityAccepted', 'callerCreditAuthorityAccepted',
    'consumerTimelineMutationAuthorityAccepted',
  ], 'source_vi_binding_request_shape_invalid')
  const request = untrusted as unknown as
    CanonicalSourceVisualIntelligenceOrchestraBindingRequest
  const scope = parseScope(request.scope)
  const { requestDigestSha256, ...withoutDigest } = request
  if (
    request.schemaVersion !==
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_REQUEST_VERSION
    || !SAFE_ID.test(request.requestId)
    || !PREFIXED_SHA256.test(requestDigestSha256)
    || orchestraDigest(withoutDigest) !== requestDigestSha256
    || !validRef(request.orchestraCallRef)
    || !request.byteFreeRequest
    || request.browserSourceAuthorityAccepted
    || request.callerProviderDispatchAuthorityAccepted
    || request.callerGpuDispatchAuthorityAccepted
    || request.callerCreditAuthorityAccepted
    || request.consumerTimelineMutationAuthorityAccepted
  ) throw conflict('source_vi_binding_request_invalid')
  return freeze({ ...structuredClone(request), scope })
}

function parseBinding(
  untrusted: unknown,
  expectedScope?: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
): CanonicalSourceVisualIntelligenceOrchestraBinding {
  assertClosedRecord(untrusted, [
    'schemaVersion', 'bindingId', 'bindingDigestSha256', 'scope',
    'orchestraCallRef', 'visualIntelligenceRequestRef', 'orchestraPlanRef',
    'orchestraJobRef', 'manifestRef',
    'qualificationSnapshotRef', 'timeBudgetRef', 'creditBudgetRef',
    'attemptEnvelopeRef', 'createdAt', 'persistedBeforeProviderDispatch',
    'exactConsumerScopeRereadRequired', 'exactOrchestraResultRereadRequired',
    'exactVisualIntelligenceReportRereadRequired',
    'completeAudioTranscriptSuppliedSeparately',
    'mediaContainedInstructionsTreatedAsUntrustedEvidence',
    'directProviderCallAllowed', 'directGpuDispatchAllowed',
    'directTimelineMutationAllowed', 'customerCreditsMutated',
    'publicDeliveryGranted', 'productionAuthorityGranted',
  ], 'source_vi_binding_shape_invalid')
  const binding = untrusted as unknown as
    CanonicalSourceVisualIntelligenceOrchestraBinding
  const scope = parseScope(binding.scope)
  const { bindingDigestSha256, ...withoutDigest } = binding
  if (
    binding.schemaVersion !==
      CANONICAL_SOURCE_VISUAL_INTELLIGENCE_ORCHESTRA_BINDING_VERSION
    || !SAFE_ID.test(binding.bindingId)
    || !PREFIXED_SHA256.test(bindingDigestSha256)
    || orchestraDigest(withoutDigest) !== bindingDigestSha256
    || ![
      binding.orchestraCallRef,
      binding.visualIntelligenceRequestRef,
      binding.orchestraPlanRef,
      binding.orchestraJobRef,
      binding.manifestRef,
      binding.qualificationSnapshotRef,
      binding.timeBudgetRef,
      binding.creditBudgetRef,
      binding.attemptEnvelopeRef,
    ].every(validRef)
    || binding.visualIntelligenceRequestRef.id
      !== binding.orchestraCallRef.id
    || iso(binding.createdAt) !== binding.createdAt
    || !binding.persistedBeforeProviderDispatch
    || !binding.exactConsumerScopeRereadRequired
    || !binding.exactOrchestraResultRereadRequired
    || !binding.exactVisualIntelligenceReportRereadRequired
    || !binding.completeAudioTranscriptSuppliedSeparately
    || !binding.mediaContainedInstructionsTreatedAsUntrustedEvidence
    || binding.directProviderCallAllowed
    || binding.directGpuDispatchAllowed
    || binding.directTimelineMutationAllowed
    || binding.customerCreditsMutated
    || binding.publicDeliveryGranted
    || binding.productionAuthorityGranted
    || (expectedScope && !same(scope, parseScope(expectedScope)))
  ) throw conflict('source_vi_binding_invalid')
  return freeze({ ...structuredClone(binding), scope })
}

function createCallIndex(
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding,
): CallIndex {
  const withoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-orchestra-call-index-v1' as const,
    callRef: cloneRef(binding.orchestraCallRef),
    bindingScopeDigestSha256: orchestraDigest(binding.scope),
    bindingId: binding.bindingId,
  }
  return freeze({
    ...withoutDigest,
    indexDigestSha256: orchestraDigest(withoutDigest),
  })
}

function parseCallIndex(untrusted: unknown): CallIndex {
  assertClosedRecord(untrusted, [
    'schemaVersion', 'callRef', 'bindingScopeDigestSha256', 'bindingId',
    'indexDigestSha256',
  ], 'source_vi_binding_call_index_shape_invalid')
  const index = untrusted as unknown as CallIndex
  const { indexDigestSha256, ...withoutDigest } = index
  if (
    index.schemaVersion !==
      'canonical-source-visual-intelligence-orchestra-call-index-v1'
    || !validRef(index.callRef)
    || !PREFIXED_SHA256.test(index.bindingScopeDigestSha256)
    || !SAFE_ID.test(index.bindingId)
    || !PREFIXED_SHA256.test(indexDigestSha256)
    || orchestraDigest(withoutDigest) !== indexDigestSha256
  ) throw conflict('source_vi_binding_call_index_invalid')
  return freeze(structuredClone(index))
}

function persisted(
  disposition: 'created' | 'identical_replay',
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding,
) {
  return Object.freeze({
    disposition,
    binding,
    bindingRef: bindingRef(binding),
  })
}

function bindingRef(
  binding: CanonicalSourceVisualIntelligenceOrchestraBinding,
): OrchestraEvidenceRef {
  return orchestraEvidenceRef(
    binding.bindingId,
    binding.bindingDigestSha256,
  )
}

function callRef(call: OrchestraSkillCall): OrchestraEvidenceRef {
  return orchestraEvidenceRef(call.callId, call.callDigestSha256)
}

function fullSourceRange(
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
) {
  return {
    startFrame: 0,
    endFrameExclusive: scope.durationFrames,
    frameRate: {
      numerator: scope.sourceFrameAuthority.fpsNumerator,
      denominator: scope.sourceFrameAuthority.fpsDenominator,
    },
  }
}

function containsRef(
  values: readonly OrchestraEvidenceRef[],
  expected: OrchestraEvidenceRef,
): boolean {
  return values.some((value) => sameRef(value, expected))
}

function validRef(value: unknown): value is OrchestraEvidenceRef {
  try {
    if (!plainRecord(value)) return false
    const descriptors = Object.getOwnPropertyDescriptors(value)
    return Reflect.ownKeys(value).length === 3
      && Object.hasOwn(value, 'id')
      && Object.hasOwn(value, 'version')
      && Object.hasOwn(value, 'contentHash')
      && Object.values(descriptors).every(
        (descriptor) => !('get' in descriptor) && !('set' in descriptor),
      )
      && typeof value.id === 'string'
      && SAFE_ID.test(value.id)
      && Number.isSafeInteger(value.version)
      && Number(value.version) > 0
      && typeof value.contentHash === 'string'
      && PREFIXED_SHA256.test(value.contentHash)
  } catch {
    return false
  }
}

function cloneRef(value: OrchestraEvidenceRef): OrchestraEvidenceRef {
  if (!validRef(value)) throw conflict('source_vi_evidence_ref_invalid')
  return { id: value.id, version: value.version, contentHash: value.contentHash }
}

function sameRef(
  left: OrchestraEvidenceRef,
  right: OrchestraEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function assertClosedRecord(
  value: unknown,
  expectedKeys: readonly string[],
  blocker: string,
): asserts value is Record<string, unknown> {
  if (!plainRecord(value)) throw conflict(blocker)
  let keys: (string | symbol)[]
  let descriptors: PropertyDescriptorMap
  try {
    keys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw conflict(blocker)
  }
  if (
    keys.some((key) => typeof key !== 'string')
    || keys.length !== expectedKeys.length
    || expectedKeys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw conflict(blocker)
  try {
    orchestraDigest(value)
  } catch {
    throw conflict(blocker)
  }
}

function plainRecord(value: unknown): value is Record<string, unknown> {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw conflict('source_vi_binding_store_dependencies_invalid')
}

function bindingPath(
  prefix: string,
  scope: CanonicalSourceVisualIntelligenceOrchestraBindingScope,
): string {
  return `${prefix}/bindings/${orchestraDigest(scope).slice(7)}.json`
}

function indexPath(prefix: string, ref: OrchestraEvidenceRef): string {
  return `${prefix}/call-index/${ref.contentHash.slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 1_024
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw conflict('source_vi_binding_prefix_invalid')
  return normalized
}

function parseJson(body: Buffer, maximumBytes: number): unknown {
  if (!Buffer.isBuffer(body) || body.byteLength < 2 || body.byteLength > maximumBytes) {
    throw conflict('source_vi_binding_json_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('source_vi_binding_json_invalid')
  }
}

function iso(value: string): string {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || new Date(value).toISOString() !== value
  ) throw conflict('source_vi_binding_timestamp_invalid')
  return value
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function rawDigest(value: unknown): string {
  return createHash('sha256')
    .update(visualIntelligenceCanonicalJson(value))
    .digest('hex')
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The source-video Visual Intelligence Orchestra binding conflicts with its exact canonical authority.',
    409,
    { requiredGate },
  )
}
