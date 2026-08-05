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
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'

const CONFIRMATION =
  'publish-weeditpro-track-all-l4-task-qa-cloud-image-build-authority-v1'
const PRIVATE_DIRECTORY = 'track_all_task_qa_private_build_input'
const coordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    'private/image-build-inputs/track-all-l4-task-qa/reproducibility/864fa02e-da2d-4ffb-a1e4-3c8f2a9a210f/86c9f3ba4998f0ed85da5e21b7a7bd31d2ea174b8da1a1353cc666b295e0eccf.tar.gz',
  generation: '1785972654631651',
  etag: 'COPVoc3SipYDEAE=',
  byteLength: 199_217_021,
  sha256: '86c9f3ba4998f0ed85da5e21b7a7bd31d2ea174b8da1a1353cc666b295e0eccf',
}
const independentRebuildCoordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    'private/image-build-inputs/track-all-l4-task-qa/reproducibility/4c23bf5a-1864-4ea4-af37-75860d2f7f6c/86c9f3ba4998f0ed85da5e21b7a7bd31d2ea174b8da1a1353cc666b295e0eccf.tar.gz',
  generation: '1785973456059980',
  etag: 'CMz8tMvVipYDEAE=',
  byteLength: 199_217_021,
  sha256: '86c9f3ba4998f0ed85da5e21b7a7bd31d2ea174b8da1a1353cc666b295e0eccf',
}
const sourceCommitSha = '9cef9e2297087718863422fac6914d13d15639d5'
const sourceTreeSha = '3643f7964ab74fa019cd2e439fe0eb270f169f72'

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
  const [inspection, independentRebuildInspection] = await Promise.all([
    inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSourceEnvelope(
      coordinate,
      reviewRuntime.privateBuildSourceReadPort,
    ),
    inspectCanonicalTrackAllSam31L4TaskQaPrivateBuildSourceEnvelope(
      independentRebuildCoordinate,
      reviewRuntime.privateBuildSourceReadPort,
    ),
  ])
  if (
    coordinate.objectName === independentRebuildCoordinate.objectName
    || coordinate.generation === independentRebuildCoordinate.generation
    || coordinate.etag === independentRebuildCoordinate.etag
    || coordinate.sha256 !== independentRebuildCoordinate.sha256
    || coordinate.byteLength !== independentRebuildCoordinate.byteLength
    || stableAuthorityStringify(inspection.regularFileEntries)
      !== stableAuthorityStringify(
        independentRebuildInspection.regularFileEntries,
      )
    || stableAuthorityStringify(inspection.directoryEntries)
      !== stableAuthorityStringify(
        independentRebuildInspection.directoryEntries,
      )
  ) throw new Error('track_all_l4_independent_rebuild_changed')
  const entries = inspection.regularFileEntries
  const entrySetSha256 = sha256AuthorityValue(entries)
  const byPath = new Map(entries.map((entry) => [entry.path, entry]))
  const required = (path: string): (typeof entries)[number] => {
    const entry = byPath.get(path)
    if (!entry) throw new Error(`track_all_l4_build_entry_missing:${path}`)
    return entry
  }
  const buildSourceArtifactRef = {
    id: 'track-all-l4-task-qa-private-build-source-86c9f3ba4998f0ed',
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
    capsuleId: 'track-all-l4-task-qa-private-build-capsule-86c9f3ba4998f0ed',
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
      cudaNppRuntimeReceiptSha256: required(
        `${PRIVATE_DIRECTORY}/cuda-npp/cuda-npp-runtime-receipt.json`,
      ).sha256,
      cudaNppLicenseSha256: required(
        `${PRIVATE_DIRECTORY}/cuda-npp/NGC-DL-CONTAINER-LICENSE`,
      ).sha256,
      ubuntuRuntimeSecurityReceiptSha256: required(
        `${PRIVATE_DIRECTORY}/os-security/ubuntu-runtime-security-closure-receipt.json`,
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
    independentRebuildCoordinate,
    exactIndependentRebuildVerified: true,
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
