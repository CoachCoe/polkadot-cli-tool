#!/usr/bin/env node

import { program } from 'commander';
import setup from '../src/commands/setup.js';
import createNew from '../src/commands/new.js';
import run from '../src/commands/run.js';
import query from '../src/commands/query.js';
import installNodeTemplate from '../src/commands/installNodeTemplate.js';
import monitor from '../src/commands/monitor.js';

program
  .name('polkadot-cli')
  .description('A CLI tool for developers building on Polkadot')
  .version('1.0.0');

program
  .command('setup')
  .description('Set up the development environment')
  .action(setup);

program
  .command('new <type>')
  .description('Create a new project (runtime, parachain, dApp)')
  .action(createNew);

program
  .command('run')
  .description('Run a local Polkadot/Substrate node')
  .action(run);

program
  .command('query')
  .description('Query the chain state or submit a transaction')
  .action(query);

program
  .command('install-node-template')
  .description('Install the Substrate Node Template')
  .action(installNodeTemplate);

program
  .command('monitor')
  .description('Monitor the chain for suspicious activities')
  .action(monitor);

program.parse(process.argv);
