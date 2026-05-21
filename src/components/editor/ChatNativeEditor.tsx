import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../Button'
import { createApprovedPlanSnapshot } from '../../lib/approved-plan-snapshot'
import {
  getLocalMvpProject,
  markLocalMvpApproval,
  runLocalMvpApprovedRuntime,
  updateLocalMvpProject,
  updateLocalMvpProjectClips,
  type LocalMvpProject,
} from '../../lib/local-mvp-state'
import { createMockEditPlan, sampleClips } from '../../lib/mock-planner'
import { inferSourceSequenceMode, reorderClipsByMove, type SourceSequenceMoveDirection } from '../../lib/source-sequence'
import type {
  ClipSource,
  EditingCategory,
  SourceSequenceMode,
} from '../../types/reeditpro'
import { AIEditingProgressStage } from './AIEditingProgressStage'
import { ChatComposer } from './ChatComposer'
import { ChatMessage } from './ChatMessage'
import { ChatThread } from './ChatThread'
import { defaultChatPlannerInput, progressSteps } from './chatNativeData'
import { InlineAIQuestionCard } from './InlineAIQuestionCard'
import { InlineCreditEstimateCard } from './InlineCreditEstimateCard'
import { InlineEditPlanCard } from './InlineEditPlanCard'
import { InlinePlanningContextCard } from './InlinePlanningContextCard'
import { InlineReferenceDNACard } from './InlineReferenceDNACard'
import { InlineSourceSequenceCard } from './InlineSourceSequenceCard'
import { InlineWorkflowChoiceCard } from './InlineWorkflowChoiceCard'
import { MinimalProjectHeader } from './MinimalProjectHeader'
import { PreviewReadyCard } from './PreviewReadyCard'

const FALLBACK_WORKFLOW_LABEL = 'Real estate / property tour'

function normalizeClipOrder(clips: ClipSource[]) {
  return clips.map((clip, index) => ({ ...clip, uploadedOrder: index + 1 }))
}

function createMockClip(order: number): ClipSource {
  return {
    id: `chat-clip-${Date.now()}-${order}`,
    uploadedOrder: order,
    fileName: `chat-upload-${order}.mp4`,
    duration: '00:09',
    detectedType: 'Mock clip sent in chat',
    notes: '',
    sourceRole: order === 1 ? 'hook_candidate' : 'context',
    previewLabel: 'Mock clip',
    thumbnailHint: 'Added from chat',
  }
}

function getProjectStatusLabel(project: LocalMvpProject | undefined) {
  if (!project) return undefined
  if (project.runtime?.previewReady) return 'Runtime complete'
  if (project.runtime) return 'Runtime started'
  return 'Local MVP'
}

function getLocalProjectName(project: LocalMvpProject | undefined) {
  return project?.name?.trim() || defaultChatPlannerInput.projectName
}

type ChatNativeEditorProps = {
  onOpenTimeline: () => void
}

export function ChatNativeEditor({ onOpenTimeline }: ChatNativeEditorProps) {
  const [searchParams] = useSearchParams()
  const projectIdFromQuery = searchParams.get('projectId')
  const localProjectAtLoad = getLocalMvpProject(projectIdFromQuery)
  const initialClips = localProjectAtLoad?.sourceClips.length ? localProjectAtLoad.sourceClips : sampleClips
  const initialInstructions = localProjectAtLoad?.customInstructions?.trim() || defaultChatPlannerInput.customInstructions

  const [localMvpProject, setLocalMvpProject] = useState<LocalMvpProject | undefined>(localProjectAtLoad)
  const [clips, setClips] = useState<ClipSource[]>(initialClips)
  const [composerValue, setComposerValue] = useState('Make the captions smaller and keep the Real Motion subtle.')
  const [customInstructions, setCustomInstructions] = useState(initialInstructions)
  const [clipsAttached, setClipsAttached] = useState(initialClips.length > 0)
  const [sourceOrderConfirmed, setSourceOrderConfirmed] = useState(Boolean(localProjectAtLoad?.approvals.sourceOrderConfirmed))
  const [sourceSequenceMode, setSourceSequenceMode] = useState<SourceSequenceMode>(() =>
    inferSourceSequenceMode(initialClips, initialInstructions),
  )
  const [referenceAttached, setReferenceAttached] = useState(true)
  const [referenceUrl, setReferenceUrl] = useState(defaultChatPlannerInput.referenceUrl)
  const [editingCategory, setEditingCategory] = useState<EditingCategory>(localProjectAtLoad?.editingCategory ?? defaultChatPlannerInput.editingCategory)
  const [workflowChoice, setWorkflowChoice] = useState(FALLBACK_WORKFLOW_LABEL)
  const [approved, setApproved] = useState(Boolean(localProjectAtLoad?.approvals.planApproved && localProjectAtLoad?.approvals.creditsApproved))
  const [progressStarted, setProgressStarted] = useState(Boolean(localProjectAtLoad?.runtime))
  const [progressIndex, setProgressIndex] = useState(localProjectAtLoad?.runtime?.previewReady ? progressSteps.length - 1 : 0)
  const [previewReady, setPreviewReady] = useState(Boolean(localProjectAtLoad?.runtime?.previewReady))
  const [revisionMessage, setRevisionMessage] = useState('')
  const [runtimeEvents, setRuntimeEvents] = useState<string[]>(localProjectAtLoad?.runtime?.events ?? [])
  const [runtimeWarnings, setRuntimeWarnings] = useState<string[]>(localProjectAtLoad?.runtime?.warnings ?? [])
  const [runtimeReservationId, setRuntimeReservationId] = useState(localProjectAtLoad?.runtime?.creditReservationId)
  const progressTimerRef = useRef<number | null>(null)

  const plannerInput = useMemo(
    () => ({
      ...defaultChatPlannerInput,
      aspectRatioConfirmed: true,
      aspectRatioSource: 'user_selected' as const,
      cleanupPreference: 'balanced_cleanup' as const,
      cleanupPreferenceConfirmed: true,
      clips,
      customInstructions,
      editingCategory,
      projectName: getLocalProjectName(localMvpProject),
      referenceUrl: referenceAttached ? referenceUrl : '',
      sourceOrderConfirmed,
      sourceSequenceMode,
    }),
    [
      clips,
      customInstructions,
      editingCategory,
      localMvpProject,
      referenceAttached,
      referenceUrl,
      sourceOrderConfirmed,
      sourceSequenceMode,
    ],
  )

  const plan = useMemo(() => createMockEditPlan(plannerInput), [plannerInput])

  useEffect(() => {
    if (localMvpProject || !progressStarted || previewReady) {
      return
    }

    progressTimerRef.current = window.setTimeout(() => {
      setProgressIndex((current) => {
        if (current >= progressSteps.length - 1) {
          setPreviewReady(true)
          setRuntimeEvents((events) => [...events, 'Mock preview prepared. No real rendering or provider call was made.'])
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
  }, [localMvpProject, previewReady, progressIndex, progressStarted])

  function persistLocalProject(updates: Partial<Omit<LocalMvpProject, 'id' | 'createdAt'>>) {
    if (!localMvpProject) return undefined
    const updated = updateLocalMvpProject(localMvpProject.id, updates)
    if (updated) setLocalMvpProject(updated)
    return updated
  }

  function resetApprovalFlow() {
    setApproved(false)
    setProgressStarted(false)
    setPreviewReady(false)
    setProgressIndex(0)
    setRuntimeEvents([])
    setRuntimeWarnings([])
    setRuntimeReservationId(undefined)

    if (localMvpProject) {
      persistLocalProject({
        approvals: {
          ...localMvpProject.approvals,
          planApproved: false,
          creditsApproved: false,
          approvedAt: undefined,
          approvedSnapshotVersion: undefined,
        },
        runtime: undefined,
        status: 'planning',
      })
    }
  }

  function persistClips(nextClips: ClipSource[]) {
    const ordered = normalizeClipOrder(nextClips)
    setClips(ordered)
    setClipsAttached(ordered.length > 0)
    setSourceSequenceMode(inferSourceSequenceMode(ordered, customInstructions))
    setSourceOrderConfirmed(false)

    if (localMvpProject) {
      const updated = updateLocalMvpProjectClips(localMvpProject.id, ordered)
      if (updated) setLocalMvpProject(updated)
    }

    resetApprovalFlow()
  }

  function handleAddMockClip() {
    persistClips([...clips, createMockClip(clips.length + 1)])
  }

  function handleMoveClip(id: string, direction: SourceSequenceMoveDirection) {
    persistClips(reorderClipsByMove(clips, id, direction))
  }

  function handleRemoveClip(id: string) {
    persistClips(clips.filter((clip) => clip.id !== id))
  }

  function handleUpdateClip(id: string, updates: Partial<ClipSource>) {
    persistClips(clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)))
  }

  function handleConfirmSourceOrder() {
    setSourceOrderConfirmed(true)

    if (localMvpProject) {
      const updated = markLocalMvpApproval(localMvpProject.id, {
        sourceOrderConfirmed: true,
        planApproved: false,
        creditsApproved: false,
      })
      if (updated) setLocalMvpProject(updated)
    }
  }

  function handleSetSourceSequenceMode(mode: SourceSequenceMode) {
    setSourceSequenceMode(mode)
    setSourceOrderConfirmed(false)
    resetApprovalFlow()
  }

  function handleAttachReference() {
    setReferenceAttached(true)
    setReferenceUrl((current) => current || 'https://example.com/mock-clean-product-reference')
    resetApprovalFlow()
  }

  function handleSkipReference() {
    setReferenceAttached(false)
    resetApprovalFlow()
  }

  function handleEditingCategorySelect(value: EditingCategory) {
    setEditingCategory(value)
    setWorkflowChoice(value.replaceAll('_', ' '))
    resetApprovalFlow()
  }

  async function handleApprove() {
    if (!sourceOrderConfirmed) {
      setRevisionMessage('Confirm the source order first so ReeditPro can freeze the source sequence before approving credits.')
      return
    }

    setApproved(true)
    setProgressStarted(true)
    setPreviewReady(false)
    setProgressIndex(0)
    setRuntimeEvents(['Plan and credit estimate approved.'])
    setRuntimeWarnings([])
    setRevisionMessage('')

    if (!localMvpProject) {
      return
    }

    const approvedProject = markLocalMvpApproval(localMvpProject.id, {
      sourceOrderConfirmed: true,
      aspectRatioConfirmed: true,
      cleanupConfirmed: true,
      editLevelConfirmed: true,
      visualPreferenceConfirmed: true,
      planApproved: true,
      creditsApproved: true,
      approvedAt: new Date().toISOString(),
    })

    if (approvedProject) {
      setLocalMvpProject(approvedProject)
    }

    let approvedSnapshotVersion: string | undefined

    try {
      approvedSnapshotVersion = createApprovedPlanSnapshot({
        approvedBy: localMvpProject.userId,
        editSessionId: `local-session-${localMvpProject.id}`,
        plan,
        projectId: localMvpProject.id,
      }).editPlanVersionId
    } catch (error) {
      setRuntimeWarnings((warnings) => [
        ...warnings,
        error instanceof Error ? error.message : 'Approved snapshot creation stayed mock-only.',
      ])
    }

    const runtimeResult = await runLocalMvpApprovedRuntime({
      approvedSnapshotVersion,
      credits: plan.creditEstimate.total,
      projectId: localMvpProject.id,
    })

    if (runtimeResult.project) {
      setLocalMvpProject(runtimeResult.project)
    }

    setRuntimeEvents(runtimeResult.events)
    setRuntimeWarnings(runtimeResult.warnings)
    setRuntimeReservationId(runtimeResult.project?.runtime?.creditReservationId ?? runtimeResult.creditReservation?.id)
    setPreviewReady(runtimeResult.ok)
    setProgressIndex(runtimeResult.ok ? progressSteps.length - 1 : Math.min(3, progressSteps.length - 1))

    if (!runtimeResult.ok) {
      setApproved(false)
      setRevisionMessage(runtimeResult.message)
    }
  }

  function handleLowerCost() {
    setRevisionMessage('I can lower the cost by removing Real Motion, keeping SoundSync light, and using captions plus basic cleanup.')
  }

  function handleRemoveRealMotion() {
    setRevisionMessage('Real Motion removed from the proposed plan. The edit can stay premium with captions, clean cuts, and subtle Graphic Design overlays.')
  }

  function handleSend() {
    const message = composerValue.trim()
    if (!message) return

    setRevisionMessage(message)
    setCustomInstructions(message)
    setComposerValue('')

    if (localMvpProject) {
      const updated = updateLocalMvpProject(localMvpProject.id, {
        customInstructions: message,
        status: 'planning',
        runtime: undefined,
      })
      if (updated) setLocalMvpProject(updated)
    }

    resetApprovalFlow()
  }

  const userIntro = customInstructions || defaultChatPlannerInput.customInstructions
  const projectName = getLocalProjectName(localMvpProject)
  const headerCredits = localMvpProject ? plan.creditEstimate.total : 114

  return (
    <section className="chat-native-editor">
      <MinimalProjectHeader
        approved={approved}
        credits={headerCredits}
        previewReady={previewReady}
        projectName={projectName}
        runtimeStatus={getProjectStatusLabel(localMvpProject)}
      />

      <ChatThread>
        <ChatMessage role="user">
          <p>{userIntro}</p>
        </ChatMessage>

        <ChatMessage role="user">
          <p>Attached {clips.length} {localMvpProject ? 'local source' : 'mock'} clips in the order I filmed them.</p>
        </ChatMessage>

        <ChatMessage role="ai">
          <p>Got it. I will treat these clips as your source sequence and preserve the walkthrough feel unless there is a stronger structure worth suggesting.</p>
          {clipsAttached && (
            <InlineSourceSequenceCard
              clips={clips}
              onAddClip={handleAddMockClip}
              onConfirmOrder={handleConfirmSourceOrder}
              onMoveClip={handleMoveClip}
              onRemoveClip={handleRemoveClip}
              onSetSourceSequenceMode={handleSetSourceSequenceMode}
              onUpdateClip={handleUpdateClip}
              sourceOrderConfirmed={sourceOrderConfirmed}
              sourceSequenceMode={sourceSequenceMode}
            />
          )}
        </ChatMessage>

        <ChatMessage role="ai">
          <p>Do you want me to use a workflow context or just follow your written instructions?</p>
          <InlineAIQuestionCard onSelect={handleEditingCategorySelect} selectedCategory={editingCategory} />
          <InlineWorkflowChoiceCard selectedWorkflow={workflowChoice} />
        </ChatMessage>

        <ChatMessage role="ai">
          <p>You can paste a reference video link or skip it. I will study the style without copying it shot-for-shot.</p>
          <InlineReferenceDNACard />
          <div className="inline-card-actions">
            <Button onClick={handleAttachReference} size="sm" variant="secondary">Attach mock reference</Button>
            <Button onClick={handleSkipReference} size="sm" variant="ghost">Skip reference</Button>
          </div>
        </ChatMessage>

        {referenceAttached && (
          <ChatMessage role="user">
            <p>Reference: {referenceUrl}</p>
          </ChatMessage>
        )}

        <ChatMessage role="ai">
          <InlinePlanningContextCard
            aspectRatio={defaultChatPlannerInput.aspectRatio}
            aspectRatioConfirmed
            clips={clips}
            editLevel={defaultChatPlannerInput.editLevel}
            editLevelConfirmed
            editingCategory={editingCategory}
            frameTemplateType={defaultChatPlannerInput.frameTemplateType ?? 'vertical_talking_head_lower_panel'}
            sourceOrderConfirmed={sourceOrderConfirmed}
            sourceSequenceMode={sourceSequenceMode}
            targetPlatform={defaultChatPlannerInput.targetPlatform}
            visualPreference={defaultChatPlannerInput.visualPreference}
          />
        </ChatMessage>

        <ChatMessage role="ai">
          <p>Here is the edit plan before spending credits.</p>
          <InlineEditPlanCard
            onApprove={handleApprove}
            onLowerCost={handleLowerCost}
            onRemoveRealMotion={handleRemoveRealMotion}
            plan={plan}
          />
          <InlineCreditEstimateCard
            approved={approved}
            estimate={plan.creditEstimate}
            onApprove={handleApprove}
            onLowerCost={handleLowerCost}
          />
        </ChatMessage>

        {revisionMessage && (
          <ChatMessage role="ai">
            <p>{revisionMessage}</p>
          </ChatMessage>
        )}

        {progressStarted && (
          <ChatMessage role="ai">
            <p>{previewReady ? 'Mock runtime complete.' : 'Plan approved. ReeditPro is running the mock runtime path now.'}</p>
            <AIEditingProgressStage
              activeIndex={progressIndex}
              complete={previewReady}
              events={runtimeEvents}
              reservationId={runtimeReservationId}
              warnings={runtimeWarnings}
            />
          </ChatMessage>
        )}

        {previewReady && (
          <ChatMessage role="ai">
            <p>Preview ready. You can play it, request a revision, export, or keep chatting.</p>
            <PreviewReadyCard creditsUsed={plan.creditEstimate.total} runtimeEvents={runtimeEvents} />
          </ChatMessage>
        )}

        <div className="chat-advanced-link">
          <Button onClick={onOpenTimeline} variant="ghost">
            Show detailed timeline only if I ask
          </Button>
          <span>Advanced view stays hidden by default.</span>
        </div>
      </ChatThread>

      <ChatComposer
        clipsAttached={clipsAttached}
        inputValue={composerValue}
        onAttachClips={handleAddMockClip}
        onInputChange={setComposerValue}
        onReference={handleAttachReference}
        onSend={handleSend}
      />

      <div className="chat-native-rule-card">
        <Sparkles size={18} />
        <span>The chat is the editor. Inline cards appear only for clips, choices, plan approval, credits, progress, and preview.</span>
      </div>
    </section>
  )
}
