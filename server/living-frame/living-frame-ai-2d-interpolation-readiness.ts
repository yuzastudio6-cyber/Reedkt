import {
  LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_CLASS,
  LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_VERSION,
  type LivingFrameAi2dInterpolationReadiness,
  type LivingFrameAi2dInterpolationReadinessDraft,
} from '../../src/types/living-frame-ai-2d-interpolation-readiness'
import type {
  LivingFrameAi2dInterpolationQualification,
} from '../../src/types/living-frame-ai-2d-interpolation-qualification'
import type {
  LivingFrameAi2dInterpolationSourceAudit,
} from '../../src/types/living-frame-ai-2d-interpolation-source-audit'
import type {
  LivingFrameCompleteCharacterInterpolationAdmission,
} from '../../src/types/living-frame-complete-character-interpolation-admission'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameAi2dInterpolationQualification,
} from './living-frame-ai-2d-interpolation-qualification'
import {
  verifyLivingFrameAi2dInterpolationSourceAudit,
} from './living-frame-ai-2d-interpolation-source-audit'
import {
  verifyLivingFrameCompleteCharacterInterpolationAdmissionArtifact,
} from './living-frame-complete-character-interpolation-admission'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface CompileLivingFrameAi2dInterpolationReadinessInput {
  readonly readinessId: string
  readonly admission:
    LivingFrameCompleteCharacterInterpolationAdmission
  readonly qualification:
    LivingFrameAi2dInterpolationQualification
  readonly sourceAudit:
    LivingFrameAi2dInterpolationSourceAudit
}

export function compileLivingFrameAi2dInterpolationReadiness(
  input:
    CompileLivingFrameAi2dInterpolationReadinessInput,
): LivingFrameAi2dInterpolationReadiness {
  assertInput(input)
  const toonQualification =
    input.qualification.candidates[0]!
  const rifeQualification =
    input.qualification.candidates[1]!
  const toonAudit =
    input.sourceAudit.candidateAudits[0]!
  const rifeAudit =
    input.sourceAudit.candidateAudits[1]!
  const toonOpenEvidence =
    unresolvedEvidence(
      toonQualification.requiredReleaseEvidence,
      toonAudit.resolvedEvidence,
    )
  const rifeOpenEvidence =
    unresolvedEvidence(
      rifeQualification.requiredReleaseEvidence,
      rifeAudit.resolvedEvidence,
    )
  const draft:
    LivingFrameAi2dInterpolationReadinessDraft = {
      contractVersion:
        LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_VERSION,
      resultClass:
        LIVING_FRAME_AI_2D_INTERPOLATION_READINESS_CLASS,
      readinessState:
        'source_only_source_pin_resolved_runtime_hardware_model_and_visual_gates_open',
      readinessId: input.readinessId,
      canonicalScope:
        structuredClone(
          input.admission.canonicalScope,
        ),
      sourceBindings: {
        interpolationAdmissionVersion:
          input.admission.contractVersion,
        interpolationAdmissionDigestSha256:
          input.admission.admissionDigestSha256,
        interpolationQualificationVersion:
          input.qualification.contractVersion,
        interpolationQualificationDigestSha256:
          input.qualification
            .qualificationDigestSha256,
        sourceAuditVersion:
          input.sourceAudit.contractVersion,
        sourceAuditDigestSha256:
          input.sourceAudit.auditDigestSha256,
        approvedSnapshotId:
          input.admission.sourceBindings
            .approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.admission.sourceBindings
            .approvedSnapshotHashSha256,
        actionChoreographyDigestSha256:
          input.admission.sourceBindings
            .actionChoreographyDigestSha256,
        authoritativeActionTimingDigestSha256:
          input.admission.sourceBindings
            .authoritativeActionTimingDigestSha256,
        authoritativeKeyposeTimingDigestSha256:
          input.admission.sourceBindings
            .authoritativeKeyposeTimingDigestSha256,
      },
      toonCrafterReadiness: {
        candidateId:
          'tooncrafter_official_candidate',
        proposedToolId: 'tooncrafter',
        proposedOperationId:
          'tool.tooncrafter.interpolate_accepted_character_keyposes.v1',
        sourcePinGateResolved: true,
        resolvedEvidence: [
          'exact_source_commit_and_source_archive_digest',
        ],
        openEvidence: toonOpenEvidence,
        openGateCount: 13,
        acceptedKeyposeAdmissionPresent:
          true,
        runtimeSelectionReleased: false,
        qualificationState:
          'blocked_pending_model_runtime_hardware_cost_private_output_and_professional_visual_evidence',
      },
      rifeReadiness: {
        candidateId:
          'rife_official_candidate',
        proposedToolId: 'rife',
        proposedOperationId:
          'tool.rife.smooth_accepted_character_motion.v1',
        sourcePinGateResolved: true,
        resolvedEvidence: [
          'exact_source_commit_and_source_archive_digest',
        ],
        openEvidence: rifeOpenEvidence,
        openGateCount: 13,
        blockedUntilUnderlyingMotionProfessionallyAccepted:
          true,
        runtimeSelectionReleased: false,
        qualificationState:
          'blocked_pending_underlying_motion_and_model_runtime_cost_private_output_and_professional_visual_evidence',
      },
      toonCrafterHardwarePolicy: {
        singleL4RouteAssumedAdequate:
          false,
        blockingRiskCode:
          'official_memory_profile_not_safely_within_l4_capacity',
        upstreamObservationOnlyMemoryRange:
          'approximately_24G_to_27G',
        selectedRuntimeRoute: 'none',
        allowedNextQualificationRoutes: [
          'memory_reduced_route_only_if_same_professional_visual_bar_passes',
          'owner_approved_larger_gpu_route',
        ],
        automaticQualityReducingOptimizationAllowed:
          false,
        ownerDecisionRequiredBeforeRuntimeQualification:
          true,
      },
      sequencingPolicy: {
        sourcePinningDoesNotReleaseRuntime:
          true,
        acceptedKeyposesDoNotProveInterpolationQuality:
          true,
        interpolationCannotBeginUntilEveryOpenToonCrafterGateIsReleased:
          true,
        rifeCannotBeginUntilUnderlyingMotionIsProfessionallyAccepted:
          true,
        eachRuntimeOutputRequiresTechnicalQaAndActualVisualInspection:
          true,
        failureReturnsToAcceptedStillOrRestrainedMotion:
          true,
      },
      currentInterpolationDisposition:
        'disabled_pending_qualification_and_private_visual_evidence',
      containsPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
        false,
      authorityBoundary: {
        registryAuthority: false,
        operationAuthority: false,
        providerAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    readinessDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameAi2dInterpolationReadiness(
  value: unknown,
  input:
    CompileLivingFrameAi2dInterpolationReadinessInput,
): value is LivingFrameAi2dInterpolationReadiness {
  try {
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(
        compileLivingFrameAi2dInterpolationReadiness(
          input,
        ),
      )
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameAi2dInterpolationReadinessInput,
): void {
  if (
    !hasExactKeys(input, [
      'readinessId',
      'admission',
      'qualification',
      'sourceAudit',
    ])
    || !SAFE_ID.test(input.readinessId)
    || !verifyLivingFrameCompleteCharacterInterpolationAdmissionArtifact(
      input.admission,
    )
    || !verifyLivingFrameAi2dInterpolationQualification(
      input.qualification,
    )
    || !verifyLivingFrameAi2dInterpolationSourceAudit(
      input.sourceAudit,
    )
    || input.admission.sourceBindings
      .interpolationQualificationDigestSha256 !==
        input.qualification
          .qualificationDigestSha256
    || input.sourceAudit
      .sourcePinningCompleteForBothCandidates !==
        true
    || input.sourceAudit
      .runtimeQualificationComplete !== false
    || input.sourceAudit.candidateAudits.length !==
      input.qualification.candidates.length
  ) fail()
  input.qualification.candidates.forEach(
    (candidate, order) => {
      const audit =
        input.sourceAudit.candidateAudits[order]
      if (
        audit == null
        || candidate.candidateId !==
          audit.candidateId
        || candidate.proposedToolId !==
          audit.proposedToolId
        || candidate.upstreamRepositorySlug !==
          audit.upstreamRepositorySlug
        || candidate.declaredSourceLicense !==
          audit.sourceLicense.observedSpdxId
        || audit.resolvedEvidence.length !== 1
        || audit.resolvedEvidence[0] !==
          'exact_source_commit_and_source_archive_digest'
        || stableAuthorityStringify(
          unresolvedEvidence(
            candidate.requiredReleaseEvidence,
            audit.resolvedEvidence,
          ),
        ) !== stableAuthorityStringify(
          audit.unresolvedEvidence,
        )
      ) fail()
    },
  )
  const toonAudit =
    input.sourceAudit.candidateAudits[0]!
  if (
    toonAudit.proposedToolId !==
      'tooncrafter'
    || !toonAudit.staticRiskCodes.includes(
      'official_memory_profile_not_safely_within_l4_capacity',
    )
    || toonAudit.upstreamCapabilityObservation
      .officialGpuMemoryRangeClaimed !==
        'approximately_24G_to_27G'
  ) fail()
}

function unresolvedEvidence(
  required:
    LivingFrameAi2dInterpolationQualification['candidates'][number]['requiredReleaseEvidence'],
  resolved: readonly string[],
) {
  const resolvedSet = new Set(resolved)
  return required.filter(
    (entry) => !resolvedSet.has(entry),
  )
}

function hasExactKeys(
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
    && stableAuthorityStringify(
      Object.keys(value).sort(),
    ) === stableAuthorityStringify(
      [...expected].sort(),
    )
}

function fail(): never {
  throw new Error(
    'Living Frame AI 2D interpolation readiness input is invalid.',
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(nested)
  return value
}
