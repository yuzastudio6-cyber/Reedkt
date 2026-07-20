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
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION,
  professionalLongFormDeliveryH264AttemptSchema,
  professionalLongFormDeliveryH264AuthoritySchema,
  professionalLongFormDeliveryH264AuthorizationSchema,
  professionalLongFormDeliveryH264CompletionSchema,
  professionalLongFormDeliveryRootAttemptSchema,
  professionalLongFormDeliveryRootAuthoritySchema,
  professionalLongFormDeliveryRootAuthorizationSchema,
  professionalLongFormDeliveryRootCompletionSchema,
} from './professional-long-form-customer-delivery-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION,
  professionalLongFormDeliveryH264QaAttemptSchema,
  professionalLongFormDeliveryH264QaAuthoritySchema,
  professionalLongFormDeliveryH264QaAuthorizationSchema,
  professionalLongFormDeliveryH264QaCompletionSchema,
} from './professional-long-form-customer-delivery-h264-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION,
  professionalLongFormDeliveryMuxAttemptSchema,
  professionalLongFormDeliveryMuxAuthoritySchema,
  professionalLongFormDeliveryMuxAuthorizationSchema,
  professionalLongFormDeliveryMuxCompletionSchema,
} from './professional-long-form-customer-delivery-mux-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION,
  professionalLongFormDeliveryDecodedAudioQaAttemptSchema,
  professionalLongFormDeliveryDecodedAudioQaAuthoritySchema,
  professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema,
  professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
  professionalLongFormDeliveryDecodedVideoQaAttemptSchema,
  professionalLongFormDeliveryDecodedVideoQaAuthoritySchema,
  professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema,
  professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
} from './professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION,
  professionalLongFormDeliveryDownloadAttemptSchema,
  professionalLongFormDeliveryDownloadAuthoritySchema,
  professionalLongFormDeliveryDownloadAuthorizationSchema,
  professionalLongFormDeliveryDownloadCompletionSchema,
} from './professional-long-form-customer-delivery-download-execution-contract'

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
    professionalLongFormDeliveryRootAuthorizationSchema,
    professionalLongFormDeliveryH264AuthorizationSchema,
    professionalLongFormDeliveryH264QaAuthorizationSchema,
    professionalLongFormDeliveryMuxAuthorizationSchema,
    professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema,
    professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema,
    professionalLongFormDeliveryDownloadAuthorizationSchema,
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
    professionalLongFormDeliveryRootAuthoritySchema,
    professionalLongFormDeliveryH264AuthoritySchema,
    professionalLongFormDeliveryH264QaAuthoritySchema,
    professionalLongFormDeliveryMuxAuthoritySchema,
    professionalLongFormDeliveryDecodedVideoQaAuthoritySchema,
    professionalLongFormDeliveryDecodedAudioQaAuthoritySchema,
    professionalLongFormDeliveryDownloadAuthoritySchema,
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
    professionalLongFormDeliveryRootAttemptSchema,
    professionalLongFormDeliveryH264AttemptSchema,
    professionalLongFormDeliveryH264QaAttemptSchema,
    professionalLongFormDeliveryMuxAttemptSchema,
    professionalLongFormDeliveryDecodedVideoQaAttemptSchema,
    professionalLongFormDeliveryDecodedAudioQaAttemptSchema,
    professionalLongFormDeliveryDownloadAttemptSchema,
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
    professionalLongFormDeliveryRootCompletionSchema,
    professionalLongFormDeliveryH264CompletionSchema,
    professionalLongFormDeliveryH264QaCompletionSchema,
    professionalLongFormDeliveryMuxCompletionSchema,
    professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
    professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
    professionalLongFormDeliveryDownloadCompletionSchema,
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

export function isProfessionalLongFormDeliveryRootAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormDeliveryRootAuthorizationSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryH264Authorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<typeof professionalLongFormDeliveryH264AuthorizationSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryH264QaAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormDeliveryH264QaAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryMuxAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormDeliveryMuxAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormDeliveryDecodedVideoQaAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormDeliveryDecodedAudioQaAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORIZATION_VERSION
}

export function isProfessionalLongFormDeliveryDownloadAuthorization(
  value: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): value is z.infer<
  typeof professionalLongFormDeliveryDownloadAuthorizationSchema
> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORIZATION_VERSION
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

export function isProfessionalLongFormDeliveryRootAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryRootAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryH264Authority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryH264AuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryH264QaAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryH264QaAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryMuxAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryMuxAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryDecodedVideoQaAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryDecodedVideoQaAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryDecodedAudioQaAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryDecodedAudioQaAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_AUTHORITY_VERSION
}

export function isProfessionalLongFormDeliveryDownloadAuthority(
  value: ProfessionalLongFormAuthorizedChildExecutionAuthority,
): value is z.infer<typeof professionalLongFormDeliveryDownloadAuthoritySchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_AUTHORITY_VERSION
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

export function isProfessionalLongFormDeliveryRootAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryRootAttemptSchema> {
  return value.schemaVersion === PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryH264Attempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryH264AttemptSchema> {
  return value.schemaVersion === PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryH264QaAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryH264QaAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryMuxAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryMuxAttemptSchema> {
  return value.schemaVersion === PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryDecodedVideoQaAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryDecodedVideoQaAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryDecodedAudioQaAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryDecodedAudioQaAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION
}

export function isProfessionalLongFormDeliveryDownloadAttempt(
  value: ProfessionalLongFormAuthorizedChildExecutionAttempt,
): value is z.infer<typeof professionalLongFormDeliveryDownloadAttemptSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_ATTEMPT_VERSION
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

export function isProfessionalLongFormDeliveryRootCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryRootCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryH264Completion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryH264CompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryH264QaCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryH264QaCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryMuxCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryMuxCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryDecodedVideoQaCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryDecodedVideoQaCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryDecodedAudioQaCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryDecodedAudioQaCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COMPLETION_VERSION
}

export function isProfessionalLongFormDeliveryDownloadCompletion(
  value: ProfessionalLongFormAuthorizedChildCompletion,
): value is z.infer<typeof professionalLongFormDeliveryDownloadCompletionSchema> {
  return value.schemaVersion ===
    PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COMPLETION_VERSION
}
