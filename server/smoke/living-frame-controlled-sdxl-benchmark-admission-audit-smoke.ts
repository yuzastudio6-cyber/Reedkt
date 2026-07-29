import assert from 'node:assert/strict'

import type {
  LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlBenchmarkAdmissionAudit,
  readLivingFrameControlledSdxlBenchmarkRegistryObservation,
  verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const benchmarkSpecificationInput = {
  specificationId:
    'spec.sdxl.benchmark-admission-audit.001',
  candidateSet:
    controlledSdxlArtifactCandidateSetSmokeFixture.candidateSet,
  candidateSetInput:
    controlledSdxlArtifactCandidateSetSmokeFixture.input,
}
const benchmarkSpecification =
  await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    benchmarkSpecificationInput,
  )

const registry =
  readLivingFrameControlledSdxlBenchmarkRegistryObservation()
assert.equal(registry.expectedCapabilityId, 'comfyui')
assert.equal(
  registry.expectedOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  registry.nonE2eCapabilityCatalogEntryPresent,
  true,
)
assert.equal(registry.nonE2eEvaluationOnly, true)
assert.equal(registry.gpuWorkerCandidateDeclared, true)
assert.equal(registry.gpuRequired, true)
assert.equal(registry.cpuFallbackForbidden, true)
assert.equal(registry.exactModelWeightReviewRequired, true)
assert.equal(registry.productionToolIdentityPresent, false)
assert.equal(registry.exactOperationContractPresent, false)
assert.equal(registry.privateGpuRunnerVerified, false)
assert.equal(registry.productReady, false)

const input = {
  auditId: 'audit.sdxl.benchmark-admission.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  exactArtifactEvidence: {
    state: 'not_injected',
  } as const,
}
const audit =
  await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit(
    audit,
    input,
  ),
  true,
)
assert.equal(
  audit.auditState,
  'blocked_exact_artifacts_and_mount_required',
)
assert.equal(
  audit.exactArtifactEvidenceState.state,
  'not_injected',
)
assert.equal(
  audit.sourceBindings
    .exactCanonicalArtifactBindingDigestSha256,
  null,
)
assert.equal(
  audit.sourceBindings
    .readOnlyModelPreparationDigestSha256,
  null,
)
assert.equal(
  audit.openGateCodes.includes(
    'exact_canonical_artifact_binding_required',
  ),
  true,
)
assert.equal(
  audit.openGateCodes.includes(
    'single_use_read_only_model_mount_required',
  ),
  true,
)
assert.equal(
  audit.exactArtifactsAndLocalReadOnlyPresentationRevalidated,
  false,
)
assert.equal(
  audit.exactDependencyGraphAndArtifactLineageBound,
  false,
)
assert.equal(audit.benchmarkRequestReady, false)
assert.equal(audit.releasedGpuAttemptPresent, false)
assert.equal(
  audit.canonicalGpuMetricAttestationPresent,
  false,
)
assert.equal(
  audit.canonicalInternalCostReceiptPresent,
  false,
)
assert.equal(audit.selectedSceneCreated, false)
assert.equal(audit.subjectSpecificRouting, false)
assert.equal(audit.productionReady, false)
assertAuthority(audit.authorityBoundary)

const serialized = JSON.stringify(audit)
for (const forbidden of [
  'musashi',
  'hormuz',
  'helicopter',
  'providerId',
  'queueId',
  'jobId',
  'promptText',
  'https://',
  'file://',
  '/tmp/',
]) {
  assert.equal(
    serialized.toLowerCase().includes(forbidden.toLowerCase()),
    false,
  )
}

let adversarialAssertions = 0
for (const forged of [
  {
    ...audit,
    productionReady: true,
  },
  {
    ...audit,
    auditDigestSha256: 'a'.repeat(64),
  },
  {
    ...audit,
    auditState:
      'blocked_gpu_image_and_distributed_mount_required',
  },
  {
    ...audit,
    exactArtifactEvidenceState: {
      state: 'server_revalidated',
      exactArtifactCount: 5,
      readOnlyPresentationCount: 5,
    },
    exactArtifactsAndLocalReadOnlyPresentationRevalidated:
      true,
    exactDependencyGraphAndArtifactLineageBound: true,
  },
  {
    ...audit,
    benchmarkRequestReady: true,
    releasedGpuAttemptPresent: true,
    canonicalGpuMetricAttestationPresent: true,
    canonicalInternalCostReceiptPresent: true,
  },
  {
    ...audit,
    registryObservation: {
      ...audit.registryObservation,
      productionToolIdentityPresent: true,
      exactOperationContractPresent: true,
      privateGpuRunnerVerified: true,
      productReady: true,
    },
  },
  {
    ...audit,
    authorityBoundary: {
      ...audit.authorityBoundary,
      canonicalOperationAuthority: true,
      gpuExecutionAuthority: true,
      dispatchAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
  {
    ...audit,
    operationId:
      'tool.comfyui.generate_controlled_image.v1',
    queueId: 'caller-selected-queue',
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit(
      forged,
      input,
    ),
    false,
  )
  adversarialAssertions += 1
}

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkAdmissionAudit({
      ...input,
      approved: true,
    } as never),
  /benchmark admission audit failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkAdmissionAudit({
      ...input,
      exactArtifactEvidence: {
        state: 'injected',
        canonicalArtifactBinding: null,
        canonicalArtifactBindingInput: null,
        readOnlyModelMount: null,
      },
    } as never),
  /benchmark admission audit failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkAdmissionAudit({
      ...input,
      exactArtifactEvidence: {
        state: 'not_injected',
        exactArtifactCount: 5,
      },
    } as never),
  /benchmark admission audit failed/u,
)
adversarialAssertions += 1

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-benchmark-admission-audit',
  controlledFixtures: 1,
  registryAssertions: 12,
  adversarialAssertions,
  auditState: audit.auditState,
  nonE2eCapabilityCatalogEntryPresent:
    audit.registryObservation
      .nonE2eCapabilityCatalogEntryPresent,
  productionToolIdentityPresent:
    audit.registryObservation.productionToolIdentityPresent,
  exactOperationContractPresent:
    audit.registryObservation.exactOperationContractPresent,
  exactArtifactEvidenceState:
    audit.exactArtifactEvidenceState.state,
  benchmarkRequestReady: false,
  benchmarkExecuted: false,
  productionReady: false,
}))

function assertAuthority(
  authority:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority,
): void {
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      key === 'deterministicAdmissionAuditAuthority',
      `Unexpected authority value for ${key}.`,
    )
  }
}
