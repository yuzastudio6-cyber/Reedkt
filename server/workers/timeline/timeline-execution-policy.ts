import { validateSmartCutTimelineExecutionPolicy } from '../smart-cut/smart-cut-execution-policy'
import type { TimelineExecutionInput } from './timeline-execution-types'

export function validateTimelineExecutionPolicy(input: TimelineExecutionInput): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  const policy = validateSmartCutTimelineExecutionPolicy(input)
  const blockingReasons = [...policy.blockingReasons]
  const warnings = [...policy.warnings]

  if (input.executionPlan.finalExportAllowed) {
    blockingReasons.push('timeline_execution_final_export_blocked')
  }

  if (input.mode === 'production_ready' && input.readinessReport?.overallStatus !== 'passed') {
    blockingReasons.push('timeline_execution_readiness_not_passed')
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}
