import type {
  CanonicalModelArtifactFormat,
  CanonicalModelArtifactLocator,
} from './canonical-model-artifact-types'

export const CANONICAL_MODEL_ARTIFACT_GPU_BUNDLE_VERSION =
  'canonical-model-artifact-gpu-bundle-v1' as const
export const CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_HANDOFF_LEASE_VERSION =
  'canonical-model-artifact-cloud-run-gpu-handoff-lease-v1' as const
export const CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION =
  'canonical-model-artifact-cloud-run-gpu-consumer-v1' as const
export const CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMPTION_VERSION =
  'canonical-model-artifact-cloud-run-gpu-consumption-v1' as const

export const MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS = 32
export const MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES =
  64 * 1_024 * 1_024 * 1_024

export interface CanonicalModelArtifactGpuBundleRequirement {
  readonly canonicalOrder: number
  readonly slotId: string
  readonly locator: CanonicalModelArtifactLocator
  readonly expectedArtifactId: string
  readonly expectedRevision: string
  readonly expectedArtifactFormat: CanonicalModelArtifactFormat
  readonly expectedArtifactRole: string
  readonly expectedModelFamily: string
  readonly expectedByteLength: number
  readonly expectedContentSha256: string
  readonly required: true
}

export interface CanonicalModelArtifactGpuBundleArtifact {
  readonly canonicalOrder: number
  readonly slotId: string
  readonly locator: CanonicalModelArtifactLocator
  readonly descriptorDigestSha256: string
  readonly objectIdentityDigestSha256: string
  readonly artifactId: string
  readonly revision: string
  readonly artifactFormat: CanonicalModelArtifactFormat
  readonly artifactRole: string
  readonly modelFamily: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly repositoryAdmission:
    | 'controlled_internal_test'
    | 'reviewed_repository_candidate'
  readonly sourceObservationDigestSha256: string
  readonly reviewEvidenceDigestSha256: string
  readonly securityReviewDigestSha256: string
  readonly licensePolicyDigestSha256: string
  readonly commercialUseStatus:
    | 'allowed'
    | 'blocked'
    | 'unknown'
    | 'needs_review'
  readonly reviewStatus:
    | 'not_reviewed'
    | 'needs_review'
    | 'approved'
    | 'blocked'
    | 'evaluation_only'
  readonly paidProductionUseApproved: boolean
  readonly consumerScopeVerified: true
  readonly executionClass: 'gpu_required'
  readonly requiredExecutionTarget: 'google_cloud_run_gpu'
  readonly accelerator: 'cuda'
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly fullRepositoryChecksumVerified: true
  readonly required: true
  readonly artifactBindingDigestSha256: string
}

export interface CanonicalModelArtifactGpuBundle {
  readonly bundleVersion:
    typeof CANONICAL_MODEL_ARTIFACT_GPU_BUNDLE_VERSION
  readonly bundleClass:
    'verified_server_resolved_model_artifact_gpu_bundle'
  readonly source:
    'canonical_model_artifact_repository_and_cloud_dispatch_attempt'
  readonly bundleId: string
  readonly identity: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly handoffManifestHash: string
    readonly manifestEntryHash: string
    readonly queueDefinitionHash: string
    readonly regionAuthorityHash: string
    readonly jobId: string
    readonly deliveryAttempt: number
    readonly approvedToolId: string
    readonly approvedToolOperationId: string
    readonly runtimeRegion: 'us-east1' | 'europe-west1'
    readonly targetHash: string
    readonly cloudRunJobResourceName: string
    readonly cloudRunJobRequestSha256: string
    readonly workerServiceAccountEmail: string
  }
  readonly consumerScope: string
  readonly requirementsDigestSha256: string
  readonly artifacts: readonly CanonicalModelArtifactGpuBundleArtifact[]
  readonly summary: {
    readonly artifactCount: number
    readonly totalByteLength: number
    readonly allArtifactsRequired: true
    readonly allArtifactIdentitiesUnique: true
    readonly allArtifactSlotsUnique: true
    readonly allArtifactsRepositoryVerified: true
    readonly allArtifactsGpuOnly: true
    readonly allArtifactsCudaRequired: true
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly execution: {
    readonly workerType: 'gpu_ai_worker'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly cloudRunAccelerator: 'nvidia_l4'
    readonly modelAccelerator: 'cuda'
    readonly gpuCount: 1
    readonly noGpuZonalRedundancy: true
    readonly taskCount: 1
    readonly parallelism: 1
    readonly cloudRunInternalMaxRetries: 0
    readonly packageQueueOwnsApprovedAttempts: true
    readonly workerLoadsAuthorityByOpaqueDispatchIntent: true
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly exactApprovedPackageAttemptBound: true
    readonly cloudTaskBodyContainsModelArtifactData: false
    readonly cloudRunEnvironmentContainsModelArtifactData: false
    readonly callerBytesAccepted: false
    readonly callerPathAccepted: false
    readonly callerUrlAccepted: false
    readonly credentialsIncluded: false
    readonly canonicalOperationArtifactSetVerified: false
    readonly privateGcsDistributionVerified: false
    readonly cloudRunReadOnlyMountVerified: false
    readonly workerServiceIdentityVerified: false
    readonly cloudRunJobDeploymentVerified: false
    readonly deployedGpuCapacityVerified: false
    readonly remoteMutationAuthorized: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly operationAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerPriceAuthority: false
    readonly customerCreditAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly bundleDigestSha256: string
}

export interface CanonicalModelArtifactCloudRunGpuHandoffLease {
  readonly leaseVersion:
    typeof CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_HANDOFF_LEASE_VERSION
  readonly leaseClass:
    'process_bound_single_use_verified_gpu_bundle_handoff'
  readonly leaseIdDigestSha256: string
  readonly bundleDigestSha256: string
  readonly dispatchIntentId: string
  readonly dispatchBindingHash: string
  readonly attemptPlanHash: string
  readonly consumerScope: string
  readonly artifactCount: number
  readonly totalByteLength: number
  readonly issuedAt: string
  readonly expiresAt: string
  readonly singleUse: true
  readonly readOnly: true
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly accelerator: 'cuda'
  readonly cloudRunAccelerator: 'nvidia_l4'
  readonly hostPathsIncluded: false
  readonly mountPathsIncluded: false
  readonly bytesIncluded: false
  readonly urlsIncluded: false
  readonly credentialsIncluded: false
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly remoteDistributionAuthorized: false
  readonly modelInferenceAuthority: false
  readonly productionReady: false
  readonly leaseDigestSha256: string
}

export interface CanonicalModelArtifactCloudRunGpuSource {
  readonly canonicalOrder: number
  readonly slotId: string
  readonly sourceAbsolutePath: string
  readonly serverDerivedReadOnlyMountPath: string
  readonly artifactRecordId: string
  readonly artifactId: string
  readonly revision: string
  readonly artifactFormat: CanonicalModelArtifactFormat
  readonly artifactRole: string
  readonly modelFamily: string
  readonly expectedByteLength: number
  readonly expectedContentSha256: string
  readonly expectedManifestDigestSha256: string
  readonly consumerScope: string
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly accelerator: 'cuda'
  readonly readOnly: true
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
}

export interface CanonicalModelArtifactCloudRunGpuConsumerInput {
  readonly dispatchIntentId: string
  readonly dispatchBindingHash: string
  readonly attemptPlanHash: string
  readonly bundleDigestSha256: string
  readonly consumerScope: string
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly cloudRunAccelerator: 'nvidia_l4'
  readonly artifactSources:
    readonly CanonicalModelArtifactCloudRunGpuSource[]
  readonly readOnlyMountRequired: true
  readonly serverOwnedRemoteDistributionStillRequired: true
  readonly callerPathsAccepted: false
  readonly callerUrlsAccepted: false
  readonly callerBytesAccepted: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly modelExecutionAuthorized: false
}

export interface CanonicalModelArtifactCloudRunGpuConsumerPort {
  readonly consumerVersion:
    typeof CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION
  readonly consumerClass:
    'process_bound_private_gpu_bundle_handoff_consumer'
  readonly consumerScope: string
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly cloudRunAccelerator: 'nvidia_l4'
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerBytesAccepted: false
  readonly remoteDistributionAuthorized: false
  readonly modelExecutionAuthorized: false
  readonly productionReady: false
  inspectVerifiedReadOnlyGpuBundle(
    input: CanonicalModelArtifactCloudRunGpuConsumerInput,
  ): Promise<void>
}

export interface CanonicalModelArtifactCloudRunGpuConsumptionReceipt {
  readonly consumptionVersion:
    typeof CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMPTION_VERSION
  readonly consumptionClass:
    'verified_single_use_gpu_bundle_handoff_consumption'
  readonly leaseDigestSha256: string
  readonly bundleDigestSha256: string
  readonly dispatchIntentId: string
  readonly dispatchBindingHash: string
  readonly attemptPlanHash: string
  readonly consumerScope: string
  readonly artifactCount: number
  readonly totalByteLength: number
  readonly consumedAt: string
  readonly allObjectsVerifiedBeforeConsumer: true
  readonly allObjectsVerifiedAfterConsumer: true
  readonly oneProcessBoundConsumerInvocation: true
  readonly readOnlySourcesPresented: true
  readonly hostPathsIncluded: false
  readonly mountPathsIncluded: false
  readonly bytesIncluded: false
  readonly urlsIncluded: false
  readonly credentialsIncluded: false
  readonly cloudTaskBodyChanged: false
  readonly cloudRunEnvironmentChanged: false
  readonly remoteDistributionPerformed: false
  readonly cloudRunJobExecuted: false
  readonly modelInferenceExecuted: false
  readonly providerCallMade: false
  readonly customerCreditsMutated: false
  readonly productionReady: false
  readonly consumptionDigestSha256: string
}
