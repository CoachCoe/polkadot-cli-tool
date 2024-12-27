import { createHash } from 'crypto';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { DEBUG_CONFIG, PATH_CONFIG } from './config.js';
import Logger from './logger.js';

// File System Operations
export async function createDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        Logger.error(`Failed to create directory: ${dirPath}`, error);
        throw error;
    }
}

export async function writeFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        await createDirectory(dir);
        await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
        Logger.error(`Failed to write file: ${filePath}`, error);
        throw error;
    }
}

export async function readConfigFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        Logger.error(`Failed to read config file: ${filePath}`, error);
        throw error;
    }
}

// Path Operations
export function resolvePath(relativePath) {
    return path.resolve(process.cwd(), relativePath);
}

// Command Execution
export function executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                Logger.error(`Command execution failed: ${command}`, error);
                reject(error);
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

// Data Validation and Processing
export function validateAddress(address) {
    // Implement address validation logic for your chain
    return address.length === 48 && address.startsWith('5');
}

export function hashData(data) {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Performance Monitoring
const performanceMetrics = new Map();

export function startMetrics(operation) {
    if (DEBUG_CONFIG.PERFORMANCE_MONITORING) {
        performanceMetrics.set(operation, process.hrtime());
    }
}

export function endMetrics(operation) {
    if (DEBUG_CONFIG.PERFORMANCE_MONITORING) {
        const start = performanceMetrics.get(operation);
        if (start) {
            const [seconds, nanoseconds] = process.hrtime(start);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            Logger.debug(`Operation '${operation}' took ${duration.toFixed(2)}ms`);
            performanceMetrics.delete(operation);
        }
    }
}

// Memory Management
export function getMemoryUsage() {
    const used = process.memoryUsage();
    return {
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024),
        rss: Math.round(used.rss / 1024 / 1024)
    };
}

// Rate Limiting
const rateLimiters = new Map();

export function checkRateLimit(key, maxRequests, timeWindow) {
    const now = Date.now();
    const requests = rateLimiters.get(key) || [];
    
    // Remove expired entries
    const validRequests = requests.filter(time => now - time < timeWindow);
    
    if (validRequests.length >= maxRequests) {
        return false;
    }
    
    validRequests.push(now);
    rateLimiters.set(key, validRequests);
    return true;
}

// Error Handling
export class CustomError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'CustomError';
        this.code = code;
        this.details = details;
    }
}

// Data Caching
const cache = new Map();

export function cacheData(key, data, ttl = 3600000) { // Default TTL: 1 hour
    cache.set(key, {
        data,
        expiry: Date.now() + ttl
    });
}

export function getCachedData(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    
    return entry.data;
}

// Cleanup routines
export function cleanupCaches() {
    const now = Date.now();
    
    // Clean up rate limiters
    for (const [key, requests] of rateLimiters.entries()) {
        const validRequests = requests.filter(time => now - time < 3600000);
        if (validRequests.length === 0) {
            rateLimiters.delete(key);
        } else {
            rateLimiters.set(key, validRequests);
        }
    }
    
    // Clean up cache
    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiry) {
            cache.delete(key);
        }
    }
    
    // Clean up performance metrics
    for (const [operation, startTime] of performanceMetrics.entries()) {
        if (now - startTime[0] * 1000 > 3600000) {
            performanceMetrics.delete(operation);
        }
    }
    
    Logger.debug('Cache cleanup completed', {
        rateLimiters: rateLimiters.size,
        cache: cache.size,
        metrics: performanceMetrics.size
    });
}

// Set up periodic cleanup
setInterval(cleanupCaches, 3600000); // Run every hour

// Export common constants
export const TimeWindows = {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
};
