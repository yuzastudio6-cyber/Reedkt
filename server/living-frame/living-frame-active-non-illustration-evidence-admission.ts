import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_CLASS,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_VERSION,
  type LivingFrameActiveEvidenceDigestRef,
  type LivingFrameActiveEvidenceRepairLineage,
  type LivingFrameActiveNonIllustrationEvidenceAdmission,
  type LivingFrameActiveNonIllustrationEvidenceAdmissionCase,
  type LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft,
  type LivingFrameActiveNonIllustrationEvidenceAdmissionDraft,
} from '../../src/types/living-frame-active-non-illustration-evidence-admission'
import type {
  LivingFrameActiveNonIllustrationAggregate,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameActiveNonIllustrationAggregate,
  type CompileLivingFrameActiveNonIllustrationAggregateInput,
} from './living-frame-active-non-illustration-aggregate'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u

const AUTHORITY_BOUNDARY = Object.freeze({
  structuralValidationAuthority: true as const,
  canonicalConsumerAuthority: false as const,
  approvedSnapshotAuthority: false as const,
  workGraphAuthority: false as const,
  assetManifestAuthority: false as const,
  providerAuthority: false as const,
  audioAuthority: false as const,
  headQaAuthority: false as const,
  dispatchAuthority: false as const,
  runtimeAuthority: false as const,
  artifactAuthority: false as const,
  artifactQaAuthority: false as const,
  reconciliationAuthority: false as const,
  privateReviewAuthority: false as const,
  canonicalQaApprovalAuthority: false as const,
  costAuthority: false as const,
  billingAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
})

export interface CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput {
  readonly aggregateManifest:
    LivingFrameActiveNonIllustrationAggregate
  readonly aggregateManifestInput:
    CompileLivingFrameActiveNonIllustrationAggregateInput
  readonly cases:
    readonly LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft[]
}

export function compileLivingFrameActiveNonIllustrationEvidenceAdmission(
  input:
    CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput,
): LivingFrameActiveNonIllustrationEvidenceAdmission {
  assertInput(input)
  const cases = input.cases.map((candidate, order) =>
    compileCase(candidate, input.aggregateManifest, order))
  assertUnique(
    cases.map((entry) => entry.identity.sceneId),
    'Living Frame active evidence scene identities',
  )
  assertUnique(
    cases.map((entry) => entry.evidenceSetDigestSha256),
    'Living Frame active evidence sets',
  )
  assertUnique(
    cases.map((entry) => entry.caseAdmissionDigestSha256),
    'Living Frame active case admissions',
  )
  const draft:
    LivingFrameActiveNonIllustrationEvidenceAdmissionDraft = {
      contractVersion:
        LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_VERSION,
      admissionClass:
        LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_ADMISSION_CLASS,
      admissionState:
        'all_active_case_dependencies_structurally_bound_canonical_consumption_and_reread_pending',
      aggregateManifestVersion:
        input.aggregateManifest.contractVersion,
      aggregateManifestDigestSha256:
        input.aggregateManifest.aggregateDigestSha256,
      ownerScopeAmendmentVersion:
        input.aggregateManifest.ownerScopeAmendmentVersion,
      ownerScopeAmendmentDigestSha256:
        input.aggregateManifest.ownerScopeAmendmentDigestSha256,
      cases,
      activeCaseCount: 12,
      pausedScopeCount: 7,
      canonicalConsumptionPending: true,
      canonicalPrivateReviewSupplementalDependencyPending: true,
      directCanonicalPrivateReviewAdapterClaimed: false,
      historicalAggregateImported: false,
      callerAssertionsAcceptedAsEvidence: false,
      technicalMetricsOnlyAcceptanceAllowed: false,
      partialTimelineCoverageAllowed: false,
      partialAudioCoverageAllowed: false,
      repairedArtifactVersionReuseAllowed: false,
      pausedScopeEvidenceAllowed: false,
      authorityBoundary: AUTHORITY_BOUNDARY,
      containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      artifactCreated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameActiveNonIllustrationEvidenceAdmission(
  value: unknown,
  input:
    CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput,
): value is LivingFrameActiveNonIllustrationEvidenceAdmission {
  if (
    !isRecord(value)
    || !SHA256.test(String(value.admissionDigestSha256 ?? ''))
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameActiveNonIllustrationEvidenceAdmission(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'aggregateManifest',
      'aggregateManifestInput',
      'cases',
    ])
    || !verifyLivingFrameActiveNonIllustrationAggregate(
      input.aggregateManifest,
      input.aggregateManifestInput,
    )
    || input.aggregateManifest.activePrivateInternalReady
    || input.aggregateManifest.historicalAggregateImported
    || input.aggregateManifest
      .historicalCharacterOrRiggingEvidenceAccepted
    || input.aggregateManifest.pausedScopeCount !== 7
    || !Array.isArray(input.cases)
    || input.cases.length !== 12
  ) throw new Error('Invalid Living Frame active evidence admission input.')
}

function compileCase(
  candidate:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft,
  aggregate: LivingFrameActiveNonIllustrationAggregate,
  order: number,
): LivingFrameActiveNonIllustrationEvidenceAdmissionCase {
  const manifestCase = aggregate.cases[order]
  if (!manifestCase) {
    throw new Error('Living Frame active manifest case is missing.')
  }
  assertCase(candidate, manifestCase, order)
  const expectedManifestPacketDigestSha256 = sha256AuthorityValue({
    caseId: candidate.caseId,
    activeScope: candidate.activeScope,
    identity: candidate.identity,
    canonicalPlanBindings: candidate.canonicalPlanBindings,
  })
  if (
    manifestCase.evidencePacket.packetDigestSha256
      !== expectedManifestPacketDigestSha256
  ) {
    throw new Error(
      'Living Frame active evidence case does not match its predeclared manifest packet.',
    )
  }
  const evidenceSetDigestSha256 = sha256AuthorityValue({
    caseId: candidate.caseId,
    activeScope: candidate.activeScope,
    identity: candidate.identity,
    canonicalPlanBindings: candidate.canonicalPlanBindings,
    finalRemotionArtifact: candidate.finalRemotionArtifact,
    visualEvidence: candidate.visualEvidence,
    audioEvidence: candidate.audioEvidence,
    headQaEvidence: candidate.headQaEvidence,
    terminalEvidence: candidate.terminalEvidence,
  })
  assertRepairLineage(
    candidate.repairLineage,
    candidate.finalRemotionArtifact,
    evidenceSetDigestSha256,
  )
  const withoutDigest = {
    ...structuredClone(candidate),
    evidenceSetDigestSha256,
  }
  return deepFreeze({
    ...withoutDigest,
    caseAdmissionDigestSha256:
      sha256AuthorityValue(withoutDigest),
  })
}

function assertCase(
  candidate:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft,
  manifestCase:
    LivingFrameActiveNonIllustrationAggregate['cases'][number],
  order: number,
): void {
  if (
    !isRecord(candidate)
    || !hasExactKeys(candidate, [
      'caseId',
      'order',
      'activeScope',
      'manifestCaseDigestSha256',
      'identity',
      'canonicalPlanBindings',
      'finalRemotionArtifact',
      'visualEvidence',
      'audioEvidence',
      'headQaEvidence',
      'repairLineage',
      'terminalEvidence',
      'canonicalConsumptionPending',
      'structuralAdmissionCandidate',
      'canonicalAdmissionGranted',
      'pausedScopeEvidenceUsed',
      'historicalAggregateEvidenceUsed',
      'allEvidenceOpaqueUntilCanonicalReread',
    ])
    || candidate.caseId !== manifestCase.caseId
    || candidate.order !== order
    || candidate.activeScope !== manifestCase.activeScope
    || candidate.manifestCaseDigestSha256
      !== manifestCase.caseDigestSha256
    || !validIdentity(candidate.identity)
    || !validPlanBindings(
      candidate.canonicalPlanBindings,
      candidate.identity,
    )
    || !validFinalArtifact(
      candidate.finalRemotionArtifact,
      candidate.identity,
    )
    || !validVisualEvidence(candidate.visualEvidence)
    || !validAudioEvidence(candidate.audioEvidence)
    || !validHeadQaEvidence(candidate.headQaEvidence)
    || !validTerminalEvidence(candidate.terminalEvidence)
    || candidate.canonicalConsumptionPending !== true
    || candidate.structuralAdmissionCandidate !== true
    || candidate.canonicalAdmissionGranted !== false
    || candidate.pausedScopeEvidenceUsed !== false
    || candidate.historicalAggregateEvidenceUsed !== false
    || candidate.allEvidenceOpaqueUntilCanonicalReread !== true
  ) throw new Error('Invalid Living Frame active evidence case.')
}

function validIdentity(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['identity'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'approvedSnapshotId',
      'executionPackageId',
      'sceneId',
      'approvedWorkItemId',
      'outputKey',
      'expectedAssetId',
    ])
    && Object.values(value).every(
      (entry) => typeof entry === 'string' && SAFE_ID.test(entry),
    )
}

function validPlanBindings(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['canonicalPlanBindings'],
  identity:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['identity'],
): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'approvedSnapshot',
      'executionPackage',
      'selectedScene',
      'masterTiming',
      'confirmedOutputFrame',
      'approvedWorkItem',
      'approvedOutput',
      'assetManifest',
      'assetManifestEntry',
      'rendererBinding',
    ])
    || !Object.values(value).every(validDigestRef)
  ) return false
  return value.approvedSnapshot.refVersion
      === 'private-edit-authority-approved-snapshot-v3'
    && value.executionPackage.refVersion
      === 'canonical-approved-edit-execution-package-v5'
    && value.approvedSnapshot.refId === identity.approvedSnapshotId
    && value.executionPackage.refId === identity.executionPackageId
    && value.selectedScene.refId === identity.sceneId
    && value.approvedWorkItem.refId === identity.approvedWorkItemId
    && value.approvedOutput.refId === identity.outputKey
    && value.assetManifestEntry.refId === identity.expectedAssetId
}

function validFinalArtifact(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['finalRemotionArtifact'],
  identity:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['identity'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'artifactId',
      'artifactVersion',
      'approvedWorkItemId',
      'outputKey',
      'expectedAssetId',
      'privateObjectIdentityHash',
      'sha256',
      'contentType',
      'privateArtifact',
      'finalCanvasOwnedByRemotion',
    ])
    && SAFE_ID.test(value.artifactId)
    && Number.isInteger(value.artifactVersion)
    && value.artifactVersion >= 1
    && value.artifactVersion <= 10_000
    && value.approvedWorkItemId === identity.approvedWorkItemId
    && value.outputKey === identity.outputKey
    && value.expectedAssetId === identity.expectedAssetId
    && SHA256.test(value.privateObjectIdentityHash)
    && SHA256.test(value.sha256)
    && value.contentType === 'video/mp4'
    && value.privateArtifact === true
    && value.finalCanvasOwnedByRemotion === true
}

function validVisualEvidence(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['visualEvidence'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'postrenderRequest',
      'qwenProviderLifecycle',
      'postrenderResult',
      'completeTimeCoverage',
      'orderedProfessionalCheckCount',
      'completeTimelineCovered',
      'deterministicCoverageIntegrityPassed',
      'qwenProducesVisualEvidenceOnly',
      'callerInspectionAssertionUsed',
      'technicalMetricsOnlyAcceptanceUsed',
      'canonicalQwenLifecycleRereadPending',
    ])
    && validDigestRef(value.postrenderRequest)
    && validDigestRef(value.qwenProviderLifecycle)
    && validDigestRef(value.postrenderResult)
    && validDigestRef(value.completeTimeCoverage)
    && value.orderedProfessionalCheckCount === 13
    && value.completeTimelineCovered === true
    && value.deterministicCoverageIntegrityPassed === true
    && value.qwenProducesVisualEvidenceOnly === true
    && value.callerInspectionAssertionUsed === false
    && value.technicalMetricsOnlyAcceptanceUsed === false
    && value.canonicalQwenLifecycleRereadPending === true
}

function validAudioEvidence(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['audioEvidence'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'verifiedAudioEvidence',
      'fullDurationCovered',
      'narrationProtectionVerified',
      'speechSfxMusicAndDuckingEvidenceIncluded',
      'evidenceProducedSeparatelyFromQwen',
      'callerAudioAssertionUsed',
    ])
    && validDigestRef(value.verifiedAudioEvidence)
    && value.fullDurationCovered === true
    && value.narrationProtectionVerified === true
    && value.speechSfxMusicAndDuckingEvidenceIncluded === true
    && value.evidenceProducedSeparatelyFromQwen === true
    && value.callerAudioAssertionUsed === false
}

function validHeadQaEvidence(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['headQaEvidence'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'recommendation',
      'primaryModelRoleId',
      'fallbackModelRoleId',
      'fallbackUsed',
      'fallbackUsedOnlyAfterAllowedClassifiedPrimaryFailure',
      'recommendationDisposition',
      'verifiedVisualDeterministicAndAudioEvidenceRequired',
      'canonicalApprovalClaimed',
      'userPrivateReviewReplaced',
    ])
    && validDigestRef(value.recommendation)
    && value.primaryModelRoleId === 'kimi_k3_main_edit_agent'
    && value.fallbackModelRoleId
      === 'gpt_5_6_terra_fallback_edit_agent'
    && typeof value.fallbackUsed === 'boolean'
    && value.fallbackUsedOnlyAfterAllowedClassifiedPrimaryFailure === true
    && value.recommendationDisposition === 'accept'
    && value.verifiedVisualDeterministicAndAudioEvidenceRequired === true
    && value.canonicalApprovalClaimed === false
    && value.userPrivateReviewReplaced === false
}

function validTerminalEvidence(
  value:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['terminalEvidence'],
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'deterministicFinalQa',
      'artifactReconciliation',
      'canonicalPrivateReviewAssembly',
      'deterministicFinalQaPassedClaimRequiresCanonicalReread',
      'artifactReconciliationPassedClaimRequiresCanonicalReread',
      'privateReviewPassedClaimRequiresCanonicalReread',
    ])
    && validDigestRef(value.deterministicFinalQa)
    && validDigestRef(value.artifactReconciliation)
    && validDigestRef(value.canonicalPrivateReviewAssembly)
    && value.canonicalPrivateReviewAssembly.refVersion
      === 'canonical-private-review-manifest-v1'
    && value.deterministicFinalQaPassedClaimRequiresCanonicalReread === true
    && value.artifactReconciliationPassedClaimRequiresCanonicalReread === true
    && value.privateReviewPassedClaimRequiresCanonicalReread === true
}

function assertRepairLineage(
  value: LivingFrameActiveEvidenceRepairLineage,
  artifact:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft['finalRemotionArtifact'],
  currentEvidenceSetDigestSha256: string,
): void {
  if (!isRecord(value)) {
    throw new Error('Invalid Living Frame repair lineage.')
  }
  if (value.repairState === 'not_required') {
    if (
      !hasExactKeys(value, [
        'repairState',
        'priorArtifact',
        'priorEvidenceSetDigestSha256',
        'rerunEvidenceSetDigestSha256',
      ])
      || value.priorArtifact !== null
      || value.priorEvidenceSetDigestSha256 !== null
      || value.rerunEvidenceSetDigestSha256 !== null
    ) throw new Error('Invalid unrepaired Living Frame evidence lineage.')
    return
  }
  if (
    value.repairState !== 'repaired_n_plus_one'
    || !hasExactKeys(value, [
      'repairState',
      'priorArtifact',
      'priorEvidenceSetDigestSha256',
      'rerunEvidenceSetDigestSha256',
    ])
    || !isRecord(value.priorArtifact)
    || !hasExactKeys(value.priorArtifact, [
      'artifactId',
      'artifactVersion',
      'sha256',
    ])
    || !SAFE_ID.test(value.priorArtifact.artifactId)
    || !Number.isInteger(value.priorArtifact.artifactVersion)
    || value.priorArtifact.artifactVersion < 1
    || !SHA256.test(value.priorArtifact.sha256)
    || artifact.artifactId === value.priorArtifact.artifactId
    || artifact.sha256 === value.priorArtifact.sha256
    || artifact.artifactVersion !== value.priorArtifact.artifactVersion + 1
    || !SHA256.test(value.priorEvidenceSetDigestSha256)
    || value.rerunEvidenceSetDigestSha256
      !== currentEvidenceSetDigestSha256
    || value.priorEvidenceSetDigestSha256
      === value.rerunEvidenceSetDigestSha256
  ) throw new Error('Invalid N+1 Living Frame repair lineage.')
}

function validDigestRef(
  value: unknown,
): value is LivingFrameActiveEvidenceDigestRef {
  return isRecord(value)
    && hasExactKeys(value, [
      'refId',
      'refVersion',
      'digestSha256',
      'canonicalRereadRequired',
    ])
    && SAFE_ID.test(value.refId)
    && SAFE_VERSION.test(value.refVersion)
    && SHA256.test(value.digestSha256)
    && value.canonicalRereadRequired === true
}

function assertUnique(
  values: readonly string[],
  label: string,
): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique.`)
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value).sort()
  const sortedExpectedKeys = [...expectedKeys].sort()
  return actualKeys.length === sortedExpectedKeys.length
    && actualKeys.every(
      (key, order) => key === sortedExpectedKeys[order],
    )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const child of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(child)
  return value
}
