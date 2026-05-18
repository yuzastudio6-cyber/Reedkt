import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan } from '../../types/reeditpro'
import type { WorkerJobStatus, WorkerStepStatus } from '../../types/worker-runtime'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineWorkerRuntimePlanCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function statusAccent(status: WorkerJobStatus | WorkerStepStatus) {
  if (status === 'blocked' || status === 'failed') {
    return 'danger'
  }

  if (status === 'waiting_for_approval' || status === 'waiting_for_credits' || status === 'needs_user_review' || status === 'waiting_for_user_review') {
    return 'warning'
  }

  if (status === 'succeeded') {
    return 'success'
  }

  return 'cyan'
}

export function InlineWorkerRuntimePlanCard({ descriptor, plan }: InlineWorkerRuntimePlanCardProps) {
  const runtimePlan = plan.workerRuntimePlan

  if (!runtimePlan) {
    return null
  }

  return (
    <InlinePlanCardShell
      className="worker-runtime-plan-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{runtimePlan.jobs.length} job{runtimePlan.jobs.length === 1 ? '' : 's'}</span>
          <span className="compact-summary-chip">{runtimePlan.totalSteps} steps</span>
          <span className="compact-summary-chip">{runtimePlan.workerGroupsUsed.length} worker groups</span>
          <span className="compact-summary-chip">frontend disabled</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Future workers"
      helper="Future backend workers will execute the approved plan snapshot. This card shows the planned worker steps only; no workers run in this frontend demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Worker runtime plan"
    >
      <div className="worker-runtime-summary-grid">
        <span><strong>{runtimePlan.jobs.length}</strong>Jobs</span>
        <span><strong>{runtimePlan.totalSteps}</strong>Steps</span>
        <span><strong>{runtimePlan.providerModelsReferenced.length}</strong>Provider models</span>
        <span><strong>{runtimePlan.openSourceToolsReferenced.length}</strong>Open-source tools</span>
      </div>

      <div className="understanding-chip-row">
        <span className="approved-snapshot-required-badge">Approved snapshot required</span>
        <span className="credit-reservation-required-badge">Credit reservation required</span>
        <span className="frontend-disabled-badge">Frontend execution disabled</span>
        <span className="worker-mock-note">Mock only</span>
        <span className="worker-mock-note">Basic/Pro no Veo</span>
        <span className="worker-mock-note">Premium final fallback only</span>
      </div>

      <details className="understanding-section" open={descriptor?.status === 'warning' || descriptor?.status === 'blocking'}>
        <summary>Runtime rules</summary>
        <div className="layout-mode-meta">
          {runtimePlan.globalRules.map((rule) => (
            <span key={rule}><strong>Rule</strong>{rule}</span>
          ))}
          {runtimePlan.limitations.map((limitation) => (
            <span key={limitation}><strong>Limitation</strong>{limitation}</span>
          ))}
        </div>
      </details>

      <details className="understanding-section">
        <summary>Worker groups and references</summary>
        <div className="worker-output-list">
          {runtimePlan.workerGroupsUsed.map((group) => (
            <span className="worker-group-badge" key={group}>{label(group)}</span>
          ))}
          {runtimePlan.providerModelsReferenced.map((model) => (
            <span className="worker-execution-badge" key={model}>{label(model)}</span>
          ))}
          {runtimePlan.openSourceToolsReferenced.map((tool) => (
            <span className="worker-execution-badge" key={tool}>{label(tool)}</span>
          ))}
        </div>
      </details>

      <div className="worker-job-list">
        {runtimePlan.jobs.map((job) => (
          <article className="worker-job-item" key={job.id}>
            <div>
              <span className="section-eyebrow">Worker job</span>
              <h4>{job.label}</h4>
              <p>{job.summary}</p>
            </div>
            <div className="worker-runtime-summary-grid">
              <span><strong>{job.steps.length}</strong>Steps</span>
              <span><strong>{job.workerGroupsUsed.length}</strong>Groups</span>
              <span><strong>{job.approvalRequired ? 'Yes' : 'No'}</strong>Approval</span>
              <span><strong>{job.canRunInFrontend ? 'Yes' : 'No'}</strong>Frontend</span>
            </div>
            <div className="understanding-chip-row">
              <Badge accent={statusAccent(job.status)}>{label(job.status)}</Badge>
              <Badge accent={job.requiresCreditReservation ? 'warning' : 'muted'}>credit reservation</Badge>
              <Badge accent="violet">worker only</Badge>
              <Badge accent="cyan">QA required</Badge>
            </div>

            <details className="understanding-section">
              <summary>Worker steps</summary>
              <div className="worker-step-list">
                {job.steps.map((step) => (
                  <article className="worker-step-item" key={step.id}>
                    <div>
                      <span className="section-eyebrow">Step {step.order}</span>
                      <h5>{step.label}</h5>
                      <p>{step.purpose}</p>
                    </div>
                    <div className="worker-step-meta">
                      <span><strong>Type</strong>{label(step.stepType)}</span>
                      <span><strong>Group</strong>{label(step.workerGroup)}</span>
                      <span><strong>Mode</strong>{label(step.executionMode)}</span>
                      <span><strong>Status</strong><em className="worker-status-badge">{label(step.status)}</em></span>
                      <span><strong>Credit</strong><em className="worker-status-badge">{label(step.creditImpact)}</em></span>
                    </div>
                    <div className="worker-output-list">
                      {step.expectedOutputs.map((output) => (
                        <span key={output}>{label(output)}</span>
                      ))}
                    </div>
                    <details className="worker-fallback-policy">
                      <summary>Fallback, QA, and failure handling</summary>
                      <div className="worker-qa-list">
                        <span><strong>Fallback</strong>{step.fallbackPolicy.allowedActions.map(label).join(', ') || 'manual review'}</span>
                        <span><strong>Models</strong>{step.fallbackPolicy.allowedProviderModels.map(label).join(', ') || 'none'}</span>
                        <span><strong>Tools</strong>{step.fallbackPolicy.allowedToolIds.map(label).join(', ') || 'none'}</span>
                        <span><strong>QA</strong>{step.qaResponsibilities.join(', ')}</span>
                        <span><strong>Failure</strong>{step.failureHandling.join(', ')}</span>
                      </div>
                    </details>
                    <div className="worker-output-list">
                      {step.workerNotes.slice(0, 4).map((note) => (
                        <span className="worker-mock-note" key={note}>{note}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          </article>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
