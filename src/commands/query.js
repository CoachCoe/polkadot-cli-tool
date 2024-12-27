import { NODE_CONFIG } from '../utils/config.js';
import Logger from '../utils/logger.js';
import ConnectionManager from '../utils/connectionManager.js';
import { startMetrics, endMetrics } from '../utils/helpers.js';
import ora from 'ora';

export default async function query() {
    const spinner = ora('Initializing query...').start();
    startMetrics('query-command');

    const connectionManager = new ConnectionManager(NODE_CONFIG.URL);

    try {
        spinner.text = 'Connecting to chain...';
        const api = await connectionManager.connect();

        spinner.text = 'Fetching chain data...';
        const [
            chain,
            lastHeader,
            runtime,
            properties
        ] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.chain.getHeader(),
            api.rpc.state.getRuntimeVersion(),
            api.rpc.system.properties()
        ]);

        spinner.succeed('Chain data retrieved successfully');

        // Display chain information
        Logger.info('\nChain Information:');
        Logger.info(`Chain: ${chain}`);
        Logger.info(`Last Block: #${lastHeader.number}`);
        Logger.info(`Runtime Version: ${runtime.specVersion}`);
        Logger.info(`Transaction Version: ${runtime.transactionVersion}`);

        // Display chain properties if available
        if (properties.size > 0) {
            Logger.info('\nChain Properties:');
            properties.forEach((value, key) => {
                Logger.info(`${key}: ${value.toString()}`);
            });
        }

        // Get and display network state
        const [health, peers] = await Promise.all([
            api.rpc.system.health(),
            api.rpc.system.peers()
        ]);

        Logger.info('\nNetwork Status:');
        Logger.info(`Sync Status: ${health.isSyncing ? 'Syncing' : 'Synced'}`);
        Logger.info(`Peer Count: ${peers.length}`);

        endMetrics('query-command');
    } catch (error) {
        spinner.fail('Error querying chain');
        Logger.error('Failed to query chain:', error);
        process.exit(1);
    } finally {
        await connectionManager.disconnect();
    }
}
