# Private offline Node runner activation image

This image is a private, local activation/evidence surface for six fixed Node-library operations: D3, ECharts, Vega-Lite, Vega, Satori, and Viz.js. It is not a general-purpose tool container and it is not a production-ready worker.

The runtime protocol accepts one JSON object on standard input with exactly `toolId` and the canonical `operationId`. The image accepts no payload, path, URL, command, environment, credential, source mount, or caller-selected entrypoint. Each identity maps to a baked, server-owned deterministic fixture and invokes `runOfflineNodeToolOperation`.

The host activation service builds from the digest-pinned Node base and this directory's exact lockfile, removes package-manager tooling from the runtime stage, then creates a fresh container for every positive and adversarial case. It verifies the effective Docker configuration before execution: network `none`, read-only root filesystem, all capabilities dropped, `no-new-privileges`, UID/GID `10001`, 64 PIDs, one CPU, a 768 MiB memory-and-swap ceiling, and a 64 MiB `noexec,nosuid,nodev` tmpfs. No source or host bind mount is used.

Run the no-argument activation CLI from the repository root:

```sh
npx tsx server/cli/activate-offline-node-runners.ts
```

Run the build-and-execution smoke:

```sh
npx tsx server/smoke/offline-node-runner-container-activation-smoke.ts
```

The service writes a checksum-protected, mode-`0600` attestation below a mode-`0700` private-local root in `/tmp`. Artifact bytes and adversarial caller values are not persisted. The attestation intentionally keeps `productReady`, `externalBetaReady`, and `productionReady` false and does not change canonical dispatch authority.
