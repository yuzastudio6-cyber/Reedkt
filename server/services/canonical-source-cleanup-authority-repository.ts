import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSourceCleanupBindingMatchesEvidence,
  createCanonicalSourceCleanupVisualIntelligenceBinding,
  type CanonicalSourceCleanupVisualIntelligenceBinding,
} from './canonical-source-cleanup-visual-intelligence-binding'
import {
  verifyCanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisEvidence,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedCleanupAuthorityInput,
} from './canonical-source-led-plan-compiler'
import { ApiError } from '../errors/api-error'

export const CANONICAL_SOURCE_CLEANUP_AUTHORITY_REPOSITORY_VERSION =
  'canonical-source-cleanup-authority-repository-v1' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1/source-cleanup-authority'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u

export interface CanonicalSourceCleanupAuthorityScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly userInstructionDigestSha256: string
  readonly sources: readonly {
    readonly sourceSequenceItemId: string
    readonly mediaAssetId: string
    readonly uploadedOrder: number
    readonly checksumSha256: string
  }[]
}

export type CanonicalSourceCleanupAuthorityReadResult =
  | {
      readonly status: 'not_found'
      readonly authority: null
      readonly repositoryRecordRef: null
    }
  | {
      readonly status: 'ready'
      readonly authority: CanonicalSourceLedCleanupAuthorityInput
      readonly repositoryRecordRef: {
        readonly id: string
        readonly version: 1
        readonly contentHash: string
      }
    }

export interface CanonicalSourceCleanupAuthorityReadPort {
  readForPlanning(
    scope: CanonicalSourceCleanupAuthorityScope,
  ): Promise<CanonicalSourceCleanupAuthorityReadResult>
}

export interface CanonicalSourceCleanupAuthorityRepository
  extends CanonicalSourceCleanupAuthorityReadPort {
  persist(input: {
    readonly scope: CanonicalSourceCleanupAuthorityScope
    readonly evidence: unknown
  }): Promise<Extract<
    CanonicalSourceCleanupAuthorityReadResult,
    { status: 'ready' }
  >>
}

/**
 * Approval-time reread for a plan that declares analyzed source ranges.
 * Historical preserve-every-frame plans have no binding and remain decodable;
 * an analyzed plan can never fall back to that historical behavior.
 */
export async function revalidateCanonicalSourceCleanupPlanAuthority(input: {
  readonly readPort?: CanonicalSourceCleanupAuthorityReadPort
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequence: readonly {
    readonly sourceSequenceItemId: string
    readonly mediaAssetId: string
    readonly uploadedOrder: number
    readonly checksumSha256?: string
  }[]
  readonly compiledIntent: unknown
}): Promise<void> {
  if (!plainRecord(input.compiledIntent)) {
    throw conflict('source_cleanup_plan_compiled_intent_invalid')
  }
  const untrustedBinding =
    input.compiledIntent.canonicalSourceCleanupAuthority
  if (untrustedBinding === undefined) return
  if (!input.readPort) {
    throw notReady('source_cleanup_approval_reread_port_missing')
  }
  const binding = parsePlanBinding(untrustedBinding)
  const sources = input.sourceSequence.map((source, index) => {
    if (
      source.uploadedOrder !== index + 1 ||
      typeof source.checksumSha256 !== 'string'
    ) throw conflict('source_cleanup_approval_source_sequence_invalid')
    return {
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      checksumSha256: source.checksumSha256,
    }
  })
  const reread = await input.readPort.readForPlanning({
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    userInstructionDigestSha256:
      binding.userInstructionDigestSha256,
    sources,
  })
  if (reread.status !== 'ready') {
    throw conflict('source_cleanup_approval_authority_not_found')
  }
  const rereadBinding =
    assertCanonicalSourceCleanupBindingMatchesEvidence({
      binding: reread.authority.binding,
      evidence: reread.authority.evidence,
    })
  if (
    refKey(reread.repositoryRecordRef) !==
      refKey(binding.repositoryRecordRef) ||
    refKey(rereadBinding.sourceAnalysisEvidenceRef) !==
      refKey(binding.sourceAnalysisEvidenceRef) ||
    rereadBinding.bindingDigestSha256 !==
      binding.sourceCleanupBindingDigestSha256
  ) throw conflict('source_cleanup_approval_authority_changed')
}

interface StoredRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_CLEANUP_AUTHORITY_REPOSITORY_VERSION
  readonly scope: CanonicalSourceCleanupAuthorityScope
  readonly evidence: CanonicalSourceLedContentAnalysisEvidence
  readonly binding: CanonicalSourceCleanupVisualIntelligenceBinding
  readonly authority: {
    readonly owner: 'canonical_source_cleanup_authority_repository'
    readonly authenticatedOwnerScopeRequired: true
    readonly exactSourceSetRereadRequired: true
    readonly browserEvidenceAccepted: false
    readonly browserSelectedRangesAccepted: false
    readonly planPublished: false
    readonly approvalGranted: false
    readonly workDispatched: false
    readonly mediaProcessed: false
    readonly customerCreditMutated: false
    readonly publicDeliveryGranted: false
    readonly productionAuthorityGranted: false
  }
  readonly recordDigestSha256: string
}

interface SourceCleanupPlanBinding {
  schemaVersion: 'canonical-source-cleanup-plan-authority-binding-v1'
  repositoryRecordRef: {
    id: string
    version: number
    contentHash: string
  }
  sourceAnalysisEvidenceRef: {
    id: string
    version: number
    contentHash: string
  }
  sourceCleanupBindingDigestSha256: string
  userInstructionDigestSha256: string
}

export function createCanonicalSourceCleanupAuthorityRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSourceCleanupAuthorityRepository {
  if (!input.objectPort) throw notReady('source_cleanup_repository_port_missing')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persist(value: {
      readonly scope: CanonicalSourceCleanupAuthorityScope
      readonly evidence: unknown
    }) {
      const scope = validateScope(value.scope)
      const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
        value.evidence,
      )
      const binding = createCanonicalSourceCleanupVisualIntelligenceBinding({
        evidence,
        expectedScope: expectedBindingScope(scope),
      })
      assertScopeMatchesBinding(scope, binding)
      const recordWithoutDigest = {
        schemaVersion:
          CANONICAL_SOURCE_CLEANUP_AUTHORITY_REPOSITORY_VERSION,
        scope,
        evidence,
        binding,
        authority: closedAuthority(),
      } as const
      const record: StoredRecord = {
        ...recordWithoutDigest,
        recordDigestSha256: digest(recordWithoutDigest),
      }
      const body = Buffer.from(stableStringify(record), 'utf8')
      await input.objectPort.createOnly({
        objectPath: objectPath(prefix, scope),
        body,
        contentSha256: sha256(body),
      })
      const reread = await readRecord({
        objectPort: input.objectPort,
        prefix,
        scope,
      })
      if (!reread) throw conflict('source_cleanup_repository_create_reread')
      return readyResult(reread)
    },
    async readForPlanning(
      untrustedScope: CanonicalSourceCleanupAuthorityScope,
    ) {
      const scope = validateScope(untrustedScope)
      const record = await readRecord({
        objectPort: input.objectPort,
        prefix,
        scope,
      })
      return record
        ? readyResult(record)
        : {
            status: 'not_found' as const,
            authority: null,
            repositoryRecordRef: null,
          }
    },
  })
}

async function readRecord(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix: string
  scope: CanonicalSourceCleanupAuthorityScope
}): Promise<StoredRecord | null> {
  const body = await input.objectPort.readExact(
    objectPath(input.prefix, input.scope),
  )
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2 || body.byteLength > 32 * 1024 * 1024) {
    throw conflict('source_cleanup_repository_record_bytes')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('source_cleanup_repository_record_json')
  }
  return parseRecord(untrusted, input.scope)
}

function parseRecord(
  untrusted: unknown,
  expectedScope: CanonicalSourceCleanupAuthorityScope,
): StoredRecord {
  if (!plainRecord(untrusted) || !exactKeys(untrusted, [
    'schemaVersion',
    'scope',
    'evidence',
    'binding',
    'authority',
    'recordDigestSha256',
  ])) throw conflict('source_cleanup_repository_record_shape')
  const record = untrusted as unknown as StoredRecord
  const scope = validateScope(record.scope)
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    record.evidence,
  )
  const binding = assertCanonicalSourceCleanupBindingMatchesEvidence({
    binding: record.binding,
    evidence,
  })
  if (
    record.schemaVersion !==
      CANONICAL_SOURCE_CLEANUP_AUTHORITY_REPOSITORY_VERSION
    || stableStringify(scope) !== stableStringify(expectedScope)
    || !plainRecord(record.authority)
    || !exactKeys(record.authority, Object.keys(closedAuthority()))
    || stableStringify(record.authority) !== stableStringify(closedAuthority())
    || !RAW_SHA256.test(record.recordDigestSha256)
  ) throw conflict('source_cleanup_repository_record_authority')
  const withoutDigest = { ...record }
  Reflect.deleteProperty(withoutDigest, 'recordDigestSha256')
  if (record.recordDigestSha256 !== digest(withoutDigest)) {
    throw conflict('source_cleanup_repository_record_digest')
  }
  assertScopeMatchesBinding(scope, binding)
  return structuredClone({
    ...record,
    scope,
    evidence,
    binding,
  })
}

function readyResult(record: StoredRecord): Extract<
  CanonicalSourceCleanupAuthorityReadResult,
  { status: 'ready' }
> {
  const exactRecordContentSha256 = sha256(
    Buffer.from(stableStringify(record), 'utf8'),
  )
  const repositoryRecordRef = {
    id: `source-cleanup-authority-${record.recordDigestSha256.slice(0, 32)}`,
    version: 1 as const,
    contentHash: `sha256:${exactRecordContentSha256}`,
  }
  return {
    status: 'ready',
    authority: {
      binding: structuredClone(record.binding),
      evidence: structuredClone(record.evidence),
      repositoryRecordRef: { ...repositoryRecordRef },
      expectedScope: expectedBindingScope(record.scope),
    },
    repositoryRecordRef,
  }
}

function parsePlanBinding(untrusted: unknown): SourceCleanupPlanBinding {
  if (!plainRecord(untrusted) || !exactKeys(untrusted, [
    'schemaVersion',
    'repositoryRecordRef',
    'sourceAnalysisEvidenceRef',
    'sourceCleanupBindingDigestSha256',
    'userInstructionDigestSha256',
  ])) throw conflict('source_cleanup_plan_binding_shape')
  const binding = untrusted as unknown as SourceCleanupPlanBinding
  if (
    binding.schemaVersion !==
      'canonical-source-cleanup-plan-authority-binding-v1' ||
    !validRef(binding.repositoryRecordRef) ||
    binding.repositoryRecordRef.version !== 1 ||
    !validRef(binding.sourceAnalysisEvidenceRef) ||
    !RAW_SHA256.test(binding.sourceCleanupBindingDigestSha256) ||
    !RAW_SHA256.test(binding.userInstructionDigestSha256)
  ) throw conflict('source_cleanup_plan_binding_values')
  return structuredClone(binding)
}

function validRef(value: unknown): value is {
  id: string
  version: number
  contentHash: string
} {
  return plainRecord(value) && exactKeys(value, [
    'id',
    'version',
    'contentHash',
  ]) && typeof value.id === 'string' && SAFE_ID.test(value.id) &&
    Number.isSafeInteger(value.version) && (value.version as number) > 0 &&
    typeof value.contentHash === 'string' &&
    /^sha256:[a-f0-9]{64}$/u.test(value.contentHash)
}

function refKey(value: {
  id: string
  version: number
  contentHash: string
}): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function validateScope(
  untrusted: unknown,
): CanonicalSourceCleanupAuthorityScope {
  if (!plainRecord(untrusted) || !exactKeys(untrusted, [
    'ownerUserId',
    'workspaceId',
    'projectId',
    'editSessionId',
    'userInstructionDigestSha256',
    'sources',
  ])) throw conflict('source_cleanup_repository_scope_shape')
  const scope = untrusted as unknown as CanonicalSourceCleanupAuthorityScope
  if (
    !SAFE_ID.test(scope.ownerUserId) ||
    !SAFE_ID.test(scope.workspaceId) ||
    !SAFE_ID.test(scope.projectId) ||
    !SAFE_ID.test(scope.editSessionId) ||
    !RAW_SHA256.test(scope.userInstructionDigestSha256) ||
    !Array.isArray(scope.sources) ||
    scope.sources.length < 1 ||
    scope.sources.length > 8
  ) throw conflict('source_cleanup_repository_scope_values')
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  const sources = (scope.sources as readonly unknown[]).map((source, index) => {
    if (!plainRecord(source) || !exactKeys(source, [
      'sourceSequenceItemId',
      'mediaAssetId',
      'uploadedOrder',
      'checksumSha256',
    ])) throw conflict('source_cleanup_repository_source_scope')
    const sourceSequenceItemId = source.sourceSequenceItemId
    const mediaAssetId = source.mediaAssetId
    const uploadedOrder = source.uploadedOrder
    const checksumSha256 = source.checksumSha256
    if (
      typeof sourceSequenceItemId !== 'string' ||
      !SAFE_ID.test(sourceSequenceItemId) ||
      typeof mediaAssetId !== 'string' ||
      !SAFE_ID.test(mediaAssetId) ||
      uploadedOrder !== index + 1 ||
      typeof checksumSha256 !== 'string' ||
      !RAW_SHA256.test(checksumSha256) ||
      sourceIds.has(sourceSequenceItemId) ||
      mediaIds.has(mediaAssetId)
    ) throw conflict('source_cleanup_repository_source_scope')
    sourceIds.add(sourceSequenceItemId)
    mediaIds.add(mediaAssetId)
    return {
      sourceSequenceItemId,
      mediaAssetId,
      uploadedOrder,
      checksumSha256,
    }
  })
  return {
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    userInstructionDigestSha256: scope.userInstructionDigestSha256,
    sources,
  }
}

function assertScopeMatchesBinding(
  scope: CanonicalSourceCleanupAuthorityScope,
  binding: CanonicalSourceCleanupVisualIntelligenceBinding,
): void {
  if (
    binding.scope.workspaceId !== scope.workspaceId ||
    binding.scope.projectId !== scope.projectId ||
    binding.scope.editSessionId !== scope.editSessionId ||
    binding.scope.userInstructionDigestSha256 !==
      scope.userInstructionDigestSha256 ||
    binding.sources.length !== scope.sources.length ||
    binding.sources.some((source, index) => {
      const expected = scope.sources[index]!
      return source.sourceSequenceItemId !== expected.sourceSequenceItemId ||
        source.mediaAssetId !== expected.mediaAssetId ||
        source.uploadedOrder !== expected.uploadedOrder ||
        source.checksumSha256 !== expected.checksumSha256
    })
  ) throw conflict('source_cleanup_repository_scope_binding')
}

function expectedBindingScope(scope: CanonicalSourceCleanupAuthorityScope) {
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    userInstructionDigestSha256: scope.userInstructionDigestSha256,
  }
}

function closedAuthority() {
  return {
    owner: 'canonical_source_cleanup_authority_repository' as const,
    authenticatedOwnerScopeRequired: true as const,
    exactSourceSetRereadRequired: true as const,
    browserEvidenceAccepted: false as const,
    browserSelectedRangesAccepted: false as const,
    planPublished: false as const,
    approvalGranted: false as const,
    workDispatched: false as const,
    mediaProcessed: false as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

function objectPath(
  prefix: string,
  scope: CanonicalSourceCleanupAuthorityScope,
): string {
  return `${prefix}/${digest(scope)}.json`
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,720}$/u.test(prefix) ||
    prefix.includes('..') ||
    prefix.includes('//')
  ) throw conflict('source_cleanup_repository_prefix')
  return prefix
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort(utf16Compare)
  const required = [...expected].sort(utf16Compare)
  return actual.length === required.length &&
    actual.every((key, index) => key === required[index])
}

function plainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (plainRecord(value)) {
    return Object.fromEntries(Object.keys(value).sort(utf16Compare).map(
      (key) => [key, canonicalize(value[key])],
    ))
  }
  return value
}

function utf16Compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function digest(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-cleanup authority failed exact immutable reread.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source-cleanup authority repository is unavailable.',
    503,
    { requiredGate },
  )
}
