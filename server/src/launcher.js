import { execSync } from 'child_process';
import { platform } from 'os';

const PORT = process.env.PORT || 4000;

/** Free the listen port on Windows (cmd `for /f tokens=5` is unreliable across locales / IPv6 lines). */
function killProcessOnPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* no listeners or findstr failed */
  }
}

// Kill any process using the port before starting
try {
  if (platform() === 'win32') {
    killProcessOnPortWindows(PORT);
  } else {
    execSync(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }
} catch (_) {}
// Small delay for port to be released
await new Promise(r => setTimeout(r, 500));

process.env.PORT = String(PORT);
await import('./index.js');
