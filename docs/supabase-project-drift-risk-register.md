# Supabase Project Drift Risk Register

Prompt 24 records the risks a future read-only Supabase project audit must check. This register is not evidence that the risks are present; it is an inspection checklist.

| Risk | Severity | Likelihood | Evidence needed | Mitigation | Owner | Go/no-go impact |
| --- | --- | --- | --- | --- | --- | --- |
| Repo migrations not applied remotely | Critical | Medium | Applied migration filenames and timestamps. | Compare Supabase state to migration order before staging execution. | Supabase reviewer | Blocks staging sync. |
| Staging and production confused | Critical | Medium | Redacted project identity, region, and environment label. | Require distinct environment confirmation. | Human owner | Blocks all execution. |
| RLS disabled remotely | Critical | Medium | RLS-enabled and RLS-disabled table lists. | Block staging validation until policy state is reviewed. | Supabase reviewer | Blocks staging and production. |
| Storage bucket public unexpectedly | Critical | Low | Bucket public/private status. | Block storage validation until bucket privacy is corrected. | Supabase reviewer | Blocks storage and beta. |
| Auth redirect misconfigured | High | Medium | Auth provider and redirect domain summary. | Correct redirect configuration in an approved future change. | Auth owner | Blocks auth staging tests. |
| Service-role key exposed | Critical | Low | Redacted access/key handling summary. | Rotate key and perform security review. | Security owner | Blocks all beta work. |
| Dashboard inactivity misread as project failure | Medium | High | Activity gap analysis and milestone sync matrix. | Treat inactivity as expected until approved Supabase actions run. | Reviewer | Does not block if explained. |
| Local validation overtrusted | High | Medium | Local-vs-staging evidence separation. | Keep Prompt 20B-Retry local evidence local-only. | Reviewer | Blocks staging claims. |
| Production data accidentally used in staging | Critical | Low | Fixture plan and data source confirmation. | Require synthetic fixtures only. | Data owner | Blocks staging execution. |
| Untracked manual dashboard changes | High | Medium | Activity logs and settings diff summary. | Record drift and require review before execution. | Supabase reviewer | Blocks if unexplained. |
| Edge function drift | Medium | Medium | Function list and deployment status. | Reconcile deployed functions with repo expectations. | Backend owner | Blocks runtime claims. |
| Migration drift | Critical | Medium | Migration list and schema summary. | Require migration review before staging SQL. | Supabase reviewer | Blocks staging and production. |

