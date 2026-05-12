import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GET, HEAD, OPTIONS } from './src/api/recording-proxy.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(rootDir, 'src');
const port = Number(process.env.PORT || 5055);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm'
};

function sendStaticFile(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^[/\\]+/, '');
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

function toFetchRequest(req) {
  const protocol = req.socket.encrypted ? 'https' : 'http';
  const requestUrl = `${protocol}://${req.headers.host}${req.url}`;

  return new Request(requestUrl, {
    method: req.method,
    headers: req.headers
  });
}

async function sendFetchResponse(fetchResponse, res) {
  res.writeHead(fetchResponse.status, Object.fromEntries(fetchResponse.headers));

  if (!fetchResponse.body) {
    res.end();
    return;
  }

  const reader = fetchResponse.body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      res.end();
      return;
    }

    res.write(Buffer.from(value));
  }
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api/recording-proxy')) {
    const request = toFetchRequest(req);
    const handler = req.method === 'OPTIONS' ? OPTIONS : req.method === 'HEAD' ? HEAD : GET;
    await sendFetchResponse(await handler(request), res);
    return;
  }

  sendStaticFile(req, res);
}).listen(port, () => {
  console.log(`AudioMass local dev server: http://localhost:${port}/`);
});
