import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '../Button'
import { createMockEditPlan, sampleClips } from '../../lib/mock-planner'
import type { ClipSource } from '../../types/reeditpro'
import { AIEditingProgressStage } from './AIEditingProgressStage'
import { ChatComposer } from './ChatComposer'
import { ChatMessage } from './ChatMessage'
import { ChatThread } from './ChatThread'
import { defaultChatPlannerInput, progressSteps } from './chatNativeData'
import { InlineAIQuestionCard } from './InlineAIQuestionCard'
import { InlineCreditEstimateCard } from './InlineCreditEstimateCard'
import { InlineEditPlanCard } from './InlineEditPlanCard'
import { InlineReferenceDNACard } from './InlineReferenceDNACard'
import { InlineSourceSequenceCard } from './InlineSourceSequenceCard'
import { InlineWorkflowChoiceCard } from './InlineWorkflowChoiceCard'
import { MinimalProjectHeader } from './MinimalProjectHeader'
import { PreviewReadyCard } from './PreviewReadyCard'

function reorderClips(clips: ClipSource[]) {
  return clips.map((clip, index) => ({ ...clip, uploadedOrder: index + 1 }))
}

type ChatNativeEditorProps = {
  onOpenTimeline: () => void
}

export function ChatNativeEditor({ onOpenTimeline }: ChatNativeEditorProps) {
  const [clips, setClips] = useState<ClipSource[]>(sampleClips)
  const [composerValue, setComposerValue] = useState('Make the captions smaller and keep the Real Motion subtle.')
  const [clipsAttached, setClipsAttached] = useState(true)
  const [referenceAttached, setReferenceAttached] = useState(true)
  const [workflowChoice, setWorkflowChoice] = useState('Real estate / property tour')
  const [approved, setApproved] = useState(false)
  const [progressStarted, setProgressStarted] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)
  const [previewReady, setPreviewReady] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState('')
  const progressTimerRef = useRef<number | null>(null)

  const plannerInput = useMemo(
    () => ({
      ...defaultChatPlannerInput,
      clips,
      referenceUrl: referenceAttached ? defaultChatPlannerInput.referenceUrl : '',
    }),
    [clips, referenceAttached],
  )

  const plan = useMemo(() => createMockEditPlan(plannerInput), [plannerInput])

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

  function handleAddMockClip() {
    setClipsAttached(true)
    setClips((current) =>
      reorderClips([
        ...current,
        {
          id: `chat-clip-${Date.now()}`,
          uploadedOrder: current.length + 1,
          fileName: `chat-upload-${current.length + 1}.mp4`,
          duration: '00:09',
          detectedType: 'Mock clip sent in chat',
          notes: '',
        },
      ]),
    )
    setApproved(false)
    setProgressStarted(false)
    setPreviewReady(false)
    setProgressIndex(0)
  }

  function handleMoveClip(id: string, direction: 'up' | 'down') {
    setClips((current) => {
      const next = [...current]
      const index = next.findIndex((clip) => clip.id === id)
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (index < 0 || targetIndex < 0 || targetIndex >= next.length) {
        return current
      }

      const moving = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = moving
      return reorderClips(next)
    })
    setApproved(false)
  }

  function handleRemoveClip(id: string) {
    setClips((current) => reorderClips(current.filter((clip) => clip.id !== id)))
    setApproved(false)
    setProgressStarted(false)
    setPreviewReady(false)
  }

  function handleUpdateClip(id: string, updates: Partial<ClipSource>) {
    setClips((current) => current.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)))
    setApproved(false)
  }

  function handleApprove() {
    setApproved(true)
    setProgressStarted(true)
    setPreviewReady(false)
    setProgressIndex(0)
  }

  function handleLowerCost() {
    setRevisionMessage('I can lower the cost by removing Real Motion, keeping SoundSync light, and using captions plus basic cleanup.')
  }

  function handleRemoveRealMotion() {
    setRevisionMessage('Real Motion removed from the proposed plan. The edit can stay premium with captions, clean cuts, and subtle Graphic Design overlays.')
  }

  function handleSend() {
    setRevisionMessage(composerValue.trim())
    setComposerValue('')
  }

  return (
    <section className="chat-native-editor">
      <MinimalProjectHeader approved={approved} credits={plan.creditEstimate.total} previewReady={previewReady} />

      <ChatThread>
        <ChatMessage role="user">
          <p>I want to edit these clips into a premium real estate short. Keep it natural and don't make it too viral.</p>
        </ChatMessage>

        <ChatMessage role="user">
          <p>Attached 4 mock clips in the order I filmed them.</p>
        </ChatMessage>

        <ChatMessage role="ai">
          <p>Got it. I will treat these clips as your source sequence and preserve the walkthrough feel unless there is a stronger structure worth suggesting.</p>
          {clipsAttached && (
            <InlineSourceSequenceCard
              clips={clips}
              onAddClip={handleAddMockClip}
              onMoveClip={handleMoveClip}
              onRemoveClip={handleRemoveClip}
              onUpdateClip={handleUpdateClip}
            />
          )}
        </ChatMessage>

        <ChatMessage role="ai">
          <p>Do you want me to use a workflow context or just follow your written instructions?</p>
          <InlineAIQuestionCard onSelect={setWorkflowChoice} />
          <InlineWorkflowChoiceCard selectedWorkflow={workflowChoice} />
        </ChatMessage>

        <ChatMessage role="ai">
          <p>You can paste a reference video link or skip it. I will study the style without copying it shot-for-shot.</p>
        </ChatMessage>

        {referenceAttached && (
          <ChatMessage role="user">
            <p>Reference: https://example.com/luxury-listing-reference</p>
          </ChatMessage>
        )}

        {referenceAttached && (
          <ChatMessage role="ai">
            <InlineReferenceDNACard />
          </ChatMessage>
        )}

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

        {approved && (
          <ChatMessage role="ai">
            <p>Plan approved. ReeditPro would now begin generation in production.</p>
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
        onReference={() => setReferenceAttached(true)}
        onSend={handleSend}
      />

      <div className="chat-native-rule-card">
        <Sparkles size={18} />
        <span>The chat is the editor. Inline cards appear only for clips, choices, plan approval, credits, progress, and preview.</span>
      </div>
    </section>
  )
}
