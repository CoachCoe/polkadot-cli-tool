import { exec } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { executePlatformCommand } from '../utils/helpers.js'; // Use helper for platform commands

// Utility function for executing shell commands with error handling
function executeCommand(command, successMessage, errorMessage, spinner) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        spinner.fail(errorMessage);
        console.error(chalk.red(stderr || err.message));
        reject(err);
      } else {
        spinner.succeed(successMessage);
        resolve(stdout);
      }
    });
  });
}

export default async function installNodeTemplate() {
  const spinner = ora();

  console.log(chalk.blue('Installing the Polkadot SDK...'));

  spinner.start('Checking dependencies...');

  try {
    // Check if Git and Cargo are available
    executePlatformCommand('which git', 'Git is not installed. Please install it and try again.');
    executePlatformCommand('which cargo', 'Cargo is not installed. Please install Rust and try again.');

    spinner.succeed('Dependencies verified.');

    // Define relative path for the SDK
    const sdkClonePath = path.resolve(__dirname, '../../polkadot-sdk');

    spinner.start('Cloning the Polkadot SDK repository...');

    // Clone the Polkadot SDK repository
    await executeCommand(
      `git clone https://github.com/paritytech/polkadot-sdk.git ${sdkClonePath}`,
      'Polkadot SDK repository cloned successfully!',
      'Failed to clone Polkadot SDK repository.',
      spinner
    );

    spinner.start('Building the Polkadot SDK...');

    // Build the Polkadot SDK
    await executeCommand(
      `cd ${sdkClonePath} && cargo build --release`,
      'Polkadot SDK built successfully!',
      'Failed to build Polkadot SDK.',
      spinner
    );

    console.log(chalk.green('Installation complete. You can now use the Polkadot SDK.'));
  } catch (error) {
    spinner.fail('Installation process encountered errors. Please review the logs above.');
    console.error(chalk.red('Error during installation:', error.message));
  }
}
