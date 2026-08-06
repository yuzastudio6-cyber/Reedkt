import type { JSONValue } from '../../../src/types/shared'
import {
  motionStudioArtifactVersionSchema,
  motionStudioStableReferenceSchema,
  motionStudioTimingAuthoritySchema,
  validateMotionStudioDeepValue,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioArtifactPayload,
  MotionStudioCommandOperation,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from './canonical-json'
import type {
  CompileMotionStudioCommandInput,
  CompiledMotionStudioCommand,
  MotionStudioProductionRow,
} from './types'

const PAYLOAD_MUTATION_ROOTS = new Set(['data', 'references'])
const NO_VALUE_KINDS = new Set([
  'create_version', 'request_approval', 'invalidate_dependencies', 'remove_item',
])
const LOCK_KINDS = new Set(['user_lock', 'approval_lock', 'picture_lock', 'system_safety_lock'])

export function compileMotionStudioCommand(input: CompileMotionStudioCommandInput): CompiledMotionStudioCommand {
  const deepRequest = validateMotionStudioDeepValue(input.request)
  if (!deepRequest.ok) invalid('Command request failed deep-safety validation.', deepRequest.errors)

  const payload = cloneJson(input.baseVersion.payload_json)
  for (const operation of input.request.operations) applyOperation(payload, operation)

  const deepPayload = validateMotionStudioDeepValue(payload)
  if (!deepPayload.ok) invalid('Compiled payload failed deep-safety validation.', deepPayload.errors)
  assertMotionStudioArtifactPayloadScope(payload, input.production)

  const provenance = {
    ...input.baseVersion.provenance_json,
    createdBy: input.actor,
    sourceArtifactVersionIds: unique([
      ...input.baseVersion.provenance_json.sourceArtifactVersionIds,
      input.baseVersion.id,
    ]),
    createdAt: input.createdAt,
  }
  const state = input.request.operations.some((operation) => operation.kind === 'request_approval')
    ? 'in_review' as const
    : 'draft' as const
  const versionNumber = input.baseVersion.version_number + 1
  const digest = sha256CanonicalJson({
    artifactId: input.artifact.id,
    kind: input.artifact.kind,
    versionNumber,
    parentVersionId: input.baseVersion.id,
    payload,
    provenance,
  })
  const candidate = {
    id: 'ms003-compiled-version',
    workspaceId: input.production.workspace_id,
    projectId: input.production.project_id,
    editSessionId: input.production.edit_session_id,
    productionId: input.production.id,
    artifactId: input.artifact.id,
    kind: input.artifact.kind,
    versionNumber,
    parentVersionId: input.baseVersion.id,
    state,
    payload,
    contentDigest: digest,
    immutable: true,
    provenance,
    createdAt: input.createdAt,
  }
  const parsed = motionStudioArtifactVersionSchema.safeParse(candidate)
  if (!parsed.success) {
    invalid('Compiled artifact version violates its kind-specific contract.', parsed.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    })))
  }

  return { operations: input.request.operations, payload, provenance, state }
}

export function assertMotionStudioArtifactPayloadScope(
  payload: MotionStudioArtifactPayload,
  production: MotionStudioProductionRow,
): void {
  if (!isPlainRecord(payload.data)) {
    invalid('Artifact payload data must be a scoped object.', { path: '/payload/data' })
  }
  const expected = {
    workspaceId: production.workspace_id,
    projectId: production.project_id,
    editSessionId: production.edit_session_id,
    productionId: production.id,
  }
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (Object.prototype.hasOwnProperty.call(payload.data, field) && payload.data[field] !== expectedValue) {
      invalid(`Artifact payload ${field} does not match the authoritative production scope.`, {
        path: `/payload/data/${field}`,
      })
    }
  }
}

function applyOperation(payload: MotionStudioArtifactPayload, operation: MotionStudioCommandOperation): void {
  const segments = parsePointer(operation.targetPath)
  validateOperationValue(operation)
  if (operation.expectedValueDigest) {
    const currentValue = readPointer(payload, segments)
    const currentDigest = sha256CanonicalJson(currentValue)
    if (currentDigest !== operation.expectedValueDigest) {
      throw new ApiError('MOTION_STUDIO_CONFLICT', 'Expected command value digest no longer matches.', 409, {
        operationId: operation.operationId,
        targetPath: operation.targetPath,
      })
    }
  }

  switch (operation.kind) {
    case 'set_property':
      assertMutationPath(segments, operation.targetPath)
      setPointer(payload, segments, operation.value as JSONValue, false)
      return
    case 'insert_item':
      assertMutationPath(segments, operation.targetPath)
      setPointer(payload, segments, operation.value as JSONValue, true)
      return
    case 'remove_item':
      assertMutationPath(segments, operation.targetPath)
      removePointer(payload, segments)
      return
    case 'move_item': {
      assertMutationPath(segments, operation.targetPath)
      const fromPath = (operation.value as { fromPath: string }).fromPath
      const fromSegments = parsePointer(fromPath)
      assertMutationPath(fromSegments, fromPath)
      if (isPrefix(fromSegments, segments)) invalid('A command cannot move a value into its own descendant.', { fromPath, targetPath: operation.targetPath })
      const moved = readPointer(payload, fromSegments)
      removePointer(payload, fromSegments)
      setPointer(payload, segments, moved as JSONValue, true)
      return
    }
    case 'replace_asset': {
      assertMutationPath(segments, operation.targetPath)
      const parsed = motionStudioStableReferenceSchema.safeParse(operation.value)
      if (!parsed.success) invalid('replace_asset requires one strict stable reference.', parsed.error.flatten())
      setPointer(payload, segments, parsed.data as unknown as JSONValue, false)
      return
    }
    case 'set_timing_reference': {
      assertMutationPath(segments, operation.targetPath)
      const parsed = motionStudioTimingAuthoritySchema.safeParse(operation.value)
      if (!parsed.success) invalid('set_timing_reference requires one explicit timing authority.', parsed.error.flatten())
      setPointer(payload, segments, parsed.data as unknown as JSONValue, false)
      return
    }
    case 'create_version':
    case 'lock_property':
    case 'release_property_lock':
    case 'request_approval':
    case 'invalidate_dependencies':
      return
  }
}

function validateOperationValue(operation: MotionStudioCommandOperation): void {
  if (NO_VALUE_KINDS.has(operation.kind)) {
    if (operation.value !== undefined) invalid(`${operation.kind} does not accept a value.`, { operationId: operation.operationId })
    if (operation.kind !== 'remove_item' && operation.targetPath !== '/') {
      invalid(`${operation.kind} uses the root intent path /.`, { operationId: operation.operationId })
    }
    return
  }
  if (operation.kind === 'lock_property' || operation.kind === 'release_property_lock') {
    const value = operation.value
    if (!isPlainRecord(value) || Object.keys(value).some((key) => !['lockKind', 'reason'].includes(key)) ||
      typeof value.lockKind !== 'string' || !LOCK_KINDS.has(value.lockKind) ||
      typeof value.reason !== 'string' || !value.reason.trim() || value.reason.length > 2_000) {
      invalid(`${operation.kind} requires only lockKind and a bounded reason.`, { operationId: operation.operationId })
    }
    parsePointer(operation.targetPath)
    return
  }
  if (operation.value === undefined) invalid(`${operation.kind} requires a value.`, { operationId: operation.operationId })
  if (operation.kind === 'move_item') {
    if (!isPlainRecord(operation.value) || Object.keys(operation.value).length !== 1 || typeof operation.value.fromPath !== 'string') {
      invalid('move_item requires only a fromPath value.', { operationId: operation.operationId })
    }
  }
}

export function parseMotionStudioPointer(path: string): string[] {
  return parsePointer(path)
}

function parsePointer(path: string): string[] {
  if (path === '/') return []
  if (!path.startsWith('/') || path.length > 1_000 || containsAsciiControl(path)) invalid('Command targetPath must be a bounded RFC 6901 pointer.', { path })
  const rawSegments = path.slice(1).split('/')
  if (rawSegments.length > 64) invalid('Command targetPath exceeds 64 segments.', { path })
  return rawSegments.map((segment) => {
    if (/~(?![01])/u.test(segment)) invalid('Command targetPath contains an invalid RFC 6901 escape.', { path })
    const decoded = segment.replaceAll('~1', '/').replaceAll('~0', '~')
    if (!decoded || decoded === '.' || decoded === '..') invalid('Command targetPath contains an unsafe empty or traversal segment.', { path })
    return decoded
  })
}

function containsAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

function assertMutationPath(segments: readonly string[], path: string): void {
  if (segments.length < 2 || !PAYLOAD_MUTATION_ROOTS.has(segments[0]!)) {
    invalid('Payload mutations are restricted to /data and /references descendants.', { path })
  }
}

function readPointer(root: unknown, segments: readonly string[]): unknown {
  let current = root
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = arrayIndex(segment, current.length, false)
      current = current[index]
    } else if (isPlainRecord(current) && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment]
    } else {
      invalid('Command targetPath does not resolve to an existing value.', { segment })
    }
  }
  return current
}

function setPointer(root: unknown, segments: readonly string[], value: JSONValue, insert: boolean): void {
  const { parent, key } = pointerParent(root, segments)
  if (Array.isArray(parent)) {
    const index = arrayIndex(key, parent.length, insert)
    if (insert) parent.splice(index, 0, value)
    else parent[index] = value
    return
  }
  if (!isPlainRecord(parent)) invalid('Command target parent must be an object or array.', { key })
  if (insert && Object.prototype.hasOwnProperty.call(parent, key)) invalid('insert_item cannot overwrite an existing object property.', { key })
  parent[key] = value
}

function removePointer(root: unknown, segments: readonly string[]): void {
  const { parent, key } = pointerParent(root, segments)
  if (Array.isArray(parent)) {
    parent.splice(arrayIndex(key, parent.length, false), 1)
    return
  }
  if (!isPlainRecord(parent) || !Object.prototype.hasOwnProperty.call(parent, key)) invalid('remove_item target does not exist.', { key })
  delete parent[key]
}

function pointerParent(root: unknown, segments: readonly string[]): { parent: unknown; key: string } {
  if (segments.length === 0) invalid('Root replacement is forbidden.', {})
  return { parent: readPointer(root, segments.slice(0, -1)), key: segments.at(-1)! }
}

function arrayIndex(segment: string, length: number, allowAppend: boolean): number {
  if (allowAppend && segment === '-') return length
  if (!/^(0|[1-9]\d*)$/.test(segment)) invalid('Array pointer segment must be a canonical index.', { segment })
  const index = Number(segment)
  const upperBound = allowAppend ? length : length - 1
  if (!Number.isSafeInteger(index) || index < 0 || index > upperBound) invalid('Array pointer index is out of bounds.', { segment })
  return index
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isPrefix(left: readonly string[], right: readonly string[]): boolean {
  return left.length < right.length && left.every((segment, index) => segment === right[index])
}

function invalid(message: string, details: unknown): never {
  throw new ApiError('VALIDATION_FAILED', message, 400, details)
}
