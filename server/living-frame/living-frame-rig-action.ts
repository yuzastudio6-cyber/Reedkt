import { z } from 'zod'

import type {
  LivingFrameRigActionAuthorityBoundary,
  LivingFrameRigActionPlan,
  LivingFrameRigActionPlanDraft,
  LivingFrameRigActionTrack,
} from '../../src/types/living-frame-rig-action'
import {
  LIVING_FRAME_RIG_ACTION_CLASS,
  LIVING_FRAME_RIG_ACTION_INTERPOLATIONS,
  LIVING_FRAME_RIG_ACTION_TRACK_PROPERTIES,
  LIVING_FRAME_RIG_ACTION_VERSION,
} from '../../src/types/living-frame-rig-action'
import type {
  LivingFrameRiggingV2Plan,
} from '../../src/types/living-frame-rigging-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRiggingV2Plan,
} from './living-frame-rigging-v2'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SAFE_SUMMARY = /^[a-zA-Z0-9][a-zA-Z0-9 .,;:()'/_+-]{0,511}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:|file:|data:|javascript:|[<>`{}]|(?:^|\s)(?:exec|eval|import|require|spawn|system|command|shell|script|path|url|credential|environment)(?:\s|$))/iu

const pointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
  z: z.number().finite().min(-1).max(1),
}).strict()

const keyframeSchema = z.object({
  order: z.number().int().nonnegative().max(255),
  frame: z.number().int().nonnegative().max(1_000_000),
  scalarValue: z.number().finite().min(-10_000).max(10_000).nullable(),
  pointValue: pointSchema.nullable(),
  interpolationToNext: z.enum(LIVING_FRAME_RIG_ACTION_INTERPOLATIONS),
}).strict()

const trackSchema = z.object({
  order: z.number().int().nonnegative().max(63),
  trackId: z.string().regex(SAFE_ID),
  property: z.enum(LIVING_FRAME_RIG_ACTION_TRACK_PROPERTIES),
  targetRefId: z.string().regex(SAFE_ID),
  role: z.enum(['primary', 'secondary']),
  keyframes: z.array(keyframeSchema).min(2).max(256),
}).strict()

const inputSchema = z.object({
  riggingPlan: z.custom<LivingFrameRiggingV2Plan>(
    verifyLivingFrameRiggingV2Plan,
  ),
  narrativeActionId: z.string().regex(SAFE_ID),
  narrativeActionSummary: z.string().regex(SAFE_SUMMARY),
  finalPosePolicy: z.enum([
    'restore_initial',
    'settle_approved_pose',
  ]),
  tracks: z.array(trackSchema).min(1).max(64),
}).strict()

const AUTHORITY_BOUNDARY:
  LivingFrameRigActionAuthorityBoundary = Object.freeze({
    deterministicActionCompilationOnly: true,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    rigDefinitionAuthority: false,
    selectedSceneAuthority: false,
    approvedSnapshotAuthority: false,
    workGraphAuthority: false,
    runtimeExecutionAuthority: false,
    assetPersistenceAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    qaApprovalAuthority: false,
    finalCanvasAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRigActionInput {
  readonly riggingPlan: LivingFrameRiggingV2Plan
  readonly narrativeActionId: string
  readonly narrativeActionSummary: string
  readonly finalPosePolicy: 'restore_initial' | 'settle_approved_pose'
  readonly tracks: readonly LivingFrameRigActionTrack[]
}

export function compileLivingFrameRigActionPlan(
  rawInput: CompileLivingFrameRigActionInput,
): LivingFrameRigActionPlan {
  const input = inputSchema.parse(rawInput)
  assertAction(input.riggingPlan, input.tracks, input.finalPosePolicy)
  if (
    UNSAFE_TEXT.test(input.narrativeActionSummary)
    || UNSAFE_TEXT.test(input.narrativeActionId)
  ) {
    throw new Error('Living Frame rig action contains unsafe material.')
  }
  const output = input.riggingPlan.outputContract
  const draft: LivingFrameRigActionPlanDraft = {
    contractVersion: LIVING_FRAME_RIG_ACTION_VERSION,
    actionClass: LIVING_FRAME_RIG_ACTION_CLASS,
    sourceBindings: {
      sceneId: input.riggingPlan.sourceBindings.sceneId,
      outputFrameId: input.riggingPlan.sourceBindings.outputFrameId,
      outputFrameDigestSha256:
        input.riggingPlan.sourceBindings.outputFrameDigestSha256,
      masterTimingPlanId:
        input.riggingPlan.sourceBindings.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        input.riggingPlan.sourceBindings.masterTimingPlanDigestSha256,
      riggingPlanVersion: LIVING_FRAME_RIGGING_V2_VERSION_LITERAL,
      riggingPlanDigestSha256: input.riggingPlan.planDigestSha256,
      startFrame: output.startFrame,
      endFrameExclusive: output.endFrameExclusive,
      framesCopiedFromMasterTiming: true,
    },
    narrativeActionId: input.narrativeActionId,
    narrativeActionSummary: input.narrativeActionSummary,
    finalPosePolicy: input.finalPosePolicy,
    tracks: structuredClone(input.tracks),
    initialPoseVerified: true,
    finalPoseSettlesOrRestores: true,
    onePrimaryActionAtATime: true,
    masterTimingOwnsEveryFrame: true,
    containsExecutableCodeCommandPathUrlEnvironmentOrCredential: false,
    authorityBoundary: AUTHORITY_BOUNDARY,
  }
  return {
    ...draft,
    actionDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameRigActionPlan(
  value: unknown,
  riggingPlan?: LivingFrameRiggingV2Plan,
): value is LivingFrameRigActionPlan {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'actionClass',
      'sourceBindings',
      'narrativeActionId',
      'narrativeActionSummary',
      'finalPosePolicy',
      'tracks',
      'initialPoseVerified',
      'finalPoseSettlesOrRestores',
      'onePrimaryActionAtATime',
      'masterTimingOwnsEveryFrame',
      'containsExecutableCodeCommandPathUrlEnvironmentOrCredential',
      'authorityBoundary',
      'actionDigestSha256',
    ])) return false
    const action = value as unknown as LivingFrameRigActionPlan
    const { actionDigestSha256, ...draft } = action
    if (
      action.contractVersion !== LIVING_FRAME_RIG_ACTION_VERSION
      || action.actionClass !== LIVING_FRAME_RIG_ACTION_CLASS
      || !SHA256.test(actionDigestSha256)
      || actionDigestSha256 !== sha256AuthorityValue(draft)
      || !SAFE_ID.test(action.narrativeActionId)
      || !SAFE_SUMMARY.test(action.narrativeActionSummary)
      || UNSAFE_TEXT.test(action.narrativeActionSummary)
      || !['restore_initial', 'settle_approved_pose'].includes(
        action.finalPosePolicy,
      )
      || !validateSourceBindings(action.sourceBindings)
      || !Array.isArray(action.tracks)
      || action.tracks.length < 1
      || action.tracks.length > 64
      || !action.tracks.every(validateTrack)
      || stableAuthorityStringify(action.authorityBoundary)
        !== stableAuthorityStringify(AUTHORITY_BOUNDARY)
      || action.initialPoseVerified !== true
      || action.finalPoseSettlesOrRestores !== true
      || action.onePrimaryActionAtATime !== true
      || action.masterTimingOwnsEveryFrame !== true
      || action.containsExecutableCodeCommandPathUrlEnvironmentOrCredential
        !== false
    ) return false
    if (!riggingPlan) return true
    if (!verifyLivingFrameRiggingV2Plan(riggingPlan)) return false
    if (
      action.sourceBindings.sceneId !== riggingPlan.sourceBindings.sceneId
      || action.sourceBindings.outputFrameId
        !== riggingPlan.sourceBindings.outputFrameId
      || action.sourceBindings.outputFrameDigestSha256
        !== riggingPlan.sourceBindings.outputFrameDigestSha256
      || action.sourceBindings.masterTimingPlanId
        !== riggingPlan.sourceBindings.masterTimingPlanId
      || action.sourceBindings.masterTimingPlanDigestSha256
        !== riggingPlan.sourceBindings.masterTimingPlanDigestSha256
      || action.sourceBindings.riggingPlanDigestSha256
        !== riggingPlan.planDigestSha256
      || action.sourceBindings.startFrame
        !== riggingPlan.outputContract.startFrame
      || action.sourceBindings.endFrameExclusive
        !== riggingPlan.outputContract.endFrameExclusive
    ) return false
    assertAction(riggingPlan, action.tracks, action.finalPosePolicy)
    return true
  } catch {
    return false
  }
}

const LIVING_FRAME_RIGGING_V2_VERSION_LITERAL =
  'living-frame-rigging-plan-v2' as const

function assertAction(
  riggingPlan: LivingFrameRiggingV2Plan,
  tracks: readonly LivingFrameRigActionTrack[],
  finalPosePolicy: 'restore_initial' | 'settle_approved_pose',
): void {
  if (!verifyLivingFrameRiggingV2Plan(riggingPlan)) {
    throw new Error('Living Frame rig action plan lineage is invalid.')
  }
  const boneIds = new Set(riggingPlan.bones.map((bone) => bone.boneId))
  const controlById = new Map(
    riggingPlan.controls.map((control) => [control.controlId, control]),
  )
  const trackIds = new Set<string>()
  let primaryCount = 0
  for (const [index, track] of tracks.entries()) {
    if (
      track.order !== index
      || trackIds.has(track.trackId)
      || track.keyframes.some((keyframe, keyframeIndex) =>
        keyframe.order !== keyframeIndex)
    ) {
      throw new Error('Living Frame rig action ordering is invalid.')
    }
    trackIds.add(track.trackId)
    if (track.role === 'primary') primaryCount += 1
    if (
      track.property === 'control_position_normalized'
      && !controlById.has(track.targetRefId)
    ) {
      throw new Error('Living Frame rig action control target is invalid.')
    }
    if (
      track.property === 'bone_rotation_degrees'
      && !boneIds.has(track.targetRefId)
    ) {
      throw new Error('Living Frame rig action bone target is invalid.')
    }
    if (
      track.property === 'mechanical_driver_value'
      && controlById.get(track.targetRefId)?.kind !== 'mechanical_driver'
    ) {
      throw new Error('Living Frame rig action driver target is invalid.')
    }
    assertKeyframes(
      track,
      riggingPlan.outputContract.startFrame,
      riggingPlan.outputContract.endFrameExclusive,
      finalPosePolicy,
    )
  }
  if (primaryCount !== 1) {
    throw new Error('Living Frame rig action must have one primary track.')
  }
}

function assertKeyframes(
  track: LivingFrameRigActionTrack,
  startFrame: number,
  endFrameExclusive: number,
  finalPosePolicy: 'restore_initial' | 'settle_approved_pose',
): void {
  const frames = track.keyframes.map((keyframe) => keyframe.frame)
  if (
    frames[0] !== startFrame
    || frames.at(-1) !== endFrameExclusive - 1
    || frames.some((frame, index) =>
      index > 0 && frame <= frames[index - 1]!)
  ) {
    throw new Error('Living Frame rig action frames are invalid.')
  }
  for (const keyframe of track.keyframes) {
    const pointProperty = track.property === 'control_position_normalized'
    if (
      pointProperty
        ? keyframe.pointValue === null || keyframe.scalarValue !== null
        : keyframe.scalarValue === null || keyframe.pointValue !== null
    ) {
      throw new Error('Living Frame rig action value shape is invalid.')
    }
  }
  if (
    finalPosePolicy === 'restore_initial'
    && stableAuthorityStringify(track.keyframes[0]?.pointValue
      ?? track.keyframes[0]?.scalarValue)
      !== stableAuthorityStringify(track.keyframes.at(-1)?.pointValue
        ?? track.keyframes.at(-1)?.scalarValue)
  ) {
    throw new Error('Living Frame rig action restoration is invalid.')
  }
}

function validateSourceBindings(
  value: LivingFrameRigActionPlan['sourceBindings'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'sceneId',
      'outputFrameId',
      'outputFrameDigestSha256',
      'masterTimingPlanId',
      'masterTimingPlanDigestSha256',
      'riggingPlanVersion',
      'riggingPlanDigestSha256',
      'startFrame',
      'endFrameExclusive',
      'framesCopiedFromMasterTiming',
    ])
    && SAFE_ID.test(value.sceneId)
    && SAFE_ID.test(value.outputFrameId)
    && SHA256.test(value.outputFrameDigestSha256)
    && SAFE_ID.test(value.masterTimingPlanId)
    && SHA256.test(value.masterTimingPlanDigestSha256)
    && value.riggingPlanVersion === LIVING_FRAME_RIGGING_V2_VERSION_LITERAL
    && SHA256.test(value.riggingPlanDigestSha256)
    && Number.isInteger(value.startFrame)
    && Number.isInteger(value.endFrameExclusive)
    && value.startFrame >= 0
    && value.endFrameExclusive > value.startFrame
    && value.framesCopiedFromMasterTiming === true
}

function validateTrack(
  value: LivingFrameRigActionTrack,
  index: number,
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'order',
      'trackId',
      'property',
      'targetRefId',
      'role',
      'keyframes',
    ])
    && value.order === index
    && SAFE_ID.test(value.trackId)
    && LIVING_FRAME_RIG_ACTION_TRACK_PROPERTIES.includes(value.property)
    && SAFE_ID.test(value.targetRefId)
    && ['primary', 'secondary'].includes(value.role)
    && Array.isArray(value.keyframes)
    && value.keyframes.length >= 2
    && value.keyframes.length <= 256
    && value.keyframes.every(validateKeyframe)

  function validateKeyframe(
    keyframe: unknown,
    keyframeIndex: number,
  ): boolean {
    if (
      !isRecord(keyframe)
      || !hasExactKeys(keyframe, [
        'order',
        'frame',
        'scalarValue',
        'pointValue',
        'interpolationToNext',
      ])
    ) return false
    const frame = keyframe.frame
    const scalarValue = keyframe.scalarValue
    const pointValue = keyframe.pointValue
    const interpolation = keyframe.interpolationToNext
    return keyframe.order === keyframeIndex
      && typeof frame === 'number'
      && Number.isInteger(frame)
      && frame >= 0
      && (scalarValue === null
        || (
          typeof scalarValue === 'number'
          && Number.isFinite(scalarValue)
          && scalarValue >= -10_000
          && scalarValue <= 10_000
        ))
      && validatePointValue(pointValue)
      && LIVING_FRAME_RIG_ACTION_INTERPOLATIONS.some(
        (candidate) => candidate === interpolation,
      )
  }
}

function validatePointValue(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value) || !hasExactKeys(value, ['x', 'y', 'z'])) return false
  const { x, y, z } = value
  return typeof x === 'number'
    && Number.isFinite(x)
    && x >= 0
    && x <= 1
    && typeof y === 'number'
    && Number.isFinite(y)
    && y >= 0
    && y <= 1
    && typeof z === 'number'
    && Number.isFinite(z)
    && z >= -1
    && z <= 1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}
