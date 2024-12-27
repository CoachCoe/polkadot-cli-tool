import { MONITORING_CONFIG } from '../utils/config.js';
import BaseMonitor from './baseMonitor.js';
import { ActivityType, AlertSeverity, TimeWindows } from './types.js';
import Logger from '../utils/logger.js';

export class CrossChainMonitor extends BaseMonitor {
    constructor() {
        super('CrossChainMonitor');
        this.crossChainTransfers = new Map();
        this.transferThreshold = MONITORING_CONFIG.crossChainTransferThreshold;
        this.circularTransfers = new Map();
        
        // Set up periodic cleanup
        setInterval(() => this.cleanupOldRecords(), TimeWindows.HOUR);
    }

    async _processActivity(extrinsic) {
        if (extrinsic.method.section === 'xcmPallet') {
            await this.analyzeCrossChainTransaction(extrinsic);
        }
    }

    async analyzeCrossChainTransaction(extrinsic) {
        try {
            const destination = extrinsic.method.args[0];
            const message = extrinsic.method.args[1];
            const sender = extrinsic.signer.toString();
            const timestamp = Date.now();

            await Promise.all([
                this.checkLargeTransfers(sender, destination, message, timestamp),
                this.checkTransferFrequency(sender, destination, timestamp),
                this.checkCircularTransfers(sender, destination, timestamp),
                this.checkBridgeExploits(message, sender, destination)
            ]);
        } catch (error) {
            Logger.error('Error analyzing cross-chain transaction:', error);
        }
    }

    async checkLargeTransfers(sender, destination, message, timestamp) {
        if (this.isTransferMessage(message)) {
            const amount = this.extractAmountFromMessage(message);
            if (amount > this.transferThreshold) {
                this.reportAlert({
                    type: ActivityType.LARGE_CROSS_CHAIN_TRANSFER,
                    severity: AlertSeverity.HIGH,
                    details: {
                        sender,
                        destination,
                        amount: amount.toString(),
                        timestamp: new Date(timestamp).toISOString()
                    }
                });
            }
        }
    }

    async checkTransferFrequency(sender, destination, timestamp) {
        const key = `${sender}-${destination}`;
        const transfers = this.crossChainTransfers.get(key) || [];
        
        // Add new transfer
        transfers.push(timestamp);
        
        // Keep only recent transfers
        const recentTransfers = transfers.filter(t => timestamp - t < TimeWindows.HOUR);
        this.crossChainTransfers.set(key, recentTransfers);

        if (recentTransfers.length > MONITORING_CONFIG.transactionCountThreshold) {
            this.reportAlert({
                type: ActivityType.XCMP_SPAM,
                severity: AlertSeverity.MEDIUM,
                details: {
                    sender,
                    destination,
                    frequency: recentTransfers.length,
                    timeWindow: 'hour'
                }
            });
        }
    }

    async checkCircularTransfers(sender, destination, timestamp) {
        const senderHistory = this.circularTransfers.get(sender) || [];
        senderHistory.push({ destination, timestamp });

        // Keep only recent transfers
        const recentHistory = senderHistory.filter(t => timestamp - t.timestamp < TimeWindows.HOUR);
        this.circularTransfers.set(sender, recentHistory);

        // Check for circular patterns
        if (this.detectCircularPattern(recentHistory)) {
            this.reportAlert({
                type: ActivityType.SUSPICIOUS_BRIDGE_ACTIVITY,
                severity: AlertSeverity.HIGH,
                details: {
                    sender,
                    pattern: 'circular_transfer',
                    transfers: recentHistory
                }
            });
        }
    }

    async checkBridgeExploits(message, sender, destination) {
        // Check for known bridge exploit patterns
        if (this.containsBridgeExploitPattern(message)) {
            this.reportAlert({
                type: ActivityType.SUSPICIOUS_BRIDGE_ACTIVITY,
                severity: AlertSeverity.CRITICAL,
                details: {
                    sender,
                    destination,
                    exploitPattern: this.identifyExploitPattern(message)
                }
            });
        }
    }

    isTransferMessage(message) {
        const messageStr = message.toString();
        return messageStr.includes('TransferAsset') || 
               messageStr.includes('TransferReserveAsset');
    }

    extractAmountFromMessage(message) {
        const messageStr = message.toString();
        const amountMatch = messageStr.match(/amount:\s*(\d+)/i);
        return amountMatch ? BigInt(amountMatch[1]) : BigInt(0);
    }

    detectCircularPattern(transfers) {
        // Implement circular transfer detection logic
        // Example: A -> B -> C -> A pattern
        const destinations = new Set(transfers.map(t => t.destination));
        return transfers.length >= 3 && destinations.size < transfers.length / 2;
    }

    containsBridgeExploitPattern(message) {
        // Implement bridge exploit pattern detection
        // This would check for known patterns that could exploit bridge vulnerabilities
        const messageStr = message.toString();
        const exploitPatterns = [
            'reentrant_bridge_call',
            'double_spend_attempt',
            'malformed_xcm'
        ];
        return exploitPatterns.some(pattern => messageStr.includes(pattern));
    }

    identifyExploitPattern(message) {
        // Implement specific exploit pattern identification
        // Return details about the type of exploit attempt
        const messageStr = message.toString();
        // This is a simplified example
        return messageStr.includes('reentrant') ? 'reentrant_attack' : 'unknown_exploit';
    }

    cleanupOldRecords() {
        const cutoff = Date.now() - TimeWindows.DAY;
        
        // Cleanup transfer history
        for (const [key, transfers] of this.crossChainTransfers.entries()) {
            const recentTransfers = transfers.filter(t => t > cutoff);
            if (recentTransfers.length === 0) {
                this.crossChainTransfers.delete(key);
            } else {
                this.crossChainTransfers.set(key, recentTransfers);
            }
        }

        // Cleanup circular transfer history
        for (const [sender, history] of this.circularTransfers.entries()) {
            const recentHistory = history.filter(t => t.timestamp > cutoff);
            if (recentHistory.length === 0) {
                this.circularTransfers.delete(sender);
            } else {
                this.circularTransfers.set(sender, recentHistory);
            }
        }

        Logger.debug(`Cross-chain monitor cleanup complete. Tracking ${this.crossChainTransfers.size} transfer patterns`);
    }
}
