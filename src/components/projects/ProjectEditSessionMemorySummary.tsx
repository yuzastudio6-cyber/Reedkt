import { ProjectEditSessionMemoryLayerCard } from './ProjectEditSessionMemoryLayerCard'
import { ProjectEditSessionMemoryUpdateNotice } from './ProjectEditSessionMemoryUpdateNotice'
import type {
  ProjectEditSessionMemoryLayerCardModel,
  ProjectEditSessionMemoryUpdateNoticeModel,
} from '../../lib/project-edit-session-memory-ui-adapter'

type ProjectEditSessionMemorySummaryProps = {
  summary: string
  items: string[]
  boundarySummary?: string
  layerCards?: ProjectEditSessionMemoryLayerCardModel[]
  updateNotice?: ProjectEditSessionMemoryUpdateNoticeModel
}

export function ProjectEditSessionMemorySummary({
  boundarySummary,
  items,
  layerCards = [],
  summary,
  updateNotice,
}: ProjectEditSessionMemorySummaryProps) {
  return (
    <section className="project-edit-session-context-section" data-testid="edit-session-memory-summary">
      <h3>Memory</h3>
      <p>{summary}</p>
      {boundarySummary ? <p className="project-edit-session-context-section__boundary">{boundarySummary}</p> : null}
      {updateNotice ? <ProjectEditSessionMemoryUpdateNotice notice={updateNotice} /> : null}
      {layerCards.length ? (
        <div className="project-edit-session-memory-layer-grid" data-testid="edit-session-memory-layer-list">
          {layerCards.slice(0, 6).map((card) => (
            <ProjectEditSessionMemoryLayerCard card={card} key={card.layer} />
          ))}
        </div>
      ) : null}
      {items.length ? (
        <ul>
          {items.slice(0, 4).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
