export interface ErrorMapping {
    pattern: string | RegExp;
    messageKey: string;
}

const NETWORK_ERROR_PATTERNS: ErrorMapping[] = [
    { pattern: /failed to fetch|network/i, messageKey: 'cannot-connect-server' },
    { pattern: /timeout/i, messageKey: 'request-timeout' },
    { pattern: /400/i, messageKey: 'bad-request' },
    { pattern: /500/i, messageKey: 'server-error' }
];

export function extractErrorMessage(error: unknown, t: (key: string) => string): string {
    if (!(error instanceof Error) || !error.message) {
        return t('connection-error');
    }

    const httpMatch = error.message.match(/HTTP \d+: (.+)/);
    if (httpMatch && httpMatch[1]) {
        return httpMatch[1];
    }

    const errorMessage = error.message.toLowerCase();
    for (const mapping of NETWORK_ERROR_PATTERNS) {
        const pattern = typeof mapping.pattern === 'string'
            ? new RegExp(mapping.pattern, 'i')
            : mapping.pattern;

        if (pattern.test(errorMessage)) {
            return t(mapping.messageKey);
        }
    }

    return t('connection-error');
}

