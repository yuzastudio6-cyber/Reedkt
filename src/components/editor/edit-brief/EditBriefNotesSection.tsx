import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../Button'

type EditBriefNotesSectionProps = {
  mustIncludeNotes: string[]
  avoidNotes: string[]
  brandNotes?: string
  specialInstructions?: string
  referenceUrls?: string[]
  onAddMustIncludeNote?: (note: string) => void
  onRemoveMustIncludeNote?: (note: string) => void
  onAddAvoidNote?: (note: string) => void
  onRemoveAvoidNote?: (note: string) => void
  onUpdateBrandNotes?: (notes: string) => void
  onUpdateSpecialInstructions?: (instructions: string) => void
  onUpdateReferenceUrls?: (referenceUrls: string[]) => void
}

function NoteList({
  addLabel,
  notes,
  onAddNote,
  onRemoveNote,
  placeholder,
}: {
  addLabel: string
  notes: string[]
  onAddNote?: (note: string) => void
  onRemoveNote?: (note: string) => void
  placeholder: string
}) {
  const [draftNote, setDraftNote] = useState('')

  function handleAddNote() {
    const nextNote = draftNote.trim()
    if (!nextNote) return
    onAddNote?.(nextNote)
    setDraftNote('')
  }

  return (
    <div className="edit-brief-note-list">
      <div className="edit-brief-inline-input">
        <input
          onChange={(event) => setDraftNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAddNote()
            }
          }}
          placeholder={placeholder}
          value={draftNote}
        />
        <Button icon={Plus} onClick={handleAddNote} size="sm" variant="secondary">
          {addLabel}
        </Button>
      </div>

      <div className="edit-brief-note-chip-list">
        {notes.map((note) => (
          <button className="edit-brief-note-chip" key={note} onClick={() => onRemoveNote?.(note)} type="button">
            <span>{note}</span>
            <X aria-hidden="true" size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function EditBriefNotesSection({
  avoidNotes,
  brandNotes = '',
  mustIncludeNotes,
  onAddAvoidNote,
  onAddMustIncludeNote,
  onRemoveAvoidNote,
  onRemoveMustIncludeNote,
  onUpdateBrandNotes,
  onUpdateSpecialInstructions,
  onUpdateReferenceUrls,
  referenceUrls = [],
  specialInstructions = '',
}: EditBriefNotesSectionProps) {
  return (
    <section className="inline-chat-card edit-brief-section">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Notes</span>
          <h3>Add must-include, avoid, brand, and special direction.</h3>
        </div>
      </div>

      <div className="edit-brief-notes-grid">
        <div className="edit-brief-field">
          <span>Must include</span>
          <NoteList
            addLabel="Add"
            notes={mustIncludeNotes}
            onAddNote={onAddMustIncludeNote}
            onRemoveNote={onRemoveMustIncludeNote}
            placeholder="Example: Mention the renovated kitchen and private backyard."
          />
        </div>

        <div className="edit-brief-field">
          <span>Avoid</span>
          <NoteList
            addLabel="Add"
            notes={avoidNotes}
            onAddNote={onAddAvoidNote}
            onRemoveNote={onRemoveAvoidNote}
            placeholder="Example: Do not use the shaky hallway clip."
          />
        </div>
      </div>

      <label className="edit-brief-field">
        <span>Brand notes</span>
        <textarea
          onChange={(event) => onUpdateBrandNotes?.(event.target.value)}
          placeholder="Example: Keep it luxury, clean, black/white/gold, no cartoon effects."
          rows={3}
          value={brandNotes}
        />
      </label>

      <label className="edit-brief-field">
        <span>Special instructions</span>
        <textarea
          onChange={(event) => onUpdateSpecialInstructions?.(event.target.value)}
          placeholder="Example: Start with the strongest hook, keep captions subtle, and end with a clear CTA."
          rows={3}
          value={specialInstructions}
        />
      </label>

      <label className="edit-brief-field">
        <span>Reference links</span>
        <textarea
          data-testid="edit-brief-reference-urls"
          onChange={(event) => onUpdateReferenceUrls?.(
            event.target.value
              .split(/\r?\n/)
              .map((value) => value.trim())
              .filter(Boolean),
          )}
          placeholder="Add one approved reference URL per line. References guide direction; they are not copied shot-for-shot."
          rows={3}
          value={referenceUrls.join('\n')}
        />
      </label>
    </section>
  )
}
