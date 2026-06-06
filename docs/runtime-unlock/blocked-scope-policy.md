# Blocked Scope Policy

The following remain blocked by default:

- tools, workers, models, providers, media processing
- web search execution, browser capture, map rendering
- Docker and Cloud Run execution
- SQL migrations, schema changes, and RLS changes
- production, external beta, paid production, broad media
- public artifacts
- signed URLs as source of truth
- raw prompt execution

Raw prompt execution remains blocked as a direct execution path forever. Future
workers must execute approved plan snapshots only.

Signed URLs remain blocked as source of truth forever. A later phase may approve
temporary access links, but those links cannot replace private manifests,
approved snapshots, milestone rows, or `gs://` artifact references.
