import chalk from 'chalk';

class Logger {
    static info(message) {
        console.log(chalk.blue(`[INFO] ${message}`));
    }

    static success(message) {
        console.log(chalk.green(`[SUCCESS] ${message}`));
    }

    static error(message, error = null) {
        console.error(chalk.red(`[ERROR] ${message}`));
        if (error?.stack) {
            console.error(chalk.red(error.stack));
        }
    }

    static warn(message) {
        console.warn(chalk.yellow(`[WARNING] ${message}`));
    }

    static debug(message) {
        if (process.env.DEBUG) {
            console.log(chalk.gray(`[DEBUG] ${message}`));
        }
    }

    static activity(type, details) {
        console.log(chalk.magenta(`[ACTIVITY] ${type}: ${JSON.stringify(details)}`));
    }
}

export default Logger;
