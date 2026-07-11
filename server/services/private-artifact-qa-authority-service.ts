import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  artifactQaAuthorityReadRequestSchema,
  internalArtifactQaEvidenceSchema,
  internalProducedArtifactEvidenceSchema,
  jobDependencyReadinessRequestSchema,
  privateArtifactDependencyReadinessSchema,
  reconcileInternalArtifactRequestSchema,
  recordInternalArtifactRequestSchema,
  recordInternalQaRequestSchema,
  type ArtifactQaAuthorityIdentity,
  type ArtifactQaAuthorityReadRequest,
  type CanonicalExpectedArtifactLineage,
  type InternalArtifactQaEvidence,
  type InternalProducedArtifactEvidence,
  type JobDependencyReadinessRequest,
  type PersistedArtifactQaEvaluation,
  type PersistedArtifactReconciliation,
  type PersistedArtifactResult,
  type PrivateArtifactDependencyReadiness,
  type PrivateArtifactQaAggregate,
  type ReconcileInternalArtifactRequest,
  type RecordInternalArtifactRequest,
  type RecordInternalQaRequest,
} from '../validation/private-artifact-qa-authority-schemas'
import {
  createCanonicalExecutionReadinessService,
} from './canonical-execution-readiness-service'
import type { CanonicalExecutionReadinessEnvelope } from '../validation/canonical-execution-readiness-schemas'
import {
  createPrivateArtifactQaEventId,
  findCurrentPrivateTestSelection,
  mutatePrivateArtifactQaAggregate,
  putPrivateArtifactQaEvidenceBlob,
  readPrivateArtifactQaAggregate,
  sha256ArtifactQaValue,
  stableArtifactQaStringify,
  verifyAllPrivateArtifactQaEvidenceBlobs,
  type PrivateArtifactQaStoreScope,
} from './private-artifact-qa-authority-store'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export interface ServerInjectedArtifactResultAdapter {
  readonly adapterKind: 'server_injected_internal_artifact_adapter'
  collectProducedArtifact(input: Readonly<{
    identity: ArtifactQaAuthorityIdentity
    lineage: CanonicalExpectedArtifactLineage
    privateTestDependencySatisfied: boolean
  }>): Promise<unknown>
}

export interface ServerInjectedArtifactQaAdapter {
  readonly adapterKind: 'server_injected_internal_qa_adapter'
  evaluateArtifact(input: Readonly<{
    identity: ArtifactQaAuthorityIdentity
    lineage: CanonicalExpectedArtifactLineage
    artifact: PersistedArtifactResult
  }>): Promise<unknown>
}

export interface PrivateArtifactQaAuthorityAdapters {
  producedArtifact?: ServerInjectedArtifactResultAdapter
  artifactQa?: ServerInjectedArtifactQaAdapter
}

export interface RecordedArtifactResult {
  artifact: PersistedArtifactResult
  replayed: boolean
  testOnly: true
  warnings: string[]
}

export interface RecordedArtifactQaResult {
  qaEvaluation: PersistedArtifactQaEvaluation
  replayed: boolean
  testOnly: true
  warnings: string[]
}

export interface ReconciledArtifactResult {
  reconciliation: PersistedArtifactReconciliation
  replayed: boolean
  testOnly: true
  warnings: string[]
}

/**
 * Private single-host artifact/result/QA authority.
 *
 * Mutation calls accept identity and idempotency only. Produced-result and QA
 * records are collected from server-injected adapters after canonical
 * snapshot/job/expected-output authority is reloaded. There is deliberately no
 * HTTP route and no provider, tool, render, wallet, or canonical-snapshot write.
 */
export function createPrivateArtifactQaAuthorityService(
  context: ServiceContext,
  adapters: PrivateArtifactQaAuthorityAdapters = {},
) {
  return {
    async recordArtifactResult(
      input: RecordInternalArtifactRequest,
    ): Promise<RecordedArtifactResult> {
      const request = parseRequest(
        recordInternalArtifactRequestSchema,
        input,
        'Private artifact-result identity is invalid.',
      )
      requirePrivateArtifactQaRuntime(context)
      const adapter = requireArtifactAdapter(adapters.producedArtifact)
      const scope = await resolveStoreScope(context, request.workspaceId)
      const now = new Date().toISOString()
      const requestHash = sha256ArtifactQaValue(request)

      return mutatePrivateArtifactQaAggregate({
        scope,
        now,
        mutation: async (aggregate) => {
          const replay = resolveIdempotencyReplay(
            aggregate,
            request.idempotencyKey,
            'record_artifact',
            requestHash,
          )
          if (replay) {
            const artifact = aggregate.artifacts.find((record) => record.artifactId === replay.responseId)
            if (!artifact) throw invalidAuthority('Artifact-result idempotency replay lineage is incomplete.')
            return { result: artifactResultResponse(artifact, true), changed: false }
          }

          const canonical = await loadCanonicalExpectedAsset(context, request)
          const dependencyReadiness = await deriveDependencyReadinessFromCanonical({
            context,
            request,
            aggregate,
            canonicalEnvelope: canonical.envelope,
          })
          if (!dependencyReadiness.privateTestDependencySatisfied) {
            throw new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'The affected canonical job still has unresolved required artifact/QA dependencies.',
              409,
              {
                readinessGroup: dependencyReadiness.readinessGroup,
                jobId: request.jobId,
              },
            )
          }

          const adapterOutput = await adapter.collectProducedArtifact(deepFreeze({
            identity: identityFrom(request),
            lineage: canonical.lineage,
            privateTestDependencySatisfied: true,
          }))
          const evidence = parseInternalProducedArtifactEvidence(adapterOutput)
          assertProducedArtifactMatchesCanonical(evidence, canonical.lineage, aggregate, request)

          const evidenceValue = {
            schemaVersion: 'private-artifact-result-evidence-envelope-v1',
            identity: identityFrom(request),
            lineage: canonical.lineage,
            evidence,
          }
          const resultEvidenceRef = await putPrivateArtifactQaEvidenceBlob({
            localStorageRoot: scope.localStorageRoot,
            value: evidenceValue,
          })
          const artifactId = `artifact_result_${sha256ArtifactQaValue({
            identity: identityFrom(request),
            artifactVersion: evidence.artifactVersion,
            contentSha256: evidence.content.sha256,
            storageIdentityHash: evidence.storageIdentity.opaqueObjectIdentityHash,
            resultEvidenceHash: resultEvidenceRef.sha256,
          }).slice(0, 40)}`
          if (aggregate.artifacts.some((record) => record.artifactId === artifactId)) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'The content-addressed artifact identity already exists under another request.',
              409,
            )
          }

          const artifact: PersistedArtifactResult = {
            artifactId,
            identity: identityFrom(request),
            lineage: canonical.lineage,
            artifactVersion: evidence.artifactVersion,
            attemptKind: evidence.attemptKind,
            ...(evidence.replacesArtifactId
              ? { replacesArtifactId: evidence.replacesArtifactId }
              : {}),
            content: { ...evidence.content },
            storageIdentity: { ...evidence.storageIdentity },
            placeholder: { ...evidence.placeholder },
            actualRunEvidence: {
              ...evidence.actualRunEvidence,
              toolIds: [...evidence.actualRunEvidence.toolIds],
            },
            resultEvidenceRef,
            resultEvidenceHash: resultEvidenceRef.sha256,
            evidenceClass: 'private_internal_test_attested',
            liveRuntimeEligible: false,
            createdAt: now,
          }
          aggregate.artifacts.push(artifact)
          aggregate.idempotencyRecords.push({
            operation: 'record_artifact',
            idempotencyKey: request.idempotencyKey,
            requestHash,
            responseId: artifact.artifactId,
            completedAt: now,
          })
          aggregate.auditEvents.push({
            eventId: createPrivateArtifactQaEventId('artifact_audit'),
            eventType: 'artifact_result_recorded',
            identity: artifact.identity,
            artifactId: artifact.artifactId,
            createdAt: now,
          })
          return { result: artifactResultResponse(artifact, false), changed: true }
        },
      })
    },

    async recordArtifactQa(
      input: RecordInternalQaRequest,
    ): Promise<RecordedArtifactQaResult> {
      const request = parseRequest(
        recordInternalQaRequestSchema,
        input,
        'Private artifact-QA identity is invalid.',
      )
      requirePrivateArtifactQaRuntime(context)
      const adapter = requireQaAdapter(adapters.artifactQa)
      const scope = await resolveStoreScope(context, request.workspaceId)
      const now = new Date().toISOString()
      const requestHash = sha256ArtifactQaValue(request)

      return mutatePrivateArtifactQaAggregate({
        scope,
        now,
        mutation: async (aggregate) => {
          const replay = resolveIdempotencyReplay(
            aggregate,
            request.idempotencyKey,
            'record_qa',
            requestHash,
          )
          if (replay) {
            const qaEvaluation = aggregate.qaEvaluations.find((record) =>
              record.qaEvaluationId === replay.responseId)
            if (!qaEvaluation) throw invalidAuthority('Artifact-QA idempotency replay lineage is incomplete.')
            return { result: qaResultResponse(qaEvaluation, true), changed: false }
          }

          const canonical = await loadCanonicalExpectedAsset(context, request)
          const artifact = requireArtifactRecord(aggregate, request)
          assertArtifactCanonicalLineage(artifact, canonical.lineage)
          if (aggregate.qaEvaluations.some((record) => record.artifactId === artifact.artifactId)) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'An immutable QA evaluation already exists for this artifact version.',
              409,
            )
          }

          const adapterOutput = await adapter.evaluateArtifact(deepFreeze({
            identity: identityFrom(request),
            lineage: canonical.lineage,
            artifact: structuredClone(artifact),
          }))
          const evidence = parseInternalQaEvidence(adapterOutput)
          const derived = deriveQaOutcome(evidence, canonical.lineage)
          const evidenceValue = {
            schemaVersion: 'private-artifact-qa-evidence-envelope-v1',
            identity: identityFrom(request),
            lineage: canonical.lineage,
            artifactId: artifact.artifactId,
            artifactContentSha256: artifact.content.sha256,
            evidence,
            derived,
          }
          const qaEvidenceRef = await putPrivateArtifactQaEvidenceBlob({
            localStorageRoot: scope.localStorageRoot,
            value: evidenceValue,
          })
          const qaEvaluationId = `artifact_qa_${sha256ArtifactQaValue({
            artifactId: artifact.artifactId,
            qaEvidenceHash: qaEvidenceRef.sha256,
          }).slice(0, 40)}`
          const qaEvaluation: PersistedArtifactQaEvaluation = {
            qaEvaluationId,
            artifactId: artifact.artifactId,
            identity: artifact.identity,
            qaVersion: 1,
            gateResults: evidence.gateResults.map((gate) => ({ ...gate })),
            outcome: derived.outcome,
            failureScope: derived.failureScope,
            recovery: { ...evidence.recovery },
            qaEvidenceRef,
            qaEvidenceHash: qaEvidenceRef.sha256,
            evidenceClass: 'private_internal_test_attested',
            liveRuntimeEligible: false,
            createdAt: now,
          }
          aggregate.qaEvaluations.push(qaEvaluation)
          aggregate.idempotencyRecords.push({
            operation: 'record_qa',
            idempotencyKey: request.idempotencyKey,
            requestHash,
            responseId: qaEvaluation.qaEvaluationId,
            completedAt: now,
          })
          aggregate.auditEvents.push({
            eventId: createPrivateArtifactQaEventId('artifact_audit'),
            eventType: 'artifact_qa_recorded',
            identity: artifact.identity,
            artifactId: artifact.artifactId,
            qaEvaluationId: qaEvaluation.qaEvaluationId,
            createdAt: now,
          })
          return { result: qaResultResponse(qaEvaluation, false), changed: true }
        },
      })
    },

    async reconcileArtifact(
      input: ReconcileInternalArtifactRequest,
    ): Promise<ReconciledArtifactResult> {
      const request = parseRequest(
        reconcileInternalArtifactRequestSchema,
        input,
        'Private artifact-reconciliation identity is invalid.',
      )
      requirePrivateArtifactQaRuntime(context)
      const scope = await resolveStoreScope(context, request.workspaceId)
      const now = new Date().toISOString()
      const requestHash = sha256ArtifactQaValue(request)

      return mutatePrivateArtifactQaAggregate({
        scope,
        now,
        mutation: async (aggregate) => {
          const replay = resolveIdempotencyReplay(
            aggregate,
            request.idempotencyKey,
            'reconcile_artifact',
            requestHash,
          )
          if (replay) {
            const reconciliation = aggregate.reconciliations.find((record) =>
              record.reconciliationId === replay.responseId)
            if (!reconciliation) {
              throw invalidAuthority('Artifact-reconciliation idempotency replay lineage is incomplete.')
            }
            return { result: reconciliationResponse(reconciliation, true), changed: false }
          }

          const canonical = await loadCanonicalExpectedAsset(context, request)
          const artifact = requireArtifactRecord(aggregate, request)
          assertArtifactCanonicalLineage(artifact, canonical.lineage)
          const qaEvaluation = aggregate.qaEvaluations.find((record) =>
            record.artifactId === artifact.artifactId)
          if (!qaEvaluation) {
            throw new ApiError(
              'JOB_DEPENDENCY_NOT_READY',
              'Artifact reconciliation requires immutable QA evidence first.',
              409,
              { requiredGate: 'artifact_qa_result' },
            )
          }
          if (aggregate.reconciliations.some((record) => record.artifactId === artifact.artifactId)) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'This immutable artifact version has already been reconciled.',
              409,
            )
          }

          const priorSelection = findCurrentPrivateTestSelection({
            aggregate,
            identity: artifact.identity,
          })
          const decision = deriveReconciliationDecision(artifact, qaEvaluation)
          const reconciliationWithoutId = {
            artifactId: artifact.artifactId,
            qaEvaluationId: qaEvaluation.qaEvaluationId,
            identity: artifact.identity,
            decision: decision.decision,
            ...(decision.decision === 'test_merged_not_live_authorized' && priorSelection
              ? { replacesSelectedArtifactId: priorSelection.artifact.artifactId }
              : {}),
            privateTestDependencySatisfied: decision.privateTestDependencySatisfied,
            liveRuntimeDependencySatisfied: false as const,
            finalRenderAuthorized: false as const,
            reasonCode: decision.reasonCode,
            createdAt: now,
          }
          const reconciliation: PersistedArtifactReconciliation = {
            reconciliationId: `artifact_reconcile_${sha256ArtifactQaValue(reconciliationWithoutId).slice(0, 40)}`,
            ...reconciliationWithoutId,
          }
          aggregate.reconciliations.push(reconciliation)
          aggregate.idempotencyRecords.push({
            operation: 'reconcile_artifact',
            idempotencyKey: request.idempotencyKey,
            requestHash,
            responseId: reconciliation.reconciliationId,
            completedAt: now,
          })
          aggregate.auditEvents.push({
            eventId: createPrivateArtifactQaEventId('artifact_audit'),
            eventType: 'artifact_reconciled',
            identity: artifact.identity,
            artifactId: artifact.artifactId,
            qaEvaluationId: qaEvaluation.qaEvaluationId,
            reconciliationId: reconciliation.reconciliationId,
            createdAt: now,
          })
          return { result: reconciliationResponse(reconciliation, false), changed: true }
        },
      })
    },

    async deriveJobDependencyReadiness(
      input: JobDependencyReadinessRequest,
    ): Promise<PrivateArtifactDependencyReadiness> {
      const request = parseRequest(
        jobDependencyReadinessRequestSchema,
        input,
        'Private dependency-readiness identity is invalid.',
      )
      requirePrivateArtifactQaRuntime(context)
      const scope = await resolveStoreScope(context, request.workspaceId)
      const canonical = await loadCanonicalJob(context, request)
      const aggregate = await readPrivateArtifactQaAggregate(scope) ?? emptyReadAggregate(scope)
      await verifyAllPrivateArtifactQaEvidenceBlobs({ scope, aggregate })
      return deriveDependencyReadinessFromCanonical({
        context,
        request,
        aggregate,
        canonicalEnvelope: canonical,
      })
    },

    async readArtifactAuthority(input: ArtifactQaAuthorityReadRequest): Promise<{
      artifact: PersistedArtifactResult
      qaEvaluation?: PersistedArtifactQaEvaluation
      reconciliation?: PersistedArtifactReconciliation
      liveRuntimeEligible: false
      testOnly: true
    }> {
      const request = parseRequest(
        artifactQaAuthorityReadRequestSchema,
        input,
        'Private artifact-authority read identity is invalid.',
      )
      requirePrivateArtifactQaRuntime(context)
      const scope = await resolveStoreScope(context, request.workspaceId)
      const canonical = await loadCanonicalExpectedAsset(context, request)
      const aggregate = await readPrivateArtifactQaAggregate(scope)
      if (!aggregate) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Artifact authority has no records.', 404)
      await verifyAllPrivateArtifactQaEvidenceBlobs({ scope, aggregate })
      const artifact = requireArtifactRecord(aggregate, request)
      assertArtifactCanonicalLineage(artifact, canonical.lineage)
      const qaEvaluation = aggregate.qaEvaluations.find((record) => record.artifactId === artifact.artifactId)
      const reconciliation = aggregate.reconciliations.find((record) => record.artifactId === artifact.artifactId)
      return {
        artifact,
        ...(qaEvaluation ? { qaEvaluation } : {}),
        ...(reconciliation ? { reconciliation } : {}),
        liveRuntimeEligible: false,
        testOnly: true,
      }
    },
  }
}

async function loadCanonicalExpectedAsset(
  context: ServiceContext,
  request: ArtifactQaAuthorityIdentity,
): Promise<{
  envelope: CanonicalExecutionReadinessEnvelope
  lineage: CanonicalExpectedArtifactLineage
}> {
  const envelope = await loadCanonicalJob(context, request)
  const expected = envelope.expectedAssets.find((asset) => asset.assetId === request.expectedAssetId)
  if (!expected) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Expected artifact does not belong to the requested canonical job.',
      409,
      { requiredGate: 'exact_expected_output_lineage' },
    )
  }
  return {
    envelope,
    lineage: {
      assetId: expected.assetId,
      outputKey: expected.outputKey,
      artifactType: expected.artifactType,
      assetRole: expected.assetRole,
      required: expected.required,
      previewPlaceholderAllowed: expected.previewPlaceholderAllowed,
      ...(expected.contentType ? { contentType: expected.contentType } : {}),
      segmentIds: [...expected.segmentIds],
      timingIds: [...expected.timingIds],
      rendererLayerIds: [...expected.rendererLayerIds],
      approvedWorkItemId: envelope.job.approvedWorkItemId,
      workItemKey: envelope.job.workItemKey,
      jobType: envelope.job.jobType,
      jobAuthorityHash: envelope.authorityHashes.jobAuthorityHash,
      snapshotHash: envelope.authorityHashes.snapshotHash,
      approvedAssetManifestHash: envelope.authorityHashes.approvedAssetManifestHash,
    },
  }
}

async function loadCanonicalJob(
  context: ServiceContext,
  request: Pick<JobDependencyReadinessRequest,
    'workspaceId' | 'projectId' | 'editSessionId' | 'snapshotId' | 'jobId'>,
): Promise<CanonicalExecutionReadinessEnvelope> {
  const result = await createCanonicalExecutionReadinessService(context).inspectJob({
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    jobId: request.jobId,
    purpose: 'private_internal_dry_run_readiness',
  })
  const envelope = result.executionReadinessEnvelope
  if (envelope.job.approvedPlanSnapshotId !== request.snapshotId) {
    throw new ApiError('JOB_NOT_FOUND', 'Canonical job does not belong to the requested snapshot.', 404)
  }
  return envelope
}

async function deriveDependencyReadinessFromCanonical(input: {
  context: ServiceContext
  request: Pick<JobDependencyReadinessRequest,
    'workspaceId' | 'projectId' | 'editSessionId' | 'snapshotId' | 'jobId'>
  aggregate: PrivateArtifactQaAggregate
  canonicalEnvelope: CanonicalExecutionReadinessEnvelope
}): Promise<PrivateArtifactDependencyReadiness> {
  const dependencies: PrivateArtifactDependencyReadiness['dependencies'] = []
  const blockingStates = new Set<string>()

  for (const dependency of input.canonicalEnvelope.dependencies) {
    const dependencyEnvelope = await loadCanonicalJob(input.context, {
      ...input.request,
      jobId: dependency.jobId,
    })
    const expectedAssets = dependencyEnvelope.expectedAssets.map((expected) => {
      const identity: ArtifactQaAuthorityIdentity = {
        workspaceId: input.request.workspaceId,
        projectId: input.request.projectId,
        editSessionId: input.request.editSessionId,
        snapshotId: input.request.snapshotId,
        jobId: dependency.jobId,
        expectedAssetId: expected.assetId,
      }
      const effectiveRequired = dependency.required && expected.required
      const selection = findCurrentPrivateTestSelection({ aggregate: input.aggregate, identity })
      if (selection) {
        return {
          expectedAssetId: expected.assetId,
          required: effectiveRequired,
          state: 'test_merged' as const,
          selectedArtifactId: selection.artifact.artifactId,
          privateTestSatisfied: true,
          liveRuntimeSatisfied: false as const,
        }
      }

      const artifacts = input.aggregate.artifacts
        .filter((artifact) => sameIdentity(artifact.identity, identity))
        .sort((left, right) => right.artifactVersion - left.artifactVersion)
      const latestArtifact = artifacts[0]
      const qa = latestArtifact
        ? input.aggregate.qaEvaluations.find((record) => record.artifactId === latestArtifact.artifactId)
        : undefined
      const reconciliation = latestArtifact
        ? input.aggregate.reconciliations.find((record) => record.artifactId === latestArtifact.artifactId)
        : undefined

      let state: PrivateArtifactDependencyReadiness['dependencies'][number]['expectedAssets'][number]['state']
      if (!effectiveRequired) {
        state = 'optional_isolated'
      } else if (!latestArtifact) {
        state = 'waiting_for_asset'
      } else if (!qa || !reconciliation) {
        state = 'waiting_for_qa'
      } else if (reconciliation.decision === 'fallback_requested') {
        state = 'fallback_requested'
      } else if (reconciliation.decision === 'user_review_required') {
        state = 'waiting_for_user_review'
      } else if (reconciliation.decision === 'preview_placeholder_only') {
        state = 'preview_placeholder_only'
      } else {
        state = 'qa_blocked'
      }
      if (effectiveRequired) blockingStates.add(state)
      return {
        expectedAssetId: expected.assetId,
        required: effectiveRequired,
        state,
        ...(latestArtifact ? { selectedArtifactId: latestArtifact.artifactId } : {}),
        privateTestSatisfied: !effectiveRequired,
        liveRuntimeSatisfied: false as const,
      }
    })
    dependencies.push({
      dependencyJobId: dependency.jobId,
      approvedWorkItemId: dependency.approvedWorkItemId,
      workItemKey: dependency.workItemKey,
      required: dependency.required,
      expectedAssets,
      privateTestSatisfied: expectedAssets.every((asset) => asset.privateTestSatisfied),
      liveRuntimeSatisfied: false,
    })
  }

  const privateTestDependencySatisfied = dependencies.every((dependency) =>
    dependency.privateTestSatisfied)
  const readinessGroup = resolveReadinessGroup(blockingStates, privateTestDependencySatisfied)
  const withoutHash = {
    schemaVersion: 'private-artifact-dependency-readiness-v1' as const,
    identity: {
      workspaceId: input.request.workspaceId,
      projectId: input.request.projectId,
      editSessionId: input.request.editSessionId,
      snapshotId: input.request.snapshotId,
      jobId: input.request.jobId,
    },
    dependencies,
    readinessGroup,
    privateTestDependencySatisfied,
    liveRuntimeDependencySatisfied: false as const,
    independentWorkCanContinue: true as const,
    canonicalSnapshotUnmodified: true as const,
    workerExecutionAuthorized: false as const,
    providerCallAuthorized: false as const,
    toolExecutionAuthorized: false as const,
    renderAuthorized: false as const,
    finalRenderAuthorized: false as const,
    blockers: [
      ...(privateTestDependencySatisfied
        ? []
        : ['Required artifact, QA, fallback, or user-review evidence is unresolved for this affected job.']),
      'Artifact and QA evidence is private-test attestation with actual-run and actual-QA placeholders.',
      'Tenant-bound worker lease, runtime tool evidence, cost settlement, render, and production persistence remain separate gates.',
    ],
  }
  const parsed = privateArtifactDependencyReadinessSchema.safeParse({
    ...withoutHash,
    readinessHash: sha256ArtifactQaValue(withoutHash),
  })
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Derived private artifact dependency readiness is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function assertProducedArtifactMatchesCanonical(
  evidence: InternalProducedArtifactEvidence,
  lineage: CanonicalExpectedArtifactLineage,
  aggregate: PrivateArtifactQaAggregate,
  request: ArtifactQaAuthorityIdentity,
): void {
  if (lineage.contentType && evidence.content.contentType !== lineage.contentType) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Produced artifact content type does not match the approved expected output.',
      409,
    )
  }
  if (evidence.placeholder.isPlaceholder) {
    if (lineage.assetRole === 'final') {
      throw new ApiError(
        'RENDER_NOT_READY',
        'A final artifact can never be recorded as a placeholder.',
        409,
      )
    }
    if (!lineage.previewPlaceholderAllowed) {
      throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'The approved expected output does not allow a preview placeholder.',
        409,
      )
    }
  }

  const existing = aggregate.artifacts
    .filter((artifact) => sameIdentity(artifact.identity, identityFrom(request)))
    .sort((left, right) => left.artifactVersion - right.artifactVersion)
  const latest = existing.at(-1)
  if (!latest) {
    if (evidence.artifactVersion !== 1 || evidence.replacesArtifactId !== undefined) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'The first produced artifact must be immutable version 1.',
        409,
      )
    }
    return
  }
  if (
    evidence.artifactVersion !== latest.artifactVersion + 1 ||
    evidence.replacesArtifactId !== latest.artifactId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'A replacement must be the next version and reference the exact preceding artifact candidate.',
      409,
      {
        expectedVersion: latest.artifactVersion + 1,
        expectedReplacesArtifactId: latest.artifactId,
      },
    )
  }
}

function deriveQaOutcome(
  evidence: InternalArtifactQaEvidence,
  lineage: CanonicalExpectedArtifactLineage,
): Pick<PersistedArtifactQaEvaluation, 'outcome' | 'failureScope'> {
  const statuses = new Set(evidence.gateResults.map((gate) => gate.status))
  const outcome: PersistedArtifactQaEvaluation['outcome'] = statuses.has('needs_user_review')
    ? 'needs_user_review'
    : statuses.has('fallback_required')
      ? 'fallback_required'
      : statuses.has('blocked')
        ? recoveryOutcome(evidence.recovery, 'blocked')
        : statuses.has('failed')
          ? recoveryOutcome(evidence.recovery, 'failed')
          : statuses.has('warning')
            ? 'warning'
            : 'passed'
  const scopeOrder = ['none', 'local_asset', 'local_segment', 'global_edit'] as const
  const failureScope = evidence.gateResults.reduce<PersistedArtifactQaEvaluation['failureScope']>(
    (current, gate) => scopeOrder.indexOf(gate.failureScope) > scopeOrder.indexOf(current)
      ? gate.failureScope
      : current,
    'none',
  )

  if (lineage.assetRole === 'final') {
    const ids = new Set(evidence.gateResults.map((gate) => gate.gateId))
    if (!ids.has('render_preflight_gate') || !ids.has('final_qa_gate')) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Final artifact QA must include render preflight and final QA gates.',
        409,
      )
    }
  }
  assertRecoveryConsistent(outcome, evidence.recovery, lineage.required)
  return { outcome, failureScope }
}

function recoveryOutcome(
  recovery: InternalArtifactQaEvidence['recovery'],
  defaultOutcome: 'failed' | 'blocked',
): PersistedArtifactQaEvaluation['outcome'] {
  if (recovery.state === 'needs_user_review' || recovery.state === 'needs_new_approval') {
    return 'needs_user_review'
  }
  if (recovery.state === 'fallback_available') return 'fallback_required'
  return defaultOutcome
}

function assertRecoveryConsistent(
  outcome: PersistedArtifactQaEvaluation['outcome'],
  recovery: InternalArtifactQaEvidence['recovery'],
  expectedOutputRequired: boolean,
): void {
  if (['passed', 'warning'].includes(outcome)) {
    if (recovery.state !== 'none' || recovery.action !== 'none') {
      throw new ApiError('VALIDATION_FAILED', 'Passing QA cannot carry a fallback or review decision.', 409)
    }
    return
  }
  if (outcome === 'needs_user_review') {
    if (
      !['needs_user_review', 'needs_new_approval'].includes(recovery.state) ||
      !['request_user_review', 'request_new_approval'].includes(recovery.action)
    ) {
      throw new ApiError('VALIDATION_FAILED', 'User-review QA requires a matching review decision.', 409)
    }
    return
  }
  if (outcome === 'fallback_required') {
    if (
      !['fallback_available', 'needs_new_approval'].includes(recovery.state) ||
      ['none', 'request_user_review', 'block_final_render'].includes(recovery.action)
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Fallback-required QA lacks a valid fallback decision.', 409)
    }
    if (!recovery.approvedWithinSnapshot && recovery.state !== 'needs_new_approval') {
      throw new ApiError('VALIDATION_FAILED', 'An unapproved fallback must request new approval.', 409)
    }
    if (expectedOutputRequired && recovery.action === 'remove_optional_asset') {
      throw new ApiError('VALIDATION_FAILED', 'A required expected artifact cannot use optional removal.', 409)
    }
    return
  }
  if (recovery.action === 'remove_optional_asset' && expectedOutputRequired) {
    throw new ApiError('VALIDATION_FAILED', 'A required expected artifact cannot be removed as optional.', 409)
  }
}

function deriveReconciliationDecision(
  artifact: PersistedArtifactResult,
  qa: PersistedArtifactQaEvaluation,
): Pick<PersistedArtifactReconciliation, 'decision' | 'privateTestDependencySatisfied' | 'reasonCode'> {
  if (artifact.placeholder.isPlaceholder) {
    if (artifact.lineage.assetRole === 'final' || !artifact.lineage.previewPlaceholderAllowed) {
      throw new ApiError('RENDER_NOT_READY', 'Placeholder artifact cannot enter final reconciliation.', 409)
    }
    return {
      decision: 'preview_placeholder_only',
      privateTestDependencySatisfied: false,
      reasonCode: 'preview_placeholder_never_final_dependency',
    }
  }
  if (['passed', 'warning'].includes(qa.outcome)) {
    return {
      decision: 'test_merged_not_live_authorized',
      privateTestDependencySatisfied: true,
      reasonCode: qa.outcome === 'passed'
        ? 'private_test_qa_passed'
        : 'private_test_qa_warning_nonblocking',
    }
  }
  if (qa.outcome === 'fallback_required') {
    return {
      decision: 'fallback_requested',
      privateTestDependencySatisfied: false,
      reasonCode: 'approved_fallback_not_executed',
    }
  }
  if (qa.outcome === 'needs_user_review') {
    return {
      decision: 'user_review_required',
      privateTestDependencySatisfied: false,
      reasonCode: 'user_or_new_approval_required',
    }
  }
  return {
    decision: 'blocked',
    privateTestDependencySatisfied: false,
    reasonCode: qa.failureScope === 'global_edit'
      ? 'global_qa_failure_blocks_affected_graph'
      : 'local_qa_failure_isolated_to_affected_output',
  }
}

function resolveReadinessGroup(
  blockingStates: Set<string>,
  satisfied: boolean,
): PrivateArtifactDependencyReadiness['readinessGroup'] {
  if (satisfied) return 'ready_now_private_test_only'
  if (blockingStates.has('waiting_for_user_review')) return 'waiting_for_user_review'
  if (blockingStates.has('fallback_requested')) return 'waiting_for_fallback'
  if (blockingStates.has('qa_blocked') || blockingStates.has('preview_placeholder_only')) {
    return 'blocked_by_qa_or_policy'
  }
  if (blockingStates.has('waiting_for_qa')) return 'waiting_for_qa'
  return 'waiting_for_asset'
}

function resolveIdempotencyReplay(
  aggregate: PrivateArtifactQaAggregate,
  idempotencyKey: string,
  operation: 'record_artifact' | 'record_qa' | 'reconcile_artifact',
  requestHash: string,
) {
  const existing = aggregate.idempotencyRecords.find((record) =>
    record.idempotencyKey === idempotencyKey)
  if (!existing) return undefined
  if (existing.operation !== operation || existing.requestHash !== requestHash) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Private artifact/QA idempotency key was reused for a different operation or identity.',
      409,
    )
  }
  return existing
}

function requireArtifactRecord(
  aggregate: PrivateArtifactQaAggregate,
  request: ArtifactQaAuthorityIdentity & { artifactId: string },
): PersistedArtifactResult {
  const artifact = aggregate.artifacts.find((record) => record.artifactId === request.artifactId)
  if (!artifact || !sameIdentity(artifact.identity, identityFrom(request))) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Produced artifact was not found under the exact tenant/snapshot/job/expected-output identity.',
      404,
    )
  }
  return artifact
}

function assertArtifactCanonicalLineage(
  artifact: PersistedArtifactResult,
  lineage: CanonicalExpectedArtifactLineage,
): void {
  if (stableArtifactQaStringify(artifact.lineage) !== stableArtifactQaStringify(lineage)) {
    throw invalidAuthority('Persisted artifact lineage no longer matches canonical approved authority.')
  }
}

function parseInternalProducedArtifactEvidence(value: unknown): InternalProducedArtifactEvidence {
  const parsed = internalProducedArtifactEvidenceSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Server-injected artifact adapter returned invalid bounded evidence.',
      409,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function parseInternalQaEvidence(value: unknown): InternalArtifactQaEvidence {
  const parsed = internalArtifactQaEvidenceSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Server-injected QA adapter returned invalid bounded evidence.',
      409,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function requireArtifactAdapter(
  adapter: ServerInjectedArtifactResultAdapter | undefined,
): ServerInjectedArtifactResultAdapter {
  if (!adapter || adapter.adapterKind !== 'server_injected_internal_artifact_adapter') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'No server-injected produced-artifact evidence adapter is configured.',
      503,
    )
  }
  return adapter
}

function requireQaAdapter(
  adapter: ServerInjectedArtifactQaAdapter | undefined,
): ServerInjectedArtifactQaAdapter {
  if (!adapter || adapter.adapterKind !== 'server_injected_internal_qa_adapter') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'No server-injected artifact-QA evidence adapter is configured.',
      503,
    )
  }
  return adapter
}

async function resolveStoreScope(
  context: ServiceContext,
  workspaceId: string,
): Promise<PrivateArtifactQaStoreScope> {
  const access = await authorizeWorkspaceAccess(context, workspaceId, 'write')
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: access.userId,
    workspaceId: access.workspaceId,
  }
}

function requirePrivateArtifactQaRuntime(context: ServiceContext): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Private artifact/result/QA authority is blocked outside explicit local internal testing.',
    503,
    {
      requiredGates: [
        'canonical_production_persistence',
        'service_identity_and_tenant_bound_worker_lease',
        'actual_run_and_actual_qa_evidence',
        'private_generation_bound_object_storage',
      ],
    },
  )
}

function parseRequest<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } },
  input: unknown,
  message: string,
): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  }
  return parsed.data
}

function identityFrom(input: ArtifactQaAuthorityIdentity): ArtifactQaAuthorityIdentity {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    snapshotId: input.snapshotId,
    jobId: input.jobId,
    expectedAssetId: input.expectedAssetId,
  }
}

function sameIdentity(
  left: ArtifactQaAuthorityIdentity,
  right: ArtifactQaAuthorityIdentity,
): boolean {
  return stableArtifactQaStringify(left) === stableArtifactQaStringify(right)
}

function artifactResultResponse(
  artifact: PersistedArtifactResult,
  replayed: boolean,
): RecordedArtifactResult {
  return {
    artifact,
    replayed,
    testOnly: true,
    warnings: [
      'Artifact evidence is a private internal-test attestation; actual-run evidence remains a non-authorizing placeholder.',
      'No provider, tool, render, credit, delivery, or canonical-snapshot mutation occurred.',
    ],
  }
}

function qaResultResponse(
  qaEvaluation: PersistedArtifactQaEvaluation,
  replayed: boolean,
): RecordedArtifactQaResult {
  return {
    qaEvaluation,
    replayed,
    testOnly: true,
    warnings: [
      'QA evidence is a private internal-test attestation; actual media QA remains a non-authorizing placeholder.',
      'Fallback and user-review decisions are recorded but never executed by this authority.',
    ],
  }
}

function reconciliationResponse(
  reconciliation: PersistedArtifactReconciliation,
  replayed: boolean,
): ReconciledArtifactResult {
  return {
    reconciliation,
    replayed,
    testOnly: true,
    warnings: [
      'Private-test reconciliation does not authorize live worker execution or final rendering.',
      'Canonical approved snapshots remain immutable.',
    ],
  }
}

function emptyReadAggregate(scope: PrivateArtifactQaStoreScope): PrivateArtifactQaAggregate {
  const now = new Date().toISOString()
  return {
    schemaVersion: 'private-artifact-qa-authority-aggregate-v1',
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    revision: 0,
    artifacts: [],
    qaEvaluations: [],
    reconciliations: [],
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

function invalidAuthority(message: string): ApiError {
  return new ApiError('APPROVED_SNAPSHOT_REQUIRED', message, 409)
}
