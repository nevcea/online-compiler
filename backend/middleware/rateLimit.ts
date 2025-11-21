import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { parseIntegerEnv } from '../utils/envValidation';

const MAX_EXECUTIONS_PER_MINUTE = parseIntegerEnv(process.env.MAX_EXECUTIONS_PER_MINUTE, 20, 1, 1000);
const MAX_EXECUTIONS_PER_HOUR = parseIntegerEnv(process.env.MAX_EXECUTIONS_PER_HOUR, 100, 1, 10000);

export const executeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: MAX_EXECUTIONS_PER_MINUTE,
    message: {
        error: 'Too many execution requests. Please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many execution requests. Please try again later.',
            retryAfter: '1 minute',
            limit: MAX_EXECUTIONS_PER_MINUTE,
            window: '1 minute'
        });
    }
});

export const executeHourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: MAX_EXECUTIONS_PER_HOUR,
    message: {
        error: 'Hourly execution limit exceeded. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Hourly execution limit exceeded. Please try again later.',
            retryAfter: '1 hour',
            limit: MAX_EXECUTIONS_PER_HOUR,
            window: '1 hour'
        });
    }
});

export const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

