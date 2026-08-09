import type {
  CanonicalCaptionPostrenderVisualIntelligenceResult,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import { ApiError } from '../errors/api-error'
import {
  parseCanonicalCaptionPostrenderVisualIntelligenceResult,
} from './canonical-caption-postrender-visual-intelligence-result'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-postrender-visual-intelligence-evidence-repository-v1' as const

export interface CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  outputId: string
}

/**
 * Caption-owned create-only reconciliation store. It stores the exact immutable
 * owner result; it does not dispatch Visual Intelligence or alter the result.
 */
export interface CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository {
  readonly repositoryVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION
  readCompletedEvidence(
    locator: CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator,
  ): Promise<CanonicalCaptionPostrenderVisualIntelligenceResult | null>
  readCompletedEvidenceForOutput(input: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    outputId: string
  }): Promise<CanonicalCaptionPostrenderVisualIntelligenceResult | null>
  persistCompletedEvidenceCreateOnly(
    result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  ): Promise<{
    disposition: 'created' | 'idempotent_replay'
    resultRef: { id: string; version: 1; contentHash: string }
    exactRereadVerified: true
  }>
}

export function createControlledCanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository(
  input: {
    completed?: readonly CanonicalCaptionPostrenderVisualIntelligenceResult[]
  } = {},
): CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository {
  const completed = new Map<
    string,
    CanonicalCaptionPostrenderVisualIntelligenceResult
  >()
  for (const value of input.completed ?? []) {
    const result = parseCanonicalCaptionPostrenderVisualIntelligenceResult(value)
    const key = locatorKey(result)
    if (completed.has(key)) throw conflict('duplicate_visual_intelligence_evidence')
    completed.set(key, structuredClone(result))
  }
  return Object.freeze({
    repositoryVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION,
    async readCompletedEvidence(locator) {
      const value = completed.get(locatorKey(locator))
      return value ? structuredClone(value) : null
    },
    async readCompletedEvidenceForOutput(locator) {
      const matches = [...completed.values()].filter((result) =>
        result.scope.ownerUserId === locator.ownerUserId
        && result.scope.workspaceId === locator.workspaceId
        && result.scope.projectId === locator.projectId
        && result.scope.editSessionId === locator.editSessionId
        && result.scope.approvedSnapshotId === locator.approvedSnapshotId
        && result.output.outputId === locator.outputId)
      if (matches.length > 1) {
        throw conflict('multiple_visual_intelligence_results_for_output')
      }
      return matches[0] ? structuredClone(matches[0]) : null
    },
    async persistCompletedEvidenceCreateOnly(value) {
      const result = parseCanonicalCaptionPostrenderVisualIntelligenceResult(
        value)
      const key = locatorKey(result)
      const existing = completed.get(key)
      if (existing) {
        if (canonicalJson(existing) !== canonicalJson(result)) {
          throw conflict('visual_intelligence_evidence_create_only_conflict')
        }
        return persisted('idempotent_replay', existing)
      }
      completed.set(key, structuredClone(result))
      const reread = completed.get(key)
      if (!reread || canonicalJson(reread) !== canonicalJson(result)) {
        throw conflict('visual_intelligence_evidence_exact_reread_failed')
      }
      return persisted('created', reread)
    },
  } satisfies CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository)
}

export async function persistCanonicalCaptionPostrenderVisualIntelligenceEvidence(
  input: {
    repository:
      | CanonicalCaptionPostrenderVisualIntelligenceEvidenceRepository
      | undefined
    result: CanonicalCaptionPostrenderVisualIntelligenceResult
  },
) {
  const repository = input.repository
  if (!repository
    || repository.repositoryVersion !==
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_EVIDENCE_REPOSITORY_VERSION
    || typeof repository.readCompletedEvidence !== 'function'
    || typeof repository.readCompletedEvidenceForOutput !== 'function'
    || typeof repository.persistCompletedEvidenceCreateOnly !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption Visual Intelligence evidence persistence is unavailable.',
      503,
      {
        requiredGate:
          'canonical_caption_postrender_visual_intelligence_evidence_repository',
      },
    )
  }
  const result = parseCanonicalCaptionPostrenderVisualIntelligenceResult(
    input.result)
  const persistedValue = await repository.persistCompletedEvidenceCreateOnly(
    structuredClone(result))
  const reread = await repository.readCompletedEvidence(locatorFor(result))
  if (!reread
    || canonicalJson(
      parseCanonicalCaptionPostrenderVisualIntelligenceResult(reread))
      !== canonicalJson(result)
    || persistedValue.resultRef.id !== result.resultId
    || persistedValue.resultRef.version !== 1
    || persistedValue.resultRef.contentHash !== result.resultDigestSha256
    || persistedValue.exactRereadVerified !== true) {
    throw conflict('visual_intelligence_evidence_persisted_reread_mismatch')
  }
  return {
    ...persistedValue,
    result: structuredClone(result),
  }
}

function locatorFor(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
): CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator {
  return {
    ownerUserId: result.scope.ownerUserId,
    workspaceId: result.scope.workspaceId,
    projectId: result.scope.projectId,
    editSessionId: result.scope.editSessionId,
    approvedSnapshotId: result.scope.approvedSnapshotId,
    approvedWorkItemId: result.approvedWorkItemRef.id,
    outputId: result.output.outputId,
  }
}

function locatorKey(
  value: CanonicalCaptionPostrenderVisualIntelligenceEvidenceLocator
    | CanonicalCaptionPostrenderVisualIntelligenceResult,
): string {
  const locator = 'resultId' in value ? locatorFor(value) : value
  return [
    locator.ownerUserId,
    locator.workspaceId,
    locator.projectId,
    locator.editSessionId,
    locator.approvedSnapshotId,
    locator.approvedWorkItemId,
    locator.outputId,
  ].join('\u0000')
}

function persisted(
  disposition: 'created' | 'idempotent_replay',
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
) {
  return {
    disposition,
    resultRef: {
      id: result.resultId,
      version: 1 as const,
      contentHash: result.resultDigestSha256,
    },
    exactRereadVerified: true as const,
  }
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

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Caption Visual Intelligence evidence conflicts with persisted authority.',
    409,
    { reason },
  )
}
