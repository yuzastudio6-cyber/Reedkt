# Production Container Qualification Candidate Contract

Status: bounded source contract and built probe entrypoint implemented; no production container was built or run; production qualification remains blocked.

## Corrected defect

The prior human-run Docker examples invoked `prod:readiness:summary -- --mode=static_only` inside each image. That command only reread source declarations, so it could not prove that the running image actually contained the required binaries or packages. It also depended on `tsx`, which is a development dependency omitted by `npm ci --omit=dev` in the production images.

The corrected path builds a separate production artifact:

`dist-server/container-readiness-receipt.js`

Human-run examples invoke this artifact directly with Node. They no longer call the static summary and no longer require `tsx` in the image.

## Human-run confinement

Each role-specific plan now requires:

- an immutable `name@sha256:digest` image reference;
- exact 40-character source commit and tree hashes;
- `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`;
- `REEDITPRO_READINESS_MODE=container_runtime`;
- no network;
- read-only root filesystem;
- all Linux capabilities dropped;
- no-new-privileges;
- a non-root UID/GID;
- no volume or user-media mount;
- model downloads and inference explicitly disabled.

The API, CPU, GPU, render, QA, and tool-readiness roles each receive a source-owned probe plan derived from the canonical image manifest and 72-tool readiness specs. The executor can run only fixed version/capability commands, fixed Python imports, and fixed Node package-metadata resolution. It accepts no caller-selected command, shell, URL, path, provider, prompt, media, model, or credential.

Raw command output, resolved local paths, provider data, and errors are not projected. Only bounded evidence hashes and sanitized status are retained.

## Evidence classes

The runtime emits `production-container-qualification-candidate-v1` with evidence class:

`container_runtime_self_attested_candidate_unreleased`

It records exact source/image/manifest/probe identities; required-tool and forbidden-tool outcomes; confinement assertions; and an integrity hash. It is deliberately not `production-container-qualification-receipt-v1` authority.

The candidate always retains:

- `manualLicenseAndModelGatesVerified = false`;
- `productionImageQualified = false`;
- `externalBetaReady = false`;
- `productionReady = false`.

The source-only contract verifier recomputes manifest, plan, checks, coverage, and receipt hashes and can compare an expected source/image identity. Its evidence class is `source_verified_contract_fixture_unreleased`; even an exact match remains non-promotable. A later independently reviewed live verifier must bind the actual build source and immutable image digest and separately consume approved FFmpeg/libass/model/license evidence before a production qualification can exist.

## Cost and commercial boundary

The local/container readiness probe is not metered as production execution and cannot fabricate cost evidence. It records that readiness-probe infrastructure cost is unmetered and non-promotable. Provider cost, customer price, customer credits, ReEditPro service fee, wallet mutation, and billing remain excluded.

## Verification

- `npm run build:server`
- `npm run smoke:prod-container-qualification-contract`
- `npm run smoke:prod-readiness-validation`
- `npm run smoke:prod-container-readiness`
- `npm run smoke:production-server-artifact`
- `bash -n scripts/docker/prod/09-run-container-readiness-cpu.example.sh scripts/docker/prod/10-run-container-readiness-render.example.sh scripts/docker/prod/11-run-container-readiness-qa.example.sh scripts/docker/prod/12-run-container-readiness-gpu.example.sh scripts/docker/prod/13-run-all-container-readiness.example.sh`
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary`
- `npm run check:secrets`

The adversarial smoke proves immutable-reference enforcement, exact six-role plans, required/forbidden coverage, semantic and manifest tamper rejection, source mismatch reporting, non-promotion after exact fixture verification, static-report isolation, script confinement, no `eval`, and absence of provider/cloud/model-download/deployment code paths.
