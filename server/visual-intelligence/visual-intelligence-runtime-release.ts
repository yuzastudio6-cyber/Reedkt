import { createHash } from 'node:crypto'

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
import { ApiError } from '../errors/api-error'
import {
  VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  VISUAL_INTELLIGENCE_PROFILE_REGISTRY_VERSION,
  VISUAL_INTELLIGENCE_PROMPT_VERSION,
  VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
} from './visual-intelligence-profile-registry'
import {
  VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION,
  VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
} from './vertex-gemini-pro-visual-intelligence-adapter'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from './visual-intelligence-private-object-read-port'

export const VISUAL_INTELLIGENCE_RUNTIME_RELEASE_VERSION =
  'visual-intelligence-runtime-release-v1' as const

const PROJECT_ID = 'reeditpro' as const
const RELEASE_PREFIX =
  'private/visual-intelligence/releases/gemini-pro-high/v1/' as const
const MAX_RELEASE_BYTES = 512 * 1024
const GCS_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u
const GENERATION = /^[1-9][0-9]{0,30}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u

const evidenceRefSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const releaseWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_RUNTIME_RELEASE_VERSION),
  evidenceClass: z.literal(
    'canonical_immutable_visual_intelligence_gemini_pro_high_release_reread',
  ),
  projectId: z.literal(PROJECT_ID),
  vertexLocation: z.enum(['global', 'us-central1', 'europe-west4']),
  lifecycleBucketName: z.string().regex(GCS_BUCKET),
  runtimeReleaseIdentityRef: evidenceRefSchema,
  lifecycleRepositoryReleaseRef: evidenceRefSchema,
  concurrencyOwnerReleaseRef: evidenceRefSchema,
  sourceEvidencePreparationReleaseRef: evidenceRefSchema,
  providerModelAccessQualificationRef: evidenceRefSchema,
  providerTransportQualificationRef: evidenceRefSchema,
  providerPrivacyRetentionReviewRef: evidenceRefSchema,
  promptInjectionSafetyQualificationRef: evidenceRefSchema,
  structuredOutputQualificationRef: evidenceRefSchema,
  professionalHighQualityBenchmarkRef: evidenceRefSchema,
  accountEffectivePricingAuthorityRef: evidenceRefSchema,
  accountEffectiveCostSettlementOwnerRef: evidenceRefSchema,
  capabilityId: z.literal(VISUAL_INTELLIGENCE_CAPABILITY_ID),
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  qualityProfile: z.literal(VISUAL_INTELLIGENCE_QUALITY_PROFILE),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  providerAuthentication: z.literal('vertex_application_default_credentials'),
  providerSdkPackage: z.literal('@google/genai'),
  providerSdkVersion: z.literal('2.15.0'),
  providerApiVersion: z.literal(
    VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
  ),
  providerAdapterVersion: z.literal(
    VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION,
  ),
  profileRegistryVersion: z.literal(
    VISUAL_INTELLIGENCE_PROFILE_REGISTRY_VERSION,
  ),
  promptVersion: z.literal(VISUAL_INTELLIGENCE_PROMPT_VERSION),
  responseSchemaVersion: z.literal(
    VISUAL_INTELLIGENCE_RESPONSE_SCHEMA_VERSION,
  ),
  deterministicEvidenceVersion: z.literal(
    VISUAL_INTELLIGENCE_DETERMINISTIC_EVIDENCE_VERSION,
  ),
  exactModelAccessQualified: z.literal(true),
  vertexAdcAndServiceAccountIamQualified: z.literal(true),
  professionalHighThinkingAndMediaResolutionQualified: z.literal(true),
  completeSourceNativeVideoTransportQualified: z.literal(true),
  strictStructuredOutputQualified: z.literal(true),
  promptInjectionSafetyQualified: z.literal(true),
  privateMediaPrivacyAndRetentionQualified: z.literal(true),
  lifecycleRepositoryCreateOnlyAndRereadQualified: z.literal(true),
  durableAttemptConsumptionQualified: z.literal(true),
  distributedConcurrencyQualified: z.literal(true),
  deterministicGpuEvidencePreparationQualified: z.literal(true),
  accountEffectivePricingAuthorityQualified: z.literal(true),
  accountEffectiveCostSettlementQualified: z.literal(true),
  authenticatedUserTriggerRequired: z.literal(true),
  automaticProviderRetryAllowed: z.literal(false),
  uncertainProviderOutcomeRetryAllowed: z.literal(false),
  apiKeyAuthenticationAllowed: z.literal(false),
  providerToolsAllowed: z.literal(false),
  searchGroundingAllowed: z.literal(false),
  urlContextAllowed: z.literal(false),
  codeExecutionAllowed: z.literal(false),
  flashFallbackAllowed: z.literal(false),
  cheaperModelFallbackAllowed: z.literal(false),
  qwenVisualFallbackAllowed: z.literal(false),
  selfHostedVisualModelFallbackAllowed: z.literal(false),
  publicListPriceSettlementAllowed: z.literal(false),
  callerReleaseObservationAccepted: z.literal(false),
  directTimelineMutationAllowed: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const releaseSchema = releaseWithoutDigestSchema.extend({
  releaseDigestSha256: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export type VisualIntelligenceRuntimeRelease = z.infer<typeof releaseSchema>
export type VisualIntelligenceRuntimeReleasePublicationInput = z.input<
  typeof releaseWithoutDigestSchema
>

const admittedReleases = new WeakSet<object>()

/** Test-only constructor. Hosted runtime must use readVisualIntelligenceRuntimeRelease. */
export function createControlledVisualIntelligenceRuntimeRelease(
  input: VisualIntelligenceRuntimeReleasePublicationInput,
): VisualIntelligenceRuntimeRelease {
  const release = compileVisualIntelligenceRuntimeReleaseForPublication(input)
  admittedReleases.add(release)
  return release
}

/**
 * Produces canonical bytes for the create-only production publisher. The
 * returned value is deliberately not admitted for hosted execution: only an
 * exact immutable-object reread through readVisualIntelligenceRuntimeRelease
 * can cross that boundary.
 */
export function compileVisualIntelligenceRuntimeReleaseForPublication(
  input: VisualIntelligenceRuntimeReleasePublicationInput,
): VisualIntelligenceRuntimeRelease {
  const payload = releaseWithoutDigestSchema.parse(input)
  return Object.freeze(releaseSchema.parse({
    ...payload,
    releaseDigestSha256: digest(payload),
  }))
}

export function parseVisualIntelligenceRuntimeRelease(
  value: unknown,
): VisualIntelligenceRuntimeRelease {
  const release = releaseSchema.parse(value)
  if (release.releaseDigestSha256 !== digest(omitDigest(release))) {
    throw notReady('visual_intelligence_release_digest_invalid')
  }
  return Object.freeze(release)
}

export function assertAdmittedVisualIntelligenceRuntimeRelease(
  value: unknown,
): VisualIntelligenceRuntimeRelease {
  const release = parseVisualIntelligenceRuntimeRelease(value)
  if (
    !value || typeof value !== 'object'
    || !admittedReleases.has(value as object)
  ) throw notReady('visual_intelligence_release_not_exact_reread')
  return release
}

export function visualIntelligenceRuntimeReleaseRef(
  value: VisualIntelligenceRuntimeRelease,
): VisualIntelligenceEvidenceRef {
  const release = parseVisualIntelligenceRuntimeRelease(value)
  return Object.freeze({
    id: release.runtimeReleaseIdentityRef.id,
    version: release.runtimeReleaseIdentityRef.version,
    contentHash: release.releaseDigestSha256,
  })
}

export async function readVisualIntelligenceRuntimeRelease(input: {
  readonly projectId: typeof PROJECT_ID
  readonly bucketName: string
  readonly objectName: string
  readonly generation: string
  readonly etag: string
  readonly contentSha256: string
  readonly objectPort: VisualIntelligencePrivateObjectReadPort
}): Promise<VisualIntelligenceRuntimeRelease> {
  validateCoordinate(input)
  const stored = await input.objectPort.readExact({
    bucketName: input.bucketName,
    objectName: input.objectName,
    generation: input.generation,
    etag: input.etag,
  })
  if (
    !stored
    || stored.generation !== input.generation
    || stored.etag !== input.etag
    || stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > MAX_RELEASE_BYTES
    || rawDigest(stored.body) !== input.contentSha256
  ) throw notReady('visual_intelligence_release_object_identity_invalid')
  const release = parseVisualIntelligenceRuntimeRelease(parseJson(stored.body))
  const canonical = Buffer.from(stableStringify(release), 'utf8')
  if (
    release.lifecycleBucketName !== input.bucketName
    || !stored.body.equals(canonical)
  ) throw notReady('visual_intelligence_release_canonical_reread_invalid')
  admittedReleases.add(release)
  return release
}

function validateCoordinate(input: {
  projectId: string
  bucketName: string
  objectName: string
  generation: string
  etag: string
  contentSha256: string
  objectPort: VisualIntelligencePrivateObjectReadPort
}): void {
  if (
    input.projectId !== PROJECT_ID
    || !GCS_BUCKET.test(input.bucketName)
    || !input.objectName.startsWith(RELEASE_PREFIX)
    || !input.objectName.endsWith('.json')
    || input.objectName.length > 1_024
    || input.objectName.includes('..')
    || input.objectName.includes('\\')
    || !GENERATION.test(input.generation)
    || input.etag.length < 1
    || input.etag.length > 512
    || !RAW_SHA256.test(input.contentSha256)
    || !input.objectPort
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_release_coordinate_invalid')
}

function omitDigest(
  release: VisualIntelligenceRuntimeRelease,
): Omit<VisualIntelligenceRuntimeRelease, 'releaseDigestSha256'> {
  const payload = { ...release }
  Reflect.deleteProperty(payload, 'releaseDigestSha256')
  return payload
}

function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw notReady('visual_intelligence_release_json_invalid')
  }
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableStringify(value), 'utf8')
    .digest('hex')}`
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value, new Set<object>()))
}

function stableValue(value: unknown, seen: Set<object>): unknown {
  if (Array.isArray(value)) {
    if (seen.has(value)) throw notReady('visual_intelligence_release_cycle')
    seen.add(value)
    const result = value.map((entry) => stableValue(entry, seen))
    seen.delete(value)
    return result
  }
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) throw notReady('visual_intelligence_release_cycle')
  seen.add(value)
  const result = Object.fromEntries(Object.entries(value)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, entry]) => [key, stableValue(entry, seen)]))
  seen.delete(value)
  return result
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The immutable Visual Intelligence Gemini Pro High runtime release is not ready.',
    503,
    { requiredGate },
  )
}
