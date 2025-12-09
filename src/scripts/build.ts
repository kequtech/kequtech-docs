import { buildClient } from './build-client/main.ts';
import { buildDocs } from './build-docs/main.ts';

async function main() {
    await buildClient();
    await buildDocs();
}

main().catch((err) => {
    console.error('Build process failed:', err);
    process.exit(1);
});
