import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlCanonicalArtifactBinding,
  LivingFrameControlledSdxlCanonicalArtifactBindingAuthority,
  LivingFrameControlledSdxlCanonicalArtifactBindingDraft,
  LivingFrameControlledSdxlCanonicalArtifactBindingEntry,
  LivingFrameControlledSdxlCanonicalArtifactBindingIssue,
  LivingFrameControlledSdxlCanonicalArtifactBindingIssueCode,
} from '../../src/types/living-frame-controlled-sdxl-canonical-artifact-binding'
import {
  LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-canonical-artifact-binding'
import type {
  LivingFrameControlledSdxlArtifactCandidate,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import type {
  LivingFrameControlledSdxlBaseByteObservation,
} from '../../src/types/living-frame-controlled-sdxl-base-byte-observation'
import {
  verifyCanonicalModelArtifact,
} from '../model-artifacts/canonical-model-artifact-repository'
import type {
  BindLivingFrameComfyUiCanonicalModelArtifactsInput,
  LivingFrameComfyUiCanonicalModelArtifactBinding,
  LivingFrameComfyUiCanonicalModelArtifactBindingEntry,
} from './living-frame-comfyui-canonical-model-artifact-binding'
import {
  verifyLivingFrameComfyUiCanonicalModelArtifactBinding,
} from './living-frame-comfyui-canonical-model-artifact-binding'
import type {
  VerifyLivingFrameControlledSdxlBaseByteObservationInput,
} from './living-frame-controlled-sdxl-base-byte-observation'
import {
  verifyLivingFrameControlledSdxlBaseByteObservation,
} from './living-frame-controlled-sdxl-base-byte-observation'

export interface BindLivingFrameControlledSdxlCanonicalArtifactsInput {
  readonly bindingId: string
  readonly completedBaseObservation:
    LivingFrameControlledSdxlBaseByteObservation
  readonly completedBaseObservationVerificationInput:
    VerifyLivingFrameControlledSdxlBaseByteObservationInput
  readonly canonicalArtifactBinding:
    LivingFrameComfyUiCanonicalModelArtifactBinding
  readonly canonicalArtifactBindingInput:
    BindLivingFrameComfyUiCanonicalModelArtifactsInput
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const EXACT_ARTIFACT_COUNT = 5
const EXACT_TOTAL_BYTE_LENGTH = 11_700_367_157

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlCanonicalArtifactBindingAuthority =
  Object.freeze({
    completedByteObservationChainConsumed: true,
    canonicalRepositoryVerificationConsumed: true,
    serverOwnedLocatorBindingConsumed: true,
    exactCandidateIdentityComparisonAuthority: true,
    artifactRepositoryMutationAuthority: false,
    artifactIngestAuthority: false,
    artifactMountAuthority: false,
    artifactCompatibilityAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    modelWeightAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    semanticRouteAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export class LivingFrameControlledSdxlCanonicalArtifactBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlCanonicalArtifactBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlCanonicalArtifactBindingIssue[],
  ) {
    super(
      'Living Frame controlled SDXL canonical artifact binding failed.',
    )
    this.name =
      'LivingFrameControlledSdxlCanonicalArtifactBindingError'
    this.issues = issues
  }
}

export async function bindLivingFrameControlledSdxlCanonicalArtifacts(
  input: BindLivingFrameControlledSdxlCanonicalArtifactsInput,
): Promise<LivingFrameControlledSdxlCanonicalArtifactBinding> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlBaseByteObservation(
      input.completedBaseObservation,
      input.completedBaseObservationVerificationInput,
    )
  ) {
    throw invalid(
      'completed_byte_observation_invalid',
      '$.completedBaseObservation',
    )
  }
  if (
    !await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      input.canonicalArtifactBinding,
      input.canonicalArtifactBindingInput,
    )
  ) {
    throw invalid(
      'canonical_artifact_binding_invalid',
      '$.canonicalArtifactBinding',
    )
  }

  const candidateSet =
    input.completedBaseObservationVerificationInput.candidateSet
  const canonicalBinding = input.canonicalArtifactBinding
  assertParentLineage(input, candidateSet.candidateSetDigestSha256)
  if (
    candidateSet.artifacts.length !== EXACT_ARTIFACT_COUNT
    || canonicalBinding.entries.length !== EXACT_ARTIFACT_COUNT
  ) throw invalid('artifact_count_mismatch', '$.entries')

  const entries:
    LivingFrameControlledSdxlCanonicalArtifactBindingEntry[] = []
  for (let index = 0; index < EXACT_ARTIFACT_COUNT; index += 1) {
    const candidate = candidateSet.artifacts[index]!
    const canonicalEntry = canonicalBinding.entries[index]!
    entries.push(
      await bindExactEntry({
        index,
        candidate,
        canonicalEntry,
        repository:
          input.canonicalArtifactBindingInput.repository,
      }),
    )
  }
  if (
    entries.reduce((sum, entry) => sum + entry.byteLength, 0)
      !== EXACT_TOTAL_BYTE_LENGTH
  ) {
    throw invalid(
      'artifact_byte_length_mismatch',
      '$.metrics.totalByteLength',
    )
  }

  const draft:
    LivingFrameControlledSdxlCanonicalArtifactBindingDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_CLASS,
    bindingId: input.bindingId,
    bindingState:
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_STATE,
    sourceBindings: {
      candidateSetId: candidateSet.candidateSetId,
      candidateSetDigestSha256:
        candidateSet.candidateSetDigestSha256,
      completedBaseObservationId:
        input.completedBaseObservation.observationId,
      completedBaseObservationDigestSha256:
        input.completedBaseObservation.observationDigestSha256,
      requirementSetId:
        canonicalBinding.sourceBindings.requirementSetId,
      requirementsDigestSha256:
        canonicalBinding.sourceBindings.requirementsDigestSha256,
      canonicalArtifactBindingId: canonicalBinding.bindingId,
      canonicalArtifactBindingDigestSha256:
        canonicalBinding.bindingDigestSha256,
    },
    entries,
    metrics: {
      candidateArtifactCount: EXACT_ARTIFACT_COUNT,
      canonicalRepositoryVerifiedArtifactCount:
        EXACT_ARTIFACT_COUNT,
      exactCandidateIdentityMatchCount: EXACT_ARTIFACT_COUNT,
      totalByteLength: EXACT_TOTAL_BYTE_LENGTH,
      compatibilityBenchmarkPassedCount: 0,
      paidProductionUseApprovedCount: 0,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    completedByteObservationChainRevalidated: true,
    canonicalArtifactBindingRevalidated: true,
    exactCandidateOrderAndIdentityVerified: true,
    everyCanonicalRepositoryObjectFullyChecksumVerified: true,
    canonicalGpuRequirementIdentityProjectionVerified: true,
    completeFiveArtifactCandidateSetRepositoryBound: true,
    canonicalOperationArtifactSetVerified: false,
    exactBundleCompatibilityProven: false,
    loraBaseVersionMismatchUnresolved: true,
    artifactsMounted: false,
    modelLoadedOrExecuted: false,
    generationPerformed: false,
    containsPathUrlCredentialFilenameRawBytesOrMountAlias: false,
    containsCallerSelectedToolOperationProviderOrRoute: false,
    createsWorkDispatchQueueCostAssetOrQaState: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    bindingDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlCanonicalArtifactBinding(
  value: unknown,
  input: BindLivingFrameControlledSdxlCanonicalArtifactsInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_CLASS
      || value.productionReady !== false
      || typeof value.bindingDigestSha256 !== 'string'
    ) return false
    const {
      bindingDigestSha256,
      ...draft
    } = value
    if (digest(draft) !== bindingDigestSha256) return false
    return canonicalJson(value) === canonicalJson(
      await bindLivingFrameControlledSdxlCanonicalArtifacts(input),
    )
  } catch {
    return false
  }
}

async function bindExactEntry(input: {
  readonly index: number
  readonly candidate: LivingFrameControlledSdxlArtifactCandidate
  readonly canonicalEntry:
    LivingFrameComfyUiCanonicalModelArtifactBindingEntry
  readonly repository:
    BindLivingFrameComfyUiCanonicalModelArtifactsInput['repository']
}): Promise<LivingFrameControlledSdxlCanonicalArtifactBindingEntry> {
  const { index, candidate, canonicalEntry } = input
  const path = `$.entries.${index}`
  if (
    candidate.order !== index + 1
    || canonicalEntry.canonicalOrder !== index
    || canonicalEntry.sourceRequirementOrder !== index + 1
  ) throw invalid('artifact_order_mismatch', path)
  if (canonicalEntry.role !== candidate.role) {
    throw invalid('artifact_role_mismatch', path)
  }
  if (canonicalEntry.bindingKind !== candidate.bindingKind) {
    throw invalid('artifact_binding_kind_mismatch', path)
  }
  if (canonicalEntry.artifactId !== candidate.artifactCode) {
    throw invalid('artifact_id_mismatch', path)
  }
  if (
    canonicalEntry.revision !== candidate.repositoryRevisionSha1
  ) throw invalid('repository_revision_mismatch', path)
  if (
    canonicalEntry.artifactFormat !== candidate.artifactFormat
  ) throw invalid('artifact_format_mismatch', path)
  if (
    canonicalEntry.modelFamily !== candidate.expectedModelFamily
    || canonicalEntry.expectedModelFamily
      !== candidate.expectedModelFamily
  ) throw invalid('model_family_mismatch', path)
  if (
    canonicalEntry.byteLength !== candidate.reportedByteLength
  ) throw invalid('artifact_byte_length_mismatch', path)
  if (
    canonicalEntry.contentSha256
      !== candidate.reportedContentSha256
  ) throw invalid('artifact_content_digest_mismatch', path)
  if (
    canonicalEntry.repositoryAdmission
      !== 'controlled_internal_test'
  ) throw invalid('repository_admission_mismatch', path)
  if (
    canonicalEntry.commercialUseStatus !== 'needs_review'
    || canonicalEntry.reviewStatus !== 'evaluation_only'
    || canonicalEntry.paidProductionUseApproved !== false
  ) throw invalid('license_review_state_mismatch', path)

  const verified = await verifyCanonicalModelArtifact({
    repository: input.repository,
    locator: canonicalEntry.locator,
  })
  const descriptor = verified.manifest.descriptor
  if (
    descriptor.artifactId !== candidate.artifactCode
    || descriptor.revision !== candidate.repositoryRevisionSha1
  ) throw invalid('artifact_id_mismatch', path)
  if (
    descriptor.byteLength !== candidate.reportedByteLength
    || verified.verifiedByteLength
      !== candidate.reportedByteLength
  ) throw invalid('artifact_byte_length_mismatch', path)
  if (
    descriptor.contentSha256 !== candidate.reportedContentSha256
    || verified.verifiedContentSha256
      !== candidate.reportedContentSha256
  ) throw invalid('artifact_content_digest_mismatch', path)

  const requirement = canonicalEntry.gpuBundleRequirement
  if (
    requirement.canonicalOrder !== index
    || requirement.slotId !== `living-frame-${candidate.role}`
    || requirement.locator.artifactRecordId
      !== canonicalEntry.locator.artifactRecordId
    || requirement.expectedArtifactId !== candidate.artifactCode
    || requirement.expectedRevision
      !== candidate.repositoryRevisionSha1
    || requirement.expectedArtifactFormat !== 'safetensors'
    || requirement.expectedArtifactRole !== candidate.role
    || requirement.expectedModelFamily
      !== candidate.expectedModelFamily
    || requirement.expectedByteLength
      !== candidate.reportedByteLength
    || requirement.expectedContentSha256
      !== candidate.reportedContentSha256
    || requirement.required !== true
  ) throw invalid('gpu_requirement_mismatch', path)

  return {
    canonicalOrder: index,
    sourceCandidateOrder: candidate.order,
    role: candidate.role,
    bindingKind: candidate.bindingKind,
    artifactCode: candidate.artifactCode,
    repositoryRevisionSha1: candidate.repositoryRevisionSha1,
    artifactRecordId: canonicalEntry.locator.artifactRecordId,
    manifestDigestSha256:
      canonicalEntry.locator.manifestDigestSha256,
    descriptorDigestSha256:
      canonicalEntry.descriptorDigestSha256,
    objectIdentityDigestSha256:
      verified.objectIdentityDigestSha256,
    canonicalArtifactId: canonicalEntry.artifactId,
    canonicalRevision: canonicalEntry.revision,
    artifactFormat: 'safetensors',
    modelFamily: canonicalEntry.modelFamily,
    byteLength: canonicalEntry.byteLength,
    contentSha256: canonicalEntry.contentSha256,
    repositoryAdmission: 'controlled_internal_test',
    commercialUseStatus: 'needs_review',
    reviewStatus: 'evaluation_only',
    paidProductionUseApproved: false,
    canonicalGpuBundleSlotId: requirement.slotId,
    canonicalGpuBundleRequirementDigestSha256:
      digest(requirement),
    fullCandidateIdentityMatched: true,
    fullRepositoryChecksumVerified: true,
    gpuExecutionPolicyVerified: true,
    compatibilityBenchmarkPassed: false,
  }
}

function assertParentLineage(
  input: BindLivingFrameControlledSdxlCanonicalArtifactsInput,
  candidateSetDigestSha256: string,
): void {
  const candidateSet =
    input.completedBaseObservationVerificationInput.candidateSet
  const candidateSetInput =
    input.completedBaseObservationVerificationInput.candidateSetInput
  const canonicalBinding = input.canonicalArtifactBinding
  const canonicalInput = input.canonicalArtifactBindingInput
  if (
    input.completedBaseObservation.sourceBindings
      .candidateSetDigestSha256 !== candidateSetDigestSha256
    || input.completedBaseObservation.sourceBindings
      .candidateSetId !== candidateSet.candidateSetId
    || candidateSet.sourceBindings.requirementSetId
      !== canonicalBinding.sourceBindings.requirementSetId
    || candidateSet.sourceBindings.requirementsDigestSha256
      !== canonicalBinding.sourceBindings.requirementsDigestSha256
    || canonicalBinding.sourceBindings.requirementSetId
      !== canonicalInput.requirements.requirementSetId
    || canonicalBinding.sourceBindings.requirementsDigestSha256
      !== canonicalInput.requirements.requirementsDigestSha256
    || candidateSetInput.requirements.requirementSetId
      !== canonicalInput.requirements.requirementSetId
    || candidateSetInput.requirements.requirementsDigestSha256
      !== canonicalInput.requirements.requirementsDigestSha256
  ) throw invalid('parent_lineage_mismatch', '$.sourceBindings')
}

function assertInput(
  input: BindLivingFrameControlledSdxlCanonicalArtifactsInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'bindingId',
      'completedBaseObservation',
      'completedBaseObservationVerificationInput',
      'canonicalArtifactBinding',
      'canonicalArtifactBindingInput',
    ])
    || typeof input.bindingId !== 'string'
    || !SAFE_ID.test(input.bindingId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code:
    LivingFrameControlledSdxlCanonicalArtifactBindingIssueCode,
  path: string,
): LivingFrameControlledSdxlCanonicalArtifactBindingError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame canonical binding issue.')
  return new LivingFrameControlledSdxlCanonicalArtifactBindingError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [
        key,
        canonicalize(value[key]),
      ]),
    )
  }
  throw invalid('input_invalid', '$')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(
      value as Record<string, unknown>,
    )) deepFreeze(nested)
  }
  return value
}
