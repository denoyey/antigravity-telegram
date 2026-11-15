/**
 * Helper to resolve the correct Antigravity CLI executable path based on the operating system
 * and environment variables.
 *
 * Precedence:
 * 1. process.env.ANTIGRAVITY_PATH (Explicit override)
 * 2. OS-specific default paths (Mac: /Applications/..., Windows: %LOCALAPPDATA%\..., Linux: 'antigravity')
 *
 * SECURITY: Validates that ANTIGRAVITY_PATH is a file to prevent command injection
 */
export function getAntigravityCliPath(): string {
    // 1. Allow user to set explicit path via ANTIGRAVITY_PATH or config.json
    let explicitPath = process.env.ANTIGRAVITY_PATH;

    if (!explicitPath) {
        try {
            const fs = require('fs');
            const os = require('os');
            const path = require('path');
            const configPath = path.join(os.homedir(), '.antigravity-telegram-remote', 'config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                if (config.antigravityPath) {
                    explicitPath = config.antigravityPath;
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    if (explicitPath) {
        try {
            const fs = require('fs');
            const stat = fs.statSync(explicitPath);
            if (!stat.isFile()) {
                throw new Error(`ANTIGRAVITY_PATH must be a file, got: ${explicitPath}`);
            }
            return explicitPath;
        } catch (err: any) {
            throw new Error(`ANTIGRAVITY_PATH validation failed: ${err.message}`);
        }
    }

    if (process.platform === 'darwin') {
        return '/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity';
    }

    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA;
        if (localAppData) {
            return `${localAppData}\\Programs\\Antigravity\\Antigravity.exe`;
        }
        return 'Antigravity.exe'; // Fallback if LOCALAPPDATA is undefined
    }

    // On Linux or unknown POSIX: scan common installation locations for Antigravity IDE
    const fs = require('fs');
    const home = process.env.HOME || '';
    const candidatePaths = [
        '/usr/share/antigravity/bin/antigravity-ide',
        '/usr/share/antigravity/antigravity-ide',
        '/usr/bin/antigravity-ide',
        '/usr/local/bin/antigravity-ide',
        `${home}/.local/share/antigravity-ide/bin/antigravity-ide`,
        `${home}/.local/share/antigravity-ide/antigravity-ide`,
    ];

    for (const candidate of candidatePaths) {
        try {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                return candidate;
            }
        } catch {
            // Continue scanning
        }
    }

    // Fallback assuming 'antigravity' or 'antigravity-ide' is in PATH
    return 'antigravity';
}

/**
 * Helper to extract the project name from a full workspace path.
 * Handles both Windows (backslash) and POSIX (forward slash) paths.
 *
 * @param workspacePath The full path to the workspace directory
 * @returns The final folder name
 */
export function extractProjectNameFromPath(workspacePath: string): string {
    return workspacePath.split(/[/\\]/).filter(Boolean).pop() || '';
}

/**
 * Get a platform-appropriate hint for starting Antigravity with CDP.
 *
 * Used in user-facing messages (Telegram messages, CLI doctor, logs).
 */
export function getAntigravityCdpHint(port: number = 9222): string {
    const APP_NAME = 'Antigravity';
    switch (process.platform) {
        case 'darwin':
            return `open -a ${APP_NAME} --args --remote-debugging-port=${port}`;
        case 'win32':
            return `${APP_NAME}.exe --remote-debugging-port=${port}`;
        default:
            return `${APP_NAME.toLowerCase()} --remote-debugging-port=${port}`;
    }
}
