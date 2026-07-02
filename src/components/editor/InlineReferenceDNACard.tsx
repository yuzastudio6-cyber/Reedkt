import { Link2, Paperclip, SkipForward } from 'lucide-react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import type { ReferenceAdaptationFocus, ReferenceDNA, ReferenceVideoPlan } from '../../types/reeditpro'

type InlineReferenceDNACardProps = {
  referenceVideoPlan?: ReferenceVideoPlan
  referenceUrl?: string
  onReferenceUrlChange?: (value: string) => void
  onAttachReference?: () => void
  onSkipReference?: () => void
  onFocusChange?: (focus: ReferenceAdaptationFocus[]) => void
}

const focusOptions: { value: ReferenceAdaptationFocus; label: string }[] = [
  { value: 'overall_style', label: 'Overall style' },
  { value: 'opening_style', label: 'Opening style' },
  { value: 'pacing', label: 'Pacing' },
  { value: 'caption_style', label: 'Captions' },
  { value: 'transition_style', label: 'Transitions' },
  { value: 'music_sound', label: 'Music/Sound' },
  { value: 'visual_effects', label: 'Visual effects' },
  { value: 'b_roll', label: 'B-roll' },
  { value: 'color_mood', label: 'Color/mood' },
  { value: 'signature_system_usage', label: 'Signature system usage' },
  { value: 'ignore_reference', label: 'Ignore reference' },
]

function toggleFocus(
  currentFocus: ReferenceAdaptationFocus[],
  value: ReferenceAdaptationFocus,
): ReferenceAdaptationFocus[] {
  if (value === 'ignore_reference') {
    return currentFocus.includes('ignore_reference') ? ['overall_style'] : ['ignore_reference']
  }

  const withoutIgnore = currentFocus.filter((focus) => focus !== 'ignore_reference')
  const nextFocus = withoutIgnore.includes(value)
    ? withoutIgnore.filter((focus) => focus !== value)
    : [...withoutIgnore, value]

  return nextFocus.length ? nextFocus : ['overall_style']
}

function ReferenceRuleList({ items }: { items: string[] }) {
  return (
    <ul className="reference-rule-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function ReferenceDNADetails({ dna }: { dna: ReferenceDNA }) {
  return (
    <details className="reference-dna-summary" open>
      <summary>Mock Reference DNA summary</summary>
      <div className="reference-dna-section">
        <strong>Topic</strong>
        <p>{dna.topic}</p>
      </div>
      <div className="reference-dna-grid">
        <div>
          <strong>Opening style</strong>
          <span>{dna.openingStyle}</span>
        </div>
        <div>
          <strong>Pacing</strong>
          <span>{dna.pacing}</span>
        </div>
        <div>
          <strong>Captions</strong>
          <span>{dna.captionStyle}; {dna.captionDensity}</span>
        </div>
        <div>
          <strong>Transitions</strong>
          <span>{dna.transitionStyle}</span>
        </div>
        <div>
          <strong>Music/SoundSync</strong>
          <span>{dna.musicIntro}; {dna.soundSyncStyle}</span>
        </div>
        <div>
          <strong>Visual effects</strong>
          <span>{dna.visualEffectStyle}</span>
        </div>
        <div>
          <strong>B-roll</strong>
          <span>{dna.brollStyle}</span>
        </div>
        <div>
          <strong>Color mood</strong>
          <span>{dna.colorGradeMood}</span>
        </div>
        <div>
          <strong>Signature usage</strong>
          <span>{dna.signatureSystemUsage.join(', ')}</span>
        </div>
        <div>
          <strong>Mood/tone</strong>
          <span>{dna.moodTone}</span>
        </div>
      </div>
      <div className="reference-dna-section">
        <strong>Why it works</strong>
        <ReferenceRuleList items={dna.whatWorks} />
      </div>
      <div className="reference-dna-section">
        <strong>Adaptation rules</strong>
        <ReferenceRuleList items={dna.adaptationRules} />
      </div>
      <div className="reference-dna-section reference-do-not-copy-note">
        <strong>Do-not-copy rules</strong>
        <ReferenceRuleList items={dna.doNotCopyRules} />
      </div>
      <div className="reference-dna-section">
        <strong>Limitations</strong>
        <ReferenceRuleList items={dna.sourceLimitations} />
      </div>
    </details>
  )
}

export function InlineReferenceDNACard({
  onAttachReference,
  onFocusChange,
  onReferenceUrlChange,
  onSkipReference,
  referenceUrl = '',
  referenceVideoPlan,
}: InlineReferenceDNACardProps) {
  const dna = referenceVideoPlan?.referenceDNA
  const activeFocus = dna?.focus ?? (referenceVideoPlan?.skipped ? ['ignore_reference'] : ['overall_style'])
  const status = referenceVideoPlan?.skipped
    ? 'Skipped'
    : dna
      ? 'Mock DNA ready'
      : referenceUrl.trim()
        ? 'Attached'
        : 'Optional'

  return (
    <section className="inline-chat-card reference-dna-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Reference video</span>
          <h3>Reference video</h3>
        </div>
        <Badge accent={dna ? 'violet' : referenceVideoPlan?.skipped ? 'warning' : 'muted'}>{status}</Badge>
      </div>

      <p className="inline-helper">
        Paste a reference video if you want ReeditPro to study the edit style. I'll extract style DNA without copying it shot-for-shot.
      </p>

      {onReferenceUrlChange && (
        <label className="reference-url-row">
          <Link2 aria-hidden="true" size={16} />
          <input
            onChange={(event) => onReferenceUrlChange(event.target.value)}
            placeholder="https://example.com/reference-video"
            value={referenceUrl}
          />
        </label>
      )}

      <div className="inline-card-actions">
        {onAttachReference && (
          <Button icon={Paperclip} onClick={onAttachReference} size="sm" variant="secondary">
            Attach mock reference
          </Button>
        )}
        {onSkipReference && (
          <Button icon={SkipForward} onClick={onSkipReference} size="sm" variant="ghost">
            Skip reference
          </Button>
        )}
      </div>

      <div className="reference-focus-grid" aria-label="Reference adaptation focus">
        {focusOptions.map((option) => {
          const active = activeFocus.includes(option.value)
          return (
            <button
              aria-pressed={active}
              className={active ? 'reference-focus-option reference-focus-option-active' : 'reference-focus-option'}
              key={option.value}
              onClick={() => onFocusChange?.(toggleFocus(activeFocus, option.value))}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {referenceVideoPlan?.skipped && (
        <p className="reference-skipped-note">Reference skipped. The plan will follow clips, instructions, workflow context, tier rules, and approval gates.</p>
      )}

      {!dna && !referenceVideoPlan?.skipped && (
        <p className="reference-skipped-note">No reference attached. You can skip this and ReeditPro will plan from your clips and instructions.</p>
      )}

      {dna && (
        <>
          <div className="reference-dna-section">
            <strong>Style guidance only</strong>
            <p>Reference DNA guides style. It does not override your instructions.</p>
            <p>ReeditPro will not copy the reference shot-for-shot.</p>
            <p>Reference video does not bypass credit approval.</p>
            <span className="reference-confidence-badge">Confidence: {dna.confidence}</span>
          </div>
          <ReferenceDNADetails dna={dna} />
        </>
      )}
    </section>
  )
}
