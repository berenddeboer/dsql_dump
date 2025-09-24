---
title: "Review Code for Bun API Optimization"
read_only: true
type: "command"
---

# Review Code for Bun API Optimization

Analyze TypeScript code to identify opportunities where native Bun APIs can replace existing implementations for better performance and reduced dependencies.

## Process

1. **Refresh bun APIs**:
   - Read https://bun.sh/ to see what APIs are currently supported by bun.
   - We want to use a bun api if one exists.

2. **Code Analysis**:
   - Examine the specified files or entire codebase
   - Identify patterns that could benefit from native Bun APIs
   - Look for common operations like file I/O, HTTP requests, process execution, and path manipulation
   - Check for dependencies that could be replaced with built-in Bun functionality

3. **Bun API Identification**:
   - Review code for file system operations that could use `Bun.file()`, `Bun.write()`, `Bun.read()`
   - Identify HTTP client code that could use `Bun.fetch()` or `Bun.serve()`
   - Look for subprocess calls that could use `Bun.spawn()` or `Bun.shell()`
   - Find hashing/crypto operations that could use `Bun.hash()` or `Bun.password`
   - Check for path operations that could use `Bun.resolveSync()` or `import.meta.resolve()`
   - Identify bundling/transpilation that could use `Bun.build()`

4. **Recommendation Report**:
   - Provide specific code examples showing current implementation vs. Bun API alternative
   - Highlight performance benefits and dependency reductions
   - Note any breaking changes or compatibility considerations
   - Prioritize recommendations by impact and ease of implementation
   - Include links to relevant Bun documentation

5. **Implementation Guidance**:
   - Suggest migration order (low-risk changes first)
   - Provide testing strategies for validating Bun API replacements
   - Recommend gradual adoption approach
   - Note any TypeScript type definitions needed
   - Identify potential edge cases or platform-specific considerations