import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  assertCanonicalSam31OfficialArtifactPublicationReceipt,
  canonicalSam31PrivateArtifactObjectCoordinateSchema,
  type CanonicalSam31OfficialArtifactPublicationReceipt,
} from './canonical-sam3_1-official-artifact-publication'
import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  canonicalSam31PrivateArtifactReviewBundleSchema,
  type CanonicalSam31PrivateArtifactReviewBundle,
} from './canonical-sam3_1-private-artifact-review'
import {
  CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
  assertCanonicalSam31AuthorizedTermsAcceptance,
  type CanonicalSam31AuthorizedTermsAcceptance,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_ARTIFACT_STATIC_ANALYSIS_VERSION =
  'canonical-sam3_1-private-artifact-static-analysis-v1' as const

const SOURCE_REPOSITORY =
  'https://github.com/facebookresearch/sam3.git' as const
const SOURCE_REVISION =
  '96914d2425f90a64f45ca977c2b5165418099543' as const
const SOURCE_LICENSE_SHA256 =
  '4dea99bfaa016e21bc860d73f344236bd1e5c4977d1a9a8fd32f822b500ae1be' as const
const CHECKPOINT_REPOSITORY = 'facebook/sam3.1' as const
const CHECKPOINT_REVISION =
  'daa63191845a41281374e725f4c9e51c7a824460' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const

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
const publicationRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  ),
}).strict()
const scannerSchema = z.object({
  engine: z.literal('ClamAV'),
  engineVersion: z.literal('1.4.3'),
  signatureDatabaseVersion: z.string().regex(/^[1-9][0-9]{0,11}$/u),
  signatureDatabasePublishedAt: timestamp,
  scanProfile: z.enum([
    'complete_source_archive_with_archive_recursion',
    'complete_checkpoint_raw_bytes_without_archive_execution',
  ]),
  exactArtifactBytesScanned: z.literal(true),
  signaturesLoaded: z.number().int().positive().safe(),
  infectedFiles: z.literal(0),
  scanPassed: z.literal(true),
}).strict()

const analysisWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_STATIC_ANALYSIS_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_sam3_1_private_artifact_static_analysis_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_byte_review'),
  status: z.literal('passed_for_private_artifact_ingest'),
  analysisId: safeId,
  analysisVersion: z.literal(1),
  officialArtifactPublicationRef: publicationRefSchema,
  candidateRef: evidenceRefSchema.extend({
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
  }).strict(),
  termsAcceptanceRef: evidenceRefSchema.extend({
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_AUTHORIZED_TERMS_ACCEPTANCE_VERSION,
    ),
  }).strict(),
  sourceArchive: z.object({
    repository: z.literal(SOURCE_REPOSITORY),
    revision: z.literal(SOURCE_REVISION),
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    archiveManifest: z.object({
      entryCount: z.number().int().positive().max(100_000).safe(),
      regularFileCount: z.number().int().positive().max(100_000).safe(),
      directoryCount: z.number().int().nonnegative().max(100_000).safe(),
      totalRegularFileBytes: z.number().int().positive().safe(),
      entrySetSha256: rawSha256,
      canonicalRegularFilesAndDirectoriesOnly: z.literal(true),
      pathTraversalLinksDevicesFifosSocketsAndSparseEntriesAbsent:
        z.literal(true),
      duplicateEntriesAbsent: z.literal(true),
      exactArchiveBytesGenerationEtagLengthAndSha256Reread: z.literal(true),
    }).strict(),
    license: z.object({
      path: z.literal('LICENSE'),
      sha256: z.literal(SOURCE_LICENSE_SHA256),
      title: z.literal('SAM License'),
      lastUpdated: z.literal('2025-11-19'),
      officialPinnedSourceLicenseReread: z.literal(true),
      acceptedTermsBindOrganizationUse: z.literal(true),
      privateCommercialUseApprovedByAuthorizedOrganizationRepresentative:
        z.literal(true),
      publicRedistributionAuthorized: z.literal(false),
      legalCounselApprovalClaimed: z.literal(false),
    }).strict(),
    revisionReview: z.object({
      commitSignatureStatus: z.literal('unsigned'),
      officialRepositoryAndPinnedRevisionExact: z.literal(true),
      unsignedRevisionAcceptedForPrivateQualification: z.literal(true),
      unsignedRevisionAcceptedForProduction: z.literal(false),
    }).strict(),
    malwareScan: scannerSchema.extend({
      scanProfile: z.literal(
        'complete_source_archive_with_archive_recursion',
      ),
    }).strict(),
    securityReviewPassed: z.literal(true),
    malwareScanPassed: z.literal(true),
  }).strict(),
  checkpoint: z.object({
    repository: z.literal(CHECKPOINT_REPOSITORY),
    revision: z.literal(CHECKPOINT_REVISION),
    fileName: z.literal(CHECKPOINT_FILE),
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    manifest: z.object({
      containerFormat: z.literal('pytorch_zip64_checkpoint'),
      memberCount: z.number().int().positive().max(1_000_000).safe(),
      totalCompressedBytes: z.number().int().positive().safe(),
      totalUncompressedBytes: z.number().int().positive().safe(),
      memberSetSha256: rawSha256,
      dataPicklePath: z.string().min(1).max(512),
      dataPickleByteLength: z.number().int().positive().max(256 * 1024 * 1024)
        .safe(),
      dataPickleSha256: rawSha256,
      pickleOpcodeCount: z.number().int().positive().max(100_000_000).safe(),
      pickleOpcodeSetSha256: rawSha256,
      pickleGlobalReferenceSetSha256: rawSha256,
      dangerousGlobalReferenceCount: z.literal(0),
      encryptedMembersAbsent: z.literal(true),
      pathTraversalLinksDevicesAndDuplicateMembersAbsent: z.literal(true),
      exactCoordinateShaLengthGenerationAndEtagReread: z.literal(true),
    }).strict(),
    malwareScan: scannerSchema.extend({
      scanProfile: z.literal(
        'complete_checkpoint_raw_bytes_without_archive_execution',
      ),
    }).strict(),
    checkpointBytesDeserializedDuringReview: z.literal(false),
    torchWeightsOnlyLoadRequired: z.literal(true),
    executablePickleTrustGranted: z.literal(false),
    exactWeightsOnlyLoadMustPassInA100Qualification: z.literal(true),
    licenseApprovedForWeEditProPrivateCommercialUse: z.literal(true),
    securityReviewPassed: z.literal(true),
    malwareScanPassed: z.literal(true),
  }).strict(),
  reviewBoundary: z.object({
    exactOfficialPublishedCoordinatesOnly: z.literal(true),
    checkpointLoadedOrModelExecuted: z.literal(false),
    sourceExtractedOrCheckpointPersistedOutsideEphemeralCloudJob:
      z.literal(false),
    developerMachineArtifactCopyCreated: z.literal(false),
    thirdPartyScannerUploadUsed: z.literal(false),
    callerSecurityLicenseOrMalwareClaimsAccepted: z.literal(false),
    sourceAndCheckpointDeletedFromEphemeralStorageAtExit: z.literal(true),
    compatibilityQualificationStillRequired: z.literal(true),
  }).strict(),
  authority: z.object({
    authenticatedStaticReviewEvidenceOnly: z.literal(true),
    artifactIngestAuthorized: z.literal(true),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    providerOrModelExecuted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  reviewedAt: timestamp,
}).strict().superRefine((value, context) => {
  const sourceHash = value.sourceArchive.coordinate.sha256
  const checkpointHash = value.checkpoint.coordinate.sha256
  if (
    value.sourceArchive.artifactRef.contentHash !== `sha256:${sourceHash}`
    || value.checkpoint.artifactRef.contentHash !== `sha256:${checkpointHash}`
    || value.sourceArchive.coordinate.bucketName !==
      value.checkpoint.coordinate.bucketName
    || value.sourceArchive.archiveManifest.entryCount !==
      value.sourceArchive.archiveManifest.regularFileCount
        + value.sourceArchive.archiveManifest.directoryCount
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 static analysis artifact lineage changed.',
  })
})

export const canonicalSam31PrivateArtifactStaticAnalysisReceiptSchema =
  analysisWithoutHashSchema.extend({ analysisHash: rawSha256 }).strict()

export type CanonicalSam31PrivateArtifactStaticAnalysisReceipt = z.infer<
  typeof canonicalSam31PrivateArtifactStaticAnalysisReceiptSchema
>

export function assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(
  value: unknown,
): CanonicalSam31PrivateArtifactStaticAnalysisReceipt {
  assertClosedPlainData(value, 'sam31_private_artifact_static_analysis')
  const parsed = canonicalSam31PrivateArtifactStaticAnalysisReceiptSchema
    .parse(value)
  const { analysisHash, ...payload } = parsed
  if (analysisHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 private artifact static analysis hash is invalid.')
  }
  return parsed
}

export function canonicalSam31PrivateArtifactStaticAnalysisRef(
  value: unknown,
): {
  readonly id: string
  readonly version: 1
  readonly contentHash: `sha256:${string}`
} {
  const receipt = assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(
    value,
  )
  return Object.freeze({
    id: receipt.analysisId,
    version: 1,
    contentHash: `sha256:${receipt.analysisHash}`,
  })
}

export function buildCanonicalSam31PrivateArtifactReviewBundle(input: {
  readonly publication: CanonicalSam31OfficialArtifactPublicationReceipt
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly termsAcceptance: CanonicalSam31AuthorizedTermsAcceptance
  readonly analysis: CanonicalSam31PrivateArtifactStaticAnalysisReceipt
}): CanonicalSam31PrivateArtifactReviewBundle {
  const publication = assertCanonicalSam31OfficialArtifactPublicationReceipt(
    input.publication,
  )
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
    input.termsAcceptance,
  )
  const analysis = assertCanonicalSam31PrivateArtifactStaticAnalysisReceipt(
    input.analysis,
  )
  const publicationRef = {
    id: publication.publicationAttemptId,
    version: 1 as const,
    schemaVersion: publication.schemaVersion,
    contentHash: `sha256:${publication.publicationReceiptHash}` as const,
  }
  const candidateRef = {
    id: `sam31-source-runtime-candidate-${candidate.candidateHash.slice(0, 24)}`,
    version: 1 as const,
    schemaVersion: candidate.schemaVersion,
    contentHash: `sha256:${candidate.candidateHash}` as const,
  }
  const termsRef = {
    id: terms.acceptanceRecordId,
    version: 1 as const,
    contentHash: `sha256:${terms.acceptanceRecordHash}` as const,
  }
  if (
    publication.status !==
      'published_pending_security_license_and_compatibility_review'
    || publication.evidenceClass !== 'canonical_private_publication'
    || terms.evidenceClass !== 'canonical_private_reread'
    || !sameRef(publication.candidateRef, candidateRef)
    || !sameRef(publication.termsAcceptanceRef, termsRef)
    || !sameRef(analysis.officialArtifactPublicationRef, publicationRef)
    || !sameRef(analysis.candidateRef, candidateRef)
    || !sameRef(analysis.termsAcceptanceRef, termsRef)
    || !sameCoordinate(
      analysis.sourceArchive.coordinate,
      publication.sourceArchive.coordinate,
    )
    || !sameCoordinate(
      analysis.checkpoint.coordinate,
      publication.checkpoint.coordinate,
    )
  ) throw new Error('SAM 3.1 private artifact review inputs changed.')
  const analysisRef = canonicalSam31PrivateArtifactStaticAnalysisRef(analysis)
  const payload = {
    schemaVersion: CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
    source: 'canonical_weeditpro_sam3_1_private_artifact_review_owner',
    evidenceClass: 'authenticated_private_owner_reread',
    status: 'approved_for_private_artifact_ingest',
    reviewBundleId: `sam31-private-artifact-review-${
      analysis.analysisHash.slice(0, 24)
    }`,
    reviewBundleVersion: 1,
    officialArtifactPublicationRef: publicationRef,
    candidateRef,
    termsAcceptanceRef: termsRef,
    sourceArchive: {
      coordinate: analysis.sourceArchive.coordinate,
      artifactRef: analysis.sourceArchive.artifactRef,
      licenseRef: analysisRef,
      securityReviewRef: analysisRef,
      malwareScanRef: analysisRef,
      unsignedSourceRevisionAcceptanceRef: analysisRef,
      licenseApprovedForWeEditProPrivateCommercialUse: true,
      securityReviewPassed: true,
      malwareScanPassed: true,
      unsignedPinnedRevisionAccepted: true,
    },
    checkpoint: {
      coordinate: analysis.checkpoint.coordinate,
      artifactRef: analysis.checkpoint.artifactRef,
      manifestRef: analysisRef,
      licenseRef: analysisRef,
      securityReviewRef: analysisRef,
      malwareScanRef: analysisRef,
      manifestBindsExactCoordinateShaAndLength: true,
      licenseApprovedForWeEditProPrivateCommercialUse: true,
      securityReviewPassed: true,
      malwareScanPassed: true,
      torchWeightsOnlyLoadRequired: true,
      executablePickleTrustGranted: false,
    },
    reviewBoundary: {
      exactPublishedSourceAndCheckpointCoordinatesReviewed: true,
      officialGatedCheckpointOnly: true,
      thirdPartyMirrorAccepted: false,
      callerReviewClaimsAccepted: false,
      callerUrlPathBytesOrCredentialsAccepted: false,
      termsAuthorityRemainsExternal: true,
      securityLicenseAndMalwareOwnersRemainExternal: true,
    },
    authority: {
      authenticatedReviewEvidenceOnly: true,
      artifactIngestReceiptCreated: false,
      imageBuildAuthorized: false,
      gpuRuntimeAuthorized: false,
      providerOrModelExecuted: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    reviewedAt: analysis.reviewedAt,
  } as const
  return Object.freeze(
    canonicalSam31PrivateArtifactReviewBundleSchema.parse({
      ...payload,
      reviewBundleHash: sha256AuthorityValue(payload),
    }),
  )
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameCoordinate(
  left: z.infer<typeof canonicalSam31PrivateArtifactObjectCoordinateSchema>,
  right: z.infer<typeof canonicalSam31PrivateArtifactObjectCoordinateSchema>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
