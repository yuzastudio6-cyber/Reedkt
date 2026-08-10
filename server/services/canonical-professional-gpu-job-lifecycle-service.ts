import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuRuntimeRelease,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION =
  'canonical-professional-gpu-job-launch-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_JOB_TERMINAL_VERSION =
  'canonical-professional-gpu-job-terminal-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION =
  'canonical-professional-gpu-terminal-observation-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_EXECUTION_ENVELOPE_VERSION =
  'canonical-professional-gpu-execution-envelope-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])

export const canonicalProfessionalGpuRuntimeLaunchTargetSchema = z.object({
  releaseRef: evidenceRefSchema,
  releaseEvidenceClass: z.literal('canonical_private_reread'),
  privateInternalQualified: z.literal(true),
  toolId: safeId,
  operationId: safeId,
  routeId: routeIdSchema,
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_vertex_custom_job_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  fixedServerTaskContractRef: evidenceRefSchema,
  serviceIdentityRef: evidenceRefSchema,
  privateNetworkAndArtifactTransportRef: evidenceRefSchema,
  minimumIdleInstances: z.literal(0),
  maximumConcurrentAttemptsPerInstance: z.literal(1),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerCommandImageModelOrEnvironmentAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  startsOnlyFromConsumedApprovedAdmission: z.literal(true),
  stopsAtTerminalAttempt: z.literal(true),
}).strict().superRefine((target, context) => {
  const a100 = target.routeId === 'a100_80gb_heavy_primary'
  const exact = a100
    ? (target.executionTarget === 'google_cloud_vertex_custom_job_a2_ultra'
      || target.executionTarget === 'google_cloud_batch_a2_ultra_job')
      && target.machineType === 'a2-ultragpu-1g'
      && target.accelerator === 'nvidia_a100_80gb'
    : target.executionTarget === 'google_cloud_run_l4_job'
      && target.machineType === 'cloud_run_nvidia_l4'
      && target.accelerator === 'nvidia_l4'
  if (
    !exact
    || target.immutableImageRef.contentHash !== target.immutableImageDigest
  ) context.addIssue({
    code: 'custom',
    message: 'GPU launch target lost its exact accelerator or image route.',
  })
})

export type CanonicalProfessionalGpuRuntimeLaunchTarget = z.infer<
  typeof canonicalProfessionalGpuRuntimeLaunchTargetSchema
>

export function createCanonicalProfessionalGpuRuntimeLaunchTarget(input: {
  readonly runtimeRelease: CanonicalProfessionalToolGpuRuntimeRelease
  readonly fixedServerTaskContractRef: z.input<typeof evidenceRefSchema>
  readonly at?: string
}): CanonicalProfessionalGpuRuntimeLaunchTarget {
  const release = assertCanonicalProfessionalToolGpuRuntimeRelease(
    input.runtimeRelease,
    input.at,
  )
  return canonicalProfessionalGpuRuntimeLaunchTargetSchema.parse({
    releaseRef: {
      id: release.releaseId,
      version: release.releaseVersion,
      contentHash: `sha256:${release.releaseHash}`,
    },
    releaseEvidenceClass: release.evidenceClass,
    privateInternalQualified: release.privateInternalQualified,
    toolId: release.toolId,
    operationId: release.operationId,
    routeId: release.routeId,
    runtimeRegion: release.runtimeRegion,
    executionTarget: release.executionTarget,
    machineType: release.machineType,
    accelerator: release.accelerator,
    immutableImageRef: release.immutableImageRef,
    immutableImageDigest: release.immutableImageDigest,
    fixedServerTaskContractRef: input.fixedServerTaskContractRef,
    serviceIdentityRef: release.serviceIdentityRef,
    privateNetworkAndArtifactTransportRef:
      release.privateNetworkAndArtifactTransportRef,
    minimumIdleInstances: release.minimumIdleInstances,
    maximumConcurrentAttemptsPerInstance:
      release.maximumConcurrentAttemptsPerInstance,
    runtimeNetworkDownloadAllowed: release.runtimeNetworkDownloadAllowed,
    callerCommandImageModelOrEnvironmentAccepted:
      release.callerImageModelToolOrCommandSelectionAllowed,
    cpuOnlySubstantiveExecutionAllowed:
      release.cpuOnlySubstantiveExecutionObserved,
    startsOnlyFromConsumedApprovedAdmission:
      release.startsOnlyFromCreateOnlyApprovedUserAttempt,
    stopsAtTerminalAttempt: release.stopsAtTerminalAttempt,
  })
}

export function assertCanonicalProfessionalGpuRuntimeLaunchTarget(
  value: unknown,
): CanonicalProfessionalGpuRuntimeLaunchTarget {
  assertPlainSerializedData(value, 'gpu_runtime_launch_target')
  return canonicalProfessionalGpuRuntimeLaunchTargetSchema.parse(value)
}

const admissionConsumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-admission-consumption-v1',
  ),
  source: z.literal('canonical_professional_gpu_job_lifecycle_owner'),
  admissionRef: evidenceRefSchema,
  admissionHash: sha256,
  runtimeReleaseRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  toolId: safeId,
  operationId: safeId,
  routeId: routeIdSchema,
  consumedBeforeCloudJobCreation: z.literal(true),
  oneAdmissionMayCreateAtMostOneCloudJob: z.literal(true),
  retryAfterUnknownOutcomeAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  consumedAt: timestamp,
}).strict()
const admissionConsumptionSchema = admissionConsumptionWithoutHashSchema
  .extend({ consumptionHash: sha256 }).strict()
export type CanonicalProfessionalGpuAdmissionConsumption = z.infer<
  typeof admissionConsumptionSchema
>

const executionEnvelopeWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_EXECUTION_ENVELOPE_VERSION,
  ),
  source: z.literal('canonical_professional_gpu_job_lifecycle_owner'),
  envelopeId: safeId,
  admissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  fixedServerTaskContractRef: evidenceRefSchema,
  toolId: safeId,
  operationId: safeId,
  routeId: routeIdSchema,
  immutableImageDigest: prefixedSha256,
  byteFreeEnvelope: z.literal(true),
  privateWorkerRereadsEnvelopeByExactRef: z.literal(true),
  callerCodeCommandImageModelPathUrlOrEnvironmentIncluded: z.literal(false),
  rawChatMediaBytesCredentialsOrSecretsIncluded: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  createdBeforeCloudJob: z.literal(true),
  createOnlyAndExactRereadRequired: z.literal(true),
}).strict()
export const canonicalProfessionalGpuExecutionEnvelopeSchema =
  executionEnvelopeWithoutHashSchema.extend({ envelopeHash: sha256 }).strict()
export type CanonicalProfessionalGpuExecutionEnvelope = z.infer<
  typeof canonicalProfessionalGpuExecutionEnvelopeSchema
>

const cloudLaunchResultSchema = z.object({
  disposition: z.enum([
    'accepted',
    'rejected_before_creation',
    'outcome_unknown',
  ]),
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  cloudJobCreateRequestRef: evidenceRefSchema,
  providerRequestIdDigestSha256: sha256.nullable(),
  observedAt: timestamp,
  providerInferenceOrSubstantiveWorkKnownExecuted: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
}).strict().superRefine((result, context) => {
  const exact = result.disposition === 'accepted'
    ? result.cloudJobExecutionRef !== null
      && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
        'not_executed'
    : result.disposition === 'rejected_before_creation'
      ? result.cloudJobExecutionRef === null
        && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
          'not_executed'
      : result.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'GPU cloud-job launch result lost its safe outcome.',
  })
})
export type CanonicalProfessionalGpuCloudLaunchResult = z.infer<
  typeof cloudLaunchResultSchema
>

const terminalOutcomeSchema = z.enum([
  'completed',
  'failed',
  'canceled',
  'outcome_unknown_requires_reconciliation',
])
const substantiveWorkOutcomeSchema = z.enum([
  'executed',
  'not_executed',
  'unknown',
])

const terminalObservationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_cloud_terminal_usage_and_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  cloudTerminalObservationRef: evidenceRefSchema,
  cloudCapacityTeardownObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  currentAccountPriceAuthorityRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  terminalOutcome: terminalOutcomeSchema,
  providerInferenceOrSubstantiveWorkOutcome:
    substantiveWorkOutcomeSchema,
  cloudJobTerminalStateReread: z.boolean(),
  workerStoppedVerified: z.boolean(),
  activeGpuInstancesAfterTerminalObservation: z.literal(0).nullable(),
  exactPlatformUsageAndAccountPriceReread: z.literal(true),
  costReceiptPersistedBeforeSettlement: z.literal(true),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  callerOrPlanTerminalClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((observation, context) => {
  const cloudOutcomeUnknown = observation.terminalOutcome ===
    'outcome_unknown_requires_reconciliation'
  const exact = cloudOutcomeUnknown
    ? !observation.cloudJobTerminalStateReread
      && !observation.workerStoppedVerified
      && observation.activeGpuInstancesAfterTerminalObservation === null
    : observation.cloudJobTerminalStateReread
      && observation.workerStoppedVerified
      && observation.activeGpuInstancesAfterTerminalObservation === 0
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'GPU terminal observation lost cloud stop truth.',
  })
})

export const canonicalProfessionalGpuTerminalObservationSchema =
  terminalObservationWithoutHashSchema.extend({
    observationHash: sha256,
  }).strict()
export type CanonicalProfessionalGpuTerminalObservation = z.infer<
  typeof canonicalProfessionalGpuTerminalObservationSchema
>

const launchWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION),
  source: z.literal('canonical_professional_gpu_job_lifecycle_owner'),
  launchRecordId: safeId,
  admissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  toolId: safeId,
  operationId: safeId,
  routeId: routeIdSchema,
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_vertex_custom_job_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  immutableImageDigest: prefixedSha256,
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  launchDisposition: z.enum([
    'job_created',
    'job_rejected_before_creation',
    'job_creation_outcome_unknown',
  ]),
  providerInferenceOrSubstantiveWorkKnownExecuted: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  createOnlyAdmissionConsumedBeforeLaunch: z.literal(true),
  duplicateLaunchAllowed: z.literal(false),
  unknownOutcomeRetryAllowed: z.literal(false),
  noApprovedAdmissionMeansZeroGpuJobs: z.literal(true),
  minimumIdleInstances: z.literal(0),
  prewarmingKeepaliveOrAlwaysOnPoolAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  launchedAt: timestamp,
}).strict().superRefine((record, context) => {
  const exact = record.launchDisposition === 'job_created'
    ? record.cloudJobExecutionRef !== null
      && record.providerInferenceOrSubstantiveWorkKnownExecuted ===
        'not_executed'
    : record.launchDisposition === 'job_rejected_before_creation'
      ? record.cloudJobExecutionRef === null
        && record.providerInferenceOrSubstantiveWorkKnownExecuted ===
          'not_executed'
      : record.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'GPU launch record lost its single-use outcome.',
  })
})
export const canonicalProfessionalGpuJobLaunchSchema =
  launchWithoutHashSchema.extend({ launchHash: sha256 }).strict()
export type CanonicalProfessionalGpuJobLaunch = z.infer<
  typeof canonicalProfessionalGpuJobLaunchSchema
>

const terminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_GPU_JOB_TERMINAL_VERSION),
  source: z.literal('canonical_professional_gpu_job_lifecycle_owner'),
  terminalRecordId: safeId,
  launchRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  cloudTerminalObservationRef: evidenceRefSchema,
  cloudCapacityTeardownObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  currentAccountPriceAuthorityRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  terminalOutcome: terminalOutcomeSchema,
  providerInferenceOrSubstantiveWorkOutcome:
    substantiveWorkOutcomeSchema,
  cloudJobTerminalStateReread: z.boolean(),
  workerStoppedVerified: z.boolean(),
  activeGpuInstancesAfterTerminalObservation: z.literal(0).nullable(),
  minimumIdleInstances: z.literal(0),
  retryAllowedWithoutCanonicalReconciliation: z.literal(false),
  unknownOutcomeBlocksRetry: z.boolean(),
  exactPlatformUsageAndAccountPriceReread: z.literal(true),
  costReceiptPersistedBeforeSettlement: z.literal(true),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((record, context) => {
  const cloudOutcomeUnknown = record.terminalOutcome ===
    'outcome_unknown_requires_reconciliation'
  const retryOutcomeUnknown = cloudOutcomeUnknown
    || record.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  const exact = cloudOutcomeUnknown
    ? !record.cloudJobTerminalStateReread
      && !record.workerStoppedVerified
      && record.activeGpuInstancesAfterTerminalObservation === null
    : record.cloudJobTerminalStateReread
      && record.workerStoppedVerified
      && record.activeGpuInstancesAfterTerminalObservation === 0
  if (record.unknownOutcomeBlocksRetry !== retryOutcomeUnknown) {
    context.addIssue({
      code: 'custom',
      message: 'GPU retry block lost cloud or substantive-work uncertainty.',
    })
  }
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'GPU terminal record lost stop or unknown-outcome truth.',
  })
})
export const canonicalProfessionalGpuJobTerminalSchema =
  terminalWithoutHashSchema.extend({ terminalHash: sha256 }).strict()
export type CanonicalProfessionalGpuJobTerminal = z.infer<
  typeof canonicalProfessionalGpuJobTerminalSchema
>

export interface CanonicalProfessionalGpuRuntimeReleaseReadPort {
  rereadPrivateLaunchTarget(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
  }): Promise<CanonicalProfessionalGpuRuntimeLaunchTarget | null>
}

export interface CanonicalProfessionalGpuCloudJobLaunchPort {
  startOneShotJob(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
    readonly admissionConsumptionRef: z.infer<typeof evidenceRefSchema>
    readonly executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalProfessionalGpuCloudLaunchResult>
}

const fixedTaskPreparingLaunchPortDescriptorSchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-fixed-task-preparing-launch-port-v1',
  ),
  toolId: safeId,
  operationId: safeId,
  fixedServerTaskContractRef: evidenceRefSchema,
  approvedTaskMaterialPreparedBeforeTaskContextRead: z.literal(true),
  canonicalTaskContextRereadBeforeCloudJobCreation: z.literal(true),
  fixedTaskPersistedAndRereadBeforeCloudJobCreation: z.literal(true),
  rawCloudLaunchPortAcceptedForFixedTaskTool: z.literal(false),
}).strict()
type FixedTaskPreparingLaunchPortDescriptor = z.infer<
  typeof fixedTaskPreparingLaunchPortDescriptorSchema
>

const fixedTaskPreparingLaunchPorts = new WeakMap<
  CanonicalProfessionalGpuCloudJobLaunchPort,
  FixedTaskPreparingLaunchPortDescriptor
>()

export function createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort(
  input: {
    readonly descriptor: z.input<
      typeof fixedTaskPreparingLaunchPortDescriptorSchema
    >
    readonly delegate: CanonicalProfessionalGpuCloudJobLaunchPort
  },
): CanonicalProfessionalGpuCloudJobLaunchPort {
  const descriptor = fixedTaskPreparingLaunchPortDescriptorSchema.parse(
    input.descriptor,
  )
  if (typeof input.delegate?.startOneShotJob !== 'function') {
    throw new Error('Fixed-task preparing GPU launch delegate is invalid.')
  }
  const port: CanonicalProfessionalGpuCloudJobLaunchPort = Object.freeze({
    startOneShotJob: input.delegate.startOneShotJob.bind(input.delegate),
  })
  fixedTaskPreparingLaunchPorts.set(port, descriptor)
  return port
}

export interface CanonicalProfessionalGpuTerminalObservationPort {
  rereadTerminalUsagePriceAndCost(input: {
    readonly launch: CanonicalProfessionalGpuJobLaunch
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuJobLifecycleStore {
  consumeAdmissionCreateOnly(input: {
    readonly record: CanonicalProfessionalGpuAdmissionConsumption
  }): Promise<'created' | 'already_exists'>
  createExecutionEnvelopeOnly(input: {
    readonly record: CanonicalProfessionalGpuExecutionEnvelope
  }): Promise<'created' | 'already_exists'>
  rereadExecutionEnvelope(input: {
    readonly envelopeId: string
  }): Promise<CanonicalProfessionalGpuExecutionEnvelope | null>
  createLaunchRecordOnly(input: {
    readonly record: CanonicalProfessionalGpuJobLaunch
  }): Promise<'created' | 'already_exists'>
  createTerminalRecordOnly(input: {
    readonly record: CanonicalProfessionalGpuJobTerminal
  }): Promise<'created' | 'already_exists'>
}

export async function startCanonicalProfessionalGpuJob(input: {
  readonly launchRecordId: string
  readonly admission: unknown
  readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
  readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
  readonly store: CanonicalProfessionalGpuJobLifecycleStore
  readonly startedAt: string
}): Promise<CanonicalProfessionalGpuJobLaunch> {
  const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    input.admission,
  )
  if (
    Date.parse(input.startedAt) < Date.parse(admission.admittedAt)
    || Date.parse(input.startedAt) >= Date.parse(admission.expiresAt)
  ) throw new Error('GPU dispatch admission is not current at job launch.')
  const untrustedTarget =
    await input.releaseReadPort.rereadPrivateLaunchTarget({ admission })
  assertPlainSerializedData(untrustedTarget, 'gpu_launch_target')
  const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
    untrustedTarget,
  )
  if (
    target.releaseRef.id !== admission.runtimeReleaseRef.id
    || target.releaseRef.version !== admission.runtimeReleaseRef.version
    || target.releaseRef.contentHash !==
      admission.runtimeReleaseRef.contentHash
    || target.toolId !== admission.toolId
    || target.operationId !== admission.operationId
    || target.routeId !== admission.routeId
  ) throw new Error('GPU launch target differs from its dispatch admission.')
  assertFixedTaskPreparingLaunchPortRequired({
    admission,
    target,
    launchPort: input.launchPort,
  })

  const consumptionPayload = admissionConsumptionWithoutHashSchema.parse({
    schemaVersion: 'canonical-professional-gpu-admission-consumption-v1',
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    admissionRef: ref(admission.admissionId, admission.admissionHash),
    admissionHash: admission.admissionHash,
    runtimeReleaseRef: admission.runtimeReleaseRef,
    executionAttemptRef: admission.scope.executionAttemptRef,
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    fundedReservationRef: admission.scope.fundedReservationRef,
    userTriggerRecordRef: admission.scope.userTriggerRecordRef,
    idempotencyKey: admission.scope.idempotencyKey,
    toolId: admission.toolId,
    operationId: admission.operationId,
    routeId: admission.routeId,
    consumedBeforeCloudJobCreation: true,
    oneAdmissionMayCreateAtMostOneCloudJob: true,
    retryAfterUnknownOutcomeAllowed: false,
    customerCreditsMutated: false,
    consumedAt: input.startedAt,
  })
  const consumption = admissionConsumptionSchema.parse({
    ...consumptionPayload,
    consumptionHash: sha256AuthorityValue(consumptionPayload),
  })
  if (await input.store.consumeAdmissionCreateOnly({ record: consumption })
    !== 'created') {
    throw new Error('GPU dispatch admission was already consumed.')
  }

  const envelopePayload = executionEnvelopeWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_EXECUTION_ENVELOPE_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    envelopeId: `${admission.admissionId}.execution-envelope`,
    admissionRef: consumption.admissionRef,
    admissionConsumptionRef: ref(
      consumption.admissionRef.id,
      consumption.consumptionHash,
    ),
    runtimeReleaseRef: target.releaseRef,
    approvedSnapshotRef: admission.scope.approvedSnapshotRef,
    confirmedOutputFrameRef: admission.scope.confirmedOutputFrameRef,
    masterTimingRef: admission.scope.masterTimingRef,
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    workerLeaseRef: admission.scope.workerLeaseRef,
    fundedReservationRef: admission.scope.fundedReservationRef,
    userTriggerRecordRef: admission.scope.userTriggerRecordRef,
    executionAttemptRef: admission.scope.executionAttemptRef,
    fixedServerTaskContractRef: target.fixedServerTaskContractRef,
    toolId: admission.toolId,
    operationId: admission.operationId,
    routeId: admission.routeId,
    immutableImageDigest: target.immutableImageDigest,
    byteFreeEnvelope: true,
    privateWorkerRereadsEnvelopeByExactRef: true,
    callerCodeCommandImageModelPathUrlOrEnvironmentIncluded: false,
    rawChatMediaBytesCredentialsOrSecretsIncluded: false,
    runtimeDownloadAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    createdBeforeCloudJob: true,
    createOnlyAndExactRereadRequired: true,
  })
  const envelope = canonicalProfessionalGpuExecutionEnvelopeSchema.parse({
    ...envelopePayload,
    envelopeHash: sha256AuthorityValue(envelopePayload),
  })
  if (await input.store.createExecutionEnvelopeOnly({ record: envelope })
    !== 'created') {
    throw new Error('GPU execution envelope already exists.')
  }
  const rereadEnvelope = assertCanonicalProfessionalGpuExecutionEnvelope(
    await input.store.rereadExecutionEnvelope({
      envelopeId: envelope.envelopeId,
    }),
  )
  if (rereadEnvelope.envelopeHash !== envelope.envelopeHash) {
    throw new Error('GPU execution envelope reread changed.')
  }
  const executionEnvelopeRef = ref(
    envelope.envelopeId,
    envelope.envelopeHash,
  )

  let launchResult: CanonicalProfessionalGpuCloudLaunchResult
  try {
    const untrustedLaunchResult = await input.launchPort.startOneShotJob({
      admission,
      target,
      admissionConsumptionRef: ref(
        consumption.admissionRef.id,
        consumption.consumptionHash,
      ),
      executionEnvelopeRef,
    })
    assertPlainSerializedData(
      untrustedLaunchResult,
      'gpu_cloud_launch_result',
    )
    launchResult = cloudLaunchResultSchema.parse(untrustedLaunchResult)
  } catch {
    launchResult = cloudLaunchResultSchema.parse({
      disposition: 'outcome_unknown',
      cloudJobExecutionRef: null,
      cloudJobCreateRequestRef: ref(
        `${admission.admissionId}.cloud-create-unknown`,
        admission.admissionHash,
      ),
      providerRequestIdDigestSha256: null,
      observedAt: input.startedAt,
      providerInferenceOrSubstantiveWorkKnownExecuted: 'unknown',
    })
  }
  const launchDisposition = launchResult.disposition === 'accepted'
    ? 'job_created' as const
    : launchResult.disposition === 'rejected_before_creation'
      ? 'job_rejected_before_creation' as const
      : 'job_creation_outcome_unknown' as const
  const launchPayload = launchWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_JOB_LAUNCH_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    launchRecordId: input.launchRecordId,
    admissionRef: consumption.admissionRef,
    admissionConsumptionRef: ref(
      consumption.admissionRef.id,
      consumption.consumptionHash,
    ),
    runtimeReleaseRef: target.releaseRef,
    executionEnvelopeRef,
    toolId: admission.toolId,
    operationId: admission.operationId,
    routeId: target.routeId,
    runtimeRegion: target.runtimeRegion,
    executionTarget: target.executionTarget,
    accelerator: target.accelerator,
    immutableImageDigest: target.immutableImageDigest,
    cloudJobCreateRequestRef: launchResult.cloudJobCreateRequestRef,
    cloudJobExecutionRef: launchResult.cloudJobExecutionRef,
    launchDisposition,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      launchResult.providerInferenceOrSubstantiveWorkKnownExecuted,
    createOnlyAdmissionConsumedBeforeLaunch: true,
    duplicateLaunchAllowed: false,
    unknownOutcomeRetryAllowed: false,
    noApprovedAdmissionMeansZeroGpuJobs: true,
    minimumIdleInstances: 0,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    launchedAt: launchResult.observedAt,
  })
  const record = canonicalProfessionalGpuJobLaunchSchema.parse({
    ...launchPayload,
    launchHash: sha256AuthorityValue(launchPayload),
  })
  if (await input.store.createLaunchRecordOnly({ record }) !== 'created') {
    throw new Error('GPU launch record already exists; reconciliation required.')
  }
  return record
}

function assertFixedTaskPreparingLaunchPortRequired(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
  launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
}): void {
  const requiresCanonicalFixedTaskPreparation =
    input.admission.toolId === 'sam3_1'
    || (
      input.admission.toolId === 'kornia'
      && input.admission.operationId === 'tool.kornia.refine_mask.v1'
    )
  if (!requiresCanonicalFixedTaskPreparation) return
  const descriptor = fixedTaskPreparingLaunchPorts.get(input.launchPort)
  if (!descriptor
    || descriptor.toolId !== input.admission.toolId
    || descriptor.operationId !== input.admission.operationId
    || descriptor.fixedServerTaskContractRef.id !==
      input.target.fixedServerTaskContractRef.id
    || descriptor.fixedServerTaskContractRef.version !==
      input.target.fixedServerTaskContractRef.version
    || descriptor.fixedServerTaskContractRef.contentHash !==
      input.target.fixedServerTaskContractRef.contentHash) {
    throw new Error(
      `${input.admission.toolId} ${input.admission.operationId} requires `
      + 'its canonical fixed-task preparing launch port.',
    )
  }
}

export async function recordCanonicalProfessionalGpuJobTerminal(input: {
  readonly terminalRecordId: string
  readonly launch: unknown
  readonly terminalObservationPort:
    CanonicalProfessionalGpuTerminalObservationPort
  readonly store: CanonicalProfessionalGpuJobLifecycleStore
}): Promise<CanonicalProfessionalGpuJobTerminal> {
  const launch = assertCanonicalProfessionalGpuJobLaunch(input.launch)
  const observation = assertCanonicalProfessionalGpuTerminalObservation(
    await input.terminalObservationPort
      .rereadTerminalUsagePriceAndCost({ launch }),
  )
  if (
    !sameRef(observation.launchRef, ref(
      launch.launchRecordId,
      launch.launchHash,
    ))
    || !sameNullableRef(
      observation.cloudJobExecutionRef,
      launch.cloudJobExecutionRef,
    )
    || Date.parse(observation.observedAt) < Date.parse(launch.launchedAt)
  ) throw new Error(
    'GPU terminal observation differs from its canonical launch.',
  )
  const unknown = observation.terminalOutcome ===
    'outcome_unknown_requires_reconciliation'
    || observation.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  const payload = terminalWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_JOB_TERMINAL_VERSION,
    source: 'canonical_professional_gpu_job_lifecycle_owner',
    terminalRecordId: input.terminalRecordId,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    admissionRef: launch.admissionRef,
    cloudJobExecutionRef: launch.cloudJobExecutionRef,
    cloudTerminalObservationRef: observation.cloudTerminalObservationRef,
    cloudCapacityTeardownObservationRef:
      observation.cloudCapacityTeardownObservationRef,
    workerUsageEvidenceRef: observation.workerUsageEvidenceRef,
    currentAccountPriceAuthorityRef:
      observation.currentAccountPriceAuthorityRef,
    attemptCostReceiptRef: observation.attemptCostReceiptRef,
    terminalOutcome: observation.terminalOutcome,
    providerInferenceOrSubstantiveWorkOutcome:
      observation.providerInferenceOrSubstantiveWorkOutcome,
    cloudJobTerminalStateReread:
      observation.cloudJobTerminalStateReread,
    workerStoppedVerified: observation.workerStoppedVerified,
    activeGpuInstancesAfterTerminalObservation:
      observation.activeGpuInstancesAfterTerminalObservation,
    minimumIdleInstances: 0,
    retryAllowedWithoutCanonicalReconciliation: false,
    unknownOutcomeBlocksRetry: unknown,
    exactPlatformUsageAndAccountPriceReread:
      observation.exactPlatformUsageAndAccountPriceReread,
    costReceiptPersistedBeforeSettlement:
      observation.costReceiptPersistedBeforeSettlement,
    systemFailureOrUnknownCostChargedToCustomer:
      observation.systemFailureOrUnknownCostChargedToCustomer,
    unapprovedOverageChargedToCustomer:
      observation.unapprovedOverageChargedToCustomer,
    customerWalletOrLedgerMutated:
      observation.customerWalletOrLedgerMutated,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: observation.observedAt,
  })
  const record = canonicalProfessionalGpuJobTerminalSchema.parse({
    ...payload,
    terminalHash: sha256AuthorityValue(payload),
  })
  if (await input.store.createTerminalRecordOnly({ record }) !== 'created') {
    throw new Error('GPU terminal record already exists.')
  }
  return record
}

export function assertCanonicalProfessionalGpuTerminalObservation(
  value: unknown,
): CanonicalProfessionalGpuTerminalObservation {
  assertPlainSerializedData(value, 'gpu_terminal_observation')
  const observation =
    canonicalProfessionalGpuTerminalObservationSchema.parse(value)
  const { observationHash, ...payload } = observation
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU terminal observation hash is invalid.')
  }
  return observation
}

export function assertCanonicalProfessionalGpuAdmissionConsumption(
  value: unknown,
): CanonicalProfessionalGpuAdmissionConsumption {
  assertPlainSerializedData(value, 'gpu_admission_consumption')
  const consumption = admissionConsumptionSchema.parse(value)
  const { consumptionHash, ...payload } = consumption
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU admission consumption hash is invalid.')
  }
  return consumption
}

export function assertCanonicalProfessionalGpuJobLaunch(
  value: unknown,
): CanonicalProfessionalGpuJobLaunch {
  assertPlainSerializedData(value, 'gpu_job_launch')
  const launch = canonicalProfessionalGpuJobLaunchSchema.parse(value)
  const { launchHash, ...payload } = launch
  if (launchHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU job launch record hash is invalid.')
  }
  return launch
}

export function assertCanonicalProfessionalGpuExecutionEnvelope(
  value: unknown,
): CanonicalProfessionalGpuExecutionEnvelope {
  assertPlainSerializedData(value, 'gpu_execution_envelope')
  const envelope = canonicalProfessionalGpuExecutionEnvelopeSchema.parse(value)
  const { envelopeHash, ...payload } = envelope
  if (envelopeHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU execution envelope hash is invalid.')
  }
  return envelope
}

export function assertCanonicalProfessionalGpuJobTerminal(
  value: unknown,
): CanonicalProfessionalGpuJobTerminal {
  assertPlainSerializedData(value, 'gpu_job_terminal')
  const terminal = canonicalProfessionalGpuJobTerminalSchema.parse(value)
  const { terminalHash, ...payload } = terminal
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU job terminal record hash is invalid.')
  }
  return terminal
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

function sameNullableRef(
  left: z.infer<typeof evidenceRefSchema> | null,
  right: z.infer<typeof evidenceRefSchema> | null,
): boolean {
  return left === null || right === null
    ? left === right
    : sameRef(left, right)
}

export function assertPlainSerializedData(
  value: unknown,
  label: string,
  state: { readonly seen: Set<object>; entries: number } = {
    seen: new Set<object>(),
    entries: 0,
  },
  depth = 0,
): void {
  if (depth > 16) throw new Error(`${label} nesting is too deep.`)
  if (
    value === null
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return
  if (typeof value === 'string') {
    if (value.length > 16_384) throw new Error(`${label} string is too long.`)
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
