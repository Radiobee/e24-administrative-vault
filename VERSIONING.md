# Versioning Policy

## v1.0.x Series — Frozen

- **v1.0.0** is immutable.
- No commits may modify behavior, scope, or guarantees of v1.0.0.
- Any changes require a new version tag:
  - **v1.0.1** — Documentation-only or non-functional changes
  - **v1.1.0** — New functionality (opt-in only)

## Guarantees preserved in v1.0.0

- Local-only execution
- No telemetry
- No background services
- User-invoked execution only

Breaking changes require a major version bump.
