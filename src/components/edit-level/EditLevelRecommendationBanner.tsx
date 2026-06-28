import { Sparkles } from 'lucide-react'
import { Badge } from '../Badge'
import type { EditLevelRecommendationResult } from '../../types'
import { mapCanonicalEditLevelToPublicLabel } from '../../lib/edit-level-compatibility-mappers'

type EditLevelRecommendationBannerProps = {
  recommendation?: EditLevelRecommendationResult
}

export function EditLevelRecommendationBanner({ recommendation }: EditLevelRecommendationBannerProps) {
  if (!recommendation) {
    return (
      <section className="edit-level-recommendation-banner" data-testid="edit-level-recommendation-banner">
        <Sparkles aria-hidden="true" size={18} />
        <div>
          <span className="section-eyebrow">Edit Level recommendation</span>
          <h3>Recommendation loading from mock/local context</h3>
          <p>Safe defaults are used when project context is unavailable.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="edit-level-recommendation-banner" data-testid="edit-level-recommendation-banner">
      <Sparkles aria-hidden="true" size={18} />
      <div>
        <span className="section-eyebrow">Edit Level recommendation</span>
        <h3>Recommended: {mapCanonicalEditLevelToPublicLabel(recommendation.recommendedLevel)}</h3>
        <div className="edit-level-banner-meta">
          <Badge accent="cyan">{recommendation.confidence} confidence</Badge>
          {recommendation.userOverrideAllowed && <Badge accent="muted">Override allowed</Badge>}
        </div>
        <ul>
          {recommendation.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
          {recommendation.degradedCapabilityNotices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
          {recommendation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
