# About

Think hard: We want to transform this NPM package into a meta package. The idea is
that we want to publish binaries so they are easy to install for
people, and do not have to install other dependencies.

# Details

Publish one tiny “meta” package plus several platform-specific
packages that actually contain the binary.

Why: npm will skip packages whose "os"/"cpu" don’t match the current
machine, so the right one gets installed automatically—no scripts or
downloads required.

Example layout:

```
mycli/                     <- meta package (no binary)
mycli-darwin-arm64/        <- contains bun-compiled binary
mycli-darwin-x64/
mycli-linux-x64-gnu/
mycli-linux-arm64-gnu/
mycli-linux-x64-musl/      <- optional if you target Alpine
mycli-linux-arm64-musl/
mycli-win32-x64/
mycli-win32-arm64/
```

Just focus on linux-x64-gnu and linux-arm64-gnu for now to cut down on
testing time.

Platform package package.json (example: macOS arm64):

```
{
  "name": "mycli-darwin-arm64",
  "version": "1.0.0",
  "os": ["darwin"],
  "cpu": ["arm64"],
  "bin": { "mycli": "bin/mycli" },
  "files": ["bin/mycli", "LICENSE", "README.md"],
  "description": "mycli binary for macOS arm64"
}
```

Meta package package.json:

```
{
  "name": "mycli",
  "version": "1.0.0",
  "description": "Meta package that depends on a platform-specific mycli binary",
  "optionalDependencies": {
    "mycli-darwin-arm64": "1.0.0",
    "mycli-darwin-x64": "1.0.0",
    "mycli-linux-x64-gnu": "1.0.0",
    "mycli-linux-arm64-gnu": "1.0.0",
    "mycli-linux-x64-musl": "1.0.0",
    "mycli-linux-arm64-musl": "1.0.0",
    "mycli-win32-x64": "1.0.0",
    "mycli-win32-arm64": "1.0.0"
  }
}
```

What the user installs:

```
npm i -g mycli
# or: pnpm add -g mycli / yarn global add mycli
```

The package manager installs only the compatible platform package,
exposing mycli on PATH via the "bin" field shim.

Notes:
• Use "os"/"cpu" to match Node’s process.platform/process.arch.
• For Linux, publish both gnu (glibc) and musl (Alpine) if you need Alpine support.
• Each platform package simply ships bin/mycli (your Bun --compile output). No scripts needed.
• Version all platform packages identically to the meta for sanity.

# Current

If you currently run `npm publish --dry-run` it grabs the entire
directory. That doesn't seem to be what we want. Looking at the above
sample the meta package seems to be just empty.
