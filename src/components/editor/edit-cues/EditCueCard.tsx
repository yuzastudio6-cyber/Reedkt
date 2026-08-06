import { CheckCircle2, Copy, Trash2 } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type {
  EditCue,
  EditCueAnchor,
  EditCueAnchorOption,
  EditCueAsset,
  EditCueAssetOption,
  EditCueAudioBehavior,
  EditCueConflictRecord,
  EditCueRole,
  EditCueRemapResult,
  EditCueValidationIssue,
  EditCueVisualBehavior,
  PriorityLevel,
  TimingFlexibility,
} from '../../../types'
import { EditCueAnchorPicker } from './EditCueAnchorPicker'
import { EditCueAssetSelector } from './EditCueAssetSelector'
import { EditCueBehaviorSection } from './EditCueBehaviorSection'
import { EditCueInstructionSection } from './EditCueInstructionSection'
import { EditCuePriorityPicker } from './EditCuePriorityPicker'
import { EditCueRemapStatus } from './EditCueRemapStatus'
import { EditCueRolePicker } from './EditCueRolePicker'
import { EditCueTagInput } from './EditCueTagInput'
import { EditCueTimingFlexibilityPicker } from './EditCueTimingFlexibilityPicker'
import { EditCueValidationList } from './EditCueValidationList'

type EditCueCardProps = {
  cue: EditCue
  validationIssues?: EditCueValidationIssue[]
  conflicts?: EditCueConflictRecord[]
  remapResult?: EditCueRemapResult
  anchorOptions?: EditCueAnchorOption[]
  assetOptions?: EditCueAssetOption[]
  onUpdateTitle?: (cueId: string, title: string) => void
  onUpdateAnchor?: (cueId: string, anchor: EditCueAnchor) => void
  onUpdateRole?: (cueId: string, role: EditCueRole) => void
  onAddAsset?: (cueId: string, asset: EditCueAsset) => void
  onRemoveAsset?: (cueId: string, mediaAssetId: string) => void
  onUpdatePriority?: (cueId: string, priority: PriorityLevel) => void
  onUpdateTimingFlexibility?: (cueId: string, value: TimingFlexibility) => void
  onUpdateAudioBehavior?: (cueId: string, value: EditCueAudioBehavior) => void
  onUpdateVisualBehavior?: (cueId: string, patch: Partial<EditCueVisualBehavior>) => void
  onUpdateInstructions?: (cueId: string, instructions: string) => void
  onAddTag?: (cueId: string, tag: string) => void
  onRemoveTag?: (cueId: string, tag: string) => void
  onMarkReady?: (cueId: string) => void
  onDuplicateCue?: (cueId: string) => void
  onDeleteCue?: (cueId: string) => void
  onRemapCue?: () => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusAccent(status: EditCue['status']) {
  if (status === 'ready') return 'success'
  if (status === 'conflict') return 'danger'
  if (status === 'draft') return 'warning'
  return 'muted'
}

function priorityAccent(priority: PriorityLevel) {
  if (priority === 'must_follow') return 'success'
  if (priority === 'avoid' || priority === 'do_not_use') return 'warning'
  if (priority === 'prefer') return 'cyan'
  return 'muted'
}

export function EditCueCard({
  anchorOptions = [],
  assetOptions = [],
  conflicts = [],
  cue,
  onAddAsset,
  onAddTag,
  onDeleteCue,
  onDuplicateCue,
  onMarkReady,
  onRemapCue,
  onRemoveAsset,
  onRemoveTag,
  onUpdateAnchor,
  onUpdateAudioBehavior,
  onUpdateInstructions,
  onUpdatePriority,
  onUpdateRole,
  onUpdateTimingFlexibility,
  onUpdateTitle,
  onUpdateVisualBehavior,
  remapResult,
  validationIssues = [],
}: EditCueCardProps) {
  const blockingIssues = validationIssues.filter((issue) => issue.severity === 'blocking')

  return (
    <article className={`edit-cue-card ${blockingIssues.length > 0 ? 'edit-cue-card--blocking' : ''}`}>
      <div className="edit-cue-card-header">
        <label className="edit-cue-title-field">
          <span className="section-eyebrow">Cue title</span>
          <input onChange={(event) => onUpdateTitle?.(cue.id, event.target.value)} value={cue.title} />
        </label>

        <div className="inline-plan-card-badges">
          <Badge accent={statusAccent(cue.status)}>{formatLabel(cue.status)}</Badge>
          <Badge accent="cyan">{formatLabel(cue.role)}</Badge>
          <Badge accent={priorityAccent(cue.priority)}>{formatLabel(cue.priority)}</Badge>
        </div>
      </div>

      <EditCueValidationList compact issues={validationIssues} />

      <EditCueRemapStatus onRemapCue={onRemapCue} remapResult={remapResult} />

      {conflicts.length > 0 && (
        <div className="edit-cue-card-conflicts">
          <strong>{conflicts.length} cue conflict{conflicts.length === 1 ? '' : 's'} on this cue</strong>
          <span>{conflicts.map((conflict) => formatLabel(conflict.kind)).join(', ')}</span>
        </div>
      )}

      <EditCueAnchorPicker
        onChange={(anchor) => onUpdateAnchor?.(cue.id, anchor)}
        options={anchorOptions}
        value={cue.anchor}
      />

      <section className="edit-cue-section">
        <div>
          <strong>Planning role</strong>
          <p className="inline-helper">Choose what this cue asks AI to plan.</p>
        </div>
        <div className="edit-cue-field-grid">
          <EditCueRolePicker onChange={(role) => onUpdateRole?.(cue.id, role)} value={cue.role} />
          <EditCuePriorityPicker onChange={(priority) => onUpdatePriority?.(cue.id, priority)} value={cue.priority} />
          <EditCueTimingFlexibilityPicker
            onChange={(value) => onUpdateTimingFlexibility?.(cue.id, value)}
            value={cue.timingFlexibility}
          />
        </div>
      </section>

      <section className="edit-cue-section">
        <div>
          <strong>Assets</strong>
          <p className="inline-helper">Attach Source Library files this cue should consider.</p>
        </div>
        <EditCueAssetSelector
          assetOptions={assetOptions}
          onAddAsset={(asset) => onAddAsset?.(cue.id, asset)}
          onRemoveAsset={(mediaAssetId) => onRemoveAsset?.(cue.id, mediaAssetId)}
          selectedAssets={cue.assetRefs}
        />
      </section>

      <EditCueBehaviorSection
        audioBehavior={cue.audioBehavior}
        onUpdateAudioBehavior={(value) => onUpdateAudioBehavior?.(cue.id, value)}
        onUpdateVisualBehavior={(patch) => onUpdateVisualBehavior?.(cue.id, patch)}
        visualBehavior={cue.visualBehavior}
      />

      <section className="edit-cue-section">
        <EditCueInstructionSection
          instructions={cue.instructions}
          onChange={(instructions) => onUpdateInstructions?.(cue.id, instructions)}
        />
        <EditCueTagInput
          onAddTag={(tag) => onAddTag?.(cue.id, tag)}
          onRemoveTag={(tag) => onRemoveTag?.(cue.id, tag)}
          value={cue.tags}
        />
      </section>

      <div className="edit-cue-card-actions">
        <Button
          disabled={cue.status === 'ready' || blockingIssues.length > 0}
          icon={CheckCircle2}
          onClick={() => onMarkReady?.(cue.id)}
          size="sm"
          variant="secondary"
        >
          Mark Ready
        </Button>
        <Button icon={Copy} onClick={() => onDuplicateCue?.(cue.id)} size="sm" variant="ghost">
          Duplicate
        </Button>
        <Button icon={Trash2} onClick={() => onDeleteCue?.(cue.id)} size="sm" variant="danger">
          Delete
        </Button>
      </div>
    </article>
  )
}
