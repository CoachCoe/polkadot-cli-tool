// File: src/commands/installNodeTemplate.js
import { exec } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export default function installNodeTemplate() {
  const spinner = ora();

  console.log(chalk.blue('Installing the Polkadot SDK...'));

  // Start spinner for cloning
  spinner.start('Cloning the Polkadot SDK repository...');

  // Clone the Polkadot SDK repository
  exec('git clone https://github.com/paritytech/polkadot-sdk.git', (err, stdout, stderr) => {
    if (err) {
      spinner.fail('Failed to clone Polkadot SDK repository.');
      console.error(chalk.red(stderr || err.message));
      return;
    }
    spinner.succeed('Polkadot SDK repository cloned successfully!');

    // Start spinner for building
    spinner.start('Building the Polkadot SDK...');

    // Build the Polkadot SDK
    exec('cd polkadot-sdk && cargo build --release', (err, stdout, stderr) => {
      if (err) {
        spinner.fail('Failed to build Polkadot SDK.');
        console.error(chalk.red(stderr || err.message));
        return;
      }
      spinner.succeed('Polkadot SDK built successfully!');
      console.log(chalk.green('Installation complete. You can now use the Polkadot SDK.'));
    });
  });
}
