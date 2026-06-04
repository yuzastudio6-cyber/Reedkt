# Phase 44J Artifact Scope Fixtures

Phase 44J uses synthetic artifact scope fixtures only.

Allowed fixture classes:

- Private generated/report metadata.
- Private controlled metadata.
- Private reporting/scorecard metadata.

Blocked fixture classes:

- Public artifact request.
- Arbitrary local path.
- Signed URL as source of truth.
- Missing output artifact scope.

Accepted prefixes are limited to private staging activation/reporting scopes already covered by Track B policy. Public artifacts, signed URLs as source of truth, arbitrary paths, arbitrary GCS prefixes, committed private payloads, broad media buckets, and model/audio/media payload commits remain blocked.
