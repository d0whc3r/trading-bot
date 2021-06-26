module.exports = {
  /** @type {import('dts-bundle-generator').CompilationOptions} */
  compilationOptions: {
    followSymlinks: false,
    preferredConfigPath: './tsconfig.json'
  },
  entries: [
    /** @type {import('dts-bundle-generator').EntryPointConfig} */
    {
      filePath: './src/index.ts',
      outFile: './dist/index.d.ts',
      failOnClass: false,
      noCheck: false,
      libraries: {
        allowedTypesLibraries: [],
        importedLibraries: [],
        inlinedLibraries: []
      },
      output: {
        inlineDeclareGlobals: true,
        inlineDeclareExternals: true,
        sortNodes: false,
        respectPreserveConstEnum: true
      }
    }
  ]
};
