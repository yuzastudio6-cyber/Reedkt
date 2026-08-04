import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageBuildAuthority,
  type CanonicalSam31CloudImageBuildAuthority,
} from './canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  type CanonicalSam31CloudImageBuildSubmission,
  type CanonicalSam31CloudImageBuildTerminalObservation,
} from '../services/canonical-sam3_1-cloud-image-build-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_CLOUD_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION =
  'canonical-sam3_1-cloud-image-supply-chain-release-v1' as const

const PROJECT_ID = 'reeditpro' as const
const REGION = 'us-central1' as const
const IMAGE_REPOSITORY =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const
const IMAGE_PACKAGE =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu' as const
const BUILD_COLLECTION =
  'projects/reeditpro/locations/us-central1/builds' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const versionOneRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()

const observedEvidenceSchema = z.object({
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  imageMetadata: z.object({
    projectId: z.literal(PROJECT_ID),
    region: z.literal(REGION),
    repository: z.literal(IMAGE_REPOSITORY),
    packageResource: z.literal(IMAGE_PACKAGE),
    immutableImageUri: z.string().regex(
      /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
    ),
    immutableImageDigest: prefixedSha256,
    containerManifestMediaType: z.enum([
      'application/vnd.oci.image.manifest.v1+json',
      'application/vnd.docker.distribution.manifest.v2+json',
    ]),
    exactDigestReread: z.boolean(),
    mutableTagUsedAsAuthority: z.literal(false),
  }).strict(),
  sbom: z.object({
    format: z.literal('spdx_2_3_json'),
    artifactRef: evidenceRefSchema,
    contentSha256: sha256,
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
    buildAuthorityRef: versionOneRefSchema,
    buildSubmissionRef: versionOneRefSchema,
    buildRequestHash: sha256,
    sourceBucket: z.literal(
      'reeditpro-production-reeditpro-image-build-inputs',
    ),
    sourceObject: z.string().startsWith(
      'private/image-build-inputs/sam3_1/',
    ).endsWith('.tar.gz'),
    sourceGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    sourceSha256: sha256,
    exactAttestationRereadAndVerified: z.boolean(),
  }).strict(),
}).strict()

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CLOUD_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION,
  ),
  source: z.literal('canonical_sam3_1_cloud_image_supply_chain_owner'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'image_supply_chain_qualified']),
  releaseId: safeId,
  releaseVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  buildAuthorityRef: versionOneRefSchema,
  buildSubmissionRef: versionOneRefSchema,
  buildTerminalObservationRef: versionOneRefSchema,
  cloudBuildId: z.string().uuid(),
  cloudBuildResource: z.string(),
  sourceAndDependencyClosureRef: versionOneRefSchema,
  immutableImageRef: versionOneRefSchema,
  immutableImageDigest: prefixedSha256,
  immutableImageUri: z.string(),
  artifactRegistryPackage: z.literal(IMAGE_PACKAGE),
  sbom: observedEvidenceSchema.shape.sbom,
  vulnerabilityScan: observedEvidenceSchema.shape.vulnerabilityScan,
  signature: observedEvidenceSchema.shape.signature,
  provenance: observedEvidenceSchema.shape.provenance,
  qualifiedAt: timestamp,
  authority: z.object({
    exactImmutableImageReread: z.boolean(),
    exactSbomReread: z.boolean(),
    vulnerabilityScanPassed: z.boolean(),
    imageSignatureVerified: z.boolean(),
    buildProvenanceVerified: z.boolean(),
    imageSupplyChainQualified: z.boolean(),
    a100RuntimeQualified: z.literal(false),
    l4RuntimeQualified: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    gpuJobDispatched: z.literal(false),
    checkpointIncludedInImage: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass === 'canonical_private_reread'
  const scan = value.vulnerabilityScan
  const exact = canonical
    ? value.status === 'image_supply_chain_qualified'
      && value.authority.exactImmutableImageReread
      && value.authority.exactSbomReread
      && value.authority.vulnerabilityScanPassed
      && value.authority.imageSignatureVerified
      && value.authority.buildProvenanceVerified
      && value.authority.imageSupplyChainQualified
      && scan.criticalCount === 0
      && scan.highCount === 0
      && scan.unknownSeverityCount === 0
      && scan.exactOccurrencesReread
      && scan.securityReviewApprovedForPrivateGpuQualification
      && value.sbom.completeOsAndApplicationPackageInventory
      && value.sbom.exactArtifactReread
      && value.signature.exactSignatureVerificationPassed
      && value.provenance.exactAttestationRereadAndVerified
    : value.status === 'contract_only'
      && !value.authority.exactImmutableImageReread
      && !value.authority.exactSbomReread
      && !value.authority.vulnerabilityScanPassed
      && !value.authority.imageSignatureVerified
      && !value.authority.buildProvenanceVerified
      && !value.authority.imageSupplyChainQualified
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 image supply-chain release lost verified evidence.',
  })
})

export const canonicalSam31CloudImageSupplyChainReleaseSchema =
  releaseWithoutHashSchema.extend({ releaseHash: sha256 }).strict()
export type CanonicalSam31CloudImageSupplyChainRelease = z.infer<
  typeof canonicalSam31CloudImageSupplyChainReleaseSchema
>

export interface CanonicalSam31CloudImageSupplyChainEvidenceReadPort {
  rereadExact(input: {
    readonly buildAuthorityRef: z.infer<typeof versionOneRefSchema>
    readonly buildSubmissionRef: z.infer<typeof versionOneRefSchema>
    readonly buildTerminalObservationRef: z.infer<typeof versionOneRefSchema>
    readonly immutableImageUri: string
    readonly immutableImageDigest: string
    readonly cloudBuildId: string
  }): Promise<unknown | null>
}

export async function prepareCanonicalSam31CloudImageSupplyChainRelease(input: {
  readonly releaseId: string
  readonly authority: CanonicalSam31CloudImageBuildAuthority
  readonly submission: CanonicalSam31CloudImageBuildSubmission
  readonly terminalObservation: CanonicalSam31CloudImageBuildTerminalObservation
  readonly evidenceReadPort: CanonicalSam31CloudImageSupplyChainEvidenceReadPort
  readonly qualifiedAt: string
}): Promise<CanonicalSam31CloudImageSupplyChainRelease> {
  const authority = assertCanonicalSam31CloudImageBuildAuthority(
    input.authority,
  )
  const submission = assertCanonicalSam31CloudImageBuildSubmission(
    input.submission,
  )
  const terminal = assertCanonicalSam31CloudImageBuildTerminalObservation(
    input.terminalObservation,
  )
  if (
    submission.disposition !== 'submitted'
    || terminal.disposition !==
      'image_built_pending_scan_signature_and_gpu_qualification'
    || !terminal.immutableImageDigest
    || !terminal.immutableImageUri
    || terminal.cloudBuildId !== submission.cloudBuildId
    || !sameRef(submission.authorityRef, authorityRef(authority))
  ) throw new Error('SAM 3.1 supply chain has no admitted image build.')

  const buildSubmissionRef = {
    id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
    version: 1 as const,
    contentHash: `sha256:${submission.submissionHash}` as const,
  }
  const terminalRef = {
    id: `sam31-cloud-build-terminal-${terminal.observationHash.slice(0, 24)}`,
    version: 1 as const,
    contentHash: `sha256:${terminal.observationHash}` as const,
  }
  if (
    !sameRef(terminal.authorityRef, authorityRef(authority))
    || !sameRef(terminal.submissionRef, buildSubmissionRef)
  ) throw new Error('SAM 3.1 supply chain crossed build lineage.')

  const evidence = observedEvidenceSchema.parse(
    await input.evidenceReadPort.rereadExact({
      buildAuthorityRef: authorityRef(authority),
      buildSubmissionRef,
      buildTerminalObservationRef: terminalRef,
      immutableImageUri: terminal.immutableImageUri,
      immutableImageDigest: terminal.immutableImageDigest,
      cloudBuildId: terminal.cloudBuildId,
    }),
  )
  assertEvidenceLineage({ authority, submission, terminal, evidence })
  const canonical = authority.evidenceClass === 'canonical_private_reread'
    && evidence.evidenceClass === 'canonical_private_reread'
  const qualified = canonical
    && evidence.imageMetadata.exactDigestReread
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
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_SUPPLY_CHAIN_RELEASE_VERSION,
    source: 'canonical_sam3_1_cloud_image_supply_chain_owner',
    evidenceClass: canonical
      ? 'canonical_private_reread'
      : 'synthetic_contract_fixture',
    status: qualified ? 'image_supply_chain_qualified' : 'contract_only',
    releaseId: input.releaseId,
    releaseVersion: 1,
    operationId: authority.operationId,
    buildAuthorityRef: authorityRef(authority),
    buildSubmissionRef,
    buildTerminalObservationRef: terminalRef,
    cloudBuildId: terminal.cloudBuildId,
    cloudBuildResource: `${BUILD_COLLECTION}/${terminal.cloudBuildId}`,
    sourceAndDependencyClosureRef: authority.capsuleManifestRef,
    immutableImageRef: {
      id: `sam31-image-${terminal.immutableImageDigest.slice(-24)}`,
      version: 1,
      contentHash: terminal.immutableImageDigest,
    },
    immutableImageDigest: terminal.immutableImageDigest,
    immutableImageUri: terminal.immutableImageUri,
    artifactRegistryPackage: terminal.artifactRegistryPackage,
    sbom: evidence.sbom,
    vulnerabilityScan: evidence.vulnerabilityScan,
    signature: evidence.signature,
    provenance: evidence.provenance,
    qualifiedAt: input.qualifiedAt,
    authority: {
      exactImmutableImageReread: qualified,
      exactSbomReread: qualified,
      vulnerabilityScanPassed: qualified,
      imageSignatureVerified: qualified,
      buildProvenanceVerified: qualified,
      imageSupplyChainQualified: qualified,
      a100RuntimeQualified: false,
      l4RuntimeQualified: false,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      checkpointIncludedInImage: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31CloudImageSupplyChainReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31CloudImageSupplyChainRelease(
  value: unknown,
): CanonicalSam31CloudImageSupplyChainRelease {
  assertClosedPlainData(value, 'sam3_1_cloud_image_supply_chain_release')
  const parsed = canonicalSam31CloudImageSupplyChainReleaseSchema.parse(value)
  const { releaseHash, ...payload } = parsed
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 image supply-chain release hash is invalid.')
  }
  return parsed
}

function assertEvidenceLineage(input: {
  authority: CanonicalSam31CloudImageBuildAuthority
  submission: CanonicalSam31CloudImageBuildSubmission
  terminal: CanonicalSam31CloudImageBuildTerminalObservation
  evidence: z.infer<typeof observedEvidenceSchema>
}): void {
  const { authority, submission, terminal, evidence } = input
  const digest = terminal.immutableImageDigest
  if (
    !digest
    || evidence.evidenceClass !== authority.evidenceClass
    || evidence.imageMetadata.immutableImageDigest !== digest
    || evidence.imageMetadata.immutableImageUri !== terminal.immutableImageUri
    || evidence.imageMetadata.packageResource !==
      terminal.artifactRegistryPackage
    || evidence.sbom.imageDigest !== digest
    || evidence.sbom.artifactRef.contentHash !==
      `sha256:${evidence.sbom.contentSha256}`
    || evidence.vulnerabilityScan.imageDigest !== digest
    || evidence.signature.imageDigest !== digest
    || evidence.provenance.imageDigest !== digest
    || evidence.provenance.cloudBuildId !== terminal.cloudBuildId
    || evidence.provenance.cloudBuildResource !== terminal.cloudBuildResource
    || !sameRef(evidence.provenance.buildAuthorityRef, authorityRef(authority))
    || !sameRef(evidence.provenance.buildSubmissionRef, {
      id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
      version: 1,
      contentHash: `sha256:${submission.submissionHash}`,
    })
    || evidence.provenance.buildRequestHash !== submission.buildRequestHash
    || evidence.provenance.sourceBucket !==
      authority.capsuleCoordinate.bucketName
    || evidence.provenance.sourceObject !==
      authority.capsuleCoordinate.objectName
    || evidence.provenance.sourceGeneration !==
      authority.capsuleCoordinate.generation
    || evidence.provenance.sourceSha256 !== authority.capsuleCoordinate.sha256
  ) throw new Error('SAM 3.1 supply-chain evidence crossed image or build.')
}

function authorityRef(authority: CanonicalSam31CloudImageBuildAuthority) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function sameRef(
  left: z.infer<typeof versionOneRefSchema>,
  right: z.infer<typeof versionOneRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
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
