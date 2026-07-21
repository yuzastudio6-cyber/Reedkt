import type {
  PreferenceSkillRunRecord,
  PreferenceSkillRunResultState,
} from '../types/edit-reference'

export function resolvePreferenceSkillRunResultState(
  run: PreferenceSkillRunRecord,
): PreferenceSkillRunResultState {
  if (run.resultState) return run.resultState
  if (run.status === 'completed') {
    if (run.runtimeSource === 'fallback' || run.fallbackUsed) return 'fallback'
    return 'analyzed'
  }
  if (run.status === 'queued' || run.status === 'running') return 'needs_more_evidence'
  return 'blocked'
}

export function preferenceSkillRunResultStateLabel(
  run: PreferenceSkillRunRecord,
): string {
  const state = resolvePreferenceSkillRunResultState(run)
  const label = state === 'analyzed'
    ? 'Analyzed'
    : state === 'manual_evidence'
      ? 'Manual evidence'
      : state === 'fallback'
        ? 'Fallback'
        : state === 'needs_more_evidence'
          ? 'Needs more evidence'
          : 'Blocked'
  return run.retryAvailable === true ? `${label} · Retry available` : label
}

export function preferenceSkillRunCanRetry(run: PreferenceSkillRunRecord): boolean {
  return run.retryAvailable === true
}

export function preferenceSkillRunDisplaySummary(run: PreferenceSkillRunRecord): string {
  if (run.skillId === 'edit_reference.media_structure.metadata_map') {
    return 'Verified the private video structure and prepared bounded visual and audio study material.'
  }
  return run.resultSummary
}

export function preferenceSkillRunBlockerMessage(run: PreferenceSkillRunRecord): string | undefined {
  const reason = run.blockedReasons[0]
  if (!reason) return undefined
  const normalized = reason.toLowerCase()
  if (normalized.includes('cost_authority_unavailable')) {
    return 'Advanced visual understanding is waiting for approved analysis capacity. Completed technical evidence remains saved.'
  }
  if (normalized.includes('caption_ocr_result_unavailable')) {
    return 'Caption understanding is waiting for verified on-screen text analysis. Completed video preparation remains saved.'
  }
  if (normalized.includes('visual_evidence_unavailable')) {
    return 'Story and pacing analysis is waiting for the visual-language study to finish.'
  }
  if (normalized.includes('transcript_runtime_unavailable')) {
    return 'Speech and pacing analysis is waiting for an approved transcript and timing track.'
  }
  if (normalized.includes('semantic_audio_runtime_unavailable')) {
    return 'Sound-design understanding is waiting for an approved audio-analysis service.'
  }
  return 'This part of the study needs more evidence or analysis capacity before it can continue.'
}
