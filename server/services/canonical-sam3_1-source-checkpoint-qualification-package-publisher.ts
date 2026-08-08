import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31PrivateArtifactReviewBundle,
} from '../model-artifacts/canonical-sam3_1-private-artifact-review'
import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  assertCanonicalSam31QualificationImageCapsuleManifest,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  createCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE,
} from '../model-artifacts/canonical-sam3_1-official-probe-fixture'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31QualificationImageAuthorityRepository,
} from './canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort,
  createCanonicalSam31GcpPrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  createCanonicalSam31GcpQualificationPackageRepository,
  createCanonicalSam31GcsQualificationProbeFixtureAuthorityReadPort,
  type CanonicalSam31QualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_PUBLISHER_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-package-publisher-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_EVIDENCE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-package-evidence-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_PUBLICATION_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-package-publication-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const ingestRefSchema = refSchema.extend({
  schemaVersion: z.literal(
    'canonical-sam3_1-private-artifact-ingest-receipt-v3',
  ),
}).strict()
const reviewRefSchema = refSchema.extend({
  schemaVersion: z.literal(
    'canonical-sam3_1-private-artifact-review-bundle-v1',
  ),
}).strict()
const publisherRequestSchema = z.object({
  qualificationId: safeId,
  ingestReceiptRef: ingestRefSchema,
  artifactReviewBundleRef: reviewRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  issuedAt: timestamp,
}).strict()

const evidenceSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_EVIDENCE_VERSION,
  ),
  evidenceClass: z.literal('canonical_private_exact_reread_projection'),
  ingestReceiptRef: ingestRefSchema,
  artifactReviewBundleRef: reviewRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  ingestReceipt: z.unknown(),
  qualificationImage: z.object({
    artifactRef: refSchema,
    immutableImageDigest: prefixedSha256,
    supplyChainReleaseRef: refSchema,
    dockerfileSourceRef: refSchema,
    entrypointSourceRef: refSchema,
    runnerSourceRef: refSchema,
  }).strict(),
  patchedSourceArchiveRef: refSchema,
  patchApplicationReceiptRef: refSchema,
  checkpointWeightsOnlyRequirementRef: refSchema,
  dependencyClosureRef: refSchema,
  dependencyLockSha256: rawSha256,
  dependencyClosureReceiptSha256: rawSha256,
  dependencyWheelManifestSha256: rawSha256,
  sourceCodeSecurityReviewRef: refSchema,
  deterministicProbeFixture: z.object({
    artifactRef: refSchema,
    byteLength: z.number().int().positive().max(64 * 1024 * 1024).safe(),
    sha256: rawSha256,
    width: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.width),
    height: z.literal(CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.height),
    frameCount: z.literal(
      CANONICAL_SAM3_1_OFFICIAL_PROBE_FIXTURE.qualificationFrameCount,
    ),
  }).strict(),
  exactIngestReviewImageAuthorityManifestReleaseAndProbeReread: z.literal(true),
  checkpointWeightsOnlyExecutionStillRequiredInWorker: z.literal(true),
  callerPathsUrlsBytesCredentialsHashesOrCommandsAccepted: z.literal(false),
  customerMediaUsed: z.literal(false),
  gpuOrModelRuntimeStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
type QualificationPackageEvidence = z.infer<typeof evidenceSchema>

const publicationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_PUBLICATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_source_checkpoint_qualification_package_publisher',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  disposition: z.enum(['created', 'identical_replay']),
  qualificationId: safeId,
  workerRequestRef: refSchema,
  packageRef: refSchema,
  ingestReceiptRef: ingestRefSchema,
  artifactReviewBundleRef: reviewRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  issuedAt: timestamp,
  exactCanonicalInputsRereadBeforePublication: z.literal(true),
  checkpointWeightsOnlyExecutionStillRequiredInWorker: z.literal(true),
  gpuOrModelRuntimeStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const publicationSchema = publicationWithoutHashSchema.extend({
  publicationHash: rawSha256,
}).strict()
export type CanonicalSam31QualificationPackagePublication = z.infer<
  typeof publicationSchema
>

export interface CanonicalSam31QualificationPackageEvidenceReadPort {
  readonly schemaVersion: string
  rereadExact(untrusted: z.infer<typeof publisherRequestSchema>):
    Promise<unknown | null>
}

export function createCanonicalSam31QualificationPackagePublisher(input: {
  readonly evidenceReadPort:
    CanonicalSam31QualificationPackageEvidenceReadPort
  readonly packageRepository: CanonicalSam31QualificationPackageRepository
}) {
  assertPublisherDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_PUBLISHER_VERSION,
    evidenceClass: 'private_create_only_exact_reread' as const,
    async publish(untrusted: unknown):
      Promise<CanonicalSam31QualificationPackagePublication> {
      assertPlainSerializedData(untrusted, 'sam31_package_publication_request')
      const request = publisherRequestSchema.parse(untrusted)
      const evidence = assertEvidence(
        await input.evidenceReadPort.rereadExact(request),
      )
      const ingestReceipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
        evidence.ingestReceipt,
      )
      if (!sameIngestRef(ingestReceipt, request.ingestReceiptRef)) {
        throw new Error('SAM 3.1 package evidence crossed ingest authority.')
      }
      if (
        stableAuthorityStringify(evidence.ingestReceiptRef) !==
          stableAuthorityStringify(request.ingestReceiptRef)
        || stableAuthorityStringify(evidence.artifactReviewBundleRef) !==
          stableAuthorityStringify(request.artifactReviewBundleRef)
        || !sameRef(evidence.imageSupplyChainReleaseRef,
          request.imageSupplyChainReleaseRef)
        || !sameRef(evidence.qualificationImage.supplyChainReleaseRef,
          request.imageSupplyChainReleaseRef)
      ) throw new Error('SAM 3.1 package evidence crossed requested refs.')
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      const workerRequest =
        createCanonicalSam31SourceCheckpointQualificationWorkerRequest({
          qualificationId: request.qualificationId,
          candidate,
          ingestReceipt,
          qualificationImage: evidence.qualificationImage,
          patchedSourceArchiveRef: evidence.patchedSourceArchiveRef,
          patchApplicationReceiptRef:
            evidence.patchApplicationReceiptRef,
          // The historical v1 field carries the exact authenticated security
          // requirement. Passing the load is still proven only by the worker.
          checkpointWeightsOnlyInspectionRef:
            evidence.checkpointWeightsOnlyRequirementRef,
          dependencyClosureRef: evidence.dependencyClosureRef,
          dependencyLockSha256: evidence.dependencyLockSha256,
          dependencyClosureReceiptSha256:
            evidence.dependencyClosureReceiptSha256,
          dependencyWheelManifestSha256:
            evidence.dependencyWheelManifestSha256,
          sourceCodeSecurityReviewRef:
            evidence.sourceCodeSecurityReviewRef,
          deterministicProbeFixture: evidence.deterministicProbeFixture,
          issuedAt: request.issuedAt,
        })
      const persisted = await input.packageRepository
        .persistQualificationPackageCreateOnly({
          workerRequest,
          ingestReceipt,
          preparedAt: request.issuedAt,
        })
      const reread = await input.packageRepository.rereadExactWorkerRequest({
        workerRequestRef: persisted.workerRequestRef,
      })
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(workerRequest)) {
        throw new Error('SAM 3.1 published package request reread changed.')
      }
      const payload = publicationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_PUBLICATION_VERSION,
        source:
          'canonical_sam3_1_source_checkpoint_qualification_package_publisher',
        evidenceClass: 'gcs_create_only_exact_reread',
        disposition: persisted.disposition,
        qualificationId: request.qualificationId,
        workerRequestRef: persisted.workerRequestRef,
        packageRef: persisted.packageRef,
        ingestReceiptRef: request.ingestReceiptRef,
        artifactReviewBundleRef: request.artifactReviewBundleRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        issuedAt: request.issuedAt,
        exactCanonicalInputsRereadBeforePublication: true,
        checkpointWeightsOnlyExecutionStillRequiredInWorker: true,
        gpuOrModelRuntimeStarted: false,
        customerCreditsMutated: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      return publicationSchema.parse({
        ...payload,
        publicationHash: sha256AuthorityValue(payload),
      })
    },
  })
}

export function createCanonicalSam31GcpQualificationPackageEvidenceReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31QualificationPackageEvidenceReadPort {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const ingestRepository = createCanonicalSam31GcpPrivateArtifactIngestRepository(
    { storage },
  )
  const reviewReadPort = createCanonicalSam31GcsAuthenticatedArtifactReviewReadPort(
    { storage },
  )
  const releaseRepository =
    createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository({
      storage,
    })
  const authorityRepository =
    createCanonicalSam31QualificationImageAuthorityRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_BUCKET,
      }),
    })
  const probeReadPort =
    createCanonicalSam31GcsQualificationProbeFixtureAuthorityReadPort({
      storage,
    })
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-qualification-package-gcp-evidence-read-port-v1',
    async rereadExact(untrusted: z.infer<typeof publisherRequestSchema>) {
      assertPlainSerializedData(untrusted, 'sam31_package_evidence_read')
      const request = publisherRequestSchema.parse(untrusted)
      const [ingestRaw, reviewRaw, releaseRaw, probeRaw] = await Promise.all([
        ingestRepository.rereadPrivateArtifactIngest({
          ingestReceiptRef: request.ingestReceiptRef,
        }),
        reviewReadPort.rereadAuthenticatedArtifactReview({
          reviewBundleRef: request.artifactReviewBundleRef,
        }),
        releaseRepository.rereadQualifiedQualificationImageRelease({
          releaseRef: request.imageSupplyChainReleaseRef,
        }),
        probeReadPort.rereadCurrentProbeFixtureAuthority(),
      ])
      if (!ingestRaw || !reviewRaw || !releaseRaw || !probeRaw) return null
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(ingestRaw)
      const review = assertCanonicalSam31PrivateArtifactReviewBundle(reviewRaw)
      const release =
        assertCanonicalSam31QualificationImageSupplyChainRelease(releaseRaw)
      const authorityRaw = await authorityRepository.rereadBuildAuthority({
        authorityRef: release.buildAuthorityRef,
      })
      if (!authorityRaw) return null
      const authority =
        assertCanonicalSam31QualificationImageBuildAuthority(authorityRaw)
      const manifestRaw = await authorityRepository.rereadCapsuleManifest({
        manifestRef: refSchema.parse(authority.capsuleManifestRef),
      })
      if (!manifestRaw) return null
      const manifest =
        assertCanonicalSam31QualificationImageCapsuleManifest(manifestRaw)
      assertCanonicalEvidenceLineage({
        request,
        ingest,
        review,
        release,
        authority,
        manifest,
        probe: probeRaw,
      })
      return evidenceSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_PACKAGE_EVIDENCE_VERSION,
        evidenceClass: 'canonical_private_exact_reread_projection',
        ingestReceiptRef: request.ingestReceiptRef,
        artifactReviewBundleRef: request.artifactReviewBundleRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        ingestReceipt: ingest,
        qualificationImage: {
          artifactRef: release.immutableImageRef,
          immutableImageDigest: release.immutableImageDigest,
          supplyChainReleaseRef: request.imageSupplyChainReleaseRef,
          dockerfileSourceRef: contentRef(
            'sam31-qualification-dockerfile',
            manifest.repositorySource.dockerfileSha256,
          ),
          entrypointSourceRef: contentRef(
            'sam31-qualification-entrypoint',
            manifest.repositorySource.entrypointSha256,
          ),
          runnerSourceRef: contentRef(
            'sam31-qualification-runner',
            manifest.repositorySource.runnerSha256,
          ),
        },
        patchedSourceArchiveRef: contentRef(
          'sam31-patched-source',
          manifest.privateInput.deterministicPatchedSourceArchiveSha256,
        ),
        patchApplicationReceiptRef: contentRef(
          'sam31-patch-application-receipt',
          manifest.privateInput.patchApplicationReceiptSha256,
        ),
        checkpointWeightsOnlyRequirementRef:
          review.checkpoint.securityReviewRef,
        dependencyClosureRef: release.sourceAndDependencyClosureRef,
        dependencyLockSha256: manifest.privateInput.dependencyLockSha256,
        dependencyClosureReceiptSha256:
          manifest.privateInput.dependencyClosureReceiptSha256,
        dependencyWheelManifestSha256:
          manifest.privateInput.dependencyWheelManifestSha256,
        sourceCodeSecurityReviewRef: review.sourceArchive.securityReviewRef,
        deterministicProbeFixture: {
          artifactRef: probeRaw.artifactRef,
          byteLength: probeRaw.byteLength,
          sha256: probeRaw.sha256,
          width: probeRaw.width,
          height: probeRaw.height,
          frameCount: probeRaw.frameCount,
        },
        exactIngestReviewImageAuthorityManifestReleaseAndProbeReread: true,
        checkpointWeightsOnlyExecutionStillRequiredInWorker: true,
        callerPathsUrlsBytesCredentialsHashesOrCommandsAccepted: false,
        customerMediaUsed: false,
        gpuOrModelRuntimeStarted: false,
        customerCreditsMutated: false,
        productionAuthorityGranted: false,
      })
    },
  })
}

export function createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher(
  input: { readonly storage?: Storage } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31QualificationPackagePublisher({
    evidenceReadPort:
      createCanonicalSam31GcpQualificationPackageEvidenceReadPort({ storage }),
    packageRepository:
      createCanonicalSam31GcpQualificationPackageRepository({ storage }),
  })
}

function assertEvidence(value: unknown): QualificationPackageEvidence {
  assertPlainSerializedData(value, 'sam31_package_evidence')
  if (!value) throw new Error('SAM 3.1 package evidence is absent.')
  const parsed = evidenceSchema.parse(value)
  if (
    parsed.qualificationImage.artifactRef.contentHash !==
      parsed.qualificationImage.immutableImageDigest
    || parsed.patchedSourceArchiveRef.contentHash !==
      `sha256:${createCanonicalSam31SourceRuntimeCandidate().runtimeClosure
        .deterministicPatchedSourceArchiveSha256}`
    || parsed.deterministicProbeFixture.artifactRef.contentHash !==
      `sha256:${parsed.deterministicProbeFixture.sha256}`
  ) throw new Error('SAM 3.1 package evidence lost exact byte lineage.')
  return parsed
}

function assertCanonicalEvidenceLineage(input: {
  request: z.infer<typeof publisherRequestSchema>
  ingest: ReturnType<typeof assertCanonicalSam31PrivateArtifactIngestReceipt>
  review: ReturnType<typeof assertCanonicalSam31PrivateArtifactReviewBundle>
  release: ReturnType<typeof assertCanonicalSam31QualificationImageSupplyChainRelease>
  authority: ReturnType<typeof assertCanonicalSam31QualificationImageBuildAuthority>
  manifest: ReturnType<typeof assertCanonicalSam31QualificationImageCapsuleManifest>
  probe: { readonly customerMediaUsed: false }
}): void {
  const candidate = createCanonicalSam31SourceRuntimeCandidate()
  if (
    input.ingest.evidenceClass !== 'canonical_private_reread'
    || input.ingest.status !== 'ready_for_immutable_image_build_review'
    || input.ingest.candidateRef.candidateHash !== candidate.candidateHash
    || input.review.evidenceClass !== 'authenticated_private_owner_reread'
    || input.review.status !== 'approved_for_private_artifact_ingest'
    || input.review.candidateRef.contentHash !==
      `sha256:${candidate.candidateHash}`
    || input.review.officialArtifactPublicationRef.contentHash !==
      input.ingest.officialArtifactPublicationRef.contentHash
    || !sameRef(input.review.sourceArchive.artifactRef,
      input.ingest.sourceArchive.artifactRef)
    || !sameRef(input.review.checkpoint.artifactRef,
      input.ingest.checkpoint.artifactRef)
    || !sameRef(input.review.checkpoint.manifestRef,
      input.ingest.checkpoint.manifestRef)
    || !input.review.checkpoint.torchWeightsOnlyLoadRequired
    || input.review.checkpoint.executablePickleTrustGranted
    || input.release.evidenceClass !== 'canonical_private_reread'
    || input.release.status !== 'image_supply_chain_qualified'
    || !input.release.authority.sourceCheckpointQualificationImageAdmissible
    || input.release.authority.gpuQualificationJobDispatched
    || input.release.authority.sourceCheckpointQualificationGranted
    || input.authority.evidenceClass !== 'canonical_private_reread'
    || input.authority.status !== 'authorized_for_private_cloud_build'
    || !sameRef(input.release.buildAuthorityRef, {
      id: input.authority.authorityId,
      version: 1,
      contentHash: `sha256:${input.authority.authorityHash}`,
    })
    || !sameRef(input.authority.capsuleManifestRef, {
      id: input.manifest.manifestId,
      version: 1,
      contentHash: `sha256:${input.manifest.manifestHash}`,
    })
    || !sameRef(input.release.sourceAndDependencyClosureRef,
      input.authority.capsuleManifestRef)
    || input.manifest.evidenceClass !== 'canonical_private_reread'
    || input.manifest.status !== 'private_capsule_verified'
    || input.manifest.candidateRef.candidateHash !== candidate.candidateHash
    || input.manifest.ingestReceiptRef.contentHash !==
      `sha256:${input.ingest.ingestReceiptHash}`
    || input.manifest.repositorySource.dockerfileSha256 !==
      input.authority.buildClosure.dockerfileSha256
    || input.manifest.repositorySource.entrypointSha256 !==
      input.authority.buildClosure.entrypointSha256
    || input.manifest.repositorySource.runnerSha256 !==
      input.authority.buildClosure.runnerSha256
    || input.manifest.privateInput.dependencyLockSha256 !==
      input.authority.buildClosure.dependencyLockSha256
    || input.probe.customerMediaUsed
  ) throw new Error('SAM 3.1 package canonical evidence crossed lineage.')
}

function sameIngestRef(
  receipt: CanonicalSam31PrivateArtifactIngestReceipt,
  ref: z.infer<typeof ingestRefSchema>,
): boolean {
  return receipt.ingestReceiptId === ref.id
    && receipt.ingestReceiptVersion === ref.version
    && receipt.schemaVersion === ref.schemaVersion
    && `sha256:${receipt.ingestReceiptHash}` === ref.contentHash
}

function contentRef(label: string, sha256: string) {
  const hash = rawSha256.parse(sha256)
  return refSchema.parse({
    id: `${safeId.parse(label)}-${hash.slice(0, 24)}`,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertPublisherDependencies(input: {
  readonly evidenceReadPort:
    CanonicalSam31QualificationPackageEvidenceReadPort
  readonly packageRepository: CanonicalSam31QualificationPackageRepository
}): void {
  if (
    !input.evidenceReadPort
    || typeof input.evidenceReadPort.rereadExact !== 'function'
    || !input.packageRepository
    || typeof input.packageRepository.persistQualificationPackageCreateOnly !==
      'function'
    || typeof input.packageRepository.rereadExactWorkerRequest !== 'function'
  ) throw new Error('SAM 3.1 qualification package publisher is incomplete.')
}
