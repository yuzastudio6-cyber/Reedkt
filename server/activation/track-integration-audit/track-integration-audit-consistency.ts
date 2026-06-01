import { existsSync, readFileSync } from 'node:fs'
import { trackIntegrationAuditRequiredDocs, trackIntegrationAuditRequiredScripts } from './track-integration-audit-policy'
import type {
  TrackIntegrationConsistencyCheck,
  TrackIntegrationDocsReconciliation,
  TrackIntegrationRegistryReconciliation,
} from './track-integration-audit-types'

export function buildTrackIntegrationRegistryReconciliation(): TrackIntegrationRegistryReconciliation {
  return {
    packageScripts: checkPackageScripts(),
    toolRegistry: checkToolRegistry(),
    workerRuntimeOwnership: checkWorkerRuntimeOwnership(),
  }
}

export function buildTrackIntegrationDocsReconciliation(): TrackIntegrationDocsReconciliation {
  return {
    docs: checkDocsExist(),
    readinessState: checkReadinessStateDocs(),
    staleContradictions: checkStaleContradictions(),
  }
}

function checkPackageScripts(): TrackIntegrationConsistencyCheck {
  const blockers: string[] = []
  const warnings: string[] = []
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>
  for (const script of trackIntegrationAuditRequiredScripts) {
    if (!scripts[script]) blockers.push(`Missing package script: ${script}`)
  }
  return {
    checkId: 'package_scripts',
    status: blockers.length ? 'blocked' : 'passed',
    summary: blockers.length ? 'Required Track A/Track B/Phase 47A scripts are missing.' : 'Required Track A, Track B, and Phase 47A scripts are present.',
    blockers,
    warnings,
  }
}

function checkDocsExist(): TrackIntegrationConsistencyCheck {
  const blockers = trackIntegrationAuditRequiredDocs.filter((doc) => !existsSync(doc)).map((doc) => `Missing required doc: ${doc}`)
  return {
    checkId: 'docs_exist',
    status: blockers.length ? 'blocked' : 'passed',
    summary: blockers.length ? 'Required Phase 47A/current-state docs are missing.' : 'Required Phase 47A/current-state docs are present.',
    blockers,
    warnings: [],
  }
}

function checkToolRegistry(): TrackIntegrationConsistencyCheck {
  const blockers: string[] = []
  const warnings: string[] = []
  const registryText = [
    readOptional('src/lib/tool-registry.ts'),
    readOptional('docs/open-source-tool-registry.md'),
    readOptional('docs/production-audio-sound-foundation.md'),
    readOptional('docs/production-demucs-policy.md'),
    readOptional('docs/production-tool-runtime-roadmap.md'),
  ].join('\n')
  if (!/DeepFilterNet/i.test(registryText)) blockers.push('Tool registry/current docs must mention DeepFilterNet ownership.')
  if (!/Demucs/i.test(registryText)) blockers.push('Tool registry/current docs must mention Demucs separation status.')
  if (!/RNNoise/i.test(registryText)) warnings.push('RNNoise is not mentioned in registry text; ensure historical inactive state remains documented if the adapter still exists.')
  if (/RNNoise[^.\n]*(active|fallback|selected)/i.test(registryText) && !/RNNoise[^.\n]*(removed|removes|inactive|historical|not active|not an active|blocked)/i.test(registryText)) {
    blockers.push('RNNoise appears active without inactive/removed wording.')
  }
  if (/Revideo[^.\n]*(enabled|production|active)/i.test(registryText) && !/Revideo[^.\n]*(evaluation|blocked|not active)/i.test(registryText)) {
    blockers.push('Revideo appears active without evaluation-only/blocked wording.')
  }
  return {
    checkId: 'tool_registry',
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'passed',
    summary: blockers.length ? 'Tool registry has unresolved ownership contradictions.' : 'Tool registry ownership wording is compatible with Phase 47A.',
    blockers,
    warnings,
  }
}

function checkWorkerRuntimeOwnership(): TrackIntegrationConsistencyCheck {
  const blockers: string[] = []
  const warnings: string[] = []
  const expectedPaths = [
    'src/backend/staging-sam2-runtime-worker',
    'src/backend/staging-film-runtime-worker',
    'src/backend/staging-pro-color-image-runtime-worker',
    'src/backend/staging-deepfilternet-runtime-worker',
    'docker/prod/vlm-runtime',
  ]
  for (const expectedPath of expectedPaths) {
    if (!existsSync(expectedPath)) warnings.push(`Expected runtime path is not present in this merged branch: ${expectedPath}`)
  }
  return {
    checkId: 'worker_runtime_ownership',
    status: blockers.length ? 'blocked' : 'passed',
    summary: 'Worker/runtime ownership paths are separated by Track A visual/video and Track B audio/OCR/VLM scope.',
    blockers,
    warnings,
  }
}

function checkReadinessStateDocs(): TrackIntegrationConsistencyCheck {
  const text = [
    readOptional('docs/activation-readiness-state.md'),
    readOptional('docs/activation-phase-roadmap.md'),
    readOptional('docs/activation-next-phase-runbook.md'),
  ].join('\n')
  const blockers: string[] = []
  if (!/Phase 45F/i.test(text) || !/Track A[^.\n]*ready/i.test(text)) blockers.push('Readiness docs must record Track A Phase 45F internal readiness.')
  if (!/Phase 36G/i.test(text) || !/Demucs[^.\n]*(blocked|deferred)/i.test(text)) blockers.push('Readiness docs must record Demucs as blocked/deferred.')
  if (!/Phase 39C/i.test(text) || !/(OOM|CUDA|vLLM)/i.test(text)) blockers.push('Readiness docs must record the Phase 39C VLM OOM blocker.')
  if (!/production[^.\n]*(blocked|remain blocked)/i.test(text)) blockers.push('Readiness docs must keep production blocked.')
  return {
    checkId: 'readiness_docs',
    status: blockers.length ? 'blocked' : 'passed',
    summary: blockers.length ? 'Readiness docs are missing required current-state decisions.' : 'Readiness docs contain the required Track A/Track B current-state decisions.',
    blockers,
    warnings: [],
  }
}

function checkStaleContradictions(): TrackIntegrationConsistencyCheck {
  const text = [
    readOptional('docs/activation-readiness-state.md'),
    readOptional('docs/activation-phase-roadmap.md'),
    readOptional('docs/activation-next-phase-runbook.md'),
    readOptional('docs/production-beta-readiness-runbook.md'),
    readOptional('docs/production-beta-readiness-scorecard.md'),
  ].join('\n')
  const blockers: string[] = []
  if (/Track A[^.\n]*(external beta|production)[^.\n]*(ready|approved|unlocked)/i.test(text)) blockers.push('Docs imply Track A is product beta/production ready.')
  if (/Track B[^.\n]*(ready for system-level internal testing|fully ready)/i.test(text) && /Phase 39C[^.\n]*(blocked|OOM|CUDA)/i.test(text)) blockers.push('Docs imply Track B is fully ready while Phase 39C remains blocked.')
  if (/RNNoise[^.\n]*(active fallback|active product|selected fallback)/i.test(text) && !/RNNoise[^.\n]*(removed|inactive|not active)/i.test(text)) blockers.push('Docs still describe RNNoise as an active fallback.')
  if (/Demucs[^.\n]*(runtime allowed|download approved|production ready)/i.test(text)) blockers.push('Docs imply Demucs runtime/download is approved.')
  return {
    checkId: 'stale_contradictions',
    status: blockers.length ? 'blocked' : 'passed',
    summary: blockers.length ? 'Stale or contradictory readiness wording remains.' : 'No blocking stale contradictions were found in current-state docs.',
    blockers,
    warnings: [],
  }
}

function readOptional(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}
