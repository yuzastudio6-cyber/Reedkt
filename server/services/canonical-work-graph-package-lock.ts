const packageLocks = new Map<string, Promise<void>>()

export interface CanonicalWorkGraphPackageLockScope {
  ownerUserId: string
  workspaceId: string
  packageRecordId: string
}

export async function withCanonicalWorkGraphPackageLock<T>(
  scope: CanonicalWorkGraphPackageLockScope,
  operation: () => Promise<T>,
): Promise<T> {
  const key = lockKey(scope)
  const previous = packageLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  packageLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (packageLocks.get(key) === tail) packageLocks.delete(key)
  }
}

export function clearCanonicalWorkGraphPackageLocksForSmoke(): void {
  packageLocks.clear()
}

function lockKey(scope: CanonicalWorkGraphPackageLockScope): string {
  return [scope.ownerUserId, scope.workspaceId, scope.packageRecordId].join('\u0000')
}
