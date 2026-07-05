import { useEffect, useState } from 'react'
import type {
  ProjectEditBriefApiClient,
  ProjectEditBriefQwenMarkerChatReadinessSummary,
} from '../../../lib/project-edit-brief-api-client'
import {
  createProjectEditBriefMarkerChatPanelSummary,
  loadProjectEditBriefMarkerChatPanelForUI,
  sendProjectEditBriefMarkerChatMessageViaApi,
} from '../../../lib/project-edit-brief-marker-chat-ui-adapter'
import { REEDITPRO_QWEN_MAIN_BRAIN_LABEL } from '../../../types/qwen-main-brain'
import type { ProjectEditBriefMarkerChatPanelModel } from '../../../types/project-edit-brief-marker-chat'
import type { ProjectEditBriefVisualContext } from '../../../types/project-edit-brief-visual-context'
import { Badge } from '../../Badge'
import { ProjectEditBriefMarkerChatBoundaryNotice } from './ProjectEditBriefMarkerChatBoundaryNotice'
import { ProjectEditBriefMarkerChatInput } from './ProjectEditBriefMarkerChatInput'
import { ProjectEditBriefMarkerConfirmationCard } from './ProjectEditBriefMarkerConfirmationCard'
import { ProjectEditBriefMarkerIntentSummaryCard } from './ProjectEditBriefMarkerIntentSummaryCard'
import { ProjectEditBriefMarkerMessageList } from './ProjectEditBriefMarkerMessageList'

type ProjectEditBriefMarkerChatPanelProps = {
  client?: ProjectEditBriefApiClient
  markerId: string
  onApplied?: (message: string) => void
  visualContext?: ProjectEditBriefVisualContext
}

export function ProjectEditBriefMarkerChatPanel({
  client,
  markerId,
  onApplied,
  visualContext,
}: ProjectEditBriefMarkerChatPanelProps) {
  const [model, setModel] = useState<ProjectEditBriefMarkerChatPanelModel | undefined>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Loading Marker Chat.')
  const [runtimeReadinessState, setRuntimeReadinessState] = useState<{
    client?: ProjectEditBriefApiClient
    readiness?: ProjectEditBriefQwenMarkerChatReadinessSummary
  }>({
    client,
    readiness: client?.qwenMarkerChatRuntime.readiness,
  })
  const runtimeReadiness = runtimeReadinessState.client === client
    ? runtimeReadinessState.readiness
    : client?.qwenMarkerChatRuntime.readiness

  async function reload(nextStatus?: string) {
    const nextModel = await loadProjectEditBriefMarkerChatPanelForUI(markerId, client)
    setModel(nextModel)
    setStatus(nextStatus ?? (nextModel ? createProjectEditBriefMarkerChatPanelSummary(nextModel) : 'Marker Chat failed safely.'))
  }

  useEffect(() => {
    let cancelled = false
    loadProjectEditBriefMarkerChatPanelForUI(markerId, client).then((nextModel) => {
      if (cancelled) return
      setModel(nextModel)
      setStatus(nextModel ? createProjectEditBriefMarkerChatPanelSummary(nextModel) : 'Marker Chat failed safely.')
    })
    return () => {
      cancelled = true
    }
  }, [client, markerId])

  useEffect(() => {
    let cancelled = false
    client?.loadQwenMarkerChatReadiness().then((readiness) => {
      if (!cancelled) setRuntimeReadinessState({ client, readiness })
    })
    return () => {
      cancelled = true
    }
  }, [client])

  async function sendMessage() {
    if (!message.trim() || busy) return
    setBusy(true)
    try {
      const result = await sendProjectEditBriefMarkerChatMessageViaApi({
        markerId,
        messageText: message,
      }, client)
      setMessage('')
      let nextStatus = 'Marker Chat message was blocked safely.'
      if (result?.ok && result.runtimeSource === 'qwen_live') {
        nextStatus = `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} understood this marker.`
      } else if (result?.ok && result.runtimeSource === 'deterministic_fallback') {
        nextStatus = result.fallbackReason === 'browser_mock_transport'
          ? 'Local fallback: Marker Chat saved scoped message and deterministic intent.'
          : `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} was unavailable; ReEditPro used the local intent fallback.`
      } else if (result?.ok) {
        nextStatus = 'Local fallback: Marker Chat saved scoped message and deterministic intent.'
      }
      await reload(nextStatus)
      onApplied?.(nextStatus)
    } finally {
      setBusy(false)
    }
  }

  if (!model) {
    return (
      <section className="project-edit-brief-marker-chat" data-testid="project-edit-brief-marker-chat-panel">
        <div className="project-edit-brief-marker-chat__header">
          <h4>Marker Chat</h4>
          <Badge>Loading</Badge>
        </div>
        <p>{status}</p>
      </section>
    )
  }

  return (
    <section className="project-edit-brief-marker-chat" data-testid="project-edit-brief-marker-chat-panel">
      <div className="project-edit-brief-marker-chat__header">
        <div>
          <h4>Marker Chat</h4>
          <p>{model.responseModeLabel}</p>
        </div>
        <Badge accent="cyan">{model.aiMode.replace(/_/g, ' ')}</Badge>
      </div>
      <ProjectEditBriefMarkerChatBoundaryNotice
        readinessLabel={runtimeReadiness?.label}
        readinessSummary={runtimeReadiness?.summary}
        runtimeLabel={client?.qwenMarkerChatRuntime.label}
        runtimeSummary={client?.qwenMarkerChatRuntime.summary}
        summary={model.boundarySummary}
      />
      <div className="project-edit-brief-marker-chat__status" data-testid="project-edit-brief-marker-chat-status" role="status">
        {status}
      </div>
      <div className="project-edit-brief-marker-chat__visual-context" data-testid="project-edit-brief-marker-chat-visual-context">
        {visualContext
          ? visualContext.runtimeSource === 'qwen25vl_live' || visualContext.runtimeSource === 'qwen25vl_fake'
            ? `Visual context available: ${visualContext.visualSummary}`
            : `Visual context fallback used: ${visualContext.fallbackReason ?? visualContext.runtimeSource}.`
          : 'Visual context unavailable.'}
      </div>
      <ProjectEditBriefMarkerMessageList messages={model.messages} />
      <ProjectEditBriefMarkerChatInput
        busy={busy}
        canSend={model.canSendMessage}
        message={message}
        onChange={setMessage}
        onSend={sendMessage}
      />
      <div className="project-edit-brief-marker-chat__cards">
        <ProjectEditBriefMarkerIntentSummaryCard intent={model.intent} />
        <ProjectEditBriefMarkerConfirmationCard confirmations={model.confirmations} />
      </div>
    </section>
  )
}
