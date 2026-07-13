import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_LOCAL_EDIT_PREFERENCES,
} from '../../src/lib/edit-preferences'
import {
  LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
  buildLocalEditPreferenceStorageKey,
  createLocalTestEditPreferenceRepository,
  type EditPreferenceScope,
} from '../../src/lib/edit-preference-repository'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, path + ' should exist')
}

const requiredFiles = [
  'src/pages/PreferencesPage.tsx',
  'src/lib/edit-preferences.ts',
  'src/lib/edit-preference-repository.ts',
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
assert.match(app, /path="\/wallet"\s+element=\{<Navigate to="\/preferences" replace \/>\}/)
assert.match(app, /path="\/brand-kit"\s+element=\{<Navigate to="\/preferences" replace \/>\}/)
assert.match(app, /path="\/exports"\s+element=\{<Navigate to="\/projects" replace \/>\}/)

const navigation = read('src/data/productContent.ts')
const appNavSource = navigation.match(/export const appNav: NavItem\[\] = \[[\s\S]*?\n\]/)?.[0] ?? ''
const appNavLabels = [...appNavSource.matchAll(/label: '([^']+)'/g)].map((match) => match[1])
assert.deepEqual(appNavLabels, ['Home', 'Projects', 'Edit Preferences'])
assert.match(appNavSource, /to: '\/dashboard'/)
assert.match(appNavSource, /to: '\/projects'/)
assert.match(appNavSource, /to: '\/preferences'/)
for (const retiredSidebarItem of ['AI Editor', 'Media Library', 'Templates', 'Team', 'Analytics', 'Exports', 'Brand Kit', 'Settings', 'Wallet', 'Upload']) {
  assert.equal(appNavLabels.includes(retiredSidebarItem), false, retiredSidebarItem + ' should not be in the primary sidebar navigation')
}

const appShell = read('src/components/AppShell.tsx')
assert.match(appShell, /data-testid="app-sidebar"/)
assert.match(appShell, /appNav\.map/)
assert.doesNotMatch(appShell, /sidebar-widget|sidebar-profile/)

const page = read('src/pages/PreferencesPage.tsx')
for (const phrase of [
  'Edit Preferences',
  'Defaults for new edits',
  'Editing approach',
  'Creative direction',
  'Delivery and cost',
  'Pre-confirm reusable editing choices',
  'Save defaults',
  'edit-preferences-form',
  'preference-persistence-status',
  'createEditPreferenceRepository',
  'useUnsavedNavigationGuard',
]) {
  assert.equal(page.includes(phrase), true, 'PreferencesPage should include ' + phrase)
}
for (const optionRegistry of [
  'editLevelPreferenceOptions',
  'workflowPreferenceOptions',
  'cleanupPreferenceOptions',
  'visualPreferenceOptions',
  'moodPreferenceOptions',
  'creditPreferenceOptions',
  'targetPlatformPreferenceOptions',
]) {
  assert.equal(page.includes(optionRegistry), true, 'PreferencesPage should use ' + optionRegistry)
}
assert.doesNotMatch(page, /src\/backend|\.\.\/backend|repositories\/|route-handlers|MockDatabase/)
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|type="file"|createClient|service_role|signedUrl/i)

const docs = read('docs/edit-preferences-route-entrypoint.md')
for (const phrase of [
  'Saved Edit Preferences',
  '/preferences',
  '/edit-preferences',
  'seven',
  'workspace',
  'immutable creation baseline',
  'No upload',
  'No provider',
  'No live Supabase',
  'product-ready claim',
]) {
  assert.equal(docs.toLowerCase().includes(phrase.toLowerCase()), true, 'route entrypoint doc should include ' + phrase)
}

const docJson = JSON.parse(read('docs/edit-preferences-route-entrypoint.json')) as {
  decision?: string
  route?: string
  fields?: string[]
  sidebarNavigation?: {
    allowed?: string[]
    retiredStandaloneRoutes?: Record<string, string>
  }
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, 'saved_edit_preferences_route_ready_for_private_internal_testing')
assert.equal(docJson.route, '/preferences')
assert.deepEqual(docJson.fields, [
  'edit_level',
  'workflow_type',
  'cleanup_preference',
  'visual_preference',
  'mood_style',
  'credit_preference',
  'target_platform',
])
assert.deepEqual(docJson.sidebarNavigation?.allowed, ['Home', 'Projects', 'Edit Preferences'])
assert.deepEqual(docJson.sidebarNavigation?.retiredStandaloneRoutes, {
  '/wallet': '/preferences',
  '/brand-kit': '/preferences',
  '/exports': '/projects',
})
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.providerCall, false)
assert.ok(docJson.validation?.required?.includes('smoke:edit-preferences-route-entrypoint'))

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-preferences-route-entrypoint'],
  'tsx server/smoke/edit-preferences-route-entrypoint-smoke.ts',
)

const currentScope: EditPreferenceScope = {
  authMode: 'local_test',
  userId: 'route-entrypoint-user',
  workspaceId: LOCAL_TEST_EDIT_PREFERENCE_WORKSPACE_ID,
}
const foreignScope: EditPreferenceScope = {
  ...currentScope,
  userId: 'route-entrypoint-foreign-user',
}
const memoryStorage = new Map<string, string>()
const storage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value)
  },
}
const repository = createLocalTestEditPreferenceRepository(currentScope, {
  now: () => new Date('2026-07-13T19:00:00.000Z'),
  storage,
})
assert.equal(repository.getInitialResult().preferences.editLevel, DEFAULT_LOCAL_EDIT_PREFERENCES.editLevel)
const saved = await repository.save({
  applyConfirmedDefaults: false,
  editLevel: 'basic',
  workflowType: 'product_demo',
  cleanupPreference: 'light_cleanup',
  visualPreference: 'keep_visuals_minimal',
  moodStyle: 'premium',
  creditPreference: 'low_credit_cost',
  targetPlatform: 'youtube',
})
assert.equal(saved.ok, true)
assert.equal(saved.persisted, true)
assert.equal(saved.preferences.editLevel, 'basic')
assert.equal(saved.preferences.workflowType, 'product_demo')
assert.equal(saved.preferences.applyConfirmedDefaults, false)
assert.equal(memoryStorage.has(buildLocalEditPreferenceStorageKey(currentScope)), true)

const recovered = createLocalTestEditPreferenceRepository(currentScope, { storage }).getInitialResult()
assert.equal(recovered.persisted, true)
assert.equal(recovered.preferences.targetPlatform, 'youtube')
assert.equal(recovered.preferences.visualPreference, 'keep_visuals_minimal')
const foreign = createLocalTestEditPreferenceRepository(foreignScope, { storage }).getInitialResult()
assert.equal(foreign.persisted, false)
assert.equal(foreign.preferences.editLevel, DEFAULT_LOCAL_EDIT_PREFERENCES.editLevel)

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-PREF-ROUTE-02',
  route: '/preferences',
  savedFields: 7,
  identityWorkspaceScoped: true,
  immutableNewEditBaselineBridge: true,
  productReady: false,
  noRuntimeSideEffects: true,
}, null, 2))
