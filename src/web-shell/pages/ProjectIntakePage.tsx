import { ProjectIntakeCard } from '../projects/ProjectIntakeCard'

export function ProjectIntakePage() {
  return (
    <div className="web-shell-page">
      <section className="web-shell-page-heading">
        <div>
          <p className="web-shell-eyebrow">Browser-safe intake</p>
          <h2>New project intake is disabled by default.</h2>
          <p>
            Phase 44C shows the future intake surface without uploading real user media or mutating private storage from
            the browser.
          </p>
        </div>
      </section>
      <ProjectIntakeCard />
    </div>
  )
}
