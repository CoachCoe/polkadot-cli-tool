import { ApiPromise, WsProvider } from '@polkadot/api';
import { NODE_URL } from '../utils/config.js';
import chalk from 'chalk';

export default async function query() {
  console.log(chalk.blue('Querying the chain state...'));

  try {
    const provider = new WsProvider(NODE_URL);
    const api = await ApiPromise.create({ provider });

    const chain = await api.rpc.system.chain();
    const lastHeader = await api.rpc.chain.getHeader();

    console.log(chalk.green(`Connected to chain: ${chain}`));
    console.log(chalk.green(`Last block number: ${lastHeader.number}`));
  } catch (error) {
    console.error(chalk.red('Error querying the chain state:'), error);
  }
};
