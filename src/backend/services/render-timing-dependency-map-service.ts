import type {
  TimingDependencyRecord,
} from '../../types/storytiming'

export interface RenderTimingDependency {
  id: string
  dependencyType: TimingDependencyRecord['dependencyType']
  fromEventId?: string
  toEventId?: string
  fromAnchorId?: string
  toAnchorId?: string
  required: boolean
  reason: string
  renderWorkerNote: string
}

export interface RenderTimingDependencyMap {
  dependencies: RenderTimingDependency[]
  requiredDependencyIds: string[]
  optionalDependencyIds: string[]
  summary: string
}

export function createRenderDependencyFromTimingDependency(dependency: TimingDependencyRecord): RenderTimingDependency {
  return {
    id: dependency.id,
    dependencyType: dependency.dependencyType,
    fromEventId: dependency.fromEventId,
    toEventId: dependency.toEventId,
    fromAnchorId: dependency.fromAnchorId,
    toAnchorId: dependency.toAnchorId,
    required: dependency.required,
    reason: dependency.reason,
    renderWorkerNote: dependency.required
      ? 'Required timing dependency; future workers should reject output that violates it.'
      : 'Optional timing dependency; future workers may preserve it when possible.',
  }
}

export function createRenderTimingDependencyMap(dependencies: TimingDependencyRecord[] = []): RenderTimingDependencyMap {
  const renderDependencies = dependencies.map(createRenderDependencyFromTimingDependency)
  const requiredDependencyIds = renderDependencies.filter((dependency) => dependency.required).map((dependency) => dependency.id)
  const optionalDependencyIds = renderDependencies.filter((dependency) => !dependency.required).map((dependency) => dependency.id)

  return {
    dependencies: renderDependencies,
    requiredDependencyIds,
    optionalDependencyIds,
    summary: createRenderDependencySummary(renderDependencies),
  }
}

export function createRenderDependencySummary(dependencies: RenderTimingDependency[]): string {
  const requiredCount = dependencies.filter((dependency) => dependency.required).length
  return `${dependencies.length} render timing dependenc${dependencies.length === 1 ? 'y' : 'ies'} mapped; ${requiredCount} required.`
}
