import { Badge } from '../../Badge'
import type { MockExportEstimate } from '../../../types'

type MockExportEstimateCardProps = {
  estimate: MockExportEstimate | null
}

export function MockExportEstimateCard({ estimate }: MockExportEstimateCardProps) {
  return (
    <section className="inline-chat-card mock-export-estimate-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Export credit preview</span>
          <h3>{estimate?.totalCredits ?? 0} estimated credits</h3>
        </div>
        <Badge accent={(estimate?.totalCredits ?? 0) > 0 ? 'warning' : 'success'}>{estimate?.status ?? 'not ready'}</Badge>
      </div>
      <p className="inline-helper">{estimate?.explanation ?? 'No export credit preview yet.'}</p>
      <div className="mock-export-line-list">
        {estimate?.lineItems.length ? estimate.lineItems.map((item) => (
          <span className="mock-export-line-item" key={item.id}>
            <strong>{item.label}: {item.credits}</strong>
            <small>{item.quantity} × rehearsal rule · {item.explanation}</small>
          </span>
        )) : (
          <span className="mock-export-line-item">
            <strong>0 credits</strong>
            <small>No enabled export targets or credit-bearing output work.</small>
          </span>
        )}
      </div>
      <p className="inline-helper">Internal estimate only; no billing or credit spend occurs.</p>
    </section>
  )
}
