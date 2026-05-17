import { ArrowDown, ArrowUp, CheckCircle2, Play, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../Badge'
import { Button, IconButton } from '../Button'
import type { ClipSource } from '../../types/reeditpro'

type InlineSourceSequenceCardProps = {
  clips: ClipSource[]
  onAddClip: () => void
  onConfirmOrder?: () => void
  onMoveClip: (id: string, direction: 'up' | 'down') => void
  onRemoveClip: (id: string) => void
  onUpdateClip: (id: string, updates: Partial<ClipSource>) => void
  sourceOrderConfirmed?: boolean
}

export function InlineSourceSequenceCard({
  clips,
  onAddClip,
  onConfirmOrder,
  onMoveClip,
  onRemoveClip,
  onUpdateClip,
  sourceOrderConfirmed = false,
}: InlineSourceSequenceCardProps) {
  return (
    <section className="inline-chat-card source-sequence-card source-sequence-review">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source sequence</span>
          <h3>Are these clips in the right story/source order?</h3>
        </div>
        <Badge accent={sourceOrderConfirmed ? 'success' : 'cyan'}>
          {sourceOrderConfirmed ? 'Source order confirmed' : `${clips.length} clips`}
        </Badge>
      </div>
      <p className="inline-helper">
        Uploaded order is your source/story order. ReeditPro can suggest a better final edit order later, but it will show the plan before changing it.
      </p>
      <div className="chat-clip-list">
        {clips.map((clip, index) => (
          <article className="chat-clip-card clip-sequence-row" key={clip.id}>
            <div className="chat-clip-order">{clip.uploadedOrder}</div>
            <div className="clip-preview-placeholder">
              <Play size={18} />
              <span>Preview</span>
            </div>
            <div className="chat-clip-meta">
              <strong>{clip.fileName}</strong>
              <span>Duration: {clip.duration}</span>
              <span>Detected: {clip.detectedType}</span>
              {clip.notes && <small>{clip.notes}</small>}
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
              <div className="clip-order-controls">
                <IconButton disabled={index === 0} icon={ArrowUp} label={`Move ${clip.fileName} earlier in source order`} onClick={() => onMoveClip(clip.id, 'up')} />
                <IconButton disabled={index === clips.length - 1} icon={ArrowDown} label={`Move ${clip.fileName} later in source order`} onClick={() => onMoveClip(clip.id, 'down')} />
              </div>
              <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
            </div>
          </article>
        ))}
      </div>
      <div className="source-sequence-actions">
        <button className="inline-add-clip" onClick={onAddClip} type="button">
          <Plus size={16} />
          Attach another mock clip
        </button>
        {onConfirmOrder && (
          <Button disabled={clips.length === 0} icon={CheckCircle2} onClick={onConfirmOrder} variant={sourceOrderConfirmed ? 'secondary' : 'primary'}>
            {sourceOrderConfirmed ? 'Source order confirmed' : 'Confirm source order'}
          </Button>
        )}
      </div>
    </section>
  )
}
