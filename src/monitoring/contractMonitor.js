// src/monitoring/contractMonitor.js
import { MONITORING_CONFIG } from '../utils/config.js';
import { logError } from '../utils/helpers.js';

export class ContractMonitor {
  constructor() {
    this.knownExploitSignatures = new Set(MONITORING_CONFIG.knownExploitSignatures);
  }

  async analyzeContractCreation(extrinsic) {
    if (extrinsic.method.method === 'instantiateWithCode') {
      const bytecode = extrinsic.method.args[2].toString();
      await this.analyzeContractBytecode(bytecode);
    }
  }

  async analyzeContractCall(extrinsic) {
    if (extrinsic.method.method === 'call') {
      const callData = extrinsic.method.args[2].toString();
      for (const signature of this.knownExploitSignatures) {
        if (callData.includes(signature)) {
          logError(`Suspicious contract call detected with signature: ${signature}`);
        }
      }
    }
  }
}
