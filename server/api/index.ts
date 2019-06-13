import { Router } from 'express';
import { statusApiRouter } from './status';
import { authApiRouter } from './auth';
import { utilApiRouter } from './util';

const router = Router();

// 認証API
router.use('/auth', authApiRouter);

// ステータスAPI
router.use('/status', statusApiRouter);

// Utility
router.use('/util', utilApiRouter);

// 404
router.use((_, res) => {
    return res.status(404).send('404');
});

export const ApiRouter = router;
