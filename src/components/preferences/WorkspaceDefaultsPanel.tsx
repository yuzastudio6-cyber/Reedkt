import { useState, type FormEvent } from 'react'
import {
  readProjectEditDefaultPreferenceSettings,
  saveProjectEditDefaultPreferenceSettings,
} from '../../lib/project-edit-default-preferences'
import {
  NEW_EDIT_SESSION_PREFERENCE_OPTIONS,
  type NewEditSessionPreferenceChoiceId,
} from '../../lib/project-edit-session-create-flow-ui-adapter'
import { Button } from '../Button'

type DefaultsSaveState = 'idle' | 'dirty' | 'saved'

const workspaceDefaultCopy: Record<NewEditSessionPreferenceChoiceId, { description: string; title: string }> = {
  none: {
    title: 'No saved preference',
    description: 'Choose a preference when you create an edit.',
  },
  lifestyle_travel_vlog: {
    title: 'Lifestyle travel vlog',
    description: 'Use this saved style as the starting point for new edits.',
  },
  legacy_clean_edit: {
    title: 'Clean edit',
    description: 'Use this older saved style and review its guidance before applying.',
  },
}

export function WorkspaceDefaultsPanel() {
  const [settings, setSettings] = useState(() => readProjectEditDefaultPreferenceSettings())
  const [saveState, setSaveState] = useState<DefaultsSaveState>(settings.source === 'preferences_page' ? 'saved' : 'idle')
  const status = saveState === 'saved'
    ? 'Saved for new edits.'
    : saveState === 'dirty'
      ? 'Unsaved changes.'
      : 'Choose a starting point.'

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = saveProjectEditDefaultPreferenceSettings({
      preferenceChoiceId: settings.preferenceChoiceId,
      preferenceNote: settings.preferenceNote,
    })
    setSettings(saved)
    setSaveState('saved')
  }

  function updatePreferenceChoice(preferenceChoiceId: NewEditSessionPreferenceChoiceId) {
    setSettings((current) => ({ ...current, preferenceChoiceId }))
    setSaveState('dirty')
  }

  return (
    <section className="preferences-clean-shell workspace-defaults" data-testid="preferences-clean-shell">
      <header className="workspace-defaults__header">
        <div>
          <span className="workspace-defaults__eyebrow">Workspace defaults</span>
          <h2>New edit starting point</h2>
          <p>Choose how future edits should begin. Existing edits will not change.</p>
        </div>
      </header>

      <form className="workspace-defaults__form" data-testid="preferences-default-edit-direction" onSubmit={handleSave}>
        <fieldset className="workspace-defaults__choices" data-testid="preferences-default-choice-grid">
          <legend>Default Edit Preference</legend>
          <div>
            {NEW_EDIT_SESSION_PREFERENCE_OPTIONS.map((option) => (
              <label
                className={`workspace-defaults__choice ${settings.preferenceChoiceId === option.id ? 'is-selected' : ''}`.trim()}
                data-testid={`preferences-default-choice-${option.id}`}
                key={option.id}
              >
                <input
                  checked={settings.preferenceChoiceId === option.id}
                  name="default-edit-preference"
                  onChange={() => updatePreferenceChoice(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span>
                  <strong>{workspaceDefaultCopy[option.id].title}</strong>
                  <small>{workspaceDefaultCopy[option.id].description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="planning-field workspace-defaults__note">
          <span>Optional note</span>
          <textarea
            data-testid="preferences-default-note"
            onChange={(event) => {
              setSettings((current) => ({ ...current, preferenceNote: event.currentTarget.value }))
              setSaveState('dirty')
            }}
            value={settings.preferenceNote}
          />
          <small>Keep it broad. You can refine direction inside each edit.</small>
        </label>

        <footer className="workspace-defaults__actions">
          <p aria-live="polite" data-state={saveState} data-testid="preferences-save-status">{status}</p>
          <Button disabled={saveState !== 'dirty'} type="submit" variant="primary">Save preference</Button>
        </footer>
      </form>
    </section>
  )
}
