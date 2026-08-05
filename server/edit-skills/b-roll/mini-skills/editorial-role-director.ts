import type { BrollEditorialRole, BrollSkillAssignment } from '../b-roll-contracts'

const roleSignals: readonly [RegExp, BrollEditorialRole][] = [
  [/proof|evidence|result|claim/iu, 'proof_support'],
  [/jump|stumble|cut cover|remove/iu, 'cut_cover'],
  [/product|feature|object|detail/iu, 'product_detail'],
  [/location|place|room|property|street/iu, 'location_detail'],
  [/process|step|workflow|how/iu, 'process_step'],
  [/before.{0,12}after|comparison|transform/iu, 'before_after'],
  [/emotion|feeling|tone|personal/iu, 'emotional_support'],
  [/establish|environment|setting/iu, 'establishing'],
  [/screen|app|browser|dashboard|interface/iu, 'screen_or_app_support'],
  [/transition|bridge|scene change/iu, 'transition_bridge'],
  [/visual break|talking head|variation/iu, 'visual_break'],
]

export function directBrollEditorialRole(assignment: BrollSkillAssignment): BrollEditorialRole {
  const text = `${assignment.reason} ${assignment.pointToProveClarifyCoverOrSupport}`
  return roleSignals.find(([pattern]) => pattern.test(text))?.[1] ?? 'context'
}
