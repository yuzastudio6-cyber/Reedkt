import { createHash } from 'node:crypto'

import { motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import type { MotionStudioSpeechSegmentRequestV1 } from '../../../src/types/motion-studio'
import { sha256CanonicalJson } from '../../motion-studio/commands/canonical-json'
import {
  createMotionStudioOfficialSpeechCapabilitySnapshot,
  createMotionStudioSpeechC2ExecutionAuthority,
  createMotionStudioSpeechC2PreflightReport,
  createMotionStudioSpeechProtocolFixture,
  createMotionStudioSpeechSecretBinding,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
  type MotionStudioSpeechC2PreflightGate,
  type MotionStudioSpeechC2PreflightReport,
} from '../../motion-studio/speech-production'

export function createMotionStudioSpeechLiveFixture(
  label: string,
  providerVoiceId: string,
  options: {
    providerRateCardSnapshotId?: string
    accountUsageBaselineEvidenceId?: string
    approvedWorkItemId?: string
    jobId?: string
    idempotencyKeyHash?: string
  } = {},
): {
  request: MotionStudioSpeechSegmentRequestV1
  capability: ReturnType<typeof createMotionStudioOfficialSpeechCapabilitySnapshot>
  preflight: MotionStudioSpeechC2PreflightReport
  authority: MotionStudioSpeechC2ExecutionAuthorityV1
  secretBinding: ReturnType<typeof createMotionStudioSpeechSecretBinding>
} {
  const digestSeed = sha256CanonicalJson({ label })
  const fixture = createMotionStudioSpeechProtocolFixture({
    workspaceId: '11111111-1111-4111-8111-111111111111',
    projectId: '22222222-2222-4222-8222-222222222222',
    editSessionId: `edit-speech-live-${label}`,
    productionId: '33333333-3333-4333-8333-333333333333',
    approvedSnapshotId: uuid(digestSeed, 'approved-snapshot'),
    approvedSnapshotDigest: digestSeed,
    preparedScriptArtifactVersion: {
      artifactId: uuid(digestSeed, 'script-artifact'),
      versionId: uuid(digestSeed, 'script-version'),
      versionNumber: 1,
      contentDigest: sha256CanonicalJson({ label, content: 'script' }),
    },
    voiceBibleArtifactVersion: {
      artifactId: uuid(digestSeed, 'voice-artifact'),
      versionId: uuid(digestSeed, 'voice-version'),
      versionNumber: 1,
      contentDigest: sha256CanonicalJson({ label, content: 'voice' }),
    },
    voiceBibleContentDigest: sha256CanonicalJson({ label, content: 'voice-bible' }),
    voiceSegmentId: `voice-segment-${label}`,
    preparedScriptSegmentId: `script-segment-${label}`,
    chapterId: 'chapter-001',
    sceneId: 'scene-001',
    timingAuthorityDigest: sha256CanonicalJson({ label, timing: true }),
    startTimingAnchorId: 'anchor-start-001',
    endTimingAnchorId: 'anchor-end-001',
    startFrame: 0,
    endFrame: 120,
    createdAt: '2026-07-17T20:00:00.000Z',
  })
  const capability = createMotionStudioOfficialSpeechCapabilitySnapshot({
    workspaceId: fixture.request.workspaceId,
    projectId: fixture.request.projectId,
    editSessionId: fixture.request.editSessionId,
    productionId: fixture.request.productionId,
    capabilitySnapshotId: uuid(digestSeed, 'official-capability'),
    capturedAt: '2026-07-17T20:00:00.000Z',
    expiresAt: '2026-08-16T20:00:00.000Z',
  })
  const request = motionStudioSpeechSegmentRequestV1Schema.parse({
    ...fixture.request,
    approvedWorkItemId:
      options.approvedWorkItemId ?? fixture.request.approvedWorkItemId,
    jobId: options.jobId ?? fixture.request.jobId,
    idempotencyKeyHash:
      options.idempotencyKeyHash ?? fixture.request.idempotencyKeyHash,
    spokenText: fixture.request.displayText,
    pronunciationEntries: [],
    performance: { ...fixture.request.performance, performanceTagIds: [] },
    audioTagInstructions: [],
    voice: {
      ...fixture.request.voice,
      voiceIdentityHash: sha256Text(providerVoiceId),
      voiceProfileReference: `provider-catalog/${label}`,
      catalogBindingStatus: 'verified_provider_catalog',
      verifiedProviderCatalogVoice: true,
      catalogVerifiedAt: '2026-07-17T20:30:00.000Z',
    },
    modelSelection: {
      setting: 'explicit',
      intendedRole: 'final_expressive',
      requestedModelId: 'eleven_v3',
      fallbackAllowed: false,
      automaticFallback: false,
    },
    capabilitySnapshotId: capability.capabilitySnapshotId,
    capabilitySnapshotDigest: capability.evidenceDigest,
    consent: {
      status: 'provider_catalog_rights_verified',
      evidenceId: uuid(digestSeed, 'catalog-rights'),
      cloningAuthorized: false,
      dubbingAuthorized: false,
    },
    executionBoundary: {
      protocolSimulatorOnly: false,
      externalTransportAllowed: true,
      providerExecutionAllowed: true,
      providerCallMaximum: 1,
      maximumAuthorizedProviderCostMicros: 225_000,
      maximumAuthorizedLocalComputeCostMicros: 25_000,
      maximumAuthorizedTotalInternalCostMicros: 250_000,
      timelineMutationAllowed: false,
      finalSelectionAllowed: false,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
    },
  })
  const gateEvidence = Object.fromEntries(([
    'official_capability_current', 'approved_snapshot_and_estimate', 'verified_catalog_voice',
    'server_credential_reference', 'existing_funds_and_model_access', 'zero_retention_entitlement',
    'exact_rate_card_and_cost_ceiling', 'single_attempt_job_lease',
    'private_ingest_and_normalization', 'usage_cost_reconciliation',
  ] as MotionStudioSpeechC2PreflightGate[]).map((gate) => [gate, `evidence-${label}-${gate}`])) as
    Record<MotionStudioSpeechC2PreflightGate, string>
  const planReviewApprovalEvidenceId = `plan-review-approval-${label}`
  const creditEstimateApprovalEvidenceId = `credit-estimate-approval-${label}`
  const credentialReferenceId = `credential-elevenlabs-${label}`
  const secretBinding = createMotionStudioSpeechSecretBinding({
    credentialReferenceId,
    secretLocatorId: 'reeditpro-prod-elevenlabs-api-key',
    secretVersionReference: '1',
  })
  const providerRateCardSnapshotId = options.providerRateCardSnapshotId ?? `rate-card-elevenlabs-${label}`
  const accountUsageBaselineEvidenceId = options.accountUsageBaselineEvidenceId ??
    `usage-baseline-elevenlabs-${label}`
  gateEvidence.official_capability_current = capability.evidenceDigest
  gateEvidence.approved_snapshot_and_estimate = sha256CanonicalJson({
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotDigest: request.approvedSnapshotDigest,
    planReviewApprovalEvidenceId,
    creditEstimateApprovalEvidenceId,
  })
  gateEvidence.verified_catalog_voice = sha256CanonicalJson({
    voiceBindingId: request.voice.voiceBindingId,
    voiceIdentityHash: request.voice.voiceIdentityHash,
    bindingEvidenceId: request.voice.bindingEvidenceId,
    rightsEvidenceId: request.voice.rightsEvidenceId,
    consentEvidenceId: request.consent.evidenceId,
  })
  gateEvidence.server_credential_reference = secretBinding.bindingDigest
  gateEvidence.exact_rate_card_and_cost_ceiling = sha256CanonicalJson({
    providerRateCardSnapshotId,
    accountUsageBaselineEvidenceId,
    maximumAuthorizedProviderCostMicros: request.executionBoundary.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedLocalComputeCostMicros:
      request.executionBoundary.maximumAuthorizedLocalComputeCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      request.executionBoundary.maximumAuthorizedTotalInternalCostMicros,
  })
  gateEvidence.single_attempt_job_lease = sha256CanonicalJson({
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    idempotencyKeyHash: request.idempotencyKeyHash,
  })
  gateEvidence.usage_cost_reconciliation = sha256CanonicalJson({
    method: 'account_usage_delta_required',
    accountUsageBaselineEvidenceId,
  })
  const preflight = createMotionStudioSpeechC2PreflightReport(gateEvidence)
  const authority = createMotionStudioSpeechC2ExecutionAuthority({
    request,
    capabilitySnapshot: capability,
    preflightReport: preflight,
    authorityId: `authority-${label}`,
    planReviewApprovalEvidenceId,
    creditEstimateApprovalEvidenceId,
    credentialReferenceId,
    credentialBindingDigest: secretBinding.bindingDigest,
    providerRateCardSnapshotId,
    accountUsageBaselineEvidenceId,
    issuedAt: '2026-07-17T21:05:00.000Z',
    expiresAt: '2026-07-17T21:15:00.000Z',
  })
  return { request, capability, preflight, authority, secretBinding }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function uuid(seed: string, label: string): string {
  const hex = sha256CanonicalJson({ seed, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
