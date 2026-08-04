import { Badge } from '../../Badge'
import type { SFXPromptPlanRecord } from '../../../types'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import { formatSFXLabel, formatSFXSeconds, sfxProviderLabels } from './sfxChatUiData'

type InlineSFXPromptPreviewCardProps = {
  promptPlan: SFXPromptPlanRecord
}

export function InlineSFXPromptPreviewCard({ promptPlan }: InlineSFXPromptPreviewCardProps) {
  const isMMAudioPrompt = promptPlan.provider === 'mmaudio_v2' || promptPlan.provider === 'mmaudio_v'
  const isMireloRoute = promptPlan.provider === 'mirelo_sfx_v1_6' || promptPlan.provider === 'mirelo_sfx_v1_5'

  return (
    <section className="inline-chat-card sfx-inline-card sfx-prompt-preview-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Audio asset brief</span>
          <h3>{sfxProviderLabels[promptPlan.provider]}</h3>
        </div>
        <Badge accent="cyan">{formatSFXLabel(promptPlan.promptStyle)}</Badge>
      </div>

      <p className="sfx-muted-note">Audio asset brief only. ReeditPro has not called an SFX asset service.</p>
      {isMMAudioPrompt && <p className="sfx-muted-note">Draft route briefs stay short because they are expected to use video context.</p>}
      {isMireloRoute && <p className="sfx-muted-note">This route is fixture-qualified for controlled planning and remains blocked for production execution.</p>}

      <div className="sfx-score-grid">
        <span><strong>Route status</strong>Gated until approval</span>
        <span><strong>Needed duration</strong>{formatSFXSeconds(promptPlan.durationNeededSeconds)}</span>
        <span><strong>Generate duration</strong>{formatSFXSeconds(promptPlan.durationToGenerateSeconds)}</span>
        <span><strong>Duration policy</strong>{formatSFXLabel(promptPlan.generatedDurationPolicy)}</span>
      </div>

      <details className="sfx-details">
        <summary>Full audio asset brief</summary>
        <p className="sfx-prompt-text">{promptPlan.prompt || 'No audio asset brief created.'}</p>
        {promptPlan.negativePrompt && <p className="sfx-negative-prompt-text">{promptPlan.negativePrompt}</p>}
      </details>

      <details className="sfx-details">
        <summary>Tags and instructions</summary>
        <div className="sfx-pill-row">
          {promptPlan.librarySearchTags.map((tag) => <span className="sfx-policy-badge" key={tag}>{tag}</span>)}
        </div>
        <ul className="sfx-compact-list">
          {promptPlan.timingInstructions.map((item) => <li key={item}>{item}</li>)}
          {promptPlan.mixInstructions.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>

      {promptPlan.promptWarnings.length > 0 && (
        <p className="sfx-warning">{hideInternalToolNamesInCopy(promptPlan.promptWarnings.join(' '))}</p>
      )}
    </section>
  )
}
