# Living Frame ComfyUI hardened archive scan evidence

Status date: 2026-07-30

Status:
`archive_input_verified_scan_incomplete`

## Result

The sanitized local hardened image was serialized once with `docker save`.
The completed private tar was independently hashed before scanning:

```text
source image:
sha256:d4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd

archive bytes:
12,657,311,744

archive SHA-256:
bc37a857b7c962df846d4f61874feb6f100b5a1f4bdf7e53798c95bec509fe06
```

Docker Scout `1.20.4` then received the exact archive through its
`archive://` input with `linux/amd64` selected. Cache and temporary workspace
were redirected to a private backup volume.

## Bounded outcome

The scanner began reading the archive and materialized a non-empty private
scratch workspace. It did not create a SARIF report within the 1,200-second
bound. The process was terminated at the boundary and returned `255`.

Therefore:

```text
archive input verified: true
full image scan completed: false
vulnerability clearance: false
```

This narrows the remaining scanner dependency: a Linux scanner host with fast
local storage is required. The result must not be represented as an image
scan, vulnerability clearance, or L4 admission.

## Cleanup

Scout pruned its incomplete temporary data. The exact 12.657 GB archive and
the private scan root were deleted after their byte length and digest were
recorded. The backup volume returned to its pre-attempt free capacity. These
temporary generated artifacts are not recoverable.

The sanitized Docker image remains available for later controlled transfer to
the qualified Linux scanner host.

## Authority boundary

No model weights, prompts, source media, credentials, provider requests, GPU
attempts, generated assets, cost receipts, dispatch, billing, public delivery,
or production authority were involved.
