import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  DataVizPlanItem,
  EditPlan,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineDataVizPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function DataSummary({ item }: { item: DataVizPlanItem }) {
  return (
    <div className="dataviz-data-summary">
      <span><strong>Source</strong>{label(item.dataPlan.dataSourceType)}</span>
      <span><strong>Confidence</strong>{label(item.dataPlan.confidence)}</span>
      <span><strong>Safe wording</strong>{item.dataPlan.safeWording}</span>
      <span><strong>Mock/fictional</strong>{item.dataPlan.mockData ? 'mock' : item.dataPlan.fictionalData ? 'fictional' : 'no'}</span>
    </div>
  )
}

function DataVizItem({ item }: { item: DataVizPlanItem }) {
  return (
    <article className="dataviz-plan-item">
      <div>
        <span className="section-eyebrow">{label(item.visualType)} / {label(item.creditImpact)}</span>
        <h4>{item.title}</h4>
        <p>{item.purpose}</p>
      </div>

      <div className="understanding-chip-row">
        {item.toolIds.includes('d3') && <span className="dataviz-tool-badge">D3 planned</span>}
        {item.toolIds.includes('echarts') && <span className="dataviz-tool-badge">ECharts planned</span>}
        {item.toolIds.includes('vega_lite') && <span className="dataviz-tool-badge">Vega-Lite future</span>}
        {item.toolIds.includes('remotion') && <span className="dataviz-tool-badge">Remotion composed</span>}
        <span className="dataviz-no-render-note">No real chart render</span>
        {item.dataPlan.sourceNeeded && <span className="dataviz-source-needed-badge">Source needed</span>}
        {item.dataPlan.mockData && <span className="dataviz-mock-data-badge">Mock data</span>}
        {item.dataPlan.fictionalData && <span className="dataviz-fictional-data-badge">Fictional data</span>}
        {['claimed', 'approximate', 'unknown', 'reported'].includes(item.dataPlan.confidence) && (
          <span className="dataviz-confidence-badge">{label(item.dataPlan.confidence)} data</span>
        )}
      </div>

      <DataSummary item={item} />

      <div className="dataviz-plan-meta">
        <span><strong>Style</strong>{label(item.style.styleFamily)} / {item.style.labelDensity} labels</span>
        <span><strong>Animation</strong>{label(item.animation.animationType)} / {item.animation.durationMs}ms</span>
        <span><strong>Layout</strong>{label(item.layout.layoutMode)} / safe {item.layout.safeMargins}px</span>
        <span><strong>Preferred tool</strong>{label(item.preferredTool)}</span>
        <span><strong>Tools</strong>{item.toolIds.map(label).join(', ')}</span>
        <span><strong>Capabilities</strong>{item.remotionCapabilities.map(label).join(', ')}</span>
      </div>

      <div className="dataviz-style-summary">
        <span><strong>Palette</strong>{item.style.colorPalette.join(', ')}</span>
        <span><strong>Highlight</strong>{item.style.highlightColor}</span>
        <span><strong>Max labels</strong>{item.layout.maxLabelCount ?? 'auto'}</span>
      </div>

      <p className="dataviz-controlled-tool-note">{item.whyNotAiVideo}</p>

      <details className="understanding-section">
        <summary>Data nodes, fallback, QA, and worker notes</summary>
        <div className="dataviz-node-list">
          {item.dataPlan.nodes.slice(0, 5).map((node) => (
            <span key={node.id}><strong>{node.label}</strong>{label(node.confidence)} / {label(node.nodeType)}</span>
          ))}
        </div>
        <div className="dataviz-edge-list">
          {item.dataPlan.edges.slice(0, 4).map((edge) => (
            <span key={edge.id}>{edge.fromNodeId} {'->'} {edge.toNodeId}: {edge.label ?? label(edge.direction)}</span>
          ))}
        </div>
        <div className="dataviz-layout-summary">
          <span><strong>Fallback</strong>{item.fallbackStrategy.join(' ')}</span>
          <span><strong>Label avoid zones</strong>{item.layout.labelAvoidZones.length}</span>
          <span><strong>Source notes</strong>{item.dataPlan.notes.join(' ')}</span>
        </div>
        <ul>
          {item.qaChecks.slice(0, 5).map((qaCheck) => (
            <li key={qaCheck}>{qaCheck}</li>
          ))}
        </ul>
        <p className="dataviz-no-render-note">{item.workerNotes.join(' ')}</p>
      </details>
    </article>
  )
}

export function InlineDataVizPlanCard({ descriptor, plan }: InlineDataVizPlanCardProps) {
  const dataVizPlan = plan.dataVizPlan

  if (!dataVizPlan || !dataVizPlan.active) {
    return null
  }

  const visibleItems = dataVizPlan.items.slice(0, 4)
  const sourceNeeded = dataVizPlan.items.filter((item) => item.dataPlan.sourceNeeded).length
  const mockOrFictional = dataVizPlan.items.filter((item) => item.dataPlan.mockData || item.dataPlan.fictionalData).length

  return (
    <InlinePlanCardShell
      className="dataviz-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{dataVizPlan.items.length} dataviz items</span>
          <span className="compact-summary-chip">{dataVizPlan.toolsPlanned.map(label).join(', ')}</span>
          <span className="compact-summary-chip">{sourceNeeded} source-needed</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Controlled chart planning"
      helper="ReeditPro uses controlled chart and diagram planning for exact labels, money flows, timelines, metrics, comparisons, and VisualExplain graphics. This is planning only; no chart tools run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Chart + diagram plan"
    >
      <div className="dataviz-plan-summary-grid">
        <span><strong>{dataVizPlan.active ? 'Yes' : 'No'}</strong>active</span>
        <span><strong>{dataVizPlan.items.length}</strong>items</span>
        <span><strong>{dataVizPlan.toolsPlanned.length}</strong>tools planned</span>
        <span><strong>{sourceNeeded}</strong>source-needed</span>
        <span><strong>{mockOrFictional}</strong>mock/fictional</span>
      </div>

      <div className="understanding-chip-row">
        {dataVizPlan.toolsPlanned.map((toolId) => (
          <span className="dataviz-tool-badge" key={toolId}>{label(toolId)}</span>
        ))}
        <span className="dataviz-controlled-tool-note">Controlled tool, not AI video</span>
        <span className="dataviz-no-render-note">No chart render</span>
        <span className="dataviz-no-render-note">No data verification</span>
      </div>

      <p>{dataVizPlan.summary}</p>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Chart/diagram items</summary>
        <div className="dataviz-plan-item-list">
          {visibleItems.map((item) => (
            <DataVizItem item={item} key={item.id} />
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Rules and limitations</summary>
        <div className="dataviz-animation-summary">
          <span><strong>Rules</strong>{dataVizPlan.globalRules.join(' ')}</span>
          <span><strong>QA</strong>{dataVizPlan.qaChecks.join(' ')}</span>
          <span><strong>Limitations</strong>{dataVizPlan.limitations.join(' ')}</span>
          <span><strong>Notes</strong>{dataVizPlan.notes.join(' ')}</span>
        </div>
        <Badge accent="cyan">D3/ECharts/Remotion planning only</Badge>
      </details>
    </InlinePlanCardShell>
  )
}
