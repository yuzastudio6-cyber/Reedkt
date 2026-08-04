import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100Admission,
  assertCanonicalSam31QualificationA100JobObservation,
  assertCanonicalSam31QualificationA100Submission,
  createCanonicalSam31SourceCheckpointQualificationA100Phase,
  sealCanonicalSam31QualificationA100MountObservation,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  createCanonicalSam31QualificationA100StateRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-a100-runtime'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { candidate, canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'

const attemptId = 'sam31-source-checkpoint-qualification-attempt-1'
const now = '2026-08-04T18:00:00.000Z'
const rate = await a100Rate()
const fixtureHash = digest('sam31-qualification-probe')
const workerRequest =
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
    qualificationId: 'sam31-source-checkpoint-qualification-1',
    candidate,
    ingestReceipt: canonicalIngest,
    qualificationImage: {
      artifactRef: release.immutableImageRef,
      immutableImageDigest: release.immutableImageDigest,
      supplyChainReleaseRef: releaseRef(),
      dockerfileSourceRef: ref('sam31-qualification-dockerfile'),
      entrypointSourceRef: ref('sam31-qualification-entrypoint'),
      runnerSourceRef: ref('sam31-qualification-runner'),
    },
    patchedSourceArchiveRef: contentRef(
      'sam31-patched-source',
      candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256,
    ),
    patchApplicationReceiptRef: ref('sam31-patch-application'),
    checkpointWeightsOnlyInspectionRef: ref('sam31-checkpoint-weights-only'),
    dependencyClosureRef: ref('sam31-dependency-closure'),
    dependencyLockSha256: digest('sam31-dependency-lock'),
    dependencyClosureReceiptSha256: digest('sam31-dependency-receipt'),
    dependencyWheelManifestSha256: digest('sam31-wheel-manifest'),
    sourceCodeSecurityReviewRef: ref('sam31-source-security-review'),
    deterministicProbeFixture: {
      artifactRef: contentRef('sam31-probe-fixture', fixtureHash),
      byteLength: 1_024,
      sha256: fixtureHash,
      width: 128,
      height: 128,
      frameCount: 3,
    },
    issuedAt: '2026-08-04T17:58:00.000Z',
  })
const mount = createMount(attemptId)
const objectStore = createObjectPort()
const state = createCanonicalSam31QualificationA100StateRepository({
  objectPort: objectStore.port,
})
let postCalls = 0
let getCalls = 0
let batchBody: Readonly<Record<string, unknown>> | undefined
let batchJobId = ''
let batchState: 'RUNNING' | 'SUCCEEDED' = 'RUNNING'
const phase = createCanonicalSam31SourceCheckpointQualificationA100Phase({
  imageReleaseReadPort: releasePort(),
  workerRequestReadPort: requestPort(),
  privateMountReadPort: mountPort(mount),
  rateReadPort: ratePort(),
  statePort: state,
  batchTransport: {
    async request(request) {
      if (request.method === 'POST') {
        postCalls += 1
        batchBody = request.body
        batchJobId = request.params?.jobId ?? ''
        return {
          status: 200,
          json: {
            name: `projects/reeditpro/locations/us-central1/jobs/${batchJobId}`,
            uid: 'batch-job-uid-1',
          },
        }
      }
      getCalls += 1
      return {
        status: 200,
        json: {
          ...batchBody,
          name: `projects/reeditpro/locations/us-central1/jobs/${batchJobId}`,
          uid: 'batch-job-uid-1',
          status: { state: batchState },
        },
      }
    },
  },
  now: () => now,
})

const submission = await phase.admitAndStart({
  attemptId,
  qualificationImageSupplyChainReleaseRef: releaseRef(),
  workerRequestRef: requestRef(),
})
assertCanonicalSam31QualificationA100Submission(submission)
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(submission.customerCreditsMutated, false)
assert.equal(postCalls, 1)
assert.match(submission.batchJobId, /^weeditpro-sam31-q-[a-f0-9]{40}$/u)
assert(batchBody)
const bodyText = stableAuthorityStringify(batchBody)
assert(bodyText.includes(release.immutableImageUri))
assert(bodyText.includes(mount.gcsRemotePath))
assert(bodyText.includes('/mnt/disks/reeditpro/sam31-qualification'))
assert(bodyText.includes('nvidia_a100_80gb'))
assert(!bodyText.includes('sam3.1_multiplex.pt'))
assert(!bodyText.includes('gs://'))
assert(!bodyText.includes('secret'))
assert.equal((batchBody.taskGroups as Array<Record<string, unknown>>).length, 1)

const duplicate = await phase.admitAndStart({
  attemptId,
  qualificationImageSupplyChainReleaseRef: releaseRef(),
  workerRequestRef: requestRef(),
})
assert.deepEqual(duplicate, submission)
assert.equal(postCalls, 1)

const pending = await phase.reconcileOne({ attemptId })
assertCanonicalSam31QualificationA100JobObservation(pending)
assert.equal(pending.disposition, 'pending')
assert.equal(pending.batchState, 'RUNNING')
assert.equal(pending.terminalObservationPersistedCreateOnly, false)
assert.equal(pending.actualCudaQualificationAccepted, false)
assert.equal(pending.internalAttemptCostReread, false)
assert.equal(getCalls, 1)

batchState = 'SUCCEEDED'
const succeeded = await phase.reconcileOne({ attemptId })
assert.equal(succeeded.disposition, 'job_succeeded_pending_result_reread')
assert.equal(succeeded.batchState, 'SUCCEEDED')
assert.equal(succeeded.exactCreateConfigurationEchoVerified, true)
assert.equal(succeeded.resultObjectReread, false)
assert.equal(succeeded.sourceCheckpointQualificationGranted, false)
assert.equal(succeeded.runtimeReleaseGranted, false)
assert.equal(succeeded.customerCreditsMutated, false)
assert.equal(succeeded.productionReady, false)
assert.equal(succeeded.terminalObservationPersistedCreateOnly, true)
assert.equal(getCalls, 2)

const terminalReplay = await phase.reconcileOne({ attemptId })
assert.deepEqual(terminalReplay, succeeded)
assert.equal(getCalls, 2)
assert.equal(objectStore.records.size, 3)

const admission = assertCanonicalSam31QualificationA100Admission(
  await state.rereadAdmission({ attemptId }),
)
assert.equal(admission.userTriggered, true)
assert.equal(admission.minimumIdleInstances, 0)
assert.equal(admission.prewarmingOrKeepaliveAllowed, false)
assert.equal(admission.substantiveCpuModelOrMediaExecutionAllowed, false)
assert.equal(admission.billingClassification,
  'platform_internal_qualification')
assert.equal(admission.accountEffectivePricingReread, true)
assert.equal(admission.customerCreditsReserved, false)
assert.equal(admission.customerCreditsSpent, false)

const unknownStore = createCanonicalSam31QualificationA100StateRepository({
  objectPort: createObjectPort().port,
  prefix: 'private/sam3_1/source-checkpoint-qualification/v1/unknown-test',
})
let unknownPostCalls = 0
let unknownGetCalls = 0
const unknownPhase =
  createCanonicalSam31SourceCheckpointQualificationA100Phase({
    imageReleaseReadPort: releasePort(),
    workerRequestReadPort: requestPort(),
    privateMountReadPort: mountPort(createMount('sam31-unknown-attempt')),
    rateReadPort: ratePort(),
    statePort: unknownStore,
    batchTransport: {
      async request(request) {
        if (request.method === 'POST') unknownPostCalls += 1
        else unknownGetCalls += 1
        throw new Error('controlled uncertain network outcome')
      },
    },
    now: () => now,
  })
const unknown = await unknownPhase.admitAndStart({
  attemptId: 'sam31-unknown-attempt',
  qualificationImageSupplyChainReleaseRef: releaseRef(),
  workerRequestRef: requestRef(),
})
assert.equal(unknown.disposition, 'outcome_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
const unknownReplay = await unknownPhase.admitAndStart({
  attemptId: 'sam31-unknown-attempt',
  qualificationImageSupplyChainReleaseRef: releaseRef(),
  workerRequestRef: requestRef(),
})
assert.deepEqual(unknownReplay, unknown)
assert.equal(unknownPostCalls, 1)
const unresolved = await unknownPhase.reconcileOne({
  attemptId: 'sam31-unknown-attempt',
})
assert.equal(unresolved.disposition, 'outcome_unknown')
assert.equal(unresolved.automaticRetryAllowed, false)
assert.equal(unknownPostCalls, 1)
assert.equal(unknownGetCalls, 1)

const wrongMount = structuredClone(mount)
wrongMount.checkpointObject.sha256 = digest('wrong-checkpoint')
await assert.rejects(async () => {
  const refusal = createCanonicalSam31SourceCheckpointQualificationA100Phase({
    imageReleaseReadPort: releasePort(),
    workerRequestReadPort: requestPort(),
    privateMountReadPort: mountPort(wrongMount),
    rateReadPort: ratePort(),
    statePort: createCanonicalSam31QualificationA100StateRepository({
      objectPort: createObjectPort().port,
      prefix: 'private/sam3_1/source-checkpoint-qualification/v1/refusal',
    }),
    batchTransport: { async request() {
      throw new Error('provider must not be reached')
    } },
    now: () => now,
  })
  await refusal.admitAndStart({
    attemptId,
    qualificationImageSupplyChainReleaseRef: releaseRef(),
    workerRequestRef: requestRef(),
  })
})

const tamperedSubmission = structuredClone(submission)
tamperedSubmission.customerCreditsMutated = true as never
assert.throws(() =>
  assertCanonicalSam31QualificationA100Submission(tamperedSubmission))
const tamperedObservation = structuredClone(succeeded)
tamperedObservation.actualCudaQualificationAccepted = true as never
assert.throws(() =>
  assertCanonicalSam31QualificationA100JobObservation(tamperedObservation))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-a100-phase',
  checks: 52,
  batchPostCalls: postCalls,
  batchGetCalls: getCalls,
  durableRecords: objectStore.records.size,
  mountPath: mount.mountPath,
  attemptScopedRemotePath: mount.gcsRemotePath,
  scaleFromZero: admission.minimumIdleInstances === 0,
  accountEffectivePricingReread: admission.accountEffectivePricingReread,
  customerCreditsMutated: succeeded.customerCreditsMutated,
  sourceCheckpointQualificationGranted:
    succeeded.sourceCheckpointQualificationGranted,
  productionReady: succeeded.productionReady,
}))

function createMount(id: string) {
  const remoteSubdirectory =
    `private/sam3_1/source-checkpoint-qualification/v1/attempts/`
    + sha256AuthorityValue(id)
  return sealCanonicalSam31QualificationA100MountObservation({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-a100-mount-observation-v1',
    source: 'canonical_server_sam3_1_qualification_private_mount_owner',
    evidenceClass: 'canonical_private_reread',
    attemptId: id,
    qualificationId: workerRequest.qualificationId,
    workerRequestRef: requestRef(),
    stagingAuthorityRef: ref('sam31-qualification-staging-authority'),
    serviceIdentityRef: ref('sam31-qualification-service-identity'),
    privateNetworkPolicyRef: ref('sam31-qualification-network-policy'),
    instanceTemplateRef: ref('sam31-qualification-instance-template'),
    projectId: 'reeditpro',
    region: 'us-central1',
    privateBucketName: 'reeditpro-production-sam31-qualification-private',
    attemptRemoteSubdirectory: remoteSubdirectory,
    gcsRemotePath:
      `reeditpro-production-sam31-qualification-private/${remoteSubdirectory}`,
    mountPath: '/mnt/disks/reeditpro/sam31-qualification',
    mountOptions: 'rw,implicit-dirs',
    requestObject: {
      objectName: 'request/request.json',
      storageGeneration: '101',
      storageEtag: 'request-etag',
      byteLength: Buffer.byteLength(stableAuthorityStringify(workerRequest)),
      sha256: sha256(stableAuthorityStringify(workerRequest)),
      exactGenerationEtagLengthAndSha256Reread: true,
      readOnlyForWorker: true,
      requestCanonicalHash: workerRequest.requestHash,
    },
    checkpointObject: {
      objectName: 'checkpoint/sam3.1_multiplex.pt',
      storageGeneration: '102',
      storageEtag: 'checkpoint-etag',
      byteLength: workerRequest.checkpoint.byteLength,
      sha256: workerRequest.checkpoint.sha256,
      exactGenerationEtagLengthAndSha256Reread: true,
      readOnlyForWorker: true,
    },
    probeFixtureObject: {
      objectName: 'fixture/probe-person.mp4',
      storageGeneration: '103',
      storageEtag: 'probe-etag',
      byteLength: workerRequest.deterministicProbeFixture.byteLength,
      sha256: workerRequest.deterministicProbeFixture.sha256,
      exactGenerationEtagLengthAndSha256Reread: true,
      readOnlyForWorker: true,
    },
    resultObjectName: 'result/result.json',
    resultObjectAbsentBeforeLaunch: true,
    resultParentCreatedForWorkerOnly: true,
    exactAttemptSubdirectoryReread: true,
    requestCheckpointAndFixtureOnlyInputObjectSet: true,
    serviceIdentityReadInputsWriteResultOnly: true,
    objectBytesPathsUrlsOrCredentialsIncludedInWorkerRequest: false,
    signedUrlOrPublicObjectUsed: false,
    callerBucketPrefixPathOrObjectAccepted: false,
    observedAt: '2026-08-04T17:59:00.000Z',
  })
}

function releasePort() {
  return {
    async rereadQualifiedQualificationImageRelease() {
      return structuredClone(release)
    },
  }
}

function requestPort() {
  return {
    async rereadExactWorkerRequest() {
      return structuredClone(workerRequest)
    },
  }
}

function mountPort(value: unknown) {
  return {
    async rereadExactAttemptMount() {
      return structuredClone(value)
    },
  }
}

function ratePort() {
  return {
    async rereadCurrentAccountEffectiveA100Rate() {
      return structuredClone(rate)
    },
  }
}

function releaseRef() {
  return {
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  }
}

function requestRef() {
  return {
    id: workerRequest.qualificationId,
    version: workerRequest.qualificationVersion,
    contentHash: `sha256:${workerRequest.requestHash}`,
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(id)}`,
  }
}

function contentRef(id: string, contentHash: string) {
  return { id, version: 1, contentHash: `sha256:${contentHash}` }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function createObjectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (sha256(prior.toString('utf8')) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const record = records.get(objectPath)
        return record ? Buffer.from(record) : null
      },
    },
  }
}

async function a100Rate() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-rate-a100-qualification-v1',
    rateAuthorityVersion: 1,
    routeId: 'a100_80gb_heavy_primary',
    region: 'us-central1',
    readPort: { async readCurrentRouteRate() {
      return rawRateObservation()
    } },
  })
}

function rawRateObservation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    component('a2_ultragpu_1g_machine_bundle',
      'machine_hour', 5_068_797_890, 'a'),
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'b'),
    component('network_egress_gib', 'gib', 120_000_000, 'c'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, 'd'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, 'e'),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
    pricingReaderConfigurationRef: ref('gpu-rate-reader-configuration'),
    routeId: 'a100_80gb_heavy_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('a100-price-record-set'),
    pricingReadStartedAt: '2026-08-04T17:59:55.000Z',
    pricingReadFinishedAt: now,
  }
  return { ...base, pricingReadDigestSha256: sha256AuthorityValue(base) }
}

function component(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  price: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('a2_')
    ? 'service-compute-engine'
    : 'service-cloud-storage'
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('a2_')
      ? 'compute-engine' : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${character}`),
      billingAccountPriceRef: ref(`account-price-${character}`),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: now,
    skuRecordRef: ref(`sku-record-${character}`),
  }
}
