import type {
  EditCueAnchor,
  EditCueAnchorOption,
  EditCueAsset,
  EditCueAssetOption,
  EditCueAudioBehavior,
  EditCueConflictResolutionType,
  EditCueConflictState,
  EditCueRole,
  EditCueRemapResult,
  EditCueValidationIssue,
  EditCueVisualBehavior,
  EditCuesState,
  EditCuesSummary,
  PriorityLevel,
  TimingFlexibility,
  WorkflowActivityEvent,
} from '../../../types'
import { EditCueCard } from './EditCueCard'
import { EditCueComposer } from './EditCueComposer'
import { EditCueConflictList } from './EditCueConflictList'
import { EditCueConflictSummaryCard } from './EditCueConflictSummaryCard'
import { EditCueValidationList } from './EditCueValidationList'
import { EditCuesSummaryCard } from './EditCuesSummaryCard'
import { EditCuesToolbar } from './EditCuesToolbar'

type EditCuesPanelProps = {
  editCuesState: EditCuesState | null
  summary?: EditCuesSummary | null
  validationIssues?: EditCueValidationIssue[]
  conflictState?: EditCueConflictState | null
  conflictSummary?: EditCueConflictState['summary'] | null
  remapResults?: EditCueRemapResult[]
  anchorOptions?: EditCueAnchorOption[]
  assetOptions?: EditCueAssetOption[]
  activityEvents?: WorkflowActivityEvent[]
  onCreateCue?: () => void
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
  onResetCues?: () => void
  onResolveConflict?: (conflictId: string, resolutionType: EditCueConflictResolutionType, options?: { editCueId?: string; patch?: Record<string, unknown> }) => void
  onIgnoreConflict?: (conflictId: string) => void
  onResetConflict?: (conflictId: string) => void
  onResetAllConflicts?: () => void
  onRemapCue?: (cueId: string) => void
  onRemapAllCues?: () => void
  className?: string
}

export function EditCuesPanel({
  activityEvents = [],
  anchorOptions = [],
  assetOptions = [],
  className = '',
  conflictState,
  conflictSummary,
  editCuesState,
  onAddAsset,
  onAddTag,
  onCreateCue,
  onDeleteCue,
  onDuplicateCue,
  onIgnoreConflict,
  onMarkReady,
  onRemoveAsset,
  onRemoveTag,
  onRemapAllCues,
  onRemapCue,
  onResetCues,
  onResetAllConflicts,
  onResetConflict,
  onResolveConflict,
  onUpdateAnchor,
  onUpdateAudioBehavior,
  onUpdateInstructions,
  onUpdatePriority,
  onUpdateRole,
  onUpdateTimingFlexibility,
  onUpdateTitle,
  onUpdateVisualBehavior,
  remapResults = [],
  summary,
  validationIssues = [],
}: EditCuesPanelProps) {
  if (!editCuesState) {
    return (
      <section className={`inline-chat-card edit-cues-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Edit cues</span>
            <h3>Edit cues will be available after source prep.</h3>
          </div>
        </div>
      </section>
    )
  }

  const latestEvent = activityEvents.at(-1)
  const blockingIssues = validationIssues.filter((issue) => issue.severity === 'blocking')

  return (
    <section className={`edit-cues-panel ${className}`.trim()}>
      <div className="edit-cues-intro inline-chat-card">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Edit Cues</span>
            <h3>Add precise instructions before AI creates the edit plan.</h3>
          </div>
        </div>
        <p className="inline-helper">
          Edit Cues guide planning. AI will still professionally integrate clips, overlays, captions, audio, and graphics before rendering.
        </p>
        {latestEvent && <p className="inline-helper">Latest update: {latestEvent.title}</p>}
      </div>

      {summary && <EditCuesSummaryCard summary={summary} />}

      {conflictSummary && (
        <EditCueConflictSummaryCard
          onRemapAllCues={onRemapAllCues}
          onResetAllConflicts={onResetAllConflicts}
          summary={conflictSummary}
        />
      )}

      <EditCuesToolbar
        blockingIssueCount={summary?.blockingIssueCount ?? blockingIssues.length}
        cueCount={editCuesState.cues.length}
        onCreateCue={onCreateCue}
        onResetCues={onResetCues}
        operationCount={editCuesState.operations.length}
      />

      <EditCueComposer onCreateCue={onCreateCue} />

      {blockingIssues.length > 0 && (
        <section className="inline-chat-card edit-cue-global-validation">
          <div className="inline-card-heading">
            <div>
              <span className="section-eyebrow">Cue validation</span>
              <h3>Review blocking cue issues</h3>
            </div>
          </div>
          <EditCueValidationList issues={blockingIssues} />
        </section>
      )}

      <EditCueConflictList
        conflicts={conflictState?.conflicts ?? []}
        cues={editCuesState.cues}
        onIgnoreConflict={onIgnoreConflict}
        onResetConflict={onResetConflict}
        onResolveConflict={onResolveConflict}
      />

      <div className="edit-cue-list">
        {editCuesState.cues.map((cue) => (
          <EditCueCard
            anchorOptions={anchorOptions}
            assetOptions={assetOptions}
            conflicts={conflictState?.conflicts.filter((conflict) => conflict.editCueIds.includes(cue.id)) ?? []}
            cue={cue}
            key={cue.id}
            onAddAsset={onAddAsset}
            onAddTag={onAddTag}
            onDeleteCue={onDeleteCue}
            onDuplicateCue={onDuplicateCue}
            onMarkReady={onMarkReady}
            onRemapCue={() => onRemapCue?.(cue.id)}
            onRemoveAsset={onRemoveAsset}
            onRemoveTag={onRemoveTag}
            onUpdateAnchor={onUpdateAnchor}
            onUpdateAudioBehavior={onUpdateAudioBehavior}
            onUpdateInstructions={onUpdateInstructions}
            onUpdatePriority={onUpdatePriority}
            onUpdateRole={onUpdateRole}
            onUpdateTimingFlexibility={onUpdateTimingFlexibility}
            onUpdateTitle={onUpdateTitle}
            onUpdateVisualBehavior={onUpdateVisualBehavior}
            remapResult={remapResults.find((result) => result.editCueId === cue.id)}
            validationIssues={validationIssues.filter((issue) => issue.editCueId === cue.id)}
          />
        ))}
      </div>
    </section>
  )
}
