// src/monitoring/governanceMonitor.js
import { MONITORING_CONFIG } from '../utils/config.js';
import { logError, logInfo } from '../utils/helpers.js';
import { ActivityType } from './types.js';

export class GovernanceMonitor {
    constructor() {
        this.proposalHistory = new Map();
        this.votingHistory = new Map();
        this.delegationHistory = new Map();
    }

    async monitorActivity(extrinsic) {
        if (extrinsic.method.section === 'democracy') {
            await this.analyzeGovernanceActivity(extrinsic);
        }
    }

    async analyzeGovernanceActivity(extrinsic) {
        const account = extrinsic.signer.toString();
        const timestamp = Date.now();

        switch (extrinsic.method.method) {
            case 'propose':
                await this.monitorProposal(account, timestamp);
                break;
            case 'vote':
                await this.monitorVoting(account, extrinsic.method.args, timestamp);
                break;
            case 'delegate':
                await this.monitorDelegation(account, extrinsic.method.args, timestamp);
                break;
        }
    }

    async monitorProposal(account, timestamp) {
        // Track proposal frequency
        const proposals = this.proposalHistory.get(account) || [];
        proposals.push(timestamp);

        // Remove proposals older than 24 hours
        const oneDayAgo = timestamp - (24 * 60 * 60 * 1000);
        const recentProposals = proposals.filter(t => t > oneDayAgo);
        
        this.proposalHistory.set(account, recentProposals);

        // Check for proposal spam
        if (recentProposals.length > MONITORING_CONFIG.suspiciousVotingThreshold) {
            logError(`${ActivityType.GOVERNANCE_SPAM}: Account ${account} submitted ${recentProposals.length} proposals in 24 hours`);
        }
    }

    async monitorVoting(account, voteArgs, timestamp) {
        const voteData = {
            timestamp,
            vote: voteArgs[1], // Assuming args[1] contains the vote data
            referendumIndex: voteArgs[0]
        };

        // Track voting history
        const votes = this.votingHistory.get(account) || [];
        votes.push(voteData);

        // Look for suspicious voting patterns
        await this.analyzeVotingPattern(account, votes);
    }

    async monitorDelegation(account, delegationArgs, timestamp) {
        const amount = delegationArgs[1];
        const target = delegationArgs[0];

        // Check for large delegations
        if (amount > MONITORING_CONFIG.largeDelegationThreshold) {
            logError(`Large delegation detected: ${account} delegated ${amount} to ${target}`);
        }

        // Track delegation history
        const delegations = this.delegationHistory.get(account) || [];
        delegations.push({ timestamp, amount, target });

        // Check for suspicious delegation patterns
        await this.analyzeDelegationPattern(account, delegations);
    }

    async analyzeVotingPattern(account, votes) {
        // Remove votes older than 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentVotes = votes.filter(v => v.timestamp > oneDayAgo);

        // Check for rapid vote changes
        const voteChanges = this.countVoteChanges(recentVotes);
        if (voteChanges > MONITORING_CONFIG.suspiciousVotingThreshold) {
            logError(`${ActivityType.SUSPICIOUS_VOTING_PATTERN}: Account ${account} changed votes ${voteChanges} times in 24 hours`);
        }

        this.votingHistory.set(account, recentVotes);
    }

    async analyzeDelegationPattern(account, delegations) {
        // Remove delegations older than 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentDelegations = delegations.filter(d => d.timestamp > oneDayAgo);

        // Check for frequent delegation changes
        if (recentDelegations.length > MONITORING_CONFIG.suspiciousVotingThreshold) {
            logError(`Suspicious delegation pattern: ${account} made ${recentDelegations.length} delegation changes in 24 hours`);
        }

        this.delegationHistory.set(account, recentDelegations);
    }

    countVoteChanges(votes) {
        if (votes.length < 2) return 0;
        
        let changes = 0;
        for (let i = 1; i < votes.length; i++) {
            if (votes[i].vote !== votes[i-1].vote) {
                changes++;
            }
        }
        return changes;
    }
}
