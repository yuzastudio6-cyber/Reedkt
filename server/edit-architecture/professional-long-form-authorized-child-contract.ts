import { z } from 'zod'

import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION,
  professionalLongFormFirstChildAuthorizationReceiptSchema,
  professionalLongFormFirstChildCompletionSchema,
  professionalLongFormFirstChildExecutionAttemptSchema,
  professionalLongFormFirstChildExecutionAuthoritySchema,
} from './professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION,
  professionalLongFormSourceAuthorityAuthorizationReceiptSchema,
  professionalLongFormSourceAuthorityCompletionSchema,
  professionalLongFormSourceAuthorityExecutionAttemptSchema,
  professionalLongFormSourceAuthorityExecutionAuthoritySchema,
} from './professional-long-form-source-authority-execution-contract'

export const professionalLongFormAuthorizedChildAuthorizationReceiptSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildAuthorizationReceiptSchema,
    professionalLongFormSourceAuthorityAuthorizationReceiptSchema,
  ])

export const professionalLongFormAuthorizedChildExecutionAuthoritySchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildExecutionAuthoritySchema,
    professionalLongFormSourceAuthorityExecutionAuthoritySchema,
  ])

export const professionalLongFormAuthorizedChildExecutionAttemptSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildExecutionAttemptSchema,
    professionalLongFormSourceAuthorityExecutionAttemptSchema,
  ])

export const professionalLongFormAuthorizedChildCompletionSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildCompletionSchema,
    professionalLongFormSourceAuthorityCompletionSchema,
  ])

export type ProfessionalLongFormAuthorizedChildAuthorizationReceipt = z.infer<
  typeof professionalLongFormAuthorizedChildAuthorizationReceiptSchema
>
export type ProfessionalLongFormAuthorizedChildExecutionAuthority = z.infer<
  typeof professionalLongFormAuthorizedChildExecutionAuthoritySchema
>
export type ProfessionalLongFormAuthorizedChildExecutionAttempt = z.infer<
  typeof professionalLongFormAuthorizedChildExecutionAttemptSchema
>
export type ProfessionalLongFormAuthorizedChildCompletion = z.infer<
  typeof professionalLongFormAuthorizedChildCompletionSchema
>

export function isProfessionalLongFormFirstChildAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormFirstChildAuthorizationReceiptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_AUTHORIZATION_RECEIPT_VERSION
}

export function isProfessionalLongFormSourceAuthorityAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormSourceAuthorityAuthorizationReceiptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_AUTHORIZATION_RECEIPT_VERSION
}

export function isProfessionalLongFormFirstChildExecutionAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormFirstChildExecutionAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_AUTHORITY_VERSION
}

export function isProfessionalLongFormSourceAuthorityExecutionAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormSourceAuthorityExecutionAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_AUTHORITY_VERSION
}

export function isProfessionalLongFormFirstChildExecutionAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormFirstChildExecutionAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION
}

export function isProfessionalLongFormSourceAuthorityExecutionAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormSourceAuthorityExecutionAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION
}

export function isProfessionalLongFormFirstChildCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormFirstChildCompletionSchema> {
  return value.schemaVersion === PROFESSIONAL_LONG_FORM_FIRST_CHILD_COMPLETION_VERSION
}

export function isProfessionalLongFormSourceAuthorityCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormSourceAuthorityCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COMPLETION_VERSION
}
