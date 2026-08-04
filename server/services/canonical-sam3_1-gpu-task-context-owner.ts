import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuRuntimeLaunchTarget,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  type CanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from './canonical-sam3_1-gpu-runtime-release-registry'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuTaskContext,
  buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt,
  buildCanonicalSam31GpuTaskContext,
  canonicalSam31GpuFixedTaskContractRef,
  type CanonicalSam31GpuApprovedTaskMaterialPreparationPort,
  type CanonicalSam31GpuTaskContext,
  type CanonicalSam31GpuTaskContextReadPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalSam31GpuApprovedPromptSchema,
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalTrackAllSam31OrchestraBinding,
  canonicalTrackAllSam31OrchestraBindingSchema,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'

export const CANONICAL_SAM3_1_GPU_TASK_CONTEXT_OWNER_VERSION =
  'canonical-sam3_1-gpu-task-context-owner-v1' as const
export const CANONICAL_SAM3_1_GPU_APPROVED_TASK_MATERIAL_VERSION =
  'canonical-sam3_1-gpu-approved-task-material-v1' as const
export const CANONICAL_SAM3_1_GPU_TASK_CONTEXT_REPOSITORY_VERSION =
  'canonical-sam3_1-gpu-task-context-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/sam3_1/gpu-task-context/v1'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])

const approvedMaterialWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_APPROVED_TASK_MATERIAL_VERSION,
  ),
  source: z.literal('canonical_server_track_all_approved_task_material'),
  evidenceClass: z.literal('canonical_private_reread'),
  dispatchAdmissionRef: refSchema,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
  runtimeReleaseRef: refSchema,
  trackAllOrchestraBinding: canonicalTrackAllSam31OrchestraBindingSchema,
  editPlanVersionId: safeId,
  editPlanVersionRef: refSchema,
  outputId: safeId,
  confirmedOutputFrameRef: refSchema,
  sceneId: safeId,
  sourceBindingRef: refSchema,
  sourceMedia: canonicalSam31GpuSourceMediaSchema,
  approvedPrompt: canonicalSam31GpuApprovedPromptSchema,
  primaryRateAuthorityRef: refSchema,
  fallbackRateAuthorityRef: refSchema,
  privateTaskInputTransportRef: refSchema,
  privateTaskOutputTransportRef: refSchema,
  exactApprovedSnapshotWorkLeaseFrameTimingSourceAndPromptBound:
    z.literal(true),
  exactPrimaryAndFallbackAccountEffectiveRateRefsBound: z.literal(true),
  browserOrCallerMaterialAccepted: z.literal(false),
  runtimeReleaseOrRateSelectedByCaller: z.literal(false),
  workDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()

export const canonicalSam31GpuApprovedTaskMaterialSchema =
  approvedMaterialWithoutHashSchema.extend({
    materialRef: refSchema.extend({ version: z.literal(1) }).strict(),
    materialHash: sha256,
  }).strict()
export type CanonicalSam31GpuApprovedTaskMaterial = z.infer<
  typeof canonicalSam31GpuApprovedTaskMaterialSchema
>

export interface CanonicalSam31GpuTaskContextRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_TASK_CONTEXT_REPOSITORY_VERSION
  readonly evidenceClass:
    'gcs_create_only_exact_reread_sam3_1_task_context'
  persistApprovedMaterialCreateOnly(input: {
    readonly material: CanonicalSam31GpuApprovedTaskMaterial
  }): Promise<z.infer<typeof refSchema>>
  rereadApprovedMaterial(input: MaterialLookup): Promise<
    CanonicalSam31GpuApprovedTaskMaterial | null
  >
  persistTaskContextCreateOnly(input: {
    readonly context: CanonicalSam31GpuTaskContext
  }): Promise<z.infer<typeof refSchema>>
  rereadTaskContext(input: {
    readonly taskContextRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31GpuTaskContext | null>
}

type MaterialLookup = {
  readonly dispatchAdmissionRef: z.infer<typeof refSchema>
  readonly runtimeReleaseRef: z.infer<typeof refSchema>
  readonly admissionConsumptionRef: z.infer<typeof refSchema>
  readonly executionEnvelopeRef: z.infer<typeof refSchema>
}

export interface CanonicalSam31GpuReleasePairReadPort {
  rereadReleasePair(input: {
    readonly runtimeReleaseRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31GpuRuntimeReleaseRegistryRecord | null>
}

export interface CanonicalSam31GpuTaskRateAuthorityReadPort {
  rereadApprovedCurrentRate(input: {
    readonly rateAuthorityRef: z.infer<typeof refSchema>
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly at: string
  }): Promise<unknown>
}

const approvedTaskMaterialSourceSchema = z.object({
  trackAllOrchestraBinding: canonicalTrackAllSam31OrchestraBindingSchema,
  editPlanVersionId: safeId,
  editPlanVersionRef: refSchema,
  outputId: safeId,
  confirmedOutputFrameRef: refSchema,
  sceneId: safeId,
  sourceBindingRef: refSchema,
  sourceMedia: canonicalSam31GpuSourceMediaSchema,
  approvedPrompt: canonicalSam31GpuApprovedPromptSchema,
  primaryRateAuthorityRef: refSchema,
  fallbackRateAuthorityRef: refSchema,
  privateTaskInputTransportRef: refSchema,
  privateTaskOutputTransportRef: refSchema,
}).strict()

export interface CanonicalSam31GpuApprovedTaskMaterialSourceReadPort {
  rereadApprovedTaskMaterialSource(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
    readonly admissionConsumptionRef: z.infer<typeof refSchema>
    readonly executionEnvelopeRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<unknown>
}

export function createCanonicalSam31GpuApprovedTaskMaterialPreparationOwner(
  input: {
    readonly repository: CanonicalSam31GpuTaskContextRepository
    readonly sourceReadPort:
      CanonicalSam31GpuApprovedTaskMaterialSourceReadPort
    readonly now?: () => string
  },
): CanonicalSam31GpuApprovedTaskMaterialPreparationPort {
  if (typeof input.repository?.persistApprovedMaterialCreateOnly !== 'function'
    || typeof input.repository?.rereadApprovedMaterial !== 'function'
    || typeof input.sourceReadPort?.rereadApprovedTaskMaterialSource !==
      'function') {
    throw new Error('SAM 3.1 approved-task material owner is unavailable.')
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async preparePersistAndRereadApprovedTaskMaterial(untrusted: {
      readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
      readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
      readonly admissionConsumptionRef: z.infer<typeof refSchema>
      readonly executionEnvelopeRef: z.infer<typeof refSchema>
    }) {
      assertPlainSerializedData(untrusted,
        'sam31_gpu_task_material_preparation_input')
      const request = z.object({
        admission: z.unknown(),
        target: z.unknown(),
        admissionConsumptionRef: refSchema,
        executionEnvelopeRef: refSchema,
      }).strict().parse(untrusted)
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        request.admission,
      )
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        request.target,
      )
      const preparedAt = timestamp.parse(now())
      if (Date.parse(preparedAt) < Date.parse(admission.admittedAt)
        || Date.parse(preparedAt) >= Date.parse(admission.expiresAt)) {
        throw conflict('approved_task_material_outside_admission_window')
      }
      const untrustedSource =
        await input.sourceReadPort.rereadApprovedTaskMaterialSource({
          admission,
          target,
          admissionConsumptionRef: request.admissionConsumptionRef,
          executionEnvelopeRef: request.executionEnvelopeRef,
          at: preparedAt,
        })
      assertPlainSerializedData(untrustedSource,
        'sam31_gpu_approved_task_material_source')
      const source = approvedTaskMaterialSourceSchema.parse(untrustedSource)
      const material = buildCanonicalSam31GpuApprovedTaskMaterial({
        admission,
        target,
        admissionConsumptionRef: request.admissionConsumptionRef,
        executionEnvelopeRef: request.executionEnvelopeRef,
        ...source,
        publishedAt: preparedAt,
      })
      const persistedRef = await input.repository
        .persistApprovedMaterialCreateOnly({ material })
      if (!sameRef(persistedRef, material.materialRef)) {
        throw conflict('approved_task_material_persistence_ref_mismatch')
      }
      const reread = await input.repository.rereadApprovedMaterial(
        materialLookup(material),
      )
      if (!reread || reread.materialHash !== material.materialHash
        || !sameRef(reread.materialRef, material.materialRef)) {
        throw conflict('approved_task_material_exact_reread_failed')
      }
      return buildCanonicalSam31GpuApprovedTaskMaterialPreparationReceipt({
        admission,
        target,
        admissionConsumptionRef: request.admissionConsumptionRef,
        executionEnvelopeRef: request.executionEnvelopeRef,
        approvedTaskMaterialRef: material.materialRef,
        preparedAt,
      })
    },
  })
}

export function buildCanonicalSam31GpuApprovedTaskMaterial(input: {
  readonly admission: unknown
  readonly target: unknown
  readonly admissionConsumptionRef: z.input<typeof refSchema>
  readonly executionEnvelopeRef: z.input<typeof refSchema>
  readonly trackAllOrchestraBinding: unknown
  readonly editPlanVersionId: string
  readonly editPlanVersionRef: z.input<typeof refSchema>
  readonly outputId: string
  readonly confirmedOutputFrameRef: z.input<typeof refSchema>
  readonly sceneId: string
  readonly sourceBindingRef: z.input<typeof refSchema>
  readonly sourceMedia: unknown
  readonly approvedPrompt: unknown
  readonly primaryRateAuthorityRef: z.input<typeof refSchema>
  readonly fallbackRateAuthorityRef: z.input<typeof refSchema>
  readonly privateTaskInputTransportRef: z.input<typeof refSchema>
  readonly privateTaskOutputTransportRef: z.input<typeof refSchema>
  readonly publishedAt: string
}): CanonicalSam31GpuApprovedTaskMaterial {
  assertPlainSerializedData(input, 'sam31_gpu_approved_task_material_input')
  const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    input.admission,
  )
  const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
    input.target,
  )
  const payload = approvedMaterialWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_GPU_APPROVED_TASK_MATERIAL_VERSION,
    source: 'canonical_server_track_all_approved_task_material',
    evidenceClass: 'canonical_private_reread',
    dispatchAdmissionRef: admissionRef(admission),
    admissionConsumptionRef: input.admissionConsumptionRef,
    executionEnvelopeRef: input.executionEnvelopeRef,
    runtimeReleaseRef: target.releaseRef,
    trackAllOrchestraBinding:
      assertCanonicalTrackAllSam31OrchestraBinding({
        value: input.trackAllOrchestraBinding,
        admission,
      }),
    editPlanVersionId: input.editPlanVersionId,
    editPlanVersionRef: input.editPlanVersionRef,
    outputId: input.outputId,
    confirmedOutputFrameRef: input.confirmedOutputFrameRef,
    sceneId: input.sceneId,
    sourceBindingRef: input.sourceBindingRef,
    sourceMedia: input.sourceMedia,
    approvedPrompt: input.approvedPrompt,
    primaryRateAuthorityRef: input.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: input.fallbackRateAuthorityRef,
    privateTaskInputTransportRef: input.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: input.privateTaskOutputTransportRef,
    exactApprovedSnapshotWorkLeaseFrameTimingSourceAndPromptBound: true,
    exactPrimaryAndFallbackAccountEffectiveRateRefsBound: true,
    browserOrCallerMaterialAccepted: false,
    runtimeReleaseOrRateSelectedByCaller: false,
    workDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    publishedAt: input.publishedAt,
  })
  assertMaterialMatches({ material: payload, admission, target })
  const materialHash = sha256AuthorityValue(payload)
  return Object.freeze(canonicalSam31GpuApprovedTaskMaterialSchema.parse({
    ...payload,
    materialRef: {
      id: `sam31-approved-task-material:${payload.executionEnvelopeRef.id}`,
      version: 1,
      contentHash: `sha256:${materialHash}`,
    },
    materialHash,
  }))
}

export function assertCanonicalSam31GpuApprovedTaskMaterial(
  value: unknown,
): CanonicalSam31GpuApprovedTaskMaterial {
  assertPlainSerializedData(value, 'sam31_gpu_approved_task_material')
  const material = canonicalSam31GpuApprovedTaskMaterialSchema.parse(value)
  const { materialRef, materialHash, ...payload } = material
  if (materialHash !== sha256AuthorityValue(payload)
    || materialRef.contentHash !== `sha256:${materialHash}`
    || materialRef.id !==
      `sam31-approved-task-material:${material.executionEnvelopeRef.id}`) {
    throw conflict('approved_task_material_hash_invalid')
  }
  return structuredClone(material)
}

export function createCanonicalSam31GpuTaskContextRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31GpuTaskContextRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31GpuTaskContextRepository = {
    schemaVersion: CANONICAL_SAM3_1_GPU_TASK_CONTEXT_REPOSITORY_VERSION,
    evidenceClass:
      'gcs_create_only_exact_reread_sam3_1_task_context' as const,

    async persistApprovedMaterialCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_task_material_persist')
      const request = z.object({ material: z.unknown() }).strict()
        .parse(untrusted)
      const material = assertCanonicalSam31GpuApprovedTaskMaterial(
        request.material,
      )
      const lookup = materialLookup(material)
      await persistExact(input.objectPort, materialPath(prefix, lookup),
        bodyFor(material))
      return material.materialRef
    },

    async rereadApprovedMaterial(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_task_material_read')
      const lookup = materialLookupSchema.parse(untrusted)
      const value = await readExact(input.objectPort,
        materialPath(prefix, lookup),
        assertCanonicalSam31GpuApprovedTaskMaterial)
      if (!value) return null
      if (stableAuthorityStringify(materialLookup(value)) !==
        stableAuthorityStringify(lookup)) {
        throw conflict('approved_task_material_lookup_mismatch')
      }
      return value
    },

    async persistTaskContextCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_task_context_persist')
      const request = z.object({ context: z.unknown() }).strict()
        .parse(untrusted)
      const context = assertCanonicalSam31GpuTaskContext(request.context)
      await persistExact(input.objectPort,
        contextPath(prefix, context.taskContextRef), bodyFor(context))
      return context.taskContextRef
    },

    rereadTaskContext(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_task_context_read')
      const request = z.object({ taskContextRef: refSchema }).strict()
        .parse(untrusted)
      return readExact(input.objectPort,
        contextPath(prefix, request.taskContextRef),
        (value) => {
          const context = assertCanonicalSam31GpuTaskContext(value)
          if (!sameRef(context.taskContextRef, request.taskContextRef)) {
            throw conflict('task_context_lookup_mismatch')
          }
          return context
        })
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpGpuTaskContextRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuTaskContextRepository {
  return createCanonicalSam31GpuTaskContextRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_STATE_BUCKET,
    }),
  })
}

export function createCanonicalSam31GpuTaskContextOwner(input: {
  readonly repository: CanonicalSam31GpuTaskContextRepository
  readonly releasePairReadPort: CanonicalSam31GpuReleasePairReadPort
  readonly rateAuthorityReadPort:
    CanonicalSam31GpuTaskRateAuthorityReadPort
  readonly now?: () => string
}): CanonicalSam31GpuTaskContextReadPort {
  assertOwnerDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  const owner: CanonicalSam31GpuTaskContextReadPort = {
    async rereadCanonicalTaskContext(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_task_context_owner_input')
      const request = z.object({
        admission: z.unknown(),
        target: z.unknown(),
        admissionConsumptionRef: refSchema,
        executionEnvelopeRef: refSchema,
      }).strict().parse(untrusted)
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        request.admission,
      )
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        request.target,
      )
      const observedAt = timestamp.parse(now())
      if (Date.parse(observedAt) < Date.parse(admission.admittedAt)
        || Date.parse(observedAt) >= Date.parse(admission.expiresAt)) {
        throw conflict('task_context_owner_outside_admission_window')
      }
      const lookup = {
        dispatchAdmissionRef: admissionRef(admission),
        runtimeReleaseRef: target.releaseRef,
        admissionConsumptionRef: request.admissionConsumptionRef,
        executionEnvelopeRef: request.executionEnvelopeRef,
      }
      const material = await input.repository.rereadApprovedMaterial(lookup)
      if (!material) throw conflict('approved_task_material_missing')
      assertMaterialMatches({ material, admission, target })
      if (Date.parse(material.publishedAt) > Date.parse(observedAt)) {
        throw conflict('approved_task_material_from_future')
      }
      const untrustedPair = await input.releasePairReadPort.rereadReleasePair({
        runtimeReleaseRef: target.releaseRef,
      })
      if (!untrustedPair) {
        throw conflict('qualified_runtime_release_pair_missing')
      }
      const pair = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
        untrustedPair,
      )
      const runtimeRelease = assertCanonicalProfessionalToolGpuRuntimeRelease(
        pair.runtimeRelease,
        observedAt,
      )
      if (!sameRef(target.releaseRef, runtimeReleaseRef(runtimeRelease))
        || runtimeRelease.toolId !== admission.toolId
        || runtimeRelease.operationId !== admission.operationId
        || runtimeRelease.routeId !== admission.routeId) {
        throw conflict('runtime_release_pair_target_mismatch')
      }
      const [primaryRate, fallbackRate] = await Promise.all([
        rereadRate({
          port: input.rateAuthorityReadPort,
          ref: material.primaryRateAuthorityRef,
          routeId: 'a100_80gb_heavy_primary',
          at: observedAt,
        }),
        rereadRate({
          port: input.rateAuthorityReadPort,
          ref: material.fallbackRateAuthorityRef,
          routeId: 'l4_heavy_fallback',
          at: observedAt,
        }),
      ])
      if (!sameRef(rateRef(primaryRate), material.primaryRateAuthorityRef)
        || !sameRef(rateRef(fallbackRate),
          material.fallbackRateAuthorityRef)
        || !sameRef(primaryRate.billingAccountPricingScopeRef,
          fallbackRate.billingAccountPricingScopeRef)
        || !sameRef(primaryRate.pricingReaderConfigurationRef,
          fallbackRate.pricingReaderConfigurationRef)) {
        throw conflict('account_effective_rate_pair_mismatch')
      }
      const context = buildCanonicalSam31GpuTaskContext({
        taskContextId:
          `sam31-task-context:${material.executionEnvelopeRef.id}`,
        trackAllOrchestraBinding: material.trackAllOrchestraBinding,
        editPlanVersionId: material.editPlanVersionId,
        editPlanVersionRef: material.editPlanVersionRef,
        outputId: material.outputId,
        confirmedOutputFrameRef: material.confirmedOutputFrameRef,
        sceneId: material.sceneId,
        sourceBindingRef: material.sourceBindingRef,
        sourceMedia: material.sourceMedia,
        approvedPrompt: material.approvedPrompt,
        specializedRuntimeRelease: pair.specializedRelease,
        primaryRateAuthorityRef: material.primaryRateAuthorityRef,
        fallbackRateAuthorityRef: material.fallbackRateAuthorityRef,
        privateTaskInputTransportRef:
          material.privateTaskInputTransportRef,
        privateTaskOutputTransportRef:
          material.privateTaskOutputTransportRef,
        preparedAt: material.publishedAt,
      })
      const persistedRef = await input.repository
        .persistTaskContextCreateOnly({ context })
      if (!sameRef(persistedRef, context.taskContextRef)) {
        throw conflict('task_context_persistence_reference_mismatch')
      }
      const reread = await input.repository.rereadTaskContext({
        taskContextRef: context.taskContextRef,
      })
      if (!reread || !sameRef(reread.taskContextRef,
        context.taskContextRef)) {
        throw conflict('task_context_exact_reread_failed')
      }
      return reread
    },
  }
  return Object.freeze(owner)
}

const materialLookupSchema = z.object({
  dispatchAdmissionRef: refSchema,
  runtimeReleaseRef: refSchema,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
}).strict()

function assertMaterialMatches(input: {
  material: z.infer<typeof approvedMaterialWithoutHashSchema>
    | CanonicalSam31GpuApprovedTaskMaterial
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
}): void {
  const { material, admission, target } = input
  const binding = assertCanonicalTrackAllSam31OrchestraBinding({
    value: material.trackAllOrchestraBinding,
    admission,
  })
  const call = parseOrchestraSkillCall(binding.orchestraCall)
  const source = canonicalSam31GpuSourceMediaSchema.parse(
    material.sourceMedia,
  )
  const prompt = canonicalSam31GpuApprovedPromptSchema.parse(
    material.approvedPrompt,
  )
  if (call.scope.scopeType !== 'scene') {
    throw conflict('track_all_scene_scope_required')
  }
  const requiredEvidence = [
    material.sourceBindingRef,
    material.confirmedOutputFrameRef,
    admission.scope.masterTimingRef,
    prompt.compiledIntentRef,
    prompt.promptApprovalRef,
    prompt.sourceFrameLineageRef,
  ]
  const selectedRateRef = admission.routeId ===
    'a100_80gb_heavy_primary'
    ? material.primaryRateAuthorityRef
    : material.fallbackRateAuthorityRef
  if (admission.toolId !== 'sam3_1'
    || admission.operationId !==
      'tool.sam3_1.segment_and_track_subject.v1'
    || target.toolId !== admission.toolId
    || target.operationId !== admission.operationId
    || target.routeId !== admission.routeId
    || !sameRef(target.releaseRef, admission.runtimeReleaseRef)
    || !sameRef(target.fixedServerTaskContractRef,
      canonicalSam31GpuFixedTaskContractRef())
    || !sameRef(material.dispatchAdmissionRef, admissionRef(admission))
    || !sameRef(material.runtimeReleaseRef, target.releaseRef)
    || material.editPlanVersionRef.id !== material.editPlanVersionId
    || material.editPlanVersionRef.version !==
      admission.scope.editPlanVersion
    || !sameRef(material.confirmedOutputFrameRef,
      admission.scope.confirmedOutputFrameRef)
    || call.scope.outputId !== material.outputId
    || call.scope.sceneId !== material.sceneId
    || !sameRef(call.scope.sourceArtifactRef,
      source.finalizedSourceArtifactRef)
    || !sameRef(call.scope.selectedSceneBindingRef,
      material.sourceBindingRef)
    || call.scope.authorizedRange.startFrame !==
      source.canonicalSourceStartFrameInclusive
    || call.scope.authorizedRange.endFrameExclusive !==
      source.canonicalSourceEndFrameInclusive + 1
    || call.scope.authorizedRange.frameRate.numerator !==
      source.fpsNumerator
    || call.scope.authorizedRange.frameRate.denominator !==
      source.fpsDenominator
    || requiredEvidence.some((required) =>
      !call.requiredEvidenceRefs.some((observed) =>
        sameRef(observed, required)))
    || sameRef(material.primaryRateAuthorityRef,
      material.fallbackRateAuthorityRef)
    || !sameRef(selectedRateRef, admission.currentRateAuthorityRef)
    || Date.parse(material.publishedAt) <
      Date.parse(admission.admittedAt)
    || Date.parse(material.publishedAt) >=
      Date.parse(admission.expiresAt)) {
    throw conflict('approved_task_material_scope_mismatch')
  }
}

async function rereadRate(input: {
  port: CanonicalSam31GpuTaskRateAuthorityReadPort
  ref: z.infer<typeof refSchema>
  routeId: z.infer<typeof routeIdSchema>
  at: string
}): Promise<CanonicalCurrentGoogleCloudGpuRateAuthority> {
  const value = await input.port.rereadApprovedCurrentRate({
    rateAuthorityRef: input.ref,
    routeId: input.routeId,
    at: input.at,
  })
  assertPlainSerializedData(value, 'sam31_task_current_rate')
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    value,
    input.at,
  )
  if (rate.routeId !== input.routeId
    || !sameRef(rateRef(rate), input.ref)) {
    throw conflict('current_rate_reference_mismatch')
  }
  return rate
}

function rateRef(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  })
}

function runtimeReleaseRef(
  release: ReturnType<
    typeof assertCanonicalProfessionalToolGpuRuntimeRelease
  >,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  })
}

function admissionRef(
  admission: CanonicalProfessionalToolGpuDispatchAdmission,
): z.infer<typeof refSchema> {
  return refSchema.parse({
    id: admission.admissionId,
    version: 1,
    contentHash: `sha256:${admission.admissionHash}`,
  })
}

function materialLookup(
  material: CanonicalSam31GpuApprovedTaskMaterial,
): MaterialLookup {
  return materialLookupSchema.parse({
    dispatchAdmissionRef: material.dispatchAdmissionRef,
    runtimeReleaseRef: material.runtimeReleaseRef,
    admissionConsumptionRef: material.admissionConsumptionRef,
    executionEnvelopeRef: material.executionEnvelopeRef,
  })
}

function materialPath(prefix: string, lookup: MaterialLookup): string {
  return `${prefix}/materials/${hashKey(lookup)}.json`
}

function contextPath(
  prefix: string,
  contextRef: z.infer<typeof refSchema>,
): string {
  return `${prefix}/contexts/${hashKey(refSchema.parse(contextRef))}.json`
}

function hashKey(value: unknown): string {
  return createHash('sha256')
    .update(stableAuthorityStringify(value), 'utf8')
    .digest('hex')
}

function bodyFor(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('task_context_record_size_invalid')
  }
  return body
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  body: Buffer,
): Promise<void> {
  const digest = createHash('sha256').update(body).digest('hex')
  const disposition = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: digest,
  })
  if (disposition === 'already_exists') {
    const prior = await port.readExact(path)
    if (!prior || !prior.equals(body)) {
      throw conflict('task_context_create_only_collision')
    }
  } else if (disposition !== 'created') {
    throw conflict('task_context_create_only_failed')
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('task_context_create_only_reread_failed')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('task_context_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('task_context_record_json_invalid')
  }
  const parsed = parse(value)
  if (!bodyFor(parsed).equals(body)) {
    throw conflict('task_context_record_not_canonical')
  }
  return parsed
}

function assertOwnerDependencies(input: {
  repository: CanonicalSam31GpuTaskContextRepository
  releasePairReadPort: CanonicalSam31GpuReleasePairReadPort
  rateAuthorityReadPort: CanonicalSam31GpuTaskRateAuthorityReadPort
}): void {
  if (typeof input.repository?.rereadApprovedMaterial !== 'function'
    || typeof input.repository?.persistTaskContextCreateOnly !== 'function'
    || typeof input.repository?.rereadTaskContext !== 'function'
    || typeof input.releasePairReadPort?.rereadReleasePair !== 'function'
    || typeof input.rateAuthorityReadPort
      ?.rereadApprovedCurrentRate !== 'function') {
    throw new Error('SAM 3.1 task-context owner dependencies are invalid.')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('SAM 3.1 task-context object port is invalid.')
  }
}

function sameRef(
  left: { id: string, version: number, contentHash: string },
  right: { id: string, version: number, contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(code: string): Error {
  return new Error(`SAM 3.1 task-context conflict: ${code}`)
}
