import { readFile } from 'node:fs/promises'

import { loadRuntimeEnv } from '../../config/env'
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
  createCanonicalPrivateServiceIdentityFixture,
} from '../../security/canonical-service-identity-verifier'
import {
  createCanonicalPrivateCloudDispatchReceiverService,
} from '../../services/canonical-private-cloud-dispatch-receiver-service'
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
import type { ServiceContext } from '../../types'
import {
  canonicalCloudDispatchWorkerCompletionEvidenceSchema,
  canonicalCloudDispatchWorkerFailureEvidenceSchema,
} from '../../validation/canonical-cloud-dispatch-outbox-schemas'

const [
  mode,
  scopePath,
  definitionPath,
  manifestPath,
  now,
  workerEvidencePath,
  dispatchIntentId,
] = process.argv.slice(2)
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
} else if (
  mode === 'complete' || mode === 'crash-completion-after-commit' ||
  mode === 'crash-completion-after-queue' || mode === 'fail' ||
  mode === 'crash-failure-after-commit' || mode === 'crash-failure-after-queue'
) {
  if (
    !definitionPath || !manifestPath || !now || !workerEvidencePath ||
    !dispatchIntentId
  ) {
    throw new Error('Package-state worker-result child inputs are incomplete.')
  }
  const definition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    JSON.parse(await readFile(definitionPath, 'utf8')),
  )
  const manifest = canonicalCloudWorkerDispatchHandoffManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, 'utf8')),
  )
  const workerEvidence = JSON.parse(await readFile(workerEvidencePath, 'utf8'))
  const manifestEntry = manifest.entries.find((entry) =>
    entry.jobId === definition.jobs[0]!.jobId)
  if (!manifestEntry) throw new Error('Worker-result child manifest entry is missing.')
  const context: ServiceContext = {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      LOCAL_STORAGE_ROOT: scope.localStorageRoot,
    }),
    clients: { admin: null, public: null },
    requestId: `worker-result-child-${process.pid}`,
    auth: { userId: scope.ownerUserId, isMockUser: true },
  }
  const service = createCanonicalPrivateCloudDispatchReceiverService({
    context,
    ownerUserId: scope.ownerUserId,
    queueDefinition: definition,
    manifest,
    controllerAudience: 'https://private-controller.reeditpro.test',
    workerReceiverAudience: 'https://private-worker.reeditpro.test',
    now: () => new Date(now),
  })
  const nowMs = Date.parse(now)
  const workerIdentity = createCanonicalPrivateServiceIdentityFixture({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    subject: 'completion-worker-subject',
    principalEmail: manifestEntry.target.workerServiceAccountEmail,
    audience: 'https://private-worker.reeditpro.test',
    issuedAt: new Date(nowMs - 1_000).toISOString(),
    expiresAt: new Date(nowMs + 120_000).toISOString(),
    verifiedAt: new Date(nowMs - 500).toISOString(),
  })
  const isFailure = mode === 'fail' || mode === 'crash-failure-after-commit' ||
    mode === 'crash-failure-after-queue'
  const faultInjectionForSmoke = (
    mode === 'crash-completion-after-commit' ||
    mode === 'crash-completion-after-queue' ||
    mode === 'crash-failure-after-commit' ||
    mode === 'crash-failure-after-queue'
  )
    ? (stage: CanonicalPrivatePackageStateFaultStage) => {
        const afterCommit = mode === 'crash-completion-after-commit' ||
          mode === 'crash-failure-after-commit'
        const expected = afterCommit
          ? 'after_write_ahead_commit'
          : 'after_queue_projection'
        if (stage === expected) process.exit(isFailure ? 79 : 78)
      }
    : undefined
  const result = isFailure
    ? await service.reconcileWorkerFailure({
        dispatchIntentId,
        failureEvidence: canonicalCloudDispatchWorkerFailureEvidenceSchema.parse(
          workerEvidence,
        ),
        verifiedIdentity: workerIdentity,
        faultInjectionForSmoke,
      })
    : await service.reconcileWorkerCompletion({
        dispatchIntentId,
        completionEvidence: canonicalCloudDispatchWorkerCompletionEvidenceSchema.parse(
          workerEvidence,
        ),
        verifiedIdentity: workerIdentity,
        faultInjectionForSmoke,
      })
  process.stdout.write(`${JSON.stringify({
    disposition: result.disposition,
    receiptHash: result.receipt.receiptHash,
  })}\n`)
} else {
  throw new Error(`Unknown package-state child mode: ${mode}`)
}
