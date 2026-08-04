import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  professionalLongFormCompletionProposalSchema,
  type ProfessionalLongFormCompletionProposal,
} from '../edit-architecture/professional-long-form-completed-attempt-reconciliation-contract'
import {
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalPrivatePackageWorkQueueStoreScope } from
  './private-canonical-package-work-queue-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

const MAX_PROPOSAL_BYTES = 512 * 1024

export async function persistPrivateProfessionalLongFormCompletionProposal(
  input: {
    scope: CanonicalPrivatePackageWorkQueueStoreScope
    proposal: ProfessionalLongFormCompletionProposal
  },
): Promise<{
  proposal: ProfessionalLongFormCompletionProposal
  disposition: 'recorded' | 'exact_replay'
}> {
  const proposal = professionalLongFormCompletionProposalSchema.parse(
    input.proposal,
  )
  assertScopeMatches(input.scope, proposal)
  const content = `${stableAuthorityStringify(proposal)}\n`
  assertByteLength(content)
  const relativePath = proposalRelativePath(input.scope, proposal.identity.executionAttemptId)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: `${relativePath}.lock`,
    operation: async () => {
      const written = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.scope.localStorageRoot,
        relativePath,
        content: Buffer.from(content, 'utf8'),
      })
      const reopened = await readPrivateProfessionalLongFormCompletionProposal({
        scope: input.scope,
        executionAttemptId: proposal.identity.executionAttemptId,
      })
      if (!reopened || reopened.proposalHash !== proposal.proposalHash) {
        throw invalid(
          'Professional long-form completion proposal did not reopen exactly.',
        )
      }
      return {
        proposal: reopened,
        disposition: written.created ? 'recorded' : 'exact_replay',
      }
    },
  })
}

export async function readPrivateProfessionalLongFormCompletionProposal(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionAttemptId: string
}): Promise<ProfessionalLongFormCompletionProposal | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: proposalRelativePath(input.scope, input.executionAttemptId),
  })
  if (content === undefined) return undefined
  assertByteLength(content, true)
  let decoded: unknown
  try {
    decoded = JSON.parse(content)
  } catch {
    throw invalid('Stored professional long-form completion proposal is not JSON.')
  }
  const proposal = professionalLongFormCompletionProposalSchema.safeParse(decoded)
  if (!proposal.success) {
    throw invalid('Stored professional long-form completion proposal is invalid.')
  }
  assertScopeMatches(input.scope, proposal.data)
  if (proposal.data.identity.executionAttemptId !== input.executionAttemptId) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Stored professional long-form completion proposal has conflicting identity.',
      409,
    )
  }
  return proposal.data
}

function proposalRelativePath(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  executionAttemptId: string,
): string {
  const scopeHash = sha256AuthorityValue({
    domain: 'private_professional_long_form_completion_proposal_scope_v1',
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
    packageRecordId: scope.packageRecordId,
  })
  const attemptHash = createHash('sha256')
    .update(executionAttemptId)
    .digest('hex')
  return [
    'private-professional-long-form-completion-proposals',
    'v1',
    scopeHash,
    `${attemptHash}.json`,
  ].join('/')
}

function assertScopeMatches(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  proposal: ProfessionalLongFormCompletionProposal,
): void {
  if (
    proposal.identity.ownerUserId !== scope.ownerUserId ||
    proposal.identity.workspaceId !== scope.workspaceId ||
    proposal.identity.projectId !== scope.projectId ||
    proposal.identity.editSessionId !== scope.editSessionId ||
    proposal.identity.approvedPlanSnapshotId !==
      scope.approvedPlanSnapshotId ||
    proposal.identity.packageRecordId !== scope.packageRecordId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Professional long-form completion proposal is outside the exact queue scope.',
      409,
    )
  }
}

function assertByteLength(content: string, existing = false): void {
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength < 2 || byteLength > MAX_PROPOSAL_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      `${existing ? 'Stored' : 'Proposed'} professional long-form completion evidence exceeds its private bound.`,
      503,
    )
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
