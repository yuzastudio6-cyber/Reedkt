import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  compileOfflineFinalMasterAudioObjectiveEvidence,
  compileOfflineFinalMasterVideoObjectiveEvidence,
  type OfflineFinalMasterObjectiveEvidenceAuthority,
} from '../final-master-qa/offline-final-master-objective-evidence-adapter'
import type {
  ObjectiveDecodedAudioQualitySyncEvidence,
  ObjectiveDecodedVideoIntegrityEvidence,
} from '../final-master-qa/objective-final-master-qa-types'
import {
  assertProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  assertProfessionalLongFormDeliveryDecodedVideoQaAuthority,
  buildProfessionalLongFormDeliveryDecodedAudioQaArtifact,
  buildProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  buildProfessionalLongFormDeliveryDecodedAudioQaAuthorization,
  buildProfessionalLongFormDeliveryDecodedAudioQaCompletion,
  buildProfessionalLongFormDeliveryDecodedAudioQaReconciliation,
  buildProfessionalLongFormDeliveryDecodedAudioQaTerminal,
  buildProfessionalLongFormDeliveryDecodedVideoQaArtifact,
  buildProfessionalLongFormDeliveryDecodedVideoQaAuthority,
  buildProfessionalLongFormDeliveryDecodedVideoQaAuthorization,
  buildProfessionalLongFormDeliveryDecodedVideoQaCompletion,
  buildProfessionalLongFormDeliveryDecodedVideoQaReconciliation,
  buildProfessionalLongFormDeliveryDecodedVideoQaTerminal,
  professionalLongFormDeliveryDecodedAudioQaResultHash,
  professionalLongFormDeliveryDecodedAudioQaRuntimeReceipt,
  professionalLongFormDeliveryDecodedVideoQaResultHash,
  professionalLongFormDeliveryDecodedVideoQaRuntimeReceipt,
} from '../edit-architecture/professional-long-form-customer-delivery-decoded-qa-execution'
import type {
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from '../edit-architecture/professional-long-form-customer-delivery-execution'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND,
  professionalLongFormDeliveryDecodedAudioQaArtifactSchema,
  professionalLongFormDeliveryDecodedAudioQaAttemptSchema,
  professionalLongFormDeliveryDecodedAudioQaCompletionSchema,
  professionalLongFormDeliveryDecodedAudioQaReconciliationSchema,
  professionalLongFormDeliveryDecodedAudioQaTerminalSchema,
  professionalLongFormDeliveryDecodedVideoQaArtifactSchema,
  professionalLongFormDeliveryDecodedVideoQaAttemptSchema,
  professionalLongFormDeliveryDecodedVideoQaCompletionSchema,
  professionalLongFormDeliveryDecodedVideoQaReconciliationSchema,
  professionalLongFormDeliveryDecodedVideoQaTerminalSchema,
  type ProfessionalLongFormDeliveryDecodedAudioQaArtifact,
  type ProfessionalLongFormDeliveryDecodedAudioQaAttempt,
  type ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  type ProfessionalLongFormDeliveryDecodedAudioQaAuthorization,
  type ProfessionalLongFormDeliveryDecodedAudioQaReconciliation,
  type ProfessionalLongFormDeliveryDecodedAudioQaTerminal,
  type ProfessionalLongFormDeliveryDecodedVideoQaArtifact,
  type ProfessionalLongFormDeliveryDecodedVideoQaAttempt,
  type ProfessionalLongFormDeliveryDecodedVideoQaAuthority,
  type ProfessionalLongFormDeliveryDecodedVideoQaAuthorization,
  type ProfessionalLongFormDeliveryDecodedVideoQaReconciliation,
  type ProfessionalLongFormDeliveryDecodedVideoQaTerminal,
} from '../edit-architecture/professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  buildOfflineFinalMasterAudioQaRequest,
  buildOfflineFinalMasterVideoQaRequest,
  offlineFinalMasterAudioQaRequestSha256,
  offlineFinalMasterVideoQaRequestSha256,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  type OfflineFinalMasterAudioQaRequest,
  type OfflineFinalMasterVideoQaRequest,
  type OfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution'
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
  createCanonicalProfessionalLongFormCustomerDeliveryExecutionService,
} from './canonical-professional-long-form-customer-delivery-execution-service'
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

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_VIDEO_QA_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-decoded-video-qa-execution-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_AUDIO_QA_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-decoded-audio-qa-execution-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_QA_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-decoded-qa-execution-v1' as const

interface LoadedCustomerDeliveryAuthority extends
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
}

type AcceptedVideoObjectiveEvidence = ObjectiveDecodedVideoIntegrityEvidence & {
  outcome: 'passed' | 'needs_user_review'
}
type AcceptedAudioObjectiveEvidence = ObjectiveDecodedAudioQualitySyncEvidence & {
  outcome: 'passed' | 'needs_user_review'
}

interface CompletedDecodedVideoQaEvidence {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryDecodedVideoQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt
  artifact: ProfessionalLongFormDeliveryDecodedVideoQaArtifact
  artifactRef: AuthorityJsonBlobRef
  objectiveEvidence: AcceptedVideoObjectiveEvidence
  objectiveEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryDecodedVideoQaReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryDecodedVideoQaTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

interface CompletedDecodedAudioQaEvidence {
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryDecodedAudioQaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  artifact: ProfessionalLongFormDeliveryDecodedAudioQaArtifact
  artifactRef: AuthorityJsonBlobRef
  objectiveEvidence: AcceptedAudioObjectiveEvidence
  objectiveEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryDecodedAudioQaReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryDecodedAudioQaTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormDecodedVideoQaExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_VIDEO_QA_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service'
  status:
    'decoded_video_qa_completed_audio_qa_and_private_download_separately_gated'
  disposition: 'completed' | 'exact_replay'
  qa: Omit<CompletedDecodedVideoQaEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: DecodedQaReadiness & {
    decodedVideoJobExecuted: true
    decodedAudioJobExecuted: false
    decodedVideoObjectiveOutcome: 'passed' | 'needs_user_review'
    decodedAudioObjectiveOutcome: null
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormDecodedAudioQaExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_AUDIO_QA_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service'
  status:
    'decoded_audio_qa_completed_video_qa_state_preserved_private_download_separately_gated'
  disposition: 'completed' | 'exact_replay'
  qa: Omit<CompletedDecodedAudioQaEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: DecodedQaReadiness & {
    decodedVideoJobExecuted: boolean
    decodedAudioJobExecuted: true
    decodedVideoObjectiveOutcome: 'passed' | 'needs_user_review' | null
    decodedAudioObjectiveOutcome: 'passed' | 'needs_user_review'
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormDecodedQaExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_QA_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service'
  status:
    'both_decoded_qa_jobs_completed_private_download_requires_quality_reconciliation'
  disposition: 'completed' | 'exact_replay'
  videoQa: Omit<CompletedDecodedVideoQaEvidence, 'queueAggregate'>
  audioQa: Omit<CompletedDecodedAudioQaEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  qualityDisposition: 'accepted' | 'user_review_required'
  readiness: DecodedQaReadiness & {
    decodedVideoJobExecuted: true
    decodedAudioJobExecuted: true
    decodedVideoObjectiveOutcome: 'passed' | 'needs_user_review'
    decodedAudioObjectiveOutcome: 'passed' | 'needs_user_review'
    bothObjectiveQaGatesPassed: boolean
  }
  evidenceHash: string
}

interface DecodedQaReadiness {
  approvedSnapshotAndOriginalReservationReopened: true
  exactCompletedPrivateCustomerDeliveryMasterReopened: true
  independentLeaseAndOneUseDispatchVerified: true
  heartbeatAndBoundedLeaseVerified: true
  exactPinnedFfmpegRuntimeVerified: true
  fullDecodedStreamAnalysisVerified: true
  privateQaEvidencePersisted: true
  attemptInternalProductionCostVerified: true
  actualSpeechIntelligibilityAnalysisPerformed: false
  secondExportEstimateCreated: false
  secondExportChargeCreated: false
  customerPriceOrCreditsMutated: false
  privateDownloadExecutionAuthorized: false
  distributedDatabaseVerified: false
  liveGoogleCloudVerified: false
  providerActivationAuthorized: false
  publicDeliveryAuthorized: false
  productReady: false
  productionReady: false
}

const commonReadiness = {
  approvedSnapshotAndOriginalReservationReopened: true as const,
  exactCompletedPrivateCustomerDeliveryMasterReopened: true as const,
  independentLeaseAndOneUseDispatchVerified: true as const,
  heartbeatAndBoundedLeaseVerified: true as const,
  exactPinnedFfmpegRuntimeVerified: true as const,
  fullDecodedStreamAnalysisVerified: true as const,
  privateQaEvidencePersisted: true as const,
  attemptInternalProductionCostVerified: true as const,
  actualSpeechIntelligibilityAnalysisPerformed: false as const,
  secondExportEstimateCreated: false as const,
  secondExportChargeCreated: false as const,
  customerPriceOrCreditsMutated: false as const,
  privateDownloadExecutionAuthorized: false as const,
  distributedDatabaseVerified: false as const,
  liveGoogleCloudVerified: false as const,
  providerActivationAuthorized: false as const,
  publicDeliveryAuthorized: false as const,
  productReady: false as const,
  productionReady: false as const,
}

export function createCanonicalProfessionalLongFormCustomerDeliveryDecodedQaExecutionService(
  context: ServiceContext,
) {
  return {
    async executeDecodedVideoQa(input: ExactInput): Promise<
      CanonicalProfessionalLongFormDecodedVideoQaExecutionEvidence
    > {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      const current = await loadCurrentWithCompletedMux(context, input)
      const entry = decodedQaEntry(current, 'video')
      if (entry.state === 'leased') {
        throw inProgress('Decoded-video customer-delivery QA has an active lease.')
      }
      const runtimeAuthority = await requiredDecodedQaRuntimeAuthority()
      const replay = entry.state === 'completed'
      const qa = replay
        ? await loadCompletedDecodedVideoQa({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
          })
        : await executeDecodedVideoQa({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
          })
      assertGraphAfterDecodedQa(qa.queueAggregate, current, 'video')
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_VIDEO_QA_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service' as const,
        status:
          'decoded_video_qa_completed_audio_qa_and_private_download_separately_gated' as const,
        qa: withoutAggregate(qa),
        queueAggregate: qa.queueAggregate,
        readiness: {
          ...commonReadiness,
          decodedVideoJobExecuted: true as const,
          decodedAudioJobExecuted: false as const,
          decodedVideoObjectiveOutcome: qa.objectiveEvidence.outcome,
          decodedAudioObjectiveOutcome: null,
        },
      }
      return {
        ...stablePayload,
        disposition: replay ? 'exact_replay' : 'completed',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },

    async executeDecodedAudioQa(input: ExactInput): Promise<
      CanonicalProfessionalLongFormDecodedAudioQaExecutionEvidence
    > {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      const current = await loadCurrentWithCompletedMux(context, input)
      const entry = decodedQaEntry(current, 'audio')
      if (entry.state === 'leased') {
        throw inProgress('Decoded-audio customer-delivery QA has an active lease.')
      }
      const runtimeAuthority = await requiredDecodedQaRuntimeAuthority()
      const replay = entry.state === 'completed'
      const qa = replay
        ? await loadCompletedDecodedAudioQa({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
          })
        : await executeDecodedAudioQa({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
          })
      const videoEntry = decodedQaEntry({
        ...current,
        queueAggregate: qa.queueAggregate,
      }, 'video')
      const videoOutcome = videoEntry.state === 'completed'
        ? professionalLongFormDeliveryDecodedVideoQaCompletionSchema.parse(
            videoEntry.completion?.outcome.professionalLongFormExecution,
          ).objectiveQaOutcome
        : null
      assertGraphAfterDecodedQa(qa.queueAggregate, current, 'audio')
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_AUDIO_QA_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service' as const,
        status:
          'decoded_audio_qa_completed_video_qa_state_preserved_private_download_separately_gated' as const,
        qa: withoutAggregate(qa),
        queueAggregate: qa.queueAggregate,
        readiness: {
          ...commonReadiness,
          decodedVideoJobExecuted: videoEntry.state === 'completed',
          decodedAudioJobExecuted: true as const,
          decodedVideoObjectiveOutcome: videoOutcome,
          decodedAudioObjectiveOutcome: qa.objectiveEvidence.outcome,
        },
      }
      return {
        ...stablePayload,
        disposition: replay ? 'exact_replay' : 'completed',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },

    async executeBothDecodedQa(input: ExactInput): Promise<
      CanonicalProfessionalLongFormDecodedQaExecutionEvidence
    > {
      assertExactInput(input)
      const before = await loadCurrentWithCompletedMux(context, input)
      const videoWasCompleted = decodedQaEntry(before, 'video').state === 'completed'
      const audioWasCompleted = decodedQaEntry(before, 'audio').state === 'completed'
      const service =
        createCanonicalProfessionalLongFormCustomerDeliveryDecodedQaExecutionService(
          context,
        )
      await service.executeDecodedVideoQa(input)
      await service.executeDecodedAudioQa(input)
      const ownerUserId = requireOwner(context)
      const current = await loadCurrent(context, input)
      const runtimeAuthority = await requiredDecodedQaRuntimeAuthority()
      const videoQa = await loadCompletedDecodedVideoQa({
        context,
        current,
        ownerUserId,
        runtimeAuthority,
      })
      const audioQa = await loadCompletedDecodedAudioQa({
        context,
        current,
        ownerUserId,
        runtimeAuthority,
      })
      assertBothDecodedQaGraph(current.queueAggregate, current)
      const passed = videoQa.objectiveEvidence.outcome === 'passed' &&
        audioQa.objectiveEvidence.outcome === 'passed'
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_DECODED_QA_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_decoded_qa_execution_service' as const,
        status:
          'both_decoded_qa_jobs_completed_private_download_requires_quality_reconciliation' as const,
        videoQa: withoutAggregate(videoQa),
        audioQa: withoutAggregate(audioQa),
        queueAggregate: current.queueAggregate,
        qualityDisposition: passed
          ? 'accepted' as const
          : 'user_review_required' as const,
        readiness: {
          ...commonReadiness,
          decodedVideoJobExecuted: true as const,
          decodedAudioJobExecuted: true as const,
          decodedVideoObjectiveOutcome: videoQa.objectiveEvidence.outcome,
          decodedAudioObjectiveOutcome: audioQa.objectiveEvidence.outcome,
          bothObjectiveQaGatesPassed: passed,
        },
      }
      return {
        ...stablePayload,
        disposition: videoWasCompleted && audioWasCompleted
          ? 'exact_replay'
          : 'completed',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

interface ExactInput {
  workspaceId: string
  approvedPlanSnapshotId: string
}

async function executeDecodedVideoQa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): Promise<CompletedDecodedVideoQaEvidence> {
  const authority = buildProfessionalLongFormDeliveryDecodedVideoQaAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) =>
      assertProfessionalLongFormDeliveryDecodedVideoQaAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        runtimeAuthority: input.runtimeAuthority,
      }),
  })
  const authorization = buildProfessionalLongFormDeliveryDecodedVideoQaAuthorization({
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
      'canonical-professional-long-form-delivery-decoded-video-qa-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Decoded-video QA claim remained ${claim.disposition}.`)
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
    professionalLongFormDeliveryDecodedVideoQaAttemptSchema.parse(
      begun.executionAttempt,
    )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    ...costIdentity(input.context, authority, executionAttempt),
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
  })
  const heartbeat = startDecodedQaLeaseHeartbeat({
    current: input.current,
    authority,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
  })
  let costFinalized = false
  let heartbeatStopped = false
  try {
    await heartbeat.tick()
    const leasedCurrent = await loadCurrent(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    assertDurableHeartbeat({
      current: leasedCurrent,
      kind: 'video',
      executionAttempt,
    })
    const stored = await inspectExactMuxArtifact(input.context, authority)
    const request = buildVideoRequest(authority)
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const result = await runtime.executeFinalMasterVideoQaServerInjected(
      request,
      privateInput(stored),
    )
    await heartbeat.stopAndAssertHealthy()
    heartbeatStopped = true
    const rawRunnerResultRef = await persistExactJson({
      context: input.context,
      value: result.resultJson.document,
      parse: requireRecord,
    })
    const runtimeReceipt =
      professionalLongFormDeliveryDecodedVideoQaRuntimeReceipt(result)
    const runtimeReceiptRef = await persistExactJson({
      context: input.context,
      value: runtimeReceipt,
      parse: (value) => value as typeof runtimeReceipt,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: result.resultJson.byteLength,
      linkedCanonicalOutcomeHash: result.resultJson.sha256,
    })
    costFinalized = true
    assertDecodedQaCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      runnerResultHash: result.resultJson.sha256,
      runnerResultByteLength: result.resultJson.byteLength,
      workloadProfileId:
        PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
    })
    const objectiveEvidence =
      compileOfflineFinalMasterVideoObjectiveEvidence({
        authority: objectiveEvidenceAuthority({
          authority,
          executionAttempt,
          requestEnvelopeSha256:
            offlineFinalMasterVideoQaRequestSha256(request),
        }),
        runnerResult: result,
        attemptCostEvidence: finalizedCost.evidence,
      })
    assertAcceptedObjectiveOutcome(objectiveEvidence)
    const objectiveEvidenceRef = await persistExactJson({
      context: input.context,
      value: objectiveEvidence,
      parse: (value) => parseStoredVideoObjectiveEvidence(value),
    })
    const artifact = buildProfessionalLongFormDeliveryDecodedVideoQaArtifact({
      authority,
      authorization,
      executionAttempt,
      rawRunnerResultRef,
      runtimeReceiptRef,
      objectiveEvidenceRef,
      objectiveEvidence,
      runnerResult: result,
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormDeliveryDecodedVideoQaArtifactSchema.parse(value),
    })
    const reconciliation =
      buildProfessionalLongFormDeliveryDecodedVideoQaReconciliation({
        current: leasedCurrent,
        authority,
        authorization,
        executionAttempt,
        qaArtifactRef: artifactRef,
        qaOutcome: objectiveEvidence.outcome,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryDecodedVideoQaReconciliationSchema.parse(
          value,
        ),
    })
    const canonicalResultHash =
      professionalLongFormDeliveryDecodedVideoQaResultHash({
        authority,
        executionAttempt,
        qaArtifactRef: artifactRef,
        reconciliationEvidenceRef: reconciliationRef,
      })
    const terminal = buildProfessionalLongFormDeliveryDecodedVideoQaTerminal({
      authority,
      authorization,
      executionAttempt,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      objectiveQaOutcome: objectiveEvidence.outcome,
      decodedAudioQaCompleted:
        decodedQaEntry(leasedCurrent, 'audio').state === 'completed',
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryDecodedVideoQaTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryDecodedVideoQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
      objectiveQaOutcome: objectiveEvidence.outcome,
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
      objectiveEvidence,
      objectiveEvidenceRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!heartbeatStopped) await heartbeat.stopIgnoringFailure()
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

async function executeDecodedAudioQa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): Promise<CompletedDecodedAudioQaEvidence> {
  const authority = buildProfessionalLongFormDeliveryDecodedAudioQaAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) =>
      assertProfessionalLongFormDeliveryDecodedAudioQaAuthority({
        value,
        ownerUserId: input.ownerUserId,
        current: input.current,
        runtimeAuthority: input.runtimeAuthority,
      }),
  })
  const authorization = buildProfessionalLongFormDeliveryDecodedAudioQaAuthorization({
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
      'canonical-professional-long-form-delivery-decoded-audio-qa-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Decoded-audio QA claim remained ${claim.disposition}.`)
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
    professionalLongFormDeliveryDecodedAudioQaAttemptSchema.parse(
      begun.executionAttempt,
    )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    ...costIdentity(input.context, authority, executionAttempt),
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
  })
  const heartbeat = startDecodedQaLeaseHeartbeat({
    current: input.current,
    authority,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
  })
  let costFinalized = false
  let heartbeatStopped = false
  try {
    await heartbeat.tick()
    const leasedCurrent = await loadCurrent(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    assertDurableHeartbeat({
      current: leasedCurrent,
      kind: 'audio',
      executionAttempt,
    })
    const stored = await inspectExactMuxArtifact(input.context, authority)
    const request = buildAudioRequest(authority)
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const result = await runtime.executeFinalMasterAudioQaServerInjected(
      request,
      privateInput(stored),
    )
    await heartbeat.stopAndAssertHealthy()
    heartbeatStopped = true
    const rawRunnerResultRef = await persistExactJson({
      context: input.context,
      value: result.resultJson.document,
      parse: requireRecord,
    })
    const runtimeReceipt =
      professionalLongFormDeliveryDecodedAudioQaRuntimeReceipt(result)
    const runtimeReceiptRef = await persistExactJson({
      context: input.context,
      value: runtimeReceipt,
      parse: (value) => value as typeof runtimeReceipt,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: result.resultJson.byteLength,
      linkedCanonicalOutcomeHash: result.resultJson.sha256,
    })
    costFinalized = true
    assertDecodedQaCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      runnerResultHash: result.resultJson.sha256,
      runnerResultByteLength: result.resultJson.byteLength,
      workloadProfileId:
        PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
    })
    const objectiveEvidence =
      compileOfflineFinalMasterAudioObjectiveEvidence({
        authority: objectiveEvidenceAuthority({
          authority,
          executionAttempt,
          requestEnvelopeSha256:
            offlineFinalMasterAudioQaRequestSha256(request),
        }),
        runnerResult: result,
        attemptCostEvidence: finalizedCost.evidence,
      })
    assertAcceptedObjectiveOutcome(objectiveEvidence)
    const objectiveEvidenceRef = await persistExactJson({
      context: input.context,
      value: objectiveEvidence,
      parse: (value) => parseStoredAudioObjectiveEvidence(value),
    })
    const artifact = buildProfessionalLongFormDeliveryDecodedAudioQaArtifact({
      authority,
      authorization,
      executionAttempt,
      rawRunnerResultRef,
      runtimeReceiptRef,
      objectiveEvidenceRef,
      objectiveEvidence,
      runnerResult: result,
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormDeliveryDecodedAudioQaArtifactSchema.parse(value),
    })
    const reconciliation =
      buildProfessionalLongFormDeliveryDecodedAudioQaReconciliation({
        current: leasedCurrent,
        authority,
        authorization,
        executionAttempt,
        qaArtifactRef: artifactRef,
        qaOutcome: objectiveEvidence.outcome,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryDecodedAudioQaReconciliationSchema.parse(
          value,
        ),
    })
    const canonicalResultHash =
      professionalLongFormDeliveryDecodedAudioQaResultHash({
        authority,
        executionAttempt,
        qaArtifactRef: artifactRef,
        reconciliationEvidenceRef: reconciliationRef,
      })
    const terminal = buildProfessionalLongFormDeliveryDecodedAudioQaTerminal({
      authority,
      authorization,
      executionAttempt,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      objectiveQaOutcome: objectiveEvidence.outcome,
      decodedVideoQaCompleted:
        decodedQaEntry(leasedCurrent, 'video').state === 'completed',
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryDecodedAudioQaTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryDecodedAudioQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
      objectiveQaOutcome: objectiveEvidence.outcome,
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
      objectiveEvidence,
      objectiveEvidenceRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!heartbeatStopped) await heartbeat.stopIgnoringFailure()
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

async function loadCompletedDecodedVideoQa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): Promise<CompletedDecodedVideoQaEvidence> {
  const authority = buildProfessionalLongFormDeliveryDecodedVideoQaAuthority(input)
  const entry = decodedQaEntry(input.current, 'video')
  if (entry.state !== 'completed' || !entry.completion) {
    throw invalid('Completed decoded-video QA queue entry is missing.')
  }
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryDecodedVideoQaAuthority({
    value: persistedAuthority,
    ownerUserId: input.ownerUserId,
    current: input.current,
    runtimeAuthority: input.runtimeAuthority,
  })
  const authorization = buildProfessionalLongFormDeliveryDecodedVideoQaAuthorization({
    authority,
    authorityRef,
  })
  assertExact(
    entry.professionalLongFormExecutionAuthorization,
    authorization,
    'Stored decoded-video QA authorization changed.',
  )
  const executionAttempt =
    professionalLongFormDeliveryDecodedVideoQaAttemptSchema.parse(
      entry.professionalLongFormExecutionAttempt,
    )
  const completion =
    professionalLongFormDeliveryDecodedVideoQaCompletionSchema.parse(
      entry.completion.outcome.professionalLongFormExecution,
    )
  const artifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedVideoQaArtifactSchema.parse(value),
  })
  assertHashed(artifact, 'qaHash')
  assertStoredArtifactCommon({ authority, executionAttempt, artifact })
  const rawRunnerResult = await readParsedJson({
    context: input.context,
    ref: artifact.rawRunnerResultRef,
    parse: requireRecord,
  })
  const runtimeReceipt = await readParsedJson({
    context: input.context,
    ref: artifact.runtimeReceiptRef,
    parse: requireRecord,
  })
  const objectiveEvidence = await readParsedJson({
    context: input.context,
    ref: artifact.objectiveEvidenceRef,
    parse: parseStoredVideoObjectiveEvidence,
  })
  assertStoredRunnerAndObjectiveEvidence({
    authority,
    executionAttempt,
    artifact,
    rawRunnerResult,
    runtimeReceipt,
    objectiveEvidence,
  })
  const runtimeResultIdentity =
    reconstructedRuntimeResultIdentity(rawRunnerResult)
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedVideoQaReconciliationSchema.parse(
        value,
      ),
  })
  assertStoredReconciliation({
    current: input.current,
    authority,
    executionAttempt,
    artifactRef: completion.validationArtifactRef,
    reconciliation,
    outcome: objectiveEvidence.outcome,
    kind: 'video',
  })
  const canonicalResultHash =
    professionalLongFormDeliveryDecodedVideoQaResultHash({
      authority,
      executionAttempt,
      qaArtifactRef: completion.validationArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    })
  const costEvidence = await requiredDecodedQaCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    runnerResultHash: runtimeResultIdentity.sha256,
    runnerResultByteLength: runtimeResultIdentity.byteLength,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID,
    expectedHash: completion.attemptInternalCostEvidenceHash,
  })
  assertObjectiveCostSet(objectiveEvidence, costEvidence)
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedVideoQaTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryDecodedVideoQaTerminal({
    authority,
    authorization,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    objectiveQaOutcome: objectiveEvidence.outcome,
    decodedAudioQaCompleted: terminal.decodedAudioQaCompleted,
    completedAt: terminal.completedAt,
  })
  assertExact(
    terminal,
    expectedTerminal,
    'Stored decoded-video QA terminal changed.',
  )
  const expectedCompletion =
    buildProfessionalLongFormDeliveryDecodedVideoQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
      validationArtifactRef: completion.validationArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
      terminalEvidenceRef: completion.terminalEvidenceRef,
      objectiveQaOutcome: objectiveEvidence.outcome,
    })
  assertExact(
    completion,
    expectedCompletion,
    'Stored decoded-video QA completion changed.',
  )
  assertStoredQueueCompletion(entry, completion.validationArtifactRef)
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    artifact,
    artifactRef: completion.validationArtifactRef,
    objectiveEvidence,
    objectiveEvidenceRef: artifact.objectiveEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadCompletedDecodedAudioQa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
}): Promise<CompletedDecodedAudioQaEvidence> {
  const authority = buildProfessionalLongFormDeliveryDecodedAudioQaAuthority(input)
  const entry = decodedQaEntry(input.current, 'audio')
  if (entry.state !== 'completed' || !entry.completion) {
    throw invalid('Completed decoded-audio QA queue entry is missing.')
  }
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryDecodedAudioQaAuthority({
    value: persistedAuthority,
    ownerUserId: input.ownerUserId,
    current: input.current,
    runtimeAuthority: input.runtimeAuthority,
  })
  const authorization = buildProfessionalLongFormDeliveryDecodedAudioQaAuthorization({
    authority,
    authorityRef,
  })
  assertExact(
    entry.professionalLongFormExecutionAuthorization,
    authorization,
    'Stored decoded-audio QA authorization changed.',
  )
  const executionAttempt =
    professionalLongFormDeliveryDecodedAudioQaAttemptSchema.parse(
      entry.professionalLongFormExecutionAttempt,
    )
  const completion =
    professionalLongFormDeliveryDecodedAudioQaCompletionSchema.parse(
      entry.completion.outcome.professionalLongFormExecution,
    )
  const artifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedAudioQaArtifactSchema.parse(value),
  })
  assertHashed(artifact, 'qaHash')
  assertStoredArtifactCommon({ authority, executionAttempt, artifact })
  if (artifact.actualSpeechIntelligibilityAnalysisPerformed) {
    throw invalid('Decoded-audio QA fabricated speech-intelligibility evidence.')
  }
  const rawRunnerResult = await readParsedJson({
    context: input.context,
    ref: artifact.rawRunnerResultRef,
    parse: requireRecord,
  })
  const runtimeReceipt = await readParsedJson({
    context: input.context,
    ref: artifact.runtimeReceiptRef,
    parse: requireRecord,
  })
  const objectiveEvidence = await readParsedJson({
    context: input.context,
    ref: artifact.objectiveEvidenceRef,
    parse: parseStoredAudioObjectiveEvidence,
  })
  assertStoredRunnerAndObjectiveEvidence({
    authority,
    executionAttempt,
    artifact,
    rawRunnerResult,
    runtimeReceipt,
    objectiveEvidence,
  })
  const runtimeResultIdentity =
    reconstructedRuntimeResultIdentity(rawRunnerResult)
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedAudioQaReconciliationSchema.parse(
        value,
      ),
  })
  assertStoredReconciliation({
    current: input.current,
    authority,
    executionAttempt,
    artifactRef: completion.validationArtifactRef,
    reconciliation,
    outcome: objectiveEvidence.outcome,
    kind: 'audio',
  })
  const canonicalResultHash =
    professionalLongFormDeliveryDecodedAudioQaResultHash({
      authority,
      executionAttempt,
      qaArtifactRef: completion.validationArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    })
  const costEvidence = await requiredDecodedQaCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    runnerResultHash: runtimeResultIdentity.sha256,
    runnerResultByteLength: runtimeResultIdentity.byteLength,
    workloadProfileId:
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID,
    expectedHash: completion.attemptInternalCostEvidenceHash,
  })
  assertObjectiveCostSet(objectiveEvidence, costEvidence)
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryDecodedAudioQaTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryDecodedAudioQaTerminal({
    authority,
    authorization,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    objectiveQaOutcome: objectiveEvidence.outcome,
    decodedVideoQaCompleted: terminal.decodedVideoQaCompleted,
    completedAt: terminal.completedAt,
  })
  assertExact(
    terminal,
    expectedTerminal,
    'Stored decoded-audio QA terminal changed.',
  )
  const expectedCompletion =
    buildProfessionalLongFormDeliveryDecodedAudioQaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
      validationArtifactRef: completion.validationArtifactRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
      terminalEvidenceRef: completion.terminalEvidenceRef,
      objectiveQaOutcome: objectiveEvidence.outcome,
    })
  assertExact(
    completion,
    expectedCompletion,
    'Stored decoded-audio QA completion changed.',
  )
  assertStoredQueueCompletion(entry, completion.validationArtifactRef)
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    artifact,
    artifactRef: completion.validationArtifactRef,
    objectiveEvidence,
    objectiveEvidenceRef: artifact.objectiveEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

function buildVideoRequest(
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority,
): OfflineFinalMasterVideoQaRequest {
  const plan = authority.approvedQaPlan
  return buildOfflineFinalMasterVideoQaRequest({
    planningPayload: {
      ...commonQaPlanningPayload(authority),
      recipeProfileId: plan.recipeProfileId,
      anomalyPolicyId: plan.anomalyPolicyId,
      blackMinimumDurationFrames: plan.blackMinimumDurationFrames,
      freezeMinimumDurationFrames: plan.freezeMinimumDurationFrames,
      flashSceneChangeThreshold: plan.flashSceneChangeThreshold,
      visualExceptionManifest: plan.visualExceptionManifest,
    },
    finalMaster: finalMasterInput(authority),
  })
}

function buildAudioRequest(
  authority: ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
): OfflineFinalMasterAudioQaRequest {
  const plan = authority.approvedQaPlan
  return buildOfflineFinalMasterAudioQaRequest({
    planningPayload: {
      ...commonQaPlanningPayload(authority),
      recipeProfileId: plan.recipeProfileId,
      audioPolicyId: plan.audioPolicyId,
      sampleRate: plan.sampleRate,
      channels: plan.channels,
      targetIntegratedLufs: plan.targetIntegratedLufs,
      integratedLufsTolerance: plan.integratedLufsTolerance,
      maximumTruePeakDbtp: plan.maximumTruePeakDbtp,
      maximumLoudnessRangeLufs: plan.maximumLoudnessRangeLufs,
      maximumAvSyncDriftFrames: plan.maximumAvSyncDriftFrames,
      silenceMinimumDurationFrames: plan.silenceMinimumDurationFrames,
      speechClarityEvidenceHash: plan.speechClarityEvidenceHash,
      speechClarityStatus: 'passed',
      audioExceptionManifest: plan.audioExceptionManifest,
    },
    finalMaster: finalMasterInput(authority),
  })
}

function commonQaPlanningPayload(
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
) {
  const plan = authority.approvedQaPlan
  return {
    qaRunId: plan.qaRunId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: authority.identity.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: plan.approvedExecutionPackageHash,
    approvedEstimateId: authority.approval.approvedEstimateId,
    creditReservationId: authority.approval.creditReservationId,
    approvedDeliverableId: plan.approvedDeliverableId,
    expectedEvidenceIdentity: plan.expectedEvidenceIdentity,
    finalMasterArtifactId: plan.finalMasterArtifactId,
    finalMasterObjectIdentityHash: plan.finalMasterObjectIdentityHash,
    width: plan.width,
    height: plan.height,
    fps: plan.fps,
    totalFrames: plan.totalFrames,
    mediaPolicyId: plan.mediaPolicyId,
    usesApprovedEditReservation: plan.usesApprovedEditReservation,
    requiresSeparateExportEstimate: plan.requiresSeparateExportEstimate,
    allowsAdditionalExportCharge: plan.allowsAdditionalExportCharge,
    mediaMutationAllowed: plan.mediaMutationAllowed,
    providerCallAllowed: plan.providerCallAllowed,
  }
}

function finalMasterInput(
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
) {
  return {
    inputId: 'final-master' as const,
    artifactId: authority.muxArtifact.objectIdentity,
    objectIdentityHash: authority.muxArtifact.objectIdentity,
    mimeType: 'video/mp4' as const,
    byteLength: authority.muxArtifact.byteLength,
    sha256: authority.muxArtifact.sha256,
    privateObject: true as const,
    placeholder: false as const,
    publicObject: false as const,
  }
}

function objectiveEvidenceAuthority(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  requestEnvelopeSha256: string
}): OfflineFinalMasterObjectiveEvidenceAuthority {
  const { authority, executionAttempt } = input
  const plan = authority.approvedQaPlan
  const approvedExceptionManifest = 'visualExceptionManifest' in plan
    ? plan.visualExceptionManifest
    : plan.audioExceptionManifest
  return {
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    editSessionId: authority.identity.editSessionId,
    qaRunId: plan.qaRunId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: authority.identity.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: plan.approvedExecutionPackageHash,
    approvedEstimateId: authority.approval.approvedEstimateId,
    creditReservationId: authority.approval.creditReservationId,
    approvedDeliverableId: plan.approvedDeliverableId,
    expectedEvidenceIdentity: plan.expectedEvidenceIdentity,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobId: authority.identity.jobId,
    executionAttemptId: executionAttempt.executionAttemptId,
    sourceMasterArtifactId: authority.muxArtifact.objectIdentity,
    sourceMasterObjectIdentityHash: authority.muxArtifact.objectIdentity,
    sourceMasterSha256: authority.muxArtifact.sha256,
    sourceMasterByteLength: authority.muxArtifact.byteLength,
    expectedDurationFrames: plan.totalFrames,
    approvedExceptionManifestHash: approvedExceptionManifest.manifestHash,
    approvedExceptionManifest,
    expectedRequestEnvelopeSha256: input.requestEnvelopeSha256,
    expectedRuntimeImageIdentityHash:
      authority.lineage.mediaBinaryImageIdentityHash,
  }
}

async function loadCurrent(
  context: ServiceContext,
  input: ExactInput,
): Promise<LoadedCustomerDeliveryAuthority> {
  return createCanonicalProfessionalLongFormCustomerDeliveryPackageService(
    context,
  ).loadCurrent(input)
}

async function loadCurrentWithCompletedMux(
  context: ServiceContext,
  input: ExactInput,
): Promise<LoadedCustomerDeliveryAuthority> {
  let current = await loadCurrent(context, input)
  const muxOrder = current.package.outputContract.chunkCount * 2 + 1
  const muxEntry = current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === muxOrder)
  if (!muxEntry) throw invalid('Customer-delivery mux queue entry is missing.')
  if (muxEntry.state === 'leased') {
    throw inProgress('Customer-delivery mux has an active lease.')
  }
  if (muxEntry.state !== 'completed') {
    await createCanonicalProfessionalLongFormCustomerDeliveryExecutionService(
      context,
    ).executePrivateH264AacMasterMux(input)
    current = await loadCurrent(context, input)
  }
  const completedMux = current.queueAggregate.entries.find((entry) =>
    entry.definition.canonicalOrder === muxOrder)
  if (completedMux?.state !== 'completed' || !completedMux.completion) {
    throw invalid('Decoded QA requires the exact completed customer-delivery mux.')
  }
  return current
}

async function requiredDecodedQaRuntimeAuthority(): Promise<
  OfflineMediaBinaryRuntimeAuthority
> {
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !authority ||
    authority.readiness.privateInternalExecutionReady !== true ||
    authority.readiness.privateInternalFinalMasterDecodedVideoQaReady !== true ||
    authority.readiness.privateInternalFinalMasterDecodedAudioQaReady !== true ||
    authority.readiness.longFormFinalMasterQaCheckpointingReady !== false ||
    authority.readiness.productReady !== false ||
    authority.readiness.productionReady !== false ||
    !authority.supportedOperations.some((operation) =>
      operation.toolId === 'ffmpeg' &&
      operation.operationId ===
        PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID)
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Decoded customer-delivery QA requires the pinned private FFmpeg runtime authority.',
    503,
  )
  return authority
}

async function inspectExactMuxArtifact(
  context: ServiceContext,
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
) {
  const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: context.env.localStorageRoot,
    privateObjectIdentityHash: authority.muxArtifact.objectIdentity,
  })
  if (
    !stored || stored.mediaFormat !== 'mp4' ||
    stored.byteLength !== authority.muxArtifact.byteLength ||
    stored.sha256 !== authority.muxArtifact.sha256
  ) throw invalid(
    'Decoded QA could not reopen the exact immutable private customer-delivery master.',
  )
  return stored
}

function privateInput(input: CanonicalPrivateCustomerDeliveryArtifactInspection) {
  return {
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: input.byteLength,
    sha256: input.sha256,
    openStream: input.openStream,
  }
}

function decodedQaEntry(
  current: Pick<LoadedCustomerDeliveryAuthority, 'package' | 'queueAggregate'>,
  kind: 'video' | 'audio',
): CanonicalPrivatePackageWorkQueueEntry {
  const selectedKind = kind === 'video'
    ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_KIND
    : PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_KIND
  const workItem = current.package.graph.workItems.find((item) =>
    item.kind === selectedKind)
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === workItem?.jobId)
  if (
    !workItem || !entry ||
    entry.definition.approvedWorkItemId !== workItem.workItemId
  ) throw invalid(`Canonical queue lost decoded-${kind} QA identity.`)
  return entry
}

function assertGraphAfterDecodedQa(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  current: LoadedCustomerDeliveryAuthority,
  kind: 'video' | 'audio',
): void {
  const chunkCount = current.package.outputContract.chunkCount
  const completedThroughMux = chunkCount * 2 + 2
  const video = aggregate.entries[chunkCount * 2 + 2]
  const audio = aggregate.entries[chunkCount * 2 + 3]
  const download = aggregate.entries[chunkCount * 2 + 4]
  const target = kind === 'video' ? video : audio
  const sibling = kind === 'video' ? audio : video
  const expectedCompleted = completedThroughMux + 1 +
    (sibling?.state === 'completed' ? 1 : 0)
  if (
    aggregate.summary.totalJobCount !== chunkCount * 2 + 5 ||
    aggregate.summary.completedJobCount !== expectedCompleted ||
    aggregate.summary.queuedJobCount !== aggregate.summary.totalJobCount -
      expectedCompleted ||
    aggregate.summary.leasedJobCount !== 0 ||
    aggregate.entries.slice(0, completedThroughMux).some((entry) =>
      entry.state !== 'completed' ||
      entry.deliveryAttemptCount !==
        entry.professionalLongFormExecutionAttempt?.deliveryAttempt ||
      !entry.professionalLongFormExecutionAuthorization ||
      !entry.professionalLongFormExecutionAttempt || !entry.completion) ||
    target?.state !== 'completed' ||
    target.deliveryAttemptCount !==
      target.professionalLongFormExecutionAttempt?.deliveryAttempt ||
    !target.professionalLongFormExecutionAuthorization ||
    !target.professionalLongFormExecutionAttempt || !target.completion ||
    !sibling || !['queued', 'completed'].includes(sibling.state) ||
    (sibling.state === 'queued' &&
      (sibling.deliveryAttemptCount !== 0 ||
        sibling.professionalLongFormExecutionAuthorization ||
        sibling.professionalLongFormExecutionAttempt || sibling.completion)) ||
    !download || download.state !== 'queued' ||
    download.deliveryAttemptCount !== 0 ||
    download.professionalLongFormExecutionAuthorization ||
    download.professionalLongFormExecutionAttempt || download.completion ||
    download.definition.dependencyJobIds.length !== 2 ||
    !video || !audio ||
    !download.definition.dependencyJobIds.includes(video.definition.jobId) ||
    !download.definition.dependencyJobIds.includes(audio.definition.jobId)
  ) throw invalid(
    `Decoded-${kind} QA completion changed the independently gated customer-delivery graph.`,
  )
}

function assertBothDecodedQaGraph(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  current: LoadedCustomerDeliveryAuthority,
): void {
  const chunkCount = current.package.outputContract.chunkCount
  const downloadOrder = chunkCount * 2 + 4
  const download = aggregate.entries[downloadOrder]
  if (
    aggregate.summary.totalJobCount !== chunkCount * 2 + 5 ||
    aggregate.summary.completedJobCount !== aggregate.summary.totalJobCount - 1 ||
    aggregate.summary.queuedJobCount !== 1 ||
    aggregate.summary.leasedJobCount !== 0 ||
    aggregate.entries.slice(0, downloadOrder).some((entry) =>
      entry.state !== 'completed' ||
      entry.deliveryAttemptCount !==
        entry.professionalLongFormExecutionAttempt?.deliveryAttempt ||
      !entry.professionalLongFormExecutionAuthorization ||
      !entry.professionalLongFormExecutionAttempt || !entry.completion) ||
    !download || download.state !== 'queued' ||
    download.deliveryAttemptCount !== 0 ||
    download.professionalLongFormExecutionAuthorization ||
    download.professionalLongFormExecutionAttempt || download.completion
  ) throw invalid(
    'Decoded QA did not leave exactly one separately unauthorized private-download job.',
  )
}

function startDecodedQaLeaseHeartbeat(input: {
  current: LoadedCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  claimId: string
  claimCredential: string
}) {
  let stopped = false
  let failure: unknown
  let pending = Promise.resolve()
  const tick = async () => {
    if (stopped || failure) return
    pending = pending.then(async () => {
      if (stopped || failure) return
      await heartbeatPrivateCanonicalPackageWorkQueueClaim({
        scope: input.current.scope,
        definition: input.current.queueDefinition,
        jobId: input.authority.identity.jobId,
        claimId: input.claimId,
        claimCredential: input.claimCredential,
        now: new Date().toISOString(),
        leaseDurationMs: input.authority.operation.leaseDurationMilliseconds,
      })
    }).catch((error: unknown) => { failure = error })
    await pending
    if (failure) throw failure
  }
  const timer = setInterval(
    () => void tick().catch(() => undefined),
    input.authority.operation.heartbeatIntervalMilliseconds,
  )
  timer.unref()
  return {
    tick,
    async stopAndAssertHealthy() {
      stopped = true
      clearInterval(timer)
      await pending
      if (failure) throw failure
    },
    async stopIgnoringFailure() {
      stopped = true
      clearInterval(timer)
      await pending
    },
  }
}

function assertDurableHeartbeat(input: {
  current: LoadedCustomerDeliveryAuthority
  kind: 'video' | 'audio'
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
}): void {
  const entry = decodedQaEntry(input.current, input.kind)
  const claim = entry.activeClaim
  if (
    entry.state !== 'leased' || !claim ||
    claim.claimId !== input.executionAttempt.claimId ||
    claim.deliveryAttempt !== input.executionAttempt.deliveryAttempt ||
    claim.heartbeatCount < 1 ||
    claim.claimHash === input.executionAttempt.claimHash ||
    Date.parse(claim.expiresAt) <= Date.parse(claim.heartbeatAt) ||
    Date.parse(claim.attemptDeadlineAt) < Date.parse(claim.expiresAt)
  ) throw invalid(
    `Decoded-${input.kind} QA heartbeat was not durably observed.`,
  )
}

async function persistAuthority<T extends object>(input: {
  context: ServiceContext
  authority: T
  verify(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority as unknown as Record<string, unknown>,
    maxBytes: 4 * 1024 * 1024,
  })
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertExact(
    input.verify(persisted),
    input.authority,
    'Persisted decoded-QA execution authority changed.',
  )
  return ref
}

async function persistExactJson<T extends object>(input: {
  context: ServiceContext
  value: T
  parse(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value as unknown as Record<string, unknown>,
    maxBytes: 4 * 1024 * 1024,
  })
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertExact(
    input.parse(persisted),
    input.value,
    'Persisted decoded-QA evidence changed.',
  )
  return ref
}

async function readParsedJson<T>(input: {
  context: ServiceContext
  ref: AuthorityJsonBlobRef
  parse(value: unknown): T
}): Promise<T> {
  return input.parse(await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: input.ref,
  }))
}

function requiredStoredAuthorityRef(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  authority: { authorityHash: string },
): AuthorityJsonBlobRef {
  const authorization = entry.professionalLongFormExecutionAuthorization
  if (!authorization || authorization.authorityHash !== authority.authorityHash) {
    throw invalid('Stored decoded-QA authority receipt changed.')
  }
  return authorization.authorityRef
}

function costIdentity(
  context: ServiceContext,
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  attempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt,
) {
  return {
    localStorageRoot: context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    editSessionId: authority.identity.editSessionId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobId: authority.identity.jobId,
    executionAttemptId: attempt.executionAttemptId,
    retryAttempt: attempt.deliveryAttempt,
  }
}

interface DecodedQaCostExpectation {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  runnerResultHash: string
  runnerResultByteLength: number
  workloadProfileId:
    | typeof PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_COST_PROFILE_ID
    | typeof PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_COST_PROFILE_ID
}

function assertDecodedQaCostEvidence(
  input: DecodedQaCostExpectation & {
    evidence: PrivateInternalAttemptCostEvidence
  },
): void {
  const identity = input.evidence.identity
  if (
    identity.workspaceId !== input.authority.identity.workspaceId ||
    identity.projectId !== input.authority.identity.projectId ||
    identity.editSessionId !== input.authority.identity.editSessionId ||
    identity.approvedPlanSnapshotId !==
      input.authority.identity.approvedPlanSnapshotId ||
    identity.approvedWorkItemId !== input.authority.identity.approvedWorkItemId ||
    identity.jobId !== input.authority.identity.jobId ||
    identity.executionAttemptId !== input.executionAttempt.executionAttemptId ||
    identity.toolId !== 'ffmpeg' ||
    identity.operationId !==
      PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_QA_OPERATION_ID ||
    !('workloadProfileId' in identity) ||
    identity.workloadProfileId !== input.workloadProfileId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.runnerResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    input.evidence.resourceUsage.vcpuCount !== 2 ||
    input.evidence.resourceUsage.memoryGib !== 2 ||
    input.evidence.resourceUsage.gpuCount !== 0 ||
    input.evidence.resourceUsage.outputByteLength !== input.runnerResultByteLength ||
    input.evidence.actualInternalCostMicros <= 0 ||
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.persistence.invoiceReconciled ||
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u.test(
      stableAuthorityStringify(input.evidence),
    )
  ) throw invalid('Decoded-QA internal attempt-cost evidence changed.')
}

async function requiredDecodedQaCostEvidence(
  input: DecodedQaCostExpectation & {
    context: ServiceContext
    expectedHash: string
  },
): Promise<PrivateInternalAttemptCostEvidence> {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('Decoded-QA attempt-cost evidence is missing.')
  }
  assertDecodedQaCostEvidence({ ...input, evidence })
  return evidence
}

function parseStoredVideoObjectiveEvidence(
  value: unknown,
): AcceptedVideoObjectiveEvidence {
  const record = requireRecord(value)
  if (
    record.schemaVersion !== 'objective-final-master-qa-gate-evidence-v1' ||
    record.gateId !== 'decoded_video_integrity' ||
    !['passed', 'needs_user_review'].includes(String(record.outcome))
  ) throw invalid('Stored decoded-video objective evidence is invalid.')
  assertHashed(record, 'evidenceHash')
  return record as unknown as AcceptedVideoObjectiveEvidence
}

function parseStoredAudioObjectiveEvidence(
  value: unknown,
): AcceptedAudioObjectiveEvidence {
  const record = requireRecord(value)
  if (
    record.schemaVersion !== 'objective-final-master-qa-gate-evidence-v1' ||
    record.gateId !== 'decoded_audio_quality_sync' ||
    !['passed', 'needs_user_review'].includes(String(record.outcome))
  ) throw invalid('Stored decoded-audio objective evidence is invalid.')
  assertHashed(record, 'evidenceHash')
  return record as unknown as AcceptedAudioObjectiveEvidence
}

function assertAcceptedObjectiveOutcome(
  evidence: ObjectiveDecodedVideoIntegrityEvidence |
    ObjectiveDecodedAudioQualitySyncEvidence,
): asserts evidence is AcceptedVideoObjectiveEvidence |
  AcceptedAudioObjectiveEvidence {
  if (evidence.outcome === 'failed') {
    throw invalid(
      'Decoded-QA runner returned a failed objective outcome and cannot complete the package job.',
    )
  }
}

function assertStoredArtifactCommon(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  artifact: ProfessionalLongFormDeliveryDecodedVideoQaArtifact |
    ProfessionalLongFormDeliveryDecodedAudioQaArtifact
}): void {
  if (
    input.artifact.authorityHash !== input.authority.authorityHash ||
    input.artifact.executionAttemptHash !== input.executionAttempt.attemptHash ||
    input.artifact.identity.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
    input.artifact.identity.jobId !== input.authority.identity.jobId ||
    input.artifact.identity.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    stableAuthorityStringify(input.artifact.muxArtifact) !==
      stableAuthorityStringify(input.authority.muxArtifact) ||
    input.artifact.runtimeImageIdentityHash !==
      input.authority.lineage.mediaBinaryImageIdentityHash ||
    input.artifact.checks.noMediaMutationOrCommercialAction !== 'passed'
  ) throw invalid('Stored decoded-QA artifact lineage changed.')
}

function assertStoredRunnerAndObjectiveEvidence(input: {
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  artifact: ProfessionalLongFormDeliveryDecodedVideoQaArtifact |
    ProfessionalLongFormDeliveryDecodedAudioQaArtifact
  rawRunnerResult: Readonly<Record<string, unknown>>
  runtimeReceipt: Readonly<Record<string, unknown>>
  objectiveEvidence: ObjectiveDecodedVideoIntegrityEvidence |
    ObjectiveDecodedAudioQualitySyncEvidence
}): void {
  const runtimeEvidence = requireRecord(
    input.runtimeReceipt.evidence,
    'Stored decoded-QA runtime evidence is missing.',
  )
  const runtimeImage = requireRecord(
    input.runtimeReceipt.image,
    'Stored decoded-QA runtime image evidence is missing.',
  )
  const runtimeResultIdentity =
    reconstructedRuntimeResultIdentity(input.rawRunnerResult)
  const checks = {
    rawRunnerResultHash:
      sha256AuthorityValue(input.rawRunnerResult) ===
        input.artifact.rawRunnerResultRef.sha256,
    runtimeReceiptResultHash:
      input.runtimeReceipt.resultSha256 ===
        runtimeResultIdentity.sha256,
    runtimeReceiptResultByteLength:
      input.runtimeReceipt.resultByteLength ===
        runtimeResultIdentity.byteLength,
    runtimeEvidenceResultHash:
      runtimeEvidence.resultSha256 === runtimeResultIdentity.sha256,
    runtimeEvidenceSourceHash:
      runtimeEvidence.sourceSha256 === input.authority.muxArtifact.sha256,
    runtimeEvidenceRequestHash:
      runtimeEvidence.requestEnvelopeSha256 ===
        input.artifact.requestEnvelopeSha256,
    runtimeImageIdentity:
      runtimeImage.imageIdentityHash ===
        input.authority.lineage.mediaBinaryImageIdentityHash,
    objectiveEvidenceHash:
      input.objectiveEvidence.evidenceHash ===
        input.artifact.objectiveEvidenceHash,
    objectiveEvidenceArtifactHash:
      input.objectiveEvidence.evidenceArtifactHash ===
        runtimeResultIdentity.sha256,
    objectiveQaRun:
      input.objectiveEvidence.qaRunId === input.authority.approvedQaPlan.qaRunId,
    objectiveSnapshot:
      input.objectiveEvidence.approvedPlanSnapshotId ===
        input.authority.identity.approvedPlanSnapshotId,
    objectiveSourceArtifact:
      input.objectiveEvidence.sourceMasterArtifactId ===
        input.authority.muxArtifact.objectIdentity,
    objectiveSourceHash:
      input.objectiveEvidence.sourceMasterSha256 ===
        input.authority.muxArtifact.sha256,
    objectiveAttempt:
      input.objectiveEvidence.executionAttemptId ===
        input.executionAttempt.executionAttemptId,
    objectiveOutcome:
      input.objectiveEvidence.outcome === input.artifact.outcome,
    objectiveRuntimeImage:
      input.objectiveEvidence.runtimeImageIdentityHash ===
        input.authority.lineage.mediaBinaryImageIdentityHash,
    noProviderCall: input.objectiveEvidence.providerCallMade === false,
    noCustomerPrice:
      input.objectiveEvidence.commercialBoundary
        .customerPriceAuthorityIncluded === false,
    noCustomerCredits:
      input.objectiveEvidence.commercialBoundary
        .customerCreditAuthorityIncluded === false,
    noServiceFee:
      input.objectiveEvidence.commercialBoundary
        .serviceFeeAuthorityIncluded === false,
  }
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([check]) => check)
  if (failedChecks.length > 0) throw invalid(
    'Stored decoded-QA runner or objective evidence changed.',
    { failedChecks },
  )
}

function reconstructedRuntimeResultIdentity(
  rawRunnerResult: Readonly<Record<string, unknown>>,
): Readonly<{ sha256: string; byteLength: number }> {
  const serialized = `${stableAuthorityStringify(rawRunnerResult)}\n`
  return Object.freeze({
    sha256: createHash('sha256').update(serialized).digest('hex'),
    byteLength: Buffer.byteLength(serialized, 'utf8'),
  })
}

function assertStoredReconciliation(input: {
  current: LoadedCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryDecodedVideoQaAuthority |
    ProfessionalLongFormDeliveryDecodedAudioQaAuthority
  executionAttempt: ProfessionalLongFormDeliveryDecodedVideoQaAttempt |
    ProfessionalLongFormDeliveryDecodedAudioQaAttempt
  artifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryDecodedVideoQaReconciliation |
    ProfessionalLongFormDeliveryDecodedAudioQaReconciliation
  outcome: 'passed' | 'needs_user_review'
  kind: 'video' | 'audio'
}): void {
  assertHashed(input.reconciliation, 'reconciliationHash')
  const sibling = decodedQaEntry(
    input.current,
    input.kind === 'video' ? 'audio' : 'video',
  )
  const download = input.current.package.graph.workItems.find((item) =>
    item.kind === 'reconcile_private_customer_delivery_download')
  if (
    input.reconciliation.qaJobId !== input.authority.identity.jobId ||
    input.reconciliation.qaApprovedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    input.reconciliation.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
    input.reconciliation.authorityHash !== input.authority.authorityHash ||
    stableAuthorityStringify(input.reconciliation.muxArtifact) !==
      stableAuthorityStringify(input.authority.muxArtifact) ||
    stableAuthorityStringify(input.reconciliation.qaArtifactRef) !==
      stableAuthorityStringify(input.artifactRef) ||
    input.reconciliation.qaOutcome !== input.outcome ||
    input.reconciliation.siblingDecodedQa.jobId !== sibling.definition.jobId ||
    input.reconciliation.siblingDecodedQa.approvedWorkItemId !==
      sibling.definition.approvedWorkItemId ||
    input.reconciliation.privateDownload.jobId !== download?.jobId ||
    input.reconciliation.privateDownload.executionAuthorized ||
    input.reconciliation.publicDeliveryAuthorized
  ) throw invalid('Stored decoded-QA reconciliation lineage changed.')
}

function assertObjectiveCostSet(
  objectiveEvidence: ObjectiveDecodedVideoIntegrityEvidence |
    ObjectiveDecodedAudioQualitySyncEvidence,
  costEvidence: PrivateInternalAttemptCostEvidence,
): void {
  const expected = sha256AuthorityValue({
    domain: 'objective_final_master_internal_cost_evidence_set_v1',
    attemptCostEvidenceHashes: [costEvidence.evidenceHash],
  })
  if (objectiveEvidence.internalCostEvidenceSetHash !== expected) {
    throw invalid('Decoded-QA objective evidence lost its attempt-cost binding.')
  }
}

function assertStoredQueueCompletion(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  artifactRef: AuthorityJsonBlobRef,
): void {
  const outcome = entry.completion?.outcome
  if (
    entry.state !== 'completed' ||
    entry.deliveryAttemptCount !==
      entry.professionalLongFormExecutionAttempt?.deliveryAttempt ||
    !outcome || outcome.contentType !== 'application/json' ||
    outcome.artifactId !== entry.definition.expectedOutputIdentity ||
    outcome.sha256 !== artifactRef.sha256 || outcome.adapterReplayed ||
    outcome.blockedDependencyJobIds.length !== 0
  ) throw invalid('Stored decoded-QA queue completion changed.')
}

function requireRecord(
  value: unknown,
  message = 'Stored decoded-QA JSON evidence is invalid.',
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(message)
  }
  return value as Readonly<Record<string, unknown>>
}

function assertExactInput(input: unknown): asserts input is ExactInput {
  if (
    !input || typeof input !== 'object' ||
    Object.keys(input).sort().join('|') !==
      'approvedPlanSnapshotId|workspaceId'
  ) throw invalid(
    'Decoded-QA execution accepts no caller job, source, path, command, exception, price, credit, provider, or download fields.',
  )
}

function requireOwner(context: ServiceContext): string {
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) {
    throw new ApiError(
      'AUTH_REQUIRED',
      'Decoded customer-delivery QA requires authenticated authority.',
      401,
    )
  }
  return ownerUserId
}

function assertUnexpired(expiresAt: string): void {
  if (Date.parse(expiresAt) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Decoded customer-delivery QA requires the unexpired original reservation.',
      409,
    )
  }
}

function assertHashed<T extends object>(value: T, key: keyof T): void {
  const payload = { ...value } as Record<PropertyKey, unknown>
  const propertyKey = key as PropertyKey
  const hash = payload[propertyKey]
  delete payload[propertyKey]
  if (typeof hash !== 'string' || hash !== sha256AuthorityValue(payload)) {
    throw invalid('Stored decoded-QA evidence checksum changed.')
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw invalid(message)
  }
}

function withoutAggregate<T extends { queueAggregate: unknown }>(value: T) {
  const rest = { ...value }
  delete rest.queueAggregate
  return rest
}

function invalid(
  message: string,
  details: Readonly<Record<string, unknown>> = {},
): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_professional_long_form_customer_delivery_decoded_qa_exact_runner_cost_reconciliation_authority',
    ...details,
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
