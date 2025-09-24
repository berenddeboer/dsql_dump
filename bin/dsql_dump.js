#!/usr/bin/env node

const { execFileSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

function getBinaryPath() {
  // Map of platform/arch to package names
  const platformPackages = {
    'linux-x64': 'dsql_dump-linux-x64-gnu',
    'linux-arm64': 'dsql_dump-linux-arm64-gnu'
  };

  const platform = process.platform;
  const arch = process.arch;
  const key = `${platform}-${arch}`;

  const packageName = platformPackages[key];
  if (!packageName) {
    console.error(`Unsupported platform: ${platform}-${arch}`);
    process.exit(1);
  }

  try {
    // Try to resolve the platform-specific package
    const packagePath = require.resolve(`${packageName}/package.json`);
    const binaryPath = join(packagePath, '../bin/dsql_dump');

    if (existsSync(binaryPath)) {
      return binaryPath;
    }
  } catch (error) {
    // Package not found
  }

  console.error(`Platform package ${packageName} not found. Please reinstall dsql_dump.`);
  process.exit(1);
}

try {
  const binaryPath = getBinaryPath();
  execFileSync(binaryPath, process.argv.slice(2), {
    stdio: 'inherit'
  });
} catch (error) {
  if (error.status) {
    process.exit(error.status);
  }
  console.error('Failed to execute dsql_dump:', error.message);
  process.exit(1);
}