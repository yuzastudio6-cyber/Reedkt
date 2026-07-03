# Font Package Presence Report

`fonts-noto-cjk` was present in the rebuilt image at version `1:20240730+repack1-1`. `fonts-noto-cjk-extra` was absent.

Noto CJK font files were discovered under `/usr/share/fonts/opentype/noto/`, including regular and bold Sans/Serif TTC files. `fc-list` was unavailable in the image, so filesystem discovery supplied the bounded font evidence. No PingFang file was present or used.
