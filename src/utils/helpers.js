import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export const logInfo = (message) => console.log(chalk.blue(message));
export const logSuccess = (message) => console.log(chalk.green(message));
export const logError = (message) => console.error(chalk.red(message));

export const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const writeFile = (filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
};

export const readConfigFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return {};
};

export const resolvePath = (relativePath) => path.resolve(process.cwd(), relativePath);
