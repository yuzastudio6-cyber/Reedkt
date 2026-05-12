import type { SignatureSystem } from '../data/mockData'
import { soundSyncPanel } from '../data/mockData'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'

type SignatureSystemPanelProps = {
  system: SignatureSystem
}

export function SignatureSystemPanel({ system }: SignatureSystemPanelProps) {
  return (
    <Card className={`signature-panel signature-${system.accent}`}>
      <div className="signature-icon">
        <system.icon aria-hidden="true" size={22} />
      </div>
      <div>
        <span className="section-eyebrow">{system.subtitle}</span>
        <h3>{system.title}</h3>
        <p>{system.description}</p>
      </div>
      <div className="signature-meta">
        <Badge accent={system.accent}>{system.status}</Badge>
        <span>{system.metric}</span>
      </div>
      <ul>
        {system.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Button size="sm" variant="secondary">
        {system.action}
      </Button>
    </Card>
  )
}

export function SoundSyncSupportPanel() {
  const Icon = soundSyncPanel.icon

  return (
    <Card className="signature-panel signature-success">
      <div className="signature-icon">
        <Icon aria-hidden="true" size={22} />
      </div>
      <div>
        <span className="section-eyebrow">{soundSyncPanel.subtitle}</span>
        <h3>{soundSyncPanel.title}</h3>
        <p>Supports the visual systems with music, sound effects, beat timing, transition cues, and voice ducking.</p>
      </div>
      <div className="signature-meta">
        <Badge accent={soundSyncPanel.accent}>{soundSyncPanel.status}</Badge>
        <span>{soundSyncPanel.metric}</span>
      </div>
      <ul>
        {soundSyncPanel.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Button size="sm" variant="secondary">
        {soundSyncPanel.action}
      </Button>
    </Card>
  )
}
