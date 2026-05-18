import type { EditPlan } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineLaunchToolStackCardProps = {
  plan: EditPlan
}

type LaunchToolStackItem = {
  id: string
  label: string
  role: string
  licenseAssumption: string
  productionStatus: string
  reviewNeeded: string
  workerStatus: string
  notes: string
  badges: string[]
}

const launchTools: LaunchToolStackItem[] = [
  {
    id: 'vapoursynth',
    label: 'VapourSynth',
    role: 'Video/frame pipeline',
    licenseAssumption: 'LGPL v2.1 working assumption',
    productionStatus: 'approved_candidate / needs_lgpl_compliance_review / needs_plugin_review',
    reviewNeeded: 'LGPL compliance and plugin licenses',
    workerStatus: 'Worker-only',
    notes: 'Frame-level video processing and Python-native frame pipeline candidate.',
    badges: ['Worker-only', 'Approved candidate', 'Needs review'],
  },
  {
    id: 'ffmpeg',
    label: 'FFmpeg LGPL Configuration',
    role: 'Ingest, audio extraction, trim, final encode/export',
    licenseAssumption: 'LGPL-safe configuration only until reviewed',
    productionStatus: 'required_candidate / needs_build_config_review / needs_codec_patent_review',
    reviewNeeded: 'Configure flags, codecs, patent/commercial exposure',
    workerStatus: 'Worker/export only',
    notes: 'Do not enable GPL or nonfree flags unless approved.',
    badges: ['Worker-only', 'Needs review'],
  },
  {
    id: 'audioflux',
    label: 'AudioFlux',
    role: 'Audio analysis / SoundSync',
    licenseAssumption: 'MIT working assumption',
    productionStatus: 'approved_candidate / needs_accuracy_benchmark',
    reviewNeeded: 'BPM, beat-drop, onset, and rhythm accuracy benchmark',
    workerStatus: 'Worker-only',
    notes: 'Launch candidate replacing Essentia for SoundSync analysis planning.',
    badges: ['Worker-only', 'Approved candidate', 'Replaced'],
  },
  {
    id: 'signalsmith_stretch',
    label: 'Signalsmith Stretch',
    role: 'Music stretch / pitch',
    licenseAssumption: 'MIT working assumption',
    productionStatus: 'approved_candidate / needs_audio_quality_benchmark',
    reviewNeeded: 'Quality benchmark for common stretch and pitch ranges',
    workerStatus: 'Worker-only',
    notes: 'Launch candidate replacing Rubber Band for music bed fitting.',
    badges: ['Worker-only', 'Approved candidate', 'Replaced'],
  },
  {
    id: 'sharp',
    label: 'Sharp + libvips',
    role: 'Asset/image pipeline',
    licenseAssumption: 'Sharp Apache 2.0; libvips LGPL working assumption',
    productionStatus: 'approved_candidate / needs_dependency_security_review / needs_lgpl_compliance_review',
    reviewNeeded: 'Optional dependencies, untrusted image handling, libvips compliance',
    workerStatus: 'Backend/worker asset pipeline',
    notes: 'Thumbnails, resize, overlays, watermarks, and image prep.',
    badges: ['Worker-only', 'Approved candidate', 'Needs review'],
  },
]

const notSelectedTools: LaunchToolStackItem[] = [
  {
    id: 'essentia',
    label: 'Essentia',
    role: 'Audio analysis',
    licenseAssumption: 'Future evaluation only',
    productionStatus: 'not_selected_for_launch / blocked_until_review',
    reviewNeeded: 'Legal/product review before any production use',
    workerStatus: 'Not selected for launch',
    notes: 'Replaced by AudioFlux for launch SoundSync analysis planning.',
    badges: ['Not selected for launch', 'Replaced', 'Needs review'],
  },
  {
    id: 'rubber_band',
    label: 'Rubber Band',
    role: 'Music stretch / pitch',
    licenseAssumption: 'Future evaluation only',
    productionStatus: 'not_selected_for_launch / blocked_until_review',
    reviewNeeded: 'Legal/commercial review before any production use',
    workerStatus: 'Not selected for launch',
    notes: 'Replaced by Signalsmith Stretch for launch stretch/pitch planning.',
    badges: ['Not selected for launch', 'Replaced', 'Needs review'],
  },
]

function badgeClass(label: string) {
  if (label === 'Worker-only') return 'tool-worker-only-badge'
  if (label === 'Approved candidate') return 'tool-approved-candidate-badge'
  if (label === 'Not selected for launch') return 'tool-not-selected-badge'
  if (label === 'Replaced') return 'tool-replaced-badge'
  return 'tool-review-needed-badge'
}

function ToolItem({ item }: { item: LaunchToolStackItem }) {
  return (
    <article className="launch-tool-stack-item">
      <div>
        <span className="launch-tool-stack-role">{item.role}</span>
        <h4>{item.label}</h4>
        <p>{item.notes}</p>
      </div>
      <div className="launch-tool-stack-summary">
        <span><strong>License</strong>{item.licenseAssumption}</span>
        <span><strong>Status</strong>{item.productionStatus}</span>
        <span><strong>Review</strong>{item.reviewNeeded}</span>
        <span><strong>Runtime</strong>{item.workerStatus}</span>
      </div>
      <div className="music-pill-row">
        {item.badges.map((badge) => (
          <span className={`launch-tool-status-badge ${badgeClass(badge)}`} key={badge}>{badge}</span>
        ))}
        <span className="launch-tool-status-badge">No execution</span>
      </div>
    </article>
  )
}

export function InlineLaunchToolStackCard({ plan }: InlineLaunchToolStackCardProps) {
  const plannedTools = plan.toolStrategyPlan?.toolIdsUsed.length ?? 0

  return (
    <InlinePlanCardShell
      className="launch-tool-stack-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">AudioFlux launch analysis</span>
          <span className="compact-summary-chip">Signalsmith stretch</span>
          <span className="compact-summary-chip">FFmpeg LGPL</span>
          <span className="compact-summary-chip">{plannedTools} planned tools</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Production policy"
      helper="ReeditPro's launch worker candidates use lower-risk replacements for audio analysis and time-stretch planning. This is not legal advice and no worker tools run in this demo."
      priority="developer_detail"
      status="ready"
      title="Launch tool stack"
    >
      <p className="license-assumption-note">
        This register is planning-only. Production use still requires legal, build, dependency, security, and quality review.
      </p>
      <div className="launch-tool-stack-grid">
        {launchTools.map((item) => (
          <ToolItem item={item} key={item.id} />
        ))}
      </div>
      <details className="understanding-section">
        <summary>Not selected for launch</summary>
        <div className="launch-tool-stack-grid">
          {notSelectedTools.map((item) => (
            <ToolItem item={item} key={item.id} />
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
