// scripts/dev-docs.ts
import chokidar from 'chokidar';
import path from 'node:path';
import { CLIENT_DIR, MD_DIR, MUSTACHE_DIR, ROOT } from '../constants.ts';
import { buildClient } from './build-client/main.ts';
import { buildDocs } from './build-docs/main.ts';

async function watch(name: string, paths: string[], run: () => Promise<void>) {
    let building = false;
    let pending = false;
    async function runner() {
        if (building) {
            pending = true;
            return;
        }
        building = true;
        try {
            console.info(`[${name}] rebuilding...`);
            await run();
            console.info(`[${name}] done`);
        } catch (err) {
            console.error(`[${name}] build failed:`, err);
        } finally {
            building = false;
            if (pending) {
                pending = false;
                runner();
            }
        }
    }
    await runner();
    const watcher = chokidar.watch(paths, {
        ignoreInitial: true,
    });
    watcher.on('all', (event, filePath) => {
        console.info(`[${name}] ${event}: ${path.relative(ROOT, filePath)}`);
        runner();
    });
    console.info(`[${name}] watching...`);
}

async function main() {
    await watch('docs', [MD_DIR, MUSTACHE_DIR], buildDocs);
    await watch('client', [CLIENT_DIR], buildClient);
}

main().catch((err) => {
    console.error('dev-docs failed:', err);
    process.exit(1);
});
