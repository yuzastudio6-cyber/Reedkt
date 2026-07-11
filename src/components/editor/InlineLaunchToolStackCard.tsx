import type { EditPlan } from '../../types/reeditpro'
import { hideInternalToolNamesInCopy, userFacingActivityLabel } from '../../lib/tool-display-labels'
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
    label: 'Frame pipeline processing',
    role: 'Video/frame pipeline',
    licenseAssumption: 'LGPL v2.1 working assumption',
    productionStatus: 'approved_candidate / needs_lgpl_compliance_review / needs_plugin_review',
    reviewNeeded: 'LGPL compliance and plugin licenses',
    workerStatus: 'Private processing only',
    notes: 'Frame-level video processing and Python-native frame pipeline candidate.',
    badges: ['Private processing', 'Approved candidate', 'Needs review'],
  },
  {
    id: 'ffmpeg',
    label: 'Media assembly configuration',
    role: 'Ingest, audio extraction, trim, final encode/export',
    licenseAssumption: 'LGPL-safe configuration only until reviewed',
    productionStatus: 'required_candidate / needs_build_config_review / needs_codec_patent_review',
    reviewNeeded: 'Configure flags, codecs, patent/commercial exposure',
    workerStatus: 'Private export only',
    notes: 'Do not enable GPL or nonfree flags unless approved.',
    badges: ['Private processing', 'Needs review'],
  },
  {
    id: 'audioflux',
    label: 'Audio rhythm analysis',
    role: 'Audio rhythm and cue analysis',
    licenseAssumption: 'MIT working assumption',
    productionStatus: 'approved_candidate / needs_accuracy_benchmark',
    reviewNeeded: 'BPM, beat-drop, onset, and rhythm accuracy benchmark',
    workerStatus: 'Private processing only',
    notes: 'Launch candidate for rhythm and cue timing planning.',
    badges: ['Private processing', 'Approved candidate', 'Replaced'],
  },
  {
    id: 'signalsmith_stretch',
    label: 'Music stretch',
    role: 'Music stretch / pitch',
    licenseAssumption: 'MIT working assumption',
    productionStatus: 'approved_candidate / needs_audio_quality_benchmark',
    reviewNeeded: 'Quality benchmark for common stretch and pitch ranges',
    workerStatus: 'Private processing only',
    notes: 'Launch candidate for music bed fitting.',
    badges: ['Private processing', 'Approved candidate', 'Replaced'],
  },
  {
    id: 'sharp',
    label: 'Image preparation',
    role: 'Asset/image pipeline',
    licenseAssumption: 'Image preparation stack license review pending',
    productionStatus: 'approved_candidate / needs_dependency_security_review / needs_lgpl_compliance_review',
    reviewNeeded: 'Optional dependencies, untrusted image handling, image dependency compliance',
    workerStatus: 'Private asset pipeline',
    notes: 'Thumbnails, resize, overlays, watermarks, and image prep.',
    badges: ['Private processing', 'Approved candidate', 'Needs review'],
  },
]

const notSelectedTools: LaunchToolStackItem[] = [
  {
    id: 'essentia',
    label: 'Legacy audio analysis',
    role: 'Audio analysis',
    licenseAssumption: 'Future evaluation only',
    productionStatus: 'not_selected_for_launch / blocked_until_review',
    reviewNeeded: 'Legal/product review before any production use',
    workerStatus: 'Not selected for launch',
    notes: 'Replaced by the selected audio analysis path for launch rhythm planning.',
    badges: ['Not selected for launch', 'Replaced', 'Needs review'],
  },
  {
    id: 'rubber_band',
    label: 'Legacy music stretch',
    role: 'Music stretch / pitch',
    licenseAssumption: 'Future evaluation only',
    productionStatus: 'not_selected_for_launch / blocked_until_review',
    reviewNeeded: 'Legal/commercial review before any production use',
    workerStatus: 'Not selected for launch',
    notes: 'Replaced by the selected music stretch path for launch stretch/pitch planning.',
    badges: ['Not selected for launch', 'Replaced', 'Needs review'],
  },
]

function badgeClass(label: string) {
  if (label === 'Private processing') return 'tool-worker-only-badge'
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
        <h4>{userFacingActivityLabel(item.id)}</h4>
        <p>{hideInternalToolNamesInCopy(item.notes)}</p>
      </div>
      <div className="launch-tool-stack-summary">
        <span><strong>License</strong>{hideInternalToolNamesInCopy(item.licenseAssumption)}</span>
        <span><strong>Status</strong>{hideInternalToolNamesInCopy(item.productionStatus)}</span>
        <span><strong>Review</strong>{hideInternalToolNamesInCopy(item.reviewNeeded)}</span>
        <span><strong>Runtime</strong>{item.workerStatus}</span>
      </div>
      <div className="music-pill-row">
        {item.badges.map((badge) => (
          <span className={`launch-tool-status-badge ${badgeClass(badge)}`} key={badge}>{badge}</span>
        ))}
        <span className="launch-tool-status-badge">Execution gated</span>
      </div>
    </article>
  )
}

export function InlineLaunchToolStackCard({ plan }: InlineLaunchToolStackCardProps) {
  const plannedActivities = plan.toolStrategyPlan?.toolIdsUsed.length ?? 0

  return (
    <InlinePlanCardShell
      className="launch-tool-stack-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">Audio analysis</span>
          <span className="compact-summary-chip">Music stretch</span>
          <span className="compact-summary-chip">Media assembly review</span>
          <span className="compact-summary-chip">{plannedActivities} planned checks</span>
        </div>
      )}
      defaultExpanded={false}
      eyebrow="Production policy"
      helper="ReeditPro's launch capability candidates use lower-risk paths for audio analysis and time-stretch planning. This is not legal advice; processing activity remains approval-gated."
      priority="developer_detail"
      status="ready"
      title="Launch capability stack"
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
