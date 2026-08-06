import {
  resolveProfessionalToolOperationSpec,
} from './professional-tool-operation-spec-registry'
import type {
  ProfessionalToolOperationArtifactBindingSchema,
  ProfessionalToolOperationSettingConstraint,
  ProfessionalToolOperationSpec,
  ProfessionalToolOperationStringConstraint,
} from './professional-tool-operation-spec-types'

export type ProfessionalToolOperationRequestValidationErrorCode =
  | 'unknown_tool'
  | 'policy_blocked'
  | 'invalid_json_object'
  | 'request_too_large'
  | 'prohibited_input'
  | 'unsupported_field'
  | 'missing_field'
  | 'invalid_field'
  | 'operation_not_allowed'
  | 'artifact_contract_failed'
  | 'settings_contract_failed'

export interface ProfessionalToolOperationRequestValidationError {
  code: ProfessionalToolOperationRequestValidationErrorCode
  field: string
  message: string
}

export type ProfessionalToolOperationRequestValidationResult =
  | {
      ok: true
      spec: ProfessionalToolOperationSpec
      request: Readonly<Record<string, unknown>>
    }
  | {
      ok: false
      spec?: ProfessionalToolOperationSpec
      errors: ProfessionalToolOperationRequestValidationError[]
    }

export function validateProfessionalToolOperationRequest(
  requestedToolName: string,
  value: unknown,
): ProfessionalToolOperationRequestValidationResult {
  const spec = resolveProfessionalToolOperationSpec(requestedToolName)
  if (!spec) {
    return failure(undefined, 'unknown_tool', 'requestedToolName', 'Requested tool is not an allowlisted bounded adapter alias.')
  }
  if (spec.disposition === 'policy_blocked') {
    return failure(
      spec,
      'policy_blocked',
      'requestedToolName',
      `${spec.canonicalToolId} is not callable under current product policy: ${spec.policyBlockReasons.join(' ')}`,
    )
  }
  if (!isPlainObject(value)) {
    return failure(spec, 'invalid_json_object', '$', 'Operation request must be a plain JSON object.')
  }

  const serializedBytes = serializedJsonBytes(value)
  if (serializedBytes === undefined) {
    return failure(spec, 'invalid_json_object', '$', 'Operation request must be finite, acyclic JSON data.')
  }
  if (serializedBytes > spec.requestSchema.maxSerializedBytes) {
    return failure(
      spec,
      'request_too_large',
      '$',
      `Operation request exceeds ${spec.requestSchema.maxSerializedBytes} bytes.`,
    )
  }

  const request = value as Record<string, unknown>
  const errors: ProfessionalToolOperationRequestValidationError[] = []
  collectProhibitedInputs(request, '$', new Set(spec.requestSchema.prohibitedPropertyNames), errors)

  const allowedFields = new Set(Object.keys(spec.requestSchema.properties))
  for (const key of Object.keys(request)) {
    if (!allowedFields.has(key)) {
      errors.push(error('unsupported_field', key, `${key} is not an allowlisted operation request field.`))
    }
  }
  for (const key of spec.requestSchema.required) {
    if (!Object.hasOwn(request, key)) {
      errors.push(error('missing_field', key, `${key} is required.`))
    }
  }

  const operationId = request.operationId
  if (typeof operationId !== 'string' || !spec.allowedOperationIds.includes(operationId)) {
    errors.push(error(
      'operation_not_allowed',
      'operationId',
      `operationId must be the server-declared operation ${spec.allowedOperationIds[0]}.`,
    ))
  }

  for (const field of [
    'approvedSnapshotId',
    'approvedSnapshotHash',
    'workItemId',
    'workItemHash',
    'creditEstimateId',
    'creditReservationId',
    'workerLeaseId',
    'idempotencyKey',
    'modelManifestId',
    'networkGrantId',
    'captureAuthorizationId',
  ] as const) {
    const constraint = spec.requestSchema.properties[field]
    if (!constraint || !Object.hasOwn(request, field)) continue
    validateStringField(request[field], constraint, field, errors)
  }

  validateArtifactBindings(
    request.artifactBindings,
    spec.requestSchema.properties.artifactBindings,
    spec.resourceCeilings.maxInputBytes,
    errors,
  )
  validateSettings(request.settings, spec, errors)

  if (errors.length > 0) return { ok: false, spec, errors }
  return { ok: true, spec, request: Object.freeze({ ...request }) }
}

export function assertProfessionalToolOperationRequest(
  requestedToolName: string,
  value: unknown,
): { spec: ProfessionalToolOperationSpec; request: Readonly<Record<string, unknown>> } {
  const result = validateProfessionalToolOperationRequest(requestedToolName, value)
  if (!result.ok) {
    throw new Error(result.errors.map((item) => `${item.field}: ${item.message}`).join(' '))
  }
  return result
}

function validateArtifactBindings(
  value: unknown,
  schema: ProfessionalToolOperationArtifactBindingSchema,
  maxTotalBytes: number,
  errors: ProfessionalToolOperationRequestValidationError[],
): void {
  if (!Array.isArray(value)) {
    errors.push(error('artifact_contract_failed', 'artifactBindings', 'artifactBindings must be an array.'))
    return
  }
  if (value.length < schema.minItems || value.length > schema.maxItems) {
    errors.push(error(
      'artifact_contract_failed',
      'artifactBindings',
      `artifactBindings must contain ${schema.minItems}-${schema.maxItems} server-manifest bindings.`,
    ))
  }

  const allowedKeys = new Set(Object.keys(schema.items.properties))
  const artifactIds = new Set<string>()
  let totalBytes = 0
  value.forEach((item, index) => {
    const prefix = `artifactBindings[${index}]`
    if (!isPlainObject(item)) {
      errors.push(error('artifact_contract_failed', prefix, 'Artifact binding must be a plain JSON object.'))
      return
    }
    for (const key of Object.keys(item)) {
      if (!allowedKeys.has(key)) {
        errors.push(error('artifact_contract_failed', `${prefix}.${key}`, 'Artifact binding field is not allowlisted.'))
      }
    }
    for (const key of schema.items.required) {
      if (!Object.hasOwn(item, key)) {
        errors.push(error('artifact_contract_failed', `${prefix}.${key}`, 'Artifact binding field is required.'))
      }
    }

    validateStringField(item.artifactId, schema.items.properties.artifactId, `${prefix}.artifactId`, errors, 'artifact_contract_failed')
    validateStringField(item.kind, schema.items.properties.kind, `${prefix}.kind`, errors, 'artifact_contract_failed')
    validateStringField(item.sha256, schema.items.properties.sha256, `${prefix}.sha256`, errors, 'artifact_contract_failed')
    validateNumberField(item.byteLength, schema.items.properties.byteLength, `${prefix}.byteLength`, errors, 'artifact_contract_failed')

    if (typeof item.artifactId === 'string') {
      if (artifactIds.has(item.artifactId)) {
        errors.push(error('artifact_contract_failed', `${prefix}.artifactId`, 'Artifact IDs must be unique.'))
      }
      artifactIds.add(item.artifactId)
    }
    if (typeof item.byteLength === 'number' && Number.isSafeInteger(item.byteLength) && item.byteLength >= 0) {
      totalBytes += item.byteLength
    }
  })
  if (totalBytes > maxTotalBytes) {
    errors.push(error(
      'artifact_contract_failed',
      'artifactBindings',
      `Combined artifact bytes exceed the ${maxTotalBytes}-byte operation ceiling.`,
    ))
  }
}

function validateSettings(
  value: unknown,
  spec: ProfessionalToolOperationSpec,
  errors: ProfessionalToolOperationRequestValidationError[],
): void {
  const schema = spec.requestSchema.properties.settings
  if (!isPlainObject(value)) {
    errors.push(error('settings_contract_failed', 'settings', 'settings must be a strict JSON object.'))
    return
  }
  const keys = Object.keys(value)
  if (keys.length > schema.maxProperties) {
    errors.push(error('settings_contract_failed', 'settings', 'settings contains too many fields.'))
  }
  for (const key of keys) {
    const constraint = schema.properties[key]
    if (!constraint) {
      errors.push(error('settings_contract_failed', `settings.${key}`, 'Setting is not allowlisted for this operation.'))
      continue
    }
    validateSettingField(value[key], constraint, `settings.${key}`, errors)
  }
  for (const key of schema.required) {
    if (!Object.hasOwn(value, key)) {
      errors.push(error('settings_contract_failed', `settings.${key}`, 'Required operation setting is missing.'))
    }
  }
}

function validateSettingField(
  value: unknown,
  constraint: ProfessionalToolOperationSettingConstraint,
  field: string,
  errors: ProfessionalToolOperationRequestValidationError[],
): void {
  if (constraint.type === 'string') {
    validateStringField(value, constraint, field, errors, 'settings_contract_failed')
    return
  }
  if (constraint.type === 'boolean') {
    if (typeof value !== 'boolean' || (constraint.const !== undefined && value !== constraint.const)) {
      errors.push(error('settings_contract_failed', field, `${field} must satisfy its boolean allowlist.`))
    }
    return
  }
  validateNumberField(value, constraint, field, errors, 'settings_contract_failed')
}

function validateStringField(
  value: unknown,
  constraint: ProfessionalToolOperationStringConstraint,
  field: string,
  errors: ProfessionalToolOperationRequestValidationError[],
  code: ProfessionalToolOperationRequestValidationErrorCode = 'invalid_field',
): void {
  if (typeof value !== 'string') {
    errors.push(error(code, field, `${field} must be a string.`))
    return
  }
  if (constraint.const !== undefined && value !== constraint.const) {
    errors.push(error(code, field, `${field} must equal its server-declared constant.`))
  }
  if (constraint.enum && !constraint.enum.includes(value)) {
    errors.push(error(code, field, `${field} is not in the allowlisted value set.`))
  }
  if (constraint.minLength !== undefined && value.length < constraint.minLength) {
    errors.push(error(code, field, `${field} is shorter than ${constraint.minLength} characters.`))
  }
  if (constraint.maxLength !== undefined && value.length > constraint.maxLength) {
    errors.push(error(code, field, `${field} exceeds ${constraint.maxLength} characters.`))
  }
  if (constraint.pattern && !new RegExp(constraint.pattern).test(value)) {
    errors.push(error(code, field, `${field} does not match its strict format.`))
  }
  if (isForbiddenLiteral(value)) {
    errors.push(error('prohibited_input', field, `${field} contains a forbidden URL, path, code, shell, or credential form.`))
  }
}

function validateNumberField(
  value: unknown,
  constraint: Extract<ProfessionalToolOperationSettingConstraint, { type: 'number' | 'integer' }>,
  field: string,
  errors: ProfessionalToolOperationRequestValidationError[],
  code: ProfessionalToolOperationRequestValidationErrorCode = 'invalid_field',
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(error(code, field, `${field} must be a finite number.`))
    return
  }
  if (constraint.type === 'integer' && !Number.isSafeInteger(value)) {
    errors.push(error(code, field, `${field} must be a safe integer.`))
  }
  if (constraint.minimum !== undefined && value < constraint.minimum) {
    errors.push(error(code, field, `${field} must be at least ${constraint.minimum}.`))
  }
  if (constraint.maximum !== undefined && value > constraint.maximum) {
    errors.push(error(code, field, `${field} must be at most ${constraint.maximum}.`))
  }
  if (constraint.enum && !constraint.enum.includes(value)) {
    errors.push(error(code, field, `${field} is not in the allowlisted numeric value set.`))
  }
}

function collectProhibitedInputs(
  value: unknown,
  path: string,
  prohibitedNames: Set<string>,
  errors: ProfessionalToolOperationRequestValidationError[],
  depth = 0,
): void {
  if (depth > 8) {
    errors.push(error('prohibited_input', path, 'Operation request nesting exceeds the safe validation depth.'))
    return
  }
  if (typeof value === 'string') {
    if (isForbiddenLiteral(value)) {
      errors.push(error('prohibited_input', path, 'Operation request contains a forbidden literal URL, path, code, shell, or credential form.'))
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectProhibitedInputs(item, `${path}[${index}]`, prohibitedNames, errors, depth + 1))
    return
  }
  if (!isPlainObject(value)) return
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (prohibitedNames.has(normalizedKey)) {
      errors.push(error('prohibited_input', `${path}.${key}`, `${key} is a prohibited caller-controlled field.`))
    }
    collectProhibitedInputs(child, `${path}.${key}`, prohibitedNames, errors, depth + 1)
  }
}

function isForbiddenLiteral(value: string): boolean {
  const candidate = value.trim()
  if (!candidate) return false
  return /(?:https?:\/\/|file:|data:|javascript:|ftp:\/\/|s3:\/\/|gs:\/\/)/i.test(candidate) ||
    /^(?:\/|~\/|\.\.?\/|[A-Za-z]:[\\/]|\\\\)/.test(candidate) ||
    /(?:\.\.\/|\.\.\\)/.test(candidate) ||
    /(?:bearer\s+[A-Za-z0-9._~-]+|basic\s+[A-Za-z0-9+/=]+)/i.test(candidate) ||
    /(?:\$\(|`|&&|\|\||;\s*(?:sh|bash|zsh|cmd|powershell)\b)/i.test(candidate) ||
    /(?:<script\b|\beval\s*\(|\bfunction\s*\(|=>\s*\{)/i.test(candidate)
}

function serializedJsonBytes(value: unknown): number | undefined {
  try {
    const serialized = JSON.stringify(value)
    if (serialized === undefined) return undefined
    return Buffer.byteLength(serialized, 'utf8')
  } catch {
    return undefined
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function failure(
  spec: ProfessionalToolOperationSpec | undefined,
  code: ProfessionalToolOperationRequestValidationErrorCode,
  field: string,
  message: string,
): ProfessionalToolOperationRequestValidationResult {
  return { ok: false, spec, errors: [error(code, field, message)] }
}

function error(
  code: ProfessionalToolOperationRequestValidationErrorCode,
  field: string,
  message: string,
): ProfessionalToolOperationRequestValidationError {
  return { code, field, message }
}
