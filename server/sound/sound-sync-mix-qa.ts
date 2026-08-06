import type {
  CanonicalSoundCue,
  SoundFrameRange,
  SoundMixAutomation,
} from './sound-contracts'
import {
  framesToSeconds,
  rationalSecondsToFrames,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'

function overlaps(
  startFrame: number,
  endFrameExclusive: number,
  range: SoundFrameRange,
): boolean {
  return startFrame < range.endFrameExclusive && endFrameExclusive > range.startFrame
}

export function createSoundMixAutomation(input: {
  cue: CanonicalSoundCue
  protectedSpeechRanges: SoundFrameRange[]
  timelineRate: TimelineRate
  musicContextPresent: boolean
  approvedMusicAutomation: Array<'duck' | 'fade' | 'collision_avoidance'>
}): SoundMixAutomation {
  const speechRanges = input.protectedSpeechRanges.filter((range) =>
    overlaps(input.cue.startFrame, input.cue.endFrameExclusive, range),
  )
  const roleGain: Record<CanonicalSoundCue['layerRole'], number> = {
    background_texture: -24,
    subtle_support: -18,
    foreground_action: -12,
    hero_impact: -8,
    transition_accent: -14,
    room_tone: -28,
    repair_layer: -20,
  }
  const distance = input.cue.layerRole === 'background_texture' || input.cue.layerRole === 'room_tone'
    ? 'distant'
    : input.cue.layerRole === 'hero_impact'
      ? 'close'
      : 'medium'
  const fadeFrames = Math.max(1, rationalSecondsToFrames({
    secondsNumerator: 1, secondsDenominator: 25, rate: input.timelineRate,
    rounding: 'nearest_half_up',
  }))
  const baseGainDb = roleGain[input.cue.layerRole]
  const duckingDb = speechRanges.length > 0 ? -9 : 0
  const musicInteractionPolicy = input.musicContextPresent &&
    input.approvedMusicAutomation.includes('collision_avoidance')
    ? 'avoid_accents'
    : 'none'

  return {
    cueId: input.cue.cueId,
    baseGainDb,
    gainEnvelope: [
      { frame: input.cue.startFrame, gainDb: baseGainDb - 18 },
      { frame: input.cue.startFrame + fadeFrames, gainDb: baseGainDb + duckingDb },
      { frame: Math.max(input.cue.startFrame + fadeFrames, input.cue.endFrameExclusive - fadeFrames), gainDb: baseGainDb + duckingDb },
      { frame: input.cue.endFrameExclusive, gainDb: baseGainDb - 18 },
    ],
    fadeInFrames: fadeFrames,
    fadeOutFrames: fadeFrames,
    dialogueDuckingDb: duckingDb,
    duckAttackFrames: Math.max(1, rationalSecondsToFrames({
      secondsNumerator: 3, secondsDenominator: 100, rate: input.timelineRate,
      rounding: 'nearest_half_up',
    })),
    duckReleaseFrames: Math.max(1, rationalSecondsToFrames({
      secondsNumerator: 4, secondsDenominator: 25, rate: input.timelineRate,
      rounding: 'nearest_half_up',
    })),
    protectedSpeechRanges: speechRanges,
    musicInteractionPolicy,
    eqProfile: distance === 'distant' ? 'distance_rolloff' :
      input.cue.layerRole === 'hero_impact' ? 'impact_control' : 'speech_safe',
    dynamicsProfile: input.cue.layerRole === 'hero_impact' ? 'peak_limiter' : 'gentle_compression',
    pan: 0,
    distance,
    roomMatch: input.cue.layerRole === 'room_tone' ? 'source_room' : 'dry',
    headroomDb: input.cue.layerRole === 'hero_impact' ? 3 : 6,
  }
}

export interface SoundStructuredQaReport {
  status: 'passed' | 'warning' | 'failed'
  technical: string[]
  synchronization: string[]
  perceptual: string[]
  mix: string[]
  continuity: string[]
  provenance: string[]
  integration: string[]
}

export function runPlannedSoundQa(input: {
  cues: CanonicalSoundCue[]
  automations: SoundMixAutomation[]
  authorizedRanges: SoundFrameRange[]
  durationFrames: number
  maximumCueDensityPerMinute: number
  timelineRate: TimelineRate
  provenanceReady: boolean
}): SoundStructuredQaReport {
  const technical: string[] = []
  const synchronization: string[] = []
  const perceptual: string[] = []
  const mix: string[] = []
  const continuity: string[] = []
  const provenance: string[] = []
  const integration: string[] = []
  const allowed = (cue: CanonicalSoundCue) => input.authorizedRanges.some(
    (range) => cue.startFrame >= range.startFrame && cue.endFrameExclusive <= range.endFrameExclusive,
  )
  if (input.cues.some((cue) => !allowed(cue))) integration.push('cue_outside_authorized_range')
  if (input.cues.some((cue) => cue.hitFrame !== undefined && (
    cue.hitFrame < cue.startFrame || cue.hitFrame >= cue.endFrameExclusive
  ))) synchronization.push('hit_outside_cue')
  if (input.automations.some((automation) => automation.headroomDb < 1)) mix.push('insufficient_headroom')
  if (input.automations.some((automation) =>
    automation.protectedSpeechRanges.length > 0 && automation.dialogueDuckingDb >= 0
  )) mix.push('speech_not_protected')
  const minutes = Math.max(1 / 60, framesToSeconds(input.durationFrames, input.timelineRate) / 60)
  if (input.cues.length / minutes > input.maximumCueDensityPerMinute) {
    perceptual.push('cue_density_exceeded')
  }
  const repeated = new Set<string>()
  for (const cue of input.cues) {
    const identity = `${cue.acquisitionDecision}:${cue.layerRole}:${cue.storyReason}`
    if (repeated.has(identity)) continuity.push(`repeated_sound:${cue.cueId}`)
    repeated.add(identity)
  }
  if (!input.provenanceReady && input.cues.length > 0) provenance.push('provenance_incomplete')
  if (input.cues.length === 0) perceptual.push('professional_silence_selected')
  if (technical.length === 0) technical.push('planned_format_and_private_artifact_gates_attached')
  if (synchronization.length === 0) synchronization.push('all_hits_within_cues')
  if (mix.length === 0) mix.push('speech_and_headroom_policies_attached')
  if (continuity.length === 0) continuity.push('no_unjustified_repeated_sound_detected')
  if (provenance.length === 0) provenance.push('provenance_policy_attached')
  if (integration.length === 0) integration.push('all_cues_within_authority')
  const failures = [...synchronization, ...mix, ...integration].filter((value) =>
    value.includes('outside') || value.includes('insufficient') || value === 'speech_not_protected',
  )
  const warnings = [...perceptual, ...continuity, ...provenance].filter((value) =>
    value.includes('exceeded') || value.includes('repeated') || value.includes('incomplete'),
  )
  return {
    status: failures.length > 0 ? 'failed' : warnings.length > 0 ? 'warning' : 'passed',
    technical,
    synchronization,
    perceptual,
    mix,
    continuity,
    provenance,
    integration,
  }
}
