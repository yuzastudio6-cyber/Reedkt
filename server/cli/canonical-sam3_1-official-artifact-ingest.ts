import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'

import {
  canonicalSam31OfficialArtifactPublicationRef,
  publishCanonicalSam31OfficialPrivateArtifacts,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  createCanonicalSam31GcsOfficialArtifactPublicationPort,
} from '../model-artifacts/canonical-sam3_1-gcs-official-artifact-publication'
import {
  createCanonicalSam31CloudOfficialArtifactStreamPort,
} from '../model-artifacts/canonical-sam3_1-official-artifact-stream-runtime'
import {
  assertCanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import { stableAuthorityStringify } from '../services/private-edit-authority-store'

const PROJECT_ID = 'reeditpro' as const
const EXPECTED_JOB = 'weeditpro-sam31-official-artifact-ingest' as const
const MODEL_ARTIFACT_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const TERMS_PREFIX = 'private/sam3_1/terms-acceptance/v1/' as const
const RECEIPT_PREFIX =
  'private/sam3_1/official-artifact-publication/v1/' as const
const CONFIRMATION = 'publish-official-sam31-artifacts-once' as const

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const configuration = readConfiguration()
  const storage = new Storage({ projectId: PROJECT_ID })
  const termsAcceptance = await readExactTermsAcceptance({
    storage,
    objectName: configuration.termsObjectName,
    generation: configuration.termsGeneration,
    etag: configuration.termsEtag,
    byteLength: configuration.termsByteLength,
    sha256: configuration.termsSha256,
  })
  const receipt = await publishCanonicalSam31OfficialPrivateArtifacts({
    publicationAttemptId: configuration.publicationAttemptId,
    evidenceClass: 'canonical_private_publication',
    candidate: createCanonicalSam31SourceRuntimeCandidate(),
    termsAcceptance,
    officialArtifactStreamPort:
      createCanonicalSam31CloudOfficialArtifactStreamPort({
        secretResourceName: configuration.secretResourceName,
      }),
    privateArtifactPublicationPort:
      createCanonicalSam31GcsOfficialArtifactPublicationPort({
        projectId: PROJECT_ID,
        bucketName: MODEL_ARTIFACT_BUCKET,
        storage,
      }),
    publishedAt: new Date().toISOString(),
  })
  await persistReceiptExact({ storage, receipt })
  const receiptRef = canonicalSam31OfficialArtifactPublicationRef(receipt)
  process.stdout.write(`${JSON.stringify({
    operation: 'canonical_sam3_1_official_artifact_ingest',
    status: receipt.status,
    publicationRef: receiptRef,
    sourceArchive: {
      byteLength: receipt.sourceArchive.coordinate.byteLength,
      sha256: receipt.sourceArchive.coordinate.sha256,
    },
    checkpoint: {
      byteLength: receipt.checkpoint.coordinate.byteLength,
      sha256: receipt.checkpoint.coordinate.sha256,
    },
    securityScanPassed: receipt.authority.securityScanPassed,
    licenseReviewApproved: receipt.authority.licenseReviewApproved,
    sourceCheckpointCompatibilityQualified:
      receipt.authority.sourceCheckpointCompatibilityQualified,
    imageBuildAuthorized: receipt.authority.imageBuildAuthorized,
    gpuRuntimeAuthorized: receipt.authority.gpuRuntimeAuthorized,
    customerCreditsMutated: receipt.authority.customerCreditsMutated,
    productionReady: receipt.authority.productionReady,
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
    || process.env.WEEDITPRO_SAM31_OFFICIAL_ARTIFACT_INGEST_CONFIRM
      !== CONFIRMATION
  ) throw new Error(
    'SAM 3.1 artifact ingest requires the exact dedicated cloud operator confirmation.',
  )
}

function readConfiguration(): {
  readonly publicationAttemptId: string
  readonly secretResourceName: string
  readonly termsObjectName: string
  readonly termsGeneration: string
  readonly termsEtag: string
  readonly termsByteLength: number
  readonly termsSha256: string
} {
  const publicationAttemptId = process.env
    .WEEDITPRO_SAM31_PUBLICATION_ATTEMPT_ID
  const secretResourceName = process.env
    .WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME
  const termsObjectName = process.env
    .WEEDITPRO_SAM31_TERMS_ACCEPTANCE_OBJECT_NAME
  const termsGeneration = process.env
    .WEEDITPRO_SAM31_TERMS_ACCEPTANCE_GENERATION
  const termsEtag = process.env.WEEDITPRO_SAM31_TERMS_ACCEPTANCE_ETAG
  const termsSha256 = process.env
    .WEEDITPRO_SAM31_TERMS_ACCEPTANCE_SHA256
  const termsByteLength = Number(process.env
    .WEEDITPRO_SAM31_TERMS_ACCEPTANCE_BYTE_LENGTH)
  if (
    !safeId(publicationAttemptId)
    || !secretResourceName
    || !/^projects\/reeditpro\/secrets\/(?:HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)\/versions\/[1-9][0-9]*$/u
      .test(secretResourceName)
    || !termsObjectName?.startsWith(TERMS_PREFIX)
    || termsObjectName.includes('..')
    || termsObjectName.includes('\\')
    || termsObjectName.includes('//')
    || !termsObjectName.endsWith('.json')
    || !/^[1-9][0-9]{0,30}$/u.test(termsGeneration ?? '')
    || !termsEtag
    || !/^[a-f0-9]{64}$/u.test(termsSha256 ?? '')
    || !Number.isSafeInteger(termsByteLength)
    || termsByteLength < 1
    || termsByteLength > 512 * 1024
  ) throw new Error('SAM 3.1 artifact ingest configuration is invalid.')
  return {
    publicationAttemptId,
    secretResourceName,
    termsObjectName,
    termsGeneration: termsGeneration!,
    termsEtag,
    termsByteLength,
    termsSha256: termsSha256!,
  }
}

async function readExactTermsAcceptance(input: {
  readonly storage: Storage
  readonly objectName: string
  readonly generation: string
  readonly etag: string
  readonly byteLength: number
  readonly sha256: string
}) {
  const file = input.storage.bucket(CONTROL_PLANE_BUCKET).file(
    input.objectName,
    { generation: input.generation },
  )
  const [metadataBefore] = await file.getMetadata()
  if (
    String(metadataBefore.generation ?? '') !== input.generation
    || String(metadataBefore.etag ?? '') !== input.etag
    || String(metadataBefore.contentType ?? '') !== 'application/json'
    || Number(metadataBefore.size ?? -1) !== input.byteLength
  ) throw new Error('SAM 3.1 terms acceptance metadata changed.')
  const [body] = await file.download({ validation: 'crc32c' })
  const [metadataAfter] = await file.getMetadata()
  if (
    body.byteLength !== input.byteLength
    || digest(body) !== input.sha256
    || String(metadataAfter.generation ?? '') !== input.generation
    || String(metadataAfter.etag ?? '') !== input.etag
  ) throw new Error('SAM 3.1 terms acceptance exact reread failed.')
  let parsed: unknown
  try {
    parsed = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 terms acceptance JSON is invalid.')
  }
  const terms = assertCanonicalSam31AuthorizedTermsAcceptance(parsed)
  if (terms.evidenceClass !== 'canonical_private_reread') {
    throw new Error('SAM 3.1 terms acceptance is not canonical evidence.')
  }
  return terms
}

async function persistReceiptExact(input: {
  readonly storage: Storage
  readonly receipt: Awaited<ReturnType<
    typeof publishCanonicalSam31OfficialPrivateArtifacts
  >>
}): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(input.receipt), 'utf8')
  const objectName = `${RECEIPT_PREFIX}${
    input.receipt.publicationAttemptId
  }-${input.receipt.publicationReceiptHash.slice(0, 24)}.json`
  const bucket = input.storage.bucket(CONTROL_PLANE_BUCKET)
  const liveFile = bucket.file(objectName, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  try {
    await liveFile.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'SAM 3.1 publication receipt persistence failed.',
      { cause: error },
    )
  }
  const [metadata] = await liveFile.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || Number(metadata.size ?? -1) !== body.byteLength
    || String(metadata.contentType ?? '') !== 'application/json'
  ) throw new Error('SAM 3.1 publication receipt metadata is invalid.')
  const exactFile = bucket.file(objectName, { generation })
  const [reread] = await exactFile.download({ validation: 'crc32c' })
  const [stableMetadata] = await exactFile.getMetadata()
  if (
    !reread.equals(body)
    || digest(reread) !== digest(body)
    || String(stableMetadata.generation ?? '') !== generation
    || String(stableMetadata.etag ?? '') !== etag
  ) throw new Error('SAM 3.1 publication receipt exact reread failed.')
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function safeId(value: string | undefined): value is string {
  return Boolean(
    value
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u.test(value)
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
    : 'sam3_1_official_artifact_ingest_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
