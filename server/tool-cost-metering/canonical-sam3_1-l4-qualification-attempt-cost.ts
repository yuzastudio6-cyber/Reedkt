import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31L4RuntimePrivateRunReceipt,
  type CanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from './canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  canonicalProfessionalGpuInfrastructureCostSchema,
  canonicalProfessionalToolGpuUsageSchema,
} from './canonical-professional-tool-gpu-cost-authority'

export const CANONICAL_SAM3_1_L4_QUALIFICATION_TERMINAL_OBSERVATION_VERSION =
  'canonical-sam3_1-l4-qualification-terminal-observation-v1' as const
export const CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_RECEIPT_VERSION =
  'canonical-sam3_1-l4-qualification-attempt-cost-receipt-v1' as const
export const CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_REPOSITORY_VERSION =
  'canonical-sam3_1-l4-qualification-attempt-cost-repository-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v3/terminal-attempt-cost'
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS =
  30 * 24 * 60 * 60 * 1_000
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const QUALIFICATION_CLASS_A_OPERATION_COUNT = 414
const QUALIFICATION_CLASS_B_OPERATION_COUNT = 1_220
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const runOrdinal = z.number().int().min(1).max(30)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>
const operationResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/operations\/[A-Za-z0-9._-]+$/u,
)
const executionResource = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-sam31-l4-fallback\/executions\/[a-z0-9-]+$/u,
)

const terminalObservationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_QUALIFICATION_TERMINAL_OBSERVATION_VERSION,
  ),
  source: z.literal('google_cloud_run_v2_terminal_execution_exact_reread'),
  evidenceClass: z.literal('canonical_private_reread'),
  qualificationId: safeId,
  runOrdinal,
  cloudRunOperationResource: operationResource,
  cloudRunExecutionResource: executionResource,
  executionCreateTime: timestamp,
  executionStartTime: timestamp,
  executionCompletionTime: timestamp,
  taskCount: z.literal(1),
  runningCount: z.literal(0),
  succeededCount: z.literal(1),
  failedCount: z.literal(0),
  cancelledCount: z.literal(0),
  retriedCount: z.literal(0),
  reconciling: z.literal(false),
  operationDone: z.literal(true),
  exactOperationAndExecutionReread: z.literal(true),
  terminalWorkerStopped: z.literal(true),
  activeGpuInstancesAfterTerminal: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  callerTerminalFieldsAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const create = Date.parse(value.executionCreateTime)
  const start = Date.parse(value.executionStartTime)
  const complete = Date.parse(value.executionCompletionTime)
  const observed = Date.parse(value.observedAt)
  if (create > start || start >= complete || complete > observed) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 L4 terminal timestamps are inconsistent.',
    })
  }
})
export const canonicalSam31L4QualificationTerminalObservationSchema =
  terminalObservationWithoutHashSchema.extend({ observationHash: sha256 })
    .strict()
export type CanonicalSam31L4QualificationTerminalObservation = z.infer<
  typeof canonicalSam31L4QualificationTerminalObservationSchema
>

const operationAccountingSchema = z.object({
  profileId: z.literal(
    'sam3_1_l4_private_qualification_gcs_operations_v1',
  ),
  profileRef: evidenceRefSchema,
  classAOperationCount: z.literal(QUALIFICATION_CLASS_A_OPERATION_COUNT),
  classBOperationCount: z.literal(QUALIFICATION_CLASS_B_OPERATION_COUNT),
  networkEgressBytes: z.literal(0),
  countsDerivedFromClosedQualificationOwnerFlow: z.literal(true),
  billingExportOperationCountUsed: z.literal(false),
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_l4_qualification_terminal_cost_owner',
  ),
  evidenceClass: z.literal(
    'canonical_terminal_usage_and_account_effective_price_reread',
  ),
  receiptId: safeId,
  qualificationId: safeId,
  runOrdinal,
  runReceiptRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  terminalObservationRef: evidenceRefSchema,
  currentAccountEffectiveRateAuthorityRef: evidenceRefSchema,
  currentAccountEffectiveRateAuthority: z.custom<
    CanonicalCurrentGoogleCloudGpuRateAuthority
  >(),
  operationAccounting: operationAccountingSchema,
  actualUsage: canonicalProfessionalToolGpuUsageSchema,
  actualInfrastructureCost:
    canonicalProfessionalGpuInfrastructureCostSchema,
  exactCloudRunOperationExecutionAndWorkerOutputReread: z.literal(true),
  exactCurrentBillingAccountPriceReread: z.literal(true),
  accountEffectiveCostRecorded: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  platformFundedQualification: z.literal(true),
  customerEligibleInfrastructureCostUsdNanos: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  customerWalletOrLedgerMutated: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  terminalWorkerStopped: z.literal(true),
  activeGpuInstancesAfterTerminal: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict().superRefine((value, context) => {
  const total = value.actualUsage.totalBillableMilliseconds
  const terminal = value.actualUsage.coldStartMilliseconds
    + value.actualUsage.runtimeAndModelLoadMilliseconds
    + value.actualUsage.activeGpuMilliseconds
    + value.actualUsage.drainAndShutdownMilliseconds
  if (total !== terminal) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 L4 terminal usage does not reconcile.',
  })
})
export const canonicalSam31L4QualificationAttemptCostReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31L4QualificationAttemptCostReceipt = z.infer<
  typeof canonicalSam31L4QualificationAttemptCostReceiptSchema
>

export function sealCanonicalSam31L4QualificationTerminalObservation(
  value: unknown,
): CanonicalSam31L4QualificationTerminalObservation {
  assertPlainSerializedData(value, 'sam31_l4_terminal_observation_build')
  const payload = terminalObservationWithoutHashSchema.parse(value)
  return assertCanonicalSam31L4QualificationTerminalObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31L4QualificationTerminalObservation(
  value: unknown,
): CanonicalSam31L4QualificationTerminalObservation {
  assertPlainSerializedData(value, 'sam31_l4_terminal_observation')
  const parsed = canonicalSam31L4QualificationTerminalObservationSchema
    .parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 L4 terminal observation hash changed.')
  }
  return Object.freeze(parsed)
}

export function createCanonicalSam31L4QualificationAttemptCostReceipt(input: {
  readonly receiptId: string
  readonly runReceipt: unknown
  readonly terminalObservation: unknown
  readonly currentRateAuthority: unknown
  readonly recordedAt: string
}): CanonicalSam31L4QualificationAttemptCostReceipt {
  assertPlainSerializedData(input, 'sam31_l4_attempt_cost_build')
  const run = assertCanonicalSam31L4RuntimePrivateRunReceipt(
    input.runReceipt,
  )
  const terminal = assertCanonicalSam31L4QualificationTerminalObservation(
    input.terminalObservation,
  )
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.currentRateAuthority,
    input.recordedAt,
  )
  assertExactLineage({ run, terminal, rate })
  const totalBillableMilliseconds = Date.parse(
    terminal.executionCompletionTime,
  ) - Date.parse(terminal.executionCreateTime)
  const coldStartMilliseconds = Date.parse(terminal.executionStartTime)
    - Date.parse(terminal.executionCreateTime)
  const activeGpuMilliseconds = run.wallTimeMilliseconds
  const drainAndShutdownMilliseconds = totalBillableMilliseconds
    - coldStartMilliseconds - activeGpuMilliseconds
  if (drainAndShutdownMilliseconds < 0) {
    throw new Error('SAM 3.1 L4 platform window is shorter than worker time.')
  }
  const operationAccounting = operationAccountingSchema.parse({
    profileId: 'sam3_1_l4_private_qualification_gcs_operations_v1',
    profileRef: opaqueRef(
      'sam31-l4-qualification-operation-accounting-v1',
      {
        classAOperationCount: QUALIFICATION_CLASS_A_OPERATION_COUNT,
        classBOperationCount: QUALIFICATION_CLASS_B_OPERATION_COUNT,
        networkEgressBytes: 0,
        flowVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v3',
      },
    ),
    classAOperationCount: QUALIFICATION_CLASS_A_OPERATION_COUNT,
    classBOperationCount: QUALIFICATION_CLASS_B_OPERATION_COUNT,
    networkEgressBytes: 0,
    countsDerivedFromClosedQualificationOwnerFlow: true,
    billingExportOperationCountUsed: false,
  })
  const usage = canonicalProfessionalToolGpuUsageSchema.parse({
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds: 0,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes:
      run.privateInputByteLength + run.workerOutputByteLength,
    privateArtifactRetentionMilliseconds:
      PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: operationAccounting.classAOperationCount,
    classBOperationCount: operationAccounting.classBOperationCount,
  })
  const cost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage,
    observedAt: input.recordedAt,
  })
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_RECEIPT_VERSION,
    source:
      'canonical_server_sam3_1_l4_qualification_terminal_cost_owner',
    evidenceClass:
      'canonical_terminal_usage_and_account_effective_price_reread',
    receiptId: input.receiptId,
    qualificationId: run.qualificationId,
    runOrdinal: run.runOrdinal,
    runReceiptRef: ref(
      `sam31-l4-run-receipt:${run.qualificationId}:`
        + String(run.runOrdinal).padStart(2, '0'),
      run.receiptHash,
    ),
    launchRef: run.launchRef,
    terminalObservationRef: ref(
      `sam31-l4-terminal:${run.qualificationId}:`
        + String(run.runOrdinal).padStart(2, '0'),
      terminal.observationHash,
    ),
    currentAccountEffectiveRateAuthorityRef:
      rateAuthorityRef(rate),
    currentAccountEffectiveRateAuthority: rate,
    operationAccounting,
    actualUsage: usage,
    actualInfrastructureCost: cost,
    exactCloudRunOperationExecutionAndWorkerOutputReread: true,
    exactCurrentBillingAccountPriceReread: true,
    accountEffectiveCostRecorded: true,
    publicListPriceUsedAsSettlementAuthority: false,
    platformFundedQualification: true,
    customerEligibleInfrastructureCostUsdNanos: 0,
    customerEligibleToolCostCredits: 0,
    serviceFeeIncluded: false,
    cloudBillingInvoiceReconciliationRequired: true,
    customerWalletOrLedgerMutated: false,
    unapprovedOverageChargedToCustomer: false,
    systemFailureOrUnknownCostChargedToCustomer: false,
    terminalWorkerStopped: true,
    activeGpuInstancesAfterTerminal: 0,
    scaleBackToZeroVerified: true,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    recordedAt: timestamp.parse(input.recordedAt),
  })
  return assertCanonicalSam31L4QualificationAttemptCostReceipt({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31L4QualificationAttemptCostReceipt(
  value: unknown,
): CanonicalSam31L4QualificationAttemptCostReceipt {
  assertPlainSerializedData(value, 'sam31_l4_attempt_cost_receipt')
  const receipt = canonicalSam31L4QualificationAttemptCostReceiptSchema
    .parse(value)
  const { receiptHash, ...payload } = receipt
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    receipt.currentAccountEffectiveRateAuthority,
    receipt.recordedAt,
  )
  const expectedCost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage: receipt.actualUsage,
    observedAt: receipt.recordedAt,
  })
  if (
    receiptHash !== sha256AuthorityValue(payload)
    || !sameRef(receipt.currentAccountEffectiveRateAuthorityRef,
      rateAuthorityRef(rate))
    || stableAuthorityStringify(receipt.actualInfrastructureCost)
      !== stableAuthorityStringify(expectedCost)
  ) throw new Error('SAM 3.1 L4 attempt cost receipt changed.')
  return Object.freeze(receipt)
}

export interface CanonicalSam31L4QualificationAttemptCostRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31L4QualificationAttemptCostReceipt
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly qualificationId: string
    readonly runOrdinal: number
  }): Promise<CanonicalSam31L4QualificationAttemptCostReceipt | null>
}

export function createCanonicalSam31L4QualificationAttemptCostRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31L4QualificationAttemptCostRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (qualificationId: string, ordinal: number) => {
    const id = safeId.parse(qualificationId)
    const run = runOrdinal.parse(ordinal)
    const body = await input.objectPort.readExact(recordPath(prefix, id, run))
    if (!body) return null
    const receipt = assertCanonicalSam31L4QualificationAttemptCostReceipt(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (receipt.qualificationId !== id || receipt.runOrdinal !== run
      || stableAuthorityStringify(receipt) !== body.toString('utf8')) {
      throw new Error('SAM 3.1 L4 attempt cost receipt bytes changed.')
    }
    return structuredClone(receipt)
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_L4_QUALIFICATION_ATTEMPT_COST_REPOSITORY_VERSION,
    async persistCreateOnly({ receipt: untrusted }: {
      receipt: CanonicalSam31L4QualificationAttemptCostReceipt
    }) {
      const receipt = assertCanonicalSam31L4QualificationAttemptCostReceipt(
        untrusted,
      )
      const body = serialize(receipt)
      const result = await input.objectPort.createOnly({
        objectPath: recordPath(
          prefix,
          receipt.qualificationId,
          receipt.runOrdinal,
        ),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(receipt.qualificationId, receipt.runOrdinal)
      if (!exact || exact.receiptHash !== receipt.receiptHash) {
        throw new Error('SAM 3.1 L4 attempt cost receipt reread changed.')
      }
      return result
    },
    reread({ qualificationId, runOrdinal: ordinal }: {
      qualificationId: string
      runOrdinal: number
    }) {
      return reread(qualificationId, ordinal)
    },
  })
}

function assertExactLineage(input: {
  run: CanonicalSam31L4RuntimePrivateRunReceipt
  terminal: CanonicalSam31L4QualificationTerminalObservation
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority
}): void {
  if (
    input.terminal.qualificationId !== input.run.qualificationId
    || input.terminal.runOrdinal !== input.run.runOrdinal
    || input.terminal.cloudRunOperationResource !==
      input.run.cloudRunOperationName
    || input.terminal.cloudRunExecutionResource !==
      input.run.cloudRunExecutionResource
    || input.rate.routeId !== 'l4_heavy_fallback'
    || input.rate.profileId !==
      'quality_l4_user_triggered_heavy_fallback_job_v1'
    || input.rate.routeRole !== 'heavy_fallback'
    || input.rate.executionTarget !== 'google_cloud_run_l4_job'
    || input.rate.machineType !== 'cloud_run_nvidia_l4'
    || input.rate.accelerator !== 'nvidia_l4'
    || input.rate.region !== 'us-central1'
    || !sameRef(
      input.run.currentL4FallbackRateAuthorityRef,
      rateAuthorityRef(input.rate),
    )
  ) throw new Error('SAM 3.1 L4 terminal cost lineage differs.')
}

function rateAuthorityRef(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
): EvidenceRef {
  return evidenceRefSchema.parse({
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  })
}

function ref(id: string, hash: string): EvidenceRef {
  return evidenceRefSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function opaqueRef(id: string, value: unknown): EvidenceRef {
  return ref(id, sha256AuthorityValue(value))
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function recordPath(prefix: string, qualificationId: string, ordinal: number) {
  const digest = createHash('sha256').update(qualificationId, 'utf8')
    .digest('hex')
  return `${prefix}/${digest}/run-${String(ordinal).padStart(2, '0')}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 L4 attempt cost receipt bytes are invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('SAM 3.1 L4 attempt cost repository is unavailable.')
  }
}
