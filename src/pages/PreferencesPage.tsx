import { useState, type FormEvent } from 'react'
import { Captions, CheckCircle2, Palette, ShieldCheck, SlidersHorizontal, Volume2 } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  applyProjectEditDefaultPreferenceToNewEditForm,
  readProjectEditDefaultPreferenceSettings,
  saveProjectEditDefaultPreferenceSettings,
} from '../lib/project-edit-default-preferences'
import {
  createDefaultNewEditSessionFormState,
  NEW_EDIT_SESSION_PREFERENCE_OPTIONS,
  type NewEditSessionPreferenceChoiceId,
} from '../lib/project-edit-session-create-flow-ui-adapter'

const preferenceSections = [
  {
    title: 'Edit defaults',
    description: 'Default pacing, cleanup, b-roll restraint, and review style for new edits.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Visual style',
    description: 'Preferred balance for speaker focus, graphic overlays, Stroke Motion, and realistic motion.',
    icon: Palette,
  },
  {
    title: 'Captions',
    description: 'Caption density, safe placement, readability, and motion restraint.',
    icon: Captions,
  },
  {
    title: 'Sound',
    description: 'Music mood, loudness, SFX restraint, ducking, and beat timing preferences.',
    icon: Volume2,
  },
  {
    title: 'Privacy',
    description: 'Private media handling, approval gates, artifact cleanup, and export visibility defaults.',
    icon: ShieldCheck,
  },
]

export function PreferencesPage() {
  const [settings, setSettings] = useState(() => readProjectEditDefaultPreferenceSettings())
  const [status, setStatus] = useState(settings.source === 'preferences_page'
    ? 'Default preference loaded for new edits.'
    : 'Choose the default editing direction for new edits.')
  const previewForm = applyProjectEditDefaultPreferenceToNewEditForm(createDefaultNewEditSessionFormState(), settings)
  const selectedOption = NEW_EDIT_SESSION_PREFERENCE_OPTIONS.find((option) => option.id === settings.preferenceChoiceId)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = saveProjectEditDefaultPreferenceSettings({
      preferenceChoiceId: settings.preferenceChoiceId,
      preferenceNote: settings.preferenceNote,
    })
    setSettings(saved)
    setStatus('Default preference saved. New edits will start with this direction.')
  }

  function updatePreferenceChoice(preferenceChoiceId: NewEditSessionPreferenceChoiceId) {
    setSettings((current) => ({
      ...current,
      preferenceChoiceId,
    }))
    setStatus('Unsaved preference change.')
  }

  return (
    <AppShell
      description="Set the editing defaults ReEditPro should remember before each project and edit."
      eyebrow="Preferences"
      primaryAction={false}
      title="Preferences"
    >
      <section className="preferences-clean-shell" data-testid="preferences-clean-shell">
        <Card className="preferences-clean-intro">
          <Badge accent="cyan">Editing defaults</Badge>
          <h2>Keep preferences simple and reusable.</h2>
          <p>
            Preferences should guide future edit plans without turning the setup flow into a wall of controls. Set broad defaults here, then refine details inside each edit.
          </p>
        </Card>

        <div className="preferences-clean-grid">
          {preferenceSections.map((section) => (
            <Card className="preferences-clean-card" key={section.title}>
              <section.icon aria-hidden="true" size={22} />
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <Badge>Default</Badge>
            </Card>
          ))}
        </div>

        <Card className="preferences-clean-note" data-testid="preferences-default-edit-direction">
          <form onSubmit={handleSave}>
            <div className="preferences-clean-note__heading">
              <div>
                <h3>Default edit direction</h3>
                <p>New edits start with this preference choice and note. You can still change it inside each project.</p>
              </div>
              <Badge accent={settings.source === 'preferences_page' ? 'cyan' : 'muted'}>
                {settings.source === 'preferences_page' ? 'Saved' : 'Default'}
              </Badge>
            </div>

            <div className="preferences-clean-choice-grid" data-testid="preferences-default-choice-grid">
              {NEW_EDIT_SESSION_PREFERENCE_OPTIONS.map((option) => (
                <button
                  aria-pressed={settings.preferenceChoiceId === option.id}
                  className={`preferences-clean-choice ${settings.preferenceChoiceId === option.id ? 'is-selected' : ''}`.trim()}
                  data-testid={`preferences-default-choice-${option.id}`}
                  key={option.id}
                  onClick={() => updatePreferenceChoice(option.id)}
                  type="button"
                >
                  <strong>{option.handle ?? option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>

            <label className="planning-field">
              <span>Preference note</span>
              <textarea
                data-testid="preferences-default-note"
                onChange={(event) => {
                  setSettings((current) => ({
                    ...current,
                    preferenceNote: event.currentTarget.value,
                  }))
                  setStatus('Unsaved preference change.')
                }}
                value={settings.preferenceNote}
              />
            </label>

            <div className="preferences-clean-save-row">
              <p data-testid="preferences-save-status">
                <CheckCircle2 aria-hidden="true" size={16} />
                <span>{status}</span>
              </p>
              <Button type="submit" variant="primary">Save preference</Button>
            </div>

            <p className="preferences-clean-preview" data-testid="preferences-new-edit-default-preview">
              New edit default: <strong>{selectedOption?.handle ?? selectedOption?.label ?? 'None'}</strong>
              {' '}with note "{previewForm.preferenceNote}".
            </p>
          </form>
        </Card>
      </section>
    </AppShell>
  )
}
