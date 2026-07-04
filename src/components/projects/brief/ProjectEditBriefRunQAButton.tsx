import { ShieldCheck } from 'lucide-react'
import { Button } from '../../Button'

type ProjectEditBriefRunQAButtonProps = {
  busy?: boolean
  disabled?: boolean
  label?: string
  onRun: () => void
}

export function ProjectEditBriefRunQAButton({
  busy = false,
  disabled = false,
  label = 'Run QA Check',
  onRun,
}: ProjectEditBriefRunQAButtonProps) {
  return (
    <Button
      data-testid="project-edit-brief-run-qa-button"
      disabled={disabled || busy}
      icon={ShieldCheck}
      onClick={onRun}
      size="sm"
      variant="secondary"
    >
      {busy ? 'Running QA' : label}
    </Button>
  )
}
