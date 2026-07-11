import { Badge } from '../Badge'
import { progressSteps } from './chatNativeData'
import { AIProgressStepList } from './AIProgressStepList'
import type { EditSessionExecutionRehearsal } from '../../lib/edit-session-execution-rehearsal'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'

type AIEditingProgressStageProps = {
  activeIndex: number
  complete: boolean
  executionRehearsal?: EditSessionExecutionRehearsal | null
}

export function AIEditingProgressStage({ activeIndex, complete, executionRehearsal }: AIEditingProgressStageProps) {
  const steps = executionRehearsal?.previewSteps.length
    ? executionRehearsal.previewSteps.map((step) => cleanProgressCopy(step))
    : progressSteps
  const summary = executionRehearsal
    ? cleanProgressCopy(executionRehearsal.userFacingSummary)
    : 'Private review rehearsal only. Real editing starts after plan and credit approval.'
  const finalRenderBlockReason = executionRehearsal?.finalRenderBlockReason
    ? cleanProgressCopy(executionRehearsal.finalRenderBlockReason)
    : ''

  return (
    <section className="inline-chat-card ai-editing-stage" data-testid="generation-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Preparing private review</span>
          <h3>{complete ? 'Private review prepared' : 'ReeditPro is preparing the edit'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Working'}</Badge>
      </div>
      <div className="ai-stage-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {executionRehearsal && (
        <div className="agent-execution-summary-grid" aria-label="Approved edit execution rehearsal summary">
          <span><strong>{executionRehearsal.sourceClipCount}</strong><em>source files</em></span>
          <span><strong>{executionRehearsal.segmentCount}</strong><em>segments</em></span>
          <span><strong>{executionRehearsal.plannedWorkItemCount}</strong><em>edit tasks</em></span>
          <span><strong>{executionRehearsal.assetManifestCount}</strong><em>review assets</em></span>
        </div>
      )}
      <AIProgressStepList activeIndex={activeIndex} steps={steps} />
      {executionRehearsal && (
        <p className="approved-snapshot-required-note">
          <strong>Approved plan:</strong>
          <span>Locked for this private review.</span>
        </p>
      )}
      <p className="inline-helper">
        {summary}
      </p>
      {executionRehearsal?.finalRenderBlocked && (
        <p className="inline-helper">
          Final export waits for approved release evidence: {finalRenderBlockReason}
        </p>
      )}
    </section>
  )
}

function cleanProgressCopy(value: string): string {
  return hideInternalToolNamesInCopy(value)
    .replace(/\bApproved snapshot ID\b/gi, 'Approved plan record')
    .replace(/\bapproved snapshot\b/gi, 'approved plan')
    .replace(/\basset manifest\b/gi, 'review asset list')
    .replace(/\bmanifest assets\b/gi, 'review assets')
    .replace(/\bwork item\(s\)/gi, 'edit task(s)')
    .replace(/\bwork items\b/gi, 'edit tasks')
    .replace(/\bbackend execution\b/gi, 'approved execution')
    .replace(/\bbackend approval\b/gi, 'release approval')
    .replace(/\bbackend evidence\b/gi, 'approved evidence')
}
