import { ShieldCheck } from 'lucide-react'
import type { ProjectEditSessionNavigationBoundary } from '../../types/project-edit-session-navigation'

type ProjectEditSessionRouteBoundaryNoticeProps = {
  boundary: ProjectEditSessionNavigationBoundary
}

export function ProjectEditSessionRouteBoundaryNotice({ boundary }: ProjectEditSessionRouteBoundaryNoticeProps) {
  return (
    <section className="project-edit-session-route-boundary" data-testid="edit-session-route-boundary">
      <ShieldCheck aria-hidden="true" size={18} />
      <div>
        <strong>Navigation is mock/local only</strong>
        <p>
          Route changes do not start progress, render, workers, providers, model calls, remote Supabase writes, uploads,
          file-byte reads, credits, or real media processing. No real media processing starts from navigation.
        </p>
        <ul aria-label="Navigation boundary warnings">
          {boundary.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
