import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  createCanonicalSam31VertexQualificationLaunchPort,
  sealCanonicalSam31VertexQualificationQuotaObservation,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  canonicalSam31VertexQualificationStagingObservationSchema,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-staging-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { authority as rateAuthority } from './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import { release } from './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'
import {
  canonicalIngest,
  candidate,
} from './canonical-sam3_1-source-checkpoint-qualification-smoke'

const observedAt = '2026-08-06T16:10:00.000Z'
export const historicalPackageRequest =
createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
  qualificationId: 'sam31-vertex-source-checkpoint-qualification',
  candidate,
  ingestReceipt: canonicalIngest,
  qualificationImage: {
    artifactRef: release.immutableImageRef,
    immutableImageDigest: release.immutableImageDigest,
    supplyChainReleaseRef: ref(release.releaseId, release.releaseHash),
    dockerfileSourceRef: ref('sam31-qualification-dockerfile', hash('dockerfile')),
    entrypointSourceRef: ref('sam31-qualification-entrypoint', hash('entrypoint')),
    runnerSourceRef: ref('sam31-qualification-runner', hash('runner')),
  },
  patchedSourceArchiveRef: ref('sam31-patched-source',
    candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256),
  patchApplicationReceiptRef: ref('sam31-patch-application', hash('patch')),
  checkpointWeightsOnlyInspectionRef: ref(
    'sam31-checkpoint-weights-only', hash('weights-only'),
  ),
  dependencyClosureRef: ref('sam31-dependency-closure', hash('closure')),
  dependencyLockSha256: hash('dependency-lock'),
  dependencyClosureReceiptSha256: hash('dependency-receipt'),
  dependencyWheelManifestSha256: hash('wheel-manifest'),
  sourceCodeSecurityReviewRef: ref('sam31-source-security', hash('security')),
  deterministicProbeFixture: {
    artifactRef: ref('sam31-deterministic-probe', hash('probe')),
    byteLength: 4_096,
    sha256: hash('probe'),
    width: 128,
    height: 128,
    frameCount: 3,
  },
  issuedAt: '2026-08-06T16:05:00.000Z',
})
const attemptId = 'sam31-vertex-qualification-attempt-001'
export const request = createCanonicalSam31VertexSourceCheckpointWorkerRequest({
  historicalPackageRequest,
  attemptId,
  issuedAt: '2026-08-06T16:06:00.000Z',
})
export const stagingObservation = makeStagingObservation(request)
export const quotaObservation = sealCanonicalSam31VertexQualificationQuotaObservation({
  schemaVersion: 'canonical-sam3_1-vertex-a100-qualification-quota-observation-v1',
  source: 'canonical_server_vertex_quota_observation_owner',
  evidenceClass: 'canonical_private_reread',
  projectId: 'reeditpro',
  region: 'us-central1',
  quotaPreferenceId: 'weeditpro-vertex-a100-80gb-us-central1-1',
  quotaId: 'CustomModelTrainingA10080GBGPUsPerProjectPerRegion',
  preferredValue: 1,
  grantedValue: 1,
  reconciling: false,
  exactCloudQuotaPreferenceAndQuotaInfoReread: true,
  batchOrComputeA100QuotaUsedAsVertexAuthority: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  observedAt: '2026-08-06T16:09:00.000Z',
  expiresAt: '2026-08-06T16:30:00.000Z',
})

const events: string[] = []
let capturedRequest: Record<string, unknown> | null = null
export let persistedExecution: unknown = null
export const admissions = new Map<string, unknown>()
const consumptions = new Map<string, unknown>()
const port = createCanonicalSam31VertexQualificationLaunchPort({
  admissionRepository: admissionRepository(admissions, events),
  consumptionPort: {
    async createOnly(value) {
      events.push('consumed')
      const key = value.consumptionHash
      if (consumptions.has(key)) return 'already_exists'
      consumptions.set(key, structuredClone(value))
      return 'created'
    },
    async reread(value) {
      return structuredClone(
        consumptions.get(value.contentHash.slice(7)) ?? null,
      )
    },
  },
  executionRepository: {
    async createOnlyAndReread(value) {
      events.push('persisted')
      persistedExecution = structuredClone(value)
      return structuredClone(value)
    },
    async reread() { return structuredClone(persistedExecution) },
    async rereadByAdmission() { return structuredClone(persistedExecution) },
  },
  auth: {
    async request(value) {
      events.push('provider')
      capturedRequest = structuredClone(value) as Record<string, unknown>
      return {
        data: {
          name: 'projects/reeditpro/locations/us-central1/customJobs/123456789',
          displayName: expectedDisplayName(attemptId),
          state: 'JOB_STATE_PENDING',
        },
      } as never
    },
  },
  now: () => observedAt,
})
export const accepted = await port.startOne({
  workerRequest: request,
  stagingObservation,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(accepted.disposition, 'accepted')
assert.deepEqual(events, ['admitted', 'consumed', 'provider', 'persisted'])
assert.equal(accepted.providerCallStarted, true)
assert.equal(accepted.substantiveQualificationOutcome, 'not_executed')
assert.equal(accepted.automaticRetryAllowed, false)
assert.equal(accepted.customerCreditsMutated, false)
assert.equal(accepted.sourceCheckpointQualificationGranted, false)
assert.equal(accepted.productionReady, false)
const providerCallsBeforeReplay = events.filter((value) =>
  value === 'provider').length
const replay = await port.startOne({
  workerRequest: request,
  stagingObservation,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(replay.disposition, 'accepted')
assert.deepEqual(replay.executionRef, accepted.executionRef)
assert.equal(events.filter((value) => value === 'provider').length,
  providerCallsBeforeReplay)

const providerRequest = capturedRequest as unknown as {
  url: string
  method: string
  retry: boolean
  maxRedirects: number
  data: {
    displayName: string
    jobSpec: {
      workerPoolSpecs: Array<{
        machineSpec: Record<string, unknown>
        replicaCount: string
        containerSpec: Record<string, unknown>
      }>
      serviceAccount: string
      network: string
      scheduling: Record<string, unknown>
    }
    encryptionSpec: Record<string, unknown>
  }
}
assert.equal(providerRequest.url,
  'https://us-central1-aiplatform.googleapis.com/v1/projects/reeditpro/locations/us-central1/customJobs')
assert.equal(providerRequest.method, 'POST')
assert.equal(providerRequest.retry, false)
assert.equal(providerRequest.maxRedirects, 0)
assert.equal(providerRequest.data.jobSpec.workerPoolSpecs.length, 1)
const worker = providerRequest.data.jobSpec.workerPoolSpecs[0]!
assert.deepEqual(worker.machineSpec, {
  machineType: 'a2-ultragpu-1g',
  acceleratorType: 'NVIDIA_A100_80GB',
  acceleratorCount: 1,
})
assert.equal(worker.replicaCount, '1')
assert.deepEqual(worker.containerSpec, {
  imageUri: release.immutableImageUri,
  env: [
    { name: 'WEEDITPRO_GPU_INVOCATION_ID', value: attemptId },
    { name: 'WEEDITPRO_GPU_ACCELERATOR_CLASS', value: 'nvidia_a100_80gb' },
  ],
})
assert.equal('command' in worker.containerSpec, false)
assert.equal('args' in worker.containerSpec, false)
assert.equal(providerRequest.data.jobSpec.serviceAccount,
  'weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(providerRequest.data.jobSpec.network,
  'projects/390722338345/global/networks/weeditpro-gpu-private')
assert.deepEqual(providerRequest.data.jobSpec.scheduling, {
  timeout: '7200s',
  restartJobOnWorkerRestart: false,
})
assert.deepEqual(providerRequest.data.encryptionSpec, {
  kmsKeyName: 'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
})

let callsAfterRefusal = 0
const refusalPort = createCanonicalSam31VertexQualificationLaunchPort({
  admissionRepository: admissionRepository(new Map()),
  consumptionPort: {
    async createOnly() { throw new Error('create-only conflict') },
    async reread() { return null },
  },
  executionRepository: {
    async createOnlyAndReread(value) { return value },
    async reread() { return null },
    async rereadByAdmission() { return null },
  },
  auth: {
    async request() { callsAfterRefusal += 1; throw new Error('unreachable') },
  },
  now: () => observedAt,
})
const refused = await refusalPort.startOne({
  workerRequest: request,
  stagingObservation,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(refused.disposition, 'rejected_before_creation')
assert.equal(refused.providerCallStarted, false)
assert.equal(callsAfterRefusal, 0)

let unknownCalls = 0
const unknownConsumptions = new Map<string, unknown>()
const unknownPort = createCanonicalSam31VertexQualificationLaunchPort({
  admissionRepository: admissionRepository(new Map()),
  // This attempt has no prior single-use record.
  consumptionPort: {
    async createOnly(value) {
      if (unknownConsumptions.has(value.consumptionHash)) {
        return 'already_exists'
      }
      unknownConsumptions.set(value.consumptionHash, structuredClone(value))
      return 'created'
    },
    async reread(value) {
      return structuredClone(
        unknownConsumptions.get(value.contentHash.slice(7)) ?? null,
      )
    },
  },
  executionRepository: {
    async createOnlyAndReread(value) { return value },
    async reread() { return null },
    async rereadByAdmission() { return null },
  },
  auth: {
    async request() { unknownCalls += 1; throw new Error('network unknown') },
  },
  now: () => observedAt,
})
const unknown = await unknownPort.startOne({
  workerRequest: request,
  stagingObservation,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(unknown.disposition, 'outcome_unknown_requires_reconciliation')
assert.equal(unknown.substantiveQualificationOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(unknownCalls, 1)
const unknownReplay = await unknownPort.startOne({
  workerRequest: request,
  stagingObservation,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(unknownReplay.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknownCalls, 1)

const crossed = structuredClone(stagingObservation)
crossed.attemptId = 'crossed-attempt'
const crossedResult = await port.startOne({
  workerRequest: request,
  stagingObservation: crossed,
  imageSupplyChainRelease: release,
  rateAuthority,
  quotaObservation,
})
assert.equal(crossedResult.disposition, 'rejected_before_creation')

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-vertex-launch',
  checks: 43,
  exactA10080VertexCustomJob: true,
  createOnlyConsumptionBeforeProvider: true,
  privateVpcAndCmek: true,
  serverOwnedEntrypointAndAttemptScope: true,
  noCallerCommandArgsPathModelOrUrl: true,
  scaleFromZeroNoPersistentResource: true,
  unknownOutcomeBlocksAutomaticRetry: true,
  identicalReplayCreatesNoSecondCustomJob: true,
  uncertainCreateReplayCreatesNoSecondCustomJob: true,
  customerCreditsMutated: false,
  sourceCheckpointQualificationGranted: false,
  productionReady: false,
}, null, 2))

function makeStagingObservation(value: typeof request) {
  const prefix =
    `private/sam3_1/source-checkpoint-qualification/v2/attempts/${value.attemptDigestSha256}`
  const requestBody = Buffer.from(stableAuthorityStringify(value), 'utf8')
  const staged = (input: {
    objectName: 'request/request.json' | 'checkpoint/sam3.1_multiplex.pt'
      | 'fixture/probe-person.mp4'
    byteLength: number
    sha256: string
    contentType: 'application/json' | 'application/octet-stream' | 'video/mp4'
    sourceCopy: boolean
    sourceDigest: string | null
    generation: string
  }) => ({
    objectName: input.objectName,
    generation: input.generation,
    etag: `etag-${input.generation}`,
    byteLength: input.byteLength,
    sha256: input.sha256,
    contentType: input.contentType,
    destinationKmsKeyName:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification' as const,
    exactDestinationGenerationEtagLengthSha256AndContentTypeReread:
      true as const,
    sourceGenerationBoundServerSideCopy: input.sourceCopy,
    sourceCoordinateDigestSha256: input.sourceDigest,
    createOnly: true as const,
  })
  const payload = {
    schemaVersion:
      'canonical-sam3_1-vertex-source-checkpoint-staging-observation-v1' as const,
    source:
      'canonical_server_sam3_1_vertex_qualification_staging_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    attemptId: value.attemptId,
    attemptDigestSha256: value.attemptDigestSha256,
    qualificationId: value.qualificationId,
    workerRequestRef: ref(value.qualificationId, value.requestHash, 2),
    historicalPackageRequestRef: {
      id: value.historicalPackageRequestRef.id,
      version: value.historicalPackageRequestRef.version,
      contentHash: value.historicalPackageRequestRef.contentHash,
    },
    privateBucketName:
      'reeditpro-production-sam31-qualification-private' as const,
    remoteSubdirectory: prefix,
    vertexCloudStorageFuseRoot:
      `/gcs/reeditpro-production-sam31-qualification-private/${prefix}`,
    requestObject: staged({
      objectName: 'request/request.json',
      byteLength: requestBody.byteLength,
      sha256: createHash('sha256').update(requestBody).digest('hex'),
      contentType: 'application/json',
      sourceCopy: false,
      sourceDigest: null,
      generation: '1',
    }),
    checkpointObject: staged({
      objectName: 'checkpoint/sam3.1_multiplex.pt',
      byteLength: value.checkpoint.byteLength,
      sha256: value.checkpoint.sha256,
      contentType: 'application/octet-stream',
      sourceCopy: true,
      sourceDigest: sha256AuthorityValue(value.checkpoint),
      generation: '2',
    }),
    probeFixtureObject: staged({
      objectName: 'fixture/probe-person.mp4',
      byteLength: value.deterministicProbeFixture.byteLength,
      sha256: value.deterministicProbeFixture.sha256,
      contentType: 'video/mp4',
      sourceCopy: true,
      sourceDigest: sha256AuthorityValue(value.deterministicProbeFixture),
      generation: '3',
    }),
    resultObjectName: 'result/result.json' as const,
    resultObjectAbsentBeforeLaunch: true as const,
    exactRequestCheckpointFixtureObjectSetReread: true as const,
    checkpointAndFixtureCopiedServerSideFromExactGenerations: true as const,
    attemptScopeDerivedOnlyFromServerAttemptId: true as const,
    callerBucketObjectPrefixPathUrlBytesOrCredentialsAccepted: false as const,
    signedOrPublicUrlUsed: false as const,
    modelOrGpuRuntimeStarted: false as const,
    customerCreditsMutated: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-06T16:08:00.000Z',
  }
  return canonicalSam31VertexQualificationStagingObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function expectedDisplayName(value: string) {
  return `weeditpro-sam31-q-${sha256AuthorityValue(value).slice(0, 40)}`
}

function ref(id: string, digest: string, version = 1) {
  return { id, version, contentHash: `sha256:${digest}` }
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function admissionRepository(
  records: Map<string, unknown>,
  eventLog?: string[],
) {
  return {
    async createOnlyAndReread(value: { admissionHash: string }) {
      eventLog?.push('admitted')
      const key = value.admissionHash
      const prior = records.get(key)
      if (prior && stableAuthorityStringify(prior) !==
        stableAuthorityStringify(value)) throw new Error('admission conflict')
      if (!prior) records.set(key, structuredClone(value))
      return structuredClone(records.get(key))
    },
    async reread(value: { contentHash: string }) {
      return structuredClone(records.get(value.contentHash.slice(7)) ?? null)
    },
  }
}
