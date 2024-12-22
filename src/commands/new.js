import { createDirectory, writeFile, logSuccess, resolvePath } from '../utils/helpers.js';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export default function createNew(type) {
  const spinner = ora(`Creating a new ${type} project...`).start();

  const basePath = resolvePath(`new-${type}-project`);

  try {
    createDirectory(basePath);

    const templates = {
      runtime: {
        'Cargo.toml': '[package]\nname = "runtime_module"\nversion = "0.1.0"',
        'src/lib.rs': '// Runtime module code goes here',
      },
      parachain: {
        'parachain-config.json': '{ "name": "new-parachain", "id": 100 }',
        'src/lib.rs': '// Parachain logic goes here',
      },
      dApp: {
        'index.html': '<!DOCTYPE html>\n<html>\n<head><title>New dApp</title></head>\n<body></body>\n</html>',
        'app.js': '// JavaScript logic for dApp',
        'style.css': '/* Styles for dApp */',
      },
    };

    if (templates[type]) {
      Object.entries(templates[type]).forEach(([fileName, content]) => {
        const dir = path.dirname(`${basePath}/${fileName}`);
        createDirectory(dir); // Ensure the parent directories exist
        writeFile(`${basePath}/${fileName}`, content);
      });

      spinner.succeed(`${type} project created successfully at ${basePath}`);
      logSuccess(`${type} project created successfully at ${basePath}`);
    } else {
      spinner.fail(`Unknown project type: ${type}`);
      console.error(chalk.red(`Unknown project type: ${type}`));
    }
  } catch (error) {
    spinner.fail(`Failed to create ${type} project. See error logs.`);
    console.error(chalk.red('Error creating project:'), error.message);
  }
}
