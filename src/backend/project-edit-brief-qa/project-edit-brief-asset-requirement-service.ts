import type { ProjectEditBriefMarkerAttachmentRecord } from '../../types/project-edit-brief'
import {
  detectProjectEditBriefMissingAsset,
} from '../../lib/project-edit-brief-qa-rules'

export { detectProjectEditBriefMissingAsset }

export function detectProjectEditBriefAttachmentSatisfiedRequirement(input: {
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  acceptableKinds: ProjectEditBriefMarkerAttachmentRecord['attachmentKind'][]
}): boolean {
  return input.attachments.some((attachment) =>
    input.acceptableKinds.includes(attachment.attachmentKind) && attachment.status !== 'blocked',
  )
}

export function createProjectEditBriefAssetRequirementSummary(input: Parameters<typeof detectProjectEditBriefMissingAsset>[0]): string {
  const finding = detectProjectEditBriefMissingAsset(input)
  return finding
    ? `${finding.title}: ${finding.recommendedResolution}`
    : 'Required marker asset metadata is present or not needed.'
}
