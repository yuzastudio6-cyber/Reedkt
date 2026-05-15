import type { RevisionRequestItemRecord, RevisionRequestRecord } from '../../types'
import type { CreateRevisionRequestRequest } from '../contracts/render-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createRevisionRequest(
  db: MockDatabase,
  input: CreateRevisionRequestRequest,
): ServiceResult<RevisionRequestRecord> {
  const revision: RevisionRequestRecord = {
    id: createMockId('revision-request'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    renderId: input.renderId,
    editPlanId: input.editPlanId,
    requestedChange: input.requestedChange,
    affectedSegmentIds: [],
    requiresNewGeneration: false,
    requiresNewRender: true,
    estimatedExtraCredits: 0,
    costLevel: 'needs_estimate',
    revisionScope: 'other',
    status: 'submitted',
    linkedEditPlanVersion: 1,
    linkedRenderId: input.renderId,
    approvalStatus: 'pending',
    submittedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      revisionCanComeFromChat: true,
      extraCreditsMayBeRequired: true,
    },
  }

  return ok(insertMockRecord(db, 'revisionRequests', revision))
}

export function createRevisionRequestItems(
  db: MockDatabase,
  revisionRequestId: string,
): ServiceResult<RevisionRequestItemRecord[]> {
  const revision = findMockRecord(db, 'revisionRequests', revisionRequestId)

  if (!revision) {
    return fail('REVISION_REQUEST_NOT_FOUND', `Revision request ${revisionRequestId} was not found.`)
  }

  const item: RevisionRequestItemRecord = {
    id: createMockId('revision-request-item'),
    revisionRequestId,
    workspaceId: revision.workspaceId ?? 'mock-workspace-reeditpro',
    projectId: revision.projectId,
    revisionScope: revision.revisionScope ?? 'other',
    timecodeSeconds: 4,
    description: revision.requestedChange,
    requiresNewGeneration: revision.requiresNewGeneration,
    requiresNewRender: revision.requiresNewRender ?? true,
    itemPayload: { mockOnly: true },
    createdAt: nowIso(),
  }

  return ok([insertMockRecord(db, 'revisionRequestItems', item)])
}

export function estimateRevisionCost(
  db: MockDatabase,
  revisionRequestId: string,
): ServiceResult<RevisionRequestRecord> {
  const revision = findMockRecord(db, 'revisionRequests', revisionRequestId)

  if (!revision) {
    return fail('REVISION_REQUEST_NOT_FOUND', `Revision request ${revisionRequestId} was not found.`)
  }

  revision.status = 'estimating'
  revision.estimatedExtraCredits = revision.requiresNewGeneration ? 12 : 3
  revision.costLevel = revision.requiresNewGeneration ? 'medium' : 'low'
  revision.updatedAt = nowIso()

  return ok(revision)
}

export function markRevisionNeedsGeneration(
  db: MockDatabase,
  revisionRequestId: string,
): ServiceResult<RevisionRequestRecord> {
  const revision = findMockRecord(db, 'revisionRequests', revisionRequestId)

  if (!revision) {
    return fail('REVISION_REQUEST_NOT_FOUND', `Revision request ${revisionRequestId} was not found.`)
  }

  revision.requiresNewGeneration = true
  revision.requiresNewRender = true
  revision.costLevel = 'needs_estimate'
  revision.updatedAt = nowIso()

  return ok(revision)
}

export function markRevisionCompleted(
  db: MockDatabase,
  revisionRequestId: string,
): ServiceResult<RevisionRequestRecord> {
  const revision = findMockRecord(db, 'revisionRequests', revisionRequestId)

  if (!revision) {
    return fail('REVISION_REQUEST_NOT_FOUND', `Revision request ${revisionRequestId} was not found.`)
  }

  revision.status = 'completed'
  revision.completedAt = nowIso()
  revision.updatedAt = nowIso()

  return ok(revision)
}
