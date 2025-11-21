export function parseIntegerEnv(envVar: string | undefined, defaultValue: number, min?: number, max?: number): number {
    if (!envVar) {
        return defaultValue;
    }
    const parsed = parseInt(envVar, 10);
    if (isNaN(parsed)) {
        console.warn(`Invalid integer value for environment variable, using default: ${defaultValue}`);
        return defaultValue;
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Environment variable must be >= ${min}, got: ${parsed}`);
    }
    if (max !== undefined && parsed > max) {
        throw new Error(`Environment variable must be <= ${max}, got: ${parsed}`);
    }
    return parsed;
}

export function parseBooleanEnv(envVar: string | undefined, defaultValue: boolean): boolean {
    if (!envVar) {
        return defaultValue;
    }
    return envVar.toLowerCase() === 'true';
}

export function validateMemorySize(value: string): void {
    const memoryRegex = /^(\d+)([kmg]?)$/i;
    if (!memoryRegex.test(value)) {
        throw new Error(`Invalid memory size format: ${value}. Expected format: <number>[k|m|g]`);
    }
}

export function validateCpuPercent(value: string): void {
    const cpu = parseFloat(value);
    if (isNaN(cpu) || cpu <= 0 || cpu > 100) {
        throw new Error(`Invalid CPU percent: ${value}. Must be between 0 and 100`);
    }
}

