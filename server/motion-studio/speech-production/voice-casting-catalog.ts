import type { MotionStudioVoiceCastingCandidateDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass,
  loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence,
  type MotionStudioSpeechPremadeVoiceCandidateV1,
  type MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1,
} from './voice-catalog-discovery'

const CANDIDATE_REFERENCE_PREFIX = 'voice-catalog:v1:' as const

export interface MotionStudioVoiceCastingCatalogProjection {
  catalogVersion: string
  candidates: readonly MotionStudioVoiceCastingCandidateDto[]
  resolve(candidateReference: string): MotionStudioSpeechPremadeVoiceCandidateV1 | undefined
}

export async function loadMotionStudioVoiceCastingCatalogProjection(
  repositoryRoot: string,
): Promise<MotionStudioVoiceCastingCatalogProjection> {
  const evidence = await loadMotionStudioSpeechVoiceCatalogPrivateAcceptanceEvidence({ repositoryRoot })
  return createMotionStudioVoiceCastingCatalogProjection(evidence)
}

export function createMotionStudioVoiceCastingCatalogProjection(
  evidence: MotionStudioSpeechVoiceCatalogDiscoveryEvidenceV1,
): MotionStudioVoiceCastingCatalogProjection {
  if (getMotionStudioSpeechVoiceCatalogDiscoveryEvidenceClass(evidence) !== 'authenticated_provider_read_only') {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'Narrator choices require the exact authenticated read-only production catalog evidence.',
      409,
    )
  }
  if (
    evidence.state !== 'premade_voice_candidates_ready' ||
    evidence.catalogCompleteness !== 'complete_exact_query' ||
    evidence.hasMore ||
    evidence.candidates.length < 1
  ) {
    throw new ApiError(
      'MOTION_STUDIO_APPROVAL_BLOCKED',
      'The narrator catalog is not complete enough for an explicit planning choice.',
      409,
    )
  }

  const byReference = new Map<string, MotionStudioSpeechPremadeVoiceCandidateV1>()
  const candidates = evidence.candidates.map((candidate) => {
    const candidateReference = `${CANDIDATE_REFERENCE_PREFIX}${candidate.candidateEvidenceDigest}`
    if (byReference.has(candidateReference)) {
      throw new ApiError('INTERNAL_ERROR', 'Narrator catalog contains a duplicate safe reference.', 500, undefined, { internal: true })
    }
    byReference.set(candidateReference, candidate)
    return Object.freeze({
      candidateReference,
      displayName: candidate.displayName,
      ...(candidate.description ? { description: candidate.description } : {}),
      traits: Object.freeze({
        ...safeTrait(candidate.labels, 'accent'),
        ...safeTrait(candidate.labels, 'age'),
        ...safeTrait(candidate.labels, 'gender'),
        ...safeTrait(candidate.labels, 'language'),
        ...safeTrait(candidate.labels, 'use_case', 'useCase'),
        ...safeTrait(candidate.labels, 'descriptive', 'character'),
      }),
      auditionState: 'unavailable' as const,
    })
  })
  const catalogVersion = sha256CanonicalJson({
    schemaVersion: 'motion-studio.voice-casting-catalog-projection.v1',
    candidates,
  })

  return Object.freeze({
    catalogVersion,
    candidates: Object.freeze(candidates),
    resolve(candidateReference: string) {
      return byReference.get(candidateReference)
    },
  })
}

function safeTrait(
  labels: Readonly<Record<string, string>>,
  sourceKey: string,
  outputKey: 'accent' | 'age' | 'gender' | 'language' | 'useCase' | 'character' = sourceKey as 'accent',
): Partial<MotionStudioVoiceCastingCandidateDto['traits']> {
  const value = labels[sourceKey]?.trim()
  return value ? { [outputKey]: value } : {}
}
