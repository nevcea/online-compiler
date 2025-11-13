import { Request, Response } from 'express';

export function healthRoute(_: Request, res: Response): void {
    res.json({ status: 'ok' });
}

