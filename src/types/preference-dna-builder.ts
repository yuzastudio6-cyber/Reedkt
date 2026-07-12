export type PreferenceDNALayerId =
  | 'content_type'
  | 'structure_story_flow'
  | 'pacing_timing'
  | 'speech_caption_behavior'
  | 'visual_scene_language'
  | 'music_soundsync'
  | 'sfx_sound_design'
  | 'graphic_design_visualexplain'
  | 'ui_document_card_treatment'
  | 'broll_shot_language'
  | 'color_tone_space'
  | 'signature_system_policy'
  | 'edit_quality_preference'
  | 'cost_compute_policy'
  | 'transferable_rules'
  | 'non_transferable_details'
  | 'do_not_copy_rules'
  | 'qa_confidence'

export type PreferenceDNAEvidenceSource =
  | 'preference_video_study'
  | 'media_extraction'
  | 'speech_transcript'
  | 'visual_scene'
  | 'audio_soundsync'
  | 'graphic_design_understanding'
  | 'user_chat_description'
  | 'previous_approved_edit'
  | 'mock_fixture'

export type PreferenceDNAConfidenceBand =
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high'

export type PreferenceDNATransferability =
  | 'transferable'
  | 'partially_transferable'
  | 'non_transferable'
  | 'do_not_copy'
  | 'requires_user_review'

export type PreferenceDNABuildStatus =
  | 'mock_ready'
  | 'blocked_missing_evidence'
  | 'blocked_missing_do_not_copy'
  | 'requires_user_review'
  | 'failed_validation'

export type PreferenceDNABuilderRuntimeMode =
  | 'mock_only'
  | 'qwen_bridge_only'
  | 'qwen_runtime_future'
  | 'disabled'

export type PreferenceDNAConflictSeverity =
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type PreferenceDNASignalCandidateStrength =
  | 'soft'
  | 'strong'
  | 'must_follow'
  | 'avoid'
  | 'do_not_copy'

export type PreferenceDNABuilderNextStep =
  | 'build_preference_dna_qa_guardrails'
  | 'wire_dna_into_create_preference_flow'
  | 'persist_preference_dna_after_supabase_gates'
  | 'manual_review'

export interface PreferenceDNALayerDefinition {
  layerId: PreferenceDNALayerId
  title: string
  purpose: string
  expectedEvidenceSources: PreferenceDNAEvidenceSource[]
  producesSignals: boolean
  producesContractHints: boolean
  requiresDoNotCopyReview: boolean
}

export interface PreferenceDNAEvidenceRef {
  id: string
  source: PreferenceDNAEvidenceSource
  sourceRecordId?: string
  evidenceKind: string
  summary: string
  confidence: number
  layerHints: PreferenceDNALayerId[]
  transferability: PreferenceDNATransferability
  mockOnly: boolean
  warnings: string[]
}

export interface PreferenceDNAEvidenceAggregationResult {
  evidenceRefs: PreferenceDNAEvidenceRef[]
  groupedByLayer: Record<PreferenceDNALayerId, PreferenceDNAEvidenceRef[]>
  warnings: string[]
  mockOnly: true
}

export interface PreferenceDNALayerRecord {
  id: string
  layerId: PreferenceDNALayerId
  title: string
  summary: string
  evidenceRefs: PreferenceDNAEvidenceRef[]
  confidence: number
  confidenceBand: PreferenceDNAConfidenceBand
  transferability: PreferenceDNATransferability
  mustFollowRules: string[]
  avoidRules: string[]
  doNotCopyRules: string[]
  warnings: string[]
  mockOnly: boolean
}

export interface PreferenceDNAConflictRecord {
  id: string
  layerIds: PreferenceDNALayerId[]
  severity: PreferenceDNAConflictSeverity
  title: string
  description: string
  recommendedResolution: string
  requiresUserReview: boolean
  mockOnly: boolean
}

export interface PreferenceDNASignalCandidate {
  id: string
  category: string
  target: string
  value: string
  strength: PreferenceDNASignalCandidateStrength
  sourceLayerId: PreferenceDNALayerId
  evidenceRefIds: string[]
  confidence: number
  mockOnly: boolean
}

export interface PreferenceDNAContractHint {
  id: string
  targetPath: string
  summary: string
  suggestedValue: unknown
  sourceLayerId: PreferenceDNALayerId
  confidence: number
  requiresUserReview: boolean
  mockOnly: boolean
}

export interface PreferenceDNAVersionMetadataCandidate {
  id: string
  preferenceNameSuggestion: string
  descriptionSuggestion: string
  tags: string[]
  sourceVideoDNA: {
    sourceKind: string
    sourceLabel: string
    adaptedNotCopied: true
    summary: string
  }
  dnaLayerIds: PreferenceDNALayerId[]
  metadata: Record<string, unknown>
  mockOnly: boolean
}

export interface PreferenceDNAQwenBridgePackage {
  id: string
  dnaBuildId: string
  reasoningTaskType: 'preference_video_dna_reasoning'
  roleId: 'preference_dna_analyst'
  promptPackageId?: string
  promptPackage?: { id: string; [key: string]: unknown }
  structuredInputs: Record<string, unknown>
  evidenceSummary: string
  requiredOutputSchemaName: string
  doNotCopyRules: string[]
  providerCallMade: false
  qwenCallMade: false
  mockOnly: true
  warnings: string[]
}

export interface PreferenceDNABuildResult {
  id: string
  sourceLabel: string
  status: PreferenceDNABuildStatus
  runtimeMode: PreferenceDNABuilderRuntimeMode
  layers: PreferenceDNALayerRecord[]
  evidenceRefs: PreferenceDNAEvidenceRef[]
  conflicts: PreferenceDNAConflictRecord[]
  signalCandidates: PreferenceDNASignalCandidate[]
  contractHints: PreferenceDNAContractHint[]
  versionMetadataCandidate: PreferenceDNAVersionMetadataCandidate
  qwenBridgePackage: PreferenceDNAQwenBridgePackage
  overallConfidence: number
  overallConfidenceBand: PreferenceDNAConfidenceBand
  requiresUserReview: boolean
  summary: string
  warnings: string[]
  mockOnly: boolean
  adaptedNotCopied: true
  providerCallMade: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export interface PreferenceDNABuildValidationResult {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
  providerCallMade: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export interface PreferenceDNASummary {
  title: string
  summary: string
  bullets: string[]
  warnings: string[]
  nextStep: PreferenceDNABuilderNextStep
  mockOnly: true
}

export interface MockPreferenceDNAScenario {
  id: string
  title: string
  inputKind: PreferenceDNAEvidenceSource | 'full_mock_evidence' | 'validation'
  expectedStatus: PreferenceDNABuildStatus
  expectedLayerCount: number
  expectedRequiresUserReview: boolean
  expectedProviderCallMade: false
  expectedWorkerJobCreated: false
  expectedRenderJobCreated: false
  mockOnly: true
}

export interface MockPreferenceDNAOrchestratorResult {
  evidenceRefs: PreferenceDNAEvidenceRef[]
  layers: PreferenceDNALayerRecord[]
  conflicts: PreferenceDNAConflictRecord[]
  signalCandidates: PreferenceDNASignalCandidate[]
  contractHints: PreferenceDNAContractHint[]
  versionMetadataCandidate: PreferenceDNAVersionMetadataCandidate
  qwenBridgePackage: PreferenceDNAQwenBridgePackage
  validation: PreferenceDNABuildValidationResult
  summary: PreferenceDNASummary
  warnings: string[]
  nextStep: PreferenceDNABuilderNextStep
}

export const REEDITPRO_PREFERENCE_DNA_NO_PROVIDER_RULE =
  'RP-PREF-VIDEO-07 builds mock Preference DNA packages only; it must not call Qwen, DeepSeek, providers, workers, render, or credits.'

export const REEDITPRO_PREFERENCE_DNA_ADAPT_NOT_COPY_RULE =
  'Preference DNA adapts editing language and transferable rules; it must not copy exact shots, timing, music, SFX, layouts, brand identity, or creator identity.'

export const REEDITPRO_PREFERENCE_DNA_EVIDENCE_FIRST_RULE =
  'Preference DNA must be grounded in structured evidence refs, not freeform assumptions.'
