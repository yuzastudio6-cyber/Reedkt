import { getProductionToolProfile } from '../../tool-registry'
import { assertRevideoReadinessBlocked, getProductionReadinessSpec } from '../../workers/production-readiness'
import type { LocalBaselineCommandCatalogEntry } from './local-baseline-types'

export interface LocalBaselinePolicyCheck {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

const forbiddenCommandPatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'docker', pattern: /(^|\s)docker(\s|$)|docker\s+build|docker\s+push|docker\s+run/i, summary: 'Docker execution is forbidden in Phase 19.' },
  { id: 'gcloud', pattern: /(^|\s)gcloud(\s|$)/i, summary: 'gcloud execution is forbidden in Phase 19.' },
  { id: 'deployment', pattern: /\bdeploy\b|\bcloud\s+run\b|\brun\s+deploy\b/i, summary: 'Deployment commands are forbidden in Phase 19.' },
  { id: 'provider', pattern: /\b(provider\s+call|call\s+providers?|stripe|runway|replicate|openai|gemini)\b/i, summary: 'Provider calls are forbidden in Phase 19.' },
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download|wget\s+|curl\s+/i, summary: 'Model download commands are forbidden in Phase 19.' },
  { id: 'real-media', pattern: /arbitrary\s+real\s+user\s+media|real\s+user\s+media|worker:probe-media|--input\s+\S+\.(mp4|mov|mkv|wav|mp3)/i, summary: 'Arbitrary real user media processing is forbidden in Phase 19.' },
  { id: 'secrets', pattern: /service[_-]?role|secret\s+value|\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|-----BEGIN/i, summary: 'Secrets or secret values are forbidden in Phase 19.' },
  { id: 'production-ready', pattern: /productionReadyAllowed\s*[:=]\s*true|production\s+ready\s+allowed\s*[:=]\s*true/i, summary: 'Production-ready approval is forbidden in Phase 19.' },
  { id: 'external-beta', pattern: /externalBetaAllowed\s*[:=]\s*true|external\s+beta\s+allowed\s*[:=]\s*true/i, summary: 'External beta approval is forbidden in Phase 19.' },
  { id: 'revideo-production', pattern: /revideo.+production|production.+revideo/i, summary: 'Revideo production usage is forbidden in Phase 19.' },
]

export function evaluateLocalBaselineCommandText(commandText: string): LocalBaselinePolicyCheck {
  const blockers = forbiddenCommandPatterns
    .filter((forbidden) => forbidden.pattern.test(commandText))
    .map((forbidden) => `${forbidden.id}: ${forbidden.summary}`)

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings: [],
  }
}

export function evaluateLocalBaselineCatalogEntry(entry: LocalBaselineCommandCatalogEntry): LocalBaselinePolicyCheck {
  const commandCheck = evaluateLocalBaselineCommandText(`${entry.commandId} ${entry.npmScript}`)
  const blockers = [...commandCheck.blockers]

  if (entry.category === 'forbidden') {
    blockers.push(`${entry.commandId}: forbidden category entries cannot execute in the local baseline.`)
  }

  if (!entry.safeToExecuteLocally) {
    blockers.push(`${entry.commandId}: command is not marked safe for local execution.`)
  }

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings: commandCheck.warnings,
  }
}

export function assertLocalBaselineCatalogSafe(catalog: LocalBaselineCommandCatalogEntry[]): void {
  const blockers = catalog.flatMap((entry) => evaluateLocalBaselineCatalogEntry(entry).blockers)
  if (blockers.length > 0) {
    throw new Error(`Local baseline catalog contains forbidden commands: ${blockers.join('; ')}`)
  }
}

export function assertLocalBaselineExecuteConfirmed(env: NodeJS.ProcessEnv): void {
  if (env.REEDITPRO_CONFIRM_LOCAL_BASELINE !== 'true') {
    throw new Error('Refusing to execute Phase 19 local baseline commands without REEDITPRO_CONFIRM_LOCAL_BASELINE=true.')
  }
}

export function assertLocalBaselineProductionBlocked(): void {
  assertRevideoReadinessBlocked()

  const revideoProfile = getProductionToolProfile('revideo')
  const revideoSpec = getProductionReadinessSpec('revideo')
  if (revideoProfile?.productionStatus !== 'evaluation_only' || revideoSpec?.readinessStatusWhenMissing !== 'evaluation_only') {
    throw new Error('Revideo must remain evaluation-only and production-blocked.')
  }
}

export function isViteLargeChunkWarning(output: string): boolean {
  return /Some chunks are larger than 500 kB after minification/i.test(output)
}

export function isGeneratedFixtureOrToolSkipWarning(output: string): boolean {
  return /fixtureMode["']?\s*:\s*["']skipped|ffmpeg.*unavailable|unavailable.*skip|skipped because FFmpeg/i.test(output)
}
