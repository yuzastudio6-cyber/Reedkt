import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuJobLaunch,
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
  canonicalProfessionalGpuTerminalObservationSchema,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_EXECUTION_BINDING_VERSION =
  'canonical-professional-google-cloud-gpu-execution-binding-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_EVIDENCE_VERSION =
  'canonical-professional-gpu-terminal-cost-evidence-v1' as const

const PROJECT_ID = 'reeditpro' as const
const BATCH_API_ORIGIN = 'https://batch.googleapis.com' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const launchRefShape = {
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_EXECUTION_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_cloud_execution_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema,
  projectId: z.literal(PROJECT_ID),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  providerExecutionPersistedBeforeTerminalRead: z.literal(true),
  callerProviderResourceAccepted: z.literal(false),
  browserLocalStateAccepted: z.literal(false),
}

const a100ExecutionBindingSchema = z.object({
  ...launchRefShape,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
  accelerator: z.literal('nvidia_a100_80gb'),
  providerJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
  ),
  providerJobUid: safeId,
  bindingHash: sha256,
}).strict().superRefine((binding, context) => {
  if (!binding.providerJobResource.startsWith(
    `projects/${PROJECT_ID}/locations/${binding.runtimeRegion}/jobs/`,
  )) context.addIssue({
    code: 'custom',
    message: 'A100 execution binding lost exact region scope.',
  })
})

const l4ExecutionBindingSchema = z.object({
  ...launchRefShape,
  routeId: z.enum(['l4_heavy_fallback', 'l4_standard_primary']),
  executionTarget: z.literal('google_cloud_run_l4_job'),
  accelerator: z.literal('nvidia_l4'),
  providerOperationResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
  ),
  expectedCloudRunJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
  ),
  bindingHash: sha256,
}).strict().superRefine((binding, context) => {
  const prefix = `projects/${PROJECT_ID}/locations/`
    + `${binding.runtimeRegion}/`
  if (
    !binding.providerOperationResource.startsWith(`${prefix}operations/`)
    || !binding.expectedCloudRunJobResource.startsWith(`${prefix}jobs/`)
  ) context.addIssue({
    code: 'custom',
    message: 'L4 execution binding lost exact region scope.',
  })
})

export const canonicalProfessionalGoogleCloudGpuExecutionBindingSchema =
  z.discriminatedUnion('executionTarget', [
    a100ExecutionBindingSchema,
    l4ExecutionBindingSchema,
  ])
export type CanonicalProfessionalGoogleCloudGpuExecutionBinding = z.infer<
  typeof canonicalProfessionalGoogleCloudGpuExecutionBindingSchema
>

const terminalCostEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_TERMINAL_COST_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_usage_price_and_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchRef: evidenceRefSchema,
  cloudProviderTerminalRef: evidenceRefSchema,
  cloudCapacityTeardownObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  currentAccountPriceAuthorityRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  exactPlatformUsageReread: z.literal(true),
  exactCurrentAccountPriceReread: z.literal(true),
  attemptCostReceiptPersistedBeforeSettlement: z.literal(true),
  providerCapacityOrExecutionRunningCountReread: z.literal(true),
  activeGpuResourcesAfterObservation: z.literal(0),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  callerOrPlanCostClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()
export const canonicalProfessionalGpuTerminalCostEvidenceSchema =
  terminalCostEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalProfessionalGpuTerminalCostEvidence = z.infer<
  typeof canonicalProfessionalGpuTerminalCostEvidenceSchema
>

export interface CanonicalProfessionalGoogleCloudGpuExecutionReadPort {
  rereadPrivateExecutionBinding(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuTerminalCostEvidenceReadPort {
  rereadUsagePriceAndCostEvidence(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
    readonly cloudProviderTerminalRef: z.infer<typeof evidenceRefSchema>
    readonly terminalOutcome: 'completed' | 'failed' | 'canceled'
  }): Promise<unknown>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createGoogleCloudProfessionalGpuTerminalObservationPort(
  input: {
    readonly executionReadPort:
      CanonicalProfessionalGoogleCloudGpuExecutionReadPort
    readonly costEvidenceReadPort:
      CanonicalProfessionalGpuTerminalCostEvidenceReadPort
    readonly auth?: GoogleAuthRequest
    readonly now?: () => string
    readonly requestTimeoutMilliseconds?: number
  },
): CanonicalProfessionalGpuTerminalObservationPort {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const requestTimeoutMilliseconds =
    input.requestTimeoutMilliseconds ?? 15_000
  if (
    !Number.isInteger(requestTimeoutMilliseconds)
    || requestTimeoutMilliseconds < 1_000
    || requestTimeoutMilliseconds > 30_000
  ) throw new Error('GPU terminal-read timeout is invalid.')

  return Object.freeze({
    async rereadTerminalUsagePriceAndCost({
      launch: untrustedLaunch,
    }: {
      readonly launch: CanonicalProfessionalGpuJobLaunch
    }) {
      const launch = assertCanonicalProfessionalGpuJobLaunch(untrustedLaunch)
      if (
        launch.launchDisposition !== 'job_created'
        || launch.cloudJobExecutionRef === null
      ) throw new Error(
        'GPU terminal read requires one canonically created cloud job.',
      )
      const binding = assertExecutionBinding(
        await input.executionReadPort.rereadPrivateExecutionBinding({ launch }),
      )
      assertBindingMatchesLaunch({ binding, launch })
      const providerTerminal = binding.executionTarget ===
        'google_cloud_batch_a2_ultra_job'
        ? await rereadA100BatchTerminal({
          auth,
          binding,
          requestTimeoutMilliseconds,
        })
        : await rereadL4CloudRunTerminal({
          auth,
          binding,
          requestTimeoutMilliseconds,
        })
      const costEvidence = assertTerminalCostEvidence(
        await input.costEvidenceReadPort.rereadUsagePriceAndCostEvidence({
          launch,
          cloudProviderTerminalRef:
            providerTerminal.cloudProviderTerminalRef,
          terminalOutcome: providerTerminal.terminalOutcome,
        }),
      )
      assertCostEvidenceMatches({
        evidence: costEvidence,
        launch,
        providerTerminalRef: providerTerminal.cloudProviderTerminalRef,
      })
      const observedAt = now()
      if (
        Date.parse(observedAt) < Date.parse(launch.launchedAt)
        || Date.parse(observedAt) < Date.parse(costEvidence.observedAt)
      ) throw new Error('GPU terminal observation time is stale.')
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
        source:
          'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        cloudJobExecutionRef: launch.cloudJobExecutionRef,
        cloudTerminalObservationRef:
          providerTerminal.cloudProviderTerminalRef,
        cloudCapacityTeardownObservationRef:
          costEvidence.cloudCapacityTeardownObservationRef,
        workerUsageEvidenceRef: costEvidence.workerUsageEvidenceRef,
        currentAccountPriceAuthorityRef:
          costEvidence.currentAccountPriceAuthorityRef,
        attemptCostReceiptRef: costEvidence.attemptCostReceiptRef,
        terminalOutcome: providerTerminal.terminalOutcome,
        providerInferenceOrSubstantiveWorkOutcome:
          costEvidence.providerInferenceOrSubstantiveWorkOutcome,
        cloudJobTerminalStateReread: true as const,
        workerStoppedVerified: true as const,
        activeGpuInstancesAfterTerminalObservation: 0 as const,
        exactPlatformUsageAndAccountPriceReread: true as const,
        costReceiptPersistedBeforeSettlement: true as const,
        systemFailureOrUnknownCostChargedToCustomer: false as const,
        unapprovedOverageChargedToCustomer: false as const,
        customerWalletOrLedgerMutated: false as const,
        callerOrPlanTerminalClaimAccepted: false as const,
        observedAt,
      }
      return canonicalProfessionalGpuTerminalObservationSchema.parse({
        ...payload,
        observationHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function assertExecutionBinding(
  value: unknown,
): CanonicalProfessionalGoogleCloudGpuExecutionBinding {
  assertPlainSerializedData(value, 'gpu_cloud_execution_binding')
  const binding =
    canonicalProfessionalGoogleCloudGpuExecutionBindingSchema.parse(value)
  const { bindingHash, ...payload } = binding
  if (bindingHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU cloud execution binding hash is invalid.')
  }
  return binding
}

export function assertTerminalCostEvidence(
  value: unknown,
): CanonicalProfessionalGpuTerminalCostEvidence {
  assertPlainSerializedData(value, 'gpu_terminal_cost_evidence')
  const evidence = canonicalProfessionalGpuTerminalCostEvidenceSchema.parse(
    value,
  )
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU terminal cost evidence hash is invalid.')
  }
  return evidence
}

async function rereadA100BatchTerminal(input: {
  auth: GoogleAuthRequest
  binding: Extract<CanonicalProfessionalGoogleCloudGpuExecutionBinding, {
    executionTarget: 'google_cloud_batch_a2_ultra_job'
  }>
  requestTimeoutMilliseconds: number
}) {
  const response = await input.auth.request({
    url: `${BATCH_API_ORIGIN}/v1/${input.binding.providerJobResource}`,
    method: 'GET',
    timeout: input.requestTimeoutMilliseconds,
    retry: false,
    maxRedirects: 0,
  })
  assertPlainSerializedData(response.data, 'a100_batch_terminal_response')
  const parsed = z.object({
    name: z.literal(input.binding.providerJobResource),
    uid: z.literal(input.binding.providerJobUid),
    status: z.object({
      state: z.enum(['SUCCEEDED', 'FAILED', 'CANCELLED']),
      runDuration: z.string().regex(
        /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,9})?s$/u,
      ).optional(),
    }).passthrough(),
  }).passthrough().parse(response.data)
  const terminalOutcome = parsed.status.state === 'SUCCEEDED'
    ? 'completed' as const
    : parsed.status.state === 'CANCELLED'
      ? 'canceled' as const
      : 'failed' as const
  return {
    terminalOutcome,
    cloudProviderTerminalRef: opaqueRef('google-batch-terminal', {
      bindingHash: input.binding.bindingHash,
      name: parsed.name,
      uid: parsed.uid,
      status: parsed.status,
    }),
  }
}

async function rereadL4CloudRunTerminal(input: {
  auth: GoogleAuthRequest
  binding: Extract<CanonicalProfessionalGoogleCloudGpuExecutionBinding, {
    executionTarget: 'google_cloud_run_l4_job'
  }>
  requestTimeoutMilliseconds: number
}) {
  const operationResponse = await input.auth.request({
    url: `${CLOUD_RUN_API_ORIGIN}/v2/`
      + input.binding.providerOperationResource,
    method: 'GET',
    timeout: input.requestTimeoutMilliseconds,
    retry: false,
    maxRedirects: 0,
  })
  assertPlainSerializedData(
    operationResponse.data,
    'l4_cloud_run_operation_response',
  )
  const operation = z.object({
    name: z.literal(input.binding.providerOperationResource),
    done: z.literal(true),
    response: z.object({
      name: z.string().regex(
        /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}\/executions\/[a-z][a-z0-9-]{0,62}$/u,
      ),
    }).passthrough(),
  }).passthrough().parse(operationResponse.data)
  if (!operation.response.name.startsWith(
    `${input.binding.expectedCloudRunJobResource}/executions/`,
  )) throw new Error('L4 operation returned another job execution.')
  const executionResponse = await input.auth.request({
    url: `${CLOUD_RUN_API_ORIGIN}/v2/${operation.response.name}`,
    method: 'GET',
    timeout: input.requestTimeoutMilliseconds,
    retry: false,
    maxRedirects: 0,
  })
  assertPlainSerializedData(
    executionResponse.data,
    'l4_cloud_run_execution_response',
  )
  const execution = z.object({
    name: z.literal(operation.response.name),
    uid: safeId,
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
  }).passthrough().parse(executionResponse.data)
  const completed = execution.conditions.find((condition) =>
    condition.type === 'Completed')
  if (!completed) throw new Error('L4 execution has no terminal condition.')
  const counts = {
    succeeded: Number(execution.succeededCount),
    failed: Number(execution.failedCount),
    canceled: Number(execution.cancelledCount),
  }
  const terminalCount = counts.succeeded + counts.failed + counts.canceled
  const exactSuccess = completed.state === 'CONDITION_SUCCEEDED'
    && counts.succeeded === 1
    && counts.failed === 0
    && counts.canceled === 0
  const exactCanceled = completed.state === 'CONDITION_FAILED'
    && counts.succeeded === 0
    && counts.failed === 0
    && counts.canceled === 1
    && completed.executionReason === 'CANCELLED'
  const exactFailed = completed.state === 'CONDITION_FAILED'
    && counts.succeeded === 0
    && counts.failed === 1
    && counts.canceled === 0
    && completed.executionReason !== 'CANCELLED'
  if (terminalCount !== 1 || (!exactSuccess && !exactCanceled && !exactFailed)) {
    throw new Error('L4 terminal state and task counts are inconsistent.')
  }
  return {
    terminalOutcome: exactSuccess
      ? 'completed' as const
      : exactCanceled
        ? 'canceled' as const
        : 'failed' as const,
    cloudProviderTerminalRef: opaqueRef('google-cloud-run-terminal', {
      bindingHash: input.binding.bindingHash,
      operationName: operation.name,
      execution,
    }),
  }
}

function assertBindingMatchesLaunch(input: {
  binding: CanonicalProfessionalGoogleCloudGpuExecutionBinding
  launch: CanonicalProfessionalGpuJobLaunch
}): void {
  const { binding, launch } = input
  if (
    !sameRef(binding.launchRef, ref(
      launch.launchRecordId,
      launch.launchHash,
    ))
    || launch.cloudJobExecutionRef === null
    || !sameRef(binding.cloudJobExecutionRef, launch.cloudJobExecutionRef)
    || binding.routeId !== launch.routeId
    || binding.runtimeRegion !== launch.runtimeRegion
    || binding.executionTarget !== launch.executionTarget
    || binding.accelerator !== launch.accelerator
  ) throw new Error('GPU provider execution binding differs from launch.')
}

function assertCostEvidenceMatches(input: {
  evidence: CanonicalProfessionalGpuTerminalCostEvidence
  launch: CanonicalProfessionalGpuJobLaunch
  providerTerminalRef: z.infer<typeof evidenceRefSchema>
}): void {
  if (
    !sameRef(input.evidence.launchRef, ref(
      input.launch.launchRecordId,
      input.launch.launchHash,
    ))
    || !sameRef(
      input.evidence.cloudProviderTerminalRef,
      input.providerTerminalRef,
    )
    || sameRef(
      input.evidence.cloudCapacityTeardownObservationRef,
      input.providerTerminalRef,
    )
    || Date.parse(input.evidence.observedAt) <
      Date.parse(input.launch.launchedAt)
  ) throw new Error('GPU cost evidence differs from terminal launch.')
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function opaqueRef(prefix: string, value: unknown) {
  const digest = sha256AuthorityValue(value)
  return ref(`${prefix}.${digest.slice(0, 32)}`, digest)
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
  if (depth > 16) throw new Error(`${label} nesting is too deep.`)
  if (
    value === null
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return
  if (typeof value === 'string') {
    state.characters += value.length
    if (value.length > 16_384 || state.characters > 2_000_000) {
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
  if (keys.length > 512) throw new Error(`${label} has too many entries.`)
  state.entries += keys.length
  if (state.entries > 4_096) {
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
