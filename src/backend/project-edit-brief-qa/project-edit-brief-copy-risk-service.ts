import {
  detectProjectEditBriefCopyRisk,
} from '../../lib/project-edit-brief-qa-rules'

export { detectProjectEditBriefCopyRisk }

export function detectProjectEditBriefExactReferenceCopyRisk(input: Parameters<typeof detectProjectEditBriefCopyRisk>[0]) {
  const finding = detectProjectEditBriefCopyRisk(input)
  return finding?.conflictKind === 'copy_reference_risk' ? finding : undefined
}

export function detectProjectEditBriefReferenceUrlCopyRisk(input: Parameters<typeof detectProjectEditBriefCopyRisk>[0]) {
  return detectProjectEditBriefExactReferenceCopyRisk(input)
}

export function createProjectEditBriefCopyRiskSummary(input: Parameters<typeof detectProjectEditBriefCopyRisk>[0]): string {
  const finding = detectProjectEditBriefCopyRisk(input)
  return finding
    ? `${finding.title}: adapted, not copied language is required.`
    : 'No deterministic exact-copy risk detected.'
}
