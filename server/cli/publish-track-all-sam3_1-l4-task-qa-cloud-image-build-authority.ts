import { z } from 'zod'

import {
  createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule,
  inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSourceEnvelope,
  prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-capsule-review'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpPrivateCapsuleReviewRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-capsule-review-runtime'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const CONFIRMATION =
  'publish-weeditpro-track-all-l4-task-qa-cloud-image-build-authority-v1'
const PRIVATE_DIRECTORY = 'track_all_task_qa_private_build_input'
const coordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    'private/image-build-inputs/track-all-l4-task-qa/efcc88c50688b892565f643d6433ef99cbaf36241e5ed73d245279a7f9102ae1.tar.gz',
  generation: '1785953751539638',
  etag: 'CLa/yJeMipYDEAE=',
  byteLength: 101_985_962,
  sha256: 'efcc88c50688b892565f643d6433ef99cbaf36241e5ed73d245279a7f9102ae1',
}
const sourceCommitSha = '2e9dc0741e53e20902b96db38143954cf8d2b553'
const sourceTreeSha = '64964dc34e074f787a0dd1e812ca58c24d17e89a'

async function main(): Promise<void> {
  if (process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_BUILD_AUTHORITY
    !== CONFIRMATION) {
    throw new Error('track_all_l4_build_authority_confirmation_missing')
  }
  if (process.argv.slice(2).length !== 1
    || process.argv.slice(2)[0] !== '--publish') {
    throw new Error('track_all_l4_build_authority_arguments_invalid')
  }
  const preparedAt = new Date().toISOString()
  const reviewRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpPrivateCapsuleReviewRuntime()
  const inspection =
    await inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSourceEnvelope(
      coordinate,
      reviewRuntime.privateBuildSourceReadPort,
    )
  const entries = inspection.regularFileEntries
  const entrySetSha256 = sha256AuthorityValue(entries)
  const byPath = new Map(entries.map((entry) => [entry.path, entry]))
  const required = (path: string): (typeof entries)[number] => {
    const entry = byPath.get(path)
    if (!entry) throw new Error(`track_all_l4_build_entry_missing:${path}`)
    return entry
  }
  const buildSourceArtifactRef = {
    id: 'track-all-l4-task-qa-private-build-source-efcc88c50688b892',
    version: 1 as const,
    contentHash: `sha256:${coordinate.sha256}` as const,
  }
  const reviews = createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: [...entries],
    buildSourceArchiveEntrySetSha256: entrySetSha256,
    buildSourceArchiveDirectoryEntries: inspection.directoryEntries,
    requirementsLockSha256: required(
      `${PRIVATE_DIRECTORY}/python/requirements.lock.txt`,
    ).sha256,
    opencvBuildInformationSha256: required(
      `${PRIVATE_DIRECTORY}/opencv/opencv-build-information.txt`,
    ).sha256,
    opencvLicenseSha256: required(
      `${PRIVATE_DIRECTORY}/opencv/LICENSE`,
    ).sha256,
    opencvContribLicenseSha256: required(
      `${PRIVATE_DIRECTORY}/opencv/CONTRIB_LICENSE`,
    ).sha256,
    preparedAt,
  })
  const persistedReviewRefs =
    await reviewRuntime.repository.persistReviewsCreateOnly(reviews)
  if (JSON.stringify(persistedReviewRefs) !== JSON.stringify({
    archiveSafetyReviewRef: reviews.archiveSafetyReviewRef,
    dependencyReviewRef: reviews.dependencyReviewRef,
    licenseReviewRef: reviews.licenseReviewRef,
  })) throw new Error('track_all_l4_persisted_review_refs_changed')

  const capsule = createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule({
    capsuleId: 'track-all-l4-task-qa-private-build-capsule-efcc88c50688b892',
    capsuleVersion: 1,
    evidenceClass: 'canonical_private_reread',
    status: 'private_capsule_verified',
    operationId: 'tool.kornia.refine_mask.v1',
    accelerator: 'nvidia_l4',
    routeId: 'l4_standard_primary',
    sourceCommitSha,
    sourceTreeSha,
    sourceWorktreeClean: true,
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: [...entries],
    buildSourceArchiveEntrySetSha256: entrySetSha256,
    dockerfilePath:
      'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
    dockerfileSha256: required(
      'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
    ).sha256,
    runnerSha256: required(
      'docker/prod/gpu-worker/track-all-task-qa/runner.py',
    ).sha256,
    entrypointSha256: required(
      'docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh',
    ).sha256,
    verifierSha256: required(
      'docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
    ).sha256,
    sourceProvenanceLockSha256: required(
      'docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock',
    ).sha256,
    privateInput: {
      directoryName: PRIVATE_DIRECTORY,
      capsuleManifestRef: {
        id: 'track-all-l4-task-qa-private-capsule-manifest',
        version: 1,
        contentHash: `sha256:${required(
          `${PRIVATE_DIRECTORY}/capsule-manifest.json`,
        ).sha256}`,
      },
      capsuleManifestSha256: required(
        `${PRIVATE_DIRECTORY}/capsule-manifest.json`,
      ).sha256,
      requirementsLockSha256: required(
        `${PRIVATE_DIRECTORY}/python/requirements.lock.txt`,
      ).sha256,
      opencvCudaReceiptSha256: required(
        `${PRIVATE_DIRECTORY}/opencv/opencv-cuda-receipt.json`,
      ).sha256,
      opencvBuildInformationSha256: required(
        `${PRIVATE_DIRECTORY}/opencv/opencv-build-information.txt`,
      ).sha256,
      opencvLicenseSha256: required(
        `${PRIVATE_DIRECTORY}/opencv/LICENSE`,
      ).sha256,
      opencvContribLicenseSha256: required(
        `${PRIVATE_DIRECTORY}/opencv/CONTRIB_LICENSE`,
      ).sha256,
      cudaForwardCompatReceiptSha256: required(
        `${PRIVATE_DIRECTORY}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
      ).sha256,
      cudaForwardCompatPackageSha256: required(
        `${PRIVATE_DIRECTORY}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
      ).sha256,
      artifactCount: entries.filter((entry) =>
        entry.path.startsWith(`${PRIVATE_DIRECTORY}/`)).length,
      exactArtifactSetReread: true,
      hashLockedWheelhouse: true,
      reviewedOpenCvCudaBuild: true,
      containsCredentials: false,
      containsCustomerMedia: false,
      containsSamCheckpoint: false,
      containsModelWeights: false,
      runtimeDownloadsAllowed: false,
    },
    securityBoundary: {
      archiveEntrySafetyScanPassed: true,
      symlinkDeviceSocketAndTraversalEntriesAbsent: true,
      archiveSafetyReviewRef: reviews.archiveSafetyReviewRef,
      dependencyReviewRef: reviews.dependencyReviewRef,
      licenseReviewRef: reviews.licenseReviewRef,
      callerPathUrlCommandImageTagOrBuildArgsAccepted: false,
      developerMachineModelInstallAllowed: false,
    },
    preparedAt,
  })
  const authority =
    await prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority({
      authorityId:
        `track-all-l4-task-qa-cloud-image-build-${capsule.capsuleHash.slice(0, 24)}`,
      capsule,
      privateBuildSourceReadPort: reviewRuntime.privateBuildSourceReadPort,
      privateCapsuleReviewReadPort: reviewRuntime.repository,
      preparedAt,
    })
  const cloudBuildRuntime =
    createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime()
  const authorityRef =
    await cloudBuildRuntime.persistBuildAuthorityCreateOnly({ authority })
  process.stdout.write(`${JSON.stringify({
    schemaVersion:
      'weeditpro-track-all-sam3_1-l4-task-qa-build-authority-publication-v1',
    sourceCommitSha,
    sourceTreeSha,
    buildSourceCoordinate: coordinate,
    archiveEntryCount: entries.length,
    buildSourceArchiveEntrySetSha256: entrySetSha256,
    reviewRefs: persistedReviewRefs,
    capsuleRef: {
      id: capsule.capsuleId,
      version: capsule.capsuleVersion,
      contentHash: `sha256:${capsule.capsuleHash}`,
    },
    authorityRef,
    imageDestination: authority.imageDestination,
    cloudImageBuildAuthorized: authority.authority.cloudImageBuildAuthorized,
    imageBuildStarted: false,
    imagePushed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    productionReady: false,
  })}\n`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : 'track_all_l4_build_authority_publication_failed'
  process.stderr.write(`${z.string().max(500).catch(
    'track_all_l4_build_authority_publication_failed',
  ).parse(message)}\n`)
  process.exitCode = 1
})
