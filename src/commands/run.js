import chalk from 'chalk';
import { exec } from 'child_process';

export default function run() {
  console.log(chalk.blue('Starting a local Polkadot/Substrate node...'));

  const nodeBinary = '/Users/shawncoe/Desktop/Polkadot/CLI/polkadot-sdk/target/release/substrate-node';

  // Command to run the node in development mode
  const command = `${nodeBinary} --dev`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(chalk.red('Failed to start the node:'), stderr || err.message);
      return;
    }
    console.log(chalk.green('Node started successfully. Access it at ws://127.0.0.1:9944'));
  });
}
