import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillIdentitySchema, skillSha256Schema } from './skill-capability-manifest-schema'

export interface SkillQaFinding {
  qaKey: string
  validatorVersion: string
  disposition: 'pass' | 'warning' | 'needs_review' | 'blocking' | 'critical'
  summary: string
  evidenceHashes: readonly string[]
  observations: Readonly<Record<string, unknown>>
  findingHash: string
}

const skillQaFindingCoreSchema = z.object({
  qaKey: skillIdentitySchema,
  validatorVersion: skillIdentitySchema,
  disposition: z.enum(['pass', 'warning', 'needs_review', 'blocking', 'critical']),
  summary: z.string().trim().min(1).max(2_000),
  evidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  observations: z.record(z.string(), z.unknown()),
}).strict().superRefine((value, context) => {
  if (new Set(value.evidenceHashes).size !== value.evidenceHashes.length) {
    context.addIssue({ code: 'custom', message: 'QA finding evidence hashes must be unique.' })
  }
})

export const skillQaFindingSchema = skillQaFindingCoreSchema.extend({
  findingHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { findingHash, ...core } = value
  if (hashSkillValue(core) !== findingHash) {
    context.addIssue({ code: 'custom', message: 'QA finding hash is stale or forged.' })
  }
})

export function createSkillQaFinding(
  input: z.input<typeof skillQaFindingCoreSchema>,
): SkillQaFinding {
  const core = skillQaFindingCoreSchema.parse(input)
  return skillQaFindingSchema.parse({ ...core, findingHash: hashSkillValue(core) })
}

export type SkillQaEvaluator = (
  input: Readonly<Record<string, unknown>>,
) => SkillQaFinding

export class SkillQaRegistry {
  readonly #evaluators = new Map<string, SkillQaEvaluator>()

  register(key: string, evaluator: SkillQaEvaluator): void {
    if (this.#evaluators.has(key)) throw new Error(`Duplicate skill QA evaluator ${key}.`)
    this.#evaluators.set(key, evaluator)
  }

  has(key: string): boolean { return this.#evaluators.has(key) }

  evaluate(key: string, input: Readonly<Record<string, unknown>>): SkillQaFinding {
    const evaluator = this.#evaluators.get(key)
    if (!evaluator) throw new Error(`Unknown skill QA evaluator ${key}.`)
    const finding = skillQaFindingSchema.parse(evaluator(input))
    if (finding.qaKey !== key) throw new Error(`Skill QA evaluator ${key} returned a different identity.`)
    return finding
  }
}
