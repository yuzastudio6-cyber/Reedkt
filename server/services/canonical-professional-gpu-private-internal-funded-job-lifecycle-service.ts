import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  admitCanonicalProfessionalGpuPlanFundedPrivateInternalDispatch,
  assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission,
  canonicalProfessionalGpuPrivateInternalFundedDispatchAdmissionSchema,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema,
  launchCanonicalProfessionalGpuPreparedPlanFundedJob,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
  type CanonicalProfessionalGpuFundedJobStartResult,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuCloudJobLaunchPort,
  CanonicalProfessionalGpuJobLifecycleStore,
  CanonicalProfessionalGpuRuntimeReleaseReadPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSam31PrivateInternalDispatchReadinessReadPort,
} from './canonical-sam3_1-private-internal-dispatch-readiness-owner'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_PRIVATE_INTERNAL_PRELAUNCH_BINDING_VERSION =
  'canonical-professional-gpu-private-internal-prelaunch-binding-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/private-internal-prelaunch-bindings'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const bindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PRIVATE_INTERNAL_PRELAUNCH_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_private_internal_job_lifecycle_owner',
  ),
  evidenceClass: z.literal(
    'create_only_private_internal_admission_before_gpu_launch',
  ),
  bindingId: safeId,
  privateInternalFundedDispatchAdmission:
    canonicalProfessionalGpuPrivateInternalFundedDispatchAdmissionSchema,
  privateInternalFundedDispatchAdmissionRef: refSchema,
  privateInternalDispatchReadinessRef: refSchema,
  fundedDispatchAdmissionRef: refSchema,
  toolDispatchAdmissionRef: refSchema,
  runtimeReleaseRef: refSchema,
  currentRateAuthorityRef: refSchema,
  attemptStartAuthorityRef: refSchema,
  approvedSnapshotRef: refSchema,
  fundedReservationRef: refSchema,
  approvedWorkItemRef: refSchema,
  prelaunchAuthorizationId: safeId,
  exactPrivateInternalAdmissionPersistedBeforeGpuLaunch: z.literal(true),
  exactPrivateReadinessReleaseRateAndFundedPlanLineage: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  privateInternalQualificationOnly: z.literal(true),
  customerOrPublicDispatchAuthorized: z.literal(false),
  callerRouteModelImageCommandOrPriceAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  cloudJobCreated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((binding, context) => {
  const admission = binding.privateInternalFundedDispatchAdmission
  const funded = admission.fundedDispatchAdmission
  const tool = funded.toolDispatchAdmission
  const exact = sameRef(binding.privateInternalDispatchReadinessRef,
    admission.privateInternalDispatchReadinessRef)
    && sameRef(binding.fundedDispatchAdmissionRef, ref(
      funded.fundedAdmissionId,
      funded.fundedAdmissionHash,
    ))
    && sameRef(binding.toolDispatchAdmissionRef, ref(
      tool.admissionId,
      tool.admissionHash,
    ))
    && sameRef(binding.runtimeReleaseRef, admission.runtimeReleaseRef)
    && sameRef(binding.currentRateAuthorityRef,
      admission.currentRateAuthorityRef)
    && sameRef(binding.attemptStartAuthorityRef,
      funded.attemptStartAuthorityRef)
    && sameRef(binding.approvedSnapshotRef, funded.approvedSnapshotRef)
    && sameRef(binding.fundedReservationRef, funded.fundedReservationRef)
    && sameRef(binding.approvedWorkItemRef, funded.approvedWorkItemRef)
    && Date.parse(binding.preparedAt) >= Date.parse(admission.admittedAt)
    && Date.parse(binding.preparedAt) < Date.parse(admission.expiresAt)
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Private-internal GPU prelaunch binding lost admission lineage.',
  })
})

export const canonicalProfessionalGpuPrivateInternalPrelaunchBindingSchema =
  bindingWithoutHashSchema.extend({ bindingHash: sha256 }).strict()
export type CanonicalProfessionalGpuPrivateInternalPrelaunchBinding = z.infer<
  typeof canonicalProfessionalGpuPrivateInternalPrelaunchBindingSchema
>

export interface CanonicalProfessionalGpuPrivateInternalPrelaunchBindingRepository {
  readonly schemaVersion:
    'canonical-professional-gpu-private-internal-prelaunch-binding-repository-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  persistCreateOnly(input: {
    readonly binding: CanonicalProfessionalGpuPrivateInternalPrelaunchBinding
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly bindingId: string }): Promise<unknown>
}

export interface CanonicalProfessionalGpuPrivateInternalJobStartResult
  extends CanonicalProfessionalGpuFundedJobStartResult {
  readonly privateInternalPrelaunchBinding:
    CanonicalProfessionalGpuPrivateInternalPrelaunchBinding
}

export function createCanonicalProfessionalGpuPrivateInternalPrelaunchBindingRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalProfessionalGpuPrivateInternalPrelaunchBindingRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('Private-internal GPU lifecycle store is absent.')
  }
  const prefix = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((value) => !value.includes('..')
      && !value.includes('//') && !value.endsWith('/'))
    .parse(input.prefix ?? DEFAULT_PREFIX)
  const pathFor = (bindingId: string) => {
    const id = safeId.parse(bindingId)
    const digest = createHash('sha256').update(id).digest('hex')
    return `${prefix}/${digest}.json`
  }
  const reread = async ({ bindingId }: { readonly bindingId: string }) => {
    const body = await input.objectPort.readExact(pathFor(bindingId))
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('Private-internal GPU lifecycle bytes changed.')
    }
    const parsed = assertCanonicalProfessionalGpuPrivateInternalPrelaunchBinding(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
      throw new TypeError('Private-internal GPU lifecycle serialization changed.')
    }
    return parsed
  }
  return Object.freeze({
    schemaVersion:
      'canonical-professional-gpu-private-internal-prelaunch-binding-repository-v1' as const,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async persistCreateOnly({ binding: untrusted }: {
      readonly binding:
        CanonicalProfessionalGpuPrivateInternalPrelaunchBinding
    }) {
      const binding =
        assertCanonicalProfessionalGpuPrivateInternalPrelaunchBinding(
          untrusted,
        )
      const body = Buffer.from(stableAuthorityStringify(binding), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new TypeError('Private-internal GPU lifecycle record is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: pathFor(binding.bindingId),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread({ bindingId: binding.bindingId })
      if (!exact || exact.bindingHash !== binding.bindingHash) {
        throw new TypeError('Private-internal GPU lifecycle reread changed.')
      }
      return disposition
    },
    reread,
  })
}

export async function startCanonicalProfessionalGpuPlanFundedPrivateInternalJob(
  input: {
    readonly privateInternalBindingId: string
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
    readonly privateInternalDispatchReadinessReadPort:
      CanonicalSam31PrivateInternalDispatchReadinessReadPort
    readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
    readonly launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
    readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore & {
      rereadLaunchRecord(input: {
        readonly launchRecordId: string
      }): Promise<unknown>
    }
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
    readonly privateInternalBindingRepository:
      CanonicalProfessionalGpuPrivateInternalPrelaunchBindingRepository
    readonly admittedAt: string
    readonly admissionExpiresAt: string
    readonly startedAt: string
  },
): Promise<CanonicalProfessionalGpuPrivateInternalJobStartResult> {
  const privateAdmission =
    await admitCanonicalProfessionalGpuPlanFundedPrivateInternalDispatch({
      fundedAdmissionId: input.fundedAdmissionId,
      workspaceId: input.workspaceId,
      snapshotId: input.snapshotId,
      workItemKey: input.workItemKey,
      pricingAuthorityReadPort: input.pricingAuthorityReadPort,
      approvedFundingReadPort: input.approvedFundingReadPort,
      attemptStartReadPort: input.attemptStartReadPort,
      runtimeContextReadPort: input.runtimeContextReadPort,
      privateInternalDispatchReadinessReadPort:
        input.privateInternalDispatchReadinessReadPort,
      admittedAt: input.admittedAt,
      expiresAt: input.admissionExpiresAt,
    })
  const funded = privateAdmission.fundedDispatchAdmission
  const tool = assertCanonicalProfessionalToolGpuDispatchAdmission(
    funded.toolDispatchAdmission,
  )
  const identity = identityForAttemptRef(funded.attemptStartAuthorityRef)
  if (input.fundedAdmissionId !== identity.fundedAdmissionId
    || input.prelaunchAuthorizationId !== identity.prelaunchAuthorizationId
    || input.launchRecordId !== identity.launchRecordId
    || input.launchBindingId !== identity.launchBindingId) {
    throw new TypeError(
      'Private-internal GPU lifecycle IDs differ from the approved attempt.',
    )
  }
  if (Date.parse(input.startedAt) < Date.parse(privateAdmission.admittedAt)
    || Date.parse(input.startedAt) >= Date.parse(privateAdmission.expiresAt)) {
    throw new TypeError('Private-internal GPU admission is not current.')
  }

  const bindingPayload = bindingWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PRIVATE_INTERNAL_PRELAUNCH_BINDING_VERSION,
    source:
      'canonical_server_professional_gpu_private_internal_job_lifecycle_owner',
    evidenceClass:
      'create_only_private_internal_admission_before_gpu_launch',
    bindingId: input.privateInternalBindingId,
    privateInternalFundedDispatchAdmission: privateAdmission,
    privateInternalFundedDispatchAdmissionRef: ref(
      `gpu-private-internal-admission-${privateAdmission.privateInternalFundedAdmissionHash}`,
      privateAdmission.privateInternalFundedAdmissionHash,
    ),
    privateInternalDispatchReadinessRef:
      privateAdmission.privateInternalDispatchReadinessRef,
    fundedDispatchAdmissionRef: ref(
      funded.fundedAdmissionId,
      funded.fundedAdmissionHash,
    ),
    toolDispatchAdmissionRef: ref(tool.admissionId, tool.admissionHash),
    runtimeReleaseRef: privateAdmission.runtimeReleaseRef,
    currentRateAuthorityRef: privateAdmission.currentRateAuthorityRef,
    attemptStartAuthorityRef: funded.attemptStartAuthorityRef,
    approvedSnapshotRef: funded.approvedSnapshotRef,
    fundedReservationRef: funded.fundedReservationRef,
    approvedWorkItemRef: funded.approvedWorkItemRef,
    prelaunchAuthorizationId: input.prelaunchAuthorizationId,
    exactPrivateInternalAdmissionPersistedBeforeGpuLaunch: true,
    exactPrivateReadinessReleaseRateAndFundedPlanLineage: true,
    userTriggeredScaleFromZero: true,
    privateInternalQualificationOnly: true,
    customerOrPublicDispatchAuthorized: false,
    callerRouteModelImageCommandOrPriceAccepted: false,
    customerCreditsMutated: false,
    cloudJobCreated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    preparedAt: input.startedAt,
  })
  const binding =
    assertCanonicalProfessionalGpuPrivateInternalPrelaunchBinding({
      ...bindingPayload,
      bindingHash: sha256AuthorityValue(bindingPayload),
    })
  await input.privateInternalBindingRepository.persistCreateOnly({ binding })
  const rereadBinding =
    assertCanonicalProfessionalGpuPrivateInternalPrelaunchBinding(
      await input.privateInternalBindingRepository.reread({
        bindingId: binding.bindingId,
      }),
    )
  if (rereadBinding.bindingHash !== binding.bindingHash) {
    throw new TypeError('Private-internal prelaunch binding reread changed.')
  }

  const prelaunchPayload = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_FUNDED_PRELAUNCH_VERSION,
    source: 'canonical_server_professional_gpu_funded_job_lifecycle_owner',
    evidenceClass: 'canonical_private_reread',
    prelaunchAuthorizationId: input.prelaunchAuthorizationId,
    fundedDispatchAdmission: funded,
    fundedDispatchAdmissionRef: ref(
      funded.fundedAdmissionId,
      funded.fundedAdmissionHash,
    ),
    toolDispatchAdmissionRef: ref(tool.admissionId, tool.admissionHash),
    pricingAuthorityBundleRef: funded.pricingAuthorityBundleRef,
    preapprovalManifestRef: funded.preapprovalManifestRef,
    publicationBindingRef: funded.publicationBindingRef,
    approvedFundingObservationRef: funded.approvedFundingObservationRef,
    attemptStartAuthorityRef: funded.attemptStartAuthorityRef,
    approvedSnapshotRef: funded.approvedSnapshotRef,
    fundedReservationRef: funded.fundedReservationRef,
    approvedWorkItemRef: funded.approvedWorkItemRef,
    exactFundedAdmissionPersistedBeforeCloudJobCreation: true,
    directLowLevelAdmissionLaunchAcceptedByPlanLifecycle: false,
    fullCustomerEstimateFundedBeforeCloudJobCreation: true,
    createOnlyPersistenceVerified: true,
    exactPostPersistenceReread: true,
    customerCreditsMutated: false,
    cloudJobCreated: false,
    preparedAt: input.startedAt,
  } as const
  const prelaunch = canonicalProfessionalGpuFundedPrelaunchAuthorizationSchema
    .parse({
      ...prelaunchPayload,
      prelaunchAuthorizationHash: sha256AuthorityValue(prelaunchPayload),
    })
  const disposition =
    await input.fundedLifecycleStore.createPrelaunchAuthorizationOnly({
      record: prelaunch,
    })
  if (disposition !== 'created' && disposition !== 'already_exists') {
    throw new TypeError('Private-internal funded prelaunch was not persisted.')
  }
  const rereadPrelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
    await input.fundedLifecycleStore.rereadPrelaunchAuthorization({
      prelaunchAuthorizationId: prelaunch.prelaunchAuthorizationId,
    }),
  )
  if (rereadPrelaunch.prelaunchAuthorizationHash !==
    prelaunch.prelaunchAuthorizationHash) {
    throw new TypeError('Private-internal funded prelaunch reread changed.')
  }
  const started = await launchCanonicalProfessionalGpuPreparedPlanFundedJob({
    launchRecordId: input.launchRecordId,
    launchBindingId: input.launchBindingId,
    prelaunchAuthorization: rereadPrelaunch,
    releaseReadPort: input.releaseReadPort,
    launchPort: input.launchPort,
    lifecycleStore: input.lifecycleStore,
    fundedLifecycleStore: input.fundedLifecycleStore,
    startedAt: input.startedAt,
  })
  return Object.freeze({
    ...started,
    privateInternalPrelaunchBinding: rereadBinding,
  })
}

export function assertCanonicalProfessionalGpuPrivateInternalPrelaunchBinding(
  value: unknown,
): CanonicalProfessionalGpuPrivateInternalPrelaunchBinding {
  assertPlainSerializedData(value, 'gpu_private_internal_prelaunch_binding')
  const binding =
    canonicalProfessionalGpuPrivateInternalPrelaunchBindingSchema.parse(value)
  const { bindingHash, ...payload } = binding
  const admission =
    assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission(
      binding.privateInternalFundedDispatchAdmission,
    )
  const identity = identityForAttemptRef(binding.attemptStartAuthorityRef)
  if (bindingHash !== sha256AuthorityValue(payload)
    || admission.privateInternalFundedAdmissionHash !==
      binding.privateInternalFundedDispatchAdmission
        .privateInternalFundedAdmissionHash
    || binding.prelaunchAuthorizationId !== identity.prelaunchAuthorizationId
    || binding.bindingId !==
      `${identity.prelaunchAuthorizationId}.private-internal`) {
    throw new TypeError('Private-internal GPU prelaunch binding is invalid.')
  }
  return Object.freeze(structuredClone(binding))
}

function identityForAttemptRef(value: z.infer<typeof refSchema>) {
  const digest = value.contentHash.slice('sha256:'.length)
  return Object.freeze({
    fundedAdmissionId: `gpu-funded-admission-${digest}`,
    prelaunchAuthorizationId: `gpu-funded-prelaunch-${digest}`,
    launchRecordId: `gpu-funded-launch-${digest}`,
    launchBindingId: `gpu-funded-launch-binding-${digest}`,
  })
}

function ref(id: string, hash: string, version = 1) {
  return refSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
