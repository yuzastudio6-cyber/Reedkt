import type {
  ProjectEditSessionRepositoryMode,
  ProjectEditSessionRepositoryOperation,
} from '../../types/project-edit-session-repository'

export interface MockProjectEditSessionRepositoryScenario {
  id: string
  title: string
  operation: ProjectEditSessionRepositoryOperation
  expectedOk: boolean
  expectedRepositoryMode: ProjectEditSessionRepositoryMode
  expectedSupabaseWriteMade: false
  expectedProviderCallMade: false
  mockOnly: true
}

function scenario(
  id: string,
  title: string,
  operation: ProjectEditSessionRepositoryOperation,
  expectedOk = true,
  expectedRepositoryMode: ProjectEditSessionRepositoryMode = 'mock_database',
): MockProjectEditSessionRepositoryScenario {
  return {
    id,
    title,
    operation,
    expectedOk,
    expectedRepositoryMode,
    expectedSupabaseWriteMade: false,
    expectedProviderCallMade: false,
    mockOnly: true,
  }
}

export const MOCK_PROJECT_EDIT_SESSION_REPOSITORY_SCENARIOS: MockProjectEditSessionRepositoryScenario[] = [
  scenario('project-edit-session-repository-list-sessions', 'Repository lists sessions by project.', 'list_sessions'),
  scenario('project-edit-session-repository-get-session', 'Repository gets session by ID.', 'get_session'),
  scenario('project-edit-session-repository-create-session', 'Repository creates session.', 'create_session'),
  scenario('project-edit-session-repository-update-session', 'Repository updates session.', 'update_session'),
  scenario('project-edit-session-repository-archive-session', 'Repository archives session.', 'archive_session'),
  scenario('project-edit-session-repository-duplicate-session', 'Repository duplicates session.', 'duplicate_session'),
  scenario('project-edit-session-repository-list-messages', 'Repository lists messages.', 'list_messages'),
  scenario('project-edit-session-repository-append-message', 'Repository appends message.', 'append_message'),
  scenario('project-edit-session-repository-list-sources', 'Repository lists sources.', 'list_sources'),
  scenario('project-edit-session-repository-save-source', 'Repository saves one source.', 'save_source'),
  scenario('project-edit-session-repository-save-sources', 'Repository saves multiple sources.', 'save_sources'),
  scenario('project-edit-session-repository-list-memory', 'Repository lists memory.', 'list_memory'),
  scenario('project-edit-session-repository-get-memory-layer', 'Repository gets memory layer.', 'get_memory_layer'),
  scenario('project-edit-session-repository-upsert-memory', 'Repository upserts memory.', 'upsert_memory'),
  scenario('project-edit-session-repository-save-snapshot', 'Repository saves snapshot.', 'save_snapshot'),
  scenario('project-edit-session-repository-get-latest-snapshot', 'Repository gets latest snapshot.', 'get_latest_snapshot'),
  scenario('project-edit-session-repository-list-snapshots', 'Repository lists snapshots.', 'list_snapshots'),
  scenario('project-edit-session-repository-save-version', 'Repository saves version.', 'save_version'),
  scenario('project-edit-session-repository-list-versions', 'Repository lists versions.', 'list_versions'),
  scenario('project-edit-session-repository-get-latest-version', 'Repository gets latest version.', 'get_latest_version'),
  scenario('project-edit-session-repository-save-preview', 'Repository saves preview.', 'save_preview'),
  scenario('project-edit-session-repository-list-previews', 'Repository lists previews.', 'list_previews'),
  scenario('project-edit-session-repository-get-latest-preview', 'Repository gets latest preview.', 'get_latest_preview'),
  scenario('project-edit-session-repository-save-revision', 'Repository saves revision.', 'save_revision'),
  scenario('project-edit-session-repository-list-revisions', 'Repository lists revisions.', 'list_revisions'),
  scenario('project-edit-session-repository-append-event', 'Repository appends event.', 'append_event'),
  scenario('project-edit-session-repository-list-events', 'Repository lists events.', 'list_events'),
  scenario('project-edit-session-repository-create-card-model', 'Repository creates card model.', 'create_card_model'),
  scenario('project-edit-session-repository-list-card-models', 'Repository lists card models.', 'list_card_models'),
  scenario('project-edit-session-repository-create-session-bundle', 'Repository creates session bundle.', 'create_session_bundle'),
  scenario('project-edit-session-repository-archive-hidden', 'Archived session no longer appears in active list.', 'list_sessions'),
  scenario('project-edit-session-repository-archive-include', 'Archived session appears when includeArchived is requested.', 'list_sessions'),
  scenario('project-edit-session-repository-duplicate-new-id', 'Duplicated session has new ID.', 'duplicate_session'),
  scenario('project-edit-session-repository-duplicate-aspect', 'Duplicated session preserves aspect ratio.', 'duplicate_session'),
  scenario('project-edit-session-repository-duplicate-approval-reset', 'Duplicated session does not copy approval as approved.', 'duplicate_session'),
  scenario('project-edit-session-repository-revision-resets-approval', 'Appending revision resets approval when required.', 'save_revision'),
  scenario('project-edit-session-repository-latest-snapshot-ordering', 'Latest snapshot ordering works.', 'get_latest_snapshot'),
  scenario('project-edit-session-repository-latest-version-ordering', 'Latest version ordering works.', 'get_latest_version'),
  scenario('project-edit-session-repository-latest-preview-ordering', 'Latest preview ordering works.', 'get_latest_preview'),
  scenario('project-edit-session-repository-source-order', 'Source order preserved.', 'list_sources'),
  scenario('project-edit-session-repository-memory-upsert-replaces', 'Memory layer upsert replaces existing layer.', 'upsert_memory'),
  scenario('project-edit-session-repository-card-vertical', 'Card model vertical shape works.', 'create_card_model'),
  scenario('project-edit-session-repository-card-wide', 'Card model wide shape works.', 'create_card_model'),
  scenario('project-edit-session-repository-dna-badge', 'DNA-backed session badge appears.', 'create_card_model'),
  scenario('project-edit-session-repository-legacy-no-dna-badge', 'Legacy no-DNA session has no DNA badge.', 'create_card_model'),
  scenario('project-edit-session-repository-bundle-children', 'Bundle includes messages, sources, and memory.', 'create_session_bundle'),
  scenario('project-edit-session-repository-supabase-list-blocked', 'Supabase skeleton blocks list.', 'list_sessions', false, 'supabase_disabled'),
  scenario('project-edit-session-repository-supabase-create-blocked', 'Supabase skeleton blocks create.', 'create_session', false, 'supabase_disabled'),
  scenario('project-edit-session-repository-supabase-no-read-write', 'Supabase skeleton does not read or write Supabase.', 'list_sessions', false, 'supabase_disabled'),
  scenario('project-edit-session-repository-row-session', 'Row mapper maps session.', 'get_session'),
  scenario('project-edit-session-repository-row-message', 'Row mapper maps message.', 'list_messages'),
  scenario('project-edit-session-repository-row-memory', 'Row mapper maps memory.', 'list_memory'),
  scenario('project-edit-session-repository-row-version-preview', 'Row mapper maps version and preview.', 'list_versions'),
  scenario('project-edit-session-repository-validation-pass', 'Validation passes for mock result.', 'create_session_bundle'),
  scenario('project-edit-session-repository-validation-side-effects', 'Validation blocks side-effect flags.', 'create_session_bundle', false),
  scenario('project-edit-session-repository-summary-readable', 'Repository summary readable.', 'create_session_bundle'),
  scenario('project-edit-session-repository-no-provider-call', 'No provider call made.', 'create_session_bundle'),
  scenario('project-edit-session-repository-no-worker-job', 'No worker job created.', 'create_session_bundle'),
  scenario('project-edit-session-repository-no-render-job', 'No render job created.', 'create_session_bundle'),
  scenario('project-edit-session-repository-no-credit-spend', 'No credit spend.', 'create_session_bundle'),
]
