const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_CODE_LENGTH = 100000;
const MAX_EXECUTION_TIME = 10000;
const MAX_MEMORY = '256m';
const MAX_CPU_PERCENT = '2.0';

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');

const LANGUAGE_EXTENSIONS = {
    python: '.py',
    javascript: '.js',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    rust: '.rs',
    php: '.php'
};

const LANGUAGE_CONFIGS = {
    python: {
        image: 'python:3.11-slim',
        command: (path) => `python ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    javascript: {
        image: 'node:20-slim',
        command: (path) => `node ${path}`,
        timeout: MAX_EXECUTION_TIME
    },
    java: {
        image: 'eclipse-temurin:17-jdk-alpine',
        command: (path) => `javac ${path} && java -cp /tmp Main`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    cpp: {
        image: 'gcc:latest',
        command: (path) => `g++ -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    c: {
        image: 'gcc:latest',
        command: (path) => `gcc -O2 -s -o /tmp/a.out ${path} && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 2
    },
    rust: {
        image: 'rust:latest',
        command: (path) => `rustc ${path} -o /tmp/a.out && chmod +x /tmp/a.out && /tmp/a.out`,
        timeout: MAX_EXECUTION_TIME * 3
    },
    php: {
        image: 'php:alpine',
        command: (path) => `php ${path}`,
        timeout: MAX_EXECUTION_TIME
    }
};

const DANGEROUS_PATTERNS = [
    /rm\s+-rf/gi,
    /mkfs/gi,
    /dd\s+if=/gi,
    /mkfs\./gi,
    /\/dev\/sd/gi,
    /fdisk/gi,
    /format\s+c:/gi,
    /del\s+\/f/gi,
    /shutdown/gi,
    /reboot/gi,
    /halt/gi,
    /poweroff/gi
];

const DOCKER_PULL_MESSAGES = [
    'unable to find image',
    'pulling from',
    'pulling fs layer',
    'pull complete',
    'download complete',
    'already exists',
    'digest:',
    'status: downloaded',
    'status: image is up to date'
];

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function checkImageExists(image) {
    return new Promise((resolve) => {
        exec(`docker images -q ${image}`, (error, stdout) => {
            resolve(stdout.trim().length > 0);
        });
    });
}

async function preloadDockerImages() {
    console.log('Preloading Docker images...');
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    const pullPromises = uniqueImages.map(async (image) => {
        const exists = await checkImageExists(image);
        if (!exists) {
            console.log(`Pulling ${image}...`);
            return new Promise((resolve) => {
                exec(`docker pull ${image}`, (error) => {
                    if (error) {
                        console.error(`Failed to pull ${image}:`, error.message);
                    } else {
                        console.log(`Successfully pulled ${image}`);
                    }
                    resolve();
                });
            });
        }
        console.log(`${image} already exists`);
    });

    await Promise.all(pullPromises);
    console.log('All images preloaded');
}

function runDockerCommand(image, command, tmpfsSize) {
    const dockerCmd = `docker run --rm --memory=${MAX_MEMORY} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${image} sh -c "${command}"`;
    exec(dockerCmd, () => {});
}

function warmupContainers() {
    const warmups = [
        { image: 'python:3.11-slim', command: 'python -c "print(\'warmup\')"', tmpfsSize: '50m' },
        { image: 'node:20-slim', command: 'node -e "console.log(\'warmup\')"', tmpfsSize: '50m' },
        {
            image: 'gcc:latest',
            command: 'echo "int main(){return 0;}" > /tmp/warmup.c && gcc -o /tmp/warmup /tmp/warmup.c && /tmp/warmup',
            tmpfsSize: '50m'
        },
        { image: 'php:alpine', command: 'php -r "echo \\"warmup\\n\\";"', tmpfsSize: '50m' },
        {
            image: 'eclipse-temurin:17-jdk-alpine',
            command:
                'echo "public class Main{public static void main(String[]a){System.out.println(\\"warmup\\");}}" > /tmp/Main.java && javac /tmp/Main.java && java -cp /tmp Main',
            tmpfsSize: '50m'
        }
    ];

    warmups.forEach(({ image, command, tmpfsSize }) => {
        runDockerCommand(image, command, tmpfsSize);
    });

    setInterval(() => {
        warmups.slice(0, 2).forEach(({ image, command, tmpfsSize }) => {
            runDockerCommand(image, command, tmpfsSize);
        });
    }, 30000);
}

async function ensureDirectories() {
    try {
        await fs.mkdir(codeDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

function sanitizeCode(code) {
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            throw new Error('Potentially dangerous code detected');
        }
    }
}

function filterDockerMessages(text) {
    if (!text) {
        return '';
    }
    return text
        .split('\n')
        .filter((line) => {
            const lower = line.toLowerCase();
            return !DOCKER_PULL_MESSAGES.some((msg) => lower.includes(msg));
        })
        .join('\n');
}

async function cleanupFile(filePath) {
    try {
        if (filePath) {
            await fs.unlink(filePath).catch(() => {});
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

function getContainerCodePath(language, extension) {
    return language === 'java' ? '/tmp/Main.java' : `/tmp/code${extension}`;
}

function buildDockerCommand(language, hostCodePath) {
    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension);
    const command = config.command(containerPath);
    const tmpfsSize = language === 'rust' ? '200m' : '50m';
    const normalizedHostPath = path.resolve(hostCodePath);

    return `docker run --rm --memory=${MAX_MEMORY} --cpus=${MAX_CPU_PERCENT} --network=none --read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize},noatime -v "${normalizedHostPath}:${containerPath}:ro" ${config.image} sh -c "${command}"`;
}

function validateJavaClass(code) {
    const className = code.match(/public\s+class\s+(\w+)/);
    if (className && className[1] !== 'Main') {
        throw new Error('Java class must be named "Main"');
    }
}

async function writeCodeFile(codePath, code, language) {
    if (language === 'java') {
        validateJavaClass(code);
        const modifiedCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
        await fs.writeFile(codePath + '.java', modifiedCode, 'utf8');
        return codePath + '.java';
    }
    const extension = LANGUAGE_EXTENSIONS[language];
    const fullPath = codePath + extension;
    await fs.writeFile(fullPath, code, 'utf8');
    return fullPath;
}

function handleExecutionResult(error, stdout, stderr, executionTime, res) {
    const filteredStderr = filterDockerMessages(stderr);
    const hasStdout = stdout && stdout.trim().length > 0;

    if (error) {
        const errorMsg =
            error.killed || error.signal === 'SIGTERM'
                ? filteredStderr || 'Execution timeout exceeded'
                : filterDockerMessages(stderr || error.message || '');

        return res.json({
            output: stdout || '',
            error: errorMsg,
            executionTime
        });
    }

    res.json({
        output: hasStdout ? stdout : '',
        error: hasStdout ? '' : filteredStderr,
        executionTime
    });
}

app.post('/api/execute', async (req, res) => {
    const { code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
    }

    if (code.length > MAX_CODE_LENGTH) {
        return res.status(400).json({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` });
    }

    if (!LANGUAGE_EXTENSIONS[language]) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const codePath = path.join(codeDir, `${sessionId}_code`);
    let fullCodePath = null;

    try {
        sanitizeCode(code);
        fullCodePath = await writeCodeFile(codePath, code, language);

        const dockerCommand = buildDockerCommand(language, fullCodePath);
        const config = LANGUAGE_CONFIGS[language];
        const startTime = Date.now();

        exec(
            dockerCommand,
            {
                timeout: config.timeout + 2000,
                maxBuffer: 1024 * 1024 * 2
            },
            async (error, stdout, stderr) => {
                const executionTime = Date.now() - startTime;
                await cleanupFile(fullCodePath);
                handleExecutionResult(error, stdout, stderr, executionTime, res);
            }
        );
    } catch (error) {
        await cleanupFile(fullCodePath);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

ensureDirectories().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        preloadDockerImages();
    });
    warmupContainers();
});
