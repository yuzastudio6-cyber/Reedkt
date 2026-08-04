import { EditSystemSection } from './EditSystemSection'
import type { EditElement, EditGroup, EditSelection, EditSystem } from '../../../types'

type EditMapPanelProps = {
  systems: EditSystem[]
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

export function EditMapPanel({
  activeSelection,
  elements,
  groups,
  onSelectElement,
  onSelectGroup,
  onSelectSystem,
  onSetElementVisibility,
  onSetGroupVisibility,
  onSetSystemVisibility,
  systems,
}: EditMapPanelProps) {
  return (
    <section className="inline-chat-card edit-map-panel">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit systems</span>
          <h3>Connected edit map</h3>
        </div>
      </div>
      <p className="inline-helper">Captions, B-roll, overlays, audio, and design stay connected.</p>
      <div className="edit-map-system-list">
        {systems.map((system) => (
          <EditSystemSection
            activeSelection={activeSelection}
            elements={elements}
            groups={groups.filter((group) => group.systemId === system.id)}
            key={system.id}
            onSelectElement={onSelectElement}
            onSelectGroup={onSelectGroup}
            onSelectSystem={onSelectSystem}
            onSetElementVisibility={onSetElementVisibility}
            onSetGroupVisibility={onSetGroupVisibility}
            onSetSystemVisibility={onSetSystemVisibility}
            system={system}
          />
        ))}
      </div>
    </section>
  )
}
