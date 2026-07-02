import type { JSONObject, JSONValue } from '../../types/shared'

export interface CloudValidationResult {
  ok: boolean
  warnings: string[]
  errors: string[]
}

export interface SecretInspectionOptions {
  allowedSecretReferenceKeys?: string[]
}

export const CLOUD_RUNTIME_CONTRACT_RULE =
  'RP-GCP-00 contracts are mock-only runtime alignment contracts. They must not import SDKs, call networks, read files, load secrets, render media, or connect to Supabase.'

export const FRONTEND_RUNTIME_BOUNDARY_RULE =
  'Frontend code may use only frontend-safe public configuration. Provider keys, service-role keys, signed URLs, workers, renderers, and Google Cloud services stay behind backend/worker boundaries.'

const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /access[_-]?key/i,
  /secret/i,
  /service[_-]?role/i,
  /private[_-]?key/i,
  /password/i,
  /credential/i,
  /authorization/i,
  /bearer/i,
  /token/i,
  /cookie/i,
  /signed[_-]?url/i,
  /webhook[_-]?secret/i,
]

const SECRET_REFERENCE_KEY_PATTERNS = [
  /secret[_-]?reference/i,
  /secretReference/i,
  /secret[_-]?name/i,
  /secretName/i,
  /secret[_-]?id/i,
  /secretId/i,
]

const SECRET_VALUE_PATTERNS = [
  /^sk-[A-Za-z0-9_-]{12,}/,
  /^AIza[A-Za-z0-9_-]{20,}/,
  /^ya29\.[A-Za-z0-9_-]{20,}/,
  /^eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY-----/,
  /supabase.*service.*role/i,
  /service_role/i,
]

const SIGNED_URL_MARKERS = [
  'x-goog-signature=',
  'x-goog-credential=',
  'x-goog-algorithm=',
  'x-amz-signature=',
  'x-amz-credential=',
  'signature=',
  'access_token=',
  'authuser=',
]

export function createCloudValidationResult(): CloudValidationResult {
  return {
    ok: true,
    warnings: [],
    errors: [],
  }
}

export function cloudValidationResult(errors: string[] = [], warnings: string[] = []): CloudValidationResult {
  return {
    ok: errors.length === 0,
    warnings,
    errors,
  }
}

export function mergeCloudValidationResults(...results: CloudValidationResult[]): CloudValidationResult {
  const warnings = results.flatMap((result) => result.warnings)
  const errors = results.flatMap((result) => result.errors)

  return cloudValidationResult(errors, warnings)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function looksLikeSignedUrl(value: string): boolean {
  const lowerValue = value.toLowerCase()
  const hasUrl = lowerValue.startsWith('http://') || lowerValue.startsWith('https://')
  const hasMarker = SIGNED_URL_MARKERS.some((marker) => lowerValue.includes(marker))

  return hasUrl && hasMarker
}

export function looksLikeSecretKey(key: string, options: SecretInspectionOptions = {}): boolean {
  if (options.allowedSecretReferenceKeys?.includes(key)) {
    return false
  }

  if (SECRET_REFERENCE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
    return false
  }

  return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

export function looksLikeSecretValue(value: string): boolean {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(trimmedValue)) || looksLikeSignedUrl(trimmedValue)
}

export function inspectForSecretLikeValues(
  value: unknown,
  options: SecretInspectionOptions = {},
  path = '$',
): CloudValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  function inspect(currentValue: unknown, currentPath: string): void {
    if (typeof currentValue === 'string') {
      if (looksLikeSecretValue(currentValue)) {
        errors.push(`${currentPath} contains a secret-like value or signed URL.`)
      }
      return
    }

    if (Array.isArray(currentValue)) {
      currentValue.forEach((item, index) => inspect(item, `${currentPath}[${index}]`))
      return
    }

    if (!isPlainObject(currentValue)) {
      return
    }

    Object.entries(currentValue).forEach(([key, nestedValue]) => {
      const nestedPath = `${currentPath}.${key}`

      if (looksLikeSecretKey(key, options)) {
        if (typeof nestedValue === 'string' && nestedValue.trim().length > 0) {
          errors.push(`${nestedPath} uses a raw secret-looking field. Store only Secret Manager reference names in records.`)
        } else {
          warnings.push(`${nestedPath} uses a secret-looking field name. Confirm it stores references only.`)
        }
      }

      inspect(nestedValue, nestedPath)
    })
  }

  inspect(value, path)

  return cloudValidationResult(errors, warnings)
}

export function containsSignedUrl(value: unknown): boolean {
  if (typeof value === 'string') {
    return looksLikeSignedUrl(value)
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsSignedUrl(item))
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((nestedValue) => containsSignedUrl(nestedValue))
  }

  return false
}

export function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasJsonObject(value: unknown): value is JSONObject {
  return isPlainObject(value)
}

export function hasJsonValue(value: unknown): value is JSONValue {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    isPlainObject(value)
}
