import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews,
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-capsule-review'
import {
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-capsule-review-runtime'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const root = 'track_all_task_qa_private_build_input'
const entries = [
  [`${root}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`, 37_945_232, 'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893'],
  [`${root}/cuda-npp/NGC-DL-CONTAINER-LICENSE`, 20_000, 'e4196076c5496c4bb5509be61e3d1cddf36b92a449a10ece1779afce3c65e684'],
  [`${root}/cuda-npp/cuda-npp-runtime-receipt.json`, 2_000, 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'],
  [`${root}/cuda-npp/lib/libnppc.so.12`, 1_656_080, '69c1468de02b2951a3c9755a76b8246b83fbf4d8f137fd1e843767a76c344ae7'],
  [`${root}/cuda-npp/lib/libnppial.so.12`, 22_046_288, 'd37c9d285930dca5da32ccce15594bccdadde6da71fd1c297f79d7b435b50ce6'],
  [`${root}/cuda-npp/lib/libnppidei.so.12`, 13_633_464, '8397ce991612229cf673dce3b594187c61ada782d5cf61f4a7212cdd84e1e552'],
  [`${root}/cuda-npp/lib/libnppig.so.12`, 55_871_152, 'f24d72d82ceea1b0833a2429cebd6903f0d9ca961841ee413cf6bdea7d0d1129'],
  [`${root}/cuda-npp/lib/libnppist.so.12`, 49_739_688, 'adcaf330d4ba448d5b9f9e8e269d97e05e9c888720ee19cbbd484170fb59ac36'],
  [`${root}/cuda-npp/lib/libnppitc.so.12`, 6_686_096, 'cb0bbbc4d1f08d30bfedde3a862be3a20426e6fdc45636c822fd1bf7ebe32ae9'],
  [`${root}/opencv/CONTRIB_LICENSE`, 11_358, 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'],
  [`${root}/opencv/LICENSE`, 11_358, 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'],
  [`${root}/opencv/opencv-build-information.txt`, 6_465, 'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae'],
  [`${root}/opencv/install/lib/libopencv_core.so.412`, 12_345, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
  [`${root}/python/requirements.lock.txt`, 574, '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac'],
  [`${root}/python/wheelhouse/kornia-0.8.3-py3-none-any.whl`, 1_189_381, '0b15f5d359aeafd7ff54ea631ed1943a3eb295c4a6dae3f745ddeada25e33289'],
  [`${root}/python/wheelhouse/kornia_rs-0.1.14-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl`, 3_695_565, '396f84661fcf260885c3f9db717caf6904eafd44857dca17be09a835bd7da8d9'],
  [`${root}/python/wheelhouse/numpy-2.2.6-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl`, 16_527_618, 'fd83c01228a688733f1ded5201c678f0c53ecc1006ffbc404db9f7a899ac6249'],
  [`${root}/python/wheelhouse/nvidia_ml_py-13.610.43-py3-none-any.whl`, 53_163, 'f13c72698edef492f985cc225f14faafe68ae065a2e407f45bdf6f4b9b43fde8'],
  [`${root}/python/wheelhouse/packaging-26.3-py3-none-any.whl`, 129_956, 'd7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c'],
  [`${root}/python/wheelhouse/pillow-12.3.0-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`, 6_940_830, '78cb2c6865a35ab8ff8b75fd122f6033b92a62c82801110e48ddd6c936a45d91'],
].map(([path, byteLength, sha256]) => ({
  path: String(path),
  byteLength: Number(byteLength),
  sha256: String(sha256),
})).sort((left, right) => left.path < right.path ? -1 : 1)
const directories = [...new Set(entries.flatMap((entry) => {
  const parts = entry.path.split('/')
  return parts.slice(0, -1).map((_, index) =>
    parts.slice(0, index + 1).join('/'))
}))].sort()

const coordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    'private/image-build-inputs/track-all-l4-task-qa/bf5c8746543f0f7b39f9c177ce53e0ca04a7935b69119c5ff76c8304995ff3de.tar.gz',
  generation: '1785949915434978',
  etag: 'COKfr/L9iZYDEAE=',
  byteLength: 101_981_929,
  sha256: 'bf5c8746543f0f7b39f9c177ce53e0ca04a7935b69119c5ff76c8304995ff3de',
}
const buildSourceArtifactRef = {
  id: 'track-all-l4-task-qa-private-build-source-bf5c8746543f0f7b',
  version: 1 as const,
  contentHash: `sha256:${coordinate.sha256}` as const,
}
const reviews = createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
  buildSourceCoordinate: coordinate,
  buildSourceArtifactRef,
  buildSourceArchiveEntries: entries,
  buildSourceArchiveEntrySetSha256: sha256AuthorityValue(entries),
  buildSourceArchiveDirectoryEntries: directories,
  requirementsLockSha256:
    '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
  opencvBuildInformationSha256:
    'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
  opencvLicenseSha256:
    'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  opencvContribLicenseSha256:
    'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  preparedAt: '2026-08-05T17:20:00.000Z',
})

assert.equal(reviews.archiveSafetyReview.schemaVersion,
  'canonical-track-all-sam3_1-l4-task-qa-archive-safety-review-v2')
if (reviews.archiveSafetyReview.schemaVersion !==
  'canonical-track-all-sam3_1-l4-task-qa-archive-safety-review-v2') {
  throw new Error('expected v2 archive review')
}
assert.equal(reviews.archiveSafetyReview.regularFileEntryCount, entries.length)
assert.equal(reviews.archiveSafetyReview.directoryEntryCount,
  directories.length)
assert.equal(reviews.archiveSafetyReview.malwareContentClassificationClaimed,
  false)
assert.equal(reviews.dependencyReview.pythonDependencies.length, 6)
assert.equal(reviews.dependencyReview.schemaVersion,
  'canonical-track-all-sam3_1-l4-task-qa-dependency-review-v2')
assert.equal(reviews.dependencyReview.runtimePackageDownloadsAllowed, false)
assert.equal(reviews.dependencyReview.cudaNppRuntime.libraryCount, 6)
assert.equal(reviews.dependencyReview.cudaNppRuntime.completeCudaToolkitCopied,
  false)
assert.equal(
  reviews.dependencyReview.opencvCuda.runtimeArtifactSetSha256,
  createHash('sha256').update(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  ./lib/libopencv_core.so.412\n',
    'utf8',
  ).digest('hex'),
)
assert.equal(reviews.licenseReview.privateCandidateImageBuildAllowed, true)
assert.equal(reviews.licenseReview.schemaVersion,
  'canonical-track-all-sam3_1-l4-task-qa-license-review-v2')
assert.equal(reviews.licenseReview.runtimeReleaseAllowed, false)
assert.equal(reviews.licenseReview.legalApprovalClaimed, false)
assert.equal(
  reviews.licenseReview.cudaForwardCompatibilityLicense
    .publicRedistributionAuthorized,
  false,
)
assert.equal(
  reviews.licenseReview.cudaNppRuntimeLicense.publicRedistributionAuthorized,
  false,
)

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    const existing = objects.get(input.objectPath)
    if (existing) {
      if (!existing.equals(input.body)) throw new Error('create_only_collision')
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(path) {
    const body = objects.get(path)
    return body ? Buffer.from(body) : null
  },
}
const repository =
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviewRepository({
    objectPort,
    prefix: 'private/smoke/track-all-l4-capsule-reviews',
  })
const persisted = await repository.persistReviewsCreateOnly(reviews)
assert.deepEqual(persisted.archiveSafetyReviewRef,
  reviews.archiveSafetyReviewRef)
assert.deepEqual(persisted.dependencyReviewRef, reviews.dependencyReviewRef)
assert.deepEqual(persisted.licenseReviewRef, reviews.licenseReviewRef)
assert.deepEqual(
  await repository.rereadArchiveSafetyReview({
    reviewRef: reviews.archiveSafetyReviewRef,
  }),
  reviews.archiveSafetyReview,
)
assert.deepEqual(
  await repository.rereadDependencyReview({
    reviewRef: reviews.dependencyReviewRef,
  }),
  reviews.dependencyReview,
)
assert.deepEqual(
  await repository.rereadLicenseReview({
    reviewRef: reviews.licenseReviewRef,
  }),
  reviews.licenseReview,
)

assert.doesNotThrow(() =>
  assertCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    archiveSafetyReview: reviews.archiveSafetyReview,
    dependencyReview: reviews.dependencyReview,
    licenseReview: reviews.licenseReview,
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: entries,
    buildSourceArchiveEntrySetSha256: sha256AuthorityValue(entries),
    buildSourceArchiveDirectoryEntries: directories,
    requirementsLockSha256:
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
    opencvBuildInformationSha256:
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    opencvLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    opencvContribLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
  }))

const tampered = structuredClone(reviews.licenseReview)
tampered.runtimeReleaseAllowed = true as never
await assert.rejects(() => repository.persistReviewsCreateOnly({
  ...reviews,
  licenseReview: tampered,
}))

const reordered = [...entries].reverse()
assert.throws(() =>
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: reordered,
    buildSourceArchiveEntrySetSha256: sha256AuthorityValue(reordered),
    buildSourceArchiveDirectoryEntries: directories,
    requirementsLockSha256:
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
    opencvBuildInformationSha256:
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    opencvLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    opencvContribLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    preparedAt: '2026-08-05T17:20:00.000Z',
  }))

const changedRuntimeEntries = entries.map((entry) => entry.path ===
  `${root}/opencv/install/lib/libopencv_core.so.412`
  ? { ...entry, sha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }
  : entry)
const changedRuntimeReviews =
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: changedRuntimeEntries,
    buildSourceArchiveEntrySetSha256:
      sha256AuthorityValue(changedRuntimeEntries),
    buildSourceArchiveDirectoryEntries: directories,
    requirementsLockSha256:
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
    opencvBuildInformationSha256:
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    opencvLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    opencvContribLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    preparedAt: '2026-08-05T17:20:00.000Z',
  })
assert.notEqual(
  changedRuntimeReviews.dependencyReview.opencvCuda.runtimeArtifactSetSha256,
  reviews.dependencyReview.opencvCuda.runtimeArtifactSetSha256,
)
assert.notEqual(
  changedRuntimeReviews.dependencyReview.reviewHash,
  reviews.dependencyReview.reviewHash,
)

const changedNppEntries = entries.map((entry) => entry.path ===
  `${root}/cuda-npp/lib/libnppc.so.12`
  ? { ...entry, sha256: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' }
  : entry)
assert.throws(() =>
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: changedNppEntries,
    buildSourceArchiveEntrySetSha256: sha256AuthorityValue(changedNppEntries),
    buildSourceArchiveDirectoryEntries: directories,
    requirementsLockSha256:
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
    opencvBuildInformationSha256:
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    opencvLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    opencvContribLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    preparedAt: '2026-08-05T17:20:00.000Z',
  }))

assert.throws(() =>
  createCanonicalTrackAllSam31L4TaskQaPrivateCapsuleReviews({
    buildSourceCoordinate: coordinate,
    buildSourceArtifactRef,
    buildSourceArchiveEntries: entries,
    buildSourceArchiveEntrySetSha256: sha256AuthorityValue(entries),
    buildSourceArchiveDirectoryEntries: directories.filter((directory) =>
      directory !== `${root}/python/wheelhouse`),
    requirementsLockSha256:
      '604f3858bb13b333d99c51aaf1a4c4a668b6a25408fc48fad37ca9778f58e5ac',
    opencvBuildInformationSha256:
      'd691f963c6132152b4c7f450550bf0ab458f0d89eabaadbaa6e5be8ecbd827ae',
    opencvLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    opencvContribLicenseSha256:
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    preparedAt: '2026-08-05T17:20:00.000Z',
  }))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return reviews.archiveSafetyReview.schemaVersion
  },
})
await assert.rejects(() => repository.persistReviewsCreateOnly({
  archiveSafetyReview: hostile as never,
  dependencyReview: reviews.dependencyReview,
  licenseReview: reviews.licenseReview,
}))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-private-capsule-review',
  checks: 27,
  exactArchiveEntrySetBound: true,
  cloudBuildSourceDirectoryEnvelopeBound: true,
  missingParentDirectoryRejected: true,
  exactHashLockedPythonDependencySetBound: true,
  exactOpenCvCudaRuntimeArtifactSetBound: true,
  exactCudaNppElfDependencySetBound: true,
  exactWheelMetadataAndLicenseEvidenceBound: true,
  proprietaryCudaLicenseNarrowedToPrivateNvidiaInfrastructureUse: true,
  malwareContentClassificationClaimed: false,
  postBuildSpdxSbomLicenseAndVulnerabilityRereadRequired: true,
  packageOrModelInstalledOnDeveloperMachine: false,
  imageBuildStarted: false,
  gpuJobStarted: false,
  runtimeReleaseGranted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
