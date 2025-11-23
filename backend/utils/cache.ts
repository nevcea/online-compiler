import { createHash } from 'crypto';
import { CONFIG } from '../config';

export interface CacheEntry {
    output?: string;
    error?: string;
    executionTime: number;
    images?: string[];
    timestamp: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
}

class ExecutionCache {
    private cache: Map<string, CacheEntry>;
    private stats: CacheStats;
    private readonly maxSize: number;
    private readonly ttl: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(maxSize: number = 1000, ttl: number = 60 * 60 * 1000) {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            evictions: 0
        };
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.startCleanup();
    }

    private generateKey(code: string, language: string, input: string): string {
        const normalizedCode = code.trim();
        const normalizedInput = input.trim();
        const data = `${language}:${normalizedCode}:${normalizedInput}`;
        return createHash('sha256').update(data).digest('hex');
    }

    private isExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp > this.ttl;
    }

    get(code: string, language: string, input: string): CacheEntry | null {
        if (!CONFIG.ENABLE_CACHE) {
            return null;
        }

        const key = this.generateKey(code, language, input);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size--;
            return null;
        }

        this.stats.hits++;
        return entry;
    }

    set(code: string, language: string, input: string, result: Omit<CacheEntry, 'timestamp'>): void {
        if (!CONFIG.ENABLE_CACHE) {
            return;
        }

        const resultSize = JSON.stringify(result).length;
        if (resultSize > 10 * 1024 * 1024) {
            return;
        }

        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const key = this.generateKey(code, language, input);
        const entry: CacheEntry = {
            ...result,
            timestamp: Date.now()
        };

        this.cache.set(key, entry);
        this.stats.size = this.cache.size;
    }

    private evictOldest(): void {
        if (this.cache.size === 0) {
            return;
        }

        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            this.stats.size = this.cache.size;
        }
    }

    private cleanup(): void {
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.stats.size = this.cache.size;
            if (CONFIG.DEBUG_MODE) {
                console.log(`[CACHE] Cleaned up ${cleaned} expired entries`);
            }
        }
    }

    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    getStats(): CacheStats & { hitRate: number; totalRequests: number } {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

        return {
            ...this.stats,
            hitRate,
            totalRequests
        };
    }

    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

function parseIntegerEnv(value: string | undefined, defaultValue: number, min: number, max: number): number {
    if (!value) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < min || parsed > max) {
        return defaultValue;
    }
    return parsed;
}

export const executionCache = new ExecutionCache(
    parseIntegerEnv(process.env.CACHE_MAX_SIZE, 1000, 100, 10000),
    parseIntegerEnv(process.env.CACHE_TTL_MS, 60 * 60 * 1000, 60 * 1000, 24 * 60 * 60 * 1000)
);

