export function GenerationReadinessExplainer() {
  return (
    <section className="inline-chat-card generation-readiness-explainer">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">What this gate does</span>
          <h3>Internal private review handoff</h3>
        </div>
      </div>
      <p className="inline-helper">
        Review readiness checks whether the project can safely move from planning into private review. It looks at planning context, treatment decisions, QA, internal credit estimates, and approval.
      </p>
      <p className="inline-helper">
        This readiness check rehearses the handoff. Publishing, AI asset preparation, billing, and credit charging only happen after their approval gates pass.
      </p>
    </section>
  )
}
