import type { ProjectEditSessionHistoryOrchestratorResult } from '../../types/project-edit-session-history'
import { createProjectEditSessionHistoryActionPlan } from '../project-edit-session-history/project-edit-session-history-policy-service'
import {
  createProjectEditSessionHistoryPackage,
  createProjectEditSessionHistoryPackageSummary,
} from '../project-edit-session-history/project-edit-session-history-package-service'
import {
  createManualCheckpointSnapshot,
  createPreviewCreatedSnapshot,
  createRevisionRequestedSnapshot,
  createVersionCreatedSnapshot,
} from '../project-edit-session-history/project-edit-session-snapshot-history-service'
import {
  approveMockEditSessionVersion,
  createMockEditSessionVersion,
} from '../project-edit-session-history/project-edit-session-version-history-service'
import { createMockPreviewPlaceholder } from '../project-edit-session-history/project-edit-session-preview-history-service'
import { createRevisionRecordFromMessage } from '../project-edit-session-history/project-edit-session-revision-history-service'
import { createApprovalHistorySummary } from '../project-edit-session-history/project-edit-session-approval-history-service'
import {
  createHistoryEvent,
  createPreviewPlaceholderEvent,
  createRevisionCapturedEvent,
  createVersionSavedEvent,
} from '../project-edit-session-history/project-edit-session-event-history-service'
import {
  createProjectEditSessionHistoryValidationSummary,
  validateNoProjectEditSessionHistorySideEffects,
  validateProjectEditSessionHistoryActionPlan,
  validateProjectEditSessionHistoryPackage,
} from '../project-edit-session-history/project-edit-session-history-validation-service'

const baseInput = {
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-vertical-dna',
}

function result(input: Partial<ProjectEditSessionHistoryOrchestratorResult>): ProjectEditSessionHistoryOrchestratorResult {
  return {
    snapshots: input.snapshots ?? [],
    versions: input.versions ?? [],
    previews: input.previews ?? [],
    revisions: input.revisions ?? [],
    events: input.events ?? [],
    validation: input.validation ?? validateNoProjectEditSessionHistorySideEffects({}),
    summary: input.summary ?? [],
    warnings: input.warnings ?? [],
    actionPlan: input.actionPlan,
    historyPackage: input.historyPackage,
    nextStep: 'RP-EDITSESSION-10 — Wire Edit Preference + DNA into Edit Sessions',
  }
}

export function runMockProjectEditSessionSnapshotHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const snapshot = createManualCheckpointSnapshot({ ...baseInput })
  const actionPlan = createProjectEditSessionHistoryActionPlan({ ...baseInput, action: 'save_manual_checkpoint' })
  return result({
    actionPlan,
    snapshots: [snapshot],
    validation: validateProjectEditSessionHistoryActionPlan(actionPlan),
    summary: ['Manual mock checkpoint created without production side effects.'],
  })
}

export function runMockProjectEditSessionVersionHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const snapshot = createVersionCreatedSnapshot({ ...baseInput, versionNumber: 2 })
  const version = approveMockEditSessionVersion(createMockEditSessionVersion({
    ...baseInput,
    versionNumber: 2,
    createdFromSnapshotId: snapshot.id,
  }))
  const event = createVersionSavedEvent({ ...baseInput, versionId: version.id })
  const actionPlan = createProjectEditSessionHistoryActionPlan({ ...baseInput, action: 'save_mock_version' })
  return result({
    actionPlan,
    snapshots: [snapshot],
    versions: [version],
    events: [event],
    validation: validateProjectEditSessionHistoryActionPlan(actionPlan),
    summary: ['Mock version saved and approved state-only; no render or progress started.'],
  })
}

export function runMockProjectEditSessionPreviewHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const preview = createMockPreviewPlaceholder({ ...baseInput, aspectRatio: '9:16' })
  const snapshot = createPreviewCreatedSnapshot({ ...baseInput })
  const event = createPreviewPlaceholderEvent({ ...baseInput, previewId: preview.id })
  const actionPlan = createProjectEditSessionHistoryActionPlan({ ...baseInput, action: 'create_mock_preview_placeholder' })
  return result({
    actionPlan,
    snapshots: [snapshot],
    previews: [preview],
    events: [event],
    validation: validateProjectEditSessionHistoryActionPlan(actionPlan),
    summary: ['Mock preview placeholder created; no media file or render job exists.'],
  })
}

export function runMockProjectEditSessionRevisionHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const snapshot = createRevisionRequestedSnapshot({ ...baseInput, messageId: 'message-revision' })
  const revision = createRevisionRecordFromMessage({
    ...baseInput,
    messageId: 'message-revision',
    messageText: 'Revise this and make it faster.',
    snapshotId: snapshot.id,
  })
  const event = createRevisionCapturedEvent({ ...baseInput, revisionId: revision.id })
  const actionPlan = createProjectEditSessionHistoryActionPlan({ ...baseInput, action: 'capture_revision' })
  return result({
    actionPlan,
    snapshots: [snapshot],
    revisions: [revision],
    events: [event],
    validation: validateProjectEditSessionHistoryActionPlan(actionPlan),
    summary: ['Revision captured and approval reset for safety.'],
  })
}

export function runMockProjectEditSessionApprovalHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const event = createHistoryEvent({
    ...baseInput,
    eventType: 'mock_approval_state_changed',
    summary: createApprovalHistorySummary('approved'),
  })
  const actionPlan = createProjectEditSessionHistoryActionPlan({ ...baseInput, action: 'approve_mock_version' })
  return result({
    actionPlan,
    events: [event],
    validation: validateProjectEditSessionHistoryActionPlan(actionPlan),
    summary: [createApprovalHistorySummary('approved')],
  })
}

export function runMockProjectEditSessionHistoryPackageFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const snapshotFlow = runMockProjectEditSessionSnapshotHistoryFlow()
  const versionFlow = runMockProjectEditSessionVersionHistoryFlow()
  const previewFlow = runMockProjectEditSessionPreviewHistoryFlow()
  const revisionFlow = runMockProjectEditSessionRevisionHistoryFlow()
  const historyPackage = createProjectEditSessionHistoryPackage({
    ...baseInput,
    approvalStatus: 'reset_after_revision',
    snapshots: [...snapshotFlow.snapshots, ...versionFlow.snapshots, ...previewFlow.snapshots, ...revisionFlow.snapshots],
    versions: versionFlow.versions,
    previews: previewFlow.previews,
    revisions: revisionFlow.revisions,
    events: [...versionFlow.events, ...previewFlow.events, ...revisionFlow.events],
  })
  const validation = validateProjectEditSessionHistoryPackage(historyPackage)
  return result({
    historyPackage,
    snapshots: historyPackage.snapshots,
    versions: historyPackage.versions,
    previews: historyPackage.previews,
    revisions: historyPackage.revisions,
    events: historyPackage.events,
    validation,
    summary: [
      createProjectEditSessionHistoryPackageSummary(historyPackage),
      createProjectEditSessionHistoryValidationSummary(validation),
    ],
  })
}

export function runMockProjectEditSessionHistoryValidationFlow(): ProjectEditSessionHistoryOrchestratorResult {
  const validation = validateNoProjectEditSessionHistorySideEffects({})
  return result({
    validation,
    summary: [createProjectEditSessionHistoryValidationSummary(validation)],
  })
}

export function runMockProjectEditSessionHistoryReadinessFlow(): ProjectEditSessionHistoryOrchestratorResult {
  return result({
    validation: validateNoProjectEditSessionHistorySideEffects({}),
    summary: [
      'Project Edit Session history is mock/local ready.',
      'No Qwen, DeepSeek, provider, worker, render, progress, Supabase, or credit runtime is enabled.',
    ],
  })
}

export function runMockProjectEditSessionHistoryFlow(): ProjectEditSessionHistoryOrchestratorResult {
  return runMockProjectEditSessionHistoryPackageFlow()
}
