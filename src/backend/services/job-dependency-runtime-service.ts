import type { JobGateCheckResult, JobWorkerKind } from '../../types/job-runtime'

export interface JobDependencyRuntimeNode {
  id: string
  label: string
  workerKind: JobWorkerKind
  dependsOnNodeIds: string[]
  ready: boolean
  required: boolean
  gateCheck?: JobGateCheckResult
}

export interface JobDependencyRuntimeChain {
  id: string
  chainType: 'music_generation' | 'sfx_generation' | 'render_preview' | 'signature_generation' | 'custom'
  nodes: JobDependencyRuntimeNode[]
  readyNodeIds: string[]
  blockedNodeIds: string[]
  summary: string
  warnings: string[]
  mockOnly: boolean
}

export function createJobDependencyChain(
  chainType: JobDependencyRuntimeChain['chainType'],
  labels: string[],
  blockedLabels: string[] = [],
): JobDependencyRuntimeChain {
  const nodes = labels.map((label, index): JobDependencyRuntimeNode => ({
    id: `${chainType}-${index + 1}`,
    label,
    workerKind: workerKindForLabel(label),
    dependsOnNodeIds: index === 0 ? [] : [`${chainType}-${index}`],
    ready: !blockedLabels.includes(label),
    required: true,
  }))

  return summarizeChain({
    id: `mock-${chainType}-dependency-chain`,
    chainType,
    nodes,
    readyNodeIds: [],
    blockedNodeIds: [],
    summary: '',
    warnings: ['Dependency chain is mock metadata only; no backend queue was created.'],
    mockOnly: true,
  })
}

export function createMusicGenerationDependencyChain(blockedLabels: string[] = []) {
  return createJobDependencyChain('music_generation', [
    'edit_plan_approved',
    'credit_reserved',
    'music_prompt_ready',
    'music_generation_job',
    'music_qa_job',
    'music_mix_job',
  ], blockedLabels)
}

export function createSFXGenerationDependencyChain(blockedLabels: string[] = []) {
  return createJobDependencyChain('sfx_generation', [
    'edit_plan_approved',
    'credit_reserved',
    'sfx_prompt_ready',
    'sfx_generation_job',
    'sfx_trim_alignment_job',
    'sfx_mix_job',
    'sfx_qa_job',
    'sfx_library_candidate_job',
  ], blockedLabels)
}

export function createRenderDependencyChain(blockedLabels: string[] = []) {
  return createJobDependencyChain('render_preview', [
    'edit_plan_approved',
    'timing_map_ready',
    'render_manifest_ready',
    'required_assets_ready',
    'preview_render_job',
    'qa_job',
  ], blockedLabels)
}

export function createSignatureGenerationDependencyChain(blockedLabels: string[] = []) {
  return createJobDependencyChain('signature_generation', [
    'edit_plan_approved',
    'credit_reserved',
    'signature_route_ready',
    'prompt_spec_ready',
    'generation_job',
    'qa_job',
  ], blockedLabels)
}

export function validateJobDependencies(chain: JobDependencyRuntimeChain): JobGateCheckResult {
  const blockedNodeIds = chain.nodes.filter((node) => !node.ready).map((node) => node.id)

  if (blockedNodeIds.length > 0) {
    return {
      ok: false,
      gateStatus: 'blocked',
      blockReasons: ['unknown'],
      message: `Dependency chain blocked by ${blockedNodeIds.length} node(s).`,
      warnings: chain.warnings,
      mockOnly: true,
    }
  }

  return {
    ok: true,
    gateStatus: 'passed',
    blockReasons: [],
    message: 'Dependency chain is ready.',
    warnings: chain.warnings,
    mockOnly: true,
  }
}

export function getReadyJobsFromDependencyChain(chain: JobDependencyRuntimeChain): JobDependencyRuntimeNode[] {
  return chain.nodes.filter((node) => {
    if (!node.ready) return false
    return node.dependsOnNodeIds.every((dependencyId) => chain.readyNodeIds.includes(dependencyId))
  })
}

export function createJobDependencySummary(chain: JobDependencyRuntimeChain): string {
  return chain.summary
}

function summarizeChain(chain: JobDependencyRuntimeChain): JobDependencyRuntimeChain {
  chain.readyNodeIds = chain.nodes.filter((node) => node.ready).map((node) => node.id)
  chain.blockedNodeIds = chain.nodes.filter((node) => !node.ready).map((node) => node.id)
  chain.summary = chain.blockedNodeIds.length > 0
    ? `${chain.chainType} chain blocked at ${chain.blockedNodeIds.join(', ')}.`
    : `${chain.chainType} chain ready with ${chain.nodes.length} node(s).`
  return chain
}

function workerKindForLabel(label: string): JobWorkerKind {
  if (label.includes('music')) return 'music_generation'
  if (label.includes('sfx')) return 'sfx_generation'
  if (label.includes('render')) return 'render_preview'
  if (label.includes('qa')) return 'qa'
  if (label.includes('credit')) return 'credit'
  if (label.includes('signature') || label.includes('generation')) return 'video_generation'
  return 'planning_agent'
}
