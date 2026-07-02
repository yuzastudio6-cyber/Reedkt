# FFmpeg LGPL Build Policy

Milestone 10 Dockerfiles may declare distro `ffmpeg` and `ffprobe` packages for
developer/readiness image construction. That declaration is not final commercial
legal approval; commercial LGPL verification remains pending manual review.

Production release still requires a manual FFmpeg build and distribution review:

- confirm LGPL-safe configuration;
- record exact configure flags;
- verify no GPL or nonfree components are enabled unless a later explicit review approves them;
- document codec, patent, and distribution implications;
- keep FFmpeg/ffprobe worker-only and out of frontend runtime.

Readiness checks may run `ffmpeg -version`, `ffprobe -version`, and safe subtitle
support inspection. They must not process media or claim final LGPL compliance.
