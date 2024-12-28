import { executeCommand } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';

class NodeRunner {
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

    async initialize() {
        this.spinner.start('Initializing node runner...');

        try {
            this.nodeBinary = await this.findNodeBinary();
            if (!this.nodeBinary) {
                throw new Error('Node binary not found. Please build the node first using polkadot-cli install-node-template');
            }

            // Get binary help output to determine available options
            const helpOutput = await executeCommand(`"${this.nodeBinary}" --help`);
            Logger.debug('Binary help output:', helpOutput);

            this.spinner.succeed('Node runner initialized');
            Logger.info(`Using node binary: ${this.nodeBinary}`);
        } catch (error) {
            this.spinner.fail('Node binary not found');
            throw error;
        }
    }

    async findNodeBinary() {
        const releasePath = path.join(this.sdkPath, 'target', 'release');
        
        try {
            await fs.access(releasePath);
            const files = await fs.readdir(releasePath);
            Logger.debug('Available binaries:', files);

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
            Logger.debug('Error finding binary:', error);
            return null;
        }
        return null;
    }

    async startNode(options = {}) {
        const {
            name = 'local-node',
            basePath = path.join(process.cwd(), 'chain-data')
        } = options;

        this.spinner.start('Starting node...');

        try {
            // Create base path directory if it doesn't exist
            await fs.mkdir(basePath, { recursive: true });

            // Construct node command with correct arguments
            const command = [
                this.nodeBinary,
                '--dev',  // Run in development mode
                `--base-path "${basePath}"`,  // Specify where to store chain data
                '--unsafe-rpc-external',  // Allow external RPC connections
                '--rpc-cors all',  // Allow all origins for RPC
                '--unsafe-ws-external',  // Allow external WebSocket connections
                `--name "${name}"`,  // Node name
                '--validator',  // Run as validator
                '--prometheus-external',  // Enable Prometheus metrics
                '--detailed-log-output'  // Detailed logging
            ].filter(Boolean).join(' ');

            Logger.info('Starting node with command:', command);

            // Start the node
            const { stdout, stderr } = await executeCommand(command);
            
            if (stderr) {
                Logger.warn('Node startup warnings:', stderr);
            }

            this.spinner.succeed('Node started successfully');
            
            Logger.info('\nNode Information:');
            Logger.info(`Binary: ${this.nodeBinary}`);
            Logger.info(`Chain Data: ${basePath}`);
            Logger.info('WebSocket: ws://127.0.0.1:9944');
            Logger.info('RPC: http://127.0.0.1:9933');
            Logger.info('Prometheus: http://127.0.0.1:9615');
            Logger.info('\nPress Ctrl+C to stop the node');

        } catch (error) {
            this.spinner.fail('Failed to start node');
            throw error;
        }
    }

    async cleanup() {
        Logger.info('Shutting down node...');
        // Add cleanup logic here if needed
        process.exit(0);
    }
}

export default async function run(options = {}) {
    const runner = new NodeRunner();

    try {
        await runner.initialize();
        await runner.startNode(options);

        // Handle process termination
        process.on('SIGINT', () => runner.cleanup());
        process.on('SIGTERM', () => runner.cleanup());
    } catch (error) {
        Logger.error('Failed to run node:', error);
        process.exit(1);
    }
}
