import { z } from 'zod'
import {
  canonicalPlanComponentsSchema,
  publishCanonicalEditPlanSchema,
} from './edit-planning-authority-schemas'
import {
  planningInputAuthorityExpectationSchema,
  resolvedPlanningInputAuthorityBindingSchema,
} from './planning-input-authority-binding-schemas'
import {
  sourceBindingManifestCandidateSchema,
  sourceMediaAuthorityExpectationSchema,
  sourceSequenceAuthorityItemSchema,
} from './source-media-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

export const createCanonicalPlanningHandoffSchema = z.object({
  workspaceId: identity,
  purpose: z.literal('prepare_canonical_planning_handoff'),
  orderedSourceItems: z.array(sourceSequenceAuthorityItemSchema).min(1).max(1_000),
  canonicalPlanComponents: canonicalPlanComponentsSchema,
}).strict().superRefine((value, context) => {
  const sequenceIds = new Set<string>()
  const mediaAssetIds = new Set<string>()
  value.orderedSourceItems.forEach((item, index) => {
    if (item.uploadedOrder !== index + 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orderedSourceItems', index, 'uploadedOrder'],
        message: 'Source order must be contiguous, one-based, and match array order.',
      })
    }
    if (sequenceIds.has(item.sourceSequenceItemId) || mediaAssetIds.has(item.mediaAssetId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orderedSourceItems', index],
        message: 'Source sequence and media-asset identities must be unique.',
      })
    }
    sequenceIds.add(item.sourceSequenceItemId)
    mediaAssetIds.add(item.mediaAssetId)
  })
})

export const canonicalPlanningHandoffResponseSchema = z.object({
  schemaVersion: z.literal('canonical-planning-handoff-response-v1'),
  source: z.literal('canonical_planning_handoff_service'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
  }).strict(),
  canonicalPlanComponentsHash: sha,
  sourceBindingManifestCandidate: sourceBindingManifestCandidateSchema,
  sourceMediaAuthority: sourceMediaAuthorityExpectationSchema,
  planningInputAuthority: planningInputAuthorityExpectationSchema,
  resolvedPlanningInputAuthority: resolvedPlanningInputAuthorityBindingSchema,
  readiness: z.object({
    finalizedSourceMediaVerified: z.literal(true),
    exactEditPreferencesVerified: z.literal(true),
    preferenceApplicationVerified: z.literal(true),
    editBriefVerified: z.literal(true),
    outputFrameAndCleanupVerified: z.literal(true),
    readyForCanonicalPlanPublication: z.literal(true),
  }).strict(),
  handoffHash: sha,
  handoffId: identity,
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    createOnly: z.literal(true),
    checksumProtected: z.literal(true),
    contentAddressed: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  noPlanPublished: z.literal(true),
  noSnapshotCreated: z.literal(true),
  noCreditReservation: z.literal(true),
  noToolExecution: z.literal(true),
  noProviderCall: z.literal(true),
  noRender: z.literal(true),
  testOnly: z.literal(true),
}).strict()

export const publishCanonicalEditPlanFromHandoffSchema = publishCanonicalEditPlanSchema
  .omit({ planningInputAuthority: true, sourceMediaAuthority: true })
  .extend({ expectedHandoffHash: sha })
  .strict()

export const canonicalPlanningHandoffPublicationBindingSchema = z.object({
  schemaVersion: z.literal('canonical-planning-handoff-publication-binding-v1'),
  handoffId: identity,
  handoffHash: sha,
  canonicalPlanComponentsHash: sha,
  sourceCandidateHash: sha,
  planningInputBindingHash: sha,
  privateLocalCreateOnlyAuthority: z.literal(true),
  revalidatedBeforePublication: z.literal(true),
  distributedAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export type CreateCanonicalPlanningHandoffBody = z.infer<
  typeof createCanonicalPlanningHandoffSchema
>
export type CanonicalPlanningHandoffResponse = z.infer<
  typeof canonicalPlanningHandoffResponseSchema
>
export type PublishCanonicalEditPlanFromHandoffBody = z.infer<
  typeof publishCanonicalEditPlanFromHandoffSchema
>
export type CanonicalPlanningHandoffPublicationBinding = z.infer<
  typeof canonicalPlanningHandoffPublicationBindingSchema
>
