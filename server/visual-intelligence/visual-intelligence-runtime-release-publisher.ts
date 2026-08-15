import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_QUALITY_PROFILE,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROFILE_REGISTRY_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from './visual-intelligence-profile-registry'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from './visual-intelligence-private-object-read-port'
import {
  VISUAL_INTELLIGENCE_RUNTIME_RELEASE_VERSION,
  compileVisualIntelligenceRuntimeReleaseForPublication,
  parseVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
} from './visual-intelligence-runtime-release'
import {
  VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION,
  VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
} from './vertex-gemini-pro-visual-intelligence-adapter'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENT_VERSION =
  'visual-intelligence-runtime-qualification-component-v2' as const
export const VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLISHER_VERSION =
  'visual-intelligence-runtime-release-publisher-v2' as const
export const VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION =
  'visual-intelligence-runtime-release-publication-receipt-v2' as const

const PROJECT_ID = 'reeditpro' as const
const RELEASE_PREFIX =
  'private/visual-intelligence/releases/gemini-pro-high/v2/' as const
const QUALIFICATION_PREFIX =
  'private/visual-intelligence/qualifications/runtime-release/v2/' as const
const MAXIMUM_COMPONENT_BYTES = 512 * 1024
const MAXIMUM_RELEASE_BYTES = 512 * 1024
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generationSchema = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

export const VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS = [
  'lifecycle_repository_release',
  'concurrency_owner_release',
  'source_evidence_preparation_release',
  'provider_model_access_qualification',
  'provider_transport_qualification',
  'provider_privacy_retention_review',
  'prompt_injection_safety_qualification',
  'structured_output_qualification',
  'professional_high_quality_benchmark',
  'account_effective_pricing_authority',
  'account_effective_cost_settlement_owner',
] as const

const componentNameSchema = z.enum(
  VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS,
)

const coordinateSchema = z.object({
  component: componentNameSchema,
  bucketName: bucketNameSchema,
  objectName: z.string().startsWith(QUALIFICATION_PREFIX).endsWith('.json')
    .max(1_024),
  generation: generationSchema,
  etag: z.string().min(1).max(512),
  contentSha256: rawSha256,
}).strict().superRefine((value, context) => {
  if (
    value.objectName.includes('..')
    || value.objectName.includes('\\')
    || value.objectName.includes('//')
    || !value.objectName.includes(`/${value.component}/`)
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence qualification coordinate is invalid.',
  })
})

export type VisualIntelligenceRuntimeQualificationCoordinate = z.infer<
  typeof coordinateSchema
>

const componentWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENT_VERSION,
  ),
  source: z.literal(
    'canonical_server_visual_intelligence_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  component: componentNameSchema,
  projectId: z.literal(PROJECT_ID),
  vertexLocation: z.literal('global'),
  capabilityId: z.literal(VISUAL_INTELLIGENCE_CAPABILITY_ID),
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  qualityProfile: z.literal(VISUAL_INTELLIGENCE_QUALITY_PROFILE),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  qualificationRef: evidenceRefSchema,
  dependencyRefs: z.array(evidenceRefSchema).min(1).max(32),
  observedAtIso: timestamp,
  expiresAtIso: timestamp,
  exactCanonicalEvidenceReread: z.literal(true),
  qualificationPassed: z.literal(true),
  callerQualificationClaimAccepted: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const refs = [value.qualificationRef, ...value.dependencyRefs]
    .map(refKey)
  const observed = Date.parse(value.observedAtIso)
  const expires = Date.parse(value.expiresAtIso)
  if (
    new Set(refs).size !== refs.length
    || expires <= observed
    || expires - observed > 31 * 86_400_000
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence qualification component is not exact.',
  })
})

const componentSchema = componentWithoutDigestSchema.extend({
  componentDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceRuntimeQualificationComponent = z.infer<
  typeof componentSchema
>

const receiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLISHER_VERSION,
  ),
  evidenceClass: z.literal(
    'eleven_component_exact_reread_create_only_release_publication',
  ),
  projectId: z.literal(PROJECT_ID),
  bucketName: bucketNameSchema,
  objectName: z.string().startsWith(RELEASE_PREFIX).endsWith('.json')
    .max(1_024),
  generation: generationSchema,
  etag: z.string().min(1).max(512),
  contentType: z.literal('application/json'),
  byteLength: z.number().int().positive().max(MAXIMUM_RELEASE_BYTES),
  contentSha256: rawSha256,
  runtimeReleaseRef: evidenceRefSchema,
  qualificationComponentRefs: z.array(evidenceRefSchema)
    .length(VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS.length),
  disposition: z.enum(['created', 'already_exists_exact']),
  exactComponentSetCanonicalReread: z.literal(true),
  createOnlyPreconditionUsed: z.literal(true),
  exactGenerationEtagDigestAndCanonicalJsonReread: z.literal(true),
  providerOrModelExecuted: z.literal(false),
  gpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAtIso: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.objectName.includes('..')
    || value.objectName.includes('\\')
    || value.objectName.includes('//')
    || new Set(value.qualificationComponentRefs.map(refKey)).size
      !== value.qualificationComponentRefs.length
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence release receipt is invalid.',
  })
})

const receiptSchema = receiptWithoutDigestSchema.extend({
  receiptDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceRuntimeReleasePublicationReceipt = z.infer<
  typeof receiptSchema
>

/** Test-only fixture constructor. Production qualification owners persist it. */
export function createControlledVisualIntelligenceRuntimeQualificationComponent(
  input: z.input<typeof componentWithoutDigestSchema>,
): VisualIntelligenceRuntimeQualificationComponent {
  const payload = componentWithoutDigestSchema.parse(input)
  return Object.freeze(componentSchema.parse({
    ...payload,
    componentDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceRuntimeQualificationComponent(
  value: unknown,
): VisualIntelligenceRuntimeQualificationComponent {
  const component = componentSchema.parse(value)
  const payload = { ...component }
  Reflect.deleteProperty(payload, 'componentDigestSha256')
  if (component.componentDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence qualification component digest is invalid.',
    )
  }
  return Object.freeze(component)
}

export async function publishVisualIntelligenceRuntimeRelease(input: {
  readonly projectId: typeof PROJECT_ID
  readonly lifecycleBucketName: string
  readonly componentCoordinates: readonly VisualIntelligenceRuntimeQualificationCoordinate[]
  readonly objectPort: VisualIntelligencePrivateObjectReadPort
  readonly storage?: Storage
  readonly now?: () => string
}): Promise<VisualIntelligenceRuntimeReleasePublicationReceipt> {
  if (
    input.projectId !== PROJECT_ID
    || !bucketNameSchema.safeParse(input.lifecycleBucketName).success
    || !input.objectPort
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence runtime release publisher is not configured.',
  )
  const coordinates = parseExactCoordinateSet(input.componentCoordinates)
  const components = await Promise.all(coordinates.map((coordinate) =>
    readComponent({ coordinate, objectPort: input.objectPort })))
  const publishedAtIso = timestamp.parse(
    (input.now ?? (() => new Date().toISOString()))(),
  )
  const publishedAt = Date.parse(publishedAtIso)
  const location = components[0]?.vertexLocation
  const qualificationRefs = components.map((component) =>
    component.qualificationRef)
  if (
    !location
    || components.some((component, index) =>
      component.component
        !== VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS[index]
      || component.vertexLocation !== location
      || publishedAt < Date.parse(component.observedAtIso)
      || publishedAt >= Date.parse(component.expiresAtIso))
    || new Set(qualificationRefs.map(refKey)).size !== qualificationRefs.length
  ) throw new Error(
    'Visual Intelligence runtime qualification set is incomplete or stale.',
  )
  const byComponent = Object.fromEntries(components.map((component) => [
    component.component,
    component.qualificationRef,
  ])) as Record<
    typeof VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS[number],
    VisualIntelligenceEvidenceRef
  >
  const releaseIdentityRef = createVisualIntelligenceEvidenceRef(
    `visual-intelligence-gemini-pro-high-release-${
      visualIntelligenceDigest(qualificationRefs).slice(7, 23)
    }`,
    {
      qualificationRefs,
      projectId: input.projectId,
      vertexLocation: location,
      lifecycleBucketName: input.lifecycleBucketName,
      runtimeReleaseVersion: VISUAL_INTELLIGENCE_RUNTIME_RELEASE_VERSION,
    },
  )
  const release = compileVisualIntelligenceRuntimeReleaseForPublication({
    schemaVersion: VISUAL_INTELLIGENCE_RUNTIME_RELEASE_VERSION,
    evidenceClass:
      'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
    projectId: input.projectId,
    vertexLocation: location,
    lifecycleBucketName: input.lifecycleBucketName,
    runtimeReleaseIdentityRef: releaseIdentityRef,
    lifecycleRepositoryReleaseRef:
      byComponent.lifecycle_repository_release,
    concurrencyOwnerReleaseRef: byComponent.concurrency_owner_release,
    sourceEvidencePreparationReleaseRef:
      byComponent.source_evidence_preparation_release,
    providerModelAccessQualificationRef:
      byComponent.provider_model_access_qualification,
    providerTransportQualificationRef:
      byComponent.provider_transport_qualification,
    providerPrivacyRetentionReviewRef:
      byComponent.provider_privacy_retention_review,
    promptInjectionSafetyQualificationRef:
      byComponent.prompt_injection_safety_qualification,
    structuredOutputQualificationRef:
      byComponent.structured_output_qualification,
    professionalHighQualityBenchmarkRef:
      byComponent.professional_high_quality_benchmark,
    accountEffectivePricingAuthorityRef:
      byComponent.account_effective_pricing_authority,
    accountEffectiveCostSettlementOwnerRef:
      byComponent.account_effective_cost_settlement_owner,
    capabilityId: VISUAL_INTELLIGENCE_CAPABILITY_ID,
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    qualityProfile: VISUAL_INTELLIGENCE_QUALITY_PROFILE,
    thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
    mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
    providerAuthentication: 'vertex_application_default_credentials',
    providerTransport: 'gemini_enterprise_agent_platform',
    providerSdkPackage: '@google/genai',
    providerSdkVersion: '2.15.0',
    providerApiVersion:
      VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
    providerAdapterVersion:
      VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION,
    enterpriseAgentPlatformTransportQualified: true,
    legacyVertexAiClientFlagAllowed: false,
    globalEndpointRequired: true,
    profileRegistryVersion: VISUAL_INTELLIGENCE_PROFILE_REGISTRY_VERSION,
    promptVersion: VISUAL_INTELLIGENCE_PROMPT_VERSION,
    responseSchemaVersion: VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
    deterministicEvidenceVersion:
      VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
    exactModelAccessQualified: true,
    vertexAdcAndServiceAccountIamQualified: true,
    professionalHighThinkingAndMediaResolutionQualified: true,
    completeSourceNativeVideoTransportQualified: true,
    strictStructuredOutputQualified: true,
    promptInjectionSafetyQualified: true,
    privateMediaPrivacyAndRetentionQualified: true,
    lifecycleRepositoryCreateOnlyAndRereadQualified: true,
    durableAttemptConsumptionQualified: true,
    distributedConcurrencyQualified: true,
    deterministicGpuEvidencePreparationQualified: true,
    accountEffectivePricingAuthorityQualified: true,
    accountEffectiveCostSettlementQualified: true,
    authenticatedUserTriggerRequired: true,
    automaticProviderRetryAllowed: false,
    uncertainProviderOutcomeRetryAllowed: false,
    apiKeyAuthenticationAllowed: false,
    providerToolsAllowed: false,
    searchGroundingAllowed: false,
    urlContextAllowed: false,
    codeExecutionAllowed: false,
    flashFallbackAllowed: false,
    cheaperModelFallbackAllowed: false,
    qwenVisualFallbackAllowed: false,
    selfHostedVisualModelFallbackAllowed: false,
    publicListPriceSettlementAllowed: false,
    callerReleaseObservationAccepted: false,
    directTimelineMutationAllowed: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  const body = Buffer.from(visualIntelligenceCanonicalJson(release), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RELEASE_BYTES) {
    throw new Error('Visual Intelligence release exceeded its byte bound.')
  }
  const contentSha256 = rawDigest(body)
  const objectName = `${RELEASE_PREFIX}${releaseIdentityRef.id}.json`
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const file = storage.bucket(input.lifecycleBucketName).file(objectName, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  let disposition: 'created' | 'already_exists_exact' = 'created'
  try {
    await file.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'Visual Intelligence runtime release publication failed.',
      { cause: error },
    )
    disposition = 'already_exists_exact'
  }
  const [metadata] = await file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const contentType = String(metadata.contentType ?? '')
  const byteLength = Number(metadata.size ?? -1)
  if (
    !generationSchema.safeParse(generation).success
    || !etag
    || contentType !== 'application/json'
    || byteLength !== body.byteLength
  ) throw new Error('Visual Intelligence release metadata is invalid.')
  const exactFile = storage.bucket(input.lifecycleBucketName)
    .file(objectName, { generation })
  const [reread] = await exactFile.download({ validation: 'crc32c' })
  const [stableMetadata] = await exactFile.getMetadata()
  const exactRelease = parseVisualIntelligenceRuntimeRelease(
    parseJson(reread),
  )
  if (
    !reread.equals(body)
    || rawDigest(reread) !== contentSha256
    || visualIntelligenceCanonicalJson(exactRelease) !== reread.toString('utf8')
    || String(stableMetadata.generation ?? '') !== generation
    || String(stableMetadata.etag ?? '') !== etag
  ) throw new Error('Visual Intelligence release exact reread failed.')
  const payload = receiptWithoutDigestSchema.parse({
    schemaVersion:
      VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION,
    publisherVersion: VISUAL_INTELLIGENCE_RUNTIME_RELEASE_PUBLISHER_VERSION,
    evidenceClass:
      'eleven_component_exact_reread_create_only_release_publication',
    projectId: input.projectId,
    bucketName: input.lifecycleBucketName,
    objectName,
    generation,
    etag,
    contentType,
    byteLength,
    contentSha256,
    runtimeReleaseRef: visualIntelligenceRuntimeReleaseRef(exactRelease),
    qualificationComponentRefs: qualificationRefs,
    disposition,
    exactComponentSetCanonicalReread: true,
    createOnlyPreconditionUsed: true,
    exactGenerationEtagDigestAndCanonicalJsonReread: true,
    providerOrModelExecuted: false,
    gpuJobStarted: false,
    customerCreditsMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    publishedAtIso,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    receiptDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceRuntimeReleasePublicationReceipt(
  value: unknown,
): VisualIntelligenceRuntimeReleasePublicationReceipt {
  const receipt = receiptSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'receiptDigestSha256')
  if (receipt.receiptDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error('Visual Intelligence release receipt digest is invalid.')
  }
  return Object.freeze(receipt)
}

async function readComponent(input: {
  coordinate: VisualIntelligenceRuntimeQualificationCoordinate
  objectPort: VisualIntelligencePrivateObjectReadPort
}): Promise<VisualIntelligenceRuntimeQualificationComponent> {
  const coordinate = coordinateSchema.parse(input.coordinate)
  const stored = await input.objectPort.readExact({
    bucketName: coordinate.bucketName,
    objectName: coordinate.objectName,
    generation: coordinate.generation,
    etag: coordinate.etag,
  })
  if (
    !stored
    || stored.generation !== coordinate.generation
    || stored.etag !== coordinate.etag
    || stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > MAXIMUM_COMPONENT_BYTES
    || rawDigest(stored.body) !== coordinate.contentSha256
  ) throw new Error(
    'Visual Intelligence qualification component identity is invalid.',
  )
  const component = parseVisualIntelligenceRuntimeQualificationComponent(
    parseJson(stored.body),
  )
  if (
    component.component !== coordinate.component
    || visualIntelligenceCanonicalJson(component) !== stored.body.toString('utf8')
  ) throw new Error(
    'Visual Intelligence qualification component canonical reread failed.',
  )
  return component
}

function parseExactCoordinateSet(
  value: readonly VisualIntelligenceRuntimeQualificationCoordinate[],
): VisualIntelligenceRuntimeQualificationCoordinate[] {
  const coordinates = z.array(coordinateSchema)
    .length(VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS.length)
    .parse(value)
  if (coordinates.some((coordinate, index) =>
    coordinate.component
      !== VISUAL_INTELLIGENCE_RUNTIME_QUALIFICATION_COMPONENTS[index])
    || new Set(coordinates.map((coordinate) =>
      `${coordinate.bucketName}/${coordinate.objectName}#${coordinate.generation}`,
    )).size !== coordinates.length) {
    throw new Error(
      'Visual Intelligence qualification coordinate set is not exact.',
    )
  }
  return coordinates
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function parseJson(value: Buffer): unknown {
  try {
    return JSON.parse(value.toString('utf8')) as unknown
  } catch {
    throw new Error('Visual Intelligence release evidence is not JSON.')
  }
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Number(Reflect.get(error, 'code'))
  return Number.isInteger(value) ? value : undefined
}
