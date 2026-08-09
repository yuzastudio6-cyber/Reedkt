export interface SkillTimeEstimate {
  minimumSeconds: number
  expectedSeconds: number
  maximumSeconds: number
  evidence: readonly string[]
}

export interface SkillCreditEstimate {
  minimumCredits: number
  expectedCredits: number
  maximumCredits: number
  internalToolCostOnly: boolean
  evidence: readonly string[]
}

export type SkillTimeEstimator = (input: Readonly<Record<string, unknown>>) => SkillTimeEstimate
export type SkillCreditEstimator = (input: Readonly<Record<string, unknown>>) => SkillCreditEstimate

export class SkillEstimatorRegistry {
  readonly #time = new Map<string, SkillTimeEstimator>()
  readonly #credit = new Map<string, SkillCreditEstimator>()

  registerTime(key: string, estimator: SkillTimeEstimator): void {
    if (this.#time.has(key)) throw new Error(`Duplicate skill time estimator ${key}.`)
    this.#time.set(key, estimator)
  }

  registerCredit(key: string, estimator: SkillCreditEstimator): void {
    if (this.#credit.has(key)) throw new Error(`Duplicate skill credit estimator ${key}.`)
    this.#credit.set(key, estimator)
  }

  hasTime(key: string): boolean { return this.#time.has(key) }
  hasCredit(key: string): boolean { return this.#credit.has(key) }

  estimateTime(key: string, input: Readonly<Record<string, unknown>>): SkillTimeEstimate {
    const estimator = this.#time.get(key)
    if (!estimator) throw new Error(`Unknown skill time estimator ${key}.`)
    return estimator(input)
  }

  estimateCredit(key: string, input: Readonly<Record<string, unknown>>): SkillCreditEstimate {
    const estimator = this.#credit.get(key)
    if (!estimator) throw new Error(`Unknown skill credit estimator ${key}.`)
    return estimator(input)
  }
}
