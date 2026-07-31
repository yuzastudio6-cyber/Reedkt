export const LIVING_FRAME_RIG_ACTION_VERSION =
  'living-frame-rig-action-plan-v1' as const

export const LIVING_FRAME_RIG_ACTION_CLASS =
  'master_timing_bound_non_executable_rig_action' as const

export const LIVING_FRAME_RIG_ACTION_TRACK_PROPERTIES = [
  'control_position_normalized',
  'bone_rotation_degrees',
  'mechanical_driver_value',
] as const
export type LivingFrameRigActionTrackProperty =
  (typeof LIVING_FRAME_RIG_ACTION_TRACK_PROPERTIES)[number]

export const LIVING_FRAME_RIG_ACTION_INTERPOLATIONS = [
  'linear',
  'ease_in_out_cubic',
  'bezier_settle',
] as const
export type LivingFrameRigActionInterpolation =
  (typeof LIVING_FRAME_RIG_ACTION_INTERPOLATIONS)[number]

export interface LivingFrameRigActionPointValue {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface LivingFrameRigActionKeyframe {
  readonly order: number
  readonly frame: number
  readonly scalarValue: number | null
  readonly pointValue: LivingFrameRigActionPointValue | null
  readonly interpolationToNext: LivingFrameRigActionInterpolation
}

export interface LivingFrameRigActionTrack {
  readonly order: number
  readonly trackId: string
  readonly property: LivingFrameRigActionTrackProperty
  readonly targetRefId: string
  readonly role: 'primary' | 'secondary'
  readonly keyframes: readonly LivingFrameRigActionKeyframe[]
}

export interface LivingFrameRigActionSourceBindings {
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly riggingPlanVersion: 'living-frame-rigging-plan-v2'
  readonly riggingPlanDigestSha256: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly framesCopiedFromMasterTiming: true
}

export interface LivingFrameRigActionAuthorityBoundary {
  readonly deterministicActionCompilationOnly: true
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly rigDefinitionAuthority: false
  readonly selectedSceneAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly workGraphAuthority: false
  readonly runtimeExecutionAuthority: false
  readonly assetPersistenceAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly qaApprovalAuthority: false
  readonly finalCanvasAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRigActionPlanDraft {
  readonly contractVersion: typeof LIVING_FRAME_RIG_ACTION_VERSION
  readonly actionClass: typeof LIVING_FRAME_RIG_ACTION_CLASS
  readonly sourceBindings: LivingFrameRigActionSourceBindings
  readonly narrativeActionId: string
  readonly narrativeActionSummary: string
  readonly finalPosePolicy: 'restore_initial' | 'settle_approved_pose'
  readonly tracks: readonly LivingFrameRigActionTrack[]
  readonly initialPoseVerified: true
  readonly finalPoseSettlesOrRestores: true
  readonly onePrimaryActionAtATime: true
  readonly masterTimingOwnsEveryFrame: true
  readonly containsExecutableCodeCommandPathUrlEnvironmentOrCredential: false
  readonly authorityBoundary: LivingFrameRigActionAuthorityBoundary
}

export interface LivingFrameRigActionPlan
  extends LivingFrameRigActionPlanDraft {
  readonly actionDigestSha256: string
}
