# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-10

### Added

- **Core API** — Complete namespace utility library
  - `namespace()` — Auto-vivifying namespace access
  - `getIfExists()` — Safe retrieval with optional defaults
  - `getMustExist()` — Required field validation with custom errors
  - `setValue()` — Safe assignment (refuses overwrite by default)
  - `exists()` — Path existence checking
  - `remove()` — Path removal
  - `leafNode()` — Safe initialization (set only if not exists)
  - `isNotFound()` — NotFound sentinel detection
  - `join()` — Path component joining
  - `flatten()` / `expand()` — Object flattening and expansion
  - `traverse()` — Low-level traversal with traveller pattern

- **NotFound Sentinel** — Distinguishes "path not found" from "value is undefined"
  - Frozen singleton object for reliable detection
  - `isNotFound()` helper for checking
  - `defaultValueToReturn` option for inline fallbacks

- **Safety by Default** — `setValue` refuses to overwrite unless explicitly enabled
  - `overwrite: true` — Opt-in to clobbering existing values
  - `dryRun: true` — Validate without making changes
  - `ignoreErrors: true` — Silent failure mode

- **TypeScript Support** — Full type definitions
  - Interfaces for all options objects
  - Generic support for typed namespaces

- **Dual Environment** — Works in Node.js and browsers
  - ESM (`import`) — Tree-shakeable
  - CommonJS (`require`) — Legacy compatibility
  - UMD (`<script>`) — Direct browser usage

- **Zero Dependencies** — No external packages required

- **Comprehensive Test Suite** — 97 tests covering:
  - All core functionality
  - Edge cases (null, undefined, falsy values)
  - API endpoint patterns
  - AI agent patterns

- **Documentation**
  - README with quick start and API reference
  - AGENTS.md — Guide for AI/LLM usage patterns
  - CONTRIBUTING.md — Contribution guidelines
  - Example files (`examples/api-endpoint.js`, `examples/agent-usage.js`)

[Unreleased]: https://github.com/christopherreay/node-namespace/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/christopherreay/node-namespace/releases/tag/v1.0.0
