import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../Button'

type EditBriefKeywordInputProps = {
  value: string[]
  suggestions?: string[]
  onChange?: (keywords: string[]) => void
  placeholder?: string
}

function cleanKeyword(keyword: string) {
  return keyword.trim().toLowerCase()
}

function addKeyword(keywords: string[], keyword: string) {
  const nextKeyword = cleanKeyword(keyword)
  if (!nextKeyword) return keywords
  return Array.from(new Set([...keywords, nextKeyword]))
}

export function EditBriefKeywordInput({
  onChange,
  placeholder = 'Add a style keyword...',
  suggestions = [],
  value,
}: EditBriefKeywordInputProps) {
  const [draftKeyword, setDraftKeyword] = useState('')

  function handleAddKeyword(keyword: string) {
    const nextKeywords = addKeyword(value, keyword)
    onChange?.(nextKeywords)
    setDraftKeyword('')
  }

  function handleRemoveKeyword(keyword: string) {
    onChange?.(value.filter((item) => item !== keyword))
  }

  return (
    <div className="edit-brief-keyword-input">
      <div className="edit-brief-keyword-list">
        {value.map((keyword) => (
          <button
            className="edit-brief-keyword-chip"
            key={keyword}
            onClick={() => handleRemoveKeyword(keyword)}
            type="button"
          >
            <span>{keyword}</span>
            <X aria-hidden="true" size={14} />
          </button>
        ))}
      </div>

      <div className="edit-brief-inline-input">
        <input
          onChange={(event) => setDraftKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddKeyword(draftKeyword)
            }
          }}
          placeholder={placeholder}
          value={draftKeyword}
        />
        <Button icon={Plus} onClick={() => handleAddKeyword(draftKeyword)} size="sm" variant="secondary">
          Add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="edit-brief-suggestion-row">
          {suggestions.map((suggestion) => {
            const selected = value.includes(cleanKeyword(suggestion))
            return (
              <button
                className={`compact-summary-chip ${selected ? 'edit-brief-suggestion-selected' : ''}`}
                disabled={selected}
                key={suggestion}
                onClick={() => handleAddKeyword(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
