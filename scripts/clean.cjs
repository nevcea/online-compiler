#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'clean.ps1');
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
		return null;
	}
}

function removeDirIfExists(targetPath) {
	try {
		fs.rmSync(targetPath, { recursive: true, force: true });
	} catch {
		void 0;
	}
}

function emptyDirIfExists(targetPath) {
	if (!fs.existsSync(targetPath)) {
		return;
	}
	const entries = fs.readdirSync(targetPath, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(targetPath, entry.name);
		removeDirIfExists(full);
	}
}

function removeLogsRecursively(startDir) {
	const stack = [startDir];
	while (stack.length) {
		const current = stack.pop();
		let entries;
		try {
			entries = fs.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
			} else if (entry.isFile() && entry.name.endsWith('.log')) {
				removeDirIfExists(full);
			}
		}
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
		console.log('Cleaning up...');
		const composeCmd = resolveDockerComposeCommand();
		if (composeCmd) {
			console.log('Stopping Docker containers...');
			try {
				execSync(`${composeCmd} down -v`, { stdio: 'inherit', cwd: rootDir });
			} catch {
				void 0;
			}
		}
		console.log('Removing node_modules...');
		removeDirIfExists(path.join(rootDir, 'node_modules'));
		removeDirIfExists(path.join(rootDir, 'backend', 'node_modules'));

		console.log('Removing log files...');
		removeLogsRecursively(rootDir);

		console.log('Removing temporary files...');
		emptyDirIfExists(path.join(rootDir, 'backend', 'code'));
		emptyDirIfExists(path.join(rootDir, 'backend', 'output'));

		console.log('[OK] Cleanup complete!');
	}
} catch (error) {
    console.error(`[ERROR] Error running script: ${error.message}`);
    process.exit(1);
}
