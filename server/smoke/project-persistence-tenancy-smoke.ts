import assert from 'node:assert/strict'

const storage = new Map<string, string>()
const windowEvents = new EventTarget()

;(globalThis as { window?: unknown }).window = {
  localStorage: {
    get length() {
      return storage.size
    },
    clear() {
      storage.clear()
    },
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
  },
  addEventListener: windowEvents.addEventListener.bind(windowEvents),
  dispatchEvent: windowEvents.dispatchEvent.bind(windowEvents),
  removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
}

const {
  buildLocalProjectStorageKey,
  createLocalProjectRecord,
  LEGACY_UNSCOPED_LOCAL_PROJECT_STORAGE_KEY,
  listLocalProjectRecords,
  saveLocalProjectRecord,
} = await import('../../src/lib/local-projects')
const {
  buildLocalProjectHandoffStorageKey,
  createLocalInternalProjectHandoff,
  getInternalEditPersistenceStatus,
  LEGACY_UNSCOPED_LOCAL_PROJECT_HANDOFF_STORAGE_KEY,
  listLocalInternalProjectHandoffs,
  retryInternalEditPersistence,
  saveLocalInternalProjectHandoff,
  subscribeInternalEditPersistenceStatus,
} = await import('../../src/lib/local-project-handoff')
const {
  activateProjectPersistenceScope,
  createProjectPersistenceScopeFingerprint,
  deactivateProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  isProjectPersistenceScopeActive,
  PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT,
} = await import('../../src/lib/project-persistence-scope')
const { getInternalEditPersistenceStatusCopy } = await import('../../src/lib/internal-edit-persistence-copy')

const primaryScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user-a',
  workspaceId: 'workspace-a',
}
const otherUserScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user-b',
  workspaceId: 'workspace-a',
}
const otherWorkspaceScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user-a',
  workspaceId: 'workspace-b',
}
const dottedScopeLeft = {
  authMode: 'local_test' as const,
  userId: 'user.a',
  workspaceId: 'workspace',
}
const dottedScopeRight = {
  authMode: 'local_test' as const,
  userId: 'user',
  workspaceId: 'a.workspace',
}

storage.set(LEGACY_UNSCOPED_LOCAL_PROJECT_STORAGE_KEY, JSON.stringify([{
  id: 'legacy-project',
  name: 'Legacy project',
}]))
storage.set(LEGACY_UNSCOPED_LOCAL_PROJECT_HANDOFF_STORAGE_KEY, JSON.stringify([{
  projectId: 'legacy-project',
  editSessionId: 'legacy-edit',
  projectName: 'Legacy project',
}]))

assert.deepEqual(listLocalProjectRecords(primaryScope), [], 'Legacy unscoped projects must not migrate into an authenticated scope.')
assert.deepEqual(listLocalInternalProjectHandoffs(primaryScope), [], 'Legacy unscoped handoffs must not migrate into an authenticated scope.')

const primaryProject = createLocalProjectRecord({
  category: 'storytelling',
  name: 'Primary scoped project',
  projectId: 'project-primary',
  workspaceId: primaryScope.workspaceId,
  now: new Date('2026-07-10T12:00:00.000Z'),
})
const primaryHandoff = createLocalInternalProjectHandoff({
  category: 'storytelling',
  editName: 'Primary scoped edit',
  projectId: primaryProject.id,
  projectName: primaryProject.name,
  workspaceId: primaryScope.workspaceId,
  now: new Date('2026-07-10T12:01:00.000Z'),
})
saveLocalProjectRecord(primaryScope, primaryProject)
saveLocalInternalProjectHandoff(primaryScope, primaryHandoff, { syncBackend: false })

assert.equal(listLocalProjectRecords(primaryScope)[0]?.id, primaryProject.id)
assert.equal(listLocalInternalProjectHandoffs(primaryScope)[0]?.editSessionId, primaryHandoff.editSessionId)
assert.deepEqual(listLocalProjectRecords(otherUserScope), [], 'A second user on the same origin and workspace must not see the first user project cache.')
assert.deepEqual(listLocalInternalProjectHandoffs(otherUserScope), [], 'A second user on the same origin and workspace must not see the first user handoff cache.')
assert.deepEqual(listLocalProjectRecords(otherWorkspaceScope), [], 'The same user in a second workspace must not see the first workspace project cache.')
assert.deepEqual(listLocalInternalProjectHandoffs(otherWorkspaceScope), [], 'The same user in a second workspace must not see the first workspace handoff cache.')

const projectKey = buildLocalProjectStorageKey(primaryScope)
const handoffKey = buildLocalProjectHandoffStorageKey(primaryScope)
assert.notEqual(projectKey, buildLocalProjectStorageKey(otherUserScope))
assert.notEqual(projectKey, buildLocalProjectStorageKey(otherWorkspaceScope))
assert.notEqual(handoffKey, buildLocalProjectHandoffStorageKey(otherUserScope))
assert.notEqual(handoffKey, buildLocalProjectHandoffStorageKey(otherWorkspaceScope))
assert.notEqual(
  buildLocalProjectStorageKey(dottedScopeLeft),
  buildLocalProjectStorageKey(dottedScopeRight),
  'Length-prefixed project scope segments must not collide when allowed ids contain periods.',
)
assert.notEqual(
  buildLocalProjectHandoffStorageKey(dottedScopeLeft),
  buildLocalProjectHandoffStorageKey(dottedScopeRight),
  'Length-prefixed handoff scope segments must not collide when allowed ids contain periods.',
)

const validProjectEnvelope = JSON.parse(storage.get(projectKey) ?? '{}') as Record<string, unknown>
const validHandoffEnvelope = JSON.parse(storage.get(handoffKey) ?? '{}') as Record<string, unknown>
assert.equal(validProjectEnvelope.scopeFingerprint, createProjectPersistenceScopeFingerprint(primaryScope))
assert.equal(validHandoffEnvelope.scopeFingerprint, createProjectPersistenceScopeFingerprint(primaryScope))

storage.set(projectKey, JSON.stringify({
  ...validProjectEnvelope,
  scopeFingerprint: 'tampered-project-scope-fingerprint',
}))
storage.set(handoffKey, JSON.stringify({
  ...validHandoffEnvelope,
  scopeFingerprint: 'tampered-handoff-scope-fingerprint',
}))
assert.deepEqual(listLocalProjectRecords(primaryScope), [], 'A project envelope with a mismatched scope fingerprint must fail closed.')
assert.deepEqual(listLocalInternalProjectHandoffs(primaryScope), [], 'A handoff envelope with a mismatched scope fingerprint must fail closed.')

storage.set(projectKey, JSON.stringify({
  ...validProjectEnvelope,
  scope: { authMode: 'local_test', userId: otherUserScope.userId, workspaceId: primaryScope.workspaceId },
}))
storage.set(handoffKey, JSON.stringify({
  ...validHandoffEnvelope,
  scope: { authMode: 'local_test', userId: primaryScope.userId, workspaceId: otherWorkspaceScope.workspaceId },
}))
assert.deepEqual(listLocalProjectRecords(primaryScope), [], 'A project envelope with foreign owner metadata must fail closed.')
assert.deepEqual(listLocalInternalProjectHandoffs(primaryScope), [], 'A handoff envelope with foreign workspace metadata must fail closed.')

storage.set(projectKey, '{not-json')
storage.set(handoffKey, '{not-json')
assert.deepEqual(listLocalProjectRecords(primaryScope), [], 'Malformed project persistence must fail closed.')
assert.deepEqual(listLocalInternalProjectHandoffs(primaryScope), [], 'Malformed handoff persistence must fail closed.')

const supabaseScope = {
  authMode: 'supabase' as const,
  userId: 'supabase-user-a',
  workspaceId: 'workspace-supabase-a',
}
activateProjectPersistenceScope(supabaseScope)
const supabaseProject = createLocalProjectRecord({
  category: 'business_brand',
  name: 'Validated Supabase cache',
  projectId: 'supabase-project-a',
  workspaceId: supabaseScope.workspaceId,
})
saveLocalProjectRecord(supabaseScope, supabaseProject)
const supabaseHandoff = createLocalInternalProjectHandoff({
  category: 'business_brand',
  editName: 'Validated Supabase edit cache',
  projectId: supabaseProject.id,
  projectName: supabaseProject.name,
  workspaceId: supabaseScope.workspaceId,
})
saveLocalInternalProjectHandoff(supabaseScope, supabaseHandoff, { syncBackend: false })
deactivateProjectPersistenceScope(supabaseScope)
assert.deepEqual(
  listLocalProjectRecords(supabaseScope),
  [],
  'A mounted route must not read a Supabase project cache after its membership scope is deactivated.',
)
activateProjectPersistenceScope(supabaseScope)
assert.equal(listLocalProjectRecords(supabaseScope)[0]?.id, supabaseProject.id)
assert.equal(listLocalInternalProjectHandoffs(supabaseScope)[0]?.editSessionId, supabaseHandoff.editSessionId)
let revalidationEventCount = 0
windowEvents.addEventListener(PROJECT_PERSISTENCE_SCOPE_REVALIDATE_EVENT, () => {
  revalidationEventCount += 1
})
invalidateProjectPersistenceScope(supabaseScope)
assert.equal(isProjectPersistenceScopeActive(supabaseScope), false)
assert.deepEqual(listLocalProjectRecords(supabaseScope), [])
assert.deepEqual(listLocalInternalProjectHandoffs(supabaseScope), [])
assert.equal(storage.has(buildLocalProjectStorageKey(supabaseScope)), false)
assert.equal(storage.has(buildLocalProjectHandoffStorageKey(supabaseScope)), false)
assert.equal(revalidationEventCount, 1)

const originalApiMode = process.env.VITE_REEDITPRO_API_MODE
const originalApiBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalFetch = globalThis.fetch
const queueRequests: Array<{ handoff?: { editName?: string; updatedAt?: string } }> = []
let releaseFirstFailedWrite: (() => void) | undefined
const firstFailedWriteGate = new Promise<void>((resolve) => {
  releaseFirstFailedWrite = resolve
})

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = 'http://127.0.0.1:8799'
globalThis.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body ?? '{}')) as {
    handoff?: { editName?: string; updatedAt?: string }
  }
  queueRequests.push(body)

  if (queueRequests.length === 1) {
    await firstFailedWriteGate
    return new Response(JSON.stringify({
      ok: false,
      statusCode: 503,
      error: { code: 'http_transport_failed', message: 'Simulated first PUT failure.' },
      warnings: [],
      mockOnly: false,
    }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    })
  }

  const handoff = body.handoff
  return new Response(JSON.stringify({
    ok: true,
    statusCode: 200,
    data: {
      internalEditState: {
        userId: 'queue-user',
        workspaceId: 'queue-workspace',
        projectId: 'queue-project',
        editSessionId: 'queue-edit',
        handoff: {
          id: 'queue-edit',
          workspaceId: 'queue-workspace',
          projectId: 'queue-project',
          editSessionId: 'queue-edit',
          projectName: 'Queue project',
          editName: handoff?.editName,
          category: 'storytelling',
          editorPath: '/projects/queue-project/edits/queue-edit',
          stage: 'created',
          sourceFileCount: 0,
          createdAt: '2026-07-10T15:00:00.000Z',
          updatedAt: handoff?.updatedAt,
          persistence: 'browser_local_internal_testing',
        },
        updatedAt: handoff?.updatedAt,
      },
    },
    warnings: [],
    mockOnly: false,
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

try {
  const queueScope = {
    authMode: 'local_test' as const,
    userId: 'queue-user',
    workspaceId: 'queue-workspace',
  }
  const firstQueuedHandoff = createLocalInternalProjectHandoff({
    category: 'storytelling',
    editName: 'First queued state',
    projectId: 'queue-project',
    editSessionId: 'queue-edit',
    projectName: 'Queue project',
    workspaceId: queueScope.workspaceId,
    now: new Date('2026-07-10T15:00:00.000Z'),
  })
  const newerQueuedHandoff = {
    ...firstQueuedHandoff,
    editName: 'Latest queued state',
    updatedAt: '2026-07-10T15:00:02.000Z',
  }
  const observedStatuses: string[] = []
  const unsubscribe = subscribeInternalEditPersistenceStatus(
    queueScope,
    firstQueuedHandoff.projectId,
    firstQueuedHandoff.editSessionId,
    (status) => observedStatuses.push(status.status),
  )

  saveLocalInternalProjectHandoff(queueScope, firstQueuedHandoff)
  await waitFor(() => queueRequests.length === 1, 'The first queued handoff should start one PUT.')
  saveLocalInternalProjectHandoff(queueScope, newerQueuedHandoff)
  releaseFirstFailedWrite?.()

  await waitFor(
    () => getInternalEditPersistenceStatus(queueScope, 'queue-project', 'queue-edit').status === 'needs_retry',
    'A failed PUT should retain an explicit retry state.',
  )
  const failedStatus = getInternalEditPersistenceStatus(queueScope, 'queue-project', 'queue-edit')
  assert.equal(failedStatus.handoffUpdatedAt, newerQueuedHandoff.updatedAt)
  assert.equal(failedStatus.storage, 'browser_local')
  assert.equal(failedStatus.retryable, true)
  assert.equal(queueRequests.length, 1, 'A failure must not create an unbounded automatic retry loop.')
  assert.equal(queueRequests[0]?.handoff?.editName, firstQueuedHandoff.editName)
  const failedHeaderCopy = getInternalEditPersistenceStatusCopy(failedStatus)
  assert.equal(failedHeaderCopy.label, 'Save needs retry')
  assert.match(failedHeaderCopy.title, /Saved in this browser, but private workspace recovery needs a retry/)

  assert.equal(
    retryInternalEditPersistence(queueScope, 'queue-project', 'queue-edit'),
    true,
    'The exact scoped edit should expose an explicit retry.',
  )
  await waitFor(() => queueRequests.length === 2, 'Explicit retry should issue one more PUT.')
  await waitFor(
    () => getInternalEditPersistenceStatus(queueScope, 'queue-project', 'queue-edit').status === 'saved_backend',
    'The exact latest handoff should become backend-recoverable after retry.',
  )

  assert.equal(queueRequests[1]?.handoff?.editName, newerQueuedHandoff.editName)
  assert.equal(queueRequests[1]?.handoff?.updatedAt, newerQueuedHandoff.updatedAt)
  assert.deepEqual(
    observedStatuses.filter((status, index) => index === 0 || status !== observedStatuses[index - 1]),
    ['saved_local', 'saving', 'needs_retry', 'saving', 'saved_backend'],
  )
  const localOnlyStatus = {
    ...getInternalEditPersistenceStatus(queueScope, 'queue-project', 'queue-edit'),
    status: 'saved_local' as const,
    storage: 'browser_local' as const,
    message: 'Saved in this browser for this signed-in local session.',
  }
  const localHeaderCopy = getInternalEditPersistenceStatusCopy(localOnlyStatus)
  assert.equal(localHeaderCopy.label, 'Saved in browser')
  assert.doesNotMatch(`${localHeaderCopy.label} ${localHeaderCopy.title}`, /backend|durable|cloud/i)
  unsubscribe()
} finally {
  globalThis.fetch = originalFetch
  restoreEnv('VITE_REEDITPRO_API_MODE', originalApiMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalApiBaseUrl)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'legacy_unscoped_project_cache_ignored',
    'legacy_unscoped_handoff_cache_ignored',
    'same_workspace_other_user_isolated',
    'same_user_other_workspace_isolated',
    'dotted_scope_ids_have_collision_free_storage_keys',
    'scope_fingerprint_mismatch_rejected',
    'foreign_envelope_scope_rejected',
    'malformed_envelopes_fail_closed',
    'supabase_cache_hidden_until_membership_scope_is_active',
    'explicit_scope_invalidation_purges_both_caches_and_requests_revalidation',
    'failed_internal_edit_put_retains_latest_handoff_for_explicit_bounded_retry',
    'explicit_retry_persists_exact_latest_scoped_handoff',
    'persistence_subscription_reports_honest_local_backend_and_retry_states',
    'named_edit_header_exposes_retry_and_browser_only_status_honestly',
  ],
}))

async function waitFor(check: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 3_000
  while (!check()) {
    if (Date.now() > deadline) throw new Error(message)
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}
