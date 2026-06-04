# Phase 44F Desktop Benchmark Source Research

Accessed: 2026-06-04

Phase 44F uses official Node.js documentation as source evidence and records only bounded generated benchmark metadata.

- Node.js perf_hooks: timing APIs such as performance.now and mark/measure support bounded timing measurement.
- Node.js worker_threads: worker threads are intended for CPU-intensive JavaScript; Phase 44F keeps parallel fixtures optional, capped, and skipped by default.
- Node.js crypto: generated tiny-buffer hash fixture evidence; no media/model/user data is hashed.
- Node.js fs: temp-file write/read/delete policy evidence; Phase 44F uses generated temp files only.
- Node.js os: availableParallelism and memory context evidence; exact CPU model strings remain blocked/redacted.

Sources:

- https://nodejs.org/api/perf_hooks.html
- https://nodejs.org/api/worker_threads.html
- https://nodejs.org/api/crypto.html
- https://nodejs.org/api/fs.html
- https://nodejs.org/api/os.html
