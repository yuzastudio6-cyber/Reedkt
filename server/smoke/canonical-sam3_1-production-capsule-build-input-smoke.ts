import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31CloudImageBuildRepository,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31ProductionCapsuleBuildInputOwner,
} from '../services/canonical-sam3_1-production-capsule-build-input-owner'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { release } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'
import { canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'

const sourceCapsuleRef =
  release.qualification.controlledObservation.dependencyClosureRef
const sourceManifest = {
  manifestId: sourceCapsuleRef.id,
  manifestVersion: 1 as const,
  manifestHash: sourceCapsuleRef.contentHash.slice(7),
  candidateRef: {
    candidateHash: release.qualification.candidateRef.candidateHash,
  },
  capsule: {
    coordinate: {
      projectId: 'reeditpro',
      bucketName:
        'reeditpro-production-reeditpro-image-build-inputs',
      objectName:
        'private/image-build-inputs/sam3_1/qualification/reproducibility/11111111-1111-4111-8111-111111111111/'
        + `${'a'.repeat(64)}.tar.gz`,
      generation: '9001',
      etag: 'qualification-capsule-etag-9001',
      byteLength: 1_024,
      sha256: 'a'.repeat(64),
      storageContentType: 'application/x-tar',
      crc32c: 'AAAAAA==',
      md5Hash: 'BBBBBB==',
    },
  },
  securityBoundary: { checkpointBytesIncluded: false as const },
}
const request = {
  sourceCheckpointQualificationRef:
    release.sourceCheckpointQualificationRef,
}
const objectStore = createObjectPort()
const imageBuildRepository = createCanonicalSam31CloudImageBuildRepository({
  objectPort: objectStore.port,
})
const owner = createOwner()
const result = await owner.prepare(request)

assert.equal(result.status, 'ready_for_two_independent_cloud_builds')
assert.deepEqual(
  result.sourceQualificationCapsuleManifestRef,
  sourceCapsuleRef,
)
assert.equal(
  canonicalIngest.evidenceClass,
  'canonical_private_reread',
)
assert.match(result.artifactBindingRef.contentHash, /^sha256:[a-f0-9]{64}$/u)
assert.equal(result.canonicalReleaseManifestIngestAndBindingReread, true)
assert.equal(result.callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted,
  false)
assert.equal(result.cloudBuildStarted, false)
assert.equal(result.imageBuildStarted, false)
assert.equal(result.modelExecuted, false)
assert.equal(result.developerMachineModelInstallPerformed, false)
assert.equal(result.customerCreditsMutated, false)
assert.equal(result.runtimeReleaseGranted, false)
assert.equal(result.productionAuthorityGranted, false)
assert.match(result.sourceCapsuleManifestRecord.objectName,
  /^private\/sam3_1\/qualification-image-build\/v1\/manifest\//u)
assert.match(result.qualificationReleaseRecord.objectName,
  /^private\/sam3_1\/source-checkpoint-qualification\/v1\/releases\//u)
assert.match(result.artifactBindingRecord.objectName,
  /^private\/sam3_1\/cloud-image-build\/v1\/artifact-bindings\//u)

await assert.rejects(owner.prepare({ ...request, command: 'gcloud builds' }))
await assert.rejects(createOwner({ manifest: null }).prepare(request))
await assert.rejects(createOwner({
  manifest: { ...sourceManifest, manifestId: 'crossed-manifest' },
}).prepare(request))
await assert.rejects(createOwner({
  manifest: {
    ...sourceManifest,
    capsule: {
      coordinate: {
        ...sourceManifest.capsule.coordinate,
        callerPath: '/tmp/injected',
      },
    },
  } as unknown as typeof sourceManifest,
}).prepare(request))
await assert.rejects(createOwner({ missingControlRecord: true }).prepare(
  request,
))

const builder = readFileSync(
  'docker/prod/gpu-worker/sam3_1/build-production-capsule.sh',
  'utf8',
)
const dockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.production-capsule-builder',
  'utf8',
)
const cloudBuild = readFileSync(
  'docker/prod/gpu-worker/sam3_1/cloudbuild.production-capsule.yaml',
  'utf8',
)
const launcher = readFileSync(
  'scripts/gcp/prod/53-build-sam31-production-capsule-twice.sh',
  'utf8',
)
const gcloudIgnore = readFileSync(
  'docker/prod/gpu-worker/sam3_1/.gcloudignore.production-capsule',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const expected of [
  'source-qualification-capsule.tar.gz',
  'source-qualification-capsule-manifest.json',
  'source-checkpoint-qualification-release.json',
  'private-artifact-build-binding.json',
  'qualification did not use this exact source capsule',
  'source capsule dependency lineage changed',
  'python-ingest/einops/einops-ingest-receipt.json',
  'python-ingest/pycocotools/pycocotools-ingest-receipt.json',
  'os-security-updates/openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'os-security-updates/libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'os-security-updates/libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  'os-security-updates/security-update-receipt.json',
  '--format=ustar',
  "--mtime='@0'",
  'gzip --no-name --best',
  'weeditpro-sam3_1-production-capsule-builder-result-v2',
  'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
  'canonical-sam3_1-image-build-artifact-binding-v3',
  'historicalBatchQualificationCastOrRelabelUsed',
  'sourceCheckpointQualificationReceiptIncluded',
  'callerPathUrlCommandImageTagOrBuildArgumentAccepted',
  'sort_keys=False',
  'sort_keys=True',
  "producer's canonical comparator",
  '0003-weeditpro-multiplex-session-gpu-forwarding.patch',
  'multiplexSessionGpuForwardingPatchSha256',
  '0004-weeditpro-forward-propagation-frame-count.patch',
  'forwardPropagationFrameCountPatchSha256',
  '0002-weeditpro-importlib-resources.patch',
  '"runnerSha256": by_path[repository_paths[5]]["sha256"]',
  '"sourceProvenanceLockSha256": by_path[repository_paths[6]]["sha256"]',
] as const) assert.ok(builder.includes(expected), `builder lost ${expected}`)
assert.doesNotMatch(
  builder,
  /(?:sam3\.1_multiplex\.pt|huggingface\.co|HF_TOKEN|GOOGLE_APPLICATION_CREDENTIALS)/u,
)
for (const expected of [
  'Dockerfile.candidate',
  'runner.py',
  'entrypoint.sh',
  'source-provenance.lock',
  '0001-reeditpro-gpu-decode.patch',
  '0002-weeditpro-importlib-resources.patch',
  '0003-weeditpro-multiplex-session-gpu-forwarding.patch',
  '0004-weeditpro-forward-propagation-frame-count.patch',
  'build-production-capsule.sh',
  'pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081',
] as const) assert.ok(dockerfile.includes(expected),
  `production builder Dockerfile lost ${expected}`)
for (const expected of [
  'reread-exact-canonical-control-records',
  'validate-qualified-source-capsule-coordinate',
  'reread-exact-qualified-source-capsule',
  'python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0',
  '--if-generation-match',
  'build-fixed-production-capsule',
  'full-archive-security-review',
  '--scan-archive=yes',
  'wc -c <',
  '4293918720',
  'upload-create-only-production-evidence',
  '--if-generation-match=0',
  '--content-type=application/gzip',
  'weeditpro-sam3_1-production-capsule-security-review-v2',
  'private/sam3_1/source-checkpoint-qualification/v2/releases/',
  'private/sam3_1/cloud-image-build/v2/artifact-bindings/',
  'weeditpro-sam31-private-artifact-review@sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
] as const) assert.ok(cloudBuild.includes(expected),
  `production Cloud Build lost ${expected}`)
assert.doesNotMatch(cloudBuild, /stat --format/u)
assert.doesNotMatch(
  cloudBuild,
  /(?:secretEnv|availableSecrets|sam3\.1_multiplex\.pt|nvidia-l4|a100-80gb|freshclam|\bcurl\b)/iu,
)
assert.equal((launcher.match(/gcloud builds submit/gmu) ?? []).length, 1)
for (const expected of [
  'caller arguments are forbidden',
  'source worktree must be clean',
  'prepare:sam3_1-production-capsule-vertex-build-inputs',
  'canonicalVertexReleaseManifestIngestAndBindingReread',
  'ready_for_two_independent_cloud_builds',
  'primaryBuildId',
  'confirmationBuildId',
  'independentBuildCount',
  '--ignore-file',
  'durableCreateOnlyAdmissionReread',
  'durableCreateOnlyConsumptionPerSlot',
  'durableSubmissionRereadPerSlot',
  'automaticRetryAllowed',
  'uncertainOutcomeRequiresObservation',
  'outcome remains unknown; automatic retry is forbidden',
  'submit_or_reread_slot primary',
  'submit_or_reread_slot confirmation',
  '--if-generation-match=0',
  'gcloud builds list',
] as const) assert.ok(launcher.includes(expected), `launcher lost ${expected}`)
assert.match(launcher, /automaticRetryAllowed': False/u)
assert.doesNotMatch(launcher, /automaticRetryAllowed': True/u)
for (const expected of [
  '_PRODUCTION_CAPSULE_PUBLICATION_ID',
  '_PRODUCTION_CAPSULE_BUILD_SLOT',
  'primary|confirmation',
] as const) assert.ok(cloudBuild.includes(expected),
  `production Cloud Build lost durable dual-build identity ${expected}`)
for (const expected of [
  '!.gcloudignore.production-capsule',
  '!Dockerfile.production-capsule-builder',
  '!Dockerfile.candidate',
  '!build-production-capsule.sh',
  '!cloudbuild.production-capsule.yaml',
  '!entrypoint.sh',
  '!runner.py',
  '!patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch',
  '!patches/0004-weeditpro-forward-propagation-frame-count.patch',
] as const) assert.ok(gcloudIgnore.includes(expected),
  `.gcloudignore lost ${expected}`)
assert.equal(
  packageJson.scripts?.['prepare:sam3_1-production-capsule-vertex-build-inputs'],
  'tsx server/cli/prepare-canonical-sam3_1-production-capsule-vertex-build-inputs.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-capsule-build-input',
  checks: 52,
  exactFinalQualificationReread: true,
  exactSourceQualificationCapsuleReread: true,
  artifactBindingCreatedAndReread: true,
  twoIndependentCloudBuildSubmissionsRequired: true,
  durableOneUseBuildSlotConsumption: true,
  uncertainOutcomeAutomaticRetryAllowed: false,
  restartReconcilesInsteadOfResubmitting: true,
  deterministicArchive: true,
  fullArchiveSecurityReviewPerBuild: true,
  checkpointIncluded: false,
  modelExecuted: false,
  developerMachineModelInstallPerformed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function createOwner(overrides: {
  readonly manifest?: typeof sourceManifest | null
  readonly missingControlRecord?: boolean
} = {}) {
  return createCanonicalSam31ProductionCapsuleBuildInputOwner({
    qualificationReleaseReadPort: {
      async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
        return sourceCheckpointQualificationRef.contentHash ===
          release.sourceCheckpointQualificationRef.contentHash
          ? structuredClone(release)
          : null
      },
    },
    ingestReadPort: {
      async rereadPrivateArtifactIngest({ ingestReceiptRef }) {
        return ingestReceiptRef.contentHash ===
          `sha256:${canonicalIngest.ingestReceiptHash}`
          ? structuredClone(canonicalIngest)
          : null
      },
    },
    sourceCapsuleManifestReadPort: {
      async rereadCapsuleManifest() {
        return overrides.manifest === null
          ? null
          : structuredClone(overrides.manifest ?? sourceManifest)
      },
    },
    imageBuildRepository,
    controlRecordReadPort: {
      async rereadRecord({ objectName, exactValue }) {
        if (overrides.missingControlRecord) return null
        const body = Buffer.from(stableAuthorityStringify(exactValue))
        return {
          bucketName:
            'reeditpro-production-reeditpro-control-plane-state' as const,
          objectName,
          generation: '9201',
          etag: `etag-${createHash('sha256').update(objectName).digest('hex')}`,
          byteLength: body.byteLength,
          sha256: createHash('sha256').update(body).digest('hex'),
        }
      },
    },
  })
}

function createObjectPort() {
  const objects = new Map<string, Buffer>()
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly({ objectPath, body }) {
      const current = objects.get(objectPath)
      if (current) {
        if (!current.equals(body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = objects.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
  return { port, objects }
}
