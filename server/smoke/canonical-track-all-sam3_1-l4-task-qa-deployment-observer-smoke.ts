import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from '../services/canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence,
  createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository,
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport,
  observeCanonicalTrackAllSam31L4TaskQaDeployment,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-deployment-observer'
import {
  createCanonicalTrackAllSam31L4TaskQaImageQualification,
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
  publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const IMAGE_DIGEST =
  'sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71' as const
const IMAGE_URI =
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${IMAGE_DIGEST}` as const
const objects = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objects)
const releaseEvidenceRepository =
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
    objectPort,
    prefix: 'private/smoke/track-all/l4-task-qa/release-evidence',
  })
const deploymentEvidenceRepository =
  createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository({
    objectPort,
    prefix: 'private/smoke/track-all/l4-task-qa/deployment-evidence',
  })
const image = createCanonicalTrackAllSam31L4TaskQaImageQualification({
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-image-qualification-v1',
  source:
    'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
  evidenceClass: 'canonical_private_reread',
  qualificationId: 'track-all-l4-task-qa-image-qualification-live-observer',
  qualificationVersion: 1,
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  runtimeCandidateRef: ref('track-all-l4-runtime-candidate'),
  sourceRevision: sha1('source-revision'),
  sourceTreeHash: sha1('source-tree'),
  sourceWorktreeClean: true,
  immutableImageRef: {
    id: 'weeditpro-track-all-l4-task-qa-immutable-image',
    version: 1,
    contentHash: IMAGE_DIGEST,
  },
  immutableImageUri: IMAGE_URI,
  immutableImageDigest: IMAGE_DIGEST,
  baseImageRef: ref('track-all-l4-base-image'),
  privateBuildCapsuleManifestRef: ref('track-all-l4-build-capsule'),
  requirementsLockRef: ref('track-all-l4-requirements-lock'),
  opencvCudaBuildReceiptRef: ref('track-all-l4-opencv-cuda-build'),
  cudaForwardCompatibilityReceiptRef: ref('track-all-l4-cuda-forward'),
  sbomRef: ref('track-all-l4-sbom'),
  vulnerabilityScanRef: ref('track-all-l4-vulnerability-scan'),
  signatureVerificationRef: ref('track-all-l4-signature'),
  slsaProvenanceRef: ref('track-all-l4-slsa'),
  l4DriverCudaKorniaAndOpenCvQualificationRef:
    ref('track-all-l4-driver-qualification'),
  completeFrameAndSubjectQualityQualificationRef:
    ref('track-all-l4-quality-qualification'),
  scaleFromZeroAndTerminalStopQualificationRef:
    ref('track-all-l4-scale-zero-qualification'),
  accountEffectiveL4RateCompatibilityRef:
    ref('track-all-l4-current-account-rate'),
  observedTorchVersion: '2.10.0+cu128',
  observedCudaRuntimeVersion: '12.8',
  observedKorniaVersion: '0.8.3',
  observedOpenCvCudaBuild: true,
  criticalVulnerabilityCount: 0,
  highVulnerabilityCount: 0,
  unknownSeverityVulnerabilityCount: 0,
  exactImmutableImageSbomScanSignatureAndProvenanceReread: true,
  exactL4CudaRuntimeAndCompleteQualityEvidenceReread: true,
  runtimeDownloadAllowed: false,
  samCheckpointOrModelWeightsIncluded: false,
  cpuOnlySubstantiveMaskQaAllowed: false,
  gpuJobStartedByQualificationOwner: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  qualifiedAt: '2026-08-06T12:00:00.000Z',
  expiresAt: '2026-09-05T12:00:00.000Z',
})
const imageQualificationRef = {
  id: image.qualificationId,
  version: image.qualificationVersion,
  contentHash: `sha256:${image.qualificationHash}` as const,
}
assert.equal(await releaseEvidenceRepository.persistImageQualificationCreateOnly({
  qualification: image,
}), 'created')

const fixtures = liveFixtures()
let readCount = 0
const transport = {
  async request(input: { method: 'GET'; url: string }) {
    readCount += 1
    return { status: 200, json: fixtureForUrl(fixtures, input.url) }
  },
}
const observeInput = {
  imageQualificationRef,
  imageQualificationReadPort: releaseEvidenceRepository,
  transport,
  deploymentEvidenceRepository,
  releaseEvidenceRepository,
  now: () => '2026-08-06T12:05:00.000Z',
}
const observed = await observeCanonicalTrackAllSam31L4TaskQaDeployment(
  observeInput,
)
assert.equal(observed.disposition, 'created')
assert.equal(observed.gpuJobStarted, false)
assert.equal(observed.runtimeReleaseGranted, false)
assert.equal(readCount, 11)
const rereadEvidence = await deploymentEvidenceRepository.reread({
  evidenceRef: observed.evidenceRef,
})
assert(rereadEvidence)
assert.deepEqual(
  assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(rereadEvidence),
  rereadEvidence,
)
assert.equal(rereadEvidence.privateBucket.encryptionMode,
  'google_managed_encryption')
assert.equal(rereadEvidence.cloudRunExecutionSet.activeExecutionCount, 0)
assert.equal(rereadEvidence.privateRouterSet.cloudNatCount, 0)
assert.deepEqual(rereadEvidence.iam.gpuWorkerRoles, [
  'roles/storage.objectCreator',
  'roles/storage.objectViewer',
])

const replay = await observeCanonicalTrackAllSam31L4TaskQaDeployment(
  observeInput,
)
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.runtimeReleaseRef, observed.runtimeReleaseRef)

const runtimeConfigurationRepository =
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
    objectPort,
    prefix: 'private/smoke/track-all/l4-task-qa/runtime-configurations',
    expectedPrivateObjectBucketName:
      'reeditpro-production-reeditpro-masks',
  })
const releaseReceipt =
  await publishCanonicalTrackAllSam31L4TaskQaRuntimeRelease({
    imageQualificationRef,
    runtimeReleaseRef: observed.runtimeReleaseRef,
    evidenceRepository: releaseEvidenceRepository,
    runtimeConfigurationRepository,
    now: () => '2026-08-06T12:06:00.000Z',
  })
assert.equal(releaseReceipt.disposition, 'created')
assert.equal(releaseReceipt.gpuJobStarted, false)
assert.equal(releaseReceipt.billingWalletOrCreditAuthorityGranted, false)
assert.equal(releaseReceipt.publicDeliveryOrProductionAuthorityGranted, false)

await assert.rejects(
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport({
    auth: { async request() { return { status: 200, data: {} } as never } },
  }).request({ method: 'GET', url: 'https://example.com/unsafe' }),
  /not_allowlisted/u,
)
await rejectMutation('active execution', (copy) => {
  Reflect.deleteProperty(copy.executions.executions[0], 'completionTime')
}, /active_or_crossed_execution|active_or_unknown_execution/u)
await rejectMutation('wrong GPU', (copy) => {
  copy.job.template.template.nodeSelector.accelerator = 'cpu'
}, /job_definition_changed|nvidia-l4/u)
await rejectMutation('caller command', (copy) => {
  copy.job.template.template.containers[0].command = ['/bin/sh']
}, /job_definition_changed/u)
await rejectMutation('wrong mount', (copy) => {
  copy.job.template.template.volumes[0].gcs.mountOptions = ['implicit-dirs']
}, /job_definition_changed/u)
await rejectMutation('public bucket principal', (copy) => {
  copy.bucketIam.bindings.push({
    role: 'roles/storage.objectViewer', members: ['allUsers'],
  })
}, /expected false/u)
await rejectMutation('Cloud NAT', (copy) => {
  copy.routers.items = [{ name: 'public-nat-router', nats: [{}] }]
}, /expected 0/u)
await rejectMutation('customer-managed encryption relabel', (copy) => {
  copy.bucket.encryption = { defaultKmsKeyName: 'projects/x/keys/y' }
}, /encryption_changed/u)
await rejectMutation('crossed image', (copy) => {
  copy.image.uri = copy.image.uri.replace('reeditpro-track-all-l4-task-qa',
    'crossed-image')
}, /image supply-chain evidence failed exact validation/u)
await rejectMutation('extra environment', (copy) => {
  copy.job.template.template.containers[0].env.push({
    name: 'CALLER_COMMAND', value: 'unsafe',
  })
}, /job_definition_changed/u)
await assert.rejects(
  observeCanonicalTrackAllSam31L4TaskQaDeployment({
    ...observeInput,
    now: () => '2026-10-06T12:05:00.000Z',
  }),
  /stale/u,
)
const tamperedEvidence = structuredClone(rereadEvidence)
tamperedEvidence.cloudRunJob.maximumRetries = 1 as never
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaDeploymentEvidence(tamperedEvidence),
)

const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url), 'utf8',
)) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:track-all-sam3_1-l4-task-qa-deployment-observer'
  ],
  'tsx server/smoke/canonical-track-all-sam3_1-l4-task-qa-deployment-observer-smoke.ts',
)
const cliSource = readFileSync(new URL(
  '../cli/observe-track-all-sam3_1-l4-task-qa-deployment.ts',
  import.meta.url,
), 'utf8')
assert.match(cliSource,
  /createCanonicalTrackAllSam31L4TaskQaGoogleCloudDeploymentReadTransport/u)
assert.match(cliSource,
  /createCanonicalTrackAllSam31L4TaskQaDeploymentEvidenceRepository/u)
assert.doesNotMatch(cliSource,
  /WEEDITPRO_TRACK_ALL_L4_(?:JOB|IMAGE_URI|IMAGE_DIGEST|BUCKET|NETWORK|COMMAND)/u)
assert.equal(
  packageJson.scripts?.[
    'observe:track-all-sam3_1-l4-task-qa-deployment'
  ],
  'tsx server/cli/observe-track-all-sam3_1-l4-task-qa-deployment.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-deployment-observer',
  checks: 54,
  fixedServerOwnedGoogleCloudReadCount: 11,
  exactImmutableImageAndNonRootGcsFuseMountReread: true,
  googleManagedEncryptionTruthfullyRecorded: true,
  uniformBucketAccessAndPublicPreventionReread: true,
  exactWorkerAndApiCreateOnlyViewerRolesReread: true,
  zeroCloudNatAndZeroActiveExecutionsReread: true,
  currentRuntimeReleasePublishedFromExactObservation: true,
  unsafeUrlCommandMountGpuIamNatImageAndStalenessRejected: true,
  gpuJobStartedByObserver: false,
  providerOrModelExecuted: false,
  customerCreditsMutated: false,
  publicOrProductionAuthorityGranted: false,
}, null, 2))

async function rejectMutation(
  _name: string,
  mutate: (copy: ReturnType<typeof liveFixtures>) => void,
  pattern: RegExp,
) {
  const copy = liveFixtures()
  mutate(copy)
  await assert.rejects(
    observeCanonicalTrackAllSam31L4TaskQaDeployment({
      ...observeInput,
      transport: {
        async request(input: { method: 'GET'; url: string }) {
          return { status: 200, json: fixtureForUrl(copy, input.url) }
        },
      },
    }),
    pattern,
  )
}

function fixtureForUrl(fixtures: ReturnType<typeof liveFixtures>, url: string) {
  if (url.includes('/executions?')) return structuredClone(fixtures.executions)
  if (url.endsWith(':getIamPolicy')) return structuredClone(fixtures.jobIam)
  if (url.includes('run.googleapis.com')) return structuredClone(fixtures.job)
  if (url.endsWith('/iam')) return structuredClone(fixtures.bucketIam)
  if (url.includes('storage.googleapis.com')) return structuredClone(fixtures.bucket)
  if (url.includes('iam.googleapis.com')) return structuredClone(fixtures.service)
  if (url.includes('artifactregistry.googleapis.com')) {
    return structuredClone(fixtures.image)
  }
  if (url.includes('/global/routes?')) return structuredClone(fixtures.routes)
  if (url.includes('/routers?')) return structuredClone(fixtures.routers)
  if (url.includes('/subnetworks/')) return structuredClone(fixtures.subnet)
  if (url.includes('/networks/')) return structuredClone(fixtures.network)
  throw new Error(`unexpected fixture URL ${url}`)
}

function liveFixtures() {
  const jobResource =
    'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4'
  const network =
    'https://www.googleapis.com/compute/v1/projects/reeditpro/global/networks/weeditpro-gpu-private'
  const subnet =
    'https://www.googleapis.com/compute/v1/projects/reeditpro/regions/us-central1/subnetworks/weeditpro-gpu-private-us-central1'
  const executionName = `${jobResource}/executions/qualification-success`
  return {
    job: {
      name: jobResource,
      uid: '6cde9050-a555-406f-8c8c-a6123d0ddc88',
      generation: '6',
      labels: jobLabels(),
      updateTime: '2026-08-06T11:05:47.150265Z',
      template: {
        labels: jobLabels(),
        taskCount: 1,
        parallelism: 1,
        template: {
          containers: [{
            image: IMAGE_URI,
            env: [
              { name: 'REEDITPRO_ENV', value: 'production' },
              { name: 'WORKER_GROUP', value: 'l4_standard_primary' },
              { name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS', value: 'nvidia_l4' },
            ],
            resources: { limits: {
              cpu: '8', memory: '32Gi', 'nvidia.com/gpu': '1',
            } },
            volumeMounts: [{
              name: 'reeditpro-private-gpu-objects',
              mountPath: '/mnt/reeditpro',
            }],
          }],
          volumes: [{
            name: 'reeditpro-private-gpu-objects',
            gcs: {
              bucket: 'reeditpro-production-reeditpro-masks',
              mountOptions: [
                'uid=65532', 'gid=65532', 'implicit-dirs=true',
              ],
            },
          }],
          maxRetries: 0,
          timeout: '3600s',
          serviceAccount:
            'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
          executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
          vpcAccess: {
            egress: 'ALL_TRAFFIC',
            networkInterfaces: [{
              network: 'weeditpro-gpu-private',
              subnetwork: 'weeditpro-gpu-private-us-central1',
              tags: ['weeditpro-gpu-private-no-nat'],
            }],
          },
          nodeSelector: { accelerator: 'nvidia-l4' },
          gpuZonalRedundancyDisabled: true,
        },
      },
      observedGeneration: '6',
      terminalCondition: { type: 'Ready', state: 'CONDITION_SUCCEEDED' },
      executionCount: 1,
      latestCreatedExecution: {
        name: executionName,
        completionTime: '2026-08-06T11:08:48.003619Z',
        completionStatus: 'EXECUTION_SUCCEEDED',
      },
      etag: 'job-etag',
    },
    executions: {
      executions: [{
        name: executionName,
        completionTime: '2026-08-06T11:08:48.003619Z',
        succeededCount: 1,
        conditions: [{ type: 'Completed', state: 'CONDITION_SUCCEEDED' }],
      }],
    },
    jobIam: { etag: 'ACAB' },
    bucket: {
      name: 'reeditpro-production-reeditpro-masks',
      location: 'US-CENTRAL1',
      storageClass: 'STANDARD',
      generation: '1785942567851110891',
      metageneration: '6',
      labels: { app: 'weeditpro', env: 'production', scope: 'sam31' },
      iamConfiguration: {
        uniformBucketLevelAccess: { enabled: true },
        publicAccessPrevention: 'enforced',
      },
      softDeletePolicy: { retentionDurationSeconds: '604800' },
    },
    bucketIam: {
      etag: 'CAY=',
      bindings: [
        {
          role: 'roles/storage.objectCreator',
          members: [
            'serviceAccount:reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
            'serviceAccount:reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
          ],
        },
        {
          role: 'roles/storage.objectViewer',
          members: [
            'serviceAccount:reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
            'serviceAccount:reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
          ],
        },
      ],
    },
    service: {
      name: 'projects/reeditpro/serviceAccounts/reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
      projectId: 'reeditpro',
      uniqueId: '114873446949382335196',
      email: 'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    },
    image: {
      name: 'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/dockerImages/reeditpro-track-all-l4-task-qa@sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71',
      uri: IMAGE_URI,
      imageSizeBytes: '4866324281',
      uploadTime: '2026-08-06T10:56:19.045631Z',
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
    },
    network: {
      id: '6163137318126245925',
      name: 'weeditpro-gpu-private',
      autoCreateSubnetworks: false,
      mtu: 1460,
      routingConfig: { routingMode: 'REGIONAL' },
      subnetworks: [subnet],
      selfLink: network,
    },
    subnet: {
      id: '183167967228221441',
      name: 'weeditpro-gpu-private-us-central1',
      network,
      ipCidrRange: '10.42.0.0/24',
      gatewayAddress: '10.42.0.1',
      privateIpGoogleAccess: true,
      purpose: 'PRIVATE',
      stackType: 'IPV4_ONLY',
      region:
        'https://www.googleapis.com/compute/v1/projects/reeditpro/regions/us-central1',
      selfLink: subnet,
    },
    routes: {
      items: [
        {
          kind: 'compute#route', id: '1', name: 'default-internet',
          creationTimestamp: '2026-08-05T00:00:00.000Z',
          description: 'Default route to the Internet.',
          destRange: '0.0.0.0/0', network, priority: 1000,
          selfLink: `${network}/routes/default-internet`,
          nextHopGateway:
            'https://www.googleapis.com/compute/v1/projects/reeditpro/global/gateways/default-internet-gateway',
        },
        {
          kind: 'compute#route', id: '2', name: 'default-local',
          creationTimestamp: '2026-08-05T00:00:00.000Z',
          description: 'Default local route.',
          destRange: '10.42.0.0/24', network, priority: 0,
          selfLink: `${network}/routes/default-local`,
          nextHopNetwork: network,
        },
      ],
    },
    routers: {},
  }
}

function jobLabels() {
  return {
    app: 'weeditpro',
    operation: 'track-all-mask-qa',
    release: 'qualification-candidate',
    route: 'l4-standard-primary',
    scale: 'zero',
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue({ id })}` as const,
  }
}

function sha1(value: string): string {
  return createHash('sha1').update(value).digest('hex')
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
