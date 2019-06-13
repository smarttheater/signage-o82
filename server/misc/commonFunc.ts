import { Request, Response } from 'express';
import { catchErrorLogger } from '../logger/winston';

export const errorResponseHandler = (printMessage: boolean, req: Request, res: Response, e: { code?: number; message: string }) => {
    if (e.code) {
        return res.status(e.code).send(e.message);
    }
    catchErrorLogger.error(`[${req.originalUrl}] ${e.message}`);
    return res.status(500).send(`[${req.route.path}] internal server error${printMessage || process.env.NODE_ENV !== 'production' ? `: ${e.message}` : '.'}`);
};
