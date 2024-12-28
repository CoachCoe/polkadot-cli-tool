import chalk from 'chalk';

export function info(message) {
    console.log(chalk.blue(`[INFO] ${message}`));
}

export function success(message) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
}

export function error(message, error = null) {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (error?.stack) {
        console.error(chalk.red(error.stack));
    }
}

export function warn(message) {
    console.warn(chalk.yellow(`[WARNING] ${message}`));
}

export function debug(message) {
    if (process.env.DEBUG) {
        console.log(chalk.gray(`[DEBUG] ${message}`));
    }
}

export function activity(type, details) {
    console.log(chalk.magenta(`[ACTIVITY] ${type}: ${JSON.stringify(details)}`));
}
