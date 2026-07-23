import { lazy, Suspense, type ChangeEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../Button'
import { getFrontendApiClientStatus } from '../../backend/api/frontend-api-client'
import { createApprovedPlanSnapshot } from '../../lib/approved-plan-snapshot'
import {
  createApprovedEditExecutionPrivateInternalTestRunClient,
  createApprovedEditExecutionUserPreviewReviewClient,
	  fetchApprovedEditExecutionPrivateInternalDownloadFileClient,
	  fetchApprovedEditExecutionPrivateInternalDownloadManifestClient,
	  type ApprovedEditExecutionAdapterGateActivityGroup,
	  type ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
	  type ProfessionalEditDecisionManifestClientModel,
	} from '../../lib/approved-edit-execution-package-client'
import {
  fetchApprovedPlanSnapshotFromBackend,
  persistApprovedPlanSnapshotToBackend,
} from '../../lib/approved-snapshot-backend-sync'
import { approveAndReserveCreditsForApprovedSnapshot } from '../../lib/credit-gate-backend-sync'
import { getChatPlanningCards, getChatPlanningPhaseSummaries, shouldShowCard } from '../../lib/chat-planning-flow'
import { defaultDemoScenario, getDemoScenarioIndexItemByCategory } from '../../lib/demo-scenario-index'
import { loadDemoScenario } from '../../lib/demo-scenario-loaders'
import { getDefaultFrameTemplateForAspectRatio } from '../../lib/frame-layouts'
import { loadApprovalPlanner, loadFullMockEditPlan } from '../../lib/mock-planner/full-loader'
import {
  createGuidedMockEditPlan,
  createGuidedPlanValidationReport,
  guidedPlannerRegressionPlaceholder,
} from '../../lib/mock-planner/guided'
import { completeMockPreviewJob, createMockPreviewJob } from '../../lib/generation'
import {
  createLocalSourceSetFingerprint,
  getInternalEditPersistenceStatus,
  getLocalInternalEditHandoff as getScopedLocalInternalEditHandoff,
  privateReviewMatchesCurrentSourceSet,
  retryInternalEditPersistence,
  saveLocalInternalProjectHandoff as saveScopedLocalInternalProjectHandoff,
  subscribeInternalEditPersistenceStatus,
  type InternalEditPersistenceStatus,
  type LocalInternalEditPreferenceValues,
  type LocalInternalEditSetupSnapshot,
  type LocalInternalProjectHandoff,
  type LocalPrivateInternalQaSummary,
  type LocalPrivateInternalReviewVideoExpectation,
  type LocalPrivateInternalReviewVideoMetadata,
  type LocalSourceSetFingerprint,
  updateLocalInternalEditHandoff as updateScopedLocalInternalEditHandoff,
} from '../../lib/local-project-handoff'
import {
  fetchLocalInternalProjectHandoffFromBackend as fetchScopedLocalInternalProjectHandoffFromBackend,
  persistLocalInternalProjectHandoffToBackend as persistScopedLocalInternalProjectHandoffToBackend,
} from '../../lib/internal-edit-state-backend-sync'
import type { ProjectPersistenceScope } from '../../lib/project-persistence-scope'
import {
  verifyPrivateEditDecisionManifest,
  type PrivateEditDecisionManifestVerification,
} from '../../lib/private-edit-decision-manifest-verification'
import {
  createEditSessionExecutionRehearsal,
  type EditSessionExecutionRehearsal,
} from '../../lib/edit-session-execution-rehearsal'
import { launchEditingCategories } from '../../lib/product-taxonomy'
import {
  appendOrderedUserInstruction,
  findConfirmedMaterialPlanningConflicts,
  joinOrderedUserInstructions,
  normalizeOrderedUserInstructions,
  resolveMaterialPlanningInstruction,
} from '../../lib/planning-input-safety'
import {
  getCurrentEditPreferenceOverrideKeys,
  readCurrentEditPreferenceValues,
  resolveCurrentEditPreferenceBaseline,
  resolveCurrentEditPreferenceChange,
} from '../../lib/current-edit-preferences'
import {
  createCurrentEditReferenceBackendBriefText,
  resolveCurrentEditReferenceActiveEditorAuthority,
  resolveCurrentEditReferenceTargetSource,
} from '../../lib/current-edit-reference-active-editor-authority'
import { createEditReferenceApiClient } from '../../lib/edit-reference-api-client'
import {
  preparePreferenceApplicationForProjectEditSession,
} from '../../lib/project-edit-session-edit-reference-integration'
import {
  applyExactEditPreferencesAndReference,
  createExactEditPreferenceApplyIdempotencyKey,
  createExactEditPreferenceApplyOperation,
  readExactEditPreferenceApplyAuthority,
} from '../../lib/exact-edit-preference-apply-client'
import {
  clearExactEditPreferencePendingApply,
  readExactEditPreferencePendingApply,
  saveExactEditPreferencePendingApply,
  type ExactEditPreferencePendingApply,
} from '../../lib/exact-edit-preference-apply-pending'
import {
  createProjectEditBriefBackendLocalConfig,
  readProjectEditBriefBackendLocal,
  saveProjectEditBriefBackendLocal,
  type ProjectEditBriefBackendLocalRecord,
} from '../../lib/project-edit-brief-backend-local'
import type { MockFootagePrepInput } from '../../lib/footage-prep'
import {
  createExecutionSourceMediaAssetsFromClips,
  createExecutionSourceMediaAssetsFromPlannedUploads,
  planSourceUploadsForEditor,
} from '../../lib/source-upload-planning'
import {
  attachPlanningContextTraceToEditPlan,
  createContextAwarePlannerInput,
} from '../../lib/planning'
import {
  createProfessionalPreparationDisplayItems,
  resolveApprovedSnapshotInternalTestAdapterToolNames,
} from '../../lib/professional-skills'
import { inferSourceSequenceMode, reorderClipsByMove } from '../../lib/source-sequence'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import { useEditMap } from '../../hooks/useEditMap'
import { useExportWorkflow } from '../../hooks/useExportWorkflow'
import { useMockFootagePrep } from '../../hooks/useMockFootagePrep'
import { useRevisionWorkflow } from '../../hooks/useRevisionWorkflow'
import { useCanonicalEditJourney } from '../../hooks/useCanonicalEditJourney'
import { useCanonicalExecutionPackageRequest } from '../../hooks/useCanonicalExecutionPackageRequest'
import { useCanonicalPlanApproval } from '../../hooks/useCanonicalPlanApproval'
import { useCanonicalPlanningPublication } from '../../hooks/useCanonicalPlanningPublication'
import { useCanonicalPrivateEditPreparation } from '../../hooks/useCanonicalPrivateEditPreparation'
import { useCanonicalPrivateReview } from '../../hooks/useCanonicalPrivateReview'
import type { ContextAwareMockEditPlanResult, EditBriefState, EditBriefStatus, MediaKind, ReeditProChatMessage } from '../../types'
import type { ApprovedPlanSnapshot } from '../../types/edit-planning-db'
import type {
  EditReferenceProductionExactEditApplyApiReceipt,
  EditReferenceProductionExactEditApplyOperation,
} from '../../types/edit-reference-production-exact-edit-apply-api'
import type {
  AspectRatio,
  AspectRatioSource,
  ChatPlanningDisplayMode,
  ClipSource,
  CleanupPreference,
  CreditPreference,
  EditLevel,
  EditPlan,
  EditingCategory,
  FrameTemplateType,
  MoodStyle,
  PlannerInput,
  SourceSequenceMode,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../../types/reeditpro'
import { AIEditingProgressStage } from './AIEditingProgressStage'
import { ChatComposer } from './ChatComposer'
import { ChatMessageList } from './ChatMessageList'
import { ChatThread } from './ChatThread'
import { CanonicalJourneyStatusCard } from './CanonicalJourneyStatusCard'
import { CanonicalPlanReviewController } from './CanonicalPlanReviewController'
import { canonicalPlanApprovalReadyForPresentedPlan } from '../../lib/canonical-plan-approval-readiness'
import {
  CleanupSetup,
  EditLevelSetup,
  FrameSetup,
  ReferenceSetup,
  SourceSetup,
  VisualSetup,
} from './CleanEditSetupSurface'
import { CleanPlanningPrepSurface } from './CleanPlanningPrepSurface'
import {
  CurrentEditPreferencesWorkspace,
  type CurrentEditPreferencesApplyRequest,
  type CurrentEditPreferencesApplyResult,
} from './CurrentEditPreferencesWorkspace'
import {
  EditWorkspaceProgressCard,
  type EditWorkspaceCompletedStep,
  type EditWorkspaceStage,
} from './EditWorkspaceProgressCard'
import { EditWorkspaceRail } from './EditWorkspaceRail'
import {
  createAssistantErrorMessage,
  createAssistantQuestionMessage,
  createAssistantSystemStatusMessage,
  createAssistantTextMessage,
  createAttachmentEventMessage,
  createPlanReviewMessage,
  createPreviewReadyMessage,
  createProgressUpdateMessage,
  createReferenceEventMessage,
  createRevisionResponseMessage,
  createUserTextMessage,
} from './chatMessageBuilders'
import { defaultChatPlannerInput, progressSteps } from './chatNativeData'
import { InlineAdaptiveEditStrategyCard } from './InlineAdaptiveEditStrategyCard'
import { InlineAspectRatioGateCard } from './InlineAspectRatioGateCard'
import { InlineCaptionVisualCueTimingCard } from './InlineCaptionVisualCueTimingCard'
import { InlineCompiledIntentCard } from './InlineCompiledIntentCard'
import { InlineDemoScenarioSelector } from './InlineDemoScenarioSelector'
import { InlineDemoScenarioSummaryCard } from './InlineDemoScenarioSummaryCard'
import { InlineMasterTimingPlanCard } from './InlineMasterTimingPlanCard'
import { InlinePlanningContextCard } from './InlinePlanningContextCard'
import { InlinePlanningProgressCard } from './InlinePlanningProgressCard'
import { InlineReferenceDNACard } from './InlineReferenceDNACard'
import { InlineSoundSyncTransitionTimingCard } from './InlineSoundSyncTransitionTimingCard'
import { InlineTimingValidationCard } from './InlineTimingValidationCard'
import { InlineSourceSequenceCard } from './InlineSourceSequenceCard'
import { InlineSourceCleanupPlanCard } from './InlineSourceCleanupPlanCard'
import { InlineTrimReviewCard } from './InlineTrimReviewCard'
import { InlineVideoUnderstandingCard } from './InlineVideoUnderstandingCard'
import { InlineVisualPreferenceCard } from './InlineVisualPreferenceCard'
import type { FootagePrepMockPreviewReadyPayload } from './footage-prep'
import { MinimalProjectHeader } from './MinimalProjectHeader'
import { PreviewReadyCard } from './PreviewReadyCard'
import { PrivateReviewPreparationStatusCard } from './PrivateReviewPreparationStatusCard'

const AdvancedPlanningDetails = lazy(() =>
  import('./lazy/AdvancedPlanningDetails').then((module) => ({
    default: module.AdvancedPlanningDetails,
  })),
)

const DetailedTimelineDrawer = lazy(() =>
  import('./DetailedTimelineDrawer').then((module) => ({
    default: module.DetailedTimelineDrawer,
  })),
)

const InlineEditLevelCard = lazy(() =>
  import('./InlineEditLevelCard').then((module) => ({
    default: module.InlineEditLevelCard,
  })),
)

const EditReviewWorkspace = lazy(() =>
  import('./edit-map').then((module) => ({
    default: module.EditReviewWorkspace,
  })),
)

const ExportWorkflowPanel = lazy(() =>
  import('./exports').then((module) => ({
    default: module.ExportWorkflowPanel,
  })),
)

const FootagePrepWorkspace = lazy(() =>
  import('./footage-prep').then((module) => ({
    default: module.FootagePrepWorkspace,
  })),
)

const MusicPlanChatFlow = lazy(() =>
  import('./music/MusicPlanChatFlow').then((module) => ({
    default: module.MusicPlanChatFlow,
  })),
)

const RevisionWorkflowPanel = lazy(() =>
  import('./revisions').then((module) => ({
    default: module.RevisionWorkflowPanel,
  })),
)

const SFXPlanChatFlow = lazy(() =>
  import('./sfx/SFXPlanChatFlow').then((module) => ({
    default: module.SFXPlanChatFlow,
  })),
)

const advancedPlanningCardIds = [
  'tool_registry',
  'segment_operations',
  'color_pipeline',
  'audio_pipeline',
  'visual_asset_plan',
  'speaker_visual_layout',
  'depth_aware_overlay',
  'render_strategy',
  'tool_strategy',
  'map_animation_plan',
  'dataviz_plan',
  'character_consistency',
  'fact_safety',
  'renderer_plan',
  'qa_plan',
  'prompt_preview',
  'plan_validation',
  'planner_regression',
  'editing_agent_execution',
  'async_asset_reconciliation',
  'agent_qa_fallback',
  'launch_tool_stack',
  'planning_system_audit',
  'supabase_schema_bridge',
  'migration_drafts',
  'migration_review_rls',
  'supabase_production_readiness',
] as const

function normalizeClipOrder(clips: ClipSource[]) {
  return clips.map((clip, index) => ({ ...clip, uploadedOrder: index + 1 }))
}

function parseClipDurationMs(duration: string | undefined): number {
  const cleaned = duration?.trim()
  if (!cleaned || /^pending/i.test(cleaned)) return 9000

  const parts = cleaned.split(':').map((part) => Number(part))
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return Math.max(1000, Math.round((parts[0] * 60 + parts[1]) * 1000))
  }
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return Math.max(1000, Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000))
  }

  const seconds = Number(cleaned)
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(1000, Math.round(seconds * 1000)) : 9000
}

function formatSourceDurationSeconds(durationSeconds: number | undefined): string {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 'Pending analysis'
  const totalSeconds = Math.max(1, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatSourceBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB'] as const
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`
}

function parseClipDimensions(clip: ClipSource): { width?: number; height?: number } {
  const dimensionSource = [clip.thumbnailHint, clip.notes, clip.detectedType].filter(Boolean).join(' ')
  const match = dimensionSource.match(/\b(\d{2,5})x(\d{2,5})\b/i)
  if (!match) return {}

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return {}
  return { width, height }
}

function mediaKindForSource(clip: ClipSource, asset?: ApprovedEditExecutionUploadedMediaSourceAssetClientInput): MediaKind {
  const mimeType = asset?.mimeType?.toLowerCase() ?? ''
  const descriptor = `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''}`.toLowerCase()

  if (mimeType.startsWith('audio/') || descriptor.includes('audio')) return 'audio'
  if (descriptor.includes('screen')) return 'screen_recording'
  if (descriptor.includes('logo')) return 'logo'
  if (descriptor.includes('screenshot')) return 'screenshot'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/') || descriptor.includes('video')) return 'video'
  return 'unknown'
}

function buildFootagePrepInputFromEditorSources(input: {
  clips: ClipSource[]
  projectId: string
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  userId: string
  workspaceId: string
}): MockFootagePrepInput {
  const assetsByClipId = new Map<string, ApprovedEditExecutionUploadedMediaSourceAssetClientInput>()
  const assetsByOrder = new Map<number, ApprovedEditExecutionUploadedMediaSourceAssetClientInput>()

  for (const asset of input.sourceMediaAssets) {
    if (asset.uploadedClipId) assetsByClipId.set(asset.uploadedClipId, asset)
    if (asset.sourceSequenceItemId) assetsByClipId.set(asset.sourceSequenceItemId, asset)
    assetsByOrder.set(asset.uploadedOrder, asset)
  }

  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    sourceMedia: input.clips.map((clip, index) => {
      const uploadedOrder = clip.uploadedOrder || index + 1
      const asset = assetsByClipId.get(clip.id) ?? assetsByOrder.get(uploadedOrder)
      const mediaKind = mediaKindForSource(clip, asset)
      const mimeType = asset?.mimeType?.toLowerCase() ?? ''
      const { width, height } = parseClipDimensions(clip)
      const isStill = mediaKind === 'image' || mediaKind === 'screenshot' || mediaKind === 'logo'
      const hasAudio =
        mimeType.startsWith('audio/') ||
        mimeType.startsWith('video/') ||
        (!mimeType && (mediaKind === 'audio' || mediaKind === 'video' || mediaKind === 'screen_recording'))

      return {
        mediaAssetId: asset?.mediaAssetId ?? asset?.sourceSequenceItemId ?? clip.id,
        label: `${uploadedOrder}. ${clip.fileName}`,
        mediaKind,
        durationMs: isStill ? 0 : parseClipDurationMs(clip.duration),
        width,
        height,
        frameRate: mediaKind === 'video' || mediaKind === 'screen_recording' ? 30 : undefined,
        hasAudio,
      }
    }),
  }
}

function createRestoredClipsFromSourceMediaAssets(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] | undefined,
): ClipSource[] | null {
  if (!sourceMediaAssets?.length) return null

  return normalizeClipOrder(
    [...sourceMediaAssets]
      .sort((left, right) => left.uploadedOrder - right.uploadedOrder)
      .map((asset) => {
        const metadata = asset.sourceMetadata?.probeStatus === 'probed' ? asset.sourceMetadata : undefined
        const dimensions = metadata?.width && metadata.height ? `${metadata.width}x${metadata.height}` : undefined
        const streamSummary = [
          metadata?.hasVideo ? 'video' : undefined,
          metadata?.hasAudio ? 'audio' : undefined,
        ].filter(Boolean).join('+')
        const mimeType = asset.mimeType.toLowerCase()
        const isAudioOnly = mimeType.startsWith('audio/') || (metadata?.hasAudio === true && metadata.hasVideo === false)
        const isImage = mimeType.startsWith('image/')
        const detectedType = metadata
          ? isAudioOnly
            ? 'Restored uploaded audio source'
            : isImage
              ? 'Restored uploaded image source'
              : 'Restored uploaded video source'
          : mimeType.startsWith('video/')
            ? 'Uploaded video source'
            : 'Uploaded source'

        return {
          id: asset.uploadedClipId ?? `restored-upload-${asset.uploadedOrder}`,
          uploadedOrder: asset.uploadedOrder,
          fileName: asset.fileName,
          duration: metadata ? formatSourceDurationSeconds(metadata.durationSeconds) : 'Pending analysis',
          detectedType,
          notes: metadata
            ? 'Restored from private source storage with upload-time media metadata. Deeper transcript and content analysis still wait for approved processing.'
            : 'Restored from private source storage for this internal test edit; upload metadata was unavailable.',
          sourceRole: isAudioOnly ? 'context' : 'main_story',
          thumbnailHint: [
            formatSourceBytes(asset.byteSize),
            asset.mimeType,
            dimensions,
            streamSummary || undefined,
          ].filter(Boolean).join(' / '),
        } satisfies ClipSource
      }),
  )
}

function isEditingCategory(value: string | null): value is EditingCategory {
  return launchEditingCategories.some((category) => category.value === value)
}

function getCategoryLabel(value: EditingCategory) {
  return launchEditingCategories.find((category) => category.value === value)?.label ?? 'Storytelling'
}

function getInitialDemoScenarioId(categoryValue: string | null) {
  if (isEditingCategory(categoryValue)) {
    return getDemoScenarioIndexItemByCategory(categoryValue)?.id ?? defaultDemoScenario.id
  }

  return defaultDemoScenario.id
}

function normalizeEditorQueryId(value: string | null, fallback: string) {
  const cleaned = value?.trim()
  if (!cleaned || !/^[a-zA-Z0-9_-]{3,180}$/.test(cleaned)) {
    return fallback
  }

  return cleaned
}

function normalizeEditorProjectName(value: string | null, fallback: string) {
  const cleaned = value?.trim().replace(/\s+/g, ' ')
  if (!cleaned) {
    return fallback
  }

  return cleaned.slice(0, 80)
}

function AdvancedCardFallback({ label = 'Loading advanced details...' }: { label?: string }) {
  return (
    <div aria-live="polite" className="advanced-card-fallback" role="status">
      <span aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  )
}

function restoredInternalReviewStateMessage(handoff: LocalInternalProjectHandoff | undefined): string | null {
  if (!handoff?.privateReview) return null
  if (!privateReviewMatchesCurrentSourceSet(handoff)) {
    return 'Restored edit state: the previous review belongs to an older source set. Run a fresh review before approving or requesting changes.'
  }

  if (handoff.stage === 'internal_edit_complete') {
    if (handoff.privateReview.adapterGateSummary?.privateFallbackReviewOnly) {
      return 'Restored edit state: the review edit is complete with delivery QA evidence. Sharing and billing remain off until you approve a release path.'
    }

    return 'Restored edit state: the final edit is complete with delivery QA evidence. Sharing and billing remain off until you approve a release path.'
  }

  if (handoff.stage === 'private_review_accepted') {
    return 'Restored review state: this edit was approved. Sharing and billing remain off until you approve a release path.'
  }

  if (handoff.stage === 'revision_preview_ready') {
    return handoff.privateReview.reviewNote
      ? `Restored review state: revision preview ready after the note "${handoff.privateReview.reviewNote}". Next safe step is another review pass.`
      : 'Restored review state: revision preview ready. Next safe step is another review pass.'
  }

  if (handoff.stage === 'revision_requested') {
    return handoff.privateReview.reviewNote
      ? `Restored review state: changes requested: "${handoff.privateReview.reviewNote}". Review the revision request before another preview pass.`
      : 'Restored review state: changes requested. Review the revision request before another preview pass.'
  }

  if (handoff.stage === 'private_review_verified') {
    return 'Restored review state: review video and edit-decision trace were verified for internal testing.'
  }

  if (handoff.stage === 'private_review_ready') {
    return 'Restored review state: review output is ready for trace verification.'
  }

  return null
}

function restoredRevisionPlanContextMessage(handoff: LocalInternalProjectHandoff | undefined): string | null {
  const context = handoff?.revisionPlanContext
  if (!context?.request) return null

  return `Restored revision planning context: "${hideInternalToolNamesInCopy(context.request)}". The previous private review is context only; create a fresh plan, approval, and private review before accepting revised output.`
}

type PrivateInternalTestRunState = {
  status: string
  sourceSetFingerprint?: LocalSourceSetFingerprint
  renderPreviewAssemblyId?: string
  creditReservationId?: string
  privateInternalDownloadPath?: string
  privateInternalManifestPath?: string
  privateInternalDownloadDeliveryId?: string
  finalDeliveryQaReviewId?: string
  finalRenderExecutionId?: string
  finalRenderReadinessReviewId?: string
  finalRenderArtifactId?: string
  finalRenderSha256?: string
  expectedReviewVideoMetadata?: LocalPrivateInternalReviewVideoExpectation
  professionalEditQaSummary?: LocalPrivateInternalQaSummary
  editDecisionManifestVerification?: PrivateEditDecisionManifestVerification
  reviewVideoMetadata?: LocalPrivateInternalReviewVideoMetadata
  byteSize?: number
  nextRequiredGate?: string
  summary?: string
  adapterGateSummary?: {
    status: string
    executionMode: string
    requestedActivityCount: number
    resolvedActivityCount: number
    readyActivityCount: number
    blockedActivityCount: number
    editActivityCount: number
    readinessCheckCount: number
    toolsExecutedCount: number
    fullToolExecutionReady: false
    privateFallbackReviewOnly: true
    privateRenderIntegrationStatus?: string
    privateRenderIntegrationReady?: boolean
    privateRenderIntegratedActivityCount?: number
    backendIntegrationCandidateCount?: number
    backendIntegrationPendingActivityCount?: number
    backendIntegrationBlockedActivityCount?: number
    backendIntegrationBlockers?: string[]
    clientReadinessHintsTrusted: false
    serverSourceTruthRequiredForFullExecution: true
    frontendExecutionAllowed: false
    productReady: false
    userFacingSummary: string
    activityGroups?: ApprovedEditExecutionAdapterGateActivityGroup[]
  }
  editDecisionManifestReady?: boolean
  editDecisionManifestVerified?: boolean
  serverUserPreviewReviewId?: string
  serverReviewStatus?: string
  serverReviewNextRequiredGate?: string
}

type PrivateInternalBrowserFile = {
  objectUrl: string
  fileName: string
  mimeType: string
  byteSize: number
}

function restoredPrivateInternalTestRunFromHandoff(handoff: LocalInternalProjectHandoff | undefined): PrivateInternalTestRunState | null {
  const review = handoff?.privateReview
  if (!review?.privateInternalDownloadPath || !privateReviewMatchesCurrentSourceSet(handoff)) {
    return null
  }

  return {
    status: 'private_internal_test_run_restored_from_local_handoff',
    sourceSetFingerprint: review.sourceSetFingerprint,
    renderPreviewAssemblyId: review.renderPreviewAssemblyId,
    creditReservationId: review.creditReservationId,
    privateInternalDownloadPath: review.privateInternalDownloadPath,
    privateInternalManifestPath: review.privateInternalManifestPath,
    privateInternalDownloadDeliveryId: review.privateInternalDownloadDeliveryId,
    finalDeliveryQaReviewId: review.finalDeliveryQaReviewId,
    finalRenderExecutionId: review.finalRenderExecutionId,
    finalRenderReadinessReviewId: review.finalRenderReadinessReviewId,
    finalRenderArtifactId: review.finalRenderArtifactId,
    finalRenderSha256: review.finalRenderSha256,
    expectedReviewVideoMetadata: review.expectedReviewVideoMetadata,
    professionalEditQaSummary: review.professionalEditQaSummary,
    editDecisionManifestVerification: review.editDecisionManifestVerification,
    reviewVideoMetadata: review.reviewVideoMetadata,
    byteSize: review.byteSize,
    nextRequiredGate: review.nextRequiredGate,
    adapterGateSummary: review.adapterGateSummary,
    summary: handoff?.stage === 'revision_preview_ready'
      ? 'A revision preview is ready. The previous review video remains attached until you run a revised review pass.'
      : 'Restored review video for this internal testing edit. Public sharing remains off.',
    editDecisionManifestReady: Boolean(review.privateInternalManifestPath),
    editDecisionManifestVerified: review.manifestVerified,
    serverUserPreviewReviewId: review.serverReviewId,
    serverReviewStatus: review.serverReviewStatus,
    serverReviewNextRequiredGate: review.serverNextRequiredGate,
  }
}

function expectedReviewVideoMetadataFromArtifact(
  artifact: { durationSeconds?: number; width?: number; height?: number } | undefined,
): LocalPrivateInternalReviewVideoExpectation | undefined {
  const durationSeconds = artifact?.durationSeconds
  const width = artifact?.width
  const height = artifact?.height

  if (
    typeof durationSeconds !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(durationSeconds) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    durationSeconds <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return undefined
  }

  return {
    durationSeconds,
    width,
    height,
  }
}

function privateInternalRunMatchesSourceSet(
  run: PrivateInternalTestRunState | null,
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
): boolean {
  const currentSourceSetFingerprint = createLocalSourceSetFingerprint(sourceMediaAssets)
  return Boolean(currentSourceSetFingerprint) &&
    run?.sourceSetFingerprint === currentSourceSetFingerprint
}

function isDurableUploadedPrivateSourceAsset(
  asset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
): boolean {
  return asset.privateArtifact === true &&
    asset.byteSize > 0 &&
    /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '') &&
    asset.publicUrl === null &&
    asset.signedUrl === null
}

function uploadedPrivateSourceAssetsCoverClips(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
  clips: ClipSource[],
): boolean {
  const durableSourceMediaAssets = sourceMediaAssets.filter(isDurableUploadedPrivateSourceAsset)

  if (!clips.length || durableSourceMediaAssets.length === 0) {
    return false
  }

  const assetClipIds = new Set(
    durableSourceMediaAssets.flatMap((asset) => [
      asset.uploadedClipId,
      asset.sourceSequenceItemId,
    ].filter((value): value is string => Boolean(value))),
  )
  const assetUploadedOrders = new Set(durableSourceMediaAssets.map((asset) => asset.uploadedOrder))

  return clips.every((clip, index) => {
    const uploadedOrder = clip.uploadedOrder || index + 1
    return assetClipIds.has(clip.id) || assetUploadedOrders.has(uploadedOrder)
  })
}

function durableUploadedPrivateSourceAssets(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] {
  return sourceMediaAssets.filter(isDurableUploadedPrivateSourceAsset)
}

function privateFinalQaSummaryText(summary: LocalPrivateInternalQaSummary | undefined): string | null {
  if (!summary?.privateInternalQaReady) return null

  const parts = [
    `${summary.approvedReviewOverlayCount} review overlay${summary.approvedReviewOverlayCount === 1 ? '' : 's'}`,
    `${summary.approvedCaptionOverlayCount} caption timing overlay${summary.approvedCaptionOverlayCount === 1 ? '' : 's'}`,
    `${summary.approvedTransitionPolishCount} transition polish pass${summary.approvedTransitionPolishCount === 1 ? '' : 'es'}`,
    `${summary.approvedVisualPolishCount} visual polish operation${summary.approvedVisualPolishCount === 1 ? '' : 's'}`,
  ]

  if (summary.audioPolishApplied) parts.push('voice-safe audio polish')
  if (summary.sourceAudioQaAttached) {
    const reviewCount = summary.sourceAudioQaReviewCount ?? 0
    parts.push(reviewCount > 0
      ? `${reviewCount} uploaded-source audio QA review${reviewCount === 1 ? '' : 's'}`
      : 'uploaded-source audio QA')
  }
  if (summary.privateCaptionArtifactCount) {
    parts.push(`${summary.privateCaptionArtifactCount} private caption artifact${summary.privateCaptionArtifactCount === 1 ? '' : 's'}`)
  }

  return `Final QA passed with ${parts.join(', ')}.`
}

function attachManifestAudioQaSummary(
  summary: LocalPrivateInternalQaSummary | undefined,
  manifest: ProfessionalEditDecisionManifestClientModel | undefined,
): LocalPrivateInternalQaSummary | undefined {
  if (!summary) return undefined
  const audioQaIntegration = manifest?.audioQaIntegration
  if (!audioQaIntegration) return summary

  return {
    ...summary,
    sourceAudioQaAttached: audioQaIntegration.attached,
    sourceAudioQaSource: audioQaIntegration.source,
    sourceAudioQaReviewCount: audioQaIntegration.reviewCount,
    sourceAudioQaGateCount: audioQaIntegration.qaGateCount,
    sourceAudioQaBlockingGateCount: audioQaIntegration.blockingQaGateCount,
    sourceAudioQaWarningGateCount: audioQaIntegration.warningQaGateCount,
    sourceAudioQaBlocksPreview: audioQaIntegration.blocksPreview,
    sourceAudioQaBlocksFinalExport: audioQaIntegration.blocksFinalExport,
    sourceAudioQaFinalMuxAllowed: false,
    sourceAudioQaProductRuntimeExecuted: false,
    sourceAudioQaPublicArtifact: false,
    sourceAudioQaSignedUrl: null,
  }
}

const DEFAULT_REFERENCE_FOCUS_SELECTIONS = ['pacing', 'visual_language']

type ChatNativeEditorProps = {
  onOpenTimeline?: () => void
  projectPersistenceScope: ProjectPersistenceScope
}

type EditorUtilityPanel = 'demo' | 'planning' | null
type PendingPreferenceDestination = 'chat' | 'brief' | null

type CleanEditorStage =
  | 'source'
  | 'frame'
  | 'cleanup'
  | 'source_review'
  | 'edit_level'
  | 'visual_direction'
  | 'reference'
  | 'planning'
  | 'plan_review'
  | 'processing'
  | 'private_review'

const currentEditPreferenceLockedStages = new Set<LocalInternalProjectHandoff['stage']>([
  'plan_approved',
  'private_review_ready',
  'private_review_verified',
  'private_review_accepted',
  'internal_edit_complete',
  'revision_requested',
  'revision_preview_ready',
])

function preserveContextAwarePlanSourceOfTruth(
  fullPlan: EditPlan,
  contextAwarePlanResult: ContextAwareMockEditPlanResult | null,
): EditPlan {
  if (!contextAwarePlanResult) return fullPlan

  return {
    ...fullPlan,
    goalSummary: contextAwarePlanResult.editPlan.goalSummary,
    professionalSkillPlan:
      contextAwarePlanResult.professionalSkillPlan ??
      contextAwarePlanResult.editPlan.professionalSkillPlan ??
      fullPlan.professionalSkillPlan,
  }
}

function createCompiledPlanningFingerprint(input: PlannerInput): string | null {
  try {
    return createGuidedMockEditPlan(input).planningInputTrace?.fingerprint ?? null
  } catch {
    return null
  }
}

export function ChatNativeEditor({ onOpenTimeline, projectPersistenceScope }: ChatNativeEditorProps) {
  const getLocalInternalEditHandoff = useCallback(
    (projectId: string, editSessionId: string) =>
      getScopedLocalInternalEditHandoff(projectPersistenceScope, projectId, editSessionId),
    [projectPersistenceScope],
  )
  const saveLocalInternalProjectHandoff = useCallback(
    (handoff: LocalInternalProjectHandoff, options: { syncBackend?: boolean } = {}) =>
      saveScopedLocalInternalProjectHandoff(projectPersistenceScope, handoff, options),
    [projectPersistenceScope],
  )
  const updateLocalInternalEditHandoff = useCallback((
    projectId: string,
    editSessionId: string,
    patch: Partial<Omit<LocalInternalProjectHandoff, 'id' | 'projectId' | 'editSessionId' | 'createdAt' | 'persistence'>>,
    options: { syncBackend?: boolean } = {},
  ) => updateScopedLocalInternalEditHandoff(
    projectPersistenceScope,
    projectId,
    editSessionId,
    patch,
    options,
  ), [projectPersistenceScope])
  const fetchLocalInternalProjectHandoffFromBackend = useCallback(
    (projectId: string, editSessionId?: string) =>
      fetchScopedLocalInternalProjectHandoffFromBackend(projectPersistenceScope, projectId, editSessionId),
    [projectPersistenceScope],
  )
  const persistLocalInternalProjectHandoffToBackend = useCallback(
    (handoff: LocalInternalProjectHandoff) =>
      persistScopedLocalInternalProjectHandoffToBackend(projectPersistenceScope, handoff),
    [projectPersistenceScope],
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const routeParams = useParams()
  const hasProjectEditRoute = Boolean(routeParams.projectId && routeParams.editSessionId)
  const frontendApiStatus = getFrontendApiClientStatus()
  const canonicalPlanningBackendConnected = hasProjectEditRoute &&
    !frontendApiStatus.mockOnly &&
    Boolean(frontendApiStatus.apiBaseUrl)
  const editorOperationUserId = hasProjectEditRoute
    ? projectPersistenceScope.backendUserId ?? projectPersistenceScope.userId
    : 'mock-user'
  const editorProjectId = normalizeEditorQueryId(routeParams.projectId ?? searchParams.get('projectId'), 'mock-project')
  const editorEditSessionId = normalizeEditorQueryId(routeParams.editSessionId ?? searchParams.get('editSessionId'), 'mock-edit-session')
  const canonicalJourney = useCanonicalEditJourney({
    editSessionId: editorEditSessionId,
    enabled: hasProjectEditRoute,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalPlanningPublication = useCanonicalPlanningPublication({
    editSessionId: editorEditSessionId,
    enabled: canonicalPlanningBackendConnected,
    onSaved: canonicalJourney.refresh,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalPlanApproval = useCanonicalPlanApproval({
    editSessionId: editorEditSessionId,
    enabled: canonicalPlanningBackendConnected,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalExecutionPackageRequest = useCanonicalExecutionPackageRequest({
    editSessionId: editorEditSessionId,
    enabled: canonicalPlanningBackendConnected,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalPrivateEditPreparation = useCanonicalPrivateEditPreparation({
    editSessionId: editorEditSessionId,
    enabled: canonicalPlanningBackendConnected,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalPrivateReview = useCanonicalPrivateReview({
    editSessionId: editorEditSessionId,
    enabled: canonicalPlanningBackendConnected,
    projectId: editorProjectId,
    scope: projectPersistenceScope,
  })
  const canonicalJourneyValue = canonicalJourney.result?.status === 'ready'
    ? canonicalJourney.result.journey
    : undefined
  const canonicalApprovalRecorded = Boolean(
    canonicalPlanningBackendConnected &&
    (
      canonicalPlanApproval.result?.status === 'approved' ||
      (
        canonicalJourneyValue?.plan?.status === 'approved' &&
        canonicalJourneyValue.plan.estimateStatus === 'approved' &&
        Boolean(canonicalJourneyValue.approval)
      )
    ),
  )
  const resetCanonicalPlanningPublication = canonicalPlanningPublication.reset
  const subscribeToEditPersistence = useCallback(
    (listener: (status: InternalEditPersistenceStatus | null) => void) => {
      if (!hasProjectEditRoute) return () => undefined
      return subscribeInternalEditPersistenceStatus(
        projectPersistenceScope,
        editorProjectId,
        editorEditSessionId,
        listener,
      )
    }, [editorEditSessionId, editorProjectId, hasProjectEditRoute, projectPersistenceScope],
  )
  const getEditPersistenceSnapshot = useCallback(
    () => hasProjectEditRoute
      ? getInternalEditPersistenceStatus(
          projectPersistenceScope,
          editorProjectId,
          editorEditSessionId,
        )
      : null,
    [editorEditSessionId, editorProjectId, hasProjectEditRoute, projectPersistenceScope],
  )
  const editPersistenceStatus = useSyncExternalStore(
    subscribeToEditPersistence,
    getEditPersistenceSnapshot,
    () => null,
  )
  const handleRetryEditPersistence = useCallback(() => {
    if (!hasProjectEditRoute) return
    retryInternalEditPersistence(
      projectPersistenceScope,
      editorProjectId,
      editorEditSessionId,
    )
  }, [editorEditSessionId, editorProjectId, hasProjectEditRoute, projectPersistenceScope])
  const [backendRecoveredHandoff, setBackendRecoveredHandoff] = useState<LocalInternalProjectHandoff | undefined>()
  const localProjectHandoff = useMemo(
    () => getLocalInternalEditHandoff(editorProjectId, editorEditSessionId) ??
      (
        backendRecoveredHandoff?.workspaceId === projectPersistenceScope.workspaceId &&
        backendRecoveredHandoff.projectId === editorProjectId &&
        backendRecoveredHandoff.editSessionId === editorEditSessionId
          ? backendRecoveredHandoff
          : undefined
      ),
    [backendRecoveredHandoff, editorEditSessionId, editorProjectId, getLocalInternalEditHandoff, projectPersistenceScope.workspaceId],
  )
  const restoredSetup = localProjectHandoff?.setup
  const isLocalProjectHandoff = Boolean(localProjectHandoff)
  const isProjectWorkspace = hasProjectEditRoute || isLocalProjectHandoff
  const activeWorkspaceView: 'chat' | 'preferences' =
    isProjectWorkspace && searchParams.get('view') === 'preferences' ? 'preferences' : 'chat'
  const categoryFromQuery = searchParams.get('category') ?? localProjectHandoff?.category ?? null
  const editorProjectName = normalizeEditorProjectName(
    searchParams.get('projectName') ?? localProjectHandoff?.projectName ?? null,
    'Untitled ReeditPro edit',
  )
  const editorEditName = normalizeEditorProjectName(
    searchParams.get('editName') ?? localProjectHandoff?.editName ?? localProjectHandoff?.projectName ?? null,
    editorProjectName,
  )
  useEffect(() => {
    if (getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)) return
    let cancelled = false
    void fetchLocalInternalProjectHandoffFromBackend(editorProjectId, editorEditSessionId)
      .then((handoff) => {
        if (cancelled || !handoff || handoff.editSessionId !== editorEditSessionId) return
        saveLocalInternalProjectHandoff(handoff, { syncBackend: false })
        setBackendRecoveredHandoff(handoff)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [
    editorEditSessionId,
    editorProjectId,
    fetchLocalInternalProjectHandoffFromBackend,
    getLocalInternalEditHandoff,
    saveLocalInternalProjectHandoff,
  ])
  const restoredPrivateInternalTestRun = useMemo(
    () => restoredPrivateInternalTestRunFromHandoff(localProjectHandoff),
    [localProjectHandoff],
  )
  const qaApprovalFailureEnabled =
    (import.meta.env.DEV || import.meta.env.VITE_REEDITPRO_E2E === 'true') &&
    searchParams.get('qaApprovalFailure') === '1'
  const demoUtilityControlsEnabled =
    !isProjectWorkspace &&
    (import.meta.env.DEV || import.meta.env.VITE_REEDITPRO_E2E === 'true') &&
    (searchParams.get('demo') === '1' || searchParams.get('developerControls') === '1')
  const initialScenarioId = getInitialDemoScenarioId(categoryFromQuery)
  const initialScenario = defaultDemoScenario
  const initialEditPreferenceValues = readCurrentEditPreferenceValues(restoredSetup, {
    editLevel: initialScenario.editLevel,
    workflowType: initialScenario.workflowType,
    cleanupPreference: restoredSetup?.cleanupPreference ?? 'balanced_cleanup',
    visualPreference: initialScenario.visualPreference,
    moodStyle: initialScenario.moodStyle,
    creditPreference: initialScenario.creditPreference,
    targetPlatform: isProjectWorkspace ? 'custom' : initialScenario.targetPlatform,
  })
  const [currentEditPreferenceBaseline] = useState(() => resolveCurrentEditPreferenceBaseline(
    restoredSetup,
    initialEditPreferenceValues,
  ))
  const restoredSourceClips = createRestoredClipsFromSourceMediaAssets(localProjectHandoff?.sourceMediaAssets)
  const initialClips = isProjectWorkspace && !restoredSourceClips?.length
    ? []
    : restoredSourceClips ?? initialScenario.clips
  const initialCustomInstructions = restoredSetup?.customInstructions ?? (isProjectWorkspace ? '' : initialScenario.customInstructions)
  const initialUserInstructionHistory = normalizeOrderedUserInstructions(
    restoredSetup?.userInstructionHistory,
    initialCustomInstructions,
  )
  const initialEditingCategory = launchEditingCategories.find(
    (category) => category.value === categoryFromQuery,
  )?.value ?? initialScenario.editingCategory
  const hasDurableLocalEditState = Boolean(
    localProjectHandoff?.sourceMediaAssets?.length ||
    localProjectHandoff?.setup ||
    localProjectHandoff?.privateReview ||
    localProjectHandoff?.revisionPlanContext,
  )

  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenarioId)
  const [selectedScenario, setSelectedScenario] = useState(initialScenario)
  const [selectedScenarioLoading, setSelectedScenarioLoading] = useState(
    !hasDurableLocalEditState && initialScenarioId !== initialScenario.id,
  )
  const [scenarioLoadError, setScenarioLoadError] = useState('')
  const [displayMode, setDisplayMode] = useState<ChatPlanningDisplayMode>('guided')
  const [utilityPanel, setUtilityPanel] = useState<EditorUtilityPanel>(null)
  const [clips, setClips] = useState<ClipSource[]>(initialClips)
  const [sourceSequenceMode, setSourceSequenceMode] = useState<SourceSequenceMode>(() =>
    restoredSetup?.sourceSequenceMode ?? inferSourceSequenceMode(initialClips, initialCustomInstructions),
  )
  const [composerValue, setComposerValue] = useState(initialCustomInstructions)
  const [customInstructions, setCustomInstructions] = useState(initialCustomInstructions)
  const [userInstructionHistory, setUserInstructionHistory] = useState(initialUserInstructionHistory)
  const [clipsAttached, setClipsAttached] = useState(initialClips.length > 0)
  const [sourceOrderConfirmed, setSourceOrderConfirmed] = useState(restoredSetup?.sourceOrderConfirmed ?? false)
  const [cleanupPreference, setCleanupPreference] = useState<CleanupPreference | undefined>(initialEditPreferenceValues.cleanupPreference)
  const [cleanupPreferenceConfirmed, setCleanupPreferenceConfirmed] = useState(restoredSetup?.cleanupPreferenceConfirmed ?? false)
  const [referenceAttached, setReferenceAttached] = useState(restoredSetup?.referenceAttached ?? (isProjectWorkspace ? false : initialScenario.referenceAttached))
  const [referenceUrl, setReferenceUrl] = useState(restoredSetup?.referenceUrl ?? (isProjectWorkspace ? '' : initialScenario.referenceUrl))
  const [referenceSkipped, setReferenceSkipped] = useState(restoredSetup?.referenceSkipped ?? false)
  const [referenceFocusSelections, setReferenceFocusSelections] = useState<string[]>(
    Array.isArray(restoredSetup?.referenceFocusSelections)
      ? restoredSetup.referenceFocusSelections
      : DEFAULT_REFERENCE_FOCUS_SELECTIONS,
  )
  const [editingCategory, setEditingCategory] = useState<EditingCategory>(initialEditingCategory)
  const [editLevel, setEditLevel] = useState<EditLevel>(initialEditPreferenceValues.editLevel)
  const [editLevelConfirmed, setEditLevelConfirmed] = useState(restoredSetup?.editLevelConfirmed ?? false)
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>(initialEditPreferenceValues.targetPlatform)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(restoredSetup?.aspectRatio ?? (isProjectWorkspace ? 'let_ai_decide' : initialScenario.aspectRatio))
  const [frameTemplateType, setFrameTemplateType] = useState<FrameTemplateType>(restoredSetup?.frameTemplateType ?? (isProjectWorkspace ? 'let_ai_decide' : initialScenario.frameTemplateType))
  const [aspectRatioConfirmed, setAspectRatioConfirmed] = useState(restoredSetup?.aspectRatioConfirmed ?? false)
  const [aspectRatioSource, setAspectRatioSource] = useState<AspectRatioSource>(restoredSetup?.aspectRatioSource ?? (isProjectWorkspace ? 'unknown' : 'demo_scenario'))
  const [visualPreference, setVisualPreference] = useState<VisualPreference>(initialEditPreferenceValues.visualPreference)
  const [visualPreferenceConfirmed, setVisualPreferenceConfirmed] = useState(restoredSetup?.visualPreferenceConfirmed ?? false)
  const [workflowType, setWorkflowType] = useState<VideoWorkflowType>(initialEditPreferenceValues.workflowType)
  const [moodStyle, setMoodStyle] = useState<MoodStyle>(initialEditPreferenceValues.moodStyle)
  const [creditPreference, setCreditPreference] = useState<CreditPreference>(initialEditPreferenceValues.creditPreference)
  const [currentEditPreferenceRevision, setCurrentEditPreferenceRevision] = useState(restoredSetup?.preferenceRevision ?? 0)
  const [currentEditPreferenceUpdatedAt, setCurrentEditPreferenceUpdatedAt] = useState(restoredSetup?.preferenceUpdatedAt)
  const [currentEditPreferenceDraftDirty, setCurrentEditPreferenceDraftDirty] = useState(false)
  const [pendingPreferenceDestination, setPendingPreferenceDestination] = useState<PendingPreferenceDestination>(null)
  const [currentEditPreferenceApplyEpoch, setCurrentEditPreferenceApplyEpoch] = useState(0)
  const [pendingExactEditPreferenceApply, setPendingExactEditPreferenceApply] = useState<
    ExactEditPreferencePendingApply | undefined
  >(() => hasProjectEditRoute
    ? readExactEditPreferencePendingApply({
        scope: projectPersistenceScope,
        projectId: editorProjectId,
        editSessionId: editorEditSessionId,
      })
    : undefined)
  const currentEditPreferenceValues = useMemo<LocalInternalEditPreferenceValues>(() => ({
    editLevel,
    workflowType,
    cleanupPreference: cleanupPreference ?? currentEditPreferenceBaseline.cleanupPreference,
    visualPreference,
    moodStyle,
    creditPreference,
    targetPlatform,
  }), [
    cleanupPreference,
    creditPreference,
    currentEditPreferenceBaseline.cleanupPreference,
    editLevel,
    moodStyle,
    targetPlatform,
    visualPreference,
    workflowType,
  ])
  const currentEditPreferenceOverrideKeys = useMemo(
    () => getCurrentEditPreferenceOverrideKeys(currentEditPreferenceValues, currentEditPreferenceBaseline),
    [currentEditPreferenceBaseline, currentEditPreferenceValues],
  )
  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setPendingExactEditPreferenceApply(hasProjectEditRoute
        ? readExactEditPreferencePendingApply({
            scope: projectPersistenceScope,
            projectId: editorProjectId,
            editSessionId: editorEditSessionId,
          })
        : undefined)
    }, 0)
    return () => window.clearTimeout(restoreTimer)
  }, [editorEditSessionId, editorProjectId, hasProjectEditRoute, projectPersistenceScope])
  const [intentApproved, setIntentApproved] = useState(false)
  const [approved, setApproved] = useState(false)
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedPlanSnapshot | null>(null)
  const [executionRehearsal, setExecutionRehearsal] = useState<EditSessionExecutionRehearsal | null>(null)
  const [sourceMediaAssets, setSourceMediaAssets] = useState<ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]>(() =>
    localProjectHandoff?.sourceMediaAssets?.length
      ? localProjectHandoff.sourceMediaAssets
      : isProjectWorkspace
        ? []
      : createExecutionSourceMediaAssetsFromClips(initialScenario.clips, editorProjectId),
  )
  const [activeEditBriefState, setActiveEditBriefState] = useState<EditBriefState | undefined>(
    () => localProjectHandoff?.editBriefState,
  )
  const [backendLocalEditBrief, setBackendLocalEditBrief] = useState<ProjectEditBriefBackendLocalRecord>()
  const editBriefAuthorityEpochRef = useRef(0)
  const latestEditBriefStateRef = useRef<EditBriefState | undefined>(localProjectHandoff?.editBriefState)
  const editBriefBackendConfig = useMemo(
    () => createProjectEditBriefBackendLocalConfig(import.meta.env as Record<string, string | undefined>),
    [],
  )
  const editReferenceApi = useMemo(() => createEditReferenceApiClient(), [])
  const [editAuthorityCreatedAt] = useState(() => localProjectHandoff?.createdAt ?? new Date().toISOString())
  const [privateInternalTestRun, setPrivateInternalTestRun] = useState<PrivateInternalTestRunState | null>(() =>
    restoredPrivateInternalTestRun,
  )
  const [activeRevisionPlanContext, setActiveRevisionPlanContext] = useState<LocalInternalProjectHandoff['revisionPlanContext']>(
    () => localProjectHandoff?.revisionPlanContext,
  )
  useEffect(() => {
    if (latestEditBriefStateRef.current || !localProjectHandoff?.editBriefState) return
    latestEditBriefStateRef.current = localProjectHandoff.editBriefState
    const restoreTimer = window.setTimeout(() => {
      setActiveEditBriefState(localProjectHandoff.editBriefState)
    }, 0)
    return () => window.clearTimeout(restoreTimer)
  }, [localProjectHandoff?.editBriefState])

  useEffect(() => {
    const state = activeEditBriefState
    const sourceResolution = resolveCurrentEditReferenceTargetSource(sourceMediaAssets)
    if (
      !isProjectWorkspace
      || !editBriefBackendConfig.available
      || !editBriefBackendConfig.apiBaseUrl
      || state?.editBrief.status !== 'ready'
      || !sourceResolution.ok
    ) {
      const clearTimer = window.setTimeout(() => setBackendLocalEditBrief(undefined), 0)
      return () => window.clearTimeout(clearTimer)
    }

    let cancelled = false
    void readProjectEditBriefBackendLocal({
      apiBaseUrl: editBriefBackendConfig.apiBaseUrl,
      editSessionId: editorEditSessionId,
      projectId: editorProjectId,
      workspaceId: projectPersistenceScope.workspaceId,
    })
      .then(({ editBrief }) => {
        if (cancelled) return
        const expectedText = createCurrentEditReferenceBackendBriefText(state)
        const exactReadback = editBrief.readbackVerified === true
          && editBrief.briefText === expectedText
          && editBrief.sourceStorageObjectRecordId === sourceResolution.source.storageObjectRecordId
          && editBrief.sourceMediaAssetId === sourceResolution.source.mediaAssetId
        setBackendLocalEditBrief(exactReadback ? editBrief : undefined)
      })
      .catch(() => {
        if (!cancelled) setBackendLocalEditBrief(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [
    activeEditBriefState,
    editBriefBackendConfig.apiBaseUrl,
    editBriefBackendConfig.available,
    editorEditSessionId,
    editorProjectId,
    isProjectWorkspace,
    projectPersistenceScope.workspaceId,
    sourceMediaAssets,
  ])
  useEffect(() => {
    if (!activeRevisionPlanContext?.sourceSetFingerprint) return
    const currentSourceSetFingerprint = createLocalSourceSetFingerprint(durableUploadedPrivateSourceAssets(sourceMediaAssets))
    if (currentSourceSetFingerprint === activeRevisionPlanContext.sourceSetFingerprint) return

    const invalidationTimer = window.setTimeout(() => {
      setActiveRevisionPlanContext(undefined)
    }, 0)

    return () => window.clearTimeout(invalidationTimer)
  }, [activeRevisionPlanContext, sourceMediaAssets])
  const [privateInternalDownloadFile, setPrivateInternalDownloadFile] = useState<PrivateInternalBrowserFile | null>(null)
  const [privateInternalManifestFile, setPrivateInternalManifestFile] = useState<PrivateInternalBrowserFile | null>(null)
  const [privateInternalReviewVideoMetadata, setPrivateInternalReviewVideoMetadata] = useState<LocalPrivateInternalReviewVideoMetadata | null>(() =>
    localProjectHandoff?.privateReview?.reviewVideoMetadata ?? null,
  )
  const [privateInternalDownloadLoading, setPrivateInternalDownloadLoading] = useState(false)
  const [privateInternalDownloadError, setPrivateInternalDownloadError] = useState('')
  const [privateInternalTestRunRunning, setPrivateInternalTestRunRunning] = useState(false)
  const [privateInternalTestRunError, setPrivateInternalTestRunError] = useState('')
  const [privateInternalReviewDecision, setPrivateInternalReviewDecision] = useState<
    'accepted_for_internal_testing' | 'changes_requested' | null
  >(() => localProjectHandoff?.privateReview?.reviewDecision ?? null)
  const [privateInternalReviewNote, setPrivateInternalReviewNote] = useState(localProjectHandoff?.privateReview?.reviewNote ?? '')
  const [privateInternalReviewRecording, setPrivateInternalReviewRecording] = useState(false)
  const [pendingPrivateReviewRevisionOperationId, setPendingPrivateReviewRevisionOperationId] = useState<string | null>(null)
  const [privateInternalRevisionRequestId, setPrivateInternalRevisionRequestId] = useState<string | null>(null)
  const [recordedRevisionPreviewRequestId, setRecordedRevisionPreviewRequestId] = useState<string | null>(null)
  const [approvalChecking, setApprovalCheckingState] = useState(false)
  const approvalCheckingRef = useRef(false)
  const setApprovalChecking = useCallback((next: boolean) => {
    approvalCheckingRef.current = next
    setApprovalCheckingState(next)
  }, [])
  const [contextAwarePlanResult, setContextAwarePlanResult] = useState<ContextAwareMockEditPlanResult | null>(null)
  const pendingPlanReviewScrollRef = useRef(false)
  const [editBriefGate, setEditBriefGate] = useState<{ ready: boolean; status: EditBriefStatus | null }>({
    ready: false,
    status: null,
  })
  const [editBriefOpenRequestId, setEditBriefOpenRequestId] = useState(0)
  const [progressStarted, setProgressStarted] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)
  const [previewReady, setPreviewReady] = useState(false)
  const [contextMockPreview, setContextMockPreview] = useState<{
    previewId?: string
    previewLabel?: string
    creditsUsed: number
    payload?: FootagePrepMockPreviewReadyPayload
  } | null>(null)
  const [showEditMap, setShowEditMap] = useState(false)
  const [runtimeMessages, setRuntimeMessages] = useState<ReeditProChatMessage[]>([])
  const replaceRuntimeStatusMessage = useCallback((message: ReeditProChatMessage) => {
    setRuntimeMessages((messages) => [
      ...messages.filter((item) => item.type !== 'assistant_revision_response' && item.type !== 'assistant_error'),
      message,
    ])
  }, [])
  const showRevisionMessage = useCallback((content: string) => {
    replaceRuntimeStatusMessage(createRevisionResponseMessage(content, {
      id: `revision-response-${Date.now()}`,
      actions: [{ id: 'ask_question', label: 'Ask a question', variant: 'ghost' }],
    }))
  }, [replaceRuntimeStatusMessage])
  const [sourceUploadPlanning, setSourceUploadPlanning] = useState(false)
  const [uploadGateError, setUploadGateError] = useState('')
  const [showMusicPlan, setShowMusicPlan] = useState(false)
  const [showSFXPlan, setShowSFXPlan] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const progressTimerRef = useRef<number | null>(null)
  const timelineLayerRef = useRef<HTMLDivElement | null>(null)
  const uploadGateInputRef = useRef<HTMLInputElement | null>(null)
  const approvedSnapshotRecoveryAttemptedIdRef = useRef<string | null>(null)

  useEffect(() => {
    const recoveredHandoff = backendRecoveredHandoff?.projectId === editorProjectId ? backendRecoveredHandoff : undefined
    if (!recoveredHandoff) return

    const recoveredSourceMediaAssets = recoveredHandoff.sourceMediaAssets
    if (!recoveredSourceMediaAssets?.length) return

    const recoveryTimer = window.setTimeout(() => {
      const restoredSourceFingerprint = createLocalSourceSetFingerprint(recoveredSourceMediaAssets)
      const currentSourceFingerprint = createLocalSourceSetFingerprint(sourceMediaAssets)

      if (restoredSourceFingerprint && restoredSourceFingerprint !== currentSourceFingerprint) {
        const restoredClips = createRestoredClipsFromSourceMediaAssets(recoveredSourceMediaAssets)
        setSourceMediaAssets(recoveredSourceMediaAssets)
        if (restoredClips?.length) {
          setClips(restoredClips)
          setClipsAttached(true)
          setSourceSequenceMode(recoveredHandoff.setup?.sourceSequenceMode ?? inferSourceSequenceMode(
            restoredClips,
            recoveredHandoff.setup?.customInstructions ?? customInstructions,
          ))
        }
      }

      if (
        restoredPrivateInternalTestRun &&
        privateInternalTestRun?.privateInternalDownloadPath !== restoredPrivateInternalTestRun.privateInternalDownloadPath
      ) {
        setPrivateInternalTestRun(restoredPrivateInternalTestRun)
      }

      if (!privateInternalReviewVideoMetadata && recoveredHandoff.privateReview?.reviewVideoMetadata) {
        setPrivateInternalReviewVideoMetadata(recoveredHandoff.privateReview.reviewVideoMetadata)
      }

      if (!privateInternalReviewDecision && recoveredHandoff.privateReview?.reviewDecision) {
        setPrivateInternalReviewDecision(recoveredHandoff.privateReview.reviewDecision)
      }

      if (!privateInternalReviewNote && recoveredHandoff.privateReview?.reviewNote) {
        setPrivateInternalReviewNote(recoveredHandoff.privateReview.reviewNote)
      }

      if (!activeRevisionPlanContext && recoveredHandoff.revisionPlanContext) {
        setActiveRevisionPlanContext(recoveredHandoff.revisionPlanContext)
      }
    }, 0)

    return () => window.clearTimeout(recoveryTimer)
  }, [
    activeRevisionPlanContext,
    backendRecoveredHandoff,
    customInstructions,
    editorProjectId,
    privateInternalReviewDecision,
    privateInternalReviewNote,
    privateInternalReviewVideoMetadata,
    privateInternalTestRun?.privateInternalDownloadPath,
    restoredPrivateInternalTestRun,
    sourceMediaAssets,
  ])

  useEffect(() => {
    const recoveredHandoff = localProjectHandoff?.projectId === editorProjectId ? localProjectHandoff : undefined
    const recoveredSnapshotId = recoveredHandoff?.approvedSnapshotId
    if (!recoveredSnapshotId || approvedSnapshot?.id === recoveredSnapshotId) return
    if (canonicalPlanningBackendConnected) return
    if (approvedSnapshotRecoveryAttemptedIdRef.current === recoveredSnapshotId) return

    let cancelled = false
    let completed = false
    approvedSnapshotRecoveryAttemptedIdRef.current = recoveredSnapshotId
    void fetchApprovedPlanSnapshotFromBackend(recoveredSnapshotId, {
      workspaceId: projectPersistenceScope.workspaceId,
      projectId: editorProjectId,
      userId: editorOperationUserId,
    })
      .then((result) => {
        completed = true
        if (cancelled) return
        if (!result.ok || !result.approvedSnapshot) {
          if (recoveredHandoff.stage === 'plan_approved') {
            setPrivateInternalTestRunError(result.errorMessage ?? 'Approved plan could not be restored from saved state.')
          }
          return
        }

        const recoveredRehearsal = createEditSessionExecutionRehearsal({ approvedSnapshot: result.approvedSnapshot })
        const recoveredApprovedSnapshot = recoveredRehearsal.executionPlan
          ? { ...result.approvedSnapshot, editingAgentExecutionPlan: recoveredRehearsal.executionPlan }
          : result.approvedSnapshot
        setApprovedSnapshot(recoveredApprovedSnapshot)
        setExecutionRehearsal(recoveredRehearsal)
        setApproved(true)
      })
      .catch((error) => {
        completed = true
        if (cancelled || recoveredHandoff.stage !== 'plan_approved') return
        setPrivateInternalTestRunError(error instanceof Error ? error.message : 'Approved plan could not be restored from saved state.')
      })

    return () => {
      cancelled = true
      if (!completed && approvedSnapshotRecoveryAttemptedIdRef.current === recoveredSnapshotId) {
        approvedSnapshotRecoveryAttemptedIdRef.current = null
      }
    }
  }, [
    approvedSnapshot?.id,
    canonicalPlanningBackendConnected,
    editorOperationUserId,
    editorProjectId,
    localProjectHandoff,
    projectPersistenceScope.workspaceId,
  ])

  const {
    isRunning: footagePrepRunning,
    resetPrep: resetFootagePrep,
    result: footagePrepResult,
    runPrep: runFootagePrep,
  } = useMockFootagePrep()
  const effectivePreviewReady = previewReady || Boolean(contextMockPreview) || Boolean(privateInternalTestRun?.privateInternalDownloadPath)
  const currentEditPreferencesLocked = Boolean(
    approvalChecking ||
    approved ||
    approvedSnapshot ||
    canonicalApprovalRecorded ||
    canonicalJourneyValue?.stage === 'revision_requested' ||
    (
      canonicalJourneyValue?.stage !== 'replanning_required' &&
      (canonicalJourneyValue?.plan?.version ?? 0) > 1
    ) ||
    progressStarted ||
    privateInternalTestRun ||
    (localProjectHandoff && currentEditPreferenceLockedStages.has(localProjectHandoff.stage)),
  )
  const currentEditDraftPlanExists = Boolean(contextAwarePlanResult)
  const currentEditReferenceAuthorityResolution = useMemo(
    () => resolveCurrentEditReferenceActiveEditorAuthority({
      aspectRatio,
      aspectRatioConfirmed,
      backendBrief: backendLocalEditBrief,
      createdAt: editAuthorityCreatedAt,
      currentUserInstruction: customInstructions,
      editBriefState: activeEditBriefState,
      editLevel,
      editName: editorEditName,
      editSessionId: editorEditSessionId,
      ownerUserId: editorOperationUserId,
      projectId: editorProjectId,
      projectName: editorProjectName,
      sourceMediaAssets,
      targetPlatform,
      updatedAt: activeEditBriefState?.updatedAt ?? localProjectHandoff?.updatedAt ?? editAuthorityCreatedAt,
      workspaceId: projectPersistenceScope.workspaceId,
    }), [
      activeEditBriefState,
      aspectRatio,
      aspectRatioConfirmed,
      backendLocalEditBrief,
      customInstructions,
      editAuthorityCreatedAt,
      editLevel,
      editorEditName,
      editorEditSessionId,
      editorOperationUserId,
      editorProjectId,
      editorProjectName,
      localProjectHandoff?.updatedAt,
      projectPersistenceScope.workspaceId,
      sourceMediaAssets,
      targetPlatform,
    ],
  )

  useEffect(() => {
    if (searchParams.get('view') !== 'brief' || !footagePrepResult) return
    const openBriefTimer = window.setTimeout(() => {
      setEditBriefOpenRequestId((current) => current + 1)
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('view')
      setSearchParams(nextSearchParams, { replace: true })
    }, 0)

    return () => window.clearTimeout(openBriefTimer)
  }, [footagePrepResult, searchParams, setSearchParams])
  const privateFinalQaSummary = privateFinalQaSummaryText(privateInternalTestRun?.professionalEditQaSummary)
  const privateReviewPreparationSummaries = useMemo(
    () => createProfessionalPreparationDisplayItems(
      privateInternalTestRun?.editDecisionManifestVerification?.approvedEditContext.professionalSkillTrace?.backendIntents,
      4,
    ),
    [privateInternalTestRun?.editDecisionManifestVerification?.approvedEditContext.professionalSkillTrace?.backendIntents],
  )
  const legacyPreviewJob = useMemo(() => {
    if (!previewReady || contextMockPreview?.payload?.previewJob) {
      return null
    }

    return completeMockPreviewJob(createMockPreviewJob({
      projectId: editorProjectId,
      workspaceId: projectPersistenceScope.workspaceId,
      userId: editorOperationUserId,
      planningContextId: contextAwarePlanResult?.planningContext.id,
      creditEstimateId: `${editorProjectId}-legacy-credit-estimate`,
      approvalId: `${editorProjectId}-legacy-generation-approval`,
    }))
  }, [
    contextAwarePlanResult?.planningContext.id,
    contextMockPreview?.payload?.previewJob,
    editorOperationUserId,
    editorProjectId,
    previewReady,
    projectPersistenceScope.workspaceId,
  ])
  const editMap = useEditMap({
    previewJob: contextMockPreview?.payload?.previewJob ?? legacyPreviewJob,
    planningContext: contextMockPreview?.payload?.planningContext ?? contextAwarePlanResult?.planningContext ?? null,
    professionalIntegrationState: contextMockPreview?.payload?.professionalIntegrationState ?? null,
    professionalQaState: contextMockPreview?.payload?.professionalQaState ?? null,
    editCuesState: contextMockPreview?.payload?.editCuesState ?? null,
    sourceLibraryState: contextMockPreview?.payload?.sourceLibraryState ?? null,
    cleanAssembly: contextMockPreview?.payload?.cleanAssembly ?? footagePrepResult?.cleanAssembly ?? null,
  })
  const revisionWorkflow = useRevisionWorkflow({
    projectId: editMap.editMapState.projectId,
    workspaceId: editMap.editMapState.workspaceId,
    userId: editMap.editMapState.userId,
    editMapState: editMap.editMapState,
    sourcePreviewId: contextMockPreview?.previewId ?? contextMockPreview?.payload?.previewJob?.previewId ?? legacyPreviewJob?.previewId,
    sourcePreviewVersion: 1,
    sourceEditDocumentId: editMap.editDocument?.id,
    sourceEditVersion: editMap.editDocument?.version,
    enabled: Boolean(editMap.editDocument),
  })
  const exportWorkflow = useExportWorkflow({
    projectId: editMap.editMapState.projectId,
    workspaceId: editMap.editMapState.workspaceId,
    userId: editMap.editMapState.userId,
    sourcePreviewId: revisionWorkflow.revisionWorkflowState.latestPreviewId ??
      contextMockPreview?.previewId ??
      contextMockPreview?.payload?.previewJob?.previewId ??
      legacyPreviewJob?.previewId,
    sourcePreviewVersion: revisionWorkflow.revisionWorkflowState.latestPreviewVersion ?? 1,
    sourceEditDocumentId: revisionWorkflow.revisionWorkflowState.latestEditDocumentId ?? editMap.editDocument?.id,
    sourceEditVersion: revisionWorkflow.revisionWorkflowState.latestEditVersion ?? editMap.editDocument?.version,
    generationReadinessState: contextMockPreview?.payload?.generationReadinessState ?? null,
    professionalQaState: contextMockPreview?.payload?.professionalQaState ?? null,
    editMapState: editMap.editMapState,
    revisionWorkflowState: revisionWorkflow.revisionWorkflowState,
    enabled: Boolean(editMap.editDocument),
  })
  const canRunRevisionPrivateReview =
    (privateInternalReviewDecision === 'changes_requested' || localProjectHandoff?.stage === 'revision_preview_ready') &&
    (
      revisionWorkflow.activeRevisionRequest?.status === 'preview_ready' ||
      localProjectHandoff?.stage === 'revision_preview_ready'
    )
  const canResumePrivateInternalTestRun =
    approved &&
    Boolean(approvedSnapshot) &&
    localProjectHandoff?.stage === 'plan_approved' &&
    !privateInternalTestRun &&
    !privateInternalTestRunRunning

  useEffect(() => {
    if (!pendingPrivateReviewRevisionOperationId || privateInternalRevisionRequestId || !editMap.editDocument) {
      return
    }

    const operation = editMap.operations.find((candidate) => candidate.id === pendingPrivateReviewRevisionOperationId)
    if (!operation) return

    const revisionRequestTimer = window.setTimeout(() => {
      const revisionRequest = revisionWorkflow.createRevisionFromOperations([operation])
      if (!revisionRequest) return

      setPrivateInternalRevisionRequestId(revisionRequest.id)
      setPendingPrivateReviewRevisionOperationId(null)
      const existingHandoff = getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: 'revision_requested',
        privateReview: {
          byteSize: existingHandoff?.privateReview?.byteSize,
          manifestVerified: true,
          reviewDecision: 'changes_requested',
          serverReviewId: existingHandoff?.privateReview?.serverReviewId,
          serverReviewStatus: existingHandoff?.privateReview?.serverReviewStatus,
          serverNextRequiredGate: existingHandoff?.privateReview?.serverNextRequiredGate,
          reviewNote: existingHandoff?.privateReview?.reviewNote ?? privateInternalReviewNote.trim(),
          revisionOperationId: operation.id,
          revisionRequestId: revisionRequest.id,
          nextRequiredGate: 'revision_request_review',
          updatedAt: new Date().toISOString(),
        },
      })
      showRevisionMessage('Revision request created from the review note. Review it in the edit workspace before any next preview pass.')
    }, 0)

    return () => window.clearTimeout(revisionRequestTimer)
  }, [
    editMap.editDocument,
    editMap.operations,
    editorEditSessionId,
    editorProjectId,
    pendingPrivateReviewRevisionOperationId,
    privateInternalRevisionRequestId,
    privateInternalReviewNote,
    revisionWorkflow,
    showRevisionMessage,
    getLocalInternalEditHandoff,
    updateLocalInternalEditHandoff,
  ])

  useEffect(() => {
    const request = revisionWorkflow.activeRevisionRequest
    if (
      !request ||
      !privateInternalRevisionRequestId ||
      request.id !== privateInternalRevisionRequestId ||
      request.status !== 'preview_ready' ||
      recordedRevisionPreviewRequestId === request.id
    ) {
      return
    }

    const revisionPreviewTimer = window.setTimeout(() => {
      const job = revisionWorkflow.jobs.find((candidate) => candidate.id === request.jobId)
      const existingHandoff = getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: 'revision_preview_ready',
        privateReview: {
          byteSize: existingHandoff?.privateReview?.byteSize,
          manifestVerified: true,
          reviewDecision: 'changes_requested',
          serverReviewId: existingHandoff?.privateReview?.serverReviewId,
          serverReviewStatus: existingHandoff?.privateReview?.serverReviewStatus,
          serverNextRequiredGate: existingHandoff?.privateReview?.serverNextRequiredGate,
          reviewNote: existingHandoff?.privateReview?.reviewNote ?? privateInternalReviewNote.trim(),
          revisionOperationId: existingHandoff?.privateReview?.revisionOperationId,
          revisionRequestId: request.id,
          revisionPreviewId: request.targetPreviewId,
          revisionPreviewVersion: request.targetPreviewVersion,
          revisionJobId: job?.id,
          nextRequiredGate: 'private_review_after_revision',
          updatedAt: new Date().toISOString(),
        },
      })
      setRecordedRevisionPreviewRequestId(request.id)
      showRevisionMessage('Revision review is ready for another review pass. Public delivery remains gated.')
    }, 0)

    return () => window.clearTimeout(revisionPreviewTimer)
  }, [
    editorEditSessionId,
    editorProjectId,
    privateInternalRevisionRequestId,
    privateInternalReviewNote,
    recordedRevisionPreviewRequestId,
    revisionWorkflow.activeRevisionRequest,
    revisionWorkflow.jobs,
    showRevisionMessage,
    getLocalInternalEditHandoff,
    updateLocalInternalEditHandoff,
  ])

  const plannerInput = useMemo(
    () => ({
      ...defaultChatPlannerInput,
      projectName: editorProjectName,
      aspectRatio,
      aspectRatioConfirmed,
      aspectRatioSource,
      clips,
      creditPreference,
      customInstructions,
      userInstructionHistory,
      preferenceDefaultsApplied: restoredSetup?.preferenceDefaultsApplied ?? currentEditPreferenceBaseline.provenance === 'saved_edit_preferences',
      preferenceSnapshotId: restoredSetup?.preferenceSnapshotId ?? currentEditPreferenceBaseline.snapshotId,
      preferenceSnapshotAppliedAt: restoredSetup?.preferenceSnapshotAppliedAt ?? currentEditPreferenceBaseline.capturedAt,
      preferencePersistenceSource: currentEditPreferenceBaseline.persistenceSource,
      currentEditPreferenceOverrideKeys,
      currentEditPreferenceRevision,
      cleanupPreference,
      cleanupPreferenceConfirmed,
      editingCategory,
      editLevel,
      frameTemplateType,
      moodStyle,
      referenceUrl: referenceAttached ? referenceUrl : '',
      sourceOrderConfirmed,
      sourceSequenceMode,
      targetPlatform,
      visualPreference,
      workflowType,
    }),
    [
      aspectRatio,
      aspectRatioConfirmed,
      aspectRatioSource,
      clips,
      creditPreference,
      customInstructions,
      userInstructionHistory,
      cleanupPreference,
      cleanupPreferenceConfirmed,
      editingCategory,
      editLevel,
      frameTemplateType,
      moodStyle,
      referenceAttached,
      referenceUrl,
      sourceOrderConfirmed,
      sourceSequenceMode,
      targetPlatform,
      visualPreference,
      workflowType,
      editorProjectName,
      restoredSetup?.preferenceDefaultsApplied,
      restoredSetup?.preferenceSnapshotAppliedAt,
      restoredSetup?.preferenceSnapshotId,
      currentEditPreferenceBaseline.persistenceSource,
      currentEditPreferenceBaseline.provenance,
      currentEditPreferenceBaseline.snapshotId,
      currentEditPreferenceBaseline.capturedAt,
      currentEditPreferenceOverrideKeys,
      currentEditPreferenceRevision,
    ],
  )

  const basePlan = useMemo(() => createGuidedMockEditPlan(plannerInput), [plannerInput])
  const plan = contextAwarePlanResult?.editPlan ?? basePlan
  const liveApprovalPlanningFingerprint = useMemo(
    () => contextAwarePlanResult
      ? createCompiledPlanningFingerprint(
          createContextAwarePlannerInput(contextAwarePlanResult.planningContext, plannerInput),
        )
      : null,
    [contextAwarePlanResult, plannerInput],
  )
  const liveApprovalPlanningFingerprintRef = useRef(liveApprovalPlanningFingerprint)
  useLayoutEffect(() => {
    liveApprovalPlanningFingerprintRef.current = liveApprovalPlanningFingerprint
  }, [liveApprovalPlanningFingerprint])
  const validationReport = useMemo(() => createGuidedPlanValidationReport({ plan, scenarioId: selectedScenarioId }), [plan, selectedScenarioId])
  const regressionReport = guidedPlannerRegressionPlaceholder
  const planningCards = useMemo(
    () =>
      getChatPlanningCards({
        approved,
        aspectRatioConfirmed,
        clipsAttached,
        editLevelConfirmed,
        intentApproved,
        plan,
        previewReady: effectivePreviewReady,
        regressionReport,
        selectedScenarioId,
        clipCount: clips.length,
        sourceOrderConfirmed,
        validationReport,
        visualPreferenceConfirmed,
      }),
    [
      approved,
      aspectRatioConfirmed,
      clipsAttached,
      editLevelConfirmed,
      intentApproved,
      plan,
      effectivePreviewReady,
      regressionReport,
      selectedScenarioId,
      clips.length,
      sourceOrderConfirmed,
      validationReport,
      visualPreferenceConfirmed,
    ],
  )
  const phaseSummaries = useMemo(() => getChatPlanningPhaseSummaries(planningCards), [planningCards])
  const cardById = useMemo(
    () => Object.fromEntries(planningCards.map((card) => [card.id, card])),
    [planningCards],
  )
  const planEditLevel = plan.compiledIntent?.resolvedSettings.editLevel ?? editLevel
  const categoryLabel = getCategoryLabel(editingCategory)
  const confirmedMaterialPlanningConflicts = findConfirmedMaterialPlanningConflicts(plannerInput, plan.compiledIntent)
  const cleanupReady = cleanupPreferenceConfirmed && plan.sourceCleanupPlan?.status === 'confirmed'
  const trimReviewReady = Boolean(plan.trimReviewPlan && !plan.trimReviewPlan.approvalBlocked)
  const setupReady = sourceOrderConfirmed && aspectRatioConfirmed && cleanupReady && trimReviewReady && editLevelConfirmed && visualPreferenceConfirmed && confirmedMaterialPlanningConflicts.length === 0
  const cleanEditorStage: CleanEditorStage = effectivePreviewReady
    ? 'private_review'
    : approved
      ? 'processing'
      : contextAwarePlanResult
        ? 'plan_review'
        : !sourceOrderConfirmed
          ? 'source'
          : !aspectRatioConfirmed
            ? 'frame'
            : !cleanupReady
              ? 'cleanup'
              : !trimReviewReady
                ? 'source_review'
                : !editLevelConfirmed
                  ? 'edit_level'
                  : !visualPreferenceConfirmed
                    ? 'visual_direction'
                    : !referenceAttached && !referenceSkipped
                      ? 'reference'
                      : 'planning'
  const sourceUploadComplete = durableUploadedPrivateSourceAssets(sourceMediaAssets).length > 0
  const editChatLockedUntilUpload = isProjectWorkspace && !sourceUploadComplete
  const privateUploadedSourcesReadyForPrep = uploadedPrivateSourceAssetsCoverClips(sourceMediaAssets, clips)
  const footagePrepBlockedReason = !clips.length
    ? 'Upload at least one source file before source prep.'
    : !sourceOrderConfirmed
      ? 'Confirm the source order before source prep.'
      : !privateUploadedSourcesReadyForPrep
        ? 'Upload private source files for every source clip before source prep. Placeholder or stale source records cannot become edit context.'
        : ''
  const canRunFootagePrep = sourceOrderConfirmed && privateUploadedSourcesReadyForPrep
  const privateInternalReviewRequiredForPreview =
    approved &&
    Boolean(approvedSnapshot) &&
    privateUploadedSourcesReadyForPrep &&
    !contextMockPreview
  const missingContextPlanSetupItems = [
    !aspectRatioConfirmed && 'output frame',
    !cleanupReady && 'source cleanup preference',
    !trimReviewReady && 'trim review',
    !editLevelConfirmed && 'edit level',
    !visualPreferenceConfirmed && 'visual preference',
    confirmedMaterialPlanningConflicts.length > 0 && 'chat changes that need setup reconfirmation',
  ].filter((item): item is string => Boolean(item))
  const canCreateContextAwarePlan = setupReady
  const contextPlanBlockedReason = missingContextPlanSetupItems.length > 0
    ? `Finish ${missingContextPlanSetupItems.join(', ')} before creating the edit plan from this footage.`
    : ''
  const planningContextApprovalBlockedReason = contextAwarePlanResult?.planningContext.status === 'blocked'
    ? 'Resolve blocking Planning Context issues before approving credits or starting the review edit.'
    : ''
  const planningContextReadyForApproval = Boolean(contextAwarePlanResult) && !planningContextApprovalBlockedReason
  const canonicalPresentedPlan = canonicalPlanningPublication.result?.presentedPlan
  const canonicalApprovalAuthorityReady = canonicalPlanApprovalReadyForPresentedPlan({
    backendConnected: canonicalPlanningBackendConnected,
    journey: canonicalJourneyValue,
    publicationStatus: canonicalPlanningPublication.result?.status,
    presentedPlan: canonicalPresentedPlan,
    visibleMaximumCredits: plan.creditEstimate.total,
  })
  const approvalRecordedForPresentation = approved || canonicalApprovalRecorded
  const canonicalApprovalBlockedLabel = canonicalApprovalRecorded
    ? 'Plan approved'
    : canonicalPlanningPublication.saving
      ? 'Saving exact plan…'
      : canonicalJourney.loading || canonicalJourney.refreshing
        ? 'Checking saved plan…'
        : canonicalPlanningPublication.result?.status === 'plan_published_waiting_for_approval'
          ? 'Checking approval…'
          : canonicalPlanningPublication.result?.status === 'handoff_saved_waiting_for_compiler'
            ? 'Approval not ready'
            : canonicalPlanningPublication.result?.status === 'candidate_saved_pending_internal_publication'
              ? 'Preparing saved plan…'
              : canonicalPlanningPublication.result
                ? 'Refresh saved plan'
                : 'Waiting for saved plan'
  const editBriefReadyForPlanning = editBriefGate.status === 'ready' && editBriefGate.ready
  const approvalErrorMessage = runtimeMessages.find((message) => message.type === 'assistant_error')?.content ?? ''
  const editWorkspaceBlockedReason = privateInternalTestRunError || privateInternalDownloadError || planningContextApprovalBlockedReason || approvalErrorMessage
  const editWorkspaceStage: EditWorkspaceStage = editWorkspaceBlockedReason
    ? 'blocked'
    : isProjectWorkspace && !sourceUploadComplete
      ? 'upload_required'
      : privateInternalReviewDecision === 'changes_requested' || localProjectHandoff?.stage === 'revision_requested'
        ? 'revision_requested'
        : effectivePreviewReady
          ? 'review_ready'
          : approved || privateInternalTestRunRunning
            ? 'approved_review_building'
            : contextAwarePlanResult
              ? 'plan_review'
              : 'planning_setup'
  const editWorkspaceCompletedSteps: EditWorkspaceCompletedStep[] = [
    sourceUploadComplete && { id: 'source-upload', label: 'Source video uploaded' },
    sourceOrderConfirmed && { id: 'source-order', label: 'Source order confirmed' },
    aspectRatioConfirmed && { id: 'output-frame', label: 'Output frame confirmed' },
    cleanupReady && { id: 'cleanup', label: 'Cleanup preference confirmed' },
    editLevelConfirmed && { id: 'edit-level', label: 'Edit level confirmed' },
    visualPreferenceConfirmed && { id: 'visual-direction', label: 'Visual direction confirmed' },
    footagePrepResult && { id: 'source-prep', label: 'Source video prepared' },
    editBriefReadyForPlanning && { id: 'edit-brief', label: 'Edit Brief ready' },
    contextAwarePlanResult && { id: 'edit-plan', label: 'Edit plan created' },
    approved && { id: 'approval', label: 'Plan and credits approved' },
    effectivePreviewReady && { id: 'private-review', label: 'Private review ready' },
  ].filter((step): step is EditWorkspaceCompletedStep => Boolean(step))
  const composerHardBlocked = approvalChecking || (editWorkspaceStage === 'blocked' && Boolean(editWorkspaceBlockedReason))
  const advancedVisibleCards = useMemo(
    () =>
      Object.fromEntries(
        advancedPlanningCardIds.map((id) => {
          const card = cardById[id]
          const visibleInGuidedMode = Boolean(
            card && (card.status === 'warning' || card.status === 'blocking' || card.requiredBeforeApproval),
          )

          return [id, displayMode === 'guided' ? visibleInGuidedMode : shouldShowCard(card, displayMode)]
        }),
      ),
    [cardById, displayMode],
  )
  const shouldShowAdvancedPlanningDetails = setupReady && Object.values(advancedVisibleCards).some(Boolean)

  const showCard = useCallback((id: string) => shouldShowCard(cardById[id], displayMode), [cardById, displayMode])

  useEffect(() => {
    if (!progressStarted || previewReady) {
      return
    }

    progressTimerRef.current = window.setTimeout(() => {
      setProgressIndex((current) => {
        if (current >= progressSteps.length - 1) {
          if (privateInternalReviewRequiredForPreview && !privateInternalTestRun?.privateInternalDownloadPath) {
            return current
          }
          setPreviewReady(true)
          return current
        }

        return current + 1
      })
    }, 520)

    return () => {
      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current)
      }
    }
  }, [
    privateInternalReviewRequiredForPreview,
    privateInternalTestRun?.privateInternalDownloadPath,
    progressIndex,
    progressStarted,
    previewReady,
  ])

  useEffect(() => {
    if (!timelineOpen) {
      return
    }

    const scrollTimer = window.setTimeout(() => {
      timelineLayerRef.current?.scrollIntoView({ block: 'start', inline: 'nearest' })
    }, 0)

    return () => window.clearTimeout(scrollTimer)
  }, [timelineOpen])

  useEffect(() => {
    const objectUrl = privateInternalDownloadFile?.objectUrl
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [privateInternalDownloadFile?.objectUrl])

  useEffect(() => {
    const objectUrl = privateInternalManifestFile?.objectUrl
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [privateInternalManifestFile?.objectUrl])

  function clearRuntimeMessages() {
    setRuntimeMessages([])
  }

  function clearApprovalErrors() {
    setRuntimeMessages((messages) => messages.filter((message) => message.type !== 'assistant_error'))
  }

  function showApprovalError(content: string) {
    replaceRuntimeStatusMessage(createAssistantErrorMessage(content, {
      id: `approval-error-${Date.now()}`,
      actionIds: ['approve_plan'],
      actions: [{ id: 'approve_plan', label: 'Review approval requirements', variant: 'secondary' }],
    }))
  }

  const resetPlanProgress = useCallback(() => {
    resetCanonicalPlanningPublication()
    setIntentApproved(false)
    setApproved(false)
    setApprovedSnapshot(null)
    setExecutionRehearsal(null)
    setPrivateInternalTestRun(null)
    setPrivateInternalDownloadFile(null)
    setPrivateInternalManifestFile(null)
    setPrivateInternalReviewVideoMetadata(null)
    setPrivateInternalDownloadLoading(false)
    setPrivateInternalDownloadError('')
    setPrivateInternalTestRunRunning(false)
    setPrivateInternalTestRunError('')
    setPrivateInternalReviewDecision(null)
    setPrivateInternalReviewNote('')
    setPrivateInternalReviewRecording(false)
    setPendingPrivateReviewRevisionOperationId(null)
    setPrivateInternalRevisionRequestId(null)
    setRecordedRevisionPreviewRequestId(null)
    setApprovalChecking(false)
    setContextAwarePlanResult(null)
    setContextMockPreview(null)
    setRuntimeMessages((messages) => messages.filter((message) => message.type !== 'assistant_error'))
    setShowEditMap(false)
    setProgressStarted(false)
    setPreviewReady(false)
    setProgressIndex(0)
    setShowMusicPlan(false)
    setShowSFXPlan(false)
  }, [resetCanonicalPlanningPublication, setApprovalChecking])

  const applyScenarioState = useCallback((scenario: typeof defaultDemoScenario) => {
    if (isProjectWorkspace) return
    const nextScenarioClips = scenario.clips
    setSelectedScenario(scenario)
    setSelectedScenarioId(scenario.id)
    setEditingCategory(scenario.editingCategory)
    setEditLevel(scenario.editLevel)
    setTargetPlatform(scenario.targetPlatform)
    setAspectRatio(scenario.aspectRatio)
    setFrameTemplateType(scenario.frameTemplateType)
    setMoodStyle(scenario.moodStyle)
    setVisualPreference(scenario.visualPreference)
    setCreditPreference(scenario.creditPreference)
    setWorkflowType(scenario.workflowType)
    setReferenceAttached(scenario.referenceAttached)
    setReferenceUrl(scenario.referenceUrl)
    setReferenceSkipped(false)
    setReferenceFocusSelections(DEFAULT_REFERENCE_FOCUS_SELECTIONS)
    setCustomInstructions(scenario.customInstructions)
    setUserInstructionHistory(normalizeOrderedUserInstructions(undefined, scenario.customInstructions))
    setComposerValue(scenario.customInstructions)
    setClips(nextScenarioClips)
    setSourceMediaAssets(createExecutionSourceMediaAssetsFromClips(nextScenarioClips, editorProjectId))
    setSourceSequenceMode(inferSourceSequenceMode(nextScenarioClips, scenario.customInstructions))
    setClipsAttached(nextScenarioClips.length > 0)
    setSourceOrderConfirmed(false)
    setCleanupPreference(undefined)
    setCleanupPreferenceConfirmed(false)
    setAspectRatioConfirmed(false)
    setAspectRatioSource('demo_scenario')
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    clearRuntimeMessages()
    resetFootagePrep()
    resetPlanProgress()
  }, [editorProjectId, isProjectWorkspace, resetFootagePrep, resetPlanProgress])

  useEffect(() => {
    if (isProjectWorkspace || hasDurableLocalEditState) {
      return
    }

    if (selectedScenario.id === selectedScenarioId) {
      return
    }

    let active = true

    loadDemoScenario(selectedScenarioId)
      .then((scenario) => {
        if (!active) return
        applyScenarioState(scenario)
      })
      .catch(() => {
        if (!active) return
        setScenarioLoadError('Could not load that internal scenario. The current guided plan is still available.')
      })
      .finally(() => {
        if (!active) return
        setSelectedScenarioLoading(false)
      })

    return () => {
      active = false
    }
  }, [applyScenarioState, hasDurableLocalEditState, isProjectWorkspace, selectedScenario.id, selectedScenarioId])

  function createCurrentEditSetupSnapshot(
    overrides: Partial<LocalInternalEditSetupSnapshot> = {},
  ): LocalInternalEditSetupSnapshot {
    const nextPreferenceBaseline = overrides.preferenceBaseline ?? currentEditPreferenceBaseline
    const nextPreferenceValues: LocalInternalEditPreferenceValues = {
      editLevel: overrides.editLevel ?? editLevel,
      workflowType: overrides.workflowType ?? workflowType,
      cleanupPreference: overrides.cleanupPreference ?? cleanupPreference ?? nextPreferenceBaseline.cleanupPreference,
      visualPreference: overrides.visualPreference ?? visualPreference,
      moodStyle: overrides.moodStyle ?? moodStyle,
      creditPreference: overrides.creditPreference ?? creditPreference,
      targetPlatform: overrides.targetPlatform ?? targetPlatform,
    }

    return {
      customInstructions,
      userInstructionHistory,
      sourceSequenceMode,
      sourceOrderConfirmed,
      cleanupPreference,
      cleanupPreferenceConfirmed,
      aspectRatio,
      aspectRatioConfirmed,
      aspectRatioSource,
      editLevel,
      editLevelConfirmed,
      visualPreference,
      visualPreferenceConfirmed,
      targetPlatform,
      frameTemplateType,
      workflowType,
      moodStyle,
      creditPreference,
      preferenceDefaultsApplied: restoredSetup?.preferenceDefaultsApplied ?? nextPreferenceBaseline.provenance === 'saved_edit_preferences',
      preferenceSnapshotId: restoredSetup?.preferenceSnapshotId ?? nextPreferenceBaseline.snapshotId,
      preferenceSnapshotAppliedAt: restoredSetup?.preferenceSnapshotAppliedAt ?? nextPreferenceBaseline.capturedAt,
      preferencePersistenceSource: nextPreferenceBaseline.persistenceSource,
      preferenceBaseline: nextPreferenceBaseline,
      preferenceOverrideKeys: getCurrentEditPreferenceOverrideKeys(nextPreferenceValues, nextPreferenceBaseline),
      preferenceRevision: currentEditPreferenceRevision,
      preferenceUpdatedAt: currentEditPreferenceUpdatedAt,
      referenceAttached,
      referenceUrl,
      referenceSkipped,
      referenceFocusSelections,
      ...overrides,
    }
  }

  function persistCurrentEditSetupAfterPlanInvalidation(
    overrides: Partial<LocalInternalEditSetupSnapshot> = {},
    options: {
      revisionPlanContext?: LocalInternalProjectHandoff['revisionPlanContext']
      syncBackend?: boolean
    } = {},
  ) {
    resetPlanProgress()
    const durableSourceMediaAssets = durableUploadedPrivateSourceAssets(sourceMediaAssets)
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: durableSourceMediaAssets.length > 0 ? 'source_uploaded' : 'created',
      sourceFileCount: durableSourceMediaAssets.length > 0 ? durableSourceMediaAssets.length : clips.length,
      setup: createCurrentEditSetupSnapshot(overrides),
      sourceMediaAssets: durableSourceMediaAssets,
      revisionPlanContext: options.revisionPlanContext,
    }, { syncBackend: options.syncBackend })
    if (options.revisionPlanContext) {
      setActiveRevisionPlanContext(options.revisionPlanContext)
    }
  }

  function inferNextSourceSequenceMode(nextClips: ClipSource[], instructions = customInstructions) {
    return sourceSequenceMode === 'unordered_clips_needs_ai_help'
      ? sourceSequenceMode
      : inferSourceSequenceMode(nextClips, instructions)
  }

  const handleEditBriefStatusChange = useCallback((status: EditBriefStatus | null, ready: boolean) => {
    setEditBriefGate((current) =>
      current.status === status && current.ready === ready ? current : { ready, status },
    )
  }, [])

  const synchronizeReadyEditBriefAuthority = useCallback(async (state: EditBriefState) => {
    const epoch = ++editBriefAuthorityEpochRef.current
    setBackendLocalEditBrief(undefined)

    if (!editBriefBackendConfig.available || !editBriefBackendConfig.apiBaseUrl) {
      showRevisionMessage('The Edit Brief is ready locally, but exact-video study remains unavailable until the private backend can verify it.')
      return
    }
    const sourceResolution = resolveCurrentEditReferenceTargetSource(sourceMediaAssets)
    if (!sourceResolution.ok) {
      showRevisionMessage(`${sourceResolution.message} The Brief remains saved locally, and no study or editing started.`)
      return
    }

    try {
      const exactEditHandoff = getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)
      if (!exactEditHandoff) {
        throw new Error('The exact named edit could not be matched before Brief verification.')
      }
      const persistedEditState = await persistLocalInternalProjectHandoffToBackend(exactEditHandoff)
      if (!persistedEditState.ok || !persistedEditState.persisted) {
        throw new Error(
          persistedEditState.errorMessage
          ?? 'The exact named edit could not be verified by the private backend.',
        )
      }
      if (epoch !== editBriefAuthorityEpochRef.current) return

      const result = await saveProjectEditBriefBackendLocal({
        apiBaseUrl: editBriefBackendConfig.apiBaseUrl,
        briefText: createCurrentEditReferenceBackendBriefText(state),
        editSessionId: editorEditSessionId,
        projectId: editorProjectId,
        sourceMediaAssetId: sourceResolution.source.mediaAssetId,
        sourceStorageObjectRecordId: sourceResolution.source.storageObjectRecordId,
        workspaceId: projectPersistenceScope.workspaceId,
      })
      const latestEditBriefState = latestEditBriefStateRef.current
      if (
        epoch !== editBriefAuthorityEpochRef.current
        || !latestEditBriefState
        || latestEditBriefState.updatedAt !== state.updatedAt
        || latestEditBriefState.editBrief.status !== 'ready'
      ) return
      setBackendLocalEditBrief(result.readback)
      showRevisionMessage('Edit Brief verified for this exact uploaded video. An approved Edit Reference can now study this video before Apply.')
    } catch (error) {
      if (epoch !== editBriefAuthorityEpochRef.current) return
      setBackendLocalEditBrief(undefined)
      showRevisionMessage(`${error instanceof Error ? error.message : 'The Edit Brief could not be verified.'} Your Brief remains saved locally; no study, credits, or editing started.`)
    }
  }, [
    editBriefBackendConfig.apiBaseUrl,
    editBriefBackendConfig.available,
    editorEditSessionId,
    editorProjectId,
    getLocalInternalEditHandoff,
    persistLocalInternalProjectHandoffToBackend,
    projectPersistenceScope.workspaceId,
    showRevisionMessage,
    sourceMediaAssets,
  ])

  const handleEditBriefStateChange = useCallback((state: EditBriefState) => {
    if (!isProjectWorkspace) return
    latestEditBriefStateRef.current = state
    setActiveEditBriefState(state)
    if (state.editBrief.status !== 'ready') {
      editBriefAuthorityEpochRef.current += 1
      setBackendLocalEditBrief(undefined)
    }
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      editBriefState: state,
    })
    if (state.editBrief.status === 'ready') {
      void synchronizeReadyEditBriefAuthority(state)
    }
  }, [
    editorEditSessionId,
    editorProjectId,
    isProjectWorkspace,
    synchronizeReadyEditBriefAuthority,
    updateLocalInternalEditHandoff,
  ])

  function scrollToEditorTarget(selectors: string[]) {
    const target = selectors
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .find((element): element is HTMLElement => Boolean(element))
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  }

  function resetAfterSourceChange() {
    editBriefAuthorityEpochRef.current += 1
    setBackendLocalEditBrief(undefined)
    setSourceOrderConfirmed(false)
    setCleanupPreferenceConfirmed(false)
    setEditBriefGate({ ready: false, status: null })
    resetFootagePrep()
    resetPlanProgress()
  }

  function handleScenarioSelect(scenarioId: string) {
    if (scenarioId === selectedScenario.id) {
      return
    }

    setScenarioLoadError('')
    setSelectedScenarioLoading(true)
    setSelectedScenarioId(scenarioId)
  }

  function handleRunFootagePrep() {
    if (!canRunFootagePrep) {
      showRevisionMessage(footagePrepBlockedReason || 'Upload and confirm private source files before source prep.')
      return
    }

    const sourceBoundPrepInput = buildFootagePrepInputFromEditorSources({
      clips,
      projectId: editorProjectId,
      sourceMediaAssets,
      userId: editorOperationUserId,
      workspaceId: projectPersistenceScope.workspaceId,
    })
    const prepResult = runFootagePrep(sourceBoundPrepInput)
    clearRuntimeMessages()
    resetPlanProgress()
    showRevisionMessage(
      `Source prep is ready for ${prepResult.footagePrepSession.sourceMediaIds.length} uploaded source file${prepResult.footagePrepSession.sourceMediaIds.length === 1 ? '' : 's'} in this edit.`,
    )
  }

  function handleContinueAfterFootagePrep() {
    showRevisionMessage('Clean assembly is ready. Choose the frame and planning settings next; credits wait for plan approval.')
  }

  function handleAddEditBriefAfterFootagePrep() {
    showRevisionMessage('Edit Brief is open. Add any optional goal, style, pacing, caption, music, or asset direction before planning.')
  }

  function handleOpenEditBriefFromHeader() {
    if (!footagePrepResult) return
    if (activeWorkspaceView === 'preferences' && currentEditPreferenceDraftDirty) {
      setPendingPreferenceDestination('brief')
      return
    }
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('view')
    setSearchParams(nextSearchParams)
    setEditBriefOpenRequestId((current) => current + 1)
  }

  function handleOpenChatWorkspace() {
    if (activeWorkspaceView === 'preferences' && currentEditPreferenceDraftDirty) {
      setPendingPreferenceDestination('chat')
      return
    }
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('view')
    setSearchParams(nextSearchParams)
  }

  function handleOpenCurrentEditPreferences() {
    if (!isProjectWorkspace) return
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('view', 'preferences')
    setSearchParams(nextSearchParams)
  }

  function handleCancelCurrentEditPreferenceLeave() {
    setPendingPreferenceDestination(null)
  }

  function handleDiscardCurrentEditPreferenceDraftAndLeave() {
    const destination = pendingPreferenceDestination ?? 'chat'
    setCurrentEditPreferenceDraftDirty(false)
    setPendingPreferenceDestination(null)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('view')
    setSearchParams(nextSearchParams)
    if (destination === 'brief') {
      setEditBriefOpenRequestId((current) => current + 1)
    }
  }

  function finalizeExactEditPreferenceApply(
    operation: EditReferenceProductionExactEditApplyOperation,
    receipt: EditReferenceProductionExactEditApplyApiReceipt,
  ): void {
    const next = {
      ...operation.authority.values,
      ...operation.preferencePatch,
    } as LocalInternalEditPreferenceValues
    const changedFields = receipt.changedPreferenceFields
    const nextEditLevelConfirmed = changedFields.includes('editLevel')
      ? true
      : editLevelConfirmed
    const nextCleanupPreferenceConfirmed = changedFields.includes('cleanupPreference')
      ? true
      : cleanupPreferenceConfirmed
    const nextVisualPreferenceConfirmed = changedFields.includes('visualPreference')
      ? true
      : visualPreferenceConfirmed
    const requiresSourcePreparation = receipt.sourcePreparationDisposition === 'requires_repreparation'
    const requiresFrameConfirmation = receipt.outputFrameDisposition === 'requires_reconfirmation'
    const hadDraftPlan = currentEditDraftPlanExists

    persistCurrentEditSetupAfterPlanInvalidation({
      ...next,
      editLevelConfirmed: nextEditLevelConfirmed,
      cleanupPreferenceConfirmed: nextCleanupPreferenceConfirmed,
      visualPreferenceConfirmed: nextVisualPreferenceConfirmed,
      aspectRatioConfirmed: requiresFrameConfirmation ? false : aspectRatioConfirmed,
      aspectRatioSource: requiresFrameConfirmation ? 'unknown' : aspectRatioSource,
      preferenceBaseline: currentEditPreferenceBaseline,
      preferenceOverrideKeys: getCurrentEditPreferenceOverrideKeys(next, currentEditPreferenceBaseline),
      preferenceRevision: receipt.committedPreferenceRevision,
      preferenceUpdatedAt: receipt.committedAt,
    }, { syncBackend: false })

    setEditLevel(next.editLevel)
    setEditLevelConfirmed(nextEditLevelConfirmed)
    setWorkflowType(next.workflowType)
    setCleanupPreference(next.cleanupPreference)
    setCleanupPreferenceConfirmed(nextCleanupPreferenceConfirmed)
    setVisualPreference(next.visualPreference)
    setVisualPreferenceConfirmed(nextVisualPreferenceConfirmed)
    setMoodStyle(next.moodStyle)
    setCreditPreference(next.creditPreference)
    setTargetPlatform(next.targetPlatform)
    setCurrentEditPreferenceRevision(receipt.committedPreferenceRevision)
    setCurrentEditPreferenceUpdatedAt(receipt.committedAt)
    setCurrentEditPreferenceDraftDirty(false)
    setCurrentEditPreferenceApplyEpoch((value) => value + 1)

    if (requiresSourcePreparation) resetFootagePrep()
    if (requiresFrameConfirmation) {
      setAspectRatioConfirmed(false)
      setAspectRatioSource('unknown')
    }

    showRevisionMessage(
      hadDraftPlan
        ? 'Edit Preferences were committed together for this edit. The previous draft plan and estimate were cleared; create a fresh plan before approval. No credits or generation started.'
        : 'Edit Preferences were committed together for this edit. They will shape the next plan; no credits or generation started.',
    )
  }

  async function commitPendingExactEditPreferenceApply(
    pending: ExactEditPreferencePendingApply,
  ): Promise<CurrentEditPreferencesApplyResult> {
    const result = await applyExactEditPreferencesAndReference({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
      operation: pending.operation,
      idempotencyKey: pending.idempotencyKey,
    })
    if (!result.ok) {
      if (!result.retryable) {
        const cleared = clearExactEditPreferencePendingApply({
          scope: projectPersistenceScope,
          projectId: editorProjectId,
          editSessionId: editorEditSessionId,
          expectedIdempotencyKey: pending.idempotencyKey,
        })
        if (cleared) setPendingExactEditPreferenceApply(undefined)
      }
      return {
        ok: false,
        message: result.message,
      }
    }

    finalizeExactEditPreferenceApply(pending.operation, result.receipt)
    const cleared = clearExactEditPreferencePendingApply({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
      expectedIdempotencyKey: pending.idempotencyKey,
    })
    if (!cleared) {
      setPendingExactEditPreferenceApply(pending)
      return {
        ok: false,
        message: 'The change was committed, but its local confirmation could not be sealed. Retry the exact saved Apply before making another change.',
      }
    }

    setPendingExactEditPreferenceApply(undefined)
    return {
      ok: true,
      message: 'Edit Preferences were applied to this exact edit in one transaction.',
    }
  }

  async function handleRetryPendingExactEditPreferences(): Promise<CurrentEditPreferencesApplyResult> {
    const pending = pendingExactEditPreferenceApply ?? readExactEditPreferencePendingApply({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
    })
    if (!pending) {
      setPendingExactEditPreferenceApply(undefined)
      return {
        ok: false,
        message: 'There is no saved Apply operation to retry. Refresh the current Edit Preferences before changing them.',
      }
    }
    setPendingExactEditPreferenceApply(pending)
    return commitPendingExactEditPreferenceApply(pending)
  }

  async function handleApplyCurrentEditPreferences(
    request: CurrentEditPreferencesApplyRequest,
  ): Promise<CurrentEditPreferencesApplyResult> {
    const savedPending = pendingExactEditPreferenceApply ?? readExactEditPreferencePendingApply({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
    })
    if (savedPending) {
      setPendingExactEditPreferenceApply(savedPending)
      return commitPendingExactEditPreferenceApply(savedPending)
    }
    if (currentEditPreferencesLocked || approvalCheckingRef.current) {
      return {
        ok: false,
        message: 'This edit is read only. Request the change through Chat and a fresh plan.',
      }
    }
    if (!hasProjectEditRoute || !canonicalPlanningBackendConnected) {
      return {
        ok: false,
        message: 'Current Edit Preferences require the reviewed private backend for this exact named edit.',
      }
    }

    const next = request.values
    const change = resolveCurrentEditPreferenceChange(
      currentEditPreferenceValues,
      next,
      currentEditPreferenceBaseline,
    )
    const referenceOperation = request.referenceDecision.operation
    const referenceChanged = referenceOperation !== 'keep'
    if (change.changedFields.length === 0 && !referenceChanged) {
      return { ok: false, message: 'There are no unapplied Edit Preference changes.' }
    }

    let selectedApplicationId: string | null = null
    let expectedPreparedApplication: { id: string; contentDigest: string } | undefined
    if (referenceOperation === 'remove') {
      if (request.referenceDecision.original.kind !== 'connected') {
        return { ok: false, message: 'The connected Edit Reference could not be verified for removal.' }
      }
      selectedApplicationId = request.referenceDecision.original.applicationId
    }
    if (referenceOperation === 'select' || referenceOperation === 'replace') {
      const authority = currentEditReferenceAuthorityResolution.ready
        ? currentEditReferenceAuthorityResolution.authority
        : undefined
      if (!authority) {
        return {
          ok: false,
          message: currentEditReferenceAuthorityResolution.ready
            ? 'The exact target-study authority is no longer available.'
            : currentEditReferenceAuthorityResolution.message,
        }
      }
      if (!request.targetStudy || !request.referenceDecision.draftReferenceId) {
        return {
          ok: false,
          message: 'Complete and verify the exact whole-video study before applying this Edit Reference.',
        }
      }
      const prepared = await preparePreferenceApplicationForProjectEditSession({
        applicationSource: 'session_panel',
        bundle: authority.bundle,
        currentUserInstruction: authority.currentUserInstruction,
        editReferenceClient: editReferenceApi,
        editReferenceId: request.referenceDecision.draftReferenceId,
        outputFrameConfirmed: true,
        projectPersistenceScope,
        targetUnderstandingPackage: request.targetStudy,
        workspaceId: projectPersistenceScope.workspaceId,
      })
      if (!prepared.ok) return { ok: false, message: prepared.message }
      if (
        prepared.applicationAuthority.projectId !== editorProjectId
        || prepared.applicationAuthority.editSessionId !== editorEditSessionId
        || prepared.applicationAuthority.editReferenceId !== request.referenceDecision.draftReferenceId
        || prepared.applicationAuthority.connectionState !== 'not_connected'
      ) {
        return {
          ok: false,
          message: 'The prepared Edit Reference no longer matches this exact edit and cannot be applied.',
        }
      }
      selectedApplicationId = prepared.applicationAuthority.applicationId
      expectedPreparedApplication = {
        id: prepared.applicationAuthority.applicationId,
        contentDigest: prepared.applicationAuthority.applicationContentDigestSha256,
      }
    }

    const authorityResult = await readExactEditPreferenceApplyAuthority({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
      selectedApplicationId,
    })
    if (!authorityResult.ok) return { ok: false, message: authorityResult.message }
    const authority = authorityResult.authority
    const authorityValueChange = resolveCurrentEditPreferenceChange(
      currentEditPreferenceValues,
      authority.values,
      currentEditPreferenceBaseline,
    )
    if (
      authority.preferenceRevision !== currentEditPreferenceRevision
      || authorityValueChange.changedFields.length > 0
    ) {
      return {
        ok: false,
        message: 'Saved Edit Preferences changed after this draft opened. Refresh this edit before applying.',
      }
    }

    const original = request.referenceDecision.original
    if (
      (original.kind === 'connected' && authority.currentApplicationId !== original.applicationId)
      || (original.kind === 'none' && authority.currentApplicationId !== null)
    ) {
      return {
        ok: false,
        message: 'The connected Edit Reference changed after this draft opened. Refresh before applying.',
      }
    }
    if (expectedPreparedApplication && (
      authority.selectedApplicationAuthority?.applicationId !== expectedPreparedApplication.id
      || authority.selectedApplicationAuthority.applicationContentDigestSha256
        !== expectedPreparedApplication.contentDigest
      || authority.selectedApplicationAuthority.connectionState !== 'not_connected'
    )) {
      return {
        ok: false,
        message: 'The prepared Edit Reference could not be matched to canonical exact-edit authority.',
      }
    }
    if (referenceOperation === 'remove' && (
      original.kind !== 'connected'
      || authority.selectedApplicationAuthority?.applicationId !== original.applicationId
      || authority.selectedApplicationAuthority.applicationContentDigestSha256
        !== original.applicationContentDigest
      || authority.selectedApplicationAuthority.connectionState !== 'connected'
    )) {
      return {
        ok: false,
        message: 'The connected Edit Reference could not be matched safely for removal.',
      }
    }

    const referenceMutation = referenceOperation === 'keep'
      ? null
      : referenceOperation === 'select'
        ? 'apply' as const
        : referenceOperation
    const operation = createExactEditPreferenceApplyOperation({
      authority,
      values: next,
      referenceMutation,
    })
    const saved = saveExactEditPreferencePendingApply({
      scope: projectPersistenceScope,
      projectId: editorProjectId,
      editSessionId: editorEditSessionId,
      operation,
      idempotencyKey: createExactEditPreferenceApplyIdempotencyKey(),
    })
    if (!saved.ok) return { ok: false, message: saved.message }
    setPendingExactEditPreferenceApply(saved.pending)
    return commitPendingExactEditPreferenceApply(saved.pending)
  }

  function handleAddEditCuesAfterFootagePrep() {
    showRevisionMessage('Edit Cues is open above. Add moment, transcript, scene, asset, or global notes before planning.')
  }

  function handleContextAwarePlanCreated(result: ContextAwareMockEditPlanResult) {
    const preservesRecoveredApprovedSnapshot =
      approved ||
      (
        localProjectHandoff?.stage === 'plan_approved' &&
        Boolean(localProjectHandoff.approvedSnapshotId)
      )

    pendingPlanReviewScrollRef.current = true
    setContextAwarePlanResult(result)
    setActiveRevisionPlanContext(undefined)
    setContextMockPreview(null)
    setShowEditMap(false)
    if (!preservesRecoveredApprovedSnapshot) {
      setIntentApproved(false)
      setApproved(false)
      setApprovedSnapshot(null)
      setExecutionRehearsal(null)
      setProgressStarted(false)
      setPreviewReady(false)
      setProgressIndex(0)
    }
    showRevisionMessage(
      preservesRecoveredApprovedSnapshot
        ? 'Approved plan is restored. Continue the review render from the recovered approval.'
        : result.planningContext.status === 'blocked'
        ? 'Draft plan is ready. Resolve the blocking planning item before approval.'
        : 'Plan updated from your source assembly, library notes, brief, and cues.',
    )

    if (canonicalPlanningBackendConnected && !preservesRecoveredApprovedSnapshot) {
      canonicalPlanApproval.reset()
      const exactPlannerInput = createContextAwarePlannerInput(result.planningContext, plannerInput)
      void canonicalPlanningPublication.submit({
        plan: result.editPlan,
        plannerInput: exactPlannerInput,
        sourceMediaAssets: durableUploadedPrivateSourceAssets(sourceMediaAssets),
        ...(canonicalJourneyValue?.stage === 'revision_requested'
          ? { revisionJourney: canonicalJourneyValue }
          : {}),
      })
    }
  }

  useEffect(() => {
    if (!contextAwarePlanResult || !pendingPlanReviewScrollRef.current) return

    const focusFrame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>('[data-testid="plan-review-card"]')
        ?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
      pendingPlanReviewScrollRef.current = false
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [contextAwarePlanResult])

  function handleContextAwarePlanInvalidated() {
    const hasContextDraftOrReviewState = Boolean(
      contextAwarePlanResult ||
      contextMockPreview ||
      approved ||
      approvedSnapshot ||
      privateInternalTestRun ||
      previewReady
    )

    if (!hasContextDraftOrReviewState) {
      return
    }

    canonicalPlanningPublication.reset()
    canonicalPlanApproval.reset()
    persistCurrentEditSetupAfterPlanInvalidation()
    showRevisionMessage('Planning inputs changed. Create a new edit plan from the updated context before approval.')
  }

  async function runPrivateInternalTestRunForSnapshot(
    boundSnapshot: ApprovedPlanSnapshot,
    reviewerNote: string,
    readyMessage: string,
    creditReservationId: string = `mock-credit-reservation-${boundSnapshot.id}`,
  ) {
    try {
      const activeSourceMediaAssets = sourceMediaAssets.length > 0
        ? sourceMediaAssets
        : localProjectHandoff
          ? []
          : createExecutionSourceMediaAssetsFromClips(clips, boundSnapshot.projectId)
      if (!uploadedPrivateSourceAssetsCoverClips(activeSourceMediaAssets, clips)) {
        const message = 'Upload source files for every source clip before starting the edit render.'
        setPrivateInternalTestRunError(message)
        replaceRuntimeStatusMessage(createAssistantErrorMessage(`${message} Only uploaded source files can start edit execution.`, {
          id: `private-internal-upload-required-${Date.now()}`,
          actions: [{ id: 'attach_clips', label: 'Upload source video', variant: 'secondary' }],
        }))
        return
      }
      const sourceSetFingerprint = createLocalSourceSetFingerprint(activeSourceMediaAssets)
      const scopedAdapterToolNames = resolveApprovedSnapshotInternalTestAdapterToolNames(boundSnapshot)
      const internalTestRunResult = await createApprovedEditExecutionPrivateInternalTestRunClient({
        workspaceId: projectPersistenceScope.workspaceId,
        projectId: boundSnapshot.projectId,
        approvedPlanSnapshotId: boundSnapshot.id,
        approvedSnapshot: boundSnapshot as unknown as Record<string, unknown>,
        creditReservationId,
        requestedAdapterToolNames: scopedAdapterToolNames,
        sourceMediaAssets: activeSourceMediaAssets,
        processingMode: 'private_internal_review_render',
        maxDurationSeconds: 30,
        targetWidth: aspectRatio === '16:9' ? 960 : 540,
        targetHeight: aspectRatio === '16:9' ? 540 : 960,
        fps: 24,
        reviewerNote,
      })

      if (!internalTestRunResult.ok || !internalTestRunResult.data?.internalTestRun) {
        const message = internalTestRunResult.error?.message ?? 'Review render could not start from the approved plan.'
        setPrivateInternalTestRunError(message)
        replaceRuntimeStatusMessage(createAssistantErrorMessage(`${message} The approved plan is saved, and no release action started.`, {
          id: `private-internal-test-run-error-${Date.now()}`,
          actions: [{ id: 'ask_question', label: 'Review blocker', variant: 'secondary' }],
        }))
        return
      }

	      const internalTestRun = internalTestRunResult.data.internalTestRun
	      const expectedReviewVideoMetadata = expectedReviewVideoMetadataFromArtifact(internalTestRun.finalRenderArtifact)
	      const renderPreviewAssemblyId = internalTestRun.stageIds.renderPreviewAssemblyId ?? undefined
	      const privateInternalDownloadDeliveryId = internalTestRun.stageIds.privateInternalDownloadDeliveryId ?? undefined
	      const finalDeliveryQaReviewId = internalTestRun.stageIds.finalDeliveryQaReviewId ?? undefined
	      const finalRenderExecutionId = internalTestRun.stageIds.finalRenderExecutionId ?? undefined
	      const finalRenderReadinessReviewId = internalTestRun.stageIds.finalRenderReadinessReviewId ?? undefined
	      const professionalEditQaSummary = attachManifestAudioQaSummary(
	        internalTestRun.privateInternalDownloadDelivery?.professionalEditQaSummary,
	        internalTestRun.finalRenderArtifact?.editDecisionManifest,
	      )
	      setPrivateInternalTestRun({
        status: internalTestRun.status,
        sourceSetFingerprint,
        renderPreviewAssemblyId,
        creditReservationId: internalTestRun.creditReservationId,
        privateInternalDownloadPath: internalTestRun.privateInternalDownloadPath,
        privateInternalManifestPath: internalTestRun.privateInternalManifestPath,
        privateInternalDownloadDeliveryId,
        finalDeliveryQaReviewId,
        finalRenderExecutionId,
        finalRenderReadinessReviewId,
        finalRenderArtifactId: internalTestRun.finalRenderArtifact?.artifactId,
        finalRenderSha256: internalTestRun.finalRenderArtifact?.sha256,
        expectedReviewVideoMetadata,
	        professionalEditQaSummary,
        editDecisionManifestVerification: undefined,
        reviewVideoMetadata: undefined,
        byteSize: internalTestRun.finalRenderArtifact?.byteSize,
        nextRequiredGate: internalTestRun.nextRequiredGate,
        summary: internalTestRun.userFacingSummary,
        adapterGateSummary: internalTestRun.adapterGateSummary,
        editDecisionManifestReady: internalTestRun.finalRenderArtifact?.editDecisionManifest?.manifestVersion === 'private-internal-edit-decision-manifest-v1' ||
	          professionalEditQaSummary?.editDecisionManifestReady === true,
        editDecisionManifestVerified: false,
      })
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: 'private_review_ready',
        approvedSnapshotId: boundSnapshot.id,
        sourceFileCount: internalTestRun.sourceMediaAssetCount,
        setup: createCurrentEditSetupSnapshot({
          sourceOrderConfirmed: true,
          cleanupPreferenceConfirmed: true,
          aspectRatioConfirmed: true,
          editLevelConfirmed: true,
          visualPreferenceConfirmed: true,
        }),
        sourceMediaAssets: activeSourceMediaAssets,
        privateReview: {
          byteSize: internalTestRun.finalRenderArtifact?.byteSize,
          manifestVerified: false,
          reviewDecision: undefined,
          editDecisionManifestVerification: undefined,
          reviewVideoMetadata: undefined,
          renderPreviewAssemblyId,
          creditReservationId: internalTestRun.creditReservationId,
          privateInternalDownloadPath: internalTestRun.privateInternalDownloadPath,
          privateInternalManifestPath: internalTestRun.privateInternalManifestPath,
          privateInternalDownloadDeliveryId,
          finalDeliveryQaReviewId,
          finalRenderExecutionId,
          finalRenderReadinessReviewId,
          finalRenderArtifactId: internalTestRun.finalRenderArtifact?.artifactId,
          finalRenderSha256: internalTestRun.finalRenderArtifact?.sha256,
          expectedReviewVideoMetadata,
	          professionalEditQaSummary,
          adapterGateSummary: internalTestRun.adapterGateSummary,
          serverReviewId: undefined,
          serverReviewStatus: undefined,
          serverNextRequiredGate: undefined,
          nextRequiredGate: internalTestRun.nextRequiredGate,
          updatedAt: new Date().toISOString(),
        },
      })
      setProgressIndex(progressSteps.length - 1)
      setPreviewReady(true)
      showRevisionMessage(readyMessage)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Private review preparation failed before review delivery.'
      setPrivateInternalTestRunError(message)
      replaceRuntimeStatusMessage(createAssistantErrorMessage(`${message} The approved plan is saved, and no release action started.`, {
        id: `private-internal-test-run-error-${Date.now()}`,
        actions: [{ id: 'ask_question', label: 'Review blocker', variant: 'secondary' }],
      }))
    } finally {
      setPrivateInternalTestRunRunning(false)
      setApprovalChecking(false)
    }
  }

  function handleReviewCleanupDecisionsAfterFootagePrep() {
    showRevisionMessage('Cleanup decisions are listed above so you can see what was kept, tightened, or preserved.')
  }

  function handleMockPreviewReady(payload: FootagePrepMockPreviewReadyPayload) {
    const state = payload.generationReadinessState
    setContextMockPreview({
      previewId: state.previewJob?.previewId,
      previewLabel: state.previewJob?.previewLabel,
      creditsUsed: state.creditEstimate?.totalCredits ?? plan.creditEstimate.total,
      payload,
    })
    setShowEditMap(false)
    showRevisionMessage('Preview is ready for review. Internal testing did not deduct real credits.')
  }

  function handleOpenEditMap() {
    setShowEditMap(true)
    if (!editMap.editDocument && editMap.editMapState.previewJobId) {
      editMap.createEditMap()
    }
  }

  function handleAddMockClip() {
    if (isProjectWorkspace) {
      showRevisionMessage('Upload private source files for this project. Only uploaded files can become source media for this edit.')
      return
    }

    setClipsAttached(true)
    const nextClipIndex = clips.length + 1
    const next = normalizeClipOrder([
      ...clips,
      {
        id: `chat-clip-${String(nextClipIndex).padStart(3, '0')}`,
        uploadedOrder: nextClipIndex,
        fileName: `chat-upload-${nextClipIndex}.mp4`,
        duration: '00:09',
        detectedType: 'Clip sent in chat',
        notes: '',
        sourceRole: 'unknown',
      },
    ])
    const nextSourceSequenceMode = inferNextSourceSequenceMode(next)
    const nextSourceMediaAssets = createExecutionSourceMediaAssetsFromClips(next, editorProjectId, sourceMediaAssets)
    setClips(next)
    setSourceMediaAssets(nextSourceMediaAssets)
    setSourceSequenceMode(nextSourceSequenceMode)
    resetAfterSourceChange()
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'source_uploaded',
      sourceFileCount: next.length,
      setup: createCurrentEditSetupSnapshot({
        sourceSequenceMode: nextSourceSequenceMode,
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
      }),
      sourceMediaAssets: durableUploadedPrivateSourceAssets(nextSourceMediaAssets),
    })
  }

  async function handleAttachSourceFiles(files: File[]) {
    if (files.length === 0 || sourceUploadPlanning) {
      return
    }

    setUploadGateError('')
    setSourceUploadPlanning(true)
    const existingSourcesAreUnconfirmedPlaceholders =
      !sourceOrderConfirmed &&
      clips.length > 0 &&
      durableUploadedPrivateSourceAssets(sourceMediaAssets).length === 0
    const replaceDemoClipsWithUpload =
      !sourceOrderConfirmed &&
      (
        existingSourcesAreUnconfirmedPlaceholders ||
        (
          clips.length === selectedScenario.clips.length &&
          clips.every((clip, index) => clip.id === selectedScenario.clips[index]?.id)
        )
      )

    try {
      const result = await planSourceUploadsForEditor({
        files,
        projectId: editorProjectId,
        startingOrder: replaceDemoClipsWithUpload ? 1 : clips.length + 1,
        userId: editorOperationUserId,
        workspaceId: projectPersistenceScope.workspaceId,
      })

      if (result.clips.length === 0) {
        const message = result.warnings[0] ?? 'I could not plan those files for this edit. Choose supported video, audio, or image source files.'
        if (editChatLockedUntilUpload) {
          setUploadGateError(createUploadGateErrorMessage(message))
        }
        showRevisionMessage(message)
        return
      }

      const next = normalizeClipOrder(replaceDemoClipsWithUpload ? result.clips : [...clips, ...result.clips])
      const nextSourceSequenceMode = inferNextSourceSequenceMode(next)
      const nextSourceMediaAssets = createExecutionSourceMediaAssetsFromClips(next, editorProjectId, [
        ...(replaceDemoClipsWithUpload ? [] : sourceMediaAssets),
        ...createExecutionSourceMediaAssetsFromPlannedUploads(result.plannedUploads, result),
      ])
      setClipsAttached(true)
      setClips(next)
      setSourceMediaAssets(nextSourceMediaAssets)
      setSourceSequenceMode(nextSourceSequenceMode)
      resetAfterSourceChange()

      const uniqueWarnings = result.warnings.filter((warning) =>
        !warning.toLowerCase().includes('mock api response only'),
      )
      const uploadedCount = result.plannedUploads.filter((item) => item.storageUpload?.status === 'uploaded').length
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: 'source_uploaded',
        sourceFileCount: next.length,
        setup: createCurrentEditSetupSnapshot({
          sourceSequenceMode: nextSourceSequenceMode,
          sourceOrderConfirmed: false,
          cleanupPreferenceConfirmed: false,
        }),
        sourceMediaAssets: durableUploadedPrivateSourceAssets(nextSourceMediaAssets),
      })
      showRevisionMessage(isProjectWorkspace
        ? `${result.clips.length} source file${result.clips.length === 1 ? ' is' : 's are'} ready in uploaded order. The source remains private, and no editing or credits were used.`
        : [
            replaceDemoClipsWithUpload
              ? `I replaced the placeholder sources with ${result.clips.length} uploaded source file${result.clips.length === 1 ? '' : 's'} in uploaded order.`
              : `I added ${result.clips.length} source file${result.clips.length === 1 ? '' : 's'} to this edit in uploaded order.`,
            uploadedCount > 0
              ? 'The files are in private source storage and added to the source sequence; no editing, processing, or generation ran yet.'
              : 'The files are planned through the upload/source-sequence boundary; no media bytes were uploaded, processed, or executed yet.',
            uniqueWarnings.slice(0, 2).join(' '),
          ].filter(Boolean).join(' '))
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Source upload planning failed before any media upload or execution ran.'
      if (editChatLockedUntilUpload) {
        setUploadGateError(createUploadGateErrorMessage(message))
      }
      showRevisionMessage(message)
    } finally {
      setSourceUploadPlanning(false)
    }
  }

  function handleUploadGateFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (selectedFiles.length === 0) return

    const videoFiles = selectedFiles.filter((file) =>
      file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name),
    )

    if (videoFiles.length === 0) {
      const message = 'Choose a supported source video file before planning unlocks for this edit.'
      setUploadGateError(createUploadGateErrorMessage(message))
      showRevisionMessage(message)
      return
    }

    void handleAttachSourceFiles(videoFiles)
  }

  function handleMoveClip(id: string, direction: 'left' | 'right' | 'up' | 'down') {
    const next = reorderClipsByMove(clips, id, direction)
    const nextSourceSequenceMode = inferNextSourceSequenceMode(next)
    const nextSourceMediaAssets = createExecutionSourceMediaAssetsFromClips(next, editorProjectId, sourceMediaAssets)
    setClips(next)
    setSourceMediaAssets(nextSourceMediaAssets)
    setSourceSequenceMode(nextSourceSequenceMode)
    resetAfterSourceChange()
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'source_uploaded',
      sourceFileCount: next.length,
      setup: createCurrentEditSetupSnapshot({
        sourceSequenceMode: nextSourceSequenceMode,
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
      }),
      sourceMediaAssets: durableUploadedPrivateSourceAssets(nextSourceMediaAssets),
    })
  }

  function handleRemoveClip(id: string) {
    const next = normalizeClipOrder(clips.filter((clip) => clip.id !== id))
    const nextSourceSequenceMode = inferNextSourceSequenceMode(next)
    const nextSourceMediaAssets = createExecutionSourceMediaAssetsFromClips(next, editorProjectId, sourceMediaAssets)
    setClips(next)
    setSourceMediaAssets(nextSourceMediaAssets)
    setSourceSequenceMode(nextSourceSequenceMode)
    resetAfterSourceChange()
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'source_uploaded',
      sourceFileCount: next.length,
      setup: createCurrentEditSetupSnapshot({
        sourceSequenceMode: nextSourceSequenceMode,
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
      }),
      sourceMediaAssets: durableUploadedPrivateSourceAssets(nextSourceMediaAssets),
    })
  }

  function handleUpdateClip(id: string, updates: Partial<ClipSource>) {
    const next = clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip))
    const nextSourceSequenceMode = inferNextSourceSequenceMode(next)
    const nextSourceMediaAssets = createExecutionSourceMediaAssetsFromClips(next, editorProjectId, sourceMediaAssets)
    setClips(next)
    setSourceMediaAssets(nextSourceMediaAssets)
    setSourceSequenceMode(nextSourceSequenceMode)
    resetAfterSourceChange()
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'source_uploaded',
      sourceFileCount: next.length,
      setup: createCurrentEditSetupSnapshot({
        sourceSequenceMode: nextSourceSequenceMode,
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
      }),
      sourceMediaAssets: durableUploadedPrivateSourceAssets(nextSourceMediaAssets),
    })
  }

  function handleSetSourceSequenceMode(mode: SourceSequenceMode) {
    setSourceSequenceMode(mode)
    resetAfterSourceChange()
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'source_uploaded',
      setup: createCurrentEditSetupSnapshot({
        sourceSequenceMode: mode,
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
      }),
      sourceMediaAssets: durableUploadedPrivateSourceAssets(sourceMediaAssets),
    })
  }

  function handleConfirmSourceOrder() {
    setSourceOrderConfirmed(true)
    persistCurrentEditSetupAfterPlanInvalidation({ sourceOrderConfirmed: true })
  }

  function handleAspectRatioSelect(ratio: AspectRatio) {
    const nextFrameTemplateType = getDefaultFrameTemplateForAspectRatio(ratio).templateType
    setAspectRatio(ratio)
    setFrameTemplateType(nextFrameTemplateType)
    setAspectRatioConfirmed(false)
    setCleanupPreferenceConfirmed(false)
    setAspectRatioSource('user_selected')
    setIntentApproved(false)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    persistCurrentEditSetupAfterPlanInvalidation({
      aspectRatio: ratio,
      frameTemplateType: nextFrameTemplateType,
      aspectRatioConfirmed: false,
      cleanupPreferenceConfirmed: false,
      aspectRatioSource: 'user_selected',
      editLevelConfirmed: false,
      visualPreferenceConfirmed: false,
    })
  }

  function handleConfirmAspectRatio() {
    const recommendedAspectRatio = plan.aspectRatioFramePlan?.recommendedAspectRatio?.recommendedAspectRatio
    const nextAspectRatio = aspectRatio === 'let_ai_decide' && recommendedAspectRatio && recommendedAspectRatio !== 'let_ai_decide'
      ? recommendedAspectRatio
      : aspectRatio
    const nextFrameTemplateType = getDefaultFrameTemplateForAspectRatio(nextAspectRatio).templateType

    if (aspectRatio === 'let_ai_decide' && recommendedAspectRatio && recommendedAspectRatio !== 'let_ai_decide') {
      setAspectRatio(recommendedAspectRatio)
      setFrameTemplateType(nextFrameTemplateType)
    }

    setAspectRatioConfirmed(true)
    setAspectRatioSource('user_selected')
    setCleanupPreferenceConfirmed(false)
    persistCurrentEditSetupAfterPlanInvalidation({
      aspectRatio: nextAspectRatio,
      frameTemplateType: nextFrameTemplateType,
      aspectRatioConfirmed: true,
      aspectRatioSource: 'user_selected',
      cleanupPreferenceConfirmed: false,
    })
  }

  function handleCleanupPreferenceSelect(preference: CleanupPreference) {
    const preferenceChanged = preference !== cleanupPreference
    const nextRevision = preferenceChanged ? currentEditPreferenceRevision + 1 : currentEditPreferenceRevision
    const nextUpdatedAt = preferenceChanged ? new Date().toISOString() : currentEditPreferenceUpdatedAt
    setCleanupPreference(preference)
    setCleanupPreferenceConfirmed(false)
    if (preferenceChanged) {
      setCurrentEditPreferenceRevision(nextRevision)
      setCurrentEditPreferenceUpdatedAt(nextUpdatedAt)
    }
    persistCurrentEditSetupAfterPlanInvalidation({
      cleanupPreference: preference,
      cleanupPreferenceConfirmed: false,
      preferenceRevision: nextRevision,
      preferenceUpdatedAt: nextUpdatedAt,
    })
  }

  function handleConfirmCleanupPreference() {
    const nextCleanupPreference = cleanupPreference ?? plan.sourceCleanupPlan?.recommendedPreference.recommendedPreference ?? 'balanced_cleanup'
    setCleanupPreference(nextCleanupPreference)
    setCleanupPreferenceConfirmed(true)
    persistCurrentEditSetupAfterPlanInvalidation({ cleanupPreference: nextCleanupPreference, cleanupPreferenceConfirmed: true })
  }

  function handleEditLevelSelect(value: EditLevel) {
    const preferenceChanged = value !== editLevel
    const nextRevision = preferenceChanged ? currentEditPreferenceRevision + 1 : currentEditPreferenceRevision
    const nextUpdatedAt = preferenceChanged ? new Date().toISOString() : currentEditPreferenceUpdatedAt
    setEditLevel(value)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    if (preferenceChanged) {
      setCurrentEditPreferenceRevision(nextRevision)
      setCurrentEditPreferenceUpdatedAt(nextUpdatedAt)
    }
    persistCurrentEditSetupAfterPlanInvalidation({
      editLevel: value,
      editLevelConfirmed: false,
      visualPreferenceConfirmed: false,
      preferenceRevision: nextRevision,
      preferenceUpdatedAt: nextUpdatedAt,
    })
  }

  function handleConfirmEditLevel() {
    setEditLevelConfirmed(true)
    persistCurrentEditSetupAfterPlanInvalidation({ editLevelConfirmed: true })
  }

  function handleVisualPreferenceSelect(value: VisualPreference) {
    const preferenceChanged = value !== visualPreference
    const nextRevision = preferenceChanged ? currentEditPreferenceRevision + 1 : currentEditPreferenceRevision
    const nextUpdatedAt = preferenceChanged ? new Date().toISOString() : currentEditPreferenceUpdatedAt
    setVisualPreference(value)
    setVisualPreferenceConfirmed(false)
    if (preferenceChanged) {
      setCurrentEditPreferenceRevision(nextRevision)
      setCurrentEditPreferenceUpdatedAt(nextUpdatedAt)
    }
    persistCurrentEditSetupAfterPlanInvalidation({
      visualPreference: value,
      visualPreferenceConfirmed: false,
      preferenceRevision: nextRevision,
      preferenceUpdatedAt: nextUpdatedAt,
    })
  }

  function handleConfirmVisualPreference() {
    setVisualPreferenceConfirmed(true)
    persistCurrentEditSetupAfterPlanInvalidation({ visualPreferenceConfirmed: true })
  }

  function handleApproveIntent() {
    setIntentApproved(true)
  }

  function handleReferenceAttach() {
    const nextReferenceUrl = referenceUrl || (isProjectWorkspace ? '' : selectedScenario.referenceUrl || defaultChatPlannerInput.referenceUrl)
    if (!nextReferenceUrl) {
      showRevisionMessage('Paste a reference URL before adding it to this edit.')
      return
    }
    setReferenceAttached(true)
    setReferenceSkipped(false)
    if (!referenceUrl) {
      setReferenceUrl(nextReferenceUrl)
    }
    persistCurrentEditSetupAfterPlanInvalidation({
      referenceAttached: true,
      referenceSkipped: false,
      referenceUrl: nextReferenceUrl,
    })
  }

  function handleReferenceSkip() {
    setReferenceAttached(false)
    setReferenceSkipped(true)
    persistCurrentEditSetupAfterPlanInvalidation({ referenceAttached: false, referenceSkipped: true })
  }

  function handleReferenceUrlChange(nextUrl: string) {
    setReferenceUrl(nextUrl)
    setReferenceAttached(false)
    setReferenceSkipped(false)
    persistCurrentEditSetupAfterPlanInvalidation({
      referenceAttached: false,
      referenceSkipped: false,
      referenceUrl: nextUrl,
    })
  }

  function handleToggleReferenceFocus(optionId: string) {
    const nextReferenceFocusSelections = referenceFocusSelections.includes(optionId)
      ? referenceFocusSelections.filter((id) => id !== optionId)
      : [...referenceFocusSelections, optionId]
    setReferenceFocusSelections(nextReferenceFocusSelections)
    persistCurrentEditSetupAfterPlanInvalidation({ referenceFocusSelections: nextReferenceFocusSelections })
  }

  function handleReviseSetupFromPlanReview() {
    setAspectRatioConfirmed(false)
    setCleanupPreferenceConfirmed(false)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    persistCurrentEditSetupAfterPlanInvalidation({
      aspectRatioConfirmed: false,
      cleanupPreferenceConfirmed: false,
      editLevelConfirmed: false,
      visualPreferenceConfirmed: false,
    })
    showRevisionMessage('Setup is open again. Adjust the frame, cleanup, edit level, or visual direction before creating a fresh plan.')
  }

  async function handleApprove() {
    if (approvalCheckingRef.current) {
      return
    }

    function blockApproval(message: string, creditReservationMayExist = false) {
      showApprovalError(
        creditReservationMayExist
          ? `${message} A credit reservation may already exist; do not retry until ReeditPro confirms its status.`
          : `${message} No credits were approved or used.`,
      )
      setApproved(false)
      setApprovedSnapshot(null)
      setExecutionRehearsal(null)
      setProgressStarted(false)
      setProgressIndex(0)
      setPreviewReady(false)
    }

    setApprovalChecking(true)

    if (canonicalPlanningBackendConnected) {
      if (!canonicalApprovalAuthorityReady || !canonicalJourneyValue) {
        blockApproval('Wait for this exact saved plan and estimate to finish matching the current review before approval.')
        setApprovalChecking(false)
        return
      }

      const canonicalResult = await canonicalPlanApproval.approve(canonicalJourneyValue)
      if (canonicalResult.status === 'approved') {
        updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
          stage: 'plan_approved',
          approvedSnapshotId: canonicalResult.receipt.approval.snapshotId,
          approvedCreditReservationId: canonicalResult.receipt.approval.reservationId,
          sourceFileCount: sourceMediaAssets.length > 0 ? sourceMediaAssets.length : clips.length,
          setup: createCurrentEditSetupSnapshot(),
        })
        showRevisionMessage(canonicalResult.message)
      } else {
        blockApproval(
          canonicalResult.message,
          canonicalResult.reservationState === 'unknown',
        )
      }
      canonicalJourney.refresh()
      setApprovalChecking(false)
      return
    }

    if (qaApprovalFailureEnabled) {
      blockApproval('Approval is blocked until one setup item is resolved.')
      setApprovalChecking(false)
      return
    }

    if (!setupReady || confirmedMaterialPlanningConflicts.length > 0) {
      blockApproval(
        confirmedMaterialPlanningConflicts[0] ??
        'Reconfirm the current output frame, edit level, visual direction, and required setup before approval.',
      )
      setApprovalChecking(false)
      return
    }

    if (!uploadedPrivateSourceAssetsCoverClips(sourceMediaAssets, clips)) {
      blockApproval('Upload source files for every source clip before approval. Only uploaded source files can be approved for edit execution.')
      setApprovalChecking(false)
      return
    }

    if (!contextAwarePlanResult) {
      blockApproval('Prepare the source and create the edit plan before approval.')
      setApprovalChecking(false)
      return
    }

    if (contextAwarePlanResult.planningContext.status === 'blocked') {
      blockApproval(planningContextApprovalBlockedReason || 'Resolve blocking Planning Context issues before approval.')
      setApprovalChecking(false)
      return
    }

    const currentApprovalPlannerInput = createContextAwarePlannerInput(
      contextAwarePlanResult.planningContext,
      plannerInput,
    )
    const currentPlanningFingerprint = createCompiledPlanningFingerprint(currentApprovalPlannerInput)
    if (
      !currentPlanningFingerprint ||
      contextAwarePlanResult.editPlan.planningInputTrace?.fingerprint !== currentPlanningFingerprint
    ) {
      blockApproval('Edit inputs changed after this plan was created. Create a fresh plan and estimate before approval.')
      setApprovalChecking(false)
      return
    }

    let approvalPlan: EditPlan

    try {
      // Approval gates stay lightweight, then the frozen snapshot uses the full execution graph plan.
      const approvalPlanner = await loadApprovalPlanner()
      const approvalPlannerInput = currentApprovalPlannerInput
      const gatePlan = contextAwarePlanResult?.editPlan ?? approvalPlanner.createApprovalCorePlan(approvalPlannerInput)
      const approvalGates = approvalPlanner.runApprovalCoreGates(gatePlan, {
        cleanupPreferenceConfirmed,
        planningContextStatus: contextAwarePlanResult?.planningContext.status,
      })

      if (!approvalGates.ok) {
        blockApproval(approvalGates.failureMessage)
        setApprovalChecking(false)
        return
      }

      const fullApprovalPlan = contextAwarePlanResult?.editPlan?.editingAgentExecutionPlan
        ? contextAwarePlanResult.editPlan
        : await loadFullMockEditPlan(approvalPlannerInput)
      const skillPreservingApprovalPlan = preserveContextAwarePlanSourceOfTruth(fullApprovalPlan, contextAwarePlanResult)
      approvalPlan = contextAwarePlanResult
        ? attachPlanningContextTraceToEditPlan(
            skillPreservingApprovalPlan,
            contextAwarePlanResult.planningContext,
            contextAwarePlanResult.readinessSummary,
          )
        : skillPreservingApprovalPlan
      const fullPlanGates = approvalPlanner.runApprovalCoreGates(approvalPlan, {
        cleanupPreferenceConfirmed,
        planningContextStatus: contextAwarePlanResult?.planningContext.status,
      })

      if (!fullPlanGates.ok) {
        blockApproval(fullPlanGates.failureMessage)
        setApprovalChecking(false)
        return
      }
    } catch {
      blockApproval('Approval checks could not load.')
      setApprovalChecking(false)
      return
    }

    if (
      liveApprovalPlanningFingerprintRef.current !== currentPlanningFingerprint ||
      approvalPlan.planningInputTrace?.fingerprint !== currentPlanningFingerprint
    ) {
      blockApproval('Edit inputs changed while approval checks were running. Create a fresh plan and estimate before approval.')
      setApprovalChecking(false)
      return
    }

    const snapshot = createApprovedPlanSnapshot({
      approvedBy: editorOperationUserId,
      editBriefSnapshot: contextAwarePlanResult?.planningContext.editBrief,
      editSessionId: editorEditSessionId,
      plan: approvalPlan,
      projectId: editorProjectId,
      sourceMediaAssets: durableUploadedPrivateSourceAssets(sourceMediaAssets),
    })
    const rehearsal = createEditSessionExecutionRehearsal({ approvedSnapshot: snapshot })
    const boundSnapshot = rehearsal.executionPlan
      ? { ...snapshot, editingAgentExecutionPlan: rehearsal.executionPlan }
      : snapshot
    const creditGateResult = await approveAndReserveCreditsForApprovedSnapshot({
      snapshot: boundSnapshot,
      workspaceId: projectPersistenceScope.workspaceId,
      approvedByUserId: editorOperationUserId,
    })

    if (!creditGateResult.ok) {
      blockApproval(`Credit approval/reservation could not be saved: ${creditGateResult.errorMessage ?? 'credit gate failed'}`)
      setApprovalChecking(false)
      return
    }

    const backendSnapshotResult = await persistApprovedPlanSnapshotToBackend({
      snapshot: boundSnapshot,
      workspaceId: projectPersistenceScope.workspaceId,
      approvedByUserId: editorOperationUserId,
      creditApprovalId: creditGateResult.creditApprovalId,
      creditReservationId: creditGateResult.creditReservationId,
    })

    if (!backendSnapshotResult.ok) {
      blockApproval(
        `Approved plan could not be saved: ${backendSnapshotResult.errorMessage ?? 'save failed'}`,
        creditGateResult.persisted,
      )
      setApprovalChecking(false)
      return
    }

    const durableRehearsal = backendSnapshotResult.approvedSnapshot.id === boundSnapshot.id
      ? rehearsal
      : createEditSessionExecutionRehearsal({ approvedSnapshot: backendSnapshotResult.approvedSnapshot })
    const durableBoundSnapshot = durableRehearsal.executionPlan
      ? { ...backendSnapshotResult.approvedSnapshot, editingAgentExecutionPlan: durableRehearsal.executionPlan }
      : backendSnapshotResult.approvedSnapshot

    setApprovedSnapshot(durableBoundSnapshot)
    setExecutionRehearsal(durableRehearsal)
    setApproved(true)
    setProgressStarted(true)
    setPreviewReady(false)
    setProgressIndex(0)
    setPrivateInternalTestRun(null)
    setPrivateInternalDownloadFile(null)
    setPrivateInternalManifestFile(null)
    setPrivateInternalReviewVideoMetadata(null)
    setPrivateInternalDownloadLoading(false)
    setPrivateInternalDownloadError('')
    setPrivateInternalTestRunError('')
    setPrivateInternalTestRunRunning(true)
    setPrivateInternalReviewDecision(null)
    setPrivateInternalReviewNote('')
    setPrivateInternalReviewRecording(false)
    setPendingPrivateReviewRevisionOperationId(null)
    setPrivateInternalRevisionRequestId(null)
    setRecordedRevisionPreviewRequestId(null)
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      stage: 'plan_approved',
      approvedSnapshotId: durableBoundSnapshot.id,
      approvedCreditReservationId: creditGateResult.creditReservationId,
      sourceFileCount: sourceMediaAssets.length > 0 ? sourceMediaAssets.length : clips.length,
      setup: createCurrentEditSetupSnapshot(),
    })

    await runPrivateInternalTestRunForSnapshot(
      durableBoundSnapshot,
      'Internal testing approval from chat-native editor.',
      'Review edit is ready. You can review it while sharing stays off until release gates pass.',
      creditGateResult.creditReservationId,
    )
  }

  async function handleRequestCanonicalExecutionPackage() {
    if (!canonicalJourneyValue) return
    const result = await canonicalExecutionPackageRequest.requestPackage(
      canonicalJourneyValue,
    )
    if (result.status === 'ready') canonicalJourney.refresh()
  }

  async function handlePrepareCanonicalPrivateEdit() {
    if (!canonicalJourneyValue) return
    const result = await canonicalPrivateEditPreparation.prepareEdit(
      canonicalJourneyValue,
    )
    if (result.status === 'ready' || result.status === 'blocked') {
      canonicalJourney.refresh()
    }
  }

  async function handleLoadCanonicalPrivateReview() {
    if (!canonicalJourneyValue) return
    await canonicalPrivateReview.loadMedia(canonicalJourneyValue)
  }

  async function handleAcceptCanonicalPrivateReview() {
    if (!canonicalJourneyValue || !canonicalPrivateReview.media) return
    const result = await canonicalPrivateReview.recordDecision(
      canonicalJourneyValue,
      'accept_private_internal_review',
    )
    if (result.status === 'recorded') canonicalJourney.refresh()
  }

  async function handleRequestCanonicalPrivateReviewRevision(summary: string) {
    if (!canonicalJourneyValue || !canonicalPrivateReview.media) return
    const result = await canonicalPrivateReview.recordDecision(
      canonicalJourneyValue,
      'request_revision',
      summary,
    )
    if (result.status === 'recorded') {
      canonicalPlanningPublication.reset()
      canonicalPlanApproval.reset()
      canonicalExecutionPackageRequest.reset()
      canonicalPrivateEditPreparation.reset()
      applyUserPlanningInstruction(summary)
      canonicalPrivateReview.reset()
      canonicalJourney.refresh()
    }
  }

  async function handleRunRevisionPrivateReview() {
    if (approvalChecking || privateInternalTestRunRunning) return

    const revisionNote = (privateInternalReviewNote.trim() || localProjectHandoff?.privateReview?.reviewNote?.trim() || '').slice(0, 500)
    if (!revisionNote) {
      setPrivateInternalDownloadError('Add a revision note before starting another review pass.')
      return
    }

    setApprovalChecking(true)
    setPrivateInternalTestRunRunning(true)
    setPrivateInternalDownloadFile(null)
    setPrivateInternalManifestFile(null)
    setPrivateInternalReviewVideoMetadata(null)
    setPrivateInternalDownloadLoading(false)
    setPrivateInternalDownloadError('')
    setPrivateInternalTestRunError('')
    setPrivateInternalReviewDecision(null)
    setPrivateInternalReviewNote('')
    setPrivateInternalReviewRecording(false)
    setPendingPrivateReviewRevisionOperationId(null)
    setPrivateInternalRevisionRequestId(null)
    setRecordedRevisionPreviewRequestId(null)
    setPreviewReady(false)
    setProgressStarted(true)
    setProgressIndex(0)

    try {
      const approvalPlanner = await loadApprovalPlanner()
      const contextAwareRevisionInput = contextAwarePlanResult
        ? createContextAwarePlannerInput(contextAwarePlanResult.planningContext, plannerInput)
        : plannerInput
      const revisedPlannerInput = {
        ...contextAwareRevisionInput,
        aspectRatioConfirmed: true,
        aspectRatioSource: contextAwareRevisionInput.aspectRatioSource ?? ('user_confirmed' as AspectRatioSource),
        cleanupPreferenceConfirmed: true,
        sourceOrderConfirmed: true,
        customInstructions: [
          contextAwareRevisionInput.customInstructions,
          `Review revision request: ${revisionNote}`,
          'Create a fresh internal testing candidate from the approved source order and this revision note.',
        ].filter(Boolean).join('\n\n'),
      }
      const fullRevisionPlan = await loadFullMockEditPlan(revisedPlannerInput)
      const skillPreservingRevisionPlan = preserveContextAwarePlanSourceOfTruth(fullRevisionPlan, contextAwarePlanResult)
      const approvalPlan = contextAwarePlanResult
        ? attachPlanningContextTraceToEditPlan(
            skillPreservingRevisionPlan,
            contextAwarePlanResult.planningContext,
            contextAwarePlanResult.readinessSummary,
          )
        : skillPreservingRevisionPlan
      const fullPlanGates = approvalPlanner.runApprovalCoreGates(approvalPlan, {
        cleanupPreferenceConfirmed,
        planningContextStatus: contextAwarePlanResult?.planningContext.status,
      })
      const durableRevisionReady =
        localProjectHandoff?.stage === 'revision_preview_ready' &&
        Boolean(localProjectHandoff.approvedSnapshotId) &&
        localProjectHandoff.sourceFileCount > 0

      if (!fullPlanGates.ok && !durableRevisionReady) {
        setPrivateInternalTestRunRunning(false)
        setApprovalChecking(false)
        setPrivateInternalTestRunError(fullPlanGates.failureMessage)
        showRevisionMessage(`${fullPlanGates.failureMessage} The revised review pass did not start.`)
        return
      }

      const snapshot = createApprovedPlanSnapshot({
        approvedBy: editorOperationUserId,
        editBriefSnapshot: contextAwarePlanResult?.planningContext.editBrief,
        editSessionId: `${editorEditSessionId}-revision-private-pass`,
        plan: approvalPlan,
        projectId: editorProjectId,
        sourceMediaAssets: durableUploadedPrivateSourceAssets(sourceMediaAssets),
      })
      const rehearsal = createEditSessionExecutionRehearsal({ approvedSnapshot: snapshot })
      const boundSnapshot = rehearsal.executionPlan
        ? { ...snapshot, editingAgentExecutionPlan: rehearsal.executionPlan }
        : snapshot
      const creditGateResult = await approveAndReserveCreditsForApprovedSnapshot({
        snapshot: boundSnapshot,
        workspaceId: projectPersistenceScope.workspaceId,
        approvedByUserId: editorOperationUserId,
      })

      if (!creditGateResult.ok) {
        const message = `Credit approval/reservation could not be saved: ${creditGateResult.errorMessage ?? 'credit gate failed'}`
        setPrivateInternalTestRunRunning(false)
        setApprovalChecking(false)
        setPrivateInternalTestRunError(message)
        showRevisionMessage(`${message} The revised review pass did not start.`)
        return
      }

      const backendSnapshotResult = await persistApprovedPlanSnapshotToBackend({
        snapshot: boundSnapshot,
        workspaceId: projectPersistenceScope.workspaceId,
        approvedByUserId: editorOperationUserId,
        creditApprovalId: creditGateResult.creditApprovalId,
        creditReservationId: creditGateResult.creditReservationId,
      })

      if (!backendSnapshotResult.ok) {
        const message = `Approved plan could not be saved: ${backendSnapshotResult.errorMessage ?? 'save failed'}`
        setPrivateInternalTestRunRunning(false)
        setApprovalChecking(false)
        setPrivateInternalTestRunError(message)
        showRevisionMessage(`${message} The revised review pass did not start.`)
        return
      }

      const durableRehearsal = backendSnapshotResult.approvedSnapshot.id === boundSnapshot.id
        ? rehearsal
        : createEditSessionExecutionRehearsal({ approvedSnapshot: backendSnapshotResult.approvedSnapshot })
      const durableBoundSnapshot = durableRehearsal.executionPlan
        ? { ...backendSnapshotResult.approvedSnapshot, editingAgentExecutionPlan: durableRehearsal.executionPlan }
        : backendSnapshotResult.approvedSnapshot

      setApprovedSnapshot(durableBoundSnapshot)
      setExecutionRehearsal(durableRehearsal)
      setApproved(true)
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: 'plan_approved',
        approvedSnapshotId: durableBoundSnapshot.id,
        approvedCreditReservationId: creditGateResult.creditReservationId,
        sourceFileCount: sourceMediaAssets.length > 0 ? sourceMediaAssets.length : clips.length,
        setup: createCurrentEditSetupSnapshot({
          customInstructions: revisedPlannerInput.customInstructions,
          sourceOrderConfirmed: true,
          cleanupPreferenceConfirmed: true,
          aspectRatioConfirmed: true,
        }),
        privateReview: {
          manifestVerified: false,
          reviewDecision: undefined,
          reviewNote: revisionNote,
          editDecisionManifestVerification: undefined,
          reviewVideoMetadata: undefined,
          nextRequiredGate: 'revised_private_review',
          updatedAt: new Date().toISOString(),
        },
      })

      await runPrivateInternalTestRunForSnapshot(
        durableBoundSnapshot,
        `Revised review pass from note: ${revisionNote}`,
        'Revised review video is ready. Review the new internal candidate before accepting it.',
        creditGateResult.creditReservationId,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Revised review could not start.'
      setPrivateInternalTestRunError(message)
      setPrivateInternalTestRunRunning(false)
      setApprovalChecking(false)
      showRevisionMessage(`${message} No release action started.`)
    }
  }

  async function handleResumePrivateInternalTestRun() {
    if (!approvedSnapshot || privateInternalTestRunRunning || approvalChecking) return

    setPrivateInternalTestRunError('')
    setPrivateInternalTestRunRunning(true)
    setProgressStarted(true)
    setPreviewReady(false)
    setProgressIndex(0)

    await runPrivateInternalTestRunForSnapshot(
      approvedSnapshot,
      'Resumed internal testing review from recovered approved plan.',
      'Review edit is ready. You can review it while sharing stays off until release gates pass.',
      localProjectHandoff?.approvedCreditReservationId ?? `mock-credit-reservation-${approvedSnapshot.id}`,
    )
  }

  async function handleLoadPrivateInternalDownloadFile() {
    const privateInternalDownloadPath = privateInternalTestRun?.privateInternalDownloadPath
    const privateInternalManifestPath = privateInternalTestRun?.privateInternalManifestPath

    if (!privateInternalDownloadPath || privateInternalDownloadLoading) {
      return
    }

    if (!privateInternalManifestPath) {
      setPrivateInternalDownloadError('Review video is missing its edit-decision trace route.')
      return
    }

    if (!privateInternalRunMatchesSourceSet(privateInternalTestRun, sourceMediaAssets)) {
      setPrivateInternalDownloadError('Review video belongs to an older source set. Run a fresh review for the current uploaded sources.')
      return
    }

    setPrivateInternalDownloadLoading(true)
    setPrivateInternalDownloadError('')
    setPrivateInternalReviewVideoMetadata(null)
    setPrivateInternalManifestFile(null)

    try {
      const result = await fetchApprovedEditExecutionPrivateInternalDownloadFileClient(privateInternalDownloadPath)

      if (!result.ok || !result.data) {
        setPrivateInternalDownloadError(result.error?.message ?? 'Review video could not be fetched.')
        return
      }

      const manifestResult = await fetchApprovedEditExecutionPrivateInternalDownloadManifestClient(privateInternalManifestPath)
      if (!manifestResult.ok || !manifestResult.data?.manifest) {
        setPrivateInternalDownloadError(manifestResult.error?.message ?? 'Review record could not be verified.')
        return
      }

      const manifestVerification = verifyPrivateEditDecisionManifest({
        manifest: manifestResult.data.manifest,
        approvedPlanSnapshotId: approvedSnapshot?.id ?? localProjectHandoff?.approvedSnapshotId,
        renderPreviewAssemblyId: privateInternalTestRun.renderPreviewAssemblyId,
        creditReservationId: privateInternalTestRun.creditReservationId,
        finalRenderArtifactId: privateInternalTestRun.finalRenderArtifactId,
        sourceMediaAssets,
      })

	      if (!manifestVerification.ok) {
	        setPrivateInternalDownloadError(manifestVerification.message)
	        return
	      }

	      const professionalEditQaSummary = attachManifestAudioQaSummary(
	        privateInternalTestRun.professionalEditQaSummary,
	        manifestResult.data.manifest,
	      )
	      setPrivateInternalDownloadFile({
	        objectUrl: URL.createObjectURL(result.data.blob),
	        fileName: result.data.fileName,
	        mimeType: result.data.mimeType,
        byteSize: result.data.byteSize,
      })
      setPrivateInternalManifestFile({
        objectUrl: URL.createObjectURL(manifestResult.data.blob),
        fileName: manifestResult.data.fileName,
        mimeType: manifestResult.data.mimeType,
        byteSize: manifestResult.data.byteSize,
      })
      setPrivateInternalTestRun((current) => current
        ? {
	            ...current,
	            editDecisionManifestVerified: true,
	            editDecisionManifestVerification: manifestVerification.verification,
	            professionalEditQaSummary,
	          }
	        : current)
      const existingHandoff = getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)
      const preservedReviewDecision =
        privateInternalReviewDecision ??
        existingHandoff?.privateReview?.reviewDecision
      const nextStage =
        existingHandoff?.stage === 'private_review_accepted' ||
        existingHandoff?.stage === 'internal_edit_complete' ||
        existingHandoff?.stage === 'revision_requested' ||
        existingHandoff?.stage === 'revision_preview_ready'
          ? existingHandoff.stage
          : 'private_review_verified'
      updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
        stage: nextStage,
        privateReview: {
          byteSize: result.data.byteSize,
          manifestVerified: true,
	          reviewDecision: preservedReviewDecision ?? undefined,
	          editDecisionManifestVerification: manifestVerification.verification,
	          reviewVideoMetadata: existingHandoff?.privateReview?.reviewVideoMetadata,
	          professionalEditQaSummary,
	          nextRequiredGate: privateInternalTestRun?.nextRequiredGate,
	          updatedAt: new Date().toISOString(),
	        },
	      })
    } catch (error) {
      setPrivateInternalDownloadError(error instanceof Error ? error.message : 'Review video could not be fetched.')
    } finally {
      setPrivateInternalDownloadLoading(false)
    }
  }

  function handleDownloadPrivateInternalFile() {
    if (!privateInternalDownloadFile) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = privateInternalDownloadFile.objectUrl
    anchor.download = privateInternalDownloadFile.fileName
    anchor.rel = 'noreferrer'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  function handleDownloadPrivateInternalManifestFile() {
    if (!privateInternalManifestFile) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = privateInternalManifestFile.objectUrl
    anchor.download = privateInternalManifestFile.fileName
    anchor.rel = 'noreferrer'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  function handlePrivateInternalReviewVideoMetadataLoaded(video: HTMLVideoElement) {
    const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0
    const width = video.videoWidth
    const height = video.videoHeight
    const expectedReviewVideoMetadata =
      privateInternalTestRun?.expectedReviewVideoMetadata ??
      localProjectHandoff?.privateReview?.expectedReviewVideoMetadata

    if (!privateInternalDownloadFile || durationSeconds <= 0 || width <= 0 || height <= 0) {
      setPrivateInternalDownloadError('Review video loaded, but browser playback metadata is incomplete.')
      setPrivateInternalReviewVideoMetadata(null)
      return
    }

    if (
      expectedReviewVideoMetadata &&
      (
        width !== expectedReviewVideoMetadata.width ||
        height !== expectedReviewVideoMetadata.height ||
        Math.abs(durationSeconds - expectedReviewVideoMetadata.durationSeconds) > 0.5
      )
    ) {
      setPrivateInternalDownloadError(
        `Review playback metadata does not match the final render artifact (${expectedReviewVideoMetadata.width}x${expectedReviewVideoMetadata.height}, ${expectedReviewVideoMetadata.durationSeconds.toFixed(1)}s expected).`,
      )
      setPrivateInternalReviewVideoMetadata(null)
      return
    }

    const reviewVideoMetadata: LocalPrivateInternalReviewVideoMetadata = {
      playable: true,
      durationSeconds,
      width,
      height,
      verifiedAt: new Date().toISOString(),
    }

    setPrivateInternalReviewVideoMetadata(reviewVideoMetadata)
    setPrivateInternalTestRun((current) => current
      ? { ...current, reviewVideoMetadata }
      : current)
    const existingHandoff = getLocalInternalEditHandoff(editorProjectId, editorEditSessionId)
    updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, {
      privateReview: {
        manifestVerified: existingHandoff?.privateReview?.manifestVerified ?? (privateInternalTestRun?.editDecisionManifestVerified === true),
        expectedReviewVideoMetadata,
        reviewVideoMetadata,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  async function recordPrivateInternalPreviewReview(
    decision: 'accepted_for_internal_testing' | 'changes_requested',
  ) {
    const renderPreviewAssemblyId = privateInternalTestRun?.renderPreviewAssemblyId
    const creditReservationId = privateInternalTestRun?.creditReservationId

    if (!renderPreviewAssemblyId || !creditReservationId) {
      setPrivateInternalDownloadError('Review decision cannot be recorded because the render review trace is missing.')
      return null
    }

    if (!privateInternalRunMatchesSourceSet(privateInternalTestRun, sourceMediaAssets)) {
      setPrivateInternalDownloadError('Review decision is blocked because the uploaded source set changed. Run a fresh review first.')
      return null
    }

    setPrivateInternalReviewRecording(true)
    setPrivateInternalDownloadError('')

    try {
      const serverDecision = decision === 'accepted_for_internal_testing'
        ? 'approved_for_final_render_readiness'
        : 'changes_requested'
      const reviewNote = privateInternalReviewNote.trim()
      const result = await createApprovedEditExecutionUserPreviewReviewClient({
        workspaceId: projectPersistenceScope.workspaceId,
        projectId: editorProjectId,
        renderPreviewAssemblyId,
        creditReservationId,
        reviewDecision: serverDecision,
        reviewerNote: decision === 'accepted_for_internal_testing'
          ? reviewNote || 'Verified review video and edit-decision trace accepted for internal testing only.'
          : reviewNote,
      })

      if (!result.ok || !result.data?.userPreviewReview) {
        setPrivateInternalDownloadError(result.error?.message ?? 'Review decision could not be recorded.')
        return null
      }

      const userPreviewReview = result.data.userPreviewReview
      setPrivateInternalTestRun((current) => current
        ? {
            ...current,
            serverUserPreviewReviewId: userPreviewReview.id,
            serverReviewStatus: userPreviewReview.status,
            serverReviewNextRequiredGate: userPreviewReview.nextRequiredGate,
          }
        : current)
      return userPreviewReview
    } catch (error) {
      setPrivateInternalDownloadError(error instanceof Error ? error.message : 'Review decision could not be recorded.')
      return null
    } finally {
      setPrivateInternalReviewRecording(false)
    }
  }

  async function saveDurablePrivateInternalReviewDecision(
    patch: Parameters<typeof updateLocalInternalEditHandoff>[2],
    failureMessage: string,
  ): Promise<boolean> {
    setPrivateInternalReviewRecording(true)
    try {
      const nextHandoff = updateLocalInternalEditHandoff(editorProjectId, editorEditSessionId, patch, { syncBackend: false })
      if (!nextHandoff) {
        setPrivateInternalDownloadError(failureMessage)
        return false
      }

      const result = await persistLocalInternalProjectHandoffToBackend(nextHandoff)
      if (!result.ok) {
        setPrivateInternalDownloadError(result.errorMessage ?? failureMessage)
        return false
      }

      saveLocalInternalProjectHandoff(nextHandoff, { syncBackend: false })
      setBackendRecoveredHandoff(nextHandoff)
      return true
    } finally {
      setPrivateInternalReviewRecording(false)
    }
  }

  async function handleAcceptPrivateInternalReview() {
    if (!privateInternalTestRun?.editDecisionManifestVerified || !privateInternalDownloadFile) {
      setPrivateInternalDownloadError('Load and verify the review video before accepting it.')
      return
    }
    if (!privateInternalReviewVideoMetadata?.playable) {
      setPrivateInternalDownloadError('Wait for the review video to load before accepting it.')
      return
    }
    if (privateInternalReviewDecision || privateInternalReviewRecording) return

    const userPreviewReview = await recordPrivateInternalPreviewReview('accepted_for_internal_testing')
    if (!userPreviewReview) return

    const reviewNote = privateInternalReviewNote.trim()
    const saved = await saveDurablePrivateInternalReviewDecision({
      stage: privateInternalTestRun.professionalEditQaSummary?.privateInternalQaReady
        ? 'internal_edit_complete'
        : 'private_review_accepted',
      privateReview: {
        byteSize: privateInternalDownloadFile.byteSize,
        manifestVerified: true,
        sourceSetFingerprint: privateInternalTestRun.sourceSetFingerprint ?? localProjectHandoff?.sourceSetFingerprint,
        reviewDecision: 'accepted_for_internal_testing',
        renderPreviewAssemblyId: privateInternalTestRun.renderPreviewAssemblyId,
        creditReservationId: privateInternalTestRun.creditReservationId,
        privateInternalDownloadPath: privateInternalTestRun.privateInternalDownloadPath,
        privateInternalManifestPath: privateInternalTestRun.privateInternalManifestPath,
        privateInternalDownloadDeliveryId: privateInternalTestRun.privateInternalDownloadDeliveryId,
        finalDeliveryQaReviewId: privateInternalTestRun.finalDeliveryQaReviewId,
        finalRenderExecutionId: privateInternalTestRun.finalRenderExecutionId,
        finalRenderReadinessReviewId: privateInternalTestRun.finalRenderReadinessReviewId,
        finalRenderArtifactId: privateInternalTestRun.finalRenderArtifactId,
        finalRenderSha256: privateInternalTestRun.finalRenderSha256,
        expectedReviewVideoMetadata: privateInternalTestRun.expectedReviewVideoMetadata,
        editDecisionManifestVerification: privateInternalTestRun.editDecisionManifestVerification,
        reviewVideoMetadata: privateInternalReviewVideoMetadata,
        professionalEditQaSummary: privateInternalTestRun.professionalEditQaSummary,
        adapterGateSummary: privateInternalTestRun.adapterGateSummary,
        serverReviewId: userPreviewReview.id,
        serverReviewStatus: userPreviewReview.status,
        serverNextRequiredGate: userPreviewReview.nextRequiredGate,
        reviewNote: reviewNote || undefined,
        nextRequiredGate: privateInternalTestRun.nextRequiredGate,
        updatedAt: new Date().toISOString(),
      },
    }, 'Review was recorded, but the accepted edit state could not be saved durably. Try again before leaving this edit.')
    if (!saved) return

    setPrivateInternalReviewDecision('accepted_for_internal_testing')
    showRevisionMessage('Edit approved and recorded against the review trace. Sharing and billing stay off until you approve a release path.')
  }

  async function handleRequestPrivateInternalChanges() {
    if (!privateInternalTestRun?.editDecisionManifestVerified) {
      setPrivateInternalDownloadError('Verify the review video before requesting changes.')
      return
    }
    if (!privateInternalReviewVideoMetadata?.playable) {
      setPrivateInternalDownloadError('Wait for the review video to load before requesting changes.')
      return
    }
    if (privateInternalReviewDecision || privateInternalReviewRecording) return
    const reviewNote = privateInternalReviewNote.trim()
    if (!reviewNote) {
      setPrivateInternalDownloadError('Add a short revision note before requesting changes.')
      return
    }

    const userPreviewReview = await recordPrivateInternalPreviewReview('changes_requested')
    if (!userPreviewReview) return

    const revisionState = editMap.createPrivateReviewRevisionOperation(reviewNote)
    const revisionOperation = revisionState?.operations[revisionState.operations.length - 1]

    const saved = await saveDurablePrivateInternalReviewDecision({
      stage: 'revision_requested',
      privateReview: {
        byteSize: privateInternalDownloadFile?.byteSize,
        manifestVerified: true,
        sourceSetFingerprint: privateInternalTestRun.sourceSetFingerprint ?? localProjectHandoff?.sourceSetFingerprint,
        reviewDecision: 'changes_requested',
        renderPreviewAssemblyId: privateInternalTestRun.renderPreviewAssemblyId,
        creditReservationId: privateInternalTestRun.creditReservationId,
        privateInternalDownloadPath: privateInternalTestRun.privateInternalDownloadPath,
        privateInternalManifestPath: privateInternalTestRun.privateInternalManifestPath,
        privateInternalDownloadDeliveryId: privateInternalTestRun.privateInternalDownloadDeliveryId,
        finalDeliveryQaReviewId: privateInternalTestRun.finalDeliveryQaReviewId,
        finalRenderExecutionId: privateInternalTestRun.finalRenderExecutionId,
        finalRenderReadinessReviewId: privateInternalTestRun.finalRenderReadinessReviewId,
        finalRenderArtifactId: privateInternalTestRun.finalRenderArtifactId,
        finalRenderSha256: privateInternalTestRun.finalRenderSha256,
        expectedReviewVideoMetadata: privateInternalTestRun.expectedReviewVideoMetadata,
        editDecisionManifestVerification: privateInternalTestRun.editDecisionManifestVerification,
        reviewVideoMetadata: privateInternalReviewVideoMetadata,
        professionalEditQaSummary: privateInternalTestRun.professionalEditQaSummary,
        adapterGateSummary: privateInternalTestRun.adapterGateSummary,
        serverReviewId: userPreviewReview.id,
        serverReviewStatus: userPreviewReview.status,
        serverNextRequiredGate: userPreviewReview.nextRequiredGate,
        reviewNote,
        revisionOperationId: revisionOperation?.id,
        nextRequiredGate: revisionOperation ? 'revision_request_creation' : 'revision_plan_update',
        updatedAt: new Date().toISOString(),
      },
    }, 'Review changes were recorded, but the revision state could not be saved durably. Try again before leaving this edit.')
    if (!saved) return

    if (revisionOperation) {
      setPendingPrivateReviewRevisionOperationId(revisionOperation.id)
      setShowEditMap(true)
    }

    setPrivateInternalReviewDecision('changes_requested')
    showRevisionMessage(revisionOperation
      ? 'Revision request created from the review note. Review it in the edit workspace before any next preview pass.'
      : 'Changes requested. I will keep the uploaded source order, approved plan record, and review record attached to the next revision plan.')
  }

  function handleLowerCost() {
    clearApprovalErrors()
    const alternatives = plan.creditEstimate.lowerCostAlternatives ?? []

    if (alternatives.length > 0) {
      showRevisionMessage(
        `I can lower the estimate by ${alternatives
          .slice(0, 3)
          .map((alternative) => `${alternative.label.toLowerCase()} (${alternative.actionHint.toLowerCase()})`)
          .join(', ')}. I'll revise the estimate before anything starts.`,
      )
      return
    }

    showRevisionMessage("I can lower the estimate by simplifying generated visuals and reducing fallback depth. I'll revise the estimate before anything starts.")
  }

  function handleSimplifyMotion() {
    clearApprovalErrors()
    showRevisionMessage("Motion-heavy moments will be simplified. I'll revise the plan with lighter visual treatment and a lower-cost estimate before anything starts.")
  }

  function handleAskPlanQuestion() {
    clearApprovalErrors()
    showRevisionMessage("Tell me what you want changed. I'll revise the plan and estimate before anything starts.")
  }

  function handleWorkspaceProgressAction() {
    if (editWorkspaceStage === 'plan_review') {
      scrollToEditorTarget(['[data-testid="plan-review-card"]'])
      return
    }

    if (editWorkspaceStage === 'review_ready' || editWorkspaceStage === 'revision_requested') {
      scrollToEditorTarget(['[data-testid="preview-ready-card"]', '[data-testid="private-internal-test-run-card"]'])
      return
    }

    if (editWorkspaceStage === 'blocked') {
      scrollToEditorTarget(['[data-testid="approval-error-message"]', '[data-testid="private-internal-test-run-card"]', '.planning-context-panel'])
      return
    }

    scrollToEditorTarget([
      '[data-testid="source-sequence-card"]',
      '[data-testid="aspect-ratio-gate-card"]',
      '.source-cleanup-plan-card',
      '[data-testid="edit-level-card"]',
      '[data-testid="visual-preference-card"]',
      '.footage-prep-workspace',
    ])
  }

  function getWorkspaceProgressActionLabel() {
    if (editWorkspaceStage === 'plan_review') return 'Review plan'
    if (editWorkspaceStage === 'review_ready') return 'Open review'
    if (editWorkspaceStage === 'revision_requested') return 'Review changes'
    if (editWorkspaceStage === 'blocked') return 'Show blocker'
    if (editWorkspaceStage === 'planning_setup') return 'Prepare plan'
    return undefined
  }

  function createTypedRevisionPlanContext(request: string): LocalInternalProjectHandoff['revisionPlanContext'] | undefined {
    const existingReview = localProjectHandoff?.privateReview
    const previousApprovedSnapshotId = localProjectHandoff?.approvedSnapshotId ?? approvedSnapshot?.id
    const previousCreditReservationId =
      localProjectHandoff?.approvedCreditReservationId ?? privateInternalTestRun?.creditReservationId
    const hasPreviousApprovedWork = Boolean(
      previousApprovedSnapshotId ||
      previousCreditReservationId ||
      privateInternalTestRun ||
      existingReview ||
      canonicalJourneyValue?.stage === 'revision_requested' ||
      canonicalJourneyValue?.stage === 'private_review_ready',
    )
    if (!hasPreviousApprovedWork) return undefined

    const previousReviewVerified = privateInternalTestRun?.editDecisionManifestVerified === true ||
      privateInternalReviewVideoMetadata?.playable === true ||
      existingReview?.manifestVerified === true ||
      Boolean(canonicalPrivateReview.media)
    const previousStage = localProjectHandoff?.stage ??
      (privateInternalReviewDecision === 'accepted_for_internal_testing'
        ? 'private_review_accepted'
        : privateInternalReviewDecision === 'changes_requested'
          ? 'revision_requested'
          : canonicalJourneyValue?.stage === 'revision_requested'
            ? 'revision_requested'
            : canonicalJourneyValue?.stage === 'private_review_ready'
              ? 'private_review_ready'
              : privateInternalTestRun
                ? 'private_review_ready'
                : undefined)

    return {
      request: request.trim().slice(0, 500),
      sourceSetFingerprint: createLocalSourceSetFingerprint(durableUploadedPrivateSourceAssets(sourceMediaAssets)),
      previousStage,
      previousReviewDecision: privateInternalReviewDecision ?? existingReview?.reviewDecision,
      previousReviewVerified,
      previousReviewNote: (privateInternalReviewNote.trim() || existingReview?.reviewNote)?.slice(0, 500),
      previousReviewArtifactId: privateInternalTestRun?.finalRenderArtifactId ?? existingReview?.finalRenderArtifactId,
      previousApprovedSnapshotId,
      previousCreditReservationId,
      contextOnly: true,
      freshPlanRequired: true,
      freshPrivateReviewRequired: true,
      updatedAt: new Date().toISOString(),
    }
  }

  function applyUserPlanningInstruction(nextMessageInput: string) {
    if (approvalCheckingRef.current) {
      showRevisionMessage('Approval checks are in progress. Wait for them to finish before changing the edit.')
      return
    }
    const nextMessage = nextMessageInput.trim()
    if (!nextMessage) {
      return
    }

    const messageIdSuffix = Date.now()
    const typedRevisionPlanContext = createTypedRevisionPlanContext(nextMessage)
    const responseMessageBase = typedRevisionPlanContext
      ? `I'll use that direction and create a fresh plan before any credits are approved. The previous private review stays as context only until a new approval and private review pass: "${nextMessage}"`
      : `I'll use that direction and revise the plan before any credits are approved: "${nextMessage}"`
    const nextInstructionHistory = appendOrderedUserInstruction(userInstructionHistory, nextMessage)
    const nextCustomInstructions = joinOrderedUserInstructions(nextInstructionHistory)
    const materialResolution = resolveMaterialPlanningInstruction(nextMessage, {
      aspectRatio,
      cleanupPreference,
      creditPreference,
      editLevel,
      frameTemplateType,
      moodStyle,
      targetPlatform,
      visualPreference,
      workflowType,
    })
    const invalidatesOutputFrame = materialResolution.invalidates.outputFrame
    const invalidatesEditLevel = materialResolution.invalidates.editLevel
    const invalidatesVisualPreference = materialResolution.invalidates.visualPreference
    const invalidatesCleanupPreference = materialResolution.invalidates.cleanupPreference
    const invalidatesStructuredEditPreferences = materialResolution.invalidates.editPreferences
    const invalidatesAnyConfirmedSetup =
      invalidatesOutputFrame ||
      invalidatesEditLevel ||
      invalidatesVisualPreference ||
      invalidatesCleanupPreference
    const invalidatesAnyEditPreference = invalidatesAnyConfirmedSetup || invalidatesStructuredEditPreferences
    const responseMessage = invalidatesAnyConfirmedSetup
      ? `${responseMessageBase} This changes confirmed setup, so the previous plan is cleared and the updated ${[
          invalidatesOutputFrame ? 'output frame' : '',
          invalidatesEditLevel ? 'edit level' : '',
          invalidatesVisualPreference ? 'visual direction' : '',
          invalidatesCleanupPreference ? 'cleanup direction' : '',
        ].filter(Boolean).join(', ')} must be planned again.`
      : invalidatesStructuredEditPreferences
        ? `${responseMessageBase} This changes Current Edit Preferences, so the next plan and estimate will use the new direction.`
        : responseMessageBase

    setRuntimeMessages((messages) => [
      ...messages.filter((message) =>
        message.type !== 'assistant_revision_response' && message.type !== 'assistant_error',
      ),
      createUserTextMessage(nextMessage, {
        id: `composer-user-${messageIdSuffix}`,
        metadata: {
          source: 'composer',
        },
      }),
      createRevisionResponseMessage(responseMessage, {
        id: `composer-revision-${messageIdSuffix}`,
        actions: [{ id: 'ask_question', label: 'Ask a question', variant: 'ghost' }],
      }),
    ])
    const nextSourceSequenceMode = inferNextSourceSequenceMode(clips, nextCustomInstructions)
    setCustomInstructions(nextCustomInstructions)
    setUserInstructionHistory(nextInstructionHistory)
    setComposerValue('')
    setSourceSequenceMode(nextSourceSequenceMode)
    if (invalidatesOutputFrame) {
      setAspectRatio(materialResolution.next.aspectRatio)
      setFrameTemplateType(
        materialResolution.next.frameTemplateType ??
        getDefaultFrameTemplateForAspectRatio(materialResolution.next.aspectRatio).templateType,
      )
      setTargetPlatform(materialResolution.next.targetPlatform)
      setAspectRatioConfirmed(false)
      setAspectRatioSource('user_selected')
      setCleanupPreferenceConfirmed(false)
      setEditLevelConfirmed(false)
      setVisualPreferenceConfirmed(false)
    }
    if (invalidatesEditLevel) {
      setEditLevel(materialResolution.next.editLevel)
      setEditLevelConfirmed(false)
      setVisualPreferenceConfirmed(false)
    }
    if (invalidatesVisualPreference) {
      setVisualPreference(materialResolution.next.visualPreference)
      setVisualPreferenceConfirmed(false)
    }
    if (materialResolution.changedFields.includes('workflowType')) {
      setWorkflowType(materialResolution.next.workflowType)
    }
    if (invalidatesCleanupPreference && materialResolution.next.cleanupPreference) {
      setCleanupPreference(materialResolution.next.cleanupPreference)
      setCleanupPreferenceConfirmed(true)
      resetFootagePrep()
    }
    if (materialResolution.changedFields.includes('moodStyle')) {
      setMoodStyle(materialResolution.next.moodStyle)
    }
    if (materialResolution.changedFields.includes('creditPreference')) {
      setCreditPreference(materialResolution.next.creditPreference)
    }
    const nextPreferenceRevision = invalidatesAnyEditPreference
      ? currentEditPreferenceRevision + 1
      : currentEditPreferenceRevision
    const nextPreferenceUpdatedAt = invalidatesAnyEditPreference
      ? new Date().toISOString()
      : currentEditPreferenceUpdatedAt
    if (invalidatesAnyEditPreference) {
      setIntentApproved(false)
      setCurrentEditPreferenceRevision(nextPreferenceRevision)
      setCurrentEditPreferenceUpdatedAt(nextPreferenceUpdatedAt)
    }
    persistCurrentEditSetupAfterPlanInvalidation({
      customInstructions: nextCustomInstructions,
      userInstructionHistory: nextInstructionHistory,
      sourceSequenceMode: nextSourceSequenceMode,
      aspectRatio: materialResolution.next.aspectRatio,
      frameTemplateType: materialResolution.next.frameTemplateType,
      targetPlatform: materialResolution.next.targetPlatform,
      aspectRatioConfirmed: invalidatesOutputFrame ? false : aspectRatioConfirmed,
      aspectRatioSource: invalidatesOutputFrame ? 'user_selected' : aspectRatioSource,
      editLevel: materialResolution.next.editLevel,
      editLevelConfirmed: invalidatesOutputFrame || invalidatesEditLevel ? false : editLevelConfirmed,
      visualPreference: materialResolution.next.visualPreference,
      visualPreferenceConfirmed: invalidatesOutputFrame || invalidatesEditLevel || invalidatesVisualPreference
        ? false
        : visualPreferenceConfirmed,
      workflowType: materialResolution.next.workflowType,
      cleanupPreference: materialResolution.next.cleanupPreference ?? cleanupPreference,
      cleanupPreferenceConfirmed: invalidatesOutputFrame
        ? false
        : invalidatesCleanupPreference
          ? true
          : cleanupPreferenceConfirmed,
      moodStyle: materialResolution.next.moodStyle,
      creditPreference: materialResolution.next.creditPreference,
      preferenceRevision: nextPreferenceRevision,
      preferenceUpdatedAt: nextPreferenceUpdatedAt,
    }, {
      revisionPlanContext: typedRevisionPlanContext,
    })
  }

  function handleSend() {
    applyUserPlanningInstruction(composerValue)
  }

  const cleanChatMessages = useMemo(() => {
    const messages: ReeditProChatMessage[] = [
      createAssistantTextMessage(`Tell me what you want from this ${categoryLabel} edit. I’ll keep the setup focused and show one decision at a time.`, {
        id: 'clean-message-editor-greeting',
      }),
    ]
    const canonicalJourneyVisible = canonicalJourney.loading || (
      canonicalJourney.result !== null && canonicalJourney.result.status !== 'not_configured'
    )
    if (canonicalJourneyVisible) {
      const canonicalStatus = canonicalJourney.loading
        ? 'loading'
        : canonicalJourney.result?.status === 'ready'
          ? canonicalJourney.result.journey.stage === 'private_review_accepted'
            ? 'success'
            : canonicalJourney.result.journey.stage === 'execution_in_progress' ||
                canonicalJourney.result.journey.stage === 'private_review_assembly_required'
              ? 'generating'
              : canonicalJourney.result.journey.stage === 'revision_requested' ||
                  canonicalJourney.result.journey.stage === 'replanning_required' ||
                  canonicalJourney.result.journey.stage === 'cancellation_pending'
                ? 'warning'
                : 'pending'
          : 'warning'
      messages.push(createAssistantSystemStatusMessage('', {
        id: 'clean-message-canonical-journey',
        status: canonicalStatus,
        ariaLive: canonicalJourney.loading ? 'off' : 'polite',
        cards: [{ id: 'card-canonical-journey', type: 'journey_recovery', priority: 'summary' }],
      }))
    }
    const restoredReviewMessage = restoredInternalReviewStateMessage(localProjectHandoff)
    if (restoredReviewMessage) {
      messages.push(createAssistantSystemStatusMessage(restoredReviewMessage, {
        id: 'clean-message-restored-review',
        status: cleanEditorStage === 'private_review' ? 'success' : 'pending',
      }))
    }
    const restoredRevisionContextMessage = restoredRevisionPlanContextMessage(localProjectHandoff)
    if (restoredRevisionContextMessage) {
      messages.push(createAssistantSystemStatusMessage(restoredRevisionContextMessage, {
        id: 'clean-message-restored-revision',
        status: 'pending',
      }))
    }
    if (clipsAttached && clips.length > 0) {
      messages.push(createAttachmentEventMessage(
        `${clips.length} source video${clips.length === 1 ? '' : 's'} ready for this edit.`,
        { id: 'clean-message-source-ready' },
      ))
    }
    messages.push(...runtimeMessages)

    const stageCopy: Record<CleanEditorStage, string> = {
      source: 'Start by confirming the source context.',
      frame: 'What final frame should this edit use?',
      cleanup: 'How tightly should I clean the source?',
      source_review: 'A meaning-sensitive source decision needs attention before planning can continue.',
      edit_level: 'Choose how deep the planning and creative treatment should go.',
      visual_direction: 'Choose the visual restraint for this edit.',
      reference: 'A reference is optional. Add one to study its style, or skip it.',
      planning: 'The setup is ready. I can now prepare the source and build one reviewable plan.',
      plan_review: 'Your edit plan and credit estimate are ready for review.',
      processing: 'The approved plan is being prepared as a private review.',
      private_review: 'Your private review is ready. Check playback, then approve it or request changes.',
    }
    const stageMessageOptions = {
      id: `clean-message-stage-${cleanEditorStage}`,
      status: cleanEditorStage === 'private_review'
        ? 'success' as const
        : cleanEditorStage === 'processing'
          ? 'generating' as const
          : cleanEditorStage === 'source_review'
            ? 'warning' as const
            : 'pending' as const,
    }
    if (cleanEditorStage === 'plan_review') {
      messages.push(createPlanReviewMessage(stageCopy[cleanEditorStage], stageMessageOptions))
    } else if (cleanEditorStage === 'processing') {
      messages.push(createProgressUpdateMessage(stageCopy[cleanEditorStage], stageMessageOptions))
    } else if (cleanEditorStage === 'private_review') {
      messages.push(createPreviewReadyMessage(stageCopy[cleanEditorStage], stageMessageOptions))
    } else if (cleanEditorStage === 'source_review') {
      messages.push(createAssistantSystemStatusMessage(stageCopy[cleanEditorStage], stageMessageOptions))
    } else {
      messages.push(createAssistantQuestionMessage(stageCopy[cleanEditorStage], stageMessageOptions))
    }
    return messages
  }, [
    categoryLabel,
    canonicalJourney.loading,
    canonicalJourney.result,
    cleanEditorStage,
    clips.length,
    clipsAttached,
    localProjectHandoff,
    runtimeMessages,
  ])

  function renderCleanCardsForMessage(message: ReeditProChatMessage) {
    if (message.id !== 'clean-message-canonical-journey') return null
    return (
      <CanonicalJourneyStatusCard
        {...canonicalJourney}
        executionPackageRequest={canonicalExecutionPackageRequest}
        privateEditPreparation={canonicalPrivateEditPreparation}
        privateReview={canonicalPrivateReview}
        onAcceptPrivateReview={() => void handleAcceptCanonicalPrivateReview()}
        onLoadPrivateReview={() => void handleLoadCanonicalPrivateReview()}
        onPreparePrivateEdit={() => void handlePrepareCanonicalPrivateEdit()}
        onRequestExecutionPackage={() => void handleRequestCanonicalExecutionPackage()}
        onRequestPrivateReviewRevision={(summary) =>
          void handleRequestCanonicalPrivateReviewRevision(summary)}
      />
    )
  }

  function renderCleanEditorStage() {
    switch (cleanEditorStage) {
      case 'source':
        return (
          <SourceSetup
            clips={clips}
            onAddClip={handleAddMockClip}
            onAttachFiles={handleAttachSourceFiles}
            onConfirmOrder={handleConfirmSourceOrder}
            onMoveClip={handleMoveClip}
            onRemoveClip={handleRemoveClip}
            onSetSourceSequenceMode={handleSetSourceSequenceMode}
            sourceSequenceMode={sourceSequenceMode}
          />
        )
      case 'frame':
        return (
          <FrameSetup
            onConfirm={handleConfirmAspectRatio}
            onSelect={handleAspectRatioSelect}
            selected={aspectRatio}
          />
        )
      case 'cleanup': {
        const sourceCleanupPlan = plan.sourceCleanupPlan
        const recommended = sourceCleanupPlan?.recommendedPreference.recommendedPreference
        const selected = cleanupPreference ?? sourceCleanupPlan?.selectedPreference ?? recommended
        return (
          <CleanupSetup
            onConfirm={handleConfirmCleanupPreference}
            onSelect={handleCleanupPreferenceSelect}
            options={sourceCleanupPlan?.cleanupQuestion.options ?? ['light_cleanup', 'balanced_cleanup', 'tight_retention_cleanup']}
            recommended={recommended}
            selected={selected}
          />
        )
      }
      case 'source_review':
        return (
          <section className="clean-edit-step clean-source-review" data-testid="source-review-blocker">
            <header className="clean-edit-step-header">
              <div>
                <span className="clean-edit-step-count">Review required</span>
                <h2>Protect the meaning before cutting</h2>
                <p>{plan.trimReviewPlan?.approvalBlockReasons[0] ?? 'Review the cleanup direction before the plan can continue.'}</p>
              </div>
            </header>
            <div className="clean-edit-step-actions clean-edit-step-actions-split">
              <span>Nothing will be removed or generated while this is unresolved.</span>
              <Button onClick={() => setCleanupPreferenceConfirmed(false)} variant="secondary">Change cleanup</Button>
            </div>
          </section>
        )
      case 'edit_level':
        return (
          <EditLevelSetup
            onConfirm={handleConfirmEditLevel}
            onSelect={handleEditLevelSelect}
            selected={editLevel}
          />
        )
      case 'visual_direction':
        return (
          <VisualSetup
            onConfirm={handleConfirmVisualPreference}
            onSelect={handleVisualPreferenceSelect}
            selected={visualPreference}
          />
        )
      case 'reference':
        return (
          <ReferenceSetup
            onAttach={handleReferenceAttach}
            onChangeUrl={handleReferenceUrlChange}
            onSkip={handleReferenceSkip}
            onToggleFocus={handleToggleReferenceFocus}
            selectedFocus={referenceFocusSelections}
            url={referenceUrl}
          />
        )
      case 'planning':
        return null
      case 'plan_review':
        return (
          <CanonicalPlanReviewController
            approved={approvalRecordedForPresentation}
            approvalAuthorityBlockedLabel={canonicalApprovalBlockedLabel}
            approvalAuthorityReady={canonicalApprovalAuthorityReady}
            approvalChecking={approvalChecking}
            onApprove={handleApprove}
            onAskQuestion={handleAskPlanQuestion}
            onLowerCost={handleLowerCost}
            onRemoveRealMotion={handleSimplifyMotion}
            onReviseSetup={handleReviseSetupFromPlanReview}
            planApproval={canonicalPlanningBackendConnected ? canonicalPlanApproval : undefined}
            plan={plan}
            planningPublication={canonicalPlanningBackendConnected ? canonicalPlanningPublication : undefined}
            planningContextBlockedReason={planningContextApprovalBlockedReason}
            planningContextReady={planningContextReadyForApproval}
          />
        )
      case 'processing':
        return (
          <section className="clean-edit-step clean-processing-step" data-testid="editor-processing">
            <header className="clean-edit-step-header">
              <div>
                <span className="clean-edit-step-count">Approved plan</span>
                <h2>Preparing the private review</h2>
                <p>ReeditPro is following the exact approved snapshot. Public sharing remains off.</p>
              </div>
            </header>
            <AIEditingProgressStage activeIndex={progressIndex} complete={previewReady} executionRehearsal={executionRehearsal} />
            {privateInternalTestRunError ? (
              <p className="clean-edit-inline-warning" role="alert">{hideInternalToolNamesInCopy(privateInternalTestRunError)}</p>
            ) : null}
            {canResumePrivateInternalTestRun ? (
              <div className="clean-edit-step-actions">
                <Button
                  disabled={approvalChecking || privateInternalTestRunRunning}
                  onClick={() => void handleResumePrivateInternalTestRun()}
                  variant="primary"
                >
                  {privateInternalTestRunRunning ? 'Preparing review…' : 'Resume review'}
                </Button>
              </div>
            ) : null}
          </section>
        )
      case 'private_review':
        return (
          <section className="clean-edit-step clean-private-review" data-testid="private-review">
            <header className="clean-edit-step-header">
              <div>
                <span className="clean-edit-step-count">Private review</span>
                <h2>Review the edit</h2>
                <p>Verify playback, then approve this edit or request a revision. Sharing and release remain gated.</p>
              </div>
              <span className="clean-edit-step-meta">{contextMockPreview?.creditsUsed ?? plan.creditEstimate.total} estimated credits</span>
            </header>
            {privateFinalQaSummary ? <p className="clean-review-summary">{privateFinalQaSummary}</p> : null}
            {privateInternalDownloadFile ? (
              <video
                className="private-internal-review-video clean-review-video"
                controls
                data-testid="private-internal-review-video"
                onLoadedMetadata={(event) => handlePrivateInternalReviewVideoMetadataLoaded(event.currentTarget)}
                src={privateInternalDownloadFile.objectUrl}
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="clean-review-placeholder">
                <span>Private review file</span>
                <strong>{privateInternalTestRun ? 'Ready to load' : 'Preparing review'}</strong>
              </div>
            )}
            {privateInternalDownloadError ? (
              <p className="clean-edit-inline-warning" role="alert">{privateInternalDownloadError}</p>
            ) : null}
            {privateInternalTestRun?.editDecisionManifestVerified && !privateInternalReviewDecision ? (
              <label className="clean-review-note">
                <span>Revision note</span>
                <textarea
                  maxLength={500}
                  onChange={(event) => setPrivateInternalReviewNote(event.target.value)}
                  placeholder="Required only when requesting changes"
                  rows={3}
                  value={privateInternalReviewNote}
                />
              </label>
            ) : null}
            <div className="clean-edit-step-actions clean-review-actions">
              <Button
                disabled={privateInternalDownloadLoading || Boolean(privateInternalDownloadFile)}
                onClick={handleLoadPrivateInternalDownloadFile}
                variant="primary"
              >
                {privateInternalDownloadLoading ? 'Loading review…' : privateInternalDownloadFile ? 'Review loaded' : 'Load review'}
              </Button>
              <Button disabled={!privateInternalDownloadFile} onClick={handleDownloadPrivateInternalFile} variant="secondary">
                Download MP4
              </Button>
              <Button
                disabled={!privateInternalDownloadFile || !privateInternalTestRun?.editDecisionManifestVerified || !privateInternalReviewVideoMetadata?.playable || privateInternalReviewRecording || Boolean(privateInternalReviewDecision)}
                onClick={handleAcceptPrivateInternalReview}
                variant="secondary"
              >
                {privateInternalReviewRecording ? 'Recording review…' : 'Approve edit'}
              </Button>
              <Button
                disabled={!privateInternalTestRun?.editDecisionManifestVerified || !privateInternalReviewVideoMetadata?.playable || privateInternalReviewRecording || Boolean(privateInternalReviewDecision)}
                onClick={handleRequestPrivateInternalChanges}
                variant="ghost"
              >
                Request changes
              </Button>
            </div>
            {privateInternalReviewDecision === 'accepted_for_internal_testing' ? (
              <p className="clean-review-decision">Edit approved. Sharing and release remain off until you choose a release path.</p>
            ) : null}
            {privateInternalReviewDecision === 'changes_requested' ? (
              <p className="clean-review-decision">Changes requested. A fresh plan and approval will be required for the next pass.</p>
            ) : null}
            {canRunRevisionPrivateReview ? (
              <div className="clean-edit-step-actions">
                <Button disabled={approvalChecking || privateInternalTestRunRunning} onClick={handleRunRevisionPrivateReview} variant="primary">
                  {privateInternalTestRunRunning ? 'Preparing revised review…' : 'Run revised review'}
                </Button>
              </div>
            ) : null}
          </section>
        )
    }
  }

  const chatMessages = useMemo(() => {
    const messages: ReeditProChatMessage[] = [
      createAssistantTextMessage(`I'll help shape this ${categoryLabel} edit into a clear plan before anything runs.`, {
        id: 'message-editor-greeting',
      }),
    ]
    const restoredReviewMessage = restoredInternalReviewStateMessage(localProjectHandoff)
    if (restoredReviewMessage) {
      messages.push(createAssistantSystemStatusMessage(restoredReviewMessage, {
        id: 'message-restored-internal-review-state',
        status: localProjectHandoff?.stage === 'private_review_accepted' || localProjectHandoff?.stage === 'revision_preview_ready'
          || localProjectHandoff?.stage === 'internal_edit_complete'
          ? 'success'
          : 'pending',
      }))
    }
    const restoredRevisionContextMessage = restoredRevisionPlanContextMessage(localProjectHandoff)
    if (restoredRevisionContextMessage) {
      messages.push(createAssistantSystemStatusMessage(restoredRevisionContextMessage, {
        id: 'message-restored-revision-plan-context',
        status: 'pending',
      }))
    }

    if (!editChatLockedUntilUpload) {
      messages.push(createAssistantSystemStatusMessage('Current edit status.', {
        id: 'message-workspace-progress',
        status: editWorkspaceStage === 'blocked'
          ? 'warning'
          : editWorkspaceStage === 'review_ready'
            ? 'success'
            : editWorkspaceStage === 'approved_review_building'
              ? 'generating'
              : 'pending',
        cards: [{ id: 'card-workspace-progress', type: 'progress', priority: 'required' }],
      }))
    }

    if (clipsAttached && clips.length > 0) {
      messages.push(createAttachmentEventMessage('Source video attached for this edit.', {
        id: 'message-clips-attached',
      }))
    } else {
      messages.push(createAssistantQuestionMessage(localProjectHandoff
        ? 'Upload source files to start this edit. Uploaded private files are the source media for this project.'
        : 'Create a project first, then upload source files inside its edit workspace.', {
        id: 'message-clips-needed',
        cards: [{ id: 'card-clips-needed', type: 'source_sequence', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (clipsAttached && clips.length > 0 && !sourceOrderConfirmed) {
      messages.push(createAssistantTextMessage("Got it. I'll use this order as source context and show any stronger structure in the plan.", {
        id: 'message-source-sequence',
        status: sourceOrderConfirmed ? 'success' : 'pending',
        cards: [{ id: 'card-source-sequence', type: 'source_sequence', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (setupReady && !approved && !approvedSnapshot && !progressStarted && !previewReady) {
      messages.push(createAssistantTextMessage("I'll prepare a clean, non-destructive source assembly before planning.", {
        id: 'message-footage-prep',
        status: footagePrepResult ? 'success' : 'pending',
        cards: [{ id: 'card-footage-prep', type: 'footage_prep', priority: 'summary' }],
      }))
    }

    if (sourceOrderConfirmed && !aspectRatioConfirmed) {
      messages.push(createAssistantQuestionMessage('Before I plan the visuals, what frame should this edit be built for?', {
        id: 'message-frame-question',
        status: aspectRatioConfirmed ? 'success' : 'pending',
        cards: [{ id: 'card-aspect-ratio-gate', type: 'aspect_ratio_gate', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (sourceOrderConfirmed && aspectRatioConfirmed && !cleanupReady) {
      messages.push(createAssistantQuestionMessage('How clean should the cut be?', {
        id: 'message-cleanup-question',
        status: cleanupReady ? 'success' : 'pending',
        cards: [{ id: 'card-source-cleanup', type: 'source_cleanup', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (sourceOrderConfirmed && aspectRatioConfirmed && cleanupReady && !trimReviewReady && plan.trimReviewPlan) {
      messages.push(createAssistantTextMessage("I'll check retakes and meaning-sensitive cuts before timing.", {
        id: 'message-trim-review',
        status: trimReviewReady ? 'success' : 'pending',
        cards: [{ id: 'card-trim-review', type: 'trim_review', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (sourceOrderConfirmed && aspectRatioConfirmed && cleanupReady && trimReviewReady && !editLevelConfirmed) {
      messages.push(createAssistantQuestionMessage('How deep should this edit be?', {
        id: 'message-edit-level-question',
        status: editLevelConfirmed ? 'success' : 'pending',
        cards: [{ id: 'card-edit-level', type: 'edit_level', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (sourceOrderConfirmed && aspectRatioConfirmed && editLevelConfirmed && !visualPreferenceConfirmed) {
      messages.push(createAssistantQuestionMessage('How visual should this edit feel?', {
        id: 'message-visual-preference-question',
        status: visualPreferenceConfirmed ? 'success' : 'pending',
        cards: [{ id: 'card-visual-preference', type: 'visual_preference', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (setupReady && !contextAwarePlanResult && !referenceAttached && !referenceSkipped) {
      messages.push(createAssistantQuestionMessage('Add a reference if you want me to study pacing, captions, or style.', {
        id: 'message-reference-question',
        status: referenceAttached || referenceSkipped ? 'success' : 'pending',
        cards: [
          { id: 'card-planning-context', type: 'planning_context', priority: 'summary' },
          { id: 'card-reference-controls', type: 'reference_dna', priority: 'summary' },
        ],
      }))
    }

    if (setupReady && referenceAttached) {
      messages.push(createReferenceEventMessage(`Reference: ${referenceUrl}`, {
        id: 'message-reference-event',
      }))
    }

    if (contextAwarePlanResult && showCard('video_understanding')) {
      messages.push(createAssistantTextMessage("I'll read the source first so the edit fits the footage.", {
        id: 'message-video-understanding',
        cards: [{ id: 'card-video-understanding', type: 'video_understanding', priority: 'summary' }],
      }))
    }

    if (contextAwarePlanResult && showCard('adaptive_edit_strategy')) {
      messages.push(createAssistantTextMessage("I'll choose the right treatment for each segment, not one template for everything.", {
        id: 'message-adaptive-strategy',
        cards: [{ id: 'card-adaptive-strategy', type: 'adaptive_strategy', priority: 'summary' }],
      }))
    }

    if (contextAwarePlanResult && showCard('master_timing')) {
      messages.push(createAssistantTextMessage("I'll map timing before approval so captions, visuals, and sound land cleanly.", {
        id: 'message-master-timing',
        status: plan.masterTimingPlan?.status === 'needs_frame_confirmation' ? 'warning' : 'success',
        cards: [{ id: 'card-master-timing', type: 'timing_plan', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (contextAwarePlanResult && showCard('caption_visual_cue_timing')) {
      messages.push(createAssistantTextMessage("I'll keep captions and visual cues timed to meaning.", {
        id: 'message-caption-visual-timing',
        status: plan.captionVisualCueTimingPlan?.status === 'blocked' ? 'warning' : 'success',
        cards: [{ id: 'card-caption-visual-timing', type: 'timing_plan', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (contextAwarePlanResult && showCard('soundsync_transition_timing')) {
      messages.push(createAssistantTextMessage("I'll keep transitions, SFX, and ducking speech-first, with beat sync used only when it helps the edit.", {
        id: 'message-soundsync-timing',
        status: plan.soundSyncTransitionTimingPlan?.status === 'blocked' ? 'warning' : 'success',
        cards: [{ id: 'card-soundsync-timing', type: 'timing_plan', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (contextAwarePlanResult && showCard('timing_validation')) {
      messages.push(createAssistantTextMessage("I'll validate timing before approval so the plan is safe to run.", {
        id: 'message-timing-validation',
        status: plan.timingValidationPlan?.approvalBlocked ? 'warning' : 'success',
        cards: [{ id: 'card-timing-validation', type: 'timing_plan', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (setupReady && plan.compiledIntent) {
      messages.push(createAssistantTextMessage("Here's the intent I'll use for the plan.", {
        id: 'message-compiled-intent',
        status: intentApproved ? 'approved' : 'pending',
        cards: [{ id: 'card-compiled-intent', type: 'compiled_intent', priority: 'required', requiredBeforeApproval: true }],
      }))
    }

    if (setupReady && contextAwarePlanResult) {
      messages.push(createPlanReviewMessage('Here is the edit plan before spending credits.', {
        id: 'message-plan-review',
        status: approved ? 'approved' : approvalChecking ? 'loading' : 'pending',
        cards: [
          { id: 'card-plan-review-approval', type: 'plan_review_approval', priority: 'required', requiredBeforeApproval: true },
          ...(shouldShowAdvancedPlanningDetails ? [{ id: 'card-advanced-details', type: 'advanced_details' as const, priority: 'advanced' as const }] : []),
          { id: 'card-sfx-plan-entry', type: 'sfx_plan', priority: 'advanced' },
          { id: 'card-music-plan-entry', type: 'music_plan', priority: 'advanced' },
        ],
      }))
    }

    messages.push(...runtimeMessages)

    if (approved) {
      messages.push(createProgressUpdateMessage("Plan approved. I'm preparing the review edit.", {
        id: 'message-approved-progress',
        status: previewReady ? 'success' : 'generating',
        cards: [{ id: 'card-generation-progress', type: 'generation_progress', priority: 'required' }],
      }))
    }

    if (effectivePreviewReady) {
      messages.push(createPreviewReadyMessage(
        contextMockPreview
          ? `${contextMockPreview.previewLabel ?? 'Review edit ready'}. You can inspect it, request changes, or keep refining the plan.`
          : 'Review edit ready. You can inspect it, request changes, or keep refining the plan.',
        {
          id: 'message-preview-ready',
          cards: [{ id: 'card-preview-ready', type: 'preview_ready', priority: 'required' }],
        },
      ))
    }

    messages.push(createAssistantSystemStatusMessage('Advanced details stay tucked away.', {
      id: 'message-timeline-link',
      cards: [{ id: 'card-timeline-link', type: 'timeline_link', priority: 'advanced' }],
      actions: [{ id: 'open_timeline', label: 'Show detailed timeline only if I ask', variant: 'ghost' }],
    }))

    return messages
  }, [
    approved,
    approvedSnapshot,
    approvalChecking,
    aspectRatioConfirmed,
    categoryLabel,
    cleanupReady,
    clips.length,
    clipsAttached,
    contextAwarePlanResult,
    contextMockPreview,
    editLevelConfirmed,
    editChatLockedUntilUpload,
    editWorkspaceStage,
    effectivePreviewReady,
    footagePrepResult,
    intentApproved,
    localProjectHandoff,
    plan,
    previewReady,
    progressStarted,
    referenceAttached,
    referenceSkipped,
    referenceUrl,
    runtimeMessages,
    setupReady,
    shouldShowAdvancedPlanningDetails,
    showCard,
    sourceOrderConfirmed,
    trimReviewReady,
    visualPreferenceConfirmed,
  ])

  function handleUtilityPanelToggle(panel: Exclude<EditorUtilityPanel, null>) {
    setUtilityPanel((current) => (current === panel ? null : panel))
  }

  function renderCardsForMessage(message: ReeditProChatMessage) {
    switch (message.id) {
      case 'message-workspace-progress':
        return (
          <EditWorkspaceProgressCard
            actionLabel={getWorkspaceProgressActionLabel()}
            blockedReason={editWorkspaceBlockedReason}
            completedSteps={editWorkspaceCompletedSteps}
            onAction={handleWorkspaceProgressAction}
            planningInputStatus={{
              editBriefReady: editBriefReadyForPlanning,
              editBriefStarted: editBriefGate.status !== null,
              promptCaptured: customInstructions.trim().length > 0,
              setupReady,
              sourceReady: sourceUploadComplete || (!isProjectWorkspace && clips.length > 0),
            }}
            revisionPlanContext={activeRevisionPlanContext ?? null}
            skillPlan={plan.professionalSkillPlan}
            stage={editWorkspaceStage}
          />
        )
      case 'message-clips-needed':
        return (
          <InlineSourceSequenceCard
            clips={clips}
            onAddClip={handleAddMockClip}
            onAttachFiles={handleAttachSourceFiles}
            onConfirmOrder={handleConfirmSourceOrder}
            onMoveClip={handleMoveClip}
            onRemoveClip={handleRemoveClip}
            onSetSourceSequenceMode={handleSetSourceSequenceMode}
            onUpdateClip={handleUpdateClip}
            sourceOrderConfirmed={sourceOrderConfirmed}
            sourceSequenceMode={sourceSequenceMode}
          />
        )
      case 'message-source-sequence':
        return (
          <InlineSourceSequenceCard
            clips={clips}
            onAddClip={handleAddMockClip}
            onAttachFiles={handleAttachSourceFiles}
            onConfirmOrder={handleConfirmSourceOrder}
            onMoveClip={handleMoveClip}
            onRemoveClip={handleRemoveClip}
            onSetSourceSequenceMode={handleSetSourceSequenceMode}
            onUpdateClip={handleUpdateClip}
            sourceOrderConfirmed={sourceOrderConfirmed}
            sourceSequenceMode={sourceSequenceMode}
          />
        )
      case 'message-footage-prep':
        return (
          <Suspense fallback={<AdvancedCardFallback label="Loading footage prep..." />}>
            <FootagePrepWorkspace
              canCreatePlanFromContext={canCreateContextAwarePlan}
              createPlanBlockedReason={contextPlanBlockedReason}
              editBriefOpenRequestId={editBriefOpenRequestId}
              editBriefPlanImpactNotice={Boolean(contextAwarePlanResult || approved || approvedSnapshot)}
              isRunning={footagePrepRunning}
              onAddEditBrief={handleAddEditBriefAfterFootagePrep}
              onAddEditCues={handleAddEditCuesAfterFootagePrep}
              onContextAwarePlanCreated={handleContextAwarePlanCreated}
              onContextAwarePlanInvalidated={handleContextAwarePlanInvalidated}
              onEditBriefStatusChange={handleEditBriefStatusChange}
              onContinueWithAiPlan={handleContinueAfterFootagePrep}
              onMockPreviewReady={handleMockPreviewReady}
              onReviewCleanupDecisions={handleReviewCleanupDecisionsAfterFootagePrep}
              onRunPrep={handleRunFootagePrep}
              plannerInput={plannerInput}
              prepBlockedReason={footagePrepBlockedReason}
              prepCanRun={canRunFootagePrep}
              result={footagePrepResult}
            />
          </Suspense>
        )
      case 'message-frame-question':
        return (
          <InlineAspectRatioGateCard
            aspectRatioConfirmed={aspectRatioConfirmed}
            onConfirmAspectRatio={handleConfirmAspectRatio}
            onSelectAspectRatio={handleAspectRatioSelect}
            plan={plan}
            selectedAspectRatio={aspectRatio}
          />
        )
      case 'message-cleanup-question':
        return (
          <>
            <p>I can preserve the natural behind-the-scenes feel, lightly clean dead space, tighten for retention, or aggressively remove repeats/fillers/mistakes.</p>
            <InlineSourceCleanupPlanCard
              cleanupPreferenceConfirmed={cleanupPreferenceConfirmed}
              descriptor={cardById.source_cleanup}
              onConfirmCleanupPreference={handleConfirmCleanupPreference}
              onSelectCleanupPreference={handleCleanupPreferenceSelect}
              plan={plan}
              selectedCleanupPreference={cleanupPreference}
            />
          </>
        )
      case 'message-trim-review':
        return <InlineTrimReviewCard descriptor={cardById.trim_review} plan={plan} />
      case 'message-edit-level-question':
        return (
          <Suspense fallback={<AdvancedCardFallback label="Loading edit levels..." />}>
            <InlineEditLevelCard
              confirmed={editLevelConfirmed}
              onConfirm={handleConfirmEditLevel}
              onSelect={handleEditLevelSelect}
              selectedLevel={editLevel}
            />
          </Suspense>
        )
      case 'message-visual-preference-question':
        return (
          <InlineVisualPreferenceCard
            confirmed={visualPreferenceConfirmed}
            onConfirm={handleConfirmVisualPreference}
            onSelect={handleVisualPreferenceSelect}
            selectedPreference={visualPreference}
          />
        )
      case 'message-reference-question':
        return (
          <>
            <InlinePlanningContextCard
              aspectRatio={aspectRatio}
              editLevel={editLevel}
              editLevelConfirmed={editLevelConfirmed}
              editingCategory={editingCategory}
              aspectRatioConfirmed={aspectRatioConfirmed}
              frameTemplateType={frameTemplateType}
              clips={clips}
              sourceOrderConfirmed={sourceOrderConfirmed}
              sourceSequenceMode={sourceSequenceMode}
              targetPlatform={targetPlatform}
              visualPreference={visualPreference}
            />
            <InlineReferenceDNACard
              onAttachReference={handleReferenceAttach}
              onReferenceUrlChange={handleReferenceUrlChange}
              onSkipReference={handleReferenceSkip}
              onToggleFocusOption={handleToggleReferenceFocus}
              referenceAttached={referenceAttached}
              referenceSkipped={referenceSkipped}
              referenceUrl={referenceUrl}
              selectedFocusOptions={referenceFocusSelections}
              showControls
            />
          </>
        )
      case 'message-video-understanding':
        return <InlineVideoUnderstandingCard descriptor={cardById.video_understanding} plan={plan} />
      case 'message-adaptive-strategy':
        return <InlineAdaptiveEditStrategyCard descriptor={cardById.adaptive_edit_strategy} plan={plan} />
      case 'message-master-timing':
        return <InlineMasterTimingPlanCard descriptor={cardById.master_timing} plan={plan} />
      case 'message-caption-visual-timing':
        return <InlineCaptionVisualCueTimingCard descriptor={cardById.caption_visual_cue_timing} plan={plan} />
      case 'message-soundsync-timing':
        return <InlineSoundSyncTransitionTimingCard descriptor={cardById.soundsync_transition_timing} plan={plan} />
      case 'message-timing-validation':
        return <InlineTimingValidationCard descriptor={cardById.timing_validation} plan={plan} />
      case 'message-compiled-intent':
        if (!plan.compiledIntent) {
          return null
        }

        return (
          <InlineCompiledIntentCard
            approved={intentApproved}
            intent={plan.compiledIntent}
            onApproveIntent={handleApproveIntent}
          />
        )
      case 'message-plan-review':
        return (
          <>
            <CanonicalPlanReviewController
              approved={approvalRecordedForPresentation}
              approvalAuthorityBlockedLabel={canonicalApprovalBlockedLabel}
              approvalAuthorityReady={canonicalApprovalAuthorityReady}
              approvalChecking={approvalChecking}
              onApprove={handleApprove}
              onAskQuestion={handleAskPlanQuestion}
              onLowerCost={handleLowerCost}
              onRemoveRealMotion={handleSimplifyMotion}
              onReviseSetup={handleReviseSetupFromPlanReview}
              planApproval={canonicalPlanningBackendConnected ? canonicalPlanApproval : undefined}
              plan={plan}
              planningPublication={canonicalPlanningBackendConnected ? canonicalPlanningPublication : undefined}
              planningContextBlockedReason={planningContextApprovalBlockedReason}
              planningContextReady={planningContextReadyForApproval}
            />
            {shouldShowAdvancedPlanningDetails && (
              <Suspense fallback={<AdvancedCardFallback />}>
                <AdvancedPlanningDetails
                  cardById={cardById}
                  planEditLevel={planEditLevel}
                  plannerInput={plannerInput}
                  selectedScenarioId={selectedScenarioId}
                  visibleCards={advancedVisibleCards}
                />
              </Suspense>
            )}
            <div className="sfx-plan-entry-card">
              <div>
                <span className="section-eyebrow">Sound effects</span>
                <strong>Plan sound effects inside chat</strong>
                <p>Plan subtle effects for transitions, graphics, motion, and story beats.</p>
                <small>Source-action sound stays restrained unless the plan needs it.</small>
              </div>
              <Button onClick={() => setShowSFXPlan(true)} variant={showSFXPlan ? 'secondary' : 'primary'}>
                {showSFXPlan ? 'Sound effects opened' : 'Plan sound effects'}
              </Button>
            </div>
            <div className="music-plan-entry-card">
              <div>
                <span className="section-eyebrow">Music</span>
                <strong>Plan music inside chat</strong>
                <p>Shape cue timing, mood, credits, and voice-safe mix choices.</p>
              </div>
              <Button onClick={() => setShowMusicPlan(true)} variant={showMusicPlan ? 'secondary' : 'primary'}>
                {showMusicPlan ? 'Music plan opened' : 'Plan music'}
              </Button>
            </div>
          </>
        )
      case 'message-approved-progress':
        return (
          <>
            {approvedSnapshot && (
              <p>
                Approved plan saved. Version {approvedSnapshot.snapshotVersion}.
                {editPersistenceStatus?.status === 'needs_retry'
                  ? ' The latest edit state remains in this browser and needs a recovery retry.'
                  : ''}
              </p>
            )}
            <AIEditingProgressStage activeIndex={progressIndex} complete={previewReady} executionRehearsal={executionRehearsal} />
            {privateInternalTestRunRunning && (
              <p className="inline-helper">Preparing the review edit from the approved plan. Public sharing stays off.</p>
            )}
            {privateInternalTestRunError && (
              <p className="inline-helper">Review output is blocked: {hideInternalToolNamesInCopy(privateInternalTestRunError)}</p>
            )}
            {canResumePrivateInternalTestRun && (
              <div className="inline-card-actions">
                <Button
                  disabled={approvalChecking || privateInternalTestRunRunning}
                  onClick={() => void handleResumePrivateInternalTestRun()}
                  variant="primary"
                >
                  Resume private review
                </Button>
              </div>
            )}
          </>
        )
      case 'message-preview-ready':
        return (
          <>
            <PreviewReadyCard
              creditsUsed={contextMockPreview?.creditsUsed ?? plan.creditEstimate.total}
              onOpenEditMap={handleOpenEditMap}
              privateReviewReady={Boolean(privateInternalTestRun)}
              reviewSummary={privateFinalQaSummary}
              skillPlan={plan.professionalSkillPlan}
            />
            {privateInternalTestRun && (
              <section className="inline-chat-card" data-testid="private-internal-test-run-card">
                <div className="inline-card-heading">
                  <div>
                    <span className="section-eyebrow">Review output</span>
                    <h3>Review edit ready</h3>
                  </div>
                </div>
                <p className="inline-helper">
                  A review-ready edit has been prepared from your approved plan and uploaded source files.
                </p>
                <p className="inline-helper">
                  Private review video is ready
                  {privateInternalTestRun.byteSize ? ` (${Math.round(privateInternalTestRun.byteSize / 1024)} KB)` : ''}.
                  Sharing and billing remain off until you explicitly approve a release path.
                </p>
                {privateInternalTestRun.editDecisionManifestReady && (
                  <p className="inline-helper">Plan decisions were checked against approved source, timing, captions, and review layers.</p>
                )}
                {privateReviewPreparationSummaries.length > 0 && (
                  <div className="planning-skill-preparation-list" aria-label="Private review preparation summary">
                    <strong>Preparation included</strong>
                    <ul>
                      {privateReviewPreparationSummaries.map((summary) => (
                        <li key={summary.id}>
                          <span>{summary.label}</span>
                          <small>{summary.summary}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {privateInternalTestRun.adapterGateSummary && (
                  <>
                    <PrivateReviewPreparationStatusCard
                      skillPlan={plan.professionalSkillPlan}
                      summary={privateInternalTestRun.adapterGateSummary}
                    />
                    <details className="compact-card-details">
                      <summary>Readiness details</summary>
                      <p>
                        Approved edit readiness resolved {privateInternalTestRun.adapterGateSummary.resolvedActivityCount} preparation step{privateInternalTestRun.adapterGateSummary.resolvedActivityCount === 1 ? '' : 's'}
                        {' '}with {privateInternalTestRun.adapterGateSummary.blockedActivityCount} blocker{privateInternalTestRun.adapterGateSummary.blockedActivityCount === 1 ? '' : 's'}.
                      </p>
                      {privateInternalTestRun.adapterGateSummary.blockedActivityCount > 0 && (
                        <p>
                          A safe review edit is available; blocked advanced edit activities still need approved evidence before full execution.
                        </p>
                      )}
                      {privateInternalTestRun.adapterGateSummary.privateFallbackReviewOnly && (
                        <p>
                          This review used gated activity planning. Approved readiness checks were recorded for private review only;
                          {' '}full media-processing release remains gated.
                        </p>
                      )}
                      {privateInternalTestRun.adapterGateSummary.privateRenderIntegrationReady && (
                        <p>
                          Private preparation evidence was attached to the review package for {privateInternalTestRun.adapterGateSummary.privateRenderIntegratedActivityCount ?? 0}
                          {' '}approved activit{(privateInternalTestRun.adapterGateSummary.privateRenderIntegratedActivityCount ?? 0) === 1 ? 'y' : 'ies'}.
                        </p>
                      )}
                      {(privateInternalTestRun.adapterGateSummary.backendIntegrationPendingActivityCount ?? 0) > 0 && (
                        <p>
                          {privateInternalTestRun.adapterGateSummary.backendIntegrationPendingActivityCount}
                          {' '}advanced activit{privateInternalTestRun.adapterGateSummary.backendIntegrationPendingActivityCount === 1 ? 'y' : 'ies'} still need approved execution evidence before external testing.
                        </p>
                      )}
                      {(privateInternalTestRun.adapterGateSummary.backendIntegrationBlockers?.length ?? 0) > 0 && (
                        <p>
                          Next action: resolve approved execution evidence for the remaining gated activity checks.
                        </p>
                      )}
                      {privateInternalTestRun.adapterGateSummary.serverSourceTruthRequiredForFullExecution && (
                        <p>
                          Advanced edit readiness must be verified by the approved execution service before full activity execution.
                        </p>
                      )}
                    </details>
                  </>
                )}
                {privateFinalQaSummary && (
                  <p className="inline-helper">{privateFinalQaSummary}</p>
                )}
                {privateInternalTestRun.finalRenderArtifactId && (
                  <p className="inline-helper">
                    Private review file is tracked for internal QA.
                  </p>
                )}
                {privateInternalDownloadFile && (
                  <video
                    className="private-internal-review-video"
                    controls
                    data-testid="private-internal-review-video"
                    onLoadedMetadata={(event) => handlePrivateInternalReviewVideoMetadataLoaded(event.currentTarget)}
                    src={privateInternalDownloadFile.objectUrl}
                  >
                    <track kind="captions" />
                  </video>
                )}
                {privateInternalDownloadError && (
                  <p className="inline-helper">Review video is blocked: {privateInternalDownloadError}</p>
                )}
                <div className="inline-card-actions">
                  <Button
                    disabled={privateInternalDownloadLoading || Boolean(privateInternalDownloadFile)}
                    onClick={handleLoadPrivateInternalDownloadFile}
                    variant="primary"
                  >
                    {privateInternalDownloadLoading
                      ? 'Loading review video'
                      : privateInternalDownloadFile
                        ? 'Review video loaded'
                        : 'Load review video'}
                  </Button>
                  <Button
                    disabled={!privateInternalDownloadFile}
                    onClick={handleDownloadPrivateInternalFile}
                    variant="secondary"
                  >
                    Download MP4
                  </Button>
                  <Button
                    disabled={!privateInternalManifestFile || !privateInternalTestRun.editDecisionManifestVerified}
                    onClick={handleDownloadPrivateInternalManifestFile}
                    variant="secondary"
                  >
                    Download review record
                  </Button>
                  <Button
                    disabled={!privateInternalDownloadFile || !privateInternalTestRun.editDecisionManifestVerified || !privateInternalReviewVideoMetadata?.playable || privateInternalReviewRecording || Boolean(privateInternalReviewDecision)}
                    onClick={handleAcceptPrivateInternalReview}
                    variant="secondary"
                  >
                    {privateInternalReviewRecording ? 'Recording review' : 'Approve edit'}
                  </Button>
                  <Button
                    disabled={!privateInternalTestRun.editDecisionManifestVerified || !privateInternalReviewVideoMetadata?.playable || privateInternalReviewRecording || Boolean(privateInternalReviewDecision)}
                    onClick={handleRequestPrivateInternalChanges}
                    variant="ghost"
                  >
                    Request changes
                  </Button>
                </div>
                {privateInternalDownloadFile && (
                  <p className="inline-helper">
                    Review video loaded: {privateInternalDownloadFile.fileName}
                    {privateInternalDownloadFile.byteSize ? ` (${Math.round(privateInternalDownloadFile.byteSize / 1024)} KB)` : ''}.
                  </p>
                )}
                {privateInternalManifestFile && (
                  <p className="inline-helper">
                    Review record loaded: {privateInternalManifestFile.fileName}
                    {privateInternalManifestFile.byteSize ? ` (${Math.round(privateInternalManifestFile.byteSize / 1024)} KB)` : ''}.
                  </p>
                )}
                {privateInternalTestRun.editDecisionManifestVerified && (
                  <p className="inline-helper">Review QA record verified for this video.</p>
                )}
                {privateInternalReviewVideoMetadata?.playable && (
                  <p className="inline-helper">
                    Playback check complete: {privateInternalReviewVideoMetadata.width}x{privateInternalReviewVideoMetadata.height},
                    {' '}{privateInternalReviewVideoMetadata.durationSeconds.toFixed(1)}s
                    {privateInternalTestRun.expectedReviewVideoMetadata ? ' and matched to the private review output.' : '.'}
                  </p>
                )}
                {privateInternalTestRun.editDecisionManifestVerification && (
                  <p className="inline-helper">
                    Plan verification complete with {privateInternalTestRun.editDecisionManifestVerification.sourceMediaAssetCount} private source asset{privateInternalTestRun.editDecisionManifestVerification.sourceMediaAssetCount === 1 ? '' : 's'}
                    {' '}and {privateInternalTestRun.editDecisionManifestVerification.clipDecisionCount} edit decision{privateInternalTestRun.editDecisionManifestVerification.clipDecisionCount === 1 ? '' : 's'}.
                  </p>
                )}
                {privateInternalTestRun.editDecisionManifestVerified && !privateInternalReviewDecision && (
                  <label className="planning-field">
                    <span>Review note</span>
                    <textarea
                      maxLength={500}
                      onChange={(event) => setPrivateInternalReviewNote(event.target.value)}
                      placeholder="Optional for acceptance. Required when requesting changes."
                      rows={3}
                      value={privateInternalReviewNote}
                    />
                  </label>
                )}
                {privateInternalReviewDecision === 'accepted_for_internal_testing' && (
                  <p className="inline-helper">Edit approved and recorded. Sharing and billing stay off until you approve a release path.</p>
                )}
                {privateInternalReviewDecision === 'changes_requested' && (
                  <p className="inline-helper">Changes requested and recorded. The next pass will keep the same source and review trace.</p>
                )}
                {privateInternalReviewDecision === 'changes_requested' && privateInternalReviewNote.trim() && (
                  <p className="inline-helper">Revision note: {privateInternalReviewNote.trim()}</p>
                )}
                {canRunRevisionPrivateReview && (
                  <div className="inline-card-actions">
                    <Button
                      disabled={approvalChecking || privateInternalTestRunRunning}
                      onClick={handleRunRevisionPrivateReview}
                      variant="primary"
                    >
                      {privateInternalTestRunRunning ? 'Preparing revised review' : 'Run revised review'}
                    </Button>
                  </div>
                )}
                {privateInternalTestRun.serverUserPreviewReviewId && (
                  <p className="inline-helper">
                    Review decision record is attached to this edit.
                  </p>
                )}
              </section>
            )}
            {showEditMap && (
              <Suspense fallback={<AdvancedCardFallback label="Loading preview review workspace..." />}>
                <EditReviewWorkspace
                  availableScopes={editMap.availableScopes}
                  editMapState={editMap.editMapState}
                  manifestVerified={privateInternalTestRun?.editDecisionManifestVerified === true}
                  onChangeScope={editMap.changeScope}
                  onCreateEditMap={editMap.createEditMap}
                  onDeleteElement={editMap.deleteElement}
                  onMoveElement={editMap.moveElement}
                  onRegenerateElement={editMap.regenerateElement}
                  onReplaceElementAsset={editMap.replaceElementAsset}
                  onResetEditMap={editMap.resetEditMap}
                  onRestoreElement={editMap.restoreElement}
                  onSelectElement={(elementId) => editMap.selectElement(elementId, 'preview_click')}
                  onSelectGroup={editMap.selectGroup}
                  onSelectSystem={editMap.selectSystem}
                  onSetElementVisibility={editMap.setElementVisibility}
                  onSetGroupVisibility={editMap.setGroupVisibility}
                  onSetSystemVisibility={editMap.setSystemVisibility}
                  onToggleSelectedLock={editMap.toggleSelectedLock}
                  onToggleSelectedVisibility={editMap.toggleSelectedVisibility}
                  onUpdateGroupStyle={editMap.updateGroupStyle}
                  reviewDecision={privateInternalReviewDecision}
                  reviewSummary={privateFinalQaSummary}
                  selectablePreviewElements={editMap.selectablePreviewElements}
                  selectedElement={editMap.selectedElement}
                  selectedGroup={editMap.selectedGroup}
                  selectedLabel={editMap.selectedLabel}
                  selectedSystem={editMap.selectedSystem}
                  revisionWorkflowSlot={(
                    <RevisionWorkflowPanel
                      activeApproval={revisionWorkflow.activeApproval}
                      activeCreditEstimate={revisionWorkflow.activeCreditEstimate}
                      activeJob={revisionWorkflow.activeJob}
                      manifestVerified={privateInternalTestRun?.editDecisionManifestVerified === true}
                      onAdvanceRevisionJob={revisionWorkflow.advanceRevisionJob}
                      onApproveRevision={revisionWorkflow.approveRevision}
                      onClearRevisionHistory={revisionWorkflow.clearRevisionHistory}
                      onCompleteRevisionJob={revisionWorkflow.completeRevisionJob}
                      onCreateRevision={() => revisionWorkflow.createRevisionFromOperations()}
                      onFailRevisionJob={() => revisionWorkflow.failRevisionJob()}
                      onQueueRevisionJob={revisionWorkflow.queueRevisionJob}
                      onRejectRevision={revisionWorkflow.rejectRevision}
                      onResetActiveRevision={revisionWorkflow.resetActiveRevision}
                      pendingOperations={revisionWorkflow.pendingOperations}
                      reviewDecision={privateInternalReviewDecision}
                      reviewNote={privateInternalReviewNote || localProjectHandoff?.privateReview?.reviewNote}
                      skillPlan={plan.professionalSkillPlan}
                      state={revisionWorkflow.revisionWorkflowState}
                    />
                  )}
                  exportWorkflowSlot={demoUtilityControlsEnabled ? (
                    <ExportWorkflowPanel
                      onAdvanceExportJob={exportWorkflow.advanceExportJob}
                      onApproveExport={exportWorkflow.approveExport}
                      onCompleteExportJob={exportWorkflow.completeExportJob}
                      onFailExportJob={() => exportWorkflow.failExportJob()}
                      onQueueExportJob={exportWorkflow.queueExportJob}
                      onRefreshExportReadiness={exportWorkflow.refreshExportReadiness}
                      onRejectExport={exportWorkflow.rejectExport}
                      onResetExportWorkflow={exportWorkflow.resetExportWorkflow}
                      onToggleTarget={exportWorkflow.toggleTarget}
                      onUpdateTarget={exportWorkflow.updateTarget}
                      state={exportWorkflow.exportWorkflowState}
                    />
                  ) : undefined}
                  skillPlan={plan.professionalSkillPlan}
                  summary={editMap.summary}
                />
              </Suspense>
            )}
          </>
        )
      case 'message-timeline-link':
        return (
          <div className={`chat-advanced-link ${timelineOpen ? 'chat-advanced-link-open' : ''}`.trim()}>
            {timelineOpen && (
              <div className="timeline-editor-layer" ref={timelineLayerRef}>
                <Suspense fallback={<AdvancedCardFallback label="Loading timeline..." />}>
                  <DetailedTimelineDrawer onClose={() => setTimelineOpen(false)} open={timelineOpen} />
                </Suspense>
              </div>
            )}
            <Button
              data-testid="timeline-open-trigger"
              onClick={() => {
                setTimelineOpen(true)
                onOpenTimeline?.()
              }}
              variant="ghost"
            >
              Show detailed timeline only if I ask
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section className="chat-native-editor" data-testid="editor-page">
      <MinimalProjectHeader
        activeWorkspaceView={activeWorkspaceView}
        currentEditPreferenceOverrideCount={currentEditPreferenceOverrideKeys.length}
        editBriefAvailable={Boolean(footagePrepResult)}
        editBriefStatus={editBriefGate.status}
        editPreferencesAvailable={isProjectWorkspace}
        estimateReady={Boolean(contextAwarePlanResult)}
        onOpenChat={handleOpenChatWorkspace}
        onOpenEditBrief={handleOpenEditBriefFromHeader}
        onOpenEditPreferences={handleOpenCurrentEditPreferences}
        onRetryPersistence={handleRetryEditPersistence}
        persistenceStatus={editPersistenceStatus}
        parentProjectName={isProjectWorkspace ? editorProjectName : undefined}
        projectPath={isProjectWorkspace ? `/projects/${encodeURIComponent(editorProjectId)}` : undefined}
        projectName={editorEditName}
        stage={editWorkspaceStage}
      />

      {demoUtilityControlsEnabled && (
        <section aria-label="Editor utility controls" className="editor-utility-strip" data-testid="editor-utility-strip">
          <div className="editor-utility-summary">
            <span className="section-eyebrow">Internal scenario</span>
            <strong>{selectedScenarioLoading ? 'Loading scenario...' : selectedScenario.label}</strong>
            <small>
              {selectedScenarioLoading
                ? 'Scenario controls'
                : `${categoryLabel} / ${displayMode}`}
            </small>
          </div>
          <div className="editor-utility-actions">
            <Button
              aria-controls="editor-demo-controls"
              aria-expanded={utilityPanel === 'demo'}
              onClick={() => handleUtilityPanelToggle('demo')}
              size="sm"
              variant={utilityPanel === 'demo' ? 'secondary' : 'ghost'}
            >
              Scenario library
            </Button>
            <Button
              aria-controls="editor-planning-details"
              aria-expanded={utilityPanel === 'planning'}
              onClick={() => handleUtilityPanelToggle('planning')}
              size="sm"
              variant={utilityPanel === 'planning' ? 'secondary' : 'ghost'}
            >
              Planning details
            </Button>
          </div>
          {utilityPanel === 'demo' && (
            <div className="editor-demo-controls" data-testid="editor-utility-panel" id="editor-demo-controls">
              <InlineDemoScenarioSelector onSelect={handleScenarioSelect} selectedScenarioId={selectedScenarioId} />
              {selectedScenarioLoading ? (
                <AdvancedCardFallback label="Loading scenario..." />
              ) : (
                <InlineDemoScenarioSummaryCard scenario={selectedScenario} />
              )}
              {scenarioLoadError && <p className="frame-confirmation-warning">{scenarioLoadError}</p>}
            </div>
          )}
          {utilityPanel === 'planning' && (
            <div className="editor-demo-controls editor-planning-controls" data-testid="editor-utility-panel" id="editor-planning-details">
              <InlinePlanningProgressCard
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
                phaseSummaries={phaseSummaries}
              />
            </div>
          )}
        </section>
      )}

      <div
        aria-hidden={activeWorkspaceView === 'preferences' ? 'true' : undefined}
        className="editor-workspace-layout"
        hidden={activeWorkspaceView === 'preferences'}
      >
        <div className="chat-native-shell" data-testid="editor-chat-canvas">
        {editChatLockedUntilUpload ? (
          <section className="edit-upload-gate" data-testid="edit-upload-gate">
            <input
              ref={uploadGateInputRef}
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/x-matroska,video/x-msvideo,video/mp2t,application/mxf,.mxf,.mkv,.avi,.m2ts,.mts,.ts,.m4v"
              data-testid="edit-upload-gate-input"
              hidden
              onChange={handleUploadGateFileChange}
              type="file"
            />
            <span className="section-eyebrow">Start with source</span>
            <h2>Upload source video</h2>
            <p>
              Add the footage you want ReeditPro to edit. Chat unlocks as soon as the private upload is ready.
            </p>
            {uploadGateError && (
              <p
                aria-live="assertive"
                className="clean-modal-error"
                data-testid="edit-upload-gate-error"
                role="alert"
              >
                {uploadGateError}
              </p>
            )}
            <div className="edit-upload-gate-actions">
              <Button
                disabled={sourceUploadPlanning}
                onClick={() => {
                  setUploadGateError('')
                  uploadGateInputRef.current?.click()
                }}
                variant="primary"
              >
                {sourceUploadPlanning ? 'Uploading...' : 'Choose source video'}
              </Button>
              <span>
                {sourceUploadPlanning
                  ? 'Preparing the private source for this edit.'
                  : 'MP4, MOV, M4V, or WebM · Uploading never starts editing or uses credits.'}
              </span>
            </div>
          </section>
        ) : (
          isProjectWorkspace ? (
            <ChatThread>
              <ChatMessageList messages={cleanChatMessages} renderCards={renderCleanCardsForMessage} />
              <div
                className="clean-editor-stage"
                data-editor-stage={cleanEditorStage}
                data-testid="editor-stage"
              >
                {setupReady ? (
                  <CleanPlanningPrepSurface
                    active={cleanEditorStage === 'planning'}
                    canCreatePlan={canCreateContextAwarePlan}
                    createPlanBlockedReason={contextPlanBlockedReason}
                    editBriefOpenRequestId={editBriefOpenRequestId}
                    editBriefLocked={currentEditPreferencesLocked}
                    editBriefPlanImpactNotice={Boolean(contextAwarePlanResult || approved || approvedSnapshot)}
                    initialEditBriefState={activeEditBriefState}
                    isRunning={footagePrepRunning}
                    onContextAwarePlanCreated={handleContextAwarePlanCreated}
                    onContextAwarePlanInvalidated={handleContextAwarePlanInvalidated}
                    onEditBriefStatusChange={handleEditBriefStatusChange}
                    onEditBriefStateChange={handleEditBriefStateChange}
                    onOpenEditBrief={handleAddEditBriefAfterFootagePrep}
                    onRunPrep={handleRunFootagePrep}
                    plannerInput={plannerInput}
                    prepBlockedReason={footagePrepBlockedReason}
                    prepCanRun={canRunFootagePrep}
                    result={footagePrepResult}
                  />
                ) : null}
                {cleanEditorStage === 'planning' ? null : renderCleanEditorStage()}
              </div>
            </ChatThread>
          ) : (
            <ChatThread>
              <ChatMessageList messages={chatMessages} renderCards={renderCardsForMessage} />

              {setupReady && showSFXPlan && (
                <Suspense fallback={<AdvancedCardFallback label="Loading sound effects plan..." />}>
                  <SFXPlanChatFlow />
                </Suspense>
              )}

              {setupReady && showMusicPlan && (
                <Suspense fallback={<AdvancedCardFallback label="Loading music plan..." />}>
                  <MusicPlanChatFlow />
                </Suspense>
              )}
            </ChatThread>
          )
        )}

        <div aria-hidden="true" className="chat-composer-fade" data-testid="chat-composer-fade" />
        <div aria-hidden="true" className="chat-composer-occlusion" data-testid="chat-composer-occlusion" />
        <div className="chat-composer-layer chat-composer-float-wrap" data-testid="chat-composer-layer">
          <ChatComposer
            attachmentsDisabled={sourceUploadPlanning || editChatLockedUntilUpload || composerHardBlocked}
            clipsAttached={clipsAttached}
            disabled={sourceUploadPlanning || editChatLockedUntilUpload || composerHardBlocked}
            inputValue={composerValue}
            onAttachClips={handleAddMockClip}
            onAttachFiles={handleAttachSourceFiles}
            onInputChange={setComposerValue}
            onReference={handleReferenceAttach}
            onSend={handleSend}
            placeholder={editChatLockedUntilUpload
              ? 'Upload source video to unlock chat...'
              : composerHardBlocked
                ? 'Resolve the blocker before continuing...'
                : 'Message ReeditPro...'}
          />
        </div>
        </div>
        {isProjectWorkspace && (
          <EditWorkspaceRail
            aspectRatio={aspectRatio}
            editName={editorEditName}
            estimateReady={Boolean(contextAwarePlanResult)}
            projectName={editorProjectName}
            sourceCount={Math.max(clips.length, localProjectHandoff?.sourceFileCount ?? 0)}
            stage={editWorkspaceStage}
          />
        )}
      </div>

      {activeWorkspaceView === 'preferences' && isProjectWorkspace ? (
        <CurrentEditPreferencesWorkspace
          baseline={currentEditPreferenceBaseline}
          current={currentEditPreferenceValues}
          draftPlanExists={currentEditDraftPlanExists}
          key={`${currentEditPreferenceBaseline.snapshotId}:${currentEditPreferenceRevision}:${currentEditPreferenceApplyEpoch}:${currentEditPreferencesLocked ? 'locked' : 'editable'}`}
          locked={currentEditPreferencesLocked}
          leaveRequested={pendingPreferenceDestination !== null}
          onApply={handleApplyCurrentEditPreferences}
          onCancelLeave={handleCancelCurrentEditPreferenceLeave}
          onDirtyChange={setCurrentEditPreferenceDraftDirty}
          onDiscardAndLeave={handleDiscardCurrentEditPreferenceDraftAndLeave}
          onRetryPendingApply={handleRetryPendingExactEditPreferences}
          onReturnToChat={handleOpenChatWorkspace}
          pendingApplyRecovery={Boolean(pendingExactEditPreferenceApply)}
          editSessionId={editorEditSessionId}
          projectId={editorProjectId}
          projectPersistenceScope={projectPersistenceScope}
          targetAuthority={currentEditReferenceAuthorityResolution.ready
            ? currentEditReferenceAuthorityResolution.authority
            : undefined}
          targetAuthorityBlockReason={currentEditReferenceAuthorityResolution.ready
            ? undefined
            : currentEditReferenceAuthorityResolution.blockReason}
          workspaceId={projectPersistenceScope.workspaceId}
        />
      ) : null}
    </section>
  )
}

function createUploadGateErrorMessage(message: string): string {
  const safeMessage = hideInternalToolNamesInCopy(message).trim().replace(/\s+/g, ' ')
  return `${safeMessage} Choose a supported MP4, MOV, M4V, or WebM file and try again. No plan, credits, editing, or generation started.`
}
