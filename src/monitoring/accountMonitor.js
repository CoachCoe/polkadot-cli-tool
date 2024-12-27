import { MONITORING_CONFIG } from '../utils/config.js';
import BaseMonitor from './baseMonitor.js';
import { ActivityType, AlertSeverity, TimeWindows } from './types.js';
import Logger from '../utils/logger.js';

export class AccountMonitor extends BaseMonitor {
    constructor() {
        super('AccountMonitor');
        this.accountHistory = new Map();
        this.newAccountThreshold = MONITORING_CONFIG.newAccountThreshold;
        this.dormancyThreshold = MONITORING_CONFIG.dormancyThreshold;
        
        // Set up periodic cleanup
        setInterval(() => this.cleanupOldRecords(), TimeWindows.HOUR);
    }

    async _processActivity(extrinsic) {
        if (!extrinsic.signer) return;

        const account = extrinsic.signer.toString();
        const timestamp = Date.now();

        await Promise.all([
            this.checkNewAccount(account, extrinsic, timestamp),
            this.checkAccountActivity(account, extrinsic, timestamp),
            this.trackTransactionPattern(account, extrinsic, timestamp)
        ]);
    }

    async checkNewAccount(account, extrinsic, timestamp) {
        if (!this.accountHistory.has(account)) {
            this.accountHistory.set(account, {
                creationTime: timestamp,
                lastActivity: timestamp,
                transactions: [],
                balanceHistory: []
            });

            // Monitor new accounts making large transactions
            if (extrinsic.method.section === 'balances') {
                const amount = extrinsic.method.args[1];
                if (amount > MONITORING_CONFIG.largeTransferThreshold) {
                    this.reportAlert({
                        type: ActivityType.NEW_ACCOUNT_LARGE_TRANSACTION,
                        severity: AlertSeverity.HIGH,
                        details: {
                            account,
                            amount: amount.toString(),
                            transactionType: extrinsic.method.method
                        }
                    });
                }
            }
        }
    }

    async checkAccountActivity(account, extrinsic, timestamp) {
        const accountData = this.accountHistory.get(account);
        if (!accountData) return;

        const timeSinceLastActivity = timestamp - accountData.lastActivity;
        if (timeSinceLastActivity > this.dormancyThreshold) {
            this.reportAlert({
                type: ActivityType.DORMANT_ACCOUNT_ACTIVITY,
                severity: AlertSeverity.MEDIUM,
                details: {
                    account,
                    dormancyPeriod: timeSinceLastActivity,
                    lastActivity: new Date(accountData.lastActivity).toISOString()
                }
            });
        }

        // Update account activity
        accountData.lastActivity = timestamp;
        accountData.transactions.push({
            timestamp,
            method: `${extrinsic.method.section}.${extrinsic.method.method}`,
            success: true // You might want to check the actual success status
        });
    }

    async trackTransactionPattern(account, extrinsic, timestamp) {
        const accountData = this.accountHistory.get(account);
        if (!accountData) return;

        // Keep only recent transactions
        accountData.transactions = accountData.transactions.filter(tx => 
            timestamp - tx.timestamp < TimeWindows.HOUR
        );

        // Check for high-frequency trading
        if (accountData.transactions.length > MONITORING_CONFIG.transactionCountThreshold) {
            this.reportAlert({
                type: ActivityType.HIGH_FREQUENCY_TRADING,
                severity: AlertSeverity.MEDIUM,
                details: {
                    account,
                    transactionCount: accountData.transactions.length,
                    timeWindow: 'last hour'
                }
            });
        }

        // Check for potential account draining
        if (extrinsic.method.section === 'balances' && 
            extrinsic.method.method === 'transfer') {
            const amount = extrinsic.method.args[1];
            // You would need to fetch actual account balance here
            // This is a simplified check
            if (this.isPotentialDraining(accountData, amount)) {
                this.reportAlert({
                    type: ActivityType.ACCOUNT_DRAINING,
                    severity: AlertSeverity.HIGH,
                    details: {
                        account,
                        amount: amount.toString()
                    }
                });
            }
        }
    }

    isPotentialDraining(accountData, amount) {
        // Implement more sophisticated drain detection
        // This is a simplified example
        return amount > MONITORING_CONFIG.largeTransferThreshold;
    }

    cleanupOldRecords() {
        const cutoff = Date.now() - TimeWindows.WEEK;
        for (const [account, data] of this.accountHistory.entries()) {
            // Remove old transactions
            data.transactions = data.transactions.filter(tx => 
                tx.timestamp > cutoff
            );

            // Remove account history if inactive for a long time
            if (data.lastActivity < cutoff) {
                this.accountHistory.delete(account);
            }
        }
        Logger.debug(`Cleaned up account history. Current accounts tracked: ${this.accountHistory.size}`);
    }
}
