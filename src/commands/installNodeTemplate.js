import { executeCommand, startMetrics, endMetrics, resolvePath } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NodeTemplateInstaller {
    constructor() {
        this.spinner = ora();
        this.sdkPath = path.resolve(process.cwd(), 'polkadot-sdk');
        this.possibleBinaryNames = [
            'polkadot',
            'substrate',
            'substrate-node',
            'node-template'
        ];
    }

    async checkPrerequisites() {
        this.spinner.start('Checking prerequisites...');
        
        try {
            // Use which to find cargo
            const cargoPath = await this.executeShellCommand('which cargo');
            Logger.info(`Found cargo at: ${cargoPath}`);

            // Check cargo version
            const cargoVersion = await this.executeShellCommand('cargo --version');
            Logger.info(`Cargo version: ${cargoVersion}`);

            this.spinner.succeed('Prerequisites verified');
        } catch (error) {
            this.spinner.fail('Prerequisites check failed');
            throw error;
        }
    }

    async executeShellCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { shell: true }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    async cloneRepository() {
        this.spinner.start('Cloning Polkadot SDK repository...');
        
        try {
            try {
                await fs.access(this.sdkPath);
                this.spinner.info('SDK directory already exists, updating...');
                await this.executeShellCommand(`cd "${this.sdkPath}" && git pull`);
            } catch {
                await this.executeShellCommand(`git clone --depth 1 https://github.com/paritytech/polkadot-sdk.git "${this.sdkPath}"`);
            }

            this.spinner.succeed('Repository cloned successfully');
        } catch (error) {
            this.spinner.fail('Failed to clone repository');
            throw error;
        }
    }

    async buildNode() {
        this.spinner.start('Building Substrate node...');
        
        try {
            // Set up environment variables
            const env = {
                ...process.env,
                CARGO_HOME: path.join(this.sdkPath, '.cargo'),
                RUSTUP_HOME: path.join(this.sdkPath, '.rustup'),
                PATH: `${path.join(this.sdkPath, '.cargo', 'bin')}:${process.env.PATH}`
            };

            // Build command with full path
            const buildCommand = `cd "${this.sdkPath}" && cargo build --release`;
            
            // Execute build
            await this.executeShellCommand(buildCommand);

            this.spinner.succeed('Node built successfully');
        } catch (error) {
            this.spinner.fail('Build failed');
            Logger.error('Build error details:', error);
            throw error;
        }
    }

    async findNodeBinary() {
        const releasePath = path.join(this.sdkPath, 'target', 'release');
        
        try {
            await fs.access(releasePath);
            const files = await fs.readdir(releasePath);
            Logger.info('Files in release directory:', files);

            for (const binaryName of this.possibleBinaryNames) {
                const binaryPath = path.join(releasePath, binaryName);
                try {
                    await fs.access(binaryPath, fs.constants.X_OK);
                    return binaryPath;
                } catch {
                    continue;
                }
            }
        } catch (error) {
            Logger.error('Error reading release directory:', error);
            throw new Error('Could not find node binary. Make sure the build completed successfully.');
        }
        
        throw new Error('No matching binary found in the release directory');
    }

    async verifyBuild() {
        this.spinner.start('Verifying build...');
        
        try {
            const nodePath = await this.findNodeBinary();
            Logger.info(`Found node binary at: ${nodePath}`);
            
            // Try to execute the binary
            const version = await this.executeShellCommand(`"${nodePath}" --version`);
            Logger.info(`Node version: ${version}`);

            this.spinner.succeed('Build verified successfully');
        } catch (error) {
            this.spinner.fail('Build verification failed');
            Logger.error('Error details:', error);
            throw error;
        }
    }
}

export default async function installNodeTemplate() {
    const installer = new NodeTemplateInstaller();
    startMetrics('install-node-template');

    try {
        Logger.info('Starting Polkadot SDK installation...');
        Logger.info(`Installation directory: ${installer.sdkPath}`);
        
        await installer.checkPrerequisites();
        await installer.cloneRepository();
        await installer.buildNode();
        await installer.verifyBuild();

        endMetrics('install-node-template');
        
        Logger.success('\nPolkadot SDK installed successfully! 🎉');
        Logger.info('\nNext steps:');
        Logger.info('1. Run polkadot-cli run to start your local node');
        Logger.info('2. Access your node at ws://127.0.0.1:9944');
        Logger.info('3. Use the Polkadot.js Apps to interact with your node:');
        Logger.info('   https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944');
        
    } catch (error) {
        Logger.error('Installation failed:', error);
        Logger.info('\nTroubleshooting tips:');
        Logger.info('1. Check your internet connection');
        Logger.info('2. Ensure you have enough disk space');
        Logger.info('3. Try running with sudo/administrator privileges');
        Logger.info('4. Check the build logs in target/release');
        Logger.info('5. Try running from the root of your project directory');
        process.exit(1);
    }
}
