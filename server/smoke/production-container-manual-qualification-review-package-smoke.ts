import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  assertProductionContainerManualQualificationReviewPackage,
  buildProductionContainerManualQualificationReviewPackage,
  buildReadinessCommandPlans,
  buildStaticProductionReadinessReport,
  createProductionContainerQualificationImageObservation,
  createProductionContainerQualificationSourceObservation,
  hashBoundedHostObservation,
  hashProductionContainerQualificationValue,
  runProductionContainerQualificationProbeWithAdapter,
  verifyProductionContainerQualificationWithHostAdapter,
  type ProductionContainerQualificationHostVerification,
  type ProductionContainerQualificationProbeAdapter,
  type ProductionContainerQualificationSourceObservation,
} from '../workers/readiness-validation'

const sourceCommitSha = '1'.repeat(40)
const sourceTreeHash = '2'.repeat(40)
const imageDigest = `sha256:${'3'.repeat(64)}`
const imageReference = `registry.example.test/reeditpro-gpu-worker@${imageDigest}`
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
let candidateTick = 0
const candidate = runProductionContainerQualificationProbeWithAdapter({
  imageRole: 'gpu_worker',
  imageReference,
  sourceCommitSha,
  sourceTreeHash,
  adapter: probeAdapter,
  now: () => new Date(Date.UTC(2026, 6, 21, 16, 0, 0, candidateTick++)),
})
assert.equal(candidate.candidateReadyForIndependentVerification, true)

const sourceObservation = sourceFixture()
const imageObservation = createProductionContainerQualificationImageObservation({
  inspectedImageReference: imageReference,
  imageIdDigest: `sha256:${'9'.repeat(64)}`,
  repoDigests: [imageReference],
  labels: {
    sourceCommitSha,
    sourceTreeHash,
    imageRole: 'gpu_worker',
    sourceClean: 'true',
    candidateContractVersion: 'production-container-qualification-candidate-v1',
  },
  containerEndpointEvidenceHash: hashBoundedHostObservation('local-container-endpoint'),
  inspectionEvidenceHash: hashBoundedHostObservation('gpu-image-inspection'),
})
let hostTick = 0
const hostVerification = verifyProductionContainerQualificationWithHostAdapter({
  candidate,
  adapter: {
    inspectSource: () => sourceObservation,
    inspectImage: () => imageObservation,
  },
  now: () => new Date(Date.UTC(2026, 6, 21, 16, 1, 0, hostTick++)),
})

const reviewPackage = buildProductionContainerManualQualificationReviewPackage({
  hostVerification,
  sourceAdapter: { inspectSource: () => sourceObservation },
  now: () => new Date(Date.UTC(2026, 6, 21, 16, 2, 0)),
})

assert.equal(reviewPackage.evidenceClass, 'source_generated_image_bound_manual_review_package_non_promotable')
assert.equal(reviewPackage.authorityClass, 'review_input_only_no_approval_or_release_authority')
assert.equal(reviewPackage.hostVerificationHash, hostVerification.verificationHash)
assert.equal(reviewPackage.exactCleanSourceReverified, true)
assert.equal(reviewPackage.imageRole, 'gpu_worker')
assert.equal(reviewPackage.imageReference, imageReference)
assert.deepEqual(reviewPackage.pendingManualQualificationToolIds, hostVerification.pendingManualQualificationToolIds)
assert.equal(reviewPackage.toolReviewItems.length, hostVerification.pendingManualQualificationToolIds.length)
assert.ok(reviewPackage.toolReviewItems.every((item) =>
  item.packageReleaseReviewRequired && item.reviewState === 'pending_human_review'))
for (const toolId of ['faster_whisper', 'deepfilternet', 'demucs', 'torch_torchvision', 'transformers']) {
  assert.ok(reviewPackage.pendingModelWeightReviewToolIds.includes(toolId as never))
  const item = reviewPackage.toolReviewItems.find((candidate) => candidate.toolId === toolId)
  assert.ok(item?.modelWeightTemplateId)
  assert.ok(item?.modelWeightTemplateDigest)
  assert.equal(item?.modelWeightTemplateSummary?.checksumPresent, false)
}
for (const toolId of ['birefnet', 'sam2', 'real_esrgan', 'film']) {
  assert.ok(reviewPackage.pendingSourceInstallReviewToolIds.includes(toolId as never))
  const item = reviewPackage.toolReviewItems.find((candidate) => candidate.toolId === toolId)
  assert.equal(item?.sourceInstallReviewRequired, true)
  assert.ok(item?.sourceInstallPackageName)
  assert.ok(item?.sourceInstallReason)
}
assert.equal(reviewPackage.reviewState, 'not_started')
assert.equal(reviewPackage.reviewerDecisionAccepted, false)
assert.equal(reviewPackage.manualLicenseAndModelGatesVerified, false)
assert.equal(reviewPackage.sourceInstallGatesVerified, false)
assert.equal(reviewPackage.productionImageQualified, false)
assert.equal(reviewPackage.deployedReleaseQualified, false)
assert.equal(reviewPackage.externalBetaReady, false)
assert.equal(reviewPackage.productionReady, false)
assert.equal(reviewPackage.costBoundary.providerCostIncluded, false)
assert.equal(reviewPackage.costBoundary.infrastructureProductionCostIncluded, false)
assert.equal(reviewPackage.costBoundary.customerPriceIncluded, false)
assert.equal(reviewPackage.costBoundary.customerCreditsIncluded, false)
assert.equal(reviewPackage.costBoundary.serviceFeeIncluded, false)
assert.deepEqual(
  assertProductionContainerManualQualificationReviewPackage(
    structuredClone(reviewPackage),
    hostVerification,
  ),
  reviewPackage,
)

assert.throws(
  () => buildReviewPackage(hostVerification, [sourceFixture({ worktreeClean: false, statusEntryCount: 1 })]),
  /exact clean host-verification source/i,
)
assert.throws(
  () => buildReviewPackage(hostVerification, [sourceFixture({ sourceCommitSha: '4'.repeat(40) })]),
  /exact clean host-verification source/i,
)
assert.throws(
  () => buildReviewPackage(hostVerification, [
    sourceObservation,
    sourceFixture({ worktreeClean: false, statusEntryCount: 1 }),
  ]),
  /exact clean host-verification source|source identity changed/i,
)

const staleLicenseHost = rehashHostVerification({
  ...structuredClone(hostVerification),
  pendingLicenseReviewToolIds: [],
})
assert.throws(
  () => buildReviewPackage(staleLicenseHost, [sourceObservation, sourceObservation]),
  /license inventory is stale/i,
)
const staleModelHost = rehashHostVerification({
  ...structuredClone(hostVerification),
  pendingModelWeightReviewToolIds: [],
})
assert.throws(
  () => buildReviewPackage(staleModelHost, [sourceObservation, sourceObservation]),
  /model-weight inventory is stale/i,
)

const semanticTamper = structuredClone(reviewPackage)
semanticTamper.toolReviewItems[0]!.profileDigest = '5'.repeat(64)
semanticTamper.toolReviewItems[0]!.itemHash = itemHash(semanticTamper.toolReviewItems[0]!)
semanticTamper.toolInventoryHash = hashProductionContainerQualificationValue(
  semanticTamper.toolReviewItems,
)
semanticTamper.packageHash = packageHash(semanticTamper)
assert.throws(
  () => assertProductionContainerManualQualificationReviewPackage(
    semanticTamper,
    hostVerification,
  ),
  /tool inventory is stale or invalid/i,
)

const promotionTamper = structuredClone(reviewPackage) as Record<string, unknown>
promotionTamper.reviewerDecisionAccepted = true
promotionTamper.productionImageQualified = true
promotionTamper.packageHash = packageHash(promotionTamper)
assert.throws(
  () => assertProductionContainerManualQualificationReviewPackage(
    promotionTamper,
    hostVerification,
  ),
  /Invalid input|expected false|literal/i,
)

const projected = JSON.stringify(reviewPackage)
for (const forbidden of [
  '/Users/',
  '/Volumes/',
  'providerApiKey',
  'service_role_key',
  'signedUrl',
  '"customerPrice":',
  'serviceFeeAmount',
]) assert.equal(projected.includes(forbidden), false)

const staticReport = buildStaticProductionReadinessReport()
assert.equal(staticReport.evidenceTiers.productionImageQualification.qualifiedToolIds.length, 0)
assert.equal(staticReport.evidenceTiers.deployedReleaseQualification.qualifiedToolIds.length, 0)
const commandPlan = buildReadinessCommandPlans().find((plan) =>
  plan.id === 'container_manual_qualification_review_package')
assert.equal(commandPlan?.mode, 'host_optional')
assert.match(commandPlan?.command ?? '', /15-prepare-container-manual-review-package\.example\.sh/)
assert.ok(commandPlan?.doesNotRun.includes('no license or model approval'))

const script = await readFile(new URL(
  '../../scripts/docker/prod/15-prepare-container-manual-review-package.example.sh',
  import.meta.url,
), 'utf8')
assert.match(script, /REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION/)
assert.match(script, /REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE/)
assert.match(script, /receipt_bytes/)
assert.match(script, /2097152/)
assert.match(script, /container-manual-review-package\.js/)
assert.doesNotMatch(script, /\bdocker\s+(?:build|pull|run|push)\b/)
assert.doesNotMatch(script, /\bgcloud\b|\beval\b/)

const cliSource = await readFile(new URL(
  '../cli/prepare-production-container-manual-qualification-review.ts',
  import.meta.url,
), 'utf8')
assert.match(cliSource, /REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION/)
assert.match(cliSource, /MAX_HOST_RECEIPT_BYTES/)
assert.doesNotMatch(cliSource, /reviewerDecisionAccepted:\s*true/)
assert.doesNotMatch(cliSource, /productionImageQualified:\s*true/)
assert.doesNotMatch(cliSource, /fetch\(|gcloud|SecretManagerServiceClient/)

const artifactPath = resolve(
  process.cwd(),
  'dist-release-tools/container-manual-review-package.js',
)
await access(artifactPath)
const unconfirmed = spawnSync(process.execPath, [artifactPath], {
  cwd: process.cwd(),
  env: { PATH: process.env.PATH, TZ: 'UTC' },
  encoding: 'utf8',
  timeout: 5_000,
  input: JSON.stringify(hostVerification),
})
assert.notEqual(unconfirmed.status, 0)
assert.equal(unconfirmed.signal, null)
assert.match(
  `${unconfirmed.stdout}${unconfirmed.stderr}`,
  /explicit_manual_review_preparation_confirmation_required/,
)
assert.doesNotMatch(
  `${unconfirmed.stdout}${unconfirmed.stderr}`,
  /source_generated_image_bound_manual_review_package_non_promotable/,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'production-container-manual-qualification-review-package-smoke-v1',
  status: 'exact_image_bound_manual_review_input_verified_no_approval_or_release_authority',
  hostVerificationHash: hostVerification.verificationHash,
  reviewPackageHash: reviewPackage.packageHash,
  toolReviewItems: reviewPackage.toolReviewItems.length,
  pendingLicenseDecisions: reviewPackage.pendingLicenseDecisionToolIds.length,
  pendingModelWeightReviews: reviewPackage.pendingModelWeightReviewToolIds.length,
  pendingSourceInstallReviews: reviewPackage.pendingSourceInstallReviewToolIds.length,
  boundaries: {
    reviewerDecisionAccepted: false,
    productionImageQualified: false,
    deployedReleaseQualified: false,
    externalBetaReady: false,
    productionReady: false,
  },
}, null, 2))

function buildReviewPackage(
  verification: ProductionContainerQualificationHostVerification,
  observations: ProductionContainerQualificationSourceObservation[],
) {
  let index = 0
  return buildProductionContainerManualQualificationReviewPackage({
    hostVerification: verification,
    sourceAdapter: {
      inspectSource: () => observations[Math.min(index++, observations.length - 1)]!,
    },
    now: () => new Date(Date.UTC(2026, 6, 21, 16, 3, 0)),
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

function rehashHostVerification(
  verification: ProductionContainerQualificationHostVerification,
): ProductionContainerQualificationHostVerification {
  const { verificationHash: _verificationHash, ...payload } = verification
  void _verificationHash
  return {
    ...verification,
    verificationHash: hashProductionContainerQualificationValue(payload),
  }
}

function itemHash(item: typeof semanticTamper.toolReviewItems[number]): string {
  const { itemHash: _itemHash, ...payload } = item
  void _itemHash
  return hashProductionContainerQualificationValue(payload)
}

function packageHash(reviewPackage: Record<string, unknown>): string {
  const { packageHash: _packageHash, ...payload } = reviewPackage
  void _packageHash
  return hashProductionContainerQualificationValue(payload)
}

function observation(present: boolean, evidence: unknown) {
  return {
    present,
    evidenceHash: hashProductionContainerQualificationValue(evidence),
  }
}
