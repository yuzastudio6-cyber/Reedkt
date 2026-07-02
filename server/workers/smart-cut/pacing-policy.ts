import type { PacingProfile, PacingProfileName, SmartCutAggressiveness } from './smart-cut-worker-types'

const baseProfiles: Record<PacingProfileName, PacingProfile> = {
  natural_clean: profile('natural_clean', 1.2, 1.2, 4, 8, 'protect'),
  social_fast: profile('social_fast', 0.45, 0.6, 12, 22, 'allow_when_aggressive'),
  podcast_clean: profile('podcast_clean', 0.9, 1, 5, 10, 'protect'),
  talking_head_tight: profile('talking_head_tight', 0.6, 0.75, 8, 16, 'warn'),
  documentary_measured: profile('documentary_measured', 1.8, 2, 2, 6, 'protect'),
  education_structured: profile('education_structured', 1.5, 1.6, 3, 7, 'protect'),
  custom: profile('custom', 1.2, 1.2, 4, 8, 'protect'),
}

const aggressivenessSilenceMultiplier: Record<SmartCutAggressiveness, number> = {
  gentle: 1.5,
  balanced: 1,
  tight: 0.75,
  aggressive: 0.55,
}

export function resolvePacingProfile(input: {
  profileId?: PacingProfileName
  aggressiveness?: SmartCutAggressiveness
  custom?: Partial<PacingProfile>
} = {}): PacingProfile {
  const profileId = input.profileId ?? 'natural_clean'
  const base = baseProfiles[profileId] ?? baseProfiles.natural_clean
  const multiplier = aggressivenessSilenceMultiplier[input.aggressiveness ?? 'balanced']
  const custom = profileId === 'custom' ? input.custom ?? {} : {}

  return {
    ...base,
    ...custom,
    profileId,
    maxSilenceSeconds: roundSeconds((custom.maxSilenceSeconds ?? base.maxSilenceSeconds) * multiplier),
    minSegmentDurationSeconds: custom.minSegmentDurationSeconds ?? base.minSegmentDurationSeconds,
    targetCutsPerMinuteMin: custom.targetCutsPerMinuteMin ?? base.targetCutsPerMinuteMin,
    targetCutsPerMinuteMax: custom.targetCutsPerMinuteMax ?? base.targetCutsPerMinuteMax,
    emotionalPausePolicy: custom.emotionalPausePolicy ?? base.emotionalPausePolicy,
    notes: [
      ...base.notes,
      `Aggressiveness ${input.aggressiveness ?? 'balanced'} applies ${multiplier}x silence threshold.`,
      ...(custom.notes ?? []),
    ],
  }
}

export function getPacingProfile(profileId: PacingProfileName): PacingProfile {
  return resolvePacingProfile({ profileId, aggressiveness: 'balanced' })
}

export function targetCutDensityRange(profile: PacingProfile, durationSeconds: number): {
  minCuts: number
  maxCuts: number
} {
  const minutes = Math.max(durationSeconds / 60, 0.1)
  return {
    minCuts: Math.floor(profile.targetCutsPerMinuteMin * minutes),
    maxCuts: Math.ceil(profile.targetCutsPerMinuteMax * minutes),
  }
}

function profile(
  profileId: PacingProfileName,
  maxSilenceSeconds: number,
  minSegmentDurationSeconds: number,
  targetCutsPerMinuteMin: number,
  targetCutsPerMinuteMax: number,
  emotionalPausePolicy: PacingProfile['emotionalPausePolicy'],
): PacingProfile {
  return {
    profileId,
    maxSilenceSeconds,
    minSegmentDurationSeconds,
    targetCutsPerMinuteMin,
    targetCutsPerMinuteMax,
    emotionalPausePolicy,
    notes: ['Milestone 8 pacing profile is deterministic and does not cut media.'],
  }
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}
