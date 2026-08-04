# Production Container Manual Qualification Review Package

This source-only package converts one retained `production-container-qualification-host-verification-v1` receipt into exact human review input. It does not record or accept a legal, model, source-install, security, quality, image, release, beta, or production decision.

## What it binds

The package re-verifies the exact clean commit/tree before and after generation and binds:

- the host-verification and in-container candidate receipt hashes;
- immutable image reference, digest, and image role;
- every required or runtime-observed optional tool;
- the exact source registry profile digest for each tool;
- declared package license, family, risk, commercial-use state, distribution risk, and current policy findings;
- model-weight requirement plus the exact placeholder/review template digest where applicable;
- the four current GPU source-install review items where actually observed in the image;
- one immutable tool inventory and package hash.

For every observed tool, package-release review remains required even when the source registry currently describes a permissive license. Runtime presence is evidence of installation only, not legal or release approval.

## Required later human evidence

The package states that a later reviewed authority must provide, as applicable:

- exact package/source version and checksum;
- reproducible install evidence and an SBOM;
- license text provenance plus commercial-use, distribution, and attribution decisions;
- exact checkpoint/model/tokenizer identity and checksum;
- separate model-card license/commercial decision;
- separate security and quality qualification.

No reviewed-decision schema or insertion path exists in this slice. That is intentional: caller-authored JSON cannot promote an image.

## Human-run preparation

Keep the host receipt outside the repository and run from its exact clean source commit:

```bash
npm run build:container-readiness-host-verifier
REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION=true \
REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE=/private/path/host-verification.json \
bash scripts/docker/prod/15-prepare-container-manual-review-package.example.sh
```

The command reads one regular non-symlink file no larger than 2 MiB. It performs local Git identity/status reads only. It does not invoke Docker, call a provider, read a secret payload, mutate cloud/database state, bill a customer, or deploy.

## Readiness truth

The emitted evidence class is `source_generated_image_bound_manual_review_package_non_promotable`. It always records:

- `reviewerDecisionAccepted = false`;
- `manualLicenseAndModelGatesVerified = false`;
- `sourceInstallGatesVerified = false`;
- `productionImageQualified = false`;
- `deployedReleaseQualified = false`;
- `externalBetaReady = false`;
- `productionReady = false`.

Internal provider/infrastructure production cost remains separate from future customer price, credits, service fee, wallet, and billing.
