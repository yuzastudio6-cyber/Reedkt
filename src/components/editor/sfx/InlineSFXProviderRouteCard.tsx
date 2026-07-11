import { Badge } from '../../Badge'
import type { SFXProviderRouteRecord } from '../../../types'
import { hideInternalToolNamesInCopy } from '../../../lib/tool-display-labels'
import { formatSFXLabel, sfxProviderLabels } from './sfxChatUiData'

type InlineSFXProviderRouteCardProps = {
  providerRoute: SFXProviderRouteRecord
}

export function InlineSFXProviderRouteCard({ providerRoute }: InlineSFXProviderRouteCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-provider-route-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Audio asset route</span>
          <h3>{sfxProviderLabels[providerRoute.recommendedProvider]}</h3>
        </div>
        <Badge accent={providerRoute.approvalRequired ? 'warning' : 'success'}>
          {providerRoute.approvalRequired ? 'Approval required' : 'No approval needed'}
        </Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Route role</strong>{formatSFXLabel(providerRoute.providerRole)}</span>
        <span><strong>Fallback</strong>{providerRoute.fallbackProvider ? sfxProviderLabels[providerRoute.fallbackProvider] : 'None'}</span>
        <span><strong>Internal library first</strong>{formatSFXLabel(providerRoute.useInternalLibraryFirst)}</span>
        <span><strong>Draft route</strong>{formatSFXLabel(providerRoute.useMMAudioForDraft)}</span>
        <span><strong>Production route</strong>{formatSFXLabel(providerRoute.useMireloForProduction)}</span>
        <span><strong>No SFX allowed</strong>{formatSFXLabel(providerRoute.noSfxAllowed)}</span>
        <span><strong>Cost sensitivity</strong>{formatSFXLabel(providerRoute.costSensitivity)}</span>
        <span><strong>Quality target</strong>{formatSFXLabel(providerRoute.qualityTarget)}</span>
      </div>

      <p className="sfx-muted-note">{hideInternalToolNamesInCopy(providerRoute.reason)}</p>
    </section>
  )
}
