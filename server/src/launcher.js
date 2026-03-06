import { execSync } from 'child_process';
import { platform } from 'os';

const PORT = process.env.PORT || 4000;

// Kill any process using the port before starting
try {
  if (platform() === 'win32') {
    execSync(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}"') do taskkill /F /PID %a`, { stdio: 'ignore' });
  } else {
    execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }
} catch (_) {}
// Small delay for port to be released
await new Promise(r => setTimeout(r, 500));

process.env.PORT = String(PORT);
await import('./index.js');
