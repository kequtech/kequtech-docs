import { ASSETS_DIR, DIST_DIR } from '#constants.ts';
import fsx from 'fs-extra';
import path from 'node:path';

async function main() {
    await fsx.copy(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
