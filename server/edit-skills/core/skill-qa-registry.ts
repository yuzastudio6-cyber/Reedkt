export interface SkillQaFinding {
  qaKey: string
  disposition: 'pass' | 'warning' | 'needs_review' | 'blocking' | 'critical'
  summary: string
  evidenceHashes: readonly string[]
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
    const finding = evaluator(input)
    if (finding.qaKey !== key) throw new Error(`Skill QA evaluator ${key} returned a different identity.`)
    return finding
  }
}

