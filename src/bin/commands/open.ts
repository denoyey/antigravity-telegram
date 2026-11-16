import * as http from 'http';
import * as net from 'net';
import * as os from 'os';
import { execFile, spawn } from 'child_process';
import { CDP_PORTS } from '../../utils/cdpPorts';
import { getAntigravityCliPath, isAntigravityRunning } from '../../utils/pathUtils';

const APP_NAME = 'Antigravity';

/** Resolve Antigravity path from ANTIGRAVITY_PATH env var, if set. */
function getCustomPath(): string | undefined {
    return process.env.ANTIGRAVITY_PATH || undefined;
}

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
} as const;

/**
 * Check whether a TCP port is available (not in use) by attempting to listen on it.
 */
function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port, '127.0.0.1');
    });
}

/**
 * Check if CDP endpoint is responding on a given port.
 */
function checkCdpPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1500, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Poll CDP endpoint until it responds or times out.
 */
async function waitForCdpReady(port: number, timeoutMs: number = 4000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        if (await checkCdpPort(port)) {
            return true;
        }
        await new Promise((r) => setTimeout(r, 400));
    }
    return false;
}

async function findAvailablePort(): Promise<number | null> {
    for (const port of CDP_PORTS) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    return null;
}

function openMacOS(port: number): Promise<void> {
    const customPath = getCustomPath();
    return new Promise((resolve, reject) => {
        if (customPath) {
            // Use explicit path: run the binary directly
            const child = spawn(customPath, [`--remote-debugging-port=${port}`], {
                detached: true,
                stdio: 'ignore',
            });
            child.unref();
            child.on('error', (err) => {
                reject(new Error(`Failed to open ${customPath}: ${err.message}`));
            });
            setTimeout(() => resolve(), 500);
        } else {
            // Default: use macOS `open -a` to find the app in /Applications
            execFile('open', ['-a', APP_NAME, '--args', `--remote-debugging-port=${port}`], (err) => {
                if (err) {
                    reject(new Error(`Failed to open ${APP_NAME}: ${err.message}`));
                    return;
                }
                resolve();
            });
        }
    });
}

function openWindows(port: number): Promise<void> {
    const executable = getAntigravityCliPath();
    return new Promise((resolve, reject) => {
        try {
            const child = spawn(executable, [`--remote-debugging-port=${port}`], {
                detached: true,
                stdio: 'ignore',
                shell: true,
            });
            child.unref();
            child.on('error', (err) => {
                reject(new Error(`Failed to open ${executable}: ${err.message}`));
            });
            setTimeout(() => resolve(), 500);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to open ${executable}: ${msg}`));
        }
    });
}

function openLinux(port: number): Promise<void> {
    const executable = getCustomPath() ?? getAntigravityCliPath();
    return new Promise((resolve, reject) => {
        try {
            const child = spawn(executable, [`--remote-debugging-port=${port}`], {
                detached: true,
                stdio: 'ignore',
            });
            child.unref();
            child.on('error', (err) => {
                reject(new Error(`Failed to open ${executable}: ${err.message}`));
            });
            // Give it a moment to detect spawn errors
            setTimeout(() => resolve(), 500);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to open ${executable}: ${msg}`));
        }
    });
}

/**
 * Gracefully terminates running Antigravity IDE processes.
 */
function terminateAntigravity(): Promise<void> {
    return new Promise((resolve) => {
        const platform = os.platform();
        if (platform === 'win32') {
            execFile('taskkill', ['/IM', 'Antigravity.exe'], () => {
                setTimeout(resolve, 1500);
            });
        } else {
            execFile('pkill', ['-TERM', '-f', 'antigravity-ide'], () => {
                setTimeout(resolve, 1500);
            });
        }
    });
}

export interface OpenOptions {
    restart?: boolean;
}

export async function openAction(options: OpenOptions = {}): Promise<void> {
    const platform = os.platform();

    // 1. Check if Antigravity is already running with CDP on any port
    for (const p of CDP_PORTS) {
        if (await checkCdpPort(p)) {
            console.log(`\n  ${C.green}${APP_NAME} is already running with CDP on port ${p}.${C.reset}`);
            console.log(`  ${C.dim}Run ${C.reset}${C.cyan}antigravity-telegram start${C.reset}${C.dim} to connect the bot.${C.reset}\n`);
            return;
        }
    }

    // 2. Check if Antigravity is already running without CDP
    const isRunning = await isAntigravityRunning();
    if (isRunning) {
        if (options.restart) {
            console.log(`\n  ${C.cyan}Restarting ${APP_NAME} with remote debugging enabled...${C.reset}`);
            await terminateAntigravity();
            let retries = 10;
            while (retries-- > 0 && (await isAntigravityRunning())) {
                await new Promise((r) => setTimeout(r, 400));
            }
        } else {
            console.log(`\n  ${C.yellow}⚠️  ${APP_NAME} is already running without remote debugging (CDP).${C.reset}`);
            console.log(`  ${C.dim}Electron applications cannot dynamically enable remote debugging once started.${C.reset}\n`);
            console.log(`  ${C.bold}Options to resolve:${C.reset}`);
            console.log(`  • Restart automatically: ${C.cyan}npm run open -- --restart${C.reset}  (or: ${C.cyan}antigravity-telegram open --restart${C.reset})`);
            console.log(`  • Or restart manually:${C.reset}`);
            console.log(`    1. Quit ${APP_NAME} completely (${C.cyan}File > Exit${C.reset} or close all windows).`);
            console.log(`    2. Run: ${C.cyan}antigravity-telegram open${C.reset}`);
            console.log(`    3. Run: ${C.cyan}antigravity-telegram start${C.reset}\n`);
            process.exitCode = 1;
            return;
        }
    }

    console.log(`\n  ${C.cyan}Searching for an available CDP port...${C.reset}`);

    const port = await findAvailablePort();
    if (port === null) {
        console.log(`  ${C.red}No available CDP ports found.${C.reset}`);
        console.log(`  ${C.dim}All candidate ports are in use: ${CDP_PORTS.join(', ')}${C.reset}`);
        console.log(`  ${C.dim}Close an application using one of these ports and try again.${C.reset}\n`);
        process.exitCode = 1;
        return;
    }

    console.log(`  ${C.green}Found available port: ${port}${C.reset}`);
    console.log(`  ${C.dim}Opening ${APP_NAME} with --remote-debugging-port=${port}...${C.reset}\n`);

    try {
        if (platform === 'darwin') {
            await openMacOS(port);
        } else if (platform === 'win32') {
            await openWindows(port);
        } else {
            await openLinux(port);
        }

        const ready = await waitForCdpReady(port, 4000);
        if (ready) {
            console.log(`  ${C.green}${APP_NAME} opened and CDP is responding on port ${port}!${C.reset}`);
            console.log(`  ${C.dim}Run ${C.reset}${C.cyan}antigravity-telegram start${C.reset}${C.dim} to connect the bot.${C.reset}\n`);
        } else {
            console.log(`  ${C.yellow}⚠️  ${APP_NAME} process launched, but port ${port} did not respond within 4s.${C.reset}`);
            console.log(`  ${C.dim}If ${APP_NAME} was already open in the background, please quit it and try again.${C.reset}\n`);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`  ${C.red}${msg}${C.reset}`);
        console.log(`  ${C.dim}Make sure ${APP_NAME} is installed on your system.${C.reset}`);
        if (platform === 'darwin') {
            console.log(`  ${C.dim}${APP_NAME} must be in /Applications, or set ANTIGRAVITY_PATH in your .env file.${C.reset}`);
        } else if (platform === 'linux') {
            console.log(`  ${C.dim}Set ANTIGRAVITY_PATH in your .env file (e.g. /opt/applications/antigravity.AppImage).${C.reset}`);
        } else {
            console.log(`  ${C.dim}Make sure ${APP_NAME}.exe is in your PATH, or set ANTIGRAVITY_PATH in your .env file.${C.reset}`);
        }
        console.log('');
        process.exitCode = 1;
    }
}
