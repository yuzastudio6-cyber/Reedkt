export const SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK'

export const SUPABASE_PLUGIN_ALLOWED_CONFIRMATIONS = [
  SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
] as const

export const SUPABASE_PLUGIN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_SUPABASE_SQL_EXECUTION',
  'REEDITPRO_CONFIRM_SUPABASE_REMOTE_SQL',
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE',
  'REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACT_OUTPUT',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
] as const

export type SupabasePluginTargetBlocker =
  | 'supabase_plugin_staging_target_check_not_confirmed'
  | 'supabase_plugin_target_not_confirmed_as_staging'
  | 'supabase_plugin_project_ref_mismatch'
  | 'forbidden_confirmation_set'

export const OBSERVED_SUPABASE_PLUGIN_PROJECTS = [
  {
    projectRef: 'wmyyttnynmteqgcdishd',
    projectName: 'Reeditpro',
    region: 'us-west-1',
    status: 'ACTIVE_HEALTHY',
    postgresEngine: '17',
    releaseChannel: 'ga',
    createdAt: '2026-05-11T17:48:42.077692Z',
    hostRedacted: true,
    stagingLabelDetected: false,
  },
  {
    projectRef: 'jgvjrouckmdibwwbnczc',
    projectName: "yuzastudio6-cyber's Project",
    region: 'us-east-1',
    status: 'INACTIVE',
    postgresEngine: '17',
    releaseChannel: 'ga',
    createdAt: '2026-05-01T11:27:23.660611Z',
    hostRedacted: true,
    stagingLabelDetected: false,
  },
] as const

export const OBSERVED_SUPABASE_PLUGIN_MIGRATIONS = [
  '202605130001',
  '202605130002',
  '202605130003',
  '202605130004',
  '202605130005',
  '202605130006',
  '202605130007',
  '202605130008',
  '202605190001',
] as const

export function getForbiddenPluginConfirmations() {
  return SUPABASE_PLUGIN_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}

export function buildSupabasePluginTargetPreflight() {
  const forbiddenConfirmations = getForbiddenPluginConfirmations()
  const targetCheckConfirmed = process.env[SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION] === 'true'
  const observedActiveProject = OBSERVED_SUPABASE_PLUGIN_PROJECTS.find((project) => project.status === 'ACTIVE_HEALTHY')
  const selectedProjectRef = process.env.REEDITPRO_SUPABASE_PLUGIN_PROJECT_REF ?? observedActiveProject?.projectRef ?? 'unknown'
  const selectedProjectName = process.env.REEDITPRO_SUPABASE_PLUGIN_PROJECT_NAME ?? observedActiveProject?.projectName ?? 'unknown'
  const expectedStagingProjectRef = process.env.REEDITPRO_SUPABASE_PLUGIN_EXPECTED_STAGING_PROJECT_REF
  const targetEnvironment = process.env.REEDITPRO_SUPABASE_PLUGIN_TARGET_ENV
  const targetProof = process.env.REEDITPRO_SUPABASE_PLUGIN_STAGING_TARGET_PROOF
  const metadataLabelLooksStaging = /(^|[-_\s])staging($|[-_\s])/i.test(selectedProjectName)
  const operatorProofMatches =
    targetEnvironment === 'staging' &&
    targetProof === 'staging_confirmed_by_operator' &&
    Boolean(expectedStagingProjectRef) &&
    expectedStagingProjectRef === selectedProjectRef
  const stagingTargetConfirmed = targetCheckConfirmed && (metadataLabelLooksStaging || operatorProofMatches)
  const blockers = new Set<SupabasePluginTargetBlocker>()
  if (!targetCheckConfirmed) blockers.add('supabase_plugin_staging_target_check_not_confirmed')
  if (targetCheckConfirmed && expectedStagingProjectRef && expectedStagingProjectRef !== selectedProjectRef) {
    blockers.add('supabase_plugin_project_ref_mismatch')
  }
  if (!stagingTargetConfirmed) blockers.add('supabase_plugin_target_not_confirmed_as_staging')
  if (forbiddenConfirmations.length > 0) blockers.add('forbidden_confirmation_set')

  return {
    status: blockers.size === 0 ? 'passed' : 'blocked',
    pluginAvailableToCodexSession: true,
    pluginUsableFromRepoCliDirectly: false,
    pluginObservationSource: 'connected_supabase_plugin_observation_committed_as_safe_metadata',
    targetCheckConfirmation: SUPABASE_PLUGIN_STAGING_TARGET_CHECK_CONFIRMATION,
    targetCheckConfirmed,
    selectedProject: {
      projectRef: selectedProjectRef,
      projectName: selectedProjectName,
      status: process.env.REEDITPRO_SUPABASE_PLUGIN_PROJECT_STATUS ?? observedActiveProject?.status ?? 'unknown',
      region: process.env.REEDITPRO_SUPABASE_PLUGIN_PROJECT_REGION ?? observedActiveProject?.region ?? 'unknown',
      hostRedacted: true,
    },
    expectedStagingProjectRefProvided: Boolean(expectedStagingProjectRef),
    targetEnvironmentStatus: targetEnvironment === 'staging' ? 'staging_claim_provided' : 'missing_or_not_staging',
    targetProofStatus: targetProof === 'staging_confirmed_by_operator' ? 'operator_staging_proof_provided' : 'missing_or_unrecognized',
    metadataLabelLooksStaging,
    operatorProofMatches,
    stagingTargetConfirmed,
    observedProjects: OBSERVED_SUPABASE_PLUGIN_PROJECTS,
    observedMigrations: OBSERVED_SUPABASE_PLUGIN_MIGRATIONS,
    observedRegistryMigrationPresent: (OBSERVED_SUPABASE_PLUGIN_MIGRATIONS as readonly string[]).includes('202606050001'),
    branchListStatus: 'failed_in_plugin_session_project_reference_missing_when_validating_permissions',
    forbiddenConfirmationsSet: forbiddenConfirmations,
    credentialPayloadsPrinted: false,
    secretsRead: false,
    productionTargetAllowed: false,
    blockers: [...blockers],
  }
}
