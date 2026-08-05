export const EDIT_SKILL_KEYS = [
  'b_roll',
  'captions',
  'color',
  'graphic_design',
  'real_motion',
  'render',
  'sound',
  'source_cleanup',
  'stroke_motion',
  'track_all',
  'transition',
  'visual_intelligence',
] as const

export type EditSkillKey = (typeof EDIT_SKILL_KEYS)[number]

export const SKILL_QUALIFICATION_STATUSES = [
  'declared',
  'implementation_pending',
  'planning_qualified',
  'internal_execution_qualified',
  'production_qualified',
  'blocked',
  'retired',
] as const

export type SkillQualificationStatus =
  (typeof SKILL_QUALIFICATION_STATUSES)[number]

export const ACTIVE_QUALIFICATION_RANK: Readonly<
  Partial<Record<SkillQualificationStatus, number>>
> = Object.freeze({
  declared: 0,
  implementation_pending: 1,
  planning_qualified: 2,
  internal_execution_qualified: 3,
  production_qualified: 4,
})

export const SKILL_MANIFEST_REFERENCE_VERSION =
  'edit-skill-manifest-reference-v1' as const
