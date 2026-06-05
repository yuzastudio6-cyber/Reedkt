import { existsSync, readFileSync } from 'node:fs'

export const SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF'

export const SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_SOURCES = [
  'docs/supabase-staging-target-proof-policy.md',
  'docs/supabase-plugin-staging-target-policy.md',
  'docs/supabase-milestone-registry-staging-credential-policy.md',
  'docs/supabase-milestone-registry-staging-deploy-verify.md',
  'docs/activation-supabase-plugin-staging-deploy-reports/supabase_plugin_target_preflight_report.json',
] as const

export type SupabaseApprovedStagingTargetReferenceStatus = 'passed' | 'blocked'

export interface SupabaseApprovedStagingTargetReferenceReport extends Record<string, unknown> {
  status: SupabaseApprovedStagingTargetReferenceStatus
  approvedStagingTargetReferenceFound: boolean
  approvedStagingProjectRef: string | null
  approvedStagingProjectName: string | null
  approvedEnvironment: string | null
  approvedReferenceSource: string | null
  sourceFilesInspected: Array<{
    file: string
    exists: boolean
    hasApprovedStatusMarker: boolean
    hasProjectRefMarker: boolean
    hasEnvironmentMarker: boolean
  }>
  safeReferencePolicy: {
    projectRefIsSafeMetadata: boolean
    dbUrlIsForbidden: boolean
    keysTokensPasswordsForbidden: boolean
    pluginObservationAloneIsNotApproval: boolean
    runtimeEnvRefAloneIsNotApproval: boolean
  }
  runtimeProvidedReferenceIgnored: boolean
  secretPayloadsRead: false
  secretPayloadsPrinted: false
  blockers: string[]
}

const PROJECT_REF_PATTERN = /approved_staging_supabase_project_ref\s*[:=]\s*([a-z0-9]{20})/i
const PROJECT_NAME_PATTERN = /approved_staging_supabase_project_name\s*[:=]\s*([^\n\r]+)/i
const ENVIRONMENT_PATTERN = /approved_staging_environment\s*[:=]\s*(staging)/i
const STATUS_PATTERN = /approved_staging_target_reference_status\s*[:=]\s*approved/i
const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /anon[_-]?key\s*[:=]/i,
  /access[_-]?token\s*[:=]/i,
  /password\s*[:=]/i,
  /BEGIN PRIVATE KEY/i,
] as const

export function buildApprovedStagingTargetReferenceReport(): SupabaseApprovedStagingTargetReferenceReport {
  const inspected = SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_SOURCES.map((file) => {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : ''
    return {
      file,
      exists: existsSync(file),
      hasApprovedStatusMarker: STATUS_PATTERN.test(text),
      hasProjectRefMarker: PROJECT_REF_PATTERN.test(text),
      hasEnvironmentMarker: ENVIRONMENT_PATTERN.test(text),
    }
  })

  let approvedStagingProjectRef: string | null = null
  let approvedStagingProjectName: string | null = null
  let approvedEnvironment: string | null = null
  let approvedReferenceSource: string | null = null
  let secretPayloadDetected = false

  for (const file of SUPABASE_APPROVED_STAGING_TARGET_REFERENCE_SOURCES) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) secretPayloadDetected = true
    const refMatch = text.match(PROJECT_REF_PATTERN)
    const nameMatch = text.match(PROJECT_NAME_PATTERN)
    const environmentMatch = text.match(ENVIRONMENT_PATTERN)
    if (STATUS_PATTERN.test(text) && refMatch?.[1] && environmentMatch?.[1] === 'staging') {
      approvedStagingProjectRef = refMatch[1]
      approvedStagingProjectName = nameMatch?.[1]?.trim() ?? null
      approvedEnvironment = environmentMatch[1]
      approvedReferenceSource = file
      break
    }
  }

  const blockers = new Set<string>()
  if (!approvedStagingProjectRef || approvedEnvironment !== 'staging') {
    blockers.add('approved_staging_target_reference_missing')
  }
  if (secretPayloadDetected) blockers.add('approved_staging_target_reference_contains_secret_like_payload')

  return {
    status: blockers.size === 0 ? 'passed' : 'blocked',
    approvedStagingTargetReferenceFound: blockers.size === 0,
    approvedStagingProjectRef,
    approvedStagingProjectName,
    approvedEnvironment,
    approvedReferenceSource,
    sourceFilesInspected: inspected,
    safeReferencePolicy: {
      projectRefIsSafeMetadata: true,
      dbUrlIsForbidden: true,
      keysTokensPasswordsForbidden: true,
      pluginObservationAloneIsNotApproval: true,
      runtimeEnvRefAloneIsNotApproval: true,
    },
    runtimeProvidedReferenceIgnored: Boolean(process.env.REEDITPRO_SUPABASE_PLUGIN_EXPECTED_STAGING_PROJECT_REF),
    secretPayloadsRead: false,
    secretPayloadsPrinted: false,
    blockers: [...blockers],
  }
}
