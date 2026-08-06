import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcsQualificationProbeFixtureReadPort,
  createCanonicalSam31QualificationPackageRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  assertCanonicalSam31QualificationStagingSourceSetForWorker,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { candidate, canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'

const prefix = 'private/test/sam31/qualification-packages'
const store = memoryObjectPort()
let probeReadCalls = 0
const probeFixtureBytes = Buffer.alloc(1_024, 0x31)
const fixtureHash = digest(probeFixtureBytes)
const workerRequest =
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
    qualificationId: 'sam31-package-repository-qualification-1',
    candidate,
    ingestReceipt: canonicalIngest,
    qualificationImage: {
      artifactRef: release.immutableImageRef,
      immutableImageDigest: release.immutableImageDigest,
      supplyChainReleaseRef: ref('sam31-qualification-image-release'),
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
      byteLength: probeFixtureBytes.byteLength,
      sha256: fixtureHash,
      width: 128,
      height: 128,
      frameCount: 3,
    },
    issuedAt: '2026-08-04T18:00:00.000Z',
  })
const probeFixtureSource = {
  bucketName: 'reeditpro-production-sam31-qualification-fixtures',
  objectName: 'private/fixtures/sam31/probe-person-v1.mp4',
  generation: '81',
  etag: 'probe-person-v1-etag',
  byteLength: workerRequest.deterministicProbeFixture.byteLength,
  sha256: workerRequest.deterministicProbeFixture.sha256,
  contentType: 'video/mp4' as const,
  artifactRef: workerRequest.deterministicProbeFixture.artifactRef,
  canonicalSourceAuthorityRef:
    workerRequest.deterministicProbeFixture.artifactRef,
  exactGenerationEtagLengthSha256AndContentTypeReread: true as const,
  publicOrSignedUrlUsed: false as const,
}
const gcsProbePort = createCanonicalSam31GcsQualificationProbeFixtureReadPort({
  storage: fakeProbeStorage({ body: probeFixtureBytes }) as never,
})
assert.deepEqual(
  await gcsProbePort.rereadExactProbeFixture({ workerRequest }),
  probeFixtureSource,
)
await assert.rejects(
  createCanonicalSam31GcsQualificationProbeFixtureReadPort({
    storage: fakeProbeStorage({
      body: Buffer.alloc(probeFixtureBytes.byteLength, 0x32),
    }) as never,
  }).rereadExactProbeFixture({ workerRequest }),
)
assert.equal(await createCanonicalSam31GcsQualificationProbeFixtureReadPort({
  storage: fakeProbeStorage({ missing: true }) as never,
}).rereadExactProbeFixture({ workerRequest }), null)
const repository = createCanonicalSam31QualificationPackageRepository({
  objectPort: store.port,
  probeFixtureReadPort: {
    schemaVersion: gcsProbePort.schemaVersion,
    async rereadExactProbeFixture(input) {
      probeReadCalls += 1
      return gcsProbePort.rereadExactProbeFixture(input)
    },
  },
  prefix,
})

const created = await repository.persistQualificationPackageCreateOnly({
  workerRequest,
  ingestReceipt: canonicalIngest,
  preparedAt: '2026-08-04T18:01:00.000Z',
})
assert.equal(created.disposition, 'created')
assert.equal(created.modelOrGpuRuntimeStarted, false)
assert.equal(created.customerCreditsMutated, false)
assert.equal(created.productionAuthorityGranted, false)
assert.equal(store.records.size, 1)

const rereadRequest = await repository.rereadExactWorkerRequest({
  workerRequestRef: created.workerRequestRef,
})
assert.deepEqual(rereadRequest, workerRequest)
assert.notEqual(rereadRequest, workerRequest)

const rereadSources =
  assertCanonicalSam31QualificationStagingSourceSetForWorker(
    await repository.rereadExactSources({ workerRequest }),
    workerRequest,
  )
assert.equal(rereadSources.checkpoint.bucketName,
  canonicalIngest.checkpoint.coordinate.bucketName)
assert.equal(rereadSources.checkpoint.objectName,
  canonicalIngest.checkpoint.coordinate.objectName)
assert.equal(rereadSources.checkpoint.generation,
  canonicalIngest.checkpoint.coordinate.generation)
assert.equal(rereadSources.checkpoint.etag,
  canonicalIngest.checkpoint.coordinate.etag)
assert.equal(rereadSources.checkpoint.byteLength,
  workerRequest.checkpoint.byteLength)
assert.equal(rereadSources.checkpoint.sha256,
  workerRequest.checkpoint.sha256)
assert.equal(rereadSources.probeFixture.objectName,
  probeFixtureSource.objectName)
assert.equal(rereadSources.checkpoint.publicOrSignedUrlUsed, false)
assert.equal(rereadSources.probeFixture.publicOrSignedUrlUsed, false)
assert.equal(rereadSources.callerCoordinateAccepted, false)

const replay = await repository.persistQualificationPackageCreateOnly({
  workerRequest,
  ingestReceipt: canonicalIngest,
  preparedAt: '2026-08-04T18:01:00.000Z',
})
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.workerRequestRef, created.workerRequestRef)
assert.equal(store.records.size, 1)
assert.equal(probeReadCalls, 2)

assert.equal(await repository.rereadExactWorkerRequest({
  workerRequestRef: ref('missing-worker-request'),
}), null)

await rejectsPackage({
  probeFixtureSource: {
    ...probeFixtureSource,
    bucketName: 'attacker-bucket',
  },
})
await rejectsPackage({ probeFixtureSource: null as never })
await rejectsPackage({
  probeFixtureSource: {
    ...probeFixtureSource,
    objectName: 'private/fixtures/sam31/../checkpoint.pt',
  },
})
await rejectsPackage({
  probeFixtureSource: {
    ...probeFixtureSource,
    sha256: digest('changed-probe'),
  },
})
await rejectsPackage({
  probeFixtureSource: {
    ...probeFixtureSource,
    publicOrSignedUrlUsed: true,
  },
})
await rejectsPackage({
  probeFixtureSource: {
    ...probeFixtureSource,
    canonicalSourceAuthorityRef: {
      ...probeFixtureSource.canonicalSourceAuthorityRef,
      contentHash: 'sha256:not-a-digest',
    },
  },
})

const changedIngest = structuredClone(canonicalIngest)
changedIngest.checkpoint.coordinate.etag = 'changed-checkpoint-etag'
await assert.rejects(repository.persistQualificationPackageCreateOnly({
  workerRequest,
  ingestReceipt: changedIngest,
  preparedAt: '2026-08-04T18:01:00.000Z',
}))

const changedRequest = structuredClone(workerRequest)
changedRequest.deterministicProbeFixture.sha256 = digest('changed-probe')
await assert.rejects(repository.rereadExactSources({
  workerRequest: changedRequest,
}))

const [recordPath, canonicalBody] = [...store.records.entries()][0] ?? []
assert(recordPath)
assert(canonicalBody)
const parsed = JSON.parse(canonicalBody.toString('utf8')) as Record<
  string,
  unknown
>
const tampered = structuredClone(parsed) as {
  stagingSourceSet: { probeFixture: { etag: string } }
}
tampered.stagingSourceSet.probeFixture.etag = 'tampered-etag'
store.records.set(recordPath, Buffer.from(stableAuthorityStringify(tampered)))
await assert.rejects(repository.rereadExactSources({ workerRequest }))
store.records.set(recordPath, canonicalBody)

const source = readFileSync(new URL(
  '../services/canonical-sam3_1-source-checkpoint-qualification-package-repository.ts',
  import.meta.url,
), 'utf8')
assert.match(source, /gcs_create_only_exact_reread/u)
assert.match(source, /callerBucketObjectPathUrlBytesOrCredentialsAccepted/u)
assert.match(source, /QUALIFICATION_FIXTURE_BUCKET/u)
assert.doesNotMatch(source,
  /from_pretrained|snapshot_download|hf_hub_download|child_process/u)
assert.doesNotMatch(source, /HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN/u)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-package-repository',
  checks: 43,
  records: store.records.size,
  durableWorkerRequestReadPort: true,
  durableStagingSourceReadPort: true,
  privateGcsProbeGenerationEtagKmsLengthAndBytesReread: true,
  exactCheckpointCoordinateBoundToCanonicalIngest: true,
  exactProbeFixtureCoordinateBoundToWorkerRequest: true,
  callerCoordinatesAccepted: false,
  checkpointOrModelBytesAccepted: false,
  modelOrGpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

async function rejectsPackage(input: {
  probeFixtureSource: typeof probeFixtureSource | Record<string, unknown>
}) {
  const isolated = memoryObjectPort()
  const owner = createCanonicalSam31QualificationPackageRepository({
    objectPort: isolated.port,
    probeFixtureReadPort: probeReadPort(input.probeFixtureSource),
    prefix: `${prefix}/reject-${digest(stableAuthorityStringify(input))}`,
  })
  await assert.rejects(owner.persistQualificationPackageCreateOnly({
    workerRequest,
    ingestReceipt: canonicalIngest,
    preparedAt: '2026-08-04T18:01:00.000Z',
  }))
  assert.equal(isolated.records.size, 0)
}

function probeReadPort(value: unknown) {
  return {
    schemaVersion: 'controlled-probe-read-port-v1',
    async rereadExactProbeFixture() {
      probeReadCalls += 1
      return value === null ? null : structuredClone(value)
    },
  }
}

function fakeProbeStorage(options: {
  body?: Buffer
  missing?: boolean
}) {
  const metadata = {
    generation: '81',
    etag: 'probe-person-v1-etag',
    size: String(probeFixtureBytes.byteLength),
    contentType: 'video/mp4',
    kmsKeyName:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
  }
  return {
    bucket(bucketName: string) {
      assert.equal(bucketName,
        'reeditpro-production-sam31-qualification-fixtures')
      return {
        file(objectName: string) {
          assert.equal(objectName,
            'private/fixtures/sam31/probe-person-v1.mp4')
          return {
            async getMetadata() {
              if (options.missing) {
                throw Object.assign(new Error('controlled missing object'), {
                  code: 404,
                })
              }
              return [structuredClone(metadata)]
            },
            async download() {
              return [Buffer.from(options.body ?? probeFixtureBytes)]
            },
          }
        },
      }
    },
  }
}

function memoryObjectPort(): {
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
          if (digest(prior) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        assert.equal(digest(input.body), input.contentSha256)
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = records.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
  }
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function contentRef(id: string, contentHash: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${contentHash}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
