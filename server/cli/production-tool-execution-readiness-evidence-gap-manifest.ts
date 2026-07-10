import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import {
  buildProductionToolExecutionReadinessEvidenceBundleFromEnv,
  type ProductionToolExecutionReadinessEvidenceBundleResult,
} from './production-tool-execution-readiness-evidence-bundle'
import {
  buildProductionToolExecutionReadinessEvidencePreflight,
  type ProductionToolExecutionReadinessEvidencePreflightEnv,
  type ProductionToolExecutionReadinessEvidencePreflightReport,
} from './production-tool-execution-readiness-evidence-preflight'

export const PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_GAP_MANIFEST_VERSION =
  'production-tool-execution-readiness-evidence-gap-manifest-v1'

export interface ProductionToolExecutionReadinessEvidenceGapManifest {
  version: typeof PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_GAP_MANIFEST_VERSION
  generatedAt: string
  ok: boolean
  mode: 'dry_run'
  productionActivationAttempted: false
  backendCallsAttempted: false
  evidenceFileLoaded: boolean
  source: {
    sourceId: string
    sourceShaPresent: boolean
    workspaceIdPresent: boolean
    projectIdPresent: boolean
    confirmEvidenceReview: boolean
  }
  summary: ProductionToolExecutionReadinessEvidenceBundleResult['summary'] & {
    missingConfigurationCount: number
    missingEvidenceCount: number
    secretLikeInputPathCount: number
  }
  groups: ProductionToolExecutionReadinessEvidenceGapGroup[]
  milestone10Checklist: ProductionToolExecutionReadinessEvidenceBundleResult['milestone10Checklist']
  recommendedSequence: ProductionToolExecutionReadinessEvidenceBundleResult['recommendedSequence']
  warnings: string[]
}

export interface ProductionToolExecutionReadinessEvidenceGapGroup {
  id: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id']
  label: string
  ownerLane: string
  ready: boolean
  blockerCount: number
  blockers: string[]
  collectorCommand?: string
  recordConfirmationEnv?: string
  nextAction: string
  evidenceVariables: Array<{
    name: string
    requiredFor: 'gate_identity' | 'production_evidence'
    valueProvided: boolean
  }>
}

export interface ProductionToolExecutionReadinessEvidenceGapManifestOptions {
  generatedAt?: Date
}

export async function buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv(
  env: ProductionToolExecutionReadinessEvidencePreflightEnv,
  options: ProductionToolExecutionReadinessEvidenceGapManifestOptions = {},
): Promise<ProductionToolExecutionReadinessEvidenceGapManifest> {
  const preflight = buildProductionToolExecutionReadinessEvidencePreflight(env)
  if (preflight.secretLikeInputPaths.length > 0) {
    throw new Error(`Production readiness evidence gap manifest rejected secret-like evidence input: ${preflight.secretLikeInputPaths.join(', ')}`)
  }

  const bundle = await buildProductionToolExecutionReadinessEvidenceBundleFromEnv(env)
  const variables = variableStatus(preflight)
  const groups = bundle.sections.map((section) => buildGroup(section, bundle, variables))

  return {
    version: PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_GAP_MANIFEST_VERSION,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    ok: bundle.ok,
    mode: 'dry_run',
    productionActivationAttempted: false,
    backendCallsAttempted: false,
    evidenceFileLoaded: preflight.evidenceFile.loaded,
    source: {
      sourceId: preflight.sourceId,
      sourceShaPresent: preflight.sourceShaPresent,
      workspaceIdPresent: preflight.workspaceIdPresent,
      projectIdPresent: preflight.projectIdPresent,
      confirmEvidenceReview: preflight.confirmEvidenceReview,
    },
    summary: {
      ...bundle.summary,
      missingConfigurationCount: preflight.missingConfiguration.length,
      missingEvidenceCount: preflight.missingEvidence.length,
      secretLikeInputPathCount: preflight.secretLikeInputPaths.length,
    },
    groups,
    milestone10Checklist: bundle.milestone10Checklist,
    recommendedSequence: bundle.recommendedSequence,
    warnings: [
      'This evidence gap manifest is dry-run only and does not call backend routes, Supabase, Stripe, workers, tools, media processors, deployments, or production.',
      'Evidence variable values are not printed; the manifest reports only whether each accepted variable is present.',
      'Use the matching focused collector for each blocked owner lane, then run the all-up preflight and all-up evidence collector after every lane is ready.',
      'A ready scoped worker-handler group does not imply paid production readiness; paid production requires every evidence group and owner signoff to pass.',
    ],
  }
}

export function writeProductionToolExecutionReadinessEvidenceGapManifestFile(
  filePath: string,
  manifest: ProductionToolExecutionReadinessEvidenceGapManifest,
): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`)
}

function buildGroup(
  section: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number],
  bundle: ProductionToolExecutionReadinessEvidenceBundleResult,
  variables: EvidenceVariableStatus[],
): ProductionToolExecutionReadinessEvidenceGapGroup {
  const sequence = sequenceBySection(section.id, bundle)
  const checklist = checklistBySection(section.id, bundle)
  return {
    id: section.id,
    label: section.label,
    ownerLane: ownerLane(section.id),
    ready: section.ready,
    blockerCount: section.blockers.length,
    blockers: section.blockers,
    collectorCommand: sequence?.command,
    recordConfirmationEnv: sequence?.recordConfirmationEnv,
    nextAction: checklist?.nextAction ?? (section.ready ? 'No action; this group is ready.' : 'Collect the missing evidence for this group.'),
    evidenceVariables: variables.filter((item) => variableBelongsToGroup(section.id, item.name)),
  }
}

interface EvidenceVariableStatus {
  name: string
  requiredFor: 'gate_identity' | 'production_evidence'
  valueProvided: boolean
}

function variableStatus(preflight: ProductionToolExecutionReadinessEvidencePreflightReport): EvidenceVariableStatus[] {
  return preflight.requiredEnvironmentVariables.map((item) => ({
    name: item.name,
    requiredFor: item.requiredFor,
    valueProvided: !preflight.missingConfiguration.some((missing) => missing.includes(item.name)) &&
      !missingEvidenceLikelyReferencesVariable(preflight, item.name),
  }))
}

function missingEvidenceLikelyReferencesVariable(
  preflight: ProductionToolExecutionReadinessEvidencePreflightReport,
  name: string,
): boolean {
  if (name.includes('_NOTES')) {
    return preflight.missingEvidence.some((item) => item.includes('notes are missing'))
  }
  if (name.includes('_EVIDENCE_ARTIFACT_ID')) {
    return preflight.missingEvidence.some((item) => item.includes('evidence artifact ID is missing'))
  }
  return false
}

function variableBelongsToGroup(
  sectionId: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id'],
  name: string,
): boolean {
  if (name === 'REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY' || name === 'REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT') {
    return sectionId !== 'real_worker_handlers'
  }
  switch (sectionId) {
    case 'supabase_persistence':
      return name.startsWith('REEDITPRO_PRODUCTION_SUPABASE_')
    case 'billing_route':
      return name.startsWith('REEDITPRO_PRODUCTION_TOOL_COST_')
    case 'wallet_lifecycle':
      return name.startsWith('REEDITPRO_PRODUCTION_WALLET_')
    case 'stripe_boundary':
      return name.startsWith('REEDITPRO_PRODUCTION_STRIPE_')
    case 'ops_observability':
      return name.startsWith('REEDITPRO_PRODUCTION_OBSERVABILITY_') ||
        name.startsWith('REEDITPRO_PRODUCTION_OPERATIONS_')
    case 'final_owner_signoff':
      return name.startsWith('REEDITPRO_PRODUCTION_OWNER_')
    case 'all_up_preflight':
      return name.startsWith('REEDITPRO_PRODUCTION_READINESS_') ||
        name.startsWith('REEDITPRO_PRODUCTION_TOOLS_') ||
        name.startsWith('REEDITPRO_PRODUCTION_HARD_')
    case 'real_worker_handlers':
      return false
  }
}

function sequenceBySection(
  sectionId: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id'],
  bundle: ProductionToolExecutionReadinessEvidenceBundleResult,
) {
  const commandBySection: Record<ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id'], string | undefined> = {
    supabase_persistence: 'npm run prod:readiness:supabase-persistence-evidence-collector',
    billing_route: 'npm run prod:readiness:billing-evidence-collector',
    wallet_lifecycle: 'npm run prod:readiness:wallet-lifecycle-evidence-collector',
    stripe_boundary: 'npm run prod:readiness:stripe-boundary-evidence-collector',
    ops_observability: 'npm run prod:readiness:ops-observability-evidence-collector',
    final_owner_signoff: 'npm run prod:readiness:final-owner-signoff-evidence-collector',
    all_up_preflight: 'npm run prod:readiness:tool-execution-gate-preflight',
    real_worker_handlers: 'npm run prod:readiness:real-worker-handler-readiness',
  }
  const command = commandBySection[sectionId]
  return bundle.recommendedSequence.find((item) => item.command === command)
}

function checklistBySection(
  sectionId: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id'],
  bundle: ProductionToolExecutionReadinessEvidenceBundleResult,
) {
  return bundle.milestone10Checklist.find((item) => item.sourceSectionIds.includes(sectionId))
}

function ownerLane(sectionId: ProductionToolExecutionReadinessEvidenceBundleResult['sections'][number]['id']): string {
  switch (sectionId) {
    case 'supabase_persistence':
      return 'backend_platform_supabase_owner'
    case 'billing_route':
      return 'backend_billing_owner'
    case 'wallet_lifecycle':
      return 'backend_wallet_owner'
    case 'stripe_boundary':
      return 'billing_owner'
    case 'ops_observability':
      return 'operations_observability_owner'
    case 'final_owner_signoff':
      return 'final_launch_owners'
    case 'all_up_preflight':
      return 'production_readiness_operator'
    case 'real_worker_handlers':
      return 'tool_runtime_owner'
  }
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const manifest = await buildProductionToolExecutionReadinessEvidenceGapManifestFromEnv(process.env)
    const outputPath = argValue('output') ?? clean(process.env.REEDITPRO_PRODUCTION_READINESS_EVIDENCE_GAP_MANIFEST_OUTPUT)
    if (outputPath) {
      writeProductionToolExecutionReadinessEvidenceGapManifestFile(outputPath, manifest)
      console.log(JSON.stringify({
        ok: true,
        outputPath,
        version: manifest.version,
        generatedAt: manifest.generatedAt,
        paidProductionEvidenceReady: manifest.summary.paidProductionEvidenceReady,
        readyForScopedReviewedToolExecution: manifest.summary.readyForScopedReviewedToolExecution,
        blockedGroups: manifest.groups.filter((group) => !group.ready).length,
      }, null, 2))
    } else {
      console.log(JSON.stringify(manifest, null, 2))
    }
    if (!manifest.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
