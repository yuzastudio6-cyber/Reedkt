import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import { validateOfflineRemotionFinalCompositionPlanningPayload } from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  assembleCanonicalPrivateReviewSchema,
  canonicalPrivateReviewAssemblyResponseSchema,
  type AssembleCanonicalPrivateReviewBody,
  type CanonicalPrivateReviewAssemblyResponse,
} from '../validation/canonical-private-review-assembly-schemas'
import type {
  PersistedArtifactQaEvaluation,
  PersistedArtifactReconciliation,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import {
  normalizeCanonicalPrivateFinalMediaQa,
} from './canonical-private-final-media-qa'
import { verifyCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-verifier'
import { readCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-storage'
import { verifyCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-verifier'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { readPrivateArtifactQaAggregate } from './private-artifact-qa-authority-store'
import { readPrivateCanonicalWorkerLeaseAggregate } from './private-canonical-worker-lease-store'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const STORAGE_PREFIX = 'private-internal/canonical-private-review-assemblies/v1'
const assemblyLocks = new Map<string, Promise<void>>()

export interface AssembleCanonicalPrivateReviewInput extends AssembleCanonicalPrivateReviewBody {
  packageRecordId: string
  idempotencyKey: string
}

interface PersistedAssemblyResponse {
  schemaVersion: 'canonical-private-review-assembly-idempotency-v1'
  requestHash: string
  response: CanonicalPrivateReviewAssemblyResponse
}

interface SelectedArtifactAuthority {
  artifact: PersistedArtifactResult
  qa: PersistedArtifactQaEvaluation
  reconciliation: PersistedArtifactReconciliation
}

export function createCanonicalPrivateReviewAssemblyService(context: ServiceContext) {
  return {
    async getCompleted(input: {
      packageRecordId: string
      workspaceId: string
    }): Promise<CanonicalPrivateReviewAssemblyResponse> {
      if (!safeIdentity(input.packageRecordId) || !safeIdentity(input.workspaceId)) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical private-review identity validation failed.', 400)
      }
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (access.userId !== actorUserId) throw blocked('Private-review actor is outside this workspace.')
      const requestHash = sha256AuthorityValue({
        operation: 'assemble_canonical_private_review',
        actorUserId,
        workspaceId: access.workspaceId,
        packageRecordId: input.packageRecordId,
        purpose: 'assemble_canonical_private_review',
      })
      const scopeHash = sha256(`${actorUserId}\u0000${access.workspaceId}`).slice(0, 32)
      const packageHash = sha256(`${scopeHash}\u0000${input.packageRecordId}`)
      const completionPath = `${STORAGE_PREFIX}/${scopeHash}/packages/${packageHash}.json`
      const manifestPath = `${STORAGE_PREFIX}/${scopeHash}/manifests/${packageHash}.json`
      const completed = await readPersistedAssembly(context, completionPath, requestHash)
      if (!completed) {
        throw blocked('Canonical private-review assembly has not completed for this execution package.')
      }
      await verifyPersistedManifest(context, manifestPath, completed)
      return completed
    },

    async assemble(input: AssembleCanonicalPrivateReviewInput): Promise<CanonicalPrivateReviewAssemblyResponse> {
      const { packageRecordId, idempotencyKey: rawIdempotencyKey, ...requestBody } = input
      const parsed = assembleCanonicalPrivateReviewSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(packageRecordId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private-review assembly request validation failed.',
          400,
          parsed.success ? { packageRecordId: ['Invalid execution-package identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) throw blocked('Private-review actor is outside this workspace.')
      const requestHash = sha256AuthorityValue({
        operation: 'assemble_canonical_private_review',
        actorUserId,
        workspaceId: access.workspaceId,
        packageRecordId,
        purpose: body.purpose,
      })
      const scopeHash = sha256(`${actorUserId}\u0000${access.workspaceId}`).slice(0, 32)
      const keyHash = sha256(`${scopeHash}\u0000${idempotencyKey}`)
      const packageHash = sha256(`${scopeHash}\u0000${packageRecordId}`)
      const responsePath = `${STORAGE_PREFIX}/${scopeHash}/requests/${keyHash}.json`
      const completionPath = `${STORAGE_PREFIX}/${scopeHash}/packages/${packageHash}.json`
      const manifestPath = `${STORAGE_PREFIX}/${scopeHash}/manifests/${packageHash}.json`

      return withAssemblyLock(responsePath, async () => {
        const requestReplay = await readPersistedAssembly(context, responsePath, requestHash)
        if (requestReplay) {
          await verifyPersistedManifest(context, manifestPath, requestReplay)
          return markReplay(requestReplay)
        }
        return withAssemblyLock(completionPath, async () => {
          const completionReplay = await readPersistedAssembly(context, completionPath, requestHash)
          if (completionReplay) {
            await verifyPersistedManifest(context, manifestPath, completionReplay)
            await persistAssembly(context, responsePath, requestHash, completionReplay)
            return markReplay(completionReplay)
          }

          const packageResult = await createCanonicalEditExecutionPackageService(context).getPackage(
            packageRecordId,
            access.workspaceId,
          )
          const executionPackage = packageResult.approvedEditExecutionPackage
          if (
            executionPackage.packageRecordId !== packageRecordId ||
            executionPackage.workspaceId !== access.workspaceId ||
            executionPackage.jobs.length < 1 || executionPackage.jobs.length > 256
          ) throw blocked('Canonical execution package is not eligible for private-review assembly.')
          const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
            executionPackage.approvedPlanSnapshotId,
            access.workspaceId,
          )
          const artifactAggregate = await readPrivateArtifactQaAggregate({
            localStorageRoot: context.env.localStorageRoot,
            ownerUserId: actorUserId,
            workspaceId: access.workspaceId,
          })
          const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
            localStorageRoot: context.env.localStorageRoot,
            ownerUserId: actorUserId,
            workspaceId: access.workspaceId,
          })
          if (!artifactAggregate || !leaseAggregate) {
            throw blocked('Private artifact/QA or worker-lease authority is unavailable.')
          }

          const jobsByWorkItemId = new Map(executionPackage.jobs.map((job) => [job.approvedWorkItemId, job]))
          const requiredWorkItems = authority.workItems.filter((workItem) => workItem.required)
          const requiredSelections: SelectedArtifactAuthority[] = []
          for (const workItem of requiredWorkItems) {
            const job = jobsByWorkItemId.get(workItem.id)
            const expectedAssets = authority.assetManifest.entries.filter((entry) =>
              entry.approvedWorkItemId === workItem.id && entry.required)
            if (!job || expectedAssets.length < 1) {
              throw blocked('Every required work item must have one canonical job and required expected output.')
            }
            for (const expectedAsset of expectedAssets) {
              requiredSelections.push(selectArtifactAuthority({
                aggregate: artifactAggregate,
                snapshotId: authority.snapshot.snapshotId,
                jobId: job.id,
                expectedAssetId: expectedAsset.id,
              }))
            }
          }

          const finalWorkItems = requiredWorkItems.filter((workItem) =>
            workItem.workItemType === 'render_final_export')
          const finalQaWorkItems = requiredWorkItems.filter((workItem) =>
            workItem.workItemType === 'run_final_qa')
          if (finalWorkItems.length !== 1 || finalQaWorkItems.length !== 1) {
            throw blocked('Private-review assembly requires exactly one final export and one final-QA work item.')
          }
          const finalWorkItem = finalWorkItems[0]!
          const finalQaWorkItem = finalQaWorkItems[0]!
          const finalJob = jobsByWorkItemId.get(finalWorkItem.id)!
          const finalQaJob = jobsByWorkItemId.get(finalQaWorkItem.id)!
          if (
            finalWorkItem.approvedToolIds.length !== 1 || finalWorkItem.approvedToolIds[0] !== 'remotion' ||
            finalQaWorkItem.approvedToolIds.length !== 1 || finalQaWorkItem.approvedToolIds[0] !== 'ffprobe' ||
            finalQaJob.dependencyJobIds.length !== 1 || finalQaJob.dependencyJobIds[0] !== finalJob.id
          ) throw blocked('Final artifact and final-QA dependency lineage is not exact.')
          const finalExpected = authority.assetManifest.entries.filter((entry) =>
            entry.approvedWorkItemId === finalWorkItem.id && entry.required &&
            entry.assetRole === 'final' && entry.contentType === 'video/mp4')
          const finalQaExpected = authority.assetManifest.entries.filter((entry) =>
            entry.approvedWorkItemId === finalQaWorkItem.id && entry.required &&
            entry.assetRole === 'qa' && entry.contentType === 'application/json')
          if (finalExpected.length !== 1 || finalQaExpected.length !== 1) {
            throw blocked('Final artifact or final-QA expected-output authority is ambiguous.')
          }
          const finalSelection = selectArtifactAuthority({
            aggregate: artifactAggregate,
            snapshotId: authority.snapshot.snapshotId,
            jobId: finalJob.id,
            expectedAssetId: finalExpected[0]!.id,
          })
          const finalQaSelection = selectArtifactAuthority({
            aggregate: artifactAggregate,
            snapshotId: authority.snapshot.snapshotId,
            jobId: finalQaJob.id,
            expectedAssetId: finalQaExpected[0]!.id,
          })
          const verifiedFinal = await verifyCanonicalPrivateRemotionArtifact({
            localStorageRoot: context.env.localStorageRoot,
            artifact: finalSelection.artifact,
          })
          const verifiedFinalQa = await verifyCanonicalStructuredJsonArtifact({
            localStorageRoot: context.env.localStorageRoot,
            artifact: finalQaSelection.artifact,
          })
          const storedFinalQa = await readCanonicalStructuredJsonArtifact({
            localStorageRoot: context.env.localStorageRoot,
            privateObjectIdentityHash: verifiedFinalQa.privateObjectIdentityHash,
          })
          if (!storedFinalQa) throw blocked('Private final-QA report bytes are unavailable.')
          const finalExpectation = validateOfflineRemotionFinalCompositionPlanningPayload(
            finalWorkItem.executionInput.structuredPayload,
          )
          const normalizedFinalQa = normalizeCanonicalPrivateFinalMediaQa(
            storedFinalQa.document,
            finalExpectation,
          )

          const finalLease = leaseAggregate.leases.find((lease) =>
            lease.jobId === finalJob.id && lease.executionFence.state === 'completed' &&
            lease.executionFence.executionAttemptId === verifiedFinal.executionAttemptId)
          const finalQaLease = leaseAggregate.leases.find((lease) =>
            lease.jobId === finalQaJob.id && lease.executionFence.state === 'completed' &&
            lease.executionFence.executionAttemptId === finalQaSelection.artifact.actualRunEvidence.executionAttemptId &&
            lease.executionFence.runnerClass === 'offline_media_binary_execution_v1')
          const dependencySelection = finalQaLease?.dependencyAuthority.selectedArtifacts
          if (
            !finalLease || !finalQaLease || finalQaLease.dependencyAuthority.state !== 'private_test_dependencies_verified' ||
            finalQaLease.dependencyAuthority.liveRuntimeEligible !== false || dependencySelection?.length !== 1 ||
            dependencySelection[0]?.dependencyJobId !== finalJob.id ||
            dependencySelection[0]?.expectedAssetId !== finalExpected[0]!.id ||
            dependencySelection[0]?.artifactId !== finalSelection.artifact.artifactId ||
            dependencySelection[0]?.contentSha256 !== finalSelection.artifact.content.sha256 ||
            dependencySelection[0]?.sourceLeaseImmutableHash !== finalLease.immutableLeaseHash
          ) throw blocked('Final-QA execution was not bound to the exact reconciled final artifact.')

          const assembledAt = new Date().toISOString()
          const reviewAssemblyId = `private_review_${packageHash.slice(0, 48)}`
          const finalArtifact = responseArtifact(finalJob.id, finalWorkItem.id, finalSelection)
          const finalQaArtifact = responseArtifact(finalQaJob.id, finalQaWorkItem.id, finalQaSelection)
          const chain = {
            finalQaLeaseId: finalQaLease.id,
            finalQaExecutionAttemptId: finalQaSelection.artifact.actualRunEvidence.executionAttemptId,
            finalQaDependencyAuthorityHash: finalQaLease.dependencyAuthority.authorityHash,
            finalQaInputBoundToFinalArtifact: true as const,
            immutablePackageRevalidated: true as const,
            immutablePlanRevalidated: true as const,
            artifactStoreChecksumVerified: true as const,
            leaseStoreChecksumVerified: true as const,
          }
          const manifestWithoutHash = {
            schemaVersion: 'canonical-private-review-manifest-v1' as const,
            manifestId: reviewAssemblyId,
            identity: {
              workspaceId: access.workspaceId,
              projectId: executionPackage.projectId,
              editSessionId: executionPackage.editSessionId,
              packageRecordId,
              approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
            },
            requiredJobCount: requiredWorkItems.length,
            requiredExpectedAssetCount: requiredSelections.length,
            finalArtifact,
            finalQaArtifact,
            finalQaReportSha256: normalizedFinalQa.reportSha256,
            chain,
            assembledAt,
            privateInternalOnly: true as const,
            publicDeliveryAuthorized: false as const,
          }
          const manifestSha256 = sha256AuthorityValue(manifestWithoutHash)
          await writePrivateFileCreateOnlyWithinRoot({
            rootPath: context.env.localStorageRoot,
            relativePath: manifestPath,
            content: Buffer.from(`${stableAuthorityStringify({
              ...manifestWithoutHash,
              manifestSha256,
            })}\n`, 'utf8'),
          })
          const responseWithoutHash = {
            schemaVersion: 'canonical-private-review-assembly-response-v1' as const,
            source: 'canonical_private_review_assembly_service' as const,
            purpose: body.purpose,
            identity: {
              ...manifestWithoutHash.identity,
              reviewAssemblyId,
            },
            status: 'ready_for_private_internal_review' as const,
            requiredExecution: {
              requiredJobCount: requiredWorkItems.length,
              requiredExpectedAssetCount: requiredSelections.length,
              passedQaArtifactCount: requiredSelections.length,
              reconciledArtifactCount: requiredSelections.length,
              allRequiredJobsCompleted: true as const,
              allRequiredAssetsQaPassed: true as const,
              allRequiredAssetsReconciled: true as const,
            },
            finalArtifact: {
              ...finalArtifact,
              contentType: 'video/mp4' as const,
              privateDownloadAvailable: true as const,
              publicUrlCreated: false as const,
              signedUrlCreated: false as const,
            },
            finalQaArtifact: {
              ...finalQaArtifact,
              contentType: 'application/json' as const,
              canonicalToolId: 'ffprobe' as const,
              finalQaGatesPassed: true as const,
              finalQaReportSha256: normalizedFinalQa.reportSha256,
            },
            chain,
            manifest: {
              schemaVersion: 'canonical-private-review-manifest-v1' as const,
              manifestId: reviewAssemblyId,
              manifestSha256,
              privateCreateOnlyPersistence: true as const,
              credentialFree: true as const,
            },
            replay: { idempotentReplay: false, sameManifestOnly: true as const },
            readiness: {
              privateReviewReady: true as const,
              publicExportReady: false as const,
              productReady: false as const,
              externalBetaReady: false as const,
              productionReady: false as const,
              nextRequiredGate: 'canonical_private_review_user_decision_or_revision' as const,
            },
            permissions: deniedPermissions(),
            assembledAt,
            testOnly: true as const,
          }
          const response = canonicalPrivateReviewAssemblyResponseSchema.parse({
            ...responseWithoutHash,
            responseHash: sha256AuthorityValue(responseWithoutHash),
          })
          await persistAssembly(context, completionPath, requestHash, response)
          await persistAssembly(context, responsePath, requestHash, response)
          return response
        })
      })
    },
  }
}

function selectArtifactAuthority(input: {
  aggregate: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>
  snapshotId: string
  jobId: string
  expectedAssetId: string
}): SelectedArtifactAuthority {
  const candidates = input.aggregate.artifacts.filter((artifact) =>
    artifact.identity.snapshotId === input.snapshotId && artifact.identity.jobId === input.jobId &&
    artifact.identity.expectedAssetId === input.expectedAssetId)
  const selected = candidates.map((artifact) => {
    const qa = input.aggregate.qaEvaluations.find((candidate) =>
      candidate.artifactId === artifact.artifactId && candidate.outcome === 'passed')
    const reconciliation = qa && input.aggregate.reconciliations.find((candidate) =>
      candidate.artifactId === artifact.artifactId && candidate.qaEvaluationId === qa.qaEvaluationId &&
      candidate.decision === 'test_merged_not_live_authorized' &&
      candidate.privateTestDependencySatisfied === true &&
      candidate.liveRuntimeDependencySatisfied === false && candidate.finalRenderAuthorized === false)
    return qa && reconciliation ? { artifact, qa, reconciliation } : undefined
  }).filter((value): value is SelectedArtifactAuthority => Boolean(value))
  if (selected.length !== 1) {
    throw blocked('Required private artifact selection is missing or ambiguous for terminal review.')
  }
  return selected[0]!
}

function responseArtifact(
  jobId: string,
  approvedWorkItemId: string,
  selection: SelectedArtifactAuthority,
) {
  return {
    jobId,
    approvedWorkItemId,
    expectedAssetId: selection.artifact.identity.expectedAssetId,
    artifactId: selection.artifact.artifactId,
    artifactVersion: selection.artifact.artifactVersion,
    qaEvaluationId: selection.qa.qaEvaluationId,
    reconciliationId: selection.reconciliation.reconciliationId,
    contentType: selection.artifact.content.contentType,
    sha256: selection.artifact.content.sha256,
    byteLength: selection.artifact.content.byteLength,
    privateObjectIdentityHash: selection.artifact.storageIdentity.opaqueObjectIdentityHash,
  }
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    furtherRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

async function readPersistedAssembly(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateReviewAssemblyResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    throw blocked('Persisted private-review assembly is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw blocked('Persisted private-review assembly has an invalid shape.')
  }
  const record = parsed as Partial<PersistedAssemblyResponse>
  if (
    record.schemaVersion !== 'canonical-private-review-assembly-idempotency-v1' ||
    record.requestHash !== requestHash
  ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'Private-review assembly request identity changed.', 409)
  const response = canonicalPrivateReviewAssemblyResponseSchema.safeParse(record.response)
  if (!response.success) throw blocked('Persisted private-review assembly failed validation.')
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw blocked('Persisted private-review response checksum is invalid.')
  }
  return response.data
}

async function persistAssembly(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  response: CanonicalPrivateReviewAssemblyResponse,
): Promise<void> {
  const record: PersistedAssemblyResponse = {
    schemaVersion: 'canonical-private-review-assembly-idempotency-v1',
    requestHash,
    response,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
    content: Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8'),
  })
}

async function verifyPersistedManifest(
  context: ServiceContext,
  relativePath: string,
  response: CanonicalPrivateReviewAssemblyResponse,
): Promise<void> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) throw blocked('Private-review manifest is missing during replay.')
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    throw blocked('Private-review manifest is not valid JSON during replay.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw blocked('Private-review manifest has an invalid shape during replay.')
  }
  const record = parsed as Record<string, unknown>
  const { manifestSha256, ...withoutHash } = record
  if (
    manifestSha256 !== response.manifest.manifestSha256 ||
    record.manifestId !== response.manifest.manifestId ||
    manifestSha256 !== sha256AuthorityValue(withoutHash)
  ) throw blocked('Private-review manifest integrity failed during replay.')
}

function markReplay(response: CanonicalPrivateReviewAssemblyResponse): CanonicalPrivateReviewAssemblyResponse {
  const { responseHash, ...withoutHash } = response
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw blocked('Private-review replay response checksum is invalid.')
  }
  const replayWithoutHash = {
    ...withoutHash,
    replay: { idempotentReplay: true, sameManifestOnly: true as const },
  }
  return canonicalPrivateReviewAssemblyResponseSchema.parse({
    ...replayWithoutHash,
    responseHash: sha256AuthorityValue(replayWithoutHash),
  })
}

async function withAssemblyLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = assemblyLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const tail = previous.catch(() => undefined).then(() => current)
  assemblyLocks.set(key, tail)
  await previous.catch(() => undefined)
  try { return await operation() } finally {
    release()
    if (assemblyLocks.get(key) === tail) assemblyLocks.delete(key)
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (
    !normalized || normalized.length < 8 || normalized.length > 240 ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.', 400)
  }
  return normalized
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function blocked(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_terminal_private_review_assembly',
  })
}
