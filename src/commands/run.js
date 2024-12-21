import chalk from 'chalk';
import { exec } from 'child_process';

export default function run() {
  console.log(chalk.blue('Starting a local Polkadot/Substrate node...'));

  exec('substrate-node-template', (err, stdout, stderr) => {
    if (err) {
      console.error(chalk.red('Failed to start the node:'), err);
      return;
    }
    console.log(chalk.green('Node started successfully. Access it at ws://127.0.0.1:9944'));
  });
};
