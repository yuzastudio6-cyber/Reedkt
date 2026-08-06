import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalSam31CloudImageBuildAuthority,
  type CanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import type {
  CanonicalSam31CloudImageSupplyChainEvidenceReadPort,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import type {
  CanonicalSam31QualificationImageSupplyChainEvidenceReadPort,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  compileCanonicalSam31CloudBuildRequestBody,
  type CanonicalSam31CloudImageBuildSubmission,
  type CanonicalSam31CloudImageBuildTerminalObservation,
} from './canonical-sam3_1-cloud-image-build-service'
import {
  canonicalSam31CloudImageBuildAuthorityRef,
  canonicalSam31CloudImageBuildSubmissionRef,
  canonicalSam31CloudImageBuildTerminalObservationRef,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  assertCanonicalSam31ImageSupplyChainBuildAdmission,
  assertCanonicalSam31ImageSupplyChainBuildObservation,
  assertCanonicalSam31ImageSupplyChainBuildSubmission,
  compileCanonicalSam31ImageSupplyChainCloudBuildBody,
  imageSupplyChainBuildAdmissionReference,
  imageSupplyChainBuildObservationReference,
  imageSupplyChainBuildSubmissionReference,
  type CanonicalSam31ImageSupplyChainBuildAdmission,
  type CanonicalSam31ImageSupplyChainBuildObservation,
  type CanonicalSam31ImageSupplyChainBuildSubmission,
} from './canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  compileCanonicalSam31QualificationImageBuildRequestBody,
  type CanonicalSam31QualificationImageBuildSubmission,
  type CanonicalSam31QualificationImageBuildTerminal,
} from './canonical-sam3_1-qualification-image-build-phase'
import {
  assertCanonicalSam31QualificationImageSupplyChainAdmission,
  assertCanonicalSam31QualificationImageSupplyChainObservation,
  assertCanonicalSam31QualificationImageSupplyChainSubmission,
  compileCanonicalSam31QualificationImageSupplyChainBody,
  qualificationImageSupplyChainAdmissionReference,
  qualificationImageSupplyChainObservationReference,
  qualificationImageSupplyChainSubmissionReference,
  type CanonicalSam31QualificationImageSupplyChainBuildAdmission,
  type CanonicalSam31QualificationImageSupplyChainBuildObservation,
  type CanonicalSam31QualificationImageSupplyChainBuildSubmission,
} from './canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'
import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
  type VisualIntelligencePrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'

export const CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_EVIDENCE_READER_VERSION =
  'canonical-sam3_1-image-supply-chain-evidence-reader-v1' as const
export const CANONICAL_SAM3_1_IMAGE_SECURITY_REVIEW_VERSION =
  'canonical-sam3_1-image-security-review-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_NAME = 'reeditpro-sam31-gpu' as const
const QUALIFICATION_IMAGE_NAME = 'reeditpro-sam31-qualification' as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu' as const
const QUALIFICATION_IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const
const EVIDENCE_BUCKET =
  'reeditpro-production-reeditpro-image-supply-chain-evidence' as const
const SIGNER_SERVICE_ACCOUNT =
  'reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const
const ARTIFACT_PATHS = [
  'sam31.spdx.json',
  'cosign-signature.bundle.json',
  'cosign-verification.json',
] as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const OCCURRENCES_ENDPOINT =
  'https://containeranalysis.googleapis.com/v1/projects/reeditpro/occurrences'
const MAXIMUM_OCCURRENCE_PAGES = 16
const MAXIMUM_OCCURRENCES = 16_000

const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const severityCountsSchema = z.object({
  criticalCount: z.number().int().nonnegative().safe(),
  highCount: z.number().int().nonnegative().safe(),
  mediumCount: z.number().int().nonnegative().safe(),
  lowCount: z.number().int().nonnegative().safe(),
  unknownSeverityCount: z.number().int().nonnegative().safe(),
}).strict()

const securityReviewInputSchema = z.object({
  reviewId: safeId,
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
  reviewerAuthorityRef: evidenceRefSchema,
  reviewedAt: timestamp,
}).strict()

const securityReviewWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_IMAGE_SECURITY_REVIEW_VERSION),
  source: z.literal('canonical_server_image_security_review_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('approved_for_private_gpu_qualification'),
  reviewId: safeId,
  reviewVersion: z.literal(1),
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
  reviewerAuthorityRef: evidenceRefSchema,
  reviewedAt: timestamp,
  authority: z.object({
    exactOccurrenceSnapshotReread: z.literal(true),
    independentSecurityReviewCompleted: z.literal(true),
    approvedForPrivateGpuQualification: z.literal(true),
    publicRuntimeApproved: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.severityCounts.criticalCount !== 0
    || value.severityCounts.highCount !== 0
    || value.severityCounts.unknownSeverityCount !== 0
    || Date.parse(value.reviewedAt) < Date.parse(value.scanCompletedAt)
    || Date.parse(value.occurrenceSnapshotUpdatedAt) <
      Date.parse(value.scanCompletedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 image security review is not releasable.',
  })
})

export const canonicalSam31ImageSecurityReviewSchema =
  securityReviewWithoutHashSchema.extend({ reviewHash: rawSha256 }).strict()
export type CanonicalSam31ImageSecurityReview = z.infer<
  typeof canonicalSam31ImageSecurityReviewSchema
>

export interface CanonicalSam31ImageSecurityReviewReadPort {
  rereadApprovedReview(input: {
    readonly immutableImageDigest: string
    readonly vulnerabilityScanRef: z.infer<typeof evidenceRefSchema>
    readonly scanCompletedAt: string
    readonly occurrenceSnapshotUpdatedAt: string
    readonly severityCounts: z.infer<typeof severityCountsSchema>
  }): Promise<unknown | null>
}

export interface CanonicalSam31ImageSupplyChainGoogleReadTransport {
  getJson(url: string): Promise<{
    readonly status: number
    readonly json: unknown
  }>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>
type SupplyChainEvidenceReadRequest = Parameters<
  CanonicalSam31CloudImageSupplyChainEvidenceReadPort['rereadExact']
>[0]
type QualificationSupplyChainEvidenceReadRequest = Parameters<
  CanonicalSam31QualificationImageSupplyChainEvidenceReadPort[
    'rereadExactQualificationImageSupplyChain'
  ]
>[0]

export function createCanonicalSam31ImageSecurityReview(
  input: z.input<typeof securityReviewInputSchema>,
): CanonicalSam31ImageSecurityReview {
  assertClosedPlainData(input, 'sam3_1_image_security_review_input')
  const parsedInput = securityReviewInputSchema.parse(input)
  const payload = securityReviewWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_IMAGE_SECURITY_REVIEW_VERSION,
    source: 'canonical_server_image_security_review_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'approved_for_private_gpu_qualification',
    reviewId: parsedInput.reviewId,
    reviewVersion: 1,
    immutableImageDigest: parsedInput.immutableImageDigest,
    vulnerabilityScanRef: parsedInput.vulnerabilityScanRef,
    scanCompletedAt: parsedInput.scanCompletedAt,
    occurrenceSnapshotUpdatedAt: parsedInput.occurrenceSnapshotUpdatedAt,
    severityCounts: parsedInput.severityCounts,
    reviewerAuthorityRef: parsedInput.reviewerAuthorityRef,
    reviewedAt: parsedInput.reviewedAt,
    authority: {
      exactOccurrenceSnapshotReread: true,
      independentSecurityReviewCompleted: true,
      approvedForPrivateGpuQualification: true,
      publicRuntimeApproved: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31ImageSecurityReviewSchema.parse({
    ...payload,
    reviewHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ImageSecurityReview(
  value: unknown,
): CanonicalSam31ImageSecurityReview {
  assertClosedPlainData(value, 'sam3_1_image_security_review')
  const parsed = canonicalSam31ImageSecurityReviewSchema.parse(value)
  const { reviewHash, ...payload } = parsed
  if (reviewHash !== sha256AuthorityValue(payload)) {
    throw conflict('sam3_1_image_security_review_hash_invalid')
  }
  return parsed
}

/**
 * Read-only Google API transport. Every endpoint is allowlisted, redirects and
 * automatic retries are disabled, and no caller body, credential, or media is
 * accepted.
 */
export function createCanonicalSam31ImageSupplyChainGoogleReadTransport(
  input: {
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  } = {},
): CanonicalSam31ImageSupplyChainGoogleReadTransport {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const timeout = input.requestTimeoutMilliseconds ?? 30_000
  if (!Number.isSafeInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw notReady('sam3_1_supply_chain_read_timeout_invalid')
  }
  return Object.freeze({
    async getJson(url: string) {
      assertCanonicalSam31ImageSupplyChainGoogleReadUrl(url)
      const response = await auth.request<unknown>({
        url,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
        responseType: 'json',
        validateStatus: () => true,
      })
      if (
        !Number.isSafeInteger(response.status)
        || response.status < 100
        || response.status > 599
      ) throw notReady('sam3_1_supply_chain_read_status_invalid')
      assertBoundedPlainJson(
        response.data,
        'sam3_1_supply_chain_google_response',
      )
      return Object.freeze({
        status: response.status,
        json: structuredClone(response.data),
      })
    },
  })
}

/**
 * Production evidence reader for the already-built immutable image. This
 * service performs no build, signature, model, GPU, billing, or delivery
 * action. It only rereads and cross-validates canonical private evidence.
 */
export function createCanonicalSam31ImageSupplyChainEvidenceReadPort(input: {
  readonly imageBuildAuthority: CanonicalSam31CloudImageBuildAuthority
  readonly imageBuildSubmission: CanonicalSam31CloudImageBuildSubmission
  readonly imageBuildTerminalObservation:
    CanonicalSam31CloudImageBuildTerminalObservation
  readonly supplyChainBuildAdmission:
    CanonicalSam31ImageSupplyChainBuildAdmission
  readonly supplyChainBuildSubmission:
    CanonicalSam31ImageSupplyChainBuildSubmission
  readonly supplyChainBuildObservation:
    CanonicalSam31ImageSupplyChainBuildObservation
  readonly privateObjectReadPort: VisualIntelligencePrivateObjectReadPort
  readonly googleReadTransport: CanonicalSam31ImageSupplyChainGoogleReadTransport
  readonly securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
}): CanonicalSam31CloudImageSupplyChainEvidenceReadPort {
  const authority = assertCanonicalSam31CloudImageBuildAuthority(
    input.imageBuildAuthority,
  )
  const imageSubmission = assertCanonicalSam31CloudImageBuildSubmission(
    input.imageBuildSubmission,
  )
  const imageTerminal = assertCanonicalSam31CloudImageBuildTerminalObservation(
    input.imageBuildTerminalObservation,
  )
  const supplyAdmission =
    assertCanonicalSam31ImageSupplyChainBuildAdmission(
      input.supplyChainBuildAdmission,
    )
  const supplySubmission =
    assertCanonicalSam31ImageSupplyChainBuildSubmission(
      input.supplyChainBuildSubmission,
    )
  const supplyObservation =
    assertCanonicalSam31ImageSupplyChainBuildObservation(
      input.supplyChainBuildObservation,
    )
  assertPorts(input)
  assertCanonicalLineage({
    authority,
    imageSubmission,
    imageTerminal,
    supplyAdmission,
    supplySubmission,
    supplyObservation,
  })

  return Object.freeze({
    async rereadExact(request: SupplyChainEvidenceReadRequest) {
      assertClosedPlainData(request, 'sam3_1_supply_chain_read_request')
      assertRequestLineage(request, {
        authority,
        imageSubmission,
        imageTerminal,
      })
      const imageUri = imageTerminal.immutableImageUri
      const imageDigest = imageTerminal.immutableImageDigest
      if (!imageUri || !imageDigest) {
        throw notReady('sam3_1_supply_chain_immutable_image_missing')
      }
      const resourceUri = `https://${imageUri}`
      const [
        imageMetadataResponse,
        originalBuildResponse,
        supplyChainBuildResponse,
        evidenceArtifacts,
        discoveryOccurrences,
        vulnerabilityOccurrences,
        buildOccurrences,
      ] = await Promise.all([
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalArtifactRegistryImageUrl(imageDigest, IMAGE_NAME),
          'sam3_1_artifact_registry_image_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(imageTerminal.cloudBuildResource),
          'sam3_1_original_cloud_build_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(supplyObservation.cloudBuildResource),
          'sam3_1_supply_chain_cloud_build_reread_failed',
        ),
        rereadCanonicalImageSupplyChainEvidenceArtifacts({
          observation: supplyObservation,
          admission: supplyAdmission,
          artifactPaths: ARTIFACT_PATHS,
          privateObjectReadPort: input.privateObjectReadPort,
        }),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          `kind="DISCOVERY" AND resourceUrl="${resourceUri}"`,
        ),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          `kind="VULNERABILITY" AND resourceUrl="${resourceUri}"`,
        ),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          'kind="BUILD" AND '
            + 'build.inTotoSlsaProvenanceV1.predicate.runDetails.metadata.'
            + `invocationId="${canonicalCloudBuildProvenanceInvocationId(
              imageTerminal.cloudBuildResource,
            )}"`,
        ),
      ])

      const imageMetadata = verifyCanonicalImageMetadata(
        imageMetadataResponse,
        imageUri,
        imageDigest,
        IMAGE_NAME,
      )
      verifyOriginalImageBuild({
        value: originalBuildResponse,
        authority,
        submission: imageSubmission,
        terminal: imageTerminal,
      })
      verifySupplyChainBuild({
        value: supplyChainBuildResponse,
        admission: supplyAdmission,
        observation: supplyObservation,
      })
      const sbom = verifyCanonicalImageSpdxSbom({
        body: evidenceArtifacts.byPath.get('sam31.spdx.json')?.body,
        imageDigest,
        syftImage: supplyAdmission.toolchain.syftImage,
      })
      const signature = verifyCanonicalImageCosignEvidence({
        bundleBody:
          evidenceArtifacts.byPath.get('cosign-signature.bundle.json')?.body,
        verificationBody:
          evidenceArtifacts.byPath.get('cosign-verification.json')?.body,
        imageUri,
        imageDigest,
        kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
        supplyChainObservationRef:
          imageSupplyChainBuildObservationReference(supplyObservation),
      })
      const vulnerabilityScan = verifyCanonicalImageVulnerabilityOccurrences({
        imageDigest,
        resourceUri,
        discoveryOccurrences,
        vulnerabilityOccurrences,
      })
      const securityReview = assertCanonicalSam31ImageSecurityReview(
        await input.securityReviewReadPort.rereadApprovedReview({
          immutableImageDigest: imageDigest,
          vulnerabilityScanRef: vulnerabilityScan.scanRef,
          scanCompletedAt: vulnerabilityScan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt:
            vulnerabilityScan.occurrenceSnapshotUpdatedAt,
          severityCounts: vulnerabilityScan.severityCounts,
        }),
      )
      assertCanonicalImageSecurityReviewMatches(securityReview, {
        imageDigest,
        ...vulnerabilityScan,
      })
      const provenance = verifyCanonicalImageBuildProvenance({
        occurrences: buildOccurrences,
        imageUri,
        imageDigest,
        cloudBuildResource: imageTerminal.cloudBuildResource,
      })

      return deepFreeze({
        evidenceClass: 'canonical_private_reread' as const,
        imageMetadata: {
          projectId: PROJECT_ID,
          region: REGION,
          repository: IMAGE_REPOSITORY,
          packageResource: IMAGE_PACKAGE,
          immutableImageUri: imageUri,
          immutableImageDigest: imageDigest,
          containerManifestMediaType: imageMetadata.mediaType,
          exactDigestReread: true,
          mutableTagUsedAsAuthority: false,
        },
        sbom: {
          format: 'spdx_2_3_json' as const,
          artifactRef: sbom.artifactRef,
          contentSha256: sbom.contentSha256,
          imageDigest,
          generatorImageRef: sbom.generatorImageRef,
          completeOsAndApplicationPackageInventory: true,
          exactArtifactReread: true,
        },
        vulnerabilityScan: {
          scanner: 'google_artifact_analysis' as const,
          scanRef: vulnerabilityScan.scanRef,
          imageDigest,
          scanCompletedAt: vulnerabilityScan.scanCompletedAt,
          vulnerabilityDatabaseUpdatedAt:
            vulnerabilityScan.occurrenceSnapshotUpdatedAt,
          ...vulnerabilityScan.severityCounts,
          exactOccurrencesReread: true,
          securityReviewRef: canonicalImageSecurityReviewRef(securityReview),
          securityReviewApprovedForPrivateGpuQualification: true,
        },
        signature: {
          scheme: 'cosign_kms_sha256' as const,
          signatureRef: signature.signatureRef,
          imageDigest,
          kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
          signerServiceAccount: SIGNER_SERVICE_ACCOUNT,
          exactSignatureVerificationPassed: true,
        },
        provenance: {
          predicateType: 'https://slsa.dev/provenance/v1' as const,
          attestationRef: provenance.attestationRef,
          imageDigest,
          cloudBuildId: imageTerminal.cloudBuildId,
          cloudBuildResource: imageTerminal.cloudBuildResource,
          buildAuthorityRef:
            canonicalSam31CloudImageBuildAuthorityRef(authority),
          buildSubmissionRef:
            canonicalSam31CloudImageBuildSubmissionRef(imageSubmission),
          buildRequestHash: imageSubmission.buildRequestHash,
          sourceBucket: authority.capsuleCoordinate.bucketName,
          sourceObject: authority.capsuleCoordinate.objectName,
          sourceGeneration: authority.capsuleCoordinate.generation,
          sourceSha256: authority.capsuleCoordinate.sha256,
          exactAttestationRereadAndVerified: true,
        },
      })
    },
  })
}

export function createCanonicalSam31GcpImageSupplyChainEvidenceReadPort(input: {
  readonly imageBuildAuthority: CanonicalSam31CloudImageBuildAuthority
  readonly imageBuildSubmission: CanonicalSam31CloudImageBuildSubmission
  readonly imageBuildTerminalObservation:
    CanonicalSam31CloudImageBuildTerminalObservation
  readonly supplyChainBuildAdmission:
    CanonicalSam31ImageSupplyChainBuildAdmission
  readonly supplyChainBuildSubmission:
    CanonicalSam31ImageSupplyChainBuildSubmission
  readonly supplyChainBuildObservation:
    CanonicalSam31ImageSupplyChainBuildObservation
  readonly securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
  readonly privateObjectReadPort?: VisualIntelligencePrivateObjectReadPort
  readonly googleReadTransport?:
    CanonicalSam31ImageSupplyChainGoogleReadTransport
  readonly auth?: GoogleAuthRequest
  readonly requestTimeoutMilliseconds?: number
}): CanonicalSam31CloudImageSupplyChainEvidenceReadPort {
  return createCanonicalSam31ImageSupplyChainEvidenceReadPort({
    ...input,
    privateObjectReadPort: input.privateObjectReadPort
      ?? createVisualIntelligenceGcsPrivateObjectReadPort({
        projectId: PROJECT_ID,
        maximumObjectBytes: 64 * 1024 * 1024,
      }),
    googleReadTransport: input.googleReadTransport
      ?? createCanonicalSam31ImageSupplyChainGoogleReadTransport({
        auth: input.auth,
        requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
      }),
  })
}

/**
 * Qualification-image branch of the same canonical supply-chain evidence
 * owner. It never relabels the runtime image contract and it performs only
 * authenticated, read-only reconciliation of the qualification image.
 */
export function createCanonicalSam31QualificationImageSupplyChainEvidenceReadPort(
  input: {
    readonly imageBuildAuthority:
      CanonicalSam31QualificationImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalSam31QualificationImageBuildSubmission
    readonly imageBuildTerminal: CanonicalSam31QualificationImageBuildTerminal
    readonly supplyChainBuildAdmission:
      CanonicalSam31QualificationImageSupplyChainBuildAdmission
    readonly supplyChainBuildSubmission:
      CanonicalSam31QualificationImageSupplyChainBuildSubmission
    readonly supplyChainBuildObservation:
      CanonicalSam31QualificationImageSupplyChainBuildObservation
    readonly privateObjectReadPort: VisualIntelligencePrivateObjectReadPort
    readonly googleReadTransport:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
    readonly securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
  },
): CanonicalSam31QualificationImageSupplyChainEvidenceReadPort {
  const authority = assertCanonicalSam31QualificationImageBuildAuthority(
    input.imageBuildAuthority,
  )
  const imageSubmission = assertCanonicalSam31QualificationImageBuildSubmission(
    input.imageBuildSubmission,
  )
  const imageTerminal = assertCanonicalSam31QualificationImageBuildTerminal(
    input.imageBuildTerminal,
  )
  const supplyAdmission =
    assertCanonicalSam31QualificationImageSupplyChainAdmission(
      input.supplyChainBuildAdmission,
    )
  const supplySubmission =
    assertCanonicalSam31QualificationImageSupplyChainSubmission(
      input.supplyChainBuildSubmission,
    )
  const supplyObservation =
    assertCanonicalSam31QualificationImageSupplyChainObservation(
      input.supplyChainBuildObservation,
    )
  assertPorts(input)
  assertQualificationImageCanonicalLineage({
    authority,
    imageSubmission,
    imageTerminal,
    supplyAdmission,
    supplySubmission,
    supplyObservation,
  })

  return Object.freeze({
    async rereadExactQualificationImageSupplyChain(
      request: QualificationSupplyChainEvidenceReadRequest,
    ) {
      assertClosedPlainData(
        request,
        'sam3_1_qualification_image_supply_chain_read_request',
      )
      assertQualificationImageRequestLineage(request, {
        authority,
        imageSubmission,
        imageTerminal,
        supplyAdmission,
        supplySubmission,
        supplyObservation,
      })
      const imageUri = imageTerminal.immutableImageUri
      const imageDigest = imageTerminal.immutableImageDigest
      if (!imageUri || !imageDigest) {
        throw notReady('sam3_1_qualification_image_digest_missing')
      }
      const resourceUri = `https://${imageUri}`
      const [
        imageMetadataResponse,
        originalBuildResponse,
        supplyChainBuildResponse,
        evidenceArtifacts,
        discoveryOccurrences,
        vulnerabilityOccurrences,
        buildOccurrences,
      ] = await Promise.all([
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalArtifactRegistryImageUrl(
            imageDigest,
            QUALIFICATION_IMAGE_NAME,
          ),
          'sam3_1_qualification_image_registry_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(imageTerminal.cloudBuildResource),
          'sam3_1_qualification_original_build_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(supplyObservation.cloudBuildResource),
          'sam3_1_qualification_supply_build_reread_failed',
        ),
        rereadCanonicalImageSupplyChainEvidenceArtifacts({
          observation: supplyObservation,
          admission: supplyAdmission,
          artifactPaths: supplyAdmission.evidenceArtifactPaths,
          privateObjectReadPort: input.privateObjectReadPort,
        }),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          `kind="DISCOVERY" AND resourceUrl="${resourceUri}"`,
        ),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          `kind="VULNERABILITY" AND resourceUrl="${resourceUri}"`,
        ),
        listCanonicalImageArtifactAnalysisOccurrences(
          input.googleReadTransport,
          'kind="BUILD" AND '
            + 'build.inTotoSlsaProvenanceV1.predicate.runDetails.metadata.'
            + `invocationId="${canonicalCloudBuildProvenanceInvocationId(
              imageTerminal.cloudBuildResource,
            )}"`,
        ),
      ])

      const imageMetadata = verifyCanonicalImageMetadata(
        imageMetadataResponse,
        imageUri,
        imageDigest,
        QUALIFICATION_IMAGE_NAME,
      )
      verifyQualificationImageBuild({
        value: originalBuildResponse,
        authority,
        submission: imageSubmission,
        terminal: imageTerminal,
      })
      verifyQualificationImageSupplyChainBuild({
        value: supplyChainBuildResponse,
        admission: supplyAdmission,
        observation: supplyObservation,
      })
      const [sbomPath, bundlePath, verificationPath] =
        supplyAdmission.evidenceArtifactPaths
      const sbom = verifyCanonicalImageSpdxSbom({
        body: evidenceArtifacts.byPath.get(sbomPath)?.body,
        imageDigest,
        syftImage: supplyAdmission.toolchain.syftImage,
      })
      const signature = verifyCanonicalImageCosignEvidence({
        bundleBody: evidenceArtifacts.byPath.get(bundlePath)?.body,
        verificationBody: evidenceArtifacts.byPath.get(verificationPath)?.body,
        imageUri,
        imageDigest,
        kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
        supplyChainObservationRef:
          qualificationImageSupplyChainObservationReference(
            supplyObservation,
          ),
      })
      const vulnerabilityScan = verifyCanonicalImageVulnerabilityOccurrences({
        imageDigest,
        resourceUri,
        discoveryOccurrences,
        vulnerabilityOccurrences,
      })
      const securityReview = assertCanonicalSam31ImageSecurityReview(
        await input.securityReviewReadPort.rereadApprovedReview({
          immutableImageDigest: imageDigest,
          vulnerabilityScanRef: vulnerabilityScan.scanRef,
          scanCompletedAt: vulnerabilityScan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt:
            vulnerabilityScan.occurrenceSnapshotUpdatedAt,
          severityCounts: vulnerabilityScan.severityCounts,
        }),
      )
      assertCanonicalImageSecurityReviewMatches(securityReview, {
        imageDigest,
        ...vulnerabilityScan,
      })
      const provenance = verifyCanonicalImageBuildProvenance({
        occurrences: buildOccurrences,
        imageUri,
        imageDigest,
        cloudBuildResource: imageTerminal.cloudBuildResource,
      })

      return deepFreeze({
        evidenceClass: 'canonical_private_reread' as const,
        imageMetadata: {
          projectId: PROJECT_ID,
          region: REGION,
          repository: IMAGE_REPOSITORY,
          packageResource: QUALIFICATION_IMAGE_PACKAGE,
          immutableImageUri: imageUri,
          immutableImageDigest: imageDigest,
          containerManifestMediaType: imageMetadata.mediaType,
          exactDigestReread: true,
          mutableTagUsedAsAuthority: false,
        },
        supplyChainArtifacts: {
          admissionRef: qualificationImageSupplyChainAdmissionReference(
            supplyAdmission,
          ),
          submissionRef: qualificationImageSupplyChainSubmissionReference(
            supplySubmission,
          ),
          observationRef: qualificationImageSupplyChainObservationReference(
            supplyObservation,
          ),
          cloudBuildId: supplyObservation.cloudBuildId,
          cloudBuildResource: supplyObservation.cloudBuildResource,
          exactCloudBuildReread: true,
          exactArtifactManifestReread: true,
          exactThreeArtifactSetReread: true,
        },
        sbom: {
          format: 'spdx_2_3_json' as const,
          artifactRef: sbom.artifactRef,
          contentSha256: sbom.contentSha256,
          imageDigest,
          generatorImageRef: sbom.generatorImageRef,
          completeOsAndApplicationPackageInventory: true,
          exactArtifactReread: true,
        },
        vulnerabilityScan: {
          scanner: 'google_artifact_analysis' as const,
          scanRef: vulnerabilityScan.scanRef,
          imageDigest,
          scanCompletedAt: vulnerabilityScan.scanCompletedAt,
          vulnerabilityDatabaseUpdatedAt:
            vulnerabilityScan.occurrenceSnapshotUpdatedAt,
          ...vulnerabilityScan.severityCounts,
          exactOccurrencesReread: true,
          securityReviewRef: canonicalImageSecurityReviewRef(securityReview),
          securityReviewApprovedForPrivateGpuQualification: true,
        },
        signature: {
          scheme: 'cosign_kms_sha256' as const,
          signatureRef: signature.signatureRef,
          imageDigest,
          kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
          signerServiceAccount: SIGNER_SERVICE_ACCOUNT,
          exactSignatureVerificationPassed: true,
        },
        provenance: {
          predicateType: 'https://slsa.dev/provenance/v1' as const,
          attestationRef: provenance.attestationRef,
          imageDigest,
          cloudBuildId: imageTerminal.cloudBuildId,
          cloudBuildResource: imageTerminal.cloudBuildResource,
          buildAuthorityRef: qualificationBuildAuthorityRef(authority),
          buildSubmissionRef:
            qualificationBuildSubmissionRef(imageSubmission),
          buildRequestHash: imageSubmission.buildRequestHash,
          sourceBucket: authority.capsuleCoordinate.bucketName,
          sourceObject: authority.capsuleCoordinate.objectName,
          sourceGeneration: authority.capsuleCoordinate.generation,
          sourceSha256: authority.capsuleCoordinate.sha256,
          exactAttestationRereadAndVerified: true,
        },
      })
    },
  })
}

export function createCanonicalSam31GcpQualificationImageSupplyChainEvidenceReadPort(
  input: {
    readonly imageBuildAuthority:
      CanonicalSam31QualificationImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalSam31QualificationImageBuildSubmission
    readonly imageBuildTerminal: CanonicalSam31QualificationImageBuildTerminal
    readonly supplyChainBuildAdmission:
      CanonicalSam31QualificationImageSupplyChainBuildAdmission
    readonly supplyChainBuildSubmission:
      CanonicalSam31QualificationImageSupplyChainBuildSubmission
    readonly supplyChainBuildObservation:
      CanonicalSam31QualificationImageSupplyChainBuildObservation
    readonly securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
    readonly privateObjectReadPort?: VisualIntelligencePrivateObjectReadPort
    readonly googleReadTransport?:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
    readonly auth?: GoogleAuthRequest
    readonly requestTimeoutMilliseconds?: number
  },
): CanonicalSam31QualificationImageSupplyChainEvidenceReadPort {
  return createCanonicalSam31QualificationImageSupplyChainEvidenceReadPort({
    ...input,
    privateObjectReadPort: input.privateObjectReadPort
      ?? createVisualIntelligenceGcsPrivateObjectReadPort({
        projectId: PROJECT_ID,
        maximumObjectBytes: 64 * 1024 * 1024,
      }),
    googleReadTransport: input.googleReadTransport
      ?? createCanonicalSam31ImageSupplyChainGoogleReadTransport({
        auth: input.auth,
        requestTimeoutMilliseconds: input.requestTimeoutMilliseconds,
      }),
  })
}

function assertQualificationImageCanonicalLineage(input: {
  authority: CanonicalSam31QualificationImageBuildAuthority
  imageSubmission: CanonicalSam31QualificationImageBuildSubmission
  imageTerminal: CanonicalSam31QualificationImageBuildTerminal
  supplyAdmission: CanonicalSam31QualificationImageSupplyChainBuildAdmission
  supplySubmission:
    CanonicalSam31QualificationImageSupplyChainBuildSubmission
  supplyObservation:
    CanonicalSam31QualificationImageSupplyChainBuildObservation
}): void {
  const authorityRef = qualificationBuildAuthorityRef(input.authority)
  const imageSubmissionRef = qualificationBuildSubmissionRef(
    input.imageSubmission,
  )
  const imageTerminalRef = qualificationBuildTerminalRef(input.imageTerminal)
  const supplyAdmissionRef =
    qualificationImageSupplyChainAdmissionReference(input.supplyAdmission)
  const supplySubmissionRef =
    qualificationImageSupplyChainSubmissionReference(input.supplySubmission)
  if (
    input.authority.evidenceClass !== 'canonical_private_reread'
    || input.authority.status !== 'authorized_for_private_cloud_build'
    || input.imageSubmission.disposition !== 'submitted'
    || !input.imageSubmission.buildRequestHash
    || input.imageTerminal.disposition !==
      'qualification_image_built_pending_supply_chain_release'
    || !input.imageTerminal.immutableImageDigest
    || !input.imageTerminal.immutableImageUri
    || input.supplyAdmission.status !==
      'authorized_for_private_supply_chain_build'
    || input.supplySubmission.disposition !== 'submitted'
    || input.supplyObservation.disposition !==
      'supply_chain_artifacts_ready_pending_exact_reread'
    || input.supplyObservation.cloudBuildStatus !== 'SUCCESS'
    || !input.supplyObservation.evidenceArtifactManifestUri
    || !sameRef(input.imageSubmission.authorityRef, authorityRef)
    || !sameRef(input.imageTerminal.authorityRef, authorityRef)
    || !sameRef(input.imageTerminal.submissionRef, imageSubmissionRef)
    || !sameRef(input.supplyAdmission.buildAuthorityRef, authorityRef)
    || !sameRef(
      input.supplyAdmission.imageBuildSubmissionRef,
      imageSubmissionRef,
    )
    || !sameRef(
      input.supplyAdmission.imageBuildTerminalObservationRef,
      imageTerminalRef,
    )
    || !sameRef(input.supplySubmission.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyObservation.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyObservation.submissionRef, supplySubmissionRef)
    || input.supplyAdmission.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyAdmission.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyObservation.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyObservation.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyObservation.kmsKeyVersionResource !==
      input.supplyAdmission.kmsKeyVersionResource
    || input.supplyObservation.evidenceArtifactCount !== 3
    || !input.supplyObservation.exactBuildConfigurationEchoVerified
    || !input.supplyObservation.allPinnedBuildStepsCompleted
    || !input.supplyObservation.sbomBuildArtifactCreated
    || !input.supplyObservation.digestSignatureCreatedAndVerified
    || input.imageSubmission.buildRequestHash !== sha256AuthorityValue(
      compileCanonicalSam31QualificationImageBuildRequestBody(
        input.authority,
      ),
    )
    || input.supplySubmission.buildRequestHash !== sha256AuthorityValue(
      compileCanonicalSam31QualificationImageSupplyChainBody(
        input.supplyAdmission,
      ),
    )
  ) throw conflict('sam3_1_qualification_supply_chain_lineage_invalid')
}

function assertQualificationImageRequestLineage(
  request: QualificationSupplyChainEvidenceReadRequest,
  input: {
    authority: CanonicalSam31QualificationImageBuildAuthority
    imageSubmission: CanonicalSam31QualificationImageBuildSubmission
    imageTerminal: CanonicalSam31QualificationImageBuildTerminal
    supplyAdmission:
      CanonicalSam31QualificationImageSupplyChainBuildAdmission
    supplySubmission:
      CanonicalSam31QualificationImageSupplyChainBuildSubmission
    supplyObservation:
      CanonicalSam31QualificationImageSupplyChainBuildObservation
  },
): void {
  if (
    !sameRef(request.buildAuthorityRef,
      qualificationBuildAuthorityRef(input.authority))
    || !sameRef(request.buildSubmissionRef,
      qualificationBuildSubmissionRef(input.imageSubmission))
    || !sameRef(request.buildTerminalObservationRef,
      qualificationBuildTerminalRef(input.imageTerminal))
    || !sameRef(request.supplyChainBuildAdmissionRef,
      qualificationImageSupplyChainAdmissionReference(
        input.supplyAdmission,
      ))
    || !sameRef(request.supplyChainBuildSubmissionRef,
      qualificationImageSupplyChainSubmissionReference(
        input.supplySubmission,
      ))
    || !sameRef(request.supplyChainBuildObservationRef,
      qualificationImageSupplyChainObservationReference(
        input.supplyObservation,
      ))
    || request.immutableImageUri !== input.imageTerminal.immutableImageUri
    || request.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || request.originalCloudBuildId !== input.imageTerminal.cloudBuildId
    || request.supplyChainCloudBuildId !==
      input.supplyObservation.cloudBuildId
  ) throw conflict('sam3_1_qualification_supply_read_request_mismatch')
}

function qualificationBuildAuthorityRef(
  authority: CanonicalSam31QualificationImageBuildAuthority,
) {
  return {
    id: authority.authorityId,
    version: 1 as const,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function qualificationBuildSubmissionRef(
  submission: CanonicalSam31QualificationImageBuildSubmission,
) {
  return {
    id:
      `sam31-qualification-image-submission-${submission.submissionHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${submission.submissionHash}` as const,
  }
}

function qualificationBuildTerminalRef(
  terminal: CanonicalSam31QualificationImageBuildTerminal,
) {
  return {
    id:
      `sam31-qualification-image-terminal-${terminal.observationHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${terminal.observationHash}` as const,
  }
}

function assertCanonicalLineage(input: {
  authority: CanonicalSam31CloudImageBuildAuthority
  imageSubmission: CanonicalSam31CloudImageBuildSubmission
  imageTerminal: CanonicalSam31CloudImageBuildTerminalObservation
  supplyAdmission: CanonicalSam31ImageSupplyChainBuildAdmission
  supplySubmission: CanonicalSam31ImageSupplyChainBuildSubmission
  supplyObservation: CanonicalSam31ImageSupplyChainBuildObservation
}): void {
  const authorityRef = canonicalSam31CloudImageBuildAuthorityRef(
    input.authority,
  )
  const imageSubmissionRef = canonicalSam31CloudImageBuildSubmissionRef(
    input.imageSubmission,
  )
  const imageTerminalRef =
    canonicalSam31CloudImageBuildTerminalObservationRef(input.imageTerminal)
  const supplyAdmissionRef = imageSupplyChainBuildAdmissionReference(
    input.supplyAdmission,
  )
  const supplySubmissionRef = imageSupplyChainBuildSubmissionReference(
    input.supplySubmission,
  )
  if (
    input.authority.evidenceClass !== 'canonical_private_reread'
    || input.authority.status !== 'authorized_for_private_cloud_build'
    || input.imageSubmission.disposition !== 'submitted'
    || !input.imageSubmission.buildRequestHash
    || input.imageTerminal.disposition !==
      'image_built_pending_scan_signature_and_gpu_qualification'
    || !input.imageTerminal.immutableImageDigest
    || !input.imageTerminal.immutableImageUri
    || input.supplyAdmission.status !==
      'authorized_for_private_supply_chain_build'
    || input.supplySubmission.disposition !== 'submitted'
    || input.supplyObservation.disposition !==
      'supply_chain_artifacts_ready_pending_exact_reread'
    || input.supplyObservation.cloudBuildStatus !== 'SUCCESS'
    || !input.supplyObservation.evidenceArtifactManifestUri
    || !sameRef(input.imageSubmission.authorityRef, authorityRef)
    || !sameRef(input.imageTerminal.authorityRef, authorityRef)
    || !sameRef(input.imageTerminal.submissionRef, imageSubmissionRef)
    || !sameRef(input.supplyAdmission.buildAuthorityRef, authorityRef)
    || !sameRef(
      input.supplyAdmission.imageBuildSubmissionRef,
      imageSubmissionRef,
    )
    || !sameRef(
      input.supplyAdmission.imageBuildTerminalObservationRef,
      imageTerminalRef,
    )
    || !sameRef(input.supplySubmission.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyObservation.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyObservation.submissionRef, supplySubmissionRef)
    || input.supplyAdmission.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyAdmission.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyObservation.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyObservation.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyObservation.kmsKeyVersionResource !==
      input.supplyAdmission.kmsKeyVersionResource
    || input.supplyObservation.evidenceArtifactCount !== 3
    || !input.supplyObservation.exactBuildConfigurationEchoVerified
    || !input.supplyObservation.allPinnedBuildStepsCompleted
    || !input.supplyObservation.sbomBuildArtifactCreated
    || !input.supplyObservation.digestSignatureCreatedAndVerified
    || input.imageSubmission.buildRequestHash !== sha256AuthorityValue(
      compileCanonicalSam31CloudBuildRequestBody(input.authority),
    )
  ) throw conflict('sam3_1_supply_chain_canonical_lineage_invalid')
}

function assertRequestLineage(
  request: SupplyChainEvidenceReadRequest,
  input: {
    authority: CanonicalSam31CloudImageBuildAuthority
    imageSubmission: CanonicalSam31CloudImageBuildSubmission
    imageTerminal: CanonicalSam31CloudImageBuildTerminalObservation
  },
): void {
  if (
    !sameRef(
      request.buildAuthorityRef,
      canonicalSam31CloudImageBuildAuthorityRef(input.authority),
    )
    || !sameRef(
      request.buildSubmissionRef,
      canonicalSam31CloudImageBuildSubmissionRef(input.imageSubmission),
    )
    || !sameRef(
      request.buildTerminalObservationRef,
      canonicalSam31CloudImageBuildTerminalObservationRef(
        input.imageTerminal,
      ),
    )
    || request.cloudBuildId !== input.imageTerminal.cloudBuildId
    || request.immutableImageUri !== input.imageTerminal.immutableImageUri
    || request.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
  ) throw conflict('sam3_1_supply_chain_read_request_lineage_mismatch')
}

export async function rereadCanonicalImageSupplyChainEvidenceArtifacts(input: {
  observation: {
    readonly evidenceArtifactManifestUri: string | null
    readonly cloudBuildId: string
  }
  admission: {
    readonly evidencePrefix: string
  }
  artifactPaths: readonly [string, string, string]
  privateObjectReadPort: VisualIntelligencePrivateObjectReadPort
}) {
  const manifestCoordinate = parseGcsGenerationUri(
    input.observation.evidenceArtifactManifestUri ?? '',
  )
  if (
    manifestCoordinate.bucketName !== EVIDENCE_BUCKET
    || manifestCoordinate.objectName !==
      `${input.admission.evidencePrefix}/artifacts-${input.observation.cloudBuildId}.json`
  ) throw conflict('sam3_1_supply_chain_artifact_manifest_coordinate_invalid')
  const manifest = await input.privateObjectReadPort.readExact(
    manifestCoordinate,
  )
  if (!manifest) {
    throw notReady('sam3_1_supply_chain_artifact_manifest_missing')
  }
  assertJsonContentType(manifest.contentType)
  const manifestEntries = parseArtifactManifest(manifest.body)
  if (manifestEntries.length !== input.artifactPaths.length) {
    throw conflict('sam3_1_supply_chain_artifact_manifest_count_invalid')
  }
  const expected = new Set(input.artifactPaths)
  const byPath = new Map<string, { body: Buffer; generation: string }>()
  await Promise.all(manifestEntries.map(async (entry) => {
    const coordinate = parseGcsGenerationUri(entry.location)
    const prefix = `${input.admission.evidencePrefix}/`
    if (
      coordinate.bucketName !== EVIDENCE_BUCKET
      || !coordinate.objectName.startsWith(prefix)
    ) throw conflict('sam3_1_supply_chain_artifact_coordinate_invalid')
    const path = coordinate.objectName.slice(prefix.length)
    if (!expected.delete(path)) {
      throw conflict('sam3_1_supply_chain_artifact_path_invalid')
    }
    const object = await input.privateObjectReadPort.readExact(coordinate)
    if (!object) throw notReady('sam3_1_supply_chain_artifact_missing')
    assertJsonContentType(object.contentType)
    const md5 = createHash('md5').update(object.body).digest('base64')
    if (md5 !== entry.md5Base64) {
      throw conflict('sam3_1_supply_chain_artifact_manifest_md5_mismatch')
    }
    byPath.set(path, {
      body: Buffer.from(object.body),
      generation: object.generation,
    })
  }))
  if (expected.size !== 0 || byPath.size !== input.artifactPaths.length) {
    throw conflict('sam3_1_supply_chain_artifact_set_incomplete')
  }
  return { byPath }
}

function parseArtifactManifest(body: Buffer) {
  const value = parseBoundedJson(body, 'sam3_1_artifact_manifest')
  return z.array(z.object({
    location: z.string().regex(
      /^gs:\/\/reeditpro-production-reeditpro-image-supply-chain-evidence\/[A-Za-z0-9._/-]+#[1-9][0-9]{0,30}$/u,
    ),
    file_hash: z.array(z.object({
      type: z.literal(2),
      value: z.string().regex(/^[A-Za-z0-9+/]{22}==$/u),
    }).strict()).length(1),
  }).strict()).length(3).parse(value).map((entry) => ({
    location: entry.location,
    md5Base64: entry.file_hash[0].value,
  }))
}

export function verifyCanonicalImageSpdxSbom(input: {
  body: Buffer | undefined
  imageDigest: string
  syftImage: string
}) {
  if (!input.body) throw notReady('sam3_1_supply_chain_sbom_missing')
  const value = parseBoundedJson(input.body, 'sam3_1_spdx_sbom')
  const root = record(value)
  const creationInfo = record(root.creationInfo)
  const creators = z.array(z.string().min(1).max(512))
    .min(1).max(32).parse(creationInfo.creators)
  const packages = z.array(z.unknown()).min(1).max(200_000)
    .parse(root.packages)
  const relationships = z.array(z.unknown()).min(1).max(400_000)
    .parse(root.relationships)
  const documentDescribes = z.array(z.string().min(1).max(512))
    .min(1).max(32).parse(root.documentDescribes)
  if (
    root.spdxVersion !== 'SPDX-2.3'
    || root.SPDXID !== 'SPDXRef-DOCUMENT'
    || root.dataLicense !== 'CC0-1.0'
    || typeof root.name !== 'string'
    || typeof root.documentNamespace !== 'string'
    || !creators.some((creator) =>
      /^Tool: syft[- ]v?1\.44\.0(?:$|\s)/iu.test(creator))
  ) throw conflict('sam3_1_supply_chain_spdx_identity_invalid')
  const packageIds = new Set<string>()
  for (const packageValue of packages) {
    const item = record(packageValue)
    const id = z.string().min(1).max(512).parse(item.SPDXID)
    z.string().min(1).max(2_048).parse(item.name)
    if (packageIds.has(id)) {
      throw conflict('sam3_1_supply_chain_spdx_package_duplicate')
    }
    packageIds.add(id)
  }
  for (const id of documentDescribes) {
    if (!packageIds.has(id)) {
      throw conflict('sam3_1_supply_chain_spdx_document_scope_invalid')
    }
  }
  for (const relationshipValue of relationships) {
    const relationship = record(relationshipValue)
    z.string().min(1).max(512).parse(relationship.spdxElementId)
    z.string().min(1).max(128).parse(relationship.relationshipType)
    z.string().min(1).max(512).parse(relationship.relatedSpdxElement)
  }
  const contentSha256 = sha256(input.body)
  const generatorDigest = input.syftImage.match(/@sha256:([a-f0-9]{64})$/u)?.[1]
  if (!generatorDigest) {
    throw conflict('sam3_1_supply_chain_sbom_generator_unpinned')
  }
  return {
    contentSha256,
    artifactRef: contentRef(
      `sam31-spdx-sbom-${contentSha256.slice(0, 24)}`,
      contentSha256,
    ),
    generatorImageRef: contentRef(
      'syft-v1.44.0-immutable-image',
      generatorDigest,
    ),
    packageCount: packages.length,
    imageDigest: input.imageDigest,
  }
}

export function verifyCanonicalImageCosignEvidence(input: {
  bundleBody: Buffer | undefined
  verificationBody: Buffer | undefined
  imageUri: string
  imageDigest: string
  kmsKeyVersionResource: string
  supplyChainObservationRef: z.infer<typeof evidenceRefSchema>
}) {
  if (!input.bundleBody || !input.verificationBody) {
    throw notReady('sam3_1_supply_chain_cosign_evidence_missing')
  }
  const bundle = record(parseBoundedJson(
    input.bundleBody,
    'sam3_1_cosign_signature_bundle',
  ))
  const messageSignature = record(bundle.messageSignature)
  const messageDigest = record(messageSignature.messageDigest)
  const expectedDigestBase64 = Buffer.from(
    input.imageDigest.slice(7),
    'hex',
  ).toString('base64')
  if (
    bundle.mediaType !==
      'application/vnd.dev.sigstore.bundle.v0.3+json'
    || messageDigest.algorithm !== 'SHA2_256'
    || messageDigest.digest !== expectedDigestBase64
    || typeof messageSignature.signature !== 'string'
    || messageSignature.signature.length < 40
    || !bundle.verificationMaterial
  ) throw conflict('sam3_1_supply_chain_cosign_bundle_invalid')

  const verification = z.array(z.unknown()).length(1).parse(
    parseBoundedJson(
      input.verificationBody,
      'sam3_1_cosign_verification',
    ),
  )
  const item = record(verification[0])
  const critical = record(item.critical)
  const identity = record(critical.identity)
  const image = record(critical.image)
  const repository = input.imageUri.replace(/@sha256:[a-f0-9]{64}$/u, '')
  if (
    critical.type !== 'cosign container image signature'
    || identity['docker-reference'] !== repository
    || image['docker-manifest-digest'] !== input.imageDigest
  ) throw conflict('sam3_1_supply_chain_cosign_verification_invalid')
  const bundleSha256 = sha256(input.bundleBody)
  const verificationSha256 = sha256(input.verificationBody)
  const signatureHash = sha256AuthorityValue({
    bundleSha256,
    verificationSha256,
    imageDigest: input.imageDigest,
    kmsKeyVersionResource: input.kmsKeyVersionResource,
    supplyChainObservationRef: input.supplyChainObservationRef,
  })
  return {
    signatureRef: contentRef(
      `sam31-cosign-verification-${signatureHash.slice(0, 24)}`,
      signatureHash,
    ),
  }
}

export function verifyCanonicalImageVulnerabilityOccurrences(input: {
  imageDigest: string
  resourceUri: string
  discoveryOccurrences: readonly unknown[]
  vulnerabilityOccurrences: readonly unknown[]
}) {
  if (input.discoveryOccurrences.length < 1) {
    throw notReady('sam3_1_artifact_analysis_discovery_pending')
  }
  const discovery = input.discoveryOccurrences.map((value) => {
    const root = occurrenceRecord(value, 'DISCOVERY', input.resourceUri)
    const details = record(root.discovery)
    const status = z.enum(['FINISHED_SUCCESS', 'COMPLETE'])
      .parse(details.analysisStatus)
    return {
      raw: root,
      name: z.string().min(1).max(1_024).parse(root.name),
      status,
      updateTime: timestamp.parse(root.updateTime),
    }
  })
  assertUnique(discovery.map(({ name }) => name), 'discovery_occurrence')
  const counts = {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    unknownSeverityCount: 0,
  }
  const vulnerabilities = input.vulnerabilityOccurrences.map((value) => {
    const root = occurrenceRecord(value, 'VULNERABILITY', input.resourceUri)
    const details = record(root.vulnerability)
    const effectiveSeverities = [details.effectiveSeverity]
    if (Array.isArray(details.packageIssue)) {
      for (const issueValue of details.packageIssue) {
        const issue = record(issueValue)
        effectiveSeverities.push(issue.effectiveSeverity)
      }
    }
    // Artifact Analysis defines effective severity as the distribution
    // maintainer's assessment for OS packages (and the advisory database's
    // assessment for language packages). Prefer that authenticated field;
    // fall back to the note-provider severity only when no effective value is
    // available. Combining both with a maximum incorrectly re-escalates
    // distro-downgraded findings and makes the release gate disagree with the
    // provider's effective-vulnerability summary.
    const effectiveSeverity = maximumSeverity(effectiveSeverities)
    const severity = effectiveSeverity === 'UNKNOWN'
      ? maximumSeverity([details.severity])
      : effectiveSeverity
    if (severity === 'CRITICAL') counts.criticalCount += 1
    else if (severity === 'HIGH') counts.highCount += 1
    else if (severity === 'MEDIUM') counts.mediumCount += 1
    else if (severity === 'LOW') counts.lowCount += 1
    else counts.unknownSeverityCount += 1
    return {
      raw: root,
      name: z.string().min(1).max(1_024).parse(root.name),
      updateTime: timestamp.parse(root.updateTime),
      severity,
    }
  })
  assertUnique(vulnerabilities.map(({ name }) => name), 'vulnerability')
  const scanCompletedAt = latestTimestamp(
    discovery.map(({ updateTime }) => updateTime),
  )
  const occurrenceSnapshotUpdatedAt = latestTimestamp([
    scanCompletedAt,
    ...vulnerabilities.map(({ updateTime }) => updateTime),
  ])
  const normalized = {
    scanner: 'google_artifact_analysis',
    imageDigest: input.imageDigest,
    resourceUri: input.resourceUri,
    discoveryOccurrences: discovery
      .map(({ raw }) => raw)
      .sort(compareOccurrence),
    vulnerabilityOccurrences: vulnerabilities
      .map(({ raw }) => raw)
      .sort(compareOccurrence),
    scanCompletedAt,
    occurrenceSnapshotUpdatedAt,
    severityCounts: counts,
  }
  const scanHash = sha256AuthorityValue(normalized)
  return {
    scanRef: contentRef(
      `sam31-artifact-analysis-scan-${scanHash.slice(0, 24)}`,
      scanHash,
    ),
    scanCompletedAt,
    occurrenceSnapshotUpdatedAt,
    severityCounts: severityCountsSchema.parse(counts),
  }
}

export function verifyCanonicalImageBuildProvenance(input: {
  occurrences: readonly unknown[]
  imageUri: string
  imageDigest: string
  cloudBuildResource: string
}) {
  const invocationId = canonicalCloudBuildProvenanceInvocationId(
    input.cloudBuildResource,
  )
  const candidates = input.occurrences.flatMap((value) => {
    const root = occurrenceRecord(value, 'BUILD', `https://${input.imageUri}`)
    const build = record(root.build)
    const statement = build.inTotoSlsaProvenanceV1
    if (!statement || typeof statement !== 'object') return []
    verifyProvenanceStatement(statement, {
      imageUri: input.imageUri,
      imageDigest: input.imageDigest,
      invocationId,
    })
    const envelope = record(root.envelope)
    if (envelope.payloadType !== 'application/vnd.in-toto+json') {
      throw conflict('sam3_1_slsa_envelope_type_invalid')
    }
    const signatures = z.array(z.unknown()).min(1).max(8)
      .parse(envelope.signatures)
    for (const signatureValue of signatures) {
      const signature = record(signatureValue)
      if (
        typeof signature.keyid !== 'string'
        || !signature.keyid.includes('projects/verified-builder/')
        || typeof signature.sig !== 'string'
        || signature.sig.length < 40
      ) throw conflict('sam3_1_slsa_signature_invalid')
    }
    const payload = z.string().min(1).max(8 * 1024 * 1024)
      .parse(envelope.payload)
    const decoded = decodeBase64Json(payload, 'sam3_1_slsa_payload')
    verifyProvenanceStatement(decoded, {
      imageUri: input.imageUri,
      imageDigest: input.imageDigest,
      invocationId,
    })
    return [{ root, statement }]
  })
  if (candidates.length !== 1) {
    throw notReady('sam3_1_exact_slsa_v1_provenance_unavailable')
  }
  const attestationHash = sha256AuthorityValue(candidates[0].root)
  return {
    attestationRef: contentRef(
      `sam31-slsa-v1-provenance-${attestationHash.slice(0, 24)}`,
      attestationHash,
    ),
  }
}

function verifyProvenanceStatement(value: unknown, input: {
  imageUri: string
  imageDigest: string
  invocationId: string
}): void {
  const statement = record(value)
  const predicate = record(statement.predicate)
  const runDetails = record(predicate.runDetails)
  const metadata = record(runDetails.metadata)
  const builder = record(runDetails.builder)
  const subjects = z.array(z.unknown()).min(1).max(16).parse(statement.subject)
  const repository = input.imageUri.replace(/@sha256:[a-f0-9]{64}$/u, '')
  const subjectMatched = subjects.some((subjectValue) => {
    const subject = record(subjectValue)
    const digest = record(subject.digest)
    return digest.sha256 === input.imageDigest.slice(7)
      && (subject.name === `https://${repository}`
        || subject.name === repository)
  })
  if (
    statement.predicateType !== 'https://slsa.dev/provenance/v1'
    || metadata.invocationId !== input.invocationId
    || builder.id !==
      'https://cloudbuild.googleapis.com/GoogleHostedWorker'
    || !subjectMatched
  ) throw conflict('sam3_1_slsa_v1_lineage_invalid')
}

export function verifyCanonicalImageMetadata(
  value: unknown,
  imageUri: string,
  imageDigest: string,
  imageName: string,
) {
  assertBoundedPlainJson(value, 'sam3_1_artifact_registry_image')
  const root = record(value)
  const expectedName =
    `projects/reeditpro/locations/us-central1/repositories/`
      + `reeditpro-workers/dockerImages/${imageName}@${imageDigest}`
  const mediaType = z.enum([
    'application/vnd.oci.image.manifest.v1+json',
    'application/vnd.docker.distribution.manifest.v2+json',
  ]).parse(root.mediaType)
  if (
    root.name !== expectedName
    || root.uri !== imageUri
    || !/^[1-9][0-9]{0,30}$/u.test(String(root.imageSizeBytes ?? ''))
    || !timestamp.safeParse(root.uploadTime).success
  ) throw conflict('sam3_1_artifact_registry_image_identity_invalid')
  return { mediaType }
}

function verifyOriginalImageBuild(input: {
  value: unknown
  authority: CanonicalSam31CloudImageBuildAuthority
  submission: CanonicalSam31CloudImageBuildSubmission
  terminal: CanonicalSam31CloudImageBuildTerminalObservation
}): void {
  const root = record(input.value)
  const expected = compileCanonicalSam31CloudBuildRequestBody(input.authority)
  const expectedStorage = record(record(expected.source).storageSource)
  const source = record(record(root.source).storageSource)
  const resolved = record(record(root.sourceProvenance).resolvedStorageSource)
  const results = record(root.results)
  const images = z.array(z.unknown()).length(1).parse(results.images)
  const image = record(images[0])
  const options = record(root.options)
  if (
    root.id !== input.terminal.cloudBuildId
    || root.name !== input.terminal.cloudBuildResource
    || root.projectId !== PROJECT_ID
    || root.status !== 'SUCCESS'
    || !Array.isArray(root.warnings)
    || root.warnings.length !== 0
    || !sameJson(source, expectedStorage)
    || !sameJson(resolved, expectedStorage)
    || root.serviceAccount !== expected.serviceAccount
    || !sameJson(root.images, expected.images)
    || !sameJson(root.tags, expected.tags)
    || options.machineType !== record(expected.options).machineType
    || options.diskSizeGb !== record(expected.options).diskSizeGb
    || options.logging !== record(expected.options).logging
    || !sameJson(
      options.sourceProvenanceHash,
      record(expected.options).sourceProvenanceHash,
    )
    || options.requestedVerifyOption !== 'VERIFIED'
    || image.name !== input.authority.imageDestination.taggedUri
    || image.digest !== input.terminal.immutableImageDigest
    || image.artifactRegistryPackage !== IMAGE_PACKAGE
    || !sourceProvenanceContainsSha256(
      root.sourceProvenance,
      input.authority.capsuleCoordinate.sha256,
    )
    || input.submission.buildRequestHash !== sha256AuthorityValue(expected)
    || hasNonEmptyValue(root.substitutions)
    || hasNonEmptyValue(root.secrets)
    || hasNonEmptyValue(root.availableSecrets)
    || hasNonEmptyValue(root.buildTriggerId)
  ) throw conflict('sam3_1_original_cloud_build_provenance_invalid')
}

function verifyQualificationImageBuild(input: {
  value: unknown
  authority: CanonicalSam31QualificationImageBuildAuthority
  submission: CanonicalSam31QualificationImageBuildSubmission
  terminal: CanonicalSam31QualificationImageBuildTerminal
}): void {
  const root = record(input.value)
  const expected = compileCanonicalSam31QualificationImageBuildRequestBody(
    input.authority,
  )
  const expectedStorage = record(record(expected.source).storageSource)
  const source = record(record(root.source).storageSource)
  const resolved = record(record(root.sourceProvenance).resolvedStorageSource)
  const results = record(root.results)
  const images = z.array(z.unknown()).length(1).parse(results.images)
  const image = record(images[0])
  const options = record(root.options)
  if (
    root.id !== input.terminal.cloudBuildId
    || root.name !== input.terminal.cloudBuildResource
    || root.projectId !== PROJECT_ID
    || root.status !== 'SUCCESS'
    || !Array.isArray(root.warnings)
    || root.warnings.length !== 0
    || !sameJson(source, expectedStorage)
    || !sameJson(resolved, expectedStorage)
    || root.serviceAccount !== expected.serviceAccount
    || !sameJson(root.images, expected.images)
    || !sameJson(root.tags, expected.tags)
    || options.machineType !== record(expected.options).machineType
    || options.diskSizeGb !== record(expected.options).diskSizeGb
    || options.logging !== record(expected.options).logging
    || !sameJson(
      options.sourceProvenanceHash,
      record(expected.options).sourceProvenanceHash,
    )
    || options.requestedVerifyOption !== 'VERIFIED'
    || image.name !== input.authority.imageDestination.taggedUri
    || image.digest !== input.terminal.immutableImageDigest
    || image.artifactRegistryPackage !== QUALIFICATION_IMAGE_PACKAGE
    || !sourceProvenanceContainsSha256(
      root.sourceProvenance,
      input.authority.capsuleCoordinate.sha256,
    )
    || input.submission.buildRequestHash !== sha256AuthorityValue(expected)
    || hasNonEmptyValue(root.substitutions)
    || hasNonEmptyValue(root.secrets)
    || hasNonEmptyValue(root.availableSecrets)
    || hasNonEmptyValue(root.buildTriggerId)
  ) throw conflict('sam3_1_qualification_image_build_provenance_invalid')
}

function verifySupplyChainBuild(input: {
  value: unknown
  admission: CanonicalSam31ImageSupplyChainBuildAdmission
  observation: CanonicalSam31ImageSupplyChainBuildObservation
}): void {
  const root = record(input.value)
  const expected = compileCanonicalSam31ImageSupplyChainCloudBuildBody(
    input.admission,
  )
  const results = record(root.results)
  const options = record(root.options)
  const normalizedSteps = z.array(z.unknown()).parse(root.steps).map(
    (stepValue) => {
      const step = record(stepValue)
      return {
        id: step.id,
        name: step.name,
        ...(Array.isArray(step.waitFor) && step.waitFor.length > 0
          ? { waitFor: step.waitFor }
          : {}),
        args: step.args,
      }
    },
  )
  const artifacts = record(record(root.artifacts).objects)
  const expectedArtifacts = record(record(expected.artifacts).objects)
  const expectedOptions = record(expected.options)
  if (
    root.id !== input.observation.cloudBuildId
    || root.name !== input.observation.cloudBuildResource
    || root.projectId !== PROJECT_ID
    || root.status !== 'SUCCESS'
    || !Array.isArray(root.warnings)
    || root.warnings.length !== 0
    || !sameJson(normalizedSteps, expected.steps)
    || !sameJson(artifacts, expectedArtifacts)
    || root.serviceAccount !== expected.serviceAccount
    || root.timeout !== expected.timeout
    || root.queueTtl !== expected.queueTtl
    || !sameJson(root.tags, expected.tags)
    || options.machineType !== expectedOptions.machineType
    || options.diskSizeGb !== expectedOptions.diskSizeGb
    || options.requestedVerifyOption !== expectedOptions.requestedVerifyOption
    || options.logging !== expectedOptions.logging
    || results.artifactManifest !==
      input.observation.evidenceArtifactManifestUri
    || Number(results.numArtifacts) !== ARTIFACT_PATHS.length
    || hasNonEmptyValue(root.source)
    || hasNonEmptyValue(root.images)
    || hasNonEmptyValue(root.substitutions)
    || hasNonEmptyValue(root.secrets)
    || hasNonEmptyValue(root.availableSecrets)
    || hasNonEmptyValue(root.buildTriggerId)
  ) throw conflict('sam3_1_supply_chain_cloud_build_echo_invalid')
}

function verifyQualificationImageSupplyChainBuild(input: {
  value: unknown
  admission: CanonicalSam31QualificationImageSupplyChainBuildAdmission
  observation: CanonicalSam31QualificationImageSupplyChainBuildObservation
}): void {
  const root = record(input.value)
  const expected = compileCanonicalSam31QualificationImageSupplyChainBody(
    input.admission,
  )
  const results = record(root.results)
  const options = record(root.options)
  const normalizedSteps = z.array(z.unknown()).parse(root.steps).map(
    (stepValue) => {
      const step = record(stepValue)
      return {
        id: step.id,
        name: step.name,
        ...(Array.isArray(step.waitFor) && step.waitFor.length > 0
          ? { waitFor: step.waitFor }
          : {}),
        args: step.args,
      }
    },
  )
  const artifacts = record(record(root.artifacts).objects)
  const expectedArtifacts = record(record(expected.artifacts).objects)
  const expectedOptions = record(expected.options)
  if (
    root.id !== input.observation.cloudBuildId
    || root.name !== input.observation.cloudBuildResource
    || root.projectId !== PROJECT_ID
    || root.status !== 'SUCCESS'
    || !Array.isArray(root.warnings)
    || root.warnings.length !== 0
    || !sameJson(normalizedSteps, expected.steps)
    || !sameJson(artifacts, expectedArtifacts)
    || root.serviceAccount !== expected.serviceAccount
    || root.timeout !== expected.timeout
    || root.queueTtl !== expected.queueTtl
    || !sameJson(root.tags, expected.tags)
    || options.machineType !== expectedOptions.machineType
    || options.diskSizeGb !== expectedOptions.diskSizeGb
    || options.requestedVerifyOption !== expectedOptions.requestedVerifyOption
    || options.logging !== expectedOptions.logging
    || results.artifactManifest !==
      input.observation.evidenceArtifactManifestUri
    || Number(results.numArtifacts) !==
      input.admission.evidenceArtifactPaths.length
    || hasNonEmptyValue(root.source)
    || hasNonEmptyValue(root.images)
    || hasNonEmptyValue(root.substitutions)
    || hasNonEmptyValue(root.secrets)
    || hasNonEmptyValue(root.availableSecrets)
    || hasNonEmptyValue(root.buildTriggerId)
  ) throw conflict('sam3_1_qualification_supply_build_echo_invalid')
}

export async function listCanonicalImageArtifactAnalysisOccurrences(
  transport: CanonicalSam31ImageSupplyChainGoogleReadTransport,
  filter: string,
): Promise<readonly unknown[]> {
  const pages = new Set<string>()
  const occurrences: unknown[] = []
  let pageToken: string | undefined
  for (let page = 0; page < MAXIMUM_OCCURRENCE_PAGES; page += 1) {
    const parameters = new URLSearchParams({ filter, pageSize: '1000' })
    if (pageToken) parameters.set('pageToken', pageToken)
    const response = await getRequiredCanonicalImageSupplyChainJson(
      transport,
      `${OCCURRENCES_ENDPOINT}?${parameters.toString()}`,
      'sam3_1_artifact_analysis_occurrences_reread_failed',
    )
    const root = record(response)
    if (Array.isArray(root.unreachable) && root.unreachable.length > 0) {
      throw notReady('sam3_1_artifact_analysis_partial_result_rejected')
    }
    const values = root.occurrences === undefined
      ? []
      : z.array(z.unknown()).max(1_000).parse(root.occurrences)
    occurrences.push(...values)
    if (occurrences.length > MAXIMUM_OCCURRENCES) {
      throw notReady('sam3_1_artifact_analysis_occurrence_bound_exceeded')
    }
    const next = root.nextPageToken === undefined || root.nextPageToken === ''
      ? undefined
      : z.string().min(1).max(2_048)
        .regex(/^[A-Za-z0-9._~+/=-]+$/u).parse(root.nextPageToken)
    if (!next) return Object.freeze(
      occurrences.map((occurrence) => structuredClone(occurrence)),
    )
    if (pages.has(next)) {
      throw conflict('sam3_1_artifact_analysis_page_token_replayed')
    }
    pages.add(next)
    pageToken = next
  }
  throw notReady('sam3_1_artifact_analysis_pagination_incomplete')
}

export async function getRequiredCanonicalImageSupplyChainJson(
  transport: CanonicalSam31ImageSupplyChainGoogleReadTransport,
  url: string,
  gate: string,
): Promise<unknown> {
  const response = await transport.getJson(url)
  if (response.status < 200 || response.status >= 300) throw notReady(gate)
  assertBoundedPlainJson(response.json, gate)
  return response.json
}

export function assertCanonicalImageSecurityReviewMatches(
  review: CanonicalSam31ImageSecurityReview,
  input: {
    imageDigest: string
    scanRef: z.infer<typeof evidenceRefSchema>
    scanCompletedAt: string
    occurrenceSnapshotUpdatedAt: string
    severityCounts: z.infer<typeof severityCountsSchema>
  },
): void {
  if (
    review.immutableImageDigest !== input.imageDigest
    || !sameRef(review.vulnerabilityScanRef, input.scanRef)
    || review.scanCompletedAt !== input.scanCompletedAt
    || review.occurrenceSnapshotUpdatedAt !==
      input.occurrenceSnapshotUpdatedAt
    || !sameJson(review.severityCounts, input.severityCounts)
  ) throw conflict('sam3_1_image_security_review_scan_mismatch')
}

export function canonicalImageSecurityReviewRef(
  review: CanonicalSam31ImageSecurityReview,
) {
  return contentRef(review.reviewId, review.reviewHash)
}

function occurrenceRecord(
  value: unknown,
  kind: 'BUILD' | 'DISCOVERY' | 'VULNERABILITY',
  resourceUri: string,
) {
  const root = record(value)
  if (root.kind !== kind || root.resourceUri !== resourceUri) {
    throw conflict('sam3_1_artifact_analysis_occurrence_scope_invalid')
  }
  z.string().min(1).max(1_024).parse(root.name)
  z.string().min(1).max(1_024).parse(root.noteName)
  timestamp.parse(root.updateTime)
  return root
}

function maximumSeverity(values: unknown[]):
  'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' {
  const normalized = values.flatMap((value) => {
    if (typeof value !== 'string') return []
    if (value === 'CRITICAL') return ['CRITICAL' as const]
    if (value === 'HIGH') return ['HIGH' as const]
    if (value === 'MEDIUM') return ['MEDIUM' as const]
    if (['LOW', 'MINIMAL', 'NEGLIGIBLE'].includes(value)) {
      return ['LOW' as const]
    }
    return ['UNKNOWN' as const]
  })
  const order = ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
  return normalized.reduce<typeof order[number]>(
    (current, candidate) =>
      order.indexOf(candidate) > order.indexOf(current)
        ? candidate
        : current,
    'UNKNOWN',
  )
}

function sourceProvenanceContainsSha256(
  value: unknown,
  expectedHex: string,
): boolean {
  const expectedBase64 = Buffer.from(expectedHex, 'hex').toString('base64')
  let matched = false
  const visit = (item: unknown): void => {
    if (matched || !item || typeof item !== 'object') return
    if (!Array.isArray(item)) {
      const object = item as Record<string, unknown>
      if (object.type === 'SHA256' && object.value === expectedBase64) {
        matched = true
        return
      }
    }
    for (const child of Array.isArray(item)
      ? item
      : Object.values(item as Record<string, unknown>)) visit(child)
  }
  visit(value)
  return matched
}

function parseGcsGenerationUri(value: string) {
  const match = value.match(
    /^gs:\/\/([a-z0-9][a-z0-9._-]{1,220}[a-z0-9])\/([A-Za-z0-9][A-Za-z0-9._/-]{0,2047})#([1-9][0-9]{0,30})$/u,
  )
  if (
    !match
    || match[2].includes('..')
    || match[2].includes('//')
    || match[2].includes('\\')
  ) throw conflict('sam3_1_supply_chain_gcs_generation_uri_invalid')
  return {
    bucketName: match[1],
    objectName: match[2],
    generation: match[3],
  }
}

export function canonicalArtifactRegistryImageUrl(
  imageDigest: string,
  imageName: string,
): string {
  const imageId = encodeURIComponent(`${imageName}@${imageDigest}`)
  return 'https://artifactregistry.googleapis.com/v1/projects/reeditpro/'
    + 'locations/us-central1/repositories/reeditpro-workers/dockerImages/'
    + imageId
}

export function canonicalCloudBuildReadUrl(resource: string): string {
  return `https://cloudbuild.googleapis.com/v1/${resource}`
}

export function canonicalCloudBuildProvenanceInvocationId(
  resource: string,
): string {
  return `https://cloudbuild.googleapis.com/v1/${resource}`
}

export function assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
  value: string,
): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw notReady('sam3_1_supply_chain_google_read_url_invalid')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw notReady('sam3_1_supply_chain_google_read_url_invalid')
  }
  const cloudBuild = url.origin === 'https://cloudbuild.googleapis.com'
    && /^\/v1\/projects\/reeditpro\/locations\/us-central1\/builds\/[0-9a-f-]{36}$/u
      .test(url.pathname)
    && !url.search
  const decodedPath = safelyDecodePath(url.pathname)
  const artifactRegistry =
    url.origin === 'https://artifactregistry.googleapis.com'
    && /^\/v1\/projects\/reeditpro\/locations\/us-central1\/repositories\/reeditpro-workers\/dockerImages\/(?:reeditpro-sam31-(?:gpu|qualification)|reeditpro-track-all-l4-task-qa)@sha256:[a-f0-9]{64}$/u
      .test(decodedPath)
    && !url.search
  const filter = url.searchParams.get('filter') ?? ''
  const occurrenceFilterAllowed = [
    /^kind="DISCOVERY" AND resourceUrl="https:\/\/us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/(?:reeditpro-sam31-(?:gpu|qualification)|reeditpro-track-all-l4-task-qa)@sha256:[a-f0-9]{64}"$/u,
    /^kind="VULNERABILITY" AND resourceUrl="https:\/\/us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/(?:reeditpro-sam31-(?:gpu|qualification)|reeditpro-track-all-l4-task-qa)@sha256:[a-f0-9]{64}"$/u,
    /^kind="BUILD" AND build\.inTotoSlsaProvenanceV1\.predicate\.runDetails\.metadata\.invocationId="https:\/\/cloudbuild\.googleapis\.com\/v1\/projects\/reeditpro\/locations\/us-central1\/builds\/[0-9a-f-]{36}"$/u,
  ].some((pattern) => pattern.test(filter))
  const occurrenceKeys = [...url.searchParams.keys()]
  const occurrences =
    url.origin === 'https://containeranalysis.googleapis.com'
    && url.pathname === '/v1/projects/reeditpro/occurrences'
    && url.searchParams.get('pageSize') === '1000'
    && occurrenceFilterAllowed
    && occurrenceKeys.every((key) =>
      ['filter', 'pageSize', 'pageToken'].includes(key))
    && ['filter', 'pageSize', 'pageToken'].every((key) =>
      url.searchParams.getAll(key).length <= 1)
    && (url.searchParams.get('pageToken') === null
      || /^[A-Za-z0-9._~+/=-]{1,2048}$/u.test(
        url.searchParams.get('pageToken') ?? '',
      ))
  if (!cloudBuild && !artifactRegistry && !occurrences) {
    throw notReady('sam3_1_supply_chain_google_read_url_not_allowlisted')
  }
}

function safelyDecodePath(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    throw notReady('sam3_1_supply_chain_google_read_url_invalid')
  }
}

function parseBoundedJson(body: Buffer, label: string): unknown {
  if (body.byteLength < 2 || body.byteLength > 64 * 1024 * 1024) {
    throw conflict(`${label}_size_invalid`)
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict(`${label}_json_invalid`)
  }
  assertBoundedPlainJson(value, label)
  return value
}

function decodeBase64Json(value: string, label: string): unknown {
  let body: Buffer
  try {
    body = Buffer.from(value.replace(/-/gu, '+').replace(/_/gu, '/'), 'base64')
  } catch {
    throw conflict(`${label}_base64_invalid`)
  }
  return parseBoundedJson(body, label)
}

function assertJsonContentType(value: string): void {
  if (![
    'application/json',
    'application/spdx+json',
    'application/octet-stream',
  ].includes(value)) throw conflict('sam3_1_supply_chain_content_type_invalid')
}

function latestTimestamp(values: string[]): string {
  if (values.length < 1) throw new Error('Timestamp set is empty.')
  return values.reduce((latest, current) =>
    Date.parse(current) > Date.parse(latest) ? current : latest)
}

function compareOccurrence(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): number {
  const a = String(left.name ?? '')
  const b = String(right.name ?? '')
  return a < b ? -1 : a > b ? 1 : 0
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw conflict(`sam3_1_${label}_duplicate`)
  }
}

function contentRef(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameJson(left: unknown, right: unknown): boolean {
  return sha256AuthorityValue(left) === sha256AuthorityValue(right)
}

function hasNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Reflect.ownKeys(value).length > 0
  return true
}

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('sam3_1_supply_chain_record_invalid')
  }
  return value as Record<string, unknown>
}

function assertPorts(input: {
  privateObjectReadPort: VisualIntelligencePrivateObjectReadPort
  googleReadTransport: CanonicalSam31ImageSupplyChainGoogleReadTransport
  securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
}): void {
  if (
    typeof input.privateObjectReadPort?.readExact !== 'function'
    || typeof input.googleReadTransport?.getJson !== 'function'
    || typeof input.securityReviewReadPort?.rereadApprovedReview !== 'function'
  ) throw notReady('sam3_1_supply_chain_read_port_invalid')
}

function assertClosedPlainData(value: unknown, label: string): void {
  assertPlainData(value, label)
}

function assertBoundedPlainJson(value: unknown, label: string): void {
  assertPlainData(value, label)
}

function assertPlainData(value: unknown, label: string) {
  const seen = new Set<object>()
  let nodes = 0
  const visit = (item: unknown, depth: number): void => {
    nodes += 1
    if (nodes > 500_000 || depth > 96) {
      throw conflict(`${label}_structure_bound_exceeded`)
    }
    if (
      item === undefined
      || typeof item === 'function'
      || typeof item === 'symbol'
      || typeof item === 'bigint'
      || (typeof item === 'number' && !Number.isFinite(item))
    ) {
      throw conflict(`${label}_contains_undefined`)
    }
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw conflict(`${label}_contains_cycle`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw conflict(`${label}_not_plain_data`)
    }
    seen.add(item)
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length; index += 1) {
        if (!Object.hasOwn(item, index)) {
          throw conflict(`${label}_sparse_array_rejected`)
        }
      }
    }
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') throw conflict(`${label}_symbol_key`)
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw conflict(`${label}_accessor_rejected`)
      }
      visit(descriptor.value, depth + 1)
    }
    seen.delete(item)
  }
  visit(value, 0)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key])
    }
  }
  return value
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The SAM 3.1 image supply-chain evidence is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The SAM 3.1 image supply-chain evidence failed exact validation.',
    409,
    { requiredGate },
  )
}
