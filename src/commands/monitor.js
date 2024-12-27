import { ApiPromise, WsProvider } from '@polkadot/api';
import { NODE_URL } from '../utils/config.js';
import chalk from 'chalk';
import { logInfo, logError, logSuccess } from '../utils/helpers.js';

class ChainMonitor {
  constructor(wsEndpoint) {
    this.suspiciousThreshold = BigInt(1000000000000);
    this.transactionTimeWindow = 60000;
    this.transactionCountThreshold = 10;
    this.knownMaliciousAddresses = new Set([]);
  }

  async initialize() {
    const provider = new WsProvider(NODE_URL);
    this.api = await ApiPromise.create({ provider });
    
    const accountTransactions = new Map();
    
    logInfo('Starting blockchain monitoring...');
    
    await this.api.rpc.chain.subscribeNewHeads(async (header) => {
      const blockHash = await this.api.rpc.chain.getBlockHash(header.number.toNumber());
      const block = await this.api.rpc.chain.getBlock(blockHash);
      
      logInfo(`Monitoring block #${header.number}`);
      block.block.extrinsics.forEach((extrinsic) => {
        this.analyzeExtrinsic(extrinsic, accountTransactions);
      });
    });
  }

  async analyzeExtrinsic(extrinsic, accountTransactions) {
    const { signer, method } = extrinsic;
    const timestamp = Date.now();

    // Monitor for large transfers
    if (method.section === 'balances' && method.method === 'transfer') {
      const amount = method.args[1];
      if (amount >= this.suspiciousThreshold) {
        this.reportSuspiciousActivity({
          type: 'LargeTransfer',
          account: signer.toString(),
          amount: amount.toString(),
          timestamp
        });
      }
    }

    // Monitor transaction frequency
    if (signer) {
      const address = signer.toString();
      const transactions = accountTransactions.get(address) || [];
      
      const recentTransactions = transactions.filter(
        tx => timestamp - tx < this.transactionTimeWindow
      );
      
      recentTransactions.push(timestamp);
      accountTransactions.set(address, recentTransactions);

      if (recentTransactions.length > this.transactionCountThreshold) {
        this.reportSuspiciousActivity({
          type: 'HighFrequency',
          account: address,
          transactionCount: recentTransactions.length,
          timeWindow: this.transactionTimeWindow / 1000,
          timestamp
        });
      }
    }

    // Monitor interactions with known malicious addresses
    const destinationAddress = method.args[0]?.toString();
    if (destinationAddress && this.knownMaliciousAddresses.has(destinationAddress)) {
      this.reportSuspiciousActivity({
        type: 'MaliciousInteraction',
        account: signer.toString(),
        maliciousAddress: destinationAddress,
        timestamp
      });
    }
  }

  reportSuspiciousActivity(activity) {
    switch(activity.type) {
      case 'LargeTransfer':
        logError(`⚠️ Large Transfer Detected from ${activity.account}: ${activity.amount} tokens`);
        break;
      case 'HighFrequency':
        logError(`⚠️ High Frequency Trading Detected: ${activity.account} made ${activity.transactionCount} transactions in ${activity.timeWindow}s`);
        break;
      case 'MaliciousInteraction':
        logError(`⚠️ Malicious Interaction Detected: ${activity.account} interacted with known malicious address ${activity.maliciousAddress}`);
        break;
    }
  }
}

export default async function monitor() {
  try {
    const monitor = new ChainMonitor(NODE_URL);
    await monitor.initialize();
    logSuccess('Monitoring system initialized successfully. Press Ctrl+C to stop.');
  } catch (error) {
    logError('Error initializing monitoring system:', error);
  }
}
