import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getContainerMemoryUsage(containerId: string): Promise<number | null> {
    try {
        const { stdout } = await execAsync(
            `docker stats --no-stream --format "{{.MemUsage}}" ${containerId}`
        );

        const match = stdout.trim().match(/([\d.]+)\s*(MiB|MB|KiB|KB|GiB|GB)/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];

            let kbValue = value;
            if (unit === 'MiB' || unit === 'MB') {
                kbValue = value * 1024;
            } else if (unit === 'GiB' || unit === 'GB') {
                kbValue = value * 1024 * 1024;
            } else if (unit === 'KiB' || unit === 'KB') {
                kbValue = value;
            }

            return Math.round(kbValue);
        }

        return null;
    } catch {
        return null;
    }
}

export async function getContainerMemoryFromInspect(containerId: string): Promise<number | null> {
    try {
        const { stdout } = await execAsync(
            `docker inspect --format='{{.State.Status}}' ${containerId}`
        );

        if (stdout.trim() !== 'running') {
            return null;
        }

        const { stdout: statsOutput } = await execAsync(
            `docker stats --no-stream --format "{{.MemUsage}}" ${containerId}`
        );

        const match = statsOutput.trim().match(/([\d.]+)\s*(MiB|MB|KiB|KB|GiB|GB)/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];

            let kbValue = value;
            if (unit === 'MiB' || unit === 'MB') {
                kbValue = value * 1024;
            } else if (unit === 'GiB' || unit === 'GB') {
                kbValue = value * 1024 * 1024;
            }

            return Math.round(kbValue);
        }

        return null;
    } catch {
        return null;
    }
}

