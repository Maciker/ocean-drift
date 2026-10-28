# Architecture

This boilerplate is framework-agnostic. The example source is a minimal TypeScript package.

## Suggested boundaries for larger projects

```text
src/domain          pure domain logic
src/application     use cases
src/infrastructure  adapters and external systems
src/api             delivery layer
```

## Dependency direction

Outer layers may depend on inner layers. Inner layers must not depend on outer layers.
