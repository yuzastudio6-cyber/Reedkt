import { ShieldCheck } from 'lucide-react'
import type { ProjectEditBriefBoundaryModel } from '../../../lib/project-edit-brief-ui-adapter'

type ProjectEditBriefBoundaryNoticeProps = {
  boundary: ProjectEditBriefBoundaryModel
}

export function ProjectEditBriefBoundaryNotice({ boundary }: ProjectEditBriefBoundaryNoticeProps) {
  return (
    <section className="project-edit-brief-boundary" data-testid="project-edit-brief-boundary">
      <ShieldCheck aria-hidden="true" size={18} />
      <div>
        <strong>Edit Brief is optional. Brief is mock/local; marker metadata editing is browser-safe</strong>
        <p>Local browser playback may run when a user selects a source video. No uploads, backend file-byte reads, media processing, providers, workers, render, progress, credits, Supabase, or signed URLs start here.</p>
        <ul aria-label="Edit Brief boundary">
          {boundary.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
