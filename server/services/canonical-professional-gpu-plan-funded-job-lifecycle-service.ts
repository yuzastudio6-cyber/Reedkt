import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  admitCanonicalProfessionalGpuPlanFundedDispatch,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  assertCanonicalProfessionalGpuFundedDispatchAdmission,
  canonicalProfessionalGpuFundedDispatchAdmissionSchema,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import type {
  CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  assertPlainSerializedData,
  assertCanonicalProfessionalGpuJobLaunch,
  recordCanonicalProfessionalGpuJobTerminal,
  startCanonicalProfessionalGpuJob,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
  type CanonicalProfessionalGpuJobLifecycleStore,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobTerminal,
  type CanonicalProfessionalGpuRuntimeReleaseReadPort,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION =
  'canonical-professional-gpu-funded-prelaunch-authorization-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FUNDED_LAUNCH_BINDING_VERSION =
  'canonical-professional-gpu-funded-launch-binding-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FUNDED_TERMINAL_BINDING_VERSION =
  'canonical-professional-gpu-funded-terminal-binding-v1' as const

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

const prelaunchWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_job_lifecycle_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  prelaunchAuthorizationId: safeId,
  fundedDispatchAdmission:
    canonicalProfessionalGpuFundedDispatchAdmissionSchema,
  fundedDispatchAdmissionRef: evidenceRefSchema,
  toolDispatchAdmissionRef: evidenceRefSchema,
  pricingAuthorityBundleRef: evidenceRefSchema,
  preapprovalManifestRef: evidenceRefSchema,
  publicationBindingRef: evidenceRefSchema,
  approvedFundingObservationRef: evidenceRefSchema,
  attemptStartAuthorityRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  exactFundedAdmissionPersistedBeforeCloudJobCreation: z.literal(true),
  directLowLevelAdmissionLaunchAcceptedByPlanLifecycle: z.literal(false),
  fullCustomerEstimateFundedBeforeCloudJobCreation: z.literal(true),
  createOnlyPersistenceVerified: z.literal(true),
  exactPostPersistenceReread: z.literal(true),
  customerCreditsMutated: z.literal(false),
  cloudJobCreated: z.literal(false),
  preparedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema =
  prelaunchWithoutHashSchema.extend({ prelaunchAuthorizationHash: sha256 })
    .strict()
export type CanonicalProfessionalGpuFundedPrelaunchAuthorization = z.infer<
  typeof canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema
>

const launchBindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_LAUNCH_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_job_lifecycle_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  launchBindingId: safeId,
  prelaunchAuthorizationRef: evidenceRefSchema,
  fundedDispatchAdmissionRef: evidenceRefSchema,
  toolDispatchAdmissionRef: evidenceRefSchema,
  pricingAuthorityBundleRef: evidenceRefSchema,
  preapprovalManifestRef: evidenceRefSchema,
  publicationBindingRef: evidenceRefSchema,
  approvedFundingObservationRef: evidenceRefSchema,
  attemptStartAuthorityRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
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
  routeId: z.enum([
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
    'l4_standard_primary',
  ]),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  minimumIdleInstances: z.literal(0),
  fundedPrelaunchRereadBeforeCloudJobCreation: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  retryAllowedWithoutCanonicalReconciliation: z.literal(false),
  unknownLaunchOutcomeBlocksRetry: z.boolean(),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  boundAt: timestamp,
}).strict().superRefine((binding, context) => {
  const unknown = binding.launchDisposition ===
    'job_creation_outcome_unknown'
    || binding.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
  if (binding.unknownLaunchOutcomeBlocksRetry !== unknown) context.addIssue({
    code: 'custom',
    message: 'Funded GPU launch binding lost unknown-outcome retry truth.',
  })
})

export const canonicalProfessionalGpuFundedLaunchBindingSchema =
  launchBindingWithoutHashSchema.extend({ launchBindingHash: sha256 }).strict()
export type CanonicalProfessionalGpuFundedLaunchBinding = z.infer<
  typeof canonicalProfessionalGpuFundedLaunchBindingSchema
>

const terminalBindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_TERMINAL_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_job_lifecycle_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  terminalBindingId: safeId,
  prelaunchAuthorizationRef: evidenceRefSchema,
  fundedDispatchAdmissionRef: evidenceRefSchema,
  launchBindingRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  terminalRef: evidenceRefSchema,
  attemptStartAuthorityRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  terminalOutcome: z.enum([
    'completed',
    'failed',
    'canceled',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  activeGpuInstancesAfterTerminalObservation: z.literal(0).nullable(),
  workerStoppedVerified: z.boolean(),
  retryAllowedWithoutCanonicalReconciliation: z.literal(false),
  unknownOutcomeBlocksRetry: z.boolean(),
  retryRequiresCanonicalTerminalCostAndCapacityReconciliation:
    z.literal(true),
  exactFundedPlanLaunchAndTerminalReread: z.literal(true),
  costReceiptPersistedBeforeSettlement: z.literal(true),
  terminalSettlementOwnerMustReconcileReservation: z.literal(true),
  customerWalletOrLedgerMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  boundAt: timestamp,
}).strict().superRefine((binding, context) => {
  const cloudOutcomeUnknown = binding.terminalOutcome ===
    'outcome_unknown_requires_reconciliation'
  const retryOutcomeUnknown = cloudOutcomeUnknown
    || binding.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  const stopped = cloudOutcomeUnknown
    ? !binding.workerStoppedVerified
      && binding.activeGpuInstancesAfterTerminalObservation === null
    : binding.workerStoppedVerified
      && binding.activeGpuInstancesAfterTerminalObservation === 0
  if (binding.unknownOutcomeBlocksRetry !== retryOutcomeUnknown) {
    context.addIssue({
      code: 'custom',
      message: 'Funded GPU terminal binding lost unknown-outcome retry truth.',
    })
  }
  if (!stopped) context.addIssue({
    code: 'custom',
    message: 'Funded GPU terminal binding lost stop or unknown truth.',
  })
})

export const canonicalProfessionalGpuFundedTerminalBindingSchema =
  terminalBindingWithoutHashSchema.extend({ terminalBindingHash: sha256 })
    .strict()
export type CanonicalProfessionalGpuFundedTerminalBinding = z.infer<
  typeof canonicalProfessionalGpuFundedTerminalBindingSchema
>

export interface CanonicalProfessionalGpuFundedJobLifecycleStore {
  createPrelaunchAuthorizationOnly(input: {
    readonly record: CanonicalProfessionalGpuFundedPrelaunchAuthorization
  }): Promise<'created' | 'already_exists'>
  rereadPrelaunchAuthorization(input: {
    readonly prelaunchAuthorizationId: string
  }): Promise<unknown>
  createLaunchBindingOnly(input: {
    readonly record: CanonicalProfessionalGpuFundedLaunchBinding
  }): Promise<'created' | 'already_exists'>
  rereadLaunchBinding(input: {
    readonly launchBindingId: string
  }): Promise<unknown>
  createTerminalBindingOnly(input: {
    readonly record: CanonicalProfessionalGpuFundedTerminalBinding
  }): Promise<'created' | 'already_exists'>
  rereadTerminalBinding(input: {
    readonly terminalBindingId: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuFundedJobStartResult {
  readonly prelaunchAuthorization:
    CanonicalProfessionalGpuFundedPrelaunchAuthorization
  readonly launch: CanonicalProfessionalGpuJobLaunch
  readonly launchBinding: CanonicalProfessionalGpuFundedLaunchBinding
}

export interface CanonicalProfessionalGpuFundedLifecycleIdentity {
  readonly fundedAdmissionId: string
  readonly prelaunchAuthorizationId: string
  readonly launchRecordId: string
  readonly launchBindingId: string
  readonly terminalRecordId: string
  readonly terminalBindingId: string
}

export function createCanonicalProfessionalGpuFundedLifecycleIdentity(input: {
  readonly attemptStartAuthority: unknown
}): CanonicalProfessionalGpuFundedLifecycleIdentity {
  const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
    input.attemptStartAuthority,
  )
  return identityForAttemptRef(ref(
    attempt.attemptAuthorityId,
    attempt.attemptAuthorityHash,
  ))
}

export async function prepareCanonicalProfessionalGpuPlanFundedJob(input: {
  readonly fundedAdmissionId: string
  readonly prelaunchAuthorizationId: string
  readonly workspaceId: string
  readonly snapshotId: string
  readonly workItemKey: string
  readonly pricingAuthorityReadPort:
    CanonicalProfessionalGpuPlanPricingAuthorityReadPort
  readonly approvedFundingReadPort:
    CanonicalProfessionalGpuApprovedFundingReadPort
  readonly attemptStartReadPort:
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly runtimeContextReadPort:
    CanonicalProfessionalGpuRuntimeDispatchContextReadPort
  readonly a100CustomerDispatchReadinessReadPort?:
    CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
  readonly fundedLifecycleStore:
    CanonicalProfessionalGpuFundedJobLifecycleStore
  readonly admittedAt: string
  readonly admissionExpiresAt: string
  readonly preparedAt: string
}): Promise<CanonicalProfessionalGpuFundedPrelaunchAuthorization> {
  const fundedAdmission =
    await admitCanonicalProfessionalGpuPlanFundedDispatch({
      fundedAdmissionId: input.fundedAdmissionId,
      workspaceId: input.workspaceId,
      snapshotId: input.snapshotId,
      workItemKey: input.workItemKey,
      pricingAuthorityReadPort: input.pricingAuthorityReadPort,
      approvedFundingReadPort: input.approvedFundingReadPort,
      attemptStartReadPort: input.attemptStartReadPort,
      runtimeContextReadPort: input.runtimeContextReadPort,
      a100CustomerDispatchReadinessReadPort:
        input.a100CustomerDispatchReadinessReadPort,
      admittedAt: input.admittedAt,
      expiresAt: input.admissionExpiresAt,
    })
  const toolAdmission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    fundedAdmission.toolDispatchAdmission,
  )
  const identity = identityForAttemptRef(
    fundedAdmission.attemptStartAuthorityRef,
  )
  if (input.fundedAdmissionId !== identity.fundedAdmissionId
    || input.prelaunchAuthorizationId !== identity.prelaunchAuthorizationId) {
    throw new Error(
      'Funded GPU preparation IDs differ from the authenticated attempt.',
    )
  }
  if (Date.parse(input.preparedAt) < Date.parse(fundedAdmission.admittedAt)
    || Date.parse(input.preparedAt) >= Date.parse(fundedAdmission.expiresAt)) {
    throw new Error('Funded GPU admission is not current at preparation.')
  }
  const payload = prelaunchWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    prelaunchAuthorizationId: input.prelaunchAuthorizationId,
    fundedDispatchAdmission: fundedAdmission,
    fundedDispatchAdmissionRef: ref(
      fundedAdmission.fundedAdmissionId,
      fundedAdmission.fundedAdmissionHash,
    ),
    toolDispatchAdmissionRef: ref(
      toolAdmission.admissionId,
      toolAdmission.admissionHash,
    ),
    pricingAuthorityBundleRef: fundedAdmission.pricingAuthorityBundleRef,
    preapprovalManifestRef: fundedAdmission.preapprovalManifestRef,
    publicationBindingRef: fundedAdmission.publicationBindingRef,
    approvedFundingObservationRef:
      fundedAdmission.approvedFundingObservationRef,
    attemptStartAuthorityRef: fundedAdmission.attemptStartAuthorityRef,
    approvedSnapshotRef: fundedAdmission.approvedSnapshotRef,
    fundedReservationRef: fundedAdmission.fundedReservationRef,
    approvedWorkItemRef: fundedAdmission.approvedWorkItemRef,
    exactFundedAdmissionPersistedBeforeCloudJobCreation: true,
    directLowLevelAdmissionLaunchAcceptedByPlanLifecycle: false,
    fullCustomerEstimateFundedBeforeCloudJobCreation: true,
    createOnlyPersistenceVerified: true,
    exactPostPersistenceReread: true,
    customerCreditsMutated: false,
    cloudJobCreated: false,
    preparedAt: input.preparedAt,
  })
  const prelaunch = canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema
    .parse({
      ...payload,
      prelaunchAuthorizationHash: sha256AuthorityValue(payload),
    })
  const disposition =
    await input.fundedLifecycleStore.createPrelaunchAuthorizationOnly({
      record: prelaunch,
    })
  if (disposition !== 'created' && disposition !== 'already_exists') {
    throw new Error('Funded GPU prelaunch preparation was not persisted.')
  }
  const reread = assertCanonicalProfessionalGpuFundedPrelaunch(
    await input.fundedLifecycleStore.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId: prelaunch.prelaunchAuthorizationId,
    }),
  )
  if (reread.prelaunchAuthorizationHash !==
    prelaunch.prelaunchAuthorizationHash) {
    throw new Error('Funded GPU prelaunch preparation reread changed.')
  }
  return reread
}

export async function launchCanonicalProfessionalGpuPreparedPlanFundedJob(
  input: {
    readonly launchRecordId: string
    readonly launchBindingId: string
    readonly prelaunchAuthorization: unknown
    readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
    readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
    readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore & {
      rereadLaunchRecord(input: {
        readonly launchRecordId: string
      }): Promise<unknown>
    }
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
    readonly startedAt: string
  },
): Promise<CanonicalProfessionalGpuFundedJobStartResult> {
  const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
    input.prelaunchAuthorization,
  )
  const identity = identityForAttemptRef(prelaunch.attemptStartAuthorityRef)
  if (input.launchRecordId !== identity.launchRecordId
    || input.launchBindingId !== identity.launchBindingId) {
    throw new Error('Prepared GPU launch IDs differ from funded authority.')
  }
  const existingRaw = await input.fundedLifecycleStore.rereadLaunchBinding({
    launchBindingId: input.launchBindingId,
  })
  if (existingRaw !== null) {
    const existing = assertCanonicalProfessionalGpuFundedLaunchBinding(
      existingRaw,
    )
    const launch = assertCanonicalProfessionalGpuJobLaunch(
      await input.lifecycleStore.rereadLaunchRecord({
        launchRecordId: input.launchRecordId,
      }),
    )
    if (!sameRef(existing.prelaunchAuthorizationRef, ref(
      prelaunch.prelaunchAuthorizationId,
      prelaunch.prelaunchAuthorizationHash,
    )) || !sameRef(existing.launchRef, ref(
      launch.launchRecordId,
      launch.launchHash,
    ))) throw new Error('Prepared GPU launch replay changed lineage.')
    return Object.freeze({
      prelaunchAuthorization: prelaunch,
      launch,
      launchBinding: existing,
    })
  }
  const launch = await startCanonicalProfessionalGpuJob({
    launchRecordId: input.launchRecordId,
    admission: prelaunch.fundedDispatchAdmission.toolDispatchAdmission,
    releaseReadPort: input.releaseReadPort,
    launchPort: input.launchPort,
    store: input.lifecycleStore,
    startedAt: input.startedAt,
  })
  const payload = launchBindingWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_LAUNCH_BINDING_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    launchBindingId: input.launchBindingId,
    prelaunchAuthorizationRef: ref(
      prelaunch.prelaunchAuthorizationId,
      prelaunch.prelaunchAuthorizationHash,
    ),
    fundedDispatchAdmissionRef: prelaunch.fundedDispatchAdmissionRef,
    toolDispatchAdmissionRef: prelaunch.toolDispatchAdmissionRef,
    pricingAuthorityBundleRef: prelaunch.pricingAuthorityBundleRef,
    preapprovalManifestRef: prelaunch.preapprovalManifestRef,
    publicationBindingRef: prelaunch.publicationBindingRef,
    approvedFundingObservationRef: prelaunch.approvedFundingObservationRef,
    attemptStartAuthorityRef: prelaunch.attemptStartAuthorityRef,
    approvedSnapshotRef: prelaunch.approvedSnapshotRef,
    fundedReservationRef: prelaunch.fundedReservationRef,
    approvedWorkItemRef: prelaunch.approvedWorkItemRef,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    launchDisposition: launch.launchDisposition,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      launch.providerInferenceOrSubstantiveWorkKnownExecuted,
    routeId: launch.routeId,
    accelerator: launch.accelerator,
    minimumIdleInstances: launch.minimumIdleInstances,
    fundedPrelaunchRereadBeforeCloudJobCreation: true,
    userTriggeredScaleFromZero: true,
    retryAllowedWithoutCanonicalReconciliation: false,
    unknownLaunchOutcomeBlocksRetry:
      launch.launchDisposition === 'job_creation_outcome_unknown'
      || launch.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown',
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    boundAt: launch.launchedAt,
  })
  const binding = canonicalProfessionalGpuFundedLaunchBindingSchema.parse({
    ...payload,
    launchBindingHash: sha256AuthorityValue(payload),
  })
  if (await input.fundedLifecycleStore.createLaunchBindingOnly({
    record: binding,
  }) !== 'created') throw new Error('Funded GPU launch binding exists.')
  const reread = assertCanonicalProfessionalGpuFundedLaunchBinding(
    await input.fundedLifecycleStore.rereadLaunchBinding({
      launchBindingId: binding.launchBindingId,
    }),
  )
  if (reread.launchBindingHash !== binding.launchBindingHash) {
    throw new Error('Prepared GPU launch binding reread changed.')
  }
  return Object.freeze({
    prelaunchAuthorization: prelaunch,
    launch,
    launchBinding: reread,
  })
}

export async function startCanonicalProfessionalGpuPlanFundedJob(input: {
  readonly fundedAdmissionId: string
  readonly prelaunchAuthorizationId: string
  readonly launchRecordId: string
  readonly launchBindingId: string
  readonly workspaceId: string
  readonly snapshotId: string
  readonly workItemKey: string
  readonly pricingAuthorityReadPort:
    CanonicalProfessionalGpuPlanPricingAuthorityReadPort
  readonly approvedFundingReadPort:
    CanonicalProfessionalGpuApprovedFundingReadPort
  readonly attemptStartReadPort:
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly runtimeContextReadPort:
    CanonicalProfessionalGpuRuntimeDispatchContextReadPort
  readonly a100CustomerDispatchReadinessReadPort?:
    CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
  readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
  readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
  readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore
  readonly fundedLifecycleStore:
    CanonicalProfessionalGpuFundedJobLifecycleStore
  readonly admittedAt: string
  readonly admissionExpiresAt: string
  readonly startedAt: string
}): Promise<CanonicalProfessionalGpuFundedJobStartResult> {
  const fundedAdmission =
    await admitCanonicalProfessionalGpuPlanFundedDispatch({
      fundedAdmissionId: input.fundedAdmissionId,
      workspaceId: input.workspaceId,
      snapshotId: input.snapshotId,
      workItemKey: input.workItemKey,
      pricingAuthorityReadPort: input.pricingAuthorityReadPort,
      approvedFundingReadPort: input.approvedFundingReadPort,
      attemptStartReadPort: input.attemptStartReadPort,
      runtimeContextReadPort: input.runtimeContextReadPort,
      a100CustomerDispatchReadinessReadPort:
        input.a100CustomerDispatchReadinessReadPort,
      admittedAt: input.admittedAt,
      expiresAt: input.admissionExpiresAt,
    })
  const toolAdmission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    fundedAdmission.toolDispatchAdmission,
  )
  const identity = identityForAttemptRef(
    fundedAdmission.attemptStartAuthorityRef,
  )
  if (
    input.fundedAdmissionId !== identity.fundedAdmissionId
    || input.prelaunchAuthorizationId !== identity.prelaunchAuthorizationId
    || input.launchRecordId !== identity.launchRecordId
    || input.launchBindingId !== identity.launchBindingId
  ) throw new Error(
    'Funded GPU lifecycle IDs differ from the authenticated attempt identity.',
  )
  if (
    Date.parse(input.startedAt) < Date.parse(fundedAdmission.admittedAt)
    || Date.parse(input.startedAt) >= Date.parse(fundedAdmission.expiresAt)
  ) throw new Error('Funded GPU admission is not current at launch.')

  const prelaunchPayload = prelaunchWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    prelaunchAuthorizationId: input.prelaunchAuthorizationId,
    fundedDispatchAdmission: fundedAdmission,
    fundedDispatchAdmissionRef: ref(
      fundedAdmission.fundedAdmissionId,
      fundedAdmission.fundedAdmissionHash,
    ),
    toolDispatchAdmissionRef: ref(
      toolAdmission.admissionId,
      toolAdmission.admissionHash,
    ),
    pricingAuthorityBundleRef: fundedAdmission.pricingAuthorityBundleRef,
    preapprovalManifestRef: fundedAdmission.preapprovalManifestRef,
    publicationBindingRef: fundedAdmission.publicationBindingRef,
    approvedFundingObservationRef:
      fundedAdmission.approvedFundingObservationRef,
    attemptStartAuthorityRef: fundedAdmission.attemptStartAuthorityRef,
    approvedSnapshotRef: fundedAdmission.approvedSnapshotRef,
    fundedReservationRef: fundedAdmission.fundedReservationRef,
    approvedWorkItemRef: fundedAdmission.approvedWorkItemRef,
    exactFundedAdmissionPersistedBeforeCloudJobCreation: true,
    directLowLevelAdmissionLaunchAcceptedByPlanLifecycle: false,
    fullCustomerEstimateFundedBeforeCloudJobCreation: true,
    createOnlyPersistenceVerified: true,
    exactPostPersistenceReread: true,
    customerCreditsMutated: false,
    cloudJobCreated: false,
    preparedAt: input.startedAt,
  })
  const prelaunch = canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema
    .parse({
      ...prelaunchPayload,
      prelaunchAuthorizationHash: sha256AuthorityValue(prelaunchPayload),
    })
  if (await input.fundedLifecycleStore.createPrelaunchAuthorizationOnly({
    record: prelaunch,
  }) !== 'created') {
    throw new Error('Funded GPU prelaunch authorization already exists.')
  }
  const rereadPrelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
    await input.fundedLifecycleStore.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId: prelaunch.prelaunchAuthorizationId,
    }),
  )
  if (rereadPrelaunch.prelaunchAuthorizationHash !==
    prelaunch.prelaunchAuthorizationHash) {
    throw new Error('Funded GPU prelaunch authorization reread changed.')
  }

  const launch = await startCanonicalProfessionalGpuJob({
    launchRecordId: input.launchRecordId,
    admission: rereadPrelaunch.fundedDispatchAdmission.toolDispatchAdmission,
    releaseReadPort: input.releaseReadPort,
    launchPort: input.launchPort,
    store: input.lifecycleStore,
    startedAt: input.startedAt,
  })
  const launchPayload = launchBindingWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_LAUNCH_BINDING_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    launchBindingId: input.launchBindingId,
    prelaunchAuthorizationRef: ref(
      prelaunch.prelaunchAuthorizationId,
      prelaunch.prelaunchAuthorizationHash,
    ),
    fundedDispatchAdmissionRef: prelaunch.fundedDispatchAdmissionRef,
    toolDispatchAdmissionRef: prelaunch.toolDispatchAdmissionRef,
    pricingAuthorityBundleRef: prelaunch.pricingAuthorityBundleRef,
    preapprovalManifestRef: prelaunch.preapprovalManifestRef,
    publicationBindingRef: prelaunch.publicationBindingRef,
    approvedFundingObservationRef: prelaunch.approvedFundingObservationRef,
    attemptStartAuthorityRef: prelaunch.attemptStartAuthorityRef,
    approvedSnapshotRef: prelaunch.approvedSnapshotRef,
    fundedReservationRef: prelaunch.fundedReservationRef,
    approvedWorkItemRef: prelaunch.approvedWorkItemRef,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    launchDisposition: launch.launchDisposition,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      launch.providerInferenceOrSubstantiveWorkKnownExecuted,
    routeId: launch.routeId,
    accelerator: launch.accelerator,
    minimumIdleInstances: launch.minimumIdleInstances,
    fundedPrelaunchRereadBeforeCloudJobCreation: true,
    userTriggeredScaleFromZero: true,
    retryAllowedWithoutCanonicalReconciliation: false,
    unknownLaunchOutcomeBlocksRetry:
      launch.launchDisposition === 'job_creation_outcome_unknown'
      || launch.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown',
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    boundAt: launch.launchedAt,
  })
  const launchBinding = canonicalProfessionalGpuFundedLaunchBindingSchema
    .parse({
      ...launchPayload,
      launchBindingHash: sha256AuthorityValue(launchPayload),
    })
  if (await input.fundedLifecycleStore.createLaunchBindingOnly({
    record: launchBinding,
  }) !== 'created') throw new Error('Funded GPU launch binding exists.')
  const rereadLaunchBinding = assertCanonicalProfessionalGpuFundedLaunchBinding(
    await input.fundedLifecycleStore.rereadLaunchBinding({
      launchBindingId: launchBinding.launchBindingId,
    }),
  )
  if (rereadLaunchBinding.launchBindingHash !== launchBinding.launchBindingHash) {
    throw new Error('Funded GPU launch binding reread changed.')
  }
  return Object.freeze({
    prelaunchAuthorization: rereadPrelaunch,
    launch,
    launchBinding: rereadLaunchBinding,
  })
}

export async function recordCanonicalProfessionalGpuPlanFundedTerminal(
  input: {
    readonly terminalRecordId: string
    readonly terminalBindingId: string
    readonly launch: unknown
    readonly launchBindingId: string
    readonly terminalObservationPort:
      CanonicalProfessionalGpuTerminalObservationPort
    readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
  },
): Promise<{
  readonly terminal: CanonicalProfessionalGpuJobTerminal
  readonly terminalBinding: CanonicalProfessionalGpuFundedTerminalBinding
}> {
  const launch = assertCanonicalProfessionalGpuJobLaunch(input.launch)
  const launchBinding = assertCanonicalProfessionalGpuFundedLaunchBinding(
    await input.fundedLifecycleStore.rereadLaunchBinding({
      launchBindingId: input.launchBindingId,
    }),
  )
  const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
    await input.fundedLifecycleStore.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId: launchBinding.prelaunchAuthorizationRef.id,
    }),
  )
  const identity = identityForAttemptRef(prelaunch.attemptStartAuthorityRef)
  if (
    input.launchBindingId !== identity.launchBindingId
    || input.terminalRecordId !== identity.terminalRecordId
    || input.terminalBindingId !== identity.terminalBindingId
    || !sameRef(launchBinding.launchRef,
      ref(launch.launchRecordId, launch.launchHash))
    || !sameRef(launchBinding.prelaunchAuthorizationRef,
      ref(prelaunch.prelaunchAuthorizationId,
        prelaunch.prelaunchAuthorizationHash))
    || !sameRef(launchBinding.fundedDispatchAdmissionRef,
      prelaunch.fundedDispatchAdmissionRef)
    || !sameRef(launchBinding.toolDispatchAdmissionRef,
      launch.admissionRef)
  ) throw new Error('Funded GPU launch lineage changed before terminal read.')

  const terminal = await recordCanonicalProfessionalGpuJobTerminal({
    terminalRecordId: input.terminalRecordId,
    launch,
    terminalObservationPort: input.terminalObservationPort,
    store: input.lifecycleStore,
  })
  const terminalPayload = terminalBindingWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_TERMINAL_BINDING_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    terminalBindingId: input.terminalBindingId,
    prelaunchAuthorizationRef: launchBinding.prelaunchAuthorizationRef,
    fundedDispatchAdmissionRef: launchBinding.fundedDispatchAdmissionRef,
    launchBindingRef: ref(
      launchBinding.launchBindingId,
      launchBinding.launchBindingHash,
    ),
    launchRef: launchBinding.launchRef,
    terminalRef: ref(terminal.terminalRecordId, terminal.terminalHash),
    attemptStartAuthorityRef: launchBinding.attemptStartAuthorityRef,
    approvedSnapshotRef: launchBinding.approvedSnapshotRef,
    fundedReservationRef: launchBinding.fundedReservationRef,
    approvedWorkItemRef: launchBinding.approvedWorkItemRef,
    attemptCostReceiptRef: terminal.attemptCostReceiptRef,
    terminalOutcome: terminal.terminalOutcome,
    providerInferenceOrSubstantiveWorkOutcome:
      terminal.providerInferenceOrSubstantiveWorkOutcome,
    activeGpuInstancesAfterTerminalObservation:
      terminal.activeGpuInstancesAfterTerminalObservation,
    workerStoppedVerified: terminal.workerStoppedVerified,
    retryAllowedWithoutCanonicalReconciliation: false,
    unknownOutcomeBlocksRetry: terminal.unknownOutcomeBlocksRetry,
    retryRequiresCanonicalTerminalCostAndCapacityReconciliation: true,
    exactFundedPlanLaunchAndTerminalReread: true,
    costReceiptPersistedBeforeSettlement:
      terminal.costReceiptPersistedBeforeSettlement,
    terminalSettlementOwnerMustReconcileReservation: true,
    customerWalletOrLedgerMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    boundAt: terminal.observedAt,
  })
  const terminalBinding = canonicalProfessionalGpuFundedTerminalBindingSchema
    .parse({
      ...terminalPayload,
      terminalBindingHash: sha256AuthorityValue(terminalPayload),
    })
  if (await input.fundedLifecycleStore.createTerminalBindingOnly({
    record: terminalBinding,
  }) !== 'created') throw new Error('Funded GPU terminal binding exists.')
  const reread = assertCanonicalProfessionalGpuFundedTerminalBinding(
    await input.fundedLifecycleStore.rereadTerminalBinding({
      terminalBindingId: terminalBinding.terminalBindingId,
    }),
  )
  if (reread.terminalBindingHash !== terminalBinding.terminalBindingHash) {
    throw new Error('Funded GPU terminal binding reread changed.')
  }
  return Object.freeze({ terminal, terminalBinding: reread })
}

export function assertCanonicalProfessionalGpuFundedPrelaunch(
  value: unknown,
): CanonicalProfessionalGpuFundedPrelaunchAuthorization {
  assertPlainSerializedData(value, 'gpu_funded_prelaunch')
  const record = canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema
    .parse(value)
  const { prelaunchAuthorizationHash, ...payload } = record
  const admission = assertCanonicalProfessionalGpuFundedDispatchAdmission(
    record.fundedDispatchAdmission,
  )
  const identity = identityForAttemptRef(record.attemptStartAuthorityRef)
  if (
    prelaunchAuthorizationHash !== sha256AuthorityValue(payload)
    || record.prelaunchAuthorizationId !== identity.prelaunchAuthorizationId
    || admission.fundedAdmissionId !== identity.fundedAdmissionId
    || !sameRef(record.attemptStartAuthorityRef,
      admission.attemptStartAuthorityRef)
    || !sameRef(record.fundedDispatchAdmissionRef,
      ref(admission.fundedAdmissionId, admission.fundedAdmissionHash))
    || !sameRef(record.toolDispatchAdmissionRef, ref(
      admission.toolDispatchAdmission.admissionId,
      admission.toolDispatchAdmission.admissionHash,
    ))
  ) throw new Error('Funded GPU prelaunch authorization is invalid.')
  return record
}

export function assertCanonicalProfessionalGpuFundedLaunchBinding(
  value: unknown,
): CanonicalProfessionalGpuFundedLaunchBinding {
  assertPlainSerializedData(value, 'gpu_funded_launch_binding')
  const record = canonicalProfessionalGpuFundedLaunchBindingSchema.parse(value)
  const { launchBindingHash, ...payload } = record
  const identity = identityForAttemptRef(record.attemptStartAuthorityRef)
  if (
    launchBindingHash !== sha256AuthorityValue(payload)
    || record.launchBindingId !== identity.launchBindingId
    || record.prelaunchAuthorizationRef.id !==
      identity.prelaunchAuthorizationId
    || record.fundedDispatchAdmissionRef.id !== identity.fundedAdmissionId
    || record.launchRef.id !== identity.launchRecordId
  ) {
    throw new Error('Funded GPU launch binding is invalid.')
  }
  return record
}

export function assertCanonicalProfessionalGpuFundedTerminalBinding(
  value: unknown,
): CanonicalProfessionalGpuFundedTerminalBinding {
  assertPlainSerializedData(value, 'gpu_funded_terminal_binding')
  const record = canonicalProfessionalGpuFundedTerminalBindingSchema
    .parse(value)
  const { terminalBindingHash, ...payload } = record
  const identity = identityForAttemptRef(record.attemptStartAuthorityRef)
  if (
    terminalBindingHash !== sha256AuthorityValue(payload)
    || record.terminalBindingId !== identity.terminalBindingId
    || record.prelaunchAuthorizationRef.id !==
      identity.prelaunchAuthorizationId
    || record.fundedDispatchAdmissionRef.id !== identity.fundedAdmissionId
    || record.launchBindingRef.id !== identity.launchBindingId
    || record.launchRef.id !== identity.launchRecordId
    || record.terminalRef.id !== identity.terminalRecordId
  ) {
    throw new Error('Funded GPU terminal binding is invalid.')
  }
  return record
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

function identityForAttemptRef(
  attemptStartAuthorityRef: z.infer<typeof evidenceRefSchema>,
): CanonicalProfessionalGpuFundedLifecycleIdentity {
  const digest = attemptStartAuthorityRef.contentHash.slice('sha256:'.length)
  return Object.freeze({
    fundedAdmissionId: `gpu-funded-admission-${digest}`,
    prelaunchAuthorizationId: `gpu-funded-prelaunch-${digest}`,
    launchRecordId: `gpu-funded-launch-${digest}`,
    launchBindingId: `gpu-funded-launch-binding-${digest}`,
    terminalRecordId: `gpu-funded-terminal-${digest}`,
    terminalBindingId: `gpu-funded-terminal-binding-${digest}`,
  })
}
