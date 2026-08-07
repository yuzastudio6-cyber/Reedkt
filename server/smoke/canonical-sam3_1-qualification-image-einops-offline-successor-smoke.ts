import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-einops-offline-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-einops-offline-successor.ts',
  'utf8',
)
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
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
const capsuleCloudBuild = readFileSync(
  'docker/prod/gpu-worker/sam3_1/cloudbuild.qualification-capsule.yaml',
  'utf8',
)
const sourceProvenance = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)
const qualificationImageAuthority = readFileSync(
  'server/model-artifacts/canonical-sam3_1-qualification-image-build-authority.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-53a3659043b611b53acd',
    'sha256:53a3659043b611b53acd1c047f933f8fa02066e7c62642a234111aac960a89bc',
    '887a24eb-f117-4858-af58-50478624a8af',
    '3e60a54e67a41406e98f83a3e748b1e37f1cff07d46eaa488cd6a4619a09c01b',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    '40e6d06db83d1af629e99d618d29ea37fe8408987903e89aa0480f5fb4495187',
    '8a7b4c591b5efbbc299f58b9db4abb44d6c0bc122ff9b7f309d83aecc948d47e',
    'sam31-qualification-image-build-einops-offline-successor-9',
    'official_sam_core_missing_pinned_einops_runtime',
    'pinned_official_einops_wheel_and_scanned_ingest_receipt_offline_closure',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `einops-offline successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'einops_offline',
  'sam31-qualification-capsule-reproducibility-einops-offline-20260807',
  '5339b681-9b0a-4e77-967a-5a8b065e452e',
  'a402319e-e524-4f91-ad86-d8ca30b40311',
  'einops_offline_source_identity_corrected',
  'sam31-qualification-capsule-reproducibility-einops-offline-source-identity-corrected-20260807',
  'd56d7f4a-d5d2-41a2-9098-db22a98f61b1',
  '6db247e8-9dda-46c8-9266-51d3de51cf34',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `einops-offline reproducibility publisher lost ${expected}`,
)

for (const expected of [
  'sam31-qualification-image-capsule-einops-offline-v1',
  'sam31-qualification-capsule-reproducibility-einops-offline-source-identity-corrected-20260807',
  "cloudBuildMachineType: 'E2_STANDARD_2'",
] as const) assert.ok(
  publication.includes(expected),
  `einops-offline publication lost ${expected}`,
)

for (const source of [capsuleBuilder, capsuleCloudBuild] as const) {
  for (const expected of [
    'einops-0.8.2-py3-none-any.whl',
    '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193',
  ] as const) assert.ok(
    source.includes(expected),
    `SAM 3.1 einops closure lost exact wheel ${expected}`,
  )
}

for (const source of [qualificationDockerfile, sourceProvenance] as const) {
  assert.ok(
    source.includes('0.8.2'),
    'SAM 3.1 einops closure lost the exact installed version',
  )
}

for (const expected of [
  '1786106120404202',
  '1786106528199762',
  'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
] as const) assert.ok(
  sourceProvenance.includes(expected),
  `SAM 3.1 einops closure lost immutable ingest lineage ${expected}`,
)

for (const expected of [
  'einops-0.8.2-py3-none-any.whl',
  '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193',
  'python-ingest/einops/einops-ingest-receipt.json',
  'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
] as const) assert.ok(
  qualificationImageAuthority.includes(expected),
  `qualification authority lost exact einops admission ${expected}`,
)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-einops-offline-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-einops-offline-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-einops-offline-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-einops-offline-successor.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-einops-offline-successor',
  predecessorTerminalRereadRequired: true,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  officialEinopsWheelRequired: true,
  immutableWheelAndScanReceiptLineageRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
