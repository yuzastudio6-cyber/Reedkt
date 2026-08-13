import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  canonicalCurrentGoogleCloudGpuRateAuthoritySchema,
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  canonicalProfessionalGpuInfrastructureCostSchema,
  canonicalProfessionalToolGpuUsageSchema,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  type CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  type CanonicalSam31EightMinuteQualificationSourceRepository,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  type CanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
} from './canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationLaunch,
  type CanonicalSam31EightMinuteSourcePreparationLaunch,
  type CanonicalSam31EightMinuteSourcePreparationLaunchRepository,
  getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef,
} from './canonical-sam3_1-eight-minute-source-preparation-launch-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_PORT_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-terminal-port-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-terminal-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_REPOSITORY_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-terminal-repository-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_OWNER_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-terminal-owner-v1' as const

const JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const PRIVATE_RETENTION_MILLISECONDS = 604_800_000 as const
const MAXIMUM_CLASS_A_OPERATION_COUNT = 2_000 as const
const MAXIMUM_CLASS_B_OPERATION_COUNT = 2_000 as const
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-eight-minute-source-preparation-terminals'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
const operationResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/operations\/[A-Za-z0-9._-]+$/u,
)
const executionResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/jobs\/weeditpro-sam31-source-prep-l4\/executions\/[a-z][a-z0-9-]{0,62}$/u,
)

const cloudTerminalSuccessSchema = z.object({
  disposition: z.literal('succeeded'),
  cloudRunOperationResource: operationResourceSchema,
  cloudRunExecutionResource: executionResourceSchema,
  cloudRunOperationRef: refSchema,
  cloudRunExecutionRef: refSchema,
  cloudRunJobDefinitionRef: refSchema,
  capacityTeardownObservationRef: refSchema,
  executionCreateTime: timestamp,
  executionStartTime: timestamp,
  executionCompletionTime: timestamp,
  observedAt: timestamp,
  exactOperationExecutionJobDefinitionAndCapacityReread: z.literal(true),
  activeGpuExecutionsAfterObservation: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
}).strict().superRefine((value, context) => {
  const create = Date.parse(value.executionCreateTime)
  const start = Date.parse(value.executionStartTime)
  const complete = Date.parse(value.executionCompletionTime)
  const observed = Date.parse(value.observedAt)
  if (create > start || start >= complete || complete > observed) {
    context.addIssue({
      code: 'custom',
      message: 'SAM source-preparation terminal times changed.',
    })
  }
})
const cloudTerminalResultSchema = z.discriminatedUnion('disposition', [
  z.object({
    disposition: z.literal('pending'),
    observedAt: timestamp,
  }).strict(),
  z.object({
    disposition: z.literal('failed_or_unknown_requires_reconciliation'),
    observedAt: timestamp,
  }).strict(),
  cloudTerminalSuccessSchema,
])
export type CanonicalSam31EightMinuteSourcePreparationCloudTerminalResult =
  z.infer<typeof cloudTerminalResultSchema>

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_terminal_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_terminal_artifact_usage_and_rate_reread',
  ),
  invocationId: safeId,
  launchRef: refSchema,
  admissionRef: refSchema,
  consumptionRef: refSchema,
  releaseRef: refSchema,
  qualificationSourcePlanRef: refSchema,
  preparationRef: refSchema,
  cloudRunOperationRef: refSchema,
  cloudRunExecutionRef: refSchema,
  cloudRunJobDefinitionRef: refSchema,
  capacityTeardownObservationRef: refSchema,
  currentAccountEffectiveRateAuthorityRef: refSchema,
  currentAccountEffectiveRateAuthority:
    canonicalCurrentGoogleCloudGpuRateAuthoritySchema,
  usage: canonicalProfessionalToolGpuUsageSchema,
  provisionalAccountEffectiveInfrastructureCostCeiling:
    canonicalProfessionalGpuInfrastructureCostSchema,
  maximumApprovedInternalBudgetUsdNanos:
    z.number().int().positive().safe(),
  exactPreparedChunkCount: z.literal(49),
  exactPreparedArtifactBytes: z.number().int().positive().safe(),
  provisionalOperationAccounting: z.object({
    classAOperationCountCeiling: z.literal(MAXIMUM_CLASS_A_OPERATION_COUNT),
    classBOperationCountCeiling: z.literal(MAXIMUM_CLASS_B_OPERATION_COUNT),
    usesPreapprovedFailClosedOperationBounds: z.literal(true),
    actualOperationCountClaimed: z.literal(false),
  }).strict(),
  exactLaunchAdmissionConsumptionReleasePreparationTerminalAndRateReread:
    z.literal(true),
  terminalWorkerStopped: z.literal(true),
  activeGpuExecutionsAfterObservation: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  sourcePreparationReadyForA100QualificationInput: z.literal(true),
  billingExportInvoiceReconciliationRequired: z.literal(true),
  actualInvoiceCostClaimed: z.literal(false),
  platformFundedPrivateQualification: z.literal(true),
  customerEligibleInfrastructureCostUsdNanos: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  qaApproved: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  executionCreateTime: timestamp,
  executionStartTime: timestamp,
  executionCompletionTime: timestamp,
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const calculated = value.usage.coldStartMilliseconds
    + value.usage.runtimeAndModelLoadMilliseconds
    + value.usage.activeGpuMilliseconds
    + value.usage.drainAndShutdownMilliseconds
  if (value.usage.totalBillableMilliseconds !== calculated
    || value.usage.privateArtifactBytes !== value.exactPreparedArtifactBytes
    || value.usage.privateArtifactRetentionMilliseconds !==
      PRIVATE_RETENTION_MILLISECONDS
    || value.usage.classAOperationCount !==
      MAXIMUM_CLASS_A_OPERATION_COUNT
    || value.usage.classBOperationCount !==
      MAXIMUM_CLASS_B_OPERATION_COUNT
    || value.provisionalAccountEffectiveInfrastructureCostCeiling
      .totalInfrastructureCostUsdNanos >
      value.maximumApprovedInternalBudgetUsdNanos) {
    context.addIssue({
      code: 'custom',
      message: 'SAM source-preparation terminal cost bounds changed.',
    })
  }
})
const terminalSchema = terminalWithoutHashSchema.extend({
  terminalHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationTerminal = z.infer<
  typeof terminalSchema
>

const repositoryRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_REPOSITORY_VERSION,
  ),
  recordKind: z.literal('sam3_1_source_preparation_terminal'),
  terminal: terminalSchema,
}).strict()
const repositoryRecordSchema = repositoryRecordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()

export interface CanonicalSam31EightMinuteSourcePreparationTerminalPort {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_PORT_VERSION
  reread(input: {
    readonly launch: CanonicalSam31EightMinuteSourcePreparationLaunch
    readonly release: Parameters<
      typeof getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef
    >[0]['release']
  }): Promise<CanonicalSam31EightMinuteSourcePreparationCloudTerminalResult>
}

export interface CanonicalSam31EightMinuteSourcePreparationTerminalRepository {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly terminal: CanonicalSam31EightMinuteSourcePreparationTerminal
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly invocationId: string
  }): Promise<CanonicalSam31EightMinuteSourcePreparationTerminal | null>
}

export type CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult =
  | Readonly<{
      status: 'pending'
      blockerCode:
        | 'sam31_source_preparation_launch_not_ready'
        | 'sam31_source_preparation_cloud_run_not_terminal'
      automaticRetryAllowed: false
      customerCreditsMutated: false
    }>
  | Readonly<{
      status: 'reconciliation_required'
      blockerCode:
        | 'sam31_source_preparation_terminal_outcome_not_successful'
        | 'sam31_source_preparation_terminal_artifact_missing'
        | 'sam31_source_preparation_terminal_rate_missing'
      automaticRetryAllowed: false
      customerCreditsMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      invocationId: string
      terminalRef: EvidenceRef
      preparationRef: EvidenceRef
      provisionalAccountEffectiveInfrastructureCostCeilingUsdNanos: number
      sourcePreparationReadyForA100QualificationInput: true
      billingExportInvoiceReconciliationRequired: true
      actualInvoiceCostClaimed: false
      customerCreditsMutated: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSam31EightMinuteSourcePreparationTerminalOwner {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_OWNER_VERSION
  readonly automaticRetryAllowed: false
  readonly customerCreditMutationAllowed: false
  reconcile(input: unknown): Promise<
    CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult
  >
}

export function createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly now?: () => string
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalSam31EightMinuteSourcePreparationTerminalPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new TypeError('SAM source-preparation terminal timeout is invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_PORT_VERSION,
    async reread({ launch: rawLaunch, release }: {
      readonly launch: CanonicalSam31EightMinuteSourcePreparationLaunch
      readonly release: Parameters<
        typeof getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef
      >[0]['release']
    }) {
      const launch = assertCanonicalSam31EightMinuteSourcePreparationLaunch(
        rawLaunch,
      )
      if (launch.disposition !== 'accepted'
        || !launch.cloudRunOperationResource
        || !launch.cloudRunOperationRef
        || !launch.cloudRunJobDefinitionRef) {
        return cloudTerminalResultSchema.parse({
          disposition: 'failed_or_unknown_requires_reconciliation',
          observedAt: now(),
        })
      }
      const operationResponse = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/`
          + launch.cloudRunOperationResource,
        method: 'GET', timeout, retry: false, maxRedirects: 0,
      })
      assertPlainSerializedData(operationResponse.data,
        'sam31_source_prep_terminal_operation')
      const operation = z.object({
        name: z.literal(launch.cloudRunOperationResource),
        done: z.boolean().optional().default(false),
        response: z.object({ name: executionResourceSchema })
          .passthrough().optional(),
        error: z.unknown().optional(),
      }).passthrough().parse(operationResponse.data)
      const observedAt = timestamp.parse(now())
      if (!operation.done) return cloudTerminalResultSchema.parse({
        disposition: 'pending', observedAt,
      })
      if (operation.error !== undefined || !operation.response
        || !operation.response.name.startsWith(
          `${JOB_RESOURCE}/executions/`,
        )) return cloudTerminalResultSchema.parse({
        disposition: 'failed_or_unknown_requires_reconciliation',
        observedAt,
      })
      const executionResponse = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/${operation.response.name}`,
        method: 'GET', timeout, retry: false, maxRedirects: 0,
      })
      const execution = parseSuccessfulExecution(executionResponse.data,
        operation.response.name)
      const definitionResponse = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/${JOB_RESOURCE}`,
        method: 'GET', timeout, retry: false, maxRedirects: 0,
      })
      const definitionRef =
        getCanonicalSam31EightMinuteSourcePreparationCloudRunJobDefinitionRef({
          untrusted: definitionResponse.data,
          release,
        })
      if (!sameRef(definitionRef, launch.cloudRunJobDefinitionRef)) {
        throw new TypeError('SAM source-preparation job definition changed.')
      }
      const capacityResponse = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/${JOB_RESOURCE}/executions?pageSize=100`,
        method: 'GET', timeout, retry: false, maxRedirects: 0,
      })
      const capacity = parseZeroCapacity(capacityResponse.data)
      const operationRef = opaqueRef(
        `${launch.invocationId}:terminal-operation`,
        { operation, launchHash: launch.launchHash },
      )
      const executionRef = opaqueRef(
        `${launch.invocationId}:terminal-execution`,
        { execution, launchHash: launch.launchHash },
      )
      return cloudTerminalResultSchema.parse({
        disposition: 'succeeded',
        cloudRunOperationResource: operation.name,
        cloudRunExecutionResource: execution.name,
        cloudRunOperationRef: operationRef,
        cloudRunExecutionRef: executionRef,
        cloudRunJobDefinitionRef: definitionRef,
        capacityTeardownObservationRef: opaqueRef(
          `${launch.invocationId}:capacity-teardown`,
          capacity,
        ),
        executionCreateTime: execution.createTime,
        executionStartTime: execution.startTime,
        executionCompletionTime: execution.completionTime,
        observedAt,
        exactOperationExecutionJobDefinitionAndCapacityReread: true,
        activeGpuExecutionsAfterObservation: 0,
        scaleBackToZeroVerified: true,
      })
    },
  })
}

export function assertCanonicalSam31EightMinuteSourcePreparationTerminal(
  value: unknown,
): CanonicalSam31EightMinuteSourcePreparationTerminal {
  assertPlainSerializedData(value, 'sam31_source_prep_terminal')
  const terminal = terminalSchema.parse(value)
  const { terminalHash, ...payload } = terminal
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    terminal.currentAccountEffectiveRateAuthority,
    terminal.observedAt,
  )
  const expectedCost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage: terminal.usage,
    observedAt: terminal.observedAt,
  })
  if (terminalHash !== sha256AuthorityValue(payload)
    || terminal.currentAccountEffectiveRateAuthorityRef.id !==
      rate.rateAuthorityId
    || terminal.currentAccountEffectiveRateAuthorityRef.version !==
      rate.rateAuthorityVersion
    || terminal.currentAccountEffectiveRateAuthorityRef.contentHash !==
      `sha256:${rate.rateAuthorityHash}`
    || stableAuthorityStringify(expectedCost) !== stableAuthorityStringify(
      terminal.provisionalAccountEffectiveInfrastructureCostCeiling,
    )) throw new TypeError('SAM source-preparation terminal changed.')
  return freeze(structuredClone(terminal))
}

export function createCanonicalSam31EightMinuteSourcePreparationTerminalRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31EightMinuteSourcePreparationTerminalRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM source-preparation terminal store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (invocationId: string) => {
    const id = safeId.parse(invocationId)
    const body = await input.objectPort.readExact(`${prefix}/${id}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM source-preparation terminal bytes changed.')
    }
    const decoded = JSON.parse(body.toString('utf8')) as unknown
    assertPlainSerializedData(decoded, 'sam31_source_prep_terminal_record')
    const record = repositoryRecordSchema.parse(decoded)
    const { recordHash, ...payload } = record
    const terminal = assertCanonicalSam31EightMinuteSourcePreparationTerminal(
      record.terminal,
    )
    if (recordHash !== sha256AuthorityValue(payload)
      || terminal.invocationId !== id
      || stableAuthorityStringify(record) !== body.toString('utf8')) {
      throw new TypeError('SAM source-preparation terminal record changed.')
    }
    return terminal
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_REPOSITORY_VERSION,
    async persistCreateOnly({ terminal: untrusted }: {
      readonly terminal: CanonicalSam31EightMinuteSourcePreparationTerminal
    }) {
      const terminal = assertCanonicalSam31EightMinuteSourcePreparationTerminal(
        untrusted,
      )
      const payload = repositoryRecordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_REPOSITORY_VERSION,
        recordKind: 'sam3_1_source_preparation_terminal',
        terminal,
      })
      const record = repositoryRecordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${terminal.invocationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(terminal.invocationId)
      if (!exact || exact.terminalHash !== terminal.terminalHash) {
        throw new TypeError('SAM source-preparation terminal reread changed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread: ({ invocationId }: { readonly invocationId: string }) =>
      reread(invocationId),
  })
}

export function createCanonicalSam31EightMinuteSourcePreparationTerminalOwner(
  input: {
    readonly authorityRepository:
      CanonicalSam31EightMinuteSourcePreparationAuthorityRepository
    readonly launchRepository:
      CanonicalSam31EightMinuteSourcePreparationLaunchRepository
    readonly sourceRepository: Pick<
      CanonicalSam31EightMinuteQualificationSourceRepository,
      'rereadPreparation'
    >
    readonly rateRepository: Pick<
      CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
      'rereadApprovedCurrentRate'
    >
    readonly terminalPort:
      CanonicalSam31EightMinuteSourcePreparationTerminalPort
    readonly terminalRepository:
      CanonicalSam31EightMinuteSourcePreparationTerminalRepository
  },
): CanonicalSam31EightMinuteSourcePreparationTerminalOwner {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_OWNER_VERSION,
    automaticRetryAllowed: false as const,
    customerCreditMutationAllowed: false as const,
    async reconcile(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_source_prep_terminal_request')
      const request = z.object({ invocationId: safeId }).strict()
        .parse(untrusted)
      const existing = await input.terminalRepository.reread(request)
      if (existing) return project(existing, 'identical_replay')
      const launch = await input.launchRepository.reread(request)
      if (!launch || launch.disposition !== 'accepted') return pending(
        'sam31_source_preparation_launch_not_ready',
      )
      const consumed = await input.authorityRepository
        .rereadConsumedAdmission(request)
      if (!consumed) return pending(
        'sam31_source_preparation_launch_not_ready',
      )
      const cloud = await input.terminalPort.reread({
        launch,
        release: consumed.release,
      })
      if (cloud.disposition === 'pending') return pending(
        'sam31_source_preparation_cloud_run_not_terminal',
      )
      if (cloud.disposition !== 'succeeded') return reconciliation(
        'sam31_source_preparation_terminal_outcome_not_successful',
      )
      const preparationId =
        `${consumed.admission.qualificationSourcePlanRef.id}:preparation:`
        + request.invocationId
      const preparationRaw = await input.sourceRepository.rereadPreparation({
        preparationId,
      })
      if (!preparationRaw) return reconciliation(
        'sam31_source_preparation_terminal_artifact_missing',
      )
      const preparation =
        parseCanonicalSam31EightMinuteQualificationSourcePreparation(
          preparationRaw,
        )
      if (preparation.qualificationSourcePlanRef.contentHash !==
          consumed.admission.qualificationSourcePlanRef.contentHash
        || preparation.exactEightMinuteSourceRef.contentHash !==
          consumed.admission.exactEightMinuteSourceRef.contentHash
        || preparation.preparedChunkCount !== 49) {
        throw new TypeError('SAM source-preparation terminal artifact changed.')
      }
      const rate = await input.rateRepository.rereadApprovedCurrentRate({
        rateAuthorityRef: consumed.admission.currentAccountRateAuthorityRef,
        routeId: 'l4_standard_primary',
        at: cloud.observedAt,
      })
      if (!rate) return reconciliation(
        'sam31_source_preparation_terminal_rate_missing',
      )
      const terminal = buildTerminal({
        launch,
        consumed,
        cloud,
        preparation,
        rate,
      })
      const disposition = await input.terminalRepository.persistCreateOnly({
        terminal,
      })
      const exact = await input.terminalRepository.reread(request)
      if (!exact || exact.terminalHash !== terminal.terminalHash) {
        throw new TypeError('SAM source-preparation terminal exact reread changed.')
      }
      return project(exact, disposition)
    },
  })
}

function buildTerminal(input: {
  launch: CanonicalSam31EightMinuteSourcePreparationLaunch
  consumed: NonNullable<Awaited<ReturnType<
    CanonicalSam31EightMinuteSourcePreparationAuthorityRepository[
      'rereadConsumedAdmission'
    ]
  >>>
  cloud: z.infer<typeof cloudTerminalSuccessSchema>
  preparation: ReturnType<
    typeof parseCanonicalSam31EightMinuteQualificationSourcePreparation
  >
  rate: NonNullable<Awaited<ReturnType<
    CanonicalCurrentGoogleCloudGpuRateAuthorityRepository[
      'rereadApprovedCurrentRate'
    ]
  >>>
}): CanonicalSam31EightMinuteSourcePreparationTerminal {
  const coldStartMilliseconds = Date.parse(input.cloud.executionStartTime)
    - Date.parse(input.cloud.executionCreateTime)
  const activeGpuMilliseconds = Date.parse(input.cloud.executionCompletionTime)
    - Date.parse(input.cloud.executionStartTime)
  const totalBillableMilliseconds = coldStartMilliseconds
    + activeGpuMilliseconds
  const exactPreparedArtifactBytes = input.preparation.preparedChunks.reduce(
    (total, chunk) => total + chunk.byteLength,
    0,
  )
  const usage = canonicalProfessionalToolGpuUsageSchema.parse({
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds: 0,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds: 0,
    totalBillableMilliseconds,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: exactPreparedArtifactBytes,
    privateArtifactRetentionMilliseconds: PRIVATE_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: MAXIMUM_CLASS_A_OPERATION_COUNT,
    classBOperationCount: MAXIMUM_CLASS_B_OPERATION_COUNT,
  })
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.rate,
    input.cloud.observedAt,
  )
  const cost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage,
    observedAt: input.cloud.observedAt,
  })
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TERMINAL_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_terminal_owner',
    evidenceClass:
      'canonical_private_terminal_artifact_usage_and_rate_reread',
    invocationId: input.launch.invocationId,
    launchRef: ref(input.launch.invocationId, input.launch.launchHash),
    admissionRef: ref(input.consumed.admission.admissionId,
      input.consumed.admission.admissionHash),
    consumptionRef: ref(
      `${input.launch.invocationId}:consumption`,
      input.consumed.consumption.consumptionHash,
    ),
    releaseRef: input.consumed.admission.releaseRef,
    qualificationSourcePlanRef:
      input.preparation.qualificationSourcePlanRef,
    preparationRef: ref(input.preparation.preparationId,
      input.preparation.preparationHash),
    cloudRunOperationRef: input.cloud.cloudRunOperationRef,
    cloudRunExecutionRef: input.cloud.cloudRunExecutionRef,
    cloudRunJobDefinitionRef: input.cloud.cloudRunJobDefinitionRef,
    capacityTeardownObservationRef:
      input.cloud.capacityTeardownObservationRef,
    currentAccountEffectiveRateAuthorityRef:
      input.consumed.admission.currentAccountRateAuthorityRef,
    currentAccountEffectiveRateAuthority: rate,
    usage,
    provisionalAccountEffectiveInfrastructureCostCeiling: cost,
    maximumApprovedInternalBudgetUsdNanos:
      input.consumed.admission.maximumApprovedInternalBudgetUsdNanos,
    exactPreparedChunkCount: 49,
    exactPreparedArtifactBytes,
    provisionalOperationAccounting: {
      classAOperationCountCeiling: MAXIMUM_CLASS_A_OPERATION_COUNT,
      classBOperationCountCeiling: MAXIMUM_CLASS_B_OPERATION_COUNT,
      usesPreapprovedFailClosedOperationBounds: true,
      actualOperationCountClaimed: false,
    },
    exactLaunchAdmissionConsumptionReleasePreparationTerminalAndRateReread:
      true,
    terminalWorkerStopped: true,
    activeGpuExecutionsAfterObservation: 0,
    scaleBackToZeroVerified: true,
    sourcePreparationReadyForA100QualificationInput: true,
    billingExportInvoiceReconciliationRequired: true,
    actualInvoiceCostClaimed: false,
    platformFundedPrivateQualification: true,
    customerEligibleInfrastructureCostUsdNanos: 0,
    customerEligibleToolCostCredits: 0,
    serviceFeeIncluded: false,
    customerWalletOrLedgerMutated: false,
    unapprovedOverageChargedToCustomer: false,
    systemFailureOrUnknownCostChargedToCustomer: false,
    automaticRetryAllowed: false,
    qaApproved: false,
    runtimeReleaseGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    executionCreateTime: input.cloud.executionCreateTime,
    executionStartTime: input.cloud.executionStartTime,
    executionCompletionTime: input.cloud.executionCompletionTime,
    observedAt: input.cloud.observedAt,
  })
  return assertCanonicalSam31EightMinuteSourcePreparationTerminal({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
}

function parseSuccessfulExecution(value: unknown, expectedName: string) {
  assertPlainSerializedData(value, 'sam31_source_prep_terminal_execution')
  const parsed = z.object({
    name: z.literal(expectedName),
    job: z.union([z.literal(JOB_RESOURCE),
      z.literal('weeditpro-sam31-source-prep-l4')]),
    createTime: timestamp,
    startTime: timestamp,
    completionTime: timestamp,
    taskCount: z.union([z.literal(1), z.literal('1')]),
    reconciling: z.literal(false).optional().default(false),
    runningCount: z.union([z.literal(0), z.literal('0')])
      .optional().default(0),
    succeededCount: z.union([z.literal(1), z.literal('1')]),
    failedCount: z.union([z.literal(0), z.literal('0')])
      .optional().default(0),
    cancelledCount: z.union([z.literal(0), z.literal('0')])
      .optional().default(0),
    retriedCount: z.union([z.literal(0), z.literal('0')])
      .optional().default(0),
    conditions: z.array(z.object({
      type: z.string().trim().min(1).max(80),
      state: z.string().trim().min(1).max(80),
    }).passthrough()).min(1).max(32),
  }).passthrough().parse(value)
  const completed = parsed.conditions.find((condition) =>
    condition.type === 'Completed')
  if (!completed || (completed.state !== 'CONDITION_SUCCEEDED'
    && completed.state !== 'True')) {
    throw new TypeError(
      'SAM source-preparation execution did not complete successfully.',
    )
  }
  return Object.freeze({
    name: executionResourceSchema.parse(parsed.name),
    createTime: parsed.createTime,
    startTime: parsed.startTime,
    completionTime: parsed.completionTime,
    taskCount: Number(parsed.taskCount),
    reconciling: parsed.reconciling,
    runningCount: Number(parsed.runningCount),
    succeededCount: Number(parsed.succeededCount),
    failedCount: Number(parsed.failedCount),
    cancelledCount: Number(parsed.cancelledCount),
    retriedCount: Number(parsed.retriedCount),
  })
}

function parseZeroCapacity(value: unknown) {
  assertPlainSerializedData(value, 'sam31_source_prep_zero_capacity')
  const parsed = z.object({
    executions: z.array(z.object({
      name: executionResourceSchema,
      reconciling: z.literal(false).optional().default(false),
      runningCount: z.union([z.literal(0), z.literal('0')])
        .optional().default(0),
    }).passthrough()).max(100).optional().default([]),
    nextPageToken: z.union([z.literal(''), z.undefined()]).optional(),
  }).passthrough().parse(value)
  if (parsed.executions.some((execution) => execution.reconciling
    || Number(execution.runningCount) !== 0)) {
    throw new TypeError('SAM source-preparation GPU capacity remains active.')
  }
  return Object.freeze({
    jobResource: JOB_RESOURCE,
    executionCount: parsed.executions.length,
    executionRefs: parsed.executions.map((execution) => execution.name),
    fullPageReread: true as const,
    activeGpuExecutions: 0 as const,
    scaleBackToZeroVerified: true as const,
  })
}

function project(
  terminal: CanonicalSam31EightMinuteSourcePreparationTerminal,
  disposition: 'created' | 'identical_replay',
): CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult {
  return freeze({
    status: 'ready' as const,
    disposition,
    invocationId: terminal.invocationId,
    terminalRef: ref(terminal.invocationId, terminal.terminalHash),
    preparationRef: terminal.preparationRef,
    provisionalAccountEffectiveInfrastructureCostCeilingUsdNanos:
      terminal.provisionalAccountEffectiveInfrastructureCostCeiling
        .totalInfrastructureCostUsdNanos,
    sourcePreparationReadyForA100QualificationInput: true as const,
    billingExportInvoiceReconciliationRequired: true as const,
    actualInvoiceCostClaimed: false as const,
    customerCreditsMutated: false as const,
    productionAuthorityGranted: false as const,
  })
}

function pending(
  blockerCode: Extract<
    CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult,
    { status: 'pending' }
  >['blockerCode'],
): CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult {
  return Object.freeze({
    status: 'pending' as const,
    blockerCode,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
  })
}

function reconciliation(
  blockerCode: Extract<
    CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult,
    { status: 'reconciliation_required' }
  >['blockerCode'],
): CanonicalSam31EightMinuteSourcePreparationTerminalOwnerResult {
  return Object.freeze({
    status: 'reconciliation_required' as const,
    blockerCode,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
  })
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return Object.freeze(refSchema.parse({
    id, version, contentHash: `sha256:${hash}`,
  }))
}

function opaqueRef(id: string, value: unknown): EvidenceRef {
  return ref(id, sha256AuthorityValue(value))
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child)
    }
  }
  return value
}
