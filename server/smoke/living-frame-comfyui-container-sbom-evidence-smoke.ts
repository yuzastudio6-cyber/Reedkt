import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

import {
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
} from '../../src/types/living-frame-comfyui-container-sbom-evidence'
import {
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS,
} from '../living-frame/living-frame-comfyui-dependency-lock-manifest'
import {
  consumeLivingFrameComfyUiSpdxDocumentLease,
  createLivingFrameComfyUiContainerInventoryReader,
  createLivingFrameComfyUiContainerSbomEvidence,
  LivingFrameComfyUiContainerSbomEvidenceError,
  verifyLivingFrameComfyUiContainerSbomEvidence,
  type LivingFrameComfyUiContainerInventoryObservation,
  type LivingFrameComfyUiObservedPythonDistribution,
} from '../living-frame/living-frame-comfyui-container-sbom-evidence'

const IMAGE =
  process.env.REEDITPRO_LIVING_FRAME_COMFYUI_IMAGE
  ?? 'reeditpro-living-frame-comfyui-locked-candidate:local'

if (!imageAvailable()) {
  console.log(JSON.stringify({
    suite:
      'living-frame-comfyui-container-sbom-evidence',
    disposition:
      'skipped_exact_local_candidate_image_unavailable',
    expectedImage: IMAGE,
    productionReady: false,
  }))
  process.exit(0)
}

const reader =
  createLivingFrameComfyUiContainerInventoryReader(
    async () => observeImage(),
  )
const result =
  await createLivingFrameComfyUiContainerSbomEvidence({
    evidenceId: 'lf.comfyui.sbom.local.001',
    inventoryReader: reader,
  })

assert.equal(
  verifyLivingFrameComfyUiContainerSbomEvidence(
    result.evidence,
  ),
  true,
)
assert.equal(
  result.evidence.packageInventory.debianPackageCount,
  590,
)
assert.equal(
  result.evidence.packageInventory.pythonDistributionCount,
  168,
)
assert.equal(
  result.evidence.packageInventory
    .lockedWheelDistributionCount,
  35,
)
assert.equal(
  result.evidence.packageInventory
    .inheritedPythonDistributionCount,
  133,
)
assert.equal(
  result.evidence.packageInventory.totalPackageCount,
  761,
)
assert.deepEqual(
  result.evidence.packageInventory
    .outOfScopeDirectVcsDistributionCodes,
  ['sam-2'],
)
assert.equal(
  result.evidence.imageObservation.imageDefaultUser,
  'root_or_unspecified',
)
assert.equal(
  result.evidence.releasePolicy.releasePolicyPassed,
  false,
)
assert.deepEqual(
  result.evidence.openGateCodes,
  LIVING_FRAME_COMFYUI_CONTAINER_SBOM_OPEN_GATES,
)
const {
  evidenceDigestSha256: _validEvidenceDigest,
  ...validDraft
} = result.evidence
assert.match(_validEvidenceDigest, /^[a-f0-9]{64}$/u)
const forgedReleasePolicyDraft = {
  ...validDraft,
  releasePolicy: {
    ...validDraft.releasePolicy,
    releasePolicyPassed: true,
  },
}
assert.equal(
  verifyLivingFrameComfyUiContainerSbomEvidence({
    ...forgedReleasePolicyDraft,
    evidenceDigestSha256: sha256(
      canonicalJson(forgedReleasePolicyDraft),
    ),
  }),
  false,
)

const spdxBytes =
  consumeLivingFrameComfyUiSpdxDocumentLease(
    result.spdxDocumentLease,
  )
assert.equal(
  spdxBytes.byteLength,
  result.evidence.packageInventory.documentByteLength,
)
assert.equal(
  sha256(spdxBytes),
  result.evidence.packageInventory.documentSha256,
)
const spdx = JSON.parse(
  Buffer.from(spdxBytes).toString('utf8'),
) as {
  spdxVersion: string
  documentNamespace: string
  packages: unknown[]
}
assert.equal(spdx.spdxVersion, 'SPDX-2.3')
assert.equal(spdx.packages.length, 761)
assert.equal(
  spdx.documentNamespace,
  result.evidence.packageInventory
    .documentNamespaceUrn,
)
const serializedSpdx =
  Buffer.from(spdxBytes).toString('utf8')
for (const forbidden of [
  'file://',
  'https://',
  'http://',
  '/opt/',
  '/tmp/',
  '"credential"',
  '"secret"',
]) assert.equal(
  serializedSpdx.toLowerCase().includes(
    forbidden.toLowerCase(),
  ),
  false,
)
assert.throws(
  () => consumeLivingFrameComfyUiSpdxDocumentLease(
    result.spdxDocumentLease,
  ),
  (error: unknown) =>
    error instanceof
      LivingFrameComfyUiContainerSbomEvidenceError
    && error.issues[0]?.code === 'lease_reused',
)

const unstableReader =
  createLivingFrameComfyUiContainerInventoryReader(
    (() => {
      let reads = 0
      return async () => {
        const observation = await observeImage()
        reads += 1
        if (reads === 2) {
          return {
            ...observation,
            explicitRuntimeUid:
              65_531 as 65_532,
          }
        }
        return observation
      }
    })(),
  )
await assert.rejects(
  () => createLivingFrameComfyUiContainerSbomEvidence({
    evidenceId: 'lf.comfyui.sbom.unstable',
    inventoryReader: unstableReader,
  }),
  LivingFrameComfyUiContainerSbomEvidenceError,
)

const serializedEvidence =
  JSON.stringify(result.evidence).toLowerCase()
for (const forbidden of [
  'file://',
  'https://',
  'http://',
  '/opt/',
  '/tmp/',
  '"packages"',
  '"customercredits"',
  '"servicefee"',
  'musashi',
  'helicopter',
  'hormuz',
]) assert.equal(
  serializedEvidence.includes(forbidden),
  false,
)

console.log(JSON.stringify({
  suite:
    'living-frame-comfyui-container-sbom-evidence',
  status: 'passed',
  imageDigestSha256:
    result.evidence.imageObservation
      .candidateImageDigestSha256,
  spdxDocumentSha256:
    result.evidence.packageInventory.documentSha256,
  spdxDocumentByteLength:
    result.evidence.packageInventory.documentByteLength,
  debianPackageCount:
    result.evidence.packageInventory.debianPackageCount,
  pythonDistributionCount:
    result.evidence.packageInventory
      .pythonDistributionCount,
  sourceArchivePackageCount:
    result.evidence.packageInventory
      .sourceArchivePackageCount,
  totalPackageCount:
    result.evidence.packageInventory.totalPackageCount,
  outOfScopeDirectVcsDistributionCodes:
    result.evidence.packageInventory
      .outOfScopeDirectVcsDistributionCodes,
  defaultNonRootPassed:
    result.evidence.releasePolicy.defaultNonRootPassed,
  releasePolicyPassed:
    result.evidence.releasePolicy.releasePolicyPassed,
  privateInternalOnly: true,
  productReady: false,
  productionReady: false,
}))

function imageAvailable(): boolean {
  const result = spawnSync(
    'docker',
    ['image', 'inspect', IMAGE],
    {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    },
  )
  return result.status === 0
}

function observeImage():
LivingFrameComfyUiContainerInventoryObservation {
  const inspect = JSON.parse(
    runDocker([
      'image',
      'inspect',
      IMAGE,
    ]),
  ) as Array<{
    Id: string
    RepoDigests: string[]
    Architecture: string
    Os: string
    Config: {
      User?: string
      Labels: Record<string, string>
    }
  }>
  assert.equal(inspect.length, 1)
  const image = inspect[0]!
  const labels = image.Config.Labels
  const debianPackages = parseDebianPackages(
    runContainer(
      "dpkg-query -W -f='${Package}\\t${Version}\\n'"
        + ' | LC_ALL=C sort',
    ),
  )
  const pythonDistributions =
    parsePythonDistributions(
      runContainer(
        'python3 -m pip freeze --all'
          + ' --disable-pip-version-check'
          + ' | LC_ALL=C sort',
      ),
    )
  const identity = runContainer(
    'printf "%s\\n" "$(id -u)" "$(id -g)";'
      + ' test ! -w / && printf "root_read_only\\n"',
  ).trim().split('\n')
  return {
    observationClass:
      'process_bound_local_comfyui_container_inventory_observation_v1',
    candidateImageDigestSha256:
      image.Id.replace(/^sha256:/u, ''),
    repositoryDigestSha256:
      repositoryDigest(image.RepoDigests),
    operatingSystem: image.Os as 'linux',
    architecture: image.Architecture as 'amd64',
    imageDefaultUser:
      (image.Config.User ?? '') as '',
    labels: {
      controlledBaseImageDigestSha256:
        labels[
          'org.reeditpro.living-frame.base-image-sha256'
        ]!,
      wheelManifestDigestSha256:
        labels[
          'org.reeditpro.living-frame.wheel-manifest-sha256'
        ]!,
      comfyUiRevision:
        labels[
          'org.reeditpro.living-frame.comfyui-revision'
        ]!,
      genericIpAdapterRevision:
        labels[
          'org.reeditpro.living-frame.ipadapter-revision'
        ]!,
      controlNetAuxRevision:
        labels[
          'org.reeditpro.living-frame.controlnet-aux-revision'
        ]!,
    },
    debianPackages,
    pythonDistributions,
    explicitRuntimeUid:
      Number(identity[0]) as 65_532,
    explicitRuntimeGid:
      Number(identity[1]) as 65_532,
    rootFilesystemReadOnlyObserved:
      (identity[2] === 'root_read_only') as true,
    networkDisabledObserved: true,
    localArchitectureEmulationUsed: true,
    rawPathUrlCredentialSecretOrPackageBytesIncluded:
      false,
  }
}

function runContainer(command: string): string {
  return runDocker([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--read-only',
    '--user',
    '65532:65532',
    '--entrypoint',
    '/bin/sh',
    IMAGE,
    '-lc',
    command,
  ])
}

function runDocker(args: readonly string[]): string {
  const result = spawnSync(
    'docker',
    [...args],
    {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    },
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

function parseDebianPackages(
  value: string,
): Array<{
  name: string
  version: string
}> {
  return nonEmptyLines(value).map((line) => {
    const fields = line.split('\t')
    assert.equal(fields.length, 2)
    return {
      name: fields[0]!,
      version: fields[1]!,
    }
  })
}

function parsePythonDistributions(
  value: string,
): LivingFrameComfyUiObservedPythonDistribution[] {
  const lockedByName = new Map(
    LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.map(
      (artifact) => [
        normalizeDistributionName(
          artifact.distributionName,
        ),
        artifact,
      ],
    ),
  )
  return nonEmptyLines(value)
    .map((line) => {
      const lockedMatch = line.match(
        /^([^@]+) @ file:\/\/\/[^#]+#sha256=([a-f0-9]{64})$/u,
      )
      if (lockedMatch) {
        const name = normalizeDistributionName(
          lockedMatch[1]!.trim(),
        )
        const artifact = lockedByName.get(name)
        assert.ok(artifact)
        assert.equal(lockedMatch[2], artifact.sha256)
        return {
          name,
          version: artifact.version,
          sourceKind:
            'locked_local_wheel',
          artifactSha256: artifact.sha256,
          sourceRevision: null,
        } as const
      }
      const vcsMatch = line.match(
        /^SAM-2 @ git\+https:\/\/github\.com\/facebookresearch\/sam2\.git@([a-f0-9]{40})$/u,
      )
      if (vcsMatch) {
        return {
          name: 'sam-2',
          version: `0+git.${vcsMatch[1]!.slice(0, 12)}`,
          sourceKind:
            'inherited_direct_vcs_distribution',
          artifactSha256: null,
          sourceRevision: vcsMatch[1]!,
        } as const
      }
      const registryMatch = line.match(
        /^([^=]+)==(.+)$/u,
      )
      assert.ok(
        registryMatch,
        `Unexpected pip-freeze line: ${line}`,
      )
      return {
        name: normalizeDistributionName(
          registryMatch[1]!.trim(),
        ),
        version: registryMatch[2]!.trim(),
        sourceKind:
          'inherited_registry_distribution',
        artifactSha256: null,
        sourceRevision: null,
      } as const
    })
    .sort((left, right) =>
      {
        const leftIdentity =
          `${left.name}\u0000${left.version}`
        const rightIdentity =
          `${right.name}\u0000${right.version}`
        return leftIdentity < rightIdentity
          ? -1
          : leftIdentity > rightIdentity
            ? 1
            : 0
      })
}

function repositoryDigest(
  repoDigests: readonly string[],
): string {
  const match = repoDigests.find((candidate) =>
    candidate.endsWith(
      `@sha256:${
        LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
      }`,
    ))
  assert.ok(match)
  return match.slice(match.lastIndexOf(':') + 1)
}

function normalizeDistributionName(
  value: string,
): string {
  return value.toLowerCase().replace(/[_.]+/gu, '-')
}

function nonEmptyLines(value: string): string[] {
  return value.split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter(Boolean)
}

function sha256(
  value: string | Uint8Array,
): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (
    typeof value === 'object'
    && value !== null
  ) {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record).sort().map((key) => [
        key,
        sortValue(record[key]),
      ]),
    )
  }
  return value
}
