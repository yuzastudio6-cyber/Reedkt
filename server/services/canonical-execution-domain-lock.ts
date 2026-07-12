import { createHash } from 'node:crypto'

export interface CanonicalExecutionDomainScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

const executionDomainLocks = new Map<string, Promise<void>>()

/**
 * Serializes lease claim, dispatch authorization/consumption, and cancellation
 * for one private single-host edit. Production remains blocked until the same
 * fence is enforced by durable transactional authority.
 */
export async function withCanonicalExecutionDomainLock<T>(
  scope: CanonicalExecutionDomainScope,
  operation: () => Promise<T>,
): Promise<T> {
  const key = executionDomainScopeHash(scope)
  const previous = executionDomainLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.catch(() => undefined).then(() => current)
  executionDomainLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (executionDomainLocks.get(key) === queued) executionDomainLocks.delete(key)
  }
}

export function clearCanonicalExecutionDomainLocksForSmoke(): void {
  executionDomainLocks.clear()
}

function executionDomainScopeHash(scope: CanonicalExecutionDomainScope): string {
  return createHash('sha256').update([
    scope.localStorageRoot,
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
  ].join('\n')).digest('hex')
}
