import { exec } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

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

  spinner.start('Cloning the Polkadot SDK repository...');

  try {
    // Define relative path for the SDK
    const sdkClonePath = path.resolve(__dirname, '../../polkadot-sdk');

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
    console.error(chalk.red('Installation process encountered errors. Please review the logs above.'));
  }
}
