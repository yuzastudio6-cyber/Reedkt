# Production FFmpeg LGPL Build Policy

FFmpeg and ffprobe are core worker tools, but production use must remain LGPL-safe unless a later explicit legal/build review approves otherwise.

## M10 Boundary

Milestone 10 Dockerfiles may declare distro FFmpeg packages for future human-built dev/readiness images. That declaration does not prove commercial LGPL compliance.

Readiness checks may run:

- `ffmpeg -version`
- `ffprobe -version`
- safe filter/config inspection for subtitle support

Readiness checks must not process media, render captions, export video, or claim final legal compliance.

## Future Verification Gate

Before production release, ReeditPro must record exact FFmpeg build flags, codec exposure, distribution implications, and dependency licenses. GPL/nonfree flags must not be assumed or enabled without explicit review.
