const TMP_INPUT_PATH = '/tmp/input.txt';
const TMP_DIR = '/tmp';
const REDIRECT_STDERR = '2>&1';

interface LanguageConfig {
    type: 'simple' | 'compiled' | 'custom';
    executor?: string;
    compileCmd?: string;
    runCmd?: string;
    envVars?: string[];
}

function buildInputRedirection(inputPath?: string): string {
    return inputPath ? `cp "${inputPath}" "${TMP_INPUT_PATH}" && ` : '';
}

function addInputRedirect(command: string, inputPath?: string): string {
    return inputPath ? `${command} < "${TMP_INPUT_PATH}"` : command;
}

function buildEnvString(envVars: string[] = []): string {
    return envVars.length > 0 ? envVars.join(' ') + ' && ' : '';
}

function buildCommand(config: LanguageConfig, path: string, inputPath?: string): string {
    const inputCopy = buildInputRedirection(inputPath);
    const envStr = buildEnvString(config.envVars);

    if (config.type === 'simple') {
        const baseCommand = `${envStr}${config.executor} "${path}"`;
        const command = addInputRedirect(baseCommand, inputPath);
        return `cd ${TMP_DIR} && ${inputCopy}${command} ${REDIRECT_STDERR}`;
    }

    if (config.type === 'compiled') {
        const compile = `${config.compileCmd} "${path}" ${REDIRECT_STDERR}`;
        const run = addInputRedirect(config.runCmd!, inputPath);
        return `cd ${TMP_DIR} && ${compile} && ${inputCopy}${envStr}${run} ${REDIRECT_STDERR}`;
    }

    throw new Error(`Unsupported command type: ${config.type}`);
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
    php: { type: 'simple', executor: 'php' },
    r: { type: 'simple', executor: 'Rscript' },
    ruby: { type: 'simple', executor: 'ruby' },
    perl: { type: 'simple', executor: 'perl' },
    bash: { type: 'simple', executor: 'bash' },
    go: {
        type: 'simple',
        executor: 'go run',
        envVars: ['export GOCACHE=/tmp/.cache/go-build', 'export HOME=/tmp']
    },
    typescript: {
        type: 'simple',
        executor: 'npx -y tsx',
        envVars: ['export HOME=/tmp', 'export npm_config_cache=/tmp/.npm']
    },
    swift: {
        type: 'simple',
        executor: 'swift',
        envVars: ['export HOME=/tmp']
    },
    java: {
        type: 'compiled',
        compileCmd: 'javac -J-XX:+TieredCompilation -J-XX:TieredStopAtLevel=1',
        runCmd: 'java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -cp /tmp Main'
    },
    cpp: {
        type: 'compiled',
        compileCmd: 'g++ -O1 -pipe -o /tmp/a.out',
        runCmd: '/tmp/a.out'
    },
    c: {
        type: 'compiled',
        compileCmd: 'gcc -O1 -pipe -o /tmp/a.out',
        runCmd: '/tmp/a.out'
    },
    rust: {
        type: 'compiled',
        compileCmd: 'rustc -C opt-level=1 -o /tmp/a.out',
        runCmd: '/tmp/a.out'
    },
    haskell: {
        type: 'compiled',
        compileCmd: 'ghc -o /tmp/a.out',
        runCmd: '/tmp/a.out'
    }
};

export function buildPythonCommand(path: string, inputPath?: string): string {
    const envVars = 'PYTHONUNBUFFERED=1';
    const python3Cmd = `python3 -u "${path}"`;
    const pythonCmd = `python -u "${path}"`;
    const inputCopy = buildInputRedirection(inputPath);

    const cmd = inputPath
        ? `${python3Cmd} < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR} || ${pythonCmd} < "${TMP_INPUT_PATH}" ${REDIRECT_STDERR}`
        : `${python3Cmd} ${REDIRECT_STDERR} || ${pythonCmd} ${REDIRECT_STDERR}`;

    return `cd ${TMP_DIR} && ${inputCopy}${envVars} ${cmd}`;
}

export function buildJavascriptCommand(path: string, inputPath?: string): string {
    return buildCommand({ type: 'simple', executor: 'node' }, path, inputPath);
}

export function buildCsharpCommand(path: string, inputPath?: string): string {
    const setup = 'rm -rf Program 2>/dev/null && dotnet new console -n Program --force';
    const build = 'cd Program && dotnet build -c Release --no-restore -nologo -v q';
    const exec = 'dotnet exec bin/Release/net*/Program.dll';
    const inputCopy = buildInputRedirection(inputPath);

    const execWithInput = inputPath ? `${exec} < "${TMP_INPUT_PATH}"` : exec;
    return `cd ${TMP_DIR} && ${setup} && cp ${path} Program/Program.cs && ${inputCopy}${build} && ${execWithInput} ${REDIRECT_STDERR}`;
}
export function buildJavaCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.java, path, inputPath);
}

export function buildCppCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.cpp, path, inputPath);
}

export function buildCCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.c, path, inputPath);
}

export function buildRustCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.rust, path, inputPath);
}

export function buildPhpCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.php, path, inputPath);
}

export function buildRCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.r, path, inputPath);
}

export function buildRubyCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.ruby, path, inputPath);
}

export function buildGoCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.go, path, inputPath);
}

export function buildTypescriptCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.typescript, path, inputPath);
}

export function buildSwiftCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.swift, path, inputPath);
}

export function buildPerlCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.perl, path, inputPath);
}

export function buildHaskellCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.haskell, path, inputPath);
}

export function buildBashCommand(path: string, inputPath?: string): string {
    return buildCommand(LANGUAGE_CONFIGS.bash, path, inputPath);
}
