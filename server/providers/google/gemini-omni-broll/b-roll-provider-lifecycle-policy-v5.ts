import { z } from 'zod'

import { hashSkillValue } from '../../../edit-skills/core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../../edit-skills/core/skill-capability-manifest-schema'
import {
  BROLL_PROVIDER_BOUNDARY_PROFILE_ID,
  BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
  BROLL_PROVIDER_OPERATION_ID,
  BROLL_PROVIDER_ROUTE_ID,
} from './b-roll-provider-authority-v5'

export const BROLL_PROVIDER_LIFECYCLE_POLICY_V5_VERSION =
  'gemini_omni_b_roll_lifecycle_policy_v5' as const

const lifecyclePolicyCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_LIFECYCLE_POLICY_V5_VERSION),
  operationId: z.literal(BROLL_PROVIDER_OPERATION_ID),
  providerBoundaryProfileId: z.literal(BROLL_PROVIDER_BOUNDARY_PROFILE_ID),
  providerRouteId: z.literal(BROLL_PROVIDER_ROUTE_ID),
  configuredModelAlias: z.literal(BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS),
  maximumSecretPayloadReads: z.literal(1),
  maximumGenerationSubmissionsPerAttempt: z.literal(1),
  maximumUploadSubmissionsPerAttempt: z.literal(1),
  maximumUploadStatusReads: z.literal(20),
  maximumInteractionStatusReads: z.literal(20),
  maximumResultMetadataReads: z.literal(1),
  maximumBinaryDownloads: z.literal(1),
  maximumRedirects: z.literal(0),
  maximumAutomaticRetries: z.literal(0),
  maximumAutomaticProviderFallbacks: z.literal(0),
  maximumApprovedRefinementsPerConcept: z.literal(1),
  maximumCandidateVersionsPerConcept: z.literal(2),
  oneUseDispatchRequired: z.literal(true),
  freshApprovedPackageRequiredForNewSubmission: z.literal(true),
  unknownOutcomeRequiresReconciliation: z.literal(true),
  privateCreateOnlyOutputRequired: z.literal(true),
  checksumReadbackRequired: z.literal(true),
  rawSecretPersistenceAllowed: z.literal(false),
  providerUrlPersistenceAllowed: z.literal(false),
  temporaryDownloadUrlPersistenceAllowed: z.literal(false),
  rawRequestPersistenceAllowed: z.literal(false),
  rawResponsePersistenceAllowed: z.literal(false),
  transportActivated: z.literal(false),
  qualificationStatus: z.literal('internal_injected_only'),
}).strict()

export const brollProviderLifecyclePolicyV5Schema = lifecyclePolicyCoreSchema.extend({
  policyHash: skillSha256Schema,
}).strict().superRefine((policy, context) => {
  const { policyHash, ...core } = policy
  if (hashSkillValue(core) !== policyHash) {
    context.addIssue({ code: 'custom', message: 'B-roll provider lifecycle V5 policy hash is invalid.' })
  }
})

export type BrollProviderLifecyclePolicyV5 = z.infer<
  typeof brollProviderLifecyclePolicyV5Schema
>

export function createBrollProviderLifecyclePolicyV5(): BrollProviderLifecyclePolicyV5 {
  const core = lifecyclePolicyCoreSchema.parse({
    schemaVersion: BROLL_PROVIDER_LIFECYCLE_POLICY_V5_VERSION,
    operationId: BROLL_PROVIDER_OPERATION_ID,
    providerBoundaryProfileId: BROLL_PROVIDER_BOUNDARY_PROFILE_ID,
    providerRouteId: BROLL_PROVIDER_ROUTE_ID,
    configuredModelAlias: BROLL_PROVIDER_CONFIGURED_MODEL_ALIAS,
    maximumSecretPayloadReads: 1,
    maximumGenerationSubmissionsPerAttempt: 1,
    maximumUploadSubmissionsPerAttempt: 1,
    maximumUploadStatusReads: 20,
    maximumInteractionStatusReads: 20,
    maximumResultMetadataReads: 1,
    maximumBinaryDownloads: 1,
    maximumRedirects: 0,
    maximumAutomaticRetries: 0,
    maximumAutomaticProviderFallbacks: 0,
    maximumApprovedRefinementsPerConcept: 1,
    maximumCandidateVersionsPerConcept: 2,
    oneUseDispatchRequired: true,
    freshApprovedPackageRequiredForNewSubmission: true,
    unknownOutcomeRequiresReconciliation: true,
    privateCreateOnlyOutputRequired: true,
    checksumReadbackRequired: true,
    rawSecretPersistenceAllowed: false,
    providerUrlPersistenceAllowed: false,
    temporaryDownloadUrlPersistenceAllowed: false,
    rawRequestPersistenceAllowed: false,
    rawResponsePersistenceAllowed: false,
    transportActivated: false,
    qualificationStatus: 'internal_injected_only',
  })
  return brollProviderLifecyclePolicyV5Schema.parse({
    ...core,
    policyHash: hashSkillValue(core),
  })
}
