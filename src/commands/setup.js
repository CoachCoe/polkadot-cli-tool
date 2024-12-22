import { exec } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { executePlatformCommand } from '../utils/helpers.js'; // Import helper for platform-specific commands

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
    // Install Rust based on platform
    const installRustCommand = {
      darwin: 'curl --proto "https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
      linux: 'curl --proto "https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
    };

    const rustCommand = installRustCommand[process.platform];
    if (!rustCommand) {
      throw new Error('Unsupported platform for Rust installation');
    }

    spinner.start('Installing Rust...');
    await executeCommand(
      rustCommand,
      'Rust installed successfully!',
      'Failed to install Rust.',
      spinner
    );

    // Install Substrate dependencies based on platform
    const installDependenciesCommand = {
      darwin: 'brew install cmake llvm openssl',
      linux: 'sudo apt install cmake llvm libssl-dev -y',
    };

    const dependenciesCommand = installDependenciesCommand[process.platform];
    if (!dependenciesCommand) {
      throw new Error('Unsupported platform for dependency installation');
    }

    spinner.start('Installing Substrate dependencies...');
    await executeCommand(
      dependenciesCommand,
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
    spinner.fail('Setup encountered errors. Please review the logs above.');
    console.error(chalk.red('Error during setup:', error.message));
  }
}
