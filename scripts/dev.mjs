import { spawn, exec } from 'child_process';
import { platform } from 'os';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

console.log(`Starting developer server with Turbopack...\n`);

// Start Next.js dev server with Turbopack for maximum speed
const next = spawn('npx', ['next', 'dev', '--turbo'], { 
    stdio: 'inherit', 
    shell: true,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } // Skip telemetry if not needed
});

// We want to open the dashboard once the server is ready, or after a short delay
// Next.js 14.2 with Turbopack usually starts in under 2 seconds.
const openTime = 1800; // 1.8 seconds delay

setTimeout(() => {
    console.log(`\nRocket launch! Opening your dashboard at ${url}...\n`);
    const opener = platform() === 'win32' ? 'start' : platform() === 'darwin' ? 'open' : 'xdg-open';
    exec(`${opener} ${url}`);
}, openTime);

next.on('close', (code) => {
    process.exit(code);
});
