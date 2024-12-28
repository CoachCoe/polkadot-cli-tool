import { executeCommand, startMetrics, endMetrics } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import os from 'os';

class SetupManager {
    constructor() {
        this.platform = os.platform();
        this.spinner = ora();
    }

    async checkSystemRequirements() {
        this.spinner.start('Checking system requirements...');
        
        try {
            const requirements = {
                node: 'node --version',
                git: 'git --version',
                cargo: 'cargo --version'
            };

            for (const [tool, command] of Object.entries(requirements)) {
                try {
                    const { stdout } = await executeCommand(command);
                    console.log(`${tool} version: ${stdout.trim()}`);
                } catch {
                    throw new Error(`${tool} is not installed`);
                }
            }

            this.spinner.succeed('System requirements verified');
        } catch (error) {
            this.spinner.fail('System requirements check failed');
            throw error;
        }
    }

    async installRust() {
        this.spinner.start('Installing Rust...');
        
        const command = this.platform === 'win32'
            ? 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'
            : 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y';

        try {
            await executeCommand(command);
            await executeCommand('rustup default stable');
            await executeCommand('rustup target add wasm32-unknown-unknown');
            
            this.spinner.succeed('Rust installed successfully');
        } catch (error) {
            this.spinner.fail('Rust installation failed');
            throw error;
        }
    }

    async installSubstrateDependencies() {
        this.spinner.start('Installing Substrate dependencies...');
        
        try {
            switch (this.platform) {
                case 'darwin':
                    await this.installMacDependencies();
                    break;
                case 'linux':
                    await this.installLinuxDependencies();
                    break;
                case 'win32':
                    await this.installWindowsDependencies();
                    break;
                default:
                    throw new Error(`Unsupported platform: ${this.platform}`);
            }
            
            this.spinner.succeed('Substrate dependencies installed');
        } catch (error) {
            this.spinner.fail('Failed to install Substrate dependencies');
            throw error;
        }
    }

    async installMacDependencies() {
        const commands = [
            'brew install cmake',
            'brew install openssl',
            'brew install protobuf'
        ];

        for (const command of commands) {
            await executeCommand(command);
        }
    }

    async installLinuxDependencies() {
        const commands = [
            'sudo apt update',
            'sudo apt install -y cmake pkg-config libssl-dev git clang libclang-dev',
            'sudo apt install -y build-essential protobuf-compiler'
        ];

        for (const command of commands) {
            await executeCommand(command);
        }
    }

    async installWindowsDependencies() {
        Logger.warn('Windows support is limited. Some features might not work as expected.');
    }

    async verifyInstallation() {
        this.spinner.start('Verifying installation...');
        
        try {
            const checks = [
                'cargo --version',
                'rustc --version',
                'cmake --version'
            ];

            for (const check of checks) {
                const { stdout } = await executeCommand(check);
                console.log(`${check}: ${stdout.trim()}`);
            }

            this.spinner.succeed('Installation verified successfully');
        } catch (error) {
            this.spinner.fail('Installation verification failed');
            throw error;
        }
    }
}

export default async function setup() {
    const setupManager = new SetupManager();
    startMetrics('setup');

    try {
        Logger.info('Starting Polkadot development environment setup...');
        
        await setupManager.checkSystemRequirements();
        await setupManager.installRust();
        await setupManager.installSubstrateDependencies();
        await setupManager.verifyInstallation();

        endMetrics('setup');
        
        Logger.success('\nSetup completed successfully! 🎉');
        Logger.info('\nNext steps:');
        Logger.info('1. Run polkadot-cli new <type> to create a new project');
        Logger.info('2. Run polkadot-cli run to start a local node');
        
    } catch (error) {
        Logger.error('Setup failed:', error);
        Logger.info('\nTroubleshooting tips:');
        Logger.info('1. Make sure you have admin/sudo privileges');
        Logger.info('2. Check your internet connection');
        Logger.info('3. Try running the failed steps manually');
        Logger.info('4. Check the logs for detailed error information');
        process.exit(1);
    }
}
