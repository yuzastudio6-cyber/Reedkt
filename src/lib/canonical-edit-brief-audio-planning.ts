import type {
  CanonicalEditBriefAudioPlanningInput,
} from '../types/edit-brief-authority'

export const CANONICAL_EDIT_BRIEF_AUDIO_PLANNING_SCHEMA_VERSION =
  'canonical-edit-brief-audio-planning-v1' as const

export const CANONICAL_EDIT_BRIEF_AUDIO_MIME_TYPES = [
  'audio/aac',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
] as const

export type CanonicalEditBriefAudioPlanningItem = {
  attachmentId: string
  markerId: string
  markerType: 'music' | 'sfx'
  markerTimeKind: 'point' | 'range'
  privateAssetId: string
  mimeType: (typeof CANONICAL_EDIT_BRIEF_AUDIO_MIME_TYPES)[number]
  startFrame: number
  endFrameExclusive: number
  sourceDurationFrames: number
  placementDurationFrames: number
  fillPolicy: 'loop_or_trim_to_window' | 'trim_without_loop'
  mixProfileId:
    | 'speech_safe_uploaded_music_bed_v1'
    | 'narration_protected_uploaded_sfx_v1'
}

export type CanonicalEditBriefAudioPlanningBinding = {
  schemaVersion: typeof CANONICAL_EDIT_BRIEF_AUDIO_PLANNING_SCHEMA_VERSION
  source: 'confirmed_edit_brief_audio_attachments'
  fps: number
  totalFrames: number
  items: CanonicalEditBriefAudioPlanningItem[]
  browserMediaExecutionAllowed: false
  providerExecutionAuthority: false
  workAuthority: false
  approvalAuthority: false
  runtimeAuthority: false
}

export type CanonicalEditBriefAudioPlanningBuildResult =
  | {
      ok: true
      binding?: CanonicalEditBriefAudioPlanningBinding
    }
  | {
      ok: false
      error: string
    }

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const AUDIO_MIME_TYPES = new Set<string>(CANONICAL_EDIT_BRIEF_AUDIO_MIME_TYPES)
const MAX_AUDIO_SECONDS = 60 * 60
const MAX_ITEMS = 500

export function buildCanonicalEditBriefAudioPlanningBinding(input: {
  audioInputs?: readonly CanonicalEditBriefAudioPlanningInput[]
  fps: number
  totalFrames: number
}): CanonicalEditBriefAudioPlanningBuildResult {
  const audioInputs = input.audioInputs ?? []
  if (audioInputs.length === 0) return { ok: true }
  if (
    audioInputs.length > MAX_ITEMS
    || !Number.isFinite(input.fps)
    || input.fps <= 0
    || input.fps > 240
    || !Number.isSafeInteger(input.totalFrames)
    || input.totalFrames <= 0
  ) {
    return invalid()
  }

  const ordered = [...audioInputs].sort((left, right) =>
    left.startSeconds - right.startSeconds
    || left.markerId.localeCompare(right.markerId)
    || left.attachmentId.localeCompare(right.attachmentId)
  )
  const markerIds = new Set<string>()
  const attachmentIds = new Set<string>()
  const items: CanonicalEditBriefAudioPlanningItem[] = []

  for (const entry of ordered) {
    if (
      !SAFE_ID.test(entry.attachmentId)
      || !SAFE_ID.test(entry.markerId)
      || !SAFE_ID.test(entry.privateAssetId)
      || attachmentIds.has(entry.attachmentId)
      || markerIds.has(entry.markerId)
      || (entry.markerType !== 'music' && entry.markerType !== 'sfx')
      || (entry.markerTimeKind !== 'point' && entry.markerTimeKind !== 'range')
      || !AUDIO_MIME_TYPES.has(entry.mimeType)
      || !Number.isFinite(entry.startSeconds)
      || entry.startSeconds < 0
      || !Number.isFinite(entry.durationSeconds)
      || entry.durationSeconds <= 0
      || entry.durationSeconds > MAX_AUDIO_SECONDS
      || (entry.markerTimeKind === 'range' && (
        !Number.isFinite(entry.endSeconds)
        || Number(entry.endSeconds) <= entry.startSeconds
      ))
      || (entry.markerTimeKind === 'point' && entry.endSeconds !== undefined)
    ) {
      return invalid()
    }

    const startFrame = Math.round(entry.startSeconds * input.fps)
    const sourceDurationFrames = Math.max(
      1,
      Math.round(entry.durationSeconds * input.fps),
    )
    if (startFrame < 0 || startFrame >= input.totalFrames) return invalid()

    const rangeEndFrame = entry.endSeconds === undefined
      ? undefined
      : Math.max(startFrame + 1, Math.round(entry.endSeconds * input.fps))
    if (rangeEndFrame !== undefined && rangeEndFrame > input.totalFrames) {
      return invalid()
    }

    const endFrameExclusive = entry.markerType === 'music'
      ? rangeEndFrame ?? Math.min(input.totalFrames, startFrame + sourceDurationFrames)
      : Math.min(
          rangeEndFrame ?? input.totalFrames,
          startFrame + sourceDurationFrames,
        )
    if (endFrameExclusive <= startFrame) return invalid()

    markerIds.add(entry.markerId)
    attachmentIds.add(entry.attachmentId)
    items.push({
      attachmentId: entry.attachmentId,
      markerId: entry.markerId,
      markerType: entry.markerType,
      markerTimeKind: entry.markerTimeKind,
      privateAssetId: entry.privateAssetId,
      mimeType: entry.mimeType,
      startFrame,
      endFrameExclusive,
      sourceDurationFrames,
      placementDurationFrames: endFrameExclusive - startFrame,
      fillPolicy: entry.markerType === 'music'
        ? 'loop_or_trim_to_window'
        : 'trim_without_loop',
      mixProfileId: entry.markerType === 'music'
        ? 'speech_safe_uploaded_music_bed_v1'
        : 'narration_protected_uploaded_sfx_v1',
    })
  }

  return {
    ok: true,
    binding: {
      schemaVersion: CANONICAL_EDIT_BRIEF_AUDIO_PLANNING_SCHEMA_VERSION,
      source: 'confirmed_edit_brief_audio_attachments',
      fps: input.fps,
      totalFrames: input.totalFrames,
      items,
      browserMediaExecutionAllowed: false,
      providerExecutionAuthority: false,
      workAuthority: false,
      approvalAuthority: false,
      runtimeAuthority: false,
    },
  }
}

function invalid(): CanonicalEditBriefAudioPlanningBuildResult {
  return {
    ok: false,
    error: 'Refresh and reconfirm the private Music or Sound effect attachment before planning.',
  }
}
