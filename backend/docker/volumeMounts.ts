import path from 'path';
import { CONFIG } from '../config';
import { BuildOptions } from '../types';
import { convertToDockerPath, validateDockerPath } from '../utils/pathUtils';
import { createLogger } from '../utils/logger';

const logger = createLogger('VolumeMounts');

function validateAndConvertPath(hostPath: string, pathName: string): string {
    const dockerPath = convertToDockerPath(hostPath);
    if (!validateDockerPath(dockerPath)) {
        const error = new Error(`Invalid Docker ${pathName} path: ${dockerPath}`);
        logger.error(`Invalid ${pathName}`, { dockerPath, hostPath });
        throw error;
    }
    return dockerPath;
}

export function addVolumeMount(
    volumeMounts: string[],
    hostPath: string,
    containerPath: string,
    pathName: string,
    mode: 'ro' | 'rw' = 'ro'
): void {
    const dockerPath = validateAndConvertPath(hostPath, pathName);
    volumeMounts.push('-v', `${dockerPath}:${containerPath}:${mode}`);
}

export function buildVolumeMounts(
    hostCodePath: string,
    opts: BuildOptions,
    language: string,
    kotlinCacheDir?: string
): string[] {
    const volumeMounts: string[] = [];
    const hostCodeDir = path.dirname(hostCodePath);

    if (CONFIG.DEBUG_MODE) {
        const hostFileName = path.basename(hostCodePath);
        const dockerHostDir = validateAndConvertPath(hostCodeDir, 'host directory');
        const mountedFilePath = `/code/${hostFileName}`;
        logger.debug('File paths', {
            hostCodePath,
            hostCodeDir,
            hostFileName,
            dockerHostDir,
            mountedFilePath
        });
    }

    addVolumeMount(volumeMounts, hostCodeDir, '/code', 'code directory', 'ro');

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        logger.debug('Input file paths', { hostInputPath: opts.inputPath, hostInputDir });
        addVolumeMount(volumeMounts, hostInputDir, '/input', 'input directory', 'ro');
    }

    if (language === 'kotlin' && kotlinCacheDir) {
        addVolumeMount(volumeMounts, kotlinCacheDir, '/opt/kotlin', 'Kotlin cache directory', 'rw');
    }

    if (opts.outputDirHost) {
        addVolumeMount(volumeMounts, opts.outputDirHost, '/output', 'output directory', 'rw');
    }

    return volumeMounts;
}
