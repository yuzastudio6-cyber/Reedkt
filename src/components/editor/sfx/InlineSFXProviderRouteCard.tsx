import { Badge } from '../../Badge'
import type { SFXProviderRouteRecord } from '../../../types'
import { formatSFXLabel, sfxProviderLabels } from './sfxChatUiData'

type InlineSFXProviderRouteCardProps = {
  providerRoute: SFXProviderRouteRecord
}

export function InlineSFXProviderRouteCard({ providerRoute }: InlineSFXProviderRouteCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-provider-route-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Provider route</span>
          <h3>{sfxProviderLabels[providerRoute.recommendedProvider]}</h3>
        </div>
        <Badge accent={providerRoute.approvalRequired ? 'warning' : 'success'}>
          {providerRoute.approvalRequired ? 'Approval required' : 'No approval needed'}
        </Badge>
      </div>

      <div className="sfx-score-grid">
        <span><strong>Provider role</strong>{formatSFXLabel(providerRoute.providerRole)}</span>
        <span><strong>Fallback</strong>{providerRoute.fallbackProvider ? sfxProviderLabels[providerRoute.fallbackProvider] : 'None'}</span>
        <span><strong>Internal library first</strong>{formatSFXLabel(providerRoute.useInternalLibraryFirst)}</span>
        <span><strong>MMAudio draft</strong>{formatSFXLabel(providerRoute.useMMAudioForDraft)}</span>
        <span><strong>Mirelo production</strong>{formatSFXLabel(providerRoute.useMireloForProduction)}</span>
        <span><strong>No SFX allowed</strong>{formatSFXLabel(providerRoute.noSfxAllowed)}</span>
        <span><strong>Cost sensitivity</strong>{formatSFXLabel(providerRoute.costSensitivity)}</span>
        <span><strong>Quality target</strong>{formatSFXLabel(providerRoute.qualityTarget)}</span>
      </div>

      <p className="sfx-muted-note">{providerRoute.reason}</p>
    </section>
  )
}
