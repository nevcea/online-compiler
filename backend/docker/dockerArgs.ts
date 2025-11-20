import path from 'path';
import {
    CONFIG,
    TMPFS_SIZES,
    CONTAINER_CODE_PATHS,
    LANGUAGE_EXTENSIONS,
    LANGUAGE_CONFIGS,
    CPU_LIMITS
} from '../config';
import { BuildOptions } from '../types';
import { validateLanguage, validateImage } from '../utils/validation';
import { convertToDockerPath, getContainerCodePath, validateDockerPath } from '../utils/pathUtils';
import { normalizePath } from '../utils/pathUtils';

function validateAndConvertPath(hostPath: string, pathName: string): string {
    const dockerPath = convertToDockerPath(hostPath);
    try {
        validateDockerPath(dockerPath, pathName);
    } catch (error) {
        console.error(`[ERROR] Invalid ${pathName}: "${dockerPath}" from hostPath: "${hostPath}"`);
        throw error;
    }
    return dockerPath;
}

function addVolumeMount(
    volumeMounts: string[],
    hostPath: string,
    containerPath: string,
    pathName: string,
    mode: 'ro' | 'rw' = 'ro'
): void {
    const dockerPath = validateAndConvertPath(hostPath, pathName);
    volumeMounts.push('-v', `${dockerPath}:${containerPath}:${mode}`);
}

function buildFileCopyCommand(
    mountedFilePath: string,
    containerPath: string,
    includeInputCheck: boolean,
    inputBasename?: string
): string {
    const inputFileCheck = includeInputCheck && inputBasename
        ? !CONFIG.DEBUG_MODE
            ? `test -f "/input/${inputBasename}" || (echo "ERROR: Input file not found" >&2 && exit 1) && `
            : `echo "[DEBUG] Checking input file: /input/${inputBasename}" >&2 && if [ ! -f "/input/${inputBasename}" ]; then echo "ERROR: Input file not found: /input/${inputBasename}" >&2; ls -la /input >&2; exit 1; fi && `
        : '';

    const fileCopy = !CONFIG.DEBUG_MODE
        ? `test -f "${mountedFilePath}" || (echo "ERROR: Source file not found" >&2 && exit 1) && cp "${mountedFilePath}" "${containerPath}" && test -f "${containerPath}" || (echo "ERROR: Copy failed" >&2 && exit 1) && `
        : `echo "[DEBUG] Checking source file: ${mountedFilePath}" >&2 && if [ ! -f "${mountedFilePath}" ]; then echo "ERROR: Source file not found: ${mountedFilePath}" >&2; ls -la /code >&2; exit 1; fi && echo "[DEBUG] Copying file to ${containerPath}" >&2 && cp "${mountedFilePath}" "${containerPath}" && echo "[DEBUG] Verifying copied file" >&2 && if [ ! -f "${containerPath}" ]; then echo "ERROR: Destination file not found after copy: ${containerPath}" >&2; ls -la /tmp >&2; exit 1; fi && if [ ! -s "${containerPath}" ]; then echo "ERROR: Destination file is empty: ${containerPath}" >&2; exit 1; fi && echo "[DEBUG] File copy successful" >&2 && `;

    return `${inputFileCheck}${fileCopy}`;
}

export function buildDockerArgs(
    language: string,
    hostCodePath: string,
    opts: BuildOptions = {},
    kotlinCacheDir?: string
): string[] {
    if (!validateLanguage(language)) {
        throw new Error('Invalid language');
    }

    const normalized = normalizePath(hostCodePath);
    if (!normalized) {
        throw new Error('Invalid code path');
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config || !validateImage(config.image)) {
        throw new Error('Invalid language configuration');
    }

    const extension = LANGUAGE_EXTENSIONS[language];
    const containerPath = getContainerCodePath(language, extension, CONTAINER_CODE_PATHS);
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

    const args: string[] = [
        'run', '--rm',
        `--memory=${CONFIG.MAX_MEMORY}`,
        `--cpus=${language === 'kotlin' ? CONFIG.MAX_CPU_PERCENT_KOTLIN : CPU_LIMITS[language] || CONFIG.MAX_CPU_PERCENT}`
    ];

    if (language !== 'typescript' && language !== 'bash') {
        args.push('--network=none');
    }

    args.push(
        '--read-only',
        '--tmpfs', `/tmp:rw,exec,nosuid,size=${tmpfsSize},noatime`,
        '--cap-drop=ALL',
        '--security-opt', 'no-new-privileges',
        '--pids-limit=128',
        '--ulimit', 'nofile=1024:1024',
        '--user', '1000:1000'
    );

    const hostCodeDir = path.dirname(hostCodePath);
    const hostFileName = path.basename(hostCodePath);
    const dockerHostDir = validateAndConvertPath(hostCodeDir, 'host directory');
    const mountedFilePath = `/code/${hostFileName}`;

    if (CONFIG.DEBUG_MODE) {
        console.log(
            `[DEBUG] File paths: hostCodePath=${hostCodePath}, hostCodeDir=${hostCodeDir}, hostFileName=${hostFileName}, dockerHostDir=${dockerHostDir}, mountedFilePath=${mountedFilePath}`
        );
    }

    const volumeMounts: string[] = [];
    addVolumeMount(volumeMounts, hostCodeDir, '/code', 'code directory', 'ro');

    if (opts.inputPath) {
        const hostInputDir = path.dirname(opts.inputPath);
        if (CONFIG.DEBUG_MODE) {
            console.log(`[DEBUG] Input file paths: hostInputPath=${opts.inputPath}, hostInputDir=${hostInputDir}`);
        }
        addVolumeMount(volumeMounts, hostInputDir, '/input', 'input directory', 'ro');
    }

    if (language === 'kotlin' && kotlinCacheDir) {
        addVolumeMount(volumeMounts, kotlinCacheDir, '/opt/kotlin', 'Kotlin cache directory', 'rw');
    }

    if (opts.outputDirHost) {
        addVolumeMount(volumeMounts, opts.outputDirHost, '/output', 'output directory', 'rw');
    }

    args.push(...volumeMounts);

    if (language === 'csharp') {
        args.push('-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'NUGET_PACKAGES=/tmp/.nuget', '-w', '/tmp');
    }

    const inputBasename = opts.inputPath ? path.basename(opts.inputPath) : undefined;
    const fileCopyCommand = buildFileCopyCommand(mountedFilePath, containerPath, !!opts.inputPath, inputBasename);
    args.push(config.image, 'sh', '-c', `${fileCopyCommand}${command}`);

    return args;
}

