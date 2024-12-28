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
            dev = true,
            port = 9944,
            rpcPort = 9933,
            name = 'local-node',
            pruning = 'archive'
        } = options;

        this.spinner.start('Starting node...');

        try {
            // Construct node command with options
            const command = [
                this.nodeBinary,
                dev ? '--dev' : '',
                `--ws-port ${port}`,
                `--rpc-port ${rpcPort}`,
                `--name "${name}"`,
                `--pruning ${pruning}`,
                '--ws-external',
                '--rpc-external',
                '--rpc-cors all'
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
            Logger.info(`WebSocket: ws://127.0.0.1:${port}`);
            Logger.info(`RPC: http://127.0.0.1:${rpcPort}`);
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
