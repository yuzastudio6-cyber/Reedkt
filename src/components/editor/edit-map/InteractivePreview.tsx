import type { CSSProperties } from 'react'
import type { EditMapSelectablePreviewElement } from '../../../types'

type InteractivePreviewProps = {
  selectableElements: EditMapSelectablePreviewElement[]
  selectedElementId?: string
  onSelectElement?: (elementId: string) => void
}

function kindLayer(kind: EditMapSelectablePreviewElement['kind']) {
  if (kind === 'captions') return 5
  if (kind === 'overlays' || kind === 'text_graphics') return 4
  if (kind === 'platform_layout') return 2
  if (kind === 'b_roll') return 1
  return 3
}

function elementStyle(element: EditMapSelectablePreviewElement): CSSProperties {
  return {
    left: `${element.bounds.x * 100}%`,
    top: `${element.bounds.y * 100}%`,
    width: `${element.bounds.width * 100}%`,
    height: `${element.bounds.height * 100}%`,
    zIndex: kindLayer(element.kind),
  }
}

export function InteractivePreview({ onSelectElement, selectableElements, selectedElementId }: InteractivePreviewProps) {
  return (
    <section className="inline-chat-card interactive-preview">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Interactive preview</span>
          <h3>Select the moment</h3>
        </div>
      </div>
      <div className="interactive-preview-frame" aria-label="Editable private review frame">
        <div className="interactive-preview-background">
          <span>Preview frame</span>
        </div>
        {selectableElements.map((element) => (
          <button
            aria-pressed={selectedElementId === element.elementId}
            className={[
              'preview-selectable-element',
              `preview-selectable-element--${element.kind.replace(/_/g, '-')}`,
              selectedElementId === element.elementId ? 'preview-selectable-element--selected' : '',
              element.locked ? 'preview-selectable-element--locked' : '',
            ].filter(Boolean).join(' ')}
            key={element.id}
            onClick={() => onSelectElement?.(element.elementId)}
            style={elementStyle(element)}
            type="button"
          >
            <span>{element.label}</span>
          </button>
        ))}
      </div>
      <p className="inline-helper">This is a selectable internal review frame for editing decisions. Public export remains gated.</p>
    </section>
  )
}
