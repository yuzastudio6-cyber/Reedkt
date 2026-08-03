import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateObjectReadPort,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

const sourceBytes = Buffer.from('synthetic pinned SAM 3.1 source archive')
const checkpointBytes = Buffer.from('synthetic gated checkpoint fixture')
const sourceSha = digest(sourceBytes)
const checkpointSha = digest(checkpointBytes)
const bucketName = 'reeditpro-production-reeditpro-model-artifacts' as const
const sourceCoordinate = {
  projectId: 'reeditpro' as const,
  bucketName,
  objectName:
    'private/model-artifacts/sam3_1/source/sam3-96914d2425f9.tar',
  generation: '101',
  etag: 'source-etag-101',
  byteLength: sourceBytes.byteLength,
  sha256: sourceSha,
}
const checkpointCoordinate = {
  projectId: 'reeditpro' as const,
  bucketName,
  objectName:
    'private/model-artifacts/sam3_1/checkpoint/sam3.1_multiplex.pt',
  generation: '202',
  etag: 'checkpoint-etag-202',
  byteLength: checkpointBytes.byteLength,
  sha256: checkpointSha,
}

const terms = createCanonicalSam31AuthorizedTermsAcceptance({
  evidenceClass: 'synthetic_contract_fixture',
  acceptanceRecordId: 'sam31-terms-contract-fixture',
  acceptanceRecordVersion: 1,
  sourceRepository: 'https://github.com/facebookresearch/sam3.git',
  checkpointRepository: 'facebook/sam3.1',
  licenseIdentity: 'SAM License',
  licenseLastUpdated: '2025-11-19',
  acceptanceSurface: 'official_hugging_face_gated_repository',
  repositoryGating: 'manual',
  acceptedAt: '2026-08-02T12:00:00.000Z',
  acceptedByAuthorizedOrganizationRepresentative: true,
  authorizedRepresentativeAuthorityRereadVerified: true,
  contactInformationSharingAcceptedByAuthorizedHuman: true,
  officialRepositoryAccessGrantedAndReread: true,
  automatedAcceptanceUsed: false,
  thirdPartyMirrorUsed: false,
  approvedUseCase:
    'private_commercial_video_editing_segmentation_and_tracking',
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
  legalReviewRef: ref('sam31-legal-review'),
  privacyReviewRef: ref('sam31-privacy-review'),
  tradeControlsReviewRef: ref('sam31-trade-controls-review'),
  termsEvidenceRef: ref('sam31-official-terms-evidence'),
  browserOrWorkerSecretIncluded: false,
})

const readPort: CanonicalSam31PrivateObjectReadPort = {
  async readExact(coordinate) {
    if (coordinate.objectName === sourceCoordinate.objectName) {
      return objectRead(sourceCoordinate, sourceBytes, 'application/x-tar')
    }
    if (coordinate.objectName === checkpointCoordinate.objectName) {
      return objectRead(
        checkpointCoordinate,
        chunked(checkpointBytes),
        'application/octet-stream',
      )
    }
    return null
  },
}

const baseInput = {
  ingestReceiptId: 'sam31-ingest-contract-fixture',
  evidenceClass: 'synthetic_contract_fixture' as const,
  candidate: createCanonicalSam31SourceRuntimeCandidate(),
  termsAcceptance: terms,
  officialArtifactPublicationRef: {
    ...ref('sam31-official-artifact-publication'),
    schemaVersion:
      'canonical-sam3_1-official-artifact-publication-receipt-v1' as const,
  },
  sourceArchiveCoordinate: sourceCoordinate,
  sourceArchiveArtifactRef: contentRef('sam31-source-archive', sourceSha),
  sourceLicenseRef: ref('sam31-source-license'),
  sourceSecurityReviewRef: ref('sam31-source-security'),
  sourceMalwareScanRef: ref('sam31-source-malware-scan'),
  sourceUnsignedRevisionAcceptanceRef:
    ref('sam31-source-unsigned-revision-review'),
  checkpointCoordinate,
  checkpointArtifactRef: contentRef('sam31-checkpoint', checkpointSha),
  checkpointManifestRef: ref('sam31-checkpoint-manifest'),
  checkpointLicenseRef: ref('sam31-checkpoint-license'),
  checkpointSecurityReviewRef: ref('sam31-checkpoint-security'),
  checkpointMalwareScanRef: ref('sam31-checkpoint-malware-scan'),
  privateObjectReadPort: readPort,
  preparedAt: '2026-08-02T12:05:00.000Z',
}

const receipt = await prepareCanonicalSam31PrivateArtifactIngestReceipt(
  baseInput,
)
assert.equal(
  assertCanonicalSam31PrivateArtifactIngestReceipt(receipt)
    .ingestReceiptHash,
  receipt.ingestReceiptHash,
)
assert.equal(receipt.evidenceClass, 'synthetic_contract_fixture')
assert.equal(receipt.status, 'contract_validated_only')
assert.equal(receipt.authority.canonicalTermsAcceptanceObserved, false)
assert.equal(receipt.authority.imageBuildReviewEligible, false)
assert.equal(receipt.authority.syntheticEvidenceMayAuthorizeBuild, false)
assert.equal(receipt.authority.imageBuildStarted, false)
assert.equal(receipt.authority.runtimeExecuted, false)
assert.equal(receipt.privateBoundary.thirdPartyMirrorAccepted, false)
assert.equal(receipt.privateBoundary.runtimeNetworkDownloadAllowed, false)
assert.equal(receipt.sourceArchive.archiveFormat,
  'git_archive_tar_uncompressed')
assert.equal(receipt.runtimeClosure.flashAttention3Enabled, false)
assert.equal(receipt.checkpoint.torchWeightsOnlyLoadRequired, true)
assert.equal(receipt.checkpoint.executablePickleTrustGranted, false)

const tampered = structuredClone(receipt)
tampered.authority.runtimeExecuted = true as never
assert.throws(() => assertCanonicalSam31PrivateArtifactIngestReceipt(tampered))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  evidenceClass: 'canonical_private_reread',
}))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  checkpointCoordinate: {
    ...checkpointCoordinate,
    sha256: '0'.repeat(64),
  },
}))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  checkpointCoordinate: {
    ...checkpointCoordinate,
    bucketName: 'reeditpro-private-model-artifacts',
  } as never,
}))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  sourceArchiveCoordinate: {
    ...sourceCoordinate,
    objectName:
      'private/model-artifacts/sam3_1/source/sam3-96914d2425f9.tar.gz',
  },
}))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  privateObjectReadPort: {
    async readExact(coordinate) {
      const body = coordinate.objectName === sourceCoordinate.objectName
        ? sourceBytes
        : checkpointBytes
      return {
        generationBeforeRead: coordinate.generation,
        etagBeforeRead: coordinate.etag,
        contentType: 'application/octet-stream',
        body,
        generationAfterRead: `${Number(coordinate.generation) + 1}`,
        etagAfterRead: coordinate.etag,
      }
    },
  },
}))

await assert.rejects(() => prepareCanonicalSam31PrivateArtifactIngestReceipt({
  ...baseInput,
  checkpointCoordinate: {
    ...checkpointCoordinate,
    objectName: 'private/model-artifacts/sam3_1/checkpoint/mirror.pt',
  },
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-artifact-ingest',
  checks: 24,
  evidenceClass: receipt.evidenceClass,
  status: receipt.status,
  sourceStreamReread: true,
  checkpointStreamReread: true,
  canonicalTermsAcceptanceObserved:
    receipt.authority.canonicalTermsAcceptanceObserved,
  imageBuildReviewEligible: receipt.authority.imageBuildReviewEligible,
  runtimeExecuted: receipt.authority.runtimeExecuted,
  productionReady: receipt.authority.productionReady,
  receiptHash: receipt.ingestReceiptHash,
}))

function objectRead(
  coordinate: typeof sourceCoordinate | typeof checkpointCoordinate,
  body: Buffer | AsyncIterable<Uint8Array>,
  contentType: string,
) {
  return {
    generationBeforeRead: coordinate.generation,
    etagBeforeRead: coordinate.etag,
    contentType,
    body,
    generationAfterRead: coordinate.generation,
    etagAfterRead: coordinate.etag,
  }
}

async function* chunked(bytes: Buffer): AsyncIterable<Uint8Array> {
  yield bytes.subarray(0, 7)
  yield bytes.subarray(7)
}

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest(Buffer.from(id))}`,
  }
}

function contentRef(id: string, sha256: string) {
  return { id, version: 1, contentHash: `sha256:${sha256}` }
}
