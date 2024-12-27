// src/monitoring/accountMonitor.js
import { MONITORING_CONFIG } from '../utils/config.js';
import { logError, logInfo } from '../utils/helpers.js';
import { ActivityType } from './types.js';

export class AccountMonitor {
    constructor() {
        this.accountHistory = new Map();
        this.newAccountThreshold = MONITORING_CONFIG.newAccountThreshold;
        this.dormancyThreshold = MONITORING_CONFIG.dormancyThreshold;
    }

    async monitorActivity(extrinsic) {
        if (!extrinsic.signer) return;

        const account = extrinsic.signer.toString();
        const timestamp = Date.now();

        // Check if this is a new account
        if (!this.accountHistory.has(account)) {
            this.accountHistory.set(account, {
                creationTime: timestamp,
                lastActivity: timestamp,
                transactions: []
            });

            // Monitor new accounts making large transactions
            if (extrinsic.method.section === 'balances') {
                const amount = extrinsic.method.args[1];
                if (amount > MONITORING_CONFIG.largeTransferThreshold) {
                    logError(`${ActivityType.NEW_ACCOUNT_LARGE_TRANSACTION}: Account ${account} made large transaction of ${amount}`);
                }
            }
        }

        // Check for dormant accounts becoming active
        const accountData = this.accountHistory.get(account);
        if (accountData) {
            const timeSinceLastActivity = timestamp - accountData.lastActivity;
            if (timeSinceLastActivity > this.dormancyThreshold) {
                logError(`${ActivityType.DORMANT_ACCOUNT_ACTIVITY}: Account ${account} active after ${timeSinceLastActivity}ms dormancy`);
            }

            // Update account activity
            accountData.lastActivity = timestamp;
            accountData.transactions.push({
                timestamp,
                method: `${extrinsic.method.section}.${extrinsic.method.method}`
            });

            // Prune old transactions
            const oneHourAgo = timestamp - (60 * 60 * 1000);
            accountData.transactions = accountData.transactions.filter(tx => tx.timestamp > oneHourAgo);

            // Check for high-frequency trading
            if (accountData.transactions.length > MONITORING_CONFIG.transactionCountThreshold) {
                logError(`${ActivityType.HIGH_FREQUENCY_TRADING}: Account ${account} made ${accountData.transactions.length} transactions in the last hour`);
            }
        }
    }

    getAccountStats(account) {
        return this.accountHistory.get(account);
    }
}
