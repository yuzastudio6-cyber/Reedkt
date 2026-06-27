# Qwen2.5-VL Private Invoke CPU Caller

This source package is the CPU-only internal caller harness for the future Qwen2.5-VL private invoke contract smoke.

It contains:

- no GPU requirement;
- no Qwen model weights;
- no model import on startup;
- no vLLM runtime;
- no inference route;
- no media processing;
- no Supabase or SQL access;
- no provider calls;
- no signed URL or public artifact path;
- no credit mutation.

By default, `internal_caller.py` prints redacted status and exits without fetching an identity token or sending a request. A future approved deploy/execution prompt must explicitly set the execution gate and provide target/audience values inside the Cloud Run Job runtime.
