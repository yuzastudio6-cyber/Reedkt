import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlBenchmarkRequestBlueprint,
  verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const benchmarkSpecificationInput = {
  specificationId: 'spec.sdxl.request-blueprint.001',
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
  auditId: 'audit.sdxl.request-blueprint.001',
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
const input = {
  blueprintId: 'blueprint.sdxl.benchmark.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  benchmarkAdmissionAudit,
  benchmarkAdmissionAuditInput,
}
const blueprint =
  await createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
    blueprint,
    input,
  ),
  true,
)
assert.equal(blueprint.recipes.length, 7)
assert.equal(blueprint.metrics.caseCount, 7)
assert.equal(blueprint.metrics.loadOnlyRecipeCount, 1)
assert.equal(blueprint.metrics.generationRecipeCount, 6)
assert.equal(blueprint.metrics.unresolvedBindingSlotCount, 41)
assert.equal(blueprint.metrics.distinctBindingSlotSetCount, 6)
assert.deepEqual(
  blueprint.recipes.map((recipe) =>
    recipe.requiredBindingSlots.length),
  [5, 3, 4, 5, 6, 9, 9],
)
assert.deepEqual(
  blueprint.recipes.map((recipe) => recipe.caseId),
  benchmarkSpecification.cases.map((entry) => entry.caseId),
)
assert.equal(
  blueprint.recipes[0]?.runtimePolicy,
  null,
)
assert.equal(
  blueprint.recipes[0]?.recipeClass,
  'load_only_bundle_probe',
)
assert.equal(
  blueprint.recipes.slice(1).every((recipe) =>
    recipe.recipeClass === 'unmaterialized_generation_request'
    && recipe.runtimePolicy !== null
    && recipe.requiredBindingSlots.every((slot) =>
      slot.resolved === false && slot.valuePresent === false)),
  true,
)
assert.deepEqual(
  blueprint.recipes[5]?.requiredBindingSlots.map(
    (slot) => slot.slotKind,
  ),
  [
    'base_checkpoint_artifact',
    'controlnet_checkpoint_artifact',
    'lora_adapter_artifact',
    'generic_ipadapter_checkpoint_artifact',
    'clip_vision_checkpoint_artifact',
    'positive_conditioning_text',
    'negative_conditioning_text',
    'control_image_artifact',
    'reference_image_artifact',
  ],
)
assert.equal(blueprint.requestMaterialized, false)
assert.equal(blueprint.dispatchReady, false)
assert.equal(blueprint.benchmarkExecuted, false)
assert.equal(blueprint.actualAttemptCostEvidencePresent, false)
assert.equal(blueprint.selectedSceneCreated, false)
assert.equal(blueprint.productionReady, false)
assertAuthority(blueprint.authorityBoundary)

const serialized = JSON.stringify(blueprint).toLowerCase()
for (const forbidden of [
  'musashi',
  'hormuz',
  'helicopter',
  'providerid',
  'toolid',
  'operationid',
  'queueid',
  'jobid',
  'https://',
  'file://',
  '/tmp/',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

let adversarialAssertions = 0
for (const forged of [
  {
    ...blueprint,
    productionReady: true,
  },
  {
    ...blueprint,
    requestMaterialized: true,
    dispatchReady: true,
    benchmarkExecuted: true,
    benchmarkMeasurementsPresent: true,
    actualAttemptCostEvidencePresent: true,
  },
  {
    ...blueprint,
    blueprintDigestSha256: 'a'.repeat(64),
  },
  {
    ...blueprint,
    recipes: [...blueprint.recipes].reverse(),
  },
  {
    ...blueprint,
    recipes: blueprint.recipes.map((recipe) =>
      recipe.caseId === 'controlnet_effect_probe'
        ? {
            ...recipe,
            requiredBindingSlots:
              recipe.requiredBindingSlots.filter((slot) =>
                slot.slotKind !== 'control_image_artifact'),
          }
        : recipe),
  },
  {
    ...blueprint,
    recipes: blueprint.recipes.map((recipe) =>
      recipe.caseId === 'full_combined_primary'
        ? {
            ...recipe,
            requiredBindingSlots:
              recipe.requiredBindingSlots.map((slot) => ({
                ...slot,
                resolved: true,
                valuePresent: true,
              })),
          }
        : recipe),
  },
  {
    ...blueprint,
    admissionProjection: {
      ...blueprint.admissionProjection,
      canonicalOperationContractState: 'registered',
      canonicalOperationContractDigestSha256: 'b'.repeat(64),
    },
  },
  {
    ...blueprint,
    authorityBoundary: {
      ...blueprint.authorityBoundary,
      operationAuthority: true,
      dispatchAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
  {
    ...blueprint,
    promptText: 'caller supplied prompt',
    operationId: 'caller-selected-operation',
    queueId: 'caller-selected-queue',
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
      forged,
      input,
    ),
    false,
  )
  adversarialAssertions += 1
}

const forgedAllGreen = resign({
  ...blueprint,
  requestMaterialized: true,
  dispatchReady: true,
  benchmarkExecuted: true,
  benchmarkMeasurementsPresent: true,
  actualAttemptCostEvidencePresent: true,
  productionReady: true,
  authorityBoundary: Object.fromEntries(
    Object.keys(blueprint.authorityBoundary)
      .map((key) => [key, true]),
  ),
})
assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
    forgedAllGreen,
    input,
  ),
  false,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkRequestBlueprint({
      ...input,
      approved: true,
    } as never),
  /benchmark request blueprint failed/u,
)
adversarialAssertions += 1

const otherSpecificationInput = {
  ...benchmarkSpecificationInput,
  specificationId: 'spec.sdxl.request-blueprint.other',
}
const otherSpecification =
  await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    otherSpecificationInput,
  )
const otherAuditInput = {
  ...benchmarkAdmissionAuditInput,
  auditId: 'audit.sdxl.request-blueprint.other',
  benchmarkSpecification: otherSpecification,
  benchmarkSpecificationInput: otherSpecificationInput,
}
const otherAudit =
  await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
    otherAuditInput,
  )
await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkRequestBlueprint({
      ...input,
      benchmarkAdmissionAudit: otherAudit,
      benchmarkAdmissionAuditInput: otherAuditInput,
    }),
  /benchmark request blueprint failed/u,
)
adversarialAssertions += 1

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-benchmark-request-blueprint',
  controlledFixtures: 1,
  adversarialAssertions,
  caseCount: blueprint.metrics.caseCount,
  loadOnlyRecipeCount: blueprint.metrics.loadOnlyRecipeCount,
  generationRecipeCount: blueprint.metrics.generationRecipeCount,
  unresolvedBindingSlotCount:
    blueprint.metrics.unresolvedBindingSlotCount,
  requestMaterialized: false,
  dispatchReady: false,
  benchmarkExecuted: false,
  productionReady: false,
}))

function assertAuthority(
  authority:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority,
): void {
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      key === 'deterministicRequestBlueprintAuthority',
      `Unexpected authority value for ${key}.`,
    )
  }
}

function resign(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  Reflect.deleteProperty(draft, 'blueprintDigestSha256')
  return {
    ...draft,
    blueprintDigestSha256: createHash('sha256')
      .update(canonicalJson(draft), 'utf8')
      .digest('hex'),
  }
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
