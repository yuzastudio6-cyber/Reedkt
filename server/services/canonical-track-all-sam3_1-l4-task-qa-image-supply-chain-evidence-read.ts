import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
  compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody,
  imageSupplyChainAdmissionRef,
  imageSupplyChainSubmissionRef,
  imageSupplyChainTerminalRef,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  assertCanonicalImageSecurityReviewMatches,
  assertCanonicalSam31ImageSecurityReview,
  canonicalArtifactRegistryImageUrl,
  canonicalCloudBuildReadUrl,
  canonicalImageSecurityReviewRef,
  createCanonicalSam31ImageSupplyChainGoogleReadTransport,
  getRequiredCanonicalImageSupplyChainJson,
  listCanonicalImageArtifactAnalysisOccurrences,
  rereadCanonicalImageSupplyChainEvidenceArtifacts,
  verifyCanonicalImageBuildProvenance,
  verifyCanonicalImageCosignEvidence,
  verifyCanonicalImageMetadata,
  verifyCanonicalImageSpdxSbom,
  verifyCanonicalImageVulnerabilityOccurrences,
  type CanonicalSam31ImageSecurityReviewReadPort,
  type CanonicalSam31ImageSupplyChainGoogleReadTransport,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createVisualIntelligenceGcsPrivateObjectReadPort,
  type VisualIntelligencePrivateObjectReadPort,
} from '../visual-intelligence/visual-intelligence-private-object-read-port'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SUPPLY_CHAIN_EVIDENCE_READER_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-evidence-reader-v1' as const

const PROJECT_ID = 'reeditpro' as const
const PROJECT_NUMBER = '390722338345' as const
const REGION = 'us-central1' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_NAME = 'reeditpro-track-all-l4-task-qa' as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-track-all-l4-task-qa' as const
const SIGNER_SERVICE_ACCOUNT =
  'reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const
const ARTIFACT_PATHS = Object.freeze([
  'track-all-l4-task-qa.spdx.json',
  'cosign-signature.bundle.json',
  'cosign-verification.json',
] as const)

const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const imageUriSchema = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-track-all-l4-task-qa@sha256:[a-f0-9]{64}$/u,
)

export const canonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequestSchema =
  z.object({
    imageBuildAuthorityRef: evidenceRefSchema,
    imageBuildSubmissionRef: evidenceRefSchema,
    imageBuildTerminalRef: evidenceRefSchema,
    supplyChainAdmissionRef: evidenceRefSchema,
    supplyChainSubmissionRef: evidenceRefSchema,
    supplyChainTerminalRef: evidenceRefSchema,
    immutableImageUri: imageUriSchema,
    immutableImageDigest: prefixedSha256,
    originalCloudBuildId: z.string().uuid(),
    supplyChainCloudBuildId: z.string().uuid(),
  }).strict()
export type CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest =
  z.infer<
    typeof canonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequestSchema
  >

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadPort {
  rereadExact(
    request: CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest,
  ): Promise<CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidence>
}

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest(
  input: {
    readonly imageBuildAuthority:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
    readonly imageBuildTerminal:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
    readonly supplyChainAdmission:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
    readonly supplyChainSubmission:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
    readonly supplyChainTerminal:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
  },
): CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest {
  const records = {
    imageAuthority:
      assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
        input.imageBuildAuthority,
      ),
    imageSubmission:
      assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
        input.imageBuildSubmission,
      ),
    imageTerminal:
      assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(
        input.imageBuildTerminal,
      ),
    supplyAdmission:
      assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
        input.supplyChainAdmission,
      ),
    supplySubmission:
      assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(
        input.supplyChainSubmission,
      ),
    supplyTerminal:
      assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal(
        input.supplyChainTerminal,
      ),
  }
  assertCanonicalLineage(records)
  return canonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequestSchema
    .parse({
      imageBuildAuthorityRef:
        canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(
          records.imageAuthority,
        ),
      imageBuildSubmissionRef:
        canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
          records.imageSubmission,
        ),
      imageBuildTerminalRef:
        canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
          records.imageTerminal,
        ),
      supplyChainAdmissionRef: imageSupplyChainAdmissionRef(
        records.supplyAdmission,
      ),
      supplyChainSubmissionRef: imageSupplyChainSubmissionRef(
        records.supplySubmission,
      ),
      supplyChainTerminalRef: imageSupplyChainTerminalRef(
        records.supplyTerminal,
      ),
      immutableImageUri: records.imageTerminal.immutableImageUri,
      immutableImageDigest: records.imageTerminal.immutableImageDigest,
      originalCloudBuildId: records.imageTerminal.cloudBuildId,
      supplyChainCloudBuildId: records.supplyTerminal.cloudBuildId,
    })
}

export interface CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidence {
  readonly evidenceClass: 'canonical_private_reread'
  readonly imageMetadata: {
    readonly projectId: typeof PROJECT_ID
    readonly region: typeof REGION
    readonly repository: typeof IMAGE_REPOSITORY
    readonly packageResource: typeof IMAGE_PACKAGE
    readonly immutableImageUri: string
    readonly immutableImageDigest: string
    readonly containerManifestMediaType:
      | 'application/vnd.oci.image.manifest.v1+json'
      | 'application/vnd.docker.distribution.manifest.v2+json'
    readonly exactDigestReread: true
    readonly mutableTagUsedAsAuthority: false
  }
  readonly supplyChainArtifacts: {
    readonly admissionRef: z.infer<typeof evidenceRefSchema>
    readonly submissionRef: z.infer<typeof evidenceRefSchema>
    readonly terminalRef: z.infer<typeof evidenceRefSchema>
    readonly cloudBuildId: string
    readonly cloudBuildResource: string
    readonly exactCloudBuildReread: true
    readonly exactArtifactManifestReread: true
    readonly exactThreeArtifactSetReread: true
  }
  readonly sbom: {
    readonly format: 'spdx_2_3_json'
    readonly artifactRef: z.infer<typeof evidenceRefSchema>
    readonly contentSha256: string
    readonly imageDigest: string
    readonly generatorImageRef: z.infer<typeof evidenceRefSchema>
    readonly completeOsAndApplicationPackageInventory: true
    readonly exactArtifactReread: true
  }
  readonly vulnerabilityScan: {
    readonly scanner: 'google_artifact_analysis'
    readonly scanRef: z.infer<typeof evidenceRefSchema>
    readonly imageDigest: string
    readonly scanCompletedAt: string
    readonly vulnerabilityDatabaseUpdatedAt: string
    readonly criticalCount: number
    readonly highCount: number
    readonly mediumCount: number
    readonly lowCount: number
    readonly unknownSeverityCount: number
    readonly exactOccurrencesReread: true
    readonly securityReviewRef: z.infer<typeof evidenceRefSchema>
    readonly securityReviewApprovedForPrivateGpuQualification: true
  }
  readonly signature: {
    readonly scheme: 'cosign_kms_sha256'
    readonly signatureRef: z.infer<typeof evidenceRefSchema>
    readonly imageDigest: string
    readonly kmsKeyVersionResource: string
    readonly signerServiceAccount: typeof SIGNER_SERVICE_ACCOUNT
    readonly exactSignatureVerificationPassed: true
  }
  readonly provenance: {
    readonly predicateType: 'https://slsa.dev/provenance/v1'
    readonly attestationRef: z.infer<typeof evidenceRefSchema>
    readonly imageDigest: string
    readonly cloudBuildId: string
    readonly cloudBuildResource: string
    readonly buildAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly buildSubmissionRef: z.infer<typeof evidenceRefSchema>
    readonly buildRequestHash: string
    readonly sourceBucket: string
    readonly sourceObject: string
    readonly sourceGeneration: string
    readonly sourceSha256: string
    readonly exactAttestationRereadAndVerified: true
  }
  readonly authority: {
    readonly exactImageBuildSupplyChainAndSecurityReviewReread: true
    readonly approvedForPrivateL4GpuQualificationOnly: true
    readonly gpuRuntimeReleased: false
    readonly gpuJobDispatched: false
    readonly customerCreditsMutated: false
    readonly qaApproved: false
    readonly publicDeliveryAuthorized: false
    readonly productionReady: false
  }
}

export function createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadPort(
  input: {
    readonly imageBuildAuthority:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
    readonly imageBuildTerminal:
      CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
    readonly supplyChainAdmission:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
    readonly supplyChainSubmission:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
    readonly supplyChainTerminal:
      CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
    readonly privateObjectReadPort: VisualIntelligencePrivateObjectReadPort
    readonly googleReadTransport:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
    readonly securityReviewReadPort: CanonicalSam31ImageSecurityReviewReadPort
  },
): CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadPort {
  const imageAuthority =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
      input.imageBuildAuthority,
    )
  const imageSubmission =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(
      input.imageBuildSubmission,
    )
  const imageTerminal =
    assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(
      input.imageBuildTerminal,
    )
  const supplyAdmission =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(
      input.supplyChainAdmission,
    )
  const supplySubmission =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission(
      input.supplyChainSubmission,
    )
  const supplyTerminal =
    assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal(
      input.supplyChainTerminal,
    )
  assertPorts(input)
  assertCanonicalLineage({
    imageAuthority,
    imageSubmission,
    imageTerminal,
    supplyAdmission,
    supplySubmission,
    supplyTerminal,
  })

  return Object.freeze({
    async rereadExact(
      requestValue:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest,
    ) {
      assertPlainSerializedData(requestValue, 'track_all_l4_supply_chain_read')
      const request =
        canonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequestSchema
          .parse(requestValue)
      assertRequestLineage(request, {
        imageAuthority,
        imageSubmission,
        imageTerminal,
        supplyAdmission,
        supplySubmission,
        supplyTerminal,
      })
      const imageUri = imageTerminal.immutableImageUri
      const imageDigest = imageTerminal.immutableImageDigest
      if (!imageUri || !imageDigest) {
        throw new Error('track_all_l4_supply_chain_image_missing')
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
          'track_all_l4_artifact_registry_image_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(imageTerminal.cloudBuildResource),
          'track_all_l4_original_cloud_build_reread_failed',
        ),
        getRequiredCanonicalImageSupplyChainJson(
          input.googleReadTransport,
          canonicalCloudBuildReadUrl(supplyTerminal.cloudBuildResource),
          'track_all_l4_supply_chain_cloud_build_reread_failed',
        ),
        rereadCanonicalImageSupplyChainEvidenceArtifacts({
          observation: supplyTerminal,
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
          `kind="BUILD" AND resourceUrl="${resourceUri}"`,
        ),
      ])

      const imageMetadata = verifyCanonicalImageMetadata(
        imageMetadataResponse,
        imageUri,
        imageDigest,
        IMAGE_NAME,
      )
      verifyOriginalBuild({
        value: originalBuildResponse,
        authority: imageAuthority,
        submission: imageSubmission,
        terminal: imageTerminal,
      })
      verifySupplyChainBuild({
        value: supplyChainBuildResponse,
        admission: supplyAdmission,
        terminal: supplyTerminal,
      })
      const sbom = verifyCanonicalImageSpdxSbom({
        body: evidenceArtifacts.byPath.get(ARTIFACT_PATHS[0])?.body,
        imageDigest,
        syftImage: supplyAdmission.buildPolicy.syftImage,
      })
      const signature = verifyCanonicalImageCosignEvidence({
        bundleBody: evidenceArtifacts.byPath.get(ARTIFACT_PATHS[1])?.body,
        verificationBody: evidenceArtifacts.byPath.get(ARTIFACT_PATHS[2])?.body,
        imageUri,
        imageDigest,
        kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
        supplyChainObservationRef: imageSupplyChainTerminalRef(supplyTerminal),
      })
      const scan = verifyCanonicalImageVulnerabilityOccurrences({
        imageDigest,
        resourceUri,
        discoveryOccurrences,
        vulnerabilityOccurrences,
      })
      const review = assertCanonicalSam31ImageSecurityReview(
        await input.securityReviewReadPort.rereadApprovedReview({
          immutableImageDigest: imageDigest,
          vulnerabilityScanRef: scan.scanRef,
          scanCompletedAt: scan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
          severityCounts: scan.severityCounts,
        }),
      )
      assertCanonicalImageSecurityReviewMatches(review, {
        imageDigest,
        ...scan,
      })
      const provenance = verifyCanonicalImageBuildProvenance({
        occurrences: buildOccurrences,
        imageUri,
        imageDigest,
        taggedImageUri: imageAuthority.imageDestination.taggedUri,
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
          exactDigestReread: true as const,
          mutableTagUsedAsAuthority: false as const,
        },
        supplyChainArtifacts: {
          admissionRef: imageSupplyChainAdmissionRef(supplyAdmission),
          submissionRef: imageSupplyChainSubmissionRef(supplySubmission),
          terminalRef: imageSupplyChainTerminalRef(supplyTerminal),
          cloudBuildId: supplyTerminal.cloudBuildId,
          cloudBuildResource: supplyTerminal.cloudBuildResource,
          exactCloudBuildReread: true as const,
          exactArtifactManifestReread: true as const,
          exactThreeArtifactSetReread: true as const,
        },
        sbom: {
          format: 'spdx_2_3_json' as const,
          artifactRef: sbom.artifactRef,
          contentSha256: sbom.contentSha256,
          imageDigest,
          generatorImageRef: sbom.generatorImageRef,
          completeOsAndApplicationPackageInventory: true as const,
          exactArtifactReread: true as const,
        },
        vulnerabilityScan: {
          scanner: 'google_artifact_analysis' as const,
          scanRef: scan.scanRef,
          imageDigest,
          scanCompletedAt: scan.scanCompletedAt,
          vulnerabilityDatabaseUpdatedAt:
            scan.occurrenceSnapshotUpdatedAt,
          ...scan.severityCounts,
          exactOccurrencesReread: true as const,
          securityReviewRef: canonicalImageSecurityReviewRef(review),
          securityReviewApprovedForPrivateGpuQualification: true as const,
        },
        signature: {
          scheme: 'cosign_kms_sha256' as const,
          signatureRef: signature.signatureRef,
          imageDigest,
          kmsKeyVersionResource: supplyAdmission.kmsKeyVersionResource,
          signerServiceAccount: SIGNER_SERVICE_ACCOUNT,
          exactSignatureVerificationPassed: true as const,
        },
        provenance: {
          predicateType: 'https://slsa.dev/provenance/v1' as const,
          attestationRef: provenance.attestationRef,
          imageDigest,
          cloudBuildId: imageTerminal.cloudBuildId,
          cloudBuildResource: imageTerminal.cloudBuildResource,
          buildAuthorityRef:
            canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(
              imageAuthority,
            ),
          buildSubmissionRef:
            canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
              imageSubmission,
            ),
          buildRequestHash: imageSubmission.buildRequestHash ?? '',
          sourceBucket: imageAuthority.buildSourceCoordinate.bucketName,
          sourceObject: imageAuthority.buildSourceCoordinate.objectName,
          sourceGeneration: imageAuthority.buildSourceCoordinate.generation,
          sourceSha256: imageAuthority.buildSourceCoordinate.sha256,
          exactAttestationRereadAndVerified: true as const,
        },
        authority: {
          exactImageBuildSupplyChainAndSecurityReviewReread: true as const,
          approvedForPrivateL4GpuQualificationOnly: true as const,
          gpuRuntimeReleased: false as const,
          gpuJobDispatched: false as const,
          customerCreditsMutated: false as const,
          qaApproved: false as const,
          publicDeliveryAuthorized: false as const,
          productionReady: false as const,
        },
      })
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpImageSupplyChainEvidenceReadPort(
  input: Omit<
    Parameters<
      typeof createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadPort
    >[0],
    'privateObjectReadPort' | 'googleReadTransport'
  > & {
    readonly privateObjectReadPort?: VisualIntelligencePrivateObjectReadPort
    readonly googleReadTransport?:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
  },
) {
  return createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadPort({
    ...input,
    privateObjectReadPort: input.privateObjectReadPort
      ?? createVisualIntelligenceGcsPrivateObjectReadPort({
        projectId: PROJECT_ID,
        maximumObjectBytes: 64 * 1024 * 1024,
      }),
    googleReadTransport: input.googleReadTransport
      ?? createCanonicalSam31ImageSupplyChainGoogleReadTransport(),
  })
}

function assertCanonicalLineage(input: {
  imageAuthority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
  imageSubmission: CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
  imageTerminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
  supplyAdmission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
  supplySubmission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
  supplyTerminal: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
}): void {
  const imageAuthorityRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(
      input.imageAuthority,
    )
  const imageSubmissionRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
      input.imageSubmission,
    )
  const imageTerminalRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
      input.imageTerminal,
    )
  const supplyAdmissionRef = imageSupplyChainAdmissionRef(
    input.supplyAdmission,
  )
  const supplySubmissionRef = imageSupplyChainSubmissionRef(
    input.supplySubmission,
  )
  const compiled = compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
    input.imageAuthority,
  )
  if (
    input.imageAuthority.evidenceClass !== 'canonical_private_reread'
    || input.imageAuthority.status !== 'authorized_for_private_cloud_build'
    || input.imageSubmission.disposition !== 'outcome_unknown'
    || input.imageSubmission.providerOutcome !== 'unknown'
    || input.imageSubmission.buildRequestHash !== compiled.requestHash
    || input.imageTerminal.disposition !==
      'image_built_pending_supply_chain_release'
    || !input.imageTerminal.immutableImageUri
    || !input.imageTerminal.immutableImageDigest
    || input.supplyAdmission.status !==
      'authorized_for_private_supply_chain_build'
    || input.supplySubmission.disposition !== 'submitted'
    || input.supplyTerminal.disposition !==
      'supply_chain_artifacts_ready_pending_exact_reread'
    || input.supplyTerminal.cloudBuildStatus !== 'SUCCESS'
    || !sameRef(input.imageSubmission.authorityRef, imageAuthorityRef)
    || !sameRef(input.imageTerminal.authorityRef, imageAuthorityRef)
    || !sameRef(input.imageTerminal.submissionRef, imageSubmissionRef)
    || !sameRef(input.supplyAdmission.imageBuildAuthorityRef, imageAuthorityRef)
    || !sameRef(
      input.supplyAdmission.imageBuildSubmissionRef,
      imageSubmissionRef,
    )
    || !sameRef(input.supplyAdmission.imageBuildTerminalRef, imageTerminalRef)
    || !sameRef(input.supplySubmission.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyTerminal.admissionRef, supplyAdmissionRef)
    || !sameRef(input.supplyTerminal.submissionRef, supplySubmissionRef)
    || input.supplyAdmission.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyAdmission.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyTerminal.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || input.supplyTerminal.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyTerminal.evidenceArtifactCount !== ARTIFACT_PATHS.length
    || !input.supplyTerminal.exactBuildConfigurationEchoVerified
    || !input.supplyTerminal.allPinnedBuildStepsCompleted
    || !input.supplyTerminal.sbomArtifactCreated
    || !input.supplyTerminal.kmsDigestSignatureCreatedAndVerified
    || input.supplySubmission.buildRequestHash !== sha256AuthorityValue(
      compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(
        input.supplyAdmission,
      ),
    )
  ) throw new Error('track_all_l4_supply_chain_lineage_invalid')
}

function assertRequestLineage(
  request: CanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest,
  input: {
    imageAuthority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
    imageSubmission: CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
    imageTerminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
    supplyAdmission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
    supplySubmission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
    supplyTerminal: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
  },
): void {
  if (
    !sameRef(request.imageBuildAuthorityRef,
      canonicalTrackAllSam31L4TaskQaCloudImageBuildAuthorityRef(
        input.imageAuthority,
      ))
    || !sameRef(request.imageBuildSubmissionRef,
      canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
        input.imageSubmission,
      ))
    || !sameRef(request.imageBuildTerminalRef,
      canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
        input.imageTerminal,
      ))
    || !sameRef(request.supplyChainAdmissionRef,
      imageSupplyChainAdmissionRef(input.supplyAdmission))
    || !sameRef(request.supplyChainSubmissionRef,
      imageSupplyChainSubmissionRef(input.supplySubmission))
    || !sameRef(request.supplyChainTerminalRef,
      imageSupplyChainTerminalRef(input.supplyTerminal))
    || request.immutableImageUri !== input.imageTerminal.immutableImageUri
    || request.immutableImageDigest !== input.imageTerminal.immutableImageDigest
    || request.originalCloudBuildId !== input.imageTerminal.cloudBuildId
    || request.supplyChainCloudBuildId !== input.supplyTerminal.cloudBuildId
  ) throw new Error('track_all_l4_supply_chain_request_lineage_mismatch')
}

function verifyOriginalBuild(input: {
  value: unknown
  authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
  submission: CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
  terminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
}): void {
  const root = record(input.value)
  const expected = compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
    input.authority,
  ).body as Record<string, unknown>
  const expectedSource = record(expected.source)
  const expectedStorage = record(expectedSource.storageSource)
  const source = record(record(root.source).storageSource)
  const sourceProvenance = record(root.sourceProvenance)
  const resolvedSource = record(sourceProvenance.resolvedStorageSource)
  const results = record(root.results)
  const images = z.array(z.unknown()).length(1).parse(results.images)
  const resultImage = record(images[0])
  const failures = ([
    [root.id !== input.terminal.cloudBuildId, 'id'],
    [!isExpectedBuildResource(root.name, input.terminal.cloudBuildId), 'name'],
    [![PROJECT_ID, PROJECT_NUMBER].includes(
      String(root.projectId) as never,
    ), 'project'],
    [root.status !== 'SUCCESS', 'status'],
    [hasUnexpectedWarnings(root.warnings), 'warnings'],
    [!sameStorageSource(source, expectedStorage), 'source'],
    [!sameStorageSource(resolvedSource, expectedStorage), 'resolved_source'],
    [!sameCloudBuildSteps(root.steps, expected.steps), 'steps'],
    [!sameJson(root.images, expected.images), 'images'],
    [root.serviceAccount !== expected.serviceAccount, 'service_account'],
    [root.timeout !== expected.timeout, 'timeout'],
    [root.queueTtl !== expected.queueTtl, 'queue_ttl'],
    [!sameCloudBuildOptions(root.options, expected.options), 'options'],
    [!sameJson(root.tags, expected.tags), 'tags'],
    [resultImage.name !== input.authority.imageDestination.taggedUri,
      'result_image'],
    [resultImage.digest !== input.terminal.immutableImageDigest,
      'result_digest'],
    [resultImage.artifactRegistryPackage !==
      `${IMAGE_PACKAGE}/versions/${input.terminal.immutableImageDigest}`,
    'result_package'],
    [!containsSha256(
      sourceProvenance,
      input.authority.buildSourceCoordinate.sha256,
    ), 'source_sha256'],
    [input.submission.buildRequestHash !==
      compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
        input.authority,
      ).requestHash, 'request_hash'],
    [hasNonEmptyValue(root.substitutions), 'substitutions'],
    [hasNonEmptyValue(root.secrets), 'secrets'],
    [hasNonEmptyValue(root.availableSecrets), 'available_secrets'],
    [hasNonEmptyValue(root.buildTriggerId), 'build_trigger'],
  ] as const).filter(([failed]) => failed).map(([, label]) => label)
  if (failures.length > 0) {
    throw new Error(
      `track_all_l4_original_cloud_build_invalid:${failures.join(',')}`,
    )
  }
}

function verifySupplyChainBuild(input: {
  value: unknown
  admission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
  terminal: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
}): void {
  const root = record(input.value)
  const expected =
    compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(
      input.admission,
    )
  const results = record(root.results)
  const artifacts = record(record(root.artifacts).objects)
  const expectedArtifacts = record(record(expected.artifacts).objects)
  const failures = ([
    [root.id !== input.terminal.cloudBuildId, 'id'],
    [!isExpectedBuildResource(root.name, input.terminal.cloudBuildId), 'name'],
    [![PROJECT_ID, PROJECT_NUMBER].includes(
      String(root.projectId) as never,
    ), 'project'],
    [root.status !== 'SUCCESS', 'status'],
    [hasUnexpectedWarnings(root.warnings), 'warnings'],
    [!sameSupplyChainSteps(root.steps, expected.steps), 'steps'],
    [!sameArtifactObjects(artifacts, expectedArtifacts), 'artifacts'],
    [root.serviceAccount !== expected.serviceAccount, 'service_account'],
    [root.timeout !== expected.timeout, 'timeout'],
    [root.queueTtl !== expected.queueTtl, 'queue_ttl'],
    [!sameCloudBuildOptions(root.options, expected.options), 'options'],
    [!sameJson(root.tags, expected.tags), 'tags'],
    [results.artifactManifest !== input.terminal.evidenceArtifactManifestUri,
      'artifact_manifest'],
    [Number(results.numArtifacts) !== ARTIFACT_PATHS.length,
      'artifact_count'],
    [hasNonEmptyValue(root.source), 'source'],
    [hasNonEmptyValue(root.images), 'images'],
    [hasNonEmptyValue(root.substitutions), 'substitutions'],
    [hasNonEmptyValue(root.secrets), 'secrets'],
    [hasNonEmptyValue(root.availableSecrets), 'available_secrets'],
    [hasNonEmptyValue(root.buildTriggerId), 'build_trigger'],
  ] as const).filter(([failed]) => failed).map(([, label]) => label)
  if (failures.length > 0) {
    throw new Error(
      `track_all_l4_supply_chain_cloud_build_invalid:${failures.join(',')}`,
    )
  }
}

function sameCloudBuildSteps(observed: unknown, expected: unknown): boolean {
  const observedSteps = z.array(z.object({
    name: z.unknown(),
    entrypoint: z.unknown(),
    args: z.unknown(),
  }).passthrough()).max(100).safeParse(observed)
  const expectedSteps = z.array(z.object({
    name: z.unknown(),
    entrypoint: z.unknown(),
    args: z.unknown(),
  }).strict()).max(100).safeParse(expected)
  return observedSteps.success && expectedSteps.success
    && sameJson(observedSteps.data.map((step) => ({
      name: step.name,
      entrypoint: step.entrypoint,
      args: step.args,
    })), expectedSteps.data)
}

function sameStorageSource(
  observed: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean {
  return observed.bucket === expected.bucket
    && observed.object === expected.object
    && String(observed.generation) === String(expected.generation)
    && observed.sourceFetcher === 'GCS_FETCHER'
    && Object.keys(observed).sort().join(',') ===
      'bucket,generation,object,sourceFetcher'
}

function sameSupplyChainSteps(observed: unknown, expected: unknown): boolean {
  const observedSteps = z.array(z.object({
    id: z.unknown(),
    name: z.unknown(),
    entrypoint: z.unknown().optional(),
    waitFor: z.unknown().optional(),
    args: z.unknown(),
  }).passthrough()).max(100).safeParse(observed)
  const expectedSteps = z.array(z.object({
    id: z.unknown(),
    name: z.unknown(),
    entrypoint: z.unknown().optional(),
    waitFor: z.unknown().optional(),
    args: z.unknown(),
  }).strict()).max(100).safeParse(expected)
  return observedSteps.success && expectedSteps.success
    && sameJson(observedSteps.data.map((step) => ({
      id: step.id,
      name: step.name,
      ...(step.entrypoint === undefined ? {} : {
        entrypoint: step.entrypoint,
      }),
      ...(Array.isArray(step.waitFor) && step.waitFor.length > 0
        ? { waitFor: step.waitFor }
        : {}),
      args: step.args,
    })), expectedSteps.data)
}

function sameArtifactObjects(
  observed: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean {
  const timing = z.object({
    startTime: timestamp,
    endTime: timestamp,
  }).strict().safeParse(observed.timing)
  return observed.location === expected.location
    && sameJson(observed.paths, expected.paths)
    && Object.keys(observed).sort().join(',') === 'location,paths,timing'
    && timing.success
    && Date.parse(timing.data.endTime) >= Date.parse(timing.data.startTime)
}

function sameCloudBuildOptions(observed: unknown, expected: unknown): boolean {
  const observedValue = z.object({
    machineType: z.unknown(),
    diskSizeGb: z.unknown(),
    logging: z.unknown(),
    requestedVerifyOption: z.unknown(),
    sourceProvenanceHash: z.unknown().optional(),
  }).passthrough().safeParse(observed)
  const expectedValue = z.object({
    machineType: z.unknown(),
    diskSizeGb: z.unknown(),
    logging: z.unknown(),
    requestedVerifyOption: z.unknown(),
    sourceProvenanceHash: z.unknown().optional(),
  }).strict().safeParse(expected)
  if (!observedValue.success || !expectedValue.success) return false
  return sameJson({
    machineType: observedValue.data.machineType,
    diskSizeGb: String(observedValue.data.diskSizeGb),
    logging: observedValue.data.logging,
    requestedVerifyOption: observedValue.data.requestedVerifyOption,
    ...(observedValue.data.sourceProvenanceHash === undefined
      ? {}
      : { sourceProvenanceHash: observedValue.data.sourceProvenanceHash }),
  }, {
    ...expectedValue.data,
    diskSizeGb: String(expectedValue.data.diskSizeGb),
  })
}

function isExpectedBuildResource(value: unknown, buildId: string): boolean {
  return value === `projects/${PROJECT_ID}/locations/${REGION}/builds/${buildId}`
    || value ===
      `projects/${PROJECT_NUMBER}/locations/${REGION}/builds/${buildId}`
}

function containsSha256(value: unknown, sha256: string): boolean {
  return JSON.stringify(value).toLowerCase().includes(sha256.toLowerCase())
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

function hasUnexpectedWarnings(value: unknown): boolean {
  return value !== undefined && (!Array.isArray(value) || value.length > 0)
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('track_all_l4_supply_chain_record_invalid')
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
  ) throw new Error('track_all_l4_supply_chain_read_port_invalid')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}
