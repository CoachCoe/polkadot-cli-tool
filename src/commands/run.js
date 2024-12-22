import chalk from 'chalk';
import { exec } from 'child_process';
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

export default async function run() {
  const spinner = ora();

  console.log(chalk.blue('Starting a local Polkadot/Substrate node...'));

  const nodeBinary = path.resolve(__dirname, '../../target/release/substrate-node');

  // Check if nodeBinary is valid
  if (!nodeBinary) {
    console.error(chalk.red('Node binary not found. Please build the node first.'));
    return;
  }

  // Command to run the node in development mode
  const command = `${nodeBinary} --dev`;

  spinner.start('Launching the node...');
  try {
    await executeCommand(
      command,
      'Node started successfully. Access it at ws://127.0.0.1:9944',
      'Failed to start the node.',
      spinner
    );
  } catch (error) {
    console.error(chalk.red('Node startup encountered errors. Please review the logs above.'));
  }
}
