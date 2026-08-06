import assert from 'node:assert/strict'
import {
  EDIT_PREFERENCE_API_CONTRACT,
  LEGACY_UNSCOPED_EDIT_PREFERENCE_STORAGE_KEY,
  buildLocalEditPreferenceStorageKey,
  createEditPreferenceRepository,
  createLocalTestEditPreferenceRepository,
  resolveEditPreferenceScope,
  type EditPreferenceScope,
  type EditPreferenceStorage,
} from '../../src/lib/edit-preference-repository'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'

class MemoryStorage implements EditPreferenceStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const storage = new MemoryStorage()
const now = () => new Date('2026-07-10T12:00:00.000Z')
const scopeA: EditPreferenceScope = {
  authMode: 'local_test',
  userId: 'local-test-user-a',
  workspaceId: 'workspace-internal-testing',
}
const scopeB: EditPreferenceScope = {
  authMode: 'local_test',
  userId: 'local-test-user-b',
  workspaceId: 'workspace-internal-testing',
}
const scopeAOtherWorkspace: EditPreferenceScope = {
  authMode: 'local_test',
  userId: scopeA.userId,
  workspaceId: 'workspace-other',
}

storage.setItem(LEGACY_UNSCOPED_EDIT_PREFERENCE_STORAGE_KEY, JSON.stringify({
  editLevel: 'basic',
  visualPreference: 'no_extra_visuals',
}))

const repositoryA = createLocalTestEditPreferenceRepository(scopeA, { now, storage })
const repositoryB = createLocalTestEditPreferenceRepository(scopeB, { now, storage })
const repositoryAOtherWorkspace = createLocalTestEditPreferenceRepository(scopeAOtherWorkspace, { now, storage })

assert.equal(repositoryA.getInitialResult().preferences.editLevel, 'pro')
assert.equal(repositoryB.getInitialResult().preferences.editLevel, 'pro')
assert.equal(repositoryAOtherWorkspace.getInitialResult().preferences.editLevel, 'pro')
assert.equal(
  repositoryA.getInitialResult().status,
  'default',
  'Unscoped v1 preferences must never migrate implicitly into a signed-in identity.',
)
assert.equal(storage.values.has(buildLocalEditPreferenceStorageKey(scopeA)), false)

const savedA = await repositoryA.save({
  cleanupPreference: 'light_cleanup',
  editLevel: 'basic',
  visualPreference: 'no_extra_visuals',
  workflowType: 'product_demo',
})

assert.equal(savedA.ok, true)
assert.equal(savedA.persisted, true)
assert.equal(savedA.preferences.editLevel, 'basic')
assert.match(savedA.preferences.snapshotId, /^local-edit-preferences-v2-[a-f0-9]{8}-[a-z0-9]+-[a-f0-9]{8}$/)
assert.equal((await repositoryA.load()).preferences.editLevel, 'basic')
assert.equal((await repositoryB.load()).preferences.editLevel, 'pro')
assert.equal((await repositoryAOtherWorkspace.load()).preferences.editLevel, 'pro')

const keyA = buildLocalEditPreferenceStorageKey(scopeA)
const keyB = buildLocalEditPreferenceStorageKey(scopeB)
assert.notEqual(keyA, keyB)
assert.equal(storage.values.has(keyA), true)
assert.equal(storage.values.has(keyB), false)

storage.setItem(keyB, storage.getItem(keyA) ?? '')
const mismatchedOwnerRead = await repositoryB.load()
assert.equal(mismatchedOwnerRead.ok, false)
assert.equal(mismatchedOwnerRead.status, 'invalid_record')
assert.equal(mismatchedOwnerRead.preferences.editLevel, 'pro')

const signedOutScope = resolveEditPreferenceScope({
  authMode: 'local_test',
  status: 'signed_out',
})
assert.equal(signedOutScope.ok, false)
assert.equal(createEditPreferenceRepository(signedOutScope).getInitialResult().canPersist, false)

const supabaseScope = resolveEditPreferenceScope({
  authMode: 'supabase',
  identity: {
    id: 'supabase-user-a',
    displayName: 'Supabase user A',
    provider: 'supabase',
  },
  status: 'signed_in',
  workspaceId: 'workspace-a',
})
assert.equal(supabaseScope.ok, true)
const supabaseRepository = createEditPreferenceRepository(supabaseScope)
const supabaseRead = await supabaseRepository.load()
assert.equal(supabaseRead.ok, false)
assert.equal(supabaseRead.canPersist, false)
assert.equal(supabaseRead.status, 'backend_error')
assert.match(supabaseRead.message, /does not have a mock handler yet/i)
assert.equal(
  storage.values.size,
  3,
  'Mock transport must not simulate authenticated backend persistence or mutate local preference storage.',
)

assert.equal(EDIT_PREFERENCE_API_CONTRACT.get.routeId, 'editPreferences.getCurrent')
assert.equal(EDIT_PREFERENCE_API_CONTRACT.upsert.routeId, 'editPreferences.upsertCurrent')
for (const routeId of [EDIT_PREFERENCE_API_CONTRACT.get.routeId, EDIT_PREFERENCE_API_CONTRACT.upsert.routeId]) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must be registered for reviewed authenticated HTTP transport.`)
  assert.equal(route.runtimeMode, 'frontend_safe')
  assert.equal(route.status, 'frontend_safe_ready')
  assert.equal(route.requiresSupabase, true)
  assert.equal(route.mockHandlerName, undefined, 'Mock transport must not pretend to persist authenticated preferences.')
}

console.log('Edit preference persistence smoke passed.')
console.log(JSON.stringify({
  capability: savedA.capability,
  legacyUnscopedRecordIgnored: true,
  localIdentityIsolation: true,
  localWorkspaceIsolation: true,
  scopedSnapshotId: savedA.preferences.snapshotId,
  supabasePersistenceStatus: supabaseRead.status,
  supabaseMockTransportPersistence: false,
}, null, 2))
