import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  buildOfflineRemotionMotionStudioAnimaticRequest,
  buildOfflineRemotionMotionStudioLayeredRequest,
  buildOfflineRemotionMotionStudioRouteDrawRequest,
  isMotionStudioScenePreviewPayload,
  validateOfflineRemotionMotionStudioAnimaticPlanningPayload,
  validateOfflineRemotionMotionStudioLayeredPlanningPayload,
  validateOfflineRemotionMotionStudioRouteDrawPlanningPayload,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution'
import type {
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import type { CanonicalStorytellingStyleAuthority } from '../validation/canonical-storytelling-style-authority-schemas'
import { sha256AuthorityValue, stableAuthorityStringify } from '../services/private-edit-authority-store'

export const CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION =
  'canonical-motion-studio-remotion-preview-binding-v1' as const
export const CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION =
  'render_approved_motion_studio_preview' as const

export const CANONICAL_MOTION_STUDIO_REMOTION_PROFILE_IDS = [
  'motion_studio_scene_preview_v1',
  'motion_studio_native_layered_scene_v1',
  'motion_studio_prepared_script_animatic_v1',
  'motion_studio_deterministic_route_draw_v1',
] as const

export type CanonicalMotionStudioRemotionProfileId =
  (typeof CANONICAL_MOTION_STUDIO_REMOTION_PROFILE_IDS)[number]

const safeIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const versionReferenceSchema = z.object({
  artifactId: safeIdentity,
  versionId: safeIdentity,
  versionNumber: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contentDigest: sha256,
  state: z.enum(['approved', 'locked']),
}).strict()

export const canonicalMotionStudioRemotionPreviewBindingSchema = z.object({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION),
  sourceAuthority: z.literal('motion_studio_storytelling_compiler'),
  evidenceClass: z.literal('controlled_local_content_addressed_non_promotable'),
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  productionId: safeIdentity,
  compositionProfileId: z.enum(CANONICAL_MOTION_STUDIO_REMOTION_PROFILE_IDS),
  canonicalStyleComponentDigest: sha256,
  styleSelectionDigest: sha256,
  motionDna: versionReferenceSchema.omit({ state: true }),
  referenceContracts: z.array(versionReferenceSchema.omit({ state: true })).max(32),
  sourceAuditDigests: z.array(sha256).max(32),
  calibrationPlan: z.object({
    id: safeIdentity,
    digest: sha256,
  }).strict(),
  internalCostEnvelope: z.object({
    estimateId: safeIdentity,
    digest: sha256,
  }).strict(),
  preparedScript: versionReferenceSchema,
  sceneDocuments: z.array(versionReferenceSchema).min(1).max(8),
  narrationAuthorityDigest: sha256.optional(),
  timingAuthorityDigest: sha256,
  confirmedOutputFrame: z.object({
    width: z.number().int().positive().max(16_384),
    height: z.number().int().positive().max(16_384),
    fps: z.number().positive().max(240),
  }).strict(),
  previewFrame: z.object({
    width: z.number().int().positive().max(1_280),
    height: z.number().int().positive().max(720),
    fps: z.union([z.literal(24), z.literal(30)]),
  }).strict(),
  sourceRepositoryReverified: z.literal(false),
  privateInternalControlledExecutionOnly: z.literal(true),
  providerExecutionAuthorized: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  productionReady: z.literal(false),
  bindingHash: sha256,
}).strict().superRefine((binding, context) => {
  const unsigned = { ...binding } as Record<string, unknown>
  delete unsigned.bindingHash
  if (sha256AuthorityValue(unsigned) !== binding.bindingHash) {
    context.addIssue({ code: 'custom', path: ['bindingHash'], message: 'Motion Studio preview binding hash is invalid.' })
  }
  const sceneKeys = binding.sceneDocuments.map((reference) =>
    `${reference.artifactId}\u0000${reference.versionId}\u0000${reference.versionNumber}`)
  if (new Set(sceneKeys).size !== sceneKeys.length) {
    context.addIssue({ code: 'custom', path: ['sceneDocuments'], message: 'SceneDocument versions must be unique.' })
  }
  const referenceKeys = binding.referenceContracts.map((reference) =>
    `${reference.artifactId}\u0000${reference.versionId}\u0000${reference.versionNumber}`)
  if (new Set(referenceKeys).size !== referenceKeys.length) {
    context.addIssue({ code: 'custom', path: ['referenceContracts'], message: 'Reference Contract versions must be unique.' })
  }
  if (new Set(binding.sourceAuditDigests).size !== binding.sourceAuditDigests.length) {
    context.addIssue({ code: 'custom', path: ['sourceAuditDigests'], message: 'Source-audit digests must be unique.' })
  }
  if (
    binding.compositionProfileId === 'motion_studio_prepared_script_animatic_v1' &&
    binding.narrationAuthorityDigest === undefined
  ) {
    context.addIssue({ code: 'custom', path: ['narrationAuthorityDigest'], message: 'Animatic preview requires narration authority.' })
  }
  if (
    binding.compositionProfileId !== 'motion_studio_prepared_script_animatic_v1' &&
    binding.narrationAuthorityDigest !== undefined
  ) {
    context.addIssue({ code: 'custom', path: ['narrationAuthorityDigest'], message: 'Only the animatic profile may bind narration.' })
  }
  if (
    binding.previewFrame.width * binding.confirmedOutputFrame.height !==
      binding.previewFrame.height * binding.confirmedOutputFrame.width
  ) {
    context.addIssue({ code: 'custom', path: ['previewFrame'], message: 'Private preview and confirmed output frame must have the same aspect ratio.' })
  }
})

export type CanonicalMotionStudioRemotionPreviewBinding = z.infer<
  typeof canonicalMotionStudioRemotionPreviewBindingSchema
>

export interface CanonicalMotionStudioRemotionProfileAuthority {
  profileId: CanonicalMotionStudioRemotionProfileId
  dependencyCount: 0 | 1
  dependencyContentType?: 'image/png' | 'audio/wav'
  maximumDependencyBytes?: number
  width: number
  height: number
  fps: 24 | 30
  durationFrames: number
  planningPayloadHash: string
}

interface MotionStudioWorkItemShape {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  expectedOutputs: Array<{
    outputKey: string
    assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  required: boolean
}

export function resolveCanonicalMotionStudioRemotionProfile(
  value: unknown,
): CanonicalMotionStudioRemotionProfileAuthority | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const rawProfileId = (value as Record<string, unknown>).compositionProfileId
  if (!(CANONICAL_MOTION_STUDIO_REMOTION_PROFILE_IDS as readonly unknown[]).includes(rawProfileId)) {
    return undefined
  }
  const profileId = rawProfileId as CanonicalMotionStudioRemotionProfileId
  let payload: { width: number; height: number; fps: 24 | 30; durationFrames: number }
  let dependencyCount: 0 | 1
  let dependencyContentType: CanonicalMotionStudioRemotionProfileAuthority['dependencyContentType']
  let maximumDependencyBytes: number | undefined
  if (profileId === 'motion_studio_scene_preview_v1') {
    const request = validateOfflineRemotionRenderRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion',
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: value,
    })
    if (!isMotionStudioScenePreviewPayload(request.payload)) {
      throw invalid('Motion Studio scene preview profile did not retain its exact request identity.')
    }
    payload = request.payload
    dependencyCount = 0
  } else if (profileId === 'motion_studio_native_layered_scene_v1') {
    payload = validateOfflineRemotionMotionStudioLayeredPlanningPayload(value)
    dependencyCount = 1
    dependencyContentType = 'image/png'
    maximumDependencyBytes = 1024 * 1024
  } else if (profileId === 'motion_studio_prepared_script_animatic_v1') {
    payload = validateOfflineRemotionMotionStudioAnimaticPlanningPayload(value)
    dependencyCount = 1
    dependencyContentType = 'audio/wav'
    maximumDependencyBytes = 16 * 1024 * 1024
  } else {
    payload = validateOfflineRemotionMotionStudioRouteDrawPlanningPayload(value)
    dependencyCount = 1
    dependencyContentType = 'image/png'
    maximumDependencyBytes = 8 * 1024 * 1024
  }
  return {
    profileId,
    dependencyCount,
    ...(dependencyContentType ? { dependencyContentType } : {}),
    ...(maximumDependencyBytes ? { maximumDependencyBytes } : {}),
    width: payload.width,
    height: payload.height,
    fps: payload.fps,
    durationFrames: payload.durationFrames,
    planningPayloadHash: sha256AuthorityValue(payload),
  }
}

export function assertCanonicalMotionStudioRemotionWorkItem(
  workItem: MotionStudioWorkItemShape,
  profile = resolveCanonicalMotionStudioRemotionProfile(
    workItem.executionInput.structuredPayload,
  ),
): CanonicalMotionStudioRemotionProfileAuthority | undefined {
  if (!profile) return undefined
  const binding = parseBinding(workItem.executionInput.motionStudioStorytellingAuthority)
  if (
    workItem.workItemType !== 'render_remotion_preview' ||
    workItem.workerClass !== 'render_worker' ||
    workItem.executionInput.operation !== CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION ||
    workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'remotion' ||
    workItem.sourceSequenceItemIds.length !== 0 ||
    workItem.sourceCleanupDecisionIds.length !== 0 ||
    workItem.dependencyKeys.length !== profile.dependencyCount ||
    workItem.expectedOutputs.length !== 1 ||
    workItem.expectedOutputs[0]?.assetRole !== 'preview' ||
    workItem.expectedOutputs[0]?.contentType !== 'video/mp4' ||
    workItem.expectedOutputs[0]?.required !== true ||
    workItem.expectedOutputs[0]?.previewPlaceholderAllowed === true ||
    workItem.required !== true ||
    binding.compositionProfileId !== profile.profileId ||
    stableAuthorityStringify(binding.previewFrame) !== stableAuthorityStringify({
      width: profile.width,
      height: profile.height,
      fps: profile.fps,
    })
  ) {
    throw invalid('Motion Studio Remotion preview lost its exact profile, work-item, dependency, or output authority.', {
      workItemKey: workItem.workItemKey,
      compositionProfileId: profile.profileId,
    })
  }
  return profile
}

export function assertCanonicalMotionStudioRemotionPlanAuthority(input: {
  components: CanonicalPlanComponentsInput
  workItems: readonly CanonicalWorkItemInput[]
}): void {
  const motionItems = input.workItems.flatMap((workItem) => {
    const profile = assertCanonicalMotionStudioRemotionWorkItem(workItem)
    return profile ? [{ workItem, profile }] : []
  })
  if (motionItems.length === 0) return
  const style = input.components.motionStudioStorytellingStyleAuthority
  if (!style) throw invalid('Motion Studio Remotion work requires the canonical Storytelling style component.')
  const timingAuthorityDigest = canonicalMotionStudioTimingAuthorityDigest(input.components)
  const styleComponentDigest = sha256AuthorityValue(style)
  for (const { workItem, profile } of motionItems) {
    const binding = parseBinding(workItem.executionInput.motionStudioStorytellingAuthority)
    assertBindingMatchesStyle({ binding, style, styleComponentDigest, timingAuthorityDigest })
    if (
      binding.confirmedOutputFrame.width !== input.components.confirmedSettings.outputFrame.width ||
      binding.confirmedOutputFrame.height !== input.components.confirmedSettings.outputFrame.height ||
      binding.confirmedOutputFrame.fps !== input.components.confirmedSettings.outputFrame.fps ||
      binding.compositionProfileId !== profile.profileId
    ) {
      throw invalid('Motion Studio preview does not match the exact confirmed frame or profile authority.', {
        workItemKey: workItem.workItemKey,
      })
    }
  }
}

export function assertCanonicalMotionStudioRemotionDependencyBindings(
  workItems: readonly MotionStudioWorkItemShape[],
): void {
  const byKey = new Map(workItems.map((workItem) => [workItem.workItemKey, workItem]))
  for (const workItem of workItems) {
    const profile = assertCanonicalMotionStudioRemotionWorkItem(workItem)
    if (!profile || profile.dependencyCount === 0) continue
    const dependency = byKey.get(workItem.dependencyKeys[0]!)
    if (
      !dependency || dependency.expectedOutputs.length !== 1 ||
      dependency.expectedOutputs[0]?.required !== true ||
      dependency.expectedOutputs[0]?.previewPlaceholderAllowed === true ||
      dependency.expectedOutputs[0]?.contentType !== profile.dependencyContentType ||
      dependency.expectedOutputs[0]?.assetRole === 'final'
    ) {
      throw invalid('Motion Studio preview dependency must resolve to one exact required QA-eligible private artifact class.', {
        workItemKey: workItem.workItemKey,
        dependencyKey: workItem.dependencyKeys[0],
        requiredContentType: profile.dependencyContentType,
      })
    }
  }
}

export function buildCanonicalMotionStudioRemotionExecutionRequest(input: {
  planningPayload: unknown
  dependency?: { contentType: 'image/png' | 'audio/wav'; bytes: Buffer; sha256: string }
}): OfflineRemotionRenderRequest {
  const profile = resolveCanonicalMotionStudioRemotionProfile(input.planningPayload)
  if (!profile) throw invalid('Canonical Motion Studio Remotion profile is missing.')
  if (profile.dependencyCount === 0) {
    if (input.dependency) throw invalid('Scene preview cannot receive an unapproved dependency artifact.')
    return validateOfflineRemotionRenderRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion',
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: input.planningPayload,
    })
  }
  if (!input.dependency || input.dependency.contentType !== profile.dependencyContentType) {
    throw invalid('Motion Studio Remotion dependency artifact class is missing or mismatched.')
  }
  if (profile.profileId === 'motion_studio_native_layered_scene_v1') {
    return buildOfflineRemotionMotionStudioLayeredRequest({
      planningPayload: input.planningPayload,
      subject: { mimeType: 'image/png', bytes: input.dependency.bytes, sha256: input.dependency.sha256 },
    })
  }
  if (profile.profileId === 'motion_studio_prepared_script_animatic_v1') {
    return buildOfflineRemotionMotionStudioAnimaticRequest({
      planningPayload: input.planningPayload,
      narration: { mimeType: 'audio/wav', bytes: input.dependency.bytes, sha256: input.dependency.sha256 },
    })
  }
  return buildOfflineRemotionMotionStudioRouteDrawRequest({
    planningPayload: input.planningPayload,
    keyframe: { mimeType: 'image/png', bytes: input.dependency.bytes, sha256: input.dependency.sha256 },
  })
}

export function canonicalMotionStudioTimingAuthorityDigest(
  components: CanonicalPlanComponentsInput,
): string {
  return sha256AuthorityValue({
    masterTimingPlan: components.masterTimingPlan,
    captionVisualCueTimingPlan: components.captionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: components.soundSyncTransitionTimingPlan,
    timingValidationPlan: components.timingValidationPlan,
    timingSummary: components.timingSummary,
  })
}

function parseBinding(value: unknown): CanonicalMotionStudioRemotionPreviewBinding {
  const parsed = canonicalMotionStudioRemotionPreviewBindingSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('Canonical Motion Studio Storytelling preview binding is invalid.', {
      validation: parsed.error.flatten(),
    })
  }
  return parsed.data
}

function assertBindingMatchesStyle(input: {
  binding: CanonicalMotionStudioRemotionPreviewBinding
  style: CanonicalStorytellingStyleAuthority
  styleComponentDigest: string
  timingAuthorityDigest: string
}): void {
  const { binding, style } = input
  const styleDna = style.styleSelection.motionDnaVersion
  if (
    binding.workspaceId !== style.workspaceId ||
    binding.projectId !== style.projectId ||
    binding.editSessionId !== style.editSessionId ||
    binding.productionId !== style.productionId ||
    binding.canonicalStyleComponentDigest !== input.styleComponentDigest ||
    binding.styleSelectionDigest !== style.styleSelection.selectionDigest ||
    binding.motionDna.artifactId !== styleDna.artifactId ||
    binding.motionDna.versionId !== styleDna.versionId ||
    binding.motionDna.versionNumber !== styleDna.versionNumber ||
    binding.motionDna.contentDigest !== styleDna.contentDigest ||
    stableAuthorityStringify(binding.referenceContracts) !==
      stableAuthorityStringify(style.styleSelection.referenceContractVersions) ||
    stableAuthorityStringify(binding.sourceAuditDigests) !==
      stableAuthorityStringify(style.styleSelection.sourceAuditDigests) ||
    binding.calibrationPlan.id !== style.calibrationPlan.id ||
    binding.calibrationPlan.digest !== style.calibrationPlan.planDigest ||
    binding.internalCostEnvelope.estimateId !== style.internalCostEnvelope.estimateId ||
    binding.internalCostEnvelope.digest !== style.internalCostEnvelope.estimateDigest ||
    binding.timingAuthorityDigest !== input.timingAuthorityDigest
  ) throw invalid('Motion Studio preview binding does not match the canonical Storytelling style, timing, or cost authority.')
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_motion_studio_remotion_preview_authority',
    ...details,
  })
}
