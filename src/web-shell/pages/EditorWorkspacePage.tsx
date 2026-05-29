import { EditorWorkspaceShell } from '../editor/EditorWorkspaceShell'
import { StatusBadge } from '../components/StatusBadge'

export function EditorWorkspacePage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Editor workspace</p>
          <h2>Static shell for timeline, captions, tools, inspector, and export review.</h2>
          <p>
            The editor surface is ready for later backend integration, but it does not run tools, decode media, render,
            export, or use local compute in the browser.
          </p>
        </div>
        <StatusBadge tone="warning">Cloud-gated</StatusBadge>
      </section>
      <EditorWorkspaceShell />
    </div>
  )
}
