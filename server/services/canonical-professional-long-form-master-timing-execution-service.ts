import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
  professionalLongFormFirstChildCompletionSchema,
  professionalLongFormFirstChildExecutionAttemptSchema,
  type ProfessionalLongFormFirstChildAuthorizationReceipt,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  assertProfessionalLongFormFirstChildExecutionAuthority,
  assertProfessionalLongFormFirstChildQaEvidence,
  assertProfessionalLongFormFirstChildReconciliationEvidence,
  assertProfessionalLongFormFirstChildTerminalEvidence,
  assertProfessionalLongFormFirstChildValidationArtifact,
  buildProfessionalLongFormFirstChildAuthorizationReceipt,
  professionalLongFormFirstChildCanonicalResultHash,
} from '../edit-architecture/professional-long-form-first-child-execution'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
  professionalLongFormMasterTimingCompletionSchema,
  professionalLongFormMasterTimingExecutionAttemptSchema,
  type ProfessionalLongFormMasterTimingAuthorizationReceipt,
  type ProfessionalLongFormMasterTimingExecutionAttempt,
  type ProfessionalLongFormMasterTimingExecutionAuthority,
  type ProfessionalLongFormMasterTimingQaEvidence,
  type ProfessionalLongFormMasterTimingReconciliationEvidence,
  type ProfessionalLongFormMasterTimingTerminalEvidence,
  type ProfessionalLongFormMasterTimingValidationArtifact,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  assertProfessionalLongFormMasterTimingExecutionAuthority,
  assertProfessionalLongFormMasterTimingQaEvidence,
  assertProfessionalLongFormMasterTimingReconciliationEvidence,
  assertProfessionalLongFormMasterTimingTerminalEvidence,
  assertProfessionalLongFormMasterTimingValidationArtifact,
  buildProfessionalLongFormMasterTimingAuthorizationReceipt,
  buildProfessionalLongFormMasterTimingCompletion,
  buildProfessionalLongFormMasterTimingExecutionAuthority,
  buildProfessionalLongFormMasterTimingQaEvidence,
  buildProfessionalLongFormMasterTimingReconciliationEvidence,
  buildProfessionalLongFormMasterTimingTerminalEvidence,
  buildProfessionalLongFormMasterTimingValidationArtifact,
  professionalLongFormMasterTimingCanonicalResultHash,
} from '../edit-architecture/professional-long-form-master-timing-execution'
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
} from './private-canonical-package-work-queue-store'
import {
  completePrivateCanonicalPackageWorkQueueProfessionalLongFormClaim,
} from './canonical-professional-long-form-completed-attempt-reconciliation-service'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
  type CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from './canonical-professional-long-form-child-package-promotion-service'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_VERSION =
  'canonical-professional-long-form-master-timing-execution-v1' as const

export interface CanonicalProfessionalLongFormMasterTimingExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_VERSION
  source: 'canonical_professional_long_form_master_timing_execution_service'
  status:
    | 'master_timing_validation_completed_queue_progress_preserved'
    | 'master_timing_validation_in_progress_downstream_blocked'
  disposition: 'completed' | 'exact_replay' | 'already_in_progress'
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt?: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifact?: ProfessionalLongFormMasterTimingValidationArtifact
  validationArtifactRef?: AuthorityJsonBlobRef
  qaEvidence?: ProfessionalLongFormMasterTimingQaEvidence
  qaEvidenceRef?: AuthorityJsonBlobRef
  reconciliationEvidence?: ProfessionalLongFormMasterTimingReconciliationEvidence
  reconciliationEvidenceRef?: AuthorityJsonBlobRef
  attemptInternalCostEvidence?: PrivateInternalAttemptCostEvidence
  terminalEvidence?: ProfessionalLongFormMasterTimingTerminalEvidence
  terminalEvidenceRef?: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    rootCompletionReopenedAndVerified: true
    timingEstimateMetadataReopenedAndVerified: true
    timingAuthorizationPersisted: true
    timingLeaseVerified: boolean
    timingOneUseDispatchVerified: boolean
    exactTimingComponentRefsVerified: boolean
    frameTimelineAndPriorityVerified: boolean
    timingApprovalAndEstimateCoverageVerified: boolean
    timingQaVerified: boolean
    timingReconciliationVerified: boolean
    timingAttemptInternalCostVerified: boolean
    timingQueueCompletionVerified: boolean
    directDownstreamDependencyCount: number
    directDownstreamCurrentlyBlocked: boolean
    downstreamExecutionAuthorizedByThisCompletion: false
    remainingIncompleteChildJobCount: number
    structuredMetadataOnly: true
    transcriptOrMediaAnalysisPerformed: false
    mediaDecodeOrTransformPerformed: false
    renderPerformed: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    providerActivationAuthorized: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormMasterTimingExecutionService(
  context: ServiceContext,
) {
  return {
    async authorizeAndExecute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormMasterTimingExecutionEvidence> {
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form master-timing execution requires authenticated authority.',
          401,
        )
      }
      const current =
        await createCanonicalProfessionalLongFormChildPackagePromotionService(
          context,
        ).loadCurrent(input)
      await assertRootCompletionDependency({ context, current, ownerUserId })
      await assertTimingEstimateMetadata({ context, current })
      const authority = buildProfessionalLongFormMasterTimingExecutionAuthority({
        ownerUserId,
        current,
      })
      const authorityRef = await persistAndVerifyAuthority({
        context,
        current,
        ownerUserId,
        authority,
      })
      const authorization =
        buildProfessionalLongFormMasterTimingAuthorizationReceipt({
          authority,
          authorityRef,
        })
      const currentTiming = current.queueAggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (currentTiming?.state === 'completed') {
        return loadCompletedEvidence({
          context,
          current,
          authority,
          authorityRef,
          authorization,
          aggregate: current.queueAggregate,
          disposition: 'exact_replay',
        })
      }
      if (Date.parse(authority.approval.reservationExpiresAt) <= Date.now()) {
        throw new ApiError(
          'CREDITS_NOT_RESERVED',
          'Professional long-form master-timing execution requires an unexpired funded reservation.',
          409,
        )
      }
      const authorized = await authorizePrivateCanonicalPackageWorkQueueJob({
        scope: current.scope,
        definition: current.queueDefinition,
        jobId: authority.identity.jobId,
        authorization,
        executionAuthority: authority,
        now: new Date().toISOString(),
      })
      const authorizedTiming = authorized.aggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (authorizedTiming?.state === 'completed') {
        return loadCompletedEvidence({
          context,
          current,
          authority,
          authorityRef,
          authorization,
          aggregate: authorized.aggregate,
          disposition: 'exact_replay',
        })
      }
      const claim = await claimPrivateCanonicalPackageWorkQueueJob({
        scope: current.scope,
        definition: current.queueDefinition,
        jobId: authority.identity.jobId,
        workerIdentity:
          'canonical-professional-long-form-master-timing-service-v1',
        workerType: 'qa_worker',
        now: new Date().toISOString(),
        leaseDurationMs: authority.operation.leaseDurationMilliseconds,
      })
      if (claim.disposition === 'completed') {
        return loadCompletedEvidence({
          context,
          current,
          authority,
          authorityRef,
          authorization,
          aggregate: claim.aggregate,
          disposition: 'exact_replay',
        })
      }
      if (claim.disposition === 'already_leased') {
        return buildInProgressEvidence({
          authority,
          authorityRef,
          authorization,
          aggregate: claim.aggregate,
        })
      }
      if (claim.disposition !== 'claimed') {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          `Professional long-form master-timing claim remained ${claim.disposition}.`,
          409,
        )
      }

      const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
        scope: current.scope,
        definition: current.queueDefinition,
        jobId: authority.identity.jobId,
        claimId: claim.entry.activeClaim.claimId,
        claimCredential: claim.claimCredential,
        now: new Date().toISOString(),
      })
      const executionAttempt =
        professionalLongFormMasterTimingExecutionAttemptSchema.parse(
          begun.executionAttempt,
        )
      const costMeter = await beginPrivateInternalAttemptCostEvidence({
        localStorageRoot: context.env.localStorageRoot,
        workspaceId: authority.identity.workspaceId,
        projectId: authority.identity.projectId,
        editSessionId: authority.identity.editSessionId,
        approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
        approvedWorkItemId: authority.identity.approvedWorkItemId,
        jobId: authority.identity.jobId,
        executionAttemptId: executionAttempt.executionAttemptId,
        retryAttempt: executionAttempt.deliveryAttempt,
        toolId: 'reeditpro_internal',
        operationId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
        workloadProfileId: PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
      })

      try {
        const validationArtifact =
          buildProfessionalLongFormMasterTimingValidationArtifact({
            current,
            authority,
            authorization,
            executionAttempt,
            validatedAt: new Date().toISOString(),
          })
        const validationArtifactRef = await persistAndVerifyValidationArtifact({
          context,
          current,
          authority,
          authorization,
          executionAttempt,
          validationArtifact,
        })
        const qaEvidence = buildProfessionalLongFormMasterTimingQaEvidence({
          authority,
          authorization,
          executionAttempt,
          validationArtifact,
          validationArtifactRef,
          evaluatedAt: new Date().toISOString(),
        })
        const qaEvidenceRef = await persistAndVerifyQaEvidence({
          context,
          authority,
          authorization,
          executionAttempt,
          validationArtifact,
          validationArtifactRef,
          qaEvidence,
        })
        const reconciliationEvidence =
          buildProfessionalLongFormMasterTimingReconciliationEvidence({
            current,
            authority,
            authorization,
            executionAttempt,
            validationArtifactRef,
            qaEvidence,
            qaEvidenceRef,
            reconciledAt: new Date().toISOString(),
          })
        const reconciliationEvidenceRef =
          await persistAndVerifyReconciliationEvidence({
            context,
            current,
            authority,
            authorization,
            executionAttempt,
            validationArtifactRef,
            qaEvidence,
            qaEvidenceRef,
            reconciliationEvidence,
          })
        const canonicalResultHash =
          professionalLongFormMasterTimingCanonicalResultHash({
            authority,
            executionAttempt,
            validationArtifactRef,
            qaEvidenceRef,
            reconciliationEvidenceRef,
          })
        const attemptCost = await costMeter.finalize({
          status: 'completed',
          failureCategory: 'none',
          outputByteLength: validationArtifactRef.byteLength,
          linkedCanonicalOutcomeHash: canonicalResultHash,
        })
        assertInternalCostBoundary({
          evidence: attemptCost.evidence,
          authority,
          executionAttempt,
          canonicalResultHash,
        })
        const terminalEvidence =
          buildProfessionalLongFormMasterTimingTerminalEvidence({
            authority,
            authorization,
            executionAttempt,
            validationArtifactRef,
            qaEvidenceRef,
            reconciliationEvidenceRef,
            canonicalResultHash,
            attemptInternalCostEvidenceHash: attemptCost.evidence.evidenceHash,
            completedAt: new Date().toISOString(),
          })
        const terminalEvidenceRef = await persistAndVerifyTerminalEvidence({
          context,
          authority,
          authorization,
          executionAttempt,
          validationArtifactRef,
          qaEvidenceRef,
          reconciliationEvidenceRef,
          canonicalResultHash,
          attemptInternalCostEvidenceHash: attemptCost.evidence.evidenceHash,
          terminalEvidence,
        })
        const specializedCompletion =
          buildProfessionalLongFormMasterTimingCompletion({
            authority,
            authorization,
            executionAttempt,
            canonicalResultHash,
            attemptInternalCostEvidenceHash: attemptCost.evidence.evidenceHash,
            validationArtifactRef,
            qaEvidenceRef,
            reconciliationEvidenceRef,
            terminalEvidenceRef,
          })
        const timingDefinition = current.queueDefinition.jobs.find((job) =>
          job.jobId === authority.identity.jobId)
        if (!timingDefinition) {
          throw invalid(
            'Professional long-form master-timing queue definition is missing.',
          )
        }
        const completedAggregate =
          await completePrivateCanonicalPackageWorkQueueProfessionalLongFormClaim({
            scope: current.scope,
            definition: current.queueDefinition,
            jobId: authority.identity.jobId,
            claimId: claim.entry.activeClaim.claimId,
            claimCredential: claim.claimCredential,
            outcome: {
              jobId: authority.identity.jobId,
              approvedWorkItemId: authority.identity.approvedWorkItemId,
              workItemKey: authority.identity.approvedWorkItemId,
              required: true,
              dependencyJobIds: [...timingDefinition.dependencyJobIds],
              status: 'completed_private_test',
              artifactId:
                `long-form-master-timing-${validationArtifactRef.sha256.slice(0, 40)}`,
              contentType: 'application/json',
              sha256: validationArtifactRef.sha256,
              adapterReplayed: false,
              blockedDependencyJobIds: [],
              professionalLongFormExecution: specializedCompletion,
            },
            now: new Date().toISOString(),
          })
        return loadCompletedEvidence({
          context,
          current,
          authority,
          authorityRef,
          authorization,
          aggregate: completedAggregate,
          disposition: 'completed',
        })
      } catch (error) {
        await costMeter.finalize({
          status: 'failed',
          failureCategory: classifyPrivateInternalAttemptCostFailure(error),
          outputByteLength: null,
          linkedCanonicalOutcomeHash: null,
        }).catch(() => undefined)
        throw error
      }
    },
  }
}

async function assertRootCompletionDependency(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
}): Promise<void> {
  const root = input.current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const storedAuthorization = root?.professionalLongFormExecutionAuthorization
  if (!root || root.state !== 'completed' || !storedAuthorization) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Professional long-form master timing requires the completed root validation child.',
      409,
    )
  }
  const authorization = storedAuthorization as
    ProfessionalLongFormFirstChildAuthorizationReceipt
  const authorityValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorization.authorityRef,
  })
  const authority = assertProfessionalLongFormFirstChildExecutionAuthority({
    value: authorityValue,
    ownerUserId: input.ownerUserId,
    current: input.current,
  })
  const expectedAuthorization =
    buildProfessionalLongFormFirstChildAuthorizationReceipt({
      authority,
      authorityRef: authorization.authorityRef,
    })
  const attempt = professionalLongFormFirstChildExecutionAttemptSchema.parse(
    root.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormFirstChildCompletionSchema.parse(
    root.completion?.outcome.professionalLongFormExecution,
  )
  if (
    stableAuthorityStringify(authorization) !==
      stableAuthorityStringify(expectedAuthorization) ||
    completion.executionAttemptId !== attempt.executionAttemptId ||
    completion.authorityHash !== authority.authorityHash
  ) {
    throw invalid('Professional long-form root completion lineage changed.')
  }
  const validationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.validationArtifactRef,
  })
  const validationArtifact =
    assertProfessionalLongFormFirstChildValidationArtifact({
      value: validationValue,
      authority,
      authorization: expectedAuthorization,
      executionAttempt: attempt,
    })
  const qaValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.qaEvidenceRef,
  })
  const qaEvidence = assertProfessionalLongFormFirstChildQaEvidence({
    value: qaValue,
    authority,
    authorization: expectedAuthorization,
    executionAttempt: attempt,
    validationArtifact,
    validationArtifactRef: completion.validationArtifactRef,
  })
  const reconciliationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.reconciliationEvidenceRef,
  })
  assertProfessionalLongFormFirstChildReconciliationEvidence({
    value: reconciliationValue,
    authority,
    authorization: expectedAuthorization,
    executionAttempt: attempt,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidence,
    qaEvidenceRef: completion.qaEvidenceRef,
  })
  const canonicalResultHash = professionalLongFormFirstChildCanonicalResultHash({
    authority,
    executionAttempt: attempt,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidenceRef: completion.qaEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    executionAttemptId: attempt.executionAttemptId,
  })
  if (
    !costEvidence ||
    costEvidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID ||
    costEvidence.linkedCanonicalOutcomeHash !== canonicalResultHash ||
    costEvidence.evidenceHash !== completion.attemptInternalCostEvidenceHash
  ) {
    throw invalid('Professional long-form root cost evidence is incomplete.')
  }
  const terminalValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.terminalEvidenceRef,
  })
  assertProfessionalLongFormFirstChildTerminalEvidence({
    value: terminalValue,
    authority,
    authorization: expectedAuthorization,
    executionAttempt: attempt,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
  })
  const rootCompletionEvents = input.current.queueAggregate.events.filter((event) =>
    event.eventType === 'job_completed' &&
    event.jobId === root.definition.jobId)
  if (
    rootCompletionEvents.length !== 1 ||
    completion.canonicalResultHash !== canonicalResultHash
  ) {
    throw invalid('Professional long-form root terminal event is not unique.')
  }
}

async function assertTimingEstimateMetadata(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): Promise<void> {
  const line = input.current.authority.estimate.lineItems.find((candidate) =>
    candidate.lineKey === PROFESSIONAL_LONG_FORM_MASTER_TIMING_ESTIMATE_LINE_KEY)
  if (!line) {
    throw invalid(
      'Professional long-form approved estimate lacks timing-complexity coverage.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: line.metadataRef,
  })
  const expected = {
    childExecutionIncludedInApprovedReservation: true,
    timingComplexityIncludedInApprovedEstimate: true,
    timingComplexityProfileId:
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_PROFILE_ID,
    timingComplexityLevel: 'simple',
  }
  if (
    line.metadataRef.sha256 !== sha256AuthorityValue(value) ||
    stableAuthorityStringify(value) !== stableAuthorityStringify(expected)
  ) {
    throw invalid(
      'Professional long-form timing estimate metadata changed after approval.',
    )
  }
}

async function persistAndVerifyAuthority(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormMasterTimingExecutionAuthority({
    value,
    ownerUserId: input.ownerUserId,
    current: input.current,
  })
  return ref
}

async function persistAndVerifyValidationArtifact(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifact: ProfessionalLongFormMasterTimingValidationArtifact
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.validationArtifact as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormMasterTimingValidationArtifact({ ...input, value })
  return ref
}

async function persistAndVerifyQaEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifact: ProfessionalLongFormMasterTimingValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormMasterTimingQaEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.qaEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormMasterTimingQaEvidence({ ...input, value })
  return ref
}

async function persistAndVerifyReconciliationEvidence(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormMasterTimingQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidence: ProfessionalLongFormMasterTimingReconciliationEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.reconciliationEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormMasterTimingReconciliationEvidence({
    ...input,
    value,
  })
  return ref
}

async function persistAndVerifyTerminalEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  terminalEvidence: ProfessionalLongFormMasterTimingTerminalEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.terminalEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormMasterTimingTerminalEvidence({ ...input, value })
  return ref
}

async function loadCompletedEvidence(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  disposition: 'completed' | 'exact_replay'
}): Promise<CanonicalProfessionalLongFormMasterTimingExecutionEvidence> {
  const timing = input.aggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const root = input.aggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const attempt = professionalLongFormMasterTimingExecutionAttemptSchema.safeParse(
    timing?.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormMasterTimingCompletionSchema.safeParse(
    timing?.completion?.outcome.professionalLongFormExecution,
  )
  if (
    !timing || timing.state !== 'completed' ||
    !root || root.state !== 'completed' ||
    !attempt.success || !completion.success
  ) {
    throw invalid(
      'Professional long-form master-timing completion is not terminal.',
    )
  }
  const storedAuthorization = timing.professionalLongFormExecutionAuthorization
  if (
    !storedAuthorization ||
    stableAuthorityStringify(storedAuthorization) !==
      stableAuthorityStringify(input.authorization)
  ) {
    throw invalid(
      'Professional long-form master-timing authorization changed after commit.',
    )
  }
  const validationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.data.validationArtifactRef,
  })
  const validationArtifact =
    assertProfessionalLongFormMasterTimingValidationArtifact({
      value: validationValue,
      current: input.current,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt.data,
    })
  const qaValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.data.qaEvidenceRef,
  })
  const qaEvidence = assertProfessionalLongFormMasterTimingQaEvidence({
    value: qaValue,
    authority: input.authority,
    authorization: input.authorization,
    executionAttempt: attempt.data,
    validationArtifact,
    validationArtifactRef: completion.data.validationArtifactRef,
  })
  const reconciliationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.data.reconciliationEvidenceRef,
  })
  const reconciliationEvidence =
    assertProfessionalLongFormMasterTimingReconciliationEvidence({
      value: reconciliationValue,
      current: input.current,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt.data,
      validationArtifactRef: completion.data.validationArtifactRef,
      qaEvidence,
      qaEvidenceRef: completion.data.qaEvidenceRef,
    })
  const canonicalResultHash =
    professionalLongFormMasterTimingCanonicalResultHash({
      authority: input.authority,
      executionAttempt: attempt.data,
      validationArtifactRef: completion.data.validationArtifactRef,
      qaEvidenceRef: completion.data.qaEvidenceRef,
      reconciliationEvidenceRef: completion.data.reconciliationEvidenceRef,
    })
  const costEvidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: attempt.data.executionAttemptId,
  })
  if (!costEvidence) {
    throw invalid(
      'Professional long-form master-timing attempt cost evidence is missing.',
    )
  }
  assertInternalCostBoundary({
    evidence: costEvidence,
    authority: input.authority,
    executionAttempt: attempt.data,
    canonicalResultHash,
  })
  const terminalValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.data.terminalEvidenceRef,
  })
  const terminalEvidence =
    assertProfessionalLongFormMasterTimingTerminalEvidence({
      value: terminalValue,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt.data,
      validationArtifactRef: completion.data.validationArtifactRef,
      qaEvidenceRef: completion.data.qaEvidenceRef,
      reconciliationEvidenceRef: completion.data.reconciliationEvidenceRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    })
  const authorizationEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_execution_authorized' &&
    event.jobId === timing.definition.jobId)
  const startEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_execution_started' &&
    event.jobId === timing.definition.jobId)
  const completionEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_completed' &&
    event.jobId === timing.definition.jobId)
  if (
    completion.data.canonicalResultHash !== canonicalResultHash ||
    completion.data.attemptInternalCostEvidenceHash !== costEvidence.evidenceHash ||
    completion.data.authorityHash !== input.authority.authorityHash ||
    completion.data.authorizationId !== input.authorization.authorizationId ||
    completion.data.executionAttemptId !== attempt.data.executionAttemptId ||
    timing.completion?.outcome.sha256 !==
      completion.data.validationArtifactRef.sha256 ||
    timing.deliveryAttemptCount !== 1 ||
    input.aggregate.summary.completedJobCount < 2 ||
    input.aggregate.summary.totalDeliveryAttemptCount < 2 ||
    input.aggregate.summary.queuedJobCount +
      input.aggregate.summary.leasedJobCount +
      input.aggregate.summary.completedJobCount !==
      input.aggregate.summary.totalJobCount ||
    authorizationEvents.length !== 1 ||
    authorizationEvents[0]?.authorizationId !==
      input.authorization.authorizationId ||
    startEvents.length !== 1 ||
    startEvents[0]?.executionAttemptId !== attempt.data.executionAttemptId ||
    completionEvents.length !== 1
  ) {
    throw invalid(
      'Professional long-form master-timing completion did not preserve queue invariants.',
    )
  }
  const directDownstreamIds = new Set(
    reconciliationEvidence.directDownstream.map((entry) => entry.jobId),
  )
  const directDownstreamCurrentlyBlocked = input.aggregate.entries
    .filter((entry) => directDownstreamIds.has(entry.definition.jobId))
    .every((entry) => entry.state === 'queued' &&
      !entry.professionalLongFormExecutionAuthorization &&
      !entry.professionalLongFormExecutionAttempt && !entry.completion)
  const stablePayload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_master_timing_execution_service' as const,
    status:
      'master_timing_validation_completed_queue_progress_preserved' as const,
    authority: input.authority,
    authorityRef: input.authorityRef,
    authorization: input.authorization,
    executionAttempt: attempt.data,
    validationArtifact,
    validationArtifactRef: completion.data.validationArtifactRef,
    qaEvidence,
    qaEvidenceRef: completion.data.qaEvidenceRef,
    reconciliationEvidence,
    reconciliationEvidenceRef: completion.data.reconciliationEvidenceRef,
    attemptInternalCostEvidence: costEvidence,
    terminalEvidence,
    terminalEvidenceRef: completion.data.terminalEvidenceRef,
    queueAggregate: input.aggregate,
    readiness: {
      rootCompletionReopenedAndVerified: true as const,
      timingEstimateMetadataReopenedAndVerified: true as const,
      timingAuthorizationPersisted: true as const,
      timingLeaseVerified: true,
      timingOneUseDispatchVerified: true,
      exactTimingComponentRefsVerified: true,
      frameTimelineAndPriorityVerified: true,
      timingApprovalAndEstimateCoverageVerified: true,
      timingQaVerified: true,
      timingReconciliationVerified: true,
      timingAttemptInternalCostVerified: true,
      timingQueueCompletionVerified: true,
      directDownstreamDependencyCount:
        reconciliationEvidence.summary.directDownstreamCount,
      directDownstreamCurrentlyBlocked,
      downstreamExecutionAuthorizedByThisCompletion: false as const,
      remainingIncompleteChildJobCount:
        input.aggregate.summary.totalJobCount -
        input.aggregate.summary.completedJobCount,
      structuredMetadataOnly: true as const,
      transcriptOrMediaAnalysisPerformed: false as const,
      mediaDecodeOrTransformPerformed: false as const,
      renderPerformed: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...stablePayload,
    disposition: input.disposition,
    evidenceHash: sha256AuthorityValue(stablePayload),
  }
}

function buildInProgressEvidence(input: {
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormMasterTimingAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
}): CanonicalProfessionalLongFormMasterTimingExecutionEvidence {
  const stablePayload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_master_timing_execution_service' as const,
    status:
      'master_timing_validation_in_progress_downstream_blocked' as const,
    authority: input.authority,
    authorityRef: input.authorityRef,
    authorization: input.authorization,
    queueAggregate: input.aggregate,
    readiness: {
      rootCompletionReopenedAndVerified: true as const,
      timingEstimateMetadataReopenedAndVerified: true as const,
      timingAuthorizationPersisted: true as const,
      timingLeaseVerified: true,
      timingOneUseDispatchVerified: false,
      exactTimingComponentRefsVerified: false,
      frameTimelineAndPriorityVerified: false,
      timingApprovalAndEstimateCoverageVerified: false,
      timingQaVerified: false,
      timingReconciliationVerified: false,
      timingAttemptInternalCostVerified: false,
      timingQueueCompletionVerified: false,
      directDownstreamDependencyCount: 0,
      directDownstreamCurrentlyBlocked: true,
      downstreamExecutionAuthorizedByThisCompletion: false as const,
      remainingIncompleteChildJobCount:
        input.aggregate.summary.totalJobCount -
        input.aggregate.summary.completedJobCount,
      structuredMetadataOnly: true as const,
      transcriptOrMediaAnalysisPerformed: false as const,
      mediaDecodeOrTransformPerformed: false as const,
      renderPerformed: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...stablePayload,
    disposition: 'already_in_progress',
    evidenceHash: sha256AuthorityValue(stablePayload),
  }
}

function assertInternalCostBoundary(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormMasterTimingExecutionAuthority
  executionAttempt: ProfessionalLongFormMasterTimingExecutionAttempt
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'reeditpro_internal' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID ||
    input.evidence.identity.jobId !== input.authority.identity.jobId ||
    input.evidence.identity.executionAttemptId !==
      input.executionAttempt.executionAttemptId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.canonicalResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    !Number.isSafeInteger(input.evidence.actualInternalCostMicros) ||
    input.evidence.actualInternalCostMicros < 0 ||
    serialized.includes('customerPrice') ||
    serialized.includes('customerCredit') ||
    serialized.includes('serviceFee') ||
    serialized.includes('walletMutation') ||
    serialized.includes('billingAuthority')
  ) {
    throw invalid(
      'Professional long-form master-timing internal attempt cost crossed a commercial boundary.',
    )
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
