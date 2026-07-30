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
    'selected_scene_lineage_and_private_prompt_materialization',
    'selected_scene_private_operation_and_canonical_comfyui_candidate_input_reconciliation',
    'partial_independent_canonical_offline_image_vulnerability_evidence_and_fail_closed_disposition',
    'official_shared_gpu_parent_hardened_package_matrix_and_dependency_delta',
    'strict_non_root_sanitized_local_hardened_image_verification',
    'digest_bound_archive_scan_attempt_and_complete_temporary_artifact_cleanup',
    'source_defined_pruned_image_build_complete_os_python_vulnerability_scan_spdx_sbom_and_full_file_license_scan',
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
        'exact_private_bundle_atomic_read_only_mount_canonical_full_frame_runtime_source_router_bridge_selected_scene_candidate_input_reconciliation_source_defined_pruned_hardened_build_strict_non_root_verification_zero_critical_high_complete_os_python_vulnerability_scan_spdx_sbom_and_full_file_license_scan_are_verified_but_manual_medium_low_license_direct_vcs_signature_canonical_ingest_distributed_mount_real_l4_generation_resource_persistence_and_qa_evidence_remain_required',
    },
    {
      gate:
        'advanced_temporal_living_a_roll_subject_mask',
      reason:
        'canonical_ffmpeg_to_sam2_work_admission_is_frozen_at_576ca54b_and_fixed_runner_router_plus_exact_private_checkpoint_read_only_mount_hard_cuda_refusal_and_the_official_torch_2_6_torchvision_0_21_cuda_12_4_core_candidate_matrix_are_frozen_but_the_complete_offline_closure_versioned_hardened_runtime_contract_checkpoint_regression_and_real_l4_inference_private_output_resource_and_mask_qa_evidence_remain_required',
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
