import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Performance Monitoring
const performanceMetrics = new Map();

export function startMetrics(operation) {
    performanceMetrics.set(operation, process.hrtime());
}

export function endMetrics(operation) {
    const start = performanceMetrics.get(operation);
    if (start) {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        Logger.debug(`Operation '${operation}' took ${duration.toFixed(2)}ms`);
        performanceMetrics.delete(operation);
    }
}

// Export common constants
export const TimeWindows = {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
};
