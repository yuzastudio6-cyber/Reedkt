import type { PreferenceApplicationTargetContextSnapshot } from '../types/edit-reference'
import type { TargetVideoUnderstandingPackage } from '../types/edit-reference-target-video-understanding'
import type { ApprovedEditReferenceOption } from './edit-reference-approved-options'
import { isTargetVideoUnderstandingReadyForUi } from './edit-reference-target-study-ui'
import type { CurrentEditReferenceSupplementResource } from './current-edit-reference-study-supplement'

export const CURRENT_EDIT_REFERENCE_DRAFT_DECISION_VERSION =
  'current-edit-reference-draft-decision-v1' as const

export type CurrentEditReferenceDraftOperation = 'keep' | 'select' | 'replace' | 'remove'

export type CurrentEditReferenceDraftBlockReason =
  | 'locked'
  | 'original_authority_invalid'
  | 'reference_stale'
  | 'reference_authority_invalid'
  | 'study_loading'
  | 'study_resource_unavailable'
  | 'study_required'
  | 'study_not_ready'
  | 'study_authority_mismatch'

export type CurrentEditReferenceOriginalDecision =
  | { kind: 'none' }
  | {
      kind: 'connected'
      referenceId: string
      referenceRevision: number
      applicationId: string
      applicationContentDigest: string
    }

export interface CurrentEditReferenceTargetAuthority {
  workspaceId: string
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
  editBriefId: string
  editBriefRevision: number
  editBriefDigestSha256: string
  targetContext: PreferenceApplicationTargetContextSnapshot
}

export interface CurrentEditReferenceApprovedAuthoritySnapshot {
  referenceId: string
  referenceRevision: number
  dnaVersionId: string
  dnaVersionNumber: number
  dnaContentDigest: string
  qaResultId: string
}

export interface CurrentEditReferenceTargetStudySnapshot {
  packageId: string
  packageDigestSha256: string
  completionAttestationDigestSha256: string
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
  editBriefId: string
  editBriefRevision: number
  editBriefDigestSha256: string
  contextDigestSha256: string
}

export interface CurrentEditReferenceAtomicDraftDecision {
  decisionVersion: typeof CURRENT_EDIT_REFERENCE_DRAFT_DECISION_VERSION
  operation: CurrentEditReferenceDraftOperation
  original: CurrentEditReferenceOriginalDecision
  draftReferenceId: string | null
  lifecycle: {
    draftPlanInvalidationRequired: boolean
    creditEstimateInvalidationRequired: boolean
    footagePrepRerunRequired: false
    outputFrameReconfirmationRequired: false
    approvedSnapshotMutationAllowed: false
  }
  approvedReference?: CurrentEditReferenceApprovedAuthoritySnapshot
  targetStudy?: CurrentEditReferenceTargetStudySnapshot
}

export interface CurrentEditReferenceDraftResolution {
  operation: CurrentEditReferenceDraftOperation
  changed: boolean
  dirtyContribution: boolean
  resetReferenceId: string | null
  canJoinAtomicApply: boolean
  blockReason?: CurrentEditReferenceDraftBlockReason
  message: string
  selectedReference?: ApprovedEditReferenceOption
  decision?: CurrentEditReferenceAtomicDraftDecision
}

/**
 * Resolves the Edit Reference portion of the canonical Current Edit
 * Preferences draft. This function has no persistence, application, study,
 * routing, or autosave side effects. The host may include the returned
 * decision only inside its one atomic Apply operation.
 */
export function resolveCurrentEditReferenceDraftDecision(input: {
  approvedReferences: ApprovedEditReferenceOption[]
  draftReferenceId?: string | null
  locked: boolean
  original: CurrentEditReferenceOriginalDecision
  resource: CurrentEditReferenceSupplementResource
  targetAuthority?: CurrentEditReferenceTargetAuthority
  targetStudy?: TargetVideoUnderstandingPackage
}): CurrentEditReferenceDraftResolution {
  const originalReferenceId = input.original.kind === 'connected'
    ? input.original.referenceId
    : null
  const draftReferenceId = normalizeReferenceId(input.draftReferenceId)
  const changed = draftReferenceId !== originalReferenceId
  const operation = operationFor(originalReferenceId, draftReferenceId)
  const common = {
    operation,
    changed,
    dirtyContribution: changed,
    resetReferenceId: originalReferenceId,
  }

  if (!originalDecisionIsValid(input.original)) {
    return blocked(common, 'original_authority_invalid',
      'Refresh this edit before applying changes. Its saved Edit Reference authority could not be verified.')
  }

  if (input.locked && changed) {
    return blocked(common, 'locked',
      'This edit is read only. Request the reference change through Chat so ReEditPro can create a new plan version.')
  }

  if (!changed) {
    return ready(common, {
      decisionVersion: CURRENT_EDIT_REFERENCE_DRAFT_DECISION_VERSION,
      operation: 'keep',
      original: input.original,
      draftReferenceId,
      lifecycle: lifecycleFor('keep'),
    }, 'The saved Edit Reference decision remains unchanged.')
  }

  if (operation === 'remove') {
    return ready(common, {
      decisionVersion: CURRENT_EDIT_REFERENCE_DRAFT_DECISION_VERSION,
      operation,
      original: input.original,
      draftReferenceId: null,
      lifecycle: lifecycleFor(operation),
    }, 'The current reference will be removed only when all Current Edit Preferences are applied together.')
  }

  const selectedReference = input.approvedReferences.find((reference) => reference.id === draftReferenceId)
  if (!selectedReference) {
    return blocked(common, 'reference_stale',
      'Choose an available approved Edit Reference before applying this draft.')
  }
  if (!approvedReferenceAuthorityIsValid(selectedReference)) {
    return blocked(common, 'reference_authority_invalid',
      'This Edit Reference no longer has exact approved, quality-reviewed guidance. Refresh the available references.')
  }

  const resourceBlock = resourceBlockFor(input.resource)
  if (resourceBlock) {
    return {
      ...blocked(common, resourceBlock.reason, resourceBlock.message),
      selectedReference,
    }
  }

  if (!input.targetAuthority || !input.targetStudy) {
    return {
      ...blocked(common, 'study_required',
        'Study this exact video and verify the complete result before applying the selected Edit Reference.'),
      selectedReference,
    }
  }

  if (!isTargetVideoUnderstandingReadyForUi(input.targetStudy)) {
    return {
      ...blocked(common, 'study_not_ready',
        'The complete video study must finish and pass coverage and quality checks before this reference can be applied.'),
      selectedReference,
    }
  }

  if (!targetStudyMatchesAuthority({
    authority: input.targetAuthority,
    editReferenceId: selectedReference.id,
    targetStudy: input.targetStudy,
  })) {
    return {
      ...blocked(common, 'study_authority_mismatch',
        'The source, Edit Brief, instruction, frame, or delivery context changed. Refresh the video study before applying.'),
      selectedReference,
    }
  }

  const attestation = input.targetStudy.runtimeProvenance.completionAttestationDigestSha256
  if (!attestation) {
    return {
      ...blocked(common, 'study_not_ready',
        'The complete video study is missing its verification record and cannot authorize this preference change.'),
      selectedReference,
    }
  }

  return ready(common, {
    decisionVersion: CURRENT_EDIT_REFERENCE_DRAFT_DECISION_VERSION,
    operation,
    original: input.original,
    draftReferenceId,
    lifecycle: lifecycleFor(operation),
    approvedReference: approvedAuthoritySnapshot(selectedReference),
    targetStudy: {
      packageId: input.targetStudy.packageId,
      packageDigestSha256: input.targetStudy.packageDigestSha256,
      completionAttestationDigestSha256: attestation,
      sourceStorageObjectRecordId: input.targetStudy.source.storageObjectRecordId,
      sourceMediaAssetId: input.targetStudy.source.mediaAssetId,
      editBriefId: input.targetStudy.declaredContext.editBriefId,
      editBriefRevision: input.targetStudy.declaredContext.editBriefRevision,
      editBriefDigestSha256: input.targetStudy.declaredContext.editBriefDigestSha256,
      contextDigestSha256: input.targetStudy.declaredContext.contextDigestSha256,
    },
  }, 'The selected reference and exact whole-video study can join the page’s single Apply operation.', selectedReference)
}

function normalizeReferenceId(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function operationFor(
  originalReferenceId: string | null,
  draftReferenceId: string | null,
): CurrentEditReferenceDraftOperation {
  if (originalReferenceId === draftReferenceId) return 'keep'
  if (!originalReferenceId && draftReferenceId) return 'select'
  if (originalReferenceId && !draftReferenceId) return 'remove'
  return 'replace'
}

function originalDecisionIsValid(value: CurrentEditReferenceOriginalDecision): boolean {
  if (value.kind === 'none') return true
  return Boolean(
    value.referenceId.trim()
    && Number.isInteger(value.referenceRevision)
    && value.referenceRevision >= 1
    && value.applicationId.trim()
    && isSha256(value.applicationContentDigest),
  )
}

function approvedReferenceAuthorityIsValid(value: ApprovedEditReferenceOption): boolean {
  return Boolean(
    value.id.trim()
    && Number.isInteger(value.referenceRevision)
    && value.referenceRevision >= 1
    && value.dnaVersionId.trim()
    && Number.isInteger(value.dnaVersionNumber)
    && value.dnaVersionNumber >= 1
    && isSha256(value.dnaContentDigest)
    && value.qaResultId.trim()
    && value.qaStatus !== 'blocked',
  )
}

function resourceBlockFor(resource: CurrentEditReferenceSupplementResource): {
  reason: CurrentEditReferenceDraftBlockReason
  message: string
} | undefined {
  if (resource.state === 'ready') return undefined
  if (resource.state === 'loading') {
    return {
      reason: 'study_loading',
      message: 'Wait for the saved Edit Reference study state to finish loading before applying this draft.',
    }
  }
  if (resource.state === 'blocking_validation') {
    return {
      reason: 'study_authority_mismatch',
      message: 'Resolve the source, Edit Brief, output-frame, or reference validation before applying this draft.',
    }
  }
  return {
    reason: 'study_resource_unavailable',
    message: 'Refresh the saved Edit Reference study state before applying this draft. Your changes remain preserved.',
  }
}

function targetStudyMatchesAuthority(input: {
  authority: CurrentEditReferenceTargetAuthority
  editReferenceId: string
  targetStudy: TargetVideoUnderstandingPackage
}): boolean {
  const { authority, targetStudy } = input
  const targetContext = authority.targetContext
  const declared = targetStudy.declaredContext
  return authorityIsValid(authority)
    && targetStudy.workspaceId === authority.workspaceId
    && targetStudy.projectId === targetContext.projectId
    && targetStudy.editSessionId === targetContext.editSessionId
    && targetStudy.editReferenceId === input.editReferenceId
    && targetStudy.source.storageObjectRecordId === authority.sourceStorageObjectRecordId
    && targetStudy.source.mediaAssetId === authority.sourceMediaAssetId
    && declared.editBriefId === authority.editBriefId
    && declared.editBriefRevision === authority.editBriefRevision
    && declared.editBriefDigestSha256 === authority.editBriefDigestSha256
    && declared.projectName === targetContext.projectName
    && declared.editName === targetContext.editName
    && declared.currentUserInstruction === targetContext.currentUserInstruction
    && declared.selectedEditLevel === targetContext.selectedEditLevel
    && declared.aspectRatio === targetContext.aspectRatio
    && declared.outputFrameConfirmed === true
    && declared.platformTarget === targetContext.platformTarget
    && declared.contentType === targetContext.contentType
    && declared.storyRole === targetContext.storyRole
    && declared.budgetPreference === targetContext.budgetPreference
    && targetStudy.audioState.sourceMode === targetContext.sourceMode
    && sameJson(declared.directives, targetContext.directives)
    && sameJson(declared.approvedConstraints, targetContext.approvedConstraints)
    && isSha256(targetStudy.packageDigestSha256)
    && isSha256(declared.contextDigestSha256)
}

function authorityIsValid(value: CurrentEditReferenceTargetAuthority): boolean {
  return Boolean(
    value.workspaceId.trim()
    && value.sourceStorageObjectRecordId.trim()
    && value.sourceMediaAssetId.trim()
    && value.editBriefId.trim()
    && Number.isInteger(value.editBriefRevision)
    && value.editBriefRevision >= 1
    && isSha256(value.editBriefDigestSha256)
    && value.targetContext.projectId.trim()
    && value.targetContext.editSessionId.trim()
    && value.targetContext.outputFrameConfirmed === true,
  )
}

function approvedAuthoritySnapshot(
  value: ApprovedEditReferenceOption,
): CurrentEditReferenceApprovedAuthoritySnapshot {
  return {
    referenceId: value.id,
    referenceRevision: value.referenceRevision,
    dnaVersionId: value.dnaVersionId,
    dnaVersionNumber: value.dnaVersionNumber,
    dnaContentDigest: value.dnaContentDigest,
    qaResultId: value.qaResultId,
  }
}

function lifecycleFor(
  operation: CurrentEditReferenceDraftOperation,
): CurrentEditReferenceAtomicDraftDecision['lifecycle'] {
  const changed = operation !== 'keep'
  return {
    draftPlanInvalidationRequired: changed,
    creditEstimateInvalidationRequired: changed,
    footagePrepRerunRequired: false,
    outputFrameReconfirmationRequired: false,
    approvedSnapshotMutationAllowed: false,
  }
}

function ready(
  common: Pick<CurrentEditReferenceDraftResolution, 'operation' | 'changed' | 'dirtyContribution' | 'resetReferenceId'>,
  decision: CurrentEditReferenceAtomicDraftDecision,
  message: string,
  selectedReference?: ApprovedEditReferenceOption,
): CurrentEditReferenceDraftResolution {
  return {
    ...common,
    canJoinAtomicApply: true,
    message,
    selectedReference,
    decision,
  }
}

function blocked(
  common: Pick<CurrentEditReferenceDraftResolution, 'operation' | 'changed' | 'dirtyContribution' | 'resetReferenceId'>,
  blockReason: CurrentEditReferenceDraftBlockReason,
  message: string,
): CurrentEditReferenceDraftResolution {
  return {
    ...common,
    canJoinAtomicApply: false,
    blockReason,
    message,
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value)
}
