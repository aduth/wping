import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import inject from 'rollup-plugin-inject';

export default {
	input: 'src/wping.js',
	output: {
		format: 'cjs',
		file: 'wping.js',
	},
	plugins: [
		commonjs(),
		resolve( {
			preferBuiltins: true,
		} ),
		inject( {
			XMLHttpRequest: 'xmlhttprequest',
		} ),
	],
	external: [
		'url',
		'child_process',
		'fs',
		'http',
		'https',
	],
};
