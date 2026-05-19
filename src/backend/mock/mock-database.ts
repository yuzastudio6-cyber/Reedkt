import type {
  AgentOutputRecord,
  AgentRunRecord,
  AmbientSoundPlanRecord,
  AudioEnvironmentAnalysisRecord,
  CaptionPlanRecord,
  CaptionTimingPlanRecord,
  ChatActionRecord,
  ChatMessageRecord,
  ChatSessionRecord,
  CreditApprovalRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditGrantRecord,
  CreditLedgerEntryRecord,
  CreditReservationRecord,
  CreditWalletRecord,
  CutDecisionRecord,
  CutTimingPlanRecord,
  EditInstructionRecord,
  EditPlanRecord,
  EditPlanSegmentRecord,
  EditQualityCheckRecord,
  EditQualityProfileRecord,
  GeneratedAssetRecord,
  GeneratedAssetTimingMapRecord,
  GenerationProviderRecord,
  GenerationRequestInputRecord,
  GenerationRequestRecord,
  InlineChatCardRecord,
  IntentAnalysisRecord,
  JobBatchRecord,
  JobDependencyRecord,
  JobEventRecord,
  JobRecord,
  MasterTimingMapRecord,
  MusicBeatGridRecord,
  MusicDuckingTimingPlanRecord,
  MediaAssetRecord,
  MusicPlanRecord,
  PacingAnalysisRecord,
  PreviewReviewRecord,
  ProjectRecord,
  QAReportRecord,
  ReferenceAssetRecord,
  ReferenceDNARecord,
  RenderJobInputRecord,
  RenderJobRecord,
  RenderRecord,
  RenderTimingManifestRecord,
  RevisionRequestItemRecord,
  RevisionRequestRecord,
  SFXAdjustmentDecisionRecord,
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXLibraryCandidateRecord,
  SFXLibrarySearchRecord,
  SFXMixPlanRecord,
  SFXMockWaveformAnalysisRecord,
  SFXPromptAdapterTestRecord,
  SFXPromptPlanRecord,
  SFXProvenanceReviewRecord,
  SFXProviderRouteRecord,
  SFXQAReportRecord,
  SFXRegenerationDecisionRecord,
  SFXReplacementDecisionRecord,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
  SFXUsageLearningRecord,
  SFXUsageRecord,
  SignatureRouteRecord,
  SoundEffectPlanRecord,
  SoundSyncTimingIntegrationRecord,
  SourceClipSequenceItem,
  SourceClipSequenceRecord,
  SourceSequenceMapItemRecord,
  SourceSequenceMapRecord,
  StoryBeatMapRecord,
  StoryBeatRecord,
  StoryTimingQACheckRecord,
  StoryTimingSegmentRecord,
  StrokeMotionBeatRecord,
  StrokeMotionCharacterRecord,
  StrokeMotionGenerationSpecRecord,
  StrokeMotionMeaningExpansionRecord,
  StrokeMotionPlanRecord,
  StrokeMotionStoryboardFrameRecord,
  StrokeMotionSymbolRecord,
  StrokeMotionTimingAnchorRecord,
  StrokeMotionTransitionRecord,
  TimingAnchorRecord,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingDependencyRecord,
  TimingEventRecord,
  TransitionPlanRecord,
  UserRecord,
  WorkspaceRecord,
} from '../../types'
import type { ExportRecord } from '../../types/review-render-export'
import type { RecommendedEditStructureRecord } from '../../types/planning'

export const MOCK_NOW = '2026-05-13T12:00:00.000Z'

export interface MockDatabase {
  users: UserRecord[]
  workspaces: WorkspaceRecord[]
  projects: ProjectRecord[]
  chatSessions: ChatSessionRecord[]
  chatMessages: ChatMessageRecord[]
  chatActions: ChatActionRecord[]
  inlineChatCards: InlineChatCardRecord[]
  mediaAssets: MediaAssetRecord[]
  sourceClipSequences: SourceClipSequenceRecord[]
  sourceClipSequenceItems: SourceClipSequenceItem[]
  referenceAssets: ReferenceAssetRecord[]
  referenceDna: ReferenceDNARecord[]
  intentAnalyses: IntentAnalysisRecord[]
  sourceSequenceMaps: SourceSequenceMapRecord[]
  sourceSequenceMapItems: SourceSequenceMapItemRecord[]
  recommendedEditStructures: RecommendedEditStructureRecord[]
  editPlans: EditPlanRecord[]
  storyBeatMaps: StoryBeatMapRecord[]
  storyBeats: StoryBeatRecord[]
  editPlanSegments: EditPlanSegmentRecord[]
  masterTimingMaps: MasterTimingMapRecord[]
  storyTimingSegments: StoryTimingSegmentRecord[]
  timingAnchors: TimingAnchorRecord[]
  timingEvents: TimingEventRecord[]
  timingDependencies: TimingDependencyRecord[]
  timingConflicts: TimingConflictRecord[]
  timingConflictResolutions: TimingConflictResolutionRecord[]
  storyTimingQAChecks: StoryTimingQACheckRecord[]
  renderTimingManifests: RenderTimingManifestRecord[]
  captionTimingPlans: CaptionTimingPlanRecord[]
  cutTimingPlans: CutTimingPlanRecord[]
  musicBeatGrids: MusicBeatGridRecord[]
  musicDuckingTimingPlans: MusicDuckingTimingPlanRecord[]
  soundSyncTimingIntegrations: SoundSyncTimingIntegrationRecord[]
  signatureRoutes: SignatureRouteRecord[]
  editInstructions: EditInstructionRecord[]
  editQualityProfiles: EditQualityProfileRecord[]
  pacingAnalysis: PacingAnalysisRecord[]
  cutDecisions: CutDecisionRecord[]
  transitionPlans: TransitionPlanRecord[]
  audioEnvironmentAnalysis: AudioEnvironmentAnalysisRecord[]
  ambientSoundPlans: AmbientSoundPlanRecord[]
  musicPlans: MusicPlanRecord[]
  soundEffectPlans: SoundEffectPlanRecord[]
  sfxEventPlans: SFXEventPlanRecord[]
  sfxProviderRoutes: SFXProviderRouteRecord[]
  sfxPromptPlans: SFXPromptPlanRecord[]
  sfxPromptAdapterTests: SFXPromptAdapterTestRecord[]
  sfxGeneratedAssets: SFXGeneratedAssetRecord[]
  sfxWaveformAnalyses: SFXMockWaveformAnalysisRecord[]
  sfxTrimPlans: SFXTrimPlanRecord[]
  sfxTimingAlignments: SFXTimingAlignmentRecord[]
  sfxMixPlans: SFXMixPlanRecord[]
  sfxQAReports: SFXQAReportRecord[]
  sfxRegenerationDecisions: SFXRegenerationDecisionRecord[]
  sfxAdjustmentDecisions: SFXAdjustmentDecisionRecord[]
  sfxReplacementDecisions: SFXReplacementDecisionRecord[]
  sfxLibraryCandidates: SFXLibraryCandidateRecord[]
  sfxUsageRecords: SFXUsageRecord[]
  sfxProvenanceReviews: SFXProvenanceReviewRecord[]
  sfxLibrarySearchRecords: SFXLibrarySearchRecord[]
  sfxUsageLearningRecords: SFXUsageLearningRecord[]
  captionPlans: CaptionPlanRecord[]
  editQualityChecks: EditQualityCheckRecord[]
  strokeMotionPlans: StrokeMotionPlanRecord[]
  strokeMotionMeaningExpansions: StrokeMotionMeaningExpansionRecord[]
  strokeMotionBeats: StrokeMotionBeatRecord[]
  strokeMotionCharacters: StrokeMotionCharacterRecord[]
  strokeMotionSymbols: StrokeMotionSymbolRecord[]
  strokeMotionTransitions: StrokeMotionTransitionRecord[]
  strokeMotionTimingAnchors: StrokeMotionTimingAnchorRecord[]
  strokeMotionStoryboardFrames: StrokeMotionStoryboardFrameRecord[]
  strokeMotionGenerationSpecs: StrokeMotionGenerationSpecRecord[]
  creditWallets: CreditWalletRecord[]
  creditGrants: CreditGrantRecord[]
  creditLedgerEntries: CreditLedgerEntryRecord[]
  creditEstimates: CreditEstimateRecord[]
  creditEstimateLineItems: CreditEstimateLineItemRecord[]
  creditApprovals: CreditApprovalRecord[]
  creditReservations: CreditReservationRecord[]
  jobBatches: JobBatchRecord[]
  jobs: JobRecord[]
  jobDependencies: JobDependencyRecord[]
  jobEvents: JobEventRecord[]
  agentRuns: AgentRunRecord[]
  agentOutputs: AgentOutputRecord[]
  generationProviders: GenerationProviderRecord[]
  generationRequests: GenerationRequestRecord[]
  generationRequestInputs: GenerationRequestInputRecord[]
  generatedAssets: GeneratedAssetRecord[]
  generatedAssetTimingMaps: GeneratedAssetTimingMapRecord[]
  renderJobs: RenderJobRecord[]
  renderJobInputs: RenderJobInputRecord[]
  renders: RenderRecord[]
  previewReviews: PreviewReviewRecord[]
  qaReports: QAReportRecord[]
  revisionRequests: RevisionRequestRecord[]
  revisionRequestItems: RevisionRequestItemRecord[]
  exports: ExportRecord[]
}

export type MockCollectionName = keyof MockDatabase
type MockCollectionItem<T> = T extends Array<infer Item> ? Item : never

const counters = new Map<string, number>()

export function createMockId(prefix: string): string {
  const next = (counters.get(prefix) ?? 0) + 1
  counters.set(prefix, next)
  return `mock-${prefix}-${String(next).padStart(4, '0')}`
}

export function resetMockIds(): void {
  counters.clear()
}

export function nowIso(): string {
  return MOCK_NOW
}

export function createMockDatabase(): MockDatabase {
  return {
    users: [],
    workspaces: [],
    projects: [],
    chatSessions: [],
    chatMessages: [],
    chatActions: [],
    inlineChatCards: [],
    mediaAssets: [],
    sourceClipSequences: [],
    sourceClipSequenceItems: [],
    referenceAssets: [],
    referenceDna: [],
    intentAnalyses: [],
    sourceSequenceMaps: [],
    sourceSequenceMapItems: [],
    recommendedEditStructures: [],
    editPlans: [],
    storyBeatMaps: [],
    storyBeats: [],
    editPlanSegments: [],
    masterTimingMaps: [],
    storyTimingSegments: [],
    timingAnchors: [],
    timingEvents: [],
    timingDependencies: [],
    timingConflicts: [],
    timingConflictResolutions: [],
    storyTimingQAChecks: [],
    renderTimingManifests: [],
    captionTimingPlans: [],
    cutTimingPlans: [],
    musicBeatGrids: [],
    musicDuckingTimingPlans: [],
    soundSyncTimingIntegrations: [],
    signatureRoutes: [],
    editInstructions: [],
    editQualityProfiles: [],
    pacingAnalysis: [],
    cutDecisions: [],
    transitionPlans: [],
    audioEnvironmentAnalysis: [],
    ambientSoundPlans: [],
    musicPlans: [],
    soundEffectPlans: [],
    sfxEventPlans: [],
    sfxProviderRoutes: [],
    sfxPromptPlans: [],
    sfxPromptAdapterTests: [],
    sfxGeneratedAssets: [],
    sfxWaveformAnalyses: [],
    sfxTrimPlans: [],
    sfxTimingAlignments: [],
    sfxMixPlans: [],
    sfxQAReports: [],
    sfxRegenerationDecisions: [],
    sfxAdjustmentDecisions: [],
    sfxReplacementDecisions: [],
    sfxLibraryCandidates: [],
    sfxUsageRecords: [],
    sfxProvenanceReviews: [],
    sfxLibrarySearchRecords: [],
    sfxUsageLearningRecords: [],
    captionPlans: [],
    editQualityChecks: [],
    strokeMotionPlans: [],
    strokeMotionMeaningExpansions: [],
    strokeMotionBeats: [],
    strokeMotionCharacters: [],
    strokeMotionSymbols: [],
    strokeMotionTransitions: [],
    strokeMotionTimingAnchors: [],
    strokeMotionStoryboardFrames: [],
    strokeMotionGenerationSpecs: [],
    creditWallets: [],
    creditGrants: [],
    creditLedgerEntries: [],
    creditEstimates: [],
    creditEstimateLineItems: [],
    creditApprovals: [],
    creditReservations: [],
    jobBatches: [],
    jobs: [],
    jobDependencies: [],
    jobEvents: [],
    agentRuns: [],
    agentOutputs: [],
    generationProviders: [],
    generationRequests: [],
    generationRequestInputs: [],
    generatedAssets: [],
    generatedAssetTimingMaps: [],
    renderJobs: [],
    renderJobInputs: [],
    renders: [],
    previewReviews: [],
    qaReports: [],
    revisionRequests: [],
    revisionRequestItems: [],
    exports: [],
  }
}

export function insertMockRecord<K extends MockCollectionName>(
  db: MockDatabase,
  collection: K,
  record: MockCollectionItem<MockDatabase[K]>,
): MockCollectionItem<MockDatabase[K]> {
  db[collection].push(record as never)
  return record
}

export function findMockRecord<K extends MockCollectionName>(
  db: MockDatabase,
  collection: K,
  id: string,
): MockCollectionItem<MockDatabase[K]> | undefined {
  return db[collection].find((record) => {
    const maybeRecord = record as { id?: string }
    return maybeRecord.id === id
  }) as MockCollectionItem<MockDatabase[K]> | undefined
}
