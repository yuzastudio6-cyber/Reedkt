import type {
  AppendPreferenceStudyMessageRequest,
  CreateEditReferenceRequest,
  CreatePreferenceEvidenceRequest,
  CreatePreferenceStudyRequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import { hashEditReferenceRequest } from './private-edit-reference-repository'

export const EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION =
  'edit-reference-domain-command-v1' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_CONTRACT_VERSION =
  'edit-reference-domain-aggregate-read-v1' as const

export const EDIT_REFERENCE_DOMAIN_COMMAND_RPC =
  'mutate_edit_reference_domain_command_v1' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC =
  'read_edit_reference_domain_aggregate_v1' as const

interface EditReferenceDomainCommandBase<
  TOperation extends string,
  TRequest,
> {
  readonly schemaVersion: typeof EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION
  readonly operation: TOperation
  readonly request: TRequest
}

export type EditReferenceDomainCommand =
  | EditReferenceDomainCommandBase<'edit_reference.create', CreateEditReferenceRequest>
  | EditReferenceDomainCommandBase<'edit_reference.update', {
      readonly referenceId: string
      readonly input: UpdateEditReferenceRequest
    }>
  | EditReferenceDomainCommandBase<'preference_study.create', {
      readonly referenceId: string
      readonly input: CreatePreferenceStudyRequest
    }>
  | EditReferenceDomainCommandBase<'preference_study.update', {
      readonly studyId: string
      readonly input: UpdatePreferenceStudyRequest
    }>
  | EditReferenceDomainCommandBase<'preference_study.message.append', {
      readonly studyId: string
      readonly input: AppendPreferenceStudyMessageRequest
    }>
  | EditReferenceDomainCommandBase<'preference_study.evidence.add', {
      readonly studyId: string
      readonly input: CreatePreferenceEvidenceRequest
      readonly privateMediaAuthorityChecked: boolean
    }>

export interface EditReferenceDomainAggregateReadScope {
  readonly actorUserId: string
  readonly workspaceId: string
}

export function editReferenceDomainCommandWorkspaceId(
  command: EditReferenceDomainCommand,
): string {
  return command.operation === 'edit_reference.create'
    ? command.request.workspaceId
    : command.request.input.workspaceId
}

export function editReferenceDomainCommandRequestHash(
  command: EditReferenceDomainCommand,
): string {
  switch (command.operation) {
    case 'edit_reference.create':
      return hashEditReferenceRequest(command.request)
    case 'edit_reference.update':
      return hashEditReferenceRequest({
        referenceId: command.request.referenceId,
        ...command.request.input,
      })
    case 'preference_study.create':
      return hashEditReferenceRequest({
        referenceId: command.request.referenceId,
        ...command.request.input,
      })
    case 'preference_study.update':
    case 'preference_study.message.append':
    case 'preference_study.evidence.add':
      return hashEditReferenceRequest({
        studyId: command.request.studyId,
        ...command.request.input,
      })
  }
}

export function assertEditReferenceDomainCommand(
  command: EditReferenceDomainCommand,
): void {
  if (
    !command
    || typeof command !== 'object'
    || command.schemaVersion !== EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION
    || ![
      'edit_reference.create',
      'edit_reference.update',
      'preference_study.create',
      'preference_study.update',
      'preference_study.message.append',
      'preference_study.evidence.add',
    ].includes(command.operation)
    || !command.request
    || typeof command.request !== 'object'
  ) invalid('domain_command_shape_invalid')

  const workspaceId = editReferenceDomainCommandWorkspaceId(command)
  if (!isStableId(workspaceId)) invalid('domain_command_workspace_invalid')
  if (
    command.operation === 'edit_reference.update'
    || command.operation === 'preference_study.create'
  ) {
    if (!isStableId(command.request.referenceId)) invalid('domain_command_reference_invalid')
  }
  if (
    command.operation === 'preference_study.update'
    || command.operation === 'preference_study.message.append'
    || command.operation === 'preference_study.evidence.add'
  ) {
    if (!isStableId(command.request.studyId)) invalid('domain_command_study_invalid')
  }
  if (
    command.operation === 'preference_study.evidence.add'
    && command.request.input.sourceType === 'reference_video_metadata'
    && command.request.input.storageObjectRecordId
    && command.request.privateMediaAuthorityChecked !== true
  ) invalid('domain_command_private_media_authority_missing')
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 240
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical Edit Reference domain command is invalid.',
    503,
    {
      reason,
      browserCommandAuthorityAccepted: false,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
