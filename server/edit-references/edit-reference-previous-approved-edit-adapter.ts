import { randomUUID } from 'node:crypto'
import {
  EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION,
  type EditReferenceApprovedHistoryPackage,
  type EditReferenceApprovedHistoryReader,
} from '../services/edit-reference-approved-history-reader'
import {
  EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS,
  EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION,
  createBlockedEditReferencePreviousApprovedEditStudyResult,
  hashEditReferencePreviousApprovedEditStudyRequest,
  validateEditReferencePreviousApprovedEditStudyRequest,
  validateEditReferencePreviousApprovedEditStudyResult,
  type EditReferencePreviousApprovedEditStudyBlockerCode,
  type EditReferencePreviousApprovedEditStudyRequest,
  type EditReferencePreviousApprovedEditStudyResult,
  type EditReferenceVerifiedPreviousApprovedEditStudyResult,
} from './edit-reference-previous-approved-edit-study-contract'

export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID =
  'edit_reference_previous_approved_edit_adapter' as const
export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_VERSION = 'v1' as const

export interface EditReferencePreviousApprovedEditStudyAdapter {
  readonly adapterId: typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID
  readonly adapterVersion: typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_VERSION
  analyze(
    request: EditReferencePreviousApprovedEditStudyRequest,
  ): Promise<EditReferencePreviousApprovedEditStudyResult>
}

export interface EditReferencePreviousApprovedEditAdapterOptions {
  readonly reader: EditReferenceApprovedHistoryReader
  readonly now?: () => string
  readonly createExecutionId?: () => string
}

export function createEditReferencePreviousApprovedEditAdapter(
  options: EditReferencePreviousApprovedEditAdapterOptions,
): EditReferencePreviousApprovedEditStudyAdapter {
  return {
    adapterId: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID,
    adapterVersion: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_VERSION,
    async analyze(request): Promise<EditReferencePreviousApprovedEditStudyResult> {
      validateEditReferencePreviousApprovedEditStudyRequest(request)
      const startedAt = currentTime(options)
      let approvedHistoryPackage: EditReferenceApprovedHistoryPackage
      try {
        approvedHistoryPackage = await options.reader.read(request)
      } catch {
        return blocked(request, 'authority_unverified', false)
      }

      if (approvedHistoryPackage.schemaVersion !== EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION) {
        return blocked(request, 'authority_unverified', false)
      }
      if (approvedHistoryPackage.status === 'blocked') {
        return blocked(
          request,
          approvedHistoryPackage.blockerCode,
          approvedHistoryPackage.retryAvailable,
        )
      }
      if (
        (options.reader.executionMode === 'controlled_local'
          && approvedHistoryPackage.runtimeSource !== 'verified_local')
        || (options.reader.executionMode === 'backend_local_product'
          && approvedHistoryPackage.runtimeSource !== 'verified_local')
        || (options.reader.executionMode === 'live_repository'
          && approvedHistoryPackage.runtimeSource !== 'verified_live')
        || options.reader.executionMode === 'unavailable'
      ) {
        return blocked(request, 'authority_unverified', false)
      }

      const result: EditReferenceVerifiedPreviousApprovedEditStudyResult = {
        schemaVersion: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION,
        requestDigestSha256: hashEditReferencePreviousApprovedEditStudyRequest(request),
        status: 'verified',
        runtimeSource: approvedHistoryPackage.runtimeSource,
        authority: structuredClone(approvedHistoryPackage.authority),
        approvedPlanEvidenceIds: [...approvedHistoryPackage.approvedPlanEvidenceIds],
        privatePreviewArtifactIds: [...approvedHistoryPackage.privatePreviewArtifactIds],
        privatePreviewArtifactProofs: structuredClone(approvedHistoryPackage.privatePreviewArtifactProofs),
        evidence: structuredClone(approvedHistoryPackage.evidence),
        blockedTransfers: [...EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS],
        execution: structuredClone(approvedHistoryPackage.execution),
        provenance: {
          adapterId: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID,
          adapterVersion: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_VERSION,
          executionId: options.createExecutionId?.()
            ?? `edit-reference-approved-history-${randomUUID()}`,
          startedAt,
          completedAt: currentTime(options),
          internalCostStatus: approvedHistoryPackage.usage.internalCostStatus,
          meteredInternalCostMicros: approvedHistoryPackage.usage.meteredInternalCostMicros,
          usageEventIds: [...approvedHistoryPackage.usage.usageEventIds],
          internalCostRecordIds: [...approvedHistoryPackage.usage.internalCostRecordIds],
          customerPriceCalculated: false,
          customerCreditsMutated: false,
          serviceFeeIncluded: false,
        },
        privacy: structuredClone(approvedHistoryPackage.privacy),
      }
      try {
        validateEditReferencePreviousApprovedEditStudyResult(request, result)
        return result
      } catch (error) {
        return blocked(request, classifyInvalidPackage(error), false)
      }
    },
  }
}

function blocked(
  request: EditReferencePreviousApprovedEditStudyRequest,
  blockerCode: EditReferencePreviousApprovedEditStudyBlockerCode,
  retryAvailable: boolean,
): EditReferencePreviousApprovedEditStudyResult {
  const retryReason = retryAvailable ? retryReasonFor(blockerCode) : undefined
  return createBlockedEditReferencePreviousApprovedEditStudyResult({
    request,
    blockerCode,
    blockerMessage: blockerMessageFor(blockerCode),
    retryAvailable,
    ...(retryReason ? { retryReason } : {}),
  })
}

function blockerMessageFor(code: EditReferencePreviousApprovedEditStudyBlockerCode): string {
  if (code === 'adapter_unavailable') return 'The workspace-authorized approved-history reader is unavailable in this runtime.'
  if (code === 'cross_workspace_denied') return 'The requested approved edit is outside the authenticated workspace authority.'
  if (code === 'snapshot_not_approved') return 'The exact snapshot is not immutably approved and cannot be studied.'
  if (code === 'snapshot_identity_mismatch') return 'The approved-history package does not match the exact requested project, edit session, and snapshot identity.'
  if (code === 'private_artifact_unavailable') return 'The exact target-owned private preview lineage is unavailable or no longer retained.'
  return 'The exact approved-history authority could not be verified.'
}

function retryReasonFor(code: EditReferencePreviousApprovedEditStudyBlockerCode): string {
  if (code === 'adapter_unavailable') return 'Restore the reviewed exact-identity approved-history reader, immutable approval authority, and private artifact lineage before retrying.'
  if (code === 'private_artifact_unavailable') return 'Restore the exact retained target-owned private preview lineage before retrying.'
  return 'Restore the exact workspace, approval, snapshot, plan, evidence, and artifact authority before retrying.'
}

function classifyInvalidPackage(error: unknown): EditReferencePreviousApprovedEditStudyBlockerCode {
  const message = error instanceof Error ? error.message : ''
  if (/exact requested identity|does not match/i.test(message)) return 'snapshot_identity_mismatch'
  if (/private preview|target-owned|artifact/i.test(message)) return 'private_artifact_unavailable'
  if (/approved status|not immutably approved|snapshotStatus/i.test(message)) return 'snapshot_not_approved'
  return 'authority_unverified'
}

function currentTime(options: EditReferencePreviousApprovedEditAdapterOptions): string {
  return options.now?.() ?? new Date().toISOString()
}
