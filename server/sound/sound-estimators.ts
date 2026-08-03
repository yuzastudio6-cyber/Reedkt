import type {
  SkillCapabilityEntry,
  SkillEstimate,
  SkillEstimateCategory,
  SkillJobDescriptor,
} from '../../src/types/skill-capability-manifest'
import { canonicalSkillEstimatorRegistry } from '../orchestra/skill-estimator-registry'

export const SOUND_TIME_ESTIMATOR_KEY = 'sound.time.v1'
export const SOUND_CREDIT_ESTIMATOR_KEY = 'sound.credits.v1'

function rounded(value: number): number {
  return Number(value.toFixed(2))
}

function category(
  name: string,
  expected: number,
  unit: SkillEstimateCategory['unit'],
): SkillEstimateCategory {
  return {
    category: name,
    minimum: rounded(expected * 0.75),
    expected: rounded(expected),
    maximum: rounded(expected * 1.55),
    unit,
  }
}

function total(
  categories: SkillEstimateCategory[],
  lowerCostAlternatives: string[],
  approvalRequired: boolean,
  reservationRequired: boolean,
  assumptions: string[],
): SkillEstimate {
  const sum = (field: 'minimum' | 'expected' | 'maximum') => rounded(
    categories.reduce((value, item) => value + item[field], 0),
  )
  return {
    estimateVersion: 'sound-estimate-v1',
    minimum: sum('minimum'),
    expected: sum('expected'),
    maximum: sum('maximum'),
    confidence: assumptions.length <= 4 ? 'high' : assumptions.length <= 7 ? 'medium' : 'low',
    assumptions,
    costCategories: categories,
    approvalRequired,
    reservationRequired,
    lowerCostAlternatives,
  }
}

function complexityMultiplier(job: SkillJobDescriptor): number {
  const source = job.sourceAudioComplexity === 'high' ? 1.55 :
    job.sourceAudioComplexity === 'medium' ? 1.2 : 1
  const speech = job.speechDensity === 'high' ? 1.35 :
    job.speechDensity === 'medium' ? 1.15 : 1
  const qa = job.qaDepth === 'studio' ? 1.5 : job.qaDepth === 'strong' ? 1.25 : 1
  return source * speech * qa
}

export function estimateSoundTime(
  job: SkillJobDescriptor,
  capability: SkillCapabilityEntry,
): SkillEstimate {
  const complexity = complexityMultiplier(job)
  const study = Math.max(0.35, job.durationSeconds / 90) * complexity
  const ranges = Math.max(1, job.rangeCount) * 0.45
  const events = job.visualEventCount * 0.22
  const local = job.localOperationCount * 0.65
  const provider = job.providerDurationSeconds > 0
    ? (job.providerDurationSeconds / 20) * Math.max(1, job.candidateCount) * 0.85
    : 0
  const qa = (job.qaDepth === 'studio' ? 2 : job.qaDepth === 'strong' ? 1.3 : 0.8) *
    (job.durationSeconds / 120 + 1)
  const revision = job.revisionCount * 0.8
  const fallback = job.expectedFallbacks * 1.2
  const categories = [
    category('study_and_direction', study + ranges + events, 'minutes'),
    category('local_processing', local, 'minutes'),
    category('provider_wait_and_review', provider, 'minutes'),
    category('quality_assurance', qa, 'minutes'),
    category('revision_and_fallback', revision + fallback, 'minutes'),
  ].filter((item) => item.expected > 0)

  return total(
    categories,
    capability.lowerCostRoutes,
    job.requestedMode !== 'planning',
    false,
    [
      `duration_seconds=${rounded(job.durationSeconds)}`,
      `ranges=${job.rangeCount}`,
      `visual_events=${job.visualEventCount}`,
      `candidate_count=${job.candidateCount}`,
      `provider_duration_seconds=${rounded(job.providerDurationSeconds)}`,
      `qa_depth=${job.qaDepth}`,
      `revision_count=${job.revisionCount}`,
    ],
  )
}

export function estimateSoundCredits(
  job: SkillJobDescriptor,
  capability: SkillCapabilityEntry,
): SkillEstimate {
  const complexity = complexityMultiplier(job)
  const analysis = (job.durationSeconds / 120 + job.visualEventCount * 0.03) * complexity
  const local = job.localOperationCount * 0.2 * complexity
  const mixing = capability.allowedExecutionPhases.includes('mixing')
    ? Math.max(0.5, job.durationSeconds / 180) * complexity
    : 0
  const provider = job.providerDurationSeconds > 0
    ? Math.max(1, job.candidateCount) * job.providerDurationSeconds * 0.8
    : 0
  const qa = (job.qaDepth === 'studio' ? 1.5 : job.qaDepth === 'strong' ? 0.8 : 0.35) *
    Math.max(1, job.durationSeconds / 180)
  const infrastructure = job.requestedMode === 'planning' ? 0 : 0.25 + job.expectedFallbacks * 0.2
  const categories = [
    category('analysis', analysis, 'credits'),
    category('local_tool_execution', local, 'credits'),
    category('mixing', mixing, 'credits'),
    category('provider_requests', provider, 'credits'),
    category('quality_assurance', qa, 'credits'),
    category('infrastructure_and_fallback', infrastructure, 'credits'),
  ].filter((item) => item.expected > 0)
  const paid = provider > 0 || job.requestedMode === 'production'

  return total(
    categories,
    capability.lowerCostRoutes,
    job.requestedMode !== 'planning',
    paid,
    [
      'Estimate only; no credit mutation occurs.',
      '1 ReEditPro credit represents $0.10 of user-facing usage policy.',
      `candidate_count=${job.candidateCount}`,
      `provider_duration_seconds=${rounded(job.providerDurationSeconds)}`,
      `local_operations=${job.localOperationCount}`,
      `expected_fallbacks=${job.expectedFallbacks}`,
      'Unknown provider outcomes retain possible provider/infrastructure cost until reconciled.',
    ],
  )
}

canonicalSkillEstimatorRegistry.registerTime(SOUND_TIME_ESTIMATOR_KEY, estimateSoundTime)
canonicalSkillEstimatorRegistry.registerCredit(SOUND_CREDIT_ESTIMATOR_KEY, estimateSoundCredits)
