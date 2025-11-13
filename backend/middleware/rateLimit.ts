import rateLimit from 'express-rate-limit';

export const executeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many execution requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

export const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

