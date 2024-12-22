const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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

// New function to handle platform-specific operations
function executePlatformCommand(command, errorMessage) {
  try {
    const result = execSync(command, { stdio: 'pipe' }).toString().trim();
    return result;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(errorMessage);
    process.exit(1);
  }
}

function checkDependencies() {
  console.log('Checking platform dependencies...');

  // Example: Ensure `curl` is available (used for Linux and macOS setups)
  const curlCheck = executePlatformCommand('which curl', 'curl is not installed. Please install it and try again.');
  console.log(`curl found at: ${curlCheck}`);

  // Additional checks can be added for required tools like `git`, `cargo`, etc.
}

module.exports = {
  resolvePath,
  createDirectory,
  readConfigFile,
  executePlatformCommand,
  checkDependencies,
};
