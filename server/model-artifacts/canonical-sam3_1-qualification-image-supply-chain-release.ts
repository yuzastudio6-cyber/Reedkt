import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
} from './canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  type CanonicalSam31QualificationImageBuildSubmission,
  type CanonicalSam31QualificationImageBuildTerminal,
} from '../services/canonical-sam3_1-qualification-image-build-phase'
import {
  assertCanonicalSam31QualificationImageSupplyChainAdmission,
  assertCanonicalSam31QualificationImageSupplyChainObservation,
  assertCanonicalSam31QualificationImageSupplyChainSubmission,
  qualificationImageSupplyChainAdmissionReference,
  qualificationImageSupplyChainObservationReference,
  qualificationImageSupplyChainSubmissionReference,
  type CanonicalSam31QualificationImageSupplyChainBuildAdmission,
  type CanonicalSam31QualificationImageSupplyChainBuildObservation,
  type CanonicalSam31QualificationImageSupplyChainBuildSubmission,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import { assertPlainSerializedData } from
  '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION =
  'canonical-sam3_1-qualification-image-supply-chain-release-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const artifactRegistryVersionSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/us-central1\/repositories\/reeditpro-workers\/packages\/reeditpro-sam31-qualification\/versions\/sha256:[a-f0-9]{64}$/u,
)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const observedEvidenceSchema = z.object({
  evidenceClass: z.literal('canonical_private_reread'),
  imageMetadata: z.object({
    projectId: z.literal(PROJECT_ID),
    region: z.literal(REGION),
    repository: z.literal(IMAGE_REPOSITORY),
    packageResource: z.literal(IMAGE_PACKAGE),
    immutableImageUri: z.string().regex(
      /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-qualification@sha256:[a-f0-9]{64}$/u,
    ),
    immutableImageDigest: prefixedSha256,
    containerManifestMediaType: z.enum([
      'application/vnd.oci.image.manifest.v1+json',
      'application/vnd.docker.distribution.manifest.v2+json',
    ]),
    exactDigestReread: z.boolean(),
    mutableTagUsedAsAuthority: z.literal(false),
  }).strict(),
  supplyChainArtifacts: z.object({
    admissionRef: evidenceRefSchema,
    submissionRef: evidenceRefSchema,
    observationRef: evidenceRefSchema,
    cloudBuildId: z.string().uuid(),
    cloudBuildResource: z.string(),
    exactCloudBuildReread: z.boolean(),
    exactArtifactManifestReread: z.boolean(),
    exactThreeArtifactSetReread: z.boolean(),
  }).strict(),
  sbom: z.object({
    format: z.literal('spdx_2_3_json'),
    artifactRef: evidenceRefSchema,
    contentSha256: rawSha256,
    imageDigest: prefixedSha256,
    generatorImageRef: evidenceRefSchema,
    completeOsAndApplicationPackageInventory: z.boolean(),
    exactArtifactReread: z.boolean(),
  }).strict(),
  vulnerabilityScan: z.object({
    scanner: z.literal('google_artifact_analysis'),
    scanRef: evidenceRefSchema,
    imageDigest: prefixedSha256,
    scanCompletedAt: timestamp,
    vulnerabilityDatabaseUpdatedAt: timestamp,
    criticalCount: nonnegativeInteger,
    highCount: nonnegativeInteger,
    mediumCount: nonnegativeInteger,
    lowCount: nonnegativeInteger,
    unknownSeverityCount: nonnegativeInteger,
    exactOccurrencesReread: z.boolean(),
    securityReviewRef: evidenceRefSchema,
    securityReviewApprovedForPrivateGpuQualification: z.boolean(),
  }).strict(),
  signature: z.object({
    scheme: z.literal('cosign_kms_sha256'),
    signatureRef: evidenceRefSchema,
    imageDigest: prefixedSha256,
    kmsKeyVersionResource: z.string().regex(
      /^projects\/reeditpro\/locations\/us-central1\/keyRings\/weeditpro-image-signing\/cryptoKeys\/sam31-image-signing\/cryptoKeyVersions\/[1-9][0-9]*$/u,
    ),
    signerServiceAccount: z.literal(
      'reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com',
    ),
    exactSignatureVerificationPassed: z.boolean(),
  }).strict(),
  provenance: z.object({
    predicateType: z.literal('https://slsa.dev/provenance/v1'),
    attestationRef: evidenceRefSchema,
    imageDigest: prefixedSha256,
    cloudBuildId: z.string().uuid(),
    cloudBuildResource: z.string(),
    buildAuthorityRef: evidenceRefSchema,
    buildSubmissionRef: evidenceRefSchema,
    buildRequestHash: rawSha256,
    sourceBucket: z.literal(
      'reeditpro-production-reeditpro-image-build-inputs',
    ),
    sourceObject: z.string().startsWith(
      'private/image-build-inputs/sam3_1/qualification/',
    ).endsWith('.tar.gz'),
    sourceGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    sourceSha256: rawSha256,
    exactAttestationRereadAndVerified: z.boolean(),
  }).strict(),
}).strict()
export type CanonicalSam31QualificationImageObservedSupplyChainEvidence =
  z.infer<typeof observedEvidenceSchema>

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_supply_chain_owner'),
  buildPurpose: z.literal('source_checkpoint_qualification'),
  imageRole: z.literal('qualification_image'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('image_supply_chain_qualified'),
  releaseId: safeId,
  releaseVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  buildAuthorityRef: evidenceRefSchema,
  buildSubmissionRef: evidenceRefSchema,
  buildTerminalObservationRef: evidenceRefSchema,
  supplyChainBuildAdmissionRef: evidenceRefSchema,
  supplyChainBuildSubmissionRef: evidenceRefSchema,
  supplyChainBuildObservationRef: evidenceRefSchema,
  originalCloudBuildId: z.string().uuid(),
  originalCloudBuildResource: z.string(),
  supplyChainCloudBuildId: z.string().uuid(),
  supplyChainCloudBuildResource: z.string(),
  sourceAndDependencyClosureRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  immutableImageUri: z.string(),
  artifactRegistryPackage: artifactRegistryVersionSchema,
  sbom: observedEvidenceSchema.shape.sbom,
  vulnerabilityScan: observedEvidenceSchema.shape.vulnerabilityScan,
  signature: observedEvidenceSchema.shape.signature,
  provenance: observedEvidenceSchema.shape.provenance,
  qualifiedAt: timestamp,
  authority: z.object({
    exactImmutableImageReread: z.boolean(),
    exactSupplyChainBuildReread: z.boolean(),
    exactThreeArtifactSetReread: z.boolean(),
    exactSbomReread: z.boolean(),
    vulnerabilityScanPassed: z.boolean(),
    imageSignatureVerified: z.boolean(),
    buildProvenanceVerified: z.boolean(),
    qualificationImageSupplyChainQualified: z.boolean(),
    sourceCheckpointQualificationImageAdmissible: z.boolean(),
    sourceCheckpointQualificationGranted: z.literal(false),
    gpuQualificationJobDispatched: z.literal(false),
    a100RuntimeQualified: z.literal(false),
    l4RuntimeQualified: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    checkpointIncludedInImage: z.literal(false),
    qualificationReceiptIncludedInImage: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  const scan = value.vulnerabilityScan
  const qualified = value.authority.exactImmutableImageReread
    && value.authority.exactSupplyChainBuildReread
    && value.authority.exactThreeArtifactSetReread
    && value.authority.exactSbomReread
    && value.authority.vulnerabilityScanPassed
    && value.authority.imageSignatureVerified
    && value.authority.buildProvenanceVerified
    && value.authority.qualificationImageSupplyChainQualified
    && value.authority.sourceCheckpointQualificationImageAdmissible
    && scan.criticalCount === 0
    && scan.highCount === 0
    && scan.unknownSeverityCount === 0
    && scan.exactOccurrencesReread
    && scan.securityReviewApprovedForPrivateGpuQualification
    && value.sbom.completeOsAndApplicationPackageInventory
    && value.sbom.exactArtifactReread
    && value.signature.exactSignatureVerificationPassed
    && value.provenance.exactAttestationRereadAndVerified
    && value.artifactRegistryPackage === artifactRegistryVersion(
      value.immutableImageDigest,
    )
    && Date.parse(value.qualifiedAt) >= Date.parse(scan.scanCompletedAt)
  if (!qualified) context.addIssue({
    code: 'custom',
    message: 'Qualification image supply-chain release lost evidence.',
  })
})

export const canonicalSam31QualificationImageSupplyChainReleaseSchema =
  releaseWithoutHashSchema.extend({ releaseHash: rawSha256 }).strict()
export type CanonicalSam31QualificationImageSupplyChainRelease = z.infer<
  typeof canonicalSam31QualificationImageSupplyChainReleaseSchema
>

export interface CanonicalSam31QualificationImageSupplyChainEvidenceReadPort {
  rereadExactQualificationImageSupplyChain(input: {
    readonly buildAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly buildSubmissionRef: z.infer<typeof evidenceRefSchema>
    readonly buildTerminalObservationRef: z.infer<typeof evidenceRefSchema>
    readonly supplyChainBuildAdmissionRef: z.infer<typeof evidenceRefSchema>
    readonly supplyChainBuildSubmissionRef: z.infer<typeof evidenceRefSchema>
    readonly supplyChainBuildObservationRef: z.infer<typeof evidenceRefSchema>
    readonly immutableImageUri: string
    readonly immutableImageDigest: string
    readonly originalCloudBuildId: string
    readonly supplyChainCloudBuildId: string
  }): Promise<unknown | null>
}

export async function prepareCanonicalSam31QualificationImageSupplyChainRelease(
  input: {
    readonly releaseId: string
    readonly authority: CanonicalSam31QualificationImageBuildAuthority
    readonly imageBuildSubmission:
      CanonicalSam31QualificationImageBuildSubmission
    readonly imageBuildTerminal:
      CanonicalSam31QualificationImageBuildTerminal
    readonly supplyChainBuildAdmission:
      CanonicalSam31QualificationImageSupplyChainBuildAdmission
    readonly supplyChainBuildSubmission:
      CanonicalSam31QualificationImageSupplyChainBuildSubmission
    readonly supplyChainBuildObservation:
      CanonicalSam31QualificationImageSupplyChainBuildObservation
    readonly evidenceReadPort:
      CanonicalSam31QualificationImageSupplyChainEvidenceReadPort
    readonly qualifiedAt: string
  },
): Promise<CanonicalSam31QualificationImageSupplyChainRelease> {
  const authority = assertCanonicalSam31QualificationImageBuildAuthority(
    input.authority,
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
  const refs = assertLineage({
    authority,
    imageSubmission,
    imageTerminal,
    supplyAdmission,
    supplySubmission,
    supplyObservation,
  })
  const evidence = observedEvidenceSchema.parse(
    await input.evidenceReadPort.rereadExactQualificationImageSupplyChain({
      ...refs,
      immutableImageUri: imageTerminal.immutableImageUri ?? '',
      immutableImageDigest: imageTerminal.immutableImageDigest ?? '',
      originalCloudBuildId: imageTerminal.cloudBuildId,
      supplyChainCloudBuildId: supplyObservation.cloudBuildId,
    }),
  )
  assertEvidenceLineage({
    authority,
    imageSubmission,
    imageTerminal,
    supplyAdmission,
    supplySubmission,
    supplyObservation,
    evidence,
    refs,
  })
  const qualified = evidence.imageMetadata.exactDigestReread
    && evidence.supplyChainArtifacts.exactCloudBuildReread
    && evidence.supplyChainArtifacts.exactArtifactManifestReread
    && evidence.supplyChainArtifacts.exactThreeArtifactSetReread
    && evidence.sbom.completeOsAndApplicationPackageInventory
    && evidence.sbom.exactArtifactReread
    && evidence.vulnerabilityScan.criticalCount === 0
    && evidence.vulnerabilityScan.highCount === 0
    && evidence.vulnerabilityScan.unknownSeverityCount === 0
    && evidence.vulnerabilityScan.exactOccurrencesReread
    && evidence.vulnerabilityScan
      .securityReviewApprovedForPrivateGpuQualification
    && evidence.signature.exactSignatureVerificationPassed
    && evidence.provenance.exactAttestationRereadAndVerified
  const payload = releaseWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION,
    source: 'canonical_sam3_1_cloud_image_supply_chain_owner',
    buildPurpose: 'source_checkpoint_qualification',
    imageRole: 'qualification_image',
    evidenceClass: 'canonical_private_reread',
    status: 'image_supply_chain_qualified',
    releaseId: input.releaseId,
    releaseVersion: 1,
    operationId: authority.operationId,
    ...refs,
    originalCloudBuildId: imageTerminal.cloudBuildId,
    originalCloudBuildResource: imageTerminal.cloudBuildResource,
    supplyChainCloudBuildId: supplyObservation.cloudBuildId,
    supplyChainCloudBuildResource: supplyObservation.cloudBuildResource,
    sourceAndDependencyClosureRef: authority.capsuleManifestRef,
    immutableImageRef: {
      id: `sam31-qualification-image-${imageTerminal.immutableImageDigest?.slice(-20)}`,
      version: 1,
      contentHash: imageTerminal.immutableImageDigest,
    },
    immutableImageDigest: imageTerminal.immutableImageDigest,
    immutableImageUri: imageTerminal.immutableImageUri,
    artifactRegistryPackage: imageTerminal.artifactRegistryPackage,
    sbom: evidence.sbom,
    vulnerabilityScan: evidence.vulnerabilityScan,
    signature: evidence.signature,
    provenance: evidence.provenance,
    qualifiedAt: input.qualifiedAt,
    authority: {
      exactImmutableImageReread: qualified,
      exactSupplyChainBuildReread: qualified,
      exactThreeArtifactSetReread: qualified,
      exactSbomReread: qualified,
      vulnerabilityScanPassed: qualified,
      imageSignatureVerified: qualified,
      buildProvenanceVerified: qualified,
      qualificationImageSupplyChainQualified: qualified,
      sourceCheckpointQualificationImageAdmissible: qualified,
      sourceCheckpointQualificationGranted: false,
      gpuQualificationJobDispatched: false,
      a100RuntimeQualified: false,
      l4RuntimeQualified: false,
      runtimeReleaseGranted: false,
      checkpointIncludedInImage: false,
      qualificationReceiptIncludedInImage: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31QualificationImageSupplyChainReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31QualificationImageSupplyChainRelease(
  value: unknown,
): CanonicalSam31QualificationImageSupplyChainRelease {
  assertPlainSerializedData(value, 'sam31_qualification_image_supply_release')
  const parsed = canonicalSam31QualificationImageSupplyChainReleaseSchema
    .parse(value)
  const { releaseHash, ...payload } = parsed
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw new Error('Qualification image supply-chain release hash changed.')
  }
  return parsed
}

function assertLineage(input: {
  authority: CanonicalSam31QualificationImageBuildAuthority
  imageSubmission: CanonicalSam31QualificationImageBuildSubmission
  imageTerminal: CanonicalSam31QualificationImageBuildTerminal
  supplyAdmission: CanonicalSam31QualificationImageSupplyChainBuildAdmission
  supplySubmission: CanonicalSam31QualificationImageSupplyChainBuildSubmission
  supplyObservation:
    CanonicalSam31QualificationImageSupplyChainBuildObservation
}) {
  const buildAuthorityRef = {
    id: input.authority.authorityId,
    version: 1 as const,
    contentHash: `sha256:${input.authority.authorityHash}` as const,
  }
  const buildSubmissionRef = {
    id: `sam31-qualification-image-submission-${input.imageSubmission.submissionHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${input.imageSubmission.submissionHash}` as const,
  }
  const buildTerminalObservationRef = {
    id: `sam31-qualification-image-terminal-${input.imageTerminal.observationHash.slice(0, 20)}`,
    version: 1 as const,
    contentHash: `sha256:${input.imageTerminal.observationHash}` as const,
  }
  const supplyChainBuildAdmissionRef =
    qualificationImageSupplyChainAdmissionReference(input.supplyAdmission)
  const supplyChainBuildSubmissionRef =
    qualificationImageSupplyChainSubmissionReference(input.supplySubmission)
  const supplyChainBuildObservationRef =
    qualificationImageSupplyChainObservationReference(input.supplyObservation)
  if (
    input.authority.evidenceClass !== 'canonical_private_reread'
    || input.authority.status !== 'authorized_for_private_cloud_build'
    || input.imageSubmission.disposition !== 'submitted'
    || !input.imageSubmission.buildRequestHash
    || input.imageTerminal.disposition !==
      'qualification_image_built_pending_supply_chain_release'
    || !input.imageTerminal.immutableImageDigest
    || !input.imageTerminal.immutableImageUri
    || input.supplySubmission.disposition !== 'submitted'
    || input.supplyObservation.disposition !==
      'supply_chain_artifacts_ready_pending_exact_reread'
    || !sameRef(input.imageSubmission.authorityRef, buildAuthorityRef)
    || !sameRef(input.imageTerminal.authorityRef, buildAuthorityRef)
    || !sameRef(input.imageTerminal.submissionRef, buildSubmissionRef)
    || !sameRef(input.supplyAdmission.buildAuthorityRef, buildAuthorityRef)
    || !sameRef(
      input.supplyAdmission.imageBuildSubmissionRef,
      buildSubmissionRef,
    )
    || !sameRef(
      input.supplyAdmission.imageBuildTerminalObservationRef,
      buildTerminalObservationRef,
    )
    || !sameRef(
      input.supplySubmission.admissionRef,
      supplyChainBuildAdmissionRef,
    )
    || !sameRef(
      input.supplyObservation.admissionRef,
      supplyChainBuildAdmissionRef,
    )
    || !sameRef(
      input.supplyObservation.submissionRef,
      supplyChainBuildSubmissionRef,
    )
    || input.supplyAdmission.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
    || input.supplyAdmission.artifactRegistryPackage !==
      input.imageTerminal.artifactRegistryPackage
    || input.supplyObservation.immutableImageDigest !==
      input.imageTerminal.immutableImageDigest
  ) throw new Error('Qualification image supply-chain lineage crossed.')
  return {
    buildAuthorityRef,
    buildSubmissionRef,
    buildTerminalObservationRef,
    supplyChainBuildAdmissionRef,
    supplyChainBuildSubmissionRef,
    supplyChainBuildObservationRef,
  }
}

function artifactRegistryVersion(digest: string): string {
  return `${IMAGE_PACKAGE}/versions/${prefixedSha256.parse(digest)}`
}

function assertEvidenceLineage(input: {
  authority: CanonicalSam31QualificationImageBuildAuthority
  imageSubmission: CanonicalSam31QualificationImageBuildSubmission
  imageTerminal: CanonicalSam31QualificationImageBuildTerminal
  supplyAdmission: CanonicalSam31QualificationImageSupplyChainBuildAdmission
  supplySubmission: CanonicalSam31QualificationImageSupplyChainBuildSubmission
  supplyObservation:
    CanonicalSam31QualificationImageSupplyChainBuildObservation
  evidence: CanonicalSam31QualificationImageObservedSupplyChainEvidence
  refs: ReturnType<typeof assertLineage>
}): void {
  const digest = input.imageTerminal.immutableImageDigest
  const evidence = input.evidence
  if (
    !digest
    || evidence.evidenceClass !== input.authority.evidenceClass
    || evidence.imageMetadata.immutableImageDigest !== digest
    || evidence.imageMetadata.immutableImageUri !==
      input.imageTerminal.immutableImageUri
    || evidence.imageMetadata.packageResource !== IMAGE_PACKAGE
    || !sameRef(
      evidence.supplyChainArtifacts.admissionRef,
      input.refs.supplyChainBuildAdmissionRef,
    )
    || !sameRef(
      evidence.supplyChainArtifacts.submissionRef,
      input.refs.supplyChainBuildSubmissionRef,
    )
    || !sameRef(
      evidence.supplyChainArtifacts.observationRef,
      input.refs.supplyChainBuildObservationRef,
    )
    || evidence.supplyChainArtifacts.cloudBuildId !==
      input.supplyObservation.cloudBuildId
    || evidence.supplyChainArtifacts.cloudBuildResource !==
      input.supplyObservation.cloudBuildResource
    || evidence.sbom.imageDigest !== digest
    || evidence.sbom.artifactRef.contentHash !==
      `sha256:${evidence.sbom.contentSha256}`
    || evidence.vulnerabilityScan.imageDigest !== digest
    || evidence.signature.imageDigest !== digest
    || evidence.signature.kmsKeyVersionResource !==
      input.supplyAdmission.kmsKeyVersionResource
    || evidence.provenance.imageDigest !== digest
    || evidence.provenance.cloudBuildId !== input.imageTerminal.cloudBuildId
    || evidence.provenance.cloudBuildResource !==
      input.imageTerminal.cloudBuildResource
    || !sameRef(
      evidence.provenance.buildAuthorityRef,
      input.refs.buildAuthorityRef,
    )
    || !sameRef(
      evidence.provenance.buildSubmissionRef,
      input.refs.buildSubmissionRef,
    )
    || evidence.provenance.buildRequestHash !==
      input.imageSubmission.buildRequestHash
    || evidence.provenance.sourceBucket !==
      input.authority.capsuleCoordinate.bucketName
    || evidence.provenance.sourceObject !==
      input.authority.capsuleCoordinate.objectName
    || evidence.provenance.sourceGeneration !==
      input.authority.capsuleCoordinate.generation
    || evidence.provenance.sourceSha256 !==
      input.authority.capsuleCoordinate.sha256
  ) throw new Error('Qualification image supply-chain evidence crossed.')
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
