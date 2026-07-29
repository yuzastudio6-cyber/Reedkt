import { z } from 'zod'

import {
  canonicalRevisionPlanPresentationReceiptSchema,
} from './canonical-revision-plan-presentation-schemas'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const presentCanonicalSourceLedCaptionRevisionSchema = z.object({
  workspaceId: identity,
  expectedPackageRecordId: identity,
  expectedReviewAssemblyId: identity,
  expectedDecisionManifestSha256: sha256,
  expectedFinalArtifactSha256: sha256,
  purpose: z.literal('present_server_derived_source_led_caption_revision'),
}).strict()

export const canonicalSourceLedCaptionRevisionPresentationSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-led-caption-revision-presentation-v1',
  ),
  source: z.literal(
    'canonical_source_led_caption_revision_plan_presentation_service',
  ),
  purpose: z.literal('present_server_derived_source_led_caption_revision'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    priorReviewAssemblyId: identity,
    priorApprovedSnapshotId: identity,
  }).strict(),
  derivation: z.object({
    exactRevisionDecisionReread: z.literal(true),
    priorApprovedSnapshotReread: z.literal(true),
    finalizedSourceObjectsReread: z.literal(true),
    exactLockedPreferencesReread: z.literal(true),
    immutableEditBriefReread: z.literal(true),
    exactCaptionReplacementApplied: z.literal(true),
    revisionIntentHash: sha256,
    sourceCount: z.number().int().min(1).max(8),
    captionCueCount: z.literal(1),
    browserPlanAccepted: z.literal(false),
    browserTimingAccepted: z.literal(false),
    browserEstimateAccepted: z.literal(false),
    browserWorkGraphAccepted: z.literal(false),
    browserCaptionTextAcceptedAtPlanning: z.literal(false),
  }).strict(),
  revisionPresentation:
    canonicalRevisionPlanPresentationReceiptSchema,
  permissions: z.object({
    replacementPlanPresented: z.literal(true),
    freshApprovalRequired: z.literal(true),
    snapshotCreated: z.literal(false),
    creditReserved: z.literal(false),
    workGraphStarted: z.literal(false),
    toolExecutionStarted: z.literal(false),
    renderStarted: z.literal(false),
    deliveryStarted: z.literal(false),
  }).strict(),
  testOnly: z.literal(true),
}).strict()

export type PresentCanonicalSourceLedCaptionRevisionBody = z.infer<
  typeof presentCanonicalSourceLedCaptionRevisionSchema
>

export type CanonicalSourceLedCaptionRevisionPresentation = z.infer<
  typeof canonicalSourceLedCaptionRevisionPresentationSchema
>
