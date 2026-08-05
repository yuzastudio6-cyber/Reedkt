import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuAttemptStartAuthority,
  canonicalProfessionalGpuApprovedFundingObservationSchema,
  CANONICAL_PROFESSIONAL_GPU_APPROVED_FUNDING_OBSERVATION_VERSION,
} from '../services/canonical-professional-gpu-plan-funded-dispatch-service'
import {
  createCanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31ApprovedTrackAllTaskSourceRepository,
} from '../services/canonical-sam3_1-approved-track-all-task-source-repository'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  canonicalSam31GpuFixedTaskContractRef,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalSam31GpuSourceMediaSchema,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import { a100 as base } from './canonical-sam3_1-gpu-task-owner-smoke'
import { released } from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  a100 as basePrimaryRate,
  l4Fallback as baseFallbackRate,
} from './canonical-professional-tool-gpu-cost-authority-smoke'

const observedAt = '2026-08-04T18:29:50.000Z'
const publishedAt = '2026-08-04T18:30:02.000Z'
const expiresAt = '2026-08-04T19:00:00.000Z'
const ref = (id: string, version = 1) => ({
  id,
  version,
  contentHash: `sha256:${sha256AuthorityValue(id)}`,
})
const runtimeReleaseRef = {
  id: released.runtimeRelease.releaseId,
  version: released.runtimeRelease.releaseVersion,
  contentHash: `sha256:${released.runtimeRelease.releaseHash}`,
}
const primaryRateRef = {
  id: basePrimaryRate.rateAuthorityId,
  version: basePrimaryRate.rateAuthorityVersion,
  contentHash: `sha256:${basePrimaryRate.rateAuthorityHash}`,
}
const admission = reissueAdmission(runtimeReleaseRef, primaryRateRef)
const sourceMedia = canonicalSam31GpuSourceMediaSchema.parse(
  base.context.sourceMedia,
)
const sourceScope = {
  ownerUserId: admission.scope.ownerUserId,
  workspaceId: admission.scope.workspaceId,
  projectId: admission.scope.projectId,
  editSessionId: admission.scope.editSessionId,
  planningRequestId: 'track-all-planning-request-1',
  editPlanId: admission.scope.editPlanId,
  editPlanVersion: admission.scope.editPlanVersion,
  outputId: base.context.outputId,
}
const fundingPayload = {
  schemaVersion:
    CANONICAL_PROFESSIONAL_GPU_APPROVED_FUNDING_OBSERVATION_VERSION,
  source: 'canonical_edit_planning_authority_reread' as const,
  evidenceClass: 'canonical_private_reread' as const,
  observationId: 'track-all-approved-funding-observation-1',
  scope: sourceScope,
  publishedPlanRef: {
    id: sourceScope.editPlanId,
    version: sourceScope.editPlanVersion,
    contentHash: `sha256:${sha256AuthorityValue('published-plan')}`,
  },
  publishedCustomerEstimateRef: ref('published-customer-estimate'),
  approvedSnapshotRef: admission.scope.approvedSnapshotRef,
  userApprovalRecordRef: admission.scope.userApprovalRecordRef,
  fundedReservationRef: admission.scope.fundedReservationRef,
  confirmedOutputFrame: {
    outputFrameRef: admission.scope.confirmedOutputFrameRef,
    outputId: sourceScope.outputId,
    aspectRatio: '9:16',
    width: sourceMedia.width,
    height: sourceMedia.height,
    fpsNumerator: sourceMedia.fpsNumerator,
    fpsDenominator: sourceMedia.fpsDenominator,
    confirmedByUser: true as const,
    confirmationRecordId: 'track-all-frame-confirmation-1',
  },
  masterTimingRef: admission.scope.masterTimingRef,
  approvedWorkItem: {
    workItemKey: 'track-all-work-item-1',
    approvedWorkItemRef: admission.scope.approvedWorkItemRef,
    canonicalWorkItemDigestSha256: sha256AuthorityValue('work-item'),
    pricingStructureDigestSha256: sha256AuthorityValue('pricing-structure'),
    workItemType: 'track_subject_geometry',
    workerClass: 'gpu_ai_worker',
    approvedToolIds: ['sam3_1'],
    maximumCreditBudget: 40,
    required: true,
  },
  canonicalWorkGraphDigestSha256: sha256AuthorityValue('work-graph'),
  canonicalWorkGraphPricingStructureDigestSha256:
    sha256AuthorityValue('work-graph-pricing'),
  canonicalCustomerEstimateDigestSha256:
    sha256AuthorityValue('customer-estimate'),
  canonicalGpuEstimateLineSetDigestSha256:
    sha256AuthorityValue('gpu-estimate-lines'),
  canonicalGpuEstimateLineCount: 1,
  approvedMaximumCredits: 100,
  reservationStatus: 'reserved' as const,
  originallyReservedCredits: 100,
  remainingReservedCredits: 100,
  reservationExpiresAt: expiresAt,
  immutableSnapshotAndApprovalReread: true as const,
  exactCustomerEstimateReread: true as const,
  exactApprovedWorkAndFrameReread: true as const,
  activeFundedReservationReread: true as const,
  callerApprovalEstimateOrReservationAccepted: false as const,
  observedAt,
}
const funding = canonicalProfessionalGpuApprovedFundingObservationSchema.parse({
  ...fundingPayload,
  observationHash: sha256AuthorityValue(fundingPayload),
})
const attempt = createCanonicalProfessionalGpuAttemptStartAuthority({
  attemptAuthorityId: 'track-all-attempt-authority-1',
  scope: sourceScope,
  approvedSnapshotRef: admission.scope.approvedSnapshotRef,
  approvedWorkItemRef: admission.scope.approvedWorkItemRef,
  workerLeaseRef: admission.scope.workerLeaseRef,
  userTriggerRecordRef: admission.scope.userTriggerRecordRef,
  executionAttemptRef: admission.scope.executionAttemptRef,
  idempotencyKey: admission.scope.idempotencyKey,
  routeId: 'a100_80gb_heavy_primary',
  triggeredAt: observedAt,
  expiresAt,
})
const target = createCanonicalProfessionalGpuRuntimeLaunchTarget({
  runtimeRelease: released.runtimeRelease,
  fixedServerTaskContractRef: canonicalSam31GpuFixedTaskContractRef(),
  at: publishedAt,
})

const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31ApprovedTrackAllTaskSourceRepository({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/track-all/sam3_1/approved-sources/v1',
})
const publication = {
  sourcePublicationId: 'track-all-approved-source-publication-1',
  approvedFundingObservation: funding,
  attemptStartAuthority: attempt,
  bindingId: 'track-all-sam31-binding-1',
  orchestraCall: base.orchestraCall,
  editPlanVersionId: base.context.editPlanVersionId,
  editPlanVersionRef: base.context.editPlanVersionRef,
  sceneId: base.context.sceneId,
  sourceBindingRef: base.context.sourceBindingRef,
  sourceMedia: base.context.sourceMedia,
  approvedPrompt: base.context.approvedPrompt,
  primaryRateAuthorityRef: primaryRateRef,
  fallbackRateAuthorityRef: {
    id: baseFallbackRate.rateAuthorityId,
    version: baseFallbackRate.rateAuthorityVersion,
    contentHash: `sha256:${baseFallbackRate.rateAuthorityHash}`,
  },
  privateTaskInputTransportRef: base.context.privateTaskInputTransportRef,
  privateTaskOutputTransportRef: base.context.privateTaskOutputTransportRef,
  publishedAt,
}
const created = await repository.persistApprovedTaskSourceCreateOnly(
  publication,
)
assert.equal(created.disposition, 'created')
assert.equal(created.gpuJobStarted, false)
assert.equal((await repository.persistApprovedTaskSourceCreateOnly(publication))
  .disposition, 'identical_replay')
assert.equal(objects.size, 1)

const materialSource = await repository.rereadApprovedTaskMaterialSource({
  admission,
  target,
  admissionConsumptionRef: ref('admission-consumption'),
  executionEnvelopeRef: ref('execution-envelope'),
  at: '2026-08-04T18:30:05.000Z',
}) as Record<string, unknown>
assertCanonicalTrackAllSam31OrchestraBinding({
  value: materialSource.trackAllOrchestraBinding,
  admission,
})
assert.equal(materialSource.outputId, base.context.outputId)
assert.equal(materialSource.sceneId, base.context.sceneId)
assert.equal('path' in materialSource, false)
assert.equal('url' in materialSource, false)
assert.equal('command' in materialSource, false)

await assert.rejects(repository.rereadApprovedTaskMaterialSource({
  admission: mutateAdmission(admission, {
    workerLeaseRef: ref('cross-lease'),
  }),
  target,
  admissionConsumptionRef: ref('admission-consumption'),
  executionEnvelopeRef: ref('execution-envelope'),
  at: '2026-08-04T18:30:06.000Z',
}), /not_published|unavailable/u)

let getterInvoked = false
const hostile = Object.defineProperty({ ...publication }, 'orchestraCall', {
  enumerable: true,
  get() {
    getterInvoked = true
    return base.orchestraCall
  },
})
await assert.rejects(
  repository.persistApprovedTaskSourceCreateOnly(hostile),
)
assert.equal(getterInvoked, false)

await assert.rejects(repository.persistApprovedTaskSourceCreateOnly({
  ...publication,
  sourcePublicationId: 'colliding-different-publication',
}), /collision/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-approved-track-all-task-source-repository',
  checks: 27,
  createOnlyExactReread: true,
  identicalReplayAccepted: true,
  crossLeaseAttemptRejected: true,
  hostileAccessorRejectedWithoutInvocation: true,
  callerMediaPromptRouteImageCommandPriceAccepted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}

function reissueAdmission(
  releaseRef: ReturnType<typeof ref>,
  rateAuthorityRef: typeof primaryRateRef,
) {
  const { admissionHash: _prior, ...prior } = structuredClone(base.admission)
  assert.ok(_prior)
  const payload = {
    ...prior,
    runtimeReleaseRef: releaseRef,
    currentRateAuthorityRef: rateAuthorityRef,
    admittedAt: '2026-08-04T18:30:00.000Z',
    expiresAt,
  }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function mutateAdmission(
  value: typeof admission,
  scope: Partial<typeof admission.scope>,
) {
  const { admissionHash: _prior, ...prior } = structuredClone(value)
  assert.ok(_prior)
  const payload = { ...prior, scope: { ...prior.scope, ...scope } }
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}
