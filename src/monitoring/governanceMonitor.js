import { MONITORING_CONFIG } from '../utils/config.js';
import BaseMonitor from './baseMonitor.js';
import { ActivityType, AlertSeverity, TimeWindows } from './types.js';
import Logger from '../utils/logger.js';

export class GovernanceMonitor extends BaseMonitor {
    constructor() {
        super('GovernanceMonitor');
        this.proposalHistory = new Map();
        this.votingHistory = new Map();
        this.delegationHistory = new Map();
        this.voteCoalitions = new Map();
        
        // Cleanup old records periodically
        setInterval(() => this.cleanupOldRecords(), TimeWindows.HOUR);
    }

    async _processActivity(extrinsic) {
        if (extrinsic.method.section === 'democracy') {
            await this.analyzeGovernanceActivity(extrinsic);
        }
    }

    async analyzeGovernanceActivity(extrinsic) {
        const account = extrinsic.signer.toString();
        const timestamp = Date.now();

        switch (extrinsic.method.method) {
            case 'propose':
                await this.monitorProposal(account, extrinsic, timestamp);
                break;
            case 'vote':
                await this.monitorVoting(account, extrinsic.method.args, timestamp);
                break;
            case 'delegate':
                await this.monitorDelegation(account, extrinsic.method.args, timestamp);
                break;
            case 'second':
                await this.monitorSecond(account, extrinsic.method.args, timestamp);
                break;
        }
    }

    async monitorProposal(account, extrinsic, timestamp) {
        const proposals = this.proposalHistory.get(account) || [];
        proposals.push({
            timestamp,
            hash: extrinsic.method.args[0].toString(),
            value: extrinsic.method.args[1].toString()
        });

        // Remove proposals older than 24 hours
        const recentProposals = proposals.filter(p => 
            timestamp - p.timestamp < TimeWindows.DAY
        );
        
        this.proposalHistory.set(account, recentProposals);

        // Check for proposal spam
        if (recentProposals.length > MONITORING_CONFIG.suspiciousVotingThreshold) {
            this.reportAlert({
                type: ActivityType.GOVERNANCE_SPAM,
                severity: AlertSeverity.HIGH,
                details: {
                    account,
                    proposalCount: recentProposals.length,
                    timeWindow: '24 hours'
                }
            });
        }
    }

    async monitorVoting(account, voteArgs, timestamp) {
        const voteData = {
            timestamp,
            referendumIndex: voteArgs[0].toString(),
            vote: voteArgs[1],
            conviction: this.extractConviction(voteArgs[1])
        };

        // Track voting history
        const votes = this.votingHistory.get(account) || [];
        votes.push(voteData);

        // Check for suspicious patterns
        await Promise.all([
            this.analyzeVotingPattern(account, votes),
            this.detectCoordinatedVoting(account, voteData)
        ]);

        this.votingHistory.set(account, votes);
    }

    async monitorDelegation(account, delegationArgs, timestamp) {
        const target = delegationArgs[0].toString();
        const amount = delegationArgs[1];
        const conviction = delegationArgs[2];

        // Track delegation history
        const delegations = this.delegationHistory.get(account) || [];
        delegations.push({ timestamp, target, amount, conviction });

        // Check for large delegations
        if (amount > MONITORING_CONFIG.largeDelegationThreshold) {
            this.reportAlert({
                type: ActivityType.UNUSUAL_DELEGATION,
                severity: AlertSeverity.MEDIUM,
                details: {
                    account,
                    target,
                    amount: amount.toString(),
                    conviction
                }
            });
        }

        await this.analyzeDelegationPattern(account, delegations);
        this.delegationHistory.set(account, delegations);
    }

    async monitorSecond(account, secondArgs, timestamp) {
        // Implement seconding monitoring logic
    }

    async analyzeVotingPattern(account, votes) {
        const recentVotes = votes.filter(v => 
            Date.now() - v.timestamp < TimeWindows.DAY
        );

        // Check for vote flipping
        const voteChanges = this.countVoteChanges(recentVotes);
        if (voteChanges > MONITORING_CONFIG.suspiciousVotingThreshold) {
            this.reportAlert({
                type: ActivityType.SUSPICIOUS_VOTING_PATTERN,
                severity: AlertSeverity.HIGH,
                details: {
                    account,
                    voteChanges,
                    timeWindow: '24 hours'
                }
            });
        }
    }

    async detectCoordinatedVoting(account, voteData) {
        const key = `${voteData.referendumIndex}-${JSON.stringify(voteData.vote)}`;
        const coalition = this.voteCoalitions.get(key) || new Set();
        
        coalition.add(account);
        this.voteCoalitions.set(key, coalition);

        // Check for suspicious voting coalitions
        if (coalition.size >= MONITORING_CONFIG.suspiciousVotingThreshold) {
            this.reportAlert({
                type: ActivityType.COORDINATED_VOTING,
                severity: AlertSeverity.HIGH,
                details: {
                    referendumIndex: voteData.referendumIndex,
                    coalitionSize: coalition.size,
                    accounts: Array.from(coalition)
                }
            });
        }
    }

    countVoteChanges(votes) {
        if (votes.length < 2) return 0;
        
        let changes = 0;
        for (let i = 1; i < votes.length; i++) {
            if (JSON.stringify(votes[i].vote) !== JSON.stringify(votes[i-1].vote)) {
                changes++;
            }
        }
        return changes;
    }

    extractConviction(vote) {
        // Implement conviction extraction logic based on your chain's voting format
        return 0;
    }

    cleanupOldRecords() {
        const dayAgo = Date.now() - TimeWindows.DAY;
        const weekAgo = Date.now() - TimeWindows.WEEK;

        // Cleanup proposal history
        for (const [account, proposals] of this.proposalHistory.entries()) {
            const recentProposals = proposals.filter(p => p.timestamp > dayAgo);
            if (recentProposals.length === 0) {
                this.proposalHistory.delete(account);
            } else {
                this.proposalHistory.set(account, recentProposals);
            }
        }

        // Cleanup voting history
        for (const [account, votes] of this.votingHistory.entries()) {
            const recentVotes = votes.filter(v => v.timestamp > weekAgo);
            if (recentVotes.length === 0) {
                this.votingHistory.delete(account);
            } else {
                this.votingHistory.set(account, recentVotes);
            }
        }

        // Cleanup coalition tracking
        for (const [key, coalition] of this.voteCoalitions.entries()) {
            if (key.split('-')[0] < Date.now() - TimeWindows.WEEK) {
                this.voteCoalitions.delete(key);
            }
        }

        Logger.debug(`Cleaned up governance records. Current tracked accounts: ${this.votingHistory.size}`);
    }
}
