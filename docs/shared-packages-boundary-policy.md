# Shared Packages Boundary Policy

Shared packages should make web, future desktop, and server development cleaner without moving privileged runtime ownership into shared code.

## Allowed

- shared pure types and serializable contracts;
- pure utilities;
- reusable UI components;
- product mode and platform boundary types;
- pure timeline/editor logic;
- future compute routing types and policy metadata.

## Not Allowed

- secrets or service-role credentials;
- model weights;
- GCP mutation logic;
- provider clients or provider calls;
- server worker execution;
- browser-heavy coupling inside platform-neutral packages;
- desktop runtime dependencies;
- local hardware scan execution;
- local AI execution.

## Phase 44A Rule

Phase 44A creates package boundaries only. It does not add package manifests, workspace config, dependency installs, build steps, local workers, or desktop runtime packages.
