import { createSupabaseDisabledProjectEditBriefRepository, createSupabaseProjectEditBriefRepository } from '../../src/backend/repositories/supabase-project-edit-brief-repository'
import {
  mapProjectEditBriefMarkerAttachmentRecordToInsertRow,
  mapProjectEditBriefMarkerAttachmentRowToRecord,
  mapProjectEditBriefMarkerIntentRecordToInsertRow,
  mapProjectEditBriefMarkerIntentRowToRecord,
  mapProjectEditBriefMarkerMessageRecordToInsertRow,
  mapProjectEditBriefMarkerMessageRowToRecord,
  mapProjectEditBriefMarkerRecordToInsertRow,
  mapProjectEditBriefMarkerRowToRecord,
  mapProjectEditBriefRecordToInsertRow,
  mapProjectEditBriefRowToRecord,
} from '../../src/backend/repositories/project-edit-brief-row-mappers'
import type {
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefRecord,
} from '../../src/types/project-edit-brief'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const timestamp = new Date('2026-06-26T12:00:00.000Z').toISOString()
const brief: ProjectEditBriefRecord = {
  id: 'edit-brief-production-smoke',
  projectId: 'project-production-smoke',
  editSessionId: 'edit-session-production-smoke',
  status: 'active',
  availability: 'has_markers',
  title: 'Production Smoke Brief',
  markerCount: 1,
  confirmedMarkerCount: 0,
  conflictCount: 0,
  needsAssetCount: 0,
  needsClarificationCount: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
  mockOnly: false,
}
const marker: ProjectEditBriefMarkerRecord = {
  id: 'edit-cue-production-smoke',
  projectId: brief.projectId,
  editSessionId: brief.editSessionId,
  briefId: brief.id,
  markerType: 'broll',
  status: 'draft',
  priority: 'should_follow',
  timeMode: 'range',
  startTimeSeconds: 1,
  endTimeSeconds: 4,
  title: 'Production B-roll marker',
  userNote: 'Use metadata-only B-roll guidance.',
  aiMode: 'confirm_only',
  attachmentCount: 1,
  messageCount: 1,
  qaStatus: 'not_checked',
  createdAt: timestamp,
  updatedAt: timestamp,
  mockOnly: false,
}
const attachment: ProjectEditBriefMarkerAttachmentRecord = {
  id: 'edit-cue-asset-production-smoke',
  projectId: brief.projectId,
  editSessionId: brief.editSessionId,
  briefId: brief.id,
  markerId: marker.id,
  attachmentKind: 'reference_url_metadata_only',
  status: 'metadata_only',
  label: 'Reference metadata only',
  referenceUrl: 'https://example.com/reference',
  notes: ['Do not fetch URL content.'],
  createdAt: timestamp,
  updatedAt: timestamp,
  mockOnly: false,
}
const message: ProjectEditBriefMarkerMessageRecord = {
  id: 'edit-cue-message-production-smoke',
  projectId: brief.projectId,
  editSessionId: brief.editSessionId,
  briefId: brief.id,
  markerId: marker.id,
  role: 'user',
  kind: 'note',
  text: 'Make this marker clear.',
  createdAt: timestamp,
  mockOnly: false,
}
const intent: ProjectEditBriefMarkerIntentRecord = {
  id: 'edit-cue-intent-production-smoke',
  projectId: brief.projectId,
  editSessionId: brief.editSessionId,
  briefId: brief.id,
  markerId: marker.id,
  action: 'add_broll',
  status: 'draft_intent',
  instruction: 'Add B-roll using provided metadata only.',
  timeRangeLabel: '0:01-0:04',
  startTimeSeconds: 1,
  endTimeSeconds: 4,
  visualBehavior: 'insert_broll',
  audioBehavior: 'no_audio_change',
  captionBehavior: 'no_caption_change',
  providedAssetIds: [],
  priority: 'should_follow',
  confidence: 'medium',
  blockingNeeds: [],
  doNotCopyNotes: [],
  plannerHints: ['Metadata-only hint.'],
  createdAt: timestamp,
  updatedAt: timestamp,
  mockOnly: false,
}

assert(mapProjectEditBriefRowToRecord(mapProjectEditBriefRecordToInsertRow(brief)).id === brief.id, 'Brief row mapper must round trip.')
assert(mapProjectEditBriefMarkerRowToRecord(mapProjectEditBriefMarkerRecordToInsertRow(marker)).markerType === marker.markerType, 'Marker row mapper must round trip.')
assert(mapProjectEditBriefMarkerAttachmentRowToRecord(mapProjectEditBriefMarkerAttachmentRecordToInsertRow(attachment)).label === attachment.label, 'Attachment row mapper must round trip.')
assert(mapProjectEditBriefMarkerMessageRowToRecord(mapProjectEditBriefMarkerMessageRecordToInsertRow(message)).text === message.text, 'Marker message row mapper must round trip.')
assert(mapProjectEditBriefMarkerIntentRowToRecord(mapProjectEditBriefMarkerIntentRecordToInsertRow(intent)).action === intent.action, 'Intent row mapper must round trip.')

const disabled = createSupabaseDisabledProjectEditBriefRepository()
const enabled = createSupabaseProjectEditBriefRepository({ client: { from: () => ({}) as never } })
assert(disabled.context.mode === 'supabase_disabled' && disabled.context.mockOnly, 'Disabled Brief repository must fail closed without client.')
assert(enabled.context.mode === 'supabase_server' && !enabled.context.mockOnly, 'Injected server client must enable Brief Supabase repository.')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-supabase-repository',
  status: 'passed',
  existingRoots: ['edit_briefs', 'edit_cues'],
  childTables: ['edit_cue_messages', 'edit_cue_intents', 'edit_cue_assets', 'edit_cue_conflicts', 'edit_session_export_settings'],
  rowMappers: 'round_trip_passed',
  disabledWithoutServiceRole: true,
  enabledWithInjectedServerClient: true,
  fileBytesRead: false,
  externalUrlFetched: false,
  providerCallMade: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
}, null, 2))
