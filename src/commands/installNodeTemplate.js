import { executeCommand, startMetrics, endMetrics, resolvePath } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';

class NodeTemplateInstaller {
    constructor() {
        this.spinner = ora();
        this.sdkPath = resolvePath('polkadot-sdk');
        // List of possible binary names in order of preference
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
            // Check for required tools
            await executeCommand('git --version');
            await executeCommand('cargo --version');
            await executeCommand('rustc --version');

            // Check for available disk space
            await this.checkDiskSpace();

            this.spinner.succeed('Prerequisites verified');
        } catch (error) {
            this.spinner.fail('Prerequisites check failed');
            throw error;
        }
    }

    async checkDiskSpace() {
        // Ensure at least 10GB of free space
        const requiredSpace = 10 * 1024 * 1024 * 1024; // 10GB in bytes
        
        try {
            // This is a simplified check - you might want to use a package like 'disk-space' for better cross-platform support
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
            // Check if directory exists
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
            // Build the substrate-node
            await executeCommand('cargo build --release', { 
                cwd: path.join(this.sdkPath, 'substrate'),
                timeout: 3600000 // 1 hour timeout
            });

            this.spinner.succeed('Node built successfully');
        } catch (error) {
            this.spinner.fail('Build failed');
            throw error;
        }
    }

    async findNodeBinary() {
        const releasePath = path.join(this.sdkPath, 'target', 'release');
        
        // Try to find any of the possible binary names
        for (const binaryName of this.possibleBinaryNames) {
            const binaryPath = path.join(releasePath, binaryName);
            try {
                await fs.access(binaryPath, fs.constants.X_OK);
                return binaryPath;
            } catch {
                continue;
            }
        }
        
        throw new Error('Could not find node binary. Available files in release directory: ' + 
            (await fs.readdir(releasePath)).join(', '));
    }

    async verifyBuild() {
        this.spinner.start('Verifying build...');
        
        try {
            const nodePath = await this.findNodeBinary();
            Logger.debug(`Found node binary at: ${nodePath}`);
            
            // Try to run the node with --version
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
        process.exit(1);
    }
}
