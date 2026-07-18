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
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
  professionalLongFormSourceAuthorityCompletionSchema,
  professionalLongFormSourceAuthorityExecutionAttemptSchema,
  type ProfessionalLongFormSourceAuthorityAuthorizationReceipt,
  type ProfessionalLongFormSourceAuthorityExecutionAttempt,
  type ProfessionalLongFormSourceAuthorityExecutionAuthority,
  type ProfessionalLongFormSourceAuthorityQaEvidence,
  type ProfessionalLongFormSourceAuthorityReconciliationEvidence,
  type ProfessionalLongFormSourceAuthorityTerminalEvidence,
  type ProfessionalLongFormSourceAuthorityValidationArtifact,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  assertProfessionalLongFormSourceAuthorityExecutionAuthority,
  assertProfessionalLongFormSourceAuthorityQaEvidence,
  assertProfessionalLongFormSourceAuthorityReconciliationEvidence,
  assertProfessionalLongFormSourceAuthorityTerminalEvidence,
  assertProfessionalLongFormSourceAuthorityValidationArtifact,
  buildProfessionalLongFormSourceAuthorityAuthorizationReceipt,
  buildProfessionalLongFormSourceAuthorityCompletion,
  buildProfessionalLongFormSourceAuthorityExecutionAuthority,
  buildProfessionalLongFormSourceAuthorityQaEvidence,
  buildProfessionalLongFormSourceAuthorityReconciliationEvidence,
  buildProfessionalLongFormSourceAuthorityTerminalEvidence,
  buildProfessionalLongFormSourceAuthorityValidationArtifact,
  professionalLongFormSourceAuthorityCanonicalResultHash,
} from '../edit-architecture/professional-long-form-source-authority-execution'
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
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_VERSION =
  'canonical-professional-long-form-source-authority-execution-v1' as const

export interface CanonicalProfessionalLongFormSourceAuthorityExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_VERSION
  source: 'canonical_professional_long_form_source_authority_execution_service'
  status:
    | 'source_authority_validation_completed_queue_progress_preserved'
    | 'source_authority_validation_in_progress_downstream_blocked'
  disposition: 'completed' | 'exact_replay' | 'already_in_progress'
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt?: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifact?: ProfessionalLongFormSourceAuthorityValidationArtifact
  validationArtifactRef?: AuthorityJsonBlobRef
  qaEvidence?: ProfessionalLongFormSourceAuthorityQaEvidence
  qaEvidenceRef?: AuthorityJsonBlobRef
  reconciliationEvidence?: ProfessionalLongFormSourceAuthorityReconciliationEvidence
  reconciliationEvidenceRef?: AuthorityJsonBlobRef
  attemptInternalCostEvidence?: PrivateInternalAttemptCostEvidence
  terminalEvidence?: ProfessionalLongFormSourceAuthorityTerminalEvidence
  terminalEvidenceRef?: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    rootCompletionReopenedAndVerified: true
    sourceAuthorizationPersisted: true
    sourceLeaseVerified: boolean
    sourceOneUseDispatchVerified: boolean
    approvedSourceManifestVerified: boolean
    sourceRangeChecksumSizeGenerationVerified: boolean
    cleanupAndFrameCoverageVerified: boolean
    sourceQaVerified: boolean
    sourceReconciliationVerified: boolean
    sourceAttemptInternalCostVerified: boolean
    sourceQueueCompletionVerified: boolean
    directDownstreamDependencyCount: number
    directDownstreamCurrentlyBlocked: boolean
    downstreamExecutionAuthorizedByThisCompletion: false
    remainingIncompleteChildJobCount: number
    canonicalLoaderSourceAuthorityRevalidated: true
    sourceAuthorityRunnerDirectByteRead: false
    sourceAuthorityRunnerMediaDecodeOrTransform: false
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

export function createCanonicalProfessionalLongFormSourceAuthorityExecutionService(
  context: ServiceContext,
) {
  return {
    async authorizeAndExecute(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormSourceAuthorityExecutionEvidence> {
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form source-authority execution requires authenticated authority.',
          401,
        )
      }
      const current =
        await createCanonicalProfessionalLongFormChildPackagePromotionService(
          context,
        ).loadCurrent(input)
      await assertRootCompletionDependency({ context, current, ownerUserId })
      const authority =
        buildProfessionalLongFormSourceAuthorityExecutionAuthority({
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
        buildProfessionalLongFormSourceAuthorityAuthorizationReceipt({
          authority,
          authorityRef,
        })
      const currentSource = current.queueAggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (currentSource?.state === 'completed') {
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
          'Professional long-form source-authority execution requires an unexpired funded reservation.',
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
      const authorizedSource = authorized.aggregate.entries.find((entry) =>
        entry.definition.jobId === authority.identity.jobId)
      if (authorizedSource?.state === 'completed') {
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
          'canonical-professional-long-form-source-authority-service-v1',
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
          `Professional long-form source-authority claim remained ${claim.disposition}.`,
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
        professionalLongFormSourceAuthorityExecutionAttemptSchema.parse(
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
        operationId: PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
        workloadProfileId:
          PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
      })

      try {
        const validationArtifact =
          buildProfessionalLongFormSourceAuthorityValidationArtifact({
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
        const qaEvidence = buildProfessionalLongFormSourceAuthorityQaEvidence({
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
          buildProfessionalLongFormSourceAuthorityReconciliationEvidence({
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
          professionalLongFormSourceAuthorityCanonicalResultHash({
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
          buildProfessionalLongFormSourceAuthorityTerminalEvidence({
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
          buildProfessionalLongFormSourceAuthorityCompletion({
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
        const sourceDefinition = current.queueDefinition.jobs.find((job) =>
          job.jobId === authority.identity.jobId)
        if (!sourceDefinition) {
          throw invalid('Professional long-form source queue definition is missing.')
        }
        const completedAggregate =
          await completePrivateCanonicalPackageWorkQueueClaim({
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
              dependencyJobIds: [...sourceDefinition.dependencyJobIds],
              status: 'completed_private_test',
              artifactId:
                `long-form-source-authority-${validationArtifactRef.sha256.slice(0, 40)}`,
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
      'Professional long-form source authority requires the completed root validation child.',
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

async function persistAndVerifyAuthority(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  ownerUserId: string
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormSourceAuthorityExecutionAuthority({
    value,
    ownerUserId: input.ownerUserId,
    current: input.current,
  })
  return ref
}

async function persistAndVerifyValidationArtifact(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifact: ProfessionalLongFormSourceAuthorityValidationArtifact
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.validationArtifact as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormSourceAuthorityValidationArtifact({ ...input, value })
  return ref
}

async function persistAndVerifyQaEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifact: ProfessionalLongFormSourceAuthorityValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormSourceAuthorityQaEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.qaEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormSourceAuthorityQaEvidence({ ...input, value })
  return ref
}

async function persistAndVerifyReconciliationEvidence(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormSourceAuthorityQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidence: ProfessionalLongFormSourceAuthorityReconciliationEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.reconciliationEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormSourceAuthorityReconciliationEvidence({
    ...input,
    value,
  })
  return ref
}

async function persistAndVerifyTerminalEvidence(input: {
  context: ServiceContext
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliationEvidenceRef: AuthorityJsonBlobRef
  canonicalResultHash: string
  attemptInternalCostEvidenceHash: string
  terminalEvidence: ProfessionalLongFormSourceAuthorityTerminalEvidence
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.terminalEvidence as unknown as Record<string, unknown>,
  })
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertProfessionalLongFormSourceAuthorityTerminalEvidence({ ...input, value })
  return ref
}

async function loadCompletedEvidence(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  disposition: 'completed' | 'exact_replay'
}): Promise<CanonicalProfessionalLongFormSourceAuthorityExecutionEvidence> {
  const source = input.aggregate.entries.find((entry) =>
    entry.definition.jobId === input.authority.identity.jobId)
  const root = input.aggregate.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const attempt = professionalLongFormSourceAuthorityExecutionAttemptSchema.safeParse(
    source?.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormSourceAuthorityCompletionSchema.safeParse(
    source?.completion?.outcome.professionalLongFormExecution,
  )
  if (
    !source || source.state !== 'completed' ||
    !root || root.state !== 'completed' ||
    !attempt.success || !completion.success
  ) {
    throw invalid('Professional long-form source-authority completion is not terminal.')
  }
  const storedAuthorization = source.professionalLongFormExecutionAuthorization
  if (
    !storedAuthorization ||
    stableAuthorityStringify(storedAuthorization) !==
      stableAuthorityStringify(input.authorization)
  ) {
    throw invalid('Professional long-form source authorization changed after commit.')
  }
  const validationValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: completion.data.validationArtifactRef,
  })
  const validationArtifact =
    assertProfessionalLongFormSourceAuthorityValidationArtifact({
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
  const qaEvidence = assertProfessionalLongFormSourceAuthorityQaEvidence({
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
    assertProfessionalLongFormSourceAuthorityReconciliationEvidence({
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
    professionalLongFormSourceAuthorityCanonicalResultHash({
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
    throw invalid('Professional long-form source attempt cost evidence is missing.')
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
    assertProfessionalLongFormSourceAuthorityTerminalEvidence({
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
  const sourceAuthorizationEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_execution_authorized' &&
    event.jobId === source.definition.jobId)
  const sourceStartEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_execution_started' &&
    event.jobId === source.definition.jobId)
  const sourceCompletionEvents = input.aggregate.events.filter((event) =>
    event.eventType === 'job_completed' &&
    event.jobId === source.definition.jobId)
  if (
    completion.data.canonicalResultHash !== canonicalResultHash ||
    completion.data.attemptInternalCostEvidenceHash !== costEvidence.evidenceHash ||
    completion.data.authorityHash !== input.authority.authorityHash ||
    completion.data.authorizationId !== input.authorization.authorizationId ||
    completion.data.executionAttemptId !== attempt.data.executionAttemptId ||
    source.completion?.outcome.sha256 !==
      completion.data.validationArtifactRef.sha256 ||
    source.deliveryAttemptCount !== 1 ||
    input.aggregate.summary.completedJobCount < 2 ||
    input.aggregate.summary.totalDeliveryAttemptCount < 2 ||
    input.aggregate.summary.queuedJobCount +
      input.aggregate.summary.leasedJobCount +
      input.aggregate.summary.completedJobCount !==
      input.aggregate.summary.totalJobCount ||
    sourceAuthorizationEvents.length !== 1 ||
    sourceAuthorizationEvents[0]?.authorizationId !==
      input.authorization.authorizationId ||
    sourceStartEvents.length !== 1 ||
    sourceStartEvents[0]?.executionAttemptId !==
      attempt.data.executionAttemptId ||
    sourceCompletionEvents.length !== 1
  ) {
    throw invalid(
      'Professional long-form source completion did not preserve queue invariants.',
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
      CANONICAL_PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_source_authority_execution_service' as const,
    status:
      'source_authority_validation_completed_queue_progress_preserved' as const,
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
      sourceAuthorizationPersisted: true as const,
      sourceLeaseVerified: true,
      sourceOneUseDispatchVerified: true,
      approvedSourceManifestVerified: true,
      sourceRangeChecksumSizeGenerationVerified: true,
      cleanupAndFrameCoverageVerified: true,
      sourceQaVerified: true,
      sourceReconciliationVerified: true,
      sourceAttemptInternalCostVerified: true,
      sourceQueueCompletionVerified: true,
      directDownstreamDependencyCount:
        reconciliationEvidence.summary.directDownstreamCount,
      directDownstreamCurrentlyBlocked,
      downstreamExecutionAuthorizedByThisCompletion: false as const,
      remainingIncompleteChildJobCount:
        input.aggregate.summary.totalJobCount -
        input.aggregate.summary.completedJobCount,
      canonicalLoaderSourceAuthorityRevalidated: true as const,
      sourceAuthorityRunnerDirectByteRead: false as const,
      sourceAuthorityRunnerMediaDecodeOrTransform: false as const,
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
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormSourceAuthorityAuthorizationReceipt
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
}): CanonicalProfessionalLongFormSourceAuthorityExecutionEvidence {
  const stablePayload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_VERSION,
    source:
      'canonical_professional_long_form_source_authority_execution_service' as const,
    status:
      'source_authority_validation_in_progress_downstream_blocked' as const,
    authority: input.authority,
    authorityRef: input.authorityRef,
    authorization: input.authorization,
    queueAggregate: input.aggregate,
    readiness: {
      rootCompletionReopenedAndVerified: true as const,
      sourceAuthorizationPersisted: true as const,
      sourceLeaseVerified: true,
      sourceOneUseDispatchVerified: false,
      approvedSourceManifestVerified: false,
      sourceRangeChecksumSizeGenerationVerified: false,
      cleanupAndFrameCoverageVerified: false,
      sourceQaVerified: false,
      sourceReconciliationVerified: false,
      sourceAttemptInternalCostVerified: false,
      sourceQueueCompletionVerified: false,
      directDownstreamDependencyCount: 0,
      directDownstreamCurrentlyBlocked: true,
      downstreamExecutionAuthorizedByThisCompletion: false as const,
      remainingIncompleteChildJobCount:
        input.aggregate.summary.totalJobCount -
        input.aggregate.summary.completedJobCount,
      canonicalLoaderSourceAuthorityRevalidated: true as const,
      sourceAuthorityRunnerDirectByteRead: false as const,
      sourceAuthorityRunnerMediaDecodeOrTransform: false as const,
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
  authority: ProfessionalLongFormSourceAuthorityExecutionAuthority
  executionAttempt: ProfessionalLongFormSourceAuthorityExecutionAttempt
  canonicalResultHash: string
}): void {
  const serialized = stableAuthorityStringify(input.evidence)
  if (
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.identity.toolId !== 'reeditpro_internal' ||
    input.evidence.identity.operationId !==
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID ||
    input.evidence.identity.workloadProfileId !==
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID ||
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
      'Professional long-form source internal attempt cost crossed a commercial boundary.',
    )
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
