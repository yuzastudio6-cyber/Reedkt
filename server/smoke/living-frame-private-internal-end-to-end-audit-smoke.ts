import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

interface AuditCase {
  readonly id: string
  readonly relativePath: string
  readonly expectedJsonStatus?: 'passed' | 'conflict_observed'
  readonly validate?: (receipt: Record<string, unknown>) => void
}

const repositoryRoot = process.cwd()
const tsxEntrypoint = join(
  repositoryRoot,
  'node_modules',
  '.bin',
  'tsx',
)
assert.equal(
  existsSync(tsxEntrypoint),
  true,
  'Private Living Frame audit requires the pinned workspace tsx entrypoint.',
)

const cases: readonly AuditCase[] = [
  {
    id: 'parent_skill_and_planning_evidence',
    relativePath:
      'server/smoke/living-frame-planning-evidence-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.allRuntimeAuthoritiesClosed,
        true,
      )
      assert.equal(receipt.fixturePromotable, false)
    },
  },
  {
    id: 'parent_and_mini_skill_contract',
    relativePath:
      'server/smoke/living-frame-contract-smoke.ts',
  },
  {
    id: 'subject_neutral_capability_matrix',
    relativePath:
      'server/smoke/living-frame-subject-neutral-capability-matrix-smoke.ts',
  },
  {
    id: 'professional_rigging_direction_and_fixed_adapter_candidates',
    relativePath:
      'server/smoke/living-frame-rigging-v2-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.professionalDirectionVersion,
        'living-frame-rigging-direction-v1',
      )
      assert.deepEqual(receipt.routeFixtures, {
        nativeMechanical: 'reeditpro_native_remotion',
        flat2d: 'opentoonz_plastic_candidate',
        advanced2_5d: 'blender_headless_candidate',
      })
      assert.equal(
        receipt.exactHeadIntelligenceDecisionBinding,
        true,
      )
      assert.equal(receipt.fixedReviewedAdapterBoundary, true)
      assert.equal(receipt.callerOrModelGeneratedCodeAllowed, false)
      assert.equal(receipt.externalRuntimeExecutionAuthorized, false)
      assert.equal(receipt.remotionOwnsFinalCanvas, true)
    },
  },
  {
    id: 'master_timing_bound_rig_action_contract',
    relativePath:
      'server/smoke/living-frame-rig-action-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.contractVersion,
        'living-frame-rig-action-plan-v1',
      )
      assert.equal(receipt.exactMasterTimingLineage, true)
      assert.equal(receipt.deterministicCompilation, true)
      assert.equal(receipt.runtimeExecutionAuthority, false)
      assert.equal(receipt.finalCanvasAuthority, false)
      assert.equal(receipt.productionAuthority, false)
    },
  },
  {
    id: 'blender_fixed_adapter_private_native_host_runtime',
    relativePath:
      'server/smoke/living-frame-blender-fixed-adapter-private-internal-test-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.status,
        'passed_private_native_host_partial_qualification',
      )
      assert.equal(
        (receipt.preview as Record<string, unknown>).frameCount,
        10,
      )
      assert.equal(
        (receipt.full as Record<string, unknown>).frameCount,
        60,
      )
      assert.equal(
        (receipt.full as Record<string, unknown>).widthPixels,
        1_920,
      )
      assert.equal(
        (receipt.full as Record<string, unknown>).heightPixels,
        1_080,
      )
      assert.equal(receipt.externalOperationRegistered, false)
      assert.equal(receipt.networkIsolationStillRequired, true)
      assert.equal(receipt.remotionOwnsFinalCanvas, true)
    },
  },
  {
    id:
      'blender_fixed_textured_adapter_private_native_host_runtime',
    relativePath:
      'server/smoke/living-frame-blender-fixed-textured-adapter-private-internal-test-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.requestVersion,
        'living-frame-blender-fixed-textured-adapter-internal-request-v2',
      )
      assert.equal(
        receipt.textureArtifactId,
        'lf.style-depth.astronomer-flat-editorial.v1',
      )
      assert.equal(receipt.outputFrameCount, 60)
      assert.equal(
        Number(receipt.firstNonTransparentPixels)
          > 150_000,
        true,
      )
      assert.equal(
        Number(receipt.firstDistinctOpaqueColorBuckets)
          > 24,
        true,
      )
      assert.equal(
        Number(receipt.middleMotionPixelDelta)
          > 100_000,
        true,
      )
      assert.equal(receipt.finalReturnPixelDelta, 0)
      assert.equal(
        receipt.actualBlenderEntrypointExecuted,
        true,
      )
      assert.equal(receipt.remotionOwnsFinalCanvas, true)
      assert.equal(receipt.runtimeDispatchAuthority, false)
      assert.equal(receipt.assetPersistenceAuthority, false)
      assert.equal(receipt.qaApprovalAuthority, false)
      assert.equal(receipt.customerBillingAuthority, false)
      assert.equal(receipt.publicDeliveryAuthority, false)
      assert.equal(receipt.productionAuthority, false)
    },
  },
  {
    id:
      'blender_selected_scene_full_sequence_private_persistence',
    relativePath:
      'server/smoke/living-frame-blender-selected-scene-private-persistence-internal-test-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.status,
        'passed_private_internal_selected_scene_full_sequence_persistence',
      )
      assert.equal(receipt.sceneId, 'scene.musashi-strike')
      assert.equal(receipt.componentId, 'musashi.body')
      assert.equal(
        receipt.rigMode,
        'armature_2_5d_character',
      )
      assert.equal(receipt.fileCount, 180)
      assert.equal(
        receipt.createOnlyPersistenceAndReadbackVerified,
        true,
      )
      assert.equal(
        receipt.outputLeaseConsumedExactlyOnce,
        true,
      )
      assert.equal(
        receipt.persistedArtifactSetLeaseConsumedExactlyOnce,
        true,
      )
      assert.equal(receipt.canonicalAssetManifestMutated, false)
      assert.equal(receipt.canonicalQaApproved, false)
      assert.equal(receipt.privateReviewApproved, false)
      assert.equal(receipt.actualCostCreated, false)
      assert.equal(receipt.remotionRemainsFinalCanvas, true)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'blender_selected_scene_component_qa_and_private_remotion_review',
    relativePath:
      'server/smoke/living-frame-blender-selected-scene-private-review-internal-test-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.status,
        'passed_private_internal_component_qa_and_remotion_review',
      )
      assert.equal(receipt.sceneId, 'scene.musashi-strike')
      assert.equal(receipt.componentId, 'musashi.body')
      assert.equal(
        receipt.rigMode,
        'armature_2_5d_character',
      )
      assert.equal(receipt.persistedFileCount, 180)
      assert.equal(
        receipt.maximumAlphaMaskCodeValueDifference,
        1,
      )
      assert.equal(
        Number(
          receipt
            .maximumAlphaMaskQuantizationPixelCount,
        ) <= 208,
        true,
      )
      assert.equal(
        Array.isArray(
          receipt
            .depthSampleFiniteSubjectPixelCounts,
        )
        && receipt
          .depthSampleFiniteSubjectPixelCounts
          .length === 3
        && receipt
          .depthSampleFiniteSubjectPixelCounts
          .every(
            (value) =>
              Number(value) > 1_000,
          ),
        true,
      )
      assert.equal(
        receipt
          .boundedAlphaMaskAndDepthQaPassed,
        true,
      )
      assert.equal(
        receipt
          .requiredReturnToInitialPosePassed,
        true,
      )
      assert.equal(
        receipt
          .createOnlyPrivateReviewPersistencePassed,
        true,
      )
      assert.equal(receipt.remotionRenderCount, 4)
      assert.equal(receipt.canonicalAssetManifestMutated, false)
      assert.equal(receipt.canonicalQaApproved, false)
      assert.equal(receipt.privateReviewApproved, false)
      assert.equal(receipt.actualCostCreated, false)
      assert.equal(receipt.remotionRemainsFinalCanvas, true)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_animation_route_suitability',
    relativePath:
      'server/smoke/living-frame-character-animation-route-suitability-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.status,
        'passed',
      )
      assert.equal(
        receipt.restrainedMusashiRoute,
        'comfyui_controlled_component_preparation',
      )
      assert.equal(
        receipt.cleanRigidComponentRoute,
        'pixijs_rigid_cutout',
      )
      assert.equal(
        receipt.largePoseMusashiRoute,
        'comfyui_controlled_keyposes',
      )
      assert.equal(
        receipt.properlySeparatedCharacterRoute,
        'blender_articulated_2_5d',
      )
      assert.equal(
        receipt.flatMeshCharacterRoute,
        'opentoonz_flat_mesh',
      )
      assert.equal(
        receipt.musashiBlenderAdmissionRejected,
        true,
      )
      assert.equal(
        receipt.unsafePixiFaceCrossingRejected,
        true,
      )
      assert.equal(
        receipt.unreconstructedMusashiPlateRejectedFromPixi,
        true,
      )
      assert.equal(
        receipt.generatedKeyposePolicy,
        'controlled_anchor_keyposes_not_every_frame',
      )
      assert.equal(
        receipt.remotionOwnsFinalCanvas,
        true,
      )
      assert.equal(
        receipt.productionReady,
        false,
      )
    },
  },
  {
    id:
      'character_controlled_preparation',
    relativePath:
      'server/smoke/living-frame-character-controlled-preparation-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.selectedRoute,
        'comfyui_controlled_component_preparation',
      )
      assert.equal(receipt.preparationUnitCount, 2)
      assert.equal(receipt.maskedInpaintUnitCount, 1)
      assert.equal(receipt.isolatedComponentUnitCount, 1)
      assert.deepEqual(
        receipt.plateDimensions,
        [1920, 1080],
      )
      assert.deepEqual(
        receipt.componentDimensions,
        [1024, 1024],
      )
      assert.equal(
        receipt
          .existingGenericGraphMaySubstituteForMaskedInpaint,
        false,
      )
      assert.equal(
        receipt.independentPerFrameGeneration,
        false,
      )
      assert.equal(
        receipt.remotionOwnsFinalCanvas,
        true,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.assetCreated, false)
      assert.equal(receipt.qaApproved, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_masked_inpaint_comfyui_node_schema_evidence',
    relativePath:
      'server/smoke/living-frame-character-masked-inpaint-comfyui-node-schema-evidence-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.contractVersion,
        'living-frame-character-masked-inpaint-comfyui-node-schema-evidence-v1',
      )
      assert.equal(
        receipt.imageDigestSha256,
        '51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e',
      )
      assert.equal(
        receipt.sourceRevision,
        '093d571b83e7a79833200e199b46b9f5a62217f9',
      )
      assert.equal(
        receipt.loadImageGray8MaskRejected,
        true,
      )
      assert.equal(
        receipt.loadImageMaskRedChannelQualified,
        true,
      )
      assert.equal(
        receipt.vaeEncodeForInpaintQualified,
        true,
      )
      assert.equal(
        receipt.correctedMaskLoaderClass,
        'LoadImageMask',
      )
      assert.equal(
        receipt.correctedMaskLoaderChannel,
        'red',
      )
      assert.equal(
        receipt.correctedMaskOutputIndex,
        0,
      )
      assert.equal(receipt.imageExecuted, false)
      assert.equal(receipt.graphExecuted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_controlled_preparation_private_prompt',
    relativePath:
      'server/smoke/living-frame-character-controlled-preparation-private-prompt-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.contractVersion,
        'living-frame-character-controlled-preparation-private-prompt-v1',
      )
      assert.equal(receipt.promptUnitCount, 2)
      assert.equal(receipt.privateLeaseCount, 2)
      assert.equal(receipt.maskedInpaintPromptCount, 1)
      assert.equal(receipt.isolatedComponentPromptCount, 1)
      assert.deepEqual(
        receipt.plateDimensions,
        [1920, 1080],
      )
      assert.deepEqual(
        receipt.componentDimensions,
        [1024, 1024],
      )
      assert.equal(
        receipt.privateSourceAndMaskExcludedFromReceipt,
        true,
      )
      assert.equal(
        receipt.independentPerFrameGeneration,
        false,
      )
      assert.equal(
        receipt.remotionOwnsFinalCanvas,
        true,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.assetCreated, false)
      assert.equal(receipt.qaApproved, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_controlled_preparation_canonical_comfyui_reconciliation',
    relativePath:
      'server/smoke/living-frame-character-controlled-preparation-canonical-comfyui-reconciliation-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.contractVersion,
        'living-frame-character-controlled-preparation-canonical-comfyui-reconciliation-v1',
      )
      assert.equal(
        receipt.observedCanonicalBackendCommit,
        'b6eb48277cbd',
      )
      assert.equal(
        receipt.observedCanonicalTarget,
        'canonical-comfyui-gpu-runtime-request-candidate-v1',
      )
      assert.equal(receipt.preparationUnitCount, 2)
      assert.equal(
        receipt.canonicalV1CompatibleUnitCount,
        1,
      )
      assert.equal(
        receipt.canonicalV1CandidateInputLeaseCount,
        1,
      )
      assert.equal(
        receipt.maskedInpaintExtensionBlockedUnitCount,
        1,
      )
      assert.equal(
        receipt.requestedMaskedInpaintTarget,
        'canonical-comfyui-gpu-runtime-request-candidate-v2',
      )
      assert.deepEqual(
        receipt.componentCandidateDimensions,
        [1024, 1024],
      )
      assert.equal(
        receipt.oneCanonicalComfyUiIdentity,
        true,
      )
      assert.equal(
        receipt.independentPerFrameGeneration,
        false,
      )
      assert.equal(
        receipt.remotionOwnsFinalCanvas,
        true,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.assetCreated, false)
      assert.equal(receipt.qaApproved, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_controlled_preparation_private_output',
    relativePath:
      'server/smoke/living-frame-character-controlled-preparation-private-output-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.status, 'passed')
      assert.equal(
        receipt.evidenceClass,
        'controlled_source_fixture',
      )
      assert.deepEqual(
        receipt.dimensions,
        [1920, 1080],
      )
      assert.equal(
        receipt.exactMaskLoader,
        'LoadImageMask',
      )
      assert.equal(
        receipt.exactMaskChannel,
        'red',
      )
      assert.equal(
        receipt.exactMaskOutputIndex,
        0,
      )
      assert.equal(
        receipt.routeRecompileAfterQa,
        true,
      )
      assert.equal(
        receipt.remotionOwnsFinalCanvas,
        true,
      )
      assert.equal(receipt.adversarialAssertions, 20)
      assert.equal(receipt.artifactPersisted, false)
      assert.equal(receipt.qaApproved, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'character_pixijs_remotion_private_composite',
    relativePath:
      'server/smoke/living-frame-character-pixijs-remotion-composite-internal-test-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.contractVersion,
        'living-frame-character-pixijs-remotion-composite-internal-test-v1',
      )
      assert.equal(
        receipt.pixiJsToolId,
        'pixijs',
      )
      assert.equal(
        receipt.remotionToolId,
        'remotion',
      )
      assert.equal(
        receipt.finalFrameCount,
        120,
      )
      assert.equal(
        receipt.remotionRenderCount,
        8,
      )
      assert.equal(
        receipt.swordActionRoute,
        'comfyui_controlled_component_preparation',
      )
      assert.equal(
        receipt.independentPerFrameGenerationAllowed,
        false,
      )
      assert.equal(
        receipt.operationRegistered,
        false,
      )
      assert.equal(
        receipt.canonicalDispatchIntegrated,
        false,
      )
      assert.equal(
        receipt.canonicalAssetManifestMutated,
        false,
      )
      assert.equal(
        receipt.productionReady,
        false,
      )
    },
  },
  {
    id: 'selected_scene_private_prompt_materialization',
    relativePath:
      'server/smoke/living-frame-controlled-image-selected-scene-private-prompt-materialization-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'selected_scene_canonical_comfyui_candidate_input_reconciliation',
    relativePath:
      'server/smoke/living-frame-controlled-image-selected-scene-private-operation-request-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.canonicalCandidateInputReconciled,
        true,
      )
      assert.equal(
        receipt.canonicalTargetVersion,
        'canonical-comfyui-gpu-runtime-request-candidate-v1',
      )
      assert.equal(receipt.canonicalAliasesVerified, true)
      assert.equal(
        receipt.canonicalRuntimeCompilerInvoked,
        false,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'canonical_offline_comfyui_image_vulnerability_evidence',
    relativePath:
      'server/smoke/living-frame-comfyui-canonical-offline-image-vulnerability-evidence-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(receipt.fullImageScanCompleted, false)
      assert.equal(
        receipt.pythonPackageMetadataCovered,
        true,
      )
      assert.equal(
        receipt.osPackageVulnerabilitiesCovered,
        false,
      )
      assert.equal(receipt.uniqueCriticalCount, 1)
      assert.equal(receipt.uniqueHighCount, 16)
      assert.equal(
        receipt.releaseDisposition,
        'blocked_hardened_rebuild_and_complete_scan_required',
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'shared_gpu_parent_hardened_package_matrix_candidate',
    relativePath:
      'server/smoke/living-frame-shared-gpu-parent-hardened-package-matrix-candidate-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.candidateTorchVersion,
        '2.6.0+cu124',
      )
      assert.equal(
        receipt.candidateTorchVisionVersion,
        '0.21.0+cu124',
      )
      assert.equal(receipt.candidateTritonVersion, '3.2.0')
      assert.equal(receipt.requiredCusparseLtVersion, '0.6.2')
      assert.equal(receipt.publishedArtifactCount, 4)
      assert.equal(
        receipt.publishedArtifactByteLength,
        1_178_861_927,
      )
      assert.equal(receipt.completeOfflineClosure, false)
      assert.equal(receipt.imageBuilt, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id: 'hardened_comfyui_local_image_evidence',
    relativePath:
      'server/smoke/living-frame-comfyui-hardened-local-image-evidence-smoke.ts',
    validate(receipt) {
      assert.equal(
        receipt.strictNonRootVerificationPassed,
        true,
      )
      assert.equal(receipt.fullImageScanCompleted, false)
      assert.equal(
        receipt.vulnerabilityClearanceGranted,
        false,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id: 'hardened_comfyui_archive_scan_evidence',
    relativePath:
      'server/smoke/living-frame-comfyui-hardened-archive-scan-evidence-smoke.ts',
    validate(receipt) {
      assert.equal(receipt.archiveInputVerified, true)
      assert.equal(receipt.fullImageScanCompleted, false)
      assert.equal(
        receipt.vulnerabilityClearanceGranted,
        false,
      )
      assert.equal(receipt.archiveAndScratchDeleted, true)
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'pruned_source_build_and_complete_scan_evidence',
    relativePath:
      'server/smoke/living-frame-comfyui-pruned-source-build-evidence-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.sourceDefinedBuildCompleted,
        true,
      )
      assert.equal(
        receipt.strictNonRootVerificationPassed,
        true,
      )
      assert.equal(
        receipt.fullVulnerabilityScanCompleted,
        true,
      )
      assert.equal(receipt.criticalFindingCount, 0)
      assert.equal(receipt.highFindingCount, 0)
      assert.equal(
        receipt.criticalHighAdmissionGatePassed,
        true,
      )
      assert.equal(receipt.sbomCompleted, true)
      assert.equal(
        receipt.fullFileLicenseScanCompleted,
        true,
      )
      assert.equal(
        receipt.licenseApprovalGranted,
        false,
      )
      assert.equal(
        receipt.privateL4InternalTestEligibleFromImageEvidence,
        true,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id:
      'pruned_no_sam2_source_build_and_complete_scan_evidence',
    relativePath:
      'server/smoke/living-frame-comfyui-pruned-no-sam2-source-build-evidence-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.inheritedDirectVcsDistributionRemoved,
        true,
      )
      assert.equal(
        receipt.inheritedDirectVcsPackageAbsentFromSbom,
        true,
      )
      assert.equal(
        receipt.inheritedDirectVcsPackageAbsentFromLicenseReport,
        true,
      )
      assert.equal(
        receipt.runnerSam2ImportGuardRetained,
        true,
      )
      assert.equal(
        receipt.directVcsDispositionPassedForPrivateImage,
        true,
      )
      assert.equal(receipt.criticalFindingCount, 0)
      assert.equal(receipt.highFindingCount, 0)
      assert.equal(
        receipt.privateL4InternalTestEligibleFromImageEvidence,
        true,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id: 'five_modes_depth_attention_captions_sound_and_fallbacks',
    relativePath:
      'server/smoke/living-frame-five-mode-private-render-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.deepEqual(receipt.modesRendered, [
        'living_a_roll',
        'living_still',
        'living_archive',
        'living_diagram',
        'hybrid_expansion',
      ])
      assert.equal(receipt.deliberateNonUseRendered, true)
    },
  },
  {
    id: 'confirmed_non_square_output_frames',
    relativePath:
      'server/smoke/living-frame-confirmed-ratio-private-render-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.exactConfirmedRatioPreserved,
        true,
      )
      assert.equal(
        receipt.squareSubstitutionApplied,
        false,
      )
    },
  },
  {
    id: 'selected_scene_environmental_particle_slice',
    relativePath:
      'server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.privateInternalParticleSliceEndToEndPassed,
        true,
      )
      assert.equal(receipt.artifactPersisted, true)
      assert.equal(
        receipt.privateReviewEvidenceCompiled,
        true,
      )
    },
  },
  {
    id: 'animation_aware_illustration_component_rig',
    relativePath:
      'server/smoke/living-frame-animation-aware-illustration-private-composite-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        Number(receipt.swordArmSelectedPixelCount) > 3_000,
        true,
      )
      assert.equal(
        Number(receipt.swordArmReconstructedPixelCount) > 1_000,
        true,
      )
      assert.equal(
        Number(receipt.swordArmTransparentClearedPixelCount) > 1_000,
        true,
      )
      assert.equal(
        Number(receipt.hairSelectedPixelCount) > 350,
        true,
      )
      assert.equal(
        Number(receipt.robeSelectedPixelCount) > 350,
        true,
      )
      assert.equal(
        Number(receipt.hairRegionPixelDelta) > 400,
        true,
      )
      assert.equal(
        Number(receipt.robeRegionPixelDelta) > 400,
        true,
      )
      assert.equal(
        Number(receipt.swordArmRegionPixelDelta) > 1_000,
        true,
      )
    },
  },
  {
    id: 'style_adaptive_flat_and_shallow_2_5d_render',
    relativePath:
      'server/smoke/living-frame-style-depth-breadth-private-render-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.deepEqual(receipt.renderedStyles, [{
        assetTreatment: 'flat_editorial_cutout',
        depthStyle: 'flat',
        spatialParallaxAllowed: false,
      }, {
        assetTreatment: 'paper_collage',
        depthStyle: 'shallow_2_5d',
        spatialParallaxAllowed: true,
      }])
      assert.equal(
        Number(
          receipt.shallowForegroundDisplacementPixels,
        ) > Number(
          receipt.shallowFarPlaneDisplacementPixels,
        ),
        true,
      )
      assert.equal(
        Number(
          receipt.mechanicalWheelComponentCount,
        ),
        3,
      )
      assert.equal(
        Array.isArray(
          receipt.mechanicalWheelSelectedPixelCounts,
        )
        && receipt.mechanicalWheelSelectedPixelCounts
          .length === 3
        && receipt.mechanicalWheelSelectedPixelCounts
          .every((value) => Number(value) > 1_700),
        true,
      )
      assert.equal(
        Number(
          receipt
            .mechanicalWheelReconstructedPixelCount,
        ) > 5_100,
        true,
      )
      assert.equal(
        Number(
          receipt.staticDriveRodSelectedPixelCount,
        ) > 1_000,
        true,
      )
      assert.equal(
        receipt.staticDriveRodRemainedUnrotated,
        true,
      )
      assert.equal(
        Number(
          receipt.mechanicalWheelRegionPixelDelta,
        ) > 1_800,
        true,
      )
      assert.equal(
        Number(
          receipt.mechanicalWheelRotationDegrees,
        ),
        240,
      )
    },
  },
  {
    id: 'semantic_sound_timing_reconciliation',
    relativePath:
      'server/smoke/living-frame-semantic-sound-timing-reconciliation-smoke.ts',
  },
  {
    id: 'canonical_private_review_lineage',
    relativePath:
      'server/smoke/living-frame-canonical-private-review-evidence-smoke.ts',
  },
  {
    id: 'temporal_mask_selected_scene_work_candidate',
    relativePath:
      'server/smoke/living-frame-temporal-mask-work-admission-candidate-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.sourceVideoOperation,
        'prepare_approved_living_frame_temporal_source_video',
      )
      assert.equal(
        receipt.temporalMaskOperation,
        'tool.sam2.segment_and_track_subject.v1',
      )
      assert.equal(
        receipt.temporalOutputEncoding,
        'gray8_ffv1_matroska_mask_sequence_v1',
      )
      assert.equal(receipt.existingSam2IdentityReused, true)
      assert.equal(receipt.newToolIdentityCreated, false)
    },
  },
  {
    id: 'sam2_runtime_vulnerability_admission_gate',
    relativePath:
      'server/smoke/living-frame-sam2-runtime-vulnerability-gate-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.vulnerableTorchVersion,
        '2.5.1+cu124',
      )
      assert.equal(
        receipt.vulnerabilityId,
        'CVE-2025-32434',
      )
      assert.equal(
        receipt.minimumFixedTorchVersion,
        '2.6.0',
      )
      assert.equal(receipt.severity, 'CRITICAL')
      assert.equal(
        receipt.sourceContractVersionBumpRequired,
        true,
      )
      assert.equal(
        receipt.currentRuntimeAdmittedForL4,
        false,
      )
      assert.equal(receipt.operationRegistered, false)
      assert.equal(receipt.dispatchGranted, false)
      assert.equal(receipt.runtimeExecuted, false)
      assert.equal(receipt.productionReady, false)
    },
  },
  {
    id: 'temporal_mask_byte_output_and_measurement',
    relativePath:
      'server/smoke/living-frame-temporal-mask-private-output-contract-internal-test-smoke.ts',
    expectedJsonStatus: 'passed',
    validate(receipt) {
      assert.equal(
        receipt.encodingProfile,
        'gray8_ffv1_matroska_mask_sequence_v1',
      )
      assert.equal(
        receipt.losslessFrameReplayVerified,
        true,
      )
      assert.deepEqual(receipt.findingCodes, [])
      assert.equal(receipt.sam2InferenceClaimed, false)
    },
  },
  {
    id: 'temporal_mask_shared_interface_gate',
    relativePath:
      'server/smoke/living-frame-temporal-mask-canonical-work-graph-conflict-smoke.ts',
    expectedJsonStatus: 'conflict_observed',
    validate(receipt) {
      assert.equal(
        receipt.requestedAssetKind,
        'temporal_subject_mask_sequence',
      )
      assert.equal(
        receipt.observedOperationId,
        'tool.rembg.remove_image_background.v1',
      )
      assert.equal(
        receipt.requiredTemporalOperationId,
        'tool.sam2.segment_and_track_subject.v1',
      )
      assert.equal(
        receipt.canonicalOwnerMutationPerformed,
        false,
      )
      assert.equal(receipt.runtimeAuthority, false)
    },
  },
] as const

const results = cases.map(runCase)
const runtimeCaseIds = [
  'blender_fixed_adapter_private_native_host_runtime',
  'blender_fixed_textured_adapter_private_native_host_runtime',
  'blender_selected_scene_full_sequence_private_persistence',
  'blender_selected_scene_component_qa_and_private_remotion_review',
  'five_modes_depth_attention_captions_sound_and_fallbacks',
  'confirmed_non_square_output_frames',
  'selected_scene_environmental_particle_slice',
  'animation_aware_illustration_component_rig',
  'style_adaptive_flat_and_shallow_2_5d_render',
  'temporal_mask_byte_output_and_measurement',
] as const
for (const runtimeCaseId of runtimeCaseIds) {
  assert.equal(
    results.some((result) =>
      result.id === runtimeCaseId
      && result.exitStatus === 0),
    true,
  )
}

const receipt = {
  smoke:
    'living_frame_private_internal_end_to_end_audit',
  status:
    'passed_with_explicit_blocked_model_runtimes',
  privateInternalOnly: true,
  caseCount: results.length,
  passedCaseCount:
    results.filter((result) =>
      result.exitStatus === 0).length,
  actualMediaRuntimeCaseCount: runtimeCaseIds.length,
  cases: results,
  verifiedCoverage: [
    'composite_parent_and_mini_skill_contract',
    'head_intelligence_rigging_direction_native_opentoonz_blender_routing_and_fixed_non_executable_adapter_candidates',
    'master_timing_bound_non_executable_rig_action_with_deep_adversarial_verification',
    'fixed_reviewed_blender_bpy_armature_ik_skinning_transparent_rgba_mask_depth_private_native_host_runtime',
    'fixed_reviewed_blender_digest_bound_rgba_texture_uv_armature_skinning_transparent_rgba_mask_depth_private_native_host_runtime',
    'selected_musashi_scene_exact_approved_snapshot_master_timing_work_item_and_confirmed_frame_blender_binding_with_full_rgba_mask_depth_create_only_private_persistence_and_reread',
    'selected_musashi_scene_independent_persisted_component_alpha_mask_depth_motion_restoration_qa_and_actual_private_remotion_review',
    'character_animation_route_suitability_rejects_merged_musashi_blender_and_direct_pixijs_deformation_routes_that_action_to_controlled_component_preparation_and_proves_a_separate_complete_character_through_real_pixijs_and_remotion',
    'character_controlled_preparation_binds_one_confirmed_ratio_masked_inpaint_plate_and_one_1024_square_alpha_component_to_exact_approved_outputs',
    'character_masked_inpaint_pinned_image_source_schema_proves_plain_load_image_returns_zero_for_opaque_gray8_and_qualifies_load_image_mask_red_output_zero_for_vae_inpaint',
    'character_private_prompt_materialization_uses_load_image_mask_red_and_vae_encode_for_inpaint_rejects_empty_latent_or_plain_load_image_mask_substitution_and_creates_two_single_use_non_dispatched_leases',
    'character_canonical_comfyui_reconciliation_proves_the_1024_component_is_exactly_v1_compatible_and_blocks_the_confirmed_ratio_masked_plate_until_the_same_operation_has_a_versioned_load_image_mask_red_vae_inpaint_source_and_mask_envelope',
    'character_private_output_preverification_accepts_only_one_exact_lineage_bound_opaque_1920x1080_masked_plate_from_the_future_canonical_v2_boundary_recomputes_alpha_and_releases_one_process_bound_private_lease_while_the_existing_selected_scene_output_observer_v2_adapter_persistence_qa_route_recompile_and_remotion_remain_pending',
    'selected_scene_lineage_and_private_prompt_materialization',
    'selected_scene_private_operation_and_canonical_comfyui_candidate_input_reconciliation',
    'partial_independent_canonical_offline_image_vulnerability_evidence_and_fail_closed_disposition',
    'official_shared_gpu_parent_hardened_package_matrix_and_dependency_delta',
    'strict_non_root_sanitized_local_hardened_image_verification',
    'digest_bound_archive_scan_attempt_and_complete_temporary_artifact_cleanup',
    'source_defined_pruned_image_build_complete_os_python_vulnerability_scan_spdx_sbom_and_full_file_license_scan',
    'source_defined_pruned_image_exact_inherited_direct_vcs_sam2_removal_repeat_complete_scan_and_retained_runner_import_denial',
    'all_five_modes_and_deliberate_non_use',
    'flat_shallow_and_deep_2_5d',
    'focus_handoff_attention_restoration_and_low_risk_occlusion',
    'confirmed_portrait_landscape_and_custom_non_square_frames',
    'caption_plane_priority',
    'environmental_particle_runtime_persistence_qa_and_private_review',
    'narration_protected_sound',
    'real_illustration_alpha_destination_composite_and_character_action_rig',
    'actual_style_adaptive_flat_editorial_shallow_paper_collage_and_deep_anime_rendering',
    'paper_collage_mechanical_wheel_decomposition_rotation_and_static_rod_compositing',
    'selected_scene_temporal_source_video_and_sam2_work_admission_candidate',
    'sam2_critical_torch_vulnerability_and_versioned_runtime_contract_gate',
    'real_gray8_ffv1_temporal_mask_output_decode_measurement_persistence_and_review_frames',
    'render_fallbacks',
    'canonical_private_review_lineage',
  ],
  remainingInternalRuntimeGates: [
    {
      gate:
        'exact_comfyui_controlled_generation_runtime',
      reason:
        'exact_private_bundle_atomic_read_only_mount_canonical_full_frame_runtime_source_router_bridge_selected_scene_candidate_input_reconciliation_character_masked_inpaint_and_component_prompt_topology_pinned_private_image_load_image_load_image_mask_and_vae_encode_for_inpaint_schema_source_defined_pruned_hardened_build_exact_inherited_direct_vcs_sam2_removal_strict_non_root_verification_zero_critical_high_complete_os_python_vulnerability_scan_spdx_sbom_full_file_license_scan_and_a_future_v2_exact_lineage_opaque_1920x1080_private_output_preverification_fixture_are_verified_but_canonical_v2_release_the_existing_selected_scene_private_output_observer_v2_adapter_gray8_mask_staging_manual_medium_low_license_signature_canonical_ingest_distributed_mount_real_l4_generation_resource_receipt_create_only_persistence_exact_reread_character_plate_continuity_face_clearance_fact_destination_qa_route_recompile_manifest_reconciliation_private_review_and_final_remotion_evidence_remain_required',
    },
    {
      gate:
        'advanced_temporal_living_a_roll_subject_mask',
      reason:
        'canonical_ffmpeg_to_sam2_work_admission_is_frozen_at_576ca54b_and_fixed_runner_router_plus_exact_private_checkpoint_read_only_mount_hard_cuda_refusal_and_the_official_torch_2_6_torchvision_0_21_cuda_12_4_core_candidate_matrix_are_frozen_but_the_complete_offline_closure_versioned_hardened_runtime_contract_checkpoint_regression_and_real_l4_inference_private_output_resource_and_mask_qa_evidence_remain_required',
    },
    {
      gate:
        'advanced_rigging_external_tool_runtime',
      reason:
        'head_intelligence_rigging_direction_rigging_v2_relational_validation_pixijs_opentoonz_blender_and_comfyui_route_selection_fixed_blender_adapter_materialization_one_signed_notarized_native_arm64_blender_4_5_11_armature_ik_skinning_rgba_mask_depth_fixture_and_one_digest_bound_texture_fixture_are_verified_the_real_musashi_merged_arm_sleeve_hand_sword_cutout_is_explicitly_rejected_for_generic_blender_deformation_and_direct_pixijs_animation_then_routes_to_controlled_comfyui_component_preparation_or_controlled_anchor_keyposes_while_a_separate_complete_character_cutout_passes_real_pinned_pixijs_and_remotion_private_composite_evidence_blender_network_isolation_offline_non_root_worker_image_canonical_estimate_work_asset_admission_manifest_reconciliation_qa_private_review_approval_actual_cost_and_broader_properly_separated_character_fixture_evidence_remain_required_while_the_unsigned_x86_64_opentoonz_1_8_0_macos_package_is_fail_closed_and_still_requires_a_qualified_runtime_or_professional_fallback',
    },
  ],
  internalEndToEndReadyForOwnerReview: false,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

process.stdout.write(`${JSON.stringify(receipt)}\n`)

function runCase(input: AuditCase): {
  readonly id: string
  readonly exitStatus: 0
  readonly outputDigestSha256: string
  readonly structuredReceiptObserved: boolean
  readonly observedStatus:
    | 'passed'
    | 'conflict_observed'
    | 'not_structured'
} {
  const absolutePath = join(
    repositoryRoot,
    input.relativePath,
  )
  assert.equal(
    existsSync(absolutePath),
    true,
    `Private Living Frame audit case is missing: ${input.id}.`,
  )
  const execution = spawnSync(
    tsxEntrypoint,
    [absolutePath],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
      timeout: 15 * 60 * 1_000,
    },
  )
  assert.equal(
    execution.status,
    0,
    `Private Living Frame audit case failed: ${input.id}.`,
  )
  const stdout = execution.stdout
  const structuredReceipt = parseLastJsonObject(stdout)
  if (input.expectedJsonStatus) {
    assert.ok(
      structuredReceipt,
      `Private Living Frame audit case did not emit structured evidence: ${input.id}.`,
    )
    assert.equal(
      structuredReceipt.status,
      input.expectedJsonStatus,
    )
  }
  if (input.validate) {
    assert.ok(
      structuredReceipt,
      `Private Living Frame audit case cannot be validated without structured evidence: ${input.id}.`,
    )
    input.validate(structuredReceipt)
  }
  return {
    id: input.id,
    exitStatus: 0,
    outputDigestSha256:
      createHash('sha256')
        .update(stdout)
        .digest('hex'),
    structuredReceiptObserved:
      structuredReceipt != null,
    observedStatus:
      structuredReceipt?.status === 'passed'
      || structuredReceipt?.status === 'conflict_observed'
        ? structuredReceipt.status
        : 'not_structured',
  }
}

function parseLastJsonObject(
  output: string,
): Record<string, unknown> | null {
  const lines = output.trim().split(/\r?\n/u)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim()
    if (!line?.startsWith('{')) {
      continue
    }
    try {
      const parsed = JSON.parse(line) as unknown
      if (
        parsed
        && typeof parsed === 'object'
        && !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Continue to the previous output line.
    }
  }
  return null
}
