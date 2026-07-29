import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiContainerSbomAuthority,
  LivingFrameComfyUiContainerSbomEvidence,
  LivingFrameComfyUiContainerSbomEvidenceDraft,
  LivingFrameComfyUiContainerSbomIssue,
} from '../../src/types/living-frame-comfyui-container-sbom-evidence'
import {
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS,
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE,
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION,
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
} from '../../src/types/living-frame-comfyui-container-sbom-evidence'
import {
  LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256,
} from './living-frame-comfyui-dependency-lock-manifest'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SAFE_PACKAGE_NAME = /^[a-z0-9][a-z0-9+._-]{0,127}$/u
const SAFE_VERSION = /^[a-zA-Z0-9][a-zA-Z0-9+.:~_-]{0,255}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXPECTED_DEBIAN_PACKAGE_COUNT = 590
const EXPECTED_PYTHON_DISTRIBUTION_COUNT = 168
const EXPECTED_DIRECT_VCS_CODE = 'sam-2'
const EXPECTED_DIRECT_VCS_REVISION =
  '2b90b9f5ceec907a1c18123530e92e794ad901a4'
const SPDX_CREATED_AT = '2026-07-28T18:45:28Z'

export interface LivingFrameComfyUiObservedDebianPackage {
  readonly name: string
  readonly version: string
}

export interface LivingFrameComfyUiObservedPythonDistribution {
  readonly name: string
  readonly version: string
  readonly sourceKind:
    | 'locked_local_wheel'
    | 'inherited_registry_distribution'
    | 'inherited_direct_vcs_distribution'
  readonly artifactSha256: string | null
  readonly sourceRevision: string | null
}

export interface LivingFrameComfyUiContainerInventoryObservation {
  readonly observationClass:
    'process_bound_local_comfyui_container_inventory_observation_v1'
  readonly candidateImageDigestSha256: string
  readonly repositoryDigestSha256: string
  readonly operatingSystem: 'linux'
  readonly architecture: 'amd64'
  readonly imageDefaultUser: ''
  readonly labels: {
    readonly controlledBaseImageDigestSha256: string
    readonly wheelManifestDigestSha256: string
    readonly comfyUiRevision: string
    readonly genericIpAdapterRevision: string
    readonly controlNetAuxRevision: string
  }
  readonly debianPackages:
    readonly LivingFrameComfyUiObservedDebianPackage[]
  readonly pythonDistributions:
    readonly LivingFrameComfyUiObservedPythonDistribution[]
  readonly explicitRuntimeUid: 65_532
  readonly explicitRuntimeGid: 65_532
  readonly rootFilesystemReadOnlyObserved: true
  readonly networkDisabledObserved: true
  readonly localArchitectureEmulationUsed: true
  readonly rawPathUrlCredentialSecretOrPackageBytesIncluded: false
}

export interface LivingFrameComfyUiContainerInventoryReader {
  readonly readerClass:
    'process_bound_local_comfyui_container_inventory_reader_v1'
  readonly readObservation: () =>
    Promise<LivingFrameComfyUiContainerInventoryObservation>
}

export interface LivingFrameComfyUiSpdxDocumentLease {
  readonly leaseClass:
    'process_bound_single_use_comfyui_spdx_document_lease_v1'
}

export interface LivingFrameComfyUiContainerSbomEvidenceResult {
  readonly evidence: LivingFrameComfyUiContainerSbomEvidence
  readonly spdxDocumentLease:
    LivingFrameComfyUiSpdxDocumentLease
}

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiContainerSbomAuthority =
  deepFreeze({
    controlledImageInventoryAuthority: true,
    boundedSpdxProjectionAuthority: true,
    canonicalImageAuthority: false,
    canonicalArtifactRepositoryAuthority: false,
    vulnerabilityScanAuthority: false,
    signatureAuthority: false,
    provenanceAttestationAuthority: false,
    licenseApprovalAuthority: false,
    modelArtifactAuthority: false,
    gpuExecutionAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const leaseBytes = new WeakMap<object, Uint8Array>()
const consumedLeases = new WeakSet<object>()

export class LivingFrameComfyUiContainerSbomEvidenceError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiContainerSbomIssue[]

  constructor(
    issues: readonly LivingFrameComfyUiContainerSbomIssue[],
  ) {
    super(
      'Living Frame ComfyUI container SBOM evidence failed.',
    )
    this.name =
      'LivingFrameComfyUiContainerSbomEvidenceError'
    this.issues = issues
  }
}

export function createLivingFrameComfyUiContainerInventoryReader(
  readObservation:
    LivingFrameComfyUiContainerInventoryReader[
      'readObservation'
    ],
): LivingFrameComfyUiContainerInventoryReader {
  if (typeof readObservation !== 'function') {
    throw issue('reader_invalid', '$.reader')
  }
  const reader:
    LivingFrameComfyUiContainerInventoryReader =
    Object.freeze({
      readerClass:
        'process_bound_local_comfyui_container_inventory_reader_v1',
      readObservation,
    })
  readers.add(reader)
  return reader
}

export async function createLivingFrameComfyUiContainerSbomEvidence(
  input: {
    readonly evidenceId: string
    readonly inventoryReader:
      LivingFrameComfyUiContainerInventoryReader
  },
): Promise<LivingFrameComfyUiContainerSbomEvidenceResult> {
  if (
    !input
    || !SAFE_ID.test(input.evidenceId)
    || !readers.has(input.inventoryReader)
    || input.inventoryReader.readerClass !==
      'process_bound_local_comfyui_container_inventory_reader_v1'
    || consumedReaders.has(input.inventoryReader)
  ) {
    throw issue(
      consumedReaders.has(input?.inventoryReader)
        ? 'reader_reused'
        : 'input_invalid',
      '$',
    )
  }
  consumedReaders.add(input.inventoryReader)
  const first = await readObservation(input.inventoryReader)
  const second = await readObservation(input.inventoryReader)
  validateObservation(first)
  validateObservation(second)
  if (canonicalJson(first) !== canonicalJson(second)) {
    throw issue('observation_unstable', '$.inventoryReader')
  }
  const spdxDocument = createSpdxDocument(first)
  const spdxBytes = new TextEncoder().encode(
    JSON.stringify(spdxDocument),
  )
  validateSpdxDocument(spdxDocument, spdxBytes)
  const directVcs = first.pythonDistributions.filter(
    (distribution) =>
      distribution.sourceKind ===
        'inherited_direct_vcs_distribution',
  )
  const lockedCount = first.pythonDistributions.filter(
    (distribution) =>
      distribution.sourceKind ===
        'locked_local_wheel',
  ).length
  const inheritedCount =
    first.pythonDistributions.length - lockedCount
  const totalPackageCount =
    first.debianPackages.length
    + first.pythonDistributions.length
    + LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.length
  const namespace =
    `urn:reeditpro:living-frame:comfyui-sbom:${
      first.candidateImageDigestSha256
    }`
  const draft:
    LivingFrameComfyUiContainerSbomEvidenceDraft = {
      contractVersion:
        LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION,
      evidenceClass:
        LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS,
      evidenceId: input.evidenceId,
      evidenceState:
        LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE,
      imageObservation: {
        candidateImageDigestSha256:
          first.candidateImageDigestSha256,
        repositoryDigestMatchedCandidateDigest: true,
        operatingSystem: 'linux',
        architecture: 'amd64',
        localImageOnly: true,
        canonicalImageRepositoryAdmissionPresent: false,
        imageSignatureVerified: false,
        provenanceAttestationVerified: false,
        vulnerabilityScanCompleted: false,
        imageDefaultUser: 'root_or_unspecified',
        explicitUnprivilegedRuntimeOverrideObserved: true,
        explicitRuntimeUid: 65_532,
        explicitRuntimeGid: 65_532,
        rootFilesystemReadOnlyObserved: true,
        networkDisabledObserved: true,
        localArchitectureEmulationUsed: true,
      },
      sourceBinding: {
        controlledBaseImageDigestSha256:
          first.labels.controlledBaseImageDigestSha256,
        wheelManifestDigestSha256:
          first.labels.wheelManifestDigestSha256,
        comfyUiRevision:
          first.labels.comfyUiRevision,
        genericIpAdapterRevision:
          first.labels.genericIpAdapterRevision,
        controlNetAuxRevision:
          first.labels.controlNetAuxRevision,
        exactImageLabelsMatched: true,
      },
      packageInventory: {
        format: 'SPDX-2.3',
        dataLicense: 'CC0-1.0',
        generator:
          'ReeditPro bounded container package inventory v1',
        documentNamespaceUrn: namespace,
        documentByteLength: spdxBytes.byteLength,
        documentSha256: sha256(spdxBytes),
        debianPackageCount:
          first.debianPackages.length,
        pythonDistributionCount:
          first.pythonDistributions.length,
        lockedWheelDistributionCount: 35,
        inheritedPythonDistributionCount:
          inheritedCount,
        sourceArchivePackageCount: 3,
        totalPackageCount,
        expectedLockedWheelSetMatched: true,
        expectedSourceRevisionSetMatched: true,
        processBoundObservationReadTwice: true,
        stableInventoryObservedTwice: true,
        packageManagerInventoryComplete: true,
        filesystemComponentInventoryClaimed: false,
        outOfScopeDirectVcsDistributionCodes: [
          'sam-2',
        ],
        outOfScopeDirectVcsDistributionCount:
          directVcs.length as 1,
        rawPathUrlCredentialSecretOrPackageBytesIncluded:
          false,
      },
      releasePolicy: {
        packageInventoryAvailableForReview: true,
        independentSbomValidationPassed: false,
        vulnerabilityDispositionPassed: false,
        signatureAndProvenancePassed: false,
        defaultNonRootPassed: false,
        inheritedDistributionScopeReviewPassed: false,
        outOfScopeVcsDistributionDispositionPassed: false,
        releasePolicyPassed: false,
      },
      openGateCodes: [
        ...LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
      ],
      authorityBoundary: AUTHORITY_BOUNDARY,
      spdxDocumentLeaseIssued: true,
      spdxArtifactPersisted: false,
      selectedSceneCreated: false,
      providerTransportCalled: false,
      canonicalOperationDispatched: false,
      productionReady: false,
    }
  if (!hasExpectedEvidenceSemantics(draft)) {
    throw issue(
      'evidence_semantics_invalid',
      '$.evidence',
    )
  }
  const evidence = deepFreeze({
    ...draft,
    evidenceDigestSha256: sha256(canonicalJson(draft)),
  })
  const lease:
    LivingFrameComfyUiSpdxDocumentLease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_comfyui_spdx_document_lease_v1',
    })
  leaseBytes.set(lease, spdxBytes)
  return deepFreeze({
    evidence,
    spdxDocumentLease: lease,
  })
}

export function consumeLivingFrameComfyUiSpdxDocumentLease(
  lease: LivingFrameComfyUiSpdxDocumentLease,
): Uint8Array {
  const bytes = leaseBytes.get(lease)
  if (
    !bytes
    || lease.leaseClass !==
      'process_bound_single_use_comfyui_spdx_document_lease_v1'
    || consumedLeases.has(lease)
  ) throw issue('lease_reused', '$.spdxDocumentLease')
  consumedLeases.add(lease)
  leaseBytes.delete(lease)
  return Uint8Array.from(bytes)
}

export function verifyLivingFrameComfyUiContainerSbomEvidence(
  value: unknown,
): value is LivingFrameComfyUiContainerSbomEvidence {
  if (
    !isRecord(value)
    || value.contractVersion !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION
    || value.evidenceClass !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS
    || value.evidenceState !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE
    || typeof value.evidenceDigestSha256 !== 'string'
    || !SHA256.test(value.evidenceDigestSha256)
    || value.productionReady !== false
    || value.spdxArtifactPersisted !== false
  ) return false
  const {
    evidenceDigestSha256,
    ...draft
  } = value
  return (
    sha256(canonicalJson(draft)) ===
      evidenceDigestSha256
    && hasExpectedEvidenceSemantics(draft)
    && canonicalJson(draft.authorityBoundary) ===
      canonicalJson(AUTHORITY_BOUNDARY)
    && canonicalJson(draft.openGateCodes) ===
      canonicalJson(
        LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
      )
  )
}

function hasExpectedEvidenceSemantics(
  value: unknown,
): value is LivingFrameComfyUiContainerSbomEvidenceDraft {
  if (!isRecord(value)) return false
  const image = value.imageObservation
  const source = value.sourceBinding
  const inventory = value.packageInventory
  const release = value.releasePolicy
  if (
    value.contractVersion !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_VERSION
    || value.evidenceClass !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_CLASS
    || value.evidenceState !==
      LIVING_FRAME_COMFYUI_CONTAINER_SBOM_EVIDENCE_STATE
    || typeof value.evidenceId !== 'string'
    || !SAFE_ID.test(value.evidenceId)
    || !isRecord(image)
    || !isRecord(source)
    || !isRecord(inventory)
    || !isRecord(release)
  ) return false
  const revisions = Object.fromEntries(
    LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.map(
      (archive) => [
        archive.sourceCode,
        archive.repositoryRevision,
      ],
    ),
  )
  const expectedNamespace =
    `urn:reeditpro:living-frame:comfyui-sbom:${
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    }`
  return (
    image.candidateImageDigestSha256 ===
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    && image.repositoryDigestMatchedCandidateDigest === true
    && image.operatingSystem === 'linux'
    && image.architecture === 'amd64'
    && image.localImageOnly === true
    && image.canonicalImageRepositoryAdmissionPresent === false
    && image.imageSignatureVerified === false
    && image.provenanceAttestationVerified === false
    && image.vulnerabilityScanCompleted === false
    && image.imageDefaultUser === 'root_or_unspecified'
    && image.explicitUnprivilegedRuntimeOverrideObserved === true
    && image.explicitRuntimeUid === 65_532
    && image.explicitRuntimeGid === 65_532
    && image.rootFilesystemReadOnlyObserved === true
    && image.networkDisabledObserved === true
    && image.localArchitectureEmulationUsed === true
    && source.controlledBaseImageDigestSha256 ===
      LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256
    && source.wheelManifestDigestSha256 ===
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256
    && source.comfyUiRevision === revisions.comfyui_host
    && source.genericIpAdapterRevision ===
      revisions.generic_ipadapter_extension
    && source.controlNetAuxRevision ===
      revisions.controlnet_aux_extension
    && source.exactImageLabelsMatched === true
    && inventory.format === 'SPDX-2.3'
    && inventory.dataLicense === 'CC0-1.0'
    && inventory.generator ===
      'ReeditPro bounded container package inventory v1'
    && inventory.documentNamespaceUrn === expectedNamespace
    && typeof inventory.documentByteLength === 'number'
    && Number.isSafeInteger(inventory.documentByteLength)
    && inventory.documentByteLength >= 100_000
    && inventory.documentByteLength <= 1_000_000
    && typeof inventory.documentSha256 === 'string'
    && SHA256.test(inventory.documentSha256)
    && inventory.debianPackageCount ===
      EXPECTED_DEBIAN_PACKAGE_COUNT
    && inventory.pythonDistributionCount ===
      EXPECTED_PYTHON_DISTRIBUTION_COUNT
    && inventory.lockedWheelDistributionCount ===
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.length
    && inventory.inheritedPythonDistributionCount ===
      EXPECTED_PYTHON_DISTRIBUTION_COUNT
        - LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.length
    && inventory.sourceArchivePackageCount ===
      LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.length
    && inventory.totalPackageCount ===
      EXPECTED_DEBIAN_PACKAGE_COUNT
        + EXPECTED_PYTHON_DISTRIBUTION_COUNT
        + LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.length
    && inventory.expectedLockedWheelSetMatched === true
    && inventory.expectedSourceRevisionSetMatched === true
    && inventory.processBoundObservationReadTwice === true
    && inventory.stableInventoryObservedTwice === true
    && inventory.packageManagerInventoryComplete === true
    && inventory.filesystemComponentInventoryClaimed === false
    && canonicalJson(
      inventory.outOfScopeDirectVcsDistributionCodes,
    ) === canonicalJson([EXPECTED_DIRECT_VCS_CODE])
    && inventory.outOfScopeDirectVcsDistributionCount === 1
    && inventory.rawPathUrlCredentialSecretOrPackageBytesIncluded ===
      false
    && release.packageInventoryAvailableForReview === true
    && release.independentSbomValidationPassed === false
    && release.vulnerabilityDispositionPassed === false
    && release.signatureAndProvenancePassed === false
    && release.defaultNonRootPassed === false
    && release.inheritedDistributionScopeReviewPassed === false
    && release.outOfScopeVcsDistributionDispositionPassed === false
    && release.releasePolicyPassed === false
    && canonicalJson(value.openGateCodes) ===
      canonicalJson(
        LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
      )
    && canonicalJson(value.authorityBoundary) ===
      canonicalJson(AUTHORITY_BOUNDARY)
    && value.spdxDocumentLeaseIssued === true
    && value.spdxArtifactPersisted === false
    && value.selectedSceneCreated === false
    && value.providerTransportCalled === false
    && value.canonicalOperationDispatched === false
    && value.productionReady === false
  )
}

async function readObservation(
  reader: LivingFrameComfyUiContainerInventoryReader,
): Promise<LivingFrameComfyUiContainerInventoryObservation> {
  try {
    return await reader.readObservation()
  } catch {
    throw issue('reader_failed', '$.inventoryReader')
  }
}

function validateObservation(
  value: LivingFrameComfyUiContainerInventoryObservation,
): void {
  if (
    !isRecord(value)
    || value.observationClass !==
      'process_bound_local_comfyui_container_inventory_observation_v1'
    || value.candidateImageDigestSha256 !==
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    || value.repositoryDigestSha256 !==
      LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
    || value.operatingSystem !== 'linux'
    || value.architecture !== 'amd64'
    || value.imageDefaultUser !== ''
    || value.explicitRuntimeUid !== 65_532
    || value.explicitRuntimeGid !== 65_532
    || value.rootFilesystemReadOnlyObserved !== true
    || value.networkDisabledObserved !== true
    || value.localArchitectureEmulationUsed !== true
    || value.rawPathUrlCredentialSecretOrPackageBytesIncluded !==
      false
  ) throw issue(
    'image_identity_mismatch',
    '$.inventoryReader.image',
  )
  validateLabels(value.labels)
  validateDebianPackages(value.debianPackages)
  validatePythonDistributions(value.pythonDistributions)
}

function validateLabels(
  labels:
    LivingFrameComfyUiContainerInventoryObservation[
      'labels'
    ],
): void {
  const revisions = Object.fromEntries(
    LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.map(
      (archive) => [
        archive.sourceCode,
        archive.repositoryRevision,
      ],
    ),
  )
  if (
    !isRecord(labels)
    || labels.controlledBaseImageDigestSha256 !==
      LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256
    || labels.wheelManifestDigestSha256 !==
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256
    || labels.comfyUiRevision !==
      revisions.comfyui_host
    || labels.genericIpAdapterRevision !==
      revisions.generic_ipadapter_extension
    || labels.controlNetAuxRevision !==
      revisions.controlnet_aux_extension
  ) throw issue(
    'image_label_mismatch',
    '$.inventoryReader.labels',
  )
}

function validateDebianPackages(
  packages:
    readonly LivingFrameComfyUiObservedDebianPackage[],
): void {
  if (
    !Array.isArray(packages)
    || packages.length !==
      EXPECTED_DEBIAN_PACKAGE_COUNT
  ) throw issue(
    'package_inventory_invalid',
    '$.inventoryReader.debianPackages',
  )
  let previous = ''
  for (const [index, candidate] of packages.entries()) {
    if (
      typeof candidate.name !== 'string'
      || typeof candidate.version !== 'string'
      || !SAFE_PACKAGE_NAME.test(candidate.name)
      || !SAFE_VERSION.test(candidate.version)
    ) throw issue(
      'unsafe_inventory_value',
      `$.inventoryReader.debianPackages[${index}]`,
    )
    const identity =
      `${candidate.name}\u0000${candidate.version}`
    if (identity <= previous) {
      throw issue(
        'package_inventory_invalid',
        `$.inventoryReader.debianPackages[${index}]`,
      )
    }
    previous = identity
  }
}

function validatePythonDistributions(
  distributions:
    readonly LivingFrameComfyUiObservedPythonDistribution[],
): void {
  if (
    !Array.isArray(distributions)
    || distributions.length !==
      EXPECTED_PYTHON_DISTRIBUTION_COUNT
  ) throw issue(
    'package_inventory_invalid',
    '$.inventoryReader.pythonDistributions',
  )
  let previous = ''
  for (const [index, candidate] of
    distributions.entries()) {
    if (
      typeof candidate.name !== 'string'
      || typeof candidate.version !== 'string'
      || typeof candidate.sourceKind !== 'string'
      || !SAFE_PACKAGE_NAME.test(candidate.name)
      || !SAFE_VERSION.test(candidate.version)
      || ![
        'locked_local_wheel',
        'inherited_registry_distribution',
        'inherited_direct_vcs_distribution',
      ].includes(candidate.sourceKind)
      || (
        candidate.artifactSha256 !== null
        && (
          typeof candidate.artifactSha256 !== 'string'
          || !SHA256.test(candidate.artifactSha256)
        )
      )
      || (
        candidate.sourceRevision !== null
        && (
          typeof candidate.sourceRevision !== 'string'
          || !/^[a-f0-9]{40}$/u.test(
            candidate.sourceRevision,
          )
        )
      )
    ) throw issue(
      'unsafe_inventory_value',
      `$.inventoryReader.pythonDistributions[${index}]`,
    )
    const identity =
      `${candidate.name}\u0000${candidate.version}`
    if (identity <= previous) {
      throw issue(
        'package_inventory_invalid',
        `$.inventoryReader.pythonDistributions[${index}]`,
      )
    }
    previous = identity
  }
  validateLockedWheels(distributions)
  const directVcs = distributions.filter(
    (candidate) =>
      candidate.sourceKind ===
        'inherited_direct_vcs_distribution',
  )
  if (
    directVcs.length !== 1
    || directVcs[0]?.name !== EXPECTED_DIRECT_VCS_CODE
    || directVcs[0]?.sourceRevision !==
      EXPECTED_DIRECT_VCS_REVISION
    || directVcs[0]?.artifactSha256 !== null
  ) throw issue(
    'source_revision_set_mismatch',
    '$.inventoryReader.pythonDistributions',
  )
}

function validateLockedWheels(
  distributions:
    readonly LivingFrameComfyUiObservedPythonDistribution[],
): void {
  const observed = new Map(
    distributions
      .filter((candidate) =>
        candidate.sourceKind ===
          'locked_local_wheel')
      .map((candidate) => [
        normalizeDistributionName(candidate.name),
        candidate,
      ]),
  )
  if (
    observed.size !==
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.length
  ) throw issue(
    'locked_wheel_set_mismatch',
    '$.inventoryReader.pythonDistributions',
  )
  for (const artifact of
    LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS) {
    const candidate = observed.get(
      normalizeDistributionName(
        artifact.distributionName,
      ),
    )
    if (
      !candidate
      || candidate.version !== artifact.version
      || candidate.artifactSha256 !== artifact.sha256
      || candidate.sourceRevision !== null
    ) throw issue(
      'locked_wheel_set_mismatch',
      '$.inventoryReader.pythonDistributions',
    )
  }
}

function createSpdxDocument(
  observation:
    LivingFrameComfyUiContainerInventoryObservation,
): Record<string, unknown> {
  const packages: Record<string, unknown>[] = []
  for (const [index, candidate] of
    observation.debianPackages.entries()) {
    packages.push(spdxPackage({
      id: `SPDXRef-debian-${String(index).padStart(4, '0')}`,
      name: candidate.name,
      version: candidate.version,
      checksum: null,
      comment:
        'Observed through dpkg-query in the exact local image.',
    }))
  }
  for (const [index, candidate] of
    observation.pythonDistributions.entries()) {
    packages.push(spdxPackage({
      id: `SPDXRef-python-${String(index).padStart(4, '0')}`,
      name: candidate.name,
      version: candidate.sourceRevision
        ?? candidate.version,
      checksum: candidate.artifactSha256,
      comment:
        `Observed Python distribution source class: ${
          candidate.sourceKind
        }.`,
    }))
  }
  for (const [index, archive] of
    LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.entries()) {
    packages.push(spdxPackage({
      id: `SPDXRef-source-${String(index).padStart(2, '0')}`,
      name: archive.sourceCode,
      version: archive.repositoryRevision,
      checksum: archive.archiveSha256,
      comment:
        'Bound from the exact source archive copied into the image.',
    }))
  }
  const digest =
    observation.candidateImageDigestSha256
  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name:
      `reeditpro-living-frame-comfyui-${digest.slice(0, 12)}`,
    documentNamespace:
      `urn:reeditpro:living-frame:comfyui-sbom:${digest}`,
    creationInfo: {
      created: SPDX_CREATED_AT,
      creators: [
        'Tool: ReeditPro bounded container package inventory v1',
      ],
    },
    documentDescribes: packages.map(
      (candidate) => candidate.SPDXID,
    ),
    packages,
  }
}

function spdxPackage(
  input: {
    readonly id: string
    readonly name: string
    readonly version: string
    readonly checksum: string | null
    readonly comment: string
  },
): Record<string, unknown> {
  return {
    SPDXID: input.id,
    name: input.name,
    versionInfo: input.version,
    downloadLocation: 'NOASSERTION',
    filesAnalyzed: false,
    licenseConcluded: 'NOASSERTION',
    licenseDeclared: 'NOASSERTION',
    copyrightText: 'NOASSERTION',
    comment: input.comment,
    ...(input.checksum
      ? {
          checksums: [{
            algorithm: 'SHA256',
            checksumValue: input.checksum,
          }],
        }
      : {}),
  }
}

function validateSpdxDocument(
  document: Record<string, unknown>,
  bytes: Uint8Array,
): void {
  const packages = document.packages
  const documentDescribes = document.documentDescribes
  if (
    document.spdxVersion !== 'SPDX-2.3'
    || document.dataLicense !== 'CC0-1.0'
    || document.SPDXID !== 'SPDXRef-DOCUMENT'
    || !Array.isArray(packages)
    || packages.length !== 761
    || !Array.isArray(documentDescribes)
    || documentDescribes.length !== packages.length
    || bytes.byteLength < 100_000
    || bytes.byteLength > 1_000_000
    || Buffer.from(bytes).includes(
      Buffer.from('file://'),
    )
    || Buffer.from(bytes).includes(
      Buffer.from('https://'),
    )
    || Buffer.from(bytes).includes(
      Buffer.from('http://'),
    )
    || Buffer.from(bytes).includes(
      Buffer.from('/opt/'),
    )
  ) throw issue(
    'spdx_projection_invalid',
    '$.spdxDocument',
  )
}

function normalizeDistributionName(
  value: string,
): string {
  return value.trim().toLowerCase()
    .replace(/[_.]+/gu, '-')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [
        key,
        sortValue(value[key]),
      ]),
    )
  }
  return value
}

function sha256(
  value: string | Uint8Array,
): string {
  return createHash('sha256').update(value).digest('hex')
}

function issue(
  code: LivingFrameComfyUiContainerSbomIssue['code'],
  path: string,
): LivingFrameComfyUiContainerSbomEvidenceError {
  return new LivingFrameComfyUiContainerSbomEvidenceError([
    { code, path },
  ])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
