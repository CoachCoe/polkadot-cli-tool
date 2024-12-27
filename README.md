# Polkadot CLI Tool

## Overview
The Polkadot CLI Tool is a command-line interface designed to streamline the development process for Polkadot and Substrate-based projects. It provides developers with essential commands to set up their environment, create new projects, run local nodes, query the chain state, monitor for suspicious activities, and install development templates.

## Features
- **Setup**: Quickly set up your development environment with all necessary dependencies.
- **Create New Projects**: Scaffold new Polkadot projects such as runtimes, parachains, or dApps.
- **Run Local Node**: Spin up a local Substrate-based node for testing and development.
- **Query Chain State**: Query blockchain data or submit transactions.
- **Monitor Chain**: Monitor the blockchain for suspicious activities and potential threats.
- **Install Node Templates**: Clone and build the Polkadot SDK or other templates for development.

## Prerequisites
Ensure the following dependencies are installed on your system:
- **Node.js** (v16 or higher)
- **Git**
- **Rust**

## Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/CoachCoe/polkadot-cli-tool.git
   ```
2. Navigate to the project directory:
   ```bash
   cd polkadot-cli-tool
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Link the CLI globally:
   ```bash
   npm link
   ```

## Commands

### Setup
Set up the development environment:
```bash
polkadot-cli setup
```

### Create a New Project
Scaffold a new project (e.g., parachain):
```bash
polkadot-cli new <type>
```
Replace `<type>` with `runtime`, `parachain`, or `dApp`.

### Run a Local Node
Start a local Substrate node:
```bash
polkadot-cli run
```

### Query the Chain
Query blockchain data:
```bash
polkadot-cli query
```

### Monitor the Chain
Monitor the blockchain for suspicious activities:
```bash
polkadot-cli monitor
```

### Install Node Template
Clone and build the Polkadot SDK:
```bash
polkadot-cli install-node-template
```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Project Structure 
polkadot-cli-tool/
├── bin/
│   └── dot-cli.js
├── src/
│   ├── commands/
│   │   ├── monitor.js        
│   │   ├── new.js  
|   |   ├── run.js
|   |   ├── query.js
|   |   ├── setup.js
|   |   ├── installNodeTemplate.js
│   ├── monitoring/           
│   │   ├── contractMonitor.js
│   │   ├── accountMonitor.js
│   │   ├── crossChainMonitor.js
│   │   ├── governanceMonitor.js
│   │   └── types.js         
│   └── utils/
│       ├── config.js
│       └── helpers.js
