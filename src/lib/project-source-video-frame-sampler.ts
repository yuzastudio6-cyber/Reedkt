import type {
  ProjectEditBriefSampledFrameReference,
  ProjectEditBriefSampledFrameRole,
} from '../types/project-edit-brief-visual-context'
import { PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS } from '../types/project-edit-brief-visual-context'
import type { ProjectEditBriefMarkerRecord } from '../types/project-edit-brief'

export const PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS = {
  defaultMaxFrames: 5,
  absoluteMaxFrames: 9,
  maxFrameWidth: 512,
  jpegQuality: 0.72,
  maxFrameBytes: 120_000,
  maxTotalBytes: 850_000,
} as const

export interface ProjectSourceVideoFrameSamplePlanItem {
  sampledAtSeconds: number
  role: ProjectEditBriefSampledFrameRole
}

export interface ProjectSourceVideoFrameSampleResult {
  ok: boolean
  frames: ProjectEditBriefSampledFrameReference[]
  warnings: string[]
}

function clampSeconds(value: number, durationSeconds?: number): number {
  const upper = typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) ? durationSeconds : Number.POSITIVE_INFINITY
  return Math.max(0, Math.min(upper, value))
}

function frameId(markerId: string, role: string, sampledAtSeconds: number): string {
  return `marker-frame-${markerId}-${role}-${Math.round(sampledAtSeconds * 1000)}`
}

function approximateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

function uniquePlan(items: ProjectSourceVideoFrameSamplePlanItem[]): ProjectSourceVideoFrameSamplePlanItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.role}:${item.sampledAtSeconds.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function createProjectSourceVideoFrameSamplePlan(input: {
  marker: Pick<ProjectEditBriefMarkerRecord, 'timeMode' | 'startTimeSeconds' | 'endTimeSeconds'>
  durationSeconds?: number
  maxFrames?: number
}): ProjectSourceVideoFrameSamplePlanItem[] {
  const maxFrames = Math.max(1, Math.min(input.maxFrames ?? PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.defaultMaxFrames, PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.absoluteMaxFrames))
  const start = clampSeconds(input.marker.startTimeSeconds, input.durationSeconds)
  if (input.marker.timeMode === 'range') {
    const end = clampSeconds(input.marker.endTimeSeconds ?? input.marker.startTimeSeconds, input.durationSeconds)
    const orderedStart = Math.min(start, end)
    const orderedEnd = Math.max(start, end)
    const midpoint = orderedStart + ((orderedEnd - orderedStart) / 2)
    return uniquePlan([
      { role: 'range_start', sampledAtSeconds: orderedStart },
      { role: 'range_midpoint', sampledAtSeconds: midpoint },
      { role: 'range_end', sampledAtSeconds: orderedEnd },
    ]).slice(0, maxFrames)
  }
  return uniquePlan([
    { role: 'point_before', sampledAtSeconds: clampSeconds(start - 2, input.durationSeconds) },
    { role: 'point_marker', sampledAtSeconds: start },
    { role: 'point_after', sampledAtSeconds: clampSeconds(start + 2, input.durationSeconds) },
  ]).slice(0, maxFrames)
}

function waitForVideoAtTime(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', done)
      video.removeEventListener('loadeddata', done)
      video.removeEventListener('timeupdate', done)
      window.setTimeout(resolve, 0)
    }
    video.addEventListener('seeked', done, { once: true })
    video.addEventListener('loadeddata', done, { once: true })
    video.addEventListener('timeupdate', done, { once: true })
    try {
      video.currentTime = seconds
    } catch {
      done()
    }
    window.setTimeout(done, 120)
  })
}

function canvasSize(video: HTMLVideoElement): { width: number; height: number } {
  const sourceWidth = video.videoWidth || 640
  const sourceHeight = video.videoHeight || 360
  const scale = Math.min(1, PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.maxFrameWidth / Math.max(1, sourceWidth))
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  }
}

async function sampleFrame(input: {
  markerId: string
  planItem: ProjectSourceVideoFrameSamplePlanItem
  video: HTMLVideoElement
}): Promise<ProjectEditBriefSampledFrameReference | undefined> {
  await waitForVideoAtTime(input.video, input.planItem.sampledAtSeconds)
  const size = canvasSize(input.video)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return undefined
  try {
    context.drawImage(input.video, 0, 0, size.width, size.height)
  } catch {
    return undefined
  }
  const dataUrl = canvas.toDataURL('image/jpeg', PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.jpegQuality)
  const approximateByteSize = approximateDataUrlBytes(dataUrl)
  if (!dataUrl.startsWith('data:image/jpeg') || approximateByteSize > PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.maxFrameBytes) {
    return undefined
  }
  return {
    ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
    id: frameId(input.markerId, input.planItem.role, input.planItem.sampledAtSeconds),
    markerId: input.markerId,
    sampledAtSeconds: input.planItem.sampledAtSeconds,
    role: input.planItem.role,
    dataUrl,
    mimeType: 'image/jpeg',
    width: size.width,
    height: size.height,
    approximateByteSize,
    noRawFramePersistence: true,
  }
}

export async function sampleProjectSourceVideoFramesForMarker(input: {
  marker: ProjectEditBriefMarkerRecord
  video: HTMLVideoElement
  durationSeconds?: number
  maxFrames?: number
}): Promise<ProjectSourceVideoFrameSampleResult> {
  const plan = createProjectSourceVideoFrameSamplePlan({
    marker: input.marker,
    durationSeconds: input.durationSeconds ?? (Number.isFinite(input.video.duration) ? input.video.duration : undefined),
    maxFrames: input.maxFrames,
  })
  const originalTime = Number.isFinite(input.video.currentTime) ? input.video.currentTime : 0
  const frames: ProjectEditBriefSampledFrameReference[] = []
  const warnings: string[] = []
  let totalBytes = 0

  for (const planItem of plan) {
    const frame = await sampleFrame({
      markerId: input.marker.id,
      planItem,
      video: input.video,
    })
    if (!frame) {
      warnings.push(`Frame sample at ${Math.round(planItem.sampledAtSeconds)}s could not be captured safely.`)
      continue
    }
    if (totalBytes + frame.approximateByteSize > PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.maxTotalBytes) {
      warnings.push('Frame sampling stopped before exceeding the visual context payload cap.')
      break
    }
    frames.push(frame)
    totalBytes += frame.approximateByteSize
  }

  try {
    input.video.currentTime = originalTime
  } catch {
    warnings.push('Video playhead could not be restored after frame sampling.')
  }

  return {
    ok: frames.length > 0,
    frames,
    warnings: [
      ...warnings,
      'Sampled frames are request-only data URLs and are not persisted in marker metadata.',
    ],
  }
}
