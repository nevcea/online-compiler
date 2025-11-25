type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const isDebugMode = (): boolean => {
    return process.env.DEBUG === 'true';
};

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

const LEVEL_COLORS: Record<LogLevel, string> = {
    DEBUG: COLORS.gray,
    INFO: COLORS.green,
    WARN: COLORS.yellow,
    ERROR: COLORS.red
};

class Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const levelColor = LEVEL_COLORS[level];
        const contextColor = COLORS.cyan;

        return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${levelColor}[${level.padEnd(5).trim()}]${COLORS.reset} ${contextColor}[${this.context}]${COLORS.reset} ${message}`;
    }

    /**
     * 디버그 로그: CONFIG.DEBUG_MODE가 true일 때만 출력됩니다.
     * 객체나 메타데이터를 함께 전달하면 보기 좋게 포맷팅하여 출력합니다.
     */
    debug(message: string, meta?: any): void {
        if (!isDebugMode()) {
            return; // Early return to avoid unnecessary work
        }
        const formattedMessage = this.formatMessage('DEBUG', message);
        if (meta !== undefined) {
            console.log(formattedMessage, '\n', COLORS.gray + JSON.stringify(meta, null, 2) + COLORS.reset);
        } else {
            console.log(formattedMessage);
        }
    }

    info(message: string, meta?: any): void {
        const formattedMessage = this.formatMessage('INFO', message);
        if (meta !== undefined) {
            console.log(formattedMessage, '\n', JSON.stringify(meta, null, 2));
        } else {
            console.log(formattedMessage);
        }
    }

    warn(message: string, meta?: any): void {
        const formattedMessage = this.formatMessage('WARN', message);
        if (meta !== undefined) {
            console.warn(formattedMessage, '\n', COLORS.yellow + JSON.stringify(meta, null, 2) + COLORS.reset);
        } else {
            console.warn(formattedMessage);
        }
    }

    error(message: string, error?: unknown): void {
        const formattedMessage = this.formatMessage('ERROR', message);
        if (error) {
            console.error(formattedMessage, '\n', error);
        } else {
            console.error(formattedMessage);
        }
    }
}

/**
 * 각 모듈에서 사용할 로거 인스턴스를 생성합니다.
 * 예: const logger = createLogger('ExecutionService');
 */
export const createLogger = (context: string) => new Logger(context);
