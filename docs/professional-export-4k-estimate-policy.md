# Professional Export And 4K Estimate Policy

## Interim Product Rule

Every ReEditPro edit estimate is calculated with a 4K UHD render/export cost ceiling before the user approves the edit plan. The estimate is not recalculated at export.

The approved edit reservation covers one approved deliverable at any of these profiles within the confirmed aspect ratio:

- 1080p Full HD (`hd_1080`)
- 2K / 1440p (`qhd_1440`)
- 4K UHD (`uhd_2160`)

The default and cost-basis profile is 4K UHD. Product Edit Level does not reduce output quality; Normal, Premium, and Ultra Premium use the same professional delivery ceiling.

Edit Brief keeps the legacy platform/delivery preset as a compatibility and safe-zone choice, while `resolutionProfileId` selects the professional output frame independently. New deterministic recommendations default to 4K; the user may select 1080p or 2K without a second credit prompt.

## Exact Frames

| Aspect ratio | 1080p | 2K / 1440p | 4K UHD |
|---|---:|---:|---:|
| 16:9 | 1920×1080 | 2560×1440 | 3840×2160 |
| 9:16 | 1080×1920 | 1440×2560 | 2160×3840 |
| 1:1 | 1080×1080 | 1440×1440 | 2160×2160 |
| 4:5 | 1080×1350 | 1440×1800 | 2160×2700 |
| 4:3 | 1440×1080 | 1920×1440 | 2880×2160 |

All profiles use even dimensions. The estimate uses the 3840×2160 pixel count as a conservative universal 4K cost basis even when the confirmed aspect ratio has fewer output pixels.

## Credit Authority

- The initial estimate contains a required, non-removable `4K UHD render and export ceiling` line.
- Its internal tool-cost component excludes the ReEditPro service/edit fee. Service-fee math remains separate.
- Approval reserves the high estimate once.
- Final export must present the approved estimate ID, the same active reservation ID, the approved deliverable identity, confirmed aspect ratio, approved FPS/duration, and a covered resolution profile.
- Export must not create another estimate, reserve credits again, or mutate the wallet a second time.
- Lowering the selected delivery from 4K to 2K/1440p or 1080p does not create a customer refund or a new charge at export. Final reconciliation follows the approved reservation policy.
- Provider/runtime variance beyond approval is absorbed by ReEditPro unless a materially revised scope was approved before the extra work.

An aspect-ratio, FPS, or duration change outside the approved timing tolerance; an additional deliverable; a custom frame outside these profiles; or a frame above the 4K ceiling is revised scope and must return to planning/approval. It is not an export-time surcharge.

## Source Quality

Final export reads the immutable source master before any analysis proxy. A proxy may support review but is not silently substituted for the final source.

ReEditPro may encode a low-resolution source into a 4K container, but it must disclose that this does not restore detail. Enhancement is a separate approved operation with explicit asset lineage and QA; it is not implied by selecting 4K.

## Current Evidence Boundary

`smoke:professional-export` proves the profile map, shared rate-card units, one-estimate/no-second-charge contract, reservation mismatch rejection, out-of-scope frame rejection, and a real private FFmpeg output probed at exactly 3840×2160.

`smoke:canonical-private-color-execution` now proves the same rule through the canonical private workflow. The immutable plan freezes an exact aspect-ratio-specific 4K master frame, `uhd_2160` delivery and estimate authority, source-master policy, and reuse of the original approved estimate and reservation. A real 3840×2160 source is uploaded and probed, processed through the approved lossless color intermediate, composed with the exact approved caption and replacement voice dependencies, encoded as a private H.264/AAC 3840×2160 master, independently probed, reconciled, replayed, and downloaded by hash. Substituting a 2K frame or changing the estimate, reservation, or additional-charge authority fails before execution.

The canonical private review and the private download consume the exact same QA-passed 4K master artifact. There is no second export estimate, second reservation, export-time wallet mutation, or customer charge. A future review proxy may be derived as an optimization, but it must never replace the immutable source/master path or become delivery authority.

This is private/local backend evidence. Public delivery, deployment, remote storage, production billing, provider activation, and production rendering remain gated.
