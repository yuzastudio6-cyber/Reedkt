import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import {
  buildProductionToolExecutionReadinessEvidenceBundleFromEnv,
  type ProductionToolExecutionReadinessEvidenceBundleEnv,
} from './production-tool-execution-readiness-evidence-bundle'
import {
  buildProductionToolExecutionReadinessEvidencePreflight,
  resolveProductionToolExecutionReadinessEvidenceEnv,
  type ProductionToolExecutionReadinessEvidencePreflightEnv,
} from './production-tool-execution-readiness-evidence-preflight'

export const PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_TEMPLATE_VERSION =
  'production-tool-execution-readiness-evidence-v1'

export interface ProductionToolExecutionReadinessEvidenceTemplate {
  version: typeof PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_TEMPLATE_VERSION
  description: string
  generatedAt: string
  instructions: string[]
  recommendedSequence: Array<{
    step: number
    command: string
    purpose: string
    recordConfirmationEnv?: string
  }>
  templateBlockerSummary: {
    paidProductionEvidenceReady: boolean
    readyForScopedReviewedToolExecution: boolean
    missingConfigurationCount: number
    missingEvidenceCount: number
    sections: Array<{
      id: string
      label: string
      ready: boolean
      blockerCount: number
    }>
  }
  warnings: string[]
  environment: Record<string, string>
}

export interface ProductionToolExecutionReadinessEvidenceTemplateOptions {
  generatedAt?: Date
}

export async function buildProductionToolExecutionReadinessEvidenceTemplateFromEnv(
  env: ProductionToolExecutionReadinessEvidencePreflightEnv,
  options: ProductionToolExecutionReadinessEvidenceTemplateOptions = {},
): Promise<ProductionToolExecutionReadinessEvidenceTemplate> {
  const preflight = buildProductionToolExecutionReadinessEvidencePreflight(env)
  if (preflight.secretLikeInputPaths.length > 0) {
    throw new Error(`Production readiness evidence template rejected secret-like evidence input: ${preflight.secretLikeInputPaths.join(', ')}`)
  }

  const bundle = await buildProductionToolExecutionReadinessEvidenceBundleFromEnv(env as ProductionToolExecutionReadinessEvidenceBundleEnv)
  const resolved = resolveProductionToolExecutionReadinessEvidenceEnv(env)

  return {
    version: PRODUCTION_TOOL_EXECUTION_READINESS_EVIDENCE_TEMPLATE_VERSION,
    description: 'Local non-secret operator scaffold for ReEditPro production tool execution readiness evidence. Fill only reviewed evidence values; do not add credentials, signed URLs, raw prompts, private media payloads, or backend collector configuration.',
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    instructions: [
      'Keep this file local to the operator evidence workflow; do not commit it.',
      'Replace empty strings with reviewed non-secret evidence values and leave unknown booleans as "false" until the evidence exists.',
      'Use REEDITPRO_PRODUCTION_READINESS_EVIDENCE_FILE=/path/to/this-file.json with prod:readiness:tool-execution-gate-preflight before any all-up record/readback attempt.',
      'Backend recording still requires separate collector API configuration and idempotency environment variables; those values are intentionally not part of this file.',
      'A passing evidence file does not run tools, dispatch workers, call Supabase directly, call Stripe, process media, or activate production by itself.',
    ],
    recommendedSequence: bundle.recommendedSequence,
    templateBlockerSummary: {
      paidProductionEvidenceReady: bundle.summary.paidProductionEvidenceReady,
      readyForScopedReviewedToolExecution: bundle.summary.readyForScopedReviewedToolExecution,
      missingConfigurationCount: preflight.missingConfiguration.length,
      missingEvidenceCount: preflight.missingEvidence.length,
      sections: bundle.sections.map((section) => ({
        id: section.id,
        label: section.label,
        ready: section.ready,
        blockerCount: section.blockers.length,
      })),
    },
    warnings: [
      'This template command is dry-run metadata only.',
      'It does not call backend routes, Supabase, Stripe, workers, tools, media processors, deployments, or production.',
      'The evidence file parser ignores the safe template metadata keys and reads only the environment object.',
      'Unsupported evidence variables still fail closed in the preflight.',
    ],
    environment: buildTemplateEnvironment(preflight.requiredEnvironmentVariables, resolved.env),
  }
}

export function writeProductionToolExecutionReadinessEvidenceTemplateFile(
  filePath: string,
  template: ProductionToolExecutionReadinessEvidenceTemplate,
): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(template, null, 2)}\n`)
}

function buildTemplateEnvironment(
  requiredVariables: ReturnType<typeof buildProductionToolExecutionReadinessEvidencePreflight>['requiredEnvironmentVariables'],
  env: ProductionToolExecutionReadinessEvidencePreflightEnv,
): Record<string, string> {
  const orderedNames = [
    ...requiredVariables.map((item) => item.name),
    'REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID',
    'REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA',
  ] as Array<keyof ProductionToolExecutionReadinessEvidencePreflightEnv>

  const dedupedNames = [...new Set(orderedNames)]
  const templateEnv: Record<string, string> = {}
  for (const name of dedupedNames) {
    templateEnv[name] = clean(env[name]) ?? defaultTemplateValue(name)
  }
  return templateEnv
}

function defaultTemplateValue(name: keyof ProductionToolExecutionReadinessEvidencePreflightEnv): string {
  if (name === 'REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT') return ''
  if (isBooleanEvidenceVariable(name)) return 'false'
  return ''
}

function isBooleanEvidenceVariable(name: keyof ProductionToolExecutionReadinessEvidencePreflightEnv): boolean {
  const text = String(name)
  return text.includes('_CONFIRM_') ||
    text.endsWith('_ACCEPTED') ||
    text.endsWith('_APPROVED') ||
    text.endsWith('_BLOCKED') ||
    text.endsWith('_DEPLOYED') ||
    text.endsWith('_EXCLUDED') ||
    text.endsWith('_REJECTED') ||
    text.endsWith('_REQUIRED') ||
    text.endsWith('_SEPARATED') ||
    text.endsWith('_VERIFIED')
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const template = await buildProductionToolExecutionReadinessEvidenceTemplateFromEnv(process.env)
    const outputPath = argValue('output') ?? clean(process.env.REEDITPRO_PRODUCTION_READINESS_EVIDENCE_TEMPLATE_OUTPUT)
    if (outputPath) {
      writeProductionToolExecutionReadinessEvidenceTemplateFile(outputPath, template)
      console.log(JSON.stringify({
        ok: true,
        outputPath,
        version: template.version,
        generatedAt: template.generatedAt,
        environmentVariables: Object.keys(template.environment).length,
        paidProductionEvidenceReady: template.templateBlockerSummary.paidProductionEvidenceReady,
        readyForScopedReviewedToolExecution: template.templateBlockerSummary.readyForScopedReviewedToolExecution,
      }, null, 2))
    } else {
      console.log(JSON.stringify(template, null, 2))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
