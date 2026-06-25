# API Route Contracts

This phase adds disabled route metadata for future Track B tool-call validation, queueing, and status reads.

All routes are `backend_required` and `disabled`; the mock router will fail closed before any handler execution. This is intentional. The routes document the lane without making Track B tools callable.
