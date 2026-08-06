import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  assertHostVerificationIntegrity,
  buildReadinessCommandPlans,
  buildStaticProductionReadinessReport,
  createProductionContainerQualificationImageObservation,
  createProductionContainerQualificationSourceObservation,
  hashBoundedHostObservation,
  hashProductionContainerQualificationValue,
  runProductionContainerQualificationProbeWithAdapter,
  verifyProductionContainerQualificationWithHostAdapter,
  type ProductionContainerQualificationHostAdapter,
  type ProductionContainerQualificationImageObservation,
  type ProductionContainerQualificationProbeAdapter,
  type ProductionContainerQualificationSourceObservation,
} from '../workers/readiness-validation'

const sourceCommitSha = '1'.repeat(40)
const sourceTreeHash = '2'.repeat(40)
const imageDigest = `sha256:${'3'.repeat(64)}`
const otherImageDigest = `sha256:${'4'.repeat(64)}`
const imageReference = `registry.example.test/reeditpro-cpu-worker@${imageDigest}`
const otherImageReference = `registry.example.test/reeditpro-cpu-worker@${otherImageDigest}`
const probeAdapter: ProductionContainerQualificationProbeAdapter = {
  inspectCommand(input) {
    return observation(true, { kind: 'command', command: input.command, args: input.args })
  },
  inspectPythonImport(input) {
    return observation(true, { kind: 'python', ...input })
  },
  inspectNodePackage(input) {
    return observation(input.packageName !== 'revideo', { kind: 'node', ...input })
  },
}

let candidateClockTick = 0
const candidate = runProductionContainerQualificationProbeWithAdapter({
  imageRole: 'cpu_worker',
  imageReference,
  sourceCommitSha,
  sourceTreeHash,
  adapter: probeAdapter,
  now: () => new Date(Date.UTC(2026, 6, 21, 14, 0, 0, candidateClockTick++)),
})

const sourceObservation = sourceFixture()
const imageObservation = imageFixture()
const hostAdapter: ProductionContainerQualificationHostAdapter = {
  inspectSource: () => sourceObservation,
  inspectImage: ({ imageReference: requestedReference }) => {
    assert.equal(requestedReference, imageReference)
    return imageObservation
  },
}
let verificationClockTick = 0
const receipt = verifyProductionContainerQualificationWithHostAdapter({
  candidate,
  adapter: hostAdapter,
  now: () => new Date(Date.UTC(2026, 6, 21, 14, 1, 0, verificationClockTick++)),
})

assert.equal(receipt.evidenceClass, 'local_host_source_image_verification_unreleased')
assert.equal(receipt.promotionEligibility, 'not_promotable_without_reviewed_manual_and_release_authority')
assert.equal(receipt.candidateIntegrityVerified, true)
assert.equal(receipt.sourceCommitMatched, true)
assert.equal(receipt.sourceTreeMatched, true)
assert.equal(receipt.cleanWorktreeVerified, true)
assert.equal(receipt.sourceRevalidatedAfterImageInspection, true)
assert.equal(receipt.immutableRepoDigestMatched, true)
assert.equal(receipt.sourceLabelsMatched, true)
assert.equal(receipt.imageRoleLabelMatched, true)
assert.equal(receipt.sourceCleanLabelMatched, true)
assert.equal(receipt.candidateVersionLabelMatched, true)
assert.equal(receipt.runtimeChecksPassed, true)
assert.equal(receipt.forbiddenToolAbsenceVerified, true)
assert.ok(receipt.pendingManualQualificationToolIds.length >= candidate.requiredToolIds.length)
assert.equal(receipt.manualLicenseAndModelGatesVerified, false)
assert.equal(receipt.productionImageQualified, false)
assert.equal(receipt.deployedReleaseQualified, false)
assert.equal(receipt.externalBetaReady, false)
assert.equal(receipt.productionReady, false)
assert.equal(receipt.safety.dockerBuildPerformed, false)
assert.equal(receipt.safety.dockerPullPerformed, false)
assert.equal(receipt.safety.dockerRunPerformed, false)
assert.equal(receipt.safety.providerCallPerformed, false)
assert.equal(receipt.safety.cloudMutationPerformed, false)
assert.equal(receipt.safety.databaseMutationPerformed, false)
assert.equal(receipt.costBoundary.infrastructureProductionCostIncluded, false)
assert.equal(receipt.costBoundary.customerPriceIncluded, false)
assert.equal(receipt.costBoundary.customerCreditsIncluded, false)
assert.equal(receipt.costBoundary.serviceFeeIncluded, false)
assert.deepEqual(assertHostVerificationIntegrity(structuredClone(receipt)), receipt)

assert.throws(
  () => verifyWith({ source: sourceFixture({ worktreeClean: false, statusEntryCount: 1 }) }),
  /exactly clean worktree/i,
)
assert.throws(
  () => verifyWith({ source: sourceFixture({ sourceCommitSha: '5'.repeat(40) }) }),
  /source commit does not match/i,
)
assert.throws(
  () => verifyWith({ source: sourceFixture({ sourceTreeHash: '6'.repeat(40) }) }),
  /source tree does not match/i,
)
assert.throws(
  () => verifyWith({ image: imageFixture({ repoDigests: [otherImageReference] }) }),
  /immutable repository digest/i,
)
assert.throws(
  () => verifyWith({ image: imageFixture({ sourceCommitSha: '7'.repeat(40) }) }),
  /OCI source labels/i,
)
assert.throws(
  () => verifyWith({ image: imageFixture({ imageRole: 'render_worker' }) }),
  /image-role label/i,
)
let sourceInspectionCount = 0
assert.throws(
  () => verifyProductionContainerQualificationWithHostAdapter({
    candidate,
    adapter: {
      inspectSource: () => sourceInspectionCount++ === 0
        ? sourceObservation
        : sourceFixture({ worktreeClean: false, statusEntryCount: 1 }),
      inspectImage: () => imageObservation,
    },
  }),
  /source identity changed during image verification/i,
)

const tamperedSource = structuredClone(sourceObservation)
tamperedSource.statusEntryCount = 1
assert.throws(
  () => verifyWith({ source: tamperedSource }),
  /source observation hash/i,
)
const tamperedImage = structuredClone(imageObservation)
tamperedImage.labels.sourceTreeHash = '8'.repeat(40)
assert.throws(
  () => verifyWith({ image: tamperedImage }),
  /image observation hash/i,
)
const promotionTamper = structuredClone(receipt) as Record<string, unknown>
promotionTamper.productionImageQualified = true
const { verificationHash: _oldHash, ...promotionPayload } = promotionTamper
void _oldHash
promotionTamper.verificationHash = hashProductionContainerQualificationValue(promotionPayload)
assert.throws(
  () => assertHostVerificationIntegrity(promotionTamper),
  /Invalid input|expected false|literal/i,
)

const staticReport = buildStaticProductionReadinessReport()
assert.equal(staticReport.evidenceTiers.productionImageQualification.qualifiedToolIds.length, 0)
assert.equal(staticReport.evidenceTiers.productionImageQualification.sameSourceImageEvidenceSupplied, false)
assert.equal(staticReport.evidenceTiers.deployedReleaseQualification.qualifiedToolIds.length, 0)
const hostCommandPlan = buildReadinessCommandPlans().find((plan) =>
  plan.id === 'container_readiness_host_verification')
assert.equal(hostCommandPlan?.mode, 'host_optional')
assert.match(hostCommandPlan?.command ?? '', /14-verify-container-readiness-candidate\.example\.sh/)
assert.ok(hostCommandPlan?.requiredEnvVars.includes(
  'REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION=true',
))
assert.ok(hostCommandPlan?.doesNotRun.includes('no Docker pull or run'))

const adapterSource = await readFile(new URL(
  '../workers/readiness-validation/production-container-qualification-live-host-adapter.ts',
  import.meta.url,
), 'utf8')
for (const forbidden of [
  'docker build',
  'docker pull',
  'docker run',
  'docker push',
  'fetch(',
  'gcloud ',
  'shell: true',
  'spawn(',
  'SecretManagerServiceClient',
]) assert.equal(adapterSource.includes(forbidden), false)
assert.match(adapterSource, /execFileSync/)
assert.match(adapterSource, /\['image', 'inspect', imageReference\]/)
assert.match(adapterSource, /--porcelain=v1/)
assert.match(adapterSource, /untracked-files=all/)
assert.match(adapterSource, /unix:\/\//)

const helperSource = await readFile(new URL(
  '../../scripts/docker/prod/00-print-image-config.sh',
  import.meta.url,
), 'utf8')
assert.match(helperSource, /require_clean_source_identity/)
assert.match(helperSource, /--porcelain=v1 --untracked-files=all/)
assert.match(helperSource, /HEAD\^\{tree\}/)
assert.match(helperSource, /REEDITPRO_SOURCE_BUILD_ARGS/)
assert.match(helperSource, /REEDITPRO_SOURCE_CLEAN=true/)
const dockerIgnore = await readFile(new URL('../../.dockerignore', import.meta.url), 'utf8')
assert.doesNotMatch(dockerIgnore, /^!dist-server$/mu)
assert.doesNotMatch(dockerIgnore, /^!dist-remotion-worker$/mu)

for (const number of [1, 2, 3, 4, 5, 6]) {
  const scriptName = ({
    1: 'build-api-image',
    2: 'build-cpu-worker-image',
    3: 'build-gpu-worker-image',
    4: 'build-render-worker-image',
    5: 'build-qa-worker-image',
    6: 'build-tool-readiness-image',
  } as Record<number, string>)[number]
  const script = await readFile(new URL(
    `../../scripts/docker/prod/${String(number).padStart(2, '0')}-${scriptName}.example.sh`,
    import.meta.url,
  ), 'utf8')
  assert.match(script, /require_clean_source_identity/)
  assert.match(script, /REEDITPRO_SOURCE_BUILD_ARGS/)
  assert.doesNotMatch(script, /docker build -f/)
}

const dockerfiles = new Map([
  ['api', 'docker/prod/api/Dockerfile'],
  ['cpu_worker', 'docker/prod/cpu-worker/Dockerfile'],
  ['gpu_worker', 'docker/prod/gpu-worker/Dockerfile'],
  ['render_worker', 'docker/prod/render-worker/Dockerfile'],
  ['qa_worker', 'docker/prod/qa-worker/Dockerfile'],
  ['tool_readiness_worker', 'docker/prod/tool-readiness-worker/Dockerfile'],
])
for (const [role, path] of dockerfiles) {
  const dockerfile = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
  assert.match(dockerfile, /ARG REEDITPRO_SOURCE_COMMIT_SHA/)
  assert.match(dockerfile, /ARG REEDITPRO_SOURCE_TREE_HASH/)
  assert.match(dockerfile, /ARG REEDITPRO_SOURCE_CLEAN/)
  assert.match(dockerfile, /org\.opencontainers\.image\.revision/)
  assert.match(dockerfile, /io\.reeditpro\.source\.tree/)
  assert.match(dockerfile, new RegExp(`io\\.reeditpro\\.image\\.role="${role}"`))
  assert.match(dockerfile, /io\.reeditpro\.build\.source\.clean/)
  assert.match(dockerfile, /production-container-qualification-candidate-v1/)
  assert.doesNotMatch(dockerfile, /^COPY (?:--chown=[^ ]+ )?dist-server /mu)
  if (role !== 'api') {
    assert.match(dockerfile, /AS server_build/)
    assert.match(dockerfile, /COPY --from=server_build/)
  }
}
const renderDockerfile = await readFile(new URL(
  '../../docker/prod/render-worker/Dockerfile',
  import.meta.url,
), 'utf8')
assert.doesNotMatch(renderDockerfile, /COPY dist-remotion-worker/)

const cloudBuildConfig = await readFile(new URL(
  '../../scripts/gcp/prod/cloudbuild-image.yaml',
  import.meta.url,
), 'utf8')
assert.match(cloudBuildConfig, /REEDITPRO_SOURCE_COMMIT_SHA=\$\{_SOURCE_COMMIT_SHA\}/)
assert.match(cloudBuildConfig, /REEDITPRO_SOURCE_TREE_HASH=\$\{_SOURCE_TREE_HASH\}/)
assert.match(cloudBuildConfig, /REEDITPRO_SOURCE_CLEAN=\$\{_SOURCE_CLEAN\}/)
const cloudBuildCommand = await readFile(new URL(
  '../../scripts/gcp/prod/07-build-image-commands.sh',
  import.meta.url,
), 'utf8')
assert.match(cloudBuildCommand, /require_clean_source_identity/)
assert.match(cloudBuildCommand, /_SOURCE_COMMIT_SHA=\$\{REEDITPRO_SOURCE_COMMIT_SHA\}/)
assert.match(cloudBuildCommand, /_SOURCE_TREE_HASH=\$\{REEDITPRO_SOURCE_TREE_HASH\}/)
assert.match(cloudBuildCommand, /_SOURCE_CLEAN=\$\{REEDITPRO_SOURCE_CLEAN\}/)

const humanVerificationScript = await readFile(new URL(
  '../../scripts/docker/prod/14-verify-container-readiness-candidate.example.sh',
  import.meta.url,
), 'utf8')
assert.match(humanVerificationScript, /REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION/)
assert.match(humanVerificationScript, /candidate_bytes/)
assert.match(humanVerificationScript, /2097152/)
assert.match(humanVerificationScript, /dist-release-tools\/container-readiness-host-verifier\.js/)
assert.doesNotMatch(humanVerificationScript, /\bdocker\s+(?:build|pull|run|push)\b/)
assert.doesNotMatch(humanVerificationScript, /\beval\b/)

const hostArtifactPath = resolve(
  process.cwd(),
  'dist-release-tools/container-readiness-host-verifier.js',
)
await access(hostArtifactPath)
const unconfirmed = spawnSync(process.execPath, [hostArtifactPath], {
  cwd: process.cwd(),
  env: { PATH: process.env.PATH, TZ: 'UTC' },
  encoding: 'utf8',
  timeout: 5_000,
  input: JSON.stringify(candidate),
})
assert.notEqual(unconfirmed.status, 0)
assert.equal(unconfirmed.signal, null)
assert.match(`${unconfirmed.stdout}${unconfirmed.stderr}`, /explicit_local_host_verification_confirmation_required/)
assert.doesNotMatch(`${unconfirmed.stdout}${unconfirmed.stderr}`, /local_host_source_image_verification_unreleased/)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'production-container-qualification-host-verification-smoke-v1',
  status: 'independent_local_source_image_verification_contract_verified_manual_and_release_gates_closed',
  candidateReceiptHash: candidate.receiptHash,
  hostVerificationHash: receipt.verificationHash,
  requiredToolIds: receipt.requiredToolIds.length,
  optionalToolsObserved: receipt.runtimeObservedOptionalToolIds.length,
  pendingManualQualificationToolIds: receipt.pendingManualQualificationToolIds.length,
  boundaries: {
    dockerBuildPullRunPushPerformed: false,
    mediaModelProviderCloudDatabaseBillingDeploymentActionPerformed: false,
    staticProductionImageEvidenceConsumed: false,
    productionImageQualified: false,
    deployedReleaseQualified: false,
    externalBetaReady: false,
    productionReady: false,
  },
}, null, 2))

function verifyWith(input: {
  source?: ProductionContainerQualificationSourceObservation
  image?: ProductionContainerQualificationImageObservation
}) {
  return verifyProductionContainerQualificationWithHostAdapter({
    candidate,
    adapter: {
      inspectSource: () => input.source ?? sourceObservation,
      inspectImage: () => input.image ?? imageObservation,
    },
    now: (() => {
      let tick = 0
      return () => new Date(Date.UTC(2026, 6, 21, 14, 2, 0, tick++))
    })(),
  })
}

function sourceFixture(input: {
  sourceCommitSha?: string
  sourceTreeHash?: string
  worktreeClean?: boolean
  statusEntryCount?: number
} = {}) {
  const statusEntryCount = input.statusEntryCount ?? 0
  return createProductionContainerQualificationSourceObservation({
    sourceCommitSha: input.sourceCommitSha ?? sourceCommitSha,
    sourceTreeHash: input.sourceTreeHash ?? sourceTreeHash,
    worktreeClean: input.worktreeClean ?? statusEntryCount === 0,
    statusEntryCount,
    statusEvidenceHash: hashBoundedHostObservation(statusEntryCount === 0 ? '' : ' M bounded'),
  })
}

function imageFixture(input: {
  repoDigests?: string[]
  sourceCommitSha?: string
  sourceTreeHash?: string
  imageRole?: 'api' | 'cpu_worker' | 'gpu_worker' | 'render_worker' | 'qa_worker' | 'tool_readiness_worker'
} = {}) {
  return createProductionContainerQualificationImageObservation({
    inspectedImageReference: imageReference,
    imageIdDigest: `sha256:${'9'.repeat(64)}`,
    repoDigests: input.repoDigests ?? [imageReference],
    labels: {
      sourceCommitSha: input.sourceCommitSha ?? sourceCommitSha,
      sourceTreeHash: input.sourceTreeHash ?? sourceTreeHash,
      imageRole: input.imageRole ?? 'cpu_worker',
      sourceClean: 'true',
      candidateContractVersion: 'production-container-qualification-candidate-v1',
    },
    containerEndpointEvidenceHash: hashBoundedHostObservation('local-docker-endpoint'),
    inspectionEvidenceHash: hashBoundedHostObservation('bounded-inspection'),
  })
}

function observation(present: boolean, evidence: unknown) {
  return {
    present,
    evidenceHash: hashProductionContainerQualificationValue(evidence),
  }
}
