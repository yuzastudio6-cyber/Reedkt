export function ProfessionalQaExplainer() {
  return (
    <section className="inline-chat-card professional-qa-explainer">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">What QA checks</span>
          <h3>Local checks before private review</h3>
        </div>
      </div>
      <p className="inline-helper">
        Professional QA checks the edit plan before private review: cue compliance, overlay safety, caption and face collisions, privacy blur, readable text, B-roll audio, crop/stabilization, safe zones, and source integrity.
      </p>
      <div className="professional-qa-examples">
        <span>Screenshot overlays should be readable, framed, and privacy-safe.</span>
        <span>B-roll should keep the main voice clear and avoid hard audio cuts.</span>
        <span>Captions and overlays should not collide.</span>
      </div>
    </section>
  )
}
