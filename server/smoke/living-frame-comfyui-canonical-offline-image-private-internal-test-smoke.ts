import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const IMAGE =
  process.env
    .REEDITPRO_LIVING_FRAME_COMFYUI_CANONICAL_OFFLINE_IMAGE
  ?? 'reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0'

const EXPECTED_ENTRYPOINT = [
  '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python',
  '-I',
  '-B',
  '/opt/reeditpro/gpu-operations/comfyui/runner.py',
] as const
const EXPECTED_SOURCE_COMMIT =
  'bffa1ec0632fe26cd72ec4b8fe373bdcb38e353b'
const EXPECTED_RUNNER_SHA256 =
  'f28160b8e63fdf1a5717045850efd141275f20b4913a80b6502104c662b85caa'
const EXPECTED_REQUIREMENTS_SHA256 =
  '6dfa8623619ee854cb220ce3be538533b91b4b3703a3e8c79639d25e8909294e'
const EXPECTED_SOURCE_PROVENANCE_SHA256 =
  'c3088d74dd5ddef884c373f3da8544de69cfa81e386f12a38c3fb5123f8c8040'
const EXPECTED_MODEL_PATHS_SHA256 =
  '4fa61cadb61d595ed32ffac4f8fdcaa0d665fd8e5011de308a69ae4075391b60'
const EXPECTED_LAYOUT_VERIFIER_SHA256 =
  '71c0f35ad1ad0083eb88a2b1561d6e93ba0cfa05cb2762e6a28f8978008d5656'

if (!imageAvailable()) {
  process.stdout.write(`${JSON.stringify({
    suite:
      'living-frame-comfyui-canonical-offline-image-private-internal-test',
    status:
      'skipped_exact_private_internal_image_unavailable',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

const inspection = inspectImage()
assert.match(inspection.Id, /^sha256:[a-f0-9]{64}$/u)
assert.equal(inspection.Os, 'linux')
assert.equal(inspection.Architecture, 'amd64')
assert.equal(inspection.Config.User, '65532:65532')
assert.deepEqual(
  inspection.Config.Entrypoint,
  EXPECTED_ENTRYPOINT,
)
assert.equal(inspection.Config.Cmd ?? null, null)
assert.equal(
  inspection.Config.Labels[
    'org.reeditpro.living-frame.runtime-class'
  ],
  'canonical-offline-comfyui-private-internal-candidate',
)
assert.equal(
  inspection.Config.Labels[
    'org.reeditpro.living-frame.canonical-source-commit'
  ],
  EXPECTED_SOURCE_COMMIT,
)
assert.equal(
  inspection.Config.Labels[
    'org.reeditpro.living-frame.production-qualified'
  ],
  'false',
)

const identity = runDocker([
  'run',
  '--rm',
  '--platform',
  'linux/amd64',
  '--read-only',
  '--network',
  'none',
  '--cap-drop',
  'ALL',
  '--security-opt',
  'no-new-privileges',
  '--tmpfs',
  '/tmp:rw,noexec,nosuid,nodev,size=64m',
  '--entrypoint',
  '/usr/bin/id',
  IMAGE,
]).stdout.trim()
assert.equal(identity, 'uid=65532 gid=65532 groups=65532')

const layoutReceipt = JSON.parse(
  runDocker([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--read-only',
    '--network',
    'none',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=64m',
    '--entrypoint',
    '/opt/reeditpro/gpu-operations/comfyui/verify-installed-layout.sh',
    IMAGE,
  ]).stdout,
) as Readonly<Record<string, unknown>>
assert.deepEqual(layoutReceipt, {
  status: 'passed',
  layout: 'fixed_offline_comfyui_package',
  modelWeightsBakedIntoImage: false,
  runtimeDownloadsAllowed: false,
  productionQualified: false,
})

const fileDigests = digestInstalledFiles()
assert.deepEqual(fileDigests, {
  runner: EXPECTED_RUNNER_SHA256,
  requirements: EXPECTED_REQUIREMENTS_SHA256,
  sourceProvenance:
    EXPECTED_SOURCE_PROVENANCE_SHA256,
  modelPaths: EXPECTED_MODEL_PATHS_SHA256,
  layoutVerifier: EXPECTED_LAYOUT_VERIFIER_SHA256,
})

process.stdout.write(`${JSON.stringify({
  suite:
    'living-frame-comfyui-canonical-offline-image-private-internal-test',
  status: 'passed',
  evidenceClass:
    'private_internal_canonical_offline_image_observation_unreleased',
  imageDigestSha256:
    inspection.Id.replace(/^sha256:/u, ''),
  imageByteLength: inspection.Size,
  architecture: inspection.Architecture,
  defaultUid: 65_532,
  defaultGid: 65_532,
  fixedEntrypointObserved: true,
  canonicalSourceCommit: EXPECTED_SOURCE_COMMIT,
  offlineWheelArtifactCount: 35,
  offlineWheelArtifactByteLength: 486_459_097,
  sourceArchiveCount: 3,
  reviewedCustomNodeCount: 2,
  installedLayoutVerified: true,
  exactInstalledFileDigestsVerified: true,
  rootFilesystemReadOnlyObserved: true,
  externalNetworkDisabledObserved: true,
  allCapabilitiesDroppedObserved: true,
  noNewPrivilegesObserved: true,
  modelWeightsBakedIntoImage: false,
  runtimeDownloadsAllowed: false,
  gpuExecutionPerformed: false,
  outputCreated: false,
  sbomCompleted: false,
  vulnerabilityDispositionCompleted: false,
  imageSignatureCompleted: false,
  canonicalOperationDispatched: false,
  actualCostEvidenceCreated: false,
  customerChargeCreated: false,
  publicDeliveryCreated: false,
  productionReady: false,
})}\n`)

interface DockerImageInspection {
  readonly Id: string
  readonly Os: string
  readonly Architecture: string
  readonly Size: number
  readonly Config: {
    readonly User: string
    readonly Entrypoint: readonly string[]
    readonly Cmd?: readonly string[] | null
    readonly Labels: Readonly<Record<string, string>>
  }
}

function imageAvailable(): boolean {
  const result = spawnSync(
    'docker',
    ['image', 'inspect', IMAGE],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    },
  )
  return result.status === 0
}

function inspectImage(): DockerImageInspection {
  return JSON.parse(
    runDocker([
      'image',
      'inspect',
      IMAGE,
      '--format',
      '{{json .}}',
    ]).stdout,
  ) as DockerImageInspection
}

function digestInstalledFiles(): {
  readonly runner: string
  readonly requirements: string
  readonly sourceProvenance: string
  readonly modelPaths: string
  readonly layoutVerifier: string
} {
  const result = runDocker([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--read-only',
    '--network',
    'none',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--entrypoint',
    '/usr/bin/sha256sum',
    IMAGE,
    '/opt/reeditpro/gpu-operations/comfyui/runner.py',
    '/opt/reeditpro/gpu-operations/comfyui/requirements.lock.txt',
    '/opt/reeditpro/gpu-operations/comfyui/source-provenance.lock',
    '/opt/reeditpro/gpu-operations/comfyui/extra_model_paths.yaml',
    '/opt/reeditpro/gpu-operations/comfyui/verify-installed-layout.sh',
  ])
  const digests = result.stdout
    .trim()
    .split('\n')
    .map((line) => line.split(/\s+/u)[0])
  assert.equal(digests.length, 5)
  return {
    runner: digests[0],
    requirements: digests[1],
    sourceProvenance: digests[2],
    modelPaths: digests[3],
    layoutVerifier: digests[4],
  }
}

function runDocker(
  arguments_: readonly string[],
): {
  readonly stdout: string
  readonly stderr: string
} {
  const result = spawnSync('docker', arguments_, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 10 * 60_000,
  })
  if (
    result.error
    || result.status !== 0
    || result.signal !== null
  ) {
    throw new Error(
      [
        'Living Frame canonical offline ComfyUI image probe failed.',
        `status=${String(result.status)}`,
        `signal=${String(result.signal)}`,
        result.stderr.trim(),
      ].filter(Boolean).join('\n'),
    )
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  }
}
