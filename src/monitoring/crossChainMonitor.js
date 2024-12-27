// src/monitoring/crossChainMonitor.js
import { MONITORING_CONFIG } from '../utils/config.js';
import { logError, logInfo } from '../utils/helpers.js';
import { ActivityType } from './types.js';

export class CrossChainMonitor {
    constructor() {
        this.crossChainTransfers = new Map();
        this.transferThreshold = MONITORING_CONFIG.crossChainTransferThreshold;
    }

    async monitorActivity(extrinsic) {
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

            // Monitor for large cross-chain transfers
            if (this.isTransferMessage(message)) {
                const amount = this.extractAmountFromMessage(message);
                if (amount > this.transferThreshold) {
                    logError(`${ActivityType.LARGE_CROSS_CHAIN_TRANSFER}: Large cross-chain transfer detected`);
                    logError(`From: ${sender}`);
                    logError(`To: ${destination}`);
                    logError(`Amount: ${amount}`);
                }

                // Track transfer frequency
                this.trackTransferFrequency(sender, destination, timestamp);
            }

            // Monitor for unusual patterns
            await this.checkForUnusualPatterns(sender, destination);
        } catch (error) {
            logError(`Error analyzing cross-chain transaction: ${error.message}`);
        }
    }

    isTransferMessage(message) {
        // Check if the XCM message contains a transfer instruction
        return message.toString().includes('TransferAsset') || 
               message.toString().includes('TransferReserveAsset');
    }

    extractAmountFromMessage(message) {
        // Extract the transfer amount from the XCM message
        // This is a simplified version - you'd need to adjust based on your specific XCM message format
        const messageStr = message.toString();
        const amountMatch = messageStr.match(/amount:\s*(\d+)/i);
        return amountMatch ? BigInt(amountMatch[1]) : BigInt(0);
    }

    trackTransferFrequency(sender, destination, timestamp) {
        const key = `${sender}-${destination}`;
        const transfers = this.crossChainTransfers.get(key) || [];
        
        // Add new transfer
        transfers.push(timestamp);
        
        // Remove transfers older than 1 hour
        const oneHourAgo = timestamp - (60 * 60 * 1000);
        const recentTransfers = transfers.filter(t => t > oneHourAgo);
        
        this.crossChainTransfers.set(key, recentTransfers);

        // Check frequency
        if (recentTransfers.length > MONITORING_CONFIG.transactionCountThreshold) {
            logError(`High frequency cross-chain transfers detected between ${sender} and ${destination}`);
            logError(`${recentTransfers.length} transfers in the last hour`);
        }
    }

    async checkForUnusualPatterns(sender, destination) {
        // Add additional pattern checks here
        // For example:
        // - Check for circular transfers
        // - Monitor for bridge exploit patterns
        // - Check for unusual destination chains
        // This is where you'd implement more sophisticated pattern recognition
    }
}
