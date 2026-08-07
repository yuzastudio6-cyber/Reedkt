import assert from 'node:assert/strict'

import {
  assertCanonicalSam31QualificationCapsuleReproducibility,
  createCanonicalSam31QualificationCapsuleReproducibility,
} from '../model-artifacts/canonical-sam3_1-qualification-capsule-reproducibility'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const digest = (value: string) => sha256AuthorityValue(value)
const capsuleSha = digest('capsule')
const commit = '1'.repeat(40)
const tree = '2'.repeat(40)
const entries = Array.from({ length: 14 }, (_, index) => ({
  path: `sam31_private_build_input/fixture-${String(index).padStart(2, '0')}.bin`,
  byteLength: index + 1,
  sha256: digest(`entry-${index}`),
}))
const builder = {
  schemaVersion: 'weeditpro-sam3_1-qualification-capsule-builder-result-v1',
  repositoryCommit: commit,
  repositoryTree: tree,
  capsuleSha256: capsuleSha,
  capsuleByteLength: 200_521_471,
  archiveEntries: entries,
  archiveEntrySetSha256: sha256AuthorityValue(entries),
  dependencyWheelCount: 23,
  dependencyWheelManifestSha256: digest('wheels'),
  dependencyLockSha256: digest('lock'),
  dependencyClosureReceiptSha256: digest('closure'),
  patchApplicationReceiptSha256: digest('patch'),
  cudaForwardCompatIngestReceiptSha256: digest('cuda'),
  checkpointIncluded: false,
  qualificationReceiptIncluded: false,
  containsCredentials: false,
  containsCustomerMedia: false,
}

const buildIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
] as const
const scans = buildIds.map((buildId) => {
  const payload = {
    schemaVersion:
      'weeditpro-sam3_1-qualification-capsule-malware-scan-v1',
    buildId,
    scannerImageDigest:
      'sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
    scannerVersion: 'ClamAV 1.4.3/28084/Thu Aug 6 06:24:46 2026',
    signatureCount: 3_628_003,
    scannedFileCount: 1,
    infectedFileCount: 0,
    capsuleSha256: capsuleSha,
    capsuleByteLength: builder.capsuleByteLength,
    archiveRecursionEnabled: true,
    scanPassed: true,
    checkpointIncluded: false,
    modelExecuted: false,
    developerMachineInstallPerformed: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  }
  return { ...payload, scanReceiptHash: sha256AuthorityValue(payload) }
})
const coordinates = buildIds.map((buildId, index) => ({
  projectId: 'reeditpro',
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs',
  objectName:
    `private/image-build-inputs/sam3_1/qualification/reproducibility/${buildId}/${capsuleSha}.tar.gz`,
  generation: `178607900000000${index + 1}`,
  etag: `capsule-etag-${index + 1}`,
  byteLength: builder.capsuleByteLength,
  sha256: capsuleSha,
  storageContentType: 'application/x-tar',
  crc32c: '4qOydw==',
  md5Hash: '4JC51o7xe767KfL8mXAYgg==',
}))
const input = {
  receiptId: 'sam31-qualification-capsule-reproducibility-20260807',
  primary: {
    builderResult: builder,
    builderResultFileSha256: digest('builder-result'),
    malwareScan: scans[0],
    malwareScanFileSha256: digest('scan-one'),
    coordinate: coordinates[0],
  },
  confirmation: {
    builderResult: structuredClone(builder),
    builderResultFileSha256: digest('builder-result'),
    malwareScan: scans[1],
    malwareScanFileSha256: digest('scan-two'),
    coordinate: coordinates[1],
  },
  observedAt: '2026-08-07T05:20:00.000Z',
}

const receipt = createCanonicalSam31QualificationCapsuleReproducibility(input)
assert.deepEqual(
  assertCanonicalSam31QualificationCapsuleReproducibility(receipt),
  receipt,
)
assert.equal(receipt.independentBuildCount, 2)
assert.equal(receipt.capsuleSha256, capsuleSha)

const changedCapsule = structuredClone(input)
changedCapsule.confirmation.coordinate.sha256 = digest('changed-capsule')
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(changedCapsule))

const reusedBuild = structuredClone(input)
reusedBuild.confirmation.malwareScan.buildId = buildIds[0]
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(reusedBuild))

const changedBuilderFile = structuredClone(input)
changedBuilderFile.confirmation.builderResultFileSha256 =
  digest('changed-builder-result-file')
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(
    changedBuilderFile,
  ))

const scanTamper = structuredClone(input)
scanTamper.confirmation.malwareScan.infectedFileCount = 1
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(scanTamper))

const wrongStorageType = structuredClone(input)
wrongStorageType.primary.coordinate.storageContentType = 'application/gzip'
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(wrongStorageType))

const inherited = Object.create(input)
assert.throws(() =>
  createCanonicalSam31QualificationCapsuleReproducibility(inherited))

const tamperedReceipt = structuredClone(receipt)
tamperedReceipt.capsuleByteLength += 1
assert.throws(() =>
  assertCanonicalSam31QualificationCapsuleReproducibility(tamperedReceipt))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-capsule-reproducibility',
  independentBuildCount: receipt.independentBuildCount,
  exactBuilderResultEqualityVerified: true,
  exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: true,
  independentFullArchiveMalwareScansPassed: true,
  crossBuildOrMetadataSubstitutionRejected: true,
  checkpointIncluded: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  qualificationAuthorityGranted: false,
  productionReady: false,
}, null, 2))
