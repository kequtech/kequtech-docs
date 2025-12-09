import { DIST_DIR, ROOT } from '#constants.ts';
import fsx from 'fs-extra';
import mime from 'mime';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const PORT = process.env.PORT || 4173;

async function router(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) return send(res, 400, 'Bad request');
    const rawPath = req.url.split('?')[0];
    let requestedPath = decodeURIComponent(rawPath);
    if (requestedPath === '/') requestedPath = '/index.html';
    const filePath = await getFilePath(requestedPath);
    if (!filePath) return send(res, 404, 'Not found');
    try {
        const data = await fsx.readFile(filePath);
        const contentType =
            mime.getType(filePath) || 'application/octet-stream';
        send(res, 200, data, contentType);
    } catch (err) {
        console.error('[server] error:', err);
        send(res, 500, 'Internal server error');
    }
}

function send(
    res: http.ServerResponse,
    status: number,
    body: string | Buffer,
    contentType = 'text/plain',
) {
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(body);
}

async function getFilePath(requestedPath: string) {
    if (requestedPath.startsWith('/assets/')) {
        const filePath = path.join(ROOT, 'src', requestedPath);
        if (await fsx.pathExists(filePath)) return filePath;
        return undefined;
    }
    const filePath = path.join(DIST_DIR, requestedPath);
    if (!path.extname(requestedPath)) {
        const indexFilePath = path.join(DIST_DIR, requestedPath, 'index.html');
        if (await fsx.pathExists(indexFilePath)) return indexFilePath;
    }
    if (await fsx.pathExists(filePath)) return filePath;
}

const server = http.createServer(router);
server.listen(PORT, () => {
    console.info(`[server] serving dist/ at http://localhost:${PORT}`);
});
