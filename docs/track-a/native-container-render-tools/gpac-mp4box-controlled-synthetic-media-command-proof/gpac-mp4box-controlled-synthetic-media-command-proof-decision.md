# GPAC/MP4Box Controlled Synthetic Media Command Proof Decision

Decision: `tracka_gpac_mp4box_controlled_synthetic_media_command_proof_passed_ready_for_qa_review`

Accepted proof:

- render-worker image build passed;
- generated synthetic SRT input was created in `/tmp`;
- `MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4` passed;
- output MP4 size was 857 bytes;
- output SHA-256 was `afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8`;
- `MP4Box -info generated-synthetic-subtitle-only.mp4` passed;
- info output reported one `sbtl:tx3g` track and `GPAC-26.02-rev0-g118e60a90-HEAD`;
- cleanup passed.

Not accepted: user/private/real media, arbitrary media probing, render/export, worker integration, product runtime, beta, or production readiness.

Product-ready local OSS tools remain `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains excluded. Supabase classification: no write / environment none / SQL none / migration no.

Next prompt: `TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-QA-1`.
