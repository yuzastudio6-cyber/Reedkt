import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalSam31QualificationCapsuleReproducibility,
  canonicalSam31QualificationCapsuleReproducibilityDigest,
  createCanonicalSam31QualificationCapsuleReproducibility,
} from '../model-artifacts/canonical-sam3_1-qualification-capsule-reproducibility'
import {
  createCanonicalSam31QualificationCapsuleReproducibilityRepository,
} from '../services/canonical-sam3_1-qualification-capsule-reproducibility-runtime'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const publisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const cloudBuild = readFileSync(
  'docker/prod/gpu-worker/sam3_1/cloudbuild.qualification-capsule.yaml',
  'utf8',
)
for (const expected of [
  'private_closure_offline',
  'sam31-qualification-capsule-reproducibility-private-closure-offline-20260807',
  'e0699b99-31bd-42ed-a342-549f9b989bc1',
  'a4b00853-6919-430f-ad78-6c64509b42f0',
  'npp_offline',
  'sam31-qualification-capsule-reproducibility-npp-offline-20260807',
  '8ba8ba82-b8d0-43a6-bb08-9fafd517d78d',
  '1653c80d-7066-4314-be62-b0a3c6afd66c',
  'einops_offline',
  'sam31-qualification-capsule-reproducibility-einops-offline-20260807',
  '5339b681-9b0a-4e77-967a-5a8b065e452e',
  'a402319e-e524-4f91-ad86-d8ca30b40311',
  'einops_offline_source_identity_corrected',
  'sam31-qualification-capsule-reproducibility-einops-offline-source-identity-corrected-20260807',
  'd56d7f4a-d5d2-41a2-9098-db22a98f61b1',
  '6db247e8-9dda-46c8-9266-51d3de51cf34',
  'pycocotools_offline_source_identity_corrected',
  'sam31-qualification-capsule-reproducibility-pycocotools-offline-source-identity-corrected-20260807',
  '9d115018-1801-451f-b47b-de78d2c644d6',
  'c5e9dad3-1bff-4ac0-8faf-c8fe8c4e1e6b',
  'security_remediation_corrected',
  'sam31-qualification-capsule-reproducibility-security-remediation-corrected-20260807',
  '3e29aa73-7307-454d-bd38-b911b67aeab1',
  '6c209bca-9563-4a5f-be3e-a6b927ac2d6f',
] as const) assert.ok(
  publisher.includes(expected),
  `private offline-closure reproducibility publication lost ${expected}`,
)
assert.match(cloudBuild, /^timeout: 3600s$/mu)
assert.match(cloudBuild, /^queueTtl: 3600s$/mu)
assert.doesNotMatch(cloudBuild, /^queueTtl: 600s$/mu)

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
  archiveEntrySetSha256:
    canonicalSam31QualificationCapsuleReproducibilityDigest(entries),
  dependencyWheelCount: 25,
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
  return {
    ...payload,
    scanReceiptHash:
      canonicalSam31QualificationCapsuleReproducibilityDigest(payload),
  }
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

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalSam31QualificationCapsuleReproducibilityRepository({
    objectPort: {
      async createOnly({ objectPath, body }) {
        if (objects.has(objectPath)) return 'already_exists'
        objects.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = objects.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
  })
const persisted = await repository.persistCreateOnly({ receipt })
assert.equal(persisted.disposition, 'created')
assert.deepEqual(
  await repository.reread({ receiptRef: persisted.receiptRef }),
  receipt,
)
assert.equal(
  (await repository.persistCreateOnly({ receipt })).disposition,
  'identical_replay',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-capsule-reproducibility',
  independentBuildCount: receipt.independentBuildCount,
  exactBuilderResultEqualityVerified: true,
  exactCapsuleShaByteLengthCrc32cAndMd5EqualityVerified: true,
  independentFullArchiveMalwareScansPassed: true,
  createOnlyExactRereadVerified: true,
  crossBuildOrMetadataSubstitutionRejected: true,
  checkpointIncluded: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  qualificationAuthorityGranted: false,
  productionReady: false,
}, null, 2))
