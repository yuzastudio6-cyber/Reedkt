import type {
  SkillCapabilityEntry,
  SkillEstimate,
  SkillJobDescriptor,
} from '../../src/types/skill-capability-manifest'

export type SkillEstimator = (
  job: SkillJobDescriptor,
  capability: SkillCapabilityEntry,
) => SkillEstimate

class EstimatorRegistry {
  readonly #time = new Map<string, SkillEstimator>()
  readonly #credit = new Map<string, SkillEstimator>()

  registerTime(key: string, estimator: SkillEstimator): void {
    registerUnique(this.#time, key, estimator)
  }

  registerCredit(key: string, estimator: SkillEstimator): void {
    registerUnique(this.#credit, key, estimator)
  }

  getTime(key: string): SkillEstimator | undefined {
    return this.#time.get(key)
  }

  getCredit(key: string): SkillEstimator | undefined {
    return this.#credit.get(key)
  }
}

function registerUnique(
  registry: Map<string, SkillEstimator>,
  key: string,
  estimator: SkillEstimator,
): void {
  const existing = registry.get(key)
  if (existing && existing !== estimator) {
    throw new Error(`Estimator ${key} is already registered.`)
  }
  registry.set(key, estimator)
}

export const canonicalSkillEstimatorRegistry = new EstimatorRegistry()
