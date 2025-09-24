import { javascript, typescript } from 'projen';
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'dsql_dump',
  packageManager: javascript.NodePackageManager.BUN,
  projenrcTs: true,
  gitIgnoreOptions: {
    ignorePatterns: ['.envrc'],
  },

  deps: ['postgres'], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: ['@types/node', '@types/bun'], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */

  tsconfig: {
    compilerOptions: {
      // Environment setup & latest features
      lib: ['ESNext'],
      target: 'ESNext',
      module: 'Preserve',
      moduleDetection: javascript.TypeScriptModuleDetection.FORCE,
      allowJs: true,

      // Bundler mode
      moduleResolution: javascript.TypeScriptModuleResolution.BUNDLER,
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      noEmit: true,

      // Best practices
      strict: true,
      skipLibCheck: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,

      // Some stricter flags (disabled by default)
      noUnusedLocals: false,
      noUnusedParameters: false,
      noPropertyAccessFromIndexSignature: false,
    },
  },

});
project.synth();