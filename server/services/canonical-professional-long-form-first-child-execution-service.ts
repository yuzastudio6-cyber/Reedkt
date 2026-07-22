import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
  professionalLongFormFirstChildCompletionSchema,
  professionalLongFormFirstChildExecutionAttemptSchema,
  type ProfessionalLongFormFirstChildAuthorizationReceipt,
  type ProfessionalLongFormFirstChildExecutionAttempt,
  type ProfessionalLongFormFirstChildExecutionAuthority,
  type ProfessionalLongFormFirstChildQaEvidence,
  type ProfessionalLongFormFirstChildReconciliationEvidence,
  type ProfessionalLongFormFirstChildTerminalEvidence,
  type ProfessionalLongFormFirstChildValidationArtifact,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  assertProfessionalLongFormFirstChildExecutionAuthority,
  assertProfessionalLongFormFirstChildQaEvidence,
  assertProfessionalLongFormFirstChildReconciliationEvidence,
  assertProfessionalLongFormFirstChildTerminalEvidence,
  assertProfessionalLongFormFirstChildValidationArtifact,
  buildProfessionalLongFormFirstChildAuthorizationReceipt,
  buildProfessionalLongFormFirstChildCompletion,
  buildProfessionalLongFormFirstChildExecutionAuthority,
  buildProfessionalLongFormFirstChildQaEvidence,
  buildProfessionalLongFormFirstChildReconciliationEvidence,
  buildProfessionalLongFormFirstChildTerminalEvidence,
  buildProfessionalLongFormFirstChildValidationArtifact,
  professionalLongFormFirstChildCanonicalResultHash,
} from '../edit-architecture/professional-long-form-first-child-execution'
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

export const CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_VERSION =
  'canonical-professional-long-form-first-child-execution-v1' as const

export interface CanonicalProfessionalLongFormFirstChildExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_VERSION
  source: 'canonical_professional_long_form_first_child_execution_service'
  status:
    | 'root_snapshot_validation_completed_remaining_children_blocked'
    | 'root_snapshot_validation_completed_queue_progress_preserved'
    | 'root_snapshot_validation_in_progress_remaining_children_blocked'
  disposition: 'completed' | 'exact_replay' | 'already_in_progress'
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt?: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifact?: ProfessionalLongFormFirstChildValidationArtifact
  validationArtifactRef?: AuthorityJsonBlobRef
  qaEvidence?: ProfessionalLongFormFirstChildQaEvidence
  qaEvidenceRef?: AuthorityJsonBlobRef
  reconciliationEvidence?: ProfessionalLongFormFirstChildReconciliationEvidence
  reconciliationEvidenceRef?: AuthorityJsonBlobRef
  attemptInternalCostEvidence?: PrivateInternalAttemptCostEvidence
  terminalEvidence?: ProfessionalLongFormFirstChildTerminalEvidence
  terminalEvidenceRef?: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    rootAuthorizationPersisted: true
    rootLeaseVerified: boolean
    rootOneUseDispatchVerified: boolean
    rootValidationArtifactVerified: boolean
    rootQaVerified: boolean
    rootReconciliationVerified: boolean
    rootAttemptInternalCostVerified: boolean
    rootQueueCompletionVerified: boolean
    downstreamDependencySatisfied: boolean
    downstreamExecutionAuthorizedByRootCompletion: false
    downstreamCurrentlyAuthorizedOrCompleted: boolean
    remainingChildJobCount: number
    sourceMediaExecutionVerified: false
    chunkRenderExecutionVerified: false
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

export function createCanonicalProfessionalLongFormFirstChildExecutionService(
  context: ServiceContext,
) {
  return {
    async authorizeAndExecute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormFirstChildExecutionEvidence> {
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form first-child execution requires authenticated authority.',
          401,
        )
      }
      const current =
        await createCanonicalProfessionalLongFormChildPackagePromotionService(
          context,
        ).loadCurrent(input)
      const authority = buildProfessionalLongFormFirstChildExecutionAuthority({
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
        buildProfessionalLongFormFirstChildAuthorizationReceipt({
          authority,
          authorityRef,
        })
      const currentRoot = current.queueAggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (currentRoot?.state === 'completed') {
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
          'Professional long-form root execution requires an unexpired funded reservation.',
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
      const authorizedRoot = authorized.aggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (authorizedRoot?.state === 'completed') {
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
        workerIdentity: 'canonical-professional-long-form-first-child-service-v1',
        workerType: 'api_service',
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
          `Professional long-form root claim remained ${claim.disposition}.`,
          409,
        )
      }

      const begun =
        await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
          scope: current.scope,
          definition: current.queueDefinition,
          jobId: authority.identity.jobId,
          claimId: claim.entry.activeClaim.claimId,
          claimCredential: claim.claimCredential,
          now: new Date().toISOString(),
        })
      const executionAttempt =
        professionalLongFormFirstChildExecutionAttemptSchema.parse(
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
        operationId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
        workloadProfileId: PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
      })

      try {
        const validationArtifact =
          buildProfessionalLongFormFirstChildValidationArtifact({
            authority,
            authorization,
            executionAttempt,
            validatedAt: new Date().toISOString(),
          })
        const validationArtifactRef = await persistAndVerifyValidationArtifact({
          context,
          authority,
          authorization,
          executionAttempt,
          validationArtifact,
        })
        const qaEvidence = buildProfessionalLongFormFirstChildQaEvidence({
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
        const downstream = requireDownstreamEntry(current, authority.identity.jobId)
        const reconciliationEvidence =
          buildProfessionalLongFormFirstChildReconciliationEvidence({
            authority,
            authorization,
            executionAttempt,
            validationArtifactRef,
            qaEvidence,
            qaEvidenceRef,
            downstreamJobId: downstream.definition.jobId,
            reconciledAt: new Date().toISOString(),
          })
        const reconciliationEvidenceRef =
          await persistAndVerifyReconciliationEvidence({
            context,
            authority,
            authorization,
            executionAttempt,
            validationArtifactRef,
            qaEvidence,
            qaEvidenceRef,
            reconciliationEvidence,
          })
        const canonicalResultHash =
          professionalLongFormFirstChildCanonicalResultHash({
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
          buildProfessionalLongFormFirstChildTerminalEvidence({
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
          canonicalResultHash,
          attemptInternalCostEvidenceHash: attemptCost.evidence.evidenceHash,
          terminalEvidence,
        })
        const specializedCompletion =
          buildProfessionalLongFormFirstChildCompletion({
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
              dependencyJobIds: [],
              status: 'completed_private_test',
              artifactId: `long-form-snapshot-validation-${validationArtifactRef.sha256.slice(0, 40)}`,
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

async function persistAndVerifyAuthority(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
  authority: ProfessionalLongFormFirstChildExecutionAuthority
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormFirstChildExecutionAuthority({
    value,
    ownerUserId: input.ownerUserId,
    current: input.current,
  })
  return ref
}

async function persistAndVerifyValidationArtifact(input: {
  context: ServiceContext
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifact: ProfessionalLongFormFirstChildValidationArtifact
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.validationArtifact as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormFirstChildValidationArtifact({ ...input, value })
  return ref
}

async function persistAndVerifyQaEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifact: ProfessionalLongFormFirstChildValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormFirstChildQaEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.qaEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormFirstChildQaEvidence({ ...input, value })
  return ref
}

async function persistAndVerifyReconciliationEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormFirstChildQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidence: ProfessionalLongFormFirstChildReconciliationEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.reconciliationEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormFirstChildReconciliationEvidence({ ...input, value })
  return ref
}

async function persistAndVerifyTerminalEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  terminalEvidence: ProfessionalLongFormFirstChildTerminalEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.terminalEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormFirstChildTerminalEvidence({ ...input, value })
  return ref
}

async function loadCompletedEvidence(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  disposition: 'completed' | 'exact_replay'
}): Promise<CanonicalProfessionalLongFormFirstChildExecutionEvidence> {
  const root = input.aggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const parsedAttempt = professionalLongFormFirstChildExecutionAttemptSchema.safeParse(
    root?.professionalLongFormExecutionAttempt,
  )
  const parsedCompletion = professionalLongFormFirstChildCompletionSchema.safeParse(
    root?.completion?.outcome.professionalLongFormExecution,
  )
  if (
    !root || root.state !== 'completed' ||
    !parsedAttempt.success || !parsedCompletion.success
  ) {
    throw invalid('Professional long-form root completion is not terminal.')
  }
  const attempt = parsedAttempt.data
  const completion = parsedCompletion.data
  const validationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.validationArtifactRef,
  })
  const validationArtifact =
    assertProfessionalLongFormFirstChildValidationArtifact({
      value: validationValue,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt,
    })
  const qaValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.qaEvidenceRef,
  })
  const qaEvidence = assertProfessionalLongFormFirstChildQaEvidence({
    value: qaValue,
    authority: input.authority,
    authorization: input.authorization,
    executionAttempt: attempt,
    validationArtifact,
    validationArtifactRef: completion.validationArtifactRef,
  })
  const reconciliationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.reconciliationEvidenceRef,
  })
  const reconciliationEvidence =
    assertProfessionalLongFormFirstChildReconciliationEvidence({
      value: reconciliationValue,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt,
      validationArtifactRef: completion.validationArtifactRef,
      qaEvidence,
      qaEvidenceRef: completion.qaEvidenceRef,
    })
  const canonicalResultHash =
    professionalLongFormFirstChildCanonicalResultHash({
      authority: input.authority,
      executionAttempt: attempt,
      validationArtifactRef: completion.validationArtifactRef,
      qaEvidenceRef: completion.qaEvidenceRef,
      reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    })
  const costEvidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: attempt.executionAttemptId,
  })
  if (!costEvidence) throw invalid('Professional long-form attempt cost evidence is missing.')
  assertInternalCostBoundary({
    evidence: costEvidence,
    authority: input.authority,
    executionAttempt: attempt,
    canonicalResultHash,
  })
  const terminalValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.terminalEvidenceRef,
  })
  const terminalEvidence =
    assertProfessionalLongFormFirstChildTerminalEvidence({
      value: terminalValue,
      authority: input.authority,
      authorization: input.authorization,
      executionAttempt: attempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    })
  const downstream = requireDownstreamEntry(input.current, root.definition.jobId)
  const storedAuthorization = root.professionalLongFormExecutionAuthorization
  if (
    !storedAuthorization ||
    stableAuthorityStringify(storedAuthorization) !==
      stableAuthorityStringify(input.authorization) ||
    completion.canonicalResultHash !== canonicalResultHash ||
    completion.attemptInternalCostEvidenceHash !== costEvidence.evidenceHash ||
    completion.authorityHash !== input.authority.authorityHash ||
    completion.authorizationId !== input.authorization.authorizationId ||
    completion.executionAttemptId !== attempt.executionAttemptId ||
    root.completion?.outcome.sha256 !== completion.validationArtifactRef.sha256 ||
    input.aggregate.summary.completedJobCount < 1 ||
    input.aggregate.summary.queuedJobCount +
      input.aggregate.summary.leasedJobCount +
      input.aggregate.summary.completedJobCount !==
      input.aggregate.summary.totalJobCount ||
    input.aggregate.summary.totalDeliveryAttemptCount < 1 ||
    root.deliveryAttemptCount !== 1 ||
    !downstream.definition.dependencyJobIds.includes(root.definition.jobId) ||
    input.aggregate.events.filter((event) =>
      event.eventType === 'job_execution_authorized' &&
      event.jobId === root.definition.jobId).length !== 1 ||
    input.aggregate.events.filter((event) =>
      event.eventType === 'job_execution_started' &&
      event.jobId === root.definition.jobId).length !== 1 ||
    input.aggregate.events.filter((event) =>
      event.eventType === 'job_completed' &&
      event.jobId === root.definition.jobId).length !== 1
  ) throw invalid('Professional long-form root completion did not preserve queue invariants.')

  const stablePayload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_first_child_execution_service' as const,
    status:
      'root_snapshot_validation_completed_queue_progress_preserved' as const,
    authority: input.authority,
    authorityRef: input.authorityRef,
    authorization: input.authorization,
    executionAttempt: attempt,
    validationArtifact,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidence,
    qaEvidenceRef: completion.qaEvidenceRef,
    reconciliationEvidence,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    attemptInternalCostEvidence: costEvidence,
    terminalEvidence,
    terminalEvidenceRef: completion.terminalEvidenceRef,
    queueAggregate: input.aggregate,
    readiness: {
      rootAuthorizationPersisted: true as const,
      rootLeaseVerified: true,
      rootOneUseDispatchVerified: true,
      rootValidationArtifactVerified: true,
      rootQaVerified: true,
      rootReconciliationVerified: true,
      rootAttemptInternalCostVerified: true,
      rootQueueCompletionVerified: true,
      downstreamDependencySatisfied: true,
      downstreamExecutionAuthorizedByRootCompletion: false as const,
      downstreamCurrentlyAuthorizedOrCompleted:
        downstream.professionalLongFormExecutionAuthorization !== undefined ||
        downstream.state === 'completed',
      remainingChildJobCount:
        input.aggregate.summary.totalJobCount -
        input.aggregate.summary.completedJobCount,
      sourceMediaExecutionVerified: false as const,
      chunkRenderExecutionVerified: false as const,
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
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormFirstChildAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
}): CanonicalProfessionalLongFormFirstChildExecutionEvidence {
  const stablePayload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_first_child_execution_service' as const,
    status:
      'root_snapshot_validation_in_progress_remaining_children_blocked' as const,
    authority: input.authority,
    authorityRef: input.authorityRef,
    authorization: input.authorization,
    queueAggregate: input.aggregate,
    readiness: {
      rootAuthorizationPersisted: true as const,
      rootLeaseVerified: true,
      rootOneUseDispatchVerified: false,
      rootValidationArtifactVerified: false,
      rootQaVerified: false,
      rootReconciliationVerified: false,
      rootAttemptInternalCostVerified: false,
      rootQueueCompletionVerified: false,
      downstreamDependencySatisfied: false,
      downstreamExecutionAuthorizedByRootCompletion: false as const,
      downstreamCurrentlyAuthorizedOrCompleted: false,
      remainingChildJobCount: input.aggregate.summary.totalJobCount,
      sourceMediaExecutionVerified: false as const,
      chunkRenderExecutionVerified: false as const,
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

function requireDownstreamEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  rootJobId: string,
) {
  const downstream = current.queueAggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_DOWNSTREAM_WORK_ITEM_ID)
  if (
    !downstream ||
    !downstream.definition.dependencyJobIds.includes(rootJobId) ||
    downstream.definition.privateExecutionReady
  ) throw invalid('Professional long-form downstream source authority is inconsistent.')
  return downstream
}

function assertInternalCostBoundary(input: {
  evidence: PrivateInternalAttemptCostEvidence
  authority: ProfessionalLongFormFirstChildExecutionAuthority
  executionAttempt: ProfessionalLongFormFirstChildExecutionAttempt
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'reeditpro_internal' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID ||
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
  ) throw invalid('Professional long-form internal attempt cost crossed a commercial boundary.')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
