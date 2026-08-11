import type { SoundArtifactRef, SoundEventAnchor } from './sound-contracts'

export interface ApprovedSoundLibraryRecord {
  libraryRecordId: string
  artifact: SoundArtifactRef
  eventClasses: string[]
  materials: string[]
  perspectives: string[]
  environments: string[]
  semanticTags: string[]
  provenanceStatus: 'approved' | 'review_required' | 'blocked'
  commercialUseApproved: boolean
  authorizedProjectIds: string[]
  projectOnlyReuse: boolean
}

export interface SoundLibrarySearchQuery {
  projectId: string
  eventClass: string
  material?: string
  perspective?: string
  environment?: string
  semanticTags: string[]
}

export interface RankedSoundLibraryMatch {
  record: ApprovedSoundLibraryRecord
  semanticScore: number
  scoreReasons: string[]
}

function normalized(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ')
}

function contains(values: string[], value: string | undefined): boolean {
  const target = normalized(value)
  return Boolean(target) && values.some((item) => normalized(item) === target)
}

export function searchApprovedSoundLibrary(
  query: SoundLibrarySearchQuery,
  records: ApprovedSoundLibraryRecord[],
): RankedSoundLibraryMatch[] {
  return records
    .filter((record) =>
      record.provenanceStatus === 'approved' &&
      record.commercialUseApproved &&
      (!record.projectOnlyReuse || record.authorizedProjectIds.includes(query.projectId))
    )
    .map((record) => {
      const reasons: string[] = []
      let score = 0
      if (contains(record.eventClasses, query.eventClass)) {
        score += 0.42
        reasons.push('event_class')
      }
      if (contains(record.materials, query.material)) {
        score += 0.22
        reasons.push('material')
      }
      if (contains(record.perspectives, query.perspective)) {
        score += 0.14
        reasons.push('perspective')
      }
      if (contains(record.environments, query.environment)) {
        score += 0.12
        reasons.push('environment')
      }
      const queryTags = new Set(query.semanticTags.map(normalized))
      const tagMatches = record.semanticTags.filter((tag) => queryTags.has(normalized(tag))).length
      if (tagMatches > 0) {
        score += Math.min(0.1, tagMatches * 0.025)
        reasons.push('semantic_tags')
      }
      return {
        record,
        semanticScore: Number(Math.min(1, score).toFixed(4)),
        scoreReasons: reasons,
      }
    })
    .filter((match) => match.semanticScore >= 0.42)
    .sort((left, right) =>
      right.semanticScore - left.semanticScore ||
      left.record.libraryRecordId.localeCompare(right.record.libraryRecordId)
    )
}

export interface SoundAcquisitionCandidate {
  artifact: SoundArtifactRef
  usable: boolean
  requiresRepair?: boolean
  provenanceApproved: boolean
  projectAuthorized: boolean
  semanticScore?: number
}

export function resolveSoundAcquisition(input: {
  event: SoundEventAnchor
  soundDesignEnabled: boolean
  preserveNaturalSound: boolean
  emotionalSilence: boolean
  source?: SoundAcquisitionCandidate
  library?: SoundAcquisitionCandidate
  projectExtraction?: SoundAcquisitionCandidate
  providerGenerationAllowed: boolean
  providerRouteQualifiedForRequestedMode: boolean
}): {
  acquisition: 'preserve_project_source' | 'internal_library' | 'project_source_extraction' | 'generate_original' | 'no_sound'
  selectedArtifact?: SoundArtifactRef
  reason: string
} {
  if (!input.soundDesignEnabled || !input.event.soundWouldImproveEdit || input.emotionalSilence) {
    return { acquisition: 'no_sound', reason: 'Deliberate silence protects story, speech, or emotional intent.' }
  }
  if (
    input.preserveNaturalSound && input.source?.usable &&
    input.source.provenanceApproved && input.source.projectAuthorized
  ) {
    return {
      acquisition: 'preserve_project_source',
      selectedArtifact: input.source.artifact,
      reason: input.source.requiresRepair
        ? 'Preserve and gently repair usable project source Sound.'
        : 'Preserve usable natural project source Sound.',
    }
  }
  if (
    input.library?.usable && input.library.provenanceApproved &&
    input.library.projectAuthorized && (input.library.semanticScore ?? 0) >= 0.42
  ) {
    return {
      acquisition: 'internal_library',
      selectedArtifact: input.library.artifact,
      reason: 'Use the best provenance-approved internal library match before generation.',
    }
  }
  if (
    input.projectExtraction?.usable && input.projectExtraction.provenanceApproved &&
    input.projectExtraction.projectAuthorized
  ) {
    return {
      acquisition: 'project_source_extraction',
      selectedArtifact: input.projectExtraction.artifact,
      reason: 'Extract and repair a project-owned source Sound before generation.',
    }
  }
  if (input.providerGenerationAllowed && input.providerRouteQualifiedForRequestedMode) {
    return { acquisition: 'generate_original', reason: 'Generate an original Sound asset only after lower-cost acquisition routes fail.' }
  }
  return { acquisition: 'no_sound', reason: 'No qualified acquisition route improves the edit within approved policy.' }
}
