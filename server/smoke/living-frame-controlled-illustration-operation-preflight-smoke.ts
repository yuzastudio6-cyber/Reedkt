import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
  type LivingFrameControlledIllustrationOperationPreflight,
} from '../../src/types/living-frame-controlled-illustration-operation-preflight'
import {
  LivingFrameControlledIllustrationOperationPreflightError,
  createLivingFrameControlledIllustrationOperationPreflight,
  verifyLivingFrameControlledIllustrationOperationPreflight,
} from '../living-frame/living-frame-controlled-illustration-operation-preflight'

const sha = (label: string): string =>
  createHash('sha256').update(label, 'utf8').digest('hex')

const input = {
  preflightId: 'living-frame.controlled-illustration.operation.fixture',
  approvedLineageBindingDigestSha256: sha('approved-lineage'),
  selectedSceneAdmissionDigestSha256: sha('selected-scene'),
  componentAssetIntentDigestSha256: sha('component-asset-intent'),
  outputFrameExpectationDigestSha256: sha('output-frame'),
  masterTimingExpectationDigestSha256: sha('master-timing'),
  controlledIllustrationQualificationDigestSha256: sha('qualification-v2'),
  controlledIllustrationSourceObservationDigestSha256:
    sha('source-observation-v2'),
  estimateProjectionDigestSha256: sha('estimate-projection'),
  workGraphProjectionDigestSha256: sha('work-graph-projection'),
} as const

const preflight =
  createLivingFrameControlledIllustrationOperationPreflight(input)

assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(preflight),
  true,
)
assert.deepEqual(
  preflight.capabilityExpectations.map((entry) => entry.capabilityKey),
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS,
)
assert.deepEqual(
  preflight.capabilityExpectations.map((entry) => entry.placement),
  [
    'shared_gpu_host',
    'external_control_image_preparation',
    'gpu_host_model_conditioning',
    'gpu_host_reference_conditioning',
    'gpu_host_adapter_loading',
    'post_generation_cpu_continuity_qa',
  ],
)
assert.equal(
  preflight.capabilityExpectations.filter(
    (entry) => entry.placement === 'shared_gpu_host',
  ).length,
  1,
)
assert.equal(
  preflight.capabilityExpectations.every(
    (entry) => !entry.separateProductionToolIdentityExpected,
  ),
  true,
)
assert.equal(
  preflight.operationExpectation.expectedCanonicalToolId,
  'comfyui',
)
assert.equal(
  preflight.operationExpectation.expectedCanonicalOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  preflight.operationExpectation.expectedWorkItemType,
  'generate_image_asset',
)
assert.equal(preflight.operationExpectation.expectedGpuCount, 1)
assert.equal(preflight.operationExpectation.cpuFallbackAllowed, false)
assert.equal(
  preflight.operationExpectation.auraFaceRunsInsideGpuHost,
  false,
)
assert.equal(
  preflight.costBinding.estimateCostComponentId,
  'shared_controlled_illustration_gpu_host',
)
assert.equal(preflight.costBinding.sharedGpuHostPricedOnce, true)
assert.equal(
  preflight.costBinding.auraFaceSeparateCpuMeasurementConditional,
  true,
)
assert.equal(
  preflight.costBinding.plannedUsageIsActualCostEvidence,
  false,
)
assert.deepEqual(
  preflight.openGateCodes,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES,
)

for (const [key, value] of Object.entries(preflight.authorityBoundary)) {
  assert.equal(value, false, `${key} must remain false.`)
}
for (const key of [
  'executableOperationPresent',
  'workItemPresent',
  'dispatchGrantPresent',
  'modelArtifactMountPresent',
  'actualAttemptReceiptPresent',
  'productionReady',
] as const) assert.equal(preflight[key], false)

assert.equal(
  createLivingFrameControlledIllustrationOperationPreflight(input)
    .preflightDigestSha256,
  preflight.preflightDigestSha256,
)
assert.notEqual(
  createLivingFrameControlledIllustrationOperationPreflight({
    ...input,
    estimateProjectionDigestSha256: sha('different-estimate'),
  }).preflightDigestSha256,
  preflight.preflightDigestSha256,
)

const orderedCapabilitiesChanged = resign({
  ...withoutDigest(preflight),
  capabilityExpectations: [
    preflight.capabilityExpectations[1],
    preflight.capabilityExpectations[0],
    ...preflight.capabilityExpectations.slice(2),
  ],
})
assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(
    orderedCapabilitiesChanged,
  ),
  false,
)

const auraFaceInsideGpu = resign({
  ...withoutDigest(preflight),
  capabilityExpectations: preflight.capabilityExpectations.map((entry) =>
    entry.capabilityKey === 'auraface'
      ? { ...entry, placement: 'shared_gpu_host' }
      : entry,
  ),
})
assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(
    auraFaceInsideGpu,
  ),
  false,
)

const sixToolIdsForged = resign({
  ...withoutDigest(preflight),
  sixProductionToolIds: [
    'comfyui',
    'comfyui_controlnet_aux',
    'controlnet',
    'ip_adapter',
    'peft_lora',
    'auraface',
  ],
})
assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(
    sixToolIdsForged,
  ),
  false,
)

const legacyPuLidForged = resign({
  ...withoutDigest(preflight),
  capabilityExpectations: preflight.capabilityExpectations.map((entry) =>
    entry.capabilityKey === 'auraface'
      ? { ...entry, capabilityKey: 'pulid' }
      : entry,
  ),
})
assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(
    legacyPuLidForged,
  ),
  false,
)

const allGreenForged = resign({
  ...withoutDigest(preflight),
  operationExpectation: {
    ...preflight.operationExpectation,
    canonicalToolIdentityRegistered: true,
    canonicalOperationRegistered: true,
    workItemProjected: true,
    privateDispatchAdmitted: true,
  },
  authorityBoundary: Object.fromEntries(
    Object.keys(preflight.authorityBoundary).map((key) => [key, true]),
  ),
  executableOperationPresent: true,
  workItemPresent: true,
  dispatchGrantPresent: true,
  modelArtifactMountPresent: true,
  actualAttemptReceiptPresent: true,
  productionReady: true,
})
assert.equal(
  verifyLivingFrameControlledIllustrationOperationPreflight(allGreenForged),
  false,
)

let unknownKeyError: unknown
try {
  createLivingFrameControlledIllustrationOperationPreflight({
    ...input,
    providerId: 'caller-route-is-forbidden',
  } as never)
} catch (error) {
  unknownKeyError = error
}
assert.ok(
  unknownKeyError
    instanceof LivingFrameControlledIllustrationOperationPreflightError,
)
assert.deepEqual(unknownKeyError.issues, [{
  code: 'unknown_key',
  path: '$',
}])
assert.equal(
  unknownKeyError.message,
  'Living Frame controlled-illustration operation preflight failed.',
)

console.log(
  'Living Frame controlled-illustration operation preflight passed '
  + 'six-capability placement, one-host pricing, ordered lineage, '
  + 'closed-runtime, and forged-promotion checks.',
)

function withoutDigest(
  value: LivingFrameControlledIllustrationOperationPreflight,
): Record<string, unknown> {
  const clone = structuredClone(value) as unknown as Record<string, unknown>
  delete clone.preflightDigestSha256
  return clone
}

function resign(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    preflightDigestSha256: digest(value),
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
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
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  throw new Error('Unsupported smoke fixture value.')
}
