import { z } from 'zod'

import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
} from '../edit-architecture/canonical-quality-first-professional-tool-gpu-placement'
import {
  canonicalConfirmedOutputFrameAuthoritySchema,
  type CanonicalConfirmedOutputFrameAuthority,
} from './canonical-confirmed-output-frame-authority'
import {
  assertCanonicalProfessionalGpuPlanPreapprovalManifest,
  assertCanonicalProfessionalGpuPlanPricingBasis,
  assertCanonicalProfessionalGpuPlanPublicationBinding,
  canonicalProfessionalGpuPlanPreapprovalManifestSchema,
  canonicalProfessionalGpuPlanPricingBasisSchema,
  canonicalProfessionalGpuPlanPublicationBindingSchema,
  canonicalProfessionalGpuWorkGraphPricingStructureDigest,
  type CanonicalProfessionalGpuPlanPreapprovalManifest,
  type CanonicalProfessionalGpuPlanPricingBasis,
  type CanonicalProfessionalGpuPlanPublicationBinding,
} from './canonical-professional-gpu-plan-preapproval-authority-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  canonicalEstimateSchema,
  canonicalPlanComponentsSchema,
  canonicalWorkItemSchema,
  type CanonicalEstimateInput,
  type CanonicalPlanComponentsInput,
  type CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'

export const CANONICAL_PROFESSIONAL_GPU_PLAN_APPROVAL_PRICING_AUTHORITY_VERSION =
  'canonical-professional-gpu-plan-approval-pricing-authority-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_APPROVAL_PRICING_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_plan_approval_pricing_owner',
  ),
  evidenceClass: z.literal('create_only_exact_reread'),
  authorityId: safeId,
  workspaceId: safeId,
  editPlanId: safeId,
  publishedPlanRef: evidenceRefSchema,
  publishedCustomerEstimateRef: evidenceRefSchema,
  pricingBasis: canonicalProfessionalGpuPlanPricingBasisSchema,
  preapprovalManifest:
    canonicalProfessionalGpuPlanPreapprovalManifestSchema,
  publicationBinding:
    canonicalProfessionalGpuPlanPublicationBindingSchema,
  exactAccountEffectiveRatesAndQualifiedUsageReread: z.literal(true),
  exactGpuLinesAndWorkBudgetsPublishedBeforeApproval: z.literal(true),
  createOnlyPersistenceVerified: z.literal(true),
  exactPostPersistenceReread: z.literal(true),
  callerRatePriceDurationRouteOrReleaseAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  approvalGranted: z.literal(false),
  creditReservationCreated: z.literal(false),
  dispatchAuthorized: z.literal(false),
  sealedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema =
  authorityWithoutHashSchema.extend({ authorityHash: sha256 }).strict()
    .superRefine((authority, context) => {
      const { authorityHash, ...payload } = authority
      if (authorityHash !== sha256AuthorityValue(payload)) context.addIssue({
        code: 'custom',
        message: 'GPU plan approval pricing authority digest is invalid.',
      })
    })
export type CanonicalProfessionalGpuPlanApprovalPricingAuthority = z.infer<
  typeof canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema
>

export interface CanonicalProfessionalGpuPlanApprovalPricingAuthorityReadPort {
  rereadPublishedPlanPricingAuthority(input: {
    readonly workspaceId: string
    readonly editPlanId: string
    readonly at: string
  }): Promise<unknown>
}

export function canonicalPlanRequiresProfessionalGpuPricingAuthority(
  workItems: readonly CanonicalWorkItemInput[],
): boolean {
  assertClosedPlainSerializedData(workItems, 'gpu_plan_work_items')
  const parsedWorkItems = z.array(canonicalWorkItemSchema).max(256)
    .parse(workItems)
  const placement =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  return parsedWorkItems.some((workItem) => workItem.approvedToolIds.some(
    (toolId) => {
      const entry = placement.entries.find((candidate) =>
        candidate.toolId === toolId)
      return entry !== undefined
        && entry.placementClass !== 'non_gpu_control_plane_only'
    },
  ))
}

export function createCanonicalProfessionalGpuPlanApprovalPricingAuthority(
  input: {
    readonly authorityId: string
    readonly workspaceId: string
    readonly editPlanId: string
    readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
    readonly preapprovalManifest:
      CanonicalProfessionalGpuPlanPreapprovalManifest
    readonly publicationBinding:
      CanonicalProfessionalGpuPlanPublicationBinding
    readonly sealedAt: string
  },
): CanonicalProfessionalGpuPlanApprovalPricingAuthority {
  assertClosedPlainSerializedData(input, 'gpu_plan_approval_pricing_input')
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    input.preapprovalManifest,
    basis,
    input.sealedAt,
  )
  const binding = assertCanonicalProfessionalGpuPlanPublicationBinding(
    input.publicationBinding,
  )
  if (
    input.workspaceId !== basis.scope.workspaceId
    || input.editPlanId !== binding.publishedPlanRef.id
    || !sameRef(binding.pricingBasisRef, ref(
      `gpu-pricing-basis:${basis.scope.planningRequestId}`,
      basis.pricingBasisHash,
    ))
    || !sameRef(binding.preapprovalManifestRef, ref(
      manifest.manifestId,
      manifest.manifestHash,
      manifest.manifestVersion,
    ))
  ) throw new Error('GPU approval pricing authority lost plan lineage.')
  const payload = authorityWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PLAN_APPROVAL_PRICING_AUTHORITY_VERSION,
    source: 'canonical_server_professional_gpu_plan_approval_pricing_owner',
    evidenceClass: 'create_only_exact_reread',
    authorityId: input.authorityId,
    workspaceId: input.workspaceId,
    editPlanId: input.editPlanId,
    publishedPlanRef: binding.publishedPlanRef,
    publishedCustomerEstimateRef:
      binding.publishedCustomerEstimateRef,
    pricingBasis: basis,
    preapprovalManifest: manifest,
    publicationBinding: binding,
    exactAccountEffectiveRatesAndQualifiedUsageReread: true,
    exactGpuLinesAndWorkBudgetsPublishedBeforeApproval: true,
    createOnlyPersistenceVerified: true,
    exactPostPersistenceReread: true,
    callerRatePriceDurationRouteOrReleaseAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    approvalGranted: false,
    creditReservationCreated: false,
    dispatchAuthorized: false,
    sealedAt: input.sealedAt,
  })
  return canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function verifyCanonicalProfessionalGpuPlanApprovalPricingAuthority(
  input: {
    readonly value: unknown
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly planningRequestId: string
    readonly editPlanId: string
    readonly editPlanVersion: number
    readonly editPlanHash: string
    readonly estimateId: string
    readonly estimateVersion: number
    readonly estimateHash: string
    readonly components: CanonicalPlanComponentsInput
    readonly workItems: readonly CanonicalWorkItemInput[]
    readonly customerEstimate: CanonicalEstimateInput
    readonly confirmedOutputFrameAuthority:
      CanonicalConfirmedOutputFrameAuthority
    readonly at: string
  },
): CanonicalProfessionalGpuPlanApprovalPricingAuthority {
  assertClosedPlainSerializedData(input, 'gpu_plan_approval_verification_input')
  const authority = canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema
    .parse(input.value)
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    authority.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    authority.preapprovalManifest,
    basis,
    input.at,
  )
  const binding = assertCanonicalProfessionalGpuPlanPublicationBinding(
    authority.publicationBinding,
  )
  const frameAuthority = canonicalConfirmedOutputFrameAuthoritySchema.parse(
    input.confirmedOutputFrameAuthority,
  )
  const { authorityDigestSha256, ...framePayload } = frameAuthority
  if (authorityDigestSha256 !== sha256AuthorityValue(framePayload)) {
    throw new Error('Canonical confirmed-output authority digest is invalid.')
  }
  const components = canonicalPlanComponentsSchema.parse(input.components)
  const workItems = z.array(canonicalWorkItemSchema).min(1).max(256)
    .parse(input.workItems)
  const customerEstimate = canonicalEstimateSchema.parse(
    input.customerEstimate,
  )
  const frame = frameAuthority.confirmedOutputBinding
  const exactPlanRef = {
    id: input.editPlanId,
    version: input.editPlanVersion,
    contentHash: `sha256:${input.editPlanHash}` as const,
  }
  const exactEstimateRef = {
    id: input.estimateId,
    version: input.estimateVersion,
    contentHash: `sha256:${input.estimateHash}` as const,
  }
  const gpuLines = customerEstimate.lineItems.filter((line) =>
    line.category === 'gpu_tool_infrastructure'
    || line.lineKey.startsWith('gpu-tool-'))
  const expectedGpuLines = manifest.entries.map((entry) =>
    entry.customerEstimateLine)
  const workByKey = new Map(workItems.map((workItem) =>
    [workItem.workItemKey, workItem]))
  const exactScope = basis.scope.ownerUserId === input.ownerUserId
    && basis.scope.workspaceId === input.workspaceId
    && basis.scope.projectId === input.projectId
    && basis.scope.editSessionId === input.editSessionId
    && basis.scope.planningRequestId === input.planningRequestId
    && basis.scope.outputId === frame.outputId
  const exactComponents =
    basis.canonicalPlanComponentsDigestSha256 ===
      sha256AuthorityValue(components)
    && basis.confirmedSettingsDigestSha256 ===
      sha256AuthorityValue(components.confirmedSettings)
    && basis.masterTimingDigestSha256 ===
      sha256AuthorityValue(components.masterTimingPlan)
  const exactFrame = sameRef(
    basis.confirmedOutputFrame.outputFrameRef,
    frame.confirmedOutputFrameRef,
  )
    && basis.confirmedOutputFrame.aspectRatio === frame.aspectRatioLabel
    && basis.confirmedOutputFrame.width === frame.width
    && basis.confirmedOutputFrame.height === frame.height
    && basis.confirmedOutputFrame.fps ===
      frame.fpsNumerator / frame.fpsDenominator
  const exactWork =
    basis.canonicalWorkGraphPricingStructureDigestSha256 ===
      canonicalProfessionalGpuWorkGraphPricingStructureDigest(workItems)
    && binding.publishedCanonicalWorkGraphDigestSha256 ===
      sha256AuthorityValue(workItems)
    && manifest.entries.every((entry) =>
      workByKey.get(entry.workItemKey)?.maximumCreditBudget ===
        entry.customerEstimateLine.estimatedCredits)
    && manifest.nonpricedToolUnits.every((entry) =>
      workByKey.get(entry.workItemKey)?.maximumCreditBudget === 0)
  const exactEstimate =
    binding.publishedCustomerEstimateDigestSha256 ===
      sha256AuthorityValue(customerEstimate)
    && stableAuthorityStringify(gpuLines) ===
      stableAuthorityStringify(expectedGpuLines)
  if (
    authority.workspaceId !== input.workspaceId
    || authority.editPlanId !== input.editPlanId
    || !sameRef(authority.publishedPlanRef, exactPlanRef)
    || !sameRef(authority.publishedCustomerEstimateRef, exactEstimateRef)
    || !sameRef(binding.publishedPlanRef, exactPlanRef)
    || !sameRef(binding.publishedCustomerEstimateRef, exactEstimateRef)
    || !exactScope
    || !exactComponents
    || !exactFrame
    || !exactWork
    || !exactEstimate
    || basis.pricingUnits.length < 1
    || basis.pricingUnits.some((unit) =>
      unit.operationAuthorityDisposition !==
        'canonical_production_operation_registered')
  ) throw new Error(
    'GPU plan approval pricing authority does not match the immutable plan.',
  )
  return authority
}

function ref(id: string, digest: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${digest}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertClosedPlainSerializedData(value: unknown, label: string): void {
  const active = new WeakSet<object>()
  let visitedNodes = 0
  const visit = (item: unknown, depth: number): void => {
    if (
      item === null
      || typeof item === 'string'
      || typeof item === 'boolean'
      || typeof item === 'undefined'
    ) return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) {
        throw new TypeError(`${label} contains a non-finite number.`)
      }
      return
    }
    if (typeof item !== 'object') {
      throw new TypeError(`${label} contains an unsupported value.`)
    }
    visitedNodes += 1
    if (depth > 72 || visitedNodes > 75_000) {
      throw new TypeError(`${label} exceeds structural bounds.`)
    }
    const object = item as object
    if (active.has(object)) throw new TypeError(`${label} cannot be cyclic.`)
    let prototype: object | null
    let keys: readonly PropertyKey[]
    try {
      prototype = Object.getPrototypeOf(object)
      keys = Reflect.ownKeys(object)
    } catch {
      throw new TypeError(`${label} cannot be inspected.`)
    }
    if (
      !Array.isArray(object)
      && prototype !== Object.prototype
      && prototype !== null
    ) throw new TypeError(`${label} requires plain records and arrays.`)
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError(`${label} cannot contain symbol keys.`)
    }
    active.add(object)
    try {
      for (const key of keys as readonly string[]) {
        if (Array.isArray(object) && key === 'length') continue
        let descriptor: PropertyDescriptor | undefined
        try {
          descriptor = Object.getOwnPropertyDescriptor(object, key)
        } catch {
          throw new TypeError(`${label} cannot be inspected.`)
        }
        if (
          !descriptor
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.enumerable !== true
          || !Object.hasOwn(descriptor, 'value')
        ) throw new TypeError(
          `${label} requires enumerable data properties only.`,
        )
        visit(descriptor.value, depth + 1)
      }
    } finally {
      active.delete(object)
    }
  }
  visit(value, 0)
}
