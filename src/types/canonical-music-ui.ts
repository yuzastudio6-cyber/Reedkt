export type CanonicalMusicUiStatus =
  | 'awaiting_canonical_artifacts'
  | 'planned'
  | 'executing'
  | 'completed'
  | 'partial'
  | 'blocked'
  | 'no_music'
  | 'ambience_only'
  | 'needs_review'
  | 'stale'

export interface CanonicalMusicUiCueProjection {
  cueId: string
  startFrame: number
  endFrameExclusive: number
  narrativeFunction: string
  cueRole: string
  motifRole: string
  acquisitionDecision: string
  routeKey?: string
  status: 'planned' | 'completed' | 'blocked' | 'failed' | 'skipped'
  selectedAssetCount: number
  reviewRequired: boolean
}

export interface CanonicalMusicUiQaProjection {
  status: 'not_run' | 'pass' | 'needs_review' | 'blocking'
  categories: Array<{
    key: string
    status: 'pass' | 'warning' | 'needs_review' | 'blocking'
    summary: string
  }>
  reviewItems: string[]
}

/**
 * Browser-safe, read-only projection of canonical Music artifacts.
 *
 * It intentionally excludes storage identities, filesystem paths, provider
 * payloads, credentials, Sound operation parameters, and signed URLs.
 */
export interface CanonicalMusicUiProjection {
  schemaVersion: 'canonical-music-ui-projection-v1'
  requestId: string
  skillVersion: string
  manifestHash: string
  status: CanonicalMusicUiStatus
  qualificationStatus: string
  executionEvidence: 'none' | 'planned' | 'fixture' | 'private_internal' | 'production'
  context: {
    storyPurpose: string
    speechEvidence: 'structured' | 'missing'
    naturalAmbience: 'protect' | 'neutral' | 'unknown'
    evidenceSummary: string
    reviewRequired: boolean
  }
  musicNeed: {
    decision: string
    reason: string
    confidencePercent: number
    generationWasAutomaticBecauseNoUpload: false
  }
  soundtrack: {
    cueFamilyStrategy: string
    cueCount: number
    cueDensityPerMinute: number
    overScoringWarnings: string[]
    intentionalSilenceRangeCount: number
  }
  cues: CanonicalMusicUiCueProjection[]
  estimate?: {
    minimumCredits: number
    expectedCredits: number
    maximumCredits: number
    approvalRequired: boolean
    reservationRequired: boolean
    lowerCostAlternatives: string[]
  }
  progress: {
    completedUnits: number
    totalUnits: number
    currentState: 'not_started' | 'planned' | 'in_progress' | 'complete' | 'blocked'
    evidenceLabel: string
  }
  qa: CanonicalMusicUiQaProjection
  handoff: {
    ready: boolean
    selectedAssetCount: number
    processedAssetCount: number
    musicStemCount: number
    intentionalNoMusic: boolean
    ambienceOnly: boolean
    finalMuxRenderExportOutsideMusic: true
  }
  provider: {
    profile: 'google.lyria3.interactions.global.v1beta1'
    attemptCount: number
    evidence: 'none' | 'fixture' | 'live'
    liveActivation: 'blocked_pending_external_evidence' | 'active'
  }
  revisionOptions: string[]
  readOnlyProjection: true
}
