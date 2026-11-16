#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { version } from '../../package.json';
import { startAction } from './commands/start';
import { doctorAction } from './commands/doctor';
import { setupAction } from './commands/setup';
import { openAction } from './commands/open';
import { ConfigLoader } from '../utils/configLoader';
import { printWelcome } from './welcome';

const program = new Command()
    .name('antigravity-telegram')
    .description('Control your Antigravity AI IDE remotely via Telegram')
    .version(version)
    .option('--verbose', 'Show debug-level logging')
    .option('--quiet', 'Only show errors');

// Default action: no subcommand → start or setup
program.action(async () => {
    const hasConfig = ConfigLoader.configExists();
    const hasEnv = fs.existsSync(path.resolve(process.cwd(), '.env'));

    if (!hasConfig && !hasEnv) {
        printWelcome();
        return setupAction();
    } else {
        return startAction(program.opts(), program);
    }
});

program
    .command('start')
    .description('Start the Telegram bot daemon')
    .action((_opts, cmd) => startAction(cmd.parent.opts(), cmd.parent));

program
    .command('doctor')
    .description('Diagnose environment, Node version, and CDP connectivity')
    .action(doctorAction);

program
    .command('setup')
    .description('Run interactive configuration wizard')
    .action(setupAction);

program
    .command('open')
    .description('Launch Antigravity IDE with CDP debugging enabled')
    .option('-r, --restart', 'Gracefully restart Antigravity if already running without CDP')
    .action(openAction);

program.parse();
