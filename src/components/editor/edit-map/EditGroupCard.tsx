import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { EditElementList } from './EditElementList'
import type { EditElement, EditGroup, EditSelection } from '../../../types'

type EditGroupCardProps = {
  group: EditGroup
  elements: EditElement[]
  activeSelection?: EditSelection
  onSelectGroup?: (groupId: string) => void
  onSelectElement?: (elementId: string) => void
  onSetGroupVisibility?: (groupId: string, visible: boolean) => void
  onSetElementVisibility?: (elementId: string, visible: boolean) => void
}

export function EditGroupCard({
  activeSelection,
  elements,
  group,
  onSelectElement,
  onSelectGroup,
  onSetElementVisibility,
  onSetGroupVisibility,
}: EditGroupCardProps) {
  const selected = activeSelection?.groupId === group.id && !activeSelection.elementId

  return (
    <article className={selected ? 'edit-group-card edit-group-card--selected' : 'edit-group-card'}>
      <div className="edit-group-card-header">
        <button className="edit-map-select-button" onClick={() => onSelectGroup?.(group.id)} type="button">
          <strong>{group.name}</strong>
          <small>{group.type.replace(/_/g, ' ')} / default {group.defaultEditScope.replace(/_/g, ' ')}</small>
        </button>
        <div className="edit-map-card-actions">
          {group.linkedByDefault && <Badge accent="cyan">linked</Badge>}
          <Badge accent={group.visible ? 'success' : 'muted'}>{group.visible ? 'shown' : 'hidden'}</Badge>
          <Badge accent={group.locked ? 'warning' : 'muted'}>{group.locked ? 'locked' : 'open'}</Badge>
        </div>
      </div>
      {group.name === 'Main Captions' && (
        <p className="inline-helper">Connected captions. Group edits apply to all main captions by default.</p>
      )}
      <div className="edit-map-card-actions">
        <Button
          icon={group.visible ? EyeOff : Eye}
          onClick={() => onSetGroupVisibility?.(group.id, !group.visible)}
          size="sm"
          variant="ghost"
        >
          {group.visible ? 'Hide' : 'Show'}
        </Button>
        <span className="edit-map-lock-label">{group.locked ? <Lock size={14} /> : <Unlock size={14} />}</span>
      </div>
      <EditElementList
        activeSelection={activeSelection}
        elements={elements}
        onSelectElement={onSelectElement}
        onSetElementVisibility={onSetElementVisibility}
      />
    </article>
  )
}
