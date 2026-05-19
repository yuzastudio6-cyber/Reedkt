import { Badge } from '../../Badge'
import type { SFXPromptPlanRecord } from '../../../types'
import { formatSFXLabel, formatSFXSeconds, sfxProviderLabels } from './sfxChatUiData'

type InlineSFXPromptPreviewCardProps = {
  promptPlan: SFXPromptPlanRecord
}

export function InlineSFXPromptPreviewCard({ promptPlan }: InlineSFXPromptPreviewCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-prompt-preview-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Prompt preview</span>
          <h3>{sfxProviderLabels[promptPlan.provider]}</h3>
        </div>
        <Badge accent="cyan">{formatSFXLabel(promptPlan.promptStyle)}</Badge>
      </div>

      <p className="sfx-muted-note">Prompt preview only. ReeditPro has not called Mirelo or MMAudio.</p>
      {promptPlan.provider === 'mmaudio_v' && <p className="sfx-muted-note">MMAudio prompts are short because the model is expected to use video context.</p>}
      {promptPlan.provider === 'mirelo_sfx_v1_5' && <p className="sfx-muted-note">Mirelo prompts are production-style and more controlled.</p>}

      <div className="sfx-score-grid">
        <span><strong>Model</strong>{promptPlan.modelName}</span>
        <span><strong>Needed duration</strong>{formatSFXSeconds(promptPlan.durationNeededSeconds)}</span>
        <span><strong>Generate duration</strong>{formatSFXSeconds(promptPlan.durationToGenerateSeconds)}</span>
        <span><strong>Duration policy</strong>{formatSFXLabel(promptPlan.generatedDurationPolicy)}</span>
      </div>

      <details className="sfx-details">
        <summary>Full provider prompt</summary>
        <p className="sfx-prompt-text">{promptPlan.prompt || 'No generation prompt created.'}</p>
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
        <p className="sfx-warning">{promptPlan.promptWarnings.join(' ')}</p>
      )}
    </section>
  )
}
