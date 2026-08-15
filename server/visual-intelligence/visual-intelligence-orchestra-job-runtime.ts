import type {
  OrchestraEvidenceRef,
  OrchestraFrameRange,
  OrchestraSkillJobResult,
} from '../../src/types/orchestra-skill-capability'
import { ApiError } from '../errors/api-error'
import {
  orchestraDigest,
  orchestraEvidenceRef,
} from '../orchestra/orchestra-skill-capability-contract'
import type {
  VisualIntelligenceLifecycleService,
} from './visual-intelligence-lifecycle-service'
import type {
  VisualIntelligenceOrchestraDispatchPackageStore,
} from './visual-intelligence-orchestra-dispatch-package-store'
import {
  createVisualIntelligenceOrchestraFollowupBlockedJobResult,
  createVisualIntelligenceOrchestraInvocationCompiler,
  createVisualIntelligenceOrchestraJobResult,
  type CompiledVisualIntelligenceOrchestraRequest,
} from './visual-intelligence-orchestra-invocation-compiler'
import type {
  VisualIntelligenceOrchestraJobResultStore,
} from './visual-intelligence-orchestra-job-result-store'

export const VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION =
  'visual-intelligence-orchestra-job-runtime-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_FOLLOWUP_ESTIMATE_VERSION =
  'visual-intelligence-orchestra-followup-estimate-v1' as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST = /^sha256:[a-f0-9]{64}$/u

export interface VisualIntelligenceOrchestraFollowupEstimate {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_FOLLOWUP_ESTIMATE_VERSION
  readonly callRef: OrchestraEvidenceRef
  readonly reportRef: OrchestraEvidenceRef
  readonly proposedRangesDigestSha256: string
  readonly timeRef: OrchestraEvidenceRef
  readonly creditRef: OrchestraEvidenceRef
  readonly exactOrchestraBudgetAuthorityReread: true
  readonly newOrchestraCallRequired: true
  readonly currentCallScopeExpansionAuthorized: false
  readonly providerOrBillingAuthorityGranted: false
}

export interface VisualIntelligenceOrchestraFollowupEstimatePort {
  estimateExact(input: {
    readonly compiled: CompiledVisualIntelligenceOrchestraRequest
    readonly reportRef: OrchestraEvidenceRef
    readonly proposedFollowupRanges: readonly OrchestraFrameRange[]
  }): Promise<unknown>
}

export interface VisualIntelligenceOrchestraJobRuntimeOutcome {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION
  readonly status: 'completed' | 'cache_replay'
  readonly result: OrchestraSkillJobResult
  readonly resultRef: OrchestraEvidenceRef
  readonly dispatchPackageRef: OrchestraEvidenceRef
  readonly canonicalRequestPackageRef: OrchestraEvidenceRef
  readonly consumerBindingRef: OrchestraEvidenceRef | null
  readonly providerCallMadeDuringInvocation: boolean
  readonly costSettledDuringInvocation: boolean
  readonly duplicateProviderCallAvoided: boolean
  readonly duplicateCostSettlementAvoided: boolean
  readonly resultReturnsToOrchestra: true
  readonly directTimelineOrArtifactMutationPerformed: false
  readonly finalQaApprovalGranted: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

export interface VisualIntelligenceOrchestraConsumerBindingPort {
  bindBeforeProviderExecution(input: {
    readonly call: unknown
    readonly compiled: CompiledVisualIntelligenceOrchestraRequest
    readonly consumerBindingRequest: unknown
    readonly authenticatedOwnerUserId: string
    readonly expectedWorkspaceId: string
  }): Promise<OrchestraEvidenceRef | null>
}

export interface VisualIntelligenceOrchestraJobRuntime {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION
  execute(input: {
    readonly call: unknown
    readonly supportRequest?: unknown
    readonly authenticatedOwnerUserId: string
    readonly expectedWorkspaceId: string
    readonly consumerBindingRequest?: unknown
  }): Promise<VisualIntelligenceOrchestraJobRuntimeOutcome>
}

export function createVisualIntelligenceOrchestraJobRuntime(input: {
  readonly dispatchPackageStore:
    VisualIntelligenceOrchestraDispatchPackageStore
  readonly lifecycle: VisualIntelligenceLifecycleService
  readonly resultStore: VisualIntelligenceOrchestraJobResultStore
  readonly consumerBindingPort:
    VisualIntelligenceOrchestraConsumerBindingPort
  readonly followupEstimatePort?:
    VisualIntelligenceOrchestraFollowupEstimatePort
}): VisualIntelligenceOrchestraJobRuntime {
  assertDependencies(input)
  const compiler = createVisualIntelligenceOrchestraInvocationCompiler({
    authorityRegistryPort: input.dispatchPackageStore,
    compilationPort: input.dispatchPackageStore,
  })

  return Object.freeze({
    schemaVersion: VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,

    async execute(untrusted: {
      readonly call: unknown
      readonly supportRequest?: unknown
      readonly authenticatedOwnerUserId: string
      readonly expectedWorkspaceId: string
      readonly consumerBindingRequest?: unknown
    }) {
      const authenticatedOwnerUserId = safeId(
        untrusted.authenticatedOwnerUserId,
      )
      const expectedWorkspaceId = safeId(untrusted.expectedWorkspaceId)
      const compiled = await compiler.compile({
        call: untrusted.call,
        ...(Object.hasOwn(untrusted, 'supportRequest')
          ? { supportRequest: untrusted.supportRequest }
          : {}),
      })
      if (
        compiled.request.scope.ownerUserId !== authenticatedOwnerUserId
        || compiled.request.scope.workspaceId !== expectedWorkspaceId
      ) throw new ApiError(
        'WORKSPACE_ACCESS_DENIED',
        'The Orchestra Visual Intelligence job is outside the authenticated owner scope.',
        403,
      )
      const materialized = await input.dispatchPackageStore
        .materializeCanonicalRequestPackage(compiled)
      const consumerBindingRef = await input.consumerBindingPort
        .bindBeforeProviderExecution({
          call: untrusted.call,
          compiled,
          consumerBindingRequest: untrusted.consumerBindingRequest,
          authenticatedOwnerUserId,
          expectedWorkspaceId,
        })
      const existing = await input.resultStore.readExact(compiled.callRef)
      if (existing) {
        assertResultMatchesCompiled(existing, compiled)
        return outcome({
          status: 'cache_replay',
          result: existing,
          resultRef: resultRef(existing),
          dispatchPackageRef: materialized.dispatchPackageRef,
          canonicalRequestPackageRef:
            materialized.canonicalRequestPackageRef,
          consumerBindingRef,
          providerCallMadeDuringInvocation: false,
          costSettledDuringInvocation: false,
          duplicateProviderCallAvoided: true,
          duplicateCostSettlementAvoided: true,
        })
      }

      const execution = await input.lifecycle.execute(compiled.request)
      const followupEstimate = await resolveFollowupEstimate({
        port: input.followupEstimatePort,
        compiled,
        report: execution.report,
      })
      const result = execution.report.coverage.targetedFollowupRanges.length > 0
        && followupEstimate === null
        ? createVisualIntelligenceOrchestraFollowupBlockedJobResult({
            compiled,
            report: execution.report,
          })
        : createVisualIntelligenceOrchestraJobResult({
            compiled,
            report: execution.report,
            followupEstimate,
          })
      const persisted = await input.resultStore.persistCreateOnly(result)
      assertResultMatchesCompiled(persisted.result, compiled)
      return outcome({
        status: execution.status,
        result: persisted.result,
        resultRef: persisted.resultRef,
        dispatchPackageRef: materialized.dispatchPackageRef,
        canonicalRequestPackageRef:
          materialized.canonicalRequestPackageRef,
        consumerBindingRef,
        providerCallMadeDuringInvocation:
          execution.providerCallMadeDuringInvocation,
        costSettledDuringInvocation:
          execution.costSettledDuringInvocation,
        duplicateProviderCallAvoided:
          execution.duplicateProviderCallAvoided,
        duplicateCostSettlementAvoided:
          execution.duplicateCostSettlementAvoided,
      })
    },
  })
}

async function resolveFollowupEstimate(input: {
  port?: VisualIntelligenceOrchestraFollowupEstimatePort
  compiled: CompiledVisualIntelligenceOrchestraRequest
  report: Awaited<ReturnType<VisualIntelligenceLifecycleService['execute']>>[
    'report'
  ]
}): Promise<{
  readonly timeRef: OrchestraEvidenceRef
  readonly creditRef: OrchestraEvidenceRef
} | null> {
  const ranges = input.report.coverage.targetedFollowupRanges
  if (ranges.length === 0 || input.report.disposition === 'blocked') return null
  if (!input.port) return null
  const reportReference = orchestraEvidenceRef(
    input.report.reportId,
    input.report.reportDigestSha256,
  )
  try {
    const untrusted = await input.port.estimateExact({
      compiled: input.compiled,
      reportRef: reportReference,
      proposedFollowupRanges: ranges,
    })
    const estimate = parseFollowupEstimate(untrusted)
    if (
      !sameRef(estimate.callRef, input.compiled.callRef)
      || !sameRef(estimate.reportRef, reportReference)
      || estimate.proposedRangesDigestSha256 !== orchestraDigest(ranges)
    ) return null
    return Object.freeze({
      timeRef: estimate.timeRef,
      creditRef: estimate.creditRef,
    })
  } catch {
    return null
  }
}

function parseFollowupEstimate(
  value: unknown,
): VisualIntelligenceOrchestraFollowupEstimate {
  const record = exactRecord(value, [
    'schemaVersion',
    'callRef',
    'reportRef',
    'proposedRangesDigestSha256',
    'timeRef',
    'creditRef',
    'exactOrchestraBudgetAuthorityReread',
    'newOrchestraCallRequired',
    'currentCallScopeExpansionAuthorized',
    'providerOrBillingAuthorityGranted',
  ])
  if (
    record.schemaVersion !==
      VISUAL_INTELLIGENCE_ORCHESTRA_FOLLOWUP_ESTIMATE_VERSION
    || typeof record.proposedRangesDigestSha256 !== 'string'
    || !DIGEST.test(record.proposedRangesDigestSha256)
    || record.exactOrchestraBudgetAuthorityReread !== true
    || record.newOrchestraCallRequired !== true
    || record.currentCallScopeExpansionAuthorized !== false
    || record.providerOrBillingAuthorityGranted !== false
  ) throw new TypeError(
    'Visual Intelligence Orchestra follow-up estimate is invalid.',
  )
  return Object.freeze({
    schemaVersion:
      VISUAL_INTELLIGENCE_ORCHESTRA_FOLLOWUP_ESTIMATE_VERSION,
    callRef: requireRef(record.callRef),
    reportRef: requireRef(record.reportRef),
    proposedRangesDigestSha256: record.proposedRangesDigestSha256,
    timeRef: requireRef(record.timeRef),
    creditRef: requireRef(record.creditRef),
    exactOrchestraBudgetAuthorityReread: true,
    newOrchestraCallRequired: true,
    currentCallScopeExpansionAuthorized: false,
    providerOrBillingAuthorityGranted: false,
  })
}

function assertResultMatchesCompiled(
  result: OrchestraSkillJobResult,
  compiled: CompiledVisualIntelligenceOrchestraRequest,
): void {
  if (
    !sameRef(result.callRef, compiled.callRef)
    || !sameRef(result.manifestRef, compiled.manifestRef)
    || !sameRef(
      result.qualificationSnapshotRef,
      compiled.qualificationSnapshotRef,
    )
    || result.targetSkillKey !== 'visual_intelligence'
    || result.jobType !== compiled.jobType
    || result.phase !== compiled.phase
    || orchestraDigest(result.scope) !== orchestraDigest(compiled.scope)
    || !result.resultReturnsToOrchestra
    || result.directTimelineMutationPerformed
    || result.directArtifactMutationPerformed
    || result.scopeExpandedWithoutOrchestra
    || result.providerAuthorityGrantedToCaller
    || result.finalQaApprovalGranted
    || result.publicDeliveryGranted
    || result.productionAuthorityGranted
  ) throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The immutable Orchestra Visual Intelligence result no longer matches its compiled call.',
    409,
  )
}

function outcome(input: Omit<
  VisualIntelligenceOrchestraJobRuntimeOutcome,
  | 'schemaVersion'
  | 'resultReturnsToOrchestra'
  | 'directTimelineOrArtifactMutationPerformed'
  | 'finalQaApprovalGranted'
  | 'publicDeliveryGranted'
  | 'productionAuthorityGranted'
>): VisualIntelligenceOrchestraJobRuntimeOutcome {
  return Object.freeze({
    schemaVersion: VISUAL_INTELLIGENCE_ORCHESTRA_JOB_RUNTIME_VERSION,
    ...input,
    resultReturnsToOrchestra: true,
    directTimelineOrArtifactMutationPerformed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected a closed plain record.')
  }
  const prototype = Object.getPrototypeOf(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const actualKeys = Reflect.ownKeys(value)
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw new TypeError('Expected a closed plain record.')
  return value as Record<string, unknown>
}

function requireRef(value: unknown): OrchestraEvidenceRef {
  const record = exactRecord(value, ['id', 'version', 'contentHash'])
  if (
    typeof record.id !== 'string'
    || !SAFE_ID.test(record.id)
    || record.id.includes('..')
    || !Number.isSafeInteger(record.version)
    || Number(record.version) < 1
    || typeof record.contentHash !== 'string'
    || !DIGEST.test(record.contentHash)
  ) throw new TypeError('Orchestra evidence reference is invalid.')
  return orchestraEvidenceRef(
    record.id,
    record.contentHash,
    Number(record.version),
  )
}

function resultRef(result: OrchestraSkillJobResult): OrchestraEvidenceRef {
  return orchestraEvidenceRef(result.resultId, result.resultDigestSha256)
}

function sameRef(
  left: OrchestraEvidenceRef,
  right: OrchestraEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function safeId(value: unknown): string {
  if (
    typeof value !== 'string'
    || !SAFE_ID.test(value)
    || value.includes('..')
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'The authenticated Orchestra Visual Intelligence scope is invalid.',
    400,
  )
  return value
}

function assertDependencies(input: {
  dispatchPackageStore: VisualIntelligenceOrchestraDispatchPackageStore
  lifecycle: VisualIntelligenceLifecycleService
  resultStore: VisualIntelligenceOrchestraJobResultStore
  consumerBindingPort: VisualIntelligenceOrchestraConsumerBindingPort
  followupEstimatePort?: VisualIntelligenceOrchestraFollowupEstimatePort
}): void {
  if (
    typeof input.dispatchPackageStore?.readExact !== 'function'
    || typeof input.dispatchPackageStore?.prepareExact !== 'function'
    || typeof input.dispatchPackageStore
      ?.materializeCanonicalRequestPackage !== 'function'
    || typeof input.lifecycle?.execute !== 'function'
    || typeof input.resultStore?.readExact !== 'function'
    || typeof input.resultStore?.persistCreateOnly !== 'function'
    || typeof input.consumerBindingPort?.bindBeforeProviderExecution
      !== 'function'
    || (input.followupEstimatePort !== undefined
      && typeof input.followupEstimatePort.estimateExact !== 'function')
  ) throw new TypeError(
    'Visual Intelligence Orchestra job runtime dependencies are invalid.',
  )
}
