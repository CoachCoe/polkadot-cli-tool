// src/commands/monitor.js
import { ApiPromise, WsProvider } from '@polkadot/api';
import { NODE_URL } from '../utils/config.js';
import { logInfo, logError, logSuccess } from '../utils/helpers.js';
import { ContractMonitor } from '../monitoring/contractMonitor.js';
import { AccountMonitor } from '../monitoring/accountMonitor.js';
import { CrossChainMonitor } from '../monitoring/crossChainMonitor.js';
import { GovernanceMonitor } from '../monitoring/governanceMonitor.js';

class ChainMonitor {
  constructor() {
    this.contractMonitor = new ContractMonitor();
    this.accountMonitor = new AccountMonitor();
    this.crossChainMonitor = new CrossChainMonitor();
    this.governanceMonitor = new GovernanceMonitor();
  }

  async initialize() {
    const provider = new WsProvider(NODE_URL);
    this.api = await ApiPromise.create({ provider });
    
    logInfo('Starting blockchain monitoring...');
    
    await this.api.rpc.chain.subscribeNewHeads(async (header) => {
      const blockHash = await this.api.rpc.chain.getBlockHash(header.number.toNumber());
      const block = await this.api.rpc.chain.getBlock(blockHash);
      
      logInfo(`Monitoring block #${header.number}`);
      
      for (const extrinsic of block.block.extrinsics) {
        await this.analyzeExtrinsic(extrinsic);
      }
    });
  }

  async analyzeExtrinsic(extrinsic) {
    try {
      // Run all monitors in parallel
      await Promise.all([
        this.contractMonitor.analyzeContractCreation(extrinsic),
        this.contractMonitor.analyzeContractCall(extrinsic),
        this.accountMonitor.monitorActivity(extrinsic),
        this.crossChainMonitor.monitorActivity(extrinsic),
        this.governanceMonitor.monitorActivity(extrinsic)
      ]);
    } catch (error) {
      logError(`Error analyzing extrinsic: ${error.message}`);
    }
  }
}

export default async function monitor() {
  try {
    const monitor = new ChainMonitor();
    await monitor.initialize();
    logSuccess('Monitoring system initialized successfully. Press Ctrl+C to stop.');
  } catch (error) {
    logError('Error initializing monitoring system:', error);
  }
}
