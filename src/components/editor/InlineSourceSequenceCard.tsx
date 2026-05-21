import { ArrowDown, ArrowUp, CheckCircle2, FileVideo, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../Badge'
import { Button, IconButton } from '../Button'
import type { SourceSequenceMoveDirection } from '../../lib/source-sequence'
import type { ClipSource, SourceSequenceMode } from '../../types/reeditpro'

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
  const singleVideo = clips.length === 1
  const confirmCopy = singleVideo ? 'Use this as the full source video' : 'Confirm source order'
  void sourceSequenceMode

  return (
    <section className="inline-chat-card source-sequence-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source sequence</span>
          <h3>Clips sent in chat</h3>
        </div>
        <div className="renderer-badge-row">
          <Badge accent="cyan">{clips.length} clips</Badge>
        </div>
      </div>
      <p className="inline-helper">
        Clips are kept in the order you send them. ReeditPro treats this as the source sequence, not automatically the final edit order.
      </p>

      {sourceOrderConfirmed && (
        <p className="source-order-confirmed-note">Source order confirmed. I&apos;ll use this as the story/source context.</p>
      )}

      <div className="chat-clip-list">
        {clips.map((clip, index) => (
          <article className="chat-clip-card" key={clip.id}>
            <div className="chat-clip-order">{clip.uploadedOrder}</div>
            <div className="chat-clip-thumb">
              <FileVideo size={18} />
            </div>
            <div className="chat-clip-meta">
              <strong>{clip.fileName}</strong>
              <span>{clip.duration} / {clip.detectedType}</span>
              <label>
                <span>Note</span>
                <input
                  onChange={(event) => onUpdateClip(clip.id, { notes: event.target.value })}
                  placeholder="Add note for AI"
                  value={clip.notes ?? ''}
                />
              </label>
            </div>
            <div className="chat-clip-flags">
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
                  onChange={(event) => onUpdateClip(clip.id, { isOptional: event.target.checked })}
                  type="checkbox"
                />
                Optional
              </label>
            </div>
            <div className="chat-clip-actions">
              <IconButton disabled={index === 0 || singleVideo} icon={ArrowUp} label={`Move ${clip.fileName} up`} onClick={() => onMoveClip(clip.id, 'up')} />
              <IconButton disabled={index === clips.length - 1 || singleVideo} icon={ArrowDown} label={`Move ${clip.fileName} down`} onClick={() => onMoveClip(clip.id, 'down')} />
              <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
            </div>
          </article>
        ))}
      </div>

      <div className="source-sequence-actions">
        <button className="inline-add-clip" onClick={onAddClip} type="button">
          <Plus size={16} />
          Add mock clip
        </button>
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
