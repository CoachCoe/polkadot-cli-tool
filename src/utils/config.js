const path = require('path');

module.exports = {
  NODE_URL: 'ws://127.0.0.1:9944',
  DEFAULT_PROJECT_PATH: path.join(__dirname, '../../projects'),
  TEMPLATE_PATHS: {
    runtime: path.join(__dirname, '../../templates/runtime-template'),
    parachain: path.join(__dirname, '../../templates/parachain-template'),
    dapp: path.join(__dirname, '../../templates/dapp-template'),
  },
  DEPENDENCIES: {
    rust: 'curl --proto \'https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
    substrate: 'brew install cmake llvm',
  },
};
