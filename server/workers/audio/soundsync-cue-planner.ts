import type { CaptionSegment } from '../captions'
import type { SmartCutPlan } from '../smart-cut'
import type { TimelineBuildResult } from '../timeline'
import type { AudioAnalysisSummary, SoundSyncCue, SoundSyncCuePlan } from './audio-foundation-types'

export function buildSoundSyncCuePlan(input: {
  audioAnalysis: AudioAnalysisSummary
  captionSegments?: CaptionSegment[]
  smartCutPlan?: SmartCutPlan
  timelineResult?: TimelineBuildResult
  visualCueTimes?: number[]
}): SoundSyncCuePlan {
  const cues: SoundSyncCue[] = []

  for (const [index, remove] of (input.smartCutPlan?.removeSegments ?? []).entries()) {
    cues.push({
      cueId: `soundsync-cut-${index + 1}`,
      cueType: 'cut',
      timeSeconds: remove.startSeconds,
      reason: `Smart cut removal candidate: ${remove.reason}`,
      confidence: remove.confidence,
      source: 'smart_cut',
    })
  }

  for (const [index, caption] of (input.captionSegments ?? []).slice(0, 8).entries()) {
    cues.push({
      cueId: `soundsync-caption-${index + 1}`,
      cueType: 'caption_emphasis',
      timeSeconds: caption.startSeconds,
      durationSeconds: caption.endSeconds - caption.startSeconds,
      reason: 'Caption timing can anchor subtle emphasis; no SFX generation occurs in M9.',
      confidence: 0.72,
      source: 'caption',
    })
  }

  for (const [index, silence] of input.audioAnalysis.silenceSegments.entries()) {
    cues.push({
      cueId: `soundsync-pause-${index + 1}`,
      cueType: 'emotional_pause',
      timeSeconds: silence.startSeconds,
      durationSeconds: silence.endSeconds - silence.startSeconds,
      reason: 'Silence/emotional pause is preserved for voice-first timing unless approved plan says otherwise.',
      confidence: silence.confidence ?? 0.6,
      source: 'energy_placeholder',
    })
  }

  for (const [index, clip] of (input.timelineResult?.timelineManifest?.clips ?? []).slice(0, 8).entries()) {
    cues.push({
      cueId: `soundsync-timeline-${index + 1}`,
      cueType: 'transition',
      timeSeconds: clip.timelineRange.startSeconds,
      reason: 'Timeline clip boundary can become a future transition/SFX timing anchor.',
      confidence: 0.7,
      source: 'timeline',
    })
  }

  for (const [index, timeSeconds] of (input.visualCueTimes ?? []).entries()) {
    cues.push({
      cueId: `soundsync-visual-${index + 1}`,
      cueType: 'visual_reveal',
      timeSeconds,
      reason: 'Visual cue reference can anchor future SoundSync cue planning.',
      confidence: 0.68,
      source: 'visual_cue',
    })
  }

  return {
    cues: dedupeCues(cues).sort((a, b) => a.timeSeconds - b.timeSeconds),
    beatDetectionRan: false,
    warnings: ['Milestone 9 does not claim beat detection; cues are timing metadata from available evidence only.'],
  }
}

function dedupeCues(cues: SoundSyncCue[]): SoundSyncCue[] {
  const seen = new Set<string>()
  return cues.filter((cue) => {
    const key = `${cue.cueType}:${cue.timeSeconds.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
