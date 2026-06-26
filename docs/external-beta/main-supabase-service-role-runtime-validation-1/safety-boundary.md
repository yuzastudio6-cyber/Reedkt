# Safety Boundary

Packet: `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`

## Allowed In This Packet

- Guarded migration apply for `20260626233000_external_beta_public_grant_hardening.sql` on `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Read-only migration dry-run readback.
- Read-only public/worker-runtime lint readback.
- Read-only storage lint readback with managed-storage warnings allowed.
- Read-only catalog grant validation.

## Not Allowed / Not Performed

- production Supabase mutation;
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

No Supabase production mutation, service-role HTTP route execution, service-role secret payload access, frontend service-role credential exposure, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, storage object creation, storage object read, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled. Remote Supabase mutation was limited to guarded public grant hardening migration apply on the single main Reeditpro staging project `wmyyttnynmteqgcdishd`.
