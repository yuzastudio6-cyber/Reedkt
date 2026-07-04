import { BrainCircuit } from 'lucide-react'
import type { ProjectEditSessionMemoryUpdateNoticeModel } from '../../lib/project-edit-session-memory-ui-adapter'

type ProjectEditSessionMemoryUpdateNoticeProps = {
  notice: ProjectEditSessionMemoryUpdateNoticeModel
}

export function ProjectEditSessionMemoryUpdateNotice({ notice }: ProjectEditSessionMemoryUpdateNoticeProps) {
  return (
    <aside className="project-edit-session-memory-update-notice" data-testid="edit-session-memory-update-notice">
      <BrainCircuit aria-hidden="true" size={16} />
      <div>
        <strong>{notice.title}</strong>
        <p>{notice.body}</p>
      </div>
    </aside>
  )
}
