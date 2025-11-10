#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'dev.ps1');

try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
} catch (error) {
    console.error(`[ERROR] Error running script: ${error.message}`);
    process.exit(1);
}
