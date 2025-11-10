#!/usr/bin/env node

// 개발 환경 시작 스크립트 (Node.js)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const scriptExt = isWindows ? '.ps1' : '.sh';

function runScript(scriptName) {
    const scriptPath = path.join(__dirname, `${scriptName}${scriptExt}`);
    
    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script not found: ${scriptPath}`);
        process.exit(1);
    }
    
    try {
        if (isWindows) {
            execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
        } else {
            execSync(`chmod +x "${scriptPath}" && "${scriptPath}"`, {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
        }
    } catch (error) {
        console.error(`❌ Error running script: ${error.message}`);
        process.exit(1);
    }
}

const command = process.argv[2] || 'dev';

switch (command) {
    case 'dev':
        runScript('dev');
        break;
    case 'test':
        runScript('test');
        break;
    case 'clean':
        runScript('clean');
        break;
    default:
        console.log('Usage: npm run dev|test|clean');
        process.exit(1);
}

