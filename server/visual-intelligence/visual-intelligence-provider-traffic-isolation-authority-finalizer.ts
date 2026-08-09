import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  parseVisualIntelligenceModelBillingContextEvidence,
  createControlledVisualIntelligenceProviderTrafficIsolationAuthority,
  parseVisualIntelligenceProviderTrafficIsolationAuthority,
  visualIntelligenceModelBillingContextEvidenceRef,
  visualIntelligenceProviderTrafficIsolationAuthorityRef,
  type VisualIntelligenceModelBillingContextEvidence,
  type VisualIntelligenceModelBillingContextEvidenceReadPort,
  type VisualIntelligenceProviderTrafficIsolationAuthority,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef,
  type VisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
  type VisualIntelligenceProviderAuditWindowObservationRepository,
} from './visual-intelligence-provider-audit-window-observation-repository'
import {
  parseVisualIntelligenceProviderAuditWindowObservation,
  visualIntelligenceProviderAuditWindowObservationRef,
} from './visual-intelligence-provider-audit-window-read-port'
import {
  parseVisualIntelligenceProviderTrafficGuardReleaseReceipt,
  visualIntelligenceProviderTrafficGuardReleaseReceiptRef,
  type VisualIntelligenceProviderTrafficGuardEvidenceReadPort,
} from './visual-intelligence-provider-traffic-guard'

export const VISUAL_INTELLIGENCE_CANONICAL_PROVIDER_ROUTE_REGISTRY_VERSION =
  'visual-intelligence-canonical-provider-route-registry-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZER_VERSION =
  'visual-intelligence-provider-traffic-isolation-authority-finalizer-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZATION_RESULT_VERSION =
  'visual-intelligence-provider-traffic-isolation-authority-finalization-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const routeSchema = z.object({
  routeClass: z.enum([
    'ordinary_visual_intelligence_request',
    'model_billing_sku_qualification',
  ]),
  ownerVersion: z.enum([
    'visual-intelligence-production-runtime-v19',
    'visual-intelligence-model-billing-sku-live-executor-v1',
  ]),
  providerAdapterVersion:
    z.literal('vertex-gemini-pro-visual-intelligence-adapter-v4'),
  providerTrafficGuardVersion:
    z.literal('visual-intelligence-provider-traffic-guard-v1'),
  providerTrafficGuardRequiredBeforeEveryProviderCall: z.literal(true),
  directProviderCallOutsideGuardAllowed: z.literal(false),
}).strict()

const routeRegistryWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_CANONICAL_PROVIDER_ROUTE_REGISTRY_VERSION,
  ),
  registryId: safeId,
  registryVersion: positiveInteger,
  evidenceClass: z.literal(
    'exact_shared_visual_intelligence_provider_route_and_guard_registry',
  ),
  projectId: z.literal('reeditpro'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  routes: z.array(routeSchema).length(2),
  allCanonicalProviderRoutesEnumerated: z.literal(true),
  allCanonicalProviderRoutesUseOneSharedGuard: z.literal(true),
  nonCanonicalProviderCredentialMountPresent: z.literal(false),
  exactSourceAndDeploymentBindingsReread: z.literal(true),
  callerAuthoredRouteClaimAccepted: z.literal(false),
  providerCallMadeByRegistryReader: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const expected = [
    'ordinary_visual_intelligence_request',
    'model_billing_sku_qualification',
  ]
  if (
    visualIntelligenceCanonicalJson(value.routes.map((route) =>
      route.routeClass)) !== visualIntelligenceCanonicalJson(expected)
    || value.routes[0]?.ownerVersion
      !== 'visual-intelligence-production-runtime-v19'
    || value.routes[1]?.ownerVersion
      !== 'visual-intelligence-model-billing-sku-live-executor-v1'
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider route registry is not exact.',
  })
})

const routeRegistrySchema = routeRegistryWithoutDigestSchema.extend({
  registryDigestSha256: prefixedSha256,
}).strict()

const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZATION_RESULT_VERSION,
  ),
  finalizerVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZER_VERSION,
  ),
  resultId: safeId,
  resultVersion: positiveInteger,
  evidenceClass: z.literal(
    'canonical_exact_reread_provider_traffic_isolation_finalization',
  ),
  isolationAuthorityRef: evidenceRefSchema,
  standardContextEvidenceRef: evidenceRefSchema,
  longContextEvidenceRef: evidenceRefSchema,
  providerGuardReleaseReceiptRef: evidenceRefSchema,
  cloudAuditWindowObservationRef: evidenceRefSchema,
  cloudAuditWindowObservationPublicationReceiptRef: evidenceRefSchema,
  canonicalProviderRouteRegistryRef: evidenceRefSchema,
  isolationAuthorityPersistenceReceiptRef: evidenceRefSchema,
  exactContextEvidenceReread: z.literal(true),
  exactProviderGuardReleaseReceiptReread: z.literal(true),
  exactCloudAuditObservationReread: z.literal(true),
  exactProviderRouteRegistryReread: z.literal(true),
  exactIsolationAuthorityCreateOnlyPersistedAndReread: z.literal(true),
  noOtherModelOrSkuTrafficVerified: z.literal(true),
  providerCallMadeByFinalizer: z.literal(false),
  cloudAuditQueriedByFinalizer: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict()

const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceCanonicalProviderRouteRegistry =
  z.infer<typeof routeRegistrySchema>
export type VisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult =
  z.infer<typeof resultSchema>

export interface VisualIntelligenceCanonicalProviderRouteRegistryReadPort {
  readExact(
    registryRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceCanonicalProviderRouteRegistry | null>
}

export interface VisualIntelligenceProviderTrafficIsolationAuthorityRepository {
  persistCreateOnly(
    authority: VisualIntelligenceProviderTrafficIsolationAuthority,
  ): Promise<{
    readonly authorityRef: VisualIntelligenceEvidenceRef
    readonly persistenceReceiptRef: VisualIntelligenceEvidenceRef
    readonly createOnlyPersisted: true
    readonly exactRereadVerified: true
  }>
  readExact(
    authorityRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceProviderTrafficIsolationAuthority | null>
}

export function createControlledVisualIntelligenceCanonicalProviderRouteRegistry(
  input: z.input<typeof routeRegistryWithoutDigestSchema>,
): VisualIntelligenceCanonicalProviderRouteRegistry {
  const payload = routeRegistryWithoutDigestSchema.parse(input)
  return Object.freeze(routeRegistrySchema.parse({
    ...payload,
    registryDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceCanonicalProviderRouteRegistry(
  value: unknown,
): VisualIntelligenceCanonicalProviderRouteRegistry {
  const registry = routeRegistrySchema.parse(value)
  const payload = { ...registry }
  Reflect.deleteProperty(payload, 'registryDigestSha256')
  if (registry.registryDigestSha256
    !== visualIntelligenceDigest(payload)) throw new Error(
    'Visual Intelligence provider route registry digest is invalid.',
  )
  return Object.freeze(registry)
}

export function visualIntelligenceCanonicalProviderRouteRegistryRef(
  value: VisualIntelligenceCanonicalProviderRouteRegistry,
): VisualIntelligenceEvidenceRef {
  const registry = parseVisualIntelligenceCanonicalProviderRouteRegistry(value)
  return Object.freeze({
    id: registry.registryId,
    version: registry.registryVersion,
    contentHash: registry.registryDigestSha256,
  })
}

export function parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult(
  value: unknown,
): VisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult {
  const result = resultSchema.parse(value)
  const payload = { ...result }
  Reflect.deleteProperty(payload, 'resultDigestSha256')
  if (result.resultDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence provider isolation finalization result is invalid.',
    )
  }
  return Object.freeze(result)
}

export function createVisualIntelligenceProviderTrafficIsolationAuthorityFinalizer(
  dependencies: {
    readonly contextEvidenceReadPort:
      VisualIntelligenceModelBillingContextEvidenceReadPort
    readonly providerGuardEvidenceReadPort:
      VisualIntelligenceProviderTrafficGuardEvidenceReadPort
    readonly auditObservationRepository:
      VisualIntelligenceProviderAuditWindowObservationRepository
    readonly routeRegistryReadPort:
      VisualIntelligenceCanonicalProviderRouteRegistryReadPort
    readonly isolationAuthorityRepository:
      VisualIntelligenceProviderTrafficIsolationAuthorityRepository
  },
) {
  validateDependencies(dependencies)
  return Object.freeze({
    async finalize(untrusted: {
      readonly authorityId: string
      readonly authorityVersion: number
      readonly qualificationOwnerId: string
      readonly standardContextEvidenceRef: VisualIntelligenceEvidenceRef
      readonly longContextEvidenceRef: VisualIntelligenceEvidenceRef
      readonly providerGuardReleaseReceiptRef: VisualIntelligenceEvidenceRef
      readonly cloudAuditWindowObservationPublicationReceipt:
        VisualIntelligenceProviderAuditWindowObservationPublicationReceipt
      readonly cloudAuditWindowObservationPublicationReceiptRef:
        VisualIntelligenceEvidenceRef
      readonly canonicalProviderRouteRegistryRef:
        VisualIntelligenceEvidenceRef
    }): Promise<
      VisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult
    > {
      const input = parseFinalizationInput(untrusted)
      const [standardRaw, longRaw, guardReleaseRaw, auditRaw, registryRaw] =
        await Promise.all([
          dependencies.contextEvidenceReadPort.readExact(
            input.standardContextEvidenceRef,
          ),
          dependencies.contextEvidenceReadPort.readExact(
            input.longContextEvidenceRef,
          ),
          dependencies.providerGuardEvidenceReadPort.readExactReleaseReceipt(
            input.providerGuardReleaseReceiptRef,
          ),
          dependencies.auditObservationRepository.readExact(
            input.cloudAuditWindowObservationPublicationReceipt,
          ),
          dependencies.routeRegistryReadPort.readExact(
            input.canonicalProviderRouteRegistryRef,
          ),
        ])
      if (!standardRaw || !longRaw || !guardReleaseRaw || !registryRaw) {
        throw new Error(
          'Visual Intelligence provider isolation evidence is missing.',
        )
      }
      const standard =
        parseVisualIntelligenceModelBillingContextEvidence(standardRaw)
      const long =
        parseVisualIntelligenceModelBillingContextEvidence(longRaw)
      const guardRelease =
        parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(
          guardReleaseRaw,
        )
      const audit = parseVisualIntelligenceProviderAuditWindowObservation(
        auditRaw,
      )
      const registry = parseVisualIntelligenceCanonicalProviderRouteRegistry(
        registryRaw,
      )
      validateLineage({ input, standard, long, guardRelease, audit, registry })
      const authority =
        createControlledVisualIntelligenceProviderTrafficIsolationAuthority({
          schemaVersion:
            'visual-intelligence-provider-traffic-isolation-authority-v1',
          authorityId: input.authorityId,
          authorityVersion: input.authorityVersion,
          evidenceClass:
            'exclusive_provider_guard_plus_exact_cloud_audit_window_reread',
          projectId: 'reeditpro',
          providerServiceId: 'services/C7E2-9256-1C43',
          exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
          vertexLocation: 'global',
          throughputClass: 'standard',
          qualificationWindowStartedAtIso: guardRelease.acquiredAtIso,
          qualificationWindowFinishedAtIso: guardRelease.releasedAtIso,
          standardContextEvidenceRef: input.standardContextEvidenceRef,
          longContextEvidenceRef: input.longContextEvidenceRef,
          exactOrderedProviderRequestRefs:
            audit.exactOrderedProviderRequestRefs,
          providerGuardLeaseRef: guardRelease.leaseRef,
          providerGuardReleaseReceiptRef:
            input.providerGuardReleaseReceiptRef,
          cloudAuditWindowObservationRef:
            visualIntelligenceProviderAuditWindowObservationRef(audit),
          canonicalProviderRouteRegistryRef:
            input.canonicalProviderRouteRegistryRef,
          observedProviderRequestCount: 4,
          guardHeldForWholeQualificationWindow: true,
          allCanonicalVisualIntelligenceProviderRoutesRequireGuard: true,
          nonCanonicalDirectProviderRouteAllowedByServiceAccount: false,
          exactCloudAuditWindowReread: true,
          sameSkuConcurrentTrafficObserved: false,
          noOtherModelOrSkuTrafficInObservationWindow: true,
          callerAuthoredIsolationClaimAccepted: false,
          providerCallMadeByAuthorityReader: false,
          providerDispatchAuthorityGranted: false,
          customerPricingOrServiceFeeAuthorityGranted: false,
          walletOrCreditMutationAuthorityGranted: false,
          productionReleaseAuthorityGranted: false,
        })
      const persisted = await dependencies.isolationAuthorityRepository
        .persistCreateOnly(authority)
      const authorityRef =
        visualIntelligenceProviderTrafficIsolationAuthorityRef(authority)
      if (
        persisted.createOnlyPersisted !== true
        || persisted.exactRereadVerified !== true
        || !sameRef(persisted.authorityRef, authorityRef)
      ) throw new Error(
        'Visual Intelligence provider isolation persistence was not reconciled.',
      )
      const reread = await dependencies.isolationAuthorityRepository.readExact(
        persisted.authorityRef,
      )
      if (
        !reread
        || visualIntelligenceCanonicalJson(
          parseVisualIntelligenceProviderTrafficIsolationAuthority(reread),
        ) !== visualIntelligenceCanonicalJson(authority)
      ) throw new Error(
        'Visual Intelligence provider isolation exact reread failed.',
      )
      const payload = resultWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZATION_RESULT_VERSION,
        finalizerVersion:
          VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_FINALIZER_VERSION,
        resultId: `${input.authorityId}.finalization`,
        resultVersion: input.authorityVersion,
        evidenceClass:
          'canonical_exact_reread_provider_traffic_isolation_finalization',
        isolationAuthorityRef: authorityRef,
        standardContextEvidenceRef: input.standardContextEvidenceRef,
        longContextEvidenceRef: input.longContextEvidenceRef,
        providerGuardReleaseReceiptRef:
          input.providerGuardReleaseReceiptRef,
        cloudAuditWindowObservationRef:
          visualIntelligenceProviderAuditWindowObservationRef(audit),
        cloudAuditWindowObservationPublicationReceiptRef:
          input.cloudAuditWindowObservationPublicationReceiptRef,
        canonicalProviderRouteRegistryRef:
          input.canonicalProviderRouteRegistryRef,
        isolationAuthorityPersistenceReceiptRef:
          persisted.persistenceReceiptRef,
        exactContextEvidenceReread: true,
        exactProviderGuardReleaseReceiptReread: true,
        exactCloudAuditObservationReread: true,
        exactProviderRouteRegistryReread: true,
        exactIsolationAuthorityCreateOnlyPersistedAndReread: true,
        noOtherModelOrSkuTrafficVerified: true,
        providerCallMadeByFinalizer: false,
        cloudAuditQueriedByFinalizer: false,
        providerDispatchAuthorityGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        walletOrCreditMutationAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(resultSchema.parse({
        ...payload,
        resultDigestSha256: visualIntelligenceDigest(payload),
      }))
    },
  })
}

function parseFinalizationInput(value: unknown) {
  return z.object({
    authorityId: safeId,
    authorityVersion: positiveInteger,
    qualificationOwnerId: safeId,
    standardContextEvidenceRef: evidenceRefSchema,
    longContextEvidenceRef: evidenceRefSchema,
    providerGuardReleaseReceiptRef: evidenceRefSchema,
    cloudAuditWindowObservationPublicationReceipt: z.unknown(),
    cloudAuditWindowObservationPublicationReceiptRef: evidenceRefSchema,
    canonicalProviderRouteRegistryRef: evidenceRefSchema,
  }).strict().transform((input) => ({
    ...input,
    cloudAuditWindowObservationPublicationReceipt:
      parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
        input.cloudAuditWindowObservationPublicationReceipt,
      ),
  })).parse(value)
}

function validateLineage(input: {
  input: ReturnType<typeof parseFinalizationInput>
  standard: VisualIntelligenceModelBillingContextEvidence
  long: VisualIntelligenceModelBillingContextEvidence
  guardRelease: NonNullable<Awaited<ReturnType<
    VisualIntelligenceProviderTrafficGuardEvidenceReadPort[
      'readExactReleaseReceipt'
    ]>>>
  audit: Awaited<ReturnType<
    VisualIntelligenceProviderAuditWindowObservationRepository['readExact']
  >>
  registry: VisualIntelligenceCanonicalProviderRouteRegistry
}): void {
  const { standard, long, guardRelease, audit, registry } = input
  const orderedRequestRefs = [
    standard.warmupProviderRequestRef,
    standard.measuredProviderRequestRef,
    long.warmupProviderRequestRef,
    long.measuredProviderRequestRef,
  ]
  const contextWithinGuard = (evidence: typeof standard) =>
    Date.parse(evidence.qualificationWindowStartedAtIso)
      >= Date.parse(guardRelease.acquiredAtIso)
    && Date.parse(evidence.qualificationWindowFinishedAtIso)
      <= Date.parse(guardRelease.releasedAtIso)
  if (
    standard.contextClass !== 'standard_le_200k'
    || long.contextClass !== 'long_gt_200k'
    || !sameRef(
      visualIntelligenceModelBillingContextEvidenceRef(standard),
      input.input.standardContextEvidenceRef,
    )
    || !sameRef(
      visualIntelligenceModelBillingContextEvidenceRef(long),
      input.input.longContextEvidenceRef,
    )
    || guardRelease.mode !== 'model_billing_sku_qualification'
    || guardRelease.ownerId !== input.input.qualificationOwnerId
    || !sameRef(
      visualIntelligenceProviderTrafficGuardReleaseReceiptRef(guardRelease),
      input.input.providerGuardReleaseReceiptRef,
    )
    || !contextWithinGuard(standard)
    || !contextWithinGuard(long)
    || Date.parse(standard.qualificationWindowFinishedAtIso)
      > Date.parse(long.qualificationWindowStartedAtIso)
    || audit.qualificationWindowStartedAtIso !== guardRelease.acquiredAtIso
    || audit.qualificationWindowFinishedAtIso !== guardRelease.releasedAtIso
    || visualIntelligenceCanonicalJson(audit.exactOrderedProviderRequestRefs)
      !== visualIntelligenceCanonicalJson(orderedRequestRefs)
    || audit.observedProviderRequestCount !== 4
    || audit.noUnexpectedProviderRequestObserved !== true
    || audit.noOtherModelOrSkuTrafficInObservationWindow !== true
    || !sameRef(
      visualIntelligenceProviderAuditWindowObservationRef(audit),
      input.input.cloudAuditWindowObservationPublicationReceipt.observationRef,
    )
    || !sameRef(
      visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef(
        input.input.cloudAuditWindowObservationPublicationReceipt,
      ),
      input.input.cloudAuditWindowObservationPublicationReceiptRef,
    )
    || !sameRef(
      visualIntelligenceCanonicalProviderRouteRegistryRef(registry),
      input.input.canonicalProviderRouteRegistryRef,
    )
    || registry.allCanonicalProviderRoutesEnumerated !== true
    || registry.allCanonicalProviderRoutesUseOneSharedGuard !== true
    || registry.nonCanonicalProviderCredentialMountPresent !== false
    || registry.routes.some((route) =>
      route.providerTrafficGuardRequiredBeforeEveryProviderCall !== true
      || route.directProviderCallOutsideGuardAllowed !== false)
  ) throw new Error(
    'Visual Intelligence provider isolation lineage is inconsistent.',
  )
}

function validateDependencies(dependencies: {
  contextEvidenceReadPort: VisualIntelligenceModelBillingContextEvidenceReadPort
  providerGuardEvidenceReadPort:
    VisualIntelligenceProviderTrafficGuardEvidenceReadPort
  auditObservationRepository:
    VisualIntelligenceProviderAuditWindowObservationRepository
  routeRegistryReadPort:
    VisualIntelligenceCanonicalProviderRouteRegistryReadPort
  isolationAuthorityRepository:
    VisualIntelligenceProviderTrafficIsolationAuthorityRepository
}): void {
  if (
    typeof dependencies.contextEvidenceReadPort?.readExact !== 'function'
    || typeof dependencies.providerGuardEvidenceReadPort
      ?.readExactReleaseReceipt !== 'function'
    || typeof dependencies.auditObservationRepository?.readExact !== 'function'
    || typeof dependencies.routeRegistryReadPort?.readExact !== 'function'
    || typeof dependencies.isolationAuthorityRepository
      ?.persistCreateOnly !== 'function'
    || typeof dependencies.isolationAuthorityRepository?.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence provider isolation finalizer is not configured.',
  )
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

export function visualIntelligenceCanonicalProviderRouteRegistryReceiptRef(
  value: VisualIntelligenceCanonicalProviderRouteRegistry,
): VisualIntelligenceEvidenceRef {
  const registry = parseVisualIntelligenceCanonicalProviderRouteRegistry(value)
  return createVisualIntelligenceEvidenceRef(
    `${registry.registryId}.receipt`,
    registry,
    registry.registryVersion,
  )
}
