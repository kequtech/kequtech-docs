import path from 'node:path';
import type { Project } from './types.ts';

export const ROOT = process.cwd();
export const DIST_DIR = path.join(ROOT, 'dist');
export const ASSETS_DIR = path.join(ROOT, 'src/assets');
export const CLIENT_DIR = path.join(ROOT, 'src/client');
export const MD_DIR = path.join(ROOT, 'src/md');
export const MUSTACHE_DIR = path.join(ROOT, 'src/mustache');

export const PROJECTS: Record<string, Project> = {
    arbor: {
        name: '@kequtech/arbor',
        github: 'https://github.com/kequtech/arbor',
        npm: 'https://www.npmjs.com/package/@kequtech/arbor',
        background: '#F9F9F4',
        primary: '#AA8372',
    },
};
