import { executeCommand } from '../utils/helpers.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

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
            name = 'local-node',
            basePath = path.join(process.cwd(), 'chain-data'),
            rpcPort = 9933
        } = options;

        this.spinner.start('Starting node...');

        try {
            // Create base path directory if it doesn't exist
            await fs.mkdir(basePath, { recursive: true });

            // Prepare command arguments based on polkadot help output
            const args = [
                '--dev',  // Development mode
                '--base-path', basePath,
                '--unsafe-rpc-external',  // Allow external RPC
                '--rpc-cors', 'all',  // Allow all origins
                '--rpc-port', rpcPort.toString(),
                '--name', name,
                '--detailed-log-output'  // Detailed logging
            ];

            Logger.info('Starting node with command:', `${this.nodeBinary} ${args.join(' ')}`);

            // Use spawn for better process control
            const nodeProcess = spawn(this.nodeBinary, args, {
                stdio: 'pipe',
                env: {
                    ...process.env,
                    RUST_LOG: 'info'
                }
            });

            // Handle process output
            nodeProcess.stdout.on('data', (data) => {
                console.log(data.toString());
            });

            nodeProcess.stderr.on('data', (data) => {
                console.error(data.toString());
            });

            // Handle process events
            nodeProcess.on('error', (error) => {
                this.spinner.fail('Node process error');
                Logger.error('Process error:', error);
            });

            nodeProcess.on('exit', (code, signal) => {
                if (code !== null) {
                    Logger.info(`Node process exited with code ${code}`);
                } else {
                    Logger.info(`Node process killed with signal ${signal}`);
                }
            });

            // Wait a moment to catch immediate startup errors
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (nodeProcess.exitCode === null) {
                this.spinner.succeed('Node started successfully');
                
                Logger.info('\nNode Information:');
                Logger.info(`Binary: ${this.nodeBinary}`);
                Logger.info(`Chain Data: ${basePath}`);
                Logger.info(`WebSocket: ws://127.0.0.1:${rpcPort}`);
                Logger.info(`RPC: http://127.0.0.1:${rpcPort}`);
                Logger.info('\nPress Ctrl+C to stop the node');
            } else {
                throw new Error(`Node process exited immediately with code ${nodeProcess.exitCode}`);
            }

            return nodeProcess;
        } catch (error) {
            this.spinner.fail('Failed to start node');
            throw error;
        }
    }

    cleanup(nodeProcess) {
        Logger.info('Shutting down node...');
        if (nodeProcess && !nodeProcess.killed) {
            nodeProcess.kill();
        }
        process.exit(0);
    }
}

export default async function run(options = {}) {
    const runner = new NodeRunner();

    try {
        await runner.initialize();
        const nodeProcess = await runner.startNode(options);

        // Handle process termination
        process.on('SIGINT', () => runner.cleanup(nodeProcess));
        process.on('SIGTERM', () => runner.cleanup(nodeProcess));

        // Keep the process running
        process.stdin.resume();
    } catch (error) {
        Logger.error('Failed to run node:', error);
        process.exit(1);
    }
}
