// File: src/commands/installNodeTemplate.js
import { exec } from 'child_process';
import chalk from 'chalk';

export default function installNodeTemplate() {
  console.log(chalk.blue('Installing the Polkadot SDK...'));

  // Clone the Polkadot SDK repository
  exec('git clone https://github.com/paritytech/polkadot-sdk.git', (err, stdout, stderr) => {
    if (err) {
      console.error(chalk.red('Failed to clone Polkadot SDK repository:'), err);
      return;
    }
    console.log(chalk.green('Polkadot SDK repository cloned successfully!'));

    // Build the Polkadot SDK
    console.log(chalk.blue('Building the Polkadot SDK...'));
    exec('cd polkadot-sdk && cargo build --release', (err, stdout, stderr) => {
      if (err) {
        console.error(chalk.red('Failed to build Polkadot SDK:'), err);
        return;
      }
      console.log(chalk.green('Polkadot SDK built successfully!'));
      console.log(chalk.green('Installation complete. You can now use the Polkadot SDK.'));
    });
  });
}
