import { Request, Response } from 'express';
import { getMetrics, register } from '../utils/metrics';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsRoute');

export async function metricsRoute(_: Request, res: Response): Promise<void> {
    try {
        const metrics = await getMetrics();
        res.set('Content-Type', register.contentType);
        res.send(metrics);
    } catch (error) {
        logger.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
}

