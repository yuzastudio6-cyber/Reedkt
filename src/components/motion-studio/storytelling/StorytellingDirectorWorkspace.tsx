import {
  AlertTriangle,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { UseMotionStudioStorytellingWorkspaceHandoffResult } from '../../../hooks/useMotionStudioStorytellingWorkspaceHandoff'
import { useMotionStudioProduction } from '../../../hooks/useMotionStudioProduction'
import {
  appendOrderedUserInstruction,
  joinOrderedUserInstructions,
  normalizeOrderedUserInstructions,
} from '../../../lib/planning-input-safety'
import type { LocalInternalProjectHandoff } from '../../../lib/local-project-handoff'
import {
  createExecutionSourceMediaAssetsFromPlannedUploads,
  planSourceUploadsForEditor,
} from '../../../lib/source-upload-planning'
import type { ReeditProChatMessage } from '../../../types'
import { Button } from '../../Button'
import { ChatComposer } from '../../editor/ChatComposer'
import { ChatMessageList } from '../../editor/ChatMessageList'
import {
  createAssistantTextMessage,
  createRevisionResponseMessage,
  createUserTextMessage,
} from '../../editor/chatMessageBuilders'
import { ChatThread } from '../../editor/ChatThread'
import { StorytellingDirectorStart } from '../StorytellingDirectorStart'
import { MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE } from '../../../types/motion-studio/storytelling-workflow'
import { StorytellingPlanningApprovalController } from './StorytellingPlanningApprovalController'
import styles from './StorytellingDirectorWorkspace.module.css'

interface StorytellingDirectorWorkspaceProps {
  handoff: LocalInternalProjectHandoff
  initialPrompt?: string
  onOpenReview: () => void
  onOpenSources: () => void
  onPromptConsumed: () => void
  persistenceStatus: UseMotionStudioStorytellingWorkspaceHandoffResult['persistenceStatus']
  retryPersistence: () => void
  updateHandoff: UseMotionStudioStorytellingWorkspaceHandoffResult['updateHandoff']
}

export function StorytellingDirectorWorkspace({
  handoff,
  initialPrompt,
  onOpenReview,
  onOpenSources,
  onPromptConsumed,
  persistenceStatus,
  retryPersistence,
  updateHandoff,
}: StorytellingDirectorWorkspaceProps) {
  const production = useMotionStudioProduction(handoff.projectId, handoff.editSessionId)
  const [composerValue, setComposerValue] = useState(() => initialPrompt ?? '')
  const [sourceUploadMessage, setSourceUploadMessage] = useState<string>()
  const [sourceUploadPlanning, setSourceUploadPlanning] = useState(false)

  useEffect(() => {
    if (!initialPrompt || !production.production) return
    const frame = window.requestAnimationFrame(() => {
      const composer = document.querySelector<HTMLTextAreaElement>('[data-testid="chat-composer-textarea"]')
      if (!composer) return
      composer.focus()
      onPromptConsumed()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [initialPrompt, onPromptConsumed, production.production])

  if (!production.production) {
    return (
      <DirectorProductionState
        message={production.message}
        resourceState={production.resourceState}
        retry={() => { void production.retry() }}
      />
    )
  }

  if (['failure', 'permission_denied', 'stale', 'version_conflict'].includes(production.resourceState)) {
    return (
      <DirectorUnavailableState
        denied={production.resourceState === 'permission_denied'}
        message={production.message ?? 'The exact Storytelling production could not be verified.'}
        onRetry={() => { void production.retry() }}
        retryable={production.resourceState !== 'permission_denied'}
      />
    )
  }

  const instructionHistory = normalizeOrderedUserInstructions(
    handoff.setup?.userInstructionHistory,
    handoff.setup?.customInstructions,
  )
  const readOnly = isDirectorReadOnly(handoff, production.production.status)
  const messages = createDirectorMessages(instructionHistory)

  function choosePrompt(prompt: string) {
    setComposerValue(prompt)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>('[data-testid="chat-composer-textarea"]')?.focus()
    })
  }

  function sendDirection() {
    if (readOnly) return
    const direction = composerValue.trim()
    if (!direction) return
    const nextHistory = appendOrderedUserInstruction(instructionHistory, direction)
    updateHandoff({
      setup: {
        ...handoff.setup,
        customInstructions: joinOrderedUserInstructions(nextHistory),
        userInstructionHistory: nextHistory,
      },
    })
    setComposerValue('')
  }

  async function attachSourceFiles(files: File[]) {
    if (readOnly || sourceUploadPlanning || files.length === 0) return

    setSourceUploadMessage('Adding the selected source to private Storytelling storage…')
    setSourceUploadPlanning(true)
    try {
      const existing = handoff.sourceMediaAssets ?? []
      const startingOrder = Math.max(
        handoff.sourceFileCount,
        ...existing.map((asset) => asset.uploadedOrder),
      ) + 1
      const result = await planSourceUploadsForEditor({
        files,
        projectId: handoff.projectId,
        startingOrder,
        workspaceId: handoff.workspaceId,
      })
      const uploaded = createExecutionSourceMediaAssetsFromPlannedUploads(
        result.plannedUploads,
        result,
      )
      if (uploaded.length === 0) {
        setSourceUploadMessage(
          result.warnings[0] ?? 'The source could not be saved to private storage. Nothing was added to this story.',
        )
        return
      }

      const sourceMediaAssets = [...existing, ...uploaded]
        .sort((left, right) => left.uploadedOrder - right.uploadedOrder)
      const updated = updateHandoff({
        stage: 'source_uploaded',
        sourceFileCount: sourceMediaAssets.length,
        sourceMediaAssets,
        setup: {
          ...handoff.setup,
          cleanupPreferenceConfirmed: false,
          sourceOrderConfirmed: false,
          sourceSequenceMode: sourceMediaAssets.length === 1
            ? 'single_complete_video'
            : 'multi_clip_story_order',
        },
      })
      setSourceUploadMessage(updated
        ? `${uploaded.length} private source file${uploaded.length === 1 ? ' is' : 's are'} ready in Storytelling. No editing, generation, or credits were used.`
        : 'The private source upload finished, but this exact Storytelling edit changed. Refresh before attaching it again.')
    } catch (error) {
      setSourceUploadMessage(error instanceof Error
        ? error.message
        : 'The private source upload did not finish. Nothing was generated or charged.')
    } finally {
      setSourceUploadPlanning(false)
    }
  }

  return (
    <section
      aria-labelledby="storytelling-director-heading"
      className={styles.workspace}
      data-testid="storytelling-director-workspace"
      id="storytelling-chat-panel"
      role="tabpanel"
    >
      <h2 className="sr-only" id="storytelling-director-heading">Storytelling Director Chat</h2>
      <div className={styles.chatShell}>
        <ChatThread label="Storytelling Director conversation">
          <ChatMessageList messages={messages} />
          <div className={styles.focalStart}>
            <StorytellingDirectorStart
              hasDirection={instructionHistory.length > 0}
              onChoosePrompt={choosePrompt}
            />
          </div>
          <StorytellingPlanningApprovalController
            handoff={handoff}
            onDraftDirection={choosePrompt}
            production={production.production}
            updateHandoff={updateHandoff}
          />
          {readOnly ? (
            <section className={styles.locked} data-testid="storytelling-director-read-only" role="status">
              <LockKeyhole aria-hidden="true" size={20} />
              <div>
                <strong>The current approved story is read-only</strong>
                <p>Review the current result or request changes through the existing revision and approval cycle.</p>
              </div>
              <Button onClick={onOpenReview} variant="secondary">Open Review</Button>
            </section>
          ) : null}
        </ChatThread>

        <div aria-hidden="true" className={styles.composerFade} />
        <div className={styles.composerLayer}>
          <ChatComposer
            attachmentsDisabled={readOnly || sourceUploadPlanning}
            clipsAttached={handoff.sourceFileCount > 0}
            disabled={readOnly}
            inputValue={composerValue}
            onAttachClips={onOpenSources}
            onAttachFiles={(files) => { void attachSourceFiles(files) }}
            onInputChange={setComposerValue}
            onReference={onOpenSources}
            onSend={sendDirection}
            placeholder={readOnly
              ? 'The approved story is read-only…'
              : instructionHistory.length === 0
                ? 'Tell Director what story you want to create…'
                : 'Continue shaping the story…'}
          />
          {sourceUploadMessage ? (
            <p aria-live="polite" className={styles.sourceUploadStatus} data-testid="storytelling-source-upload-status" role="status">
              {sourceUploadMessage}
            </p>
          ) : null}
        </div>
      </div>

      <PersistenceNotice
        onRetry={retryPersistence}
        status={persistenceStatus}
      />
    </section>
  )
}

function DirectorProductionState({
  message,
  resourceState,
  retry,
}: {
  message?: string
  resourceState: ReturnType<typeof useMotionStudioProduction>['resourceState']
  retry: () => void
}) {
  if (resourceState === 'loading') {
    return (
      <section aria-live="polite" className={styles.resourceState} role="status">
        <LoaderCircle aria-hidden="true" className={styles.spin} size={23} />
        <div><h2>Opening Storytelling</h2><p>Verifying the exact project, named edit, and Motion Studio production.</p></div>
      </section>
    )
  }

  if (resourceState === 'first_use') {
    return (
      <section className={styles.resourceState} data-testid="storytelling-director-production-missing" role="alert">
        <span aria-hidden="true" className={styles.resourceIcon}><AlertTriangle size={22} /></span>
        <div>
          <h2>Open this story from the Storytelling library</h2>
          <p>{message ?? 'The exact Storytelling production is missing. The Director route cannot create a replacement production.'}</p>
        </div>
        <div className={styles.resourceActions}>
          <Button onClick={retry} variant="ghost">Check again</Button>
          <Button to={MOTION_STUDIO_STORYTELLING_LIBRARY_ROUTE} variant="primary">Back to Storytelling library</Button>
        </div>
      </section>
    )
  }

  return (
    <DirectorUnavailableState
      denied={resourceState === 'permission_denied'}
      message={message ?? 'The Storytelling production could not be verified. No ordinary Edit Chat fallback was opened.'}
      onRetry={retry}
      retryable={resourceState !== 'permission_denied'}
    />
  )
}

function DirectorUnavailableState({
  denied = false,
  message,
  onRetry,
  retryable,
}: {
  denied?: boolean
  message: string
  onRetry: () => void
  retryable: boolean
}) {
  const Icon = denied ? LockKeyhole : AlertTriangle
  return (
    <section className={styles.resourceState} role="alert">
      <span aria-hidden="true" className={styles.resourceIcon}><Icon size={22} /></span>
      <div>
        <h2>{denied ? 'Storytelling access is unavailable' : 'Storytelling could not be opened'}</h2>
        <p>{message}</p>
      </div>
      {retryable ? <Button icon={RefreshCw} onClick={onRetry} variant="primary">Try again</Button> : null}
    </section>
  )
}

function PersistenceNotice({
  onRetry,
  status,
}: {
  onRetry: () => void
  status: UseMotionStudioStorytellingWorkspaceHandoffResult['persistenceStatus']
}) {
  if (status.status === 'saved_backend' || status.status === 'saved_local') return null
  return (
    <div
      aria-live={status.status === 'needs_retry' ? 'assertive' : 'polite'}
      className={styles.persistence}
      role={status.status === 'needs_retry' ? 'alert' : 'status'}
    >
      <span>{status.message}</span>
      {status.status === 'needs_retry' ? (
        <Button icon={RefreshCw} onClick={onRetry} size="sm" variant="secondary">Retry save</Button>
      ) : null}
    </div>
  )
}

function createDirectorMessages(instructions: readonly string[]): ReeditProChatMessage[] {
  const messages: ReeditProChatMessage[] = [
    createAssistantTextMessage(
      'Tell me the story you want to create. Begin with an idea, prepared material, or the source you already have.',
      { id: 'storytelling-director-greeting', label: 'Director' },
    ),
  ]

  instructions.forEach((instruction, index) => {
    messages.push(createUserTextMessage(instruction, {
      id: `storytelling-director-user-${index}`,
    }))
    messages.push(createRevisionResponseMessage(
      index === 0
        ? 'I’ve saved that as the starting story direction. We’ll keep understanding and shaping it before any plan, generation, or credit approval.'
        : 'I’ve saved that direction for the next Storytelling plan. Nothing has been generated, approved, or charged.',
      { id: `storytelling-director-response-${index}`, label: 'Director' },
    ))
  })
  return messages
}

function isDirectorReadOnly(
  handoff: LocalInternalProjectHandoff,
  productionStatus: NonNullable<ReturnType<typeof useMotionStudioProduction>['production']>['status'],
): boolean {
  if (
    handoff.stage === 'revision_requested' ||
    handoff.privateReview?.reviewDecision === 'changes_requested'
  ) {
    return false
  }
  return Boolean(handoff.approvedSnapshotId) || [
    'plan_approved',
    'private_review_ready',
    'private_review_verified',
    'private_review_accepted',
    'internal_edit_complete',
    'revision_preview_ready',
  ].includes(handoff.stage) || [
    'awaiting_review',
    'approved_for_execution',
    'producing',
    'reviewing',
    'delivery_ready',
    'completed',
    'archived',
  ].includes(productionStatus)
}
