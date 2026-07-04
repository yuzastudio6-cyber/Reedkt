import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const requiredDocs = [
  'docs/edit-brief-product-flow.md',
  'docs/edit-brief-ui-architecture.md',
  'docs/edit-brief-route-navigation-plan.md',
  'docs/edit-brief-video-timeline-architecture.md',
  'docs/edit-brief-marker-model.md',
  'docs/edit-brief-marker-drawer-architecture.md',
  'docs/edit-brief-marker-chat-architecture.md',
  'docs/edit-brief-marker-intent-model.md',
  'docs/edit-brief-attachment-model.md',
  'docs/edit-brief-export-settings-architecture.md',
  'docs/edit-brief-marker-qa-conflict-architecture.md',
  'docs/edit-brief-planner-integration-architecture.md',
  'docs/edit-brief-backend-architecture.md',
  'docs/edit-brief-supabase-future-schema-plan.md',
  'docs/edit-brief-internal-testing-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
  'docs/edit-brief-owner-review-decisions.md',
]

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

for (const doc of requiredDocs) {
  const absolutePath = path.join(repoRoot, doc)
  assert.equal(existsSync(absolutePath), true, `${doc} should exist`)
  const text = read(doc)
  assert.match(text, /Edit Brief/, `${doc} should reference Edit Brief`)
  assert.match(text, /ProjectEditSession/, `${doc} should reference ProjectEditSession`)
  assert.match(text, /no implementation/i, `${doc} should state no implementation`)
  assert.match(text, /no migration/i, `${doc} should state no migration`)
  assert.match(text, /no Supabase command/i, `${doc} should state no Supabase command`)
}

const aggregate = requiredDocs.map(read).join('\n')

for (const phrase of [
  /Marker/,
  /Marker Chat/,
  /structured intent/i,
  /attachments/i,
  /export settings/i,
  /Safety \/ do-not-copy \/ policy/,
  /Confirmed Edit Brief markers/,
  /optional/i,
  /owner decisions pending/i,
  /\/projects\/:projectId\/edits\/:editSessionId\/brief/,
  /broll/,
  /cut_remove/,
  /keep_emphasize/,
  /caption_text/,
  /graphic_card_ui/,
  /music_soundtrack/,
  /sfx_sound_design/,
  /voiceover/,
  /transition/,
  /speed_pacing/,
  /color_tone/,
  /do_not_use/,
  /general_note/,
  /confirm_only/,
  /edit_briefs/,
  /edit_session_export_settings/,
  /RP-EDITBRIEF-02/,
]) {
  assert.match(aggregate, phrase, `architecture package should contain ${phrase}`)
}

assert.equal(
  existsSync(path.join(repoRoot, 'docs/edit-brief-product-glossary.md')),
  false,
  'Optional edit brief product glossary should not be created by default',
)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-brief-architecture'],
  'tsx server/smoke/edit-brief-architecture-smoke.ts',
  'package script should run the Edit Brief architecture smoke',
)

const migrationCount = readdirSync(path.join(repoRoot, 'supabase', 'migrations')).filter((entry) => {
  return statSync(path.join(repoRoot, 'supabase', 'migrations', entry)).isFile()
}).length
assert.equal(migrationCount, 24, 'Supabase migration count should remain 24')

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-01',
  docsVerified: requiredDocs.length,
  migrationCount,
  architectureOnly: true,
  implementationAdded: false,
  typesAdded: false,
  repositoryAdded: false,
  routesAdded: false,
  uiAdded: false,
  migrationCreated: false,
  supabaseCommandRunBySmoke: false,
  staged: false,
  committed: false,
  cleaned: false,
  nextStep: 'RP-EDITBRIEF-02 — Types, Contracts, and Mock Fixtures after owner review',
}, null, 2))
