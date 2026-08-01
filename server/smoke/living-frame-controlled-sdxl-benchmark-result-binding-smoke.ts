import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkMetricObservation,
  LivingFrameControlledSdxlBenchmarkObservation,
  LivingFrameControlledSdxlBenchmarkObservationDraft,
  LivingFrameControlledSdxlBenchmarkResultBindingAuthority,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-result-binding'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-result-binding'
import {
  createLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkObservationReader,
  createLivingFrameControlledSdxlBenchmarkResultBinding,
  verifyLivingFrameControlledSdxlBenchmarkResultBinding,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-result-binding'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const benchmarkSpecificationInput = {
  specificationId: 'spec.sdxl.result-binding.001',
  candidateSet:
    controlledSdxlArtifactCandidateSetSmokeFixture.candidateSet,
  candidateSetInput:
    controlledSdxlArtifactCandidateSetSmokeFixture.input,
}
const benchmarkSpecification =
  await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    benchmarkSpecificationInput,
  )
const benchmarkAdmissionAuditInput = {
  auditId: 'audit.sdxl.result-binding.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  exactArtifactEvidence: {
    state: 'not_injected',
  } as const,
}
const benchmarkAdmissionAudit =
  await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
    benchmarkAdmissionAuditInput,
  )
const requestBlueprintInput = {
  blueprintId: 'blueprint.sdxl.result-binding.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  benchmarkAdmissionAudit,
  benchmarkAdmissionAuditInput,
}
const requestBlueprint =
  await createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
    requestBlueprintInput,
  )
const passingObservation = createObservation()
const input = {
  resultId: 'result.sdxl.controlled-thresholds.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  requestBlueprint,
  requestBlueprintInput,
  observationReader:
    createLivingFrameControlledSdxlBenchmarkObservationReader(
      async () => passingObservation,
    ),
}
const result =
  await createLivingFrameControlledSdxlBenchmarkResultBinding(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkResultBinding(
    result,
    input,
  ),
  true,
)
assert.equal(result.metrics.controlledCaseObservationCount, 7)
assert.equal(result.metrics.evaluatedThresholdCount, 11)
assert.equal(result.metrics.passedThresholdCount, 11)
assert.equal(result.metrics.failedThresholdCount, 0)
assert.equal(result.controlledThresholdSetPassed, true)
assert.equal(result.releasedGpuAttemptPresent, false)
assert.equal(result.canonicalGpuMetricAttestationPresent, false)
assert.equal(
  result.canonicalInternalAttemptCostEvidencePresent,
  false,
)
assert.equal(result.exactBundleCompatibilityProven, false)
assert.equal(result.loraBaseVersionMismatchResolved, false)
assert.equal(result.selectedSceneCreated, false)
assert.equal(result.promotionAllowed, false)
assert.equal(result.productionReady, false)
assertAuthority(result.authorityBoundary)

const failingObservation = signObservation({
  ...withoutObservationDigest(passingObservation),
  metricObservations:
    passingObservation.metricObservations.map(
      (metric) =>
        metric.metricCode === 'seed_replay_normalized_mae'
          ? { ...metric, value: 0.02 }
          : metric,
    ),
})
const failedResult =
  await createLivingFrameControlledSdxlBenchmarkResultBinding({
    ...input,
    resultId: 'result.sdxl.controlled-thresholds.failed',
    observationReader:
      createLivingFrameControlledSdxlBenchmarkObservationReader(
        async () => failingObservation,
      ),
  })
assert.equal(failedResult.controlledThresholdSetPassed, false)
assert.equal(failedResult.metrics.failedThresholdCount, 1)
assert.equal(failedResult.productionReady, false)

let adversarialAssertions = 0
for (const forged of [
  {
    ...result,
    productionReady: true,
  },
  {
    ...result,
    promotionAllowed: true,
    exactBundleCompatibilityProven: true,
    releasedGpuAttemptPresent: true,
    canonicalGpuMetricAttestationPresent: true,
    canonicalInternalAttemptCostEvidencePresent: true,
  },
  {
    ...result,
    resultDigestSha256: 'a'.repeat(64),
  },
  {
    ...result,
    thresholdResults: [...result.thresholdResults].reverse(),
  },
  {
    ...result,
    authorityBoundary: {
      ...result.authorityBoundary,
      operationAuthority: true,
      dispatchAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
  {
    ...result,
    operationId: 'caller-operation',
    attemptCostUsd: 0,
    queueId: 'caller-queue',
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlBenchmarkResultBinding(
      forged,
      input,
    ),
    false,
  )
  adversarialAssertions += 1
}

const forgedAllGreen = resignResult({
  ...result,
  productionReady: true,
  promotionAllowed: true,
  exactBundleCompatibilityProven: true,
  loraBaseVersionMismatchResolved: true,
  releasedGpuAttemptPresent: true,
  canonicalGpuMetricAttestationPresent: true,
  canonicalInternalAttemptCostEvidencePresent: true,
  selectedSceneCreated: true,
  authorityBoundary: Object.fromEntries(
    Object.keys(result.authorityBoundary)
      .map((key) => [key, true]),
  ),
})
assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkResultBinding(
    forgedAllGreen,
    input,
  ),
  false,
)
adversarialAssertions += 1

for (const observation of [
  {
    ...passingObservation,
    observationDigestSha256: 'b'.repeat(64),
  },
  signObservation({
    ...withoutObservationDigest(passingObservation),
    sourceBindings: {
      ...passingObservation.sourceBindings,
      requestBlueprintDigestSha256: 'c'.repeat(64),
    },
  }),
  signObservation({
    ...withoutObservationDigest(passingObservation),
    caseObservations:
      [...passingObservation.caseObservations].reverse(),
  }),
  signObservation({
    ...withoutObservationDigest(passingObservation),
    metricObservations:
      [...passingObservation.metricObservations].reverse(),
  }),
  signObservation({
    ...withoutObservationDigest(passingObservation),
    metricObservations:
      passingObservation.metricObservations.map((metric) =>
        metric.metricCode === 'peak_gpu_memory_mib'
          ? { ...metric, value: 999 }
          : metric),
  }),
  signObservation({
    ...withoutObservationDigest(passingObservation),
    releasedGpuAttemptPresent: true,
    canonicalGpuMetricAttestationPresent: true,
    canonicalInternalAttemptCostEvidencePresent: true,
  } as never),
  signObservation({
    ...withoutObservationDigest(passingObservation),
    promptText: 'unsafe',
  } as never),
] as const) {
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBenchmarkResultBinding({
        ...input,
        observationReader:
          createLivingFrameControlledSdxlBenchmarkObservationReader(
            async () => observation as
              LivingFrameControlledSdxlBenchmarkObservation,
          ),
      }),
    /benchmark result binding failed/u,
  )
  adversarialAssertions += 1
}

let readCount = 0
await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkResultBinding({
      ...input,
      observationReader:
        createLivingFrameControlledSdxlBenchmarkObservationReader(
          async () => {
            readCount += 1
            return readCount === 1
              ? passingObservation
              : signObservation({
                  ...withoutObservationDigest(passingObservation),
                  observationId:
                    'observation.sdxl.changed-between-reads',
                })
          },
        ),
    }),
  /benchmark result binding failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkResultBinding({
      ...input,
      observationReader: {
        readerClass:
          'process_bound_controlled_sdxl_benchmark_observation_reader_v1',
        readObservation: async () => passingObservation,
      },
    }),
  /benchmark result binding failed/u,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkResultBinding({
      ...input,
      approved: true,
    } as never),
  /benchmark result binding failed/u,
)
adversarialAssertions += 1

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-benchmark-result-binding',
  controlledFixtures: 2,
  adversarialAssertions,
  controlledCaseObservationCount:
    result.metrics.controlledCaseObservationCount,
  evaluatedThresholdCount:
    result.metrics.evaluatedThresholdCount,
  passingThresholdCount:
    result.metrics.passedThresholdCount,
  releasedGpuAttemptPresent: false,
  canonicalInternalAttemptCostEvidencePresent: false,
  exactBundleCompatibilityProven: false,
  productionReady: false,
}))

function createObservation():
  LivingFrameControlledSdxlBenchmarkObservation {
  const caseObservations = benchmarkSpecification.cases.map(
    (benchmarkCase, order) => {
      const loadOnly =
        benchmarkCase.caseClass === 'load_integrity'
      return {
        order,
        caseId: benchmarkCase.caseId,
        observationState:
          'completed_controlled_fixture_observation' as const,
        outputObservationDigestSha256: loadOnly
          ? null
          : digest(`controlled-output:${benchmarkCase.caseId}`),
        exactModelLoadIntegrity: loadOnly ? true : null,
        networkOffConfinement: loadOnly ? true : null,
        decodedOutputValid: loadOnly ? null : true,
        finitePixelPopulation: loadOnly ? null : true,
        durationMs: loadOnly
          ? 120_000
          : 60_000 + (order * 1_000),
        peakGpuMemoryMiB: loadOnly
          ? 18_000
          : order === 5 || order === 6
            ? 22_000
            : 19_000 + (order * 250),
      }
    },
  )
  const values: Readonly<
    Record<
      LivingFrameControlledSdxlBenchmarkMetricObservation[
        'metricCode'
      ],
      boolean | number
    >
  > = {
    exact_model_load_integrity: true,
    network_off_confinement: true,
    decoded_output_validity: true,
    finite_pixel_population: true,
    seed_replay_normalized_mae: 0.001,
    lora_effect_normalized_mae: 0.08,
    controlnet_edge_f1_delta: 0.2,
    ipadapter_reference_similarity_delta: 0.1,
    peak_gpu_memory_mib: 22_000,
    cold_bundle_load_duration_ms: 120_000,
    warm_generation_duration_ms: 66_000,
  }
  const metricObservations =
    benchmarkSpecification.thresholds.map(
      (threshold, order) => ({
        order,
        metricCode: threshold.metricCode,
        unit: threshold.unit,
        value: values[threshold.metricCode],
      }),
    )
  return signObservation({
    observationClass:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS,
    observationId: 'observation.sdxl.controlled-fixture.001',
    sourceBindings: {
      benchmarkSpecificationId:
        benchmarkSpecification.specificationId,
      benchmarkSpecificationDigestSha256:
        benchmarkSpecification.specificationDigestSha256,
      requestBlueprintId: requestBlueprint.blueprintId,
      requestBlueprintDigestSha256:
        requestBlueprint.blueprintDigestSha256,
    },
    caseObservations,
    metricObservations,
    controlledFixtureObservationOnly: true,
    releasedGpuAttemptPresent: false,
    canonicalGpuMetricAttestationPresent: false,
    canonicalInternalAttemptCostEvidencePresent: false,
    rawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommandIncluded:
      false,
  })
}

function signObservation(
  draft:
    LivingFrameControlledSdxlBenchmarkObservationDraft,
): LivingFrameControlledSdxlBenchmarkObservation {
  return {
    ...draft,
    observationDigestSha256: digest(draft),
  }
}

function withoutObservationDigest(
  observation:
    LivingFrameControlledSdxlBenchmarkObservation,
): LivingFrameControlledSdxlBenchmarkObservationDraft {
  const draft = { ...observation }
  Reflect.deleteProperty(draft, 'observationDigestSha256')
  return draft
}

function resignResult(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  Reflect.deleteProperty(draft, 'resultDigestSha256')
  return {
    ...draft,
    resultDigestSha256: digest(draft),
  }
}

function assertAuthority(
  authority:
    LivingFrameControlledSdxlBenchmarkResultBindingAuthority,
): void {
  const trueKeys = new Set([
    'deterministicThresholdEvaluationAuthority',
    'processBoundControlledObservationAuthority',
  ])
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      trueKeys.has(key),
      `Unexpected authority value for ${key}.`,
    )
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw new Error('Unsupported canonical JSON value.')
}
