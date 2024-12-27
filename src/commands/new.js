import { createDirectory, writeFile, resolvePath, startMetrics, endMetrics } from '../utils/helpers.js';
import { PATH_CONFIG } from '../utils/config.js';
import Logger from '../utils/logger.js';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';

const PROJECT_TEMPLATES = {
    runtime: {
        'Cargo.toml': `[package]
name = "runtime_module"
version = "0.1.0"
edition = "2021"

[dependencies]
frame-system = { git = "https://github.com/paritytech/substrate.git", branch = "polkadot-v1.0.0" }
frame-support = { git = "https://github.com/paritytech/substrate.git", branch = "polkadot-v1.0.0" }
`,
        'src/lib.rs': `use frame_support::{decl_module, decl_storage, decl_event, decl_error, dispatch};
use frame_system::ensure_signed;

pub trait Config: frame_system::Config {
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;
}

decl_event! {
    pub enum Event<T> where AccountId = <T as frame_system::Config>::AccountId {
        // Add your events here
    }
}

decl_error! {
    pub enum Error for Module<T: Config> {
        // Add your errors here
    }
}

decl_storage! {
    trait Store for Module<T: Config> as YourModule {
        // Add your storage items here
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
        type Error = Error<T>;
        fn deposit_event() = default;

        // Add your dispatchable functions here
    }
}
`,
    },
    parachain: {
        'parachain-config.json': `{
    "name": "new-parachain",
    "id": 100,
    "chain": "development",
    "relay_chain": "rococo-local"
}`,
        'runtime/Cargo.toml': `[package]
name = "parachain-runtime"
version = "0.1.0"
edition = "2021"

[dependencies]
# Add your dependencies here
`,
        'runtime/src/lib.rs': `// Parachain runtime implementation goes here
`,
    },
    dApp: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
    <title>Polkadot dApp</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Polkadot dApp</h1>
        <div id="wallet-connection">
            <!-- Wallet connection UI -->
        </div>
        <div id="main-content">
            <!-- Main dApp content -->
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@polkadot/api/bundle.min.js"></script>
    <script src="app.js"></script>
</body>
</html>`,
        'app.js': `// Initialize Polkadot API
async function initPolkadotAPI() {
    const wsProvider = new WebSocket('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    return api;
}

// Add your dApp logic here
`,
        'style.css': `/* Add your styles here */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

#app {
    max-width: 800px;
    margin: 0 auto;
}
`,
    },
};

async function validateProjectName(name) {
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
    if (invalidChars.test(name)) {
        throw new Error('Project name contains invalid characters');
    }
    
    const projectPath = resolvePath(name);
    try {
        await fs.access(projectPath);
        throw new Error('A project with this name already exists');
    } catch (error) {
        if (error.code === 'ENOENT') {
            return true;
        }
        throw error;
    }
}

async function createProjectStructure(type, name) {
    const basePath = resolvePath(name);
    const template = PROJECT_TEMPLATES[type];
    
    if (!template) {
        throw new Error(`Unknown project type: ${type}`);
    }

    await createDirectory(basePath);

    for (const [filePath, content] of Object.entries(template)) {
        const fullPath = path.join(basePath, filePath);
        const dir = path.dirname(fullPath);
        
        await createDirectory(dir);
        await writeFile(fullPath, content);
    }

    return basePath;
}

async function initializeGitRepository(projectPath) {
    try {
        await executeCommand('git init', { cwd: projectPath });
        await writeFile(
            path.join(projectPath, '.gitignore'),
            'target/\nnode_modules/\n.DS_Store\n'
        );
    } catch (error) {
        Logger.warn('Failed to initialize git repository:', error);
    }
}

export default async function createNew(type, options) {
    const spinner = ora('Creating new project...').start();
    startMetrics('create-project');

    try {
        const projectName = options.name || `new-${type}-project`;
        
        // Validate project name and type
        await validateProjectName(projectName);
        if (!PROJECT_TEMPLATES[type]) {
            throw new Error(`Invalid project type: ${type}. Available types: ${Object.keys(PROJECT_TEMPLATES).join(', ')}`);
        }

        // Create project structure
        spinner.text = 'Creating project structure...';
        const projectPath = await createProjectStructure(type, projectName);

        // Initialize git repository
        spinner.text = 'Initializing git repository...';
        await initializeGitRepository(projectPath);

        endMetrics('create-project');
        spinner.succeed('Project created successfully');

        // Display next steps
        Logger.info('\nNext steps:');
        Logger.info(`1. cd ${projectName}`);
        switch (type) {
            case 'runtime':
                Logger.info('2. cargo build --release');
                break;
            case 'parachain':
                Logger.info('2. Follow the parachain setup guide in the README');
                break;
            case 'dApp':
                Logger.info('2. npm install');
                Logger.info('3. npm start');
                break;
        }

    } catch (error) {
        spinner.fail('Failed to create project');
        Logger.error('Project creation error:', error);
        process.exit(1);
    }
}
