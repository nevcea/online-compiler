import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';
import { sanitizeError } from '../utils/errorHandling';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function safeSendErrorResponse(res: Response, statusCode: number, error: string): boolean {
    if (res.headersSent) {
        console.error('[ERROR] Cannot send error response: headers already sent', { statusCode, error });
        return false;
    }
    try {
        res.status(statusCode).json({ error });
        return true;
    } catch (err) {
        console.error('[ERROR] Failed to send error response:', err);
        return false;
    }
}

export function errorHandler(err: AppError | Error, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        console.error('[ERROR] Error occurred after response was sent:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
        return next(err);
    }

    const statusCode = 'statusCode' in err && err.statusCode ? err.statusCode : 500;

    let errorMessage: string;
    if (statusCode >= 500) {
        errorMessage = 'Internal server error';
        console.error('[ERROR] Internal server error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
    } else {
        errorMessage = sanitizeError(err.message || 'An error occurred');
        if (CONFIG.DEBUG_MODE) {
            console.warn('[WARN] Client error:', {
                error: err.message,
                path: req.path,
                method: req.method,
                statusCode
            });
        }
    }

    safeSendErrorResponse(res, statusCode, errorMessage);
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        return next();
    }
    safeSendErrorResponse(res, 404, 'Endpoint not found');
}

