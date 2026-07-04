export interface MockProjectEditSessionScenario {
  id: string
  title: string
  expectedOk: true
  mockOnly: true
  summary: string
}

function scenario(
  id: string,
  title: string,
  summary: string,
): MockProjectEditSessionScenario {
  return {
    id,
    title,
    expectedOk: true,
    mockOnly: true,
    summary,
  }
}

export const MOCK_PROJECT_EDIT_SESSION_SCENARIOS: MockProjectEditSessionScenario[] = [
  scenario('fixture-bundle-contains-sessions', 'Fixture bundle contains sessions', 'At least 10 ProjectEditSession records exist.'),
  scenario('vertical-card-shape', '9:16 edit card shape is vertical', '9:16 maps to the vertical card shape.'),
  scenario('wide-card-shape', '16:9 edit card shape is wide', '16:9 maps to the wide card shape.'),
  scenario('square-card-shape', '1:1 edit card shape is square', '1:1 maps to the square card shape.'),
  scenario('social-card-shape', '4:5 edit card shape is social', '4:5 maps to the social card shape.'),
  scenario('custom-card-shape', 'Custom aspect ratio card shape is custom', 'Custom ratios map to the custom card shape.'),
  scenario('dna-applied-badge', 'DNA applied edit has DNA badge', 'DNA-backed sessions show the Preference DNA badge.'),
  scenario('legacy-no-dna-no-badge', 'Legacy no-DNA edit has no DNA badge', 'Legacy sessions do not show a DNA badge.'),
  scenario('draft-status', 'Draft edit has draft status', 'Draft sessions stay draft and unapproved.'),
  scenario('approved-status', 'Approved edit has approved status', 'Approved fixtures expose approval state.'),
  scenario('needs-review-status', 'Needs-review edit has needs-review status', 'Review-required fixtures are represented.'),
  scenario('revision-resets-approval', 'Revision-requested edit resets approval', 'Revision fixtures reset approval status.'),
  scenario('messages-link-edit-session-id', 'Messages link to editSessionId', 'Every message belongs to its Edit Chat.'),
  scenario('sources-preserve-order', 'Sources preserve source order', 'Source order index remains deterministic.'),
  scenario('sources-preserve-notes', 'Sources preserve notes', 'Source notes survive fixture mapping.'),
  scenario('source-primary-importance', 'Source importance supports primary', 'Primary source clips are represented.'),
  scenario('source-broll-importance', 'Source importance supports broll', 'B-roll source clips are represented.'),
  scenario('session-memory-layer', 'Memory includes session memory', 'Session memory layer exists.'),
  scenario('source-memory-layer', 'Memory includes source memory', 'Source memory layer exists.'),
  scenario('dna-memory-layer', 'Memory includes DNA application memory', 'DNA application memory exists for DNA-backed sessions.'),
  scenario('created-snapshot-exists', 'Snapshot created state exists', 'Created snapshots exist.'),
  scenario('setup-generated-snapshot-exists', 'Setup-generated snapshot exists', 'Setup snapshots exist.'),
  scenario('version-count-matches', 'Version count matches versions', 'Session version counts match fixture version rows.'),
  scenario('preview-count-matches', 'Preview count matches previews', 'Session preview counts match fixture preview rows.'),
  scenario('latest-preview-summary', 'Latest preview can be summarized', 'Preview summary mapper emits compact text.'),
  scenario('revision-summary', 'Revision can be summarized', 'Revision summary mapper emits compact text.'),
  scenario('event-records-exist', 'Event records exist', 'Session event rows are present.'),
  scenario('card-model-badges', 'Card model includes badges', 'Card model badge generation works.'),
  scenario('card-model-last-edited', 'Card model includes lastEditedAt', 'Card models include recency.'),
  scenario('readable-summary', 'Readable summary is produced', 'Readable summary mapper emits text.'),
  scenario('debug-summary', 'Debug summary is produced', 'Debug summary mapper emits counts and warnings.'),
  scenario('all-mock-only', 'Fixture uses mockOnly true', 'Every fixture row is mock-only.'),
  scenario('no-real-upload-marker', 'Fixture has no real upload marker', 'Fixtures do not claim uploads or file bytes.'),
  scenario('no-provider-call-marker', 'Fixture has no provider call marker', 'Fixtures do not claim model/provider calls.'),
  scenario('no-render-job-marker', 'Fixture has no render job marker', 'Fixtures do not claim render jobs.'),
  scenario('no-credit-marker', 'Fixture has no credit marker', 'Fixtures do not claim credit reservation or spend.'),
  scenario('session-distinct-from-preference', 'ProjectEditSession is distinct from EditPreference', 'Fixtures mark Edit Chat as distinct from reusable Edit Preference.'),
  scenario('edit-chat-label-maps', 'Edit Chat label maps to ProjectEditSession', 'User-facing Edit Chat naming maps to ProjectEditSession.'),
  scenario('previous-approved-derived', 'Previous approved edit derived session exists', 'Previous approved edit study fixture is represented.'),
  scenario('contract-boundary-only', 'Contracts remain boundary-only', 'No API handlers or repositories are implemented.'),
]
