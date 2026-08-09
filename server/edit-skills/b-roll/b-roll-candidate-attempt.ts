import { z } from 'zod'

import {
  brollProviderConsumerReceiptV5Schema,
  brollProviderInjectedLifecycleStateV5Schema,
  type BrollProviderConsumerReceiptV5,
  type BrollProviderInjectedLifecycleStateV5,
} from '../../providers/google/gemini-omni-broll/b-roll-provider-injected-lifecycle-v5'
import {
  brollProviderRequestPackageV5Schema,
  type BrollProviderRequestPackageV5,
} from '../../providers/google/gemini-omni-broll/b-roll-provider-authority-v5'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../core/skill-capability-manifest-schema'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))

const outputSchema = z.object({
  outputId: identity,
  artifactType: z.literal('provider_b_roll_candidate_video_mp4'),
  contentType: z.literal('video/mp4'),
  privateObjectIdentityHash: skillSha256Schema,
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

const costSchema = z.object({
  providerCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  infrastructureCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  totalInternalCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  serviceFeeIncluded: z.literal(false),
  costEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  if (value.providerCostMicros + value.infrastructureCostMicros !== value.totalInternalCostMicros) {
    context.addIssue({ code: 'custom', message: 'B-roll candidate attempt cost is inconsistent.' })
  }
})

const attemptCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_attempt_evidence_v1'),
  attemptClass: z.enum([
    'initial_injected_nonprovider',
    'refinement_injected_nonprovider',
    'live_owner_confirmed_canary',
  ]),
  candidateVersionNumber: z.union([z.literal(1), z.literal(2)]),
  attemptId: skillSha256Schema,
  authorizationHash: skillSha256Schema,
  requestPackageHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  providerRouteId: z.literal('gemini_omni_flash'),
  configuredModelAlias: z.literal('gemini-omni-flash-preview'),
  interactionIdDigest: skillSha256Schema,
  providerConversationProven: z.boolean(),
  unknownOutcomeReconciled: z.literal(true),
  output: outputSchema,
  cost: costSchema,
  generationSubmissionCount: z.union([z.literal(0), z.literal(1)]),
  automaticRetryCount: z.literal(0),
  alternateProviderFallbackCount: z.literal(0),
  exactReplaySupported: z.literal(true),
  productionEligible: z.literal(false),
}).strict()

export const brollCandidateAttemptEvidenceSchema = attemptCoreSchema.extend({
  attemptEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { attemptEvidenceHash, ...core } = value
  if (hashSkillValue(core) !== attemptEvidenceHash ||
      (value.attemptClass === 'live_owner_confirmed_canary') !==
        value.providerConversationProven ||
      (value.candidateVersionNumber === 1) !==
        (value.attemptClass !== 'refinement_injected_nonprovider')) {
    context.addIssue({ code: 'custom', message: 'B-roll candidate attempt evidence is invalid.' })
  }
})

export type BrollCandidateAttemptEvidence = z.infer<
  typeof brollCandidateAttemptEvidenceSchema
>

export function createInitialInjectedBrollCandidateAttemptEvidence(input: {
  state: BrollProviderInjectedLifecycleStateV5
  consumerReceipt: BrollProviderConsumerReceiptV5
  requestPackage: BrollProviderRequestPackageV5
  injectedInteractionIdDigest: string
}): BrollCandidateAttemptEvidence {
  const state = brollProviderInjectedLifecycleStateV5Schema.parse(input.state)
  const receipt = brollProviderConsumerReceiptV5Schema.parse(input.consumerReceipt)
  const request = brollProviderRequestPackageV5Schema.parse(input.requestPackage)
  if (
    !['succeeded', 'reconciled_succeeded'].includes(state.state) || !state.output ||
    state.attemptId !== receipt.attemptId ||
    state.authorizationHash !== receipt.authorizationHash ||
    state.requestPackageHash !== request.requestPackageHash ||
    receipt.requestPackageHash !== request.requestPackageHash ||
    receipt.assignmentHash !== request.assignmentHash ||
    receipt.planHash !== request.planHash ||
    receipt.output.sha256 !== state.output.sha256 ||
    receipt.output.privateObjectIdentityHash !== state.output.privateObjectIdentityHash
  ) throw new Error('Initial injected B-roll attempt lost provider lifecycle lineage.')
  const costCore = {
    providerCostMicros: state.cost.providerCostMicros,
    infrastructureCostMicros: state.cost.infrastructureCostMicros,
    totalInternalCostMicros: state.cost.totalInternalCostMicros,
    serviceFeeIncluded: false as const,
  }
  const core = attemptCoreSchema.parse({
    schemaVersion: 'b_roll_candidate_attempt_evidence_v1',
    attemptClass: 'initial_injected_nonprovider',
    candidateVersionNumber: 1,
    attemptId: state.attemptId,
    authorizationHash: state.authorizationHash,
    requestPackageHash: request.requestPackageHash,
    assignmentHash: request.assignmentHash,
    planHash: request.planHash,
    providerRouteId: request.providerRouteId,
    configuredModelAlias: request.configuredModelAlias,
    interactionIdDigest: input.injectedInteractionIdDigest,
    providerConversationProven: false,
    unknownOutcomeReconciled: true,
    output: {
      outputId: receipt.output.outputId,
      artifactType: receipt.output.artifactType,
      contentType: receipt.output.contentType,
      privateObjectIdentityHash: receipt.output.privateObjectIdentityHash,
      sha256: receipt.output.sha256,
      byteLength: receipt.output.byteLength,
      createOnly: receipt.output.createOnly,
      checksumReadbackVerified: receipt.output.checksumReadbackVerified,
      automaticSelectionAllowed: receipt.output.automaticSelectionAllowed,
      timelineMutationAllowed: receipt.output.timelineMutationAllowed,
    },
    cost: { ...costCore, costEvidenceHash: hashSkillValue(costCore) },
    generationSubmissionCount: state.cost.generationSubmissionCount,
    automaticRetryCount: 0,
    alternateProviderFallbackCount: 0,
    exactReplaySupported: true,
    productionEligible: false,
  })
  return brollCandidateAttemptEvidenceSchema.parse({
    ...core,
    attemptEvidenceHash: hashSkillValue(core),
  })
}

export function createRefinementInjectedBrollCandidateAttemptEvidence(input: {
  attemptId: string
  authorizationHash: string
  requestPackageHash: string
  assignmentHash: string
  planHash: string
  interactionIdDigest: string
  output: z.input<typeof outputSchema>
  providerCostMicros: number
  infrastructureCostMicros: number
}): BrollCandidateAttemptEvidence {
  const costCore = {
    providerCostMicros: input.providerCostMicros,
    infrastructureCostMicros: input.infrastructureCostMicros,
    totalInternalCostMicros: input.providerCostMicros + input.infrastructureCostMicros,
    serviceFeeIncluded: false as const,
  }
  const core = attemptCoreSchema.parse({
    schemaVersion: 'b_roll_candidate_attempt_evidence_v1',
    attemptClass: 'refinement_injected_nonprovider',
    candidateVersionNumber: 2,
    attemptId: input.attemptId,
    authorizationHash: input.authorizationHash,
    requestPackageHash: input.requestPackageHash,
    assignmentHash: input.assignmentHash,
    planHash: input.planHash,
    providerRouteId: 'gemini_omni_flash',
    configuredModelAlias: 'gemini-omni-flash-preview',
    interactionIdDigest: input.interactionIdDigest,
    providerConversationProven: false,
    unknownOutcomeReconciled: true,
    output: input.output,
    cost: { ...costCore, costEvidenceHash: hashSkillValue(costCore) },
    generationSubmissionCount: 0,
    automaticRetryCount: 0,
    alternateProviderFallbackCount: 0,
    exactReplaySupported: true,
    productionEligible: false,
  })
  return brollCandidateAttemptEvidenceSchema.parse({
    ...core,
    attemptEvidenceHash: hashSkillValue(core),
  })
}
