import { Badge } from '../Badge'
import type {
  ChatPlanningCardDescriptor,
  ColorOperationPlan,
  EditPlan,
} from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineColorPipelineCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'none'
}

function operationSummary(operation: ColorOperationPlan) {
  return `${label(operation.operation)} / ${label(operation.toolId)} / ${label(operation.status)}`
}

function OperationList({ operations }: { operations: ColorOperationPlan[] }) {
  return (
    <div className="color-operation-list">
      {operations.slice(0, 8).map((operation) => (
        <span className="color-operation-item" key={operation.id}>
          <strong>{operation.label}</strong>
          {label(operation.toolId)} / {label(operation.intensity)}
        </span>
      ))}
    </div>
  )
}

export function InlineColorPipelineCard({ descriptor, plan }: InlineColorPipelineCardProps) {
  const colorPipelinePlan = plan.colorPipelinePlan

  if (!colorPipelinePlan) {
    return null
  }

  const clipPlans = colorPipelinePlan.clipPlans.slice(0, 4)
  const assetPlans = colorPipelinePlan.assetMatchPlans.slice(0, 5)

  return (
    <InlinePlanCardShell
      className="color-pipeline-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{label(colorPipelinePlan.colorGradeStyle)}</span>
          <span className="compact-summary-chip">{label(colorPipelinePlan.intensity)}</span>
          <span className="compact-summary-chip">{colorPipelinePlan.clipPlans.length} clips</span>
          <span className="compact-summary-chip">{colorPipelinePlan.assetMatchPlans.length} asset matches</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Professional color planning"
      helper="Every ReeditPro edit gets a professional color plan. Basic gets clean correction; Pro and Premium add deeper style matching and asset consistency."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Color pipeline"
    >
      <div className="color-summary-grid">
        <span><strong>{label(colorPipelinePlan.colorGradeStyle)}</strong>grade style</span>
        <span><strong>{label(colorPipelinePlan.intensity)}</strong>intensity</span>
        <span><strong>{colorPipelinePlan.stages.length}</strong>stages</span>
        <span><strong>{colorPipelinePlan.toolsPlanned.length}</strong>tools planned</span>
        <span><strong>{colorPipelinePlan.clipPlans.length}</strong>clip plans</span>
        <span><strong>{colorPipelinePlan.assetMatchPlans.length}</strong>asset matches</span>
      </div>

      <div className="understanding-chip-row">
        <span className="color-style-badge">{label(colorPipelinePlan.colorGradeStyle)}</span>
        <span className="color-intensity-badge">{label(colorPipelinePlan.intensity)}</span>
        {colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'skin_tone_protection') && (
          <span className="skin-tone-protection-badge">Skin tone protected</span>
        )}
        {colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'shot_matching') && (
          <span className="shot-matching-badge">Shot matching</span>
        )}
        {colorPipelinePlan.assetMatchPlans.length > 0 && (
          <span className="asset-match-badge">Generated asset match</span>
        )}
        <span className="color-tool-note">Planning only</span>
      </div>

      <div className="color-stage-list">
        {colorPipelinePlan.stages.map((stage) => (
          <span key={stage}>{label(stage)}</span>
        ))}
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Project color plan</summary>
        <p>{colorPipelinePlan.summary}</p>
        <OperationList operations={colorPipelinePlan.projectOperations} />
        <div className="color-qa-list">
          {colorPipelinePlan.qaChecks.slice(0, 6).map((qaCheck) => (
            <span key={qaCheck}>{qaCheck}</span>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Clip color plans</summary>
        <div className="clip-color-plan-list">
          {clipPlans.map((clipPlan) => (
            <article className="clip-color-plan-item" key={clipPlan.id}>
              <div>
                <span className="section-eyebrow">{label(clipPlan.colorGradeStyle)}</span>
                <h4>{clipPlan.clipLabel}</h4>
              </div>
              <div className="understanding-chip-row">
                {clipPlan.skinToneProtection && <span className="skin-tone-protection-badge">Skin tone protected</span>}
                {clipPlan.referenceClipId && <span className="shot-matching-badge">Reference {clipPlan.referenceClipId}</span>}
                {clipPlan.qualityIssues.map((issue) => (
                  <span className="quality-issue-badge" key={issue}>{label(issue)}</span>
                ))}
              </div>
              <OperationList operations={[...clipPlan.correctionOperations, ...clipPlan.lookOperations]} />
              <ul>
                {clipPlan.shotMatchingNotes.slice(0, 2).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Generated asset matching</summary>
        <div className="asset-color-match-list">
          {assetPlans.map((assetPlan) => (
            <article className="asset-color-match-item" key={assetPlan.id}>
              <div>
                <span className="section-eyebrow">{label(assetPlan.assetType)}</span>
                <h4>{assetPlan.assetLabel}</h4>
                <p>Match to {label(assetPlan.matchToColorGrade)}{assetPlan.matchPanelBackgroundColor ? ` with panel ${assetPlan.matchPanelBackgroundColor}` : ''}.</p>
              </div>
              <div className="understanding-chip-row">
                {assetPlan.providerModel && <Badge accent="violet">{label(assetPlan.providerModel)}</Badge>}
                <span className="asset-match-badge">Panel background match</span>
              </div>
              <OperationList operations={assetPlan.operations} />
              <ul>
                {assetPlan.qaChecks.slice(0, 3).map((qaCheck) => (
                  <li key={qaCheck}>{qaCheck}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Tool notes and limitations</summary>
        <div className="layout-mode-meta">
          <span><strong>Tools</strong>{colorPipelinePlan.toolsPlanned.map(label).join(', ')}</span>
          <span><strong>Tier notes</strong>{colorPipelinePlan.tierNotes.join(' ')}</span>
          <span><strong>Asset rules</strong>{colorPipelinePlan.generatedAssetRules.join(' ')}</span>
          <span><strong>Limitations</strong>{colorPipelinePlan.limitations.join(' ')}</span>
        </div>
        <p className="color-tool-note">FFmpeg/OpenColorIO/OpenImageIO/OpenCV/Sharp are future-worker planning responsibilities only. No tools execute in this demo.</p>
      </details>

      <details className="understanding-section">
        <summary>Operation IDs</summary>
        <div className="color-operation-list">
          {[
            ...colorPipelinePlan.projectOperations,
            ...colorPipelinePlan.clipPlans.flatMap((clipPlan) => clipPlan.correctionOperations.slice(0, 2)),
            ...colorPipelinePlan.assetMatchPlans.flatMap((assetPlan) => assetPlan.operations.slice(0, 1)),
          ].slice(0, 16).map((operation) => (
            <span className="color-operation-item" key={operation.id}>
              <strong>{operation.id}</strong>
              {operationSummary(operation)}
            </span>
          ))}
        </div>
      </details>
    </InlinePlanCardShell>
  )
}
