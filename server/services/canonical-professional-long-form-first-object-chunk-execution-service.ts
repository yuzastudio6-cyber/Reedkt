import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  buildProfessionalLongFormFirstObjectChunkQaArtifact,
  buildProfessionalLongFormFirstObjectChunkQaAuthority,
  buildProfessionalLongFormFirstObjectChunkQaAuthorization,
  buildProfessionalLongFormFirstObjectChunkQaCompletion,
  buildProfessionalLongFormFirstObjectChunkQaReconciliation,
  buildProfessionalLongFormFirstObjectChunkQaTerminal,
  buildProfessionalLongFormFirstObjectChunkRenderAuthority,
  buildProfessionalLongFormFirstObjectChunkRenderAuthorization,
  buildProfessionalLongFormFirstObjectChunkRenderCompletion,
  buildProfessionalLongFormFirstObjectChunkRenderEvidence,
  buildProfessionalLongFormFirstObjectChunkRenderReconciliation,
  buildProfessionalLongFormFirstObjectChunkRenderTerminal,
  professionalLongFormFirstObjectChunkQaResultHash,
  professionalLongFormFirstObjectChunkQaRuntimeReceipt,
  professionalLongFormFirstObjectChunkRenderResultHash,
  assertProfessionalLongFormFirstObjectChunkQaAuthority,
  assertProfessionalLongFormFirstObjectChunkRenderAuthority,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaAttemptSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
  professionalLongFormFirstObjectChunkQaReconciliationSchema,
  professionalLongFormFirstObjectChunkQaTerminalSchema,
  professionalLongFormFirstObjectChunkRenderAttemptSchema,
  professionalLongFormFirstObjectChunkRenderCompletionSchema,
  professionalLongFormFirstObjectChunkRenderEvidenceSchema,
  professionalLongFormFirstObjectChunkRenderReconciliationSchema,
  professionalLongFormFirstObjectChunkRenderTerminalSchema,
  type ProfessionalLongFormFirstObjectChunkMediaArtifactRef,
  type ProfessionalLongFormFirstObjectChunkQaArtifact,
  type ProfessionalLongFormFirstObjectChunkQaAttempt,
  type ProfessionalLongFormFirstObjectChunkQaAuthority,
  type ProfessionalLongFormFirstObjectChunkQaAuthorization,
  type ProfessionalLongFormFirstObjectChunkQaReconciliation,
  type ProfessionalLongFormFirstObjectChunkQaTerminal,
  type ProfessionalLongFormFirstObjectChunkRenderAttempt,
  type ProfessionalLongFormFirstObjectChunkRenderAuthority,
  type ProfessionalLongFormFirstObjectChunkRenderAuthorization,
  type ProfessionalLongFormFirstObjectChunkRenderEvidence,
  type ProfessionalLongFormFirstObjectChunkRenderReconciliation,
  type ProfessionalLongFormFirstObjectChunkRenderTerminal,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  buildOfflineMediaBinaryObjectMezzanineChunkRequest,
  openPrivateOfflineMediaBinaryRuntime,
  validateOfflineFfprobeStreamingExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  beginPrivateInternalAttemptCostEvidence,
  classifyPrivateInternalAttemptCostFailure,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  authorizePrivateCanonicalPackageWorkQueueJob,
  beginPrivateCanonicalPackageWorkQueueExecutionAttempt,
  claimPrivateCanonicalPackageWorkQueueJob,
  completePrivateCanonicalPackageWorkQueueClaim,
} from './private-canonical-package-work-queue-store'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
  type CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from './canonical-professional-long-form-child-package-promotion-service'
import { createCanonicalPrivateSourceObjectReadService } from
  './canonical-private-source-object-read-service'
import {
  inspectCanonicalPrivateMediaArtifact,
  persistCanonicalPrivateMediaArtifactStream,
} from './canonical-private-media-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_EXECUTION_VERSION =
  'canonical-professional-long-form-first-object-chunk-execution-v1' as const

export interface CanonicalProfessionalLongFormFirstObjectChunkExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_EXECUTION_VERSION
  source: 'canonical_professional_long_form_first_object_chunk_execution_service'
  status: 'first_object_chunk_and_independent_qa_completed_remaining_graph_blocked'
  disposition: 'completed' | 'exact_replay'
  render: {
    authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
    authorityRef: AuthorityJsonBlobRef
    authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
    executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
    runtimeEvidence: ProfessionalLongFormFirstObjectChunkRenderEvidence
    runtimeEvidenceRef: AuthorityJsonBlobRef
    outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
    reconciliation: ProfessionalLongFormFirstObjectChunkRenderReconciliation
    reconciliationRef: AuthorityJsonBlobRef
    costEvidence: PrivateInternalAttemptCostEvidence
    terminal: ProfessionalLongFormFirstObjectChunkRenderTerminal
    terminalRef: AuthorityJsonBlobRef
  }
  qa: {
    authority: ProfessionalLongFormFirstObjectChunkQaAuthority
    authorityRef: AuthorityJsonBlobRef
    authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
    executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
    artifact: ProfessionalLongFormFirstObjectChunkQaArtifact
    artifactRef: AuthorityJsonBlobRef
    reconciliation: ProfessionalLongFormFirstObjectChunkQaReconciliation
    reconciliationRef: AuthorityJsonBlobRef
    costEvidence: PrivateInternalAttemptCostEvidence
    terminal: ProfessionalLongFormFirstObjectChunkQaTerminal
    terminalRef: AuthorityJsonBlobRef
  }
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotReopenedAndVerified: true
    fundedFourKEstimateReservationReused: true
    renderLeaseAndOneUseDispatchVerified: true
    exactPrivateSourcesStagedAndChecksummed: true
    fixedFfmpegHardCutStreamCopyExecuted: true
    firstObjectChunkPrivatePersistenceVerified: true
    qaLeaseAndOneUseDispatchVerified: true
    exactPersistedArtifactIndependentlyProbed: true
    exactFrameRateFrameCountDurationAndColorVerified: true
    renderAttemptInternalCostVerified: true
    qaAttemptInternalCostVerified: true
    queueCompletionCount: number
    remainingIncompleteChildJobCount: number
    allRemainingJobsStillBlockedByDependenciesOrCapability: true
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    providerActivationAuthorized: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

interface CompletedRenderEvidence {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormFirstObjectChunkRenderAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkRenderAttempt
  runtimeEvidence: ProfessionalLongFormFirstObjectChunkRenderEvidence
  runtimeEvidenceRef: AuthorityJsonBlobRef
  outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef
  reconciliation: ProfessionalLongFormFirstObjectChunkRenderReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormFirstObjectChunkRenderTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

interface CompletedQaEvidence {
  authority: ProfessionalLongFormFirstObjectChunkQaAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormFirstObjectChunkQaAuthorization
  executionAttempt: ProfessionalLongFormFirstObjectChunkQaAttempt
  artifact: ProfessionalLongFormFirstObjectChunkQaArtifact
  artifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormFirstObjectChunkQaReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormFirstObjectChunkQaTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export function createCanonicalProfessionalLongFormFirstObjectChunkExecutionService(
  context: ServiceContext,
) {
  return {
    async execute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormFirstObjectChunkExecutionEvidence> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) throw invalid(
        'First object-chunk selection is server-owned and accepts no caller chunk, source, recipe, path, command, or artifact fields.',
      )
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'First object-chunk execution requires authenticated authority.',
          401,
        )
      }
      let current = await currentAuthority(context, input)
      const initialRenderEntry = firstRenderEntry(current)
      let render: CompletedRenderEvidence
      let newlyExecuted = false
      if (initialRenderEntry.state === 'completed') {
        render = await loadCompletedRender({ context, current, ownerUserId })
      } else {
        if (initialRenderEntry.state === 'leased') {
          throw inProgress('First object-chunk render already has an active lease.')
        }
        render = await executeRender({ context, current, ownerUserId })
        newlyExecuted = true
      }

      current = await currentAuthority(context, input)
      const qaEntry = pairedQaEntry(current)
      let qa: CompletedQaEvidence
      if (qaEntry.state === 'completed') {
        qa = await loadCompletedQa({ context, current, ownerUserId })
      } else {
        if (qaEntry.state === 'leased') {
          throw inProgress('First object-chunk QA already has an active lease.')
        }
        qa = await executeQa({ context, current, ownerUserId })
        newlyExecuted = true
      }
      const aggregate = qa.queueAggregate
      if (
        aggregate.summary.completedJobCount !== 5 ||
        aggregate.summary.totalJobCount !== 255 ||
        aggregate.summary.queuedJobCount !== 250 ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.totalDeliveryAttemptCount !== 5 ||
        aggregate.entries.slice(5).some((entry) =>
          entry.state !== 'queued' || entry.deliveryAttemptCount !== 0 ||
          entry.professionalLongFormExecutionAuthorization ||
          entry.professionalLongFormExecutionAttempt || entry.completion)
      ) throw invalid(
        'First object-chunk completion did not preserve the remaining canonical graph.',
      )
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_first_object_chunk_execution_service' as const,
        status:
          'first_object_chunk_and_independent_qa_completed_remaining_graph_blocked' as const,
        render: withoutAggregate(render),
        qa: withoutAggregate(qa),
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotReopenedAndVerified: true as const,
          fundedFourKEstimateReservationReused: true as const,
          renderLeaseAndOneUseDispatchVerified: true as const,
          exactPrivateSourcesStagedAndChecksummed: true as const,
          fixedFfmpegHardCutStreamCopyExecuted: true as const,
          firstObjectChunkPrivatePersistenceVerified: true as const,
          qaLeaseAndOneUseDispatchVerified: true as const,
          exactPersistedArtifactIndependentlyProbed: true as const,
          exactFrameRateFrameCountDurationAndColorVerified: true as const,
          renderAttemptInternalCostVerified: true as const,
          qaAttemptInternalCostVerified: true as const,
          queueCompletionCount: aggregate.summary.completedJobCount,
          remainingIncompleteChildJobCount:
            aggregate.summary.totalJobCount - aggregate.summary.completedJobCount,
          allRemainingJobsStillBlockedByDependenciesOrCapability: true as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          providerActivationAuthorized: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: newlyExecuted ? 'completed' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

async function executeRender(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
}): Promise<CompletedRenderEvidence> {
  const authority = buildProfessionalLongFormFirstObjectChunkRenderAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormFirstObjectChunkRenderAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
      })
    },
  })
  const authorization =
    buildProfessionalLongFormFirstObjectChunkRenderAuthorization({
      authority,
      authorityRef,
    })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity:
      'canonical-professional-long-form-first-object-chunk-render-v1',
    workerType: 'render_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`First object-chunk render claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt =
    professionalLongFormFirstObjectChunkRenderAttemptSchema.parse(
      begun.executionAttempt,
    )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    editSessionId: authority.identity.editSessionId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobId: authority.identity.jobId,
    executionAttemptId: executionAttempt.executionAttemptId,
    retryAttempt: executionAttempt.deliveryAttempt,
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  })
  let costFinalized = false
  try {
    const parentWorkItem = input.current.authority.workItems.find((workItem) =>
      workItem.id ===
        input.current.package.identity.parentControllerApprovedWorkItemId)
    if (!parentWorkItem) throw invalid('Approved long-form controller work item is missing.')
    const sourceIds = uniqueSourceIds(authority)
    const staged = await createCanonicalPrivateSourceObjectReadService(
      input.context,
    ).stageExactApprovedSourceSubset({
      workspaceId: authority.identity.workspaceId,
      projectId: authority.identity.projectId,
      editSessionId: authority.identity.editSessionId,
      snapshotId: authority.identity.approvedPlanSnapshotId,
      jobId: authority.identity.jobId,
      approvedWorkItem: parentWorkItem,
      approvedSourceManifest: input.current.authority.sourceAssetManifest,
      leaseId: claim.entry.activeClaim.claimId,
      executionAttemptId: executionAttempt.executionAttemptId,
      dispatchGrantId: authorization.authorizationId,
    }, sourceIds)
    try {
      const request = buildRenderRequest(authority, staged.sources)
      const runtime = await openPrivateOfflineMediaBinaryRuntime()
      const result = await runtime.executeObjectMezzanineChunkServerInjected(
        request,
        staged.sources.map((source) => source.sourceInput),
        {
          maximumBytes:
            OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
          async persist(output) {
            if (output.mimeType !== 'video/x-matroska') {
              throw invalid('First object-chunk runner returned the wrong media type.')
            }
            const stored = await persistCanonicalPrivateMediaArtifactStream({
              localStorageRoot: input.context.env.localStorageRoot,
              privateObjectIdentityHash:
                authority.approvedChunk.expectedObject.objectIdentity,
              mediaFormat: 'mkv',
              stream: output.stream,
              expectedByteLength: output.expectedByteLength,
              expectedSha256: output.expectedSha256,
            })
            return { byteLength: stored.byteLength, sha256: stored.sha256 }
          },
        },
      )
      assertRenderRuntimeResult({ authority, stagedSources: staged.sources, result })
      const stored = await inspectCanonicalPrivateMediaArtifact({
        localStorageRoot: input.context.env.localStorageRoot,
        privateObjectIdentityHash:
          authority.approvedChunk.expectedObject.objectIdentity,
      })
      if (
        !stored || stored.mediaFormat !== 'mkv' ||
        stored.byteLength !== result.resultArtifact.byteLength ||
        stored.sha256 !== result.resultArtifact.sha256
      ) throw invalid('First object-chunk changed after private persistence.')
      const outputArtifact: ProfessionalLongFormFirstObjectChunkMediaArtifactRef = {
        objectIdentity: authority.approvedChunk.expectedObject.objectIdentity,
        mediaFormat: 'mkv',
        contentType: 'video/x-matroska',
        byteLength: stored.byteLength,
        sha256: stored.sha256,
        objectVersion: 1,
        assetRole: 'processed',
        rendererLayerIdentity:
          authority.approvedChunk.expectedObject.rendererLayerIdentity,
        placeholderAllowed: false,
        privateLocalCreateOnly: true,
        databaseBacked: false,
        publicDeliveryAuthorized: false,
      }
      const runtimeEvidence =
        buildProfessionalLongFormFirstObjectChunkRenderEvidence({
          authority,
          authorization,
          executionAttempt,
          sourceReadEvidenceHashes: staged.sources.map((source) =>
            source.sourceReadEvidenceHash),
          sourceStagingEvidenceHashes: staged.sources.map((source) =>
            source.stagingEvidenceHash),
          sourceSha256s: staged.sources.map((source) => source.sha256),
          capacityEvidenceHash: staged.capacityEvidenceHash,
          outputArtifact,
          runtime: {
            requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
            binaryVersion: result.evidence.binaryVersion,
            imageIdentityHash: result.image.imageIdentityHash,
            attestationRecordId: result.attestation.recordId,
            attestationHash: result.attestation.attestationHash,
            networkMode: result.evidence.confinement.networkMode,
            containerExitCode: result.evidence.containerExitCode,
            oomKilled: result.evidence.oomKilled,
          },
          completedAt: result.attestation.completedAt,
        })
      const runtimeEvidenceRef = await persistExactJson({
        context: input.context,
        value: runtimeEvidence,
        parse: (value) =>
          professionalLongFormFirstObjectChunkRenderEvidenceSchema.parse(value),
      })
      const leasedCurrent = {
        ...input.current,
        queueAggregate: begun.aggregate,
      }
      const reconciliation =
        buildProfessionalLongFormFirstObjectChunkRenderReconciliation({
          current: leasedCurrent,
          authority,
          authorization,
          executionAttempt,
          outputArtifact,
          runtimeEvidenceRef,
          reconciledAt: new Date().toISOString(),
        })
      const reconciliationRef = await persistExactJson({
        context: input.context,
        value: reconciliation,
        parse: (value) =>
          professionalLongFormFirstObjectChunkRenderReconciliationSchema.parse(
            value,
          ),
      })
      const canonicalResultHash =
        professionalLongFormFirstObjectChunkRenderResultHash({
          authority,
          executionAttempt,
          outputArtifact,
          runtimeEvidenceRef,
          reconciliationEvidenceRef: reconciliationRef,
        })
      const finalizedCost = await costMeter.finalize({
        status: 'completed',
        failureCategory: 'none',
        outputByteLength: outputArtifact.byteLength,
        linkedCanonicalOutcomeHash: canonicalResultHash,
      })
      costFinalized = true
      assertCostEvidence({
        evidence: finalizedCost.evidence,
        toolId: 'ffmpeg',
        operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
        workloadProfileId:
          PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
        authority,
        executionAttempt,
        canonicalResultHash,
      })
      const terminal =
        buildProfessionalLongFormFirstObjectChunkRenderTerminal({
          authority,
          authorization,
          executionAttempt,
          outputArtifact,
          runtimeEvidenceRef,
          reconciliationEvidenceRef: reconciliationRef,
          canonicalResultHash,
          attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
          completedAt: new Date().toISOString(),
        })
      const terminalRef = await persistExactJson({
        context: input.context,
        value: terminal,
        parse: (value) =>
          professionalLongFormFirstObjectChunkRenderTerminalSchema.parse(value),
      })
      const completion =
        buildProfessionalLongFormFirstObjectChunkRenderCompletion({
          authority,
          authorization,
          executionAttempt,
          canonicalResultHash,
          attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
          outputArtifact,
          runtimeEvidenceRef,
          reconciliationEvidenceRef: reconciliationRef,
          terminalEvidenceRef: terminalRef,
        })
      const definition = claim.entry.definition
      const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
        scope: input.current.scope,
        definition: input.current.queueDefinition,
        jobId: authority.identity.jobId,
        claimId: claim.entry.activeClaim.claimId,
        claimCredential: claim.claimCredential,
        outcome: {
          jobId: definition.jobId,
          approvedWorkItemId: definition.approvedWorkItemId,
          workItemKey: definition.workItemKey,
          required: definition.required,
          dependencyJobIds: [...definition.dependencyJobIds],
          status: 'completed_private_test',
          artifactId: outputArtifact.objectIdentity,
          contentType: outputArtifact.contentType,
          sha256: outputArtifact.sha256,
          adapterReplayed: false,
          blockedDependencyJobIds: [],
          professionalLongFormExecution: completion,
        },
        now: new Date().toISOString(),
      })
      return {
        authority,
        authorityRef,
        authorization,
        executionAttempt,
        runtimeEvidence,
        runtimeEvidenceRef,
        outputArtifact,
        reconciliation,
        reconciliationRef,
        costEvidence: finalizedCost.evidence,
        terminal,
        terminalRef,
        queueAggregate: aggregate,
      }
    } finally {
      await staged.cleanup()
    }
  } catch (error) {
    if (!costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      })
    }
    throw error
  }
}

async function executeQa(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
}): Promise<CompletedQaEvidence> {
  const authority = buildProfessionalLongFormFirstObjectChunkQaAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify(value) {
      return assertProfessionalLongFormFirstObjectChunkQaAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
      })
    },
  })
  const authorization = buildProfessionalLongFormFirstObjectChunkQaAuthorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity:
      'canonical-professional-long-form-first-object-chunk-qa-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`First object-chunk QA claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt =
    professionalLongFormFirstObjectChunkQaAttemptSchema.parse(
      begun.executionAttempt,
    )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    editSessionId: authority.identity.editSessionId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobId: authority.identity.jobId,
    executionAttemptId: executionAttempt.executionAttemptId,
    retryAttempt: executionAttempt.deliveryAttempt,
    toolId: 'ffprobe',
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  })
  let costFinalized = false
  try {
    const stored = await inspectCanonicalPrivateMediaArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash: authority.renderArtifact.objectIdentity,
    })
    if (
      !stored || stored.mediaFormat !== 'mkv' ||
      stored.byteLength !== authority.renderArtifact.byteLength ||
      stored.sha256 !== authority.renderArtifact.sha256
    ) throw invalid('First object-chunk QA could not reopen the exact render artifact.')
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const result = await runtime.executeServerInjected(
      validateOfflineFfprobeStreamingExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
        toolId: 'ffprobe',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        payload: {
          inspectionProfileId: 'object_mezzanine_chunk_qa_v1',
          countFrames: true,
          verifyDurationAndSync: true,
          emitMachineJsonOnly: true,
          mimeType: 'video/x-matroska',
          sourceByteLength: stored.byteLength,
          sourceSha256: stored.sha256,
          sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
        },
      }),
      {
        inputMode: 'private_verified_stream_v1',
        byteLength: stored.byteLength,
        sha256: stored.sha256,
        openStream: stored.openStream,
      },
    )
    const rawProbeResultRef = await persistExactJson({
      context: input.context,
      value: result.resultJson.document,
      parse: (value) => value as Readonly<Record<string, unknown>>,
    })
    const runtimeReceipt =
      professionalLongFormFirstObjectChunkQaRuntimeReceipt(result)
    const probeRuntimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeReceipt,
      parse: (value) => value as typeof runtimeReceipt,
    })
    const artifact = buildProfessionalLongFormFirstObjectChunkQaArtifact({
      authority,
      authorization,
      executionAttempt,
      rawProbeResultRef,
      probeRuntimeEvidenceRef,
      result,
      evaluatedAt: new Date().toISOString(),
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormFirstObjectChunkQaArtifactSchema.parse(value),
    })
    const leasedCurrent = { ...input.current, queueAggregate: begun.aggregate }
    const reconciliation =
      buildProfessionalLongFormFirstObjectChunkQaReconciliation({
        current: leasedCurrent,
        authority,
        authorization,
        executionAttempt,
        qaArtifactRef: artifactRef,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormFirstObjectChunkQaReconciliationSchema.parse(value),
    })
    const canonicalResultHash =
      professionalLongFormFirstObjectChunkQaResultHash({
        authority,
        executionAttempt,
        qaArtifactRef: artifactRef,
        reconciliationEvidenceRef: reconciliationRef,
      })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: artifactRef.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      toolId: 'ffprobe',
      operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
      workloadProfileId:
        PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
      authority,
      executionAttempt,
      canonicalResultHash,
    })
    const terminal = buildProfessionalLongFormFirstObjectChunkQaTerminal({
      authority,
      authorization,
      executionAttempt,
      qaArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormFirstObjectChunkQaTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormFirstObjectChunkQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: authority.identity.expectedOutputIdentity,
        contentType: 'application/json',
        sha256: artifactRef.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      artifact,
      artifactRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      })
    }
    throw error
  }
}

async function loadCompletedRender(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
}): Promise<CompletedRenderEvidence> {
  const authority = buildProfessionalLongFormFirstObjectChunkRenderAuthority(input)
  const authorityRef = await findAndVerifyAuthorityRef({
    context: input.context,
    entry: firstRenderEntry(input.current),
    authority,
    verify(value) {
      return assertProfessionalLongFormFirstObjectChunkRenderAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
      })
    },
  })
  const authorization =
    buildProfessionalLongFormFirstObjectChunkRenderAuthorization({
      authority,
      authorityRef,
    })
  const entry = firstRenderEntry(input.current)
  const attempt = professionalLongFormFirstObjectChunkRenderAttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion =
    professionalLongFormFirstObjectChunkRenderCompletionSchema.parse(
      entry.completion?.outcome.professionalLongFormExecution,
    )
  assertStoredAuthorization(entry, authorization)
  const runtimeEvidence = await readParsedJson({
    context: input.context,
    ref: completion.runtimeEvidenceRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkRenderEvidenceSchema.parse(value),
  })
  assertHashed(runtimeEvidence, 'artifactHash')
  const output = await inspectCanonicalPrivateMediaArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: completion.outputArtifact.objectIdentity,
  })
  if (
    !output || output.mediaFormat !== 'mkv' ||
    output.byteLength !== completion.outputArtifact.byteLength ||
    output.sha256 !== completion.outputArtifact.sha256 ||
    entry.completion?.outcome.sha256 !== completion.outputArtifact.sha256
  ) throw invalid('Replayed first object-chunk media artifact changed.')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkRenderReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormFirstObjectChunkRenderReconciliation({
      current: input.current,
      authority,
      authorization,
      executionAttempt: attempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedRender: true,
      allowCompletedQa: true,
    })
  assertExact(reconciliation, expectedReconciliation,
    'Replayed first object-chunk render reconciliation changed.')
  const canonicalResultHash =
    professionalLongFormFirstObjectChunkRenderResultHash({
      authority,
      executionAttempt: attempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt: attempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkRenderTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormFirstObjectChunkRenderTerminal({
    authority,
    authorization,
    executionAttempt: attempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal,
    'Replayed first object-chunk render terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1
  ) throw invalid('Replayed first object-chunk render queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt: attempt,
    runtimeEvidence,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    outputArtifact: completion.outputArtifact,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadCompletedQa(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
}): Promise<CompletedQaEvidence> {
  const authority = buildProfessionalLongFormFirstObjectChunkQaAuthority(input)
  const entry = pairedQaEntry(input.current)
  const authorityRef = await findAndVerifyAuthorityRef({
    context: input.context,
    entry,
    authority,
    verify(value) {
      return assertProfessionalLongFormFirstObjectChunkQaAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
      })
    },
  })
  const authorization = buildProfessionalLongFormFirstObjectChunkQaAuthorization({
    authority,
    authorityRef,
  })
  assertStoredAuthorization(entry, authorization)
  const attempt = professionalLongFormFirstObjectChunkQaAttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormFirstObjectChunkQaCompletionSchema.parse(
    entry.completion?.outcome.professionalLongFormExecution,
  )
  const artifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkQaArtifactSchema.parse(value),
  })
  assertHashed(artifact, 'qaHash')
  const rawProbe = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: artifact.rawProbeResultRef,
  })
  const runtimeReceipt = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: artifact.probeRuntimeEvidenceRef,
  }) as Record<string, unknown>
  const runtimeEvidence = runtimeReceipt.evidence as Record<string, unknown>
  if (
    artifact.rawProbeResultRef.sha256 !== sha256AuthorityValue(rawProbe) ||
    runtimeReceipt.resultSha256 !== artifact.rawProbeResultRef.sha256 ||
    runtimeEvidence.toolId !== 'ffprobe' ||
    runtimeEvidence.operationId !==
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID ||
    runtimeEvidence.sourceSha256 !== authority.renderArtifact.sha256 ||
    runtimeEvidence.resultSha256 !== artifact.rawProbeResultRef.sha256 ||
    runtimeEvidence.requestEnvelopeSha256 !== artifact.requestEnvelopeSha256
  ) throw invalid('Replayed first object-chunk QA runtime evidence changed.')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkQaReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormFirstObjectChunkQaReconciliation({
      current: input.current,
      authority,
      authorization,
      executionAttempt: attempt,
      qaArtifactRef: completion.validationArtifactRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedQa: true,
    })
  assertExact(reconciliation, expectedReconciliation,
    'Replayed first object-chunk QA reconciliation changed.')
  const canonicalResultHash = professionalLongFormFirstObjectChunkQaResultHash({
    authority,
    executionAttempt: attempt,
    qaArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt: attempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'ffprobe',
    operationId: PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormFirstObjectChunkQaTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormFirstObjectChunkQaTerminal({
    authority,
    authorization,
    executionAttempt: attempt,
    qaArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal,
    'Replayed first object-chunk QA terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1 ||
    entry.completion?.outcome.sha256 !== completion.validationArtifactRef.sha256
  ) throw invalid('Replayed first object-chunk QA queue evidence changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt: attempt,
    artifact,
    artifactRef: completion.validationArtifactRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

function buildRenderRequest(
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority,
  sources: Array<{
    sourceSequenceItemId: string
    mediaAssetId: string
    byteLength: number
    sha256: string
  }>,
) {
  const sourceById = new Map(sources.map((source, index) => [
    source.sourceSequenceItemId,
    { source, index },
  ]))
  const commitments = uniqueSourceIds(authority).map((sourceId) => {
    const resolved = sourceById.get(sourceId)
    const slice = authority.approvedChunk.sourceSlices.find((candidate) =>
      candidate.sourceSequenceItemId === sourceId)
    if (!resolved || !slice || resolved.source.sha256 !== slice.sourceSha256 ||
      resolved.source.mediaAssetId !== slice.mediaAssetId) {
      throw invalid('Staged source changed from approved first-chunk authority.')
    }
    return {
      inputId: `approved-source-${resolved.index + 1}`,
      sourceSequenceItemId: sourceId,
      mediaAssetId: resolved.source.mediaAssetId,
      sourceObjectGeneration: slice.sourceObjectGeneration,
      mimeType: 'video/mp4' as const,
      byteLength: resolved.source.byteLength,
      sha256: resolved.source.sha256,
    }
  })
  return buildOfflineMediaBinaryObjectMezzanineChunkRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE,
      chunkId: authority.approvedChunk.chunkId,
      chunkAuthorityHash: authority.approvedChunk.chunkAuthorityHash,
      expectedObjectIdentity:
        authority.approvedChunk.expectedObject.objectIdentity,
      chunkIndex: 1,
      chunkCount: authority.approvedChunk.chunkCount,
      width: authority.approvedChunk.width,
      height: authority.approvedChunk.height,
      fps: 30,
      durationFrames: authority.approvedChunk.durationFrames,
      globalStartFrame: 0,
      globalEndFrameExclusive:
        authority.approvedChunk.globalEndFrameExclusive,
      sourceSlices: authority.approvedChunk.sourceSlices,
      videoAssemblyPolicy: 'compatible_h264_mp4_slice_concat_stream_copy_v1',
      audioPolicy: 'separate_continuous_program_audio_v1',
      codecCompatibilityPolicy: 'exact_h264_extradata_frame_color_v1',
      timestampPolicy: 'normalize_from_zero',
      outputContainer: 'matroska',
      outputVideoCodec: 'copy_h264',
      outputPixelFormat: 'yuv420p',
      outputColorSpace: 'bt709',
      renderPurpose: 'private_4k_object_mezzanine_chunk_v1',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
    },
    sources: commitments,
  })
}

function assertRenderRuntimeResult(input: {
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority
  stagedSources: Array<{ sha256: string }>
  result: Awaited<ReturnType<Awaited<ReturnType<
    typeof openPrivateOfflineMediaBinaryRuntime
  >>['executeObjectMezzanineChunkServerInjected']>>
}): void {
  const semantic = input.result.evidence.semanticEvidence
  if (
    input.result.evidence.toolId !== 'ffmpeg' ||
    input.result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID ||
    stableAuthorityStringify(input.result.evidence.sourceSha256s) !==
      stableAuthorityStringify(input.stagedSources.map((source) => source.sha256)) ||
    input.result.evidence.resultSha256 !== input.result.resultArtifact.sha256 ||
    input.result.evidence.containerExitCode !== 0 || input.result.evidence.oomKilled ||
    input.result.resultArtifact.mimeType !== 'video/x-matroska' ||
    semantic.fixedRecipeExecuted !== true ||
    semantic.expectedObjectIdentity !==
      input.authority.approvedChunk.expectedObject.objectIdentity ||
    semantic.h264VideoStreamCopiedWithoutDecodeOrReencode !== true ||
    semantic.h264Mp4SliceConcatCompatibilityVerified !== true ||
    semantic.outputAudioStreams !== 0 ||
    semantic.outputProbeVerified !== true ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    input.result.readiness.productReady
  ) throw invalid('First object-chunk runtime evidence failed exact verification.')
}

async function currentAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
) {
  return createCanonicalProfessionalLongFormChildPackagePromotionService(
    context,
  ).loadCurrent(input)
}

function firstRenderEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const entry = current.queueAggregate.entries[3]
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.jobId === entry?.definition.jobId)
  if (
    !entry || entry.definition.canonicalOrder !== 3 ||
    job?.kind !== 'render_object_mezzanine_chunk'
  ) throw invalid('Canonical queue lost the first object-chunk render identity.')
  return entry
}

function pairedQaEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
) {
  const render = firstRenderEntry(current)
  const entry = current.queueAggregate.entries[4]
  const job = current.postApproval.childJobManifest.jobs.find((candidate) =>
    candidate.jobId === entry?.definition.jobId)
  if (
    !entry || entry.definition.canonicalOrder !== 4 ||
    job?.kind !== 'qa_object_mezzanine_chunk' ||
    entry.definition.dependencyJobIds.length !== 1 ||
    entry.definition.dependencyJobIds[0] !== render.definition.jobId
  ) throw invalid('Canonical queue lost the paired first object-chunk QA identity.')
  return entry
}

function uniqueSourceIds(
  authority: ProfessionalLongFormFirstObjectChunkRenderAuthority,
): string[] {
  return [...new Set(authority.approvedChunk.sourceSlices.map((slice) =>
    slice.sourceSequenceItemId))]
}

async function persistAuthority<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  authority: T
  verify(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verified = input.verify(value)
  assertExact(verified, input.authority, 'Persisted execution authority changed.')
  return ref
}

async function persistExactJson<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  value: T
  parse(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value,
  })
  const parsed = await readParsedJson({
    context: input.context,
    ref,
    parse: input.parse,
  })
  assertExact(parsed, input.value, 'Persisted first object-chunk JSON changed.')
  return ref
}

async function readParsedJson<T>(input: {
  context: ServiceContext
  ref: AuthorityJsonBlobRef
  parse(value: unknown): T
}): Promise<T> {
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: input.ref,
  })
  const parsed = input.parse(value)
  if (input.ref.sha256 !== sha256AuthorityValue(parsed)) {
    throw invalid('First object-chunk content-addressed JSON checksum changed.')
  }
  return parsed
}

async function findAndVerifyAuthorityRef<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  entry: ReturnType<typeof firstRenderEntry> | ReturnType<typeof pairedQaEntry>
  authority: T
  verify(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = input.entry.professionalLongFormExecutionAuthorization?.authorityRef
  if (!ref) throw invalid('Completed first object-chunk job lost its authority ref.')
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verified = input.verify(value)
  assertExact(verified, input.authority, 'Replayed execution authority changed.')
  return ref
}

function assertStoredAuthorization(
  entry: ReturnType<typeof firstRenderEntry> | ReturnType<typeof pairedQaEntry>,
  authorization:
    | ProfessionalLongFormFirstObjectChunkRenderAuthorization
    | ProfessionalLongFormFirstObjectChunkQaAuthorization,
): void {
  if (
    !entry.professionalLongFormExecutionAuthorization ||
    stableAuthorityStringify(entry.professionalLongFormExecutionAuthorization) !==
      stableAuthorityStringify(authorization)
  ) throw invalid('Stored first object-chunk authorization changed.')
}

async function requiredCostEvidence(input: {
  context: ServiceContext
  authority:
    | ProfessionalLongFormFirstObjectChunkRenderAuthority
    | ProfessionalLongFormFirstObjectChunkQaAuthority
  executionAttempt:
    | ProfessionalLongFormFirstObjectChunkRenderAttempt
    | ProfessionalLongFormFirstObjectChunkQaAttempt
  canonicalResultHash: string
  expectedHash: string
  toolId: 'ffmpeg' | 'ffprobe'
  operationId: string
  workloadProfileId: string
}) {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('First object-chunk internal attempt cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  toolId: 'ffmpeg' | 'ffprobe'
  operationId: string
  workloadProfileId: string
  authority:
    | ProfessionalLongFormFirstObjectChunkRenderAuthority
    | ProfessionalLongFormFirstObjectChunkQaAuthority
  executionAttempt:
    | ProfessionalLongFormFirstObjectChunkRenderAttempt
    | ProfessionalLongFormFirstObjectChunkQaAttempt
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== input.toolId ||
    input.evidence.identity.operationId !== input.operationId ||
    !('workloadProfileId' in input.evidence.identity) ||
    input.evidence.identity.workloadProfileId !== input.workloadProfileId ||
    input.evidence.identity.jobId !== input.authority.identity.jobId ||
    input.evidence.identity.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.canonicalResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    serialized.includes('customerPrice') ||
    serialized.includes('customerCredit') ||
    serialized.includes('serviceFee') || serialized.includes('wallet') ||
    serialized.includes('billingAuthority')
  ) throw invalid('First object-chunk internal cost crossed a commercial boundary.')
}

function assertUnexpired(value: string): void {
  if (Date.parse(value) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'First object-chunk execution requires an unexpired funded reservation.',
      409,
    )
  }
}

function assertHashed<T extends string>(
  value: Record<T, string> & Record<string, unknown>,
  key: T,
): void {
  const payload = { ...value }
  const expected = payload[key]
  delete payload[key]
  if (expected !== sha256AuthorityValue(payload)) {
    throw invalid(`First object-chunk ${key} checksum changed.`)
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw invalid(message)
  }
}

function withoutAggregate<T extends { queueAggregate: unknown }>(value: T) {
  const { queueAggregate: _queueAggregate, ...rest } = value
  return rest
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_professional_long_form_first_object_chunk_and_independent_qa',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
