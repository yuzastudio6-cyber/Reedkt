import {
  calculateReEditProServiceFeeCredits,
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_FINAL_CHARGE_FORMULA,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import type {
  ReEditProCanonicalEditLevel,
  ReEditProLegacyEditLevel,
} from '../../src/types/edit-level'
import {
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY,
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE,
  CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION,
  type CanonicalCustomerEstimateAuthority,
  type CanonicalCustomerEstimateAuthorityDraft,
  type CanonicalCustomerEstimateLineItem,
  type CanonicalCustomerEstimateValue,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import {
  mapLegacyEditLevelToCanonical,
} from '../../src/lib/edit-level-compatibility-mappers'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import type {
  AuthorityCreditEstimateRecord,
  AuthorityJsonBlobRef,
} from './private-edit-authority-store'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export interface CanonicalCustomerEstimateCompilation {
  readonly authority: CanonicalCustomerEstimateAuthority
  readonly estimate: CanonicalEstimateInput
}

export function compileCanonicalCustomerEstimateAuthority(
  input: {
    readonly sourceEstimate: CanonicalEstimateInput
    readonly components: CanonicalPlanComponentsInput
    readonly livingFrameProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
  },
): CanonicalCustomerEstimateCompilation {
  const sourceEstimate = cloneEstimate(input.sourceEstimate)
  const sourceServiceFeeLines =
    sourceEstimate.lineItems.filter(isServiceFeeLine)
  if (sourceServiceFeeLines.length > 1) {
    throw invalidEstimate(
      'Canonical customer estimate contains more than one service/edit-fee line.',
    )
  }
  if (
    sourceEstimate.lineItems.some(
      (item) =>
        isServerOwnedLivingFrameEstimateLine(item),
    )
  ) {
    throw invalidEstimate(
      'Caller estimate cannot pre-populate server-owned Living Frame cost lines.',
    )
  }
  const sourceNonServiceLines =
    sourceEstimate.lineItems.filter(
      (item) => !isServiceFeeLine(item),
    )
  const livingFrameLines =
    compileLivingFrameEstimateLines(
      input.livingFrameProjection,
    )
  const nonServiceLines = [
    ...sourceNonServiceLines,
    ...livingFrameLines,
  ]
  assertUniqueLineKeys(nonServiceLines)
  const conservativeToolCostBasisCredits =
    nonServiceLines.reduce(
      (total, item) =>
        total + item.estimatedCredits,
      0,
    )
  const productEditLevel = resolveProductEditLevel(
    input.components.confirmedSettings.editLevel,
  )
  const durationSeconds =
    input.components.timingSummary.totalFrames
    / input.components.timingSummary.fps
  const fee = calculateReEditProServiceFeeCredits({
    actualToolCostCredits:
      conservativeToolCostBasisCredits,
    durationSeconds,
    editLevel: productEditLevel,
  })
  if (
    fee.customEstimateRequired
    || fee.serviceFeeCredits === null
    || fee.lengthFloorFeeCredits === null
    || fee.serviceFeeCredits > 10_000_000
  ) {
    throw new ApiError(
      'CREDIT_ESTIMATE_NOT_APPROVED',
      'This edit requires a reviewed custom customer estimate before canonical plan publication.',
      409,
      {
        requiredGate:
          'canonical_custom_customer_estimate',
      },
    )
  }
  const serviceFeeLine =
    compileServiceFeeLine({
      productEditLevel,
      durationSeconds,
      conservativeToolCostBasisCredits,
      durationBucket: fee.durationBucket,
      lengthFloorFeeCredits:
        fee.lengthFloorFeeCredits,
      percentageFeeCredits:
        fee.percentageFeeCredits,
      serviceFeeCredits: fee.serviceFeeCredits,
    })
  const normalizedEstimate: CanonicalEstimateInput = {
    lineItems: [...nonServiceLines, serviceFeeLine],
    fallbackAllowanceCredits:
      sourceEstimate.fallbackAllowanceCredits,
    validForSeconds: sourceEstimate.validForSeconds,
  }
  if (normalizedEstimate.lineItems.length > 512) {
    throw invalidEstimate(
      'Canonical customer estimate exceeds the bounded line-item limit after server recalculation.',
    )
  }
  const normalizedEstimatedCredits =
    normalizedEstimate.lineItems.reduce(
      (total, item) =>
        total + item.estimatedCredits,
      0,
    )
  const sourceValue =
    sourceEstimate as CanonicalCustomerEstimateValue
  const normalizedValue =
    normalizedEstimate as CanonicalCustomerEstimateValue
  const draft: CanonicalCustomerEstimateAuthorityDraft = {
    schemaVersion:
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION,
    source: CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE,
    evidenceClass:
      'private_internal_server_recalculated_customer_estimate',
    sourceEstimate: sourceValue,
    normalizedEstimate: normalizedValue,
    sourceBindings: {
      confirmedSettingsDigestSha256:
        sha256AuthorityValue(
          input.components.confirmedSettings,
        ),
      masterTimingDigestSha256:
        sha256AuthorityValue(
          input.components.masterTimingPlan,
        ),
      sourceEstimateDigestSha256:
        sha256AuthorityValue(sourceEstimate),
      livingFrameEstimateWorkAssetProjectionDigestSha256:
        input.livingFrameProjection
          ?.projectionDigestSha256 ?? null,
    },
    sourceNonServiceLineItemCount:
      sourceNonServiceLines.length,
    sourceServiceFeeLineItemCount:
      sourceServiceFeeLines.length as 0 | 1,
    projectedLivingFrameToolCostLineItemCount:
      livingFrameLines.length,
    projectedLivingFrameMaximumInternalToolCostCredits:
      livingFrameLines.reduce(
        (total, item) =>
          total + item.estimatedCredits,
        0,
      ),
    serviceFeeProjection: {
      lineKey: 'weeditpro-service-edit-fee',
      productEditLevel,
      durationSeconds,
      durationBucket: fee.durationBucket,
      conservativeToolCostBasisCredits,
      lengthFloorFeeCredits:
        fee.lengthFloorFeeCredits,
      percentageFeeCredits:
        fee.percentageFeeCredits,
      serviceFeeCredits: fee.serviceFeeCredits,
      serviceFeeIncludedInToolCosts: false,
    },
    normalizedEstimatedCredits,
    normalizedApprovedMaximumCredits:
      normalizedEstimatedCredits
      + normalizedEstimate.fallbackAllowanceCredits,
    creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
    serviceFeePolicyVersion:
      REEDITPRO_SERVICE_FEE_POLICY_VERSION,
    finalChargeFormula: REEDITPRO_FINAL_CHARGE_FORMULA,
    estimatePresentedBeforeApproval: true,
    creditsReservedOnlyAfterApproval: true,
    actualChargeStillRequiresActualBillableToolCost: true,
    unusedApprovedReservationMustBeReleased: true,
    customerWalletMutationAuthority: false,
    creditReservationAuthority: false,
    ledgerAuthority: false,
    approvalAuthority: false,
    providerAuthority: false,
    toolExecutionAuthority: false,
    workerAuthority: false,
    renderAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  }
  return {
    authority: {
      ...draft,
      authorityDigestSha256: sha256AuthorityValue(draft),
    },
    estimate: normalizedEstimate,
  }
}

export async function persistCanonicalCustomerEstimateAuthority(
  input: {
    readonly context: ServiceContext
    readonly authority:
      CanonicalCustomerEstimateAuthority
  },
): Promise<Record<string, AuthorityJsonBlobRef>> {
  return {
    [CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY]:
      await putPrivateAuthorityJsonBlob({
        localStorageRoot:
          input.context.env.localStorageRoot,
        value:
          input.authority as unknown as Record<string, unknown>,
        maxBytes: 2 * 1024 * 1024,
      }),
  }
}

export async function loadCanonicalCustomerEstimateAuthority(
  input: {
    readonly context: ServiceContext
    readonly componentRefs:
      Record<string, AuthorityJsonBlobRef>
    readonly components: CanonicalPlanComponentsInput
    readonly livingFrameProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection | undefined
    readonly estimateRecord:
      AuthorityCreditEstimateRecord
  },
): Promise<CanonicalCustomerEstimateAuthority> {
  const ref =
    input.componentRefs[
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY
    ]
  if (!ref) {
    throw invalidEstimate(
      'Canonical plan is missing its server-owned customer estimate authority.',
    )
  }
  const value = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  if (!isCanonicalCustomerEstimateAuthority(value)) {
    throw invalidEstimate(
      'Canonical customer estimate authority is malformed.',
    )
  }
  const expected =
    compileCanonicalCustomerEstimateAuthority({
      sourceEstimate:
        value.sourceEstimate as CanonicalEstimateInput,
      components: input.components,
      livingFrameProjection:
        input.livingFrameProjection,
    })
  if (
    stableAuthorityStringify(value) !==
      stableAuthorityStringify(expected.authority)
  ) {
    throw invalidEstimate(
      'Canonical customer estimate authority failed source revalidation.',
    )
  }
  const persistedEstimate =
    await reconstructPersistedEstimate({
      context: input.context,
      record: input.estimateRecord,
      validForSeconds:
        expected.estimate.validForSeconds,
    })
  if (
    stableAuthorityStringify(persistedEstimate) !==
      stableAuthorityStringify(expected.estimate)
    || input.estimateRecord.estimatedCredits !==
      expected.authority.normalizedEstimatedCredits
    || input.estimateRecord.approvedMaximumCredits !==
      expected.authority.normalizedApprovedMaximumCredits
  ) {
    throw invalidEstimate(
      'Persisted customer estimate no longer matches its server-owned recalculation authority.',
    )
  }
  return expected.authority
}

function compileLivingFrameEstimateLines(
  projection:
    CanonicalLivingFrameEstimateWorkAssetProjection | undefined,
): CanonicalCustomerEstimateLineItem[] {
  if (!projection) return []
  if (
    projection.readiness ===
      'ready_without_living_frame_projection'
  ) {
    if (
      projection.scenes.length !== 0
      || projection.metrics
        .projectedEstimateLineItemCount !== 0
    ) {
      throw invalidEstimate(
        'Living Frame deliberate non-use contains unexpected estimate requirements.',
      )
    }
    return []
  }
  return projection.scenes.flatMap((scene) =>
    scene.estimateLineItems.map((item) => ({
      lineKey: item.lineKey,
      label: item.label,
      category: item.category,
      estimatedCredits: item.estimatedCredits,
      removable: false,
      metadata: {
        lineItemRole:
          'living_frame_tool_cost_ceiling',
        serverDerived: true,
        projectionDigestSha256:
          projection.projectionDigestSha256,
        sceneId: item.sceneId,
        costOwnerClass: item.costOwnerClass,
        workItemType: item.workItemType,
        costOwnerToolId: item.costOwnerToolId,
        costOwnerOperationId:
          item.costOwnerOperationId,
        controlledIllustrationCostComponentId:
          item.controlledIllustrationCostComponentId,
        activeControlledIllustrationCapabilityIds:
          item.activeControlledIllustrationCapabilityIds,
        ...(item.costOwnerClass ===
          'shared_controlled_illustration_runtime'
          ? {
              generationUnitCount:
                item.generationUnitCount,
              attemptOrComparisonCount:
                item.attemptOrComparisonCount,
              billableMilliseconds:
                item.billableMilliseconds,
            }
          : {}),
        executionPlacement:
          item.executionPlacement,
        cpuFallbackAllowed:
          item.cpuFallbackAllowed,
        lowCredits: item.costRange.lowCredits,
        expectedCredits:
          item.costRange.expectedCredits,
        highCredits: item.costRange.highCredits,
        rateCardVersion:
          item.costRange.rateCardVersion,
        exactFiftyToolRegistryMember:
          item.exactFiftyToolRegistryMember,
        operationContractObserved:
          item.operationContractObserved,
        actualAttemptCostEvidenceRequired:
          item.actualAttemptCostEvidenceRequired,
        productionRateAuthority:
          item.productionRateAuthority,
        serviceFeeIncluded: false,
        estimateOnly: true,
        executionAuthorized: false,
      },
    })),
  )
}

function compileServiceFeeLine(input: {
  readonly productEditLevel:
    ReEditProCanonicalEditLevel
  readonly durationSeconds: number
  readonly durationBucket:
    | '0_5_min'
    | '5_10_min'
    | '10_20_min'
    | '20_60_min'
    | '60_plus_custom'
  readonly conservativeToolCostBasisCredits: number
  readonly lengthFloorFeeCredits: number
  readonly percentageFeeCredits: number
  readonly serviceFeeCredits: number
}): CanonicalCustomerEstimateLineItem {
  return {
    lineKey: 'weeditpro-service-edit-fee',
    label: 'WeEditPro service/edit fee',
    category: 'service_fee',
    estimatedCredits: input.serviceFeeCredits,
    removable: false,
    metadata: {
      lineItemRole: 'reeditpro_service_fee',
      serverDerived: true,
      productEditLevel: input.productEditLevel,
      durationSeconds: input.durationSeconds,
      durationBucket: input.durationBucket,
      conservativeToolCostBasisCredits:
        input.conservativeToolCostBasisCredits,
      lengthFloorFeeCredits:
        input.lengthFloorFeeCredits,
      percentageFeeCredits:
        input.percentageFeeCredits,
      serviceFeeCredits: input.serviceFeeCredits,
      serviceFeeIncluded: true,
      toolCostsIncludeServiceFee: false,
      creditPolicyVersion:
        REEDITPRO_CREDIT_POLICY_VERSION,
      serviceFeePolicyVersion:
        REEDITPRO_SERVICE_FEE_POLICY_VERSION,
      finalChargeFormula:
        REEDITPRO_FINAL_CHARGE_FORMULA,
      creditsReservedOnlyAfterApproval: true,
      unusedApprovedReservationMustBeReleased: true,
      billingExecuted: false,
    },
  }
}

async function reconstructPersistedEstimate(input: {
  readonly context: ServiceContext
  readonly record: AuthorityCreditEstimateRecord
  readonly validForSeconds: number
}): Promise<CanonicalEstimateInput> {
  const lineItems = await Promise.all(
    input.record.lineItems.map(async (item) => {
      const metadata =
        await readPrivateAuthorityJsonBlob({
          localStorageRoot:
            input.context.env.localStorageRoot,
          ref: item.metadataRef,
        })
      if (Array.isArray(metadata)) {
        throw invalidEstimate(
          'Persisted customer estimate line metadata must be a JSON object.',
        )
      }
      return {
        lineKey: item.lineKey,
        label: item.label,
        category: item.category,
        estimatedCredits: item.estimatedCredits,
        removable: item.removable,
        metadata,
      }
    }),
  )
  return {
    lineItems,
    fallbackAllowanceCredits:
      input.record.fallbackAllowanceCredits,
    validForSeconds: input.validForSeconds,
  }
}

function isServiceFeeLine(
  item: CanonicalCustomerEstimateLineItem,
): boolean {
  return (
    item.metadata.lineItemRole ===
      'reeditpro_service_fee'
    || item.category === 'service_fee'
    || item.lineKey === 'weeditpro-service-edit-fee'
    || /^(?:reeditpro|weeditpro) service\/edit fee$/i.test(
      item.label.trim(),
    )
  )
}

function isServerOwnedLivingFrameEstimateLine(
  item: CanonicalCustomerEstimateLineItem,
): boolean {
  return (
    item.metadata.lineItemRole ===
      'living_frame_tool_cost_ceiling'
    || item.lineKey.startsWith('lf-')
    || item.category === 'living_frame'
  )
}

function assertUniqueLineKeys(
  lineItems:
    readonly CanonicalCustomerEstimateLineItem[],
): void {
  const keys = lineItems.map((item) => item.lineKey)
  if (new Set(keys).size !== keys.length) {
    throw invalidEstimate(
      'Canonical customer estimate line keys must be unique after server recalculation.',
    )
  }
}

function resolveProductEditLevel(
  editLevel:
    CanonicalPlanComponentsInput[
      'confirmedSettings'
    ]['editLevel'],
): ReEditProCanonicalEditLevel {
  if (
    editLevel === 'normal'
    || editLevel === 'ultra_premium'
  ) {
    return editLevel
  }
  return mapLegacyEditLevelToCanonical(
    editLevel as ReEditProLegacyEditLevel,
  )
}

function cloneEstimate(
  estimate: CanonicalEstimateInput,
): CanonicalEstimateInput {
  return {
    lineItems: estimate.lineItems.map((item) => ({
      ...item,
      metadata: structuredClone(item.metadata),
    })),
    fallbackAllowanceCredits:
      estimate.fallbackAllowanceCredits,
    validForSeconds: estimate.validForSeconds,
  }
}

function isCanonicalCustomerEstimateAuthority(
  value: unknown,
): value is CanonicalCustomerEstimateAuthority {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && (value as Record<string, unknown>).schemaVersion ===
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION
    && (value as Record<string, unknown>).source ===
      CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE
    && typeof (value as Record<string, unknown>)
      .authorityDigestSha256 === 'string',
  )
}

function invalidEstimate(message: string): ApiError {
  return new ApiError(
    'CREDIT_ESTIMATE_NOT_APPROVED',
    message,
    409,
    {
      requiredGate:
        'canonical_customer_estimate_authority',
    },
  )
}
