const path = require('path');
const fs = require('fs');

function resolvePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function createDirectory(dirPath) {
  const resolvedPath = resolvePath(dirPath);
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }
}

function readConfigFile(filePath) {
  const resolvedPath = resolvePath(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Configuration file not found at ${resolvedPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
}

module.exports = {
  resolvePath,
  createDirectory,
  readConfigFile,
};
