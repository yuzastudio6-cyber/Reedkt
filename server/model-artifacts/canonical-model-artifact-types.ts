import type { Readable } from 'node:stream'

import type { ReviewStatus } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ModelWeightCommercialUseStatus } from '../model-weights'

export const CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION =
  'canonical-model-artifact-descriptor-v1' as const
export const CANONICAL_MODEL_ARTIFACT_LOCATOR_VERSION =
  'canonical-model-artifact-locator-v1' as const
export const CANONICAL_MODEL_ARTIFACT_MANIFEST_VERSION =
  'canonical-model-artifact-manifest-v1' as const
export const CANONICAL_MODEL_ARTIFACT_REPOSITORY_ROOT_AUTHORITY_VERSION =
  'canonical-model-artifact-repository-root-authority-v1' as const
export const CANONICAL_MODEL_ARTIFACT_REPOSITORY_VERSION =
  'canonical-model-artifact-repository-v1' as const
export const CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION =
  'canonical-model-artifact-source-reader-v1' as const
export const CANONICAL_MODEL_ARTIFACT_VERIFICATION_VERSION =
  'canonical-model-artifact-verification-v1' as const
export const CANONICAL_MODEL_ARTIFACT_INGEST_RECEIPT_VERSION =
  'canonical-model-artifact-ingest-receipt-v1' as const
export const CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_LEASE_VERSION =
  'canonical-model-artifact-read-only-mount-lease-v1' as const
export const CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION =
  'canonical-model-artifact-read-only-mount-consumer-v1' as const
export const CANONICAL_MODEL_ARTIFACT_MOUNT_CONSUMPTION_VERSION =
  'canonical-model-artifact-mount-consumption-v1' as const

export type CanonicalModelArtifactFormat =
  | 'onnx'
  | 'safetensors'
  | 'pytorch_checkpoint'
  | 'torchscript'
  | 'gguf'
  | 'tokenizer'
  | 'configuration'
  | 'reviewed_binary'

export type CanonicalModelArtifactExecutionClass =
  | 'cpu_permitted'
  | 'gpu_required'

export type CanonicalModelArtifactExecutionTarget =
  | 'private_controlled_cpu'
  | 'google_cloud_run_gpu'

export type CanonicalModelArtifactAccelerator =
  | 'none'
  | 'cuda'

export type CanonicalModelArtifactRepositoryAdmission =
  | 'controlled_internal_test'
  | 'reviewed_repository_candidate'

export interface CanonicalModelArtifactLicensePolicy {
  readonly modelArtifactLicense: string
  readonly commercialUseStatus: ModelWeightCommercialUseStatus
  readonly reviewStatus: ReviewStatus
  readonly redistributionAllowed: boolean
  readonly requiresAttribution: boolean
  readonly paidProductionUseApproved: boolean
  readonly sourceLicenseDocumentSha256: string
  readonly modelCardDocumentSha256: string | null
}

export interface CanonicalModelArtifactExecutionPolicy {
  readonly executionClass: CanonicalModelArtifactExecutionClass
  readonly requiredExecutionTarget: CanonicalModelArtifactExecutionTarget
  readonly accelerator: CanonicalModelArtifactAccelerator
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
}

export interface CanonicalModelArtifactDescriptor {
  readonly descriptorVersion:
    typeof CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION
  readonly artifactId: string
  readonly revision: string
  readonly artifactFormat: CanonicalModelArtifactFormat
  readonly artifactRole: string
  readonly modelFamily: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly consumerScopes: readonly string[]
  readonly repositoryAdmission: CanonicalModelArtifactRepositoryAdmission
  readonly sourceObservationDigestSha256: string
  readonly reviewEvidenceDigestSha256: string
  readonly securityReviewDigestSha256: string
  readonly licensePolicy: CanonicalModelArtifactLicensePolicy
  readonly executionPolicy: CanonicalModelArtifactExecutionPolicy
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
}

export interface CanonicalModelArtifactAuthorityBoundary {
  readonly repositoryIntegrityAuthority: true
  readonly serverOwnedBytesOnly: true
  readonly contentAddressedStorage: true
  readonly fullChecksumOnEveryRead: true
  readonly readOnlyLeaseAuthority: true
  readonly runtimeDownloadAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly modelInferenceAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface CanonicalModelArtifactManifest {
  readonly manifestVersion:
    typeof CANONICAL_MODEL_ARTIFACT_MANIFEST_VERSION
  readonly storageClass:
    'private_single_host_content_addressed_model_artifact'
  readonly artifactRecordId: string
  readonly descriptorDigestSha256: string
  readonly ingestedAt: string
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly authorityBoundary: CanonicalModelArtifactAuthorityBoundary
  readonly manifestDigestSha256: string
}

export interface CanonicalModelArtifactLocator {
  readonly locatorVersion:
    typeof CANONICAL_MODEL_ARTIFACT_LOCATOR_VERSION
  readonly artifactRecordId: string
  readonly artifactId: string
  readonly revision: string
  readonly contentSha256: string
  readonly manifestDigestSha256: string
}

export interface CanonicalModelArtifactRepositoryRootAuthority {
  readonly authorityVersion:
    typeof CANONICAL_MODEL_ARTIFACT_REPOSITORY_ROOT_AUTHORITY_VERSION
  readonly authorityClass:
    'process_bound_server_injected_model_artifact_repository_root'
  readonly storageClass:
    'symlink_safe_private_single_host_content_addressed'
  readonly rootFingerprintSha256: string
  readonly callerPathAccepted: false
  readonly browserShareable: false
  readonly remoteStorageAuthority: false
  readonly distributedLockAuthority: false
  readonly hostileSameUidProtectionProven: false
  readonly productionReady: false
}

export interface CanonicalModelArtifactSourceReaderPort {
  readonly readerVersion:
    typeof CANONICAL_MODEL_ARTIFACT_SOURCE_READER_VERSION
  readonly sourceAuthority:
    'process_bound_server_owned_model_artifact_bytes'
  readonly descriptor: CanonicalModelArtifactDescriptor
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly productionReady: false
  openServerOwnedByteStream(): Promise<Readable>
}

export interface CanonicalModelArtifactRepositoryPort {
  readonly repositoryVersion:
    typeof CANONICAL_MODEL_ARTIFACT_REPOSITORY_VERSION
  readonly repositoryClass:
    'process_bound_private_model_artifact_repository'
  readonly storageClass:
    'private_single_host_content_addressed_model_artifact'
  readonly browserShareable: false
  readonly distributedDurabilityProven: false
  readonly productionReady: false
}

export interface CanonicalModelArtifactVerificationReceipt {
  readonly verificationVersion:
    typeof CANONICAL_MODEL_ARTIFACT_VERIFICATION_VERSION
  readonly verificationClass:
    'full_no_follow_sha256_model_artifact_verification'
  readonly locator: CanonicalModelArtifactLocator
  readonly manifest: CanonicalModelArtifactManifest
  readonly verifiedAt: string
  readonly verifiedByteLength: number
  readonly verifiedContentSha256: string
  readonly objectIdentityDigestSha256: string
  readonly hostPathIncluded: false
  readonly bytesIncluded: false
  readonly productionReady: false
  readonly verificationDigestSha256: string
}

export interface CanonicalModelArtifactIngestReceipt {
  readonly receiptVersion:
    typeof CANONICAL_MODEL_ARTIFACT_INGEST_RECEIPT_VERSION
  readonly disposition:
    | 'created'
    | 'reused_verified_content_object'
    | 'idempotent_replay'
  readonly locator: CanonicalModelArtifactLocator
  readonly descriptorDigestSha256: string
  readonly verifiedContentSha256: string
  readonly verifiedByteLength: number
  readonly sourceStreamOpened: boolean
  readonly contentObjectCreated: boolean
  readonly manifestCreated: boolean
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly remoteMutationMade: false
  readonly providerCallMade: false
  readonly customerCreditsMutated: false
  readonly productionReady: false
  readonly receiptDigestSha256: string
}

export interface CanonicalModelArtifactReadOnlyMountLease {
  readonly leaseVersion:
    typeof CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_LEASE_VERSION
  readonly leaseClass:
    'process_bound_single_use_read_only_model_artifact_lease'
  readonly leaseIdDigestSha256: string
  readonly leaseDigestSha256: string
  readonly locator: CanonicalModelArtifactLocator
  readonly descriptorDigestSha256: string
  readonly consumerScope: string
  readonly executionTarget: CanonicalModelArtifactExecutionTarget
  readonly issuedAt: string
  readonly expiresAt: string
  readonly singleUse: true
  readonly readOnly: true
  readonly hostPathIncluded: false
  readonly mountAliasIncluded: false
  readonly credentialsIncluded: false
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly modelInferenceAuthority: false
  readonly productionReady: false
}

export interface CanonicalModelArtifactReadOnlyMountInput {
  readonly sourceAbsolutePath: string
  readonly serverDerivedMountAlias: string
  readonly artifactRecordId: string
  readonly artifactId: string
  readonly revision: string
  readonly artifactFormat: CanonicalModelArtifactFormat
  readonly expectedByteLength: number
  readonly expectedContentSha256: string
  readonly consumerScope: string
  readonly executionTarget: CanonicalModelArtifactExecutionTarget
  readonly accelerator: CanonicalModelArtifactAccelerator
  readonly readOnly: true
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
}

export interface CanonicalModelArtifactReadOnlyMountConsumerPort {
  readonly consumerVersion:
    typeof CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION
  readonly consumerClass:
    'process_bound_private_read_only_model_artifact_consumer'
  readonly consumerScope: string
  readonly executionTarget: CanonicalModelArtifactExecutionTarget
  readonly callerPathAccepted: false
  readonly callerBytesAccepted: false
  readonly callerUrlAccepted: false
  readonly modelExecutionAuthorized: false
  readonly productionReady: false
  consumeReadOnlyModelArtifact(
    input: CanonicalModelArtifactReadOnlyMountInput,
  ): Promise<void>
}

export interface CanonicalModelArtifactMountConsumptionReceipt {
  readonly consumptionVersion:
    typeof CANONICAL_MODEL_ARTIFACT_MOUNT_CONSUMPTION_VERSION
  readonly consumptionClass:
    'verified_single_use_read_only_model_artifact_consumption'
  readonly leaseDigestSha256: string
  readonly locator: CanonicalModelArtifactLocator
  readonly consumerScope: string
  readonly executionTarget: CanonicalModelArtifactExecutionTarget
  readonly consumedAt: string
  readonly objectVerifiedBeforeConsumer: true
  readonly objectVerifiedAfterConsumer: true
  readonly readOnlySourcePresented: true
  readonly hostPathIncluded: false
  readonly mountAliasIncluded: false
  readonly modelInferenceExecuted: false
  readonly providerCallMade: false
  readonly remoteMutationMade: false
  readonly customerCreditsMutated: false
  readonly productionReady: false
  readonly consumptionDigestSha256: string
}
