import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-pycocotools-offline-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-pycocotools-offline-successor.ts',
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
    'sam31-qualification-image-terminal-1d78de9253e7bf99b182',
    'sha256:1d78de9253e7bf99b18264c1d2bc8436c8f0bf71f68bede8619f9a4e8368fb32',
    'f36cea98-4b2b-458c-ac2e-a27c3c72f2ca',
    'f13ab324160d0ebbccd933d26b7901c2ec3feacfa441fb3063a6167553d8f887',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    '3286733a4e18866f302d615e36a110c0431cb2cda2092e530dd5dc61c9f00604',
    'f1849332844ab8e0508191c12777ed360790ab569f0a3c807a9c08a427b9e5fd',
    'sam31-qualification-image-build-pycocotools-offline-successor-10',
    'official_sam_core_missing_pinned_pycocotools_runtime',
    'pinned_official_pycocotools_wheel_and_scanned_ingest_receipt_offline_closure',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `pycocotools-offline successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'pycocotools_offline_source_identity_corrected',
  'sam31-qualification-capsule-reproducibility-pycocotools-offline-source-identity-corrected-20260807',
  '9d115018-1801-451f-b47b-de78d2c644d6',
  'c5e9dad3-1bff-4ac0-8faf-c8fe8c4e1e6b',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `pycocotools reproducibility publisher lost ${expected}`,
)

for (const expected of [
  'sam31-qualification-image-capsule-pycocotools-offline-v1',
  'sam31-qualification-capsule-reproducibility-pycocotools-offline-source-identity-corrected-20260807',
  "cloudBuildMachineType: 'E2_STANDARD_2'",
] as const) assert.ok(
  publication.includes(expected),
  `pycocotools publication lost ${expected}`,
)

for (const source of [capsuleBuilder, capsuleCloudBuild] as const) {
  for (const expected of [
    'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
    'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd',
  ] as const) assert.ok(
    source.includes(expected),
    `SAM 3.1 pycocotools closure lost exact wheel ${expected}`,
  )
}

for (const source of [qualificationDockerfile, sourceProvenance] as const) {
  assert.ok(
    source.includes('2.0.11'),
    'SAM 3.1 pycocotools closure lost the exact installed version',
  )
}

for (const expected of [
  '1786112742762071',
  '1786112748711226',
  'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
] as const) assert.ok(
  sourceProvenance.includes(expected),
  `SAM 3.1 pycocotools closure lost immutable ingest lineage ${expected}`,
)

for (const expected of [
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
  'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd',
  'python-ingest/pycocotools/pycocotools-ingest-receipt.json',
  'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
] as const) assert.ok(
  qualificationImageAuthority.includes(expected),
  `qualification authority lost exact pycocotools admission ${expected}`,
)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-pycocotools-offline-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-pycocotools-offline-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-pycocotools-offline-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-pycocotools-offline-successor.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-pycocotools-offline-successor',
  predecessorTerminalRereadRequired: true,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  officialPycocotoolsWheelRequired: true,
  immutableWheelAndScanReceiptLineageRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
