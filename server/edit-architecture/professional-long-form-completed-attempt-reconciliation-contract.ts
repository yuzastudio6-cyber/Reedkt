import { z } from 'zod'

import {
  canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
} from '../validation/canonical-private-package-work-queue-schemas'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const PROFESSIONAL_LONG_FORM_COMPLETION_PROPOSAL_VERSION =
  'professional-long-form-completion-proposal-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const blobRef = z.object({
  sha256,
  byteLength: z.number().int().positive().max(2 * 1024 * 1024),
}).strict()

export const professionalLongFormCompletionProposalSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_COMPLETION_PROPOSAL_VERSION),
  source: z.literal(
    'canonical_professional_long_form_completion_reconciliation_service',
  ),
  identity: z.object({
    ownerUserId: identity,
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    queueDefinitionHash: sha256,
    jobId: identity,
    approvedWorkItemId: identity,
    workItemKey: identity,
    authorizationId: identity,
    authorityHash: sha256,
    executionAttemptId: identity,
    executionAttemptHash: sha256,
    executionStartedAt: timestamp,
    claimId: identity,
    initialClaimHash: sha256,
    claimHashAtProposal: sha256,
    deliveryAttempt: z.union([z.literal(1), z.literal(2)]),
  }).strict(),
  outcome: canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
  evidence: z.object({
    canonicalResultHash: sha256,
    attemptInternalCostEvidenceHash: sha256,
    terminalEvidenceRef: blobRef,
  }).strict(),
  recordedAt: timestamp,
  boundaries: z.object({
    exactApprovedSnapshotAndWorkItemBound: z.literal(true),
    oneUseExecutionAttemptBound: z.literal(true),
    exactPrivateTerminalAndArtifactEvidenceRequired: z.literal(true),
    completedAttemptInternalCostRequired: z.literal(true),
    plaintextClaimCredentialPersisted: z.literal(false),
    secondToolExecutionAuthorized: z.literal(false),
    automaticRetryAuthorized: z.literal(false),
    customerPriceAuthorityIncluded: z.literal(false),
    customerCreditAuthorityIncluded: z.literal(false),
    serviceFeeAuthorityIncluded: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    billingAuthorized: z.literal(false),
    distributedDatabaseVerified: z.literal(false),
    liveGoogleCloudVerified: z.literal(false),
    productReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  proposalHash: sha256,
}).strict().superRefine((proposal, context) => {
  const { proposalHash, ...payload } = proposal
  const completion = proposal.outcome.professionalLongFormExecution
  if (
    proposalHash !== sha256AuthorityValue(payload) ||
    !completion ||
    proposal.outcome.jobId !== proposal.identity.jobId ||
    proposal.outcome.approvedWorkItemId !==
      proposal.identity.approvedWorkItemId ||
    proposal.outcome.workItemKey !== proposal.identity.workItemKey ||
    completion.executionAttemptId !== proposal.identity.executionAttemptId ||
    completion.authorizationId !== proposal.identity.authorizationId ||
    completion.authorityHash !== proposal.identity.authorityHash ||
    completion.canonicalResultHash !== proposal.evidence.canonicalResultHash ||
    completion.attemptInternalCostEvidenceHash !==
      proposal.evidence.attemptInternalCostEvidenceHash ||
    completion.terminalEvidenceRef.sha256 !==
      proposal.evidence.terminalEvidenceRef.sha256 ||
    completion.terminalEvidenceRef.byteLength !==
      proposal.evidence.terminalEvidenceRef.byteLength ||
    Date.parse(proposal.recordedAt) <
      Date.parse(proposal.identity.executionStartedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Professional long-form completion proposal lineage is invalid.',
    })
  }
})

export type ProfessionalLongFormCompletionProposal = z.infer<
  typeof professionalLongFormCompletionProposalSchema
>

export function buildProfessionalLongFormCompletionProposal(input: {
  identity: ProfessionalLongFormCompletionProposal['identity']
  outcome: ProfessionalLongFormCompletionProposal['outcome']
  recordedAt: string
}): ProfessionalLongFormCompletionProposal {
  const completion = input.outcome.professionalLongFormExecution
  if (!completion) {
    throw new Error(
      'Professional long-form completion proposal requires exact execution evidence.',
    )
  }
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_COMPLETION_PROPOSAL_VERSION,
    source:
      'canonical_professional_long_form_completion_reconciliation_service' as const,
    identity: input.identity,
    outcome: input.outcome,
    evidence: {
      canonicalResultHash: completion.canonicalResultHash,
      attemptInternalCostEvidenceHash:
        completion.attemptInternalCostEvidenceHash,
      terminalEvidenceRef: completion.terminalEvidenceRef,
    },
    recordedAt: input.recordedAt,
    boundaries: {
      exactApprovedSnapshotAndWorkItemBound: true as const,
      oneUseExecutionAttemptBound: true as const,
      exactPrivateTerminalAndArtifactEvidenceRequired: true as const,
      completedAttemptInternalCostRequired: true as const,
      plaintextClaimCredentialPersisted: false as const,
      secondToolExecutionAuthorized: false as const,
      automaticRetryAuthorized: false as const,
      customerPriceAuthorityIncluded: false as const,
      customerCreditAuthorityIncluded: false as const,
      serviceFeeAuthorityIncluded: false as const,
      walletMutationAuthorized: false as const,
      billingAuthorized: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return professionalLongFormCompletionProposalSchema.parse({
    ...payload,
    proposalHash: sha256AuthorityValue(payload),
  })
}
