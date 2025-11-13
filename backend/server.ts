import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as fss from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
    CONFIG,
    TMPFS_SIZES,
    CONTAINER_CODE_PATHS,
    LANGUAGE_EXTENSIONS,
    LANGUAGE_CONFIGS,
    ALLOWED_LANGUAGES,
    ALLOWED_IMAGES,
    DANGEROUS_PATTERNS,
    DOCKER_PULL_MESSAGES,
    DEBUG_PATTERNS,
    KOTLIN_DOWNLOAD_CMD,
    KOTLIN_COMPILER_CHECK,
    LanguageConfig
} from './config';

const app = express();

const codeDir = path.join(__dirname, 'code');
const outputDir = path.join(__dirname, 'output');
const toolCacheDir = path.join(__dirname, 'tool_cache');
const kotlinCacheDir = path.join(toolCacheDir, 'kotlin');
const kotlinBuildsDir = path.join(toolCacheDir, 'kotlin_builds');

// Performance optimizations: Cache compiled regexes and normalized paths
const ESC = String.fromCharCode(27);
const ANSI_REGEX = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, 'g');
const DOCKER_PULL_MESSAGES_SET = new Set(DOCKER_PULL_MESSAGES.map((msg) => msg.toLowerCase()));
const ALLOWED_LANGUAGES_SET = new Set(ALLOWED_LANGUAGES.map((lang) => lang.toLowerCase()));
const ALLOWED_IMAGES_SET = new Set(ALLOWED_IMAGES);
const FILE_PATH_REGEX = /\/[^\s]+/g;
const WINDOWS_PATH_REGEX = /[A-Z]:\\[^\s]+/gi;
const STACK_TRACE_REGEX = /(.*?)(\n\s+at\s+.*)/s;
const FILE_PATH_PLACEHOLDER_REGEX = /^\[file path\]$/;
const DEBUG_PREFIX_REGEX = /^\[DEBUG\]|^DEBUG:/;

// Cache normalized codeDir path
let cachedCodeDirNormalized: string | null = null;
const getCodeDirNormalized = (): string => {
    if (cachedCodeDirNormalized === null) {
        const resolved = path.resolve(codeDir);
        cachedCodeDirNormalized = process.platform === 'win32' ? resolved.replace(/\\/g, '/') : resolved;
    }
    return cachedCodeDirNormalized;
};

// Cache Docker image existence checks (TTL: 5 minutes)
interface ImageCacheEntry {
    exists: boolean;
    timestamp: number;
}
const imageExistenceCache = new Map<string, ImageCacheEntry>();
const IMAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache kotlin compiler path check
let kotlinCompilerPathCache: { exists: boolean; timestamp: number } | null = null;
const KOTLIN_CACHE_TTL = 60 * 1000; // 1 minute

app.disable('x-powered-by');
if (CONFIG.TRUST_PROXY) {
    app.set('trust proxy', 1);
}

async function isDockerAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOCKER_CHECK_TIMEOUT);
    try {
        await promisify(exec)('docker version', { signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

function kotlinCompilerExistsOnHost(): boolean {
    const now = Date.now();
    if (kotlinCompilerPathCache && (now - kotlinCompilerPathCache.timestamp) < KOTLIN_CACHE_TTL) {
        return kotlinCompilerPathCache.exists;
    }
    try {
        const p = path.join(kotlinCacheDir, 'kotlinc', 'lib', 'kotlin-compiler.jar');
        const exists = fss.existsSync(p);
        kotlinCompilerPathCache = { exists, timestamp: now };
        return exists;
    } catch {
        kotlinCompilerPathCache = { exists: false, timestamp: now };
        return false;
    }
}

async function warmupKotlinOnStart(): Promise<void> {
    if (kotlinCompilerExistsOnHost()) {
        return;
    }
    const image = 'eclipse-temurin:17-jdk-alpine';
    const cmd = `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version`;
    try {
        await runDockerCommand(image, cmd, TMPFS_SIZES.kotlin, 20000, true);
    } catch {
        // Ignore warmup errors
    }
}

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const devLocalhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const corsOptions: cors.CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            return callback(null, true);
        }
        const isNullOrigin = origin === 'null';
        const isLocalhost = devLocalhostRegex.test(origin);
        const allowInDev = !isProduction && (isLocalhost || isNullOrigin);

        if (allowedOrigins.length > 0) {
            if (allowedOrigins.includes(origin) || allowInDev) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'), false);
        }

        if (allowInDev) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || '';
        let allowed = false;
        if (!origin) {
            allowed = true;
        } else if (allowedOrigins.length > 0) {
            allowed =
                allowedOrigins.includes(origin) ||
                (!isProduction && origin === 'null') ||
                (!isProduction && devLocalhostRegex.test(origin));
        } else if (!isProduction && (devLocalhostRegex.test(origin) || origin === 'null')) {
            allowed = true;
        }
        if (!allowed) {
            res.status(403).send('Not allowed by CORS');
            return;
        }
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
        );
        res.sendStatus(204);
        return;
    }
    next();
});

app.use(express.json({ limit: '10mb' }));

const executeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many execution requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

function validateLanguage(language: unknown): language is string {
    if (typeof language !== 'string') {
        return false;
    }
    return ALLOWED_LANGUAGES_SET.has(language.toLowerCase());
}

function validateImage(image: unknown): image is string {
    if (typeof image !== 'string') {
        return false;
    }
    return ALLOWED_IMAGES_SET.has(image);
}

function normalizePath(filePath: unknown): string | null {
    if (typeof filePath !== 'string') {
        return null;
    }
    const resolved = path.resolve(filePath);
    if (process.platform === 'win32') {
        return resolved.replace(/\\/g, '/');
    }
    return resolved;
}

function validatePath(filePath: unknown): boolean {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        return false;
    }
    const codeDirNormalized = getCodeDirNormalized();
    return normalized.startsWith(codeDirNormalized);
}

async function checkImageExists(image: string): Promise<boolean> {
    if (!validateImage(image)) {
        return false;
    }
    
    // Check cache first
    const now = Date.now();
    const cached = imageExistenceCache.get(image);
    if (cached && (now - cached.timestamp) < IMAGE_CACHE_TTL) {
        return cached.exists;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const { stdout } = await promisify(exec)(`docker images -q ${image}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const exists = stdout.trim().length > 0;
        imageExistenceCache.set(image, { exists, timestamp: now });
        return exists;
    } catch {
        clearTimeout(timeoutId);
        imageExistenceCache.set(image, { exists: false, timestamp: now });
        return false;
    }
}

interface PullResult {
    success: boolean;
    image: string;
    error?: string;
}

async function pullDockerImage(image: string, retries: number = CONFIG.DOCKER_PULL_RETRIES): Promise<PullResult> {
    if (!validateImage(image)) {
        return { success: false, image, error: 'Invalid image' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOCKER_PULL_TIMEOUT);

            const pullProcess = exec(`docker pull ${image}`, { signal: controller.signal });

            pullProcess.stdout?.on('data', (data: Buffer | string) => {
                process.stdout.write(`[${image}] ${data.toString().trim()}\n`);
            });

            pullProcess.stderr?.on('data', (data: Buffer | string) => {
                process.stderr.write(`[${image}] ${data.toString().trim()}\n`);
            });

            await new Promise<void>((resolve, reject) => {
                pullProcess.on('close', (code: number | null) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                });
                pullProcess.on('error', reject);
            });

            clearTimeout(timeoutId);
            return { success: true, image };
        } catch (error) {
            if (attempt < retries) {
                const delay = CONFIG.DOCKER_PULL_RETRY_DELAY_BASE * (attempt + 1);
                console.log(`[${image}] Pull failed, retrying... (${attempt + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                const err = error as Error;
                return { success: false, image, error: err.message || 'Unknown error' };
            }
        }
    }
    return { success: false, image, error: 'Max retries exceeded' };
}

async function preloadDockerImages(): Promise<void> {
    if (!(await isDockerAvailable())) {
        console.warn(
            '[PRELOAD] Docker is not available. Skipping preload. (Start Docker Desktop to auto-pull on first use)'
        );
        return;
    }
    console.log('[PRELOAD] Starting Docker images preload...');
    const startTime = Date.now();
    const images = Object.values(LANGUAGE_CONFIGS).map((config) => config.image);
    const uniqueImages = [...new Set(images)];

    console.log(`[PRELOAD] Checking ${uniqueImages.length} unique images...`);

    const checkPromises = uniqueImages.map(async (image) => {
        const exists = await checkImageExists(image);
        return { image, exists };
    });

    const checkResults = await Promise.all(checkPromises);
    const imagesToPull = checkResults.filter(({ exists }) => !exists).map(({ image }) => image);
    const existingImages = checkResults.filter(({ exists }) => exists).map(({ image }) => image);

    if (existingImages.length > 0) {
        console.log(
            `[PRELOAD] ${existingImages.length} images already exist: ${existingImages.join(', ')}`
        );
    }

    if (imagesToPull.length === 0) {
        console.log('[PRELOAD] All required images are already available!');
        return;
    }

    console.log(`[PRELOAD] Pulling ${imagesToPull.length} images: ${imagesToPull.join(', ')}`);

    const results: PullResult[] = [];

    for (let i = 0; i < imagesToPull.length; i += CONFIG.PRELOAD_BATCH_SIZE) {
        const batch = imagesToPull.slice(i, i + CONFIG.PRELOAD_BATCH_SIZE);
        const batchPromises = batch.map((image) => pullDockerImage(image));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const batchNumber = Math.floor(i / CONFIG.PRELOAD_BATCH_SIZE) + 1;
        console.log(
            `[PRELOAD] Batch ${batchNumber}: ${successCount} succeeded, ${failCount} failed`
        );
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedImages = results.filter((r) => !r.success).map((r) => r.image);
        console.warn(`[PRELOAD] Failed to pull ${totalFailed} images: ${failedImages.join(', ')}`);
        console.warn('[PRELOAD] These images will be pulled on first use.');
    }

    console.log(
        `[PRELOAD] Completed in ${elapsed}s: ${totalSuccess} succeeded, ${totalFailed} failed`
    );
}

interface DockerCommandResult {
    stdout: string;
    stderr: string;
    elapsed: number;
}

interface DockerCommandError {
    error: {
        message: string;
        code?: string | number;
        signal?: string | null;
        killed?: boolean;
        stderr: string;
        stdout: string;
    };
    elapsed: number;
}

async function runDockerCommand(
    image: string,
    command: string,
    tmpfsSize: string,
    timeout: number = 10000,
    allowNetwork: boolean = false
): Promise<DockerCommandResult> {
    if (!validateImage(image) || typeof command !== 'string' || typeof tmpfsSize !== 'string') {
        throw new Error('Invalid parameters');
    }
    const escapedCommand = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
    const networkFlag = allowNetwork ? '' : '--network=none ';
    const mounts: string[] = [];
    if (allowNetwork) {
        try {
            const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
            mounts.push(`-v ${hostKotlinCache}:/opt/kotlin`);
        } catch {
            // Ignore path conversion errors
        }
    }
    const dockerCmd = `docker run --rm --memory=${tmpfsSize} --cpus=${CONFIG.MAX_CPU_PERCENT} ${networkFlag}--read-only --tmpfs /tmp:rw,exec,nosuid,size=${tmpfsSize} ${mounts.join(' ')} ${image} sh -c "${escapedCommand}"`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startTime = Date.now();

    try {
        const { stdout, stderr } = await promisify(exec)(dockerCmd, {
            signal: controller.signal,
            maxBuffer: 1024 * 1024
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        return { stdout, stderr, elapsed };
    } catch (error) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        const err = error as { message?: string; code?: string | number; signal?: string | null; killed?: boolean; stderr?: string; stdout?: string };
        const errorInfo: DockerCommandError['error'] = {
            message: err.message || 'Unknown error',
            code: err.code,
            signal: err.signal || null,
            killed: err.killed,
            stderr: err.stderr || '',
            stdout: err.stdout || ''
        };
        throw { error: errorInfo, elapsed } as DockerCommandError;
    }
}

interface WarmupConfig {
    language: string;
    image: string;
    command: string;
    tmpfsSize: string;
    timeout: number;
}

function getWarmupConfigs(): WarmupConfig[] {
    return [
        {
            language: 'python',
            image: 'python:3.11-slim',
            command: 'python -V',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'javascript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'c',
            image: 'gcc:14',
            command: 'gcc --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'cpp',
            image: 'gcc:14',
            command: 'g++ --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'java',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: 'java -version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'rust',
            image: 'rust:1.81',
            command: 'rustc --version',
            tmpfsSize: TMPFS_SIZES.rust,
            timeout: 5000
        },
        {
            language: 'php',
            image: 'php:8.3-alpine',
            command: 'php -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'r',
            image: 'r-base:4.4.1',
            command: 'Rscript --version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'ruby',
            image: 'ruby:3.3-alpine',
            command: 'ruby -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'csharp',
            image: 'mcr.microsoft.com/dotnet/sdk:8.0',
            command: 'dotnet --version',
            tmpfsSize: TMPFS_SIZES.csharp,
            timeout: 10000
        },
        {
            language: 'kotlin',
            image: 'eclipse-temurin:17-jdk-alpine',
            command: kotlinCompilerExistsOnHost()
                ? 'java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version'
                : `if ${KOTLIN_COMPILER_CHECK}; then ${KOTLIN_DOWNLOAD_CMD}; fi; java -jar /opt/kotlin/kotlinc/lib/kotlin-compiler.jar -version`,
            tmpfsSize: TMPFS_SIZES.kotlin,
            timeout: 15000
        },
        {
            language: 'go',
            image: 'golang:1.23-alpine',
            command: 'go version',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 5000
        },
        {
            language: 'typescript',
            image: 'node:20-slim',
            command: 'node -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'swift',
            image: 'swift:5.10',
            command: 'swift --version',
            tmpfsSize: TMPFS_SIZES.swift,
            timeout: 15000
        },
        {
            language: 'perl',
            image: 'perl:5.40-slim',
            command: 'perl -v',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        },
        {
            language: 'haskell',
            image: 'haskell:9.6',
            command: 'ghc --version',
            tmpfsSize: TMPFS_SIZES.haskell,
            timeout: 15000
        },
        {
            language: 'bash',
            image: 'alpine:3.19',
            command: 'echo "Alpine Linux ready for bash"',
            tmpfsSize: TMPFS_SIZES.default,
            timeout: 10000
        }
    ];
}

interface WarmupResult {
    success: boolean;
    language: string;
    error?: string;
    elapsed?: number;
    fullError?: unknown;
}

async function warmupContainer(config: WarmupConfig): Promise<WarmupResult> {
    try {
        let retries = 3;
        let imageExists = false;
        while (retries > 0 && !imageExists) {
            imageExists = await checkImageExists(config.image);
            if (!imageExists) {
                retries--;
                if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        }

        if (!imageExists) {
            return {
                success: false,
                language: config.language,
                error: `Image ${config.image} not found after waiting`
            };
        }

        const allowNetwork = config.language === 'kotlin';
        const result = await runDockerCommand(
            config.image,
            config.command,
            config.tmpfsSize,
            config.timeout,
            allowNetwork
        );

        if (
            config.language === 'kotlin' &&
            result.stderr &&
            result.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: result.elapsed };
        }

        return { success: true, language: config.language, elapsed: result.elapsed };
    } catch (error) {
        const dockerError = error as DockerCommandError;
        const errorInfo = dockerError?.error || {};
        let errorMessage = errorInfo.message || (error as Error)?.message || 'Unknown error';

        if (
            (error as Error).name === 'AbortError' ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('The operation was aborted')
        ) {
            errorMessage = `Timeout after ${config.timeout}ms`;
        }

        if (
            config.language === 'kotlin' &&
            errorInfo.stderr &&
            errorInfo.stderr.includes('kotlinc-jvm')
        ) {
            return { success: true, language: config.language, elapsed: dockerError?.elapsed || 0 };
        }

        if (errorInfo.stderr && errorInfo.stderr.trim()) {
            const stderrLines = errorInfo.stderr.trim().split('\n');
            const lastLine = stderrLines[stderrLines.length - 1];
            if (lastLine && lastLine.length < 150) {
                errorMessage = lastLine;
            } else if (stderrLines.length > 0) {
                errorMessage = stderrLines[0].substring(0, 150);
            }
        }

        return {
            success: false,
            language: config.language,
            error: errorMessage,
            fullError: errorInfo
        };
    }
}

async function warmupAllContainers(): Promise<void> {
    if (!(await isDockerAvailable())) {
        console.warn('[WARMUP] Docker is not available. Skipping container warmup.');
        return;
    }
    const configs = getWarmupConfigs();
    console.log(`[WARMUP] Warming up ${configs.length} containers...`);
    const startTime = Date.now();

    const results: WarmupResult[] = [];

    for (let i = 0; i < configs.length; i += CONFIG.WARMUP_BATCH_SIZE) {
        const batch = configs.slice(i, i + CONFIG.WARMUP_BATCH_SIZE);
        const batchPromises = batch.map((config) => warmupContainer(config));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        const successCount = batchResults.filter((r) => r.success).length;
        const failCount = batchResults.filter((r) => !r.success).length;
        const succeededLanguages = batchResults.filter((r) => r.success).map((r) => r.language);
        const failedLanguages = batchResults.filter((r) => !r.success).map((r) => r.language);
        const batchNumber = Math.floor(i / CONFIG.WARMUP_BATCH_SIZE) + 1;

        if (successCount > 0 && failCount > 0) {
            console.log(`[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded`);
            console.log(`[WARMUP]   Succeeded: ${succeededLanguages.join(', ')}`);
            console.log(`[WARMUP]   Failed: ${failedLanguages.join(', ')}`);
        } else if (successCount > 0) {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${succeededLanguages.join(', ')})`
            );
        } else {
            console.log(
                `[WARMUP] Batch ${batchNumber}: ${successCount}/${batch.length} succeeded (${failedLanguages.join(', ')})`
            );
        }
    }

    const totalSuccess = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (totalFailed > 0) {
        const failedResults = results.filter((r) => !r.success);
        const failedLanguages = failedResults.map((r) => r.language);
        console.warn(`[WARMUP] Failed for ${totalFailed} languages: ${failedLanguages.join(', ')}`);

        failedResults.forEach((result) => {
            const errorMsg = result.error || 'Unknown error';
            const displayMsg =
                errorMsg.length > CONFIG.ERROR_MESSAGE_MAX_LENGTH
                    ? errorMsg.substring(0, CONFIG.ERROR_MESSAGE_MAX_LENGTH) + '...'
                    : errorMsg;
            console.warn(`[WARMUP]   ${result.language}: ${displayMsg}`);
        });
    }

    if (totalSuccess > 0) {
        const avgElapsed =
            results.filter((r) => r.success).reduce((sum, r) => sum + (r.elapsed || 0), 0) /
            totalSuccess;
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded (avg: ${avgElapsed.toFixed(0)}ms)`
        );
    } else {
        console.log(
            `[WARMUP] Completed in ${elapsed}s: ${totalSuccess}/${configs.length} succeeded`
        );
    }
}

function warmupContainers(): void {
    warmupAllContainers().catch((error) => {
        console.error('Initial warmup error:', error);
    });

    const frequentLanguages = ['python', 'javascript', 'java', 'cpp'];
    const frequentConfigs = getWarmupConfigs().filter((config) =>
        frequentLanguages.includes(config.language)
    );

    setInterval(async () => {
        if (!(await isDockerAvailable())) {
            return;
        }
        const randomConfigs = frequentConfigs.sort(() => Math.random() - 0.5).slice(0, 2);
        randomConfigs.forEach((config) => {
            warmupContainer(config).catch((error) => {
                console.debug(`Warmup failed for ${config.language}:`, error);
            });
        });
    }, 60000);
}

async function ensureDirectories(): Promise<void> {
    try {
        await fs.mkdir(codeDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(toolCacheDir, { recursive: true });
        await fs.mkdir(kotlinCacheDir, { recursive: true });
        await fs.mkdir(kotlinBuildsDir, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

function sanitizeCode(code: unknown): void {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
    }

    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            throw new Error('Potentially dangerous code detected');
        }
    }

    if (code.length === 0) {
        throw new Error('Code cannot be empty');
    }
}

function filterDockerMessages(text: unknown): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const withoutAnsi = text.replace(ANSI_REGEX, '');

    const lines = withoutAnsi.split('\n');
    const filtered: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();
        let shouldInclude = true;
        
        // Fast check using Set
        for (const msg of DOCKER_PULL_MESSAGES_SET) {
            if (lower.includes(msg)) {
                shouldInclude = false;
                break;
            }
        }
        
        if (shouldInclude) {
            const trimmed = line.trim();
            for (const pattern of DEBUG_PATTERNS) {
                if (pattern.test(trimmed)) {
                    shouldInclude = false;
                    break;
                }
            }
        }
        
        if (shouldInclude) {
            filtered.push(line);
        }
    }
    
    return filtered.join('\n');
}

function sanitizeError(error: unknown): string {
    if (!error) {
        return 'An error occurred';
    }
    const errorStr = typeof error === 'string' ? error : (error as Error).message || String(error);
    const filtered = filterDockerMessages(errorStr);
    if (filtered.length > 500) {
        return filtered.substring(0, 500) + '...';
    }
    return filtered;
}

function sanitizeErrorForUser(errorStr: unknown): string {
    if (!errorStr || typeof errorStr !== 'string') {
        return 'An error occurred during execution.';
    }

    // Log original error for debugging
    console.error('[DEBUG] Original error message:', errorStr.substring(0, 500));

    // Work with original error first before filtering
    const originalLower = errorStr.toLowerCase();
    
    let sanitized = filterDockerMessages(errorStr);

    // Check for Docker-specific errors and provide user-friendly messages
    const lowerSanitized = sanitized.toLowerCase();
    
    // Check for Docker daemon connection errors first
    if (lowerSanitized.includes("cannot connect to the docker daemon") || 
        lowerSanitized.includes("is the docker daemon running") ||
        (lowerSanitized.includes("docker daemon") && lowerSanitized.includes("not running"))) {
        return 'Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.';
    }
    
    // Check for Docker not found errors
    if (lowerSanitized.includes("'docker' is not recognized") || 
        lowerSanitized.includes("docker: command not found") ||
        lowerSanitized.includes("spawn docker enoent")) {
        return 'Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.';
    }
    
    // Check for image errors
    if (lowerSanitized.includes("no such image") || 
        lowerSanitized.includes("pull access denied") ||
        lowerSanitized.includes("repository does not exist")) {
        return 'Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.';
    }
    
    // Check for permission errors
    if (lowerSanitized.includes("permission denied") && lowerSanitized.includes("docker")) {
        return 'Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.';
    }
    
    // Check for invalid reference format (usually means bad image name or command syntax)
    if (lowerSanitized.includes("docker: invalid reference format") ||
        lowerSanitized.includes("invalid reference format")) {
        return 'Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    // Check for "Run 'docker run --help'" - this usually means command syntax error
    if (lowerSanitized.includes("run 'docker run --help'") || 
        (lowerSanitized.includes("run 'docker") && lowerSanitized.includes("--help")) ||
        originalLower.includes("run 'docker run --help'") ||
        (originalLower.includes("run 'docker") && originalLower.includes("--help"))) {
        
        // Work with original error string first to extract actual error
        const originalLines = errorStr.split('\n');
        
        // Try to extract the actual error before the help message from original
        for (let i = 0; i < originalLines.length; i++) {
            const line = originalLines[i].trim();
            const lineLower = line.toLowerCase();
            
            // Stop when we hit the help message
            if (lineLower.includes("run 'docker") && lineLower.includes("--help")) {
                break;
            }
            
            // Skip empty lines and help-related text
            if (!line || 
                lineLower.includes("for more information") ||
                lineLower.includes("see 'docker") ||
                line.length < 5) {
                continue;
            }
            
            // Look for error patterns in original message
            const errorPatterns = [
                /docker:\s*(.+?)(?:\n|$)/i,
                /error[:\s]+(.+?)(?:\n|$)/i,
                /invalid[:\s]+(.+?)(?:\n|$)/i,
                /unknown[:\s]+(.+?)(?:\n|$)/i,
                /failed[:\s]+(.+?)(?:\n|$)/i,
                /cannot[:\s]+(.+?)(?:\n|$)/i
            ];
            
            for (const pattern of errorPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    const errorMsg = match[1].trim();
                    if (errorMsg.length > 0 && errorMsg.length < 200) {
                        // Clean up the error message
                        const cleaned = errorMsg.replace(/^docker:\s*/i, '').trim();
                        if (cleaned.length > 0) {
                            return cleaned;
                        }
                    }
                }
            }
            
            // If line looks like an error message, return it
            if (lineLower.includes('error') || 
                lineLower.includes('invalid') ||
                lineLower.includes('unknown') ||
                lineLower.includes('failed') ||
                lineLower.includes('cannot') ||
                lineLower.includes('docker:')) {
                // Clean up docker: prefix
                const cleaned = line.replace(/^docker:\s*/i, '').trim();
                if (cleaned.length > 5 && cleaned.length < 200) {
                    return cleaned;
                }
            }
        }
        
        // Fallback: try with sanitized version
        const beforeHelp = errorStr.split(/run ['"]docker/i)[0].trim();
        if (beforeHelp && beforeHelp.length > 0) {
            const beforeLines = beforeHelp.split('\n').filter(l => l.trim().length > 0);
            if (beforeLines.length > 0) {
                // Get the last meaningful line
                for (let i = beforeLines.length - 1; i >= 0; i--) {
                    const lastLine = beforeLines[i].trim();
                    if (lastLine.length > 5 && lastLine.length < 200) {
                        const cleaned = lastLine.replace(/^docker:\s*/i, '').trim();
                        if (cleaned.length > 0) {
                            return cleaned;
                        }
                    }
                }
            }
        }
        
        // Last resort: return first non-empty line from original
        for (const line of originalLines) {
            const trimmed = line.trim();
            if (trimmed && 
                !trimmed.toLowerCase().includes("run 'docker") &&
                !trimmed.toLowerCase().includes("for more information") &&
                trimmed.length > 5 && 
                trimmed.length < 200) {
                const cleaned = trimmed.replace(/^docker:\s*/i, '').trim();
                if (cleaned.length > 0) {
                    return cleaned;
                }
            }
        }
        
        return 'Docker 명령어 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    // Use compiled regexes
    sanitized = sanitized.replace(/docker:.*/gi, '');
    sanitized = sanitized.replace(/Error response from daemon.*/gi, '');
    sanitized = sanitized.replace(/Run 'docker run --help'.*/gi, '');
    sanitized = sanitized.replace(FILE_PATH_REGEX, '[file path]');
    sanitized = sanitized.replace(WINDOWS_PATH_REGEX, '[file path]');

    const stackTraceMatch = sanitized.match(STACK_TRACE_REGEX);
    if (stackTraceMatch) {
        sanitized = stackTraceMatch[1];
    }

    const lines = sanitized.split('\n');
    const filtered: string[] = [];
    
    for (let i = 0; i < lines.length && filtered.length < 10; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
            continue;
        }
        if (DEBUG_PREFIX_REGEX.test(trimmed)) {
            continue;
        }
        if (FILE_PATH_PLACEHOLDER_REGEX.test(trimmed)) {
            continue;
        }
        // Filter out Docker help messages
        if (trimmed.includes("Run 'docker") || trimmed.includes("for more information")) {
            continue;
        }
        filtered.push(lines[i]);
    }

    sanitized = filtered.join('\n').trim();

    if (sanitized.length > 300) {
        sanitized = sanitized.substring(0, 300) + '...';
    }

    if (!sanitized || sanitized.length === 0) {
        return 'An error occurred during execution.';
    }

    return sanitized;
}

async function cleanupFile(filePath: string | null): Promise<void> {
    if (!filePath || !validatePath(filePath)) {
        return;
    }
    try {
        await fs.unlink(filePath).catch(() => {});
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

async function writeInputFile(inputPath: string, inputText: string): Promise<string> {
    if (!validatePath(inputPath)) {
        throw new Error('Invalid input path');
    }
    const resolvedInputPath = path.resolve(inputPath);
    await fs.writeFile(resolvedInputPath, inputText, 'utf8');
    return resolvedInputPath;
}

function getContainerCodePath(language: string, extension: string): string {
    return CONTAINER_CODE_PATHS[language] || `/tmp/code${extension}`;
}

function convertToDockerPath(filePath: string): string {
    const normalized = normalizePath(filePath);
    if (!normalized) {
        throw new Error('Invalid file path');
    }
    if (process.platform === 'win32' && normalized.match(/^[A-Z]:/)) {
        const drive = normalized[0].toLowerCase();
        const rest = normalized.substring(2).replace(/\\/g, '/');
        return `/${drive}${rest}`;
    }
    return normalized;
}

interface BuildOptions {
    hasInput?: boolean;
    inputPath?: string;
    outputDirHost?: string;
}

function buildDockerArgs(language: string, hostCodePath: string, opts: BuildOptions = {}): string[] {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    if (!validatePath(hostCodePath)) {
        throw new Error('Invalid code path');
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config || !validateImage(config.image)) {
        throw new Error('Invalid language configuration');
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension);
    const containerBuildDir = language === 'kotlin' ? '/tmp/kbuild' : undefined;
    const containerInputPath = opts.inputPath
        ? `/input/${path.basename(opts.inputPath)}`
        : undefined;
    const command =
        language === 'kotlin'
            ? config.command(containerPath, containerInputPath, containerBuildDir)
            : config.command(containerPath, containerInputPath);
    const tmpfsSize = TMPFS_SIZES[language] || TMPFS_SIZES.default;
    const dockerHostPath = convertToDockerPath(hostCodePath);

    if (dockerHostPath.includes(' ') || containerPath.includes(' ')) {
        throw new Error('Invalid path format: paths with spaces are not supported');
    }

    if (containerPath.includes(':')) {
        throw new Error('Invalid container path format');
    }

    // Pre-allocate array with estimated size to reduce reallocations
    const args: string[] = [];
    args.length = 0; // Reset but keep capacity
    
    // Build args more efficiently
    args.push('run', '--rm');
    args.push(`--memory=${CONFIG.MAX_MEMORY}`);
    args.push(`--cpus=${language === 'kotlin' ? CONFIG.MAX_CPU_PERCENT_KOTLIN : CONFIG.MAX_CPU_PERCENT}`);
    
    if (language !== 'typescript' && language !== 'bash') {
        args.push('--network=none');
    }
    
    args.push('--read-only', '--tmpfs', `/tmp:rw,exec,nosuid,size=${tmpfsSize},noatime`);
    args.push('--cap-drop=ALL', '--security-opt', 'no-new-privileges');
    args.push('--pids-limit=128', '--ulimit', 'nofile=1024:1024');
    args.push('--user', '1000:1000');

    const hostCodeDir = path.dirname(hostCodePath);
    const hostFileName = path.basename(hostCodePath);
    const dockerHostDir = convertToDockerPath(hostCodeDir);
    const mountedFilePath = `/code/${hostFileName}`;

    // Validate dockerHostDir
    if (!dockerHostDir || dockerHostDir.trim() === '' || !dockerHostDir.startsWith('/')) {
        console.error(`[ERROR] Invalid dockerHostDir: "${dockerHostDir}" from hostCodeDir: "${hostCodeDir}"`);
        throw new Error(`Invalid Docker host directory path: ${dockerHostDir}`);
    }

    if (CONFIG.DEBUG_MODE) {
        console.log(
            `[DEBUG] File paths: hostCodePath=${hostCodePath}, hostCodeDir=${hostCodeDir}, hostFileName=${hostFileName}, dockerHostDir=${dockerHostDir}, mountedFilePath=${mountedFilePath}`
        );
    }

    // Collect all volume mounts first
    const volumeMounts: string[] = [];
    
    // Add code directory volume
    volumeMounts.push('-v', `${dockerHostDir}:/code:ro`);

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        const dockerInputDir = convertToDockerPath(hostInputDir);
        const inputBasename = path.basename(opts.inputPath);
        
        // Validate dockerInputDir
        if (!dockerInputDir || dockerInputDir.trim() === '' || !dockerInputDir.startsWith('/')) {
            console.error(`[ERROR] Invalid dockerInputDir: "${dockerInputDir}" from hostInputDir: "${hostInputDir}"`);
            throw new Error(`Invalid Docker input directory path: ${dockerInputDir}`);
        }
        
        if (CONFIG.DEBUG_MODE) {
            console.log(
                `[DEBUG] Input file paths: hostInputPath=${opts.inputPath}, dockerInputDir=${dockerInputDir}`
            );
        }
        volumeMounts.push('-v', `${dockerInputDir}:/input:ro`);
    }
    
    if (language === 'kotlin') {
        const hostKotlinCache = convertToDockerPath(kotlinCacheDir);
        if (!hostKotlinCache || hostKotlinCache.trim() === '' || !hostKotlinCache.startsWith('/')) {
            console.error(`[ERROR] Invalid hostKotlinCache: "${hostKotlinCache}" from kotlinCacheDir: "${kotlinCacheDir}"`);
            throw new Error(`Invalid Docker Kotlin cache directory path: ${hostKotlinCache}`);
        }
        volumeMounts.push('-v', `${hostKotlinCache}:/opt/kotlin`);
    }
    if (opts.outputDirHost) {
        const hostOutputDir = convertToDockerPath(opts.outputDirHost);
        if (!hostOutputDir || hostOutputDir.trim() === '' || !hostOutputDir.startsWith('/')) {
            console.error(`[ERROR] Invalid hostOutputDir: "${hostOutputDir}" from outputDirHost: "${opts.outputDirHost}"`);
            throw new Error(`Invalid Docker output directory path: ${hostOutputDir}`);
        }
        volumeMounts.push('-v', `${hostOutputDir}:/output:rw`);
    }
    
    // Add all volume mounts before the image name
    args.push(...volumeMounts);

    if (opts.inputPath) {
        const inputBasename = path.basename(opts.inputPath);
        
        // Build command parts more efficiently
        const inputFileCheck = !CONFIG.DEBUG_MODE
            ? `test -f "/input/${inputBasename}" || (echo "ERROR: Input file not found" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking input file: /input/${inputBasename}" >&2 && if [ ! -f "/input/${inputBasename}" ]; then echo "ERROR: Input file not found: /input/${inputBasename}" >&2; ls -la /input >&2; exit 1; fi && `;
        
        const fileCopy = !CONFIG.DEBUG_MODE
            ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;
        
        args.push(config.image, 'sh', '-c', `${inputFileCheck}${fileCopy}${command}`);
    } else {
        const fileCopy = !CONFIG.DEBUG_MODE
            ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;
        
        args.push(config.image, 'sh', '-c', `${fileCopy}${command}`);
    }

    return args;
}

function validateJavaClass(code: string): void {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
    }
    const classMatches = code.match(/public\s+class\s+(\w+)/g);
    if (!classMatches || classMatches.length === 0) {
        throw new Error('Java code must contain a public class');
    }
    if (classMatches.length > 1) {
        throw new Error('Java code must contain only one public class');
    }
    const className = code.match(/public\s+class\s+(\w+)/);
    if (className && className[1] !== 'Main') {
        throw new Error('Java class must be named "Main"');
    }
}

async function writeCodeFile(codePath: string, code: string, language: string): Promise<string> {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    if (!validatePath(codePath)) {
        throw new Error('Invalid code path');
    }

    const resolvedCodePath = path.resolve(codePath);
    let finalCode = code;
    let fileExtension: string;

    switch (language) {
        case 'java':
            validateJavaClass(code);
            finalCode = code.replace(/public\s+class\s+\w+/, 'public class Main');
            fileExtension = '.java';
            break;

        case 'csharp':
            fileExtension = '.cs';
            break;

        case 'r': {
            const plotPattern =
                /plot\s*\(|ggplot\s*\(|barplot\s*\(|hist\s*\(|boxplot\s*\(|pie\s*\(/i;
            const hasPlot = plotPattern.test(code);
            if (hasPlot) {
                finalCode = `png('/output/plot.png', width=800, height=600, res=100)\n${code}\ndev.off()\n`;
            }
            fileExtension = LANGUAGE_EXTENSIONS[language];
            break;
        }

        default:
            fileExtension = LANGUAGE_EXTENSIONS[language];
            break;
    }

    const fullPath = resolvedCodePath + fileExtension;
    await fs.writeFile(fullPath, finalCode, 'utf8');
    return fullPath;
}

interface ImageFile {
    name: string;
    data: string;
}

async function findImageFiles(outputDir: string): Promise<ImageFile[]> {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'];
    const images: ImageFile[] = [];

    try {
        const files = await fs.readdir(outputDir);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
                const filePath = path.join(outputDir, file);
                try {
                    const imageBuffer = await fs.readFile(filePath);
                    const base64 = imageBuffer.toString('base64');
                    const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`;
                    images.push({
                        name: file,
                        data: `data:${mimeType};base64,${base64}`
                    });
                    await fs.unlink(filePath).catch(() => {});
                } catch {
                    // Ignore file read errors
                }
            }
        }
    } catch {
        // Ignore directory read errors
    }

    return images;
}

class OutputCollector {
    private maxBytes: number;
    private stdout: string;
    private stderr: string;
    private stdoutBytes: number;
    private stderrBytes: number;
    private stdoutTruncated: boolean;
    private stderrTruncated: boolean;

    constructor(maxBytes: number) {
        this.maxBytes = maxBytes;
        this.stdout = '';
        this.stderr = '';
        this.stdoutBytes = 0;
        this.stderrBytes = 0;
        this.stdoutTruncated = false;
        this.stderrTruncated = false;
    }

    addStdout(data: Buffer | string): void {
        if (this.stdoutTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stdoutBytes;
        if (remaining <= 0) {
            this.stdoutTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stdout += s;
            this.stdoutBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stdout += slice;
            this.stdoutBytes += remaining;
            this.stdoutTruncated = true;
        }
    }

    addStderr(data: Buffer | string): void {
        if (this.stderrTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stderrBytes;
        if (remaining <= 0) {
            this.stderrTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stderr += s;
            this.stderrBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stderr += slice;
            this.stderrBytes += remaining;
            this.stderrTruncated = true;
        }
    }

    getFinalOutput(): { stdout: string; stderr: string } {
        let stdout = this.stdout;
        let stderr = this.stderr;
        if (this.stdoutTruncated) {
            stdout += '\n[truncated]';
        }
        if (this.stderrTruncated) {
            stderr += '\n[truncated]';
        }
        return { stdout, stderr };
    }
}

async function executeDockerProcess(
    language: string,
    fullCodePath: string,
    buildOptions: BuildOptions,
    config: LanguageConfig,
    startTime: number,
    res: Response,
    sessionOutputDir: string,
    fullInputPath: string | null,
    getResponseSent: () => boolean,
    setResponseSent: (value: boolean) => void
): Promise<void> {
    const dockerArgs = buildDockerArgs(language, fullCodePath, buildOptions);
    
    // Debug: log Docker command
    if (CONFIG.DEBUG_MODE) {
        console.log('[DEBUG] Docker command:', 'docker', dockerArgs.join(' '));
    }
    
    const controller = new AbortController();
    const abortTimeoutId = setTimeout(
        () => controller.abort(),
        config.timeout + CONFIG.TIMEOUT_BUFFER_MS
    );
    const dockerProcess = spawn('docker', dockerArgs, {
        signal: controller.signal
    });

    dockerProcess.stdout.setEncoding('utf8');
    dockerProcess.stderr.setEncoding('utf8');

    const outputCollector = new OutputCollector(CONFIG.MAX_OUTPUT_BYTES);

    dockerProcess.stdout.on('data', (data: Buffer | string) => {
        outputCollector.addStdout(data);
    });

    dockerProcess.stderr.on('data', (data: Buffer | string) => {
        outputCollector.addStderr(data);
    });

    let responseHandled = false;
    const markResponseHandled = (): boolean => {
        if (responseHandled) {
            return false;
        }
        responseHandled = true;
        return true;
    };

    const handleClose = async (code: number | null): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;
            await cleanupResources(fullCodePath, fullInputPath);

            const { stdout, stderr } = outputCollector.getFinalOutput();
            
            // Check for Docker command errors in stderr
            let error: ExecutionError | null = null;
            if (code !== 0) {
                error = { code, killed: false, signal: null };
                
                // Always pass stderr through for Docker errors - let sanitizeErrorForUser extract the actual error
                const stderrLower = (stderr || '').toLowerCase();
                if (stderrLower.includes("run 'docker") || 
                    stderrLower.includes("docker:") ||
                    stderrLower.includes("cannot connect to the docker daemon") ||
                    stderrLower.includes("docker daemon") ||
                    stderrLower.includes("'docker' is not recognized") ||
                    stderrLower.includes("docker: command not found") ||
                    stderrLower.includes("spawn docker enoent") ||
                    stderrLower.includes("error response from daemon") ||
                    stderrLower.includes("invalid reference format") ||
                    stderrLower.includes("no such image") ||
                    stderrLower.includes("permission denied")) {
                    // Pass the full stderr so sanitizeErrorForUser can extract the actual error message
                    error.message = stderr || 'Docker error';
                } else if (stderr && stderr.trim()) {
                    // For non-zero exit codes, include stderr in error message
                    error.message = stderr;
                }
            }
            
            await handleExecutionResult(
                error,
                stdout,
                stderr,
                executionTime,
                res,
                sessionOutputDir
            );
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleClose:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution result.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    const handleError = async (error: Error): Promise<void> => {
        if (!markResponseHandled()) {
            return;
        }

        try {
            const executionTime = Date.now() - startTime;
            await cleanupResources(fullCodePath, fullInputPath);

            const { stdout, stderr } = outputCollector.getFinalOutput();
            
            // Check if it's a Docker-related error
            const errorMessage = error.message || '';
            const combinedStderr = stderr || errorMessage;
            
            // Create error object with stderr content for Docker errors
            let executionError: ExecutionError | Error = error;
            
            // Detect Docker daemon errors - pass stderr through for better error extraction
            if (errorMessage.includes('ENOENT') || 
                errorMessage.includes('docker') || 
                combinedStderr.toLowerCase().includes('docker') ||
                combinedStderr.toLowerCase().includes("run 'docker")) {
                executionError = { 
                    message: combinedStderr || errorMessage,
                    code: null,
                    killed: false,
                    signal: null
                } as ExecutionError;
            } else if (combinedStderr) {
                // For other errors, include stderr in the message
                executionError = { 
                    message: combinedStderr,
                    code: null,
                    killed: false,
                    signal: null
                } as ExecutionError;
            }
            
            await handleExecutionResult(
                executionError,
                stdout,
                combinedStderr,
                executionTime,
                res,
                sessionOutputDir
            );
            setResponseSent(true);
        } catch (err) {
            console.error('[ERROR] Error in handleError:', err);
            if (!getResponseSent()) {
                try {
                    res.status(500).json({
                        error: 'An error occurred while processing execution error.'
                    });
                    setResponseSent(true);
                } catch (sendErr) {
                    console.error('[ERROR] Failed to send error response:', sendErr);
                }
            }
        }
    };

    dockerProcess.on('close', handleClose);
    dockerProcess.on('error', handleError);

    const processTimeoutId = setTimeout(async () => {
        if (responseHandled || getResponseSent()) {
            return;
        }
        if (!dockerProcess || dockerProcess.killed) {
            return;
        }

        try {
            controller.abort();
            dockerProcess.kill('SIGTERM');

            const killTimeoutId = setTimeout(() => {
                if (dockerProcess && !dockerProcess.killed) {
                    try {
                        dockerProcess.kill('SIGKILL');
                    } catch (killError) {
                        console.error('[ERROR] Failed to kill Docker process:', killError);
                    }
                }
            }, CONFIG.SIGKILL_DELAY_MS);

            dockerProcess.once('close', () => {
                clearTimeout(killTimeoutId);
            });
            dockerProcess.once('error', () => {
                clearTimeout(killTimeoutId);
            });
        } catch (killError) {
            console.error('[ERROR] Failed to send SIGTERM to Docker process:', killError);
        }
    }, config.timeout + CONFIG.TIMEOUT_BUFFER_MS);

    const cleanupTimeout = (): void => {
        clearTimeout(abortTimeoutId);
        clearTimeout(processTimeoutId);
    };
    dockerProcess.once('close', cleanupTimeout);
    dockerProcess.once('error', cleanupTimeout);
}

async function cleanupResources(fullCodePath: string | null, fullInputPath: string | null): Promise<void> {
    const cleanupPromises = [cleanupFile(fullCodePath)];
    if (fullInputPath) {
        cleanupPromises.push(cleanupFile(fullInputPath));
    }
    await Promise.allSettled(cleanupPromises);
}

interface ExecutionError {
    code?: number | null;
    killed?: boolean;
    signal?: string | null;
    message?: string;
}

async function handleExecutionResult(
    error: ExecutionError | Error | null,
    stdout: string,
    stderr: string,
    executionTime: number,
    res: Response,
    outputDir: string | null = null
): Promise<void> {
    const filteredStdout = filterDockerMessages(stdout || '');
    const filteredStderr = filterDockerMessages(stderr || '');
    const hasStdout = stdout && stdout.trim().length > 0;

    let images: ImageFile[] = [];
    if (outputDir) {
        try {
            images = await findImageFiles(outputDir);
        } catch (error) {
            console.error('[ERROR] Failed to find image files:', error);
        }
        try {
            await fs.rm(outputDir, { recursive: true, force: true });
        } catch (error) {
            console.error('[ERROR] Failed to cleanup output directory:', error);
        }
    }

    if (error) {
        let errorMsg: string;
        if ('killed' in error && error.killed || 'signal' in error && error.signal === 'SIGTERM') {
            errorMsg = 'Execution timeout exceeded.';
        } else {
            // Prioritize error.message if it exists and contains useful info, otherwise use stderr
            let errorSource: string;
            if ('message' in error && error.message && error.message !== 'Docker error') {
                errorSource = error.message;
            } else {
                errorSource = stderr || ('message' in error ? error.message || 'Unknown error' : 'Unknown error');
            }
            const sanitized = sanitizeError(errorSource);
            errorMsg = sanitizeErrorForUser(sanitized);
        }

        res.json({
            output: filteredStdout || '',
            error: errorMsg,
            executionTime,
            images
        });
        return;
    }

    let finalOutput = hasStdout ? filteredStdout : '';
    let finalError = '';

    if (!hasStdout && filteredStderr) {
        const isBuildSuccess = /Build succeeded/i.test(filteredStderr);
        const isBuildFailed = /Build FAILED/i.test(filteredStderr);
        const isWarningOnly =
            /warning/i.test(filteredStderr) && !/error/i.test(filteredStderr) && !isBuildFailed;

        if (isBuildSuccess || isWarningOnly) {
            finalOutput = '';
            finalError = '';
        } else {
            finalError = sanitizeErrorForUser(filteredStderr);
        }
    } else if (hasStdout) {
        finalError = '';
    } else {
        finalError = filteredStderr ? sanitizeErrorForUser(filteredStderr) : '';
    }

    res.json({
        output: finalOutput,
        error: finalError,
        executionTime,
        images
    });
}

interface ExecuteRequestBody {
    code?: unknown;
    language?: unknown;
    input?: unknown;
}

app.post('/api/execute', executeLimiter, async (req: Request<{}, {}, ExecuteRequestBody>, res: Response) => {
    const { code, language, input = '' } = req.body;
    let responseSent = false;

    const sendResponse = (statusCode: number, data: object): void => {
        if (!responseSent) {
            responseSent = true;
            res.status(statusCode).json(data);
        }
    };

    if (!code || !language) {
        return sendResponse(400, { error: 'Code and language are required' });
    }

    if (typeof code !== 'string' || typeof language !== 'string') {
        return sendResponse(400, { error: 'Invalid input format' });
    }

    if (code.length > CONFIG.MAX_CODE_LENGTH) {
        return sendResponse(400, {
            error: `Code exceeds maximum length of ${CONFIG.MAX_CODE_LENGTH} characters`
        });
    }

    if (!validateLanguage(language)) {
        return sendResponse(400, { error: 'Unsupported language' });
    }

    let inputText: string;
    if (typeof input === 'string') {
        inputText = input;
    } else if (input === null || input === undefined) {
        inputText = '';
    } else {
        inputText = String(input);
    }
    if (inputText.length > CONFIG.MAX_INPUT_LENGTH) {
        return sendResponse(400, {
            error: `Input exceeds maximum length of ${CONFIG.MAX_INPUT_LENGTH} characters`
        });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const codePath = path.join(codeDir, `${sessionId}_code`);
    let fullCodePath: string | null = null;
    let fullInputPath: string | null = null;

        try {
            sanitizeCode(code);
            
            // Parallelize file write and directory creation
            const sessionOutputDir = path.join(outputDir, sessionId);
            const [writtenPath] = await Promise.all([
                writeCodeFile(codePath, code, language),
                fs.mkdir(sessionOutputDir, { recursive: true })
            ]);
            fullCodePath = writtenPath;

            if (!validatePath(fullCodePath)) {
                throw new Error('Invalid file path generated');
            }

            // Verify file exists (non-blocking check)
            try {
                const stats = await fs.stat(fullCodePath);
                if (!stats.isFile()) {
                    throw new Error(`Path exists but is not a file: ${fullCodePath}`);
                }
                if (CONFIG.DEBUG_MODE) {
                    console.log(
                        `[DEBUG] File created successfully: ${fullCodePath}, size: ${stats.size} bytes`
                    );
                }
            } catch (error) {
                console.error(`[ERROR] File verification failed: ${fullCodePath}`, error);
                const err = error as Error;
                throw new Error(`Failed to create or verify code file: ${err.message}`);
            }

        let buildOptions: BuildOptions = {};
        if (language === 'kotlin') {
            if (!kotlinCompilerExistsOnHost()) {
                warmupKotlinOnStart().catch(() => {});
                await cleanupFile(fullCodePath);
                await fs.rm(sessionOutputDir, { recursive: true, force: true }).catch(() => {});
                return sendResponse(503, {
                    error: 'Kotlin compiler is not available yet. Warming up; please retry shortly.'
                });
            }
        }
        buildOptions.hasInput = !!(inputText && inputText.trim().length > 0);
        buildOptions.outputDirHost = sessionOutputDir;

        if (buildOptions.hasInput) {
            const inputPath = path.join(codeDir, `${sessionId}_input`);
            fullInputPath = await writeInputFile(inputPath, inputText);
            buildOptions.inputPath = fullInputPath;
            if (CONFIG.DEBUG_MODE) {
                console.log(
                    `[DEBUG] Input file created: ${fullInputPath}, size: ${inputText.length} bytes`
                );
            }
        }

        const config = LANGUAGE_CONFIGS[language];
        const startTime = Date.now();
        let executionResponseSent = false;

        await executeDockerProcess(
            language,
            fullCodePath,
            buildOptions,
            config,
            startTime,
            res,
            sessionOutputDir,
            fullInputPath,
            () => executionResponseSent,
            (value) => {
                executionResponseSent = value;
            }
        );
    } catch (error) {
        await cleanupFile(fullCodePath);
        if (fullInputPath) {
            await cleanupFile(fullInputPath);
        }
        const sanitizedError = sanitizeError(error);
        sendResponse(400, { error: sanitizedError });
    }
});

app.get('/api/health', healthLimiter, (_: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use((err: Error, _: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err.message || 'Unknown error');
    res.status(500).json({ error: 'Internal server error' });
});

ensureDirectories()
    .then(async () => {
        await warmupKotlinOnStart();
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers();
        }
    })
    .catch((e) => {
        console.error('Startup error:', e);
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on port ${CONFIG.PORT}`);
            if (CONFIG.ENABLE_PRELOAD) {
                preloadDockerImages();
            }
        });
        if (CONFIG.ENABLE_WARMUP) {
            warmupContainers();
        }
    });

