# Private structured offline Node execution image

This image is the private, local structured-payload execution surface for the seven validated D3, ECharts, Vega-Lite, Vega, Satori, SVG.js, and Viz.js operations. It is intentionally separate from the fixed-fixture activation image and does not change that activation evidence.

The runtime accepts exactly one JSON object with `toolId`, the exact canonical `operationId`, and a bounded structured `payload`. Chart tools accept structured dimensions, labels, theme, and numeric points; Satori accepts structured card text and uses only an image-baked font; Viz.js accepts structured nodes and edges. Raw Vega specifications, DOT, HTML, SVG, JavaScript, URLs, paths, commands, environment values, secrets, mounts, and caller-selected entrypoints are not accepted.

The host execution bridge creates a fresh container for every request with network `none`, a read-only root filesystem, all capabilities dropped, `no-new-privileges`, fixed non-root UID/GID `10001`, a 64-PID ceiling, one CPU, a 768 MiB memory-and-swap ceiling, and a 64 MiB `noexec,nosuid,nodev` tmpfs. It supplies no bind mounts, caller environment, command, or entrypoint override. Returned SVG and verification JSON are decoded, hashed, and semantically verified in memory.

The image reuses `docker/prod/offline-node-runner/package-lock.json`; it does not create or modify the repository root lockfile. Private checksum attestations persist hashes and confinement/runtime evidence only, never payload or SVG bytes.

This remains private-internal evidence. Product, external-beta, and production readiness are false because the pinned Debian image has known unresolved vulnerability findings and no deployed worker-fleet, service-identity, observability, recovery, multi-architecture, or end-to-end evidence exists.

Run the isolated build, deterministic execution, adversarial rejection, and checksum-attestation smoke from the repository root:

```sh
npm run smoke:offline-node-structured-execution
```
