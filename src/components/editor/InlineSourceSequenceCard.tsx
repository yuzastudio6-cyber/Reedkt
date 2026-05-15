import { ArrowDown, ArrowUp, FileVideo, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../Badge'
import { IconButton } from '../Button'
import type { ClipSource } from '../../types/reeditpro'

type InlineSourceSequenceCardProps = {
  clips: ClipSource[]
  onAddClip: () => void
  onMoveClip: (id: string, direction: 'up' | 'down') => void
  onRemoveClip: (id: string) => void
  onUpdateClip: (id: string, updates: Partial<ClipSource>) => void
}

export function InlineSourceSequenceCard({
  clips,
  onAddClip,
  onMoveClip,
  onRemoveClip,
  onUpdateClip,
}: InlineSourceSequenceCardProps) {
  return (
    <section className="inline-chat-card source-sequence-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Source sequence</span>
          <h3>Clips sent in chat</h3>
        </div>
        <Badge accent="cyan">{clips.length} clips</Badge>
      </div>
      <p className="inline-helper">
        Clips are kept in the order you send them. ReeditPro treats this as the source sequence, not automatically the final edit order.
      </p>
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
              <IconButton disabled={index === 0} icon={ArrowUp} label={`Move ${clip.fileName} up`} onClick={() => onMoveClip(clip.id, 'up')} />
              <IconButton disabled={index === clips.length - 1} icon={ArrowDown} label={`Move ${clip.fileName} down`} onClick={() => onMoveClip(clip.id, 'down')} />
              <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
            </div>
          </article>
        ))}
      </div>
      <button className="inline-add-clip" onClick={onAddClip} type="button">
        <Plus size={16} />
        Attach another mock clip
      </button>
    </section>
  )
}
