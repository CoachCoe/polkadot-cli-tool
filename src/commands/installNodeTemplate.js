import { executeCommand, startMetrics, endMetrics, resolvePath } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';

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
            await executeCommand('git --version');
            await executeCommand('cargo --version');
            await executeCommand('rustc --version');
            await this.checkDiskSpace();

            this.spinner.succeed('Prerequisites verified');
        } catch (error) {
            this.spinner.fail('Prerequisites check failed');
            throw error;
        }
    }

    async checkDiskSpace() {
        const requiredSpace = 10 * 1024 * 1024 * 1024; // 10GB in bytes
        
        try {
            const { stdout } = await executeCommand('df -k .');
            const freeSpace = parseInt(stdout.split('\n')[1].split(/\s+/)[3]) * 1024;
            
            if (freeSpace < requiredSpace) {
                throw new Error(`Insufficient disk space. Need at least 10GB free, have ${Math.floor(freeSpace / 1024 / 1024 / 1024)}GB`);
            }
        } catch (error) {
            Logger.warn('Could not verify disk space:', error);
        }
    }

    async cloneRepository() {
        this.spinner.start('Cloning Polkadot SDK repository...');
        
        try {
            try {
                await fs.access(this.sdkPath);
                this.spinner.info('SDK directory already exists, updating...');
                await executeCommand('git pull', { cwd: this.sdkPath });
            } catch {
                await executeCommand(`git clone --depth 1 https://github.com/paritytech/polkadot-sdk.git ${this.sdkPath}`);
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
            // Set the WASM_BUILD_WORKSPACE_HINT environment variable
            const env = {
                ...process.env,
                WASM_BUILD_WORKSPACE_HINT: this.sdkPath,
                RUST_BACKTRACE: '1'
            };

            // Change to the SDK directory and build
            const buildCommand = 'cargo build --release -p substrate-node-cli';
            
            await executeCommand(buildCommand, { 
                cwd: this.sdkPath,
                env,
                timeout: 3600000 // 1 hour timeout
            });

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
            const files = await fs.readdir(releasePath);
            Logger.debug('Files in release directory:', files);

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
        }
        
        throw new Error('Could not find node binary in the release directory');
    }

    async verifyBuild() {
        this.spinner.start('Verifying build...');
        
        try {
            const nodePath = await this.findNodeBinary();
            Logger.debug(`Found node binary at: ${nodePath}`);
            
            const { stdout } = await executeCommand(`${nodePath} --version`);
            Logger.debug(`Node version: ${stdout.trim()}`);

            this.spinner.succeed('Build verified successfully');
        } catch (error) {
            this.spinner.fail('Build verification failed');
            Logger.debug('Error details:', error);
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
