import { readFile } from 'node:fs/promises'

import {
  canonicalCloudWorkerDispatchHandoffManifestSchema,
} from '../../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
} from '../../edit-architecture/canonical-private-package-work-queue-authority'
import {
  withPrivateCooperativeFileLockWithinRoot,
} from '../../security/private-local-persistence'
import {
  claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt,
} from '../../services/private-canonical-package-cloud-dispatch-transaction-store'
import {
  claimPrivateCanonicalPackageWorkQueueJob,
} from '../../services/private-canonical-package-work-queue-store'
import {
  canonicalPrivatePackageStatePaths,
  type CanonicalPrivatePackageStateFaultStage,
  type CanonicalPrivatePackageStateScope,
} from '../../services/private-canonical-package-state-transaction'

const [mode, scopePath, definitionPath, manifestPath, now] = process.argv.slice(2)
if (!mode || !scopePath) throw new Error('Package-state child mode and scope are required.')
const scope = JSON.parse(await readFile(scopePath, 'utf8')) as CanonicalPrivatePackageStateScope

if (mode === 'hold-lock') {
  const paths = canonicalPrivatePackageStatePaths(scope)
  await withPrivateCooperativeFileLockWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: paths.lockRelativePath,
    operation: async () => {
      process.stdout.write('LOCK_ACQUIRED\n')
      await new Promise<void>(() => undefined)
    },
  })
} else if (
  mode === 'claim' || mode === 'queue-claim' ||
  mode === 'crash-after-commit' || mode === 'crash-after-queue'
) {
  if (!definitionPath || !manifestPath || !now) {
    throw new Error('Package-state claim child inputs are incomplete.')
  }
  const definition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    JSON.parse(await readFile(definitionPath, 'utf8')),
  )
  if (mode === 'queue-claim') {
    const result = await claimPrivateCanonicalPackageWorkQueueJob({
      scope,
      definition,
      jobId: definition.jobs[0]!.jobId,
      workerIdentity: `cross-process-queue-${process.pid}`,
      workerType: definition.jobs[0]!.workerType,
      now,
      leaseDurationMs: 120_000,
    })
    process.stdout.write(`${JSON.stringify({
      disposition: result.disposition,
      ...('entry' in result && result.entry.activeClaim
        ? { queueClaimId: result.entry.activeClaim.claimId }
        : {}),
    })}\n`)
    process.exitCode = 0
  } else {
    const manifest = canonicalCloudWorkerDispatchHandoffManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, 'utf8')),
    )
    const result = await claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt({
      scope,
      definition,
      manifest,
      jobId: definition.jobs[0]!.jobId,
      workerIdentity: `cross-process-dispatch-${process.pid}`,
      now,
      leaseDurationMs: 120_000,
      ...(mode === 'crash-after-commit' || mode === 'crash-after-queue'
        ? {
            faultInjectionForSmoke: (stage: CanonicalPrivatePackageStateFaultStage) => {
              const expected = mode === 'crash-after-commit'
                ? 'after_write_ahead_commit'
                : 'after_queue_projection'
              if (stage === expected) process.exit(77)
            },
          }
        : {}),
    })
    process.stdout.write(`${JSON.stringify({
      disposition: result.disposition,
      ...('outboxEntry' in result
        ? {
            queueClaimId: result.queueEntry.activeClaim.claimId,
            dispatchIntentId: result.outboxEntry.immutable.dispatchIntentId,
          }
        : {}),
    })}\n`)
  }
} else {
  throw new Error(`Unknown package-state child mode: ${mode}`)
}
