# PaddleOCR Font Config Viability

PaddleX issue metadata indicates a local font path control is available, but also warns it makes all fonts use the same file. That is enough to justify a future system-font package approval path, not enough to claim runtime proof.

Selected path: approve a future system-font package and explicit local-font configuration review. The asset-free import/config path remains a fallback if future package approval finds no safe way to configure PaddleX/PaddleOCR without fetching PingFang.

No PaddleOCR, PaddlePaddle, OCR object instantiation, OCR inference, Docker, install, or model/font asset operation ran in this phase.
