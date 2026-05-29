# Repo App Boundary Plan

Phase 44A creates the app and package boundaries for a web-first ReeditPro product. Phase 44B makes `apps/web` canonical with a transitional structure while preserving the current root Vite app.

## Target Structure

```text
apps/
  web/
  desktop/
packages/
  shared/
  ui/
  platform/
  editor-core/
  compute-routing/
server/
  platform/
src/       # active web source during Phase 44B transitional mode
public/    # active public assets during Phase 44B transitional mode
index.html # active Vite entry during Phase 44B transitional mode
```

## App Split

`apps/web` is the launch path. It owns the web UI, editor shell, project dashboard, upload flow, timeline UI, artifact review UI, QA report UI, private export review UI, and later browser capability profile.

In Phase 44B, `apps/web` owns the web boundary and migration docs while root `src`, `public`, and `index.html` remain the active build inputs. The physical source move is deferred until browser UI can be separated safely from `src/backend` contracts and server build entrypoints.

`apps/desktop` is future/planned only. It may later own the desktop shell, install capability wizard, local worker bridge, local cache, and local preview tools. In Phase 44A it must not own an active Mac/Windows runtime, Tauri/Electron packages, local AI execution, installer scripts, or hardware scan execution.

## Shared Packages

`packages/shared` owns shared pure types and utilities with no server secrets and no browser-heavy logic.

`packages/ui` owns reusable UI components with no server, GCP, model, or provider code.

`packages/platform` owns product mode types, platform boundary types, and future capability profile types.

`packages/editor-core` owns timeline/editor pure logic and must not call Cloud Run, `gcloud`, or providers directly.

`packages/compute-routing` later owns `ToolRouteManifest`, `DeviceComputeProfile`, `WebCapabilityProfile`, and compute decision policy. It is not an active local worker in Phase 44A.

## Server Boundary

`server` owns activation runtime, workers, Cloud Run job orchestration, tool execution, private artifacts, model policies, cost, security, and readiness. Browser and future desktop shells consume server APIs and reports; they do not own privileged runtime behavior.
