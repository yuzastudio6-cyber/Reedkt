export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_VERSION =
  'living-frame-blender-selected-scene-admission-candidate-v1' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_CLASS =
  'server_derived_non_authoritative_selected_scene_blender_rig_work_admission_candidate' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_STATE =
  'qualified_fixed_adapter_canonical_work_and_asset_owner_reconciliation_pending' as const

export const LIVING_FRAME_BLENDER_TOOL_ID = 'blender' as const

export const LIVING_FRAME_BLENDER_RIG_OPERATION_ID =
  'tool.blender.render_living_frame_component_rig.v1' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_OPEN_GATES = [
  'canonical_tool_profile_and_operation_registration_required',
  'canonical_estimate_work_asset_projection_extension_required',
  'canonical_work_graph_admission_required',
  'isolated_non_root_zero_network_worker_image_required',
  'canonical_private_artifact_persistence_and_manifest_reconciliation_required',
  'canonical_rig_component_qa_required',
  'canonical_private_remotion_review_required',
  'canonical_resource_and_actual_cost_receipt_required',
] as const

export type LivingFrameBlenderSelectedSceneAdmissionOpenGate =
  (typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_OPEN_GATES)[number]

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_ISSUE_CODES = [
  'input_invalid',
  'selected_scene_or_component_mismatch',
  'component_rigging_activation_missing',
  'selected_scene_lineage_mismatch',
  'confirmed_frame_mismatch',
  'master_timing_mismatch',
  'rig_candidate_invalid',
  'rig_action_invalid',
  'planned_work_binding_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameBlenderSelectedSceneAdmissionIssueCode =
  (typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_ISSUE_CODES)[number]

export interface LivingFrameBlenderSelectedSceneApprovedSnapshotBinding {
  readonly approvedSnapshotId: string
  readonly approvedSnapshotDigestSha256: string
  readonly immutableApprovedSnapshot: true
  readonly confirmedFrameIncluded: true
  readonly masterTimingIncluded: true
  readonly exactRiggingPlanIncluded: true
  readonly exactRigActionPlanIncluded: true
  readonly exactCreditEstimateIncluded: true
  readonly exactWorkGraphIncluded: true
}

export interface LivingFrameBlenderSelectedScenePlannedWorkBinding {
  readonly workItemKey: string
  readonly workItemDigestSha256: string
  readonly workItemType: 'build_component_rig'
  readonly sceneId: string
  readonly componentId: string
  readonly toolId: typeof LIVING_FRAME_BLENDER_TOOL_ID
  readonly operationId:
    typeof LIVING_FRAME_BLENDER_RIG_OPERATION_ID
  readonly approvedSnapshotDigestSha256: string
  readonly selectedSceneBindingDigestSha256: string
  readonly riggingPlanDigestSha256: string
  readonly actionPlanDigestSha256: string
  readonly confirmedOutputFrameDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly oneComponentSequencePerAttempt: true
  readonly maxAttempts: 1
  readonly cpuFallbackAllowed: true
  readonly approvedWorkItem: false
  readonly executablePayloadPresent: false
}

export interface LivingFrameBlenderSelectedSceneAdmissionAuthorityBoundary {
  readonly serverDerivedAdmissionCandidateAuthority: true
  readonly selectedSceneAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly riggingPlanAuthority: false
  readonly rigActionAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly estimateAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly rendererAuthority: false
  readonly finalCanvasAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameBlenderSelectedSceneAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_CLASS
  readonly admissionState:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_STATE
  readonly admissionCandidateId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly livingFrameComponentDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly componentGeometryBundleDigestSha256: string
    readonly riggingDirectionDigestSha256: string
    readonly riggingPlanDigestSha256: string
    readonly actionPlanDigestSha256: string
    readonly adapterCandidateRequestDigestSha256: string
    readonly approvedSnapshotDigestSha256: string
    readonly plannedWorkItemDigestSha256: string
  }
  readonly selectedRigIntent: {
    readonly componentRole:
      | 'primary_subject'
      | 'mechanical_component'
      | 'supporting_object'
    readonly componentRiggingActivationId: string
    readonly rigMode:
      | 'deformable_2d_character'
      | 'armature_2_5d_character'
    readonly primaryActionTrackCount: 1
    readonly finalPosePolicy:
      | 'restore_initial'
      | 'settle_approved_pose'
    readonly onePrimaryActionAtATime: true
    readonly masterTimingOwnsEveryFrame: true
  }
  readonly exactFrameBinding: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly visualRangeMatchesRigAction: true
    readonly squareSubstitutionForbidden: true
    readonly finalCanvasDelegationForbidden: true
  }
  readonly operationCandidate: {
    readonly toolId: typeof LIVING_FRAME_BLENDER_TOOL_ID
    readonly operationId:
      typeof LIVING_FRAME_BLENDER_RIG_OPERATION_ID
    readonly fixedAdapterProfile:
      'server_owned_fixed_bpy_rig_adapter_v1'
    readonly workItemType: 'build_component_rig'
    readonly executionPlacement:
      'private_isolated_cpu_render_worker'
    readonly oneAttemptOneComponentSequenceOneCostEvent: true
    readonly outputArtifactTypes: readonly [
      'living_frame_rigged_component_rgba_sequence',
      'living_frame_rigged_component_mask_sequence',
      'living_frame_rigged_component_depth_sequence',
      'living_frame_rigged_component_sequence_manifest',
    ]
    readonly remotionRemainsFinalCanvas: true
  }
  readonly approvedSnapshotBinding:
    LivingFrameBlenderSelectedSceneApprovedSnapshotBinding
  readonly plannedWorkBinding:
    LivingFrameBlenderSelectedScenePlannedWorkBinding
  readonly canonicalOwnerDisposition: {
    readonly currentEstimateProjectionIncludesBlender: false
    readonly currentWorkGraphProjectionIncludesBlender: false
    readonly currentAssetManifestIncludesRigSequence: false
    readonly canonicalOwnerReconciliationRequired: true
    readonly noParallelApprovedSnapshotOwnerCreated: true
    readonly noParallelMasterTimingOwnerCreated: true
    readonly noParallelWorkGraphOwnerCreated: true
    readonly noParallelAssetManifestOwnerCreated: true
    readonly noParallelCostOwnerCreated: true
    readonly noParallelPrivateReviewOwnerCreated: true
  }
  readonly authorityBoundary:
    LivingFrameBlenderSelectedSceneAdmissionAuthorityBoundary
  readonly operationRegistered: false
  readonly canonicalWorkAdmitted: false
  readonly dispatchGranted: false
  readonly runtimeAuthorityGranted: false
  readonly canonicalArtifactPersistenceGranted: false
  readonly assetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsEnvironmentOrExecutableCode:
    false
  readonly openGateCodes:
    readonly LivingFrameBlenderSelectedSceneAdmissionOpenGate[]
  readonly productionReady: false
}

export interface LivingFrameBlenderSelectedSceneAdmission
  extends LivingFrameBlenderSelectedSceneAdmissionDraft {
  readonly admissionDigestSha256: string
}

export interface LivingFrameBlenderSelectedSceneAdmissionIssue {
  readonly code:
    LivingFrameBlenderSelectedSceneAdmissionIssueCode
  readonly path: string
}
