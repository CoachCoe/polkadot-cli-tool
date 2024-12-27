// src/monitoring/types.js

// Define all possible activity types that can be monitored
export const ActivityType = {
    // Account-related activities
    NEW_ACCOUNT_LARGE_TRANSACTION: 'NewAccountLargeTransaction',
    DORMANT_ACCOUNT_ACTIVITY: 'DormantAccountActivity',
    HIGH_FREQUENCY_TRADING: 'HighFrequencyTrading',
    ACCOUNT_DRAINING: 'AccountDraining',

    // Contract-related activities
    MALICIOUS_CONTRACT: 'MaliciousContract',
    CONTRACT_SELF_DESTRUCT: 'ContractSelfDestruct',
    SUSPICIOUS_CONTRACT_CALL: 'SuspiciousContractCall',
    REENTRANT_CALL: 'ReentrantCall',

    // Cross-chain activities
    LARGE_CROSS_CHAIN_TRANSFER: 'LargeCrossChainTransfer',
    SUSPICIOUS_BRIDGE_ACTIVITY: 'SuspiciousBridgeActivity',
    XCMP_SPAM: 'XcmpSpam',

    // Governance activities
    SUSPICIOUS_VOTING_PATTERN: 'SuspiciousVotingPattern',
    GOVERNANCE_SPAM: 'GovernanceSpam',
    UNUSUAL_DELEGATION: 'UnusualDelegation',
    COORDINATED_VOTING: 'CoordinatedVoting'
};

// Define monitoring metrics
export const MonitoringMetrics = {
    TRANSACTION_COUNT: 'transactionCount',
    TOTAL_VALUE: 'totalValue',
    FAILURE_RATE: 'failureRate',
    VOTING_WEIGHT: 'votingWeight',
    MESSAGE_FREQUENCY: 'messageFrequency',
    UNIQUE_INTERACTIONS: 'uniqueInteractions'
};

// Define severity levels for alerts
export const AlertSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Define standard alert format
export const AlertFormat = {
    timestamp: null,
    type: null,
    severity: null,
    details: null,
    account: null,
    value: null,
    metadata: null
};

// Define monitoring intervals (in milliseconds)
export const TimeWindows = {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
};

// Define standard response format for monitoring data
export const MonitoringResponse = {
    success: true,
    timestamp: null,
    data: null,
    alerts: [],
    metadata: {}
};
