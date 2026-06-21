export type UnmergedOwnerEvidenceLane =
  | 'track_b_media_oss'
  | 'track_a_render_export_native_container'
  | 'ai_graphics_static_motion_chart_model_tools'
  | 'sound_music_audio_sfx_soundsync'
  | 'web_capture'
  | 'map_geospatial'
  | 'worker_runtime'
  | 'supabase_runtime_tables'
  | 'tool_calling'
  | 'unknown'

export type UnmergedOwnerEvidenceType =
  | 'install_proof_candidate'
  | 'runtime_proof_candidate'
  | 'owner_registry_candidate'
  | 'capability_card_candidate'
  | 'adapter_candidate'
  | 'docker_requirements_candidate'
  | 'blocker_resolution_candidate'
  | 'qa_review_candidate'
  | 'duplicate_risk_candidate'

export type UnmergedOwnerEvidenceSourceTruthStatus =
  | 'open_pr_candidate_evidence'
  | 'merged_source_of_truth'
  | 'rejected_or_closed_not_source'
  | 'unknown'

export type UnmergedOwnerEvidenceDuplicateRisk =
  | 'none'
  | 'possible_duplicate'
  | 'likely_duplicate'
  | 'wait_for_owner_merge'

export type UnmergedOwnerEvidenceRecommendedAction =
  | 'reference_only'
  | 'wait_for_merge'
  | 'do_not_duplicate'
  | 'reconcile_after_merge'
  | 'safe_to_continue'

export interface UnmergedOwnerEvidencePrInputFile {
  path?: string
  filename?: string
}

export interface UnmergedOwnerEvidencePrInputLabel {
  name?: string
}

export interface UnmergedOwnerEvidencePrInput {
  number?: number
  prNumber?: number
  title?: string
  prTitle?: string
  state?: string
  prState?: string
  isDraft?: boolean
  draft?: boolean
  mergeable?: string | boolean | null
  baseRefName?: string
  baseBranch?: string
  headRefName?: string
  headBranch?: string
  updatedAt?: string
  body?: string
  files?: readonly (string | UnmergedOwnerEvidencePrInputFile)[]
  affectedPaths?: readonly string[]
  labels?: readonly (string | UnmergedOwnerEvidencePrInputLabel)[]
}

export interface UnmergedOwnerEvidenceItem {
  prNumber: number
  prTitle: string
  prState: string
  draft: boolean
  mergeable: string | boolean | null
  baseBranch: string
  headBranch: string
  ownerLane: UnmergedOwnerEvidenceLane
  affectedTools: readonly string[]
  affectedPaths: readonly string[]
  evidenceType: UnmergedOwnerEvidenceType
  sourceTruthStatus: UnmergedOwnerEvidenceSourceTruthStatus
  duplicateRisk: UnmergedOwnerEvidenceDuplicateRisk
  recommendedAction: UnmergedOwnerEvidenceRecommendedAction
  notes: readonly string[]
}

export interface UnmergedOwnerDuplicateRiskFinding {
  prNumber: number
  prTitle: string
  ownerLane: UnmergedOwnerEvidenceLane
  affectedTools: readonly string[]
  duplicateRisk: UnmergedOwnerEvidenceDuplicateRisk
  recommendedAction: UnmergedOwnerEvidenceRecommendedAction
  reason: string
}

export interface UnmergedOwnerEvidenceCollectionSummary {
  evidenceItems: readonly UnmergedOwnerEvidenceItem[]
  duplicateRiskFindings: readonly UnmergedOwnerDuplicateRiskFinding[]
  openPrEvidenceCount: number
  mergedRecentEvidenceCount: number
  duplicateRiskCount: number
  waitForMergeCount: number
  ownerLanesRepresented: readonly UnmergedOwnerEvidenceLane[]
  recommendedActions: readonly UnmergedOwnerEvidenceRecommendedAction[]
}
