import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../Button'
import { createApprovedPlanSnapshot } from '../../lib/approved-plan-snapshot'
import { getChatPlanningCards, getChatPlanningPhaseSummaries, shouldShowCard } from '../../lib/chat-planning-flow'
import { demoScenarios, getDemoScenarioById, getDefaultDemoScenario } from '../../lib/demo-scenarios'
import { createMockEditPlan } from '../../lib/mock-planner'
import { runPlannerRegression } from '../../lib/planner-regression'
import { validateMockEditPlan } from '../../lib/planner-validation'
import { launchEditingCategories } from '../../lib/product-taxonomy'
import { inferSourceSequenceMode, reorderClipsByMove } from '../../lib/source-sequence'
import type { ApprovedPlanSnapshot } from '../../types/edit-planning-db'
import type {
  AspectRatio,
  ChatPlanningDisplayMode,
  ClipSource,
  CreditPreference,
  EditLevel,
  EditingCategory,
  FrameTemplateType,
  MoodStyle,
  SourceSequenceMode,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../../types/reeditpro'
import { AIEditingProgressStage } from './AIEditingProgressStage'
import { ChatComposer } from './ChatComposer'
import { ChatMessage } from './ChatMessage'
import { ChatThread } from './ChatThread'
import { defaultChatPlannerInput, progressSteps } from './chatNativeData'
import { InlineCompiledIntentCard } from './InlineCompiledIntentCard'
import { InlineCharacterConsistencyCard } from './InlineCharacterConsistencyCard'
import { InlineCreditEstimateCard } from './InlineCreditEstimateCard'
import { InlineDemoScenarioSelector } from './InlineDemoScenarioSelector'
import { InlineDemoScenarioSummaryCard } from './InlineDemoScenarioSummaryCard'
import { InlineDocumentaryFactSafetyCard } from './InlineDocumentaryFactSafetyCard'
import { InlineEditLevelCard } from './InlineEditLevelCard'
import { InlineEditPlanCard } from './InlineEditPlanCard'
import { InlineFrameFormatCard } from './InlineFrameFormatCard'
import { InlinePlanningContextCard } from './InlinePlanningContextCard'
import { InlinePlanningProgressCard } from './InlinePlanningProgressCard'
import { InlinePlanValidationCard } from './InlinePlanValidationCard'
import { InlinePlannerRegressionCard } from './InlinePlannerRegressionCard'
import { InlinePromptPreviewCard } from './InlinePromptPreviewCard'
import { InlineQAPlanCard } from './InlineQAPlanCard'
import { InlineReferenceDNACard } from './InlineReferenceDNACard'
import { InlineRendererPlanCard } from './InlineRendererPlanCard'
import { InlineSegmentEditPlanCard } from './InlineSegmentEditPlanCard'
import { InlineSourceSequenceCard } from './InlineSourceSequenceCard'
import { InlineVisualAssetPlanCard } from './InlineVisualAssetPlanCard'
import { InlineVisualPreferenceCard } from './InlineVisualPreferenceCard'
import { MinimalProjectHeader } from './MinimalProjectHeader'
import { PreviewReadyCard } from './PreviewReadyCard'

function normalizeClipOrder(clips: ClipSource[]) {
  return clips.map((clip, index) => ({ ...clip, uploadedOrder: index + 1 }))
}

function isEditingCategory(value: string | null): value is EditingCategory {
  return launchEditingCategories.some((category) => category.value === value)
}

function getCategoryLabel(value: EditingCategory) {
  return launchEditingCategories.find((category) => category.value === value)?.label ?? 'Storytelling'
}

function getInitialDemoScenario(categoryValue: string | null) {
  if (isEditingCategory(categoryValue)) {
    return demoScenarios.find((scenario) => scenario.editingCategory === categoryValue) ?? getDefaultDemoScenario()
  }

  return getDefaultDemoScenario()
}

type ChatNativeEditorProps = {
  onOpenTimeline: () => void
}

export function ChatNativeEditor({ onOpenTimeline }: ChatNativeEditorProps) {
  const [searchParams] = useSearchParams()
  const categoryFromQuery = searchParams.get('category')
  const initialScenario = getInitialDemoScenario(categoryFromQuery)

  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenario.id)
  const [displayMode, setDisplayMode] = useState<ChatPlanningDisplayMode>('guided')
  const [clips, setClips] = useState<ClipSource[]>(initialScenario.clips)
  const [sourceSequenceMode, setSourceSequenceMode] = useState<SourceSequenceMode>(() =>
    inferSourceSequenceMode(initialScenario.clips, initialScenario.customInstructions),
  )
  const [composerValue, setComposerValue] = useState(initialScenario.customInstructions)
  const [customInstructions, setCustomInstructions] = useState(initialScenario.customInstructions)
  const [clipsAttached, setClipsAttached] = useState(true)
  const [sourceOrderConfirmed, setSourceOrderConfirmed] = useState(false)
  const [referenceAttached, setReferenceAttached] = useState(initialScenario.referenceAttached)
  const [referenceUrl, setReferenceUrl] = useState(initialScenario.referenceUrl)
  const [editingCategory, setEditingCategory] = useState<EditingCategory>(initialScenario.editingCategory)
  const [editLevel, setEditLevel] = useState<EditLevel>(initialScenario.editLevel)
  const [editLevelConfirmed, setEditLevelConfirmed] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>(initialScenario.targetPlatform)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialScenario.aspectRatio)
  const [frameTemplateType, setFrameTemplateType] = useState<FrameTemplateType>(initialScenario.frameTemplateType)
  const [formatConfirmed, setFormatConfirmed] = useState(false)
  const [visualPreference, setVisualPreference] = useState<VisualPreference>(initialScenario.visualPreference)
  const [visualPreferenceConfirmed, setVisualPreferenceConfirmed] = useState(false)
  const [workflowType, setWorkflowType] = useState<VideoWorkflowType>(initialScenario.workflowType)
  const [moodStyle, setMoodStyle] = useState<MoodStyle>(initialScenario.moodStyle)
  const [creditPreference, setCreditPreference] = useState<CreditPreference>(initialScenario.creditPreference)
  const [intentApproved, setIntentApproved] = useState(false)
  const [approved, setApproved] = useState(false)
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedPlanSnapshot | null>(null)
  const [progressStarted, setProgressStarted] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)
  const [previewReady, setPreviewReady] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState('')
  const progressTimerRef = useRef<number | null>(null)

  const plannerInput = useMemo(
    () => ({
      ...defaultChatPlannerInput,
      aspectRatio,
      clips,
      creditPreference,
      customInstructions,
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
      clips,
      creditPreference,
      customInstructions,
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
    ],
  )

  const plan = useMemo(() => createMockEditPlan(plannerInput), [plannerInput])
  const validationReport = useMemo(() => validateMockEditPlan({ input: plannerInput, plan, scenarioId: selectedScenarioId }), [plannerInput, plan, selectedScenarioId])
  const regressionReport = useMemo(() => runPlannerRegression(), [])
  const planningCards = useMemo(
    () =>
      getChatPlanningCards({
        approved,
        clipsAttached,
        editLevelConfirmed,
        formatConfirmed,
        intentApproved,
        plan,
        previewReady,
        regressionReport,
        selectedScenarioId,
        clipCount: clips.length,
        sourceOrderConfirmed,
        validationReport,
        visualPreferenceConfirmed,
      }),
    [
      approved,
      clipsAttached,
      editLevelConfirmed,
      formatConfirmed,
      intentApproved,
      plan,
      previewReady,
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
  const selectedScenario = getDemoScenarioById(selectedScenarioId) ?? getDefaultDemoScenario()
  const planEditLevel = plan.compiledIntent?.resolvedSettings.editLevel ?? editLevel
  const categoryLabel = getCategoryLabel(editingCategory)
  const setupReady = sourceOrderConfirmed && formatConfirmed && editLevelConfirmed && visualPreferenceConfirmed

  function showCard(id: string) {
    return shouldShowCard(cardById[id], displayMode)
  }

  useEffect(() => {
    if (!progressStarted || previewReady) {
      return
    }

    progressTimerRef.current = window.setTimeout(() => {
      setProgressIndex((current) => {
        if (current >= progressSteps.length - 1) {
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
  }, [progressIndex, progressStarted, previewReady])

  function resetPlanProgress() {
    setIntentApproved(false)
    setApproved(false)
    setApprovedSnapshot(null)
    setProgressStarted(false)
    setPreviewReady(false)
    setProgressIndex(0)
  }

  function resetAfterSourceChange() {
    setSourceOrderConfirmed(false)
    resetPlanProgress()
  }

  function updateInferredSourceSequenceMode(nextClips: ClipSource[], instructions = customInstructions) {
    setSourceSequenceMode((currentMode) =>
      currentMode === 'unordered_clips_needs_ai_help'
        ? currentMode
        : inferSourceSequenceMode(nextClips, instructions),
    )
  }

  function handleScenarioSelect(scenarioId: string) {
    const scenario = getDemoScenarioById(scenarioId)

    if (!scenario) {
      return
    }

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
    setCustomInstructions(scenario.customInstructions)
    setComposerValue(scenario.customInstructions)
    setClips(scenario.clips)
    setSourceSequenceMode(inferSourceSequenceMode(scenario.clips, scenario.customInstructions))
    setClipsAttached(true)
    setSourceOrderConfirmed(false)
    setFormatConfirmed(false)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    setRevisionMessage('')
    resetPlanProgress()
  }

  function handleAddMockClip() {
    setClipsAttached(true)
    const next = normalizeClipOrder([
      ...clips,
      {
        id: `chat-clip-${Date.now()}`,
        uploadedOrder: clips.length + 1,
        fileName: `chat-upload-${clips.length + 1}.mp4`,
        duration: '00:09',
        detectedType: 'Mock clip sent in chat',
        notes: '',
        sourceRole: 'unknown',
      },
    ])
    setClips(next)
    updateInferredSourceSequenceMode(next)
    resetAfterSourceChange()
  }

  function handleMoveClip(id: string, direction: 'left' | 'right' | 'up' | 'down') {
    const next = reorderClipsByMove(clips, id, direction)
    setClips(next)
    updateInferredSourceSequenceMode(next)
    resetAfterSourceChange()
  }

  function handleRemoveClip(id: string) {
    const next = normalizeClipOrder(clips.filter((clip) => clip.id !== id))
    setClips(next)
    updateInferredSourceSequenceMode(next)
    resetAfterSourceChange()
  }

  function handleUpdateClip(id: string, updates: Partial<ClipSource>) {
    const next = clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip))
    setClips(next)
    updateInferredSourceSequenceMode(next)
    resetAfterSourceChange()
  }

  function handleSetSourceSequenceMode(mode: SourceSequenceMode) {
    setSourceSequenceMode(mode)
    resetAfterSourceChange()
  }

  function handleConfirmSourceOrder() {
    setSourceOrderConfirmed(true)
    resetPlanProgress()
  }

  function handleFrameFormatSelect(platform: TargetPlatform, ratio: AspectRatio, frameTemplate: FrameTemplateType) {
    setTargetPlatform(platform)
    setAspectRatio(ratio)
    setFrameTemplateType(frameTemplate)
    setFormatConfirmed(false)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    resetPlanProgress()
  }

  function handleConfirmFormat() {
    setFormatConfirmed(true)
    resetPlanProgress()
  }

  function handleEditLevelSelect(value: EditLevel) {
    setEditLevel(value)
    setEditLevelConfirmed(false)
    setVisualPreferenceConfirmed(false)
    resetPlanProgress()
  }

  function handleConfirmEditLevel() {
    setEditLevelConfirmed(true)
    resetPlanProgress()
  }

  function handleVisualPreferenceSelect(value: VisualPreference) {
    setVisualPreference(value)
    setVisualPreferenceConfirmed(false)
    resetPlanProgress()
  }

  function handleConfirmVisualPreference() {
    setVisualPreferenceConfirmed(true)
    resetPlanProgress()
  }

  function handleApproveIntent() {
    setIntentApproved(true)
  }

  function handleReferenceAttach() {
    setReferenceAttached(true)
    if (!referenceUrl) {
      setReferenceUrl(selectedScenario.referenceUrl || defaultChatPlannerInput.referenceUrl)
    }
    resetPlanProgress()
  }

  function handleApprove() {
    setApprovedSnapshot(
      createApprovedPlanSnapshot({
        approvedBy: 'mock-user',
        editSessionId: 'mock-edit-session',
        plan,
        projectId: 'mock-project',
      }),
    )
    setApproved(true)
    setProgressStarted(true)
    setPreviewReady(false)
    setProgressIndex(0)
  }

  function handleLowerCost() {
    const alternatives = plan.creditEstimate.lowerCostAlternatives ?? []

    if (alternatives.length > 0) {
      setRevisionMessage(
        `I can lower the estimate by ${alternatives
          .slice(0, 3)
          .map((alternative) => `${alternative.label.toLowerCase()} (${alternative.actionHint.toLowerCase()})`)
          .join(', ')}. I will not change the plan or start generation until you approve a revised estimate.`,
      )
      return
    }

    setRevisionMessage('I can lower the estimate by simplifying generated visual assets and reducing fallback depth. I will not change the plan or start generation until you approve a revised estimate.')
  }

  function handleRemoveRealMotion() {
    setRevisionMessage('Real Motion removed from the proposed plan. I would replace it with Graphic Design / VisualExplain or still-with-editor-motion in a lower-cost revision.')
  }

  function handleSend() {
    const nextMessage = composerValue.trim()
    setCustomInstructions(nextMessage)
    setRevisionMessage(nextMessage)
    setComposerValue('')
    setSourceSequenceMode(inferSourceSequenceMode(clips, nextMessage))
    resetPlanProgress()
  }

  return (
    <section className="chat-native-editor">
      <MinimalProjectHeader approved={approved} credits={plan.creditEstimate.total} previewReady={previewReady} />

      <div className="chat-native-shell">
        <ChatThread>
          <ChatMessage role="ai">
            <InlineDemoScenarioSelector
              onSelect={handleScenarioSelect}
              selectedScenarioId={selectedScenarioId}
            />
          </ChatMessage>

          <ChatMessage role="ai">
            <InlineDemoScenarioSummaryCard scenario={selectedScenario} />
          </ChatMessage>

          <ChatMessage role="ai">
            <InlinePlanningProgressCard
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              phaseSummaries={phaseSummaries}
            />
          </ChatMessage>

          <ChatMessage role="ai">
            <p>I see you're creating a {categoryLabel} edit. Upload your video or clips, then I'll help you build the edit plan.</p>
          </ChatMessage>

          {clipsAttached && clips.length > 0 ? (
            <ChatMessage role="user">
              <p>Attached clips in the order I uploaded them.</p>
            </ChatMessage>
          ) : (
            <ChatMessage role="ai">
              <p>Upload your video or clips to start. This demo uses mock clips.</p>
              <button className="inline-add-clip" onClick={handleAddMockClip} type="button">
                Attach sample clips
              </button>
            </ChatMessage>
          )}

          {clipsAttached && clips.length > 0 && (
            <ChatMessage role="ai">
              <p>Got it. I'll treat these as your source sequence first, then I can suggest a stronger final structure in the plan.</p>
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
            </ChatMessage>
          )}

          {sourceOrderConfirmed && (
            <ChatMessage role="ai">
              <p>Where is this video going?</p>
              <InlineFrameFormatCard
                confirmed={formatConfirmed}
                onConfirm={handleConfirmFormat}
                onSelect={handleFrameFormatSelect}
                selectedAspectRatio={aspectRatio}
                selectedFrameTemplate={frameTemplateType}
                selectedPlatform={targetPlatform}
              />
            </ChatMessage>
          )}

          {sourceOrderConfirmed && formatConfirmed && (
            <ChatMessage role="ai">
              <p>How deep should this edit be?</p>
              <InlineEditLevelCard
                confirmed={editLevelConfirmed}
                onConfirm={handleConfirmEditLevel}
                onSelect={handleEditLevelSelect}
                selectedLevel={editLevel}
              />
            </ChatMessage>
          )}

          {sourceOrderConfirmed && formatConfirmed && editLevelConfirmed && (
            <ChatMessage role="ai">
              <p>Do you want me to keep visuals minimal, use a balanced visual mix, or lean into one of our signature systems?</p>
              <InlineVisualPreferenceCard
                confirmed={visualPreferenceConfirmed}
                onConfirm={handleConfirmVisualPreference}
                onSelect={handleVisualPreferenceSelect}
                selectedPreference={visualPreference}
              />
            </ChatMessage>
          )}

          {setupReady && (
            <ChatMessage role="ai">
              <p>You can paste a reference video. I'll study the style without copying it shot-for-shot. What should I know before planning the edit?</p>
              <InlinePlanningContextCard
                aspectRatio={aspectRatio}
                editLevel={editLevel}
                editLevelConfirmed={editLevelConfirmed}
                editingCategory={editingCategory}
                formatConfirmed={formatConfirmed}
                frameTemplateType={frameTemplateType}
                clips={clips}
                sourceOrderConfirmed={sourceOrderConfirmed}
                sourceSequenceMode={sourceSequenceMode}
                targetPlatform={targetPlatform}
                visualPreference={visualPreference}
              />
            </ChatMessage>
          )}

          {setupReady && plan.compiledIntent && (
            <ChatMessage role="ai">
              <p>Before I build the plan, here is the structured intent I compiled from your request and the chat choices.</p>
              <InlineCompiledIntentCard
                approved={intentApproved}
                intent={plan.compiledIntent}
                onApproveIntent={handleApproveIntent}
              />
            </ChatMessage>
          )}

          {setupReady && referenceAttached && (
            <ChatMessage role="user">
              <p>Reference: https://example.com/luxury-listing-reference</p>
            </ChatMessage>
          )}

          {setupReady && referenceAttached && (
            <ChatMessage role="ai">
              <InlineReferenceDNACard />
            </ChatMessage>
          )}

          {setupReady && (
            <ChatMessage role="ai">
              <p>Here is the edit plan before spending credits.</p>
              <InlineEditPlanCard
                onApprove={handleApprove}
                onLowerCost={handleLowerCost}
                onRemoveRealMotion={handleRemoveRealMotion}
                plan={plan}
              />
              {showCard('segment_operations') && (
                <InlineSegmentEditPlanCard descriptor={cardById.segment_operations} plan={plan} />
              )}
              {showCard('visual_asset_plan') && (
                <InlineVisualAssetPlanCard descriptor={cardById.visual_asset_plan} editLevel={planEditLevel} plan={plan} />
              )}
              {showCard('character_consistency') && (
                <InlineCharacterConsistencyCard descriptor={cardById.character_consistency} plan={plan} />
              )}
              {showCard('fact_safety') && (
                <InlineDocumentaryFactSafetyCard descriptor={cardById.fact_safety} plan={plan} />
              )}
              {showCard('renderer_plan') && (
                <InlineRendererPlanCard descriptor={cardById.renderer_plan} plan={plan} />
              )}
              {showCard('qa_plan') && (
                <InlineQAPlanCard descriptor={cardById.qa_plan} plan={plan} />
              )}
              {showCard('prompt_preview') && (
                <InlinePromptPreviewCard descriptor={cardById.prompt_preview} plan={plan} />
              )}
              {showCard('plan_validation') && (
                <InlinePlanValidationCard descriptor={cardById.plan_validation} report={validationReport} />
              )}
              {showCard('planner_regression') && (
                <InlinePlannerRegressionCard descriptor={cardById.planner_regression} report={regressionReport} />
              )}
              <InlineCreditEstimateCard
                approved={approved}
                estimate={plan.creditEstimate}
                onApprove={handleApprove}
                onLowerCost={handleLowerCost}
              />
            </ChatMessage>
          )}

          {revisionMessage && (
            <ChatMessage role="ai">
              <p>{revisionMessage}</p>
            </ChatMessage>
          )}

          {approved && (
            <ChatMessage role="ai">
              <p>Plan and credit estimate approved. ReeditPro would now begin editing/generation in production.</p>
              {approvedSnapshot && <p>Approved plan snapshot created for this mock session. Snapshot version: {approvedSnapshot.snapshotVersion}.</p>}
              <AIEditingProgressStage activeIndex={progressIndex} complete={previewReady} />
            </ChatMessage>
          )}

          {previewReady && (
            <ChatMessage role="ai">
              <p>Preview ready. You can play it, request a revision, export, or keep chatting.</p>
              <PreviewReadyCard creditsUsed={plan.creditEstimate.total} />
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
          onReference={handleReferenceAttach}
          onSend={handleSend}
        />

        <div className="chat-native-rule-card">
          <Sparkles size={18} />
          <span>The chat is the editor. Inline cards appear only for clips, choices, plan approval, credits, progress, and preview.</span>
        </div>
      </div>
    </section>
  )
}
