import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
  isCanonicalVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationTerminal,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner'
import {
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  assertCanonicalSam31VertexServingRuntimeComponentEvidence,
  canonicalSam31VertexServingRuntimeComponentRef,
  type CanonicalSam31VertexServingRuntimeComponentEvidence,
} from './canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
} from './canonical-sam3_1-private-qualification-capacity-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_VERSION =
  'canonical-sam3_1-private-complete-source-qualification-admission-v1' as const
export const
CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_OWNER_VERSION =
  'canonical-sam3_1-private-complete-source-qualification-admission-owner-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-complete-source-qualification-admissions'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const MAXIMUM_ADMISSION_LIFETIME_MILLISECONDS = 15 * 60_000

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
type QualificationComponent =
  | CanonicalSam31GpuRuntimeQualificationComponentEvidence
  | CanonicalSam31VertexServingRuntimeComponentEvidence

const requestSchema = z.object({
  admissionId: safeId,
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  routeId: routeIdSchema,
  qualificationSourcePlan: z.unknown(),
  sourcePreparation: z.unknown(),
  sourcePreparationTerminal: z.unknown(),
  privateQualificationCapacity: z.unknown(),
  driverAndCudaComponent: z.unknown(),
  deterministicRunSetComponent: z.unknown(),
  imageSupplyChainRelease: z.unknown(),
  accountEffectiveRateAuthority: z.unknown(),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict()

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_qualification_admission_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_source_capacity_image_component_and_rate_reread',
  ),
  status: z.literal('ready_for_private_qualification_execution_only'),
  admissionId: safeId,
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  routeId: routeIdSchema,
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  qualificationSourcePlanRef: refSchema,
  sourcePreparationRef: refSchema,
  sourcePreparationTerminalRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  privateQualificationCapacityRef: refSchema,
  driverAndCudaComponentRef: refSchema,
  deterministicRunSetComponentRef: refSchema,
  imageSupplyChainReleaseRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageDigest: prefixedSha256,
  accountEffectiveRateAuthorityRef: refSchema,
  executionTarget: z.enum([
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  sourceDurationMilliseconds: z.literal(480_000),
  sourceFrameCount: z.literal(11_520),
  sourceWidth: z.literal(3_840),
  sourceHeight: z.literal(2_160),
  fpsNumerator: z.literal(24),
  fpsDenominator: z.literal(1),
  exactChunkCount: z.literal(49),
  exactCrossChunkBoundaryCount: z.literal(48),
  exactSourcePreparationAndTerminalReread: z.literal(true),
  exactPrivateSequentialCapacityReread: z.literal(true),
  exactRouteDriverDeterministicImageAndRateReread: z.literal(true),
  qualificationExecutionOnly: z.literal(true),
  qualificationExecutionAuthorized: z.literal(true),
  finalRuntimeReleaseRequiredBeforeQualificationExecution:
    z.literal(false),
  finalRuntimeReleaseMayConsumeThisAdmission: z.literal(false),
  completeSourcePerformanceEvidencePending: z.literal(true),
  independentTemporalQualityEvidencePending: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  trackAllAdmissionGranted: z.literal(false),
  platformFundedPrivateQualification: z.literal(true),
  maximumCustomerToolCostCredits: z.literal(0),
  customerEligibleInfrastructureCostUsdNanos: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  accountEffectiveRateBoundBeforeDispatch: z.literal(true),
  oneRouteAndOneChunkMayExecuteAtATime: z.literal(true),
  otherGpuRouteMayStartBeforeThisRunTerminates: z.literal(false),
  capacityMustReturnToZeroBeforeOtherRoute: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  substantiveCpuExecutionAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  automaticRetryOrFallbackAllowed: z.literal(false),
  publicConcurrencyCapacityRequiredForThisPrivateRun: z.literal(false),
  futurePublicA100ConcurrencyTarget: z.literal(16),
  futurePublicL4ConcurrencyTarget: z.literal(16),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerOrPublicDispatchAuthorized: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  const life = Date.parse(value.expiresAt) - Date.parse(value.admittedAt)
  const routeMatches = value.routeId === 'a100_80gb_heavy_primary'
    ? value.executionTarget ===
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
    : value.executionTarget === 'google_cloud_run_l4_job'
  if (life <= 0 || life > MAXIMUM_ADMISSION_LIFETIME_MILLISECONDS
    || !routeMatches
    || value.immutableImageRef.contentHash !== value.immutableImageDigest) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 qualification-only admission is inconsistent.',
    })
  }
})

export const canonicalSam31PrivateCompleteSourceQualificationAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalSam31PrivateCompleteSourceQualificationAdmission = z.infer<
  typeof canonicalSam31PrivateCompleteSourceQualificationAdmissionSchema
>

export interface CanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-qualification-admission-repository-v1'
  readonly qualificationExecutionOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  persistCreateOnly(input: {
    readonly admission:
      CanonicalSam31PrivateCompleteSourceQualificationAdmission
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly admissionRef: EvidenceRef
    readonly at?: string
  }): Promise<CanonicalSam31PrivateCompleteSourceQualificationAdmission | null>
}

export function createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner() {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_OWNER_VERSION,
    qualificationExecutionOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    admit(untrusted: unknown):
    CanonicalSam31PrivateCompleteSourceQualificationAdmission {
      assertQualificationAdmissionRequestPlainData(untrusted)
      const request = requestSchema.parse(untrusted)
      const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
        request.qualificationSourcePlan,
      )
      const preparation =
        parseCanonicalSam31EightMinuteQualificationSourcePreparation(
          request.sourcePreparation,
        )
      const terminal =
        assertCanonicalSam31EightMinuteSourcePreparationTerminal(
          request.sourcePreparationTerminal,
        )
      const capacity =
        assertCanonicalSam31PrivateQualificationCapacityObservation(
          request.privateQualificationCapacity,
          request.admittedAt,
        )
      const driver = parseQualificationComponent(
        request.routeId,
        request.driverAndCudaComponent,
      )
      const deterministic = parseQualificationComponent(
        request.routeId,
        request.deterministicRunSetComponent,
      )
      const image = assertCanonicalSam31CloudImageSupplyChainRelease(
        request.imageSupplyChainRelease,
      )
      const rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
        request.accountEffectiveRateAuthority,
        request.admittedAt,
      )

      assertQualificationPrerequisites({
        request,
        plan,
        preparation,
        terminal,
        capacity,
        driver,
        deterministic,
        image,
        rate,
      })

      const payload = admissionWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_QUALIFICATION_ADMISSION_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_private_complete_source_qualification_admission_owner',
        evidenceClass:
          'canonical_private_exact_source_capacity_image_component_and_rate_reread',
        status: 'ready_for_private_qualification_execution_only',
        admissionId: request.admissionId,
        qualificationId: request.qualificationId,
        runOrdinal: request.runOrdinal,
        routeId: request.routeId,
        operationId: 'tool.sam3_1.segment_and_track_subject.v1',
        qualificationSourcePlanRef: ref(
          plan.qualificationSourceId,
          plan.planHash,
        ),
        sourcePreparationRef: ref(
          preparation.preparationId,
          preparation.preparationHash,
        ),
        sourcePreparationTerminalRef: ref(
          terminal.invocationId,
          terminal.terminalHash,
        ),
        exactEightMinuteSourceRef: plan.exactEightMinuteSourceRef,
        privateQualificationCapacityRef: ref(
          capacity.observationId,
          capacity.observationHash,
        ),
        driverAndCudaComponentRef:
          qualificationComponentRef(driver),
        deterministicRunSetComponentRef:
          qualificationComponentRef(deterministic),
        imageSupplyChainReleaseRef: ref(
          image.releaseId,
          image.releaseHash,
          image.releaseVersion,
        ),
        immutableImageRef: image.immutableImageRef,
        immutableImageDigest: image.immutableImageDigest,
        accountEffectiveRateAuthorityRef: rateRef(rate),
        executionTarget: rate.executionTarget,
        sourceDurationMilliseconds: 480_000,
        sourceFrameCount: 11_520,
        sourceWidth: 3_840,
        sourceHeight: 2_160,
        fpsNumerator: 24,
        fpsDenominator: 1,
        exactChunkCount: 49,
        exactCrossChunkBoundaryCount: 48,
        exactSourcePreparationAndTerminalReread: true,
        exactPrivateSequentialCapacityReread: true,
        exactRouteDriverDeterministicImageAndRateReread: true,
        qualificationExecutionOnly: true,
        qualificationExecutionAuthorized: true,
        finalRuntimeReleaseRequiredBeforeQualificationExecution: false,
        finalRuntimeReleaseMayConsumeThisAdmission: false,
        completeSourcePerformanceEvidencePending: true,
        independentTemporalQualityEvidencePending: true,
        runtimeReleaseGranted: false,
        trackAllAdmissionGranted: false,
        platformFundedPrivateQualification: true,
        maximumCustomerToolCostCredits: 0,
        customerEligibleInfrastructureCostUsdNanos: 0,
        serviceFeeIncluded: false,
        accountEffectiveRateBoundBeforeDispatch: true,
        oneRouteAndOneChunkMayExecuteAtATime: true,
        otherGpuRouteMayStartBeforeThisRunTerminates: false,
        capacityMustReturnToZeroBeforeOtherRoute: true,
        userTriggeredScaleFromZeroRequired: true,
        minimumIdleGpuInstances: 0,
        substantiveCpuExecutionAllowed: false,
        sourceResolutionReductionAllowed: false,
        automaticRetryOrFallbackAllowed: false,
        publicConcurrencyCapacityRequiredForThisPrivateRun: false,
        futurePublicA100ConcurrencyTarget: 16,
        futurePublicL4ConcurrencyTarget: 16,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        customerOrPublicDispatchAuthorized: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        admittedAt: request.admittedAt,
        expiresAt: request.expiresAt,
      })
      return assertCanonicalSam31PrivateCompleteSourceQualificationAdmission({
        ...payload,
        admissionHash: sha256AuthorityValue(payload),
      }, request.admittedAt)
    },
  })
}

export function assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
  value: unknown,
  at?: string,
): CanonicalSam31PrivateCompleteSourceQualificationAdmission {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_qualification_admission')
  const parsed =
    canonicalSam31PrivateCompleteSourceQualificationAdmissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 qualification-only admission changed.')
  }
  if (at && (Date.parse(timestamp.parse(at)) < Date.parse(parsed.admittedAt)
    || Date.parse(at) >= Date.parse(parsed.expiresAt))) {
    throw new TypeError('SAM 3.1 qualification-only admission is stale.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(
  value: unknown,
): EvidenceRef {
  const admission =
    assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(value)
  return ref(admission.admissionId, admission.admissionHash)
}

export function createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 qualification admission store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (admissionRef: EvidenceRef, at?: string) => {
    const exactRef = refSchema.parse(admissionRef)
    const body = await input.objectPort.readExact(
      `${prefix}/${exactRef.id}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 qualification admission bytes changed.')
    }
    const admission =
      assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
        JSON.parse(body.toString('utf8')) as unknown,
        at,
      )
    if (!sameRef(
      canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(admission),
      exactRef,
    ) || stableAuthorityStringify(admission) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 qualification admission reread changed.')
    }
    return admission
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-complete-source-qualification-admission-repository-v1' as const,
    qualificationExecutionOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async persistCreateOnly({ admission: untrusted }: {
      readonly admission:
        CanonicalSam31PrivateCompleteSourceQualificationAdmission
    }) {
      const admission =
        assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
          untrusted,
        )
      const body = Buffer.from(stableAuthorityStringify(admission), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${admission.admissionId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(
        canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(admission),
      )
      if (!exact || exact.admissionHash !== admission.admissionHash) {
        throw new TypeError('SAM 3.1 qualification admission reread changed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread({ admissionRef, at }: {
      readonly admissionRef: EvidenceRef
      readonly at?: string
    }) {
      return reread(admissionRef, at)
    },
  })
}

function assertQualificationAdmissionRequestPlainData(value: unknown): void {
  const label = 'sam31_private_complete_source_qualification_admission_request'
  try {
    if (value === null || typeof value !== 'object'
      || Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(`${label} is not a plain object.`)
    }
    const keys = Reflect.ownKeys(value)
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError(`${label} has a symbol key.`)
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new TypeError(`${label} has an accessor.`)
      }
      assertPlainSerializedData(
        descriptor.value,
        `${label}.${String(key)}`,
      )
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new TypeError(`${label} could not be inspected.`, { cause: error })
  }
}

function assertQualificationPrerequisites(input: {
  request: z.infer<typeof requestSchema>
  plan: ReturnType<
    typeof parseCanonicalSam31EightMinuteQualificationSourcePlan
  >
  preparation: ReturnType<
    typeof parseCanonicalSam31EightMinuteQualificationSourcePreparation
  >
  terminal: ReturnType<
    typeof assertCanonicalSam31EightMinuteSourcePreparationTerminal
  >
  capacity: ReturnType<
    typeof assertCanonicalSam31PrivateQualificationCapacityObservation
  >
  driver: QualificationComponent
  deterministic: QualificationComponent
  image: ReturnType<typeof assertCanonicalSam31CloudImageSupplyChainRelease>
  rate: ReturnType<
    typeof assertCanonicalProfessionalGoogleCloudGpuRateAuthority
  >
}): void {
  const { request, plan, preparation, terminal, capacity, driver,
    deterministic, image, rate } = input
  const planRef = ref(plan.qualificationSourceId, plan.planHash)
  const preparationRef = ref(
    preparation.preparationId,
    preparation.preparationHash,
  )
  const routeMatches = driver.route.routeId === request.routeId
    && deterministic.route.routeId === request.routeId
    && rate.routeId === request.routeId
    && driver.route.executionTarget === rate.executionTarget
    && deterministic.route.executionTarget === rate.executionTarget
  const currentExecutionTarget = request.routeId ===
    'a100_80gb_heavy_primary'
    ? isCanonicalVertexA100ServingRateAuthority(rate)
    : rate.executionTarget === 'google_cloud_run_l4_job'
  const admittedAt = Date.parse(request.admittedAt)
  const expiresAt = Date.parse(request.expiresAt)
  const blockers = [
    preparation.disposition !== 'ready' ? 'source_preparation_not_ready' : null,
    preparation.preparedChunkCount !== 49
      || preparation.preparedChunks.length !== 49
      ? 'exact_49_chunk_preparation_missing' : null,
    !sameRef(preparation.qualificationSourcePlanRef, planRef)
      ? 'source_plan_preparation_lineage_changed' : null,
    !sameRef(preparation.exactEightMinuteSourceRef,
      plan.exactEightMinuteSourceRef)
      ? 'exact_eight_minute_source_changed' : null,
    !sameRef(terminal.qualificationSourcePlanRef, planRef)
      || !sameRef(terminal.preparationRef, preparationRef)
      ? 'source_terminal_lineage_changed' : null,
    !terminal.sourcePreparationReadyForA100QualificationInput
      || !terminal.terminalWorkerStopped
      || terminal.activeGpuExecutionsAfterObservation !== 0
      || !terminal.scaleBackToZeroVerified
      ? 'source_preparation_not_terminal_at_zero' : null,
    capacity.status !== 'private_sequential_capacity_ready'
      || !capacity.privateSequentialCapacityReady
      ? 'private_sequential_capacity_not_ready' : null,
    driver.componentKind !== 'driver_and_cuda'
      ? 'driver_and_cuda_component_missing' : null,
    deterministic.componentKind !== 'deterministic_run_set'
      ? 'deterministic_run_set_component_missing' : null,
    driver.qualificationId !== request.qualificationId
      || driver.qualificationId !== deterministic.qualificationId
      ? 'qualification_component_lineage_changed' : null,
    !routeMatches ? 'route_component_or_rate_changed' : null,
    !currentExecutionTarget ? 'execution_target_changed' : null,
    driver.immutableImageDigest !== image.immutableImageDigest
      || deterministic.immutableImageDigest !== image.immutableImageDigest
      ? 'component_image_digest_changed' : null,
    image.status !== 'image_supply_chain_qualified'
      || !image.authority.imageSupplyChainQualified
      ? 'image_supply_chain_not_qualified' : null,
    admittedAt < Date.parse(plan.plannedAt)
      || admittedAt < Date.parse(preparation.preparedAt)
      || admittedAt < Date.parse(terminal.observedAt)
      ? 'source_evidence_observed_after_admission' : null,
    admittedAt < Date.parse(capacity.observedAt)
      ? 'capacity_observed_after_admission' : null,
    admittedAt < Date.parse(rate.observedAt)
      ? 'rate_observed_after_admission' : null,
    expiresAt > Date.parse(capacity.expiresAt)
      ? 'capacity_expires_before_admission' : null,
    expiresAt > Date.parse(rate.expiresAt)
      ? 'rate_expires_before_admission' : null,
  ].filter((value): value is string => value !== null)
  if (blockers.length > 0) throw new TypeError(
    `SAM 3.1 qualification admission lost exact authority: ${blockers.join(', ')}.`,
  )
}

function parseQualificationComponent(
  routeId: z.infer<typeof routeIdSchema>,
  value: unknown,
): QualificationComponent {
  return routeId === 'a100_80gb_heavy_primary'
    ? tryVertexServingComponent(value)
    : assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(value)
}

function tryVertexServingComponent(value: unknown): QualificationComponent {
  try {
    return assertCanonicalSam31VertexServingRuntimeComponentEvidence(value)
  } catch (vertexError) {
    try {
      return assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(
        value,
      )
    } catch {
      throw vertexError
    }
  }
}

function qualificationComponentRef(
  component: QualificationComponent,
): EvidenceRef {
  return component.schemaVersion ===
    'canonical-sam3_1-vertex-serving-runtime-component-evidence-v1'
    || component.schemaVersion ===
      'canonical-sam3_1-vertex-serving-runtime-component-continuity-evidence-v1'
    ? canonicalSam31VertexServingRuntimeComponentRef(component)
    : canonicalSam31GpuRuntimeQualificationComponentRef(component)
}

function rateRef(value: ReturnType<
  typeof assertCanonicalProfessionalGoogleCloudGpuRateAuthority
>): EvidenceRef {
  return ref(
    value.rateAuthorityId,
    value.rateAuthorityHash,
    value.rateAuthorityVersion,
  )
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({ id, version, contentHash: `sha256:${hash}` })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
