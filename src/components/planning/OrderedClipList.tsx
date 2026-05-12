import { ArrowDown, ArrowUp, FileVideo, Plus, Trash2 } from 'lucide-react'
import type { ClipSource } from '../../types/reeditpro'
import { Badge } from '../Badge'
import { Button, IconButton } from '../Button'
import { Card } from '../Card'

type OrderedClipListProps = {
  clips: ClipSource[]
  onAddClip: () => void
  onMoveClip: (id: string, direction: 'up' | 'down') => void
  onRemoveClip: (id: string) => void
  onUpdateClip: (id: string, updates: Partial<ClipSource>) => void
}

export function OrderedClipList({ clips, onAddClip, onMoveClip, onRemoveClip, onUpdateClip }: OrderedClipListProps) {
  if (clips.length === 0) {
    return (
      <Card className="clip-empty-state">
        <FileVideo size={28} />
        <h3>No clips uploaded yet.</h3>
        <p>Add clips in source order so ReeditPro can understand your raw story.</p>
        <Button icon={Plus} onClick={onAddClip} variant="primary">
          Add mock clip
        </Button>
      </Card>
    )
  }

  return (
    <div className="ordered-clip-list">
      {clips.map((clip, index) => (
        <Card className="clip-card" key={clip.id}>
          <div className="clip-order">
            <span>{clip.uploadedOrder}</span>
          </div>
          <div className="clip-thumb" aria-hidden="true">
            <FileVideo size={24} />
          </div>
          <div className="clip-main">
            <div className="clip-title-row">
              <div>
                <h3>{clip.fileName}</h3>
                <p>
                  {clip.duration} / {clip.detectedType}
                </p>
              </div>
              <div className="clip-actions">
                <IconButton disabled={index === 0} icon={ArrowUp} label={`Move ${clip.fileName} up`} onClick={() => onMoveClip(clip.id, 'up')} />
                <IconButton
                  disabled={index === clips.length - 1}
                  icon={ArrowDown}
                  label={`Move ${clip.fileName} down`}
                  onClick={() => onMoveClip(clip.id, 'down')}
                />
                <IconButton icon={Trash2} label={`Remove ${clip.fileName}`} onClick={() => onRemoveClip(clip.id)} />
              </div>
            </div>
            <label className="planning-field compact-field">
              <span>Clip notes</span>
              <input
                onChange={(event) => onUpdateClip(clip.id, { notes: event.target.value })}
                placeholder="Add context for the planner"
                value={clip.notes ?? ''}
              />
            </label>
            <div className="clip-toggle-row">
              <label>
                <input checked={Boolean(clip.isImportant)} onChange={(event) => onUpdateClip(clip.id, { isImportant: event.target.checked })} type="checkbox" />
                Important
              </label>
              <label>
                <input checked={Boolean(clip.isOptional)} onChange={(event) => onUpdateClip(clip.id, { isOptional: event.target.checked })} type="checkbox" />
                Optional
              </label>
              {clip.isImportant && <Badge accent="cyan">Priority context</Badge>}
              {clip.isOptional && <Badge accent="warning">Use if helpful</Badge>}
            </div>
          </div>
        </Card>
      ))}
      <Button icon={Plus} onClick={onAddClip} variant="secondary">
        Add another mock clip
      </Button>
    </div>
  )
}
