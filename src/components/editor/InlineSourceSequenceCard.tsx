import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Play, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../Badge'
import { Button, IconButton } from '../Button'
import {
  clipSourceRoleOptions,
  getClipRoleLabel,
  getSourceOrderWarnings,
  getSourceSequenceModeHelper,
  getSourceSequenceModeLabel,
  inferClipSourceRole,
  sourceSequenceModeOptions,
  type SourceSequenceMoveDirection,
} from '../../lib/source-sequence'
import type { ClipSource, ClipSourceRole, SourceSequenceMode } from '../../types/reeditpro'

type InlineSourceSequenceCardProps = {
  clips: ClipSource[]
  onAddClip: () => void
  onConfirmOrder?: () => void
  onMoveClip: (id: string, direction: SourceSequenceMoveDirection) => void
  onRemoveClip: (id: string) => void
  onSetSourceSequenceMode?: (mode: SourceSequenceMode) => void
  onUpdateClip: (id: string, updates: Partial<ClipSource>) => void
  sourceOrderConfirmed?: boolean
  sourceSequenceMode?: SourceSequenceMode
}

function roleToClipUpdates(role: ClipSourceRole): Partial<ClipSource> {
  if (role === 'optional') {
    return { sourceRole: role, isOptional: true }
  }

  if (role === 'b_roll') {
    return { sourceRole: role, isOptional: true }
  }

  return { sourceRole: role, isOptional: false }
}

export function InlineSourceSequenceCard({
  clips,
  onAddClip,
  onConfirmOrder,
  onMoveClip,
  onRemoveClip,
  onSetSourceSequenceMode,
  onUpdateClip,
  sourceOrderConfirmed = false,
  sourceSequenceMode = clips.length === 1 ? 'single_complete_video' : 'multi_clip_story_order',
}: InlineSourceSequenceCardProps) {
  const warnings = getSourceOrderWarnings(clips, sourceOrderConfirmed)
  const singleVideo = clips.length === 1
  const confirmCopy = singleVideo ? 'Use this as the full source video' : 'Confirm source order'

  return (
    <section className="inline-chat-card source-sequence-card source-sequence-review source-sequence-review-card">
      <div className="source-sequence-header">
        <div>
          <span className="section-eyebrow">Source sequence</span>
          <h3>Review source order</h3>
          <p className="inline-helper">
            These clips are the source/story order. ReeditPro may suggest a stronger final edit order later, but it will show the plan before changing it.
          </p>
        </div>
        <div className="source-sequence-header-badges">
          <Badge accent={sourceOrderConfirmed ? 'success' : 'warning'}>
            {sourceOrderConfirmed ? 'Confirmed' : 'Needs confirmation'}
          </Badge>
          <span className="source-sequence-mode">{getSourceSequenceModeLabel(sourceSequenceMode)}</span>
        </div>
      </div>

      <div className="source-sequence-mode-panel">
        <div>
          <strong>{getSourceSequenceModeLabel(sourceSequenceMode)}</strong>
          <span>{getSourceSequenceModeHelper(sourceSequenceMode)}</span>
        </div>
        {onSetSourceSequenceMode && (
          <div className="source-sequence-mode-options" aria-label="Source sequence mode">
            {sourceSequenceModeOptions.map((mode) => (
              <button
                className={mode === sourceSequenceMode ? 'source-sequence-mode-button source-sequence-mode-button-active' : 'source-sequence-mode-button'}
                key={mode}
                onClick={() => onSetSourceSequenceMode(mode)}
                type="button"
              >
                {getSourceSequenceModeLabel(mode)}
              </button>
            ))}
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="source-order-warning-list">
          {warnings.slice(0, 3).map((warning) => (
            <p className="source-order-warning" key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {sourceOrderConfirmed && (
        <p className="source-order-confirmed-note">
          Source order confirmed. I&apos;ll use this as the story/source context.
        </p>
      )}

      <div className="source-sequence-strip">
        {clips.map((clip, index) => {
          const role = clip.sourceRole ?? inferClipSourceRole(clip)

          return (
            <article
              className={[
                'source-clip-card',
                clip.isImportant ? 'source-clip-card-important' : '',
                clip.isOptional ? 'source-clip-card-optional' : '',
              ].filter(Boolean).join(' ')}
              key={clip.id}
            >
              <div className="source-clip-order" aria-label={`Source order ${clip.uploadedOrder}`}>
                {clip.uploadedOrder}
              </div>

              <div className="source-clip-preview">
                <Play size={18} />
                <strong>{clip.previewLabel ?? 'Preview'}</strong>
                <span>{clip.thumbnailHint ?? 'Mock preview'}</span>
              </div>

              <div className="source-clip-meta">
                <div className="source-clip-title-row">
                  <strong>{clip.fileName}</strong>
                  <span>{clip.duration}</span>
                </div>
                <div className="source-clip-meta-row">
                  <span>{clip.detectedType}</span>
                  <span>{getClipRoleLabel(role)}</span>
                  {clip.isImportant && <Badge accent="success">Important</Badge>}
                  {clip.isOptional && <Badge accent="muted">Optional</Badge>}
                </div>

                <label>
                  <span>Source role</span>
                  <select
                    className="source-clip-role-select"
                    onChange={(event) => onUpdateClip(clip.id, roleToClipUpdates(event.target.value as ClipSourceRole))}
                    value={role}
                  >
                    {clipSourceRoleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {getClipRoleLabel(roleOption)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Notes for ReeditPro</span>
                  <textarea
                    onChange={(event) => onUpdateClip(clip.id, { notes: event.target.value })}
                    placeholder="Add source context, story note, or b-roll instruction"
                    rows={2}
                    value={clip.notes ?? ''}
                  />
                </label>
              </div>

              <div className="source-clip-controls">
                <label>
                  <input
                    checked={Boolean(clip.isImportant)}
                    onChange={(event) => onUpdateClip(clip.id, { isImportant: event.target.checked })}
                    type="checkbox"
                  />
                  Important
                </label>
                <label>
                  <input
                    checked={Boolean(clip.isOptional)}
                    onChange={(event) =>
                      onUpdateClip(clip.id, {
                        isOptional: event.target.checked,
                        sourceRole: event.target.checked
                          ? 'optional'
                          : clip.sourceRole === 'optional'
                            ? 'unknown'
                            : clip.sourceRole,
                      })}
                    type="checkbox"
                  />
                  Optional
                </label>
                <div className="clip-order-controls">
                  <IconButton disabled={index === 0 || singleVideo} icon={ArrowLeft} label={`Move ${clip.fileName} earlier in source order`} onClick={() => onMoveClip(clip.id, 'left')} />
                  <IconButton disabled={index === clips.length - 1 || singleVideo} icon={ArrowRight} label={`Move ${clip.fileName} later in source order`} onClick={() => onMoveClip(clip.id, 'right')} />
                </div>
                <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
              </div>
            </article>
          )
        })}
      </div>

      <div className="source-sequence-actions">
        <div className="source-sequence-add-block">
          <button className="inline-add-clip" onClick={onAddClip} type="button">
            <Plus size={16} />
            Add mock clip
          </button>
          <span>Real upload will be connected later.</span>
        </div>
        <div className="source-sequence-action-buttons">
          {onSetSourceSequenceMode && (
            <Button icon={HelpCircle} onClick={() => onSetSourceSequenceMode('unordered_clips_needs_ai_help')} variant="secondary">
              Let AI suggest final structure later
            </Button>
          )}
          {onConfirmOrder && (
            <Button disabled={clips.length === 0} icon={CheckCircle2} onClick={onConfirmOrder} variant={sourceOrderConfirmed ? 'secondary' : 'primary'}>
              {sourceOrderConfirmed ? 'Source order confirmed' : confirmCopy}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
