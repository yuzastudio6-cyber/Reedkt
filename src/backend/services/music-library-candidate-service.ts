import type {
  GeneratedMusicTrackRecord,
  MusicLibraryCandidateRecord,
  MusicQAReportRecord,
  MusicTrackAnalysisRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

export function createLibraryCandidateReason(params: {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  qaReport: MusicQAReportRecord
}) {
  const { analysis, qaReport, track } = params

  if (qaReport.status === 'failed') return 'QA failed; keep project-only or regenerate.'
  if (analysis.qualityScore < 90) return 'Quality score is not high enough for library promotion.'
  if (track.provenance === 'unknown') return 'License/provenance is missing.'
  if (track.reuseStatus === 'blocked' || track.reuseStatus === 'project_only') return 'Generated music is project-only by default.'
  if (analysis.hasVocals && track.vocalHint === 'lyrics') return 'Lyrics make this too specific or risky for general reuse.'
  return 'Track is high-quality and may be reviewed as a reusable library candidate.'
}

export function createMusicLibraryCandidate(input: {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  qaReport: MusicQAReportRecord
}): MusicLibraryCandidateRecord {
  return {
    id: createMockId('music-library-candidate'),
    generatedMusicTrackId: input.track.id,
    qaReportId: input.qaReport.id,
    status: input.track.reuseStatus === 'terms_review_required' ? 'terms_review_required' : 'candidate',
    reason: createLibraryCandidateReason(input),
    reusableAcrossProjects: input.track.reuseStatus === 'allowed',
    requiresTermsReview: input.track.reuseStatus === 'terms_review_required',
    tags: [
      input.track.cueRole,
      input.track.sectionType,
      input.track.energyHint,
      input.track.moodHint,
      ...input.track.genreHints,
    ],
    createdAt: nowIso(),
  }
}

export function rejectMusicLibraryCandidate(input: {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  qaReport: MusicQAReportRecord
}): MusicLibraryCandidateRecord {
  return {
    id: createMockId('music-library-candidate'),
    generatedMusicTrackId: input.track.id,
    qaReportId: input.qaReport.id,
    status: input.track.reuseStatus === 'project_only' ? 'project_only' : 'rejected',
    reason: createLibraryCandidateReason(input),
    reusableAcrossProjects: false,
    requiresTermsReview: input.track.reuseStatus === 'terms_review_required',
    tags: [
      input.track.cueRole,
      input.track.sectionType,
      input.track.energyHint,
      input.track.moodHint,
    ],
    createdAt: nowIso(),
  }
}

export function evaluateMusicLibraryCandidate(input: {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  qaReport: MusicQAReportRecord
}) {
  const canPromote =
    input.qaReport.status !== 'failed' &&
    input.analysis.qualityScore >= 90 &&
    input.track.provenance !== 'unknown' &&
    (input.track.reuseStatus === 'allowed' || input.track.reuseStatus === 'terms_review_required') &&
    !(input.analysis.hasVocals && input.track.vocalHint === 'lyrics') &&
    input.track.genreHints.length > 0

  return canPromote
    ? createMusicLibraryCandidate(input)
    : rejectMusicLibraryCandidate(input)
}
