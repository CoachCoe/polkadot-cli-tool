import { MONITORING_CONFIG } from '../utils/config.js';
import BaseMonitor from './baseMonitor.js';
import Logger from '../utils/logger.js';
import { ActivityType, AlertSeverity } from './types.js';

export class ContractMonitor extends BaseMonitor {
    constructor() {
        super('ContractMonitor');
        this.knownExploitSignatures = new Set(MONITORING_CONFIG.knownExploitSignatures);
        this.recentContracts = new Map(); // Track recent contract creations
    }

    async _processActivity(extrinsic) {
        if (extrinsic.method.section === 'contracts') {
            switch(extrinsic.method.method) {
                case 'instantiateWithCode':
                    await this.analyzeContractCreation(extrinsic);
                    break;
                case 'call':
                    await this.analyzeContractCall(extrinsic);
                    break;
                case 'terminate':
                    await this.analyzeContractTermination(extrinsic);
                    break;
            }
        }
    }

    async analyzeContractCreation(extrinsic) {
        const bytecode = extrinsic.method.args[2].toString();
        const deployer = extrinsic.signer.toString();
        const timestamp = Date.now();

        // Check for known malicious patterns
        for (const signature of this.knownExploitSignatures) {
            if (bytecode.includes(signature)) {
                this.reportAlert({
                    type: ActivityType.MALICIOUS_CONTRACT,
                    severity: AlertSeverity.HIGH,
                    details: {
                        signature,
                        deployer,
                        bytecodeHash: this.hashBytecode(bytecode)
                    }
                });
            }
        }

        // Track contract creation
        this.recentContracts.set(deployer, {
            timestamp,
            bytecodeHash: this.hashBytecode(bytecode)
        });

        // Clean up old contract records
        this.cleanupOldRecords();
    }

    async analyzeContractCall(extrinsic) {
        const callData = extrinsic.method.args[2].toString();
        const caller = extrinsic.signer.toString();
        const contractAddress = extrinsic.method.args[0].toString();

        // Check for malicious call patterns
        for (const signature of this.knownExploitSignatures) {
            if (callData.includes(signature)) {
                this.reportAlert({
                    type: ActivityType.SUSPICIOUS_CONTRACT_CALL,
                    severity: AlertSeverity.MEDIUM,
                    details: {
                        signature,
                        caller,
                        contractAddress,
                        callDataHash: this.hashCallData(callData)
                    }
                });
            }
        }

        // Check for potential reentrancy
        if (this.isPotentialReentrancy(callData, contractAddress)) {
            this.reportAlert({
                type: ActivityType.REENTRANT_CALL,
                severity: AlertSeverity.HIGH,
                details: {
                    caller,
                    contractAddress
                }
            });
        }
    }

    async analyzeContractTermination(extrinsic) {
        const contractAddress = extrinsic.method.args[0].toString();
        const terminator = extrinsic.signer.toString();

        this.reportAlert({
            type: ActivityType.CONTRACT_SELF_DESTRUCT,
            severity: AlertSeverity.MEDIUM,
            details: {
                terminator,
                contractAddress
            }
        });
    }

    isPotentialReentrancy(callData, contractAddress) {
        // Implement reentrancy detection logic
        // This is a simplified example - you'd want more sophisticated detection
        return callData.includes('transfer') && callData.includes(contractAddress);
    }

    hashBytecode(bytecode) {
        // Implement bytecode hashing
        return bytecode.slice(0, 10); // Simplified for example
    }

    hashCallData(callData) {
        // Implement call data hashing
        return callData.slice(0, 10); // Simplified for example
    }

    cleanupOldRecords() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [deployer, data] of this.recentContracts.entries()) {
            if (data.timestamp < oneHourAgo) {
                this.recentContracts.delete(deployer);
            }
        }
    }
}
