import { createHash } from 'node:crypto'

import {
  assertCanonicalDistributedPrePlanStudyReadProjectionPort,
  canonicalDistributedPrePlanStudyReadRequestSchema,
  type CanonicalDistributedPrePlanStudyReadProjection,
  type CanonicalDistributedPrePlanStudyReadProjectionPort,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-read-projection'
import {
  assertCanonicalDistributedPrePlanStudyStatePort,
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyDomainWorkResultHash,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyIdentityHash,
  canonicalDistributedPrePlanStudyRequestHash,
  canonicalDistributedPrePlanStudySeedHash,
  canonicalDistributedPrePlanStudyWorkItemHash,
  type CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  type CanonicalDistributedPrePlanStudyAttemptView,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudySeed,
  type CanonicalDistributedPrePlanStudyTransactionAdapter,
  type CanonicalDistributedPrePlanStudyWorkItemSeed,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
  sealEditReferenceLongFormStudyRun,
  validateRunAgainstPlan,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
  type EditReferenceLongFormStudyStageId,
  type EditReferenceLongFormStudyWorkItem,
} from '../edit-references/edit-reference-long-form-study-contract'
import {
  createEditReferenceLongFormStudyControlCommandReceipt,
} from '../edit-references/private-edit-reference-long-form-study-repository'
import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from './private-edit-authority-store'
import {
  EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION,
  type EditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudySourceBinding,
} from './edit-reference-production-long-form-runtime-port'

const LOCAL_PER_ATTEMPT_INTERNAL_COST_CEILING_MICROS = 1_000_000n
const LOCAL_CONTROLLER_ID = 'canonical-v3-local-pre-plan-controller-v1'
const LOCAL_PREFLIGHT_WORKER_ID = 'canonical-v3-local-preflight-worker-v1'

interface CompiledStudyAuthority {
  readonly seed: CanonicalDistributedPrePlanStudySeed
  readonly controllerIdentityEvidenceHash: string
}

export function createEditReferenceCanonicalV3LocalLongFormRuntimePort(input: {
  readonly statePort: CanonicalDistributedPrePlanStudyTransactionAdapter
  readonly readProjectionPort: CanonicalDistributedPrePlanStudyReadProjectionPort
}): EditReferenceLongFormStudyRuntimePort {
  assertCanonicalDistributedPrePlanStudyStatePort(input.statePort)
  assertCanonicalDistributedPrePlanStudyReadProjectionPort(input.readProjectionPort)
  if (
    input.statePort.descriptor.databaseBackend !== 'postgres'
    || input.statePort.descriptor.liveSupabaseOrPostgresCallPerformed !== true
    || input.statePort.descriptor.productionAuthority !== false
    || input.readProjectionPort.productionAuthority !== false
  ) {
    throw blocked('canonical_v3_local_postgres_state_authority_invalid')
  }

  const port: EditReferenceLongFormStudyRuntimePort = {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION,
    persistenceContractVersion: 'edit-reference-production-persistence-contract-v6',
    authorityClass: 'pre_plan_edit_reference_long_form_study',
    sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
    evidenceClass: 'canonical_contract_fixture_unreleased',
    productionAuthority: false,
    approvedEditAuthorityFabricated: false,
    approvedEditPlanSnapshotRequired: false,
    approvedEditCreditReservationRequired: false,
    browserClaimAllowed: false,
    browserSessionRequiredForCompletion: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    canonicalWorkerSpineRequired: true,
    createsSecondProductionQueueOrRepository: false,
    databaseTransactionAdapterVerified: true,
    multiReplicaLeaseRecoveryVerified: false,
    authenticatedWorkerDispatchVerified: false,
    livePrivateObjectReadVerified: false,

    async create(createInput) {
      validateRunAgainstPlan(createInput.run, createInput.plan)
      assertScope(createInput.scope, createInput.plan)
      const sourceBinding = requireRegisteredSourceBinding(
        createInput.sourceBinding,
        createInput.plan,
      )
      const authority = compileStudyAuthority({
        ownerUserId: createInput.scope.ownerUserId,
        plan: createInput.plan,
        run: createInput.run,
        sourceBinding,
      })
      const enqueueRequest = canonicalDistributedPrePlanStudyEnqueueRequestSchema.parse(
        withRequestHash('enqueue', {
          runId: authority.seed.runId,
          studyIdentityHash: authority.seed.identity.identityHash,
          idempotencyKey: operationKey('enqueue', authority.seed.runId),
          seed: authority.seed,
          controllerIdentityEvidenceHash: authority.controllerIdentityEvidenceHash,
          requestedAt: authority.seed.planCreatedAt,
        }),
      )
      const enqueued = await input.statePort.enqueue(enqueueRequest)
      const beforePreflightProjection = await readPersistedProjection({
        readProjectionPort: input.readProjectionPort,
        scope: createInput.scope,
        runId: createInput.run.runId,
      })
      if (!beforePreflightProjection) {
        throw blocked('canonical_v3_local_enqueue_readback_missing')
      }
      const beforePreflight = projectLongFormStudy(beforePreflightProjection)
      await reconcilePreparedPreflight({
        statePort: input.statePort,
        authority,
        preparedRun: createInput.run,
        persistedRun: beforePreflight.run,
        persistedRunCreatedAt: beforePreflightProjection.run.createdAt,
      })
      const persisted = await readPersistedStudy({
        readProjectionPort: input.readProjectionPort,
        scope: createInput.scope,
        runId: createInput.run.runId,
      })
      if (!persisted) throw blocked('canonical_v3_local_create_readback_missing')
      assertPreparedPreflightPreserved(createInput.run, persisted.run)
      return {
        ...persisted,
        disposition: enqueued.idempotencyStatus === 'inserted'
          ? 'created'
          : 'idempotent_replay',
      }
    },

    read(readInput) {
      return readPersistedStudy({
        readProjectionPort: input.readProjectionPort,
        scope: readInput.scope,
        runId: readInput.runId,
      })
    },

    async applyControlCommand(controlInput) {
      const beforeProjection = await readPersistedProjection({
        readProjectionPort: input.readProjectionPort,
        scope: controlInput.scope,
        runId: controlInput.runId,
      })
      if (!beforeProjection) throw blocked('canonical_v3_local_control_run_missing')
      const authority = compileStudyAuthorityFromProjection(beforeProjection)
      const request = canonicalDistributedPrePlanStudyControlRequestSchema.parse(
        withRequestHash('control', {
          runId: controlInput.runId,
          studyIdentityHash: authority.seed.identity.identityHash,
          idempotencyKey: controlInput.idempotencyKey,
          action: controlInput.action,
          expectedRunRevision: controlInput.expectedRunRevision,
          controllerIdentityEvidenceHash: authority.controllerIdentityEvidenceHash,
          requestedAt: controlInput.now,
        }),
      )
      const controlled = await input.statePort.control(request)
      const afterProjection = await readPersistedProjection({
        readProjectionPort: input.readProjectionPort,
        scope: controlInput.scope,
        runId: controlInput.runId,
      })
      if (!afterProjection) throw blocked('canonical_v3_local_control_readback_missing')
      const after = projectLongFormStudy(afterProjection)
      if (!controlled.response.transaction) {
        throw blocked('canonical_v3_local_control_transaction_missing')
      }
      const recoveredWorkItemCount = controlInput.action === 'recover'
        ? afterProjection.workItems.filter((item) => (
            item.view.maximumAttempts > item.seed.maximumAttempts
          )).length
        : 0
      const commandIdDigestSha256 = sha256(controlInput.idempotencyKey)
      const requestDigestSha256 = sha256(stableStringify({
        runId: controlInput.runId,
        expectedRunRevision: controlInput.expectedRunRevision,
        action: controlInput.action,
      }))
      const receipt = createEditReferenceLongFormStudyControlCommandReceipt({
        run: after.run,
        action: controlInput.action,
        commandIdDigestSha256,
        requestDigestSha256,
        expectedRunRevision: controlInput.expectedRunRevision,
        activeWorkFinishesBeforePause:
          controlInput.action === 'pause'
          && controlled.response.run.runningWorkItemCount > 0,
        recoveredWorkItemCount,
        appliedAt: controlled.response.transaction.committedAt,
      })
      return {
        ...after,
        receipt,
        disposition: controlled.idempotencyStatus === 'inserted'
          ? 'applied'
          : 'idempotent_replay',
      }
    },

    async readWorkOutput() {
      return undefined
    },

    async readSemanticWindowCheckpoint() {
      return undefined
    },

    schedule() {
      return {
        scheduled: false,
        alreadyActive: false,
        runtime: 'blocked',
        reason: 'canonical_worker_dispatch_not_verified',
      }
    },
  }
  return Object.freeze(port)
}

async function readPersistedStudy(input: {
  readonly readProjectionPort: CanonicalDistributedPrePlanStudyReadProjectionPort
  readonly scope: { readonly ownerUserId: string; readonly workspaceId: string }
  readonly runId: string
}): Promise<{
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
} | undefined> {
  const projection = await readPersistedProjection(input)
  return projection ? projectLongFormStudy(projection) : undefined
}

async function readPersistedProjection(input: {
  readonly readProjectionPort: CanonicalDistributedPrePlanStudyReadProjectionPort
  readonly scope: { readonly ownerUserId: string; readonly workspaceId: string }
  readonly runId: string
}): Promise<CanonicalDistributedPrePlanStudyReadProjection | undefined> {
  const requestedAt = new Date().toISOString()
  const rawRequest = {
    runId: input.runId,
    idempotencyKey: operationKey('read', `${input.scope.workspaceId}:${input.runId}`),
    requestedAt,
  }
  const request = canonicalDistributedPrePlanStudyReadRequestSchema.parse({
    ...rawRequest,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(
      'read_projection',
      rawRequest,
    ),
  })
  const projection = await input.readProjectionPort.read(request)
  if (!projection) return undefined
  if (
    projection.seed.identity.ownerUserId !== input.scope.ownerUserId
    || projection.seed.identity.workspaceId !== input.scope.workspaceId
  ) throw blocked('canonical_v3_local_read_scope_changed')
  return projection
}

function compileStudyAuthority(input: {
  readonly ownerUserId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly sourceBinding: EditReferenceLongFormStudySourceBinding
}): CompiledStudyAuthority {
  validateRunAgainstPlan(input.run, input.plan)
  const identityWithoutHash = {
    authorityClass: 'pre_plan_edit_reference_long_form_study' as const,
    persistenceContractVersion: 'edit-reference-production-persistence-contract-v6' as const,
    ownerUserId: input.ownerUserId,
    workspaceId: input.plan.workspaceId,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    sourceAssetId: input.sourceBinding.sourceAssetId,
    sourcePrivateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    sourceStorageObjectId: input.sourceBinding.sourceStorageObjectId,
    sourceStorageObjectIdentityHash: sha256AuthorityValue({
      domain: 'canonical_v3_local_preference_asset_storage_identity_v1',
      payload: {
        workspaceId: input.plan.workspaceId,
        assetId: input.sourceBinding.sourceAssetId,
        storageObjectId: input.sourceBinding.sourceStorageObjectId,
        storageGeneration: input.sourceBinding.sourceStorageGeneration,
        storageEtag: input.sourceBinding.sourceStorageEtag,
        checksumSha256: input.plan.source.mediaChecksumSha256,
      },
    }),
    sourceChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceSizeBytes: input.plan.source.sizeBytes,
    sourceDurationMilliseconds: Math.round(input.plan.source.durationSeconds * 1_000),
    sourceMimeType: input.plan.source.mimeType,
    sourceHasAudio: input.plan.source.hasAudio,
  }
  const identity = {
    ...identityWithoutHash,
    identityHash: canonicalDistributedPrePlanStudyIdentityHash(identityWithoutHash),
  }
  const normalizedWeights = normalizedWeightBasisPoints(input.run.workItems)
  const workItems = input.run.workItems.map((item, index) => {
    const profile = workProfile(item.stageId)
    const withoutHash = {
      workItemId: item.workItemId,
      sequence: index + 1,
      stageId: item.stageId,
      dependencyWorkItemIds: [...item.dependencyWorkItemIds],
      required: item.required,
      weightBasisPoints: normalizedWeights[index] as number,
      executionKind: profile.executionKind,
      workerClass: profile.workerClass,
      operationId: profile.operationId,
      profileId: profile.profileId,
      modelId: profile.modelId,
      maximumAttempts: item.maxAttempts,
      leaseDurationMs: 5 * 60_000,
      attemptDeadlineDurationMs: profile.attemptDeadlineDurationMs,
      resourceEnvelope: profile.resourceEnvelope,
      providerRateCardSnapshotDigestSha256: sha256AuthorityValue({
        domain: 'canonical_v3_local_pre_plan_provider_rate_card_v1',
        planDigestSha256: input.plan.planDigestSha256,
        stageId: item.stageId,
      }),
      infrastructureRateCardSnapshotDigestSha256: sha256AuthorityValue({
        domain: 'canonical_v3_local_pre_plan_infrastructure_rate_card_v1',
        planDigestSha256: input.plan.planDigestSha256,
        workerClass: profile.workerClass,
      }),
      maximumAuthorizedInternalCostMicrosPerAttempt:
        LOCAL_PER_ATTEMPT_INTERNAL_COST_CEILING_MICROS.toString(),
      inputBindingHash: sha256AuthorityValue({
        domain: 'canonical_v3_local_pre_plan_work_input_binding_v1',
        planDigestSha256: input.plan.planDigestSha256,
        studyIdentityHash: identity.identityHash,
        workItemId: item.workItemId,
        sourceCoverageStartSeconds: item.sourceCoverageStartSeconds,
        sourceCoverageEndSeconds: item.sourceCoverageEndSeconds,
      }),
    }
    return {
      ...withoutHash,
      workItemHash: canonicalDistributedPrePlanStudyWorkItemHash(withoutHash),
    }
  })
  const maximumAuthorizedInternalCostMicros = workItems.reduce((total, item) => (
    total + BigInt(item.maximumAuthorizedInternalCostMicrosPerAttempt)
      * BigInt(item.maximumAttempts)
  ), 0n).toString()
  const studyUsageApprovalId = prefixedId('pre-plan-study-usage', {
    runId: input.run.runId,
    planDigestSha256: input.plan.planDigestSha256,
  })
  const studyUsageApprovalDigestSha256 = sha256AuthorityValue({
    domain: 'canonical_v3_local_pre_plan_study_usage_approval_v1',
    studyUsageApprovalId,
    runId: input.run.runId,
    planDigestSha256: input.plan.planDigestSha256,
    maximumAuthorizedInternalCostMicros,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  })
  const internalCostBudgetId = prefixedId('pre-plan-internal-cost-budget', {
    runId: input.run.runId,
    studyUsageApprovalDigestSha256,
  })
  const seedWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-seed-v1' as const,
    runId: input.run.runId,
    planId: input.plan.planId,
    planVersion: input.plan.schemaVersion,
    planDigestSha256: input.plan.planDigestSha256,
    planCreatedAt: input.plan.createdAt,
    captionOcrIncluded: input.plan.stages.some((stage) => (
      stage.stageId === 'caption_ocr' && stage.required
    )),
    identity,
    studyUsageApprovalId,
    studyUsageApprovalDigestSha256,
    internalCostBudgetId,
    maximumAuthorizedInternalCostMicros,
    currency: 'USD' as const,
    wholeStudyTimeoutApplied: false as const,
    browserSessionRequiredForCompletion: false as const,
    workItems,
  }
  const seed = {
    ...seedWithoutHash,
    seedHash: canonicalDistributedPrePlanStudySeedHash(seedWithoutHash),
  }
  return {
    seed,
    controllerIdentityEvidenceHash: sha256AuthorityValue({
      domain: 'canonical_v3_local_pre_plan_controller_identity_v1',
      controllerId: LOCAL_CONTROLLER_ID,
      ownerUserId: input.ownerUserId,
      workspaceId: input.plan.workspaceId,
      seedHash: seed.seedHash,
    }),
  }
}

async function reconcilePreparedPreflight(input: {
  readonly statePort: CanonicalDistributedPrePlanStudyTransactionAdapter
  readonly authority: CompiledStudyAuthority
  readonly preparedRun: EditReferenceLongFormStudyRunRecord
  readonly persistedRun: EditReferenceLongFormStudyRunRecord
  readonly persistedRunCreatedAt: string
}): Promise<void> {
  const preparedItems = input.preparedRun.workItems.filter((item) => (
    item.status === 'completed'
  ))
  if (
    preparedItems.length !== 2
    || preparedItems[0]?.stageId !== 'ingest_integrity'
    || preparedItems[1]?.stageId !== 'media_probe'
  ) throw blocked('canonical_v3_local_preflight_checkpoint_invalid')

  for (const [index, item] of preparedItems.entries()) {
    const persistedItem = input.persistedRun.workItems.find((candidate) => (
      candidate.workItemId === item.workItemId
    ))
    if (persistedItem?.status === 'completed') {
      if (
        persistedItem.outputDigestSha256 !== item.outputDigestSha256
        || persistedItem.observedWallClockMs !== item.observedWallClockMs
        || persistedItem.outputRuntimeSource !== item.outputRuntimeSource
        || persistedItem.outputCompletionAuthority !== item.outputCompletionAuthority
      ) throw blocked('canonical_v3_local_preflight_replay_changed')
      continue
    }
    if (persistedItem?.status !== 'queued' && persistedItem?.status !== 'leased') {
      throw blocked('canonical_v3_local_preflight_recovery_state_invalid')
    }
    const seedItem = input.authority.seed.workItems.find((candidate) => (
      candidate.workItemId === item.workItemId
    ))
    if (!seedItem) throw blocked('canonical_v3_local_preflight_seed_missing')
    // The persisted run creation time is stable across response loss and does
    // not give a newly enqueued study an already-expired lease merely because
    // its immutable plan was prepared earlier.
    const acceptedAt = plusMilliseconds(input.persistedRunCreatedAt, index * 2 + 1)
    const claim = await input.statePort.claimAndStart(
      canonicalDistributedPrePlanStudyClaimRequestSchema.parse(withRequestHash(
        'claim_and_start',
        {
          runId: input.authority.seed.runId,
          studyIdentityHash: input.authority.seed.identity.identityHash,
          idempotencyKey: operationKey('preflight-claim', item.workItemId),
          workerClass: seedItem.workerClass,
          workerIdentityEvidenceHash: sha256AuthorityValue({
            domain: 'canonical_v3_local_preflight_worker_identity_v1',
            workerId: LOCAL_PREFLIGHT_WORKER_ID,
            workerClass: seedItem.workerClass,
          }),
          workerReceiptHash: sha256AuthorityValue({
            domain: 'canonical_v3_local_preflight_worker_receipt_v1',
            runId: input.authority.seed.runId,
            workItemId: item.workItemId,
          }),
          capacityAdmissionEvidenceHash: sha256AuthorityValue({
            domain: 'canonical_v3_local_preflight_capacity_admission_v1',
            workItemId: item.workItemId,
            boundedPreflightOnly: true,
          }),
          acceptedAt,
        },
      )),
    )
    if (
      claim.response.workItem?.workItemId !== item.workItemId
      || !claim.response.attempt
      || !claim.transientLeaseCredential
    ) throw blocked('canonical_v3_local_preflight_claim_changed')
    await input.statePort.complete(preflightCompletionRequest({
      authority: input.authority,
      item,
      claim: claim.response,
      leaseCredential: claim.transientLeaseCredential,
      completedAt: plusMilliseconds(input.persistedRunCreatedAt, index * 2 + 2),
    }))
  }
}

function preflightCompletionRequest(input: {
  readonly authority: CompiledStudyAuthority
  readonly item: EditReferenceLongFormStudyWorkItem
  readonly claim: CanonicalDistributedPrePlanStudyMutationResponse
  readonly leaseCredential: string
  readonly completedAt: string
}) {
  const attempt = input.claim.attempt?.attemptStart
  if (!attempt || !input.item.outputDigestSha256 || !input.item.observedWallClockMs) {
    throw blocked('canonical_v3_local_preflight_output_missing')
  }
  if (
    input.item.outputRuntimeSource !== 'verified_local'
    || input.item.outputCompletionAuthority !== 'authoritative'
  ) throw blocked('canonical_v3_local_preflight_output_authority_invalid')
  const domainResultWithoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-domain-work-result-v1' as const,
    outputDigestSha256: input.item.outputDigestSha256,
    observedWallClockMs: input.item.observedWallClockMs,
    runtimeSource: input.item.outputRuntimeSource,
    completionAuthority: input.item.outputCompletionAuthority,
    completionAttestation: null,
  }
  const costEvidence = localZeroCostEvidence({
    authority: input.authority,
    attempt,
    completedAt: input.completedAt,
  })
  return canonicalDistributedPrePlanStudyCompletionRequestSchema.parse(
    withRequestHash('complete', {
      runId: input.authority.seed.runId,
      studyIdentityHash: input.authority.seed.identity.identityHash,
      idempotencyKey: operationKey('preflight-complete', input.item.workItemId),
      attemptId: attempt.attemptId,
      leaseCredential: input.leaseCredential,
      workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
      workerReceiptHash: attempt.workerReceiptHash,
      outputs: [],
      domainWorkResult: {
        ...domainResultWithoutHash,
        resultHash: canonicalDistributedPrePlanStudyDomainWorkResultHash(
          domainResultWithoutHash,
        ),
      },
      costEvidence,
      completionEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_v3_local_preflight_completion_evidence_v1',
        runId: input.authority.seed.runId,
        workItemId: input.item.workItemId,
        outputDigestSha256: input.item.outputDigestSha256,
      }),
      completedAt: input.completedAt,
    }),
  )
}

function localZeroCostEvidence(input: {
  readonly authority: CompiledStudyAuthority
  readonly attempt: CanonicalDistributedPrePlanStudyAttemptView['attemptStart']
  readonly completedAt: string
}): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const workItem = input.authority.seed.workItems.find((candidate) => (
    candidate.workItemId === input.attempt.workItemId
  ))
  if (!workItem) throw blocked('canonical_v3_local_preflight_cost_work_item_missing')
  const withoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: 'final' as const,
    attemptId: input.attempt.attemptId,
    attemptStartHash: input.attempt.attemptStartHash,
    startedAt: input.attempt.startedAt,
    finishedAt: input.completedAt,
    approvedUsageEstimateId: input.authority.seed.studyUsageApprovalId,
    internalCostBudgetId: input.authority.seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros:
      input.attempt.maximumAuthorizedInternalCostMicros,
    providerUsageEvidenceDigestSha256: sha256AuthorityValue({
      domain: 'canonical_v3_local_preflight_provider_usage_v1',
      attemptId: input.attempt.attemptId,
      providerCallMade: false,
    }),
    providerRateCardSnapshotDigestSha256:
      workItem.providerRateCardSnapshotDigestSha256,
    providerCostMicros: '0',
    infrastructureUsageEvidenceDigestSha256: sha256AuthorityValue({
      domain: 'canonical_v3_local_preflight_infrastructure_usage_v1',
      attemptId: input.attempt.attemptId,
      boundedServerPreflight: true,
    }),
    infrastructureRateCardSnapshotDigestSha256:
      workItem.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '0',
    totalInternalCostMicros: '0',
    usageEventIds: [prefixedId('pre-plan-usage-event', input.attempt.attemptId)],
    internalCostRecordIds: [prefixedId('pre-plan-cost-record', input.attempt.attemptId)],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...withoutHash,
    evidenceHash: canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(withoutHash),
  }
}

function projectLongFormStudy(
  projection: CanonicalDistributedPrePlanStudyReadProjection,
): { plan: EditReferenceLongFormStudyPlan; run: EditReferenceLongFormStudyRunRecord } {
  const plan = createEditReferenceLongFormStudyPlan({
    workspaceId: projection.seed.identity.workspaceId,
    editReferenceId: projection.seed.identity.editReferenceId,
    studySessionId: projection.seed.identity.studySessionId,
    source: {
      privateMediaArtifactId: projection.seed.identity.sourcePrivateMediaArtifactId,
      mediaChecksumSha256: projection.seed.identity.sourceChecksumSha256,
      durationSeconds: projection.seed.identity.sourceDurationMilliseconds / 1_000,
      sizeBytes: projection.seed.identity.sourceSizeBytes,
      mimeType: projection.seed.identity.sourceMimeType,
      hasAudio: projection.seed.identity.sourceHasAudio,
    },
    includeCaptionOcr: projection.seed.captionOcrIncluded,
    createdAt: projection.seed.planCreatedAt,
  })
  if (
    plan.planId !== projection.seed.planId
    || plan.planDigestSha256 !== projection.seed.planDigestSha256
  ) throw blocked('canonical_v3_local_plan_reconstruction_changed')
  const base = createEditReferenceLongFormStudyRun({
    runId: projection.seed.runId,
    plan,
    createdAt: projection.seed.planCreatedAt,
  })
  const projectedWorkItems = base.workItems.map((item) => projectWorkItem({
    item,
    projection,
  }))
  const runState = projectRunState(projection)
  const coverageQa = projectedWorkItems.find((item) => item.stageId === 'coverage_qa')
  const completionAttestation = runState === 'completed'
    ? projection.workItems.find((record) => record.seed.workItemId === coverageQa?.workItemId)
      ?.latestAttempt?.terminal?.domainWorkResult?.completionAttestation ?? undefined
    : undefined
  if (runState === 'completed' && !completionAttestation) {
    throw blocked('canonical_v3_local_completion_attestation_missing')
  }
  const run = sealEditReferenceLongFormStudyRun({
    ...base,
    revision: projection.run.revision,
    state: runState,
    workItems: projectedWorkItems,
    operatorReviewRequired: runState === 'needs_operator_review',
    operatorRecoveryCount: projection.run.recoveryGeneration,
    ...(runState === 'paused' && projection.run.pauseRequestedAt
      ? { pausedAt: projection.run.pauseRequestedAt }
      : {}),
    ...(runState === 'cancelled' && projection.run.cancelRequestedAt
      ? {
          cancelReason: 'owner_cancelled' as const,
          cancelledAt: projection.run.cancelRequestedAt,
        }
      : {}),
    ...(runState === 'completed' && completionAttestation
      ? {
          completedAt: completionAttestation.finalizedAt,
          completionAttestation,
        }
      : {}),
    updatedAt: projection.run.updatedAt,
    recordDigestSha256: '',
  })
  validateRunAgainstPlan(run, plan)
  return { plan, run }
}

function projectWorkItem(input: {
  readonly item: EditReferenceLongFormStudyWorkItem
  readonly projection: CanonicalDistributedPrePlanStudyReadProjection
}): EditReferenceLongFormStudyWorkItem {
  const record = input.projection.workItems.find((candidate) => (
    candidate.seed.workItemId === input.item.workItemId
  ))
  if (!record) throw blocked('canonical_v3_local_work_item_projection_missing')
  const additionalAttempts = record.view.maximumAttempts - input.item.maxAttempts
  if (additionalAttempts < 0) throw blocked('canonical_v3_local_attempt_authority_regressed')
  const item: EditReferenceLongFormStudyWorkItem = {
    ...input.item,
    status: mapWorkItemState(record.view.state),
    attemptCount: record.view.attemptCount,
    leaseGeneration: record.view.attemptCount,
    ...(additionalAttempts > 0
      ? { additionalAttemptsAuthorized: additionalAttempts }
      : {}),
  }
  const attempt = record.latestAttempt
  if (item.status === 'leased') {
    if (!attempt || attempt.state !== 'running') {
      throw blocked('canonical_v3_local_active_attempt_projection_missing')
    }
    item.leaseOwnerIdDigestSha256 = attempt.attemptStart.workerIdentityEvidenceHash
    item.leaseTokenHashSha256 = attempt.attemptStart.leaseCredentialHashSha256
    item.leasedAt = attempt.attemptStart.startedAt
    item.leaseExpiresAt = attempt.leaseExpiresAt
    item.lastHeartbeatAt = attempt.heartbeatAt
    item.startedAt = attempt.attemptStart.startedAt
  } else if (item.status === 'completed') {
    const domainResult = attempt?.terminal?.domainWorkResult
    if (!attempt?.terminal || !domainResult) {
      throw blocked('canonical_v3_local_domain_work_result_missing')
    }
    item.completedAt = attempt.terminal.terminalAt
    item.observedWallClockMs = domainResult.observedWallClockMs
    item.outputDigestSha256 = domainResult.outputDigestSha256
    item.outputRuntimeSource = domainResult.runtimeSource
    item.outputCompletionAuthority = domainResult.completionAuthority
    item.startedAt = attempt.attemptStart.startedAt
    item.lastHeartbeatAt = attempt.heartbeatAt
  } else if (item.status === 'retry_wait' || item.status === 'blocked') {
    const terminal = attempt?.terminal
    item.blockerCode = record.view.blockerCode ?? terminal?.sanitizedFailureCode
      ?? 'STUDY_WORK_RETRY_REQUIRED'
    item.blockerMessage = safeBlockerMessage(terminal?.queueDisposition)
    item.startedAt = attempt?.attemptStart.startedAt
    item.lastHeartbeatAt = attempt?.heartbeatAt
    if (item.status === 'retry_wait') {
      item.nextAttemptAt = terminal?.terminalAt ?? input.projection.run.updatedAt
    }
  }
  return item
}

function projectRunState(
  projection: CanonicalDistributedPrePlanStudyReadProjection,
): EditReferenceLongFormStudyRunRecord['state'] {
  if (projection.run.state === 'cancellation_requested') {
    throw blocked('canonical_v3_local_cancellation_pending_projection_not_released')
  }
  if (projection.run.state === 'queued') {
    return projection.run.completedWorkItemCount > 0 ? 'running' : 'queued'
  }
  return projection.run.state
}

function mapWorkItemState(
  state: CanonicalDistributedPrePlanStudyReadProjection['workItems'][number]['view']['state'],
): EditReferenceLongFormStudyWorkItem['status'] {
  if (state === 'running') return 'leased'
  return state
}

function normalizedWeightBasisPoints(
  workItems: readonly EditReferenceLongFormStudyWorkItem[],
): number[] {
  const total = workItems.reduce((sum, item) => sum + item.weightBasisPoints, 0)
  if (workItems.length > 10_000 || total < 1) {
    throw blocked('canonical_v3_local_work_graph_progress_capacity_invalid')
  }
  const weights = workItems.map((item) => Math.max(
    1,
    Math.floor((item.weightBasisPoints * 10_000) / total),
  ))
  let delta = 10_000 - weights.reduce((sum, weight) => sum + weight, 0)
  let cursor = 0
  while (delta !== 0) {
    const index = cursor % weights.length
    const current = weights[index] as number
    if (delta > 0) {
      weights[index] = current + 1
      delta -= 1
    } else if (current > 1) {
      weights[index] = current - 1
      delta += 1
    }
    cursor += 1
    if (cursor > 100_000) throw blocked('canonical_v3_local_work_graph_progress_normalization_failed')
  }
  return weights
}

function workProfile(stageId: EditReferenceLongFormStudyStageId): {
  readonly executionKind: CanonicalDistributedPrePlanStudyWorkItemSeed['executionKind']
  readonly workerClass: CanonicalDistributedPrePlanStudyWorkItemSeed['workerClass']
  readonly operationId: string
  readonly profileId: string
  readonly modelId: string | null
  readonly attemptDeadlineDurationMs: number
  readonly resourceEnvelope: CanonicalDistributedPrePlanStudyWorkItemSeed['resourceEnvelope']
} {
  const media = ['ingest_integrity', 'media_probe', 'analysis_proxy', 'audio_extract',
    'scene_boundary_scan', 'visual_sampling', 'color_motion_signals']
    .includes(stageId)
  const transcript = stageId === 'speech_transcript'
  const caption = stageId === 'caption_ocr'
  const semantic = stageId === 'semantic_chunk_synthesis'
  const qa = stageId === 'coverage_qa'
  const workerClass = media
    ? 'media_worker' as const
    : transcript
      ? 'transcript_worker' as const
      : caption
        ? 'visual_worker' as const
        : qa
          ? 'qa_worker' as const
          : 'reasoning_worker' as const
  const executionKind = semantic ? 'reasoning_model' as const : 'deterministic_tool' as const
  return {
    executionKind,
    workerClass,
    operationId: semantic
      ? 'model.kimi_k3.edit_reference_semantic_chunk.v1'
      : `study.${stageId}.v1`,
    profileId: `edit-reference-${stageId}-v1`,
    modelId: semantic ? 'kimi_k3' : null,
    attemptDeadlineDurationMs: semantic ? 60 * 60_000 : 30 * 60_000,
    resourceEnvelope: {
      vcpuCount: semantic ? 2 : 4,
      memoryGib: semantic ? 8 : 16,
      gpuCount: 0,
      temporaryStorageGib: media ? 256 : 32,
    },
  }
}

function requireRegisteredSourceBinding(
  binding: EditReferenceLongFormStudySourceBinding | undefined,
  plan: EditReferenceLongFormStudyPlan,
): EditReferenceLongFormStudySourceBinding {
  if (
    !binding
    || !['preference_asset', 'target_source_media'].includes(binding.sourceAuthority)
    || !binding.sourceAssetId
    || !binding.sourceStorageObjectRecordId
    || !binding.sourceMediaAssetId
    || !binding.sourceStorageObjectId
    || !binding.sourceStorageGeneration
    || !binding.sourceStorageEtag
    || plan.source.privateMediaArtifactId.length < 1
    || (binding.sourceAuthority === 'target_source_media' && (
      !binding.targetProjectId
      || !binding.targetEditSessionId
      || !binding.targetEditBriefId
      || !Number.isSafeInteger(binding.targetEditBriefRevision)
      || binding.targetEditBriefRevision < 1
      || !/^[a-f0-9]{64}$/u.test(binding.targetEditBriefDigestSha256)
    ))
  ) throw blocked('canonical_v3_local_registered_source_binding_required')
  return binding
}

function compileStudyAuthorityFromProjection(
  projection: CanonicalDistributedPrePlanStudyReadProjection,
): CompiledStudyAuthority {
  return {
    seed: projection.seed,
    controllerIdentityEvidenceHash: sha256AuthorityValue({
      domain: 'canonical_v3_local_pre_plan_controller_identity_v1',
      controllerId: LOCAL_CONTROLLER_ID,
      ownerUserId: projection.seed.identity.ownerUserId,
      workspaceId: projection.seed.identity.workspaceId,
      seedHash: projection.seed.seedHash,
    }),
  }
}

function assertScope(
  scope: { readonly ownerUserId: string; readonly workspaceId: string },
  plan: EditReferenceLongFormStudyPlan,
): void {
  if (!scope.ownerUserId || scope.workspaceId !== plan.workspaceId) {
    throw blocked('canonical_v3_local_runtime_scope_invalid')
  }
}

function assertPreparedPreflightPreserved(
  expected: EditReferenceLongFormStudyRunRecord,
  actual: EditReferenceLongFormStudyRunRecord,
): void {
  for (const stageId of ['ingest_integrity', 'media_probe'] as const) {
    const left = expected.workItems.find((item) => item.stageId === stageId)
    const right = actual.workItems.find((item) => item.stageId === stageId)
    if (
      !left
      || !right
      || left.status !== 'completed'
      || right.status !== 'completed'
      || left.outputDigestSha256 !== right.outputDigestSha256
      || left.observedWallClockMs !== right.observedWallClockMs
    ) throw blocked('canonical_v3_local_preflight_readback_changed')
  }
}

function withRequestHash(
  operation: string,
  request: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...request,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, request),
  }
}

function operationKey(operation: string, identity: string): string {
  return `${operation}-${sha256(identity).slice(0, 48)}`
}

function prefixedId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 48)}`
}

function plusMilliseconds(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString()
}

function safeBlockerMessage(queueDisposition: string | undefined): string {
  if (queueDisposition === 'blocked_unknown_outcome') {
    return 'The previous provider outcome is unknown. ReEditPro retained the checkpoint and will not retry until that attempt is reconciled.'
  }
  if (queueDisposition === 'attempts_exhausted') {
    return 'This bounded study step used its authorized attempts. Review the retained checkpoint before authorizing one more attempt.'
  }
  return 'This bounded study step retained its checkpoint and is ready for a safe retry.'
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'The canonical local durable Edit Reference study runtime is unavailable or inconsistent.',
    503,
    {
      reason,
      localDatabaseOnly: true,
      remoteMutationAllowed: false,
      workerDispatchPerformed: false,
      providerCallPerformed: false,
      productionAuthority: false,
    },
  )
}
