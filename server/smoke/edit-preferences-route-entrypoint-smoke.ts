import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyProjectEditDefaultPreferenceToNewEditForm,
  createDefaultProjectEditPreferenceSettings,
  PROJECT_EDIT_DEFAULT_PREFERENCES_STORAGE_KEY,
  readProjectEditDefaultPreferenceSettings,
  saveProjectEditDefaultPreferenceSettings,
} from '../../src/lib/project-edit-default-preferences'
import { createDefaultNewEditSessionFormState } from '../../src/lib/project-edit-session-create-flow-ui-adapter'
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
  'src/pages/PreferencesPage.tsx',
  'src/styles/preferences.css',
  'docs/edit-preferences-route-entrypoint.md',
  'docs/edit-preferences-route-entrypoint.json',
  'tests/e2e/edit-preferences-route-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const app = read('src/App.tsx')
assert.match(app, /PreferencesPage/)
assert.match(app, /path="\/preferences"/)
assert.match(app, /path="\/edit-preferences"/)
assert.doesNotMatch(app, /WalletPage|BrandKitPage|ExportQueuePage/)
assert.match(app, /path="\/wallet"\s+element=\{<Navigate to="\/dashboard" replace \/>\}/)
assert.match(app, /path="\/brand-kit"\s+element=\{<Navigate to="\/preferences" replace \/>\}/)
assert.match(app, /path="\/exports"\s+element=\{<Navigate to="\/projects" replace \/>\}/)

const nav = read('src/data/mockData.ts')
const appNavSource = nav.match(/export const appNav: NavItem\[\] = \[[\s\S]*?\n\]/)?.[0]
  ?? nav.match(/export const appNav = \[[\s\S]*?\n\] satisfies readonly NavItem\[\]/)?.[0]
  ?? ''
const allowedLabelSource = nav.match(/export const appSidebarNavLabels = \[[\s\S]*?\] as const/)?.[0] ?? ''
assert.match(allowedLabelSource, /\['Home', 'Project', 'Preferences'\] as const/)
assert.match(appNavSource, /Home/)
assert.match(appNavSource, /label: 'Project'/)
assert.match(appNavSource, /Preferences/)
assert.match(appNavSource, /\/dashboard/)
assert.match(appNavSource, /\/projects/)
assert.match(appNavSource, /\/preferences/)
assert.deepEqual([...appNavSource.matchAll(/label: '([^']+)'/g)].map((match) => match[1]), ['Home', 'Project', 'Preferences'])
assert.doesNotMatch(nav, /disabled\?: boolean/)
for (const staleSidebarItem of ['Projects', 'AI Editor', 'Media Library', 'Templates', 'Team', 'Analytics', 'Exports', 'Brand Kit', 'Settings', 'Wallet', 'Upload']) {
  assert.doesNotMatch(appNavSource, new RegExp(staleSidebarItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${staleSidebarItem} should not be in the primary sidebar nav`)
}

const appShell = read('src/components/AppShell.tsx')
assert.match(appShell, /data-testid="app-sidebar"/)
assert.match(appShell, /sidebarNav\.map/)
assert.doesNotMatch(appShell, /sidebar-link-disabled/)
assert.doesNotMatch(appShell, /<small>Later<\/small>/)
assert.doesNotMatch(appShell, /sidebar-widget|sidebar-profile/)

const design = read('design.md')
assert.match(design, /Current internal-testing desktop sidebar/)
assert.match(design, /1\. Home\s+2\. Project\s+3\. Preferences/)
assert.match(design, /old broad sidebar list is retired/i)
assert.match(design, /CreateProjectPage/)
assert.match(design, /ProjectsPage/)
assert.match(design, /EditorPage/)
assert.match(design, /PreferencesPage/)
assert.match(design, /Do not show sample projects/)
assert.match(design, /Navigation \| Home, Project, Preferences/)
assert.doesNotMatch(design, /Primary desktop sidebar:\s+1\. Home\s+2\. Projects\s+3\. AI Editor/)

const page = read('src/pages/PreferencesPage.tsx')
assert.match(page, /PreferencesPage/)
assert.match(page, /Edit defaults/)
assert.match(page, /Privacy/)
assert.match(page, /Save preference/)
assert.match(page, /preferences-default-edit-direction/)
assert.match(page, /preferences-default-choice-grid/)
assert.match(page, /preferences-new-edit-default-preview/)
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const dashboardPage = read('src/pages/DashboardPage.tsx')
assert.doesNotMatch(dashboardPage, /to="\/wallet"|Open wallet/)
assert.doesNotMatch(dashboardPage, /ProjectCard|projects\[0\]|MOCK_PROJECT_HOME_PROJECT_ID|featuredProjectPath/)
assert.match(dashboardPage, /Continue from the clean project workspace/)

const docs = read('docs/edit-preferences-route-entrypoint.md')
for (const phrase of [
  'mock/local',
  '/preferences',
  '/edit-preferences',
  'clean mock/local Preferences page',
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
  sidebarNavigation?: {
    allowed?: string[]
    retiredStandaloneRoutes?: Record<string, string>
  }
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, 'edit_preferences_route_entrypoint_passed_mock_local_ready_for_internal_testing')
assert.equal(docJson.route, '/preferences')
assert.deepEqual(docJson.sidebarNavigation?.allowed, ['Home', 'Project', 'Preferences'])
assert.deepEqual(docJson.sidebarNavigation?.retiredStandaloneRoutes, {
  '/wallet': '/dashboard',
  '/brand-kit': '/preferences',
  '/exports': '/projects',
})
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

const memoryStorage = new Map<string, string>()
const storage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value)
  },
}
const defaultSettings = createDefaultProjectEditPreferenceSettings()
assert.equal(defaultSettings.preferenceChoiceId, 'none')
assert.equal(readProjectEditDefaultPreferenceSettings(storage).source, 'default')
const savedSettings = saveProjectEditDefaultPreferenceSettings({
  preferenceChoiceId: 'lifestyle_travel_vlog',
  preferenceNote: 'Use calm pacing and natural audio for my tests.',
  now: '2026-07-05T00:00:00.000Z',
  storage,
})
assert.equal(savedSettings.source, 'preferences_page')
assert.equal(savedSettings.preferenceChoiceId, 'lifestyle_travel_vlog')
assert.equal(memoryStorage.has(PROJECT_EDIT_DEFAULT_PREFERENCES_STORAGE_KEY), true)
const readSettings = readProjectEditDefaultPreferenceSettings(storage)
assert.deepEqual(readSettings, savedSettings)
const newEditForm = applyProjectEditDefaultPreferenceToNewEditForm(createDefaultNewEditSessionFormState(), readSettings)
assert.equal(newEditForm.preferenceChoiceId, 'lifestyle_travel_vlog')
assert.equal(newEditForm.preferenceNote, 'Use calm pacing and natural audio for my tests.')

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-PREF-ROUTE-01',
  route: '/preferences',
  options: options.length,
  dnaBacked: options.filter((option) => option.hasDNA).length,
  savedDefaultPreferenceAppliedToNewEdit: true,
  productReady: false,
  noRuntimeSideEffects: true,
}, null, 2))
