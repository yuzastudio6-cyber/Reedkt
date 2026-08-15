import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-npp-offline-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-npp-offline-successor.ts',
  'utf8',
)
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const qualificationImageAuthority = readFileSync(
  'server/model-artifacts/canonical-sam3_1-qualification-image-build-authority.ts',
  'utf8',
)
const productionImageAuthority = readFileSync(
  'server/model-artifacts/canonical-sam3_1-cloud-image-build-authority.ts',
  'utf8',
)
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const capsuleBuilder = readFileSync(
  'docker/prod/gpu-worker/sam3_1/build-qualification-capsule.sh',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-c893bf6897e7a9eda6be',
    'sha256:c893bf6897e7a9eda6be8155865980d768cc01684409430030be994d539d87d4',
    '81dc732c-8ad4-4351-8b11-f4474cc63025',
    'a2b810223ecd985bf183cda5b7b47f9c5963546134c28ab1b08dcc50705e01b9',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50',
    '67641cdcb33ac15bd2aad13076c61a35627385daa8afe2e61d2c04512436f547',
    'sam31-qualification-image-build-npp-offline-successor-8',
    'pinned_torchcodec_cuda_wheel_missing_npp_runtime',
    'pinned_official_nvidia_npp_runtime_closure_for_torchcodec_cuda',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `NPP-offline successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'npp_offline',
  'sam31-qualification-capsule-reproducibility-npp-offline-20260807',
  '8ba8ba82-b8d0-43a6-bb08-9fafd517d78d',
  '1653c80d-7066-4314-be62-b0a3c6afd66c',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `NPP-offline reproducibility publisher lost ${expected}`,
)

for (const expected of [
  'sam31-qualification-image-capsule-npp-offline-v1',
  'sam31-qualification-capsule-reproducibility-npp-offline-20260807',
  "cloudBuildMachineType: 'E2_STANDARD_2'",
] as const) assert.ok(
  publication.includes(expected),
  `NPP-offline publication lost ${expected}`,
)

for (const authority of [
  qualificationImageAuthority,
  productionImageAuthority,
] as const) {
  for (const expected of [
    'libnpp-12-8_12.3.3.100-1_amd64.deb',
    '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992',
  ] as const) assert.ok(
    authority.includes(expected),
    `SAM 3.1 image authority lost exact NPP closure ${expected}`,
  )
}

for (const source of [qualificationDockerfile, capsuleBuilder] as const) {
  for (const expected of [
    '69c1468de02b2951a3c9755a76b8246b83fbf4d8f137fd1e843767a76c344ae7',
    'bc1f7c1797fda52d0b333f91d65af2add1deeaa0e4cf5b5ae8a58e1d54117fe2',
    'e2c71babfd18a8e69542dd7e9ca018f9caa438094001a58e6bc4d8c999bf0d07',
  ] as const) assert.ok(
    source.includes(expected),
    `SAM 3.1 NPP runtime closure lost exact binary/license hash ${expected}`,
  )
}

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-npp-offline-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-npp-offline-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-npp-offline-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-npp-offline-successor.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-npp-offline-successor',
  predecessorTerminalRereadRequired: true,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  officialNvidiaNppRuntimeRequired: true,
  exactNppBinaryAndLicenseHashesRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
