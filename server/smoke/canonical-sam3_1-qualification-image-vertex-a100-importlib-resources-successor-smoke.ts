import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-vertex-a100-importlib-resources-successor-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-vertex-a100-importlib-resources-successor.ts'
const publication = readFileSync(publicationPath, 'utf8')
const start = readFileSync(startPath, 'utf8')
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const importlibPatch = readFileSync(
  'docker/prod/gpu-worker/sam3_1/patches/0002-weeditpro-importlib-resources.patch',
  'utf8',
)
const authorityModel = readFileSync(
  'server/model-artifacts/canonical-sam3_1-qualification-image-build-authority.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-177a6ccc87418c0551e',
    'sha256:177a6ccc87418c0551e36832c9cb980f928ab0e49f9253b87b9f304f52778d97',
    '9eec8c96-b64b-45b3-8842-6f4040efd089',
    'sam31-qualification-image-build-vertex-a100-importlib-resources-successor-16',
    'e8e0bb0b7c9d6ea9d2ca4c3e1bab861e54b7d9893f5a2febb2536ea781f7d39c',
    'f8d8d67f986a20aa7320f05134c03f5d8876f7e1e057af297226e9e277f8e186',
    'upstream_pkg_resources_runtime_dependency_remained_after_setuptools_security_removal',
    'replace_upstream_pkg_resources_with_standard_library_importlib_resources_then_purge_setuptools_and_pkg_resources',
    'automaticRetryOfPredecessor: false',
  ] as const) assert.ok(
    source.includes(expected),
    `Vertex A100 importlib-resources successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'vertex_a100_importlib_resources_setuptools_removed',
  'sam31-qualification-capsule-reproducibility-vertex-a100-importlib-resources-setuptools-removed-20260807',
  'WEEDITPRO_SAM31_CAPSULE_PRIMARY_BUILD_ID',
  'WEEDITPRO_SAM31_CAPSULE_CONFIRMATION_BUILD_ID',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `Importlib-resources reproducibility publisher lost ${expected}`,
)

for (const expected of [
  'from importlib.resources import files',
  'pkg_resources.resource_filename',
  'assets/bpe_simple_vocab_16e6.txt.gz',
] as const) assert.ok(importlibPatch.includes(expected))
for (const expected of [
  '0002-weeditpro-importlib-resources.patch',
  '6ce1e6954069aff28498284f4cd140cd9530a3f236d04bc507c799fe8ea3521f',
  '8349e6d536e7eb1a233984a971a6c9fb3ccc4034d591b4f8f7946d49327f99bf',
  '9590d6a90c96ad632e7a646ba0e65508bcaf1cfeb0fbc3ad90fcc3f26614b76c',
  'python3-setuptools python3-pkg-resources',
  "find_spec('setuptools') is None",
  "find_spec('pkg_resources') is None",
  "import sam3.model_builder as b",
] as const) assert.ok(
  qualificationDockerfile.includes(expected),
  `Qualification Dockerfile lost ${expected}`,
)
assert.ok(authorityModel.includes(
  'VERTEX_A100_IMPORTLIB_RESOURCES_DOCKERFILE_SHA256',
))
assert.ok(authorityModel.includes(
  'IMPORTLIB_RESOURCES_SOURCE_PROVENANCE_LOCK_SHA256',
))
assert.ok(authorityModel.includes('importlibResourcesPatchSha256'))

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-vertex-a100-importlib-resources-successor-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-vertex-a100-importlib-resources-successor-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-vertex-a100-importlib-resources-successor',
  failedPredecessorExactRereadRequired: true,
  automaticRetryAllowed: false,
  historicalGpuDecodePatchPreserved: true,
  importlibResourcesPatchSeparatelyHashed: true,
  setuptoolsAndPkgResourcesPurged: true,
  samModelBuilderRereadAfterPurge: true,
  vertexGcsRunnerRequired: true,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
