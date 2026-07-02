import {
  detectProjectEditBriefAudioConflicts,
} from '../../lib/project-edit-brief-qa-rules'

export function detectProjectEditBriefMusicConflict(input: Parameters<typeof detectProjectEditBriefAudioConflicts>[0]) {
  return detectProjectEditBriefAudioConflicts(input).filter((finding) => finding.conflictKind === 'music_vs_no_music')
}

export function detectProjectEditBriefSFXConflict(input: Parameters<typeof detectProjectEditBriefAudioConflicts>[0]) {
  return detectProjectEditBriefAudioConflicts(input).filter((finding) => finding.conflictKind === 'sfx_vs_no_fake_sounds')
}

export function detectProjectEditBriefNoFakeSoundsConflict(input: Parameters<typeof detectProjectEditBriefAudioConflicts>[0]) {
  return detectProjectEditBriefSFXConflict(input)
}

export function createProjectEditBriefAudioConflictSummary(input: Parameters<typeof detectProjectEditBriefAudioConflicts>[0]): string {
  const conflicts = detectProjectEditBriefAudioConflicts(input)
  return `${conflicts.length} metadata-only audio/SFX conflict(s) detected; no sound runtime, audio analysis, or worker started.`
}
