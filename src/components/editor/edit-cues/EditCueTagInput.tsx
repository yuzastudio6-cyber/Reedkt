import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../Button'

type EditCueTagInputProps = {
  value: string[]
  suggestions?: string[]
  onAddTag?: (tag: string) => void
  onRemoveTag?: (tag: string) => void
}

const defaultSuggestions = [
  'hook',
  'proof',
  'b-roll',
  'overlay',
  'caption',
  'CTA',
  'product',
  'screen',
  'logo',
  'avoid',
  'must-use',
  'premium',
]

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase()
}

export function EditCueTagInput({
  onAddTag,
  onRemoveTag,
  suggestions = defaultSuggestions,
  value,
}: EditCueTagInputProps) {
  const [draftTag, setDraftTag] = useState('')

  function handleAddTag(tag: string) {
    const nextTag = normalizeTag(tag)
    if (!nextTag || value.includes(nextTag)) return
    onAddTag?.(nextTag)
    setDraftTag('')
  }

  return (
    <div className="edit-cue-tag-input">
      <div className="edit-cue-inline-input">
        <input
          onChange={(event) => setDraftTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddTag(draftTag)
            }
          }}
          placeholder="Add cue tag..."
          value={draftTag}
        />
        <Button icon={Plus} onClick={() => handleAddTag(draftTag)} size="sm" variant="secondary">
          Add
        </Button>
      </div>

      <div className="edit-cue-tag-list">
        {value.map((tag) => (
          <button className="edit-cue-tag-chip" key={tag} onClick={() => onRemoveTag?.(tag)} type="button">
            <span>{tag}</span>
            <X aria-hidden="true" size={14} />
          </button>
        ))}
      </div>

      <div className="edit-cue-suggestion-row">
        {suggestions.map((suggestion) => {
          const normalized = normalizeTag(suggestion)
          const selected = value.includes(normalized)

          return (
            <button
              className={`compact-summary-chip ${selected ? 'edit-cue-suggestion-selected' : ''}`}
              disabled={selected}
              key={suggestion}
              onClick={() => handleAddTag(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          )
        })}
      </div>
    </div>
  )
}
