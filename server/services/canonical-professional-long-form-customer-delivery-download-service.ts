import { ApiError } from '../errors/api-error'
import type {
  ObjectiveDecodedAudioQualitySyncEvidence,
  ObjectiveDecodedVideoIntegrityEvidence,
} from '../final-master-qa/objective-final-master-qa-types'
import {
  buildProfessionalLongFormDeliveryDownloadArtifact,
  buildProfessionalLongFormDeliveryDownloadAuthority,
  buildProfessionalLongFormDeliveryDownloadAuthorization,
  buildProfessionalLongFormDeliveryDownloadCompletion,
  buildProfessionalLongFormDeliveryDownloadReconciliation,
  buildProfessionalLongFormDeliveryDownloadTerminal,
  buildProfessionalLongFormDeliveryQualityDecision,
  buildProfessionalLongFormDeliveryQualityReviewPacket,
  type ProfessionalLongFormDeliveryCompletedDecodedQaSet,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_RECORD_VERSION,
  professionalLongFormDeliveryDownloadArtifactSchema,
  professionalLongFormDeliveryDownloadAttemptSchema,
  professionalLongFormDeliveryDownloadAuthoritySchema,
  professionalLongFormDeliveryDownloadAuthorizationSchema,
  professionalLongFormDeliveryDownloadCompletionSchema,
  professionalLongFormDeliveryDownloadReconciliationSchema,
  professionalLongFormDeliveryDownloadTerminalSchema,
  professionalLongFormDeliveryQualityDecisionRecordSchema,
  recordProfessionalLongFormDeliveryQualityDecisionSchema,
  type ProfessionalLongFormDeliveryDownloadArtifact,
  type ProfessionalLongFormDeliveryDownloadAttempt,
  type ProfessionalLongFormDeliveryDownloadAuthority,
  type ProfessionalLongFormDeliveryDownloadAuthorization,
  type ProfessionalLongFormDeliveryDownloadCompletion,
  type ProfessionalLongFormDeliveryDownloadReconciliation,
  type ProfessionalLongFormDeliveryDownloadTerminal,
  type ProfessionalLongFormDeliveryQualityDecisionRecord,
  type ProfessionalLongFormDeliveryQualityReviewPacket,
  type RecordProfessionalLongFormDeliveryQualityDecision,
} from '../edit-architecture/professional-long-form-customer-delivery-download-execution-contract'
import {
  professionalLongFormDeliveryDecodedAudioQaArtifactSchema,
  professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
  professionalLongFormDeliveryDecodedVideoQaArtifactSchema,
  professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
} from '../edit-architecture/professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  professionalLongFormDeliveryMuxCompletionSchema,
} from '../edit-architecture/professional-long-form-customer-delivery-mux-execution-contract'
import type {
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from '../edit-architecture/professional-long-form-customer-delivery-execution'
import {
  readPrivateFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  beginPrivateInternalAttemptCostEvidence,
  classifyPrivateInternalAttemptCostFailure,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import type {
  CanonicalPrivatePackageWorkQueueAggregate,
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  authorizePrivateCanonicalPackageWorkQueueJob,
  beginPrivateCanonicalPackageWorkQueueExecutionAttempt,
  claimPrivateCanonicalPackageWorkQueueJob,
  completePrivateCanonicalPackageWorkQueueClaim,
  heartbeatPrivateCanonicalPackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryPackageService,
} from './canonical-professional-long-form-customer-delivery-package-service'
import {
  inspectCanonicalPrivateCustomerDeliveryArtifact,
  type CanonicalPrivateCustomerDeliveryArtifactInspection,
} from './canonical-private-customer-delivery-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DOWNLOAD_SERVICE_VERSION =
  'canonical-professional-long-form-customer-delivery-download-service-v1' as const

interface ExactPackageInput {
  workspaceId: string
  approvedPlanSnapshotId: string
  packageRecordId: string
}

interface LoadedCustomerDeliveryAuthority extends
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
}

interface CompletedDownloadEvidence {
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryDownloadAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDownloadAttempt
  artifact: ProfessionalLongFormDeliveryDownloadArtifact
  artifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryDownloadReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryDownloadTerminal
  terminalRef: AuthorityJsonBlobRef
  completion: ProfessionalLongFormDeliveryDownloadCompletion
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormDeliveryQualityReviewEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DOWNLOAD_SERVICE_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_download_service'
  status:
    | 'quality_review_required_private_download_blocked'
    | 'quality_decision_already_recorded'
  reviewPacket: ProfessionalLongFormDeliveryQualityReviewPacket
  decisionRecord: ProfessionalLongFormDeliveryQualityDecisionRecord | null
  readiness: ReturnType<typeof reviewReadiness>
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormDeliveryQualityDecisionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DOWNLOAD_SERVICE_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_download_service'
  status:
    | 'revision_requested_private_download_closed'
    | 'quality_accepted_private_download_reconciled'
  disposition: 'recorded' | 'exact_replay'
  decisionRecord: ProfessionalLongFormDeliveryQualityDecisionRecord
  download: CompletedDownloadEvidence | null
  readiness: ReturnType<typeof decisionReadiness>
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormCustomerDeliveryDownloadService(
  context: ServiceContext,
) {
  return {
    async inspectQualityReview(
      input: ExactPackageInput,
    ): Promise<CanonicalProfessionalLongFormDeliveryQualityReviewEvidence> {
      assertPrivateRuntime(context)
      const ownerUserId = await requireWorkspaceActor(context, input.workspaceId, 'read')
      const current = await loadExactCurrent(context, ownerUserId, input)
      const existing = await readDecisionRecord({
        context,
        ownerUserId,
        input,
      })
      const reviewPacket = existing?.reviewPacket ??
        await buildCurrentReviewPacket(context, current)
      const accepted = existing?.decision.decision ===
        'accept_exact_private_customer_delivery'
      const downloadComplete = accepted && downloadEntry(current).state === 'completed'
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DOWNLOAD_SERVICE_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_download_service' as const,
        status: existing
          ? 'quality_decision_already_recorded' as const
          : 'quality_review_required_private_download_blocked' as const,
        reviewPacket,
        decisionRecord: existing ?? null,
        readiness: reviewReadiness({
          decisionRecorded: Boolean(existing),
          downloadAuthorized: accepted,
          downloadComplete,
          revisionRequired: existing?.decision.decision ===
            'request_customer_delivery_revision',
        }),
      }
      return { ...payload, evidenceHash: sha256AuthorityValue(payload) }
    },

    async recordQualityDecision(input: ExactPackageInput & {
      idempotencyKey: string
      decisionRequest: RecordProfessionalLongFormDeliveryQualityDecision
    }): Promise<CanonicalProfessionalLongFormDeliveryQualityDecisionEvidence> {
      assertPrivateRuntime(context)
      const ownerUserId = await requireWorkspaceActor(context, input.workspaceId, 'write')
      const request = recordProfessionalLongFormDeliveryQualityDecisionSchema
        .parse(input.decisionRequest)
      assertDecisionInput(input, request)
      const idempotencyKeyHash = hashIdempotencyKey(input.idempotencyKey)
      const decisionRequestHash = sha256AuthorityValue(request)
      const current = await loadExactCurrent(context, ownerUserId, input)
      const persisted = await withPrivateCooperativeFileLockWithinRoot({
        rootPath: context.env.localStorageRoot,
        relativePath: decisionLockPath(ownerUserId, input),
        operation: async () => {
          const existing = await readDecisionRecord({
            context,
            ownerUserId,
            input,
          })
          if (existing) {
            if (
              existing.idempotencyKeyHash !== idempotencyKeyHash ||
              existing.decisionRequestHash !== decisionRequestHash
            ) throw conflict(
              'A different immutable quality decision already exists for this customer-delivery package.',
            )
            return { record: existing, disposition: 'exact_replay' as const }
          }
          const packet = await buildCurrentReviewPacket(context, current)
          const decision = validationBoundary(() =>
            buildProfessionalLongFormDeliveryQualityDecision({
              ownerUserId,
              packet,
              request,
              decidedAt: new Date().toISOString(),
            }))
          const recordPayload = {
            schemaVersion:
              PROFESSIONAL_LONG_FORM_DELIVERY_QUALITY_DECISION_RECORD_VERSION,
            source:
              'canonical_professional_long_form_customer_delivery_download_service' as const,
            identity: {
              ownerUserId,
              workspaceId: input.workspaceId,
              approvedPlanSnapshotId: input.approvedPlanSnapshotId,
              packageRecordId: input.packageRecordId,
            },
            idempotencyKeyHash,
            decisionRequestHash,
            reviewPacket: packet,
            decision,
            privateLocalCreateOnly: true as const,
            databaseBacked: false as const,
            productionDurabilityProven: false as const,
          }
          const record = professionalLongFormDeliveryQualityDecisionRecordSchema
            .parse({
              ...recordPayload,
              recordHash: sha256AuthorityValue(recordPayload),
            })
          await persistDecisionRecord({ context, ownerUserId, input, record })
          return { record, disposition: 'recorded' as const }
        },
      })
      const revision = persisted.record.decision.decision ===
        'request_customer_delivery_revision'
      const download = revision
        ? null
        : await executeOrLoadDownload({
            context,
            ownerUserId,
            current: await loadExactCurrent(context, ownerUserId, input),
            record: persisted.record,
          })
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DOWNLOAD_SERVICE_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_download_service' as const,
        status: revision
          ? 'revision_requested_private_download_closed' as const
          : 'quality_accepted_private_download_reconciled' as const,
        disposition: persisted.disposition,
        decisionRecord: persisted.record,
        download,
        readiness: decisionReadiness(!revision),
      }
      return { ...payload, evidenceHash: sha256AuthorityValue(payload) }
    },

    async readQualityReviewMedia(input: ExactPackageInput & {
      expectedReviewPacketHash: string
      expectedMasterSha256: string
    }) {
      assertPrivateRuntime(context)
      const ownerUserId = await requireWorkspaceActor(
        context,
        input.workspaceId,
        'read',
      )
      const current = await loadExactCurrent(context, ownerUserId, input)
      const existing = await readDecisionRecord({
        context,
        ownerUserId,
        input,
      })
      const reviewPacket = existing?.reviewPacket ??
        await buildCurrentReviewPacket(context, current)
      if (
        reviewPacket.packetHash !== input.expectedReviewPacketHash ||
        reviewPacket.master.sha256 !== input.expectedMasterSha256
      ) throw conflict(
        'Quality-review media expectation does not match the exact immutable review packet.',
      )
      const stored = await inspectExactReviewMaster(context, reviewPacket)
      return {
        schemaVersion:
          'canonical-professional-long-form-quality-review-media-v1' as const,
        source:
          'canonical_professional_long_form_customer_delivery_download_service' as const,
        reviewPacketHash: reviewPacket.packetHash,
        mimeType: 'video/mp4' as const,
        fileName: 'reeditpro-private-customer-delivery-review.mp4',
        byteSize: stored.byteLength,
        sha256: stored.sha256,
        openStream: stored.openStream,
        entireProgramPlaybackRequiredBeforeAcceptance: true as const,
        privateDownloadExecutionAuthorized: false as const,
        publicUrlCreated: false as const,
        signedUrlCreated: false as const,
        publicDeliveryAuthorized: false as const,
        customerCreditsMutated: false as const,
        productReady: false as const,
        productionReady: false as const,
      }
    },

    async readPrivateDownload(input: ExactPackageInput & {
      expectedQualityDecisionHash: string
      expectedMasterSha256: string
    }) {
      assertPrivateRuntime(context)
      const ownerUserId = await requireWorkspaceActor(context, input.workspaceId, 'read')
      const current = await loadExactCurrent(context, ownerUserId, input)
      const record = await readDecisionRecord({ context, ownerUserId, input })
      if (
        !record ||
        record.decision.decision !==
          'accept_exact_private_customer_delivery' ||
        record.decision.decisionHash !== input.expectedQualityDecisionHash ||
        record.reviewPacket.master.sha256 !== input.expectedMasterSha256
      ) throw denied(
        'Private customer-delivery download requires the exact accepted quality decision.',
      )
      const completed = await loadCompletedDownload({
        context,
        current,
        record,
      })
      const stored = await inspectExactMaster(context, completed.authority)
      return {
        schemaVersion:
          'canonical-professional-long-form-private-download-file-v1' as const,
        source:
          'canonical_professional_long_form_customer_delivery_download_service' as const,
        privateDownloadDeliveryId:
          completed.artifact.identity.privateDownloadDeliveryId,
        qualityDecisionHash: record.decision.decisionHash,
        mimeType: 'video/mp4' as const,
        fileName: completed.artifact.delivery.fileName,
        byteSize: stored.byteLength,
        sha256: stored.sha256,
        openStream: stored.openStream,
        originalApprovedFourKEstimateReused: true as const,
        secondExportEstimateCreated: false as const,
        secondExportChargeCreated: false as const,
        customerCreditsMutated: false as const,
        publicUrlCreated: false as const,
        externalDownloadLinkCreated: false as const,
        publicDeliveryAuthorized: false as const,
        productReady: false as const,
        productionReady: false as const,
      }
    },
  }
}

async function executeOrLoadDownload(input: {
  context: ServiceContext
  ownerUserId: string
  current: LoadedCustomerDeliveryAuthority
  record: ProfessionalLongFormDeliveryQualityDecisionRecord
}): Promise<CompletedDownloadEvidence> {
  const entry = downloadEntry(input.current)
  if (entry.state === 'completed') {
    return loadCompletedDownload(input)
  }
  if (entry.state === 'leased') {
    throw inProgress('Private customer-delivery download reconciliation has an active lease.')
  }
  let authority: ProfessionalLongFormDeliveryDownloadAuthority
  let authorityRef: AuthorityJsonBlobRef
  let authorization: ProfessionalLongFormDeliveryDownloadAuthorization
  if (entry.professionalLongFormExecutionAuthorization) {
    authorization = professionalLongFormDeliveryDownloadAuthorizationSchema
      .parse(entry.professionalLongFormExecutionAuthorization)
    authorityRef = authorization.authorityRef
    authority = professionalLongFormDeliveryDownloadAuthoritySchema.parse(
      await readPrivateAuthorityJsonBlob({
        localStorageRoot: input.context.env.localStorageRoot,
        ref: authorityRef,
      }),
    )
    assertAuthorityRecordMatch(authority, authorization, input.record)
  } else {
    authority = validationBoundary(() =>
      buildProfessionalLongFormDeliveryDownloadAuthority({
        ownerUserId: input.ownerUserId,
        current: input.current,
        packet: input.record.reviewPacket,
        decision: input.record.decision,
        authorizedAt: new Date().toISOString(),
      }))
    authorityRef = await persistExactJson({
      context: input.context,
      value: authority,
      parse: (value) =>
        professionalLongFormDeliveryDownloadAuthoritySchema.parse(value),
      error: 'Persisted private-download execution authority changed.',
    })
    authorization = buildProfessionalLongFormDeliveryDownloadAuthorization({
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
  }
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity:
      'canonical-professional-long-form-customer-delivery-download-v1',
    workerType: 'api_service',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition === 'completed') {
    return loadCompletedDownload({
      ...input,
      current: { ...input.current, queueAggregate: claim.aggregate },
    })
  }
  if (claim.disposition !== 'claimed') {
    throw inProgress(
      `Private customer-delivery download claim remained ${claim.disposition}.`,
    )
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormDeliveryDownloadAttemptSchema
    .parse(begun.executionAttempt)
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
    toolId: 'reeditpro_internal',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID,
  })
  let costFinalized = false
  try {
    const heartbeatAggregate =
      await heartbeatPrivateCanonicalPackageWorkQueueClaim({
        scope: input.current.scope,
        definition: input.current.queueDefinition,
        jobId: authority.identity.jobId,
        claimId: claim.entry.activeClaim.claimId,
        claimCredential: claim.claimCredential,
        now: new Date().toISOString(),
        leaseDurationMs: authority.operation.leaseDurationMilliseconds,
      })
    assertDurableHeartbeat(heartbeatAggregate, authority, executionAttempt)
    await inspectExactMaster(input.context, authority)
    const artifact = buildProfessionalLongFormDeliveryDownloadArtifact({
      authority,
      attempt: executionAttempt,
      reconciledAt: new Date().toISOString(),
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormDeliveryDownloadArtifactSchema.parse(value),
      error: 'Persisted private-download artifact changed.',
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: artifactRef.byteLength,
      linkedCanonicalOutcomeHash: artifactRef.sha256,
    })
    costFinalized = true
    assertDownloadCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      artifactRef,
    })
    const reconciliation =
      buildProfessionalLongFormDeliveryDownloadReconciliation({
        authority,
        attempt: executionAttempt,
        artifact,
        artifactRef,
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryDownloadReconciliationSchema.parse(value),
      error: 'Persisted private-download reconciliation changed.',
    })
    const canonicalResultHash = sha256AuthorityValue({
      domain:
        'canonical_professional_long_form_customer_delivery_download_result_v1',
      authorityHash: authority.authorityHash,
      executionAttemptHash: executionAttempt.attemptHash,
      downloadArtifactRef: artifactRef,
      downloadArtifactHash: artifact.artifactHash,
      reconciliationEvidenceRef: reconciliationRef,
      reconciliationHash: reconciliation.reconciliationHash,
    })
    const terminal = buildProfessionalLongFormDeliveryDownloadTerminal({
      authority,
      authorization,
      attempt: executionAttempt,
      artifactRef,
      reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryDownloadTerminalSchema.parse(value),
      error: 'Persisted private-download terminal evidence changed.',
    })
    const completion = buildProfessionalLongFormDeliveryDownloadCompletion({
      authority,
      authorization,
      attempt: executionAttempt,
      artifact,
      artifactRef,
      reconciliationRef,
      terminalRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
    })
    const definition = claim.entry.definition
    const queueAggregate =
      await completePrivateCanonicalPackageWorkQueueClaim({
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
          artifactId: artifact.identity.privateDownloadDeliveryId,
          contentType: 'application/json',
          sha256: artifactRef.sha256,
          adapterReplayed: false,
          blockedDependencyJobIds: [],
          professionalLongFormExecution: completion,
        },
        now: new Date().toISOString(),
      })
    assertCompletedGraph(queueAggregate, input.current)
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
      completion,
      queueAggregate,
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

async function loadCompletedDownload(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  record: ProfessionalLongFormDeliveryQualityDecisionRecord
}): Promise<CompletedDownloadEvidence> {
  const entry = downloadEntry(input.current)
  if (entry.state !== 'completed' || !entry.completion) {
    throw notReady('Private customer-delivery download reconciliation is incomplete.')
  }
  const authorization = professionalLongFormDeliveryDownloadAuthorizationSchema
    .parse(entry.professionalLongFormExecutionAuthorization)
  const executionAttempt = professionalLongFormDeliveryDownloadAttemptSchema
    .parse(entry.professionalLongFormExecutionAttempt)
  const completion = professionalLongFormDeliveryDownloadCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const authorityRef = authorization.authorityRef
  const authority = professionalLongFormDeliveryDownloadAuthoritySchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: authorityRef,
    }),
  )
  const artifactRef = completion.validationArtifactRef
  const artifact = professionalLongFormDeliveryDownloadArtifactSchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: artifactRef,
    }),
  )
  const reconciliationRef = completion.reconciliationEvidenceRef
  const reconciliation =
    professionalLongFormDeliveryDownloadReconciliationSchema.parse(
      await readPrivateAuthorityJsonBlob({
        localStorageRoot: input.context.env.localStorageRoot,
        ref: reconciliationRef,
      }),
    )
  const terminalRef = completion.terminalEvidenceRef
  const terminal = professionalLongFormDeliveryDownloadTerminalSchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: input.context.env.localStorageRoot,
      ref: terminalRef,
    }),
  )
  const costEvidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    executionAttemptId: executionAttempt.executionAttemptId,
  })
  if (!costEvidence) throw notReady(
    'Private customer-delivery download attempt cost evidence is missing.',
  )
  assertAuthorityRecordMatch(authority, authorization, input.record)
  assertDownloadCostEvidence({
    evidence: costEvidence,
    authority,
    executionAttempt,
    artifactRef,
  })
  if (
    executionAttempt.authorizationId !== authorization.authorizationId ||
    executionAttempt.authorityHash !== authority.authorityHash ||
    completion.executionAttemptId !== executionAttempt.executionAttemptId ||
    completion.authorizationId !== authorization.authorizationId ||
    completion.authorityHash !== authority.authorityHash ||
    completion.qualityDecisionHash !== input.record.decision.decisionHash ||
    completion.privateDownloadDeliveryId !==
      artifact.identity.privateDownloadDeliveryId ||
    completion.attemptInternalCostEvidenceHash !== costEvidence.evidenceHash ||
    artifact.authorityHash !== authority.authorityHash ||
    artifact.executionAttemptHash !== executionAttempt.attemptHash ||
    artifact.qualityDecisionHash !== input.record.decision.decisionHash ||
    artifact.artifactHash !== reconciliation.downloadArtifactHash ||
    reconciliation.downloadArtifactRef.sha256 !== artifactRef.sha256 ||
    terminal.canonicalResultHash !== completion.canonicalResultHash ||
    terminal.attemptInternalCostEvidenceHash !== costEvidence.evidenceHash ||
    entry.completion.outcome.artifactId !==
      artifact.identity.privateDownloadDeliveryId ||
    entry.completion.outcome.sha256 !== artifactRef.sha256
  ) throw notReady(
    'Persisted private customer-delivery download evidence lost exact lineage.',
  )
  await inspectExactMaster(input.context, authority)
  assertCompletedGraph(input.current.queueAggregate, input.current)
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    artifact,
    artifactRef,
    reconciliation,
    reconciliationRef,
    costEvidence,
    terminal,
    terminalRef,
    completion,
    queueAggregate: input.current.queueAggregate,
  }
}

async function buildCurrentReviewPacket(
  context: ServiceContext,
  current: LoadedCustomerDeliveryAuthority,
): Promise<ProfessionalLongFormDeliveryQualityReviewPacket> {
  assertReviewGraph(current.queueAggregate, current)
  const completed = await loadCompletedDecodedSet(context, current)
  return validationBoundary(() =>
    buildProfessionalLongFormDeliveryQualityReviewPacket({
      current,
      completed,
    }))
}

async function loadCompletedDecodedSet(
  context: ServiceContext,
  current: LoadedCustomerDeliveryAuthority,
): Promise<ProfessionalLongFormDeliveryCompletedDecodedQaSet> {
  const chunkCount = current.package.outputContract.chunkCount
  const muxEntry = requiredCompletedEntry(current, chunkCount * 2 + 1)
  const videoEntry = requiredCompletedEntry(current, chunkCount * 2 + 2)
  const audioEntry = requiredCompletedEntry(current, chunkCount * 2 + 3)
  const muxCompletion = professionalLongFormDeliveryMuxCompletionSchema.parse(
    muxEntry.completion.outcome.professionalLongFormExecution,
  )
  const videoCompletion =
    professionalLongFormDeliveryDecodedVideoQaCompletionSchema.parse(
      videoEntry.completion.outcome.professionalLongFormExecution,
    )
  const audioCompletion =
    professionalLongFormDeliveryDecodedAudioQaCompletionSchema.parse(
      audioEntry.completion.outcome.professionalLongFormExecution,
    )
  const videoArtifact =
    professionalLongFormDeliveryDecodedVideoQaArtifactSchema.parse(
      await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: videoCompletion.validationArtifactRef,
      }),
    )
  const audioArtifact =
    professionalLongFormDeliveryDecodedAudioQaArtifactSchema.parse(
      await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: audioCompletion.validationArtifactRef,
      }),
    )
  const videoObjective = parseVideoObjective(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      ref: videoArtifact.objectiveEvidenceRef,
    }),
  )
  const audioObjective = parseAudioObjective(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot: context.env.localStorageRoot,
      ref: audioArtifact.objectiveEvidenceRef,
    }),
  )
  if (
    videoArtifact.objectiveEvidenceHash !== videoObjective.evidenceHash ||
    audioArtifact.objectiveEvidenceHash !== audioObjective.evidenceHash ||
    stableAuthorityStringify(videoArtifact.muxArtifact) !==
      stableAuthorityStringify(muxCompletion.outputArtifact) ||
    stableAuthorityStringify(audioArtifact.muxArtifact) !==
      stableAuthorityStringify(muxCompletion.outputArtifact)
  ) throw notReady('Decoded customer-delivery QA evidence lost master lineage.')
  return {
    muxCompletion,
    video: {
      queueCompletionHash: videoEntry.completion.completionHash,
      completion: videoCompletion,
      artifact: videoArtifact,
      objectiveEvidence: videoObjective,
    },
    audio: {
      queueCompletionHash: audioEntry.completion.completionHash,
      completion: audioCompletion,
      artifact: audioArtifact,
      objectiveEvidence: audioObjective,
    },
  }
}

function parseVideoObjective(
  value: unknown,
): ObjectiveDecodedVideoIntegrityEvidence & {
  outcome: 'passed' | 'needs_user_review'
} {
  const record = requireRecord(value)
  if (
    record.schemaVersion !== 'objective-final-master-qa-gate-evidence-v1' ||
    record.gateId !== 'decoded_video_integrity' ||
    !['passed', 'needs_user_review'].includes(String(record.outcome))
  ) throw notReady('Stored decoded-video objective evidence is invalid.')
  assertHashedRecord(record, 'evidenceHash')
  return record as unknown as ObjectiveDecodedVideoIntegrityEvidence & {
    outcome: 'passed' | 'needs_user_review'
  }
}

function parseAudioObjective(
  value: unknown,
): ObjectiveDecodedAudioQualitySyncEvidence & {
  outcome: 'passed' | 'needs_user_review'
} {
  const record = requireRecord(value)
  if (
    record.schemaVersion !== 'objective-final-master-qa-gate-evidence-v1' ||
    record.gateId !== 'decoded_audio_quality_sync' ||
    !['passed', 'needs_user_review'].includes(String(record.outcome))
  ) throw notReady('Stored decoded-audio objective evidence is invalid.')
  assertHashedRecord(record, 'evidenceHash')
  return record as unknown as ObjectiveDecodedAudioQualitySyncEvidence & {
    outcome: 'passed' | 'needs_user_review'
  }
}

async function inspectExactMaster(
  context: ServiceContext,
  authority: ProfessionalLongFormDeliveryDownloadAuthority,
): Promise<CanonicalPrivateCustomerDeliveryArtifactInspection> {
  const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: context.env.localStorageRoot,
    privateObjectIdentityHash: authority.master.objectIdentity,
  })
  if (
    !stored || stored.mediaFormat !== 'mp4' ||
    stored.byteLength !== authority.master.byteLength ||
    stored.sha256 !== authority.master.sha256
  ) throw notReady(
    'Private download could not reopen the exact immutable customer-delivery master.',
  )
  return stored
}

async function inspectExactReviewMaster(
  context: ServiceContext,
  packet: ProfessionalLongFormDeliveryQualityReviewPacket,
): Promise<CanonicalPrivateCustomerDeliveryArtifactInspection> {
  const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: context.env.localStorageRoot,
    privateObjectIdentityHash: packet.master.objectIdentity,
  })
  if (
    !stored || stored.mediaFormat !== 'mp4' ||
    stored.byteLength !== packet.master.byteLength ||
    stored.sha256 !== packet.master.sha256
  ) throw notReady(
    'Quality review could not reopen the exact immutable customer-delivery master.',
  )
  return stored
}

async function loadExactCurrent(
  context: ServiceContext,
  ownerUserId: string,
  input: ExactPackageInput,
): Promise<LoadedCustomerDeliveryAuthority> {
  const current = await
    createCanonicalProfessionalLongFormCustomerDeliveryPackageService(context)
      .loadCurrent({
        workspaceId: input.workspaceId,
        approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      })
  if (
    current.package.identity.ownerUserId !== ownerUserId ||
    current.package.identity.workspaceId !== input.workspaceId ||
    current.package.identity.approvedPlanSnapshotId !==
      input.approvedPlanSnapshotId ||
    current.package.identity.packageRecordId !== input.packageRecordId
  ) throw denied('Customer-delivery package is outside the exact user scope.')
  return current
}

function downloadEntry(
  current: LoadedCustomerDeliveryAuthority,
): CanonicalPrivatePackageWorkQueueEntry {
  const workItem = current.package.graph.workItems.find((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_KIND)
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === workItem?.jobId)
  if (
    !workItem || !entry ||
    entry.definition.approvedWorkItemId !== workItem.workItemId ||
    entry.definition.expectedOutputIdentity !== workItem.expectedOutputIdentity
  ) throw notReady('Canonical queue lost the private-download work item.')
  return entry
}

function requiredCompletedEntry(
  current: LoadedCustomerDeliveryAuthority,
  canonicalOrder: number,
) {
  const entry = current.queueAggregate.entries[canonicalOrder]
  if (!entry?.completion || entry.state !== 'completed') {
    throw notReady(`Customer-delivery dependency ${canonicalOrder} is incomplete.`)
  }
  return { ...entry, completion: entry.completion }
}

function assertReviewGraph(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  current: LoadedCustomerDeliveryAuthority,
): void {
  const downloadOrder = current.package.outputContract.chunkCount * 2 + 4
  const download = aggregate.entries[downloadOrder]
  if (
    aggregate.summary.totalJobCount !== downloadOrder + 1 ||
    aggregate.summary.completedJobCount !== downloadOrder ||
    aggregate.summary.queuedJobCount !== 1 ||
    aggregate.summary.leasedJobCount !== 0 ||
    aggregate.entries.slice(0, downloadOrder).some((entry) =>
      entry.state !== 'completed' || !entry.completion) ||
    !download || download.state !== 'queued' ||
    download.deliveryAttemptCount !== 0 ||
    download.professionalLongFormExecutionAuthorization ||
    download.professionalLongFormExecutionAttempt || download.completion ||
    download.definition.dependencyJobIds.length !== 2
  ) throw notReady(
    'Quality review requires exactly eight completed delivery jobs and one pristine download job.',
  )
}

function assertCompletedGraph(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  current: LoadedCustomerDeliveryAuthority,
): void {
  const expected = current.package.outputContract.chunkCount * 2 + 5
  const download = aggregate.entries[expected - 1]
  if (
    aggregate.summary.totalJobCount !== expected ||
    aggregate.summary.completedJobCount !== expected ||
    aggregate.summary.queuedJobCount !== 0 ||
    aggregate.summary.leasedJobCount !== 0 ||
    aggregate.entries.some((entry) =>
      entry.state !== 'completed' || !entry.completion) ||
    !download || download.deliveryAttemptCount !== 1 ||
    !download.professionalLongFormExecutionAuthorization ||
    !download.professionalLongFormExecutionAttempt
  ) throw notReady(
    'Private customer-delivery reconciliation did not complete all nine jobs.',
  )
}

function assertDurableHeartbeat(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  authority: ProfessionalLongFormDeliveryDownloadAuthority,
  attempt: ProfessionalLongFormDeliveryDownloadAttempt,
): void {
  const entry = aggregate.entries.find((candidate) =>
    candidate.definition.jobId === authority.identity.jobId)
  const claim = entry?.activeClaim
  if (
    entry?.state !== 'leased' || !claim ||
    claim.claimId !== attempt.claimId || claim.deliveryAttempt !== 1 ||
    claim.heartbeatCount < 1 || claim.claimHash === attempt.claimHash ||
    Date.parse(claim.expiresAt) <= Date.parse(claim.heartbeatAt) ||
    Date.parse(claim.attemptDeadlineAt) < Date.parse(claim.expiresAt)
  ) throw notReady('Private-download lease heartbeat was not durably observed.')
}

function assertAuthorityRecordMatch(
  authority: ProfessionalLongFormDeliveryDownloadAuthority,
  authorization: ProfessionalLongFormDeliveryDownloadAuthorization,
  record: ProfessionalLongFormDeliveryQualityDecisionRecord,
): void {
  if (
    authority.authorityHash !== authorization.authorityHash ||
    authority.identity.workspaceId !== record.identity.workspaceId ||
    authority.identity.approvedPlanSnapshotId !==
      record.identity.approvedPlanSnapshotId ||
    authority.identity.packageRecordId !== record.identity.packageRecordId ||
    authority.qualityDecision.qualityDecisionHash !==
      record.decision.decisionHash ||
    authority.qualityDecision.reviewPacketHash !==
      record.reviewPacket.packetHash ||
    authority.master.sha256 !== record.reviewPacket.master.sha256 ||
    authorization.qualityDecisionHash !== record.decision.decisionHash ||
    authorization.authorityRef.sha256.length !== 64
  ) throw notReady(
    'Private-download authority does not match the immutable quality decision.',
  )
}

function assertDownloadCostEvidence(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormDeliveryDownloadAuthority
  executionAttempt: ProfessionalLongFormDeliveryDownloadAttempt
  artifactRef: AuthorityJsonBlobRef
}): void {
  const identity = input.evidence.identity
  if (
    identity.workspaceId !== input.authority.identity.workspaceId ||
    identity.projectId !== input.authority.identity.projectId ||
    identity.editSessionId !== input.authority.identity.editSessionId ||
    identity.approvedPlanSnapshotId !==
      input.authority.identity.approvedPlanSnapshotId ||
    identity.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    identity.jobId !== input.authority.identity.jobId ||
    identity.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
    identity.toolId !== 'reeditpro_internal' ||
    identity.operationId !== PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_OPERATION_ID ||
    !('workloadProfileId' in identity) ||
    identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_DELIVERY_DOWNLOAD_COST_PROFILE_ID ||
    input.evidence.resourceUsage.vcpuCount !== 1 ||
    input.evidence.resourceUsage.memoryGib !== 1 ||
    input.evidence.resourceUsage.gpuCount !== 0 ||
    input.evidence.resourceUsage.outputByteLength !==
      input.artifactRef.byteLength ||
    input.evidence.linkedCanonicalOutcomeHash !== input.artifactRef.sha256 ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none'
  ) throw notReady('Private-download internal attempt cost evidence changed.')
}

async function persistExactJson<T extends object>(input: {
  context: ServiceContext
  value: T
  parse(value: unknown): T
  error: string
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value as unknown as Record<string, unknown>,
    maxBytes: 4 * 1024 * 1024,
  })
  const persisted = input.parse(await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  }))
  if (
    stableAuthorityStringify(persisted) !==
      stableAuthorityStringify(input.value)
  ) throw notReady(input.error)
  return ref
}

async function readDecisionRecord(input: {
  context: ServiceContext
  ownerUserId: string
  input: ExactPackageInput
}): Promise<ProfessionalLongFormDeliveryQualityDecisionRecord | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.context.env.localStorageRoot,
    relativePath: decisionRecordPath(input.ownerUserId, input.input),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > 4 * 1024 * 1024) {
    throw notReady('Stored customer-delivery quality decision exceeds its boundary.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw notReady('Stored customer-delivery quality decision is not valid JSON.')
  }
  const record = professionalLongFormDeliveryQualityDecisionRecordSchema
    .parse(decoded)
  const { recordHash, ...withoutHash } = record
  if (
    recordHash !== sha256AuthorityValue(withoutHash) ||
    record.identity.ownerUserId !== input.ownerUserId ||
    record.identity.workspaceId !== input.input.workspaceId ||
    record.identity.approvedPlanSnapshotId !==
      input.input.approvedPlanSnapshotId ||
    record.identity.packageRecordId !== input.input.packageRecordId ||
    record.decision.identity.ownerUserId !== input.ownerUserId ||
    record.decision.reviewPacketHash !== record.reviewPacket.packetHash ||
    record.decision.masterSha256 !== record.reviewPacket.master.sha256
  ) throw notReady('Stored customer-delivery quality decision lost integrity.')
  return record
}

async function persistDecisionRecord(input: {
  context: ServiceContext
  ownerUserId: string
  input: ExactPackageInput
  record: ProfessionalLongFormDeliveryQualityDecisionRecord
}): Promise<void> {
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.context.env.localStorageRoot,
    relativePath: decisionRecordPath(input.ownerUserId, input.input),
    content: Buffer.from(`${stableAuthorityStringify(input.record)}\n`, 'utf8'),
  })
  const readBack = await readDecisionRecord(input)
  if (readBack?.recordHash !== input.record.recordHash) {
    throw notReady('Customer-delivery quality decision changed on readback.')
  }
}

function decisionRecordPath(ownerUserId: string, input: ExactPackageInput): string {
  const hash = decisionIdentityHash(ownerUserId, input)
  return `canonical-customer-delivery-quality-decisions/private-v1/${
    hash.slice(0, 2)}/${hash}.json`
}

function decisionLockPath(ownerUserId: string, input: ExactPackageInput): string {
  const hash = decisionIdentityHash(ownerUserId, input)
  return `canonical-customer-delivery-quality-decisions/private-v1/locks/${
    hash.slice(0, 2)}/${hash}.lock`
}

function decisionIdentityHash(ownerUserId: string, input: ExactPackageInput) {
  return sha256AuthorityValue({
    domain: 'canonical_customer_delivery_quality_decision_identity_v1',
    ownerUserId,
    workspaceId: input.workspaceId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    packageRecordId: input.packageRecordId,
  })
}

function hashIdempotencyKey(value: string): string {
  const key = value.trim()
  if (key.length < 8 || key.length > 200 || /[\r\n\0]/u.test(key)) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_REQUIRED',
      'A bounded idempotency key is required for the quality decision.',
      400,
    )
  }
  return sha256AuthorityValue({
    domain: 'canonical_customer_delivery_quality_decision_idempotency_v1',
    key,
  })
}

function assertDecisionInput(
  input: ExactPackageInput,
  request: RecordProfessionalLongFormDeliveryQualityDecision,
): void {
  if (
    input.workspaceId !== request.workspaceId ||
    input.approvedPlanSnapshotId !== request.approvedPlanSnapshotId
  ) throw conflict('Quality-decision request scope does not match its route scope.')
}

async function requireWorkspaceActor(
  context: ServiceContext,
  workspaceId: string,
  operation: 'read' | 'write',
): Promise<string> {
  const actor = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, workspaceId, operation)
  if (actor !== access.userId) throw denied(
    'Customer-delivery quality authority is outside this workspace.',
  )
  return actor
}

function reviewReadiness(input: {
  decisionRecorded: boolean
  downloadAuthorized: boolean
  downloadComplete: boolean
  revisionRequired: boolean
}) {
  return {
    exactDecodedVideoQaReopened: true as const,
    exactDecodedAudioQaReopened: true as const,
    actualSpeechIntelligibilityAnalysisPerformed: false as const,
    authenticatedQualityDecisionRecorded: input.decisionRecorded,
    revisionRequiresFreshPlanEstimateAndApproval: input.revisionRequired,
    privateDownloadExecutionAuthorized: input.downloadAuthorized,
    privateDownloadReconciliationComplete: input.downloadComplete,
    authenticatedPrivateByteStreamReady: input.downloadComplete,
    secondExportEstimateCreated: false as const,
    secondExportChargeCreated: false as const,
    customerCreditsMutated: false as const,
    publicDeliveryAuthorized: false as const,
    productReady: false as const,
    productionReady: false as const,
  }
}

function decisionReadiness(downloadReady: boolean) {
  return {
    immutableAuthenticatedQualityDecisionRecorded: true as const,
    revisionRequiresFreshPlanEstimateAndApproval: !downloadReady,
    singleUseQueueLeaseAndAttemptVerified: downloadReady,
    attemptInternalProductionCostVerified: downloadReady,
    authenticatedPrivateByteStreamReady: downloadReady,
    originalApprovedFourKEstimateAndReservationReused: true as const,
    secondExportEstimateCreated: false as const,
    secondExportChargeCreated: false as const,
    customerPriceOrCreditsMutated: false as const,
    distributedDatabaseVerified: false as const,
    liveGoogleCloudVerified: false as const,
    publicDeliveryAuthorized: false as const,
    productReady: false as const,
    productionReady: false as const,
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw notReady('Stored customer-delivery evidence is not an object.')
  }
  return value as Record<string, unknown>
}

function assertHashedRecord(
  record: Record<string, unknown>,
  hashField: string,
): void {
  const hash = record[hashField]
  const withoutHash = { ...record }
  delete withoutHash[hashField]
  if (
    typeof hash !== 'string' || !/^[a-f0-9]{64}$/u.test(hash) ||
    hash !== sha256AuthorityValue(withoutHash)
  ) throw notReady('Stored customer-delivery evidence checksum is invalid.')
}

function assertPrivateRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly &&
      !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Professional long-form private download is local/internal testing only.',
    503,
  )
}

function validationBoundary<T>(action: () => T): T {
  try {
    return action()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form customer-delivery quality authority is invalid.',
      409,
      { reason: error instanceof Error ? error.message : String(error) },
    )
  }
}

function denied(message: string): ApiError {
  return new ApiError('WORKSPACE_ACCESS_DENIED', message, 403)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_professional_long_form_customer_delivery_quality_and_download',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
