import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100Admission,
  assertCanonicalSam31QualificationA100JobObservation,
  assertCanonicalSam31QualificationA100MountObservation,
  assertCanonicalSam31QualificationA100Submission,
  type CanonicalSam31QualificationA100Admission,
  type CanonicalSam31QualificationA100JobObservation,
  type CanonicalSam31QualificationA100MountObservation,
  type CanonicalSam31QualificationA100Submission,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  assertCanonicalSam31QualificationResultEvidence,
  type CanonicalSam31QualificationResultEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-result-owner'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue, stableAuthorityStringify } from
  './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-terminal-platform-port-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_LOG_EVIDENCE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-log-evidence-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_INTERNAL_COST_RECEIPT_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-internal-cost-receipt-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_EVIDENCE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const LOG_NAME = 'projects/reeditpro/logs/batch_task_logs' as const
const BATCH_ORIGIN = 'https://batch.googleapis.com' as const
const LOGGING_ENTRIES_URL =
  'https://logging.googleapis.com/v2/entries:list' as const
const COMPUTE_AGGREGATED_INSTANCES_URL =
  'https://compute.googleapis.com/compute/v1/projects/reeditpro/aggregated/instances' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const timestamp = z.string().datetime({ offset: true })
const duration = z.string().regex(
  /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,9})?s$/u,
)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const batchJobResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/jobs\/weeditpro-sam31-q-[a-f0-9]{40}$/u,
)
const batchTaskResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/jobs\/weeditpro-sam31-q-[a-f0-9]{40}\/taskGroups\/group0\/tasks\/0$/u,
)

const logEntrySchema = z.object({
  insertId: safeId,
  timestamp,
  severity: z.enum([
    'DEFAULT', 'DEBUG', 'INFO', 'NOTICE', 'WARNING',
  ]),
  logName: z.literal(LOG_NAME),
  batchJobUid: safeId,
  payloadDigestSha256: rawSha256,
}).strict()

const platformObservationSchema = z.object({
  batchJobResource,
  batchJobUid: safeId,
  batchState: z.literal('SUCCEEDED'),
  runDuration: duration,
  taskCount: z.literal(1),
  taskName: batchTaskResource,
  taskState: z.literal('SUCCEEDED'),
  logFilter: z.string().max(1_024),
  logEntries: z.array(logEntrySchema).min(1).max(1_000),
  logQueryFullyConsumed: z.literal(true),
  batchVmFilter: z.string().max(512),
  batchVmQueryFullyConsumed: z.literal(true),
  matchingBatchVmInstanceCount: z.literal(0),
  activeTaskCountAfterTerminalReread: z.literal(0),
  activeGpuResourceCountAfterTerminalReread: z.literal(0),
  exactJobTaskAndLogReread: z.literal(true),
}).strict().superRefine((value, context) => {
  const ordered = [...value.logEntries].sort(compareLogs)
  if (
    stableAuthorityStringify(value.logEntries) !==
      stableAuthorityStringify(ordered)
    || value.logEntries.some((entry) =>
      entry.batchJobUid !== value.batchJobUid)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification logs lost exact task ordering or scope.',
  })
})
export type CanonicalSam31QualificationTerminalPlatformObservation = z.infer<
  typeof platformObservationSchema
>

const logEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_LOG_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_google_cloud_batch_sam3_1_qualification_log_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  batchJobResource,
  batchJobUid: safeId,
  taskName: batchTaskResource,
  logName: z.literal(LOG_NAME),
  exactLogFilterDigestSha256: rawSha256,
  orderedLogEntrySetDigestSha256: rawSha256,
  logEntryCount: positiveInteger.max(1_000),
  errorOrHigherLogEntryCount: z.literal(0),
  exactJobUidLabelAndSingleTerminalTaskReread: z.literal(true),
  allReturnedLogEntriesConsumed: z.literal(true),
  callerLogFilterEntryPayloadOrSeverityAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()
export const canonicalSam31QualificationLogEvidenceSchema =
  logEvidenceWithoutHashSchema.extend({ evidenceHash: rawSha256 }).strict()
export type CanonicalSam31QualificationLogEvidence = z.infer<
  typeof canonicalSam31QualificationLogEvidenceSchema
>

const internalCostWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_INTERNAL_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_qualification_internal_compute_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  receiptId: safeId,
  attemptId: safeId,
  batchJobResource,
  batchJobUid: safeId,
  rateAuthorityRef: evidenceRefSchema,
  routeId: z.literal('a100_80gb_heavy_primary'),
  billingClassification: z.literal('platform_internal_qualification'),
  accountEffectivePricingReread: z.literal(true),
  runDurationNanoseconds: positiveInteger.max(7_200_000_000_000),
  deterministicProbeWallMilliseconds: positiveInteger.max(10_800_000),
  deterministicProbeCudaMilliseconds: positiveInteger.max(10_800_000),
  a2UltraGpu1gMaximumUsdNanosPerMachineHour: nonnegativeInteger,
  accountEffectiveRunDurationComputeEstimateUsdNanos: nonnegativeInteger,
  ancillaryStorageAndApiInvoiceReconciliationRequired: z.literal(true),
  canonicalCloudBillingInvoiceActualObserved: z.literal(false),
  customerEligibleCostUsdNanos: z.literal(0),
  customerCreditsReserved: z.literal(0),
  customerCreditsSpent: z.literal(0),
  customerWalletOrLedgerMutated: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  callerUsagePriceCostOrCreditClaimAccepted: z.literal(false),
  recordedAt: timestamp,
}).strict().superRefine((value, context) => {
  const expected = ceilProductDivision(
    value.a2UltraGpu1gMaximumUsdNanosPerMachineHour,
    value.runDurationNanoseconds,
    3_600_000_000_000,
  )
  if (
    value.deterministicProbeCudaMilliseconds >
      value.deterministicProbeWallMilliseconds
    || value.deterministicProbeWallMilliseconds * 1_000_000 >
      value.runDurationNanoseconds
    || value.accountEffectiveRunDurationComputeEstimateUsdNanos !== expected
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification compute usage or cost did not reconcile.',
  })
})
export const canonicalSam31QualificationInternalCostReceiptSchema =
  internalCostWithoutHashSchema.extend({ receiptHash: rawSha256 }).strict()
export type CanonicalSam31QualificationInternalCostReceipt = z.infer<
  typeof canonicalSam31QualificationInternalCostReceiptSchema
>

const terminalEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_qualification_terminal_evidence_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  qualificationId: safeId,
  mountObservationRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  submissionRef: evidenceRefSchema,
  terminalJobObservationRef: evidenceRefSchema,
  resultEvidenceRef: evidenceRefSchema,
  workerResultRef: evidenceRefSchema,
  qualificationLogRef: evidenceRefSchema,
  internalCostReceiptRef: evidenceRefSchema,
  rateAuthorityRef: evidenceRefSchema,
  batchJobResource,
  batchJobUid: safeId,
  batchState: z.literal('SUCCEEDED'),
  taskState: z.literal('SUCCEEDED'),
  exactJobTaskResultLogUsageAndAccountPriceLineage: z.literal(true),
  terminalWorkerStoppedVerified: z.literal(true),
  activeGpuResourcesAfterTerminalObservation: z.literal(0),
  platformInternalRunDurationCostEstimateRecorded: z.literal(true),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerBillingAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict()
export const canonicalSam31QualificationTerminalEvidenceSchema =
  terminalEvidenceWithoutHashSchema.extend({ evidenceHash: rawSha256 }).strict()
export type CanonicalSam31QualificationTerminalEvidence = z.infer<
  typeof canonicalSam31QualificationTerminalEvidenceSchema
>

export interface CanonicalSam31QualificationTerminalPlatformReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION
  rereadExactTerminal(input: {
    readonly batchJobResource: string
    readonly batchJobUid: string
  }): Promise<unknown>
}

export interface CanonicalSam31QualificationApprovedA100RateReadPort {
  rereadExactApprovedRate(input: {
    readonly rateAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly at: string
  }): Promise<unknown>
}

export function createCanonicalSam31QualificationTerminalEvidenceOwner(input: {
  readonly platformReadPort:
    CanonicalSam31QualificationTerminalPlatformReadPort
  readonly rateReadPort: CanonicalSam31QualificationApprovedA100RateReadPort
  readonly evidenceObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadAndPersist(request: {
      readonly attemptId: string
      readonly mountObservation:
        CanonicalSam31QualificationA100MountObservation
      readonly admission: CanonicalSam31QualificationA100Admission
      readonly submission: CanonicalSam31QualificationA100Submission
      readonly terminalJobObservation:
        CanonicalSam31QualificationA100JobObservation
      readonly resultEvidence: CanonicalSam31QualificationResultEvidence
    }): Promise<CanonicalSam31QualificationTerminalEvidence> {
      assertPlainSerializedData(request, 'sam31_terminal_evidence_request')
      const attemptId = safeId.parse(request.attemptId)
      const mount = assertCanonicalSam31QualificationA100MountObservation(
        request.mountObservation,
      )
      const admission = assertCanonicalSam31QualificationA100Admission(
        request.admission,
      )
      const submission = assertCanonicalSam31QualificationA100Submission(
        request.submission,
      )
      const terminal = assertCanonicalSam31QualificationA100JobObservation(
        request.terminalJobObservation,
      )
      const result = assertCanonicalSam31QualificationResultEvidence(
        request.resultEvidence,
      )
      assertLifecycle({
        attemptId,
        mount,
        admission,
        submission,
        terminal,
        result,
      })
      const platform = platformObservationSchema.parse(
        await input.platformReadPort.rereadExactTerminal({
          batchJobResource: submission.batchJobResource,
          batchJobUid: submission.batchJobUid as string,
        }),
      )
      if (
        platform.batchJobResource !== submission.batchJobResource
        || platform.batchJobUid !== submission.batchJobUid
      ) throw new Error('SAM 3.1 qualification terminal platform crossed job.')
      const observedAt = timestamp.parse(now())
      const runNanoseconds = durationNanoseconds(platform.runDuration)
      const probeWallMilliseconds = result.workerResult.deterministicRuns
        .reduce((total, run) => total + run.wallTimeMilliseconds, 0)
      const probeCudaMilliseconds = result.workerResult.deterministicRuns
        .reduce((total, run) => total + run.cudaInferenceMilliseconds, 0)
      const rate = assertExactA100Rate(
        await input.rateReadPort.rereadExactApprovedRate({
          rateAuthorityRef: admission.accountEffectiveA100RateAuthorityRef,
          at: observedAt,
        }),
        admission,
        observedAt,
      )
      if (
        Date.parse(observedAt) < Date.parse(result.observedAt)
        || Date.parse(observedAt) < Date.parse(terminal.observedAt)
        || platform.logEntries.some((entry) =>
          Date.parse(entry.timestamp) > Date.parse(observedAt))
      ) throw new Error('SAM 3.1 qualification terminal evidence is stale.')
      const logEvidence = createLogEvidence({
        attemptId,
        platform,
        observedAt,
      })
      const costReceipt = createInternalCostReceipt({
        attemptId,
        platform,
        rate,
        runNanoseconds,
        probeWallMilliseconds,
        probeCudaMilliseconds,
        recordedAt: observedAt,
      })
      const payload = terminalEvidenceWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_EVIDENCE_VERSION,
        source: 'canonical_server_sam3_1_qualification_terminal_evidence_owner',
        evidenceClass: 'canonical_private_reread',
        attemptId,
        qualificationId: result.qualificationId,
        mountObservationRef: ref(attemptId, mount.observationHash),
        admissionRef: ref(attemptId, admission.admissionHash),
        submissionRef: ref(attemptId, submission.submissionHash),
        terminalJobObservationRef: ref(attemptId, terminal.observationHash),
        resultEvidenceRef: ref(attemptId, result.evidenceHash),
        workerResultRef: result.workerResultRef,
        qualificationLogRef: ref(attemptId, logEvidence.evidenceHash),
        internalCostReceiptRef: ref(costReceipt.receiptId,
          costReceipt.receiptHash),
        rateAuthorityRef: admission.accountEffectiveA100RateAuthorityRef,
        batchJobResource: platform.batchJobResource,
        batchJobUid: platform.batchJobUid,
        batchState: platform.batchState,
        taskState: platform.taskState,
        exactJobTaskResultLogUsageAndAccountPriceLineage: true,
        terminalWorkerStoppedVerified: true,
        activeGpuResourcesAfterTerminalObservation: 0,
        platformInternalRunDurationCostEstimateRecorded: true,
        sourceCheckpointQualificationGranted: false,
        runtimeReleaseGranted: false,
        customerCreditsMutated: false,
        customerBillingAuthorityGranted: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionReady: false,
        observedAt,
      })
      const evidence = canonicalSam31QualificationTerminalEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      await persistExact({
        port: input.evidenceObjectPort,
        attemptId,
        logEvidence,
        costReceipt,
        evidence,
      })
      return evidence
    },
  })
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

/** Actual authenticated Google Batch task and Cloud Logging rereader. */
export function createCanonicalSam31QualificationGoogleCloudTerminalPort(
  input?: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  },
): CanonicalSam31QualificationTerminalPlatformReadPort {
  const auth = input?.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const timeout = input?.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('SAM 3.1 qualification terminal timeout is invalid.')
  }
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION,
    async rereadExactTerminal(value: {
      readonly batchJobResource: string
      readonly batchJobUid: string
    }) {
      const resource = batchJobResource.parse(value.batchJobResource)
      const uid = safeId.parse(value.batchJobUid)
      const jobResponse = await auth.request({
        method: 'GET',
        url: `${BATCH_ORIGIN}/v1/${resource}`,
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(jobResponse.data, 'sam31_terminal_job_response')
      const job = z.object({
        name: z.literal(resource),
        uid: z.literal(uid),
        status: z.object({
          state: z.literal('SUCCEEDED'),
          runDuration: duration,
        }).passthrough(),
      }).passthrough().parse(jobResponse.data)
      const taskName = `${resource}/taskGroups/group0/tasks/0`
      const tasksResponse = await auth.request({
        method: 'GET',
        url: `${BATCH_ORIGIN}/v1/${resource}/taskGroups/group0/tasks`,
        params: { pageSize: 2 },
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(
        tasksResponse.data,
        'sam31_terminal_tasks_response',
      )
      const tasks = z.object({
        tasks: z.tuple([z.object({
          name: z.literal(taskName),
          status: z.object({ state: z.literal('SUCCEEDED') }).passthrough(),
        }).passthrough()]),
        nextPageToken: z.union([z.literal(''), z.undefined()]).optional(),
      }).passthrough().parse(tasksResponse.data)
      const logFilter = exactLogFilter(uid)
      const batchVmFilter = `labels.batch-job-uid = ${uid}`
      const instancesResponse = await auth.request({
        method: 'GET',
        url: COMPUTE_AGGREGATED_INSTANCES_URL,
        params: {
          filter: batchVmFilter,
          maxResults: 500,
          returnPartialSuccess: false,
          includeAllScopes: true,
        },
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(
        instancesResponse.data,
        'sam31_terminal_batch_instances_response',
      )
      const instances = z.object({
        kind: z.literal('compute#instanceAggregatedList'),
        items: z.record(z.string(), z.object({
          instances: z.array(z.object({
            name: safeId,
            status: z.string().trim().min(1).max(64),
            labels: z.record(z.string(), z.string()).optional(),
          }).passthrough()).optional(),
        }).passthrough()),
        nextPageToken: z.union([z.literal(''), z.undefined()]).optional(),
      }).passthrough().parse(instancesResponse.data)
      const matchingInstances = Object.values(instances.items)
        .flatMap((scope) => scope.instances ?? [])
      if (matchingInstances.length !== 0) {
        throw new Error('SAM 3.1 qualification Batch GPU VM still exists.')
      }
      const logsResponse = await auth.request({
        method: 'POST',
        url: LOGGING_ENTRIES_URL,
        data: {
          resourceNames: [`projects/${PROJECT_ID}`],
          filter: logFilter,
          orderBy: 'timestamp asc',
          pageSize: 1_000,
        },
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(logsResponse.data, 'sam31_terminal_logs_response')
      const logs = z.object({
        entries: z.array(z.object({
          insertId: safeId,
          timestamp,
          severity: z.enum([
            'DEFAULT', 'DEBUG', 'INFO', 'NOTICE', 'WARNING',
          ]).default('DEFAULT'),
          logName: z.literal(LOG_NAME),
          labels: z.object({ job_uid: z.literal(uid) }).passthrough(),
          resource: z.unknown().optional(),
          textPayload: z.string().max(64 * 1_024).optional(),
          jsonPayload: z.unknown().optional(),
          protoPayload: z.unknown().optional(),
        }).passthrough()).min(1).max(1_000),
        nextPageToken: z.union([z.literal(''), z.undefined()]).optional(),
      }).passthrough().parse(logsResponse.data)
      const entries = logs.entries.map((entry) => logEntrySchema.parse({
        insertId: entry.insertId,
        timestamp: entry.timestamp,
        severity: entry.severity,
        logName: entry.logName,
        batchJobUid: entry.labels.job_uid,
        payloadDigestSha256: sha256AuthorityValue({
          textPayload: entry.textPayload,
          jsonPayload: entry.jsonPayload,
          protoPayload: entry.protoPayload,
        }),
      })).sort(compareLogs)
      return platformObservationSchema.parse({
        batchJobResource: resource,
        batchJobUid: uid,
        batchState: job.status.state,
        runDuration: job.status.runDuration,
        taskCount: tasks.tasks.length,
        taskName,
        taskState: tasks.tasks[0].status.state,
        logFilter,
        logEntries: entries,
        logQueryFullyConsumed: true,
        batchVmFilter,
        batchVmQueryFullyConsumed: true,
        matchingBatchVmInstanceCount: matchingInstances.length,
        activeTaskCountAfterTerminalReread: 0,
        activeGpuResourceCountAfterTerminalReread: 0,
        exactJobTaskAndLogReread: true,
      })
    },
  })
}

export function assertCanonicalSam31QualificationLogEvidence(
  value: unknown,
): CanonicalSam31QualificationLogEvidence {
  assertPlainSerializedData(value, 'sam31_qualification_log_evidence')
  const parsed = canonicalSam31QualificationLogEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification log evidence hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationInternalCostReceipt(
  value: unknown,
): CanonicalSam31QualificationInternalCostReceipt {
  assertPlainSerializedData(value, 'sam31_qualification_internal_cost_receipt')
  const parsed = canonicalSam31QualificationInternalCostReceiptSchema.parse(
    value,
  )
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification internal cost hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationTerminalEvidence(
  value: unknown,
): CanonicalSam31QualificationTerminalEvidence {
  assertPlainSerializedData(value, 'sam31_qualification_terminal_evidence')
  const parsed = canonicalSam31QualificationTerminalEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification terminal evidence hash is invalid.')
  }
  return parsed
}

function assertLifecycle(input: {
  attemptId: string
  mount: CanonicalSam31QualificationA100MountObservation
  admission: CanonicalSam31QualificationA100Admission
  submission: CanonicalSam31QualificationA100Submission
  terminal: CanonicalSam31QualificationA100JobObservation
  result: CanonicalSam31QualificationResultEvidence
}): void {
  if (
    input.mount.attemptId !== input.attemptId
    || input.admission.attemptId !== input.attemptId
    || input.submission.attemptId !== input.attemptId
    || input.terminal.attemptId !== input.attemptId
    || input.result.attemptId !== input.attemptId
    || input.admission.qualificationId !== input.result.qualificationId
    || input.submission.admissionRef.contentHash !==
      `sha256:${input.admission.admissionHash}`
    || input.terminal.admissionRef.contentHash !==
      `sha256:${input.admission.admissionHash}`
    || input.terminal.submissionRef.contentHash !==
      `sha256:${input.submission.submissionHash}`
    || input.result.terminalJobObservationRef.contentHash !==
      `sha256:${input.terminal.observationHash}`
    || input.result.submissionRef.contentHash !==
      `sha256:${input.submission.submissionHash}`
    || input.submission.batchJobUid === null
    || input.terminal.batchState !== 'SUCCEEDED'
    || input.result.batchJobUid !== input.submission.batchJobUid
    || input.admission.billingClassification !==
      'platform_internal_qualification'
  ) throw new Error('SAM 3.1 qualification terminal lifecycle is incomplete.')
}

function assertExactA100Rate(
  value: unknown,
  admission: CanonicalSam31QualificationA100Admission,
  at: string,
): CanonicalCurrentGoogleCloudGpuRateAuthority {
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(value, at)
  if (
    rate.routeId !== 'a100_80gb_heavy_primary'
    || rate.region !== REGION
    || admission.accountEffectiveA100RateAuthorityRef.id !==
      rate.rateAuthorityId
    || admission.accountEffectiveA100RateAuthorityRef.version !==
      rate.rateAuthorityVersion
    || admission.accountEffectiveA100RateAuthorityRef.contentHash !==
      `sha256:${rate.rateAuthorityHash}`
  ) throw new Error('SAM 3.1 qualification terminal rate changed.')
  return rate
}

function createLogEvidence(input: {
  attemptId: string
  platform: CanonicalSam31QualificationTerminalPlatformObservation
  observedAt: string
}): CanonicalSam31QualificationLogEvidence {
  const payload = logEvidenceWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_LOG_EVIDENCE_VERSION,
    source: 'canonical_server_google_cloud_batch_sam3_1_qualification_log_owner',
    evidenceClass: 'canonical_private_reread',
    attemptId: input.attemptId,
    batchJobResource: input.platform.batchJobResource,
    batchJobUid: input.platform.batchJobUid,
    taskName: input.platform.taskName,
    logName: LOG_NAME,
    exactLogFilterDigestSha256:
      sha256AuthorityValue(input.platform.logFilter),
    orderedLogEntrySetDigestSha256:
      sha256AuthorityValue(input.platform.logEntries),
    logEntryCount: input.platform.logEntries.length,
    errorOrHigherLogEntryCount: 0,
    exactJobUidLabelAndSingleTerminalTaskReread: true,
    allReturnedLogEntriesConsumed: input.platform.logQueryFullyConsumed,
    callerLogFilterEntryPayloadOrSeverityAccepted: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31QualificationLogEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function createInternalCostReceipt(input: {
  attemptId: string
  platform: CanonicalSam31QualificationTerminalPlatformObservation
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  runNanoseconds: number
  probeWallMilliseconds: number
  probeCudaMilliseconds: number
  recordedAt: string
}): CanonicalSam31QualificationInternalCostReceipt {
  const machine = input.rate.components.find((component) =>
    component.componentClass === 'a2_ultragpu_1g_machine_bundle')
  if (!machine) throw new Error('A100 machine-bundle rate is missing.')
  const receiptId = `sam31-qualification-cost-${sha256AuthorityValue({
    attemptId: input.attemptId,
    batchJobUid: input.platform.batchJobUid,
    rateAuthorityHash: input.rate.rateAuthorityHash,
  }).slice(0, 32)}`
  const payload = internalCostWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_INTERNAL_COST_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_qualification_internal_compute_cost_owner',
    evidenceClass: 'canonical_private_reread',
    receiptId,
    attemptId: input.attemptId,
    batchJobResource: input.platform.batchJobResource,
    batchJobUid: input.platform.batchJobUid,
    rateAuthorityRef: ref(
      input.rate.rateAuthorityId,
      input.rate.rateAuthorityHash,
      input.rate.rateAuthorityVersion,
    ),
    routeId: input.rate.routeId,
    billingClassification: 'platform_internal_qualification',
    accountEffectivePricingReread: true,
    runDurationNanoseconds: input.runNanoseconds,
    deterministicProbeWallMilliseconds: input.probeWallMilliseconds,
    deterministicProbeCudaMilliseconds: input.probeCudaMilliseconds,
    a2UltraGpu1gMaximumUsdNanosPerMachineHour:
      machine.maximumUsdNanosPerBillingUnit,
    accountEffectiveRunDurationComputeEstimateUsdNanos: ceilProductDivision(
      machine.maximumUsdNanosPerBillingUnit,
      input.runNanoseconds,
      3_600_000_000_000,
    ),
    ancillaryStorageAndApiInvoiceReconciliationRequired: true,
    canonicalCloudBillingInvoiceActualObserved: false,
    customerEligibleCostUsdNanos: 0,
    customerCreditsReserved: 0,
    customerCreditsSpent: 0,
    customerWalletOrLedgerMutated: false,
    serviceFeeIncluded: false,
    callerUsagePriceCostOrCreditClaimAccepted: false,
    recordedAt: input.recordedAt,
  })
  return canonicalSam31QualificationInternalCostReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

async function persistExact(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  attemptId: string
  logEvidence: CanonicalSam31QualificationLogEvidence
  costReceipt: CanonicalSam31QualificationInternalCostReceipt
  evidence: CanonicalSam31QualificationTerminalEvidence
}): Promise<void> {
  const attemptHash = sha256AuthorityValue(input.attemptId)
  const records = [
    {
      path: `private/sam3_1/source-checkpoint-qualification/v1/logs/${attemptHash}.json`,
      value: input.logEvidence,
      assert: assertCanonicalSam31QualificationLogEvidence,
    },
    {
      path: `private/sam3_1/source-checkpoint-qualification/v1/costs/${attemptHash}.json`,
      value: input.costReceipt,
      assert: assertCanonicalSam31QualificationInternalCostReceipt,
    },
    {
      path: `private/sam3_1/source-checkpoint-qualification/v1/terminals/${attemptHash}.json`,
      value: input.evidence,
      assert: assertCanonicalSam31QualificationTerminalEvidence,
    },
  ] as const
  for (const record of records) {
    const body = Buffer.from(stableAuthorityStringify(record.value), 'utf8')
    await input.port.createOnly({
      objectPath: record.path,
      body,
      contentSha256: digest(body),
    })
    const reread = await input.port.readExact(record.path)
    if (!reread || !reread.equals(body)) {
      throw new Error('SAM 3.1 qualification terminal evidence changed.')
    }
    record.assert(JSON.parse(reread.toString('utf8')))
  }
}

function assertDependencies(input: {
  platformReadPort: CanonicalSam31QualificationTerminalPlatformReadPort
  rateReadPort: CanonicalSam31QualificationApprovedA100RateReadPort
  evidenceObjectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    input.platformReadPort?.schemaVersion !==
      CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION
    || typeof input.platformReadPort?.rereadExactTerminal !== 'function'
    || typeof input.rateReadPort?.rereadExactApprovedRate !== 'function'
    || typeof input.evidenceObjectPort?.createOnly !== 'function'
    || typeof input.evidenceObjectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification terminal dependencies invalid.')
}

function exactLogFilter(jobUid: string): string {
  return `logName="${LOG_NAME}" AND labels.job_uid="${jobUid}"`
}

function durationNanoseconds(value: string): number {
  duration.parse(value)
  const [whole, fraction = ''] = value.slice(0, -1).split('.')
  const nanoseconds = Number(
    BigInt(whole) * 1_000_000_000n
    + BigInt(fraction.padEnd(9, '0')),
  )
  if (
    !Number.isSafeInteger(nanoseconds)
    || nanoseconds < 1
    || nanoseconds > 7_200_000_000_000
  ) throw new Error('SAM 3.1 qualification run duration is invalid.')
  return nanoseconds
}

function ceilProductDivision(
  left: number,
  middle: number,
  divisor: number,
): number {
  const numerator = BigInt(left) * BigInt(middle)
  const quotient = (numerator + BigInt(divisor) - 1n) / BigInt(divisor)
  const result = Number(quotient)
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error('SAM 3.1 qualification cost exceeded safe bounds.')
  }
  return result
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function compareLogs(
  left: z.infer<typeof logEntrySchema>,
  right: z.infer<typeof logEntrySchema>,
): number {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp < right.timestamp ? -1 : 1
  }
  return left.insertId < right.insertId ? -1
    : left.insertId > right.insertId ? 1 : 0
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
