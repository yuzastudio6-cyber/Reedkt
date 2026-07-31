import assert from 'node:assert/strict'

import {
  compileLivingFrameAi2dInterpolationSourceAudit,
  verifyLivingFrameAi2dInterpolationSourceAudit,
} from '../living-frame/living-frame-ai-2d-interpolation-source-audit'

const audit =
  compileLivingFrameAi2dInterpolationSourceAudit()

assert.equal(
  verifyLivingFrameAi2dInterpolationSourceAudit(
    audit,
  ),
  true,
)
assert.equal(audit.candidateAudits.length, 2)
assert.deepEqual(
  audit.candidateAudits.map(
    (candidate) =>
      candidate.pinnedCommitSha,
  ),
  [
    'b0c47ff339c5e5ec45b84d0c6587850f242d41ef',
    '5d8adbdd40e12c2c8f91930eff838aebe561c086',
  ],
)
assert.equal(
  audit.candidateAudits.every(
    (candidate) =>
      candidate.sourceArchive
        .repeatedDownloadByteIdentical
      && candidate.sourceArchive
        .symlinkCount === 0
      && candidate.sourceArchive
        .filesLargerThanTenMiB === 0
      && !candidate.sourceArchive
        .sourceArchivePersistedInRepository
      && candidate.resolvedEvidence.length ===
        1
      && candidate.resolvedEvidence[0] ===
        'exact_source_commit_and_source_archive_digest'
      && !candidate.sourceLicense
        .independentLegalDispositionReleased
      && !candidate.dependencyManifest
        .fullyVersionPinned
      && !candidate.modelEvidence
        .exactModelWeightInventoryReleased
      && !candidate.modelEvidence
        .modelWeightLicenseDispositionReleased
      && !candidate.modelEvidence
        .safeDeserializationEvidenceReleased
      && !candidate.registryIdentityCreated
      && !candidate.operationRegistered
      && !candidate.dispatchGranted
      && !candidate.runtimeExecuted
      && !candidate.assetCreated
      && !candidate.canonicalQaApproved,
  ),
  true,
)
const toonCrafter = audit.candidateAudits[0]!
const rife = audit.candidateAudits[1]!
assert.equal(
  toonCrafter.modelEvidence
    .observedCheckpointSha256,
  'e4df5aecd9919af2f41a92912bb6391e03531b269785a7448d87e964462edf53',
)
assert.equal(
  toonCrafter.upstreamCapabilityObservation
    .maximumFramesClaimed,
  16,
)
assert.equal(
  toonCrafter.staticRiskCodes.includes(
    'runtime_huggingface_download_path_present',
  ),
  true,
)
assert.equal(
  toonCrafter.staticRiskCodes.includes(
    'official_memory_profile_not_safely_within_l4_capacity',
  ),
  true,
)
assert.equal(
  rife.staticRiskCodes.includes(
    'upstream_shell_ffmpeg_invocation_present',
  ),
  true,
)
assert.equal(
  rife.staticRiskCodes.includes(
    'model_archive_digest_size_and_license_unresolved',
  ),
  true,
)
assert.equal(
  verifyLivingFrameAi2dInterpolationSourceAudit({
    ...audit,
    runtimeQualificationComplete: true,
  }),
  false,
)
assert.equal(
  verifyLivingFrameAi2dInterpolationSourceAudit({
    ...audit,
    candidateAudits:
      audit.candidateAudits.map(
        (candidate, order) =>
          order === 0
            ? {
              ...candidate,
              staticRiskCodes:
                candidate.staticRiskCodes.filter(
                  (code) => code !==
                    'runtime_huggingface_download_path_present',
                ),
            }
            : candidate,
      ),
  }),
  false,
)
assert.equal(audit.operationRegistered, false)
assert.equal(audit.dispatchGranted, false)
assert.equal(audit.runtimeExecuted, false)
assert.equal(audit.assetCreated, false)
assert.equal(audit.canonicalQaApproved, false)
assert.equal(audit.productionReady, false)

console.log(JSON.stringify({
  smoke:
    'living_frame_ai_2d_interpolation_source_audit',
  status: 'passed_source_only',
  candidateAudits:
    audit.candidateAudits.map(
      (candidate) => ({
        toolId: candidate.proposedToolId,
        pinnedCommitSha:
          candidate.pinnedCommitSha,
        archiveSha256:
          candidate.sourceArchive.sha256,
        sourceFileCount:
          candidate.sourceArchive
            .extractedRegularFileCount,
        observedSourceLicense:
          candidate.sourceLicense
            .observedSpdxId,
        staticRiskCodes:
          candidate.staticRiskCodes,
        qualificationState:
          candidate.qualificationState,
      }),
    ),
  modelWeightsDownloaded: false,
  dependenciesInstalled: false,
  runtimeStarted: false,
  inferenceExecuted: false,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))
