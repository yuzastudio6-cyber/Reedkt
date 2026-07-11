import { createHash, timingSafeEqual } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  privateFinalRenderSettlementPreflightEvidenceSchema,
  type PrivateFinalRenderSettlementPreflightEvidence,
} from '../validation/private-final-render-settlement-preflight-schemas'

export type PrivateFinalRenderPreflightScope = 'render' | 'delivery' | 'settlement'

export interface PrivateFinalRenderPreflightBlocker {
  code: string
  scope: PrivateFinalRenderPreflightScope
  message: string
}

export interface PrivateFinalRenderAuthorityVerification {
  verified: boolean
  canonicalEvidenceDigest: string
  reason?: string
}

export type PrivateFinalRenderAuthorityVerifier = (
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
) => PrivateFinalRenderAuthorityVerification | Promise<PrivateFinalRenderAuthorityVerification>

export interface PrivateFinalRenderSettlementPreflightResult {
  schemaVersion: 'private-final-render-settlement-preflight-result-v1'
  evidenceDigest: string
  authorityVerified: boolean
  renderPreflightSatisfied: boolean
  privateDeliveryPreflightSatisfied: boolean
  settlementPreflightSatisfied: boolean
  blockers: PrivateFinalRenderPreflightBlocker[]
  executionAuthorization: {
    renderExecutionAuthorized: false
    finalExportAuthorized: false
    privateDeliveryAuthorized: false
    publicDeliveryAuthorized: false
    walletMutationAuthorized: false
    settlementAuthorized: false
  }
  integrationHandoff: {
    canonicalLoaderRequired: true
    routeMounted: false
    workerDispatchEnabled: false
    renderRunnerEnabled: false
    deliveryMutationEnabled: false
    settlementMutationEnabled: false
  }
  warnings: string[]
}

const RENDER_QA_GATES = [
  'approved_snapshot',
  'confirmed_output_frame',
  'timing_validation',
  'source_cleanup_meaning_preservation',
  'asset_reconciliation',
  'render_preflight',
  'model_tier_policy',
  'privacy_preflight',
] as const

const DELIVERY_QA_GATES = [
  'final_artifact_integrity',
  'export_codec_format',
  'export_duration_sync',
  'audio_sync',
  'final_delivery',
] as const

const LINEAGE_KEYS = [
  'workspaceId',
  'projectId',
  'editSessionId',
  'approvedPlanSnapshotId',
  'snapshotHash',
  'planId',
  'estimateId',
  'reservationId',
] as const

export async function evaluatePrivateFinalRenderSettlementPreflight(input: {
  evidence: unknown
  verifyAuthority: PrivateFinalRenderAuthorityVerifier
  now?: Date
}): Promise<PrivateFinalRenderSettlementPreflightResult> {
  const parsed = privateFinalRenderSettlementPreflightEvidenceSchema.safeParse(input.evidence)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private final-render/settlement preflight evidence validation failed.',
      400,
      parsed.error.flatten(),
    )
  }

  const evidence = parsed.data
  const evidenceDigest = sha256StableValue(evidence)
  const verification = await input.verifyAuthority(evidence)
  const authorityVerified = verification.verified &&
    constantTimeDigestEqual(verification.canonicalEvidenceDigest, evidenceDigest)
  const blockers: PrivateFinalRenderPreflightBlocker[] = []
  const now = input.now ?? new Date()

  if (!authorityVerified) {
    addBlocker(
      blockers,
      'canonical_authority_verification_failed',
      'render',
      verification.reason ?? 'A canonical backend loader did not verify the complete evidence digest.',
    )
  }

  validateLineage(evidence, blockers)
  validateIdempotencyFingerprint(evidence, blockers)
  validateFrameAndTiming(evidence, blockers)
  validateSourceAndAssetReadiness(evidence, blockers, now)
  validateRenderWorkAndRuntime(evidence, blockers, now)
  validateReservationAndBudget(evidence, blockers, now)
  validateQaEvidence(evidence, blockers)
  validateFinalArtifact(evidence, blockers, now)
  validateSettlementEvidence(evidence, blockers)

  const renderPreflightSatisfied = !hasBlockerAtOrBefore(blockers, 'render')
  const privateDeliveryPreflightSatisfied = renderPreflightSatisfied &&
    !hasBlockerAtOrBefore(blockers, 'delivery')
  const settlementPreflightSatisfied = privateDeliveryPreflightSatisfied &&
    !hasBlockerAtOrBefore(blockers, 'settlement')

  return {
    schemaVersion: 'private-final-render-settlement-preflight-result-v1',
    evidenceDigest,
    authorityVerified,
    renderPreflightSatisfied,
    privateDeliveryPreflightSatisfied,
    settlementPreflightSatisfied,
    blockers,
    executionAuthorization: {
      renderExecutionAuthorized: false,
      finalExportAuthorized: false,
      privateDeliveryAuthorized: false,
      publicDeliveryAuthorized: false,
      walletMutationAuthorized: false,
      settlementAuthorized: false,
    },
    integrationHandoff: {
      canonicalLoaderRequired: true,
      routeMounted: false,
      workerDispatchEnabled: false,
      renderRunnerEnabled: false,
      deliveryMutationEnabled: false,
      settlementMutationEnabled: false,
    },
    warnings: [
      'Evidence satisfaction is not execution authority. This evaluator has no route, job claim, renderer, delivery, wallet, ledger, or settlement side effect.',
      'Only a server-owned canonical loader may supply and verify this evidence; direct HTTP evidence must never be trusted.',
      'Public delivery remains outside this private preflight contract.',
    ],
  }
}

export function sha256PrivateFinalRenderPreflightEvidence(value: unknown): string {
  const parsed = privateFinalRenderSettlementPreflightEvidenceSchema.parse(value)
  return sha256StableValue(parsed)
}

export function sha256PrivateFinalRenderAuthorityFingerprint(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
): string {
  return sha256StableValue({
    operation: evidence.idempotency.operation,
    authority: evidence.authority,
    renderWork: evidence.renderWork,
    reservation: evidence.reservation,
    costBudget: evidence.costBudget,
  })
}

function validateLineage(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  const expected = evidence.authority
  compareLineage(expected, evidence.renderWork, 'render work', 'render', blockers)
  compareLineage(expected, evidence.reservation, 'reservation', 'render', blockers)
  compareLineage(expected, evidence.idempotency, 'idempotency', 'render', blockers)
  compareLineage(expected, evidence.costBudget, 'cost budget', 'render', blockers)
  if (evidence.finalArtifact) {
    compareLineage(expected, evidence.finalArtifact, 'final artifact', 'delivery', blockers)
  }
  if (evidence.actualCostSettlement) {
    compareLineage(expected, evidence.actualCostSettlement, 'actual-cost settlement', 'settlement', blockers)
  }

  if (evidence.sourceAssets.manifestHash !== expected.approvedSourceAssetManifestHash) {
    addBlocker(blockers, 'source_manifest_hash_mismatch', 'render', 'Source manifest hash does not match the approved snapshot.')
  }
  if (evidence.plannedAssets.manifestHash !== expected.approvedPlannedAssetManifestHash) {
    addBlocker(blockers, 'planned_asset_manifest_hash_mismatch', 'render', 'Planned asset manifest hash does not match the approved snapshot.')
  }
}

function compareLineage(
  expected: Record<(typeof LINEAGE_KEYS)[number], string>,
  record: Record<(typeof LINEAGE_KEYS)[number], string>,
  label: string,
  scope: PrivateFinalRenderPreflightScope,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  for (const key of LINEAGE_KEYS) {
    if (record[key] !== expected[key]) {
      addBlocker(blockers, `lineage_${key}_mismatch`, scope, `${label} ${key} does not match the approved authority.`)
    }
  }
}

function validateIdempotencyFingerprint(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  if (evidence.idempotency.authorityFingerprint !== sha256PrivateFinalRenderAuthorityFingerprint(evidence)) {
    addBlocker(blockers, 'idempotency_authority_fingerprint_mismatch', 'render', 'Idempotency authority fingerprint does not match the exact snapshot, job, reservation, and cost budget.')
  }
}

function validateFrameAndTiming(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  const ratio = ratioValue(evidence.frame.aspectRatio)
  if (Math.abs(evidence.frame.width / evidence.frame.height - ratio) > 0.002) {
    addBlocker(blockers, 'confirmed_frame_ratio_mismatch', 'render', 'Confirmed canvas dimensions do not match the approved aspect ratio.')
  }
  if (!approximatelyEqual(evidence.frame.fps, evidence.timing.fps, 0.000_001)) {
    addBlocker(blockers, 'timing_fps_mismatch', 'render', 'Master Timing fps does not match the confirmed output frame fps.')
  }
  const frameDuration = evidence.timing.totalFrames / evidence.timing.fps
  if (Math.abs(frameDuration - evidence.timing.durationSeconds) > 1 / evidence.timing.fps) {
    addBlocker(blockers, 'timing_frame_duration_mismatch', 'render', 'Frame-authoritative duration and display seconds differ by more than one frame.')
  }
}

function validateSourceAndAssetReadiness(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
  now: Date,
): void {
  if (evidence.sourceAssets.requiredBindingCount !== evidence.sourceAssets.bindings.length) {
    addBlocker(blockers, 'required_source_binding_count_mismatch', 'render', 'All required source bindings must be present before render.')
  }
  requireUnique(
    evidence.sourceAssets.bindings.map((binding) => binding.sourceSequenceItemId),
    blockers,
    'duplicate_source_sequence_binding',
    'render',
    'Source sequence bindings must be unique.',
  )
  requireUnique(
    evidence.sourceAssets.bindings.map((binding) => binding.mediaAssetId),
    blockers,
    'duplicate_source_media_binding',
    'render',
    'Source media bindings must be unique.',
  )
  for (const binding of evidence.sourceAssets.bindings) {
    if (binding.storageProvider === 'google_cloud_storage' && (!binding.generation || !binding.etag)) {
      addBlocker(blockers, 'gcs_source_identity_incomplete', 'render', 'Every GCS source binding requires exact generation and ETag evidence.')
    }
    if (!timestampIsFresh(binding.bytesRevalidatedAt, now, 300)) {
      addBlocker(blockers, 'source_byte_evidence_stale', 'render', 'Source byte and storage identity evidence must be revalidated within five minutes of render preflight.')
    }
  }

  if (evidence.plannedAssets.requiredRenderInputCount !== evidence.plannedAssets.renderInputAssets.length) {
    addBlocker(blockers, 'required_render_input_count_mismatch', 'render', 'Every required render input asset must be merged and QA-passed.')
  }
  requireUnique(
    evidence.plannedAssets.renderInputAssets.map((asset) => asset.assetId),
    blockers,
    'duplicate_render_input_asset',
    'render',
    'Required render input assets must be unique.',
  )
  requireUnique(
    evidence.plannedAssets.renderInputAssets.map((asset) => asset.expectedOutputId),
    blockers,
    'duplicate_expected_output_binding',
    'render',
    'Each required expected output must resolve to one active asset version.',
  )
}

function validateRenderWorkAndRuntime(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
  now: Date,
): void {
  if (evidence.renderWork.requiredDependencyCount !== evidence.renderWork.readyDependencyCount) {
    addBlocker(blockers, 'render_dependencies_not_ready', 'render', 'Required render job dependencies are not all ready.')
  }
  if (evidence.renderWork.lease.attempt > evidence.renderWork.lease.maximumAttempt) {
    addBlocker(blockers, 'render_lease_attempt_exceeded', 'render', 'Render lease attempt exceeds the approved maximum attempt.')
  }
  if (Date.parse(evidence.renderWork.lease.expiresAt) <= now.getTime()) {
    addBlocker(blockers, 'render_lease_expired', 'render', 'Render execution lease is expired.')
  }
  requireUnique(
    evidence.renderWork.approvedToolIds,
    blockers,
    'duplicate_render_tool_authority',
    'render',
    'Approved render tool IDs must be unique.',
  )
  requireUnique(
    evidence.renderRuntime.toolEvidence.map((item) => item.toolId),
    blockers,
    'duplicate_runtime_tool_evidence',
    'render',
    'Runtime tool evidence must contain one record per tool.',
  )
  const runtimeTools = new Set(evidence.renderRuntime.toolEvidence.map((item) => item.toolId))
  for (const toolId of evidence.renderWork.approvedToolIds) {
    if (!runtimeTools.has(toolId)) {
      addBlocker(blockers, 'approved_render_tool_runtime_missing', 'render', `Approved render tool ${toolId} has no production runtime evidence.`)
    }
  }
}

function validateReservationAndBudget(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
  now: Date,
): void {
  const reservation = evidence.reservation
  const remaining = reservation.reservedCredits -
    reservation.spentCredits -
    reservation.releasedCredits -
    reservation.refundedCredits
  if (remaining !== reservation.remainingReservedCredits || remaining <= 0) {
    addBlocker(blockers, 'reservation_conservation_mismatch', 'render', 'Reservation remaining credits do not conserve reserve/spend/release/refund amounts.')
  }
  if (reservation.reservedCredits !== reservation.approvedMaximumCredits) {
    addBlocker(blockers, 'reservation_approved_maximum_mismatch', 'render', 'Reserved credits must match the exact approved maximum for this authority.')
  }
  if (Date.parse(reservation.expiresAt) <= now.getTime()) {
    addBlocker(blockers, 'credit_reservation_expired', 'render', 'Funded credit reservation is expired.')
  }
  const budget = evidence.costBudget
  if (
    budget.approvedMaximumCredits !== reservation.approvedMaximumCredits ||
    budget.remainingReservedCredits !== reservation.remainingReservedCredits
  ) {
    addBlocker(blockers, 'render_budget_reservation_mismatch', 'render', 'Render cost budget does not match funded reservation authority.')
  }
  if (
    budget.projectedCommittedCreditsAfterRender !== budget.totalCommittedCreditsBeforeRender + budget.renderBudgetCredits ||
    budget.projectedCommittedCreditsAfterRender > budget.approvedMaximumCredits ||
    budget.renderBudgetCredits > budget.remainingReservedCredits
  ) {
    addBlocker(blockers, 'render_budget_exceeds_approval', 'render', 'Projected render cost exceeds approved or remaining reserved credits.')
  }
}

function validateQaEvidence(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  validateQaGateSet(evidence.qa.renderPreflightGates, RENDER_QA_GATES, evidence, blockers, 'render')
  if (evidence.finalArtifact) {
    validateQaGateSet(evidence.qa.deliveryGates, DELIVERY_QA_GATES, evidence, blockers, 'delivery')
  } else if (evidence.qa.deliveryGates.length > 0) {
    addBlocker(blockers, 'delivery_qa_without_final_artifact', 'delivery', 'Delivery QA cannot be authoritative before a final artifact exists.')
  }
}

function validateQaGateSet(
  gates: PrivateFinalRenderSettlementPreflightEvidence['qa']['renderPreflightGates'],
  requiredGateTypes: readonly string[],
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
  scope: 'render' | 'delivery',
): void {
  requireUnique(gates.map((gate) => gate.gateId), blockers, `duplicate_${scope}_qa_gate_id`, scope, 'QA gate IDs must be unique.')
  requireUnique(gates.map((gate) => gate.gateType), blockers, `duplicate_${scope}_qa_gate_type`, scope, 'QA gate types must be unique.')
  const byType = new Map(gates.map((gate) => [gate.gateType, gate]))
  for (const gateType of requiredGateTypes) {
    if (!byType.has(gateType)) {
      addBlocker(blockers, `required_${scope}_qa_gate_missing`, scope, `Required ${scope} QA gate ${gateType} is missing.`)
    }
  }
  for (const gate of gates) {
    if (gate.checkedAgainstSnapshotHash !== evidence.authority.snapshotHash) {
      addBlocker(blockers, `${scope}_qa_snapshot_hash_mismatch`, scope, `QA gate ${gate.gateType} is not bound to the approved snapshot hash.`)
    }
    if (
      scope === 'delivery' &&
      evidence.finalArtifact &&
      gate.checkedArtifactHash !== evidence.finalArtifact.artifactHash
    ) {
      addBlocker(blockers, 'delivery_qa_artifact_hash_mismatch', 'delivery', `Delivery QA gate ${gate.gateType} is not bound to the final artifact hash.`)
    }
  }
}

function validateFinalArtifact(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
  now: Date,
): void {
  const artifact = evidence.finalArtifact
  if (!artifact) {
    addBlocker(blockers, 'final_artifact_missing', 'delivery', 'Private delivery requires the exact final artifact and media-probe evidence.')
    return
  }
  if (artifact.artifactId !== evidence.renderWork.expectedFinalArtifactId) {
    addBlocker(blockers, 'final_artifact_expected_output_mismatch', 'delivery', 'Final artifact does not match the render work item expected output.')
  }
  if (artifact.width !== evidence.frame.width || artifact.height !== evidence.frame.height) {
    addBlocker(blockers, 'final_artifact_frame_mismatch', 'delivery', 'Final artifact dimensions do not match the confirmed output frame.')
  }
  if (!approximatelyEqual(artifact.fps, evidence.timing.fps, 0.000_001)) {
    addBlocker(blockers, 'final_artifact_fps_mismatch', 'delivery', 'Final artifact fps does not match the approved Master Timing Plan.')
  }
  if (artifact.totalFrames !== evidence.timing.totalFrames) {
    addBlocker(blockers, 'final_artifact_frame_count_mismatch', 'delivery', 'Final artifact frame count does not match approved frame-authoritative timing.')
  }
  if (Math.abs(artifact.durationSeconds - evidence.timing.durationSeconds) > 1 / evidence.timing.fps) {
    addBlocker(blockers, 'final_artifact_duration_mismatch', 'delivery', 'Final artifact duration differs from approved timing by more than one frame.')
  }
  if (artifact.storageProvider === 'google_cloud_storage' && (!artifact.generation || !artifact.etag)) {
    addBlocker(blockers, 'gcs_final_artifact_identity_incomplete', 'delivery', 'A GCS final artifact requires exact generation and ETag evidence.')
  }
  if (!timestampIsFresh(artifact.checksumRevalidatedAt, now, 300)) {
    addBlocker(blockers, 'final_artifact_checksum_evidence_stale', 'delivery', 'Final artifact checksum and storage identity evidence must be fresh at delivery preflight.')
  }
}

function validateSettlementEvidence(
  evidence: PrivateFinalRenderSettlementPreflightEvidence,
  blockers: PrivateFinalRenderPreflightBlocker[],
): void {
  const settlement = evidence.actualCostSettlement
  if (!settlement) {
    addBlocker(blockers, 'actual_cost_settlement_evidence_missing', 'settlement', 'Settlement requires durable actual-cost events and verified charge math.')
    return
  }
  if (!evidence.finalArtifact) {
    addBlocker(blockers, 'settlement_final_artifact_missing', 'settlement', 'Settlement cannot proceed before a QA-passed final artifact exists.')
  }
  if (
    evidence.authority.testOnly ||
    evidence.reservation.testOnly ||
    evidence.reservation.fundingSource !== 'durable_wallet_ledger'
  ) {
    addBlocker(blockers, 'paid_settlement_durable_authority_missing', 'settlement', 'Synthetic/internal-test authority cannot mutate a paid wallet or ledger.')
  }

  requireUnique(settlement.events.map((event) => event.eventId), blockers, 'duplicate_actual_cost_event', 'settlement', 'Actual-cost event IDs must be unique.')
  requireUnique(settlement.events.map((event) => event.idempotencyKey), blockers, 'duplicate_actual_cost_idempotency', 'settlement', 'Actual-cost event idempotency keys must be unique.')

  let actualBillableToolCostCredits = 0
  for (const event of settlement.events) {
    for (const key of LINEAGE_KEYS) {
      if (event[key] !== evidence.authority[key]) {
        addBlocker(blockers, `actual_cost_event_${key}_mismatch`, 'settlement', `Actual-cost event ${event.eventId} is not bound to the approved authority.`)
      }
    }
    if (event.billableToUser) actualBillableToolCostCredits += event.actualToolCostCredits
    if (
      !['none', 'user_requested_retry'].includes(event.failureCategory) &&
      event.billableToUser
    ) {
      addBlocker(blockers, 'reeditpro_failure_billed_to_user', 'settlement', `Actual-cost event ${event.eventId} bills a failure ReEditPro must absorb.`)
    }
  }
  if (settlement.actualBillableToolCostCredits !== actualBillableToolCostCredits) {
    addBlocker(blockers, 'actual_cost_event_sum_mismatch', 'settlement', 'Billable actual-cost event credits do not match the settlement aggregate.')
  }
  if (settlement.grossFinalChargeCredits !== settlement.actualBillableToolCostCredits + settlement.serviceFeeCredits) {
    addBlocker(blockers, 'settlement_formula_mismatch', 'settlement', 'Gross final charge must equal actual billable tool cost plus the ReEditPro service fee.')
  }
  if (settlement.userChargeCredits + settlement.absorbedOverageCredits !== settlement.grossFinalChargeCredits) {
    addBlocker(blockers, 'settlement_overage_conservation_mismatch', 'settlement', 'User charge plus absorbed overage must equal the gross final charge.')
  }
  if (settlement.userChargeCredits > settlement.approvedChargeCeilingCredits) {
    addBlocker(blockers, 'user_charge_exceeds_approved_ceiling', 'settlement', 'User charge exceeds the exact approved charge ceiling.')
  }
  if (settlement.approvedChargeCeilingCredits !== evidence.reservation.approvedMaximumCredits) {
    addBlocker(blockers, 'settlement_approved_ceiling_mismatch', 'settlement', 'Settlement charge ceiling does not match the exact approved reservation maximum.')
  }
  const expectedOutstanding = Math.max(0, settlement.userChargeCredits - evidence.reservation.remainingReservedCredits)
  if (settlement.outstandingApprovedFundingCredits !== expectedOutstanding) {
    addBlocker(blockers, 'settlement_outstanding_funding_mismatch', 'settlement', 'Outstanding approved funding does not match the active reservation balance.')
  }
  if (settlement.outstandingApprovedFundingCredits > 0) {
    addBlocker(blockers, 'approved_final_charge_not_funded', 'settlement', 'Approved final charge is not fully funded; export/settlement must remain locked.')
  }

  if (settlement.policyDecision === 'within_approval') {
    if (settlement.grossFinalChargeCredits > settlement.approvedChargeCeilingCredits || settlement.absorbedOverageCredits !== 0) {
      addBlocker(blockers, 'within_approval_policy_mismatch', 'settlement', 'Within-approval settlement cannot exceed the ceiling or absorb an overage.')
    }
  } else if (settlement.policyDecision === 'reeditpro_absorbs_unapproved_overage') {
    if (
      settlement.grossFinalChargeCredits <= settlement.approvedChargeCeilingCredits ||
      settlement.absorbedOverageCredits <= 0
    ) {
      addBlocker(blockers, 'absorbed_overage_policy_mismatch', 'settlement', 'Absorbed-overage settlement requires a real positive unapproved overage.')
    }
  } else {
    addBlocker(blockers, 'revised_estimate_required', 'settlement', 'A revised estimate and new user approval are required before paid settlement.')
  }
}

function addBlocker(
  blockers: PrivateFinalRenderPreflightBlocker[],
  code: string,
  scope: PrivateFinalRenderPreflightScope,
  message: string,
): void {
  if (!blockers.some((blocker) => blocker.code === code && blocker.scope === scope && blocker.message === message)) {
    blockers.push({ code, scope, message })
  }
}

function requireUnique(
  values: readonly string[],
  blockers: PrivateFinalRenderPreflightBlocker[],
  code: string,
  scope: PrivateFinalRenderPreflightScope,
  message: string,
): void {
  if (new Set(values).size !== values.length) addBlocker(blockers, code, scope, message)
}

function hasBlockerAtOrBefore(
  blockers: readonly PrivateFinalRenderPreflightBlocker[],
  scope: PrivateFinalRenderPreflightScope,
): boolean {
  const order: Record<PrivateFinalRenderPreflightScope, number> = {
    render: 0,
    delivery: 1,
    settlement: 2,
  }
  return blockers.some((blocker) => order[blocker.scope] <= order[scope])
}

function ratioValue(aspectRatio: PrivateFinalRenderSettlementPreflightEvidence['frame']['aspectRatio']): number {
  const [width, height] = aspectRatio.split(':').map(Number)
  return width / height
}

function approximatelyEqual(left: number, right: number, tolerance: number): boolean {
  return Math.abs(left - right) <= tolerance
}

function timestampIsFresh(timestamp: string, now: Date, maximumAgeSeconds: number): boolean {
  const ageMilliseconds = now.getTime() - Date.parse(timestamp)
  return ageMilliseconds >= -5_000 && ageMilliseconds <= maximumAgeSeconds * 1_000
}

function sha256StableValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableJsonValue(value))).digest('hex')
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}

function constantTimeDigestEqual(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false
  const leftBuffer = Buffer.from(left.toLowerCase(), 'hex')
  const rightBuffer = Buffer.from(right.toLowerCase(), 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
