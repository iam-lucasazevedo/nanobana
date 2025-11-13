# nanobanana Constitution

## Core Principles

### I. Simplicity

Clarity and minimal abstraction MUST guide all design decisions. Do not add features, layers, or complexity until there is a concrete need. Favor straightforward, understandable code over clever abstractions. Avoid over-engineering; prefer readable solutions even if they require more explicit code. This principle prevents technical debt and keeps the codebase maintainable as it grows.

### II. Integration Testing

Comprehensive integration testing is mandatory for all inter-service communication, library contracts, and shared schemas. Every new library must have contract tests; every contract change must be tested; all data exchanges between services require integration tests. Integration tests verify real-world interactions, not just unit behavior. They catch breaking changes and ensure all services understand each other correctly.

### III. Versioning & Breaking Changes

All releases MUST follow MAJOR.MINOR.PATCH semantic versioning. Any breaking change to public APIs or data contracts MUST increment MAJOR. Backwards-compatible features increment MINOR. Bug fixes and patches increment PATCH. Breaking changes must be clearly documented and communicated; migration paths SHOULD be provided. Version bumps indicate the stability and compatibility guarantee of each release.

## Governance

This constitution is the source of truth for development practices. All development decisions should be guided by these principles. Deviations are permitted when justified by business or technical constraints, but such justifications MUST be documented and visible to the team.

Amendments to this constitution require:
- Clear documentation of what is changing and why
- Update to the version number (using semantic versioning rules)
- A note in "Last Amended" date
- Review of all dependent artifacts (.specify templates and runtime guidance)

This constitution supersedes ad-hoc practices. When in doubt about how to proceed, consult these principles.

**Version**: 1.0.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-13
