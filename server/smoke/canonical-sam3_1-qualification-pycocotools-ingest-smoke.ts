import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = 'docker/prod/gpu-worker/sam3_1'
const cloudBuild = readFileSync(
  `${root}/cloudbuild.qualification-pycocotools-ingest.yaml`,
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/34-ingest-sam31-qualification-pycocotools.sh',
  'utf8',
)
const gcloudIgnore = readFileSync(`${root}/.gcloudignore`, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const expected of [
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.',
  'manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
  'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd',
  '411685',
  'FreeBSD',
  'files.pythonhosted.org',
  'pycocotools wheel origin is not exact official PyPI HTTPS',
  'WeEditPro-SAM31-pycocotools-ingest-v1',
  'pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081',
  'destination.chmod(0o444)',
  'malware-scan-exact-pycocotools-wheel',
  'weeditpro-sam31-private-artifact-review@sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
  'import-exact-pycocotools-wheel-offline',
  'import pycocotools.mask as mask_util',
  'create-only-publish-and-reread-exact-pycocotools-wheel',
  '--if-generation-match=0',
  'published-wheel-reread.whl',
  'weeditpro-sam3_1-pycocotools-private-ingest-receipt-v1',
  'nativeExtensionImportVerified',
  'developerMachineInstallPerformed',
  'customerCreditsMutated',
  'runtimeReleaseGranted',
  'productionAuthorityGranted',
  'requestedVerifyOption: VERIFIED',
  'reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
] as const) assert.ok(
  cloudBuild.includes(expected),
  `pycocotools ingest Cloud Build lost ${expected}`,
)
assert.doesNotMatch(
  cloudBuild,
  /(?:sam3\.1_multiplex\.pt|HF_TOKEN|availableSecrets|secretEnv|nvidia-a100|nvidia-l4|customer[_ -]media)/iu,
)
for (const expected of [
  'ingest-one-weeditpro-sam31-qualification-pycocotools-wheel-v1',
  'cloudbuild.qualification-pycocotools-ingest.yaml',
  'git status --short',
  '_REPOSITORY_COMMIT=${COMMIT},_REPOSITORY_TREE=${TREE}',
  '--async --format=json --quiet',
] as const) assert.ok(operator.includes(expected), `pycocotools operator lost ${expected}`)
assert.doesNotMatch(operator, /(?:\bcurl\b|\bwget\b|\bpip\b|\bpython\b|HF_TOKEN)/u)
assert.ok(gcloudIgnore.includes('!cloudbuild.qualification-pycocotools-ingest.yaml'))
assert.equal(
  packageJson.scripts?.['ingest:sam3_1-qualification-pycocotools'],
  'bash scripts/gcp/prod/34-ingest-sam31-qualification-pycocotools.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-pycocotools-ingest',
  exactOfficialPyPiWheelPinned: true,
  exactNativeLinuxWheelRequired: true,
  safeArchiveShapeRequired: true,
  malwareScanRequired: true,
  isolatedCloudImportRequired: true,
  privateCreateOnlyPublicationRequired: true,
  sourceCommitAndTreeBound: true,
  checkpointIncluded: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
