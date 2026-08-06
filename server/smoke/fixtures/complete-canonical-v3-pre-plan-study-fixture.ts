import assert from 'node:assert/strict'

import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
} from '../../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  createCanonicalDistributedPrePlanStudyReadProjectionPort,
  type CanonicalDistributedPrePlanStudyReadProjection,
} from '../../distributed-pre-plan-study/canonical-distributed-pre-plan-study-read-projection'
import {
  canonicalDistributedPrePlanStudyAttemptCostEvidenceHash,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyDomainWorkResultHash,
  canonicalDistributedPrePlanStudyOutputHash,
  canonicalDistributedPrePlanStudyRequestHash,
  createCanonicalDistributedPrePlanStudyStatePort,
  type CanonicalDistributedPrePlanStudyAttemptCostEvidence,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudySeed,
} from '../../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter,
  createCanonicalDistributedPrePlanStudyLocalPostgresCapability,
} from '../../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'

export async function completeCanonicalV3PrePlanStudyFixture(input: {
  readonly endpointOrigin: string
  readonly anonKey: string
  readonly authenticatedAccessToken: string
  readonly localInternalSigningSecret: string
  readonly runId: string
}): Promise<CanonicalDistributedPrePlanStudyReadProjection> {
  const client = createCanonicalDistributedPrePlanStudyLocalHttpClient({
    endpointOrigin: input.endpointOrigin,
    anonKey: input.anonKey,
    authenticatedAccessToken: input.authenticatedAccessToken,
    localInternalSigningSecret: input.localInternalSigningSecret,
  })
  const capability = createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
    client,
    endpointOrigin: input.endpointOrigin,
  })
  const statePort = createCanonicalDistributedPrePlanStudyStatePort(
    createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
      client,
      capability,
    }),
  )
  const readPort = createCanonicalDistributedPrePlanStudyReadProjectionPort({
    client,
    capability,
  })

  let projection = required(await readPort.read(readRequest(input.runId, 0)))
  for (let step = 1; projection.run.state !== 'completed'; step += 1) {
    assert.ok(step <= projection.run.totalWorkItemCount + 2)
    const completedIds = new Set(projection.workItems
      .filter((item) => item.view.state === 'completed')
      .map((item) => item.seed.workItemId))
    const ready = projection.workItems.find((item) => (
      ['queued', 'retry_wait'].includes(item.view.state)
      && item.seed.dependencyWorkItemIds.every((id) => completedIds.has(id))
    ))
    assert.ok(ready, 'A queued pre-plan fixture work item must be dependency-ready.')

    const acceptedAt = new Date(Date.now() + step * 2_000).toISOString()
    const claim = await statePort.claimAndStart(claimRequest(
      projection.seed,
      ready.seed.workerClass,
      `target-fixture-claim-${step}-${ready.seed.workItemId}`,
      acceptedAt,
    ))
    const credential = required(claim.transientLeaseCredential)
    const completedAt = new Date(Date.parse(acceptedAt) + 1_000).toISOString()
    await statePort.complete(completionRequest({
      seed: projection.seed,
      claim: claim.response,
      credential,
      key: `target-fixture-complete-${step}-${ready.seed.workItemId}`,
      at: completedAt,
    }))
    projection = required(await readPort.read(readRequest(input.runId, step)))
  }

  assert.equal(
    projection.run.completedWorkItemCount,
    projection.run.totalWorkItemCount,
  )
  assert.ok(projection.workItems.every((item) => item.view.state === 'completed'))
  return projection
}

function claimRequest(
  seed: CanonicalDistributedPrePlanStudySeed,
  workerClass: CanonicalDistributedPrePlanStudySeed['workItems'][number]['workerClass'],
  key: string,
  acceptedAt: string,
) {
  return canonicalDistributedPrePlanStudyClaimRequestSchema.parse(withHash(
    'claim_and_start',
    {
      runId: seed.runId,
      studyIdentityHash: seed.identity.identityHash,
      idempotencyKey: key,
      workerClass,
      workerIdentityEvidenceHash: hash(`worker:${workerClass}`),
      workerReceiptHash: hash(`worker-receipt:${workerClass}`),
      capacityAdmissionEvidenceHash: hash(`capacity:${workerClass}`),
      acceptedAt,
    },
  ))
}

function completionRequest(input: {
  readonly seed: CanonicalDistributedPrePlanStudySeed
  readonly claim: CanonicalDistributedPrePlanStudyMutationResponse
  readonly credential: string
  readonly key: string
  readonly at: string
}) {
  const attempt = required(input.claim.attempt?.attemptStart)
  const outputWithoutHash = {
    outputId: `controlled-output-${attempt.attemptId}`,
    outputKind: 'controlled-private-study-evidence',
    storageObjectId: `controlled/private/${attempt.attemptId}.json`,
    storageObjectIdentityHash: hash(`storage:${attempt.attemptId}`),
    checksumSha256: hash(`checksum:${attempt.attemptId}`),
    byteLength: 4_096,
    mimeType: 'application/json',
    lineageHash: hash(`lineage:${attempt.attemptId}`),
    privateCreateOnlyReadbackVerified: true as const,
    providerUrlPersisted: false as const,
    localPathPersisted: false as const,
  }
  const workItem = required(input.seed.workItems.find(
    (item) => item.workItemId === attempt.workItemId,
  ))
  const outputDigestSha256 = hash(`domain-output:${attempt.attemptId}`)
  const completionAttestation = workItem.stageId === 'coverage_qa'
    ? {
        schemaVersion: 'edit-reference-long-form-study-completion-attestation-v2' as const,
        coverageQaWorkItemId: attempt.workItemId,
        coverageQaOutputDigestSha256: outputDigestSha256,
        requiredOutputManifestDigestSha256: hash(
          `required-output-manifest:${input.seed.runId}`,
        ),
        requiredWorkItemCount: input.seed.workItems.length,
        verifiedOutputRecordCount: input.seed.workItems.filter((item) => (
          !['ingest_integrity', 'media_probe'].includes(item.stageId)
        )).length,
        temporalCoverageRatio: 1 as const,
        chunkStageCoverageRatio: 1 as const,
        continuousAudioCoverageRatio:
          (input.seed.identity.sourceHasAudio ? 1 : 0) as 0 | 1,
        everyRequiredOutputVerified: true as const,
        everySemanticRuntimeAuthoritative: true as const,
        everyRequiredOutputCostAuthoritySatisfied: true as const,
        coverageQaPassed: true as const,
        finalizedAt: input.at,
      }
    : null
  const domainWorkResultWithoutHash = {
    schemaVersion:
      'canonical-distributed-pre-plan-study-domain-work-result-v1' as const,
    outputDigestSha256,
    observedWallClockMs: 1_000,
    runtimeSource: 'verified_mock' as const,
    completionAuthority: 'controlled_mock' as const,
    completionAttestation,
  }
  return canonicalDistributedPrePlanStudyCompletionRequestSchema.parse(withHash(
    'complete',
    {
      runId: input.seed.runId,
      studyIdentityHash: input.seed.identity.identityHash,
      idempotencyKey: input.key,
      attemptId: attempt.attemptId,
      leaseCredential: input.credential,
      workerIdentityEvidenceHash: attempt.workerIdentityEvidenceHash,
      workerReceiptHash: attempt.workerReceiptHash,
      outputs: [{
        ...outputWithoutHash,
        outputHash: canonicalDistributedPrePlanStudyOutputHash(outputWithoutHash),
      }],
      domainWorkResult: {
        ...domainWorkResultWithoutHash,
        resultHash: canonicalDistributedPrePlanStudyDomainWorkResultHash(
          domainWorkResultWithoutHash,
        ),
      },
      costEvidence: costEvidence(input.seed, input.claim, input.at),
      completionEvidenceHash: hash(`completion:${attempt.attemptId}`),
      completedAt: input.at,
    },
  ))
}

function costEvidence(
  seed: CanonicalDistributedPrePlanStudySeed,
  claim: CanonicalDistributedPrePlanStudyMutationResponse,
  finishedAt: string,
): CanonicalDistributedPrePlanStudyAttemptCostEvidence {
  const attempt = required(claim.attempt?.attemptStart)
  const work = required(seed.workItems.find(
    (item) => item.workItemId === attempt.workItemId,
  ))
  const withoutHash = {
    schemaVersion: 'canonical-distributed-pre-plan-study-attempt-cost-v1' as const,
    evidenceStatus: 'final' as const,
    attemptId: attempt.attemptId,
    attemptStartHash: attempt.attemptStartHash,
    startedAt: attempt.startedAt,
    finishedAt,
    approvedUsageEstimateId: seed.studyUsageApprovalId,
    internalCostBudgetId: seed.internalCostBudgetId,
    maximumAuthorizedInternalCostMicros:
      work.maximumAuthorizedInternalCostMicrosPerAttempt,
    providerUsageEvidenceDigestSha256: hash(`provider-usage:${attempt.attemptId}`),
    providerRateCardSnapshotDigestSha256:
      work.providerRateCardSnapshotDigestSha256,
    providerCostMicros: '0',
    infrastructureUsageEvidenceDigestSha256:
      hash(`infrastructure-usage:${attempt.attemptId}`),
    infrastructureRateCardSnapshotDigestSha256:
      work.infrastructureRateCardSnapshotDigestSha256,
    infrastructureCostMicros: '0',
    totalInternalCostMicros: '0',
    usageEventIds: [`controlled-usage-${attempt.attemptId}`],
    internalCostRecordIds: [`controlled-cost-${attempt.attemptId}`],
    failedOrUnknownAttemptCostRetained: true as const,
    invoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ...withoutHash,
    evidenceHash:
      canonicalDistributedPrePlanStudyAttemptCostEvidenceHash(withoutHash),
  }
}

function readRequest(runId: string, step: number) {
  const request = {
    runId,
    idempotencyKey: `target-fixture-read-${step}-${runId}`,
    requestedAt: new Date().toISOString(),
  }
  return {
    ...request,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(
      'read_projection',
      request,
    ),
  }
}

function withHash<T extends {
  readonly runId: string
  readonly studyIdentityHash: string
  readonly idempotencyKey: string
}>(operation: string, value: T): T & { readonly requestHash: string } {
  const draft = { ...value, requestHash: hash('placeholder') }
  return {
    ...value,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, draft),
  }
}

function hash(value: unknown): string {
  return sha256AuthorityValue({
    domain: 'controlled_canonical_v3_pre_plan_completion_fixture_v1',
    value,
  })
}

function required<T>(value: T | null | undefined): T {
  assert.notEqual(value, null)
  assert.notEqual(value, undefined)
  return value as T
}
