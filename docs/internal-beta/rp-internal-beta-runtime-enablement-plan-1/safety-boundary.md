# RP-INTERNAL-BETA Runtime Enablement Safety Boundary

This packet is docs/status/diagnostics-only.

## Not Enabled

- remote Supabase mutation;
- SQL execution;
- service-role handler execution;
- approved snapshot persistence;
- credit reservation creation, spend, release, or refund;
- Stripe checkout, webhook, or payment processing;
- job enqueue, job event write, worker lease claim, worker heartbeat, worker dispatch, or worker execution;
- provider/model calls, model calls, raw prompt execution, or Secret Manager payload access;
- Remotion execution, FFmpeg execution, FFprobe execution, media processing, preview artifact creation, final render/export, or final delivery;
- storage object creation/read, signed URL creation, public artifact creation, GCS/private artifact access, or browser capture;
- internal beta unlock, external beta unlock, paid production, production unlock, broad media, or public artifacts.

## Negative Gates That Must Stay Active

- no generation before approved plan and credit approval;
- no credit spend without reservation;
- no frontend/direct provider calls;
- no worker execution from raw chat;
- no public artifacts or signed URLs without policy;
- Basic/Pro no-Veo;
- Premium Veo final-fallback-only.

Any future runtime enablement PR must prove these gates before and after the runtime change.
