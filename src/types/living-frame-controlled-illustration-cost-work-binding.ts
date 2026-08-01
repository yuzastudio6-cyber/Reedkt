export const
CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_VERSION =
  'canonical-living-frame-controlled-illustration-cost-work-binding-v2' as const

export const
CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_SOURCE =
  'canonical_living_frame_controlled_illustration_cost_work_binding_compiler' as const

export const
CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_COMPONENT_KEY =
  'livingFrameControlledIllustrationCostWorkBinding' as const

export interface CanonicalLivingFrameControlledIllustrationExpectedOutput {
  readonly assetIntentId: string
  readonly outputKey: string
  readonly artifactType:
    'living_frame_generated_opaque_still_png'
  readonly assetRole: 'generated'
  readonly contentType: 'image/png'
  readonly required: true
  readonly previewPlaceholderAllowed: false
  readonly assetManifestEntryRequiredAfterApproval: true
}

export interface CanonicalLivingFrameControlledIllustrationSceneCostWorkBinding {
  readonly sceneId: string
  readonly workRequirementKey: string
  readonly workItemType: 'generate_image_asset'
  readonly costOwnerClass:
    'shared_controlled_illustration_runtime'
  readonly generationCostComponentId:
    'shared_controlled_illustration_gpu_host'
  readonly generationCostLineKey: string
  readonly generatedAssetIntentIds: readonly string[]
  readonly generationUnitCount: number
  readonly plannedAttemptCount: number
  readonly maximumGenerationCreditBudget: number
  readonly executionPlacement: 'google_cloud_run_gpu'
  readonly expectedAccelerator: 'nvidia_l4'
  readonly expectedGpuCount: 1
  readonly cpuFallbackAllowed: false
  readonly expectedOutputs:
    readonly CanonicalLivingFrameControlledIllustrationExpectedOutput[]
  readonly optionalContinuityQaCostBinding: {
    readonly workRequirementKey: string
    readonly workItemType: 'run_asset_qa'
    readonly costComponentId:
      'auraface_cpu_continuity_measurement'
    readonly costLineKey: string
    readonly maximumCreditBudget: number
    readonly executionPlacement: 'private_cpu_worker'
    readonly conditional: true
  } | null
  readonly currentAdmission:
    'blocked_until_existing_work_graph_and_operation_authority_admit_exact_binding'
  readonly estimateLinePresentInCanonicalCustomerEstimate: true
  readonly actualAttemptCostEvidenceRequired: true
  readonly failedAndUnknownAttemptCostRetentionRequired: true
  readonly completedAttemptOnlyCustomerBillableCandidate: true
  readonly workItemCreated: false
  readonly executablePayloadPresent: false
}

export interface CanonicalLivingFrameControlledIllustrationCostWorkBindingAuthorityBoundary {
  readonly serverDerivedCostWorkBindingAuthority: true
  readonly customerEstimateAuthority: false
  readonly customerServiceFeeAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly modelArtifactAuthority: false
  readonly assetManifestAuthority: false
  readonly actualCostAuthority: false
  readonly settlementAuthority: false
  readonly walletAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameControlledIllustrationCostWorkBindingDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_controlled_illustration_cost_work_binding'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly assetWorkInputBindingDigestSha256: string
    readonly estimateWorkAssetProjectionDigestSha256: string
    readonly customerEstimateAuthorityDigestSha256: string
  }
  readonly scenes:
    readonly CanonicalLivingFrameControlledIllustrationSceneCostWorkBinding[]
  readonly metrics: {
    readonly generatedSceneCount: number
    readonly generatedAssetIntentCount: number
    readonly namedGenerateImageWorkRequirementCount: number
    readonly plannedGpuAttemptCount: number
    readonly optionalAuraFaceQaBindingCount: number
    readonly maximumGenerationCreditBudget: number
    readonly maximumContinuityQaCreditBudget: number
    readonly unassignedControlledIllustrationCostLineCount: 0
    readonly exactProductionToolRegistryCount: 50
  }
  readonly pricingPolicy: {
    readonly capabilityIdsCreateIndependentCharges: false
    readonly oneSharedGpuHostChargePerGenerationAttempt: true
    readonly auraFaceIsSeparateConditionalCpuQa: true
    readonly exactAssetReuseAddsGenerationCost: false
    readonly aggregateMicroCostBeforeCreditRounding: true
    readonly serviceFeeIncludedInToolCosts: false
    readonly serviceFeeLineCount: 1
    readonly unapprovedOverageMayBeCharged: false
  }
  readonly authorityBoundary:
    CanonicalLivingFrameControlledIllustrationCostWorkBindingAuthorityBoundary
  readonly existingCustomerEstimateRemainsAuthority: true
  readonly existingApprovedWorkGraphRemainsAuthority: true
  readonly existingActualCostAndSettlementRemainAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
    false
  readonly containsProviderPromptOrExecutablePayload: false
  readonly createsCanonicalWorkItems: false
  readonly expandsExactFiftyToolRegistry: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameControlledIllustrationCostWorkBinding
  extends CanonicalLivingFrameControlledIllustrationCostWorkBindingDraft {
  readonly bindingDigestSha256: string
}
