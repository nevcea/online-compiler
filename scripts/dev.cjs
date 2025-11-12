#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'dev.ps1');
const args = process.argv.slice(2);

function quoteArg(arg) {
	if (/[\s"]/g.test(arg)) {
		return `"${arg.replace(/"/g, '\\"')}"`;
	}
	return arg;
}

function resolveDockerComposeCommand() {
	try {
		execSync('docker compose version', { stdio: 'ignore' });
		return 'docker compose';
	} catch {
		void 0;
	}
	try {
		execSync('docker-compose --version', { stdio: 'ignore' });
		return 'docker-compose';
	} catch {
		throw new Error('Docker Compose is not installed. Please install Docker Desktop or docker-compose.');
	}
}

try {
	if (isWindows) {
		const forwarded = args.map(quoteArg).join(' ');
		execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${forwarded}`, {
			stdio: 'inherit',
			cwd: rootDir
		});
	} else {
		console.log('Starting development environment...');
		console.log('Installing dependencies...');
		execSync('npm install', { stdio: 'inherit', cwd: rootDir });
		execSync('npm install', { stdio: 'inherit', cwd: path.join(rootDir, 'backend') });

		const composeCmd = resolveDockerComposeCommand();
		console.log('Building Docker images...');
		execSync(`${composeCmd} build`, { stdio: 'inherit', cwd: rootDir });
		console.log('Starting services...');
		execSync(`${composeCmd} up -d`, { stdio: 'inherit', cwd: rootDir });

		console.log('[OK] Development environment is ready!');
		console.log('Frontend: http://localhost:8080');
		console.log('Backend API: http://localhost:3000');
		console.log('');
		console.log('To stop services: docker compose down');
		console.log('To view logs: docker compose logs -f');
	}
} catch (error) {
    console.error(`[ERROR] Error running script: ${error.message}`);
    process.exit(1);
}
