create extension if not exists "pgcrypto";

create type public.plan_slug as enum ('personal', 'business', 'enterprise');
create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer', 'client_reviewer');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'incomplete');
create type public.project_status as enum (
  'draft',
  'collecting_context',
  'planning',
  'awaiting_approval',
  'generating',
  'preview_ready',
  'revision_requested',
  'exporting',
  'completed',
  'cancelled',
  'failed'
);
create type public.target_platform as enum (
  'tiktok_reels_shorts',
  'youtube',
  'website',
  'course_training',
  'client_review',
  'custom'
);
create type public.aspect_ratio as enum ('9_16', '16_9', '1_1', 'let_ai_decide');
create type public.chat_session_status as enum (
  'open',
  'waiting_user_input',
  'planning',
  'awaiting_approval',
  'generating',
  'preview_ready',
  'closed',
  'cancelled',
  'failed'
);
create type public.chat_message_role as enum ('user', 'assistant', 'system', 'agent', 'worker');
create type public.chat_attachment_type as enum (
  'source_video',
  'source_audio',
  'source_image',
  'reference_video',
  'reference_image',
  'document',
  'generated_preview',
  'final_export'
);
create type public.inline_chat_card_type as enum (
  'source_sequence',
  'workflow_choice',
  'ai_question',
  'reference_dna',
  'edit_plan',
  'credit_estimate',
  'approval_request',
  'editing_progress',
  'preview_ready',
  'revision_request',
  'export_ready'
);
create type public.chat_action_type as enum (
  'approve',
  'revise',
  'lower_credit_cost',
  'change_style',
  'remove_real_motion',
  'make_real_motion_smaller',
  'show_detailed_timeline',
  'request_revision',
  'export',
  'save_draft'
);
create type public.media_asset_type as enum (
  'source_video',
  'source_audio',
  'source_image',
  'reference_video',
  'reference_image',
  'document',
  'transcript',
  'generated_overlay',
  'generated_audio',
  'preview_render',
  'final_export'
);
create type public.media_processing_status as enum (
  'pending',
  'uploaded',
  'analyzing',
  'analysis_ready',
  'failed',
  'archived'
);
create type public.source_clip_item_status as enum ('active', 'optional', 'excluded', 'archived');
create type public.reference_asset_status as enum ('pending', 'analyzing', 'dna_ready', 'failed', 'removed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug public.plan_slug not null unique,
  name text not null,
  weekly_price_cents integer not null default 0 check (weekly_price_cents >= 0),
  included_weekly_bonus_credits integer not null default 0 check (included_weekly_bonus_credits >= 0),
  description text,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is
'Software access plans for ReeditPro. Subscription is software access; Edit Credits pay for AI generation, rendering, and editing usage. No plan means unlimited AI editing.';

insert into public.plans (slug, name, weekly_price_cents, included_weekly_bonus_credits, description, features)
values
  (
    'personal',
    'Personal',
    1000,
    100,
    'Personal software access for creators and solo users. Includes 100 weekly bonus Reedit Credits.',
    '{"audience":["creators","solo users"],"credit_policy":"100 weekly bonus credits; more credits can be purchased later"}'::jsonb
  ),
  (
    'business',
    'Business',
    2000,
    0,
    'Business software access for brands, teams, coaches, agencies, and small businesses. Included weekly bonus credits are configurable later.',
    '{"audience":["brands","teams","coaches","agencies","small businesses"],"features":["brand kit","team workflow","client review placeholders","team credit wallet placeholder"]}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    0,
    0,
    'Enterprise placeholder for future custom software access and credit policy.',
    '{"audience":["enterprise"],"credit_policy":"custom"}'::jsonb
  );

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  default_workspace_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is
'Application profile records for Supabase auth users. The auth.users table is owned by Supabase and is not created by this migration.';

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.user_profiles(id) on delete cascade,
  name text not null,
  slug text unique,
  plan_id uuid references public.plans(id) on delete set null,
  workspace_type text not null default 'personal' check (workspace_type in ('personal', 'business', 'enterprise')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspaces is
'Personal, Business, and future Enterprise workspaces for ReeditPro accounts.';

alter table public.user_profiles
add constraint user_profiles_default_workspace_id_fkey
foreign key (default_workspace_id) references public.workspaces(id) on delete set null;

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.workspace_role not null default 'owner',
  invited_by uuid references public.user_profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'active',
  billing_provider text,
  billing_customer_id text,
  billing_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
'Subscription status records for software access only. Billing provider columns are placeholders for later Stripe or billing integration.';

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.user_profiles(id) on delete set null,
  title text not null,
  description text,
  status public.project_status not null default 'draft',
  target_platform public.target_platform not null default 'custom',
  aspect_ratio public.aspect_ratio not null default 'let_ai_decide',
  source_sequence_locked boolean not null default false,
  current_chat_session_id uuid,
  current_edit_plan_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.projects is
'ReeditPro project shell. AI planning, credit estimates, jobs, renders, and revisions are future migrations.';
comment on column public.projects.current_edit_plan_id is
'Reserved nullable reference for a future edit_plans table. No foreign key is added in RP-DB-03.';
comment on column public.projects.source_sequence_locked is
'When true, the user has explicitly locked the source clip order as planning context. This still is not automatically the final edit order.';

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  started_by uuid references public.user_profiles(id) on delete set null,
  status public.chat_session_status not null default 'open',
  title text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chat_sessions is
'Chat-native editor sessions. The chat is the editor for sending clips, references, instructions, approvals, revisions, and export requests.';

alter table public.projects
add constraint projects_current_chat_session_id_fkey
foreign key (current_chat_session_id) references public.chat_sessions(id) on delete set null;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role public.chat_message_role not null,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  content text,
  content_json jsonb not null default '{}'::jsonb,
  sequence_number integer not null check (sequence_number > 0),
  is_visible_to_user boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (chat_session_id, sequence_number)
);

comment on table public.chat_messages is
'Messages in the ReeditPro chat-native editor, including user instructions, AI responses, agent status updates, approvals, and revision requests.';

create table public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  chat_message_id uuid references public.chat_messages(id) on delete cascade,
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  attachment_type public.chat_attachment_type not null,
  media_asset_id uuid,
  display_name text,
  source_order integer check (source_order is null or source_order > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.chat_attachments is
'Files and references sent in chat. Source order can be captured here before media assets are organized into a source sequence.';
comment on column public.chat_attachments.source_order is
'The order the user sent or uploaded clip attachments in chat. This is source sequence context, not automatically the final edit order.';

create table public.inline_chat_cards (
  id uuid primary key default gen_random_uuid(),
  chat_message_id uuid references public.chat_messages(id) on delete cascade,
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  card_type public.inline_chat_card_type not null,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'completed', 'dismissed', 'expired', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inline_chat_cards is
'Structured UI cards rendered inside chat only when ReeditPro needs user input, confirmation, approval, progress, or preview.';

create table public.chat_actions (
  id uuid primary key default gen_random_uuid(),
  inline_chat_card_id uuid not null references public.inline_chat_cards(id) on delete cascade,
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action_type public.chat_action_type not null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  is_destructive boolean not null default false,
  requires_approval boolean not null default false,
  executed_by uuid references public.user_profiles(id) on delete set null,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.chat_actions is
'Actions attached to inline chat cards. Approval actions prepare future workflows but do not spend credits or start generation in RP-DB-03.';

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_by uuid references public.user_profiles(id) on delete set null,
  asset_type public.media_asset_type not null,
  processing_status public.media_processing_status not null default 'pending',
  file_name text not null,
  display_name text,
  mime_type text,
  storage_provider text not null default 'supabase_storage',
  storage_bucket text,
  storage_path text,
  public_url text,
  signed_url_expires_at timestamptz,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  width integer,
  height integer,
  frame_rate numeric,
  codec text,
  audio_channels integer,
  has_audio boolean,
  has_video boolean,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.media_assets is
'Metadata for source media, references, transcripts, generated media placeholders, previews, and final exports. RP-DB-03 does not implement real upload storage.';
comment on column public.media_assets.storage_path is
'Storage object path only. Do not store service-role credentials or long-lived signed URLs in this column.';
comment on column public.media_assets.public_url is
'Optional safe public URL only when explicitly allowed. Private media should use future short-lived signed URL services.';

alter table public.chat_attachments
add constraint chat_attachments_media_asset_id_fkey
foreign key (media_asset_id) references public.media_assets(id) on delete set null;

create table public.source_clip_sequences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  name text not null default 'Source sequence',
  description text,
  is_active boolean not null default true,
  locked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.source_clip_sequences is
'Named source sequence for clips sent or uploaded in chat. This captures the order the user filmed clips or believes they belong.';

create table public.source_clip_sequence_items (
  id uuid primary key default gen_random_uuid(),
  source_clip_sequence_id uuid not null references public.source_clip_sequences(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  uploaded_order integer not null check (uploaded_order > 0),
  status public.source_clip_item_status not null default 'active',
  user_note text,
  is_important boolean not null default false,
  is_optional boolean not null default false,
  detected_role text,
  possible_uses jsonb not null default '[]'::jsonb,
  analysis_status public.media_processing_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_clip_sequence_id, uploaded_order),
  unique (source_clip_sequence_id, media_asset_id)
);

comment on table public.source_clip_sequence_items is
'Clip items in source order. The AI uses this as planning context before any future edit plan changes final order.';
comment on column public.source_clip_sequence_items.uploaded_order is
'The source order the user sent/uploaded clips in. This is planning context and is not automatically the final edit order.';
comment on column public.source_clip_sequence_items.possible_uses is
'AI/media-analysis hints for future planning. This migration only stores the field and does not analyze media.';

create table public.reference_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  chat_session_id uuid references public.chat_sessions(id) on delete set null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  reference_url text,
  status public.reference_asset_status not null default 'pending',
  user_note text,
  do_not_copy_shot_for_shot boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (media_asset_id is not null or reference_url is not null)
);

comment on table public.reference_assets is
'Reference videos, images, or documents associated with a project/chat for future Reference DNA analysis.';
comment on column public.reference_assets.do_not_copy_shot_for_shot is
'ReeditPro studies reference style and Reference DNA, but must not copy reference videos shot-for-shot.';

create index plans_slug_idx on public.plans (slug);
create index user_profiles_default_workspace_id_idx on public.user_profiles (default_workspace_id);
create index workspaces_owner_user_id_idx on public.workspaces (owner_user_id);
create index workspaces_plan_id_idx on public.workspaces (plan_id);
create index workspaces_slug_idx on public.workspaces (slug);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_role_idx on public.workspace_members (role);
create index subscriptions_workspace_id_idx on public.subscriptions (workspace_id);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_billing_provider_ids_idx on public.subscriptions (billing_provider, billing_customer_id, billing_subscription_id);
create index projects_workspace_id_idx on public.projects (workspace_id);
create index projects_created_by_idx on public.projects (created_by);
create index projects_status_idx on public.projects (status);
create index projects_target_platform_idx on public.projects (target_platform);
create index projects_archived_at_idx on public.projects (archived_at);
create index chat_sessions_project_id_idx on public.chat_sessions (project_id);
create index chat_sessions_workspace_id_idx on public.chat_sessions (workspace_id);
create index chat_sessions_started_by_idx on public.chat_sessions (started_by);
create index chat_sessions_status_idx on public.chat_sessions (status);
create index chat_sessions_last_message_at_idx on public.chat_sessions (last_message_at);
create index chat_messages_chat_session_id_idx on public.chat_messages (chat_session_id);
create index chat_messages_project_id_idx on public.chat_messages (project_id);
create index chat_messages_workspace_id_idx on public.chat_messages (workspace_id);
create index chat_messages_role_idx on public.chat_messages (role);
create index chat_messages_created_at_idx on public.chat_messages (created_at);
create index chat_attachments_chat_message_id_idx on public.chat_attachments (chat_message_id);
create index chat_attachments_chat_session_id_idx on public.chat_attachments (chat_session_id);
create index chat_attachments_project_id_idx on public.chat_attachments (project_id);
create index chat_attachments_source_order_idx on public.chat_attachments (source_order);
create index chat_attachments_attachment_type_idx on public.chat_attachments (attachment_type);
create index inline_chat_cards_chat_session_id_idx on public.inline_chat_cards (chat_session_id);
create index inline_chat_cards_project_id_idx on public.inline_chat_cards (project_id);
create index inline_chat_cards_card_type_idx on public.inline_chat_cards (card_type);
create index inline_chat_cards_status_idx on public.inline_chat_cards (status);
create index chat_actions_inline_chat_card_id_idx on public.chat_actions (inline_chat_card_id);
create index chat_actions_chat_session_id_idx on public.chat_actions (chat_session_id);
create index chat_actions_project_id_idx on public.chat_actions (project_id);
create index chat_actions_action_type_idx on public.chat_actions (action_type);
create index chat_actions_executed_at_idx on public.chat_actions (executed_at);
create index media_assets_workspace_id_idx on public.media_assets (workspace_id);
create index media_assets_project_id_idx on public.media_assets (project_id);
create index media_assets_created_by_idx on public.media_assets (created_by);
create index media_assets_asset_type_idx on public.media_assets (asset_type);
create index media_assets_processing_status_idx on public.media_assets (processing_status);
create index media_assets_storage_path_idx on public.media_assets (storage_bucket, storage_path);
create index media_assets_archived_at_idx on public.media_assets (archived_at);
create index source_clip_sequences_project_id_idx on public.source_clip_sequences (project_id);
create index source_clip_sequences_workspace_id_idx on public.source_clip_sequences (workspace_id);
create index source_clip_sequences_chat_session_id_idx on public.source_clip_sequences (chat_session_id);
create index source_clip_sequences_is_active_idx on public.source_clip_sequences (is_active);
create index source_clip_sequence_items_sequence_id_idx on public.source_clip_sequence_items (source_clip_sequence_id);
create index source_clip_sequence_items_project_id_idx on public.source_clip_sequence_items (project_id);
create index source_clip_sequence_items_workspace_id_idx on public.source_clip_sequence_items (workspace_id);
create index source_clip_sequence_items_media_asset_id_idx on public.source_clip_sequence_items (media_asset_id);
create index source_clip_sequence_items_uploaded_order_idx on public.source_clip_sequence_items (uploaded_order);
create index source_clip_sequence_items_status_idx on public.source_clip_sequence_items (status);
create index source_clip_sequence_items_analysis_status_idx on public.source_clip_sequence_items (analysis_status);
create index reference_assets_project_id_idx on public.reference_assets (project_id);
create index reference_assets_workspace_id_idx on public.reference_assets (workspace_id);
create index reference_assets_chat_session_id_idx on public.reference_assets (chat_session_id);
create index reference_assets_media_asset_id_idx on public.reference_assets (media_asset_id);
create index reference_assets_status_idx on public.reference_assets (status);

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

create trigger inline_chat_cards_set_updated_at
before update on public.inline_chat_cards
for each row execute function public.set_updated_at();

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

create trigger source_clip_sequences_set_updated_at
before update on public.source_clip_sequences
for each row execute function public.set_updated_at();

create trigger source_clip_sequence_items_set_updated_at
before update on public.source_clip_sequence_items
for each row execute function public.set_updated_at();

create trigger reference_assets_set_updated_at
before update on public.reference_assets
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function public.is_workspace_owner_record(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_workspace_role(target_workspace_id, array['owner', 'admin']::public.workspace_role[]);
$$;

alter table public.plans enable row level security;
alter table public.user_profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.projects enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_attachments enable row level security;
alter table public.inline_chat_cards enable row level security;
alter table public.chat_actions enable row level security;
alter table public.media_assets enable row level security;
alter table public.source_clip_sequences enable row level security;
alter table public.source_clip_sequence_items enable row level security;
alter table public.reference_assets enable row level security;

create policy plans_select_active
on public.plans for select
to authenticated
using (is_active = true);

create policy user_profiles_select_own
on public.user_profiles for select
to authenticated
using (id = auth.uid());

create policy user_profiles_insert_own
on public.user_profiles for insert
to authenticated
with check (id = auth.uid());

create policy user_profiles_update_own
on public.user_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy workspaces_select_member
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

create policy workspaces_insert_owner
on public.workspaces for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy workspaces_update_owner_admin
on public.workspaces for update
to authenticated
using (public.is_workspace_owner_or_admin(id))
with check (public.is_workspace_owner_or_admin(id));

create policy workspace_members_select_member
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy workspace_members_insert_owner_admin
on public.workspace_members for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy workspace_members_insert_initial_owner
on public.workspace_members for insert
to authenticated
with check (
  role = 'owner'
  and user_id = auth.uid()
  and public.is_workspace_owner_record(workspace_id)
);

create policy workspace_members_update_owner_admin
on public.workspace_members for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy workspace_members_delete_owner_admin
on public.workspace_members for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy subscriptions_select_member
on public.subscriptions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy subscriptions_insert_owner_admin
on public.subscriptions for insert
to authenticated
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy subscriptions_update_owner_admin
on public.subscriptions for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy projects_select_member
on public.projects for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy projects_insert_editor
on public.projects for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy projects_update_editor
on public.projects for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy projects_delete_owner_admin
on public.projects for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy chat_sessions_select_member
on public.chat_sessions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy chat_sessions_insert_editor
on public.chat_sessions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_sessions_update_editor
on public.chat_sessions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_messages_select_member
on public.chat_messages for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy chat_messages_insert_editor
on public.chat_messages for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_messages_update_editor
on public.chat_messages for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_attachments_select_member
on public.chat_attachments for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy chat_attachments_insert_editor
on public.chat_attachments for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_attachments_update_editor
on public.chat_attachments for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy inline_chat_cards_select_member
on public.inline_chat_cards for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy inline_chat_cards_insert_editor
on public.inline_chat_cards for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy inline_chat_cards_update_editor
on public.inline_chat_cards for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_actions_select_member
on public.chat_actions for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy chat_actions_insert_editor
on public.chat_actions for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy chat_actions_update_editor
on public.chat_actions for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy media_assets_select_member
on public.media_assets for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy media_assets_insert_editor
on public.media_assets for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy media_assets_update_editor
on public.media_assets for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy media_assets_delete_owner_admin
on public.media_assets for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy source_clip_sequences_select_member
on public.source_clip_sequences for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy source_clip_sequences_insert_editor
on public.source_clip_sequences for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_clip_sequences_update_editor
on public.source_clip_sequences for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_clip_sequences_delete_owner_admin
on public.source_clip_sequences for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy source_clip_sequence_items_select_member
on public.source_clip_sequence_items for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy source_clip_sequence_items_insert_editor
on public.source_clip_sequence_items for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_clip_sequence_items_update_editor
on public.source_clip_sequence_items for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy source_clip_sequence_items_delete_owner_admin
on public.source_clip_sequence_items for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy reference_assets_select_member
on public.reference_assets for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy reference_assets_insert_editor
on public.reference_assets for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy reference_assets_update_editor
on public.reference_assets for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'editor']::public.workspace_role[]));

create policy reference_assets_delete_owner_admin
on public.reference_assets for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));
