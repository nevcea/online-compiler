import { Request, Response } from 'express';
import { executionQueue } from '../execution/executionQueue';
import { getResourceStats, formatBytes, formatUptime } from '../utils/resourceMonitor';
import { executionCache } from '../utils/cache';

export async function healthRoute(_: Request, res: Response): Promise<void> {
    const queueStatus = executionQueue.getStatus();
    const resourceStats = await getResourceStats();
    const cacheStats = executionCache.getStats();

    const response: any = {
        status: 'ok',
        queue: queueStatus,
        cache: {
            enabled: true,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`,
            size: cacheStats.size,
            evictions: cacheStats.evictions,
            totalRequests: cacheStats.totalRequests
        },
        resources: {
            memory: {
                used: formatBytes(resourceStats.memory.used),
                total: formatBytes(resourceStats.memory.total),
                percentage: resourceStats.memory.percentage,
                rss: formatBytes(resourceStats.memory.rss),
                external: formatBytes(resourceStats.memory.external)
            },
            uptime: formatUptime(resourceStats.uptime)
        },
        timestamp: new Date().toISOString()
    };

    if (resourceStats.disk) {
        response.resources.disk = {
            codeDir: {
                size: formatBytes(resourceStats.disk.codeDir.size),
                files: resourceStats.disk.codeDir.files,
                directories: resourceStats.disk.codeDir.directories
            },
            outputDir: {
                size: formatBytes(resourceStats.disk.outputDir.size),
                files: resourceStats.disk.outputDir.files,
                directories: resourceStats.disk.outputDir.directories
            }
        };
    }

    res.json(response);
}

