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

    async executeShellCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            Logger.debug(`Executing command: ${command}`);
            exec(command, { 
                shell: true, 
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                ...options 
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    Logger.debug(`Command stderr: ${stderr}`);
                }
                resolve(stdout.trim());
            });
        });
    }

    async checkPrerequisites() {
        this.spinner.start('Checking prerequisites...');
        
        try {
            const cargoPath = await this.executeShellCommand('which cargo');
            Logger.info(`Found cargo at: ${cargoPath}`);

            const cargoVersion = await this.executeShellCommand('cargo --version');
            Logger.info(`Cargo version: ${cargoVersion}`);

            this.spinner.succeed('Prerequisites verified');
        } catch (error) {
            this.spinner.fail('Prerequisites check failed');
            throw error;
        }
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
            // Print directory contents before build
            Logger.info('Contents of SDK directory before build:');
            const contents = await this.executeShellCommand(`ls -la "${this.sdkPath}"`);
            Logger.info(contents);

            // First, attempt to build polkadot binary
            const buildCommand = `cd "${this.sdkPath}" && cargo build --release -p polkadot`;
            Logger.info('Starting build with command:', buildCommand);
            
            try {
                const buildOutput = await this.executeShellCommand(buildCommand, {
                    cwd: this.sdkPath,
                    env: {
                        ...process.env,
                        CARGO_HOME: path.join(this.sdkPath, '.cargo'),
                        RUSTUP_HOME: path.join(this.sdkPath, '.rustup'),
                        PATH: `${path.join(this.sdkPath, '.cargo', 'bin')}:${process.env.PATH}`
                    }
                });
                Logger.debug('Build output:', buildOutput);
            } catch (error) {
                Logger.error('Build error:', error);
                throw error;
            }

            // Verify build artifacts after build
            Logger.info('Checking build artifacts...');
            const targetPath = path.join(this.sdkPath, 'target', 'release');
            try {
                await fs.access(targetPath);
                const targetContents = await this.executeShellCommand(`ls -la "${targetPath}"`);
                Logger.info('Contents of target/release:', targetContents);
            } catch (error) {
                Logger.error('Error accessing target directory:', error);
                throw new Error('Build appeared to succeed but target directory is missing');
            }

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
            // First, check if the release directory exists
            try {
                await fs.access(releasePath);
            } catch (error) {
                Logger.error(`Release directory not found at: ${releasePath}`);
                throw error;
            }

            // List all files in the release directory
            const files = await fs.readdir(releasePath);
            Logger.info('Files in release directory:', files);

            // Look for each possible binary name
            for (const binaryName of this.possibleBinaryNames) {
                const binaryPath = path.join(releasePath, binaryName);
                try {
                    await fs.access(binaryPath, fs.constants.X_OK);
                    Logger.info(`Found binary: ${binaryPath}`);
                    return binaryPath;
                } catch {
                    Logger.debug(`Binary not found at: ${binaryPath}`);
                    continue;
                }
            }
        } catch (error) {
            Logger.error('Error finding node binary:', error);
            throw new Error('Could not find node binary. Make sure the build completed successfully.');
        }
        
        throw new Error('No matching binary found in the release directory');
    }

    async verifyBuild() {
        this.spinner.start('Verifying build...');
        
        try {
            const nodePath = await this.findNodeBinary();
            Logger.info(`Found node binary at: ${nodePath}`);
            
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
