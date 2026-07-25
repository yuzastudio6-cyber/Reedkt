import type {
  CaptionPreference,
  EditBriefReadinessCheck,
  EditBriefState,
  EditBriefSummary,
  EditBriefTargetPlatform,
  MusicPreference,
  PacingPreference,
  SourceLibraryAsset,
  WorkflowActivityEvent,
} from '../../../types'
import { EditBriefAssetRulesSection } from './EditBriefAssetRulesSection'
import { EditBriefGoalSection } from './EditBriefGoalSection'
import { EditBriefNotesSection } from './EditBriefNotesSection'
import { EditBriefPlatformSection } from './EditBriefPlatformSection'
import { EditBriefPreferenceSection } from './EditBriefPreferenceSection'
import { EditBriefStyleSection } from './EditBriefStyleSection'
import { EditBriefSummaryCard } from './EditBriefSummaryCard'
import { EditBriefToolbar } from './EditBriefToolbar'

type EditBriefPanelProps = {
  editBriefState: EditBriefState | null
  summary?: EditBriefSummary | null
  readiness?: EditBriefReadinessCheck | null
  sourceAssets?: SourceLibraryAsset[]
  activityEvents?: WorkflowActivityEvent[]
  onUpdateGoal?: (goal: string) => void
  onUpdateAudience?: (audience: string) => void
  onUpdatePlatforms?: (platforms: EditBriefTargetPlatform[]) => void
  onUpdateTargetDuration?: (targetDurationMs?: number) => void
  onUpdateStyleKeywords?: (keywords: string[]) => void
  onUpdatePacingPreference?: (value: PacingPreference) => void
  onUpdateCaptionPreference?: (value: CaptionPreference) => void
  onUpdateMusicPreference?: (value: MusicPreference) => void
  onUpdateBRollPreference?: (value: string) => void
  onAddMustUseAsset?: (mediaAssetId: string) => void
  onRemoveMustUseAsset?: (mediaAssetId: string) => void
  onAddAvoidAsset?: (mediaAssetId: string) => void
  onRemoveAvoidAsset?: (mediaAssetId: string) => void
  onAddMustIncludeNote?: (note: string) => void
  onRemoveMustIncludeNote?: (note: string) => void
  onAddAvoidNote?: (note: string) => void
  onRemoveAvoidNote?: (note: string) => void
  onUpdateBrandNotes?: (notes: string) => void
  onUpdateSpecialInstructions?: (instructions: string) => void
  onUpdateReferenceUrls?: (referenceUrls: string[]) => void
  onResetBrief?: () => void
  onMarkReady?: () => void
  readOnly?: boolean
  className?: string
}

export function EditBriefPanel({
  activityEvents = [],
  className = '',
  editBriefState,
  onAddAvoidAsset,
  onAddAvoidNote,
  onAddMustIncludeNote,
  onAddMustUseAsset,
  onMarkReady,
  onRemoveAvoidAsset,
  onRemoveAvoidNote,
  onRemoveMustIncludeNote,
  onRemoveMustUseAsset,
  onResetBrief,
  onUpdateAudience,
  onUpdateBRollPreference,
  onUpdateBrandNotes,
  onUpdateCaptionPreference,
  onUpdateGoal,
  onUpdateMusicPreference,
  onUpdatePacingPreference,
  onUpdatePlatforms,
  onUpdateSpecialInstructions,
  onUpdateReferenceUrls,
  onUpdateStyleKeywords,
  onUpdateTargetDuration,
  readiness,
  sourceAssets = [],
  summary,
  readOnly = false,
}: EditBriefPanelProps) {
  if (!editBriefState) {
    return (
      <section className={`inline-chat-card edit-brief-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Edit Brief</span>
            <h3>Optional Edit Brief will be available after source prep.</h3>
          </div>
        </div>
      </section>
    )
  }

  const { editBrief } = editBriefState
  const latestEvent = activityEvents.at(-1)
  const meaningfulOperationCount = editBriefState.operations.filter((operation) =>
    operation.type !== 'create_brief' &&
    operation.type !== 'mark_ready' &&
    operation.type !== 'reset_brief'
  ).length

  return (
    <section className={`edit-brief-panel ${className}`.trim()} data-testid="edit-brief-panel">
      <EditBriefSummaryCard editBrief={editBrief} readiness={readiness} summary={summary} />
      {latestEvent && <p className="edit-brief-latest-event">Latest update: {latestEvent.title}</p>}

      {readOnly ? (
        <p className="clean-edit-inline-warning" data-testid="edit-brief-locked" role="note">
          This Edit Brief is frozen with the approved plan. Request changes in Chat to create a new plan and credit estimate without rewriting the approved version.
        </p>
      ) : null}

      <fieldset className="edit-brief-editable-fields" disabled={readOnly}>
        <legend className="sr-only">Edit Brief controls</legend>
        <EditBriefGoalSection
          audience={editBrief.audience}
          goal={editBrief.goal}
          onUpdateAudience={onUpdateAudience}
          onUpdateGoal={onUpdateGoal}
        />

        <EditBriefToolbar
          onMarkReady={onMarkReady}
          onResetBrief={onResetBrief}
          operationCount={meaningfulOperationCount}
          ready={Boolean(readiness?.ready)}
          status={editBrief.status}
        />

        <EditBriefPlatformSection
        onUpdatePlatforms={onUpdatePlatforms}
        onUpdateTargetDuration={onUpdateTargetDuration}
        targetDurationMs={editBrief.targetDurationMs}
        targetPlatforms={editBrief.targetPlatforms}
        />

        <EditBriefStyleSection
        onUpdateStyleKeywords={onUpdateStyleKeywords}
        styleKeywords={editBrief.styleKeywords}
        />

        <EditBriefPreferenceSection
        bRollPreference={editBrief.bRollPreference}
        captionPreference={editBrief.captionPreference}
        musicPreference={editBrief.musicPreference}
        onUpdateBRollPreference={onUpdateBRollPreference}
        onUpdateCaptionPreference={onUpdateCaptionPreference}
        onUpdateMusicPreference={onUpdateMusicPreference}
        onUpdatePacingPreference={onUpdatePacingPreference}
        pacingPreference={editBrief.pacingPreference}
        />

        <EditBriefAssetRulesSection
        avoidAssetIds={editBrief.avoidAssetIds}
        mustUseAssetIds={editBrief.mustUseAssetIds}
        onAddAvoidAsset={onAddAvoidAsset}
        onAddMustUseAsset={onAddMustUseAsset}
        onRemoveAvoidAsset={onRemoveAvoidAsset}
        onRemoveMustUseAsset={onRemoveMustUseAsset}
        sourceAssets={sourceAssets}
        />

        <EditBriefNotesSection
        avoidNotes={editBrief.avoidNotes}
        brandNotes={editBrief.brandNotes}
        mustIncludeNotes={editBrief.mustIncludeNotes}
        onAddAvoidNote={onAddAvoidNote}
        onAddMustIncludeNote={onAddMustIncludeNote}
        onRemoveAvoidNote={onRemoveAvoidNote}
        onRemoveMustIncludeNote={onRemoveMustIncludeNote}
        onUpdateBrandNotes={onUpdateBrandNotes}
        onUpdateSpecialInstructions={onUpdateSpecialInstructions}
        onUpdateReferenceUrls={onUpdateReferenceUrls}
        referenceUrls={editBrief.userProvidedReferenceUrls}
        specialInstructions={editBrief.specialInstructions}
        />
      </fieldset>
    </section>
  )
}
