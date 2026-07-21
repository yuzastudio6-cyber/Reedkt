import { ApiError } from '../errors/api-error'
import {
  createCanonicalProviderWorkAuthorization,
  createCanonicalProviderWorkAuthorizationV2,
  type CanonicalProviderWorkAuthorization,
  type CanonicalProviderWorkAuthorizationV2,
} from '../edit-architecture/canonical-provider-work-authority'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  createPrivateProviderAttemptCostEvidence,
  createPrivateProviderAttemptCostEvidenceV2,
  readPrivateProviderAttemptCostEvidenceV2ForAttempt,
  type PrivateProviderAttemptCostEvidence,
  type PrivateProviderAttemptCostEvidenceV2,
} from '../tool-cost-metering/private-provider-attempt-cost-evidence'
import type {
  CanonicalPrivateProviderDispatchEntry,
  CanonicalPrivateProviderDispatchGrant,
  CanonicalPrivateProviderDispatchGrantV2,
  CanonicalPrivateProviderDispatchTerminal,
  CanonicalPrivateProviderDispatchTerminalV2,
  CanonicalPrivateProviderOutput,
  CanonicalPrivateProviderOutputV2,
} from '../validation/canonical-private-provider-dispatch-schemas'
import type {
  CanonicalPrivatePackageWorkQueueAggregate,
  CanonicalPrivatePackageWorkQueueClaim,
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  persistPrivateCanonicalProviderCandidate,
  persistPrivateCanonicalProviderCandidateSetV2,
  readVerifiedPrivateCanonicalProviderCandidateSetV2,
} from
  './private-canonical-provider-candidate-store'
import {
  consumePrivateCanonicalProviderDispatchGrant,
  issuePrivateCanonicalProviderDispatchGrant,
  issuePrivateCanonicalProviderDispatchGrantV2,
  readPrivateCanonicalProviderDispatchAggregate,
  recordPrivateCanonicalProviderDispatchTerminal,
  recordPrivateCanonicalProviderDispatchTerminalV2,
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

export type PrivateInjectedProviderLifecycleOutcome =
  | {
      state: 'succeeded'
      bytes: Buffer | Uint8Array
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'failed'
      sanitizedFailureCode: string
      simulatedProviderRequestCount: 0 | 1
      providerResponseUsageDigest: string | null
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'unknown_reconciliation_required'
      simulatedProviderRequestCount: 1
      providerResponseUsageDigest: string | null
      wallTimeMicroseconds: number
      rawInfrastructureUsageEvidenceDigest: string
    }

interface ProviderLifecycleTimes {
  authorizedAt: string
  authorizationExpiresAt: string
  claimAt: string
  issuedAt: string
  consumedAt: string
  completedAt: string
}

export interface ExecutePrivateInjectedProviderWorkLifecycleInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputId: string
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  workerIdentity: string
  credentialSecret: string
  leaseDurationMs: number
  times: ProviderLifecycleTimes
  outcome: PrivateInjectedProviderLifecycleOutcome
}

export interface PrivateInjectedProviderWorkLifecycleResult {
  disposition: 'executed' | 'completed_replay'
  authorization: CanonicalProviderWorkAuthorization
  grant: CanonicalPrivateProviderDispatchGrant
  dispatchEntry: CanonicalPrivateProviderDispatchEntry & {
    attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
  }
  costEvidence: PrivateProviderAttemptCostEvidence
  terminal: CanonicalPrivateProviderDispatchTerminal
  privateOutput: CanonicalPrivateProviderOutput | null
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof providerLifecycleEvidence>
}

/**
 * Exercises the canonical provider lifecycle with injected non-provider bytes.
 * It proves package/queue/lease/one-use/private-ingest/cost/reconciliation
 * wiring while making zero provider, Secret Manager, Supabase, billing, or
 * cloud calls. It can never produce production authority.
 */
export async function executePrivateInjectedProviderWorkLifecycle(
  input: ExecutePrivateInjectedProviderWorkLifecycleInput,
): Promise<PrivateInjectedProviderWorkLifecycleResult> {
  const authorization = createCanonicalProviderWorkAuthorization({
    ownerUserId: input.scope.ownerUserId,
    executionPackage: input.executionPackage,
    queueDefinition: input.queueDefinition,
    jobId: input.jobId,
    expectedOutputId: input.expectedOutputId,
    sourceRequestId: input.sourceRequestId,
    sourceRequestDigest: input.sourceRequestDigest,
    providerRequestPayloadDigest: input.providerRequestPayloadDigest,
    projectDataPolicyDigest: input.projectDataPolicyDigest,
    providerAccountPolicyDigest: input.providerAccountPolicyDigest,
    idempotencyKey: input.idempotencyKey,
    authorityClass: 'private_injected_nonprovider_test',
    authorizedAt: input.times.authorizedAt,
    expiresAt: input.times.authorizationExpiresAt,
  })
  await ensurePrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
    now: input.times.authorizedAt,
  })
  const claimResult = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.jobId,
    workerIdentity: input.workerIdentity,
    workerType: requiredQueueJob(input).workerType,
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
      `Canonical provider package job was not claimable: ${claimResult.disposition}.`,
      503,
      { requiredGate: `canonical_provider_queue_${claimResult.disposition}` },
    )
  }
  const claim = claimResult.entry.activeClaim
  const issued = await issuePrivateCanonicalProviderDispatchGrant({
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
  const providerRequestCount = input.outcome.state === 'succeeded'
    ? 0 as const
    : input.outcome.simulatedProviderRequestCount
  const providerUsageDigest = input.outcome.state === 'succeeded'
    ? sha256AuthorityValue({
        domain: 'reeditpro:private-injected-provider-zero-request-usage:v1',
        dispatchAttemptId: attempt.dispatchAttemptId,
      })
    : input.outcome.providerResponseUsageDigest
  const cost = await createPrivateProviderAttemptCostEvidence({
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
    providerUsageEvidenceDigest: providerUsageDigest,
    providerCostReconciled:
      input.outcome.state !== 'unknown_reconciliation_required',
    infrastructure: {
      measurementClass: 'allocated_wall_time_provisional',
      wallTimeMicroseconds: input.outcome.wallTimeMicroseconds,
      observedCpuMicroseconds: null,
      observedPeakMemoryBytes: null,
      rawUsageEvidenceDigest: input.outcome.rawInfrastructureUsageEvidenceDigest,
    },
    createdAt: input.times.completedAt,
  })
  let privateOutput: CanonicalPrivateProviderOutput | null = null
  if (input.outcome.state === 'succeeded') {
    privateOutput = (await persistPrivateCanonicalProviderCandidate({
      localStorageRoot: input.scope.localStorageRoot,
      authorization,
      dispatchAttempt: attempt,
      bytes: input.outcome.bytes,
      mimeType: 'audio/wav',
      providerGenerated: false,
      createdAt: input.times.completedAt,
    })).output
  }
  const terminalState = input.outcome.state
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminal({
    scope: input.scope,
    grantId: issued.grant.grantId,
    state: terminalState,
    providerRequestCount,
    providerResponseUsageDigest: providerUsageDigest,
    sanitizedFailureCode: terminalState === 'succeeded'
      ? null
      : terminalState === 'unknown_reconciliation_required'
        ? 'provider_outcome_unknown'
        : input.outcome.sanitizedFailureCode,
    privateOutput,
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
    providerTerminalState: terminalState,
    now: input.times.completedAt,
  })
  if (terminalState === 'succeeded') {
    await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.scope,
      definition: input.queueDefinition,
      jobId: input.jobId,
      claimId: claim.claimId,
      claimCredential: claimResult.claimCredential,
      outcome: completedQueueOutcome(input, privateOutput!),
      now: input.times.completedAt,
    })
  } else {
    await releasePrivateCanonicalPackageWorkQueueClaim({
      scope: input.scope,
      definition: input.queueDefinition,
      jobId: input.jobId,
      claimId: claim.claimId,
      claimCredential: claimResult.claimCredential,
      reason: terminalState === 'unknown_reconciliation_required'
        ? 'provider_unknown_outcome'
        : 'approved_attempt_failure',
      now: input.times.completedAt,
    })
  }
  const queueAggregate = await requiredQueueAggregate(input)
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
    evidence: providerLifecycleEvidence({
      injectedFixture: true,
      providerRequestCount: 0,
      providerCandidateCount: 0,
      terminalState,
      queueState: requiredQueueEntry(queueAggregate, input.jobId).state,
    }),
  }
}

export type PrivateInjectedStorytellingSpeechOutputSet = readonly [
  {
    outputId: string
    role: 'provider_storytelling_speech_audio_mp3'
    mimeType: 'audio/mpeg'
    bytes: Buffer | Uint8Array
  },
  {
    outputId: string
    role: 'provider_storytelling_speech_alignment_json'
    mimeType: 'application/json'
    bytes: Buffer | Uint8Array
  },
]

export type PrivateInjectedMultiOutputProviderLifecycleOutcome =
  | {
      state: 'succeeded'
      outputs: PrivateInjectedStorytellingSpeechOutputSet
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

export interface ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  expectedOutputIds: readonly [string, string]
  sourceRequestId: string
  sourceRequestDigest: string
  providerRequestPayloadDigest: string
  projectDataPolicyDigest: string
  providerAccountPolicyDigest: string
  idempotencyKey: string
  providerRateAuthority:
    CanonicalProviderWorkAuthorizationV2['providerRateAuthority']
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  workerIdentity: string
  credentialSecret: string
  leaseDurationMs: number
  times: ProviderLifecycleTimes
  outcome: PrivateInjectedMultiOutputProviderLifecycleOutcome
}

export interface PrivateInjectedMultiOutputProviderWorkLifecycleResult {
  disposition: 'executed' | 'completed_replay'
  authorization: CanonicalProviderWorkAuthorizationV2
  grant: CanonicalPrivateProviderDispatchGrantV2
  dispatchEntry: CanonicalPrivateProviderDispatchEntry & {
    attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
  }
  costEvidence: PrivateProviderAttemptCostEvidenceV2
  terminal: CanonicalPrivateProviderDispatchTerminalV2
  privateOutputs: readonly CanonicalPrivateProviderOutputV2[]
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof providerMultiOutputLifecycleEvidence>
}

/**
 * Proves the exact two-output Speech lifecycle over the shared package queue,
 * lease, one-use provider dispatch, private storage, and internal-cost stores.
 * Inputs are injected test bytes; no credential is read and no transport is
 * present, so this result is deliberately non-promotable.
 */
export async function executePrivateInjectedMultiOutputProviderWorkLifecycle(
  input: ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput,
): Promise<PrivateInjectedMultiOutputProviderWorkLifecycleResult> {
  const authorization = createCanonicalProviderWorkAuthorizationV2({
    ownerUserId: input.scope.ownerUserId,
    executionPackage: input.executionPackage,
    queueDefinition: input.queueDefinition,
    jobId: input.jobId,
    expectedOutputIds: input.expectedOutputIds,
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
  const claimResult = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: input.scope,
    definition: input.queueDefinition,
    jobId: input.jobId,
    workerIdentity: input.workerIdentity,
    workerType: requiredQueueJob(input).workerType,
    providerAuthorization: authorization,
    now: input.times.claimAt,
    leaseDurationMs: input.leaseDurationMs,
  })
  if (claimResult.disposition === 'completed') {
    return replayCompletedMultiOutputLifecycle(input, authorization)
  }
  if (claimResult.disposition !== 'claimed') {
    throw new ApiError(
      'TOOL_NOT_READY',
      `Canonical provider V2 package job was not claimable: ${claimResult.disposition}.`,
      503,
      { requiredGate: `canonical_provider_v2_queue_${claimResult.disposition}` },
    )
  }
  const claim = claimResult.entry.activeClaim
  const issued = await issuePrivateCanonicalProviderDispatchGrantV2({
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
    'Canonical provider V2 dispatch changed during consumption.',
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
  const cost = await createPrivateProviderAttemptCostEvidenceV2({
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
    infrastructure: {
      wallTimeMicroseconds: input.outcome.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.outcome.rawInfrastructureUsageEvidenceDigest,
    },
    createdAt: input.times.completedAt,
  })
  let privateOutputs: readonly CanonicalPrivateProviderOutputV2[] = []
  let outputSetDigest = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-candidate-output-set:v2:no-output',
    authorizationHash: authorization.authorityHash,
    dispatchAttemptHash: attempt.attemptHash,
  })
  if (input.outcome.state === 'succeeded') {
    const persistedOutputSet = await persistPrivateCanonicalProviderCandidateSetV2({
      localStorageRoot: input.scope.localStorageRoot,
      authorization,
      dispatchAttempt: attempt,
      outputs: input.outcome.outputs,
      providerGenerated: false,
      createdAt: input.times.completedAt,
    })
    privateOutputs = persistedOutputSet.outputs
    outputSetDigest = persistedOutputSet.outputSetDigest
  }
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminalV2({
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
    privateOutputs,
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
      outcome: completedQueueOutcomeV2(input, privateOutputs[0]!),
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
  const queueAggregate = await requiredQueueAggregate(input)
  return {
    disposition: 'executed',
    authorization,
    grant: issued.grant,
    dispatchEntry: terminalResult.entry as CanonicalPrivateProviderDispatchEntry & {
      attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
    },
    costEvidence: cost.evidence,
    terminal: terminalResult.terminal,
    privateOutputs,
    queueAggregate,
    evidence: providerMultiOutputLifecycleEvidence({
      terminalState: terminalResult.terminal.state,
      queueState: requiredQueueEntry(queueAggregate, input.jobId).state,
      outputCount: privateOutputs.length,
    }),
  }
}

export async function reconcilePrivateInjectedMultiOutputProviderUnknownLifecycle(
  input: {
    scope: CanonicalPrivatePackageWorkQueueStoreScope
    queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
    authorization: CanonicalProviderWorkAuthorizationV2
    grantId: string
    resolution: 'succeeded' | 'failed'
    outputs?: PrivateInjectedStorytellingSpeechOutputSet
    providerResponseUsageDigest: string
    wallTimeMicroseconds: number
    rawInfrastructureUsageEvidenceDigest: string
    completedAt: string
  },
): Promise<{
  terminal: CanonicalPrivateProviderDispatchTerminalV2
  costEvidence: PrivateProviderAttemptCostEvidenceV2
  privateOutputs: readonly CanonicalPrivateProviderOutputV2[]
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof providerMultiOutputLifecycleEvidence>
}> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.grantId === input.grantId)
  const attempt = entry?.attempt
  const unknown = entry?.terminalHistory.find((terminal) =>
    terminal.schemaVersion ===
      'canonical-private-provider-dispatch-terminal-v2' &&
    terminal.state === 'unknown_reconciliation_required')
  const latest = entry?.terminalHistory.at(-1)
  const expectedResolutionState = input.resolution === 'succeeded'
    ? 'unknown_reconciled_succeeded'
    : 'unknown_reconciled_failed'
  if (
    !entry ||
    entry.grant.schemaVersion !==
      'canonical-private-provider-dispatch-grant-v2' ||
    !attempt || !unknown ||
    unknown.schemaVersion !== 'canonical-private-provider-dispatch-terminal-v2' ||
    (latest !== unknown && latest?.state !== expectedResolutionState) ||
    entry.grant.authorizationHash !== input.authorization.authorityHash
  ) throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Provider V2 unknown reconciliation requires the exact fenced attempt.',
    503,
  )
  if (
    (input.resolution === 'succeeded') !== (input.outputs !== undefined)
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'Provider V2 reconciliation output set does not match its resolution.',
    400,
  )
  const cost = await createPrivateProviderAttemptCostEvidenceV2({
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
    infrastructure: {
      wallTimeMicroseconds: input.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.rawInfrastructureUsageEvidenceDigest,
    },
    priorUnknownCostEvidenceHash: unknown.costEvidenceHash,
    createdAt: input.completedAt,
  })
  let privateOutputs: readonly CanonicalPrivateProviderOutputV2[] = []
  let outputSetDigest = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-candidate-output-set:v2:no-output',
    authorizationHash: input.authorization.authorityHash,
    dispatchAttemptHash: attempt.attemptHash,
  })
  if (input.outputs) {
    const persistedOutputSet = await persistPrivateCanonicalProviderCandidateSetV2({
      localStorageRoot: input.scope.localStorageRoot,
      authorization: input.authorization,
      dispatchAttempt: attempt,
      outputs: input.outputs,
      providerGenerated: false,
      createdAt: input.completedAt,
    })
    privateOutputs = persistedOutputSet.outputs
    outputSetDigest = persistedOutputSet.outputSetDigest
  }
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminalV2({
    scope: input.scope,
    grantId: input.grantId,
    state: expectedResolutionState,
    providerRequestCount: 1,
    providerResponseUsageDigest: input.providerResponseUsageDigest,
    sanitizedFailureCode: input.resolution === 'succeeded'
      ? null
      : 'provider_reconciled_failed',
    privateOutputs,
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
          outcome: completedQueueOutcomeV2FromAuthorization(
            input.authorization,
            input.queueDefinition,
            privateOutputs[0]!,
          ),
        }
      : {}),
    now: input.completedAt,
  })
  const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
  })
  if (!queueAggregate) {
    throw new ApiError('INTERNAL_ERROR', 'Provider V2 queue disappeared.', 500)
  }
  return {
    terminal: terminalResult.terminal,
    costEvidence: cost.evidence,
    privateOutputs,
    queueAggregate,
    evidence: providerMultiOutputLifecycleEvidence({
      terminalState: terminalResult.terminal.state,
      queueState: requiredQueueEntry(
        queueAggregate,
        input.authorization.queueJobId,
      ).state,
      outputCount: privateOutputs.length,
    }),
  }
}

export async function reconcilePrivateInjectedProviderUnknownLifecycle(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorization
  grantId: string
  resolution: 'succeeded' | 'failed'
  bytes?: Buffer | Uint8Array
  providerResponseUsageDigest: string
  wallTimeMicroseconds: number
  rawInfrastructureUsageEvidenceDigest: string
  completedAt: string
}): Promise<{
  terminal: CanonicalPrivateProviderDispatchTerminal
  costEvidence: PrivateProviderAttemptCostEvidence
  privateOutput: CanonicalPrivateProviderOutput | null
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  evidence: ReturnType<typeof providerLifecycleEvidence>
}> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.grantId === input.grantId)
  const attempt = entry?.attempt
  const unknown = entry?.terminalHistory.find((terminal) =>
    terminal.state === 'unknown_reconciliation_required')
  const latest = entry?.terminalHistory.at(-1)
  const expectedResolutionState = input.resolution === 'succeeded'
    ? 'unknown_reconciled_succeeded'
    : 'unknown_reconciled_failed'
  if (
    !entry || !attempt || !unknown ||
    (latest !== unknown && latest?.state !== expectedResolutionState) ||
    entry.grant.authorizationHash !== input.authorization.authorityHash
  ) throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Provider unknown-outcome reconciliation requires the exact fenced attempt.',
    503,
  )
  const cost = await createPrivateProviderAttemptCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    authorization: input.authorization,
    claim: {
      claimId: entry.grant.queueClaimId,
      claimHash: entry.grant.queueClaimHash,
      deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
    },
    dispatchAttemptId: attempt.dispatchAttemptId,
    attemptInputHash: input.authorization.providerRequestPayloadDigest,
    outcomeState: input.resolution === 'succeeded'
      ? 'unknown_reconciled_succeeded'
      : 'unknown_reconciled_failed',
    providerRequestCount: 1,
    providerUsageEvidenceDigest: input.providerResponseUsageDigest,
    providerCostReconciled: true,
    infrastructure: {
      measurementClass: 'allocated_wall_time_provisional',
      wallTimeMicroseconds: input.wallTimeMicroseconds,
      observedCpuMicroseconds: null,
      observedPeakMemoryBytes: null,
      rawUsageEvidenceDigest: input.rawInfrastructureUsageEvidenceDigest,
    },
    priorUnknownCostEvidenceHash: unknown.costEvidenceHash,
    createdAt: input.completedAt,
  })
  let privateOutput: CanonicalPrivateProviderOutput | null = null
  if (input.resolution === 'succeeded') {
    if (!input.bytes) throw new ApiError(
      'VALIDATION_FAILED',
      'Reconciled provider success requires the exact private candidate bytes.',
      400,
    )
    privateOutput = (await persistPrivateCanonicalProviderCandidate({
      localStorageRoot: input.scope.localStorageRoot,
      authorization: input.authorization,
      dispatchAttempt: attempt,
      bytes: input.bytes,
      mimeType: 'audio/wav',
      providerGenerated: false,
      createdAt: input.completedAt,
    })).output
  } else if (input.bytes !== undefined) {
    throw new ApiError('VALIDATION_FAILED', 'Provider failure cannot carry candidate bytes.', 400)
  }
  const terminalResult = await recordPrivateCanonicalProviderDispatchTerminal({
    scope: input.scope,
    grantId: input.grantId,
    state: input.resolution === 'succeeded'
      ? 'unknown_reconciled_succeeded'
      : 'unknown_reconciled_failed',
    providerRequestCount: 1,
    providerResponseUsageDigest: input.providerResponseUsageDigest,
    sanitizedFailureCode: input.resolution === 'succeeded'
      ? null
      : 'provider_reconciled_failed',
    privateOutput,
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
          outcome: completedQueueOutcomeFromAuthorization(
            input.authorization,
            input.queueDefinition,
            privateOutput!,
          ),
        }
      : {}),
    now: input.completedAt,
  })
  const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
  })
  if (!queueAggregate) throw new ApiError('INTERNAL_ERROR', 'Provider queue disappeared.', 500)
  return {
    terminal: terminalResult.terminal,
    costEvidence: cost.evidence,
    privateOutput,
    queueAggregate,
    evidence: providerLifecycleEvidence({
      injectedFixture: true,
      providerRequestCount: 0,
      providerCandidateCount: 0,
      terminalState: terminalResult.terminal.state,
      queueState: requiredQueueEntry(
        queueAggregate,
        input.authorization.queueJobId,
      ).state,
    }),
  }
}

function completedQueueOutcome(
  input: ExecutePrivateInjectedProviderWorkLifecycleInput,
  output: CanonicalPrivateProviderOutput,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  const job = requiredQueueJob(input)
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

function completedQueueOutcomeFromAuthorization(
  authorization: CanonicalProviderWorkAuthorization,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  output: CanonicalPrivateProviderOutput,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  const job = definition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Provider queue job disappeared.', 404)
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

function completedQueueOutcomeV2FromAuthorization(
  authorization: CanonicalProviderWorkAuthorizationV2,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  output: CanonicalPrivateProviderOutputV2,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  const job = definition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Provider V2 queue job disappeared.', 404)
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

function completedQueueOutcomeV2(
  input: ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput,
  output: CanonicalPrivateProviderOutputV2,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  const job = requiredQueueJob(input)
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

async function replayCompletedMultiOutputLifecycle(
  input: ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput,
  authorization: CanonicalProviderWorkAuthorizationV2,
): Promise<PrivateInjectedMultiOutputProviderWorkLifecycleResult> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  const terminal = entry?.terminalHistory.at(-1)
  if (
    !entry?.attempt ||
    entry.grant.schemaVersion !== 'canonical-private-provider-dispatch-grant-v2' ||
    !terminal ||
    terminal.schemaVersion !==
      'canonical-private-provider-dispatch-terminal-v2' ||
    terminal.state !== 'succeeded' ||
    terminal.privateOutputs.length !== 2
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Completed provider V2 queue replay lacks exact multi-output evidence.',
      503,
    )
  }
  const outputs = terminal.privateOutputs as [
    CanonicalPrivateProviderOutputV2,
    CanonicalPrivateProviderOutputV2,
  ]
  await readVerifiedPrivateCanonicalProviderCandidateSetV2({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    dispatchAttempt: entry.attempt,
    outputs,
    outputSetDigest: terminal.outputSetDigest,
  })
  const costEvidence = await readPrivateProviderAttemptCostEvidenceV2ForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claimId: entry.grant.queueClaimId,
    claimHash: entry.grant.queueClaimHash,
    deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
    dispatchAttemptId: entry.attempt.dispatchAttemptId,
    evidenceHash: terminal.costEvidenceHash,
  })
  const queueAggregate = await requiredQueueAggregate(input)
  return {
    disposition: 'completed_replay',
    authorization,
    grant: entry.grant,
    dispatchEntry: entry as CanonicalPrivateProviderDispatchEntry & {
      attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
    },
    costEvidence,
    terminal,
    privateOutputs: outputs,
    queueAggregate,
    evidence: providerMultiOutputLifecycleEvidence({
      terminalState: terminal.state,
      queueState: 'completed',
      outputCount: outputs.length,
    }),
  }
}

function providerMultiOutputLifecycleEvidence(input: {
  terminalState: string
  queueState: string
  outputCount: number
}) {
  return {
    schemaVersion:
      'canonical-private-provider-work-lifecycle-evidence-v2' as const,
    evidenceClass: 'private_injected_nonprovider_test' as const,
    multiOutputProviderOperationAdmitted: true as const,
    expectedOutputCount: 2 as const,
    privateOutputCount: input.outputCount,
    approvedPackageSnapshotAndReservationRequired: true as const,
    canonicalQueueClaimAndLeaseUsed: true as const,
    siblingProviderDispatchUsed: true as const,
    oneUseDispatchConsumptionProven: true as const,
    privateCreateOnlyOutputSetAndChecksumReadbackProven:
      input.terminalState === 'succeeded',
    providerAndInfrastructureInternalCostSeparated: true as const,
    failedAttemptCostRetained: true as const,
    customerPriceCreditsServiceFeeAndBillingIncluded: false as const,
    secretPayloadReadCount: 0 as const,
    providerRequestCount: 0 as const,
    providerCandidateCount: 0 as const,
    cloudMutationCount: 0 as const,
    supabaseMutationCount: 0 as const,
    billingMutationCount: 0 as const,
    terminalState: input.terminalState,
    queueState: input.queueState,
    providerTransportActivated: false as const,
    immutableProviderRevisionQualified: false as const,
    productionZeroRetentionEntitlementProven: false as const,
    distributedPersistenceProven: false as const,
    productReady: false as const,
    productionReady: false as const,
  }
}

async function replayCompletedLifecycle(
  input: ExecutePrivateInjectedProviderWorkLifecycleInput,
  authorization: CanonicalProviderWorkAuthorization,
): Promise<PrivateInjectedProviderWorkLifecycleResult> {
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  const terminal = entry?.terminalHistory.at(-1)
  if (!entry?.attempt ||
      entry.grant.schemaVersion !==
        'canonical-private-provider-dispatch-grant-v1' ||
      !terminal ||
      terminal.schemaVersion !==
        'canonical-private-provider-dispatch-terminal-v1' ||
      terminal.state !== 'succeeded' || !terminal.privateOutput) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Completed provider queue replay lacks exact dispatch evidence.',
      503,
    )
  }
  const queueAggregate = await requiredQueueAggregate(input)
  const costEvidence = await import('../tool-cost-metering/private-provider-attempt-cost-evidence')
    .then(({ readPrivateProviderAttemptCostEvidence }) =>
      readPrivateProviderAttemptCostEvidence({
        localStorageRoot: input.scope.localStorageRoot,
        evidence: {
          identity: {
            workspaceId: authorization.workspaceId,
            projectId: authorization.projectId,
            editSessionId: authorization.editSessionId,
            approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
            packageRecordId: authorization.packageRecordId,
            approvedWorkItemId: authorization.approvedWorkItemId,
            jobId: authorization.queueJobId,
            claimId: entry.grant.queueClaimId,
            deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
            dispatchAttemptId: entry.attempt!.dispatchAttemptId,
            providerOperationId: authorization.operationId,
            providerRouteId: authorization.providerRouteId,
            providerModelId: authorization.providerModelId,
          },
          evidenceId: `provider_cost_${sha256AuthorityValue({
            domain: 'reeditpro:private-provider-attempt-cost-identity:v1',
            authorizationHash: authorization.authorityHash,
            claimId: entry.grant.queueClaimId,
            claimHash: entry.grant.queueClaimHash,
            deliveryAttempt: entry.grant.queueClaimDeliveryAttempt,
            dispatchAttemptId: entry.attempt!.dispatchAttemptId,
          }).slice(0, 48)}`,
          evidenceHash: terminal.costEvidenceHash,
        },
      }))
  return {
    disposition: 'completed_replay',
    authorization,
    grant: entry.grant,
    dispatchEntry: entry as CanonicalPrivateProviderDispatchEntry & {
      attempt: NonNullable<CanonicalPrivateProviderDispatchEntry['attempt']>
    },
    costEvidence,
    terminal,
    privateOutput: terminal.privateOutput,
    queueAggregate,
    evidence: providerLifecycleEvidence({
      injectedFixture: true,
      providerRequestCount: 0,
      providerCandidateCount: 0,
      terminalState: terminal.state,
      queueState: 'completed',
    }),
  }
}

function providerLifecycleEvidence(input: {
  injectedFixture: boolean
  providerRequestCount: number
  providerCandidateCount: number
  terminalState: string
  queueState: string
}) {
  return {
    schemaVersion: 'canonical-private-provider-work-lifecycle-evidence-v1' as const,
    operationIdentityFrozen: true as const,
    approvedPackageSnapshotAndReservationRequired: true as const,
    canonicalQueueClaimAndLeaseUsed: true as const,
    siblingProviderDispatchUsed: true as const,
    toolDispatchUsed: false as const,
    oneUseDispatchConsumptionProven: true as const,
    privateCreateOnlyCandidateIngestProven:
      input.terminalState === 'succeeded' ||
      input.terminalState === 'unknown_reconciled_succeeded',
    terminalFailedUnknownAndReconciliationRepresented: true as const,
    providerAndInfrastructureInternalCostSeparated: true as const,
    failedAndUnknownAttemptCostRetained: true as const,
    customerPriceCreditsServiceFeeAndBillingIncluded: false as const,
    secretPayloadReadCount: 0 as const,
    providerRequestCount: input.providerRequestCount,
    providerCandidateCount: input.providerCandidateCount,
    cloudMutationCount: 0 as const,
    supabaseMutationCount: 0 as const,
    billingMutationCount: 0 as const,
    terminalState: input.terminalState,
    queueState: input.queueState,
    authorityClass: input.injectedFixture
      ? 'private_injected_nonprovider_test' as const
      : 'canonical_backend_runtime_unreleased' as const,
    canonicalMotionReceiptIssued: false as const,
    providerTransportActivated: false as const,
    distributedPersistenceProven: false as const,
    productReady: false as const,
    productionReady: false as const,
  }
}

function requiredQueueJob(input: Pick<
  ExecutePrivateInjectedProviderWorkLifecycleInput,
  'queueDefinition' | 'jobId'
>) {
  const job = input.queueDefinition.jobs.find((candidate) => candidate.jobId === input.jobId)
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Provider queue job was not found.', 404)
  return job
}

async function requiredQueueAggregate(
  input: Pick<ExecutePrivateInjectedProviderWorkLifecycleInput, 'scope' | 'queueDefinition'>,
): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const aggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
  })
  if (!aggregate) throw new ApiError('INTERNAL_ERROR', 'Provider queue disappeared.', 500)
  return aggregate
}

function requiredQueueEntry(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  jobId: string,
) {
  const entry = aggregate.entries.find((candidate) => candidate.definition.jobId === jobId)
  if (!entry) throw new ApiError('JOB_NOT_FOUND', 'Provider queue entry disappeared.', 404)
  return entry
}

export function canonicalProviderQueueClaimProjection(
  claim: CanonicalPrivatePackageWorkQueueClaim,
) {
  return {
    claimId: claim.claimId,
    claimHash: claim.claimHash,
    deliveryAttempt: claim.deliveryAttempt,
    workerIdentityHash: claim.workerIdentityHash,
    claimedAt: claim.claimedAt,
    expiresAt: claim.expiresAt,
    attemptDeadlineAt: claim.attemptDeadlineAt,
    plaintextCredentialProjected: false as const,
  }
}
