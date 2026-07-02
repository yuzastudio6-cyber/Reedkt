-- REVIEW DRAFT ONLY
-- NOT APPLIED
-- DO NOT RUN IN PRODUCTION
-- Generated for RP-SUPABASE-MIGRATION-01 planning review

-- Purpose:
-- Draft RLS, explicit grants, and service-role-only write posture for credit
-- persistence tables. Support/admin authorization remains placeholder and should
-- be implemented through backend routes until the production role model is approved.

alter table public.credit_settlements enable row level security;
alter table public.credit_revision_actions enable row level security;
alter table public.credit_export_locks enable row level security;
alter table public.credit_top_up_intents enable row level security;
alter table public.stripe_customer_links enable row level security;
alter table public.stripe_payment_method_links enable row level security;
alter table public.stripe_checkout_sessions enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on table public.credit_settlements from public, anon;
revoke all on table public.credit_revision_actions from public, anon;
revoke all on table public.credit_export_locks from public, anon;
revoke all on table public.credit_top_up_intents from public, anon;
revoke all on table public.stripe_customer_links from public, anon;
revoke all on table public.stripe_payment_method_links from public, anon;
revoke all on table public.stripe_checkout_sessions from public, anon;
revoke all on table public.stripe_webhook_events from public, anon;

grant select on table public.credit_settlements to authenticated;
grant select on table public.credit_revision_actions to authenticated;
grant select on table public.credit_export_locks to authenticated;
grant select on table public.credit_top_up_intents to authenticated;
grant select on table public.stripe_customer_links to authenticated;
grant select on table public.stripe_payment_method_links to authenticated;
grant select on table public.stripe_checkout_sessions to authenticated;
grant select on table public.stripe_webhook_events to authenticated;

grant select, insert, update, delete on table public.credit_settlements to service_role;
grant select, insert, update, delete on table public.credit_revision_actions to service_role;
grant select, insert, update, delete on table public.credit_export_locks to service_role;
grant select, insert, update, delete on table public.credit_top_up_intents to service_role;
grant select, insert, update, delete on table public.stripe_customer_links to service_role;
grant select, insert, update, delete on table public.stripe_payment_method_links to service_role;
grant select, insert, update, delete on table public.stripe_checkout_sessions to service_role;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;

create policy credit_settlements_select_member
on public.credit_settlements for select
to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

create policy credit_revision_actions_select_member
on public.credit_revision_actions for select
to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

create policy credit_export_locks_select_member
on public.credit_export_locks for select
to authenticated
using (public.is_workspace_member(workspace_id) and public.is_project_member(project_id));

create policy credit_top_up_intents_select_member
on public.credit_top_up_intents for select
to authenticated
using (public.is_workspace_member(workspace_id) and user_id = auth.uid());

create policy stripe_customer_links_select_owner
on public.stripe_customer_links for select
to authenticated
using (public.is_workspace_member(workspace_id) and user_id = auth.uid());

create policy stripe_payment_method_links_select_owner
on public.stripe_payment_method_links for select
to authenticated
using (public.is_workspace_member(workspace_id) and user_id = auth.uid());

create policy stripe_checkout_sessions_select_owner
on public.stripe_checkout_sessions for select
to authenticated
using (public.is_workspace_member(workspace_id) and user_id = auth.uid());

create policy stripe_webhook_events_select_member_summary
on public.stripe_webhook_events for select
to authenticated
using (
  workspace_id is not null
  and public.is_workspace_member(workspace_id)
);

-- Billing-critical write policy:
-- No authenticated insert/update/delete policy is drafted for:
-- credit_wallets, credit_grants, credit_ledger_entries, credit_reservations,
-- credit_reservation_line_items, credit_settlements, credit_revision_actions,
-- credit_export_locks, stripe_* tables, or billable tool_cost_events.
-- Backend service-role code owns every mutation.

-- Existing tables should also be reviewed for explicit grants:
grant select on table public.credit_wallets to authenticated;
grant select on table public.credit_grants to authenticated;
grant select on table public.credit_ledger_entries to authenticated;
grant select on table public.credit_estimates to authenticated;
grant select on table public.credit_estimate_line_items to authenticated;
grant select on table public.credit_approvals to authenticated;
grant select on table public.credit_reservations to authenticated;
grant select on table public.credit_reservation_line_items to authenticated;
grant select on table public.credit_refunds to authenticated;
grant select on table public.api_idempotency_keys to authenticated;
grant select on table public.tool_cost_events to authenticated;

grant select, insert, update, delete on table public.credit_wallets to service_role;
grant select, insert, update, delete on table public.credit_grants to service_role;
grant select, insert, update, delete on table public.credit_ledger_entries to service_role;
grant select, insert, update, delete on table public.credit_estimates to service_role;
grant select, insert, update, delete on table public.credit_estimate_line_items to service_role;
grant select, insert, update, delete on table public.credit_approvals to service_role;
grant select, insert, update, delete on table public.credit_reservations to service_role;
grant select, insert, update, delete on table public.credit_reservation_line_items to service_role;
grant select, insert, update, delete on table public.credit_refunds to service_role;
grant select, insert, update, delete on table public.api_idempotency_keys to service_role;
grant select, insert, update, delete on table public.tool_cost_events to service_role;
