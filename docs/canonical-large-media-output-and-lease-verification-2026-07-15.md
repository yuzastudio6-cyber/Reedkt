# Canonical Large Media Output and Lease Verification — 2026-07-15

Status: `bounded_private_streaming_output_and_same_host_lease_renewal_verified_production_unverified`

## What changed

Professional-color FFmpeg output no longer has to fit inside the legacy 32 MiB
whole-output Buffer. Only approved professional-color Matroska recipes can use
the new server-injected output sink. FFmpeg stdout is streamed to a unique
server-owned private spool under a fixed runtime root while the exact source
stream is concurrently reverified by length and SHA-256.

The spool enforces a 192 MiB maximum, exact SHA-256, byte count, Matroska
signature, create-only/no-follow persistence, and identity-bound cleanup. The
same spool is reopened for FFprobe and bounded pixel analysis before its exact
stream is passed to the immutable private artifact sink. Caller paths, URLs,
bytes, commands, storage identities, and credentials are not accepted.

Legacy PCM WAV, NUT, JSON, and other bounded media paths retain their existing
buffered behavior and 32 MiB media-output compatibility limit.

## Create-only stream storage proof

`npm run smoke:canonical-private-media-streaming-output` commits a generated
34,603,145-byte Matroska-shaped stream with SHA-256
`1b0185cdf681715ccef680f53359a154d77562553829ffae1893082db7c4a7b4`.
It proves:

- create-only persistence above 32 MiB without a whole application Buffer;
- no-follow reopen, complete rehash, and format signature validation;
- exact replay without replacement;
- immutable identity collision rejection;
- buffered-reader failure for a large artifact; and
- checksum mismatch cleanup with no poisoned target.

## Canonical 4K proof

The latest `npm run smoke:canonical-private-color-execution` run produced:

- 18,874,505-byte approved 4K source;
- 57,689,613-byte streamed color intermediate, SHA-256
  `16ce99bd7421c195fe6e7c41632fcbb6e21be8bb97f8bd7d0f8e0d922dce8b18`;
- 16,894,658-byte same-attempt canonical 4K final, SHA-256
  `75179ae5add947dd86dac0451f8d1933962cb21a46aa6766d62d6e4d93a0aaee`;
  and
- four successful lease heartbeats on the long final-render attempt.

The smoke binds `longRunningLeaseHeartbeatVerified` exactly to a positive
attempt heartbeat count. A short attempt may correctly report zero; it cannot
claim long-running heartbeat proof. Generic completion recovery likewise
cannot infer transport or heartbeat evidence from an artifact alone.

## Lease behavior

The job adapter starts a server-owned heartbeat after claiming the exact
private lease. It renews at one-third of the fixed 300-second lease TTL with a
unique server-derived idempotency key. It stops and awaits any in-flight
heartbeat before adapter persistence. A heartbeat failure fails the adapter
closed. Renewal never extends the immutable approved attempt deadline.

This is same-host private runtime evidence. It is not distributed lease
coordination, process crash recovery, or production worker orchestration.

## Readiness boundary

This slice authorizes no provider calls, customer pricing, credits, wallet
mutation, billing, charging, settlement, remote Supabase, deployment,
production rendering, public delivery, external beta, or Motion Studio work.
The 50-tool catalog remains private canonical lifecycle/job-adapter verified;
it is not a production-activation claim.

## Remaining work

The principal media gaps are representative long-duration throughput,
distributed/object-store streaming and crash recovery, streaming the separate
16 MiB-capped shot-match reference dependency, broader codec/timecode/VFR/
multichannel/HDR/damaged-media coverage, and live infrastructure validation.

## Final aggregate

`npm run qa:internal-pipeline` passed 26/26 phases in 1,732,196 ms. The exact
run included the new 34,603,145-byte stream storage phase, the
57,689,613-byte canonical color intermediate, the 16,894,658-byte canonical
4K final with four render heartbeats, a 51,471,394-byte separate Remotion
stress output, 11/11 named-edit browser tests, exactly 50 canonical tool
identities, and the accepted signed-in maximum-eight-source private review.
No gated external authority was enabled.
