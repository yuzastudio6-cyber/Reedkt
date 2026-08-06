import { z } from 'zod'

import type { JSONValue } from '../../../types/shared'
import type {
  AssetRef,
  MotionStudioArtifactPayload,
  MotionStudioRegisteredExtension,
  ProviderResultRef,
  SourceLocator,
  StorageObjectRef,
  TimingAuthorityRef,
} from '../../../types/motion-studio'

const nonEmpty = z.string().trim().min(1)
const digest = z.string().regex(/^[a-f0-9]{64}$/i)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)

export const motionStudioJsonValueSchema: z.ZodType<JSONValue> = z.lazy(() => z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(motionStudioJsonValueSchema),
  z.record(z.string(), motionStudioJsonValueSchema),
]))

export const motionStudioAssetRefSchema: z.ZodType<AssetRef> = z.object({
  referenceKind: z.literal('asset_ref'),
  assetId: nonEmpty,
  assetVersionId: nonEmpty.optional(),
  contentDigest: digest.optional(),
}).strict()

export const motionStudioStorageObjectRefSchema: z.ZodType<StorageObjectRef> = z.object({
  referenceKind: z.literal('storage_object_ref'),
  storageProvider: z.enum(['gcs', 'supabase_storage', 'local_private']),
  objectId: nonEmpty,
  bucketId: nonEmpty,
  objectPath: nonEmpty,
  contentDigest: digest.optional(),
}).strict()

export const motionStudioSourceLocatorSchema: z.ZodType<SourceLocator> = z.object({
  referenceKind: z.literal('source_locator'),
  sourceId: nonEmpty,
  locatorType: z.literal('public_https'),
  url: z.string().url().startsWith('https://'),
  retrievedAt: nonEmpty.optional(),
}).strict()

export const motionStudioProviderResultRefSchema: z.ZodType<ProviderResultRef> = z.object({
  referenceKind: z.literal('provider_result_ref'),
  providerResultId: nonEmpty,
  providerAttemptId: nonEmpty,
}).strict()

export const motionStudioTimingAuthoritySchema: z.ZodType<TimingAuthorityRef> = z.object({
  masterTimingPlanVersionId: nonEmpty,
  confirmedFrameId: nonEmpty,
  timingAuthorityDigest: digest,
  frameRate: z.number().finite().positive(),
  width: positiveSafeInteger,
  height: positiveSafeInteger,
  aspectRatio: z.string().regex(/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/),
  durationFrames: positiveSafeInteger,
  timebase: z.string().regex(/^\d+\/\d+$/),
}).strict()

const motionStudioDesignExtensionSchema = z.object({
  namespace: z.literal('motion_studio.design.v1'),
  version: z.literal('1.0.0'),
  payload: z.object({
    designTokenReferences: z.array(nonEmpty).max(128),
    notes: z.array(z.string().max(2_000)).max(128),
  }).strict(),
}).strict()

export const motionStudioRegisteredExtensionSchema: z.ZodType<MotionStudioRegisteredExtension> =
  motionStudioDesignExtensionSchema

export const motionStudioStableReferenceSchema = z.union([
  motionStudioAssetRefSchema,
  motionStudioStorageObjectRefSchema,
  motionStudioSourceLocatorSchema,
  motionStudioProviderResultRefSchema,
])

export const motionStudioArtifactPayloadSchema: z.ZodType<MotionStudioArtifactPayload> = z.object({
  schemaVersion: nonEmpty,
  data: motionStudioJsonValueSchema,
  references: z.array(motionStudioStableReferenceSchema).max(512),
  extensions: z.array(motionStudioRegisteredExtensionSchema).max(64),
}).strict()

export const MOTION_STUDIO_DEEP_VALUE_LIMITS = Object.freeze({
  maximumDepth: 12,
  maximumTotalNodes: 5_000,
  maximumObjectKeys: 256,
  maximumArrayLength: 1_000,
  maximumStringLength: 16_384,
  maximumSerializedBytes: 1_000_000,
})

export interface MotionStudioDeepSafetyResult {
  ok: boolean
  errors: string[]
  visitedNodes: number
}

function normalizedKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const prototypePollutionKeys = new Set(['__proto__', 'prototype', 'constructor'])
const normalizedCredentialKeys = new Set([
  'apikey', 'providerapikey', 'apisecret', 'providerapisecret', 'secret',
  'providersecret', 'clientsecret', 'token', 'accesstoken', 'refreshtoken',
  'bearertoken', 'authorization', 'password', 'credentials',
  'providercredentials', 'servicerolekey', 'supabaseservicerolekey',
  'privatekey', 'signingkey', 'webhooksecret', 'sessioncookie',
  'serviceaccount', 'connectionstring', 'databaseurl', 'signedurl',
  'presignedurl', 'cookie', 'setcookie',
])
const timingAuthorityValueAliases = [
  'fps', 'framerate', 'width', 'height', 'aspectratio', 'duration',
  'durationframes', 'totalframes', 'timebase', 'confirmedframe',
  'confirmedframeid',
] as const
const hiddenTimingAuthorityPrefixes = ['', 'default', 'fallback', 'assumed', 'inferred'] as const
const normalizedTimingKeys = new Set(
  hiddenTimingAuthorityPrefixes.flatMap((prefix) =>
    timingAuthorityValueAliases.map((field) => `${prefix}${field}`),
  ),
)
const signedQueryKeys = new Set([
  'xamzalgorithm', 'xamzcredential', 'xamzdate', 'xamzexpires',
  'xamzsignedheaders', 'xamzsignature', 'xamzsecuritytoken',
  'xgoogalgorithm', 'xgoogcredential',
  'xgoogdate', 'xgoogexpires', 'xgoogsignedheaders', 'xgoogsignature',
  'googleaccessid', 'signature', 'sig', 'sharedaccesssignature', 'sv', 'se',
  'sp', 'sr', 'skt', 'ske', 'sks', 'skv', 'accesstoken', 'token',
  'securitytoken', 'credential', 'expires', 'expiration',
])
const timingAuthorityKeys = new Set([
  'masterTimingPlanVersionId', 'confirmedFrameId', 'timingAuthorityDigest',
  'frameRate', 'width', 'height', 'aspectRatio', 'durationFrames', 'timebase',
])

function pathForKey(parent: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`
}

function schemaErrors(
  path: string,
  result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } },
): string[] {
  if (result.success) return []
  return result.error!.issues.map((issue) => {
    const suffix = issue.path.map((part) => typeof part === 'number' ? `[${part}]` : `.${String(part)}`).join('')
    return `${path}${suffix}: ${issue.message}`
  })
}

function isTimingAuthorityObject(record: Record<string, unknown>): boolean {
  const keys = Object.keys(record)
  return keys.length === timingAuthorityKeys.size && keys.every((key) => timingAuthorityKeys.has(key))
}

function looksLikeCredentialValue(value: string): boolean {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(value) ||
    /^Bearer\s+\S+/i.test(value) ||
    /^(?:sk|rk|pk)-(?:live|test|proj)?[-_A-Za-z0-9]{12,}$/i.test(value) ||
    /^AIza[0-9A-Za-z_-]{20,}$/.test(value) ||
    /^AKIA[0-9A-Z]{16}$/.test(value) ||
    /^(?:ghp|github_pat|xox[baprs])_[A-Za-z0-9_-]{12,}$/i.test(value) ||
    /^sb_(?:secret|service_role)_[A-Za-z0-9_-]{12,}$/i.test(value) ||
    /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(value) ||
    /^(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:/\s]+:[^@\s]+@/i.test(value)
}

function inspectUrl(value: string): { absolute: boolean; signed: boolean; safePublicHttps: boolean } {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { absolute: false, signed: false, safePublicHttps: false }
  }
  const signed = [...parsed.searchParams.keys()].some((key) => signedQueryKeys.has(normalizedKey(key)))
  return {
    absolute: true,
    signed,
    safePublicHttps: parsed.protocol === 'https:' && !parsed.username && !parsed.password && !signed,
  }
}

function isPlainRecord(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function validateMotionStudioDeepValue(value: unknown): MotionStudioDeepSafetyResult {
  const errors: string[] = []
  let visitedNodes = 0
  let serializedBytes = 0
  try {
    serializedBytes = new TextEncoder().encode(JSON.stringify(value)).byteLength
  } catch {
    errors.push('$: Value must be acyclic and JSON serializable.')
  }
  if (serializedBytes > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumSerializedBytes) {
    errors.push(`$: Serialized value exceeds ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumSerializedBytes} bytes.`)
  }

  const ancestors = new WeakSet<object>()
  const visit = (
    current: unknown,
    path: string,
    depth: number,
    parentRecord?: Record<string, unknown>,
    parentKey?: string,
    insideExtension = false,
  ): void => {
    visitedNodes += 1
    if (visitedNodes > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumTotalNodes) {
      if (!errors.some((error) => error.includes('maximum node count'))) {
        errors.push(`${path}: Value exceeds the maximum node count of ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumTotalNodes}.`)
      }
      return
    }
    if (depth > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumDepth) {
      errors.push(`${path}: Value exceeds maximum depth ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumDepth}.`)
      return
    }
    if (typeof current === 'string') {
      if (current.length > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumStringLength) {
        errors.push(`${path}: String exceeds ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumStringLength} characters.`)
      }
      if (/^file:\/\//i.test(current)) errors.push(`${path}: file:// values are forbidden.`)
      if (looksLikeCredentialValue(current)) errors.push(`${path}: Credential-like value is forbidden.`)
      const url = inspectUrl(current)
      if (url.signed) errors.push(`${path}: Signed or credential-bearing URL is forbidden.`)
      if (url.absolute && !url.signed) {
        const isSourceLocatorUrl = parentRecord?.referenceKind === 'source_locator' && parentKey === 'url'
        if (!isSourceLocatorUrl) errors.push(`${path}: Absolute URLs must use a SourceLocator.`)
        else if (!url.safePublicHttps) errors.push(`${path}: SourceLocator must be unsigned public HTTPS.`)
      }
      return
    }
    if (current === null || typeof current === 'boolean') return
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) errors.push(`${path}: Number must be finite.`)
      return
    }
    if (typeof current !== 'object') {
      errors.push(`${path}: Unsupported non-JSON value type ${typeof current}.`)
      return
    }
    if (ancestors.has(current)) {
      errors.push(`${path}: Cyclic references are forbidden.`)
      return
    }
    ancestors.add(current)

    if (Array.isArray(current)) {
      if (current.length > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumArrayLength) {
        errors.push(`${path}: Array exceeds ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumArrayLength} items.`)
      }
      current.slice(0, MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumArrayLength + 1)
        .forEach((item, index) => visit(item, `${path}[${index}]`, depth + 1, undefined, undefined, insideExtension))
      ancestors.delete(current)
      return
    }

    if (!isPlainRecord(current)) errors.push(`${path}: Only plain JSON objects are allowed.`)
    const record = current as Record<string, unknown>
    const keys = Object.keys(record)
    if (keys.length > MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumObjectKeys) {
      errors.push(`${path}: Object exceeds ${MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumObjectKeys} keys.`)
    }
    const timingAuthority = isTimingAuthorityObject(record)
    if (timingAuthority) errors.push(...schemaErrors(path, motionStudioTimingAuthoritySchema.safeParse(record)))

    for (const key of keys.slice(0, MOTION_STUDIO_DEEP_VALUE_LIMITS.maximumObjectKeys + 1)) {
      const childPath = pathForKey(path, key)
      const normalized = normalizedKey(key)
      if (prototypePollutionKeys.has(key) || ['proto', 'prototype', 'constructor'].includes(normalized)) {
        errors.push(`${childPath}: Prototype-pollution key is forbidden.`)
      }
      if (normalizedCredentialKeys.has(normalized) || normalized.endsWith('apikey') || normalized.endsWith('clientsecret')) {
        errors.push(`${childPath}: Credential-bearing key is forbidden.`)
      }
      if (normalizedTimingKeys.has(normalized) && (!timingAuthority || insideExtension)) {
        errors.push(`${childPath}: Hidden timing defaults are forbidden; use an explicit TimingAuthorityRef.`)
      }
      let childInsideExtension = insideExtension
      if (normalized === 'extensions') {
        if (!Array.isArray(record[key])) {
          errors.push(`${childPath}: Extensions must be an array of registered extension records.`)
        } else {
          for (const [index, extension] of record[key].entries()) {
            errors.push(...schemaErrors(`${childPath}[${index}]`, motionStudioRegisteredExtensionSchema.safeParse(extension)))
          }
        }
        childInsideExtension = true
      }
      visit(record[key], childPath, depth + 1, record, key, childInsideExtension)
    }
    ancestors.delete(current)
  }

  visit(value, '$', 0)
  return { ok: errors.length === 0, errors: [...new Set(errors)], visitedNodes }
}
