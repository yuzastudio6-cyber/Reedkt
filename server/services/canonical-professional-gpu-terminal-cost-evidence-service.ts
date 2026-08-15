import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalProfessionalToolGpuAttemptCostReceipt,
  assertCanonicalProfessionalToolGpuCostEstimate,
  canonicalProfessionalToolGpuCostEstimateSchema,
  canonicalProfessionalToolGpuUsageSchema,
  createCanonicalProfessionalToolGpuAttemptCostReceipt,
  type CanonicalProfessionalToolGpuAttemptCostReceipt,
  type CanonicalProfessionalToolGpuCostEstimate,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  assertCanonicalProfessionalGpuExecutionEnvelope,
  assertCanonicalProfessionalGpuJobLaunch,
  canonicalProfessionalGpuExecutionEnvelopeSchema,
  type CanonicalProfessionalGpuExecutionEnvelope,
  type CanonicalProfessionalGpuJobLaunch,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_EVIDENCE_VERSION,
  canonicalProfessionalGpuTerminalCostEvidenceSchema,
  type CanonicalProfessionalGpuTerminalCostEvidenceReadPort,
} from './canonical-professional-google-cloud-gpu-terminal-observation-port'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_CONTEXT_VERSION =
  'canonical-professional-gpu-terminal-cost-context-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLATFORM_USAGE_EVIDENCE_VERSION =
  'canonical-professional-gpu-platform-usage-evidence-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const priorPrimaryFailureClassSchema = z.enum([
  'not_applicable',
  'a100_capacity_unavailable_before_attempt_start',
  'a100_job_boot_failed_before_private_media_read',
  'a100_runtime_qualification_blocked_before_dispatch',
  'a100_driver_or_cuda_incompatible_before_model_load',
])

const contextWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_CONTEXT_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_terminal_cost_context_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchRef: evidenceRefSchema,
  admission: canonicalProfessionalToolGpuDispatchAdmissionSchema,
  runtimeRelease: canonicalProfessionalToolGpuRuntimeReleaseSchema,
  executionEnvelope: canonicalProfessionalGpuExecutionEnvelopeSchema,
  estimate: canonicalProfessionalToolGpuCostEstimateSchema,
  approvedCurrentAccountRateAuthorityRef: evidenceRefSchema,
  attemptCostReceiptId: safeId,
  priorPrimaryFailureReceiptRef: evidenceRefSchema.nullable(),
  priorPrimaryFailureClass: priorPrimaryFailureClassSchema,
  exactApprovalEstimateReservationAdmissionEnvelopeAndLaunchReread:
    z.literal(true),
  callerEstimateRateUsageOutcomeOrCostAccepted: z.literal(false),
  walletOrLedgerMutationAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuTerminalCostContextSchema =
  contextWithoutHashSchema.extend({ contextHash: sha256 }).strict()
export type CanonicalProfessionalGpuTerminalCostContext = z.infer<
  typeof canonicalProfessionalGpuTerminalCostContextSchema
>

const usageEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLATFORM_USAGE_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_cloud_gpu_platform_usage_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  cloudProviderTerminalRef: evidenceRefSchema,
  cloudCapacityTeardownObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  platformUsageRereadRef: evidenceRefSchema,
  routeId: routeIdSchema,
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  actualUsage: canonicalProfessionalToolGpuUsageSchema,
  exactWorkerAndPlatformUsageReread: z.literal(true),
  providerCapacityOrExecutionRunningCountReread: z.literal(true),
  activeGpuResourcesAfterObservation: z.literal(0),
  workerSuppliedPricingAccepted: z.literal(false),
  callerUsageOutcomeOrCapacityClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPlatformUsageEvidenceSchema =
  usageEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlatformUsageEvidence = z.infer<
  typeof canonicalProfessionalGpuPlatformUsageEvidenceSchema
>

export interface CanonicalProfessionalGpuTerminalCostContextReadPort {
  rereadPrivateTerminalCostContext(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuPlatformUsageEvidenceReadPort {
  rereadPlatformUsageAndCapacity(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
    readonly cloudProviderTerminalRef: z.infer<typeof evidenceRefSchema>
    readonly terminalOutcome: 'completed' | 'failed' | 'canceled'
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuApprovedRateAuthorityReadPort {
  rereadApprovedCurrentAccountRateAuthority(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
    readonly rateAuthorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuAttemptCostReceiptStore {
  createAttemptCostReceiptOnly(input: {
    readonly receipt: CanonicalProfessionalToolGpuAttemptCostReceipt
  }): Promise<'created' | 'already_exists'>
  rereadAttemptCostReceipt(input: {
    readonly receiptId: string
  }): Promise<unknown>
}

export function createCanonicalProfessionalGpuTerminalCostEvidenceReadPort(
  input: {
    readonly contextReadPort:
      CanonicalProfessionalGpuTerminalCostContextReadPort
    readonly usageReadPort:
      CanonicalProfessionalGpuPlatformUsageEvidenceReadPort
    readonly rateReadPort:
      CanonicalProfessionalGpuApprovedRateAuthorityReadPort
    readonly receiptStore: CanonicalProfessionalGpuAttemptCostReceiptStore
    readonly now?: () => string
  },
): CanonicalProfessionalGpuTerminalCostEvidenceReadPort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadUsagePriceAndCostEvidence({
      launch: untrustedLaunch,
      cloudProviderTerminalRef: untrustedCloudProviderTerminalRef,
      terminalOutcome: untrustedTerminalOutcome,
    }: {
      readonly launch: CanonicalProfessionalGpuJobLaunch
      readonly cloudProviderTerminalRef:
        z.infer<typeof evidenceRefSchema>
      readonly terminalOutcome: 'completed' | 'failed' | 'canceled'
    }) {
      const launch = assertCanonicalProfessionalGpuJobLaunch(untrustedLaunch)
      const cloudProviderTerminalRef = evidenceRefSchema.parse(
        untrustedCloudProviderTerminalRef,
      )
      const terminalOutcome = z.enum([
        'completed',
        'failed',
        'canceled',
      ]).parse(untrustedTerminalOutcome)
      if (
        launch.launchDisposition !== 'job_created'
        || launch.cloudJobExecutionRef === null
      ) throw new Error('GPU terminal cost requires a created cloud job.')

      const context = assertTerminalCostContext(
        await input.contextReadPort.rereadPrivateTerminalCostContext({
          launch,
        }),
      )
      assertContextMatchesLaunch({ context, launch })

      const usage = assertPlatformUsageEvidence(
        await input.usageReadPort.rereadPlatformUsageAndCapacity({
          launch,
          cloudProviderTerminalRef,
          terminalOutcome,
        }),
      )
      assertUsageMatches({
        usage,
        launch,
        context,
        cloudProviderTerminalRef,
      })

      const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        await input.rateReadPort.rereadApprovedCurrentAccountRateAuthority({
          launch,
          rateAuthorityRef:
            context.approvedCurrentAccountRateAuthorityRef,
        }),
        launch.launchedAt,
      )
      if (
        !sameRef(
          ref(rate.rateAuthorityId, rate.rateAuthorityHash,
            rate.rateAuthorityVersion),
          context.approvedCurrentAccountRateAuthorityRef,
        )
        || rate.routeId !== launch.routeId
        || rate.region !== launch.runtimeRegion
      ) throw new Error('GPU terminal rate differs from the approved launch.')

      const observedAt = timestamp.parse(now())
      if (Date.parse(observedAt) < Date.parse(usage.observedAt)) {
        throw new Error('GPU terminal cost evidence time is stale.')
      }

      const receipt = createCanonicalProfessionalToolGpuAttemptCostReceipt({
        receiptId: context.attemptCostReceiptId,
        estimate: context.estimate,
        approvedSnapshotRef: context.admission.scope.approvedSnapshotRef,
        approvalRecordRef: context.admission.scope.userApprovalRecordRef,
        fundedReservationRef: context.admission.scope.fundedReservationRef,
        executionAttemptId:
          context.admission.scope.executionAttemptRef.id,
        routeId: launch.routeId,
        rateAuthority: rate,
        workerUsageEvidenceRef: usage.workerUsageEvidenceRef,
        platformUsageRereadRef: usage.platformUsageRereadRef,
        priorPrimaryFailureReceiptRef:
          context.priorPrimaryFailureReceiptRef ?? undefined,
        priorPrimaryFailureClass: context.priorPrimaryFailureClass,
        providerOrModelInferenceOutcome:
          usage.providerInferenceOrSubstantiveWorkOutcome,
        actualUsage: usage.actualUsage,
        terminalOutcome: costTerminalOutcome({
          terminalOutcome,
          substantiveWorkOutcome:
            usage.providerInferenceOrSubstantiveWorkOutcome,
        }),
        attemptStartedAt: launch.launchedAt,
        recordedAt: usage.observedAt,
      })
      await persistAndRereadReceipt({
        receipt,
        store: input.receiptStore,
      })
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_EVIDENCE_VERSION,
        source:
          'canonical_server_professional_gpu_usage_price_and_cost_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        cloudProviderTerminalRef,
        cloudCapacityTeardownObservationRef:
          usage.cloudCapacityTeardownObservationRef,
        workerUsageEvidenceRef: usage.workerUsageEvidenceRef,
        currentAccountPriceAuthorityRef:
          context.approvedCurrentAccountRateAuthorityRef,
        attemptCostReceiptRef:
          ref(receipt.receiptId, receipt.receiptHash),
        providerInferenceOrSubstantiveWorkOutcome:
          usage.providerInferenceOrSubstantiveWorkOutcome,
        exactPlatformUsageReread: true as const,
        exactCurrentAccountPriceReread: true as const,
        attemptCostReceiptPersistedBeforeSettlement: true as const,
        providerCapacityOrExecutionRunningCountReread: true as const,
        activeGpuResourcesAfterObservation: 0 as const,
        systemFailureOrUnknownCostChargedToCustomer: false as const,
        unapprovedOverageChargedToCustomer: false as const,
        customerWalletOrLedgerMutated: false as const,
        callerOrPlanCostClaimAccepted: false as const,
        observedAt,
      }
      return canonicalProfessionalGpuTerminalCostEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertTerminalCostContext(
  value: unknown,
): CanonicalProfessionalGpuTerminalCostContext {
  assertPlainSerializedData(value, 'gpu_terminal_cost_context')
  const context = canonicalProfessionalGpuTerminalCostContextSchema
    .parse(value)
  const { contextHash, ...payload } = context
  if (contextHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU terminal cost context hash is invalid.')
  }
  assertCanonicalProfessionalToolGpuDispatchAdmission(context.admission)
  assertCanonicalProfessionalToolGpuRuntimeRelease(context.runtimeRelease)
  assertCanonicalProfessionalGpuExecutionEnvelope(context.executionEnvelope)
  assertCanonicalProfessionalToolGpuCostEstimate(context.estimate)
  return context
}

export function assertPlatformUsageEvidence(
  value: unknown,
): CanonicalProfessionalGpuPlatformUsageEvidence {
  assertPlainSerializedData(value, 'gpu_platform_usage_evidence')
  const usage = canonicalProfessionalGpuPlatformUsageEvidenceSchema
    .parse(value)
  const { evidenceHash, ...payload } = usage
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU platform usage evidence hash is invalid.')
  }
  return usage
}

async function persistAndRereadReceipt(input: {
  receipt: CanonicalProfessionalToolGpuAttemptCostReceipt
  store: CanonicalProfessionalGpuAttemptCostReceiptStore
}): Promise<void> {
  await input.store.createAttemptCostReceiptOnly({ receipt: input.receipt })
  const reread = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
    await input.store.rereadAttemptCostReceipt({
      receiptId: input.receipt.receiptId,
    }),
  )
  if (reread.receiptHash !== input.receipt.receiptHash) {
    throw new Error('GPU attempt cost receipt create-only reread differs.')
  }
}

function assertContextMatchesLaunch(input: {
  context: CanonicalProfessionalGpuTerminalCostContext
  launch: CanonicalProfessionalGpuJobLaunch
}): void {
  const { context, launch } = input
  const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    context.admission,
  )
  const runtimeRelease = assertCanonicalProfessionalToolGpuRuntimeRelease(
    context.runtimeRelease,
    launch.launchedAt,
  )
  const envelope = assertCanonicalProfessionalGpuExecutionEnvelope(
    context.executionEnvelope,
  )
  const estimate = assertCanonicalProfessionalToolGpuCostEstimate(
    context.estimate,
  )
  const approvedRoute = launch.routeId === 'l4_heavy_fallback'
    ? estimate.fallback
    : estimate.primary
  const fallback = launch.routeId === 'l4_heavy_fallback'
  const exactFailureLineage = fallback
    ? context.priorPrimaryFailureReceiptRef !== null
      && context.priorPrimaryFailureClass !== 'not_applicable'
      && admission.priorPrimaryTerminalReceiptRef !== null
      && sameRef(
        context.priorPrimaryFailureReceiptRef,
        admission.priorPrimaryTerminalReceiptRef,
      )
      && context.priorPrimaryFailureClass ===
        admission.priorPrimaryFailureClass
    : context.priorPrimaryFailureReceiptRef === null
      && context.priorPrimaryFailureClass === 'not_applicable'
      && admission.priorPrimaryTerminalReceiptRef === null
  if (
    !sameRef(context.launchRef, ref(
      launch.launchRecordId,
      launch.launchHash,
    ))
    || !sameRef(launch.admissionRef, ref(
      admission.admissionId,
      admission.admissionHash,
    ))
    || !sameRef(launch.executionEnvelopeRef, ref(
      envelope.envelopeId,
      envelope.envelopeHash,
    ))
    || !sameRef(admission.estimateRef, ref(
      estimate.estimateId,
      estimate.estimateHash,
    ))
    || !sameRef(envelope.admissionRef, launch.admissionRef)
    || !sameRef(admission.runtimeReleaseRef, ref(
      runtimeRelease.releaseId,
      runtimeRelease.releaseHash,
      runtimeRelease.releaseVersion,
    ))
    || !sameRef(envelope.runtimeReleaseRef, launch.runtimeReleaseRef)
    || !sameRef(
      envelope.approvedSnapshotRef,
      admission.scope.approvedSnapshotRef,
    )
    || !sameRef(
      envelope.approvedWorkItemRef,
      admission.scope.approvedWorkItemRef,
    )
    || !sameRef(
      envelope.fundedReservationRef,
      admission.scope.fundedReservationRef,
    )
    || !sameRef(
      envelope.executionAttemptRef,
      admission.scope.executionAttemptRef,
    )
    || launch.toolId !== admission.toolId
    || launch.operationId !== admission.operationId
    || launch.routeId !== admission.routeId
    || launch.toolId !== estimate.scope.toolId
    || launch.operationId !== estimate.scope.operationId
    || estimate.scope.ownerUserId !== admission.scope.ownerUserId
    || estimate.scope.workspaceId !== admission.scope.workspaceId
    || estimate.scope.projectId !== admission.scope.projectId
    || estimate.scope.editSessionId !== admission.scope.editSessionId
    || estimate.scope.editPlanId !== admission.scope.editPlanId
    || estimate.scope.editPlanVersion !== admission.scope.editPlanVersion
    || !sameRef(
      estimate.scope.plannedWorkItemRef,
      admission.scope.approvedWorkItemRef,
    )
    || !sameRef(
      estimate.scope.exactToolOrModelReleaseRef,
      runtimeRelease.toolOrModelArtifactReleaseRef,
    )
    || runtimeRelease.toolId !== launch.toolId
    || runtimeRelease.operationId !== launch.operationId
    || runtimeRelease.routeId !== launch.routeId
    || approvedRoute?.routeId !== launch.routeId
    || !approvedRoute
    || !sameRef(
      approvedRoute.rateAuthorityRef,
      context.approvedCurrentAccountRateAuthorityRef,
    )
    || !sameRef(
      admission.currentRateAuthorityRef,
      context.approvedCurrentAccountRateAuthorityRef,
    )
    || !exactFailureLineage
    || Date.parse(context.preparedAt) > Date.parse(launch.launchedAt)
  ) throw new Error('GPU terminal cost context differs from the launch.')
}

function assertUsageMatches(input: {
  usage: CanonicalProfessionalGpuPlatformUsageEvidence
  launch: CanonicalProfessionalGpuJobLaunch
  context: CanonicalProfessionalGpuTerminalCostContext
  cloudProviderTerminalRef: z.infer<typeof evidenceRefSchema>
}): void {
  const elapsed = Date.parse(input.usage.observedAt)
    - Date.parse(input.launch.launchedAt)
  if (
    !sameRef(input.usage.launchRef, ref(
      input.launch.launchRecordId,
      input.launch.launchHash,
    ))
    || !sameRef(input.usage.admissionRef, input.launch.admissionRef)
    || !sameRef(
      input.usage.executionEnvelopeRef,
      input.launch.executionEnvelopeRef,
    )
    || !sameRef(
      input.usage.cloudProviderTerminalRef,
      input.cloudProviderTerminalRef,
    )
    || sameRef(
      input.usage.cloudCapacityTeardownObservationRef,
      input.cloudProviderTerminalRef,
    )
    || sameRef(
      input.usage.workerUsageEvidenceRef,
      input.usage.platformUsageRereadRef,
    )
    || input.usage.routeId !== input.launch.routeId
    || input.usage.actualUsage.totalBillableMilliseconds > elapsed
    || elapsed < 0
    || Date.parse(input.usage.observedAt) <
      Date.parse(input.context.preparedAt)
  ) throw new Error('GPU usage evidence differs from its terminal launch.')
}

function costTerminalOutcome(input: {
  terminalOutcome: 'completed' | 'failed' | 'canceled'
  substantiveWorkOutcome: 'executed' | 'not_executed' | 'unknown'
}): 'completed' | 'reeditpro_failed'
  | 'unknown_requires_reconciliation' {
  if (input.substantiveWorkOutcome === 'unknown') {
    return 'unknown_requires_reconciliation'
  }
  if (input.terminalOutcome === 'canceled') {
    return 'unknown_requires_reconciliation'
  }
  if (
    input.terminalOutcome === 'completed'
    && input.substantiveWorkOutcome === 'executed'
  ) return 'completed'
  return 'reeditpro_failed'
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertPlainSerializedData(
  value: unknown,
  label: string,
  state: {
    readonly seen: Set<object>
    entries: number
    characters: number
  } = { seen: new Set<object>(), entries: 0, characters: 0 },
  depth = 0,
): void {
  if (depth > 18) throw new Error(`${label} nesting is too deep.`)
  if (
    value === null
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return
  if (typeof value === 'string') {
    state.characters += value.length
    if (value.length > 16_384 || state.characters > 4_000_000) {
      throw new Error(`${label} string data is too large.`)
    }
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not serialized plain data.`)
  }
  if (state.seen.has(value)) throw new Error(`${label} contains a cycle.`)
  state.seen.add(value)
  const prototype = Object.getPrototypeOf(value)
  if (
    prototype !== Object.prototype
    && prototype !== Array.prototype
  ) throw new Error(`${label} has a non-plain prototype.`)
  const keys = Reflect.ownKeys(value)
  if (keys.length > 1_024) throw new Error(`${label} has too many entries.`)
  state.entries += keys.length
  if (state.entries > 16_384) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  for (const key of keys) {
    if (typeof key !== 'string') throw new Error(`${label} has a symbol key.`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label} has an accessor.`)
    }
    assertPlainSerializedData(
      descriptor.value,
      `${label}.${key}`,
      state,
      depth + 1,
    )
  }
  state.seen.delete(value)
}

export type {
  CanonicalCurrentGoogleCloudGpuRateAuthority,
  CanonicalProfessionalGpuExecutionEnvelope,
  CanonicalProfessionalToolGpuCostEstimate,
  CanonicalProfessionalToolGpuDispatchAdmission,
}
