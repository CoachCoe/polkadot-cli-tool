import { ApiPromise, WsProvider } from '@polkadot/api';
import Logger from './logger.js';

class ConnectionManager {
    constructor(nodeUrl) {
        this.nodeUrl = nodeUrl;
        this.api = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
    }

    async connect() {
        try {
            if (this.api) {
                await this.disconnect();
            }

            const provider = new WsProvider(this.nodeUrl);
            this.api = await ApiPromise.create({ provider });

            provider.on('error', this.handleConnectionError.bind(this));
            provider.on('disconnected', this.handleDisconnection.bind(this));

            this.reconnectAttempts = 0;
            Logger.success(`Connected to node at ${this.nodeUrl}`);
            
            return this.api;
        } catch (error) {
            Logger.error('Failed to connect to node', error);
            return this.handleConnectionError(error);
        }
    }

    async disconnect() {
        if (this.api) {
            await this.api.disconnect();
            this.api = null;
        }
    }

    async handleConnectionError(error) {
        Logger.error('Connection error occurred', error);
        return this.attemptReconnect();
    }

    async handleDisconnection() {
        Logger.warn('Disconnected from node');
        return this.attemptReconnect();
    }

    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Logger.error('Max reconnection attempts reached');
            throw new Error('Failed to maintain connection to node');
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        Logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
    }

    getApi() {
        if (!this.api) {
            throw new Error('Not connected to node');
        }
        return this.api;
    }
}

export default ConnectionManager;
