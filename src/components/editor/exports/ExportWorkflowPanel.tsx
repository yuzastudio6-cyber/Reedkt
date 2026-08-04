import { RefreshCw } from 'lucide-react'
import { Button } from '../../Button'
import type {
  ExportTarget,
  ExportWorkflowState,
} from '../../../types'
import { ExportApprovalCard } from './ExportApprovalCard'
import { ExportExplainer } from './ExportExplainer'
import { ExportHistoryCard } from './ExportHistoryCard'
import { ExportIssueList } from './ExportIssueList'
import { ExportOutputList } from './ExportOutputList'
import { ExportReadinessSummaryCard } from './ExportReadinessSummaryCard'
import { ExportSettingsPanel } from './ExportSettingsPanel'
import { MockExportEstimateCard } from './MockExportEstimateCard'
import { MockExportJobProgressCard } from './MockExportJobProgressCard'

type ExportWorkflowPanelProps = {
  state: ExportWorkflowState | null
  onUpdateTarget?: (targetId: string, patch: Partial<ExportTarget>) => void
  onToggleTarget?: (targetId: string, enabled: boolean) => void
  onApproveExport?: (options: { acceptsMockCredits: boolean; understandsExportIsMock: boolean; understandsNoRealFileWillBeCreated: boolean }) => void
  onRejectExport?: () => void
  onQueueExportJob?: () => void
  onAdvanceExportJob?: () => void
  onCompleteExportJob?: () => void
  onFailExportJob?: () => void
  onResetExportWorkflow?: () => void
  onRefreshExportReadiness?: () => void
  className?: string
}

export function ExportWorkflowPanel({
  className = '',
  onAdvanceExportJob,
  onApproveExport,
  onCompleteExportJob,
  onFailExportJob,
  onQueueExportJob,
  onRejectExport,
  onResetExportWorkflow,
  onRefreshExportReadiness,
  onToggleTarget,
  onUpdateTarget,
  state,
}: ExportWorkflowPanelProps) {
  if (!state) {
    return (
      <section className={`inline-chat-card export-workflow-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Export rehearsal</span>
            <h3>Export readiness appears after a private review is ready</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`export-workflow-panel ${className}`.trim()}>
      <ExportReadinessSummaryCard state={state} />
      <div className="inline-card-actions export-refresh-actions">
        <Button icon={RefreshCw} onClick={onRefreshExportReadiness} variant="ghost">Refresh export readiness</Button>
      </div>
      <ExportExplainer />
      <ExportIssueList issues={state.issues} />
      <ExportSettingsPanel
        onToggleTarget={onToggleTarget}
        onUpdateTarget={onUpdateTarget}
        settings={state.exportSettings}
      />
      <MockExportEstimateCard estimate={state.exportEstimate} />
      <ExportApprovalCard
        onApproveExport={onApproveExport}
        onQueueExportJob={onQueueExportJob}
        onRejectExport={onRejectExport}
        onResetExportWorkflow={onResetExportWorkflow}
        state={state}
      />
      <MockExportJobProgressCard
        job={state.activeJob}
        onAdvanceExportJob={onAdvanceExportJob}
        onCompleteExportJob={onCompleteExportJob}
        onFailExportJob={onFailExportJob}
      />
      <ExportOutputList outputs={state.exportOutputs} />
      <ExportHistoryCard jobs={state.exportJobs} outputs={state.exportOutputs} />
    </section>
  )
}
