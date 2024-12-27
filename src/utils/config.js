// src/utils/config.js

// Node connection settings
export const NODE_CONFIG = {
  URL: 'ws://127.0.0.1:9944',
  RECONNECT_TIMEOUT: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  CONNECTION_TIMEOUT: 60000
};

// Project paths
export const PATH_CONFIG = {
  DEFAULT_PROJECT_PATH: './projects',
  TEMPLATE_PATHS: {
      runtime: './templates/runtime',
      parachain: './templates/parachain',
      dApp: './templates/dApp'
  },
  LOG_PATH: './logs'
};

// Monitoring thresholds and configurations
export const MONITORING_CONFIG = {
  // Transaction monitoring
  largeTransferThreshold: BigInt(1000000000000), // 1 trillion
  transactionTimeWindow: 60000, // 1 minute
  transactionCountThreshold: 10,
  maxTransactionsPerBlock: 1000,
  
  // Account monitoring
  newAccountThreshold: 24 * 60 * 60 * 1000, // 24 hours
  dormancyThreshold: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxAccountsTracked: 10000,
  accountCleanupInterval: 60 * 60 * 1000, // 1 hour
  
  // Cross-chain monitoring
  crossChainTransferThreshold: BigInt(500000000000),
  maxCrossChainTransfersPerHour: 50,
  bridgeOperationDelay: 300000, // 5 minutes
  
  // Governance monitoring
  suspiciousVotingThreshold: 5,
  largeDelegationThreshold: BigInt(100000000000),
  maxProposalsPerDay: 10,
  votingPatternTimeWindow: 24 * 60 * 60 * 1000, // 24 hours
  
  // Contract monitoring
  knownExploitSignatures: [
      '0x4e487b71', // Panic(uint256)
      '0x08c379a0', // Error(string)
      '0x6c7369a0'  // ReentrancyGuard
  ],
  maxContractSize: 24576, // bytes
  contractCallGasThreshold: 1000000,
  
  // Performance settings
  batchSize: 100,
  cacheSize: 1000,
  cleanupInterval: 3600000, // 1 hour
  maxConcurrentOperations: 5,
  
  // Alert settings
  maxAlertsStored: 1000,
  alertRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  criticalAlertThreshold: 10
};

// Development and debug settings
export const DEBUG_CONFIG = {
  ENABLED: process.env.DEBUG === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PERFORMANCE_MONITORING: true,
  DETAILED_LOGS: process.env.DETAILED_LOGS === 'true',
  SAVE_SUSPICIOUS_TRANSACTIONS: true
};

// Export default node URL for backward compatibility
export const NODE_URL = NODE_CONFIG.URL;
