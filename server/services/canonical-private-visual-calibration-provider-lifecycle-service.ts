import { ApiError } from '../errors/api-error'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  createCanonicalProviderWorkAuthorizationV4,
  type CanonicalProviderWorkAuthorizationV4,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  createPrivateProviderAttemptCostEvidenceV4,
  readPrivateProviderAttemptCostEvidenceV4ForAttempt,
  type PrivateProviderAttemptCostEvidenceV4,
} from '../tool-cost-metering/private-provider-attempt-cost-evidence'
import type {
  CanonicalPrivateProviderDispatchEntry,
  CanonicalPrivateProviderDispatchGrantV4,
  CanonicalPrivateProviderDispatchTerminalV4,
  CanonicalPrivateProviderOutputV4,
} from '../validation/canonical-private-provider-dispatch-schemas'
import type {
  CanonicalPrivatePackageWorkQueueAggregate,
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  persistPrivateCanonicalProviderCandidateV4,
  readVerifiedPrivateCanonicalProviderCandidateV4,
} from './private-canonical-provider-candidate-store'
import {
  consumePrivateCanonicalProviderDispatchGrant,
  issuePrivateCanonicalProviderDispatchGrantV4,
  readPrivateCanonicalProviderDispatchAggregate,
  recordPrivateCanonicalProviderDispatchTerminalV4,
} from './private-canonical-provider-dispatch-store'
import {
  beginPrivateCanonicalPackageWorkQueueProviderAttempt,
  claimPrivateCanonicalProviderPackageWorkQueueJob,
  completePrivateCanonicalPackageWorkQueueClaim,
  ensurePrivateCanonicalPackageWorkQueue,
  finalizePrivateCanonicalPackageWorkQueueProviderAttempt,
  readPrivateCanonicalPackageWorkQueue,
  reconcilePrivateCanonicalPackageWorkQueueProviderUnknown,
  releasePrivateCanonicalPackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import { sha256AuthorityValue } from './private-edit-authority-store'

export type PrivateInjectedVisualCalibrationLifecycleOutcome =
  | {
      state: 'succeeded'
      output: {
        outputId: string
        role: 'provider_visual_calibration_video_mp4'
        mimeType: 'video/mp4'
        bytes: Buffer | Uint8Array
      }
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'failed'
      sanitizedFailureCode: string
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'unknown_reconciliation_required'
      providerResponseUsageDigest: string | null
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }

interface VisualCalibrationLifecycleTimes {
  authorizedAt: string
  authorizationExpiresAt: string
  claimAt: string
  issuedAt: string
  consumedAt: string
  completedAt: string
}

export interface ExecutePrivateInjectedVisualCalibrationLifecycleInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputId: string
  visualCalibrationContext:
    Parameters<typeof createCanonicalProviderWorkAuthorizationV4>[0][
      'visualCalibrationContext'
    ]
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  providerRateAuthority:
    CanonicalProviderWorkAuthorizationV4['providerRateAuthority']
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  workerIdentity: string
  credentialSecret: string
  leaseDurationMs: number
  times: VisualCalibrationLifecycleTimes
  outcome: PrivateInjectedVisualCalibrationLifecycleOutcome
}

export interface PrivateInjectedVisualCalibrationLifecycleResult {
  disposition: 'executed' | 'completed_replay'
  authorization: CanonicalProviderWorkAuthorizationV4
  grant: CanonicalPrivateProviderDispatchGrantV4
  dispatchEntry: CanonicalPrivateProviderDispatchEntry & {
    attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
  }
  costEvidence: PrivateProviderAttemptCostEvidenceV4
  terminal: CanonicalPrivateProviderDispatchTerminalV4
  privateOutput: CanonicalPrivateProviderOutputV4 | null
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof lifecycleEvidence>
}

/**
 * Exercises the canonical package queue, claim/lease, one-use provider
 * dispatch, private MP4 persistence, and internal-cost boundaries with
 * injected bytes. It never reads a provider secret or performs a request.
 */
export async function executePrivateInjectedVisualCalibrationLifecycle(
  input: ExecutePrivateInjectedVisualCalibrationLifecycleInput,
): Promise<PrivateInjectedVisualCalibrationLifecycleResult> {
  const authorization = createCanonicalProviderWorkAuthorizationV4({
    ownerUserId: input.scope.ownerUserId,
    executionPackage: input.executionPackage,
    queueDefinition: input.queueDefinition,
    jobId: input.jobId,
    expectedOutputId: input.expectedOutputId,
    visualCalibrationContext: input.visualCalibrationContext,
    sourceRequestId: input.sourceRequestId,
    sourceRequestDigest: input.sourceRequestDigest,
    providerRequestPayloadDigest: input.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.providerAccountPolicyDigest,
    idempotencyKey: input.idempotencyKey,
    providerRateAuthority: input.providerRateAuthority,
    maximumAuthorizedProviderCostMicros:
      input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.maximumAuthorizedInfrastructureCostMicros,
    authorizedAt: input.times.authorizedAt,
    expiresAt: input.times.authorizationExpiresAt,
  })
  await ensurePrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
    now: input.times.authorizedAt,
  })
  const queueJob = requiredQueueJob(input.queueDefinition, input.jobId)
  const claimResult = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.jobId,
    workerIdentity: input.workerIdentity,
    workerType: queueJob.workerType,
    providerAuthorization: authorization,
    now: input.times.claimAt,
    leaseDurationMs: input.leaseDurationMs,
  })
  if (claimResult.disposition === 'completed') {
    return replayCompletedLifecycle(input, authorization)
  }
  if (claimResult.disposition !== 'claimed') {
    throw new ApiError(
      'TOOL_NOT_READY',
      `Visual-calibration provider job was not claimable: ${claimResult.disposition}.`,
      503,
      {
        requiredGate:
          `canonical_visual_calibration_provider_queue_${claimResult.disposition}`,
      },
    )
  }
  const claim = claimResult.entry.activeClaim
  const issued = await issuePrivateCanonicalProviderDispatchGrantV4({
    scope: input.scope,
    authorization,
    claim,
    credentialSecret: input.credentialSecret,
    now: input.times.issuedAt,
  })
  const consumed = await consumePrivateCanonicalProviderDispatchGrant({
    scope: input.scope,
    grantId: issued.grant.grantId,
    dispatchCredential: issued.dispatchCredential,
    credentialSecret: input.credentialSecret,
    workerIdentity: input.workerIdentity,
    providerRequestStarted: false,
    now: input.times.consumedAt,
  })
  if (
    consumed.entry.grant.schemaVersion !== issued.grant.schemaVersion ||
    consumed.entry.grant.grantId !== issued.grant.grantId
  ) throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Visual-calibration dispatch changed during one-use consumption.',
    409,
  )
  const attempt = consumed.entry.attempt
  await beginPrivateCanonicalPackageWorkQueueProviderAttempt({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.jobId,
    claimId: claim.claimId,
    claimCredential: claimResult.claimCredential,
    providerAuthorization: authorization,
    providerDispatchGrantId: issued.grant.grantId,
    providerDispatchGrantHash: issued.grant.immutableGrantHash,
    dispatchAttemptId: attempt.dispatchAttemptId,
    dispatchAttemptHash: attempt.attemptHash,
    now: input.times.consumedAt,
  })
  const providerRequestCount = input.outcome.state ===
    'unknown_reconciliation_required'
    ? 1 as const
    : 0 as const
  const providerUsageEvidenceDigest = input.outcome.state ===
    'unknown_reconciliation_required'
    ? input.outcome.providerResponseUsageDigest
    : null
  const cost = await createPrivateProviderAttemptCostEvidenceV4({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claim: {
      claimId: claim.claimId,
      claimHash: claim.claimHash,
      deliveryAttempt: claim.deliveryAttempt,
    },
    dispatchAttemptId: attempt.dispatchAttemptId,
    attemptInputHash: authorization.providerRequestPayloadDigest,
    outcomeState: input.outcome.state,
    providerRequestCount,
    providerUsageEvidenceDigest,
    providerUsage: null,
    infrastructure: {
      wallTimeMicroseconds: input.outcome.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.outcome.rawInfrastructureUsageEvidenceDigest,
    },
    createdAt: input.times.completedAt,
  })
  let privateOutput: CanonicalPrivateProviderOutputV4 | null = null
  let outputSetDigest = noOutputSetDigest(authorization, attempt.attemptHash)
  if (input.outcome.state === 'succeeded') {
    const persisted = await persistPrivateCanonicalProviderCandidateV4({
      localStorageRoot: input.scope.localStorageRoot,
      authorization,
      dispatchAttempt: attempt,
      output: input.outcome.output,
      providerGenerated: false,
      createdAt: input.times.completedAt,
    })
    privateOutput = persisted.output
    outputSetDigest = persisted.outputSetDigest
  }
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminalV4({
    scope: input.scope,
    grantId: issued.grant.grantId,
    state: input.outcome.state,
    providerRequestCount,
    providerResponseUsageDigest: providerUsageEvidenceDigest,
    sanitizedFailureCode: input.outcome.state === 'succeeded'
      ? null
      : input.outcome.state === 'unknown_reconciliation_required'
        ? 'provider_outcome_unknown'
        : input.outcome.sanitizedFailureCode,
    privateOutputs: privateOutput ? [privateOutput] : [],
    outputSetDigest,
    costEvidence: cost.evidence,
    now: input.times.completedAt,
  })
  await finalizePrivateCanonicalPackageWorkQueueProviderAttempt({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.jobId,
    claimId: claim.claimId,
    claimCredential: claimResult.claimCredential,
    providerDispatchTerminalHash: terminalResult.terminal.terminalHash,
    attemptInternalCostEvidenceHash: cost.evidence.evidenceHash,
    providerTerminalState: input.outcome.state,
    now: input.times.completedAt,
  })
  if (input.outcome.state === 'succeeded') {
    await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.scope,
      definition: input.queueDefinition,
      jobId: input.jobId,
      claimId: claim.claimId,
      claimCredential: claimResult.claimCredential,
      outcome: completedQueueOutcome(
        input.queueDefinition,
        authorization,
        privateOutput!,
      ),
      now: input.times.completedAt,
    })
  } else {
    await releasePrivateCanonicalPackageWorkQueueClaim({
      scope: input.scope,
      definition: input.queueDefinition,
      jobId: input.jobId,
      claimId: claim.claimId,
      claimCredential: claimResult.claimCredential,
      reason: input.outcome.state === 'unknown_reconciliation_required'
        ? 'provider_unknown_outcome'
        : 'approved_attempt_failure',
      now: input.times.completedAt,
    })
  }
  const queueAggregate = await requiredQueueAggregate(input.scope,
    input.queueDefinition)
  return {
    disposition: 'executed',
    authorization,
    grant: issued.grant,
    dispatchEntry: terminalResult.entry as CanonicalPrivateProviderDispatchEntry & {
      attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
    },
    costEvidence: cost.evidence,
    terminal: terminalResult.terminal,
    privateOutput,
    queueAggregate,
    evidence: lifecycleEvidence({
      terminalState: terminalResult.terminal.state,
      queueState: requiredQueueEntry(queueAggregate, input.jobId).state,
      outputCount: privateOutput ? 1 : 0,
    }),
  }
}

export async function reconcilePrivateInjectedVisualCalibrationUnknown(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV4
  grantId: string
  resolution: 'succeeded' | 'failed'
  output?: {
    outputId: string
    role: 'provider_visual_calibration_video_mp4'
    mimeType: 'video/mp4'
    bytes: Buffer | Uint8Array
  }
  providerResponseUsageDigest: string
  providerUsage: {
    inputTokenCount: number
    videoOutputSeconds: number
  }
  wallTimeMicroseconds: number
  rawInfrastructureUsageEvidenceDigest: string
  completedAt: string
}): Promise<{
  terminal: CanonicalPrivateProviderDispatchTerminalV4
  costEvidence: PrivateProviderAttemptCostEvidenceV4
  privateOutput: CanonicalPrivateProviderOutputV4 | null
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof lifecycleEvidence>
}> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.grantId === input.grantId)
  const attempt = entry?.attempt
  const unknown = entry?.terminalHistory.find((terminal) =>
    terminal.schemaVersion === 'canonical-private-provider-dispatch-terminal-v4' &&
    terminal.state === 'unknown_reconciliation_required')
  const latest = entry?.terminalHistory.at(-1)
  const expectedResolutionState = input.resolution === 'succeeded'
    ? 'unknown_reconciled_succeeded'
    : 'unknown_reconciled_failed'
  if (
    !entry || entry.grant.schemaVersion !==
      'canonical-private-provider-dispatch-grant-v4' ||
    !attempt || !unknown ||
    (latest !== unknown && latest?.state !== expectedResolutionState) ||
    entry.grant.authorizationHash !== input.authorization.authorityHash
  ) throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Visual-calibration reconciliation requires the exact fenced attempt.',
    503,
  )
  if ((input.resolution === 'succeeded') !== (input.output !== undefined)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Visual-calibration reconciliation output does not match its resolution.',
      400,
    )
  }
  const cost = await createPrivateProviderAttemptCostEvidenceV4({
    localStorageRoot: input.scope.localStorageRoot,
    authorization: input.authorization,
    claim: {
      claimId: entry.grant.queueClaimId,
      claimHash: entry.grant.queueClaimHash,
      deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
    },
    dispatchAttemptId: attempt.dispatchAttemptId,
    attemptInputHash: input.authorization.providerRequestPayloadDigest,
    outcomeState: expectedResolutionState,
    providerRequestCount: 1,
    providerUsageEvidenceDigest: input.providerResponseUsageDigest,
    providerUsage: input.providerUsage,
    infrastructure: {
      wallTimeMicroseconds: input.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.rawInfrastructureUsageEvidenceDigest,
    },
    priorUnknownCostEvidenceHash: unknown.costEvidenceHash,
    createdAt: input.completedAt,
  })
  let privateOutput: CanonicalPrivateProviderOutputV4 | null = null
  let outputSetDigest = noOutputSetDigest(
    input.authorization,
    attempt.attemptHash,
  )
  if (input.output) {
    const persisted = await persistPrivateCanonicalProviderCandidateV4({
      localStorageRoot: input.scope.localStorageRoot,
      authorization: input.authorization,
      dispatchAttempt: attempt,
      output: input.output,
      providerGenerated: false,
      createdAt: input.completedAt,
    })
    privateOutput = persisted.output
    outputSetDigest = persisted.outputSetDigest
  }
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminalV4({
    scope: input.scope,
    grantId: input.grantId,
    state: expectedResolutionState,
    providerRequestCount: 1,
    providerResponseUsageDigest: input.providerResponseUsageDigest,
    sanitizedFailureCode: input.resolution === 'succeeded'
      ? null
      : 'provider_reconciled_failed',
    privateOutputs: privateOutput ? [privateOutput] : [],
    outputSetDigest,
    costEvidence: cost.evidence,
    now: input.completedAt,
  })
  await reconcilePrivateCanonicalPackageWorkQueueProviderUnknown({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.authorization.queueJobId,
    claimId: entry.grant.queueClaimId,
    providerDispatchTerminalHash: terminalResult.terminal.terminalHash,
    attemptInternalCostEvidenceHash: cost.evidence.evidenceHash,
    resolution: input.resolution,
    ...(input.resolution === 'succeeded'
      ? {
          outcome: completedQueueOutcome(
            input.queueDefinition,
            input.authorization,
            privateOutput!,
          ),
        }
      : {}),
    now: input.completedAt,
  })
  const queueAggregate = await requiredQueueAggregate(
    input.scope,
    input.queueDefinition,
  )
  return {
    terminal: terminalResult.terminal,
    costEvidence: cost.evidence,
    privateOutput,
    queueAggregate,
    evidence: lifecycleEvidence({
      terminalState: terminalResult.terminal.state,
      queueState: requiredQueueEntry(
        queueAggregate,
        input.authorization.queueJobId,
      ).state,
      outputCount: privateOutput ? 1 : 0,
    }),
  }
}

async function replayCompletedLifecycle(
  input: ExecutePrivateInjectedVisualCalibrationLifecycleInput,
  authorization: CanonicalProviderWorkAuthorizationV4,
): Promise<PrivateInjectedVisualCalibrationLifecycleResult> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  const terminal = entry?.terminalHistory.at(-1)
  if (
    !entry?.attempt ||
    entry.grant.schemaVersion !== 'canonical-private-provider-dispatch-grant-v4' ||
    !terminal ||
    terminal.schemaVersion !== 'canonical-private-provider-dispatch-terminal-v4' ||
    terminal.state !== 'succeeded' ||
    terminal.privateOutputs.length !== 1
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Completed visual-calibration replay lacks exact output evidence.',
      503,
    )
  }
  const privateOutput = terminal.privateOutputs[0]!
  await readVerifiedPrivateCanonicalProviderCandidateV4({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    dispatchAttempt: entry.attempt,
    output: privateOutput,
    outputSetDigest: terminal.outputSetDigest,
  })
  const costEvidence = await readPrivateProviderAttemptCostEvidenceV4ForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claimId: entry.grant.queueClaimId,
    claimHash: entry.grant.queueClaimHash,
    deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
    dispatchAttemptId: entry.attempt.dispatchAttemptId,
    evidenceHash: terminal.costEvidenceHash,
  })
  const queueAggregate = await requiredQueueAggregate(
    input.scope,
    input.queueDefinition,
  )
  return {
    disposition: 'completed_replay',
    authorization,
    grant: entry.grant,
    dispatchEntry: entry as CanonicalPrivateProviderDispatchEntry & {
      attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
    },
    costEvidence,
    terminal,
    privateOutput,
    queueAggregate,
    evidence: lifecycleEvidence({
      terminalState: terminal.state,
      queueState: 'completed',
      outputCount: 1,
    }),
  }
}

function completedQueueOutcome(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  authorization: CanonicalProviderWorkAuthorizationV4,
  output: CanonicalPrivateProviderOutputV4,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  const job = definition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  if (!job) {
    throw new ApiError('JOB_NOT_FOUND', 'Visual provider job disappeared.', 404)
  }
  return {
    jobId: job.jobId,
    approvedWorkItemId: job.approvedWorkItemId,
    workItemKey: job.workItemKey,
    required: job.required,
    dependencyJobIds: [...job.dependencyJobIds],
    status: 'completed_private_test',
    artifactId: output.assetVersionId,
    contentType: output.mimeType,
    sha256: output.contentSha256,
    adapterReplayed: false,
    blockedDependencyJobIds: [],
  }
}

function noOutputSetDigest(
  authorization: CanonicalProviderWorkAuthorizationV4,
  dispatchAttemptHash: string,
): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:private-provider-candidate-output-set:v4:no-output',
    authorizationHash: authorization.authorityHash,
    visualCalibrationContextDigest:
      authorization.visualCalibrationContextDigest,
    dispatchAttemptHash,
  })
}

function lifecycleEvidence(input: {
  terminalState: string
  queueState: string
  outputCount: number
}) {
  return {
    schemaVersion:
      'canonical-private-visual-calibration-lifecycle-evidence-v1' as const,
    evidenceClass: 'private_injected_nonprovider_test' as const,
    approvedPackageSnapshotAndReservationRequired: true as const,
    exactMotionProductionPlanScenarioReferenceFrameContinuityBound: true as const,
    canonicalQueueClaimAndLeaseUsed: true as const,
    sharedProviderDispatchUsed: true as const,
    oneUseDispatchConsumptionProven: true as const,
    primaryRouteOnly: true as const,
    automaticFallbackAllowed: false as const,
    asyncLifecycleCeilingsFrozen: true as const,
    maximumLifecycleHttpRequests: 15 as const,
    privateCreateOnlyMp4AndChecksumReadbackProven:
      input.terminalState === 'succeeded' ||
      input.terminalState === 'unknown_reconciled_succeeded',
    privateOutputCount: input.outputCount,
    selectionQaTimelineRenderAndDeliveryAllowed: false as const,
    providerAndInfrastructureInternalCostSeparated: true as const,
    failedAndUnknownAttemptCostRetained: true as const,
    customerPriceCreditsServiceFeeAndBillingIncluded: false as const,
    secretPayloadReadCount: 0 as const,
    observedProviderRequestCount: 0 as const,
    providerCandidateCount: 0 as const,
    cloudMutationCount: 0 as const,
    supabaseMutationCount: 0 as const,
    billingMutationCount: 0 as const,
    terminalState: input.terminalState,
    queueState: input.queueState,
    providerTransportActivated: false as const,
    immutableProviderRevisionQualified: false as const,
    productionRateAuthorityQualified: false as const,
    distributedPersistenceProven: false as const,
    productReady: false as const,
    productionReady: false as const,
  }
}

function requiredQueueJob(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  jobId: string,
) {
  const job = definition.jobs.find((candidate) => candidate.jobId === jobId)
  if (!job) {
    throw new ApiError(
      'JOB_NOT_FOUND',
      'Visual-calibration provider job was not found.',
      404,
    )
  }
  return job
}

async function requiredQueueAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const aggregate = await readPrivateCanonicalPackageWorkQueue({
    scope,
    definition,
  })
  if (!aggregate) {
    throw new ApiError(
      'INTERNAL_ERROR',
      'Visual-calibration provider queue disappeared.',
      500,
    )
  }
  return aggregate
}

function requiredQueueEntry(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  jobId: string,
) {
  const entry = aggregate.entries.find((candidate) =>
    candidate.definition.jobId === jobId)
  if (!entry) {
    throw new ApiError(
      'INTERNAL_ERROR',
      'Visual-calibration provider queue entry disappeared.',
      500,
    )
  }
  return entry
}
