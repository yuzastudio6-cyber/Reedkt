import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  createMockProjectEditBriefRepository,
} from '../../src/backend/repositories/mock-project-edit-brief-repository'
import {
  createSupabaseDisabledProjectEditBriefRepository,
} from '../../src/backend/repositories/supabase-project-edit-brief-repository'
import {
  MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS,
} from '../../src/backend/repositories/mock-project-edit-brief-repository-scenarios'
import {
  createProjectEditBriefRepositoryReadinessSummary,
  createProjectEditBriefRepositoryResultSummary,
} from '../../src/backend/repositories/project-edit-brief-repository-summary-service'
import {
  createProjectEditBriefRepositoryValidationSummary,
  validateProjectEditBriefBundle,
  validateProjectEditBriefDrawerModel,
  validateProjectEditBriefRecord,
  validateProjectEditBriefRepositoryContext,
  validateProjectEditBriefRepositoryOperationAllowed,
  validateProjectEditBriefRepositoryResultSafety,
  validateProjectEditSessionExportSettings,
} from '../../src/backend/repositories/project-edit-brief-repository-validation-service'
import {
  createProjectEditBriefRowMappingSummary,
  mapProjectEditBriefApplicationLogRecordToInsertRow,
  mapProjectEditBriefApplicationLogRowToRecord,
  mapProjectEditBriefMarkerAttachmentRecordToInsertRow,
  mapProjectEditBriefMarkerAttachmentRowToRecord,
  mapProjectEditBriefMarkerConfirmationRecordToInsertRow,
  mapProjectEditBriefMarkerConfirmationRowToRecord,
  mapProjectEditBriefMarkerConflictRecordToInsertRow,
  mapProjectEditBriefMarkerConflictRowToRecord,
  mapProjectEditBriefMarkerIntentRecordToInsertRow,
  mapProjectEditBriefMarkerIntentRowToRecord,
  mapProjectEditBriefMarkerMessageRecordToInsertRow,
  mapProjectEditBriefMarkerMessageRowToRecord,
  mapProjectEditBriefMarkerRecordToInsertRow,
  mapProjectEditBriefMarkerRevisionRecordToInsertRow,
  mapProjectEditBriefMarkerRevisionRowToRecord,
  mapProjectEditBriefMarkerRowToRecord,
  mapProjectEditBriefRecordToInsertRow,
  mapProjectEditBriefRowToRecord,
  mapProjectEditSessionExportSettingsRecordToInsertRow,
  mapProjectEditSessionExportSettingsRowToRecord,
} from '../../src/backend/repositories/project-edit-brief-row-mappers'
import {
  runMockProjectEditBriefRepositoryOrchestrator,
} from '../../src/backend/orchestrators/mock-project-edit-brief-repository-orchestrator'
import type {
  CreateProjectEditBriefRepositoryRequest,
  GetProjectEditBriefRepositoryRequest,
  ProjectEditBriefRepositoryContractMeta,
} from '../../src/backend/contracts/project-edit-brief-repository-contracts'
import type { ProjectEditBriefRepositoryResult } from '../../src/types/project-edit-brief-repository'

const repoRoot = process.cwd()

const requiredDocs = [
  'docs/project-edit-brief-repository-layer.md',
  'docs/project-edit-brief-mock-database.md',
  'docs/project-edit-brief-supabase-boundary.md',
  'docs/project-edit-brief-repository-transition-plan.md',
  'docs/project-edit-brief-persistence-lifecycle.md',
]

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

function assertSafeResult<T>(result: ProjectEditBriefRepositoryResult<T>, label: string): void {
  assert.equal(result.mockOnly, true, `${label} should be mockOnly`)
  assert.equal(result.supabaseReadMade, false, `${label} should not read Supabase`)
  assert.equal(result.supabaseWriteMade, false, `${label} should not write Supabase`)
  assert.equal(result.storageReadMade, false, `${label} should not read storage`)
  assert.equal(result.storageWriteMade, false, `${label} should not write storage`)
  assert.equal(result.fileBytesRead, false, `${label} should not read file bytes`)
  assert.equal(result.externalUrlFetched, false, `${label} should not fetch external URLs`)
  assert.equal(result.mediaProcessingStarted, false, `${label} should not process media`)
  assert.equal(result.providerCallMade, false, `${label} should not call providers`)
  assert.equal(result.workerJobCreated, false, `${label} should not create worker jobs`)
  assert.equal(result.generationRequestCreated, false, `${label} should not create generation requests`)
  assert.equal(result.renderJobCreated, false, `${label} should not create render jobs`)
  assert.equal(result.creditReservedOrSpent, false, `${label} should not reserve/spend credits`)
  assert.equal(validateProjectEditBriefRepositoryResultSafety(result).ok, true, `${label} should pass result safety validation`)
}

const contractMeta: ProjectEditBriefRepositoryContractMeta = {
  mockOnly: true,
  repositoryLayerOnly: true,
  apiHandlerImplemented: false,
  uiBehaviorChanged: false,
  supabaseCommandRun: false,
  migrationCreated: false,
  warnings: [],
}
const getRequest: GetProjectEditBriefRepositoryRequest = {
  briefId: 'project-edit-brief-broll-attached',
  mockOnly: true,
}
const createRequest: CreateProjectEditBriefRepositoryRequest = {
  input: {
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: 'edit-session-repository-smoke',
    title: 'Repository Smoke Edit Brief',
  },
  mockOnly: true,
}
assert.equal(contractMeta.repositoryLayerOnly, true)
assert.equal(getRequest.mockOnly, true)
assert.equal(createRequest.mockOnly, true)

const db = createMockDatabase()
const repository = createMockProjectEditBriefRepository({
  db,
  projectId: 'mock-project-edit-chat-foundation',
})

assert.equal(validateProjectEditBriefRepositoryContext(repository.context).ok, true)
assert.equal(validateProjectEditBriefRepositoryOperationAllowed(repository.context, 'get_brief').ok, true)
assert.ok(db.projectEditBriefs.length >= 12, 'mock repository should seed Edit Brief fixtures')
assert.ok(db.projectEditBriefMarkers.length > 0, 'mock repository should seed markers')
assert.ok(db.projectEditBriefMarkerAttachments.length > 0, 'mock repository should seed attachments')
assert.ok(db.projectEditBriefMarkerMessages.length > 0, 'mock repository should seed Marker Chat messages')
assert.ok(db.projectEditBriefMarkerIntents.length > 0, 'mock repository should seed intents')
assert.ok(db.projectEditBriefMarkerConfirmations.length > 0, 'mock repository should seed confirmations')
assert.ok(db.projectEditBriefMarkerConflicts.length > 0, 'mock repository should seed conflicts')
assert.ok(db.projectEditBriefMarkerRevisions.length > 0, 'mock repository should seed revisions')
assert.ok(db.projectEditBriefApplicationLogs.length > 0, 'mock repository should seed application logs')
assert.ok(db.projectEditSessionExportSettings.length >= db.projectEditBriefs.length, 'mock repository should seed export settings')

const seededBrief = db.projectEditBriefs.find((brief) => brief.id === getRequest.briefId) ?? db.projectEditBriefs[0]
assert.ok(seededBrief, 'seeded brief should exist')

const getBrief = await repository.getEditBrief(seededBrief.id)
assertSafeResult(getBrief, 'get brief')
assert.equal(getBrief.data?.id, seededBrief.id)
assert.equal(validateProjectEditBriefRecord(getBrief.data!).ok, true)

const sessionBrief = await repository.getEditBriefForSession(seededBrief.editSessionId)
assertSafeResult(sessionBrief, 'get brief for session')
assert.equal(sessionBrief.data?.editSessionId, seededBrief.editSessionId)

const createdBrief = await repository.createEditBrief(createRequest.input)
assertSafeResult(createdBrief, 'create brief')
assert.equal(createdBrief.data?.markerCount, 0)

const updatedBrief = await repository.updateEditBrief({
  briefId: createdBrief.data!.id,
  patch: {
    title: 'Repository Smoke Updated Edit Brief',
    summary: 'Updated through mock repository only.',
    status: 'active',
  },
})
assertSafeResult(updatedBrief, 'update brief')
assert.equal(updatedBrief.data?.title, 'Repository Smoke Updated Edit Brief')

const createdMarker = await repository.createMarker({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  marker: {
    markerType: 'caption_text',
    status: 'draft',
    priority: 'must_follow',
    timeMode: 'point',
    startTimeSeconds: 8,
    title: 'Add mock caption hook',
    userNote: 'Add a short hook caption.',
    aiMode: 'confirm_only',
    qaStatus: 'not_checked',
    metadata: {
      repositorySmoke: true,
    },
  },
})
assertSafeResult(createdMarker, 'create marker')
assert.equal(createdMarker.data?.attachmentCount, 0)
assert.equal((await repository.getEditBrief(createdBrief.data!.id)).data?.markerCount, 1)

const updatedMarker = await repository.updateMarker({
  markerId: createdMarker.data!.id,
  patch: {
    status: 'needs_clarification',
    qaStatus: 'needs_clarification',
  },
})
assertSafeResult(updatedMarker, 'update marker')
assert.equal(updatedMarker.data?.status, 'needs_clarification')

const markerList = await repository.listMarkers(createdBrief.data!.id)
assertSafeResult(markerList, 'list markers')
assert.equal(markerList.data?.some((marker) => marker.id === createdMarker.data!.id), true)

const markerGet = await repository.getMarker(createdMarker.data!.id)
assertSafeResult(markerGet, 'get marker')
assert.equal(markerGet.data?.id, createdMarker.data!.id)

const attachment = await repository.addMarkerAttachment({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  attachment: {
    attachmentKind: 'reference_label',
    status: 'metadata_only',
    label: 'Mock reference label',
    referenceLabel: 'future source label',
    notes: ['Metadata-only smoke attachment.'],
    metadata: {
      fileBytesRead: false,
    },
  },
})
assertSafeResult(attachment, 'add attachment')
assert.equal((await repository.getMarker(createdMarker.data!.id)).data?.attachmentCount, 1)

const attachments = await repository.listMarkerAttachments(createdMarker.data!.id)
assertSafeResult(attachments, 'list attachments')
assert.equal(attachments.data?.length, 1)

const message = await repository.appendMarkerMessage({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  message: {
    role: 'user',
    kind: 'note',
    text: 'Smoke Marker Chat message.',
    relatedAttachmentId: attachment.data!.id,
  },
})
assertSafeResult(message, 'append marker message')
assert.equal((await repository.getMarker(createdMarker.data!.id)).data?.messageCount, 1)

const messages = await repository.listMarkerMessages(createdMarker.data!.id)
assertSafeResult(messages, 'list marker messages')
assert.equal(messages.data?.some((item) => item.id === message.data!.id), true)

const intent = await repository.saveMarkerIntent({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  intent: {
    action: 'add_caption_or_text',
    status: 'draft_intent',
    instruction: 'Add a future mock caption only.',
    timeRangeLabel: '0:08',
    startTimeSeconds: 8,
    visualBehavior: 'add_graphic_overlay',
    audioBehavior: 'no_audio_change',
    captionBehavior: 'add_caption',
    providedAssetIds: [],
    priority: 'must_follow',
    confidence: 'medium',
    blockingNeeds: [],
    doNotCopyNotes: ['Adapted, not copied.'],
    plannerHints: ['Future planner hint only.'],
    latestUserMessageId: message.data!.id,
  },
})
assertSafeResult(intent, 'save intent')
assert.equal((await repository.getMarker(createdMarker.data!.id)).data?.intentId, intent.data!.id)

const updatedIntent = await repository.updateMarkerIntent({
  intentId: intent.data!.id,
  patch: {
    status: 'confirmed',
    confidence: 'high',
  },
})
assertSafeResult(updatedIntent, 'update intent')
assert.equal(updatedIntent.data?.status, 'confirmed')

const getIntent = await repository.getMarkerIntent(createdMarker.data!.id)
assertSafeResult(getIntent, 'get marker intent')
assert.equal(getIntent.data?.id, intent.data!.id)

const confirmation = await repository.saveMarkerConfirmation({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  intentId: intent.data!.id,
  summary: 'Confirmed smoke marker intent.',
})
assertSafeResult(confirmation, 'save confirmation')
const confirmations = await repository.listMarkerConfirmations(createdMarker.data!.id)
assertSafeResult(confirmations, 'list confirmations')
assert.equal(confirmations.data?.some((item) => item.id === confirmation.data!.id), true)

const confirmedMarker = await repository.confirmMarker({
  markerId: createdMarker.data!.id,
  intentId: intent.data!.id,
  summary: 'Confirm marker through repository smoke.',
})
assertSafeResult(confirmedMarker, 'confirm marker')
assert.equal(confirmedMarker.data?.status, 'confirmed')

const conflict = await repository.saveMarkerConflict({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  conflict: {
    qaStatus: 'conflict',
    title: 'Smoke conflict',
    summary: 'Mock conflict requires review.',
    recommendedResolution: 'Owner reviews before planner use.',
    blocksPlan: true,
    requiresUserReview: true,
  },
})
assertSafeResult(conflict, 'save conflict')
const conflicts = await repository.listMarkerConflicts({ briefId: createdBrief.data!.id })
assertSafeResult(conflicts, 'list conflicts')
assert.equal(conflicts.data?.some((item) => item.id === conflict.data!.id), true)
assert.equal((await repository.getEditBrief(createdBrief.data!.id)).data?.conflictCount, 1)

const revision = await repository.saveMarkerRevision({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  revision: {
    previousIntentId: intent.data!.id,
    summary: 'Smoke marker revision.',
    reason: 'Owner changed marker language.',
  },
})
assertSafeResult(revision, 'save revision')
const revisions = await repository.listMarkerRevisions(createdMarker.data!.id)
assertSafeResult(revisions, 'list revisions')
assert.equal(revisions.data?.some((item) => item.id === revision.data!.id), true)

const log = await repository.appendApplicationLog({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  markerId: createdMarker.data!.id,
  summary: 'Smoke application log only.',
  appliedToPlan: false,
})
assertSafeResult(log, 'append application log')
const logs = await repository.listApplicationLogs(createdBrief.data!.id)
assertSafeResult(logs, 'list application logs')
assert.equal(logs.data?.some((item) => item.id === log.data!.id), true)

const recommendedExport = await repository.recommendExportSettings({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  platformTarget: 'youtube_standard',
})
assertSafeResult(recommendedExport, 'recommend export settings')
assert.equal(validateProjectEditSessionExportSettings(recommendedExport.data!).ok, true)

const exportSettings = await repository.getExportSettings(createdBrief.data!.editSessionId)
assertSafeResult(exportSettings, 'get export settings')
assert.equal(exportSettings.data?.id, recommendedExport.data!.id)

const updatedExport = await repository.updateExportSettings({
  editSessionId: createdBrief.data!.editSessionId,
  patch: {
    frameRate: 24,
    summary: 'Smoke user override export settings.',
  },
})
assertSafeResult(updatedExport, 'update export settings')
assert.equal(updatedExport.data?.frameRate, 24)

const timeline = await repository.createTimelineMarkerModels(seededBrief.id)
assertSafeResult(timeline, 'timeline models')
assert.ok((timeline.data ?? []).length > 0)

const seededMarker = db.projectEditBriefMarkers.find((marker) => marker.briefId === seededBrief.id) ?? db.projectEditBriefMarkers[0]
assert.ok(seededMarker, 'seeded marker should exist')
const drawer = await repository.createMarkerDrawerModel(seededMarker.id)
assertSafeResult(drawer, 'drawer model')
assert.equal(validateProjectEditBriefDrawerModel(drawer.data!).ok, true)

const bundle = await repository.createBriefBundle(seededBrief.id)
assertSafeResult(bundle, 'bundle')
assert.equal(validateProjectEditBriefBundle(bundle.data!).ok, true)

const summary = await repository.createBriefSummary(seededBrief.id)
assertSafeResult(summary, 'summary')
assert.ok(summary.data?.includes(seededBrief.title))

const removedAttachment = await repository.removeMarkerAttachment(attachment.data!.id)
assertSafeResult(removedAttachment, 'remove attachment')
assert.equal((await repository.getMarker(createdMarker.data!.id)).data?.attachmentCount, 0)

const archivedMarker = await repository.archiveMarker(createdMarker.data!.id)
assertSafeResult(archivedMarker, 'archive marker')
assert.equal(archivedMarker.data?.status, 'archived')

const deletedMarker = await repository.createMarker({
  projectId: createdBrief.data!.projectId,
  editSessionId: createdBrief.data!.editSessionId,
  briefId: createdBrief.data!.id,
  marker: {
    markerType: 'general_note',
    status: 'draft',
    priority: 'optional',
    timeMode: 'point',
    startTimeSeconds: 15,
    title: 'Delete smoke marker',
    userNote: 'This marker is deleted in mock state.',
    aiMode: 'off',
    qaStatus: 'not_checked',
  },
})
assertSafeResult(deletedMarker, 'create marker for delete')
const deleteResult = await repository.deleteMarker(deletedMarker.data!.id)
assertSafeResult(deleteResult, 'delete marker')
assert.equal(deleteResult.data?.deleted, true)
assert.equal((await repository.getMarker(deletedMarker.data!.id)).data, undefined)

const archivedBrief = await repository.archiveEditBrief(createdBrief.data!.id)
assertSafeResult(archivedBrief, 'archive brief')
assert.equal(archivedBrief.data?.status, 'archived')

const seededAttachment = db.projectEditBriefMarkerAttachments[0]
const seededMessage = db.projectEditBriefMarkerMessages[0]
const seededIntent = db.projectEditBriefMarkerIntents[0]
const seededConfirmation = db.projectEditBriefMarkerConfirmations[0]
const seededConflict = db.projectEditBriefMarkerConflicts[0]
const seededRevision = db.projectEditBriefMarkerRevisions[0]
const seededLog = db.projectEditBriefApplicationLogs[0]
const seededExport = db.projectEditSessionExportSettings[0]
assert.equal(mapProjectEditBriefRowToRecord(mapProjectEditBriefRecordToInsertRow(seededBrief)).id, seededBrief.id)
assert.equal(mapProjectEditBriefMarkerRowToRecord(mapProjectEditBriefMarkerRecordToInsertRow(seededMarker)).id, seededMarker.id)
assert.equal(mapProjectEditBriefMarkerAttachmentRowToRecord(mapProjectEditBriefMarkerAttachmentRecordToInsertRow(seededAttachment)).id, seededAttachment.id)
assert.equal(mapProjectEditBriefMarkerMessageRowToRecord(mapProjectEditBriefMarkerMessageRecordToInsertRow(seededMessage)).id, seededMessage.id)
assert.equal(mapProjectEditBriefMarkerIntentRowToRecord(mapProjectEditBriefMarkerIntentRecordToInsertRow(seededIntent)).id, seededIntent.id)
assert.equal(mapProjectEditBriefMarkerConfirmationRowToRecord(mapProjectEditBriefMarkerConfirmationRecordToInsertRow(seededConfirmation)).id, seededConfirmation.id)
assert.equal(mapProjectEditBriefMarkerConflictRowToRecord(mapProjectEditBriefMarkerConflictRecordToInsertRow(seededConflict)).id, seededConflict.id)
assert.equal(mapProjectEditBriefMarkerRevisionRowToRecord(mapProjectEditBriefMarkerRevisionRecordToInsertRow(seededRevision)).id, seededRevision.id)
assert.equal(mapProjectEditBriefApplicationLogRowToRecord(mapProjectEditBriefApplicationLogRecordToInsertRow(seededLog)).id, seededLog.id)
assert.equal(mapProjectEditSessionExportSettingsRowToRecord(mapProjectEditSessionExportSettingsRecordToInsertRow(seededExport)).id, seededExport.id)
assert.equal(createProjectEditBriefRowMappingSummary({
  tableName: 'project_edit_briefs',
  sourceId: seededBrief.id,
  mappedId: seededBrief.id,
}).ok, true)

assert.ok(createProjectEditBriefRepositoryReadinessSummary(repository.context).some((line) => line.includes('MockDatabase')))
assert.ok(createProjectEditBriefRepositoryResultSummary(getBrief).includes('succeeded'))
assert.ok(createProjectEditBriefRepositoryValidationSummary({
  context: repository.context,
  bundle: bundle.data,
  result: getBrief,
}).length >= 2)

const disabled = createSupabaseDisabledProjectEditBriefRepository()
const disabledRead = await disabled.getEditBrief(seededBrief.id)
assertSafeResult(disabledRead, 'disabled supabase read')
assert.equal(disabledRead.ok, false)
assert.equal(disabledRead.error?.code, 'PROJECT_EDIT_BRIEF_REPOSITORY_DISABLED')
const disabledWrite = await disabled.createEditBrief(createRequest.input)
assertSafeResult(disabledWrite, 'disabled supabase write')
assert.equal(disabledWrite.ok, false)
assert.equal(validateProjectEditBriefRepositoryOperationAllowed(disabled.context, 'create_brief').ok, false)

const orchestrator = await runMockProjectEditBriefRepositoryOrchestrator()
assert.equal(orchestrator.ok, true)
assert.equal(orchestrator.nextStep, 'RP-EDITBRIEF-04 — API Routes + Client Layer')
assert.ok(orchestrator.summary.some((line) => line.includes('Scenario count')))

assert.ok(MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.length >= 64, 'repository scenario count should be at least 64')
assert.equal(MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.every((scenario) => scenario.mockOnly && !scenario.sideEffectsExpected), true)

for (const docPath of requiredDocs) {
  assert.equal(existsSync(path.join(repoRoot, docPath)), true, `${docPath} should exist`)
  const content = read(docPath)
  assert.ok(content.includes('ProjectEditBrief'), `${docPath} should mention ProjectEditBrief`)
  assert.ok(content.includes('mock repository'), `${docPath} should mention mock repository`)
  assert.ok(content.includes('Supabase'), `${docPath} should mention Supabase`)
  assert.ok(content.includes('no API handlers'), `${docPath} should mention no API handlers`)
  assert.ok(content.includes('no migration'), `${docPath} should mention no migration`)
  assert.ok(content.includes('no direct Supabase CLI'), `${docPath} should mention no direct Supabase CLI`)
}

assert.equal(migrationCount(), 24, 'Supabase migration count should remain 24')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-repository',
  briefCount: db.projectEditBriefs.length,
  markerCount: db.projectEditBriefMarkers.length,
  scenarioCount: MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.length,
  migrations: migrationCount(),
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  providerCallMade: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  nextStep: orchestrator.nextStep,
}, null, 2))
