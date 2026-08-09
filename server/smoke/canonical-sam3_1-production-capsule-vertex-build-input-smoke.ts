import assert from 'node:assert/strict'

import {
  createCanonicalSam31ProductionCapsuleVertexBuildInputOwner,
} from '../services/canonical-sam3_1-production-capsule-vertex-build-input-owner'
import { release } from
  './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner-smoke'

const sourceManifestRef =
  release.qualification.workerRequest.dependencyClosure.artifactRef
const manifest = {
  manifestId: sourceManifestRef.id,
  manifestVersion: 1 as const,
  manifestHash: sourceManifestRef.contentHash.slice('sha256:'.length),
  candidateRef: release.qualification.candidate,
  capsule: {
    coordinate: {
      projectId: 'reeditpro',
      bucketName: 'reeditpro-production-reeditpro-image-build-inputs',
      objectName:
        'private/image-build-inputs/sam3_1/qualification/reproducibility/'
        + `${'a'.repeat(64)}.tar.gz`,
      generation: '123',
      etag: 'capsule-etag',
      byteLength: 4096,
      sha256: 'a'.repeat(64),
      storageContentType: 'application/gzip',
      crc32c: 'AAAAAA==',
      md5Hash: 'AAAAAAAAAAAAAAAAAAAAAA==',
    },
  },
  securityBoundary: { checkpointBytesIncluded: false as const },
}
const state = {
  release: structuredClone(release) as unknown,
  ingest: structuredClone(release.qualification.ingestReceipt) as unknown,
  manifest: structuredClone(manifest) as typeof manifest | null,
  binding: null as unknown,
}
const owner = createCanonicalSam31ProductionCapsuleVertexBuildInputOwner({
  qualificationReleaseReadPort: {
    async rereadQualificationRelease() {
      return structuredClone(state.release) as typeof release
    },
  },
  ingestReadPort: {
    async rereadPrivateArtifactIngest() {
      return structuredClone(state.ingest)
    },
  },
  sourceCapsuleManifestReadPort: {
    async rereadCapsuleManifest() {
      return structuredClone(state.manifest)
    },
  },
  bindingStore: {
    async persistAndReread({ binding }) {
      state.binding = structuredClone(binding)
      return {
        id: `sam31-vertex-build-binding-${binding.bindingHash.slice(0, 24)}`,
        version: 1 as const,
        contentHash: `sha256:${binding.bindingHash}` as const,
      }
    },
  },
  controlRecordReadPort: {
    async rereadRecord({ objectName, exactValue }) {
      return {
        bucketName:
          'reeditpro-production-reeditpro-control-plane-state' as const,
        objectName,
        generation: '101',
        etag: 'control-etag',
        byteLength: Buffer.byteLength(JSON.stringify(exactValue)),
        sha256: 'b'.repeat(64),
      }
    },
  },
})
const request = {
  sourceCheckpointQualificationRef:
    release.sourceCheckpointQualificationRef,
}
const ready = await owner.prepare(request)
assert.equal(ready.status, 'ready_for_two_independent_cloud_builds')
assert.equal(ready.sourceCheckpointQualificationRef.version, 2)
assert.equal(ready.sourceQualificationCapsuleManifestRef.id,
  sourceManifestRef.id)
assert.equal(ready.legacyBatchRequestResultOrReleaseCastOrRelabelUsed, false)
assert.equal(ready.cloudBuildStarted, false)
assert.equal(ready.modelExecuted, false)
assert.equal(ready.customerCreditsMutated, false)
assert.equal(ready.productionAuthorityGranted, false)
assert.equal(
  (state.binding as { schemaVersion: string }).schemaVersion,
  'canonical-sam3_1-image-build-artifact-binding-v3',
)

const crossedRelease = structuredClone(release)
crossedRelease.qualification.workerRequest.dependencyClosure.artifactRef = {
  ...crossedRelease.qualification.workerRequest.dependencyClosure.artifactRef,
  contentHash: `sha256:${'f'.repeat(64)}`,
}
state.release = crossedRelease
await assert.rejects(owner.prepare(request))
state.release = structuredClone(release)

state.manifest = {
  ...manifest,
  candidateRef: { ...manifest.candidateRef, candidateHash: 'f'.repeat(64) },
}
await assert.rejects(owner.prepare(request))
state.manifest = structuredClone(manifest)

const crossedIngest = structuredClone(release.qualification.ingestReceipt)
crossedIngest.ingestReceiptHash = 'f'.repeat(64)
state.ingest = crossedIngest
await assert.rejects(owner.prepare(request))
state.ingest = structuredClone(release.qualification.ingestReceipt)

const callerField = { ...request, imageTag: 'latest' }
await assert.rejects(owner.prepare(callerField))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-capsule-vertex-build-input',
  checks: 17,
  exactVertexV2QualificationReleaseConsumed: true,
  historicalBatchReleaseCastOrRelabeled: false,
  exactQualificationCapsuleManifestReread: true,
  exactPrivateArtifactIngestReread: true,
  vertexArtifactBindingV3Persisted: true,
  readyForTwoIndependentCloudBuilds: true,
  cloudBuildStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
