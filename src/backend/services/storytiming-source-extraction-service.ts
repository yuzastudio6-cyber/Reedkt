import type { StoryTimingPlanningSources } from '../contracts/storytiming-contracts'
import type { MockDatabase } from '../mock/mock-database'

const matchesProjectEditPlan = (
  record: { projectId?: string; editPlanId?: string },
  projectId: string,
  editPlanId: string,
): boolean => record.projectId === projectId && record.editPlanId === editPlanId

export function extractEditPlanTimingSources(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): Pick<StoryTimingPlanningSources, 'editPlan' | 'editPlanSegments' | 'storyBeats' | 'signatureRoutes'> {
  return {
    editPlan: db.editPlans.find((plan) => plan.id === editPlanId && plan.projectId === projectId),
    editPlanSegments: db.editPlanSegments.filter((segment) => matchesProjectEditPlan(segment, projectId, editPlanId)),
    storyBeats: db.storyBeats.filter((beat) => matchesProjectEditPlan(beat, projectId, editPlanId)),
    signatureRoutes: db.signatureRoutes.filter((route) => matchesProjectEditPlan(route, projectId, editPlanId)),
  }
}

export function extractEditQualityTimingSources(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): Pick<StoryTimingPlanningSources, 'pacingAnalysis' | 'cutDecisions' | 'transitionPlans' | 'captionPlans'> {
  return {
    pacingAnalysis: db.pacingAnalysis.filter((analysis) => matchesProjectEditPlan(analysis, projectId, editPlanId)),
    cutDecisions: db.cutDecisions.filter((decision) => matchesProjectEditPlan(decision, projectId, editPlanId)),
    transitionPlans: db.transitionPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId)),
    captionPlans: db.captionPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId)),
  }
}

export function extractMusicTimingSources(): Pick<StoryTimingPlanningSources, 'musicCues' | 'musicMixPlans'> {
  return {
    musicCues: [],
    musicMixPlans: [],
  }
}

export function extractSFXTimingSources(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): Pick<StoryTimingPlanningSources, 'sfxEventPlans' | 'sfxTrimPlans' | 'sfxTimingAlignments' | 'sfxMixPlans'> {
  return {
    sfxEventPlans: db.sfxEventPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId)),
    sfxTrimPlans: db.sfxTrimPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId)),
    sfxTimingAlignments: db.sfxTimingAlignments.filter((alignment) => matchesProjectEditPlan(alignment, projectId, editPlanId)),
    sfxMixPlans: db.sfxMixPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId)),
  }
}

export function extractStrokeMotionTimingSources(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): Pick<StoryTimingPlanningSources, 'strokeMotionPlans' | 'strokeMotionBeats' | 'strokeMotionTimingAnchors'> {
  const strokeMotionPlans = db.strokeMotionPlans.filter((plan) => matchesProjectEditPlan(plan, projectId, editPlanId))
  const planIds = new Set(strokeMotionPlans.map((plan) => plan.id))

  return {
    strokeMotionPlans,
    strokeMotionBeats: db.strokeMotionBeats.filter((beat) => planIds.has(beat.strokeMotionPlanId)),
    strokeMotionTimingAnchors: db.strokeMotionTimingAnchors.filter((anchor) => planIds.has(anchor.strokeMotionPlanId)),
  }
}

export function extractRenderTimingSources(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): Pick<StoryTimingPlanningSources, 'renderJobInputs' | 'qaReports'> {
  const renderJobs = db.renderJobs.filter((job) => matchesProjectEditPlan(job, projectId, editPlanId))
  const renderJobIds = new Set(renderJobs.map((job) => job.id))

  return {
    renderJobInputs: db.renderJobInputs.filter((input) => input.projectId === projectId && renderJobIds.has(input.renderJobId)),
    qaReports: db.qaReports.filter((report) => matchesProjectEditPlan(report, projectId, editPlanId)),
  }
}

export function extractTimingSourcesFromMockDatabase(
  db: MockDatabase,
  projectId: string,
  editPlanId: string,
): StoryTimingPlanningSources {
  return {
    ...extractEditPlanTimingSources(db, projectId, editPlanId),
    ...extractEditQualityTimingSources(db, projectId, editPlanId),
    ...extractMusicTimingSources(),
    ...extractSFXTimingSources(db, projectId, editPlanId),
    ...extractStrokeMotionTimingSources(db, projectId, editPlanId),
    ...extractRenderTimingSources(db, projectId, editPlanId),
  }
}
