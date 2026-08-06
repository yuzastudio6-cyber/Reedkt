import { createHash } from 'node:crypto'

import type {
  CanonicalCaptionPostrenderVisualIntelligenceResult,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION,
  type CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator,
  type CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository,
} from './canonical-caption-postrender-visual-intelligence-evidence-repository'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION,
  type CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator,
  type CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository,
} from './canonical-caption-postrender-visual-intelligence-owner-result-port'
import {
  parseCanonicalCaptionPostrenderVisualIntelligenceResult,
} from './canonical-caption-postrender-visual-intelligence-result'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_DURABLE_STORE_VERSION =
  'canonical-caption-postrender-visual-intelligence-durable-store-v1' as const

const OWNER_PREFIX =
  'private/visual-intelligence/v1/caption-postrender-owner-results'
const EVIDENCE_PREFIX =
  'private/captions/v1/postrender-visual-intelligence-evidence'
const MAXIMUM_RESULT_BYTES = 8 * 1024 * 1024

export function createCanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository(
  input: { objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository {
  assertObjectPort(input.objectPort)
  const store = createStore(input.objectPort, OWNER_PREFIX)
  const repository: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository = {
    portVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION,
    authorityBoundary: 'canonical_visual_intelligence_postrender_owner',
    async readPersistedResult(locator) {
      const value = await store.read(locator)
      return value && matchesOwnerLocator(value, locator)
        ? structuredClone(value)
        : value === null
          ? null
          : (() => { throw conflict('owner_result_locator_mismatch') })()
    },
    async persistOwnerResultCreateOnly(result) {
      return store.persist(result)
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository(
  input: { objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository {
  assertObjectPort(input.objectPort)
  const store = createStore(input.objectPort, EVIDENCE_PREFIX)
  const repository: CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository = {
    repositoryVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION,
    async readCompletedEvidence(locator) {
      const value = await store.read(locator)
      return value && matchesEvidenceLocator(value, locator)
        ? structuredClone(value)
        : value === null
          ? null
          : (() => { throw conflict('evidence_locator_mismatch') })()
    },
    async readCompletedEvidenceForOutput(locator) {
      const value = await store.read(locator)
      return value && matchesOutputLocator(value, locator)
        ? structuredClone(value)
        : value === null
          ? null
          : (() => { throw conflict('evidence_output_locator_mismatch') })()
    },
    async persistCompletedEvidenceCreateOnly(result) {
      return store.persist(result)
    },
  }
  return Object.freeze(repository)
}

function createStore(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
) {
  const read = async (locator: OutputLocator) => {
    const body = await objectPort.readExact(objectPath(prefix, locator))
    if (!body) return null
    if (body.byteLength < 2 || body.byteLength > MAXIMUM_RESULT_BYTES) {
      throw conflict('result_bytes_invalid')
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('result_json_invalid')
    }
    return parseCanonicalCaptionPostrenderVisualIntelligenceResult(parsed)
  }
  const persist = async (
    value: CanonicalCaptionPostrenderVisualIntelligenceResult,
  ) => {
    const result = parseCanonicalCaptionPostrenderVisualIntelligenceResult(
      value)
    const body = Buffer.from(canonicalJson(result), 'utf8')
    if (body.byteLength < 2 || body.byteLength > MAXIMUM_RESULT_BYTES) {
      throw conflict('result_bytes_invalid')
    }
    const locator = outputLocator(result)
    const disposition = await objectPort.createOnly({
      objectPath: objectPath(prefix, locator),
      body,
      contentSha256: rawSha256(body),
    })
    const reread = await read(locator)
    if (!reread || canonicalJson(reread) !== canonicalJson(result)) {
      throw conflict('result_exact_reread_failed')
    }
    return {
      disposition: disposition === 'created'
        ? 'created' as const
        : 'idempotent_replay' as const,
      resultRef: {
        id: reread.resultId,
        version: 1 as const,
        contentHash: reread.resultDigestSha256,
      },
      exactRereadVerified: true as const,
    }
  }
  return { read, persist }
}

interface OutputLocator {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  outputId: string
}

function outputLocator(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
): OutputLocator {
  return {
    ownerUserId: result.scope.ownerUserId,
    workspaceId: result.scope.workspaceId,
    projectId: result.scope.projectId,
    editSessionId: result.scope.editSessionId,
    approvedSnapshotId: result.scope.approvedSnapshotId,
    outputId: result.output.outputId,
  }
}

function objectPath(prefix: string, locator: OutputLocator): string {
  return `${prefix}/${rawSha256(Buffer.from(canonicalJson(locator), 'utf8'))}.json`
}

function matchesOwnerLocator(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  locator: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator,
): boolean {
  return matchesOutputLocator(result, locator)
    && result.approvedWorkItemRef.id === locator.approvedWorkItemId
    && result.output.captionConfirmedOutputFrameRef.id
      === locator.confirmedOutputFrameRef.id
    && result.output.captionConfirmedOutputFrameRef.version
      === locator.confirmedOutputFrameRef.version
    && result.output.captionConfirmedOutputFrameRef.contentHash
      === locator.confirmedOutputFrameRef.contentHash
    && (!locator.requireCompleteRequestedRangeCoverage
      || (result.completeRequestedRangeSemanticCoverageVerified
        && result.incompleteRangeCount === 0))
}

function matchesEvidenceLocator(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  locator: CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator,
): boolean {
  return matchesOutputLocator(result, locator)
    && result.approvedWorkItemRef.id === locator.approvedWorkItemId
}

function matchesOutputLocator(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  locator: OutputLocator,
): boolean {
  return result.scope.ownerUserId === locator.ownerUserId
    && result.scope.workspaceId === locator.workspaceId
    && result.scope.projectId === locator.projectId
    && result.scope.editSessionId === locator.editSessionId
    && result.scope.approvedSnapshotId === locator.approvedSnapshotId
    && result.output.outputId === locator.outputId
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Caption post-render Visual Intelligence durable storage is unavailable.',
      503,
    )
  }
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Caption post-render Visual Intelligence durable evidence conflicts with immutable authority.',
    409,
    { reason },
  )
}
