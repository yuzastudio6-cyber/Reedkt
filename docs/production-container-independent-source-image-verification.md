# Production Container Independent Source/Image Verification

This boundary closes one specific evidence gap: a retained in-container readiness candidate can now be checked against the exact clean Git commit/tree and the exact immutable local Docker image metadata without building, pulling, running, pushing, deploying, or promoting an image.

## Evidence progression

1. The image is built by a human from an exactly clean checkout. The build scripts derive the commit and tree themselves, pass them as build arguments, and every production Dockerfile records them as OCI labels.
2. Worker server artifacts are built inside the image from that source. Production worker templates no longer copy a caller-prebuilt `dist-server`, and the render template no longer copies the obsolete mock Remotion worker artifact.
3. A confined in-container probe emits `production-container-qualification-candidate-v1`. This remains self-attested and non-promotable.
4. The host verifier revalidates the candidate, reads `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, and exact porcelain status, verifies the Docker context is a local Unix/named-pipe endpoint, and runs only `docker image inspect` for the candidate's immutable reference. It then repeats the Git identity/status observation and fails if source changed during inspection.
5. The verifier requires a matching repository digest and these exact OCI labels:
   - `org.opencontainers.image.revision`
   - `io.reeditpro.source.tree`
   - `io.reeditpro.image.role`
   - `io.reeditpro.build.source.clean=true`
   - `io.reeditpro.container.qualification.candidate.version=production-container-qualification-candidate-v1`
6. A successful check emits `production-container-qualification-host-verification-v1` with evidence class `local_host_source_image_verification_unreleased`.
7. Script 15 may turn that receipt into one exact manual qualification review package. Package preparation does not accept the review or promote the image.

## Deliberately closed gates

The host receipt always records all of the following as false:

- manual license/model gates verified;
- production image qualified;
- deployed release qualified;
- external beta ready;
- production ready.

It is not consumed by the static production-readiness report. It lists the runtime-observed tools still requiring the later reviewed manual qualification step. Model weights, source-install review, FFmpeg/libass distribution review, deployment, service identity, private storage, observability, and release approval remain separate evidence.

The next source-owned artifact is documented in `production-container-manual-qualification-review-package.md`.

## Human-run commands

From the exact clean source checkout:

```bash
npm run build:container-readiness-host-verifier
REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION=true \
REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE=/private/path/candidate.json \
bash scripts/docker/prod/14-verify-container-readiness-candidate.example.sh
```

Keep the candidate outside the repository so the clean-worktree check remains exact. The input must be one non-symlink regular file between 1 byte and 2 MiB.

## Safety and confidentiality

The verifier uses bounded `execFileSync` calls with no shell. It performs local Git reads plus Docker context/image inspection only. Raw Git status, Docker inspection JSON, Docker endpoint, repository path, local paths, credentials, provider bodies, and media are not projected into the receipt. Only hashes and bounded safe identities are retained. The receipt keeps provider/infrastructure internal cost separate from customer price, credits, service fee, wallet, and billing.
