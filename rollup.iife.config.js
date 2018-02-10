import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

export default {
	input: 'src/wping.js',
	output: {
		file: 'dist/wping.js',
		name: 'wping',
		format: 'iife',
	},
	plugins: [
		commonjs(),
		replace( {
			global: 'window',
		} ),
	],
};
