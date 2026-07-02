import { z } from 'zod'
import {
  CREDIT_TOP_UP_REASONS,
} from '../../src/types/credits'
import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'
import { idSchema } from './common-schemas'
import { secretSafeJsonObjectSchema } from './credit-data-schemas'

export const creditTopUpReasonSchema = z.enum(CREDIT_TOP_UP_REASONS)

const optionalRelatedIds = {
  relatedProjectId: idSchema.nullish(),
  relatedCreditEstimateId: idSchema.nullish(),
  relatedCreditReservationId: idSchema.nullish(),
  relatedCreditSettlementId: idSchema.nullish(),
  relatedCreditRevisionActionId: idSchema.nullish(),
}

export const createMockCreditTopUpSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema,
  creditWalletId: idSchema,
  creditPackId: idSchema,
  customCredits: z.number().optional(),
  topUpReason: creditTopUpReasonSchema,
  ...optionalRelatedIds,
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine((value, context) => {
  rejectCustomCredits(value.customCredits, context)
  rejectRealProviderMetadata(value.metadata, context)
})

export const completeMockCreditTopUpSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema,
  creditWalletId: idSchema,
  topUpIntentId: idSchema.optional(),
  creditPackId: idSchema.optional(),
  customCredits: z.number().optional(),
  topUpReason: creditTopUpReasonSchema,
  ...optionalRelatedIds,
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine((value, context) => {
  rejectCustomCredits(value.customCredits, context)
  rejectRealProviderMetadata(value.metadata, context)
  if (!value.topUpIntentId && !value.creditPackId) {
    context.addIssue({
      code: 'custom',
      message: 'Either topUpIntentId or creditPackId is required for mock top-up completion.',
      path: ['creditPackId'],
    })
  }
})

export const suggestCreditTopUpSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema.optional(),
  creditWalletId: idSchema,
  topUpReason: creditTopUpReasonSchema,
  ...optionalRelatedIds,
  requestedCredits: z.number().int().nonnegative().optional(),
  metadata: secretSafeJsonObjectSchema.default({}),
}).strict().superRefine((value, context) => {
  rejectRealProviderMetadata(value.metadata, context)
})

function rejectCustomCredits(value: number | undefined, context: z.RefinementCtx): void {
  if (value !== undefined) {
    context.addIssue({
      code: 'custom',
      message: 'customCredits is not supported in RP-CREDITPURCHASE-01; choose a fixed mock credit pack.',
      path: ['customCredits'],
    })
  }
}

function rejectRealProviderMetadata(value: Record<string, unknown>, context: z.RefinementCtx): void {
  const providerPaths = findRealProviderLikePaths(value)
  if (providerPaths.length > 0) {
    context.addIssue({
      code: 'custom',
      message: `Mock credit top-up metadata cannot include real payment provider names: ${providerPaths.join(', ')}`,
      path: ['metadata'],
    })
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  if (secretLikePaths.length > 0) {
    context.addIssue({
      code: 'custom',
      message: `Metadata or payload contains secret-like fields: ${secretLikePaths.join(', ')}`,
      path: ['metadata'],
    })
  }
}

function findRealProviderLikePaths(value: unknown, path: string[] = []): string[] {
  if (typeof value === 'string') {
    return /\b(stripe|paypal|adyen|braintree|checkout\.com)\b/i.test(value)
      ? [path.join('.') || '<root>']
      : []
  }
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findRealProviderLikePaths(item, [...path, String(index)]))
  }
  return Object.entries(value).flatMap(([key, child]) => {
    const keyPath = [...path, key]
    const keyHit = /\b(stripe|paypal|adyen|braintree|checkout\.com)\b/i.test(key) ? [keyPath.join('.')] : []
    return [...keyHit, ...findRealProviderLikePaths(child, keyPath)]
  })
}
