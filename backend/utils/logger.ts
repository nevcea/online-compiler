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

    debug(message: string, meta?: any): void {
        if (!isDebugMode()) {
            return;
        }
        const formattedMessage = this.formatMessage('DEBUG', message);
        if (meta !== undefined) {
            console.log('%s', formattedMessage, '\n', COLORS.gray + JSON.stringify(meta, null, 2) + COLORS.reset);
        } else {
            console.log('%s', formattedMessage);
        }
    }

    info(message: string, meta?: any): void {
        const formattedMessage = this.formatMessage('INFO', message);
        if (meta !== undefined) {
            console.log('%s', formattedMessage, '\n', JSON.stringify(meta, null, 2));
        } else {
            console.log('%s', formattedMessage);
        }
    }

    warn(message: string, meta?: any): void {
        const formattedMessage = this.formatMessage('WARN', message);
        if (meta !== undefined) {
            console.warn('%s', formattedMessage, '\n', COLORS.yellow + JSON.stringify(meta, null, 2) + COLORS.reset);
        } else {
            console.warn('%s', formattedMessage);
        }
    }

    error(message: string, error?: unknown): void {
        const formattedMessage = this.formatMessage('ERROR', message);
        if (error) {
            console.error('%s', formattedMessage, '\n', error);
        } else {
            console.error('%s', formattedMessage);
        }
    }
}

export const createLogger = (context: string) => new Logger(context);
