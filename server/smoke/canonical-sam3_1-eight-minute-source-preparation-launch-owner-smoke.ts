import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31EightMinuteSourcePreparationAdmission,
  createCanonicalSam31EightMinuteSourcePreparationConsumption,
  createCanonicalSam31EightMinuteSourcePreparationQualification,
  createCanonicalSam31EightMinuteSourcePreparationRelease,
  getCanonicalSam31EightMinuteSourcePreparationQualificationRef,
  getCanonicalSam31EightMinuteSourcePreparationReleaseRef,
  type CanonicalSam31EightMinuteSourcePreparationAdmission,
  type CanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  type CanonicalSam31EightMinuteSourcePreparationConsumption,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner,
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository,
  createGoogleCloudRunSam31EightMinuteSourcePreparationPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-launch-owner'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const now = '2026-08-13T16:05:00.000Z'
const qualification = createQualification()
const release = createCanonicalSam31EightMinuteSourcePreparationRelease({
  releaseId: 'sam31-eight-minute-source-prep-release-v1',
  qualification,
  releasedAt: '2026-08-13T15:45:00.000Z',
  expiresAt: '2026-08-14T15:45:00.000Z',
})
const admissions = new Map<string,
CanonicalSam31EightMinuteSourcePreparationAdmission>()
const consumptions = new Map<string,
CanonicalSam31EightMinuteSourcePreparationConsumption>()

const acceptedId = 'sam31-source-prep-launch-accepted-1'
const unknownId = 'sam31-source-prep-launch-unknown-1'
const strandedId = 'sam31-source-prep-launch-stranded-1'
for (const id of [acceptedId, unknownId, strandedId]) {
  admissions.set(id, createAdmission(id))
}
const strandedAdmission = admissions.get(strandedId)!
consumptions.set(strandedId,
  createCanonicalSam31EightMinuteSourcePreparationConsumption({
    admission: strandedAdmission,
    idempotencyKey: strandedAdmission.idempotencyKey,
    consumedAt: now,
  }))

const authorityRepository:
CanonicalSam31EightMinuteSourcePreparationAuthorityRepository = {
  schemaVersion:
    'canonical-sam3_1-eight-minute-source-preparation-authority-repository-v1',
  async persistQualificationCreateOnly() {
    return 'identical_replay' as const
  },
  async rereadQualification() {
    return structuredClone(qualification)
  },
  async persistReleaseCreateOnly() {
    return 'identical_replay' as const
  },
  async rereadRelease() {
    return structuredClone(release)
  },
  async persistAdmissionCreateOnly() {
    return 'identical_replay' as const
  },
  async rereadAdmission({ invocationId }: { invocationId: string }) {
    return structuredClone(admissions.get(invocationId) ?? null)
  },
  async rereadConsumption({ invocationId }: { invocationId: string }) {
    return structuredClone(consumptions.get(invocationId) ?? null)
  },
  async consumeAdmissionCreateOnly({ consumption }: {
    consumption: CanonicalSam31EightMinuteSourcePreparationConsumption
  }) {
    if (consumptions.has(consumption.invocationId)) {
      throw new Error('consumption already exists')
    }
    consumptions.set(consumption.invocationId, structuredClone(consumption))
    return 'created' as const
  },
  async rereadConsumedAdmission({ invocationId }: { invocationId: string }) {
    const admission = admissions.get(invocationId)
    const consumption = consumptions.get(invocationId)
    if (!admission || !consumption) return null
    return {
      admission: structuredClone(admission),
      consumption: structuredClone(consumption),
      release: structuredClone(release),
      qualification: structuredClone(qualification),
      exactCreateOnlyRecordsReread: true as const,
    }
  },
}

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(hashBuffer(input.body), input.contentSha256)
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.deepEqual(existing, input.body)
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(path) {
    const value = objects.get(path)
    return value ? Buffer.from(value) : null
  },
}
const launchRepository =
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-prep-launch',
  })

let acceptedDefinitionReads = 0
let acceptedCalls = 0
const acceptedPort =
  createGoogleCloudRunSam31EightMinuteSourcePreparationPort({
    now: () => now,
    auth: {
      async request(request) {
        const exact = request as {
          url?: string
          method?: string
          data?: {
            overrides?: {
              taskCount?: number
              timeout?: string
              containerOverrides?: Array<{
                env?: Array<{ name?: string; value?: string }>
              }>
            }
          }
          retry?: boolean
          maxRedirects?: number
        }
        if (exact.method === 'GET') {
          acceptedDefinitionReads += 1
          assert.equal(exact.url,
            'https://run.googleapis.com/v2/projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4')
          assert.equal(exact.retry, false)
          assert.equal(exact.maxRedirects, 0)
          return { data: createJobDefinition() } as never
        }
        acceptedCalls += 1
        assert.equal(exact.url,
          'https://run.googleapis.com/v2/projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4:run')
        assert.equal(exact.method, 'POST')
        assert.equal(exact.data?.overrides?.taskCount, 1)
        assert.equal(exact.data?.overrides?.timeout, '7200s')
        assert.deepEqual(
          exact.data?.overrides?.containerOverrides?.[0]?.env,
          [{
            name: 'WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID',
            value: acceptedId,
          }],
        )
        assert.equal(exact.retry, false)
        assert.equal(exact.maxRedirects, 0)
        return {
          data: {
            name:
              'projects/reeditpro/locations/us-central1/operations/operation-accepted-1',
          },
        } as never
      },
    },
  })
const acceptedOwner =
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner({
    authorityRepository,
    launchRepository,
    cloudRunPort: acceptedPort,
    now: () => now,
  })
assert.equal(acceptedOwner.maximumAttempts, 1)
assert.equal(acceptedOwner.automaticRetryAfterUnknownOutcomeAllowed, false)
assert.equal(acceptedOwner.customerCreditMutationAllowed, false)
const accepted = await acceptedOwner.startOneShot({ invocationId: acceptedId })
assert.equal(accepted.status, 'accepted')
assert.equal(acceptedDefinitionReads, 1)
assert.equal(acceptedCalls, 1)
if (accepted.status !== 'accepted') throw new Error('accepted result missing')
assert.equal(accepted.disposition, 'created')
assert.equal(accepted.workerOutcomeAtAcceptance, 'unknown')
assert.equal(accepted.costOutcomeAtAcceptance, 'unknown')
assert.equal(accepted.automaticRetryAllowed, false)
assert.equal(accepted.customerCreditsMutated, false)
assert.equal(accepted.productionAuthorityGranted, false)
const acceptedReplay = await acceptedOwner.startOneShot({
  invocationId: acceptedId,
})
assert.equal(acceptedReplay.status, 'accepted')
assert.equal(acceptedDefinitionReads, 1)
assert.equal(acceptedCalls, 1)
if (acceptedReplay.status !== 'accepted') throw new Error('replay missing')
assert.equal(acceptedReplay.disposition, 'identical_replay')

let unknownCalls = 0
const unknownRepository =
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-prep-launch-unknown',
  })
const unknownOwner =
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner({
    authorityRepository,
    launchRepository: unknownRepository,
    cloudRunPort:
      createGoogleCloudRunSam31EightMinuteSourcePreparationPort({
        now: () => now,
        auth: {
          async request(request) {
            const exact = request as { method?: string }
            if (exact.method === 'GET') {
              return { data: createJobDefinition() } as never
            }
            unknownCalls += 1
            throw new Error('simulated network ambiguity')
          },
        },
      }),
    now: () => now,
  })
const unknown = await unknownOwner.startOneShot({ invocationId: unknownId })
assert.equal(unknown.status, 'reconciliation_required')
assert.equal(unknownCalls, 1)
if (unknown.status !== 'reconciliation_required') {
  throw new Error('unknown result missing')
}
assert.equal(unknown.blockerCode,
  'sam31_source_preparation_cloud_outcome_unknown')
assert.equal(unknown.automaticRetryAllowed, false)
const unknownReplay = await unknownOwner.startOneShot({
  invocationId: unknownId,
})
assert.equal(unknownReplay.status, 'reconciliation_required')
assert.equal(unknownCalls, 1)

let strandedCalls = 0
const strandedRepository =
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
    objectPort,
    prefix: 'private/smoke/sam31-source-prep-launch-stranded',
  })
const strandedOwner =
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner({
    authorityRepository,
    launchRepository: strandedRepository,
    cloudRunPort: {
      schemaVersion:
        'canonical-sam3_1-eight-minute-source-preparation-cloud-run-port-v1',
      async runOnce() {
        strandedCalls += 1
        throw new Error('must not be called')
      },
    },
    now: () => now,
  })
const stranded = await strandedOwner.startOneShot({
  invocationId: strandedId,
})
assert.equal(stranded.status, 'reconciliation_required')
assert.equal(strandedCalls, 0)
if (stranded.status !== 'reconciliation_required') {
  throw new Error('stranded result missing')
}
assert.equal(stranded.blockerCode,
  'sam31_source_preparation_consumed_launch_not_observed')

const driftId = 'sam31-source-prep-launch-drift-1'
admissions.set(driftId, createAdmission(driftId))
let driftStartCalls = 0
const driftOwner =
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner({
    authorityRepository,
    launchRepository:
      createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
        objectPort,
        prefix: 'private/smoke/sam31-source-prep-launch-drift',
      }),
    cloudRunPort:
      createGoogleCloudRunSam31EightMinuteSourcePreparationPort({
        now: () => now,
        auth: {
          async request(request) {
            const exact = request as { method?: string }
            if (exact.method === 'POST') driftStartCalls += 1
            return { data: createJobDefinition('sha256:'.concat(
              'f'.repeat(64),
            )) } as never
          },
        },
      }),
    now: () => now,
  })
const drift = await driftOwner.startOneShot({ invocationId: driftId })
assert.equal(drift.status, 'not_ready')
assert.equal(driftStartCalls, 0)
if (drift.status !== 'not_ready') {
  throw new Error('drift result missing')
}
assert.equal(drift.blockerCode,
  'sam31_source_preparation_cloud_run_not_started')

const missing = await acceptedOwner.startOneShot({
  invocationId: 'sam31-source-prep-missing-admission',
})
assert.equal(missing.status, 'not_ready')
assert.equal(acceptedCalls, 1)
await assert.rejects(() => acceptedOwner.startOneShot({
  invocationId: acceptedId,
  image: 'caller-image',
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-launch-owner',
  checks: 50,
  exactCloudRunJobResource: release.cloudRunJobResource,
  exactLiveJobDefinitionRereadCount: acceptedDefinitionReads,
  acceptedCallCount: acceptedCalls,
  unknownOutcomeCallCount: unknownCalls,
  unknownOutcomeRetryAllowed: false,
  consumedWithoutLaunchRetryAllowed: false,
  driftedLiveJobStartCallCount: driftStartCalls,
  cloudRunReceivesOnlyInvocationIdentity: true,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function createQualification() {
  return createCanonicalSam31EightMinuteSourcePreparationQualification({
    qualificationId: 'sam31-source-prep-image-qualification-v1',
    projectId: 'reeditpro',
    region: 'us-central1',
    routeId: 'l4_standard_primary',
    routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    operationId: 'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1',
    cloudRunJobName: 'weeditpro-sam31-source-prep-l4',
    cloudRunJobResource:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4',
    immutableImageRef: ref('sam31-source-prep-image', hash('image')),
    immutableImageDigest: `sha256:${hash('image')}`,
    sourceCommitSha: 'a'.repeat(40),
    sourceTreeSha: 'b'.repeat(40),
    dockerfileSha256: hash('dockerfile'),
    fixedRunnerSha256: hash('runner'),
    fixedProcessPortSha256: hash('port'),
    fixedWorkerEntrypointSha256: hash('entrypoint'),
    imageBuildRef: ref('image-build', hash('image-build')),
    spdx23SbomRef: ref('sbom', hash('sbom')),
    vulnerabilityScanRef: ref('vulnerability', hash('vulnerability')),
    signatureVerificationRef: ref('signature', hash('signature')),
    slsaProvenanceRef: ref('slsa', hash('slsa')),
    fourKPreparationQualificationRunRef: ref('4k-run', hash('4k-run')),
    actualNvidiaL4Observed: true,
    exactlyOneL4Allocated: true,
    ffmpegCudaNvdecDecodeVerified: true,
    ffmpegNvencH264EncodeVerified: true,
    ffprobeMetadataOnlyVerified: true,
    exact3840x2160At24FpsPreserved: true,
    exact49ChunkFrameAccountingVerified: true,
    exactOneFrameOverlapVerified: true,
    sourceAudioRemovalVerified: true,
    immutableImageDigestRereadVerified: true,
    spdx23SbomRereadVerified: true,
    criticalHighOrUnknownVulnerabilitiesAbsent: true,
    kmsSignatureVerified: true,
    slsaProvenanceVerified: true,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    callerPathUrlBytesCommandModelOrEnvironmentAccepted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: '2026-08-13T15:30:00.000Z',
  })
}

function createJobDefinition(
  imageDigest = qualification.immutableImageDigest,
) {
  return {
    name:
      'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4',
    uid: 'sam31-source-prep-l4-job-uid',
    generation: '1',
    updateTime: '2026-08-13T15:50:00.000Z',
    labels: {
      app: 'weeditpro',
      operation: 'sam31-source-preparation',
      route: 'l4-standard-primary',
      scale: 'zero',
    },
    template: {
      parallelism: 1,
      taskCount: 1,
      template: {
        containers: [{
          image:
            `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-source-preparation-l4@${imageDigest}`,
          command: ['/usr/local/bin/node'],
          args: [
            '/app/dist-server/weeditpro-sam3_1-eight-minute-source-preparation-worker.js',
          ],
          env: [
            { name: 'REEDITPRO_ENV', value: 'production' },
            { name: 'WORKER_GROUP', value: 'l4_standard_primary' },
            {
              name: 'GCS_CONTROL_PLANE_STATE_BUCKET',
              value: 'reeditpro-production-reeditpro-control-plane-state',
            },
          ],
          resources: {
            limits: {
              cpu: '8',
              memory: '32Gi',
              'nvidia.com/gpu': '1',
            },
          },
          volumeMounts: [{
            name: 'weeditpro-sam31-source-prep-scratch',
            mountPath: '/mnt/weeditpro-private/l4-visual-evidence',
          }],
        }],
        volumes: [{
          name: 'weeditpro-sam31-source-prep-scratch',
          emptyDir: { medium: 'MEMORY', sizeLimit: '24Gi' },
        }],
        maxRetries: 0,
        timeout: '7200s',
        serviceAccount:
          'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
        nodeSelector: {
          'run.googleapis.com/accelerator': 'nvidia-l4',
        },
        gpuZonalRedundancyDisabled: true,
      },
    },
  }
}

function createAdmission(
  invocationId: string,
): CanonicalSam31EightMinuteSourcePreparationAdmission {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-eight-minute-source-preparation-admission-v1' as const,
    source:
      'canonical_server_sam3_1_eight_minute_source_preparation_admission_owner' as const,
    evidenceClass: 'canonical_private_exact_prerequisite_reread' as const,
    admissionId: invocationId,
    invocationId,
    idempotencyKey: `${invocationId}:idempotency`,
    triggerRef: ref(`${invocationId}:trigger`, hash(`${invocationId}:trigger`)),
    qualificationSourcePlanRef:
      ref('sam31-eight-minute-performance-source-v1', hash('plan')),
    exactEightMinuteSourceRef: ref('sam31-eight-minute-source', hash('source')),
    releaseRef: getCanonicalSam31EightMinuteSourcePreparationReleaseRef(
      release,
    ),
    qualificationRef:
      getCanonicalSam31EightMinuteSourcePreparationQualificationRef(
        qualification,
      ),
    immutableImageRef: qualification.immutableImageRef,
    currentAccountRateAuthorityRef: ref('current-rate', hash('rate')),
    platformEstimateRef: ref(`${invocationId}:estimate`, hash(`${invocationId}:estimate`)),
    maximumUsage: {
      coldStartMilliseconds: 600_000 as const,
      runtimeAndModelLoadMilliseconds: 60_000 as const,
      activeGpuMilliseconds: 6_480_000 as const,
      drainAndShutdownMilliseconds: 60_000 as const,
      totalBillableMilliseconds: 7_200_000 as const,
      allocatedGpuCount: 1 as const,
      allocatedVcpuCount: 8 as const,
      allocatedMemoryGiB: 32 as const,
      allocatedLocalScratchGiB: 0 as const,
      privateArtifactBytes: 107_374_182_400 as const,
      privateArtifactRetentionMilliseconds: 604_800_000 as const,
      networkEgressBytes: 0 as const,
      classAOperationCount: 2_000 as const,
      classBOperationCount: 2_000 as const,
    },
    maximumPlatformInternalCostUsdNanos: 3_319_306_667,
    maximumApprovedInternalBudgetUsdNanos: 20_000_000_000 as const,
    operationId:
      'tool.ffmpeg.prepare_sam3_1_qualification_source_chunks.v1' as const,
    routeId: 'l4_standard_primary' as const,
    routeProfileId:
      'quality_l4_user_triggered_standard_media_job_v1' as const,
    maximumAttempts: 1 as const,
    attemptOrdinal: 1 as const,
    createOnlyConsumptionRequiredBeforeCloudRunCall: true as const,
    uncertainOutcomeRetryAllowed: false as const,
    exactPlanReleaseQualificationImageRateAndBudgetReread: true as const,
    userTriggeredScaleFromZero: true as const,
    minimumIdleInstances: 0 as const,
    platformFundedPrivateQualification: true as const,
    customerCreditReservationRequired: false as const,
    customerCreditsMutated: false as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-13T16:00:00.000Z',
    expiresAt: '2026-08-13T16:10:00.000Z',
  }
  return assertCanonicalSam31EightMinuteSourcePreparationAdmission({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  }, now)
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string, value: string, version = 1) {
  return {
    id,
    version,
    contentHash: `sha256:${value}` as const,
  }
}
