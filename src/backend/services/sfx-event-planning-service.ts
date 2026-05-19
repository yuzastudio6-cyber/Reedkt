import type {
  SFXEventPlanRecord,
  SFXTargetLayer,
  SignatureSystem,
  SoundEffectType,
} from '../../types'
import type {
  SFXPlanningContext,
  SFXPlanningOpportunity,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { normalizeEditQualityLevel } from './sfx-decision-policy-service'

function signatureSystemForLayer(targetLayer: SFXTargetLayer): SignatureSystem {
  if (targetLayer === 'stroke_motion') return 'stroke_motion'
  if (targetLayer === 'graphic_design') return 'graphic_design'
  if (targetLayer === 'real_motion') return 'real_motion'
  if (targetLayer === 'montage_hit' || targetLayer === 'ambient_bridge') return 'sound_sync'
  return 'none'
}

function legacySoundEffectTypeForLayer(targetLayer: SFXTargetLayer): SoundEffectType {
  if (targetLayer === 'transition') return 'soft_whoosh'
  if (targetLayer === 'stroke_motion') return 'stroke_draw_sound'
  if (targetLayer === 'graphic_design') return 'subtle_pop'
  if (targetLayer === 'real_motion') return 'object_whoosh'
  if (targetLayer === 'cta_reveal') return 'success_chime'
  if (targetLayer === 'ambient_bridge') return 'ambient_bridge'
  if (targetLayer === 'title_card' || targetLayer === 'chapter_card' || targetLayer === 'montage_hit') return 'light_hit'
  return 'none'
}

function createRecord(
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
  targetLayer: SFXTargetLayer = opportunity.targetLayer,
): SFXEventPlanRecord {
  const now = nowIso()

  return {
    id: createMockId('sfx-event-plan'),
    projectId: context.projectId,
    editPlanId: context.editPlanId,
    editPlanSegmentId: opportunity.editPlanSegmentId,
    transitionPlanId: opportunity.transitionPlanId,
    signatureRouteId: opportunity.signatureRouteId,
    strokeMotionBeatId: opportunity.strokeMotionBeatId,
    musicCueId: opportunity.musicCueId,
    targetLayer,
    useCase: opportunity.useCase,
    legacySoundEffectType: legacySoundEffectTypeForLayer(targetLayer),
    decisionState: opportunity.decisionState,
    sourceFootagePolicy: opportunity.sourceFootagePolicy,
    reason: opportunity.reason,
    sceneContext: opportunity.sceneContext,
    videoTone: opportunity.videoTone,
    editLevel: normalizeEditQualityLevel(context.editComplexity),
    signatureSystem: signatureSystemForLayer(targetLayer),
    anchorType: opportunity.anchorType,
    anchorTimeSeconds: opportunity.anchorTimeSeconds,
    timingPriority: opportunity.timingPriority,
    volumeProfile: opportunity.volumeProfile,
    mixPriority: opportunity.mixPriority,
    creditImpact: opportunity.creditImpact,
    requiresApproval: opportunity.requiresApproval,
    userVisibleSummary: opportunity.label,
    avoidRules: [
      'No random SFX.',
      'No fake source-action sounds by default.',
      ...opportunity.warnings,
    ],
    mustFollowRules: [
      'Tie SFX to this edit layer and timing anchor.',
      'Keep voice clarity above SFX.',
      'No future generation before plan and credit approval.',
    ],
    status: opportunity.decisionState === 'avoid' || opportunity.decisionState === 'not_needed'
      ? 'planned'
      : 'awaiting_approval',
    notes: [
      opportunity.reason,
      'RP-SFX-04 creates planning records only; prompt adapters, generation, trim, mix, and QA are later milestones.',
    ],
    createdAt: now,
    updatedAt: now,
    metadata: { mockOnly: true, noProviderCall: true },
  }
}

export function createSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context)))
}

export function createTransitionSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'transition')))
}

export function createStrokeMotionSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'stroke_motion')))
}

export function createGraphicDesignSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'graphic_design')))
}

export function createRealMotionSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'real_motion')))
}

export function createTitleCardSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'title_card')))
}

export function createChapterCardSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'chapter_card')))
}

export function createCTASFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'cta_reveal')))
}

export function createMontageHitSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'montage_hit')))
}

export function createAmbientBridgeSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'ambient_bridge')))
}

export function createNoSFXEventPlan(
  db: MockDatabase,
  opportunity: SFXPlanningOpportunity,
  context: SFXPlanningContext,
): ServiceResult<SFXEventPlanRecord> {
  return ok(insertMockRecord(db, 'sfxEventPlans', createRecord(opportunity, context, 'none')))
}
