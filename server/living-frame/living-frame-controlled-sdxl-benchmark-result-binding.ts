import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkCaseObservation,
  LivingFrameControlledSdxlBenchmarkMetricObservation,
  LivingFrameControlledSdxlBenchmarkObservation,
  LivingFrameControlledSdxlBenchmarkResultBinding,
  LivingFrameControlledSdxlBenchmarkResultBindingAuthority,
  LivingFrameControlledSdxlBenchmarkResultBindingDraft,
  LivingFrameControlledSdxlBenchmarkResultBindingIssue,
  LivingFrameControlledSdxlBenchmarkResultBindingIssueCode,
  LivingFrameControlledSdxlBenchmarkThresholdResult,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-result-binding'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-result-binding'
import type {
  LivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
  LivingFrameControlledSdxlCompatibilityBenchmarkThreshold,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import type {
  CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export interface LivingFrameControlledSdxlBenchmarkObservationReader {
  readonly readerClass:
    'process_bound_controlled_sdxl_benchmark_observation_reader_v1'
  readonly readObservation: () =>
    Promise<LivingFrameControlledSdxlBenchmarkObservation>
}

export interface CreateLivingFrameControlledSdxlBenchmarkResultBindingInput {
  readonly resultId: string
  readonly benchmarkSpecification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec
  readonly benchmarkSpecificationInput:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput
  readonly requestBlueprint:
    LivingFrameControlledSdxlBenchmarkRequestBlueprint
  readonly requestBlueprintInput:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput
  readonly observationReader:
    LivingFrameControlledSdxlBenchmarkObservationReader
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const observationReaders = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlBenchmarkResultBindingAuthority =
  deepFreeze({
    deterministicThresholdEvaluationAuthority: true,
    processBoundControlledObservationAuthority: true,
    benchmarkSpecificationAuthority: false,
    requestBlueprintAuthority: false,
    benchmarkExecutionAuthority: false,
    releasedAttemptAuthority: false,
    canonicalMetricAttestationAuthority: false,
    canonicalInternalCostAuthority: false,
    modelCompatibilityAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerCostOrCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export class LivingFrameControlledSdxlBenchmarkResultBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlBenchmarkResultBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlBenchmarkResultBindingIssue[],
  ) {
    super(
      'Living Frame controlled SDXL benchmark result binding failed.',
    )
    this.name =
      'LivingFrameControlledSdxlBenchmarkResultBindingError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlBenchmarkObservationReader(
  readObservation:
    LivingFrameControlledSdxlBenchmarkObservationReader[
      'readObservation'
    ],
): LivingFrameControlledSdxlBenchmarkObservationReader {
  if (typeof readObservation !== 'function') {
    throw invalid(
      'observation_reader_invalid',
      '$.observationReader',
    )
  }
  const reader:
    LivingFrameControlledSdxlBenchmarkObservationReader =
    Object.freeze({
      readerClass:
        'process_bound_controlled_sdxl_benchmark_observation_reader_v1',
      readObservation,
    })
  observationReaders.add(reader)
  return reader
}

export async function createLivingFrameControlledSdxlBenchmarkResultBinding(
  input:
    CreateLivingFrameControlledSdxlBenchmarkResultBindingInput,
): Promise<LivingFrameControlledSdxlBenchmarkResultBinding> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
      input.benchmarkSpecification,
      input.benchmarkSpecificationInput,
    )
  ) throw invalid(
    'benchmark_specification_invalid',
    '$.benchmarkSpecification',
  )
  if (
    !await verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
      input.requestBlueprint,
      input.requestBlueprintInput,
    )
  ) throw invalid(
    'request_blueprint_invalid',
    '$.requestBlueprint',
  )
  assertSourceLineage(input)
  const firstObservation =
    await readObservation(input.observationReader)
  const secondObservation =
    await readObservation(input.observationReader)
  assertObservation(firstObservation, input)
  assertObservation(secondObservation, input)
  if (
    firstObservation.observationDigestSha256
      !== secondObservation.observationDigestSha256
    || canonicalJson(firstObservation)
      !== canonicalJson(secondObservation)
  ) throw invalid(
    'observation_unstable',
    '$.observationReader',
  )

  const thresholdResults = evaluateThresholds(
    input.benchmarkSpecification.thresholds,
    firstObservation.metricObservations,
  )
  const failedThresholdCount = thresholdResults.filter(
    (result) => !result.passed,
  ).length
  const draft:
    LivingFrameControlledSdxlBenchmarkResultBindingDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_CLASS,
    resultId: input.resultId,
    resultState:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_STATE,
    sourceBindings: {
      benchmarkSpecificationId:
        input.benchmarkSpecification.specificationId,
      benchmarkSpecificationDigestSha256:
        input.benchmarkSpecification.specificationDigestSha256,
      requestBlueprintId:
        input.requestBlueprint.blueprintId,
      requestBlueprintDigestSha256:
        input.requestBlueprint.blueprintDigestSha256,
      observationId: firstObservation.observationId,
      observationDigestSha256:
        firstObservation.observationDigestSha256,
    },
    caseObservations: firstObservation.caseObservations,
    thresholdResults,
    metrics: {
      controlledCaseObservationCount: 7,
      evaluatedThresholdCount: 11,
      passedThresholdCount:
        11 - failedThresholdCount,
      failedThresholdCount,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    benchmarkSpecificationRevalidated: true,
    requestBlueprintRevalidated: true,
    controlledObservationRereadByProcessBoundPort: true,
    stableObservationDigestObservedTwice: true,
    exactSourceLineageMatched: true,
    allSevenControlledCaseObservationsPresent: true,
    allElevenThresholdsEvaluated: true,
    controlledThresholdSetPassed:
      failedThresholdCount === 0,
    releasedGpuAttemptPresent: false,
    canonicalGpuMetricAttestationPresent: false,
    canonicalInternalAttemptCostEvidencePresent: false,
    exactBundleCompatibilityProven: false,
    loraBaseVersionMismatchResolved: false,
    selectedSceneCreated: false,
    containsRawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommand:
      false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
    productionReady: false,
  }
  assertOutputSafe(draft)
  return deepFreeze({
    ...draft,
    resultDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlBenchmarkResultBinding(
  value: unknown,
  input:
    CreateLivingFrameControlledSdxlBenchmarkResultBindingInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_CLASS
      || value.productionReady !== false
      || value.promotionAllowed !== false
      || typeof value.resultDigestSha256 !== 'string'
      || !SHA256.test(value.resultDigestSha256)
    ) return false
    const {
      resultDigestSha256,
      ...draft
    } = value
    if (digest(draft) !== resultDigestSha256) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlBenchmarkResultBinding(
        input,
      ),
    )
  } catch {
    return false
  }
}

async function readObservation(
  reader:
    LivingFrameControlledSdxlBenchmarkObservationReader,
): Promise<LivingFrameControlledSdxlBenchmarkObservation> {
  if (
    !observationReaders.has(reader)
    || reader.readerClass
      !==
      'process_bound_controlled_sdxl_benchmark_observation_reader_v1'
    || typeof reader.readObservation !== 'function'
  ) throw invalid(
    'observation_reader_invalid',
    '$.observationReader',
  )
  let observation: unknown
  try {
    observation = await reader.readObservation()
  } catch {
    throw invalid(
      'observation_reader_invalid',
      '$.observationReader',
    )
  }
  if (!isRecord(observation)) {
    throw invalid('observation_invalid', '$.observation')
  }
  return observation as unknown as
    LivingFrameControlledSdxlBenchmarkObservation
}

function assertObservation(
  observation:
    LivingFrameControlledSdxlBenchmarkObservation,
  input:
    CreateLivingFrameControlledSdxlBenchmarkResultBindingInput,
): void {
  if (
    !hasExactKeys(
      observation as unknown as Record<string, unknown>,
      [
        'observationClass',
        'observationId',
        'sourceBindings',
        'caseObservations',
        'metricObservations',
        'controlledFixtureObservationOnly',
        'releasedGpuAttemptPresent',
        'canonicalGpuMetricAttestationPresent',
        'canonicalInternalAttemptCostEvidencePresent',
        'rawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommandIncluded',
        'observationDigestSha256',
      ],
    )
    || observation.observationClass
      !==
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS
    || typeof observation.observationId !== 'string'
    || !SAFE_ID.test(observation.observationId)
    || observation.controlledFixtureObservationOnly !== true
    || observation.releasedGpuAttemptPresent !== false
    || observation.canonicalGpuMetricAttestationPresent !== false
    || observation
      .canonicalInternalAttemptCostEvidencePresent !== false
    || observation
      .rawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommandIncluded
      !== false
    || typeof observation.observationDigestSha256 !== 'string'
    || !SHA256.test(observation.observationDigestSha256)
  ) throw invalid('observation_invalid', '$.observation')
  const {
    observationDigestSha256,
    ...draft
  } = observation
  if (digest(draft) !== observationDigestSha256) {
    throw invalid(
      'digest_mismatch',
      '$.observation.observationDigestSha256',
    )
  }
  if (
    !isRecord(observation.sourceBindings)
    || !hasExactKeys(observation.sourceBindings, [
      'benchmarkSpecificationId',
      'benchmarkSpecificationDigestSha256',
      'requestBlueprintId',
      'requestBlueprintDigestSha256',
    ])
    || observation.sourceBindings.benchmarkSpecificationId
      !== input.benchmarkSpecification.specificationId
    || observation.sourceBindings
      .benchmarkSpecificationDigestSha256
      !== input.benchmarkSpecification.specificationDigestSha256
    || observation.sourceBindings.requestBlueprintId
      !== input.requestBlueprint.blueprintId
    || observation.sourceBindings.requestBlueprintDigestSha256
      !== input.requestBlueprint.blueprintDigestSha256
  ) throw invalid(
    'observation_lineage_mismatch',
    '$.observation.sourceBindings',
  )
  assertCaseObservations(
    observation.caseObservations,
    input.benchmarkSpecification,
  )
  assertMetricObservations(
    observation.metricObservations,
    input.benchmarkSpecification,
  )
  assertMeasurementCrossChecks(
    observation.caseObservations,
    observation.metricObservations,
  )
}

function assertCaseObservations(
  observations:
    readonly LivingFrameControlledSdxlBenchmarkCaseObservation[],
  specification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
): void {
  if (!Array.isArray(observations) || observations.length !== 7) {
    throw invalid(
      'case_set_or_order_mismatch',
      '$.observation.caseObservations',
    )
  }
  for (const [index, observationValue] of observations.entries()) {
    const expected = specification.cases[index]
    if (!expected || !isRecord(observationValue)) {
      throw invalid(
        'case_receipt_invalid',
        `$.observation.caseObservations.${index}`,
      )
    }
    const observation = observationValue as unknown as
      LivingFrameControlledSdxlBenchmarkCaseObservation
    if (
      !hasExactKeys(observationValue, [
        'order',
        'caseId',
        'observationState',
        'outputObservationDigestSha256',
        'exactModelLoadIntegrity',
        'networkOffConfinement',
        'decodedOutputValid',
        'finitePixelPopulation',
        'durationMs',
        'peakGpuMemoryMiB',
      ])
      || observation.order !== index
      || observation.caseId !== expected.caseId
      || observation.observationState
        !== 'completed_controlled_fixture_observation'
      || !Number.isInteger(observation.durationMs)
      || observation.durationMs < 0
      || typeof observation.peakGpuMemoryMiB !== 'number'
      || !Number.isFinite(observation.peakGpuMemoryMiB)
      || observation.peakGpuMemoryMiB < 0
    ) throw invalid(
      observation.caseId !== expected.caseId
        ? 'case_set_or_order_mismatch'
        : 'case_receipt_invalid',
      `$.observation.caseObservations.${index}`,
    )
    const loadOnly = expected.caseClass === 'load_integrity'
    if (
      loadOnly
        ? (
            observation.outputObservationDigestSha256 !== null
            || typeof observation.exactModelLoadIntegrity
              !== 'boolean'
            || typeof observation.networkOffConfinement
              !== 'boolean'
            || observation.decodedOutputValid !== null
            || observation.finitePixelPopulation !== null
          )
        : (
            typeof observation.outputObservationDigestSha256
              !== 'string'
            || !SHA256.test(
              observation.outputObservationDigestSha256,
            )
            || observation.exactModelLoadIntegrity !== null
            || observation.networkOffConfinement !== null
            || typeof observation.decodedOutputValid !== 'boolean'
            || typeof observation.finitePixelPopulation !== 'boolean'
          )
    ) throw invalid(
      'case_receipt_invalid',
      `$.observation.caseObservations.${index}`,
    )
  }
}

function assertMetricObservations(
  observations:
    readonly LivingFrameControlledSdxlBenchmarkMetricObservation[],
  specification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
): void {
  if (!Array.isArray(observations) || observations.length !== 11) {
    throw invalid(
      'metric_set_or_order_mismatch',
      '$.observation.metricObservations',
    )
  }
  for (const [index, observationValue] of observations.entries()) {
    const threshold = specification.thresholds[index]
    if (!threshold || !isRecord(observationValue)) {
      throw invalid(
        'metric_observation_invalid',
        `$.observation.metricObservations.${index}`,
      )
    }
    const observation = observationValue as unknown as
      LivingFrameControlledSdxlBenchmarkMetricObservation
    if (
      !hasExactKeys(observationValue, [
        'order',
        'metricCode',
        'unit',
        'value',
      ])
      || observation.order !== index
      || observation.metricCode !== threshold.metricCode
      || observation.unit !== threshold.unit
      || (
        threshold.unit === 'boolean'
          ? typeof observation.value !== 'boolean'
          : (
              typeof observation.value !== 'number'
              || !Number.isFinite(observation.value)
              || observation.value < 0
            )
      )
    ) throw invalid(
      observation.metricCode !== threshold.metricCode
        ? 'metric_set_or_order_mismatch'
        : 'metric_observation_invalid',
      `$.observation.metricObservations.${index}`,
    )
  }
}

function assertMeasurementCrossChecks(
  cases:
    readonly LivingFrameControlledSdxlBenchmarkCaseObservation[],
  metrics:
    readonly LivingFrameControlledSdxlBenchmarkMetricObservation[],
): void {
  const load = cases[0]
  const generation = cases.slice(1)
  const byCode = new Map(
    metrics.map((metric) => [metric.metricCode, metric.value]),
  )
  if (
    !load
    || byCode.get('exact_model_load_integrity')
      !== load.exactModelLoadIntegrity
    || byCode.get('network_off_confinement')
      !== load.networkOffConfinement
    || byCode.get('decoded_output_validity')
      !== generation.every((entry) =>
        entry.decodedOutputValid === true)
    || byCode.get('finite_pixel_population')
      !== generation.every((entry) =>
        entry.finitePixelPopulation === true)
    || byCode.get('peak_gpu_memory_mib')
      !== Math.max(...cases.map((entry) =>
        entry.peakGpuMemoryMiB))
    || byCode.get('cold_bundle_load_duration_ms')
      !== load.durationMs
    || byCode.get('warm_generation_duration_ms')
      !== Math.max(...generation.map((entry) =>
        entry.durationMs))
  ) throw invalid(
    'measurement_cross_check_mismatch',
    '$.observation',
  )
}

function evaluateThresholds(
  thresholds:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[],
  observations:
    readonly LivingFrameControlledSdxlBenchmarkMetricObservation[],
): readonly LivingFrameControlledSdxlBenchmarkThresholdResult[] {
  const results = thresholds.map((threshold, order) => {
    const observation = observations[order]
    if (
      !observation
      || observation.metricCode !== threshold.metricCode
      || observation.unit !== threshold.unit
    ) throw invalid(
      'threshold_evaluation_invalid',
      `$.thresholds.${order}`,
    )
    const passed = evaluateThreshold(threshold, observation.value)
    return {
      order,
      metricCode: threshold.metricCode,
      unit: threshold.unit,
      comparison: threshold.comparison,
      observedValue: observation.value,
      minimum: threshold.minimum,
      maximum: threshold.maximum,
      exactBoolean: threshold.exactBoolean,
      passed,
    } satisfies
      LivingFrameControlledSdxlBenchmarkThresholdResult
  })
  if (results.length !== 11) {
    throw invalid(
      'threshold_evaluation_invalid',
      '$.thresholds',
    )
  }
  return deepFreeze(results)
}

function evaluateThreshold(
  threshold:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold,
  observed: boolean | number,
): boolean {
  if (threshold.comparison === 'equals') {
    return (
      typeof observed === 'boolean'
      && observed === threshold.exactBoolean
    )
  }
  if (typeof observed !== 'number') return false
  if (threshold.comparison === 'less_than_or_equal') {
    return (
      threshold.maximum !== null
      && observed <= threshold.maximum
    )
  }
  if (threshold.comparison === 'greater_than_or_equal') {
    return (
      threshold.minimum !== null
      && observed >= threshold.minimum
    )
  }
  return (
    threshold.minimum !== null
    && threshold.maximum !== null
    && observed >= threshold.minimum
    && observed <= threshold.maximum
  )
}

function assertSourceLineage(
  input:
    CreateLivingFrameControlledSdxlBenchmarkResultBindingInput,
): void {
  const specification = input.benchmarkSpecification
  const blueprint = input.requestBlueprint
  if (
    blueprint.sourceBindings.benchmarkSpecificationId
      !== specification.specificationId
    || blueprint.sourceBindings
      .benchmarkSpecificationDigestSha256
      !== specification.specificationDigestSha256
    || input.requestBlueprintInput.benchmarkSpecification
      .specificationDigestSha256
      !== specification.specificationDigestSha256
    || input.requestBlueprintInput.benchmarkSpecificationInput
      .specificationId
      !== input.benchmarkSpecificationInput.specificationId
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlBenchmarkResultBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'resultId',
      'benchmarkSpecification',
      'benchmarkSpecificationInput',
      'requestBlueprint',
      'requestBlueprintInput',
      'observationReader',
    ])
    || typeof input.resultId !== 'string'
    || !SAFE_ID.test(input.resultId)
    || !isRecord(input.benchmarkSpecification)
    || !isRecord(input.benchmarkSpecificationInput)
    || !isRecord(input.requestBlueprint)
    || !isRecord(input.requestBlueprintInput)
    || !isRecord(input.observationReader)
  ) throw invalid('input_invalid', '$')
}

function assertOutputSafe(
  draft:
    LivingFrameControlledSdxlBenchmarkResultBindingDraft,
): void {
  const trueAuthorityKeys = new Set([
    'deterministicThresholdEvaluationAuthority',
    'processBoundControlledObservationAuthority',
  ])
  if (
    draft.releasedGpuAttemptPresent !== false
    || draft.canonicalGpuMetricAttestationPresent !== false
    || draft.canonicalInternalAttemptCostEvidencePresent !== false
    || draft.exactBundleCompatibilityProven !== false
    || draft.loraBaseVersionMismatchResolved !== false
    || draft.selectedSceneCreated !== false
    || draft.promotionAllowed !== false
    || draft.productionReady !== false
    || Object.entries(draft.authorityBoundary).some(
      ([key, value]) =>
        value !== trueAuthorityKeys.has(key),
    )
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  const serialized = canonicalJson(draft).toLowerCase()
  for (const forbidden of [
    'https://',
    'file://',
    '/tmp/',
    'sk-proj-',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
  }
}

function invalid(
  code:
    LivingFrameControlledSdxlBenchmarkResultBindingIssueCode,
  path: string,
): LivingFrameControlledSdxlBenchmarkResultBindingError {
  if (
    !LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_ISSUES
      .includes(code)
  ) throw new Error(
    'Unknown Living Frame benchmark result binding issue code.',
  )
  return new LivingFrameControlledSdxlBenchmarkResultBindingError([
    { code, path },
  ])
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
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  throw invalid('input_invalid', '$')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  return canonicalJson(actual) === canonicalJson([...expected].sort())
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
