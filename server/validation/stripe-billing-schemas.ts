import { z } from 'zod'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import { containsRawStripeSecretValue } from '../services/stripe-billing-foundation-service'
import { idSchema } from './common-schemas'
import { secretSafeJsonObjectSchema } from './credit-data-schemas'

export const stripeOperationalModeSchema = z.enum(['test', 'live'])

const optionalRelatedIds = {
  relatedProjectId: idSchema.nullish(),
  relatedCreditEstimateId: idSchema.nullish(),
  relatedCreditReservationId: idSchema.nullish(),
  relatedCreditSettlementId: idSchema.nullish(),
  relatedCreditRevisionActionId: idSchema.nullish(),
}

const safeUrlSchema = z.string().url().superRefine((value, context) => {
  if (!/^https?:\/\//i.test(value)) {
    context.addIssue({
      code: 'custom',
      message: 'Stripe return URLs must use http or https.',
    })
  }
  if (containsRawStripeSecretValue(value)) {
    context.addIssue({
      code: 'custom',
      message: 'Stripe return URLs must not contain raw Stripe secrets.',
    })
  }
})

export const createStripeSetupIntentSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema,
  stripeMode: stripeOperationalModeSchema,
  returnUrl: safeUrlSchema.nullish(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine(rejectStripeSecrets)

export const createStripeCreditCheckoutSessionSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema,
  creditWalletId: idSchema,
  creditPackId: idSchema,
  stripeMode: stripeOperationalModeSchema,
  successUrl: safeUrlSchema,
  cancelUrl: safeUrlSchema,
  idempotencyKey: idSchema,
  ...optionalRelatedIds,
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine(rejectStripeSecrets)

export const createStripeWebhookMockSchema = z.object({
  stripeMode: stripeOperationalModeSchema,
  rawBody: z.string().min(1).nullish(),
  parsedJsonBody: secretSafeJsonObjectSchema.nullish(),
  stripeSignatureHeader: z.string().min(1).nullish(),
  stripeEventId: idSchema,
  eventType: z.string().min(1).max(160),
  relatedCheckoutSessionId: idSchema.nullish(),
  relatedPaymentIntentId: idSchema.nullish(),
  relatedSetupIntentId: idSchema.nullish(),
  relatedCustomerId: idSchema.nullish(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine(rejectStripeSecrets)

function rejectStripeSecrets(value: unknown, context: z.RefinementCtx): void {
  if (containsRawStripeSecretValue(value)) {
    context.addIssue({
      code: 'custom',
      message: 'Stripe billing payloads must not contain raw Stripe keys, restricted keys, publishable live keys, or webhook secrets.',
      path: ['stripeSecrets'],
    })
  }

  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  const allowedSecretReferencePaths = new Set([
    '$.parsedJsonBody',
    '$.metadata',
  ])
  const disallowedPaths = secretLikePaths.filter((path) => !allowedSecretReferencePaths.has(path))
  if (disallowedPaths.length > 0) {
    context.addIssue({
      code: 'custom',
      message: `Payload contains secret-like fields: ${disallowedPaths.join(', ')}`,
      path: ['secretLikePaths'],
    })
  }
}
