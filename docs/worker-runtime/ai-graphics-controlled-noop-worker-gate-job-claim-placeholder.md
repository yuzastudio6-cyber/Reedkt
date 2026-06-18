# AI Graphics Controlled No-Op Worker Gate Job Claim Placeholder Policy

Future controlled no-op validation may inspect placeholder job claim fields
only. It must not claim, reserve, mutate, lease, dequeue, or execute a real
Worker job.

Required placeholder policy:

- job claim references remain synthetic or placeholder-only.
- idempotency and approved snapshot references remain metadata fields.
- claim status must be no-op/static validation only.
- real job claim and live Worker execution approvals remain `false`.
