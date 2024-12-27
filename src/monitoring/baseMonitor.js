import Logger from '../utils/logger.js';
import { AlertSeverity, MonitoringResponse } from './types.js';

export class BaseMonitor {
    constructor(name) {
        this.name = name;
        this.isActive = true;
        this.alerts = [];
    }

    async monitorActivity(extrinsic) {
        if (!this.isActive) return;

        try {
            const startTime = Date.now();
            await this._processActivity(extrinsic);
            this._logPerformance(startTime);
        } catch (error) {
            Logger.error(`Error in ${this.name}`, error);
        }
    }

    reportAlert(alert) {
        const formattedAlert = {
            ...alert,
            timestamp: new Date().toISOString(),
            monitor: this.name,
            severity: alert.severity || AlertSeverity.MEDIUM
        };

        this.alerts.push(formattedAlert);
        Logger.activity(formattedAlert.type, formattedAlert);
    }

    getAlerts(timeWindow = 3600000) { // Default 1 hour
        const cutoff = Date.now() - timeWindow;
        return this.alerts.filter(alert => new Date(alert.timestamp).getTime() > cutoff);
    }

    clearOldAlerts(maxAge = 86400000) { // Default 24 hours
        const cutoff = Date.now() - maxAge;
        this.alerts = this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
    }

    pause() {
        this.isActive = false;
        Logger.info(`${this.name} monitoring paused`);
    }

    resume() {
        this.isActive = true;
        Logger.info(`${this.name} monitoring resumed`);
    }

    _logPerformance(startTime) {
        const duration = Date.now() - startTime;
        if (duration > 100) { // Log if processing takes more than 100ms
            Logger.warn(`${this.name} processing took ${duration}ms`);
        }
    }

    // To be implemented by child classes
    async _processActivity(extrinsic) {
        throw new Error('_processActivity must be implemented by child class');
    }
}

export default BaseMonitor;
