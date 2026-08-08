import { createHash } from 'node:crypto'

import { IdempotencyStrategy, Storage } from '@google-cloud/storage'

import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
  isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName,
  type CanonicalSam31OfficialProbeFixturePublicationPort,
  type CanonicalSam31OfficialProbeFixtureSourcePort,
} from './canonical-sam3_1-official-probe-fixture'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const EXPECTED_CLOUD_RUN_JOB =
  'weeditpro-sam31-official-probe-fixture-ingest' as const
const SOURCE_URL =
  `https://raw.githubusercontent.com/facebookresearch/sam3/${
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.revision
  }/${CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repositoryPath}` as const

export function createCanonicalSam31OfficialProbeFixtureSourcePort(input: {
  readonly fetchImpl?: typeof fetch
  readonly runtimeEnvironment?: Readonly<Record<string, string | undefined>>
} = {}): CanonicalSam31OfficialProbeFixtureSourcePort {
  const fetchImpl = input.fetchImpl ?? fetch
  const environment = input.runtimeEnvironment ?? process.env
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
    async openExactPinnedFixture() {
      assertDedicatedCloudJob(environment)
      const response = await fetchImpl(SOURCE_URL, {
        method: 'GET',
        redirect: 'error',
        headers: {
          Accept: 'application/octet-stream',
          'User-Agent': 'WeEditPro-SAM31-Probe-Fixture-Ingest/1.0',
        },
        signal: AbortSignal.timeout(5 * 60 * 1000),
      })
      if (
        response.status !== 200
        || response.url !== SOURCE_URL
        || response.headers.get('content-type') !== 'application/octet-stream'
        || response.headers.get('content-length') !== String(
          CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
        )
        || !response.body
      ) throw new Error('SAM 3.1 official probe source response changed.')
      return Object.freeze({
        contentType: 'application/octet-stream' as const,
        body: exactBoundedSourceBody(response.body),
        exactPinnedRevisionPathLengthAndSha256Enforced: true as const,
      })
    },
  })
}

export function createCanonicalSam31GcsOfficialProbeFixturePublicationPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31OfficialProbeFixturePublicationPort {
  const storage = input.storage ?? new Storage({
    projectId: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.projectId,
    retryOptions: {
      autoRetry: false,
      maxRetries: 0,
      idempotencyStrategy: IdempotencyStrategy.RetryNever,
    },
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
    async persistCreateOnlyAndReread(value: {
      readonly body: AsyncIterable<Uint8Array>
    }) {
      const bytes = await readExactBody(value.body)
      const bucket = storage.bucket(
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.bucketName,
      )
      const file = bucket.file(
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.objectName,
        {
          kmsKeyName:
            CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName,
        },
      )
      let disposition: 'created' | 'identical_replay' = 'created'
      try {
        await file.save(bytes, {
          resumable: false,
          validation: 'crc32c',
          contentType: 'video/mp4',
          metadata: {
            cacheControl: 'private, no-store',
            metadata: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
          },
          preconditionOpts: { ifGenerationMatch: 0 },
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw new Error(
          'SAM 3.1 official probe private publication failed.',
          { cause: error },
        )
        disposition = 'identical_replay'
      }
      const coordinate = await rereadExactPrivateFixture({ file, bytes })
      return Object.freeze({ disposition, coordinate })
    },
  })
}

async function* exactBoundedSourceBody(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<Uint8Array> {
  const digest = createHash('sha256')
  let byteLength = 0
  for await (const value of stream) {
    if (!(value instanceof Uint8Array) || value.byteLength < 1) {
      throw new Error('SAM 3.1 official probe source stream is invalid.')
    }
    byteLength += value.byteLength
    if (byteLength > CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength) {
      throw new Error('SAM 3.1 official probe source exceeded its bound.')
    }
    digest.update(value)
    yield value
  }
  if (
    byteLength !== CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength
    || digest.digest('hex') !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256
  ) throw new Error('SAM 3.1 official probe source bytes changed.')
}

async function readExactBody(
  body: AsyncIterable<Uint8Array>,
): Promise<Buffer> {
  const chunks: Buffer[] = []
  const digest = createHash('sha256')
  let byteLength = 0
  for await (const value of body) {
    if (!(value instanceof Uint8Array) || value.byteLength < 1) {
      throw new Error('SAM 3.1 official probe publication body is invalid.')
    }
    const chunk = Buffer.from(value)
    byteLength += chunk.byteLength
    if (byteLength > CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength) {
      throw new Error('SAM 3.1 official probe publication body exceeded.')
    }
    digest.update(chunk)
    chunks.push(chunk)
  }
  if (
    byteLength !== CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength
    || digest.digest('hex') !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256
  ) throw new Error('SAM 3.1 official probe publication bytes changed.')
  return Buffer.concat(chunks, byteLength)
}

async function rereadExactPrivateFixture(input: {
  readonly file: ReturnType<ReturnType<Storage['bucket']>['file']>
  readonly bytes: Buffer
}) {
  const [metadataBefore] = await input.file.getMetadata()
  const generation = String(metadataBefore.generation ?? '')
  const etag = String(metadataBefore.etag ?? '')
  const kmsKeyVersionName = String(metadataBefore.kmsKeyName ?? '')
  if (!/^[1-9][0-9]{0,30}$/u.test(generation) || !etag) {
    throw new Error('SAM 3.1 official probe private coordinate is invalid.')
  }
  if (!isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName(
    kmsKeyVersionName,
  )) throw new Error('SAM 3.1 official probe CMEK version is invalid.')
  const exact = input.file.parent.file(input.file.name, { generation })
  const [reread] = await exact.download({ validation: 'crc32c' })
  const [metadataAfter] = await exact.getMetadata()
  const metadata = metadataAfter.metadata ?? {}
  if (
    !reread.equals(input.bytes)
    || reread.byteLength !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength
    || createHash('sha256').update(reread).digest('hex') !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256
    || String(metadataAfter.generation ?? '') !== generation
    || String(metadataAfter.etag ?? '') !== etag
    || Number(metadataAfter.size ?? -1) !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength
    || String(metadataAfter.contentType ?? '') !== 'video/mp4'
    || String(metadataAfter.kmsKeyName ?? '') !== kmsKeyVersionName
    || stableAuthorityStringify(metadata) !== stableAuthorityStringify(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
    )
  ) throw new Error('SAM 3.1 official probe private reread changed.')
  return Object.freeze({
    projectId: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.projectId,
    bucketName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.bucketName,
    objectName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.objectName,
    generation,
    etag,
    byteLength: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
    sha256: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256,
    contentType: 'video/mp4' as const,
    kmsKeyName: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName,
    kmsKeyVersionName,
    metadata: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA,
  })
}

function assertDedicatedCloudJob(
  environment: Readonly<Record<string, string | undefined>>,
): void {
  if (
    environment.CLOUD_RUN_JOB !== EXPECTED_CLOUD_RUN_JOB
    || !safeRuntimeValue(environment.CLOUD_RUN_EXECUTION)
    || environment.CLOUD_RUN_TASK_INDEX !== '0'
    || !safeRuntimeValue(environment.CLOUD_RUN_TASK_ATTEMPT)
  ) throw new Error('SAM 3.1 official probe ingest is cloud-job-only.')
}

function safeRuntimeValue(value: string | undefined): value is string {
  return Boolean(
    value
    && value.length <= 240
    && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value)
    && !value.includes('..'),
  )
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return
  const code = Reflect.get(error, 'code')
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^[0-9]{3}$/u.test(code)) {
    return Number.parseInt(code, 10)
  }
}
