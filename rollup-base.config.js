import esbuild from 'rollup-plugin-esbuild';
import autoExternal from 'rollup-plugin-auto-external';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import builtinModules from 'builtin-modules';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export const isProd = process.env.NODE_ENV === 'production';

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.node', '.json'];
export const resolveOptions = {
  mainFields: ['collection:main', 'es2020', 'es2018', 'es2017', 'es2015', 'module', 'main'],
  preferBuiltins: false,
  extensions,
  modulesOnly: false,
  browser: false
};
export const babelConfig = {
  sourceType: 'module',
  babelHelpers: 'runtime',
  extensions,
  babelrc: true,
  exclude: [/\/core-js\//, /\/node_modules\//],
  presets: [
    [
      '@babel/env',
      {
        targets: {
          browsers: '> 1%, IE 11, not dead'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [['@babel/plugin-transform-runtime', { useESModules: true }], ['@babel/plugin-syntax-import-meta']]
};
export const babelConfigMin = {
  sourceType: 'module',
  babelHelpers: 'runtime',
  extensions,
  babelrc: true,
  exclude: [/\/core-js\//, /\/node_modules\//],
  presets: [
    [
      '@babel/env',
      {
        targets: {
          browsers: '> 1%, IE 11, not dead'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [['@babel/plugin-transform-runtime', { useESModules: false }]]
};
export const plugins = {
  json: json(),
  external: autoExternal({
    builtins: false,
    peerDependencies: true,
    dependencies: true
  }),
  resolve: nodeResolve(resolveOptions),
  builtins: builtins(),
  // typescript: typescript({
  //   useTsconfigDeclarationDir: false,
  //   tsconfigOverride: { compilerOptions: { module: 'esnext' } },
  //   sourceMap: !isProd,
  //   inlineSources: !isProd
  // }),
  typescript: esbuild({
    minify: isProd,
    // target: ['chrome50', 'edge18', 'firefox53'],
    target: ['es2020'],
    sourceMap: !isProd,
    loaders: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.jsx': 'jsx',
      '.json': 'json'
    }
  }),
  babel: babel(babelConfig),
  replace: undefined,
  commonjs: commonjs(),
  globals: globals()
  // polyfills: nodePolyfills()
};
// const pluginsMin = {
//   ...plugins,
//   terser: isProd && terser()
// };
// pluginsMin.resolve = nodePolyfills();
// pluginsMin.resolve = nodeResolve({ ...resolveOptions, browser: true });
// pluginsMin.babel = babel(babelConfigMin);
// export { pluginsMin };
export const external = [...builtinModules];
// export const external = [];

export function parseName(name) {
  return name
    .replace('@', '')
    .replace('/', '-')
    .split('-')
    .map((x, i) => (i > 0 ? x[0].toUpperCase() + x.slice(1) : x))
    .join('');
}

export default (
  pkg,
  {
    /** @type {import("rollup").InputOptions } */
    options,
    /** @type {import("rollup").InputOptions } */
    optionsMin,
    /** @type {import("@rollup/plugin-babel").RollupBabelInputPluginOptions } */
    babelOptions,
    /** @type {import("@rollup/plugin-babel").RollupBabelInputPluginOptions } */
    babelOptionsMin,
    /** @type {import("rollup").WatcherOptions } */
    watch
  } = {}
) => {
  const banner = `/*
 * ${pkg.name}
 * ${pkg.description}
 * ${pkg.repository.url}
 * v${pkg.version}
 * ${pkg.license} License
 */
`;

  if (babelOptions) {
    plugins.babel = babel({ ...babelConfig, ...babelOptions });
    pluginsMin.babel = babel({ ...babelConfigMin, ...babelOptionsMin });
  }

  const output = options?.output || [
    pkg.main && { file: pkg.main, format: 'cjs', sourcemap: !isProd, banner },
    pkg.module && { file: pkg.module, format: 'esm', sourcemap: !isProd, banner }
  ];
  const outputMin = [];
  if (pkg.iife || pkg.browser) {
    outputMin.push({ file: pkg.iife || pkg.browser, name: parseName(pkg.name), format: 'iife', sourcemap: !isProd, banner });
  }
  if (pkg.umd) {
    outputMin.push({ file: pkg.umd, name: parseName(pkg.name), format: 'umd', sourcemap: !isProd, banner });
  }

  const basicExternal = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

  /** @type {import("rollup").InputOptions } */
  const baseBuild = {
    input: 'src/index.ts',
    output,
    treeshake: true,
    plugins: Object.values(options?.plugins || plugins),
    external: [...external, ...basicExternal],
    watch
  };

  const result = [
    {
      ...baseBuild,
      ...options
    }
  ];

  if (outputMin.length) {
    result.push(
      /** @type {import("rollup").InputOptions } */ {
        ...baseBuild,
        external: [],
        output: outputMin,
        watch,
        ...optionsMin,
        plugins: Object.values(optionsMin?.plugins || pluginsMin)
      }
    );
  }

  return result;
};
