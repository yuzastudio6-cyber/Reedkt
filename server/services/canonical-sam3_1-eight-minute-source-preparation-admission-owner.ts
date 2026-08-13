import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import type {
  CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourceRepository,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_QUALIFICATION_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-qualification-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_RELEASE_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-release-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TRIGGER_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-trigger-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-admission-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CONSUMPTION_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-consumption-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_AUTHORITY_REPOSITORY_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-authority-repository-v1' as const
export const
CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_OWNER_VERSION =
  'canonical-sam3_1-eight-minute-source-preparation-admission-owner-v1' as const

const OPERATION_ID =
  'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1' as const
const ROUTE_ID = 'l4_standard_primary' as const
const ROUTE_PROFILE_ID =
  'quality_l4_user_triggered_standard_media_job_v1' as const
const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const CLOUD_RUN_JOB_NAME = 'weeditpro-sam31-source-prep-l4' as const
const CLOUD_RUN_JOB_RESOURCE =
  'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4' as const
const MAXIMUM_EXECUTION_MILLISECONDS = 7_200_000
const MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS = 20_000_000_000
const ADMISSION_TTL_MILLISECONDS = 10 * 60 * 1_000
const MAXIMUM_TRIGGER_AGE_MILLISECONDS = 24 * 60 * 60 * 1_000
const PRIVATE_ARTIFACT_BYTES = 100 * 1024 ** 3
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-eight-minute-source-preparation'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024

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
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof evidenceRefSchema>

const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_l4_image_qualification'),
  qualificationId: safeId,
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  routeId: z.literal(ROUTE_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  operationId: z.literal(OPERATION_ID),
  cloudRunJobName: z.literal(CLOUD_RUN_JOB_NAME),
  cloudRunJobResource: z.literal(CLOUD_RUN_JOB_RESOURCE),
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  sourceCommitSha: z.string().regex(/^[a-f0-9]{40}$/u),
  sourceTreeSha: z.string().regex(/^[a-f0-9]{40}$/u),
  dockerfileSha256: sha256,
  fixedRunnerSha256: sha256,
  fixedProcessPortSha256: sha256,
  fixedWorkerEntrypointSha256: sha256,
  imageBuildRef: evidenceRefSchema,
  spdx23SbomRef: evidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  signatureVerificationRef: evidenceRefSchema,
  slsaProvenanceRef: evidenceRefSchema,
  fourKPreparationQualificationRunRef: evidenceRefSchema,
  actualNvidiaL4Observed: z.literal(true),
  exactlyOneL4Allocated: z.literal(true),
  ffmpegCudaNvdecDecodeVerified: z.literal(true),
  ffmpegNvencH264EncodeVerified: z.literal(true),
  ffprobeMetadataOnlyVerified: z.literal(true),
  exact3840x2160At24FpsPreserved: z.literal(true),
  exact49ChunkFrameAccountingVerified: z.literal(true),
  exactOneFrameOverlapVerified: z.literal(true),
  sourceAudioRemovalVerified: z.literal(true),
  immutableImageDigestRereadVerified: z.literal(true),
  spdx23SbomRereadVerified: z.literal(true),
  criticalHighOrUnknownVulnerabilitiesAbsent: z.literal(true),
  kmsSignatureVerified: z.literal(true),
  slsaProvenanceVerified: z.literal(true),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  runtimeModelOrToolDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandModelOrEnvironmentAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.immutableImageRef.contentHash !== value.immutableImageDigest) {
    context.addIssue({
      code: 'custom',
      message: 'Source-preparation qualification image identity changed.',
    })
  }
})
const qualificationSchema = qualificationWithoutHashSchema.extend({
  qualificationHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationQualification = z.infer<
  typeof qualificationSchema
>

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_release_owner',
  ),
  evidenceClass: z.literal('canonical_private_qualified_l4_release'),
  releaseId: safeId,
  qualificationRef: evidenceRefSchema,
  operationId: z.literal(OPERATION_ID),
  routeId: z.literal(ROUTE_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  projectId: z.literal(PROJECT_ID),
  region: z.literal(REGION),
  cloudRunJobName: z.literal(CLOUD_RUN_JOB_NAME),
  cloudRunJobResource: z.literal(CLOUD_RUN_JOB_RESOURCE),
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  accelerator: z.literal('nvidia_l4'),
  configuredGpuType: z.literal('nvidia-l4'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(8),
  allocatedMemoryGiB: z.literal(32),
  maximumExecutionSeconds: z.literal(7_200),
  maximumAttempts: z.literal(1),
  minimumIdleInstances: z.literal(0),
  maximumConcurrentAttemptsPerInstance: z.literal(1),
  userTriggeredScaleFromZero: z.literal(true),
  stopsAtTerminalAttempt: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
  callerCommandImageModelPathUrlOrEnvironmentAccepted: z.literal(false),
  substantiveCpuMediaProcessingAllowed: z.literal(false),
  uncertainOutcomeRetryAllowed: z.literal(false),
  accountEffectivePricingRequired: z.literal(true),
  customerCreditMutationAllowed: z.literal(false),
  publicListPriceSettlementAllowed: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  maximumReleaseValiditySeconds: z.literal(2_592_000),
  releasedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.immutableImageRef.contentHash !== value.immutableImageDigest
    || Date.parse(value.expiresAt) <= Date.parse(value.releasedAt)
    || Date.parse(value.expiresAt) - Date.parse(value.releasedAt) >
      value.maximumReleaseValiditySeconds * 1_000) {
    context.addIssue({
      code: 'custom',
      message: 'Source-preparation release identity or expiry changed.',
    })
  }
})
const releaseSchema = releaseWithoutHashSchema.extend({
  releaseHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationRelease = z.infer<
  typeof releaseSchema
>

const triggerWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TRIGGER_VERSION,
  ),
  source: z.literal(
    'authenticated_server_sam3_1_eight_minute_source_preparation_trigger',
  ),
  invocationId: safeId,
  qualificationSourceId: safeId,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  triggeredAt: timestamp,
  serverOwnedExactSourcePlanRequired: z.literal(true),
  callerSourcePathUrlBytesCommandModelOrEnvironmentAccepted: z.literal(false),
  customerCreditMutationAuthorized: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const triggerSchema = triggerWithoutHashSchema.extend({
  triggerHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationTrigger = z.infer<
  typeof triggerSchema
>

const maximumUsageSchema = z.object({
  coldStartMilliseconds: z.literal(600_000),
  runtimeAndModelLoadMilliseconds: z.literal(60_000),
  activeGpuMilliseconds: z.literal(6_480_000),
  drainAndShutdownMilliseconds: z.literal(60_000),
  totalBillableMilliseconds: z.literal(MAXIMUM_EXECUTION_MILLISECONDS),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(8),
  allocatedMemoryGiB: z.literal(32),
  allocatedLocalScratchGiB: z.literal(0),
  privateArtifactBytes: z.literal(PRIVATE_ARTIFACT_BYTES),
  privateArtifactRetentionMilliseconds:
    z.literal(PRIVATE_ARTIFACT_RETENTION_MILLISECONDS),
  networkEgressBytes: z.literal(0),
  classAOperationCount: z.literal(2_000),
  classBOperationCount: z.literal(2_000),
}).strict()

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_admission_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_prerequisite_reread'),
  admissionId: safeId,
  invocationId: safeId,
  idempotencyKey: safeId,
  triggerRef: evidenceRefSchema,
  qualificationSourcePlanRef: evidenceRefSchema,
  exactEightMinuteSourceRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  qualificationRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  platformEstimateRef: evidenceRefSchema,
  maximumUsage: maximumUsageSchema,
  maximumPlatformInternalCostUsdNanos:
    z.number().int().positive().max(
      MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS,
    ).safe(),
  maximumApprovedInternalBudgetUsdNanos:
    z.literal(MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS),
  operationId: z.literal(OPERATION_ID),
  routeId: z.literal(ROUTE_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  maximumAttempts: z.literal(1),
  attemptOrdinal: z.literal(1),
  createOnlyConsumptionRequiredBeforeCloudRunCall: z.literal(true),
  uncertainOutcomeRetryAllowed: z.literal(false),
  exactPlanReleaseQualificationImageRateAndBudgetReread: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  platformFundedPrivateQualification: z.literal(true),
  customerCreditReservationRequired: z.literal(false),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.invocationId !== value.admissionId
    || Date.parse(value.expiresAt) - Date.parse(value.admittedAt) !==
      ADMISSION_TTL_MILLISECONDS) {
    context.addIssue({
      code: 'custom',
      message: 'Source-preparation admission identity or expiry changed.',
    })
  }
})
const admissionSchema = admissionWithoutHashSchema.extend({
  admissionHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationAdmission = z.infer<
  typeof admissionSchema
>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CONSUMPTION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_eight_minute_source_preparation_launch_owner',
  ),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  idempotencyKey: safeId,
  consumedBeforeCloudRunCall: z.literal(true),
  oneAdmissionMayCreateAtMostOneCloudJob: z.literal(true),
  uncertainOutcomeRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  consumedAt: timestamp,
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: sha256,
}).strict()
export type CanonicalSam31EightMinuteSourcePreparationConsumption = z.infer<
  typeof consumptionSchema
>

type RecordKind = 'qualification' | 'release' | 'admission' | 'consumption'
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_AUTHORITY_REPOSITORY_VERSION,
  ),
  recordKind: z.enum([
    'qualification', 'release', 'admission', 'consumption',
  ]),
  value: z.unknown(),
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()

export interface CanonicalSam31EightMinuteSourcePreparationAuthorityRepository {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_AUTHORITY_REPOSITORY_VERSION
  persistQualificationCreateOnly(input: {
    readonly qualification:
      CanonicalSam31EightMinuteSourcePreparationQualification
  }): Promise<'created' | 'identical_replay'>
  rereadQualification(input: {
    readonly qualificationRef: EvidenceRef
  }): Promise<CanonicalSam31EightMinuteSourcePreparationQualification | null>
  persistReleaseCreateOnly(input: {
    readonly release: CanonicalSam31EightMinuteSourcePreparationRelease
  }): Promise<'created' | 'identical_replay'>
  rereadRelease(input: {
    readonly releaseRef: EvidenceRef
  }): Promise<CanonicalSam31EightMinuteSourcePreparationRelease | null>
  persistAdmissionCreateOnly(input: {
    readonly admission: CanonicalSam31EightMinuteSourcePreparationAdmission
  }): Promise<'created' | 'identical_replay'>
  rereadAdmission(input: {
    readonly invocationId: string
  }): Promise<CanonicalSam31EightMinuteSourcePreparationAdmission | null>
  consumeAdmissionCreateOnly(input: {
    readonly consumption: CanonicalSam31EightMinuteSourcePreparationConsumption
  }): Promise<'created' | 'identical_replay'>
  rereadConsumption(input: {
    readonly invocationId: string
  }): Promise<CanonicalSam31EightMinuteSourcePreparationConsumption | null>
  rereadConsumedAdmission(input: {
    readonly invocationId: string
  }): Promise<Readonly<{
    admission: CanonicalSam31EightMinuteSourcePreparationAdmission
    consumption: CanonicalSam31EightMinuteSourcePreparationConsumption
    release: CanonicalSam31EightMinuteSourcePreparationRelease
    qualification: CanonicalSam31EightMinuteSourcePreparationQualification
    exactCreateOnlyRecordsReread: true
  }> | null>
}

export interface CanonicalSam31EightMinuteSourcePreparationAdmissionOwner {
  readonly schemaVersion: typeof
    CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_OWNER_VERSION
  readonly routeId: typeof ROUTE_ID
  readonly minimumIdleInstances: 0
  readonly customerCreditMutationAllowed: false
  readonly callerReleaseRateBudgetOrSourceCoordinatesAccepted: false
  admitOneShot(
    trigger: CanonicalSam31EightMinuteSourcePreparationTrigger,
  ): Promise<Readonly<{
    status: 'ready'
    disposition: 'created' | 'identical_replay'
    admission: CanonicalSam31EightMinuteSourcePreparationAdmission
    admissionRef: EvidenceRef
    exactPlanReleaseQualificationImageRateAndBudgetReread: true
    gpuJobStarted: false
    customerCreditsMutated: false
    productionAuthorityGranted: false
  }>>
}

export function createCanonicalSam31EightMinuteSourcePreparationQualification(
  input: Omit<CanonicalSam31EightMinuteSourcePreparationQualification,
    'schemaVersion' | 'source' | 'evidenceClass' | 'qualificationHash'>,
): CanonicalSam31EightMinuteSourcePreparationQualification {
  assertPlainSerializedData(input, 'sam31_source_prep_qualification_input')
  const payload = qualificationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_QUALIFICATION_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_qualification_owner',
    evidenceClass: 'canonical_private_l4_image_qualification',
    ...structuredClone(input),
  })
  return assertCanonicalSam31EightMinuteSourcePreparationQualification({
    ...payload,
    qualificationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31EightMinuteSourcePreparationQualification(
  value: unknown,
): CanonicalSam31EightMinuteSourcePreparationQualification {
  assertPlainSerializedData(value, 'sam31_source_prep_qualification')
  const qualification = qualificationSchema.parse(value)
  const { qualificationHash, ...payload } = qualification
  if (qualificationHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_prep_qualification_digest_changed')
  }
  return freeze(structuredClone(qualification))
}

export function getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
  qualification: CanonicalSam31EightMinuteSourcePreparationQualification,
): EvidenceRef {
  const parsed = assertCanonicalSam31EightMinuteSourcePreparationQualification(
    qualification,
  )
  return ref(parsed.qualificationId, parsed.qualificationHash)
}

export function createCanonicalSam31EightMinuteSourcePreparationRelease(input: {
  readonly releaseId: string
  readonly qualification:
    CanonicalSam31EightMinuteSourcePreparationQualification
  readonly releasedAt: string
  readonly expiresAt: string
}): CanonicalSam31EightMinuteSourcePreparationRelease {
  assertPlainSerializedData(input, 'sam31_source_prep_release_input')
  const qualification =
    assertCanonicalSam31EightMinuteSourcePreparationQualification(
      input.qualification,
    )
  const releaseLag = Date.parse(input.releasedAt)
    - Date.parse(qualification.qualifiedAt)
  if (releaseLag < 0 || releaseLag > 24 * 60 * 60 * 1_000) {
    throw conflict('sam31_source_prep_release_qualification_stale')
  }
  const payload = releaseWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_RELEASE_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_release_owner',
    evidenceClass: 'canonical_private_qualified_l4_release',
    releaseId: input.releaseId,
    qualificationRef:
      getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
        qualification,
      ),
    operationId: OPERATION_ID,
    routeId: ROUTE_ID,
    routeProfileId: ROUTE_PROFILE_ID,
    projectId: PROJECT_ID,
    region: REGION,
    cloudRunJobName: CLOUD_RUN_JOB_NAME,
    cloudRunJobResource: CLOUD_RUN_JOB_RESOURCE,
    immutableImageRef: qualification.immutableImageRef,
    immutableImageDigest: qualification.immutableImageDigest,
    accelerator: 'nvidia_l4',
    configuredGpuType: 'nvidia-l4',
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    maximumExecutionSeconds: 7_200,
    maximumAttempts: 1,
    minimumIdleInstances: 0,
    maximumConcurrentAttemptsPerInstance: 1,
    userTriggeredScaleFromZero: true,
    stopsAtTerminalAttempt: true,
    runtimeDownloadAllowed: false,
    callerCommandImageModelPathUrlOrEnvironmentAccepted: false,
    substantiveCpuMediaProcessingAllowed: false,
    uncertainOutcomeRetryAllowed: false,
    accountEffectivePricingRequired: true,
    customerCreditMutationAllowed: false,
    publicListPriceSettlementAllowed: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    maximumReleaseValiditySeconds: 2_592_000,
    releasedAt: input.releasedAt,
    expiresAt: input.expiresAt,
  })
  return assertCanonicalSam31EightMinuteSourcePreparationRelease({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  }, input.releasedAt)
}

export function assertCanonicalSam31EightMinuteSourcePreparationRelease(
  value: unknown,
  at?: string,
): CanonicalSam31EightMinuteSourcePreparationRelease {
  assertPlainSerializedData(value, 'sam31_source_prep_release')
  const release = releaseSchema.parse(value)
  const { releaseHash, ...payload } = release
  if (releaseHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(release.releasedAt)
      || Date.parse(at) >= Date.parse(release.expiresAt)))) {
    throw conflict('sam31_source_prep_release_digest_or_expiry_changed')
  }
  return freeze(structuredClone(release))
}

export function getCanonicalSam31EightMinuteSourcePreparationReleaseRef(
  release: CanonicalSam31EightMinuteSourcePreparationRelease,
): EvidenceRef {
  const parsed = assertCanonicalSam31EightMinuteSourcePreparationRelease(
    release,
  )
  return ref(parsed.releaseId, parsed.releaseHash)
}

export function createCanonicalSam31EightMinuteSourcePreparationTrigger(
  input: Omit<CanonicalSam31EightMinuteSourcePreparationTrigger,
    'schemaVersion' | 'source' | 'triggerHash'
    | 'serverOwnedExactSourcePlanRequired'
    | 'callerSourcePathUrlBytesCommandModelOrEnvironmentAccepted'
    | 'customerCreditMutationAuthorized' | 'qaApprovalGranted'
    | 'publicDeliveryAuthorized' | 'productionAuthorityGranted'>,
): CanonicalSam31EightMinuteSourcePreparationTrigger {
  assertPlainSerializedData(input, 'sam31_source_prep_trigger_input')
  const payload = triggerWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_TRIGGER_VERSION,
    source:
      'authenticated_server_sam3_1_eight_minute_source_preparation_trigger',
    ...structuredClone(input),
    serverOwnedExactSourcePlanRequired: true,
    callerSourcePathUrlBytesCommandModelOrEnvironmentAccepted: false,
    customerCreditMutationAuthorized: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return assertCanonicalSam31EightMinuteSourcePreparationTrigger({
    ...payload,
    triggerHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31EightMinuteSourcePreparationTrigger(
  value: unknown,
): CanonicalSam31EightMinuteSourcePreparationTrigger {
  assertPlainSerializedData(value, 'sam31_source_prep_trigger')
  const trigger = triggerSchema.parse(value)
  const { triggerHash, ...payload } = trigger
  if (triggerHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_prep_trigger_digest_changed')
  }
  return freeze(structuredClone(trigger))
}

export function assertCanonicalSam31EightMinuteSourcePreparationAdmission(
  value: unknown,
  at?: string,
): CanonicalSam31EightMinuteSourcePreparationAdmission {
  assertPlainSerializedData(value, 'sam31_source_prep_admission')
  const admission = admissionSchema.parse(value)
  const { admissionHash, ...payload } = admission
  if (admissionHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (Date.parse(at) < Date.parse(admission.admittedAt)
      || Date.parse(at) >= Date.parse(admission.expiresAt)))) {
    throw conflict('sam31_source_prep_admission_digest_or_expiry_changed')
  }
  return freeze(structuredClone(admission))
}

export function createCanonicalSam31EightMinuteSourcePreparationConsumption(
  input: {
    readonly admission: CanonicalSam31EightMinuteSourcePreparationAdmission
    readonly idempotencyKey: string
    readonly consumedAt: string
  },
): CanonicalSam31EightMinuteSourcePreparationConsumption {
  assertPlainSerializedData(input, 'sam31_source_prep_consumption_input')
  const admission = assertCanonicalSam31EightMinuteSourcePreparationAdmission(
    input.admission,
    input.consumedAt,
  )
  if (input.idempotencyKey !== admission.idempotencyKey) {
    throw conflict('sam31_source_prep_consumption_idempotency_changed')
  }
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_CONSUMPTION_VERSION,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_launch_owner',
    invocationId: admission.invocationId,
    admissionRef: ref(admission.admissionId, admission.admissionHash),
    releaseRef: admission.releaseRef,
    idempotencyKey: input.idempotencyKey,
    consumedBeforeCloudRunCall: true,
    oneAdmissionMayCreateAtMostOneCloudJob: true,
    uncertainOutcomeRetryAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    consumedAt: input.consumedAt,
  })
  return assertConsumption({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31EightMinuteSourcePreparationAuthorityRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository:
  CanonicalSam31EightMinuteSourcePreparationAuthorityRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_AUTHORITY_REPOSITORY_VERSION,
    persistQualificationCreateOnly: ({ qualification }) => persist({
      port: input.objectPort,
      path: `${prefix}/qualifications/${qualification.qualificationId}.json`,
      kind: 'qualification',
      value: assertCanonicalSam31EightMinuteSourcePreparationQualification(
        qualification,
      ),
    }),
    rereadQualification: ({ qualificationRef }) => read({
      port: input.objectPort,
      path: `${prefix}/qualifications/${qualificationRef.id}.json`,
      kind: 'qualification',
      parser: assertCanonicalSam31EightMinuteSourcePreparationQualification,
      expectedRef: qualificationRef,
      refFor: getCanonicalSam31EightMinuteSourcePreparationQualificationRef,
    }),
    persistReleaseCreateOnly: ({ release }) => persist({
      port: input.objectPort,
      path: `${prefix}/releases/${release.releaseId}.json`,
      kind: 'release',
      value: assertCanonicalSam31EightMinuteSourcePreparationRelease(release),
    }),
    rereadRelease: ({ releaseRef }) => read({
      port: input.objectPort,
      path: `${prefix}/releases/${releaseRef.id}.json`,
      kind: 'release',
      parser: assertCanonicalSam31EightMinuteSourcePreparationRelease,
      expectedRef: releaseRef,
      refFor: getCanonicalSam31EightMinuteSourcePreparationReleaseRef,
    }),
    persistAdmissionCreateOnly: ({ admission }) => persist({
      port: input.objectPort,
      path: `${prefix}/admissions/${admission.invocationId}.json`,
      kind: 'admission',
      value: assertCanonicalSam31EightMinuteSourcePreparationAdmission(
        admission,
      ),
    }),
    rereadAdmission: ({ invocationId }) => read({
      port: input.objectPort,
      path: `${prefix}/admissions/${safeId.parse(invocationId)}.json`,
      kind: 'admission',
      parser: assertCanonicalSam31EightMinuteSourcePreparationAdmission,
    }),
    consumeAdmissionCreateOnly: ({ consumption }) => persist({
      port: input.objectPort,
      path: `${prefix}/consumptions/${consumption.invocationId}.json`,
      kind: 'consumption',
      value: assertConsumption(consumption),
      identicalReplayAllowed: false,
    }),
    rereadConsumption: ({ invocationId }) => read({
      port: input.objectPort,
      path:
        `${prefix}/consumptions/${safeId.parse(invocationId)}.json`,
      kind: 'consumption',
      parser: assertConsumption,
    }),
    async rereadConsumedAdmission({ invocationId }) {
      const id = safeId.parse(invocationId)
      const admission = await repository.rereadAdmission({ invocationId: id })
      const consumption = await repository.rereadConsumption({
        invocationId: id,
      })
      if (!admission || !consumption) return null
      const release = await repository.rereadRelease({
        releaseRef: admission.releaseRef,
      })
      if (!release) return null
      const qualification = await repository.rereadQualification({
        qualificationRef: release.qualificationRef,
      })
      if (!qualification) return null
      if (!sameRef(consumption.admissionRef,
        ref(admission.admissionId, admission.admissionHash))
        || !sameRef(consumption.releaseRef, admission.releaseRef)
        || !sameRef(release.qualificationRef,
          getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
            qualification,
          ))
        || !sameRef(release.immutableImageRef,
          qualification.immutableImageRef)) {
        throw conflict('sam31_source_prep_consumed_lineage_changed')
      }
      return freeze({
        admission,
        consumption,
        release,
        qualification,
        exactCreateOnlyRecordsReread: true as const,
      })
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner(
  input: {
    readonly sourceRepository:
      CanonicalSam31EightMinuteQualificationSourceRepository
    readonly authorityRepository:
      CanonicalSam31EightMinuteSourcePreparationAuthorityRepository
    readonly rateRepository:
      Pick<CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
        'rereadApprovedCurrentRate'>
    readonly releaseRef: EvidenceRef
    readonly currentRateAuthorityRef: EvidenceRef
    readonly now?: () => string
  },
): CanonicalSam31EightMinuteSourcePreparationAdmissionOwner {
  assertAdmissionDependencies(input)
  const releaseRef = evidenceRefSchema.parse(input.releaseRef)
  const rateRef = evidenceRefSchema.parse(input.currentRateAuthorityRef)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_OWNER_VERSION,
    routeId: ROUTE_ID,
    minimumIdleInstances: 0 as const,
    customerCreditMutationAllowed: false as const,
    callerReleaseRateBudgetOrSourceCoordinatesAccepted: false as const,
    async admitOneShot(
      untrustedTrigger: CanonicalSam31EightMinuteSourcePreparationTrigger,
    ) {
      const trigger = assertCanonicalSam31EightMinuteSourcePreparationTrigger(
        untrustedTrigger,
      )
      const startedAt = timestamp.parse(now())
      assertTriggerFresh(trigger, startedAt)
      const [planRaw, releaseRaw, rateRaw] = await Promise.all([
        input.sourceRepository.rereadPlan({
          qualificationSourceId: trigger.qualificationSourceId,
        }),
        input.authorityRepository.rereadRelease({ releaseRef }),
        input.rateRepository.rereadApprovedCurrentRate({
          rateAuthorityRef: rateRef,
          routeId: ROUTE_ID,
          at: startedAt,
        }),
      ])
      if (!planRaw || !releaseRaw || !rateRaw) {
        throw notReady('sam31_source_prep_prerequisite_not_ready')
      }
      const admittedAt = timestamp.parse(now())
      assertTriggerFresh(trigger, admittedAt)
      const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
        planRaw,
      )
      const release =
        assertCanonicalSam31EightMinuteSourcePreparationRelease(
          releaseRaw,
          admittedAt,
        )
      const qualificationRaw = await input.authorityRepository
        .rereadQualification({ qualificationRef: release.qualificationRef })
      if (!qualificationRaw) {
        throw notReady('sam31_source_prep_qualification_not_ready')
      }
      const qualification =
        assertCanonicalSam31EightMinuteSourcePreparationQualification(
          qualificationRaw,
        )
      const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        rateRaw,
        admittedAt,
      )
      assertPrerequisites({ plan, release, qualification, rate, releaseRef,
        rateRef })
      const maximumUsage = maximumUsageSchema.parse(buildMaximumUsage())
      const cost = calculateCanonicalProfessionalGpuInfrastructureCost({
        rateAuthority: rate,
        usage: maximumUsage,
        observedAt: admittedAt,
      })
      const maximumPlatformInternalCostUsdNanos = Math.max(
        1,
        cost.totalInfrastructureCostUsdNanos,
      )
      if (maximumPlatformInternalCostUsdNanos >
        MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS) {
        throw notReady('sam31_source_prep_internal_budget_exceeded')
      }
      const planRef = ref(plan.qualificationSourceId, plan.planHash)
      const triggerRef = ref(trigger.invocationId, trigger.triggerHash)
      const platformEstimateRef = ref(
        `${trigger.invocationId}:platform-estimate`,
        sha256AuthorityValue({
          triggerRef,
          planRef,
          releaseRef,
          qualificationRef: release.qualificationRef,
          immutableImageRef: release.immutableImageRef,
          currentAccountRateAuthorityRef: rateRef,
          maximumUsage,
          cost,
          maximumApprovedInternalBudgetUsdNanos:
            MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS,
          customerEligibleCostUsdNanos: 0,
        }),
      )
      const existing = await input.authorityRepository.rereadAdmission({
        invocationId: trigger.invocationId,
      })
      if (existing) {
        const replay =
          assertCanonicalSam31EightMinuteSourcePreparationAdmission(
            existing,
            admittedAt,
          )
        if (!sameRef(replay.triggerRef, triggerRef)
          || !sameRef(replay.qualificationSourcePlanRef, planRef)
          || !sameRef(replay.exactEightMinuteSourceRef,
            plan.exactEightMinuteSourceRef)
          || !sameRef(replay.releaseRef, releaseRef)
          || !sameRef(replay.qualificationRef, release.qualificationRef)
          || !sameRef(replay.immutableImageRef, release.immutableImageRef)
          || !sameRef(replay.currentAccountRateAuthorityRef, rateRef)
          || !sameRef(replay.platformEstimateRef, platformEstimateRef)
          || replay.idempotencyKey !== trigger.idempotencyKey
          || replay.maximumPlatformInternalCostUsdNanos !==
            maximumPlatformInternalCostUsdNanos) {
          throw conflict('sam31_source_prep_admission_replay_changed')
        }
        return freeze({
          status: 'ready' as const,
          disposition: 'identical_replay' as const,
          admission: replay,
          admissionRef: ref(replay.admissionId, replay.admissionHash),
          exactPlanReleaseQualificationImageRateAndBudgetReread: true as const,
          gpuJobStarted: false as const,
          customerCreditsMutated: false as const,
          productionAuthorityGranted: false as const,
        })
      }
      const payload = admissionWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_ADMISSION_VERSION,
        source:
          'canonical_server_sam3_1_eight_minute_source_preparation_admission_owner',
        evidenceClass: 'canonical_private_exact_prerequisite_reread',
        admissionId: trigger.invocationId,
        invocationId: trigger.invocationId,
        idempotencyKey: trigger.idempotencyKey,
        triggerRef,
        qualificationSourcePlanRef: planRef,
        exactEightMinuteSourceRef: plan.exactEightMinuteSourceRef,
        releaseRef,
        qualificationRef: release.qualificationRef,
        immutableImageRef: release.immutableImageRef,
        currentAccountRateAuthorityRef: rateRef,
        platformEstimateRef,
        maximumUsage,
        maximumPlatformInternalCostUsdNanos,
        maximumApprovedInternalBudgetUsdNanos:
          MAXIMUM_PLATFORM_INTERNAL_COST_USD_NANOS,
        operationId: OPERATION_ID,
        routeId: ROUTE_ID,
        routeProfileId: ROUTE_PROFILE_ID,
        maximumAttempts: 1,
        attemptOrdinal: 1,
        createOnlyConsumptionRequiredBeforeCloudRunCall: true,
        uncertainOutcomeRetryAllowed: false,
        exactPlanReleaseQualificationImageRateAndBudgetReread: true,
        userTriggeredScaleFromZero: true,
        minimumIdleInstances: 0,
        platformFundedPrivateQualification: true,
        customerCreditReservationRequired: false,
        customerCreditsMutated: false,
        systemFailureOrUnknownCostChargedToCustomer: false,
        unapprovedOverageChargedToCustomer: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        admittedAt,
        expiresAt: new Date(
          Date.parse(admittedAt) + ADMISSION_TTL_MILLISECONDS,
        ).toISOString(),
      })
      const admission =
        assertCanonicalSam31EightMinuteSourcePreparationAdmission({
          ...payload,
          admissionHash: sha256AuthorityValue(payload),
        })
      const disposition = await input.authorityRepository
        .persistAdmissionCreateOnly({ admission })
      const reread = await input.authorityRepository.rereadAdmission({
        invocationId: trigger.invocationId,
      })
      if (!reread || reread.admissionHash !== admission.admissionHash) {
        throw conflict('sam31_source_prep_admission_reread_changed')
      }
      return freeze({
        status: 'ready' as const,
        disposition,
        admission,
        admissionRef: ref(admission.admissionId, admission.admissionHash),
        exactPlanReleaseQualificationImageRateAndBudgetReread: true as const,
        gpuJobStarted: false as const,
        customerCreditsMutated: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function assertConsumption(
  value: unknown,
): CanonicalSam31EightMinuteSourcePreparationConsumption {
  assertPlainSerializedData(value, 'sam31_source_prep_consumption')
  const consumption = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = consumption
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam31_source_prep_consumption_digest_changed')
  }
  return freeze(structuredClone(consumption))
}

function buildMaximumUsage(): CanonicalProfessionalToolGpuUsage {
  return Object.freeze({
    coldStartMilliseconds: 600_000,
    runtimeAndModelLoadMilliseconds: 60_000,
    activeGpuMilliseconds: 6_480_000,
    drainAndShutdownMilliseconds: 60_000,
    totalBillableMilliseconds: MAXIMUM_EXECUTION_MILLISECONDS,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: PRIVATE_ARTIFACT_BYTES,
    privateArtifactRetentionMilliseconds:
      PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: 2_000,
    classBOperationCount: 2_000,
  })
}

function assertPrerequisites(input: {
  plan: ReturnType<typeof parseCanonicalSam31EightMinuteQualificationSourcePlan>
  release: CanonicalSam31EightMinuteSourcePreparationRelease
  qualification: CanonicalSam31EightMinuteSourcePreparationQualification
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority
  releaseRef: EvidenceRef
  rateRef: EvidenceRef
}): void {
  if (input.plan.preparationOperationId !== OPERATION_ID
    || input.plan.preparationRouteId !== ROUTE_ID
    || input.plan.preparationAccelerator !== 'nvidia_l4'
    || !sameRef(getCanonicalSam31EightMinuteSourcePreparationReleaseRef(
      input.release,
    ), input.releaseRef)
    || !sameRef(input.release.qualificationRef,
      getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
        input.qualification,
      ))
    || !sameRef(input.release.immutableImageRef,
      input.qualification.immutableImageRef)
    || !sameRef(rateRef(input.rate), input.rateRef)
    || input.rate.routeId !== ROUTE_ID
    || input.rate.profileId !== ROUTE_PROFILE_ID
    || input.rate.routeRole !== 'standard_primary'
    || input.rate.executionTarget !== 'google_cloud_run_l4_job'
    || input.rate.machineType !== 'cloud_run_nvidia_l4'
    || input.rate.accelerator !== 'nvidia_l4'
    || input.rate.region !== REGION
    || input.rate.currency !== 'USD'
    || input.rate.sourceClass !== 'billing_account_effective_pricing_api'
    || !input.rate.exactSkuRegionCurrencyTierAndCurrentPriceReread
    || input.rate.customerPricingOrServiceFeeAuthorityGranted
    || input.rate.walletOrCreditMutationAuthorityGranted
    || !input.rate.approvedForPreapprovalInfrastructureEstimate) {
    throw conflict('sam31_source_prep_prerequisite_lineage_changed')
  }
}

function assertTriggerFresh(
  trigger: CanonicalSam31EightMinuteSourcePreparationTrigger,
  at: string,
): void {
  const age = Date.parse(at) - Date.parse(trigger.triggeredAt)
  if (age < 0 || age > MAXIMUM_TRIGGER_AGE_MILLISECONDS) {
    throw conflict('sam31_source_prep_trigger_stale')
  }
}

function rateRef(rate: CanonicalCurrentGoogleCloudGpuRateAuthority):
EvidenceRef {
  return ref(rate.rateAuthorityId, rate.rateAuthorityHash,
    rate.rateAuthorityVersion)
}

async function persist(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  kind: RecordKind
  value: unknown
  identicalReplayAllowed?: boolean
}): Promise<'created' | 'identical_replay'> {
  const payload = recordWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_EIGHT_MINUTE_SOURCE_PREPARATION_AUTHORITY_REPOSITORY_VERSION,
    recordKind: input.kind,
    value: input.value,
  })
  const record = recordSchema.parse({
    ...payload,
    recordHash: sha256AuthorityValue(payload),
  })
  const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  if (disposition === 'already_exists'
    && input.identicalReplayAllowed === false) {
    throw conflict('sam31_source_prep_admission_already_consumed')
  }
  const reread = await readRecord(input.port, input.path, input.kind)
  if (!reread || reread.recordHash !== record.recordHash) {
    throw conflict('sam31_source_prep_record_reread_changed')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function read<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  kind: RecordKind
  parser(value: unknown): T
  expectedRef?: EvidenceRef
  refFor?(value: T): EvidenceRef
}): Promise<T | null> {
  const record = await readRecord(input.port, input.path, input.kind)
  if (!record) return null
  const value = input.parser(record.value)
  if (input.expectedRef && input.refFor
    && !sameRef(input.expectedRef, input.refFor(value))) {
    throw conflict('sam31_source_prep_record_ref_changed')
  }
  return freeze(structuredClone(value))
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  kind: RecordKind,
): Promise<z.infer<typeof recordSchema> | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('sam31_source_prep_record_bytes_changed')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('sam31_source_prep_record_json_changed')
  }
  assertPlainSerializedData(decoded, 'sam31_source_prep_record')
  const record = recordSchema.parse(decoded)
  const { recordHash, ...payload } = record
  if (record.recordKind !== kind
    || recordHash !== sha256AuthorityValue(payload)
    || body.toString('utf8') !== stableAuthorityStringify(record)) {
    throw conflict('sam31_source_prep_record_changed')
  }
  return record
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw notReady('sam31_source_prep_object_port_not_ready')
  }
}

function assertAdmissionDependencies(
  input: Parameters<
    typeof createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner
  >[0],
): void {
  if (typeof input.sourceRepository?.rereadPlan !== 'function'
    || typeof input.authorityRepository?.rereadRelease !== 'function'
    || typeof input.authorityRepository?.rereadQualification !== 'function'
    || typeof input.authorityRepository?.persistAdmissionCreateOnly !==
      'function'
    || typeof input.authorityRepository?.rereadAdmission !== 'function'
    || typeof input.rateRepository?.rereadApprovedCurrentRate !== 'function') {
    throw notReady('sam31_source_prep_admission_dependencies_not_ready')
  }
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return Object.freeze(evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  }))
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'SAM 3.1 eight-minute source preparation authority changed.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'SAM 3.1 eight-minute source preparation is not ready.',
    503,
    { requiredGate },
  )
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
