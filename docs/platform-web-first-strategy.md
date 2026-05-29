# Platform Web-First Strategy

Phase 44A sets ReeditPro's product boundary: web is the first launch path, desktop is a future path, and shared packages support both without weakening the server runtime. Phase 44B begins the web app structure migration by making `apps/web` canonical while the current root Vite source remains active.

## Why Web Launches First

The current activation stack is already cloud-backed and server-owned: staging Cloud Run jobs, private GCS artifacts, approval/download evidence, speech/caption, smart cut, private export, audio normalization, color correction, BiRefNet masks, text-behind-subject preview, Real-ESRGAN runtime, and SAM2 download evidence all depend on controlled backend gates.

A web-first app lets ReeditPro finish one coherent product path around those gates:

- dashboard and project state;
- upload and private artifact review;
- editor shell and timeline;
- transcript, captions, jobs, progress, QA, and export review;
- server-owned heavy tools and readiness policy.

## Desktop Later

Desktop remains important, but it should not be implemented before the web product path is finished enough to prove the workflow. Adding a second shell now would multiply packaging, installation, local capability, support, privacy, and update concerns before the core web editing experience is complete.

Phase 44A prepares the repo so desktop can be added later without forcing a framework decision now. Phase 44B keeps `apps/desktop` as a future boundary only and does not add a desktop build target.

## Cloud-Backed Editing Remains Primary

Heavy tools stay cloud-backed and server-owned for launch. The browser may request, review, and approve work, but it must not own server workers, model weights, service role secrets, Cloud Run execution, provider calls, or heavy AI tools.

Future desktop may add local preview/proxy/waveform capability and optional compute routing, but cloud-backed editing remains the primary reliable path for heavy production tools.

## Phase 44B Structure

`apps/web` is now the canonical web boundary. The active Vite entry remains `index.html`, active source remains `src`, and active public assets remain `public` until the browser UI can be separated safely from `src/backend` contracts and server build entrypoints.
