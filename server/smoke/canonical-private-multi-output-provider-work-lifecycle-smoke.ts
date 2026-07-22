import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  createCanonicalProviderLifecyclePolicyCatalog,
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
  createCanonicalProviderOperationRegistryV2,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  deriveCanonicalStorytellingSpeechSourceAuthorityDigest,
} from '../edit-architecture/canonical-storytelling-speech-normalization-authority'
import { ApiError } from '../errors/api-error'
import {
  projectCanonicalPrivateProviderAttemptConsumerReceiptV2,
} from '../services/canonical-private-provider-attempt-consumer-receipt-service'
import {
  persistCanonicalPrivateProviderOutputArtifactBridgeRecord,
} from '../services/canonical-private-provider-output-artifact-store'
import {
  verifyCanonicalPrivateProviderOutputArtifact,
} from '../services/canonical-private-provider-output-artifact-verifier'
import {
  executePrivateInjectedMultiOutputProviderWorkLifecycle,
  reconcilePrivateInjectedMultiOutputProviderUnknownLifecycle,
  type ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput,
  type PrivateInjectedMultiOutputProviderWorkLifecycleResult,
} from '../services/canonical-private-provider-work-lifecycle-service'
import {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import {
  readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2,
} from '../services/private-canonical-provider-candidate-store'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  createPrivateWorkerResourceUsageCostEvidence,
  hashPrivateWorkerResourceArtifactManifest,
  hashPrivateWorkerResourceObserverSnapshot,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import type { PersistedArtifactResult } from
  '../validation/private-artifact-qa-authority-schemas'

const BASE_TIME_MS = Date.parse('2026-07-21T12:00:00.000Z')
const at = (offsetMs: number) => new Date(BASE_TIME_MS + offsetMs).toISOString()
const INJECTED_DISPATCH_SECRET =
  'private-injected-elevenlabs-dispatch-secret-for-smoke-only-20260721'
const PRIVATE_ALIGNMENT_SENTINEL =
  'private-alignment-content-must-never-project-to-consumer-receipt'
const roots: string[] = []

try {
  const profiles = createCanonicalProviderOperationRegistryV2()
  assert.equal(profiles.length, 1)
  assert.equal(profiles[0].operationId,
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID)
  assert.equal(profiles[0].expectedOutputs.length, 2)
  assert.equal(profiles[0].readiness.providerTransportActivated, false)
  assert.equal(profiles[0].readiness.productionReady, false)

  const policies = createCanonicalProviderLifecyclePolicyCatalog()
  assert.equal(policies.length, 4)
  const speechPolicy = resolveCanonicalProviderLifecyclePolicy(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  )
  assert.equal(speechPolicy.expectedOutputs?.length, 2)
  assert.equal(speechPolicy.requestCeilings.generationSubmissionCount, 1)
  assert.equal(speechPolicy.requestCeilings.totalLifecycleHttpRequestCount, 1)
  assert.equal(speechPolicy.qualification.canonicalAuthorizationIssuanceAllowed,
    false)
  assert.equal(speechPolicy.qualification.providerTransportActivated, false)

  const success = await fixture('success')
  const successResult = await executePrivateInjectedMultiOutputProviderWorkLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      outputs: [
        {
          outputId: success.outputIds[0],
          role: 'provider_storytelling_speech_audio_mp3',
          mimeType: 'audio/mpeg',
          bytes: mp3Fixture(17),
        },
        {
          outputId: success.outputIds[1],
          role: 'provider_storytelling_speech_alignment_json',
          mimeType: 'application/json',
          bytes: alignmentFixture(),
        },
      ],
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(successResult.disposition, 'executed')
  assert.equal(successResult.authorization.operationId,
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID)
  assert.equal(successResult.authorization.providerRouteId,
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID)
  assert.equal(successResult.authorization.boundaries.providerCallAuthorized, false)
  assert.equal(successResult.authorization.boundaries.cloudMutationAuthorized, false)
  assert.equal(successResult.grant.secretLocator.payloadReadCount, 0)
  assert.equal(successResult.grant.providerCallAuthorized, false)
  assert.equal(successResult.dispatchEntry.attempt.providerRequestStarted, false)
  assert.equal(successResult.terminal.providerRequestCount, 0)
  assert.equal(successResult.privateOutputs.length, 2)
  assert.deepEqual(successResult.privateOutputs.map((output) => output.role), [
    'provider_storytelling_speech_audio_mp3',
    'provider_storytelling_speech_alignment_json',
  ])
  assert.equal(successResult.costEvidence.provider.actualInternalCostMicros, 0)
  assert.ok(successResult.costEvidence.infrastructure.actualInternalCostMicros > 0)
  assertCommercialBoundary(successResult.costEvidence)
  assertZeroExternalEffects(successResult.evidence)

  await expectApiError(
    () => projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: success.scope,
      executionPackage: success.executionPackage,
      queueDefinition: success.queueDefinition,
      authorization: successResult.authorization,
      projectedAt: at(6_000),
    }),
    'TOOL_NOT_READY',
  )
  await persistProviderWorkerUsage(success, successResult)
  const successReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: success.scope,
      executionPackage: success.executionPackage,
      queueDefinition: success.queueDefinition,
      authorization: successResult.authorization,
      projectedAt: at(6_000),
    })
  assert.equal(successReceipt.evidenceClass, 'private_injected_nonprovider_test')
  assert.equal(successReceipt.promotionClass, 'non_promotable_private_injected')
  assert.equal(successReceipt.privateOutputs.length, 2)
  assert.equal(successReceipt.privateOutput?.outputId, success.outputIds[0])
  assert.equal(successReceipt.privateOutputs[1]?.outputId, success.outputIds[1])
  assert.equal(successReceipt.outputSet.sourceAuthorityClass,
    'forward_multi_output_same_attempt_source')
  assert.equal(successReceipt.outputSet.multiOutputProviderOperationAdmitted, true)
  assert.equal(successReceipt.outputSet.outputSetDigest,
    successResult.terminal.outputSetDigest)
  assert.equal(successReceipt.consumerContext.derivation,
    'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output_set')
  assert.equal(successReceipt.queue.queueAttemptId, successReceipt.queue.claimId)
  assert.equal(successReceipt.queue.leaseId, successReceipt.queue.claimId)
  assert.equal(successReceipt.queue.leaseHash, successReceipt.queue.claimHash)
  assert.equal(successReceipt.dispatch.retryCount, 0)
  assert.equal(successReceipt.dispatch.fallbackCount, 0)
  assert.equal(successReceipt.dispatch.sanitizedFailureCode, null)
  assert.equal(successReceipt.requestAccounting.observedTransport
    .totalLifecycleHttpRequestCount, 0)
  assert.equal(successReceipt.internalCost.providerCostMicros, 0)
  assert.equal(successReceipt.internalCost.providerRateCardDigest,
    successResult.authorization.providerRateAuthority.snapshotDigest)
  assert.ok(successReceipt.internalCost.selectedInfrastructureCostMicros > 0)
  assert.equal(successReceipt.internalCost.providerCostIncludedInWorkerEvidence,
    false)
  assert.equal(successReceipt.boundaries.credentialValueLogged, false)
  assert.equal(successReceipt.boundaries.requestBodyPersistedInQueue, false)
  assert.equal(successReceipt.boundaries.callerSelectedExecutableAllowed, false)
  assert.equal(successReceipt.boundaries.callerSelectedProviderRouteAllowed, false)
  assert.equal(successReceipt.boundaries.canonicalBackendVerifiedRuntime, false)
  assert.equal(successReceipt.boundaries.promotionAuthorized, false)
  assert.equal(successReceipt.boundaries.productionReady, false)
  for (const output of successReceipt.privateOutputs) {
    assert.equal(output.providerUrlPersisted, false)
    assert.equal(output.localPathProjected, false)
    assert.equal(output.createOnly, true)
    assert.equal(output.checksumReadbackVerified, true)
  }
  const processingOutputs =
    await readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2({
      localStorageRoot: success.scope.localStorageRoot,
      authorization: successResult.authorization,
      dispatchAttempt: successResult.dispatchEntry.attempt,
      outputs: [
        successResult.privateOutputs[0]!,
        successResult.privateOutputs[1]!,
      ],
      outputSetDigest: successResult.terminal.outputSetDigest,
    })
  const normalizationAuthority = speechNormalizationAuthority('success')
  let verifiedProviderOutputBridgeCount = 0
  for (const ordinal of [0, 1] as const) {
    const processing = processingOutputs[ordinal]
    const output = processing.readback.output
    assert.equal(
      output.role,
      ordinal === 0
        ? 'provider_storytelling_speech_audio_mp3'
        : 'provider_storytelling_speech_alignment_json',
    )
    const bridge =
      await persistCanonicalPrivateProviderOutputArtifactBridgeRecord({
        localStorageRoot: success.scope.localStorageRoot,
        ownerUserId: success.scope.ownerUserId,
        workspaceId: success.scope.workspaceId,
        executionPackage: success.executionPackage,
        queueDefinition: success.queueDefinition,
        authorization: successResult.authorization,
        receipt: successReceipt,
        normalizationAuthority,
        outputOrdinal: ordinal,
        outputId: output.outputId,
        outputRole: output.role as
          | 'provider_storytelling_speech_audio_mp3'
          | 'provider_storytelling_speech_alignment_json',
        outputContentSha256: output.contentSha256,
        outputByteLength: output.byteLength,
        outputPrivateObjectIdentityHash: output.privateObjectIdentityHash,
        outputReadbackEvidenceHash:
          processing.readback.sourceReadbackEvidenceHash,
        createdAt: successReceipt.projectedAt,
      })
    const artifact = providerOutputArtifactFixture({
      success,
      successResult,
      successReceipt,
      normalizationAuthority,
      bridgeRecordHash: bridge.recordHash,
      ordinal,
      output,
      outputReadbackEvidenceHash:
        processing.readback.sourceReadbackEvidenceHash,
    })
    const verified = await verifyCanonicalPrivateProviderOutputArtifact({
      localStorageRoot: success.scope.localStorageRoot,
      ownerUserId: success.scope.ownerUserId,
      artifact,
    })
    assert.equal(verified.role, output.role)
    assert.equal(verified.sha256, output.contentSha256)
    assert.equal(verified.providerReceiptHash, successReceipt.receiptHash)
    assert.equal(
      verified.sourceAuthorityDigest,
      normalizationAuthority.sourceAuthorityDigest,
    )
    assert.equal(verified.bytes.equals(processing.bytes), true)
    verifiedProviderOutputBridgeCount += 1
    await assert.rejects(() => verifyCanonicalPrivateProviderOutputArtifact({
      localStorageRoot: success.scope.localStorageRoot,
      ownerUserId: success.scope.ownerUserId,
      artifact: {
        ...artifact,
        content: { ...artifact.content, sha256: 'f'.repeat(64) },
      },
    }))
  }
  const receiptJson = JSON.stringify(successReceipt)
  for (const forbidden of [
    INJECTED_DISPATCH_SECRET,
    PRIVATE_ALIGNMENT_SENTINEL,
    'localStorageRoot',
    'https://',
    'http://',
    '/tmp/',
    'server_private_voice_id',
  ]) assert.equal(receiptJson.includes(forbidden), false)
  assert.equal((await allPersistedBytes(success.scope.localStorageRoot))
    .includes(INJECTED_DISPATCH_SECRET), false)

  const overBudget = await fixture('over-budget', {
    maximumAuthorizedInfrastructureCostMicros: 10_000,
    completedAtOffsetMs: 60_500,
  })
  const overBudgetResult =
    await executePrivateInjectedMultiOutputProviderWorkLifecycle({
      ...overBudget.lifecycle,
      outcome: {
        state: 'succeeded',
        outputs: [
          {
            outputId: overBudget.outputIds[0],
            role: 'provider_storytelling_speech_audio_mp3',
            mimeType: 'audio/mpeg',
            bytes: mp3Fixture(23),
          },
          {
            outputId: overBudget.outputIds[1],
            role: 'provider_storytelling_speech_alignment_json',
            mimeType: 'application/json',
            bytes: alignmentFixture(),
          },
        ],
        wallTimeMicroseconds: 10_000_000,
        rawInfrastructureUsageEvidenceDigest:
          digest('over-budget-infrastructure'),
      },
    })
  await persistProviderWorkerUsage(overBudget, overBudgetResult, {
    finishAtOffsetMs: 60_200,
    createdAtOffsetMs: 60_500,
  })
  await expectApiError(
    () => projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: overBudget.scope,
      executionPackage: overBudget.executionPackage,
      queueDefinition: overBudget.queueDefinition,
      authorization: overBudgetResult.authorization,
      projectedAt: at(60_800),
    }),
    'VALIDATION_FAILED',
  )

  const tamperedOrder = structuredClone(successReceipt)
  tamperedOrder.privateOutputs.reverse()
  tamperedOrder.privateOutput = tamperedOrder.privateOutputs[0] ?? null
  assert.equal(canonicalProviderAttemptConsumerReceiptSchema.safeParse(
    tamperedOrder,
  ).success, false)
  const tamperedPromotion = structuredClone(successReceipt)
  ;(tamperedPromotion.boundaries as {
    canonicalBackendVerifiedRuntime: boolean
  }).canonicalBackendVerifiedRuntime = true
  assert.equal(canonicalProviderAttemptConsumerReceiptSchema.safeParse(
    tamperedPromotion,
  ).success, false)

  const replay = await executePrivateInjectedMultiOutputProviderWorkLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      outputs: [
        {
          outputId: success.outputIds[0],
          role: 'provider_storytelling_speech_audio_mp3',
          mimeType: 'audio/mpeg',
          bytes: mp3Fixture(17),
        },
        {
          outputId: success.outputIds[1],
          role: 'provider_storytelling_speech_alignment_json',
          mimeType: 'application/json',
          bytes: alignmentFixture(),
        },
      ],
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(replay.disposition, 'completed_replay')
  assert.deepEqual(replay.privateOutputs, successResult.privateOutputs)

  const failed = await fixture('failed')
  const failedResult = await executePrivateInjectedMultiOutputProviderWorkLifecycle({
    ...failed.lifecycle,
    outcome: {
      state: 'failed',
      sanitizedFailureCode: 'provider_response_rejected',
      wallTimeMicroseconds: 800_000,
      rawInfrastructureUsageEvidenceDigest: digest('failed-infrastructure'),
    },
  })
  await persistProviderWorkerUsage(failed, failedResult)
  const failedReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: failed.scope,
      executionPackage: failed.executionPackage,
      queueDefinition: failed.queueDefinition,
      authorization: failedResult.authorization,
      projectedAt: at(6_000),
    })
  assert.equal(failedReceipt.dispatch.terminalState, 'failed')
  assert.equal(failedReceipt.dispatch.sanitizedFailureCode,
    'provider_response_rejected')
  assert.equal(failedReceipt.privateOutput, null)
  assert.equal(failedReceipt.privateOutputs.length, 0)
  assert.equal(failedReceipt.queue.terminalQueueCompletion, false)
  assert.equal(failedReceipt.internalCost.failedOrUnknownAttemptCostRetained, true)
  assert.ok(failedReceipt.internalCost.selectedInfrastructureCostMicros > 0)
  assert.equal(failedReceipt.internalCost.providerCostMicros, 0)

  const unknownSuccess = await fixture('unknown-success')
  const unknownSuccessResult =
    await executePrivateInjectedMultiOutputProviderWorkLifecycle({
      ...unknownSuccess.lifecycle,
      outcome: {
        state: 'unknown_reconciliation_required',
        providerResponseUsageDigest: null,
        wallTimeMicroseconds: 750_000,
        rawInfrastructureUsageEvidenceDigest:
          digest('unknown-success-infrastructure'),
      },
    })
  await persistProviderWorkerUsage(unknownSuccess, unknownSuccessResult)
  const unknownReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: unknownSuccess.scope,
      executionPackage: unknownSuccess.executionPackage,
      queueDefinition: unknownSuccess.queueDefinition,
      authorization: unknownSuccessResult.authorization,
      projectedAt: at(6_000),
    })
  assert.equal(unknownReceipt.dispatch.terminalState,
    'unknown_reconciliation_required')
  assert.equal(unknownReceipt.dispatch.sanitizedFailureCode,
    'provider_outcome_unknown')
  assert.equal(unknownReceipt.queue.unknownOutcomeReconciled, false)
  assert.equal(unknownReceipt.privateOutputs.length, 0)
  assert.equal(unknownReceipt.internalCost.providerCostMicros, null)
  assert.equal(unknownReceipt.internalCost.selectedTotalInternalCostMicros, null)
  assert.equal(unknownReceipt.requestAccounting.legacyV1ProviderRequestCount, 1)
  assert.equal(unknownReceipt.requestAccounting.observedTransport
    .totalLifecycleHttpRequestCount, 0)
  const reconciledSuccess =
    await reconcilePrivateInjectedMultiOutputProviderUnknownLifecycle({
      scope: unknownSuccess.scope,
      queueDefinition: unknownSuccess.queueDefinition,
      authorization: unknownSuccessResult.authorization,
      grantId: unknownSuccessResult.grant.grantId,
      resolution: 'succeeded',
      outputs: [
        {
          outputId: unknownSuccess.outputIds[0],
          role: 'provider_storytelling_speech_audio_mp3',
          mimeType: 'audio/mpeg',
          bytes: mp3Fixture(29),
        },
        {
          outputId: unknownSuccess.outputIds[1],
          role: 'provider_storytelling_speech_alignment_json',
          mimeType: 'application/json',
          bytes: alignmentFixture(),
        },
      ],
      providerResponseUsageDigest: digest('unknown-success-usage'),
      wallTimeMicroseconds: 1_100_000,
      rawInfrastructureUsageEvidenceDigest:
        digest('unknown-success-reconciled-infrastructure'),
      completedAt: at(7_000),
    })
  assert.equal(reconciledSuccess.terminal.state,
    'unknown_reconciled_succeeded')
  assert.equal(reconciledSuccess.terminal.sequence, 2)
  assert.equal(reconciledSuccess.privateOutputs.length, 2)
  assert.equal(reconciledSuccess.queueAggregate.entries[0]?.state, 'completed')
  const reconciledSuccessReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: unknownSuccess.scope,
      executionPackage: unknownSuccess.executionPackage,
      queueDefinition: unknownSuccess.queueDefinition,
      authorization: unknownSuccessResult.authorization,
      projectedAt: at(8_000),
    })
  assert.equal(reconciledSuccessReceipt.dispatch.terminalState,
    'unknown_reconciled_succeeded')
  assert.equal(reconciledSuccessReceipt.queue.unknownOutcomeReconciled, true)
  assert.equal(reconciledSuccessReceipt.privateOutputs.length, 2)
  assert.equal(reconciledSuccessReceipt.workerResourceUsage.outcomeState,
    'unknown')

  const unknownFailure = await fixture('unknown-failure')
  const unknownFailureResult =
    await executePrivateInjectedMultiOutputProviderWorkLifecycle({
      ...unknownFailure.lifecycle,
      outcome: {
        state: 'unknown_reconciliation_required',
        providerResponseUsageDigest: null,
        wallTimeMicroseconds: 650_000,
        rawInfrastructureUsageEvidenceDigest:
          digest('unknown-failure-infrastructure'),
      },
    })
  await persistProviderWorkerUsage(unknownFailure, unknownFailureResult)
  const reconciledFailure =
    await reconcilePrivateInjectedMultiOutputProviderUnknownLifecycle({
      scope: unknownFailure.scope,
      queueDefinition: unknownFailure.queueDefinition,
      authorization: unknownFailureResult.authorization,
      grantId: unknownFailureResult.grant.grantId,
      resolution: 'failed',
      providerResponseUsageDigest: digest('unknown-failure-usage'),
      wallTimeMicroseconds: 1_000_000,
      rawInfrastructureUsageEvidenceDigest:
        digest('unknown-failure-reconciled-infrastructure'),
      completedAt: at(7_000),
    })
  assert.equal(reconciledFailure.terminal.state,
    'unknown_reconciled_failed')
  assert.equal(reconciledFailure.privateOutputs.length, 0)
  const reconciledFailureReceipt =
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2({
      scope: unknownFailure.scope,
      executionPackage: unknownFailure.executionPackage,
      queueDefinition: unknownFailure.queueDefinition,
      authorization: unknownFailureResult.authorization,
      projectedAt: at(8_000),
    })
  assert.equal(reconciledFailureReceipt.dispatch.terminalState,
    'unknown_reconciled_failed')
  assert.equal(reconciledFailureReceipt.dispatch.sanitizedFailureCode,
    'provider_reconciled_failed')
  assert.equal(reconciledFailureReceipt.queue.unknownOutcomeReconciled, true)
  assert.equal(reconciledFailureReceipt.queue.terminalQueueCompletion, false)
  assert.equal(reconciledFailureReceipt.internalCost
    .failedOrUnknownAttemptCostRetained, true)

  const malformed = await fixture('malformed')
  await expectApiError(
    () => executePrivateInjectedMultiOutputProviderWorkLifecycle({
      ...malformed.lifecycle,
      outcome: {
        state: 'succeeded',
        outputs: [
          {
            outputId: malformed.outputIds[0],
            role: 'provider_storytelling_speech_audio_mp3',
            mimeType: 'audio/mpeg',
            bytes: Buffer.from('not-an-mp3', 'utf8'),
          },
          {
            outputId: malformed.outputIds[1],
            role: 'provider_storytelling_speech_alignment_json',
            mimeType: 'application/json',
            bytes: Buffer.from('{not-json', 'utf8'),
          },
        ],
        wallTimeMicroseconds: 700_000,
        rawInfrastructureUsageEvidenceDigest: digest('malformed-infrastructure'),
      },
    }),
    'VALIDATION_FAILED',
  )

  console.log(JSON.stringify({
    smoke: 'canonical-private-multi-output-provider-work-lifecycle',
    operationId: successResult.authorization.operationId,
    providerRouteId: successResult.authorization.providerRouteId,
    outputRoles: successReceipt.privateOutputs.map((output) => output.role),
    receiptHash: successReceipt.receiptHash,
    sourceOutputSetDigest: successReceipt.outputSet.outputSetDigest,
    verifiedProviderOutputBridgeCount,
    providerRateCardDigest: successReceipt.internalCost.providerRateCardDigest,
    workerResourceEvidenceHash:
      successReceipt.internalCost.workerResourceEvidenceHash,
    evidenceClass: successReceipt.evidenceClass,
    promotionClass: successReceipt.promotionClass,
    failedAttemptCostRetained:
      failedReceipt.internalCost.failedOrUnknownAttemptCostRetained,
    unknownOutcomeReconciledSuccess:
      reconciledSuccessReceipt.queue.unknownOutcomeReconciled,
    unknownOutcomeReconciledFailure:
      reconciledFailureReceipt.queue.unknownOutcomeReconciled,
    providerRequestCount: successResult.evidence.providerRequestCount,
    secretPayloadReadCount: successResult.evidence.secretPayloadReadCount,
    providerTransportActivated: successResult.evidence.providerTransportActivated,
    productionReady: successResult.evidence.productionReady,
  }, null, 2))
} finally {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
}

interface Fixture {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  outputIds: readonly [string, string]
  lifecycle: Omit<
    ExecutePrivateInjectedMultiOutputProviderWorkLifecycleInput,
    'outcome'
  >
}

async function fixture(
  label: string,
  options: {
    maximumAuthorizedInfrastructureCostMicros?: number
    completedAtOffsetMs?: number
  } = {},
): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), `reeditpro-provider-speech-${label}-`))
  roots.push(root)
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: root,
    ownerUserId: `owner-${label}`,
    workspaceId: `workspace-${label}`,
    projectId: `project-${label}`,
    editSessionId: `edit-${label}`,
    packageRecordId: `package-${label}`,
    approvedPlanSnapshotId: `snapshot-${label}`,
  }
  const jobId = `job-${label}`
  const workItemId = `work-item-${label}`
  const workItemKey = `storytelling-speech-${label}`
  const outputIds = [
    `speech-audio-${label}`,
    `speech-alignment-${label}`,
  ] as const
  const packageHash = digest(`package:${label}`)
  const snapshotHash = digest(`snapshot:${label}`)
  const workGraphHash = digest(`work-graph:${label}`)
  const executionPackage = createExecutionPackage({
    scope,
    label,
    jobId,
    workItemId,
    workItemKey,
    outputIds,
    packageHash,
    snapshotHash,
    workGraphHash,
  })
  const jobPayload = {
    canonicalOrder: 0,
    jobId,
    approvedWorkItemId: workItemId,
    workItemKey,
    expectedOutputIdentity: outputIds[0],
    required: true,
    dependencyJobIds: [] as string[],
    workerType: 'cpu_analysis_worker' as const,
    resourceClassId: 'cpu_analysis_standard_v1' as const,
    plannedCloudExecutionTarget: 'cloud_run_job' as const,
    preferredAccelerator: 'none' as const,
    placementHash: digest(`placement:${label}`),
    privateExecutionReady: false,
    providerExecutionMode: 'primary' as const,
    requiredGate: 'provider_activation_and_approved_route',
    maxAttempts: 1,
    attemptTimeoutSeconds: 60,
    scheduledFor: at(-1_000),
  }
  const job = canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
    ...jobPayload,
    definitionHash: sha256AuthorityValue(jobPayload),
  })
  const definitionPayload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: scope.packageRecordId,
      approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
      packageHash,
      snapshotHash,
      workGraphHash,
      placementManifestHash: digest(`placement-manifest:${label}`),
      toolExecutionAuthorityHash: digest(`tool-authority:${label}`),
      approvedResourcePlacementAuthorityHash: digest(`resource-authority:${label}`),
    },
    jobs: [job],
    summary: {
      totalJobCount: 1,
      requiredJobCount: 1,
      cpuAnalysisJobCount: 1,
      gpuJobCount: 0,
      renderJobCount: 0,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  const queueDefinition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...definitionPayload,
    definitionHash: sha256AuthorityValue(definitionPayload),
  })
  return {
    scope,
    executionPackage,
    queueDefinition,
    jobId,
    outputIds,
    lifecycle: {
      scope,
      executionPackage,
      queueDefinition,
      jobId,
      expectedOutputIds: outputIds,
      sourceRequestId: `source-request-${label}`,
      sourceRequestDigest:
        speechNormalizationAuthority(label).sourceAuthorityDigest,
      providerRequestPayloadDigest: digest(`provider-payload:${label}`),
      projectDataPolicyDigest: digest(`data-policy:${label}`),
      providerAccountPolicyDigest: digest(`account-policy:${label}`),
      idempotencyKey: `provider-speech-idempotency-${label}-v2`,
      providerRateAuthority: {
        evidenceClass: 'private_local_fixture',
        snapshotId: `elevenlabs-speech-rate-fixture-${label}-v1`,
        snapshotDigest: digest(`provider-rate:${label}`),
        billingUnit: 'input_character',
        productionQualified: false,
      },
      maximumAuthorizedProviderCostMicros: 100_000,
      maximumAuthorizedInfrastructureCostMicros:
        options.maximumAuthorizedInfrastructureCostMicros ?? 50_000,
      workerIdentity: `private-provider-worker-${label}`,
      credentialSecret: INJECTED_DISPATCH_SECRET,
      leaseDurationMs: 60_000,
      times: {
        authorizedAt: at(0),
        authorizationExpiresAt: at(60 * 60 * 1_000),
        claimAt: at(1_000),
        issuedAt: at(2_000),
        consumedAt: at(3_000),
        completedAt: at(options.completedAtOffsetMs ?? 5_000),
      },
    },
  }
}

function createExecutionPackage(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  label: string
  jobId: string
  workItemId: string
  workItemKey: string
  outputIds: readonly [string, string]
  packageHash: string
  snapshotHash: string
  workGraphHash: string
}): CanonicalApprovedEditExecutionPackage {
  const ref = (name: string) => ({
    sha256: digest(`${name}:${input.label}`),
    byteLength: 1,
  })
  const toolBindingsHash = digest(`tool-bindings:${input.label}`)
  return {
    schemaVersion: 'canonical-approved-edit-execution-package-v5',
    packageRecordId: input.scope.packageRecordId,
    source: 'canonical_edit_authority',
    purpose: 'private_internal_execution_handoff',
    authorityRevision: 1,
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
    planId: `plan-${input.label}`,
    estimateId: `estimate-${input.label}`,
    reservationId: `reservation-${input.label}`,
    approvalId: `approval-${input.label}`,
    snapshotHash: input.snapshotHash,
    planHash: digest(`plan:${input.label}`),
    estimateHash: digest(`estimate:${input.label}`),
    workGraphHash: input.workGraphHash,
    sourceSequenceHash: digest(`source-sequence:${input.label}`),
    timingHash: digest(`timing:${input.label}`),
    approvedAssetManifestRef: ref('asset-manifest'),
    approvedAssetManifestHash: digest(`asset-manifest:${input.label}`),
    plannedAssetCount: 2,
    requiredPlannedAssetCount: 2,
    approvedSourceAssetManifestRef: ref('source-asset-manifest'),
    approvedSourceAssetManifestHash: digest(`source-asset-manifest:${input.label}`),
    sourceBindingCount: 0,
    requiredSourceBindingCount: 0,
    componentRefs: {},
    approvedMaximumCredits: 100,
    reservationStatus: 'reserved',
    remainingReservedCredits: 100,
    approvedWorkItems: [{
      id: input.workItemId,
      workItemKey: input.workItemKey,
      workItemType: 'generate_storytelling_speech_candidate',
      workerClass: 'provider_worker',
      executionInputRef: ref('execution-input'),
      executionInputHash: digest(`execution-input:${input.label}`),
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [
        {
          outputKey: input.outputIds[0],
          artifactType: 'provider_storytelling_speech_audio_mp3',
          assetRole: 'generated',
          required: true,
          previewPlaceholderAllowed: false,
          contentType: 'audio/mpeg',
          segmentIds: [],
          timingIds: [],
          rendererLayerIds: [],
        },
        {
          outputKey: input.outputIds[1],
          artifactType: 'provider_storytelling_speech_alignment_json',
          assetRole: 'generated',
          required: true,
          previewPlaceholderAllowed: false,
          contentType: 'application/json',
          segmentIds: [],
          timingIds: [],
          rendererLayerIds: [],
        },
      ],
      dependencyKeys: [],
      approvedToolIds: [],
      approvedToolOperationIds: [],
      toolOperationBindingsHash: toolBindingsHash,
      approvedProviderRoute: CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID,
      providerExecutionMode: 'primary',
      fallbackPolicyRef: ref('fallback-policy'),
      maxAttempts: 1,
      attemptTimeoutSeconds: 60,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 100,
      required: true,
    }],
    jobs: [{
      id: input.jobId,
      approvedWorkItemId: input.workItemId,
      workItemKey: input.workItemKey,
      jobType: 'generate_storytelling_speech_candidate',
      workerClass: 'provider_worker',
      executionInputRef: ref('execution-input'),
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedAssetIds: [...input.outputIds],
      dependencyJobIds: [],
      approvedToolOperationIds: [],
      toolOperationBindingsHash: toolBindingsHash,
      dependencyState: 'ready',
      dispatchState: 'not_authorized',
      maxAttempts: 1,
      attemptTimeoutSeconds: 60,
      scheduledFor: at(-1_000),
    }],
    toolCapabilityManifestRef: ref('tool-capability-manifest'),
    approvedToolIds: [],
    approvedToolOperationIds: [],
    toolOperationBindingCount: 0,
    toolOperationBindingsHash: toolBindingsHash,
    toolCapabilityManifestHash: digest(`tool-manifest:${input.label}`),
    approvedProviderRoutes: [CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_ROUTE_ID],
    status: 'canonical_authority_packaged_runtime_blocked',
    authorityHandoffReady: true,
    workerDispatchReady: false,
    finalRenderReady: false,
    liveExecutionReady: false,
    blockers: ['provider_transport_not_activated'],
    noRuntimeSideEffects: [
      'No provider request, credential payload read, customer charge, or public delivery.',
    ],
    createdByUserId: input.scope.ownerUserId,
    createdAt: at(0),
    packageHash: input.packageHash,
  }
}

async function persistProviderWorkerUsage(
  fixtureValue: Fixture,
  result: PrivateInjectedMultiOutputProviderWorkLifecycleResult,
  options: {
    finishAtOffsetMs?: number
    createdAtOffsetMs?: number
  } = {},
): Promise<void> {
  const attempt = result.dispatchEntry.attempt
  const workItem = fixtureValue.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === result.authorization.approvedWorkItemId)
  if (!workItem) throw new Error('Speech provider smoke work item disappeared.')
  const runtimeExecutionIdentityDigest = digest(
    `runtime-execution:${attempt.dispatchAttemptId}`,
  )
  const containerIdentityDigest = digest(`container:${attempt.dispatchAttemptId}`)
  const measurementAgentDigest = digest(
    `measurement-agent:${attempt.dispatchAttemptId}`,
  )
  const snapshot = (input: {
    capturedAt: string
    cpuUsageNanoseconds: number
    memoryCurrentBytes: number
    memoryPeakBytes: number
  }) => {
    const value = {
      schemaVersion: 'private-worker-resource-observer-snapshot-v1' as const,
      runtimeExecutionIdentityDigest,
      containerIdentityDigest,
      measurementAgentDigest,
      capturedAt: input.capturedAt,
      cpuUsageNanoseconds: input.cpuUsageNanoseconds,
      memoryCurrentBytes: input.memoryCurrentBytes,
      memoryPeakBytes: input.memoryPeakBytes,
      gpuActiveMilliseconds: null,
    }
    return {
      ...value,
      rawSnapshotDigest: hashPrivateWorkerResourceObserverSnapshot(value),
    }
  }
  const inputArtifacts = [{
    artifactId: result.authorization.sourceRequestId,
    sha256: result.authorization.sourceRequestDigest,
    byteLength: 1,
  }]
  const outputArtifacts = result.privateOutputs.map((output) => ({
    artifactId: output.assetVersionId,
    sha256: output.contentSha256,
    byteLength: output.byteLength,
  }))
  const terminalState = result.terminal.state
  const completed = terminalState === 'succeeded'
  const outcome = completed
    ? { state: 'completed' as const, failureCategory: 'none' as const }
    : terminalState === 'failed'
      ? { state: 'failed' as const, failureCategory: 'provider_error' as const }
      : { state: 'unknown' as const, failureCategory: 'unknown' as const }
  await createPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: fixtureValue.scope.localStorageRoot,
    evidenceClass: 'private_injected_observed_usage_test',
    operation: {
      kind: 'registered_provider_operation',
      operationId: result.authorization.operationId,
    },
    identity: {
      ownerUserId: result.authorization.ownerUserId,
      workspaceId: result.authorization.workspaceId,
      projectId: result.authorization.projectId,
      editSessionId: result.authorization.editSessionId,
      approvedPlanSnapshotId: result.authorization.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: result.authorization.snapshotHash,
      packageRecordId: result.authorization.packageRecordId,
      packageHash: result.authorization.packageHash,
      approvedWorkItemId: result.authorization.approvedWorkItemId,
      approvedWorkItemHash: sha256AuthorityValue(workItem),
      jobId: result.authorization.queueJobId,
      executionAttemptId: attempt.dispatchAttemptId,
      attemptOrdinal: attempt.queueClaimDeliveryAttempt,
      leaseId: attempt.queueClaimId,
      leaseHash: attempt.queueClaimHash,
      dispatchGrantId: result.grant.grantId,
      dispatchGrantHash: result.grant.immutableGrantHash,
      idempotencyKeyHash: result.authorization.idempotencyKeyHash,
    },
    attemptInputHash: result.authorization.providerRequestPayloadDigest,
    runtime: {
      workerClass: 'provider_worker',
      runtimeExecutionIdentityDigest,
      runtimeImageDigest: digest(`runtime-image:${attempt.dispatchAttemptId}`),
      runtimeAttestationDigest: digest(
        `runtime-attestation:${attempt.dispatchAttemptId}`,
      ),
      containerIdentityDigest,
      cloudExecutionResourceDigest: null,
      measurementAgentVersion: 'provider-speech-usage-smoke-v1',
      measurementAgentDigest,
      leaseExpiresAt: result.grant.queueClaimExpiresAt,
    },
    allocation: { vcpuCount: 1, memoryMib: 1_024, gpuCount: 0 },
    startSnapshot: snapshot({
      capturedAt: at(3_200),
      cpuUsageNanoseconds: 1_000_000,
      memoryCurrentBytes: 8 * 1024 * 1024,
      memoryPeakBytes: 8 * 1024 * 1024,
    }),
    finishSnapshot: snapshot({
      capturedAt: at(options.finishAtOffsetMs ?? 4_200),
      cpuUsageNanoseconds: 3_000_000,
      memoryCurrentBytes: 12 * 1024 * 1024,
      memoryPeakBytes: 16 * 1024 * 1024,
    }),
    input: {
      artifacts: inputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'input',
        artifacts: inputArtifacts,
      }),
    },
    output: {
      disposition: completed ? 'accepted' : 'none',
      artifacts: outputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'output',
        artifacts: outputArtifacts,
      }),
    },
    networkEgressBytes: 0,
    outcome,
    createdAt: at(options.createdAtOffsetMs ?? 5_000),
  })
}

function mp3Fixture(seed: number): Buffer {
  return Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, seed, 0, 0, 0])
}

function alignmentFixture(): Buffer {
  return Buffer.from(JSON.stringify({
    text: PRIVATE_ALIGNMENT_SENTINEL,
    characters: [{ character: 'A', start: 0, end: 0.1 }],
  }), 'utf8')
}

function speechNormalizationAuthority(label: string) {
  const base = {
    recipeProfileId:
      'approved_storytelling_speech_take_normalization_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    sampleRate: 48_000 as const,
    channelMode: 'mono' as const,
    sampleFormat: 'pcm_s16le' as const,
    metadataPolicy: 'strip_all' as const,
    maximumDurationSeconds: 30 as const,
    productionId: `storytelling-production-${label}`,
    productionAuthorityHash: digest(`production-authority:${label}`),
    preparedScriptSegmentId: `prepared-script-segment-${label}`,
    sceneId: `storytelling-scene-${label}`,
    voiceBibleVersionId: `voice-bible-version-${label}`,
    voiceBibleContentDigest: digest(`voice-bible:${label}`),
    spokenTextDigest: digest(`spoken-text:${label}`),
    timingAuthorityDigest: digest(`timing:${label}`),
    startFrame: 0,
    endFrameExclusive: 24,
    frameRate: 24 as const,
    sourceProviderOperationId:
      CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
    sourceAudioRole: 'provider_storytelling_speech_audio_mp3' as const,
    sourceAlignmentRole:
      'provider_storytelling_speech_alignment_json' as const,
    alignmentBoundToExactSourceAudio: true as const,
  }
  return {
    ...base,
    sourceAuthorityDigest:
      deriveCanonicalStorytellingSpeechSourceAuthorityDigest(base),
  }
}

function providerOutputArtifactFixture(input: {
  success: Fixture
  successResult: PrivateInjectedMultiOutputProviderWorkLifecycleResult
  successReceipt: Awaited<ReturnType<
    typeof projectCanonicalPrivateProviderAttemptConsumerReceiptV2
  >>
  normalizationAuthority: ReturnType<typeof speechNormalizationAuthority>
  bridgeRecordHash: string
  ordinal: 0 | 1
  output: Awaited<ReturnType<
    typeof readVerifiedPrivateCanonicalProviderCandidateSetForProcessingV2
  >>[number]['readback']['output']
  outputReadbackEvidenceHash: string
}): PersistedArtifactResult {
  const output = input.output
  const resultEvidenceHash = digest(
    `provider-output-artifact-result:${input.ordinal}`,
  )
  return {
    artifactId: `provider-output-artifact-${input.ordinal}`,
    identity: {
      workspaceId: input.success.scope.workspaceId,
      projectId: input.success.scope.projectId,
      editSessionId: input.success.scope.editSessionId,
      snapshotId: input.success.scope.approvedPlanSnapshotId,
      jobId: input.success.jobId,
      expectedAssetId: input.success.outputIds[input.ordinal],
    },
    lineage: {
      assetId: input.success.outputIds[input.ordinal],
      outputKey: output.outputId,
      artifactType: output.role,
      assetRole: 'generated',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: output.mimeType,
      segmentIds: [input.normalizationAuthority.preparedScriptSegmentId],
      timingIds: [input.normalizationAuthority.timingAuthorityDigest],
      rendererLayerIds: [],
      approvedWorkItemId: input.successResult.authorization.approvedWorkItemId,
      workItemKey: `storytelling-speech-${input.ordinal}`,
      jobType: 'generate_storytelling_speech_candidate',
      jobAuthorityHash: digest(`job-authority:${input.ordinal}`),
      snapshotHash: input.successResult.authorization.snapshotHash,
      approvedAssetManifestHash: digest('asset-manifest:success'),
    },
    artifactVersion: 1,
    attemptKind: 'initial',
    content: {
      sha256: output.contentSha256,
      byteLength: output.byteLength,
      contentType: output.mimeType,
    },
    storageIdentity: {
      storageKind: 'private_local_test',
      opaqueObjectIdentityHash: input.bridgeRecordHash,
      providerGeneration: 'private_injected_nonprovider_test',
    },
    placeholder: { isPlaceholder: false, scope: 'none' },
    actualRunEvidence: {
      state: 'actual_provider_attempt_receipt_verified_v1',
      executionAttemptId:
        input.successReceipt.dispatch.dispatchAttemptId,
      runnerClass: 'canonical_private_provider_attempt_receipt_v2',
      runnerEvidenceHash: input.successReceipt.receiptHash,
      startedAt: input.successReceipt.timing.startedAt,
      finishedAt: input.successReceipt.timing.completedAt,
      exitCode: 0,
      toolIds: [],
      providerOperationId: input.successReceipt.provider.operationId,
      providerRoute: input.successReceipt.provider.providerRouteId,
      providerOutputRole: output.role,
      providerWorkAuthorityDigest:
        input.successReceipt.identity.authorizationHash,
      providerTerminalHash: input.successReceipt.dispatch.terminalHash,
      providerOutputSetDigest:
        input.successReceipt.outputSet.outputSetDigest,
      providerReceiptHash: input.successReceipt.receiptHash,
      providerQueueClaimId: input.successReceipt.queue.claimId,
      providerQueueClaimHash: input.successReceipt.queue.claimHash,
      providerCandidateReadbackEvidenceHash:
        input.outputReadbackEvidenceHash,
      providerCandidatePrivateObjectIdentityHash:
        output.privateObjectIdentityHash,
      productionAuthorityHash:
        input.normalizationAuthority.productionAuthorityHash,
      sourceAuthorityDigest:
        input.normalizationAuthority.sourceAuthorityDigest,
      dispatchGrantId: input.successReceipt.dispatch.grantId,
      actualRunVerified: true,
    },
    resultEvidenceRef: {
      sha256: resultEvidenceHash,
      byteLength: 1,
    },
    resultEvidenceHash,
    evidenceClass: 'private_internal_test_attested',
    liveRuntimeEligible: false,
    createdAt: input.successReceipt.timing.completedAt,
  } as PersistedArtifactResult
}

function digest(label: string): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-speech-lifecycle-smoke:v2',
    label,
  })
}

function assertCommercialBoundary(value: {
  commercialBoundary: {
    customerPriceIncluded: boolean
    customerCreditsIncluded: boolean
    serviceFeeIncluded: boolean
    walletMutationPerformed: boolean
    billingMutationPerformed: boolean
  }
}): void {
  assert.deepEqual(value.commercialBoundary, {
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  })
}

function assertZeroExternalEffects(value: {
  providerRequestCount: number
  secretPayloadReadCount: number
  cloudMutationCount: number
  supabaseMutationCount: number
  billingMutationCount: number
  providerTransportActivated: boolean
  distributedPersistenceProven: boolean
  productReady: boolean
  productionReady: boolean
}): void {
  assert.equal(value.providerRequestCount, 0)
  assert.equal(value.secretPayloadReadCount, 0)
  assert.equal(value.cloudMutationCount, 0)
  assert.equal(value.supabaseMutationCount, 0)
  assert.equal(value.billingMutationCount, 0)
  assert.equal(value.providerTransportActivated, false)
  assert.equal(value.distributedPersistenceProven, false)
  assert.equal(value.productReady, false)
  assert.equal(value.productionReady, false)
}

async function allPersistedBytes(root: string): Promise<string> {
  const chunks: Buffer[] = []
  async function walk(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) await walk(child)
      else if (entry.isFile()) chunks.push(await readFile(child))
    }
  }
  await walk(root)
  return Buffer.concat(chunks).toString('utf8')
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}
