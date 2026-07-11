import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  evaluatePrivateFinalRenderSettlementPreflight,
  sha256PrivateFinalRenderAuthorityFingerprint,
  sha256PrivateFinalRenderPreflightEvidence,
  type PrivateFinalRenderAuthorityVerifier,
} from '../services/private-final-render-settlement-preflight-service'
import {
  PRIVATE_FINAL_RENDER_SETTLEMENT_PREFLIGHT_VERSION,
  type PrivateFinalRenderSettlementPreflightEvidence,
} from '../validation/private-final-render-settlement-preflight-schemas'

const hash = (value: string): string => createHash('sha256').update(value).digest('hex')

const lineage = {
  workspaceId: 'workspace-preflight-smoke',
  projectId: 'project-preflight-smoke',
  editSessionId: 'edit-session-preflight-smoke',
  approvedPlanSnapshotId: 'snapshot-preflight-smoke',
  snapshotHash: hash('snapshot-preflight-smoke'),
  planId: 'plan-preflight-smoke',
  estimateId: 'estimate-preflight-smoke',
  reservationId: 'reservation-preflight-smoke',
}

const finalArtifactHash = hash('final-artifact-preflight-smoke')

const renderGateTypes = [
  'approved_snapshot',
  'confirmed_output_frame',
  'timing_validation',
  'source_cleanup_meaning_preservation',
  'asset_reconciliation',
  'render_preflight',
  'model_tier_policy',
  'privacy_preflight',
]

const deliveryGateTypes = [
  'final_artifact_integrity',
  'export_codec_format',
  'export_duration_sync',
  'audio_sync',
  'final_delivery',
]

const validEvidence: PrivateFinalRenderSettlementPreflightEvidence = {
  schemaVersion: PRIVATE_FINAL_RENDER_SETTLEMENT_PREFLIGHT_VERSION,
  evidenceSource: 'server_owned_canonical_records',
  authority: {
    ...lineage,
    approvalId: 'approval-preflight-smoke',
    workGraphHash: hash('work-graph-preflight-smoke'),
    approvedSourceAssetManifestHash: hash('source-manifest-preflight-smoke'),
    approvedPlannedAssetManifestHash: hash('planned-asset-manifest-preflight-smoke'),
    planStatus: 'approved',
    estimateStatus: 'approved',
    snapshotImmutable: true,
    snapshotSuperseded: false,
    userApprovalRecorded: true,
    testOnly: false,
  },
  frame: {
    confirmationStatus: 'confirmed',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    frameTemplateId: 'youtube-side-panel-preflight-smoke',
    panelBackground: '#FFFFFF',
    safeZonesFrozen: true,
    sourceFitPlanFrozen: true,
  },
  timing: {
    masterTimingPlanId: 'master-timing-preflight-smoke',
    timingValidationPlanId: 'timing-validation-preflight-smoke',
    validationStatus: 'passed',
    frameAuthoritative: true,
    frozenInApprovedSnapshot: true,
    fps: 30,
    totalFrames: 240,
    durationSeconds: 8,
    cleanupPreferenceConfirmed: true,
    trimReviewStatus: 'passed',
    meaningPreservationStatus: 'passed',
    unresolvedUserReviewCount: 0,
  },
  sourceAssets: {
    manifestHash: hash('source-manifest-preflight-smoke'),
    requiredBindingCount: 1,
    bindings: [{
      sourceSequenceItemId: 'source-sequence-item-preflight-smoke',
      mediaAssetId: 'source-media-preflight-smoke',
      checksumSha256: hash('source-media-bytes-preflight-smoke'),
      byteSize: 1024,
      storageProvider: 'google_cloud_storage',
      generation: '12345',
      etag: 'etag-preflight-smoke',
      storageIdentityVerified: true,
      bytesRevalidatedAt: '2029-12-31T23:59:00.000Z',
      ready: true,
    }],
    sourceOrderConfirmed: true,
    sourceCoverageComplete: true,
    allRequiredBytesVerified: true,
  },
  plannedAssets: {
    manifestHash: hash('planned-asset-manifest-preflight-smoke'),
    requiredRenderInputCount: 1,
    renderInputAssets: [{
      assetId: 'render-input-asset-preflight-smoke',
      expectedOutputId: 'expected-render-input-preflight-smoke',
      workItemId: 'asset-work-item-preflight-smoke',
      artifactVersion: 1,
      artifactHash: hash('render-input-asset-preflight-smoke'),
      required: true,
      status: 'merged',
      qaStatus: 'passed',
      activeVersion: true,
      placeholder: false,
      segmentIds: ['segment-preflight-smoke'],
      timingIds: ['timing-cue-preflight-smoke'],
      rendererLayerIds: ['renderer-layer-preflight-smoke'],
    }],
    unresolvedRequiredFailureCount: 0,
    requiredPlaceholderCount: 0,
    activeVersionUniquenessVerified: true,
    rendererLineageComplete: true,
  },
  renderWork: {
    ...lineage,
    renderWorkItemId: 'render-work-item-preflight-smoke',
    renderJobId: 'render-job-preflight-smoke',
    workItemType: 'render_final_export',
    jobStatus: 'ready',
    dependencyState: 'ready',
    requiredDependencyCount: 1,
    readyDependencyCount: 1,
    expectedFinalArtifactId: 'final-artifact-preflight-smoke',
    expectedOutputRequired: true,
    expectedOutputAllowsPlaceholder: false,
    executionInputHash: hash('render-execution-input-preflight-smoke'),
    approvedToolIds: ['remotion', 'ffmpeg'],
    lease: {
      leaseId: 'render-lease-preflight-smoke',
      leaseTokenHash: hash('render-lease-token-preflight-smoke'),
      workerIdentityHash: hash('render-worker-identity-preflight-smoke'),
      status: 'active',
      tenantBound: true,
      snapshotBound: true,
      reservationBound: true,
      attempt: 1,
      maximumAttempt: 1,
      expiresAt: '2030-01-01T01:00:00.000Z',
      durableAtomicClaim: true,
    },
  },
  reservation: {
    ...lineage,
    status: 'partially_spent',
    fundingSource: 'durable_wallet_ledger',
    reservedCredits: 100,
    spentCredits: 10,
    releasedCredits: 0,
    refundedCredits: 0,
    remainingReservedCredits: 90,
    approvedMaximumCredits: 100,
    expiresAt: '2030-01-02T00:00:00.000Z',
    walletConservationVerified: true,
    appendOnlyLedgerVerified: true,
    serviceControlled: true,
    testOnly: false,
  },
  idempotency: {
    ...lineage,
    operation: 'final_render_export_settlement',
    idempotencyKey: 'final-render-export-settlement-preflight-smoke',
    requestHash: hash('final-render-request-preflight-smoke'),
    authorityFingerprint: hash('authority-fingerprint-preflight-smoke'),
    status: 'reserved',
    durableAtomic: true,
    concurrencyControlled: true,
    exactResponseReplayBound: true,
  },
  privacy: {
    privateArtifactsOnly: true,
    sourceBytesGenerationBound: true,
    outputCreateOnly: true,
    outputAtomicPromotion: true,
    artifactRootConfined: true,
    symlinkSafeReads: true,
    noSignedUrlPersisted: true,
    publicDeliveryRequested: false,
    currentMembershipRechecked: true,
    workerSandboxVerified: true,
    mediaParserIsolationVerified: true,
    retentionPolicyVerified: true,
    rawProviderPayloadStored: false,
  },
  renderRuntime: {
    renderKillSwitchOff: true,
    finalExportKillSwitchOff: true,
    commandArgumentsServerOwned: true,
    arbitraryCodeRejected: true,
    runtimeBudgetWithinLimit: true,
    concurrencySlotReserved: true,
    timeoutSeconds: 1800,
    toolEvidence: ['remotion', 'ffmpeg'].map((toolId) => ({
      toolId: toolId as 'remotion' | 'ffmpeg',
      runtimeEvidenceId: `${toolId}-runtime-evidence-preflight-smoke`,
      installedVersion: 'smoke-reviewed-version',
      binaryOrPackageDigest: hash(`${toolId}-binary-preflight-smoke`),
      containerImageDigest: `sha256:${hash(`${toolId}-container-preflight-smoke`)}`,
      licenseConfigurationApproved: true,
      allowlistedRecipeHash: hash(`${toolId}-recipe-preflight-smoke`),
      readinessStatus: 'passed',
      productionUseApproved: true,
    })),
  },
  qa: {
    renderPreflightGates: renderGateTypes.map((gateType) => ({
      gateId: `render-gate-${gateType}`,
      gateType,
      status: 'passed',
      blocking: false,
      checkedAgainstSnapshotHash: lineage.snapshotHash,
      checkedArtifactHash: null,
      evidenceHash: hash(`render-gate-evidence-${gateType}`),
    })),
    deliveryGates: deliveryGateTypes.map((gateType) => ({
      gateId: `delivery-gate-${gateType}`,
      gateType,
      status: 'passed',
      blocking: false,
      checkedAgainstSnapshotHash: lineage.snapshotHash,
      checkedArtifactHash: finalArtifactHash,
      evidenceHash: hash(`delivery-gate-evidence-${gateType}`),
    })),
    unresolvedBlockingFailureCount: 0,
    unresolvedUserReviewCount: 0,
    fallbackPendingCount: 0,
  },
  costBudget: {
    ...lineage,
    renderBudgetCredits: 20,
    totalCommittedCreditsBeforeRender: 10,
    projectedCommittedCreditsAfterRender: 30,
    approvedMaximumCredits: 100,
    remainingReservedCredits: 90,
    withinApprovedMaximum: true,
    lowerCostAlternativeRequired: false,
  },
  finalArtifact: {
    ...lineage,
    artifactId: 'final-artifact-preflight-smoke',
    artifactHash: finalArtifactHash,
    byteSize: 4096,
    mimeType: 'video/mp4',
    storageProvider: 'google_cloud_storage',
    generation: '67890',
    etag: 'final-etag-preflight-smoke',
    width: 1920,
    height: 1080,
    fps: 30,
    totalFrames: 240,
    durationSeconds: 8,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    storageIdentityVerified: true,
    mediaProbePassed: true,
    checksumRevalidatedAt: '2029-12-31T23:59:30.000Z',
  },
  actualCostSettlement: {
    ...lineage,
    events: [{
      ...lineage,
      eventId: 'actual-cost-event-preflight-smoke',
      workItemId: 'render-work-item-preflight-smoke',
      jobId: 'render-job-preflight-smoke',
      toolId: 'ffmpeg',
      retryAttempt: 0,
      idempotencyKey: 'actual-cost-event-ffmpeg-preflight-smoke',
      outputArtifactId: 'final-artifact-preflight-smoke',
      outputArtifactHash: finalArtifactHash,
      actualWorkCompleted: true,
      actualInternalCostMicros: 4_000_000,
      actualToolCostCredits: 40,
      billableToUser: true,
      serviceFeeIncluded: false,
      failureCategory: 'none',
    }],
    actualBillableToolCostCredits: 40,
    serviceFeeCredits: 30,
    grossFinalChargeCredits: 70,
    approvedChargeCeilingCredits: 100,
    userChargeCredits: 70,
    absorbedOverageCredits: 0,
    outstandingApprovedFundingCredits: 0,
    policyDecision: 'within_approval',
    rateCardVersion: 'rate-card-preflight-smoke',
    creditPolicyVersion: 'credit-policy-preflight-smoke',
    serviceFeePolicyVersion: 'service-fee-policy-preflight-smoke',
    formulaVerified: true,
    durableEventStoreVerified: true,
    settlementTransactionAvailable: true,
  },
}

const verifiedAuthority: PrivateFinalRenderAuthorityVerifier = async (evidence) => ({
  verified: true,
  canonicalEvidenceDigest: sha256PrivateFinalRenderPreflightEvidence(evidence),
})

const fixedNow = new Date('2030-01-01T00:00:00.000Z')

validEvidence.idempotency.authorityFingerprint = sha256PrivateFinalRenderAuthorityFingerprint(validEvidence)

const passed = await evaluatePrivateFinalRenderSettlementPreflight({
  evidence: validEvidence,
  verifyAuthority: verifiedAuthority,
  now: fixedNow,
})
assert.equal(passed.authorityVerified, true)
assert.equal(passed.renderPreflightSatisfied, true)
assert.equal(passed.privateDeliveryPreflightSatisfied, true)
assert.equal(passed.settlementPreflightSatisfied, true)
assert.equal(passed.blockers.length, 0)
assert.deepEqual(passed.executionAuthorization, {
  renderExecutionAuthorized: false,
  finalExportAuthorized: false,
  privateDeliveryAuthorized: false,
  publicDeliveryAuthorized: false,
  walletMutationAuthorized: false,
  settlementAuthorized: false,
})

const unverified = await evaluatePrivateFinalRenderSettlementPreflight({
  evidence: validEvidence,
  verifyAuthority: async () => ({
    verified: true,
    canonicalEvidenceDigest: hash('wrong-evidence'),
  }),
  now: fixedNow,
})
assert.equal(unverified.renderPreflightSatisfied, false)
assert.ok(unverified.blockers.some((blocker) => blocker.code === 'canonical_authority_verification_failed'))

const renderOnly = structuredClone(validEvidence)
renderOnly.finalArtifact = null
renderOnly.actualCostSettlement = null
renderOnly.qa.deliveryGates = []
const renderOnlyResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: renderOnly, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(renderOnlyResult.renderPreflightSatisfied, true)
assert.equal(renderOnlyResult.privateDeliveryPreflightSatisfied, false)
assert.equal(renderOnlyResult.settlementPreflightSatisfied, false)

const staleSource = structuredClone(validEvidence)
staleSource.sourceAssets.manifestHash = hash('stale-source-manifest')
const staleSourceResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: staleSource, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(staleSourceResult.renderPreflightSatisfied, false)
assert.ok(staleSourceResult.blockers.some((blocker) => blocker.code === 'source_manifest_hash_mismatch'))

const missingAsset = structuredClone(validEvidence)
missingAsset.plannedAssets.requiredRenderInputCount = 2
const missingAssetResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: missingAsset, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(missingAssetResult.renderPreflightSatisfied, false)
assert.ok(missingAssetResult.blockers.some((blocker) => blocker.code === 'required_render_input_count_mismatch'))

const expiredAuthorities = structuredClone(validEvidence)
expiredAuthorities.renderWork.lease.expiresAt = '2029-12-31T23:00:00.000Z'
expiredAuthorities.reservation.expiresAt = '2029-12-31T23:00:00.000Z'
const expiredResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: expiredAuthorities, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(expiredResult.renderPreflightSatisfied, false)
assert.ok(expiredResult.blockers.some((blocker) => blocker.code === 'render_lease_expired'))
assert.ok(expiredResult.blockers.some((blocker) => blocker.code === 'credit_reservation_expired'))

const deliveryTamper = structuredClone(validEvidence)
deliveryTamper.qa.deliveryGates[0].checkedArtifactHash = hash('wrong-final-artifact')
const deliveryTamperResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: deliveryTamper, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(deliveryTamperResult.renderPreflightSatisfied, true)
assert.equal(deliveryTamperResult.privateDeliveryPreflightSatisfied, false)
assert.ok(deliveryTamperResult.blockers.some((blocker) => blocker.code === 'delivery_qa_artifact_hash_mismatch'))

const syntheticSettlement = structuredClone(validEvidence)
syntheticSettlement.authority.testOnly = true
syntheticSettlement.reservation.testOnly = true
syntheticSettlement.reservation.fundingSource = 'synthetic_private_internal_wallet'
syntheticSettlement.idempotency.authorityFingerprint = sha256PrivateFinalRenderAuthorityFingerprint(syntheticSettlement)
const syntheticResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: syntheticSettlement, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(syntheticResult.renderPreflightSatisfied, true)
assert.equal(syntheticResult.privateDeliveryPreflightSatisfied, true)
assert.equal(syntheticResult.settlementPreflightSatisfied, false)
assert.ok(syntheticResult.blockers.some((blocker) => blocker.code === 'paid_settlement_durable_authority_missing'))

const billedFailure = structuredClone(validEvidence)
if (!billedFailure.actualCostSettlement) throw new Error('Smoke fixture is missing actual-cost settlement evidence.')
billedFailure.actualCostSettlement.events[0].failureCategory = 'timeout'
const billedFailureResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: billedFailure, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(billedFailureResult.settlementPreflightSatisfied, false)
assert.ok(billedFailureResult.blockers.some((blocker) => blocker.code === 'reeditpro_failure_billed_to_user'))

const revisedEstimate = structuredClone(validEvidence)
if (!revisedEstimate.actualCostSettlement) throw new Error('Smoke fixture is missing actual-cost settlement evidence.')
revisedEstimate.actualCostSettlement.policyDecision = 'revised_estimate_required'
const revisedEstimateResult = await evaluatePrivateFinalRenderSettlementPreflight({ evidence: revisedEstimate, verifyAuthority: verifiedAuthority, now: fixedNow })
assert.equal(revisedEstimateResult.settlementPreflightSatisfied, false)
assert.ok(revisedEstimateResult.blockers.some((blocker) => blocker.code === 'revised_estimate_required'))

const malformedPrivacy = structuredClone(validEvidence) as unknown as Record<string, unknown>
;(malformedPrivacy.privacy as Record<string, unknown>).privateArtifactsOnly = false
await assert.rejects(
  evaluatePrivateFinalRenderSettlementPreflight({ evidence: malformedPrivacy, verifyAuthority: verifiedAuthority, now: fixedNow }),
  /preflight evidence validation failed/i,
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'complete_server_verified_evidence_satisfies_all_preflights',
    'satisfied_preflight_never_authorizes_execution_or_settlement',
    'authority_digest_mismatch_blocks_render',
    'render_can_be_ready_while_delivery_and_settlement_wait',
    'stale_source_manifest_blocks_render',
    'missing_required_asset_blocks_render',
    'expired_lease_and_reservation_block_render',
    'artifact_hash_mismatch_blocks_delivery',
    'synthetic_authority_blocks_paid_settlement_only',
    'reeditpro_failure_cannot_be_billed',
    'revised_estimate_blocks_settlement',
    'unsafe_privacy_evidence_is_rejected',
  ],
}, null, 2))
