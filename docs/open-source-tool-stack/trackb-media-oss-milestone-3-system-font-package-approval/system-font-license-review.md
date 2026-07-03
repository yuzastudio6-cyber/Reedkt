# System Font License Review

The reviewed Debian/Noto sources identify the Noto CJK package license path as SIL Open Font License 1.1. This is a safer next gate than staging exact `PingFang-SC-Regular.ttf`, whose standalone license, redistribution rights, checksum, and private staging rules remain unproven.

Future execution should install `fonts-noto-cjk` from the Debian/Ubuntu package manager inside the OCR runtime image. The repo must not commit font binaries, model files, private assets, public artifacts, or signed URLs.
