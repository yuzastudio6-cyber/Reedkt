import type {
  SFXQAIssue,
  SFXQAIssueSeverity,
  SFXQAIssueType,
} from '../../types'
import type { RunSFXQARequest } from '../contracts/sfx-director-contracts'
import { createMockId } from '../mock/mock-database'

function content(input: RunSFXQARequest): string {
  return [
    input.videoTone,
    input.mockOutputSummary,
    input.sfxEventPlan.videoTone,
    input.sfxEventPlan.sceneContext,
    input.sfxPromptPlan?.prompt,
    ...(input.userSFXInstructions ?? []),
    ...(input.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

function issue(
  issueType: SFXQAIssueType,
  severity: SFXQAIssueSeverity,
  description: string,
  recommendedFix: string,
  blocksUse = false,
): SFXQAIssue {
  return {
    id: createMockId('sfx-qa-issue'),
    issueType,
    severity,
    description,
    recommendedFix,
    blocksUse,
  }
}

export function createTimingQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const issues: SFXQAIssue[] = []
  const text = content(input)

  if (input.sfxEventPlan.decisionState === 'needed' && !input.sfxTimingAlignment) {
    issues.push(issue('bad_hit_alignment', 'high', 'Needed SFX has no timing alignment.', 'Create timing alignment before preview.', true))
  }

  if (input.sfxTimingAlignment) {
    const deltaMs = Math.round((input.sfxTimingAlignment.hitTimeSeconds - input.sfxTimingAlignment.anchorTimeSeconds) * 1000)
    if (deltaMs > 80 || /late hit|hit late/.test(text)) {
      issues.push(issue('late_hit', 'medium', 'SFX hit lands late against the timing anchor.', 'Shift the hit earlier or trim again.'))
    }
    if (deltaMs < -80 || /early hit|hit early/.test(text)) {
      issues.push(issue('early_hit', 'medium', 'SFX hit lands early against the timing anchor.', 'Shift the hit later or trim again.'))
    }
  }

  if (input.sfxTrimPlan?.requiresManualReview || /bad trim|hit cut off|cut off hit/.test(text)) {
    issues.push(issue('bad_trim', 'high', 'SFX trim is not safe enough for preview.', 'Trim again around the best usable region.', true))
  }

  if ((input.sfxTrimPlan?.tailMs ?? 0) > 1600 || /tail too long|long tail/.test(text)) {
    issues.push(issue('tail_too_long', 'medium', 'SFX tail is too long for the edit moment.', 'Shorten the tail or use a stronger fade.'))
  }

  return issues
}

export function createVolumeQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const issues: SFXQAIssue[] = []
  const mixPlan = input.sfxMixPlan
  const text = content(input)

  if (input.speechPresent && mixPlan?.volumeProfile === 'impact') {
    issues.push(issue('too_loud', 'critical', 'Impact SFX is too loud for dialogue.', 'Lower volume or replace with subtle polish.', true))
  }

  if (input.speechPresent && mixPlan && (!mixPlan.duckUnderVoice || !mixPlan.sidechainToVoice)) {
    issues.push(issue('fights_voice', 'high', 'SFX does not duck under voice.', 'Enable voice ducking and sidechain.'))
  }

  if (mixPlan && mixPlan.targetGainDb < -32 && mixPlan.volumeProfile !== 'none') {
    issues.push(issue('too_quiet', 'low', 'SFX is likely too quiet to support the edit.', 'Raise the gain hint slightly or remove the cue.'))
  }

  if (/too loud|fights voice/.test(text) && !issues.some((qaIssue) => qaIssue.issueType === 'too_loud')) {
    issues.push(issue('too_loud', 'high', 'SFX is described as too loud in the mock output.', 'Lower volume before preview.'))
  }

  return issues
}

export function createStyleQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const issues: SFXQAIssue[] = []
  const text = content(input)

  if (/cartoon|childish/.test(text)) {
    issues.push(issue('cartoonish_when_should_be_premium', /luxury|premium|real estate/.test(text) ? 'high' : 'medium', 'SFX sounds cartoonish for the edit tone.', 'Regenerate with softer, more premium direction.'))
  }

  if (/cheap|viral beep|cheap beep|wrong style|not premium/.test(text)) {
    issues.push(issue('wrong_style', 'high', 'SFX style does not match the video tone.', 'Regenerate or replace with a cleaner library cue.'))
  }

  if (/faith|serious|teaching|emotional/.test(text) && /whoosh|impact|hype|boom/.test(text)) {
    issues.push(issue('not_needed', 'critical', 'SFX distracts from serious spoken meaning.', 'Remove SFX or use whisper-level support only.', true))
  }

  if (input.sfxEventPlan.sourceFootagePolicy === 'edit_layer_only_default' && /footstep|door|car|plate|clothing|crowd/.test(text)) {
    issues.push(issue('does_not_match_edit_layer', 'critical', 'Source-action SFX conflicts with edit-layer default policy.', 'Remove the source-action SFX or ask the user for full sound design.', true))
  }

  return issues
}

export function createVoiceSafetyQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  if (!input.speechPresent) return []

  const issues: SFXQAIssue[] = []
  const text = content(input)

  if (/covers dialogue|over speech|important word|emotional pause/.test(text)) {
    issues.push(issue('fights_voice', 'high', 'SFX risks covering important speech or pause.', 'Lower, duck, move, or remove the SFX.'))
  }

  return issues
}

export function createMusicFitQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const text = content(input)
  const issues: SFXQAIssue[] = []

  if (input.musicPresent && /fights music|off beat|beat mismatch/.test(text)) {
    issues.push(issue('fights_music', 'medium', 'SFX does not fit the music timing or energy.', 'Adjust timing/mix or regenerate with lower energy.'))
  }

  if (input.ambienceImportant && /fights ambience|ambience conflict/.test(text)) {
    issues.push(issue('other', 'medium', 'SFX fights the source ambience.', 'Use room match, lower volume, or remove the cue.'))
  }

  return issues
}

export function createArtifactQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const text = content(input)
  const issues: SFXQAIssue[] = []

  if (/artifact|distort|clipping|glitch|bad ai|provider output low quality/.test(text) || input.sfxGeneratedAsset?.qaStatus === 'failed') {
    issues.push(issue('audio_artifact', 'critical', 'Generated SFX has artifact or low-quality output risk.', 'Regenerate or replace before preview.', true))
  }

  if (!input.sfxGeneratedAsset?.licenseScope && input.sfxGeneratedAsset) {
    issues.push(issue('license_or_provenance_missing', 'medium', 'SFX asset lacks complete license scope metadata.', 'Keep project-only and require provenance review before reuse.'))
  }

  return issues
}

export function createSFXQAIssues(input: RunSFXQARequest): SFXQAIssue[] {
  const issues = [
    ...createTimingQAIssues(input),
    ...createVolumeQAIssues(input),
    ...createStyleQAIssues(input),
    ...createVoiceSafetyQAIssues(input),
    ...createMusicFitQAIssues(input),
    ...createArtifactQAIssues(input),
  ]
  const seen = new Set<string>()

  return issues.filter((qaIssue) => {
    const key = `${qaIssue.issueType}:${qaIssue.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function createSFXIssueSummary(issues: SFXQAIssue[]): string[] {
  if (issues.length === 0) return ['No SFX QA issues were found.']

  return issues.map((qaIssue) =>
    `${qaIssue.severity} ${qaIssue.issueType}: ${qaIssue.description}`,
  )
}
