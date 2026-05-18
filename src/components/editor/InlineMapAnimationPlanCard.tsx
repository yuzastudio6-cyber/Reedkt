import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  EditPlan,
  MapAnimationPlanItem,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineMapAnimationPlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function LocationList({ item }: { item: MapAnimationPlanItem }) {
  return (
    <div className="map-location-list">
      {item.locations.map((location) => (
        <span className="map-location-item" key={location.id}>
          <strong>{location.label}</strong>
          {label(location.confidence)} / {label(location.claimStatus)} / {location.safeWording}
          {location.sourceNeeded && <em>source needed</em>}
        </span>
      ))}
    </div>
  )
}

function MapItem({ item }: { item: MapAnimationPlanItem }) {
  return (
    <article className="map-plan-item">
      <div>
        <span className="section-eyebrow">{label(item.mapVisualType)} / {label(item.creditImpact)}</span>
        <h4>{item.title}</h4>
        <p>{item.purpose}</p>
      </div>

      <div className="understanding-chip-row">
        {item.toolIds.includes('maplibre') && <span className="map-tool-badge">MapLibre planned</span>}
        {item.toolIds.includes('turf') && <span className="map-tool-badge">Turf planned</span>}
        {item.toolIds.includes('remotion') && <span className="map-tool-badge">Remotion composed</span>}
        <span className="map-no-render-note">No real map render</span>
        {item.locations.some((location) => location.sourceNeeded) && <span className="map-source-needed-badge">Location source needed</span>}
        {item.layout.foregroundMaskAware && <span className="map-confidence-badge">Map behind subject</span>}
        {item.mapVisualType === 'map_behind_subject_and_contact_object' && <span className="map-confidence-badge">Contact object preserved</span>}
      </div>

      <LocationList item={item} />

      <div className="map-plan-meta">
        <span><strong>Style</strong>{label(item.style.styleFamily)} / {item.style.labelDensity} labels</span>
        <span><strong>Camera</strong>{label(item.camera.animationType)} / zoom {item.camera.zoom ?? 'auto'} / pitch {item.camera.pitch ?? 'auto'}</span>
        <span><strong>Layout</strong>{label(item.layout.layoutMode)} / safe {item.layout.safeMargins}px</span>
        <span><strong>Tools</strong>{item.toolIds.map(label).join(', ')}</span>
        <span><strong>Capabilities</strong>{item.remotionCapabilities.map(label).join(', ')}</span>
        <span><strong>SoundSync</strong>{item.soundSyncCueIds.join(', ') || 'none'}</span>
      </div>

      {item.route && (
        <div className="map-route-summary">
          <strong>{item.route.routeLabel}</strong>
          {item.route.direction} / {item.route.routeRevealDurationMs}ms / {item.route.routeLineColor}
        </div>
      )}

      <p className="map-controlled-tool-note">{item.reason}</p>

      <details className="understanding-section">
        <summary>Fallback, QA, and worker notes</summary>
        <div className="map-layout-summary">
          <span><strong>Fallback</strong>{item.fallbackStrategy.join(' ')}</span>
          <span><strong>Depth</strong>{label(item.layout.depthCompositingMode)} / {label(item.layout.maskStrategy)}</span>
          <span><strong>Label avoid zones</strong>{item.layout.labelAvoidZones.length}</span>
        </div>
        <ul>
          {item.qaChecks.slice(0, 5).map((qaCheck) => (
            <li key={qaCheck}>{qaCheck}</li>
          ))}
        </ul>
        <p className="map-no-render-note">{item.workerNotes.join(' ')}</p>
      </details>
    </article>
  )
}

export function InlineMapAnimationPlanCard({ descriptor, plan }: InlineMapAnimationPlanCardProps) {
  const mapAnimationPlan = plan.mapAnimationPlan

  if (!mapAnimationPlan || !mapAnimationPlan.active) {
    return null
  }

  const visibleItems = mapAnimationPlan.items.slice(0, 4)
  const sourceNeeded = mapAnimationPlan.items.filter((item) => item.locations.some((location) => location.sourceNeeded)).length

  return (
    <InlinePlanCardShell
      className="map-animation-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{mapAnimationPlan.items.length} map items</span>
          <span className="compact-summary-chip">{mapAnimationPlan.mapToolsPlanned.map(label).join(', ')}</span>
          <span className="compact-summary-chip">{sourceNeeded} source-needed</span>
          <span className="compact-summary-chip">planning only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Controlled map planning"
      helper="ReeditPro uses controlled map planning for routes, pins, locations, neighborhoods, and documentary geography. This is planning only; no map tools run in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Map + location plan"
    >
      <div className="map-plan-summary-grid">
        <span><strong>{mapAnimationPlan.active ? 'Yes' : 'No'}</strong>active</span>
        <span><strong>{mapAnimationPlan.items.length}</strong>map items</span>
        <span><strong>{mapAnimationPlan.mapToolsPlanned.length}</strong>tools planned</span>
        <span><strong>{sourceNeeded}</strong>source-needed</span>
      </div>

      <div className="understanding-chip-row">
        {mapAnimationPlan.mapToolsPlanned.map((toolId) => (
          <span className="map-tool-badge" key={toolId}>{label(toolId)}</span>
        ))}
        <span className="map-controlled-tool-note">Controlled tool, not AI video</span>
        <span className="map-no-render-note">No geocoding</span>
        <span className="map-no-render-note">No tile calls</span>
      </div>

      <p>{mapAnimationPlan.summary}</p>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Map plan items</summary>
        <div className="map-plan-item-list">
          {visibleItems.map((item) => (
            <MapItem item={item} key={item.id} />
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Rules and limitations</summary>
        <div className="map-style-summary">
          <span><strong>Rules</strong>{mapAnimationPlan.globalRules.join(' ')}</span>
          <span><strong>QA</strong>{mapAnimationPlan.qaChecks.join(' ')}</span>
          <span><strong>Limitations</strong>{mapAnimationPlan.limitations.join(' ')}</span>
          <span><strong>Notes</strong>{mapAnimationPlan.notes.join(' ')}</span>
        </div>
        <Badge accent="cyan">MapLibre/Turf/Remotion planning only</Badge>
      </details>
    </InlinePlanCardShell>
  )
}
