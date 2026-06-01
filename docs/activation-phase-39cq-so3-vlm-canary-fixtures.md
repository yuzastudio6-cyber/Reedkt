# Phase 39C-Q-SO3 Canary Fixture Policy

SO3 adds five deterministic generated fixtures:

- `canary-basic-shapes`
- `canary-colored-layout`
- `canary-text-and-shape`
- `canary-ui-simplified`
- `canary-caption-safe-zone-simple`

The canaries are synthetic and generated inside the worker. They are not committed as image payloads. They use simple visual concepts and coarse regions so the phase can separate perception capability from box-coordinate precision.

The worker uses coarse zones only for first-pass QA:

- `top`
- `bottom`
- `left`
- `right`
- `center`
- `lower_third`
- `upper_third`

Normalized boxes are deliberately not required for canary pass. Full object-region and safe-zone QA can only run after the canary gates pass.
