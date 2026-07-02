import type {
  ProjectEditBriefRepositoryOperation,
} from '../../types/project-edit-brief-repository'

export interface MockProjectEditBriefRepositoryScenario {
  id: string
  title: string
  operation: ProjectEditBriefRepositoryOperation | 'row_mapping' | 'validation' | 'disabled_supabase' | 'readiness'
  expectedStatus: 'ready_mock' | 'blocked_disabled_supabase'
  mockOnly: true
  sideEffectsExpected: false
  notes: string[]
}

const operationScenarios: Array<[ProjectEditBriefRepositoryOperation, string]> = [
  ['get_brief', 'Get a seeded Edit Brief by ID.'],
  ['get_brief_for_session', 'Get the latest non-archived Edit Brief for an Edit Chat.'],
  ['create_brief', 'Create an optional Edit Brief shell for an Edit Chat.'],
  ['update_brief', 'Update title, summary, status, and metadata.'],
  ['archive_brief', 'Archive an Edit Brief without deleting markers.'],
  ['list_markers', 'List timeline markers in time order.'],
  ['get_marker', 'Get a marker by ID.'],
  ['create_marker', 'Create a marker and recompute brief counts.'],
  ['update_marker', 'Update a marker and maintain counts.'],
  ['delete_marker', 'Hard-delete a marker and scoped children in mock state.'],
  ['confirm_marker', 'Confirm a marker and save confirmation metadata.'],
  ['archive_marker', 'Archive a marker without deleting it.'],
  ['list_marker_attachments', 'List marker attachments.'],
  ['add_marker_attachment', 'Add metadata-only attachment and recompute attachment count.'],
  ['remove_marker_attachment', 'Remove attachment and recompute attachment count.'],
  ['list_marker_messages', 'List Marker Chat messages.'],
  ['append_marker_message', 'Append Marker Chat message and recompute message count.'],
  ['get_marker_intent', 'Get structured marker intent.'],
  ['save_marker_intent', 'Save marker intent and link marker.intentId.'],
  ['update_marker_intent', 'Update marker intent safely.'],
  ['list_marker_confirmations', 'List marker confirmations.'],
  ['save_marker_confirmation', 'Save marker confirmation.'],
  ['list_marker_conflicts', 'List conflicts by brief or marker.'],
  ['save_marker_conflict', 'Save conflict and recompute brief conflict counts.'],
  ['list_marker_revisions', 'List marker revisions.'],
  ['save_marker_revision', 'Save marker revision metadata.'],
  ['list_application_logs', 'List Edit Brief application logs.'],
  ['append_application_log', 'Append application log metadata.'],
  ['get_export_settings', 'Read session-owned export settings.'],
  ['recommend_export_settings', 'Recommend mock export settings without rendering.'],
  ['update_export_settings', 'Update session-owned export settings.'],
  ['create_timeline_marker_models', 'Create timeline marker models from repository markers.'],
  ['create_marker_drawer_model', 'Create drawer model from repository marker state.'],
  ['create_brief_bundle', 'Create full Edit Brief repository bundle.'],
  ['create_brief_summary', 'Create readable summary.'],
]

const extraScenarios: Array<Omit<MockProjectEditBriefRepositoryScenario, 'mockOnly' | 'sideEffectsExpected'>> = [
  {
    id: 'project-edit-brief-repository-fixture-seeding',
    title: 'Fixture seeding loads RP-EDITBRIEF-02 briefs when collections are empty.',
    operation: 'readiness',
    expectedStatus: 'ready_mock',
    notes: ['At least 12 fixture briefs seed from createMockProjectEditBriefFixtureBundle.'],
  },
  {
    id: 'project-edit-brief-repository-count-confirmed',
    title: 'Confirmed marker count recomputes after confirmMarker.',
    operation: 'confirm_marker',
    expectedStatus: 'ready_mock',
    notes: ['Confirmed markers contribute to ready-for-plan summaries.'],
  },
  {
    id: 'project-edit-brief-repository-count-attachments',
    title: 'Marker attachment count recomputes after attachment add/remove.',
    operation: 'add_marker_attachment',
    expectedStatus: 'ready_mock',
    notes: ['Attachments remain metadata-only.'],
  },
  {
    id: 'project-edit-brief-repository-count-marker-chat',
    title: 'Marker message count recomputes after Marker Chat append.',
    operation: 'append_marker_message',
    expectedStatus: 'ready_mock',
    notes: ['Marker Chat remains scoped to one marker.'],
  },
  {
    id: 'project-edit-brief-repository-conflict-status',
    title: 'Conflict save updates marker QA status and brief conflict counts.',
    operation: 'save_marker_conflict',
    expectedStatus: 'ready_mock',
    notes: ['Conflicts require owner review before future planning.'],
  },
  {
    id: 'project-edit-brief-repository-delete-children',
    title: 'deleteMarker removes marker-scoped children in mock state.',
    operation: 'delete_marker',
    expectedStatus: 'ready_mock',
    notes: ['archiveMarker preserves data when hard delete is not wanted.'],
  },
  {
    id: 'project-edit-brief-repository-session-export-owner',
    title: 'Export settings remain ProjectEditSession-owned.',
    operation: 'update_export_settings',
    expectedStatus: 'ready_mock',
    notes: ['Brief methods expose settings for planning but do not make them Brief-owned.'],
  },
  {
    id: 'project-edit-brief-repository-row-brief',
    title: 'Brief row mapper round trips snake_case to camelCase.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Future project_edit_briefs table mapping stays explicit.'],
  },
  {
    id: 'project-edit-brief-repository-row-marker',
    title: 'Marker row mapper round trips time/status/count fields.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Timeline marker mapping preserves seconds and priority.'],
  },
  {
    id: 'project-edit-brief-repository-row-attachment',
    title: 'Attachment row mapper preserves metadata-only flags and notes.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['No storage object or signed URL is created.'],
  },
  {
    id: 'project-edit-brief-repository-row-message',
    title: 'Marker Chat message row mapper preserves scoped links.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Marker Chat is not the main Edit Chat stream.'],
  },
  {
    id: 'project-edit-brief-repository-row-intent',
    title: 'Intent row mapper preserves planner hints and do-not-copy notes.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Structured intent remains planning metadata only.'],
  },
  {
    id: 'project-edit-brief-repository-row-confirmation',
    title: 'Confirmation row mapper preserves AI mode and user-confirmed state.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['AI mode is metadata only.'],
  },
  {
    id: 'project-edit-brief-repository-row-conflict',
    title: 'Conflict row mapper preserves blocking and review flags.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Future planner must respect conflict blockers.'],
  },
  {
    id: 'project-edit-brief-repository-row-revision',
    title: 'Revision row mapper preserves previous/new intent links.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['No plan mutation occurs in this milestone.'],
  },
  {
    id: 'project-edit-brief-repository-row-log',
    title: 'Application log row mapper preserves applied-to-plan flag.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['Application log is mock metadata only.'],
  },
  {
    id: 'project-edit-brief-repository-row-export',
    title: 'Export settings row mapper preserves session-owned settings.',
    operation: 'row_mapping',
    expectedStatus: 'ready_mock',
    notes: ['No render, export, or file output is created.'],
  },
  {
    id: 'project-edit-brief-repository-validation-context',
    title: 'Repository context validation requires mockOnly safety.',
    operation: 'validation',
    expectedStatus: 'ready_mock',
    notes: ['Mock mode must use mock_write_only.'],
  },
  {
    id: 'project-edit-brief-repository-validation-result',
    title: 'Repository result validation rejects any side-effect flag.',
    operation: 'validation',
    expectedStatus: 'ready_mock',
    notes: ['Supabase/storage/provider/worker/render/credit flags stay false.'],
  },
  {
    id: 'project-edit-brief-repository-disabled-supabase-read',
    title: 'Disabled Supabase read returns blocked result.',
    operation: 'disabled_supabase',
    expectedStatus: 'blocked_disabled_supabase',
    notes: ['No Supabase client is created.'],
  },
  {
    id: 'project-edit-brief-repository-disabled-supabase-write',
    title: 'Disabled Supabase write returns blocked result.',
    operation: 'disabled_supabase',
    expectedStatus: 'blocked_disabled_supabase',
    notes: ['No Supabase read or write is attempted.'],
  },
  {
    id: 'project-edit-brief-repository-no-api',
    title: 'Repository layer does not create API handlers.',
    operation: 'readiness',
    expectedStatus: 'ready_mock',
    notes: ['RP-EDITBRIEF-04 owns route/client work.'],
  },
  {
    id: 'project-edit-brief-repository-no-ui',
    title: 'Repository layer does not change UI routes.',
    operation: 'readiness',
    expectedStatus: 'ready_mock',
    notes: ['ProjectEditSessionChatPage and ChatNativeEditor remain untouched.'],
  },
  {
    id: 'project-edit-brief-repository-next-step',
    title: 'Repository orchestrator recommends RP-EDITBRIEF-04.',
    operation: 'readiness',
    expectedStatus: 'ready_mock',
    notes: ['Owner review remains pending before route/client work.'],
  },
  {
    id: 'project-edit-brief-repository-no-side-effects',
    title: 'All repository scenario side-effect expectations stay false.',
    operation: 'validation',
    expectedStatus: 'ready_mock',
    notes: ['No provider, worker, render, upload, file-byte read, or credit action occurs.'],
  },
  {
    id: 'project-edit-brief-repository-supabase-schema-future',
    title: 'Supabase skeleton documents future project_edit_briefs dependency.',
    operation: 'disabled_supabase',
    expectedStatus: 'blocked_disabled_supabase',
    notes: ['Schema, auth/RLS, service-role, and remote deployment gates remain future.'],
  },
  {
    id: 'project-edit-brief-repository-application-log-scope',
    title: 'Application logs stay scoped to one Edit Brief and optional marker.',
    operation: 'append_application_log',
    expectedStatus: 'ready_mock',
    notes: ['Logs do not mutate future edit plans or render state.'],
  },
  {
    id: 'project-edit-brief-repository-marker-drawer-links',
    title: 'Drawer model includes marker-scoped intent, attachments, messages, confirmations, and conflicts.',
    operation: 'create_marker_drawer_model',
    expectedStatus: 'ready_mock',
    notes: ['Drawer model remains data only; no UI route is mounted in this milestone.'],
  },
  {
    id: 'project-edit-brief-repository-timeline-order',
    title: 'Timeline marker models preserve deterministic time ordering.',
    operation: 'create_timeline_marker_models',
    expectedStatus: 'ready_mock',
    notes: ['Timeline data comes from repository markers without media inspection.'],
  },
  {
    id: 'project-edit-brief-repository-marker-archive-preserves',
    title: 'archiveMarker preserves marker-scoped records.',
    operation: 'archive_marker',
    expectedStatus: 'ready_mock',
    notes: ['Archived markers are excluded from active brief counts.'],
  },
  {
    id: 'project-edit-brief-repository-session-lookup-order',
    title: 'Session lookup prefers recently updated non-archived briefs.',
    operation: 'get_brief_for_session',
    expectedStatus: 'ready_mock',
    notes: ['Multiple briefs are handled deterministically.'],
  },
]

export const MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS: MockProjectEditBriefRepositoryScenario[] = [
  ...operationScenarios.map(([operation, title]) => ({
    id: `project-edit-brief-repository-${operation.replace(/_/g, '-')}`,
    title,
    operation,
    expectedStatus: 'ready_mock' as const,
    mockOnly: true as const,
    sideEffectsExpected: false as const,
    notes: ['Operation is served by MockDatabase only.'],
  })),
  ...extraScenarios.map((scenario) => ({
    ...scenario,
    mockOnly: true as const,
    sideEffectsExpected: false as const,
  })),
]

export function getMockProjectEditBriefRepositoryScenarioCount(): number {
  return MOCK_PROJECT_EDIT_BRIEF_REPOSITORY_SCENARIOS.length
}
