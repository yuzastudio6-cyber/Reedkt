import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-vertex-a100-security-final-successor-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-vertex-a100-security-final-successor.ts'
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
const authorityModel = readFileSync(
  'server/model-artifacts/canonical-sam3_1-qualification-image-build-authority.ts',
  'utf8',
)
const vertexRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-e1c8486bab46ebeda883',
    'sha256:e1c8486bab46ebeda88382237905707c442869029d6963759bd657389ea726ee',
    'b816d96d-2c69-46fc-ab21-da6150124022',
    'sha256:dc1b9393daebe3cba51fca8bbd2fe0117d52a20d7617bf1fd3b270307ca83025',
    'sam31-qualification-supply-submission-f97e3538e47eced952f2',
    'a188c4d0-8d1c-4780-b316-837813726b50',
    'a75e53da8f2a6c7620c75cb3f434db6f305a4a3ebc60175a54bbb924ffbf5c79',
    'sam31-qualification-image-build-vertex-a100-security-final-successor-15',
    '37cfffa593263d3f73702f59a3693d987bd5aef8c25ed3d07e0e40ca7acc36a3',
    '1732be5931a7b35265a3f04e36770e471d588f961097e9c08a60a61ce31e3856',
    'CVE-2026-24049',
    'artifact_analysis_high_vulnerability_in_inherited_setuptools_vendor_wheel',
    'remove_inherited_setuptools_and_vendored_wheel_then_build_vertex_gcs_runner',
    'vertexA100ExecutionContractRequired: true',
    'automaticRetryOfPredecessor: false',
  ] as const) assert.ok(
    source.includes(expected),
    `Vertex A100 security-final successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'vertex_a100_setuptools_vendor_removed',
  'sam31-qualification-capsule-reproducibility-vertex-a100-setuptools-vendor-removed-20260807',
  'f9ef526f-d371-4222-8b24-c711e7d8c98a',
  '318d0af1-51dd-4a81-a35b-09d812be40c4',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `Vertex A100 reproducibility publisher lost ${expected}`,
)

assert.ok(qualificationDockerfile.includes(
  '/usr/local/lib/python3.12/dist-packages/setuptools-*.dist-info',
))
assert.ok(qualificationDockerfile.includes(
  "assert importlib.util.find_spec('setuptools') is None",
))
assert.doesNotMatch(
  qualificationDockerfile,
  /pip install[^\n]*--break-system-packages/u,
)
assert.ok(authorityModel.includes(
  'VERTEX_A100_SETUPTOOLS_VENDOR_REMOVED_DOCKERFILE_SHA256',
))
assert.ok(vertexRunner.includes('/gcs/'))
assert.doesNotMatch(vertexRunner, /\/mnt\/checkpoint|\/mnt\/output/u)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-vertex-a100-security-final-successor-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-vertex-a100-security-final-successor-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-vertex-a100-security-final-successor',
  priorImmutableImageExactRereadRequired: true,
  priorSignedSbomSupplyChainAttemptExactRereadRequired: true,
  highVulnerabilityBlockedPredecessor: true,
  inheritedSetuptoolsVendorRemoved: true,
  vertexGcsRunnerRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
