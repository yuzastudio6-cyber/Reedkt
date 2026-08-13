import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalProfessionalToolGpuAttemptCostReceipt,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
  type CanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  type CanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import type {
  CanonicalTrackAllSam31L4TaskQaTaskStore,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  assertCanonicalProfessionalGpuExecutionEnvelope,
  assertCanonicalProfessionalGpuJobLaunch,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGpuPlanPricingAuthorityBundle,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertCanonicalProfessionalGpuFundedLaunchBinding,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  type CanonicalProfessionalGpuFundedLaunchBinding,
  type CanonicalProfessionalGpuFundedPrelaunchAuthorization,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import {
  assertPlatformUsageEvidence,
  assertTerminalCostContext,
  CANONICAL_PROFESSIONAL_GPU_PLATFORM_USAGE_EVIDENCE_VERSION,
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_CONTEXT_VERSION,
  canonicalProfessionalGpuPlatformUsageEvidenceSchema,
  canonicalProfessionalGpuTerminalCostContextSchema,
  type CanonicalProfessionalGpuApprovedRateAuthorityReadPort,
  type CanonicalProfessionalGpuAttemptCostReceiptStore,
  type CanonicalProfessionalGpuPlatformUsageEvidenceReadPort,
  type CanonicalProfessionalGpuTerminalCostContext,
  type CanonicalProfessionalGpuTerminalCostContextReadPort,
} from './canonical-professional-gpu-terminal-cost-evidence-service'
import {
  assertExecutionBinding,
  type CanonicalProfessionalGoogleCloudGpuExecutionReadPort,
} from './canonical-professional-google-cloud-gpu-terminal-observation-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_COST_ADAPTERS_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-terminal-cost-adapters-v1' as const

const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS =
  30 * 24 * 60 * 60 * 1_000
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/l4-task-qa-terminal'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const terminalOutcomeSchema = z.enum(['completed', 'failed', 'canceled'])
const cloudRunExecutionResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}\/executions\/[a-z][a-z0-9-]{0,62}$/u,
)

type EvidenceRef = z.infer<typeof evidenceRefSchema>
type TerminalOutcome = z.infer<typeof terminalOutcomeSchema>
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalTrackAllSam31L4TaskQaTerminalCostAdapters {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_COST_ADAPTERS_VERSION
  readonly contextReadPort: CanonicalProfessionalGpuTerminalCostContextReadPort
  readonly usageReadPort:
    CanonicalProfessionalGpuPlatformUsageEvidenceReadPort
  readonly rateReadPort:
    CanonicalProfessionalGpuApprovedRateAuthorityReadPort
  readonly receiptStore: CanonicalProfessionalGpuAttemptCostReceiptStore
  readonly callerPricingUsageOrTerminalClaimsAccepted: false
  readonly customerCreditsMutated: false
  readonly productionAuthority: false
  prepareTerminalCostContext(input: Readonly<{
    launch: CanonicalProfessionalGpuJobLaunch
    launchBinding: CanonicalProfessionalGpuFundedLaunchBinding
    prelaunch: CanonicalProfessionalGpuFundedPrelaunchAuthorization
    workItemKey: string
  }>): Promise<CanonicalProfessionalGpuTerminalCostContext>
  rereadCloudRunTerminalReadiness(input: Readonly<{
    launch: CanonicalProfessionalGpuJobLaunch
  }>): Promise<'pending' | 'terminal'>
}

export function createCanonicalTrackAllSam31L4TaskQaTerminalCostAdapters(
  input: Readonly<{
    objectPort: CanonicalCreateOnlyJsonObjectPort
    lifecycleStore: Pick<
      CanonicalProfessionalGpuDurableLifecycleStore,
      'rereadExecutionEnvelope'
    >
    pricingAuthorityReadPort:
      CanonicalProfessionalGpuPlanPricingAuthorityReadPort
    runtimeContextReadPort:
      CanonicalProfessionalGpuRuntimeDispatchContextReadPort
    executionReadPort: CanonicalProfessionalGoogleCloudGpuExecutionReadPort
    taskStore: Pick<
      CanonicalTrackAllSam31L4TaskQaTaskStore,
      'rereadWorkerTask' | 'rereadWorkerResponse'
    >
    auth?: GoogleAuthRequest
    now?: () => string
    requestTimeoutMilliseconds?: number
    prefix?: string
  }>,
): CanonicalTrackAllSam31L4TaskQaTerminalCostAdapters {
  assertDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const requestTimeoutMilliseconds =
    input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(requestTimeoutMilliseconds)
    || requestTimeoutMilliseconds < 1_000
    || requestTimeoutMilliseconds > 30_000) {
    throw new TypeError('L4 terminal-cost observation timeout is invalid.')
  }

  const contextReadPort: CanonicalProfessionalGpuTerminalCostContextReadPort =
    Object.freeze({
      async rereadPrivateTerminalCostContext({
        launch: untrustedLaunch,
      }: {
        readonly launch: CanonicalProfessionalGpuJobLaunch
      }) {
        const launch = requireL4Launch(untrustedLaunch)
        return readRecord({
          objectPort: input.objectPort,
          objectPath: recordPath(prefix, 'contexts', launchRef(launch)),
          parse: assertTerminalCostContext,
        })
      },
    })

  const receiptStore: CanonicalProfessionalGpuAttemptCostReceiptStore =
    Object.freeze({
      async createAttemptCostReceiptOnly({
        receipt: untrustedReceipt,
      }: Parameters<
        CanonicalProfessionalGpuAttemptCostReceiptStore[
          'createAttemptCostReceiptOnly'
        ]
      >[0]) {
        const receipt = assertCanonicalProfessionalToolGpuAttemptCostReceipt(
          untrustedReceipt,
        )
        return createAndReread({
          objectPort: input.objectPort,
          objectPath: idRecordPath(
            prefix,
            'attempt-cost-receipts',
            receipt.receiptId,
          ),
          record: receipt,
          parse: assertCanonicalProfessionalToolGpuAttemptCostReceipt,
        })
      },
      rereadAttemptCostReceipt({
        receiptId: untrustedReceiptId,
      }: Parameters<
        CanonicalProfessionalGpuAttemptCostReceiptStore[
          'rereadAttemptCostReceipt'
        ]
      >[0]) {
        const receiptId = safeId.parse(untrustedReceiptId)
        return readRecordById({
          objectPort: input.objectPort,
          objectPath: idRecordPath(
            prefix,
            'attempt-cost-receipts',
            receiptId,
          ),
          parse: assertCanonicalProfessionalToolGpuAttemptCostReceipt,
        })
      },
    })

  const rateReadPort: CanonicalProfessionalGpuApprovedRateAuthorityReadPort =
    Object.freeze({
      rereadApprovedCurrentAccountRateAuthority({
        launch: untrustedLaunch,
        rateAuthorityRef,
      }: Parameters<
        CanonicalProfessionalGpuApprovedRateAuthorityReadPort[
          'rereadApprovedCurrentAccountRateAuthority'
        ]
      >[0]) {
        const launch = requireL4Launch(untrustedLaunch)
        return input.runtimeContextReadPort.rereadApprovedCurrentRate({
          rateAuthorityRef: evidenceRefSchema.parse(rateAuthorityRef),
          routeId: launch.routeId,
          at: launch.launchedAt,
        })
      },
    })

  const usageReadPort: CanonicalProfessionalGpuPlatformUsageEvidenceReadPort =
    Object.freeze({
      async rereadPlatformUsageAndCapacity({
        launch: untrustedLaunch,
        cloudProviderTerminalRef: untrustedTerminalRef,
        terminalOutcome: untrustedTerminalOutcome,
      }: Parameters<
        CanonicalProfessionalGpuPlatformUsageEvidenceReadPort[
          'rereadPlatformUsageAndCapacity'
        ]
      >[0]) {
        const launch = requireL4Launch(untrustedLaunch)
        const terminalRef = evidenceRefSchema.parse(untrustedTerminalRef)
        const terminalOutcome = terminalOutcomeSchema.parse(
          untrustedTerminalOutcome,
        )
        const existing = await readRecord({
          objectPort: input.objectPort,
          objectPath: recordPath(prefix, 'platform-usage', launchRef(launch)),
          parse: assertPlatformUsageEvidence,
        })
        if (existing) {
          if (!sameRef(existing.cloudProviderTerminalRef, terminalRef)) {
            throw new TypeError('L4 persisted terminal usage crossed jobs.')
          }
          return existing
        }
        const observed = await rereadExactCloudRunTerminal({
          launch,
          executionReadPort: input.executionReadPort,
          auth,
          requestTimeoutMilliseconds,
        })
        if (observed.state !== 'terminal'
          || observed.terminalOutcome !== terminalOutcome
          || !sameRef(observed.cloudProviderTerminalRef, terminalRef)) {
          throw new TypeError('L4 terminal usage differs from Cloud Run.')
        }
        const { request, response } = await rereadWorkerEvidence({
          launch,
          taskStore: input.taskStore,
        })
        const outcome = substantiveOutcome({ response, terminalOutcome })
        const actualUsage = usageFor({
          request,
          response,
          execution: observed.execution,
        })
        const workerUsageEvidenceRef = opaqueRef(
          'track-all-l4-worker-usage',
          {
            launchRef: launchRef(launch),
            requestBindingSha256: request.requestBindingSha256,
            responseBindingSha256: response?.responseBindingSha256 ?? null,
            runtimeMeasurement: response?.runtimeMeasurement ?? null,
            status: response?.status ?? 'missing_after_platform_terminal',
            terminalStage: response?.terminalStage ?? null,
          },
        )
        const platformUsageRereadRef = opaqueRef(
          'google-cloud-run-platform-usage',
          {
            launchRef: launchRef(launch),
            operationName: observed.operationName,
            execution: observed.execution,
            actualUsage,
          },
        )
        const cloudCapacityTeardownObservationRef = opaqueRef(
          'google-cloud-run-zero-active-gpu',
          {
            platformUsageRereadRef,
            completionTime: observed.execution.completionTime,
            runningCount: Number(observed.execution.runningCount),
            configuredMinimumInstances: 0,
            activeGpuResourcesAfterObservation: 0,
          },
        )
        const observedAt = timestamp.parse(now())
        if (Date.parse(observedAt) <
          Date.parse(observed.execution.completionTime)) {
          throw new TypeError('L4 terminal usage observation is stale.')
        }
        const payload = {
          schemaVersion:
            CANONICAL_PROFESSIONAL_GPU_PLATFORM_USAGE_EVIDENCE_VERSION,
          source:
            'canonical_server_google_cloud_gpu_platform_usage_repository' as const,
          evidenceClass: 'canonical_private_reread' as const,
          launchRef: launchRef(launch),
          admissionRef: launch.admissionRef,
          executionEnvelopeRef: launch.executionEnvelopeRef,
          cloudProviderTerminalRef: terminalRef,
          cloudCapacityTeardownObservationRef,
          workerUsageEvidenceRef,
          platformUsageRereadRef,
          routeId: launch.routeId,
          providerInferenceOrSubstantiveWorkOutcome: outcome,
          actualUsage,
          exactWorkerAndPlatformUsageReread: true as const,
          providerCapacityOrExecutionRunningCountReread: true as const,
          activeGpuResourcesAfterObservation: 0 as const,
          workerSuppliedPricingAccepted: false as const,
          callerUsageOutcomeOrCapacityClaimAccepted: false as const,
          observedAt,
        }
        const evidence = canonicalProfessionalGpuPlatformUsageEvidenceSchema
          .parse({
            ...payload,
            evidenceHash: sha256AuthorityValue(payload),
          })
        await createAndReread({
          objectPort: input.objectPort,
          objectPath: recordPath(
            prefix,
            'platform-usage',
            launchRef(launch),
          ),
          record: evidence,
          parse: assertPlatformUsageEvidence,
        })
        return evidence
      },
    })

  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_COST_ADAPTERS_VERSION,
    contextReadPort,
    usageReadPort,
    rateReadPort,
    receiptStore,
    callerPricingUsageOrTerminalClaimsAccepted: false as const,
    customerCreditsMutated: false as const,
    productionAuthority: false as const,
    async prepareTerminalCostContext(untrusted: Readonly<{
      launch: CanonicalProfessionalGpuJobLaunch
      launchBinding: CanonicalProfessionalGpuFundedLaunchBinding
      prelaunch: CanonicalProfessionalGpuFundedPrelaunchAuthorization
      workItemKey: string
    }>) {
      const launch = requireL4Launch(untrusted.launch)
      const launchBinding = assertCanonicalProfessionalGpuFundedLaunchBinding(
        untrusted.launchBinding,
      )
      const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
        untrusted.prelaunch,
      )
      const workItemKey = safeId.parse(untrusted.workItemKey)
      if (!sameRef(launchBinding.launchRef, launchRef(launch))
        || !sameRef(launchBinding.prelaunchAuthorizationRef, ref(
          prelaunch.prelaunchAuthorizationId,
          prelaunch.prelaunchAuthorizationHash,
        ))) {
        throw new TypeError('L4 terminal context lost funded launch lineage.')
      }
      const admission = prelaunch.fundedDispatchAdmission.toolDispatchAdmission
      const [untrustedBundle, untrustedRelease, untrustedEnvelope] =
        await Promise.all([
          input.pricingAuthorityReadPort.rereadPrivatePricingAuthority({
            workspaceId: admission.scope.workspaceId,
            snapshotId: admission.scope.approvedSnapshotRef.id,
            workItemKey,
            at: launch.launchedAt,
          }),
          input.runtimeContextReadPort.rereadQualifiedRuntimeRelease({
            toolId: launch.toolId,
            operationId: launch.operationId,
            routeId: launch.routeId,
            exactToolOrModelReleaseRef:
              prelaunch.fundedDispatchAdmission.toolDispatchAdmission
                .runtimeReleaseRef,
            at: launch.launchedAt,
          }),
          input.lifecycleStore.rereadExecutionEnvelope({
            envelopeId: launch.executionEnvelopeRef.id,
          }),
        ])
      const bundle = assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
        untrustedBundle,
        launch.launchedAt,
      )
      const release = prelaunch.fundedDispatchAdmission.toolDispatchAdmission
        .runtimeReleaseRef
      const runtimeRelease = assertCanonicalProfessionalToolGpuRuntimeRelease(
        untrustedRelease,
        launch.launchedAt,
      )
      const envelope = assertCanonicalProfessionalGpuExecutionEnvelope(
        untrustedEnvelope,
      )
      const estimateEntry = bundle.dispatchEstimateSet.entries.find((entry) =>
        entry.workItemKey === workItemKey
        && sameRef(entry.approvedWorkItemRef, admission.scope.approvedWorkItemRef)
        && sameRef(ref(
          entry.estimate.estimateId,
          entry.estimate.estimateHash,
        ), admission.estimateRef))
      if (!estimateEntry
        || !sameRef(bundleRef(bundle), prelaunch.pricingAuthorityBundleRef)
        || !sameRef(envelope.admissionRef, launch.admissionRef)
        || !sameRef(envelope.executionAttemptRef,
          admission.scope.executionAttemptRef)) {
        throw new TypeError('L4 terminal pricing or envelope reread changed.')
      }
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_CONTEXT_VERSION,
        source:
          'canonical_server_professional_gpu_terminal_cost_context_repository' as const,
        evidenceClass: 'canonical_private_reread' as const,
        launchRef: launchRef(launch),
        admission,
        runtimeRelease,
        executionEnvelope: envelope,
        estimate: estimateEntry.estimate,
        approvedCurrentAccountRateAuthorityRef:
          admission.currentRateAuthorityRef,
        attemptCostReceiptId:
          `gpu-attempt-cost-${admission.scope.executionAttemptRef.contentHash.slice(7)}`,
        priorPrimaryFailureReceiptRef:
          admission.priorPrimaryTerminalReceiptRef,
        priorPrimaryFailureClass: admission.priorPrimaryFailureClass,
        exactApprovalEstimateReservationAdmissionEnvelopeAndLaunchReread:
          true as const,
        callerEstimateRateUsageOutcomeOrCostAccepted: false as const,
        walletOrLedgerMutationAuthorityGranted: false as const,
        preparedAt: prelaunch.preparedAt,
      }
      const context = canonicalProfessionalGpuTerminalCostContextSchema.parse({
        ...payload,
        contextHash: sha256AuthorityValue(payload),
      })
      if (!sameRef(ref(
        context.runtimeRelease.releaseId,
        context.runtimeRelease.releaseHash,
        context.runtimeRelease.releaseVersion,
      ), release)) {
        throw new TypeError('L4 terminal runtime release reread changed.')
      }
      await createAndReread({
        objectPort: input.objectPort,
        objectPath: recordPath(prefix, 'contexts', launchRef(launch)),
        record: context,
        parse: assertTerminalCostContext,
      })
      return context
    },
    async rereadCloudRunTerminalReadiness({
      launch: untrustedLaunch,
    }: Readonly<{ launch: CanonicalProfessionalGpuJobLaunch }>) {
      const launch = requireL4Launch(untrustedLaunch)
      const observed = await rereadExactCloudRunTerminal({
        launch,
        executionReadPort: input.executionReadPort,
        auth,
        requestTimeoutMilliseconds,
        readinessOnly: true,
      })
      return observed.state
    },
  })
}

async function rereadWorkerEvidence(input: Readonly<{
  launch: CanonicalProfessionalGpuJobLaunch
  taskStore: Pick<
    CanonicalTrackAllSam31L4TaskQaTaskStore,
    'rereadWorkerTask' | 'rereadWorkerResponse'
  >
}>): Promise<{
  request: CanonicalTrackAllSam31L4TaskQaWorkerRequestV3
  response: CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 | null
}> {
  const task = z.object({ runtimeRequest: z.unknown() }).strict().parse(
    await input.taskStore.rereadWorkerTask(input.launch.executionEnvelopeRef.id),
  )
  const request = assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
    task.runtimeRequest,
  )
  const untrustedResponse = await input.taskStore.rereadWorkerResponse(
    input.launch.executionEnvelopeRef.id,
  )
  const response = untrustedResponse === null
    ? null
    : assertCanonicalTrackAllSam31L4TaskQaWorkerResponseV3(untrustedResponse)
  if (request.l4InvocationId !== input.launch.executionEnvelopeRef.id
    || (response !== null
      && (response.l4InvocationId !== request.l4InvocationId
        || response.sam31InvocationId !== request.sam31InvocationId
        || response.requestBindingSha256 !== request.requestBindingSha256))) {
    throw new TypeError('L4 worker task and response lineage changed.')
  }
  return { request, response }
}

function substantiveOutcome(input: Readonly<{
  response: CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 | null
  terminalOutcome: TerminalOutcome
}>): 'executed' | 'not_executed' | 'unknown' {
  if (input.response === null) return 'unknown'
  if (input.terminalOutcome === 'completed'
    && input.response.status === 'completed') return 'executed'
  if (input.response.status === 'failed'
    && [
      'request_validation',
      'manifest_reread',
      'cuda_admission',
      'mask_reread',
    ].includes(input.response.terminalStage)) return 'not_executed'
  return 'unknown'
}

function usageFor(input: Readonly<{
  request: CanonicalTrackAllSam31L4TaskQaWorkerRequestV3
  response: CanonicalTrackAllSam31L4TaskQaWorkerResponseV3 | null
  execution: CloudRunTerminalExecution
}>) {
  const createAt = Date.parse(input.execution.createTime)
  const startAt = Date.parse(input.execution.startTime)
  const completeAt = Date.parse(input.execution.completionTime)
  const coldStartMilliseconds = startAt - createAt
  const executionMilliseconds = completeAt - startAt
  const activeGpuMilliseconds = input.response?.runtimeMeasurement
    ?.wallTimeMilliseconds ?? 0
  if (coldStartMilliseconds < 0 || executionMilliseconds < 0
    || activeGpuMilliseconds > executionMilliseconds) {
    throw new TypeError('L4 worker and Cloud Run timing are inconsistent.')
  }
  const failedBeforeMeasuredWork = input.response?.runtimeMeasurement == null
  const runtimeAndModelLoadMilliseconds = failedBeforeMeasuredWork
    ? executionMilliseconds
    : 0
  const drainAndShutdownMilliseconds = failedBeforeMeasuredWork
    ? 0
    : executionMilliseconds - activeGpuMilliseconds
  const previousMaskReads = input.request.previousChunkBoundaryInput === null
    ? 0
    : input.request.previousChunkBoundaryInput.subjects.length
  const taskBytes = Buffer.byteLength(stableAuthorityStringify({
    runtimeRequest: input.request,
  }), 'utf8')
  const responseBytes = Buffer.byteLength(
    stableAuthorityStringify(input.response),
    'utf8',
  )
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: completeAt - createAt,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: taskBytes + responseBytes,
    privateArtifactRetentionMilliseconds:
      PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: 1,
    classBOperationCount:
      input.request.expectedMaskPngCount + previousMaskReads + 3,
  }
}

type CloudRunTerminalExecution = z.infer<
  typeof cloudRunTerminalExecutionSchema
>

const cloudRunTerminalExecutionSchema = z.object({
  name: cloudRunExecutionResourceSchema,
  uid: safeId,
  createTime: timestamp,
  startTime: timestamp,
  completionTime: timestamp,
  taskCount: z.union([z.literal(1), z.literal('1')]),
  runningCount: z.union([z.literal(0), z.literal('0')]),
  succeededCount: z.union([
    z.literal(0), z.literal(1), z.literal('0'), z.literal('1'),
  ]),
  failedCount: z.union([
    z.literal(0), z.literal(1), z.literal('0'), z.literal('1'),
  ]),
  cancelledCount: z.union([
    z.literal(0), z.literal(1), z.literal('0'), z.literal('1'),
  ]),
  conditions: z.array(z.object({
    type: z.literal('Completed'),
    state: z.enum(['CONDITION_SUCCEEDED', 'CONDITION_FAILED']),
    executionReason: z.enum(['CANCELLED']).optional(),
  }).passthrough()).min(1).max(32),
}).passthrough()

async function rereadExactCloudRunTerminal(input: Readonly<{
  launch: CanonicalProfessionalGpuJobLaunch
  executionReadPort: CanonicalProfessionalGoogleCloudGpuExecutionReadPort
  auth: GoogleAuthRequest
  requestTimeoutMilliseconds: number
  readinessOnly?: boolean
}>): Promise<
  | Readonly<{ state: 'pending' }>
  | Readonly<{
      state: 'terminal'
      operationName: string
      execution: CloudRunTerminalExecution
      terminalOutcome: TerminalOutcome
      cloudProviderTerminalRef: EvidenceRef
    }>
> {
  const binding = assertExecutionBinding(
    await input.executionReadPort.rereadPrivateExecutionBinding({
      launch: input.launch,
    }),
  )
  if (binding.executionTarget !== 'google_cloud_run_l4_job') {
    throw new TypeError('L4 terminal adapter received another execution.')
  }
  const operationResponse = await input.auth.request({
    url: `${CLOUD_RUN_API_ORIGIN}/v2/${binding.providerOperationResource}`,
    method: 'GET',
    timeout: input.requestTimeoutMilliseconds,
    retry: false,
    maxRedirects: 0,
  })
  assertPlainSerializedData(operationResponse.data, 'l4_operation_reread')
  const readiness = z.object({
    name: z.literal(binding.providerOperationResource),
    done: z.boolean().optional().default(false),
  }).passthrough().parse(operationResponse.data)
  if (!readiness.done) return { state: 'pending' }
  const operation = z.object({
    name: z.literal(binding.providerOperationResource),
    done: z.literal(true),
    response: z.object({
      name: cloudRunExecutionResourceSchema,
    }).passthrough(),
  }).passthrough().parse(operationResponse.data)
  if (!operation.response.name.startsWith(
    `${binding.expectedCloudRunJobResource}/executions/`,
  )) throw new TypeError('L4 terminal operation crossed jobs.')
  const executionResponse = await input.auth.request({
    url: `${CLOUD_RUN_API_ORIGIN}/v2/${operation.response.name}`,
    method: 'GET',
    timeout: input.requestTimeoutMilliseconds,
    retry: false,
    maxRedirects: 0,
  })
  assertPlainSerializedData(executionResponse.data, 'l4_execution_reread')
  const execution = cloudRunTerminalExecutionSchema.parse(
    executionResponse.data,
  )
  if (execution.name !== operation.response.name) {
    throw new TypeError('L4 terminal execution identity changed.')
  }
  const completed = execution.conditions.find((condition) =>
    condition.type === 'Completed')
  if (!completed) throw new TypeError('L4 execution has no terminal state.')
  const succeeded = Number(execution.succeededCount)
  const failed = Number(execution.failedCount)
  const canceled = Number(execution.cancelledCount)
  const exactSuccess = completed.state === 'CONDITION_SUCCEEDED'
    && succeeded === 1 && failed === 0 && canceled === 0
  const exactCanceled = completed.state === 'CONDITION_FAILED'
    && succeeded === 0 && failed === 0 && canceled === 1
    && completed.executionReason === 'CANCELLED'
  const exactFailed = completed.state === 'CONDITION_FAILED'
    && succeeded === 0 && failed === 1 && canceled === 0
    && completed.executionReason !== 'CANCELLED'
  if (!exactSuccess && !exactCanceled && !exactFailed) {
    throw new TypeError('L4 terminal execution counts are inconsistent.')
  }
  const terminalOutcome = exactSuccess
    ? 'completed' as const
    : exactCanceled
      ? 'canceled' as const
      : 'failed' as const
  return {
    state: 'terminal',
    operationName: operation.name,
    execution,
    terminalOutcome,
    cloudProviderTerminalRef: opaqueRef('google-cloud-run-terminal', {
      bindingHash: binding.bindingHash,
      operationName: operation.name,
      execution,
    }),
  }
}

function requireL4Launch(value: unknown): CanonicalProfessionalGpuJobLaunch {
  const launch = assertCanonicalProfessionalGpuJobLaunch(value)
  if (launch.routeId !== 'l4_standard_primary'
    || launch.executionTarget !== 'google_cloud_run_l4_job'
    || launch.accelerator !== 'nvidia_l4'
    || launch.launchDisposition !== 'job_created'
    || launch.cloudJobExecutionRef === null) {
    throw new TypeError('Track All terminal cost requires one created L4 job.')
  }
  return launch
}

function bundleRef(bundle: ReturnType<
  typeof assertCanonicalProfessionalGpuPlanPricingAuthorityBundle
>): EvidenceRef {
  return ref(bundle.bundleId, bundle.bundleHash)
}

function launchRef(launch: CanonicalProfessionalGpuJobLaunch): EvidenceRef {
  return ref(launch.launchRecordId, launch.launchHash)
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function opaqueRef(prefix: string, value: unknown): EvidenceRef {
  const digest = sha256AuthorityValue(value)
  return ref(`${prefix}.${digest.slice(0, 32)}`, digest)
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

async function createAndReread<T>(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  record: T
  parse: (value: unknown) => T
}>): Promise<'created' | 'already_exists'> {
  const body = serialize(input.record)
  const disposition = await input.objectPort.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await readRecord({
    objectPort: input.objectPort,
    objectPath: input.objectPath,
    parse: input.parse,
  })
  if (!reread || stableAuthorityStringify(reread)
    !== stableAuthorityStringify(input.record)) {
    throw new TypeError('L4 terminal evidence create-only reread changed.')
  }
  return disposition
}

async function readRecord<T>(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  parse: (value: unknown) => T
}>): Promise<T | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (body === null) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('L4 terminal evidence bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new TypeError('L4 terminal evidence JSON is invalid.')
  }
  return input.parse(value)
}

async function readRecordById<T>(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  parse: (value: unknown) => T
}>): Promise<T | null> {
  return readRecord(input)
}

function recordPath(
  prefix: string,
  kind: string,
  exactRef: EvidenceRef,
): string {
  return `${prefix}/${kind}/${sha256AuthorityValue({
    domain: 'canonical_track_all_l4_terminal_record_v1',
    exactRef,
  })}.json`
}

function idRecordPath(prefix: string, kind: string, id: string): string {
  return recordPath(prefix, kind, ref(
    id,
    sha256AuthorityValue({
      domain: 'canonical_track_all_l4_terminal_id_v1',
      id,
    }),
  ))
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('L4 terminal evidence record is too large.')
  }
  return body
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,900}$/u.test(normalized)
    || normalized.includes('..') || normalized.includes('//')) {
    throw new TypeError('L4 terminal evidence prefix is invalid.')
  }
  return normalized
}

function assertDependencies(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  lifecycleStore: Pick<
    CanonicalProfessionalGpuDurableLifecycleStore,
    'rereadExecutionEnvelope'
  >
  pricingAuthorityReadPort:
    CanonicalProfessionalGpuPlanPricingAuthorityReadPort
  runtimeContextReadPort:
    CanonicalProfessionalGpuRuntimeDispatchContextReadPort
  executionReadPort: CanonicalProfessionalGoogleCloudGpuExecutionReadPort
  taskStore: Pick<
    CanonicalTrackAllSam31L4TaskQaTaskStore,
    'rereadWorkerTask' | 'rereadWorkerResponse'
  >
}>): void {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
    || typeof input.lifecycleStore?.rereadExecutionEnvelope !== 'function'
    || typeof input.pricingAuthorityReadPort
      ?.rereadPrivatePricingAuthority !== 'function'
    || typeof input.runtimeContextReadPort
      ?.rereadQualifiedRuntimeRelease !== 'function'
    || typeof input.runtimeContextReadPort
      ?.rereadApprovedCurrentRate !== 'function'
    || typeof input.executionReadPort
      ?.rereadPrivateExecutionBinding !== 'function'
    || typeof input.taskStore?.rereadWorkerTask !== 'function'
    || typeof input.taskStore?.rereadWorkerResponse !== 'function') {
    throw new TypeError('L4 terminal-cost adapter dependency is unavailable.')
  }
}
