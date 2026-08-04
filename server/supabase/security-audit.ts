import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { auditSupabaseMigrationSources } from './migration-baseline-audit'

export type SupabaseStaticSecurityStatus =
  | 'static_review_clear'
  | 'blocked_by_security_findings'

export type SupabaseSecuritySeverity = 'critical' | 'high' | 'medium' | 'low'

export interface SupabaseSecurityMigrationSource {
  filePath: string
  sql: string
}

export interface SupabaseSecurityEvidence {
  filePath: string
  line: number
  subject: string
  detail: string
}

export interface SupabaseSecurityFinding {
  id: string
  severity: SupabaseSecuritySeverity
  category:
    | 'migration_integrity'
    | 'rls'
    | 'grants'
    | 'worker_boundary'
    | 'function_security'
    | 'storage'
    | 'tenant_binding'
    | 'identity_contract'
  title: string
  explanation: string
  subjects: string[]
  evidence: SupabaseSecurityEvidence[]
  remediation: string
}

export interface SupabaseStaticSecurityAudit {
  status: SupabaseStaticSecurityStatus
  safeToTreatAsProductionSecure: boolean
  staticSourceReviewOnly: true
  remoteDatabaseVerified: false
  migrationFileCount: number
  publicTableCount: number
  publicTablesWithExplicitRlsCount: number
  publicTablesWithoutExplicitRls: string[]
  activePolicyCount: number
  publicViewCount: number
  securityInvokerViewCount: number
  securityDefinerFunctionCount: number
  unsafeSecurityDefinerFunctionCount: number
  criticalFindingCount: number
  highFindingCount: number
  findings: SupabaseSecurityFinding[]
  blockers: string[]
  limitations: string[]
  nextActions: string[]
}

interface TableDefinition {
  tableName: string
  columns: string[]
  body: string
  evidence: SupabaseSecurityEvidence
}

interface PolicyDefinition {
  key: string
  schema: string
  tableName: string
  policyName: string
  command: TablePrivilege | 'all'
  roles: string[]
  body: string
  evidence: SupabaseSecurityEvidence
}

interface ViewDefinition {
  viewName: string
  securityInvoker: boolean
  evidence: SupabaseSecurityEvidence
}

interface FunctionDefinition {
  key: string
  functionName: string
  securityDefiner: boolean
  searchPath: string | null
  evidence: SupabaseSecurityEvidence
}

type TablePrivilege = 'select' | 'insert' | 'update' | 'delete' | 'truncate' | 'references' | 'trigger'

const ALL_TABLE_PRIVILEGES: TablePrivilege[] = [
  'select',
  'insert',
  'update',
  'delete',
  'truncate',
  'references',
  'trigger',
]

const WRITE_PRIVILEGES = new Set<TablePrivilege>([
  'insert',
  'update',
  'delete',
  'truncate',
  'references',
  'trigger',
])

const CREDIT_CONTROL_TABLES = new Set([
  'credit_wallets',
  'credit_grants',
  'credit_ledger_entries',
  'credit_reservations',
  'credit_reservation_line_items',
  'credit_refunds',
])

const USER_REQUEST_TABLES = new Set([
  'preview_reviews',
  'revision_requests',
  'user_confirmations',
])

export function auditSupabaseSecurityDirectory(directoryPath: string): SupabaseStaticSecurityAudit {
  const sources = readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{12}_.+\.sql$/.test(entry.name))
    .map((entry) => ({
      filePath: `supabase/migrations/${entry.name}`,
      sql: readFileSync(join(directoryPath, entry.name), 'utf8'),
    }))

  return auditSupabaseSecuritySources(sources)
}

export function auditSupabaseSecuritySources(
  sources: SupabaseSecurityMigrationSource[],
): SupabaseStaticSecurityAudit {
  const orderedSources = [...sources].sort((left, right) => left.filePath.localeCompare(right.filePath))
  const tableDefinitions = orderedSources.flatMap(extractTableDefinitions)
  const tableByName = new Map<string, TableDefinition>()
  for (const definition of tableDefinitions) {
    if (!tableByName.has(definition.tableName)) {
      tableByName.set(definition.tableName, definition)
    }
  }

  const publicTables = [...tableByName.keys()].sort()
  const explicitRlsTables = new Set(
    orderedSources.flatMap((source) => [...source.sql.matchAll(
      /alter\s+table\s+(?:if\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security\s*;/gi,
    )].map((match) => match[1].toLowerCase())),
  )
  const publicTablesWithoutExplicitRls = publicTables.filter((tableName) => !explicitRlsTables.has(tableName))
  const activePolicies = resolveActivePolicies(orderedSources)
  const activeGrants = resolveActiveTableGrants(orderedSources)
  const views = resolveViews(orderedSources)
  const functions = resolveFunctions(orderedSources)
  const functionExecuteRevokes = resolveFunctionPublicExecuteRevokes(orderedSources)
  const findings: SupabaseSecurityFinding[] = []

  const baselineReport = auditSupabaseMigrationSources(orderedSources)
  if (!baselineReport.safeToRunRawMigrationDirectory) {
    findings.push({
      id: 'migration_baseline_unreconciled',
      severity: 'critical',
      category: 'migration_integrity',
      title: 'Parallel migration foundations make effective security state ambiguous',
      explanation:
        'The raw migration directory contains incompatible foundation families. Static policy analysis is useful, but it cannot prove which table contract exists in a deployed database until a canonical chain is isolated and tested.',
      subjects: baselineReport.incompatibleOverlappingTables,
      evidence: baselineReport.legacyFoundationFiles.slice(0, 1).map((filePath) => ({
        filePath,
        line: 1,
        subject: 'parallel migration foundations',
        detail: baselineReport.blockers.join(' '),
      })),
      remediation:
        'Build and review an isolated canonical migration chain, preserve applied history, then prove a clean local reset before staging or production use.',
    })
  }

  if (publicTablesWithoutExplicitRls.length > 0) {
    findings.push({
      id: 'public_tables_missing_explicit_rls',
      severity: 'critical',
      category: 'rls',
      title: 'Public tables are missing explicit RLS enablement',
      explanation:
        'Every application table exposed through Supabase public schema must have an explicit, statically reviewable RLS enable statement.',
      subjects: publicTablesWithoutExplicitRls,
      evidence: publicTablesWithoutExplicitRls.map((tableName) => requiredTable(tableByName, tableName).evidence),
      remediation: 'Enable and test RLS for every exposed public table in the future canonical chain.',
    })
  }

  const insecureViews = views.filter((view) => !view.securityInvoker)
  if (insecureViews.length > 0) {
    findings.push({
      id: 'views_missing_security_invoker',
      severity: 'high',
      category: 'rls',
      title: 'Views do not explicitly invoke underlying-table security',
      explanation:
        'User-readable views should use security_invoker so underlying table privileges and RLS remain authoritative.',
      subjects: insecureViews.map((view) => view.viewName),
      evidence: insecureViews.map((view) => view.evidence),
      remediation: 'Recreate user-readable views with security_invoker = true and test cross-tenant denial.',
    })
  }

  const publicOrAnonGrants = [...activeGrants.entries()]
    .filter(([key, privileges]) => {
      const role = key.split(':')[2]
      return (role === 'public' || role === 'anon') && privileges.size > 0
    })
  if (publicOrAnonGrants.length > 0) {
    const subjects = publicOrAnonGrants.map(([key]) => key.split(':').slice(0, 2).join('.'))
    findings.push({
      id: 'public_or_anon_table_privileges',
      severity: 'critical',
      category: 'grants',
      title: 'Public or anonymous roles retain table privileges',
      explanation: 'Private ReeditPro project and execution data must not be available to anonymous clients.',
      subjects,
      evidence: grantEvidenceForSubjects(orderedSources, subjects, ['public', 'anon']),
      remediation: 'Revoke all anonymous/public table privileges in the canonical chain and verify live grants.',
    })
  }

  const authenticatedWriteExposure = findAuthenticatedWriteExposure(
    tableByName,
    explicitRlsTables,
    activePolicies,
    activeGrants,
  )
  const creditExposure = authenticatedWriteExposure.filter((exposure) => CREDIT_CONTROL_TABLES.has(exposure.tableName))
  if (creditExposure.length > 0) {
    findings.push({
      id: 'authenticated_credit_control_mutation',
      severity: 'critical',
      category: 'grants',
      title: 'Authenticated users can mutate service-controlled credit state',
      explanation:
        'Credit wallets, grants, ledger entries, reservations, line items, and refunds must be service-controlled and append-only where applicable. Workspace admin status is not authority to mint or rewrite credits.',
      subjects: creditExposure.map((exposure) => exposure.tableName),
      evidence: creditExposure.flatMap((exposure) => exposure.evidence),
      remediation:
        'Drop permissive user-write policies, revoke authenticated write grants, and expose only validated backend operations tied to exact approved snapshots.',
    })
  }

  const controlPlaneExposure = authenticatedWriteExposure.filter((exposure) => (
    !CREDIT_CONTROL_TABLES.has(exposure.tableName)
    && !USER_REQUEST_TABLES.has(exposure.tableName)
    && isServiceControlledTable(exposure.tableName)
  ))
  if (controlPlaneExposure.length > 0) {
    findings.push({
      id: 'authenticated_control_plane_mutation',
      severity: 'high',
      category: 'worker_boundary',
      title: 'Authenticated users can write worker/provider/render control-plane tables',
      explanation:
        'Provider requests, generated assets, jobs, worker state, render/export state, QA records, and SFX execution records must be written through audited service-role backend workflows.',
      subjects: controlPlaneExposure.map((exposure) => exposure.tableName),
      evidence: controlPlaneExposure.flatMap((exposure) => exposure.evidence),
      remediation:
        'Remove authenticated write policies/grants for execution-owned tables and keep user actions in narrowly scoped request/review tables.',
    })
  }

  addSensitiveReadFinding({
    findings,
    findingId: 'worker_lease_token_member_readable',
    severity: 'critical',
    tableName: 'worker_leases',
    sensitiveColumns: ['lease_token'],
    title: 'Worker lease ownership tokens are member-readable',
    explanation:
      'A lease token is a backend capability secret. Workspace membership must never grant access to the worker_leases base row containing that token.',
    remediation:
      'Make the base table service-only and expose a sanitized status view that excludes lease_token.',
    tableByName,
    explicitRlsTables,
    activePolicies,
    activeGrants,
  })

  addSensitiveReadFinding({
    findings,
    findingId: 'runtime_payloads_member_readable',
    severity: 'high',
    tableName: 'backend_runtime_messages',
    sensitiveColumns: ['payload', 'response_payload', 'error_payload'],
    title: 'Raw backend runtime envelopes are member-readable',
    explanation:
      'Runtime payloads can contain internal routing, signed references, provider details, or operational errors even when comments say secrets should be absent.',
    remediation:
      'Keep runtime-message base rows service-only and expose only a sanitized status projection when users need progress visibility.',
    tableByName,
    explicitRlsTables,
    activePolicies,
    activeGrants,
  })

  const securityDefiners = functions.filter((definition) => definition.securityDefiner)
  const unsafeSecurityDefiners = securityDefiners.filter((definition) => !isSafeSearchPath(definition.searchPath))
  if (unsafeSecurityDefiners.length > 0) {
    findings.push({
      id: 'security_definer_unsafe_search_path',
      severity: 'high',
      category: 'function_security',
      title: 'SECURITY DEFINER functions use an unsafe or implicit search_path',
      explanation:
        'Definer functions must not resolve attacker-controlled objects from public or an implicit schema search path.',
      subjects: unsafeSecurityDefiners.map((definition) => definition.functionName),
      evidence: unsafeSecurityDefiners.map((definition) => definition.evidence),
      remediation:
        "Set search_path to '' (with fully qualified names) or a minimal trusted path, then test every definer function.",
    })
  }

  const publicExecutableDefiners = securityDefiners.filter((definition) => (
    !functionExecuteRevokes.has(definition.functionName)
  ))
  if (publicExecutableDefiners.length > 0) {
    findings.push({
      id: 'security_definer_public_execute_not_revoked',
      severity: 'high',
      category: 'function_security',
      title: 'SECURITY DEFINER functions do not revoke default PUBLIC execution',
      explanation:
        'Postgres grants function execution to PUBLIC by default. Definer functions need explicit revoke/grant decisions rather than relying on RLS-adjacent assumptions.',
      subjects: publicExecutableDefiners.map((definition) => definition.functionName),
      evidence: publicExecutableDefiners.map((definition) => definition.evidence),
      remediation:
        'Revoke EXECUTE from PUBLIC and anon for each definer signature, then grant only the minimum required roles.',
    })
  }

  const activeStoragePolicies = [...activePolicies.values()].filter((policy) => policy.schema === 'storage')
  const hasFlatStoragePolicies = activeStoragePolicies.some((policy) => (
    /_project_objects|upload_source|update_source/.test(policy.policyName)
    && !/workspace_project/.test(policy.policyName)
  ))
  const hasWorkspaceStoragePolicies = activeStoragePolicies.some((policy) => /workspace_project/.test(policy.policyName))
  if (hasFlatStoragePolicies && hasWorkspaceStoragePolicies) {
    findings.push({
      id: 'storage_policy_composition_overlap',
      severity: 'high',
      category: 'storage',
      title: 'Legacy and workspace-path storage policies remain active together',
      explanation:
        'Postgres permissive policies combine with OR. A stricter new path policy does not neutralize a still-active legacy flat-path policy.',
      subjects: activeStoragePolicies.map((policy) => policy.policyName),
      evidence: activeStoragePolicies.map((policy) => policy.evidence),
      remediation: 'Drop superseded storage policies by exact name before creating the canonical path policy.',
    })
  }

  const unboundWorkspacePolicies = activeStoragePolicies.filter((policy) => (
    /workspace_project/.test(policy.policyName)
    && /foldername\s*\(\s*name\s*\)\)\s*\[\s*4\s*\]/i.test(policy.body)
    && !storagePolicyBindsWorkspaceToProject(policy.body)
  ))
  if (unboundWorkspacePolicies.length > 0) {
    findings.push({
      id: 'storage_workspace_segment_not_bound_to_project',
      severity: 'high',
      category: 'storage',
      title: 'Workspace path segment is not bound to the project workspace',
      explanation:
        'Checking membership for the project-id segment alone does not prove that workspace/{workspace_id} matches that project’s real workspace.',
      subjects: unboundWorkspacePolicies.map((policy) => policy.policyName),
      evidence: unboundWorkspacePolicies.map((policy) => policy.evidence),
      remediation:
        'Require the parsed workspace UUID to equal projects.workspace_id for the parsed project UUID in every storage policy.',
    })
  }

  const bucketConstraintEvidence = findUnconstrainedPrivateBucketEvidence(orderedSources)
  if (bucketConstraintEvidence.length > 0) {
    findings.push({
      id: 'storage_upload_constraints_missing',
      severity: 'medium',
      category: 'storage',
      title: 'Storage buckets use null file-size or MIME constraints',
      explanation:
        'Private access does not limit oversized or unexpected browser uploads. Source and thumbnail upload surfaces need reviewed size and MIME allowlists.',
      subjects: bucketConstraintEvidence.map((evidence) => evidence.subject),
      evidence: bucketConstraintEvidence,
      remediation: 'Set reviewed file_size_limit and allowed_mime_types values for every browser-writable bucket.',
    })
  }

  const unboundTenantTables = tableDefinitions
    .filter((definition) => definition.columns.includes('workspace_id') && definition.columns.includes('project_id'))
    .filter((definition) => !hasCompositeProjectWorkspaceBinding(definition, orderedSources))
    .filter((definition, index, definitions) => (
      definitions.findIndex((candidate) => candidate.tableName === definition.tableName) === index
    ))
  if (unboundTenantTables.length > 0) {
    findings.push({
      id: 'workspace_project_ids_not_composite_bound',
      severity: 'high',
      category: 'tenant_binding',
      title: 'Workspace and project IDs are not structurally bound',
      explanation:
        'Policies often validate workspace_id and project_id independently. Without a composite foreign key or trusted trigger, a row can combine a workspace the caller belongs to with a project from another workspace.',
      subjects: unboundTenantTables.map((definition) => definition.tableName),
      evidence: unboundTenantTables.map((definition) => definition.evidence),
      remediation:
        'Add a unique (id, workspace_id) project key and composite foreign keys, or derive workspace_id from project_id in trusted backend/database logic.',
    })
  }

  if (tableByName.has('profiles') && tableByName.has('user_profiles')) {
    findings.push({
      id: 'identity_contract_drift',
      severity: 'high',
      category: 'identity_contract',
      title: 'Parallel profile and ownership contracts remain in migration sources',
      explanation:
        'The source chain mixes profiles/auth.users ownership with legacy user_profiles/owner_user_id relationships. RLS helpers cannot be trusted until one identity contract is canonical.',
      subjects: ['profiles', 'user_profiles'],
      evidence: [requiredTable(tableByName, 'profiles').evidence, requiredTable(tableByName, 'user_profiles').evidence],
      remediation: 'Choose one auth/profile/workspace ownership contract in the canonical chain and write upgrade mappings for any applied environments.',
    })
  }

  const sortedFindings = findings.sort((left, right) => (
    severityRank(left.severity) - severityRank(right.severity) || left.id.localeCompare(right.id)
  ))
  const criticalFindingCount = sortedFindings.filter((finding) => finding.severity === 'critical').length
  const highFindingCount = sortedFindings.filter((finding) => finding.severity === 'high').length
  const status: SupabaseStaticSecurityStatus = sortedFindings.length === 0
    ? 'static_review_clear'
    : 'blocked_by_security_findings'

  return {
    status,
    safeToTreatAsProductionSecure: false,
    staticSourceReviewOnly: true,
    remoteDatabaseVerified: false,
    migrationFileCount: orderedSources.length,
    publicTableCount: publicTables.length,
    publicTablesWithExplicitRlsCount: publicTables.length - publicTablesWithoutExplicitRls.length,
    publicTablesWithoutExplicitRls,
    activePolicyCount: activePolicies.size,
    publicViewCount: views.length,
    securityInvokerViewCount: views.filter((view) => view.securityInvoker).length,
    securityDefinerFunctionCount: securityDefiners.length,
    unsafeSecurityDefinerFunctionCount: unsafeSecurityDefiners.length,
    criticalFindingCount,
    highFindingCount,
    findings: sortedFindings,
    blockers: sortedFindings
      .filter((finding) => finding.severity === 'critical' || finding.severity === 'high')
      .map((finding) => `[${finding.severity.toUpperCase()}] ${finding.title}`),
    limitations: [
      'This is a static source audit. It does not execute SQL, connect to Supabase, inspect pg_catalog, or verify a deployed database.',
      'A clean static result would still require a canonical clean reset, two-user/two-workspace denial tests, storage tests, and Supabase Security Advisor review.',
      'The raw migration directory remains non-executable while the separate migration-baseline audit is blocked.',
    ],
    nextActions: [
      'Finish an isolated canonical migration chain instead of applying the raw parallel foundations.',
      'Make credit, worker, provider, generation, render, export, QA, and SFX execution state service-role only.',
      'Remove secret-bearing base-table reads and expose sanitized status views where required.',
      'Harden SECURITY DEFINER search paths and explicit execute grants.',
      'Prove workspace/project composite binding and private storage paths with two-user/two-workspace tests.',
      'After local and staging pass, compare this source report with live catalog grants/policies and Supabase Security Advisor.',
    ],
  }
}

function extractTableDefinitions(source: SupabaseSecurityMigrationSource): TableDefinition[] {
  const definitions: TableDefinition[] = []
  const pattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\s*\(/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(source.sql)) !== null) {
    const openParenIndex = pattern.lastIndex - 1
    const closeParenIndex = findMatchingParen(source.sql, openParenIndex)
    if (closeParenIndex < 0) {
      continue
    }
    const body = source.sql.slice(openParenIndex + 1, closeParenIndex)
    const tableName = match[1].toLowerCase()
    definitions.push({
      tableName,
      columns: extractColumnNames(body),
      body,
      evidence: evidence(source, match.index, tableName, `CREATE TABLE public.${tableName}`),
    })
    pattern.lastIndex = closeParenIndex + 1
  }
  return definitions
}

function resolveActivePolicies(sources: SupabaseSecurityMigrationSource[]): Map<string, PolicyDefinition> {
  const policies = new Map<string, PolicyDefinition>()
  for (const source of sources) {
    const operations: Array<{ index: number; apply: () => void }> = []
    const dropPattern = /drop\s+policy\s+(?:if\s+exists\s+)?("[^"]+"|[a-z_][a-z0-9_]*)\s+on\s+(public|storage)\.([a-z_][a-z0-9_]*)\s*;/gi
    let dropMatch: RegExpExecArray | null
    while ((dropMatch = dropPattern.exec(source.sql)) !== null) {
      const policyName = normalizeIdentifier(dropMatch[1])
      const schema = dropMatch[2].toLowerCase()
      const tableName = dropMatch[3].toLowerCase()
      operations.push({
        index: dropMatch.index,
        apply: () => policies.delete(policyKey(schema, tableName, policyName)),
      })
    }

    const createPattern = /create\s+policy\s+("[^"]+"|[a-z_][a-z0-9_]*)\s+on\s+(?:table\s+)?(public|storage)\.([a-z_][a-z0-9_]*)\s+([\s\S]*?);/gi
    let createMatch: RegExpExecArray | null
    while ((createMatch = createPattern.exec(source.sql)) !== null) {
      const policyName = normalizeIdentifier(createMatch[1])
      const schema = createMatch[2].toLowerCase()
      const tableName = createMatch[3].toLowerCase()
      const body = createMatch[4]
      const command = (body.match(/\bfor\s+(all|select|insert|update|delete)\b/i)?.[1]?.toLowerCase() ?? 'all') as PolicyDefinition['command']
      const roles = parsePolicyRoles(body)
      const definition: PolicyDefinition = {
        key: policyKey(schema, tableName, policyName),
        schema,
        tableName,
        policyName,
        command,
        roles,
        body,
        evidence: evidence(source, createMatch.index, `${schema}.${tableName}:${policyName}`, `CREATE POLICY ${policyName}`),
      }
      operations.push({ index: createMatch.index, apply: () => policies.set(definition.key, definition) })
    }

    operations.sort((left, right) => left.index - right.index).forEach((operation) => operation.apply())
  }
  return policies
}

function resolveActiveTableGrants(
  sources: SupabaseSecurityMigrationSource[],
): Map<string, Set<TablePrivilege>> {
  const grants = new Map<string, Set<TablePrivilege>>()
  const pattern = /(grant|revoke)\s+([a-z,\s]+?)\s+on\s+(?:table\s+)?(public|storage)\.([a-z_][a-z0-9_]*)\s+(to|from)\s+([a-z_,\s]+?)\s*;/gi
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source.sql)) !== null) {
      const action = match[1].toLowerCase()
      const privileges = parseTablePrivileges(match[2])
      const schema = match[3].toLowerCase()
      const tableName = match[4].toLowerCase()
      const roles = parseRoles(match[6])
      for (const role of roles) {
        const key = grantKey(schema, tableName, role)
        const current = grants.get(key) ?? new Set<TablePrivilege>()
        if (action === 'grant') {
          for (const privilege of privileges) current.add(privilege)
        } else if (privileges.length === ALL_TABLE_PRIVILEGES.length) {
          current.clear()
        } else {
          for (const privilege of privileges) current.delete(privilege)
        }
        grants.set(key, current)
      }
    }
  }
  return grants
}

function resolveViews(sources: SupabaseSecurityMigrationSource[]): ViewDefinition[] {
  const views = new Map<string, ViewDefinition>()
  const pattern = /create\s+(?:or\s+replace\s+)?view\s+public\.([a-z_][a-z0-9_]*)\s*(?:with\s*\(([^)]*)\))?\s+as\b/gi
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source.sql)) !== null) {
      const viewName = match[1].toLowerCase()
      views.set(viewName, {
        viewName,
        securityInvoker: /security_invoker\s*=\s*true/i.test(match[2] ?? ''),
        evidence: evidence(source, match.index, viewName, `CREATE VIEW public.${viewName}`),
      })
    }
  }
  return [...views.values()].sort((left, right) => left.viewName.localeCompare(right.viewName))
}

function resolveFunctions(sources: SupabaseSecurityMigrationSource[]): FunctionDefinition[] {
  const functions = new Map<string, FunctionDefinition>()
  const pattern = /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z_][a-z0-9_]*)\s*\(/gi
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source.sql)) !== null) {
      const openParenIndex = pattern.lastIndex - 1
      const closeParenIndex = findMatchingParen(source.sql, openParenIndex)
      if (closeParenIndex < 0) continue
      const bodyStartMatch = /\bas\s+(\$[a-z0-9_]*\$)/i.exec(source.sql.slice(closeParenIndex + 1))
      let definitionEnd = source.sql.indexOf(';', closeParenIndex)
      if (bodyStartMatch) {
        const headerOffset = closeParenIndex + 1
        const openingTagIndex = headerOffset + bodyStartMatch.index + bodyStartMatch[0].lastIndexOf(bodyStartMatch[1])
        const closingTagIndex = source.sql.indexOf(bodyStartMatch[1], openingTagIndex + bodyStartMatch[1].length)
        if (closingTagIndex >= 0) {
          definitionEnd = source.sql.indexOf(';', closingTagIndex + bodyStartMatch[1].length)
        }
      }
      if (definitionEnd < 0) definitionEnd = source.sql.length
      const definitionSql = source.sql.slice(match.index, definitionEnd + 1)
      const functionName = match[1].toLowerCase()
      const argumentSignature = source.sql.slice(openParenIndex + 1, closeParenIndex)
        .replace(/\s+/g, ' ')
        .trim()
      const key = `${functionName}(${argumentSignature})`
      functions.set(key, {
        key,
        functionName,
        securityDefiner: /\bsecurity\s+definer\b/i.test(definitionSql),
        searchPath: definitionSql.match(/\bset\s+search_path\s*=\s*([^\n;]+)/i)?.[1]?.trim() ?? null,
        evidence: evidence(source, match.index, functionName, `CREATE FUNCTION public.${functionName}`),
      })
      pattern.lastIndex = definitionEnd + 1
    }
  }
  return [...functions.values()]
}

function resolveFunctionPublicExecuteRevokes(sources: SupabaseSecurityMigrationSource[]): Set<string> {
  const revoked = new Set<string>()
  const pattern = /revoke\s+(?:all(?:\s+privileges)?|execute)\s+on\s+function\s+public\.([a-z_][a-z0-9_]*)\s*\([^;]*\)\s+from\s+([^;]+);/gi
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source.sql)) !== null) {
      const roles = parseRoles(match[2])
      if (roles.includes('public')) revoked.add(match[1].toLowerCase())
    }
  }
  return revoked
}

function findAuthenticatedWriteExposure(
  tableByName: Map<string, TableDefinition>,
  explicitRlsTables: Set<string>,
  activePolicies: Map<string, PolicyDefinition>,
  activeGrants: Map<string, Set<TablePrivilege>>,
): Array<{ tableName: string; evidence: SupabaseSecurityEvidence[] }> {
  const exposure: Array<{ tableName: string; evidence: SupabaseSecurityEvidence[] }> = []
  for (const tableName of tableByName.keys()) {
    const grantPrivileges = activeGrants.get(grantKey('public', tableName, 'authenticated')) ?? new Set<TablePrivilege>()
    const grantedWrites = [...grantPrivileges].filter((privilege) => WRITE_PRIVILEGES.has(privilege))
    if (grantedWrites.length === 0) continue
    const writePolicies = [...activePolicies.values()].filter((policy) => (
      policy.schema === 'public'
      && policy.tableName === tableName
      && policyAllowsRole(policy, 'authenticated')
      && (policy.command === 'all' || WRITE_PRIVILEGES.has(policy.command))
    ))
    if (explicitRlsTables.has(tableName) && writePolicies.length === 0) continue
    exposure.push({
      tableName,
      evidence: [requiredTable(tableByName, tableName).evidence, ...writePolicies.map((policy) => policy.evidence)],
    })
  }
  return exposure.sort((left, right) => left.tableName.localeCompare(right.tableName))
}

function addSensitiveReadFinding(options: {
  findings: SupabaseSecurityFinding[]
  findingId: string
  severity: SupabaseSecuritySeverity
  tableName: string
  sensitiveColumns: string[]
  title: string
  explanation: string
  remediation: string
  tableByName: Map<string, TableDefinition>
  explicitRlsTables: Set<string>
  activePolicies: Map<string, PolicyDefinition>
  activeGrants: Map<string, Set<TablePrivilege>>
}): void {
  const table = options.tableByName.get(options.tableName)
  if (!table || !options.sensitiveColumns.some((column) => table.columns.includes(column))) return
  const grants = options.activeGrants.get(grantKey('public', options.tableName, 'authenticated'))
  if (!grants?.has('select')) return
  const readPolicies = [...options.activePolicies.values()].filter((policy) => (
    policy.schema === 'public'
    && policy.tableName === options.tableName
    && policyAllowsRole(policy, 'authenticated')
    && (policy.command === 'select' || policy.command === 'all')
  ))
  if (options.explicitRlsTables.has(options.tableName) && readPolicies.length === 0) return
  options.findings.push({
    id: options.findingId,
    severity: options.severity,
    category: 'worker_boundary',
    title: options.title,
    explanation: options.explanation,
    subjects: [options.tableName, ...options.sensitiveColumns],
    evidence: [table.evidence, ...readPolicies.map((policy) => policy.evidence)],
    remediation: options.remediation,
  })
}

function isServiceControlledTable(tableName: string): boolean {
  return /^(?:jobs?|job_|edit_agent_|agent_work_|worker_|backend_runtime_|generation_|generated_|provider_|renders?$|render_|preview_|final_exports$|export_|qa_|sfx_)/.test(tableName)
}

function storagePolicyBindsWorkspaceToProject(body: string): boolean {
  const normalized = body.replace(/\s+/g, ' ').toLowerCase()
  const readsWorkspaceSegment = /foldername\s*\(\s*name\s*\)\)\s*\[\s*2\s*\]/i.test(body)
  const comparesProjectWorkspace = /workspace_id/.test(normalized) && /projects?/.test(normalized)
  const callsBindingHelper = /is_project_(?:member|editor)_in_workspace|project_belongs_to_workspace/.test(normalized)
  return readsWorkspaceSegment && (comparesProjectWorkspace || callsBindingHelper)
}

function findUnconstrainedPrivateBucketEvidence(
  sources: SupabaseSecurityMigrationSource[],
): SupabaseSecurityEvidence[] {
  const bucketState = new Map<string, {
    fileSizeLimit: string
    allowedMimeTypes: string
    evidence: SupabaseSecurityEvidence
  }>()
  for (const source of sources) {
    const pattern = /insert\s+into\s+storage\.buckets\s*\(([^)]*)\)\s*values\s*([\s\S]*?)(?=on\s+conflict|;)/gi
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source.sql)) !== null) {
      const columns = match[1].split(',').map((column) => normalizeIdentifier(column.trim()).toLowerCase())
      const idIndex = columns.indexOf('id')
      const sizeIndex = columns.indexOf('file_size_limit')
      const mimeIndex = columns.indexOf('allowed_mime_types')
      if (idIndex < 0 || sizeIndex < 0 || mimeIndex < 0) continue
      const rows = splitTopLevel(match[2]).map((row) => row.trim()).filter((row) => row.startsWith('('))
      for (const row of rows) {
        const closingParen = row.lastIndexOf(')')
        if (closingParen < 0) continue
        const values = splitTopLevel(row.slice(1, closingParen)).map((value) => value.trim())
        const bucketId = values[idIndex]?.match(/^'([^']+)'$/)?.[1]
        if (!bucketId || !values[sizeIndex] || !values[mimeIndex]) continue
        bucketState.set(bucketId, {
          fileSizeLimit: values[sizeIndex],
          allowedMimeTypes: values[mimeIndex],
          evidence: evidence(source, match.index, bucketId, 'Latest storage bucket constraint declaration'),
        })
      }
    }
  }
  return [...bucketState.entries()]
    .filter(([, state]) => /^null$/i.test(state.fileSizeLimit) || /^null$/i.test(state.allowedMimeTypes))
    .map(([bucketId, state]) => ({
      ...state.evidence,
      subject: bucketId,
      detail: `Latest bucket declaration has file_size_limit=${state.fileSizeLimit} and allowed_mime_types=${state.allowedMimeTypes}`,
    }))
}

function hasCompositeProjectWorkspaceBinding(
  definition: TableDefinition,
  sources: SupabaseSecurityMigrationSource[],
): boolean {
  const localBody = definition.body.replace(/\s+/g, ' ').toLowerCase()
  if (containsCompositeBinding(localBody)) return true
  const tablePattern = new RegExp(
    `alter\\s+table\\s+(?:if\\s+exists\\s+)?public\\.${definition.tableName}([\\s\\S]{0,1400}?);`,
    'gi',
  )
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = tablePattern.exec(source.sql)) !== null) {
      if (containsCompositeBinding(match[1].replace(/\s+/g, ' ').toLowerCase())) return true
    }
  }
  return false
}

function containsCompositeBinding(value: string): boolean {
  return (
    /foreign key\s*\(\s*project_id\s*,\s*workspace_id\s*\)\s*references\s+public\.projects\s*\(\s*id\s*,\s*workspace_id\s*\)/.test(value)
    || /foreign key\s*\(\s*workspace_id\s*,\s*project_id\s*\)\s*references\s+public\.projects\s*\(\s*workspace_id\s*,\s*id\s*\)/.test(value)
  )
}

function findMatchingParen(sql: string, openParenIndex: number): number {
  let depth = 0
  let singleQuoted = false
  let doubleQuoted = false
  for (let index = openParenIndex; index < sql.length; index += 1) {
    const character = sql[index]
    const nextCharacter = sql[index + 1]
    if (singleQuoted) {
      if (character === "'" && nextCharacter === "'") index += 1
      else if (character === "'") singleQuoted = false
      continue
    }
    if (doubleQuoted) {
      if (character === '"' && nextCharacter === '"') index += 1
      else if (character === '"') doubleQuoted = false
      continue
    }
    if (character === "'") singleQuoted = true
    else if (character === '"') doubleQuoted = true
    else if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function extractColumnNames(body: string): string[] {
  const ignored = new Set(['check', 'constraint', 'exclude', 'foreign', 'like', 'primary', 'unique'])
  const names = splitTopLevel(body)
    .map((segment) => segment.replace(/--.*$/gm, '').trim())
    .map((segment) => segment.match(/^"?([a-z_][a-z0-9_]*)"?\s+/i)?.[1]?.toLowerCase())
    .filter((column): column is string => typeof column === 'string')
    .filter((column) => !ignored.has(column))
  return [...new Set(names)]
}

function splitTopLevel(value: string): string[] {
  const segments: string[] = []
  let start = 0
  let depth = 0
  let bracketDepth = 0
  let singleQuoted = false
  let doubleQuoted = false
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    const nextCharacter = value[index + 1]
    if (singleQuoted) {
      if (character === "'" && nextCharacter === "'") index += 1
      else if (character === "'") singleQuoted = false
      continue
    }
    if (doubleQuoted) {
      if (character === '"' && nextCharacter === '"') index += 1
      else if (character === '"') doubleQuoted = false
      continue
    }
    if (character === "'") singleQuoted = true
    else if (character === '"') doubleQuoted = true
    else if (character === '(') depth += 1
    else if (character === ')') depth -= 1
    else if (character === '[') bracketDepth += 1
    else if (character === ']') bracketDepth -= 1
    else if (character === ',' && depth === 0 && bracketDepth === 0) {
      segments.push(value.slice(start, index))
      start = index + 1
    }
  }
  segments.push(value.slice(start))
  return segments
}

function parsePolicyRoles(body: string): string[] {
  const roleMatch = body.match(/\bto\s+([a-z_,\s"]+?)(?=\busing\b|\bwith\s+check\b|$)/i)
  return roleMatch ? parseRoles(roleMatch[1]) : ['public']
}

function parseRoles(value: string): string[] {
  return value
    .split(',')
    .map((role) => normalizeIdentifier(role.trim()).toLowerCase())
    .filter(Boolean)
}

function parseTablePrivileges(value: string): TablePrivilege[] {
  if (/\ball(?:\s+privileges)?\b/i.test(value)) return [...ALL_TABLE_PRIVILEGES]
  return value
    .split(',')
    .map((privilege) => privilege.trim().toLowerCase())
    .filter((privilege): privilege is TablePrivilege => ALL_TABLE_PRIVILEGES.includes(privilege as TablePrivilege))
}

function policyAllowsRole(policy: PolicyDefinition, role: string): boolean {
  return policy.roles.includes(role) || policy.roles.includes('public')
}

function isSafeSearchPath(searchPath: string | null): boolean {
  if (!searchPath) return false
  const normalized = searchPath.replace(/\s+/g, '').replace(/"/g, '').toLowerCase()
  if (normalized.includes('public')) return false
  return normalized === "''" || normalized === 'pg_catalog' || normalized === 'pg_catalog,pg_temp'
}

function grantEvidenceForSubjects(
  sources: SupabaseSecurityMigrationSource[],
  subjects: string[],
  roles: string[],
): SupabaseSecurityEvidence[] {
  const evidenceRows: SupabaseSecurityEvidence[] = []
  for (const source of sources) {
    for (const subject of subjects) {
      const [schema, tableName] = subject.split('.')
      const pattern = new RegExp(
        `grant\\s+[^;]+\\s+on\\s+(?:table\\s+)?${schema}\\.${tableName}\\s+to\\s+[^;]*(?:${roles.join('|')})[^;]*;`,
        'gi',
      )
      const match = pattern.exec(source.sql)
      if (match) evidenceRows.push(evidence(source, match.index, subject, match[0].replace(/\s+/g, ' ').trim()))
    }
  }
  return evidenceRows
}

function evidence(
  source: SupabaseSecurityMigrationSource,
  index: number,
  subject: string,
  detail: string,
): SupabaseSecurityEvidence {
  return {
    filePath: source.filePath,
    line: source.sql.slice(0, index).split('\n').length,
    subject,
    detail,
  }
}

function requiredTable(tables: Map<string, TableDefinition>, tableName: string): TableDefinition {
  const table = tables.get(tableName)
  if (!table) throw new Error(`Missing parsed table definition for ${tableName}.`)
  return table
}

function normalizeIdentifier(value: string): string {
  return value.replace(/^"|"$/g, '')
}

function policyKey(schema: string, tableName: string, policyName: string): string {
  return `${schema}:${tableName}:${policyName}`
}

function grantKey(schema: string, tableName: string, role: string): string {
  return `${schema}:${tableName}:${role}`
}

function severityRank(severity: SupabaseSecuritySeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity]
}
