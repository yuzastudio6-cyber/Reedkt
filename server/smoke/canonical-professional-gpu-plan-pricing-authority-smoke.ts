import assert from 'node:assert/strict'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  applyCanonicalProfessionalGpuPlanPricing,
  assertCanonicalProfessionalGpuPlanDispatchEstimateSet,
  assertCanonicalProfessionalGpuPlanPricingBasis,
  createCanonicalProfessionalGpuPlanDispatchEstimateSet,
  createCanonicalProfessionalGpuPlanPreapprovalManifest,
  createCanonicalProfessionalGpuPlanPricingBasis,
  createCanonicalProfessionalGpuPlanPublicationBinding,
  createCanonicalProfessionalGpuPlanUsageQuote,
  type CanonicalProfessionalGpuPlanPricingBasis,
} from '../services/canonical-professional-gpu-plan-preapproval-authority-service'
import {
  canonicalPlanRequiresProfessionalGpuPricingAuthority,
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority,
  verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority,
} from '../services/canonical-professional-gpu-plan-approval-pricing-authority'
import {
  createCanonicalConfirmedOutputFrameAuthority,
} from '../services/canonical-confirmed-output-frame-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import {
  resolvedPlanningInputAuthorityBindingSchema,
  type ResolvedPlanningInputAuthorityBinding,
} from '../validation/planning-input-authority-binding-schemas'

const observedAt = '2026-08-03T14:00:00.000Z'
const createdAt = '2026-08-03T14:10:00.000Z'
const expiresAt = '2026-08-04T14:00:00.000Z'
const rates = {
  a100_80gb_heavy_primary:
    await observeRate('a100_80gb_heavy_primary'),
  l4_heavy_fallback: await observeRate('l4_heavy_fallback'),
  l4_standard_primary: await observeRate('l4_standard_primary'),
}
const planComponents = components()
const planningAuthority = planningInputAuthority()
const confirmedOutputFrameAuthority =
  createCanonicalConfirmedOutputFrameAuthority({
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningInputAuthority: planningAuthority,
    components: planComponents,
  })

const ffmpegWork = [toolWorkItem({
  workItemKey: 'ffmpeg-master',
  toolId: 'ffmpeg',
  operationId: exactOperation('ffmpeg'),
})]
const ffmpegBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg'),
  components: planComponents,
  workItems: ffmpegWork,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-release', 'b'),
    workload: workload(),
  }],
})
assert.equal(ffmpegBasis.pricingUnits.length, 1)
assert.equal(ffmpegBasis.pricingUnits[0]?.toolId, 'ffmpeg')
assert.equal(
  ffmpegBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'canonical_production_operation_registered',
)
assert.equal(ffmpegBasis.maximumCreditBudgetExcludedFromPricingBasis, true)
const changedCallerBudget = structuredClone(ffmpegWork)
changedCallerBudget[0]!.maximumCreditBudget = 9_999_999
const budgetIndependentBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('ffmpeg'),
  components: planComponents,
  workItems: changedCallerBudget,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'ffmpeg-master',
    exactToolOrModelReleaseRef: ref('ffmpeg-release', 'b'),
    workload: workload(),
  }],
})
assert.equal(
  budgetIndependentBasis.canonicalWorkGraphPricingStructureDigestSha256,
  ffmpegBasis.canonicalWorkGraphPricingStructureDigestSha256,
)

const ffmpegQuote = quoteFor({
  basis: ffmpegBasis,
  workItemKey: 'ffmpeg-master',
  primaryRouteId: 'l4_standard_primary',
})
let quoteReads = 0
let rateReads = 0
const ffmpegManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'ffmpeg-plan-pricing-manifest',
    manifestVersion: 1,
    pricingBasis: ffmpegBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
        quoteReads += 1
        return structuredClone(ffmpegQuote)
      },
    },
    currentRateReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        rateReads += 1
        return structuredClone(rates[input.routeId])
      },
    },
    createdAt,
  })
assert.equal(quoteReads, 1)
assert.equal(rateReads, 1)
assert.equal(ffmpegManifest.entries.length, 1)
assert.equal(ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  'l4_standard_primary')
assert.equal(ffmpegManifest.entries[0]?.costCalculation.fallback, null)
assert.equal(ffmpegManifest.serviceFeeIncluded, false)
assert.equal(ffmpegManifest.customerCreditsMutated, false)
assert.equal(ffmpegManifest.userTriggeredScaleFromZeroRequired, true)
assert.equal(ffmpegManifest.terminalAttemptScaleBackToZeroRequired, true)

const sourceEstimate: CanonicalEstimateInput = {
  lineItems: [{
    lineKey: 'base-edit-coordination',
    label: 'Base edit coordination',
    category: 'control_plane',
    estimatedCredits: 0,
    removable: false,
    metadata: {},
  }],
  fallbackAllowanceCredits: 3,
  validForSeconds: 3_600,
}
const applied = applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  sourceEstimate,
  workItems: ffmpegWork,
  at: createdAt,
})
assert.equal(applied.estimate.lineItems.length, 2)
assert.equal(applied.estimate.lineItems[1]?.category,
  'gpu_tool_infrastructure')
assert.equal(
  applied.workItems[0]?.maximumCreditBudget,
  ffmpegManifest.totalMaximumReservedToolCostCredits,
)

const estimateHash = sha256AuthorityValue(applied.estimate)
const binding = createCanonicalProfessionalGpuPlanPublicationBinding({
  bindingId: 'ffmpeg-plan-pricing-binding',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publishedPlanRef: ref('published-plan', 'c'),
  publishedCustomerEstimateRef:
    ref('published-customer-estimate', estimateHash),
  publishedWorkItems: applied.workItems,
  publishedCustomerEstimate: applied.estimate,
  boundAt: createdAt,
})
assert.equal(binding.exactGpuBudgetsAppliedToWorkItems, true)
assert.equal(binding.exactGpuLinesIncludedInCustomerEstimate, true)
assert.equal(binding.approvalGranted, false)
assert.equal(binding.dispatchAuthorized, false)
assert.throws(() => createCanonicalProfessionalGpuPlanPublicationBinding({
  bindingId: 'ffmpeg-plan-pricing-binding-tampered-estimate-ref',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publishedPlanRef: ref('published-plan', 'c'),
  publishedCustomerEstimateRef: ref('published-customer-estimate', 'd'),
  publishedWorkItems: applied.workItems,
  publishedCustomerEstimate: applied.estimate,
  boundAt: createdAt,
}), /exact estimate/u)

const approvalPricingAuthority =
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority({
    authorityId: 'ffmpeg-plan-approval-pricing-authority',
    workspaceId: ffmpegBasis.scope.workspaceId,
    editPlanId: binding.publishedPlanRef.id,
    pricingBasis: ffmpegBasis,
    preapprovalManifest: ffmpegManifest,
    publicationBinding: binding,
    sealedAt: createdAt,
  })
assert.equal(
  canonicalPlanRequiresProfessionalGpuPricingAuthority(ffmpegWork),
  true,
)
assert.equal(verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: structuredClone(approvalPricingAuthority),
  ownerUserId: ffmpegBasis.scope.ownerUserId,
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningRequestId: ffmpegBasis.scope.planningRequestId,
  editPlanId: binding.publishedPlanRef.id,
  editPlanVersion: binding.publishedPlanRef.version,
  editPlanHash: binding.publishedPlanRef.contentHash.slice(7),
  estimateId: binding.publishedCustomerEstimateRef.id,
  estimateVersion: binding.publishedCustomerEstimateRef.version,
  estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: applied.estimate,
  confirmedOutputFrameAuthority,
  at: createdAt,
}).authorityHash, approvalPricingAuthority.authorityHash)

const tamperedFrameAuthority = structuredClone(confirmedOutputFrameAuthority)
tamperedFrameAuthority.authorityDigestSha256 = hash('9')
assert.throws(() => verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: approvalPricingAuthority,
  ownerUserId: ffmpegBasis.scope.ownerUserId,
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningRequestId: ffmpegBasis.scope.planningRequestId,
  editPlanId: binding.publishedPlanRef.id,
  editPlanVersion: binding.publishedPlanRef.version,
  editPlanHash: binding.publishedPlanRef.contentHash.slice(7),
  estimateId: binding.publishedCustomerEstimateRef.id,
  estimateVersion: binding.publishedCustomerEstimateRef.version,
  estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: applied.estimate,
  confirmedOutputFrameAuthority: tamperedFrameAuthority,
  at: createdAt,
}), /confirmed-output authority digest/u)

const estimateWithoutGpuLine = structuredClone(applied.estimate)
estimateWithoutGpuLine.lineItems = estimateWithoutGpuLine.lineItems.filter(
  (line) => line.category !== 'gpu_tool_infrastructure',
)
assert.throws(() => verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority({
  value: approvalPricingAuthority,
  ownerUserId: ffmpegBasis.scope.ownerUserId,
  workspaceId: ffmpegBasis.scope.workspaceId,
  projectId: ffmpegBasis.scope.projectId,
  editSessionId: ffmpegBasis.scope.editSessionId,
  planningRequestId: ffmpegBasis.scope.planningRequestId,
  editPlanId: binding.publishedPlanRef.id,
  editPlanVersion: binding.publishedPlanRef.version,
  editPlanHash: binding.publishedPlanRef.contentHash.slice(7),
  estimateId: binding.publishedCustomerEstimateRef.id,
  estimateVersion: binding.publishedCustomerEstimateRef.version,
  estimateHash: binding.publishedCustomerEstimateRef.contentHash.slice(7),
  components: planComponents,
  workItems: applied.workItems,
  customerEstimate: estimateWithoutGpuLine,
  confirmedOutputFrameAuthority,
  at: createdAt,
}), /immutable plan/u)

let approvalAccessorInvoked = false
const accessorApprovalInput: Record<string, unknown> = {
  authorityId: 'accessor-approval-pricing',
  workspaceId: ffmpegBasis.scope.workspaceId,
  editPlanId: binding.publishedPlanRef.id,
  preapprovalManifest: ffmpegManifest,
  publicationBinding: binding,
  sealedAt: createdAt,
}
Object.defineProperty(accessorApprovalInput, 'pricingBasis', {
  enumerable: true,
  get() {
    approvalAccessorInvoked = true
    return ffmpegBasis
  },
})
assert.throws(() =>
  createCanonicalProfessionalGpuPlanApprovalPricingAuthority(
    accessorApprovalInput as never,
  ), /enumerable data properties/u)
assert.equal(approvalAccessorInvoked, false)

const dispatchSet = createCanonicalProfessionalGpuPlanDispatchEstimateSet({
  estimateSetId: 'ffmpeg-plan-dispatch-estimates',
  pricingBasis: ffmpegBasis,
  manifest: ffmpegManifest,
  publicationBinding: binding,
  approvedWorkItemRefs: [{
    workItemKey: 'ffmpeg-master',
    approvedWorkItemRef: ref('approved-work-ffmpeg-master', 'e'),
  }],
  createdAt,
})
assert.equal(dispatchSet.entries.length, 1)
assert.equal(
  dispatchSet.entries[0]?.estimate.maximumReservedToolCostCredits,
  ffmpegManifest.totalMaximumReservedToolCostCredits,
)
assert.equal(dispatchSet.dispatchAuthorized, false)
const forgedNestedEstimate = structuredClone(dispatchSet)
forgedNestedEstimate.entries[0]!.estimate.estimateHash = hash('f')
const forgedSetPayload = { ...forgedNestedEstimate }
Reflect.deleteProperty(forgedSetPayload, 'estimateSetHash')
forgedNestedEstimate.estimateSetHash = sha256AuthorityValue(forgedSetPayload)
assert.throws(() => assertCanonicalProfessionalGpuPlanDispatchEstimateSet(
  forgedNestedEstimate,
), /estimate hash/u)

let accessorInvoked = false
const accessorBasis: Record<string, unknown> = {}
Object.defineProperty(accessorBasis, 'schemaVersion', {
  enumerable: true,
  get() {
    accessorInvoked = true
    return ffmpegBasis.schemaVersion
  },
})
assert.throws(() => assertCanonicalProfessionalGpuPlanPricingBasis(
  accessorBasis,
), /accessor/u)
assert.equal(accessorInvoked, false)
assert.throws(() => assertCanonicalProfessionalGpuPlanPricingBasis(
  new Proxy({}, {
    ownKeys() {
      throw new Error('hostile proxy payload')
    },
  }),
), /cannot be inspected/u)

const samWork = [toolWorkItem({
  workItemKey: 'sam31-mask',
  toolId: 'sam3_1',
  operationId: 'tool.sam3_1.segment_and_track_subject.v1',
})]
const samBasis = createCanonicalProfessionalGpuPlanPricingBasis({
  scope: scope('sam31'),
  components: planComponents,
  workItems: samWork,
  confirmedOutputFrameRef:
    confirmedOutputFrameAuthority.confirmedOutputBinding
      .confirmedOutputFrameRef,
  workloads: [{
    workItemKey: 'sam31-mask',
    exactToolOrModelReleaseRef: ref('sam31-model-release', '1'),
    workload: workload(),
  }],
})
assert.equal(
  samBasis.pricingUnits[0]?.operationAuthorityDisposition,
  'sam3_1_candidate_operation_release_qualification_pending',
)
const samQuote = quoteFor({
  basis: samBasis,
  workItemKey: 'sam31-mask',
  primaryRouteId: 'a100_80gb_heavy_primary',
})
let samRateReads = 0
const samManifest =
  await createCanonicalProfessionalGpuPlanPreapprovalManifest({
    manifestId: 'sam31-plan-pricing-manifest',
    manifestVersion: 1,
    pricingBasis: samBasis,
    region: 'us-central1',
    usageQuoteReadPort: {
      async rereadCurrentQualifiedPlanUsageQuote() {
        return structuredClone(samQuote)
      },
    },
    currentRateReadPort: {
      async rereadCurrentAccountEffectiveRateAuthority(input) {
        samRateReads += 1
        return structuredClone(rates[input.routeId])
      },
    },
    createdAt,
  })
assert.equal(samRateReads, 2)
assert.equal(samManifest.entries[0]?.costCalculation.primary.routeId,
  'a100_80gb_heavy_primary')
assert.equal(samManifest.entries[0]?.costCalculation.fallback?.routeId,
  'l4_heavy_fallback')
assert.throws(() => applyCanonicalProfessionalGpuPlanPricing({
  pricingBasis: samBasis,
  manifest: samManifest,
  sourceEstimate,
  workItems: samWork,
  at: createdAt,
}), /qualified and promoted/u)

console.log(JSON.stringify({
  smoke: 'canonical-professional-gpu-plan-pricing-authority',
  checks: 58,
  sourceFixtureOnly: true,
  liveCloudRateRead: false,
  liveGpuRuntimeExecuted: false,
  maximumCreditBudgetExcludedFromPricingBasis: true,
  ffmpegPrimaryRoute:
    ffmpegManifest.entries[0]?.costCalculation.primary.routeId,
  sam31PrimaryRoute:
    samManifest.entries[0]?.costCalculation.primary.routeId,
  sam31FallbackRoute:
    samManifest.entries[0]?.costCalculation.fallback?.routeId,
  sam31ApprovalBlockedUntilQualifiedAndPromoted: true,
  exactCustomerEstimateRefBinding: true,
  exactConfirmedOutputFrameAuthorityBinding: true,
  approvalPricingAuthorityRereadVerified: true,
  missingGpuEstimateLineRejected: true,
  nestedDispatchEstimateHashVerified: true,
  hostileAccessorInvoked: accessorInvoked || approvalAccessorInvoked,
  callerPriceAccepted: false,
  customerCreditsMutated: false,
  approvalGranted: false,
  dispatchAuthorized: false,
  productionAuthorityGranted: false,
  pricingBasisHash: ffmpegBasis.pricingBasisHash,
  manifestHash: ffmpegManifest.manifestHash,
  publicationBindingHash: binding.bindingHash,
  approvalPricingAuthorityHash: approvalPricingAuthority.authorityHash,
  dispatchEstimateSetHash: dispatchSet.estimateSetHash,
}))

function planningInputAuthority(): ResolvedPlanningInputAuthorityBinding {
  const values = {
    editLevel: 'pro' as const,
    workflowType: 'talking_head_personal_brand' as const,
    cleanupPreference: 'balanced_cleanup' as const,
    visualPreference: 'balanced_visual_mix' as const,
    moodStyle: 'clean' as const,
    creditPreference: 'premium_best_result' as const,
    targetPlatform: 'client_review' as const,
  }
  const withoutHash = {
    schemaVersion: 'canonical-planning-input-authority-binding-v1' as const,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    exactEditPreference: {
      recordRevision: 1,
      preferenceRevision: 1,
      planningInputRevision: 1,
      preferenceFingerprintSha256: hash('2'),
      values,
      effectiveValues: values,
      instructionSource: 'current_edit_preferences' as const,
      explicitChatOverrideKeys: [],
      explicitChatOverrides: {},
      instructionHash: hash('7'),
      baseline: {
        preferenceSnapshotId: 'gpu-plan-pricing-preferences-v1',
        persistenceSource: 'authenticated_private_internal_backend' as const,
        provenance: 'saved_edit_preferences' as const,
      },
      sourcePreparationEvidenceHash: hash('8'),
      sourceCandidateHash: null,
      frameConfirmationId: 'confirmed-output-frame',
      confirmedAspectRatio: '9:16' as const,
      lifecyclePhase: 'planning' as const,
      locked: false,
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
      applicationHash: hash('a'),
    },
    editBrief: {
      status: 'not_used' as const,
      deterministicHash: hash('b'),
    },
    instructionPriority: [
      'explicit_user_request',
      'confirmed_edit_preferences',
      'approved_edit_brief',
      'professional_editing_rules',
      'workflow_defaults',
      'tier_policy',
      'safe_fallbacks',
    ],
    noRuntimeSideEffects: true as const,
  }
  return resolvedPlanningInputAuthorityBindingSchema.parse({
    ...withoutHash,
    bindingHash: sha256AuthorityValue(withoutHash),
  })
}

function components(): CanonicalPlanComponentsInput {
  const totalFrames = 14_400
  return {
    compiledIntent: { goal: 'Clean and professionally edit the whole source.' },
    professionalEditingDirective: {
      pacing: 'meaning_first',
      mustFollowRules: ['Watch the complete source before cutting.'],
    },
    confirmedSettings: {
      aspectRatio: '9:16',
      outputFrame: { width: 2_160, height: 3_840, fps: 30 },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage: buildProfessionalExportCreditCoverage({
        durationSeconds: 480,
        outputFps: 30,
        approvedAspectRatio: '9:16',
      }),
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'pro',
      targetPlatform: 'private_review',
      preferenceSnapshotId: 'gpu-plan-pricing-preferences-v1',
      preferenceRevision: 1,
      preferencePlanningInputRevision: 1,
      preferenceFingerprintSha256: hash('2'),
    },
    sourceSequence: [{
      sourceSequenceItemId: 'source-sequence-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: hash('3'),
      required: true,
    }],
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'meaning_first_professional_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'preserve-source-before-full-analysis',
        sourceSequenceItemId: 'source-sequence-1',
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: totalFrames,
        reason: 'Preserve complete meaning before approved trim execution.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
    masterTimingPlan: {
      id: 'master-timing-gpu-plan-pricing',
      status: 'ready',
      timingBase: { fps: 30, totalFrames },
      totalFrames,
    },
    captionVisualCueTimingPlan: { status: 'synced' },
    soundSyncTransitionTimingPlan: {
      status: 'not_needed',
      speechPriority: true,
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps: 30,
      totalFrames,
    },
    segments: [{
      segmentId: 'segment-complete-source',
      startFrame: 0,
      endFrameExclusive: totalFrames,
      operationIds: ['operation-complete-source'],
    }],
    visualAssetPlan: { status: 'source_led' },
    colorPipelinePlan: { status: 'not_provided' },
    rendererPlan: { renderer: 'remotion', frameOwnedByRenderer: true },
    toolStrategyPlan: { strategy: 'quality_first_gpu_only' },
    qaPlan: { checks: ['complete_source', 'meaning', 'visual', 'audio'] },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: { unapprovedFallbackAllowed: false },
  }
}

function toolWorkItem(input: {
  workItemKey: string
  toolId: string
  operationId: string
}): CanonicalWorkItemInput {
  return {
    workItemKey: input.workItemKey,
    workItemType: 'process_video_asset',
    workerClass: 'gpu_media_worker',
    executionInput: {
      operation: input.operationId,
      approvedToolOperationIds: [input.operationId],
    },
    sourceSequenceItemIds: ['source-sequence-1'],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: `${input.workItemKey}-output`,
      artifactType: 'private_gpu_artifact',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/octet-stream',
      segmentIds: ['segment-complete-source'],
      timingIds: ['master-timing-gpu-plan-pricing'],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [input.toolId],
    providerExecutionMode: 'none',
    fallbackPolicy: {},
    maxAttempts: 1,
    attemptTimeoutSeconds: 600,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 777,
    required: true,
  }
}

function scope(suffix: string) {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planningRequestId: `planning-${suffix}`,
    outputId:
      confirmedOutputFrameAuthority.confirmedOutputBinding.outputId,
  }
}

function workload() {
  const sourceFrameCount = 14_400
  const pixelCount = 2_160 * 3_840
  return {
    workloadClass: 'source_video' as const,
    inputByteLength: 384 * 1024 * 1024,
    sourceDurationMilliseconds: 480_000,
    sourceFrameCount,
    sourcePixelCount: sourceFrameCount * pixelCount,
    outputFrameCount: sourceFrameCount,
    outputPixelCount: sourceFrameCount * pixelCount,
    subjectAssetOrTrackCount: 1,
  }
}

function quoteFor(input: {
  basis: CanonicalProfessionalGpuPlanPricingBasis
  workItemKey: string
  primaryRouteId: 'a100_80gb_heavy_primary' | 'l4_standard_primary'
}) {
  const unit = input.basis.pricingUnits.find((candidate) =>
    candidate.workItemKey === input.workItemKey)!
  const heavy = input.primaryRouteId === 'a100_80gb_heavy_primary'
  return createCanonicalProfessionalGpuPlanUsageQuote({
    quoteId: `quote-${input.workItemKey}`,
    quoteVersion: 1,
    pricingBasis: input.basis,
    workItemKey: input.workItemKey,
    primary: measuredRoute({
      routeId: input.primaryRouteId,
      toolReleaseRef: unit.exactToolOrModelReleaseRef,
      character: heavy ? '4' : '5',
      activeGpuMilliseconds: heavy
        ? [90_000, 150_000, 260_000]
        : [40_000, 70_000, 110_000],
    }),
    ...(heavy ? {
      fallback: measuredRoute({
        routeId: 'l4_heavy_fallback',
        toolReleaseRef: unit.exactToolOrModelReleaseRef,
        character: '6',
        activeGpuMilliseconds: [180_000, 300_000, 450_000],
      }),
      primaryPreInferenceFailureHighUsage: usage('a100', 0),
    } : {}),
    observedAt,
    expiresAt,
  })
}

function measuredRoute(input: {
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  toolReleaseRef:
    CanonicalProfessionalGpuPlanPricingBasis['pricingUnits'][number][
      'exactToolOrModelReleaseRef'
    ]
  character: string
  activeGpuMilliseconds: [number, number, number]
}) {
  const route = input.routeId === 'a100_80gb_heavy_primary'
    ? 'a100' as const
    : 'l4' as const
  return {
    routeId: input.routeId,
    usageRange: {
      low: usage(route, input.activeGpuMilliseconds[0]),
      expected: usage(route, input.activeGpuMilliseconds[1]),
      high: usage(route, input.activeGpuMilliseconds[2]),
    },
    benchmarkRunCount: 30,
    benchmarkRunSetRef: ref(`benchmark-${input.routeId}`, input.character),
    toolOrModelArtifactReleaseRef: input.toolReleaseRef,
    runtimeReleaseRef: ref(`runtime-${input.routeId}`, input.character),
  }
}

function usage(route: 'a100' | 'l4', activeGpuMilliseconds: number) {
  const coldStartMilliseconds = 10_000
  const runtimeAndModelLoadMilliseconds = activeGpuMilliseconds === 0
    ? 0
    : 20_000
  const drainAndShutdownMilliseconds = 2_000
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: coldStartMilliseconds
      + runtimeAndModelLoadMilliseconds
      + activeGpuMilliseconds
      + drainAndShutdownMilliseconds,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: route === 'a100' ? 12 : 8,
    allocatedMemoryGiB: route === 'a100' ? 170 : 32,
    allocatedLocalScratchGiB: route === 'a100' ? 375 : 0,
    privateArtifactBytes: 128 * 1024 * 1024,
    privateArtifactRetentionMilliseconds: 24 * 60 * 60 * 1_000,
    networkEgressBytes: 0,
    classAOperationCount: 4,
    classBOperationCount: 8,
  }
}

function exactOperation(toolId: string): string {
  const operation = resolveCompleteProfessionalToolOperationSpec(toolId)
  assert.ok(operation)
  assert.equal(operation.allowedOperationIds.length, 1)
  return operation.allowedOperationIds[0]
}

async function observeRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
) {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: `current-rate-${routeId}`,
    rateAuthorityVersion: 1,
    routeId,
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawRate(routeId)
      },
    },
  })
}

function rawRate(
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary',
): CanonicalGoogleCloudGpuRateRawObservation {
  const components = routeId === 'a100_80gb_heavy_primary'
    ? [
        component('a2_ultragpu_1g_machine_bundle',
          'machine_hour', 5_068_797_890, '7'),
        ...commonComponents(),
      ]
    : [
        component('cloud_run_l4_gpu_second',
          'gpu_second', 186_700, '8'),
        component('cloud_run_vcpu_second',
          'vcpu_second', 18_000, '9'),
        component('cloud_run_memory_gib_second',
          'gib_second', 2_000, 'a'),
        ...commonComponents(),
      ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-scope', 'b'),
    pricingReaderConfigurationRef: ref('pricing-reader-config', 'c'),
    routeId,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref(`price-record-set-${routeId}`, 'd'),
    pricingReadStartedAt: '2026-08-03T13:59:55.000Z',
    pricingReadFinishedAt: observedAt,
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
  }
}

function commonComponents() {
  return [
    component('private_object_storage_gib_month',
      'gib_month', 20_000_000, 'e'),
    component('network_egress_gib', 'gib', 120_000_000, 'f'),
    component('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '1'),
    component('object_class_b_per_1000',
      'per_1000_operations', 400_000, '2'),
  ]
}

function component(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  maximumUsdNanosPerBillingUnit: number,
  character: string,
) {
  return {
    componentClass,
    cloudServiceName: 'google-cloud',
    skuRateBindingId: `sku-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId: 'services-google-cloud',
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'on-demand',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: maximumUsdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef: ref(
        `billing-account-price-${componentClass}`,
        character,
      ),
    }],
    skuDescriptionDigestSha256: hash(character),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit,
    currentPriceObservedAt: observedAt,
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}

function ref(id: string, characterOrHash: string, version = 1) {
  const digest = characterOrHash.length === 64
    ? characterOrHash
    : hash(characterOrHash)
  return {
    id,
    version,
    contentHash: `sha256:${digest}` as const,
  }
}

function hash(character: string): string {
  return character.repeat(64)
}
