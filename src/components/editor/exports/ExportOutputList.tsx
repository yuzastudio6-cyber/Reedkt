import { Badge } from '../../Badge'
import type { MockExportOutput } from '../../../types'

type ExportOutputListProps = {
  outputs: MockExportOutput[]
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

export function ExportOutputList({ outputs }: ExportOutputListProps) {
  return (
    <section className="inline-chat-card export-output-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Private output records</span>
          <h3>Release package records</h3>
        </div>
        <Badge accent={outputs.length ? 'success' : 'muted'}>{outputs.length} records</Badge>
      </div>
      {outputs.length === 0 ? (
        <p className="inline-helper">No private output records yet.</p>
      ) : (
        <div className="export-output-stack">
          {outputs.map((output) => (
            <article className="export-output-row" key={output.id}>
              <strong>{output.label}</strong>
              <small>Planned file name: {output.mockFileName}</small>
              <p>
                {label(output.fileFormat)} · {output.aspectRatio} · {output.resolution} · {label(output.quality)} · captions {label(output.captionMode)} · preview v{output.sourcePreviewVersion ?? 1}
              </p>
            </article>
          ))}
        </div>
      )}
      <p className="inline-helper">Download remains in the private review card; public delivery links stay gated.</p>
    </section>
  )
}
