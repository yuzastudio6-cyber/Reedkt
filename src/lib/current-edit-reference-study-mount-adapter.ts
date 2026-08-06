import type { ApprovedEditReferenceOption } from './edit-reference-approved-options'
import type { ProjectEditBriefBackendLocalRecord } from './project-edit-brief-backend-local'
import type {
  CurrentEditReferenceSupplementOption,
  CurrentEditReferenceSupplementResource,
} from './current-edit-reference-study-supplement'

export interface CurrentEditReferenceExactEditIdentity {
  workspaceId: string
  projectId: string
  editSessionId: string
  aspectRatio: string
}

export interface CurrentEditReferenceStudyMountResolution {
  authorityReady: boolean
  options: CurrentEditReferenceSupplementOption[]
  resource: CurrentEditReferenceSupplementResource
}

export function createCurrentEditReferenceSupplementOptions(
  approvedReferences: ApprovedEditReferenceOption[],
): CurrentEditReferenceSupplementOption[] {
  return approvedReferences.map((reference) => ({
    id: reference.id,
    name: reference.name,
    summary: reference.summary,
    approvedGuidanceVersion: reference.dnaVersionNumber,
    evidenceConfidence: reference.confidence,
    evidenceConfidenceBand: reference.confidenceBand,
    copySafetyBoundaryCount: reference.doNotCopyRuleCount,
    layerLabels: [...reference.layerLabels],
  }))
}

export function resolveCurrentEditReferenceStudyMount(input: {
  approvedReferences: ApprovedEditReferenceOption[]
  brief?: ProjectEditBriefBackendLocalRecord
  exactEdit?: CurrentEditReferenceExactEditIdentity
  outputFrameConfirmed: boolean
  resource: CurrentEditReferenceSupplementResource
  selectedReferenceId?: string
}): CurrentEditReferenceStudyMountResolution {
  const options = createCurrentEditReferenceSupplementOptions(input.approvedReferences)

  if (input.resource.state !== 'ready') {
    return {
      authorityReady: false,
      options,
      resource: input.resource,
    }
  }

  if (!input.selectedReferenceId) {
    return {
      authorityReady: false,
      options,
      resource: { state: 'ready' },
    }
  }

  if (!options.some((option) => option.id === input.selectedReferenceId)) {
    return {
      authorityReady: false,
      options,
      resource: { state: 'ready' },
    }
  }

  if (!input.outputFrameConfirmed || !input.exactEdit || input.exactEdit.aspectRatio === 'custom') {
    return {
      authorityReady: false,
      options,
      resource: { state: 'blocking_validation', blockReason: 'frame_unconfirmed' },
    }
  }

  if (!briefHasVerifiedSourceAuthority(input.brief)) {
    return {
      authorityReady: false,
      options,
      resource: { state: 'blocking_validation', blockReason: 'source_or_brief_missing' },
    }
  }

  if (!briefMatchesExactEdit(input.brief, input.exactEdit)) {
    return {
      authorityReady: false,
      options,
      resource: { state: 'blocking_validation', blockReason: 'authority_mismatch' },
    }
  }

  return {
    authorityReady: true,
    options,
    resource: { state: 'ready' },
  }
}

function briefHasVerifiedSourceAuthority(
  brief: ProjectEditBriefBackendLocalRecord | undefined,
): brief is ProjectEditBriefBackendLocalRecord {
  return Boolean(
    brief
    && brief.readbackVerified === true
    && brief.sourceStorageObjectRecordId?.trim()
    && brief.sourceMediaAssetId?.trim()
    && Number.isInteger(brief.revisionNumber)
    && brief.revisionNumber >= 1
    && /^[a-f0-9]{64}$/.test(brief.contentDigestSha256),
  )
}

function briefMatchesExactEdit(
  brief: ProjectEditBriefBackendLocalRecord,
  exactEdit: CurrentEditReferenceExactEditIdentity,
): boolean {
  return brief.workspaceId === exactEdit.workspaceId
    && brief.projectId === exactEdit.projectId
    && brief.editSessionId === exactEdit.editSessionId
}
