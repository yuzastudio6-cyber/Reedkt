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
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION,
  professionalLongFormMasterTimingAuthorizationReceiptSchema,
  professionalLongFormMasterTimingCompletionSchema,
  professionalLongFormMasterTimingExecutionAttemptSchema,
  professionalLongFormMasterTimingExecutionAuthoritySchema,
} from './professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION,
  professionalLongFormFirstObjectChunkQaAttemptSchema,
  professionalLongFormFirstObjectChunkQaAuthoritySchema,
  professionalLongFormFirstObjectChunkQaAuthorizationSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  professionalLongFormFirstObjectChunkRenderAttemptSchema,
  professionalLongFormFirstObjectChunkRenderAuthoritySchema,
  professionalLongFormFirstObjectChunkRenderAuthorizationSchema,
  professionalLongFormFirstObjectChunkRenderCompletionSchema,
} from './professional-long-form-first-object-chunk-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION,
  professionalLongFormContinuousProgramAudioAttemptSchema,
  professionalLongFormContinuousProgramAudioAuthoritySchema,
  professionalLongFormContinuousProgramAudioAuthorizationSchema,
  professionalLongFormContinuousProgramAudioCompletionSchema,
} from './professional-long-form-continuous-program-audio-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION,
  professionalLongFormCrossChunkColorAttemptSchema,
  professionalLongFormCrossChunkColorAuthoritySchema,
  professionalLongFormCrossChunkColorAuthorizationSchema,
  professionalLongFormCrossChunkColorCompletionSchema,
} from './professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION,
  professionalLongFormMasterAssemblyAttemptSchema,
  professionalLongFormMasterAssemblyAuthoritySchema,
  professionalLongFormMasterAssemblyAuthorizationSchema,
  professionalLongFormMasterAssemblyCompletionSchema,
} from './professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION,
  professionalLongFormPrivateMasterQaAttemptSchema,
  professionalLongFormPrivateMasterQaAuthoritySchema,
  professionalLongFormPrivateMasterQaAuthorizationSchema,
  professionalLongFormPrivateMasterQaCompletionSchema,
} from './professional-long-form-private-master-qa-execution-contract'

export const professionalLongFormAuthorizedChildAuthorizationReceiptSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildAuthorizationReceiptSchema,
    professionalLongFormSourceAuthorityAuthorizationReceiptSchema,
    professionalLongFormMasterTimingAuthorizationReceiptSchema,
    professionalLongFormFirstObjectChunkRenderAuthorizationSchema,
    professionalLongFormFirstObjectChunkQaAuthorizationSchema,
    professionalLongFormContinuousProgramAudioAuthorizationSchema,
    professionalLongFormCrossChunkColorAuthorizationSchema,
    professionalLongFormMasterAssemblyAuthorizationSchema,
    professionalLongFormPrivateMasterQaAuthorizationSchema,
  ])

export const professionalLongFormAuthorizedChildExecutionAuthoritySchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildExecutionAuthoritySchema,
    professionalLongFormSourceAuthorityExecutionAuthoritySchema,
    professionalLongFormMasterTimingExecutionAuthoritySchema,
    professionalLongFormFirstObjectChunkRenderAuthoritySchema,
    professionalLongFormFirstObjectChunkQaAuthoritySchema,
    professionalLongFormContinuousProgramAudioAuthoritySchema,
    professionalLongFormCrossChunkColorAuthoritySchema,
    professionalLongFormMasterAssemblyAuthoritySchema,
    professionalLongFormPrivateMasterQaAuthoritySchema,
  ])

export const professionalLongFormAuthorizedChildExecutionAttemptSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildExecutionAttemptSchema,
    professionalLongFormSourceAuthorityExecutionAttemptSchema,
    professionalLongFormMasterTimingExecutionAttemptSchema,
    professionalLongFormFirstObjectChunkRenderAttemptSchema,
    professionalLongFormFirstObjectChunkQaAttemptSchema,
    professionalLongFormContinuousProgramAudioAttemptSchema,
    professionalLongFormCrossChunkColorAttemptSchema,
    professionalLongFormMasterAssemblyAttemptSchema,
    professionalLongFormPrivateMasterQaAttemptSchema,
  ])

export const professionalLongFormAuthorizedChildCompletionSchema =
  z.discriminatedUnion('schemaVersion', [
    professionalLongFormFirstChildCompletionSchema,
    professionalLongFormSourceAuthorityCompletionSchema,
    professionalLongFormMasterTimingCompletionSchema,
    professionalLongFormFirstObjectChunkRenderCompletionSchema,
    professionalLongFormFirstObjectChunkQaCompletionSchema,
    professionalLongFormContinuousProgramAudioCompletionSchema,
    professionalLongFormCrossChunkColorCompletionSchema,
    professionalLongFormMasterAssemblyCompletionSchema,
    professionalLongFormPrivateMasterQaCompletionSchema,
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

export function isProfessionalLongFormMasterTimingAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormMasterTimingAuthorizationReceiptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_AUTHORIZATION_RECEIPT_VERSION
}

export function isProfessionalLongFormFirstObjectChunkRenderAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormFirstObjectChunkQaAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormFirstObjectChunkQaAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormContinuousProgramAudioAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormContinuousProgramAudioAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormCrossChunkColorAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormCrossChunkColorAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormMasterAssemblyAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormMasterAssemblyAuthorizationSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormPrivateMasterQaAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormPrivateMasterQaAuthorizationSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORIZATION_VERSION
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

export function isProfessionalLongFormMasterTimingExecutionAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormMasterTimingExecutionAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_AUTHORITY_VERSION
}

export function isProfessionalLongFormFirstObjectChunkRenderAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAuthoritySchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_AUTHORITY_VERSION
}

export function isProfessionalLongFormFirstObjectChunkQaAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormFirstObjectChunkQaAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_AUTHORITY_VERSION
}

export function isProfessionalLongFormContinuousProgramAudioAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<
  typeof professionalLongFormContinuousProgramAudioAuthoritySchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_AUTHORITY_VERSION
}

export function isProfessionalLongFormCrossChunkColorAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormCrossChunkColorAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_AUTHORITY_VERSION
}

export function isProfessionalLongFormMasterAssemblyAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormMasterAssemblyAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_AUTHORITY_VERSION
}

export function isProfessionalLongFormPrivateMasterQaAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormPrivateMasterQaAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_AUTHORITY_VERSION
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

export function isProfessionalLongFormMasterTimingExecutionAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormMasterTimingExecutionAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION
}

export function isProfessionalLongFormFirstObjectChunkRenderAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<
  typeof professionalLongFormFirstObjectChunkRenderAttemptSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION
}

export function isProfessionalLongFormFirstObjectChunkQaAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormFirstObjectChunkQaAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION
}

export function isProfessionalLongFormContinuousProgramAudioAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<
  typeof professionalLongFormContinuousProgramAudioAttemptSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION
}

export function isProfessionalLongFormCrossChunkColorAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormCrossChunkColorAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION
}

export function isProfessionalLongFormMasterAssemblyAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormMasterAssemblyAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION
}

export function isProfessionalLongFormPrivateMasterQaAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormPrivateMasterQaAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION
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

export function isProfessionalLongFormMasterTimingCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormMasterTimingCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COMPLETION_VERSION
}

export function isProfessionalLongFormFirstObjectChunkRenderCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<
  typeof professionalLongFormFirstObjectChunkRenderCompletionSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COMPLETION_VERSION
}

export function isProfessionalLongFormFirstObjectChunkQaCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormFirstObjectChunkQaCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COMPLETION_VERSION
}

export function isProfessionalLongFormContinuousProgramAudioCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<
  typeof professionalLongFormContinuousProgramAudioCompletionSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COMPLETION_VERSION
}

export function isProfessionalLongFormCrossChunkColorCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormCrossChunkColorCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COMPLETION_VERSION
}

export function isProfessionalLongFormMasterAssemblyCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormMasterAssemblyCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COMPLETION_VERSION
}

export function isProfessionalLongFormPrivateMasterQaCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormPrivateMasterQaCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COMPLETION_VERSION
}
