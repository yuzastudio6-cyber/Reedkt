import { createHash } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, mkdir, mkdtemp, open, realpath, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type {
  PreferenceTechnicalAudioLowLevelEvidence,
  PreferenceTechnicalCaptionRegionSignalEvidence,
  PreferenceTechnicalColorSignalEvidence,
  PreferenceTechnicalEdgeWidthSignalEvidence,
  PreferenceTechnicalMotionSignalEvidence,
  PreferenceTechnicalSourceConditionEvidence,
  PreferenceTechnicalStudyStageId,
  PreferenceTechnicalStudyUsageEvidence,
} from '../../src/types/edit-reference'
import type { RuntimeEnv } from '../config/env'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import type {
  TranscriptArtifactPayload,
  WordTimestampArtifactPayload,
} from '../workers/speech/speech-worker-types'
import {
  buildFFmpegAudioLoudnessCommand,
  buildFFmpegAudioTrimCommand,
  parseLoudnessOutput,
  runFFmpegAudioCommand,
} from '../workers/audio/ffmpeg-audio-adapter'
import { runMediaAnalysisFoundation } from '../workers/media/media-analysis-foundation-runner'
import type { MediaFoundationArtifactSummary } from '../workers/media/media-worker-types'
import {
  createBlockedEditReferenceAudioLowLevelResult,
  createNotRunEditReferenceAudioLowLevelResult,
  runEditReferenceAudioLowLevelStudy,
} from './edit-reference-audio-low-level-study'
import {
  createBlockedEditReferenceCaptionRegionSignalResult,
  createNotRunEditReferenceCaptionRegionSignalResult,
  runEditReferenceCaptionRegionSignalStudy,
} from './edit-reference-caption-region-signal-study'
import {
  createBlockedEditReferenceColorSignalResult,
  createNotRunEditReferenceColorSignalResult,
  runEditReferenceColorSignalStudy,
} from './edit-reference-color-signal-study'
import {
  createBlockedEditReferenceEdgeWidthSignalResult,
  createNotRunEditReferenceEdgeWidthSignalResult,
  runEditReferenceEdgeWidthSignalStudy,
} from './edit-reference-edge-width-signal-study'
import {
  createBlockedEditReferenceMotionSignalResult,
  createNotRunEditReferenceMotionSignalResult,
  runEditReferenceMotionSignalStudy,
} from './edit-reference-motion-signal-study'
import {
  createNotRunEditReferenceSceneBoundaryResult,
  runEditReferenceSceneBoundaryStudy,
  type EditReferenceSceneBoundaryStudyResult,
} from './edit-reference-scene-boundary-study'
import {
  createBlockedEditReferenceSourceConditionResult,
  createNotRunEditReferenceSourceConditionResult,
  runEditReferenceSourceConditionStudy,
} from './edit-reference-source-condition-study'
import { createBackendLocalUnmeteredTechnicalStudyUsage } from './edit-reference-technical-study-usage-contract'
import {
  createEditReferenceQwenVisualLanguageAdapter,
  hashEditReferenceVisualLanguageEvidenceManifest,
  hashEditReferenceVisualLanguageFrameManifest,
  type EditReferenceVisualLanguageProductionUsageAuthority,
} from './edit-reference-qwen-visual-language-adapter'
import { createEditReferenceReviewedLocalAstAudioSetProvider } from './edit-reference-reviewed-local-ast-audioset-provider'
import { validateEditReferenceReviewedLocalAstAudioSetRuntime } from './edit-reference-reviewed-local-ast-audioset-runtime'
import {
  createEditReferenceQwenColorTreatmentAdapter,
  hashEditReferenceColorTreatmentEvidenceManifest,
  hashEditReferenceColorTreatmentFrameManifest,
  hashEditReferenceTechnicalColorEvidence,
  type EditReferenceColorTreatmentProductionUsageAuthority,
} from './edit-reference-qwen-color-treatment-adapter'
import {
  createEditReferenceQwenGraphicsMotionAdapter,
  hashEditReferenceGraphicsMotionEvidenceManifest,
  hashEditReferenceGraphicsMotionFrameManifest,
  hashEditReferenceTechnicalMotionEvidence,
  type EditReferenceGraphicsMotionProductionUsageAuthority,
} from './edit-reference-qwen-graphics-motion-adapter'
import {
  createEditReferenceQwenCaptionDesignAdapter,
  hashEditReferenceCaptionDesignEvidenceManifest,
  hashEditReferenceCaptionDesignFrameManifest,
  type EditReferenceCaptionDesignProductionUsageAuthority,
} from './edit-reference-qwen-caption-design-adapter'
import {
  createEditReferenceQwenStoryEditorialAdapter,
  createEditReferenceRoutedStoryEditorialAdapter,
  hashEditReferenceStoryEditorialStructuredContext,
  type EditReferenceStoryEditorialProductionUsageAuthority,
} from './edit-reference-qwen-story-editorial-adapter'
import {
  createEditReferenceQwenSpeechPacingAdapter,
  createEditReferenceRoutedSpeechPacingAdapter,
  type EditReferenceSpeechPacingProductionUsageAuthority,
} from './edit-reference-qwen-speech-pacing-adapter'
import {
  resolveEditReferenceReasoningRouteAuthorizationFailClosed,
  resolveEditReferenceReasoningRouteProviderFailClosed,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorizationResolver,
  type EditReferenceReasoningRouteProviderResolver,
} from './edit-reference-reasoning-route-authorization'
import {
  createEditReferenceAudioSoundDesignAdapter,
  hashEditReferenceAudioSoundDesignAudioManifest,
  hashEditReferenceAudioSoundDesignEvidenceManifest,
  hashEditReferenceAudioSoundDesignTechnicalLoudnessAuthority,
  hashEditReferenceAudioSoundDesignTechnicalLowLevelAuthority,
  type EditReferenceAudioSoundDesignProductionUsageAuthority,
} from './edit-reference-audio-sound-design-adapter'
import {
  EDIT_REFERENCE_COLOR_TREATMENT_STUDY_REQUEST_VERSION,
  type EditReferenceColorTreatmentFrameEvidence,
  type EditReferenceColorTreatmentStudyRequest,
  type EditReferenceColorTreatmentStudyResult,
} from './edit-reference-color-treatment-study-contract'
import {
  EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_REQUEST_VERSION,
  type EditReferenceVisualFrameEvidence,
  type EditReferenceVisualLanguageStudyRequest,
  type EditReferenceVisualLanguageStudyResult,
} from './edit-reference-visual-language-study-contract'
import {
  EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_REQUEST_VERSION,
  type EditReferenceGraphicsMotionFrameEvidence,
  type EditReferenceGraphicsMotionStudyRequest,
  type EditReferenceGraphicsMotionStudyResult,
} from './edit-reference-graphics-motion-study-contract'
import {
  EDIT_REFERENCE_CAPTION_DESIGN_STUDY_REQUEST_VERSION,
  type EditReferenceCaptionDesignStudyAdapter,
  type EditReferenceCaptionDesignFrameEvidence,
  type EditReferenceCaptionDesignStudyRequest,
  type EditReferenceCaptionDesignStudyResult,
} from './edit-reference-caption-design-study-contract'
import {
  hashEditReferenceCaptionOcrStudyResult,
  validateEditReferenceCaptionOcrStudyRequest,
  validateEditReferenceCaptionOcrStudyResult,
  type EditReferenceAnalyzedCaptionOcrStudyResult,
  type EditReferenceCaptionOcrStudyRequest,
} from './edit-reference-caption-ocr-study-contract'
import {
  EDIT_REFERENCE_STORY_EDITORIAL_STUDY_REQUEST_VERSION,
  hashEditReferenceStoryEditorialStudyRequest,
  type EditReferenceStoryEditorialEvidenceManifest,
  type EditReferenceStoryEditorialStudyRequest,
  type EditReferenceStoryEditorialStudyResult,
} from './edit-reference-story-editorial-study-contract'
import {
  EDIT_REFERENCE_SPEECH_PACING_STUDY_REQUEST_VERSION,
  hashEditReferenceSpeechPacingStudyRequest,
  type EditReferenceSpeechPacingEvidenceManifest,
  type EditReferenceSpeechPacingSegmentTimingMode,
  type EditReferenceSpeechPacingSpeakerSegmentationMode,
  type EditReferenceSpeechPacingStudyRequest,
  type EditReferenceSpeechPacingStudyResult,
  type EditReferenceSpeechPacingWordTimingMode,
} from './edit-reference-speech-pacing-study-contract'
import {
  EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_REQUEST_VERSION,
  type EditReferenceAudioSoundDesignEvidenceManifest,
  type EditReferenceAudioSoundDesignStudyRequest,
  type EditReferenceAudioSoundDesignStudyResult,
  type EditReferenceAudioSoundDesignTechnicalLoudnessAuthority,
  type EditReferenceAudioSoundDesignTechnicalLowLevelAuthority,
} from './edit-reference-audio-sound-design-study-contract'
import type { EditReferenceSemanticStudyResult } from './edit-reference-semantic-study-contract'
import type { QwenVisualUnderstandingProvider } from '../services/qwen-visual-understanding-provider'
import type { EditReferenceAudioSoundDesignProvider } from '../services/edit-reference-audio-sound-design-provider'
import type {
  EditReferenceStoryEditorialReasoningProvider,
  QwenStoryEditorialEvidenceItem,
  QwenStoryEditorialStructuredContext,
} from '../services/qwen-story-editorial-provider'
import type {
  EditReferenceSpeechPacingReasoningProvider,
  QwenSpeechPacingEvidenceKind,
  QwenSpeechPacingStructuredContext,
} from '../services/qwen-speech-pacing-provider'

export interface EditReferencePrivateStorageObject {
  id: string
  workspaceId: string
  projectId?: string
  editReferenceId?: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  status: string
}

export interface EditReferenceVisualLanguageProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageAuthority: EditReferenceVisualLanguageProductionUsageAuthority
}

interface EditReferenceVisualLanguageRuntimeIdentity {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
}

export type EditReferenceVisualLanguageRuntimeInput = EditReferenceVisualLanguageRuntimeIdentity & {
  readonly runtimeKind?: 'provider'
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceVisualLanguageProductionAuthority
}

export interface EditReferenceColorTreatmentProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageAuthority: EditReferenceColorTreatmentProductionUsageAuthority
}

interface EditReferenceColorTreatmentRuntimeIdentity {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
}

export type EditReferenceColorTreatmentRuntimeInput = EditReferenceColorTreatmentRuntimeIdentity & {
  readonly runtimeKind?: 'provider'
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceColorTreatmentProductionAuthority
}

export interface EditReferenceGraphicsMotionProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageAuthority: EditReferenceGraphicsMotionProductionUsageAuthority
}

interface EditReferenceGraphicsMotionRuntimeIdentity {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
}

export type EditReferenceGraphicsMotionRuntimeInput = EditReferenceGraphicsMotionRuntimeIdentity & {
  readonly runtimeKind?: 'provider'
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceGraphicsMotionProductionAuthority
}

export interface EditReferenceCaptionDesignProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageAuthority: EditReferenceCaptionDesignProductionUsageAuthority
}

export interface EditReferenceCaptionDesignOcrFrameAuthority {
  readonly privateFrameArtifactId: string
  readonly frameEvidenceId: string
  readonly localFilePath: string
  readonly frameChecksumSha256: string
  readonly sourceTimeSeconds: number
  readonly width: number
  readonly height: number
}

export interface EditReferenceCaptionDesignOcrAuthority {
  readonly request: EditReferenceCaptionOcrStudyRequest
  readonly result: EditReferenceAnalyzedCaptionOcrStudyResult
}

export interface EditReferenceCaptionDesignOcrAuthorityResolverInput {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly orchestrationId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceDurationSeconds: number
  readonly framePlanDigestSha256: string
  readonly inputEvidenceIds: readonly string[]
  readonly frames: readonly EditReferenceCaptionDesignOcrFrameAuthority[]
}

export type EditReferenceCaptionDesignOcrAuthorityResolver = (
  input: EditReferenceCaptionDesignOcrAuthorityResolverInput,
) => Promise<EditReferenceCaptionDesignOcrAuthority>

interface EditReferenceCaptionDesignRuntimeIdentity {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
}

export type EditReferenceCaptionDesignRuntimeInput = EditReferenceCaptionDesignRuntimeIdentity & {
  readonly runtimeKind?: 'provider'
  readonly provider: QwenVisualUnderstandingProvider
  readonly captionOcrAuthorityResolver?: EditReferenceCaptionDesignOcrAuthorityResolver
  readonly productionAuthority?: EditReferenceCaptionDesignProductionAuthority
}

export interface EditReferenceStoryEditorialProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly resolveReasoningRouteAuthorization: EditReferenceReasoningRouteAuthorizationResolver<EditReferenceStoryEditorialStudyRequest>
  readonly resolveReasoningProvider?: EditReferenceReasoningRouteProviderResolver<EditReferenceStoryEditorialReasoningProvider>
  readonly usageAuthority: EditReferenceStoryEditorialProductionUsageAuthority
}

export interface EditReferenceStoryEditorialAuthorityEvidenceItem {
  readonly evidenceId: string
  readonly summary: string
  readonly confidence: number
  readonly requiresUserReview: boolean
}

export interface EditReferenceStoryEditorialEvidenceAuthority {
  readonly sourceClaimsPresent: boolean
  readonly transcriptEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
  readonly speechTimingEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
  readonly factSafetyEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
}

export interface EditReferenceStoryEditorialEvidenceAuthorityResolverInput {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceEvidenceId: string
  readonly audioPresence: 'present' | 'absent'
}

export type EditReferenceStoryEditorialEvidenceAuthorityResolver = (
  input: EditReferenceStoryEditorialEvidenceAuthorityResolverInput,
) => Promise<EditReferenceStoryEditorialEvidenceAuthority>

export interface EditReferenceStoryEditorialRuntimeInput {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
  /** Reviewed local analyzer in controlled tests; Qwen provider only for an authorized fallback in production. */
  readonly provider: EditReferenceStoryEditorialReasoningProvider
  readonly evidenceAuthorityResolver?: EditReferenceStoryEditorialEvidenceAuthorityResolver
  readonly productionAuthority?: EditReferenceStoryEditorialProductionAuthority
}

export interface EditReferenceSpeechPacingProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly resolveReasoningRouteAuthorization: EditReferenceReasoningRouteAuthorizationResolver<EditReferenceSpeechPacingStudyRequest>
  readonly resolveReasoningProvider?: EditReferenceReasoningRouteProviderResolver<EditReferenceSpeechPacingReasoningProvider>
  readonly usageAuthority: EditReferenceSpeechPacingProductionUsageAuthority
}

export interface EditReferenceSpeechPacingAuthorityEvidenceItem {
  readonly evidenceId: string
  readonly summary: string
}

export interface EditReferenceSpeechPacingSpeakerSegment {
  readonly speakerId: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly evidenceIds: readonly string[]
}

export interface EditReferenceSpeechPacingTranscriptAuthority {
  readonly privateTranscriptArtifactId: string
  readonly transcriptChecksumSha256: string
  readonly privateTranscriptAccessVerified: true
  readonly privateTranscriptFinalized: true
  readonly transcriptChecksumVerified: true
  readonly transcriptRuntimeExecuted: true
  readonly transcriptQaStatus: 'passed' | 'warning'
  readonly transcriptRuntimeSource: 'verified_local' | 'verified_live'
  readonly transcriptRuntimeId: string
  readonly transcriptRuntimeVersion: string
  readonly transcriptModelManifestId: string
  readonly transcriptExecutionId: string
  readonly transcriptPayload: TranscriptArtifactPayload
  readonly segmentTimingMode: EditReferenceSpeechPacingSegmentTimingMode
  readonly segmentTimingAuthorityVerified: true
  readonly privateWordTimingArtifactId: string | null
  readonly wordTimingChecksumSha256: string | null
  readonly wordTimingPayload: WordTimestampArtifactPayload | null
  readonly wordTimingMode: EditReferenceSpeechPacingWordTimingMode
  readonly wordTimingAuthorityVerified: boolean
  readonly interpolatedWordTimingUsed: false
  readonly privateSpeakerSegmentationArtifactId: string | null
  readonly speakerSegmentationChecksumSha256: string | null
  readonly speakerSegments: readonly EditReferenceSpeechPacingSpeakerSegment[]
  readonly speakerSegmentationMode: EditReferenceSpeechPacingSpeakerSegmentationMode
  readonly speakerSegmentationAuthorityVerified: boolean
  readonly transcriptEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly segmentTimingEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly wordTimingEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly speakerSegmentationEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly factSafetyEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly sourceClaimsPresent: boolean
  readonly temporaryAudioCleaned: true
}

export interface EditReferenceSpeechPacingTranscriptAuthorityResolverInput {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly privateAudioArtifactId: string
  readonly audioChecksumSha256: string
  readonly privateAudioLocalPath: string
  readonly sourceDurationSeconds: number
}

export type EditReferenceSpeechPacingTranscriptAuthorityResolver = (
  input: EditReferenceSpeechPacingTranscriptAuthorityResolverInput,
) => Promise<EditReferenceSpeechPacingTranscriptAuthority>

export interface EditReferenceSpeechPacingRuntimeInput {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  /** Reviewed local analyzer in controlled tests; Qwen provider only for an authorized fallback in production. */
  readonly provider: EditReferenceSpeechPacingReasoningProvider
  readonly transcriptAuthorityResolver?: EditReferenceSpeechPacingTranscriptAuthorityResolver
  readonly productionAuthority?: EditReferenceSpeechPacingProductionAuthority
}

export interface EditReferenceAudioSoundDesignProductionAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly usageAuthority: EditReferenceAudioSoundDesignProductionUsageAuthority
}

interface EditReferenceAudioSoundDesignRuntimeIdentity {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
  readonly sourceAudioRightsBasis: 'user_owned' | 'licensed_or_authorized' | 'reference_only' | 'unknown'
}

export type EditReferenceAudioSoundDesignRuntimeInput = EditReferenceAudioSoundDesignRuntimeIdentity & (
  | {
      readonly runtimeKind?: 'provider'
      readonly provider: EditReferenceAudioSoundDesignProvider
      readonly productionAuthority?: EditReferenceAudioSoundDesignProductionAuthority
    }
  | {
      readonly runtimeKind: 'reviewed_local_ast_audioset'
      readonly manifestPath: string
      readonly modelPath: string
      readonly pythonCommand: string
      readonly runnerScriptPath?: string
      readonly timeoutMs?: number
    }
)

export interface EditReferenceLocalMediaStudyResult {
  referenceAssetId: string
  privateAssetId: string
  sourceEvidenceId: string
  status: 'verified_local' | 'blocked'
  blockerCode?: string
  blockerMessage?: string
  durationSeconds?: number
  width?: number
  height?: number
  fps?: number
  aspectRatio?: string
  rotation?: number
  codecName?: string
  formatName?: string
  sizeBytes?: number
  hasAudio?: boolean
  streamCount?: number
  videoStreams: EditReferenceVideoStreamSummary[]
  audioStreams: EditReferenceAudioStreamSummary[]
  mediaAnalysisReportId?: string
  keyframeSampleCount: number
  keyframeSamplingIntervalSeconds?: number
  shotDetectionStatus: EditReferenceSceneBoundaryStudyResult['status']
  shotBoundaryCount: number
  shotBoundaryTimesSeconds: number[]
  shotDetectionThreshold?: number
  shotDetectionScannedDurationSeconds?: number
  shotDetectionCoverage: EditReferenceSceneBoundaryStudyResult['coverage']
  shotDetectionBlockerCode?: string
  shotDetectionBlockerMessage?: string
  representativeFrameCount: number
  representativeFrameTimes: number[]
  audioExtracted: boolean
  technicalAudio: EditReferenceTechnicalAudioSummary
  technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence
  technicalSourceCondition: PreferenceTechnicalSourceConditionEvidence
  technicalEdgeWidth: PreferenceTechnicalEdgeWidthSignalEvidence
  technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence
  technicalColor: PreferenceTechnicalColorSignalEvidence
  technicalMotion: PreferenceTechnicalMotionSignalEvidence
  technicalStudyUsage: PreferenceTechnicalStudyUsageEvidence
  toolIds: string[]
  fileBytesRead: boolean
  mediaProcessingStarted: boolean
  rawFramesPersisted: false
  rawProviderPayloadPersisted: false
  visualLanguageStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  visualLanguageStudy?: EditReferenceVisualLanguageStudyResult
  visualLanguageBlockerCode?: string
  visualLanguageBlockerMessage?: string
  colorTreatmentStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  colorTreatmentStudy?: EditReferenceColorTreatmentStudyResult
  colorTreatmentBlockerCode?: string
  colorTreatmentBlockerMessage?: string
  graphicsMotionStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  graphicsMotionStudy?: EditReferenceGraphicsMotionStudyResult
  graphicsMotionBlockerCode?: string
  graphicsMotionBlockerMessage?: string
  captionDesignStudyStatus: 'analyzed' | 'observed_absent' | 'blocked' | 'not_run'
  captionDesignStudy?: EditReferenceCaptionDesignStudyResult
  captionDesignObservedAbsence?: EditReferenceCaptionDesignObservedAbsence
  captionDesignBlockerCode?: string
  captionDesignBlockerMessage?: string
  storyEditorialStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  storyEditorialStudy?: EditReferenceStoryEditorialStudyResult
  storyEditorialBlockerCode?: string
  storyEditorialBlockerMessage?: string
  speechPacingStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  speechPacingStudy?: EditReferenceSpeechPacingStudyResult
  speechPacingBlockerCode?: string
  speechPacingBlockerMessage?: string
  audioSoundDesignStudyStatus: 'analyzed' | 'blocked' | 'not_run'
  audioSoundDesignStudy?: EditReferenceAudioSoundDesignStudyResult
  audioSoundDesignBlockerCode?: string
  audioSoundDesignBlockerMessage?: string
  technicalWarnings: string[]
  warnings: string[]
}

export interface EditReferenceVideoStreamSummary {
  streamIndex: number
  codecName: string
  width: number
  height: number
  fps?: number
  durationSeconds?: number
  pixelFormat?: string
  colorSpace?: string
  rotation?: number
}

export interface EditReferenceAudioStreamSummary {
  streamIndex: number
  codecName: string
  sampleRate?: number
  channels?: number
  durationSeconds?: number
}

export interface EditReferenceTechnicalAudioSummary {
  status: 'verified_local' | 'blocked' | 'not_applicable'
  integratedLufs?: number
  truePeakDb?: number
  blockerCode?: string
  blockerMessage?: string
  semanticAudioAnalysisRan: false
}

export async function runEditReferenceLocalMediaStudy(input: {
  env: RuntimeEnv
  referenceAssetId: string
  privateAssetId: string
  sourceEvidenceId: string
  storageObject: EditReferencePrivateStorageObject
  visualLanguageRuntime?: EditReferenceVisualLanguageRuntimeInput
  colorTreatmentRuntime?: EditReferenceColorTreatmentRuntimeInput
  graphicsMotionRuntime?: EditReferenceGraphicsMotionRuntimeInput
  captionDesignRuntime?: EditReferenceCaptionDesignRuntimeInput
  storyEditorialRuntime?: EditReferenceStoryEditorialRuntimeInput
  speechPacingRuntime?: EditReferenceSpeechPacingRuntimeInput
  audioSoundDesignRuntime?: EditReferenceAudioSoundDesignRuntimeInput
}): Promise<EditReferenceLocalMediaStudyResult> {
  if (input.env.storageMode !== 'local') {
    return createBlockedEditReferenceMediaStudy(input, 'reference_media_local_runtime_unavailable', 'Private reference-media study is available only in the approved local runtime. No media bytes were opened.')
  }
  if (
    input.storageObject.status !== 'ready'
    || !input.storageObject.mediaAssetId
    || !input.storageObject.mimeType?.startsWith('video/')
  ) {
    return createBlockedEditReferenceMediaStudy(input, 'reference_media_asset_not_ready', 'The private reference asset is not a finalized video. Upload or reconnect it, then retry.')
  }

  const usageStartedAt = new Date().toISOString()
  const usageStartedHrtime = process.hrtime.bigint()
  const outputRoot = await mkdtemp(path.join(tmpdir(), 'reeditpro-reference-study-'))
  let result: Omit<EditReferenceLocalMediaStudyResult, 'technicalStudyUsage'>
  try {
    const sourceLocalPath = resolveLocalStorageObjectPath(
      input.env.localStorageRoot,
      input.storageObject.bucketName,
      input.storageObject.objectPath,
    )
    const foundation = await runMediaAnalysisFoundation({
      mode: 'local_dev',
      workspaceId: input.storageObject.workspaceId,
      projectId: input.storageObject.projectId ?? input.storageObject.editReferenceId ?? input.privateAssetId,
      mediaAssetId: input.storageObject.mediaAssetId,
      sourceStorageObjectId: input.storageObject.id,
      source: {
        sourceStorageObjectId: input.storageObject.id,
        storageBucketPurpose: 'source_media',
        storageObjectPath: input.storageObject.objectPath,
        localFilePath: sourceLocalPath,
        contentType: input.storageObject.mimeType,
        sizeBytes: input.storageObject.sizeBytes,
        isPrivate: true,
        sourceOfTruth: true,
      },
      outputRoot,
      tasks: ['probe', 'extract_audio', 'extract_keyframes', 'extract_representative_frames', 'build_analysis_report'],
      maxRepresentativeFrameCount: 4,
      maxKeyframeCount: 4,
      timeoutMs: 30_000,
    })
    const frames = foundation.representativeFrames?.artifacts ?? []
    const keyframes = foundation.keyframes?.artifacts ?? []
    const technicalAudio = await studyTechnicalAudio({
      audioLocalPath: foundation.audio?.artifact?.localFilePath,
      ffmpegBin: 'ffmpeg',
      timeoutMs: 30_000,
      hasAudioStream: Boolean(foundation.probe?.audioStreams.length),
    })
    const primaryAudioDurationSeconds = foundation.probe?.audioStreams[0]?.durationSeconds
    const technicalAudioLowLevel = foundation.probe
      ? await runEditReferenceAudioLowLevelStudy({
        sourceAudioLocalPath: foundation.audio?.artifact?.localFilePath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: typeof primaryAudioDurationSeconds === 'number' && primaryAudioDurationSeconds > 0
          ? primaryAudioDurationSeconds
          : foundation.probe.durationSeconds,
        hasAudioStream: foundation.probe.audioStreams.length > 0,
        thresholdDb: -50,
        minimumDurationSeconds: 0.5,
        maxIntervalCount: 24,
        maxScanDurationSeconds: 120,
      })
      : createNotRunEditReferenceAudioLowLevelResult()
    const sceneBoundaries = foundation.probe
      ? await runEditReferenceSceneBoundaryStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        threshold: 0.32,
        maxBoundaryCount: 24,
        maxScanDurationSeconds: 120,
      })
      : createNotRunEditReferenceSceneBoundaryResult()
    const technicalSourceCondition = foundation.probe
      ? await runEditReferenceSourceConditionStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        maxIntervalCountPerType: 24,
        analysisFrameRate: 10,
        maxScanDurationSeconds: 120,
        blackMinimumDurationSeconds: 0.3,
        blackPictureRatioThreshold: 0.98,
        blackPixelThreshold: 0.1,
        freezeMinimumDurationSeconds: 0.5,
        freezeNoiseTolerance: 0.001,
      })
      : createNotRunEditReferenceSourceConditionResult()
    const technicalEdgeWidth = foundation.probe
      ? await runEditReferenceEdgeWidthSignalStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        maxSampleCount: 24,
        maxScanDurationSeconds: 120,
        outputMaxDimension: 320,
        highThreshold: 0.117647,
        lowThreshold: 0.0588235,
        radius: 50,
        blockPercentile: 80,
        blockWidth: 32,
        blockHeight: 32,
      })
      : createNotRunEditReferenceEdgeWidthSignalResult()
    const technicalCaptionRegions = foundation.probe
      ? await runEditReferenceCaptionRegionSignalStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        maxSampleCount: 24,
        maxRegionCountPerFrame: 4,
        maxScanDurationSeconds: 120,
        outputMaxDimension: 320,
        brightnessThreshold8Bit: 220,
        localContrastThreshold8Bit: 96,
      })
      : createNotRunEditReferenceCaptionRegionSignalResult()
    const technicalColor = foundation.probe
      ? await runEditReferenceColorSignalStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        ffprobeBin: 'ffprobe',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        maxSampleCount: 12,
        maxScanDurationSeconds: 120,
      })
      : createNotRunEditReferenceColorSignalResult()
    const technicalMotion = foundation.probe
      ? await runEditReferenceMotionSignalStudy({
        sourceLocalPath,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        durationSeconds: foundation.probe.durationSeconds,
        maxSampleCount: 24,
        maxPeakCount: 6,
        maxScanDurationSeconds: 120,
        activityThreshold8Bit: 1,
        highActivityThreshold8Bit: 10,
      })
      : createNotRunEditReferenceMotionSignalResult()
    const colorTreatment = await runBoundedColorTreatmentStudy({
      runtime: input.colorTreatmentRuntime,
      outputRoot,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.colorTreatmentRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      representativeFrames: frames,
      keyframes,
      sourceDurationSeconds: foundation.probe?.durationSeconds,
      technicalColor,
    })
    const graphicsMotion = await runBoundedGraphicsMotionStudy({
      runtime: input.graphicsMotionRuntime,
      outputRoot,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.graphicsMotionRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      representativeFrames: frames,
      keyframes,
      sourceDurationSeconds: foundation.probe?.durationSeconds,
      technicalMotion,
      sceneBoundaries,
    })
    const visualLanguage = await runBoundedVisualLanguageStudy({
      runtime: input.visualLanguageRuntime,
      outputRoot,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.visualLanguageRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      mediaAnalysisReportId: foundation.mediaAnalysisReport?.id,
      representativeFrames: frames,
      keyframes,
      probeWidth: foundation.probe?.width,
      probeHeight: foundation.probe?.height,
      technicalCaptionRegions,
      technicalColor,
      technicalMotion,
      technicalSourceCondition,
      sceneBoundaries,
    })
    const captionDesign = await runBoundedCaptionDesignStudy({
      runtime: input.captionDesignRuntime,
      outputRoot,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.captionDesignRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      representativeFrames: frames,
      keyframes,
      sourceDurationSeconds: foundation.probe?.durationSeconds,
      technicalCaptionRegions,
    })
    const semanticAudioArtifact = (input.speechPacingRuntime || input.audioSoundDesignRuntime)
      && foundation.audio?.artifact?.localFilePath
      ? await attachPrivateArtifactChecksum(outputRoot, foundation.audio.artifact).catch(() => foundation.audio?.artifact)
      : foundation.audio?.artifact
    const speechPacing = await runBoundedSpeechPacingStudy({
      runtime: input.speechPacingRuntime,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.speechPacingRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      sourceDurationSeconds: foundation.probe?.durationSeconds,
      privateAudioArtifact: semanticAudioArtifact,
      technicalAudioLowLevel,
    })
    const audioSoundDesign = await runBoundedAudioSoundDesignStudy({
      runtime: input.audioSoundDesignRuntime,
      outputRoot,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.audioSoundDesignRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      sourceDurationSeconds: foundation.probe?.durationSeconds,
      privateAudioArtifact: semanticAudioArtifact,
      sampleRate: foundation.audio?.sampleRate,
      channels: foundation.audio?.channels,
      technicalAudioLowLevel,
    })
    const storyEditorial = await runBoundedStoryEditorialStudy({
      runtime: input.storyEditorialRuntime,
      workspaceId: input.storageObject.workspaceId,
      editReferenceId: input.storageObject.editReferenceId ?? input.storageObject.projectId ?? input.privateAssetId,
      studySessionId: input.storyEditorialRuntime?.studySessionId ?? `study:${input.referenceAssetId}`,
      privateMediaArtifactId: input.storageObject.id,
      mediaChecksumSha256: input.storageObject.checksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      mediaAnalysisReportId: foundation.mediaAnalysisReport?.id,
      audioPresence: foundation.probe && foundation.probe.audioStreams.length > 0 ? 'present' : 'absent',
      sceneBoundaries,
      visualLanguageStudy: visualLanguage.result,
    })
    const technicalWarnings = foundation.probe
      ? buildTechnicalWarnings(foundation.probe, sceneBoundaries, technicalSourceCondition, technicalEdgeWidth, technicalCaptionRegions, technicalColor, technicalMotion, technicalAudioLowLevel)
      : ['FFprobe did not return a media probe result.']
    result = {
      referenceAssetId: input.referenceAssetId,
      privateAssetId: input.privateAssetId,
      sourceEvidenceId: input.sourceEvidenceId,
      status: foundation.probe ? 'verified_local' : 'blocked',
      ...(foundation.probe ? {} : {
        blockerCode: 'reference_media_probe_missing',
        blockerMessage: 'The local media foundation did not produce a verified probe result.',
      }),
      durationSeconds: foundation.probe?.durationSeconds,
      width: foundation.probe?.width,
      height: foundation.probe?.height,
      fps: foundation.probe?.fps,
      aspectRatio: foundation.probe?.aspectRatio,
      rotation: foundation.probe?.rotation,
      codecName: foundation.probe?.codecName,
      formatName: foundation.probe?.formatName,
      sizeBytes: foundation.probe?.sizeBytes,
      hasAudio: foundation.probe ? foundation.probe.audioStreams.length > 0 : undefined,
      streamCount: foundation.probe?.streamCount,
      videoStreams: foundation.probe?.videoStreams.map((stream) => ({ ...stream })) ?? [],
      audioStreams: foundation.probe?.audioStreams.map((stream) => ({ ...stream })) ?? [],
      mediaAnalysisReportId: foundation.mediaAnalysisReport?.id,
      keyframeSampleCount: keyframes.length,
      keyframeSamplingIntervalSeconds: keyframes.length > 0 ? 2 : undefined,
      shotDetectionStatus: sceneBoundaries.status,
      shotBoundaryCount: sceneBoundaries.boundaryCount,
      shotBoundaryTimesSeconds: sceneBoundaries.boundaryTimesSeconds,
      shotDetectionThreshold: sceneBoundaries.threshold,
      shotDetectionScannedDurationSeconds: sceneBoundaries.scannedDurationSeconds,
      shotDetectionCoverage: sceneBoundaries.coverage,
      shotDetectionBlockerCode: sceneBoundaries.blockerCode,
      shotDetectionBlockerMessage: sceneBoundaries.blockerMessage,
      representativeFrameCount: frames.length,
      representativeFrameTimes: frames.flatMap((frame) => typeof frame.timeSeconds === 'number' ? [frame.timeSeconds] : []),
      audioExtracted: foundation.audio?.status === 'created',
      technicalAudio,
      technicalAudioLowLevel,
      technicalSourceCondition,
      technicalEdgeWidth,
      technicalCaptionRegions,
      technicalColor,
      technicalMotion,
      toolIds: ['ffprobe', ...(frames.length || foundation.audio?.status === 'created' || sceneBoundaries.status !== 'not_run' ? ['ffmpeg'] : [])],
      fileBytesRead: true,
      mediaProcessingStarted: true,
      rawFramesPersisted: false,
      rawProviderPayloadPersisted: false,
      visualLanguageStudyStatus: visualLanguage.status,
      ...(visualLanguage.result ? { visualLanguageStudy: visualLanguage.result } : {}),
      ...(visualLanguage.blockerCode ? { visualLanguageBlockerCode: visualLanguage.blockerCode } : {}),
      ...(visualLanguage.blockerMessage ? { visualLanguageBlockerMessage: visualLanguage.blockerMessage } : {}),
      colorTreatmentStudyStatus: colorTreatment.status,
      ...(colorTreatment.result ? { colorTreatmentStudy: colorTreatment.result } : {}),
      ...(colorTreatment.blockerCode ? { colorTreatmentBlockerCode: colorTreatment.blockerCode } : {}),
      ...(colorTreatment.blockerMessage ? { colorTreatmentBlockerMessage: colorTreatment.blockerMessage } : {}),
      graphicsMotionStudyStatus: graphicsMotion.status,
      ...(graphicsMotion.result ? { graphicsMotionStudy: graphicsMotion.result } : {}),
      ...(graphicsMotion.blockerCode ? { graphicsMotionBlockerCode: graphicsMotion.blockerCode } : {}),
      ...(graphicsMotion.blockerMessage ? { graphicsMotionBlockerMessage: graphicsMotion.blockerMessage } : {}),
      captionDesignStudyStatus: captionDesign.status,
      ...(captionDesign.result ? { captionDesignStudy: captionDesign.result } : {}),
      ...(captionDesign.observedAbsence
        ? { captionDesignObservedAbsence: captionDesign.observedAbsence }
        : {}),
      ...(captionDesign.blockerCode ? { captionDesignBlockerCode: captionDesign.blockerCode } : {}),
      ...(captionDesign.blockerMessage ? { captionDesignBlockerMessage: captionDesign.blockerMessage } : {}),
      storyEditorialStudyStatus: storyEditorial.status,
      ...(storyEditorial.result ? { storyEditorialStudy: storyEditorial.result } : {}),
      ...(storyEditorial.blockerCode ? { storyEditorialBlockerCode: storyEditorial.blockerCode } : {}),
      ...(storyEditorial.blockerMessage ? { storyEditorialBlockerMessage: storyEditorial.blockerMessage } : {}),
      speechPacingStudyStatus: speechPacing.status,
      ...(speechPacing.result ? { speechPacingStudy: speechPacing.result } : {}),
      ...(speechPacing.blockerCode ? { speechPacingBlockerCode: speechPacing.blockerCode } : {}),
      ...(speechPacing.blockerMessage ? { speechPacingBlockerMessage: speechPacing.blockerMessage } : {}),
      audioSoundDesignStudyStatus: audioSoundDesign.status,
      ...(audioSoundDesign.result ? { audioSoundDesignStudy: audioSoundDesign.result } : {}),
      ...(audioSoundDesign.blockerCode ? { audioSoundDesignBlockerCode: audioSoundDesign.blockerCode } : {}),
      ...(audioSoundDesign.blockerMessage ? { audioSoundDesignBlockerMessage: audioSoundDesign.blockerMessage } : {}),
      technicalWarnings,
      warnings: foundation.warnings,
    }
  } catch (error) {
    result = {
      ...createBlockedEditReferenceMediaStudy(input, 'reference_media_local_study_failed', 'The private local media study could not complete. The asset remains private and can be retried.'),
      fileBytesRead: true,
      mediaProcessingStarted: true,
      toolIds: ['ffprobe', 'ffmpeg'],
      technicalAudio: {
        status: 'blocked',
        blockerCode: 'reference_audio_technical_study_failed',
        blockerMessage: 'Technical audio analysis did not complete. Retry after the private media runtime is available.',
        semanticAudioAnalysisRan: false,
      },
      technicalAudioLowLevel: createBlockedEditReferenceAudioLowLevelResult({
        blockerCode: 'reference_audio_low_level_study_failed',
        blockerMessage: 'The bounded low-level audio check did not complete. Retry after the private media runtime is available.',
      }),
      technicalSourceCondition: createBlockedEditReferenceSourceConditionResult({
        blockerCode: 'reference_source_condition_study_failed',
        blockerMessage: 'The bounded source-condition check did not complete. Retry after the private media runtime is available.',
      }),
      technicalEdgeWidth: createBlockedEditReferenceEdgeWidthSignalResult({
        blockerCode: 'reference_edge_width_signal_study_failed',
        blockerMessage: 'The bounded technical edge-width check did not complete. Retry after the private media runtime is available.',
      }),
      technicalCaptionRegions: createBlockedEditReferenceCaptionRegionSignalResult({
        blockerCode: 'reference_caption_region_signal_study_failed',
        blockerMessage: 'The bounded caption-region signal check did not complete. Retry after the private media runtime is available.',
      }),
      technicalColor: createBlockedEditReferenceColorSignalResult({
        blockerCode: 'reference_color_signal_study_failed',
        blockerMessage: 'Technical color signal analysis did not complete. Retry after the private media runtime is available.',
      }),
      technicalMotion: createBlockedEditReferenceMotionSignalResult({
        blockerCode: 'reference_motion_signal_study_failed',
        blockerMessage: 'Technical frame-difference analysis did not complete. Retry after the private media runtime is available.',
      }),
      visualLanguageStudyStatus: 'blocked',
      visualLanguageBlockerCode: 'reference_visual_language_study_failed',
      visualLanguageBlockerMessage: 'The bounded Visual Language preparation or adapter call did not complete.',
      colorTreatmentStudyStatus: 'blocked',
      colorTreatmentBlockerCode: 'reference_color_treatment_study_failed',
      colorTreatmentBlockerMessage: 'The bounded Color Treatment preparation or adapter call did not complete.',
      graphicsMotionStudyStatus: 'blocked',
      graphicsMotionBlockerCode: 'reference_graphics_motion_study_failed',
      graphicsMotionBlockerMessage: 'The bounded Graphics/Motion preparation or adapter call did not complete.',
      captionDesignStudyStatus: 'blocked',
      captionDesignBlockerCode: 'reference_caption_design_study_failed',
      captionDesignBlockerMessage: 'The bounded Caption Design OCR authority preparation or adapter call did not complete.',
      storyEditorialStudyStatus: 'blocked',
      storyEditorialBlockerCode: 'reference_story_editorial_study_failed',
      storyEditorialBlockerMessage: 'The bounded Story/Editorial evidence preparation or adapter call did not complete.',
      speechPacingStudyStatus: 'blocked',
      speechPacingBlockerCode: 'reference_speech_pacing_study_failed',
      speechPacingBlockerMessage: 'The bounded Speech/Pacing transcript authority or adapter call did not complete.',
      audioSoundDesignStudyStatus: 'blocked',
      audioSoundDesignBlockerCode: 'reference_audio_sound_design_study_failed',
      audioSoundDesignBlockerMessage: 'The bounded Audio/Sound Design adapter or specialist audio preparation did not complete.',
      technicalWarnings: ['Private media structure analysis did not complete.'],
      shotDetectionStatus: 'blocked',
      shotBoundaryCount: 0,
      shotBoundaryTimesSeconds: [],
      shotDetectionCoverage: 'not_run',
      shotDetectionBlockerCode: 'reference_scene_boundary_study_failed',
      shotDetectionBlockerMessage: 'Technical scene-change analysis did not complete. Retry after the private media runtime is available.',
      warnings: [safeErrorCategory(error)],
    }
  }

  try {
    await rm(outputRoot, { force: true, recursive: true })
  } catch {
    return attachBackendLocalUsage({
      ...result,
      status: 'blocked',
      blockerCode: 'reference_media_ephemeral_cleanup_failed',
      blockerMessage: 'Ephemeral frame cleanup could not be verified. The study result is blocked from DNA until cleanup is confirmed and the study is retried.',
      representativeFrameCount: 0,
      representativeFrameTimes: [],
      keyframeSampleCount: 0,
      shotDetectionStatus: 'blocked',
      shotBoundaryCount: 0,
      shotBoundaryTimesSeconds: [],
      shotDetectionCoverage: 'not_run',
      shotDetectionBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      shotDetectionBlockerMessage: 'Technical scene-change evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      technicalAudio: {
        status: 'blocked',
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Technical audio evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
        semanticAudioAnalysisRan: false,
      },
      technicalAudioLowLevel: createBlockedEditReferenceAudioLowLevelResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Low-level audio evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      technicalSourceCondition: createBlockedEditReferenceSourceConditionResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Source-condition evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      technicalEdgeWidth: createBlockedEditReferenceEdgeWidthSignalResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Technical edge-width evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      technicalCaptionRegions: createBlockedEditReferenceCaptionRegionSignalResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Caption-region signal evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      technicalColor: createBlockedEditReferenceColorSignalResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Technical color signal evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      technicalMotion: createBlockedEditReferenceMotionSignalResult({
        blockerCode: 'reference_media_ephemeral_cleanup_failed',
        blockerMessage: 'Technical frame-difference evidence is blocked until ephemeral cleanup is confirmed and the study is retried.',
      }),
      visualLanguageStudyStatus: 'blocked',
      visualLanguageStudy: undefined,
      visualLanguageBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      visualLanguageBlockerMessage: 'Visual Language evidence is blocked until all ephemeral media cleanup is confirmed and the study is retried.',
      colorTreatmentStudyStatus: 'blocked',
      colorTreatmentStudy: undefined,
      colorTreatmentBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      colorTreatmentBlockerMessage: 'Color Treatment evidence is blocked until all ephemeral media cleanup is confirmed and the study is retried.',
      graphicsMotionStudyStatus: 'blocked',
      graphicsMotionStudy: undefined,
      graphicsMotionBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      graphicsMotionBlockerMessage: 'Graphics/Motion evidence is blocked until all ephemeral media cleanup is confirmed and the study is retried.',
      captionDesignStudyStatus: 'blocked',
      captionDesignStudy: undefined,
      captionDesignBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      captionDesignBlockerMessage: 'Caption Design evidence is blocked until all ephemeral frames and OCR inputs are confirmed cleaned and the study is retried.',
      storyEditorialStudyStatus: 'blocked',
      storyEditorialStudy: undefined,
      storyEditorialBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      storyEditorialBlockerMessage: 'Story/Editorial evidence is blocked until all ephemeral media cleanup is confirmed and the study is retried.',
      speechPacingStudyStatus: 'blocked',
      speechPacingStudy: undefined,
      speechPacingBlockerCode: 'reference_media_ephemeral_cleanup_failed',
      speechPacingBlockerMessage: 'Speech/Pacing evidence is blocked until all ephemeral media and audio cleanup is confirmed and the study is retried.',
      warnings: [...result.warnings, 'Ephemeral media cleanup was not verified.'],
    }, usageStartedAt, usageStartedHrtime)
  }
  return attachBackendLocalUsage(result, usageStartedAt, usageStartedHrtime)
}

export interface BoundedColorTreatmentStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceColorTreatmentStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export async function runBoundedColorTreatmentStudy(input: {
  readonly runtime?: EditReferenceColorTreatmentRuntimeInput
  readonly outputRoot: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly representativeFrames: readonly MediaFoundationArtifactSummary[]
  readonly keyframes: readonly MediaFoundationArtifactSummary[]
  readonly sourceDurationSeconds?: number
  readonly technicalColor: PreferenceTechnicalColorSignalEvidence
}): Promise<BoundedColorTreatmentStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_color_treatment_adapter_not_configured',
      blockerMessage: 'No reviewed Color Treatment runtime was configured for this private media study.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_media_checksum_unverified',
      blockerMessage: 'The finalized private reference lacks exact checksum authority, so Color Treatment did not run.',
    }
  }
  if (
    input.technicalColor.status !== 'verified_local_bounded'
    || !input.technicalColor.technicalDistributionAnalysisRan
    || input.technicalColor.sampleCount < 1
    || input.technicalColor.scannedDurationSeconds <= 0
  ) {
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_technical_color_unavailable',
      blockerMessage: 'Verified bounded technical-color evidence is required before semantic Color Treatment analysis.',
    }
  }
  const sourceDurationSeconds = input.sourceDurationSeconds
  if (typeof sourceDurationSeconds !== 'number' || !Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_duration_unavailable',
      blockerMessage: 'Verified source duration is required before bounded semantic Color Treatment analysis.',
    }
  }
  const analysisWindowStartSeconds = 0
  const analysisWindowEndSeconds = Math.min(
    sourceDurationSeconds,
    input.technicalColor.scannedDurationSeconds,
    120,
  )
  if (analysisWindowEndSeconds <= analysisWindowStartSeconds) {
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_window_unavailable',
      blockerMessage: 'A positive bounded Color Treatment analysis window could not be established.',
    }
  }

  const candidates = uniqueColorTreatmentCandidates([
    ...input.representativeFrames.slice(0, 4).map((artifact) => ({
      artifact,
      role: 'representative' as const,
      fallbackTimeSeconds: undefined,
    })),
    ...input.keyframes.slice(0, 4).map((artifact, index) => ({
      artifact,
      role: 'scene_match' as const,
      fallbackTimeSeconds: index * 2,
    })),
  ]
    .map((candidate) => ({
      ...candidate,
      sourceTimeSeconds: candidate.artifact.timeSeconds ?? candidate.fallbackTimeSeconds ?? 0,
    }))
    .filter((candidate) => (
      candidate.sourceTimeSeconds >= analysisWindowStartSeconds
      && candidate.sourceTimeSeconds <= analysisWindowEndSeconds
    )))

  if (!candidates.some((candidate) => candidate.role === 'representative')) {
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_frames_unavailable',
      blockerMessage: 'Color Treatment requires at least one bounded representative frame inside the technical-color scan window.',
    }
  }

  const specialistRoot = path.join(
    input.outputRoot,
    `color-treatment-${createHash('sha256').update(`${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`).digest('hex').slice(0, 16)}`,
  )
  const resolvedFrames = new Map<string, string>()
  let frameSamples: EditReferenceColorTreatmentFrameEvidence[]
  try {
    await mkdir(specialistRoot, { mode: 0o700, recursive: false })
    frameSamples = await Promise.all(candidates.map(async ({ artifact, role, sourceTimeSeconds }, index) => {
      if (!artifact.localFilePath || artifact.contentType !== 'image/jpeg' || artifact.isPrivate !== true) {
        throw new Error('color_frame_artifact_unavailable')
      }
      if (artifact.sizeBytes !== undefined && (artifact.sizeBytes < 1 || artifact.sizeBytes > 2 * 1024 * 1024)) {
        throw new Error('color_frame_artifact_outside_size_bound')
      }
      const bytes = await readPrivateFrameBytes(input.outputRoot, artifact.localFilePath)
      if (bytes.byteLength < 1 || bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error('color_frame_bytes_outside_size_bound')
      }
      const dimensions = readJpegDimensions(bytes)
      const privateFrameArtifactId = `${artifact.artifactId}:color-treatment:${index + 1}`
      const localFilePath = path.join(specialistRoot, `frame-${String(index + 1).padStart(2, '0')}.jpg`)
      await writeFile(localFilePath, bytes, { flag: 'wx', mode: 0o600 })
      resolvedFrames.set(privateFrameArtifactId, localFilePath)
      return {
        role,
        frameEvidenceId: `${privateFrameArtifactId}:evidence`,
        privateFrameArtifactId,
        frameChecksumSha256: createHash('sha256').update(bytes).digest('hex'),
        sourceTimeSeconds,
        width: dimensions.width,
        height: dimensions.height,
        privateAccessVerified: true,
        ephemeral: true,
        cleanupRequired: true,
      }
    }))
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_frame_authority_unverified',
      blockerMessage: 'Specialist-owned private JPEG copies could not be prepared with exact dimensions and checksums.',
    }
  }

  const technicalColorResultDigestSha256 = hashEditReferenceTechnicalColorEvidence(input.technicalColor)
  const technicalColorEvidenceId = `${input.sourceEvidenceId}:technical-color`
  const evidence = {
    mediaStructureEvidenceIds: [input.sourceEvidenceId],
    representativeFrameEvidenceIds: frameSamples.map((frame) => frame.frameEvidenceId),
    technicalColorSignalEvidenceIds: [technicalColorEvidenceId],
    visualLanguageEvidenceIds: [],
    studyChatGoalEvidenceIds: [input.runtime.studyGoalEvidenceId],
    personPresenceEvidenceIds: [],
    rightsAndBrandEvidenceIds: [],
  }
  const productionAuthority = 'productionAuthority' in input.runtime
    ? input.runtime.productionAuthority
    : undefined
  const request: EditReferenceColorTreatmentStudyRequest = {
    schemaVersion: EDIT_REFERENCE_COLOR_TREATMENT_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.runtime.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    evidenceManifestDigestSha256: hashEditReferenceColorTreatmentEvidenceManifest({ evidence }),
    frameManifestDigestSha256: hashEditReferenceColorTreatmentFrameManifest(frameSamples),
    technicalColorResultDigestSha256,
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    evidenceAuthorityVerified: true,
    frameAuthorityVerified: true,
    technicalColorAuthorityVerified: true,
    evidenceMode: 'frames_and_technical_signal',
    frameSamples,
    evidence,
    technicalColorAuthority: {
      schemaVersion: 'edit-reference-technical-color-signal-v2',
      evidenceId: technicalColorEvidenceId,
      resultDigestSha256: technicalColorResultDigestSha256,
      runtimeSource: 'verified_local',
      executionId: `technical-color:${input.sourceEvidenceId}`,
      toolIds: ['ffprobe', 'ffmpeg'],
      status: 'verified_local_bounded',
      coverage: input.technicalColor.coverage === 'partial' ? 'partial' : 'full',
      sampleCount: input.technicalColor.sampleCount,
      scannedDurationSeconds: input.technicalColor.scannedDurationSeconds,
      technicalDistributionAnalysisRan: true,
      colorRangeViolationScanRan: input.technicalColor.colorRangeViolationScanRan,
      semanticColorAnalysisRan: false,
      whiteBalanceInferenceRan: false,
      temperatureInferenceRan: false,
      skinToneAnalysisRan: false,
      shotMatchAnalysisRan: false,
      lutReconstructionRan: false,
      rawFramePixelsPersisted: false,
      rawHistogramPersisted: false,
      rawProcessOutputPersisted: false,
    },
    sourceDurationSeconds,
    analysisWindowStartSeconds,
    analysisWindowEndSeconds,
    sourcePeoplePresent: false,
    sourceBrandColorContextPresent: false,
    maxFrameCount: 8,
    maxEvidenceItems: 64,
    maxStructuredContextCharacters: 32_000,
    maxScanDurationSeconds: 120,
    executionScope: productionAuthority ? 'production' : 'controlled_test',
    approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
    immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
    maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
    boundedPrivateFrameInputAllowed: true,
    rawFullMediaInputAllowed: false,
    rawFramePersistenceAllowed: false,
    rawHistogramPersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    technicalSignalsMayEstablishSemanticColorIntent: false,
    exactPaletteSwatchTransferAllowed: false,
    exactColorValueTransferAllowed: false,
    exactCurveOrControlPointTransferAllowed: false,
    exactGradeSettingTransferAllowed: false,
    exactReferenceLutReconstructionAllowed: false,
    unownedReferenceLutTransferAllowed: false,
    ownedLutPassthroughHandledBySeparateTargetAssetWorkflow: true,
    exactLookTransformTransferAllowed: false,
    executableTargetGradeAllowed: false,
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  try {
    const resolvePrivateFrame = async (sample: EditReferenceColorTreatmentFrameEvidence) => {
      const localFilePath = resolvedFrames.get(sample.privateFrameArtifactId)
      if (!localFilePath) throw new Error('private_color_frame_not_resolved')
      return { privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath }
    }
    const cleanupPrivateFrames = async (frames: readonly { readonly localFilePath: string }[]) => {
      await Promise.all(frames.map(async (frame) => unlink(frame.localFilePath)))
    }
    const adapter = createEditReferenceQwenColorTreatmentAdapter({
      provider: input.runtime.provider,
      privateFrameRoot: specialistRoot,
      technicalColorEvidence: input.technicalColor,
      resolvePrivateFrame,
      cleanupPrivateFrames,
      productionUsageAuthority: productionAuthority?.usageAuthority,
      createExecutionId: () => `color-treatment:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
    })
    const result = await adapter.analyze(request)
    await rm(specialistRoot, { force: true, recursive: true })
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.status === 'blocked' ? result.blockerCode : 'representative_frames_unavailable',
          blockerMessage: result.status === 'blocked' ? result.blockerMessage : result.retryReason,
        }
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_color_treatment_runtime_failed',
      blockerMessage: 'The bounded Color Treatment adapter failed closed without persisting specialist frame copies.',
    }
  }
}

function uniqueColorTreatmentCandidates<T extends {
  readonly artifact: MediaFoundationArtifactSummary
  readonly role: 'representative' | 'scene_match'
  readonly sourceTimeSeconds: number
}>(candidates: readonly T[]): T[] {
  const seen = new Set<string>()
  return [...candidates]
    .sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds || left.role.localeCompare(right.role))
    .filter((candidate) => {
      if (seen.has(candidate.artifact.artifactId)) return false
      seen.add(candidate.artifact.artifactId)
      return true
    })
    .slice(0, 8)
}

export interface BoundedGraphicsMotionStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceGraphicsMotionStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export async function runBoundedGraphicsMotionStudy(input: {
  readonly runtime?: EditReferenceGraphicsMotionRuntimeInput
  readonly outputRoot: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly representativeFrames: readonly MediaFoundationArtifactSummary[]
  readonly keyframes: readonly MediaFoundationArtifactSummary[]
  readonly sourceDurationSeconds?: number
  readonly technicalMotion: PreferenceTechnicalMotionSignalEvidence
  readonly sceneBoundaries: EditReferenceSceneBoundaryStudyResult
}): Promise<BoundedGraphicsMotionStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_graphics_motion_adapter_not_configured',
      blockerMessage: 'No reviewed Graphics/Motion runtime was configured for this private media study.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_media_checksum_unverified',
      blockerMessage: 'The finalized private reference lacks exact checksum authority, so Graphics/Motion did not run.',
    }
  }
  if (
    input.technicalMotion.status !== 'verified_local_bounded'
    || !input.technicalMotion.technicalFrameDifferenceAnalysisRan
    || input.technicalMotion.sampleCount < 1
    || input.technicalMotion.scannedDurationSeconds <= 0
  ) {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_technical_motion_unavailable',
      blockerMessage: 'Verified bounded technical-motion evidence is required before semantic Graphics/Motion analysis.',
    }
  }
  if (input.sceneBoundaries.status !== 'verified_local_bounded') {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_scene_evidence_unavailable',
      blockerMessage: 'Verified bounded scene-change evidence is required before semantic Graphics/Motion analysis.',
    }
  }
  const sourceDurationSeconds = input.sourceDurationSeconds
  if (typeof sourceDurationSeconds !== 'number' || !Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_duration_unavailable',
      blockerMessage: 'Verified source duration is required before bounded semantic Graphics/Motion analysis.',
    }
  }
  const analysisWindowStartSeconds = 0
  const analysisWindowEndSeconds = Math.min(
    sourceDurationSeconds,
    input.technicalMotion.scannedDurationSeconds,
    120,
  )
  if (analysisWindowEndSeconds <= analysisWindowStartSeconds) {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_window_unavailable',
      blockerMessage: 'A positive bounded Graphics/Motion analysis window could not be established.',
    }
  }

  const candidates = uniqueGraphicsMotionCandidates([
    ...input.representativeFrames.slice(0, 1).map((artifact) => ({
      artifact,
      role: 'representative' as const,
      fallbackTimeSeconds: undefined,
    })),
    ...input.keyframes.slice(0, 4).map((artifact, index) => ({
      artifact,
      role: 'motion_keyframe' as const,
      fallbackTimeSeconds: index * 2,
    })),
    ...input.representativeFrames.slice(1, 4).map((artifact, index) => ({
      artifact,
      role: 'motion_keyframe' as const,
      fallbackTimeSeconds: (index + 1) * 2,
    })),
  ]
    .map((candidate) => ({
      ...candidate,
      sourceTimeSeconds: candidate.artifact.timeSeconds ?? candidate.fallbackTimeSeconds ?? 0,
    }))
    .filter((candidate) => (
      candidate.sourceTimeSeconds >= analysisWindowStartSeconds
      && candidate.sourceTimeSeconds <= analysisWindowEndSeconds
    )))

  if (
    !candidates.some((candidate) => candidate.role === 'representative')
    || candidates.filter((candidate) => candidate.role === 'motion_keyframe').length < 2
  ) {
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_frames_unavailable',
      blockerMessage: 'Graphics/Motion requires at least one bounded representative frame and two bounded motion keyframes.',
    }
  }

  const specialistRoot = path.join(
    input.outputRoot,
    `graphics-motion-${createHash('sha256').update(`${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`).digest('hex').slice(0, 16)}`,
  )
  const resolvedFrames = new Map<string, string>()
  let frameSamples: EditReferenceGraphicsMotionFrameEvidence[]
  try {
    await mkdir(specialistRoot, { mode: 0o700, recursive: false })
    frameSamples = await Promise.all(candidates.map(async ({ artifact, role, sourceTimeSeconds }, index) => {
      if (!artifact.localFilePath || artifact.contentType !== 'image/jpeg' || artifact.isPrivate !== true) {
        throw new Error('graphics_motion_frame_artifact_unavailable')
      }
      if (artifact.sizeBytes !== undefined && (artifact.sizeBytes < 1 || artifact.sizeBytes > 2 * 1024 * 1024)) {
        throw new Error('graphics_motion_frame_artifact_outside_size_bound')
      }
      const bytes = await readPrivateFrameBytes(input.outputRoot, artifact.localFilePath)
      if (bytes.byteLength < 1 || bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error('graphics_motion_frame_bytes_outside_size_bound')
      }
      const dimensions = readJpegDimensions(bytes)
      const privateFrameArtifactId = `${artifact.artifactId}:graphics-motion:${index + 1}`
      const localFilePath = path.join(specialistRoot, `frame-${String(index + 1).padStart(2, '0')}.jpg`)
      await writeFile(localFilePath, bytes, { flag: 'wx', mode: 0o600 })
      resolvedFrames.set(privateFrameArtifactId, localFilePath)
      return {
        role,
        frameEvidenceId: `${privateFrameArtifactId}:evidence`,
        privateFrameArtifactId,
        frameChecksumSha256: createHash('sha256').update(bytes).digest('hex'),
        sourceTimeSeconds,
        width: dimensions.width,
        height: dimensions.height,
        privateAccessVerified: true,
        ephemeral: true,
        cleanupRequired: true,
      }
    }))
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_frame_authority_unverified',
      blockerMessage: 'Specialist-owned private JPEG copies could not be prepared with exact dimensions and checksums.',
    }
  }

  const technicalMotionResultDigestSha256 = hashEditReferenceTechnicalMotionEvidence(input.technicalMotion)
  const technicalMotionEvidenceId = `${input.sourceEvidenceId}:technical-motion`
  const sceneBoundaryEvidenceId = `${input.sourceEvidenceId}:technical-change-points`
  const evidence = {
    mediaStructureEvidenceIds: [input.sourceEvidenceId],
    representativeFrameEvidenceIds: frameSamples
      .filter((frame) => frame.role !== 'motion_keyframe')
      .map((frame) => frame.frameEvidenceId),
    keyframeEvidenceIds: frameSamples
      .filter((frame) => frame.role === 'motion_keyframe')
      .map((frame) => frame.frameEvidenceId),
    technicalMotionSignalEvidenceIds: [technicalMotionEvidenceId],
    sceneBoundaryEvidenceIds: [sceneBoundaryEvidenceId],
    visualCueTimingEvidenceIds: [],
    studyChatGoalEvidenceIds: [input.runtime.studyGoalEvidenceId],
    visibleTextEvidenceIds: [],
    rightsAndBrandEvidenceIds: [],
  }
  const productionAuthority = 'productionAuthority' in input.runtime
    ? input.runtime.productionAuthority
    : undefined
  const request: EditReferenceGraphicsMotionStudyRequest = {
    schemaVersion: EDIT_REFERENCE_GRAPHICS_MOTION_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.runtime.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    evidenceManifestDigestSha256: hashEditReferenceGraphicsMotionEvidenceManifest({ evidence }),
    frameManifestDigestSha256: hashEditReferenceGraphicsMotionFrameManifest(frameSamples),
    technicalMotionResultDigestSha256,
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    evidenceAuthorityVerified: true,
    frameAuthorityVerified: true,
    technicalMotionAuthorityVerified: true,
    evidenceMode: 'frames_and_technical_motion',
    frameSamples,
    evidence,
    technicalMotionAuthority: {
      schemaVersion: 'edit-reference-technical-motion-signal-v1',
      evidenceId: technicalMotionEvidenceId,
      resultDigestSha256: technicalMotionResultDigestSha256,
      runtimeSource: 'verified_local',
      executionId: `technical-motion:${input.sourceEvidenceId}`,
      toolIds: ['ffmpeg'],
      status: 'verified_local_bounded',
      coverage: input.technicalMotion.coverage === 'partial' ? 'partial' : 'full',
      sampleCount: input.technicalMotion.sampleCount,
      scannedDurationSeconds: input.technicalMotion.scannedDurationSeconds,
      activityThreshold8Bit: input.technicalMotion.activityThreshold8Bit,
      highActivityThreshold8Bit: input.technicalMotion.highActivityThreshold8Bit,
      activeSampleRatio: input.technicalMotion.activeSampleRatio,
      highActivitySampleRatio: input.technicalMotion.highActivitySampleRatio,
      peakSampleCount: input.technicalMotion.peakSamples.length,
      technicalFrameDifferenceAnalysisRan: true,
      semanticMotionAnalysisRan: false,
      cameraMotionInferenceRan: false,
      objectTrackingRan: false,
      transitionClassificationRan: false,
      graphicsEntryExitAnalysisRan: false,
      opticalFlowAnalysisRan: false,
      rawFramePixelsPersisted: false,
      rawDifferenceFramesPersisted: false,
      rawHistogramPersisted: false,
      rawProcessOutputPersisted: false,
    },
    sourceDurationSeconds,
    analysisWindowStartSeconds,
    analysisWindowEndSeconds,
    verifiedVisibleTextEvidenceAvailable: false,
    verifiedVisualCueTimingAvailable: false,
    sourceBrandOrUiIdentityPresent: false,
    maxFrameCount: 8,
    maxEvidenceItems: 64,
    maxStructuredContextCharacters: 32_000,
    maxScanDurationSeconds: 120,
    executionScope: productionAuthority ? 'production' : 'controlled_test',
    approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
    immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
    maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
    boundedPrivateFrameInputAllowed: true,
    rawFullMediaInputAllowed: false,
    rawFramePersistenceAllowed: false,
    rawDifferenceFramePersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    technicalMotionMayEstablishSemanticGraphicsMotionIntent: false,
    exactGraphicAssetTransferAllowed: false,
    exactReferenceTextOrIconTransferAllowed: false,
    exactLayoutOrSpacingTransferAllowed: false,
    exactAnimationKeyframeOrCurveTransferAllowed: false,
    exactTransitionPathOrTimingTransferAllowed: false,
    exactBrandOrUiIdentityTransferAllowed: false,
    ownedTargetBrandAssetsHandledBySeparateTargetAssetWorkflow: true,
    referenceDerivedGraphicsOrMotionGenerationAllowed: false,
    executableTargetGraphicsMotionOperationAllowed: false,
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  try {
    const resolvePrivateFrame = async (sample: EditReferenceGraphicsMotionFrameEvidence) => {
      const localFilePath = resolvedFrames.get(sample.privateFrameArtifactId)
      if (!localFilePath) throw new Error('private_graphics_motion_frame_not_resolved')
      return { privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath }
    }
    const cleanupPrivateFrames = async (frames: readonly { readonly localFilePath: string }[]) => {
      await Promise.all(frames.map(async (frame) => unlink(frame.localFilePath)))
    }
    const adapter = createEditReferenceQwenGraphicsMotionAdapter({
      provider: input.runtime.provider,
      privateFrameRoot: specialistRoot,
      technicalMotionEvidence: input.technicalMotion,
      resolvePrivateFrame,
      cleanupPrivateFrames,
      productionUsageAuthority: productionAuthority?.usageAuthority,
      createExecutionId: () => `graphics-motion:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
    })
    const result = await adapter.analyze(request)
    await rm(specialistRoot, { force: true, recursive: true })
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.status === 'blocked' ? result.blockerCode : 'graphics_motion_frames_unavailable',
          blockerMessage: result.status === 'blocked' ? result.blockerMessage : result.retryReason,
        }
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_graphics_motion_runtime_failed',
      blockerMessage: 'The bounded Graphics/Motion adapter failed closed without persisting specialist frame copies.',
    }
  }
}

function uniqueGraphicsMotionCandidates<T extends {
  readonly artifact: MediaFoundationArtifactSummary
  readonly role: 'representative' | 'motion_keyframe'
  readonly sourceTimeSeconds: number
}>(candidates: readonly T[]): T[] {
  const seen = new Set<string>()
  return [...candidates]
    .sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds || left.role.localeCompare(right.role))
    .filter((candidate) => {
      if (seen.has(candidate.artifact.artifactId)) return false
      seen.add(candidate.artifact.artifactId)
      return true
    })
    .slice(0, 8)
}

export interface BoundedCaptionDesignStudyOutcome {
  readonly status: 'analyzed' | 'observed_absent' | 'blocked' | 'not_run'
  readonly result?: EditReferenceCaptionDesignStudyResult
  readonly observedAbsence?: EditReferenceCaptionDesignObservedAbsence
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

/**
 * An exact OCR pass may legitimately find no caption/text regions. That is a
 * completed observation, not a broken reference. This compact authority keeps
 * the absence evidence and metered OCR provenance without inventing a caption
 * style or sending empty evidence to the semantic provider.
 */
export interface EditReferenceCaptionDesignObservedAbsence {
  readonly kind: 'caption_design_not_observed'
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceDurationSeconds: number
  readonly technicalCandidateRegionCount: number
  readonly requestedFrameCount: number
  readonly analyzedFrameCount: number
  readonly captionOcrRegionCount: 0
  readonly fullRequestedFrameCoverage: true
  readonly captionOcrRequestDigestSha256: string
  readonly captionOcrResultDigestSha256: string
  readonly inputEvidenceIds: readonly string[]
  readonly analysisArtifactIds: readonly string[]
  readonly runtimeSource: 'verified_local'
  readonly provenance: EditReferenceAnalyzedCaptionOcrStudyResult['provenance']
  readonly usage: EditReferenceAnalyzedCaptionOcrStudyResult['usage']
  readonly execution: EditReferenceAnalyzedCaptionOcrStudyResult['execution']
  readonly exactTextPersisted: false
  readonly rawOcrOutputPersisted: false
  readonly semanticProviderCallMade: false
}

export async function runBoundedCaptionDesignStudy(input: {
  readonly runtime?: EditReferenceCaptionDesignRuntimeInput
  readonly outputRoot: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly representativeFrames: readonly MediaFoundationArtifactSummary[]
  readonly keyframes: readonly MediaFoundationArtifactSummary[]
  readonly sourceDurationSeconds?: number
  readonly technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence
}): Promise<BoundedCaptionDesignStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_caption_design_adapter_not_configured',
      blockerMessage: 'No reviewed Caption Design runtime was configured for this private media study.',
    }
  }
  if (!input.runtime.captionOcrAuthorityResolver) {
    return {
      status: 'blocked',
      blockerCode: 'caption_ocr_result_unavailable',
      blockerMessage: 'A separately verified bounded OCR result is required before semantic Caption Design analysis. No provider call was made.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_media_checksum_unverified',
      blockerMessage: 'The finalized private reference lacks exact checksum authority, so Caption Design did not run.',
    }
  }
  if (
    input.technicalCaptionRegions.status !== 'verified_local_bounded'
    || !input.technicalCaptionRegions.technicalTextRegionCandidateAnalysisRan
    || input.technicalCaptionRegions.sampleCount < 1
    || input.technicalCaptionRegions.scannedDurationSeconds <= 0
  ) {
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_technical_region_evidence_unavailable',
      blockerMessage: 'Verified bounded text-region scanning is required before the OCR and semantic Caption Design stages.',
    }
  }
  const sourceDurationSeconds = input.sourceDurationSeconds
  if (typeof sourceDurationSeconds !== 'number' || !Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_duration_unavailable',
      blockerMessage: 'Verified source duration is required before bounded Caption Design analysis.',
    }
  }
  const analysisWindowStartSeconds = 0
  const analysisWindowEndSeconds = Math.min(
    sourceDurationSeconds,
    input.technicalCaptionRegions.scannedDurationSeconds,
    120,
  )
  if (analysisWindowEndSeconds <= analysisWindowStartSeconds) {
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_window_unavailable',
      blockerMessage: 'A positive bounded Caption Design analysis window could not be established.',
    }
  }

  const candidates = uniqueCaptionDesignCandidates([
    ...input.representativeFrames.slice(0, 4),
    ...input.keyframes.slice(0, 4),
  ]
    .map((artifact, index) => ({
      artifact,
      sourceTimeSeconds: artifact.timeSeconds ?? index * 2,
    }))
    .filter((candidate) => (
      candidate.sourceTimeSeconds >= analysisWindowStartSeconds
      && candidate.sourceTimeSeconds <= analysisWindowEndSeconds
    )))
  if (candidates.length < 1) {
    return {
      status: 'blocked',
      blockerCode: 'representative_frames_unavailable',
      blockerMessage: 'Caption Design requires at least one bounded private JPEG frame inside the verified scan window.',
    }
  }

  const specialistRoot = path.join(
    input.outputRoot,
    `caption-design-${createHash('sha256').update(`${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`).digest('hex').slice(0, 16)}`,
  )
  const resolvedFrames = new Map<string, string>()
  let ocrFrames: EditReferenceCaptionDesignOcrFrameAuthority[]
  try {
    await mkdir(specialistRoot, { mode: 0o700, recursive: false })
    ocrFrames = await Promise.all(candidates.map(async ({ artifact, sourceTimeSeconds }, index) => {
      if (!artifact.localFilePath || artifact.contentType !== 'image/jpeg' || artifact.isPrivate !== true) {
        throw new Error('caption_design_frame_artifact_unavailable')
      }
      if (artifact.sizeBytes !== undefined && (artifact.sizeBytes < 1 || artifact.sizeBytes > 2 * 1024 * 1024)) {
        throw new Error('caption_design_frame_artifact_outside_size_bound')
      }
      const bytes = await readPrivateFrameBytes(input.outputRoot, artifact.localFilePath)
      if (bytes.byteLength < 1 || bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error('caption_design_frame_bytes_outside_size_bound')
      }
      const dimensions = readJpegDimensions(bytes)
      const privateFrameArtifactId = `${artifact.artifactId}:caption-design:${index + 1}`
      const frameEvidenceId = `${privateFrameArtifactId}:evidence`
      const localFilePath = path.join(specialistRoot, `frame-${String(index + 1).padStart(2, '0')}.jpg`)
      await writeFile(localFilePath, bytes, { flag: 'wx', mode: 0o600 })
      resolvedFrames.set(privateFrameArtifactId, localFilePath)
      return {
        privateFrameArtifactId,
        frameEvidenceId,
        localFilePath,
        frameChecksumSha256: createHash('sha256').update(bytes).digest('hex'),
        sourceTimeSeconds,
        width: dimensions.width,
        height: dimensions.height,
      }
    }))
  } catch (error) {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    const preparationCode = safeCaptionDesignPreparationCode(error)
    return {
      status: 'blocked',
      blockerCode: 'frame_authority_unverified',
      blockerMessage: `Specialist-owned private JPEG copies could not be prepared with exact dimensions and checksums (${preparationCode}).`,
    }
  }

  const technicalCaptionRegionEvidenceId = `${input.sourceEvidenceId}:technical-caption-regions`
  const ocrInputEvidenceIds = [input.sourceEvidenceId, technicalCaptionRegionEvidenceId]
  const framePlanDigestSha256 = hashCaptionDesignOcrFramePlan(ocrFrames)
  let captionOcrAuthority: EditReferenceCaptionDesignOcrAuthority
  try {
    captionOcrAuthority = await input.runtime.captionOcrAuthorityResolver({
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      orchestrationId: input.runtime.orchestrationId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      sourceDurationSeconds,
      framePlanDigestSha256,
      inputEvidenceIds: ocrInputEvidenceIds,
      frames: ocrFrames,
    })
  } catch (error) {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'caption_ocr_result_unavailable',
      blockerMessage: `The separately reviewed OCR authority did not return an exact bounded result (${safeCaptionOcrResolverCode(error)}). No semantic provider call was made.`,
    }
  }

  try {
    validateCaptionDesignOcrAuthority({
      authority: captionOcrAuthority,
      runtime: input.runtime,
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      framePlanDigestSha256,
      inputEvidenceIds: ocrInputEvidenceIds,
      requestedFrameTimesSeconds: ocrFrames.map((frame) => frame.sourceTimeSeconds),
    })
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'caption_ocr_authority_unverified',
      blockerMessage: 'The bounded OCR result failed exact identity, frame-plan, provenance, review, privacy, or cost-authority verification.',
    }
  }

  const analyzedTimes = new Set(captionOcrAuthority.result.coverage.analyzedFrameTimesSeconds)
  const analyzedFrames = ocrFrames.filter((frame) => analyzedTimes.has(frame.sourceTimeSeconds))
  const captionOcrRegionCount = captionOcrAuthority.result.observations
    .reduce((sum, observation) => sum + observation.textRegions.length, 0)
  if (analyzedFrames.length < 1) {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'caption_ocr_result_unavailable',
      blockerMessage: 'The verified OCR pass did not provide at least one analyzed frame.',
    }
  }
  if (captionOcrRegionCount === 0) {
    const fullRequestedFrameCoverage = (
      captionOcrAuthority.result.coverage.partial === false
      && captionOcrAuthority.result.coverage.failedFrameTimesSeconds.length === 0
      && analyzedFrames.length === candidates.length
      && captionOcrAuthority.result.summary.analyzedFrameCount === candidates.length
    )
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    if (!fullRequestedFrameCoverage) {
      return {
        status: 'blocked',
        blockerCode: 'caption_ocr_result_unavailable',
        blockerMessage: 'A partial OCR pass cannot establish that the sampled window contains no visible caption system.',
      }
    }
    return {
      status: 'observed_absent',
      observedAbsence: {
        kind: 'caption_design_not_observed',
        privateMediaArtifactId: input.privateMediaArtifactId,
        mediaChecksumSha256: input.mediaChecksumSha256,
        sourceDurationSeconds,
        technicalCandidateRegionCount: input.technicalCaptionRegions.totalCandidateRegionCount,
        requestedFrameCount: candidates.length,
        analyzedFrameCount: analyzedFrames.length,
        captionOcrRegionCount: 0,
        fullRequestedFrameCoverage: true,
        captionOcrRequestDigestSha256: captionOcrAuthority.result.requestDigestSha256,
        captionOcrResultDigestSha256: hashEditReferenceCaptionOcrStudyResult(
          captionOcrAuthority.request,
          captionOcrAuthority.result,
        ),
        inputEvidenceIds: [...captionOcrAuthority.result.inputEvidenceIds],
        analysisArtifactIds: [...captionOcrAuthority.result.analysisArtifactIds],
        runtimeSource: captionOcrAuthority.result.runtimeSource,
        provenance: structuredClone(captionOcrAuthority.result.provenance),
        usage: structuredClone(captionOcrAuthority.result.usage),
        execution: structuredClone(captionOcrAuthority.result.execution),
        exactTextPersisted: false,
        rawOcrOutputPersisted: false,
        semanticProviderCallMade: false,
      },
    }
  }

  const frameSamples: EditReferenceCaptionDesignFrameEvidence[] = analyzedFrames.map((frame, index) => ({
    role: index === 0 ? 'representative' : 'caption_detail',
    frameEvidenceId: frame.frameEvidenceId,
    privateFrameArtifactId: frame.privateFrameArtifactId,
    frameChecksumSha256: frame.frameChecksumSha256,
    sourceTimeSeconds: frame.sourceTimeSeconds,
    width: frame.width,
    height: frame.height,
    privateAccessVerified: true,
    ephemeral: true,
    cleanupRequired: true,
  }))
  for (const frame of ocrFrames) {
    if (!analyzedTimes.has(frame.sourceTimeSeconds)) {
      await unlink(frame.localFilePath).catch(() => undefined)
      resolvedFrames.delete(frame.privateFrameArtifactId)
    }
  }
  const timed = false
  const evidence = {
    mediaStructureEvidenceIds: [input.sourceEvidenceId],
    representativeFrameEvidenceIds: frameSamples.map((frame) => frame.frameEvidenceId),
    technicalCaptionRegionEvidenceIds: [technicalCaptionRegionEvidenceId],
    captionOcrEvidenceIds: [...captionOcrAuthority.result.analysisArtifactIds],
    visualLanguageEvidenceIds: [],
    transcriptEvidenceIds: [],
    segmentTimingEvidenceIds: [],
    wordTimingEvidenceIds: [],
    studyChatGoalEvidenceIds: [input.runtime.studyGoalEvidenceId],
    factSafetyEvidenceIds: [],
  }
  const productionAuthority = input.runtime.productionAuthority
  const request: EditReferenceCaptionDesignStudyRequest = {
    schemaVersion: EDIT_REFERENCE_CAPTION_DESIGN_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.runtime.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    evidenceManifestDigestSha256: hashEditReferenceCaptionDesignEvidenceManifest({ evidence }),
    frameManifestDigestSha256: hashEditReferenceCaptionDesignFrameManifest(frameSamples),
    captionOcrResultDigestSha256: hashEditReferenceCaptionOcrStudyResult(
      captionOcrAuthority.request,
      captionOcrAuthority.result,
    ),
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    evidenceAuthorityVerified: true,
    frameAuthorityVerified: true,
    captionOcrResultAuthorityVerified: true,
    frameSamples,
    evidence,
    captionOcrRuntimeSource: captionOcrAuthority.result.runtimeSource,
    captionOcrAdapterId: captionOcrAuthority.result.provenance.adapterId,
    captionOcrAdapterVersion: captionOcrAuthority.result.provenance.adapterVersion,
    captionOcrExecutionId: captionOcrAuthority.result.provenance.executionId,
    captionOcrCoverage: captionOcrAuthority.result.coverage.partial ? 'partial' : 'full',
    captionOcrAnalyzedFrameCount: captionOcrAuthority.result.summary.analyzedFrameCount,
    captionOcrRegionCount,
    captionOcrRuntimeExecuted: true,
    captionOcrExactTextPersisted: false,
    captionOcrRawOutputPersisted: false,
    evidenceMode: timed ? 'visual_ocr_word_timing' : 'visual_ocr',
    privateTranscriptArtifactId: null,
    transcriptChecksumSha256: null,
    privateWordTimingArtifactId: null,
    wordTimingChecksumSha256: null,
    privateTranscriptAccessVerified: timed,
    privateTranscriptFinalized: timed,
    transcriptChecksumVerified: timed,
    transcriptRuntimeExecuted: timed,
    transcriptRuntimeSource: timed ? 'verified_local' : null,
    transcriptRuntimeId: null,
    transcriptRuntimeVersion: null,
    transcriptModelManifestId: null,
    transcriptExecutionId: null,
    transcriptQaStatus: timed ? 'passed' : null,
    segmentTimingAuthorityVerified: timed,
    wordTimingAuthorityVerified: timed,
    transcriptSegmentCount: 0,
    alignedWordCount: 0,
    sourceDurationSeconds,
    analysisWindowStartSeconds,
    analysisWindowEndSeconds,
    sourceClaimsPresent: false,
    maxFrameCount: 8,
    maxEvidenceItems: 64,
    maxStructuredContextCharacters: 32_000,
    maxScanDurationSeconds: 120,
    executionScope: productionAuthority ? 'production' : 'controlled_test',
    approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
    immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
    maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
    boundedPrivateFrameInputAllowed: true,
    boundedPrivateTranscriptInputAllowed: true,
    rawFullMediaInputAllowed: false,
    rawRecognizedTextInputAllowed: false,
    rawTranscriptInRequestAllowed: false,
    externalUrlFetchAllowed: false,
    mockTranscriptInputAllowed: false,
    interpolatedWordTimingAllowed: false,
    rawFramePersistenceAllowed: false,
    rawOcrOutputPersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    exactReferenceCaptionWordingTransferAllowed: false,
    exactReferenceFontIdentityTransferAllowed: false,
    exactReferenceLineBreakTransferAllowed: false,
    exactReferenceHighlightWordTransferAllowed: false,
    exactReferenceColorValueTransferAllowed: false,
    exactReferenceLayoutTransferAllowed: false,
    exactReferenceAnimationCurveTransferAllowed: false,
    exactReferenceTimingTransferAllowed: false,
    copyrightedFontOrBrandAssetTransferAllowed: false,
    executableCaptionPlanAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  const resolvePrivateFrame = async (sample: EditReferenceCaptionDesignFrameEvidence) => {
    const localFilePath = resolvedFrames.get(sample.privateFrameArtifactId)
    if (!localFilePath) throw new Error('private_caption_design_frame_not_resolved')
    return { privateFrameArtifactId: sample.privateFrameArtifactId, localFilePath }
  }
  const cleanupPrivateFrames = async (
    frames: readonly { readonly localFilePath: string }[],
  ) => {
    await Promise.all(frames.map(async (frame) => unlink(frame.localFilePath)))
  }
  let adapter: EditReferenceCaptionDesignStudyAdapter
  try {
    adapter = createEditReferenceQwenCaptionDesignAdapter({
      provider: input.runtime.provider,
      privateFrameRoot: specialistRoot,
      captionOcrRequest: captionOcrAuthority.request,
      captionOcrResult: captionOcrAuthority.result,
      resolvePrivateFrame,
      cleanupPrivateFrames,
      productionUsageAuthority: productionAuthority?.usageAuthority,
      createExecutionId: () => `caption-design:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
    })
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_runtime_unavailable',
      blockerMessage: 'The reviewed Caption Design runtime, model, manifest, or exact timing authority failed closed.',
    }
  }

  try {
    const result = await adapter.analyze(request)
    await rm(specialistRoot, { force: true, recursive: true })
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.blockerCode,
          blockerMessage: result.blockerMessage,
        }
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_caption_design_runtime_failed',
      blockerMessage: 'The bounded Caption Design adapter failed closed without persisting specialist frames or OCR text.',
    }
  }
}

function uniqueCaptionDesignCandidates<T extends {
  readonly artifact: MediaFoundationArtifactSummary
  readonly sourceTimeSeconds: number
}>(candidates: readonly T[]): T[] {
  const artifactIds = new Set<string>()
  const sourceTimes = new Set<number>()
  return [...candidates]
    .sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds)
    .filter((candidate) => {
      if (artifactIds.has(candidate.artifact.artifactId) || sourceTimes.has(candidate.sourceTimeSeconds)) return false
      artifactIds.add(candidate.artifact.artifactId)
      sourceTimes.add(candidate.sourceTimeSeconds)
      return true
    })
    .slice(0, 8)
}

function hashCaptionDesignOcrFramePlan(
  frames: readonly EditReferenceCaptionDesignOcrFrameAuthority[],
): string {
  return createHash('sha256').update(JSON.stringify(frames.map((frame) => ({
    sourceTimeSeconds: frame.sourceTimeSeconds,
    frameChecksumSha256: frame.frameChecksumSha256,
  })))).digest('hex')
}

function validateCaptionDesignOcrAuthority(input: {
  readonly authority: EditReferenceCaptionDesignOcrAuthority
  readonly runtime: EditReferenceCaptionDesignRuntimeInput
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly framePlanDigestSha256: string
  readonly inputEvidenceIds: readonly string[]
  readonly requestedFrameTimesSeconds: readonly number[]
}): void {
  validateEditReferenceCaptionOcrStudyRequest(input.authority.request)
  validateEditReferenceCaptionOcrStudyResult(input.authority.request, input.authority.result)
  const request = input.authority.request
  const result = input.authority.result
  const expectedExecutionScope = input.runtime.productionAuthority
    ? 'production'
    : 'controlled_test'
  if (
    request.workspaceId !== input.workspaceId
    || request.editReferenceId !== input.editReferenceId
    || request.studySessionId !== input.studySessionId
    || request.orchestrationId !== input.runtime.orchestrationId
    || request.privateMediaArtifactId !== input.privateMediaArtifactId
    || request.mediaChecksumSha256 !== input.mediaChecksumSha256
    || request.framePlanDigestSha256 !== input.framePlanDigestSha256
    || request.executionScope !== expectedExecutionScope
    || !sameOrderedStrings(request.inputEvidenceIds, input.inputEvidenceIds)
    || !sameOrderedNumbers(request.frameTimesSeconds, input.requestedFrameTimesSeconds)
    || !sameOrderedNumbers(result.coverage.requestedFrameTimesSeconds, input.requestedFrameTimesSeconds)
    || result.privacy.recognizedTextPersisted !== false
    || result.privacy.rawOcrOutputPersisted !== false
    || result.semanticBoundary.captionDesignInterpreted !== false
    || result.semanticBoundary.transcriptAlignmentRan !== false
    || result.semanticBoundary.speechTimingRan !== false
  ) {
    throw new Error('caption_ocr_authority_mismatch')
  }
}

function sameOrderedStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sameOrderedNumbers(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function safeCaptionDesignPreparationCode(error: unknown): string {
  const value = error instanceof Error ? error.message : ''
  if ([
    'caption_design_frame_artifact_unavailable',
    'caption_design_frame_artifact_outside_size_bound',
    'caption_design_frame_bytes_outside_size_bound',
    'frame_root_invalid',
    'frame_file_invalid',
    'frame_outside_private_root',
    'frame_bytes_outside_size_bound',
    'jpeg_signature_invalid',
    'jpeg_dimensions_unavailable',
  ].includes(value)) return value
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return ['EACCES', 'EEXIST', 'EINVAL', 'EIO', 'ENOENT', 'ENOSPC', 'EPERM'].includes(error.code)
      ? `private_frame_${error.code.toLowerCase()}`
      : 'private_frame_preparation_failed'
  }
  return error instanceof Error && ['TypeError', 'RangeError'].includes(error.name)
    ? `private_frame_${error.name.toLowerCase()}`
    : 'private_frame_preparation_failed'
}

function safeCaptionOcrResolverCode(error: unknown): string {
  const value = error instanceof Error ? error.message : ''
  if (/resolver input changed/.test(value)) return 'resolver_binding_changed'
  if (/multi-frame authority is incomplete or mismatched/.test(value)) return 'multi_frame_authority_mismatch'
  if (/one-frame request does not resolve/.test(value)) return 'frame_identity_unresolved'
  if (/frame checksum changed/.test(value)) return 'frame_checksum_changed'
  if (/frame execution failed closed/.test(value)) return 'ocr_runtime_failed_closed'
  if (/result.*invalid|invalid.*result/i.test(value)) return 'ocr_result_invalid'
  return 'ocr_authority_unavailable'
}

export interface BoundedSpeechPacingStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceSpeechPacingStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export interface BoundedAudioSoundDesignStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceAudioSoundDesignStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export async function runBoundedAudioSoundDesignStudy(input: {
  readonly runtime?: EditReferenceAudioSoundDesignRuntimeInput
  readonly outputRoot: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly sourceDurationSeconds?: number
  readonly privateAudioArtifact?: MediaFoundationArtifactSummary
  readonly sampleRate?: number
  readonly channels?: number
  readonly technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence
}): Promise<BoundedAudioSoundDesignStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_audio_sound_design_adapter_not_configured',
      blockerMessage: 'No provider-neutral Audio/Sound Design runtime was configured for this private media study.',
    }
  }
  let provider: EditReferenceAudioSoundDesignProvider
  let productionAuthority: EditReferenceAudioSoundDesignProductionAuthority | undefined
  try {
    if (input.runtime.runtimeKind === 'reviewed_local_ast_audioset') {
      const runtime = await validateEditReferenceReviewedLocalAstAudioSetRuntime({
        manifestPath: input.runtime.manifestPath,
        modelPath: input.runtime.modelPath,
        pythonCommand: input.runtime.pythonCommand,
      })
      provider = createEditReferenceReviewedLocalAstAudioSetProvider({
        runtime,
        modelPath: input.runtime.modelPath,
        pythonCommand: input.runtime.pythonCommand,
        runnerScriptPath: input.runtime.runnerScriptPath,
        timeoutMs: input.runtime.timeoutMs,
      })
    } else {
      provider = input.runtime.provider
      productionAuthority = input.runtime.productionAuthority
    }
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'semantic_audio_runtime_unavailable',
      blockerMessage: 'The reviewed local semantic-audio runtime, model, or manifest failed exact validation.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'private_artifact_unavailable',
      blockerMessage: 'Audio/Sound Design requires an exact finalized private-media checksum.',
    }
  }
  const audioArtifact = input.privateAudioArtifact
  if (
    !audioArtifact
    || audioArtifact.isPrivate !== true
    || audioArtifact.sourceOfTruth !== true
    || !audioArtifact.localFilePath
  ) {
    return {
      status: 'blocked',
      blockerCode: 'bounded_private_audio_unavailable',
      blockerMessage: 'Audio/Sound Design requires finalized private extracted audio with local worker authority.',
    }
  }
  const sourceDurationSeconds = input.sourceDurationSeconds
  if (typeof sourceDurationSeconds !== 'number' || !Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'bounded_private_audio_unavailable',
      blockerMessage: 'Audio/Sound Design requires verified source duration before a bounded sample can be prepared.',
    }
  }
  if (
    input.technicalAudioLowLevel.status !== 'verified_local_bounded'
    || input.technicalAudioLowLevel.scannedDurationSeconds <= 0
  ) {
    return {
      status: 'blocked',
      blockerCode: 'technical_low_level_result_unavailable',
      blockerMessage: 'Verified bounded low-level technical audio evidence is required before semantic Audio/Sound Design analysis.',
    }
  }
  const sampleRate = input.sampleRate
  const channels = input.channels
  if (
    typeof sampleRate !== 'number'
    || !Number.isSafeInteger(sampleRate)
    || sampleRate < 8_000
    || sampleRate > 192_000
    || typeof channels !== 'number'
    || !Number.isSafeInteger(channels)
    || channels < 1
    || channels > 8
  ) {
    return {
      status: 'blocked',
      blockerCode: 'audio_authority_unverified',
      blockerMessage: 'The extracted private audio lacks exact sample-rate or channel authority.',
    }
  }
  if (input.technicalAudioLowLevel.detectedIntervalCount > 50) {
    return {
      status: 'blocked',
      blockerCode: 'technical_low_level_authority_unverified',
      blockerMessage: 'The bounded low-level result exceeds the semantic specialist evidence limit and cannot be silently truncated.',
    }
  }

  const analysisWindowStartSeconds = 0
  const analysisWindowEndSeconds = Math.min(
    sourceDurationSeconds,
    input.technicalAudioLowLevel.scannedDurationSeconds,
    120,
  )
  if (analysisWindowEndSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'bounded_private_audio_unavailable',
      blockerMessage: 'A positive bounded Audio/Sound Design analysis window could not be established.',
    }
  }

  const specialistRoot = path.join(
    input.outputRoot,
    `audio-sound-design-${createHash('sha256').update(`${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`).digest('hex').slice(0, 16)}`,
  )
  const boundedAudioPath = path.join(specialistRoot, 'bounded-reference-audio.wav')
  let boundedAudioArtifact: MediaFoundationArtifactSummary
  let boundedLoudness: EditReferenceTechnicalAudioSummary
  try {
    await mkdir(specialistRoot, { mode: 0o700, recursive: false })
    await runFFmpegAudioCommand({
      ...buildFFmpegAudioTrimCommand({
        sourceAudioLocalPath: audioArtifact.localFilePath,
        outputAudioLocalPath: boundedAudioPath,
        safeOutputRoot: specialistRoot,
        ffmpegBin: 'ffmpeg',
        timeoutMs: 30_000,
        operation: 'trim_audio',
        trimStartSeconds: analysisWindowStartSeconds,
        trimDurationSeconds: analysisWindowEndSeconds - analysisWindowStartSeconds,
        runMode: 'local_dev',
      }),
      timeoutMs: 30_000,
    })
    boundedAudioArtifact = await attachPrivateArtifactChecksum(specialistRoot, {
      artifactId: `${audioArtifact.artifactId}:audio-sound-design`,
      artifactType: audioArtifact.artifactType,
      storageBucketPurpose: audioArtifact.storageBucketPurpose,
      storageObjectPath: `${audioArtifact.storageObjectPath}:audio-sound-design-bounded`,
      localFilePath: boundedAudioPath,
      contentType: 'audio/wav',
      sourceOfTruth: true,
      isPrivate: true,
    })
    boundedLoudness = await studyTechnicalAudio({
      audioLocalPath: boundedAudioPath,
      ffmpegBin: 'ffmpeg',
      timeoutMs: 30_000,
      hasAudioStream: true,
    })
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'bounded_private_audio_unavailable',
      blockerMessage: 'A specialist-owned bounded WAV sample could not be prepared and verified.',
    }
  }
  if (
    boundedLoudness.status !== 'verified_local'
    || typeof boundedLoudness.integratedLufs !== 'number'
    || typeof boundedLoudness.truePeakDb !== 'number'
  ) {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'technical_loudness_result_unavailable',
      blockerMessage: 'The bounded WAV sample did not produce exact FFmpeg loudness and true-peak evidence.',
    }
  }

  const mediaEvidenceId = `${input.sourceEvidenceId}:audio-media-structure`
  const privateAudioEvidenceId = `${input.sourceEvidenceId}:audio-private-sample`
  const loudnessEvidenceId = `${input.sourceEvidenceId}:audio-technical-loudness`
  const lowLevelEvidenceId = `${input.sourceEvidenceId}:audio-technical-low-level`
  const rightsEvidenceId = `${input.sourceEvidenceId}:audio-rights`
  const evidence: EditReferenceAudioSoundDesignEvidenceManifest = {
    mediaStructureEvidenceIds: [mediaEvidenceId],
    privateAudioEvidenceIds: [privateAudioEvidenceId],
    technicalLoudnessEvidenceIds: [loudnessEvidenceId],
    technicalLowLevelIntervalEvidenceIds: [lowLevelEvidenceId],
    transcriptTimingEvidenceIds: [],
    beatGridEvidenceIds: [],
    visualCueTimingEvidenceIds: [],
    studyChatGoalEvidenceIds: [input.runtime.studyGoalEvidenceId],
    rightsAndAssetEvidenceIds: [rightsEvidenceId],
  }
  const loudnessWithoutDigest: Omit<EditReferenceAudioSoundDesignTechnicalLoudnessAuthority, 'resultDigestSha256'> = {
    schemaVersion: 'edit-reference-technical-audio-loudness-v1',
    evidenceId: loudnessEvidenceId,
    runtimeSource: 'verified_local',
    executionId: `audio-loudness:${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`,
    toolIds: ['ffmpeg'],
    status: 'verified_local',
    scannedDurationSeconds: analysisWindowEndSeconds - analysisWindowStartSeconds,
    integratedLufs: boundedLoudness.integratedLufs,
    truePeakDb: boundedLoudness.truePeakDb,
    semanticAudioAnalysisRan: false,
    musicMoodOrEnergyAnalysisRan: false,
    tempoOrBeatAnalysisRan: false,
    voiceMusicBalanceAnalysisRan: false,
    duckingAnalysisRan: false,
    sfxOrAmbienceAnalysisRan: false,
    rawAudioPersisted: false,
    rawProcessOutputPersisted: false,
  }
  const technicalLoudnessResultDigestSha256 =
    hashEditReferenceAudioSoundDesignTechnicalLoudnessAuthority(loudnessWithoutDigest)
  const retainedIntervals = input.technicalAudioLowLevel.intervals
    .filter((interval) => interval.endSeconds <= analysisWindowEndSeconds + 0.001)
    .slice(0, 24)
    .map((interval) => ({ ...interval }))
  const lowLevelTotal = retainedIntervals.reduce((sum, interval) => sum + interval.durationSeconds, 0)
  const lowLevelLongest = retainedIntervals.length > 0
    ? Math.max(...retainedIntervals.map((interval) => interval.durationSeconds))
    : 0
  const lowLevelWithoutDigest: Omit<EditReferenceAudioSoundDesignTechnicalLowLevelAuthority, 'resultDigestSha256'> = {
    schemaVersion: 'edit-reference-technical-audio-low-level-v1',
    evidenceId: lowLevelEvidenceId,
    runtimeSource: 'verified_local',
    executionId: `audio-low-level:${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`,
    toolIds: ['ffmpeg'],
    status: 'verified_local_bounded',
    coverage: input.technicalAudioLowLevel.coverage === 'partial' ? 'partial' : 'full',
    thresholdDb: input.technicalAudioLowLevel.thresholdDb,
    minimumDurationSeconds: input.technicalAudioLowLevel.minimumDurationSeconds,
    detectedIntervalCount: input.technicalAudioLowLevel.detectedIntervalCount,
    intervals: retainedIntervals,
    intervalsTruncated: input.technicalAudioLowLevel.detectedIntervalCount > retainedIntervals.length,
    scannedDurationSeconds: analysisWindowEndSeconds,
    totalLowLevelDurationSeconds: Number(lowLevelTotal.toFixed(3)),
    longestLowLevelDurationSeconds: Number(lowLevelLongest.toFixed(3)),
    semanticAudioAnalysisRan: false,
    speechPauseClassificationRan: false,
    musicOrSfxAnalysisRan: false,
    trimRecommendationRan: false,
    rawAudioPersisted: false,
    rawProcessOutputPersisted: false,
  }
  const technicalLowLevelResultDigestSha256 =
    hashEditReferenceAudioSoundDesignTechnicalLowLevelAuthority(lowLevelWithoutDigest)
  const audioSample = {
    role: 'reference_mix' as const,
    audioEvidenceId: privateAudioEvidenceId,
    privateAudioArtifactId: boundedAudioArtifact.artifactId,
    audioChecksumSha256: boundedAudioArtifact.checksum!,
    startSeconds: analysisWindowStartSeconds,
    endSeconds: analysisWindowEndSeconds,
    durationSeconds: analysisWindowEndSeconds - analysisWindowStartSeconds,
    sampleRate,
    channels,
    privateAccessVerified: true as const,
    boundedWindowOnly: true as const,
    ephemeral: true as const,
    cleanupRequired: true as const,
  }
  const request: EditReferenceAudioSoundDesignStudyRequest = {
    schemaVersion: EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.runtime.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    evidenceManifestDigestSha256: hashEditReferenceAudioSoundDesignEvidenceManifest(evidence),
    audioManifestDigestSha256: hashEditReferenceAudioSoundDesignAudioManifest([audioSample]),
    technicalLoudnessResultDigestSha256,
    technicalLowLevelResultDigestSha256,
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    evidenceAuthorityVerified: true,
    audioAuthorityVerified: true,
    technicalLoudnessAuthorityVerified: true,
    technicalLowLevelAuthorityVerified: true,
    evidenceMode: 'bounded_audio_and_technical_signals',
    audioSamples: [audioSample],
    evidence,
    technicalLoudnessAuthority: {
      ...loudnessWithoutDigest,
      resultDigestSha256: technicalLoudnessResultDigestSha256,
    },
    technicalLowLevelAuthority: {
      ...lowLevelWithoutDigest,
      resultDigestSha256: technicalLowLevelResultDigestSha256,
    },
    sourceDurationSeconds,
    analysisWindowStartSeconds,
    analysisWindowEndSeconds,
    verifiedSpeechTimingAvailable: false,
    verifiedBeatGridAvailable: false,
    verifiedVisualCueTimingAvailable: false,
    sourceAudioRightsBasis: input.runtime.sourceAudioRightsBasis,
    maxAudioSampleCount: 1,
    maxEvidenceItems: 64,
    maxStructuredContextCharacters: 32_000,
    maxScanDurationSeconds: 120,
    executionScope: productionAuthority ? 'production' : 'controlled_test',
    approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
    immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
    maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
    boundedPrivateAudioInputAllowed: true,
    rawFullMediaInputAllowed: false,
    rawAudioPersistenceAllowed: false,
    rawWaveformOrSpectrogramPersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    technicalSignalsMayEstablishSemanticAudioIntent: false,
    lowLevelIntervalsMayEstablishSpeechPauseMeaning: false,
    exactMusicAssetTransferAllowed: false,
    exactSfxAssetTransferAllowed: false,
    exactMelodyLyricsOrHarmonyTransferAllowed: false,
    exactAudioFingerprintRetentionAllowed: false,
    exactBpmOrBeatGridTransferAllowed: false,
    exactCueTimingMapTransferAllowed: false,
    exactDuckingCurveOrGainTransferAllowed: false,
    exactMixSettingTransferAllowed: false,
    referenceAudioLibraryPromotionAllowed: false,
    referenceDerivedAudioGenerationAllowed: false,
    userOwnedOrLicensedAudioHandledBySeparateTargetAssetWorkflow: true,
    executableTargetAudioOperationAllowed: false,
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  const adapter = createEditReferenceAudioSoundDesignAdapter({
    provider,
    privateAudioRoot: specialistRoot,
    resolvePrivateAudio: async (sample) => {
      if (sample.privateAudioArtifactId !== boundedAudioArtifact.artifactId) {
        throw new Error('private_audio_not_resolved')
      }
      return {
        privateAudioArtifactId: boundedAudioArtifact.artifactId,
        localFilePath: boundedAudioPath,
        contentType: 'audio/wav',
      }
    },
    cleanupPrivateAudio: async () => {
      await unlink(boundedAudioPath)
    },
    productionUsageAuthority: productionAuthority?.usageAuthority,
    createExecutionId: () => `audio-sound-design:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
  })

  try {
    const result = await adapter.analyze(request)
    await rm(specialistRoot, { force: true, recursive: true })
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.status === 'blocked' ? result.blockerCode : 'bounded_private_audio_unavailable',
          blockerMessage: result.status === 'blocked' ? result.blockerMessage : result.retryReason,
        }
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_audio_sound_design_runtime_failed',
      blockerMessage: 'The bounded Audio/Sound Design adapter failed closed without persisting specialist audio.',
    }
  }
}

export async function runBoundedSpeechPacingStudy(input: {
  readonly runtime?: EditReferenceSpeechPacingRuntimeInput
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly sourceDurationSeconds?: number
  readonly privateAudioArtifact?: MediaFoundationArtifactSummary
  readonly technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence
}): Promise<BoundedSpeechPacingStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_speech_pacing_adapter_not_configured',
      blockerMessage: 'The reviewed Speech/Pacing transcript authority and reasoning adapter are not configured.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'private_artifact_unavailable',
      blockerMessage: 'Speech/Pacing requires an exact finalized private-media checksum.',
    }
  }
  const audioArtifact = input.privateAudioArtifact
  if (
    !audioArtifact
    || audioArtifact.isPrivate !== true
    || audioArtifact.sourceOfTruth !== true
    || !audioArtifact.localFilePath
    || !audioArtifact.checksum
    || !/^[a-f0-9]{64}$/.test(audioArtifact.checksum)
  ) {
    return {
      status: 'blocked',
      blockerCode: 'private_audio_unavailable',
      blockerMessage: 'Speech/Pacing requires finalized private extracted audio with exact checksum and local worker authority.',
    }
  }
  const sourceDurationSeconds = input.sourceDurationSeconds
  if (typeof sourceDurationSeconds !== 'number' || !Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) {
    return {
      status: 'blocked',
      blockerCode: 'segment_timing_unavailable',
      blockerMessage: 'Speech/Pacing requires verified source duration before transcript timing can be bounded.',
    }
  }
  if (!input.runtime.transcriptAuthorityResolver) {
    return {
      status: 'blocked',
      blockerCode: 'transcript_runtime_unavailable',
      blockerMessage: 'The shared approved transcript and alignment authority is unavailable; no transcript or Speech/Pacing finding was synthesized.',
    }
  }

  let authority: EditReferenceSpeechPacingTranscriptAuthority
  try {
    authority = await input.runtime.transcriptAuthorityResolver({
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      privateAudioArtifactId: audioArtifact.artifactId,
      audioChecksumSha256: audioArtifact.checksum,
      privateAudioLocalPath: audioArtifact.localFilePath,
      sourceDurationSeconds,
    })
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'transcript_runtime_unavailable',
      blockerMessage: 'The shared transcript authority could not resolve a verified non-mock transcript for this exact private audio artifact.',
    }
  }

  try {
    if (authority.interpolatedWordTimingUsed !== false) {
      return {
        status: 'blocked',
        blockerCode: 'word_timing_unavailable',
        blockerMessage: 'The shared transcript artifact contains interpolated word timing, so word-level Speech/Pacing and caption-timing evidence remain blocked until exact model-aligned or forced-aligned timing is available.',
      }
    }
    validateResolvedSpeechPacingAuthority(authority, {
      privateAudioArtifactId: audioArtifact.artifactId,
      sourceDurationSeconds,
    })
    const analysisWindowStartSeconds = 0
    const analysisWindowEndSeconds = Math.min(sourceDurationSeconds, 120)
    const transcriptSegments = authority.transcriptPayload.segments
      .filter((segment) => (
        segment.startSeconds >= analysisWindowStartSeconds - 0.001
        && segment.endSeconds <= analysisWindowEndSeconds + 0.001
      ))
      .map((segment) => ({
        segmentId: segment.segmentId,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        text: segment.text,
        ...(typeof segment.confidence === 'number' ? { confidence: segment.confidence } : {}),
        words: authority.wordTimingMode === 'not_available'
          ? []
          : segment.words.map((word) => ({
              word: word.word,
              startSeconds: word.startSeconds,
              endSeconds: word.endSeconds,
              ...(typeof word.confidence === 'number' ? { confidence: word.confidence } : {}),
            })),
      }))
    if (transcriptSegments.length < 1) {
      return {
        status: 'blocked',
        blockerCode: 'segment_timing_unavailable',
        blockerMessage: 'The verified transcript contains no complete segment inside the bounded Speech/Pacing analysis window.',
      }
    }
    const speakerTurns = authority.speakerSegments
      .filter((turn) => (
        turn.startSeconds >= analysisWindowStartSeconds - 0.001
        && turn.endSeconds <= analysisWindowEndSeconds + 0.001
      ))
      .map((turn) => ({
        speakerId: turn.speakerId,
        startSeconds: turn.startSeconds,
        endSeconds: turn.endSeconds,
        evidenceIds: [...turn.evidenceIds],
      }))
    const mediaStructureEvidenceId = `${input.sourceEvidenceId}:speech-media-structure`
    const privateAudioEvidenceId = `${input.sourceEvidenceId}:speech-private-audio`
    const technicalLowLevelEvidence = input.technicalAudioLowLevel.status === 'verified_local_bounded'
      ? [{
          evidenceId: `${input.sourceEvidenceId}:speech-technical-low-level`,
          summary: `${input.technicalAudioLowLevel.detectedIntervalCount} bounded low-level interval candidate${input.technicalAudioLowLevel.detectedIntervalCount === 1 ? '' : 's'} were measured; these technical signals are nonsemantic and cannot establish speech pauses by themselves.`,
        }]
      : []
    const evidenceItems: Array<{
      evidenceId: string
      kind: QwenSpeechPacingEvidenceKind
      summary: string
    }> = [
      {
        evidenceId: mediaStructureEvidenceId,
        kind: 'media_structure',
        summary: 'Exact private media duration and audio presence were verified by the bounded media foundation.',
      },
      {
        evidenceId: privateAudioEvidenceId,
        kind: 'private_audio',
        summary: 'A finalized private extracted-audio artifact with exact checksum was authorized for the shared transcript runtime.',
      },
      ...authority.transcriptEvidence.map((item) => ({ ...item, kind: 'transcript' as const })),
      ...authority.segmentTimingEvidence.map((item) => ({ ...item, kind: 'segment_timing' as const })),
      ...authority.wordTimingEvidence.map((item) => ({ ...item, kind: 'word_timing' as const })),
      ...authority.speakerSegmentationEvidence.map((item) => ({ ...item, kind: 'speaker_segmentation' as const })),
      ...technicalLowLevelEvidence.map((item) => ({ ...item, kind: 'technical_low_level_interval' as const })),
      ...input.runtime.studyGoalEvidence.map((item) => ({ ...item, kind: 'study_goal' as const })),
      ...authority.factSafetyEvidence.map((item) => ({ ...item, kind: 'fact_safety' as const })),
    ]
    if (input.runtime.studyGoalEvidence.length < 1) {
      return {
        status: 'blocked',
        blockerCode: 'evidence_authority_unverified',
        blockerMessage: 'Speech/Pacing requires at least one saved Study Chat goal evidence item.',
      }
    }
    if (new Set(evidenceItems.map((item) => item.evidenceId)).size !== evidenceItems.length) {
      return {
        status: 'blocked',
        blockerCode: 'evidence_authority_unverified',
        blockerMessage: 'Speech/Pacing evidence authority contains duplicate identities.',
      }
    }
    const idsFor = (kind: QwenSpeechPacingEvidenceKind): string[] => evidenceItems
      .filter((item) => item.kind === kind)
      .map((item) => item.evidenceId)
    const evidence: EditReferenceSpeechPacingEvidenceManifest = {
      mediaStructureEvidenceIds: idsFor('media_structure'),
      privateAudioEvidenceIds: idsFor('private_audio'),
      transcriptEvidenceIds: idsFor('transcript'),
      segmentTimingEvidenceIds: idsFor('segment_timing'),
      wordTimingEvidenceIds: idsFor('word_timing'),
      speakerSegmentationEvidenceIds: idsFor('speaker_segmentation'),
      technicalLowLevelIntervalEvidenceIds: idsFor('technical_low_level_interval'),
      studyChatGoalEvidenceIds: idsFor('study_goal'),
      factSafetyEvidenceIds: idsFor('fact_safety'),
    }
    const evidenceManifestDigestSha256 = hashSpeechPacingEvidenceManifest(evidence)
    const structuredContext: QwenSpeechPacingStructuredContext = {
      schemaVersion: 'edit-reference-speech-pacing-structured-context-v1',
      evidenceManifestDigestSha256,
      transcriptChecksumSha256: authority.transcriptChecksumSha256,
      wordTimingChecksumSha256: authority.wordTimingChecksumSha256,
      speakerSegmentationChecksumSha256: authority.speakerSegmentationChecksumSha256,
      sourceDurationSeconds,
      analysisWindowStartSeconds,
      analysisWindowEndSeconds,
      transcriptLanguage: authority.transcriptPayload.language ?? 'und',
      segmentTimingMode: authority.segmentTimingMode,
      wordTimingMode: authority.wordTimingMode,
      speakerSegmentationMode: authority.speakerSegmentationMode,
      sourceClaimsPresent: authority.sourceClaimsPresent,
      evidenceItems,
      transcriptSegments,
      speakerTurns,
      boundaries: {
        transcriptContentIsUntrustedSourceData: true,
        technicalLowLevelIntervalsAreNonSemantic: true,
        interpolatedWordTimingAllowed: false,
        exactReferenceWordingTransferAllowed: false,
        exactReferenceTimingTransferAllowed: false,
        referenceVoiceIdentityTransferAllowed: false,
        executableCutInstructionAllowed: false,
        targetAdaptationRequired: true,
        targetEvidenceRequired: true,
        meaningPreservationReviewRequired: true,
        userApprovalRequired: true,
      },
    }
    const productionAuthority = input.runtime.productionAuthority
    const request: EditReferenceSpeechPacingStudyRequest = {
      schemaVersion: EDIT_REFERENCE_SPEECH_PACING_STUDY_REQUEST_VERSION,
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      orchestrationId: input.runtime.orchestrationId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      privateAudioArtifactId: audioArtifact.artifactId,
      audioChecksumSha256: audioArtifact.checksum,
      privateTranscriptArtifactId: authority.privateTranscriptArtifactId,
      transcriptChecksumSha256: authority.transcriptChecksumSha256,
      privateWordTimingArtifactId: authority.privateWordTimingArtifactId,
      wordTimingChecksumSha256: authority.wordTimingChecksumSha256,
      privateSpeakerSegmentationArtifactId: authority.privateSpeakerSegmentationArtifactId,
      speakerSegmentationChecksumSha256: authority.speakerSegmentationChecksumSha256,
      evidenceManifestDigestSha256,
      privateMediaAccessVerified: true,
      privateMediaFinalized: true,
      mediaChecksumVerified: true,
      privateAudioAccessVerified: true,
      privateAudioFinalized: true,
      audioChecksumVerified: true,
      privateTranscriptAccessVerified: true,
      privateTranscriptFinalized: true,
      transcriptChecksumVerified: true,
      evidenceAuthorityVerified: true,
      transcriptRuntimeExecuted: true,
      transcriptQaStatus: authority.transcriptQaStatus,
      transcriptRuntimeSource: authority.transcriptRuntimeSource,
      transcriptRuntimeId: authority.transcriptRuntimeId,
      transcriptRuntimeVersion: authority.transcriptRuntimeVersion,
      transcriptModelManifestId: authority.transcriptModelManifestId,
      transcriptExecutionId: authority.transcriptExecutionId,
      transcriptLanguage: authority.transcriptPayload.language ?? 'und',
      transcriptConfidence: authority.transcriptPayload.confidence,
      segmentTimingMode: authority.segmentTimingMode,
      segmentTimingAuthorityVerified: true,
      wordTimingMode: authority.wordTimingMode,
      wordTimingAuthorityVerified: authority.wordTimingAuthorityVerified,
      speakerSegmentationMode: authority.speakerSegmentationMode,
      speakerSegmentationAuthorityVerified: authority.speakerSegmentationAuthorityVerified,
      sourceDurationSeconds,
      analysisWindowStartSeconds,
      analysisWindowEndSeconds,
      transcriptSegmentCount: transcriptSegments.length,
      alignedWordCount: transcriptSegments.flatMap((segment) => segment.words).length,
      speakerSegmentCount: speakerTurns.length,
      evidence,
      sourceClaimsPresent: authority.sourceClaimsPresent,
      maxEvidenceItems: 64,
      maxStructuredContextCharacters: 32_000,
      maxScanDurationSeconds: 120,
      executionScope: productionAuthority ? 'production' : 'controlled_test',
      approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
      internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
      immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
      maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
      boundedPrivateTranscriptInputAllowed: true,
      rawMediaInputAllowed: false,
      rawAudioInputAllowed: false,
      rawTranscriptInRequestAllowed: false,
      externalUrlFetchAllowed: false,
      mockTranscriptInputAllowed: false,
      interpolatedWordTimingAllowed: false,
      exactReferenceWordingTransferAllowed: false,
      exactReferenceTimingTransferAllowed: false,
      referenceVoiceIdentityTransferAllowed: false,
      executableCutInstructionAllowed: false,
      customerPriceCalculationAllowed: false,
      customerCreditMutationAllowed: false,
      serviceFeeCalculationAllowed: false,
    }
    const reasoningRouteAuthorization = productionAuthority
      ? await resolveEditReferenceReasoningRouteAuthorizationFailClosed({
          resolver: productionAuthority.resolveReasoningRouteAuthorization,
          request,
        })
      : undefined
    const expectedReasoningRouteId = reasoningRouteAuthorization?.routeId ?? 'kimi_k3_primary'
    let reasoningProvider = input.runtime.provider
    if (productionAuthority) {
      const routeValidation = validateEditReferenceReasoningRouteAuthorization({
        authorization: reasoningRouteAuthorization,
        expectedLane: 'speech_pacing',
        expectedRouteId: expectedReasoningRouteId,
        requestDigestSha256: hashEditReferenceSpeechPacingStudyRequest(request),
        costAuthority: request,
      })
      if (routeValidation.ok) {
        const resolvedProvider = await resolveEditReferenceReasoningRouteProviderFailClosed({
          authorization: reasoningRouteAuthorization,
          resolver: productionAuthority.resolveReasoningProvider,
          qwenFallbackProvider: input.runtime.provider,
        })
        if (!resolvedProvider) {
          return {
            status: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'The exact authorized Speech/Pacing reasoning provider is unavailable, so no provider or usage attempt was started.',
          }
        }
        reasoningProvider = resolvedProvider
      }
    }
    const adapter = productionAuthority
      ? createEditReferenceRoutedSpeechPacingAdapter({
          provider: reasoningProvider,
          structuredContext,
          reasoningRouteAuthorization,
          expectedReasoningRouteId,
          productionUsageAuthority: productionAuthority.usageAuthority,
          temporaryAudioCleaned: authority.temporaryAudioCleaned,
          createExecutionId: () => `speech-pacing:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
        })
      : createEditReferenceQwenSpeechPacingAdapter({
          provider: reasoningProvider,
          structuredContext,
          temporaryAudioCleaned: authority.temporaryAudioCleaned,
          createExecutionId: () => `speech-pacing:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
        })
    const result = await adapter.analyze(request)
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.blockerCode,
          blockerMessage: result.blockerMessage,
        }
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'reference_speech_pacing_runtime_failed',
      blockerMessage: 'The bounded Speech/Pacing runtime failed closed without retaining transcript text, raw audio, provider payloads, or target instructions.',
    }
  }
}

function validateResolvedSpeechPacingAuthority(
  authority: EditReferenceSpeechPacingTranscriptAuthority,
  input: {
    readonly privateAudioArtifactId: string
    readonly sourceDurationSeconds: number
  },
): void {
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
  const shaPattern = /^[a-f0-9]{64}$/
  for (const value of [
    authority.privateTranscriptArtifactId,
    authority.transcriptRuntimeId,
    authority.transcriptRuntimeVersion,
    authority.transcriptModelManifestId,
    authority.transcriptExecutionId,
  ]) if (!idPattern.test(value)) throw new Error('speech_authority_id_invalid')
  if (!shaPattern.test(authority.transcriptChecksumSha256)) throw new Error('speech_transcript_checksum_invalid')
  if (
    authority.privateTranscriptAccessVerified !== true
    || authority.privateTranscriptFinalized !== true
    || authority.transcriptChecksumVerified !== true
    || authority.transcriptRuntimeExecuted !== true
    || authority.segmentTimingAuthorityVerified !== true
    || authority.interpolatedWordTimingUsed !== false
    || authority.temporaryAudioCleaned !== true
  ) throw new Error('speech_transcript_authority_incomplete')
  if (
    authority.transcriptPayload.sourceAudioArtifactId !== input.privateAudioArtifactId
    || authority.transcriptPayload.modelInfo.toolId !== 'faster_whisper'
    || authority.transcriptPayload.modelInfo.modelWeightManifestId !== authority.transcriptModelManifestId
    || authority.transcriptPayload.segments.length < 1
    || authority.transcriptPayload.confidence <= 0
    || authority.transcriptPayload.durationSeconds > input.sourceDurationSeconds + 0.001
  ) throw new Error('speech_transcript_payload_mismatch')
  const normalizedFullText = authority.transcriptPayload.segments
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (authority.transcriptPayload.fullText !== normalizedFullText) throw new Error('speech_transcript_full_text_mismatch')
  for (const segment of authority.transcriptPayload.segments) {
    if (
      !idPattern.test(segment.segmentId)
      || segment.startSeconds < 0
      || segment.endSeconds <= segment.startSeconds
      || segment.endSeconds > input.sourceDurationSeconds + 0.001
      || !segment.text.trim()
    ) throw new Error('speech_transcript_segment_invalid')
  }
  const wordAvailable = authority.wordTimingMode !== 'not_available'
  if (
    wordAvailable !== authority.wordTimingAuthorityVerified
    || wordAvailable !== Boolean(authority.privateWordTimingArtifactId)
    || wordAvailable !== Boolean(authority.wordTimingChecksumSha256)
    || wordAvailable !== Boolean(authority.wordTimingPayload)
    || (authority.wordTimingChecksumSha256 && !shaPattern.test(authority.wordTimingChecksumSha256))
  ) throw new Error('speech_word_timing_authority_mismatch')
  if (wordAvailable) {
    const payload = authority.wordTimingPayload!
    if (
      payload.sourceAudioArtifactId !== input.privateAudioArtifactId
      || payload.modelInfo.toolId !== 'faster_whisper'
      || payload.modelInfo.modelWeightManifestId !== authority.transcriptModelManifestId
      || payload.words.length < 1
    ) throw new Error('speech_word_timing_payload_mismatch')
    const transcriptWords = authority.transcriptPayload.segments.flatMap((segment) => segment.words)
    if (JSON.stringify(payload.words) !== JSON.stringify(transcriptWords)) {
      throw new Error('speech_word_timing_payload_not_exact')
    }
  }
  const speakerAvailable = authority.speakerSegmentationMode !== 'not_requested'
  if (
    speakerAvailable !== authority.speakerSegmentationAuthorityVerified
    || speakerAvailable !== Boolean(authority.privateSpeakerSegmentationArtifactId)
    || speakerAvailable !== Boolean(authority.speakerSegmentationChecksumSha256)
    || speakerAvailable !== (authority.speakerSegments.length > 0)
    || (authority.speakerSegmentationChecksumSha256 && !shaPattern.test(authority.speakerSegmentationChecksumSha256))
  ) throw new Error('speech_speaker_authority_mismatch')
  if (authority.transcriptEvidence.length < 1 || authority.segmentTimingEvidence.length < 1) {
    throw new Error('speech_required_evidence_missing')
  }
  if (wordAvailable !== (authority.wordTimingEvidence.length > 0)) throw new Error('speech_word_evidence_mismatch')
  if (speakerAvailable !== (authority.speakerSegmentationEvidence.length > 0)) throw new Error('speech_speaker_evidence_mismatch')
  if (authority.sourceClaimsPresent && authority.factSafetyEvidence.length < 1) throw new Error('speech_fact_safety_evidence_missing')
}

function hashSpeechPacingEvidenceManifest(evidence: EditReferenceSpeechPacingEvidenceManifest): string {
  const normalized = Object.fromEntries(Object.entries(evidence).map(([key, ids]) => [key, [...ids].sort()]))
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

export interface BoundedStoryEditorialStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceStoryEditorialStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export async function runBoundedStoryEditorialStudy(input: {
  readonly runtime?: EditReferenceStoryEditorialRuntimeInput
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly mediaAnalysisReportId?: string
  readonly audioPresence: 'present' | 'absent'
  readonly sceneBoundaries: EditReferenceSceneBoundaryStudyResult
  readonly visualLanguageStudy?: EditReferenceVisualLanguageStudyResult
  /**
   * Long-form dispatch persists only the provider-neutral semantic authority
   * from the completed Visual Language window. Accept that exact prerequisite
   * directly instead of fabricating a full bounded Visual Language result on
   * restart.
   */
  readonly visualLanguageSemanticPrerequisite?: EditReferenceSemanticStudyResult
}): Promise<BoundedStoryEditorialStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_story_editorial_adapter_not_configured',
      blockerMessage: 'The reviewed Story/Editorial evidence adapter is not configured.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'private_artifact_unavailable',
      blockerMessage: 'Story/Editorial reasoning requires an exact finalized private-media checksum.',
    }
  }
  if (input.sceneBoundaries.status !== 'verified_local_bounded') {
    return {
      status: 'blocked',
      blockerCode: 'visual_evidence_unavailable',
      blockerMessage: 'A bounded technical change-point result is required as nonsemantic Story/Editorial context.',
    }
  }
  const visualLanguageSemanticPrerequisite = input.visualLanguageSemanticPrerequisite
  const fullVisualLanguageAvailable = input.visualLanguageStudy?.status === 'analyzed'
  const semanticVisualLanguageAvailable = Boolean(
    visualLanguageSemanticPrerequisite
    && visualLanguageSemanticPrerequisite.specialistId === 'visual_language'
    && visualLanguageSemanticPrerequisite.status === 'completed'
    && visualLanguageSemanticPrerequisite.resultState === 'analyzed'
    && visualLanguageSemanticPrerequisite.confidence > 0
    && visualLanguageSemanticPrerequisite.summary.trim(),
  )
  if (!fullVisualLanguageAvailable && !semanticVisualLanguageAvailable) {
    return {
      status: 'blocked',
      blockerCode: 'visual_evidence_unavailable',
      blockerMessage: 'Generalized Visual Language evidence must complete before Story/Editorial reasoning can run.',
    }
  }
  if (!input.runtime.evidenceAuthorityResolver) {
    return {
      status: 'blocked',
      blockerCode: 'evidence_authority_unverified',
      blockerMessage: 'Canonical transcript, speech-timing, claim-presence, and fact-safety authority is unavailable, so no Story/Editorial provider call was made.',
    }
  }
  let authority: EditReferenceStoryEditorialEvidenceAuthority
  try {
    authority = await input.runtime.evidenceAuthorityResolver({
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      sourceEvidenceId: input.sourceEvidenceId,
      audioPresence: input.audioPresence,
    })
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'evidence_authority_unverified',
      blockerMessage: 'Canonical Story/Editorial evidence authority could not be resolved for this exact private media artifact.',
    }
  }
  if (input.runtime.studyGoalEvidence.length < 1) {
    return {
      status: 'blocked',
      blockerCode: 'evidence_authority_unverified',
      blockerMessage: 'Story/Editorial reasoning requires an explicit saved study goal.',
    }
  }
  if (input.audioPresence === 'present' && authority.transcriptEvidence.length < 1) {
    return {
      status: 'blocked',
      blockerCode: 'transcript_evidence_unavailable',
      blockerMessage: 'Audio-bearing reference media requires canonical transcript-semantic evidence before Story/Editorial reasoning.',
    }
  }
  if (input.audioPresence === 'present' && authority.speechTimingEvidence.length < 1) {
    return {
      status: 'blocked',
      blockerCode: 'speech_timing_unavailable',
      blockerMessage: 'Audio-bearing reference media requires canonical speech-timing evidence before Story/Editorial reasoning.',
    }
  }
  if (
    input.audioPresence === 'absent'
    && (authority.transcriptEvidence.length > 0 || authority.speechTimingEvidence.length > 0)
  ) {
    return {
      status: 'blocked',
      blockerCode: 'evidence_authority_unverified',
      blockerMessage: 'The claimed transcript or speech-timing evidence contradicts the verified audio-absent media structure.',
    }
  }
  if (authority.sourceClaimsPresent && authority.factSafetyEvidence.length < 1) {
    return {
      status: 'blocked',
      blockerCode: 'fact_safety_evidence_required',
      blockerMessage: 'Claim-bearing reference material requires exact fact-safety evidence before Story/Editorial reasoning.',
    }
  }

  const visualLanguageEvidence: QwenStoryEditorialEvidenceItem[] = fullVisualLanguageAvailable
    ? (input.visualLanguageStudy as Extract<EditReferenceVisualLanguageStudyResult, { status: 'analyzed' }>)
        .findings.map((finding): QwenStoryEditorialEvidenceItem => ({
          evidenceId: finding.findingId,
          kind: 'visual_language',
          summary: finding.summary,
          confidence: finding.confidence,
          requiresUserReview: finding.requiresUserReview,
        }))
    : [{
        evidenceId: visualLanguageSemanticPrerequisite?.inputEvidenceIds[0]
          ?? `${input.sourceEvidenceId}:visual-language-semantic-prerequisite`,
        kind: 'visual_language',
        summary: boundedStoryEditorialEvidenceSummary(
          visualLanguageSemanticPrerequisite?.summary as string,
        ),
        confidence: visualLanguageSemanticPrerequisite?.confidence as number,
        requiresUserReview: (visualLanguageSemanticPrerequisite?.warnings.length ?? 0) > 0,
      }]

  try {
    const mediaStructureId = `${input.sourceEvidenceId}:story-media-structure`
    const technicalChangePointId = `${input.sourceEvidenceId}:story-technical-change-points`
    const evidenceItems: QwenStoryEditorialEvidenceItem[] = [
      {
        evidenceId: mediaStructureId,
        kind: 'media_structure',
        summary: `A bounded private media structure report is available${input.mediaAnalysisReportId ? ' and linked to an immutable private analysis artifact' : ''}; audio presence was verified independently.`,
        confidence: 0.95,
        requiresUserReview: false,
      },
      {
        evidenceId: technicalChangePointId,
        kind: 'technical_change_point',
        summary: `${input.sceneBoundaries.boundaryCount} technical visual-change candidate${input.sceneBoundaries.boundaryCount === 1 ? '' : 's'} were measured; they are nonsemantic context and do not establish scenes, topics, transitions, or meaning.`,
        confidence: 0.95,
        requiresUserReview: true,
      },
      ...visualLanguageEvidence,
      ...input.runtime.studyGoalEvidence.map((item): QwenStoryEditorialEvidenceItem => ({
        ...item,
        kind: 'study_goal',
      })),
      ...authority.transcriptEvidence.map((item): QwenStoryEditorialEvidenceItem => ({
        ...item,
        kind: 'transcript_semantic_summary',
      })),
      ...authority.speechTimingEvidence.map((item): QwenStoryEditorialEvidenceItem => ({
        ...item,
        kind: 'speech_timing_summary',
      })),
      ...authority.factSafetyEvidence.map((item): QwenStoryEditorialEvidenceItem => ({
        ...item,
        kind: 'fact_safety',
      })),
    ]
    const draftContext: QwenStoryEditorialStructuredContext = {
      schemaVersion: 'edit-reference-story-editorial-structured-context-v1',
      evidenceManifestDigestSha256: '0'.repeat(64),
      audioPresence: input.audioPresence,
      sourceClaimsPresent: authority.sourceClaimsPresent,
      evidenceItems,
      boundaries: {
        technicalChangePointsAreNonSemantic: true,
        exactReferenceWordingTransferAllowed: false,
        exactReferenceSequenceTransferAllowed: false,
        exactReferenceTimingTransferAllowed: false,
        referenceIdentityTransferAllowed: false,
        targetAdaptationRequired: true,
        targetEvidenceRequired: true,
        userApprovalRequired: true,
      },
    }
    const evidenceManifestDigestSha256 = hashEditReferenceStoryEditorialStructuredContext(draftContext)
    const structuredContext: QwenStoryEditorialStructuredContext = {
      ...draftContext,
      evidenceManifestDigestSha256,
    }
    const idsFor = (kind: QwenStoryEditorialEvidenceItem['kind']): string[] => evidenceItems
      .filter((item) => item.kind === kind)
      .map((item) => item.evidenceId)
    const evidence: EditReferenceStoryEditorialEvidenceManifest = {
      mediaStructureEvidenceIds: idsFor('media_structure'),
      technicalChangePointEvidenceIds: idsFor('technical_change_point'),
      visualLanguageEvidenceIds: idsFor('visual_language'),
      transcriptEvidenceIds: idsFor('transcript_semantic_summary'),
      speechTimingEvidenceIds: idsFor('speech_timing_summary'),
      studyChatGoalEvidenceIds: idsFor('study_goal'),
      factSafetyEvidenceIds: idsFor('fact_safety'),
    }
    const productionAuthority = input.runtime.productionAuthority
    const request: EditReferenceStoryEditorialStudyRequest = {
      schemaVersion: EDIT_REFERENCE_STORY_EDITORIAL_STUDY_REQUEST_VERSION,
      workspaceId: input.workspaceId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studySessionId,
      orchestrationId: input.runtime.orchestrationId,
      privateMediaArtifactId: input.privateMediaArtifactId,
      mediaChecksumSha256: input.mediaChecksumSha256,
      evidenceManifestDigestSha256,
      privateArtifactAccessVerified: true,
      privateArtifactFinalized: true,
      mediaChecksumVerified: true,
      evidenceAuthorityVerified: true,
      evidence,
      audioPresence: input.audioPresence,
      sourceClaimsPresent: authority.sourceClaimsPresent,
      maxEvidenceItems: 64,
      maxStructuredContextCharacters: 32_000,
      executionScope: productionAuthority ? 'production' : 'controlled_test',
      approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
      internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
      immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
      maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
      rawMediaInputAllowed: false,
      externalUrlFetchAllowed: false,
      rawTranscriptPersistenceAllowed: false,
      exactReferenceWordingTransferAllowed: false,
      exactReferenceSequenceTransferAllowed: false,
      exactReferenceTimingTransferAllowed: false,
      referenceIdentityTransferAllowed: false,
      customerPriceCalculationAllowed: false,
      customerCreditMutationAllowed: false,
      serviceFeeCalculationAllowed: false,
    }
    const reasoningRouteAuthorization = productionAuthority
      ? await resolveEditReferenceReasoningRouteAuthorizationFailClosed({
          resolver: productionAuthority.resolveReasoningRouteAuthorization,
          request,
        })
      : undefined
    const expectedReasoningRouteId = reasoningRouteAuthorization?.routeId ?? 'kimi_k3_primary'
    let reasoningProvider = input.runtime.provider
    if (productionAuthority) {
      const routeValidation = validateEditReferenceReasoningRouteAuthorization({
        authorization: reasoningRouteAuthorization,
        expectedLane: 'story_editorial',
        expectedRouteId: expectedReasoningRouteId,
        requestDigestSha256: hashEditReferenceStoryEditorialStudyRequest(request),
        costAuthority: request,
      })
      if (routeValidation.ok) {
        const resolvedProvider = await resolveEditReferenceReasoningRouteProviderFailClosed({
          authorization: reasoningRouteAuthorization,
          resolver: productionAuthority.resolveReasoningProvider,
          qwenFallbackProvider: input.runtime.provider,
        })
        if (!resolvedProvider) {
          return {
            status: 'blocked',
            blockerCode: 'model_routing_unavailable',
            blockerMessage: 'The exact authorized Story/Editorial reasoning provider is unavailable, so no provider or usage attempt was started.',
          }
        }
        reasoningProvider = resolvedProvider
      }
    }
    const adapter = productionAuthority
      ? createEditReferenceRoutedStoryEditorialAdapter({
          provider: reasoningProvider,
          structuredContext,
          reasoningRouteAuthorization,
          expectedReasoningRouteId,
          productionUsageAuthority: productionAuthority.usageAuthority,
          createExecutionId: () => `story-editorial:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
        })
      : createEditReferenceQwenStoryEditorialAdapter({
          provider: reasoningProvider,
          structuredContext,
          createExecutionId: () => `story-editorial:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
        })
    const result = await adapter.analyze(request)
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.blockerCode,
          blockerMessage: result.blockerMessage,
        }
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'reference_story_editorial_runtime_failed',
      blockerMessage: 'The bounded Story/Editorial adapter failed closed without retaining raw transcript, media, or provider payloads.',
    }
  }
}

function boundedStoryEditorialEvidenceSummary(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) throw new Error('Story/Editorial prerequisite summary is empty.')
  if (normalized.length <= 900) return normalized
  return `${normalized.slice(0, 899).trimEnd()}…`
}

export interface BoundedVisualLanguageStudyOutcome {
  readonly status: 'analyzed' | 'blocked' | 'not_run'
  readonly result?: EditReferenceVisualLanguageStudyResult
  readonly blockerCode?: string
  readonly blockerMessage?: string
}

export async function runBoundedVisualLanguageStudy(input: {
  readonly runtime?: EditReferenceVisualLanguageRuntimeInput
  readonly outputRoot: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256?: string
  readonly sourceEvidenceId: string
  readonly mediaAnalysisReportId?: string
  readonly representativeFrames: readonly MediaFoundationArtifactSummary[]
  readonly keyframes: readonly MediaFoundationArtifactSummary[]
  readonly probeWidth?: number
  readonly probeHeight?: number
  readonly technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence
  readonly technicalColor: PreferenceTechnicalColorSignalEvidence
  readonly technicalMotion: PreferenceTechnicalMotionSignalEvidence
  readonly technicalSourceCondition: PreferenceTechnicalSourceConditionEvidence
  readonly sceneBoundaries: EditReferenceSceneBoundaryStudyResult
}): Promise<BoundedVisualLanguageStudyOutcome> {
  if (!input.runtime) {
    return {
      status: 'not_run',
      blockerCode: 'reference_visual_language_adapter_not_configured',
      blockerMessage: 'No reviewed Visual Language runtime was configured for this private media study.',
    }
  }
  if (!input.mediaChecksumSha256 || !/^[a-f0-9]{64}$/.test(input.mediaChecksumSha256)) {
    return {
      status: 'blocked',
      blockerCode: 'reference_visual_language_media_checksum_unverified',
      blockerMessage: 'The finalized private reference lacks exact checksum authority, so Visual Language did not run.',
    }
  }

  const candidates = uniqueVisualLanguageCandidates([
    ...input.representativeFrames.slice(0, 4).map((artifact) => ({
      artifact,
      role: 'representative' as const,
      fallbackTimeSeconds: undefined,
    })),
    ...input.keyframes.slice(0, 4).map((artifact, index) => ({
      artifact,
      role: 'keyframe' as const,
      fallbackTimeSeconds: index * 2,
    })),
  ]
    .map((candidate) => ({
      ...candidate,
      sourceTimeSeconds: candidate.artifact.timeSeconds ?? candidate.fallbackTimeSeconds ?? 0,
    }))
    .filter((candidate) => candidate.sourceTimeSeconds >= 0 && candidate.sourceTimeSeconds <= 120)
  )

  if (
    !candidates.some((candidate) => candidate.role === 'representative')
    || !candidates.some((candidate) => candidate.role === 'keyframe')
  ) {
    return {
      status: 'blocked',
      blockerCode: 'reference_visual_language_frames_unavailable',
      blockerMessage: 'Visual Language requires at least one bounded representative frame and one bounded keyframe.',
    }
  }

  const specialistRoot = path.join(
    input.outputRoot,
    `visual-language-${createHash('sha256').update(`${input.runtime.orchestrationId}:${input.privateMediaArtifactId}`).digest('hex').slice(0, 16)}`,
  )
  const resolvedFrames = new Map<string, string>()
  let frameSamples: EditReferenceVisualFrameEvidence[]
  try {
    await mkdir(specialistRoot, { mode: 0o700, recursive: false })
    frameSamples = await Promise.all(candidates.map(async ({ artifact, role, sourceTimeSeconds }, index): Promise<EditReferenceVisualFrameEvidence> => {
      if (!artifact.localFilePath || artifact.contentType !== 'image/jpeg' || artifact.isPrivate !== true) {
        throw new Error('frame_artifact_unavailable')
      }
      if (artifact.sizeBytes !== undefined && (artifact.sizeBytes < 1 || artifact.sizeBytes > 2 * 1024 * 1024)) {
        throw new Error('frame_artifact_outside_size_bound')
      }
      const bytes = await readPrivateFrameBytes(input.outputRoot, artifact.localFilePath)
      if (bytes.byteLength < 1 || bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error('frame_bytes_outside_size_bound')
      }
      const dimensions = readJpegDimensions(bytes)
      const privateFrameArtifactId = `${artifact.artifactId}:visual-language:${index + 1}`
      const localFilePath = path.join(specialistRoot, `frame-${String(index + 1).padStart(2, '0')}.jpg`)
      await writeFile(localFilePath, bytes, { flag: 'wx', mode: 0o600 })
      resolvedFrames.set(privateFrameArtifactId, localFilePath)
      return {
        role,
        frameEvidenceId: `${privateFrameArtifactId}:evidence`,
        privateFrameArtifactId,
        frameChecksumSha256: createHash('sha256').update(bytes).digest('hex'),
        sourceTimeSeconds,
        width: dimensions.width,
        height: dimensions.height,
        privateAccessVerified: true,
        ephemeral: true,
        cleanupRequired: true,
      }
    }))
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_visual_language_frame_authority_unverified',
      blockerMessage: 'The bounded frame manifest could not prove exact private JPEG bytes, dimensions, and checksums.',
    }
  }

  const visibleTextEvidenceMode = input.technicalCaptionRegions.status === 'verified_local_bounded'
    && input.technicalCaptionRegions.technicalTextRegionCandidateAnalysisRan
    ? 'geometry_only' as const
    : 'not_requested' as const
  const evidence = {
    mediaStructureEvidenceIds: [input.sourceEvidenceId],
    technicalChangePointEvidenceIds: input.sceneBoundaries.status === 'verified_local_bounded'
      ? [`${input.sourceEvidenceId}:technical-change-points`]
      : [],
    technicalSourceConditionEvidenceIds: input.technicalSourceCondition.status === 'verified_local_bounded'
      ? [`${input.sourceEvidenceId}:technical-source-condition`]
      : [],
    technicalColorEvidenceIds: input.technicalColor.status === 'verified_local_bounded'
      ? [`${input.sourceEvidenceId}:technical-color`]
      : [],
    captionGeometryEvidenceIds: visibleTextEvidenceMode === 'geometry_only'
      ? [`${input.sourceEvidenceId}:caption-geometry`]
      : [],
    ocrEvidenceIds: [],
    studyChatGoalEvidenceIds: [input.runtime.studyGoalEvidenceId],
    factSafetyEvidenceIds: [],
  }
  const productionAuthority = 'productionAuthority' in input.runtime
    ? input.runtime.productionAuthority
    : undefined
  const request: EditReferenceVisualLanguageStudyRequest = {
    schemaVersion: EDIT_REFERENCE_VISUAL_LANGUAGE_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.runtime.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    evidenceManifestDigestSha256: hashEditReferenceVisualLanguageEvidenceManifest({ evidence }),
    frameManifestDigestSha256: hashEditReferenceVisualLanguageFrameManifest(frameSamples),
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    evidenceAuthorityVerified: true,
    frameAuthorityVerified: true,
    frameSamples,
    evidence,
    visibleTextEvidenceMode,
    realPersonOrClaimContextPresent: false,
    maxRepresentativeFrameCount: 4,
    maxKeyframeCount: 4,
    maxEvidenceItems: 64,
    maxStructuredContextCharacters: 32_000,
    maxScanDurationSeconds: 120,
    executionScope: productionAuthority ? 'production' : 'controlled_test',
    approvedUsageEstimateId: productionAuthority?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: productionAuthority?.internalCostBudgetId ?? null,
    immutableRateCardSnapshotId: productionAuthority?.immutableRateCardSnapshotId ?? null,
    maximumAuthorizedInternalCostMicros: productionAuthority?.maximumAuthorizedInternalCostMicros ?? null,
    boundedPrivateFrameInputAllowed: true,
    rawFullMediaInputAllowed: false,
    externalUrlFetchAllowed: false,
    rawFramePersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    exactReferenceLayoutTransferAllowed: false,
    exactReferenceVisibleTextTransferAllowed: false,
    exactReferenceCameraPathTransferAllowed: false,
    referenceIdentityTransferAllowed: false,
    copyrightedAssetTransferAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
  }
  try {
    const resolvePrivateFrame = async (sample: EditReferenceVisualFrameEvidence) => {
      const localFilePath = resolvedFrames.get(sample.privateFrameArtifactId)
      if (!localFilePath) throw new Error('private_frame_not_resolved')
      return {
        privateFrameArtifactId: sample.privateFrameArtifactId,
        localFilePath,
      }
    }
    const cleanupPrivateFrames = async (frames: readonly { readonly localFilePath: string }[]) => {
      await Promise.all(frames.map(async (frame) => unlink(frame.localFilePath)))
    }
    const adapter = createEditReferenceQwenVisualLanguageAdapter({
      provider: input.runtime.provider,
      privateFrameRoot: specialistRoot,
      resolvePrivateFrame,
      cleanupPrivateFrames,
      productionUsageAuthority: productionAuthority?.usageAuthority,
      createExecutionId: () => `visual-language:${input.runtime!.orchestrationId}:${input.privateMediaArtifactId}`,
    })
    const result = await adapter.analyze(request)
    await rm(specialistRoot, { force: true, recursive: true })
    return result.status === 'analyzed'
      ? { status: 'analyzed', result }
      : {
          status: 'blocked',
          result,
          blockerCode: result.blockerCode,
          blockerMessage: result.blockerMessage,
        }
  } catch {
    await rm(specialistRoot, { force: true, recursive: true }).catch(() => undefined)
    return {
      status: 'blocked',
      blockerCode: 'reference_visual_language_runtime_failed',
      blockerMessage: 'The bounded Visual Language adapter failed closed without persisting specialist frame copies.',
    }
  }
}

function uniqueVisualLanguageCandidates<T extends {
  readonly artifact: MediaFoundationArtifactSummary
  readonly role: 'representative' | 'keyframe'
  readonly sourceTimeSeconds: number
}>(candidates: readonly T[]): T[] {
  const artifactIds = new Set<string>()
  return [...candidates]
    .sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds || left.role.localeCompare(right.role))
    .filter((candidate) => {
      if (artifactIds.has(candidate.artifact.artifactId)) return false
      artifactIds.add(candidate.artifact.artifactId)
      return true
    })
    .slice(0, 8)
}

async function attachPrivateArtifactChecksum(
  outputRoot: string,
  artifact: MediaFoundationArtifactSummary,
): Promise<MediaFoundationArtifactSummary> {
  if (artifact.checksum) return artifact
  if (!artifact.localFilePath || artifact.isPrivate !== true || artifact.sourceOfTruth !== true) {
    throw new Error('private_artifact_checksum_input_invalid')
  }
  const configuredRoot = path.resolve(outputRoot)
  const rootStat = await lstat(configuredRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('private_artifact_root_invalid')
  const root = await realpath(configuredRoot)
  const configuredPath = path.resolve(artifact.localFilePath)
  const artifactStat = await lstat(configuredPath)
  if (!artifactStat.isFile() || artifactStat.isSymbolicLink()) throw new Error('private_artifact_file_invalid')
  const resolvedPath = await realpath(configuredPath)
  const relative = path.relative(root, resolvedPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('private_artifact_outside_root')
  }
  const handle = await open(resolvedPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024 * 1024) {
      throw new Error('private_artifact_bytes_outside_size_bound')
    }
    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(64 * 1024)
    let offset = 0
    while (offset < stat.size) {
      const length = Math.min(buffer.byteLength, stat.size - offset)
      const { bytesRead } = await handle.read(buffer, 0, length, offset)
      if (bytesRead < 1) throw new Error('private_artifact_read_incomplete')
      hash.update(buffer.subarray(0, bytesRead))
      offset += bytesRead
    }
    return { ...artifact, checksum: hash.digest('hex') }
  } finally {
    await handle.close()
  }
}

async function readPrivateFrameBytes(outputRoot: string, localFilePath: string): Promise<Buffer> {
  const configuredRoot = path.resolve(outputRoot)
  const rootStat = await lstat(configuredRoot)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('frame_root_invalid')
  const root = await realpath(configuredRoot)
  const configuredPath = path.resolve(localFilePath)
  const frameStat = await lstat(configuredPath)
  if (!frameStat.isFile() || frameStat.isSymbolicLink()) throw new Error('frame_file_invalid')
  const resolvedPath = await realpath(configuredPath)
  const relative = path.relative(root, resolvedPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('frame_outside_private_root')
  }
  const handle = await open(resolvedPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size < 1 || stat.size > 2 * 1024 * 1024) {
      throw new Error('frame_bytes_outside_size_bound')
    }
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

function readJpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('jpeg_signature_invalid')
  }
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.length) break
    const marker = bytes[offset]
    offset += 1
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) break
    const segmentLength = bytes.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) break
      const height = bytes.readUInt16BE(offset + 3)
      const width = bytes.readUInt16BE(offset + 5)
      if (width > 0 && height > 0) return { width, height }
      break
    }
    offset += segmentLength
  }
  throw new Error('jpeg_dimensions_unavailable')
}

export function createBlockedEditReferenceMediaStudy(
  input: Pick<Parameters<typeof runEditReferenceLocalMediaStudy>[0], 'referenceAssetId' | 'privateAssetId' | 'sourceEvidenceId'>,
  blockerCode: string,
  blockerMessage: string,
): EditReferenceLocalMediaStudyResult {
  const now = new Date().toISOString()
  return {
    referenceAssetId: input.referenceAssetId,
    privateAssetId: input.privateAssetId,
    sourceEvidenceId: input.sourceEvidenceId,
    status: 'blocked',
    blockerCode,
    blockerMessage,
    videoStreams: [],
    audioStreams: [],
    keyframeSampleCount: 0,
    shotDetectionStatus: 'not_run',
    shotBoundaryCount: 0,
    shotBoundaryTimesSeconds: [],
    shotDetectionCoverage: 'not_run',
    representativeFrameCount: 0,
    representativeFrameTimes: [],
    audioExtracted: false,
    technicalAudio: {
      status: 'not_applicable',
      blockerCode,
      blockerMessage,
      semanticAudioAnalysisRan: false,
    },
    technicalAudioLowLevel: createNotRunEditReferenceAudioLowLevelResult(),
    technicalSourceCondition: createNotRunEditReferenceSourceConditionResult(),
    technicalEdgeWidth: createNotRunEditReferenceEdgeWidthSignalResult(),
    technicalCaptionRegions: createNotRunEditReferenceCaptionRegionSignalResult(),
    technicalColor: createNotRunEditReferenceColorSignalResult(),
    technicalMotion: createNotRunEditReferenceMotionSignalResult(),
    technicalStudyUsage: createBackendLocalUnmeteredTechnicalStudyUsage({
      startedAt: now,
      completedAt: now,
      wallClockMs: 0,
      inputMediaSeconds: 0,
      trackedStageIds: [],
      toolIds: [],
    }),
    toolIds: [],
    fileBytesRead: false,
    mediaProcessingStarted: false,
    rawFramesPersisted: false,
    rawProviderPayloadPersisted: false,
    visualLanguageStudyStatus: 'not_run',
    visualLanguageBlockerCode: blockerCode,
    visualLanguageBlockerMessage: blockerMessage,
    colorTreatmentStudyStatus: 'not_run',
    colorTreatmentBlockerCode: blockerCode,
    colorTreatmentBlockerMessage: blockerMessage,
    graphicsMotionStudyStatus: 'not_run',
    graphicsMotionBlockerCode: blockerCode,
    graphicsMotionBlockerMessage: blockerMessage,
    captionDesignStudyStatus: 'not_run',
    captionDesignBlockerCode: blockerCode,
    captionDesignBlockerMessage: blockerMessage,
    storyEditorialStudyStatus: 'not_run',
    storyEditorialBlockerCode: blockerCode,
    storyEditorialBlockerMessage: blockerMessage,
    speechPacingStudyStatus: 'not_run',
    speechPacingBlockerCode: blockerCode,
    speechPacingBlockerMessage: blockerMessage,
    audioSoundDesignStudyStatus: 'not_run',
    audioSoundDesignBlockerCode: blockerCode,
    audioSoundDesignBlockerMessage: blockerMessage,
    technicalWarnings: [],
    warnings: [],
  }
}

function attachBackendLocalUsage(
  result: Omit<EditReferenceLocalMediaStudyResult, 'technicalStudyUsage'>,
  startedAt: string,
  startedHrtime: bigint,
): EditReferenceLocalMediaStudyResult {
  const completedAt = new Date().toISOString()
  const wallClockMs = Number((process.hrtime.bigint() - startedHrtime) / 1_000_000n)
  return {
    ...result,
    technicalStudyUsage: createBackendLocalUnmeteredTechnicalStudyUsage({
      startedAt,
      completedAt,
      wallClockMs,
      inputMediaSeconds: result.durationSeconds ?? 0,
      trackedStageIds: trackedTechnicalStageIds(result),
      toolIds: result.toolIds,
    }),
  }
}

function trackedTechnicalStageIds(
  result: Omit<EditReferenceLocalMediaStudyResult, 'technicalStudyUsage'>,
): PreferenceTechnicalStudyStageId[] {
  const stageIds: PreferenceTechnicalStudyStageId[] = []
  if (result.mediaProcessingStarted) stageIds.push('media_foundation')
  if (result.shotDetectionStatus !== 'not_run') stageIds.push('technical_scene_boundary')
  if (result.technicalSourceCondition.status !== 'not_run') stageIds.push('technical_source_condition_signal')
  if (result.technicalEdgeWidth.status !== 'not_run') stageIds.push('technical_edge_width_signal')
  if (result.technicalCaptionRegions.status !== 'not_run') stageIds.push('technical_caption_region_signal')
  if (result.technicalColor.status !== 'not_run') stageIds.push('technical_color_signal')
  if (result.technicalAudio.status !== 'not_applicable') stageIds.push('technical_audio_loudness')
  if (!['not_applicable', 'not_run'].includes(result.technicalAudioLowLevel.status)) {
    stageIds.push('technical_audio_low_level')
  }
  if (result.technicalMotion.status !== 'not_run') stageIds.push('technical_motion_signal')
  return stageIds
}

async function studyTechnicalAudio(input: {
  audioLocalPath?: string
  ffmpegBin: string
  timeoutMs: number
  hasAudioStream: boolean
}): Promise<EditReferenceTechnicalAudioSummary> {
  if (!input.hasAudioStream) {
    return {
      status: 'not_applicable',
      blockerCode: 'reference_media_has_no_audio_stream',
      blockerMessage: 'The reference video has no audio stream to study.',
      semanticAudioAnalysisRan: false,
    }
  }
  if (!input.audioLocalPath) {
    return {
      status: 'blocked',
      blockerCode: 'reference_audio_extract_unavailable',
      blockerMessage: 'The private audio stream could not be prepared for technical analysis.',
      semanticAudioAnalysisRan: false,
    }
  }

  try {
    const output = await runFFmpegAudioCommand({
      ...buildFFmpegAudioLoudnessCommand({
        sourceAudioLocalPath: input.audioLocalPath,
        ffmpegBin: input.ffmpegBin,
        timeoutMs: input.timeoutMs,
        operation: 'loudness_probe',
        runMode: 'local_dev',
      }),
      timeoutMs: input.timeoutMs,
    })
    const loudness = parseLoudnessOutput(output)
    if (loudness.integratedLufs === undefined && loudness.truePeakDb === undefined) {
      return {
        status: 'blocked',
        blockerCode: 'reference_audio_loudness_unavailable',
        blockerMessage: 'FFmpeg completed but did not return a usable loudness measurement.',
        semanticAudioAnalysisRan: false,
      }
    }
    return {
      status: 'verified_local',
      integratedLufs: loudness.integratedLufs,
      truePeakDb: loudness.truePeakDb,
      semanticAudioAnalysisRan: false,
    }
  } catch {
    return {
      status: 'blocked',
      blockerCode: 'reference_audio_loudness_failed',
      blockerMessage: 'FFmpeg loudness analysis failed without persisting process output. Retry is available.',
      semanticAudioAnalysisRan: false,
    }
  }
}

function buildTechnicalWarnings(probe: {
  durationSeconds: number
  width: number
  height: number
  fps: number
  formatName: string
  rotation: number
  sizeBytes: number
  videoStreams: EditReferenceVideoStreamSummary[]
  audioStreams: EditReferenceAudioStreamSummary[]
}, sceneBoundaries: EditReferenceSceneBoundaryStudyResult, technicalSourceCondition: PreferenceTechnicalSourceConditionEvidence, technicalEdgeWidth: PreferenceTechnicalEdgeWidthSignalEvidence, technicalCaptionRegions: PreferenceTechnicalCaptionRegionSignalEvidence, technicalColor: PreferenceTechnicalColorSignalEvidence, technicalMotion: PreferenceTechnicalMotionSignalEvidence, technicalAudioLowLevel: PreferenceTechnicalAudioLowLevelEvidence): string[] {
  const warnings: string[] = []
  if (probe.durationSeconds <= 0) warnings.push('Media duration could not be verified.')
  if (probe.width <= 0 || probe.height <= 0) warnings.push('Primary video dimensions could not be verified.')
  if (probe.fps <= 0) warnings.push('Frame rate could not be verified.')
  if (probe.videoStreams.length === 0) warnings.push('No video stream was detected.')
  if (probe.videoStreams.length > 1) warnings.push('Multiple video streams were detected; the first stream is the primary study stream.')
  if (probe.audioStreams.length > 1) warnings.push('Multiple audio streams were detected; semantic track selection has not run.')
  if (probe.rotation !== 0) warnings.push(`The primary video reports ${probe.rotation}° rotation metadata.`)
  if (probe.formatName === 'unknown') warnings.push('Container format could not be identified.')
  if (probe.sizeBytes <= 0) warnings.push('Media byte size could not be verified.')
  if (sceneBoundaries.status === 'verified_local_bounded') {
    if (sceneBoundaries.coverage === 'partial') {
      warnings.push(`Technical scene-change scanning was limited to the first ${sceneBoundaries.scannedDurationSeconds.toFixed(2)} seconds of the ${probe.durationSeconds.toFixed(2)}-second reference; candidates outside that window are unknown.`)
    }
  } else if (sceneBoundaries.status === 'blocked') {
    warnings.push(sceneBoundaries.blockerMessage ?? 'The bounded technical scene-change scan did not complete.')
  } else {
    warnings.push('Scene/shot detection did not run; bounded frame samples are not scene boundaries.')
  }
  if (technicalSourceCondition.status === 'verified_local_bounded') {
    if (technicalSourceCondition.coverage === 'partial') {
      warnings.push(`The source-condition check was limited to the first ${technicalSourceCondition.scannedDurationSeconds.toFixed(2)} seconds; later dark or unchanged intervals are unknown.`)
    }
    warnings.push('Dark and unchanged intervals are technical threshold events only; intentional stillness, obstruction, blur, source quality, trim recommendations, and edit decisions were not inferred.')
  } else if (technicalSourceCondition.status === 'blocked') {
    warnings.push(technicalSourceCondition.blockerMessage ?? 'The bounded source-condition check did not complete.')
  } else {
    warnings.push('Source-condition scanning did not run; no dark, unchanged, or semantic source-quality finding was inferred.')
  }
  if (technicalEdgeWidth.status === 'verified_local_bounded') {
    if (technicalEdgeWidth.coverage === 'partial') {
      warnings.push(`The technical edge-width check was limited to the first ${technicalEdgeWidth.scannedDurationSeconds.toFixed(2)} seconds; later edge-width scores are unknown.`)
    }
    warnings.push('Edge-width scores are a dimensionless FFmpeg technical proxy only; blur, focus, depth of field, obstruction, source quality, trim recommendations, and edit decisions were not classified.')
  } else if (technicalEdgeWidth.status === 'blocked') {
    warnings.push(technicalEdgeWidth.blockerMessage ?? 'The bounded technical edge-width check did not complete.')
  } else {
    warnings.push('Technical edge-width sampling did not run; no blur, focus, or source-quality finding was inferred.')
  }
  if (technicalCaptionRegions.status === 'verified_local_bounded') {
    if (technicalCaptionRegions.coverage === 'partial') {
      warnings.push(`The caption-region signal check was limited to the first ${technicalCaptionRegions.scannedDurationSeconds.toFixed(2)} seconds; later high-contrast text-like regions are unknown.`)
    }
    warnings.push('Caption-region candidates are technical high-contrast geometry only; OCR, exact text, transcript alignment, and semantic caption-design analysis did not run.')
  } else if (technicalCaptionRegions.status === 'blocked') {
    warnings.push(technicalCaptionRegions.blockerMessage ?? 'The bounded caption-region signal check did not complete.')
  } else {
    warnings.push('Caption-region signal sampling did not run; no caption geometry or wording was inferred.')
  }
  if (technicalAudioLowLevel.status === 'verified_local_bounded') {
    if (technicalAudioLowLevel.coverage === 'partial') {
      warnings.push(`The low-level audio check was limited to the first ${technicalAudioLowLevel.scannedDurationSeconds.toFixed(2)} seconds; later amplitude-threshold intervals are unknown.`)
    }
  } else if (technicalAudioLowLevel.status === 'blocked') {
    warnings.push(technicalAudioLowLevel.blockerMessage ?? 'The bounded low-level audio check did not complete.')
  }
  if (technicalColor.status === 'verified_local_bounded') {
    if (technicalColor.coverage === 'partial') {
      warnings.push(`Technical color signal sampling was limited to the first ${technicalColor.scannedDurationSeconds.toFixed(2)} seconds; later signal characteristics are unknown.`)
    }
  } else if (technicalColor.status === 'blocked') {
    warnings.push(technicalColor.blockerMessage ?? 'The bounded technical color signal check did not complete.')
  } else {
    warnings.push('Technical color signal sampling did not run; no creative color treatment was inferred.')
  }
  if (technicalMotion.status === 'verified_local_bounded') {
    if (technicalMotion.coverage === 'partial') {
      warnings.push(`Technical frame-difference sampling was limited to the first ${technicalMotion.scannedDurationSeconds.toFixed(2)} seconds; later pixel activity is unknown.`)
    }
  } else if (technicalMotion.status === 'blocked') {
    warnings.push(technicalMotion.blockerMessage ?? 'The bounded technical frame-difference check did not complete.')
  } else {
    warnings.push('Technical frame-difference sampling did not run; no semantic motion behavior was inferred.')
  }
  return warnings
}

function safeErrorCategory(error: unknown): string {
  const name = error instanceof Error ? error.name : 'UnknownError'
  return `Local reference-media runtime failed (${name}); filesystem paths and raw process output were not persisted.`
}
