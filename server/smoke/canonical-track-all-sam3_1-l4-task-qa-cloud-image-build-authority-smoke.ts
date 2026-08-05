import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  canonicalTrackAllSam31L4TaskQaCloudBuildBodyDigest,
  compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
  createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule,
  prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const sha256 = (value: string | Buffer): string => createHash('sha256')
  .update(value)
  .digest('hex')
const ref = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${sha256(id)}` as const,
})
const privateDirectory = 'track_all_task_qa_private_build_input'
const buildFiles = new Map<string, Buffer>([
  ['docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
    Buffer.from('fixed-offline-dockerfile', 'utf8')],
  ['docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh',
    Buffer.from('fixed-entrypoint', 'utf8')],
  ['docker/prod/gpu-worker/track-all-task-qa/runner.py',
    Buffer.from('fixed-runner', 'utf8')],
  ['docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock',
    Buffer.from('fixed-source-provenance', 'utf8')],
  ['docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
    Buffer.from('fixed-private-input-verifier', 'utf8')],
  [`${privateDirectory}/capsule-manifest.json`,
    Buffer.from('fixed-capsule-manifest', 'utf8')],
  [`${privateDirectory}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    Buffer.from('synthetic-contract-cuda-package', 'utf8')],
  [`${privateDirectory}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    Buffer.from('fixed-cuda-receipt', 'utf8')],
  [`${privateDirectory}/opencv/opencv-cuda-receipt.json`,
    Buffer.from('fixed-opencv-cuda-receipt', 'utf8')],
  [`${privateDirectory}/opencv/opencv-build-information.txt`,
    Buffer.from('fixed-opencv-build-information', 'utf8')],
  [`${privateDirectory}/opencv/LICENSE`,
    Buffer.from('fixed-apache-license', 'utf8')],
  [`${privateDirectory}/opencv/CONTRIB_LICENSE`,
    Buffer.from('fixed-opencv-contrib-apache-license', 'utf8')],
  [`${privateDirectory}/opencv/install/python/cv2.cpython-312-x86_64-linux-gnu.so`,
    Buffer.from('synthetic-opencv-python-module', 'utf8')],
  [`${privateDirectory}/opencv/install/lib/libopencv_core.so.4.12.0`,
    Buffer.from('synthetic-opencv-shared-library', 'utf8')],
  [`${privateDirectory}/python/requirements.lock.txt`,
    Buffer.from('fixed-requirements-lock', 'utf8')],
  [`${privateDirectory}/python/wheelhouse/kornia-0.8.3-py2.py3-none-any.whl`,
    Buffer.from('synthetic-contract-wheel', 'utf8')],
])
const buildSourceEntries = [...buildFiles.entries()]
  .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  .map(([path, body]) => ({
    path,
    byteLength: body.byteLength,
    sha256: sha256(body),
  }))
const sourceBody = gzipSync(createCanonicalTar(buildFiles))
const sourceSha256 = sha256(sourceBody)
const manifestSha256 = sha256(buildFiles.get(
  `${privateDirectory}/capsule-manifest.json`,
)!)

const capsule = createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule({
  capsuleId: 'track-all-l4-task-qa-private-build-capsule-1',
  capsuleVersion: 1,
  evidenceClass: 'synthetic_contract_fixture',
  status: 'contract_only',
  operationId: 'tool.kornia.refine_mask.v1',
  accelerator: 'nvidia_l4',
  routeId: 'l4_standard_primary',
  sourceCommitSha: sha256('source-commit').slice(0, 40),
  sourceTreeSha: sha256('source-tree').slice(0, 40),
  sourceWorktreeClean: true,
  buildSourceCoordinate: {
    projectId: 'reeditpro',
    bucketName: 'reeditpro-production-reeditpro-image-build-inputs',
    objectName:
      `private/image-build-inputs/track-all-l4-task-qa/${sourceSha256}.tar.gz`,
    generation: '1785944000000000',
    etag: 'track-all-l4-private-build-source-etag',
    byteLength: sourceBody.byteLength,
    sha256: sourceSha256,
  },
  buildSourceArtifactRef: {
    id: 'track-all-l4-private-build-source',
    version: 1,
    contentHash: `sha256:${sourceSha256}`,
  },
  buildSourceArchiveEntries: buildSourceEntries,
  buildSourceArchiveEntrySetSha256: sha256AuthorityValue(
    buildSourceEntries,
  ),
  dockerfilePath:
    'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
  dockerfileSha256: sha256(buildFiles.get(
    'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
  )!),
  runnerSha256: sha256(buildFiles.get(
    'docker/prod/gpu-worker/track-all-task-qa/runner.py',
  )!),
  entrypointSha256: sha256(buildFiles.get(
    'docker/prod/gpu-worker/track-all-task-qa/entrypoint.sh',
  )!),
  verifierSha256: sha256(buildFiles.get(
    'docker/prod/gpu-worker/track-all-task-qa/verify-private-build-input.py',
  )!),
  sourceProvenanceLockSha256: sha256(buildFiles.get(
    'docker/prod/gpu-worker/track-all-task-qa/source-provenance.lock',
  )!),
  privateInput: {
    directoryName: privateDirectory,
    capsuleManifestRef: {
      id: 'track-all-l4-private-capsule-manifest',
      version: 1,
      contentHash: `sha256:${manifestSha256}`,
    },
    capsuleManifestSha256: manifestSha256,
    requirementsLockSha256: sha256(buildFiles.get(
      `${privateDirectory}/python/requirements.lock.txt`,
    )!),
    opencvCudaReceiptSha256: sha256(buildFiles.get(
      `${privateDirectory}/opencv/opencv-cuda-receipt.json`,
    )!),
    opencvBuildInformationSha256: sha256(buildFiles.get(
      `${privateDirectory}/opencv/opencv-build-information.txt`,
    )!),
    opencvLicenseSha256: sha256(buildFiles.get(
      `${privateDirectory}/opencv/LICENSE`,
    )!),
    opencvContribLicenseSha256: sha256(buildFiles.get(
      `${privateDirectory}/opencv/CONTRIB_LICENSE`,
    )!),
    cudaForwardCompatReceiptSha256: sha256(buildFiles.get(
      `${privateDirectory}/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json`,
    )!),
    cudaForwardCompatPackageSha256: sha256(buildFiles.get(
      `${privateDirectory}/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb`,
    )!),
    artifactCount: 11,
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
    archiveSafetyReviewRef: ref('track-all-l4-capsule-archive-safety-review'),
    dependencyReviewRef: ref('track-all-l4-dependency-review'),
    licenseReviewRef: ref('track-all-l4-license-review'),
    callerPathUrlCommandImageTagOrBuildArgsAccepted: false,
    developerMachineModelInstallAllowed: false,
  },
  preparedAt: '2026-08-05T13:00:00.000Z',
})

const buildSourceReadPort = {
  async readExact() {
    return {
      generationBeforeRead: capsule.buildSourceCoordinate.generation,
      etagBeforeRead: capsule.buildSourceCoordinate.etag,
      body: sourceBody,
      generationAfterRead: capsule.buildSourceCoordinate.generation,
      etagAfterRead: capsule.buildSourceCoordinate.etag,
    }
  },
}

const authority =
  await prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority({
    authorityId: 'track-all-l4-task-qa-cloud-image-build-authority-1',
    capsule,
    privateBuildSourceReadPort: buildSourceReadPort,
    preparedAt: '2026-08-05T13:01:00.000Z',
  })
assert.equal(authority.operationId, 'tool.kornia.refine_mask.v1')
assert.equal(authority.imageDestination.imageName,
  'reeditpro-track-all-l4-task-qa')
assert.equal(authority.imageDestination.tag,
  `track-all-l4-qa-${sourceSha256.slice(0, 16)}`)
assert.equal(authority.authority.exactPrivateBuildSourceReread, true)
assert.equal(authority.authority.checkpointOrModelWeightsIncluded, false)
assert.equal(authority.authority.cloudImageBuildAuthorized, false)
assert.equal(authority.authority.gpuJobDispatched, false)

const request = compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
  authority,
)
assert.equal(request.endpoint,
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds')
assert.equal(request.method, 'POST')
assert.equal(request.automaticRetryAllowed, false)
assert.equal(request.cloudCallAuthorized, false)
assert.equal(request.developerMachineModelInstallAllowed, false)
assert.equal(request.productionReady, false)
const body = request.body as {
  source: { storageSource: Record<string, string> }
  steps: Array<{ name: string, entrypoint: string, args: string[] }>
  images: string[]
  serviceAccount: string
}
assert.deepEqual(body.source.storageSource, {
  bucket: 'reeditpro-production-reeditpro-image-build-inputs',
  object:
    `private/image-build-inputs/track-all-l4-task-qa/${sourceSha256}.tar.gz`,
  generation: '1785944000000000',
  sourceFetcher: 'GCS_FETCHER',
})
assert.equal(body.steps.length, 1)
assert.equal(body.steps[0]?.entrypoint, 'docker')
assert.equal(body.steps[0]?.args[0], 'build')
assert.ok(body.steps[0]?.args.includes('--pull=false'))
assert.ok(body.steps[0]?.args.includes('--no-cache'))
assert.ok(body.steps[0]?.args.includes('--network=none'))
assert.ok(body.steps[0]?.args.includes('--platform=linux/amd64'))
assert.ok(body.steps[0]?.args.includes(
  'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate',
))
assert.equal(body.images[0], authority.imageDestination.taggedUri)
assert.equal(body.serviceAccount,
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com')
assert.doesNotMatch(JSON.stringify(body), /sam3\.1_multiplex|facebook\/sam|checkpoint/iu)
assert.doesNotMatch(JSON.stringify(body), /secret|token|customer.media/iu)
assert.equal(canonicalTrackAllSam31L4TaskQaCloudBuildBodyDigest(request).length,
  64)

const tamperedAuthority = structuredClone(authority)
tamperedAuthority.imageDestination.tag =
  'track-all-l4-qa-0000000000000000'
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(
    tamperedAuthority,
  ))

const crossedCapsule = structuredClone(capsule)
crossedCapsule.buildSourceArtifactRef.contentHash =
  `sha256:${sha256('other-source')}`
const {
  capsuleHash: _crossedCapsuleHash,
  schemaVersion: _crossedCapsuleVersion,
  source: _crossedCapsuleSource,
  ...crossedCapsuleInput
} = crossedCapsule
assert.equal(_crossedCapsuleHash, capsule.capsuleHash)
assert.equal(_crossedCapsuleVersion, capsule.schemaVersion)
assert.equal(_crossedCapsuleSource, capsule.source)
assert.throws(() =>
  createCanonicalTrackAllSam31L4TaskQaPrivateBuildCapsule({
    ...crossedCapsuleInput,
  }))

await assert.rejects(
  prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority({
    authorityId: 'track-all-l4-task-qa-cloud-image-build-authority-stale',
    capsule,
    privateBuildSourceReadPort: {
      async readExact() {
        return {
          generationBeforeRead: capsule.buildSourceCoordinate.generation,
          etagBeforeRead: capsule.buildSourceCoordinate.etag,
          body: sourceBody,
          generationAfterRead: '1785944000000001',
          etagAfterRead: capsule.buildSourceCoordinate.etag,
        }
      },
    },
    preparedAt: '2026-08-05T13:02:00.000Z',
  }),
)

await assert.rejects(
  prepareCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority({
    authorityId: 'track-all-l4-task-qa-cloud-image-build-authority-crossed',
    capsule,
    privateBuildSourceReadPort: {
      async readExact() {
        return {
          generationBeforeRead: capsule.buildSourceCoordinate.generation,
          etagBeforeRead: capsule.buildSourceCoordinate.etag,
          body: Buffer.from('wrong-private-build-source', 'utf8'),
          generationAfterRead: capsule.buildSourceCoordinate.generation,
          etagAfterRead: capsule.buildSourceCoordinate.etag,
        }
      },
    },
    preparedAt: '2026-08-05T13:03:00.000Z',
  }),
)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return authority.schemaVersion
  },
})
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(hostile))
assert.equal(getterInvoked, false)

const cyclic: Record<string, unknown> = {}
cyclic.self = cyclic
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(cyclic))

console.log(JSON.stringify({
  smoke:
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority',
  checks: 32,
  exactPrivateBuildSourceBytesGenerationAndEtagReread: true,
  fixedOfflineCloudBuildRequestCompiled: true,
  callerImageTagPathCommandEnvironmentOrBuildArgsAccepted: false,
  samCheckpointOrModelWeightsIncluded: false,
  developerMachineModelInstallAllowed: false,
  cloudBuildCalled: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createCanonicalTar(files: ReadonlyMap<string, Buffer>): Buffer {
  const parts: Buffer[] = []
  for (const [path, body] of [...files.entries()].sort(
    ([left], [right]) => left < right ? -1 : left > right ? 1 : 0,
  )) {
    const header = Buffer.alloc(512)
    const split = splitTarPath(path)
    writeTarText(header, 0, 100, split.name)
    writeTarOctal(header, 100, 8, 0o444)
    writeTarOctal(header, 108, 8, 0)
    writeTarOctal(header, 116, 8, 0)
    writeTarOctal(header, 124, 12, body.byteLength)
    writeTarOctal(header, 136, 12, 0)
    header.fill(32, 148, 156)
    header[156] = 48
    writeTarText(header, 257, 6, 'ustar')
    writeTarText(header, 263, 2, '00')
    writeTarText(header, 345, 155, split.prefix)
    let checksum = 0
    for (const byte of header) checksum += byte
    const checksumText = checksum.toString(8).padStart(6, '0')
    header.write(checksumText, 148, 6, 'ascii')
    header[154] = 0
    header[155] = 32
    parts.push(header, body)
    const padding = (512 - (body.byteLength % 512)) % 512
    if (padding > 0) parts.push(Buffer.alloc(padding))
  }
  parts.push(Buffer.alloc(1_024))
  return Buffer.concat(parts)
}

function splitTarPath(path: string): { name: string, prefix: string } {
  if (Buffer.byteLength(path, 'utf8') <= 100) {
    return { name: path, prefix: '' }
  }
  const separator = path.lastIndexOf('/')
  const name = path.slice(separator + 1)
  const prefix = path.slice(0, separator)
  assert.ok(Buffer.byteLength(name, 'utf8') <= 100)
  assert.ok(Buffer.byteLength(prefix, 'utf8') <= 155)
  return { name, prefix }
}

function writeTarText(
  target: Buffer,
  offset: number,
  length: number,
  value: string,
): void {
  const body = Buffer.from(value, 'utf8')
  assert.ok(body.byteLength <= length)
  body.copy(target, offset)
}

function writeTarOctal(
  target: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  const body = value.toString(8).padStart(length - 1, '0')
  target.write(body, offset, length - 1, 'ascii')
  target[offset + length - 1] = 0
}
