import { Eye, EyeOff } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { EditElement, EditSelection } from '../../../types'

function formatRange(range: EditElement['timeRange']) {
  if (!range) return 'whole clip'
  const start = Math.round(range.startMs / 1000)
  const end = Math.round(range.endMs / 1000)
  return `${start}s-${end}s`
}

type EditElementListProps = {
  elements: EditElement[]
  activeSelection?: EditSelection
  onSelectElement?: (elementId: string) => void
  onSetElementVisibility?: (elementId: string, visible: boolean) => void
}

export function EditElementList({
  activeSelection,
  elements,
  onSelectElement,
  onSetElementVisibility,
}: EditElementListProps) {
  return (
    <div className="edit-element-list">
      {elements.map((element) => {
        const selected = activeSelection?.elementId === element.id
        return (
          <div className={selected ? 'edit-element-row edit-element-row--selected' : 'edit-element-row'} key={element.id}>
            <button className="edit-element-select" onClick={() => onSelectElement?.(element.id)} type="button">
              <strong>{element.label}</strong>
              <small>{formatRange(element.timeRange)}</small>
            </button>
            <div className="edit-element-row-actions">
              {element.locked && <Badge accent="warning">locked</Badge>}
              <Button
                icon={element.visible ? EyeOff : Eye}
                onClick={() => onSetElementVisibility?.(element.id, !element.visible)}
                size="sm"
                variant="ghost"
              >
                {element.visible ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
