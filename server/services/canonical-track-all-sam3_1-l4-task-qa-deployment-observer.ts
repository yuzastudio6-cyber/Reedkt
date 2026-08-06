import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  canonicalArtifactRegistryImageUrl,
  verifyCanonicalImageMetadata,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGoogleCloudGpuRelease,
  assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport,
} from './canonical-professional-google-cloud-gpu-job-launch-port'
import {
  assertCanonicalTrackAllSam31L4TaskQaImageQualification,
  canonicalTrackAllSam31L4TaskQaImageQualificationRef,
  createCanonicalTrackAllSam31L4TaskQaDeploymentObservation,
  type CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from './canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-deployment-evidence-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_OBSERVER_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-deployment-observer-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-deployment-evidence-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const OPERATION_ID = 'tool.kornia.refine_mask.v1' as const
const ROUTE_ID = 'l4_standard_primary' as const
const IMAGE_NAME = 'reeditpro-track-all-l4-task-qa' as const
const IMAGE_DIGEST =
  'sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71' as const
const IMAGE_URI =
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/${IMAGE_NAME}@${IMAGE_DIGEST}` as const
const JOB_NAME = 'reeditpro-track-all-mask-qa-l4' as const
const JOB_RESOURCE =
  `projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}` as const
const GPU_WORKER_EMAIL =
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com' as const
const API_SERVICE_EMAIL =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com' as const
const BUCKET = 'reeditpro-production-reeditpro-masks' as const
const NETWORK = 'weeditpro-gpu-private' as const
const SUBNET = 'weeditpro-gpu-private-us-central1' as const
const NETWORK_TAG = 'weeditpro-gpu-private-no-nat' as const
const VOLUME_NAME = 'reeditpro-private-gpu-objects' as const
const MOUNT_OPTIONS =
  'uid=65532,gid=65532,implicit-dirs=true' as const
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/deployment-evidence'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024

const RUN_JOB_URL = `https://run.googleapis.com/v2/${JOB_RESOURCE}`
const RUN_EXECUTIONS_URL = `${RUN_JOB_URL}/executions?pageSize=100`
const RUN_JOB_IAM_URL = `${RUN_JOB_URL}:getIamPolicy`
const BUCKET_URL = `https://storage.googleapis.com/storage/v1/b/${BUCKET}`
const BUCKET_IAM_URL = `${BUCKET_URL}/iam`
const SERVICE_ACCOUNT_URL =
  `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/`
  + encodeURIComponent(GPU_WORKER_EMAIL)
const IMAGE_URL = canonicalArtifactRegistryImageUrl(IMAGE_DIGEST, IMAGE_NAME)
const NETWORK_URL =
  `https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/global/networks/${NETWORK}`
const SUBNET_URL =
  `https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}/subnetworks/${SUBNET}`
const NETWORK_SELF_LINK =
  `https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/global/networks/${NETWORK}`
const SUBNET_SELF_LINK =
  `https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}/subnetworks/${SUBNET}`
const ROUTES_URL =
  `https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/global/routes?filter=${
    encodeURIComponent(`network eq ${NETWORK_SELF_LINK}`)
  }&maxResults=500`
const ROUTERS_URL =
  `https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}/routers?maxResults=500`
const ALLOWED_URLS = new Set([
  RUN_JOB_URL,
  RUN_EXECUTIONS_URL,
  RUN_JOB_IAM_URL,
  BUCKET_URL,
  BUCKET_IAM_URL,
  SERVICE_ACCOUNT_URL,
  IMAGE_URL,
  NETWORK_URL,
  SUBNET_URL,
  ROUTES_URL,
  ROUTERS_URL,
])

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const serviceIdentityEvidenceSchema = z.object({
  resourceName: z.literal(
    `projects/${PROJECT_ID}/serviceAccounts/${GPU_WORKER_EMAIL}`,
  ),
  projectId: z.literal(PROJECT_ID),
  email: z.literal(GPU_WORKER_EMAIL),
  uniqueId: z.string().regex(/^[1-9][0-9]{5,30}$/u),
  disabled: z.literal(false),
}).strict()
const imageEvidenceSchema = z.object({
  resourceName: z.literal(
    `projects/${PROJECT_ID}/locations/${REGION}/repositories/`
      + `reeditpro-workers/dockerImages/${IMAGE_NAME}@${IMAGE_DIGEST}`,
  ),
  uri: z.literal(IMAGE_URI),
  digest: z.literal(IMAGE_DIGEST),
  imageSizeBytes: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  mediaType: z.enum([
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.docker.distribution.manifest.v2+json',
  ]),
  uploadTime: timestamp,
}).strict()
const jobEvidenceSchema = z.object({
  resourceName: z.literal(JOB_RESOURCE),
  uid: z.string().uuid(),
  generation: z.string().regex(/^[1-9][0-9]*$/u),
  etag: z.string().trim().min(1).max(2_048),
  updateTime: timestamp,
  imageUri: z.literal(IMAGE_URI),
  taskCount: z.literal(1),
  parallelism: z.literal(1),
  maximumRetries: z.literal(0),
  timeoutSeconds: z.literal(3_600),
  cpu: z.literal('8'),
  memory: z.literal('32Gi'),
  gpuCount: z.literal('1'),
  accelerator: z.literal('nvidia-l4'),
  serviceAccountEmail: z.literal(GPU_WORKER_EMAIL),
  executionEnvironment: z.literal('EXECUTION_ENVIRONMENT_GEN2'),
  gpuZonalRedundancyDisabled: z.literal(true),
  network: z.literal(NETWORK),
  subnetwork: z.literal(SUBNET),
  networkTag: z.literal(NETWORK_TAG),
  vpcEgress: z.literal('ALL_TRAFFIC'),
  bucketName: z.literal(BUCKET),
  volumeName: z.literal(VOLUME_NAME),
  mountPath: z.literal('/mnt/reeditpro'),
  mountOptions: z.literal(MOUNT_OPTIONS),
  executionCount: z.number().int().nonnegative().safe(),
  latestExecutionName: z.string().trim().min(1).max(512),
  latestExecutionCompletionTime: timestamp,
}).strict()
const executionEvidenceSchema = z.object({
  executionCount: z.number().int().nonnegative().safe(),
  activeExecutionCount: z.literal(0),
  terminalExecutionNames: z.array(z.string().trim().min(1).max(512))
    .max(100),
}).strict()
const networkEvidenceSchema = z.object({
  networkSelfLink: z.literal(NETWORK_SELF_LINK),
  networkId: z.string().regex(/^[1-9][0-9]*$/u),
  autoCreateSubnetworks: z.literal(false),
  mtu: z.literal(1460),
  routingMode: z.literal('REGIONAL'),
}).strict()
const subnetEvidenceSchema = z.object({
  subnetSelfLink: z.literal(SUBNET_SELF_LINK),
  subnetId: z.string().regex(/^[1-9][0-9]*$/u),
  networkSelfLink: z.literal(NETWORK_SELF_LINK),
  region: z.literal(
    `https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/regions/${REGION}`,
  ),
  ipCidrRange: z.literal('10.42.0.0/24'),
  gatewayAddress: z.literal('10.42.0.1'),
  privateIpGoogleAccess: z.literal(true),
  purpose: z.literal('PRIVATE'),
  stackType: z.literal('IPV4_ONLY'),
}).strict()
const routeEvidenceSchema = z.object({
  routeCount: z.literal(2),
  defaultInternetGatewayRoutePresent: z.literal(true),
  localSubnetRoutePresent: z.literal(true),
  callerManagedNatOrProxyRoutePresent: z.literal(false),
}).strict()
const routerEvidenceSchema = z.object({
  routerCount: z.literal(0),
  cloudNatCount: z.literal(0),
}).strict()
const bucketEvidenceSchema = z.object({
  name: z.literal(BUCKET),
  location: z.literal('US-CENTRAL1'),
  storageClass: z.literal('STANDARD'),
  generation: z.string().regex(/^[1-9][0-9]*$/u),
  metageneration: z.string().regex(/^[1-9][0-9]*$/u),
  encryptionMode: z.literal('google_managed_encryption'),
  uniformBucketLevelAccessEnabled: z.literal(true),
  publicAccessPreventionEnforced: z.literal(true),
  softDeleteRetentionSeconds: z.number().int().min(604_800).safe(),
}).strict()
const iamEvidenceSchema = z.object({
  bucketPolicyEtag: z.string().trim().min(1).max(2_048),
  jobPolicyEtag: z.string().trim().min(1).max(2_048),
  gpuWorkerRoles: z.tuple([
    z.literal('roles/storage.objectCreator'),
    z.literal('roles/storage.objectViewer'),
  ]),
  apiServiceRoles: z.tuple([
    z.literal('roles/storage.objectCreator'),
    z.literal('roles/storage.objectViewer'),
  ]),
  publicPrincipalBindingPresent: z.literal(false),
  cloudRunJobIamBindingCount: z.literal(0),
}).strict()
const deploymentEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_VERSION,
  ),
  observerVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_OBSERVER_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_deployment_observer',
  ),
  evidenceClass: z.literal('canonical_private_google_cloud_api_reread'),
  imageQualificationRef: evidenceRefSchema,
  serviceIdentity: serviceIdentityEvidenceSchema,
  immutableImage: imageEvidenceSchema,
  cloudRunJob: jobEvidenceSchema,
  cloudRunExecutionSet: executionEvidenceSchema,
  privateNetwork: networkEvidenceSchema,
  privateSubnet: subnetEvidenceSchema,
  privateRouteSet: routeEvidenceSchema,
  privateRouterSet: routerEvidenceSchema,
  privateBucket: bucketEvidenceSchema,
  iam: iamEvidenceSchema,
  observedAt: timestamp,
  allReadsUsedFixedServerOwnedResources: z.literal(true),
  cloudRunJobExecutionStarted: z.literal(false),
  modelOrProviderExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryOrProductionAuthorityGranted: z.literal(false),
}).strict()
const deploymentEvidenceSchema = deploymentEvidenceWithoutHashSchema.extend({
  deploymentEvidenceHash: rawSha256,
}).strict()
export type CanonicalTrackAllSam31L4TaskQaDeploymentEvidence = z.infer<
  typeof deploymentEvidenceSchema
>

export interface CanonicalTrackAllSam31L4TaskQaDeploymentReadTransport {
  request(input: {
    readonly method: 'GET'
    readonly url: string
  }): Promise<{ readonly status: number; readonly json: unknown }>
}

export interface CanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly evidence: CanonicalTrackAllSam31L4TaskQaDeploymentEvidence
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly evidenceRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaDeploymentEvidence | null>
}

export function createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly timeoutMilliseconds?: number
  } = {},
): CanonicalTrackAllSam31L4TaskQaDeploymentReadTransport {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_SCOPE] })
  const timeout = input.timeoutMilliseconds ?? 20_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error('track_all_l4_deployment_read_timeout_invalid')
  }
  return Object.freeze({
    async request(request: { readonly method: 'GET'; readonly url: string }) {
      if (request.method !== 'GET' || !ALLOWED_URLS.has(request.url)) {
        throw new Error('track_all_l4_deployment_read_url_not_allowlisted')
      }
      const response = await auth.request<unknown>({
        url: request.url,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        validateStatus: () => true,
      })
      return { status: response.status, json: structuredClone(response.data) }
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository {
  if (!input.objectPort || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('track_all_l4_deployment_evidence_store_unavailable')
  }
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_REPOSITORY_VERSION,
    async persistCreateOnly({ evidence }) {
      const exact = assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(
        evidence,
      )
      const body = serialize(exact)
      const result = await input.objectPort.createOnly({
        objectPath: evidencePath(prefix, deploymentEvidenceRef(exact)),
        body,
        contentSha256: bytesHash(body),
      })
      const reread = await input.objectPort.readExact(
        evidencePath(prefix, deploymentEvidenceRef(exact)),
      )
      if (!reread || !Buffer.isBuffer(reread) || !reread.equals(body)) {
        throw new Error('track_all_l4_deployment_evidence_reread_changed')
      }
      return result === 'created' ? 'created' : 'identical_replay'
    },
    async reread({ evidenceRef }) {
      const ref = evidenceRefSchema.parse(evidenceRef)
      const bytes = await input.objectPort.readExact(evidencePath(prefix, ref))
      if (!bytes) return null
      if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
        || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error('track_all_l4_deployment_evidence_bytes_invalid')
      }
      let decoded: unknown
      try {
        decoded = JSON.parse(bytes.toString('utf8')) as unknown
      } catch {
        throw new Error('track_all_l4_deployment_evidence_json_invalid')
      }
      const evidence = assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(
        decoded,
      )
      if (!sameRef(ref, deploymentEvidenceRef(evidence))
        || stableAuthorityStringify(evidence) !== bytes.toString('utf8')) {
        throw new Error('track_all_l4_deployment_evidence_ref_changed')
      }
      return evidence
    },
  })
}

/** Read-only shape audit for the fixed live deployment. No object is written. */
export async function readCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(
  input: {
    readonly imageQualificationRef: z.input<typeof evidenceRefSchema>
    readonly transport: CanonicalTrackAllSam31L4TaskQaDeploymentReadTransport
    readonly observedAt?: string
  },
): Promise<CanonicalTrackAllSam31L4TaskQaDeploymentEvidence> {
  const imageRef = evidenceRefSchema.parse(input.imageQualificationRef)
  const observedAt = timestamp.parse(
    input.observedAt ?? new Date().toISOString(),
  )
  const responses = await Promise.all([
    RUN_JOB_URL,
    RUN_EXECUTIONS_URL,
    RUN_JOB_IAM_URL,
    BUCKET_URL,
    BUCKET_IAM_URL,
    SERVICE_ACCOUNT_URL,
    IMAGE_URL,
    NETWORK_URL,
    SUBNET_URL,
    ROUTES_URL,
    ROUTERS_URL,
  ].map(async (url) => {
    const response = await input.transport.request({ method: 'GET', url })
    if (response.status !== 200) {
      throw new Error('track_all_l4_deployment_google_read_failed')
    }
    assertPlainSerializedData(response.json, 'track_all_l4_cloud_read')
    return response.json
  }))
  const [jobValue, executionsValue, jobIamValue, bucketValue, bucketIamValue,
    serviceValue, imageValue, networkValue, subnetValue, routesValue,
    routersValue] = responses
  const serviceIdentity = normalizeServiceIdentity(serviceValue)
  const immutableImage = normalizeImage(imageValue)
  const cloudRunExecutionSet = normalizeExecutions(executionsValue)
  const payload = deploymentEvidenceWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_EVIDENCE_VERSION,
    observerVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_DEPLOYMENT_OBSERVER_VERSION,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_deployment_observer',
    evidenceClass: 'canonical_private_google_cloud_api_reread',
    imageQualificationRef: imageRef,
    serviceIdentity,
    immutableImage,
    cloudRunJob: normalizeJob(jobValue, cloudRunExecutionSet),
    cloudRunExecutionSet,
    privateNetwork: normalizeNetwork(networkValue),
    privateSubnet: normalizeSubnet(subnetValue),
    privateRouteSet: normalizeRoutes(routesValue),
    privateRouterSet: normalizeRouters(routersValue),
    privateBucket: normalizeBucket(bucketValue),
    iam: normalizeIam(bucketIamValue, jobIamValue),
    observedAt,
    allReadsUsedFixedServerOwnedResources: true,
    cloudRunJobExecutionStarted: false,
    modelOrProviderExecuted: false,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    publicDeliveryOrProductionAuthorityGranted: false,
  })
  return Object.freeze(deploymentEvidenceSchema.parse({
    ...payload,
    deploymentEvidenceHash: sha256AuthorityValue(payload),
  }))
}

/**
 * Exact read-only deployment observer. It cannot deploy or run the Cloud Run
 * job. It turns only allowlisted Google Cloud API reads into a create-only,
 * hash-bound deployment record that the separate release publisher may use.
 */
export async function observeCanonicalTrackAllSam31L4TaskQaDeployment(input: {
  readonly imageQualificationRef: z.input<typeof evidenceRefSchema>
  readonly imageQualificationReadPort: Pick<
    CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
    'rereadImageQualification'
  >
  readonly transport: CanonicalTrackAllSam31L4TaskQaDeploymentReadTransport
  readonly deploymentEvidenceRepository:
    CanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository
  readonly releaseEvidenceRepository:
    CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository
  readonly now?: () => string
}): Promise<{
  readonly evidenceRef: z.infer<typeof evidenceRefSchema>
  readonly deploymentObservationRef: z.infer<typeof evidenceRefSchema>
  readonly runtimeReleaseRef: z.infer<typeof evidenceRefSchema>
  readonly disposition: 'created' | 'identical_replay'
  readonly gpuJobStarted: false
  readonly runtimeReleaseGranted: false
}> {
  const imageRef = evidenceRefSchema.parse(input.imageQualificationRef)
  const image = assertCanonicalTrackAllSam31L4TaskQaImageQualification(
    await input.imageQualificationReadPort.rereadImageQualification({
      imageQualificationRef: imageRef,
    }),
  )
  if (!sameRef(imageRef,
    canonicalTrackAllSam31L4TaskQaImageQualificationRef(image))
    || image.operationId !== OPERATION_ID
    || image.routeId !== ROUTE_ID
    || image.immutableImageUri !== IMAGE_URI
    || image.immutableImageDigest !== IMAGE_DIGEST) {
    throw new Error('track_all_l4_deployment_image_qualification_changed')
  }
  const observedAt = timestamp.parse(
    (input.now ?? (() => new Date().toISOString()))(),
  )
  if (Date.parse(observedAt) < Date.parse(image.qualifiedAt)
    || Date.parse(observedAt) >= Date.parse(image.expiresAt)) {
    throw new Error('track_all_l4_deployment_image_qualification_stale')
  }
  const evidence = await readCanonicalTrackAllSam31L4TaskQaDeploymentEvidence({
    imageQualificationRef: imageRef,
    transport: input.transport,
    observedAt,
  })
  const evidenceDisposition = await input.deploymentEvidenceRepository
    .persistCreateOnly({ evidence })
  const evidenceRef = deploymentEvidenceRef(evidence)
  const rereadEvidence = await input.deploymentEvidenceRepository.reread({
    evidenceRef,
  })
  if (!rereadEvidence || !sameRef(evidenceRef,
    deploymentEvidenceRef(rereadEvidence))) {
    throw new Error('track_all_l4_deployment_evidence_exact_reread_failed')
  }

  const refs = deploymentComponentRefs(evidence)
  const transportIdentity = {
    evidenceRef,
    cloudRunJobRef: refs.cloudRunJobObservationRef,
    privateBucketRef: refs.privateBucketMetadataObservationRef,
    serviceIdentityRef: refs.serviceIdentityObservationRef,
  }
  const transportRef = ref(
    'track-all-l4-task-qa-private-object-transport',
    transportIdentity,
  )
  const privateObjectTransportPayload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-private-object-transport-v2' as const,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_private_transport_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    transportRef,
    serviceIdentityRef: refs.serviceIdentityObservationRef,
    routeId: ROUTE_ID,
    projectId: PROJECT_ID,
    privateBucketName: BUCKET,
    bucketSecurityPolicyRef: ref(
      'track-all-l4-task-qa-private-bucket-security-policy',
      { bucket: evidence.privateBucket, iam: evidence.iam },
    ),
    bucketEncryptionMode: 'google_managed_encryption' as const,
    uniformBucketLevelAccessEnabled: true as const,
    publicAccessPreventionEnforced: true as const,
    invocationRootMountPath: '/mnt/reeditpro' as const,
    invocationObjectPrefix:
      'private/canonical-professional-gpu/sam3_1/v1/invocations' as const,
    sam31ManifestObjectName: 'output/mask-manifest.json' as const,
    sam31MaskObjectPattern:
      'output/frame-{frameIndex:06}-object-{objectId:06}.png' as const,
    l4TaskObjectName: 'task-qa/task.json' as const,
    l4ResponseObjectName: 'task-qa/response.json' as const,
    gcsFuseVolumeName: VOLUME_NAME,
    gcsFuseMountOptions: MOUNT_OPTIONS,
    cloudRunJobResource: JOB_RESOURCE,
    cloudRunJobConfigurationRef: refs.cloudRunJobObservationRef,
    l4CloudRunMountPreconfiguredAndReread: true as const,
    separateSam31ReadRootAndL4TaskQaWriteRoot: true as const,
    exactSam31ManifestAndEveryMaskRereadRequired: true as const,
    l4TaskGenerationOneRereadBeforeLaunch: true as const,
    l4ResponseGenerationOneRequired: true as const,
    callerPathUrlObjectNameCommandOrEnvironmentAllowed: false as const,
    runtimeModelOrMediaDownloadAllowed: false as const,
    publicNetworkEgressAllowed: false as const,
    observedAt,
  }
  const privateObjectTransport =
    assertCanonicalTrackAllSam31L4TaskQaPrivateObjectTransport({
      ...privateObjectTransportPayload,
      configurationHash: sha256AuthorityValue(privateObjectTransportPayload),
    })
  const fixedTaskRef = canonicalTrackAllSam31L4TaskQaFixedTaskContractRef()
  const runtimeReleaseRef = ref('track-all-l4-task-qa-runtime-release', {
    imageQualificationRef: imageRef,
    evidenceRef,
    fixedTaskRef,
    transportRef,
  })
  const releasePayload = {
    schemaVersion: 'canonical-professional-google-cloud-gpu-release-v2' as const,
    source:
      'canonical_server_professional_google_cloud_gpu_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseRef: runtimeReleaseRef,
    fixedServerTaskContractRef: fixedTaskRef,
    serviceIdentityRef: refs.serviceIdentityObservationRef,
    privateNetworkAndArtifactTransportRef: transportRef,
    toolId: 'kornia',
    operationId: OPERATION_ID,
    routeId: ROUTE_ID,
    projectId: PROJECT_ID,
    runtimeRegion: REGION,
    serviceAccountEmail: GPU_WORKER_EMAIL,
    immutableImageUri: IMAGE_URI,
    immutableImageRef: image.immutableImageRef,
    immutableImageDigest: IMAGE_DIGEST,
    maximumExecutionSeconds: 3_600,
    taskCount: 1 as const,
    taskParallelism: 1 as const,
    maximumTaskRetries: 0 as const,
    invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID' as const,
    acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS' as const,
    privateExecutionEnvelopeRereadRequired: true as const,
    runtimeDownloadAllowed: false as const,
    callerCommandImageModelPathUrlOrEnvironmentAccepted: false as const,
    externalIpAllowed: false as const,
    privateNetworkOnly: true as const,
    minimumIdleInstances: 0 as const,
    prewarmingOrKeepaliveAllowed: false as const,
    oneConsumedAdmissionCreatesAtMostOneJob: true as const,
    retryAfterUnknownCreateOutcomeAllowed: false as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    cloudRunJobResource: JOB_RESOURCE,
    configuredMinimumInstances: 0 as const,
    configuredMaximumInstances: 1,
    configuredGpuType: 'nvidia-l4' as const,
    configuredGpuCount: 1 as const,
    gpuZonalRedundancyDisabled: true as const,
  }
  const release = assertCanonicalProfessionalGoogleCloudGpuRelease({
    ...releasePayload,
    configurationHash: sha256AuthorityValue(releasePayload),
  })
  const observation = createCanonicalTrackAllSam31L4TaskQaDeploymentObservation({
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-deployment-observation-v2',
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_deployment_observer',
    evidenceClass: 'canonical_private_google_cloud_api_reread',
    observationId:
      `track-all-l4-task-qa-deployment-${evidence.deploymentEvidenceHash.slice(0, 32)}`,
    observationVersion: 1,
    imageQualificationRef: imageRef,
    release,
    privateObjectTransport,
    ...refs,
    observedAt,
    exactProjectRegionImageServiceTaskJobGpuAndScaleZeroReread: true,
    exactSeparateSamReadAndL4TaskQaWriteRootReread: true,
    exactPrivateNetworkSubnetNoNatAndZeroActiveExecutionReread: true,
    exactPrivateBucketEncryptionUniformAccessPublicPreventionAndIamReread:
      true,
    callerImageCommandBucketPathObjectNameOrCloudResourceAccepted: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    publicDeliveryOrProductionAuthorityGranted: false,
  })
  const observationDisposition = await input.releaseEvidenceRepository
    .persistDeploymentObservationCreateOnly({ observation })
  const deploymentObservationRef = ref(
    observation.observationId,
    `sha256:${observation.observationHash}`,
  )
  const rereadObservation = await input.releaseEvidenceRepository
    .rereadDeploymentObservation({ runtimeReleaseRef })
  if (!rereadObservation || stableAuthorityStringify(rereadObservation)
    !== stableAuthorityStringify(observation)) {
    throw new Error('track_all_l4_deployment_observation_exact_reread_failed')
  }
  if (evidenceDisposition !== observationDisposition) {
    throw new Error('track_all_l4_deployment_evidence_disposition_changed')
  }
  return Object.freeze({
    evidenceRef,
    deploymentObservationRef,
    runtimeReleaseRef,
    disposition: observationDisposition,
    gpuJobStarted: false,
    runtimeReleaseGranted: false,
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaDeploymentEvidence {
  assertPlainSerializedData(value, 'track_all_l4_deployment_evidence')
  const evidence = deploymentEvidenceSchema.parse(value)
  const { deploymentEvidenceHash, ...payload } = evidence
  if (deploymentEvidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('track_all_l4_deployment_evidence_hash_invalid')
  }
  return structuredClone(evidence)
}

export function deploymentEvidenceRef(
  evidence: CanonicalTrackAllSam31L4TaskQaDeploymentEvidence,
) {
  const exact = assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(
    evidence,
  )
  return ref(
    `track-all-l4-task-qa-deployment-evidence-${
      exact.deploymentEvidenceHash.slice(0, 32)
    }`,
    `sha256:${exact.deploymentEvidenceHash}`,
  )
}

function normalizeServiceIdentity(value: unknown) {
  const root = record(value)
  return serviceIdentityEvidenceSchema.parse({
    resourceName: root.name,
    projectId: root.projectId,
    email: root.email,
    uniqueId: root.uniqueId,
    disabled: root.disabled === true,
  })
}

function normalizeImage(value: unknown) {
  verifyCanonicalImageMetadata(value, IMAGE_URI, IMAGE_DIGEST, IMAGE_NAME)
  const root = record(value)
  return imageEvidenceSchema.parse({
    resourceName: root.name,
    uri: root.uri,
    digest: IMAGE_DIGEST,
    imageSizeBytes: root.imageSizeBytes,
    mediaType: root.mediaType,
    uploadTime: root.uploadTime,
  })
}

function normalizeExecutions(value: unknown) {
  const root = record(value)
  if (hasValue(root.nextPageToken)) {
    throw new Error('track_all_l4_execution_set_incomplete')
  }
  const executions = array(root.executions)
  const terminalNames: string[] = []
  for (const item of executions) {
    const execution = record(item)
    const name = String(execution.name ?? '')
    if (!name.startsWith(`${JOB_RESOURCE}/executions/`)
      || !timestamp.safeParse(execution.completionTime).success) {
      throw new Error('track_all_l4_active_or_crossed_execution_found')
    }
    const completed = array(execution.conditions).map(record).find(
      (condition) => condition.type === 'Completed',
    )
    if (!completed || !['CONDITION_SUCCEEDED', 'CONDITION_FAILED']
      .includes(String(completed.state ?? ''))) {
      throw new Error('track_all_l4_active_or_unknown_execution_found')
    }
    terminalNames.push(name)
  }
  return executionEvidenceSchema.parse({
    executionCount: executions.length,
    activeExecutionCount: 0,
    terminalExecutionNames: terminalNames,
  })
}

function normalizeJob(
  value: unknown,
  executions: z.infer<typeof executionEvidenceSchema>,
) {
  const root = record(value)
  const template = record(root.template)
  const task = record(template.template)
  const containers = array(task.containers)
  const volumes = array(task.volumes)
  if (containers.length !== 1 || volumes.length !== 1) {
    throw new Error('track_all_l4_job_container_or_volume_count_changed')
  }
  const container = record(containers[0])
  const resources = record(container.resources)
  const limits = record(resources.limits)
  const volume = record(volumes[0])
  const gcs = record(volume.gcs)
  const mounts = array(container.volumeMounts)
  const env = Object.fromEntries(array(container.env).map((item) => {
    const entry = record(item)
    return [String(entry.name ?? ''), String(entry.value ?? '')]
  }))
  const vpc = record(task.vpcAccess)
  const interfaces = array(vpc.networkInterfaces)
  const networkInterface = record(interfaces[0])
  const nodeSelector = record(task.nodeSelector)
  const terminal = record(root.terminalCondition)
  const latest = record(root.latestCreatedExecution)
  if (array(container.env).length !== Object.keys(env).length
    || mounts.length !== 1
    || !sameJson(root.labels, {
    app: 'weeditpro',
    operation: 'track-all-mask-qa',
    release: 'qualification-candidate',
    route: 'l4-standard-primary',
    scale: 'zero',
  }) || !sameJson(template.labels, {
    app: 'weeditpro',
    operation: 'track-all-mask-qa',
    release: 'qualification-candidate',
    route: 'l4-standard-primary',
    scale: 'zero',
  }) || !sameJson(env, {
    REEDITPRO_ENV: 'production',
    WORKER_GROUP: ROUTE_ID,
    WEEDITPRO_GPU_ACCELERATOR_CLASS: 'nvidia_l4',
  }) || array(container.command).length > 0 || array(container.args).length > 0
    || interfaces.length !== 1
    || !sameJson(networkInterface.tags, [NETWORK_TAG])
    || !sameJson(gcs.mountOptions, MOUNT_OPTIONS.split(','))
    || terminal.type !== 'Ready'
    || terminal.state !== 'CONDITION_SUCCEEDED'
    || String(root.observedGeneration ?? '') !== String(root.generation ?? '')
    || Number(root.executionCount) !== executions.executionCount
    || !executions.terminalExecutionNames.includes(String(latest.name ?? ''))
    || latest.completionStatus !== 'EXECUTION_SUCCEEDED') {
    throw new Error('track_all_l4_job_definition_changed')
  }
  return jobEvidenceSchema.parse({
    resourceName: root.name,
    uid: root.uid,
    generation: String(root.generation ?? ''),
    etag: root.etag,
    updateTime: root.updateTime,
    imageUri: container.image,
    taskCount: Number(template.taskCount),
    parallelism: Number(template.parallelism),
    maximumRetries: Number(task.maxRetries),
    timeoutSeconds: Number(String(task.timeout ?? '').replace(/s$/u, '')),
    cpu: String(limits.cpu ?? ''),
    memory: String(limits.memory ?? ''),
    gpuCount: String(limits['nvidia.com/gpu'] ?? ''),
    accelerator: nodeSelector.accelerator,
    serviceAccountEmail: task.serviceAccount,
    executionEnvironment: task.executionEnvironment,
    gpuZonalRedundancyDisabled: task.gpuZonalRedundancyDisabled,
    network: networkInterface.network,
    subnetwork: networkInterface.subnetwork,
    networkTag: array(networkInterface.tags)[0],
    vpcEgress: vpc.egress,
    bucketName: gcs.bucket,
    volumeName: volume.name,
    mountPath: record(mounts[0]).mountPath,
    mountOptions: MOUNT_OPTIONS,
    executionCount: executions.executionCount,
    latestExecutionName: latest.name,
    latestExecutionCompletionTime: latest.completionTime,
  })
}

function normalizeNetwork(value: unknown) {
  const root = record(value)
  const routing = record(root.routingConfig)
  if (!sameJson(root.subnetworks, [SUBNET_SELF_LINK])) {
    throw new Error('track_all_l4_network_subnet_set_changed')
  }
  return networkEvidenceSchema.parse({
    networkSelfLink: root.selfLink,
    networkId: String(root.id ?? ''),
    autoCreateSubnetworks: root.autoCreateSubnetworks,
    mtu: Number(root.mtu),
    routingMode: routing.routingMode,
  })
}

function normalizeSubnet(value: unknown) {
  const root = record(value)
  return subnetEvidenceSchema.parse({
    subnetSelfLink: root.selfLink,
    subnetId: String(root.id ?? ''),
    networkSelfLink: root.network,
    region: root.region,
    ipCidrRange: root.ipCidrRange,
    gatewayAddress: root.gatewayAddress,
    privateIpGoogleAccess: root.privateIpGoogleAccess,
    purpose: root.purpose,
    stackType: root.stackType,
  })
}

function normalizeRoutes(value: unknown) {
  const root = record(value)
  if (hasValue(root.nextPageToken)) {
    throw new Error('track_all_l4_route_set_incomplete')
  }
  const routes = array(root.items).map(record)
  const allowedKeys = new Set([
    'kind', 'id', 'creationTimestamp', 'name', 'description', 'network',
    'destRange', 'priority', 'selfLink', 'nextHopGateway', 'nextHopNetwork',
  ])
  if (routes.some((route) => Object.keys(route).some((key) =>
    !allowedKeys.has(key)))) {
    throw new Error('track_all_l4_route_set_contains_unapproved_next_hop')
  }
  const gateway = routes.filter((route) =>
    route.network === NETWORK_SELF_LINK
    && route.destRange === '0.0.0.0/0'
    && route.nextHopGateway ===
      `https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/global/gateways/default-internet-gateway`
    && Number(route.priority) === 1_000)
  const local = routes.filter((route) =>
    route.network === NETWORK_SELF_LINK
    && route.destRange === '10.42.0.0/24'
    && route.nextHopNetwork === NETWORK_SELF_LINK
    && Number(route.priority) === 0)
  return routeEvidenceSchema.parse({
    routeCount: routes.length,
    defaultInternetGatewayRoutePresent: gateway.length === 1,
    localSubnetRoutePresent: local.length === 1,
    callerManagedNatOrProxyRoutePresent:
      routes.length !== gateway.length + local.length,
  })
}

function normalizeRouters(value: unknown) {
  const root = record(value)
  if (hasValue(root.nextPageToken)) {
    throw new Error('track_all_l4_router_set_incomplete')
  }
  const routers = array(root.items)
  const natCount = routers.reduce((count, item) =>
    count + array(record(item).nats).length, 0)
  return routerEvidenceSchema.parse({
    routerCount: routers.length,
    cloudNatCount: natCount,
  })
}

function normalizeBucket(value: unknown) {
  const root = record(value)
  const iam = record(root.iamConfiguration)
  const uniform = record(iam.uniformBucketLevelAccess)
  const encryption = record(root.encryption)
  const softDelete = record(root.softDeletePolicy)
  if (!sameJson(root.labels, {
    app: 'weeditpro',
    env: 'production',
    scope: 'sam31',
  }) || Object.keys(encryption).length > 0) {
    throw new Error('track_all_l4_bucket_identity_or_encryption_changed')
  }
  return bucketEvidenceSchema.parse({
    name: root.name,
    location: root.location,
    storageClass: root.storageClass,
    generation: String(root.generation ?? ''),
    metageneration: String(root.metageneration ?? ''),
    encryptionMode: 'google_managed_encryption',
    uniformBucketLevelAccessEnabled: uniform.enabled,
    publicAccessPreventionEnforced:
      iam.publicAccessPrevention === 'enforced',
    softDeleteRetentionSeconds:
      Number(softDelete.retentionDurationSeconds),
  })
}

function normalizeIam(bucketValue: unknown, jobValue: unknown) {
  const bucket = record(bucketValue)
  const job = record(jobValue)
  const bindings = array(bucket.bindings).map(record)
  const publicPrincipalBindingPresent = bindings.some((binding) =>
    array(binding.members).some((member) =>
      member === 'allUsers' || member === 'allAuthenticatedUsers'))
  const rolesFor = (member: string) => bindings
    .filter((binding) => array(binding.members).includes(member))
    .map((binding) => String(binding.role ?? '')).sort(compareUtf16)
  return iamEvidenceSchema.parse({
    bucketPolicyEtag: bucket.etag,
    jobPolicyEtag: job.etag,
    gpuWorkerRoles: rolesFor(`serviceAccount:${GPU_WORKER_EMAIL}`),
    apiServiceRoles: rolesFor(`serviceAccount:${API_SERVICE_EMAIL}`),
    publicPrincipalBindingPresent,
    cloudRunJobIamBindingCount: array(job.bindings).length,
  })
}

function deploymentComponentRefs(
  evidence: CanonicalTrackAllSam31L4TaskQaDeploymentEvidence,
) {
  return {
    serviceIdentityObservationRef:
      ref('track-all-l4-service-identity-observation',
        evidence.serviceIdentity),
    immutableImageMetadataObservationRef:
      ref('track-all-l4-immutable-image-observation', evidence.immutableImage),
    cloudRunJobObservationRef:
      ref('track-all-l4-cloud-run-job-observation', evidence.cloudRunJob),
    cloudRunExecutionSetObservationRef:
      ref('track-all-l4-cloud-run-execution-set-observation',
        evidence.cloudRunExecutionSet),
    privateNetworkObservationRef:
      ref('track-all-l4-private-network-observation', evidence.privateNetwork),
    privateSubnetObservationRef:
      ref('track-all-l4-private-subnet-observation', evidence.privateSubnet),
    privateRouteSetObservationRef:
      ref('track-all-l4-private-route-set-observation', evidence.privateRouteSet),
    privateRouterSetObservationRef:
      ref('track-all-l4-private-router-set-observation', evidence.privateRouterSet),
    privateBucketMetadataObservationRef:
      ref('track-all-l4-private-bucket-observation', evidence.privateBucket),
    privateBucketIamPolicyObservationRef:
      ref('track-all-l4-private-bucket-iam-observation', evidence.iam),
    cloudRunJobIamPolicyObservationRef:
      ref('track-all-l4-cloud-run-job-iam-observation', evidence.iam),
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
}

function sameJson(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sameRef(left: unknown, right: unknown): boolean {
  try {
    return sameJson(evidenceRefSchema.parse(left), evidenceRefSchema.parse(right))
  } catch {
    return false
  }
}

function ref(id: string, value: unknown) {
  const contentHash = typeof value === 'string'
    && /^sha256:[a-f0-9]{64}$/u.test(value)
    ? value
    : `sha256:${sha256AuthorityValue(value)}`
  return evidenceRefSchema.parse({ id, version: 1, contentHash })
}

function normalizePrefix(value: string): string {
  const parsed = z.string().trim().min(1).max(512)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
    .refine((item) => !item.includes('..') && !item.includes('//')
      && !item.endsWith('/')).parse(value)
  return parsed
}

function evidencePath(
  prefix: string,
  evidenceRef: z.infer<typeof evidenceRefSchema>,
): string {
  return `${prefix}/${evidenceRef.contentHash.slice(7)}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_deployment_evidence_size_invalid')
  }
  return body
}

function bytesHash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
