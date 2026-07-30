import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
  createReadStream,
  lstatSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import { realpath } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import type {
  LivingFrameComfyUiHardenedCacheRole,
  LivingFrameComfyUiHardenedRuntimeHostObservation,
  LivingFrameComfyUiHardenedRuntimeVerifierObservation,
} from '../../src/types/living-frame-comfyui-hardened-runtime-host-evidence'
import {
  compileLivingFrameComfyUiHardenedRuntimeHostEvidence,
  verifyLivingFrameComfyUiHardenedRuntimeHostEvidence,
} from '../living-frame/living-frame-comfyui-hardened-runtime-host-evidence'

const SOURCE_CONTRACT_COMMIT =
  '31e1bca64f76fbde11050129d842eb3a2a90e479'
const SOURCE_CONTRACT_TREE =
  'b450107244f85c3001eb43251fc87334655750d7'
const PARENT_IMAGE =
  'reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0'
const PARENT_IMAGE_DIGEST =
  'sha256:84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b'
const CONTRACT_RELATIVE_ROOT =
  'docker/prod/gpu-worker/comfyui'
const CONTRACT_FILES = [
  'hardened-core.sha256',
  'hardened-remediation.sha256',
  'hardened-transformers-closure.sha256',
  'install-hardened-runtime-offline.sh',
  'verify-hardened-runtime.py',
] as const
const CACHE_CONFIGURATION = [
  {
    role: 'core',
    environmentName:
      'REEDITPRO_LIVING_FRAME_HARDENED_CORE_CACHE_ROOT',
    manifest: 'hardened-core.sha256',
    artifactCount: 4,
    basenamePattern:
      /^reeditpro-lf-gpu-hardening-core-v2\.[A-Za-z0-9]+$/u,
    containerTarget: '/mnt/reeditpro-hardened-core',
  },
  {
    role: 'remediation',
    environmentName:
      'REEDITPRO_LIVING_FRAME_HARDENED_REMEDIATION_CACHE_ROOT',
    manifest: 'hardened-remediation.sha256',
    artifactCount: 2,
    basenamePattern:
      /^reeditpro-lf-gpu-hardening-remediation-v1\.[A-Za-z0-9]+$/u,
    containerTarget: '/mnt/reeditpro-hardened-remediation',
  },
  {
    role: 'transformers_closure',
    environmentName:
      'REEDITPRO_LIVING_FRAME_HARDENED_TRANSFORMERS_CACHE_ROOT',
    manifest: 'hardened-transformers-closure.sha256',
    artifactCount: 27,
    basenamePattern:
      /^reeditpro-lf-gpu-hardening-transformers-closure-v2\.[A-Za-z0-9]+$/u,
    containerTarget: '/mnt/reeditpro-hardened-transformers',
  },
] as const

const containerScript = String.raw`
set -eu
RUNTIME_ROOT=/opt/reeditpro/gpu-operations/comfyui
CONTRACT_SOURCE=/mnt/reeditpro-hardened-contract
install -d -m 0755 "\${RUNTIME_ROOT}/hardening"
install -m 0444 \
  "\${CONTRACT_SOURCE}/hardened-core.sha256" \
  "\${RUNTIME_ROOT}/hardening/hardened-core.sha256"
install -m 0444 \
  "\${CONTRACT_SOURCE}/hardened-remediation.sha256" \
  "\${RUNTIME_ROOT}/hardening/hardened-remediation.sha256"
install -m 0444 \
  "\${CONTRACT_SOURCE}/hardened-transformers-closure.sha256" \
  "\${RUNTIME_ROOT}/hardening/hardened-transformers-closure.sha256"
install -m 0555 \
  "\${CONTRACT_SOURCE}/install-hardened-runtime-offline.sh" \
  "\${RUNTIME_ROOT}/install-hardened-runtime-offline.sh"
install -m 0444 \
  "\${CONTRACT_SOURCE}/verify-hardened-runtime.py" \
  "\${RUNTIME_ROOT}/verify-hardened-runtime.py"
"\${RUNTIME_ROOT}/install-hardened-runtime-offline.sh"
exec /usr/bin/setpriv \
  --reuid=65532 \
  --regid=65532 \
  --clear-groups \
  /usr/bin/python3 \
  -I \
  -B \
  "\${RUNTIME_ROOT}/verify-hardened-runtime.py"
`

await main()

async function main(): Promise<void> {
  const configured = CACHE_CONFIGURATION.map(
    (entry) => process.env[entry.environmentName]?.trim() ?? '',
  )
  if (configured.every((value) => value.length === 0)) {
    process.stdout.write(`${JSON.stringify({
      suite:
        'living-frame-comfyui-hardened-runtime-host-evidence',
      status:
        'skipped_private_hardened_package_caches_unconfigured',
      privateInternalOnly: true,
      requiredEnvironmentVariableCount:
        CACHE_CONFIGURATION.length,
      imageBuilt: false,
      controlledGenerationRuntimeExecuted: false,
      productionReady: false,
    })}\n`)
    return
  }
  assert.equal(
    configured.every((value) => value.length > 0),
    true,
    'All three private package-cache roots must be configured together.',
  )

  const repositoryRoot = await realpath(
    runGit(['rev-parse', '--show-toplevel']),
  )
  const contractRoot = join(
    repositoryRoot,
    CONTRACT_RELATIVE_ROOT,
  )
  const source = verifySourceLineage(repositoryRoot)
  const parentDigest = runDocker([
    'image',
    'inspect',
    '--format',
    '{{.Id}}',
    PARENT_IMAGE,
  ])
  assert.equal(parentDigest, PARENT_IMAGE_DIGEST)

  const cacheRoots = await Promise.all(
    configured.map((value) => realpath(resolve(value))),
  )
  const before = await Promise.all(
    CACHE_CONFIGURATION.map((entry, index) =>
      inspectCache(
        entry.role,
        cacheRoots[index]!,
        join(contractRoot, entry.manifest),
        entry.artifactCount,
        entry.basenamePattern,
      ),
    ),
  )

  const containerName =
    `reeditpro-lf-hardened-evidence-${process.pid}-`
    + randomUUID().replaceAll('-', '').slice(0, 12)
  const dockerArguments = [
    'run',
    '--rm',
    '--pull',
    'never',
    '--name',
    containerName,
    '--platform',
    'linux/amd64',
    '--user',
    '0:0',
    '--network',
    'none',
    '--pids-limit',
    '256',
    '--memory',
    '12g',
    '--cpus',
    '4',
    '--security-opt',
    'no-new-privileges:true',
    '--mount',
    bindMount(
      contractRoot,
      '/mnt/reeditpro-hardened-contract',
    ),
    ...CACHE_CONFIGURATION.flatMap((entry, index) => [
      '--mount',
      bindMount(cacheRoots[index]!, entry.containerTarget),
    ]),
    '--entrypoint',
    '/bin/sh',
    PARENT_IMAGE,
    '-ceu',
    containerScript,
  ]

  let execution: DockerExecutionResult
  try {
    execution = await executeDockerOnce(dockerArguments)
  } finally {
    if (dockerContainerExists(containerName)) {
      spawnSync('docker', ['rm', '--force', containerName], {
        encoding: 'utf8',
        stdio: 'ignore',
      })
    }
  }
  assert.equal(execution.exitStatus, 0)
  assert.equal(dockerContainerExists(containerName), false)
  const verifierObservation =
    parseVerifierObservation(execution.stdout)

  const after = await Promise.all(
    CACHE_CONFIGURATION.map((entry, index) =>
      inspectCache(
        entry.role,
        cacheRoots[index]!,
        join(contractRoot, entry.manifest),
        entry.artifactCount,
        entry.basenamePattern,
      ),
    ),
  )
  const packageCacheBindings =
    before.map((entry, index) => {
      const afterEntry = after[index]!
      assert.equal(entry.role, afterEntry.role)
      assert.equal(
        entry.setDigestSha256,
        afterEntry.setDigestSha256,
      )
      return Object.freeze({
        role: entry.role,
        artifactCount: entry.artifactCount,
        beforeSetDigestSha256: entry.setDigestSha256,
        afterSetDigestSha256: afterEntry.setDigestSha256,
        hostReadOnlyModeVerified: true,
        containerReadOnlyMountVerified: true,
        beforeAfterRehashStable: true,
        pathSerialized: false,
      })
    }) as unknown as LivingFrameComfyUiHardenedRuntimeHostObservation[
      'packageCacheBindings'
    ]

  const observation:
    LivingFrameComfyUiHardenedRuntimeHostObservation = {
      sourceContractCommitSha: SOURCE_CONTRACT_COMMIT,
      sourceContractTreeSha: SOURCE_CONTRACT_TREE,
      evidenceRunnerCommitSha: source.head,
      evidenceRunnerTreeSha: source.tree,
      sourceWorktreeClean: true,
      sourceContractFilesMatchFrozenCommit: true,
      frozenCommitIsRunnerAncestor: true,
      parentImageReference: PARENT_IMAGE,
      parentImageDigest: PARENT_IMAGE_DIGEST,
      platform: 'linux/amd64',
      networkMode: 'none',
      processLimit: 256,
      memoryLimit: '12g',
      cpuLimit: '4',
      noNewPrivileges: true,
      gpuAccessGranted: false,
      packageCacheBindings,
      dockerAttemptCount: 1,
      disposableOverlayUsed: true,
      containerRemovedAfterRun: true,
      installerIdentity: 'ephemeral_overlay_root',
      finalVerifierIdentity: 'non_root_65532',
      installerCompleted: true,
      nonRootVerifierCompleted: true,
      verifierObservation,
      verifierOutputDigestSha256:
        sha256CanonicalJson(verifierObservation),
      packageRuntimeCompatibilityVerified: true,
      controlledGenerationRuntimeExecuted: false,
      modelWeightsMounted: false,
      sourceMediaMounted: false,
      promptMaterialMounted: false,
      credentialMaterialMounted: false,
      imageBuilt: false,
      imageScanned: false,
      gpuAttemptCreated: false,
      operationRegistered: false,
      dispatchGranted: false,
      assetCreated: false,
      actualCostReceiptCreated: false,
      customerChargeCreated: false,
      publicDeliveryCreated: false,
      productionReady: false,
      pathSerialized: false,
      bytePayloadSerialized: false,
    }
  const evidence =
    compileLivingFrameComfyUiHardenedRuntimeHostEvidence(
      observation,
    )
  assert.equal(
    verifyLivingFrameComfyUiHardenedRuntimeHostEvidence(
      evidence,
      observation,
    ),
    true,
  )

  let adversarialAssertions = 0
  for (const forged of [
    {
      ...observation,
      packageCacheBindings:
        observation.packageCacheBindings.map(
          (binding, index) =>
            index === 0
              ? {
                  ...binding,
                  afterSetDigestSha256: 'f'.repeat(64),
                }
              : binding,
        ),
    },
    {
      ...observation,
      parentImageDigest: `sha256:${'f'.repeat(64)}`,
    },
    {
      ...observation,
      verifierObservation: {
        ...observation.verifierObservation,
        uid: 0,
      },
    },
    {
      ...observation,
      verifierObservation: {
        ...observation.verifierObservation,
        graphExecuted: true,
      },
    },
    {
      ...observation,
      operationRegistered: true,
    },
    {
      ...observation,
      pathSerialized: true,
    },
  ] as unknown as readonly LivingFrameComfyUiHardenedRuntimeHostObservation[]) {
    assert.throws(() => {
      compileLivingFrameComfyUiHardenedRuntimeHostEvidence(
        forged,
      )
    })
    adversarialAssertions += 1
  }
  assert.equal(adversarialAssertions, 6)

  const serialized = JSON.stringify(evidence)
  for (const forbidden of [
    repositoryRoot,
    contractRoot,
    ...cacheRoots,
    '"sourceAbsolutePath"',
    '"containerTarget"',
    'file://',
    'https://',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }

  process.stdout.write(`${JSON.stringify({
    suite:
      'living-frame-comfyui-hardened-runtime-host-evidence',
    status: 'passed',
    evidenceDigestSha256:
      evidence.evidenceDigestSha256,
    observationDigestSha256:
      evidence.observationDigestSha256,
    sourceContractCommitSha:
      evidence.sourceContractCommitSha,
    evidenceRunnerCommitSha:
      evidence.evidenceRunnerCommitSha,
    parentImageDigest:
      evidence.parentImageDigest,
    packageArtifactCount:
      evidence.packageArtifactCount,
    cacheRehashStable:
      evidence.cacheRehashStable,
    cacheHostReadOnlyModeVerified:
      evidence.cacheHostReadOnlyModeVerified,
    cacheContainerReadOnlyMountVerified:
      evidence.cacheContainerReadOnlyMountVerified,
    packageRuntimeCompatibilityVerified:
      evidence.packageRuntimeCompatibilityVerified,
    nonRootRuntimeIdentityVerified:
      evidence.nonRootRuntimeIdentityVerified,
    canonicalRunnerLineageVerified:
      evidence.canonicalRunnerLineageVerified,
    sam2ImportDenied: evidence.sam2ImportDenied,
    networkDenied: evidence.networkDenied,
    containerRemovedAfterRun:
      evidence.containerRemovedAfterRun,
    ephemeralInstallerRootOnly:
      evidence.ephemeralInstallerRootOnly,
    finalVerifierNonRoot:
      evidence.finalVerifierNonRoot,
    imageBuilt: evidence.imageBuilt,
    controlledGenerationRuntimeExecuted:
      evidence.controlledGenerationRuntimeExecuted,
    modelWeightsMounted: evidence.modelWeightsMounted,
    operationRegistered: evidence.operationRegistered,
    dispatchGranted: evidence.dispatchGranted,
    customerChargeCreated:
      evidence.customerChargeCreated,
    publicDeliveryCreated:
      evidence.publicDeliveryCreated,
    adversarialAssertions,
    pathSerialized: evidence.pathSerialized,
    bytePayloadSerialized:
      evidence.bytePayloadSerialized,
    productionReady: evidence.productionReady,
  })}\n`)
}

function verifySourceLineage(
  repositoryRoot: string,
): { readonly head: string; readonly tree: string } {
  assert.equal(
    runGit(['status', '--porcelain', '--untracked-files=all']),
    '',
    'Host evidence requires a clean source worktree.',
  )
  assert.equal(
    runGit(['rev-parse', `${SOURCE_CONTRACT_COMMIT}^{tree}`]),
    SOURCE_CONTRACT_TREE,
  )
  const ancestry = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', SOURCE_CONTRACT_COMMIT, 'HEAD'],
    { cwd: repositoryRoot, stdio: 'ignore' },
  )
  assert.equal(ancestry.status, 0)
  const contractDiff = spawnSync(
    'git',
    [
      'diff',
      '--quiet',
      SOURCE_CONTRACT_COMMIT,
      '--',
      ...CONTRACT_FILES.map((file) =>
        `${CONTRACT_RELATIVE_ROOT}/${file}`),
    ],
    { cwd: repositoryRoot, stdio: 'ignore' },
  )
  assert.equal(contractDiff.status, 0)
  return {
    head: runGit(['rev-parse', 'HEAD']),
    tree: runGit(['rev-parse', 'HEAD^{tree}']),
  }
}

interface CacheInspection {
  readonly role: LivingFrameComfyUiHardenedCacheRole
  readonly artifactCount: number
  readonly setDigestSha256: string
}

async function inspectCache(
  role: LivingFrameComfyUiHardenedCacheRole,
  root: string,
  manifestPath: string,
  expectedCount: number,
  basenamePattern: RegExp,
): Promise<CacheInspection> {
  assert.match(basename(root), basenamePattern)
  const rootStat = lstatSync(root)
  assert.equal(rootStat.isDirectory(), true)
  assert.equal(rootStat.isSymbolicLink(), false)
  assert.equal((rootStat.mode & 0o222) === 0, true)
  const expected = parseManifest(manifestPath)
  assert.equal(expected.length, expectedCount)
  const visibleFiles = readdirSync(root)
    .filter((entry) => !entry.startsWith('._'))
    .sort()
  assert.deepEqual(
    visibleFiles,
    expected.map((entry) => entry.fileName).sort(),
  )
  const observed = []
  for (const artifact of expected) {
    const path = join(root, artifact.fileName)
    const fileStat = lstatSync(path)
    assert.equal(fileStat.isFile(), true)
    assert.equal(fileStat.isSymbolicLink(), false)
    assert.equal((fileStat.mode & 0o222) === 0, true)
    assert.equal(await sha256File(path), artifact.sha256)
    observed.push(artifact)
  }
  return {
    role,
    artifactCount: observed.length,
    setDigestSha256: sha256CanonicalJson({
      role,
      artifacts: observed,
    }),
  }
}

function parseManifest(
  manifestPath: string,
): readonly {
  readonly sha256: string
  readonly fileName: string
}[] {
  return readFileSync(manifestPath, 'utf8')
    .trim()
    .split(/\r?\n/u)
    .map((line) => {
      const match =
        /^([a-f0-9]{64}) {2}([A-Za-z0-9+_.-]+)$/u.exec(line)
      assert.ok(match)
      return {
        sha256: match[1]!,
        fileName: match[2]!,
      }
    })
}

function bindMount(
  source: string,
  target: string,
): string {
  assert.equal(source.includes(','), false)
  assert.match(target, /^\/[A-Za-z0-9/._-]+$/u)
  return `type=bind,source=${source},target=${target},readonly`
}

interface DockerExecutionResult {
  readonly exitStatus: number
  readonly stdout: string
}

async function executeDockerOnce(
  args: readonly string[],
): Promise<DockerExecutionResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let totalOutputBytes = 0
    const collect = (target: Buffer[]) => (chunk: Buffer) => {
      totalOutputBytes += chunk.length
      if (totalOutputBytes > 8 * 1024 * 1024) {
        child.kill('SIGTERM')
        return
      }
      target.push(chunk)
    }
    child.stdout.on('data', collect(stdout))
    child.stderr.on('data', collect(stderr))
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
    }, 20 * 60 * 1000)
    child.once('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timeout)
      const standardOutput = Buffer.concat(stdout).toString('utf8')
      const errorOutput = Buffer.concat(stderr).toString('utf8')
      if (totalOutputBytes > 8 * 1024 * 1024) {
        reject(
          new Error('sealed_docker_output_limit_exceeded'),
        )
        return
      }
      if (code !== 0) {
        reject(
          new Error(
            `sealed_docker_run_failed:${code ?? -1}:`
            + sha256(`${standardOutput}\n${errorOutput}`),
          ),
        )
        return
      }
      resolvePromise({
        exitStatus: code,
        stdout: standardOutput,
      })
    })
  })
}

function parseVerifierObservation(
  stdout: string,
): LivingFrameComfyUiHardenedRuntimeVerifierObservation {
  const line = stdout
    .trim()
    .split(/\r?\n/u)
    .reverse()
    .find((entry) =>
      entry.includes(
        '"living-frame-comfyui-hardened-runtime-private-build-verifier-v1"',
      ))
  assert.ok(line)
  const parsed = JSON.parse(line) as Record<string, unknown>
  assert.deepEqual(Object.keys(parsed).sort(), [
    'contract',
    'distributionCount',
    'gid',
    'graphExecuted',
    'huggingfaceHub',
    'modelWeightsLoaded',
    'pillow',
    'productionReady',
    'runtimeAuthority',
    'sam2ImportDenied',
    'status',
    'torch',
    'torchCudaBuild',
    'torchaudio',
    'torchvision',
    'transformers',
    'uid',
  ])
  return parsed as unknown as
    LivingFrameComfyUiHardenedRuntimeVerifierObservation
}

function dockerContainerExists(name: string): boolean {
  const result = spawnSync(
    'docker',
    ['container', 'inspect', name],
    { stdio: 'ignore' },
  )
  return result.status === 0
}

function runDocker(args: readonly string[]): string {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `docker_read_only_probe_failed:${result.status ?? -1}`,
    )
  }
  return result.stdout.trim()
}

function runGit(args: readonly string[]): string {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `git_read_only_probe_failed:${result.status ?? -1}`,
    )
  }
  return result.stdout.trim()
}

async function sha256File(path: string): Promise<string> {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) {
    digest.update(chunk as Buffer)
  }
  return digest.digest('hex')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256CanonicalJson(value: unknown): string {
  return sha256(JSON.stringify(sortValue(value)))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)]),
    )
  }
  return value
}
