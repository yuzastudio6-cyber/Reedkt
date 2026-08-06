import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  type CanonicalProfessionalGpuCloudJobLaunchPort,
  type CanonicalProfessionalGpuCloudLaunchResult,
  type CanonicalProfessionalGpuRuntimeLaunchTarget,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RELEASE_VERSION =
  'canonical-professional-google-cloud-gpu-release-v2' as const
export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_LAUNCH_PORT_VERSION =
  'canonical-professional-google-cloud-gpu-launch-port-v1' as const
export const CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_PRIVATE_OBJECT_TRANSPORT_VERSION =
  'canonical-professional-google-cloud-gpu-private-object-transport-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_OBJECT_TRANSPORT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-private-object-transport-v2' as const

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
const region = z.enum(['us-central1', 'europe-west4'])
const routeId = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const serviceIdentity = z.string().trim().max(180).regex(
  /^[a-z][a-z0-9-]{0,62}@reeditpro\.iam\.gserviceaccount\.com$/u,
)
const immutableImageUri = z.string().trim().max(512).regex(
  /^(us-central1|europe-west4)-docker\.pkg\.dev\/reeditpro\/[a-z0-9._-]+\/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$/u,
)
const privateBucketName = z.string().trim().min(3).max(222).regex(
  /^[a-z0-9][a-z0-9._-]+[a-z0-9]$/u,
)

const commonReleaseShape = {
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_google_cloud_gpu_release_registry',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  releaseRef: evidenceRefSchema,
  fixedServerTaskContractRef: evidenceRefSchema,
  serviceIdentityRef: evidenceRefSchema,
  privateNetworkAndArtifactTransportRef: evidenceRefSchema,
  toolId: safeId,
  operationId: safeId,
  routeId,
  projectId: z.literal(PROJECT_ID),
  runtimeRegion: region,
  serviceAccountEmail: serviceIdentity,
  immutableImageUri,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  maximumExecutionSeconds: z.number().int().min(60).max(7_200),
  taskCount: z.literal(1),
  taskParallelism: z.literal(1),
  maximumTaskRetries: z.literal(0),
  invocationEnvironmentName: z.literal('REEDITPRO_GPU_INVOCATION_ID'),
  acceleratorEnvironmentName: z.literal('WEEDITPRO_GPU_ACCELERATOR_CLASS'),
  privateExecutionEnvelopeRereadRequired: z.literal(true),
  runtimeDownloadAllowed: z.literal(false),
  callerCommandImageModelPathUrlOrEnvironmentAccepted: z.literal(false),
  externalIpAllowed: z.literal(false),
  privateNetworkOnly: z.literal(true),
  minimumIdleInstances: z.literal(0),
  prewarmingOrKeepaliveAllowed: z.literal(false),
  oneConsumedAdmissionCreatesAtMostOneJob: z.literal(true),
  retryAfterUnknownCreateOutcomeAllowed: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  configurationHash: sha256,
}

const a100ReleaseWithoutHashSchema = z.object({
  ...commonReleaseShape,
  routeId: z.literal('a100_80gb_heavy_primary'),
  executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  allocatedLocalScratchGiB: z.literal(375),
  batchCollectionResource: z.string().trim().max(512).regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs$/u,
  ).refine((value) => !value.includes('..')),
  batchInstanceTemplateResource: z.string().trim().max(512).regex(
    /^projects\/reeditpro\/global\/instanceTemplates\/[a-z][a-z0-9-]{0,62}$/u,
  ).refine((value) => !value.includes('..')),
  allowedZones: z.array(z.string().regex(
    /^(us-central1-[ac]|europe-west4-a)$/u,
  )).min(1).max(2),
  localScratchDeviceName: z.literal('reeditpro-a100-scratch'),
  localScratchMountPath: z.literal('/mnt/disks/reeditpro-a100-scratch'),
  installGpuDriversAtJobStart: z.literal(false),
}).strict().superRefine((release, context) => {
  const expectedZones = release.runtimeRegion === 'us-central1'
    ? ['us-central1-a', 'us-central1-c']
    : ['europe-west4-a']
  if (
    release.batchCollectionResource !==
      `projects/${PROJECT_ID}/locations/${release.runtimeRegion}/jobs`
    || release.allowedZones.length !== expectedZones.length
    || release.allowedZones.some((zone, index) =>
      zone !== expectedZones[index])
  ) context.addIssue({
    code: 'custom',
    message: 'A100 Batch release lost exact region or zone scope.',
  })
})

const l4ReleaseWithoutHashSchema = z.object({
  ...commonReleaseShape,
  routeId: z.enum(['l4_heavy_fallback', 'l4_standard_primary']),
  executionTarget: z.literal('google_cloud_run_l4_job'),
  machineType: z.literal('cloud_run_nvidia_l4'),
  accelerator: z.literal('nvidia_l4'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(8),
  allocatedMemoryGiB: z.literal(32),
  allocatedLocalScratchGiB: z.literal(0),
  cloudRunJobResource: z.string().trim().max(512).regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
  ).refine((value) => !value.includes('..')),
  configuredMinimumInstances: z.literal(0),
  configuredMaximumInstances: z.number().int().min(1).max(100),
  configuredGpuType: z.literal('nvidia-l4'),
  configuredGpuCount: z.literal(1),
  gpuZonalRedundancyDisabled: z.literal(true),
}).strict().superRefine((release, context) => {
  if (!release.cloudRunJobResource.startsWith(
    `projects/${PROJECT_ID}/locations/${release.runtimeRegion}/jobs/`,
  )) context.addIssue({
    code: 'custom',
    message: 'L4 Cloud Run release lost exact region scope.',
  })
})

export const canonicalProfessionalGoogleCloudGpuReleaseSchema =
  z.discriminatedUnion(
  'executionTarget',
  [a100ReleaseWithoutHashSchema, l4ReleaseWithoutHashSchema],
).superRefine((release, context) => {
  const imageDigest = release.immutableImageUri.match(
    /@sha256:([a-f0-9]{64})$/u,
  )?.[1]
  if (
    release.immutableImageDigest !== `sha256:${imageDigest ?? ''}`
    || release.immutableImageRef.contentHash !== release.immutableImageDigest
    || !release.immutableImageUri.startsWith(
      `${release.runtimeRegion}-docker.pkg.dev/${PROJECT_ID}/`,
    )
  ) context.addIssue({
    code: 'custom',
    message: 'GPU release lost exact immutable image lineage.',
  })
})
export type CanonicalProfessionalGoogleCloudGpuRelease = z.infer<
  typeof canonicalProfessionalGoogleCloudGpuReleaseSchema
>

export const canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema =
  z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_PRIVATE_OBJECT_TRANSPORT_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_private_object_transport_registry',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  transportRef: evidenceRefSchema,
  serviceIdentityRef: evidenceRefSchema,
  routeId,
  projectId: z.literal(PROJECT_ID),
  privateBucketName,
  bucketCmekAndUniformAccessPolicyRef: evidenceRefSchema,
  invocationRootMountPath: z.literal('/mnt/reeditpro'),
  invocationObjectPrefix: z.literal(
    'private/canonical-professional-gpu/sam3_1/v1/invocations',
  ),
  taskObjectName: z.literal('task.json'),
  sourceProxyObjectName: z.literal('mask-proxy.mp4'),
  responseObjectName: z.literal('response.json'),
  gcsFuseVolumeName: z.literal('reeditpro-private-gpu-objects'),
  gcsFuseMountOptions: z.literal('rw,implicit-dirs'),
  cloudRunJobResource: z.string().trim().max(512).regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
  ).nullable(),
  cloudRunJobConfigurationRef: evidenceRefSchema.nullable(),
  a100BatchMountCompiledIntoCreateRequest: z.boolean(),
  l4CloudRunMountPreconfiguredAndReread: z.boolean(),
  taskAndSourceGenerationOneRereadBeforeLaunch: z.literal(true),
  responseAndOutputGenerationOneRequired: z.literal(true),
  serviceIdentityLeastPrivilegeReadTaskSourceWriteOutputOnly: z.literal(true),
  signedUrlPublicObjectOrCallerPathTransportAllowed: z.literal(false),
  runtimeModelOrMediaDownloadAllowed: z.literal(false),
  publicNetworkEgressAllowed: z.literal(false),
  observedAt: z.string().datetime({ offset: true }),
  configurationHash: sha256,
}).strict().superRefine((transport, context) => {
  const a100 = transport.routeId === 'a100_80gb_heavy_primary'
  const exact = a100
    ? transport.a100BatchMountCompiledIntoCreateRequest
      && !transport.l4CloudRunMountPreconfiguredAndReread
      && transport.cloudRunJobResource === null
      && transport.cloudRunJobConfigurationRef === null
    : !transport.a100BatchMountCompiledIntoCreateRequest
      && transport.l4CloudRunMountPreconfiguredAndReread
      && transport.cloudRunJobResource !== null
      && transport.cloudRunJobConfigurationRef !== null
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'GPU private object transport lost its A100 or L4 mount proof.',
  })
})
export type CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport =
  z.infer<
    typeof canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema
  >

export const canonicalTrackAllSam31L4TaskQaPrivateObjectTransportSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_OBJECT_TRANSPORT_VERSION,
    ),
    source: z.literal(
      'canonical_server_track_all_sam3_1_l4_task_qa_private_transport_registry',
    ),
    evidenceClass: z.literal('canonical_private_reread'),
    transportRef: evidenceRefSchema,
    serviceIdentityRef: evidenceRefSchema,
    routeId: z.literal('l4_standard_primary'),
    projectId: z.literal(PROJECT_ID),
    privateBucketName,
    bucketSecurityPolicyRef: evidenceRefSchema,
    bucketEncryptionMode: z.literal('google_managed_encryption'),
    uniformBucketLevelAccessEnabled: z.literal(true),
    publicAccessPreventionEnforced: z.literal(true),
    invocationRootMountPath: z.literal('/mnt/reeditpro'),
    invocationObjectPrefix: z.literal(
      'private/canonical-professional-gpu/sam3_1/v1/invocations',
    ),
    sam31ManifestObjectName: z.literal('output/mask-manifest.json'),
    sam31MaskObjectPattern: z.literal(
      'output/frame-{frameIndex:06}-object-{objectId:06}.png',
    ),
    l4TaskObjectName: z.literal('task-qa/task.json'),
    l4ResponseObjectName: z.literal('task-qa/response.json'),
    gcsFuseVolumeName: z.literal('reeditpro-private-gpu-objects'),
    gcsFuseMountOptions: z.literal(
      'uid=65532,gid=65532,implicit-dirs=true',
    ),
    cloudRunJobResource: z.string().trim().max(512).regex(
      /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
    ),
    cloudRunJobConfigurationRef: evidenceRefSchema,
    l4CloudRunMountPreconfiguredAndReread: z.literal(true),
    separateSam31ReadRootAndL4TaskQaWriteRoot: z.literal(true),
    exactSam31ManifestAndEveryMaskRereadRequired: z.literal(true),
    l4TaskGenerationOneRereadBeforeLaunch: z.literal(true),
    l4ResponseGenerationOneRequired: z.literal(true),
    callerPathUrlObjectNameCommandOrEnvironmentAllowed: z.literal(false),
    runtimeModelOrMediaDownloadAllowed: z.literal(false),
    publicNetworkEgressAllowed: z.literal(false),
    observedAt: z.string().datetime({ offset: true }),
    configurationHash: sha256,
  }).strict()
export type CanonicalTrackAllSam31L4TaskQaPrivateObjectTransport = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaPrivateObjectTransportSchema
>
export type CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportRecord =
  | CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport
  | CanonicalTrackAllSam31L4TaskQaPrivateObjectTransport

export interface CanonicalProfessionalGoogleCloudGpuReleaseReadPort {
  rereadPrivateRelease(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
  }): Promise<unknown>
}

export interface CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportReadPort {
  rereadPrivateObjectTransport(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
    readonly release: CanonicalProfessionalGoogleCloudGpuRelease
  }): Promise<unknown>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createGoogleCloudProfessionalGpuJobLaunchPort(input: {
  readonly releaseReadPort:
    CanonicalProfessionalGoogleCloudGpuReleaseReadPort
  readonly privateObjectTransportReadPort?:
    CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportReadPort
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
}): CanonicalProfessionalGpuCloudJobLaunchPort {
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
  ) throw new Error('GPU cloud launch timeout is invalid.')

  return Object.freeze({
    async startOneShotJob(request: Parameters<
      CanonicalProfessionalGpuCloudJobLaunchPort['startOneShotJob']
    >[0]) {
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        request.admission,
      )
      let providerCallStarted = false
      let prepared: ReturnType<typeof prepareCloudLaunch> | null = null
      try {
        const release = assertCanonicalProfessionalGoogleCloudGpuRelease(
          await input.releaseReadPort.rereadPrivateRelease({
            admission,
            target: request.target,
          }),
        )
        assertReleaseMatchesTarget({
          admission,
          target: request.target,
          release,
        })
        const fixedPrivateObjectTask = admission.toolId === 'sam3_1'
          || (
            admission.toolId === 'kornia'
            && admission.operationId === 'tool.kornia.refine_mask.v1'
          )
        const untrustedPrivateObjectTransport = fixedPrivateObjectTask
          ? await input.privateObjectTransportReadPort
              ?.rereadPrivateObjectTransport({
                admission,
                target: request.target,
                release,
              })
          : null
        const privateObjectTransport = admission.operationId ===
          'tool.kornia.refine_mask.v1'
          ? assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport(
              untrustedPrivateObjectTransport,
            )
          : fixedPrivateObjectTask
            ? assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
                untrustedPrivateObjectTransport,
              )
            : null
        if (fixedPrivateObjectTask) {
          assertPrivateObjectTransportMatches({
            admission,
            target: request.target,
            release,
            transport: privateObjectTransport!,
          })
        }
        prepared = prepareCloudLaunch({
          admission,
          target: request.target,
          release,
          admissionConsumptionRef: request.admissionConsumptionRef,
          executionEnvelopeRef: request.executionEnvelopeRef,
          privateObjectTransport,
        })
        providerCallStarted = true
        const response = await auth.request({
          url: prepared.url,
          method: 'POST',
          params: prepared.params,
          data: prepared.body,
          timeout: requestTimeoutMilliseconds,
          retry: false,
          maxRedirects: 0,
        })
        const execution = parseCreateResponse({
          untrusted: response.data,
          prepared,
        })
        return cloudLaunchResult({
          disposition: 'accepted',
          cloudJobExecutionRef: execution,
          cloudJobCreateRequestRef: prepared.createRequestRef,
          providerRequestIdDigestSha256:
            prepared.providerRequestIdDigestSha256,
          observedAt: now(),
          providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed',
        })
      } catch {
        const fallbackRef = prepared?.createRequestRef ?? evidenceRefSchema.parse({
          id: `gpu-cloud-create.${sha256AuthorityValue({
            admissionId: admission.admissionId,
            releaseRef: request.target.releaseRef,
            routeId: admission.routeId,
          }).slice(0, 32)}`,
          version: 1,
          contentHash: `sha256:${sha256AuthorityValue({
            admissionHash: admission.admissionHash,
            target: request.target,
          })}`,
        })
        return cloudLaunchResult({
          disposition: providerCallStarted
            ? 'outcome_unknown'
            : 'rejected_before_creation',
          cloudJobExecutionRef: null,
          cloudJobCreateRequestRef: fallbackRef,
          providerRequestIdDigestSha256: null,
          observedAt: now(),
          providerInferenceOrSubstantiveWorkKnownExecuted:
            providerCallStarted ? 'unknown' : 'not_executed',
        })
      }
    },
  })
}

export function assertCanonicalProfessionalGoogleCloudGpuRelease(
  value: unknown,
): CanonicalProfessionalGoogleCloudGpuRelease {
  assertPlainSerializedData(value, 'gpu_cloud_release')
  const release = canonicalProfessionalGoogleCloudGpuReleaseSchema.parse(value)
  const { configurationHash, ...payload } = release
  if (configurationHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU cloud release configuration hash is invalid.')
  }
  return release
}

export function assertCanonicalProfessionalGoogleCloudGpuPrivateObjectTransport(
  value: unknown,
): CanonicalProfessionalGoogleCloudGpuPrivateObjectTransport {
  assertPlainSerializedData(value, 'gpu_private_object_transport')
  const transport =
    canonicalProfessionalGoogleCloudGpuPrivateObjectTransportSchema.parse(
      value,
    )
  const { configurationHash, ...payload } = transport
  if (configurationHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU private object transport hash is invalid.')
  }
  return transport
}

export function assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaPrivateObjectTransport {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_private_transport')
  const transport =
    canonicalTrackAllSam31L4TaskQaPrivateObjectTransportSchema.parse(value)
  const { configurationHash, ...payload } = transport
  if (configurationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 task-QA transport hash is invalid.')
  }
  return transport
}

function assertReleaseMatchesTarget(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
  release: CanonicalProfessionalGoogleCloudGpuRelease
}): void {
  const { admission, target, release } = input
  if (
    !sameRef(release.releaseRef, target.releaseRef)
    || !sameRef(
      release.fixedServerTaskContractRef,
      target.fixedServerTaskContractRef,
    )
    || !sameRef(release.serviceIdentityRef, target.serviceIdentityRef)
    || !sameRef(
      release.privateNetworkAndArtifactTransportRef,
      target.privateNetworkAndArtifactTransportRef,
    )
    || !sameRef(release.immutableImageRef, target.immutableImageRef)
    || release.toolId !== admission.toolId
    || release.operationId !== admission.operationId
    || release.routeId !== target.routeId
    || release.runtimeRegion !== target.runtimeRegion
    || release.executionTarget !== target.executionTarget
    || release.machineType !== target.machineType
    || release.accelerator !== target.accelerator
    || release.immutableImageDigest !== target.immutableImageDigest
  ) throw new Error('GPU cloud release differs from its launch target.')
}

function assertPrivateObjectTransportMatches(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
  release: CanonicalProfessionalGoogleCloudGpuRelease
  transport: CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportRecord
}): void {
  const { admission, target, release, transport } = input
  const cloudRunResource = release.executionTarget ===
    'google_cloud_run_l4_job'
    ? release.cloudRunJobResource
    : null
  if (
    (admission.operationId !== 'tool.sam3_1.segment_and_track_subject.v1'
      && admission.operationId !== 'tool.kornia.refine_mask.v1')
    || transport.routeId !== admission.routeId
    || !sameRef(transport.transportRef,
      target.privateNetworkAndArtifactTransportRef)
    || !sameRef(transport.serviceIdentityRef, target.serviceIdentityRef)
    || transport.cloudRunJobResource !== cloudRunResource
    || (admission.operationId === 'tool.kornia.refine_mask.v1'
      && transport.schemaVersion !==
        CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_PRIVATE_OBJECT_TRANSPORT_VERSION)
    || (admission.operationId === 'tool.sam3_1.segment_and_track_subject.v1'
      && transport.schemaVersion !==
        CANONICAL_PROFESSIONAL_GOOGLE_CLOUD_GPU_PRIVATE_OBJECT_TRANSPORT_VERSION)
  ) throw new Error(
    'GPU private object transport differs from release or admission.',
  )
}

function prepareCloudLaunch(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
  release: CanonicalProfessionalGoogleCloudGpuRelease
  admissionConsumptionRef: z.infer<typeof evidenceRefSchema>
  executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  privateObjectTransport:
    CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportRecord | null
}) {
  const invocationId = input.executionEnvelopeRef.id
  if (input.release.executionTarget === 'google_cloud_batch_a2_ultra_job') {
    const jobId = `rp-gpu-${sha256AuthorityValue({
      invocationId,
      admissionConsumptionRef: input.admissionConsumptionRef,
      release: input.release.configurationHash,
    }).slice(0, 40)}`
    const requestId = deterministicUuid({
      invocationId,
      admissionConsumptionRef: input.admissionConsumptionRef,
      release: input.release.configurationHash,
      purpose: 'google_batch_create_request_deduplication_only',
    })
    const url = `${BATCH_API_ORIGIN}/v1/`
      + input.release.batchCollectionResource
    const params = { jobId, requestId }
    const body = createA100BatchBody({
      invocationId,
      release: input.release,
      privateObjectTransport: input.privateObjectTransport,
    })
    return freezePrepared({
      kind: 'a100_batch' as const,
      invocationId,
      expectedResource: `${input.release.batchCollectionResource}/${jobId}`,
      url,
      params,
      body,
      providerRequestIdDigestSha256: sha256AuthorityValue(requestId),
      privateTransportConfigurationHash:
        input.privateObjectTransport?.configurationHash ?? null,
    })
  }
  const url = `${CLOUD_RUN_API_ORIGIN}/v2/`
    + `${input.release.cloudRunJobResource}:run`
  const body = {
    overrides: {
      taskCount: 1,
      timeout: `${input.release.maximumExecutionSeconds}s`,
      containerOverrides: [{
        env: [
          {
            name: input.release.invocationEnvironmentName,
            value: invocationId,
          },
          {
            name: input.release.acceleratorEnvironmentName,
            value: input.release.accelerator,
          },
        ],
      }],
    },
  }
  return freezePrepared({
    kind: 'l4_cloud_run' as const,
    invocationId,
    expectedResource: input.release.cloudRunJobResource,
    url,
    params: undefined,
    body,
    providerRequestIdDigestSha256: null,
    privateTransportConfigurationHash:
      input.privateObjectTransport?.configurationHash ?? null,
  })
}

function createA100BatchBody(input: {
  invocationId: string
  release: Extract<CanonicalProfessionalGoogleCloudGpuRelease, {
    executionTarget: 'google_cloud_batch_a2_ultra_job'
  }>
  privateObjectTransport:
    CanonicalProfessionalGoogleCloudGpuPrivateObjectTransportRecord | null
}) {
  const release = input.release
  return {
    priority: '99',
    labels: {
      'reeditpro-operation': 'professional-gpu',
      'reeditpro-route': 'a100-80gb-heavy',
      'reeditpro-invocation': sha256AuthorityValue(input.invocationId)
        .slice(0, 32),
    },
    taskGroups: [{
      taskCount: '1',
      parallelism: '1',
      runAsNonRoot: true,
      taskSpec: {
        runnables: [{
          container: { imageUri: release.immutableImageUri },
          ignoreExitStatus: false,
          background: false,
          alwaysRun: false,
        }],
        computeResource: {
          cpuMilli: '12000',
          memoryMib: String(170 * 1_024),
        },
        maxRunDuration: `${release.maximumExecutionSeconds}s`,
        maxRetryCount: 0,
        volumes: [
          {
            deviceName: release.localScratchDeviceName,
            mountPath: release.localScratchMountPath,
            mountOptions: 'rw,async',
          },
          ...(input.privateObjectTransport ? [{
            gcs: {
              remotePath: input.privateObjectTransport.privateBucketName,
            },
            mountPath:
              input.privateObjectTransport.invocationRootMountPath,
            mountOptions:
              input.privateObjectTransport.gcsFuseMountOptions,
          }] : []),
        ],
        environment: {
          variables: {
            [release.invocationEnvironmentName]: input.invocationId,
            [release.acceleratorEnvironmentName]: release.accelerator,
          },
        },
      },
    }],
    allocationPolicy: {
      location: {
        allowedLocations: release.allowedZones.map((zone) => `zones/${zone}`),
      },
      instances: [{
        instanceTemplate: release.batchInstanceTemplateResource,
        installGpuDrivers: false,
        installOpsAgent: false,
        blockProjectSshKeys: true,
      }],
      serviceAccount: { email: release.serviceAccountEmail },
    },
    logsPolicy: { destination: 'CLOUD_LOGGING' },
  }
}

function parseCreateResponse(input: {
  untrusted: unknown
  prepared: ReturnType<typeof prepareCloudLaunch>
}): z.infer<typeof evidenceRefSchema> {
  assertPlainSerializedData(input.untrusted, 'gpu_cloud_create_response')
  if (input.prepared.kind === 'a100_batch') {
    const parsed = z.object({
      name: z.string().regex(
        /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/[a-z][a-z0-9-]{0,62}$/u,
      ),
      uid: safeId,
    }).passthrough().parse(input.untrusted)
    if (parsed.name !== input.prepared.expectedResource) {
      throw new Error('A100 Batch response returned another job.')
    }
    return opaqueExecutionRef('google-batch-job', {
      name: parsed.name,
      uid: parsed.uid,
      createRequestRef: input.prepared.createRequestRef,
    })
  }
  const parsed = z.object({
    name: z.string().regex(
      /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
    ),
    done: z.boolean().optional(),
  }).passthrough().parse(input.untrusted)
  return opaqueExecutionRef('google-cloud-run-operation', {
    name: parsed.name,
    expectedJobResource: input.prepared.expectedResource,
    createRequestRef: input.prepared.createRequestRef,
  })
}

function freezePrepared<T extends {
  kind: 'a100_batch' | 'l4_cloud_run'
  invocationId: string
  expectedResource: string
  url: string
  params: Record<string, string> | undefined
  body: unknown
  providerRequestIdDigestSha256: string | null
  privateTransportConfigurationHash: string | null
}>(input: T): Readonly<T & {
  createRequestRef: z.infer<typeof evidenceRefSchema>
}> {
  const requestDigest = sha256AuthorityValue({
    url: input.url,
    params: input.params,
    body: input.body,
    privateTransportConfigurationHash:
      input.privateTransportConfigurationHash,
  })
  return Object.freeze({
    ...input,
    createRequestRef: evidenceRefSchema.parse({
      id: `gpu-cloud-create.${requestDigest.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${requestDigest}`,
    }),
  })
}

function cloudLaunchResult(
  value: CanonicalProfessionalGpuCloudLaunchResult,
): CanonicalProfessionalGpuCloudLaunchResult {
  return Object.freeze(structuredClone(value))
}

function opaqueExecutionRef(prefix: string, value: unknown) {
  const digest = sha256AuthorityValue(value)
  return evidenceRefSchema.parse({
    id: `${prefix}.${digest.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${digest}`,
  })
}

function deterministicUuid(value: unknown): string {
  const bytes = Buffer.from(sha256AuthorityValue(value).slice(0, 32), 'hex')
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
    + `-${hex.slice(16, 20)}-${hex.slice(20)}`
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
  } = { seen: new Set<object>(), entries: 0 },
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
