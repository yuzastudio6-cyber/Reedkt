import type { PlanningContext, PlanningContextStatus } from '../../types'

export function hasBlockingPlanningIssues(context: PlanningContext) {
  return context.blockingIssueCount > 0 || context.status === 'blocked'
}

export function getPlanningContextStatus(context: PlanningContext): PlanningContextStatus {
  if (hasBlockingPlanningIssues(context)) return 'blocked'
  if (context.warningIssueCount > 0) return 'needs_review'
  if (context.cleanAssembly.durationMs <= 0) return 'draft'
  return 'ready'
}

export function getPlanningNextActions(context: PlanningContext) {
  const actions: string[] = []

  if (!context.cleanAssembly.accepted) {
    actions.push('Accept Clean Assembly')
  }

  if (context.readinessIssues.some((issue) => issue.source === 'source_library' && issue.severity === 'warning')) {
    actions.push('Confirm Source Library')
  }

  if (context.editBrief && !context.editBrief.ready) {
    actions.push('Review optional Edit Brief')
  }

  if (context.readinessIssues.some((issue) => issue.source === 'cue_conflict' && issue.severity === 'blocking')) {
    actions.push('Resolve blocking cue conflicts')
  }

  if (context.readinessIssues.some((issue) => issue.source === 'edit_cue' && issue.severity === 'warning')) {
    actions.push('Review cue warnings')
  }

  actions.push('Continue with AI plan')

  return Array.from(new Set(actions))
}

export function getPlanningReadinessMessage(context: PlanningContext) {
  if (context.status === 'blocked') {
    return 'Resolve blocking planning issues before creating the AI edit plan.'
  }

  if (context.status === 'needs_review') {
    return 'You can create a draft AI Edit Plan now, but review the warnings before approval.'
  }

  if (context.status === 'draft') {
    return 'Planning context is available as a draft. Add more direction or continue from the Clean Assembly.'
  }

  return 'Ready to create the AI Edit Plan from the Clean Assembly, user prompt, and any optional structured direction.'
}
