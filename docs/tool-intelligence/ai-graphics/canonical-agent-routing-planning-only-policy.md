# Canonical Agent Routing Planning-Only Policy

Allowed now: agent planning/study metadata selection.

Blocked now:

- Tool execution remains blocked.
- Tool Route execution remains blocked.
- Worker execution remains blocked.
- Provider/model runtime remains blocked.
- Browser/WebGL/canvas runtime remains blocked.
- GPU runtime and model weights remain blocked.
- Supabase, SQL, and GCS mutation remain blocked.
- Signed URL and public artifact creation remain blocked.
- Internal beta, external beta, and production remain blocked.

The agent can rank candidates and write planning recommendations. It cannot execute tools or produce public/private runtime artifacts in this lane.
