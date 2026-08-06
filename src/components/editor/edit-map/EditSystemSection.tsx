import { Eye, EyeOff } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { EditGroupCard } from './EditGroupCard'
import type { EditElement, EditGroup, EditSelection, EditSystem } from '../../../types'

type EditSystemSectionProps = {
  system: EditSystem
  groups: EditGroup[]
  elements: EditElement[]
  activeSelection?: EditSelection
  onSelectSystem?: (systemId: string) => void
  onSelectGroup?: (groupId: string) => void
  onSelectElement?: (elementId: string) => void
  onSetSystemVisibility?: (systemId: string, visible: boolean) => void
  onSetGroupVisibility?: (groupId: string, visible: boolean) => void
  onSetElementVisibility?: (elementId: string, visible: boolean) => void
}

export function EditSystemSection({
  activeSelection,
  elements,
  groups,
  onSelectElement,
  onSelectGroup,
  onSelectSystem,
  onSetElementVisibility,
  onSetGroupVisibility,
  onSetSystemVisibility,
  system,
}: EditSystemSectionProps) {
  const selected = activeSelection?.systemId === system.id && !activeSelection.groupId && !activeSelection.elementId

  return (
    <section className={selected ? 'edit-system-section edit-system-section--selected' : 'edit-system-section'}>
      <div className="edit-system-section-header">
        <button className="edit-map-select-button" onClick={() => onSelectSystem?.(system.id)} type="button">
          <strong>{system.name}</strong>
          <small>{system.kind.replace(/_/g, ' ')} / {groups.length} group{groups.length === 1 ? '' : 's'}</small>
        </button>
        <div className="edit-map-card-actions">
          <Badge accent={system.visible ? 'success' : 'muted'}>{system.visible ? 'shown' : 'hidden'}</Badge>
          {system.locked && <Badge accent="warning">locked</Badge>}
          <Button
            icon={system.visible ? EyeOff : Eye}
            onClick={() => onSetSystemVisibility?.(system.id, !system.visible)}
            size="sm"
            variant="ghost"
          >
            {system.visible ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>
      <div className="edit-map-chip-row">
        {system.globalControls.map((control) => <span key={control}>{control}</span>)}
      </div>
      <div className="edit-system-group-list">
        {groups.map((group) => (
          <EditGroupCard
            activeSelection={activeSelection}
            elements={elements.filter((element) => element.groupId === group.id)}
            group={group}
            key={group.id}
            onSelectElement={onSelectElement}
            onSelectGroup={onSelectGroup}
            onSetElementVisibility={onSetElementVisibility}
            onSetGroupVisibility={onSetGroupVisibility}
          />
        ))}
      </div>
    </section>
  )
}
