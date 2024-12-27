// src/utils/config.js
export const NODE_URL = 'ws://127.0.0.1:9944';
export const DEFAULT_PROJECT_PATH = './projects';
export const TEMPLATE_PATHS = {
  runtime: './templates/runtime',
  parachain: './templates/parachain',
  dApp: './templates/dApp',
};

// New monitoring configurations
export const MONITORING_CONFIG = {
  // Transaction monitoring
  largeTransferThreshold: BigInt(1000000000000),
  transactionTimeWindow: 60000, // 1 minute
  transactionCountThreshold: 10,
  
  // Account monitoring
  newAccountThreshold: 24 * 60 * 60 * 1000, // 24 hours
  dormancyThreshold: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Cross-chain monitoring
  crossChainTransferThreshold: BigInt(500000000000),
  
  // Governance monitoring
  suspiciousVotingThreshold: 5,
  largeDelegationThreshold: BigInt(100000000000),
  
  // Known malicious patterns
  knownExploitSignatures: [
    '0x4e487b71', // Panic(uint256)
    '0x08c379a0'  // Error(string)
  ]
};
