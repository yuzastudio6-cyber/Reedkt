-- RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1
-- Harden public-schema table grants for the single main ReeditPro staging
-- target. RLS remains the row-level boundary, but external beta should not
-- rely on broad anon/authenticated mutation grants on backend-owned tables.

revoke insert, update, delete, truncate, references, trigger
on all tables in schema public
from anon, authenticated;

revoke all privileges
on all sequences in schema public
from anon, authenticated;

alter default privileges in schema public
revoke insert, update, delete, truncate, references, trigger
on tables
from anon, authenticated;

alter default privileges in schema public
revoke all privileges
on sequences
from anon, authenticated;

comment on schema public is
'ReEditPro public schema. External beta staging grant hardening revokes broad anon/authenticated public-table mutation grants; backend/service-role routes own privileged writes.';
