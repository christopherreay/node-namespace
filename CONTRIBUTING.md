# Contributing to namespace

Thank you for your interest in contributing! This is an open-source project and we welcome contributions from everyone.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/node-namespace.git
   cd node-namespace
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Building

```bash
npm run build
```

This creates the distribution files in `dist/`:
- `namespace.mjs` — ES Module build
- `namespace.cjs` — CommonJS build  
- `namespace.umd.js` — Browser/UMD build

### Testing

```bash
npm test
```

We use Node.js built-in test runner. All 97 tests should pass before submitting a PR.

### Adding Tests

If you add new features, please add corresponding tests in `test/namespace.test.js`:

```javascript
describe('your feature', () => {
  it('should do something specific', () => {
    // Your test here
    assert.strictEqual(actual, expected);
  });
});
```

## What to Contribute

### Bug Reports

If you find a bug, please open an issue with:
- Clear description of the problem
- Minimal code example that reproduces it
- Expected vs actual behavior
- Your environment (Node.js version, browser, etc.)

### Feature Requests

We welcome feature suggestions! Please open an issue describing:
- The use case
- How it would work
- Why it fits the project's philosophy (safety by default, zero dependencies)

### Code Contributions

Areas where contributions are especially welcome:

- **Documentation improvements** — clearer explanations, more examples
- **TypeScript definitions** — better type inference, stricter types
- **Performance optimizations** — faster traversal, lower memory
- **Additional examples** — real-world use cases

## Code Style

- Use **semicolons**
- Use **single quotes** for strings
- **2 spaces** for indentation
- Follow existing patterns in the codebase

## Commit Messages

Please use clear, descriptive commit messages:

```
feat: add new utility function
fix: correct edge case in setValue
docs: improve README examples
test: add tests for leafNode edge cases
```

## Pull Request Process

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** and add tests

3. **Ensure tests pass**:
   ```bash
   npm test
   ```

4. **Update documentation** if needed (README, AGENTS.md, etc.)

5. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

6. **Open a Pull Request** on GitHub with:
   - Clear description of changes
   - Link to related issue(s)
   - Notes on any breaking changes

## Code of Conduct

Be respectful and constructive. We're all here to learn and improve the project.

## Questions?

Feel free to open an issue for:
- Questions about the code
- Help getting started
- Discussion of potential features

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
