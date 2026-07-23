import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity } from './official-capability'

export const MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID =
  'motion_studio_elevenlabs_timing_v1' as const
export const MOTION_STUDIO_ELEVENLABS_TIMING_ENDPOINT =
  'https://api.elevenlabs.io/v1/text-to-speech' as const

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const issuedAttemptKeys = new Map<string, number>()
const issuedLiveExecutionAuthorities = new WeakMap<object, string>()

export type MotionStudioSpeechC2PreflightGate =
  | 'official_capability_current'
  | 'approved_snapshot_and_estimate'
  | 'verified_catalog_voice'
  | 'server_credential_reference'
  | 'existing_funds_and_model_access'
  | 'zero_retention_entitlement'
  | 'exact_rate_card_and_cost_ceiling'
  | 'single_attempt_job_lease'
  | 'private_ingest_and_normalization'
  | 'usage_cost_reconciliation'

export const MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES = Object.freeze([
  'official_capability_current',
  'approved_snapshot_and_estimate',
  'verified_catalog_voice',
  'server_credential_reference',
  'existing_funds_and_model_access',
  'zero_retention_entitlement',
  'exact_rate_card_and_cost_ceiling',
  'single_attempt_job_lease',
  'private_ingest_and_normalization',
  'usage_cost_reconciliation',
] as const satisfies readonly MotionStudioSpeechC2PreflightGate[])

export interface MotionStudioSpeechC2PreflightReport {
  schemaVersion: 'motion-studio.speech-c2-preflight.v1'
  state: 'blocked' | 'ready_for_single_submission_authority'
  gates: readonly {
    gate: MotionStudioSpeechC2PreflightGate
    status: 'passed' | 'missing'
    evidenceId?: string
  }[]
  blockers: readonly MotionStudioSpeechC2PreflightGate[]
  providerCallMade: false
  credentialValueRead: false
  purchasePerformed: false
  preflightDigest: string
  immutable: true
}

export interface MotionStudioSpeechC2ExecutionAuthorityV1 {
  schemaVersion: 'motion-studio.speech-c2-execution-authority.v1'
  authorityId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedWorkItemId: string
  preflightDigest: string
  preflightGateEvidence: Readonly<Record<MotionStudioSpeechC2PreflightGate, string>>
  planReviewApprovalEvidenceId: string
  creditEstimateApprovalEvidenceId: string
  speechRequestId: string
  speechRequestDigest: string
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  idempotencyKeyHash: string
  voiceBindingId: string
  voiceIdentityHash: string
  credentialReferenceId: string
  credentialBindingDigest: string
  modelId: 'eleven_v3'
  providerOutputFormat: 'mp3_44100_128'
  enableProviderLogging: false
  zeroRetentionEntitlementVerified: true
  verifiedProviderCatalogVoice: true
  accountFundedWithoutPurchase: true
  modelAccessVerified: true
  providerRateCardSnapshotId: string
  accountUsageBaselineEvidenceId: string
  costReconciliationMethod: 'account_usage_delta_required'
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedLocalComputeCostMicros: number
  maximumAuthorizedTotalInternalCostMicros: number
  maximumProviderCalls: 1
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  privateLocalReviewOnly: true
  timelineMutationAllowed: false
  finalSelectionAllowed: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  issuedAt: string
  expiresAt: string
  authorityDigest: string
  immutable: true
}

export function createMotionStudioSpeechC2PreflightReport(
  evidence: Readonly<Partial<Record<MotionStudioSpeechC2PreflightGate, string>>>,
): MotionStudioSpeechC2PreflightReport {
  const unknownGates = Object.keys(evidence).filter(
    (gate) => !MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES.includes(gate as MotionStudioSpeechC2PreflightGate),
  )
  if (unknownGates.length) invalid('C2 speech preflight contains an unknown gate.')
  const gates = MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES.map((gate) => {
    const evidenceId = evidence[gate]
    if (evidenceId !== undefined && !STABLE_ID.test(evidenceId)) {
      invalid(`C2 speech preflight evidence for ${gate} is malformed.`)
    }
    return evidenceId
      ? { gate, status: 'passed' as const, evidenceId }
      : { gate, status: 'missing' as const }
  })
  const blockers = gates.filter((entry) => entry.status === 'missing').map((entry) => entry.gate)
  const base = {
    schemaVersion: 'motion-studio.speech-c2-preflight.v1' as const,
    state: blockers.length ? 'blocked' as const : 'ready_for_single_submission_authority' as const,
    gates,
    blockers,
    providerCallMade: false as const,
    credentialValueRead: false as const,
    purchasePerformed: false as const,
    immutable: true as const,
  }
  const frozenBase = {
    ...base,
    gates: Object.freeze(base.gates.map((entry) => Object.freeze({ ...entry }))),
    blockers: Object.freeze([...base.blockers]),
  }
  return Object.freeze({ ...frozenBase, preflightDigest: sha256CanonicalJson(frozenBase) })
}

export function assertMotionStudioSpeechC2PreflightReport(
  report: MotionStudioSpeechC2PreflightReport,
): MotionStudioSpeechC2PreflightReport {
  if (!report || report.schemaVersion !== 'motion-studio.speech-c2-preflight.v1') {
    invalid('C2 speech preflight schema is invalid.')
  }
  if (!SHA256.test(report.preflightDigest)) invalid('C2 speech preflight digest is malformed.')
  if (!Array.isArray(report.gates) || report.gates.length !== MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES.length) {
    invalid('C2 speech preflight must contain every required gate exactly once.')
  }
  const seen = new Set<MotionStudioSpeechC2PreflightGate>()
  for (const entry of report.gates) {
    if (!MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES.includes(entry.gate) || seen.has(entry.gate)) {
      invalid('C2 speech preflight contains an unknown or duplicate gate.')
    }
    seen.add(entry.gate)
    if (entry.status === 'passed') {
      if (!entry.evidenceId || !STABLE_ID.test(entry.evidenceId)) invalid('A passed C2 speech gate requires stable evidence.')
    } else if (entry.status === 'missing') {
      if (entry.evidenceId !== undefined) invalid('A missing C2 speech gate cannot carry evidence.')
    } else {
      invalid('C2 speech preflight gate status is invalid.')
    }
  }
  const expectedBlockers = report.gates.filter((entry) => entry.status === 'missing').map((entry) => entry.gate)
  if (
    report.blockers.length !== expectedBlockers.length ||
    report.blockers.some((gate, index) => gate !== expectedBlockers[index]) ||
    report.state !== (expectedBlockers.length ? 'blocked' : 'ready_for_single_submission_authority') ||
    report.providerCallMade !== false || report.credentialValueRead !== false ||
    report.purchasePerformed !== false || report.immutable !== true
  ) blocked('C2 speech preflight state is inconsistent with its evidence gates.')
  const { preflightDigest, ...base } = report
  if (sha256CanonicalJson(base) !== preflightDigest) blocked('C2 speech preflight failed its immutable digest.')
  return report
}

export function createMotionStudioSpeechC2ExecutionAuthority(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  preflightReport: MotionStudioSpeechC2PreflightReport
  authorityId: string
  planReviewApprovalEvidenceId: string
  creditEstimateApprovalEvidenceId: string
  credentialReferenceId: string
  credentialBindingDigest: string
  providerRateCardSnapshotId: string
  accountUsageBaselineEvidenceId: string
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechC2ExecutionAuthorityV1 {
  const request = motionStudioSpeechSegmentRequestV1Schema.parse(input.request)
  const capability = assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity(input.capabilitySnapshot)
  const preflight = assertMotionStudioSpeechC2PreflightReport(input.preflightReport)
  if (request.executionBoundary.protocolSimulatorOnly) blocked('C2 authority requires a bounded provider request, not protocol evidence.')
  if (preflight.state !== 'ready_for_single_submission_authority' || preflight.blockers.length) {
    blocked('C2 authority requires every preflight gate to have explicit evidence.')
  }
  const preflightGateEvidence = Object.fromEntries(preflight.gates.map((entry) => [entry.gate, entry.evidenceId!])) as
    Record<MotionStudioSpeechC2PreflightGate, string>
  const issuedAt = exactIso(input.issuedAt, 'C2 speech authority issue time')
  const expiresAt = exactIso(input.expiresAt, 'C2 speech authority expiry time')
  const base: Omit<MotionStudioSpeechC2ExecutionAuthorityV1, 'authorityDigest'> = {
    schemaVersion: 'motion-studio.speech-c2-execution-authority.v1',
    authorityId: input.authorityId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotDigest: request.approvedSnapshotDigest,
    approvedWorkItemId: request.approvedWorkItemId,
    preflightDigest: preflight.preflightDigest,
    preflightGateEvidence,
    planReviewApprovalEvidenceId: input.planReviewApprovalEvidenceId,
    creditEstimateApprovalEvidenceId: input.creditEstimateApprovalEvidenceId,
    speechRequestId: request.speechRequestId,
    speechRequestDigest: sha256CanonicalJson(request),
    capabilitySnapshotId: capability.capabilitySnapshotId,
    capabilitySnapshotDigest: capability.evidenceDigest,
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    idempotencyKeyHash: request.idempotencyKeyHash,
    voiceBindingId: request.voice.voiceBindingId,
    voiceIdentityHash: request.voice.voiceIdentityHash,
    credentialReferenceId: input.credentialReferenceId,
    credentialBindingDigest: input.credentialBindingDigest,
    modelId: 'eleven_v3',
    providerOutputFormat: 'mp3_44100_128',
    enableProviderLogging: false,
    zeroRetentionEntitlementVerified: true,
    verifiedProviderCatalogVoice: true,
    accountFundedWithoutPurchase: true,
    modelAccessVerified: true,
    providerRateCardSnapshotId: input.providerRateCardSnapshotId,
    accountUsageBaselineEvidenceId: input.accountUsageBaselineEvidenceId,
    costReconciliationMethod: 'account_usage_delta_required',
    maximumAuthorizedProviderCostMicros: request.executionBoundary.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedLocalComputeCostMicros:
      request.executionBoundary.maximumAuthorizedLocalComputeCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      request.executionBoundary.maximumAuthorizedTotalInternalCostMicros,
    maximumProviderCalls: 1,
    automaticRetryAllowed: false,
    automaticFallbackAllowed: false,
    privateLocalReviewOnly: true,
    timelineMutationAllowed: false,
    finalSelectionAllowed: false,
    customerPricingIncluded: false,
    customerCreditsIncluded: false,
    issuedAt,
    expiresAt,
    immutable: true,
  }
  const authority = assertMotionStudioSpeechC2ExecutionAuthority({
    ...base,
    authorityDigest: sha256CanonicalJson(base),
  }, request, capability)
  const attemptKey = [authority.workspaceId, authority.jobId, authority.attemptId, authority.leaseId].join(':')
  pruneExpired(issuedAttemptKeys, Date.parse(authority.issuedAt))
  if (issuedAttemptKeys.has(attemptKey)) blocked('C2 speech authority already exists for this exact process-local attempt lease.')
  issuedAttemptKeys.set(attemptKey, Date.parse(authority.expiresAt))
  Object.freeze(authority.preflightGateEvidence)
  const frozenAuthority = Object.freeze(authority)
  issuedLiveExecutionAuthorities.set(frozenAuthority, frozenAuthority.authorityDigest)
  return frozenAuthority
}

export function assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  const issuedDigest = issuedLiveExecutionAuthorities.get(authority)
  if (!issuedDigest || issuedDigest !== authority.authorityDigest) {
    blocked('C2 speech live execution requires the exact frozen in-process authority instance.')
  }
  const { authorityDigest, ...base } = authority
  if (
    authorityDigest !== issuedDigest ||
    sha256CanonicalJson(base) !== issuedDigest ||
    !Object.isFrozen(authority) ||
    !Object.isFrozen(authority.preflightGateEvidence)
  ) blocked('C2 speech live execution authority changed after issuance.')
}

export function assertMotionStudioSpeechC2ExecutionAuthority(
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  request: MotionStudioSpeechSegmentRequestV1,
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1,
): MotionStudioSpeechC2ExecutionAuthorityV1 {
  const parsedRequest = motionStudioSpeechSegmentRequestV1Schema.parse(request)
  const capability = assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity(capabilitySnapshot)
  if (!authority || authority.schemaVersion !== 'motion-studio.speech-c2-execution-authority.v1') invalid('C2 speech authority schema is invalid.')
  for (const value of [
    authority.authorityId, authority.workspaceId, authority.projectId, authority.editSessionId,
    authority.productionId, authority.approvedSnapshotId, authority.approvedWorkItemId,
    authority.planReviewApprovalEvidenceId, authority.creditEstimateApprovalEvidenceId,
    authority.speechRequestId, authority.capabilitySnapshotId, authority.jobId, authority.attemptId,
    authority.leaseId, authority.costBudgetId, authority.voiceBindingId,
    authority.credentialReferenceId, authority.providerRateCardSnapshotId,
    authority.accountUsageBaselineEvidenceId,
  ]) if (!STABLE_ID.test(value)) invalid('C2 speech authority contains an invalid stable reference.')
  for (const value of [
    authority.approvedSnapshotDigest, authority.preflightDigest, authority.speechRequestDigest,
    authority.capabilitySnapshotDigest, authority.idempotencyKeyHash,
    authority.voiceIdentityHash, authority.credentialBindingDigest, authority.authorityDigest,
  ]) if (!SHA256.test(value)) invalid('C2 speech authority contains an invalid digest.')
  const { authorityDigest, ...digestAuthority } = authority
  if (sha256CanonicalJson(digestAuthority) !== authorityDigest) blocked('C2 speech authority failed its immutable digest.')
  if (Object.keys(authority.preflightGateEvidence).length !== MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES.length) {
    blocked('C2 speech authority does not carry every preflight evidence binding.')
  }
  for (const gate of MOTION_STUDIO_SPEECH_C2_PREFLIGHT_GATES) {
    if (!STABLE_ID.test(authority.preflightGateEvidence[gate])) {
      blocked(`C2 speech authority is missing stable evidence for ${gate}.`)
    }
  }
  const reconstructedPreflight = createMotionStudioSpeechC2PreflightReport(authority.preflightGateEvidence)
  if (reconstructedPreflight.preflightDigest !== authority.preflightDigest) {
    blocked('C2 speech authority preflight digest does not bind its exact evidence set.')
  }
  if (
    authority.workspaceId !== parsedRequest.workspaceId || authority.projectId !== parsedRequest.projectId ||
    authority.editSessionId !== parsedRequest.editSessionId || authority.productionId !== parsedRequest.productionId ||
    authority.approvedSnapshotId !== parsedRequest.approvedSnapshotId ||
    authority.approvedSnapshotDigest !== parsedRequest.approvedSnapshotDigest ||
    authority.approvedWorkItemId !== parsedRequest.approvedWorkItemId ||
    authority.speechRequestId !== parsedRequest.speechRequestId ||
    authority.speechRequestDigest !== sha256CanonicalJson(parsedRequest) ||
    authority.capabilitySnapshotId !== capability.capabilitySnapshotId ||
    authority.capabilitySnapshotDigest !== capability.evidenceDigest ||
    authority.jobId !== parsedRequest.jobId || authority.attemptId !== parsedRequest.attemptId ||
    authority.leaseId !== parsedRequest.leaseId || authority.costBudgetId !== parsedRequest.costBudgetId ||
    authority.idempotencyKeyHash !== parsedRequest.idempotencyKeyHash ||
    authority.voiceBindingId !== parsedRequest.voice.voiceBindingId ||
    authority.voiceIdentityHash !== parsedRequest.voice.voiceIdentityHash
  ) blocked('C2 speech authority does not bind the exact request and capability scope.')
  if (
    capability.workspaceId !== parsedRequest.workspaceId || capability.projectId !== parsedRequest.projectId ||
    capability.editSessionId !== parsedRequest.editSessionId || capability.productionId !== parsedRequest.productionId
  ) blocked('C2 speech capability evidence belongs to a different tenant or production scope.')
  const approvalEvidenceDigest = sha256CanonicalJson({
    approvedSnapshotId: authority.approvedSnapshotId,
    approvedSnapshotDigest: authority.approvedSnapshotDigest,
    planReviewApprovalEvidenceId: authority.planReviewApprovalEvidenceId,
    creditEstimateApprovalEvidenceId: authority.creditEstimateApprovalEvidenceId,
  })
  const voiceEvidenceDigest = sha256CanonicalJson({
    voiceBindingId: authority.voiceBindingId,
    voiceIdentityHash: authority.voiceIdentityHash,
    bindingEvidenceId: parsedRequest.voice.bindingEvidenceId,
    rightsEvidenceId: parsedRequest.voice.rightsEvidenceId,
    consentEvidenceId: parsedRequest.consent.evidenceId,
  })
  const rateEvidenceDigest = sha256CanonicalJson({
    providerRateCardSnapshotId: authority.providerRateCardSnapshotId,
    accountUsageBaselineEvidenceId: authority.accountUsageBaselineEvidenceId,
    maximumAuthorizedProviderCostMicros: authority.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedLocalComputeCostMicros: authority.maximumAuthorizedLocalComputeCostMicros,
    maximumAuthorizedTotalInternalCostMicros: authority.maximumAuthorizedTotalInternalCostMicros,
  })
  const attemptEvidenceDigest = sha256CanonicalJson({
    jobId: authority.jobId,
    attemptId: authority.attemptId,
    leaseId: authority.leaseId,
    costBudgetId: authority.costBudgetId,
    idempotencyKeyHash: authority.idempotencyKeyHash,
  })
  const reconciliationEvidenceDigest = sha256CanonicalJson({
    method: authority.costReconciliationMethod,
    accountUsageBaselineEvidenceId: authority.accountUsageBaselineEvidenceId,
  })
  if (
    authority.preflightGateEvidence.official_capability_current !== capability.evidenceDigest ||
    authority.preflightGateEvidence.approved_snapshot_and_estimate !== approvalEvidenceDigest ||
    authority.preflightGateEvidence.verified_catalog_voice !== voiceEvidenceDigest ||
    authority.preflightGateEvidence.server_credential_reference !== authority.credentialBindingDigest ||
    authority.preflightGateEvidence.exact_rate_card_and_cost_ceiling !== rateEvidenceDigest ||
    authority.preflightGateEvidence.single_attempt_job_lease !== attemptEvidenceDigest ||
    authority.preflightGateEvidence.usage_cost_reconciliation !== reconciliationEvidenceDigest
  ) blocked('C2 speech preflight evidence does not bind the exact capability, approval, voice, credential, lease, rate, and reconciliation authorities.')
  if (
    parsedRequest.executionBoundary.protocolSimulatorOnly ||
    parsedRequest.voice.catalogBindingStatus !== 'verified_provider_catalog' ||
    parsedRequest.consent.status !== 'provider_catalog_rights_verified' ||
    authority.modelId !== 'eleven_v3' || authority.providerOutputFormat !== 'mp3_44100_128' ||
    authority.enableProviderLogging !== false || authority.zeroRetentionEntitlementVerified !== true ||
    authority.verifiedProviderCatalogVoice !== true || authority.accountFundedWithoutPurchase !== true ||
    authority.modelAccessVerified !== true || authority.costReconciliationMethod !== 'account_usage_delta_required' ||
    authority.maximumProviderCalls !== 1 || authority.automaticRetryAllowed !== false ||
    authority.automaticFallbackAllowed !== false || authority.privateLocalReviewOnly !== true ||
    authority.timelineMutationAllowed !== false || authority.finalSelectionAllowed !== false ||
    authority.customerPricingIncluded !== false || authority.customerCreditsIncluded !== false ||
    authority.maximumAuthorizedProviderCostMicros !== parsedRequest.executionBoundary.maximumAuthorizedProviderCostMicros ||
    authority.maximumAuthorizedLocalComputeCostMicros !==
      parsedRequest.executionBoundary.maximumAuthorizedLocalComputeCostMicros ||
    authority.maximumAuthorizedTotalInternalCostMicros !==
      parsedRequest.executionBoundary.maximumAuthorizedTotalInternalCostMicros ||
    authority.immutable !== true
  ) blocked('C2 speech authority violates the one-take execution boundary.')
  if (
    !Number.isSafeInteger(authority.maximumAuthorizedProviderCostMicros) ||
    authority.maximumAuthorizedProviderCostMicros < 1 || authority.maximumAuthorizedProviderCostMicros > 250_000 ||
    !Number.isSafeInteger(authority.maximumAuthorizedLocalComputeCostMicros) ||
    authority.maximumAuthorizedLocalComputeCostMicros < 1 ||
    authority.maximumAuthorizedLocalComputeCostMicros > 250_000 ||
    !Number.isSafeInteger(authority.maximumAuthorizedTotalInternalCostMicros) ||
    authority.maximumAuthorizedTotalInternalCostMicros !==
      authority.maximumAuthorizedProviderCostMicros +
      authority.maximumAuthorizedLocalComputeCostMicros ||
    authority.maximumAuthorizedTotalInternalCostMicros > 250_000
  ) blocked('C2 speech authority exceeds or does not conserve the approved total internal-cost ceiling.')
  const issuedAt = Date.parse(authority.issuedAt)
  const expiresAt = Date.parse(authority.expiresAt)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt || expiresAt - issuedAt > 15 * 60_000) {
    blocked('C2 speech authority requires a valid maximum fifteen-minute execution window.')
  }
  return authority
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function exactIso(value: string, label: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) invalid(`${label} is invalid.`)
  return new Date(parsed).toISOString()
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) {
    if (expiresAt <= now) values.delete(key)
  }
}
