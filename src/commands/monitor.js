import { NODE_URL } from '../utils/config.js';
import Logger from '../utils/logger.js';
import ConnectionManager from '../utils/connectionManager.js';
import { ContractMonitor } from '../monitoring/contractMonitor.js';
import { AccountMonitor } from '../monitoring/accountMonitor.js';
import { CrossChainMonitor } from '../monitoring/crossChainMonitor.js';
import { GovernanceMonitor } from '../monitoring/governanceMonitor.js';

class ChainMonitor {
  constructor() {
    this.connectionManager = new ConnectionManager(NODE_URL);
    this.monitors = {
      contract: new ContractMonitor(),
      account: new AccountMonitor(),
      crossChain: new CrossChainMonitor(),
      governance: new GovernanceMonitor()
    };
    this.isRunning = false;
  }

  async initialize() {
    try {
      await this.connectionManager.connect();
      this.isRunning = true;
      
      Logger.info('Starting blockchain monitoring...');
      
      const api = this.connectionManager.getApi();
      await this.subscribeToBlocks(api);
      
      process.on('SIGINT', this.cleanup.bind(this));
      process.on('SIGTERM', this.cleanup.bind(this));
      
    } catch (error) {
      Logger.error('Failed to initialize monitoring system:', error);
      throw error;
    }
  }

  async subscribeToBlocks(api) {
    return api.rpc.chain.subscribeNewHeads(async (header) => {
      try {
        const blockHash = await api.rpc.chain.getBlockHash(header.number.toNumber());
        const block = await api.rpc.chain.getBlock(blockHash);
        
        Logger.info(`Processing block #${header.number}`);
        
        await this.processBlock(block.block);
      } catch (error) {
        Logger.error(`Error processing block ${header.number}:`, error);
      }
    });
  }

  async processBlock(block) {
    const startTime = Date.now();
    
    try {
      for (const extrinsic of block.extrinsics) {
        await this.processExtrinsic(extrinsic);
      }
      
      const duration = Date.now() - startTime;
      Logger.debug(`Block processing completed in ${duration}ms`);
    } catch (error) {
      Logger.error('Error processing block:', error);
    }
  }

  async processExtrinsic(extrinsic) {
    try {
      // Process all monitors in parallel
      await Promise.all(
        Object.values(this.monitors).map(monitor => 
          monitor.monitorActivity(extrinsic).catch(error => {
            Logger.error(`Monitor error: ${error.message}`);
          })
        )
      );
    } catch (error) {
      Logger.error(`Error processing extrinsic: ${error.message}`);
    }
  }

  async cleanup() {
    Logger.info('Shutting down monitoring system...');
    this.isRunning = false;
    
    // Pause all monitors
    Object.values(this.monitors).forEach(monitor => monitor.pause());
    
    // Disconnect from the node
    await this.connectionManager.disconnect();
    
    Logger.success('Monitoring system shutdown complete');
    process.exit(0);
  }
}

export default async function monitor() {
  const chainMonitor = new ChainMonitor();
  
  try {
    await chainMonitor.initialize();
    Logger.success('Monitoring system initialized successfully. Press Ctrl+C to stop.');
  } catch (error) {
    Logger.error('Failed to start monitoring system:', error);
    process.exit(1);
  }
}
