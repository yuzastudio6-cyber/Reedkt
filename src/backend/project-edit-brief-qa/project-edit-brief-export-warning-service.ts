import {
  detectProjectEditBriefExportWarnings,
} from '../../lib/project-edit-brief-qa-rules'

export function detectProjectEditBriefCaptionSafeAreaWarning(input: Parameters<typeof detectProjectEditBriefExportWarnings>[0]) {
  return detectProjectEditBriefExportWarnings(input).filter((finding) => finding.conflictKind === 'caption_safe_area_warning')
}

export function detectProjectEditBriefAspectExportWarning(input: Parameters<typeof detectProjectEditBriefExportWarnings>[0]) {
  return detectProjectEditBriefExportWarnings(input).filter((finding) => finding.title.includes('Aspect/export'))
}

export function detectProjectEditBriefCustomExportWarning(input: Parameters<typeof detectProjectEditBriefExportWarnings>[0]) {
  return detectProjectEditBriefExportWarnings(input).filter((finding) => finding.conflictKind === 'custom_export_warning')
}

export function createProjectEditBriefExportWarningSummary(input: Parameters<typeof detectProjectEditBriefExportWarnings>[0]): string {
  const warnings = detectProjectEditBriefExportWarnings(input)
  return `${warnings.length} export-setting warning(s) detected; no render or export started.`
}
