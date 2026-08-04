import { RefreshCw } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { EditCueRemapResult } from '../../../types'

type EditCueRemapStatusProps = {
  remapResult?: EditCueRemapResult
  onRemapCue?: () => void
}

function statusCopy(status?: EditCueRemapResult['status']) {
  if (!status || status === 'not_needed') return ['Clean Assembly timing', 'This cue already uses planning-safe timing or does not need remapping.'] as const
  if (status === 'pending') return ['Needs remap', 'This cue can be checked against Clean Assembly timing.'] as const
  if (status === 'mapped') return ['Mapped to Clean Assembly', 'This raw-source cue can be remapped cleanly.'] as const
  if (status === 'partially_mapped') return ['Partially mapped', 'Part of this cue can be mapped to the Clean Assembly.'] as const
  if (status === 'removed_source') return ['Source was removed', 'This cue points to footage removed from the Clean Assembly.'] as const
  return ['Could not map', 'This cue could not be mapped to Clean Assembly timing.'] as const
}

function statusAccent(status?: EditCueRemapResult['status']) {
  if (!status || status === 'not_needed') return 'muted'
  if (status === 'mapped') return 'success'
  if (status === 'partially_mapped') return 'warning'
  if (status === 'removed_source' || status === 'failed') return 'danger'
  return 'cyan'
}

function canRemap(status?: EditCueRemapResult['status']) {
  return status === 'mapped' || status === 'partially_mapped'
}

export function EditCueRemapStatus({ onRemapCue, remapResult }: EditCueRemapStatusProps) {
  const [label, message] = statusCopy(remapResult?.status)

  return (
    <div className="edit-cue-remap-status">
      <div>
        <Badge accent={statusAccent(remapResult?.status)}>{label}</Badge>
        <p className="inline-helper">{remapResult?.message ?? message}</p>
      </div>
      {canRemap(remapResult?.status) && (
        <Button icon={RefreshCw} onClick={onRemapCue} size="sm" variant="secondary">
          Remap
        </Button>
      )}
    </div>
  )
}
