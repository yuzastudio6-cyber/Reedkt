import type { TextBehindSubjectExecutionInput } from './text-behind-subject-types'

export function validateTextBehindSubjectPolicy(input: TextBehindSubjectExecutionInput): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (input.rawPrompt !== undefined) blockingReasons.push('raw_prompt_blocked')
  if (input.signedUrl !== undefined) blockingReasons.push('signed_url_blocked')
  if (input.allowFinalRender === true) blockingReasons.push('final_render_blocked_in_m15c')
  if (isUnsafeTextContent(input.textContent)) blockingReasons.push('unsafe_text_content')
  if (!input.foregroundMaskArtifactId && !input.maskSequenceArtifactId) {
    warnings.push('text_behind_subject_mask_artifact_or_plan_required_before_preview')
  }
  if ((input.maskConfidence ?? 0.72) < 0.82) {
    blockingReasons.push('mask_confidence_too_low_for_text_behind_subject')
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}

export function isUnsafeTextContent(value: string | undefined): boolean {
  if (!value) return true
  const normalized = value.toLowerCase()
  return /<\s*script|<\/?[a-z][^>]*>|javascript:|onerror\s*=|onload\s*=|\{\\|\\pos|\\move|\\clip/.test(normalized)
}
