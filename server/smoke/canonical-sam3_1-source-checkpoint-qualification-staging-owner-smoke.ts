import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type { Storage } from '@google-cloud/storage'

import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100MountObservation,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION,
  createCanonicalSam31QualificationGcsStagingPort,
  createCanonicalSam31QualificationStagingOwner,
  type CanonicalSam31QualificationPrivateStagingPort,
  type CanonicalSam31QualificationStagedObject,
  type CanonicalSam31QualificationStagingSourceSet,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { candidate, canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'
import { createFoundation } from
  './canonical-sam3_1-a100-qualification-foundation-owner-smoke'

const attemptId = 'sam31-qualification-staging-attempt-1'
const stagingFoundation = createFoundation({
  observedAt: '2026-08-04T18:30:30.000Z',
})
const fixtureHash = digest('sam31-qualification-private-probe')
const workerRequest =
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
    qualificationId: 'sam31-source-checkpoint-qualification-1',
    candidate,
    ingestReceipt: canonicalIngest,
    qualificationImage: {
      artifactRef: release.immutableImageRef,
      immutableImageDigest: release.immutableImageDigest,
      supplyChainReleaseRef: ref('sam31-image-release'),
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
    issuedAt: '2026-08-04T18:30:00.000Z',
  })
const sourceSet = createSourceSet()
const objectStore = createObjectPort()
const staging = createStagingPort()
const owner = createOwner({ objectStore: objectStore.port, staging })

const mounted = await owner.stageOne({ attemptId, workerRequest })
assertCanonicalSam31QualificationA100MountObservation(mounted)
assert.equal(mounted.privateBucketName,
  'reeditpro-production-sam31-qualification-private')
assert.equal(mounted.mountPath,
  '/mnt/disks/reeditpro/sam31-qualification')
assert.equal(mounted.requestCheckpointAndFixtureOnlyInputObjectSet, true)
assert.equal(mounted.signedUrlOrPublicObjectUsed, false)
assert.equal(mounted.callerBucketPrefixPathOrObjectAccepted, false)
assert.equal(mounted.foundationResourceRef.id,
  'weeditpro-sam31-a100-qualification-resource-foundation')
assert.equal(mounted.serviceIdentityRef.id,
  'weeditpro-sam31-a100-qualification-service-identity')
assert.equal(mounted.checkpointObject.byteLength,
  workerRequest.checkpoint.byteLength)
assert.equal(mounted.checkpointObject.sha256, workerRequest.checkpoint.sha256)
assert.equal(mounted.probeFixtureObject.sha256, fixtureHash)
assert.equal(staging.serverSideCopyCalls, 2)
assert.equal(staging.checkpointBytesDownloadedByApplication, false)
assert.equal(staging.objects.size, 3)
assert.equal(objectStore.records.size, 1)

const requestBody = staging.requestBody
assert(requestBody)
assert.equal(requestBody.toString('utf8'),
  stableAuthorityStringify(workerRequest))
assert(!requestBody.includes(Buffer.from('gs://')))
assert(!requestBody.includes(Buffer.from('https://')))
assert(!requestBody.includes(Buffer.from('"bucketName"')))
assert(!requestBody.includes(Buffer.from('"objectName"')))

const replay = await owner.stageOne({ attemptId, workerRequest })
assert.deepEqual(replay, mounted)
assert.equal(staging.serverSideCopyCalls, 2)
assert.equal(objectStore.records.size, 1)
assert.deepEqual(await owner.rereadExactAttemptMount({
  attemptId,
  workerRequest,
}), mounted)

const changedCheckpoint = staging.objects.get(
  `${mounted.attemptRemoteSubdirectory}/checkpoint/sam3.1_multiplex.pt`,
)
assert(changedCheckpoint)
staging.objects.set(
  `${mounted.attemptRemoteSubdirectory}/checkpoint/sam3.1_multiplex.pt`,
  { ...changedCheckpoint, etag: 'changed-etag' },
)
await assert.rejects(owner.stageOne({ attemptId, workerRequest }))
staging.objects.set(
  `${mounted.attemptRemoteSubdirectory}/checkpoint/sam3.1_multiplex.pt`,
  changedCheckpoint,
)

await rejectsOwner({ missingSources: true })
await rejectsOwner({ resultExists: true })
await rejectsOwner({ extraObject: true })
await rejectsOwner({ omitFixture: true })
await rejectsOwner({ wrongCheckpointSha: true })
await rejectsOwner({ wrongCheckpointLength: true })
await rejectsOwner({ wrongFixtureSha: true })
await rejectsOwner({ wrongRequestSha: true })

const crossedSource = structuredClone(sourceSet)
crossedSource.checkpoint.artifactRef.id = 'crossed-checkpoint'
await assert.rejects(createOwner({
  objectStore: createObjectPort().port,
  staging: createStagingPort(),
  sourceOverride: crossedSource,
}).stageOne({ attemptId: 'crossed-source', workerRequest }))

await assert.rejects(owner.stageOne({
  attemptId: '../unsafe-attempt',
  workerRequest,
}))
const tamperedRequest = structuredClone(workerRequest)
tamperedRequest.checkpoint.sha256 = digest('tampered-checkpoint')
await assert.rejects(owner.stageOne({
  attemptId: 'tampered-request',
  workerRequest: tamperedRequest,
}))

const sourceText = readFileSync(new URL(
  '../services/canonical-sam3_1-source-checkpoint-qualification-staging-owner.ts',
  import.meta.url,
), 'utf8')
assert.match(sourceText, /sourceFile\.copy\(target,/u)
assert.match(sourceText, /destinationKmsKeyName: TARGET_KMS_KEY/u)
assert.match(sourceText, /kmsKeyName: TARGET_KMS_KEY/u)
assert.match(sourceText, /TARGET_KMS_KEY_VERSION_PREFIX/u)
assert.match(sourceText, /!isTargetKmsKeyVersionName\(kmsKeyName\)/u)
assert.match(sourceText,
  /String\(stable\.kmsKeyName \?\? ''\) !== kmsKeyName/u)
assert.match(sourceText, /preconditionOpts: \{ ifGenerationMatch: 0 \}/u)
assert.match(sourceText, /foundationReadPort\.rereadCurrentFoundation/u)
assert.doesNotMatch(sourceText,
  /readonly (?:stagingAuthorityRef|serviceIdentityRef|privateNetworkPolicyRef|instanceTemplateRef):/u)
assert.match(sourceText,
  /downloadAndHash: value\.targetObjectName === FIXTURE_OBJECT_NAME/u)
assert.doesNotMatch(sourceText, /from_pretrained|snapshot_download|hf_hub_download/u)
assert.doesNotMatch(sourceText,
  /\.getSignedUrl\(|\.makePublic\(|predefinedAcl:\s*['"]publicRead/u)

const gcsRequestBody = Buffer.from('{"qualification":"sam31"}', 'utf8')
const gcsRequestSha256 = digest(gcsRequestBody)
const gcsMetadata = {
  generation: '301',
  etag: 'gcs-versioned-kms-etag',
  size: String(gcsRequestBody.byteLength),
  contentType: 'application/json',
  kmsKeyName:
    'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification/cryptoKeyVersions/1',
  metadata: {
    weeditproSha256: gcsRequestSha256,
    weeditproCreateOnly: 'true',
  },
}
const versionedKmsStorage = {
  bucket() {
    return {
      file() {
        return {
          async save() {},
          async getMetadata() { return [structuredClone(gcsMetadata)] },
          async download() { return [Buffer.from(gcsRequestBody)] },
        }
      },
    }
  },
} as unknown as Storage
const versionedKmsStaging = createCanonicalSam31QualificationGcsStagingPort({
  storage: versionedKmsStorage,
})
const versionedKmsObject = await versionedKmsStaging.createRequestJsonOnly({
  remoteSubdirectory:
    `private/sam3_1/source-checkpoint-qualification/v2/attempts/${digest('versioned-kms-attempt')}`,
  body: gcsRequestBody,
  sha256: gcsRequestSha256,
})
assert.equal(
  (versionedKmsObject as CanonicalSam31QualificationStagedObject)
    .destinationKmsKeyName,
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
)

const unversionedKmsMetadata = structuredClone(gcsMetadata)
unversionedKmsMetadata.kmsKeyName =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification'
const unversionedKmsStorage = {
  bucket() {
    return {
      file() {
        return {
          async save() {},
          async getMetadata() {
            return [structuredClone(unversionedKmsMetadata)]
          },
          async download() { return [Buffer.from(gcsRequestBody)] },
        }
      },
    }
  },
} as unknown as Storage
await assert.rejects(
  createCanonicalSam31QualificationGcsStagingPort({
    storage: unversionedKmsStorage,
  }).createRequestJsonOnly({
    remoteSubdirectory:
      `private/sam3_1/source-checkpoint-qualification/v2/attempts/${digest('unversioned-kms-attempt')}`,
    body: gcsRequestBody,
    sha256: gcsRequestSha256,
  }),
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-staging-owner',
  checks: 48,
  privateObjects: staging.objects.size,
  observationRecords: objectStore.records.size,
  serverSideCopyCalls: staging.serverSideCopyCalls,
  replayUsesCanonicalRereadWithoutRecopy: true,
  versionedDestinationKmsKeyAccepted: true,
  unversionedDestinationKmsKeyRejected: true,
  changedStagedObjectRejected: true,
  checkpointBytesDownloadedByApplication:
    staging.checkpointBytesDownloadedByApplication,
  localCheckpointInstall: false,
  sourceCheckpointQualificationGranted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function createOwner(input: {
  objectStore: CanonicalCreateOnlyJsonObjectPort
  staging: ReturnType<typeof createStagingPort>
  sourceOverride?: CanonicalSam31QualificationStagingSourceSet
}) {
  return createCanonicalSam31QualificationStagingOwner({
    foundationReadPort: {
      async rereadCurrentFoundation() {
        return structuredClone(stagingFoundation)
      },
    },
    sourceReadPort: {
      async rereadExactSources() {
        return structuredClone(input.sourceOverride ?? sourceSet)
      },
    },
    stagingPort: input.staging,
    observationObjectPort: input.objectStore,
    now: () => '2026-08-04T18:31:00.000Z',
  })
}

async function rejectsOwner(options: Parameters<typeof createStagingPort>[0]) {
  const refusal = createOwner({
    objectStore: createObjectPort().port,
    staging: createStagingPort(options),
    sourceOverride: options?.missingSources
      ? null as never
      : undefined,
  })
  if (options?.missingSources) {
    const missing = createCanonicalSam31QualificationStagingOwner({
      foundationReadPort: {
        async rereadCurrentFoundation() {
          return structuredClone(stagingFoundation)
        },
      },
      sourceReadPort: { async rereadExactSources() { return null } },
      stagingPort: createStagingPort(),
      observationObjectPort: createObjectPort().port,
      now: () => '2026-08-04T18:31:00.000Z',
    })
    await assert.rejects(missing.stageOne({ attemptId, workerRequest }))
    return
  }
  await assert.rejects(refusal.stageOne({
    attemptId: `refusal-${digest(stableAuthorityStringify(options)).slice(0, 16)}`,
    workerRequest,
  }))
}

function createStagingPort(options?: {
  missingSources?: boolean
  resultExists?: boolean
  extraObject?: boolean
  omitFixture?: boolean
  wrongCheckpointSha?: boolean
  wrongCheckpointLength?: boolean
  wrongFixtureSha?: boolean
  wrongRequestSha?: boolean
}) {
  const objects = new Map<string, CanonicalSam31QualificationStagedObject>()
  let requestBody: Buffer | undefined
  let serverSideCopyCalls = 0
  const checkpointBytesDownloadedByApplication = false
  const port: CanonicalSam31QualificationPrivateStagingPort = {
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_GCS_STAGING_PORT_VERSION,
    async createRequestJsonOnly(input) {
      requestBody = Buffer.from(input.body)
      const observedSha = options?.wrongRequestSha
        ? digest('wrong-request') : input.sha256
      objects.set(input.remoteSubdirectory + '/request/request.json', staged({
        objectName: 'request/request.json',
        generation: '201',
        byteLength: input.body.byteLength,
        sha256: observedSha,
        contentType: 'application/json',
        sourceCopy: false,
        sourceCoordinateDigestSha256: null,
      }))
      return objects.get(input.remoteSubdirectory + '/request/request.json')
    },
    async copySourceObjectCreateOnly(input) {
      serverSideCopyCalls += 1
      const checkpoint = input.targetObjectName ===
        'checkpoint/sam3.1_multiplex.pt'
      const sha256 = checkpoint && options?.wrongCheckpointSha
        ? digest('wrong-checkpoint')
        : !checkpoint && options?.wrongFixtureSha
          ? digest('wrong-fixture')
          : input.source.sha256
      const byteLength = checkpoint && options?.wrongCheckpointLength
        ? input.source.byteLength - 1 : input.source.byteLength
      if (!(!checkpoint && options?.omitFixture)) {
        objects.set(
          `${input.remoteSubdirectory}/${input.targetObjectName}`,
          staged({
            objectName: input.targetObjectName,
            generation: checkpoint ? '202' : '203',
            byteLength,
            sha256,
            contentType: input.source.contentType,
            sourceCopy: true,
            sourceCoordinateDigestSha256:
              sha256AuthorityValue(input.source),
          }),
        )
      }
      return objects.get(
        `${input.remoteSubdirectory}/${input.targetObjectName}`,
      )
    },
    async rereadStagedObject(input) {
      return structuredClone(objects.get(
        `${input.remoteSubdirectory}/${input.objectName}`,
      ) ?? null)
    },
    async resultObjectExists() { return options?.resultExists ?? false },
    async listAttemptObjectNames(input) {
      const names = [...objects.keys()]
      if (options?.extraObject) {
        names.push(`${input.remoteSubdirectory}/unexpected.bin`)
      }
      return names.sort(utf16LexicalCompare)
    },
  }
  return {
    ...port,
    objects,
    get requestBody() { return requestBody },
    get serverSideCopyCalls() { return serverSideCopyCalls },
    checkpointBytesDownloadedByApplication,
  }
}

function staged(input: {
  objectName:
    | 'request/request.json'
    | 'checkpoint/sam3.1_multiplex.pt'
    | 'fixture/probe-person.mp4'
  generation: string
  byteLength: number
  sha256: string
  contentType: 'application/json' | 'application/octet-stream' | 'video/mp4'
  sourceCopy: boolean
  sourceCoordinateDigestSha256: string | null
}): CanonicalSam31QualificationStagedObject {
  return {
    objectName: input.objectName,
    generation: input.generation,
    etag: `${input.generation}-etag`,
    byteLength: input.byteLength,
    sha256: input.sha256,
    contentType: input.contentType,
    destinationKmsKeyName:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
    exactDestinationGenerationEtagLengthSha256AndContentTypeReread: true,
    sourceGenerationBoundServerSideCopy: input.sourceCopy,
    sourceCoordinateDigestSha256: input.sourceCoordinateDigestSha256,
    createOnly: true,
  }
}

function createSourceSet(): CanonicalSam31QualificationStagingSourceSet {
  return {
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-staging-source-set-v1',
    evidenceClass: 'canonical_private_reread',
    workerRequestRef: requestRef(),
    checkpoint: {
      bucketName: canonicalIngest.checkpoint.coordinate.bucketName,
      objectName: canonicalIngest.checkpoint.coordinate.objectName,
      generation: canonicalIngest.checkpoint.coordinate.generation,
      etag: canonicalIngest.checkpoint.coordinate.etag,
      byteLength: workerRequest.checkpoint.byteLength,
      sha256: workerRequest.checkpoint.sha256,
      contentType: 'application/octet-stream',
      artifactRef: workerRequest.checkpoint.artifactRef,
      canonicalSourceAuthorityRef: ref('sam31-checkpoint-source-authority'),
      exactGenerationEtagLengthSha256AndContentTypeReread: true,
      publicOrSignedUrlUsed: false,
    },
    probeFixture: {
      bucketName: 'reeditpro-production-sam31-qualification-fixtures',
      objectName: 'private/fixtures/sam31/probe-person.mp4',
      generation: '81',
      etag: 'probe-fixture-etag',
      byteLength: workerRequest.deterministicProbeFixture.byteLength,
      sha256: workerRequest.deterministicProbeFixture.sha256,
      contentType: 'video/mp4',
      artifactRef: workerRequest.deterministicProbeFixture.artifactRef,
      canonicalSourceAuthorityRef: ref('sam31-probe-source-authority'),
      exactGenerationEtagLengthSha256AndContentTypeReread: true,
      publicOrSignedUrlUsed: false,
    },
    callerCoordinateAccepted: false,
    observedAt: '2026-08-04T18:30:30.000Z',
  }
}

function requestRef() {
  return {
    id: workerRequest.qualificationId,
    version: workerRequest.qualificationVersion,
    contentHash: `sha256:${workerRequest.requestHash}` as const,
  }
}

function ref(id: string) {
  return { id, version: 1, contentHash: `sha256:${digest(id)}` as const }
}

function contentRef(id: string, contentHash: string) {
  return { id, version: 1, contentHash: `sha256:${contentHash}` as const }
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
          if (digest(prior) !== input.contentSha256) {
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

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function utf16LexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
