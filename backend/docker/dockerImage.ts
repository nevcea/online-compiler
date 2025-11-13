import { exec } from 'child_process';
import { promisify } from 'util';
import { CONFIG, LANGUAGE_CONFIGS } from '../config';
import { ImageCacheEntry, PullResult } from '../types';
import { validateImage } from '../utils/validation';

const imageExistenceCache = new Map<string, ImageCacheEntry>();
const IMAGE_CACHE_TTL = 5 * 60 * 1000;

export async function checkImageExists(image: string): Promise<boolean> {
    if (!validateImage(image)) {
        return false;
    }
    
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

export async function pullDockerImage(image: string, retries: number = CONFIG.DOCKER_PULL_RETRIES): Promise<PullResult> {
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

export async function preloadDockerImages(): Promise<void> {
    const { isDockerAvailable } = await import('./dockerClient');
    
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

