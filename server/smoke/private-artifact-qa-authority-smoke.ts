import assert from 'node:assert/strict'
import { readFile, rm, stat, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { writePrivateTextFileAtomicWithinRoot } from '../security/private-local-persistence'
import {
  createPrivateArtifactQaAuthorityService,
  type ServerInjectedArtifactQaAdapter,
  type ServerInjectedArtifactResultAdapter,
} from '../services/private-artifact-qa-authority-service'
import {
  clearPrivateArtifactQaAuthorityProcessStateForSmoke,
  privateArtifactQaAggregateRelativePath,
  privateArtifactQaBlobRelativePath,
  readPrivateArtifactQaAggregate,
  sha256ArtifactQaValue,
} from '../services/private-artifact-qa-authority-store'
import { readPrivateEditAuthorityAggregate } from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

type ArtifactIdentity = ReturnType<typeof identity>

class DeterministicArtifactAdapter implements ServerInjectedArtifactResultAdapter {
  readonly adapterKind = 'server_injected_internal_artifact_adapter' as const
  callCount = 0
  private next?: {
    identity: ArtifactIdentity
    artifactVersion: number
    attemptKind: 'initial' | 'retry' | 'approved_fallback' | 'user_approved_replacement'
    replacesArtifactId?: string
    placeholder?: boolean
    contentSeed?: string
  }

  configure(next: NonNullable<DeterministicArtifactAdapter['next']>): void {
    this.next = { ...next }
  }

  async collectProducedArtifact(input: Parameters<ServerInjectedArtifactResultAdapter['collectProducedArtifact']>[0]) {
    this.callCount += 1
    const next = this.next
    assert.ok(next, 'Deterministic artifact adapter was not configured.')
    assert.deepEqual(input.identity, next.identity)
    this.next = undefined
    const seed = next.contentSeed ?? `${input.identity.expectedAssetId}:v${next.artifactVersion}`
    return {
      schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
      evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
      evidenceClass: 'private_internal_test_attested' as const,
      artifactVersion: next.artifactVersion,
      attemptKind: next.attemptKind,
      ...(next.replacesArtifactId ? { replacesArtifactId: next.replacesArtifactId } : {}),
      content: {
        sha256: sha256ArtifactQaValue({ seed, kind: 'artifact-content-bytes-not-written' }),
        byteLength: 1_024 + next.artifactVersion,
        contentType: input.lineage.contentType ?? 'application/octet-stream',
      },
      storageIdentity: {
        storageKind: 'private_local_test' as const,
        opaqueObjectIdentityHash: sha256ArtifactQaValue({
          identity: input.identity,
          version: next.artifactVersion,
          seed,
        }),
      },
      placeholder: {
        isPlaceholder: next.placeholder ?? false,
        scope: next.placeholder ? 'preview_only' as const : 'none' as const,
      },
      actualRunEvidence: {
        state: 'actual_run_evidence_placeholder' as const,
        executionAttemptId: `test-attempt-${next.artifactVersion}`,
        runnerClass: 'deterministic_private_test_adapter',
        toolIds: [],
        actualRunVerified: false as const,
      },
      completedAt: new Date().toISOString(),
    }
  }
}

class DeterministicQaAdapter implements ServerInjectedArtifactQaAdapter {
  readonly adapterKind = 'server_injected_internal_qa_adapter' as const
  private modes = new Map<string, 'pass' | 'fallback' | 'user_review'>()

  configure(artifactId: string, mode: 'pass' | 'fallback' | 'user_review'): void {
    this.modes.set(artifactId, mode)
  }

  async evaluateArtifact(input: Parameters<ServerInjectedArtifactQaAdapter['evaluateArtifact']>[0]) {
    const mode = this.modes.get(input.artifact.artifactId)
    assert.ok(mode, 'Deterministic QA adapter was not configured.')
    this.modes.delete(input.artifact.artifactId)
    const qualityStatus = mode === 'pass'
      ? 'passed' as const
      : mode === 'fallback'
        ? 'failed' as const
        : 'needs_user_review' as const
    return {
      schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
      evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
      evidenceClass: 'private_internal_test_attested' as const,
      gateResults: [
        {
          gateId: 'asset_received_gate' as const,
          category: 'asset_integrity' as const,
          status: 'passed' as const,
          failureScope: 'none' as const,
          evidenceHash: sha256ArtifactQaValue({ artifactId: input.artifact.artifactId, gate: 'received' }),
          notesCode: 'expected_identity_content_and_storage_shape_match',
        },
        {
          gateId: 'asset_quality_gate' as const,
          category: 'visual_assets' as const,
          status: qualityStatus,
          failureScope: mode === 'pass' ? 'none' as const : 'local_asset' as const,
          evidenceHash: sha256ArtifactQaValue({ artifactId: input.artifact.artifactId, gate: 'quality', mode }),
          notesCode: mode === 'pass'
            ? 'private_test_quality_attestation_passed'
            : mode === 'fallback'
              ? 'private_test_quality_fallback_required'
              : 'private_test_quality_user_review_required',
        },
        ...(input.artifact.lineage.assetRole === 'final'
          ? [
              {
                gateId: 'render_preflight_gate' as const,
                category: 'render_composition' as const,
                status: 'passed' as const,
                failureScope: 'none' as const,
                evidenceHash: sha256ArtifactQaValue({
                  artifactId: input.artifact.artifactId,
                  gate: 'render-preflight',
                }),
                notesCode: 'private_test_render_preflight_attestation_passed',
              },
              {
                gateId: 'final_qa_gate' as const,
                category: 'asset_integrity' as const,
                status: 'passed' as const,
                failureScope: 'none' as const,
                evidenceHash: sha256ArtifactQaValue({
                  artifactId: input.artifact.artifactId,
                  gate: 'final-qa',
                }),
                notesCode: 'private_test_final_qa_attestation_passed',
              },
            ]
          : []),
      ],
      recovery: mode === 'pass'
        ? {
            state: 'none' as const,
            action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: 'qa_pass_no_recovery',
          }
        : mode === 'fallback'
          ? {
              state: 'fallback_available' as const,
              action: 'retry_simpler' as const,
              approvedWithinSnapshot: true,
              reasonCode: 'approved_retry_fallback_available',
            }
          : {
              state: 'needs_user_review' as const,
              action: 'request_user_review' as const,
              approvedWithinSnapshot: false,
              reasonCode: 'meaning_or_intent_review_required',
            },
      evaluatedAt: new Date().toISOString(),
      actualQaEvidenceState: 'actual_qa_evidence_placeholder' as const,
      actualQaVerified: false as const,
    }
  }
}

// The canonical integration smoke creates a fully server-owned private plan,
// approval, funded reservation, snapshot, expected-output manifest, jobs, and
// execution package. This smoke adds a separate produced-result/QA authority;
// it never mutates that canonical aggregate.
await import('./edit-planning-authority-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const userId = 'user-authority-smoke'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'private-artifact-qa-authority-smoke',
  auth: { userId, isMockUser: true },
}

const canonicalBefore = await readPrivateEditAuthorityAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
assert.ok(canonicalBefore)
const snapshotCandidate = canonicalBefore.snapshots.find((candidate) =>
  canonicalBefore.executionPackages.some((record) => record.snapshotId === candidate.snapshotId))
if (!snapshotCandidate) throw new Error('Canonical smoke snapshot was not created.')
const snapshot = snapshotCandidate
const canonicalSnapshotBefore = JSON.stringify(snapshot)
const jobs = new Map(canonicalBefore.jobs
  .filter((job) => job.snapshotId === snapshot.snapshotId)
  .map((job) => [job.workItemKey, job]))
const independentRootJob = jobs.get('snapshot-validation')
const rootJob = jobs.get('source-trim')
const supportingRootJob = jobs.get('caption-overlay')
const trimJob = jobs.get('final-export')
const finalQaJob = jobs.get('final-qa')
assert.ok(independentRootJob)
assert.ok(rootJob)
assert.ok(supportingRootJob)
assert.ok(trimJob)
assert.ok(finalQaJob)
const rootAssetId = onlyExpectedAssetId(rootJob.expectedAssetIds)
const supportingRootAssetId = onlyExpectedAssetId(supportingRootJob.expectedAssetIds)
const trimAssetId = onlyExpectedAssetId(trimJob.expectedAssetIds)
const finalQaAssetId = onlyExpectedAssetId(finalQaJob.expectedAssetIds)

const artifactAdapter = new DeterministicArtifactAdapter()
const qaAdapter = new DeterministicQaAdapter()
let service = createPrivateArtifactQaAuthorityService(context, {
  producedArtifact: artifactAdapter,
  artifactQa: qaAdapter,
})

const rootIdentity = identity(rootJob.id, rootAssetId)
const supportingRootIdentity = identity(supportingRootJob.id, supportingRootAssetId)
const trimIdentity = identity(trimJob.id, trimAssetId)
const finalQaIdentity = identity(finalQaJob.id, finalQaAssetId)

const rootReadinessBefore = await service.deriveJobDependencyReadiness(readinessRequest(rootJob.id))
assert.equal(rootReadinessBefore.readinessGroup, 'ready_now_private_test_only')
assert.equal(rootReadinessBefore.privateTestDependencySatisfied, true)
assert.equal(rootReadinessBefore.liveRuntimeDependencySatisfied, false)
assert.equal(rootReadinessBefore.workerExecutionAuthorized, false)

const trimReadinessBefore = await service.deriveJobDependencyReadiness(readinessRequest(trimJob.id))
assert.equal(trimReadinessBefore.readinessGroup, 'waiting_for_asset')
assert.equal(trimReadinessBefore.privateTestDependencySatisfied, false)
assert.equal(trimReadinessBefore.independentWorkCanContinue, true)

await expectApiError(
  () => service.recordArtifactResult({
    ...artifactRequest(rootIdentity, 'artifact-strict-input-0001'),
    callerAuthoredEvidence: { contentSha256: 'forbidden' },
  } as never),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => service.recordArtifactResult(artifactRequest({
    ...rootIdentity,
    expectedAssetId: trimAssetId,
  }, 'artifact-wrong-output-0001')),
  'JOB_DEPENDENCY_NOT_READY',
)
await expectApiError(
  () => service.recordArtifactResult(artifactRequest({
    ...rootIdentity,
    snapshotId: 'snapshot-wrong-tenant-lineage',
  }, 'artifact-wrong-snapshot-0001')),
  'JOB_NOT_FOUND',
)
await expectApiError(
  () => createPrivateArtifactQaAuthorityService(context).recordArtifactResult(
    artifactRequest(rootIdentity, 'artifact-missing-adapter-0001'),
  ),
  'TOOL_NOT_READY',
)

artifactAdapter.configure({
  identity: rootIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
})
const initialRequest = artifactRequest(rootIdentity, 'artifact-root-v1-concurrent-0001')
const concurrentResults = await Promise.all([
  service.recordArtifactResult(initialRequest),
  service.recordArtifactResult(initialRequest),
])
assert.equal(artifactAdapter.callCount, 1, 'Concurrent exact retry must collect internal evidence once.')
assert.equal(concurrentResults[0].artifact.artifactId, concurrentResults[1].artifact.artifactId)
assert.deepEqual(concurrentResults.map((result) => result.replayed).sort(), [false, true])
const rootV1 = concurrentResults[0].artifact
assert.equal(rootV1.liveRuntimeEligible, false)
assert.equal(rootV1.actualRunEvidence.actualRunVerified, false)
assert.equal(rootV1.actualRunEvidence.state, 'actual_run_evidence_placeholder')

artifactAdapter.configure({
  identity: rootIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
  contentSeed: 'duplicate-active-version',
})
await expectApiError(
  () => service.recordArtifactResult(
    artifactRequest(rootIdentity, 'artifact-root-duplicate-version-0001'),
  ),
  'IDEMPOTENCY_CONFLICT',
)

qaAdapter.configure(rootV1.artifactId, 'fallback')
const rootV1Qa = await service.recordArtifactQa(
  qaRequest(rootIdentity, rootV1.artifactId, 'qa-root-v1-fallback-0001'),
)
assert.equal(rootV1Qa.qaEvaluation.outcome, 'fallback_required')
assert.equal(rootV1Qa.qaEvaluation.failureScope, 'local_asset')
const rootV1Reconcile = await service.reconcileArtifact(
  reconcileRequest(rootIdentity, rootV1.artifactId, 'reconcile-root-v1-fallback-0001'),
)
assert.equal(rootV1Reconcile.reconciliation.decision, 'fallback_requested')
assert.equal(rootV1Reconcile.reconciliation.privateTestDependencySatisfied, false)
const trimWaitingFallback = await service.deriveJobDependencyReadiness(readinessRequest(trimJob.id))
assert.equal(trimWaitingFallback.readinessGroup, 'waiting_for_fallback')

artifactAdapter.configure({
  identity: rootIdentity,
  artifactVersion: 2,
  attemptKind: 'retry',
  replacesArtifactId: rootV1.artifactId,
})
const rootV2 = (await service.recordArtifactResult(
  artifactRequest(rootIdentity, 'artifact-root-v2-review-0001'),
)).artifact
qaAdapter.configure(rootV2.artifactId, 'user_review')
const rootV2Qa = await service.recordArtifactQa(
  qaRequest(rootIdentity, rootV2.artifactId, 'qa-root-v2-review-0001'),
)
assert.equal(rootV2Qa.qaEvaluation.outcome, 'needs_user_review')
const rootV2Reconcile = await service.reconcileArtifact(
  reconcileRequest(rootIdentity, rootV2.artifactId, 'reconcile-root-v2-review-0001'),
)
assert.equal(rootV2Reconcile.reconciliation.decision, 'user_review_required')
const trimWaitingReview = await service.deriveJobDependencyReadiness(readinessRequest(trimJob.id))
assert.equal(trimWaitingReview.readinessGroup, 'waiting_for_user_review')

artifactAdapter.configure({
  identity: rootIdentity,
  artifactVersion: 3,
  attemptKind: 'user_approved_replacement',
  replacesArtifactId: rootV2.artifactId,
})
const rootV3 = (await service.recordArtifactResult(
  artifactRequest(rootIdentity, 'artifact-root-v3-pass-0001'),
)).artifact
qaAdapter.configure(rootV3.artifactId, 'pass')
const rootV3Qa = await service.recordArtifactQa(
  qaRequest(rootIdentity, rootV3.artifactId, 'qa-root-v3-pass-0001'),
)
assert.equal(rootV3Qa.qaEvaluation.outcome, 'passed')
const rootV3Reconcile = await service.reconcileArtifact(
  reconcileRequest(rootIdentity, rootV3.artifactId, 'reconcile-root-v3-pass-0001'),
)
assert.equal(rootV3Reconcile.reconciliation.decision, 'test_merged_not_live_authorized')
assert.equal(rootV3Reconcile.reconciliation.privateTestDependencySatisfied, true)
assert.equal(rootV3Reconcile.reconciliation.finalRenderAuthorized, false)

const trimWaitingSupportingRoot = await service.deriveJobDependencyReadiness(
  readinessRequest(trimJob.id),
)
assert.equal(trimWaitingSupportingRoot.readinessGroup, 'waiting_for_asset')
assert.equal(trimWaitingSupportingRoot.privateTestDependencySatisfied, false)
assert.equal(trimWaitingSupportingRoot.independentWorkCanContinue, true)

artifactAdapter.configure({
  identity: supportingRootIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
})
const supportingRootV1 = (await service.recordArtifactResult(
  artifactRequest(supportingRootIdentity, 'artifact-caption-v1-pass-0001'),
)).artifact
qaAdapter.configure(supportingRootV1.artifactId, 'pass')
await service.recordArtifactQa(
  qaRequest(
    supportingRootIdentity,
    supportingRootV1.artifactId,
    'qa-caption-v1-pass-0001',
  ),
)
await service.reconcileArtifact(
  reconcileRequest(
    supportingRootIdentity,
    supportingRootV1.artifactId,
    'reconcile-caption-v1-pass-0001',
  ),
)

const trimReady = await service.deriveJobDependencyReadiness(readinessRequest(trimJob.id))
assert.equal(trimReady.readinessGroup, 'ready_now_private_test_only')
assert.equal(trimReady.privateTestDependencySatisfied, true)
assert.equal(trimReady.liveRuntimeDependencySatisfied, false)
assert.equal(trimReady.finalRenderAuthorized, false)

artifactAdapter.configure({
  identity: trimIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
  placeholder: true,
})
await expectApiError(
  () => service.recordArtifactResult(
    artifactRequest(trimIdentity, 'artifact-final-placeholder-rejected-0001'),
  ),
  'RENDER_NOT_READY',
)

artifactAdapter.configure({
  identity: trimIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
})
const trimV1 = (await service.recordArtifactResult(
  artifactRequest(trimIdentity, 'artifact-trim-v1-pass-0001'),
)).artifact
assert.deepEqual(trimV1.lineage.segmentIds, ['segment-1'])
assert.deepEqual(trimV1.lineage.timingIds, ['master-timing-plan'])
assert.deepEqual(
  trimV1.lineage.rendererLayerIds,
  ['source-video-layer', 'caption-overlay-layer'],
)
qaAdapter.configure(trimV1.artifactId, 'pass')
await service.recordArtifactQa(qaRequest(trimIdentity, trimV1.artifactId, 'qa-trim-v1-pass-0001'))
await service.reconcileArtifact(
  reconcileRequest(trimIdentity, trimV1.artifactId, 'reconcile-trim-v1-pass-0001'),
)
const finalQaReady = await service.deriveJobDependencyReadiness(readinessRequest(finalQaJob.id))
assert.equal(finalQaReady.readinessGroup, 'ready_now_private_test_only')

// Completed downstream dependencies do not rewrite or globally stop a
// separate independent/root work item.
const independentRootStillReady = await service.deriveJobDependencyReadiness(
  readinessRequest(independentRootJob.id),
)
assert.equal(independentRootStillReady.readinessGroup, 'ready_now_private_test_only')
assert.equal(independentRootStillReady.dependencies.length, 0)

artifactAdapter.configure({
  identity: finalQaIdentity,
  artifactVersion: 1,
  attemptKind: 'initial',
})
const finalQaV1 = (await service.recordArtifactResult(
  artifactRequest(finalQaIdentity, 'artifact-final-qa-v1-pass-0001'),
)).artifact
qaAdapter.configure(finalQaV1.artifactId, 'pass')
await service.recordArtifactQa(
  qaRequest(finalQaIdentity, finalQaV1.artifactId, 'qa-final-qa-v1-pass-0001'),
)
await service.reconcileArtifact(
  reconcileRequest(finalQaIdentity, finalQaV1.artifactId, 'reconcile-final-qa-v1-pass-0001'),
)

const storeScope = { localStorageRoot, ownerUserId: userId, workspaceId }
const aggregateBeforeRestart = await readPrivateArtifactQaAggregate(storeScope)
assert.ok(aggregateBeforeRestart)
assert.equal(aggregateBeforeRestart.artifacts.length, 6)
assert.equal(new Set(aggregateBeforeRestart.artifacts
  .filter((artifact) => artifact.identity.expectedAssetId === rootAssetId)
  .map((artifact) => artifact.artifactVersion)).size, 3)
assert.equal(aggregateBeforeRestart.reconciliations
  .filter((record) => record.identity.expectedAssetId === rootAssetId &&
    record.decision === 'test_merged_not_live_authorized').length, 1)

clearPrivateArtifactQaAuthorityProcessStateForSmoke()
service = createPrivateArtifactQaAuthorityService(context, {
  producedArtifact: artifactAdapter,
  artifactQa: qaAdapter,
})
const adapterCallsBeforeDurableReplay = artifactAdapter.callCount
const durableReplay = await service.recordArtifactResult(initialRequest)
assert.equal(durableReplay.replayed, true)
assert.equal(durableReplay.artifact.artifactId, rootV1.artifactId)
assert.equal(artifactAdapter.callCount, adapterCallsBeforeDurableReplay)
const restartedRead = await service.readArtifactAuthority({
  ...rootIdentity,
  artifactId: rootV3.artifactId,
  purpose: 'read_private_artifact_qa_authority',
})
assert.equal(restartedRead.artifact.artifactId, rootV3.artifactId)
assert.equal(restartedRead.qaEvaluation?.outcome, 'passed')
assert.equal(restartedRead.reconciliation?.decision, 'test_merged_not_live_authorized')
assert.equal(restartedRead.liveRuntimeEligible, false)

await expectApiError(
  () => service.recordArtifactResult({
    ...artifactRequest(trimIdentity, 'artifact-root-v1-concurrent-0001'),
  }),
  'IDEMPOTENCY_CONFLICT',
)
await expectApiError(
  () => service.readArtifactAuthority({
    ...rootIdentity,
    artifactId: trimV1.artifactId,
    purpose: 'read_private_artifact_qa_authority',
  }),
  'JOB_DEPENDENCY_NOT_READY',
)

const otherUserContext: ServiceContext = {
  ...context,
  requestId: 'private-artifact-qa-other-user',
  auth: { userId: 'different-user', isMockUser: true },
}
await expectApiError(
  () => createPrivateArtifactQaAuthorityService(otherUserContext).deriveJobDependencyReadiness(
    readinessRequest(rootJob.id),
  ),
  'PROJECT_NOT_FOUND',
)

const canonicalAfter = await readPrivateEditAuthorityAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
assert.ok(canonicalAfter)
assert.equal(
  JSON.stringify(canonicalAfter.snapshots.find((candidate) => candidate.snapshotId === snapshot.snapshotId)),
  canonicalSnapshotBefore,
  'Produced-result/QA authority must never mutate the canonical approved snapshot.',
)

const aggregateRelativePath = privateArtifactQaAggregateRelativePath(userId, workspaceId)
const aggregateAbsolutePath = resolve(localStorageRoot, aggregateRelativePath)
const aggregateMode = (await stat(aggregateAbsolutePath)).mode & 0o777
assert.equal(aggregateMode, 0o600)
const originalAggregateContent = await readFile(aggregateAbsolutePath, 'utf8')
const tamperedAggregate = JSON.parse(originalAggregateContent) as { checksumSha256: string }
tamperedAggregate.checksumSha256 = '0'.repeat(64)
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: aggregateRelativePath,
  content: `${JSON.stringify(tamperedAggregate)}\n`,
})
await expectApiError(() => readPrivateArtifactQaAggregate(storeScope), 'VALIDATION_FAILED')
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: aggregateRelativePath,
  content: originalAggregateContent,
})

const rootBlobRelativePath = privateArtifactQaBlobRelativePath(rootV3.resultEvidenceRef.sha256)
const rootBlobAbsolutePath = resolve(localStorageRoot, rootBlobRelativePath)
const originalBlobContent = await readFile(rootBlobAbsolutePath, 'utf8')
const tamperedBlob = JSON.parse(originalBlobContent) as {
  value: { evidence: { content: { byteLength: number } } }
}
tamperedBlob.value.evidence.content.byteLength += 1
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: rootBlobRelativePath,
  content: `${JSON.stringify(tamperedBlob)}\n`,
})
await expectApiError(
  () => service.readArtifactAuthority({
    ...rootIdentity,
    artifactId: rootV3.artifactId,
    purpose: 'read_private_artifact_qa_authority',
  }),
  'VALIDATION_FAILED',
)
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: rootBlobRelativePath,
  content: originalBlobContent,
})

const outsideRelativePath = 'artifact-qa-authority/symlink-target.json'
const outsideAbsolutePath = resolve(localStorageRoot, outsideRelativePath)
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: outsideRelativePath,
  content: originalAggregateContent,
})
await rm(aggregateAbsolutePath)
await symlink(outsideAbsolutePath, aggregateAbsolutePath)
await expectApiError(() => readPrivateArtifactQaAggregate(storeScope), 'VALIDATION_FAILED')
await rm(aggregateAbsolutePath)
await writePrivateTextFileAtomicWithinRoot({
  rootPath: localStorageRoot,
  relativePath: aggregateRelativePath,
  content: originalAggregateContent,
})

const productionContext: ServiceContext = {
  ...context,
  env: loadRuntimeEnv({
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'cloud_run',
    WORKER_RUNTIME_MODE: 'disabled',
    STORAGE_MODE: 'gcs_disabled',
    API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: 'internal-placeholder',
  }),
}
await expectApiError(
  () => createPrivateArtifactQaAuthorityService(productionContext, {
    producedArtifact: artifactAdapter,
    artifactQa: qaAdapter,
  }).deriveJobDependencyReadiness(readinessRequest(rootJob.id)),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'identity_only_server_injected_artifact_and_qa_records',
    'canonical_tenant_snapshot_job_expected_output_lineage',
    'content_addressed_create_only_bounded_private_evidence',
    'exact_segment_timing_renderer_layer_lineage',
    'immutable_versions_and_single_private_test_selection',
    'duplicate_active_version_rejected',
    'final_placeholder_rejected',
    'qa_failure_fallback_and_user_review_recorded_without_execution',
    'dependency_readiness_and_local_failure_isolation',
    'actual_run_and_actual_qa_evidence_remain_placeholders',
    'canonical_snapshot_unmodified',
    'concurrent_and_restart_safe_idempotency_replay',
    'aggregate_and_blob_tamper_detection',
    'private_file_mode_and_symlink_refusal',
    'cross_user_job_and_output_scope_rejection',
    'production_fail_closed',
    'no_provider_tool_render_cost_wallet_route_or_ui_side_effects',
  ],
}))

function identity(jobId: string, expectedAssetId: string) {
  return {
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId,
    expectedAssetId,
  }
}

function artifactRequest(
  artifactIdentity: ArtifactIdentity,
  idempotencyKey: string,
) {
  return {
    ...artifactIdentity,
    idempotencyKey,
    purpose: 'record_server_verified_internal_artifact_result' as const,
  }
}

function qaRequest(
  artifactIdentity: ArtifactIdentity,
  artifactId: string,
  idempotencyKey: string,
) {
  return {
    ...artifactIdentity,
    artifactId,
    idempotencyKey,
    purpose: 'record_server_verified_internal_artifact_qa' as const,
  }
}

function reconcileRequest(
  artifactIdentity: ArtifactIdentity,
  artifactId: string,
  idempotencyKey: string,
) {
  return {
    ...artifactIdentity,
    artifactId,
    idempotencyKey,
    purpose: 'reconcile_server_verified_internal_artifact' as const,
  }
}

function readinessRequest(jobId: string) {
  return {
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId,
    purpose: 'derive_private_artifact_dependency_readiness' as const,
  }
}

function onlyExpectedAssetId(ids: string[]): string {
  assert.equal(ids.length, 1)
  const id = ids[0]
  assert.ok(id)
  return id
}

async function expectApiError(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError, String(error))
    assert.equal(error.code, code)
  }
}
