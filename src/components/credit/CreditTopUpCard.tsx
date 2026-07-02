import type { CreditTopUpCardViewModel } from '../../lib/credit-ui-adapter'
import { Badge } from '../Badge'
import { Card } from '../Card'
import { CreditCardHeader, CreditCopyList, CreditWarningList } from './CreditUIPrimitives'

export function CreditTopUpCard({ topUp }: { topUp: CreditTopUpCardViewModel }) {
  return (
    <Card className="credit-ui-card credit-top-up-card">
      <CreditCardHeader badge={topUp.badge} eyebrow="Credit top-up" title={topUp.title} />
      <div className="credit-ui-summary-strip">
        <span><strong>{topUp.requiredCredits}</strong><small>Required credits</small></span>
        <span><strong>{topUp.recommendedPack ?? 'No pack needed'}</strong><small>Recommended pack</small></span>
        <span><strong>{topUp.nextSuggestedAction}</strong><small>Next suggested action</small></span>
      </div>
      <div className="credit-pack-grid">
        {topUp.packs.map((pack) => (
          <article className={pack.recommended ? 'recommended' : ''} key={pack.id}>
            <div>
              <strong>{pack.credits}</strong>
              <span>{pack.price}</span>
            </div>
            <small>{pack.label}</small>
            {pack.recommended && <Badge accent="success">Recommended</Badge>}
          </article>
        ))}
      </div>
      <CreditCopyList copy={topUp.copy} />
      <CreditWarningList warnings={topUp.warnings} />
    </Card>
  )
}
