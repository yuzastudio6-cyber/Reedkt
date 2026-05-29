import { ExportReviewPanel } from './ExportReviewPanel'
import { InspectorPanel } from './InspectorPanel'
import { MediaPreviewPanel } from './MediaPreviewPanel'
import { TimelinePanel } from './TimelinePanel'
import { ToolPlanPanel } from './ToolPlanPanel'
import { TranscriptCaptionPanel } from './TranscriptCaptionPanel'

export function EditorWorkspaceShell() {
  return (
    <div className="web-shell-editor-grid">
      <div className="web-shell-editor-primary">
        <MediaPreviewPanel />
        <TimelinePanel />
      </div>
      <div className="web-shell-editor-secondary">
        <TranscriptCaptionPanel />
        <ToolPlanPanel />
        <InspectorPanel />
        <ExportReviewPanel />
      </div>
    </div>
  )
}
