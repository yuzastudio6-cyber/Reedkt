import { AlertTriangle, FileVideo, Loader2 } from 'lucide-react'
import { Button } from './Button'

export function LoadingState() {
  return (
    <div className="state-card state-loading">
      <Loader2 aria-hidden="true" size={20} />
      <div>
        <strong>Generating edit preview</strong>
        <p>Analyzing transcript, mapping story beats, and preparing AI layers.</p>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="state-card">
      <FileVideo aria-hidden="true" size={22} />
      <div>
        <strong>No projects yet</strong>
        <p>Upload your first clip and ReeditPro will create your first AI edit.</p>
      </div>
      <Button size="sm" variant="primary">
        Create Project
      </Button>
    </div>
  )
}

export function ErrorState() {
  return (
    <div className="state-card state-error">
      <AlertTriangle aria-hidden="true" size={22} />
      <div>
        <strong>Source file missing</strong>
        <p>Reconnect the file or replace the clip to continue the export.</p>
      </div>
      <Button size="sm" variant="secondary">
        View details
      </Button>
    </div>
  )
}
