import { ApiPromise, WsProvider } from '@polkadot/api';
import { NODE_URL } from '../utils/config.js';
import chalk from 'chalk';
import ora from 'ora';

export default async function query() {
  console.log(chalk.blue('Querying the chain state...'));

  const spinner = ora('Connecting to the chain...').start();

  try {
    const provider = new WsProvider(NODE_URL);
    const api = await ApiPromise.create({ provider });

    spinner.succeed('Connected to the chain successfully.');

    spinner.start('Fetching chain state...');

    const chain = await api.rpc.system.chain();
    const lastHeader = await api.rpc.chain.getHeader();

    spinner.succeed('Chain state fetched successfully.');

    console.log(chalk.green(`Connected to chain: ${chain}`));
    console.log(chalk.green(`Last block number: ${lastHeader.number}`));
  } catch (error) {
    spinner.fail('Error connecting to the chain or fetching state.');
    console.error(chalk.red('Error querying the chain state:'), error.message);
  }
}
