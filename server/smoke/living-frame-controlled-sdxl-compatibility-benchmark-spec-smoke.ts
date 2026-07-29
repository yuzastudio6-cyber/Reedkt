import assert from 'node:assert/strict'

import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkAuthority,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
  readLivingFrameControlledSdxlCompatibilityBenchmarkPolicy,
  verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const policy =
  readLivingFrameControlledSdxlCompatibilityBenchmarkPolicy()

assert.deepEqual(
  policy.cases.map((entry) => entry.caseId),
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
)
assert.deepEqual(
  policy.thresholds.map((entry) => entry.metricCode).sort(),
  [...LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS]
    .sort(),
)
assert.equal(
  policy.cases.filter((entry) =>
    entry.caseClass === 'isolated_capability_effect').length,
  3,
)
assert.equal(
  policy.cases.every((entry) =>
    new Set([
      ...entry.enabledComponents,
      ...entry.disabledComponents,
    ]).size
      ===
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS
        .length),
  true,
)

const input = {
  specificationId:
    'spec.sdxl.subject-neutral-compatibility.001',
  candidateSet:
    controlledSdxlArtifactCandidateSetSmokeFixture.candidateSet,
  candidateSetInput:
    controlledSdxlArtifactCandidateSetSmokeFixture.input,
}
const specification =
  await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    specification,
    input,
  ),
  true,
)
assert.equal(specification.metrics.caseCount, 7)
assert.equal(specification.metrics.candidateArtifactCount, 5)
assert.equal(
  specification.metrics.candidateArtifactByteLength,
  11_700_367_157,
)
assert.equal(
  specification.metrics.isolatedCapabilityProbeCount,
  3,
)
assert.equal(specification.metrics.combinedRunCount, 2)
assert.equal(specification.metrics.requiredMetricCount, 11)
assert.equal(
  specification.sourceBindings.ipAdapterMergedWorkflowId,
  controlledSdxlArtifactCandidateSetSmokeFixture.input
    .requirementsInput.controlledModelFamilyBinding
    .sourceBindings.ipAdapterMergedWorkflow.present
    ? controlledSdxlArtifactCandidateSetSmokeFixture.input
      .requirementsInput.controlledModelFamilyBinding
      .sourceBindings.ipAdapterMergedWorkflow.mergedWorkflowId
    : 'missing',
)
assert.deepEqual(
  specification.cases.find((entry) =>
    entry.caseId === 'full_combined_primary')
    ?.enabledComponents,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS,
)
assert.equal(
  specification.cases.find((entry) =>
    entry.caseId === 'full_combined_replay')?.comparisonCaseId,
  'full_combined_primary',
)
assert.equal(
  specification.cases.find((entry) =>
    entry.caseId === 'full_combined_replay')?.seed,
  specification.cases.find((entry) =>
    entry.caseId === 'full_combined_primary')?.seed,
)
assert.equal(specification.exactCanonicalArtifactsBound, false)
assert.equal(specification.exactArtifactsMounted, false)
assert.equal(specification.benchmarkAdmitted, false)
assert.equal(specification.benchmarkExecuted, false)
assert.equal(specification.benchmarkMeasurementsPresent, false)
assert.equal(specification.exactBundleCompatibilityProven, false)
assert.equal(specification.selectedSceneCreated, false)
assert.equal(specification.productionReady, false)
assertAuthority(specification.authorityBoundary)

const serialized = JSON.stringify(specification)
for (const forbidden of [
  'musashi',
  'hormuz',
  'helicopter',
  'providerId',
  'toolId',
  'operationId',
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
    ...specification,
    productionReady: true,
  },
  {
    ...specification,
    exactCanonicalArtifactsBound: true,
    exactArtifactsMounted: true,
    benchmarkAdmitted: true,
    benchmarkExecuted: true,
    benchmarkMeasurementsPresent: true,
    exactBundleCompatibilityProven: true,
  },
  {
    ...specification,
    specificationDigestSha256: 'a'.repeat(64),
  },
  {
    ...specification,
    cases: [...specification.cases].reverse(),
  },
  {
    ...specification,
    cases: specification.cases.map((entry) =>
      entry.caseId === 'lora_effect_probe'
        ? {
            ...entry,
            comparisonCaseId: 'full_combined_primary',
          }
        : entry),
  },
  {
    ...specification,
    thresholds: specification.thresholds.map((entry) =>
      entry.metricCode === 'peak_gpu_memory_mib'
        ? {
            ...entry,
            maximum: 99_999,
          }
        : entry),
  },
  {
    ...specification,
    fixtureRecipes: {
      ...specification.fixtureRecipes,
      serverOwnedFixtureArtifactsPresent: true,
    },
  },
  {
    ...specification,
    authorityBoundary: {
      ...specification.authorityBoundary,
      operationAuthority: true,
      dispatchAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
  {
    ...specification,
    operationId: 'tool.comfyui.execute.v1',
    queueId: 'caller-selected-queue',
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
      forged,
      input,
    ),
    false,
  )
  adversarialAssertions += 1
}

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlCompatibilityBenchmarkSpec({
      ...input,
      approved: true,
    } as never),
  /benchmark specification failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlCompatibilityBenchmarkSpec({
      ...input,
      candidateSet: {
        ...input.candidateSet,
        candidateSetDigestSha256: 'b'.repeat(64),
      },
    }),
  /benchmark specification failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlCompatibilityBenchmarkSpec({
      ...input,
      candidateSet: {
        ...input.candidateSet,
        artifacts: [...input.candidateSet.artifacts].reverse(),
      },
    }),
  /benchmark specification failed/u,
)
adversarialAssertions += 1

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-compatibility-benchmark-spec',
  controlledFixtures: 1,
  adversarialAssertions,
  caseCount: specification.metrics.caseCount,
  candidateArtifactCount:
    specification.metrics.candidateArtifactCount,
  candidateArtifactByteLength:
    specification.metrics.candidateArtifactByteLength,
  isolatedCapabilityProbeCount:
    specification.metrics.isolatedCapabilityProbeCount,
  combinedRunCount:
    specification.metrics.combinedRunCount,
  requiredMetricCount:
    specification.metrics.requiredMetricCount,
  exactCanonicalArtifactsBound: false,
  benchmarkAdmitted: false,
  benchmarkExecuted: false,
  exactBundleCompatibilityProven: false,
  productionReady: false,
}))

function assertAuthority(
  authority:
    LivingFrameControlledSdxlCompatibilityBenchmarkAuthority,
): void {
  const trueKeys = new Set([
    'controlledCandidateSetConsumed',
    'currentModelRequirementProjectionConsumed',
    'currentModelFamilyGraphBindingConsumed',
    'currentDependencyLockEvidenceConsumed',
    'deterministicBenchmarkSpecificationAuthority',
  ])
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      trueKeys.has(key),
      `Unexpected authority value for ${key}.`,
    )
  }
}
