import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Readable, Writable } from 'node:stream'

import {
  createCanonicalSam31GcsOfficialArtifactPublicationPort,
} from '../model-artifacts/canonical-sam3_1-gcs-official-artifact-publication'
import {
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
  publishCanonicalSam31OfficialPrivateArtifacts,
  type CanonicalSam31PrivateArtifactPublicationPort,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  createCanonicalSam31CloudOfficialArtifactStreamPort,
} from '../model-artifacts/canonical-sam3_1-official-artifact-stream-runtime'
import {
  createCanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

interface StoredObject {
  readonly body: Buffer
  readonly generation: string
  readonly etag: string
  readonly contentType: string
}

class FakeStorage {
  private readonly objects = new Map<string, StoredObject>()

  objectCount(): number {
    return this.objects.size
  }

  bucket(bucketName: string) {
    return {
      file: (objectName: string, options?: { generation?: string }) => ({
        createWriteStream: (writeOptions: {
          readonly metadata?: { readonly contentType?: string }
        }) => {
          const chunks: Buffer[] = []
          return new Writable({
            write(chunk, _encoding, callback) {
              chunks.push(Buffer.from(chunk))
              callback()
            },
            final: (callback) => {
              const key = `${bucketName}/${objectName}`
              if (this.objects.has(key)) {
                const error = new Error('precondition') as Error & { code: number }
                error.code = 412
                callback(error)
                return
              }
              const body = Buffer.concat(chunks)
              this.objects.set(key, {
                body,
                generation: '1',
                etag: `etag-${digest(body).slice(0, 16)}`,
                contentType: writeOptions.metadata?.contentType ?? '',
              })
              callback()
            },
          })
        },
        getMetadata: async () => {
          const object = this.objects.get(`${bucketName}/${objectName}`)
          if (!object || (options?.generation
            && options.generation !== object.generation)) {
            throw new Error('missing')
          }
          return [{
            generation: object.generation,
            etag: object.etag,
            size: String(object.body.byteLength),
            contentType: object.contentType,
          }]
        },
        createReadStream: () => {
          const object = this.objects.get(`${bucketName}/${objectName}`)
          if (!object) throw new Error('missing')
          return Readable.from(chunked(object.body))
        },
      }),
    }
  }
}

class FailingStorage {
  bucket() {
    return {
      file: () => ({
        createWriteStream: () => new Writable({
          write(_chunk, _encoding, callback) {
            const error = new Error(
              'hf_PRIVATE_TOKEN /Users/private/sam3.1 source URL',
            ) as Error & { code: number }
            error.code = 403
            callback(error)
          },
        }),
      }),
    }
  }
}

const sourceBytes = Buffer.from('synthetic official source archive')
const checkpointBytes = Buffer.from('synthetic official gated checkpoint')
const terms = createTerms('synthetic_contract_fixture')
let publicationSequence = 0
const publicationPort: CanonicalSam31PrivateArtifactPublicationPort = {
  schemaVersion: 'synthetic-sam31-publication-port-v1',
  async publishCreateOnlyAndReread(input) {
    const body = await collect(input.body)
    assert.ok(body.byteLength >= input.minimumByteLength)
    assert.ok(body.byteLength <= input.maximumByteLength)
    publicationSequence += 1
    return {
      projectId: 'reeditpro',
      bucketName: 'reeditpro-production-reeditpro-model-artifacts',
      objectName: input.objectName,
      generation: String(publicationSequence),
      etag: `etag-${publicationSequence}`,
      byteLength: body.byteLength,
      sha256: digest(body),
    }
  },
}

export const receipt = await publishCanonicalSam31OfficialPrivateArtifacts({
  publicationAttemptId: 'contract-fixture-001',
  evidenceClass: 'synthetic_contract_fixture',
  candidate: createCanonicalSam31SourceRuntimeCandidate(),
  termsAcceptance: terms,
  officialArtifactStreamPort: {
    schemaVersion: 'synthetic-sam31-official-stream-port-v1',
    async openPinnedSourceArchive() {
      return {
        contentType: 'application/x-tar',
        body: chunked(sourceBytes),
      }
    },
    async openPinnedCheckpoint() {
      return {
        contentType: 'application/octet-stream',
        body: chunked(checkpointBytes),
        accessTokenReadFromPinnedSecretVersion: false,
      }
    },
  },
  privateArtifactPublicationPort: publicationPort,
  publishedAt: '2026-08-03T20:00:00.000Z',
})
assert.equal(
  assertCanonicalSam31OfficialArtifactPublicationReceipt(receipt)
    .publicationReceiptHash,
  receipt.publicationReceiptHash,
)
assert.equal(receipt.status, 'contract_validated_only')
assert.equal(receipt.sourceArchive.coordinate.byteLength, sourceBytes.byteLength)
assert.equal(receipt.checkpoint.coordinate.byteLength, checkpointBytes.byteLength)
assert.equal(receipt.privateBoundary.developerMachineExecutionAllowed, false)
assert.equal(receipt.privateBoundary.thirdPartyMirrorAccepted, false)
assert.equal(receipt.retryPolicy.automaticRetryAllowed, false)
assert.equal(receipt.authority.imageBuildAuthorized, false)
assert.equal(receipt.authority.gpuRuntimeAuthorized, false)
assert.equal(receipt.authority.customerCreditsMutated, false)

const tampered = structuredClone(receipt)
tampered.authority.gpuRuntimeAuthorized = true as never
assert.throws(() =>
  assertCanonicalSam31OfficialArtifactPublicationReceipt(tampered))

await assert.rejects(() => publishCanonicalSam31OfficialPrivateArtifacts({
  publicationAttemptId: 'wrong-evidence-class',
  evidenceClass: 'canonical_private_publication',
  candidate: createCanonicalSam31SourceRuntimeCandidate(),
  termsAcceptance: terms,
  officialArtifactStreamPort: {} as never,
  privateArtifactPublicationPort: publicationPort,
  publishedAt: '2026-08-03T20:00:00.000Z',
}))

assert.throws(() => createCanonicalSam31CloudOfficialArtifactStreamPort({
  secretResourceName: 'projects/reeditpro/secrets/HUGGINGFACE_TOKEN/versions/latest',
}))

const cloudOnlyPort = createCanonicalSam31CloudOfficialArtifactStreamPort({
  secretResourceName:
    'projects/reeditpro/secrets/HUGGINGFACE_TOKEN/versions/7',
  runtimeEnvironment: {},
  auth: { request: async () => ({ data: {} }) } as never,
})
await assert.rejects(() => cloudOnlyPort.openPinnedSourceArchive({
  repository: 'https://github.com/facebookresearch/sam3.git',
  revision: '96914d2425f90a64f45ca977c2b5165418099543',
  archiveFormat: 'git_archive_tar_uncompressed',
}))

const fetches: Array<{ readonly host: string; readonly authorization: string }> = []
const redirectedPort = createCanonicalSam31CloudOfficialArtifactStreamPort({
  secretResourceName:
    'projects/reeditpro/secrets/MODEL_WEIGHT_ACCESS_TOKEN/versions/3',
  runtimeEnvironment: {
    CLOUD_RUN_JOB: 'weeditpro-sam31-official-artifact-ingest',
    CLOUD_RUN_EXECUTION: 'sam31-ingest-execution-001',
    CLOUD_RUN_TASK_INDEX: '0',
    CLOUD_RUN_TASK_ATTEMPT: '0',
  },
  auth: {
    request: async () => ({
      data: {
        payload: {
          data: Buffer.from(`hf_${'A'.repeat(32)}`).toString('base64'),
        },
      },
    }),
  } as never,
  fetchImpl: (async (url, init) => {
    const parsed = new URL(String(url))
    const headers = new Headers(init?.headers)
    fetches.push({
      host: parsed.hostname,
      authorization: headers.get('authorization') ?? '',
    })
    if (fetches.length === 1) return new Response(null, {
      status: 302,
      headers: {
        location:
          'https://us.aws.cdn.hf.co/private-signed-checkpoint-object',
      },
    })
    return new Response(checkpointBytes, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    })
  }) as typeof fetch,
})
const checkpoint = await redirectedPort.openPinnedCheckpoint({
  repository: 'facebook/sam3.1',
  revision: 'daa63191845a41281374e725f4c9e51c7a824460',
  fileName: 'sam3.1_multiplex.pt',
  termsAcceptanceRef: ref('terms-ref'),
})
assert.equal(checkpoint.accessTokenReadFromPinnedSecretVersion, true)
assert.equal((await collect(checkpoint.body)).toString(), checkpointBytes.toString())
assert.equal(fetches.length, 2)
assert.match(fetches[0]!.authorization, /^Bearer hf_/u)
assert.equal(fetches[1]!.authorization, '')

const insecureRedirectPort = createCanonicalSam31CloudOfficialArtifactStreamPort({
  secretResourceName:
    'projects/reeditpro/secrets/MODEL_WEIGHT_ACCESS_TOKEN/versions/4',
  runtimeEnvironment: {
    CLOUD_RUN_JOB: 'weeditpro-sam31-official-artifact-ingest',
    CLOUD_RUN_EXECUTION: 'sam31-ingest-execution-002',
    CLOUD_RUN_TASK_INDEX: '0',
    CLOUD_RUN_TASK_ATTEMPT: '0',
  },
  auth: {
    request: async () => ({
      data: {
        payload: {
          data: Buffer.from(`hf_${'B'.repeat(32)}`).toString('base64'),
        },
      },
    }),
  } as never,
  fetchImpl: (async () => new Response(null, {
    status: 302,
    headers: {
      location:
        'http://cas-bridge.xethub.hf.co/private-signed-checkpoint-object',
    },
  })) as typeof fetch,
})
await assert.rejects(() => insecureRedirectPort.openPinnedCheckpoint({
  repository: 'facebook/sam3.1',
  revision: 'daa63191845a41281374e725f4c9e51c7a824460',
  fileName: 'sam3.1_multiplex.pt',
  termsAcceptanceRef: ref('terms-ref-insecure-redirect'),
}), /redirect host is not approved/u)

const fakeStorage = new FakeStorage()
const gcsPort = createCanonicalSam31GcsOfficialArtifactPublicationPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  storage: fakeStorage as never,
})
const objectName =
  'private/model-artifacts/sam3_1/checkpoint/test/sam3.1_multiplex.pt'
const gcsCoordinate = await gcsPort.publishCreateOnlyAndReread({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  objectName,
  contentType: 'application/octet-stream',
  body: chunked(checkpointBytes),
  minimumByteLength: checkpointBytes.byteLength,
  maximumByteLength: checkpointBytes.byteLength,
  expectedByteLength: checkpointBytes.byteLength,
  expectedSha256: digest(checkpointBytes),
})
assert.equal(gcsCoordinate.sha256, digest(checkpointBytes))
assert.equal(gcsCoordinate.byteLength, checkpointBytes.byteLength)
await assert.rejects(() => gcsPort.publishCreateOnlyAndReread({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  objectName,
  contentType: 'application/octet-stream',
  body: chunked(checkpointBytes),
  minimumByteLength: checkpointBytes.byteLength,
  maximumByteLength: checkpointBytes.byteLength,
}), /reconciliation is required/u)

const mismatchStorage = new FakeStorage()
const mismatchPort = createCanonicalSam31GcsOfficialArtifactPublicationPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  storage: mismatchStorage as never,
})
await assert.rejects(() => mismatchPort.publishCreateOnlyAndReread({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  objectName:
    'private/model-artifacts/sam3_1/checkpoint/mismatch/sam3.1_multiplex.pt',
  contentType: 'application/octet-stream',
  body: chunked(checkpointBytes),
  minimumByteLength: checkpointBytes.byteLength,
  maximumByteLength: checkpointBytes.byteLength,
  expectedSha256: '0'.repeat(64),
}), /streaming publication failed/u)
assert.equal(mismatchStorage.objectCount(), 0)

const sourceFailureStorage = new FakeStorage()
const sourceFailurePort = createCanonicalSam31GcsOfficialArtifactPublicationPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  storage: sourceFailureStorage as never,
})
await assert.rejects(() => sourceFailurePort.publishCreateOnlyAndReread({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  objectName:
    'private/model-artifacts/sam3_1/source/source-failure/sam3-source.tar',
  contentType: 'application/x-tar',
  body: sourceAcquisitionFailureStream(),
  minimumByteLength: 1,
  maximumByteLength: 1024,
}), /failed \[source_acquisition_failed\]\.$/u)
assert.equal(sourceFailureStorage.objectCount(), 0)

const storageFailurePort = createCanonicalSam31GcsOfficialArtifactPublicationPort({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-model-artifacts',
  storage: new FailingStorage() as never,
})
let safeStorageFailure = ''
try {
  await storageFailurePort.publishCreateOnlyAndReread({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-model-artifacts',
    objectName:
      'private/model-artifacts/sam3_1/source/storage-failure/sam3-source.tar',
    contentType: 'application/x-tar',
    body: chunked(sourceBytes),
    minimumByteLength: sourceBytes.byteLength,
    maximumByteLength: sourceBytes.byteLength,
  })
} catch (error) {
  safeStorageFailure = error instanceof Error ? error.message : String(error)
}
assert.equal(
  safeStorageFailure,
  'SAM 3.1 private artifact streaming publication failed '
    + '[storage_authorization_failed].',
)
assert.doesNotMatch(safeStorageFailure, /hf_|\/Users|source URL/u)

const cliSource = readFileSync(
  'server/cli/canonical-sam3_1-official-artifact-ingest.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}
assert.match(cliSource,
  /CLOUD_RUN_JOB !== EXPECTED_JOB/u)
assert.match(cliSource,
  /publish-official-sam31-artifacts-once/u)
assert.match(cliSource,
  /canonical_private_publication/u)
assert.match(cliSource,
  /canonical_private_reread/u)
assert.match(cliSource,
  /preconditionOpts: \{ ifGenerationMatch: 0 \}/u)
assert.doesNotMatch(cliSource, /hf_[A-Za-z0-9]{20,}/u)
assert.equal(
  packageJson.scripts?.['publish:sam3_1-official-artifacts'],
  'tsx server/cli/canonical-sam3_1-official-artifact-ingest.ts --execute',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-artifact-publication',
  checks: 46,
  cloudOnly: true,
  officialSourcePinned: true,
  officialGatedCheckpointPinned: true,
  currentOfficialUsAwsCdnHostAllowlistedExactly: true,
  authorizationRemovedBeforeRedirect: true,
  createOnlyGcsWrite: true,
  exactGenerationReread: true,
  boundedFailureStageDiagnostics: true,
  rawFailureDetailExcludedFromOperatorLog: true,
  automaticRetryAllowed: false,
  developerMachineInstallAllowed: false,
  imageBuildAuthorized: receipt.authority.imageBuildAuthorized,
  gpuRuntimeAuthorized: receipt.authority.gpuRuntimeAuthorized,
  productionReady: receipt.authority.productionReady,
  publicationReceiptHash: receipt.publicationReceiptHash,
}))

function sourceAcquisitionFailureStream(): AsyncIterable<Uint8Array> {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<Uint8Array>> {
          throw new Error('SAM 3.1 official source acquisition failed.', {
            cause: new Error('private git diagnostic'),
          })
        },
      }
    },
  }
}

function createTerms(
  evidenceClass: 'synthetic_contract_fixture' | 'canonical_private_reread',
) {
  return createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass,
    acceptanceRecordId: `sam31-terms-${evidenceClass}`,
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-03T19:50:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('legal-review'),
    privacyReviewRef: ref('privacy-review'),
    tradeControlsReviewRef: ref('trade-controls-review'),
    termsEvidenceRef: ref('terms-evidence'),
    browserOrWorkerSecretIncluded: false,
  })
}

async function* chunked(bytes: Buffer): AsyncIterable<Uint8Array> {
  const split = Math.max(1, Math.floor(bytes.byteLength / 2))
  yield bytes.subarray(0, split)
  yield bytes.subarray(split)
}

async function collect(body: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of body) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(Buffer.from(id))}`,
  }
}
