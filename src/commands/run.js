import { executeCommand, resolvePath } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';

class NodeRunner {
    constructor() {
        this.nodeBinary = null;
        this.nodeProcess = null;
        this.isRunning = false;
    }

    async initialize() {
        const spinner = ora('Initializing node runner...').start();

        try {
            // Check for node binary in different locations
            const possiblePaths = [
                path.resolve(process.cwd(), 'target/release/substrate-node'),
                path.resolve(process.cwd(), 'polkadot-sdk/target/release/substrate-node'),
                // Add more possible paths if needed
            ];

            for (const path of possiblePaths) {
                try {
                    await fs.access(path, fs.constants.X_OK);
                    this.nodeBinary = path;
                    break;
                } catch {
                    continue;
                }
            }

            if (!this.nodeBinary) {
                spinner.fail('Node binary not found');
                throw new Error('Node binary not found. Please build the node first using polkadot-cli install-node-template');
            }

            spinner.succeed('Node runner initialized');
        } catch (error) {
            spinner.fail('Initialization failed');
            throw error;
        }
    }

    async startNode(options = {}) {
        const {
            dev = true,
            port = 9944,
            rpcPort = 9933,
            name = 'local-node',
            pruning = 'archive'
        } = options;

        const spinner = ora('Starting node...').start();

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

            // Start the node
            const { stdout, stderr } = await executeCommand(command);
            
            if (stderr) {
                Logger.warn('Node startup warnings:', stderr);
            }

            this.isRunning = true;
            spinner.succeed('Node started successfully');
            
            Logger.info('\nNode Information:');
            Logger.info(`Binary: ${this.nodeBinary}`);
            Logger.info(`WebSocket: ws://127.0.0.1:${port}`);
            Logger.info(`RPC: http://127.0.0.1:${rpcPort}`);

            // Handle process termination
            process.on('SIGINT', this.cleanup.bind(this));
            process.on('SIGTERM', this.cleanup.bind(this));

        } catch (error) {
            spinner.fail('Failed to start node');
            Logger.error('Node startup error:', error);
            throw error;
        }
    }

    async cleanup() {
        if (this.isRunning) {
            Logger.info('Shutting down node...');
            // Add cleanup logic here
            this.isRunning = false;
        }
        process.exit(0);
    }
}

export default async function run(options = {}) {
    try {
        const runner = new NodeRunner();
        await runner.initialize();
        await runner.startNode(options);
    } catch (error) {
        Logger.error('Failed to run node:', error);
        process.exit(1);
    }
}
