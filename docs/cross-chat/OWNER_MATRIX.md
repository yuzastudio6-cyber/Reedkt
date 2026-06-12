# Owner Matrix

| Workstream | Current owner action | Merge hygiene note |
| --- | --- | --- |
| Cross-chat coordination | Review canonical merge order and duplicate risk register | This PR owns audit metadata only |
| Foundation/Supabase | Confirm clean-staging and Track B parent chain before merge | No Supabase writes or migrations are authorized here |
| Product internal testing | Merge parent PRs before session and start-gate children | Internal testing remains restricted metadata/readiness scope |
| Model orchestration | Confirm Qwen/DeepSeek evidence chain before plan snapshot children | Provider calls remain outside this audit |
| Worker runtime | Hold draft worker no-op PRs until parent chain and draft status are resolved | No worker, Docker, Cloud Run, tool, or route execution is authorized |
| Track A creative graphics | Review parallel creative graphics lanes before merge | Runtime and media execution remain blocked |
| SUPABASE_SOUND audio harness | Review audio/SoundSync harness ancestry and duplicates | Audio runtime and Supabase mutation remain blocked |
