import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameControlledImageFullFrameRatioExtension,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from '../living-frame/living-frame-comfyui-operation-admission-candidate'
import {
  LivingFrameControlledImageFullFrameRatioExtensionError,
  createLivingFrameControlledImageFullFrameRatioExtension,
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from '../living-frame/living-frame-controlled-image-full-frame-ratio-extension'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  createLivingFrameControlledImageSelectedSceneRequest,
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
} from '../living-frame/living-frame-controlled-image-selected-scene-request'
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const admissionCandidate =
  await createLivingFrameComfyUiOperationAdmissionCandidate({
    candidateId:
      'living-frame.comfyui.full-frame-ratio.qualification.001',
  })

const baseInput =
  livingFrameControlledImageSelectedSceneSmokeInput
const baseRequest =
  livingFrameControlledImageSelectedSceneSmokeRequest
const baseExtensionInput = {
  extensionId:
    'living-frame.full-frame-ratio.16-9.001',
  selectedSceneRequest: baseRequest,
  selectedSceneRequestInput: baseInput,
  admissionCandidate,
} as const

const landscapeExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    baseExtensionInput,
  )

assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    landscapeExtension,
    baseExtensionInput,
  ),
  true,
)
assert.equal(
  landscapeExtension.confirmedFrameProfile.frameClass,
  'landscape_16_9',
)
assert.equal(
  landscapeExtension.confirmedFrameProfile.widthPixels,
  1920,
)
assert.equal(
  landscapeExtension.confirmedFrameProfile.heightPixels,
  1080,
)
assert.equal(
  landscapeExtension.fullFrameRequestUnits.length,
  1,
)
assert.equal(
  landscapeExtension.isolatedComponentBoundary.isolatedUnitCount,
  1,
)
assert.equal(
  landscapeExtension.fullFrameRequestUnits[0]!
    .frameProfile.squareSubstitutionApplied,
  false,
)
assert.equal(
  landscapeExtension.fullFrameRequestUnits[0]!
    .frameProfile.finalCanvasCreatedByComfyUi,
  false,
)
assert.equal(
  landscapeExtension.operationExpectation
    .currentObservedCountIsProductCap,
  false,
)
assert.equal(
  landscapeExtension.operationExpectation
    .registryExpansionPermitted,
  true,
)
assert.equal(
  landscapeExtension.operationExpectation
    .oneComfyUiIdentityForSharedGpuAttempt,
  true,
)
assert.equal(
  landscapeExtension.runtimeSafetyExpectation
    .atomicFiveModelMountLifetimeRequired,
  true,
)
assert.deepEqual(
  landscapeExtension.runtimeSafetyExpectation
    .deniedTopLevelImports,
  ['sam2'],
)
assert.equal(
  landscapeExtension.operationRegistered,
  false,
)
assert.equal(
  landscapeExtension.dispatchGranted,
  false,
)
assert.equal(
  landscapeExtension.productionReady,
  false,
)

const portraitFixture =
  createReframedSelectedSceneFixture({
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    requestBindingId:
      'living-frame.selected-scene-request.portrait.001',
  })
const portraitInput = {
  extensionId:
    'living-frame.full-frame-ratio.9-16.001',
  selectedSceneRequest: portraitFixture.request,
  selectedSceneRequestInput: portraitFixture.input,
  admissionCandidate,
} as const
const portraitExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    portraitInput,
  )
assert.equal(
  portraitExtension.confirmedFrameProfile.frameClass,
  'portrait_9_16',
)
assert.equal(
  portraitExtension.fullFrameRequestUnits[0]!
    .frameProfile.widthPixels,
  1080,
)
assert.equal(
  portraitExtension.fullFrameRequestUnits[0]!
    .frameProfile.heightPixels,
  1920,
)

const customFixture =
  createReframedSelectedSceneFixture({
    aspectRatio: 'custom',
    width: 2000,
    height: 1000,
    requestBindingId:
      'living-frame.selected-scene-request.custom.001',
  })
const customInput = {
  extensionId:
    'living-frame.full-frame-ratio.custom.001',
  selectedSceneRequest: customFixture.request,
  selectedSceneRequestInput: customFixture.input,
  admissionCandidate,
} as const
const customExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    customInput,
  )
assert.equal(
  customExtension.confirmedFrameProfile.frameClass,
  'custom_or_other_confirmed_ratio',
)
assert.equal(
  customExtension.confirmedFrameProfile
    .reducedAspectRatioNumerator,
  2,
)
assert.equal(
  customExtension.confirmedFrameProfile
    .reducedAspectRatioDenominator,
  1,
)
assert.equal(
  customExtension.fullFrameRequestUnits[0]!
    .frameProfile.sourceGenerationCanvasMatchesConfirmedRatio,
  true,
)

await assertRejectsWithIssue(
  {
    ...baseExtensionInput,
    selectedSceneRequestInput: {
      ...baseInput,
      components: {
        ...baseInput.components,
        confirmedSettings: {
          ...baseInput.components.confirmedSettings,
          outputFrameConfirmed: false,
        },
      },
    } as unknown as
      CreateLivingFrameControlledImageSelectedSceneRequestInput,
  },
  'confirmed_output_frame_required',
)

await assertRejectsWithIssue(
  {
    ...baseExtensionInput,
    selectedSceneRequestInput: {
      ...baseInput,
      components: {
        ...baseInput.components,
        confirmedSettings: {
          ...baseInput.components.confirmedSettings,
          aspectRatio: '9:16',
        },
      },
    } as unknown as
      CreateLivingFrameControlledImageSelectedSceneRequestInput,
  },
  'frame_ratio_mismatch',
)

await assertRejectsWithIssue(
  {
    ...baseExtensionInput,
    requestedWidthPixels: 1024,
    requestedHeightPixels: 1024,
  } as unknown as
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  'input_invalid',
)

const squareSubstitutionForgery =
  withoutExtensionDigest(landscapeExtension)
squareSubstitutionForgery.fullFrameRequestUnits =
  landscapeExtension.fullFrameRequestUnits.map((unit) => ({
    ...unit,
    frameProfile: {
      ...unit.frameProfile,
      widthPixels: 1024,
      heightPixels: 1024,
      pixelCount: 1024 * 1024,
      reducedAspectRatioNumerator: 1,
      reducedAspectRatioDenominator: 1,
      squareSubstitutionApplied: true,
    },
  }))
assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    resignExtension(squareSubstitutionForgery),
    baseExtensionInput,
  ),
  false,
)

const finalCanvasForgery =
  withoutExtensionDigest(landscapeExtension)
finalCanvasForgery.fullFrameRequestUnits =
  landscapeExtension.fullFrameRequestUnits.map((unit) => ({
    ...unit,
    frameProfile: {
      ...unit.frameProfile,
      finalCanvasCreatedByComfyUi: true,
    },
  }))
finalCanvasForgery.finalCanvasClaimAllowed = true
assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    resignExtension(finalCanvasForgery),
    baseExtensionInput,
  ),
  false,
)

const rawPromptForgery = resignExtension({
  ...withoutExtensionDigest(landscapeExtension),
  rawPrompt: 'draw a full-frame scene',
})
assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    rawPromptForgery,
    baseExtensionInput,
  ),
  false,
)

const runtimeInvariantForgery = resignExtension({
  ...withoutExtensionDigest(landscapeExtension),
  runtimeSafetyExpectation: {
    ...landscapeExtension.runtimeSafetyExpectation,
    deniedTopLevelImports: [],
    atomicFiveModelMountLifetimeRequired: false,
  },
})
assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    runtimeInvariantForgery,
    baseExtensionInput,
  ),
  false,
)

const registryCapForgery = resignExtension({
  ...withoutExtensionDigest(landscapeExtension),
  operationExpectation: {
    ...landscapeExtension.operationExpectation,
    currentObservedCountIsProductCap: true,
    registryExpansionPermitted: false,
  },
})
assert.equal(
  await verifyLivingFrameControlledImageFullFrameRatioExtension(
    registryCapForgery,
    baseExtensionInput,
  ),
  false,
)

const substitutedRequest =
  withoutSelectedRequestDigest(baseRequest)
substitutedRequest.requestUnits =
  baseRequest.requestUnits.map((unit) =>
    unit.componentRole === 'opaque_background_plate'
      ? {
          ...unit,
          sceneId: 'scene-cross-substituted',
          approvedWorkItemKey: 'work.cross-substituted',
        }
      : unit)
const substitutedInput = {
  ...baseExtensionInput,
  selectedSceneRequest:
    resignSelectedRequest(substitutedRequest),
} as unknown as
  CreateLivingFrameControlledImageFullFrameRatioExtensionInput
await assertRejectsWithIssue(
  substitutedInput,
  'selected_scene_request_invalid',
)

await assertRejectsWithIssue(
  {
    ...baseExtensionInput,
    modelPath:
      '/private/tmp/unapproved-model.safetensors',
  } as unknown as
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  'input_invalid',
)

console.log(JSON.stringify({
  status: 'passed',
  supportedFrameClasses: [
    landscapeExtension.confirmedFrameProfile.frameClass,
    portraitExtension.confirmedFrameProfile.frameClass,
    customExtension.confirmedFrameProfile.frameClass,
  ],
  landscapeDimensions: [
    landscapeExtension.confirmedFrameProfile.widthPixels,
    landscapeExtension.confirmedFrameProfile.heightPixels,
  ],
  portraitDimensions: [
    portraitExtension.confirmedFrameProfile.widthPixels,
    portraitExtension.confirmedFrameProfile.heightPixels,
  ],
  customDimensions: [
    customExtension.confirmedFrameProfile.widthPixels,
    customExtension.confirmedFrameProfile.heightPixels,
  ],
  registryExpansionPermitted:
    landscapeExtension.operationExpectation
      .registryExpansionPermitted,
  oneComfyUiIdentityForSharedGpuAttempt:
    landscapeExtension.operationExpectation
      .oneComfyUiIdentityForSharedGpuAttempt,
  operationRegistered:
    landscapeExtension.operationRegistered,
  dispatchGranted:
    landscapeExtension.dispatchGranted,
  adversarialAssertions: 10,
  productionReady:
    landscapeExtension.productionReady,
}))

function createReframedSelectedSceneFixture(input: {
  readonly aspectRatio: string
  readonly width: number
  readonly height: number
  readonly requestBindingId: string
}): {
  readonly input:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly request:
    LivingFrameControlledImageSelectedSceneRequest
} {
  const components = {
    ...baseInput.components,
    confirmedSettings: {
      ...baseInput.components.confirmedSettings,
      aspectRatio: input.aspectRatio,
      outputFrame: {
        ...baseInput.components.confirmedSettings.outputFrame,
        width: input.width,
        height: input.height,
      },
      outputFrameConfirmed: true,
      outputFramePurpose:
        'private_canonical_4k_master_review',
    },
  } as unknown as CanonicalPlanComponentsInput
  const frameDigest = sha256AuthorityValue({
    aspectRatio: input.aspectRatio,
    outputFrame:
      components.confirmedSettings.outputFrame,
    outputFrameConfirmed: true,
    outputFramePurpose:
      'private_canonical_4k_master_review',
  })
  const publication = {
    ...baseInput.publication,
    binding: {
      ...baseInput.publication.binding,
      sourceBindings: {
        ...baseInput.publication.binding.sourceBindings,
        confirmedOutputFrameDigestSha256: frameDigest,
      },
    },
  } as unknown as
    CanonicalLivingFrameSelectedScenePublication
  const estimateWorkAssetProjection =
    compileCanonicalLivingFrameEstimateWorkAssetProjection({
      publication,
      requirements: baseInput.requirements,
      timingBinding: baseInput.timingBinding,
      assetWorkInputBinding:
        baseInput.assetWorkInputBinding,
      components,
    })
  const customer =
    compileCanonicalCustomerEstimateAuthority({
      sourceEstimate: {
        lineItems: [],
        fallbackAllowanceCredits: 2,
        validForSeconds: 900,
      },
      components,
      livingFrameProjection:
        estimateWorkAssetProjection,
    })
  const controlledIllustrationCostWorkBinding =
    compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
      assetWorkInputBinding:
        baseInput.assetWorkInputBinding,
      estimateWorkAssetProjection,
      customerEstimateAuthority: customer.authority,
    })
  const workGraphProjection =
    compileCanonicalLivingFrameWorkGraphProjection({
      publication,
      requirements: baseInput.requirements,
      timingBinding: baseInput.timingBinding,
      assetWorkInputBinding:
        baseInput.assetWorkInputBinding,
      estimateWorkAssetProjection,
      customerEstimateAuthority: customer.authority,
      controlledIllustrationCostWorkBinding,
      components,
    })
  const selectedInput = {
    ...baseInput,
    requestBindingId: input.requestBindingId,
    publication,
    estimateWorkAssetProjection,
    customerEstimateAuthority: customer.authority,
    controlledIllustrationCostWorkBinding,
    workGraphProjection,
    components,
  }
  return {
    input: selectedInput,
    request:
      createLivingFrameControlledImageSelectedSceneRequest(
        selectedInput,
      ),
  }
}

async function assertRejectsWithIssue(
  input:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  expectedCode: string,
): Promise<void> {
  let caught: unknown
  try {
    await createLivingFrameControlledImageFullFrameRatioExtension(
      input,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameControlledImageFullFrameRatioExtensionError,
  )
  assert.equal(caught.issues[0]?.code, expectedCode)
}

function withoutExtensionDigest(
  value: LivingFrameControlledImageFullFrameRatioExtension,
): Record<string, unknown> {
  const clone =
    structuredClone(value) as unknown as Record<string, unknown>
  delete clone.extensionDigestSha256
  return clone
}

function resignExtension(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...value,
    extensionDigestSha256: digest(value),
  }
}

function withoutSelectedRequestDigest(
  value: LivingFrameControlledImageSelectedSceneRequest,
): Record<string, unknown> {
  const clone =
    structuredClone(value) as unknown as Record<string, unknown>
  delete clone.requestBindingDigestSha256
  return clone
}

function resignSelectedRequest(
  value: Record<string, unknown>,
): LivingFrameControlledImageSelectedSceneRequest {
  return {
    ...value,
    requestBindingDigestSha256: digest(value),
  } as unknown as
    LivingFrameControlledImageSelectedSceneRequest
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}
