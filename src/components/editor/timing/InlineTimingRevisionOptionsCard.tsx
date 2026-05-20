import {
  Captions,
  CheckCircle2,
  FastForward,
  Gauge,
  Music2,
  PauseCircle,
  Play,
  ShieldAlert,
  Sparkles,
  Volume2,
  Wand2,
  Waves,
} from 'lucide-react'
import { Button } from '../../Button'

type InlineTimingRevisionOptionsCardProps = {
  onChoose: (message: string) => void
}

const options = [
  ['Approve timing', 'Timing approved for this mock review.', CheckCircle2, 'primary'],
  ['Apply suggested fixes', 'Suggested mock timing fixes applied in chat.', Wand2, 'secondary'],
  ['Preserve emotional pauses', 'Updated mock preference: preserve emotional pauses.', PauseCircle, 'ghost'],
  ['Make pacing faster', 'Updated mock preference: make pacing faster while protecting speech meaning.', FastForward, 'ghost'],
  ['Make pacing smoother', 'Updated mock preference: make pacing smoother and less abrupt.', Waves, 'ghost'],
  ['Make captions slower', 'Updated mock preference: slow captions for readability.', Captions, 'ghost'],
  ['Move captions away from overlays', 'Updated mock preference: move captions away from overlays.', ShieldAlert, 'ghost'],
  ['Fix music ducking', 'Updated mock preference: fix music ducking before preview.', Music2, 'ghost'],
  ['Fix SFX hit timing', 'Updated mock preference: realign SFX hits to timing anchors.', Volume2, 'ghost'],
  ['Fix signature overlay timing', 'Updated mock preference: retime signature overlays to speech meaning.', Sparkles, 'ghost'],
  ['Generate preview anyway', 'Preview would continue in mock mode only. No rendering starts here.', Play, 'secondary'],
  ['Block render until fixed', 'Render remains blocked until timing fixes are reviewed.', Gauge, 'secondary'],
] as const

export function InlineTimingRevisionOptionsCard({ onChoose }: InlineTimingRevisionOptionsCardProps) {
  return (
    <section className="inline-chat-card timing-inline-card timing-revision-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Timing options</span>
          <h3>Choose what ReeditPro should do next</h3>
        </div>
      </div>
      <p className="inline-helper">These are mock chat actions only. They do not mutate backend records, start rendering, or spend credits.</p>
      <div className="inline-card-actions timing-revision-actions">
        {options.map(([label, message, Icon, variant]) => (
          <Button
            icon={Icon}
            key={label}
            onClick={() => onChoose(message)}
            size="sm"
            variant={variant}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  )
}
