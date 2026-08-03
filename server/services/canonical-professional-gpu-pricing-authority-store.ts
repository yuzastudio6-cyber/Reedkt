import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema,
  type CanonicalProfessionalGpuPlanApprovalPricingAuthority,
  type CanonicalProfessionalGpuPlanApprovalPricingAuthorityReadPort,
} from './canonical-professional-gpu-plan-approval-pricing-authority'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuPlanPricingAuthorityBundle,
  type CanonicalProfessionalGpuApprovedFundingObservation,
  type CanonicalProfessionalGpuPlanPricingAuthorityBundle,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_PRICING_AUTHORITY_STORE_VERSION =
  'canonical-professional-gpu-pricing-authority-store-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PRICING_REPOSITORY_RECORD_VERSION =
  'canonical-professional-gpu-pricing-repository-record-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PRICING_LOOKUP_VERSION =
  'canonical-professional-gpu-pricing-lookup-v1' as const

const DEFAULT_PREFIX = 'private/canonical-professional-gpu/v1/pricing'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(SAFE_ID)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const repositoryIdentitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PRICING_REPOSITORY_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_pricing_authority_store',
  ),
  workspaceId: safeId,
  snapshotId: safeId,
  workItemKey: safeId,
  publishedPlanRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
}).strict()

const lookupWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PRICING_LOOKUP_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_pricing_authority_store',
  ),
  evidenceClass: z.literal('create_only_exact_reread'),
  repositoryRecordRef: evidenceRefSchema,
  pricingAuthorityBundleRef: evidenceRefSchema,
  approvedFundingObservationRef: evidenceRefSchema,
  workspaceId: safeId,
  snapshotId: safeId,
  workItemKey: safeId,
  publishedPlanRef: evidenceRefSchema,
  publishedCustomerEstimateRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  pricingUnitRef: evidenceRefSchema,
  createOnlyBundlePersistenceVerified: z.literal(true),
  createOnlyLookupPersistenceVerified: z.literal(true),
  exactPostPersistenceReread: z.literal(true),
  browserOrCallerPricingArtifactAccepted: z.literal(false),
  callerRatePriceDurationOrRouteAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  persistedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPricingLookupSchema =
  lookupWithoutHashSchema.extend({ lookupHash: sha256 }).strict()
    .superRefine((lookup, context) => {
      const { lookupHash, ...payload } = lookup
      if (lookupHash !== sha256AuthorityValue(payload)) context.addIssue({
        code: 'custom',
        message: 'Professional GPU pricing lookup digest is invalid.',
      })
    })
export type CanonicalProfessionalGpuPricingLookup = z.infer<
  typeof canonicalProfessionalGpuPricingLookupSchema
>

export interface CanonicalProfessionalGpuPricingAuthorityStore
  extends CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
    CanonicalProfessionalGpuPlanApprovalPricingAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_PRICING_AUTHORITY_STORE_VERSION
  readonly evidenceClass: 'create_only_exact_reread_professional_gpu_pricing'
  persistPricingAuthority(input: {
    readonly bundle: CanonicalProfessionalGpuPlanPricingAuthorityBundle
    readonly approvedFunding:
      CanonicalProfessionalGpuApprovedFundingObservation
    readonly persistedAt: string
  }): Promise<CanonicalProfessionalGpuPricingLookup>
  persistPlanApprovalPricingAuthority(input: {
    readonly authority:
      CanonicalProfessionalGpuPlanApprovalPricingAuthority
  }): Promise<CanonicalProfessionalGpuPlanApprovalPricingAuthority>
  rereadLookup(input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
  }): Promise<CanonicalProfessionalGpuPricingLookup | null>
}

export function createCanonicalProfessionalGpuPricingRepositoryRecordRef(
  input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
    readonly publishedPlanRef: z.input<typeof evidenceRefSchema>
    readonly approvedWorkItemRef: z.input<typeof evidenceRefSchema>
  },
): z.infer<typeof evidenceRefSchema> {
  assertPlainSerializedData(input, 'gpu_pricing_repository_identity')
  const identity = repositoryIdentitySchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PRICING_REPOSITORY_RECORD_VERSION,
    source: 'canonical_server_professional_gpu_pricing_authority_store',
    workspaceId: input.workspaceId,
    snapshotId: input.snapshotId,
    workItemKey: input.workItemKey,
    publishedPlanRef: input.publishedPlanRef,
    approvedWorkItemRef: input.approvedWorkItemRef,
  })
  return evidenceRefSchema.parse({
    id: `gpu-pricing:${input.snapshotId}:${input.workItemKey}`,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(identity)}`,
  })
}

/**
 * Durable plan/snapshot/work lookup for the exact customer-visible GPU price
 * calculation. The bundle and lookup are immutable. Dispatch rereads both;
 * a caller cannot supply a price, route, duration, release, or record ref.
 */
export function createCanonicalProfessionalGpuPricingAuthorityStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalProfessionalGpuPricingAuthorityStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const store: CanonicalProfessionalGpuPricingAuthorityStore = {
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_PRICING_AUTHORITY_STORE_VERSION,
    evidenceClass: 'create_only_exact_reread_professional_gpu_pricing',

    async persistPlanApprovalPricingAuthority(value: {
      readonly authority:
        CanonicalProfessionalGpuPlanApprovalPricingAuthority
    }) {
      assertPlainSerializedData(value, 'gpu_plan_approval_pricing_input')
      const { authority } = value
      assertPlainSerializedData(
        authority,
        'gpu_plan_approval_pricing_authority',
      )
      const parsed = canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema
        .parse(authority)
      const path = planApprovalRecordPath(prefix, {
        workspaceId: parsed.workspaceId,
        editPlanId: parsed.editPlanId,
      })
      await createAndVerify({
        port: input.objectPort,
        path,
        record: parsed,
        parse: (untrusted) =>
          canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema.parse(
            untrusted,
          ),
      })
      return parsed
    },

    rereadPublishedPlanPricingAuthority(lookup: {
      readonly workspaceId: string
      readonly editPlanId: string
      readonly at: string
    }) {
      assertPlainSerializedData(lookup, 'gpu_plan_approval_pricing_lookup')
      const scope = z.object({
        workspaceId: safeId,
        editPlanId: safeId,
        at: timestamp,
      }).strict().parse(lookup)
      return readValidated({
        port: input.objectPort,
        path: planApprovalRecordPath(prefix, scope),
        parse: (untrusted) => {
          const authority =
            canonicalProfessionalGpuPlanApprovalPricingAuthoritySchema.parse(
              untrusted,
            )
          if (
            authority.workspaceId !== scope.workspaceId
            || authority.editPlanId !== scope.editPlanId
            || Date.parse(authority.sealedAt) > Date.parse(scope.at)
          ) throw new Error('GPU plan approval pricing lookup scope changed.')
          return authority
        },
      })
    },

    async persistPricingAuthority(value: {
      readonly bundle: CanonicalProfessionalGpuPlanPricingAuthorityBundle
      readonly approvedFunding:
        CanonicalProfessionalGpuApprovedFundingObservation
      readonly persistedAt: string
    }) {
      assertPlainSerializedData(value, 'gpu_pricing_authority_persistence')
      const bundle = assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
        value.bundle,
        value.persistedAt,
      )
      const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
        value.approvedFunding,
        value.persistedAt,
      )
      const entry = bundle.dispatchEstimateSet.entries.find((candidate) =>
        candidate.workItemKey === funding.approvedWorkItem.workItemKey)
      if (!entry) {
        throw new Error('Professional GPU pricing work item is not priced.')
      }
      const expectedRepositoryRef =
        createCanonicalProfessionalGpuPricingRepositoryRecordRef({
          workspaceId: funding.scope.workspaceId,
          snapshotId: funding.approvedSnapshotRef.id,
          workItemKey: funding.approvedWorkItem.workItemKey,
          publishedPlanRef: funding.publishedPlanRef,
          approvedWorkItemRef:
            funding.approvedWorkItem.approvedWorkItemRef,
        })
      if (
        !sameRef(bundle.repositoryRecordRef, expectedRepositoryRef)
        || !sameRef(
          bundle.publicationBinding.publishedPlanRef,
          funding.publishedPlanRef,
        )
        || !sameRef(
          bundle.publicationBinding.publishedCustomerEstimateRef,
          funding.publishedCustomerEstimateRef,
        )
        || !sameRef(entry.approvedWorkItemRef,
          funding.approvedWorkItem.approvedWorkItemRef)
        || bundle.pricingBasis.scope.workspaceId !== funding.scope.workspaceId
        || bundle.pricingBasis.scope.projectId !== funding.scope.projectId
        || bundle.pricingBasis.scope.editSessionId !==
          funding.scope.editSessionId
        || bundle.pricingBasis.scope.planningRequestId !==
          funding.scope.planningRequestId
        || bundle.pricingBasis.scope.outputId !== funding.scope.outputId
      ) throw new Error(
        'Professional GPU pricing bundle lost approved plan lineage.',
      )

      const lookupPayload = lookupWithoutHashSchema.parse({
        schemaVersion: CANONICAL_PROFESSIONAL_GPU_PRICING_LOOKUP_VERSION,
        source: 'canonical_server_professional_gpu_pricing_authority_store',
        evidenceClass: 'create_only_exact_reread',
        repositoryRecordRef: expectedRepositoryRef,
        pricingAuthorityBundleRef: ref(bundle.bundleId, bundle.bundleHash),
        approvedFundingObservationRef: ref(
          funding.observationId,
          funding.observationHash,
        ),
        workspaceId: funding.scope.workspaceId,
        snapshotId: funding.approvedSnapshotRef.id,
        workItemKey: funding.approvedWorkItem.workItemKey,
        publishedPlanRef: funding.publishedPlanRef,
        publishedCustomerEstimateRef:
          funding.publishedCustomerEstimateRef,
        approvedSnapshotRef: funding.approvedSnapshotRef,
        approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
        pricingUnitRef: entry.pricingUnitRef,
        createOnlyBundlePersistenceVerified: true,
        createOnlyLookupPersistenceVerified: true,
        exactPostPersistenceReread: true,
        browserOrCallerPricingArtifactAccepted: false,
        callerRatePriceDurationOrRouteAccepted: false,
        cpuOnlySubstantiveExecutionAllowed: false,
        persistedAt: value.persistedAt,
      })
      const lookup = canonicalProfessionalGpuPricingLookupSchema.parse({
        ...lookupPayload,
        lookupHash: sha256AuthorityValue(lookupPayload),
      })
      const bundlePath = recordPath(prefix, 'bundles', bundle.bundleId)
      const lookupPath = lookupRecordPath(prefix, {
        workspaceId: lookup.workspaceId,
        snapshotId: lookup.snapshotId,
        workItemKey: lookup.workItemKey,
      })
      await createAndVerify({
        port: input.objectPort,
        path: bundlePath,
        record: bundle,
        parse: (untrusted) =>
          assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
            untrusted,
            value.persistedAt,
          ),
      })
      await createAndVerify({
        port: input.objectPort,
        path: lookupPath,
        record: lookup,
        parse: assertLookup,
      })
      return lookup
    },

    async rereadPrivatePricingAuthority(lookup: {
      readonly workspaceId: string
      readonly snapshotId: string
      readonly workItemKey: string
      readonly at: string
    }) {
      assertPlainSerializedData(lookup, 'gpu_private_pricing_lookup')
      const index = await readLookup(input.objectPort, prefix, {
        workspaceId: lookup.workspaceId,
        snapshotId: lookup.snapshotId,
        workItemKey: lookup.workItemKey,
      })
      if (!index) return null
      if (Date.parse(lookup.at) < Date.parse(index.persistedAt)) {
        throw new Error('Professional GPU pricing lookup is from the future.')
      }
      const bundle = await readValidated({
        port: input.objectPort,
        path: recordPath(
          prefix,
          'bundles',
          index.pricingAuthorityBundleRef.id,
        ),
        parse: (untrusted) =>
          assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
            untrusted,
            lookup.at,
          ),
      })
      if (!bundle
        || bundle.bundleHash !==
          index.pricingAuthorityBundleRef.contentHash.slice(7)
        || !sameRef(bundle.repositoryRecordRef, index.repositoryRecordRef)
        || !sameRef(bundle.publicationBinding.publishedPlanRef,
          index.publishedPlanRef)
        || !sameRef(
          bundle.publicationBinding.publishedCustomerEstimateRef,
          index.publishedCustomerEstimateRef,
        )
        || !bundle.dispatchEstimateSet.entries.some((entry) =>
          entry.workItemKey === index.workItemKey
          && sameRef(entry.approvedWorkItemRef, index.approvedWorkItemRef)
          && sameRef(entry.pricingUnitRef, index.pricingUnitRef))) {
        throw new Error('Professional GPU pricing exact reread changed.')
      }
      return bundle
    },

    rereadLookup(lookup: {
      readonly workspaceId: string
      readonly snapshotId: string
      readonly workItemKey: string
    }) {
      return readLookup(input.objectPort, prefix, lookup)
    },
  }
  return Object.freeze(store)
}

async function readLookup(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
  },
): Promise<CanonicalProfessionalGpuPricingLookup | null> {
  assertPlainSerializedData(input, 'gpu_pricing_lookup')
  const scope = z.object({
    workspaceId: safeId,
    snapshotId: safeId,
    workItemKey: safeId,
  }).strict().parse(input)
  const lookup = await readValidated({
    port,
    path: lookupRecordPath(prefix, scope),
    parse: assertLookup,
  })
  if (lookup && (
    lookup.workspaceId !== scope.workspaceId
    || lookup.snapshotId !== scope.snapshotId
    || lookup.workItemKey !== scope.workItemKey
  )) throw new Error('Professional GPU pricing lookup scope changed.')
  return lookup
}

async function createAndVerify<T>(input: {
  readonly port: CanonicalCreateOnlyJsonObjectPort
  readonly path: string
  readonly record: T
  readonly parse: (value: unknown) => T
}): Promise<void> {
  const body = serialize(input.record)
  await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: sha256Buffer(body),
  })
  const reread = await readValidated({
    port: input.port,
    path: input.path,
    parse: input.parse,
  })
  if (!reread || stableAuthorityStringify(reread) !==
      stableAuthorityStringify(input.record)) {
    throw new Error('Professional GPU pricing create-only reread changed.')
  }
}

async function readValidated<T>(input: {
  readonly port: CanonicalCreateOnlyJsonObjectPort
  readonly path: string
  readonly parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Professional GPU pricing record size is invalid.')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Professional GPU pricing record JSON is invalid.')
  }
  return input.parse(untrusted)
}

function assertLookup(value: unknown): CanonicalProfessionalGpuPricingLookup {
  return canonicalProfessionalGpuPricingLookupSchema.parse(value)
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Professional GPU pricing record size is invalid.')
  }
  return body
}

function lookupRecordPath(
  prefix: string,
  input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
  },
): string {
  const scope = `${input.workspaceId}:${input.snapshotId}:${input.workItemKey}`
  return `${prefix}/lookups/${sha256Buffer(Buffer.from(scope, 'utf8'))}.json`
}

function planApprovalRecordPath(
  prefix: string,
  input: {
    readonly workspaceId: string
    readonly editPlanId: string
  },
): string {
  const scope = `${input.workspaceId}:${input.editPlanId}`
  return `${prefix}/plan-approval/${
    sha256Buffer(Buffer.from(scope, 'utf8'))
  }.json`
}

function recordPath(prefix: string, kind: string, id: string): string {
  requireSafeId(id)
  return `${prefix}/${kind}/${sha256Buffer(Buffer.from(id, 'utf8'))}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw new Error('Professional GPU pricing store prefix is invalid.')
  return normalized
}

function requireSafeId(value: string): void {
  if (!SAFE_ID.test(value) || value.includes('..')) {
    throw new Error('Professional GPU pricing record ID is invalid.')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Professional GPU pricing object port is unavailable.')
  }
}

function ref(id: string, digest: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest}` as const,
  }
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sha256Buffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertPlainSerializedData(value: unknown, label: string): void {
  const active = new WeakSet<object>()
  let visitedNodes = 0
  const visit = (item: unknown, path: string, depth: number): void => {
    if (depth > 72) throw new Error(`${path} nesting is too deep.`)
    if (item === null || typeof item === 'string'
      || typeof item === 'boolean') return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) throw new Error(`${path} is non-finite.`)
      return
    }
    if (typeof item !== 'object') {
      throw new Error(`${path} is not serialized plain data.`)
    }
    visitedNodes += 1
    if (visitedNodes > 75_000) {
      throw new Error(`${label} exceeds structural bounds.`)
    }
    if (active.has(item)) throw new Error(`${path} contains a cycle.`)
    let prototype: object | null
    let keys: readonly PropertyKey[]
    try {
      prototype = Object.getPrototypeOf(item)
      keys = Reflect.ownKeys(item)
    } catch {
      throw new Error(`${path} cannot be inspected.`)
    }
    if (
      !Array.isArray(item)
      && prototype !== Object.prototype
      && prototype !== null
    ) throw new Error(`${path} has a non-plain prototype.`)
    if (keys.length > 2_048) throw new Error(`${path} has too many keys.`)
    if (keys.some((key) => typeof key !== 'string')) {
      throw new Error(`${path} has a symbol key.`)
    }
    active.add(item)
    try {
      for (const key of keys as readonly string[]) {
        if (Array.isArray(item) && key === 'length') continue
        let descriptor: PropertyDescriptor | undefined
        try {
          descriptor = Object.getOwnPropertyDescriptor(item, key)
        } catch {
          throw new Error(`${path}.${key} cannot be inspected.`)
        }
        if (
          !descriptor
          || !Object.hasOwn(descriptor, 'value')
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.enumerable !== true
        ) throw new Error(`${path}.${key} has an accessor or hidden value.`)
        visit(descriptor.value, `${path}.${key}`, depth + 1)
      }
    } finally {
      active.delete(item)
    }
  }
  visit(value, label, 0)
}
