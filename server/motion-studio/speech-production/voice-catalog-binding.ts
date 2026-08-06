import type {
  MotionStudioSpeechVoiceBindingV1,
  MotionStudioVersionReference,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass,
  type MotionStudioSpeechPremadeVoiceCandidateV1,
  type MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1,
} from './voice-catalog-discovery'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const VOICE_ID = /^[A-Za-z0-9_-]{6,128}$/
const issuedSelections = new WeakMap<object, string>()
const issuedBindingResults = new WeakMap<object, string>()

export interface MotionStudioSpeechVoiceCatalogSelectionV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-selection.v1'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  selectionId: string
  selectionDecisionId: string
  selectedByActorId: string
  selectionMode: 'explicit_user_selection'
  approvalRecordId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBindingId: string
  provider: 'elevenlabs'
  providerVoiceId: string
  voiceIdentityHash: string
  candidateEvidenceDigest: string
  catalogEvidenceDigest: string
  credentialBindingDigest: string
  catalogEvidenceClass: 'private_local_fixture' | 'authenticated_provider_read_only'
  selectionStatus: 'fixture_selected_not_provider_verified' | 'explicit_provider_catalog_selection'
  verifiedProviderCatalogVoice: boolean
  accountPreflightEligible: boolean
  voiceProfileReference: string
  rightsEvidenceId: string
  retentionPolicyId: string
  zeroRetentionEntitlementVerified: false
  automaticSelectionPerformed: false
  voiceBindingCreated: true
  providerGenerationAllowed: false
  timelineMutationAllowed: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  selectedAt: string
  selectionDigest: string
  immutable: true
}

export interface MotionStudioSpeechVoiceCatalogBindingResultV1 {
  schemaVersion: 'motion-studio.speech-voice-catalog-binding-result.v1'
  selection: MotionStudioSpeechVoiceCatalogSelectionV1
  voiceBinding: MotionStudioSpeechVoiceBindingV1
  providerVoiceId: string
  voiceIdentityHash: string
  accountPreflightEligible: boolean
  providerGenerationAllowed: false
  zeroRetentionEntitlementVerified: false
  resultDigest: string
  immutable: true
}

export function createMotionStudioSpeechVoiceCatalogSelection(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  selectionId: string
  selectionDecisionId: string
  selectedByActorId: string
  selectionMode: 'explicit_user_selection'
  approvalRecordId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBindingId: string
  providerVoiceId: string
  expectedVoiceIdentityHash: string
  expectedCandidateEvidenceDigest: string
  catalogEvidence: MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1
  voiceProfileReference: string
  rightsEvidenceId: string
  retentionPolicyId: string
  selectedAt: string
}): MotionStudioSpeechVoiceCatalogSelectionV1 {
  for (const [label, value] of Object.entries({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    selectionId: input.selectionId,
    selectionDecisionId: input.selectionDecisionId,
    selectedByActorId: input.selectedByActorId,
    approvalRecordId: input.approvalRecordId,
    approvedSnapshotId: input.approvedSnapshotId,
    voiceBindingId: input.voiceBindingId,
    rightsEvidenceId: input.rightsEvidenceId,
    retentionPolicyId: input.retentionPolicyId,
  })) assertStableId(value, label)
  if (input.selectionMode !== 'explicit_user_selection') {
    blocked('Speech voice selection must be an explicit user selection.')
  }
  if (!SHA256.test(input.approvedSnapshotDigest)) {
    invalid('Speech voice selection approved-snapshot digest is malformed.')
  }
  const voiceBibleArtifactVersion = freezeVersionReference(input.voiceBibleArtifactVersion)
  const selectedAt = exactIso(input.selectedAt, 'voice selection time')
  const voiceProfileReference = safeText(input.voiceProfileReference, 'voice profile reference', 240)
  if (!VOICE_ID.test(input.providerVoiceId)) invalid('Speech selected provider voice ID is malformed.')
  if (!SHA256.test(input.expectedVoiceIdentityHash) || !SHA256.test(input.expectedCandidateEvidenceDigest)) {
    invalid('Speech selected voice evidence digest is malformed.')
  }

  const evidenceClass = getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass(input.catalogEvidence)
  const candidate = exactCandidate(input.catalogEvidence, input.providerVoiceId)
  assertCandidateExpectation(candidate, input.expectedVoiceIdentityHash, input.expectedCandidateEvidenceDigest)
  const verifiedProviderCatalogVoice = evidenceClass === 'authenticated_provider_read_only'
  const base = {
    schemaVersion: 'motion-studio.speech-voice-catalog-selection.v1' as const,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    selectionId: input.selectionId,
    selectionDecisionId: input.selectionDecisionId,
    selectedByActorId: input.selectedByActorId,
    selectionMode: 'explicit_user_selection' as const,
    approvalRecordId: input.approvalRecordId,
    approvedSnapshotId: input.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedSnapshotDigest,
    voiceBibleArtifactVersion,
    voiceBindingId: input.voiceBindingId,
    provider: 'elevenlabs' as const,
    providerVoiceId: candidate.providerVoiceId,
    voiceIdentityHash: candidate.voiceIdentityHash,
    candidateEvidenceDigest: candidate.candidateEvidenceDigest,
    catalogEvidenceDigest: input.catalogEvidence.evidenceDigest,
    credentialBindingDigest: input.catalogEvidence.credentialBindingDigest,
    catalogEvidenceClass: evidenceClass,
    selectionStatus: verifiedProviderCatalogVoice
      ? 'explicit_provider_catalog_selection' as const
      : 'fixture_selected_not_provider_verified' as const,
    verifiedProviderCatalogVoice,
    accountPreflightEligible: verifiedProviderCatalogVoice,
    voiceProfileReference,
    rightsEvidenceId: input.rightsEvidenceId,
    retentionPolicyId: input.retentionPolicyId,
    zeroRetentionEntitlementVerified: false as const,
    automaticSelectionPerformed: false as const,
    voiceBindingCreated: true as const,
    providerGenerationAllowed: false as const,
    timelineMutationAllowed: false as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    selectedAt,
    immutable: true as const,
  }
  const selection = Object.freeze({ ...base, selectionDigest: sha256CanonicalJson(base) })
  issuedSelections.set(selection, selection.selectionDigest)
  return selection
}

export function createMotionStudioSpeechVoiceBindingFromCatalogSelection(input: {
  selection: MotionStudioSpeechVoiceCatalogSelectionV1
  catalogEvidence: MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1
}): MotionStudioSpeechVoiceCatalogBindingResultV1 {
  assertSelection(input.selection)
  const evidenceClass = getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass(input.catalogEvidence)
  if (
    input.selection.catalogEvidenceDigest !== input.catalogEvidence.evidenceDigest ||
    input.selection.catalogEvidenceClass !== evidenceClass
  ) blocked('Speech voice selection does not match the exact catalog evidence.')
  const candidate = exactCandidate(input.catalogEvidence, input.selection.providerVoiceId)
  assertCandidateExpectation(
    candidate,
    input.selection.voiceIdentityHash,
    input.selection.candidateEvidenceDigest,
  )
  const verified = evidenceClass === 'authenticated_provider_read_only'
  if (
    input.selection.verifiedProviderCatalogVoice !== verified ||
    input.selection.accountPreflightEligible !== verified ||
    input.selection.selectionStatus !== (
      verified ? 'explicit_provider_catalog_selection' : 'fixture_selected_not_provider_verified'
    )
  ) blocked('Speech voice selection provider-evidence classification is inconsistent.')

  const voiceBinding: MotionStudioSpeechVoiceBindingV1 = Object.freeze({
    voiceBindingId: input.selection.voiceBindingId,
    provider: 'elevenlabs' as const,
    voiceIdentityHash: input.selection.voiceIdentityHash,
    bindingEvidenceId: input.selection.selectionDecisionId,
    voiceProfileReference: input.selection.voiceProfileReference,
    customVoice: false as const,
    voiceSampleAccepted: false as const,
    cloningAuthorized: false as const,
    dubbingAuthorized: false as const,
    rightsEvidenceId: input.selection.rightsEvidenceId,
    retentionPolicyId: input.selection.retentionPolicyId,
    ...(verified
      ? {
          catalogBindingStatus: 'verified_provider_catalog' as const,
          verifiedProviderCatalogVoice: true as const,
          catalogVerifiedAt: input.catalogEvidence.capturedAt,
        }
      : {
          catalogBindingStatus: 'protocol_fixture_only' as const,
          verifiedProviderCatalogVoice: false as const,
        }),
  })
  const base = {
    schemaVersion: 'motion-studio.speech-voice-catalog-binding-result.v1' as const,
    selection: input.selection,
    voiceBinding,
    providerVoiceId: input.selection.providerVoiceId,
    voiceIdentityHash: input.selection.voiceIdentityHash,
    accountPreflightEligible: verified,
    providerGenerationAllowed: false as const,
    zeroRetentionEntitlementVerified: false as const,
    immutable: true as const,
  }
  const result = Object.freeze({ ...base, resultDigest: sha256CanonicalJson(base) })
  issuedBindingResults.set(result, result.resultDigest)
  return result
}

export function assertMotionStudioSpeechVoiceCatalogBindingResult(
  result: MotionStudioSpeechVoiceCatalogBindingResultV1,
): void {
  if (issuedBindingResults.get(result) !== result.resultDigest) {
    blocked('Speech account preflight requires the exact in-process catalog binding result.')
  }
  const { resultDigest, ...base } = result
  if (!SHA256.test(resultDigest) || sha256CanonicalJson(base) !== resultDigest) {
    blocked('Speech catalog binding result failed its immutable digest.')
  }
  assertSelection(result.selection)
  if (
    result.providerVoiceId !== result.selection.providerVoiceId ||
    result.voiceIdentityHash !== result.selection.voiceIdentityHash ||
    result.accountPreflightEligible !== result.selection.accountPreflightEligible ||
    result.providerGenerationAllowed !== false ||
    result.zeroRetentionEntitlementVerified !== false ||
    result.immutable !== true
  ) blocked('Speech catalog binding result is inconsistent with its exact selection.')
}

function assertSelection(selection: MotionStudioSpeechVoiceCatalogSelectionV1): void {
  if (issuedSelections.get(selection) !== selection.selectionDigest) {
    blocked('Speech voice binding requires the exact in-process selection record.')
  }
  const { selectionDigest, ...base } = selection
  if (!SHA256.test(selectionDigest) || sha256CanonicalJson(base) !== selectionDigest) {
    blocked('Speech voice selection failed its immutable digest.')
  }
  if (
    selection.selectionMode !== 'explicit_user_selection' ||
    selection.automaticSelectionPerformed !== false ||
    selection.voiceBindingCreated !== true ||
    selection.providerGenerationAllowed !== false ||
    selection.timelineMutationAllowed !== false ||
    selection.customerPricingIncluded !== false ||
    selection.customerCreditsIncluded !== false ||
    selection.zeroRetentionEntitlementVerified !== false ||
    selection.immutable !== true
  ) blocked('Speech voice selection violates its explicit no-execution boundary.')
}

function exactCandidate(
  evidence: MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1,
  providerVoiceId: string,
): MotionStudioSpeechPremadeVoiceCandidateV1 {
  const matches = evidence.candidates.filter((candidate) => candidate.providerVoiceId === providerVoiceId)
  if (matches.length !== 1) blocked('Speech selected voice is not one exact catalog candidate.')
  return matches[0]!
}

function assertCandidateExpectation(
  candidate: MotionStudioSpeechPremadeVoiceCandidateV1,
  expectedVoiceIdentityHash: string,
  expectedCandidateEvidenceDigest: string,
): void {
  if (
    candidate.category !== 'premade' ||
    candidate.voiceIdentityHash !== expectedVoiceIdentityHash ||
    candidate.candidateEvidenceDigest !== expectedCandidateEvidenceDigest
  ) blocked('Speech selected voice does not match the reviewed catalog candidate evidence.')
}

function freezeVersionReference(value: MotionStudioVersionReference): MotionStudioVersionReference {
  assertStableId(value.artifactId, 'Voice Bible artifact ID')
  assertStableId(value.versionId, 'Voice Bible version ID')
  if (!Number.isSafeInteger(value.versionNumber) || value.versionNumber < 1) {
    invalid('Speech Voice Bible version number must be a positive safe integer.')
  }
  if (!SHA256.test(value.contentDigest)) invalid('Speech Voice Bible content digest is malformed.')
  return Object.freeze({ ...value })
}

function assertStableId(value: string, label: string): void {
  if (!STABLE_ID.test(value)) invalid(`Speech ${label} is malformed.`)
}

function safeText(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim()
  if (!normalized || normalized.length > maximumLength || normalized.includes('\0')) {
    invalid(`Speech ${label} is malformed.`)
  }
  return normalized
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    invalid(`Speech ${label} is invalid.`)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
