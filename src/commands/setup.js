import { exec } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

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

export default async function setup() {
  const spinner = ora();

  console.log(chalk.blue('Setting up your Polkadot development environment...'));

  try {
    // Install Rust
    spinner.start('Installing Rust...');
    await executeCommand(
      'curl --proto "https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
      'Rust installed successfully!',
      'Failed to install Rust.',
      spinner
    );

    // Install Substrate dependencies
    spinner.start('Installing Substrate dependencies...');
    await executeCommand(
      'brew install cmake llvm openssl',
      'Substrate dependencies installed successfully!',
      'Failed to install Substrate dependencies.',
      spinner
    );

    // Verify Rust installation
    spinner.start('Verifying Rust installation...');
    await executeCommand(
      'rustc --version',
      'Rust installation verified!',
      'Failed to verify Rust installation.',
      spinner
    );

    console.log(chalk.green('Setup complete! You are ready to build on Polkadot.'));
  } catch (error) {
    console.error(chalk.red('Setup encountered errors. Please review the logs above.'));
  }
}
