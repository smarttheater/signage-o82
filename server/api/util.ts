import { Request, Response, Router } from 'express';
import { checkUserAuth } from '../middleware/checkUserAuth';
import { clientLogger } from '../logger/winston';
import { errorResponseHandler } from '../misc/commonFunc';
import { SERVER_REQUIRED_ENV_KEY_ARRAY, ENUM_SOCKETIO_EVENT_NAMES } from '../Constants';

// 強制リロード命令
const emitForceReloadBySocket = async (req: Request, res: Response) => {
    try {
        req.io.emit(ENUM_SOCKETIO_EVENT_NAMES.RELOAD_REQUIRED);
        return res.send('emitted');
    } catch (e) {
        return errorResponseHandler(true, req, res, e);
    }
};

// フロント用に環境変数のCONFIG値を出力
const getEnvConfigContoller = (_: Request, res: Response) => {
    return res.json(
        SERVER_REQUIRED_ENV_KEY_ARRAY.filter((key: string) => {
            return key.indexOf('CONFIG_') === 0;
        }).reduce((ret, key) => {
            ret[key] = process.env[key];
            return ret;
        }, {}),
    );
};

// フロント用ロガー
const clientLoggerContoller = (req: Request, res: Response) => {
    try {
        clientLogger.info(`[${req.ip}]${req.body.message}`);
        return res.json({ success: true });
    } catch (e) {
        return errorResponseHandler(true, req, res, e);
    }
};

const router = Router();
router.post('/forceReload', checkUserAuth({ isAdminRealm: true }), emitForceReloadBySocket);
router.post('/getEnvConfig', checkUserAuth(), getEnvConfigContoller);
router.post('/logger', clientLoggerContoller);
export const utilApiRouter = router;
