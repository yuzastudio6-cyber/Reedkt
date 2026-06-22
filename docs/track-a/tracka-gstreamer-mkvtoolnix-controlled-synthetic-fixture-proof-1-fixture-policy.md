# TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 Fixture Policy

Fixture policy status: `controlled_synthetic_only`

Approved fixture sources:

- GStreamer: in-memory `fakesrc` buffers into `fakesink`.
- MKVToolNix: generated text-only `/tmp` subtitle fixture `synthetic.srt`.

Blocked fixture sources:

- private/user media
- uploaded ReeditPro customer media
- GCS/private artifacts
- signed URLs
- public artifacts
- browser captures
- rendered/exported media
- FFmpeg/FFprobe generated fixtures

## Generated Fixture Inventory

| artifact | committed | bytes | sha256 |
| --- | --- | ---: | --- |
| `synthetic.srt` | `no` | `69` | `c2ebd06b54f89e74f2fc71eff1c044bac9919d872b2bf989506789742cf0746b` |
| `synthetic-subtitle-only.mkv` | `no` | `5816` | `8a6bf722a2c5e71665fac49a0c8b4baf33c6c9bfacacd1815e1819e864109fcb` |

Private/user media used: `false`

Generated artifacts committed: `none`

Supabase update required: `none`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
