import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = 'docker/prod/gpu-worker/sam3_1'
const cloudBuild = readFileSync(
  `${root}/cloudbuild.qualification-einops-ingest.yaml`,
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/33-ingest-sam31-qualification-einops.sh',
  'utf8',
)
const gcloudIgnore = readFileSync(`${root}/.gcloudignore`, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const expected of [
  'einops-0.8.2-py3-none-any.whl',
  '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193',
  '65638',
  '30d984364296f51ffaecad4b01ee127e95250c5068918d4b66fc96206723e434',
  '1073',
  'files.pythonhosted.org',
  'einops wheel origin is not exact official PyPI HTTPS',
  'WeEditPro-SAM31-einops-ingest-v1',
  'malware-scan-exact-einops-wheel',
  'weeditpro-sam31-private-artifact-review@sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
  '--if-generation-match=0',
  '--cache-control=no-store',
  '--content-type=application/zip',
  'weeditpro-sam3_1-einops-private-ingest-receipt-v1',
  'developerMachineInstallPerformed',
  'customerCreditsMutated',
  'runtimeReleaseGranted',
  'productionAuthorityGranted',
  'requestedVerifyOption: VERIFIED',
  'reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
] as const) assert.ok(
  cloudBuild.includes(expected),
  `einops ingest Cloud Build lost ${expected}`,
)
assert.doesNotMatch(
  cloudBuild,
  /(?:sam3\.1_multiplex\.pt|HF_TOKEN|availableSecrets|secretEnv|nvidia-a100|nvidia-l4|pip install|customer[_ -]media)/iu,
)
for (const expected of [
  'ingest-one-weeditpro-sam31-qualification-einops-wheel-v1',
  'cloudbuild.qualification-einops-ingest.yaml',
  'git status --short',
  '_REPOSITORY_COMMIT=${COMMIT},_REPOSITORY_TREE=${TREE}',
  '--async --format=json --quiet',
] as const) assert.ok(operator.includes(expected), `einops operator lost ${expected}`)
assert.doesNotMatch(operator, /(?:\bcurl\b|\bwget\b|\bpip\b|\bpython\b|HF_TOKEN)/u)
assert.ok(gcloudIgnore.includes('!cloudbuild.qualification-einops-ingest.yaml'))
assert.equal(
  packageJson.scripts?.['ingest:sam3_1-qualification-einops'],
  'bash scripts/gcp/prod/33-ingest-sam31-qualification-einops.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-einops-ingest',
  exactOfficialPyPiWheelPinned: true,
  exactWheelAndLicenseHashesRequired: true,
  safeArchiveShapeRequired: true,
  malwareScanRequired: true,
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
