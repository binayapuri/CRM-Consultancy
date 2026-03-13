import { execSync, spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Kill any process using the port before starting
try {
  if (platform() === 'win32') {
    execSync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}"') do taskkill /F /PID %a`, { stdio: 'ignore' });
  } else {
    execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }
} catch (_) {}
await new Promise(r => setTimeout(r, 1000));

// Run vite directly via node (avoids ENOENT when npx is not in PATH, e.g. on Windows)
const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) },
});
vite.on('exit', (code) => process.exit(code || 0));
