export function RevisionExplainer() {
  return (
    <section className="inline-chat-card revision-explainer">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">How revisions work</span>
          <h3>Edit Map changes become versioned requests</h3>
        </div>
      </div>
      <p className="inline-helper">
        Edit Map operations are local until they need a new private review. Revisions group those operations,
        classify whether they are free/local or need new private review preparation, estimate internal test credits,
        require approval when needed, and create a new local review version.
      </p>
      <p className="inline-helper">This is an internal test review. It does not publish media or charge real credits.</p>
    </section>
  )
}
