import assert from 'node:assert/strict'
import {
  clearPlanningDomainMutationLocksForSmoke,
  withPlanningDomainMutationLock,
  type PlanningDomainMutationScope,
} from '../services/planning-domain-mutation-lock'

const scope: PlanningDomainMutationScope = {
  localStorageRoot: '/tmp/reeditpro-planning-domain-lock-smoke',
  ownerUserId: 'user-lock-smoke',
  workspaceId: 'workspace-lock-smoke',
  projectId: 'project-lock-smoke',
  editSessionId: 'edit-session-lock-smoke',
}

clearPlanningDomainMutationLocksForSmoke()
const events: string[] = []
const firstEntered = deferred()
const releaseFirst = deferred()
const first = withPlanningDomainMutationLock(scope, async () => {
  events.push('first_entered')
  firstEntered.resolve()
  await releaseFirst.promise
  events.push('first_released')
})
await firstEntered.promise
const second = withPlanningDomainMutationLock(scope, async () => {
  events.push('second_entered')
})
await new Promise<void>((resolve) => setImmediate(resolve))
assert.deepEqual(events, ['first_entered'], 'The same edit domain must not enter two planning mutations concurrently.')
releaseFirst.resolve()
await Promise.all([first, second])
assert.deepEqual(events, ['first_entered', 'first_released', 'second_entered'])

await assert.rejects(
  withPlanningDomainMutationLock(scope, async () => {
    throw new Error('expected lock smoke failure')
  }),
  /expected lock smoke failure/,
)
let recovered = false
await withPlanningDomainMutationLock(scope, async () => {
  recovered = true
})
assert.equal(recovered, true, 'A failed mutation must release the planning-domain lock.')

const otherScope = { ...scope, editSessionId: 'edit-session-lock-smoke-other' }
const crossScopeEntered = deferred()
const holdScope = deferred()
const held = withPlanningDomainMutationLock(scope, async () => {
  crossScopeEntered.resolve()
  await holdScope.promise
})
await crossScopeEntered.promise
let otherScopeRan = false
await withPlanningDomainMutationLock(otherScope, async () => {
  otherScopeRan = true
})
assert.equal(otherScopeRan, true, 'Independent edit sessions must remain parallelizable.')
holdScope.resolve()
await held

console.log(JSON.stringify({
  ok: true,
  checks: [
    'same_edit_planning_mutations_serialized',
    'failed_mutation_releases_lock',
    'independent_edit_sessions_remain_parallelizable',
    'single_host_only_production_still_fail_closed',
  ],
}))

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}
