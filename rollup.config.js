import rollUp from './rollup-base.config';
import pkg from './package.json';
import path from 'path';

/** @type {import("rollup").WatcherOptions } */
const watch = {
  include: [path.resolve(__dirname, 'src/**')],
  exclude: ''
};
export default rollUp(pkg, { watch });
