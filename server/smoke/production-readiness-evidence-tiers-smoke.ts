import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  buildStaticProductionReadinessReport,
  getCanonicalPrivateToolReadinessEvidence,
  summarizeProductionReadinessReport,
} from '../workers/readiness-validation'

const report = buildStaticProductionReadinessReport()
const tiers = report.evidenceTiers

assert.ok(Object.isFrozen(tiers))
assert.ok(Object.isFrozen(tiers.privateInternal.runnerVerifiedToolIds))
assert.equal(tiers.registryToolCount, 50)
assert.equal(tiers.privateInternal.runnerVerifiedToolIds.length, 50)
assert.equal(tiers.privateInternal.canonicalEndToEndVerifiedToolIds.length, 50)
assert.equal(tiers.privateInternal.canonicalJobAdapterVerifiedToolIds.length, 50)
assert.deepEqual(tiers.privateInternal.canonicalBoundaryContractVerifiedToolIds, [])
assert.deepEqual(tiers.productionImageQualification.qualifiedToolIds, [])
assert.deepEqual(tiers.deployedReleaseQualification.qualifiedToolIds, [])
assert.equal(tiers.productionImageQualification.sameSourceImageEvidenceSupplied, false)
assert.equal(tiers.deployedReleaseQualification.deployedSameImageEvidenceSupplied, false)
assert.equal(tiers.privateInternal.productReady, false)
assert.equal(tiers.privateInternal.externalBetaReady, false)
assert.equal(tiers.privateInternal.productionReady, false)

const ffmpeg = report.toolSummaries.find((tool) => tool.toolId === 'ffmpeg')
assert.ok(ffmpeg)
assert.equal(ffmpeg.statusScope, 'production_image_and_release_qualification')
assert.equal(ffmpeg.canonicalPrivateEvidence.verificationState, 'canonical_e2e_verified')
assert.equal(ffmpeg.canonicalPrivateEvidence.privateInternalRunnerReady, true)
assert.equal(ffmpeg.canonicalPrivateEvidence.privateInternalEndToEndReady, true)
assert.equal(ffmpeg.canonicalPrivateEvidence.privateInternalJobAdapterReady, true)
assert.equal(ffmpeg.canonicalPrivateEvidence.productReady, false)
assert.equal(ffmpeg.productionImageQualification.status, 'not_verified')
assert.equal(ffmpeg.productionImageQualification.qualified, false)
assert.equal(ffmpeg.deployedReleaseQualification.status, 'not_verified')
assert.equal(ffmpeg.deployedReleaseQualification.qualified, false)
assert.notEqual(ffmpeg.status, 'passed')
assert.ok(ffmpeg.blockers.some((blocker) =>
  /production-image qualification evidence is missing/i.test(blocker.message) &&
  /same-source production-image readiness receipt/i.test(blocker.message)))
assert.ok(!ffmpeg.blockers.some((blocker) =>
  /tool is missing for production readiness/i.test(blocker.message)))

for (const nonE2ECapability of [
  'torch_torchvision',
  'revideo',
  'hyperframe',
] as const) {
  assert.throws(
    () => getCanonicalPrivateToolReadinessEvidence(nonE2ECapability),
    /not in the canonical 50-tool production registry/i,
  )
  assert.ok(
    !report.toolSummaries.some(
      (tool) => String(tool.toolId) === nonE2ECapability,
    ),
  )
}

for (const tool of report.toolSummaries) {
  assert.equal(tool.statusScope, 'production_image_and_release_qualification')
  assert.equal(tool.productionImageQualification.qualified, false)
  assert.equal(tool.productionImageQualification.exactSourceCommitMatched, false)
  assert.equal(tool.productionImageQualification.immutableImageDigestVerified, false)
  assert.equal(tool.deployedReleaseQualification.qualified, false)
  assert.equal(tool.deployedReleaseQualification.sameQualifiedImageDigestDeployed, false)
}

const launchCore = report.actionPlan.stages.find((stage) =>
  stage.id === 'launch_core_container_readiness')
assert.ok(launchCore)
assert.ok(launchCore.canonicalPrivateEndToEndVerifiedToolIds.includes('ffmpeg'))
assert.ok(launchCore.canonicalPrivateEndToEndVerifiedToolIds.includes('remotion'))
assert.ok(launchCore.canonicalPrivateJobAdapterVerifiedToolIds.includes('ffmpeg'))
assert.deepEqual(launchCore.canonicalPrivateBoundaryContractVerifiedToolIds, [])
assert.ok(launchCore.productionReadinessMissingToolIds.includes('ffmpeg'))
assert.ok(launchCore.productionReadinessMissingToolIds.includes('remotion'))
assert.match(launchCore.transitionSummary, /canonical private end-to-end proof/i)
assert.match(launchCore.transitionSummary, /23 tool\(s\)/i)
assert.doesNotMatch(
  launchCore.transitionSummary,
  /non-executable integration boundary/i,
)
assert.match(
  launchCore.transitionSummary,
  /same-source production image and deployed-release evidence/i,
)

const summary = summarizeProductionReadinessReport(report)
assert.match(summary, /canonical private runner proof: 50\/50/i)
assert.match(summary, /canonical private end-to-end proof: 50\/50/i)
assert.match(summary, /canonical private job-adapter proof: 50\/50/i)
assert.match(summary, /canonical non-executable boundary-contract proof: 0\/50/i)
assert.match(summary, /same-source production-image qualification: 0\/50/i)
assert.match(summary, /deployed-release qualification: 0\/50/i)
assert.match(summary, /Production image\/release qualification statuses:/)

const source = await readFile(new URL(
  '../workers/readiness-validation/canonical-tool-readiness-evidence.ts',
  import.meta.url,
), 'utf8')
for (const forbiddenRuntimeAuthority of [
  'node:child_process',
  'docker build',
  'docker run',
  'gcloud ',
  'SecretManagerServiceClient',
  'createClient(',
  'fetch(',
]) {
  assert.ok(!source.includes(forbiddenRuntimeAuthority))
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'production-readiness-evidence-tiers-smoke-v1',
  status: 'canonical_private_proof_visible_production_image_and_release_evidence_blocked',
  counts: {
    registryTools: tiers.registryToolCount,
    privateRunnerVerified: tiers.privateInternal.runnerVerifiedToolIds.length,
    privateCanonicalEndToEndVerified:
      tiers.privateInternal.canonicalEndToEndVerifiedToolIds.length,
    privateCanonicalJobAdapterVerified:
      tiers.privateInternal.canonicalJobAdapterVerifiedToolIds.length,
    privateCanonicalBoundaryContractVerified:
      tiers.privateInternal.canonicalBoundaryContractVerifiedToolIds.length,
    productionImageQualified:
      tiers.productionImageQualification.qualifiedToolIds.length,
    deployedReleaseQualified:
      tiers.deployedReleaseQualification.qualifiedToolIds.length,
  },
  boundaries: {
    productionContainerBuiltOrRun: false,
    providerOrCloudCallPerformed: false,
    remoteDatabaseOrStorageMutationPerformed: false,
    billingOrCustomerCommercialAuthorityIncluded: false,
    externalBetaReady: false,
    productionReady: false,
  },
}, null, 2))
