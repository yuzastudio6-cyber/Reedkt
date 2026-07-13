import process from 'node:process'

process.env.REEDITPRO_DISABLE_DOTENV = 'true'

const [{ loadRuntimeEnv }, reconciler] = await Promise.all([
  import('../config/env'),
  import('../media/private-source-probe-orphan-reconciler'),
])

try {
  const env = loadRuntimeEnv({
    ...process.env,
    API_ALLOW_MOCK_WITHOUT_SUPABASE: process.env.API_ALLOW_MOCK_WITHOUT_SUPABASE ?? 'true',
  })
  if (
    env.nodeEnv === 'production'
    || !['local', 'mock'].includes(env.mode)
    || env.storageMode !== 'local'
  ) {
    throw new Error('private_source_probe_reconciliation_local_runtime_required')
  }

  const deleteRequested = process.argv.includes('--delete')
  const staleHours = readPositiveNumberArg('--stale-hours') ?? 24
  const report = await reconciler.reconcilePrivateSourceProbeOrphans({
    localStorageRoot: env.localStorageRoot,
    mode: deleteRequested ? 'delete_stale' : 'inspect_only',
    staleAfterMs: staleHours * 60 * 60 * 1_000,
    maintenanceAuthority: deleteRequested
      ? {
          kind: 'private_single_process_local_storage_maintenance',
          requestServingStopped: requireFlag('--confirm-request-serving-stopped'),
          exclusiveLocalStorageRootConfirmed: requireFlag('--confirm-exclusive-local-storage-root'),
        }
      : undefined,
  })
  console.log(JSON.stringify({ ok: true, report }, null, 2))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    reason: safeFailureReason(error),
  }))
  process.exitCode = 1
}

function readPositiveNumberArg(name: string): number | undefined {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  const value = Number(process.argv[index + 1])
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('private_source_probe_reconciliation_argument_invalid')
  }
  return value
}

function requireFlag(name: string): true {
  if (!process.argv.includes(name)) {
    throw new Error('private_source_probe_reconciliation_maintenance_confirmation_required')
  }
  return true
}

function safeFailureReason(error: unknown): string {
  if (reconciler.isPrivateSourceProbeReconciliationError(error)) {
    const details = error.details as { reason?: unknown } | undefined
    if (typeof details?.reason === 'string') return details.reason
  }
  if (error instanceof Error && /^private_source_probe_reconciliation_[a-z0-9_]+$/.test(error.message)) {
    return error.message
  }
  return 'private_source_probe_reconciliation_failed'
}
