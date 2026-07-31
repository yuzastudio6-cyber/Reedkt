import type {
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
} from './living-frame-blender-fixed-adapter-internal-test'

export const LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION =
  'living-frame-blender-rig-private-persistence-internal-test-v1' as const

export const LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_blender_rig_create_only_artifact_set_persistence_evidence' as const

export const LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE =
  'blender_rig_artifact_set_persisted_canonical_manifest_qa_review_and_cost_reconciliation_pending' as const

export const LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_OPEN_GATES = [
  'canonical_work_graph_admission_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_rig_component_qa_required',
  'canonical_private_remotion_review_required',
  'canonical_resource_and_actual_cost_receipt_required',
] as const

export interface LivingFrameBlenderRigPrivatePersistenceReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly admissionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly approvedSnapshotDigestSha256: string
    readonly plannedWorkItemDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly adapterCandidateRequestDigestSha256: string
    readonly riggingPlanDigestSha256: string
    readonly actionPlanDigestSha256: string
    readonly adapterResultDigestSha256: string
    readonly adapterPayloadDigestSha256: string
    readonly artifactSetDigestSha256: string
  }
  readonly persistedArtifactSet: {
    readonly persistenceOwner:
      'living_frame_blender_rig_private_internal_create_only_persistence'
    readonly storageProfile:
      'canonical_private_local_create_only_files_v1'
    readonly privateArtifactSetIdentityHash: string
    readonly manifestDigestSha256: string
    readonly manifestByteLength: number
    readonly fileCount: number
    readonly rgbaFileCount: number
    readonly maskFileCount: number
    readonly depthFileCount: number
    readonly totalArtifactByteLength: number
    readonly files:
      readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[]
    readonly createOnlyPersistenceUsed: true
    readonly everyFileCreatedExactlyOnce: true
    readonly exactReadbackVerified: true
    readonly pngAndExrSignaturesVerified: true
    readonly rawBytesIncluded: false
    readonly storagePathsIncluded: false
  }
  readonly resourceObservation: {
    readonly executionClass:
      'private_internal_native_host_blender_qualification'
    readonly totalDurationMs: number
    readonly rigCompileDurationMs: number
    readonly renderDurationMs: number
    readonly maximumResidentBytes: number
    readonly outputByteLength: number
    readonly actualRuntimeObserved: true
    readonly canonicalResourceReceiptCreated: false
    readonly canonicalActualCostCreated: false
    readonly serviceFeeIncluded: false
  }
  readonly authorityBoundary: {
    readonly privateInternalPersistenceEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly timingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly canonicalArtifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly finalCanvasAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_BLENDER_RIG_PRIVATE_PERSISTENCE_OPEN_GATES
  readonly admissionRevalidated: true
  readonly outputLeaseConsumedExactlyOnce: true
  readonly privateInternalArtifactSetPersisted: true
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly remotionRemainsFinalCanvas: true
  readonly containsArtifactBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameBlenderRigPrivatePersistenceReport
  extends LivingFrameBlenderRigPrivatePersistenceReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameBlenderRigPrivatePersistedArtifactSetLease {
  readonly leaseClass:
    'process_bound_single_use_living_frame_blender_persisted_artifact_set_lease_v1'
  readonly leaseId: string
  readonly persistenceReportDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly manifestDigestSha256: string
  readonly fileCount: number
  readonly totalArtifactByteLength: number
  readonly files:
    readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[]
  readonly callerSerializable: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameBlenderRigPrivatePersistenceExecution {
  readonly report:
    LivingFrameBlenderRigPrivatePersistenceReport
  readonly persistedArtifactSetLease:
    LivingFrameBlenderRigPrivatePersistedArtifactSetLease
}
