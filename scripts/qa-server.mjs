import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const defaultPort = 3210;

export function localQaBaseUrl() {
  return process.env.QA_BASE_URL || `http://127.0.0.1:${process.env.QA_PORT || defaultPort}`;
}

export async function withQaServer(run) {
  if (process.env.QA_BASE_URL) return run(process.env.QA_BASE_URL);

  if (!existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'))) {
    throw new Error('No production build found. Run npm run build before QA scripts.');
  }

  const port = process.env.QA_PORT || String(defaultPort);
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn('npm', ['run', 'start', '--', '-p', port], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  const append = (chunk) => {
    output += chunk.toString();
    if (output.length > 8000) output = output.slice(-8000);
  };
  server.stdout.on('data', append);
  server.stderr.on('data', append);

  try {
    await waitForServer(baseUrl, () => output);
    return await run(baseUrl);
  } finally {
    server.kill('SIGTERM');
  }
}

async function waitForServer(baseUrl, output) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl, { method: 'HEAD' });
      if (res.ok || res.status === 404) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}\n${output()}`);
}

