import { exec } from 'child_process';
import chalk from 'chalk';

export default function setup() {
  console.log(chalk.blue('Setting up your Polkadot development environment...'));

  // Install Rust
  exec('curl --proto "https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y', (err, stdout, stderr) => {
    if (err) {
      console.error(chalk.red('Failed to install Rust:'), err);
      return;
    }
    console.log(chalk.green('Rust installed successfully!'));

    // Install Substrate dependencies using Homebrew for macOS
    console.log(chalk.blue('Installing Substrate dependencies...'));
    exec('brew install cmake llvm openssl', (err, stdout, stderr) => {
      if (err) {
        console.error(chalk.red('Failed to install Substrate dependencies:'), err);
        return;
      }
      console.log(chalk.green('Substrate dependencies installed successfully!'));

      // Verify Rust installation
      exec('rustc --version', (err, stdout, stderr) => {
        if (err) {
          console.error(chalk.red('Failed to verify Rust installation:'), err);
          return;
        }
        console.log(chalk.green(`Rust version: ${stdout.trim()}`));
        console.log(chalk.green('Setup complete! You are ready to build on Polkadot.'));
      });
    });
  });
};
