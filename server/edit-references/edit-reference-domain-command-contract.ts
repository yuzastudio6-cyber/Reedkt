import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  ControlEditReferenceLongFormStudyRequest,
  CreateEditReferenceRequest,
  CreatePreferenceEvidenceRequest,
  CreatePreferenceStudyRequest,
  PreferenceDNAApprovalSnapshot,
  PreferenceDNAQAResultRecord,
  PreferenceDNAVersionRecord,
  PreferenceEvidenceMediaMetadata,
  PreferenceEvidenceRecord,
  PreferenceLongFormStudySummary,
  PreferenceSkillRunRecord,
  PreferenceStudyMessageRecord,
  PreferenceUsageLogRecord,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  StartEditReferenceLongFormStudyRequest,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import { validatePreferenceLongFormStudySummary } from './edit-reference-long-form-study-binding'
import { hashEditReferenceRequest } from './private-edit-reference-repository'

export const EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION =
  'edit-reference-domain-command-v2' as const

export const EDIT_REFERENCE_DOMAIN_COMMAND_V1_CONTRACT_VERSION =
  'edit-reference-domain-command-v1' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_CONTRACT_VERSION =
  'edit-reference-domain-aggregate-read-v2' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_V1_CONTRACT_VERSION =
  'edit-reference-domain-aggregate-read-v1' as const

export const EDIT_REFERENCE_DOMAIN_COMMAND_RPC =
  'mutate_edit_reference_domain_command_v2' as const

export const EDIT_REFERENCE_DOMAIN_LONG_FORM_COMMAND_RPC =
  'mutate_edit_reference_long_form_domain_command_v1' as const

export const EDIT_REFERENCE_DOMAIN_COMMAND_V1_RPC =
  'mutate_edit_reference_domain_command_v1' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC =
  'read_edit_reference_domain_aggregate_v2' as const

export const EDIT_REFERENCE_DOMAIN_IDEMPOTENCY_LOOKUP_RPC =
  'read_edit_reference_domain_idempotency_v1' as const

export const EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_V1_RPC =
  'read_edit_reference_domain_aggregate_v1' as const

interface EditReferenceDomainCommandBase<
  TOperation extends string,
  TRequest,
> {
  readonly schemaVersion: typeof EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION
  readonly operation: TOperation
  readonly request: TRequest
}

export interface EditReferencePreparedEvidenceStudyCommandResult {
  readonly referenceId: string
  readonly orchestrationId: string
  readonly studyStatus: 'evidence_ready' | 'needs_clarification' | 'needs_user_review'
  readonly evidenceStatus: 'evidence_ready' | 'needs_clarification'
  readonly derivedEvidence: readonly PreferenceEvidenceRecord[]
  readonly skillRuns: readonly PreferenceSkillRunRecord[]
  readonly assistantMessage: PreferenceStudyMessageRecord
  readonly usageLog: PreferenceUsageLogRecord
  readonly preparationClass: 'manual_deterministic_no_media_no_provider'
  readonly providerCallMade: false
  readonly modelCallMade: false
  readonly fileBytesRead: false
  readonly mediaProcessingStarted: false
  readonly workerJobCreated: false
  readonly remoteMutationMade: false
}

export interface EditReferencePreparedDnaSynthesisCommandResult {
  readonly referenceId: string
  readonly dnaVersion: PreferenceDNAVersionRecord
  readonly assistantMessage: PreferenceStudyMessageRecord
  readonly usageLog: PreferenceUsageLogRecord
}

export interface EditReferencePreparedDnaQaCommandResult {
  readonly referenceId: string
  readonly qaResult: PreferenceDNAQAResultRecord
  readonly assistantMessage: PreferenceStudyMessageRecord
  readonly usageLog: PreferenceUsageLogRecord
}

export interface EditReferencePreparedDnaApprovalCommandResult {
  readonly referenceId: string
  readonly approval: PreferenceDNAApprovalSnapshot
  readonly assistantMessage: PreferenceStudyMessageRecord
  readonly usageLog: PreferenceUsageLogRecord
}

export interface EditReferencePreparedLongFormStudyStartCommandResult {
  readonly referenceId: string
  readonly referenceAssetId: string
  readonly summary: PreferenceLongFormStudySummary
  readonly mediaMetadata: PreferenceEvidenceMediaMetadata
  readonly assistantMessage: PreferenceStudyMessageRecord
}

export interface EditReferencePreparedLongFormStudyControlCommandResult {
  readonly referenceId: string
  readonly referenceAssetId: string
  readonly summary: PreferenceLongFormStudySummary
  readonly mediaMetadata: PreferenceEvidenceMediaMetadata
  readonly action: ControlEditReferenceLongFormStudyRequest['action']
  readonly activeWorkFinishesBeforePause: boolean
  readonly recoveredWorkItemCount: number
  readonly assistantMessage: PreferenceStudyMessageRecord
}

export type EditReferenceLongFormStudyControlDomainOperation =
  `preference_study.long_form_study.control.${ControlEditReferenceLongFormStudyRequest['action']}`

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
  | EditReferenceDomainCommandBase<'preference_study.evidence.run', {
      readonly studyId: string
      readonly input: RunPreferenceEvidenceStudyRequest
      readonly prepared: EditReferencePreparedEvidenceStudyCommandResult
    }>
  | EditReferenceDomainCommandBase<'preference_study.dna.synthesize', {
      readonly studyId: string
      readonly input: SynthesizePreferenceDNARequest
      readonly prepared: EditReferencePreparedDnaSynthesisCommandResult
    }>
  | EditReferenceDomainCommandBase<'preference_study.dna.qa.run', {
      readonly studyId: string
      readonly dnaVersionId: string
      readonly input: RunEditReferenceDNAQARequest
      readonly prepared: EditReferencePreparedDnaQaCommandResult
    }>
  | EditReferenceDomainCommandBase<'preference_study.dna.approve', {
      readonly studyId: string
      readonly dnaVersionId: string
      readonly input: ApproveEditReferenceDNAVersionRequest
      readonly prepared: EditReferencePreparedDnaApprovalCommandResult
    }>
  | EditReferenceDomainCommandBase<'preference_study.long_form_study.start', {
      readonly studyId: string
      readonly referenceAssetId: string
      readonly input: StartEditReferenceLongFormStudyRequest
      readonly prepared: EditReferencePreparedLongFormStudyStartCommandResult
    }>
  | EditReferenceDomainCommandBase<EditReferenceLongFormStudyControlDomainOperation, {
      readonly studyId: string
      readonly referenceAssetId: string
      readonly input: ControlEditReferenceLongFormStudyRequest & {
        readonly expectedStudyRevision: number
      }
      readonly prepared: EditReferencePreparedLongFormStudyControlCommandResult
    }>

type EditReferenceLongFormControlDomainCommand = Extract<
  EditReferenceDomainCommand,
  { readonly operation: EditReferenceLongFormStudyControlDomainOperation }
>

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
    case 'preference_study.evidence.run':
    case 'preference_study.dna.synthesize':
      return hashEditReferenceRequest({
        studyId: command.request.studyId,
        ...command.request.input,
      })
    case 'preference_study.dna.qa.run':
    case 'preference_study.dna.approve':
      return hashEditReferenceRequest({
        studyId: command.request.studyId,
        dnaVersionId: command.request.dnaVersionId,
        ...command.request.input,
      })
    case 'preference_study.long_form_study.start':
      return hashEditReferenceRequest({
        studyId: command.request.studyId,
        referenceAssetId: command.request.referenceAssetId,
        ...command.request.input,
      })
    case 'preference_study.long_form_study.control.pause':
    case 'preference_study.long_form_study.control.resume':
    case 'preference_study.long_form_study.control.cancel':
    case 'preference_study.long_form_study.control.recover': {
      const { expectedStudyRevision: _expectedStudyRevision, ...input } =
        command.request.input
      void _expectedStudyRevision
      return hashEditReferenceRequest({
        studyId: command.request.studyId,
        referenceAssetId: command.request.referenceAssetId,
        ...input,
      })
    }
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
      'preference_study.evidence.run',
      'preference_study.dna.synthesize',
      'preference_study.dna.qa.run',
      'preference_study.dna.approve',
      'preference_study.long_form_study.start',
      'preference_study.long_form_study.control.pause',
      'preference_study.long_form_study.control.resume',
      'preference_study.long_form_study.control.cancel',
      'preference_study.long_form_study.control.recover',
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
    || command.operation === 'preference_study.evidence.run'
    || command.operation === 'preference_study.dna.synthesize'
    || command.operation === 'preference_study.dna.qa.run'
    || command.operation === 'preference_study.dna.approve'
    || command.operation === 'preference_study.long_form_study.start'
  ) {
    if (!isStableId(command.request.studyId)) invalid('domain_command_study_invalid')
  }
  if (
    isLongFormControlDomainCommand(command)
    && !isStableId(command.request.studyId)
  ) invalid('domain_command_study_invalid')
  if (
    command.operation === 'preference_study.evidence.add'
    && command.request.input.sourceType === 'reference_video_metadata'
    && command.request.input.storageObjectRecordId
    && command.request.privateMediaAuthorityChecked !== true
  ) invalid('domain_command_private_media_authority_missing')

  if (command.operation === 'preference_study.evidence.run') {
    assertPreparedEvidenceStudy(command.request.studyId, command.request.prepared)
  }
  if (command.operation === 'preference_study.dna.synthesize') {
    assertPreparedRecordSet(
      command.request.studyId,
      command.request.prepared.referenceId,
      command.request.prepared.dnaVersion,
      command.request.prepared.assistantMessage,
      command.request.prepared.usageLog,
      'dna_synthesis',
    )
  }
  if (command.operation === 'preference_study.dna.qa.run') {
    assertPreparedRecordSet(
      command.request.studyId,
      command.request.prepared.referenceId,
      command.request.prepared.qaResult,
      command.request.prepared.assistantMessage,
      command.request.prepared.usageLog,
      'dna_qa',
    )
    if (
      command.request.prepared.qaResult.dnaVersionId !== command.request.dnaVersionId
      || command.request.prepared.qaResult.dnaContentDigest
        !== command.request.input.expectedDNAContentDigest
    ) invalid('domain_command_dna_qa_binding_invalid')
  }
  if (command.operation === 'preference_study.dna.approve') {
    const prepared = command.request.prepared
    if (
      !isStableId(prepared.referenceId)
      || !isStableId(prepared.approval.id)
      || prepared.approval.qaResultId !== command.request.input.qaResultId
      || prepared.approval.acknowledgedAdaptNotCopy !== true
      || prepared.approval.approvedBy !== 'authenticated_user'
      || !isIsoDate(prepared.approval.approvedAt)
    ) invalid('domain_command_dna_approval_binding_invalid')
    assertMessageAndUsage(
      command.request.studyId,
      prepared.referenceId,
      prepared.assistantMessage,
      prepared.usageLog,
    )
  }
  if (command.operation === 'preference_study.long_form_study.start') {
    assertPreparedLongFormProjection(
      command.request.studyId,
      command.request.referenceAssetId,
      command.request.prepared,
    )
  }
  if (isLongFormControlDomainCommand(command)) {
    const prepared = command.request.prepared
    const action = command.operation.replace(
      'preference_study.long_form_study.control.',
      '',
    )
    if (
      prepared.action !== action
      || command.request.input.action !== action
      || !Number.isSafeInteger(command.request.input.expectedStudyRevision)
      || command.request.input.expectedStudyRevision < 1
      || typeof prepared.activeWorkFinishesBeforePause !== 'boolean'
      || !Number.isSafeInteger(prepared.recoveredWorkItemCount)
      || prepared.recoveredWorkItemCount < 0
    ) invalid('domain_command_long_form_control_invalid')
    assertPreparedLongFormProjection(
      command.request.studyId,
      command.request.referenceAssetId,
      prepared,
    )
  }
}

function isLongFormControlDomainCommand(
  command: EditReferenceDomainCommand,
): command is EditReferenceLongFormControlDomainCommand {
  return command.operation === 'preference_study.long_form_study.control.pause'
    || command.operation === 'preference_study.long_form_study.control.resume'
    || command.operation === 'preference_study.long_form_study.control.cancel'
    || command.operation === 'preference_study.long_form_study.control.recover'
}

function assertPreparedLongFormProjection(
  studyId: string,
  referenceAssetId: string,
  prepared:
    | EditReferencePreparedLongFormStudyStartCommandResult
    | EditReferencePreparedLongFormStudyControlCommandResult,
): void {
  try {
    validatePreferenceLongFormStudySummary(prepared.summary)
  } catch {
    invalid('domain_command_long_form_summary_invalid')
  }
  const metadata = prepared.mediaMetadata
  if (
    !isStableId(prepared.referenceId)
    || !isStableId(referenceAssetId)
    || prepared.referenceAssetId !== referenceAssetId
    || prepared.summary.referenceAssetId !== referenceAssetId
    || metadata.orientation === undefined
    || !['portrait', 'landscape', 'square', 'unknown'].includes(metadata.orientation)
    || metadata.durationSeconds !== prepared.summary.sourceDurationSeconds
    || metadata.hasAudio !== prepared.summary.sourceHasAudio
    || (metadata.width !== undefined
      && (!Number.isSafeInteger(metadata.width) || metadata.width < 1))
    || (metadata.height !== undefined
      && (!Number.isSafeInteger(metadata.height) || metadata.height < 1))
    || prepared.assistantMessage.id.length < 1
    || prepared.assistantMessage.workspaceId.length < 1
    || prepared.assistantMessage.editReferenceId !== prepared.referenceId
    || prepared.assistantMessage.studySessionId !== studyId
    || prepared.assistantMessage.role !== 'assistant'
    || prepared.assistantMessage.runtimeSource !== 'deterministic_evidence'
    || prepared.assistantMessage.content.length < 1
    || prepared.assistantMessage.content.length > 8_000
    || !Number.isSafeInteger(prepared.assistantMessage.sequence)
    || prepared.assistantMessage.sequence < 1
    || !isIsoDate(prepared.assistantMessage.createdAt)
  ) invalid('domain_command_long_form_projection_invalid')
}

function assertPreparedEvidenceStudy(
  studyId: string,
  prepared: EditReferencePreparedEvidenceStudyCommandResult,
): void {
  if (
    !prepared
    || prepared.preparationClass !== 'manual_deterministic_no_media_no_provider'
    || prepared.providerCallMade !== false
    || prepared.modelCallMade !== false
    || prepared.fileBytesRead !== false
    || prepared.mediaProcessingStarted !== false
    || prepared.workerJobCreated !== false
    || prepared.remoteMutationMade !== false
    || !isStableId(prepared.referenceId)
    || !isStableId(prepared.orchestrationId)
    || !['evidence_ready', 'needs_clarification', 'needs_user_review'].includes(prepared.studyStatus)
    || !['evidence_ready', 'needs_clarification'].includes(prepared.evidenceStatus)
    || !Array.isArray(prepared.derivedEvidence)
    || !Array.isArray(prepared.skillRuns)
    || prepared.derivedEvidence.length < 1
    || prepared.derivedEvidence.length > 256
    || prepared.skillRuns.length < 1
    || prepared.skillRuns.length > 256
  ) invalid('domain_command_evidence_study_prepared_result_invalid')

  const evidenceIds = new Set<string>()
  for (const record of prepared.derivedEvidence) {
    if (
      !isBoundRecord(record, studyId, prepared.referenceId)
      || record.sourceType !== 'derived_skill_evidence'
      || record.orchestrationId !== prepared.orchestrationId
      || record.provenance.runtimeSource === 'verified_live'
      || record.provenance.runtimeSource === 'verified_local'
    ) invalid('domain_command_derived_evidence_invalid')
    if (evidenceIds.has(record.id)) invalid('domain_command_derived_evidence_duplicate')
    evidenceIds.add(record.id)
  }

  const skillRunIds = new Set<string>()
  for (const record of prepared.skillRuns) {
    if (
      !isBoundRecord(record, studyId, prepared.referenceId)
      || record.orchestrationId !== prepared.orchestrationId
      || record.providerCallMade !== false
      || record.modelCallMade !== false
      || record.fileBytesRead !== false
      || record.mediaProcessingStarted !== false
      || record.workerJobCreated !== false
    ) invalid('domain_command_skill_run_invalid')
    if (skillRunIds.has(record.id)) invalid('domain_command_skill_run_duplicate')
    skillRunIds.add(record.id)
  }
  assertMessageAndUsage(
    studyId,
    prepared.referenceId,
    prepared.assistantMessage,
    prepared.usageLog,
  )
}

function assertPreparedRecordSet(
  studyId: string,
  referenceId: string,
  preparedRecord: PreferenceDNAVersionRecord | PreferenceDNAQAResultRecord,
  message: PreferenceStudyMessageRecord,
  usage: PreferenceUsageLogRecord,
  kind: 'dna_synthesis' | 'dna_qa',
): void {
  if (
    !isStableId(referenceId)
    || !isBoundRecord(preparedRecord, studyId, referenceId)
    || !/^[a-f0-9]{64}$/.test(preparedRecord.contentDigest)
  ) invalid(`domain_command_${kind}_prepared_result_invalid`)
  assertMessageAndUsage(studyId, referenceId, message, usage)
}

function assertMessageAndUsage(
  studyId: string,
  referenceId: string,
  message: PreferenceStudyMessageRecord,
  usage: PreferenceUsageLogRecord,
): void {
  if (
    !isBoundRecord(message, studyId, referenceId)
    || message.role !== 'assistant'
    || typeof message.content !== 'string'
    || message.content.length < 1
    || message.content.length > 8_000
    || !Number.isSafeInteger(message.sequence)
    || message.sequence < 1
    || !isIsoDate(message.createdAt)
    || !usage
    || usage.editReferenceId !== referenceId
    || !isStableId(usage.id)
    || !isStableId(usage.workspaceId)
    || !isIsoDate(usage.createdAt)
  ) invalid('domain_command_prepared_projection_invalid')
}

function isBoundRecord(
  value: { readonly id?: unknown; readonly workspaceId?: unknown; readonly editReferenceId?: unknown; readonly studySessionId?: unknown },
  studyId: string,
  referenceId: string,
): boolean {
  return isStableId(value.id)
    && isStableId(value.workspaceId)
    && value.editReferenceId === referenceId
    && value.studySessionId === studyId
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
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
