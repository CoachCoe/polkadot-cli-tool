export const NODE_URL = 'ws://127.0.0.1:9944';
export const DEFAULT_PROJECT_PATH = './projects';
export const TEMPLATE_PATHS = {
  runtime: './templates/runtime',
  parachain: './templates/parachain',
  dApp: './templates/dApp',
};
export const DEPENDENCIES = {
  rust: 'https://sh.rustup.rs',
  substrate: [
    'brew install cmake llvm openssl',
  ],
};
