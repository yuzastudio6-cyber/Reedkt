import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31AuthorizedTermsAcceptance,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateObjectReadPort,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31GcsPrivateArtifactReadPort,
} from '../model-artifacts/canonical-sam3_1-gcs-official-artifact-publication'
import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
  canonicalSam31OfficialArtifactPublicationRef,
} from '../model-artifacts/canonical-sam3_1-official-artifact-publication'
import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  assertCanonicalSam31PrivateArtifactReviewBundle,
  canonicalSam31PrivateArtifactReviewBundleRef,
} from '../model-artifacts/canonical-sam3_1-private-artifact-review'
import {
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalSam31GcsOfficialArtifactPublicationRepository,
  type CanonicalSam31OfficialArtifactPublicationRepository,
} from './canonical-sam3_1-official-artifact-publication-repository'
import {
  createCanonicalSam31GcpPrivateArtifactIngestRepository,
  createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort,
  createCanonicalSam31GcsAuthenticatedTermsReadPort,
  type CanonicalSam31AuthenticatedArtifactReviewReadPort,
  type CanonicalSam31AuthenticatedTermsReadPort,
  type CanonicalSam31PrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_RUNTIME_VERSION =
  'canonical-sam3_1-private-artifact-ingest-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const MODEL_ARTIFACT_BUCKET =
  'reeditpro-production-reeditpro-model-artifacts' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const publicationRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  ),
}).strict()
const reviewRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  ),
}).strict()

export interface CanonicalSam31PrivateArtifactIngestRuntime {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_RUNTIME_VERSION
  readonly evidenceClass: 'authenticated_owner_reread_and_create_only_ingest'
  prepareReviewedPrivateArtifactIngest(input: {
    readonly officialArtifactPublicationRef:
      z.infer<typeof publicationRefSchema>
    readonly privateArtifactReviewBundleRef: z.infer<typeof reviewRefSchema>
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly ingestReceiptRef: {
      readonly id: string
      readonly version: 1
      readonly schemaVersion:
        'canonical-sam3_1-private-artifact-ingest-receipt-v3'
      readonly contentHash: `sha256:${string}`
    }
    readonly exactOfficialPublicationTermsReviewAndArtifactReread: true
    readonly callerReviewClaimsAccepted: false
    readonly modelInstalledOnDeveloperMachine: false
    readonly imageBuildStarted: false
    readonly gpuRuntimeStarted: false
    readonly customerCreditsMutated: false
    readonly publicDeliveryAuthorized: false
    readonly productionReady: false
  }>
}

/**
 * Converts authenticated, independent terms and security-owner evidence into
 * an immutable private ingest receipt. The caller supplies only opaque refs;
 * it cannot supply artifact coordinates, review claims, paths, bytes, or URLs.
 */
export function createCanonicalSam31PrivateArtifactIngestRuntime(input: {
  readonly publicationRepository:
    CanonicalSam31OfficialArtifactPublicationRepository
  readonly termsReadPort: CanonicalSam31AuthenticatedTermsReadPort
  readonly artifactReviewReadPort:
    CanonicalSam31AuthenticatedArtifactReviewReadPort
  readonly privateArtifactReadPort: CanonicalSam31PrivateObjectReadPort
  readonly ingestRepository: CanonicalSam31PrivateArtifactIngestRepository
  readonly preparePrivateArtifactIngestReceipt:
    typeof prepareCanonicalSam31PrivateArtifactIngestReceipt
  readonly now: () => string
}): CanonicalSam31PrivateArtifactIngestRuntime {
  assertPorts(input)
  const runtime: CanonicalSam31PrivateArtifactIngestRuntime = {
    schemaVersion: CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_RUNTIME_VERSION,
    evidenceClass: 'authenticated_owner_reread_and_create_only_ingest',
    async prepareReviewedPrivateArtifactIngest(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_private_ingest_runtime')
      const request = z.object({
        officialArtifactPublicationRef: publicationRefSchema,
        privateArtifactReviewBundleRef: reviewRefSchema,
      }).strict().parse(untrusted)
      const publication =
        assertCanonicalSam31OfficialArtifactPublicationReceipt(
          await input.publicationRepository
            .rereadOfficialArtifactPublication({
              publicationRef: request.officialArtifactPublicationRef,
            }),
        )
      const canonicalPublicationRef =
        canonicalSam31OfficialArtifactPublicationRef(publication)
      if (
        publication.evidenceClass !== 'canonical_private_publication'
        || publication.status !==
          'published_pending_security_license_and_compatibility_review'
        || !sameRef(canonicalPublicationRef,
          request.officialArtifactPublicationRef)
      ) throw new Error('SAM 3.1 official publication is not admissible.')

      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      const candidateRef = {
        id: `sam31-source-runtime-candidate-${
          candidate.candidateHash.slice(0, 24)
        }`,
        version: 1 as const,
        schemaVersion:
          CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
        contentHash: `sha256:${candidate.candidateHash}` as const,
      }
      if (!sameRef(publication.candidateRef, candidateRef)) {
        throw new Error('SAM 3.1 publication candidate is stale.')
      }

      const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
        await input.termsReadPort.rereadAuthenticatedTermsAcceptance({
          termsAcceptanceRef: publication.termsAcceptanceRef,
        }),
      )
      const termsRef = {
        id: terms.acceptanceRecordId,
        version: terms.acceptanceRecordVersion,
        contentHash: `sha256:${terms.acceptanceRecordHash}`,
      }
      if (
        terms.evidenceClass !== 'canonical_private_reread'
        || !sameRef(termsRef, publication.termsAcceptanceRef)
      ) throw new Error('SAM 3.1 authenticated terms do not match publication.')

      const review = assertCanonicalSam31PrivateArtifactReviewBundle(
        await input.artifactReviewReadPort
          .rereadAuthenticatedArtifactReview({
            reviewBundleRef: request.privateArtifactReviewBundleRef,
          }),
      )
      assertReviewLineage({
        review,
        publication,
        publicationRef: canonicalPublicationRef,
        requestedReviewRef: request.privateArtifactReviewBundleRef,
        candidateRef,
        termsRef,
      })

      const preparedAt = z.string().datetime({ offset: true }).parse(
        input.now(),
      )
      if (
        Date.parse(terms.acceptedAt) > Date.parse(publication.publishedAt)
        || Date.parse(publication.publishedAt) > Date.parse(review.reviewedAt)
        || Date.parse(review.reviewedAt) > Date.parse(preparedAt)
      ) throw new Error('SAM 3.1 ingest evidence chronology is invalid.')

      const receipt = await input.preparePrivateArtifactIngestReceipt({
        ingestReceiptId: safeId.parse(
          `sam31-ingest-${publication.publicationAttemptId}`,
        ),
        evidenceClass: 'canonical_private_reread',
        candidate,
        termsAcceptance: terms,
        officialArtifactPublicationRef: canonicalPublicationRef,
        sourceArchiveCoordinate: publication.sourceArchive.coordinate,
        sourceArchiveArtifactRef: review.sourceArchive.artifactRef,
        sourceLicenseRef: review.sourceArchive.licenseRef,
        sourceSecurityReviewRef: review.sourceArchive.securityReviewRef,
        sourceMalwareScanRef: review.sourceArchive.malwareScanRef,
        sourceUnsignedRevisionAcceptanceRef:
          review.sourceArchive.unsignedSourceRevisionAcceptanceRef,
        checkpointCoordinate: publication.checkpoint.coordinate,
        checkpointArtifactRef: review.checkpoint.artifactRef,
        checkpointManifestRef: review.checkpoint.manifestRef,
        checkpointLicenseRef: review.checkpoint.licenseRef,
        checkpointSecurityReviewRef: review.checkpoint.securityReviewRef,
        checkpointMalwareScanRef: review.checkpoint.malwareScanRef,
        privateObjectReadPort: input.privateArtifactReadPort,
        preparedAt,
      })
      assertPreparedReceiptLineage({
        receipt,
        publication,
        publicationRef: canonicalPublicationRef,
        termsRef,
        review,
        candidateHash: candidate.candidateHash,
        preparedAt,
      })
      const persisted = await input.ingestRepository
        .persistPrivateArtifactIngestCreateOnly({ ingestReceipt: receipt })
      const reread = assertCanonicalSam31PrivateArtifactIngestReceipt(
        await input.ingestRepository.rereadPrivateArtifactIngest({
          ingestReceiptRef: persisted.ingestReceiptRef,
        }),
      )
      if (stableAuthorityStringify(reread) !== stableAuthorityStringify(receipt)) {
        throw new Error('SAM 3.1 private ingest persistence changed.')
      }
      return Object.freeze({
        disposition: persisted.disposition,
        ingestReceiptRef: {
          ...persisted.ingestReceiptRef,
          contentHash: persisted.ingestReceiptRef.contentHash as
            `sha256:${string}`,
        },
        exactOfficialPublicationTermsReviewAndArtifactReread: true as const,
        callerReviewClaimsAccepted: false as const,
        modelInstalledOnDeveloperMachine: false as const,
        imageBuildStarted: false as const,
        gpuRuntimeStarted: false as const,
        customerCreditsMutated: false as const,
        publicDeliveryAuthorized: false as const,
        productionReady: false as const,
      })
    },
  }
  return Object.freeze(runtime)
}

export function createCanonicalSam31GcpPrivateArtifactIngestRuntime(input: {
  readonly storage?: Storage
  readonly now?: () => string
} = {}): CanonicalSam31PrivateArtifactIngestRuntime {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31PrivateArtifactIngestRuntime({
    publicationRepository:
      createCanonicalSam31GcsOfficialArtifactPublicationRepository({
        storage,
      }),
    termsReadPort: createCanonicalSam31GcsAuthenticatedTermsReadPort({
      storage,
    }),
    artifactReviewReadPort:
      createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort({ storage }),
    privateArtifactReadPort: createCanonicalSam31GcsPrivateArtifactReadPort({
      projectId: PROJECT_ID,
      bucketName: MODEL_ARTIFACT_BUCKET,
      storage,
    }),
    ingestRepository: createCanonicalSam31GcpPrivateArtifactIngestRepository({
      storage,
    }),
    preparePrivateArtifactIngestReceipt:
      prepareCanonicalSam31PrivateArtifactIngestReceipt,
    now: input.now ?? (() => new Date().toISOString()),
  })
}

function assertReviewLineage(input: {
  review: ReturnType<typeof assertCanonicalSam31PrivateArtifactReviewBundle>
  publication: ReturnType<
    typeof assertCanonicalSam31OfficialArtifactPublicationReceipt
  >
  publicationRef: ReturnType<
    typeof canonicalSam31OfficialArtifactPublicationRef
  >
  requestedReviewRef: z.infer<typeof reviewRefSchema>
  candidateRef: {
    id: string
    version: 1
    schemaVersion: string
    contentHash: string
  }
  termsRef: { id: string; version: number; contentHash: string }
}): void {
  const reviewRef = canonicalSam31PrivateArtifactReviewBundleRef(input.review)
  if (
    input.review.evidenceClass !== 'authenticated_private_owner_reread'
    || input.review.status !== 'approved_for_private_artifact_ingest'
    || !sameRef(input.review.officialArtifactPublicationRef,
      input.publicationRef)
    || !sameRef(reviewRef, input.requestedReviewRef)
    || !sameRef(input.review.candidateRef, input.candidateRef)
    || !sameRef(input.review.termsAcceptanceRef, input.termsRef)
    || !sameCoordinate(input.review.sourceArchive.coordinate,
      input.publication.sourceArchive.coordinate)
    || !sameCoordinate(input.review.checkpoint.coordinate,
      input.publication.checkpoint.coordinate)
    || reviewRef.schemaVersion !==
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION
  ) throw new Error('SAM 3.1 authenticated review crossed artifact lineage.')
}

function assertPorts(input: {
  publicationRepository: CanonicalSam31OfficialArtifactPublicationRepository
  termsReadPort: CanonicalSam31AuthenticatedTermsReadPort
  artifactReviewReadPort: CanonicalSam31AuthenticatedArtifactReviewReadPort
  privateArtifactReadPort: CanonicalSam31PrivateObjectReadPort
  ingestRepository: CanonicalSam31PrivateArtifactIngestRepository
  preparePrivateArtifactIngestReceipt:
    typeof prepareCanonicalSam31PrivateArtifactIngestReceipt
  now: () => string
}): void {
  if (
    typeof input.publicationRepository
      ?.rereadOfficialArtifactPublication !== 'function'
    || typeof input.termsReadPort
      ?.rereadAuthenticatedTermsAcceptance !== 'function'
    || typeof input.artifactReviewReadPort
      ?.rereadAuthenticatedArtifactReview !== 'function'
    || typeof input.privateArtifactReadPort?.readExact !== 'function'
    || typeof input.ingestRepository
      ?.persistPrivateArtifactIngestCreateOnly !== 'function'
    || typeof input.ingestRepository
      ?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.preparePrivateArtifactIngestReceipt !== 'function'
    || typeof input.now !== 'function'
  ) throw new Error('SAM 3.1 private artifact ingest runtime is incomplete.')
}

function assertPreparedReceiptLineage(input: {
  receipt: unknown
  publication: ReturnType<
    typeof assertCanonicalSam31OfficialArtifactPublicationReceipt
  >
  publicationRef: ReturnType<
    typeof canonicalSam31OfficialArtifactPublicationRef
  >
  termsRef: { id: string; version: number; contentHash: string }
  review: ReturnType<typeof assertCanonicalSam31PrivateArtifactReviewBundle>
  candidateHash: string
  preparedAt: string
}): void {
  const receipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.receipt,
  )
  if (
    receipt.evidenceClass !== 'canonical_private_reread'
    || receipt.status !== 'ready_for_immutable_image_build_review'
    || receipt.candidateRef.candidateHash !== input.candidateHash
    || !sameRef(receipt.officialArtifactPublicationRef,
      input.publicationRef)
    || !sameRef(receipt.termsAcceptanceRef, input.termsRef)
    || !sameCoordinate(receipt.sourceArchive.coordinate,
      input.publication.sourceArchive.coordinate)
    || !sameCoordinate(receipt.checkpoint.coordinate,
      input.publication.checkpoint.coordinate)
    || !sameRef(receipt.sourceArchive.artifactRef,
      input.review.sourceArchive.artifactRef)
    || !sameRef(receipt.sourceArchive.licenseRef,
      input.review.sourceArchive.licenseRef)
    || !sameRef(receipt.sourceArchive.securityReviewRef,
      input.review.sourceArchive.securityReviewRef)
    || !sameRef(receipt.sourceArchive.malwareScanRef,
      input.review.sourceArchive.malwareScanRef)
    || !sameRef(receipt.sourceArchive.unsignedSourceRevisionAcceptanceRef,
      input.review.sourceArchive.unsignedSourceRevisionAcceptanceRef)
    || !sameRef(receipt.checkpoint.artifactRef,
      input.review.checkpoint.artifactRef)
    || !sameRef(receipt.checkpoint.manifestRef,
      input.review.checkpoint.manifestRef)
    || !sameRef(receipt.checkpoint.licenseRef,
      input.review.checkpoint.licenseRef)
    || !sameRef(receipt.checkpoint.securityReviewRef,
      input.review.checkpoint.securityReviewRef)
    || !sameRef(receipt.checkpoint.malwareScanRef,
      input.review.checkpoint.malwareScanRef)
    || receipt.preparedAt !== input.preparedAt
    || !receipt.authority.canonicalTermsAcceptanceObserved
    || !receipt.authority.exactSourceAndCheckpointReread
    || !receipt.authority.imageBuildReviewEligible
    || receipt.authority.imageBuildStarted
    || receipt.authority.runtimeExecuted
  ) throw new Error('SAM 3.1 prepared private ingest crossed authority lineage.')
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameCoordinate(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
