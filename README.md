# Polkadot CLI Tool

## Overview
The Polkadot CLI Tool is a command-line interface designed to streamline the development process for Polkadot and Substrate-based projects. It provides developers with essential commands to set up their environment, create new projects, run local nodes, query the chain state, monitor for suspicious activities, and install development templates.

## Features
- **Setup**: Quickly set up your development environment with all necessary dependencies
- **Create New Projects**: Scaffold new Polkadot projects (runtimes, parachains, or dApps)
- **Node Management**: Build and run a local Polkadot node for development
- **Chain Interaction**: Query blockchain data and monitor network activity
- **Security Monitoring**: Advanced monitoring for suspicious activities and potential threats
- **Development Tools**: Comprehensive utilities for Polkadot/Substrate development

## Prerequisites
Ensure the following dependencies are installed on your system:
- **Node.js** (v16 or higher)
- **Git**
- **Rust** with `rustup` (will be installed by setup if not present)
- **Cargo** (Rust's package manager)

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

## Usage Guide

### Initial Setup
Set up your development environment:
```bash
polkadot-cli setup
```
This command will:
- Install Rust and required toolchains if not present
- Configure Rust for Substrate development
- Install necessary system dependencies

### Project Creation
Create a new project:
```bash
polkadot-cli new <type>
```
Replace `<type>` with:
- `runtime`: Create a new runtime module
- `parachain`: Create a new parachain project
- `dApp`: Create a new decentralized application

### Node Management
1. Install and build a Polkadot node:
   ```bash
   polkadot-cli install-node-template
   ```

2. Run the local node:
   ```bash
   polkadot-cli run
   ```
   The node will be accessible at:
   - RPC: http://127.0.0.1:9933
   - WebSocket: ws://127.0.0.1:9933

### Chain Interaction
Query the blockchain state:
```bash
polkadot-cli query
```

### Security Monitoring
Monitor the chain for suspicious activities:
```bash
polkadot-cli monitor
```
This includes monitoring for:
- Suspicious transactions
- Contract vulnerabilities
- Governance attacks
- Cross-chain security issues

## Project Structure
```
polkadot-cli-tool/
├── bin/
│   └── dot-cli.js          # CLI entry point
├── src/
│   ├── commands/           # CLI command implementations
│   │   ├── monitor.js      
│   │   ├── new.js  
│   │   ├── run.js
│   │   ├── query.js
│   │   ├── setup.js
│   │   └── installNodeTemplate.js
│   ├── monitoring/         # Security monitoring modules
│   │   ├── baseMonitor.js
│   │   ├── contractMonitor.js
│   │   ├── accountMonitor.js
│   │   ├── crossChainMonitor.js
│   │   ├── governanceMonitor.js
│   │   └── types.js         
│   └── utils/              # Shared utilities
│       ├── config.js
│       ├── helpers.js
│       ├── logger.js
│       └── connectionManager.js
```

## Troubleshooting
- If `setup` fails, ensure you have proper system permissions
- For node build issues, ensure you have sufficient disk space (10GB+ recommended)
- For runtime errors, check the logs in the chain-data directory

## Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with a detailed description

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
