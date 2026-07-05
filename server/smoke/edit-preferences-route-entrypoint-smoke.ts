import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { listProjectEditSessionPreferenceOptionsForUI } from '../../src/lib/project-edit-session-preference-ui-adapter'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

const requiredFiles = [
  'src/pages/EditPreferencesPage.tsx',
  'src/styles/preferences.css',
  'docs/edit-preferences-route-entrypoint.md',
  'docs/edit-preferences-route-entrypoint.json',
  'tests/e2e/edit-preferences-route-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const app = read('src/App.tsx')
assert.match(app, /EditPreferencesPage/)
assert.match(app, /path="\/edit-preferences"/)

const nav = read('src/data/mockData.ts')
const appNavSource = nav.match(/export const appNav: NavItem\[\] = \[[\s\S]*?\n\]/)?.[0] ?? ''
assert.match(appNavSource, /Home/)
assert.match(appNavSource, /label: 'Project'/)
assert.match(appNavSource, /Preferences/)
assert.match(appNavSource, /\/dashboard/)
assert.match(appNavSource, /\/projects/)
assert.match(appNavSource, /\/edit-preferences/)
for (const staleSidebarItem of ['Projects', 'AI Editor', 'Media Library', 'Templates', 'Team', 'Analytics', 'Exports', 'Brand Kit', 'Settings']) {
  assert.doesNotMatch(appNavSource, new RegExp(staleSidebarItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${staleSidebarItem} should not be in the primary sidebar nav`)
}

const design = read('design.md')
assert.match(design, /Current internal-testing desktop sidebar/)
assert.match(design, /1\. Home\s+2\. Project\s+3\. Preferences/)
assert.match(design, /old broad sidebar list is retired/i)
assert.match(design, /Navigation \| Home, Project, Preferences/)
assert.doesNotMatch(design, /Primary desktop sidebar:\s+1\. Home\s+2\. Projects\s+3\. AI Editor/)

const page = read('src/pages/EditPreferencesPage.tsx')
assert.match(page, /listProjectEditSessionPreferenceOptionsForUI/)
assert.match(page, /DRAFT_STORAGE_KEY/)
assert.match(page, /no upload/i)
assert.match(page, /no provider/i)
assert.match(page, /no Supabase/i)
assert.match(page, /No fetch/)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const docs = read('docs/edit-preferences-route-entrypoint.md')
for (const phrase of [
  'mock/local',
  '/edit-preferences',
  'browser-safe UI adapter',
  'Home, Project, and Preferences',
  'No upload',
  'No reference URL fetch',
  'No Qwen',
  'No live Supabase',
  'product-ready claim',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const docJson = JSON.parse(read('docs/edit-preferences-route-entrypoint.json')) as {
  decision?: string
  route?: string
  sidebarNavigation?: { allowed?: string[] }
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, 'edit_preferences_route_entrypoint_passed_mock_local_ready_for_internal_testing')
assert.equal(docJson.route, '/edit-preferences')
assert.deepEqual(docJson.sidebarNavigation?.allowed, ['Home', 'Project', 'Preferences'])
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.referenceUrlFetch, false)
assert.ok(docJson.validation?.required?.includes('smoke:edit-preferences-route-entrypoint'))

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-preferences-route-entrypoint'],
  'tsx server/smoke/edit-preferences-route-entrypoint-smoke.ts',
)

const options = await listProjectEditSessionPreferenceOptionsForUI({
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-youtube-wide',
})
assert.ok(options.length >= 2)
assert.ok(options.some((option) => option.handle === '@lifestyle-travel-vlog' && option.hasDNA))
assert.ok(options.some((option) => option.handle === '@legacy-clean-edit' && !option.hasDNA))
assert.ok(options.every((option) => option.mockOnly))

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-PREF-ROUTE-01',
  route: '/edit-preferences',
  options: options.length,
  dnaBacked: options.filter((option) => option.hasDNA).length,
  productReady: false,
  noRuntimeSideEffects: true,
}, null, 2))
