import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = 'docker/prod/gpu-worker/sam3_1'
const dockerfile = readFileSync(
  `${root}/Dockerfile.qualification-capsule-builder`,
  'utf8',
)
const builder = readFileSync(`${root}/build-qualification-capsule.sh`, 'utf8')
const sourcePreparation = readFileSync(
  `${root}/prepare-qualification-source.sh`,
  'utf8',
)
const securityClosurePreparation = readFileSync(
  `${root}/prepare-qualification-security-closure.py`,
  'utf8',
)
const cloudBuild = readFileSync(
  `${root}/cloudbuild.qualification-capsule.yaml`,
  'utf8',
)
const candidate = readFileSync(
  `${root}/Dockerfile.qualification.candidate`,
  'utf8',
)
const qualificationEntrypoint = readFileSync(
  `${root}/qualification_entrypoint.sh`,
  'utf8',
)
const sourceProvenance = readFileSync(`${root}/source-provenance.lock`, 'utf8')
const operator = readFileSync(
  'scripts/gcp/prod/31-build-sam31-qualification-capsule.sh',
  'utf8',
)
const sourceReaderGrant = readFileSync(
  'scripts/gcp/prod/32-grant-sam31-qualification-source-reader.sh',
  'utf8',
)
const gcloudIgnore = readFileSync(`${root}/.gcloudignore`, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const expected of [
  'pytorch/pytorch@sha256:b574d4ccf6d8856a5d87dcadc667aa4f95dc18d337ef3a28d02b7b01897d7081',
  'Dockerfile.qualification.candidate',
  'qualification_runner.py',
  'qualification_entrypoint.sh',
  'source-provenance.lock',
  '0001-reeditpro-gpu-decode.patch',
  'build-qualification-capsule.sh',
  'private-staging/sam3-source.tar',
  'private-dependency-closure/dependency-closure',
  'private-source-prep/sam3-patched-source.tar',
] as const) assert.ok(
  dockerfile.includes(expected),
  `qualification capsule Dockerfile lost ${expected}`,
)
for (const expected of [
  '--if-generation-match=1786101660398565',
  'native-dependencies/libnpp-12-8/12.3.3.100-1/54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992.deb',
  'libnpp-12-8_12.3.3.100-1_amd64.deb',
  '131485608',
  '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992',
  '--if-generation-match=1786106120404202',
  'einops-0.8.2-py3-none-any.whl',
  '--if-generation-match=1786106528199762',
  '69881838-2efb-40db-ba3a-fcfa0179c18e/einops-ingest-receipt.json',
  'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
  '--if-generation-match=1786112742762071',
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
  '--if-generation-match=1786112748711226',
  'd5088d0d-94eb-45d1-b020-f9d7683eb9bf/pycocotools-ingest-receipt.json',
  'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
  'urllib3-2.7.0-py3-none-any.whl',
  '9fb4c81ebbb1ce9531cce37674bbc6f1360472bc18ca9a553ede278ef7276897',
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  '321b30ad5a1c3783cb3d73ae439f824f6d3874d76a93a62f4a984959b490aa7b',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  '6a963adb1106fca567d24d4a1e5da0bad25de79ac2564cd1ba846e677e1c951b',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  '9a5cf7bc8e876ef4498ddf0180b6fafe0e52c2a8da2f06f8bc78c2a6fc92ec58',
  'weeditpro-sam3_1-os-security-update-closure-v1',
  'official_ubuntu_noble_security_repository',
  'python3 -I -B prepare-qualification-security-closure.py',
  '| wc -l)" = 40',
] as const) assert.ok(
  cloudBuild.includes(expected),
  `qualification capsule Cloud Build lost ${expected}`,
)
assert.doesNotMatch(
  dockerfile,
  /(?:sam3\.1_multiplex\.pt|checkpoint\/|HF_TOKEN|huggingface\.co)/u,
)
for (const expected of [
  'urllib.request.HTTPRedirectHandler',
  'response.geturl() != url',
  '"Accept-Encoding": "identity"',
  'response.read(expected_bytes + 1)',
  'exact dependency SHA-256 changed',
  'urllib3-2.7.0-py3-none-any.whl',
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
] as const) assert.ok(
  securityClosurePreparation.includes(expected),
  `security closure preparation lost ${expected}`,
)
assert.doesNotMatch(
  securityClosurePreparation,
  /(?:HF_TOKEN|GOOGLE_APPLICATION_CREDENTIALS|checkpoint|customer[_ -]media)/iu,
)

for (const expected of [
  '96914d2425f90a64f45ca977c2b5165418099543',
  '573deb167702e014829a5b830de8ae62abe891d5',
  'f3a58b95a0e460d76e1cf38abff0382a7307f67d',
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
  'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
  '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992',
  '69c1468de02b2951a3c9755a76b8246b83fbf4d8f137fd1e843767a76c344ae7',
  'bc1f7c1797fda52d0b333f91d65af2add1deeaa0e4cf5b5ae8a58e1d54117fe2',
  'e2c71babfd18a8e69542dd7e9ca018f9caa438094001a58e6bc4d8c999bf0d07',
  '5ecb4aeb61b4f14f30ceed11ce892308f38232d82eee64605ae19583c51a8e72',
  '5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121',
  '67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829',
  'dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563',
  'download.pytorch.org',
  'distfiles.ariadne.space',
  'ffmpeg.org',
  'github.com',
  'codeload.github.com',
  'developer.download.nvidia.com',
  'files.pythonhosted.org',
  'security.ubuntu.com',
  'staged dependency origin is not allowlisted',
  'REVIEWED_DEPENDENCY_CLOSURE',
  'da148222e6160aa193fb0547e4d186669bd594ec8ba03831f8294977cc2ee453',
  '--format=ustar',
  "--mtime='@0'",
  'gzip --no-name --best',
  'weeditpro-sam3_1-source-patch-application-receipt-v1',
  'weeditpro-sam3_1-python-dependency-closure-receipt-v1',
  'weeditpro-sam3_1-einops-private-ingest-receipt-v1',
  'einops-0.8.2-py3-none-any.whl',
  '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193',
  '30d984364296f51ffaecad4b01ee127e95250c5068918d4b66fc96206723e434',
  'samCoreUnconditionallyImportsEinops',
  'weeditpro-sam3_1-pycocotools-private-ingest-receipt-v1',
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
  'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd',
  'samCoreUnconditionallyImportsPycocotools',
  'weeditpro-sam3_1-ffmpeg-nvdec-source-closure-receipt-v1',
  'weeditpro-cuda-forward-compat-ingest-receipt-v1',
  'weeditpro-sam3_1-torchcodec-cuda-npp-runtime-receipt-v1',
  'weeditpro-sam3_1-qualification-capsule-builder-result-v1',
  'weeditpro-sam3_1-os-security-update-closure-v1',
  'official_ubuntu_noble_security_repository',
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  'urllib3-2.7.0-py3-none-any.whl',
  'offlineInstallRequired',
  'dependencyResolutionAtRuntimeAllowed',
  'cpuDecodeFallbackAllowed',
  'checkpointIncluded',
  'containsCredentials',
  'containsCustomerMedia',
] as const) assert.ok(builder.includes(expected), `capsule builder lost ${expected}`)

assert.equal((builder.match(/^stage_wheel \\/gmu) ?? []).length, 24)
assert.equal((builder.match(/^stage_exact \\/gmu) ?? []).length, 8)
const localWheelNames = [...builder.matchAll(/^stage_wheel \\\n\s+'([^']+\.whl)'/gmu)]
  .map((match) => match[1])
assert.equal(localWheelNames.length, 24)
assert.ok(
  localWheelNames.every((fileName) => fileName.length <= 100),
  'every canonical local wheel name must fit one USTAR name component',
)
assert.ok(localWheelNames.includes(
  'charset_normalizer-3.4.9-cp312-cp312-manylinux_2_28_x86_64.whl',
))
assert.ok(localWheelNames.includes(
  'torchcodec-0.10.0+cu128-cp312-cp312-manylinux_2_28_x86_64.whl',
))
assert.ok(localWheelNames.includes('einops-0.8.2-py3-none-any.whl'))
assert.ok(localWheelNames.includes('urllib3-2.7.0-py3-none-any.whl'))
assert.ok(localWheelNames.includes(
  'pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
))
assert.doesNotMatch(
  builder,
  /torchcodec-0\.10\.0-cp312-cp312-manylinux_2_28_x86_64\.whl/u,
)
assert.doesNotMatch(builder, /urllib3-2\.6\.3-py3-none-any\.whl/u)
assert.ok(builder.includes(
  'charset_normalizer-3.4.9-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
))
assert.doesNotMatch(builder, /python -m pip download/u)
assert.doesNotMatch(builder, /python -m pip install/u)
assert.doesNotMatch(builder, /python -m pip wheel/u)
assert.doesNotMatch(builder, /from urllib|urlopen|HTTPRedirectHandler/u)
assert.doesNotMatch(builder, /(?:apt-get|conda install|git clone)/u)
assert.doesNotMatch(
  builder,
  /(?:sam3\.1_multiplex\.pt|huggingface\.co|HF_TOKEN|GOOGLE_APPLICATION_CREDENTIALS)/u,
)
assert.match(builder, /find "\$\{BUILD_SOURCE\}" -type f -exec touch -d '@0'/u)
assert.match(builder, /find "\$\{BUILD_SOURCE\}" -type d -exec chmod 0555/u)
assert.match(builder, /find "\$\{BUILD_SOURCE\}" -type f -exec chmod 0444/u)

for (const expected of [
  '573deb167702e014829a5b830de8ae62abe891d5',
  'f3a58b95a0e460d76e1cf38abff0382a7307f67d',
  'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
  'git write-tree',
  'git apply --index',
  'git archive --format=tar',
  '--mtime="${COMMIT_TIME}"',
  'private-source-prep',
] as const) assert.ok(
  sourcePreparation.includes(expected),
  `source preparation lost ${expected}`,
)
assert.doesNotMatch(
  sourcePreparation,
  /(?:\b(?:apt-get|conda|pip|curl|wget)\b|git clone|huggingface|checkpoint)/iu,
)

for (const expected of [
  'reread-exact-official-source',
  '--if-generation-match=1786071963625032',
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
  'reread-exact-reviewed-dependency-closure',
  '--if-generation-match=1786094618776519',
  '5a6360bedc2930bd338421a45b4cfed3e0bee6638ca97f8675d461d551ca2743',
  '--strip-components=1',
  '--no-same-owner --no-same-permissions',
  '-type f | wc -l)" = 31',
  '-mindepth 1 ! -type d ! -type f -print -quit',
  'prepare-exact-patched-source',
  'gcr.io/cloud-builders/git@sha256:cd777b3c8a45e42dcfdb30ddaa44497968b11c6d314cd462121012d7004b03ec',
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
  '--platform=linux/amd64',
  '--no-cache',
  'reproducibility/${BUILD_ID}/',
  'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
  'CLOUD_LOGGING_ONLY',
  'requestedVerifyOption: VERIFIED',
  'static-scan-fixed-capsule',
  'weeditpro-sam31-private-artifact-review@sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
  'weeditpro-sam3_1-qualification-capsule-malware-scan-v1',
  '--scan-archive=yes',
  '--max-filesize=4095M',
  'capsule object name is not content addressed',
  'signatureCount',
  'infectedFileCount',
  'private-capsule-scan-output/*.json',
] as const) assert.ok(cloudBuild.includes(expected), `Cloud Build lost ${expected}`)
assert.doesNotMatch(
  cloudBuild,
  /(?:secretEnv|availableSecrets|sam3\.1_multiplex\.pt|nvidia-l4|a100-80gb|customer[_ -]media|freshclam|\bcurl\b)/iu,
)
assert.doesNotMatch(
  dockerfile,
  /\bcurl\b/u,
  'The builder must use only the staged private dependency closure',
)

for (const expected of [
  '**',
  '!.gcloudignore',
  '!Dockerfile.qualification-capsule-builder',
  '!Dockerfile.qualification.candidate',
  '!build-qualification-capsule.sh',
  '!prepare-qualification-source.sh',
  '!prepare-qualification-security-closure.py',
  '!qualification_entrypoint.sh',
  '!qualification_runner.py',
  '!cloudbuild.qualification-pycocotools-ingest.yaml',
  '!source-provenance.lock',
  '!patches/0001-reeditpro-gpu-decode.patch',
] as const) assert.ok(gcloudIgnore.includes(expected), `.gcloudignore lost ${expected}`)
assert.doesNotMatch(gcloudIgnore, /!Dockerfile\.candidate|!runner\.py|!entrypoint\.sh/u)

for (const expected of [
  'PIP_NO_INDEX=1',
  '--no-index',
  '--no-cache-dir',
  '--no-deps',
  '--require-hashes',
  'python -m venv',
  '--without-pip',
  '--system-site-packages',
  '--target="${WEEDITPRO_PYTHON_VENV}/lib/python3.12/site-packages"',
  "sys.prefix == '/opt/weeditpro/python-venv'",
  'sys.base_prefix != sys.prefix',
  'torch.__version__ == \'2.10.0+cu128\'',
  'torchvision.__version__ == \'0.25.0+cu128\'',
  "m.version('torchcodec') == '0.10.0+cu128'",
  "m.version('einops') == '0.8.2'",
  "m.version('pycocotools') == '2.0.11'",
  'torch.version.cuda == \'12.8\'',
  'nvidia/cuda@sha256:4b9ed5fa8361736996499f64ecebf25d4ec37ff56e4d11323ccde10aa36e0c43',
  'ffmpeg-8.0.3.tar.gz',
  'pkgconf-3.0.4.tar.gz',
  'libnpp-12-8_12.3.3.100-1_amd64.deb',
  'cuda-npp-runtime-receipt.json',
  'einops-ingest-receipt.json',
  'pycocotools-ingest-receipt.json',
  'os-security-update-receipt.json',
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  "dpkg-query --showformat='${Version}' --show openssl",
  'python -m pip uninstall --yes pillow urllib3 wheel',
  'dpkg --purge python3-pip python3-wheel',
  "m.version('pillow') == '12.3.0'",
  "m.version('urllib3') == '2.7.0'",
  '/opt/weeditpro/cuda-npp/lib',
  'libnppicc.so.12',
  '/opt/weeditpro/cuda-npp/LICENSE',
  'cudaNppRuntimeReceiptSha256',
  'nv-codec-headers-n12.2.72.0.tar.gz',
  '/opt/weeditpro/pkgconf/bin/pkg-config',
  "pkgconf --version)\" = '3.0.4'",
  '--enable-shared',
  '--enable-ffnvcodec',
  '--enable-nvdec',
  '--enable-cuvid',
  '--disable-libnpp',
  "#define CONFIG_GPL 0",
  "#define CONFIG_NONFREE 0",
  'h264_cuvid',
  'hevc_cuvid',
] as const) assert.ok(candidate.includes(expected), `candidate lost ${expected}`)
assert.doesNotMatch(candidate, /(?:apt-get|curl |wget )/u)
assert.doesNotMatch(candidate, /urllib3-2\.6\.3|pillow-12\.0|wheel-0\.45\.1/iu)
assert.equal((candidate.match(/^RUN --network=none /gmu) ?? []).length, 0)
assert.equal((candidate.match(/^RUN /gmu) ?? []).length, 3)
assert.doesNotMatch(candidate, /--break-system-packages/u)
assert.match(
  qualificationEntrypoint,
  /exec \/opt\/weeditpro\/python-venv\/bin\/python[\s\\]+-I -B/u,
)

for (const expected of [
  'qualification_image_inherited_high_severity_remediation_required=true',
  'qualification_image_offline_openssl_version=3.0.13-0ubuntu3.12',
  'qualification_image_urllib3_version=2.7.0',
  'qualification_image_unused_os_python3_pip_and_wheel_purged=true',
  'qualification_image_inherited_pillow_urllib3_wheel_distributions_purged=true',
  'qualification_image_successor_security_scan_required=true',
] as const) assert.ok(
  sourceProvenance.includes(expected),
  `source provenance lost ${expected}`,
)
for (const expected of [
  '/opt/weeditpro/ffmpeg/lib',
  '/opt/weeditpro/cuda-npp/lib',
  '/usr/local/cuda/lib64',
  'libavcodec.so.62',
  'libavformat.so.62',
  'libavutil.so.60',
] as const) assert.ok(
  qualificationEntrypoint.includes(expected),
  `qualification entrypoint lost ${expected}`,
)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly REGION='us-central1'",
  "readonly CONFIRMATION='start-weeditpro-sam31-qualification-capsule-build-v1'",
  "readonly CONTEXT='docker/prod/gpu-worker/sam3_1'",
  "readonly APPLE_COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'",
  'env DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}"',
  'git status --short',
  'gcloud config get project',
  'git rev-parse HEAD',
  "git rev-parse 'HEAD^{tree}'",
  'gcloud builds submit "${CONTEXT}"',
  '--async',
] as const) assert.ok(operator.includes(expected), `operator lost ${expected}`)
assert.doesNotMatch(operator, /(?:secret|checkpoint|model-artifact|docker run)/iu)

for (const expected of [
  "readonly PROJECT_ID='reeditpro'",
  "readonly BUCKET='reeditpro-production-reeditpro-model-artifacts'",
  "'reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com'",
  "readonly ROLE='roles/storage.objectViewer'",
  "readonly CONDITION_TITLE='weeditpro_sam31_qualification_source_read_v1'",
  'objects/private/model-artifacts/sam3_1/source/',
  'resource.name.startsWith',
  'gcloud storage buckets add-iam-policy-binding',
  'gcloud storage buckets get-iam-policy',
  'checkpointReadAuthorized',
  'objectWriteOrDeleteAuthorized',
] as const) assert.ok(
  sourceReaderGrant.includes(expected),
  `source-reader grant lost ${expected}`,
)
assert.doesNotMatch(
  sourceReaderGrant,
  /(?:objectAdmin|objectCreator|storage\.admin|secretAccessor|checkpoint\/|gpu-worker)/iu,
)

assert.equal(
  packageJson.scripts?.['build:sam3_1-qualification-capsule'],
  'bash scripts/gcp/prod/31-build-sam31-qualification-capsule.sh',
)
assert.equal(
  packageJson.scripts?.['grant:sam3_1-qualification-source-reader'],
  'bash scripts/gcp/prod/32-grant-sam31-qualification-source-reader.sh',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-capsule-builder',
  productName: 'WeEditPro',
  officialSourceGenerationBound: true,
  exactPinnedPythonWheelCount: 24,
  deterministicLocalSdistWheelCount: 1,
  exactPinnedCudaForwardCompatibilityPackageCount: 1,
  exactPinnedCudaNppRuntimePackageCount: 1,
  exactPinnedFfmpegSourceArchiveCount: 1,
  exactPinnedPkgconfSourceArchiveCount: 1,
  exactPinnedNvCodecHeadersArchiveCount: 1,
  torchcodecCudaWheelRequired: true,
  cpuVideoDecodeFallbackAllowed: false,
  runtimeDependencyResolutionAllowed: false,
  runtimeNetworkAllowed: false,
  pep668BypassAllowed: false,
  isolatedImmutablePythonEnvironmentRequired: true,
  checkpointIncluded: false,
  developerMachineInstallPerformed: false,
  immutableQualificationImageBuilt: false,
  gpuQualificationStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
