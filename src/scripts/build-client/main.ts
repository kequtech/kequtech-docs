import { ASSETS_DIR, CLIENT_DIR } from '#constants.ts';
import esbuild from 'esbuild';
import path from 'node:path';

export async function buildClient() {
    await esbuild.build({
        entryPoints: [path.join(CLIENT_DIR, 'main.ts')],
        outfile: path.join(ASSETS_DIR, 'main.js'),
        bundle: true,
        format: 'esm',
        target: ['es2020'],
    });
    await esbuild.build({
        entryPoints: [path.join(CLIENT_DIR, 'search.ts')],
        outfile: path.join(ASSETS_DIR, 'search.js'),
        bundle: true,
        format: 'esm',
        target: ['es2020'],
    });
}
