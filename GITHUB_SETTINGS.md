# GitHub Repository Settings

These are the recommended settings for the GitHub repository. You'll need to configure these manually in the GitHub web interface.

## Repository Description

**Description:**
```
Zero-dependency JavaScript namespace utilities — auto-vivification, NotFound sentinel, and safety-by-default design for Node.js and browsers
```

**Website:**
```
https://github.com/christopherreay/node-namespace#readme
```

## Topics (Tags)

Add these topics to help people discover the repository:

```
javascript, namespace, dotted-path, object-path, auto-vivification, deep-get, 
deep-set, nested-objects, configuration, zero-dependency, typescript, nodejs, 
browser, utility-library
```

## README Preview

The repository currently has:
- ✅ README.md — Quick start, API reference, examples
- ✅ AGENTS.md — AI/LLM usage guide
- ✅ CONTRIBUTING.md — Contribution guidelines
- ✅ CHANGELOG.md — Version history
- ✅ LICENSE — MIT License
- ✅ examples/ — Runnable example files

## Releases

To create a GitHub Release:

1. Go to https://github.com/christopherreay/node-namespace/releases
2. Click "Draft a new release"
3. Choose tag: `v1.0.0` (create new tag)
4. Target: `main` branch
5. Release title: `v1.0.0 — Initial Release`
6. Description:

```markdown
## namespace v1.0.0

Zero-dependency dotted-path namespace utilities for JavaScript.

### Features

- **Auto-vivification** — Create nested objects automatically
- **NotFound Sentinel** — Distinguish "not found" from "undefined"
- **Safety by Default** — `setValue` refuses to overwrite unless explicit
- **TypeScript Support** — Full type definitions
- **Dual Environment** — Node.js and browser compatible
- **97 Tests** — Comprehensive test coverage

### Installation

```bash
npm install @namespace-js/core
```

### Quick Start

```javascript
import namespace from '@namespace-js/core';

const config = {};
namespace.setValue(config, 'server.port', 3000);
// config is now: { server: { port: 3000 } }
```

See [README.md](https://github.com/christopherreay/node-namespace#readme) for full documentation.

### Files

- `dist/namespace.mjs` — ES Module
- `dist/namespace.cjs` — CommonJS
- `dist/namespace.umd.js` — Browser/UMD
- `types/index.d.ts` — TypeScript definitions

**Full Changelog**: [CHANGELOG.md](https://github.com/christopherreay/node-namespace/blob/main/CHANGELOG.md)
```

7. Attach binaries: None needed (files are in repo)
8. Click "Publish release"

## Repository Settings

### General Settings

- **Features:**
  - ✅ Issues — Enable for bug reports and feature requests
  - ✅ Discussions — Optional, for Q&A
  - ❌ Wiki — Not needed (docs are in repo)
  - ✅ Sponsorships — If you want to enable

- **Pull Requests:**
  - ✅ Allow merge commits
  - ✅ Allow squash merging (recommended)
  - ✅ Allow rebase merging

### Branch Protection (Optional but Recommended)

For `main` branch:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (if you set up CI)

### Social Preview

You can upload an image for social media previews (when sharing on Twitter, etc.)

Suggested: A simple graphic with the project name and tagline
