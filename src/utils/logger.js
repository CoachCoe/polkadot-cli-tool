import chalk from 'chalk';

export const Logger = {
    info(message) {
        console.log(chalk.blue(`[INFO] ${message}`));
    },

    success(message) {
        console.log(chalk.green(`[SUCCESS] ${message}`));
    },

    error(message, error = null) {
        console.error(chalk.red(`[ERROR] ${message}`));
        if (error?.stack) {
            console.error(chalk.red(error.stack));
        }
    },

    warn(message) {
        console.warn(chalk.yellow(`[WARNING] ${message}`));
    },

    debug(message) {
        if (process.env.DEBUG) {
            console.log(chalk.gray(`[DEBUG] ${message}`));
        }
    },

    activity(type, details) {
        console.log(chalk.magenta(`[ACTIVITY] ${type}: ${JSON.stringify(details)}`));
    }
};

export default Logger;
