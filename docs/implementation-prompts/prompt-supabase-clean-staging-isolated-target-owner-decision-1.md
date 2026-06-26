# SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1`.

## Goal

Decide how to obtain a source-aligned non-production Supabase target after both the existing clean branch and the replacement branch candidate carried remote-only generated migration history.

## Required Decision

Choose one conservative path:

- approve planning for a truly isolated non-production Supabase target that starts from source-aligned migration history;
- approve a later explicit migration-history repair policy only after schema equivalence evidence exists;
- keep all remote migration paths blocked.

## Boundaries

Do not create projects, branches, secrets, migrations, storage buckets, service-role routes, workers, providers, media, signed/public artifacts, or beta/production unlocks in the owner-decision packet. Any execution must be a later explicitly gated packet.
