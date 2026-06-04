# Phase 44E Desktop Capability Schema

The desktop capability schema records these coarse categories only:

- `environment`: runtime kind, OS platform bucket, architecture bucket, packaged/dev status, sandbox/context-isolation buckets.
- `compute`: available parallelism bucket, total/free memory buckets, architecture bucket, redacted CPU model class, process CPU usage availability flag.
- `graphics`: GPU availability and class buckets only; exact GPU identity is never persisted.
- `mediaRuntime`: ffmpeg, ffprobe, Sharp, Python availability and major-only Node/Electron version buckets.
- `storage`: temp-dir writability and free-disk bucket; no directory scanning or path list collection.
- `policy`: privacy/fingerprinting risk, route-planning allowance, worker/cost execution blocks, route manifest version, and upload block.

Route hints are planning hints only. They cannot enable route execution, worker execution, blocked tools, public artifacts, provider calls, beta, production, or Track A.
