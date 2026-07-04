import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_API_ROUTES,
  createProjectEditBriefApiRouteRegistrySummary,
} from '../../src/backend/api/project-edit-brief-api-route-registry'

const repoRoot = process.cwd()

const docs = [
  'docs/project-edit-brief-supabase-persistence-plan.md',
  'docs/project-edit-brief-supabase-persistence-plan.json',
  'docs/edit-brief-supabase-future-schema-plan.md',
  'docs/project-edit-brief-supabase-boundary.md',
  'docs/edit-brief-milestone-roadmap.md',
]

const durableRoots = [
  'edit_briefs',
  'edit_cues',
  'edit_cue_assets',
  'edit_cue_messages',
  'edit_cue_intents',
  'edit_cue_confirmations',
  'edit_cue_conflicts',
  'edit_cue_revisions',
  'edit_brief_application_logs',
  'edit_session_export_settings',
]

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

for (const doc of docs) {
  assert.equal(existsSync(path.join(repoRoot, doc)), true, `${doc} should exist`)
}

const planMd = read('docs/project-edit-brief-supabase-persistence-plan.md')
const planJson = JSON.parse(read('docs/project-edit-brief-supabase-persistence-plan.json')) as {
  decision?: string
  durableRoots?: string[]
  supabasePolicyInputs?: Record<string, boolean>
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}
const futurePlan = read('docs/edit-brief-supabase-future-schema-plan.md')
const boundary = read('docs/project-edit-brief-supabase-boundary.md')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const repositorySource = read('src/backend/repositories/supabase-project-edit-brief-repository.ts')
const validationSource = read('src/backend/repositories/project-edit-brief-repository-validation-service.ts')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(planJson.decision, 'project_edit_brief_supabase_persistence_plan_passed_ready_for_production_readiness_gates')
assert.equal(planJson.nextMilestone, 'RP-EDITBRIEF-14 - Production Readiness Gates')

for (const root of durableRoots) {
  assert.ok(planMd.includes(root), `plan markdown should mention ${root}`)
  assert.ok(futurePlan.includes(root), `future schema plan should mention ${root}`)
  assert.ok(boundary.includes(root), `boundary doc should mention ${root}`)
  assert.ok(planJson.durableRoots?.includes(root), `plan JSON should include ${root}`)
  assert.ok(repositorySource.includes(`'${root}'`) || repositorySource.includes(`"${root}"`), `repository source should use ${root}`)
}

assert.ok(planMd.includes('historical logical names'), 'plan should classify project_edit_* names as historical')
assert.ok(futurePlan.includes('historical logical names'), 'future plan should classify project_edit_* names as historical')
assert.ok(planMd.includes('Do not create parallel `project_edit_briefs`'), 'plan should block parallel project_edit_briefs by default')
assert.ok(planMd.includes('No migration was added.'), 'plan should confirm no migration')
assert.ok(planMd.includes('No SQL was executed.'), 'plan should confirm no SQL execution')
assert.ok(planMd.includes('No Supabase CLI command was run.'), 'plan should confirm no Supabase CLI')
assert.ok(planMd.includes('Row Level Security'), 'plan should mention RLS')
assert.ok(planMd.includes('explicit grants'), 'plan should mention explicit grants')
assert.ok(planMd.includes('storage.objects'), 'plan should mention storage.objects policy surface')
assert.ok(planMd.includes('Service-role keys bypass RLS'), 'plan should mention service-role risk')
assert.ok(planMd.includes('Signed URLs are delivery artifacts'), 'plan should mention signed URL boundary')
assert.ok(roadmap.includes('RP-EDITBRIEF-13'), 'roadmap should include RP-EDITBRIEF-13')
assert.ok(roadmap.includes('RP-EDITBRIEF-14'), 'roadmap should include RP-EDITBRIEF-14')
assert.ok(validationSource.includes('PROJECT_EDIT_BRIEF_REPOSITORY_DISABLED'), 'validation should use Project Edit Brief disabled code')
assert.ok(validationSource.includes('edit_briefs/edit_cues'), 'validation should reference durable roots')

assert.equal(planJson.supabasePolicyInputs?.rlsRequiredOnExposedTables, true)
assert.equal(planJson.supabasePolicyInputs?.explicitGrantsAndSchemaExposureReviewRequired, true)
assert.equal(planJson.supabasePolicyInputs?.storageObjectsPoliciesRequiredForFutureAttachments, true)
assert.equal(planJson.supabasePolicyInputs?.serviceRoleBackendOnly, true)
assert.equal(planJson.supabasePolicyInputs?.signedUrlsNotSourceTruth, true)

for (const [key, value] of Object.entries(planJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain blocked in RP-EDITBRIEF-13`)
}

assert.equal(migrationCount(), 24, 'Supabase migration count should remain 24')
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-supabase-persistence-plan'],
  'tsx server/smoke/project-edit-brief-supabase-persistence-plan-smoke.ts',
)

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0, 'Project Edit Brief mock routes should not become production-ready')
assert.equal(
  PROJECT_EDIT_BRIEF_API_ROUTES.every((route) => !route.requiresSupabase && !route.requiresServiceRole),
  true,
  'Project Edit Brief mock routes should not require Supabase or service role in this milestone',
)

console.log(JSON.stringify({
  smoke: 'project-edit-brief-supabase-persistence-plan',
  status: 'passed',
  decision: planJson.decision,
  durableRoots,
  migrations: migrationCount(),
  productionReadyRoutes: routeSummary.productionReadyCount,
  supabaseReadWriteEnabled: false,
  storageWriteEnabled: false,
  nextMilestone: planJson.nextMilestone,
}, null, 2))
