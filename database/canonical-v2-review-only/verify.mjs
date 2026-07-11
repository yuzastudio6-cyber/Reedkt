import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const reviewRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(reviewRoot, '..', '..')
const reviewRelativePath = relative(repositoryRoot, reviewRoot)
const identitySqlPath = resolve(reviewRoot, '001_identity_tenancy.canonical-v2.draft.sql')
const currentProductSqlPath = resolve(reviewRoot, '002_current_product_records.canonical-v2.draft.sql')
const approvalCreditSqlPath = resolve(reviewRoot, '003_approval_credit_execution_authority.canonical-v2.draft.sql')
const workerLeaseSqlPath = resolve(reviewRoot, '004_jobs_worker_leases.canonical-v2.draft.sql')
const manifestPath = resolve(reviewRoot, 'manifest.json')

assert.equal(
  reviewRelativePath,
  'database/canonical-v2-review-only',
  'canonical v2 review files must stay outside active Supabase migration history',
)

const [identitySql, currentProductSql, approvalCreditSql, workerLeaseSql, manifestSource] = await Promise.all([
  readFile(identitySqlPath, 'utf8'),
  readFile(currentProductSqlPath, 'utf8'),
  readFile(approvalCreditSqlPath, 'utf8'),
  readFile(workerLeaseSqlPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
])
const manifest = JSON.parse(manifestSource)

assert.equal(manifest.status, 'security_review_rejected_not_executable')
assert.equal(manifest.securityReview?.promotionAllowed, false)
assert.deepEqual(manifest.securityReview?.rejectedDraftSequences, [3, 4])
assert.equal(manifest.activeMigrationHistory, false)
assert.equal(manifest.supabaseCliMigrationPath, false)
assert.equal(manifest.sourceBaselineStatus, 'blocked_by_parallel_foundations')
assert.deepEqual(manifest.orderedDrafts[0].tables, ['profiles', 'workspaces', 'workspace_members'])
assert.deepEqual(
  manifest.orderedDrafts[1].tables,
  ['projects', 'edit_sessions', 'edit_preferences', 'api_idempotency_keys', 'audit_events'],
)
assert.deepEqual(
  manifest.orderedDrafts[2].tables,
  ['approved_plan_snapshots', 'credit_reservations', 'credit_reservation_events'],
)
assert.deepEqual(
  manifest.orderedDrafts[3].tables,
  ['worker_service_identities', 'jobs', 'worker_leases'],
)

const identityTables = [...identitySql.matchAll(/create table public\.([a-z0-9_]+)\s*\(/g)].map((match) => match[1])
assert.deepEqual(
  identityTables,
  ['profiles', 'workspaces', 'workspace_members'],
  'draft 001 must not create later-domain tables',
)

const currentProductTables = [...currentProductSql.matchAll(/create table public\.([a-z0-9_]+)\s*\(/g)]
  .map((match) => match[1])
assert.deepEqual(
  currentProductTables,
  ['projects', 'edit_sessions', 'edit_preferences', 'api_idempotency_keys', 'audit_events'],
  'draft 002 must create only current product persistence tables',
)

const approvalCreditTables = [...approvalCreditSql.matchAll(/create table public\.([a-z0-9_]+)\s*\(/g)]
  .map((match) => match[1])
assert.deepEqual(
  approvalCreditTables,
  ['approved_plan_snapshots', 'credit_reservations', 'credit_reservation_events'],
  'draft 003 must create only approval and credit execution-authority tables',
)

const workerLeaseTables = [...workerLeaseSql.matchAll(/create table public\.([a-z0-9_]+)\s*\(/g)]
  .map((match) => match[1])
assert.deepEqual(
  workerLeaseTables,
  ['worker_service_identities', 'jobs', 'worker_leases'],
  'draft 004 must create only service-identity, job, and worker-lease tables',
)

for (const table of identityTables) {
  assert.match(identitySql, new RegExp(`alter table public\\.${table} enable row level security;`))
  assert.match(identitySql, new RegExp(`alter table public\\.${table} force row level security;`))
  assert.match(identitySql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role;`))
}

for (const table of currentProductTables) {
  assert.match(currentProductSql, new RegExp(`alter table public\\.${table} enable row level security;`))
  assert.match(currentProductSql, new RegExp(`alter table public\\.${table} force row level security;`))
  assert.match(
    currentProductSql,
    new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role;`),
  )
}

for (const [sql, tables] of [
  [approvalCreditSql, approvalCreditTables],
  [workerLeaseSql, workerLeaseTables],
]) {
  for (const table of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`))
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security;`))
    assert.match(
      sql,
      new RegExp(`revoke all on table public\\.${table}[\\s\\S]*?from public, anon, authenticated, service_role;`),
    )
  }
}

for (const helper of ['is_workspace_owner', 'is_workspace_member']) {
  assert.match(
    identitySql,
    new RegExp(`create function public\\.${helper}\\(workspace_uuid uuid\\)[\\s\\S]*?security definer[\\s\\S]*?set search_path = ''`),
  )
  assert.match(
    identitySql,
    new RegExp(`revoke all on function public\\.${helper}\\(uuid\\) from public, anon, authenticated, service_role;`),
  )
  assert.match(identitySql, new RegExp(`grant execute on function public\\.${helper}\\(uuid\\) to authenticated, service_role;`))
}

assert.match(
  identitySql,
  /create function public\.enforce_owner_private_membership\(\)[\s\S]*?security definer[\s\S]*?set search_path = ''/,
)
assert.match(
  identitySql,
  /revoke all on function public\.enforce_owner_private_membership\(\) from public, anon, authenticated, service_role;/,
)

assert.match(identitySql, /revoke create on schema public from public;/)
assert.match(identitySql, /workspace_members_workspace_user_unique unique \(workspace_id, user_id\)/)
assert.match(identitySql, /workspace_members_one_member_per_workspace_unique unique \(workspace_id\)/)
assert.match(identitySql, /workspace_members_owner_only_role_check check \(role = 'owner'\)/)
assert.match(identitySql, /workspaces_access_mode_check[\s\S]*?check \(access_mode = 'owner_private'\)/)
assert.match(identitySql, /create trigger workspace_members_enforce_owner_private/)
assert.match(identitySql, /create policy workspaces_insert_owner_bootstrap[\s\S]*?owner_id = auth\.uid\(\)[\s\S]*?plan_type = 'free'/)
assert.match(identitySql, /create policy workspace_members_insert_owner_bootstrap[\s\S]*?user_id = auth\.uid\(\)[\s\S]*?role = 'owner'/)

assert.match(
  currentProductSql,
  /constraint projects_workspace_owner_fkey[\s\S]*?foreign key \(workspace_id, owner_id\)[\s\S]*?references public\.workspaces\(id, owner_id\)/,
)
assert.match(
  currentProductSql,
  /constraint edit_sessions_project_scope_fkey[\s\S]*?foreign key \(project_id, workspace_id, owner_id\)[\s\S]*?references public\.projects\(id, workspace_id, owner_id\)/,
)
assert.match(currentProductSql, /create table public\.edit_sessions \([\s\S]*?id text primary key/)
assert.match(currentProductSql, /constraint edit_sessions_id_check[\s\S]*?char_length\(id\) between 1 and 160/)
assert.match(
  currentProductSql,
  /constraint edit_preferences_workspace_user_fkey[\s\S]*?foreign key \(workspace_id, user_id\)[\s\S]*?references public\.workspace_members\(workspace_id, user_id\)/,
)
assert.match(
  currentProductSql,
  /constraint api_idempotency_keys_workspace_user_fkey[\s\S]*?foreign key \(workspace_id, user_id\)[\s\S]*?references public\.workspace_members\(workspace_id, user_id\)/,
)
assert.match(
  currentProductSql,
  /constraint audit_events_project_scope_fkey[\s\S]*?foreign key \(project_id, workspace_id\)[\s\S]*?references public\.projects\(id, workspace_id\)/,
)
assert.match(
  currentProductSql,
  /constraint audit_events_edit_scope_fkey[\s\S]*?foreign key \(edit_session_id, project_id, workspace_id\)[\s\S]*?references public\.edit_sessions\(id, project_id, workspace_id\)/,
)
assert.match(
  currentProductSql,
  /constraint audit_events_actor_workspace_fkey[\s\S]*?foreign key \(workspace_id, actor_user_id\)[\s\S]*?references public\.workspace_members\(workspace_id, user_id\)/,
)

assert.match(
  currentProductSql,
  /create function public\.is_project_owner\(project_uuid uuid, workspace_uuid uuid\)[\s\S]*?security definer[\s\S]*?set search_path = ''/,
)
assert.match(
  currentProductSql,
  /revoke all on function public\.is_project_owner\(uuid, uuid\) from public, anon, authenticated, service_role;/,
)
assert.match(
  currentProductSql,
  /create function public\.upsert_edit_preferences_cas\([\s\S]*?security definer[\s\S]*?set search_path = ''/,
)
assert.match(currentProductSql, /pg_catalog\.pg_advisory_xact_lock/)
assert.match(currentProductSql, /from public\.api_idempotency_keys[\s\S]*?for update;/)
assert.match(currentProductSql, /target_expected_snapshot_id <> existing_preference\.snapshot_id/)
assert.match(currentProductSql, /target_next_snapshot_id = existing_preference\.snapshot_id/)
assert.match(currentProductSql, /insert into public\.audit_events/)
assert.match(
  currentProductSql,
  /grant execute on function public\.upsert_edit_preferences_cas\(uuid, uuid, text, text, jsonb, text, text, text\)[\s\S]*?to service_role;/,
)
assert.doesNotMatch(
  currentProductSql,
  /grant execute on function public\.upsert_edit_preferences_cas\([^;]+to authenticated;/,
)
assert.match(currentProductSql, /create trigger audit_events_prevent_update/)
assert.match(currentProductSql, /create trigger audit_events_prevent_delete/)
assert.match(
  currentProductSql,
  /create policy projects_select_owner[\s\S]*?owner_id = auth\.uid\(\)[\s\S]*?public\.is_project_owner\(id, workspace_id\)/,
)
assert.match(
  currentProductSql,
  /create policy edit_sessions_select_owner[\s\S]*?owner_id = auth\.uid\(\)[\s\S]*?public\.is_project_owner\(project_id, workspace_id\)/,
)
assert.match(
  currentProductSql,
  /create policy edit_preferences_select_owner[\s\S]*?user_id = auth\.uid\(\)[\s\S]*?public\.is_workspace_owner\(workspace_id\)/,
)
assert.match(
  currentProductSql,
  /create policy audit_events_select_owner[\s\S]*?public\.is_workspace_owner\(workspace_id\)[\s\S]*?public\.is_project_owner\(project_id, workspace_id\)/,
)

assert.match(
  approvalCreditSql,
  /constraint approved_plan_snapshots_edit_scope_fkey[\s\S]*?foreign key \(edit_session_id, project_id, workspace_id, owner_id\)[\s\S]*?references public\.edit_sessions\(id, project_id, workspace_id, owner_id\)/,
)
assert.match(
  approvalCreditSql,
  /constraint credit_reservations_snapshot_scope_fkey[\s\S]*?references public\.approved_plan_snapshots/,
)
assert.match(
  approvalCreditSql,
  /constraint credit_reservation_events_reservation_scope_fkey[\s\S]*?references public\.credit_reservations/,
)
assert.match(approvalCreditSql, /constraint approved_plan_snapshots_state_check[\s\S]*?approval_state = 'approved'/)
assert.match(approvalCreditSql, /constraint credit_reservations_one_per_snapshot_unique[\s\S]*?unique \(approved_plan_snapshot_id\)/)
for (const trigger of [
  'approved_plan_snapshots_prevent_update',
  'approved_plan_snapshots_prevent_delete',
  'credit_reservations_prevent_update',
  'credit_reservations_prevent_delete',
  'credit_reservation_events_prevent_update',
  'credit_reservation_events_prevent_delete',
]) {
  assert.match(approvalCreditSql, new RegExp(`create trigger ${trigger}`))
}
assert.match(
  approvalCreditSql,
  /create function public\.create_approved_execution_authority\([\s\S]*?security definer[\s\S]*?set search_path = ''/,
)
assert.match(approvalCreditSql, /from public\.edit_sessions as edit[\s\S]*?edit\.owner_id = target_approved_by_user_id/)
assert.match(approvalCreditSql, /from public\.api_idempotency_keys as key_record[\s\S]*?for update;/)
assert.match(approvalCreditSql, /existing_key\.request_hash <> target_request_hash/)
assert.match(approvalCreditSql, /insert into public\.approved_plan_snapshots/)
assert.match(approvalCreditSql, /insert into public\.credit_reservations/)
assert.match(approvalCreditSql, /insert into public\.credit_reservation_events[\s\S]*?'reserved'/)
assert.match(approvalCreditSql, /insert into public\.audit_events/)
assert.match(
  approvalCreditSql,
  /grant execute on function public\.create_approved_execution_authority\([\s\S]*?\) to service_role;/,
)
assert.doesNotMatch(approvalCreditSql, /grant\s+(select|insert|update|delete)[^;]*to authenticated/i)
assert.doesNotMatch(approvalCreditSql, /create policy[^;]*to authenticated/i)

assert.match(workerLeaseSql, /create extension if not exists pgcrypto with schema extensions;/)
assert.match(workerLeaseSql, /constraint jobs_snapshot_scope_fkey[\s\S]*?references public\.approved_plan_snapshots/)
assert.match(workerLeaseSql, /constraint jobs_reservation_scope_fkey[\s\S]*?references public\.credit_reservations/)
assert.match(workerLeaseSql, /constraint worker_leases_job_scope_fkey[\s\S]*?references public\.jobs/)

const createJobSignature = workerLeaseSql.match(
  /create function public\.create_execution_job\(([\s\S]*?)\)\nreturns public\.jobs/,
)?.[1]
assert(createJobSignature, 'draft 004 must define create_execution_job')
assert.doesNotMatch(createJobSignature, /target_(workspace|project|edit_session|credit_reservation|owner)_id/)
assert.match(workerLeaseSql, /from public\.approved_plan_snapshots as snapshot/)
assert.match(workerLeaseSql, /from public\.credit_reservations as reservation/)
assert.match(workerLeaseSql, /insert into public\.jobs[\s\S]*?snapshot_record\.workspace_id/)
assert.match(workerLeaseSql, /existing_key\.request_hash <> target_request_hash/)

const claimSignature = workerLeaseSql.match(
  /create function public\.claim_worker_job_lease\(([\s\S]*?)\)\nreturns table/,
)?.[1]
assert(claimSignature, 'draft 004 must define claim_worker_job_lease')
assert.match(claimSignature, /target_job_id uuid/)
assert.match(claimSignature, /target_worker_service_identity text/)
assert.match(claimSignature, /target_idempotency_key text/)
assert.match(claimSignature, /target_request_hash text/)
assert.doesNotMatch(claimSignature, /target_(workspace|project|approved_plan_snapshot|credit_reservation|lease_expires)_id/)

// Static concurrency proof points: the job row serializes claim attempts and
// the partial unique index is the database backstop for one active winner.
assert.match(
  workerLeaseSql,
  /from public\.jobs as job[\s\S]*?where job\.id = target_job_id[\s\S]*?for update;/,
)
assert.match(
  workerLeaseSql,
  /create unique index worker_leases_one_active_per_job_uidx[\s\S]*?on public\.worker_leases\(job_id\)[\s\S]*?where lease_status = 'active';/,
)

// Duplicate claim requests cannot reveal the token again. Same-key/different-
// hash requests conflict; same-key/same-hash requests fail closed because only
// the first successful response ever contains the raw token.
assert.match(workerLeaseSql, /worker_leases_identity_idempotency_unique[\s\S]*?unique \(worker_service_identity, idempotency_key\)/)
assert.match(workerLeaseSql, /existing_claim\.request_hash <> target_request_hash/)
assert.match(workerLeaseSql, /plaintext lease tokens are one-time and cannot be replayed/)

const workerLeasesTableBlock = workerLeaseSql.match(
  /create table public\.worker_leases \(([\s\S]*?)\n\);/,
)?.[1]
assert(workerLeasesTableBlock, 'draft 004 must define worker_leases table body')
assert.match(workerLeasesTableBlock, /lease_token_hash text not null/)
assert.doesNotMatch(workerLeasesTableBlock, /(^|\n)\s*lease_token\s+text/i)
assert.match(workerLeaseSql, /extensions\.gen_random_bytes\(32\)/)
assert.match(workerLeaseSql, /extensions\.digest\(pg_catalog\.convert_to\(raw_lease_token, 'UTF8'\), 'sha256'\)/)
assert.match(workerLeaseSql, /insert into public\.worker_leases \([\s\S]*?lease_token_hash[\s\S]*?raw_lease_token_hash/)

const heartbeatSignature = workerLeaseSql.match(
  /create function public\.heartbeat_worker_job_lease\(([\s\S]*?)\)\nreturns table/,
)?.[1]
const releaseSignature = workerLeaseSql.match(
  /create function public\.release_worker_job_lease\(([\s\S]*?)\)\nreturns table/,
)?.[1]
assert(heartbeatSignature, 'draft 004 must define heartbeat_worker_job_lease')
assert(releaseSignature, 'draft 004 must define release_worker_job_lease')
for (const signature of [heartbeatSignature, releaseSignature]) {
  assert.match(signature, /target_claim_id uuid/)
  assert.match(signature, /target_job_id uuid/)
  assert.match(signature, /target_worker_service_identity text/)
  assert.match(signature, /target_lease_token text/)
  assert.doesNotMatch(signature, /target_(workspace|project|approved_plan_snapshot|credit_reservation)_id/)
}

const heartbeatBody = workerLeaseSql.match(
  /create function public\.heartbeat_worker_job_lease\([\s\S]*?as \$\$([\s\S]*?)\nend;\n\$\$;/,
)?.[1]
const releaseBody = workerLeaseSql.match(
  /create function public\.release_worker_job_lease\([\s\S]*?as \$\$([\s\S]*?)\nend;\n\$\$;/,
)?.[1]
assert(heartbeatBody, 'heartbeat function body must be statically inspectable')
assert(releaseBody, 'release function body must be statically inspectable')
for (const body of [heartbeatBody, releaseBody]) {
  assert.match(body, /lease\.id = target_claim_id/)
  assert.match(body, /lease\.job_id = target_job_id/)
  assert.match(body, /lease\.worker_service_identity = target_worker_service_identity/)
  assert.match(body, /presented_token_hash <> lease_record\.lease_token_hash/)
  assert.match(body, /lease_record\.lease_status <> 'active'/)
  assert.match(body, /lease_record\.lease_expires_at <= pg_catalog\.now\(\)/)
  assert.match(body, /lease_record\.workspace_id <> job_record\.workspace_id/)
  assert.match(body, /lease_record\.project_id <> job_record\.project_id/)
  assert.match(body, /lease_record\.approved_plan_snapshot_id <> job_record\.approved_plan_snapshot_id/)
  assert.match(body, /lease_record\.credit_reservation_id <> job_record\.credit_reservation_id/)
}
assert.match(heartbeatBody, /event\.event_type in \('spent', 'released', 'refunded', 'cancelled', 'expired'\)/)
assert.match(releaseBody, /identity\.identity_status = 'active'/)

for (const functionName of [
  'create_execution_job',
  'claim_worker_job_lease',
  'heartbeat_worker_job_lease',
  'release_worker_job_lease',
]) {
  assert.match(
    workerLeaseSql,
    new RegExp(`create function public\\.${functionName}\\([\\s\\S]*?security definer[\\s\\S]*?set search_path = ''`),
  )
}
assert.doesNotMatch(workerLeaseSql, /grant\s+(select|insert|update|delete)[^;]*to authenticated/i)
assert.doesNotMatch(workerLeaseSql, /create policy[^;]*to authenticated/i)
assert.match(workerLeaseSql, /grant execute on function public\.claim_worker_job_lease\([^;]+to service_role;/)
assert.match(workerLeaseSql, /grant execute on function public\.heartbeat_worker_job_lease\([^;]+to service_role;/)
assert.match(workerLeaseSql, /grant execute on function public\.release_worker_job_lease\([^;]+to service_role;/)

for (const sql of [identitySql, currentProductSql, approvalCreditSql, workerLeaseSql]) {
  assert.doesNotMatch(sql, /grant\s+all[^;]*to authenticated/i)
  assert.doesNotMatch(sql, /grant\s+delete[^;]*to authenticated/i)
  assert.doesNotMatch(sql, /create policy[^;]*for all[^;]*to authenticated/i)
  assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i)
}
assert.doesNotMatch(identitySql, /grant\s+update[^;]*workspace_members[^;]*to authenticated/i)
assert.doesNotMatch(currentProductSql, /grant\s+(insert|update|delete)[^;]*to authenticated/i)
assert.doesNotMatch(currentProductSql, /create policy[^;]*for\s+(insert|update|delete|all)[^;]*to authenticated/i)
assert.match(currentProductSql, /grant select on table public\.edit_preferences to service_role;/)
assert.doesNotMatch(
  currentProductSql,
  /grant\s+(insert|update|delete)[^;]*public\.edit_preferences[^;]*to service_role/i,
)
assert.doesNotMatch(
  currentProductSql,
  /grant\s+select[^;]*public\.api_idempotency_keys[^;]*to authenticated/i,
)
assert.match(currentProductSql, /grant select, insert, update on table public\.projects to service_role;/)
assert.match(currentProductSql, /grant select, insert, update on table public\.edit_sessions to service_role;/)
assert.match(currentProductSql, /grant select, insert on table public\.audit_events to service_role;/)

console.log(JSON.stringify({
  ok: false,
  status: manifest.status,
  promotionAllowed: manifest.securityReview.promotionAllowed,
  securityReviewReport: manifest.securityReview.report,
  rejectedDraftSequences: manifest.securityReview.rejectedDraftSequences,
  knownPromotionBlockers: [
    'canonical_plan_estimate_approval_derivation_missing',
    'funded_credit_ledger_conservation_missing',
    'immutable_approved_work_item_derivation_missing',
    'reservation_worker_lifecycle_serialization_missing',
    'lost_response_claim_release_replay_missing',
  ],
  path: reviewRelativePath,
  drafts: manifest.orderedDrafts.length,
  tables: [...identityTables, ...currentProductTables, ...approvalCreditTables, ...workerLeaseTables],
  rls: 'enabled_and_forced',
  projectScopeBinding: 'composite_foreign_keys',
  mutations: 'service_only_after_identity_bootstrap',
  approvedExecutionAuthority: 'immutable_snapshot_and_expiring_reservation',
  workerLease: 'tenant_derived_one_time_hashed_token',
  scope: manifest.currentProductScope,
}, null, 2))
