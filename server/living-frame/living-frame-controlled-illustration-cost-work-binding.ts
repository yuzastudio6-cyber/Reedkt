import type {
  CanonicalCustomerEstimateAuthority,
  CanonicalCustomerEstimateLineItem,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_SOURCE,
  CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_VERSION,
  type CanonicalLivingFrameControlledIllustrationCostWorkBinding,
  type CanonicalLivingFrameControlledIllustrationCostWorkBindingAuthorityBoundary,
  type CanonicalLivingFrameControlledIllustrationCostWorkBindingDraft,
  type CanonicalLivingFrameControlledIllustrationSceneCostWorkBinding,
} from '../../src/types/living-frame-controlled-illustration-cost-work-binding'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
  CanonicalLivingFrameProjectedInfrastructureEstimateLineItem,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const GENERATED_ASSET_KINDS = new Set([
  'generated_opaque_still_source',
  'controlled_opaque_still_variation_source',
])

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameControlledIllustrationCostWorkBindingAuthorityBoundary =
  Object.freeze({
    serverDerivedCostWorkBindingAuthority: true,
    customerEstimateAuthority: false,
    customerServiceFeeAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    dispatchAuthority: false,
    modelArtifactAuthority: false,
    assetManifestAuthority: false,
    actualCostAuthority: false,
    settlementAuthority: false,
    walletAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export function compileCanonicalLivingFrameControlledIllustrationCostWorkBinding(
  input: {
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
  },
): CanonicalLivingFrameControlledIllustrationCostWorkBinding {
  assertSourceLineage(input)
  const scenes =
    input.assetWorkInputBinding.scenes.flatMap(
      (assetScene, sceneIndex) => {
        const generatedAssetIntentIds = uniqueSorted(
          assetScene.assetIntents
            .filter((intent) =>
              GENERATED_ASSET_KINDS.has(intent.assetKind))
            .map((intent) => intent.assetIntentId),
        )
        const projectedScene =
          input.estimateWorkAssetProjection.scenes.find(
            (candidate) =>
              candidate.sceneId === assetScene.sceneId,
          )
        if (!projectedScene) {
          throw conflict(
            'Living Frame controlled-illustration cost/work binding lost its projected scene.',
          )
        }
        const infrastructureLines =
          projectedScene.estimateLineItems.filter(
            isInfrastructureLine,
          )
        if (generatedAssetIntentIds.length === 0) {
          if (infrastructureLines.length !== 0) {
            throw conflict(
              'Living Frame controlled-illustration pricing exists without a generated asset intent.',
            )
          }
          return []
        }
        const generationLines =
          infrastructureLines.filter(
            (line) =>
              line.controlledIllustrationCostComponentId ===
                'shared_controlled_illustration_gpu_host',
          )
        const auraFaceLines =
          infrastructureLines.filter(
            (line) =>
              line.controlledIllustrationCostComponentId ===
                'auraface_cpu_continuity_measurement',
          )
        if (
          generationLines.length !== 1
          || auraFaceLines.length > 1
          || infrastructureLines.length !==
            generationLines.length + auraFaceLines.length
        ) {
          throw conflict(
            'Living Frame generated assets require one shared GPU cost line and at most one separate AuraFace QA line.',
          )
        }
        const generationLine = generationLines[0]!
        const auraFaceLine = auraFaceLines[0]
        assertCostLineCoverage(
          generationLine,
          generatedAssetIntentIds,
          'google_cloud_run_gpu',
          false,
        )
        if (auraFaceLine) {
          assertCostLineCoverage(
            auraFaceLine,
            generatedAssetIntentIds,
            'private_cpu_worker',
            true,
          )
        }
        assertCanonicalEstimateLine(
          input.customerEstimateAuthority,
          input.estimateWorkAssetProjection,
          generationLine,
        )
        if (auraFaceLine) {
          assertCanonicalEstimateLine(
            input.customerEstimateAuthority,
            input.estimateWorkAssetProjection,
            auraFaceLine,
          )
        }
        const workRequirementKey =
          `lf-ci-${String(sceneIndex + 1).padStart(3, '0')}-${sha256AuthorityValue({
            sceneId: assetScene.sceneId,
            generatedAssetIntentIds,
            generationCostLineKey:
              generationLine.lineKey,
          }).slice(0, 20)}`
        return [{
          sceneId: assetScene.sceneId,
          workRequirementKey,
          workItemType: 'generate_image_asset',
          costOwnerClass:
            'shared_controlled_illustration_runtime',
          generationCostComponentId:
            'shared_controlled_illustration_gpu_host',
          generationCostLineKey:
            generationLine.lineKey,
          generatedAssetIntentIds,
          generationUnitCount:
            generationLine.generationUnitCount,
          plannedAttemptCount:
            generationLine.attemptOrComparisonCount,
          maximumGenerationCreditBudget:
            generationLine.estimatedCredits,
          executionPlacement: 'google_cloud_run_gpu',
          expectedAccelerator: 'nvidia_l4',
          expectedGpuCount: 1,
          cpuFallbackAllowed: false,
          expectedOutputs:
            generatedAssetIntentIds.map(
              (assetIntentId, outputIndex) => ({
                assetIntentId,
                outputKey:
                  `${workRequirementKey}-output-${String(outputIndex + 1).padStart(3, '0')}`,
                artifactType:
                  'living_frame_generated_opaque_still_png',
                assetRole: 'generated',
                contentType: 'image/png',
                required: true,
                previewPlaceholderAllowed: false,
                assetManifestEntryRequiredAfterApproval:
                  true,
              }),
            ),
          optionalContinuityQaCostBinding:
            auraFaceLine
              ? {
                  workItemType: 'run_asset_qa',
                  costComponentId:
                    'auraface_cpu_continuity_measurement',
                  costLineKey: auraFaceLine.lineKey,
                  maximumCreditBudget:
                    auraFaceLine.estimatedCredits,
                  executionPlacement:
                    'private_cpu_worker',
                  conditional: true,
                }
              : null,
          currentAdmission:
            'blocked_until_existing_work_graph_and_operation_authority_admit_exact_binding',
          estimateLinePresentInCanonicalCustomerEstimate:
            true,
          actualAttemptCostEvidenceRequired: true,
          failedAndUnknownAttemptCostRetentionRequired:
            true,
          completedAttemptOnlyCustomerBillableCandidate:
            true,
          workItemCreated: false,
          executablePayloadPresent: false,
        } satisfies
          CanonicalLivingFrameControlledIllustrationSceneCostWorkBinding]
      },
    )
  const serviceFeeLineCount =
    input.customerEstimateAuthority
      .normalizedEstimate.lineItems.filter(
        (line) =>
          line.metadata.lineItemRole ===
            'reeditpro_service_fee',
      ).length
  if (serviceFeeLineCount !== 1) {
    throw conflict(
      'Living Frame controlled-illustration cost/work binding requires exactly one downstream service-fee line.',
    )
  }
  const draft:
    CanonicalLivingFrameControlledIllustrationCostWorkBindingDraft = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_VERSION,
      source:
        CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_SOURCE,
      evidenceClass:
        'private_internal_server_derived_controlled_illustration_cost_work_binding',
      identity: {
        ...input.estimateWorkAssetProjection.identity,
      },
      sourceBindings: {
        assetWorkInputBindingDigestSha256:
          input.assetWorkInputBinding.bindingDigestSha256,
        estimateWorkAssetProjectionDigestSha256:
          input.estimateWorkAssetProjection
            .projectionDigestSha256,
        customerEstimateAuthorityDigestSha256:
          input.customerEstimateAuthority
            .authorityDigestSha256,
      },
      scenes,
      metrics: {
        generatedSceneCount: scenes.length,
        generatedAssetIntentCount: scenes.reduce(
          (total, scene) =>
            total + scene.generatedAssetIntentIds.length,
          0,
        ),
        namedGenerateImageWorkRequirementCount:
          scenes.length,
        plannedGpuAttemptCount: scenes.reduce(
          (total, scene) =>
            total + scene.plannedAttemptCount,
          0,
        ),
        optionalAuraFaceQaBindingCount:
          scenes.filter((scene) =>
            scene.optionalContinuityQaCostBinding !==
              null).length,
        maximumGenerationCreditBudget:
          scenes.reduce(
            (total, scene) =>
              total
              + scene.maximumGenerationCreditBudget,
            0,
          ),
        maximumContinuityQaCreditBudget:
          scenes.reduce(
            (total, scene) =>
              total
              + (
                scene.optionalContinuityQaCostBinding
                  ?.maximumCreditBudget ?? 0
              ),
            0,
          ),
        unassignedControlledIllustrationCostLineCount:
          0,
        exactProductionToolRegistryCount: 50,
      },
      pricingPolicy: {
        capabilityIdsCreateIndependentCharges: false,
        oneSharedGpuHostChargePerGenerationAttempt:
          true,
        auraFaceIsSeparateConditionalCpuQa: true,
        exactAssetReuseAddsGenerationCost: false,
        aggregateMicroCostBeforeCreditRounding: true,
        serviceFeeIncludedInToolCosts: false,
        serviceFeeLineCount: 1,
        unapprovedOverageMayBeCharged: false,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      existingCustomerEstimateRemainsAuthority: true,
      existingApprovedWorkGraphRemainsAuthority: true,
      existingActualCostAndSettlementRemainAuthority:
        true,
      containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
        false,
      containsProviderPromptOrExecutablePayload: false,
      createsCanonicalWorkItems: false,
      expandsExactFiftyToolRegistry: false,
      productionReady: false,
    }
  return {
    ...draft,
    bindingDigestSha256:
      sha256AuthorityValue(draft),
  }
}

export function verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding(
  input: {
    readonly binding: unknown
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
  },
): input is {
  readonly binding:
    CanonicalLivingFrameControlledIllustrationCostWorkBinding
} & Omit<typeof input, 'binding'> {
  try {
    const expected =
      compileCanonicalLivingFrameControlledIllustrationCostWorkBinding(
        input,
      )
    return (
      isRecord(input.binding)
      && input.binding.schemaVersion ===
        CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_VERSION
      && input.binding.source ===
        CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_COST_WORK_BINDING_SOURCE
      && input.binding.bindingDigestSha256 ===
        sha256AuthorityValue(
          withoutDigest(input.binding),
        )
      && stableAuthorityStringify(input.binding) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

function assertSourceLineage(input: {
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly estimateWorkAssetProjection:
    CanonicalLivingFrameEstimateWorkAssetProjection
  readonly customerEstimateAuthority:
    CanonicalCustomerEstimateAuthority
}): void {
  const estimate = input.estimateWorkAssetProjection
  const customer = input.customerEstimateAuthority
  if (
    estimate.sourceBindings
      .assetWorkInputBindingDigestSha256 !==
      input.assetWorkInputBinding.bindingDigestSha256
    || customer.sourceBindings
      .livingFrameEstimateWorkAssetProjectionDigestSha256 !==
      estimate.projectionDigestSha256
    || customer.authorityDigestSha256 !==
      sha256AuthorityValue(
        withoutAuthorityDigest(customer),
      )
    || stableAuthorityStringify(estimate.identity) !==
      stableAuthorityStringify(
        input.assetWorkInputBinding.identity,
      )
    || estimate.scenes.length !==
      input.assetWorkInputBinding.scenes.length
    || estimate.metrics.exactProductionToolRegistryCount !==
      50
    || estimate.expandsExactFiftyToolRegistry
  ) {
    throw conflict(
      'Living Frame controlled-illustration cost/work source lineage is stale or inconsistent.',
    )
  }
}

function assertCostLineCoverage(
  line:
    CanonicalLivingFrameProjectedInfrastructureEstimateLineItem,
  generatedAssetIntentIds: readonly string[],
  executionPlacement:
    'google_cloud_run_gpu' | 'private_cpu_worker',
  cpuFallbackAllowed: boolean,
): void {
  if (
    stableAuthorityStringify(
      uniqueSorted(line.generatedAssetIntentIds),
    ) !== stableAuthorityStringify(
      generatedAssetIntentIds,
    )
    || line.generationUnitCount !==
      generatedAssetIntentIds.length
    || line.attemptOrComparisonCount <
      line.generationUnitCount
    || line.executionPlacement !== executionPlacement
    || line.cpuFallbackAllowed !== cpuFallbackAllowed
    || line.costRange.serviceFeeIncluded
    || line.exactFiftyToolRegistryMember
    || line.operationContractObserved
    || !line.actualAttemptCostEvidenceRequired
    || line.productionRateAuthority
    || !line.estimateOnly
  ) {
    throw conflict(
      'Living Frame controlled-illustration cost line does not cover the generated asset intents exactly.',
    )
  }
}

function assertCanonicalEstimateLine(
  customerEstimateAuthority:
    CanonicalCustomerEstimateAuthority,
  projection:
    CanonicalLivingFrameEstimateWorkAssetProjection,
  projectedLine:
    CanonicalLivingFrameProjectedInfrastructureEstimateLineItem,
): void {
  const lines =
    customerEstimateAuthority.normalizedEstimate
      .lineItems.filter(
        (line) => line.lineKey === projectedLine.lineKey,
      )
  if (lines.length !== 1) {
    throw conflict(
      'Living Frame controlled-illustration cost line is absent or duplicated in the canonical customer estimate.',
    )
  }
  const line = lines[0]!
  if (
    line.category !== 'living_frame'
    || line.estimatedCredits !==
      projectedLine.estimatedCredits
    || line.removable
    || line.metadata.lineItemRole !==
      'living_frame_tool_cost_ceiling'
    || line.metadata.serverDerived !== true
    || line.metadata.projectionDigestSha256 !==
      projection.projectionDigestSha256
    || line.metadata.costOwnerClass !==
      'shared_controlled_illustration_runtime'
    || line.metadata.controlledIllustrationCostComponentId !==
      projectedLine.controlledIllustrationCostComponentId
    || stableAuthorityStringify(
      line.metadata.generatedAssetIntentIds,
    ) !== stableAuthorityStringify(
      projectedLine.generatedAssetIntentIds,
    )
    || line.metadata.serviceFeeIncluded !== false
    || line.metadata.executionAuthorized !== false
  ) {
    throw conflict(
      'Living Frame controlled-illustration customer estimate line lost its exact cost/work lineage.',
    )
  }
}

function isInfrastructureLine(
  line:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['estimateLineItems'][number],
): line is CanonicalLivingFrameProjectedInfrastructureEstimateLineItem {
  return line.costOwnerClass ===
    'shared_controlled_illustration_runtime'
}

function uniqueSorted(
  values: readonly string[],
): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.bindingDigestSha256
  return draft
}

function withoutAuthorityDigest(
  authority:
    CanonicalCustomerEstimateAuthority,
): Record<string, unknown> {
  const draft = {
    ...authority,
  } as unknown as Record<string, unknown>
  delete draft.authorityDigestSha256
  return draft
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_controlled_illustration_cost_work_binding',
    },
  )
}
