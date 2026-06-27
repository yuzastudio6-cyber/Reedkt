# Safety Boundary

Packet: `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`

## Allowed In This Packet

- Guarded DB URL handoff through ephemeral process environment.
- Existing auth user ID readback for FK-safe generated fixture ownership.
- Transaction-scoped generated fixture inserts for approved snapshot persistence tables.
- `set local role service_role` inside the transaction.
- Readback of inserted generated fixture rows before rollback.
- Immutable approved snapshot update rejection validation.
- Post-rollback residue readback.

## Not Allowed / Not Performed

- persistent fixture rows;
- service-role HTTP route execution;
- service-role secret payload access;
- frontend service-role credential exposure;
- worker execution;
- worker dispatch;
- worker lease claim;
- provider call;
- model call;
- raw prompt execution;
- media processing;
- Remotion execution;
- FFmpeg/FFprobe execution;
- signed URL creation;
- public artifact creation;
- storage object creation;
- storage object read;
- credit mutation;
- credit reservation creation;
- job enqueue;
- job event write;
- Stripe checkout/webhook/payment processing;
- deployment;
- internal beta unlock;
- external beta unlock;
- production unlock;
- final render/export.

## No-Scope Statement

No Supabase production mutation, service-role HTTP route execution, service-role secret payload access, frontend service-role credential exposure, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, storage object creation, storage object read, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, persistent validation rows, or broad service-role handler was enabled. Remote Supabase mutation was limited to a guarded transaction-scoped generated approved snapshot persistence fixture on the single main Reeditpro staging project `wmyyttnynmteqgcdishd`; the transaction was rolled back and residue readback was `0`.
