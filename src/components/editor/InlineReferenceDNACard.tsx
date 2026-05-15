import { Badge } from '../Badge'
import { referenceDNAItems } from './chatNativeData'

export function InlineReferenceDNACard() {
  return (
    <section className="inline-chat-card reference-dna-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Reference DNA</span>
          <h3>Style studied, not copied</h3>
        </div>
        <Badge accent="violet">Mock URL</Badge>
      </div>
      <div className="reference-dna-grid">
        {referenceDNAItems.map((item) => (
          <div key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
      <p className="inline-helper">ReeditPro studies the reference style. It does not copy the video shot-for-shot.</p>
    </section>
  )
}
