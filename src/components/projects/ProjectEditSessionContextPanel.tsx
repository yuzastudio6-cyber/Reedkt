import { Activity, GitBranch, Layers3, MessageSquareText } from 'lucide-react'
import { Badge } from '../Badge'
import { Card } from '../Card'
import { ProjectEditSessionMemorySummary } from './ProjectEditSessionMemorySummary'
import { ProjectEditSessionSourceSummary } from './ProjectEditSessionSourceSummary'
import { ProjectEditSessionVersionPreviewSummary } from './ProjectEditSessionVersionPreviewSummary'
import { ProjectEditSessionHistoryPanel } from './ProjectEditSessionHistoryPanel'
import { ProjectEditSessionPreferencePanel } from './ProjectEditSessionPreferencePanel'
import type { ProjectEditSessionChatContextPanelModel } from '../../lib/project-edit-session-chat-ui-adapter'
import type { ProjectEditSessionMemoryUpdateNoticeModel } from '../../lib/project-edit-session-memory-ui-adapter'
import type { ProjectEditSessionApiClient } from '../../lib/project-edit-session-api-client'

type ProjectEditSessionContextPanelProps = {
  client: ProjectEditSessionApiClient
  context: ProjectEditSessionChatContextPanelModel
  editSessionId: string
  memoryUpdateNotice?: ProjectEditSessionMemoryUpdateNoticeModel
  onHistoryChanged: (message: string) => Promise<void> | void
  projectId: string
}

export function ProjectEditSessionContextPanel({
  client,
  context,
  editSessionId,
  memoryUpdateNotice,
  onHistoryChanged,
  projectId,
}: ProjectEditSessionContextPanelProps) {
  return (
    <Card className="project-edit-session-chat-context" data-testid="edit-session-context-panel">
      <div className="project-edit-session-chat-context__heading">
        <span className="section-eyebrow">Session context</span>
        <Badge accent="cyan">Mock repository</Badge>
      </div>
      <div className="project-edit-session-chat-context__stats">
        <span>
          <MessageSquareText aria-hidden="true" size={15} />
          {context.counts.messages} messages
        </span>
        <span>
          <Layers3 aria-hidden="true" size={15} />
          {context.counts.versions} versions
        </span>
        <span>
          <GitBranch aria-hidden="true" size={15} />
          {context.counts.revisions} revisions
        </span>
      </div>

      <ProjectEditSessionSourceSummary items={context.sourceItems} summary={context.sourceSummary} />
      <ProjectEditSessionPreferencePanel
        client={client}
        editSessionId={editSessionId}
        onPreferenceChanged={onHistoryChanged}
        projectId={projectId}
      />
      <ProjectEditSessionMemorySummary
        boundarySummary={context.memoryBoundarySummary}
        items={context.memoryItems}
        layerCards={context.memoryLayerCards}
        summary={context.memorySummary}
        updateNotice={memoryUpdateNotice}
      />
      <ProjectEditSessionVersionPreviewSummary
        previewItems={context.previewItems}
        summary={context.versionPreviewSummary}
        versionItems={context.versionItems}
      />
      <ProjectEditSessionHistoryPanel
        client={client}
        editSessionId={editSessionId}
        model={context.historyPanel}
        onChanged={onHistoryChanged}
        projectId={projectId}
      />

      <section className="project-edit-session-context-section" data-testid="edit-session-revision-event-summary">
        <h3>Revisions and events</h3>
        <p>{context.revisionSummary}</p>
        <p>{context.eventSummary}</p>
        {context.eventItems.length ? (
          <ul>
            {context.eventItems.slice(0, 4).map((item, index) => (
              <li key={`${item}-${index}`}>
                <Activity aria-hidden="true" size={13} />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </Card>
  )
}
