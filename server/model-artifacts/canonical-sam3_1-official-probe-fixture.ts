import { z } from 'zod'

import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_VERSION =
  'canonical-sam3_1-official-probe-fixture-v1' as const
export const CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION =
  'canonical-sam3_1-official-probe-fixture-source-port-v1' as const
export const CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION =
  'canonical-sam3_1-official-probe-fixture-publication-port-v1' as const

export const CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE = Object.freeze({
  projectId: 'reeditpro',
  repository: 'https://github.com/facebookresearch/sam3.git',
  revision: '96914d2425f90a64f45ca977c2b5165418099543',
  repositoryPath: 'assets/videos/bedroom.mp4',
  byteLength: 2_380_401,
  sha256: '1be76d5d19b066e8ad7c565d88a98e11a8f8d456a707508a7aa35390def70e30',
  mediaType: 'video/mp4',
  codec: 'h264',
  width: 960,
  height: 540,
  sourceFrameCount: 200,
  sourceFpsNumerator: 30,
  sourceFpsDenominator: 1,
  qualificationFrameCount: 64,
  promptFrameIndex: 0,
  fixedTextPrompt: 'person',
  bucketName: 'reeditpro-production-sam31-qualification-private',
  objectName: 'private/fixtures/sam31/probe-person-v1.mp4',
  kmsKeyName:
    'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
} as const)

export const CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA = Object.freeze({
  weeditproProbeSchemaVersion:
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_VERSION,
  weeditproProbeSourceRevision:
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.revision,
  weeditproProbeSourcePath:
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repositoryPath,
  weeditproProbeSourceSha256:
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256,
  weeditproProbeCodec: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.codec,
  weeditproProbeWidth: String(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.width,
  ),
  weeditproProbeHeight: String(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.height,
  ),
  weeditproProbeSourceFrameCount: String(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFrameCount,
  ),
  weeditproProbeQualificationFrameCount: String(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.qualificationFrameCount,
  ),
  weeditproProbePrompt:
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.fixedTextPrompt,
  weeditproProbeMediaProcessingPerformed: 'false',
  weeditproCustomerMedia: 'false',
})

export function isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName(
  value: unknown,
): value is string {
  if (typeof value !== 'string') return false
  const prefix =
    `${CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName}/cryptoKeyVersions/`
  return value.startsWith(prefix)
    && /^[1-9][0-9]{0,30}$/u.test(value.slice(prefix.length))
}

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const coordinateSchema = z.object({
  projectId: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.projectId),
  bucketName: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.bucketName,
  ),
  objectName: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.objectName,
  ),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(1_024),
  byteLength: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
  ),
  sha256: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256),
  contentType: z.literal('video/mp4'),
  kmsKeyName: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.kmsKeyName,
  ),
  kmsKeyVersionName: z.string().refine(
    isCanonicalSam31OfficialProbeFixtureKmsKeyVersionName,
  ),
  metadata: z.object({
    ...Object.fromEntries(
      Object.entries(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_METADATA)
        .map(([key, value]) => [key, z.literal(value)]),
    ),
  }).strict(),
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_sam3_1_official_probe_fixture_ingest_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  status: z.literal('ready_for_source_checkpoint_qualification'),
  sourceAsset: z.object({
    repository: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repository,
    ),
    revision: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.revision,
    ),
    repositoryPath: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repositoryPath,
    ),
    byteLength: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
    ),
    sha256: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256),
    sourceArtifactRef: evidenceRefSchema,
  }).strict(),
  fixture: z.object({
    artifactRef: evidenceRefSchema,
    coordinate: coordinateSchema,
    codec: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.codec),
    width: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.width),
    height: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.height),
    sourceFrameCount: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFrameCount,
    ),
    sourceFpsNumerator: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFpsNumerator,
    ),
    sourceFpsDenominator: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFpsDenominator,
    ),
    qualificationFrameCount: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.qualificationFrameCount,
    ),
    promptFrameIndex: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.promptFrameIndex,
    ),
    fixedTextPrompt: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.fixedTextPrompt,
    ),
  }).strict(),
  disposition: z.enum(['created', 'identical_replay']),
  runtimeBinding: z.object({
    sourcePortVersion: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION,
    ),
    publicationPortVersion: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION,
    ),
  }).strict(),
  exactPinnedPublicSourceBytesReread: z.literal(true),
  exactPrivateGenerationEtagLengthSha256KmsAndMetadataReread:
    z.literal(true),
  officialPinnedH264AssetReusedWithoutTranscode: z.literal(true),
  sourceMediaDecodedOrTranscodedDuringIngest: z.literal(false),
  gpuOrModelRuntimeStarted: z.literal(false),
  developerMachineArtifactSourceAccepted: z.literal(false),
  callerUrlPathBytesHashCommandOrCredentialsAccepted: z.literal(false),
  customerMediaUsed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  receiptHash: rawSha256,
}).strict()

export type CanonicalSam31OfficialProbeFixtureReceipt = z.infer<
  typeof receiptSchema
>

export interface CanonicalSam31OfficialProbeFixtureSourcePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION
  openExactPinnedFixture(): Promise<{
    readonly contentType: 'application/octet-stream'
    readonly body: AsyncIterable<Uint8Array>
    readonly exactPinnedRevisionPathLengthAndSha256Enforced: true
  }>
}

export interface CanonicalSam31OfficialProbeFixturePublicationPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION
  persistCreateOnlyAndReread(input: {
    readonly body: AsyncIterable<Uint8Array>
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly coordinate: z.infer<typeof coordinateSchema>
  }>
}

export async function publishCanonicalSam31OfficialProbeFixture(input: {
  readonly sourcePort: CanonicalSam31OfficialProbeFixtureSourcePort
  readonly publicationPort: CanonicalSam31OfficialProbeFixturePublicationPort
  readonly publishedAt: string
}): Promise<CanonicalSam31OfficialProbeFixtureReceipt> {
  if (
    input.sourcePort?.schemaVersion !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_SOURCE_PORT_VERSION
    || typeof input.sourcePort.openExactPinnedFixture !== 'function'
    || input.publicationPort?.schemaVersion !==
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_PUBLICATION_PORT_VERSION
    || typeof input.publicationPort.persistCreateOnlyAndReread !== 'function'
  ) throw new Error('SAM 3.1 official probe fixture owner is not configured.')
  const publishedAt = timestamp.parse(input.publishedAt)
  const source = await input.sourcePort.openExactPinnedFixture()
  if (
    source.contentType !== 'application/octet-stream'
    || !source.exactPinnedRevisionPathLengthAndSha256Enforced
    || !source.body
    || !(Symbol.asyncIterator in Object(source.body))
  ) throw new Error('SAM 3.1 official probe fixture source changed.')
  const persisted = await input.publicationPort.persistCreateOnlyAndReread({
    body: source.body,
  })
  const sourceArtifactRef = evidenceRefSchema.parse({
    id: `sam31-official-probe-source-${
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256.slice(0, 24)
    }`,
    version: 1,
    contentHash:
      `sha256:${CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256}`,
  })
  const artifactRef = evidenceRefSchema.parse({
    id: `sam31-qualification-probe-${
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256.slice(0, 24)
    }`,
    version: 1,
    contentHash:
      `sha256:${CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256}`,
  })
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE_VERSION,
    source:
      'canonical_weeditpro_sam3_1_official_probe_fixture_ingest_owner',
    evidenceClass: 'canonical_private_exact_reread',
    status: 'ready_for_source_checkpoint_qualification',
    sourceAsset: {
      repository: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repository,
      revision: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.revision,
      repositoryPath: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.repositoryPath,
      byteLength: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.byteLength,
      sha256: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sha256,
      sourceArtifactRef,
    },
    fixture: {
      artifactRef,
      coordinate: persisted.coordinate,
      codec: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.codec,
      width: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.width,
      height: CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.height,
      sourceFrameCount:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFrameCount,
      sourceFpsNumerator:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFpsNumerator,
      sourceFpsDenominator:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.sourceFpsDenominator,
      qualificationFrameCount:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.qualificationFrameCount,
      promptFrameIndex:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.promptFrameIndex,
      fixedTextPrompt:
        CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.fixedTextPrompt,
    },
    disposition: persisted.disposition,
    runtimeBinding: {
      sourcePortVersion: input.sourcePort.schemaVersion,
      publicationPortVersion: input.publicationPort.schemaVersion,
    },
    exactPinnedPublicSourceBytesReread: true,
    exactPrivateGenerationEtagLengthSha256KmsAndMetadataReread: true,
    officialPinnedH264AssetReusedWithoutTranscode: true,
    sourceMediaDecodedOrTranscodedDuringIngest: false,
    gpuOrModelRuntimeStarted: false,
    developerMachineArtifactSourceAccepted: false,
    callerUrlPathBytesHashCommandOrCredentialsAccepted: false,
    customerMediaUsed: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    publishedAt,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSam31OfficialProbeFixtureReceipt(
  value: unknown,
): CanonicalSam31OfficialProbeFixtureReceipt {
  const parsed = receiptSchema.parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 official probe fixture receipt changed.')
  }
  return Object.freeze(parsed)
}
