# Safety Boundary

Packet: `RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1`

## Allowed Runtime

Allowed only when `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME=true`:

- controlled tester staging API product-flow smoke for `aiediting@reeditpro.com`;
- bounded Qwen approved-snapshot job orchestration runtime fixture using the existing accepted runner;
- sanitized local `/tmp` reports and checksums.

## Still Blocked

- additional tester expansion;
- broad public access;
- Supabase mutation;
- SQL execution;
- worker dispatch or execution;
- signed URL creation;
- public artifact creation;
- persistent credit mutation or credit spend;
- Stripe checkout, webhook, or payment processing;
- browser capture;
- private media or user media processing;
- final render/export;
- Remotion execution outside existing source evidence;
- FFmpeg/FFprobe execution;
- Docker execution;
- deployment or Cloud Run service update;
- internal beta broad unlock, external beta global unlock, paid production unlock, production unlock, or final delivery/export.

This packet may execute a bounded Qwen provider/model runtime fixture through existing accepted runner evidence only. It must not broaden provider/model access beyond that fixture.
