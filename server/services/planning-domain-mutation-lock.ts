import { createHash } from 'node:crypto'

export interface PlanningDomainMutationScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

const planningDomainLocks = new Map<string, Promise<void>>()

/**
 * Serializes planning-input mutations with canonical publication/approval in the
 * private single-host runtime. Production remains fail-closed until the same
 * invariant is enforced by one durable database transaction/RPC.
 */
export async function withPlanningDomainMutationLock<T>(
  scope: PlanningDomainMutationScope,
  operation: () => Promise<T>,
): Promise<T> {
  const key = planningDomainMutationScopeHash(scope)
  const previous = planningDomainLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.catch(() => undefined).then(() => current)
  planningDomainLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (planningDomainLocks.get(key) === queued) planningDomainLocks.delete(key)
  }
}

export function clearPlanningDomainMutationLocksForSmoke(): void {
  planningDomainLocks.clear()
}

function planningDomainMutationScopeHash(scope: PlanningDomainMutationScope): string {
  return createHash('sha256').update([
    scope.localStorageRoot,
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ].join('\n')).digest('hex')
}
