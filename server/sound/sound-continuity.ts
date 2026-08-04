import type { CanonicalSoundCue, SoundFrameRange } from './sound-contracts'
import { framesToSeconds, type TimelineRate } from '../edit-skills/core/timeline-rate'

export interface SoundContinuitySceneEvidence {
  sceneId: string
  range: SoundFrameRange
  acousticEnvironment?: string
  environmentChangeIntent?: 'same_environment' | 'deliberate_change' | 'unknown'
  roomToneOrAmbienceId?: string
  sourceAudioPresent: boolean
  dialogueImportance: 'none' | 'low' | 'medium' | 'high' | 'critical'
  musicContext: 'none' | 'bed' | 'accent' | 'foreground'
  foregroundPerspective?: 'close' | 'medium' | 'distant' | 'offscreen'
  backgroundPerspective?: 'close' | 'medium' | 'distant' | 'offscreen'
  intentionalSilence: boolean
  measuredLoudnessLufs?: number
  cueIdentityKeys: string[]
}

export interface SoundContinuityFinding {
  findingId: string
  category: 'ambience' | 'environment' | 'perspective' | 'repetition' | 'density' | 'silence' | 'loudness' | 'music_collision' | 'missing_evidence'
  severity: 'info' | 'warning' | 'needs_review' | 'blocking'
  sceneIds: string[]
  ranges: SoundFrameRange[]
  message: string
}

export interface SoundWholeVideoContinuityReport {
  schemaVersion: 'sound-continuity-report-v1'
  reportId: string
  timelineRate: TimelineRate
  sceneEvidence: SoundContinuitySceneEvidence[]
  cueDensityPerInterval: Array<{
    range: SoundFrameRange
    cueCount: number
    cuesPerMinute: number
  }>
  boundaryFindings: SoundContinuityFinding[]
  intentionalSilenceFindings: SoundContinuityFinding[]
  loudnessContinuityFindings: SoundContinuityFinding[]
  repeatedCueMaterialWarnings: SoundContinuityFinding[]
  unresolvedContinuityDependencies: string[]
  recommendedLocalizedRevisions: Array<{
    sceneIds: string[]
    range: SoundFrameRange
    recommendation: string
  }>
  status: 'passed' | 'warning' | 'needs_review' | 'blocked_missing_evidence'
  evidenceLevel: 'structured_scene_and_audio_metrics'
  wholeVideoReadOnly: true
}

export function analyzeWholeVideoSoundContinuity(input: {
  reportId: string
  timelineRate: TimelineRate
  scenes: SoundContinuitySceneEvidence[]
  cues: CanonicalSoundCue[]
  maximumCueDensityPerMinute: number
}): SoundWholeVideoContinuityReport {
  const scenes = [...input.scenes].sort((left, right) => left.range.startFrame - right.range.startFrame)
  const boundaryFindings: SoundContinuityFinding[] = []
  const silenceFindings: SoundContinuityFinding[] = []
  const loudnessFindings: SoundContinuityFinding[] = []
  const repetitionFindings: SoundContinuityFinding[] = []
  const unresolved = new Set<string>()

  for (const scene of scenes) {
    if (!scene.acousticEnvironment) unresolved.add(`missing_acoustic_environment:${scene.sceneId}`)
    if (!scene.roomToneOrAmbienceId && !scene.intentionalSilence) {
      unresolved.add(`missing_room_tone_or_ambience_identity:${scene.sceneId}`)
    }
    if (scene.intentionalSilence) {
      silenceFindings.push(finding('silence', 'info', [scene], 'Intentional emotional silence is preserved.'))
    }
  }
  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1]!
    const current = scenes[index]!
    const sameEnvironment = previous.acousticEnvironment &&
      previous.acousticEnvironment === current.acousticEnvironment
    if (sameEnvironment && previous.roomToneOrAmbienceId && !current.roomToneOrAmbienceId && !current.intentionalSilence) {
      boundaryFindings.push(finding('ambience', 'warning', [previous, current], 'Ambience disappears across a same-environment cut.'))
    }
    if (!sameEnvironment && current.environmentChangeIntent === 'same_environment') {
      boundaryFindings.push(finding('environment', 'needs_review', [previous, current], 'Environment evidence changes despite a same-environment intent.'))
    }
    if (!sameEnvironment && current.environmentChangeIntent === 'deliberate_change') {
      boundaryFindings.push(finding('environment', 'info', [previous, current], 'Deliberate acoustic environment change is documented.'))
    }
    if (previous.foregroundPerspective && current.foregroundPerspective &&
      previous.foregroundPerspective !== current.foregroundPerspective && sameEnvironment) {
      boundaryFindings.push(finding('perspective', 'warning', [previous, current], 'Foreground Sound perspective changes inside the same environment.'))
    }
    if (previous.measuredLoudnessLufs !== undefined && current.measuredLoudnessLufs !== undefined &&
      Math.abs(previous.measuredLoudnessLufs - current.measuredLoudnessLufs) > 6) {
      loudnessFindings.push(finding('loudness', 'warning', [previous, current], 'Adjacent scene loudness differs by more than 6 LU.'))
    }
    if (previous.musicContext === 'accent' && current.cueIdentityKeys.length > 0) {
      boundaryFindings.push(finding('music_collision', 'warning', [previous, current], 'Sound cue begins at a Music-accent boundary and requires collision review.'))
    }
  }

  const seenCueIdentities = new Map<string, SoundContinuitySceneEvidence>()
  for (const scene of scenes) {
    for (const identity of scene.cueIdentityKeys) {
      const prior = seenCueIdentities.get(identity)
      if (prior) repetitionFindings.push(finding('repetition', 'warning', [prior, scene], `Repeated cue/material identity: ${identity}.`))
      else seenCueIdentities.set(identity, scene)
    }
  }

  const density = scenes.map((scene) => {
    const cueCount = input.cues.filter((cue) =>
      cue.startFrame < scene.range.endFrameExclusive && cue.endFrameExclusive > scene.range.startFrame).length
    const minutes = Math.max(1 / 60, framesToSeconds(
      scene.range.endFrameExclusive - scene.range.startFrame,
      input.timelineRate,
    ) / 60)
    const cuesPerMinute = Number((cueCount / minutes).toFixed(3))
    if (cuesPerMinute > input.maximumCueDensityPerMinute) {
      boundaryFindings.push(finding('density', 'warning', [scene], 'Cue density exceeds the approved per-minute limit.'))
    }
    return { range: scene.range, cueCount, cuesPerMinute }
  })

  const findings = [...boundaryFindings, ...silenceFindings, ...loudnessFindings, ...repetitionFindings]
  const status = unresolved.size > 0 ? 'blocked_missing_evidence' as const
    : findings.some((item) => item.severity === 'needs_review') ? 'needs_review' as const
      : findings.some((item) => item.severity === 'warning') ? 'warning' as const : 'passed' as const
  const recommendedLocalizedRevisions = findings
    .filter((item) => item.severity === 'warning' || item.severity === 'needs_review')
    .map((item) => ({
      sceneIds: item.sceneIds,
      range: unionRanges(item.ranges),
      recommendation: recommendation(item.category),
    }))
  return {
    schemaVersion: 'sound-continuity-report-v1',
    reportId: input.reportId,
    timelineRate: input.timelineRate,
    sceneEvidence: scenes,
    cueDensityPerInterval: density,
    boundaryFindings,
    intentionalSilenceFindings: silenceFindings,
    loudnessContinuityFindings: loudnessFindings,
    repeatedCueMaterialWarnings: repetitionFindings,
    unresolvedContinuityDependencies: [...unresolved].sort(),
    recommendedLocalizedRevisions,
    status,
    evidenceLevel: 'structured_scene_and_audio_metrics',
    wholeVideoReadOnly: true,
  }
}

function finding(
  category: SoundContinuityFinding['category'],
  severity: SoundContinuityFinding['severity'],
  scenes: SoundContinuitySceneEvidence[],
  message: string,
): SoundContinuityFinding {
  return {
    findingId: `sound.continuity.${category}.${scenes.map((scene) => scene.sceneId).join('.')}`,
    category,
    severity,
    sceneIds: scenes.map((scene) => scene.sceneId),
    ranges: scenes.map((scene) => scene.range),
    message,
  }
}

function unionRanges(ranges: SoundFrameRange[]): SoundFrameRange {
  return {
    rangeId: `continuity.revision.${ranges.map((range) => range.rangeId).join('.')}`,
    startFrame: Math.min(...ranges.map((range) => range.startFrame)),
    endFrameExclusive: Math.max(...ranges.map((range) => range.endFrameExclusive)),
  }
}

function recommendation(category: SoundContinuityFinding['category']): string {
  if (category === 'ambience') return 'Restore or crossfade approved ambience only across the affected boundary.'
  if (category === 'repetition') return 'Replace or vary only the repeated affected cue.'
  if (category === 'density') return 'Remove lower-priority cues only inside the affected interval.'
  if (category === 'music_collision') return 'Move, reduce, or duck the affected Sound cue without modifying Music ownership.'
  if (category === 'loudness') return 'Normalize only the affected scene stem while preserving speech priority.'
  return 'Review and revise only the affected Sound ranges.'
}
