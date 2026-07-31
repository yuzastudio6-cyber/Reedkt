import type {
  LivingFrameCharacterActionPhaseRole,
  LivingFrameCharacterActionPropConstraint,
} from './living-frame-character-action-choreography'

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION =
  'living-frame-complete-character-keypose-private-action-conditioning-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS =
  'server_private_complete_character_keypose_action_conditioning_receipt' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE =
  'action_conditioning_leases_created_selected_scene_prompt_materialization_pending' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_ISSUE_CODES = [
  'input_invalid',
  'controlled_image_binding_invalid',
  'source_lineage_mismatch',
  'reader_invalid',
  'reader_failed',
  'packet_invalid',
  'unit_set_mismatch',
  'cross_keypose_work_item_or_output_substitution',
  'conditioning_slot_invalid',
  'action_conditioning_invalid',
  'lease_invalid',
  'lease_reused',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssueCode =
  (typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_ISSUE_CODES)[number]

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssue {
  readonly code:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssueCode
  readonly path: string
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningAuthority {
  readonly privateActionConditioningAuthority: true
  readonly actionChoreographyAuthority: false
  readonly storyTimingAuthority: false
  readonly selectedSceneAuthority: false
  readonly selectedSceneConditioningAuthority: false
  readonly privateAliasRepositoryAuthority: false
  readonly promptMaterializationAuthority: false
  readonly modelSelectionAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly actualCostAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease {
  readonly leaseClass:
    'process_bound_single_use_complete_character_keypose_action_conditioning_lease_v1'
  readonly leaseId: string
  readonly conditioningDigestSha256: string
  readonly conditioningUnitId: string
  readonly bindingUnitId: string
  readonly selectedSceneRequestUnitId: string
  readonly callerSerializable: false
  readonly promptPacketMergeAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningUnit {
  readonly order: number
  readonly conditioningUnitId: string
  readonly bindingUnitId: string
  readonly bindingUnitDigestSha256: string
  readonly keyposeUnitId: string
  readonly keyposeUnitDigestSha256: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly actionPhase: {
    readonly role: LivingFrameCharacterActionPhaseRole
    readonly actionPhaseId: string
    readonly storyTimingFrame: number
    readonly minimumHoldFrames: number
    readonly propConstraint:
      LivingFrameCharacterActionPropConstraint
  }
  readonly privateConditioningReceipt: {
    readonly leaseId: string
    readonly positiveActionDirectiveDigestSha256: string
    readonly positiveActionDirectiveByteLength: number
    readonly negativeActionDirectiveDigestSha256: string
    readonly negativeActionDirectiveByteLength: number
    readonly rawActionDirectiveIncluded: false
    readonly rawChatTranscriptOrCallerPromptIncluded: false
    readonly imageModelPathUrlBytesCredentialCommandOrEnvironmentIncluded:
      false
    readonly leaseConsumed: false
  }
  readonly conditioningPolicy: {
    readonly appendsToValidatedServerOwnedSelectedSceneConditioning:
      true
    readonly replacesSelectedSceneStyleOrContinuityConditioning:
      false
    readonly exactActionPhaseSemanticsIncluded: true
    readonly exactBodyMechanicsIncluded: true
    readonly exactPropConstraintIncluded: true
    readonly storyTimingFrameIncludedAsPlanningContextOnly:
      true
    readonly genericNeutralPoseSubstitutionAllowed: false
    readonly independentlyInventedActionAllowed: false
    readonly bakedMotionOrMultiFrameOutputRequested: false
    readonly completeCharacterAndCleanSilhouetteRequired:
      true
  }
  readonly conditioningState:
    'private_action_directive_lease_created_prompt_packet_merge_pending'
  readonly promptPacketMerged: false
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly conditioningUnitDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS
  readonly conditioningState:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE
  readonly conditioningId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly controlledImageBindingVersion:
      'living-frame-complete-character-keypose-controlled-image-binding-v2'
    readonly controlledImageBindingId: string
    readonly controlledImageBindingDigestSha256: string
    readonly keyposePlanId: string
    readonly keyposePlanDigestSha256: string
    readonly actionChoreographyDigestSha256: string
    readonly authoritativeActionTimingArtifactId: string
    readonly authoritativeActionTimingDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly conditioningUnits:
    readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningUnit[]
  readonly metrics: {
    readonly actionConditioningUnitCount: 3 | 4
    readonly privateLeaseCount: number
    readonly distinctActionPhaseCount: number
    readonly exactBodyMechanicDirectiveCount: number
    readonly exactPropConstraintDirectiveCount: number
  }
  readonly mergeBoundary: {
    readonly sourceReaderMustBeServerOwnedSelectedSceneReader:
      true
    readonly nonKeyposeSelectedSceneUnitsRemainUnchanged:
      true
    readonly positiveAndNegativeSlotsMustAlreadyBePrivateConditioningText:
      true
    readonly oneActionLeaseConsumedPerExactKeyposeUnit: true
    readonly crossSceneWorkItemOutputOrKeyposeSubstitutionAllowed:
      false
    readonly mergedReaderRemainsSingleUseAtPromptMaterializer:
      true
  }
  readonly authorityBoundary:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningAuthority
  readonly controlledImageBindingRevalidated: true
  readonly privateActionConditioningReconciled: true
  readonly rawActionConditioningExcludedFromReceipt: true
  readonly privatePromptMaterialized: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly actualCostReceiptCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioning
  extends LivingFrameCompleteCharacterKeyposePrivateActionConditioningDraft {
  readonly conditioningDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposePrivateActionConditioningResult {
  readonly receipt:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning
  readonly privateActionConditioningLeases:
    readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease[]
}
