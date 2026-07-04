import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const requiredDocs = [
  'docs/edit-brief-existing-surface-audit.md',
  'docs/edit-brief-timeline-marker-audit.md',
  'docs/edit-brief-video-player-preview-audit.md',
  'docs/edit-brief-marker-chat-audit.md',
  'docs/edit-brief-source-asset-attachment-audit.md',
  'docs/edit-brief-export-settings-audit.md',
  'docs/edit-brief-planner-integration-audit.md',
  'docs/edit-brief-ui-route-audit.md',
  'docs/edit-brief-backend-service-audit.md',
  'docs/edit-brief-mock-database-audit.md',
  'docs/edit-brief-reuse-vs-new-build-plan.md',
  'docs/edit-brief-implementation-blockers.md',
  'docs/edit-brief-owner-review-before-architecture.md',
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
  /timeline/i,
  /export settings/i,
  /attachments/i,
  /reuse vs new build/i,
  /owner decisions pending/i,
  /Edit Preference is reusable style\/DNA/,
  /\/projects\/:projectId\/edits\/:editSessionId\/brief/,
  /Safety \/ do-not-copy \/ policy/,
]) {
  assert.match(aggregate, phrase, `audit package should contain ${phrase}`)
}

assert.equal(
  existsSync(path.join(repoRoot, 'docs/edit-brief-glossary.md')),
  false,
  'Optional edit brief glossary should not be created by default',
)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-brief-surface-audit'],
  'tsx server/smoke/edit-brief-surface-audit-smoke.ts',
  'package script should run the Edit Brief surface audit smoke',
)

const migrationCount = readdirSync(path.join(repoRoot, 'supabase', 'migrations')).filter((entry) => {
  return statSync(path.join(repoRoot, 'supabase', 'migrations', entry)).isFile()
}).length
assert.equal(migrationCount, 24, 'Supabase migration count should remain 24')

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-00',
  docsVerified: requiredDocs.length,
  migrationCount,
  auditOnly: true,
  implementationAdded: false,
  routesAdded: false,
  migrationCreated: false,
  supabaseCommandRunBySmoke: false,
  staged: false,
  committed: false,
  cleaned: false,
  nextStep: 'RP-EDITBRIEF-01 after owner review',
}, null, 2))
