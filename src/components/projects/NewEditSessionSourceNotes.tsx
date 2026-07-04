import type {
  NewEditSessionSourceNote,
} from '../../lib/project-edit-session-create-flow-ui-adapter'
import { createNewEditSessionSourceNote } from '../../lib/project-edit-session-create-flow-ui-adapter'
import type { ProjectEditSessionSourceImportance } from '../../types/project-edit-session'
import { Button } from '../Button'

const importanceOptions: Array<{ id: ProjectEditSessionSourceImportance; label: string }> = [
  { id: 'primary', label: 'Primary' },
  { id: 'optional', label: 'Optional' },
  { id: 'broll', label: 'B-roll' },
  { id: 'reference_only', label: 'Reference only' },
]

type NewEditSessionSourceNotesProps = {
  value: NewEditSessionSourceNote[]
  onChange: (value: NewEditSessionSourceNote[]) => void
}

export function NewEditSessionSourceNotes({ onChange, value }: NewEditSessionSourceNotesProps) {
  function updateSourceNote(id: string, patch: Partial<NewEditSessionSourceNote>) {
    onChange(value.map((sourceNote) => sourceNote.id === id ? { ...sourceNote, ...patch } : sourceNote))
  }

  function removeSourceNote(id: string) {
    const next = value.filter((sourceNote) => sourceNote.id !== id)
    onChange(next.length ? next : [createNewEditSessionSourceNote()])
  }

  return (
    <fieldset className="new-edit-session-choice-group" data-testid="new-edit-source-notes">
      <legend>Source notes</legend>
      <p className="new-edit-session-muted">Metadata only. No upload, file-byte read, storage write, or media processing occurs.</p>
      <div className="new-edit-session-source-list">
        {value.map((sourceNote, index) => (
          <div className="new-edit-session-source-row" data-testid={`new-edit-source-note-${index}`} key={sourceNote.id}>
            <label className="new-edit-session-field">
              <span>Clip label</span>
              <input
                data-testid={`new-edit-source-label-${index}`}
                onChange={(event) => updateSourceNote(sourceNote.id, { label: event.target.value })}
                placeholder="Hero clip, product detail, b-roll..."
                type="text"
                value={sourceNote.label}
              />
            </label>
            <label className="new-edit-session-field">
              <span>Notes</span>
              <textarea
                data-testid={`new-edit-source-notes-${index}`}
                onChange={(event) => updateSourceNote(sourceNote.id, { notes: event.target.value })}
                placeholder="What this source should teach the future Edit Chat"
                rows={3}
                value={sourceNote.notes}
              />
            </label>
            <label className="new-edit-session-field">
              <span>Importance</span>
              <select
                data-testid={`new-edit-source-importance-${index}`}
                onChange={(event) => updateSourceNote(sourceNote.id, { importance: event.target.value as ProjectEditSessionSourceImportance })}
                value={sourceNote.importance}
              >
                {importanceOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <Button onClick={() => removeSourceNote(sourceNote.id)} size="sm" variant="ghost">
              Remove source note
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={() => onChange([...value, createNewEditSessionSourceNote()])}
        size="sm"
        variant="secondary"
      >
        Add source note
      </Button>
    </fieldset>
  )
}
