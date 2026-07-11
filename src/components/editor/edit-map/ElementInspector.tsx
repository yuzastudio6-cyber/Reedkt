import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, Lock, Replace, Trash2, Undo2, Unlock, WandSparkles } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { EditScopeSelector } from './EditScopeSelector'
import type { BoundingBox, EditElement, EditGroup, EditScope, EditSystem } from '../../../types'

type ElementInspectorProps = {
  selectedElement?: EditElement
  selectedGroup?: EditGroup
  selectedSystem?: EditSystem
  selectedLabel?: string
  activeScope?: EditScope
  availableScopes?: EditScope[]
  onChangeScope?: (scope: EditScope) => void
  onToggleVisibility?: () => void
  onToggleLock?: () => void
  onRegenerateElement?: (elementId: string) => void
  onDeleteElement?: (elementId: string) => void
  onRestoreElement?: (elementId: string) => void
  onMoveElement?: (elementId: string, boundsPatch: Partial<BoundingBox>) => void
  onReplaceElementAsset?: (elementId: string, mediaAssetId: string) => void
  onUpdateGroupStyle?: (groupId: string, patch: Record<string, unknown>) => void
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function patchMove(bounds: BoundingBox | undefined, direction: 'up' | 'down' | 'left' | 'right'): Partial<BoundingBox> {
  const current = bounds ?? { x: 0.2, y: 0.2, width: 0.5, height: 0.16 }
  if (direction === 'up') return { y: clamp(current.y - 0.04) }
  if (direction === 'down') return { y: clamp(current.y + 0.04) }
  if (direction === 'left') return { x: clamp(current.x - 0.04) }
  return { x: clamp(current.x + 0.04) }
}

function isVisible(selectedElement?: EditElement, selectedGroup?: EditGroup, selectedSystem?: EditSystem) {
  return selectedElement?.visible ?? selectedGroup?.visible ?? selectedSystem?.visible ?? true
}

function isLocked(selectedElement?: EditElement, selectedGroup?: EditGroup, selectedSystem?: EditSystem, scope?: EditScope) {
  if (scope === 'single_element') return selectedElement?.locked ?? false
  return selectedGroup?.locked ?? selectedSystem?.locked ?? selectedElement?.locked ?? false
}

export function ElementInspector({
  activeScope = 'group',
  availableScopes = ['group'],
  onChangeScope,
  onDeleteElement,
  onMoveElement,
  onRegenerateElement,
  onReplaceElementAsset,
  onRestoreElement,
  onToggleLock,
  onToggleVisibility,
  onUpdateGroupStyle,
  selectedElement,
  selectedGroup,
  selectedLabel,
  selectedSystem,
}: ElementInspectorProps) {
  const deleted = selectedElement?.overrides?.deleted === true
  const visible = isVisible(selectedElement, selectedGroup, selectedSystem)
  const locked = isLocked(selectedElement, selectedGroup, selectedSystem, activeScope)

  return (
    <section className="inline-chat-card element-inspector">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Element Inspector</span>
          <h3>{selectedLabel ?? 'Select an edit element'}</h3>
        </div>
        {selectedSystem && <Badge accent="blue">{selectedSystem.name}</Badge>}
      </div>
      {!selectedLabel ? (
        <p className="inline-helper">Select a preview layer, group, or system to edit connected controls locally.</p>
      ) : (
        <>
          <div className="edit-map-inspector-grid">
            <span><strong>{selectedGroup?.name ?? 'No group'}</strong><small>Group</small></span>
            <span><strong>{selectedElement?.label ?? selectedSystem?.name ?? 'System'}</strong><small>Selection</small></span>
            <span><strong>{visible ? 'Shown' : 'Hidden'}</strong><small>Visibility</small></span>
            <span><strong>{locked ? 'Locked' : 'Unlocked'}</strong><small>Lock</small></span>
          </div>
          <EditScopeSelector availableScopes={availableScopes} onChange={onChangeScope} value={activeScope} />
          {selectedGroup?.name === 'Main Captions' && (
            <p className="inline-helper">If scope is All Main Captions, changes apply to the connected caption group.</p>
          )}
          <div className="edit-map-action-grid">
            <Button icon={visible ? EyeOff : Eye} onClick={onToggleVisibility} variant="secondary">
              {visible ? 'Hide selection' : 'Show selection'}
            </Button>
            <Button icon={locked ? Unlock : Lock} onClick={onToggleLock} variant="secondary">
              {locked ? 'Unlock' : 'Lock'}
            </Button>
          </div>
          {selectedGroup && (
            <div className="edit-map-action-stack">
              <span className="section-eyebrow">Style patches</span>
              <div className="edit-map-action-grid">
                <Button onClick={() => onUpdateGroupStyle?.(selectedGroup.id, { stylePresetId: 'style-smaller', scale: 'smaller' })} size="sm" variant="ghost">
                  Smaller
                </Button>
                <Button onClick={() => onUpdateGroupStyle?.(selectedGroup.id, { stylePresetId: 'style-larger', scale: 'larger' })} size="sm" variant="ghost">
                  Larger
                </Button>
                <Button onClick={() => onUpdateGroupStyle?.(selectedGroup.id, { stylePresetId: 'style-subtle', tone: 'subtle' })} size="sm" variant="ghost">
                  Subtle
                </Button>
                <Button onClick={() => onUpdateGroupStyle?.(selectedGroup.id, { stylePresetId: 'style-bold', tone: 'bold' })} size="sm" variant="ghost">
                  Bold
                </Button>
              </div>
            </div>
          )}
          {selectedElement && (
            <div className="edit-map-action-stack">
              <span className="section-eyebrow">Element actions</span>
              <div className="edit-map-action-grid">
                <Button icon={ArrowUp} onClick={() => onMoveElement?.(selectedElement.id, patchMove(selectedElement.visualBounds, 'up'))} size="sm" variant="ghost">
                  Move up
                </Button>
                <Button icon={ArrowDown} onClick={() => onMoveElement?.(selectedElement.id, patchMove(selectedElement.visualBounds, 'down'))} size="sm" variant="ghost">
                  Move down
                </Button>
                <Button icon={ArrowLeft} onClick={() => onMoveElement?.(selectedElement.id, patchMove(selectedElement.visualBounds, 'left'))} size="sm" variant="ghost">
                  Move left
                </Button>
                <Button icon={ArrowRight} onClick={() => onMoveElement?.(selectedElement.id, patchMove(selectedElement.visualBounds, 'right'))} size="sm" variant="ghost">
                  Move right
                </Button>
                <Button icon={Replace} onClick={() => onReplaceElementAsset?.(selectedElement.id, `${selectedElement.id}-replacement-placeholder`)} size="sm" variant="ghost">
                  Replace asset
                </Button>
                <Button icon={WandSparkles} onClick={() => onRegenerateElement?.(selectedElement.id)} size="sm" variant="ghost">
                  Regenerate
                </Button>
                {deleted ? (
                  <Button icon={Undo2} onClick={() => onRestoreElement?.(selectedElement.id)} size="sm" variant="secondary">
                    Restore
                  </Button>
                ) : (
                  <Button icon={Trash2} onClick={() => onDeleteElement?.(selectedElement.id)} size="sm" variant="danger">
                    Delete
                  </Button>
                )}
              </div>
              {selectedElement.overrides?.regenerationRequested === true && (
                <p className="inline-helper">Regeneration is marked for internal review. Provider calls remain gated.</p>
              )}
              {typeof selectedElement.overrides?.replacementMediaAssetId === 'string' && (
                <p className="inline-helper">Replacement asset is marked for internal review only.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
