# Desktop App Deferred Roadmap

Desktop is a future product path, not a Phase 44A implementation target.

## Later Phases

- Desktop framework decision: choose Tauri, Electron, or another shell only after the web path proves the core workflow.
- Install capability wizard: explain local capabilities, privacy, disk usage, and cloud fallback before any local scans.
- Local worker sidecar: introduce an approved sidecar only for bounded local tasks.
- Mac app: package a Mac shell after framework, update, signing, local cache, and support policies are ready.
- Windows app: package a Windows shell after shared assumptions are validated.
- Local compute routing: decide when a task can use local preview/proxy/waveform capability or must stay cloud-backed.
- Local/cloud fallback: keep cloud editing reliable when local capability is absent, declined, or blocked.

## Phase 44A Boundary

Do not install desktop framework packages, create an active desktop runtime, run local hardware scans, add installer scripts, implement a local worker, run local AI, or make desktop part of launch readiness in Phase 44A.
