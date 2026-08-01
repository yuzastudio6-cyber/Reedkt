import assert from 'node:assert/strict'

import type {
  LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft,
} from '../../src/types/living-frame-active-non-illustration-evidence-admission'
import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameActiveNonIllustrationAggregate,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
} from '../living-frame/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameActiveNonIllustrationEvidenceAdmission,
  verifyLivingFrameActiveNonIllustrationEvidenceAdmission,
  type CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput,
} from '../living-frame/living-frame-active-non-illustration-evidence-admission'
import {
  compileLivingFrameNonIllustrationReadinessAudit,
} from '../living-frame/living-frame-non-illustration-readiness-audit'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

const cloneMutable = <T>(value: T): DeepMutable<T> =>
  structuredClone(value) as DeepMutable<T>

const digestRef = (
  refId: string,
  refVersion: string,
) => ({
  refId,
  refVersion,
  digestSha256: sha256AuthorityValue({ refId, refVersion }),
  canonicalRereadRequired: true as const,
})

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const readinessAudit =
  compileLivingFrameNonIllustrationReadinessAudit({
    ownerScopeAmendment,
  })
const caseSeeds = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map(
  (caseId, order) => {
    const suffix = `${order}-${caseId}`
    const identity = {
      workspaceId: 'workspace-lf-active-aggregate',
      projectId: 'project-lf-active-aggregate',
      editSessionId: 'edit-lf-active-aggregate',
      approvedSnapshotId: `snapshot-${suffix}`,
      executionPackageId: `package-${suffix}`,
      sceneId: `scene-${suffix}`,
      approvedWorkItemId: `work-${suffix}`,
      outputKey: `output-${suffix}`,
      expectedAssetId: `asset-${suffix}`,
    }
    const canonicalPlanBindings = {
      approvedSnapshot: digestRef(
        identity.approvedSnapshotId,
        'private-edit-authority-approved-snapshot-v3',
      ),
      executionPackage: digestRef(
        identity.executionPackageId,
        'canonical-approved-edit-execution-package-v5',
      ),
      selectedScene: digestRef(
        identity.sceneId,
        'canonical-living-frame-selected-scene-binding-v1',
      ),
      masterTiming: digestRef(
        `master-timing-${suffix}`,
        'master-timing-plan-v1',
      ),
      confirmedOutputFrame: digestRef(
        `confirmed-frame-${suffix}`,
        'confirmed-output-frame-v1',
      ),
      approvedWorkItem: digestRef(
        identity.approvedWorkItemId,
        'canonical-approved-work-item-v1',
      ),
      approvedOutput: digestRef(
        identity.outputKey,
        'canonical-approved-output-v1',
      ),
      assetManifest: digestRef(
        `asset-manifest-${suffix}`,
        'private-edit-asset-manifest-v1',
      ),
      assetManifestEntry: digestRef(
        identity.expectedAssetId,
        'private-edit-asset-manifest-entry-v1',
      ),
      rendererBinding: digestRef(
        `renderer-${suffix}`,
        'living-frame-remotion-binding-v1',
      ),
    }
    return {
      caseId,
      activeScope: ownerScopeAmendment.activeScope[order]!,
      suffix,
      identity,
      canonicalPlanBindings,
    }
  },
)
const aggregateManifestInput = {
  ownerScopeAmendment,
  readinessAudit,
  evidencePackets: caseSeeds.map(
    (seed) => ({
        packetId:
          `living-frame.active-scope.${seed.caseId}.v1`,
        packetVersion:
          LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
        packetDigestSha256: sha256AuthorityValue({
          caseId: seed.caseId,
          activeScope: seed.activeScope,
          identity: seed.identity,
          canonicalPlanBindings: seed.canonicalPlanBindings,
        }),
        canonicalRereadRequired: true as const,
        runtimeEvidenceIncluded: false as const,
        pausedEvidenceIncluded: false as const,
      }),
  ),
}
const aggregateManifest =
  compileLivingFrameActiveNonIllustrationAggregate(
    aggregateManifestInput,
  )

function evidenceSetDigest(
  candidate:
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft,
): string {
  return sha256AuthorityValue({
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
}

const cases = aggregateManifest.cases.map(
  (manifestCase, order):
    LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft => {
    const seed = caseSeeds[order]!
    const { suffix, identity, canonicalPlanBindings } = seed
    const finalRemotionArtifact = {
      artifactId: `artifact-${suffix}-v${order === 2 ? 2 : 1}`,
      artifactVersion: order === 2 ? 2 : 1,
      approvedWorkItemId: identity.approvedWorkItemId,
      outputKey: identity.outputKey,
      expectedAssetId: identity.expectedAssetId,
      privateObjectIdentityHash:
        sha256AuthorityValue({ suffix, kind: 'private-object' }),
      sha256: sha256AuthorityValue({ suffix, kind: 'mp4' }),
      contentType: 'video/mp4' as const,
      privateArtifact: true as const,
      finalCanvasOwnedByRemotion: true as const,
    }
    const candidate:
      LivingFrameActiveNonIllustrationEvidenceAdmissionCaseDraft = {
      caseId: manifestCase.caseId,
      order,
      activeScope: manifestCase.activeScope,
      manifestCaseDigestSha256: manifestCase.caseDigestSha256,
      identity,
      canonicalPlanBindings,
      finalRemotionArtifact,
      visualEvidence: {
        postrenderRequest: digestRef(
          `qwen-request-${suffix}`,
          'living-frame-postrender-visual-inspection-request-v1',
        ),
        qwenProviderLifecycle: digestRef(
          `qwen-lifecycle-${suffix}`,
          'opaque-canonical-qwen-lifecycle-ref-v1',
        ),
        postrenderResult: digestRef(
          `qwen-result-${suffix}`,
          'living-frame-postrender-visual-inspection-result-v1',
        ),
        completeTimeCoverage: digestRef(
          `coverage-${suffix}`,
          'living-frame-postrender-complete-coverage-v1',
        ),
        orderedProfessionalCheckCount: 13,
        completeTimelineCovered: true,
        deterministicCoverageIntegrityPassed: true,
        qwenProducesVisualEvidenceOnly: true,
        callerInspectionAssertionUsed: false,
        technicalMetricsOnlyAcceptanceUsed: false,
        canonicalQwenLifecycleRereadPending: true,
      },
      audioEvidence: {
        verifiedAudioEvidence: digestRef(
          `audio-${suffix}`,
          'opaque-canonical-verified-audio-evidence-v1',
        ),
        fullDurationCovered: true,
        narrationProtectionVerified: true,
        speechSfxMusicAndDuckingEvidenceIncluded: true,
        evidenceProducedSeparatelyFromQwen: true,
        callerAudioAssertionUsed: false,
      },
      headQaEvidence: {
        recommendation: digestRef(
          `head-qa-${suffix}`,
          'opaque-canonical-head-qa-recommendation-v1',
        ),
        primaryModelRoleId: 'kimi_k3_main_edit_agent',
        fallbackModelRoleId:
          'gpt_5_6_terra_fallback_edit_agent',
        fallbackUsed: order % 2 === 1,
        fallbackUsedOnlyAfterAllowedClassifiedPrimaryFailure: true,
        recommendationDisposition: 'accept',
        verifiedVisualDeterministicAndAudioEvidenceRequired: true,
        canonicalApprovalClaimed: false,
        userPrivateReviewReplaced: false,
      },
      repairLineage: {
        repairState: 'not_required',
        priorArtifact: null,
        priorEvidenceSetDigestSha256: null,
        rerunEvidenceSetDigestSha256: null,
      },
      terminalEvidence: {
        deterministicFinalQa: digestRef(
          `deterministic-qa-${suffix}`,
          'private-artifact-qa-evidence-envelope-v1',
        ),
        artifactReconciliation: digestRef(
          `reconciliation-${suffix}`,
          'private-artifact-reconciliation-v1',
        ),
        canonicalPrivateReviewAssembly: digestRef(
          `private-review-${suffix}`,
          'canonical-private-review-manifest-v1',
        ),
        deterministicFinalQaPassedClaimRequiresCanonicalReread: true,
        artifactReconciliationPassedClaimRequiresCanonicalReread: true,
        privateReviewPassedClaimRequiresCanonicalReread: true,
      },
      canonicalConsumptionPending: true,
      structuralAdmissionCandidate: true,
      canonicalAdmissionGranted: false,
      pausedScopeEvidenceUsed: false,
      historicalAggregateEvidenceUsed: false,
      allEvidenceOpaqueUntilCanonicalReread: true,
    }
    if (order === 2) {
      return {
        ...candidate,
        repairLineage: {
        repairState: 'repaired_n_plus_one',
        priorArtifact: {
          artifactId: `artifact-${suffix}-v1`,
          artifactVersion: 1,
          sha256: sha256AuthorityValue({ suffix, kind: 'prior-mp4' }),
        },
        priorEvidenceSetDigestSha256:
          sha256AuthorityValue({ suffix, kind: 'prior-evidence' }),
        rerunEvidenceSetDigestSha256: evidenceSetDigest(candidate),
        },
      }
    }
    return candidate
  },
)

const baseInput:
  CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput = {
    aggregateManifest,
    aggregateManifestInput,
    cases,
  }
const admission =
  compileLivingFrameActiveNonIllustrationEvidenceAdmission(baseInput)

assert.equal(
  verifyLivingFrameActiveNonIllustrationEvidenceAdmission(
    admission,
    baseInput,
  ),
  true,
)
assert.equal(admission.cases.length, 12)
assert.equal(admission.activeCaseCount, 12)
assert.equal(admission.pausedScopeCount, 7)
assert.equal(admission.canonicalConsumptionPending, true)
assert.equal(admission.directCanonicalPrivateReviewAdapterClaimed, false)
assert.equal(admission.runtimeExecuted, false)
assert.equal(admission.canonicalQaApproved, false)
assert.equal(admission.productionReady, false)
assert.equal(
  admission.cases.every((entry) =>
    entry.visualEvidence.completeTimelineCovered
    && entry.audioEvidence.fullDurationCovered
    && entry.headQaEvidence.recommendationDisposition === 'accept'
    && entry.canonicalAdmissionGranted === false
    && entry.allEvidenceOpaqueUntilCanonicalReread),
  true,
)
assert.equal(
  admission.cases[2]?.repairLineage.repairState,
  'repaired_n_plus_one',
)

let adversarialChecks = 0
const reject = (
  mutate: (
    candidate:
      DeepMutable<CompileLivingFrameActiveNonIllustrationEvidenceAdmissionInput>,
  ) => void,
) => {
  const candidate = cloneMutable(baseInput)
  mutate(candidate)
  assert.throws(() =>
    compileLivingFrameActiveNonIllustrationEvidenceAdmission(candidate))
  adversarialChecks += 1
}

reject((candidate) => candidate.cases.pop())
reject((candidate) => candidate.cases.reverse())
reject((candidate) => {
  candidate.cases[0]!.activeScope = 'living_archive'
})
reject((candidate) => {
  candidate.cases[0]!.manifestCaseDigestSha256 = '0'.repeat(64)
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.approvedSnapshot.refId =
    'snapshot-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.executionPackage.refId =
    'package-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.selectedScene.refId =
    'scene-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.approvedWorkItem.refId =
    'work-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.approvedOutput.refId =
    'output-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.canonicalPlanBindings.assetManifestEntry.refId =
    'asset-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.finalRemotionArtifact.approvedWorkItemId =
    'work-substituted'
})
reject((candidate) => {
  candidate.cases[0]!.finalRemotionArtifact.finalCanvasOwnedByRemotion = false
})
reject((candidate) => {
  candidate.cases[0]!.visualEvidence.completeTimelineCovered = false
})
reject((candidate) => {
  candidate.cases[0]!.visualEvidence.technicalMetricsOnlyAcceptanceUsed = true
})
reject((candidate) => {
  candidate.cases[0]!.visualEvidence.callerInspectionAssertionUsed = true
})
reject((candidate) => {
  candidate.cases[0]!.audioEvidence.fullDurationCovered = false
})
reject((candidate) => {
  candidate.cases[0]!.audioEvidence.evidenceProducedSeparatelyFromQwen = false
})
reject((candidate) => {
  candidate.cases[0]!.audioEvidence.callerAudioAssertionUsed = true
})
reject((candidate) => {
  candidate.cases[0]!.headQaEvidence.recommendationDisposition =
    'repair'
})
reject((candidate) => {
  candidate.cases[0]!.headQaEvidence.canonicalApprovalClaimed = true
})
reject((candidate) => {
  candidate.cases[0]!.headQaEvidence.userPrivateReviewReplaced = true
})
reject((candidate) => {
  candidate.cases[0]!.terminalEvidence
    .canonicalPrivateReviewAssembly.refVersion =
      'canonical-private-review-manifest-v2'
})
reject((candidate) => {
  candidate.cases[0]!.terminalEvidence
    .deterministicFinalQa.canonicalRereadRequired = false
})
reject((candidate) => {
  candidate.cases[0]!.canonicalConsumptionPending = false
})
reject((candidate) => {
  candidate.cases[0]!.pausedScopeEvidenceUsed = true
})
reject((candidate) => {
  candidate.cases[1]!.identity.sceneId =
    candidate.cases[0]!.identity.sceneId
  candidate.cases[1]!.canonicalPlanBindings.selectedScene.refId =
    candidate.cases[0]!.identity.sceneId
})
reject((candidate) => {
  const repaired = candidate.cases[2]!
  if (repaired.repairLineage.repairState !== 'repaired_n_plus_one') return
  repaired.repairLineage.priorArtifact.artifactId =
    repaired.finalRemotionArtifact.artifactId
})
reject((candidate) => {
  const repaired = candidate.cases[2]!
  if (repaired.repairLineage.repairState !== 'repaired_n_plus_one') return
  repaired.finalRemotionArtifact.artifactVersion =
    repaired.repairLineage.priorArtifact.artifactVersion
})
reject((candidate) => {
  const repaired = candidate.cases[2]!
  if (repaired.repairLineage.repairState !== 'repaired_n_plus_one') return
  repaired.repairLineage.priorArtifact.sha256 =
    repaired.finalRemotionArtifact.sha256
})
reject((candidate) => {
  const repaired = candidate.cases[2]!
  if (repaired.repairLineage.repairState !== 'repaired_n_plus_one') return
  repaired.repairLineage.rerunEvidenceSetDigestSha256 = 'f'.repeat(64)
})
reject((candidate) => {
  candidate.cases[0]!.historicalAggregateEvidenceUsed = true
})
reject((candidate) => {
  const first = candidate.cases[0]!
  const second = candidate.cases[1]!
  const firstIdentity = first.identity
  const firstPlan = first.canonicalPlanBindings
  const firstArtifact = first.finalRemotionArtifact
  const firstVisual = first.visualEvidence
  const firstAudio = first.audioEvidence
  const firstHeadQa = first.headQaEvidence
  const firstTerminal = first.terminalEvidence
  first.identity = second.identity
  first.canonicalPlanBindings = second.canonicalPlanBindings
  first.finalRemotionArtifact = second.finalRemotionArtifact
  first.visualEvidence = second.visualEvidence
  first.audioEvidence = second.audioEvidence
  first.headQaEvidence = second.headQaEvidence
  first.terminalEvidence = second.terminalEvidence
  second.identity = firstIdentity
  second.canonicalPlanBindings = firstPlan
  second.finalRemotionArtifact = firstArtifact
  second.visualEvidence = firstVisual
  second.audioEvidence = firstAudio
  second.headQaEvidence = firstHeadQa
  second.terminalEvidence = firstTerminal
})
reject((candidate) => {
  Object.assign(candidate.cases[0]!, {
    rawTranscript: 'smuggled transcript',
  })
})

assert.equal(adversarialChecks, 33)

console.log(JSON.stringify({
  smoke: 'living_frame_active_non_illustration_evidence_admission',
  status: 'passed_source_only',
  contractVersion: admission.contractVersion,
  admissionDigestSha256: admission.admissionDigestSha256,
  activeCaseCount: admission.activeCaseCount,
  repairedCaseCount: admission.cases.filter(
    (entry) => entry.repairLineage.repairState
      === 'repaired_n_plus_one',
  ).length,
  adversarialChecks,
  completeTimeVisualEvidenceRequired: true,
  separateAudioEvidenceRequired: true,
  headQaRecommendationRequired: true,
  canonicalConsumptionPending: true,
  directPrivateReviewAdapterClaimed: false,
  runtimeExecuted: false,
  productionReady: false,
}, null, 2))
