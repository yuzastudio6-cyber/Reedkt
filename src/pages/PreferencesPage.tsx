import { Captions, Palette, ShieldCheck, SlidersHorizontal, Volume2 } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

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

        <Card className="preferences-clean-note">
          <h3>Default edit direction</h3>
          <label className="planning-field">
            <span>Preference note</span>
            <textarea defaultValue="Clean pacing, readable captions, natural sound, and no flashy transitions unless the edit asks for it." />
          </label>
          <Button variant="primary">Save preference</Button>
        </Card>
      </section>
    </AppShell>
  )
}
