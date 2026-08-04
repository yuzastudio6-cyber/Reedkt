import {
  AlertTriangle,
  CloudOff,
  FolderSearch,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { Button } from './Button'

export type ProjectResourceStateKind =
  | 'loading'
  | 'not_found'
  | 'access_denied'
  | 'invalid_response'
  | 'unavailable'
  | 'local_only'

type ProjectResourceStateProps = {
  compact?: boolean
  kind: ProjectResourceStateKind
  message: string
  onRetry?: () => void
  parentLabel?: string
  parentTo?: string
  testId: string
  title: string
}

const icons: Record<ProjectResourceStateKind, LucideIcon> = {
  loading: LoaderCircle,
  not_found: FolderSearch,
  access_denied: LockKeyhole,
  invalid_response: AlertTriangle,
  unavailable: CloudOff,
  local_only: CloudOff,
}

export function ProjectResourceState({
  compact = false,
  kind,
  message,
  onRetry,
  parentLabel,
  parentTo,
  testId,
  title,
}: ProjectResourceStateProps) {
  const Icon = icons[kind]
  const isLoading = kind === 'loading'
  const isBlocking = !compact && !isLoading

  return (
    <section
      aria-live={isLoading || compact ? 'polite' : undefined}
      className={`project-resource-state project-resource-state-${kind} ${compact ? 'is-compact' : ''}`.trim()}
      data-testid={testId}
      role={isLoading || compact ? 'status' : isBlocking ? 'alert' : undefined}
    >
      <Icon aria-hidden="true" className="project-resource-state-icon" size={compact ? 20 : 28} />
      <div className="project-resource-state-copy">
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      {(onRetry || (parentLabel && parentTo)) && (
        <div className="project-resource-state-actions">
          {onRetry && (
            <Button icon={RefreshCw} onClick={onRetry} size="sm" variant={compact ? 'secondary' : 'primary'}>
              Retry recovery
            </Button>
          )}
          {parentLabel && parentTo && (
            <Button size="sm" to={parentTo} variant="ghost">
              {parentLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
