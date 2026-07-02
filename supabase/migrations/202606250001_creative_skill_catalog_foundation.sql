-- RP-SKILLS-27 Creative Skill catalog foundation.
-- Local/review-ready migration only. Do not run against production until local
-- and staging validation, RLS review, backups, rollback, and explicit owner
-- approval are complete.
--
-- This migration stores catalog metadata only. It does not seed rows, connect
-- to Supabase, call providers, execute workers, reserve credits, create jobs,
-- render media, store secrets, or alter signature-system ownership.

create table if not exists public.creative_skill_families (
  id uuid primary key default gen_random_uuid(),
  family_key text not null unique
    check (family_key ~ '^[a-z][a-z0-9_]*$'),
  display_name text not null
    check (length(btrim(display_name)) > 0),
  purpose text not null
    check (length(btrim(purpose)) > 0),
  parent_family_id uuid references public.creative_skill_families(id) on delete set null,
  primary_planning_contract text not null
    check (primary_planning_contract in (
      'universal_skill_plan',
      'transition_planning_contract',
      'overlay_compositing_planning_contract',
      'graphic_design_planning_contract',
      'motion_design_planning_contract',
      'three_d_visual_planning_contract',
      'b_roll_planning_contract',
      'caption_planning_contract',
      'sound_music_planning_contract',
      'storytiming_coordination_contract',
      'edit_preference_creative_direction_contract',
      'skill_taxonomy_and_family_catalog_contract',
      'visual_opportunity_engine_contract',
      'creative_concept_ideation_contract',
      'skill_candidate_scoring_and_resolver_contract',
      'skill_route_and_plan_assembly_contract',
      'skill_credit_and_approval_planning_contract',
      'skill_qa_and_validation_contract',
      'skill_diagnostics_and_static_validation_contract'
    )),
  related_planning_contracts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(related_planning_contracts) = 'array'),
  source_of_truth_docs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_of_truth_docs) = 'array'),
  duplicate_risk_notes text,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in (
      'draft',
      'proposed',
      'active',
      'future_pending',
      'deprecated',
      'superseded',
      'blocked'
    )),
  version integer not null default 1 check (version > 0),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_family_id is null or parent_family_id <> id)
);

comment on table public.creative_skill_families is
'Global Creative Skill family catalog metadata. This table is not a runtime planner, job queue, provider registry, or signature-system replacement.';
comment on column public.creative_skill_families.family_key is
'Canonical lowercase snake_case family key aligned with RP-SKILLS-21 CreativeSkillFamily values.';
comment on column public.creative_skill_families.parent_family_id is
'Optional normalized parent-family relationship. Child family lists are derived instead of stored as arrays.';
comment on column public.creative_skill_families.related_planning_contracts is
'Optional reviewed planning-contract metadata for the family. This is not executable prompt routing, schema generation, provider configuration, or worker instruction data.';
comment on column public.creative_skill_families.source_of_truth_docs is
'Reviewed documentation paths that own the family meaning. This must not contain executable instructions, signed URLs, secrets, or provider keys.';
comment on column public.creative_skill_families.metadata_json is
'Non-critical catalog notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create table if not exists public.creative_skills (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null unique
    check (skill_key ~ '^[a-z][a-z0-9_]*$'),
  display_name text not null
    check (length(btrim(display_name)) > 0),
  family_id uuid not null references public.creative_skill_families(id) on delete restrict,
  skill_type text not null
    check (skill_type in (
      'atomic_skill',
      'composite_skill',
      'restraint_skill',
      'support_skill',
      'qa_skill',
      'planning_skill',
      'future_runtime_candidate'
    )),
  short_purpose text not null
    check (length(btrim(short_purpose)) > 0),
  plain_language_definition text,
  professional_standard text,
  primary_planning_contract text not null
    check (primary_planning_contract in (
      'universal_skill_plan',
      'transition_planning_contract',
      'overlay_compositing_planning_contract',
      'graphic_design_planning_contract',
      'motion_design_planning_contract',
      'three_d_visual_planning_contract',
      'b_roll_planning_contract',
      'caption_planning_contract',
      'sound_music_planning_contract',
      'storytiming_coordination_contract',
      'edit_preference_creative_direction_contract',
      'skill_taxonomy_and_family_catalog_contract',
      'visual_opportunity_engine_contract',
      'creative_concept_ideation_contract',
      'skill_candidate_scoring_and_resolver_contract',
      'skill_route_and_plan_assembly_contract',
      'skill_credit_and_approval_planning_contract',
      'skill_qa_and_validation_contract',
      'skill_diagnostics_and_static_validation_contract'
    )),
  secondary_planning_contracts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(secondary_planning_contracts) = 'array'),
  default_recommendation_level text not null default 'recommended'
    check (default_recommendation_level in (
      'required',
      'recommended',
      'optional',
      'optional_premium',
      'lower_cost_alternative',
      'not_recommended',
      'blocked',
      'user_requested'
    )),
  default_complexity text not null default 'moderate'
    check (default_complexity in ('simple', 'moderate', 'complex', 'premium', 'future_unknown')),
  default_credit_tendency text not null default 'unknown'
    check (default_credit_tendency in ('none', 'low', 'medium', 'high', 'premium', 'variable', 'unknown')),
  default_approval_tendency text not null default 'unknown'
    check (default_approval_tendency in (
      'not_required',
      'recommended',
      'required',
      'required_before_generation',
      'required_for_premium',
      'user_confirmation_required',
      'unknown'
    )),
  runtime_readiness text not null default 'schema_future'
    check (runtime_readiness in (
      'docs_only',
      'type_contract_only',
      'mock_fixture_future',
      'schema_future',
      'planner_future',
      'runtime_future',
      'blocked'
    )),
  source_safety_status text not null default 'not_applicable'
    check (source_safety_status in (
      'not_applicable',
      'source_confirmed',
      'source_unconfirmed',
      'proof_required',
      'rights_unknown',
      'redaction_required',
      'unsafe',
      'blocked'
    )),
  edit_preference_affinities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(edit_preference_affinities) = 'array'),
  workflow_affinities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(workflow_affinities) = 'array'),
  platform_affinities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(platform_affinities) = 'array'),
  when_to_use_summary text not null
    check (length(btrim(when_to_use_summary)) > 0),
  when_to_avoid_summary text not null
    check (length(btrim(when_to_avoid_summary)) > 0),
  no_action_counterpart_skill_id uuid references public.creative_skills(id) on delete set null,
  tool_candidate_notes text,
  worker_target_notes text,
  provider_boundary_notes text,
  qa_family text,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in (
      'draft',
      'proposed',
      'active',
      'future_pending',
      'deprecated',
      'superseded',
      'blocked'
    )),
  version integer not null default 1 check (version > 0),
  owner_doc text not null
    check (length(btrim(owner_doc)) > 0),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (no_action_counterpart_skill_id is null or no_action_counterpart_skill_id <> id)
);

comment on table public.creative_skills is
'Global Creative Skill catalog metadata. Skills describe planning capabilities only and do not execute edits, route workers, call providers, reserve credits, or replace signature routes.';
comment on column public.creative_skills.skill_key is
'Canonical lowercase snake_case skill key aligned with RP-SKILLS-21 CreativeSkillKey values.';
comment on column public.creative_skills.family_id is
'Normalized family reference. Do not duplicate signature-system ownership or store project/workspace scope here.';
comment on column public.creative_skills.no_action_counterpart_skill_id is
'Optional self-reference for no-action or restraint counterpart skills such as no_3d or no_captions.';
comment on column public.creative_skills.tool_candidate_notes is
'Planning notes only. This column is not a tool registry, executable tool config, or worker instruction surface.';
comment on column public.creative_skills.worker_target_notes is
'Planning notes only. This column must not contain jobs, leases, worker commands, signed URLs, or executable specs.';
comment on column public.creative_skills.provider_boundary_notes is
'Planning notes only. This column must not contain provider credentials, API keys, raw provider payloads, or generation requests.';
comment on column public.creative_skills.metadata_json is
'Non-critical catalog notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create table if not exists public.creative_skill_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique
    check (
      alias = lower(alias)
      and alias = btrim(alias)
      and alias ~ '^[a-z0-9][a-z0-9_ -]*[a-z0-9]$'
    ),
  canonical_skill_id uuid not null references public.creative_skills(id) on delete cascade,
  canonical_skill_key text
    check (canonical_skill_key is null or canonical_skill_key ~ '^[a-z][a-z0-9_]*$'),
  alias_type text not null default 'user_phrase'
    check (alias_type in ('display_name', 'legacy_name', 'user_phrase', 'prompt_phrase', 'source_doc_phrase')),
  conflict_status text not null default 'clear'
    check (conflict_status in ('clear', 'possible_conflict', 'conflict', 'needs_review')),
  reason text,
  status text not null default 'active'
    check (status in (
      'draft',
      'proposed',
      'active',
      'future_pending',
      'deprecated',
      'superseded',
      'blocked'
    )),
  avoid_new_usage boolean not null default false,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.creative_skill_aliases is
'Reviewed aliases from user phrases, display names, legacy names, prompt phrases, or source docs to canonical Creative Skill keys.';
comment on column public.creative_skill_aliases.alias is
'Lowercase normalized alias text. This is metadata for catalog lookup only, not a prompt execution surface.';
comment on column public.creative_skill_aliases.canonical_skill_key is
'Readable canonical skill key kept with canonical_skill_id for seed review and audit clarity.';
comment on column public.creative_skill_aliases.metadata_json is
'Non-critical alias notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create table if not exists public.creative_skill_relationships (
  id uuid primary key default gen_random_uuid(),
  from_skill_id uuid not null references public.creative_skills(id) on delete cascade,
  from_skill_key text not null
    check (from_skill_key ~ '^[a-z][a-z0-9_]*$'),
  to_skill_id uuid not null references public.creative_skills(id) on delete cascade,
  to_skill_key text not null
    check (to_skill_key ~ '^[a-z][a-z0-9_]*$'),
  relationship_type text not null
    check (relationship_type in (
      'supports',
      'requires',
      'conflicts_with',
      'alternative_to',
      'lower_cost_alternative_to',
      'blocks',
      'blocked_by',
      'coordinates_with',
      'inherits_from'
    )),
  reason text not null
    check (length(btrim(reason)) > 0),
  strength text not null default 'moderate'
    check (strength in ('weak', 'moderate', 'strong', 'required')),
  can_coexist boolean not null default true,
  requires_storytiming_coordination boolean not null default false,
  credit_relationship_notes text,
  approval_relationship_notes text,
  notes text,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in (
      'draft',
      'proposed',
      'active',
      'future_pending',
      'deprecated',
      'superseded',
      'blocked'
    )),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_skill_id, to_skill_id, relationship_type),
  check (from_skill_id <> to_skill_id),
  check (from_skill_key <> to_skill_key)
);

comment on table public.creative_skill_relationships is
'Catalog metadata for skill support, conflicts, alternatives, lower-cost alternatives, blocking, coordination, and inheritance relationships.';
comment on column public.creative_skill_relationships.requires_storytiming_coordination is
'Planning metadata flag only. This does not create StoryTiming records, orchestration, jobs, or runtime validation.';
comment on column public.creative_skill_relationships.credit_relationship_notes is
'Credit planning notes only. This does not estimate, reserve, spend, refund, or ledger credits.';
comment on column public.creative_skill_relationships.approval_relationship_notes is
'Approval planning notes only. This does not create approval records or permit generation.';
comment on column public.creative_skill_relationships.metadata_json is
'Non-critical relationship notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create table if not exists public.creative_skill_contract_mappings (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.creative_skills(id) on delete cascade,
  skill_key text not null
    check (skill_key ~ '^[a-z][a-z0-9_]*$'),
  planning_contract_type text not null
    check (planning_contract_type in (
      'universal_skill_plan',
      'transition_planning_contract',
      'overlay_compositing_planning_contract',
      'graphic_design_planning_contract',
      'motion_design_planning_contract',
      'three_d_visual_planning_contract',
      'b_roll_planning_contract',
      'caption_planning_contract',
      'sound_music_planning_contract',
      'storytiming_coordination_contract',
      'edit_preference_creative_direction_contract',
      'skill_taxonomy_and_family_catalog_contract',
      'visual_opportunity_engine_contract',
      'creative_concept_ideation_contract',
      'skill_candidate_scoring_and_resolver_contract',
      'skill_route_and_plan_assembly_contract',
      'skill_credit_and_approval_planning_contract',
      'skill_qa_and_validation_contract',
      'skill_diagnostics_and_static_validation_contract'
    )),
  required boolean not null default true,
  mapping_role text not null default 'primary'
    check (mapping_role in ('primary', 'secondary')),
  required_before_credit_estimate boolean not null default false,
  required_before_approval boolean not null default false,
  required_before_future_execution boolean not null default true,
  attachment_reason text,
  expected_plan_record_type text,
  status text not null default 'draft'
    check (status in (
      'draft',
      'queued',
      'running',
      'waiting_dependency',
      'waiting_user_input',
      'waiting_user_approval',
      'completed',
      'failed',
      'cancelled',
      'retrying'
    )),
  version integer not null default 1 check (version > 0),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, planning_contract_type)
);

comment on table public.creative_skill_contract_mappings is
'Catalog metadata mapping Creative Skills to planning contracts. Mappings are not executable prompts, workers, schemas, jobs, or provider instructions.';
comment on column public.creative_skill_contract_mappings.required_before_credit_estimate is
'Planning metadata only. This does not create credit estimates, reservations, ledgers, billing events, or Stripe behavior.';
comment on column public.creative_skill_contract_mappings.planning_contract_type is
'Documentation-approved planning contract identifier only. This is not executable prompt routing, schema generation, provider configuration, or worker instruction data.';
comment on column public.creative_skill_contract_mappings.required_before_approval is
'Planning metadata only. This does not create approval records or permit generation.';
comment on column public.creative_skill_contract_mappings.required_before_future_execution is
'Planning metadata only. This does not execute skills, create jobs, or call providers.';
comment on column public.creative_skill_contract_mappings.metadata_json is
'Non-critical mapping notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create table if not exists public.creative_skill_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  proposed_skill_key text not null
    check (proposed_skill_key ~ '^[a-z][a-z0-9_]*$'),
  proposed_family_id uuid references public.creative_skill_families(id) on delete set null,
  proposed_family_key text
    check (proposed_family_key is null or proposed_family_key ~ '^[a-z][a-z0-9_]*$'),
  similar_existing_skill_keys jsonb not null default '[]'::jsonb
    check (jsonb_typeof(similar_existing_skill_keys) = 'array'),
  similar_aliases jsonb not null default '[]'::jsonb
    check (jsonb_typeof(similar_aliases) = 'array'),
  duplicate_risk text not null default 'medium'
    check (duplicate_risk in ('none', 'low', 'medium', 'high', 'confirmed_duplicate')),
  decision text not null default 'needs_owner_review'
    check (decision in ('accept_new', 'merge_with_existing', 'alias_existing', 'reject', 'needs_owner_review')),
  decision_reason text not null
    check (length(btrim(decision_reason)) > 0),
  planning_contract_mapping_notes text,
  reviewer_notes text,
  status text not null default 'draft'
    check (status in (
      'draft',
      'queued',
      'running',
      'waiting_dependency',
      'waiting_user_input',
      'waiting_user_approval',
      'completed',
      'failed',
      'cancelled',
      'retrying'
    )),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.creative_skill_duplicate_reviews is
'Internal catalog audit table for proposed duplicate or conflicting Creative Skill additions. No client read/write policies are created in RP-SKILLS-27.';
comment on column public.creative_skill_duplicate_reviews.proposed_skill_key is
'Proposed lowercase snake_case skill key under review. This does not create a canonical skill.';
comment on column public.creative_skill_duplicate_reviews.similar_existing_skill_keys is
'Reviewed similar skill keys for duplicate-risk assessment. This is not seed data and not resolver runtime.';
comment on column public.creative_skill_duplicate_reviews.decision is
'Internal duplicate-review decision metadata only. This does not create a canonical skill, alias, route, approval, job, or runtime action.';
comment on column public.creative_skill_duplicate_reviews.status is
'Internal review status metadata only. This does not publish catalog rows, authorize generation, or expose client-visible workflow state.';
comment on column public.creative_skill_duplicate_reviews.reviewer_notes is
'Internal notes only. No reviewer user foreign key is added in RP-SKILLS-27.';
comment on column public.creative_skill_duplicate_reviews.metadata_json is
'Non-critical duplicate-review notes only. Do not store secrets, provider payloads, jobs, credit reservations, generation instructions, or runtime config.';

create index if not exists creative_skill_families_parent_family_id_idx
on public.creative_skill_families(parent_family_id);

create index if not exists creative_skill_families_lifecycle_status_idx
on public.creative_skill_families(lifecycle_status);

create index if not exists creative_skills_family_id_idx
on public.creative_skills(family_id);

create index if not exists creative_skills_skill_type_idx
on public.creative_skills(skill_type);

create index if not exists creative_skills_lifecycle_status_idx
on public.creative_skills(lifecycle_status);

create index if not exists creative_skills_primary_planning_contract_idx
on public.creative_skills(primary_planning_contract);

create index if not exists creative_skills_no_action_counterpart_skill_id_idx
on public.creative_skills(no_action_counterpart_skill_id);

create index if not exists creative_skill_aliases_canonical_skill_id_idx
on public.creative_skill_aliases(canonical_skill_id);

create index if not exists creative_skill_aliases_canonical_skill_key_idx
on public.creative_skill_aliases(canonical_skill_key);

create index if not exists creative_skill_aliases_status_idx
on public.creative_skill_aliases(status);

create index if not exists creative_skill_relationships_from_skill_id_idx
on public.creative_skill_relationships(from_skill_id);

create index if not exists creative_skill_relationships_to_skill_id_idx
on public.creative_skill_relationships(to_skill_id);

create index if not exists creative_skill_relationships_relationship_type_idx
on public.creative_skill_relationships(relationship_type);

create index if not exists creative_skill_relationships_lifecycle_status_idx
on public.creative_skill_relationships(lifecycle_status);

create index if not exists creative_skill_contract_mappings_skill_id_idx
on public.creative_skill_contract_mappings(skill_id);

create index if not exists creative_skill_contract_mappings_skill_key_idx
on public.creative_skill_contract_mappings(skill_key);

create index if not exists creative_skill_contract_mappings_planning_contract_type_idx
on public.creative_skill_contract_mappings(planning_contract_type);

create index if not exists creative_skill_contract_mappings_status_idx
on public.creative_skill_contract_mappings(status);

create index if not exists creative_skill_duplicate_reviews_proposed_skill_key_idx
on public.creative_skill_duplicate_reviews(proposed_skill_key);

create index if not exists creative_skill_duplicate_reviews_proposed_family_id_idx
on public.creative_skill_duplicate_reviews(proposed_family_id);

create index if not exists creative_skill_duplicate_reviews_duplicate_risk_idx
on public.creative_skill_duplicate_reviews(duplicate_risk);

create index if not exists creative_skill_duplicate_reviews_decision_idx
on public.creative_skill_duplicate_reviews(decision);

create index if not exists creative_skill_duplicate_reviews_status_idx
on public.creative_skill_duplicate_reviews(status);

drop trigger if exists set_creative_skill_families_updated_at on public.creative_skill_families;
create trigger set_creative_skill_families_updated_at
before update on public.creative_skill_families
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_skills_updated_at on public.creative_skills;
create trigger set_creative_skills_updated_at
before update on public.creative_skills
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_skill_aliases_updated_at on public.creative_skill_aliases;
create trigger set_creative_skill_aliases_updated_at
before update on public.creative_skill_aliases
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_skill_relationships_updated_at on public.creative_skill_relationships;
create trigger set_creative_skill_relationships_updated_at
before update on public.creative_skill_relationships
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_skill_contract_mappings_updated_at on public.creative_skill_contract_mappings;
create trigger set_creative_skill_contract_mappings_updated_at
before update on public.creative_skill_contract_mappings
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_skill_duplicate_reviews_updated_at on public.creative_skill_duplicate_reviews;
create trigger set_creative_skill_duplicate_reviews_updated_at
before update on public.creative_skill_duplicate_reviews
for each row execute function public.set_updated_at();

alter table public.creative_skill_families enable row level security;
alter table public.creative_skills enable row level security;
alter table public.creative_skill_aliases enable row level security;
alter table public.creative_skill_relationships enable row level security;
alter table public.creative_skill_contract_mappings enable row level security;
alter table public.creative_skill_duplicate_reviews enable row level security;

drop policy if exists creative_skill_families_select_authenticated on public.creative_skill_families;
create policy creative_skill_families_select_authenticated
on public.creative_skill_families for select
to authenticated
using (true);

drop policy if exists creative_skills_select_authenticated on public.creative_skills;
create policy creative_skills_select_authenticated
on public.creative_skills for select
to authenticated
using (true);

drop policy if exists creative_skill_aliases_select_authenticated on public.creative_skill_aliases;
create policy creative_skill_aliases_select_authenticated
on public.creative_skill_aliases for select
to authenticated
using (true);

drop policy if exists creative_skill_relationships_select_authenticated on public.creative_skill_relationships;
create policy creative_skill_relationships_select_authenticated
on public.creative_skill_relationships for select
to authenticated
using (true);

drop policy if exists creative_skill_contract_mappings_select_authenticated on public.creative_skill_contract_mappings;
create policy creative_skill_contract_mappings_select_authenticated
on public.creative_skill_contract_mappings for select
to authenticated
using (true);

revoke all on table public.creative_skill_families from public, anon, authenticated;
revoke all on table public.creative_skills from public, anon, authenticated;
revoke all on table public.creative_skill_aliases from public, anon, authenticated;
revoke all on table public.creative_skill_relationships from public, anon, authenticated;
revoke all on table public.creative_skill_contract_mappings from public, anon, authenticated;
revoke all on table public.creative_skill_duplicate_reviews from public, anon, authenticated;

grant select on table public.creative_skill_families to authenticated;
grant select on table public.creative_skills to authenticated;
grant select on table public.creative_skill_aliases to authenticated;
grant select on table public.creative_skill_relationships to authenticated;
grant select on table public.creative_skill_contract_mappings to authenticated;
