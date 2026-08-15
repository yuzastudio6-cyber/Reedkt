import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'

import {
  publishCanonicalSam31OfficialProbeFixture,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'
import {
  createCanonicalSam31GcsOfficialProbeFixturePublicationPort,
  createCanonicalSam31OfficialProbeFixtureSourcePort,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture-runtime'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const PROJECT_ID = 'reeditpro' as const
const EXPECTED_JOB = 'weeditpro-sam31-official-probe-fixture-ingest' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const RECEIPT_PREFIX =
  'private/sam3_1/official-probe-fixture/v1/' as const
const CONFIRMATION = 'publish-official-sam31-probe-fixture-once' as const

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const storage = new Storage({ projectId: PROJECT_ID })
  const receipt = await publishCanonicalSam31OfficialProbeFixture({
    sourcePort: createCanonicalSam31OfficialProbeFixtureSourcePort(),
    publicationPort:
      createCanonicalSam31GcsOfficialProbeFixturePublicationPort({ storage }),
    publishedAt: new Date().toISOString(),
  })
  await persistReceiptExact({ storage, receipt })
  process.stdout.write(`${JSON.stringify({
    operation: 'canonical_sam3_1_official_probe_fixture_ingest',
    status: receipt.status,
    disposition: receipt.disposition,
    fixtureRef: receipt.fixture.artifactRef,
    qualificationFrameCount: receipt.fixture.qualificationFrameCount,
    exactPrivateReread:
      receipt.exactPrivateGenerationEtagLengthSha256KmsAndMetadataReread,
    sourceMediaDecodedOrTranscodedDuringIngest:
      receipt.sourceMediaDecodedOrTranscodedDuringIngest,
    gpuOrModelRuntimeStarted: receipt.gpuOrModelRuntimeStarted,
    customerMediaUsed: receipt.customerMediaUsed,
    customerCreditsMutated: receipt.customerCreditsMutated,
    productionAuthorityGranted: receipt.productionAuthorityGranted,
  })}\n`)
}

function assertCloudOperatorInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !safeId(process.env.CLOUD_RUN_EXECUTION)
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || !safeId(process.env.CLOUD_RUN_TASK_ATTEMPT)
    || process.env.WEEDITPRO_SAM31_OFFICIAL_PROBE_FIXTURE_CONFIRM !==
      CONFIRMATION
  ) throw new Error(
    'SAM 3.1 official probe fixture ingest requires the exact cloud operator.',
  )
}

async function persistReceiptExact(input: {
  readonly storage: Storage
  readonly receipt: Awaited<ReturnType<
    typeof publishCanonicalSam31OfficialProbeFixture
  >>
}): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(input.receipt), 'utf8')
  const objectName = `${RECEIPT_PREFIX}${input.receipt.receiptHash}.json`
  const file = input.storage.bucket(CONTROL_PLANE_BUCKET).file(objectName)
  try {
    await file.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      metadata: { cacheControl: 'private, no-store' },
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'SAM 3.1 official probe receipt persistence failed.',
      { cause: error },
    )
  }
  const [metadata] = await file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || Number(metadata.size ?? -1) !== body.byteLength
    || String(metadata.contentType ?? '') !== 'application/json'
  ) throw new Error('SAM 3.1 official probe receipt metadata changed.')
  const exact = input.storage.bucket(CONTROL_PLANE_BUCKET).file(
    objectName,
    { generation },
  )
  const [reread] = await exact.download({ validation: 'crc32c' })
  const [stableMetadata] = await exact.getMetadata()
  if (
    !reread.equals(body)
    || digest(reread) !== digest(body)
    || String(stableMetadata.generation ?? '') !== generation
    || String(stableMetadata.etag ?? '') !== etag
  ) throw new Error('SAM 3.1 official probe receipt reread changed.')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function safeId(value: string | undefined): value is string {
  return Boolean(
    value
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
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

main().catch((error: unknown) => {
  const code = error instanceof Error
    ? error.message
    : 'sam3_1_official_probe_fixture_ingest_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
