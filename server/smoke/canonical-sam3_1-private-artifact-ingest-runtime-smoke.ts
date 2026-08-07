import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
  canonicalSam31OfficialArtifactPublicationRef,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  createCanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31PrivateArtifactReviewBundle,
  canonicalSam31PrivateArtifactReviewBundleRef,
} from '../model-artifacts/canonical-sam3_1-private-artifact-review'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
} from '../services/canonical-sam3_1-official-artifact-publication-repository'
import {
  CANONICAL_SAM3_1_AUTHENTICATED_ARTIFACT_REVIEW_READ_PORT_VERSION,
  CANONICAL_SAM3_1_AUTHENTICATED_TERMS_READ_PORT_VERSION,
  createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort,
  createCanonicalSam31GcsAuthenticatedTermsReadPort,
  createCanonicalSam31PrivateArtifactIngestRepository,
} from '../services/canonical-sam3_1-private-artifact-ingest-repository'
import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_RUNTIME_VERSION,
  createCanonicalSam31GcpPrivateArtifactIngestRuntime,
  createCanonicalSam31PrivateArtifactIngestRuntime,
} from '../services/canonical-sam3_1-private-artifact-ingest-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { receipt as syntheticPublication } from
  './canonical-sam3_1-official-artifact-publication-smoke'
import { canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const terms = createTerms()
const publication = createPublication()
const publicationRef = canonicalSam31OfficialArtifactPublicationRef(
  publication,
)
const review = createReview()
const reviewRef = canonicalSam31PrivateArtifactReviewBundleRef(review)
const objectStore = memoryObjectPort()
const ingestRepository = createCanonicalSam31PrivateArtifactIngestRepository({
  objectPort: objectStore.port,
})
let publicationReads = 0
let termsReads = 0
let reviewReads = 0
let artifactReads = 0
let prepareCalls = 0
const runtime = createCanonicalSam31PrivateArtifactIngestRuntime({
  publicationRepository: {
    schemaVersion:
      CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_generation_reread',
    async rereadOfficialArtifactPublication({ publicationRef: requested }) {
      publicationReads += 1
      return sameRef(requested, publicationRef)
        ? structuredClone(publication)
        : null
    },
  },
  termsReadPort: {
    schemaVersion: CANONICAL_SAM3_1_AUTHENTICATED_TERMS_READ_PORT_VERSION,
    async rereadAuthenticatedTermsAcceptance({ termsAcceptanceRef }) {
      termsReads += 1
      return sameRef(termsAcceptanceRef, publication.termsAcceptanceRef)
        ? structuredClone(terms)
        : null
    },
  },
  artifactReviewReadPort: {
    schemaVersion:
      CANONICAL_SAM3_1_AUTHENTICATED_ARTIFACT_REVIEW_READ_PORT_VERSION,
    async rereadAuthenticatedArtifactReview({ reviewBundleRef }) {
      reviewReads += 1
      return sameRef(reviewBundleRef, reviewRef)
        ? structuredClone(review)
        : null
    },
  },
  privateArtifactReadPort: {
    async readExact() {
      artifactReads += 1
      throw new Error('Controlled preparer must not consume test artifact bytes.')
    },
  },
  ingestRepository,
  async preparePrivateArtifactIngestReceipt(input) {
    prepareCalls += 1
    return createPreparedIngest(input)
  },
  now: () => '2026-08-06T13:05:00.000Z',
})

assert.equal(runtime.schemaVersion,
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_RUNTIME_VERSION)
assert.equal(runtime.evidenceClass,
  'authenticated_owner_reread_and_create_only_ingest')
const result = await runtime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef: reviewRef,
})
assert.equal(result.disposition, 'created')
assert.equal(result.exactOfficialPublicationTermsReviewAndArtifactReread, true)
assert.equal(result.callerReviewClaimsAccepted, false)
assert.equal(result.modelInstalledOnDeveloperMachine, false)
assert.equal(result.imageBuildStarted, false)
assert.equal(result.gpuRuntimeStarted, false)
assert.equal(result.customerCreditsMutated, false)
assert.equal(result.publicDeliveryAuthorized, false)
assert.equal(result.productionReady, false)
assert.equal(publicationReads, 1)
assert.equal(termsReads, 1)
assert.equal(reviewReads, 1)
assert.equal(prepareCalls, 1)
assert.equal(artifactReads, 0)
assert.equal(objectStore.records.size, 1)
const reread = await ingestRepository.rereadPrivateArtifactIngest({
  ingestReceiptRef: result.ingestReceiptRef,
})
assert(reread)
assert.equal(reread.status, 'ready_for_immutable_image_build_review')
assert.equal(reread.authority.imageBuildStarted, false)
assert.equal(reread.authority.runtimeExecuted, false)

const replay = await runtime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef: reviewRef,
})
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.ingestReceiptRef, result.ingestReceiptRef)
assert.equal(objectStore.records.size, 1)
await assert.rejects(runtime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef: reviewRef,
  sourceObjectName: 'caller/path.tar',
} as never))
assert.equal(prepareCalls, 2)

const missingReviewRuntime = createRuntime({ review: null })
await assert.rejects(missingReviewRuntime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef: reviewRef,
}))

const crossedReview = structuredClone(review)
crossedReview.officialArtifactPublicationRef.id = 'crossed-publication'
recomputeReviewHash(crossedReview)
const crossedRuntime = createRuntime({ review: crossedReview })
await assert.rejects(crossedRuntime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef:
    canonicalSam31PrivateArtifactReviewBundleRef(crossedReview),
}))

const wrongPreparedRuntime = createRuntime({
  mutatePrepared(receipt) {
    receipt.sourceArchive.licenseRef = ref('wrong-license')
    recomputeIngestHash(receipt)
  },
})
await assert.rejects(wrongPreparedRuntime.prepareReviewedPrivateArtifactIngest({
  officialArtifactPublicationRef: publicationRef,
  privateArtifactReviewBundleRef: reviewRef,
}))

const termsBody = Buffer.from(stableAuthorityStringify(terms), 'utf8')
const reviewBody = Buffer.from(stableAuthorityStringify(review), 'utf8')
let authenticatedMetadataReads = 0
let authenticatedDownloads = 0
const authenticatedStorage = exactJsonStorage(new Map([
  [recordPath('private/sam3_1/terms-acceptance/v1', {
    id: terms.acceptanceRecordId,
    contentHash: `sha256:${terms.acceptanceRecordHash}`,
  }), termsBody],
  [recordPath('private/sam3_1/artifact-review/v1', reviewRef), reviewBody],
]))
const termsPort = createCanonicalSam31GcsAuthenticatedTermsReadPort({
  storage: authenticatedStorage as never,
})
const reviewPort = createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort({
  storage: authenticatedStorage as never,
})
assert.deepEqual(await termsPort.rereadAuthenticatedTermsAcceptance({
  termsAcceptanceRef: publication.termsAcceptanceRef,
}), terms)
assert.deepEqual(await reviewPort.rereadAuthenticatedArtifactReview({
  reviewBundleRef: reviewRef,
}), review)
assert.equal(authenticatedMetadataReads, 4)
assert.equal(authenticatedDownloads, 2)
await assert.rejects(termsPort.rereadAuthenticatedTermsAcceptance({
  termsAcceptanceRef: publication.termsAcceptanceRef,
  objectName: 'caller/path.json',
} as never))

let cloudReads = 0
createCanonicalSam31GcpPrivateArtifactIngestRuntime({
  storage: {
    bucket() {
      return {
        file() {
          return {
            async getMetadata() {
              cloudReads += 1
              throw new Error('No cloud read allowed on construction.')
            },
          }
        },
      }
    },
  } as never,
})
assert.equal(cloudReads, 0)

let hostileGetterRead = false
const accessorReview = structuredClone(review) as Record<string, unknown>
Object.defineProperty(accessorReview, 'source', {
  enumerable: true,
  get() {
    hostileGetterRead = true
    return review.source
  },
})
assert.throws(() =>
  assertCanonicalSam31PrivateArtifactReviewBundle(accessorReview))
assert.equal(hostileGetterRead, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-artifact-ingest-runtime',
  checks: 47,
  officialPublicationReread: true,
  authenticatedTermsReread: true,
  authenticatedArtifactReviewReread: true,
  exactArtifactCoordinatesBound: true,
  ingestReceiptCreateOnlyAndReread: true,
  callerReviewClaimsAccepted: false,
  checkpointMaterializedOnDeveloperMachine: false,
  imageBuildStarted: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createTerms() {
  return createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass: 'canonical_private_reread',
    acceptanceRecordId: 'sam31-terms-canonical-001',
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-06T11:00:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-terms-legal'),
    privacyReviewRef: ref('sam31-terms-privacy'),
    tradeControlsReviewRef: ref('sam31-terms-trade-controls'),
    termsEvidenceRef: ref('sam31-terms-browser-evidence'),
    browserOrWorkerSecretIncluded: false,
  })
}

function createPublication() {
  const clone = structuredClone(syntheticPublication)
  clone.evidenceClass = 'canonical_private_publication'
  clone.status =
    'published_pending_security_license_and_compatibility_review'
  clone.termsAcceptanceRef = {
    id: terms.acceptanceRecordId,
    version: terms.acceptanceRecordVersion,
    contentHash: `sha256:${terms.acceptanceRecordHash}`,
  }
  clone.sourceArchive.coordinate.byteLength = 73_605_120
  clone.sourceArchive.coordinate.sha256 =
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
  clone.sourceArchive.expectedByteLengthAndSha256Enforced = true
  clone.checkpoint.coordinate.byteLength = 3_502_755_717
  clone.checkpoint.coordinate.sha256 =
    '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6'
  clone.checkpoint.authorizedHumanTermsAcceptanceReread = true
  clone.checkpoint.accessTokenReadFromPinnedSecretVersion = true
  clone.runtimeBinding.officialArtifactStreamPortVersion =
    'canonical-sam3_1-official-artifact-stream-runtime-v1'
  clone.runtimeBinding.privateArtifactPublicationPortVersion =
    'canonical-sam3_1-gcs-official-artifact-publication-port-v1'
  clone.publishedAt = '2026-08-06T12:00:00.000Z'
  const payload = structuredClone(clone) as Record<string, unknown>
  delete payload.publicationReceiptHash
  return assertCanonicalSam31OfficialArtifactPublicationReceipt({
    ...payload,
    publicationReceiptHash: sha256AuthorityValue(payload),
  })
}

function createReview() {
  const payload = {
    schemaVersion:
      'canonical-sam3_1-private-artifact-review-bundle-v1' as const,
    source:
      'canonical_weeditpro_sam3_1_private_artifact_review_owner' as const,
    evidenceClass: 'authenticated_private_owner_reread' as const,
    status: 'approved_for_private_artifact_ingest' as const,
    reviewBundleId: 'sam31-private-artifact-review-001',
    reviewBundleVersion: 1 as const,
    officialArtifactPublicationRef: publicationRef,
    candidateRef: {
      id: `sam31-source-runtime-candidate-${
        candidate.candidateHash.slice(0, 24)
      }`,
      version: 1 as const,
      schemaVersion: candidate.schemaVersion,
      contentHash: `sha256:${candidate.candidateHash}` as const,
    },
    termsAcceptanceRef: publication.termsAcceptanceRef,
    sourceArchive: {
      coordinate: publication.sourceArchive.coordinate,
      artifactRef: contentRef('sam31-reviewed-source',
        publication.sourceArchive.coordinate.sha256),
      licenseRef: ref('sam31-source-license-review'),
      securityReviewRef: ref('sam31-source-security-review'),
      malwareScanRef: ref('sam31-source-malware-review'),
      unsignedSourceRevisionAcceptanceRef:
        ref('sam31-source-unsigned-revision-acceptance'),
      licenseApprovedForWeEditProPrivateCommercialUse: true as const,
      securityReviewPassed: true as const,
      malwareScanPassed: true as const,
      unsignedPinnedRevisionAccepted: true as const,
    },
    checkpoint: {
      coordinate: publication.checkpoint.coordinate,
      artifactRef: contentRef('sam31-reviewed-checkpoint',
        publication.checkpoint.coordinate.sha256),
      manifestRef: ref('sam31-checkpoint-manifest-review'),
      licenseRef: ref('sam31-checkpoint-license-review'),
      securityReviewRef: ref('sam31-checkpoint-security-review'),
      malwareScanRef: ref('sam31-checkpoint-malware-review'),
      manifestBindsExactCoordinateShaAndLength: true as const,
      licenseApprovedForWeEditProPrivateCommercialUse: true as const,
      securityReviewPassed: true as const,
      malwareScanPassed: true as const,
      torchWeightsOnlyLoadRequired: true as const,
      executablePickleTrustGranted: false as const,
    },
    reviewBoundary: {
      exactPublishedSourceAndCheckpointCoordinatesReviewed: true as const,
      officialGatedCheckpointOnly: true as const,
      thirdPartyMirrorAccepted: false as const,
      callerReviewClaimsAccepted: false as const,
      callerUrlPathBytesOrCredentialsAccepted: false as const,
      termsAuthorityRemainsExternal: true as const,
      securityLicenseAndMalwareOwnersRemainExternal: true as const,
    },
    authority: {
      authenticatedReviewEvidenceOnly: true as const,
      artifactIngestReceiptCreated: false as const,
      imageBuildAuthorized: false as const,
      gpuRuntimeAuthorized: false as const,
      providerOrModelExecuted: false as const,
      customerCreditsMutated: false as const,
      qaApproved: false as const,
      publicDeliveryAuthorized: false as const,
      productionReady: false as const,
    },
    reviewedAt: '2026-08-06T13:00:00.000Z',
  }
  return assertCanonicalSam31PrivateArtifactReviewBundle({
    ...payload,
    reviewBundleHash: sha256AuthorityValue(payload),
  })
}

function createPreparedIngest(input: Parameters<
  Parameters<typeof createCanonicalSam31PrivateArtifactIngestRuntime>[0][
    'preparePrivateArtifactIngestReceipt'
  ]
>[0]) {
  const clone = structuredClone(canonicalIngest)
  clone.ingestReceiptId = input.ingestReceiptId
  clone.candidateRef = {
    schemaVersion: input.candidate.schemaVersion,
    candidateHash: input.candidate.candidateHash,
  }
  clone.officialArtifactPublicationRef = input.officialArtifactPublicationRef
  clone.termsAcceptanceRef = {
    id: input.termsAcceptance.acceptanceRecordId,
    version: input.termsAcceptance.acceptanceRecordVersion,
    contentHash: `sha256:${input.termsAcceptance.acceptanceRecordHash}`,
  }
  clone.termsAcceptanceRecordHash = input.termsAcceptance.acceptanceRecordHash
  clone.sourceArchive.coordinate = input.sourceArchiveCoordinate
  clone.sourceArchive.artifactRef = input.sourceArchiveArtifactRef
  clone.sourceArchive.licenseRef = input.sourceLicenseRef
  clone.sourceArchive.securityReviewRef = input.sourceSecurityReviewRef
  clone.sourceArchive.malwareScanRef = input.sourceMalwareScanRef
  clone.sourceArchive.unsignedSourceRevisionAcceptanceRef =
    input.sourceUnsignedRevisionAcceptanceRef
  clone.checkpoint.coordinate = input.checkpointCoordinate
  clone.checkpoint.artifactRef = input.checkpointArtifactRef
  clone.checkpoint.manifestRef = input.checkpointManifestRef
  clone.checkpoint.licenseRef = input.checkpointLicenseRef
  clone.checkpoint.securityReviewRef = input.checkpointSecurityReviewRef
  clone.checkpoint.malwareScanRef = input.checkpointMalwareScanRef
  clone.preparedAt = input.preparedAt
  recomputeIngestHash(clone)
  return Promise.resolve(assertCanonicalSam31PrivateArtifactIngestReceipt(clone))
}

function createRuntime(input: {
  review?: typeof review | null
  mutatePrepared?: (receipt: typeof canonicalIngest) => void
}) {
  const selectedReview = input.review === undefined ? review : input.review
  const store = memoryObjectPort()
  return createCanonicalSam31PrivateArtifactIngestRuntime({
    publicationRepository: {
      schemaVersion:
        CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_REPOSITORY_VERSION,
      evidenceClass: 'private_create_only_exact_generation_reread',
      async rereadOfficialArtifactPublication() {
        return structuredClone(publication)
      },
    },
    termsReadPort: {
      schemaVersion: 'controlled-authenticated-terms-read-v1',
      async rereadAuthenticatedTermsAcceptance() {
        return structuredClone(terms)
      },
    },
    artifactReviewReadPort: {
      schemaVersion: 'controlled-authenticated-review-read-v1',
      async rereadAuthenticatedArtifactReview() {
        return selectedReview ? structuredClone(selectedReview) : null
      },
    },
    privateArtifactReadPort: { async readExact() { return null } },
    ingestRepository: createCanonicalSam31PrivateArtifactIngestRepository({
      objectPort: store.port,
    }),
    async preparePrivateArtifactIngestReceipt(preparedInput) {
      const receipt = await createPreparedIngest(preparedInput)
      input.mutatePrepared?.(receipt as typeof canonicalIngest)
      return receipt
    },
    now: () => '2026-08-06T13:05:00.000Z',
  })
}

function recomputeReviewHash(value: typeof review): void {
  const payload = structuredClone(value) as Record<string, unknown>
  delete payload.reviewBundleHash
  value.reviewBundleHash = sha256AuthorityValue(payload)
  assertCanonicalSam31PrivateArtifactReviewBundle(value)
}

function recomputeIngestHash(value: typeof canonicalIngest): void {
  const payload = structuredClone(value) as Record<string, unknown>
  delete payload.ingestReceiptHash
  value.ingestReceiptHash = sha256AuthorityValue(payload)
  assertCanonicalSam31PrivateArtifactIngestReceipt(value)
}

function memoryObjectPort(): {
  readonly records: Map<string, Buffer>
  readonly port: CanonicalCreateOnlyJsonObjectPort
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (digest(prior) !== input.contentSha256) {
            throw new Error('Controlled private ingest collision.')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(path) {
        const value = records.get(path)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function exactJsonStorage(records: Map<string, Buffer>) {
  return {
    bucket(bucketName: string) {
      assert.equal(bucketName,
        'reeditpro-production-reeditpro-control-plane-state')
      return {
        file(objectName: string, options?: { generation?: string }) {
          const body = records.get(objectName)
          return {
            async getMetadata() {
              if (!body) throw Object.assign(new Error('missing'), { code: 404 })
              authenticatedMetadataReads += 1
              return [{
                generation: '81',
                etag: `etag-${digest(body).slice(0, 16)}`,
                size: String(body.byteLength),
                contentType: 'application/json',
              }]
            },
            async download() {
              assert.equal(options?.generation, '81')
              if (!body) throw new Error('missing')
              authenticatedDownloads += 1
              return [Buffer.from(body)]
            },
          }
        },
      }
    },
  }
}

function recordPath(
  prefix: string,
  value: { id: string; contentHash: string },
): string {
  const hash = value.contentHash.slice('sha256:'.length)
  return `${prefix}/${value.id}-${hash.slice(0, 24)}.json`
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function contentRef(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
