import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { JSONObject } from '../../src/types'

export type SupabaseMilestoneRegistryStatus = 'completed' | 'partial' | 'blocked'

export interface SupabaseMilestoneArtifactInput {
  artifactId: string
  artifactType: string
  gcsUri: string
  sourceOfTruth: boolean
  signedUrlSourceOfTruth: boolean
  metadata?: Record<string, unknown>
}

export interface SupabaseMilestoneQaGateInput {
  gateId: string
  status: 'passed' | 'blocked' | 'warning'
  summary: string
  mandatory: boolean
  evidence?: JSONObject
}

export interface SupabaseReadinessSnapshotInput {
  subsystem: string
  readinessKey: string
  readinessStatus: string
  scope: string
  evidence?: JSONObject
}

export interface SupabaseToolCapabilityInput {
  toolId: string
  displayName: string
  track: string
  subsystem: string
  readinessState: string
  runtimeAllowed: boolean
  productionAllowed: boolean
  externalBetaAllowed: boolean
  broadMediaAllowed: boolean
  evidence?: JSONObject
}

export interface SupabaseFeatureGateInput {
  gateKey: string
  gateName: string
  gateStatus: 'enabled' | 'disabled' | 'blocked'
  enabled: boolean
  productionAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
  broadMediaAllowed: boolean
  evidence?: JSONObject
}

export interface SupabaseMilestoneBundle {
  phaseId: string
  phaseName: string
  runId: string
  status: SupabaseMilestoneRegistryStatus
  track: string
  subsystem: string
  branch: string
  prNumber: number | null
  prUrl: string | null
  baseBranch: string
  commitSha: string | null
  qaStatus: 'passed' | 'blocked' | 'warning'
  readinessStatus: string
  completedAt: string | null
  artifacts: SupabaseMilestoneArtifactInput[]
  qaGates: SupabaseMilestoneQaGateInput[]
  readinessSnapshots: SupabaseReadinessSnapshotInput[]
  toolCapabilities: SupabaseToolCapabilityInput[]
  featureGateUpdates: SupabaseFeatureGateInput[]
  summary: string
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneBundleValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneWriteVerification {
  status: 'not_attempted' | 'completed' | 'blocked'
  phaseId: string
  runId: string | null
  activationRunId: string | null
  blockers: string[]
  warnings: string[]
}

export interface SupabaseRegistrySchemaVerification {
  status: 'not_attempted' | 'completed' | 'blocked'
  tables: Array<{ tableName: string; present: boolean }>
  allTablesPresent: boolean
  serviceRoleRestUsed: boolean
  ddlUsedThroughRest: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneCredentialResolution {
  configured: boolean
  supabaseUrl?: string
  serviceRoleKey?: string
  blockers: string[]
  warnings: string[]
}

export interface SupabaseActivationRunReadback {
  id: string | null
  phase_id: string
  run_id: string
}

const registryTables = [
  'activation_milestone_runs',
  'activation_milestone_artifacts',
  'activation_milestone_qa_gates',
  'activation_milestone_readiness_snapshots',
  'activation_milestone_tool_capabilities',
  'activation_milestone_feature_gates',
]

export async function resolveSupabaseMilestoneCredentials(): Promise<SupabaseMilestoneCredentialResolution> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      configured: false,
      blockers: ['SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required before milestone registry writes.'],
      warnings: ['Supabase milestone registry is unavailable in static/no-secret mode.'],
    }
  }

  return { configured: true, supabaseUrl, serviceRoleKey, blockers: [], warnings: [] }
}

export function createSupabaseMilestoneServiceClient(
  credentials: SupabaseMilestoneCredentialResolution,
): SupabaseClient {
  if (!credentials.configured || !credentials.supabaseUrl || !credentials.serviceRoleKey) {
    throw new Error('Supabase milestone service client requires resolved credentials.')
  }
  return createClient(credentials.supabaseUrl, credentials.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function inspectSupabaseMilestoneRegistryTables(
  client?: SupabaseClient,
): Promise<SupabaseRegistrySchemaVerification> {
  if (!client) {
    return {
      status: 'not_attempted',
      tables: registryTables.map((tableName) => ({ tableName, present: false })),
      allTablesPresent: false,
      serviceRoleRestUsed: false,
      ddlUsedThroughRest: false,
      blockers: ['Supabase client was unavailable; registry table inspection was not attempted.'],
      warnings: [],
    }
  }

  const tables = await Promise.all(registryTables.map(async (tableName) => {
    const { error } = await client.from(tableName).select('*').limit(0)
    return { tableName, present: !error }
  }))
  const missing = tables.filter((table) => !table.present)
  return {
    status: missing.length ? 'blocked' : 'completed',
    tables,
    allTablesPresent: missing.length === 0,
    serviceRoleRestUsed: true,
    ddlUsedThroughRest: false,
    blockers: missing.map((table) => `Missing Supabase milestone registry table: ${table.tableName}`),
    warnings: [],
  }
}

export function validateSupabaseMilestoneBundle(
  bundle: SupabaseMilestoneBundle,
): SupabaseMilestoneBundleValidation {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!bundle.phaseId || !bundle.runId) blockers.push('Milestone bundle requires phaseId and runId.')
  for (const artifact of bundle.artifacts) {
    if (!artifact.gcsUri.startsWith('gs://')) blockers.push(`Artifact ${artifact.artifactId} must use a private gs:// URI.`)
    if (artifact.signedUrlSourceOfTruth) blockers.push(`Artifact ${artifact.artifactId} cannot use signed URL source truth.`)
  }
  if (!bundle.qaGates.length) warnings.push('Milestone bundle has no QA gates.')
  if (bundle.featureGateUpdates.some((gate) => gate.enabled || gate.productionAllowed || gate.externalBetaAllowed || gate.paidProductionAllowed || gate.broadMediaAllowed)) {
    blockers.push('Milestone bundle attempts to enable a blocked feature gate.')
  }

  return { ok: blockers.length === 0, blockers, warnings }
}

export function buildNotAttemptedWriteVerification(blockers: string[]): SupabaseMilestoneWriteVerification {
  return {
    status: 'not_attempted',
    phaseId: 'unknown',
    runId: null,
    activationRunId: null,
    blockers,
    warnings: ['No Supabase milestone registry write was attempted.'],
  }
}

export async function writeMilestoneBundle(
  _client: SupabaseClient,
  bundle: SupabaseMilestoneBundle,
): Promise<SupabaseMilestoneWriteVerification> {
  return {
    status: 'blocked',
    phaseId: bundle.phaseId,
    runId: bundle.runId,
    activationRunId: null,
    blockers: ['Supabase milestone write RPC/table implementation is not available in this backend skeleton.'],
    warnings: ['No Supabase row was written.'],
  }
}

export async function readActivationRun(
  client: SupabaseClient,
  phaseId: string,
  runId: string,
): Promise<SupabaseActivationRunReadback | null> {
  const { data, error } = await client
    .from('activation_milestone_runs')
    .select('id, phase_id, run_id')
    .eq('phase_id', phaseId)
    .eq('run_id', runId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data || typeof data !== 'object') return null
  const row = data as Record<string, unknown>
  return {
    id: typeof row.id === 'string' ? row.id : null,
    phase_id: typeof row.phase_id === 'string' ? row.phase_id : phaseId,
    run_id: typeof row.run_id === 'string' ? row.run_id : runId,
  }
}
