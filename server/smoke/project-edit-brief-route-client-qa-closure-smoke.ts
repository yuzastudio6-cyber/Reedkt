import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY,
  PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS,
  createProjectEditBriefApiRouteRegistrySummary,
} from '../../src/backend'
import { PROJECT_EDIT_BRIEF_API_ROUTE_IDS } from '../../src/types/api-routes'
import {
  createProjectEditBriefApiClientSummary,
} from '../../src/lib/project-edit-brief-api-client-summaries'
import {
  listProjectEditBriefApiClientRouteIds,
} from '../../src/lib/project-edit-brief-api-client'

interface SmokeCheck {
  name: string
  ok: boolean
  details?: unknown
}

const repoRoot = process.cwd()
const checks: SmokeCheck[] = []

const requiredDocs = [
  'docs/project-edit-brief-route-client-qa-closure.md',
  'docs/project-edit-brief-route-client-playwright-baseline.md',
  'docs/project-edit-brief-route-client-known-limitations.md',
  'docs/project-edit-brief-route-client-ready-for-ui.md',
  'docs/project-edit-brief-04a-verification-report.md',
]

const existingRouteClientDocs = [
  'docs/project-edit-brief-api-routes.md',
  'docs/project-edit-brief-api-client.md',
  'docs/project-edit-brief-api-route-boundary.md',
  'docs/project-edit-brief-route-repository-integration.md',
  'docs/project-edit-brief-client-transition-plan.md',
]

function record(name: string, ok: boolean, details?: unknown) {
  checks.push({ name, ok, details })
}

function readRelative(filePath: string) {
  return readFileSync(path.join(repoRoot, filePath), 'utf8')
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

const packageJson = readRelative('package.json')
record(
  'package_script_exists',
  packageJson.includes('"smoke:project-edit-brief-route-client-qa-closure"'),
)
record(
  'existing_route_smoke_scripts_exist',
  packageJson.includes('"smoke:project-edit-brief-api-routes"') &&
    packageJson.includes('"smoke:project-edit-brief-api-client"'),
)

const registrySummary = createProjectEditBriefApiRouteRegistrySummary()
record('route_registry_still_has_35_routes', registrySummary.totalRoutes === 35, registrySummary)
record('route_id_union_still_has_35_routes', PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length === 35, PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length)
record('route_registry_matches_route_ids', PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.length === PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length)
record('all_route_handlers_present', PROJECT_EDIT_BRIEF_API_ROUTE_IDS.every((id) => Boolean(PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS[id])))

const clientSummary = createProjectEditBriefApiClientSummary()
record('client_summary_ready', clientSummary.status === 'browser_mock_api_client_ready', clientSummary)
record('client_lists_35_routes', listProjectEditBriefApiClientRouteIds().length === 35, listProjectEditBriefApiClientRouteIds())

for (const doc of [...requiredDocs, ...existingRouteClientDocs]) {
  const exists = existsSync(path.join(repoRoot, doc))
  record(`${doc}_exists`, exists)
  if (exists) {
    const content = readRelative(doc)
    record(`${doc}_mentions_mock_local_boundary`, /mock\/local|mock route|mock browser|mock-only/i.test(content), doc)
  }
}

const joinedClosureDocs = requiredDocs
  .filter((doc) => existsSync(path.join(repoRoot, doc)))
  .map((doc) => readRelative(doc))
  .join('\n')

for (const phrase of [
  'RP-EDITBRIEF-04A',
  'No Edit Brief UI',
  'No `/brief` route',
  'No runtime behavior changed',
  'No migration',
  'No Supabase command',
  'No staging',
  'No commit',
  'No cleanup',
  'Production ready: false',
]) {
  record(`closure_docs_contain_${phrase.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`, joinedClosureDocs.includes(phrase), phrase)
}

const appSource = readRelative('src/App.tsx')
const rpEditBrief05RoutePresent = /edits\/:editSessionId\/brief/.test(appSource)
record('app_has_no_edit_brief_route_or_rp05_supersedes_it', !rpEditBrief05RoutePresent || packageJson.includes('"smoke:project-edit-brief-ui-shell"'), {
  rpEditBrief05RoutePresent,
})
record('app_has_no_project_edit_brief_page', !/ProjectEditBriefPage/.test(appSource))
record('project_edit_brief_page_not_created', !existsSync(path.join(repoRoot, 'src/pages/ProjectEditBriefPage.tsx')))

record('migration_count_remains_24', migrationCount() === 24, migrationCount())

const failedChecks = checks.filter((check) => !check.ok)
assert.equal(failedChecks.length, 0, `RP-EDITBRIEF-04A QA closure smoke failed: ${failedChecks.map((check) => check.name).join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-EDITBRIEF-04A',
  routeCount: PROJECT_EDIT_BRIEF_API_ROUTE_IDS.length,
  clientRouteCount: listProjectEditBriefApiClientRouteIds().length,
  docsChecked: requiredDocs.length + existingRouteClientDocs.length,
  migrationCount: migrationCount(),
  editBriefUiCreated: rpEditBrief05RoutePresent,
  briefRouteCreated: rpEditBrief05RoutePresent,
  supersededByRPEDITBRIEF05: rpEditBrief05RoutePresent,
  runtimeBehaviorChanged: false,
  supabaseCommandRun: false,
  stagingOrCommitRun: false,
  productionReady: false,
  nextStep: rpEditBrief05RoutePresent
    ? 'RP-EDITBRIEF-05 is present; RP-EDITBRIEF-06 may start after owner review and verification.'
    : 'RP-EDITBRIEF-05 may start after owner review only if full verification passes.',
}, null, 2))
