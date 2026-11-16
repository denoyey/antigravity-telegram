import { logger } from '../utils/logger';
import { CDP_PORTS } from '../utils/cdpPorts';
import { getAntigravityCdpHint, isAntigravityRunning } from '../utils/pathUtils';
import * as http from 'http';

/**
 * Check if CDP responds on the specified port.
 */
function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(Array.isArray(parsed));
                } catch {
                    resolve(false);
                }
            });
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Check if Antigravity is running with CDP ports.
 * If not running, output a warning log (no auto-start or restart).
 *
 * Called during Bot initialization.
 */
export async function ensureAntigravityRunning(): Promise<void> {
    logger.debug('[AntigravityLauncher] Checking CDP ports...');

    const results = await Promise.all(CDP_PORTS.map((port) => checkPort(port)));
    const foundIndex = results.indexOf(true);
    if (foundIndex !== -1) {
        logger.debug(`[AntigravityLauncher] OK — Port ${CDP_PORTS[foundIndex]} responding`);
        return;
    }

    const isRunning = await isAntigravityRunning();

    logger.warn('');
    logger.warn('='.repeat(70));
    logger.warn('  Antigravity CDP ports are not responding');
    logger.warn('');
    if (isRunning) {
        logger.warn('  ⚠️  Antigravity IDE is currently running, but without CDP enabled.');
        logger.warn('  Electron requires remote debugging enabled at launch.');
        logger.warn('');
        logger.warn('  To connect:');
        logger.warn('    • Launch separate remote window (onsite safe): antigravity-telegram open --isolated');
        logger.warn('    • Restart existing window with CDP:           antigravity-telegram open --restart');
        logger.warn('    • Or restart manually:');
        logger.warn('      1. Quit Antigravity IDE completely (File > Exit)');
        logger.warn('      2. Launch with CDP: antigravity-telegram open');
        logger.warn('      3. The bot will automatically connect.');
    } else {
        logger.warn('  Launch Antigravity with CDP enabled:');
        logger.warn('    antigravity-telegram open');
        logger.warn('');
        logger.warn('  Or manually:');
        logger.warn(`    ${getAntigravityCdpHint(9222)}`);
        logger.warn('');
        logger.warn('  The bot will auto-connect once Antigravity is running.');
    }
    logger.warn('='.repeat(70));
    logger.warn('');
}
